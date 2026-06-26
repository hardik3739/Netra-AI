"""
ForgeShield — Week 2
OCR Text Extractor

Extracts text from uploaded document images using pytesseract.
Falls back gracefully if tesseract is not installed.

To install Tesseract on Windows:
  Download: https://github.com/UB-Mannheim/tesseract/wiki
  Add to PATH after install.
"""

from PIL import Image
import io

# Try importing pytesseract — graceful fallback if not installed
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
    print("[OCR] pytesseract available [OK]")
except ImportError:
    TESSERACT_AVAILABLE = False
    print("[OCR] pytesseract not found — OCR disabled, using filename-based analysis")


def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extract text from an image file using OCR.
    Returns extracted text string, or empty string on failure.
    """
    if not TESSERACT_AVAILABLE:
        return ""

    try:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")

        # Upscale small images for better OCR accuracy
        w, h = image.size
        if w < 800:
            scale = 800 / w
            image = image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        text = pytesseract.image_to_string(image, lang="eng")
        return text.strip()

    except Exception as e:
        print(f"[OCR] Extraction failed: {e}")
        return ""


def extract_text_from_bytes(file_bytes: bytes, content_type: str) -> str:
    """
    Route to correct extractor based on file type.
    PDF extraction uses basic byte scanning; images use OCR.
    """
    if content_type == "application/pdf":
        # Basic PDF text extraction without pypdf dependency
        try:
            text = file_bytes.decode("latin-1", errors="ignore")
            # Extract readable strings from PDF binary
            import re
            strings = re.findall(r'[A-Za-z0-9₹\s,./\-:@]{10,}', text)
            return " ".join(strings[:200])
        except Exception:
            return ""
    else:
        return extract_text_from_image(file_bytes)
