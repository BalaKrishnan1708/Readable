import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.core.redis import cache_json, delete_cached_value, get_cached_json
from app.models import PersonalizedContent, Session, SessionResult, User
from app.models.session import SessionStatus, SessionType
from app.schemas.lesson import PersonalizedContentResponse
from app.schemas.session import (
    DiagnosticStartResponse,
    DiagnosticSubmitResponse,
    ReadingStartRequest,
    ReadingStartResponse,
    ReadingSubmitResponse,
    SessionResultPayload,
)
from app.services.content import DIAGNOSTIC_PASSAGE
from app.services.profile import build_profile_response, create_or_update
from app.services.progress import create_progress_entry
from app.stubs import eye_tracker, nlp, stt


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
    audio_file: UploadFile = File(...),
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
) -> ReadingSubmitResponse:
    response = await _submit_session(
        db=db,
        current_user=current_user,
        session_id=session_id,
        eye_tracking_payload=eye_tracking_payload,
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
    audio_file: UploadFile,
    expected_session_type: SessionType,
    create_progress: bool,
) -> DiagnosticSubmitResponse | dict[str, object]:
    payload = await get_cached_json(_session_key(session_id))
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session cache not found")

    session_result = await db.execute(
        select(Session).where(Session.id == session_id, Session.student_id == current_user.id)
    )
    session = session_result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session.session_type != expected_session_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session type")

    existing_result = await db.execute(select(SessionResult).where(SessionResult.session_id == session_id))
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already submitted")

    try:
        eye_payload = json.loads(eye_tracking_payload)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid eye tracking payload") from exc

    expected_text = str(payload["expected_text"])
    stt.prime_expected_text(expected_text)
    spoken_text = await stt.transcribe(await audio_file.read())
    nlp_result = await nlp.compare_texts(spoken_text, expected_text)
    eye_result = await eye_tracker.analyze(eye_payload)
    accuracy_pct = _accuracy_pct(expected_text, nlp_result["errors"])

    result_model = SessionResult(
        session_id=session.id,
        spoken_text=spoken_text,
        expected_text=expected_text,
        errors=nlp_result["errors"],
        speed_wpm=float(nlp_result["speed_wpm"]),
        hesitation_points=nlp_result["hesitation_points"],
        eye_tracking_data=eye_result,
        accuracy_pct=accuracy_pct,
    )
    db.add(result_model)

    session.status = SessionStatus.completed.value
    session.ended_at = datetime.now(timezone.utc)

    await create_or_update(
        db,
        current_user.id,
        {
            "errors": nlp_result["errors"],
            "speed_wpm": nlp_result["speed_wpm"],
            "accuracy_pct": accuracy_pct,
            "attention_score": eye_result["attention_score"],
        },
    )

    progress_entry_id: int | None = None
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
    result_payload = SessionResultPayload(
        session_id=session.id,
        spoken_text=spoken_text,
        expected_text=expected_text,
        errors=nlp_result["errors"],
        speed_wpm=float(nlp_result["speed_wpm"]),
        hesitation_points=list(nlp_result["hesitation_points"]),
        attention_score=float(eye_result["attention_score"]),
        skip_events=list(eye_result["skip_events"]),
        re_read_events=list(eye_result["re_read_events"]),
        avg_fixation_ms=int(eye_result["avg_fixation_ms"]),
        accuracy_pct=accuracy_pct,
    )

    if create_progress:
        return {"result": result_payload, "profile": profile, "progress_entry_id": progress_entry_id}
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
