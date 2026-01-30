# FoodConnect Setup Instructions

## Quick Start (Recommended)

Just run this single command:
```bash
./start.sh
```

This will automatically:
- Install Python dependencies
- Start the OCR backend (port 5000)
- Start the React frontend (port 5173)

## Manual Setup (If needed)

### Step 1: Install Python Dependencies
```bash
cd OCR
pip3 install flask flask-cors opencv-python pytesseract numpy pillow
```

### Step 2: Install Tesseract OCR

**macOS:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt install tesseract-ocr
```

**Windows:**
- Download: https://github.com/UB-Mannheim/tesseract/wiki
- Install to: `C:\Program Files\Tesseract-OCR\`

### Step 3: Start Backend
```bash
cd OCR
python3 simple_api.py
```

### Step 4: Start Frontend (in new terminal)
```bash
npm run dev
```

## Testing

1. **Backend Health Check:**
   - Open: http://localhost:5000/api/health
   - Should show: `{"status": "healthy", "service": "FoodConnect OCR API"}`

2. **Frontend:**
   - Open: http://localhost:5173
   - Go to Generic Analysis
   - Upload a food label image
   - Should get analysis results

## Troubleshooting

**Port 5000 in use:**
- On macOS: Disable AirPlay Receiver in System Settings
- Or change port in `OCR/simple_api.py` line 165

**Tesseract not found:**
- Make sure it's installed and in PATH
- Update path in `OCR/simple_api.py` line 11 if needed

**CORS errors:**
- Make sure both servers are running
- Check that Vite proxy is configured correctly

## File Structure
```
FoodConnect-final-main/
├── start.sh              # Quick start script
├── OCR/
│   └── simple_api.py      # Python OCR backend
├── src/
│   └── components/
│       └── GenericAnalysis.tsx  # React frontend
└── vite.config.ts         # Proxy configuration
```