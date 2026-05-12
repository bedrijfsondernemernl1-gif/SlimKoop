import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

const stappen = [
  "Advertentie ophalen...",
  "Vergelijkbare auto's zoeken...",
  "Prijsanalyse uitvoeren...",
  "Foto's scannen op schade...",
  "Onderhandelingstips genereren...",
  "DealScore berekenen..."
];

const hints = [
  "Controleert tientallen vergelijkbare advertenties...",
  "Scant foto's op spuitwerk en verborgen schade...",
  "Berekent jouw exacte onderhandelingsruimte...",
  "Vergelijkt RDW voertuiggegevens..."
];

export const LoadingAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [huidigeStap, setHuidigeStap] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [autoData, setAutoData] = useState<{naam: string, prijs: string, img: string} | null>(null);

  useEffect(() => {
    // Roteer hints elke 4 seconden
    const hintInterval = setInterval(() => {
      setHintIndex(prev => (prev + 1) % hints.length);
    }, 4000);

    return () => clearInterval(hintInterval);
  }, []);

  useEffect(() => {
    // Voor demoredenen, simuleer de laadstappen over een periode van ~8 seconden
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setHuidigeStap(step);
      setProgress(Math.min((step / stappen.length) * 100, 100));
      
      // Simuleer dat we data hebben gestraapt na stap 1
      if (step === 1) {
        setAutoData({
          naam: "Volkswagen Golf 1.4 TSI Highline (2018)",
          prijs: "€ 8.500",
          img: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=600"
        });
      }

      if (step >= stappen.length + 1) {
        clearInterval(interval);
        // Navigate to the demo report
        navigate('/rapport/demo-001');
      }
    }, 1500);

    // Vloeiende progress balk update
    const smoothProgress = setInterval(() => {
       setProgress(prev => {
          if (prev >= 100) return 100;
          return prev + 0.5;
       });
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(smoothProgress);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center pt-32 pb-12 px-6 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-green/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 glass-panel border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl bg-black/60 backdrop-blur-2xl">
        
        {/* Thumbnail Sectie */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-white/10 overflow-hidden mb-4 bg-white/5 relative flex-shrink-0">
             {autoData ? (
               <img src={autoData.img} alt="Voertuig" className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" />
             ) : (
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
               </div>
             )}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white leading-snug max-w-[280px]">{autoData ? autoData.naam : "Advertentie ophalen..."}</h2>
          <p className="text-accent-green font-bold text-base md:text-lg mt-2">{autoData ? autoData.prijs : "\u00A0"}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
            <span>Analyse status</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-accent-green to-emerald-400 transition-all duration-300 ease-out"
               style={{ width: `${progress}%` }}
             ></div>
          </div>
        </div>

        {/* Stappenlijst */}
        <div className="space-y-4 mb-8">
          {stappen.map((stap, i) => {
            let status = 'wachten';
            if (i < huidigeStap) status = 'klaar';
            else if (i === huidigeStap) status = 'bezig';

            let Icon = Circle;
            let iconColor = 'text-gray-600';
            
            if (status === 'klaar') {
              Icon = CheckCircle2;
              iconColor = 'text-accent-green drop-shadow-[0_0_8px_rgba(0,200,83,0.5)]';
            } else if (status === 'bezig') {
              Icon = Loader2;
              iconColor = 'text-white/80 animate-spin';
            }

            return (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${status === 'wachten' ? 'opacity-30' : 'opacity-100'}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <span className={`text-sm font-medium ${status === 'klaar' ? 'text-gray-300' : status === 'bezig' ? 'text-white font-semibold' : 'text-gray-500'}`}>
                  {status === 'klaar' ? stap.replace('...', '') : stap}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rotating hint */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
            <motion.p 
              key={hintIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-gray-400 italic"
            >
              "{hints[hintIndex]}"
            </motion.p>
        </div>

      </div>
    </div>
  );
};
