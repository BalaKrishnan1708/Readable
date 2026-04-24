from datetime import datetime

from pydantic import BaseModel


class TeacherStudentSummary(BaseModel):
    student_id: int
    name: str
    email: str
    reading_level: str | None
    avg_accuracy_pct: float
    avg_speed_wpm: float
    attention_score: float
    difficult_words: list[str]
    last_session_date: datetime | None
