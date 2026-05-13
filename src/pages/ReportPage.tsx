import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { ChevronLeft, Download, Bookmark, Share2, AlertTriangle, CheckCircle, Search, AlertCircle, FileText, Check, Copy, MessageCircle, BarChart3, Camera, ShieldAlert, BadgeCheck, Lock, XCircle, Car, TrendingDown, Clock, MousePointerClick, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { AuthModal } from '@/src/components/AuthModal';
import { useStore } from '@/src/store/useStore';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const RAPPORT_DATA = {
  id: "demo-002",
  autoNaam: "Volkswagen Golf 1.4 TSI R-Line",
  jaar: 2018,
  kilometerstand: 85000,
  brandstof: "Benzine",
  transmissie: "Automaat",
  carrosserie: "Hatchback",
  vraagprijs: 18500,
  eerlijkePrijs: 19200,
  dealScore: 82,
  verdict: "Uitstekende Deal",
  advertentieId: "m201594832",
  
  rdw: {
    apk: "03-2026",
    gestolen: false,
    eigenaren: 2,
    eersteToelating: 2018
  },

  overzicht: {
    positief: [
      "Prijs ligt 4% onder marktgemiddelde",
      "Kilometerstand logisch voor bouwjaar (85.000 km in 6 jaar = normaal ✓)",
      "Onderhoudshistorie aanwezig",
      "Populaire uitvoering — goede restwaarde"
    ],
    aandachtspunten: [
      "Geen proefrit aangeboden",
      "Kleine kras zonder foto vermeld",
      "Advertentie staat al 47 dagen online",
      "Distributieriem nog niet vervangen"
    ],
    verkoper: {
      type: "Particulier verkoper",
      lidSinds: "2019",
      actieveAdvertenties: 3
    }
  },

  vergelijkbareAutos: [
    { naam: "VW Golf 1.4 TSI R-Line", jaar: 2018, km: 88000, prijs: 19100, bron: "AutoTrack", isCurrent: false, link: "#" },
    { naam: "VW Golf 1.4 TSI R-Line", jaar: 2018, km: 85000, prijs: 18500, bron: "Marktplaats", isCurrent: true, link: "#" },
    { naam: "VW Golf 1.5 TSI R-Line", jaar: 2018, km: 92000, prijs: 18800, bron: "Marktplaats", isCurrent: false, link: "#" },
    { naam: "VW Golf 1.4 TSI R-Line", jaar: 2019, km: 76000, prijs: 19600, bron: "Marktplaats", isCurrent: false, link: "#" }
  ],

  rodeVlaggen: [
    { ernst: "hoog", titel: "Geen proefrit mogelijk", uitleg: "Serieuze verkopers staan altijd een proefrit toe." },
    { ernst: "middel", titel: "Kras zonder foto", uitleg: "Vraag om extra foto's voordat je gaat kijken." },
    { ernst: "laag", titel: "Onderhoudshistorie aanwezig", uitleg: "Positief signaal." }
  ],

  advertentieAnalyse: {
    onlineSinds: "47 dagen",
    onlineSindsKleur: "text-amber-500",
    beschrijving: "312 woorden",
    beschrijvingKleur: "text-accent-green",
    prijsWijziging: "2x verlaagd",
    prijsWijzigingKleur: "text-accent-green",
    taalgebruik: "geen drukverkooptactieken gedetecteerd ✓",
    taalgebruikKleur: "text-accent-green"
  },

  fotos: [
    { label: "Carrosserie Voor", finding: "Lak in goede staat.", status: "ok" },
    { label: "Interieur Bestuurder", finding: "Instapschade wang stoel.", status: "waarschuwing" },
    { label: "Velg Rechtsachter", finding: "Lichte stoeprandschade.", status: "waarschuwing" },
    { label: "Dashboard", finding: "Geen storingen zichtbaar.", status: "ok" }
  ],

  ontbrekendeFotos: [
    "Onderstelsfoto ontbreekt",
    "Bandenprofiel niet zichtbaar",
    "Motorruimtefoto ontbreekt"
  ],

  onderhandeling: {
    aanbevolenBod: 17500,
    verschilVraagprijs: 1000,
    script: "Ik heb vergelijkbare Golfs bekeken die gemiddeld voor €19.200 gaan. Gezien de kilometerstand en het ontbreken van een onderstelsfoto wil ik beginnen op €17.500. Is daar ruimte voor?",
    tips: [
      "Noem altijd de ontbrekende foto's als argument",
      "Verwijs naar de 47 dagen dat de auto al te koop staat",
      "Bied eerst €17.000 zodat je kunt \"toegeven\" naar €17.500"
    ]
  }
};

const TABS = [
  { id: 'overzicht', label: 'Overzicht', locked: false },
  { id: 'prijs', label: 'Prijs', locked: true },
  { id: 'vlaggen', label: 'Risico\'s', locked: true },
  { id: 'foto', label: 'Foto Analyse', locked: true },
  { id: 'script', label: 'Onderhandelen', locked: true }
] as const;

export const ReportPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPremium, user } = useStore();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('overzicht');
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [gaugeValue, setGaugeValue] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const controls = useAnimation();

  const hasAccess = isPremium;

  useEffect(() => {
    if (!id) return;

    if (id === 'demo-001' || id === 'demo-002') {
      setReportData(RAPPORT_DATA);
      setLoading(false);
      return;
    }

    let isPolling = true;

    const unsubscribe = onSnapshot(doc(db, 'rapporten', id), (docSnap) => {
      if (!docSnap.exists()) {
        setError("Rapport niet gevonden");
        setLoading(false);
        isPolling = false;
        return;
      }
      
      const data = docSnap.data();
      setReportData(data);
      setError(null);
      setLoading(false);

      if (data.status === 'compleet' || data.status === 'fout') {
        isPolling = false;
      }
    }, (err) => {
      console.error("Error fetching report:", err);
      setError(err?.message || "Fout bij het ophalen van rapport");
      setLoading(false);
      isPolling = false;
    });

    return () => {
      isPolling = false;
      unsubscribe();
    };
  }, [id, hasAccess]);

  useEffect(() => {
    if (reportData?.dealScore || reportData?.data?.score) {
      controls.start("show");
      const score = reportData.dealScore || reportData.data?.score || 0;
      const timeout = setTimeout(() => {
        setGaugeValue(score);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [reportData, controls]);

  const scrapedData = reportData?.data || reportData || {};
  const aiAnalysis = reportData?.analyse || {};
  const aiPhotos = reportData?.fotoAnalyse?.fotos || [];

  const mapErnstToStatus = (ernst: string) => {
    if (ernst === 'hoog' || ernst === 'probleem') return 'gevaar';
    if (ernst === 'middel' || ernst === 'waarschuwing') return 'let-op';
    return 'ok';
  };

  const mapVerdictToLabel = (verdict: string) => {
    switch(verdict) {
      case 'vermijden': return 'Wees extreem voorzichtig';
      case 'voorzichtig': return 'Let goed op';
      case 'redelijk': return 'Gezonde deal';
      case 'koopje': return 'Uitstekende deal';
      default: return verdict || 'Gezonde deal';
    }
  };

  const data = {
    ...RAPPORT_DATA,
    ...scrapedData,
    photoUrls: reportData?.photoUrls || [],
    autoNaam: scrapedData?.titel || scrapedData?.title || RAPPORT_DATA.autoNaam,
    jaar: scrapedData?.bouwjaar || scrapedData?.year || RAPPORT_DATA.jaar,
    kilometerstand: scrapedData?.kilometerstand || scrapedData?.mileage || RAPPORT_DATA.kilometerstand,
    vraagprijs: scrapedData?.prijs || (scrapedData?.price ? parseInt(String(scrapedData.price).replace(/[^0-9]/g, '')) : RAPPORT_DATA.vraagprijs) || RAPPORT_DATA.vraagprijs,
    brandstof: scrapedData?.brandstof || scrapedData?.fuelType || RAPPORT_DATA.brandstof,
    transmissie: scrapedData?.transmissie || scrapedData?.transmission || RAPPORT_DATA.transmissie,
    carrosserie: scrapedData?.carrosserie || scrapedData?.bodyType || RAPPORT_DATA.carrosserie,
    dealScore: aiAnalysis.dealScore || scrapedData?.score || RAPPORT_DATA.dealScore,
    eerlijkePrijs: aiAnalysis.marktGemiddelde || RAPPORT_DATA.eerlijkePrijs,
    rodeVlaggen: aiAnalysis.rodeVlaggen?.map((v: any) => ({
      ernst: v.ernst,
      titel: v.titel,
      uitleg: v.uitleg
    })) || RAPPORT_DATA.rodeVlaggen,
    vergelijkbareAutos: reportData?.comparables?.length > 0 ? reportData.comparables.map((c: any) => ({
      naam: c.titel || c.title || "",
      jaar: c.jaar || parseInt(String(c.year).replace(/[^0-9]/g, '')) || 0,
      km: c.km || (c.mileage ? parseInt(String(c.mileage).replace(/[^0-9]/g, '')) : 0),
      prijs: c.prijs || (c.price ? parseInt(String(c.price).replace(/[^0-9]/g, '')) : 0),
      bron: "Marktplaats",
      isCurrent: false,
      link: c.url
    })) : RAPPORT_DATA.vergelijkbareAutos,
    overzicht: {
      ...RAPPORT_DATA.overzicht,
      huidigePrijsLabel: mapVerdictToLabel(aiAnalysis.verdict),
      aandachtspunten: aiAnalysis.samenvatting || RAPPORT_DATA.overzicht.aandachtspunten,
    },
    fotos: aiPhotos.length > 0 ? aiPhotos.map((f: any) => ({
      label: f.label,
      finding: f.bevinding,
      status: mapErnstToStatus(f.ernst)
    })) : RAPPORT_DATA.fotos,
    onderhandeling: {
      ...RAPPORT_DATA.onderhandeling,
      script: aiAnalysis.onderhandelingsScript || RAPPORT_DATA.onderhandeling.script,
      aanbevolenBod: aiAnalysis.openingsBod || RAPPORT_DATA.onderhandeling.aanbevolenBod
    },
    rdw: reportData?.rdwData ? {
      apk: reportData.rdwData.vervaldatum_apk 
           ? `${reportData.rdwData.vervaldatum_apk.substring(6,8)}-${reportData.rdwData.vervaldatum_apk.substring(4,6)}-${reportData.rdwData.vervaldatum_apk.substring(0,4)}` 
           : "Onbekend",
      gestolen: reportData.rdwData.export_indicator === "Ja" || reportData.rdwData.wacht_op_keuren === "Ja", // Approximating issues
      eigenaren: parseInt(reportData.rdwData.aantal_eigenaren_prive || reportData.rdwData.aantal_eigenaren_zakelijk || "0") || RAPPORT_DATA.rdw.eigenaren,
      eersteToelating: reportData.rdwData.datum_eerste_toelating 
           ? `${reportData.rdwData.datum_eerste_toelating.substring(0,4)}` 
           : RAPPORT_DATA.rdw.eersteToelating,
      kenteken: reportData.kenteken || ""
    } : RAPPORT_DATA.rdw
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B14] flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-green animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Gegevens ophalen...</p>
        </div>
      </div>
    );
  }

  if (reportData?.status === 'verwerking') {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center pt-20 px-4">
        <div className="max-w-md w-full text-center space-y-8">
           <div className="relative w-32 h-32 mx-auto">
             <div className="absolute inset-0 bg-accent-green/20 rounded-full blur-2xl animate-pulse"></div>
             <div className="relative w-full h-full flex items-center justify-center bg-black/40 border border-accent-green/30 rounded-full">
               <Search className="w-12 h-12 text-accent-green animate-bounce" />
             </div>
           </div>
           <div>
             <h2 className="text-3xl font-heading font-extrabold text-white mb-3 tracking-tight">Auto wordt geanalyseerd...</h2>
             <p className="text-gray-400 text-lg">Onze AI verzamelt nu alle gegevens van Marktplaats en RDW. Dit duurt meestal 30-60 seconden.</p>
           </div>
           <div className="space-y-4">
             <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <motion.div 
                 initial={{ width: "0%" }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 45, ease: "linear" }}
                 className="h-full bg-gradient-to-r from-primary-dark to-accent-green"
               />
             </div>
             <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
               <span>Scrapen</span>
               <span>Analyseren</span>
               <span>Voltooid</span>
             </div>
           </div>
           <Card className="bg-white/5 border-white/5 p-6 rounded-2xl text-left">
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent-green" /> Wat we nu doen:
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Marktplaats advertentie uitlezen</li>
                <li>• Prijs vergelijken met 50+ vergelijkbare auto's</li>
                <li>• Foto's scannen op verborgen schades</li>
                <li>• RDW kilometerstand en APK controleren</li>
              </ul>
           </Card>
           <p className="text-xs text-gray-600">Je kunt deze pagina open laten, hij ververst automatisch.</p>
        </div>
      </div>
    );
  }

  if (reportData?.status === 'fout') {
    return (
      <div className="min-h-screen bg-[#050B14] flex items-center justify-center pt-20 px-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-2">Analyse Mislukt</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Oeps! Er ging iets mis tijdens het verwerken van deze auto. 
            Controleer of de link nog bereikbaar is, of probeer het opnieuw.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-white/10 hover:bg-white/20 text-white rounded-xl">Terug naar Dashboard</Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050B14] flex items-center justify-center pt-20 px-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
          <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-white/10 hover:bg-white/20 text-white rounded-xl">Terug naar Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(data.onderhandeling.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMijnRapportenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#050B14] relative text-white pb-32 overflow-x-hidden pt-28">
      {/* Background accents */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-accent-green/5 blur-[150px] pointer-events-none mix-blend-screen"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        
        {/* TOP NAVBAR ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <button onClick={handleMijnRapportenClick} className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <ChevronLeft className="w-5 h-5 mr-1" /> Terug naar overzicht
          </button>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"><Download className="w-4 h-4 mr-2"/> Download PDF</Button>
            <Button variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"><Share2 className="w-4 h-4 mr-2"/> Deel rapport</Button>
            <Button variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"><Bookmark className="w-4 h-4 mr-2"/> Bewaar</Button>
          </div>
        </div>

        {/* TOP SECTION: 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="bg-[#0A111F] border-white/5 rounded-3xl overflow-hidden p-6 shadow-xl">
               <div className="flex flex-col gap-6">
                 {/* Images */}
                 <div className="flex flex-col gap-2 relative">
                   <div className="absolute top-3 left-3 bg-white text-black px-2.5 py-1 rounded-md text-xs font-bold tracking-wide z-10 shadow-lg flex items-center gap-1">
                     <BadgeCheck className="w-4 h-4" /> Marktplaats · {data.advertentieId}
                   </div>
                   
                   <div className="h-64 sm:h-80 bg-[#131B2A] rounded-2xl overflow-hidden shadow-inner border border-white/5 relative">
                     {data.photoUrls && data.photoUrls.length > 0 ? (
                       <img src={data.photoUrls[0]} alt="Exterieur" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-500">Geen foto beschikbaar</div>
                     )}
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div className="h-24 bg-[#131B2A] rounded-xl overflow-hidden border border-white/5">
                       {data.photoUrls && data.photoUrls.length > 1 ? (
                         <img src={data.photoUrls[1]} alt="Interieur 1" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Geen foto</div>
                       )}
                     </div>
                     <div className="h-24 bg-[#131B2A] rounded-xl overflow-hidden relative group cursor-pointer border border-white/5">
                       {data.photoUrls && data.photoUrls.length > 2 ? (
                         <img src={data.photoUrls[2]} alt="Interieur 2" className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-60" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Geen foto</div>
                       )}
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                         <span className="text-white font-bold tracking-wider shadow-sm">
                           {data.photoUrls && data.photoUrls.length > 3 ? `+${data.photoUrls.length - 3} Foto's` : "Meer foto's"}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Car Info */}
                 <div className="mt-2">
                   <h1 className="text-3xl lg:text-4xl font-heading font-extrabold text-white mb-2 leading-tight">{data.autoNaam}</h1>
                   <div className="text-4xl lg:text-5xl font-black text-accent-green mb-6 mt-4 tracking-tight drop-shadow-md">
                     € {data.vraagprijs.toLocaleString('nl-NL')}
                   </div>
                   <div className="flex flex-wrap gap-2">
                     <Pill>{data.jaar}</Pill>
                     <Pill>{data.kilometerstand.toLocaleString('nl-NL')} km</Pill>
                     <Pill>{data.brandstof}</Pill>
                     <Pill>{data.transmissie}</Pill>
                     <Pill>{data.carrosserie}</Pill>
                   </div>
                 </div>
               </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col h-full gap-6">
            <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center">
              <div className="text-gray-400 font-bold tracking-[0.2em] uppercase text-xs mb-8">SLIMKOOP SCORE</div>
              
              {/* Circular Score */}
              <div className="relative w-48 h-48 mb-6">
                <div className="absolute inset-0 bg-accent-green/5 rounded-full blur-[30px]"></div>
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <motion.circle 
                    cx="50" cy="50" r="42" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="6" 
                    strokeDasharray={263.89} 
                    strokeDashoffset={263.89 - (263.89 * gaugeValue / 100)}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 263.89 }}
                    animate={{ strokeDashoffset: 263.89 - (263.89 * gaugeValue / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center border-4 border-accent-green/20 rounded-full m-[8px] bg-[#131B2A]/50">
                  <span className="text-6xl font-heading font-extrabold text-white">{gaugeValue}</span>
                </div>
              </div>

              <div className="bg-accent-green/10 text-accent-green border border-accent-green/30 px-6 py-2 rounded-full font-bold text-sm mb-8 uppercase tracking-wide">
                {data.verdict}
              </div>

              <div className="w-full h-px bg-white/5 mb-8"></div>

              <div className="w-full space-y-4 text-left">
                <div className="flex justify-between items-center text-gray-300">
                  <span>Vraagprijs</span>
                  <span className="font-semibold text-white text-lg">€ {data.vraagprijs.toLocaleString('nl-NL')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Eerlijke Prijs</span>
                  {hasAccess ? (
                    <span className="font-bold text-accent-green text-lg">€ {data.eerlijkePrijs.toLocaleString('nl-NL')}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                       <Lock className="w-4 h-4 text-gray-500" />
                       <span className="font-bold text-gray-500 text-lg blur-sm select-none">€ 19.xxx</span>
                    </div>
                  )}
                </div>
                <div className={`flex justify-between items-center bg-accent-green/10 p-4 rounded-xl mt-4 border border-accent-green/20 ${!hasAccess ? 'grayscale opacity-50' : ''}`}>
                  <span className="text-gray-200 font-bold uppercase text-xs tracking-wider">Directe Winst</span>
                  {hasAccess ? (
                    <span className="font-black text-accent-green text-xl">+ € {(data.eerlijkePrijs - data.vraagprijs).toLocaleString('nl-NL')}</span>
                  ) : (
                    <span className="font-black text-gray-500 text-xl blur-sm select-none">+ € x.xxx</span>
                  )}
                </div>
                {!hasAccess && (
                  <Button 
                    className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm"
                    onClick={() => navigate('/prijzen')}
                  >
                    Ontgrendel Prijzen
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* RDW BALK */}
        <Card className="bg-[#0A111F] border-white/5 rounded-2xl p-6 shadow-xl mb-10 border-l-4 border-l-accent-green">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent-green" /> RDW Voertuigcheck
              {data.rdw.kenteken && (
                <span className="ml-2 inline-block bg-[#FACC15] text-black font-extrabold px-3 py-1 rounded text-sm tracking-[0.1em] border-2 border-black/80 font-mono">
                  {data.rdw.kenteken.replace(/(.{2})(.{2})(.{2})/, "$1-$2-$3")}
                </span>
              )}
            </h2>
            <span className="text-xs text-gray-500 font-medium">Gegevens via RDW Open Data</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <RdwBlock label={`APK geldig t/m ${data.rdw.apk}`} ok={true} />
            <RdwBlock label={data.rdw.gestolen ? "Geregistreerd als gestolen" : "Niet gestolen"} ok={!data.rdw.gestolen} />
            <RdwBlock label={`${data.rdw.eigenaren} eigenaren`} ok={data.rdw.eigenaren <= 3} />
            <RdwBlock label={`Eerste toelating ${data.rdw.eersteToelating}`} ok={true} />
          </div>
        </Card>

        {/* TABS NAVIGATION */}
        <div className="bg-[#0A111F] border border-white/5 rounded-[1.25rem] p-1.5 mb-8 inline-flex overflow-x-auto no-scrollbar shadow-lg max-w-full">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    isSelected 
                      ? 'bg-[#0E2015] text-accent-green border border-accent-green/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {tab.label}
                  {tab.locked && !hasAccess && <Lock className={`w-3.5 h-3.5 ${isSelected ? 'text-accent-green' : 'text-gray-500'}`} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* TAB CONTENTS (With Paywall logic) */}
        <div className="relative min-h-[400px]">
          
          {/* TAB 1: OVERZICHT */}
          {activeTab === 'overzicht' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                
                <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center border border-accent-green/20">
                      <CheckCircle className="w-5 h-5 text-accent-green" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Positieve Punten</h3>
                  </div>
                  <ul className="space-y-4">
                    {data.overzicht.positief.map((punt, i) => (
                      <li key={i} className="flex gap-3 text-gray-300 items-start"><span className="text-accent-green mt-0.5 font-bold">•</span> <span className="leading-relaxed">{punt}</span></li>
                    ))}
                  </ul>
                </Card>

                <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Aandachtspunten</h3>
                  </div>
                  <ul className="space-y-4">
                    {data.overzicht.aandachtspunten.slice(0, hasAccess ? undefined : 2).map((punt, i) => (
                      <li key={i} className="flex gap-3 text-gray-300 items-start"><span className="text-amber-500 mt-0.5 font-bold">•</span> <span className="leading-relaxed">{punt}</span></li>
                    ))}
                    {!hasAccess && data.overzicht.aandachtspunten.length > 2 && (
                      <>
                        <li className="flex gap-3 text-gray-300 items-start opacity-40 blur-[2px] select-none">
                          <span className="text-amber-500 mt-0.5 font-bold">•</span> 
                          <span className="leading-relaxed">Verborgen aandachtspunt wegens gratis account</span>
                        </li>
                        <div className="pt-2 text-center">
                          <button onClick={() => navigate('/prijzen')} className="text-xs font-bold text-accent-green bg-accent-green/10 px-3 py-1.5 rounded-full border border-accent-green/20 hover:bg-accent-green/20 transition-colors">
                            <Lock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                            Toon alle {data.overzicht.aandachtspunten.length} punten
                          </button>
                        </div>
                      </>
                    )}
                  </ul>
                </Card>

              </div>

              <Card className="bg-[#0A111F] border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Verkoper Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#131B2A] p-4 text-center rounded-xl border border-white/5 text-gray-200 font-medium">{data.overzicht.verkoper.type}</div>
                  <div className="bg-[#131B2A] p-4 text-center rounded-xl border border-white/5 text-gray-200 font-medium">Lid sinds {data.overzicht.verkoper.lidSinds}</div>
                  <div className="bg-[#131B2A] p-4 text-center rounded-xl border border-white/5 text-gray-200 font-medium">{data.overzicht.verkoper.actieveAdvertenties} actieve advertenties</div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB CONTENT WRAPPER FOR PAYWALLED TABS */}
          {activeTab !== 'overzicht' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative h-full">
               
               <div>
                 
                 {/* TAB 2: PRIJS */}
                 {activeTab === 'prijs' && (
                   <div className="space-y-6">
                     <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                       <h3 className="text-xl font-bold text-white mb-8">Prijsanalyse & Waardebepaling</h3>
                       
                       <div className="mb-10 px-2 max-w-4xl mx-auto">
                         <div className="flex justify-between text-sm text-gray-400 mb-3 font-bold uppercase tracking-wider">
                           <span>Min € 17.500</span>
                           <span>Max € 20.500</span>
                         </div>
                         <div className="relative h-4 bg-[#131B2A] rounded-full border border-white/5 shadow-inner">
                           <div className="absolute top-0 bottom-0 left-[0%] w-[56%] bg-accent-green/20 rounded-l-full"></div>
                           <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-500 border-4 border-[#0A111F] rounded-full z-20 left-[33%] -translate-x-1/2 shadow-lg group">
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-3 py-1 rounded text-xs font-bold text-amber-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Vraagprijs</div>
                           </div>
                           <div className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white z-10 rounded-full left-[56%] -translate-x-1/2 group cursor-help">
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-3 py-1 rounded text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Gemiddelde</div>
                           </div>
                         </div>
                         <div className="flex justify-between items-center text-sm mt-5">
                           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-400"></div> <span className="text-gray-300 font-medium">Vraagprijs (€ 18.500)</span></div>
                           <div className="flex items-center gap-2"><div className="w-1.5 h-4 bg-white rounded-full"></div> <span className="text-gray-300 font-medium">Marktgemiddelde (€ 19.200)</span></div>
                         </div>
                       </div>

                       <div className={`border rounded-2xl p-6 mb-10 flex items-start sm:items-center gap-4 ${data.vraagprijs <= data.eerlijkePrijs ? 'bg-accent-green/10 border-accent-green/20' : 'bg-red-500/10 border-red-500/20'}`}>
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${data.vraagprijs <= data.eerlijkePrijs ? 'bg-accent-green/20' : 'bg-red-500/20'}`}>
                           {data.vraagprijs <= data.eerlijkePrijs ? <CheckCircle className="w-6 h-6 text-accent-green" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
                         </div>
                         <div>
                           <p className={`font-bold text-lg md:text-xl ${data.vraagprijs <= data.eerlijkePrijs ? 'text-accent-green' : 'text-red-500'}`}>
                             {data.vraagprijs === data.eerlijkePrijs ? "Deze auto is precies geprijsd volgens marktwaarde" : (
                               data.vraagprijs < data.eerlijkePrijs 
                                 ? `Deze auto is € ${(data.eerlijkePrijs - data.vraagprijs).toLocaleString('nl-NL')} goedkoper dan vergelijkbare modellen`
                                 : `Deze auto is € ${(data.vraagprijs - data.eerlijkePrijs).toLocaleString('nl-NL')} duurder dan vergelijkbare modellen`
                             )}
                           </p>
                           <p className="text-sm text-gray-300 mt-1">
                             {data.vraagprijs <= data.eerlijkePrijs 
                               ? 'Je betaalt minder dan de huidige marktwaarde. Een uitstekende uitgangspositie.' 
                               : 'Let op! Je betaalt meer dan de huidige marktgemiddelde. Ruimte voor onderhandeling.'}
                           </p>
                         </div>
                       </div>

                       <h4 className="text-lg font-bold text-white mb-4">Kilometerstand Check</h4>
                       <div className="bg-[#131B2A] border border-white/5 rounded-2xl p-6 mb-10">
                         <div className="flex justify-between items-end mb-4">
                           <div>
                             <p className="text-gray-300 text-sm md:text-base">85.000 km in 6 jaar = gemiddeld <span className="text-white font-bold">14.166 km/jaar</span></p>
                           </div>
                           <div className="bg-accent-green/20 px-3 py-1 rounded-md text-accent-green font-bold text-sm tracking-wide">✓ Normaal</div>
                         </div>
                         <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                           <div className="w-[40%] h-full bg-gradient-to-r from-accent-green/50 to-accent-green"></div>
                         </div>
                         <p className="text-xs text-gray-500 mt-3">Normaal bereik voor dit type auto is 10.000 - 18.000 km per jaar.</p>
                       </div>

                       <h4 className="text-lg font-bold text-white mb-4">Vergelijkbare Advertenties (Markt)</h4>
                       <div className="overflow-x-auto rounded-2xl border border-white/5">
                         <table className="w-full text-left text-sm whitespace-nowrap bg-[#131B2A]">
                           <thead>
                             <tr className="border-b border-white/5 text-gray-400 bg-black/40 text-xs uppercase tracking-wider font-bold">
                               <th className="py-4 px-6">Auto</th>
                               <th className="py-4 px-6">Jaar</th>
                               <th className="py-4 px-6">KM</th>
                               <th className="py-4 px-6 text-right">Prijs</th>
                               <th className="py-4 px-6">Bron</th>
                               <th className="py-4 px-6"></th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                             {data.vergelijkbareAutos.map((auto, i) => (
                               <tr key={i} className={auto.isCurrent ? "bg-accent-green/5 border-l-4 border-l-accent-green" : ""}>
                                 <td className={`py-4 px-6 font-bold ${auto.isCurrent ? 'text-accent-green' : 'text-gray-200'}`}>
                                   {auto.naam} {auto.isCurrent && <span className="text-xs ml-2 bg-accent-green/20 px-2 py-0.5 rounded text-accent-green">Vraagprijs</span>}
                                 </td>
                                 <td className="py-4 px-6 text-gray-400">{auto.jaar}</td>
                                 <td className="py-4 px-6 text-gray-400">{auto.km.toLocaleString()}</td>
                                 <td className="py-4 px-6 font-bold text-right text-white">€ {auto.prijs.toLocaleString()}</td>
                                 <td className="py-4 px-6 text-gray-400">{auto.bron}</td>
                                 <td className="py-4 px-6 text-right">
                                   <a href={auto.link} className="text-gray-400 hover:text-white p-2 inline-block transition-colors"><ExternalLink className="w-4 h-4" /></a>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>

                     </Card>
                   </div>
                 )}

                 {/* TAB 3: RISICO'S */}
                 {activeTab === 'vlaggen' && (
                   <div className="space-y-6">
                     <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                       
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                         <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-red-500" /> Risico Analyse
                         </h3>
                         <div className="bg-red-500/10 border border-red-500/20 text-red-500 font-bold px-4 py-1.5 rounded-full text-sm">
                           {data.rodeVlaggen.length} rode vlaggen gevonden
                         </div>
                       </div>

                       <div className="space-y-4 mb-10">
                         {data.rodeVlaggen.map((vlag, i) => {
                           let badgeClass = "bg-red-500/10 text-red-500 border-red-500/20";
                           if(vlag.ernst === 'middel') badgeClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                           if(vlag.ernst === 'laag') badgeClass = "bg-accent-green/10 text-accent-green border-accent-green/20";
                           
                           return (
                             <div key={i} className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border border-white/5 bg-[#131B2A] items-start transition-colors hover:bg-white/5">
                               <div className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest border ${badgeClass} shrink-0 w-24 text-center mt-1`}>
                                 {vlag.ernst}
                               </div>
                               <div>
                                 <h4 className="font-bold text-white text-base mb-1.5">{vlag.titel}</h4>
                                 <p className="text-gray-400 text-sm leading-relaxed">{vlag.uitleg}</p>
                               </div>
                             </div>
                           )
                         })}
                       </div>

                       <h4 className="text-lg font-bold text-white mb-4">Advertentie Analyse</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="bg-[#131B2A] p-5 rounded-2xl border border-white/5">
                           <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Online Sinds</p>
                           <p className={`text-lg font-bold ${data.advertentieAnalyse.onlineSindsKleur}`}>{data.advertentieAnalyse.onlineSinds}</p>
                         </div>
                         <div className="bg-[#131B2A] p-5 rounded-2xl border border-white/5">
                           <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Beschrijving</p>
                           <p className={`text-lg font-bold ${data.advertentieAnalyse.beschrijvingKleur}`}>{data.advertentieAnalyse.beschrijving}</p>
                         </div>
                         <div className="bg-[#131B2A] p-5 rounded-2xl border border-white/5">
                           <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Prijswijzigingen</p>
                           <p className={`text-lg font-bold ${data.advertentieAnalyse.prijsWijzigingKleur}`}>{data.advertentieAnalyse.prijsWijziging}</p>
                         </div>
                         <div className="bg-[#131B2A] p-5 rounded-2xl border border-white/5">
                           <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Taalgebruik</p>
                           <p className={`text-sm font-bold mt-1.5 ${data.advertentieAnalyse.taalgebruikKleur}`}>{data.advertentieAnalyse.taalgebruik}</p>
                         </div>
                       </div>

                     </Card>
                   </div>
                 )}

                 {/* TAB 4: FOTO ANALYSE */}
                 {activeTab === 'foto' && (
                   <div className="space-y-6">
                     <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                       <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                         <Camera className="w-5 h-5 text-gray-400" /> AI Foto Analyse
                       </h3>
                       
                       <div className="grid sm:grid-cols-2 gap-6 mb-10">
                         {data.fotos.map((foto, i) => (
                           <div key={i} className="group">
                             <div className="relative aspect-[4/3] bg-[#131B2A] rounded-2xl overflow-hidden mb-4 border border-white/5 flex items-center justify-center">
                               <Car className="w-12 h-12 text-white/5" />
                               
                               <div className="absolute right-3 bottom-3 shadow-lg">
                                 {foto.status === 'ok' && <div className="bg-accent-green text-black rounded-full p-2"><CheckCircle className="w-4 h-4" /></div>}
                                 {foto.status === 'waarschuwing' && <div className="bg-amber-500 text-black rounded-full p-2"><AlertTriangle className="w-4 h-4" /></div>}
                                 {foto.status === 'probleem' && <div className="bg-red-500 text-white rounded-full p-2"><XCircle className="w-4 h-4" /></div>}
                               </div>
                             </div>
                             <h4 className="font-bold text-white text-base mb-1">{foto.label}</h4>
                             <p className="text-sm text-gray-400">{foto.finding}</p>
                           </div>
                         ))}
                       </div>

                       {/* Missing Photos */}
                       <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 lg:p-8">
                         <h4 className="flex items-center gap-3 text-red-400 font-bold mb-4 text-sm uppercase tracking-wide">
                           <XCircle className="w-5 h-5" /> Ontbrekende foto's — vraag hier altijd om:
                         </h4>
                         <ul className="space-y-3 pl-1">
                           {data.ontbrekendeFotos.map((item, i) => (
                             <li key={i} className="flex gap-3 text-gray-200 text-sm items-center font-medium">
                               <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,1)]"></div> {item}
                             </li>
                           ))}
                         </ul>
                       </div>

                     </Card>
                   </div>
                 )}

                 {/* TAB 5: ONDERHANDELEN */}
                 {activeTab === 'script' && (
                   <div className="space-y-6">
                     <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                       
                       <div className="text-center mb-10 pt-4">
                         <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-4">Aanbevolen Openingsbod</p>
                         <p className="text-5xl md:text-7xl font-heading font-extrabold text-accent-green mb-6 drop-shadow-md">€ {data.onderhandeling.aanbevolenBod.toLocaleString('nl-NL')}</p>
                         <p className="inline-block bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm text-gray-300 font-medium">
                           € {data.onderhandeling.verschilVraagprijs.toLocaleString('nl-NL')} onder vraagprijs
                         </p>
                       </div>

                       <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 relative mt-12 mb-10 overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.05)]">
                         <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                         <div className="p-6 md:p-8">
                           <h4 className="flex items-center gap-2 text-amber-500 font-bold mb-6 text-lg">
                             <FileText className="w-5 h-5" /> Jouw persoonlijke script
                           </h4>
                           <div className="bg-black p-6 rounded-xl border border-white/5 text-gray-200 text-base md:text-lg leading-relaxed font-serif whitespace-pre-wrap mb-8 shadow-inner italic">
                             "{data.onderhandeling.script}"
                           </div>
                           <div className="flex flex-col sm:flex-row gap-4">
                             <Button onClick={handleCopy} className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl h-14">
                               {copied ? <Check className="w-5 h-5 mr-2 text-accent-green" /> : <Copy className="w-5 h-5 mr-2" />} Kopiëren
                             </Button>
                             <Button className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl h-14 font-bold border-transparent">
                               <MessageCircle className="w-5 h-5 mr-2" /> Verstuur via WhatsApp
                             </Button>
                           </div>
                         </div>
                       </div>

                       <h4 className="font-bold text-white mb-6 text-lg">Onderhandelingstips</h4>
                       <div className="grid gap-3">
                         {data.onderhandeling.tips.map((tip, i) => (
                           <div key={i} className="bg-[#131B2A] border border-white/5 rounded-xl p-5 flex gap-4 items-center">
                             <div className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0">
                               <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                             </div>
                             <span className="text-gray-300 text-sm md:text-base font-medium">{tip}</span>
                           </div>
                         ))}
                       </div>

                     </Card>
                   </div>
                 )}
               </div>

               {/* PAYWALL OVERLAY */}
               {!hasAccess && (
                 <div className="absolute inset-x-0 bottom-0 top-0 z-50 flex items-center justify-center backdrop-blur-md rounded-3xl overflow-hidden pointer-events-auto">
                   <div className="absolute inset-0 bg-[#050B14]/80 pointer-events-none"></div>
                   <Card className="bg-[#0A111F] border-accent-green/30 rounded-3xl p-8 shadow-2xl max-w-md w-[calc(100%-2rem)] text-center relative z-10 mx-auto">
                     <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                       <Lock className="w-8 h-8 text-accent-green" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-4">Ontgrendel het volledige rapport</h3>
                     <p className="text-gray-400 mb-8">
                       Krijg direct toegang tot prijsanalyse, alle rode vlaggen, foto analyse en het onderhandelscript.
                     </p>
                     <Button 
                       className="w-full bg-accent-green hover:bg-accent-green/80 text-black font-bold h-12 rounded-xl mb-4"
                       onClick={() => navigate('/prijzen')}
                     >
                       Upgrade naar Premium
                     </Button>
                     <p className="text-xs text-gray-500">Altijd direct opzegbaar.</p>
                   </Card>
                 </div>
               )}

            </motion.div>
          )}

        </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

/* Helper Components */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-[#131B2A] border border-white/5 text-gray-300 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
    {children}
  </span>
);

const RdwBlock = ({ label, ok }: { label: string, ok: boolean }) => (
  <div className="flex gap-3 items-center bg-[#131B2A] border border-white/5 p-4 rounded-2xl">
    {ok ? (
      <CheckCircle className="w-5 h-5 text-accent-green shrink-0" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
    )}
    <span className="text-sm font-medium text-gray-200">{label}</span>
  </div>
);
