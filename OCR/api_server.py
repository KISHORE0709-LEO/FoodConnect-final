"""
Flask API wrapper for Enhanced OCR Pipeline
Provides REST API endpoints for FoodConnect React frontend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from enhanced_ocr_pipeline import FoodPackageOCR
import base64
from io import BytesIO
from PIL import Image
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize OCR
ocr = FoodPackageOCR()


@app.route('/api/ocr/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Enhanced OCR Pipeline',
        'version': '1.0.0'
    })


@app.route('/api/ocr/analyze', methods=['POST'])
def analyze_food_package():
    """
    Analyze food package image with complete analysis
    
    Returns:
    - OCR data + FSSAI detection + Safety score + Nutritional analysis
    """
    try:
        # Handle file upload
        if 'image' in request.files:
            file = request.files['image']
            img_bytes = file.read()
            img = Image.open(BytesIO(img_bytes))
            img_array = np.array(img)
            
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        # Process OCR
        ocr_result = ocr.process_food_package(img_array)
        
        # Enhanced analysis
        analysis = {
            **ocr_result,
            'fssai': detect_fssai(ocr_result['raw_text']),
            'nutrition_analysis': analyze_nutrition(ocr_result['nutrition_facts']),
            'safety_score': calculate_safety_score(ocr_result),
            'success': True
        }
        
        return jsonify(analysis), 200
    
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


def detect_fssai(raw_text):
    """Detect FSSAI license number"""
    # Look for FSSAI patterns
    patterns = [
        r'fssai[\s:]*([0-9]{14})',
        r'lic[\s\.]?no[\s:]*([0-9]{14})',
        r'license[\s\.]?no[\s:]*([0-9]{14})',
        r'([0-9]{14})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, raw_text.lower())
        if match:
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


def analyze_nutrition(nutrition_facts):
    """Analyze nutritional content"""
    if not nutrition_facts:
        return {'has_nutrition_table': False}
    
    return {
        'has_nutrition_table': True,
        'nutrients_detected': len(nutrition_facts),
        'per_100g_basis': True
    }


def calculate_safety_score(ocr_result):
    """Calculate safety score based on nutrition and ingredients"""
    score = 100
    penalties = []
    
    # Nutrition penalties
    nutrition = ocr_result.get('nutrition_facts', {})
    
    # Sugar penalty
    sugar_str = nutrition.get('sugar', '0')
    sugar = float(re.search(r'([0-9.]+)', sugar_str).group(1)) if re.search(r'([0-9.]+)', sugar_str) else 0
    if sugar > 10:
        penalty = 15
        score -= penalty
        penalties.append(f'High sugar ({sugar}g) - {penalty} points')
    
    # Fat penalty
    fat_str = nutrition.get('fat', nutrition.get('total_fat', '0'))
    fat = float(re.search(r'([0-9.]+)', fat_str).group(1)) if re.search(r'([0-9.]+)', fat_str) else 0
    if fat > 5:
        penalty = 10 if fat > 30 else 5
        score -= penalty
        penalties.append(f'High fat ({fat}g) - {penalty} points')
    
    # Sodium penalty
    sodium_str = nutrition.get('sodium', '0')
    sodium = float(re.search(r'([0-9.]+)', sodium_str).group(1)) if re.search(r'([0-9.]+)', sodium_str) else 0
    if sodium > 400:
        penalty = 10
        score -= penalty
        penalties.append(f'High sodium ({sodium}mg) - {penalty} points')
    
    # Processing penalties
    ingredients_text = ' '.join(ocr_result.get('ingredients', [])).lower()
    if any(word in ingredients_text for word in ['emulsifier', 'artificial', 'preservative']):
        penalty = 10
        score -= penalty
        penalties.append(f'Ultra-processed - {penalty} points')
    
    # Allergen penalties
    allergen_count = len(ocr_result.get('allergens', []))
    if allergen_count > 0:
        penalty = allergen_count * 5
        score -= penalty
        penalties.append(f'Contains allergens - {penalty} points')
    
    return {
        'score': max(0, score),
        'penalties': penalties,
        'grade': 'A' if score >= 80 else 'B' if score >= 60 else 'C' if score >= 40 else 'D'
    }


@app.route('/api/ocr/analyze-step', methods=['POST'])
def analyze_step_by_step():
    """
    Analyze food package with step-by-step results
    Returns intermediate results from each step
    """
    try:
        # Handle image input (same as above)
        if 'image' in request.files:
            file = request.files['image']
            img_bytes = file.read()
            img = Image.open(BytesIO(img_bytes))
            img_array = np.array(img)
            
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        # Step 1: Image Intake
        step1_result = {
            'step': 1,
            'name': 'Image Intake',
            'status': 'completed',
            'image_shape': img_array.shape,
            'message': 'Image accepted as-is'
        }
        
        # Step 2: Image Understanding
        preprocessed = ocr.preprocess_for_text_clarity(img_array)
        step2_result = {
            'step': 2,
            'name': 'Image Understanding',
            'status': 'completed',
            'techniques_applied': list(preprocessed.keys()),
            'message': 'Image preprocessed for text clarity'
        }
        
        # Step 3: OCR Extraction
        raw_text = ocr.extract_raw_text(preprocessed)
        step3_result = {
            'step': 3,
            'name': 'OCR Extraction',
            'status': 'completed',
            'text_length': len(raw_text),
            'lines_extracted': len(raw_text.split('\n')),
            'raw_text_preview': raw_text[:200] + '...' if len(raw_text) > 200 else raw_text
        }
        
        # NLP Post-processing
        structured_data = ocr.nlp_postprocess(raw_text)
        nlp_result = {
            'step': 4,
            'name': 'NLP Post-processing',
            'status': 'completed',
            'nutrition_facts_count': len(structured_data['nutrition_facts']),
            'ingredients_count': len(structured_data['ingredients']),
            'allergens_count': len(structured_data['allergens'])
        }
        
        return jsonify({
            'steps': [step1_result, step2_result, step3_result, nlp_result],
            'final_result': structured_data,
            'success': True
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/api/ocr/extract-nutrition', methods=['POST'])
def extract_nutrition_only():
    """Extract only nutrition facts from image"""
    try:
        if 'image' in request.files:
            file = request.files['image']
            img_bytes = file.read()
            img = Image.open(BytesIO(img_bytes))
            img_array = np.array(img)
            
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        result = ocr.process_food_package(img_array)
        
        return jsonify({
            'nutrition_facts': result['nutrition_facts'],
            'serving_size': result['serving_size'],
            'success': True
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/api/ocr/extract-ingredients', methods=['POST'])
def extract_ingredients_only():
    """Extract only ingredients from image"""
    try:
        if 'image' in request.files:
            file = request.files['image']
            img_bytes = file.read()
            img = Image.open(BytesIO(img_bytes))
            img_array = np.array(img)
            
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        result = ocr.process_food_package(img_array)
        
        return jsonify({
            'ingredients': result['ingredients'],
            'allergens': result['allergens'],
            'success': True
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


if __name__ == '__main__':
    print("=" * 70)
    print("Enhanced OCR API Server")
    print("=" * 70)
    print("\nAvailable Endpoints:")
    print("  GET  /api/ocr/health              - Health check")
    print("  POST /api/ocr/analyze             - Full analysis")
    print("  POST /api/ocr/analyze-step        - Step-by-step analysis")
    print("  POST /api/ocr/extract-nutrition   - Nutrition facts only")
    print("  POST /api/ocr/extract-ingredients - Ingredients only")
    print("\nStarting server on http://localhost:5000")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
