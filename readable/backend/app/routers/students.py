from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Lesson, PersonalizedContent, StudentProfile, User
from app.schemas.lesson import StudentLessonCardResponse
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


@router.get("/{student_id}/lessons", response_model=list[StudentLessonCardResponse])
async def get_student_lessons(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[StudentLessonCardResponse]:
    _ensure_student_access(student_id, current_user)

    profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == student_id)
    )
    profile = profile_result.scalar_one_or_none()
    difficult_words = profile.difficult_words if profile else []

    lessons_result = await db.execute(
        select(PersonalizedContent, Lesson)
        .join(Lesson, Lesson.id == PersonalizedContent.lesson_id)
        .where(PersonalizedContent.student_id == student_id)
        .order_by(PersonalizedContent.created_at.desc())
    )

    cards: list[StudentLessonCardResponse] = []
    for personalized, lesson in lessons_result.all():
        segments = [str(segment) for segment in personalized.adapted_content.get("segments", [])]
        preview_text = " ".join(segments[:1]).strip() or lesson.processed_content[:180]
        support_focus = _build_support_focus(
            segments=segments,
            syllable_breaks=personalized.syllable_breaks,
            difficult_words=difficult_words,
        )
        cards.append(
            StudentLessonCardResponse(
                personalized_content_id=personalized.id,
                lesson_id=lesson.id,
                title=lesson.title,
                content_type=lesson.content_type.value,
                preview_text=preview_text[:220],
                segment_count=len(segments),
                support_focus=support_focus,
                created_at=personalized.created_at,
            )
        )

    return cards


def _ensure_student_access(student_id: int, current_user: User) -> None:
    if current_user.role == "teacher":
        return
    if current_user.id != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def _build_support_focus(
    segments: list[str],
    syllable_breaks: dict[str, str],
    difficult_words: list[str],
) -> list[str]:
    lower_segments = " ".join(segments).lower()
    difficult_hits = [
        word for word in difficult_words if word and word.lower() in lower_segments
    ]

    focus = []
    if difficult_hits:
        focus.append("Vocabulary preview")
    if syllable_breaks:
        focus.append("Phonetic breakdown")
    if len(segments) >= 3:
        focus.append("Chunked reading")
    if not focus:
        focus.append("Fluency practice")
    return focus[:3]
