from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile
from app.models.session import Session as ReadingSession
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class ChildAnalytics(BaseModel):
    student_id: int
    name: str
    reading_level: Optional[str]
    avg_speed_wpm: float
    avg_accuracy_pct: float
    attention_score: float
    recent_sessions_count: int

@router.get("/children", response_model=List[ChildAnalytics])
async def get_parent_children(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.parent:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as parent")

    # Get students linked to this parent
    query = select(StudentProfile, User).join(User, StudentProfile.user_id == User.id).where(StudentProfile.parent_id == current_user.id)
    result = await db.execute(query)
    rows = result.all()

    children = []
    for profile, user in rows:
        # Get count of recent sessions (for simplicity, we just count all sessions for now)
        sessions_query = select(ReadingSession).where(ReadingSession.student_id == user.id)
        sessions_result = await db.execute(sessions_query)
        sessions_count = len(sessions_result.scalars().all())

        children.append(ChildAnalytics(
            student_id=user.id,
            name=user.name,
            reading_level=profile.reading_level,
            avg_speed_wpm=profile.avg_speed_wpm,
            avg_accuracy_pct=profile.avg_accuracy_pct,
            attention_score=profile.attention_score,
            recent_sessions_count=sessions_count
        ))

    return children
