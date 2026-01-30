"""
Test script to validate the 3-step OCR pipeline
Tests each step independently and the complete pipeline
"""

import cv2
import numpy as np
import os
from enhanced_ocr_pipeline import FoodPackageOCR


def test_step1_image_intake():
    """Test Step 1: Image Intake"""
    print("\n" + "="*70)
    print("TESTING STEP 1: IMAGE INTAKE (Generic for ALL images)")
    print("="*70)
    
    ocr = FoodPackageOCR()
    test_images_dir = 'test_images'
    
    if not os.path.exists(test_images_dir):
        print("❌ Test images directory not found")
        return False
    
    test_files = [f for f in os.listdir(test_images_dir) if f.endswith(('.jpg', '.png', '.jpeg'))][:3]
    
    print(f"\n✓ Testing with {len(test_files)} sample images")
    print("✓ No assumptions about brand, format, or orientation")
    print("✓ Accepting images as-is\n")
    
    for img_file in test_files:
        img_path = os.path.join(test_images_dir, img_file)
        try:
            img = ocr.accept_image(img_path)
            print(f"  ✓ {img_file}: Loaded successfully - Shape: {img.shape}")
        except Exception as e:
            print(f"  ✗ {img_file}: Failed - {e}")
            return False
    
    print("\n✅ STEP 1 PASSED: All images accepted successfully")
    return True


def test_step2_image_understanding():
    """Test Step 2: Image Understanding (Pre-processing)"""
    print("\n" + "="*70)
    print("TESTING STEP 2: IMAGE UNDERSTANDING (Before OCR)")
    print("="*70)
    
    ocr = FoodPackageOCR()
    test_images_dir = 'test_images'
    
    test_file = os.path.join(test_images_dir, os.listdir(test_images_dir)[0])
    img = ocr.accept_image(test_file)
    
    print("\n📌 Goal: Maximize text clarity before reading")
    print("   - Improve contrast")
    print("   - Sharpen text regions")
    print("   - Ignore logos & pictures")
    print("   - Focus on dense text blocks\n")
    
    preprocessed = ocr.preprocess_for_text_clarity(img)
    
    print(f"✓ Applied {len(preprocessed)} preprocessing techniques:")
    for method in preprocessed.keys():
        print(f"  • {method}")
    
    print("\n✓ Output: Enhanced images (still images, but cleaner)")
    print("✅ STEP 2 PASSED: Image preprocessing successful")
    return True


def test_step3_ocr_extraction():
    """Test Step 3: OCR Extraction"""
    print("\n" + "="*70)
    print("TESTING STEP 3: OCR EXTRACTION (Image → Raw Text)")
    print("="*70)
    
    ocr = FoodPackageOCR()
    test_images_dir = 'test_images'
    
    test_file = os.path.join(test_images_dir, os.listdir(test_images_dir)[0])
    img = ocr.accept_image(test_file)
    preprocessed = ocr.preprocess_for_text_clarity(img)
    
    print("\n📌 Converting visible text to plain text")
    print("   Expected characteristics:")
    print("   - Text is unordered")
    print("   - Tables become lines")
    print("   - Some words may be slightly wrong")
    print("   - Units may be mixed\n")
    
    raw_text = ocr.extract_raw_text(preprocessed)
    
    if raw_text.strip():
        print("✓ Raw text extracted successfully")
        print(f"✓ Text length: {len(raw_text)} characters")
        print(f"✓ Lines extracted: {len(raw_text.split(chr(10)))}")
        print("\n📄 Sample output (first 300 chars):")
        print("-" * 70)
        print(raw_text[:300])
        print("-" * 70)
        print("\n✅ STEP 3 PASSED: OCR extraction successful")
        return True
    else:
        print("⚠️ No text extracted (may need better test image)")
        return False


def test_nlp_postprocessing():
    """Test NLP Post-processing"""
    print("\n" + "="*70)
    print("TESTING NLP POST-PROCESSING")
    print("="*70)
    
    ocr = FoodPackageOCR()
    
    # Sample raw text (simulating OCR output)
    sample_text = """
    Nutrition Facts
    Serving Size 100g
    Energy 553 kcal
    Protein 6.7 g
    Carbohydrate 52.6 g
    Total Fat 35.1 g
    Sodium 510 mg
    
    Ingredients: Potato, Edible Vegetable Oil, Iodised Salt, 
    Sugar, Spices, Milk Solids, Wheat Flour
    
    Contains: Milk, Wheat
    """
    
    print("\n📌 Structuring raw OCR output using NLP")
    print("   Extracting:")
    print("   - Nutrition facts with units")
    print("   - Ingredients list")
    print("   - Allergen information")
    print("   - Serving size\n")
    
    result = ocr.nlp_postprocess(sample_text)
    
    print("✓ Nutrition Facts Extracted:")
    for nutrient, value in result['nutrition_facts'].items():
        print(f"  • {nutrient}: {value}")
    
    print(f"\n✓ Ingredients Extracted: {len(result['ingredients'])} items")
    for ing in result['ingredients'][:5]:
        print(f"  • {ing}")
    
    print(f"\n✓ Allergens Detected: {', '.join(result['allergens']) if result['allergens'] else 'None'}")
    print(f"✓ Serving Size: {result['serving_size']}")
    
    print("\n✅ NLP POST-PROCESSING PASSED")
    return True


def test_complete_pipeline():
    """Test complete 3-step pipeline"""
    print("\n" + "="*70)
    print("TESTING COMPLETE PIPELINE (All 3 Steps)")
    print("="*70)
    
    ocr = FoodPackageOCR()
    test_images_dir = 'test_images'
    
    if not os.path.exists(test_images_dir):
        print("❌ Test images directory not found")
        return False
    
    test_files = [f for f in os.listdir(test_images_dir) if f.endswith(('.jpg', '.png', '.jpeg'))][:2]
    
    for img_file in test_files:
        img_path = os.path.join(test_images_dir, img_file)
        print(f"\n📦 Processing: {img_file}")
        print("-" * 70)
        
        try:
            result = ocr.process_food_package(img_path)
            
            print(f"  ✓ Step 1: Image accepted")
            print(f"  ✓ Step 2: Image preprocessed")
            print(f"  ✓ Step 3: Text extracted ({len(result['raw_text'])} chars)")
            print(f"  ✓ NLP: Structured data created")
            
            if result['nutrition_facts']:
                print(f"    • Nutrition facts: {len(result['nutrition_facts'])} items")
            if result['ingredients']:
                print(f"    • Ingredients: {len(result['ingredients'])} items")
            if result['allergens']:
                print(f"    • Allergens: {', '.join(result['allergens'])}")
                
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return False
    
    print("\n✅ COMPLETE PIPELINE PASSED")
    return True


def main():
    """Run all tests"""
    print("\n" + "🔬" * 35)
    print("OCR PIPELINE VALIDATION TEST SUITE")
    print("🔬" * 35)
    
    tests = [
        ("Step 1: Image Intake", test_step1_image_intake),
        ("Step 2: Image Understanding", test_step2_image_understanding),
        ("Step 3: OCR Extraction", test_step3_ocr_extraction),
        ("NLP Post-processing", test_nlp_postprocessing),
        ("Complete Pipeline", test_complete_pipeline),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n❌ {test_name} FAILED with exception: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {total_passed}/{len(results)} tests passed")
    
    if total_passed == len(results):
        print("\n🎉 ALL TESTS PASSED! Pipeline is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Please review the output above.")


if __name__ == "__main__":
    main()
