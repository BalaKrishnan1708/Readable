from typing import TypedDict


class FocusEvent(TypedDict):
    wordIndex: int
    timestamp: int


class EyeTrackingMetrics(TypedDict):
    fixation_duration_ms: float
    saccade_length: float
    regression_count: int
    skipped_words: int
    reading_speed_wpm: float
    skip_events: list[int]
    re_read_events: list[int]
    attention_score: float


def extract_eye_tracking_metrics(
    focus_events: list[FocusEvent], expected_word_count: int
) -> EyeTrackingMetrics:
    if not focus_events:
        return {
            "fixation_duration_ms": 0.0,
            "saccade_length": 0.0,
            "regression_count": 0,
            "skipped_words": max(expected_word_count, 0),
            "reading_speed_wpm": 0.0,
            "skip_events": list(range(expected_word_count)) if expected_word_count > 0 else [],
            "re_read_events": [],
            "attention_score": 0.0,
        }

    # Defensive sort to support payloads that may arrive unordered.
    ordered = sorted(
        (
            event
            for event in focus_events
            if isinstance(event, dict)
            and isinstance(event.get("wordIndex"), int)
            and isinstance(event.get("timestamp"), int)
        ),
        key=lambda event: event["timestamp"],
    )

    if not ordered:
        return {
            "fixation_duration_ms": 0.0,
            "saccade_length": 0.0,
            "regression_count": 0,
            "skipped_words": max(expected_word_count, 0),
            "reading_speed_wpm": 0.0,
            "skip_events": list(range(expected_word_count)) if expected_word_count > 0 else [],
            "re_read_events": [],
            "attention_score": 0.0,
        }

    fixation_durations: list[int] = []
    saccade_jumps: list[int] = []
    regression_count = 0
    re_read_events: set[int] = set()

    current_word = ordered[0]["wordIndex"]
    current_start = ordered[0]["timestamp"]
    previous_word = current_word

    for event in ordered[1:]:
        word_index = event["wordIndex"]
        timestamp = event["timestamp"]

        if word_index != previous_word:
            fixation_durations.append(max(timestamp - current_start, 0))
            jump = abs(word_index - previous_word)
            saccade_jumps.append(jump)
            if word_index < previous_word:
                regression_count += 1
                re_read_events.add(word_index)
            current_word = word_index
            current_start = timestamp

        previous_word = word_index

    # Include the final fixation duration until the last event.
    fixation_durations.append(max(ordered[-1]["timestamp"] - current_start, 0))

    seen_words = {event["wordIndex"] for event in ordered if event["wordIndex"] >= 0}
    bounded_seen = {
        index for index in seen_words if expected_word_count <= 0 or index < expected_word_count
    }
    
    skip_events: list[int] = []
    if expected_word_count > 0:
        skip_events = [i for i in range(expected_word_count) if i not in bounded_seen]
    
    skipped_words = len(skip_events)

    elapsed_ms = max(ordered[-1]["timestamp"] - ordered[0]["timestamp"], 1)
    elapsed_minutes = elapsed_ms / 60000
    reading_speed_wpm = round(len(bounded_seen) / elapsed_minutes, 2) if elapsed_minutes > 0 else 0.0

    # Calculate attention score based on consistency and coverage
    coverage = len(bounded_seen) / max(expected_word_count, 1)
    stability = 1.0 - (min(regression_count, 20) / 40.0)  # Penalty for excessive regressions
    attention_score = round(max(0.0, min(1.0, (coverage * 0.7) + (stability * 0.3))), 2)

    return {
        "fixation_duration_ms": round(sum(fixation_durations) / max(len(fixation_durations), 1), 2),
        "saccade_length": round(sum(saccade_jumps) / max(len(saccade_jumps), 1), 2),
        "regression_count": regression_count,
        "skipped_words": skipped_words,
        "reading_speed_wpm": reading_speed_wpm,
        "skip_events": skip_events,
        "re_read_events": sorted(list(re_read_events)),
        "attention_score": attention_score,
    }
