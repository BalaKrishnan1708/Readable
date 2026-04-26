import asyncio
import functools
import tempfile
from pathlib import Path

import whisper
import torch

# Global model cache to avoid reloading on every request
_model = None
_expected_text = ""

def prime_expected_text(expected_text: str) -> None:
    global _expected_text
    _expected_text = expected_text

async def transcribe(audio_bytes: bytes) -> str:
    """
    Transcribe audio bytes using OpenAI Whisper.
    Uses a thread pool to avoid blocking the event loop.
    """
    global _model
    
    if _model is None:
        # Using "base" for a good balance of speed and accuracy. 
        # "tiny" is faster but less accurate.
        # "base.en" is optimized for English.
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model = whisper.load_model("base", device=device)

    # Whisper requires a file path or a numpy array. 
    # We'll use a temporary file for simplicity and robustness.
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        # Run whisper in a thread pool as it is a CPU/GPU intensive blocking call
        loop = asyncio.get_running_loop()
        
        # We provide the expected text as a initial_prompt to guide the model, 
        # which is very helpful for dyslexia interventions where pronunciation might be off.
        result = await loop.run_in_executor(
            None, 
            functools.partial(
                _model.transcribe, 
                tmp_path, 
                initial_prompt=_expected_text if _expected_text else None,
                language="en"
            )
        )
        return result["text"].strip()
    finally:
        # Cleanup temporary file
        if Path(tmp_path).exists():
            Path(tmp_path).unlink()
