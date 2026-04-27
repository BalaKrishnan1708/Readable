"""
Simple in-memory reader endpoint.
The browser extension POSTs selected text here.
The React /reader page GETs the latest text.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# In-memory store — one slot is enough for real-time use
_store: dict = {}


class ReaderPushRequest(BaseModel):
    text: str
    source_url: str = ""
    source_title: str = ""


@router.post("/push")
async def push_text(body: ReaderPushRequest):
    """Called by the browser extension when the user right-clicks → Open in Readable."""
    _store["payload"] = {
        "text": body.text,
        "sourceUrl": body.source_url,
        "sourceTitle": body.source_title,
        "timestamp": __import__("time").time() * 1000,
    }
    return {"ok": True}


@router.get("/latest")
async def get_latest():
    """Polled by the React /reader page to pick up the text."""
    if "payload" not in _store:
        return {"payload": None}
    return {"payload": _store["payload"]}
