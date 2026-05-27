import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export const PricingCard = ({ title, price, period, description, features, btnText, featured = false, badgeText, buttonStyle = 'outline', onClick, isDealer = false, disabled = false }: any) => {
  const isFeatured = featured;
  
  let btnClasses = "bg-transparent text-white border-white/20 hover:border-white/40 hover:bg-white/10";
  if (buttonStyle === 'primary') {
    btnClasses = "bg-accent-green hover:bg-accent-green/90 text-black shadow-lg shadow-accent-green/20 border-transparent";
  } else if (buttonStyle === 'outline-green') {
    btnClasses = "bg-transparent text-accent-green border-accent-green hover:bg-accent-green/10";
  } else if (buttonStyle === 'dealer-premium') {
    btnClasses = "bg-gradient-to-r from-accent-green to-emerald-500 hover:opacity-95 active:scale-98 text-black font-bold shadow-[0_4px_20px_rgba(0,200,83,0.15)] border-transparent transition-all duration-350";
  }

  if (disabled) {
    if (buttonStyle === 'dealer-premium' || buttonStyle === 'primary') {
      btnClasses = "bg-gray-800 text-gray-500 border-transparent cursor-not-allowed opacity-60";
    } else {
      btnClasses = "bg-transparent text-gray-500 border-gray-800 cursor-not-allowed opacity-60";
    }
  }

  return (
    <motion.div 
      whileHover={disabled ? {} : { y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className={`relative p-6 sm:p-8 rounded-[2rem] flex flex-col h-full transition-all duration-300 ${
        isDealer
        ? 'bg-gradient-to-b from-[#01140A] via-primary-dark/95 to-black/95 border-2 border-accent-green/30 shadow-[0_0_30px_rgba(0,200,83,0.05)] z-10 lg:scale-[1.02]'
        : isFeatured 
          ? 'bg-gradient-to-b from-primary-dark/80 to-black/90 border border-accent-green/40 shadow-[0_0_20px_rgba(0,200,83,0.08)] z-10 lg:scale-[1.01]' 
          : 'glass-panel border-white/5 bg-black/40'
      }`}
    >
      {badgeText && (
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[11px] font-extrabold rounded-full tracking-wider shadow-lg whitespace-nowrap flex items-center gap-1.5 border ${
          isDealer 
          ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 border-transparent uppercase'
          : isFeatured 
            ? 'bg-accent-green text-black border-transparent uppercase' 
            : 'bg-white/10 text-white border-white/20'
        }`}>
          {isDealer && <Sparkles className="w-3.5 h-3.5" />}
          {badgeText}
        </div>
      )}
      
      <div className="mb-8 mt-2">
        <h3 className={`text-2xl font-bold mb-2 ${isDealer ? 'text-gray-300' : 'text-gray-100'}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-400 min-h-[2.5rem] lg:min-h-0 lg:h-10">{description}</p>
        <div className="flex items-baseline gap-1 mt-4">
          <span className={`text-5xl font-heading font-extrabold ${isDealer ? 'text-gray-400' : 'text-white'}`}>{price}</span>
          {period && <span className="text-gray-500 font-medium">{period}</span>}
        </div>
      </div>
      
      <ul className="space-y-4 mb-10 flex-1">
        {features.map((f: any, i: number) => (
          <li key={i} className="flex gap-4 items-start">
            {f.included ? (
              <div className={`rounded-full p-0.5 shrink-0 flex items-center justify-center h-6 w-6 mt-0.5 ${isDealer ? 'bg-gray-800 text-gray-500' : 'bg-accent-green/20 text-accent-green'}`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="bg-white/5 rounded-full p-0.5 shrink-0 flex items-center justify-center h-6 w-6 mt-0.5">
                <div className="w-2 h-2 rounded-full border border-white/20" />
              </div>
            )}
            <span className={`text-sm pt-0.5 ${f.included ? (isDealer ? 'text-gray-400 font-medium' : 'text-gray-200') : 'text-gray-500'}`}>{f.text}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        size="lg" 
        variant={(isDealer || buttonStyle === 'primary') ? "default" : "outline"}
        className={`w-full h-14 rounded-xl text-md font-bold transition-all duration-300 ${btnClasses}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        {btnText}
      </Button>

    </motion.div>
  );
};
