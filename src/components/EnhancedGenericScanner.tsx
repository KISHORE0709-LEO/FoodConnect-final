import React, { useState, useRef } from 'react';
import { Camera, Upload, Zap, Brain, Microscope, BarChart3, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AnalysisResult {
  productName: string;
  confidence: number;
  processingTime: number;
  qualityGrade: string;
  safetyScore: string;
  nutriScore?: {
    grade: string;
    healthScore: number;
    rawScore: number;
  };
  ingredients: {
    list: string[];
    analysis: any;
    summary: any;
  };
  nutrition: {
    values: any;
    analysis: any;
  };
  safety: {
    assessment: any;
    riskFactors: any[];
    recommendations: string[];
  };
  health: {
    recommendations: string[];
    allergens: string[];
  };
  summary: {
    overallStatus: string;
    statusColor: string;
    insights: string[];
    topRecommendations: string[];
    keyMetrics: any;
  };
}

export function EnhancedGenericScanner() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisType, setAnalysisType] = useState<'quick' | 'detailed' | 'ingredients' | 'nutrition'>('detailed');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStep('Preprocessing image...');
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      setCurrentStep('Enhanced OCR processing...');
      
      const response = await fetch(`http://localhost:5002/api/generic/analyze?type=${analysisType}`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep('Analysis complete!');

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        setProgress(0);
        setCurrentStep('');
      }, 2000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzeImage(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'moderate': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'caution': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'caution': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">🤖 Enhanced Generic Analysis</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          AI-powered food analysis with maximum accuracy OCR, ML-based ingredient assessment, 
          and comprehensive safety evaluation
        </p>
        
        {/* Analysis Type Selector */}
        <div className="flex justify-center space-x-2">
          <Button
            variant={analysisType === 'quick' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAnalysisType('quick')}
            className="flex items-center space-x-1"
          >
            <Zap className="w-4 h-4" />
            <span>Quick</span>
          </Button>
          <Button
            variant={analysisType === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAnalysisType('detailed')}
            className="flex items-center space-x-1"
          >
            <Brain className="w-4 h-4" />
            <span>Detailed</span>
          </Button>
          <Button
            variant={analysisType === 'ingredients' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAnalysisType('ingredients')}
            className="flex items-center space-x-1"
          >
            <Microscope className="w-4 h-4" />
            <span>Ingredients</span>
          </Button>
          <Button
            variant={analysisType === 'nutrition' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAnalysisType('nutrition')}
            className="flex items-center space-x-1"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Nutrition</span>
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Camera Scan */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">AI Instant Scan</h3>
              <p className="text-sm text-gray-600">Live camera with enhanced OCR</p>
              <Button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                Open Camera
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* File Upload */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Smart Upload</h3>
              <p className="text-sm text-gray-600">ML-powered analysis</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Progress */}
          {isAnalyzing && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{currentStep}</span>
                <span className="text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Enhanced processing in progress...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(result.summary.overallStatus)}
                  <span>{result.productName}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(result.summary.overallStatus)}>
                    {result.summary.overallStatus.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    Grade: {result.qualityGrade}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.confidence}%</div>
                  <div className="text-sm text-gray-600">OCR Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.summary.keyMetrics.safetyScore}</div>
                  <div className="text-sm text-gray-600">Safety Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.summary.keyMetrics.ingredientsCount}</div>
                  <div className="text-sm text-gray-600">Ingredients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{result.processingTime}ms</div>
                  <div className="text-sm text-gray-600">Processing Time</div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Key Insights</h4>
                <div className="grid gap-2">
                  {result.summary.insights.map((insight, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="ingredients" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="ingredients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ingredient Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {result.ingredients.list.map((ingredient, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{ingredient}</span>
                        <Badge variant="outline">Analyzed</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nutritional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.nutriScore && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">Nutri-Score: {result.nutriScore.grade}</div>
                          <div className="text-sm text-gray-600">Health Score: {result.nutriScore.healthScore}/100</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">Raw Score: {result.nutriScore.rawScore}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(result.nutrition.values).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="safety" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Safety Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.safety.riskFactors.map((risk, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold capitalize">{risk.type} Risk</span>
                          <Badge variant={risk.level === 'high' ? 'destructive' : 'secondary'}>
                            {risk.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                        <p className="text-sm font-medium text-blue-600">{risk.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Health Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.summary.topRecommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}