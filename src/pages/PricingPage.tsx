import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Footer } from '@/src/components/Footer';
import { PricingCard } from '@/src/components/PricingCard';
import { useStore } from '@/src/store/useStore';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { SEO } from '@/src/components/SEO';


const PRICE_IDS: Record<string, string> = {
  "Losse Scan": "price_1TWzIHRsJS7Vz7uquwItCZSP",
  "Slimme Koper": "price_1TWzJoRsJS7Vz7uq0sMvxaLG",
  "Autohandelaar": "price_1TWzLoRsJS7Vz7uqcB7DF5qQ",
};

export const PricingPage: React.FC = () => {
  const { user, isLoggedIn, openAuthModal } = useStore();
  const navigate = useNavigate();

  const [purchasing, setPurchasing] = React.useState<string | null>(null);


  const handlePurchase = async (title: string, couponCode: string | null = null) => {
    console.log("handlePurchase clicked for:", title);
    if (!isLoggedIn || !user) {
      openAuthModal();
      return;
    }
    
    setPurchasing(title);
    try {
      const priceId = PRICE_IDS[title];
      if (!priceId) {
        console.error("Geen priceId gevonden voor:", title);
        return;
      }
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          userEmail: user.email,
          code: couponCode,
          mode: title === "Autohandelaar" ? "subscription" : "payment"
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Mollie session URL niet ontvangen:", data);
        alert("Er is een fout opgetreden bij het opstarten van de betaling. Probeer het later opnieuw.");
      }
    } catch (error) {
      console.error("Fout tijdens handlePurchase:", error);
      alert("Er is een fout opgetreden bij het verbinden met de betaalservice. Probeer het later opnieuw.");
    } finally {
      setPurchasing(null);
    }
  };
  return (
    <div className="min-h-screen bg-black pt-40 flex flex-col relative overflow-hidden">
      <SEO 
        title="Prijzen Auto Check — Betrouwbaar een Tweedehands Auto Kopen | OccasionScan"
        description="Wil je met zekerheid een tweedehands auto kopen? Bekijk onze tarieven voor een volledige RDW apk check, kilometerstand check en AI schade check auto."
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "OccasionScan - Auto Check Slimme Koper",
            "image": "https://i.ibb.co/0yGyYTqW/Screen-Shot-Tool-20260519181200.png",
            "description": "Met dit pakket van 3 scans vergelijkt de koper meerdere occasions met DealScore, complete RDW APK check en AI-foto-analyse.",
            "brand": {
              "@type": "Brand",
              "name": "OccasionScan"
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "EUR",
              "price": "19.99",
              "url": "https://occasionscan.nl/prijzen",
              "priceValidUntil": "2027-12-31",
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "OccasionScan - Losse Scan",
            "image": "https://i.ibb.co/0yGyYTqW/Screen-Shot-Tool-20260519181200.png",
            "description": "Eenmalige volledige auto check inclusief DealScore, waardebepaling, rode vlaggen en RDW kilometercheck.",
            "brand": {
              "@type": "Brand",
              "name": "OccasionScan"
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "EUR",
              "price": "9.99",
              "url": "https://occasionscan.nl/prijzen",
              "priceValidUntil": "2027-12-31",
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock"
            }
          }
        ]}
      />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16 items-center">
          {/* Plan 1: Losse Scan */}
          <PricingCard 
             title="Losse Scan" 
             price="€9,99" 
             period=""
             description="Ideaal als je direct zekerheid wilt voor één specifieke auto."
             features={[
               { text: "1 volledig premium rapport", included: true },
               { text: "Unieke DealScore & waardebepaling", included: true },
               { text: "Directe rode vlaggen & risico analyse", included: true },
               { text: "RDW open-data & kilometerstand check", included: true },
               { text: "Geavanceerde AI Foto-scan", included: false },
               { text: "Persoonlijk onderhandelingsscript", included: false },
               { text: "Rapportgeschiedenis & PDF-export", included: false },
             ]}
             btnText={purchasing === "Losse Scan" ? "Laden..." : "Activeer direct 1 scan"}
             buttonStyle="outline"
             onClick={() => handlePurchase("Losse Scan")}
          />

          {/* Plan 2: Slimme Koper */}
          <PricingCard 
             title="Slimme Koper" 
             price="€19,99" 
             period=""
             description="De slimme keuze voor wie serieus occasions vergelijkt."
             badgeText="Slimme Keuze"
             features={[
               { text: "3 volledige rapporten", included: true },
               { text: "Unieke DealScore & waardebepaling", included: true },
               { text: "Directe rode vlaggen & risico analyse", included: true },
               { text: "RDW open-data & kilometerstand check", included: true },
               { text: "Geavanceerde AI Foto-scan", included: true },
               { text: "Volledig persoonlijk onderhandelingsscript", included: true },
               { text: "Rapportgeschiedenis & opslag (30 dagen)", included: true },
             ]}
             btnText={purchasing === "Slimme Koper" ? "Laden..." : "Word een Slimme Koper"}
             featured={false}
             buttonStyle="primary"
             onClick={() => handlePurchase("Slimme Koper")}
          />

          {/* Plan 3: Autohandelaar */}
          <PricingCard 
             title="Autohandelaar" 
             price="€29" 
             period="/ maand"
             description="Tijdelijk niet beschikbaar. De ultieme tool voor dealers die maximale winst en snelheid eisen."
             badgeText="TIJDELIJK NIET BESCHIKBAAR"
             features={[
               { text: "Onbeperkt aantal scans per maand", included: true },
               { text: "Volledige toegang tot alle Slimme Koper functionaliteiten", included: true },
               { text: "Ideaal voor intensief wekelijks gebruik (geen limieten)", included: true },
               { text: "Eindeloze rapporthistorie & PDF-export archivering", included: true },
               { text: "Diepgaande RDW-check voorraad-integratie & APK-historie", included: true },
               { text: "Exclusieve AI Foto-scan op verborgen schades", included: true },
               { text: "Persoonlijke onderhandelingsscripts (openingsbod, tegenbod, weglopen)", included: true },
               { text: "Snelle premium e-mailondersteuning bij vragen", included: true },
               { text: "Eenvoudig rapporten exporteren naar PDF of printen", included: true },
               { text: "Altijd als eerste toegang tot nieuwe AI-updates", included: true },
             ]}
             btnText="Tijdelijk niet beschikbaar"
             isDealer={true}
             featured={false}
             disabled={true}
             buttonStyle="dealer-premium"
             onClick={() => {}}
          />
        </div>

        {/* Vertrouwensbalk */}
        <div className="max-w-4xl mx-auto border border-white/5 bg-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-green" />
            Veilig betalen via Mollie
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
