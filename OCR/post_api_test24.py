import requests
url = 'http://localhost:5000/api/ocr/analyze'
files = {'image': open(r'D:\Kishore\New_project\FoodConnect-final\OCR\test_images\test-24.jpeg','rb')}
resp = requests.post(url, files=files)
print(resp.status_code)
print(resp.text)
