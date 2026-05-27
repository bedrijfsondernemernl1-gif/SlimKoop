import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const DevBanner: React.FC = () => {
  const location = useLocation();
  
  if (location.pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-11 bg-gradient-to-r from-accent-green/20 via-primary-dark/40 to-indigo-500/20 md:to-indigo-500/10 border-b border-white/5 backdrop-blur-md flex items-center justify-center px-4 text-xs md:text-sm text-gray-200">
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green"></span>
        </span>
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-accent-green shrink-0" />
          <span>
            <strong>OccasionScan is in actieve ontwikkeling.</strong> Er worden momenteel continu nieuwe updates en slimme functies toegevoegd!
          </span>
        </div>
      </div>
    </div>
  );
};

