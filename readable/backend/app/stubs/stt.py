import asyncio

from app.services.content import DIAGNOSTIC_PASSAGE


_expected_text = DIAGNOSTIC_PASSAGE


def prime_expected_text(expected_text: str) -> None:
    global _expected_text
    _expected_text = expected_text


async def transcribe(audio_bytes: bytes) -> str:
    """Return a mock transcription that imitates a student's spoken reading with a few mistakes."""
    # STUB - replace with real model
    # TODO: Replace stub with a speech-to-text pipeline that transcribes uploaded audio reliably.
    await asyncio.sleep(0.3)
    words = _expected_text.split()
    if len(words) > 12:
        words[5] = "little"
        words[10] = "stories"
        words[-4] = "exercise"
    return " ".join(words)
