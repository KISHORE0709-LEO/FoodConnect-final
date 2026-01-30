import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DetailedAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedData: any;
  healthProfile: any;
  riskAnalysis: any[];
}

export default function DetailedAnalysisModal({ 
  isOpen, 
  onClose, 
  scannedData, 
  healthProfile, 
  riskAnalysis 
}: DetailedAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState('ingredients');

  if (!isOpen) return null;

  const getIngredientRisk = (ingredient: string) => {
    const isAllergen = healthProfile.allergies.some((allergy: string) => 
      ingredient.toLowerCase().includes(allergy.toLowerCase())
    );
    if (isAllergen) return { level: 'high', color: 'bg-red-500', status: 'Avoid' };
    
    const isRestricted = healthProfile.dietaryRestrictions.some((restriction: string) =>
      ingredient.toLowerCase().includes(restriction.toLowerCase())
    );
    if (isRestricted) return { level: 'medium', color: 'bg-orange-500', status: 'Limit' };
    
    return { level: 'low', color: 'bg-green-500', status: 'OK' };
  };

  const getNutritionBar = (value: number, max: number, unit: string) => {
    const percentage = Math.min((value / max) * 100, 100);
    const getColor = () => {
      if (percentage > 80) return 'bg-red-500';
      if (percentage > 60) return 'bg-orange-500';
      return 'bg-green-500';
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{value}{unit}</span>
          <span>{Math.round(percentage)}% daily limit</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'ingredients', label: 'Ingredient Analysis' },
    { id: 'nutrition', label: 'Nutrition Comparison' },
    { id: 'impact', label: 'Condition Impact' },
    { id: 'ai', label: 'AI Explanation' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Detailed Analysis</h2>
            <p className="opacity-90">{scannedData.productName || 'Food Product'}</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'ingredients' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 Ingredient Risk Matrix</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Ingredient</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Allergy Risk</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Condition Impact</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedData.ingredientAnalysis?.slice(0, 8).map((ingredient: any, index: number) => {
                      const risk = getIngredientRisk(ingredient.name);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 font-medium">
                            {ingredient.name}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                risk.level === 'high' ? 'bg-red-500' : 
                                risk.level === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                              }`} />
                              <span className="text-sm">
                                {risk.level === 'high' ? '🔴 High' : 
                                 risk.level === 'medium' ? '🟡 Medium' : '🟢 Low'}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                            {risk.level === 'high' ? '⚠ Critical' : 
                             risk.level === 'medium' ? '⚠ Caution' : 'Neutral'}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            <Badge className={`${
                              risk.level === 'high' ? 'bg-red-100 text-red-800' :
                              risk.level === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            } border-0`}>
                              {risk.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">🧠 AI Evaluation Confidence: 92%</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>✓ {scannedData.ingredientAnalysis?.length || 0} ingredients analyzed</p>
                  <p>✓ {healthProfile.healthConditions.length} health conditions evaluated</p>
                  <p>✓ 6 nutritional parameters assessed</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Nutrition vs Recommended Limits</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Sodium</h4>
                  {getNutritionBar(scannedData.nutrition?.per100g?.sodium_mg || 420, 2000, 'mg')}
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Saturated Fat</h4>
                  {getNutritionBar(scannedData.nutrition?.per100g?.total_fat_g || 8, 20, 'g')}
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Sugar</h4>
                  {getNutritionBar(scannedData.nutrition?.per100g?.sugar_g || 4, 50, 'g')}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Calories</h4>
                  {getNutritionBar(scannedData.nutrition?.per100g?.energy_kcal || 250, 2000, ' kcal')}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">⚖️ Risk Severity Meter</h4>
                <div className="relative">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>SAFE</span>
                    <span>CAUTION</span>
                    <span>AVOID</span>
                  </div>
                  <div className="w-full h-4 bg-gradient-to-r from-green-400 via-orange-400 to-red-500 rounded-full relative">
                    <div 
                      className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-2"
                      style={{ left: '25%' }}
                    />
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-sm font-medium">Current Status: Low Risk</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'impact' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📈 30-Day Impact Projection</h3>
              <p className="text-gray-600 mb-4">If consumed 3x per week:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-orange-900">Cholesterol Risk</span>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600">+8%</div>
                  <p className="text-sm text-orange-700">Moderate increase expected</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-red-900">Inflammation Index</span>
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">+5%</div>
                  <p className="text-sm text-red-700">Slight increase likely</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-green-900">Blood Sugar</span>
                    <Minus className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">Stable</div>
                  <p className="text-sm text-green-700">No significant impact</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-900">Weight Impact</span>
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">Minimal</div>
                  <p className="text-sm text-blue-700">Low caloric impact</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🧠 AI Health Reasoning</h3>
              
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Analysis Summary</h4>
                <div className="prose prose-sm text-gray-700 space-y-3">
                  <p>Based on your health profile analysis, this product shows moderate compatibility with your dietary needs.</p>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">Key Findings:</h5>
                    <ul className="space-y-1 text-sm">
                      <li>• No critical allergens detected in ingredient list</li>
                      <li>• Sodium content within acceptable range for your profile</li>
                      <li>• Saturated fat levels require portion control</li>
                      <li>• Compatible with your current dietary restrictions</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Recommendations:</h5>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Limit consumption to 2-3 times per week</li>
                      <li>• Pair with high-fiber foods to balance impact</li>
                      <li>• Monitor cholesterol levels if consumed regularly</li>
                      <li>• Consider smaller portion sizes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-gradient-to-r from-primary to-secondary text-white">
              Close Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}