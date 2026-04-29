from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PersonalizedContent(Base):
    __tablename__ = "personalized_content"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    adapted_content: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    syllable_breaks: Mapped[dict[str, str]] = mapped_column(JSON, default=dict)
    font_size: Mapped[int] = mapped_column(Integer, default=18)
    spacing: Mapped[float] = mapped_column(Float, default=1.8)
    chunk_size: Mapped[int] = mapped_column(Integer, default=2)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lesson = relationship("Lesson", back_populates="personalized_variants")
    student = relationship("User", back_populates="personalized_content_items")
