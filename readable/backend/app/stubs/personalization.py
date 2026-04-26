import asyncio

from app.stubs import phonetics


async def adapt(content: str, profile: dict[str, object]) -> dict[str, object]:
    """Return mock personalized reading supports that a real adaptation engine would generate."""
    # STUB - replace with real model
    # TODO: Replace stub with a personalization service that adapts text structure, spacing, and supports per learner profile.
    await asyncio.sleep(0.3)
    sentences = [segment.strip() for segment in content.split(".") if segment.strip()]
    segments = [
        ". ".join(sentences[index : index + 2]).strip() + "."
        for index in range(0, len(sentences), 2)
    ]
    syllable_breaks = {"difficult": "dif-fi-cult", "butterflies": "but-ter-flies"}
    phonetic_support = await phonetics.generate_pronunciations(content, syllable_breaks)
    return {
        "segments": segments[:4] or [content],
        "syllable_breaks": syllable_breaks,
        "phonetic_support": phonetic_support,
        "font_size": 18,
        "line_spacing": 1.8,
        "chunk_size": 2,
        "chunk_mode": "paired-sentences",
    }
