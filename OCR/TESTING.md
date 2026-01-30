# Quick OCR Testing Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
python -c "import nltk; nltk.download('words')"
```

### 2. Test with Command Line
```bash
python test_ocr_simple.py test_images/test-1.jpg
```

### 3. Test with Web Interface

**Option A: With API Server**
```bash
# Terminal 1: Start API server
python api_server.py

# Terminal 2: Open test_ocr.html in browser
# Or just double-click test_ocr.html
```

**Option B: Without API Server (Direct)**
```bash
python test_ocr_simple.py your_image.jpg
```

## 📝 What You'll See

The test will show:
- ✅ Raw extracted text
- ✅ Nutrition facts (energy, protein, carbs, fat, etc.)
- ✅ Ingredients list
- ✅ Detected allergens
- ✅ Serving size

## 🎯 Test Your Own Images

```bash
python test_ocr_simple.py path/to/your/food_package.jpg
```

Results are saved to `your_image_result.json`

## 🔧 Troubleshooting

**No text extracted?**
- Check if Tesseract is installed: `tesseract --version`
- Try a clearer image with better lighting

**Import errors?**
- Run: `pip install -r requirements.txt`

**NLTK errors?**
- Run: `python -c "import nltk; nltk.download('words')"`
