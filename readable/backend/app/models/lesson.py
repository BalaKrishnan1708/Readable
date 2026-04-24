from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LessonContentType(str, Enum):
    text = "text"
    pdf = "pdf"
    image = "image"


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(Text)
    raw_content: Mapped[str] = mapped_column(Text)
    processed_content: Mapped[str] = mapped_column(Text)
    content_type: Mapped[LessonContentType] = mapped_column(
        SqlEnum(LessonContentType, name="lesson_content_type")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    teacher = relationship("User", back_populates="taught_lessons")
    personalized_variants = relationship("PersonalizedContent", back_populates="lesson")
