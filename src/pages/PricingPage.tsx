import React from 'react';
import { motion } from 'motion/react';
import { Footer } from '@/src/components/Footer';
import { PricingCard } from '@/src/components/PricingCard';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pt-32 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-dark/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10 flex-1 pb-24">
        
        <div className="text-center max-w-3xl mx-auto mb-20 relative">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-7xl font-heading font-extrabold text-white mb-6 tracking-tight"
          >
            Kies de zekerheid die<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-primary">bij je past</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 font-light"
          >
            Betaal nooit teveel voor je occasion en voorkom onverwachte onderhoudskosten. Een klein bedrag nu, bespaart duizenden euro's later.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-32">
          {/* Basis */}
          <PricingCard 
             title="Basis" 
             price="€14,99" 
             period="/ maand"
             description="Voor de gerichte koper die een paar specifieke auto's op het oog heeft."
             features={[
               { text: "5 Premium rapporten per maand", included: true },
               { text: "RDW-data, historie & kilometer check", included: true },
               { text: "Rode vlaggen & verborgen gebreken", included: true },
               { text: "Slimme DealScore™ & waardebepaling", included: true },
               { text: "Geavanceerde AI Foto-scan & Onderhandeling", included: false },
             ]}
             btnText="Kies Basis"
             variant="ghost"
          />

          {/* Premium */}
          <PricingCard 
             title="Premium" 
             price="€24,99" 
             period="/ maand"
             description="De meest gekozen optie voor volledige zekerheid en de beste deal."
             features={[
               { text: "Onbeperkt Premium rapporten", included: true },
               { text: "RDW-data, historie & kilometer check", included: true },
               { text: "Rode vlaggen & verborgen gebreken", included: true },
               { text: "Geavanceerde AI Foto-scan (Schade)", included: true },
               { text: "Persoonlijk onderhandelingsscript", included: true },
             ]}
             btnText="Kies Premium"
             variant="premium"
             featured={true}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};
