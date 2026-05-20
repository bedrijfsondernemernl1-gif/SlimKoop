import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { Footer } from '@/src/components/Footer';
import { PricingCard } from '@/src/components/PricingCard';
import { useStore } from '@/src/store/useStore';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

const PRICE_IDS: Record<string, string> = {
  "Losse Scan": "price_1TWzIHRsJS7Vz7uquwItCZSP",
  "Slimme Koper": "price_1TWzJoRsJS7Vz7uq0sMvxaLG",
  "Autohandelaar": "price_1TWzLoRsJS7Vz7uqcB7DF5qQ",
};

export const PricingPage: React.FC = () => {
  const { user, isLoggedIn, openAuthModal } = useStore();
  const navigate = useNavigate();

  const [purchasing, setPurchasing] = React.useState<string | null>(null);

  const handlePurchase = async (title: string) => {
    console.log("handlePurchase clicked for:", title);
    if (!isLoggedIn || !user) {
      console.log("User not logged in, showing alert");
      alert("Log eerst in om een pakket aan te schaffen.");
      openAuthModal();
      return;
    }

    const priceId = PRICE_IDS[title];
    if (!priceId) {
      console.error("No priceId found for title:", title);
      return;
    }

    setPurchasing(title);
    try {
      console.log("Creating checkout session via API for priceId:", priceId);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId, 
          userId: user.uid, 
          userEmail: user.email,
          mode: priceId === 'price_1TWzLoRsJS7Vz7uqcB7DF5qQ' ? 'subscription' : 'payment'
        }),
      });

      const data = await response.json();
      
      if (data?.error) { 
          console.error("Stripe API error:", data.error);
          alert(data.error); 
          setPurchasing(null);
      } else if (data?.url) { 
          console.log("Redirecting to Stripe:", data.url);
          window.location.assign(data.url); 
      }
    } catch (e: any) {
      console.error("Fout bij checkout:", e);
      alert("Er is iets misgegaan. Probeer het later opnieuw.");
      setPurchasing(null);
    }
  };
  return (
    <div className="min-h-screen bg-black pt-40 flex flex-col relative overflow-hidden">
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
             price="€9,99" 
             period=""
             description="Ideaal als je precies weet welke auto je gaat kopen."
             features={[
               { text: "1 volledig rapport", included: true },
               { text: "DealScore & waardebepaling", included: true },
               { text: "Rode vlaggen analyse", included: true },
               { text: "RDW & kilometercheck", included: true },
               { text: "Geavanceerde AI Foto-scan", included: false },
               { text: "Persoonlijk onderhandelingsscript", included: false },
               { text: "Rapportgeschiedenis & PDF-export", included: false },
             ]}
             btnText={purchasing === "Losse Scan" ? "Laden..." : "Koop scan — €9,99"}
             buttonStyle="outline"
             onClick={() => handlePurchase("Losse Scan")}
          />

          {/* Plan 2: Slimme Koper */}
          <PricingCard 
             title="Slimme Koper" 
             price="€19,99" 
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
               { text: "Rapportgeschiedenis & PDF-export", included: false },
             ]}
             btnText={purchasing === "Slimme Koper" ? "Laden..." : "Start nu — €19,99"}
             featured={true}
             buttonStyle="primary"
             onClick={() => handlePurchase("Slimme Koper")}
          />

          {/* Plan 3: Autohandelaar */}
          <PricingCard 
             title="Autohandelaar" 
             price="€29" 
             period="/ maand"
             description="Voor wie wekelijks auto's beoordeelt en koopt."
             badgeText="Voor professionals"
             features={[
               { text: "Onbeperkt rapporten", included: true },
               { text: "Alles van Slimme Koper", included: true },
               { text: "Prioriteitsverwerking", included: true },
               { text: "Rapportgeschiedenis & PDF-export", included: true },
             ]}
             btnText={purchasing === "Autohandelaar" ? "Laden..." : "Start abonnement"}
             buttonStyle="outline-green"
             onClick={() => handlePurchase("Autohandelaar")}
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
            <ShieldCheck className="w-5 h-5 text-accent-green" />
            Onafhankelijk en objectief
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};
