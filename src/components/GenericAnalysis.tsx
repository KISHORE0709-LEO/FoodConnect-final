import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { useLocation } from 'wouter';

interface AnalysisResult {
  success: boolean;
  productName: string;
  ingredientAnalysis: Array<{
    ingredient: string;
    name: string;
    category: string;
    risk: string;
    description: string;
  }>;
  nutriScore: {
    grade: string;
    score: number;
    color: string;
  };
  nutrition: {
    healthScore: number;
    safetyLevel: string;
    totalIngredients: number;
    toxicIngredients: number;
    per100g?: {
      energy_kcal?: number;
      protein_g?: number;
      carbohydrate_g?: number;
      total_fat_g?: number;
      saturated_fat_g?: number;
      trans_fat_g?: number;
      sodium_mg?: number;
      sugar_g?: number;
      fiber_g?: number;
    };
    extractedFromText?: boolean;
  };
  recommendations: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
  fssai: {
    number: string;
    valid: boolean;
    status: string;
    message: string;
  };
  summary: string;
}

export default function GenericAnalysis() {
  const [, setLocation] = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCustomizeButton, setShowCustomizeButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/analyze/generic', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setShowCustomizeButton(true);
        // Store the analysis data for customized analysis
        localStorage.setItem('lastScannedFood', JSON.stringify({
          ...data,
          imageUrl: previewUrl,
          scannedAt: new Date().toISOString()
        }));
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomizeAnalysis = () => {
    setLocation('/customized');
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getNutriScoreBg = (colorOrGrade: string) => {
    if (!colorOrGrade) return 'bg-gray-100';
    
    const color = colorOrGrade.toLowerCase();
    if (color === 'green' || color === 'a') return 'bg-green-100';
    if (color === 'lightgreen' || color === 'b') return 'bg-green-100';
    if (color === 'yellow' || color === 'c') return 'bg-yellow-100';
    if (color === 'orange' || color === 'd') return 'bg-orange-100';
    if (color === 'red' || color === 'e') return 'bg-red-100';
    return 'bg-gray-100';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Generic Food Analysis
        </h1>
        <p className="text-gray-600">
          Scan any food label to get instant safety analysis and health insights
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Selected food label"
                className="max-h-64 mx-auto rounded-lg shadow-md"
              />
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Choose Different Image
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Analyze Food Label</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Upload Food Label Image
                </h3>
                <p className="text-gray-500">
                  Take a photo or upload an image of the ingredient label
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Choose Image
              </button>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Product Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Product Information</h2>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">FSSAI Status</h3>
              <p className={`font-medium flex items-center ${
                result.fssai?.valid ? 'text-green-600' : 
                result.fssai?.status?.includes('Imported') ? 'text-blue-600' : 'text-red-600'
              }`}>
                {result.fssai?.status?.includes('Imported') ? 'Imported Product' :
                 result.fssai?.valid ? 'Verified ✅' : 'Not Found ❌'}
              </p>
            </div>
          </div>

          {/* Nutritional Information */}
          {result.nutrition?.per100g && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nutritional Information (per 100g)</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Energy</h3>
                  <p className="text-lg font-bold text-blue-900">{result.nutrition.per100g.energy_kcal || 'N/A'} kcal</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-1">Protein</h3>
                  <p className="text-lg font-bold text-green-900">{result.nutrition.per100g.protein_g || 'N/A'}g</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800 mb-1">Carbohydrate</h3>
                  <p className="text-lg font-bold text-yellow-900">{result.nutrition.per100g.carbohydrate_g || 'N/A'}g</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800 mb-1">Total Fat</h3>
                  <p className="text-lg font-bold text-orange-900">{result.nutrition.per100g.total_fat_g || 'N/A'}g</p>
                  {result.nutrition.per100g.saturated_fat_g && (
                    <p className="text-xs text-orange-700 mt-1">Saturated: {result.nutrition.per100g.saturated_fat_g}g</p>
                  )}
                  {result.nutrition.per100g.trans_fat_g !== null && (
                    <p className="text-xs text-orange-700">Trans: {result.nutrition.per100g.trans_fat_g || 0}g</p>
                  )}
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-800 mb-1">Sodium</h3>
                  <p className="text-lg font-bold text-red-900">{result.nutrition.per100g.sodium_mg || 'N/A'}mg</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800 mb-1">Added Sugars</h3>
                  <p className="text-lg font-bold text-purple-900">{result.nutrition.per100g.sugar_g !== null ? result.nutrition.per100g.sugar_g : 'N/A'}g</p>
                </div>
              </div>
            </div>
          )}

          {/* Safety Analysis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Safety Analysis</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg text-center ${getRiskBg(result.nutrition?.healthScore || 0)}`}>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Overall Safety Score</h3>
                <p className={`text-2xl font-bold ${getRiskColor(result.nutrition?.healthScore || 0)}`}>
                  {result.nutrition?.healthScore || 0}/100
                </p>
              </div>
              <div className={`p-4 rounded-lg text-center ${getNutriScoreBg(result.nutriScore?.color || result.nutriScore?.grade)}`}>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Nutri-Score</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {result.nutriScore?.grade || 'E'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-100 text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Ingredients Found</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {result.nutrition?.totalIngredients || result.ingredientAnalysis?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Health Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Health Recommendations</h2>
            <div className="space-y-2">
              {(result.recommendations || []).map((rec, index) => {
                const isWarning = rec.message?.includes('high') || rec.message?.includes('poor') || rec.message?.includes('concern');
                return (
                  <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                    isWarning ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-blue-50 border-l-4 border-blue-400'
                  }`}>
                    <span className={`text-sm font-medium ${
                      isWarning ? 'text-yellow-800' : 'text-blue-800'
                    }`}>⚠️</span>
                    <span className={`text-sm ${
                      isWarning ? 'text-yellow-800' : 'text-blue-800'
                    }`}>{rec.message || rec}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ingredient Analysis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
            <div className="space-y-3">
              {(result.ingredientAnalysis || []).map((ingredient, index) => {
                const getRiskColor = (riskLevel) => {
                  if (riskLevel === 'high') return 'bg-red-500';
                  if (riskLevel === 'medium') return 'bg-yellow-500';
                  return 'bg-green-500';
                };
                
                const getRiskLevel = (ingredient) => {
                  if (ingredient.toxicity_score > 60) return 'high';
                  if (ingredient.toxicity_score > 30) return 'medium';
                  return 'low';
                };
                
                const riskLevel = getRiskLevel(ingredient);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium text-gray-900">
                      {ingredient.name || ingredient.ingredient}
                    </span>
                    <div className={`w-4 h-4 rounded-full ${getRiskColor(riskLevel)}`}></div>
                  </div>
                );
              })}
            </div>
          </div>


        </div>
      )}
    </div>
  );
}