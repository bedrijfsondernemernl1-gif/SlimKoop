import React from 'react';
import { motion } from 'motion/react';
import { Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaywallOverlayProps {
  title: string;
  description: string;
}

export const PaywallOverlay: React.FC<PaywallOverlayProps> = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <div id="paywall-overlay" className="absolute inset-0 z-10 flex items-center justify-center p-6 rounded-xl overflow-hidden">
      {/* Blurred background content is assumed to be underneath */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 max-w-sm w-full bg-surface border border-white/10 p-8 rounded-2xl shadow-2xl text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-blue/10 mb-6">
          <Lock className="w-8 h-8 text-accent-blue" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-8">
          {description}
        </p>
        
        <button
          onClick={() => navigate('/prijzen')}
          className="w-full py-3 px-6 bg-accent-blue text-white font-semibold rounded-xl hover:bg-accent-blue/90 transition-colors flex items-center justify-center gap-2 group"
        >
          <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
          Upgrade naar Premium
        </button>
        
        <p className="mt-4 text-xs text-white/40">
          Krijg onbeperkt toegang tot al je rapporten en meer.
        </p>
      </motion.div>
    </div>
  );
};
