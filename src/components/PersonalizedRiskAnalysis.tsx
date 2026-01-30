import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Shield, Heart, Brain, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { getGeminiResponse } from '@/lib/geminiService';
import { ModernNavbar } from '@/components/ModernNavbar';
import { BottomNavigation } from '@/components/navigation';

interface HealthProfile {
  allergies: string[];
  healthConditions: string[];
  dietaryRestrictions: string[];
}

interface PersonalizedRisk {
  level: 'safe' | 'warning' | 'danger';
  title: string;
  message: string;
  recommendation: string;
  aiExplanation?: string;
}

export default function PersonalizedRiskAnalysis() {
  const [, setLocation] = useLocation();
  const [scannedData, setScannedData] = useState<any>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    allergies: ['ghee', 'peanut', 'dairy'],
    healthConditions: ['diabetes', 'high cholesterol'],
    dietaryRestrictions: ['low sodium', 'low sugar']
  });
  const [riskAnalysis, setRiskAnalysis] = useState<PersonalizedRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');

  useEffect(() => {
    // Load scanned food data from localStorage
    const storedData = localStorage.getItem('lastScannedFood');
    if (storedData) {
      const data = JSON.parse(storedData);
      setScannedData(data);
      analyzePersonalizedRisks(data);
    } else {
      setLoading(false);
    }
  }, []);

  const analyzePersonalizedRisks = async (foodData: any) => {
    setLoading(true);
    const risks: PersonalizedRisk[] = [];

    // Check for allergies (Critical Risk)
    if (foodData.ingredientAnalysis) {
      const allergenMatches = foodData.ingredientAnalysis.filter((ingredient: any) =>
        healthProfile.allergies.some(allergy => 
          ingredient.name.toLowerCase().includes(allergy.toLowerCase()) ||
          ingredient.ingredient.toLowerCase().includes(allergy.toLowerCase())
        )
      );

      allergenMatches.forEach((match: any) => {
        const allergen = healthProfile.allergies.find(allergy => 
          match.name.toLowerCase().includes(allergy.toLowerCase()) ||
          match.ingredient.toLowerCase().includes(allergy.toLowerCase())
        );
        
        risks.push({
          level: 'danger',
          title: `🚨 CRITICAL ALLERGY ALERT`,
          message: `This product contains ${allergen?.toUpperCase()}. You are allergic to ${allergen}.`,
          recommendation: `DO NOT CONSUME. This could trigger severe allergic reactions including digestive issues, skin reactions, or respiratory problems.`
        });
      });
    }

    // Check for health condition conflicts (Warning Risk)
    if (foodData.nutrition?.per100g) {
      const nutrition = foodData.nutrition.per100g;
      
      // Diabetes check
      if (healthProfile.healthConditions.includes('diabetes')) {
        if (nutrition.sugar_g && nutrition.sugar_g > 10) {
          risks.push({
            level: 'warning',
            title: '⚠️ DIABETES WARNING',
            message: `High sugar content (${nutrition.sugar_g}g per 100g) detected.`,
            recommendation: `This product may cause blood sugar spikes. Limit consumption or avoid if managing diabetes strictly.`
          });
        }
      }

      // High cholesterol check
      if (healthProfile.healthConditions.includes('high cholesterol')) {
        if (nutrition.total_fat_g && nutrition.total_fat_g > 15) {
          risks.push({
            level: 'warning',
            title: '⚠️ CHOLESTEROL WARNING',
            message: `High fat content (${nutrition.total_fat_g}g per 100g) detected.`,
            recommendation: `High fat foods may worsen cholesterol levels. Consider limiting portion size or choosing lower-fat alternatives.`
          });
        }
      }

      // Low sodium restriction
      if (healthProfile.dietaryRestrictions.includes('low sodium')) {
        if (nutrition.sodium_mg && nutrition.sodium_mg > 400) {
          risks.push({
            level: 'warning',
            title: '⚠️ HIGH SODIUM WARNING',
            message: `High sodium content (${nutrition.sodium_mg}mg per 100g) detected.`,
            recommendation: `This exceeds recommended daily sodium intake. May contribute to high blood pressure and heart issues.`
          });
        }
      }
    }

    // If no risks found, add safe message
    if (risks.length === 0) {
      risks.push({
        level: 'safe',
        title: '✅ SAFE TO CONSUME',
        message: 'No allergens or health condition conflicts detected.',
        recommendation: 'This product appears safe based on your health profile. Enjoy in moderation as part of a balanced diet.'
      });
    }

    setRiskAnalysis(risks);

    // Generate AI recommendations
    await generateAIRecommendations(foodData, risks);
    setLoading(false);
  };

  const generateAIRecommendations = async (foodData: any, risks: PersonalizedRisk[]) => {
    try {
      const prompt = `
        User Health Profile:
        - Allergies: ${healthProfile.allergies.join(', ')}
        - Health Conditions: ${healthProfile.healthConditions.join(', ')}
        - Dietary Restrictions: ${healthProfile.dietaryRestrictions.join(', ')}

        Scanned Food Product:
        - Product: ${foodData.productName || 'Food Product'}
        - Ingredients: ${foodData.ingredientAnalysis?.map((i: any) => i.name).join(', ') || 'Not available'}
        - Nutrition: ${JSON.stringify(foodData.nutrition?.per100g || {})}

        Risk Analysis Results:
        ${risks.map(r => `- ${r.title}: ${r.message}`).join('\n')}

        Please provide:
        1. A personalized explanation of the health impact
        2. Safe consumption advice (if any)
        3. Alternative food suggestions
        4. Long-term health considerations
        
        Keep the response friendly, informative, and actionable.
      `;

      const aiResponse = await getGeminiResponse(prompt);
      setAiRecommendations(aiResponse);
    } catch (error) {
      console.error('AI recommendation error:', error);
      setAiRecommendations('AI recommendations are currently unavailable. Please consult with a healthcare professional for personalized advice.');
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'danger': return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'safe': return <CheckCircle className="w-6 h-6 text-green-600" />;
      default: return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'danger': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'safe': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="pt-32 pb-20 px-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing personalized health risks...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!scannedData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="pt-32 pb-20 px-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Scanned Data Found</h2>
            <p className="text-gray-600 mb-6">Please scan a food product first using Generic Analysis.</p>
            <Button onClick={() => setLocation('/generic')} className="bg-blue-600 hover:bg-blue-700 px-6 py-3">
              Go to Generic Analysis
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />
      
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/generic')} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Generic Analysis
            </Button>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900">Personalized Risk Report</h1>
              <p className="text-sm text-gray-600">Based on your health profile</p>
            </div>
          </div>

        {/* Scanned Product Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Scanned Product Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {scannedData.imageUrl && (
                <img 
                  src={scannedData.imageUrl} 
                  alt="Scanned product" 
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{scannedData.productName || 'Food Product'}</h3>
                <p className="text-sm text-gray-600">
                  Scanned on {new Date(scannedData.scannedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">
                    {scannedData.ingredientAnalysis?.length || 0} ingredients
                  </Badge>
                  <Badge variant="outline">
                    Safety Score: {scannedData.nutrition?.healthScore || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Your Health Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-red-600 mb-2">Allergies</h4>
                <div className="space-y-1">
                  {healthProfile.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="mr-1">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-orange-600 mb-2">Health Conditions</h4>
                <div className="space-y-1">
                  {healthProfile.healthConditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="mr-1">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Dietary Restrictions</h4>
                <div className="space-y-1">
                  {healthProfile.dietaryRestrictions.map((restriction, index) => (
                    <Badge key={index} variant="outline" className="mr-1">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Risk Analysis Results
          </h2>
          
          {riskAnalysis.map((risk, index) => (
            <Card key={index} className={`border-2 ${getRiskBg(risk.level)}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getRiskIcon(risk.level)}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{risk.title}</h3>
                    <p className="text-gray-700 mb-3">{risk.message}</p>
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="text-sm font-medium">Recommendation:</p>
                      <p className="text-sm text-gray-700">{risk.recommendation}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Personalized Recommendations */}
        {aiRecommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {aiRecommendations}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button onClick={() => setLocation('/generic')} variant="outline" className="px-6 py-3">
            Scan Another Product
          </Button>
          <Button onClick={() => setLocation('/healing-recipes')} className="bg-green-600 hover:bg-green-700 px-6 py-3">
            Find Safe Alternatives
          </Button>
        </div>
      </div>
    </div>
    
    <BottomNavigation />
  </div>
  );
}