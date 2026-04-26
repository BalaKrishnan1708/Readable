from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LessonUploadResponse(BaseModel):
    lesson_id: int
    title: str
    content_type: str
    processed_content: str


class PhoneticSupportWordResponse(BaseModel):
    word: str
    ipa: str
    syllables: list[str]
    onset: str
    rime: str
    whisper_text: str


class PersonalizedContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    student_id: int
    segments: list[str]
    syllable_breaks: dict[str, str]
    phonetic_support: dict[str, PhoneticSupportWordResponse]
    font_size: int
    line_spacing: float
    chunk_size: int
    created_at: datetime


class StudentLessonCardResponse(BaseModel):
    personalized_content_id: int
    lesson_id: int
    title: str
    content_type: str
    preview_text: str
    segment_count: int
    support_focus: list[str]
    created_at: datetime
