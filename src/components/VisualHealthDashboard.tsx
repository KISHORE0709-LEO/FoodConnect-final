import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, Heart, Droplets, Shield } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface HealthDashboardProps {
  mealData?: any;
  userProfile?: any;
}

export function VisualHealthDashboard({ mealData, userProfile }: HealthDashboardProps) {
  // Generate health metrics based on meal data
  const generateHealthMetrics = () => {
    if (!mealData?.nutrition) {
      return {
        bloodSugar: 75,
        heartHealth: 80,
        nutrientBalance: 70,
        inflammation: 65
      };
    }

    const nutrition = mealData.nutrition;
    const sugar = nutrition.sugarContent || nutrition.sugar_g || 0;
    const sodium = nutrition.sodiumContent || nutrition.sodium_mg || 0;
    const fiber = nutrition.fiberContent || nutrition.fiber_g || 0;
    const protein = nutrition.proteinContent || nutrition.protein_g || 0;

    return {
      bloodSugar: Math.max(30, Math.min(95, 90 - (sugar * 2))),
      heartHealth: Math.max(40, Math.min(95, 85 - (sodium / 50))),
      nutrientBalance: Math.max(50, Math.min(95, 60 + (fiber * 3) + (protein * 0.5))),
      inflammation: Math.max(30, Math.min(90, 75 - (sugar * 1.5) + (fiber * 2)))
    };
  };

  const healthMetrics = generateHealthMetrics();

  // Generate trend data for wave visualization
  const getTrendData = () => {
    const baseData = [];
    for (let i = 0; i < 7; i++) {
      baseData.push({
        day: `Day ${i + 1}`,
        bloodSugar: healthMetrics.bloodSugar + Math.sin(i * 0.5) * 10,
        heartHealth: healthMetrics.heartHealth + Math.cos(i * 0.7) * 8,
        nutrientBalance: healthMetrics.nutrientBalance + Math.sin(i * 0.3) * 12,
        inflammation: healthMetrics.inflammation + Math.cos(i * 0.9) * 15
      });
    }
    return baseData;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "bg-green-100 text-green-800" };
    if (score >= 60) return { text: "Good", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Needs Attention", color: "bg-red-100 text-red-800" };
  };

  const getTrendIcon = (current: number, previous: number = current - 5) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Health Metrics Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Visual Health Dashboard
            <Badge className="ml-2 bg-blue-100 text-blue-800">AI-Powered Insights</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Blood Sugar Risk */}
            <Card className="bg-white shadow-sm border hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Blood Sugar</span>
                  </div>
                  {getTrendIcon(healthMetrics.bloodSugar)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getHealthColor(healthMetrics.bloodSugar)}`}>
                      {Math.round(healthMetrics.bloodSugar)}%
                    </span>
                    <Badge className={getHealthBadge(healthMetrics.bloodSugar).color}>
                      {getHealthBadge(healthMetrics.bloodSugar).text}
                    </Badge>
                  </div>
                  <Progress value={healthMetrics.bloodSugar} className="h-2" />
                  <p className="text-xs text-gray-500">Risk Level Assessment</p>
                </div>
              </CardContent>
            </Card>

            {/* Heart Health */}
            <Card className="bg-white shadow-sm border hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Heart Health</span>
                  </div>
                  {getTrendIcon(healthMetrics.heartHealth)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getHealthColor(healthMetrics.heartHealth)}`}>
                      {Math.round(healthMetrics.heartHealth)}%
                    </span>
                    <Badge className={getHealthBadge(healthMetrics.heartHealth).color}>
                      {getHealthBadge(healthMetrics.heartHealth).text}
                    </Badge>
                  </div>
                  <Progress value={healthMetrics.heartHealth} className="h-2" />
                  <p className="text-xs text-gray-500">Cardiovascular Score</p>
                </div>
              </CardContent>
            </Card>

            {/* Nutrient Balance */}
            <Card className="bg-white shadow-sm border hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Nutrient Balance</span>
                  </div>
                  {getTrendIcon(healthMetrics.nutrientBalance)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getHealthColor(healthMetrics.nutrientBalance)}`}>
                      {Math.round(healthMetrics.nutrientBalance)}%
                    </span>
                    <Badge className={getHealthBadge(healthMetrics.nutrientBalance).color}>
                      {getHealthBadge(healthMetrics.nutrientBalance).text}
                    </Badge>
                  </div>
                  <Progress value={healthMetrics.nutrientBalance} className="h-2" />
                  <p className="text-xs text-gray-500">Nutritional Quality</p>
                </div>
              </CardContent>
            </Card>

            {/* Inflammation Markers */}
            <Card className="bg-white shadow-sm border hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Inflammation</span>
                  </div>
                  {getTrendIcon(healthMetrics.inflammation)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getHealthColor(healthMetrics.inflammation)}`}>
                      {Math.round(healthMetrics.inflammation)}%
                    </span>
                    <Badge className={getHealthBadge(healthMetrics.inflammation).color}>
                      {getHealthBadge(healthMetrics.inflammation).text}
                    </Badge>
                  </div>
                  <Progress value={healthMetrics.inflammation} className="h-2" />
                  <p className="text-xs text-gray-500">Anti-inflammatory Score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Wave-style Trend Visualization */}
      <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Health Trends - Wave Analysis
            <Badge className="ml-2 bg-purple-100 text-purple-800">Professional Visuals</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#666' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#666' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any, name: any) => [`${Math.round(value)}%`, name]}
                />
                <Area 
                  type="monotone" 
                  dataKey="bloodSugar" 
                  stroke="#ef4444" 
                  fill="url(#bloodSugarGradient)" 
                  strokeWidth={3}
                  name="Blood Sugar Risk"
                />
                <Area 
                  type="monotone" 
                  dataKey="heartHealth" 
                  stroke="#10b981" 
                  fill="url(#heartHealthGradient)" 
                  strokeWidth={3}
                  name="Heart Health"
                />
                <Area 
                  type="monotone" 
                  dataKey="nutrientBalance" 
                  stroke="#3b82f6" 
                  fill="url(#nutrientGradient)" 
                  strokeWidth={3}
                  name="Nutrient Balance"
                />
                <Area 
                  type="monotone" 
                  dataKey="inflammation" 
                  stroke="#f59e0b" 
                  fill="url(#inflammationGradient)" 
                  strokeWidth={3}
                  name="Inflammation"
                />
                <defs>
                  <linearGradient id="bloodSugarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="heartHealthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="nutrientGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="inflammationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Professional wave-style visualization showing health trend patterns based on your eating habits
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Health Insights Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">🎯 Key Health Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-green-800 mb-2">✅ Strengths</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {healthMetrics.heartHealth >= 70 && <li>• Good cardiovascular health indicators</li>}
                {healthMetrics.nutrientBalance >= 70 && <li>• Balanced nutritional profile</li>}
                {healthMetrics.inflammation <= 60 && <li>• Low inflammation risk</li>}
                {healthMetrics.bloodSugar >= 70 && <li>• Stable blood sugar levels</li>}
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-orange-800 mb-2">⚠️ Areas to Improve</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                {healthMetrics.bloodSugar < 70 && <li>• Monitor sugar intake levels</li>}
                {healthMetrics.heartHealth < 70 && <li>• Reduce sodium consumption</li>}
                {healthMetrics.nutrientBalance < 70 && <li>• Increase fiber and protein</li>}
                {healthMetrics.inflammation > 60 && <li>• Add anti-inflammatory foods</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}