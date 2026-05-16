import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Shield, Zap, Car, CheckCircle2, ArrowRight, Link as LinkIcon, Cpu, ShieldCheck, FileText, ChevronDown, AlertCircle, Lock, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Footer } from '@/src/components/Footer';
import { PricingCard } from '@/src/components/PricingCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/src/components/ui/accordion';
import { useStore } from '@/src/store/useStore';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

const PRICE_IDS: Record<string, string> = {
  "Losse Scan": "price_1TWzIHRsJS7Vz7uquwItCZSP",
  "Slimme Koper": "price_1TWzJoRsJS7Vz7uq0sMvxaLG",
  "Autohandelaar": "price_1TWzLoRsJS7Vz7uqcB7DF5qQ",
};

export const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, openAuthModal } = useStore();
  
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (title: string) => {
    console.log("handlePurchase clicked for:", title);
    if (!isLoggedIn || !user) {
      console.log("User not logged in, showing auth modal");
      setShowLoginNotification(true);
      setTimeout(() => setShowLoginNotification(false), 4000);
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
  
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [isLoading, setIsLoading] = useState(false);
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
        if (res.ok && data.success) {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring", stiffness: 50, damping: 15 } }
  };

  return (
      <div className="relative overflow-hidden min-h-screen scroll-smooth" ref={containerRef}>
      
      {/* Login Notification Toast */}
      <AnimatePresence>
        {showLoginNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[100] bg-[#0A111F] border border-accent-green/30 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]"
          >
            <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Log eerst in</p>
              <p className="text-gray-400 text-xs">Je moet ingelogd zijn om een pakket aan te schaffen.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hero Section */}
      <motion.div 
        style={{ y: yHero, opacity: opacityHero }}
        className="container mx-auto px-6 py-32 md:py-48 relative z-10 flex flex-col items-center text-center"
      >
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-4xl w-full flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-8 shadow-sm bg-black/40 backdrop-blur-xl">
            <Search className="w-4 h-4 text-accent-green" />
            <span className="text-sm font-medium text-white">AI-gedreven autoanalyse</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight mb-8 leading-tight text-white flex flex-col items-center">
            <span>AI die jou beschermt</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">
               tegen slechte auto's.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-gray-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Plak een Marktplaats of AutoScout24 link. Ontvang binnen 60 seconden een AI-rapport met DealScore, rode vlaggen en een onderhandelingsscript.
          </motion.p>
          
          <motion.form variants={itemVariants} onSubmit={handleAnalyze} className="flex flex-col gap-4 items-center w-full max-w-2xl mx-auto relative z-20">
            <div className="relative w-full group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-dark/50 to-accent-green/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative flex items-center bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl focus-within:border-accent-green/50 transition-colors duration-300">
                <Search className="absolute left-6 h-6 w-6 text-gray-400" />
                <Input 
                  type="url" 
                  placeholder="https://www.marktplaats.nl/v/... of autoscout24.com/..." 
                  className="pl-16 pr-6 h-20 w-full bg-transparent border-0 text-lg text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Button disabled={isLoading} type="submit" size="xl" className="w-full md:w-auto h-16 px-10 text-lg rounded-xl shadow-lg hover:shadow-xl bg-accent-green hover:bg-accent-green/90 text-black font-semibold transition-all duration-300 group">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 
                <>
                  Analyseer deze auto
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              }
            </Button>
            
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-accent-green" /> Eerste analyse gratis · Geen account nodig
            </p>
          </motion.form>
        </motion.div>
      </motion.div>

      {/* Trust bar */}
      <div className="border-y border-white/5 bg-black/20 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-6 py-6 font-medium text-gray-400">
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 text-sm">
             <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">4.200+</span> analyses uitgevoerd
             </div>
             <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>
             <div className="flex items-center gap-2">
                Gemiddeld <span className="text-accent-green font-bold text-lg">€1.800</span> bespaard
             </div>
             <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>
             <div className="flex items-center gap-2 text-yellow-500">
                ⭐ <span className="text-white font-bold text-lg ml-1">4.8/5</span> beoordeling
             </div>
          </div>
        </div>
      </div>

      {/* Hoe het werkt Section */}
      <div id="hoe-het-werkt" className="container mx-auto px-6 relative z-10 py-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-6">Zo simpel werkt het</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {/* Connector line (Desktop) */}
          <div className="hidden md:block absolute top-[4rem] left-[16%] right-[16%] h-px bg-white/10"></div>

          {[
            { 
              step: '1', 
              icon: LinkIcon, 
              title: "Plak de autolink", 
              desc: "Kopieer de URL van de advertentie die je op het oog hebt."
            },
            { 
              step: '2', 
              icon: Cpu, 
              title: "AI analyseert alles", 
              desc: "Onze modellen scannen de prijs, foto's, beschrijving en historie binnen seconden."
            },
            { 
              step: '3', 
              icon: FileText, 
              title: "Ontvang je rapport", 
              desc: "Krijg direct inzicht of je een slimme aankoop doet of beter weg kunt lopen."
            }
          ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative flex flex-col items-center text-center group transition-all"
              >
                <div className="w-20 h-20 rounded-full glass-panel border border-white/10 mb-6 flex items-center justify-center relative shadow-lg z-10 group-hover:border-accent-green/30 group-hover:scale-105 transition-all">
                  <div className="absolute inset-0 bg-accent-green/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
                  <item.icon className="w-8 h-8 text-white group-hover:text-accent-green transition-colors" />
                  <div className="absolute top-0 -right-2 w-6 h-6 rounded-full bg-accent-green text-black font-bold text-xs flex items-center justify-center">{item.step}</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed font-light text-sm">{item.desc}</p>
             </motion.div>
          ))}
        </div>
      </div>

      {/* Voorbeeld Rapport Sectie */}
      <div className="container mx-auto px-6 relative z-10 py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
         <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 w-full relative">
               <div className="absolute inset-0 bg-accent-green/10 blur-[100px] rounded-full"></div>
               <div className="glass-panel border-white/10 rounded-3xl p-6 relative z-10 shadow-2xl bg-black/80 overflow-hidden">
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-4 border-[#10B981] flex items-center justify-center">
                           <span className="text-[#10B981] font-bold text-sm">72</span>
                        </div>
                        <div>
                           <div className="font-bold text-white">DealScore</div>
                           <div className="text-xs text-[#10B981]">Redelijke deal</div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                     <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                           <div className="text-white text-sm font-semibold">Geen proefrit mogelijk</div>
                           <div className="text-xs text-gray-400 mt-1">Serieuze verkopers staan altijd een proefrit toe...</div>
                        </div>
                     </div>
                     <div className="bg-white/5 p-3 rounded-xl blur-sm flex items-start gap-3 select-none">
                        <div className="w-4 h-4 bg-gray-500 rounded-full shrink-0" />
                        <div className="space-y-2 w-full">
                           <div className="h-4 bg-gray-600 rounded w-2/3"></div>
                           <div className="h-3 bg-gray-700 rounded w-full"></div>
                        </div>
                     </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-end pb-6 z-20">
                     <div className="flex items-center gap-2 mb-3">
                        <Lock className="w-4 h-4 text-accent-green" />
                        <span className="text-white font-medium text-sm">Ontgrendel volledig rapport</span>
                     </div>
                     <Button className="bg-accent-green text-black font-semibold rounded-xl hover:bg-accent-green/90 shadow-lg">Bekijk voor €9,99</Button>
                  </div>
               </div>
            </div>

            <div className="flex-1 w-full text-center lg:text-left">
               <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-6">Wat je krijgt</h2>
               <p className="text-gray-400 text-lg mb-8 leading-relaxed font-light">
                  Ons rapport gaat veel verder dan een simpele prijsschattings-tool. We ontleden de advertentie alsof je een expert meeneemt naar de bezichtiging.
               </p>
               <ul className="space-y-4 mb-8 text-left max-w-md mx-auto lg:mx-0">
                  <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> Unieke <strong>DealScore (0-100)</strong></li>
                  <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> AI-gedetecteerde <strong>Rode Vlaggen</strong></li>
                  <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> AI <strong>Foto-analyse</strong> op roest en slijtage</li>
                  <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> Persoonlijk <strong>Onderhandelingsscript</strong></li>
               </ul>
            </div>
         </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-6 relative z-10 py-32" id="prijzen">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-6">Kies de zekerheid die <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">bij je past</span></h2>
        </motion.div>
        
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
               { text: "Rapportgeschiedenis & export", included: true },
               { text: "Bulk analyse (meerdere URL's)", included: true },
             ]}
             btnText={purchasing === "Autohandelaar" ? "Laden..." : "Start abonnement"}
             buttonStyle="outline-green"
             onClick={() => handlePurchase("Autohandelaar")}
          />
        </div>

        {/* Vertrouwensbalk */}
        <div className="max-w-4xl mx-auto border border-white/5 bg-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-sm text-gray-400 mb-10">
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

      {/* FAQ */}
      <div className="container mx-auto px-6 py-32 relative z-10 max-w-4xl">
         <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-12 text-center">Veelgestelde vragen</h2>
         <Accordion type="single" collapsible className="w-full space-y-4">
           {[
             { q: "Werkt het alleen voor Marktplaats?", a: "Nee, we ondersteunen momenteel zowel Marktplaats als AutoScout24." },
             { q: "Hoe nauwkeurig is de prijsanalyse?", a: "We vergelijken met 10–20 actuele vergelijkbare advertenties in heel Nederland op het moment van analyse." },
             { q: "Is mijn data veilig?", a: "We slaan alleen de analyseresultaten op, niet je persoonlijke gegevens. Je hoeft zelfs geen account te maken voor je eerste rapport." },
             { q: "Kan ik het rapport delen?", a: "Ja, elk rapport heeft een unieke deelbare link die je via WhatsApp of e-mail kunt sturen." },
             { q: "Hoe werkt de foto-analyse?", a: "Onze AI (Visual Intelligence) scant de foto's op kleurverschillen, spuitwerk, verborgen schades, deuken en slijtage aan het interieur." }
           ].map((faq, i) => (
             <AccordionItem value={`item-${i}`} key={i} className="bg-white/[0.02] border border-white/10 rounded-2xl px-6 data-[state=open]:bg-white/[0.05] transition-colors">
               <AccordionTrigger className="text-white hover:text-accent-green hover:no-underline font-semibold text-left py-6">{faq.q}</AccordionTrigger>
               <AccordionContent className="text-gray-400 font-light text-base leading-relaxed pb-6">
                 {faq.a}
               </AccordionContent>
             </AccordionItem>
           ))}
         </Accordion>
      </div>

      <Footer />
    </div>
  );
};
