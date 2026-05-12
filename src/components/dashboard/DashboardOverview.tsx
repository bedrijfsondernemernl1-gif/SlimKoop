import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

export const DashboardOverview: React.FC = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      navigate('/rapport/m123456');
    }
  };

  const recentCars = [
    { id: '1', title: 'Volkswagen Golf 1.4 TSI R-Line', price: '€ 18.500', score: 82, date: 'Vandaag', img: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=100&h=100&fit=crop' },
    { id: '2', title: 'BMW 3 Serie 320i High Executive', price: '€ 24.950', score: 65, date: 'Gisteren', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=100&h=100&fit=crop' },
    { id: '3', title: 'Audi A3 Sportback 35 TFSI', price: '€ 21.000', score: 45, date: '2 dagen geleden', img: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=100&h=100&fit=crop' },
  ];

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
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="h-14 px-8 rounded-xl shrink-0 group shadow-lg font-semibold">
            Analyseren
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>
      </div>

      <div className="p-6 md:p-10 flex-1 overflow-y-auto min-h-0">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Recente Analyses</h2>
          <Button variant="link" className="text-gray-400 hover:text-white pr-0">Bekijk alles</Button>
        </div>
        
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
      </div>
    </div>
  );
};
