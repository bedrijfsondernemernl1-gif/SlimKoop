import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
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

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16 items-center">
          {/* Plan 1: Losse Scan */}
          <PricingCard 
             title="Losse Scan" 
             price="€4,99" 
             period=""
             description="Ideaal als je precies weet welke auto je gaat kopen."
             features={[
               { text: "1 volledig rapport", included: true },
               { text: "DealScore & waardebepaling", included: true },
               { text: "Rode vlaggen analyse", included: true },
               { text: "RDW & kilometercheck", included: true },
               { text: "Geavanceerde AI Foto-scan", included: false },
               { text: "Persoonlijk onderhandelingsscript", included: false },
             ]}
             btnText="Koop scan — €4,99"
             buttonStyle="outline"
          />

          {/* Plan 2: Slimme Koper */}
          <PricingCard 
             title="Slimme Koper" 
             price="€9,99" 
             period=""
             description="De favoriete keuze voor wie meerdere auto's vergelijkt."
             badgeText="Meest Gekozen"
             features={[
               { text: "3 volledige rapporten", included: true },
               { text: "DealScore & waardebepaling", included: true },
               { text: "Rode vlaggen analyse", included: true },
               { text: "RDW & kilometercheck", included: true },
               { text: "Geavanceerde AI Foto-scan", included: true },
               { text: "Persoonlijk onderhandelingsscript", included: true },
             ]}
             btnText="Start nu — €9,99"
             featured={true}
             buttonStyle="primary"
          />

          {/* Plan 3: Autohandelaar */}
          <PricingCard 
             title="Autohandelaar" 
             price="€19" 
             period="/ maand"
             description="Voor wie wekelijks auto's beoordeelt en koopt."
             badgeText="Voor professionals"
             features={[
               { text: "Onbeperkt rapporten", included: true },
               { text: "Alles van Slimme Koper", included: true },
               { text: "Prioriteitsverwerking", included: true },
               { text: "Rapportgeschiedenis & export", included: true },
               { text: "Bulk analyse (meerdere URL's)", included: true },
             ]}
             btnText="Start abonnement"
             buttonStyle="outline-green"
          />
        </div>

        {/* Vertrouwensbalk */}
        <div className="max-w-4xl mx-auto border border-white/5 bg-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-green" />
            Veilig betalen via Stripe
          </div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent-green" />
            Geen abonnement voor losse scans
          </div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-accent-green" />
            Niet tevreden? Geld terug garantie
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};
