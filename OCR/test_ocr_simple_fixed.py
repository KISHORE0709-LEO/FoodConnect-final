"""
OCR Test with Sanity Validation and Decimal Recovery - FIXED VERSION
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

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
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
    
    # Clean garbage - FIXED: less aggressive filtering
    lines = [l.strip() for l in raw_text.split('\n')]
    cleaned = []
    for line in lines:
        if len(line) < 2:
            continue
        alnum = sum(c.isalnum() or c.isspace() for c in line)
        special = sum(not (c.isalnum() or c.isspace()) for c in line)
        if alnum < 3:
            continue
        if special / max(len(line), 1) > 0.7:  # FIXED: was 0.5
            continue
        if re.match(r'^[^a-zA-Z]*$', line):
            continue
        cleaned.append(line)
    
    text = '\n'.join(cleaned).lower()
    orig_text = raw_text.lower()
    
    # Sanity ranges per 100g
    ranges = {
        'protein': (0, 30, 'g'),
        'carbohydrate': (0, 100, 'g'),
        'total_fat': (0, 100, 'g'),
        'dietary_fiber': (0, 15, 'g'),
        'sugar': (0, 100, 'g'),
        'cholesterol': (0, 300, 'mg'),
        'sodium': (0, 5000, 'mg'),
        'iron': (0, 20, 'mg'),
        'calcium': (0, 150, 'mg')
    }
    
    def fix_decimal(val, nutrient):
        """Fix missing decimals using sanity ranges"""
        try:
            v = float(val)
            min_v, max_v, unit = ranges.get(nutrient, (0, 1000, 'g'))
            
            if v > max_v and min_v <= v/10 <= max_v:
                return str(v/10), unit, 'low_confidence'
            elif v > max_v and min_v <= v/100 <= max_v:
                return str(v/100), unit, 'low_confidence'
            
            return val, unit, 'high_confidence'
        except:
            return val, 'g', 'low_confidence'
    
    # Position-aware extraction - FIXED patterns
    patterns = [
        (r'protein\s*\([^)]*\)\s*([0-9.]+)', 'protein'),
        (r'carbohydrate\s*\([^)]*\)\s*([0-9.]+)', 'carbohydrate'),
        (r'(?:dietary\s+)?(?:fibre|fiber)\s*\([^)]*\)\s*([0-9.]+)', 'dietary_fiber'),
        (r'cholesterol\s*\([^)]*\)\s*([0-9.]+)', 'cholesterol'),
        (r'iron\s*\([^)]*\)\s*([0-9.]+)', 'iron'),
        (r'calcium\s*\([^)]*\)\s*([0-9.]+)', 'calcium'),
    ]
    
    for pattern, nutrient in patterns:
        match = re.search(pattern, orig_text)
        if match:
            value, unit, conf = fix_decimal(match.group(1), nutrient)
            marker = ' (!)' if conf == 'low_confidence' else ''
            result['nutrition_facts'][nutrient] = f"{value} {unit}{marker}"
    
    # FIXED: Simple ingredient extraction
    ing_match = re.search(r'ingredients?\s*[:=]?\s*([^\n]+)', text)
    if ing_match:
        ing_text = ing_match.group(1)
        # Stop at first stop word
        for stop in ['we sort', 'warning', 'keep']:
            if stop in ing_text:
                ing_text = ing_text.split(stop)[0]
                break
        
        result['ingredients'] = [ing_text.strip()] if ing_text.strip() else []
    
    # Allergens
    for allergen in ['milk', 'egg', 'peanut', 'soy', 'wheat', 'fish', 'shellfish', 'sesame', 'gluten']:
        if re.search(rf'\b{allergen}s?\b', text):
            result['allergens'].append(allergen)
    
    # Extract serving size
    serving_patterns = [
        r'per\s+(\d+)\s*[06]?\s*g?',
    ]
    for pattern in serving_patterns:
        if m := re.search(pattern, orig_text):
            val = m.group(1)
            if val in ['10', '100', '1006', '1000', '1']:
                result['serving_size'] = 'per 100 g'
            else:
                result['serving_size'] = f"per {val} g"
            break
    
    # Extract manufacturer
    mfg_patterns = [
        r'(?:imported|packed)\s+(?:and\s+packed\s+)?by\s*[:=]?\s*\n?\s*([a-z\s]+(?:foods|company|ltd|pvt|inc)[^\n,]*)',
        r'([a-z\s]+(?:foods|ltd|pvt)(?:\s+(?:ltd|pvt))?[^\n,]*?)(?=\s*,\s*\d|\n)',
    ]
    for pattern in mfg_patterns:
        if m := re.search(pattern, text, re.IGNORECASE):
            mfr = m.group(1).strip()
            mfr = re.sub(r'(keep|finest|selection|premium|middle|eastern).*', '', mfr, flags=re.IGNORECASE).strip()
            if len(mfr) > 5:
                result['manufacturer'] = mfr
                break
    
    if m := re.search(r'best\s+before\s*[:=]?\s*([^\n]+)', text):
        result['best_before'] = m.group(1).strip()
    
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
    """FIXED: Better FSSAI detection patterns"""
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
    """FIXED: Safety score with nutrition check"""
    nutrition = result.get('nutrition_facts', {})
    
    # FIXED: Return None if no nutrition data
    if not nutrition:
        return None
    
    score = 100
    
    # Sugar penalty
    sugar_str = nutrition.get('sugar', '0')
    sugar = float(re.search(r'([0-9.]+)', sugar_str).group(1)) if re.search(r'([0-9.]+)', sugar_str) else 0
    if sugar > 10:
        score -= 15
    
    # Fat penalty  
    fat_str = nutrition.get('total_fat', '0')
    fat = float(re.search(r'([0-9.]+)', fat_str).group(1)) if re.search(r'([0-9.]+)', fat_str) else 0
    if fat > 30:
        score -= 10
    elif fat > 5:
        score -= 5
    
    # Sodium penalty
    sodium_str = nutrition.get('sodium', '0')
    sodium = float(re.search(r'([0-9.]+)', sodium_str).group(1)) if re.search(r'([0-9.]+)', sodium_str) else 0
    if sodium > 400:
        score -= 10
    
    # Processing penalty
    ingredients_text = ' '.join(result.get('ingredients', [])).lower()
    if any(word in ingredients_text for word in ['emulsifier', 'artificial', 'preservative']):
        score -= 10
    
    # Allergen penalty
    allergen_count = len(result.get('allergens', []))
    if allergen_count > 0:
        score -= allergen_count * 5
    
    return max(0, score)

if __name__ == '__main__':
    print('Starting OCR API on http://localhost:5000')
    app.run(debug=True, host='0.0.0.0', port=5000)