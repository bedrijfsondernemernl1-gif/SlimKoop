import React from 'react';
import { motion } from 'motion/react';
import { Target, Shield, Cpu } from 'lucide-react';
import { Footer } from '@/src/components/Footer';
import { SEO } from '@/src/components/SEO';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pt-40 flex flex-col relative overflow-hidden">
      <SEO 
        title="Over Ons — Onafhankelijke RDW Auto Check | OccasionScan"
        description="Ontmoet het team achter OccasionScan. Wij geloven in volledige transparantie en onafhankelijke data bij het kopen van een tweedehands auto."
      />
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-accent-green/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 flex-1 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6">Over OccasionScan Auto Check</h1>
            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
              Wij maken de verborgen patronen in de tweedehands automarkt zichtbaar, zodat jij altijd met een voorsprong onderhandelt.
            </p>
          </div>

          <div className="glass-panel border-white/10 rounded-3xl p-8 md:p-12 mb-16 bg-black/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/5 blur-3xl rounded-full"></div>
            <div className="relative z-10 space-y-6 text-gray-300 text-lg leading-relaxed">
              <p>
                De tweedehands automarkt is van oudsher ondoorzichtig. Verkopers weten vaak meer dan kopers, en als consument is het moeilijk om razendsnel in te schatten of een vraagprijs écht marktconform is.
              </p>
              <p>
                Dat is waarom we <strong className="text-white">OccasionScan</strong> zijn gestart. Door miljoenen datapunten en geavanceerde AI te combineren, kunnen we in seconden een auto scannen zoals een expert dat zou doen. We kijken naar historische afschrijvingen, prijstrends in de markt, roestpatronen op foto's en kleine signalen in de beschrijving die duiden op een slechte deal.
              </p>
              <p>
                Onze missie is simpel: <span className="text-accent-green font-semibold">jou beschermen tegen miskopen en je de munitie geven om de beste prijs te onderhandelen.</span>
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-colors">
              <div className="w-14 h-14 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                <Target className="w-6 h-6 text-accent-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Precisie</h3>
              <p className="text-gray-400 text-sm">We baseren onze analyses op harde data uit de actuele markt, niet op onderbuikgevoel.</p>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-colors">
              <div className="w-14 h-14 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                <Shield className="w-6 h-6 text-accent-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Onafhankelijkheid</h3>
              <p className="text-gray-400 text-sm">We zijn niet verbonden aan autohandelaren of marktplaatsen. We staan 100% aan de kant van de koper.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-colors">
              <div className="w-14 h-14 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                <Cpu className="w-6 h-6 text-accent-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Innovatie</h3>
              <p className="text-gray-400 text-sm">Onze AI-modellen worden dagelijks getraind met de nieuwste markttrends voor de scherpste inzichten.</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};
