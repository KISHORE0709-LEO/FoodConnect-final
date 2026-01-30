import cv2
import re
from OCR import get_text

img_path = r"D:\Kishore\New_project\FoodConnect-final\OCR\test_images\test-24.jpeg"
img = cv2.imread(img_path)
raw = get_text(img)
print('RAW (lower):\n')
print(raw.lower())

text = raw.lower()
m = re.search(r'ingredients?\s*[:\-]?\s*(.+)', text)
if m:
    ing_text = m.group(1)
    print('\n-- ING_TEXT (raw capture) --\n')
    print(ing_text[:1000])
    STOP_PATTERNS = [
        r'nutrition', r'nutritional', r'mrp', r'fssai', r'net\s*qty', r'pack', r'unit\s*sale', r'mfd', r'use\s*by', r'approx', r'flavour', r'facebook', r'www'
    ]
    for stop in STOP_PATTERNS:
        parts = re.split(stop, ing_text)
        if len(parts) > 1:
            print('\nSplit by stop:', stop)
            print(parts[0][:200])
            ing_text = parts[0]
    ingredients = re.split(r',|\n|\(|\)', ing_text)
    print('\n-- INGREDIENT LIST ITEMS --')
    for i in ingredients:
        print('-', repr(i))
else:
    print('No ingredients match')
