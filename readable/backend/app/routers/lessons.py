from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models import Lesson, PersonalizedContent, StudentProfile, User
from app.models.lesson import LessonContentType
from app.schemas.lesson import (
    LessonUploadResponse,
    PersonalizedContentResponse,
    PhoneticSupportWordResponse,
)
from app.stubs import ocr, personalization


router = APIRouter()


@router.post("/upload", response_model=LessonUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_lesson(
    title: str = Form(...),
    raw_text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
) -> LessonUploadResponse:
    if not raw_text and file is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide text or a file")

    if raw_text:
        content_type = LessonContentType.text
        raw_content = raw_text
        processed_content = raw_text
    else:
        file_bytes = await file.read()
        mime_type = file.content_type or "application/octet-stream"
        if mime_type == "text/plain":
            content_type = LessonContentType.text
            raw_content = file_bytes.decode("utf-8")
            processed_content = raw_content
        else:
            content_type = (
                LessonContentType.pdf if "pdf" in mime_type else LessonContentType.image
            )
            raw_content = f"Uploaded file: {file.filename}"
            processed_content = await ocr.extract(file_bytes, mime_type)

    lesson = Lesson(
        teacher_id=current_user.id,
        title=title,
        raw_content=raw_content,
        processed_content=processed_content,
        content_type=content_type,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)

    return LessonUploadResponse(
        lesson_id=lesson.id,
        title=lesson.title,
        content_type=lesson.content_type.value,
        processed_content=lesson.processed_content,
    )


@router.post(
    "/{lesson_id}/personalize/{student_id}",
    response_model=PersonalizedContentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def personalize_lesson(
    lesson_id: int,
    student_id: int,
    current_user: User = Depends(require_role("teacher")),
    db: AsyncSession = Depends(get_db),
) -> PersonalizedContentResponse:
    lesson_result = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id, Lesson.teacher_id == current_user.id)
    )
    lesson = lesson_result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == student_id)
    )
    profile = profile_result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    adapted = await personalization.adapt(
        lesson.processed_content,
        {
            "reading_level": profile.reading_level,
            "avg_speed_wpm": profile.avg_speed_wpm,
            "avg_accuracy_pct": profile.avg_accuracy_pct,
            "attention_score": profile.attention_score,
            "difficult_words": profile.difficult_words,
        },
    )

    personalized = PersonalizedContent(
        lesson_id=lesson.id,
        student_id=student_id,
        adapted_content={
            "segments": adapted["segments"],
            "chunk_mode": adapted.get("chunk_mode", "paired-sentences"),
            "phonetic_support": adapted.get("phonetic_support", {}),
        },
        syllable_breaks=adapted["syllable_breaks"],
        font_size=int(adapted["font_size"]),
        spacing=float(adapted["line_spacing"]),
        chunk_size=int(adapted["chunk_size"]),
    )
    db.add(personalized)
    await db.commit()
    await db.refresh(personalized)

    return PersonalizedContentResponse(
        id=personalized.id,
        lesson_id=personalized.lesson_id,
        student_id=personalized.student_id,
        segments=list(personalized.adapted_content.get("segments", [])),
        syllable_breaks=personalized.syllable_breaks,
        phonetic_support={
            key: PhoneticSupportWordResponse(**value)
            for key, value in personalized.adapted_content.get("phonetic_support", {}).items()
            if isinstance(value, dict)
        },
        font_size=personalized.font_size,
        line_spacing=personalized.spacing,
        chunk_size=personalized.chunk_size,
        created_at=personalized.created_at,
    )
