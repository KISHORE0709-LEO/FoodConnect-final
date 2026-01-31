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
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied or not available');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context?.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          handleFileSelect(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('http://localhost:5005/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setShowCustomizeButton(true);
        // Store the analysis data for customized analysis
        const analysisData = {
          ...data,
          imageUrl: previewUrl,
          scannedAt: new Date().toISOString()
        };
        localStorage.setItem('lastScannedFood', JSON.stringify(analysisData));
        
        // Trigger storage event for other components to update
        window.dispatchEvent(new Event('storage'));
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis failed. Please ensure the OCR service is running: python test_ocr_simple.py');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomizeAnalysis = () => {
    setLocation('/customized?from=generic');
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
        {showCamera ? (
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-64 rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center space-x-4">
              <button
                onClick={capturePhoto}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Photo</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
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
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Use Camera</span>
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
                      <span>Analyze Label</span>
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
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose Image</span>
                  </button>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
          { (result.nutrition?.per100g_display || result.nutrition?.per100g) && (
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
                  <h3 className="text-sm font-medium text-purple-800 mb-1">Total Sugars</h3>
                  <p className="text-lg font-bold text-purple-900">{result.nutrition.per100g.total_sugar_g ?? result.nutrition.per100g.sugar_g ?? 'N/A'}g</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-indigo-800 mb-1">Added Sugars</h3>
                  <p className="text-lg font-bold text-indigo-900">{result.nutrition.per100g.added_sugar_g ?? 'N/A'}g</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-teal-800 mb-1">Fiber</h3>
                  <p className="text-lg font-bold text-teal-900">{result.nutrition.per100g.fiber_g ?? 'N/A'}g</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-800 mb-1">Cholesterol</h3>
                  <p className="text-lg font-bold text-gray-900">{result.nutrition.per100g.cholesterol_mg ?? 'N/A'}mg</p>
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

          {/* Health Impact Analysis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Heart className="w-6 h-6 text-red-500 mr-2" />
              Health Impact Analysis
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blood Sugar Impact */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
                <h3 className="font-semibold mb-4 text-red-800 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  Blood Sugar Impact
                </h3>
                <div className="relative h-20 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 200 50">
                    <path
                      d="M0,25 Q10,15 20,25 T40,25 T60,25 T80,25 T100,25 T120,25 T140,25 T160,25 T180,25 T200,25"
                      stroke="#ef4444"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse"
                    />
                    <circle cx="50" cy="25" r="3" fill="#ef4444" className="animate-bounce" />
                    <circle cx="100" cy="25" r="3" fill="#ef4444" className="animate-bounce" style={{animationDelay: '0.5s'}} />
                    <circle cx="150" cy="25" r="3" fill="#ef4444" className="animate-bounce" style={{animationDelay: '1s'}} />
                  </svg>
                </div>
                <div className="text-sm text-red-700">
                  Sugar: {result.nutrition?.per100g?.total_sugar_g || 'N/A'}g
                  <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{width: `${Math.min(100, (result.nutrition?.per100g?.total_sugar_g || 0) * 2)}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Heart Health */}
              <div className="bg-gradient-to-br from-pink-50 to-red-50 p-6 rounded-lg border border-pink-200">
                <h3 className="font-semibold mb-4 text-pink-800 flex items-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full mr-2 animate-pulse"></div>
                  Heart Health Impact
                </h3>
                <div className="relative h-20 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 200 50">
                    <path
                      d="M0,25 L10,25 L15,10 L20,40 L25,5 L30,45 L35,25 L200,25"
                      stroke="#ec4899"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse"
                    />
                    <path
                      d="M50,25 L55,25 L60,10 L65,40 L70,5 L75,45 L80,25"
                      stroke="#ec4899"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse"
                      style={{animationDelay: '0.3s'}}
                    />
                    <path
                      d="M120,25 L125,25 L130,10 L135,40 L140,5 L145,45 L150,25"
                      stroke="#ec4899"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse"
                      style={{animationDelay: '0.6s'}}
                    />
                  </svg>
                </div>
                <div className="text-sm text-pink-700">
                  Sodium: {result.nutrition?.per100g?.sodium_mg || 'N/A'}mg
                  <div className="w-full bg-pink-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-pink-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{width: `${Math.min(100, (result.nutrition?.per100g?.sodium_mg || 0) / 20)}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Fat Impact */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
                <h3 className="font-semibold mb-4 text-orange-800 flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                  Fat Impact
                </h3>
                <div className="relative h-20 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 200 50">
                    <defs>
                      <linearGradient id="fatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#eab308" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,35 Q50,15 100,25 T200,30"
                      stroke="url(#fatGradient)"
                      strokeWidth="3"
                      fill="none"
                      className="animate-pulse"
                    />
                    <circle cx="25" cy="30" r="2" fill="#f97316" className="animate-ping" />
                    <circle cx="75" cy="20" r="2" fill="#f97316" className="animate-ping" style={{animationDelay: '0.5s'}} />
                    <circle cx="125" cy="25" r="2" fill="#f97316" className="animate-ping" style={{animationDelay: '1s'}} />
                    <circle cx="175" cy="30" r="2" fill="#f97316" className="animate-ping" style={{animationDelay: '1.5s'}} />
                  </svg>
                </div>
                <div className="text-sm text-orange-700">
                  Total Fat: {result.nutrition?.per100g?.total_fat_g || 'N/A'}g
                  <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{width: `${Math.min(100, (result.nutrition?.per100g?.total_fat_g || 0) * 2)}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Overall Health Score */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-4 text-green-800 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Overall Health Score
                </h3>
                <div className="relative h-20 mb-4 flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#10b981"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - (result.nutrition?.healthScore || 0) / 100)}`}
                        className="transition-all duration-2000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">
                        {result.nutrition?.healthScore || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-green-700 text-center">
                  Safety Level: {result.nutrition?.safetyLevel || 'Unknown'}
                </div>
              </div>
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


          {/* Customized Risk Report Button - Only show after successful analysis */}
          {result && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-md p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <UserCheck className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Get Personalized Analysis</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Get a detailed risk assessment based on your health profile, allergies, and dietary restrictions
              </p>
              <button
                onClick={() => {
                  // Check if analysis data exists before navigating
                  const storedData = localStorage.getItem('lastScannedFood');
                  if (!storedData) {
                    alert('Please complete the food analysis first before viewing the customized risk report.');
                    return;
                  }
                  setLocation('/customized-risk-report');
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-medium flex items-center space-x-2 mx-auto"
              >
                <UserCheck className="w-5 h-5" />
                <span>View Customized Risk Report</span>
              </button>
            </div>
          )}


        </div>
      )}
    </div>
  );
}