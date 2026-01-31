import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertTriangle, Shield, CheckCircle, XCircle, Settings, User } from 'lucide-react';
import { useUserProfile } from '@/context/UserProfileContext';

interface AllergenMatch {
  allergen: string;
  ingredient: string;
  effects: string;
  severity: string;
  confidence: number;
}

interface EnhancedCustomizedAnalysisProps {
  onAnalysisComplete?: (result: any) => void;
}

export function EnhancedCustomizedAnalysis({ onAnalysisComplete }: EnhancedCustomizedAnalysisProps) {
  const { userProfile, isLoggedIn } = useUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>([]);
  const [allergenMatches, setAllergenMatches] = useState<AllergenMatch[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setAnalysisComplete(false);
      setAllergenMatches([]);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !userProfile) return;

    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('allergies', JSON.stringify([...(userProfile.allergies || []), ...(userProfile.additionalAllergens || [])]));
      formData.append('dislikedIngredients', JSON.stringify(userProfile.dislikedIngredients || []));
      formData.append('healthConditions', JSON.stringify(userProfile.healthConditions || []));
      formData.append('age', userProfile.age?.toString() || '');
      formData.append('activityLevel', userProfile.activityLevel || '');
      formData.append('healthGoal', userProfile.healthGoal || '');

      const response = await fetch('/api/analyze/customized', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success === false) {
        throw new Error(result.error || 'Analysis failed');
      }

      setOcrText(result.extracted_text || '');
      setExtractedIngredients(result.ingredientAnalysis?.map((item: any) => item.ingredient) || []);
      
      const matches = (result.personalization?.warnings || []).map((warning: string) => {
        const allergenMatch = warning.match(/Contains (\w+)/i);
        const allergen = allergenMatch ? allergenMatch[1] : 'Unknown';
        return {
          allergen,
          ingredient: allergen,
          effects: warning,
          severity: 'High',
          confidence: 0.9
        };
      });
      
      setAllergenMatches(matches);
      setAnalysisComplete(true);
      
      if (onAnalysisComplete) {
        onAnalysisComplete({
          ocrText: result.extracted_text,
          ingredients: result.ingredientAnalysis?.map((item: any) => item.ingredient) || [],
          allergenMatches: matches,
          userProfile,
          riskLevel: matches.length > 0 ? 'high' : 'safe',
          backendResult: result
        });
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (showProfileSetup) {
    return (
      <div className="space-y-4 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Setup Your Profile</h2>
          <Button variant="outline" onClick={() => setShowProfileSetup(false)}>
            Back to Analysis
          </Button>
        </div>
        <Card className="bg-white">
          <CardContent className="p-6 bg-white">
            <p className="text-center text-gray-600">Profile setup coming soon...</p>
            <Button onClick={() => setShowProfileSetup(false)} className="w-full mt-4">
              Continue with Default Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoggedIn || !userProfile) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6 text-center space-y-4 bg-white">
          <User className="mx-auto text-gray-400" size={48} />
          <div>
            <h3 className="text-lg font-semibold mb-2">Create Your Health Profile</h3>
            <p className="text-gray-600 mb-4">
              Get personalized food analysis based on your allergies, health conditions, and dietary preferences.
            </p>
            <Button onClick={() => setShowProfileSetup(true)} className="w-full">
              Setup Profile for Customized Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="flex items-center">
            <Shield className="mr-2 text-blue-600" size={20} />
            Live Profile Data
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Profile Summary</h4>
              <Button variant="outline" size="sm" onClick={() => setShowProfileSetup(true)}>
                <Settings size={16} className="mr-1" />
                Edit Profile
              </Button>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Your Allergens:</p>
              <div className="flex flex-wrap gap-2">
                {[...(userProfile.allergies || []), ...(userProfile.additionalAllergens || [])].map(allergen => (
                  <Badge key={allergen} variant="destructive" className="text-xs">
                    {allergen}
                  </Badge>
                ))}
                {(!userProfile.allergies?.length && !userProfile.additionalAllergens?.length) && (
                  <span className="text-gray-500 text-sm">No allergens specified</span>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Disliked Ingredients:</p>
              <div className="flex flex-wrap gap-2">
                {(userProfile.dislikedIngredients || []).map(ingredient => (
                  <Badge key={ingredient} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                    {ingredient}
                  </Badge>
                ))}
                {!userProfile.dislikedIngredients?.length && (
                  <span className="text-gray-500 text-sm">No disliked ingredients specified</span>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Health Conditions:</p>
              <div className="flex flex-wrap gap-2">
                {(userProfile.healthConditions || []).map(condition => (
                  <Badge key={condition} variant="secondary" className="text-xs">
                    {condition}
                  </Badge>
                ))}
                {!userProfile.healthConditions?.length && (
                  <span className="text-gray-500 text-sm">No health conditions specified</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="flex items-center">
            <Camera className="mr-2 text-green-600" size={20} />
            Upload Food Package
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {selectedImage && (
              <div className="space-y-4">
                <img 
                  src={URL.createObjectURL(selectedImage)} 
                  alt="Selected food package" 
                  className="max-w-full h-48 object-contain border rounded"
                />
                
                <Button 
                  onClick={analyzeImage} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Ingredients'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {analysisComplete && (
        <div className="space-y-4 bg-white">
          <Card className="bg-white border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle>Detected Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="flex flex-wrap gap-2">
                {extractedIngredients.map(ingredient => (
                  <Badge key={ingredient} variant="outline" className="text-xs">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {allergenMatches.length > 0 ? (
            <Card className="border-red-200 bg-white">
              <CardHeader className="bg-white">
                <CardTitle className="flex items-center text-red-800">
                  <XCircle className="mr-2 text-red-600" size={20} />
                  ⚠️ ALLERGEN ALERTS
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="space-y-4">
                  {allergenMatches.map((match, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold text-red-800">
                            Contains {match.allergen}
                          </p>
                          <p className="text-sm text-red-700">{match.effects}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-white">
              <CardHeader className="bg-white">
                <CardTitle className="flex items-center text-green-800">
                  <CheckCircle className="mr-2 text-green-600" size={20} />
                  ✅ SAFE FOR YOU
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="text-green-800 font-medium">
                      No allergens or disliked ingredients detected based on your profile.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}