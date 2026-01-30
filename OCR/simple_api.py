from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import pytesseract
import re
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Set Tesseract path for macOS
pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'

@app.route('/api/analyze/generic', methods=['POST'])
def analyze_generic():
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        file = request.files['image']
        img_bytes = file.read()
        
        # Convert to OpenCV format
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'success': False, 'error': 'Could not read image'}), 400
        
        # OCR processing
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Extract text using different methods
        texts = [
            pytesseract.image_to_string(gray, lang='eng'),
            pytesseract.image_to_string(thresh, lang='eng'),
            pytesseract.image_to_string(gray, lang='eng', config='--psm 6'),
        ]
        
        # Get the longest text result
        raw_text = max(texts, key=len)
        
        # Parse the text
        result = parse_food_label(raw_text)
        result['success'] = True
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def parse_food_label(raw_text):
    """Parse food label text and extract structured data"""
    text = raw_text.lower()
    
    result = {
        'productName': extract_product_name(raw_text),
        'ingredientAnalysis': extract_ingredients(text),
        'nutrition': extract_nutrition(text),
        'nutriScore': calculate_nutri_score(text),
        'recommendations': generate_recommendations(text),
        'fssai': detect_fssai(raw_text),
        'summary': 'Food analysis completed successfully'
    }
    
    return result

def extract_product_name(text):
    """Extract product name from text"""
    lines = text.split('\n')
    for line in lines[:5]:  # Check first 5 lines
        if len(line.strip()) > 3 and not any(word in line.lower() for word in ['ingredients', 'nutrition', 'per 100']):
            return line.strip()
    return 'Food Product'

def extract_ingredients(text):
    """Extract ingredients from text"""
    ingredients = []
    
    # Look for ingredients section
    ing_match = re.search(r'ingredients?[:\s]*([^.]+)', text)
    if ing_match:
        ing_text = ing_match.group(1)
        # Split by common separators
        raw_ingredients = re.split(r'[,;]', ing_text)
        
        for i, ing in enumerate(raw_ingredients[:10]):  # Limit to 10 ingredients
            ing = ing.strip()
            if ing and len(ing) > 2:
                # Simple toxicity scoring
                toxicity_score = 10
                if any(word in ing for word in ['artificial', 'preservative', 'color', 'flavor']):
                    toxicity_score = 70
                elif any(word in ing for word in ['sugar', 'salt', 'oil']):
                    toxicity_score = 40
                
                ingredients.append({
                    'ingredient': ing,
                    'name': ing.title(),
                    'category': 'ingredient',
                    'risk': 'low' if toxicity_score < 30 else 'medium' if toxicity_score < 60 else 'high',
                    'description': f'Common food ingredient',
                    'toxicity_score': toxicity_score
                })
    
    return ingredients

def extract_nutrition(text):
    """Extract nutrition information"""
    nutrition = {
        'healthScore': 75,
        'safetyLevel': 'Good',
        'totalIngredients': 0,
        'toxicIngredients': 0,
        'per100g': {}
    }
    
    # Extract nutritional values
    patterns = {
        'energy_kcal': r'energy[:\s]*([0-9.]+)\s*k?cal',
        'protein_g': r'protein[:\s]*([0-9.]+)\s*g',
        'carbohydrate_g': r'carbohydrate[:\s]*([0-9.]+)\s*g',
        'total_fat_g': r'(?:total\s+)?fat[:\s]*([0-9.]+)\s*g',
        'sugar_g': r'sugar[:\s]*([0-9.]+)\s*g',
        'sodium_mg': r'sodium[:\s]*([0-9.]+)\s*mg',
        'fiber_g': r'fi[bv]re[:\s]*([0-9.]+)\s*g'
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            nutrition['per100g'][key] = float(match.group(1))
    
    # Calculate health score based on nutrition
    if nutrition['per100g']:
        score = 100
        if nutrition['per100g'].get('sugar_g', 0) > 15:
            score -= 20
        if nutrition['per100g'].get('sodium_mg', 0) > 500:
            score -= 15
        if nutrition['per100g'].get('total_fat_g', 0) > 20:
            score -= 10
        
        nutrition['healthScore'] = max(20, score)
        nutrition['safetyLevel'] = 'Excellent' if score >= 80 else 'Good' if score >= 60 else 'Fair'
    
    return nutrition

def calculate_nutri_score(text):
    """Calculate Nutri-Score"""
    # Simple scoring based on keywords
    score = 0
    
    if 'sugar' in text:
        score += 5
    if 'fat' in text:
        score += 3
    if 'protein' in text:
        score -= 2
    if 'fiber' in text or 'fibre' in text:
        score -= 1
    
    # Convert to grade
    if score <= 0:
        grade = 'A'
        color = 'green'
    elif score <= 3:
        grade = 'B'
        color = 'lightgreen'
    elif score <= 6:
        grade = 'C'
        color = 'yellow'
    elif score <= 10:
        grade = 'D'
        color = 'orange'
    else:
        grade = 'E'
        color = 'red'
    
    return {
        'grade': grade,
        'score': score,
        'color': color
    }

def generate_recommendations(text):
    """Generate health recommendations"""
    recommendations = []
    
    if 'sugar' in text:
        recommendations.append({
            'type': 'warning',
            'message': 'This product contains sugar. Consider limiting intake if you have diabetes.',
            'priority': 'medium'
        })
    
    if 'artificial' in text or 'preservative' in text:
        recommendations.append({
            'type': 'caution',
            'message': 'Contains artificial ingredients or preservatives. Choose natural alternatives when possible.',
            'priority': 'low'
        })
    
    if not recommendations:
        recommendations.append({
            'type': 'info',
            'message': 'This appears to be a relatively healthy food choice.',
            'priority': 'low'
        })
    
    return recommendations

def detect_fssai(raw_text):
    """Detect FSSAI license number"""
    patterns = [
        r'fssai[:\s]*([0-9]{13,14})',
        r'lic[.\s]*no[.\s]*[:\s]*([0-9]{13,14})',
        r'license[:\s]*([0-9]{13,14})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, raw_text.lower())
        if match:
            return {
                'number': match.group(1),
                'valid': True,
                'status': 'Verified',
                'message': 'FSSAI license found'
            }
    
    return {
        'number': '',
        'valid': False,
        'status': 'Not Found',
        'message': 'No FSSAI license detected'
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'FoodConnect OCR API',
        'version': '1.0.0'
    })

if __name__ == '__main__':
    print("=" * 50)
    print("FoodConnect OCR API Server")
    print("=" * 50)
    print("Starting server on http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5002)