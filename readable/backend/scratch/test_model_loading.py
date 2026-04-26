
import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path(r"c:\Users\jaits\PycharmProjects\Readf\readable\backend")
sys.path.append(str(backend_path))

from app.services.dyslexia_profile_inference import MODEL_PATH, predict_profile_scores

print(f"MODEL_PATH: {MODEL_PATH}")
print(f"MODEL_PATH exists: {MODEL_PATH.exists()}")

# Try to import torch and numpy
try:
    import torch
    import numpy as np
    print(f"Torch version: {torch.__version__}")
    print(f"Numpy version: {np.__version__}")
except ImportError as e:
    print(f"Import error: {e}")

# Try to call predict_profile_scores with dummy features
dummy_features = {
    "fixation_duration_ms": 200.0,
    "saccade_length_deg": 5.0,
    "regression_count": 2.0,
    "skipped_word_rate": 0.1,
    "reading_speed_wpm": 150.0,
    "speech_rate_wps": 2.5,
    "pause_duration_ms": 500.0,
    "pause_frequency": 0.2,
    "mispronunciation_rate": 0.05,
    "repetition_rate": 0.02,
    "pitch_variation_hz": 20.0,
}

# Temporarily modify dyslexia_profile_inference.py to NOT swallow exceptions if I want to see the error
# but first let's just see if it returns None.
result = predict_profile_scores(dummy_features)
print(f"Prediction result: {result}")
