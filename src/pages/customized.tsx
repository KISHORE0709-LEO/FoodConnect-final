import { useState, useEffect } from 'react';
import { BottomNavigation } from '@/components/navigation';
import { ModernNavbar } from '@/components/ModernNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calculator, Activity, ChefHat, Play, Save, TrendingUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { VisualHealthDashboard } from '@/components/VisualHealthDashboard';

interface PersonData {
  age: number;
  height: number;
  weight: number;
  gender: 'Male' | 'Female';
  activity: string;
  dietType: string;
  mealsPerDay: number;
}

export default function Customized() {
  // Removed personalized risk analysis redirect
  
  const [activeTab, setActiveTab] = useState('automatic');
  const [formData, setFormData] = useState<PersonData>({
    age: 25,
    height: 170,
    weight: 70,
    gender: 'Male',
    activity: 'Moderate exercise (3-5 days/wk)',
    dietType: 'Vegetarian',
    mealsPerDay: 3
  });
  const [selectedCaloriePlan, setSelectedCaloriePlan] = useState<string>('Maintain weight');
  const [selectedMeals, setSelectedMeals] = useState<any>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [customNutrition, setCustomNutrition] = useState({
    calories: [500],
    carbohydrates: [100],
    fat: [50],
    fiber: [10],
    saturatedFat: [0],
    sugar: [10],
    cholesterol: [0],
    protein: [10],
    sodium: [400],
    recommendations: [10]
  });
  const [customIngredients, setCustomIngredients] = useState('');
  const [customResults, setCustomResults] = useState<any>(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [savedMeals, setSavedMeals] = useState<any>({});
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showHealthDashboard, setShowHealthDashboard] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const YouTubeEmbed = ({ searchQuery, title }: { searchQuery: string; title: string }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);
    
    if (!isOnline) {
      return (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center text-gray-600">
            <Play size={32} className="mx-auto mb-2" />
            <p className="text-sm">Video unavailable offline</p>
            <p className="text-xs">Connect to internet to watch tutorial</p>
          </div>
        </div>
      );
    }
    
    // Convert search query to YouTube search URL
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    
    return (
      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 border-2 border-red-200">
          <div className="text-center">
            <Play size={32} className="mx-auto mb-2 text-red-600" />
            <p className="text-sm font-medium mb-2">Watch Recipe Tutorial</p>
            <a 
              href={searchUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Play size={16} className="mr-2" />
              Search on YouTube
            </a>
          </div>
        </div>
      </div>
    );
  };

  const activityOptions = [
    'Little/no exercise',
    'Light exercise', 
    'Moderate exercise (3-5 days/wk)',
    'Very active (6-7 days/wk)',
    'Extra active (very active & physical job)'
  ];

  const dietTypes = ['Vegetarian', 'Non-Vegetarian', 'Both'];

  const calculateBMI = () => {
    const bmi = formData.weight / ((formData.height / 100) ** 2);
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

  const calculateBMR = () => {
    if (formData.gender === 'Male') {
      return 10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5;
    } else {
      return 10 * formData.weight + 6.25 * formData.height - 5 * formData.age - 161;
    }
  };

  const calculateCalories = () => {
    const activityWeights = [1.2, 1.375, 1.55, 1.725, 1.9];
    const weight = activityWeights[activityOptions.indexOf(formData.activity)];
    const maintainCalories = calculateBMR() * weight;
    
    return [
      { plan: 'Maintain weight', calories: Math.round(maintainCalories), loss: '-0 kg/week' },
      { plan: 'Mild weight loss', calories: Math.round(maintainCalories * 0.9), loss: '-0.25 kg/week' },
      { plan: 'Weight loss', calories: Math.round(maintainCalories * 0.8), loss: '-0.5 kg/week' },
      { plan: 'Extreme weight loss', calories: Math.round(maintainCalories * 0.6), loss: '-1 kg/week' }
    ];
  };

  const calculateSelectedMealNutrition = () => {
    if (!results?.recommendations || !selectedMeals) return null;
    
    let totalNutrition = {
      calories: 0, protein: 0, carbs: 0, fat: 0,
      fatContent: 0, saturatedFatContent: 0, cholesterolContent: 0,
      sodiumContent: 0, carbohydrateContent: 0, fiberContent: 0,
      sugarContent: 0, proteinContent: 0
    };
    
    Object.entries(selectedMeals).forEach(([mealType, selectedMealName]) => {
      const meal = results.recommendations[mealType]?.find((m: any) => m.name === selectedMealName);
      if (meal) {
        Object.keys(totalNutrition).forEach(key => {
          totalNutrition[key as keyof typeof totalNutrition] += meal[key] || 0;
        });
      }
    });
    
    return totalNutrition;
  };
  
  const getComparisonChartData = () => {
    const selectedNutrition = calculateSelectedMealNutrition();
    if (!selectedNutrition || !results) return [];
    
    const selectedPlanCalories = results.calories.find((c: any) => c.plan === selectedCaloriePlan)?.calories || results.targetCalories;
    
    return [
      {
        name: 'Your Selected Meals',
        calories: selectedNutrition.calories
      },
      {
        name: `${selectedCaloriePlan} Target`,
        calories: selectedPlanCalories
      }
    ];
  };
  
  const getNutritionPieData = () => {
    const selectedNutrition = calculateSelectedMealNutrition();
    if (!selectedNutrition) return [];
    
    return [
      { name: 'Protein', value: selectedNutrition.proteinContent || 0 },
      { name: 'Carbs', value: selectedNutrition.carbohydrateContent || 0 },
      { name: 'Fat', value: selectedNutrition.fatContent || 0 },
      { name: 'Fiber', value: selectedNutrition.fiberContent || 0 },
      { name: 'Sugar', value: selectedNutrition.sugarContent || 0 },
      { name: 'Sodium', value: Math.round((selectedNutrition.sodiumContent || 0) / 100) }
    ].filter(item => item.value > 0);
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${name}: ${value}${name === 'Sodium' ? '00mg' : 'g'}`}
      </text>
    );
  };

  const generateRecommendations = async () => {
    setLoading(true);
    
    try {
      const bmiData = calculateBMI();
      const calorieData = calculateCalories();
      
      // Load CSV data
      const response = await fetch('/custom_recipes_dataset.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      const recipes = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        const recipe: any = {};
        headers.forEach((header, index) => {
          recipe[header] = values[index] || '';
        });
        return recipe;
      });
      
      // Filter by diet type
      const filteredRecipes = recipes.filter(recipe => {
        if (formData.dietType === 'Both') {
          return true; // Show all recipes for 'Both' selection
        }
        return recipe.diet_type === formData.dietType || recipe.diet_type === 'Both';
      });
      
      // Organize by meal type
      const organizedRecipes: any = {
        breakfast: [],
        lunch: [],
        dinner: []
      };
      
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        const mealRecipes = filteredRecipes.filter(recipe => recipe.meal_type === mealType);
        organizedRecipes[mealType] = mealRecipes.slice(0, 3).map(recipe => ({
          name: recipe.recipe_name,
          calories: parseInt(recipe.calories_per_serving) || 0,
          protein: parseInt(recipe.protein_g) || 0,
          carbs: parseInt(recipe.carbs_g) || 0,
          fat: parseInt(recipe.fat_g) || 0,
          ingredients: recipe.ingredients ? recipe.ingredients.split(',') : [],
          instructions: recipe.instructions ? recipe.instructions.split('|') : [],
          cookTime: parseInt(recipe.cook_time_min) || 0,
          prepTime: parseInt(recipe.prep_time_min) || 0,
          totalTime: parseInt(recipe.total_time_min) || 0,
          videoId: recipe.recipe_name || '',
          fatContent: parseInt(recipe.fat_g) || 0,
          saturatedFatContent: parseInt(recipe.saturated_fat_g) || 0,
          cholesterolContent: parseInt(recipe.cholesterol_mg) || 0,
          sodiumContent: parseInt(recipe.sodium_mg) || 0,
          carbohydrateContent: parseInt(recipe.carbs_g) || 0,
          fiberContent: parseInt(recipe.fiber_g) || 0,
          sugarContent: parseInt(recipe.sugar_g) || 0,
          proteinContent: parseInt(recipe.protein_g) || 0
        }));
      });
      
      // Set default meal selections
      const defaultSelections: any = {};
      Object.keys(organizedRecipes).forEach(mealType => {
        if (organizedRecipes[mealType].length > 0) {
          defaultSelections[mealType] = organizedRecipes[mealType][0].name;
        }
      });
      setSelectedMeals(defaultSelections);
      
      setResults({
        bmi: bmiData,
        calories: calorieData,
        recommendations: organizedRecipes,
        targetCalories: calorieData.find(c => c.plan === selectedCaloriePlan)?.calories || 2000
      });
      
    } catch (error) {
      console.error('Error:', error);
      // Fallback recipes based on diet type
      const fallbackRecipes = formData.dietType === 'Vegetarian' ? {
        breakfast: [{
          name: 'Ragi Semiya Upma',
          calories: 320, protein: 12, carbs: 45, fat: 8,
          ingredients: ['Ragi vermicelli', 'Onion', 'Green chillies'],
          instructions: ['Steam ragi vermicelli', 'Add vegetables', 'Serve hot'],
          cookTime: 25, prepTime: 15, totalTime: 40, videoId: 'kQOKqJL4wfU',
          fatContent: 8, saturatedFatContent: 3, cholesterolContent: 0,
          sodiumContent: 450, carbohydrateContent: 45, fiberContent: 6,
          sugarContent: 4, proteinContent: 12
        }],
        lunch: [{
          name: 'Dal Makhani',
          calories: 380, protein: 18, carbs: 35, fat: 18,
          ingredients: ['Black lentils', 'Tomato', 'Cream'],
          instructions: ['Cook lentils', 'Add gravy', 'Simmer'],
          cookTime: 60, prepTime: 30, totalTime: 90, videoId: 'stu901',
          fatContent: 18, saturatedFatContent: 8, cholesterolContent: 5,
          sodiumContent: 650, carbohydrateContent: 35, fiberContent: 8,
          sugarContent: 5, proteinContent: 18
        }],
        dinner: [{
          name: 'Vegetable Biryani',
          calories: 380, protein: 12, carbs: 58, fat: 11,
          ingredients: ['Rice', 'Vegetables', 'Spices'],
          instructions: ['Cook rice', 'Layer with vegetables', 'Cook on dum'],
          cookTime: 50, prepTime: 30, totalTime: 80, videoId: 'n6I0QHarGGc',
          fatContent: 11, saturatedFatContent: 4, cholesterolContent: 0,
          sodiumContent: 520, carbohydrateContent: 58, fiberContent: 4,
          sugarContent: 6, proteinContent: 12
        }]
      } : {
        breakfast: [{
          name: 'Scrambled Eggs',
          calories: 180, protein: 14, carbs: 2, fat: 12,
          ingredients: ['Eggs', 'Butter', 'Salt', 'Pepper'],
          instructions: ['Beat eggs', 'Heat butter', 'Scramble eggs', 'Serve hot'],
          cookTime: 8, prepTime: 5, totalTime: 13, videoId: 'def456',
          fatContent: 12, saturatedFatContent: 4, cholesterolContent: 320,
          sodiumContent: 320, carbohydrateContent: 2, fiberContent: 0,
          sugarContent: 1, proteinContent: 14
        }],
        lunch: [{
          name: 'Chicken Curry',
          calories: 450, protein: 35, carbs: 15, fat: 25,
          ingredients: ['Chicken', 'Onion', 'Tomato', 'Spices'],
          instructions: ['Marinate chicken', 'Cook onions', 'Add chicken', 'Simmer'],
          cookTime: 40, prepTime: 20, totalTime: 60, videoId: 'pqr678',
          fatContent: 25, saturatedFatContent: 8, cholesterolContent: 750,
          sodiumContent: 750, carbohydrateContent: 15, fiberContent: 2,
          sugarContent: 8, proteinContent: 35
        }],
        dinner: [{
          name: 'Grilled Chicken Salad',
          calories: 320, protein: 35, carbs: 8, fat: 16,
          ingredients: ['Chicken breast', 'Lettuce', 'Cucumber', 'Tomato'],
          instructions: ['Grill chicken', 'Prepare salad', 'Slice chicken', 'Serve'],
          cookTime: 12, prepTime: 15, totalTime: 27, videoId: 'nop012',
          fatContent: 16, saturatedFatContent: 4, cholesterolContent: 420,
          sodiumContent: 420, carbohydrateContent: 8, fiberContent: 4,
          sugarContent: 4, proteinContent: 35
        }]
      };
      
      const defaultSelections: any = {};
      Object.keys(fallbackRecipes).forEach(mealType => {
        defaultSelections[mealType] = fallbackRecipes[mealType][0].name;
      });
      setSelectedMeals(defaultSelections);
      
      setResults({
        bmi: calculateBMI(),
        calories: calculateCalories(),
        recommendations: fallbackRecipes,
        targetCalories: calculateCalories().find(c => c.plan === selectedCaloriePlan)?.calories || 2000
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCustomRecommendations = async () => {
    setCustomLoading(true);
    
    try {
      const response = await fetch('/custom_recipes_dataset.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      const recipes = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        const recipe: any = {};
        headers.forEach((header, index) => {
          recipe[header] = values[index] || '';
        });
        return recipe;
      });
      
      const filteredRecipes = recipes.filter(recipe => {
        const calories = parseInt(recipe.calories_per_serving) || 0;
        const protein = parseInt(recipe.protein_g) || 0;
        const carbs = parseInt(recipe.carbs_g) || 0;
        const fat = parseInt(recipe.fat_g) || 0;
        const sodium = parseInt(recipe.sodium_mg) || 0;
        const fiber = parseInt(recipe.fiber_g) || 0;
        const sugar = parseInt(recipe.sugar_g) || 0;
        
        return (
          calories <= customNutrition.calories[0] * 1.2 &&
          calories >= customNutrition.calories[0] * 0.5 &&
          protein >= customNutrition.protein[0] * 0.3 &&
          carbs <= customNutrition.carbohydrates[0] * 1.5 &&
          fat <= customNutrition.fat[0] * 1.5 &&
          sodium <= customNutrition.sodium[0] * 1.2 &&
          fiber >= customNutrition.fiber[0] * 0.3 &&
          sugar <= customNutrition.sugar[0] * 1.5
        );
      });
      
      let finalRecipes = filteredRecipes;
      if (customIngredients.trim()) {
        const ingredientList = customIngredients.toLowerCase().split(',').map(i => i.trim());
        finalRecipes = filteredRecipes.filter(recipe => {
          const recipeIngredients = (recipe.ingredients || '').toLowerCase();
          return ingredientList.some(ingredient => recipeIngredients.includes(ingredient));
        });
      }
      
      const topRecipes = finalRecipes.slice(0, customNutrition.recommendations[0]).map(recipe => ({
        name: recipe.recipe_name,
        calories: parseInt(recipe.calories_per_serving) || 0,
        protein: parseInt(recipe.protein_g) || 0,
        carbs: parseInt(recipe.carbs_g) || 0,
        fat: parseInt(recipe.fat_g) || 0,
        fiber: parseInt(recipe.fiber_g) || 0,
        sugar: parseInt(recipe.sugar_g) || 0,
        sodium: parseInt(recipe.sodium_mg) || 0,
        ingredients: recipe.ingredients ? recipe.ingredients.split(',') : [],
        instructions: recipe.instructions ? recipe.instructions.split('|') : [],
        cookTime: parseInt(recipe.cook_time_min) || 0,
        prepTime: parseInt(recipe.prep_time_min) || 0,
        totalTime: parseInt(recipe.total_time_min) || 0,
        mealType: recipe.meal_type || '',
        dietType: recipe.diet_type || '',
        proteinContent: parseInt(recipe.protein_g) || 0,
        carbohydrateContent: parseInt(recipe.carbs_g) || 0,
        fatContent: parseInt(recipe.fat_g) || 0,
        fiberContent: parseInt(recipe.fiber_g) || 0,
        sugarContent: parseInt(recipe.sugar_g) || 0,
        sodiumContent: parseInt(recipe.sodium_mg) || 0
      }));
      
      setCustomResults({
        recipes: topRecipes,
        totalNutrition: {
          calories: topRecipes.reduce((sum, r) => sum + r.calories, 0),
          protein: topRecipes.reduce((sum, r) => sum + r.proteinContent, 0),
          carbs: topRecipes.reduce((sum, r) => sum + r.carbohydrateContent, 0),
          fat: topRecipes.reduce((sum, r) => sum + r.fatContent, 0),
          fiber: topRecipes.reduce((sum, r) => sum + r.fiberContent, 0),
          sugar: topRecipes.reduce((sum, r) => sum + r.sugarContent, 0),
          sodium: topRecipes.reduce((sum, r) => sum + r.sodiumContent, 0)
        }
      });
      
    } catch (error) {
      console.error('Custom recommendation error:', error);
      setCustomResults({
        recipes: [{
          name: 'Healthy Bowl',
          calories: customNutrition.calories[0],
          protein: customNutrition.protein[0],
          carbs: customNutrition.carbohydrates[0],
          fat: customNutrition.fat[0],
          ingredients: ['Mixed vegetables', 'Protein source', 'Healthy grains'],
          cookTime: 25,
          proteinContent: customNutrition.protein[0],
          carbohydrateContent: customNutrition.carbohydrates[0],
          fatContent: customNutrition.fat[0]
        }],
        totalNutrition: {
          calories: customNutrition.calories[0],
          protein: customNutrition.protein[0],
          carbs: customNutrition.carbohydrates[0],
          fat: customNutrition.fat[0],
          fiber: customNutrition.fiber[0],
          sugar: customNutrition.sugar[0],
          sodium: customNutrition.sodium[0]
        }
      });
    } finally {
      setCustomLoading(false);
    }
  };

  const saveMealComposition = () => {
    const today = new Date().toISOString().split('T')[0];
    const mealData = {
      date: today,
      meals: selectedMeals,
      nutrition: calculateSelectedMealNutrition(),
      caloriePlan: selectedCaloriePlan,
      userProfile: {
        age: formData.age,
        height: formData.height,
        weight: formData.weight,
        activity: formData.activity,
        dietType: formData.dietType
      }
    };
    
    // Save to localStorage for AI Health Forecast
    const existingMeals = JSON.parse(localStorage.getItem('savedMealHistory') || '[]');
    const updatedMeals = [...existingMeals.filter((m: any) => m.date !== today), mealData];
    localStorage.setItem('savedMealHistory', JSON.stringify(updatedMeals));
    
    setSavedMeals({...savedMeals, [today]: mealData});
    setShowSaveSuccess(true);
    setShowHealthDashboard(true);
    
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <ModernNavbar />
      
      <section className="pt-32 pb-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Back Button and AI Health Forecast */}
          <div className="mb-6 flex justify-between items-center">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </Button>
            </Link>
            <Link href="/ai-health-forecast">
              <Button className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white">
                <Activity size={16} />
                <span>AI Health Forecast</span>
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              FoodConnect - Personalized Nutrition Hub
            </h1>
            <p className="text-gray-600">
              Your customized health and wellness companion for smart food choices
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="automatic" className="flex items-center space-x-2">
                <Activity size={16} />
                <span>Automatic Diet Recommendation</span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center space-x-2">
                <ChefHat size={16} />
                <span>Custom Food Recommendation</span>
              </TabsTrigger>
            </TabsList>

            {/* Automatic Diet Recommendation */}
            <TabsContent value="automatic" className="space-y-6">

              {/* Form */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Enter Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        min="2"
                        max="120"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="50"
                        max="300"
                        value={formData.height}
                        onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="10"
                        max="300"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value as 'Male' | 'Female'})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Activity Level</Label>
                      <Select value={formData.activity} onValueChange={(value) => setFormData({...formData, activity: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activityOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Diet Type</Label>
                      <Select value={formData.dietType} onValueChange={(value) => setFormData({...formData, dietType: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dietTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Meals per Day</Label>
                      <Select value={formData.mealsPerDay.toString()} onValueChange={(value) => setFormData({...formData, mealsPerDay: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 meals</SelectItem>
                          <SelectItem value="4">4 meals</SelectItem>
                          <SelectItem value="5">5 meals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={generateRecommendations}
                    disabled={loading}
                    className="w-full py-3 text-lg"
                  >
                    {loading ? 'Generating...' : 'Generate Recommendations'}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              {results && (
                <div className="space-y-6">
                  {/* BMI Calculator */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calculator className="mr-2 text-blue-600" size={24} />
                        BMI Calculator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-2">{results.bmi.bmi} kg/m²</div>
                        <div className={`text-2xl font-semibold ${results.bmi.color}`}>{results.bmi.category}</div>
                        <p className="text-gray-600 mt-2">Healthy BMI range: 18.5 kg/m² - 25 kg/m²</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Calories Calculator */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="mr-2 text-green-600" size={24} />
                        Calories Calculator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">Daily calorie estimates for different weight management goals:</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {results.calories.map((item: any, index: number) => (
                          <div 
                            key={index} 
                            className={`text-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedCaloriePlan === item.plan 
                                ? 'border-primary bg-green-50 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedCaloriePlan(item.plan)}
                          >
                            <div className="font-semibold">{item.plan}</div>
                            <div className="text-2xl font-bold text-blue-600">{item.calories}</div>
                            <div className="text-sm text-gray-600">Calories/day</div>
                            <div className="text-sm text-red-600">{item.loss}</div>
                          </div>
                        ))}
                      </div>
                      {selectedCaloriePlan && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-green-800 font-medium text-center">
                            Selected: {selectedCaloriePlan}
                          </p>
                        </div>
                      )}
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={results.calories}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="plan" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="calories" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Diet Recommendations */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ChefHat className="mr-2 text-purple-600" size={24} />
                        Recommended Recipes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(results.recommendations).map(([mealType, recipes]: [string, any]) => (
                          <div key={mealType}>
                            <h3 className="text-xl font-semibold mb-4 text-center uppercase">{mealType}</h3>
                            <div className="space-y-4">
                              {recipes.map((recipe: any, index: number) => (
                                <details key={index} className="border rounded-lg">
                                  <summary className="p-4 cursor-pointer font-semibold hover:bg-gray-50 flex items-center justify-between">
                                    <span>{recipe.name}</span>
                                    <Play size={16} className="text-red-600" />
                                  </summary>
                                  <div className="p-4 border-t">
                                    <div className="space-y-4">
                                      {recipe.videoId && (
                                        <div>
                                          <div className="flex items-center mb-2">
                                            <Play size={16} className="text-red-600 mr-2" />
                                            <strong>How to Make {recipe.name}:</strong>
                                          </div>
                                          <YouTubeEmbed searchQuery={recipe.videoId} title={`How to make ${recipe.name}`} />
                                        </div>
                                      )}
                                      <div className="text-sm space-y-1">
                                        <div><strong>Nutritional Values:</strong></div>
                                        <div>Calories: {recipe.calories}</div>
                                        <div>Protein: {recipe.proteinContent || recipe.protein}g</div>
                                        <div>Carbs: {recipe.carbohydrateContent || recipe.carbs}g</div>
                                        <div>Fat: {recipe.fatContent || recipe.fat}g</div>
                                      </div>
                                      <div>
                                        <strong>Ingredients:</strong>
                                        <ul className="list-disc list-inside text-sm mt-1">
                                          {recipe.ingredients?.map((ing: string, i: number) => (
                                            <li key={i}>{ing}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div>
                                        <strong>Instructions:</strong>
                                        <ol className="list-decimal list-inside text-sm mt-1">
                                          {recipe.instructions?.map((inst: string, i: number) => (
                                            <li key={i}>{inst}</li>
                                          ))}
                                        </ol>
                                      </div>
                                      <div className="text-sm">
                                        <strong>Cooking Time:</strong>
                                        <div>Cook Time: {recipe.cookTime}min</div>
                                        <div>Prep Time: {recipe.prepTime}min</div>
                                        <div>Total Time: {recipe.totalTime}min</div>
                                      </div>
                                    </div>
                                  </div>
                                </details>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Meal Selection and Charts */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Choose Your Meal Composition</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(results.recommendations).map(([mealType, meals]: [string, any]) => (
                          <div key={mealType}>
                            <Label className="capitalize font-semibold">{mealType}</Label>
                            <Select 
                              value={selectedMeals[mealType] || ''} 
                              onValueChange={(value) => setSelectedMeals({...selectedMeals, [mealType]: value})}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder={`Choose ${mealType}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {meals.map((meal: any) => (
                                  <SelectItem key={meal.name} value={meal.name}>
                                    {meal.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      
                      {/* Comparison Chart */}
                      {Object.keys(results.recommendations).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-center">
                          Total Calories in Recipes vs {selectedCaloriePlan} Target
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getComparisonChartData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="calories" fill="#3B82F6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      )}
                      
                      {/* Nutrition Pie Chart */}
                      {getNutritionPieData().length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-center">Nutritional Breakdown</h3>
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getNutritionPieData()}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}${name === 'Sodium' ? '00mg' : 'g'}`}
                              >
                                {getNutritionPieData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: any, name: any) => [
                                  `${value}${name === 'Sodium' ? '00mg' : 'g'}`, 
                                  name
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                      </div>
                      )}
                      
                      {/* Save Meal Button */}
                      <div className="mt-6 text-center">
                        <Button 
                          onClick={saveMealComposition}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                        >
                          <Save className="mr-2" size={20} />
                          Save Meal Composition
                        </Button>
                        {showSaveSuccess && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 font-medium">✅ Meal composition saved successfully!</p>
                            <p className="text-green-600 text-sm">Your eating patterns are being tracked for AI Health Forecast</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Visual Health Dashboard */}
                      {showHealthDashboard && (
                        <div className="mt-8">
                          <VisualHealthDashboard 
                            mealData={{
                              nutrition: calculateSelectedMealNutrition(),
                              meals: selectedMeals
                            }}
                            userProfile={formData}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Custom Food Recommendation */}
            <TabsContent value="custom" className="space-y-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Nutritional Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Calories: {customNutrition.calories[0]}</Label>
                        <Slider
                          value={customNutrition.calories}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, calories: value})}
                          max={2000}
                          min={100}
                          step={50}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Fat Content: {customNutrition.fat[0]}g</Label>
                        <Slider
                          value={customNutrition.fat}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, fat: value})}
                          max={100}
                          min={0}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Saturated Fat: {customNutrition.saturatedFat[0]}g</Label>
                        <Slider
                          value={customNutrition.saturatedFat}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, saturatedFat: value})}
                          max={50}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Cholesterol: {customNutrition.cholesterol[0]}mg</Label>
                        <Slider
                          value={customNutrition.cholesterol}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, cholesterol: value})}
                          max={300}
                          min={0}
                          step={10}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Sodium: {customNutrition.sodium[0]}mg</Label>
                        <Slider
                          value={customNutrition.sodium}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, sodium: value})}
                          max={2000}
                          min={0}
                          step={50}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Carbohydrates: {customNutrition.carbohydrates[0]}g</Label>
                        <Slider
                          value={customNutrition.carbohydrates}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, carbohydrates: value})}
                          max={300}
                          min={0}
                          step={10}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Fiber: {customNutrition.fiber[0]}g</Label>
                        <Slider
                          value={customNutrition.fiber}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, fiber: value})}
                          max={50}
                          min={0}
                          step={2}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Sugar: {customNutrition.sugar[0]}g</Label>
                        <Slider
                          value={customNutrition.sugar}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, sugar: value})}
                          max={100}
                          min={0}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Protein: {customNutrition.protein[0]}g</Label>
                        <Slider
                          value={customNutrition.protein}
                          onValueChange={(value) => setCustomNutrition({...customNutrition, protein: value})}
                          max={150}
                          min={0}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Number of Recommendations: {customNutrition.recommendations[0]}</Label>
                    <Slider
                      value={customNutrition.recommendations}
                      onValueChange={(value) => setCustomNutrition({...customNutrition, recommendations: value})}
                      max={20}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Specify ingredients (separated by ",")</Label>
                    <Textarea
                      placeholder="Milk,eggs,butter,chicken..."
                      value={customIngredients}
                      onChange={(e) => setCustomIngredients(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <Button 
                    onClick={generateCustomRecommendations}
                    disabled={customLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {customLoading ? 'Generating...' : 'Generate Custom Recommendations'}
                  </Button>
                </CardContent>
              </Card>
              
              {customResults && (
                <div className="space-y-6">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Recommended Recipes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {customResults.recipes.map((recipe: any, index: number) => (
                          <details key={index} className="border rounded-lg">
                            <summary className="p-4 cursor-pointer font-semibold hover:bg-gray-50 flex items-center justify-between">
                              <span>{recipe.name}</span>
                              <Play size={16} className="text-red-600" />
                            </summary>
                            <div className="p-4 border-t">
                              <div className="space-y-4">
                                {recipe.name && (
                                  <div>
                                    <div className="flex items-center mb-2">
                                      <Play size={16} className="text-red-600 mr-2" />
                                      <strong>How to Make {recipe.name}:</strong>
                                    </div>
                                    <YouTubeEmbed searchQuery={recipe.name} title={`How to make ${recipe.name}`} />
                                  </div>
                                )}
                                <div className="text-sm space-y-1">
                                  <div><strong>Nutritional Values:</strong></div>
                                  <div>Calories: {recipe.calories}</div>
                                  <div>Protein: {recipe.proteinContent || recipe.protein}g</div>
                                  <div>Carbs: {recipe.carbohydrateContent || recipe.carbs}g</div>
                                  <div>Fat: {recipe.fatContent || recipe.fat}g</div>
                                  {recipe.fiber && <div>Fiber: {recipe.fiberContent || recipe.fiber}g</div>}
                                  {recipe.sugar && <div>Sugar: {recipe.sugarContent || recipe.sugar}g</div>}
                                  {recipe.sodium && <div>Sodium: {recipe.sodiumContent || recipe.sodium}mg</div>}
                                </div>
                                <div>
                                  <strong>Ingredients:</strong>
                                  <ul className="list-disc list-inside text-sm mt-1">
                                    {recipe.ingredients?.map((ing: string, i: number) => (
                                      <li key={i}>{ing.trim()}</li>
                                    ))}
                                  </ul>
                                </div>
                                {recipe.instructions && recipe.instructions.length > 0 && (
                                  <div>
                                    <strong>Instructions:</strong>
                                    <ol className="list-decimal list-inside text-sm mt-1">
                                      {recipe.instructions.map((inst: string, i: number) => (
                                        <li key={i}>{inst.trim()}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <strong>Cooking Time:</strong>
                                  <div>Cook Time: {recipe.cookTime}min</div>
                                  <div>Prep Time: {recipe.prepTime}min</div>
                                  <div>Total Time: {recipe.totalTime}min</div>
                                  {recipe.mealType && <div>Meal Type: {recipe.mealType}</div>}
                                  {recipe.dietType && <div>Diet Type: {recipe.dietType}</div>}
                                </div>
                              </div>
                            </div>
                          </details>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Label>Select a recipe for detailed analysis:</Label>
                        <Select defaultValue={customResults.recipes[0]?.name}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {customResults.recipes.map((recipe: any) => (
                              <SelectItem key={recipe.name} value={recipe.name}>
                                {recipe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="font-semibold mb-4">Nutritional Values - {customResults.recipes[0]?.name}</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Calories', value: customResults.totalNutrition.calories * 0.46 },
                                  { name: 'Fat', value: customResults.totalNutrition.fat * 5 },
                                  { name: 'Carbs', value: customResults.totalNutrition.carbs * 9 },
                                  { name: 'Protein', value: customResults.totalNutrition.protein * 13 }
                                ].filter(item => item.value > 0)}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${Math.round(value)}`}
                              >
                                {COLORS.map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-sm text-gray-600 mt-4">
                          You can select/deselect an item (nutrition value) from the legend.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <BottomNavigation />
    </div>
  );
}