"""
Enhanced OCR Pipeline for Food Package Analysis
Implements 3-step process:
1. Image Intake (Generic for ALL images)
2. Image Understanding (Pre-processing before OCR)
3. OCR Extraction with NLP Post-processing
"""

import cv2
import numpy as np
import pytesseract
from pytesseract import Output
import re
from typing import Dict, List, Tuple
import string

try:
    import nltk
    from nltk.corpus import words as nltk_words
    # nltk.download('words', quiet=True)
    ENGLISH_VOCAB = set(w.lower() for w in nltk_words.words())
except:
    ENGLISH_VOCAB = set()


class FoodPackageOCR:
    """
    Complete OCR pipeline for food package analysis
    """
    
    def __init__(self):
        self.nutrition_keywords = [
            'energy', 'protein', 'carbohydrate', 'fat', 'sodium', 'sugar',
            'fiber', 'calcium', 'iron', 'vitamin', 'calories', 'kcal', 'kj',
            'serving', 'cholesterol', 'saturated', 'trans', 'dietary'
        ]
        self.ingredient_keywords = [
            'ingredients', 'contains', 'allergen', 'may contain'
        ]
        
    # ==================== STEP 1: IMAGE INTAKE ====================
    def accept_image(self, image_input) -> np.ndarray:
        """
        Step 1: Accept image as-is
        - No assumptions about brand, format, orientation
        - Can be front or back of package
        - Any packaged food
        
        Args:
            image_input: Can be file path, numpy array, or PIL Image
            
        Returns:
            np.ndarray: Standardized image array
        """
        if isinstance(image_input, str):
            img = cv2.imread(image_input)
        elif isinstance(image_input, np.ndarray):
            img = image_input.copy()
        else:
            # Assume PIL Image
            img = np.array(image_input)
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        
        if img is None:
            raise ValueError("Could not load image")
            
        return img
    
    # ==================== STEP 2: IMAGE UNDERSTANDING ====================
    def preprocess_for_text_clarity(self, img: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Step 2: Image Understanding - Maximize text clarity before OCR
        
        Focus on:
        - Improve contrast
        - Sharpen text regions
        - Ignore logos & pictures
        - Focus on dense text blocks (tables, paragraphs)
        
        Returns:
            Dict of preprocessed images with different techniques
        """
        preprocessed = {}
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. Contrast Enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        preprocessed['contrast_enhanced'] = clahe.apply(gray)
        
        # 2. Sharpening for text
        kernel_sharpen = np.array([[-1,-1,-1],
                                   [-1, 9,-1],
                                   [-1,-1,-1]])
        sharpened = cv2.filter2D(gray, -1, kernel_sharpen)
        preprocessed['sharpened'] = sharpened
        
        # 3. Adaptive thresholding for varying lighting
        adaptive = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        preprocessed['adaptive_thresh'] = adaptive
        
        # 4. Otsu's thresholding for bimodal images
        blur = cv2.GaussianBlur(gray, (3,3), 0)
        _, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        preprocessed['otsu'] = otsu
        
        # 5. Morphological operations to connect text
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2,2))
        morph = cv2.morphologyEx(otsu, cv2.MORPH_CLOSE, kernel)
        preprocessed['morphological'] = morph
        
        # 6. Denoising while preserving edges
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        preprocessed['denoised'] = denoised
        
        return preprocessed
    
    # ==================== STEP 3: OCR EXTRACTION ====================
    def extract_raw_text(self, preprocessed_images: Dict[str, np.ndarray]) -> str:
        """
        Step 3: OCR Extraction - Convert visible text to plain text
        
        Important characteristics:
        - Text is unordered
        - Tables become lines
        - Some words may be slightly wrong
        - Units may be mixed
        
        Returns:
            Raw extracted text (unstructured)
        """
        all_texts = []
        
        for method, img in preprocessed_images.items():
            try:
                # Extract text with different PSM modes
                configs = [
                    '--psm 6',  # Assume uniform block of text
                    '--psm 4',  # Assume single column of text
                    '--psm 3',  # Fully automatic page segmentation
                ]
                
                for config in configs:
                    text = pytesseract.image_to_string(img, lang='eng', config=config)
                    if text.strip():
                        all_texts.append((method, config, text))
            except Exception as e:
                continue
        
        # Select best text based on quality score
        if not all_texts:
            return ""
        
        best_text = max(all_texts, key=lambda x: self._score_text_quality(x[2]))
        return best_text[2]
    
    def _score_text_quality(self, text: str) -> float:
        """Score text quality based on various metrics"""
        if not text.strip():
            return 0.0
        
        words = text.split()
        if not words:
            return 0.0
        
        # Check for nutrition/ingredient keywords
        keyword_score = sum(1 for word in words if any(
            kw in word.lower() for kw in self.nutrition_keywords + self.ingredient_keywords
        )) / len(words)
        
        # Check for valid English words
        valid_words = sum(1 for word in words if word.lower() in ENGLISH_VOCAB) if ENGLISH_VOCAB else 0
        vocab_score = valid_words / len(words) if ENGLISH_VOCAB else 0.5
        
        # Check for numbers (nutrition facts have numbers)
        number_score = sum(1 for word in words if any(c.isdigit() for c in word)) / len(words)
        
        return keyword_score * 0.5 + vocab_score * 0.3 + number_score * 0.2
    
    # ==================== NLP POST-PROCESSING ====================
    def nlp_postprocess(self, raw_text: str) -> Dict[str, any]:
        """
        NLP-based post-processing to structure the raw OCR output
        
        Extracts:
        - Nutrition facts (with units)
        - Ingredients list
        - Allergen information
        - Serving size
        """
        result = {
            'raw_text': raw_text,
            'nutrition_facts': {},
            'ingredients': [],
            'allergens': [],
            'serving_size': None,
            'warnings': []
        }
        
        lines = raw_text.split('\n')
        
        # Extract nutrition facts
        nutrition_patterns = {
            'energy': r'(?:energy|calories?)\s*[:=]?\s*(\d+\.?\d*)\s*(kcal|kj|cal)',
            'protein': r'protein\s*[:=]?\s*(\d+\.?\d*)\s*g',
            'carbohydrate': r'carbohydrate\s*[:=]?\s*(\d+\.?\d*)\s*g',
            'fat': r'(?:total\s+)?fat\s*[:=]?\s*(\d+\.?\d*)\s*g',
            'sodium': r'sodium\s*[:=]?\s*(\d+\.?\d*)\s*(mg|g)',
            'sugar': r'sugar\s*[:=]?\s*(\d+\.?\d*)\s*g',
            'fiber': r'fiber\s*[:=]?\s*(\d+\.?\d*)\s*g',
        }
        
        for nutrient, pattern in nutrition_patterns.items():
            matches = re.findall(pattern, raw_text.lower(), re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    result['nutrition_facts'][nutrient] = f"{matches[0][0]} {matches[0][1]}"
                else:
                    result['nutrition_facts'][nutrient] = matches[0]
        
        # Extract ingredients
        ingredient_section = False
        ingredients_text = []
        
        for line in lines:
            if re.search(r'\bingredients?\b', line, re.IGNORECASE):
                ingredient_section = True
                # Extract text after "ingredients:"
                parts = re.split(r'ingredients?\s*[:=]?\s*', line, flags=re.IGNORECASE)
                if len(parts) > 1:
                    ingredients_text.append(parts[1])
            elif ingredient_section:
                if line.strip() and not re.search(r'\b(?:nutrition|allergen|warning)\b', line, re.IGNORECASE):
                    ingredients_text.append(line)
                else:
                    break
        
        if ingredients_text:
            # Split by common delimiters
            full_text = ' '.join(ingredients_text)
            ingredients = re.split(r'[,;]', full_text)
            result['ingredients'] = [ing.strip() for ing in ingredients if ing.strip()]
        
        # Extract allergens
        allergen_keywords = ['milk', 'egg', 'peanut', 'tree nut', 'soy', 'wheat', 
                            'fish', 'shellfish', 'sesame', 'gluten']
        
        for keyword in allergen_keywords:
            if re.search(rf'\b{keyword}s?\b', raw_text, re.IGNORECASE):
                result['allergens'].append(keyword)
        
        # Extract serving size
        serving_match = re.search(r'serving\s+size\s*[:=]?\s*([^\n]+)', raw_text, re.IGNORECASE)
        if serving_match:
            result['serving_size'] = serving_match.group(1).strip()
        
        return result
    
    # ==================== MAIN PIPELINE ====================
    def process_food_package(self, image_input) -> Dict[str, any]:
        """
        Complete 3-step pipeline:
        1. Accept image as-is
        2. Preprocess for text clarity
        3. Extract and structure text with NLP
        
        Returns:
            Structured food package information
        """
        # Step 1: Image Intake
        img = self.accept_image(image_input)
        
        # Step 2: Image Understanding
        preprocessed = self.preprocess_for_text_clarity(img)
        
        # Step 3: OCR Extraction
        raw_text = self.extract_raw_text(preprocessed)
        
        # NLP Post-processing
        structured_data = self.nlp_postprocess(raw_text)
        
        return structured_data


# ==================== USAGE EXAMPLE ====================
def main():
    """Example usage of the enhanced OCR pipeline"""
    ocr = FoodPackageOCR()
    
    # Test with an image
    import sys
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = 'test_images/test-1.jpg'
    
    try:
        result = ocr.process_food_package(image_path)
        
        print("=" * 60)
        print("FOOD PACKAGE ANALYSIS RESULTS")
        print("=" * 60)
        
        print("\n📋 RAW EXTRACTED TEXT:")
        print("-" * 60)
        print(result['raw_text'][:500] + "..." if len(result['raw_text']) > 500 else result['raw_text'])
        
        print("\n\n📊 NUTRITION FACTS:")
        print("-" * 60)
        if result['nutrition_facts']:
            for nutrient, value in result['nutrition_facts'].items():
                print(f"  {nutrient.capitalize()}: {value}")
        else:
            print("  No nutrition facts detected")
        
        print("\n\n🥘 INGREDIENTS:")
        print("-" * 60)
        if result['ingredients']:
            for i, ingredient in enumerate(result['ingredients'][:10], 1):
                print(f"  {i}. {ingredient}")
            if len(result['ingredients']) > 10:
                print(f"  ... and {len(result['ingredients']) - 10} more")
        else:
            print("  No ingredients detected")
        
        print("\n\n⚠️ ALLERGENS:")
        print("-" * 60)
        if result['allergens']:
            print(f"  {', '.join(result['allergens'])}")
        else:
            print("  No allergens detected")
        
        print("\n\n🍽️ SERVING SIZE:")
        print("-" * 60)
        print(f"  {result['serving_size'] or 'Not detected'}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"Error processing image: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
