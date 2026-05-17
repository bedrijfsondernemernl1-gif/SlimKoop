import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Footer } from '@/src/components/Footer';

export const AnalysisInputPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-black pt-32 flex flex-col relative overflow-hidden">
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
           {/* Platform badges */}
           <div className="flex items-center justify-center gap-6 mb-8 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <span className="text-white">Ondersteunde platforms:</span>
              <span className="flex items-center gap-1.5 text-orange-400"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Marktplaats</span>
              <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400"></span> AutoScout24</span>
           </div>

             <form onSubmit={handleAnalyze} className="space-y-6">
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Advertentie Link (URL)</label>
                   <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input 
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.marktplaats.nl/v/auto-s/... of autoscout24.com/..." 
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
