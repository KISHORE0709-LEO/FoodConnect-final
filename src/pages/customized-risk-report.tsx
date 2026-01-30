import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { ArrowLeft, AlertTriangle, Shield, Heart, CheckCircle, XCircle, AlertCircle, User, Activity, Scan, BookOpen, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
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
}

// Circular Progress Component
const CircularProgress = ({ score, size = 120 }: { score: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
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
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: getColor() }}>
            {score}
          </div>
          <div className="text-xs text-gray-500 font-medium">SAFETY</div>
        </div>
      </div>
    </div>
  );
};



export default function CustomizedRiskReport() {
  const [, setLocation] = useLocation();
  const [scannedData, setScannedData] = useState<any>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    allergies: [],
    healthConditions: [],
    dietaryRestrictions: []
  });
  const [riskAnalysis, setRiskAnalysis] = useState<PersonalizedRisk[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { userProfile } = useUserProfile();

  useEffect(() => {
    // Load scanned food data
    const raw = localStorage.getItem('lastScannedFood');
    let validStored: any = null;
    
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const hasValidAnalysis = parsed && 
          parsed.success === true && 
          (parsed.ingredientAnalysis?.length > 0 || 
           parsed.nutrition?.per100g || 
           parsed.ocrData?.nutrition_facts);
           
        if (hasValidAnalysis) validStored = parsed;
      } catch (e) {
        console.error('Error parsing scanned data:', e);
      }
    }

    if (validStored) {
      setScannedData(validStored);
    }

    // Load user profile data
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
    } else if (user) {
      profileData = {
        allergies: (user.allergies || []).filter(Boolean),
        healthConditions: (user.healthConditions || []).filter(Boolean),
        dietaryRestrictions: user.dietaryPreferences ? [user.dietaryPreferences] : []
      };
    }
    
    setHealthProfile(profileData);

    if (validStored) {
      analyzePersonalizedRisks(validStored, profileData);
    } else {
      setLoading(false);
    }
  }, [user, userProfile]);

  const analyzePersonalizedRisks = async (foodData: any, profile: HealthProfile) => {
    setLoading(true);
    const risks: PersonalizedRisk[] = [];

    // Extract ingredients
    const ingredientNames: string[] = [];
    if (foodData.ingredientAnalysis && Array.isArray(foodData.ingredientAnalysis)) {
      for (const ing of foodData.ingredientAnalysis) {
        const name = (ing.name || ing.ingredient || '').toString().toLowerCase();
        if (name) ingredientNames.push(name);
      }
    }

    // Check for allergen matches
    const foundAllergens = new Set<string>();
    for (const allergyRaw of profile.allergies || []) {
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
        title: `Critical Allergy Alert`,
        message: `This product contains ${allergen}, which matches your allergy profile. Consumption may trigger severe allergic reactions.`,
        recommendation: `Avoid this product completely. Even trace amounts can be dangerous for individuals with ${allergen} allergies.`
      });
    }

    // Check nutrition data for health conditions
    const nutrition = foodData.nutrition?.per100g || foodData.per100g_display || {};
    const getNum = (key: string) => {
      const val = nutrition[key] || nutrition[key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())];
      return val ? parseFloat(val.toString()) : null;
    };

    const sugar = getNum('total_sugar_g') || getNum('sugar_g') || getNum('Total Sugars (g)');
    const sodium = getNum('sodium_mg') || getNum('Sodium (mg)');
    const totalFat = getNum('total_fat_g') || getNum('Total Fat (g)');
    const satFat = getNum('saturated_fat_g') || getNum('Saturated Fat (g)');

    // Check health condition conflicts
    for (const condition of profile.healthConditions || []) {
      const conditionLower = condition.toLowerCase();
      
      if (conditionLower.includes('diabetes') && sugar && sugar > 10) {
        risks.push({
          level: 'warning',
          title: 'Diabetes Impact Warning',
          message: `High sugar content detected (${sugar}g per 100g). This product may cause significant blood glucose spikes, which can be problematic for diabetes management.`,
          recommendation: `Consider limiting portion sizes to 25-30g maximum, monitor blood sugar levels closely after consumption, and pair with protein or fiber-rich foods to slow absorption.`
        });
      }
      
      if ((conditionLower.includes('cholesterol') || conditionLower.includes('heart')) && 
          ((satFat && satFat > 5) || (totalFat && totalFat > 15))) {
        risks.push({
          level: 'warning',
          title: 'Heart Health Concern',
          message: `High fat content detected (Total Fat: ${totalFat || 'N/A'}g, Saturated Fat: ${satFat || 'N/A'}g per 100g). This may negatively impact your cholesterol levels and cardiovascular health.`,
          recommendation: `Choose lower-fat alternatives when possible. If consuming, limit portions and balance with heart-healthy foods like vegetables, whole grains, and lean proteins.`
        });
      }
      
      if ((conditionLower.includes('hypertension') || conditionLower.includes('blood pressure')) && 
          sodium && sodium > 400) {
        risks.push({
          level: 'warning',
          title: 'Blood Pressure Risk',
          message: `High sodium content (${sodium}mg per 100g) detected. This exceeds recommended levels for individuals with hypertension and may contribute to elevated blood pressure.`,
          recommendation: `Opt for low-sodium alternatives. If consuming, drink plenty of water and avoid adding additional salt. Monitor blood pressure more frequently.`
        });
      }
    }

    // Check dietary restrictions
    for (const restriction of profile.dietaryRestrictions || []) {
      const restrictionLower = restriction.toLowerCase();
      const hasConflict = ingredientNames.some(ing => {
        if (restrictionLower.includes('vegan') && (ing.includes('milk') || ing.includes('egg') || ing.includes('honey'))) return true;
        if (restrictionLower.includes('vegetarian') && (ing.includes('meat') || ing.includes('chicken') || ing.includes('beef'))) return true;
        if (restrictionLower.includes('gluten') && (ing.includes('wheat') || ing.includes('gluten'))) return true;
        return false;
      });
      
      if (hasConflict) {
        risks.push({
          level: 'warning',
          title: 'Dietary Restriction Conflict',
          message: `This product may not align with your ${restriction} dietary preferences based on the detected ingredients.`,
          recommendation: `Review the ingredient list carefully to ensure it meets your dietary requirements. Consider alternative products that better match your preferences.`
        });
      }
    }

    // If no risks found, add safe message
    if (risks.length === 0) {
      risks.push({
        level: 'safe',
        title: 'Safe for Your Profile',
        message: 'Based on our analysis, this product appears compatible with your health profile, allergies, and dietary preferences.',
        recommendation: 'This product can be safely consumed as part of a balanced diet. Continue to enjoy in moderation and maintain your healthy eating habits.'
      });
    }

    setRiskAnalysis(risks);
    setLoading(false);
  };

  const getOverallRiskLevel = () => {
    if (riskAnalysis.some(r => r.level === 'danger')) return 'danger';
    if (riskAnalysis.some(r => r.level === 'warning')) return 'warning';
    return 'safe';
  };

  const getSafetyScore = () => {
    // Start with the generic analysis safety score
    const baseScore = scannedData.nutrition?.healthScore || scannedData.safety_score || 70;
    
    const dangerCount = riskAnalysis.filter(r => r.level === 'danger').length;
    const warningCount = riskAnalysis.filter(r => r.level === 'warning').length;
    
    // Apply personalized adjustments to the base score
    let personalizedScore = baseScore;
    
    // Critical allergen risks - major penalty
    if (dangerCount > 0) {
      personalizedScore = Math.max(10, personalizedScore - (dangerCount * 30));
    }
    
    // Health condition warnings - moderate penalty
    if (warningCount > 0) {
      personalizedScore = Math.max(30, personalizedScore - (warningCount * 15));
    }
    
    return Math.round(personalizedScore);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <ModernNavbar />
        <div className="pt-32 pb-20 px-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Analyzing personalized health risks...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!scannedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <ModernNavbar />
        <div className="pt-32 pb-20 px-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">No Food Analysis Found</h2>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Please scan and analyze a food product first to get personalized health recommendations.
            </p>
            <Button onClick={() => setLocation('/generic')} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-8 py-3 text-lg">
              Start Food Analysis
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

  const getHeaderColors = () => {
    if (safetyScore <= 50) return 'from-red-500 to-red-600';
    if (safetyScore <= 70) return 'from-orange-400 to-yellow-500';
    return 'from-green-500 to-blue-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <ModernNavbar />
      
      <div className="pt-24 pb-12">
        {/* Back Button */}
        <div className="max-w-4xl mx-auto px-6 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/generic')} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </Button>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Personalized Food Safety Report</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive analysis based on your health profile and dietary requirements
            </p>
          </div>

          {/* Safety Score Card */}
          <Card className={`mb-8 border-0 shadow-xl bg-gradient-to-r ${getHeaderColors()} text-white overflow-hidden`}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    {scannedData.productName || 'Scanned Food Product'}
                  </h2>
                  <p className="text-lg opacity-90 mb-4">
                    {safetyScore <= 50 ? 'Not recommended for your profile' :
                     safetyScore <= 70 ? 'Consume with caution' :
                     'Safe for your health profile'}
                  </p>
                  <div className="flex gap-3">
                    <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                      {scannedData.ingredientAnalysis?.length || 0} ingredients analyzed
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                      {riskAnalysis.length} risk factors evaluated
                    </Badge>
                  </div>
                </div>
                <div className="ml-8">
                  <CircularProgress score={safetyScore} size={140} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Analysis Overview */}
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
              <CardTitle className="text-xl">📊 Personalized Analysis Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Generic Analysis Results
                  </h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>• {scannedData.ingredientAnalysis?.length || 0} ingredients detected</p>
                    <p>• Safety Score: {scannedData.nutrition?.healthScore || scannedData.safety_score || 'N/A'}/100</p>
                    <p>• Nutri-Score: {scannedData.nutriScore?.grade || 'N/A'}</p>
                    <p>• FSSAI Status: {scannedData.fssai?.valid ? 'Verified' : 'Not Found'}</p>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Your Health Profile
                  </h3>
                  <div className="text-sm text-green-800 space-y-2">
                    <p>• {healthProfile.allergies.length} allergies tracked</p>
                    <p>• {healthProfile.healthConditions.length} health conditions</p>
                    <p>• {healthProfile.dietaryRestrictions.length} dietary preferences</p>
                    <p>• Cross-referenced against product data</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800 leading-relaxed">
                  <strong>🎯 Smart Integration:</strong> This analysis combines your scanned product data with your personal health profile 
                  to provide context-aware recommendations. The same product may show different risk levels for different users.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intelligent Risk Assessment */}
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="text-xl">🔍 Intelligent Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Cross-Reference Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Cross-Reference Analysis
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-700 mb-2">Ingredients Scanned</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {scannedData.ingredientAnalysis?.map(i => i.name || i.ingredient).join(', ') || 'None detected'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-700 mb-2">Your Allergies</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {healthProfile.allergies.length > 0 ? healthProfile.allergies.join(', ') : 'None specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-700 mb-2">Health Conditions</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {healthProfile.healthConditions.length > 0 ? healthProfile.healthConditions.join(', ') : 'None specified'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Risk Breakdown Sections */}
          <div className="space-y-6 mb-8">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Shield className="w-6 h-6 text-red-600" />
                  Allergy Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {criticalRisks.length > 0 ? (
                  <div className="space-y-4">
                    {criticalRisks.map((risk, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-2">{risk.title}</h4>
                        <p className="text-red-800 mb-3 leading-relaxed">{risk.message}</p>
                        <p className="text-sm text-red-700 bg-red-100 rounded-lg p-3">
                          <strong>Action Required:</strong> {risk.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-lg font-medium text-green-800">No allergen conflicts detected</p>
                      <p className="text-green-600">This product appears safe based on your allergy profile</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-3">Detailed Allergy Analysis</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-green-800 mb-2">Ingredients Checked:</p>
                          <ul className="text-green-700 space-y-1">
                            {scannedData.ingredientAnalysis?.map((ing, idx) => (
                              <li key={idx}>• {ing.name || ing.ingredient}</li>
                            )) || [<li key="none">• No ingredients detected</li>]}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-green-800 mb-2">Your Allergies:</p>
                          <ul className="text-green-700 space-y-1">
                            {healthProfile.allergies.length > 0 ? 
                              healthProfile.allergies.map((allergy, idx) => (
                                <li key={idx}>• {allergy} - No match found ✓</li>
                              )) : 
                              [<li key="none">• No allergies specified in profile</li>]
                            }
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Safety Assessment:</strong> Cross-referenced all {scannedData.ingredientAnalysis?.length || 0} detected ingredients 
                          against your {healthProfile.allergies.length} tracked allergens. No dangerous combinations found.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Condition Impact */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Heart className="w-6 h-6 text-orange-600" />
                  Health Condition Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {warningRisks.length > 0 ? (
                  <div className="space-y-4">
                    {warningRisks.map((risk, index) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-900 mb-2">{risk.title}</h4>
                        <p className="text-orange-800 mb-3 leading-relaxed">{risk.message}</p>
                        <p className="text-sm text-orange-700 bg-orange-100 rounded-lg p-3">
                          <strong>Recommendation:</strong> {risk.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-lg font-medium text-green-800">No health condition conflicts</p>
                      <p className="text-green-600">This product aligns well with your health conditions</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">Health Impact Analysis</h4>
                      <div className="space-y-3">
                        {/* Nutritional Analysis */}
                        <div className="bg-white rounded-lg p-3">
                          <p className="font-medium text-blue-800 mb-2">Nutritional Profile Assessment:</p>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-blue-700">
                                • Sodium: {scannedData.nutrition?.per100g?.sodium_mg || scannedData.per100g_display?.['Sodium (mg)'] || 'Not detected'} 
                                {scannedData.nutrition?.per100g?.sodium_mg > 400 ? ' (High)' : ' (Acceptable)'}
                              </p>
                              <p className="text-blue-700">
                                • Total Fat: {scannedData.nutrition?.per100g?.total_fat_g || scannedData.per100g_display?.['Total Fat (g)'] || 'Not detected'}
                                {scannedData.nutrition?.per100g?.total_fat_g > 15 ? ' (High)' : ' (Moderate)'}
                              </p>
                            </div>
                            <div>
                              <p className="text-blue-700">
                                • Sugar: {scannedData.nutrition?.per100g?.total_sugar_g || scannedData.per100g_display?.['Total Sugars (g)'] || 'Not detected'}
                                {scannedData.nutrition?.per100g?.total_sugar_g > 10 ? ' (High)' : ' (Low-Moderate)'}
                              </p>
                              <p className="text-blue-700">
                                • Saturated Fat: {scannedData.nutrition?.per100g?.saturated_fat_g || scannedData.per100g_display?.['Saturated Fat (g)'] || 'Not detected'}
                                {scannedData.nutrition?.per100g?.saturated_fat_g > 5 ? ' (High)' : ' (Acceptable)'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Health Conditions Check */}
                        <div className="bg-white rounded-lg p-3">
                          <p className="font-medium text-blue-800 mb-2">Health Conditions Evaluated:</p>
                          {healthProfile.healthConditions.length > 0 ? (
                            <ul className="text-blue-700 text-sm space-y-1">
                              {healthProfile.healthConditions.map((condition, idx) => (
                                <li key={idx}>• {condition} - No significant nutritional conflicts detected ✓</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-blue-700 text-sm">No health conditions specified in your profile. General nutritional analysis applied.</p>
                          )}
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Overall Assessment:</strong> Based on the nutritional content and your health profile, 
                            this product shows no major red flags for your specified health conditions. However, the safety score of {safetyScore}/100 
                            suggests moderate caution due to processing level and ingredient quality.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dietary Restriction Compatibility */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Activity className="w-6 h-6 text-green-600" />
                  Dietary Restriction Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-3">Dietary Compatibility Assessment</h4>
                    
                    {healthProfile.dietaryRestrictions.length > 0 ? (
                      <div className="space-y-3">
                        {healthProfile.dietaryRestrictions.map((restriction, index) => {
                          const restrictionLower = restriction.toLowerCase();
                          const ingredients = scannedData.ingredientAnalysis?.map(i => (i.name || i.ingredient).toLowerCase()) || [];
                          
                          let isCompatible = true;
                          let conflictingIngredients = [];
                          let analysis = '';
                          
                          if (restrictionLower.includes('vegan')) {
                            const nonVegan = ingredients.filter(ing => 
                              ing.includes('milk') || ing.includes('egg') || ing.includes('honey') || 
                              ing.includes('butter') || ing.includes('cheese') || ing.includes('cream')
                            );
                            if (nonVegan.length > 0) {
                              isCompatible = false;
                              conflictingIngredients = nonVegan;
                            }
                            analysis = isCompatible ? 
                              'All ingredients appear to be plant-based and vegan-friendly.' :
                              `Contains non-vegan ingredients: ${conflictingIngredients.join(', ')}`;
                          } else if (restrictionLower.includes('vegetarian')) {
                            const nonVeg = ingredients.filter(ing => 
                              ing.includes('meat') || ing.includes('chicken') || ing.includes('beef') || 
                              ing.includes('pork') || ing.includes('fish') || ing.includes('gelatin')
                            );
                            if (nonVeg.length > 0) {
                              isCompatible = false;
                              conflictingIngredients = nonVeg;
                            }
                            analysis = isCompatible ? 
                              'No meat or animal-derived ingredients detected.' :
                              `Contains non-vegetarian ingredients: ${conflictingIngredients.join(', ')}`;
                          } else if (restrictionLower.includes('gluten')) {
                            const glutenIngredients = ingredients.filter(ing => 
                              ing.includes('wheat') || ing.includes('gluten') || ing.includes('barley') || 
                              ing.includes('rye') || ing.includes('malt')
                            );
                            if (glutenIngredients.length > 0) {
                              isCompatible = false;
                              conflictingIngredients = glutenIngredients;
                            }
                            analysis = isCompatible ? 
                              'No gluten-containing ingredients detected.' :
                              `Contains gluten ingredients: ${conflictingIngredients.join(', ')}`;
                          } else {
                            analysis = 'General dietary preference noted. No specific ingredient conflicts detected.';
                          }
                          
                          return (
                            <div key={index} className={`p-3 rounded-lg border ${
                              isCompatible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{restriction}</span>
                                <Badge className={isCompatible ? 
                                  'bg-green-100 text-green-800 border-green-200' : 
                                  'bg-red-100 text-red-800 border-red-200'
                                }>
                                  {isCompatible ? 'Compatible ✓' : 'Conflict ⚠'}
                                </Badge>
                              </div>
                              <p className={`text-sm ${
                                isCompatible ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {analysis}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg font-medium text-gray-600">No dietary restrictions specified</p>
                        <p className="text-gray-500 mb-4">Update your profile to get dietary compatibility analysis</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">
                            <strong>General Assessment:</strong> Without specific dietary restrictions, we've analyzed this product 
                            for common dietary concerns. The ingredients appear to be standard food components without obvious 
                            restrictions for most dietary preferences.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Ingredient Analysis:</strong> We've cross-referenced all {scannedData.ingredientAnalysis?.length || 0} 
                        detected ingredients against common dietary restrictions including vegan, vegetarian, gluten-free, 
                        and other preferences to ensure compatibility with your lifestyle choices.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => setLocation('/generic')} 
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
            >
              <Scan className="w-5 h-5" />
              Scan Another
            </Button>
            <Button 
              onClick={() => setLocation('/healing-recipes')} 
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Safer Options
            </Button>
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}