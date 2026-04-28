import io
import base64
import logging

logger = logging.getLogger(__name__)

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

async def extract(file_bytes: bytes, mime_type: str) -> str:
    """Extract plain text from uploaded files using PyMuPDF for PDFs and Groq Vision for images."""
    if not file_bytes:
        return ""
        
    from app.services.llm import extract_vision_ocr

    # 1. Handle PDF files
    if mime_type == "application/pdf" or "pdf" in mime_type.lower():
        if not fitz:
            return "Error: PyMuPDF is not installed. Please install fitz (PyMuPDF)."
        try:
            # Open PDF from bytes
            pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
            extracted_text = ""
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                page_text = page.get_text("text").strip()
                
                # If text extraction is empty, try OCR using Groq Vision
                if not page_text:
                    try:
                        pix = page.get_pixmap(dpi=150)
                        img_bytes = pix.tobytes("jpeg")
                        img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                        vision_text = await extract_vision_ocr(img_b64)
                        if vision_text:
                            page_text = vision_text
                    except Exception as vision_e:
                        logger.error(f"Vision OCR failed for page {page_num}: {vision_e}")

                extracted_text += page_text + "\n\n"
            
            return _clean_text(extracted_text)
        except Exception as e:
            logger.error(f"Error extracting PDF: {str(e)}")
            return f"Error extracting PDF: {str(e)}"
    
    # 2. Handle Image files (OCR for character extraction)
    if "image" in mime_type.lower():
        try:
            logger.info(f"Extracting characters from image ({mime_type}) using Groq Vision OCR...")
            img_b64 = base64.b64encode(file_bytes).decode('utf-8')
            vision_text = await extract_vision_ocr(img_b64)
            if vision_text:
                return _clean_text(vision_text)
            return "No text could be extracted from this image."
        except Exception as e:
            logger.error(f"Image OCR extraction failed: {str(e)}")
            return f"Error extracting image: {str(e)}"

    # 3. Fallback for other file types or plain text
    try:
        return _clean_text(file_bytes.decode("utf-8"))
    except Exception:
        return "Unsupported file format or unreadable text."

def _clean_text(text: str) -> str:
    import re
    # Keep alphanumeric characters, standard punctuation, and whitespace
    cleaned_text = re.sub(r'[^\w\s.,?!;:\'"()-]', '', text)
    # Collapse multiple spaces into one, keeping paragraphs
    cleaned_text = re.sub(r'[ \t]+', ' ', cleaned_text)
    return cleaned_text.strip()

