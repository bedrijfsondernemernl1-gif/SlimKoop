import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Shield, Zap, Car, CheckCircle2, ArrowRight, Link as LinkIcon, Cpu, ShieldCheck, FileText, ChevronDown, AlertCircle, Lock, RotateCcw, Loader2, Gift } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Footer } from '@/src/components/Footer';
import { PricingCard } from '@/src/components/PricingCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/src/components/ui/accordion';
import { useStore } from '@/src/store/useStore';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { SEO } from '@/src/components/SEO';


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
  
  const user = useStore(state => state.user);
  const isLoggedIn = useStore(state => state.isLoggedIn);
  const openAuthModal = useStore(state => state.openAuthModal);
  const openScanLimitModal = useStore(state => state.openScanLimitModal);
  
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Coupon / Affiliate input states
  const [promoCode, setPromoCode] = useState('');
  const [isValidPromo, setIsValidPromo] = useState<boolean | null>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [promoText, setPromoText] = useState('');

  // Extract from query parameter code or coupon or affiliate
  useEffect(() => {
    const codeParam = searchParams.get('code') || searchParams.get('coupon') || searchParams.get('affiliate');
    if (codeParam) {
      const cleaned = codeParam.toUpperCase().trim();
      setPromoCode(cleaned);
      validateCouponCode(cleaned);
    }
  }, [searchParams]);

  const validateCouponCode = async (code: string) => {
    if (!code) {
      setIsValidPromo(null);
      setPromoText('');
      return;
    }
    setIsCheckingPromo(true);
    setPromoText('');
    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          packageName: 'Slimme Koper' // default validation package
        })
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setIsValidPromo(true);
        setPromoText(`✓ Code actief! Je ontvangt ${data.discountPercent}% partnerkorting op je aankoop.`);
      } else {
        setIsValidPromo(false);
        setPromoText(data.error || '✗ Ongeldige of verlopen kortingscode.');
      }
    } catch (err) {
      console.error("Fout bij controleren promo:", err);
      setIsValidPromo(false);
      setPromoText('✗ Fout bij couponcontrole.');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handlePurchase = async (title: string, couponCode: string | null = null, sepaData?: any) => {
    console.log("handlePurchase clicked for:", title, "sepa:", !!sepaData);
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

      const codeToApply = couponCode || (isValidPromo ? promoCode : null);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          userEmail: user.email,
          code: codeToApply,
          mode: title === "Autohandelaar" ? "subscription" : "payment",
          ...sepaData
        })
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error("Mollie session error:", data);
        alert(data.error || "Er is een fout opgetreden bij het opstarten van de betaling. Probeer het later opnieuw.");
      }
    } catch (error) {
      console.error("Fout tijdens handlePurchase:", error);
      alert("Er is een fout opgetreden bij het verbinden met de betaalservice. Probeer het later opnieuw.");
    } finally {
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
    if (!isLoggedIn || !user) {
      openAuthModal();
      return;
    }
    if (url) {
      setIsLoading(true);
      try {
        const res = await fetch('/api/analyseer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, userId: user.uid })
        });
        
        if (res.status === 403) {
          openScanLimitModal();
          return;
        }

        const data = await res.json();
        if (res.ok && data.success) {
          navigate(`/rapport/${data.rapportId}`);
        } else {
          if (data.error === 'Gratis limiet bereikt' || (data.message && data.message.includes('gratis scan'))) {
            openScanLimitModal();
          } else {
            alert('Fout bij analyseren: ' + (data.message || data.error || 'Onbekende fout'));
          }
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
      <SEO 
        title="OccasionScan — Auto Check & Schade Scan voor Tweedehands Auto's"
        description="Tweedehands auto kopen? Doe een grondige auto check met OccasionScan. Onthul verborgen schade, doe een kilometerstand check en bepaal de auto waarde."
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "OccasionScan",
            "url": "https://occasionscan.nl/",
            "image": "https://i.ibb.co/0yGyYTqW/Screen-Shot-Tool-20260519181200.png",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "All",
            "browserRequirements": "Requires HTML5",
            "description": "Premium AI-aangedreven auto check en schade scan tool voor tweedehands auto's op Marktplaats en AutoScout24."
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "OccasionScan",
            "url": "https://occasionscan.nl/",
            "logo": "https://occasionscan.nl/favicon.ico"
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Wat is een auto check?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Een auto check is een grondige controle van een tweedehands voertuig op basis van RDW-gegevens en online advertentiedata om de betrouwbaarheid, kilometerstand en eventuele verborgen gebreken te onthullen."
                }
              },
              {
                "@type": "Question",
                "name": "Hoe werkt een RDW APK check?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Met onze RDW APK check halen we direct de officiële kilometerstand, APK-vervaldatum en voertuighistorie op uit de RDW database. Onze AI analyseert deze data vervolgens om eventuele onregelmatigheden te signaleren."
                }
              },
              {
                "@type": "Question",
                "name": "Kan ik een schade check auto gratis uitvoeren?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Ja, met onze basis scan kun je een kenteken check gratis uitvoeren en direct belangrijke openbare RDW-gegevens inzien om schade en kilometerstand-onregelmatigheden op te sporen."
                }
              }
            ]
          }
        ]}
      />
      
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
        className="container mx-auto px-6 pt-32 pb-16 md:pt-48 md:pb-32 relative z-10 flex flex-col items-center text-center"
      >
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-4xl w-full flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-6 md:mb-8 shadow-sm bg-black/40 backdrop-blur-xl">
            <Search className="w-4 h-4 text-accent-green" />
            <span className="text-sm font-medium text-white whitespace-nowrap">AI-gedreven autoanalyse</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight mb-6 md:mb-8 leading-tight text-white flex flex-col items-center">
            <span>AI die jou beschermt</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">
               tegen slechte auto's.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-gray-300 text-base md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Plak een Marktplaats of AutoScout24 link. Ontvang binnen 60 seconden een AI-rapport met DealScore, rode vlaggen en een onderhandelingsscript.
          </motion.p>
          
          <motion.form variants={itemVariants} onSubmit={handleAnalyze} className="flex flex-col gap-4 items-center w-full max-w-2xl mx-auto relative z-20">
            <div className="relative w-full group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-dark/50 to-accent-green/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative flex items-center bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl focus-within:border-accent-green/50 transition-colors duration-300">
                <Search className="absolute left-4 md:left-6 h-5 md:h-6 w-5 md:w-6 text-gray-400" />
                <Input 
                  type="url" 
                  placeholder="Marktplaats of AutoScout24 link..." 
                  className="pl-12 md:pl-16 pr-6 h-16 md:h-20 w-full bg-transparent border-0 text-base md:text-lg text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Button disabled={isLoading} type="submit" size="xl" className="w-full md:w-auto h-14 md:h-16 px-8 md:px-10 text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl bg-accent-green hover:bg-accent-green/90 text-black font-semibold transition-all duration-300 group">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 
                <>
                  Analyseer deze auto
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              }
            </Button>
            
            <p className="text-xs md:text-sm text-gray-500 flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-accent-green" /> Eerste analyse gratis
            </p>
          </motion.form>
        </motion.div>
      </motion.div>

      {/* Trust bar */}
      <div className="border-y border-white/5 bg-black/20 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-6 py-6 md:py-8 font-medium text-gray-400">
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-6 sm:gap-x-12 sm:gap-y-4 lg:gap-16 text-sm">
             <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-white font-bold text-lg">4.200+</span> <span>analyses uitgevoerd</span>
             </div>
             <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-white/10"></div>
             <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Gemiddeld</span> <span className="text-accent-green font-bold text-lg">€1.800</span> <span>bespaard</span>
             </div>
             <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-white/10"></div>
             <div className="flex items-center gap-2 text-yellow-500 whitespace-nowrap">
                ⭐ <span className="text-white font-bold text-lg ml-1">4.8/5</span> <span>beoordeling</span>
             </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-6 relative z-10 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-accent-green font-bold tracking-widest uppercase text-sm mb-4"
              >
                Jouw voordeel
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-heading font-extrabold text-white"
              >
                Waarom kiezen voor <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">OccasionScan?</span>
              </motion.h2>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-gray-400 max-w-sm text-sm leading-relaxed"
            >
              We combineren geavanceerde AI met real-time marktdata om je een oneerlijk voordeel te geven bij de aankoop van je volgende auto.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BenefitCard 
              icon={ShieldCheck}
              title="Bespaar duizenden euro's"
              desc="Voorkom verborgen gebreken en dure reparaties door onze diepe AI-scan van elk voertuig."
              delay={0.1}
            />
            <BenefitCard 
              icon={Zap}
              title="Onderhandel met data"
              desc="Ga de onderhandeling in met een feitelijk script en de exacte DealScore om de prijs te drukken."
              delay={0.2}
            />
            <BenefitCard 
              icon={RotateCcw}
              title="Snelheid van AI"
              desc="Geen urenlang uitzoekwerk meer. Ontvang binnen 60 seconden een volledig en diepgaand rapport."
              delay={0.3}
            />
            <BenefitCard 
              icon={Cpu}
              title="Visual Intelligence"
              desc="Onze AI analyseert foto's op een niveau dat het menselijk oog vaak mist, zoals overspuitwerk."
              delay={0.4}
            />
          </div>
        </div>
      </div>

      {/* Hoe het werkt Section */}
      <div id="hoe-het-werkt" className="container mx-auto px-6 relative z-10 py-16 md:py-32">
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
      <div className="container mx-auto px-6 relative z-10 py-16 md:py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
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
                     <Button 
                       onClick={() => {
                         const el = document.getElementById('prijzen');
                         if (el) el.scrollIntoView({ behavior: 'smooth' });
                       }}
                       className="bg-accent-green text-black font-semibold rounded-xl hover:bg-accent-green/90 shadow-lg"
                     >
                       Bekijk voor €9,99
                     </Button>
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
      <div className="container mx-auto px-6 relative z-10 py-16 md:py-32" id="prijzen">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-6">Kies de zekerheid die <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">bij je past</span></h2>
        </motion.div>

        {/* Coupon input field for influencer discount codes */}
        <div className="max-w-md mx-auto mb-16 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl relative z-20">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <div className="absolute -inset-0.5 bg-accent-green/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-accent-green/30">
                <Gift className="absolute left-3.5 h-4 w-4 text-gray-500 group-focus-within:text-accent-green transition-colors" />
                <Input 
                  type="text" 
                  placeholder="HEB JE EEN PARTNERCODE?" 
                  value={promoCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setPromoCode(val);
                    if (!val) {
                      setIsValidPromo(null);
                      setPromoText('');
                    }
                  }}
                  className="pl-10 pr-4 h-10 w-full bg-transparent border-0 text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 font-bold tracking-wide uppercase text-xs"
                />
              </div>
            </div>
            <Button 
              onClick={() => validateCouponCode(promoCode)}
              disabled={isCheckingPromo}
              className="h-10 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold shrink-0"
            >
              {isCheckingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : 'Toepassen'}
            </Button>
          </div>
          {promoText && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs mt-2 text-center font-medium ${isValidPromo ? 'text-accent-green' : 'text-red-400'}`}
            >
              {promoText}
            </motion.p>
          )}
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
               { text: "Indicatieve reparatiekosten tabel", included: true },
               { text: "Volgende stappen actieplan", included: true },
               { text: "RDW open-data & kilometerstand check", included: true },
               { text: "Gepersonaliseerde proefrit checklist", included: false },
               { text: "Geavanceerde AI Foto-scan", included: false },
               { text: "Persoonlijk onderhandelingsscript", included: false },
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
               { text: "Gepersonaliseerde proefrit checklist", included: true },
               { text: "Indicatieve reparatiekosten tabel", included: true },
               { text: "Volgende stappen actieplan", included: true },
               { text: "Geavanceerde AI Foto-scan", included: true },
               { text: "Persoonlijke onderhandelingsscripts (openingsbod, tegenbod, weglopen)", included: true },
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
             description="De ultieme tool voor dealers en professionals die maximale winst en snelheid eisen."
             badgeText="MEEST COMPLEET"
             features={[
               { text: "Onbeperkt aantal scans per maand", included: true },
               { text: "Volledige toegang tot alle Slimme Koper functionaliteiten", included: true },
               { text: "Inclusief proefrit checklist & reparatiekosten tabel", included: true },
               { text: "Eindeloze rapporthistorie & PDF-export archivering", included: true },
               { text: "Diepgaande RDW-check voorraad-integratie & APK-historie", included: true },
               { text: "Exclusieve AI Foto-scan op verborgen schades", included: true },
               { text: "Persoonlijke onderhandelingsscripts (openingsbod, tegenbod, weglopen)", included: true },
               { text: "Snelle premium e-mailondersteuning bij vragen", included: true },
               { text: "Eenvoudig rapporten exporteren naar PDF of printen", included: true },
             ]}
             btnText={purchasing === "Autohandelaar" ? "Laden..." : "Word Autohandelaar"}
             isDealer={true}
             featured={false}
             disabled={false}
             buttonStyle="dealer-premium"
             onClick={() => handlePurchase("Autohandelaar")}
          />
        </div>

        {/* Vertrouwensbalk */}
        <div className="max-w-4xl mx-auto border border-white/5 bg-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-sm text-gray-400 mb-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-green" />
            Veilig betalen via Mollie
          </div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent-green" />
            Onbeperkt rapporten en alle functies met vast abonnement
          </div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-green" />
            Onafhankelijk en objectief
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-6 relative z-10 py-16 md:py-32 bg-accent-green/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-accent-green font-bold tracking-[0.2em] uppercase text-xs mb-4"
            >
              Klant Ervaringen
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-6"
            >
              Wat onze gebruikers <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-400">zeggen</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 max-w-2xl mx-auto font-light leading-relaxed"
            >
              Duizenden autokopers vertrouwen op OccasionScan om de beste deal te vinden en miskopen te voorkomen.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Dankzij OccasionScan ontdekte ik dat de auto waarin ik geïnteresseerd was, een verborgen schadeverleden had. Heeft me duizenden euro's bespaard!"
              author="Mark de V."
              role="Particuliere koper"
              delay={0.1}
            />
            <TestimonialCard 
              quote="De DealScore is geniaal. Het geeft me direct het vertrouwen om wel of niet te gaan kijken. Onmisbaar voor elke serieuze autokoper."
              author="Sophie L."
              role="SUV Zoekende"
              delay={0.2}
            />
            <TestimonialCard 
              quote="Als handelaar gebruik ik dit dagelijks. Het versnelt mijn proces enorm en de foto-analyse is verbluffend nauwkeurig."
              author="Jeroen B."
              role="Autohandelaar"
              delay={0.3}
            />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="container mx-auto px-6 py-16 md:py-32 relative z-10 max-w-4xl">
         <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-12 text-center">Veelgestelde vragen</h2>
         <Accordion type="single" collapsible className="w-full space-y-4">
           {[
             { q: "Wat is een auto check?", a: "Een auto check met OccasionScan is een diepgaande controle van een tweedehands auto op basis van het kenteken, RDW-gegevens en online advertentiedata. Zo ontdek je de betrouwbaarheid, kilometerstand en eventuele verborgen gebreken voordat je tot aankoop overgaat." },
              { q: "Hoe werkt een RDW APK check?", a: "Via onze RDW apk check halen we direct de officiële kilometerstand, APK rdw check-historie en openbare RDW-voertuiggegevens op. Onze AI analyseert deze data vervolgens om eventuele onregelmatigheden zoals logische of onlogische tellerstanden te signaleren." },
              { q: "Kan ik een schade check auto gratis uitvoeren?", a: "Ja, met onze basis scan kun je een kenteken check gratis uitvoeren. Je krijgt direct inzicht in de RDW apk check statussen en basale voertuigkenmerken om verborgen gebreken van de auto te herkennen." },
             { q: "Hoe nauwkeurig is de AI auto analyse?", a: "Onze AI auto analyse vergelijkt de advertentie met 10-20 actuele vergelijkbare occasions in heel Nederland en scant de foto's op eventuele schade, kleurverschillen en interieurslijtage om een betrouwbare DealScore te bepalen." },
             { q: "Is mijn data veilig?", a: "Ja, je data is veilig. We verwerken en beveiligen je persoonlijke gegevens in overeenstemming met ons privacybeleid en de geldende privacywetgeving (AVG), waaronder de opslag van contactgegevens voor account- en bestelbeheer." },
             { q: "Kan ik het rapport delen met anderen?", a: "Zeker! Elk rapport krijgt een unieke, deelbare link. Handig om te overleggen met een expert of om te gebruiken tijdens het onderhandelen over de tweedehands auto." },
             { q: "Hoe helpt de tool bij het onderhandelen over een tweedehands auto?", a: "Elk eindrapport bevat een persoonlijk, AI-gegenereerd onderhandelingsscript op basis van de gevonden minpunten en openstaande RDW-punten, zodat je sterk staat bij de verkoper." }
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

/* Helper Components */
const BenefitCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="glass-panel border-white/10 p-8 rounded-3xl group hover:border-accent-green/30 transition-all duration-500 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-accent-green/10 transition-colors"></div>
    <div className="w-14 h-14 rounded-2xl bg-accent-green/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
      <Icon className="w-7 h-7 text-accent-green" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm font-light">{desc}</p>
  </motion.div>
);

const TestimonialCard = ({ quote, author, role, delay }: { quote: string, author: string, role: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -10, scale: 1.02 }}
    className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] relative flex flex-col h-full group hover:border-accent-green/30 hover:bg-white/[0.05] transition-all duration-500 shadow-2xl hover:shadow-accent-green/10"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-accent-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]"></div>
    <div className="flex gap-1 mb-6 relative z-10">
      {[1, 2, 3, 4, 5].map((s) => (
        <motion.span 
          key={s} 
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delay + (s * 0.1) }}
          className="text-yellow-500 text-sm"
        >
          ⭐
        </motion.span>
      ))}
    </div>
    <p className="text-gray-300 italic mb-8 flex-grow leading-relaxed relative z-10 group-hover:text-white transition-colors duration-300">"{quote}"</p>
    <div className="flex items-center gap-4 pt-6 border-t border-white/5 relative z-10">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-green to-emerald-600 flex items-center justify-center text-black font-bold text-sm shadow-inner group-hover:scale-110 transition-transform duration-300">
        {author.charAt(0)}
      </div>
      <div>
        <div className="text-white font-bold text-sm group-hover:text-accent-green transition-colors duration-300">{author}</div>
        <div className="text-gray-500 text-xs tracking-wide uppercase">{role}</div>
      </div>
    </div>
  </motion.div>
);
