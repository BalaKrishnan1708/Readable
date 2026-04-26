from pydantic import BaseModel

from app.schemas.lesson import PersonalizedContentResponse
from app.schemas.profile import StudentProfileResponse


class DiagnosticStartResponse(BaseModel):
    session_id: int
    expected_text: str


class ReadingStartRequest(BaseModel):
    personalized_content_id: int


class ErrorItem(BaseModel):
    word: str
    position: int
    type: str


class FocusedWordHit(BaseModel):
    word: str
    count: int


class EyeMetricsPayload(BaseModel):
    fixation_duration_ms: float
    saccade_length: float
    regression_count: int
    skipped_words: int
    reading_speed_wpm: float
    sample_count: int
    skip_events: list[int]
    re_read_events: list[int]
    attention_score: float
    focused_word_hits: list[FocusedWordHit] = []


class VoiceMetricsPayload(BaseModel):
    speech_rate_wps: float
    pause_duration_ms: float
    pause_frequency: float
    mispronunciation_rate: float
    repetition_rate: float
    audio_duration_seconds: float


class SessionResultPayload(BaseModel):
    session_id: int
    spoken_text: str
    expected_text: str
    errors: list[ErrorItem]
    speed_wpm: float
    hesitation_points: list[int]
    attention_score: float
    skip_events: list[int]
    re_read_events: list[int]
    avg_fixation_ms: int
    accuracy_pct: float
    model_profile_scores: dict[str, float] = {}
    review_text: str | None = None
    eye_metrics: EyeMetricsPayload
    voice_metrics: VoiceMetricsPayload


class DiagnosticSubmitResponse(BaseModel):
    result: SessionResultPayload
    profile: StudentProfileResponse


class ReadingStartResponse(BaseModel):
    session_id: int
    content: PersonalizedContentResponse


class ReadingSubmitResponse(BaseModel):
    result: SessionResultPayload
    profile: StudentProfileResponse
    progress_entry_id: int
