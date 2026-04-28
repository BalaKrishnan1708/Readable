import json
import os
from groq import AsyncGroq
from app.stubs import phonetics

# Initialize Groq client
client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY", ""))

async def adapt(content: str, profile: dict[str, object]) -> dict[str, object]:
    """Use Groq AI to adapt and simplify reading content based on student profile."""
    if not content or len(content.strip()) == 0:
        content = "Empty lesson content."
        
    # Build prompt to simplify and chunk text for dyslexia
    prompt = f"""
    You are an expert reading intervention specialist and accessible design expert for students with severe dyslexia.
    Your task is to take the following raw text (which may be messy PDF extraction) and transform it into a highly readable, simplified, and perfectly structured lesson tailored to the student's profile.
    
    Student Profile Context:
    - Reading Level: {profile.get('reading_level', 'Unknown')}
    - Difficult Words they struggle with: {', '.join(profile.get('difficult_words', []))}
    
    STRICT Formatting Rules:
    1. REMOVE ALL special characters, weird symbols, bullet points, asterisks, brackets, or OCR artifacts. Only use basic punctuation (periods, commas, question marks, exclamation points).
    2. Simplify the vocabulary. Use common, decodable words instead of complex jargon, but keep the core meaning intact.
    3. Break long, winding sentences into very short, punchy sentences. One thought per sentence.
    4. Make the text flow logically and sequentially so it is extremely easy to read.
    5. Format the output STRICTLY as a JSON object with a single key "segments" containing an array of strings. 
    6. Each string in the array MUST be a small, easily digestible "chunk" of text (exactly 1 to 2 short sentences).
    
    Raw Text:
    {content[:3000]} # Limit to 3000 chars
    
    Output ONLY valid JSON. Example:
    {{
      "segments": [
        "There was a brave robot.",
        "He loved the big city.",
        "He went for a walk."
      ]
    }}
    """
    
    try:
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        response_text = completion.choices[0].message.content
        parsed = json.loads(response_text)
        segments = parsed.get("segments", [])
        
        if not segments:
            segments = [content]
            
    except Exception as e:
        print(f"Groq API Error: {e}")
        # Fallback to naive splitting if AI fails
        sentences = [segment.strip() for segment in content.split(".") if segment.strip()]
        segments = [
            ". ".join(sentences[index : index + 2]).strip() + "."
            for index in range(0, len(sentences), 2)
        ]

    # Use the existing stubbed phonetics generator for the difficult words
    syllable_breaks = {"difficult": "dif-fi-cult", "butterflies": "but-ter-flies"}
    phonetic_support = await phonetics.generate_pronunciations(content, syllable_breaks)
    
    return {
        "segments": segments,
        "syllable_breaks": syllable_breaks,
        "phonetic_support": phonetic_support,
        "font_size": 18,
        "line_spacing": 1.8,
        "chunk_size": 2,
        "chunk_mode": "paired-sentences",
    }
