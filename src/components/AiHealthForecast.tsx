import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Heart, Activity } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';

interface HealthMetric {
  name: string;
  current: number;
  trend: "up" | "down" | "stable";
  risk: "low" | "medium" | "high";
  prediction: string;
  recommendation: string;
}

const AiHealthForecast = () => {
  const { user } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutritionTrends, setNutritionTrends] = useState<any[]>([]);

  useEffect(() => {
    // Load saved meal history from localStorage
    const savedMeals = JSON.parse(localStorage.getItem('savedMealHistory') || '[]');
    
    // Generate health metrics from meal data
    const metrics = calculateHealthMetrics(savedMeals);
    setHealthMetrics(metrics);
    
    // Generate nutrition trends
    const trends = savedMeals.slice(-7).map((meal: any, index: number) => ({
      day: `Day ${index + 1}`,
      sugar: meal.nutrition?.sugarContent || 0,
      sodium: meal.nutrition?.sodiumContent || 0,
      fiber: meal.nutrition?.fiberContent || 0,
      calories: meal.nutrition?.calories || 0
    }));
    setNutritionTrends(trends);
    
    setLoading(false);
  }, []);

  const calculateHealthMetrics = (meals: any[]): HealthMetric[] => {
    if (meals.length === 0) {
      return [
        {
          name: "Blood Sugar Risk",
          current: 50,
          trend: "stable",
          risk: "low",
          prediction: "No data available - start logging meals for analysis",
          recommendation: "Log your daily meals to get personalized insights"
        }
      ];
    }

    // Calculate averages
    const avgSugar = meals.reduce((sum, meal) => sum + (meal.nutrition?.sugarContent || 0), 0) / meals.length;
    const avgSodium = meals.reduce((sum, meal) => sum + (meal.nutrition?.sodiumContent || 0), 0) / meals.length;
    const avgFiber = meals.reduce((sum, meal) => sum + (meal.nutrition?.fiberContent || 0), 0) / meals.length;
    const avgProtein = meals.reduce((sum, meal) => sum + (meal.nutrition?.proteinContent || 0), 0) / meals.length;
    const avgCarbs = meals.reduce((sum, meal) => sum + (meal.nutrition?.carbohydrateContent || 0), 0) / meals.length;

    // Blood Sugar Risk Analysis
    const bloodSugarRisk = avgSugar > 40 ? 'high' : avgSugar > 25 ? 'medium' : 'low';
    const bloodSugarScore = Math.max(20, Math.min(95, 90 - (avgSugar * 1.2) - (avgCarbs * 0.3)));
    
    // Heart Health Analysis
    const heartRisk = avgSodium > 2000 ? 'high' : avgSodium > 1500 ? 'medium' : 'low';
    const heartScore = Math.max(30, Math.min(95, 85 - (avgSodium / 50) + (avgFiber * 2)));
    
    // Nutrient Balance Analysis
    const proteinRatio = avgProtein / (avgCarbs || 1);
    const nutrientRisk = proteinRatio < 0.2 ? 'high' : proteinRatio < 0.4 ? 'medium' : 'low';
    const nutrientScore = Math.max(40, Math.min(95, 50 + (proteinRatio * 100)));
    
    // Inflammation Analysis
    const inflammationRisk = avgFiber < 20 ? 'high' : avgFiber < 25 ? 'medium' : 'low';
    const inflammationScore = Math.max(35, Math.min(95, 40 + (avgFiber * 2) - (avgSodium / 100)));

    return [
      {
        name: "Sugar Sensitivity Trend",
        current: Math.round(bloodSugarScore / 10),
        trend: avgSugar > 30 ? 'up' : 'stable',
        risk: bloodSugarRisk === 'high' ? 'needs-attention' : bloodSugarRisk === 'medium' ? 'moderate' : 'stable',
        prediction: `Your recent meals show ${avgSugar > 25 ? 'higher sugar intake' : 'balanced sugar levels'}. ${avgSugar > 25 ? 'Consider reducing processed foods for better energy stability.' : 'Your sugar intake appears well-balanced.'}`,
        recommendation: avgSugar > 25 ? "Focus on whole foods and complex carbohydrates" : "Continue your balanced approach to sugar intake"
      },
      {
        name: "Heart Wellness Pattern",
        current: Math.round(heartScore / 10),
        trend: avgSodium > 1800 ? 'down' : 'up',
        risk: heartRisk === 'high' ? 'needs-attention' : heartRisk === 'medium' ? 'moderate' : 'strong',
        prediction: `Your sodium intake patterns suggest ${avgSodium > 1500 ? 'room for improvement' : 'good heart-healthy choices'}. ${avgSodium > 1500 ? 'Reducing processed foods may support cardiovascular wellness.' : 'Your heart-healthy eating pattern looks positive.'}`,
        recommendation: avgSodium > 1500 ? "Choose fresh ingredients and limit processed foods" : "Maintain your heart-healthy eating habits"
      },
      {
        name: "Nutrient Balance",
        current: Math.round(nutrientScore / 10),
        trend: proteinRatio > 0.3 ? 'up' : 'down',
        risk: nutrientRisk === 'high' ? 'needs-attention' : nutrientRisk === 'medium' ? 'moderate' : 'improving',
        prediction: `Your protein-to-carb balance shows ${proteinRatio < 0.3 ? 'potential for improvement' : 'good nutritional variety'}. ${proteinRatio < 0.3 ? 'Adding more protein sources may enhance energy levels.' : 'Your macro balance supports steady energy.'}`,
        recommendation: proteinRatio < 0.3 ? "Include more protein-rich foods in your meals" : "Your nutritional balance is on track"
      },
      {
        name: "Inflammation Tendency",
        current: Math.round(inflammationScore / 10),
        trend: avgFiber > 25 ? 'down' : 'up',
        risk: inflammationRisk === 'high' ? 'needs-attention' : inflammationRisk === 'medium' ? 'moderate' : 'stable',
        prediction: `Your fiber intake suggests ${avgFiber < 25 ? 'opportunity for anti-inflammatory foods' : 'good anti-inflammatory choices'}. ${avgFiber < 25 ? 'Increasing colorful vegetables may support overall wellness.' : 'Your anti-inflammatory food choices look positive.'}`,
        recommendation: avgFiber < 25 ? "Add more colorful fruits and vegetables to your diet" : "Continue including anti-inflammatory foods"
      }
    ];
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "stable": return "text-green-600";
      case "improving": return "text-blue-600";
      case "strong": return "text-green-600";
      case "moderate": return "text-amber-600"; 
      case "needs-attention": return "text-amber-700";
      default: return "text-gray-600";
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case "stable": return "bg-green-50";
      case "improving": return "bg-blue-50";
      case "strong": return "bg-green-50";
      case "moderate": return "bg-amber-50"; 
      case "needs-attention": return "bg-amber-50";
      default: return "bg-gray-50";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your eating patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-20">
        <div className="mb-6">
          <BackButton />
        </div>
        
        <div className="text-center mb-12 text-gray-900">
          <TrendingUp className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">AI Wellness Insights</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-generated dietary pattern analysis based on your eating habits
          </p>
          <p className="text-sm text-gray-400 mt-2 max-w-3xl mx-auto">
            These insights are AI-generated predictions based on your logged meals and are not medical diagnoses.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Current Health Status */}
          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Your Current Health Forecast
                <Badge className="ml-2 bg-green-100 text-green-800">
                  Based on {JSON.parse(localStorage.getItem('savedMealHistory') || '[]').length} meals
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {healthMetrics.map((metric, index) => (
                  <Card 
                    key={index} 
                    className={`bg-white shadow-md border hover:border-primary cursor-pointer hover:shadow-lg transition-all ${getRiskBg(metric.risk)}`}
                    onClick={() => setSelectedMetric(metric)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-sm">{metric.name}</h3>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">Trend Score: {metric.current}/10</span>
                        </div>
                        <div className="mt-2">
                          <Progress value={metric.current * 10} className="h-2 transition-all duration-700" />
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getRiskColor(metric.risk)}
                        >
                          {metric.risk === 'needs-attention' ? 'Needs Balance' : 
                           metric.risk === 'moderate' ? 'Moderate' :
                           metric.risk === 'improving' ? 'Improving' :
                           metric.risk === 'strong' ? 'Strong' : 'Stable'}
                        </Badge>
                        <p className="text-xs text-gray-500">Based on your recent food logs</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedMetric && (
            <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2 hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  {selectedMetric.name} - Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">AI Prediction</h4>
                    <p className="text-sm text-gray-600 mb-4">{selectedMetric.prediction}</p>
                    
                    <h4 className="font-semibold mb-2">Recommendation</h4>
                    <p className="text-sm text-gray-700">{selectedMetric.recommendation}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Nutrition Trends</h4>
                    {nutritionTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={nutritionTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="sugar" stroke="#ff4444" strokeWidth={3} name="Sugar (g)" />
                          <Line type="monotone" dataKey="sodium" stroke="#ff6b6b" strokeWidth={2} name="Sodium (mg)" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-gray-500">No trend data available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Health Impact Analysis */}
          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Health Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-green-500 text-white p-3">
                      <div className="text-xs opacity-90">SUGAR LOAD PATTERN</div>
                      <div className="text-2xl font-bold">
                        {nutritionTrends.length > 0 ? 
                          (nutritionTrends[nutritionTrends.length - 1]?.sugar > 25 ? 'Elevated' : 
                           nutritionTrends[nutritionTrends.length - 1]?.sugar > 15 ? 'Moderate' : 'Balanced') 
                          : 'Balanced'}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="relative h-32 mb-4 bg-gray-50">
                        <svg className="w-full h-full" viewBox="0 0 300 120">
                          <line x1="0" y1="20" x2="300" y2="20" stroke="#e5e7eb" strokeWidth="0.5" />
                          <line x1="0" y1="40" x2="300" y2="40" stroke="#e5e7eb" strokeWidth="0.5" />
                          <line x1="0" y1="60" x2="300" y2="60" stroke="#e5e7eb" strokeWidth="0.5" />
                          <line x1="0" y1="80" x2="300" y2="80" stroke="#e5e7eb" strokeWidth="0.5" />
                          <line x1="0" y1="100" x2="300" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
                          
                          <text x="5" y="25" fontSize="10" fill="#9ca3af">High</text>
                          <text x="5" y="65" fontSize="10" fill="#9ca3af">Balanced</text>
                          <text x="5" y="105" fontSize="10" fill="#9ca3af">Low</text>
                          
                          <path
                            d="M30,70 L60,65 L90,75 L120,60 L150,55 L180,65 L210,60 L240,55 L270,50"
                            stroke="#22c55e"
                            strokeWidth="3"
                            fill="none"
                          />
                          
                          <circle cx="270" cy="50" r="4" fill="#22c55e">
                            <title>Fiber improved here</title>
                          </circle>
                          <rect x="0" y="55" width="300" height="20" fill="#22c55e" fillOpacity="0.1" />
                        </svg>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                        <span>Sun</span>
                      </div>
                      <div className="text-center">
                        <button className="text-green-600 text-sm flex items-center mx-auto">
                          <span className="mr-1">📊</span> Weekly Nutrient Trend
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-blue-500 text-white p-3">
                      <div className="text-xs opacity-90">HEART WELLNESS PATTERN</div>
                      <div className="text-2xl font-bold">
                        {nutritionTrends.length > 0 ? 
                          (nutritionTrends[nutritionTrends.length - 1]?.sodium > 1500 ? 'Needs Balance' : 
                           nutritionTrends[nutritionTrends.length - 1]?.sodium > 800 ? 'Moderate' : 'Strong') 
                          : 'Strong'}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="relative h-32 mb-4 bg-gray-50">
                        <svg className="w-full h-full" viewBox="0 0 300 120">
                          <line x1="0" y1="20" x2="300" y2="20" stroke="#e5e7eb" strokeWidth="0.3" />
                          <line x1="0" y1="40" x2="300" y2="40" stroke="#e5e7eb" strokeWidth="0.3" />
                          <line x1="0" y1="60" x2="300" y2="60" stroke="#e5e7eb" strokeWidth="0.3" />
                          <line x1="0" y1="80" x2="300" y2="80" stroke="#e5e7eb" strokeWidth="0.3" />
                          <line x1="0" y1="100" x2="300" y2="100" stroke="#e5e7eb" strokeWidth="0.3" />
                          
                          <text x="5" y="25" fontSize="10" fill="#9ca3af">Optimal</text>
                          <text x="5" y="65" fontSize="10" fill="#9ca3af">Balanced</text>
                          <text x="5" y="105" fontSize="10" fill="#9ca3af">Needs Work</text>
                          
                          <path
                            d="M30,80 L60,75 L90,70 L120,65 L150,60 L180,65 L210,60 L240,55 L270,50"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            fill="none"
                          />
                          
                          <circle cx="270" cy="50" r="4" fill="#3b82f6">
                            <title>Heart-healthy choices improving</title>
                          </circle>
                        </svg>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                        <span>Sun</span>
                      </div>
                      <div className="text-center">
                        <button className="text-blue-600 text-sm flex items-center mx-auto">
                          <span className="mr-1">❤️</span> Heart Wellness Trend
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {JSON.parse(localStorage.getItem('savedMealHistory') || '[]').length === 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="text-lg font-semibold mb-2">No Meal Data Found</h3>
                <p className="text-gray-600 mb-4">
                  Start logging your daily meals to get personalized AI health insights and predictions.
                </p>
                <Button onClick={() => window.location.href = '/customized'}>
                  Start Logging Meals
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiHealthForecast;