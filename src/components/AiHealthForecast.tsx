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
        name: "Blood Sugar Impact",
        current: Math.round(bloodSugarScore),
        trend: avgSugar > 30 ? 'up' : 'stable',
        risk: bloodSugarRisk,
        prediction: `Daily sugar: ${Math.round(avgSugar)}g, carbs: ${Math.round(avgCarbs)}g. ${bloodSugarRisk === 'high' ? 'High diabetes risk' : 'Manageable levels'}`,
        recommendation: avgSugar > 25 ? "Reduce sugary foods, choose complex carbs" : "Good blood sugar control"
      },
      {
        name: "Heart Health Score",
        current: Math.round(heartScore),
        trend: avgSodium > 1800 ? 'down' : 'up',
        risk: heartRisk,
        prediction: `Daily sodium: ${Math.round(avgSodium)}mg, fiber: ${Math.round(avgFiber)}g. ${heartRisk === 'high' ? 'Cardiovascular risk' : 'Heart-healthy pattern'}`,
        recommendation: avgSodium > 1500 ? "Lower sodium, increase vegetables" : "Excellent heart health habits"
      },
      {
        name: "Nutrient Balance",
        current: Math.round(nutrientScore),
        trend: proteinRatio > 0.3 ? 'up' : 'down',
        risk: nutrientRisk,
        prediction: `Protein-carb ratio: ${proteinRatio.toFixed(2)}. ${nutrientRisk === 'low' ? 'Well balanced' : 'Needs protein boost'}`,
        recommendation: proteinRatio < 0.3 ? "Add more protein sources" : "Great macro balance"
      },
      {
        name: "Inflammation Risk",
        current: Math.round(inflammationScore),
        trend: avgFiber > 25 ? 'down' : 'up',
        risk: inflammationRisk,
        prediction: `Daily fiber: ${Math.round(avgFiber)}g. ${inflammationRisk === 'low' ? 'Anti-inflammatory diet' : 'Pro-inflammatory pattern'}`,
        recommendation: avgFiber < 25 ? "Eat more fruits, vegetables, whole grains" : "Excellent anti-inflammatory choices"
      }
    ];
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600"; 
      case "high": return "text-red-600";
      default: return "text-gray-600";
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
          <h1 className="text-5xl font-bold mb-4">AI Health Forecast</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Predict future health risks from your eating patterns and prevent them early
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
                    className="bg-white shadow-md border hover:border-primary cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setSelectedMetric(metric)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-sm">{metric.name}</h3>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">{metric.current}%</span>
                          <Badge 
                            variant="outline" 
                            className={getRiskColor(metric.risk)}
                          >
                            {metric.risk} risk
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <Progress value={metric.current} className="h-2 transition-all duration-700" />
                        </div>
                        <p className="text-xs text-gray-500">Click for details</p>
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
                  <h3 className="font-semibold mb-3">Blood Sugar Trends</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={nutritionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sugar" stroke="#ff4444" strokeWidth={3} name="Sugar (g)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Heart Health Indicators</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={nutritionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sodium" stroke="#ff6b6b" strokeWidth={3} name="Sodium (mg)" />
                      <Line type="monotone" dataKey="fiber" stroke="#51cf66" strokeWidth={2} name="Fiber (g)" />
                    </LineChart>
                  </ResponsiveContainer>
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