from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LessonUploadResponse(BaseModel):
    lesson_id: int
    title: str
    content_type: str
    processed_content: str


class PersonalizedContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    student_id: int
    segments: list[str]
    syllable_breaks: dict[str, str]
    font_size: int
    line_spacing: float
    chunk_size: int
    created_at: datetime
