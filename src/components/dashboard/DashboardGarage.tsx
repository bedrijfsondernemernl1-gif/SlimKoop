import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, Bell, Car, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface SavedCar {
  id: string;
  title: string;
  savedPrice: number;
  currentPrice: number;
  score: number;
  savedDate: string;
  img: string;
}

export const DashboardGarage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [savedCars, setSavedCars] = useState<SavedCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGarage() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'analyses'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const cars = snapshot.docs.map(document => {
          const data = document.data();
          const createdAt = data.createdAt ? new Date(data.createdAt.toMillis()) : new Date();
          // Simulating price fields since analysis only has 'price' as string
          // In a real app we would have savedPrice and currentPrice in DB or refetch
          const parsedPrice = parseInt((data.price || '0').replace(/[^0-9]/g, '')) || 0;
          return {
            id: document.id,
            rapportId: data.rapportId,
            title: data.title || 'Onbekende auto',
            savedPrice: parsedPrice,
            currentPrice: parsedPrice, // Placeholder
            score: data.score || 0,
            savedDate: createdAt.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' }),
            img: data.img || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
          };
        });
        setSavedCars(cars);
      } catch (error) {
        console.error("Error fetching garage:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGarage();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'analyses', id));
      setSavedCars(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Prijs op aanvraag';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-heading font-bold text-white tracking-tight mb-2">Mijn Garage</h2>
          <p className="text-gray-400">Beheer en volg de prijs van je favoriete auto's.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
          </div>
        ) : (
          <AnimatePresence>
            {savedCars.length > 0 ? savedCars.map((car, i) => (
               <motion.div 
                 key={car.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ delay: i * 0.1 }}
                 className="group glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative flex flex-col hover:border-white/20 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
               >
                  <div className="relative h-48 bg-black overflow-hidden group-hover:h-44 transition-all duration-300 cursor-pointer" onClick={() => navigate(`/rapport/${car.rapportId}`)}>
                    <img src={car.img} alt={car.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
                    
                    {/* Badge Deal Score */}
                    <div className={`absolute top-4 left-4 w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-white/10 ${car.score >= 70 ? 'bg-primary-dark/80 text-accent-green shadow-[0_0_15px_rgba(0,200,83,0.3)]' : car.score >= 50 ? 'bg-black/80 text-accent-orange' : 'bg-black/80 text-destructive'}`}>
                      {car.score}
                    </div>
                    
                    <button onClick={(e) => handleDelete(e, car.id)} className="cursor-pointer absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-300 hover:text-red-400 hover:border-red-400/50 transition-colors z-10" title="Verwijder">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-tight group-hover:text-accent-green transition-colors">{car.title}</h3>
                  
                  <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Opgeslagen {car.savedDate}</p>
                      <p className="text-gray-400 line-through text-sm decoration-gray-600">{formatPrice(car.savedPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Huidige Prijs</p>
                      <p className="text-white font-semibold text-lg">{formatPrice(car.currentPrice)}</p>
                    </div>
                  </div>
                  
                  {car.currentPrice < car.savedPrice && (
                    <div className="flex items-center gap-2 text-accent-green text-sm font-medium mb-6 bg-accent-green/10 border border-accent-green/20 px-3 py-2 rounded-xl">
                      <ArrowDown className="w-4 h-4" />
                      Prijs met {formatPrice(car.savedPrice - car.currentPrice)} gedaald!
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Button 
                      variant="outline" 
                      className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl h-11"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Update
                    </Button>
                    <Button 
                      onClick={() => navigate(`/rapport/${car.rapportId}`)}
                      className="bg-accent-green hover:bg-accent-green/90 text-black shadow-[0_0_15px_rgba(0,200,83,0.2)] rounded-xl font-semibold h-11"
                    >
                      Rapport
                    </Button>
                  </div>
                </div>
             </motion.div>
          )) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Car className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Je garage is leeg</h3>
              <p className="text-gray-400 max-w-md">Ontdek auto's op Marktplaats en voeg ze toe aan je garage om de Deal Score en prijzen in de gaten te houden.</p>
              <Button onClick={() => navigate('/dashboard')} className="mt-8 bg-accent-green hover:bg-accent-green/90 text-black font-semibold rounded-xl px-8 h-12">
                Zoek een auto
              </Button>
            </div>
          )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
