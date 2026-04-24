import asyncio


async def extract(file_bytes: bytes, mime_type: str) -> str:
    """Return mock extracted lesson text that a real OCR service would recover from files."""
    # STUB - replace with real model
    # TODO: Replace stub with an OCR pipeline that handles PDFs, scans, and classroom worksheet images.
    await asyncio.sleep(0.3)
    return (
        "Readable lesson content extracted from the uploaded file. "
        "This placeholder passage is ready for future OCR replacement."
    )
