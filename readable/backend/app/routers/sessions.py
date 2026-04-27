import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.core.redis import cache_json, delete_cached_value, get_cached_json
from app.models import EyeTrackingFeature, PersonalizedContent, Session, SessionResult, StudentProfile, User, VoiceFeature
from app.models.session import SessionStatus, SessionType
from app.schemas.lesson import PersonalizedContentResponse
from app.schemas.lesson import PhoneticSupportWordResponse
from app.schemas.session import (
    DiagnosticStartResponse,
    DiagnosticSubmitResponse,
    EyeMetricsPayload,
    FocusedWordHit,
    ReadingStartRequest,
    ReadingStartResponse,
    ReadingSubmitResponse,
    SessionResultPayload,
    VoiceMetricsPayload,
)
from app.services.content import DIAGNOSTIC_PASSAGE
from app.services.dyslexia_profile_inference import (
    build_profiler_features,
    predict_profile_scores,
)
from app.services import eye_tracker, nlp, stt, voice_features, llm
from app.services.eye_features import extract_eye_tracking_metrics
from app.services.profile import build_profile_response, create_or_update
from app.services.progress import create_progress_entry
from app.services.review_generator import generate_diagnostic_review
from app.services.voice_features import extract_voice_metrics, get_audio_duration


router = APIRouter()


@router.post("/diagnostic/start", response_model=DiagnosticStartResponse)
async def start_diagnostic(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> DiagnosticStartResponse:
    session = Session(
        student_id=current_user.id,
        session_type=SessionType.diagnostic,
        status=SessionStatus.active.value,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    await cache_json(
        _session_key(session.id),
        {"expected_text": DIAGNOSTIC_PASSAGE, "session_type": SessionType.diagnostic.value},
    )
    return DiagnosticStartResponse(session_id=session.id, expected_text=DIAGNOSTIC_PASSAGE)


@router.post("/diagnostic/submit", response_model=DiagnosticSubmitResponse)
async def submit_diagnostic(
    session_id: int = Form(...),
    eye_tracking_payload: str = Form(default="{}"),
    audio_file: UploadFile = File(...),
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> DiagnosticSubmitResponse:
    return await _submit_session(
        db=db,
        current_user=current_user,
        session_id=session_id,
        eye_tracking_payload=eye_tracking_payload,
        expected_text_hint="",
        personalized_content_id=None,
        audio_file=audio_file,
        expected_session_type=SessionType.diagnostic,
        create_progress=False,
    )


@router.post("/reading/start", response_model=ReadingStartResponse)
async def start_reading(
    payload: ReadingStartRequest,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> ReadingStartResponse:
    result = await db.execute(
        select(PersonalizedContent).where(
            PersonalizedContent.id == payload.personalized_content_id,
            PersonalizedContent.student_id == current_user.id,
        )
    )
    personalized = result.scalar_one_or_none()
    if personalized is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Personalized content not found"
        )

    segments = [str(segment) for segment in personalized.adapted_content.get("segments", [])]
    expected_text = " ".join(segments)

    session = Session(
        student_id=current_user.id,
        session_type=SessionType.reading,
        status=SessionStatus.active.value,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    await cache_json(
        _session_key(session.id),
        {
            "expected_text": expected_text,
            "session_type": SessionType.reading.value,
            "personalized_content_id": personalized.id,
        },
    )

    return ReadingStartResponse(
        session_id=session.id,
        content=PersonalizedContentResponse(
            id=personalized.id,
            lesson_id=personalized.lesson_id,
            student_id=personalized.student_id,
            segments=segments,
            syllable_breaks=personalized.syllable_breaks,
            phonetic_support={
                key: PhoneticSupportWordResponse(**value)
                for key, value in personalized.adapted_content.get("phonetic_support", {}).items()
                if isinstance(value, dict)
            },
            font_size=personalized.font_size,
            line_spacing=personalized.spacing,
            chunk_size=personalized.chunk_size,
            created_at=personalized.created_at,
        ),
    )


@router.post("/reading/submit", response_model=ReadingSubmitResponse)
async def submit_reading(
    session_id: int = Form(...),
    eye_tracking_payload: str = Form(default="{}"),
    expected_text: str = Form(default=""),
    personalized_content_id: int | None = Form(default=None),
    audio_file: UploadFile = File(...),
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> ReadingSubmitResponse:
    response = await _submit_session(
        db=db,
        current_user=current_user,
        session_id=session_id,
        eye_tracking_payload=eye_tracking_payload,
        expected_text_hint=expected_text,
        personalized_content_id=personalized_content_id,
        audio_file=audio_file,
        expected_session_type=SessionType.reading,
        create_progress=True,
    )
    return ReadingSubmitResponse(
        result=response["result"],
        profile=response["profile"],
        progress_entry_id=response["progress_entry_id"],
    )


async def _submit_session(
    db: AsyncSession,
    current_user: User,
    session_id: int,
    eye_tracking_payload: str,
    expected_text_hint: str,
    personalized_content_id: int | None,
    audio_file: UploadFile,
    expected_session_type: SessionType,
    create_progress: bool,
) -> DiagnosticSubmitResponse | dict[str, object]:

    # ✅ ALWAYS initialize (prevents UnboundLocalError)
    model_profile_scores = {}
    eye_metrics = {}
    voice_metrics = {}
    eye_result = {}
    spoken_text = ""
    nlp_result = {"errors": [], "speed_wpm": 0, "hesitation_points": []}

    payload = await get_cached_json(_session_key(session_id))

    if payload is None:
        if expected_session_type == SessionType.diagnostic:
            payload = {
                "expected_text": DIAGNOSTIC_PASSAGE,
                "session_type": SessionType.diagnostic.value,
            }
        else:
            payload = await _recover_reading_payload(
                db=db,
                student_id=current_user.id,
                personalized_content_id=personalized_content_id,
                expected_text_hint=expected_text_hint,
            )
            if payload is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session cache not found.",
                )

    session_result = await db.execute(
        select(Session).where(Session.id == session_id, Session.student_id == current_user.id)
    )
    session = session_result.scalar_one_or_none()

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.session_type != expected_session_type:
        raise HTTPException(status_code=400, detail="Invalid session type")

    existing_result = await db.execute(
        select(SessionResult).where(SessionResult.session_id == session_id)
    )
    existing = existing_result.scalar_one_or_none()

    if existing is not None:
        if expected_session_type == SessionType.diagnostic:
            profile = await build_profile_response(db, current_user.id)
            return DiagnosticSubmitResponse(
                result=await _result_payload_from_existing(db, session, existing),
                profile=profile,
            )
        raise HTTPException(status_code=400, detail="Session already submitted")

    # ---------------------------
    # 🔹 DATA PREP
    # ---------------------------

    eye_payload = _parse_eye_payload(eye_tracking_payload)

    expected_text = str(payload["expected_text"])
    expected_word_count = len(expected_text.split())

    stt.prime_expected_text(expected_text)
    audio_bytes = await audio_file.read()

    # ---------------------------
    # 🔹 SAFE AUDIO LOAD
    # ---------------------------

    try:
        audio_signal, sample_rate = voice_features.load_audio(audio_bytes)
    except Exception as e:
        print("Audio load error:", e)
        audio_signal, sample_rate = None, None

    # ---------------------------
    # 🔹 PARALLEL TASKS
    # ---------------------------

    eye_payload["expected_word_count"] = expected_word_count
    spoken_result, eye_result_candidate = await asyncio.gather(
        stt.transcribe(audio_bytes),
        eye_tracker.analyze(eye_payload),
        return_exceptions=True,
    )
    if isinstance(spoken_result, Exception):
        print("STT error:", spoken_result)
        spoken_text = ""
    else:
        spoken_text = spoken_result

    if isinstance(eye_result_candidate, Exception):
        print("Eye analysis error:", eye_result_candidate)
        eye_result = {}
    else:
        eye_result = eye_result_candidate

    # ---------------------------
    # 🔹 NLP ANALYSIS
    # ---------------------------

    try:
        duration = voice_features.get_audio_duration(
            audio_bytes,
            signal=audio_signal,
            sr=sample_rate
        )

        nlp_result = await nlp.compare_texts(
            spoken_text,
            expected_text,
            duration_seconds=duration
        )
    except Exception as e:
        print("NLP error:", e)
        duration = 0.0
        nlp_result = {"errors": [], "speed_wpm": 0, "hesitation_points": []}

    accuracy_pct = _accuracy_pct(expected_text, nlp_result["errors"])

    # ---------------------------
    # 🔹 METRICS EXTRACTION
    # ---------------------------

    try:
        focus_events = eye_payload.get("focus_events", [])
        eye_metrics = extract_eye_tracking_metrics(
            focus_events=focus_events if isinstance(focus_events, list) else [],
            expected_word_count=expected_word_count,
        )
    except Exception as e:
        print("Eye metrics error:", e)
        eye_metrics = {
            "fixation_duration_ms": 0,
            "saccade_length": 0,
            "regression_count": 0,
            "skipped_words": 0,
            "reading_speed_wpm": 0,
        }

    try:
        voice_metrics = extract_voice_metrics(
            spoken_text=spoken_text,
            expected_text=expected_text,
            errors=nlp_result["errors"],
            speed_wpm=float(nlp_result["speed_wpm"]),
            audio_bytes=audio_bytes,
            audio_signal=audio_signal,
            sample_rate=sample_rate,
        )
    except Exception as e:
        print("Voice metrics error:", e)
        voice_metrics = {
            "speech_rate_wps": 0,
            "pause_duration_ms": 0,
            "pause_frequency": 0,
            "mispronunciation_rate": 0,
            "repetition_rate": 0,
        }

    # ---------------------------
    # 🔹 ML PROFILE INFERENCE (SAFE)
    # ---------------------------

    try:
        profiler_features = build_profiler_features(
            eye_metrics=eye_metrics,
            voice_metrics=voice_metrics,
            expected_word_count=expected_word_count,
            audio_bytes=audio_bytes,
            audio_signal=audio_signal,
            sample_rate=sample_rate,
        )

        model_profile_scores = await llm.get_profile_scores(
            features=profiler_features,
            expected_text=expected_text,
            spoken_text=spoken_text
        ) or {}

    except Exception as e:
        print("GROQ SCORING ERROR:", e)
        model_profile_scores = {}

    # ---------------------------
    # 🔹 GENERATE REVIEW (LLM)
    # ---------------------------

    student_name = current_user.email.split("@")[0].replace(".", " ").title() if current_user.email else None
    
    profile_result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    student_profile = profile_result.scalar_one_or_none()
    reading_level = student_profile.reading_level if student_profile else None

    review_text = await generate_diagnostic_review(
        accuracy_pct=accuracy_pct,
        speed_wpm=float(nlp_result["speed_wpm"]),
        model_profile_scores=model_profile_scores,
        student_name=student_name,
        reading_level=reading_level,
    )

    # ---------------------------
    # 🔹 SAVE RESULT
    # ---------------------------

    result_model = SessionResult(
        session_id=session.id,
        spoken_text=spoken_text,
        expected_text=expected_text,
        errors=nlp_result["errors"],
        speed_wpm=float(nlp_result["speed_wpm"]),
        hesitation_points=nlp_result["hesitation_points"],
        eye_tracking_data={
            **eye_result,
            "sample_count": int(eye_payload.get("sample_count", 0) or 0),
            "focused_word_hits": eye_payload.get("focused_word_hits", []),
        },
        accuracy_pct=accuracy_pct,
        model_profile_scores=model_profile_scores,
        review_text=review_text,
    )
    db.add(result_model)

    # ---------------------------
    # 🔹 SAVE FEATURES
    # ---------------------------

    db.add(
        EyeTrackingFeature(
            student_id=current_user.id,
            session_id=session.id,
            fixation_duration_ms=eye_metrics.get("fixation_duration_ms", 0),
            saccade_length=eye_metrics.get("saccade_length", 0),
            regression_count=eye_metrics.get("regression_count", 0),
            skipped_words=eye_metrics.get("skipped_words", 0),
            reading_speed_wpm=eye_metrics.get("reading_speed_wpm", 0),
        )
    )

    db.add(
        VoiceFeature(
            student_id=current_user.id,
            session_id=session.id,
            speech_rate_wps=voice_metrics.get("speech_rate_wps", 0),
            pause_duration_ms=voice_metrics.get("pause_duration_ms", 0),
            pause_frequency=voice_metrics.get("pause_frequency", 0),
            mispronunciation_rate=voice_metrics.get("mispronunciation_rate", 0),
            repetition_rate=voice_metrics.get("repetition_rate", 0),
        )
    )

    session.status = SessionStatus.completed.value
    session.ended_at = datetime.now(timezone.utc)

    await create_or_update(
        db,
        current_user.id,
        {
            "errors": nlp_result["errors"],
            "speed_wpm": nlp_result["speed_wpm"],
            "accuracy_pct": accuracy_pct,
            "attention_score": eye_result.get("attention_score", 0),
            "model_profile_scores": model_profile_scores,
        },
    )

    progress_entry_id = None

    if create_progress:
        progress_entry = await create_progress_entry(
            db=db,
            student_id=current_user.id,
            session_id=session.id,
            accuracy_trend=accuracy_pct,
            words_practiced=_words_practiced(expected_text, nlp_result["errors"]),
        )
        progress_entry_id = progress_entry.id

    await db.commit()
    await delete_cached_value(_session_key(session_id))

    profile = await build_profile_response(db, current_user.id)
    eye_metrics_payload = _build_eye_metrics_payload(eye_result, eye_payload)
    voice_metrics_payload = _build_voice_metrics_payload(voice_metrics, duration)

    result_payload = SessionResultPayload(
        session_id=session.id,
        spoken_text=spoken_text,
        expected_text=expected_text,
        errors=nlp_result["errors"],
        speed_wpm=float(nlp_result["speed_wpm"]),
        hesitation_points=list(nlp_result["hesitation_points"]),
        attention_score=float(eye_result.get("attention_score", 0)),
        skip_events=list(eye_result.get("skip_events", [])),
        re_read_events=list(eye_result.get("re_read_events", [])),
        avg_fixation_ms=int(eye_result.get("avg_fixation_ms", 0)),
        accuracy_pct=accuracy_pct,
        model_profile_scores=model_profile_scores,
        review_text=review_text,
        eye_metrics=eye_metrics_payload,
        voice_metrics=voice_metrics_payload,
    )

    if create_progress:
        return {
            "result": result_payload,
            "profile": profile,
            "progress_entry_id": progress_entry_id,
        }

    return DiagnosticSubmitResponse(result=result_payload, profile=profile)


def _accuracy_pct(expected_text: str, errors: object) -> float:
    expected_words = max(len(expected_text.split()), 1)
    error_count = len(errors) if isinstance(errors, list) else 0
    return round(max(0.0, ((expected_words - error_count) / expected_words) * 100), 2)


def _words_practiced(expected_text: str, errors: object) -> list[str]:
    error_words = [
        str(item["word"])
        for item in errors
        if isinstance(item, dict) and item.get("word")
    ] if isinstance(errors, list) else []
    return error_words or expected_text.split()[:5]


def _session_key(session_id: int) -> str:
    return f"readable:session:{session_id}"


def _parse_eye_payload(eye_tracking_payload: str) -> dict[str, object]:
    raw = (eye_tracking_payload or "").strip()
    if not raw or raw.lower() in {"undefined", "null"}:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _normalize_focused_word_hits(value: object) -> list[FocusedWordHit]:
    if not isinstance(value, list):
        return []
    hits: list[FocusedWordHit] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        word = item.get("word")
        count = item.get("count")
        if isinstance(word, str) and isinstance(count, int):
            hits.append(FocusedWordHit(word=word, count=count))
    return hits[:8]


def _build_eye_metrics_payload(
    eye_result: dict[str, object],
    eye_payload: dict[str, object],
    eye_feature: EyeTrackingFeature | None = None,
) -> EyeMetricsPayload:
    source = eye_result if eye_result else {}
    fixation_duration = (
        float(source.get("fixation_duration_ms", 0.0))
        if source.get("fixation_duration_ms") is not None
        else float(eye_feature.fixation_duration_ms if eye_feature else 0.0)
    )
    saccade_length = (
        float(source.get("saccade_length", 0.0))
        if source.get("saccade_length") is not None
        else float(eye_feature.saccade_length if eye_feature else 0.0)
    )
    regression_count = (
        int(source.get("regression_count", 0))
        if source.get("regression_count") is not None
        else int(eye_feature.regression_count if eye_feature else 0)
    )
    skipped_words = (
        int(source.get("skipped_words", 0))
        if source.get("skipped_words") is not None
        else int(eye_feature.skipped_words if eye_feature else 0)
    )
    reading_speed_wpm = (
        float(source.get("reading_speed_wpm", 0.0))
        if source.get("reading_speed_wpm") is not None
        else float(eye_feature.reading_speed_wpm if eye_feature else 0.0)
    )

    return EyeMetricsPayload(
        fixation_duration_ms=fixation_duration,
        saccade_length=saccade_length,
        regression_count=regression_count,
        skipped_words=skipped_words,
        reading_speed_wpm=reading_speed_wpm,
        sample_count=int(eye_payload.get("sample_count", 0) or 0),
        skip_events=list(source.get("skip_events", []))
        if isinstance(source.get("skip_events", []), list)
        else [],
        re_read_events=list(source.get("re_read_events", []))
        if isinstance(source.get("re_read_events", []), list)
        else [],
        attention_score=float(source.get("attention_score", 0.0) or 0.0),
        focused_word_hits=_normalize_focused_word_hits(eye_payload.get("focused_word_hits", [])),
    )


def _build_voice_metrics_payload(
    voice_metrics: dict[str, object],
    audio_duration_seconds: float,
    voice_feature: VoiceFeature | None = None,
) -> VoiceMetricsPayload:
    source = voice_metrics if voice_metrics else {}
    return VoiceMetricsPayload(
        speech_rate_wps=float(
            source.get("speech_rate_wps", voice_feature.speech_rate_wps if voice_feature else 0.0)
            or 0.0
        ),
        pause_duration_ms=float(
            source.get(
                "pause_duration_ms",
                voice_feature.pause_duration_ms if voice_feature else 0.0,
            )
            or 0.0
        ),
        pause_frequency=float(
            source.get("pause_frequency", voice_feature.pause_frequency if voice_feature else 0.0)
            or 0.0
        ),
        mispronunciation_rate=float(
            source.get(
                "mispronunciation_rate",
                voice_feature.mispronunciation_rate if voice_feature else 0.0,
            )
            or 0.0
        ),
        repetition_rate=float(
            source.get("repetition_rate", voice_feature.repetition_rate if voice_feature else 0.0)
            or 0.0
        ),
        audio_duration_seconds=float(audio_duration_seconds or 0.0),
    )


async def _recover_reading_payload(
    db: AsyncSession,
    student_id: int,
    personalized_content_id: int | None,
    expected_text_hint: str,
) -> dict[str, object] | None:
    cleaned_expected = expected_text_hint.strip()
    if cleaned_expected:
        return {
            "expected_text": cleaned_expected,
            "session_type": SessionType.reading.value,
            "personalized_content_id": personalized_content_id,
        }

    if personalized_content_id is None:
        return None

    result = await db.execute(
        select(PersonalizedContent).where(
            PersonalizedContent.id == personalized_content_id,
            PersonalizedContent.student_id == student_id,
        )
    )
    personalized = result.scalar_one_or_none()
    if personalized is None:
        return None

    segments = [str(segment) for segment in personalized.adapted_content.get("segments", [])]
    expected_text = " ".join(segment.strip() for segment in segments if segment.strip()).strip()
    if not expected_text:
        return None

    return {
        "expected_text": expected_text,
        "session_type": SessionType.reading.value,
        "personalized_content_id": personalized.id,
    }


async def _result_payload_from_existing(
    db: AsyncSession,
    session: Session,
    existing: SessionResult,
) -> SessionResultPayload:
    eye_data = existing.eye_tracking_data if isinstance(existing.eye_tracking_data, dict) else {}
    eye_feature_result = await db.execute(
        select(EyeTrackingFeature).where(EyeTrackingFeature.session_id == session.id)
    )
    eye_feature = eye_feature_result.scalar_one_or_none()
    voice_feature_result = await db.execute(
        select(VoiceFeature).where(VoiceFeature.session_id == session.id)
    )
    voice_feature = voice_feature_result.scalar_one_or_none()
    return SessionResultPayload(
        session_id=session.id,
        spoken_text=existing.spoken_text,
        expected_text=existing.expected_text,
        errors=existing.errors if isinstance(existing.errors, list) else [],
        speed_wpm=float(existing.speed_wpm),
        hesitation_points=(
            list(existing.hesitation_points) if isinstance(existing.hesitation_points, list) else []
        ),
        attention_score=float(eye_data.get("attention_score", 0.0)),
        skip_events=list(eye_data.get("skip_events", []))
        if isinstance(eye_data.get("skip_events", []), list)
        else [],
        re_read_events=list(eye_data.get("re_read_events", []))
        if isinstance(eye_data.get("re_read_events", []), list)
        else [],
        avg_fixation_ms=int(eye_data.get("avg_fixation_ms", 0) or 0),
        accuracy_pct=float(existing.accuracy_pct),
        model_profile_scores=existing.model_profile_scores if isinstance(existing.model_profile_scores, dict) else {},
        review_text=existing.review_text,
        eye_metrics=_build_eye_metrics_payload(eye_data, eye_data, eye_feature),
        voice_metrics=_build_voice_metrics_payload({}, 0.0, voice_feature),
    )
