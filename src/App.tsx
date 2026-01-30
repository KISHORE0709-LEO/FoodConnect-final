import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { UserProfileProvider } from "@/context/UserProfileContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/hooks/useOffline";
import { LoadingOverlay } from "@/components/ui/loading";
import { useStore } from "@/store/useStore";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Scan from "@/pages/scan";
import Generic from "@/pages/generic";
import Results from "@/pages/results";
import Profile from "@/pages/profile";
import ProfileEdit from "@/pages/profile-edit";
import DietRecommendation from "@/pages/diet-recommendation";
import Customized from "@/pages/customized";
import CustomizedRiskReport from "@/pages/customized-risk-report";
import FoodDatabase from "@/pages/food-database";
import HealthInsights from "@/pages/health-insights";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";
import SmartGroceryList from "@/components/SmartGroceryList";
import AiMealBudgetPlanner from "@/components/AiMealBudgetPlanner";
import HealingRecipes from "@/components/HealingRecipes";
import AiHealthForecast from "@/components/AiHealthForecast";
import ConsumerRights from "@/components/ConsumerRights";
import { SplineChatbot } from "@/components/SplineChatbot";
import { IntroSplash } from "@/components/IntroSplash";
import { ModernNavbar } from "@/components/ModernNavbar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/generic" component={Generic} />
      <Route path="/scan">
        <ProtectedRoute><Scan /></ProtectedRoute>
      </Route>
      <Route path="/customized" component={Customized} />
      <Route path="/customized-risk-report" component={CustomizedRiskReport} />
      <Route path="/food-database" component={FoodDatabase} />
      <Route path="/health-insights" component={HealthInsights} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/results/:id" component={Results} />
      <Route path="/history">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/profile/edit">
        <ProtectedRoute><ProfileEdit /></ProtectedRoute>
      </Route>
      <Route path="/diet-recommendation">
        <ProtectedRoute><DietRecommendation /></ProtectedRoute>
      </Route>
      <Route path="/smart-grocery-list" component={SmartGroceryList} />
      <Route path="/ai-meal-budget-planner" component={AiMealBudgetPlanner} />
      <Route path="/healing-recipes" component={HealingRecipes} />
      <Route path="/ai-health-forecast" component={AiHealthForecast} />
      <Route path="/consumer-rights" component={ConsumerRights} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isLoading } = useStore();
  const [location] = useLocation();
  const [showIntro, setShowIntro] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [previousLocation, setPreviousLocation] = useState('/');
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Pages that should use ModernNavbar instead of TopNavigation
  const modernNavbarPages = ['/', '/about', '/contact', '/food-database', '/health-insights', '/generic', '/customized', '/customized-risk-report', '/ai-meal-budget-planner', '/healing-recipes', '/ai-health-forecast', '/consumer-rights'];
  const shouldShowModernNavbar = modernNavbarPages.includes(location);

  // Major transition routes from home (excluding navbar pages)
  const majorRoutes = ['/smart-grocery-list', '/ai-meal-budget-planner', '/healing-recipes', '/ai-health-forecast'];

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowIntro(false);
      setIsFirstLoad(false);
    }
  }, []);

  useEffect(() => {
    if (!isFirstLoad && previousLocation === '/' && majorRoutes.includes(location)) {
      setShowTransition(true);
      const timer = setTimeout(() => setShowTransition(false), 2500);
      return () => clearTimeout(timer);
    }
    setPreviousLocation(location);
  }, [location, previousLocation, isFirstLoad]);

  const handleIntroComplete = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    setShowIntro(false);
    setIsFirstLoad(false);
  };

  if (showIntro && !shouldShowModernNavbar) {
    return <IntroSplash onComplete={handleIntroComplete} />;
  }

  if (showTransition && !shouldShowModernNavbar) {
    return <IntroSplash onComplete={() => {}} />;
  }
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserProfileProvider>
            <TooltipProvider>
              <div className="relative">
                <OfflineIndicator />
                <Toaster />
                {shouldShowModernNavbar && <ModernNavbar />}
                <LoadingOverlay isLoading={isLoading && !shouldShowModernNavbar} text="Loading...">
                  <Router />
                </LoadingOverlay>
                <SplineChatbot />
              </div>
            </TooltipProvider>
          </UserProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
