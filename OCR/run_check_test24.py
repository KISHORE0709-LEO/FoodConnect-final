import cv2, json
from OCR import get_text
from test_ocr_simple import parse_with_validation

img_path = r"D:\Kishore\New_project\FoodConnect-final\OCR\test_images\test-24.jpeg"
img = cv2.imread(img_path)
if img is None:
    print('Could not read image:', img_path)
    exit(1)

raw = get_text(img)
print('--- RAW OCR PREVIEW ---')
print(raw[:1000])

res = parse_with_validation(raw)
print('\n--- PARSED NUTRITION FACTS ---')
print(json.dumps(res.get('nutrition_facts', {}), indent=2))
print('\n--- INGREDIENTS ---')
print(json.dumps(res.get('ingredients', []), indent=2))
