import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Footer } from '@/src/components/Footer';
import { useStore } from '@/src/store/useStore';

export const AnalysisInputPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { scansOver, permissies, isPremium, subscriptionPlan, scanLimiet } = useStore();

  const isFreeAccount = !isPremium || permissies === 'free';
  const outOfScans = scansOver <= 0 && scanLimiet > 0 && subscriptionPlan !== 'free';

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      setIsLoading(true);
      try {
        const { auth } = await import('@/src/lib/firebase');
        const res = await fetch('/api/analyseer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, userId: auth.currentUser?.uid })
        });
        const data = await res.json();
        if (res.ok && data.rapportId) {
          navigate(`/rapport/${data.rapportId}`);
        } else {
          alert('Fout bij analyseren: ' + (data.error || 'Onbekende fout'));
        }
      } catch (err) {
        alert('Fout bij verbinden met de server.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black pt-40 flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-green/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 flex-1 flex flex-col justify-center items-center pb-24">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 text-sm font-medium text-gray-300">
             <ShieldCheck className="w-4 h-4 text-accent-green" />
             AI-Analyse
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6 tracking-tight">Klaar om de waarheid te zien?</h1>
          <p className="text-xl text-gray-400 font-light">
             Plak de link en we laten je direct weten of je voor een gouden deal staat, of beter weg kunt rennen.
          </p>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="w-full max-w-2xl glass-panel border-white/10 rounded-3xl p-8 shadow-2xl relative bg-black/60 backdrop-blur-2xl"
        >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-8 text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
               <span className="text-white whitespace-nowrap">Ondersteunde platforms:</span>
               <div className="flex items-center justify-center gap-4 flex-wrap">
                 <span className="flex items-center gap-1.5 text-orange-400 whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Marktplaats</span>
                 <span className="flex items-center gap-1.5 text-blue-400 whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-blue-400"></span> AutoScout24</span>
               </div>
            </div>

            {/* Scan Limit / Tier Warning */}
            {outOfScans && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                 <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                 <div className="text-left">
                   <p className="text-amber-500 text-xs font-bold uppercase tracking-wider">Bundel opgebruikt</p>
                   <p className="text-gray-300 text-xs">Je premium scans zijn op. Deze nieuwe analyse zal een <span className="text-white font-bold underline">gratis versie</span> zijn met minder gegevens.</p>
                 </div>
                 <Button size="sm" type="button" onClick={() => navigate('/prijzen')} className="ml-auto bg-amber-500 hover:bg-amber-600 text-black text-[10px] h-7 px-3 rounded-lg font-bold">Upgrade</Button>
              </div>
            )}
            
            {isFreeAccount && !outOfScans && (
              <div className="mb-6 p-4 bg-accent-green/5 border border-accent-green/10 rounded-xl flex items-center gap-3">
                 <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0" />
                 <div className="text-left">
                   <p className="text-accent-green text-xs font-bold uppercase tracking-wider">Gratis Analyse</p>
                   <p className="text-gray-400 text-xs">Je ontvangt een basisrapport. <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => navigate('/prijzen')}>Bekijk premium</span> voor DealScore & RDW check.</p>
                 </div>
              </div>
            )}

             <form onSubmit={handleAnalyze} className="space-y-6">
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Advertentie Link (URL)</label>
                   <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input 
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.marktplaats.nl/v/auto-s/... of autoscout24.nl/..." 
                        className="pl-14 h-16 bg-black/50 border border-white/10 text-white rounded-xl focus-visible:ring-accent-green focus-visible:border-transparent text-lg shadow-inner"
                        required
                      />
                   </div>
                </div>
                
                <Button disabled={isLoading} type="submit" size="xl" className="w-full h-16 text-lg rounded-xl shadow-lg hover:shadow-xl bg-accent-green hover:bg-accent-green/90 text-black font-semibold transition-all">
                   {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <>Start Analyse <ArrowRight className="w-5 h-5 ml-2" /></>}
                </Button>
             </form>
        </motion.div>
        
        {/* Features list */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.3 }}
           className="mt-12 flex flex-wrap justify-center gap-6 max-w-3xl"
        >
           <div className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle2 className="w-4 h-4 text-accent-green" /> Prijscontrole via 50k+ DB</div>
           <div className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle2 className="w-4 h-4 text-accent-green" /> RDW Historie</div>
           <div className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle2 className="w-4 h-4 text-accent-green" /> Exclusieve DealScore</div>
           <div className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle2 className="w-4 h-4 text-accent-green" /> AI Foto Scanner</div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};
