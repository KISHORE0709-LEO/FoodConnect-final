import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sun, Utensils, Heart, Moon, Clock, Users, ChefHat, Play } from "lucide-react";

interface Recipe {
  name: string;
  ingredients: string[];
  benefits: string;
  cookTime: string;
  calories: number;
}

interface MealPlan {
  morning: Recipe[];
  afternoon: Recipe[];
  evening: Recipe[];
  night: Recipe[];
}

interface HealingMealPlanProps {
  condition: string;
  onBack: () => void;
}

const conditionNames: Record<string, string> = {
  diabetes: "Diabetes",
  pcos: "PCOS",
  thyroid: "Thyroid",
  anemia: "Anemia",
  weight_loss: "Weight Loss",
  heart_health: "Heart Health"
};

const HealingMealPlan = ({ condition, onBack }: HealingMealPlanProps) => {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("morning");
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

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

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const csvFiles = {
          'pcos': '/pcos_recipes_routine.csv',
          'diabetes': '/diabetes_recipes.csv',
          'thyroid': '/thyroid_recipes.csv',
          'anemia': '/anemia_recipes.csv',
          'weight_loss': '/weight_loss_recipes.csv',
          'heart_health': '/heart_health_recipes.csv'
        };
        
        if (csvFiles[condition]) {
          const response = await fetch(csvFiles[condition]);
          const csvText = await response.text();
          const recipes = parseCSV(csvText);
          
          const groupedRecipes = {
            morning: recipes.filter(r => r.best_time_of_day === 'morning'),
            afternoon: recipes.filter(r => r.best_time_of_day === 'afternoon'),
            evening: recipes.filter(r => r.best_time_of_day === 'evening'),
            night: recipes.filter(r => r.best_time_of_day === 'night')
          };
          
          setMealPlan(groupedRecipes);
        } else {
          const response = await fetch('/healing-recipes.json');
          const data = await response.json();
          setMealPlan(data[condition] || null);
        }
      } catch (error) {
        console.error('Error fetching meal plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlan();
  }, [condition]);
  
  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      // Proper CSV parsing to handle commas inside quotes
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
        recipe[header] = values[index]?.replace(/^"|"$/g, '') || '';
      });
      
      return {
        ...recipe,
        name: recipe.recipe_name,
        cookTime: `${recipe.prep_time_min} min`,
        calories: parseInt(recipe.energy_kcal) || 0,
        best_time_of_day: recipe.best_time_of_day
      };
    }).filter(recipe => recipe.name && recipe.best_time_of_day);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized meal plan...</p>
        </div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load meal plan</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleRecipeClick = (recipe: any) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const renderRecipeCards = (recipes: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {recipes.map((recipe, index) => (
        <Card 
          key={index} 
          className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-0"
          onClick={() => handleRecipeClick(recipe)}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2 break-words overflow-hidden text-ellipsis" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '3.5rem'}}>{recipe.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{recipe.cookTime}</p>
            <Badge className="bg-green-100 text-green-800">
              {recipe.calories} cal
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Conditions
          </Button>
          <h1 className="text-2xl font-bold text-center flex-1 text-gray-900">{conditionNames[condition]} Daily Tracker</h1>
          <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {[
            { key: "morning", label: "Morning", icon: Sun },
            { key: "afternoon", label: "Afternoon", icon: Utensils },
            { key: "evening", label: "Evening", icon: Heart },
            { key: "night", label: "Night", icon: Moon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === "morning" && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sun className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Good Morning Routine</h2>
              </div>
              


              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Today's Morning Recipes</h3>
                {renderRecipeCards(mealPlan.morning)}
              </div>
            </div>
          )}

          {activeTab === "afternoon" && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Utensils className="h-6 w-6 text-secondary" />
                <h2 className="text-xl font-semibold">Afternoon Nourishment</h2>
              </div>
              {renderRecipeCards(mealPlan.afternoon)}
            </div>
          )}

          {activeTab === "evening" && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Heart className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Evening Wellness</h2>
              </div>
              {renderRecipeCards(mealPlan.evening)}
            </div>
          )}

          {activeTab === "night" && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Moon className="h-6 w-6 text-secondary" />
                <h2 className="text-xl font-semibold">Night Time Healing</h2>
              </div>
              {renderRecipeCards(mealPlan.night)}
            </div>
          )}
        </div>
        
        {/* Recipe Detail Modal */}
        {showRecipeModal && selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">{selectedRecipe.name}</h2>
                <button 
                  onClick={() => setShowRecipeModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* YouTube Video Section */}
                  {selectedRecipe.name && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Play size={16} className="text-red-600 mr-2" />
                        <h3 className="font-semibold text-gray-800">How to Make {selectedRecipe.name}</h3>
                      </div>
                      <YouTubeEmbed searchQuery={selectedRecipe.name} title={`How to make ${selectedRecipe.name}`} />
                    </div>
                  )}
                  
                  {/* Recipe Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-sm font-medium">{selectedRecipe.prep_time_min} min</p>
                      <p className="text-xs text-gray-600">Prep Time</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <Users className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <p className="text-sm font-medium">{selectedRecipe.servings || 1}</p>
                      <p className="text-xs text-gray-600">Servings</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <span className="text-lg mx-auto mb-1 block">🔥</span>
                      <p className="text-sm font-medium">{selectedRecipe.energy_kcal || 0}</p>
                      <p className="text-xs text-gray-600">Calories</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <span className="text-lg mx-auto mb-1 block">🥗</span>
                      <p className="text-sm font-medium capitalize">{selectedRecipe.meal_type}</p>
                      <p className="text-xs text-gray-600">Type</p>
                    </div>
                  </div>
                  
                  {/* Nutrition Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 text-gray-800">Nutrition Facts</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{selectedRecipe.protein_g || 0}g</p>
                        <p className="text-xs text-gray-600">Protein</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{selectedRecipe.carbs_g || 0}g</p>
                        <p className="text-xs text-gray-600">Carbs</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-orange-600">{selectedRecipe.fat_g || 0}g</p>
                        <p className="text-xs text-gray-600">Fat</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ingredients */}
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">Ingredients</h3>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-sm leading-relaxed text-gray-700">
                        {selectedRecipe.ingredients_raw?.split(',').map((ingredient: string, i: number) => (
                          <div key={i} className="mb-1">
                            • {ingredient.trim()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Cooking Method */}
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">Cooking Method</h3>
                    <Badge className="bg-blue-100 text-blue-800 px-3 py-1 capitalize">
                      {selectedRecipe.cooking_method?.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {/* Health Benefits */}
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">Health Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecipe.high_protein === '1' && (
                        <Badge className="bg-green-100 text-green-800">High Protein</Badge>
                      )}
                      {selectedRecipe.low_oil === '1' && (
                        <Badge className="bg-blue-100 text-blue-800">Low Oil</Badge>
                      )}
                      {selectedRecipe.low_sugar === '1' && (
                        <Badge className="bg-purple-100 text-purple-800">Low Sugar</Badge>
                      )}
                      <Badge className="bg-pink-100 text-pink-800">PCOS Friendly</Badge>
                      <Badge className="bg-yellow-100 text-yellow-800 capitalize">{selectedRecipe.veg_nonveg}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealingMealPlan;