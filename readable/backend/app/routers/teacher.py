from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models import Session, StudentProfile, User
from app.models.user import UserRole
from app.schemas.teacher import TeacherStudentSummary


router = APIRouter()


@router.get("/students", response_model=list[TeacherStudentSummary])
async def list_students(
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
) -> list[TeacherStudentSummary]:
    _ = current_user
    result = await db.execute(select(User).where(User.role == UserRole.student))
    students = result.scalars().all()

    summaries: list[TeacherStudentSummary] = []
    for student in students:
        profile_result = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == student.id)
        )
        profile = profile_result.scalar_one_or_none()

        last_session_result = await db.execute(
            select(func.max(Session.started_at)).where(Session.student_id == student.id)
        )
        last_session_date = last_session_result.scalar_one()

        summaries.append(
            TeacherStudentSummary(
                student_id=student.id,
                name=student.email.split("@")[0].replace(".", " ").title(),
                email=student.email,
                reading_level=profile.reading_level if profile else None,
                avg_accuracy_pct=profile.avg_accuracy_pct if profile else 0.0,
                avg_speed_wpm=profile.avg_speed_wpm if profile else 0.0,
                attention_score=profile.attention_score if profile else 0.0,
                difficult_words=profile.difficult_words if profile else [],
                last_session_date=last_session_date,
            )
        )

    return summaries
