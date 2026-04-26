from __future__ import annotations

from pathlib import Path
from typing import Any
import logging

from app.services.voice_features import extract_pitch_variation_hz

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parents[2] / "profile_model" / "dyslexia_profiler.pt"


# Global cache to avoid reloading on every request
_CACHE: dict[str, Any] = {
    "model": None,
    "scaler": None,
    "feature_names": None,
    "output_names": None,
    "feature_bounds": None,
    "mtime": 0,
}


def predict_profile_scores(features: dict[str, float]) -> dict[str, float] | None:
    if not MODEL_PATH.exists():
        logger.error(f"Model file not found at: {MODEL_PATH}")
        return None

    try:
        import importlib.util
        import sys
        import numpy as np
        import torch

        current_mtime = MODEL_PATH.stat().st_mtime
        if _CACHE["model"] is None or _CACHE["mtime"] != current_mtime:
            logger.info(f"Loading model from {MODEL_PATH}...")
            model_dir = Path(__file__).resolve().parents[2] / "profile_model"
            model_file = model_dir / "model.py"
            
            if str(model_dir) not in sys.path:
                sys.path.append(str(model_dir))

            spec = importlib.util.spec_from_file_location("profile_model_impl", model_file)
            if spec is None or spec.loader is None:
                logger.error(f"Could not load model spec from {model_file}")
                return None
            module = importlib.util.module_from_spec(spec)
            sys.modules["profile_model_impl"] = module
            spec.loader.exec_module(module)

            profiler_cls = getattr(module, "DyslexiaProfiler", None)
            feature_names = getattr(module, "FEATURE_NAMES", None)
            output_names = getattr(module, "OUTPUT_NAMES", None)
            feature_bounds = getattr(module, "FEATURE_BOUNDS", None)
            
            if profiler_cls is None or feature_names is None or output_names is None:
                logger.error(f"Missing required attributes in {model_file}")
                return None

            model, scaler = profiler_cls.load(str(MODEL_PATH))
            _CACHE.update({
                "model": model,
                "scaler": scaler,
                "feature_names": feature_names,
                "output_names": output_names,
                "feature_bounds": feature_bounds,
                "mtime": current_mtime
            })
        else:
            model = _CACHE["model"]
            scaler = _CACHE["scaler"]
            feature_names = _CACHE["feature_names"]
            output_names = _CACHE["output_names"]
            feature_bounds = _CACHE["feature_bounds"]

        # Log input features for debugging
        logger.info(f"[ML INPUT] Raw features: {features}")

        arr = np.array([float(features.get(name, 0.0)) for name in feature_names], dtype=np.float32)
        logger.info(f"[ML INPUT] Feature array (before normalization): {arr}")

        if scaler and isinstance(scaler, dict) and "mean_" in scaler and "scale_" in scaler:
            mean = np.array(scaler["mean_"], dtype=np.float32)
            scale = np.array(scaler["scale_"], dtype=np.float32)
            arr = (arr - mean) / (scale + 1e-8)
            logger.debug(f"[ML NORM] Using StandardScaler normalization")
        elif isinstance(feature_bounds, dict):
            for index, name in enumerate(feature_names):
                bounds = feature_bounds.get(name)
                if not isinstance(bounds, (list, tuple)) or len(bounds) != 2:
                    continue
                low, high = float(bounds[0]), float(bounds[1])
                arr[index] = np.clip((arr[index] - low) / (high - low + 1e-8), 0.0, 1.0)
            logger.debug(f"[ML NORM] Using min-max normalization with feature bounds")

        logger.info(f"[ML INPUT] Normalized feature array: {arr}")

        x = torch.tensor(arr, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            out = model.forward(x)

        result = {name: float(out[name].item()) for name in output_names if name in out}
        logger.info(f"[ML OUTPUT] Model predictions: {result}")
        return result
    except Exception as exc:
        print(f"!!! CRITICAL INFERENCE ERROR: {exc}")
        import traceback
        traceback.print_exc()
        logger.error(f"Inference failed: {exc}", exc_info=True)
        return None


def build_profiler_features(
    *,
    eye_metrics: dict[str, Any],
    voice_metrics: dict[str, Any],
    expected_word_count: int,
    audio_bytes: bytes,
    audio_signal: np.ndarray | None = None,
    sample_rate: int | None = None,
) -> dict[str, float]:
    """Build feature dict for the dyslexia profiler model."""
    import numpy as np

    skipped_words = float(eye_metrics.get("skipped_words", 0.0))
    skipped_word_rate = skipped_words / max(float(expected_word_count), 1.0)

    features = {
        "fixation_duration_ms": float(eye_metrics.get("fixation_duration_ms", 0.0)),
        "saccade_length_deg": float(eye_metrics.get("saccade_length", 0.0)),
        "regression_count": float(eye_metrics.get("regression_count", 0.0)),
        "skipped_word_rate": max(0.0, min(skipped_word_rate, 1.0)),
        "reading_speed_wpm": float(eye_metrics.get("reading_speed_wpm", 0.0)),
        "speech_rate_wps": float(voice_metrics.get("speech_rate_wps", 0.0)),
        "pause_duration_ms": float(voice_metrics.get("pause_duration_ms", 0.0)),
        "pause_frequency": float(voice_metrics.get("pause_frequency", 0.0)),
        "mispronunciation_rate": float(voice_metrics.get("mispronunciation_rate", 0.0)),
        "repetition_rate": float(voice_metrics.get("repetition_rate", 0.0)),
        "pitch_variation_hz": extract_pitch_variation_hz(
            audio_bytes, audio_signal=audio_signal, sample_rate=sample_rate
        ),
    }

    # Log feature construction
    logger.info(f"[FEATURES] Eye metrics: {eye_metrics}")
    logger.info(f"[FEATURES] Voice metrics: {voice_metrics}")
    logger.info(f"[FEATURES] Built features dict: {features}")

    # Validate that we have some meaningful data
    non_zero_features = [k for k, v in features.items() if v != 0.0]
    if len(non_zero_features) < 3:
        logger.warning(f"[FEATURES] WARNING: Only {len(non_zero_features)} non-zero features. Features may be uniform.")

    return features
