import asyncio
import difflib
import re

async def compare_texts(spoken: str, expected: str, duration_seconds: float = 0.0) -> dict[str, object]:
    """
    Compare spoken text with expected text using sequence alignment.
    Returns detected errors, speed (WPM), and hesitation points.
    """
    # Normalize texts: lowercase and remove punctuation
    def normalize(text):
        text = text.lower()
        return re.findall(r"\w+", text)

    spoken_words = normalize(spoken)
    expected_words = normalize(expected)

    # Use difflib to align the sequences
    matcher = difflib.SequenceMatcher(None, expected_words, spoken_words)
    errors = []
    
    # Track which word indices in the expected text were problematic
    hesitation_points = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'replace':
            # Substitution
            for idx in range(i1, i2):
                errors.append({
                    "word": expected_words[idx],
                    "position": idx,
                    "type": "substitution",
                    "spoken_as": spoken_words[j1 + (idx - i1)] if (j1 + (idx - i1)) < j2 else ""
                })
                hesitation_points.append(idx)
        elif tag == 'delete':
            # Omission (present in expected, missing in spoken)
            for idx in range(i1, i2):
                errors.append({
                    "word": expected_words[idx],
                    "position": idx,
                    "type": "omission"
                })
                hesitation_points.append(idx)
        elif tag == 'insert':
            # Insertion (present in spoken, missing in expected)
            # We don't necessarily count these as "errors" in the same way for dyslexia,
            # but they indicate hesitation or repetition.
            for idx in range(i1, i2):
                hesitation_points.append(i1) # Mark the point in expected where insertion happened

    # Calculate WPM
    # If duration is provided, use it. Otherwise, assume a default if we can't determine it.
    if duration_seconds > 0:
        # Correct words are total expected minus omissions and substitutions
        # But usually WPM is just (total words spoken / time) or (correct words / time)
        # Here we'll use (actual words aligned / time)
        correct_word_count = len(expected_words) - len([e for e in errors if e["type"] in ["substitution", "omission"]])
        speed_wpm = (correct_word_count / (duration_seconds / 60)) if duration_seconds > 0 else 0
    else:
        # Fallback to a placeholder or average if duration is unknown
        speed_wpm = 0.0

    return {
        "errors": errors,
        "speed_wpm": round(speed_wpm, 2),
        "hesitation_points": sorted(list(set(hesitation_points))),
    }
