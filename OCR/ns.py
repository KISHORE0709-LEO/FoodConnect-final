import cv2
import numpy as np
import pytesseract
import re
from PIL import Image

def get_ns_text(image):
    """Simple OCR without NLTK dependency"""
    try:
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            
        # Apply threshold
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # OCR
        text = pytesseract.image_to_string(thresh, lang='eng')
        return text.strip()
    except Exception as e:
        print(f"OCR error: {e}")
        return ""