import logging
import os
from typing import Any

from groq import AsyncGroq

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a kind, encouraging reading specialist. Your goal is to provide a brief, supportive summary for a child (and their teacher) based on their reading session data.
The summary should be 2-3 sentences long, written in a warm and positive tone.
Mention something they did well and one focus area based on the ML Inferred Profile Scores provided (e.g. Reading Fluency, Decoding Difficulty, Phonological Difficulty, Visual Tracking Difficulty).
Keep it encouraging and kid-friendly."""

async def generate_diagnostic_review(
    accuracy_pct: float,
    speed_wpm: float,
    model_profile_scores: dict[str, float],
    student_name: str | None = None,
    reading_level: str | None = None,
) -> str | None:
    api_key = settings.groq_api_key
    if not api_key:
        # Try reloading settings dynamically to pick up newly added .env keys without server restart
        from app.core.config import Settings
        fresh_settings = Settings()
        api_key = fresh_settings.groq_api_key
        
    if not api_key:
        name_str = student_name if student_name else "the student"
        fluency = model_profile_scores.get('reading_fluency', 0)*100
        decoding = model_profile_scores.get('decoding_difficulty', 0)*100
        return f"{name_str} did a great job today with a reading accuracy of {accuracy_pct:.1f}% and a speed of {speed_wpm:.1f} WPM! The session data suggests an estimated reading fluency of {fluency:.0f}%. We noticed a {decoding:.0f}% decoding difficulty marker, so let's continue practicing phonetic breakdowns to help with sounding out new words."

    try:
        client = AsyncGroq(api_key=api_key)
        
        name_str = student_name if student_name else "the student"
        level_str = f"\n        Current Reading Level: {reading_level}" if reading_level else ""

        # Prepare context for the prompt
        context = f"""
        Student Name: {name_str}{level_str}
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
                {"role": "user", "content": f"Please generate a review for {name_str} with these results: {context}"}
            ],
            temperature=0.7,
            max_tokens=150,
        )

        review_text = completion.choices[0].message.content
        return review_text.strip() if review_text else None

    except Exception as e:
        logger.error(f"Error generating review from Groq: {e}", exc_info=True)
        return None
