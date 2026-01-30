import knowledgeBase from '../../chatbot-knowledge-base.txt?raw';

export function searchKnowledgeBase(query: string): string {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Split knowledge base into sections
  const sections = knowledgeBase.split('===');
  
  // Search for direct Q&A matches first
  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Q:')) {
        const question = line.substring(2).toLowerCase().trim();
        const answer = lines[i + 1]?.startsWith('A:') ? lines[i + 1].substring(2).trim() : '';
        
        // Check if query matches question keywords
        const queryWords = normalizedQuery.split(' ');
        const questionWords = question.split(' ');
        const matchCount = queryWords.filter(word => questionWords.some(qWord => qWord.includes(word) || word.includes(qWord))).length;
        
        if (matchCount >= 1) {
          return answer || 'Information found but no specific answer available.';
        }
      }
    }
  }
  
  // Enhanced keyword-based search for app features
  const keywords = {
    'pcos': 'FoodConnect supports PCOS with condition-specific recipes and meal planning. Use the meal planning feature to get personalized PCOS-friendly recipes based on your health profile.',
    'pcod': 'FoodConnect supports PCOS/PCOD with condition-specific recipes and meal planning. Use the meal planning feature to get personalized PCOS-friendly recipes based on your health profile.',
    'diabetes': 'FoodConnect provides diabetes-specific recipes and meal planning. The app offers personalized recommendations based on your diabetic health profile.',
    'thyroid': 'FoodConnect includes thyroid condition support with specialized recipes and meal planning tailored to thyroid health requirements.',
    'recipes': 'FoodConnect offers condition-specific recipes for diabetes, PCOS, thyroid, and other dietary restrictions. Access them through the meal planning feature.',
    'meal': 'Use FoodConnect\'s AI-powered meal planning to get personalized recommendations based on your health profile and dietary preferences.',
    'food analysis': 'Upload food package images to get personalized allergen warnings based on your profile and health conditions.',
    'nutrition': 'Track daily calories, macronutrients (proteins, carbs, fats), and get detailed nutritional insights with FoodConnect.',
    'allergen': 'FoodConnect provides customized allergen detection by analyzing food packages against your stored allergies and health conditions.',
    'profile': 'Store your allergies, health conditions, dietary preferences, and nutritional goals in your user profile for personalized recommendations.',
    'grocery': 'Generate smart shopping lists automatically from your meal plans and dietary requirements.',
    'account': 'Create an account using Firebase Authentication with email/password. Store your health profile for personalized features.',
    'features': 'FoodConnect offers food analysis, diet recommendations, nutrition tracking, meal planning, health insights, and smart grocery lists.',
    'install': 'Clone the repository, run npm install, configure .env file with Firebase credentials, then npm run dev.',
    'setup': 'Clone the repository, run npm install, configure .env file with Firebase credentials, then npm run dev.',
    'firebase': 'Configure Firebase by creating .env file with the provided API keys and credentials.',
    'tech': 'FoodConnect uses React 18, TypeScript, Vite, Tailwind CSS, Firebase, Lucide React, React Query, and Wouter.',
    'deploy': 'Build with npm run build and deploy to Vercel, Netlify, Firebase Hosting, or any static hosting service.',
    'error': 'Check Node.js installation, run npm install, and verify .env file configuration with Firebase credentials.',
    'port': 'If port 5173 is in use, kill the process or use --port flag for a different port.',
    'build': 'Check for TypeScript errors, ensure all dependencies are installed, and verify .env file format.'
  };
  
  // Search for keyword matches
  for (const [keyword, response] of Object.entries(keywords)) {
    if (normalizedQuery.includes(keyword)) {
      return response;
    }
  }
  
  // Default response
  return "I'm your FoodConnect assistant! I can help you with:\n\n• Finding PCOS/diabetes/thyroid recipes\n• Food analysis and allergen detection\n• Nutrition tracking and meal planning\n• App setup and troubleshooting\n• Account creation and profile setup\n\nWhat would you like to know?";
}