#!/bin/bash

echo "🚀 Starting FoodConnect Application..."
echo "=================================="

# Check if Python dependencies are installed
echo "📦 Checking Python dependencies..."
python3 -c "import flask, flask_cors, cv2, pytesseract, numpy, PIL" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Missing Python dependencies. Installing..."
    cd OCR
    pip3 install flask flask-cors opencv-python pytesseract numpy pillow
    cd ..
fi

# Check if Tesseract is installed
if ! command -v tesseract &> /dev/null; then
    echo "❌ Tesseract not found. Please install:"
    echo "   macOS: brew install tesseract"
    echo "   Linux: sudo apt install tesseract-ocr"
    exit 1
fi

# Start Python backend
echo "🐍 Starting Python OCR API server..."
cd OCR
python3 simple_api.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start React frontend
echo "⚛️  Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Application started successfully!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   Health:   http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait