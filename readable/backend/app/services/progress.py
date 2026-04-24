from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ProgressEntry


async def create_progress_entry(
    db: AsyncSession,
    student_id: int,
    session_id: int,
    accuracy_trend: float,
    words_practiced: list[str],
) -> ProgressEntry:
    entry = ProgressEntry(
        student_id=student_id,
        session_id=session_id,
        accuracy_trend=accuracy_trend,
        words_practiced=words_practiced,
    )
    db.add(entry)
    await db.flush()
    return entry
