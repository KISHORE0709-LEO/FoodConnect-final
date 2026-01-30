import { BottomNavigation } from '@/components/navigation';
import { ModernNavbar } from '@/components/ModernNavbar';
import GenericAnalysis from '@/components/GenericAnalysis';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wifi, WifiOff, UserCheck } from 'lucide-react';
import { Link } from 'wouter';
import { useOffline } from '@/hooks/useOffline';
import { useEffect, useState } from 'react';

export default function Generic() {
  const isOffline = useOffline();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-red-500 text-white text-center py-2 px-4 flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span className="text-sm">You're offline. Some features may not work.</span>
        </div>
      )}
      
      {/* Online Indicator */}
      {!isOffline && (
        <div className="bg-green-500 text-white text-center py-1 px-4 flex items-center justify-center gap-2">
          <Wifi size={14} />
          <span className="text-xs">Connected • Real-time analysis available</span>
        </div>
      )}
      
      <ModernNavbar />
      
      <section className="pt-32 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button and Customize Button */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft size={16} />
                <span>Back to Home</span>
              </Button>
            </Link>
            
            {/* Customize Button - Top Right */}
            {typeof window !== 'undefined' && (
              <CustomizeButton />
            )}
          </div>

          <GenericAnalysis />
        </div>
      </section>

      <BottomNavigation />
    </div>
  );
}

function CustomizeButton() {
  const [hasLast, setHasLast] = useState(false);

  useEffect(() => {
    const checkData = () => {
      try {
        const raw = localStorage.getItem('lastScannedFood');
        if (!raw) {
          setHasLast(false);
          return;
        }
        const parsed = JSON.parse(raw);
        // More strict validation - must have actual analysis data
        const hasValidAnalysis = parsed && 
          parsed.success === true && 
          (parsed.ingredientAnalysis?.length > 0 || 
           parsed.nutrition?.per100g || 
           parsed.ocrData?.nutrition_facts);
        setHasLast(!!hasValidAnalysis);
      } catch (e) {
        setHasLast(false);
      }
    };
    
    checkData();
    // Listen for storage changes to update button visibility
    window.addEventListener('storage', checkData);
    // Also check periodically in case data was updated in same tab
    const interval = setInterval(checkData, 1000);
    
    return () => {
      window.removeEventListener('storage', checkData);
      clearInterval(interval);
    };
  }, []);

  if (!hasLast) return null;

  return (
    <Button 
      onClick={() => window.location.href = '/customized?from=generic'}
      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <UserCheck className="w-5 h-5" />
      <span className="font-medium">View Customized Risk Report</span>
    </Button>
  );
}