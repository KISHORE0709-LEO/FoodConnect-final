import { GoogleGenerativeAI } from '@google/generative-ai';
import knowledgeBase from '../../chatbot-knowledge-base.txt?raw';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export async function getGeminiResponse(userMessage: string): Promise<string> {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return searchKnowledgeBase(userMessage);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a helpful assistant for FoodConnect, a food analysis and nutrition tracking app. 
    
    Use this knowledge base to answer questions:
    ${knowledgeBase}
    
    User question: ${userMessage}
    
    Instructions:
    - Answer based on the knowledge base above
    - Be helpful and friendly
    - If the question is about FoodConnect features, provide specific guidance
    - Keep responses concise and actionable
    - If you don't know something, suggest they contact support`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return searchKnowledgeBase(userMessage);
  }
}

function searchKnowledgeBase(query: string): string {
  const normalizedQuery = query.toLowerCase().trim();
  
  const keywords = {
    'pcos': 'FoodConnect supports PCOS with condition-specific recipes and meal planning. Use the meal planning feature to get personalized PCOS-friendly recipes.',
    'diabetes': 'FoodConnect provides diabetes-specific recipes and meal planning with personalized recommendations.',
    'thyroid': 'FoodConnect includes thyroid condition support with specialized recipes and meal planning.',
    'recipes': 'FoodConnect offers condition-specific recipes for diabetes, PCOS, thyroid, and other dietary restrictions.',
    'food analysis': 'Upload food package images to get personalized allergen warnings based on your profile.',
    'nutrition': 'Track daily calories, macronutrients, and get detailed nutritional insights with FoodConnect.',
    'features': 'FoodConnect offers food analysis, diet recommendations, nutrition tracking, meal planning, health insights, and smart grocery lists.'
  };
  
  for (const [keyword, response] of Object.entries(keywords)) {
    if (normalizedQuery.includes(keyword)) {
      return response;
    }
  }
  
  return "I'm your FoodConnect assistant! I can help you with finding recipes for health conditions, food analysis, nutrition tracking, and app features. What would you like to know?";
}