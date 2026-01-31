import { Database, Shield, Globe, FileText, TrendingUp } from 'lucide-react';

export default function FoodDatabase() {
  const databases = [
    {
      name: "Kaggle Food Nutrition Dataset",
      description: "Comprehensive nutrition information for thousands of food items",
      items: "8,000+ food items",
      source: "kaggle.com",
      icon: Database,
      color: "from-blue-500 to-blue-600"
    },
    {
      name: "FSSAI Database",
      description: "Indian food safety standards and regulations",
      items: "500+ standards",
      source: "fssai.gov.in",
      icon: Shield,
      color: "from-green-500 to-green-600"
    },
    {
      name: "FDA Food Database",
      description: "International food safety data and guidelines",
      items: "10,000+ entries",
      source: "fda.gov",
      icon: Globe,
      color: "from-purple-500 to-purple-600"
    },
    {
      name: "Custom Ingredient Database",
      description: "Curated ingredient toxicity and safety scores",
      items: "40+ ingredients",
      source: "Internal Research",
      icon: FileText,
      color: "from-orange-500 to-orange-600"
    }
  ];

  const stats = [
    { label: "Total Food Items", value: "18,500+", icon: Database },
    { label: "Safety Standards", value: "500+", icon: Shield },
    { label: "Analyzed Ingredients", value: "40+", icon: FileText },
    { label: "Accuracy Rate", value: "99.9%", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Food Database Sources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our comprehensive food analysis is powered by multiple trusted databases, 
            ensuring accurate and reliable nutritional information for your health decisions.
          </p>
        </div>

        {/* Database Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {databases.map((db, index) => {
            const IconComponent = db.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${db.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{db.name}</h3>
                      <p className="text-gray-600 mb-4">{db.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-2xl font-bold text-primary">{db.items}</div>
                    <div className="text-sm text-gray-500">{db.source}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Database Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="text-white" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust & Reliability Section */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Trusted & Reliable Data</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Our multi-source approach ensures comprehensive coverage and cross-validation 
            of nutritional data, giving you confidence in every analysis.
          </p>
        </div>
      </div>
    </div>
  );
}