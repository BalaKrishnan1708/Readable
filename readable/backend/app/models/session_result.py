from sqlalchemy import Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SessionResult(Base):
    __tablename__ = "session_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), unique=True, index=True
    )
    spoken_text: Mapped[str] = mapped_column(Text)
    expected_text: Mapped[str] = mapped_column(Text)
    errors: Mapped[list[dict[str, object]]] = mapped_column(JSONB, default=list)
    speed_wpm: Mapped[float] = mapped_column(Float)
    hesitation_points: Mapped[list[int]] = mapped_column(JSONB, default=list)
    eye_tracking_data: Mapped[dict[str, object]] = mapped_column(JSONB, default=dict)
    accuracy_pct: Mapped[float] = mapped_column(Float)
    model_profile_scores: Mapped[dict[str, float]] = mapped_column(JSONB, default=dict)

    session = relationship("Session", back_populates="result")
