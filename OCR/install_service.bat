@echo off
echo Installing FoodConnect OCR API Service...

REM Install required package
pip install pywin32

REM Install the service
python service_wrapper.py install

REM Start the service
python service_wrapper.py start

echo Service installed and started successfully!
echo You can manage it through Windows Services or use:
echo   python service_wrapper.py start
echo   python service_wrapper.py stop
echo   python service_wrapper.py remove

pause