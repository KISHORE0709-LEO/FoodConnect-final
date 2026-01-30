import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generatePersonalizedAlerts } from '@/lib/allergen-detector';
import { useAuth } from '@/context/AuthContext';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Volume2, 
  Globe, 
  Lightbulb,
  BarChart3,
  RefreshCw,
  Flag,
  Heart,
  Shield,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { analyzeToxicity, getToxicityScoreColor, getToxicityScoreLabel, ToxicityAnalysis } from '@/lib/toxicity-analyzer';
import { translateText, speakAnalysisResults, SUPPORTED_LANGUAGES } from '@/lib/language-support';
import { ComprehensiveAnalysisReport } from './ComprehensiveAnalysisReport';

interface EnhancedAnalysisResultsProps {
  product: {
    id: number;
    productName: string;
    ingredients: string[];
    analysis: {
      harmfulIngredients: Array<{
        name: string;
        riskLevel: string;
        concerns: string[];
      }>;
      personalizedWarnings: string[];
      nutritionalConcerns: string[];
      sugarLevel: string;
      saltLevel: string;
      allergenWarnings: string[];
    };
    safetyScore: string;
    toxicityAnalysis?: ToxicityAnalysis;
    comprehensiveAnalysis?: any;
  };
  userAllergies?: string[];
  userConditions?: string[];
}

export function EnhancedAnalysisResults({ 
  product, 
  userAllergies = [], 
  userConditions = [] 
}: EnhancedAnalysisResultsProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const { user } = useAuth();

  // Calculate or use existing toxicity analysis
  const toxicityAnalysis = product.toxicityAnalysis || analyzeToxicity(product.ingredients);
  
  // Generate personalized alerts based on user profile
  const personalizedAlerts = generatePersonalizedAlerts(
    product.ingredients || [],
    user?.allergies || userAllergies,
    user?.healthConditions || userConditions
  );

  const getSafetyColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'red': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSafetyIcon = (score: string) => {
    switch (score.toLowerCase()) {
      case 'green': return <CheckCircle className="w-6 h-6" />;
      case 'orange': return <AlertTriangle className="w-6 h-6" />;
      case 'red': return <XCircle className="w-6 h-6" />;
      default: return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const handleVoiceSummary = () => {
    speakAnalysisResults({
      safetyScore: product.safetyScore,
      personalizedWarnings: product.analysis.personalizedWarnings,
      recommendations: toxicityAnalysis.recommendations,
    }, selectedLanguage);
  };

  const handleCommunityReport = async () => {
    setIsReporting(true);
    // Simulate API call for community reporting
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('Product reported to community. Thank you for helping keep others safe!');
    setIsReporting(false);
  };

  const findAlternatives = () => {
    setShowSubstitutes(!showSubstitutes);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Analysis Type Tabs */}
      <Tabs defaultValue="quick" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Quick Analysis
          </TabsTrigger>
          <TabsTrigger value="comprehensive" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            ChatGPT-Level Report
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="quick" className="space-y-6 mt-6">
      {/* Language and Voice Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-primary" />
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SUPPORTED_LANGUAGES.filter(lang => lang.enabled).map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleVoiceSummary}
          className="flex items-center gap-2"
        >
          <Volume2 className="w-4 h-4" />
          {translateText('hearSummary', selectedLanguage) || 'Hear Summary'}
        </Button>
      </div>

      {/* Overall Safety Score */}
      <Card className={`border-2 ${getSafetyColor(product.safetyScore)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getSafetyIcon(product.safetyScore)}
            <span>Overall Safety: {product.safetyScore}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Toxicity Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Toxicity Analysis
              </h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Toxicity</span>
                    <span className={getToxicityScoreColor(toxicityAnalysis.overallScore)}>
                      {toxicityAnalysis.overallScore}/100
                    </span>
                  </div>
                  <Progress value={toxicityAnalysis.overallScore} className="h-2" />
                  <p className={`text-xs mt-1 ${getToxicityScoreColor(toxicityAnalysis.overallScore)}`}>
                    {getToxicityScoreLabel(toxicityAnalysis.overallScore)}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Chemical Load</span>
                    <span className={getToxicityScoreColor(toxicityAnalysis.chemicalLoad)}>
                      {toxicityAnalysis.chemicalLoad}/100
                    </span>
                  </div>
                  <Progress value={toxicityAnalysis.chemicalLoad} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sugar Content</span>
                    <span className={getToxicityScoreColor(toxicityAnalysis.sugarContent)}>
                      {toxicityAnalysis.sugarContent}/100
                    </span>
                  </div>
                  <Progress value={toxicityAnalysis.sugarContent} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Salt Content</span>
                    <span className={getToxicityScoreColor(toxicityAnalysis.saltContent)}>
                      {toxicityAnalysis.saltContent}/100
                    </span>
                  </div>
                  <Progress value={toxicityAnalysis.saltContent} className="h-2" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <h4 className="font-semibold">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {toxicityAnalysis.additiveCount}
                  </div>
                  <div className="text-sm text-gray-600">Additives</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {toxicityAnalysis.preservativeCount}
                  </div>
                  <div className="text-sm text-gray-600">Preservatives</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {product.ingredients ? product.ingredients.length : 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Ingredients</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.max(0, (product.ingredients ? product.ingredients.length : 0) - (toxicityAnalysis.harmfulIngredients ? toxicityAnalysis.harmfulIngredients.length : 0))}
                  </div>
                  <div className="text-sm text-gray-600">Safe Ingredients</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Warnings */}
      {personalizedAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-6 h-6" />
              🚨 Personal Health Alerts ({personalizedAlerts.length})
            </CardTitle>
            <p className="text-red-600 mt-2">
              Critical alerts based on your health profile. Please review carefully.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personalizedAlerts.map((alert, index) => (
                <div key={index} className={`flex items-start gap-3 p-4 rounded-lg border-l-4 ${
                  alert.severity === 'high' ? 'bg-red-100 border-red-500' :
                  alert.severity === 'medium' ? 'bg-orange-100 border-orange-500' :
                  'bg-yellow-100 border-yellow-500'
                }`}>
                  <div className={`p-1 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-200' :
                    alert.severity === 'medium' ? 'bg-orange-200' :
                    'bg-yellow-200'
                  }`}>
                    {alert.type === 'allergen' ? (
                      <XCircle className={`w-5 h-5 ${
                        alert.severity === 'high' ? 'text-red-700' :
                        alert.severity === 'medium' ? 'text-orange-700' :
                        'text-yellow-700'
                      }`} />
                    ) : (
                      <Heart className={`w-5 h-5 ${
                        alert.severity === 'high' ? 'text-red-700' :
                        alert.severity === 'medium' ? 'text-orange-700' :
                        'text-yellow-700'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className={`font-bold text-sm ${
                      alert.severity === 'high' ? 'text-red-900' :
                      alert.severity === 'medium' ? 'text-orange-900' :
                      'text-yellow-900'
                    }`}>
                      {alert.title}
                    </h5>
                    <p className={`text-sm mt-1 ${
                      alert.severity === 'high' ? 'text-red-800' :
                      alert.severity === 'medium' ? 'text-orange-800' :
                      'text-yellow-800'
                    }`}>
                      {alert.message}
                    </p>
                    {alert.severity === 'high' && (
                      <div className="mt-2 p-2 bg-red-200 rounded text-xs font-semibold text-red-900">
                        ⚠️ AVOID: Do not consume this product
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Harmful Ingredients */}
      {toxicityAnalysis.harmfulIngredients && toxicityAnalysis.harmfulIngredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              Ingredients of Concern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {(toxicityAnalysis.harmfulIngredients || []).map((ingredient, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{ingredient}</span>
                  </div>
                  <Badge variant="destructive">High Risk</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations & Substitutes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Health Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(toxicityAnalysis.recommendations || []).map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Heart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-blue-800">{recommendation}</span>
              </div>
            ))}
            
            <div className="flex gap-3 pt-4">
              <Button onClick={findAlternatives} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {showSubstitutes ? 'Hide' : 'Show'} Healthier Alternatives
              </Button>
              
              <Button 
                onClick={handleCommunityReport}
                variant="outline"
                disabled={isReporting}
                className="flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                {isReporting ? 'Reporting...' : 'Report to Community'}
              </Button>
            </div>

            {showSubstitutes && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-800 mb-2">Healthier Product Alternatives:</h5>
                <ul className="space-y-1 text-green-700">
                  <li>• Look for products with organic certification</li>
                  <li>• Choose items with fewer than 5 ingredients</li>
                  <li>• Avoid products with artificial colors and preservatives</li>
                  <li>• Consider local/traditional alternatives</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {toxicityAnalysis.riskFactors && toxicityAnalysis.riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Potential Health Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Array.from(new Set(toxicityAnalysis.riskFactors || [])).map((risk, index) => (
                <div key={index} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-red-700">{risk}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>
        
        <TabsContent value="comprehensive" className="mt-6">
          {product.comprehensiveAnalysis ? (
            <ComprehensiveAnalysisReport analysis={product.comprehensiveAnalysis} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Comprehensive Analysis Not Available
                </h3>
                <p className="text-gray-500">
                  This product was analyzed with the basic engine. 
                  Re-scan for ChatGPT-level comprehensive analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}