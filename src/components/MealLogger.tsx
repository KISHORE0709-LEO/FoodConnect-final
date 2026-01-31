import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Recipe {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
}

interface MealLoggerProps {
  availableRecipes: Recipe[];
  onLogSaved?: (log: any) => void;
}

export const MealLogger = ({ availableRecipes, onLogSaved }: MealLoggerProps) => {
  const { user } = useAuth();
  const [selectedMeals, setSelectedMeals] = useState<{
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
  }>({});
  const [saving, setSaving] = useState(false);

  const selectMeal = (mealType: 'breakfast' | 'lunch' | 'dinner', recipe: Recipe) => {
    setSelectedMeals(prev => ({
      ...prev,
      [mealType]: recipe
    }));
  };

  const saveMealLog = async () => {
    if (!user) return alert('Login required');
    if (!selectedMeals.breakfast || !selectedMeals.lunch || !selectedMeals.dinner) return alert('Select all 3 meals');
    
    setSaving(true);
    try {
      const data = {
        userId: user.uid,
        date: new Date().toISOString().split('T')[0],
        breakfast: selectedMeals.breakfast.name,
        lunch: selectedMeals.lunch.name,
        dinner: selectedMeals.dinner.name,
        totalCalories: (selectedMeals.breakfast.calories + selectedMeals.lunch.calories + selectedMeals.dinner.calories),
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'mealLogs'), data);
      alert('✅ Saved to Firebase!');
      onLogSaved?.(data);
    } catch (error) {
      console.error(error);
      alert('❌ Save failed');
    } finally {
      setSaving(false);
    }
  };

  const getMealsByType = (type: 'breakfast' | 'lunch' | 'dinner') => {
    return availableRecipes.filter(recipe => recipe.meal_type === type);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Meal Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Breakfast */}
            <div>
              <h3 className="font-semibold mb-3">Breakfast</h3>
              {selectedMeals.breakfast ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <p className="font-medium">{selectedMeals.breakfast.name}</p>
                    <p className="text-sm text-gray-600">{selectedMeals.breakfast.calories} cal</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {getMealsByType('breakfast').slice(0, 3).map((recipe, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => selectMeal('breakfast', recipe)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {recipe.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Lunch */}
            <div>
              <h3 className="font-semibold mb-3">Lunch</h3>
              {selectedMeals.lunch ? (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <p className="font-medium">{selectedMeals.lunch.name}</p>
                    <p className="text-sm text-gray-600">{selectedMeals.lunch.calories} cal</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {getMealsByType('lunch').slice(0, 3).map((recipe, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => selectMeal('lunch', recipe)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {recipe.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Dinner */}
            <div>
              <h3 className="font-semibold mb-3">Dinner</h3>
              {selectedMeals.dinner ? (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-3">
                    <p className="font-medium">{selectedMeals.dinner.name}</p>
                    <p className="text-sm text-gray-600">{selectedMeals.dinner.calories} cal</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {getMealsByType('dinner').slice(0, 3).map((recipe, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => selectMeal('dinner', recipe)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {recipe.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={saveMealLog} 
            disabled={saving}
            className="w-full mt-4"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Meal Plan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};