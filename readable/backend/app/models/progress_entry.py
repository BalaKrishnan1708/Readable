from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProgressEntry(Base):
    __tablename__ = "progress_entries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    accuracy_trend: Mapped[float] = mapped_column(Float)
    words_practiced: Mapped[list[str]] = mapped_column(JSONB, default=list)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="progress_entries")
    session = relationship("Session", back_populates="progress_entries")
