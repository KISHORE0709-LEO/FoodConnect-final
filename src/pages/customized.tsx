import { useState, useEffect } from 'react';
import { BottomNavigation } from '@/components/navigation';
import { ModernNavbar } from '@/components/ModernNavbar';
import PersonalizedRiskAnalysis from '@/components/PersonalizedRiskAnalysis';
import AiMealBudgetPlanner from '@/components/AiMealBudgetPlanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calculator, Activity, ChefHat, Play, DollarSign, Users, Save, TrendingUp, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { VisualHealthDashboard } from '@/components/VisualHealthDashboard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

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
  const { user } = useAuth();
  // Check if we should show personalized risk analysis
  const urlParams = new URLSearchParams(window.location.search);
  const fromGeneric = urlParams.get('from') === 'generic';
  const storedData = localStorage.getItem('lastScannedFood');
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(fromGeneric && !!storedData);
  const [showMealPlanner, setShowMealPlanner] = useState(false);
  
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
  const [weeklyBudget, setWeeklyBudget] = useState<number | ''>('');
  const [familyMembers, setFamilyMembers] = useState<number | ''>('');
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
  const [customDietType, setCustomDietType] = useState('Vegetarian');
  const [saveNotification, setSaveNotification] = useState<string>('');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Auto-generate recommendations when form data, budget, or family members change
  useEffect(() => {
    if (formData.age && formData.height && formData.weight && weeklyBudget && familyMembers) {
      generateRecommendations();
    }
  }, [formData, weeklyBudget, familyMembers, selectedCaloriePlan]);

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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
          <div className="text-center">
            <Play size={32} className="mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium mb-2 text-green-800">Watch Recipe Tutorial</p>
            <a 
              href={searchUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-500 text-white rounded-lg hover:from-green-700 hover:to-blue-600 transition-colors"
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

  const getBudgetBasedRecipes = (budgetTier: string, dietType: string) => {
    const lowBudgetVeg = {
      breakfast: [
        { name: 'Poha', calories: 250, protein: 6, carbs: 45, fat: 8, cost: 15, quantity: '150g', ingredients: ['Flattened rice - 100g', 'Onion - 30g', 'Turmeric - 2g'], instructions: ['Wash poha', 'Sauté onions', 'Mix and serve'], cookTime: 10, prepTime: 5, totalTime: 15 },
        { name: 'Upma', calories: 200, protein: 5, carbs: 35, fat: 6, cost: 12, quantity: '120g', ingredients: ['Semolina - 80g', 'Vegetables - 40g', 'Spices - 3g'], instructions: ['Roast semolina', 'Add water', 'Cook until done'], cookTime: 15, prepTime: 5, totalTime: 20 },
        { name: 'Daliya', calories: 180, protein: 7, carbs: 30, fat: 4, cost: 18, quantity: '130g', ingredients: ['Broken wheat - 90g', 'Vegetables - 40g'], instructions: ['Cook daliya', 'Add vegetables', 'Season'], cookTime: 20, prepTime: 5, totalTime: 25 }
      ],
      lunch: [
        { name: 'Dal Rice', calories: 350, protein: 12, carbs: 60, fat: 8, cost: 25, quantity: '200g', ingredients: ['Rice - 100g', 'Lentils - 50g', 'Turmeric - 2g'], instructions: ['Cook rice', 'Prepare dal', 'Serve together'], cookTime: 30, prepTime: 10, totalTime: 40 },
        { name: 'Khichdi', calories: 300, protein: 10, carbs: 55, fat: 6, cost: 20, quantity: '180g', ingredients: ['Rice - 80g', 'Lentils - 40g', 'Vegetables - 60g'], instructions: ['Mix rice and dal', 'Add vegetables', 'Cook together'], cookTime: 25, prepTime: 10, totalTime: 35 },
        { name: 'Sabzi Roti', calories: 320, protein: 8, carbs: 50, fat: 10, cost: 30, quantity: '220g', ingredients: ['Wheat flour - 100g', 'Seasonal vegetables - 120g'], instructions: ['Make rotis', 'Prepare sabzi', 'Serve hot'], cookTime: 20, prepTime: 15, totalTime: 35 }
      ],
      dinner: [
        { name: 'Roti Dal', calories: 280, protein: 11, carbs: 45, fat: 7, cost: 22, quantity: '190g', ingredients: ['Wheat flour - 80g', 'Lentils - 60g'], instructions: ['Make rotis', 'Prepare dal', 'Serve'], cookTime: 25, prepTime: 10, totalTime: 35 },
        { name: 'Rice Sabzi', calories: 300, protein: 6, carbs: 55, fat: 8, cost: 25, quantity: '200g', ingredients: ['Rice - 100g', 'Mixed vegetables - 100g'], instructions: ['Cook rice', 'Prepare vegetables', 'Serve'], cookTime: 20, prepTime: 10, totalTime: 30 },
        { name: 'Paratha Curd', calories: 350, protein: 8, carbs: 50, fat: 12, cost: 28, quantity: '170g', ingredients: ['Wheat flour - 100g', 'Curd - 60g', 'Oil - 10g'], instructions: ['Make parathas', 'Serve with curd'], cookTime: 15, prepTime: 10, totalTime: 25 }
      ]
    };

    const mediumBudgetVeg = {
      breakfast: [
        { name: 'Paneer Paratha', calories: 400, protein: 15, carbs: 45, fat: 18, cost: 60, quantity: '180g', ingredients: ['Wheat flour - 100g', 'Paneer - 60g', 'Spices - 5g'], instructions: ['Make dough', 'Prepare filling', 'Cook parathas'], cookTime: 20, prepTime: 15, totalTime: 35 },
        { name: 'Idli Sambar', calories: 320, protein: 12, carbs: 55, fat: 8, cost: 45, quantity: '220g', ingredients: ['Rice - 80g', 'Urad dal - 40g', 'Vegetables - 100g'], instructions: ['Steam idlis', 'Prepare sambar', 'Serve hot'], cookTime: 25, prepTime: 20, totalTime: 45 },
        { name: 'Aloo Paratha', calories: 380, protein: 8, carbs: 50, fat: 16, cost: 40, quantity: '170g', ingredients: ['Wheat flour - 100g', 'Potatoes - 60g', 'Spices - 5g'], instructions: ['Boil potatoes', 'Make filling', 'Cook parathas'], cookTime: 18, prepTime: 15, totalTime: 33 }
      ],
      lunch: [
        { name: 'Paneer Curry Rice', calories: 450, protein: 18, carbs: 55, fat: 16, cost: 80, quantity: '250g', ingredients: ['Rice - 100g', 'Paneer - 80g', 'Tomatoes - 60g', 'Spices - 10g'], instructions: ['Cook rice', 'Prepare paneer curry', 'Serve together'], cookTime: 35, prepTime: 15, totalTime: 50 },
        { name: 'Rajma Rice', calories: 420, protein: 16, carbs: 60, fat: 12, cost: 70, quantity: '230g', ingredients: ['Rice - 100g', 'Kidney beans - 80g', 'Onions - 50g'], instructions: ['Soak rajma', 'Cook with spices', 'Serve with rice'], cookTime: 45, prepTime: 20, totalTime: 65 },
        { name: 'Chole Rice', calories: 400, protein: 14, carbs: 58, fat: 10, cost: 65, quantity: '220g', ingredients: ['Rice - 100g', 'Chickpeas - 80g', 'Spices - 8g'], instructions: ['Cook chickpeas', 'Prepare gravy', 'Serve with rice'], cookTime: 40, prepTime: 15, totalTime: 55 }
      ],
      dinner: [
        { name: 'Palak Paneer', calories: 380, protein: 16, carbs: 25, fat: 22, cost: 85, quantity: '200g', ingredients: ['Paneer - 100g', 'Spinach - 80g', 'Cream - 20g'], instructions: ['Blanch spinach', 'Cook paneer', 'Mix together'], cookTime: 25, prepTime: 15, totalTime: 40 },
        { name: 'Vegetable Biryani', calories: 450, protein: 12, carbs: 65, fat: 15, cost: 90, quantity: '280g', ingredients: ['Basmati rice - 120g', 'Mixed vegetables - 150g', 'Spices - 10g'], instructions: ['Layer rice and vegetables', 'Cook on dum', 'Serve hot'], cookTime: 45, prepTime: 20, totalTime: 65 },
        { name: 'Dal Makhani', calories: 420, protein: 18, carbs: 35, fat: 20, cost: 75, quantity: '210g', ingredients: ['Black lentils - 100g', 'Cream - 30g', 'Butter - 20g'], instructions: ['Cook lentils', 'Add cream', 'Simmer'], cookTime: 60, prepTime: 15, totalTime: 75 }
      ]
    };

    const highBudgetVeg = {
      breakfast: [
        { name: 'Quinoa Bowl', calories: 450, protein: 18, carbs: 55, fat: 12, cost: 150, ingredients: ['Quinoa', 'Nuts', 'Fruits', 'Honey'], instructions: ['Cook quinoa', 'Add toppings', 'Drizzle honey'], cookTime: 15, prepTime: 10, totalTime: 25 },
        { name: 'Avocado Toast', calories: 380, protein: 12, carbs: 35, fat: 22, cost: 180, ingredients: ['Multigrain bread', 'Avocado', 'Seeds'], instructions: ['Toast bread', 'Mash avocado', 'Top with seeds'], cookTime: 5, prepTime: 10, totalTime: 15 },
        { name: 'Smoothie Bowl', calories: 420, protein: 15, carbs: 50, fat: 16, cost: 200, ingredients: ['Berries', 'Protein powder', 'Nuts'], instructions: ['Blend fruits', 'Pour in bowl', 'Add toppings'], cookTime: 0, prepTime: 10, totalTime: 10 }
      ],
      lunch: [
        { name: 'Exotic Salad', calories: 350, protein: 15, carbs: 30, fat: 20, cost: 250, ingredients: ['Mixed greens', 'Quinoa', 'Nuts', 'Cheese'], instructions: ['Mix greens', 'Add quinoa', 'Top with nuts'], cookTime: 0, prepTime: 15, totalTime: 15 },
        { name: 'Stuffed Bell Peppers', calories: 400, protein: 16, carbs: 35, fat: 18, cost: 220, ingredients: ['Bell peppers', 'Quinoa', 'Vegetables'], instructions: ['Hollow peppers', 'Stuff with quinoa', 'Bake'], cookTime: 30, prepTime: 20, totalTime: 50 },
        { name: 'Mediterranean Bowl', calories: 480, protein: 20, carbs: 45, fat: 22, cost: 280, ingredients: ['Couscous', 'Olives', 'Feta', 'Vegetables'], instructions: ['Cook couscous', 'Add vegetables', 'Top with feta'], cookTime: 15, prepTime: 15, totalTime: 30 }
      ],
      dinner: [
        { name: 'Truffle Pasta', calories: 520, protein: 18, carbs: 60, fat: 24, cost: 350, ingredients: ['Pasta', 'Truffle oil', 'Parmesan'], instructions: ['Cook pasta', 'Add truffle oil', 'Top with cheese'], cookTime: 15, prepTime: 10, totalTime: 25 },
        { name: 'Gourmet Pizza', calories: 580, protein: 22, carbs: 55, fat: 28, cost: 400, ingredients: ['Pizza base', 'Exotic vegetables', 'Cheese'], instructions: ['Prepare base', 'Add toppings', 'Bake'], cookTime: 20, prepTime: 15, totalTime: 35 },
        { name: 'Saffron Risotto', calories: 450, protein: 16, carbs: 65, fat: 15, cost: 320, ingredients: ['Arborio rice', 'Saffron', 'Parmesan'], instructions: ['Cook rice slowly', 'Add saffron', 'Stir in cheese'], cookTime: 25, prepTime: 10, totalTime: 35 }
      ]
    };

    // Non-vegetarian options
    const lowBudgetNonVeg = {
      breakfast: [
        { name: 'Egg Paratha', calories: 350, protein: 14, carbs: 40, fat: 16, cost: 35, ingredients: ['Wheat flour', 'Eggs', 'Onions'], instructions: ['Make dough', 'Scramble eggs', 'Cook parathas'], cookTime: 15, prepTime: 10, totalTime: 25 },
        { name: 'Boiled Eggs', calories: 280, protein: 18, carbs: 5, fat: 20, cost: 25, ingredients: ['Eggs', 'Salt', 'Pepper'], instructions: ['Boil eggs', 'Season', 'Serve'], cookTime: 10, prepTime: 2, totalTime: 12 },
        { name: 'Egg Curry', calories: 320, protein: 16, carbs: 15, fat: 22, cost: 40, ingredients: ['Eggs', 'Onions', 'Spices'], instructions: ['Boil eggs', 'Prepare gravy', 'Simmer together'], cookTime: 20, prepTime: 10, totalTime: 30 }
      ],
      lunch: [
        { name: 'Chicken Curry', calories: 450, protein: 35, carbs: 15, fat: 25, cost: 80, ingredients: ['Chicken', 'Onions', 'Spices'], instructions: ['Marinate chicken', 'Cook gravy', 'Simmer'], cookTime: 40, prepTime: 20, totalTime: 60 },
        { name: 'Fish Curry', calories: 380, protein: 32, carbs: 12, fat: 20, cost: 90, ingredients: ['Fish', 'Coconut', 'Spices'], instructions: ['Clean fish', 'Prepare curry', 'Cook together'], cookTime: 25, prepTime: 15, totalTime: 40 },
        { name: 'Mutton Rice', calories: 520, protein: 28, carbs: 45, fat: 22, cost: 120, ingredients: ['Mutton', 'Rice', 'Spices'], instructions: ['Cook mutton', 'Prepare rice', 'Mix together'], cookTime: 60, prepTime: 20, totalTime: 80 }
      ],
      dinner: [
        { name: 'Grilled Chicken', calories: 400, protein: 40, carbs: 5, fat: 18, cost: 100, ingredients: ['Chicken breast', 'Herbs', 'Oil'], instructions: ['Marinate chicken', 'Grill', 'Serve hot'], cookTime: 15, prepTime: 30, totalTime: 45 },
        { name: 'Fish Fry', calories: 350, protein: 30, carbs: 8, fat: 20, cost: 85, ingredients: ['Fish', 'Spices', 'Oil'], instructions: ['Marinate fish', 'Shallow fry', 'Serve'], cookTime: 10, prepTime: 20, totalTime: 30 },
        { name: 'Egg Biryani', calories: 480, protein: 20, carbs: 55, fat: 18, cost: 70, ingredients: ['Rice', 'Eggs', 'Spices'], instructions: ['Boil eggs', 'Layer with rice', 'Cook on dum'], cookTime: 35, prepTime: 15, totalTime: 50 }
      ]
    };

    const mediumBudgetNonVeg = {
      breakfast: [
        { name: 'Chicken Sandwich', calories: 420, protein: 25, carbs: 35, fat: 20, cost: 80, ingredients: ['Bread', 'Chicken', 'Vegetables'], instructions: ['Cook chicken', 'Assemble sandwich', 'Grill'], cookTime: 10, prepTime: 15, totalTime: 25 },
        { name: 'Fish Cutlet', calories: 380, protein: 22, carbs: 25, fat: 22, cost: 90, ingredients: ['Fish', 'Potatoes', 'Breadcrumbs'], instructions: ['Cook fish', 'Make cutlets', 'Deep fry'], cookTime: 15, prepTime: 20, totalTime: 35 },
        { name: 'Chicken Omelette', calories: 350, protein: 28, carbs: 8, fat: 24, cost: 70, ingredients: ['Eggs', 'Chicken', 'Cheese'], instructions: ['Beat eggs', 'Add chicken', 'Cook omelette'], cookTime: 8, prepTime: 10, totalTime: 18 }
      ],
      lunch: [
        { name: 'Butter Chicken', calories: 520, protein: 35, carbs: 20, fat: 32, cost: 180, ingredients: ['Chicken', 'Butter', 'Cream', 'Spices'], instructions: ['Marinate chicken', 'Prepare gravy', 'Simmer in butter'], cookTime: 30, prepTime: 20, totalTime: 50 },
        { name: 'Fish Biryani', calories: 480, protein: 28, carbs: 55, fat: 16, cost: 150, ingredients: ['Fish', 'Basmati rice', 'Spices'], instructions: ['Marinate fish', 'Layer with rice', 'Cook on dum'], cookTime: 40, prepTime: 25, totalTime: 65 },
        { name: 'Prawn Curry', calories: 420, protein: 30, carbs: 15, fat: 25, cost: 200, ingredients: ['Prawns', 'Coconut milk', 'Spices'], instructions: ['Clean prawns', 'Prepare curry', 'Simmer'], cookTime: 20, prepTime: 15, totalTime: 35 }
      ],
      dinner: [
        { name: 'Tandoori Chicken', calories: 450, protein: 38, carbs: 8, fat: 25, cost: 160, ingredients: ['Chicken', 'Yogurt', 'Spices'], instructions: ['Marinate overnight', 'Grill in tandoor', 'Serve hot'], cookTime: 25, prepTime: 480, totalTime: 505 },
        { name: 'Mutton Biryani', calories: 580, protein: 32, carbs: 60, fat: 22, cost: 220, ingredients: ['Mutton', 'Basmati rice', 'Saffron'], instructions: ['Cook mutton', 'Layer with rice', 'Cook on dum'], cookTime: 60, prepTime: 30, totalTime: 90 },
        { name: 'Fish Tikka', calories: 380, protein: 35, carbs: 10, fat: 20, cost: 180, ingredients: ['Fish', 'Yogurt', 'Spices'], instructions: ['Marinate fish', 'Grill', 'Serve with mint chutney'], cookTime: 15, prepTime: 30, totalTime: 45 }
      ]
    };

    const highBudgetNonVeg = {
      breakfast: [
        { name: 'Smoked Salmon Bagel', calories: 450, protein: 25, carbs: 35, fat: 22, cost: 350, ingredients: ['Bagel', 'Smoked salmon', 'Cream cheese'], instructions: ['Toast bagel', 'Add salmon', 'Top with cheese'], cookTime: 5, prepTime: 5, totalTime: 10 },
        { name: 'Lobster Benedict', calories: 520, protein: 30, carbs: 25, fat: 32, cost: 500, ingredients: ['English muffin', 'Lobster', 'Hollandaise'], instructions: ['Poach eggs', 'Prepare lobster', 'Assemble'], cookTime: 15, prepTime: 20, totalTime: 35 },
        { name: 'Caviar Toast', calories: 380, protein: 20, carbs: 20, fat: 25, cost: 800, ingredients: ['Artisan bread', 'Caviar', 'Crème fraîche'], instructions: ['Toast bread', 'Spread crème', 'Top with caviar'], cookTime: 3, prepTime: 5, totalTime: 8 }
      ],
      lunch: [
        { name: 'Wagyu Steak', calories: 650, protein: 45, carbs: 5, fat: 48, cost: 1200, ingredients: ['Wagyu beef', 'Herbs', 'Truffle oil'], instructions: ['Season steak', 'Sear perfectly', 'Rest and serve'], cookTime: 12, prepTime: 10, totalTime: 22 },
        { name: 'Lobster Thermidor', calories: 580, protein: 40, carbs: 15, fat: 38, cost: 800, ingredients: ['Lobster', 'Cream', 'Cheese', 'Brandy'], instructions: ['Cook lobster', 'Prepare sauce', 'Bake with cheese'], cookTime: 25, prepTime: 20, totalTime: 45 },
        { name: 'Tuna Sashimi', calories: 420, protein: 35, carbs: 8, fat: 25, cost: 600, ingredients: ['Fresh tuna', 'Wasabi', 'Soy sauce'], instructions: ['Slice tuna', 'Arrange beautifully', 'Serve with condiments'], cookTime: 0, prepTime: 15, totalTime: 15 }
      ],
      dinner: [
        { name: 'Duck Confit', calories: 620, protein: 35, carbs: 12, fat: 45, cost: 450, ingredients: ['Duck leg', 'Herbs', 'Duck fat'], instructions: ['Cure duck', 'Cook in fat', 'Crisp skin'], cookTime: 180, prepTime: 30, totalTime: 210 },
        { name: 'Rack of Lamb', calories: 580, protein: 42, carbs: 8, fat: 40, cost: 650, ingredients: ['Lamb rack', 'Rosemary', 'Garlic'], instructions: ['Season lamb', 'Sear and roast', 'Rest before serving'], cookTime: 20, prepTime: 15, totalTime: 35 },
        { name: 'Chilean Sea Bass', calories: 480, protein: 38, carbs: 10, fat: 28, cost: 550, ingredients: ['Sea bass', 'Miso', 'Sake'], instructions: ['Marinate fish', 'Grill carefully', 'Glaze and serve'], cookTime: 12, prepTime: 20, totalTime: 32 }
      ]
    };

    // Select recipes based on budget tier and diet type
    let selectedRecipes;
    if (dietType === 'Vegetarian') {
      selectedRecipes = budgetTier === 'low' ? lowBudgetVeg : budgetTier === 'medium' ? mediumBudgetVeg : highBudgetVeg;
    } else if (dietType === 'Non-Vegetarian') {
      selectedRecipes = budgetTier === 'low' ? lowBudgetNonVeg : budgetTier === 'medium' ? mediumBudgetNonVeg : highBudgetNonVeg;
    } else { // Both
      const vegRecipes = budgetTier === 'low' ? lowBudgetVeg : budgetTier === 'medium' ? mediumBudgetVeg : highBudgetVeg;
      const nonVegRecipes = budgetTier === 'low' ? lowBudgetNonVeg : budgetTier === 'medium' ? mediumBudgetNonVeg : highBudgetNonVeg;
      selectedRecipes = {
        breakfast: [...vegRecipes.breakfast.slice(0, 2), ...nonVegRecipes.breakfast.slice(0, 1)],
        lunch: [...vegRecipes.lunch.slice(0, 2), ...nonVegRecipes.lunch.slice(0, 1)],
        dinner: [...vegRecipes.dinner.slice(0, 2), ...nonVegRecipes.dinner.slice(0, 1)]
      };
    }

    // Format recipes with all required properties
    const formatRecipe = (recipe: any) => ({
      ...recipe,
      budgetTier,
      videoId: recipe.name,
      fatContent: recipe.fat,
      saturatedFatContent: Math.round(recipe.fat * 0.3),
      cholesterolContent: dietType === 'Vegetarian' ? 0 : Math.round(recipe.protein * 2),
      sodiumContent: Math.round(recipe.calories * 0.5),
      carbohydrateContent: recipe.carbs,
      fiberContent: Math.round(recipe.carbs * 0.1),
      sugarContent: Math.round(recipe.carbs * 0.2),
      proteinContent: recipe.protein
    });

    return {
      breakfast: selectedRecipes.breakfast.map(formatRecipe),
      lunch: selectedRecipes.lunch.map(formatRecipe),
      dinner: selectedRecipes.dinner.map(formatRecipe)
    };
  };

  const generateRecommendations = async () => {
    if (!formData.age || !formData.height || !formData.weight) return;
    
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
      
      // Filter by diet type and budget with real-time updates
      const budgetValue = typeof weeklyBudget === 'number' ? weeklyBudget : 1000;
      const familySize = typeof familyMembers === 'number' ? familyMembers : 4;
      const dailyBudget = budgetValue; // Now it's daily budget directly
      const perPersonDaily = dailyBudget / familySize;
      
      // Determine budget tier based on per person daily budget
      const budgetTier = perPersonDaily < 50 ? 'low' : perPersonDaily < 150 ? 'medium' : 'high';
      
      // Since CSV doesn't have cost data, use fallback recipes with proper budget tiers
      const budgetRecipes = getBudgetBasedRecipes(budgetTier, formData.dietType);
      
      setResults({
        bmi: bmiData,
        calories: calorieData,
        recommendations: budgetRecipes,
        targetCalories: calorieData.find(c => c.plan === selectedCaloriePlan)?.calories || 2000
      });
      
    } catch (error) {
      console.error('Error:', error);
      // Use budget-based fallback recipes
      const budgetValue = typeof weeklyBudget === 'number' ? weeklyBudget : 1000;
      const familySize = typeof familyMembers === 'number' ? familyMembers : 4;
      const dailyBudget = budgetValue; // Now it's daily budget directly
      const perPersonDaily = dailyBudget / familySize;
      const budgetTier = perPersonDaily < 50 ? 'low' : perPersonDaily < 150 ? 'medium' : 'high';
      
      const budgetRecipes = getBudgetBasedRecipes(budgetTier, formData.dietType);
      
      setResults({
        bmi: bmiData,
        calories: calorieData,
        recommendations: budgetRecipes,
        targetCalories: calorieData.find(c => c.plan === selectedCaloriePlan)?.calories || 2000
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
        
        // Filter by nutritional values
        const nutritionMatch = (
          calories <= customNutrition.calories[0] * 1.2 &&
          calories >= customNutrition.calories[0] * 0.5 &&
          protein >= customNutrition.protein[0] * 0.3 &&
          carbs <= customNutrition.carbohydrates[0] * 1.5 &&
          fat <= customNutrition.fat[0] * 1.5 &&
          sodium <= customNutrition.sodium[0] * 1.2 &&
          fiber >= customNutrition.fiber[0] * 0.3 &&
          sugar <= customNutrition.sugar[0] * 1.5
        );
        
        // Filter by diet type
        const dietMatch = customDietType === 'Both' || 
                         recipe.diet_type === customDietType || 
                         recipe.diet_type === 'Both';
        
        return nutritionMatch && dietMatch;
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

  const saveMealPlan = async (recipes: any) => {
    if (!user) {
      setSaveNotification('Please login to save meal plans');
      setTimeout(() => setSaveNotification(''), 3000);
      return;
    }

    try {
      const mealPlan = {
        userId: user.uid,
        recipes: recipes,
        totalNutrition: calculateTotalNutrition(recipes),
        createdAt: new Date(),
        userProfile: {
          age: formData.age,
          height: formData.height,
          weight: formData.weight,
          gender: formData.gender,
          activity: formData.activity,
          dietType: formData.dietType
        }
      };
      
      await addDoc(collection(db, 'mealPlans'), mealPlan);
      
      setSaveNotification('Meal plan saved successfully!');
      setTimeout(() => setSaveNotification(''), 3000);
    } catch (error) {
      console.error('Error saving meal plan:', error);
      setSaveNotification('Error saving meal plan');
      setTimeout(() => setSaveNotification(''), 3000);
    }
  };

  const calculateTotalNutrition = (recipes: any) => {
    const total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };
    
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      if (recipes[mealType]) {
        recipes[mealType].forEach((recipe: any) => {
          total.calories += recipe.calories || 0;
          total.protein += recipe.proteinContent || recipe.protein || 0;
          total.carbs += recipe.carbohydrateContent || recipe.carbs || 0;
          total.fat += recipe.fatContent || recipe.fat || 0;
          total.fiber += recipe.fiberContent || 0;
          total.sugar += recipe.sugarContent || 0;
          total.sodium += recipe.sodiumContent || 0;
        });
      }
    });
    
    return total;
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <ModernNavbar />
      
      {/* Show risk analysis if coming from generic page */}
      {showRiskAnalysis && (
        <div className="pt-32 pb-8 px-4">
          <div className="max-w-6xl mx-auto mb-6">
            <Button 
              onClick={() => setShowRiskAnalysis(false)}
              variant="outline"
              className="mb-4"
            >
              View Diet Recommendations
            </Button>
          </div>
          <PersonalizedRiskAnalysis />
        </div>
      )}
      
      {/* AI Meal Budget Planner Modal */}
      {showMealPlanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <Button
              onClick={() => setShowMealPlanner(false)}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10"
            >
              <X size={20} />
            </Button>
            <div className="p-6">
              <AiMealBudgetPlanner />
            </div>
          </div>
        </div>
      )}
      
      {/* Normal customized page content */}
      {!showRiskAnalysis && (
      <section className="pt-32 pb-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Save Notification */}
          {saveNotification && (
            <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              {saveNotification}
            </div>
          )}
          
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
                    disabled={loading || !formData.age || !formData.height || !formData.weight}
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

                  {/* Meal Budget Planner */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="mr-2 text-green-600" size={24} />
                        Meal Budget Planner
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Daily Budget (₹)</label>
                          <Input
                            type="number"
                            value={weeklyBudget}
                            onChange={(e) => setWeeklyBudget(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Enter daily budget"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Family Members</label>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <Input
                              type="number"
                              value={familyMembers}
                              onChange={(e) => setFamilyMembers(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="Number of people"
                              min="1"
                              max="10"
                            />
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={generateRecommendations}
                        disabled={loading || !weeklyBudget || !familyMembers}
                        className="w-full py-3 text-lg bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white"
                      >
                        {loading ? 'Updating...' : 'Update Recipes'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Diet Recommendations - Only show after budget is entered */}
                  {weeklyBudget && familyMembers && (
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
                                      <Play size={16} className="text-green-600" />
                                    </summary>
                                    <div className="p-4 border-t">
                                      <div className="space-y-4">
                                        {recipe.videoId && (
                                          <div>
                                            <div className="flex items-center mb-2">
                                              <Play size={16} className="text-green-600 mr-2" />
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
                                          <div><strong>Quantity: {recipe.quantity}</strong></div>
                                          <div><strong>Cost per serving: ₹{recipe.cost}</strong></div>
                                          <div className="text-xs text-gray-500">Budget tier: {recipe.budgetTier}</div>
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
                  )}

                  {/* Meal Selection and Charts - Only show after budget is entered */}
                  {weeklyBudget && familyMembers && (
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Choose Your Meal Composition</span>
                        <Button 
                          onClick={() => saveMealPlan(results.recommendations)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Save size={16} />
                          Save Meal Plan
                        </Button>
                      </CardTitle>
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
                  )}
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
                    <Label className="text-sm font-medium">Diet Type</Label>
                    <Select value={customDietType} onValueChange={setCustomDietType}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <CardTitle className="flex items-center justify-between">
                        <span>Recommended Recipes</span>
                        <Button 
                          onClick={() => saveMealPlan({ breakfast: customResults.recipes.slice(0, 3), lunch: customResults.recipes.slice(3, 6), dinner: customResults.recipes.slice(6, 9) })}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Save size={16} />
                          Save Meal Plan
                        </Button>
                      </CardTitle>
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
      )}

      <BottomNavigation />
    </div>
  );
}