import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

export const PricingCard = ({ title, price, period, description, features, btnText, featured = false, badgeText, buttonStyle = 'outline', onClick }: any) => {
  const isFeatured = featured;
  
  let btnClasses = "bg-transparent text-white border-white/20 hover:border-white/40 hover:bg-white/10";
  if (buttonStyle === 'primary') {
    btnClasses = "bg-accent-green hover:bg-accent-green/90 text-black shadow-lg shadow-accent-green/20 border-transparent";
  } else if (buttonStyle === 'outline-green') {
    btnClasses = "bg-transparent text-accent-green border-accent-green hover:bg-accent-green/10";
  }

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 100 }}
      className={`relative p-8 rounded-[2rem] flex flex-col h-full ${
        isFeatured 
        ? 'bg-gradient-to-b from-primary-dark/80 to-black/90 border border-accent-green/50 shadow-[0_0_40px_rgba(0,200,83,0.15)] z-10 lg:scale-105' 
        : 'glass-panel border-white/5'
      }`}
    >
      {badgeText && (
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 text-xs font-bold rounded-full tracking-wide shadow-lg whitespace-nowrap ${
          isFeatured ? 'bg-accent-green text-black' : 'bg-white/10 text-white border border-white/20'
        }`}>
          {badgeText}
        </div>
      )}
      
      <div className="mb-8 mt-2">
        <h3 className="text-xl font-semibold mb-2 text-gray-100">{title}</h3>
        <p className="text-sm text-gray-400 h-10">{description}</p>
        <div className="flex items-baseline gap-1 mt-4">
          <span className="text-5xl font-heading font-extrabold text-white">{price}</span>
          {period && <span className="text-gray-400 font-medium">{period}</span>}
        </div>
      </div>
      
      <ul className="space-y-5 mb-10 flex-1">
        {features.map((f: any, i: number) => (
          <li key={i} className="flex gap-4">
            {f.included ? (
              <div className="mt-1 bg-accent-green/20 rounded-full p-0.5 shrink-0 flex items-center justify-center h-6 w-6">
                <CheckCircle2 className="w-4 h-4 text-accent-green" />
              </div>
            ) : (
              <div className="mt-1 bg-white/5 rounded-full p-0.5 shrink-0 flex items-center justify-center h-6 w-6">
                <div className="w-2 h-2 rounded-full border border-white/20" />
              </div>
            )}
            <span className={`text-sm ${f.included ? 'text-gray-200' : 'text-gray-500'}`}>{f.text}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        size="lg" 
        variant={buttonStyle === 'primary' ? "default" : "outline"}
        className={`w-full h-14 rounded-xl text-md font-semibold transition-all duration-300 ${btnClasses}`}
        onClick={onClick}
      >
        {btnText}
      </Button>
    </motion.div>
  );
};
