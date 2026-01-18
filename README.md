# FoodConnect - Food Analysis & Nutrition Tracking

A React-based food analysis and nutrition tracking application with customized allergen detection and AI-powered diet recommendations.

## 🚀 Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/chv-sneha/FoodConnect-final.git
cd FoodConnect-final
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Add your Firebase credentials to `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run Development Server
```bash
npm run dev
```
The app will open at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```

## ✨ Features

- 🔍 **Customized Food Analysis** - Upload food packages and get personalized allergen warnings
- 🍎 **Diet Recommendations** - AI-powered meal planning based on your health profile
- 📊 **Nutrition Tracking** - Track calories, macros, and nutritional intake
- 🥗 **Meal Planning** - Condition-specific recipes (diabetes, PCOS, thyroid, etc.)
- 💚 **Health Insights** - Health forecasting and personalized recommendations
- 🛒 **Smart Grocery Lists** - Generate shopping lists from meal plans
- 👤 **User Profiles** - Store allergies, health conditions, and dietary preferences

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Firebase** - Authentication & Database
- **Lucide React** - Icons
- **React Query** - Data fetching
- **Wouter** - Routing

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── CustomizedAnalysisReport.tsx
│   ├── EnhancedCustomizedAnalysis.tsx
│   └── ...
├── pages/              # Page components
├── context/            # React Context (Auth, UserProfile)
├── lib/                # Utilities and helpers
├── hooks/              # Custom React hooks
└── types/              # TypeScript types
```

## 🔐 Firebase Setup

1. Create a Firebase project at [https://firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Add your Firebase config to `.env` file

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🌐 Deployment

The app can be deployed to:
- Vercel
- Netlify
- Firebase Hosting
- Any static hosting service

## 📄 License

MIT License

## 👥 Contributors

- Sneha CHV 
- M Kishore 

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
