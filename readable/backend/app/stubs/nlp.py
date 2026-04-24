import asyncio


async def compare_texts(spoken: str, expected: str) -> dict[str, object]:
    """Return mock comparison metadata that a real NLP alignment service would compute."""
    # STUB - replace with real model
    # TODO: Replace stub with a text alignment pipeline that detects substitutions, omissions, and pacing.
    await asyncio.sleep(0.3)
    spoken_words = spoken.split()
    expected_words = expected.split()
    errors: list[dict[str, object]] = []
    for index, expected_word in enumerate(expected_words):
        spoken_word = spoken_words[index] if index < len(spoken_words) else ""
        cleaned_expected = expected_word.strip(".,").lower()
        cleaned_spoken = spoken_word.strip(".,").lower()
        if cleaned_expected != cleaned_spoken:
            errors.append(
                {
                    "word": expected_word.strip(".,"),
                    "position": index,
                    "type": "substitution" if spoken_word else "omission",
                }
            )
        if len(errors) >= 3:
            break

    return {
        "errors": errors,
        "speed_wpm": 95,
        "hesitation_points": [3, 7, 12],
    }
