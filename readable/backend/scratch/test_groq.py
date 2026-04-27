import asyncio
import os
from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

async def test():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("NO KEY")
        return
        
    client = AsyncGroq(api_key=api_key)
    try:
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=50,
        )
        print("SUCCESS:", completion.choices[0].message.content)
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    asyncio.run(test())
