import logging
import os
from typing import Any

from groq import AsyncGroq

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a kind, encouraging reading specialist. Your goal is to provide a brief, supportive summary for a child (and their teacher) based on their reading session data.
The summary should be 2-3 sentences long, written in a warm and positive tone.
Mention something they did well and one focus area based on the scores provided.
Keep it encouraging and kid-friendly."""

async def generate_diagnostic_review(
    accuracy_pct: float,
    speed_wpm: float,
    model_profile_scores: dict[str, float]
) -> str | None:
    api_key = settings.groq_api_key
    if not api_key:
        logger.warning("GROQ_API_KEY not found in settings. Skipping review generation.")
        return None

    try:
        client = AsyncGroq(api_key=api_key)
        
        # Prepare context for the prompt
        context = f"""
        Reading Accuracy: {accuracy_pct:.1f}%
        Reading Speed: {speed_wpm:.1f} WPM
        Inferred Profile Scores:
        - Reading Fluency: {model_profile_scores.get('reading_fluency', 0)*100:.0f}%
        - Decoding Difficulty: {model_profile_scores.get('decoding_difficulty', 0)*100:.0f}%
        - Phonological Difficulty: {model_profile_scores.get('phonological_difficulty', 0)*100:.0f}%
        - Visual Tracking Difficulty: {model_profile_scores.get('visual_difficulty', 0)*100:.0f}%
        """

        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Please generate a review for a student with these results: {context}"}
            ],
            temperature=0.7,
            max_tokens=150,
        )

        review_text = completion.choices[0].message.content
        return review_text.strip() if review_text else None

    except Exception as e:
        logger.error(f"Error generating review from Groq: {e}", exc_info=True)
        return None
