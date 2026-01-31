#!/bin/bash

# Use the conda Python directly
PYTHON_CMD="/opt/miniconda3/bin/python3"

# Change to OCR directory and run the script
cd "$(dirname "$0")/OCR"
$PYTHON_CMD test_ocr_simple.py