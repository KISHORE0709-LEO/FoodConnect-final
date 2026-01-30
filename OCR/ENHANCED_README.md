# Enhanced OCR Pipeline for Food Package Analysis

## 🎯 Overview

This OCR system implements a robust 3-step pipeline specifically designed for food package analysis with NLP-powered text structuring.

## 📋 3-Step Pipeline Architecture

### 1️⃣ **Image Intake** (Generic for ALL images)

**What the system assumes:**
- Image can be any packaged food
- Layout, font, brand, orientation can vary
- Front or back side of pack

**Action:**
- Accept image as-is
- No assumptions about brand or format

### 2️⃣ **Image Understanding** (Before OCR)

**Why this step exists:**
Food labels have:
- Nutrition tables
- Ingredients paragraphs
- Marketing text
- Logos

**System thinking:**
"I must maximize text clarity before reading."

**What happens conceptually:**
- Improve contrast (CLAHE enhancement)
- Sharpen text regions (kernel sharpening)
- Ignore logos & pictures (focus on text-dense areas)
- Focus on dense text blocks (tables, paragraphs)

**📌 Output:** Still an image, but cleaner

### 3️⃣ **OCR Extraction** (Image → Raw Text)

**Now the system only does one thing:**
"Convert whatever text is visible into plain text."

**Result (important):**
- Text is unordered
- Tables become lines
- Some words may be slightly wrong
- Units may be mixed

**Example output:**
```
Energy 553 kcal
Protein 6.7 g
Carbohydrate 52.6 g
Total Fat 35.1 g
Sodium 510 mg
Ingredients Potato Edible Vegetable Oil Iodised Salt
```

## 🧠 NLP Post-Processing

After OCR extraction, NLP techniques structure the raw text:

- **Nutrition Facts Extraction:** Identifies nutrients with values and units
- **Ingredients Parsing:** Separates and lists ingredients
- **Allergen Detection:** Identifies common allergens
- **Serving Size Recognition:** Extracts serving information

## 🚀 Installation

### Prerequisites
- Python 3.7+
- Tesseract OCR installed on system

#### Install Tesseract:
- **Windows:** Download from https://github.com/UB-Mannheim/tesseract/wiki
- **Linux:** `sudo apt-get install tesseract-ocr`
- **Mac:** `brew install tesseract`

### Install Python Dependencies

```bash
cd OCR
pip install -r requirements.txt
```

### Download NLTK Data (First time only)

```python
python -c "import nltk; nltk.download('words')"
```

## 📖 Usage

### Basic Usage

```python
from enhanced_ocr_pipeline import FoodPackageOCR

# Initialize OCR
ocr = FoodPackageOCR()

# Process food package image
result = ocr.process_food_package('path/to/food_package.jpg')

# Access structured data
print(result['nutrition_facts'])
print(result['ingredients'])
print(result['allergens'])
```

### Command Line Usage

```bash
# Process single image
python enhanced_ocr_pipeline.py test_images/test-1.jpg

# Run test suite
python test_pipeline.py
```

### Step-by-Step Usage

```python
from enhanced_ocr_pipeline import FoodPackageOCR

ocr = FoodPackageOCR()

# Step 1: Accept image
img = ocr.accept_image('food_package.jpg')

# Step 2: Preprocess for clarity
preprocessed = ocr.preprocess_for_text_clarity(img)

# Step 3: Extract text
raw_text = ocr.extract_raw_text(preprocessed)

# NLP post-processing
structured_data = ocr.nlp_postprocess(raw_text)
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
python test_pipeline.py
```

This will test:
- ✅ Step 1: Image Intake
- ✅ Step 2: Image Understanding
- ✅ Step 3: OCR Extraction
- ✅ NLP Post-processing
- ✅ Complete Pipeline

## 📊 Output Format

```python
{
    'raw_text': 'Complete extracted text...',
    'nutrition_facts': {
        'energy': '553 kcal',
        'protein': '6.7 g',
        'carbohydrate': '52.6 g',
        'fat': '35.1 g',
        'sodium': '510 mg'
    },
    'ingredients': [
        'Potato',
        'Edible Vegetable Oil',
        'Iodised Salt',
        'Sugar'
    ],
    'allergens': ['milk', 'wheat'],
    'serving_size': '100g',
    'warnings': []
}
```

## 🔧 Configuration

### Preprocessing Techniques

The pipeline uses multiple preprocessing techniques:
1. **Contrast Enhancement** - CLAHE algorithm
2. **Sharpening** - Kernel-based sharpening
3. **Adaptive Thresholding** - For varying lighting
4. **Otsu's Thresholding** - For bimodal images
5. **Morphological Operations** - Connect text regions
6. **Denoising** - Preserve edges while removing noise

### OCR Configuration

Multiple PSM (Page Segmentation Modes) are tested:
- PSM 6: Uniform block of text
- PSM 4: Single column of text
- PSM 3: Fully automatic page segmentation

The best result is automatically selected based on quality scoring.

## 📁 Project Structure

```
OCR/
├── enhanced_ocr_pipeline.py    # Main 3-step pipeline
├── test_pipeline.py            # Comprehensive test suite
├── requirements.txt            # Python dependencies
├── OCR.py                      # Original OCR implementation
├── island.py                   # Island text detection
├── ns.py                       # Natural scene text detection
├── app.py                      # Dash web interface
├── test_images/                # Sample test images
└── east/                       # EAST text detection model
```

## 🆚 Comparison with Original Implementation

### Original OCR.py
- Multiple filter approaches
- Score-based selection
- Basic text cleaning

### Enhanced Pipeline
- ✅ Clear 3-step architecture
- ✅ Multiple preprocessing techniques
- ✅ NLP-powered structuring
- ✅ Nutrition facts extraction
- ✅ Ingredient parsing
- ✅ Allergen detection
- ✅ Comprehensive testing

## 🎯 Use Cases

1. **Food Package Analysis** - Extract nutrition and ingredients
2. **Allergen Detection** - Identify allergens for dietary restrictions
3. **Nutrition Tracking** - Parse nutrition facts for health apps
4. **Ingredient Analysis** - List and analyze food ingredients
5. **Compliance Checking** - Verify label information

## 🔍 Troubleshooting

### No text extracted
- Ensure Tesseract is installed and in PATH
- Check image quality and resolution
- Try different preprocessing techniques

### Poor accuracy
- Increase image resolution
- Ensure good lighting in image
- Clean the image before processing

### Missing dependencies
```bash
pip install -r requirements.txt
python -c "import nltk; nltk.download('words')"
```

## 📚 References

- Tesseract OCR: https://github.com/tesseract-ocr/tesseract
- OpenCV: https://opencv.org/
- NLTK: https://www.nltk.org/

## 🤝 Integration with FoodConnect

This OCR pipeline integrates with the main FoodConnect application:

```javascript
// In React component
const analyzePackage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('/api/ocr/analyze', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  // result contains nutrition_facts, ingredients, allergens
};
```

## 📄 License

MIT License - See main project LICENSE file

## 👥 Contributors

- Original OCR: Mohak Chadha, Edward Chiao, Rishabh Ghora, Thor Keller, Priyansh Srivastava
- Enhanced Pipeline: M KISHORE (@KISHORE0709-LEO)
- FoodConnect Integration: Sneha CHV (@chv-sneha)

---

**Note:** This enhanced pipeline maintains backward compatibility with the original OCR.py while providing a more structured and NLP-powered approach for food package analysis.
