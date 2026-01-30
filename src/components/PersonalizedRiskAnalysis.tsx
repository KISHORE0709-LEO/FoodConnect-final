import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Shield, Heart, Brain, CheckCircle, XCircle, AlertCircle, ShoppingCart, RotateCcw, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { getGeminiResponse } from '@/lib/geminiService';
import { ModernNavbar } from '@/components/ModernNavbar';
import { BottomNavigation } from '@/components/navigation';
import DetailedAnalysisModal from './DetailedAnalysisModal';

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
  const [showDetailedModal, setShowDetailedModal] = useState(false);

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

  const getOverallRiskLevel = () => {
    if (riskAnalysis.some(r => r.level === 'danger')) return 'danger';
    if (riskAnalysis.some(r => r.level === 'warning')) return 'warning';
    return 'safe';
  };

  const getSafetyScore = () => {
    const dangerCount = riskAnalysis.filter(r => r.level === 'danger').length;
    const warningCount = riskAnalysis.filter(r => r.level === 'warning').length;
    
    if (dangerCount > 0) return Math.max(10, 40 - (dangerCount * 20));
    if (warningCount > 0) return Math.max(50, 80 - (warningCount * 10));
    return 95;
  };

  const CircularProgress = ({ score }: { score: number }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    const getColor = () => {
      if (score >= 80) return '#10B981'; // green
      if (score >= 60) return '#F59E0B'; // orange
      return '#EF4444'; // red
    };

    return (
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={getColor()}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: getColor() }}>
            {score}
          </span>
        </div>
      </div>
    );
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

  const overallRisk = getOverallRiskLevel();
  const safetyScore = getSafetyScore();
  const criticalRisks = riskAnalysis.filter(r => r.level === 'danger');
  const warningRisks = riskAnalysis.filter(r => r.level === 'warning');
  const safeItems = riskAnalysis.filter(r => r.level === 'safe');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <ModernNavbar />
      
      <div className="pt-20 pb-12">
        {/* Back Button */}
        <div className="px-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/generic')} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </Button>
        </div>

        {/* Hero Risk Banner */}
        <div className="px-4 mb-6">
          {overallRisk === 'danger' ? (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-8 shadow-2xl border border-red-400">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 rounded-full p-4 mr-4">
                  <AlertTriangle className="w-12 h-12" />
                </div>
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-2">⚠ DO NOT CONSUME</h1>
                  <p className="text-xl opacity-90">
                    Contains: {criticalRisks.map(r => r.message.match(/contains (\w+)/i)?.[1] || 'allergen').join(', ')}
                  </p>
                </div>
              </div>
              <p className="text-center text-lg opacity-90 max-w-2xl mx-auto">
                This product contains ingredients that may trigger severe allergic reactions based on your health profile.
              </p>
            </div>
          ) : overallRisk === 'warning' ? (
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-2xl p-8 shadow-2xl border border-orange-300">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 rounded-full p-4 mr-4">
                  <AlertCircle className="w-12 h-12" />
                </div>
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-2">⚠ CONSUME WITH CAUTION</h1>
                  <p className="text-xl opacity-90">Health condition conflicts detected</p>
                </div>
              </div>
              <p className="text-center text-lg opacity-90 max-w-2xl mx-auto">
                This product may impact your health conditions. Review recommendations below.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6 shadow-2xl border border-primary/20">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-white/20 rounded-full p-3 mr-3">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-1">✓ Compatible With Your Health Profile</h1>
                  <p className="text-sm opacity-90">Safe to consume based on your profile</p>
                </div>
              </div>
              <p className="text-center text-sm opacity-90 max-w-xl mx-auto">
                No allergens or health condition conflicts detected. Enjoy as part of a balanced diet.
              </p>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4">
          {/* Premium Product Summary */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-6">
              {scannedData.imageUrl && (
                <div className="flex-shrink-0">
                  <img 
                    src={scannedData.imageUrl} 
                    alt="Scanned product" 
                    className="w-32 h-40 object-contain rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {scannedData.productName || 'Food Product'}
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Safety Score</span>
                    <CircularProgress score={safetyScore} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 mb-2 block">Flagged Ingredients</span>
                    <div className="flex flex-wrap gap-1">
                      {criticalRisks.length > 0 ? (
                        criticalRisks.map((risk, index) => {
                          const allergen = risk.message.match(/contains (\w+)/i)?.[1];
                          return allergen ? (
                            <Badge key={index} className="bg-red-100 text-red-800 border-red-200 px-2 py-1 text-xs">
                              {allergen}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-2 py-1 text-xs">
                          None detected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-1 text-xs">
                    {scannedData.ingredientAnalysis?.length || 0} ingredients
                  </Badge>
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 px-2 py-1 text-xs">
                    {new Date(scannedData.scannedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Breakdown - Large Vertical Cards */}
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Risk Breakdown</h2>
            
            {/* Allergy Analysis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <span className="text-xl">🧬</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Allergy Analysis</h3>
                    <p className="text-sm text-gray-600">Checking against your known allergies</p>
                  </div>
                  <div>
                    {criticalRisks.length > 0 ? (
                      <Badge className="bg-red-500 text-white px-3 py-1 text-sm font-semibold">
                        CRITICAL
                      </Badge>
                    ) : (
                      <Badge className="bg-primary text-white px-3 py-1 text-sm font-semibold">
                        SAFE
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                {criticalRisks.length > 0 ? (
                  <div className="space-y-4">
                    {criticalRisks.map((risk, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-base text-red-900 mb-1">{risk.title}</h4>
                            <p className="text-red-800 mb-2 text-sm">{risk.message}</p>
                            <p className="text-xs text-red-700 bg-red-100 rounded-lg p-2">
                              <strong>Action Required:</strong> {risk.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="text-lg font-semibold text-primary mb-1">No Allergens Detected</h4>
                    <p className="text-gray-700 text-sm">This product is safe based on your allergy profile.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Health Condition Impact */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-secondary/5 to-primary/5 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/10 rounded-full p-2">
                    <span className="text-xl">❤️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Health Condition Impact</h3>
                    <p className="text-sm text-gray-600">Impact on diabetes, cholesterol, and other conditions</p>
                  </div>
                  <div>
                    {warningRisks.length > 0 ? (
                      <Badge className="bg-orange-500 text-white px-3 py-1 text-sm font-semibold">
                        WARNING
                      </Badge>
                    ) : (
                      <Badge className="bg-primary text-white px-3 py-1 text-sm font-semibold">
                        SAFE
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-8">
                {warningRisks.length > 0 ? (
                  <div className="space-y-4">
                    {warningRisks.map((risk, index) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-lg text-orange-900 mb-2">{risk.title}</h4>
                            <p className="text-orange-800 mb-3">{risk.message}</p>
                            <p className="text-sm text-orange-700 bg-orange-100 rounded-lg p-3">
                              <strong>Recommendation:</strong> {risk.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-green-900 mb-2">No Health Conflicts</h4>
                    <p className="text-green-700">This product aligns well with your health conditions.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dietary Restriction Compatibility */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <span className="text-xl">🥗</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Dietary Restriction Compatibility</h3>
                    <p className="text-sm text-gray-600">Alignment with your dietary preferences</p>
                  </div>
                  <div>
                    <Badge className="bg-secondary text-white px-3 py-1 text-sm font-semibold">
                      COMPATIBLE
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-blue-900 mb-2">Dietary Goals Supported</h4>
                  <p className="text-blue-700">This product fits within your dietary restrictions.</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {healthProfile.dietaryRestrictions.map((restriction, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Health Advisor Insight */}
          {aiRecommendations && (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl shadow-xl border border-primary/20 overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">AI Health Advisor Insight</h3>
                    <p className="opacity-90 text-sm">Personalized recommendations based on your profile</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-gray-700 text-sm leading-relaxed">
                  <div className="whitespace-pre-wrap">{aiRecommendations}</div>
                </div>
              </div>
            </div>
          )}

          {/* Strong Call-to-Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
            <Button 
              onClick={() => setLocation('/generic')} 
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Another
            </Button>
            <Button 
              onClick={() => setLocation('/healing-recipes')} 
              className="bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Safer Options
            </Button>
            <Button 
              onClick={() => setShowDetailedModal(true)} 
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Details
            </Button>
          </div>
        </div>
      </div>
      
      <DetailedAnalysisModal 
        isOpen={showDetailedModal}
        onClose={() => setShowDetailedModal(false)}
        scannedData={scannedData}
        healthProfile={healthProfile}
        riskAnalysis={riskAnalysis}
      />
      
      <BottomNavigation />
    </div>
  );
}