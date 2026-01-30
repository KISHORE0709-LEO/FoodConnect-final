@echo off
cd /d "d:\Kishore\New_project\FoodConnect-final\OCR"

REM Check if the service is already running
tasklist /FI "WINDOWTITLE eq OCR API Server*" 2>NUL | find /I /N "python.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo OCR API Server is already running
    exit /b 0
)

REM Start the API server
echo Starting OCR API Server...
start "OCR API Server" python api_server.py

REM Wait a moment and verify it started
timeout /t 3 /nobreak >nul

REM Check if it's running
curl -s http://localhost:5000/api/ocr/health >nul 2>&1
if %errorlevel% equ 0 (
    echo OCR API Server started successfully
) else (
    echo Failed to start OCR API Server
)