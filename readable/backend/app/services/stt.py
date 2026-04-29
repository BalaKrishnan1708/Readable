import asyncio
import functools
import logging
import tempfile
from pathlib import Path

import whisper
import torch

logger = logging.getLogger(__name__)

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
    
    if not audio_bytes or len(audio_bytes) < 100:
        logger.warning("STT: Received empty or too short audio bytes. Skipping transcription.")
        return ""

    if _model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model = whisper.load_model("base", device=device)

    return await transcribe_with_metadata(audio_bytes)


async def transcribe_with_metadata(
    audio_bytes: bytes,
    filename: str | None = None,
    content_type: str | None = None,
) -> str:
    """
    Transcribe audio bytes using the local Whisper model while preserving the
    original container extension when available.
    """
    global _model

    if not audio_bytes or len(audio_bytes) < 100:
        logger.warning("STT: Received empty or too short audio bytes. Skipping transcription.")
        return ""

    if _model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model = whisper.load_model("base", device=device)

    suffix = _resolve_audio_suffix(filename, content_type)

    # Whisper requires a file path or a numpy array.
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        # Run whisper in a thread pool as it is a CPU/GPU intensive blocking call
        loop = asyncio.get_running_loop()
        
        # We provide the expected text as a initial_prompt to guide the model
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
    except Exception as e:
        logger.error(f"STT transcription failed: {e}")
        return ""
    finally:
        # Cleanup temporary file
        if Path(tmp_path).exists():
            Path(tmp_path).unlink()


def _resolve_audio_suffix(filename: str | None, content_type: str | None) -> str:
    if filename:
        suffix = Path(filename).suffix.strip()
        if suffix:
            return suffix

    if content_type:
        mapping = {
            "audio/webm": ".webm",
            "audio/webm;codecs=opus": ".webm",
            "audio/wav": ".wav",
            "audio/x-wav": ".wav",
            "audio/mpeg": ".mp3",
            "audio/mp3": ".mp3",
            "audio/ogg": ".ogg",
            "audio/ogg;codecs=opus": ".ogg",
        }
        if content_type in mapping:
            return mapping[content_type]

    return ".wav"
