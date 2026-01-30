import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
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
    allergies: [],
    healthConditions: [],
    dietaryRestrictions: []
  });
  const [riskAnalysis, setRiskAnalysis] = useState<PersonalizedRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  const [showDetailedModal, setShowDetailedModal] = useState(false);

  const { user } = useAuth();
  const { userProfile } = useUserProfile();

  useEffect(() => {
    // Load and validate scanned food data from localStorage
    const raw = localStorage.getItem('lastScannedFood');
    console.log('Raw scanned data:', raw); // Debug log
    console.log('Current localStorage keys:', Object.keys(localStorage)); // Debug log
    
    let validStored: any = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        console.log('Parsed scanned data:', parsed); // Debug log
        
        const hasValidAnalysis = parsed && 
          parsed.success === true && 
          (parsed.ingredientAnalysis?.length > 0 || 
           parsed.nutrition?.per100g || 
           parsed.ocrData?.nutrition_facts);
           
        console.log('Has valid analysis:', hasValidAnalysis); // Debug log
        if (hasValidAnalysis) validStored = parsed;
      } catch (e) {
        console.error('Error parsing scanned data:', e);
        validStored = null;
      }
    }

    if (validStored) {
      console.log('Setting scanned data:', validStored); // Debug log
      setScannedData(validStored);
    }

    // Use user profile data with proper fallbacks
    let profileData: HealthProfile = {
      allergies: [],
      healthConditions: [],
      dietaryRestrictions: []
    };

    if (userProfile) {
      profileData = {
        allergies: [
          ...(userProfile.allergies || []),
          ...(userProfile.additionalAllergens || []),
          ...(userProfile.dislikedIngredients || [])
        ].filter(Boolean),
        healthConditions: (userProfile.healthConditions || []).filter(Boolean),
        dietaryRestrictions: userProfile.dietaryPreferences ? [userProfile.dietaryPreferences] : []
      };
      console.log('Using userProfile data:', profileData); // Debug log
    } else if (user) {
      profileData = {
        allergies: (user.allergies || []).filter(Boolean),
        healthConditions: (user.healthConditions || []).filter(Boolean),
        dietaryRestrictions: user.dietaryPreferences ? [user.dietaryPreferences] : []
      };
      console.log('Using user data:', profileData); // Debug log
    } else {
      console.log('No user profile found, using empty profile'); // Debug log
    }
    
    setHealthProfile(profileData);

    // Trigger analysis only when we have valid scan data
    if (validStored) {
      console.log('Starting analysis with data:', validStored, 'and profile:', profileData); // Debug log
      analyzePersonalizedRisks(validStored);
    } else {
      console.log('No valid scanned data found'); // Debug log
      setLoading(false);
    }
  }, [user, userProfile]);

  const analyzePersonalizedRisks = async (foodData: any) => {
    setLoading(true);
    const risks: PersonalizedRisk[] = [];

    // Extract ingredients from actual scanned data
    const ingredientNames: string[] = [];
    if (foodData.ingredientAnalysis && Array.isArray(foodData.ingredientAnalysis)) {
      for (const ing of foodData.ingredientAnalysis) {
        const name = (ing.name || ing.ingredient || '').toString().toLowerCase();
        if (name) ingredientNames.push(name);
      }
    }

    // Check for allergen matches using actual user profile
    const foundAllergens = new Set<string>();
    for (const allergyRaw of healthProfile.allergies || []) {
      const allergy = allergyRaw.toLowerCase().trim();
      if (!allergy) continue;

      for (const ing of ingredientNames) {
        if (ing.includes(allergy) || allergy.includes(ing)) {
          foundAllergens.add(allergyRaw);
        }
      }
    }

    // Add critical allergen risks
    for (const allergen of Array.from(foundAllergens)) {
      risks.push({
        level: 'danger',
        title: `🚨 CRITICAL ALLERGY ALERT`,
        message: `This product contains ${allergen}. You have a matching allergy in your profile.`,
        recommendation: `DO NOT CONSUME. Even small amounts may trigger severe allergic reactions.`
      });
    }

    // Use actual nutrition data from scan
    const nutrition = foodData.nutrition?.per100g || foodData.per100g_display || {};
    const getNum = (key: string) => {
      const val = nutrition[key] || nutrition[key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())];
      return val ? parseFloat(val.toString()) : null;
    };

    const sugar = getNum('total_sugar_g') || getNum('sugar_g') || getNum('Total Sugars (g)');
    const sodium = getNum('sodium_mg') || getNum('Sodium (mg)');
    const totalFat = getNum('total_fat_g') || getNum('Total Fat (g)');
    const satFat = getNum('saturated_fat_g') || getNum('Saturated Fat (g)');

    // Check health condition conflicts using actual user conditions
    for (const condition of healthProfile.healthConditions || []) {
      const conditionLower = condition.toLowerCase();
      
      if (conditionLower.includes('diabetes') && sugar && sugar > 10) {
        risks.push({
          level: 'warning',
          title: '⚠️ DIABETES WARNING',
          message: `High sugar content (${sugar}g per 100g) detected. This may affect your blood glucose levels.`,
          recommendation: `Consider limiting portion size and monitor blood sugar levels after consumption.`
        });
      }
      
      if ((conditionLower.includes('cholesterol') || conditionLower.includes('heart')) && 
          ((satFat && satFat > 5) || (totalFat && totalFat > 15))) {
        risks.push({
          level: 'warning',
          title: '⚠️ HEART HEALTH WARNING',
          message: `High fat content detected (Total: ${totalFat || 'N/A'}g, Saturated: ${satFat || 'N/A'}g per 100g).`,
          recommendation: `This may impact your cholesterol levels. Consider choosing lower-fat alternatives.`
        });
      }
      
      if ((conditionLower.includes('hypertension') || conditionLower.includes('blood pressure')) && 
          sodium && sodium > 400) {
        risks.push({
          level: 'warning',
          title: '⚠️ HIGH BLOOD PRESSURE WARNING',
          message: `High sodium content (${sodium}mg per 100g) detected.`,
          recommendation: `This may raise your blood pressure. Consider low-sodium alternatives.`
        });
      }
    }

    // If no risks found, add safe message
    if (risks.length === 0) {
      risks.push({
        level: 'safe',
        title: '✅ SAFE FOR YOUR PROFILE',
        message: 'No allergens or health condition conflicts detected based on your profile.',
        recommendation: 'This product appears safe for you. Enjoy in moderation as part of a balanced diet.'
      });
    }

    setRiskAnalysis(risks);
    await generateAIRecommendations(foodData, risks);
    setLoading(false);
  };

  const generateAIRecommendations = async (foodData: any, risks: PersonalizedRisk[]) => {
    try {
      const actualAllergies = healthProfile.allergies.filter(Boolean);
      const actualConditions = healthProfile.healthConditions.filter(Boolean);
      const actualRestrictions = healthProfile.dietaryRestrictions.filter(Boolean);
      
      const prompt = `
        User Health Profile:
        - Allergies: ${actualAllergies.length > 0 ? actualAllergies.join(', ') : 'None specified'}
        - Health Conditions: ${actualConditions.length > 0 ? actualConditions.join(', ') : 'None specified'}
        - Dietary Restrictions: ${actualRestrictions.length > 0 ? actualRestrictions.join(', ') : 'None specified'}

        Scanned Food Product:
        - Product: ${foodData.productName || 'Food Product'}
        - Ingredients: ${foodData.ingredientAnalysis?.map((i: any) => i.name || i.ingredient).join(', ') || 'Not available'}
        - Nutrition per 100g: ${JSON.stringify(foodData.nutrition?.per100g || foodData.per100g_display || {})}
        - Safety Score: ${foodData.nutrition?.healthScore || 'Not available'}

        Risk Analysis Results:
        ${risks.map(r => `- ${r.title}: ${r.message}`).join('\n')}

        Based on this ACTUAL data, provide:
        1. Personalized health impact explanation
        2. Safe consumption advice (if applicable)
        3. Alternative food suggestions
        4. Long-term health considerations
        
        Keep response concise and actionable.
      `;

      const aiResponse = await getGeminiResponse(prompt);
      setAiRecommendations(aiResponse);
    } catch (error) {
      console.error('AI recommendation error:', error);
      setAiRecommendations('AI recommendations are currently unavailable. The analysis above is based on your actual health profile and scanned food data.');
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Data Found</h2>
            <p className="text-gray-600 mb-6">
              Please complete a Generic Analysis first. Make sure OCR service is running:
              <code className="block mt-2 p-2 bg-gray-100 text-sm rounded">cd OCR && python test_ocr_simple.py</code>
            </p>
            <div className="space-y-3">
              <Button onClick={() => setLocation('/generic')} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 w-full">
                Go to Generic Analysis
              </Button>
              <p className="text-xs text-gray-500">
                Debug: Check browser console for data loading issues
              </p>
            </div>
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

  // Debug logs for render
  console.log('Rendering with scannedData:', scannedData?.productName);
  console.log('Risk analysis results:', riskAnalysis.length, 'risks found');
  console.log('Overall risk level:', overallRisk);
  console.log('Safety score:', safetyScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <ModernNavbar />
      
      <div className="pt-20 pb-12">
        {/* Prompt to sign in for richer profile data */}
        {!user && (
          <div className="max-w-5xl mx-auto px-4 mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-800 font-medium">Sign in for personalized reports</p>
                  <p className="text-xs text-yellow-700">Sign in to fetch your saved allergies, health conditions and dietary preferences from your profile for a tailored risk analysis.</p>
                </div>
                <div>
                  <Button onClick={() => setLocation('/profile')}>Go to Profile</Button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                    {criticalRisks.map(r => r.message).join(', ')}
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
                  <p className="text-xl opacity-90">{warningRisks.map(r => r.title.replace(/⚠️\s*/, '')).join(', ')}</p>
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
                  <h1 className="text-2xl font-bold mb-1">✅ SAFE FOR YOUR PROFILE</h1>
                  <p className="text-sm opacity-90">Safe to consume based on your profile</p>
                </div>
              </div>
              <p className="text-center text-sm opacity-90 max-w-xl mx-auto">
                {safeItems[0]?.message || 'This product appears safe based on your profile. Enjoy in moderation.'}
              </p>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4">
          {/* Premium Product Summary */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-6">
              {(scannedData.imageUrl || previewUrl) && (
                <div className="flex-shrink-0">
                  <img 
                    src={scannedData.imageUrl || previewUrl} 
                    alt="Scanned product" 
                    className="w-32 h-40 object-contain rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {scannedData.productName || 'Scanned Food Product'}
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Safety Score</span>
                    <CircularProgress score={safetyScore} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 mb-2 block">Risk Analysis Results</span>
                    <div className="flex flex-wrap gap-1">
                      {criticalRisks.length > 0 ? (
                        criticalRisks.map((risk, index) => {
                          const allergen = risk.message.match(/contains ([\w\s]+)/i)?.[1] || 'allergen';
                          return (
                            <Badge key={index} className="bg-red-100 text-red-800 border-red-200 px-2 py-1 text-xs">
                              ⚠️ {allergen}
                            </Badge>
                          );
                        })
                      ) : warningRisks.length > 0 ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-2 py-1 text-xs">
                          ⚠️ Health warnings
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-2 py-1 text-xs">
                          ✅ Safe for your profile
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
                    Scanned: {new Date(scannedData.scannedAt || Date.now()).toLocaleDateString()}
                  </Badge>
                  {scannedData.nutrition?.healthScore && (
                    <Badge className="bg-green-50 text-green-700 border-green-200 px-2 py-1 text-xs">
                      Health Score: {scannedData.nutrition.healthScore}/100
                    </Badge>
                  )}
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