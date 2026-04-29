import asyncio
from pathlib import Path

from sqlalchemy import delete, select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import Lesson, ProgressEntry, Session, SessionResult, StudentProfile, User
from app.models.lesson import LessonContentType
from app.models.session import SessionStatus, SessionType
from app.models.user import UserRole
from app.services.content import DIAGNOSTIC_PASSAGE


async def seed() -> None:
    from app.core.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for model in [ProgressEntry, SessionResult, Session, StudentProfile, Lesson, User]:
            await db.execute(delete(model))

        teacher = User(
            email="teacher@readable.app",
            hashed_password=hash_password("password123"),
            role=UserRole.teacher,
        )
        student_one = User(
            email="ava.student@readable.app",
            hashed_password=hash_password("password123"),
            role=UserRole.student,
        )
        student_two = User(
            email="noah.student@readable.app",
            hashed_password=hash_password("password123"),
            role=UserRole.student,
        )
        db.add_all([teacher, student_one, student_two])
        await db.flush()

        lesson = Lesson(
            teacher_id=teacher.id,
            title="Butterfly Reading Practice",
            raw_content=DIAGNOSTIC_PASSAGE,
            processed_content=DIAGNOSTIC_PASSAGE,
            content_type=LessonContentType.text,
        )
        db.add(lesson)

        profiles = [
            StudentProfile(
                user_id=student_one.id,
                reading_level="Developing",
                avg_speed_wpm=92,
                avg_accuracy_pct=88,
                attention_score=0.74,
                difficult_words=["butterflies", "chrysalis", "librarian"],
            ),
            StudentProfile(
                user_id=student_two.id,
                reading_level="Foundational",
                avg_speed_wpm=85,
                avg_accuracy_pct=81,
                attention_score=0.69,
                difficult_words=["garden", "notebook", "practice"],
            ),
        ]
        db.add_all(profiles)
        await db.flush()

        sample_session = Session(
            student_id=student_one.id,
            session_type=SessionType.diagnostic,
            status=SessionStatus.completed.value,
        )
        sample_session_two = Session(
            student_id=student_two.id,
            session_type=SessionType.reading,
            status=SessionStatus.completed.value,
        )
        db.add_all([sample_session, sample_session_two])
        await db.flush()

        db.add(
            SessionResult(
                session_id=sample_session.id,
                spoken_text=DIAGNOSTIC_PASSAGE.replace("butterflies", "butterflys"),
                expected_text=DIAGNOSTIC_PASSAGE,
                errors=[
                    {"word": "butterflies", "position": 21, "type": "substitution"},
                    {"word": "chrysalis", "position": 49, "type": "hesitation"},
                ],
                speed_wpm=93,
                hesitation_points=[9, 21, 49],
                eye_tracking_data={
                    "attention_score": 0.75,
                    "skip_events": [14],
                    "re_read_events": [9],
                    "avg_fixation_ms": 235,
                },
                accuracy_pct=91,
            )
        )

        db.add_all(
            [
                ProgressEntry(
                    student_id=student_one.id,
                    session_id=sample_session.id,
                    accuracy_trend=91,
                    words_practiced=["butterflies", "chrysalis"],
                ),
                ProgressEntry(
                    student_id=student_two.id,
                    session_id=sample_session_two.id,
                    accuracy_trend=84,
                    words_practiced=["notebook", "garden"],
                ),
            ]
        )

        await db.commit()

    print("Seed completed.")
    print(f"Diagnostic passage source: {Path('app/services/content.py').resolve()}")


if __name__ == "__main__":
    asyncio.run(seed())
