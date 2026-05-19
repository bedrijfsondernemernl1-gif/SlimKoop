import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] max-w-sm w-full"
        >
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
              <button 
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-white transition-colors"
                id="close-cookie-popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-accent-green/10 p-2 rounded-lg">
                <Cookie className="w-6 h-6 text-accent-green" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">Cookies</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Wij gebruiken cookies om uw ervaring te verbeteren en het verkeer te analyseren. Zie onze{' '}
                  <Link to="/privacy" className="text-accent-green hover:underline">Privacybeleid</Link>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={handleDecline}
                className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl h-10 text-sm"
                id="decline-cookies"
              >
                Weigeren
              </Button>
              <Button 
                onClick={handleAccept}
                className="flex-1 bg-accent-green text-black font-bold hover:bg-accent-green/90 rounded-xl h-10 text-sm"
                id="accept-cookies"
              >
                Accepteren
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
