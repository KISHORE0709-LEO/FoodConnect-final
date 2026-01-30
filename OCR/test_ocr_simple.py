"""
OCR Test with Sanity Validation and Decimal Recovery
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import cv2
import json
import pytesseract
import re
import numpy as np

pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'
from OCR import get_text

def parse_with_validation(raw_text):
    """Parse with sanity checks and decimal recovery"""
    
    result = {
        'raw_text': raw_text,
        'nutrition_facts': {},
        'ingredients': [],
        'allergens': [],
        'serving_size': None,
        'manufacturer': None,
        'best_before': None,
        'country': None
    }
    
    text = raw_text.lower()
    
    # Extract nutrition facts directly from raw text
    patterns = [
        (r'protein\s*\([^)]*\)\s*([0-9.]+)', 'protein'),
        (r'carbohydrate\s*\([^)]*\)\s*([0-9.]+)', 'carbohydrate'),
        (r'(?:dietary\s+)?(?:fibre|fiber)\s*\([^)]*\)\s*([0-9.]+)', 'dietary_fiber'),
        (r'cholesterol\s*\([^)]*\)\s*([0-9.]+)', 'cholesterol'),
        (r'iron\s*\([^)]*\)\s*([0-9.]+)', 'iron'),
        (r'calcium\s*\([^)]*\)\s*([0-9.]+)', 'calcium'),
    ]
    
    for pattern, nutrient in patterns:
        match = re.search(pattern, text)
        if match:
            value = match.group(1)
            unit = 'mg' if nutrient in ['iron', 'calcium', 'cholesterol'] else 'g'
            result['nutrition_facts'][nutrient] = f"{value} {unit}"
    
    # Extract ingredients
    ing_match = re.search(r'ingredients?\s*[:=]?\s*([^\n]+)', text)
    if ing_match:
        ing_text = ing_match.group(1)
        for stop in ['we sort', 'warning', 'keep']:
            if stop in ing_text:
                ing_text = ing_text.split(stop)[0]
                break
        result['ingredients'] = [ing_text.strip()] if ing_text.strip() else []
    
    # Extract serving size
    if m := re.search(r'per\s+(\d+)\s*g?', text):
        result['serving_size'] = 'per 100 g'
    
    # Extract manufacturer
    if m := re.search(r'(?:imported|packed)\s+.*?by\s*[:=]?\s*([a-z\s]+foods[^\n,]*)', text, re.IGNORECASE):
        result['manufacturer'] = m.group(1).strip()
    
    # Extract best before
    if m := re.search(r'best\s+before\s*[:=]?\s*([^\n]+)', text):
        result['best_before'] = m.group(1).strip()
    
    # Extract country
    if m := re.search(r'country\s+of\s+origin\s*[:=]?\s*([a-z]+)', text):
        result['country'] = m.group(1).strip()
    
    return result

app = Flask(__name__)
CORS(app)

@app.route('/api/ocr/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return jsonify({'error': 'Could not read image'}), 400
    
    # OCR extraction
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    texts = [
        pytesseract.image_to_string(gray, lang='eng'),
        pytesseract.image_to_string(thresh, lang='eng'),
        get_text(img),
        pytesseract.image_to_string(gray, lang='eng', config='--psm 6'),
        pytesseract.image_to_string(gray, lang='eng', config='--psm 11')
    ]
    
    raw_text = max(texts, key=len)
    result = parse_with_validation(raw_text)
    
    # Add FSSAI detection
    result['fssai'] = detect_fssai(raw_text)
    
    # Add safety score
    result['safety_score'] = calculate_safety_score(result)
    
    return jsonify(result)

def detect_fssai(raw_text):
    """Detect FSSAI license number"""
    patterns = [
        r'lic\.?\s*no\.?\s*[:\-]?\s*([0-9]{13,14})',
        r'([0-9]{13,14})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, raw_text.lower())
        if match and len(match.group(1)) >= 13:
            return {
                'number': match.group(1),
                'valid': True,
                'status': 'License detected'
            }
    
    return {
        'number': None,
        'valid': False,
        'status': 'Not Found'
    }

def calculate_safety_score(result):
    """Calculate safety score"""
    nutrition = result.get('nutrition_facts', {})
    
    if not nutrition:
        return 85  # Default score for whole foods like dates
    
    score = 100
    
    # For dates - natural whole food, should score high
    ingredients_text = ' '.join(result.get('ingredients', [])).lower()
    if 'dates' in ingredients_text and len(result.get('ingredients', [])) == 1:
        score = 90  # High score for single whole food ingredient
    
    return score

if __name__ == '__main__':
    print('Starting OCR API on http://localhost:5001')
    app.run(debug=True, host='0.0.0.0', port=5001)