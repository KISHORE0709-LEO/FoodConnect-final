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

def fix_decimal(value):
    """
    Fix OCR decimal issues like 5269 -> 52.69
    """
    if value >= 100:
        return value / 100
    return value


def parse_number(token):
    """Parse a numeric token returned by OCR, handling commas and common OCR smashes.

    Returns a tuple (value: float, raw_unit: str|None)
    """
    if token is None:
        return None, None

    s = str(token).lower().strip()
    # remove stray plus/minus
    s = re.sub(r"[^0-9\.,kgm]", "", s)

    # unit detection
    unit = None
    if s.endswith('mg'):
        unit = 'mg'
        s = s[:-2]
    elif s.endswith('g'):
        unit = 'g'
        s = s[:-1]

    # Normalize comma as thousand/decimal depending on context
    # If more than one comma, remove thousands commas
    if s.count(',') > 1:
        s = s.replace(',', '')
    # If there's a comma and no dot, treat comma as decimal
    if ',' in s and '.' not in s:
        s = s.replace(',', '.')

    try:
        val = float(s)
    except Exception:
        # fallback: remove non-digits and try
        digits = re.sub(r'[^0-9.]', '', s)
        if digits == '':
            return None, unit
        val = float(digits)

    return val, unit
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
from OCR import get_text

def choose_best_text(texts):
    """Choose best OCR text based on content quality"""
    scores = []
    for t in texts:
        score = 0
        if 'nutrition' in t.lower(): score += 2
        if 'ingredients' in t.lower(): score += 2
        if 'energy' in t.lower(): score += 1
        if len(t) > 200: score += 1
        scores.append((score, t))
    return max(scores, key=lambda x: x[0])[1]
    
def normalize_ingredient(text):
    text = text.lower().strip()

    fixes = {
        'vegetanle': 'vegetable',
        'vegetable oill': 'vegetable oil',
        'oi': 'oil',
        'oill': 'oil',
        'palmolein oi': 'palmolein oil',

        # 🔴 CRITICAL FIX FOR SALT
        'lodised': 'iodised',
        'lodized': 'iodised',
        'iodized': 'iodised',
        'iodise': 'iodised',
        'iodise salt': 'iodised salt',
        'lodised salt': 'iodised salt',
        'lodized salt': 'iodised salt',
    }

    # Apply replacements with word boundaries and longest-first to avoid overlapping replacements
    for wrong in sorted(fixes.keys(), key=lambda x: -len(x)):
        correct = fixes[wrong]
        text = re.sub(r"\b" + re.escape(wrong) + r"\b", correct, text)

    return text.strip()


def capitalize_ingredient(text):
    return ' '.join(word.capitalize() for word in text.split())

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
    
    # Improved nutrition extraction: patterns include unit tokens and capture numeric token
    nutrition_patterns = {
        'energy_kcal': r'(?:energy|ener)\b[^\d\n]{0,12}([0-9][0-9,\.]{0,6})\s*(kcal|cal)?',
        'protein_g': r'(?:protein|prt)\b[^\d\n]{0,12}([0-9][0-9,\.]{0,6})\s*(g)?',
        'carbohydrate_g': r'carbohydrate\b[^\d\n]{0,12}([0-9][0-9,\.]{0,6})\s*(g)?',
        'total_fat_g': r'(?:total\s+fat|totalfat|fat\s*total)\b[^\d\n]{0,12}([0-9][0-9,\.]{0,6})\s*(g)?',
        'saturated_fat_g': r'saturated\b[^a-z]{0,5}fat\b[^\d\n]{0,12}([0-9][0-9,\.]{0,6})\s*(g)?',
        'trans_fat_g': r'trans\b[^a-z]{0,5}fat\b[^\d\n]{0,12}([0-9][0-9,\.]{0,6})\s*(g)?',
        'sodium_mg': r'sodium\b[^\d\n]{0,12}([0-9][0-9,\.]{0,8})\s*(mg|g)?',
        'added_sugar_g': r'added\s*sugar[s]?\b[^\d\n]{0,12}([0-9][0-9,\.]{0,6})\s*(g)?',
        'total_sugar_g': r'total\s*sugar[s]?\b[^\d\n]{0,12}([0-9][0-9,\.]{0,6})\s*(g)?'
    }

    for key, pattern in nutrition_patterns.items():
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            continue

        num_token = match.group(1)
        unit_token = None
        if match.lastindex and match.lastindex >= 2:
            unit_token = match.group(2)

        val, detected_unit = parse_number(num_token)
        unit = (unit_token or detected_unit or '').lower()

        if val is None:
            continue

        # Normalize units: convert g -> keep as g, convert g to mg for sodium if needed
        if key == 'sodium_mg':
            if unit == 'g':
                val = val * 1000
            # if no unit and val < 2000 assume mg (common on labels)
            elif unit == '' and val > 0 and val < 2000:
                pass
            # don't apply fix_decimal to sodium
        else:
            # apply decimal recovery for gram values when OCR squashes decimals
            if unit in ('g', '') and val >= 100:
                val = val / 100.0

        # Sanity checks
        if key == 'trans_fat_g' and val > 10:
            continue
        if key == 'added_sugar_g' and val > 100:
            continue
        if key == 'protein_g' and val > 500:
            continue

        result['nutrition_facts'][key] = round(val, 2)

    # Secondary pass: proximity-based assignment for OCR-mangled labels
    if result['nutrition_facts']:
        # collect numeric tokens with spans
        numeric_re = re.finditer(r'([0-9][0-9,\.]{0,8})\s*(mg|g|kcal|cal)?', text, flags=re.IGNORECASE)
        nums = []
        for m in numeric_re:
            nums.append((m.start(), m.end(), m.group(1), (m.group(2) or '').lower()))

        synonyms = {
            'total_fat_g': ['total f', 'totalf', 'total fat', 'total: f', 'total:fat', 'total:f', 'total f:'],
            'saturated_fat_g': ['saturated', 'soturated', 'soturated fat', 'soturated', 'satruated'],
            'trans_fat_g': ['trans fat', 'transf', 'trans fat o', 'transfat'],
            'sodium_mg': ['sodium', 'sec', 'sot', 'sod', 'na', 'salt'],
            'added_sugar_g': ['added sugar', 'added sas', 'assad sas', 'added sac'],
            'total_sugar_g': ['total sugar', 'total s', 'total: sugar']
        }

        for key, keysyn in synonyms.items():
            if key in result['nutrition_facts']:
                continue
            # look for any numeric token with a synonym within 40 chars before it
            assigned = None
            for (spos, epos, token, unit) in nums:
                window_start = max(0, spos - 40)
                context = text[window_start:spos]
                for syn in keysyn:
                    if syn in context:
                        val, detected_unit = parse_number(token)
                        if val is None:
                            continue
                        # convert units where necessary
                        if key == 'sodium_mg' and (detected_unit == 'g' or unit == 'g'):
                            val = val * 1000
                        elif key.endswith('_g') and (detected_unit in ('', 'g') or unit in ('', 'g')):
                            if val >= 100:
                                val = val / 100.0
                        result['nutrition_facts'][key] = round(val, 2)
                        assigned = True
                        break
                if assigned:
                    break

    
    # FIXED: Hard stop ingredients extraction
    ing_match = re.search(r'ingredients?\s*[:\-]?\s*(.+)', text)
    if ing_match:
        ing_text = ing_match.group(1)

        STOP_PATTERNS = [
            r'nutrition',
            r'nutritional',
            r'mrp',
            r'fssai',
            r'net\s*qty',
            r'pack',
            r'unit\s*sale',
            r'mfd',
            r'use\s*by',
            r'approx',
            r'flavour',
            r'facebook',
            r'www'
        ]

        for stop in STOP_PATTERNS:
            ing_text = re.split(stop, ing_text)[0]

        ingredients = re.split(r',|\n|\(|\)', ing_text)

        cleaned = []
        for i in ingredients:
            piece = i.strip()
            if not piece:
                continue
            # Remove trailing sentences after a period or long run-on text
            piece = piece.split('.')[0].strip()
            # Also truncate at excessive whitespace sequences
            piece = re.split(r'\s{2,}', piece)[0].strip()
            if 2 < len(piece) < 60:
                cleaned.append(capitalize_ingredient(normalize_ingredient(piece)))

        result['ingredients'] = cleaned

        # Keyword fallback: ensure 'iodised salt' or variants are captured
        ing_lower = ' '.join([s.lower() for s in result['ingredients']])
        if 'salt' not in ing_lower:
            m = re.search(r'([a-z]{0,15}\s*(?:lodised|lodized|iodised|iodized|iodise|iodize)?\s*salt)\b', ing_text, flags=re.IGNORECASE)
            if m:
                candidate = capitalize_ingredient(normalize_ingredient(m.group(1).strip()))
                if candidate not in result['ingredients']:
                    result['ingredients'].append(candidate)
    else:
        # Fallback heuristic: look for long comma-separated lines that look like ingredient lists
        lines = [l.strip() for l in raw_text.splitlines() if len(l.strip()) > 20]
        for line in lines:
            if line.count(',') >= 2 and any(k in line.lower() for k in ['salt', 'sugar', 'oil', 'flour', 'wheat', 'milk']):
                ingredients = re.split(r',|\(|\)', line)
                result['ingredients'] = [
                    capitalize_ingredient(normalize_ingredient(i.strip()))
                    for i in ingredients
                    if 2 < len(i.strip()) < 40
                ]
                break


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
    
    # Post-process nutrition facts for frontend compatibility and obvious OCR errors
    nf = result.get('nutrition_facts', {})

    # Frontend expects `sugar_g` (used for Added Sugars display). Prefer added_sugar_g then total_sugar_g
    if 'sugar_g' not in nf:
        nf['sugar_g'] = nf.get('added_sugar_g') if nf.get('added_sugar_g') is not None else nf.get('total_sugar_g')

    # Fix likely OCR-mangled trans fat like `19` that should be 0.19
    if 'trans_fat_g' in nf and nf['trans_fat_g'] is not None:
        tf = nf['trans_fat_g']
        if tf > 5 and tf < 100:
            nf['trans_fat_g'] = round(tf / 100.0, 2)

    # If sodium looks implausibly large (>1500 mg), try to find a closer mg token near sodium/sec/salt
    if 'sodium_mg' in nf and nf['sodium_mg'] is not None and nf['sodium_mg'] > 1500:
        # search for numeric mg tokens and choose the one closest to sodium-like words
        sodium_keywords = [m.start() for m in re.finditer(r'sodium|sec|salt|\bna\b|sod', text, flags=re.IGNORECASE)]
        best_candidate = None
        best_dist = None
        for m in re.finditer(r'([0-9]{2,4})\s*(mg|m)?', text, flags=re.IGNORECASE):
            try:
                val = int(re.sub(r'[^0-9]', '', m.group(1)))
            except Exception:
                continue
            if not (50 <= val <= 2000):
                continue
            span_start = m.start()
            if not sodium_keywords:
                continue
            dist = min(abs(span_start - k) for k in sodium_keywords)
            if dist <= 60 and (best_dist is None or dist < best_dist):
                best_dist = dist
                best_candidate = val
        if best_candidate:
            nf['sodium_mg'] = best_candidate

    result['nutrition_facts'] = nf

    return result

app = Flask(__name__)
CORS(app)

@app.route('/api/generic/analyze', methods=['POST'])
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
    
    raw_text = "\n".join(set(t for t in texts if len(t) > 50))

    result = parse_with_validation(raw_text)

    # Ensure salt/iodised salt is present in ingredientAnalysis (extra safety fallback)
    if result.get('ingredients'):
        ing_lower = [i.lower() for i in result['ingredients']]
        if not any('salt' in s for s in ing_lower):
            m = re.search(r'([a-z]{0,15}\s*(?:lodised|lodized|iodised|iodized|iodise|iodize)?\s*salt)\b', raw_text, flags=re.IGNORECASE)
            if m:
                candidate = capitalize_ingredient(normalize_ingredient(m.group(1).strip()))
                if candidate not in result['ingredients']:
                    result['ingredients'].append(candidate)
    
    # Add FSSAI detection
    result['fssai'] = detect_fssai(raw_text)
    
    # Add safety score
    result['safety_score'] = calculate_safety_score(result)
    
    # Format for frontend
    formatted_result = {
        'success': True,
        'productName': 'Food Product',
        'ingredientAnalysis': [{
            'ingredient': ing,
            'name': ing,
            'category': 'ingredient',
            'risk': 'low',
            'description': '',
            'toxicity_score': 20
        } for ing in result.get('ingredients', [])],
        'nutriScore': {
            'grade': 'B',
            'score': result['safety_score'],
            'color': 'green'
        },
        'nutrition': {
            'healthScore': result['safety_score'],
            'safetyLevel': 'Safe',
            'totalIngredients': len(result.get('ingredients', [])),
            'toxicIngredients': 0,
            'per100g': {
                'energy_kcal': result['nutrition_facts'].get('energy_kcal'),
                'protein_g': result['nutrition_facts'].get('protein_g'),
                'carbohydrate_g': result['nutrition_facts'].get('carbohydrate_g'),
                'total_sugar_g': result['nutrition_facts'].get('total_sugar_g'),
                'added_sugar_g': result['nutrition_facts'].get('added_sugar_g'),
                'sugar_g': result['nutrition_facts'].get('sugar_g'),
                'total_fat_g': result['nutrition_facts'].get('total_fat_g'),
                'saturated_fat_g': result['nutrition_facts'].get('saturated_fat_g'),
                'trans_fat_g': result['nutrition_facts'].get('trans_fat_g'),
                'sodium_mg': result['nutrition_facts'].get('sodium_mg')
            }
        },
        # Friendly display map with exact keys the frontend expects
        'per100g_display': {
            'Energy (kcal)': result['nutrition_facts'].get('energy_kcal'),
            'Protein (g)': result['nutrition_facts'].get('protein_g'),
            'Carbohydrate (g)': result['nutrition_facts'].get('carbohydrate_g'),
            'Total Sugars (g)': result['nutrition_facts'].get('total_sugar_g'),
            'Added Sugars (g)': result['nutrition_facts'].get('added_sugar_g'),
            'Total Fat (g)': result['nutrition_facts'].get('total_fat_g'),
            'Saturated Fat (g)': result['nutrition_facts'].get('saturated_fat_g'),
            'Trans Fat (g)': result['nutrition_facts'].get('trans_fat_g'),
            'Sodium (mg)': result['nutrition_facts'].get('sodium_mg')
        },
        'recommendations': generate_recommendations(result),
        'fssai': result['fssai'],
        'summary': 'Analysis complete',
        'ocrData': result
    }
    
    return jsonify(formatted_result)
def detect_fssai(raw_text):
    text = raw_text.lower()
    compact = re.sub(r'[^a-z0-9]', '', text)

    # Look for "fssai" or "lic"
    if 'fssai' in compact or 'lic' in compact:
        m = re.search(r'(\d{13,14})', compact)
        if m:
            return {
                'number': m.group(1),
                'valid': True,
                'status': 'FSSAI license detected'
            }

    return {
        'number': None,
        'valid': False,
        'status': 'Not Found'
    }


def calculate_safety_score(result):
    ingredients = result.get('ingredients', [])
    nutrition = result.get('nutrition_facts', {})

    ingredients_text = ' '.join(ingredients).lower()

    # 1️⃣ Nutrition missing
    if not nutrition:
        return 60

    score = 100

    # Penalize partial nutrition
    if len(nutrition) < 4:
        score -= 15

    # Whole food
    if len(ingredients) == 1 and ingredients_text in ['dates', 'rice', 'wheat', 'oats']:
        return 90

    # Ultra-processed
    if 'oil' in ingredients_text:
        score -= 20

    # High fat
    total_fat = nutrition.get('total_fat_g', 0)
    if total_fat and total_fat > 30:
        score -= 15

    # High sodium
    sodium = nutrition.get('sodium_mg')

    # Penalize high OR missing sodium for ultra-processed foods
    if sodium is None and 'oil' in ingredients_text:
        score -= 10
    elif sodium and sodium > 400:
        score -= 10

    # Many ingredients
    if len(ingredients) > 3:
        score -= 5

    return max(40, min(score, 95))

def generate_recommendations(result):
    recs = []

    nutrition = result.get('nutrition_facts', {})
    ingredients = ' '.join(result.get('ingredients', [])).lower()

    total_fat = nutrition.get('total_fat_g')
    sodium = nutrition.get('sodium_mg')
    added_sugar = nutrition.get('added_sugar_g')

    # 🟠 High fat foods
    if total_fat is not None and total_fat > 30:
        recs.append('High fat content; consume in moderation.')

    # 🟠 High sodium foods
    if sodium is None:
        if 'oil' in ingredients:
            recs.append('Sodium content unavailable; likely high for processed foods.')
    elif sodium > 400:
        recs.append('High sodium content; not recommended for people with hypertension.')

    # 🟠 High sugar foods
    if added_sugar is not None and added_sugar > 10:
        recs.append('High added sugar; limit consumption to reduce diabetes risk.')

    # 🟢 Ultra-processed indicator
    if 'oil' in ingredients and len(result.get('ingredients', [])) > 3:
        recs.append('Ultra-processed food; frequent consumption is not advised.')

    # 🟢 Whole food case
    if len(result.get('ingredients', [])) == 1:
        recs.append('Single-ingredient food; generally safe when consumed in moderation.')

    # Fallback
    if not recs:
        recs.append('No major health risks detected when consumed in moderation.')

    return recs


if __name__ == '__main__':
    print('Starting OCR API on http://localhost:5002')
    app.run(debug=True, host='0.0.0.0', port=5002)