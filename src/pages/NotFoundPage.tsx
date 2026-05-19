import React from 'react';
import { motion } from 'motion/react';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-lg opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-accent-green/20 blur-[120px] rounded-full animate-pulse"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-8">
          <AlertCircle className="w-10 h-10 text-accent-green" />
        </div>
        
        <h1 className="text-8xl md:text-9xl font-black text-white mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Pagina niet gevonden</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
          De pagina waar u naar zoekt bestaat niet of is verplaatst. Keer terug naar de homepagina om verder te gaan.
        </p>

        <Link to="/">
          <Button 
            className="bg-accent-green text-black font-bold h-12 px-8 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,102,0.3)] transition-all"
            id="back-to-home-404"
          >
            <Home className="w-5 h-5 mr-2" />
            Terug naar Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
