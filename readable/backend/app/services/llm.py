import json
import logging
from typing import Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

async def get_profile_scores(
    features: dict[str, float], 
    expected_text: str, 
    spoken_text: str
) -> dict[str, float] | None:
    """
    Use GROQ AI to analyze reading metrics and return profile scores.
    """
    # Use the centralized settings object which correctly loads from .env
    api_key = settings.groq_api_key

    if not api_key or "replace_this" in api_key:
        logger.error("GROQ_API_KEY not found or still set to placeholder in .env.")
        return None

    prompt = f"""
    You are an expert Dyslexia Diagnostic Specialist. Analyze the following reading session data and provide scores (0-100) for the student's profile.
    
    EXPECTED TEXT: "{expected_text}"
    SPOKEN TEXT: "{spoken_text}"
    
    METRICS:
    - Reading Speed: {features.get('reading_speed_wpm')} WPM
    - Fixation Duration: {features.get('fixation_duration_ms')} ms
    - Regressions (re-reading): {features.get('regression_count')}
    - Saccade Length: {features.get('saccade_length_deg')}
    - Skipped Word Rate: {features.get('skipped_word_rate')}
    - Speech Rate: {features.get('speech_rate_wps')} words/sec
    - Pause Duration: {features.get('pause_duration_ms')} ms
    - Pause Frequency: {features.get('pause_frequency')}
    - Mispronunciation Rate: {features.get('mispronunciation_rate')}
    - Repetition Rate: {features.get('repetition_rate')}
    - Pitch Variation (Monotone check): {features.get('pitch_variation_hz')} Hz
    
    Based on these metrics, provide a JSON object with exactly these keys and integer values from 0 to 100:
    - phonological_awareness: ability to recognize and manipulate sounds.
    - decoding_ability: ability to apply knowledge of letter-sound relationships to read words.
    - reading_fluency: speed, accuracy, and proper expression.
    - working_memory: ability to hold and process information while reading.
    - attention_focus: consistency and stability of eye fixations.
    
    Return ONLY the JSON object.
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are a specialized diagnostic AI for dyslexia interventions. Return JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"GROQ API error: {response.text}")
                return None
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            scores = json.loads(content)
            
            final_scores = {}
            for key in ["phonological_awareness", "decoding_ability", "reading_fluency", "working_memory", "attention_focus"]:
                val = scores.get(key, 50)
                final_scores[key] = float(max(0, min(100, val)))
                
            logger.info(f"[GROQ ANALYSIS] Scores generated successfully.")
            return final_scores

    except Exception as e:
        logger.error(f"Failed to get scores from GROQ: {e}")
        return None
