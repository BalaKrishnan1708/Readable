import asyncio
import logging
from typing import Any

from app.services.eye_features import extract_eye_tracking_metrics

logger = logging.getLogger(__name__)


async def analyze(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Perform real-time analysis of eye-tracking data payload.
    Extracts fixations, saccades, and regressions to build a reading profile.
    """
    # Simulate a small processing delay for the ML logic
    await asyncio.sleep(0.05)
    
    focus_events = payload.get("focus_events", [])
    samples = payload.get("samples", [])
    
    # We need the expected word count to accurately detect skips.
    # In sessions.py, we'll pass this in or the payload might already have it if we update the frontend.
    # For now, we'll try to infer it or rely on the metrics extractor's defaults.
    # BETTER: sessions.py should call extract_eye_tracking_metrics directly if possible,
    # or we pass expected_word_count in the payload.
    
    expected_word_count = payload.get("expected_word_count", 0)
    
    metrics = extract_eye_tracking_metrics(
        focus_events=focus_events if isinstance(focus_events, list) else [],
        expected_word_count=expected_word_count
    )
    
    logger.info(f"[EYE ANALYSIS] Processed {len(focus_events)} focus events and {len(samples)} raw samples.")
    logger.info(f"[EYE ANALYSIS] Metrics: {metrics}")
    
    return {
        "attention_score": metrics["attention_score"],
        "skip_events": metrics["skip_events"],
        "re_read_events": metrics["re_read_events"],
        "avg_fixation_ms": int(metrics["fixation_duration_ms"]),
        "fixation_duration_ms": metrics["fixation_duration_ms"],
        "saccade_length": metrics["saccade_length"],
        "regression_count": metrics["regression_count"],
        "skipped_words": metrics["skipped_words"],
        "reading_speed_wpm": metrics["reading_speed_wpm"],
    }
