import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useStore } from '@/src/store/useStore';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

interface Analyse {
  id: string;
  title: string;
  price: string;
  score: number;
  date: string;
  img?: string;
}

export const DashboardOverview: React.FC = () => {
  const [url, setUrl] = useState('');
  const [recentCars, setRecentCars] = useState<Analyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
        setShowSuccess(true);
        // Clear query param
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    async function fetchAnalyses() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'analyses'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const cars = snapshot.docs.map(doc => {
          const data = doc.data();
          let dateStr = 'Onbekend';
          if (data.createdAt) {
            try {
              const dateObj = typeof data.createdAt.toMillis === 'function' ? new Date(data.createdAt.toMillis()) : new Date(data.createdAt);
              dateStr = dateObj.toLocaleDateString('nl-NL');
            } catch(e) { console.error(e); }
          }
          return {
            id: doc.id,
            title: data.title || 'Onbekende auto',
            price: data.price || 'Prijs op aanvraag',
            score: data.score || 0,
            date: dateStr,
            img: data.img || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&h=100&fit=crop',
          };
        });
        setRecentCars(cars);
      } catch (error) {
        console.error("Error fetching analyses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyses();
  }, [user]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          userId: user.uid
        }),
      });

      if (!response.ok) {
        throw new Error('Analyse mislukt');
      }

      const data = await response.json();
      if (data.rapportId) {
        navigate(`/rapport/${data.rapportId}`);
      }
    } catch (error) {
      console.error("Error analyzing car:", error);
      alert("Er is iets misgegaan bij het opstarten van de analyse.");
    } finally {
      setAnalyzing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 70 } }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
        {showSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-black border border-accent-green/50 p-8 rounded-2xl max-w-sm text-center shadow-2xl">
                    <h3 className="text-2xl font-bold text-white mb-4">Betaling Succesvol</h3>
                    <p className="text-gray-300 mb-6">Bedankt voor je aankoop! Je account is succesvol geüpgraded. Je hebt nu direct toegang tot je pakket en alle bijbehorende premium functies.</p>
                    <Button onClick={() => setShowSuccess(false)} className="w-full">Sluiten</Button>
                </div>
            </div>
        )}
      {/* Top bar */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-white/[0.02]">
        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-4 max-w-3xl">
          <div className="relative flex-1 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-dark/60 to-accent-green/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden focus-within:border-accent-green/30 transition-colors">
              <Search className="absolute left-4 h-5 w-5 text-gray-400 group-focus-within:text-accent-green transition-colors" />
              <Input 
                type="url" 
                placeholder="Plak marktplaats.nl link..." 
                className="pl-12 pr-4 h-14 w-full bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={analyzing}
              />
            </div>
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="h-14 px-8 rounded-xl shrink-0 group shadow-lg font-semibold"
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starten...
              </>
            ) : (
              <>
                Analyseren
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="p-6 md:p-10 flex-1 overflow-y-auto min-h-0">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Recente Analyses</h2>
          <Button variant="link" className="text-gray-400 hover:text-white pr-0" onClick={() => navigate('/dashboard/history')}>Bekijk alles</Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
          </div>
        ) : recentCars.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl border-white/5">
            <h3 className="text-xl font-bold text-white mb-2">Nog geen analyses</h3>
            <p className="text-gray-400">Plak een link hierboven om je eerste auto te analyseren.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4"
          >
            {recentCars.map((car) => (
              <motion.div 
                key={car.id}
                variants={itemVariants}
                whileHover={{ scale: 1.01, x: 5 }}
                className="glass rounded-2xl p-4 flex flex-col justify-between sm:items-center hover:bg-white/10 transition-all group cursor-pointer border-white/5 hover:border-accent-green/30 relative overflow-hidden"
                onClick={() => navigate(`/rapport/${car.id}`)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex gap-6 items-center w-full">
                  <div className="hidden sm:block w-20 h-16 bg-black/60 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={car.img} alt={car.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg group-hover:text-accent-green transition-colors leading-tight">{car.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1.5 font-medium">
                      <span className="text-gray-200">{car.price}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                      <span>{car.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-xl bg-black/40 border border-white/5 group-hover:border-accent-green/20 transition-colors">
                    <div className={`text-2xl font-heading font-bold ${car.score >= 70 ? 'text-accent-green drop-shadow-[0_0_10px_rgba(0,200,83,0.3)]' : car.score >= 50 ? 'text-accent-orange' : 'text-destructive'}`}>
                      {car.score}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
