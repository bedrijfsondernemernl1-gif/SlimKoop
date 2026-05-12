import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, Bell, Car, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const DashboardGarage: React.FC = () => {
  const navigate = useNavigate();
  
  const savedCars = [
    { 
      id: '1', 
      title: 'Volkswagen Golf 1.5 TSI Style', 
      savedPrice: 19800, 
      currentPrice: 18500, 
      score: 92, 
      savedDate: '12 mei', 
      img: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=600'
    },
    { 
      id: '2', 
      title: 'BMW 3 Serie 320i High Executive', 
      savedPrice: 24950, 
      currentPrice: 24950, 
      score: 65, 
      savedDate: '10 mei', 
      img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600'
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-heading font-bold text-white tracking-tight mb-2">Mijn Garage</h2>
          <p className="text-gray-400">Beheer en volg de prijs van je favoriete auto's.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button variant="outline" className="gap-2 border-white/10 text-gray-300 hover:text-white bg-white/5 rounded-xl">
            <Bell className="w-4 h-4" />
            Prijs Alert Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <div className="relative h-48 bg-black overflow-hidden group-hover:h-44 transition-all duration-300">
                  <img src={car.img} alt={car.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
                  
                  {/* Badge Deal Score */}
                  <div className={`absolute top-4 left-4 w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-white/10 ${car.score >= 70 ? 'bg-primary-dark/80 text-accent-green shadow-[0_0_15px_rgba(0,200,83,0.3)]' : car.score >= 50 ? 'bg-black/80 text-accent-orange' : 'bg-black/80 text-destructive'}`}>
                    {car.score}
                  </div>
                  
                  <button className="cursor-pointer absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-300 hover:text-red-400 hover:border-red-400/50 transition-colors z-10" title="Verwijder">
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
                      onClick={() => navigate(`/rapport/${car.id}`)}
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
      </div>
    </div>
  );
};
