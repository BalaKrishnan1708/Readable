from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User
from app.schemas.profile import StudentProfileResponse, StudentProgressResponse
from app.services.profile import build_profile_response, build_progress_response


router = APIRouter()


@router.get("/{student_id}/profile", response_model=StudentProfileResponse)
async def get_student_profile(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StudentProfileResponse:
    _ensure_student_access(student_id, current_user)
    try:
        return await build_profile_response(db, student_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{student_id}/progress", response_model=StudentProgressResponse)
async def get_student_progress(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StudentProgressResponse:
    _ensure_student_access(student_id, current_user)
    return await build_progress_response(db, student_id)


def _ensure_student_access(student_id: int, current_user: User) -> None:
    if current_user.role == "teacher":
        return
    if current_user.id != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
