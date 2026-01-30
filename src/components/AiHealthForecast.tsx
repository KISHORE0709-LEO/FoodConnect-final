import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Heart, Activity, User, Calculator } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

// Small animated number component
const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = display;
    const to = value;
    const duration = 600;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = Math.round(from + (to - from) * eased);
      setDisplay(cur);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="text-2xl font-bold transition-all">{display}%</span>;
};

const metricNameToKey = (name: string) => {
  switch (name) {
    case 'Blood Sugar Risk': return 'bloodSugar';
    case 'Heart Health Score': return 'heartHealth';
    case 'Nutrient Balance': return 'nutrientBalance';
    case 'Inflammation Markers': return 'inflammation';
    default: return 'bloodSugar';
  }
};

const MiniSparkline = ({ metricName }: { metricName: string }) => {
  const key = metricNameToKey(metricName);
  const data = (Array.isArray(window ? JSON.parse(localStorage.getItem('savedMealHistory') || '[]') : []) ? JSON.parse(localStorage.getItem('savedMealHistory') || '[]') : []).slice(-7).map((m: any, i: number) => ({
    name: `M${i + 1}`,
    value: Math.max(0, Math.min(100, Math.round((m?.nutrition?.[key + 'Content'] || 0) * 1)))
  }));

  if (!data || data.length === 0) return <div className="h-12" />;

  return (
    <div className="h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface HealthMetric {
  name: string;
  current: number;
  trend: "up" | "down" | "stable";
  risk: "low" | "medium" | "high";
  prediction: string;
  recommendation: string;
}

interface UserData {
  age: number;
  height: number;
  weight: number;
  activity: string;
}

const AiHealthForecast = () => {
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [userData, setUserData] = useState<UserData>({
    age: 25,
    height: 170,
    weight: 70,
    activity: 'Moderate exercise (3-5 days/wk)'
  });
  const [showUserForm, setShowUserForm] = useState(true);
  const [healthData, setHealthData] = useState<HealthMetric[]>([]);
  const [mealHistory, setMealHistory] = useState<any[]>([]);
  const [bmiData, setBmiData] = useState<any>(null);
  const [calorieNeeds, setCalorieNeeds] = useState<number>(0);
  const { user } = useAuth();
  const { userProfile } = useUserProfile();

  useEffect(() => {
    // Load saved meal history
    const savedMeals = JSON.parse(localStorage.getItem('savedMealHistory') || '[]');
    setMealHistory(savedMeals);

    // Check if explicit saved user data exists
    const savedUserData = localStorage.getItem('healthForecastUserData');
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUserData(parsed);
        setShowUserForm(false);
        generateHealthMetrics(parsed, savedMeals);
        return;
      } catch (e) {
        // ignore
      }
    }

    // Prefer profile from authenticated user or userProfile context
    try {
      if (user && ((user as any).age || (user as any).height || (user as any).weight)) {
        const u = {
          age: (user as any).age || userData.age,
          height: (user as any).height || userData.height,
          weight: (user as any).weight || userData.weight,
          activity: (user as any).activity || userData.activity
        };
        setUserData(u);
        setShowUserForm(false);
        generateHealthMetrics(u, savedMeals);
        return;
      }

      if (userProfile && ((userProfile as any).age || (userProfile as any).height || (userProfile as any).weight)) {
        const u = {
          age: (userProfile as any).age || userData.age,
          height: (userProfile as any).height || userData.height,
          weight: (userProfile as any).weight || userData.weight,
          activity: (userProfile as any).activity || userData.activity
        };
        setUserData(u);
        setShowUserForm(false);
        generateHealthMetrics(u, savedMeals);
        return;
      }
    } catch (e) {
      // ignore missing fields
    }

    // Fallback: check savedMeals for last saved user profile
    try {
      if (Array.isArray(savedMeals) && savedMeals.length > 0) {
        const last = savedMeals[savedMeals.length - 1];
        if (last && last.userProfile) {
          const u = {
            age: last.userProfile.age || userData.age,
            height: last.userProfile.height || userData.height,
            weight: last.userProfile.weight || userData.weight,
            activity: last.userProfile.activity || userData.activity
          };
          setUserData(u);
          setShowUserForm(false);
          generateHealthMetrics(u, savedMeals);
          return;
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const calculateBMI = (height: number, weight: number) => {
    const bmi = weight / ((height / 100) ** 2);
    let category = '';
    let color = '';
    
    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-red-600';
    } else if (bmi < 25) {
      category = 'Normal';
      color = 'text-green-600';
    } else if (bmi < 30) {
      category = 'Overweight';
      color = 'text-yellow-600';
    } else {
      category = 'Obesity';
      color = 'text-red-600';
    }
    
    return { bmi: bmi.toFixed(2), category, color };
  };

  const calculateDailyCalories = (userData: UserData) => {
    const { age, height, weight, activity } = userData;
    // Using Mifflin-St Jeor Equation (assuming male for simplicity)
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    
    const activityMultipliers: { [key: string]: number } = {
      'Little/no exercise': 1.2,
      'Light exercise': 1.375,
      'Moderate exercise (3-5 days/wk)': 1.55,
      'Very active (6-7 days/wk)': 1.725,
      'Extra active (very active & physical job)': 1.9
    };
    
    return Math.round(bmr * (activityMultipliers[activity] || 1.55));
  };

  const generateHealthMetrics = (userInfo: UserData, meals: any[]) => {
    const bmi = calculateBMI(userInfo.height, userInfo.weight);
    const dailyCalories = calculateDailyCalories(userInfo);
    
    setBmiData(bmi);
    setCalorieNeeds(dailyCalories);
    
    // Analyze meal patterns for health metrics
    const avgSugar = meals.length > 0 ? 
      meals.reduce((sum, meal) => sum + (meal.nutrition?.sugarContent || 0), 0) / meals.length : 0;
    const avgSodium = meals.length > 0 ? 
      meals.reduce((sum, meal) => sum + (meal.nutrition?.sodiumContent || 0), 0) / meals.length : 0;
    const avgFiber = meals.length > 0 ? 
      meals.reduce((sum, meal) => sum + (meal.nutrition?.fiberContent || 0), 0) / meals.length : 0;
    
    const metrics: HealthMetric[] = [
      {
        name: "Blood Sugar Risk",
        current: Math.min(90, Math.max(30, 100 - (avgSugar / 2))),
        trend: avgSugar > 25 ? "up" : "down",
        risk: avgSugar > 30 ? "high" : avgSugar > 15 ? "medium" : "low",
        prediction: avgSugar > 25 ? "High sugar intake may increase diabetes risk" : "Sugar levels are within healthy range",
        recommendation: avgSugar > 25 ? "Reduce sugar intake, add more fiber-rich foods" : "Continue maintaining low sugar intake"
      },
      {
        name: "Heart Health Score",
        current: Math.min(95, Math.max(40, 85 - (avgSodium / 50))),
        trend: avgSodium > 800 ? "down" : "stable",
        risk: avgSodium > 1000 ? "high" : avgSodium > 600 ? "medium" : "low",
        prediction: avgSodium > 800 ? "High sodium may affect cardiovascular health" : "Heart health indicators are good",
        recommendation: avgSodium > 800 ? "Reduce sodium intake, choose fresh foods" : "Continue heart-healthy eating pattern"
      },
      {
        name: "Nutrient Balance",
        current: Math.min(95, Math.max(50, 60 + (avgFiber * 2))),
        trend: avgFiber > 15 ? "up" : "stable",
        risk: avgFiber < 10 ? "medium" : "low",
        prediction: avgFiber > 15 ? "Excellent nutritional profile" : "Nutrient balance needs improvement",
        recommendation: avgFiber < 15 ? "Add more vegetables and whole grains" : "Maintain diverse food choices"
      },
      {
        name: "Inflammation Markers",
        current: Math.min(80, Math.max(30, 70 - (avgSugar / 3) + (avgFiber * 1.5))),
        trend: (avgSugar < 20 && avgFiber > 12) ? "down" : "stable",
        risk: (avgSugar > 25 || avgFiber < 10) ? "medium" : "low",
        prediction: (avgSugar > 25) ? "Diet may contribute to inflammation" : "Anti-inflammatory diet pattern detected",
        recommendation: "Add turmeric, ginger, and omega-3 rich foods"
      }
    ];
    
    setHealthData(metrics);
  };

  const handleUserDataSubmit = () => {
    localStorage.setItem('healthForecastUserData', JSON.stringify(userData));
    setShowUserForm(false);
    generateHealthMetrics(userData, mealHistory);
  };

  const getHealthTrendData = () => {
    if (mealHistory.length === 0) return [];
    
    return mealHistory.slice(-7).map((meal, index) => ({
      day: `Day ${index + 1}`,
      bloodSugar: Math.max(30, 100 - ((meal.nutrition?.sugarContent || 0) / 2)),
      heartHealth: Math.max(40, 85 - ((meal.nutrition?.sodiumContent || 0) / 50)),
      nutrientBalance: Math.max(50, 60 + ((meal.nutrition?.fiberContent || 0) * 2)),
      inflammation: Math.max(30, 70 - ((meal.nutrition?.sugarContent || 0) / 3) + ((meal.nutrition?.fiberContent || 0) * 1.5))
    }));
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

  if (showUserForm) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-20">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <User className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h1 className="text-3xl font-bold mb-2">AI Health Forecast Setup</h1>
              <p className="text-gray-600">Enter your basic details to get personalized health insights</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2" size={20} />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="100"
                      value={userData.age}
                      onChange={(e) => setUserData({...userData, age: parseInt(e.target.value) || 25})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="100"
                      max="250"
                      value={userData.height}
                      onChange={(e) => setUserData({...userData, height: parseInt(e.target.value) || 170})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="30"
                      max="200"
                      value={userData.weight}
                      onChange={(e) => setUserData({...userData, weight: parseInt(e.target.value) || 70})}
                    />
                  </div>
                  <div>
                    <Label>Activity Level</Label>
                    <Select value={userData.activity} onValueChange={(value) => setUserData({...userData, activity: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Little/no exercise">Little/no exercise</SelectItem>
                        <SelectItem value="Light exercise">Light exercise</SelectItem>
                        <SelectItem value="Moderate exercise (3-5 days/wk)">Moderate exercise (3-5 days/wk)</SelectItem>
                        <SelectItem value="Very active (6-7 days/wk)">Very active (6-7 days/wk)</SelectItem>
                        <SelectItem value="Extra active (very active & physical job)">Extra active (very active & physical job)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={handleUserDataSubmit} className="w-full py-3 text-lg">
                  Generate AI Health Forecast
                </Button>
              </CardContent>
            </Card>
          </div>
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
          
          {/* User Profile Summary */}
          {bmiData && (
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 mt-8 max-w-4xl mx-auto">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-900">📊 Your Health Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{bmiData.bmi}</div>
                    <div className={`font-medium ${bmiData.color}`}>{bmiData.category}</div>
                    <div className="text-gray-600">BMI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{calorieNeeds}</div>
                    <div className="font-medium text-green-800">Daily Calories</div>
                    <div className="text-gray-600">Recommended</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{mealHistory.length}</div>
                    <div className="font-medium text-purple-800">Meals Tracked</div>
                    <div className="text-gray-600">Data Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Visual Health Trends */}
          {getHealthTrendData().length > 0 && (
            <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Health Trends Over Time
                  <Badge className="ml-2 bg-blue-100 text-blue-800">Based on your saved meals</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getHealthTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: any) => [`${value}%`, '']} />
                      <Area type="monotone" dataKey="bloodSugar" stackId="1" stroke="#ef4444" fill="#fecaca" name="Blood Sugar" />
                      <Area type="monotone" dataKey="heartHealth" stackId="2" stroke="#10b981" fill="#bbf7d0" name="Heart Health" />
                      <Area type="monotone" dataKey="nutrientBalance" stackId="3" stroke="#3b82f6" fill="#bfdbfe" name="Nutrient Balance" />
                      <Area type="monotone" dataKey="inflammation" stackId="4" stroke="#f59e0b" fill="#fed7aa" name="Inflammation" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Health Status */}
          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Your Current Health Forecast
                <Badge className="ml-2 bg-green-100 text-green-800">
                  {mealHistory.length > 0 ? `Based on ${mealHistory.length} meals` : 'Initial Assessment'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {healthData.map((metric, index) => (
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
                          <AnimatedNumber value={Math.round(metric.current)} />
                          <Badge 
                            variant="outline" 
                            className={getRiskColor(metric.risk)}
                          >
                            {metric.risk} risk
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <MiniSparkline metricName={metric.name} />
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
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      AI Prediction
                    </h4>
                    <p className="text-muted-foreground bg-yellow-50 p-4 rounded-lg">
                      {selectedMetric.prediction}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Recommended Actions
                    </h4>
                    <p className="text-muted-foreground bg-green-50 p-4 rounded-lg">
                      {selectedMetric.recommendation}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Weekly Progress Tracking</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                      <div key={day} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">{day}</div>
                        <div className={`h-8 rounded ${i < mealHistory.length ? 'bg-green-200' : 'bg-gray-200'}`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Insights */}
          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Key Health Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ Immediate Attention</h4>
                  <p className="text-sm text-red-700 mb-3">
                    {healthData.find(m => m.risk === 'high')?.prediction || 'Monitor your eating patterns closely'}
                  </p>
                  <Badge className="bg-red-100 text-red-800">Action needed</Badge>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Good Progress</h4>
                  <p className="text-sm text-green-700 mb-3">
                    {healthData.find(m => m.risk === 'low')?.prediction || 'Keep tracking your meals for better insights'}
                  </p>
                  <Badge className="bg-green-100 text-green-800">Keep it up!</Badge>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">📈 30-Day Prediction</h4>
                <p className="text-sm text-blue-700">
                  {mealHistory.length > 0 ? (
                    <>Based on your current eating patterns, continue saving meal data for more accurate predictions.</>
                  ) : (
                    <>Start saving your meal compositions to get personalized health predictions.</>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Progress Tracking */}
          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2">
            <CardHeader>
              <CardTitle>Your Health Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">{Math.max(0, mealHistory.length)}</div>
                  <div className="text-sm text-muted-foreground">Meals Tracked</div>
                  <Badge className="mt-2 bg-green-100 text-green-800">
                    {mealHistory.length > 5 ? 'Great Progress!' : 'Keep Going!'}
                  </Badge>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {mealHistory.length > 0 ? Math.round(healthData.reduce((sum, m) => sum + m.current, 0) / healthData.length) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Health Score</div>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">
                    {mealHistory.length > 0 ? 'Data Available' : 'Start Tracking'}
                  </Badge>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {mealHistory.length > 0 ? Math.round(bmiData ? parseFloat(bmiData.bmi) : 0) : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Current BMI</div>
                  <Badge className={`mt-2 ${bmiData?.color?.includes('green') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {bmiData?.category || 'Not Set'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {mealHistory.length === 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="text-lg font-semibold mb-2 text-yellow-800">Start Tracking Your Meals</h3>
                <p className="text-yellow-700 mb-4">
                  To get accurate health forecasts, save your meal compositions from the Customized Analysis page.
                </p>
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  Go to Meal Planning
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="text-center space-y-4">
            <Button size="lg" className="bg-gradient-to-r from-primary to-secondary text-white hover:from-green-600 hover:to-blue-600">
              📊 Generate Detailed Health Report
            </Button>
            <p className="text-sm text-gray-500">
              Get a comprehensive report with personalized recommendations based on your meal history
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiHealthForecast;