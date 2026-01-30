/**
 * React Integration Example for Enhanced OCR Pipeline
 * 
 * This file shows how to integrate the OCR API with your React components
 */

// ==================== API Client ====================

class OCRApiClient {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Full food package analysis
   * @param {File|Blob} imageFile - Image file to analyze
   * @returns {Promise<Object>} Structured food package data
   */
  async analyzeFoodPackage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/ocr/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR analysis failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Step-by-step analysis with intermediate results
   * @param {File|Blob} imageFile - Image file to analyze
   * @returns {Promise<Object>} Step-by-step results
   */
  async analyzeStepByStep(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/ocr/analyze-step`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Step-by-step analysis failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Extract only nutrition facts
   * @param {File|Blob} imageFile - Image file to analyze
   * @returns {Promise<Object>} Nutrition facts
   */
  async extractNutrition(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/ocr/extract-nutrition`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Nutrition extraction failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Extract only ingredients
   * @param {File|Blob} imageFile - Image file to analyze
   * @returns {Promise<Object>} Ingredients and allergens
   */
  async extractIngredients(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/ocr/extract-ingredients`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Ingredient extraction failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/api/ocr/health`);
    return await response.json();
  }
}

// Export singleton instance
export const ocrApi = new OCRApiClient();


// ==================== React Hook ====================

import { useState } from 'react';

/**
 * Custom hook for OCR analysis
 */
export function useOCRAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyze = async (imageFile) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await ocrApi.analyzeFoodPackage(imageFile);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
  };

  return { analyze, loading, error, result, reset };
}


// ==================== React Component Example ====================

import React, { useState } from 'react';
import { useOCRAnalysis } from './ocrIntegration';

export function FoodPackageScanner() {
  const [selectedFile, setSelectedFile] = useState(null);
  const { analyze, loading, error, result } = useOCRAnalysis();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      await analyze(selectedFile);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className="food-package-scanner">
      <h2>Food Package Scanner</h2>

      {/* File Upload */}
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading}
        />
        <button onClick={handleAnalyze} disabled={!selectedFile || loading}>
          {loading ? 'Analyzing...' : 'Analyze Package'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="results">
          {/* Nutrition Facts */}
          <div className="nutrition-section">
            <h3>Nutrition Facts</h3>
            {result.serving_size && (
              <p><strong>Serving Size:</strong> {result.serving_size}</p>
            )}
            {Object.keys(result.nutrition_facts).length > 0 ? (
              <ul>
                {Object.entries(result.nutrition_facts).map(([nutrient, value]) => (
                  <li key={nutrient}>
                    <strong>{nutrient}:</strong> {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No nutrition facts detected</p>
            )}
          </div>

          {/* Ingredients */}
          <div className="ingredients-section">
            <h3>Ingredients</h3>
            {result.ingredients.length > 0 ? (
              <ul>
                {result.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            ) : (
              <p>No ingredients detected</p>
            )}
          </div>

          {/* Allergens */}
          <div className="allergens-section">
            <h3>Allergens</h3>
            {result.allergens.length > 0 ? (
              <div className="allergen-badges">
                {result.allergens.map((allergen, index) => (
                  <span key={index} className="allergen-badge">
                    ⚠️ {allergen}
                  </span>
                ))}
              </div>
            ) : (
              <p>No allergens detected</p>
            )}
          </div>

          {/* Raw Text (Collapsible) */}
          <details className="raw-text-section">
            <summary>View Raw Extracted Text</summary>
            <pre>{result.raw_text}</pre>
          </details>
        </div>
      )}
    </div>
  );
}


// ==================== Usage in Existing Components ====================

/**
 * Example: Integrate with existing CustomizedAnalysis component
 */

// In your CustomizedAnalysis.tsx or similar component:

import { ocrApi } from './ocrIntegration';

async function handleImageUpload(imageFile) {
  try {
    // Use the OCR API
    const ocrResult = await ocrApi.analyzeFoodPackage(imageFile);
    
    // Merge with existing analysis
    const analysis = {
      ...existingAnalysis,
      nutritionFacts: ocrResult.nutrition_facts,
      ingredients: ocrResult.ingredients,
      allergens: ocrResult.allergens,
      servingSize: ocrResult.serving_size,
    };
    
    // Update state
    setAnalysisResult(analysis);
    
  } catch (error) {
    console.error('OCR analysis failed:', error);
    // Fallback to existing OCR method
  }
}


// ==================== TypeScript Types ====================

/**
 * TypeScript type definitions for OCR results
 */

export interface NutritionFacts {
  energy?: string;
  protein?: string;
  carbohydrate?: string;
  fat?: string;
  sodium?: string;
  sugar?: string;
  fiber?: string;
  [key: string]: string | undefined;
}

export interface OCRResult {
  raw_text: string;
  nutrition_facts: NutritionFacts;
  ingredients: string[];
  allergens: string[];
  serving_size: string | null;
  warnings: string[];
  metadata?: {
    image_shape: number[];
    processing_steps: string[];
    success: boolean;
  };
}

export interface StepResult {
  step: number;
  name: string;
  status: string;
  message: string;
  [key: string]: any;
}

export interface StepByStepResult {
  steps: StepResult[];
  final_result: OCRResult;
  success: boolean;
}


// ==================== Example CSS ====================

const styles = `
.food-package-scanner {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.upload-section {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.upload-section button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-section button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  padding: 10px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin: 10px 0;
}

.results {
  margin-top: 20px;
}

.nutrition-section,
.ingredients-section,
.allergens-section {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.allergen-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.allergen-badge {
  padding: 5px 10px;
  background: #ff9800;
  color: white;
  border-radius: 4px;
  font-size: 14px;
}

.raw-text-section {
  margin-top: 20px;
}

.raw-text-section pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
}
`;

export default styles;
