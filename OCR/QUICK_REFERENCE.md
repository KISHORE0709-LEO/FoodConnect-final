# 🚀 Quick Reference Guide - Enhanced OCR Pipeline

## 📦 Installation (One-Time Setup)

```bash
cd OCR
pip install -r requirements.txt
python -c "import nltk; nltk.download('words')"
```

## 🎯 Basic Usage

### Python Direct Usage

```python
from enhanced_ocr_pipeline import FoodPackageOCR

# Initialize
ocr = FoodPackageOCR()

# Process image
result = ocr.process_food_package('path/to/image.jpg')

# Access results
print(result['nutrition_facts'])  # {'energy': '553 kcal', ...}
print(result['ingredients'])      # ['Potato', 'Oil', ...]
print(result['allergens'])        # ['milk', 'wheat']
```

### Step-by-Step Usage

```python
ocr = FoodPackageOCR()

# Step 1: Accept image
img = ocr.accept_image('image.jpg')

# Step 2: Preprocess
preprocessed = ocr.preprocess_for_text_clarity(img)

# Step 3: Extract text
raw_text = ocr.extract_raw_text(preprocessed)

# NLP: Structure data
structured = ocr.nlp_postprocess(raw_text)
```

## 🌐 API Server

### Start Server

```bash
python api_server.py
# Runs on http://localhost:5000
```

### API Endpoints

```bash
# Health check
curl http://localhost:5000/api/ocr/health

# Full analysis
curl -X POST -F "image=@package.jpg" \
  http://localhost:5000/api/ocr/analyze

# Nutrition only
curl -X POST -F "image=@package.jpg" \
  http://localhost:5000/api/ocr/extract-nutrition

# Ingredients only
curl -X POST -F "image=@package.jpg" \
  http://localhost:5000/api/ocr/extract-ingredients
```

## ⚛️ React Integration

### Setup

```javascript
// Copy react_integration_example.js to your src folder
import { ocrApi, useOCRAnalysis } from './ocrIntegration';
```

### Using Hook

```javascript
function MyComponent() {
  const { analyze, loading, error, result } = useOCRAnalysis();

  const handleUpload = async (file) => {
    try {
      await analyze(file);
      // result is now available
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {loading && <p>Analyzing...</p>}
      {error && <p>Error: {error}</p>}
      {result && <div>{/* Display results */}</div>}
    </div>
  );
}
```

### Using API Client Directly

```javascript
import { ocrApi } from './ocrIntegration';

// Full analysis
const result = await ocrApi.analyzeFoodPackage(imageFile);

// Nutrition only
const nutrition = await ocrApi.extractNutrition(imageFile);

// Ingredients only
const ingredients = await ocrApi.extractIngredients(imageFile);
```

## 🧪 Testing

```bash
# Run all tests
python test_pipeline.py

# Test with specific image
python enhanced_ocr_pipeline.py test_images/test-1.jpg
```

## 📊 Output Format

```javascript
{
  "raw_text": "Energy 553 kcal\nProtein 6.7 g...",
  "nutrition_facts": {
    "energy": "553 kcal",
    "protein": "6.7 g",
    "carbohydrate": "52.6 g",
    "fat": "35.1 g",
    "sodium": "510 mg"
  },
  "ingredients": [
    "Potato",
    "Edible Vegetable Oil",
    "Iodised Salt"
  ],
  "allergens": ["milk", "wheat"],
  "serving_size": "100g",
  "warnings": []
}
```

## 🔧 Common Tasks

### Process Multiple Images

```python
import os
from enhanced_ocr_pipeline import FoodPackageOCR

ocr = FoodPackageOCR()
results = []

for filename in os.listdir('images/'):
    if filename.endswith(('.jpg', '.png')):
        result = ocr.process_food_package(f'images/{filename}')
        results.append({
            'filename': filename,
            'data': result
        })
```

### Extract Only Nutrition

```python
result = ocr.process_food_package('image.jpg')
nutrition = result['nutrition_facts']
serving = result['serving_size']
```

### Check for Specific Allergen

```python
result = ocr.process_food_package('image.jpg')
has_milk = 'milk' in result['allergens']
has_nuts = any(a in result['allergens'] for a in ['peanut', 'tree nut'])
```

### Save Results to JSON

```python
import json

result = ocr.process_food_package('image.jpg')

with open('output.json', 'w') as f:
    json.dump(result, f, indent=2)
```

## 🐛 Troubleshooting

### No Text Extracted

```python
# Check if Tesseract is installed
import pytesseract
print(pytesseract.get_tesseract_version())

# Try with different image
result = ocr.process_food_package('different_image.jpg')
```

### Poor Accuracy

```python
# Check raw text
result = ocr.process_food_package('image.jpg')
print(result['raw_text'])  # See what was actually extracted

# Try preprocessing manually
img = ocr.accept_image('image.jpg')
preprocessed = ocr.preprocess_for_text_clarity(img)
# Check preprocessed images
```

### API Connection Error

```bash
# Check if server is running
curl http://localhost:5000/api/ocr/health

# Check CORS settings in api_server.py
# Ensure Flask-CORS is installed
pip install flask-cors
```

## 📝 Customization

### Add Custom Nutrition Pattern

```python
# In enhanced_ocr_pipeline.py, modify nlp_postprocess()
nutrition_patterns = {
    # ... existing patterns ...
    'vitamin_d': r'vitamin\s+d\s*[:=]?\s*(\d+\.?\d*)\s*(iu|mcg)',
}
```

### Add Custom Allergen

```python
# In enhanced_ocr_pipeline.py, modify nlp_postprocess()
allergen_keywords = [
    # ... existing keywords ...
    'mustard', 'celery', 'lupin'
]
```

### Change API Port

```python
# In api_server.py, modify the last line
app.run(debug=True, host='0.0.0.0', port=8080)  # Change port
```

## 📚 File Reference

| File | Purpose |
|------|---------|
| `enhanced_ocr_pipeline.py` | Main 3-step pipeline |
| `test_pipeline.py` | Testing suite |
| `api_server.py` | Flask REST API |
| `react_integration_example.js` | React integration |
| `requirements.txt` | Dependencies |
| `ENHANCED_README.md` | Full documentation |
| `IMPLEMENTATION_SUMMARY.md` | Implementation details |
| `ARCHITECTURE_DIAGRAM.md` | Visual architecture |

## 🎓 Learning Resources

### Understanding the Pipeline

1. Read `ARCHITECTURE_DIAGRAM.md` for visual overview
2. Read `IMPLEMENTATION_SUMMARY.md` for detailed explanation
3. Run `test_pipeline.py` to see each step in action
4. Read `ENHANCED_README.md` for complete documentation

### Code Examples

- Basic usage: See `enhanced_ocr_pipeline.py` main() function
- Testing: See `test_pipeline.py`
- API usage: See `api_server.py`
- React integration: See `react_integration_example.js`

## 💡 Tips & Best Practices

1. **Image Quality**: Higher resolution = better accuracy
2. **Lighting**: Ensure good, even lighting in images
3. **Orientation**: Pipeline handles any orientation, but upright is best
4. **File Size**: Resize very large images (>5MB) before processing
5. **Batch Processing**: Use API for multiple images
6. **Error Handling**: Always wrap API calls in try-catch
7. **Caching**: Cache results for same image to avoid reprocessing

## 🔗 Integration Checklist

- [ ] Install dependencies (`pip install -r requirements.txt`)
- [ ] Download NLTK data (`nltk.download('words')`)
- [ ] Test with sample image (`python enhanced_ocr_pipeline.py test.jpg`)
- [ ] Start API server (`python api_server.py`)
- [ ] Test API endpoint (`curl localhost:5000/api/ocr/health`)
- [ ] Copy React integration code to frontend
- [ ] Update API base URL in React code
- [ ] Test end-to-end flow
- [ ] Deploy API server
- [ ] Update production API URL

## 📞 Support

For issues or questions:
1. Check `ENHANCED_README.md` for detailed documentation
2. Review `IMPLEMENTATION_SUMMARY.md` for implementation details
3. Run `test_pipeline.py` to validate setup
4. Check error messages and logs

## 🎉 Quick Win

```bash
# Complete setup and test in 3 commands
pip install -r requirements.txt
python -c "import nltk; nltk.download('words')"
python test_pipeline.py
```

If all tests pass, you're ready to go! 🚀
