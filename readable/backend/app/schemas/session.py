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
