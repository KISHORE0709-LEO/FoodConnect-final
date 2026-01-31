import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Shield, Brain, Target, Users, Award } from 'lucide-react';
import { ModernNavbar } from '@/components/ModernNavbar';

export default function About() {
  const features = [
    {
      icon: <Zap className="text-yellow-600" size={32} />,
      title: 'Instant Analysis',
      description: 'Real-time food safety analysis using advanced OCR and ML algorithms'
    },
    {
      icon: <Shield className="text-green-600" size={32} />,
      title: 'FSSAI Verification',
      description: 'Automated verification of food safety licenses and compliance'
    },
    {
      icon: <Brain className="text-purple-600" size={32} />,
      title: 'AI-Powered Insights',
      description: 'Machine learning models for personalized health recommendations'
    },
    {
      icon: <Target className="text-red-600" size={32} />,
      title: 'Personalized Analysis',
      description: 'Custom health profiles with allergen detection and dietary preferences'
    }
  ];

  const workflow = [
    {
      step: '1',
      title: 'Image Capture',
      description: 'Users scan food packaging using their device camera'
    },
    {
      step: '2',
      title: 'OCR Processing',
      description: 'Advanced OCR extracts text from ingredient labels and nutrition facts'
    },
    {
      step: '3',
      title: 'ML Analysis',
      description: 'Multiple machine learning models analyze ingredients for safety and nutrition'
    },
    {
      step: '4',
      title: 'FSSAI Verification',
      description: 'Automated verification of food safety licenses and compliance standards'
    },
    {
      step: '5',
      title: 'Personalized Results',
      description: 'Customized health insights based on user profile and dietary requirements'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar />
      
      <div className="pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              About FoodConnect
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              FoodConnect is an intelligent food safety analysis platform that combines computer vision, 
              natural language processing, and machine learning to provide personalized health insights 
              and safety ratings for food products.
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="mb-12 bg-gradient-to-r from-blue-50 to-green-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                To empower consumers with intelligent food analysis tools that promote healthier eating habits, 
                ensure food safety compliance, and provide personalized nutrition guidance through cutting-edge AI technology.
              </p>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border rounded-lg">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">1</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan</h3>
                <p className="text-gray-600">Take a photo of food packaging</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">2</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze</h3>
                <p className="text-gray-600">AI reads ingredients and nutrition</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">3</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Insights</h3>
                <p className="text-gray-600">Receive personalized recommendations</p>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}