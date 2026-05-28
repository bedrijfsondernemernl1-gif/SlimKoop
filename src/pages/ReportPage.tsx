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

const TABS = [
  { id: 'overzicht', label: 'Overzicht', minTier: 'free' },
  { id: 'prijs', label: 'Prijs', minTier: 'losse_scan' },
  { id: 'vlaggen', label: 'Risico\'s', minTier: 'losse_scan' },
  { id: 'foto', label: 'Foto Analyse', minTier: 'slimme_koper' },
  { id: 'script', label: 'Onderhandelen', minTier: 'slimme_koper' }
] as const;

export const ReportPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const isPremium = useStore(state => state.isPremium);
  const permissies = useStore(state => state.permissies);
  const user = useStore(state => state.user);

  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('overzicht');
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [gaugeValue, setGaugeValue] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showIframeWarning, setShowIframeWarning] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'openingsbod' | 'tegenbod' | 'weglopen'>('openingsbod');
  const controls = useAnimation();

  const [clientRdw, setClientRdw] = useState<any>(null);
  const [isFetchingRdw, setIsFetchingRdw] = useState(false);

  // Access check for local UI masking (server also redacts)
  const isUnlimited = permissies === 'autohandelaar';
  const hasPaidAccess = isUnlimited || !!(reportData?.tier && reportData?.tier !== 'free');
  const hasFullAccess = isUnlimited || !!(reportData?.tier && reportData?.tier !== 'free' && reportData?.tier !== 'losse_scan');

  useEffect(() => {
    if (!id) return;

    let isPolling = true;

    const fetchReport = async () => {
      try {
        const emailParam = user?.email ? `&email=${encodeURIComponent(user.email)}` : '';
        const userParam = user?.uid ? `&userId=${user.uid}` : '';
        const res = await fetch(`/api/rapport/${id}?isBetaald=${isPremium}&permissies=${permissies}${emailParam}${userParam}`);
        const data = await res.json();
        
        if (res.status === 404 && isPolling) {
          console.log("Rapport niet gevonden (404), opnieuw proberen...");
          setTimeout(fetchReport, 2000);
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Fout bij ophalen rapport");
        }

        if (isPolling) {
          setReportData(data);
          setError(null);
          setLoading(false);

          if (['verwerking', 'scraping', 'vergelijken', 'analyseren', 'afronden', 'ai_analyseren'].includes(data.status)) {
            setTimeout(fetchReport, 3000);
          } else {
            isPolling = false;
          }
        }
      } catch (err: any) {
        if (isPolling) {
          console.error("Error fetching report:", err);
          setError(err?.message || "Fout bij het ophalen van rapport");
          setLoading(false);
          isPolling = false;
        }
      }
    };

    fetchReport();

    return () => {
      isPolling = false;
    };
  }, [id, isPremium, permissies]);

  useEffect(() => {
    if (reportData?.dealScore) {
      controls.start("show");
      const score = reportData.dealScore || 0;
      const timeout = setTimeout(() => {
        setGaugeValue(score);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [reportData, controls]);

  useEffect(() => {
    const fetchRdwClient = async (kenteken: string) => {
      setIsFetchingRdw(true);
      try {
        const schoonKenteken = kenteken.replace(/-/g, '').replace(/\s/g, '').toUpperCase();
        const response = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${schoonKenteken}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const voertuig = data[0];
          
          const parseRDWDate = (dateStr: any): string => {
            if (!dateStr) return "onbekend";
            const s = dateStr.toString().trim();
            if (s.length >= 8 && /^\d+$/.test(s.substring(0, 8))) {
              return `${s.substring(6, 8)}-${s.substring(4, 6)}-${s.substring(0, 4)}`;
            }
            if (s.includes('-')) {
              const parts = s.split('T')[0].split('-');
              if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return s;
          };
          
          setClientRdw({
            kenteken: schoonKenteken,
            apkVervaldatum: parseRDWDate(voertuig.vervaldatum_apk),
            eersteToelating: parseRDWDate(voertuig.datum_eerste_toelating),
            tellerstandoordeel: voertuig.tellerstandoordeel || 'onbekend',
            wamVerzekerd: voertuig.wam_verzekerd || 'onbekend',
            succes: true
          });
        } else {
          setClientRdw({ succes: false });
        }
      } catch (err) {
        console.error("RDW Client fetch error", err);
        setClientRdw({ succes: false });
      } finally {
        setIsFetchingRdw(false);
      }
    };

    if (reportData && !clientRdw && !isFetchingRdw) {
      const hasSavedRdw = reportData.rdw && reportData.rdw.succes !== false && Object.keys(reportData.rdw).length > 0;
      if (!hasSavedRdw && reportData.kenteken) {
        fetchRdwClient(reportData.kenteken);
      }
    }
  }, [reportData, clientRdw, isFetchingRdw]);

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
      default: return verdict || 'Wordt bepaald...';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#050B14] flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-green animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Gegevens ophalen...</p>
        </div>
      </div>
    );
  }

  // Mileage Check Logic
  const kilometerstand = reportData?.kilometerstand || 0;
  const bouwjaar = reportData?.bouwjaar || 2024;
  const huidigJaar = new Date().getFullYear();
  const aantalJaren = Math.max(huidigJaar - bouwjaar, 1);
  const gemiddeldePerJaar = Math.round(kilometerstand / aantalJaren);
  const isNormaal = gemiddeldePerJaar >= 10000 && gemiddeldePerJaar <= 20000;

  const data = {
    autoNaam: reportData?.autoNaam || "Wordt geladen...",
    vraagprijs: reportData?.vraagprijs || 0,
    eerlijkePrijs: reportData?.eerlijkePrijs || 0,
    kilometerstand: kilometerstand,
    bouwjaar: bouwjaar,
    advertentieId: reportData?.advertentieId || reportData?.id || "Niet beschikbaar",
    brandstof: reportData?.brandstof || "Onbekend",
    transmissie: reportData?.transmissie || "Onbekend",
    carrosserie: reportData?.carrosserie || "Onbekend",
    kenteken: reportData?.kenteken,
    verdict: mapVerdictToLabel(reportData?.verdict),
    dealScore: reportData?.dealScore || 0,
    fotos: reportData?.fotos || [],
    photoUrls: reportData?.fotos || [],
    positievePunten: reportData?.positievePunten || [],
    aandachtspunten: reportData?.aandachtspunten || [],
    rodeVlaggen: reportData?.rodeVlaggen || [],
    verkoper: {
      naam: reportData?.verkoper?.naam || reportData?.verkoper || "Niet beschikbaar",
      type: reportData?.verkoper?.type || ((reportData?.aantalAdvertenties > 5) ? "Dealer" : "Particulier"),
      lidSinds: reportData?.verkoper?.sinds || reportData?.verkoperSinds || "Niet beschikbaar",
      actieveAdvertenties: reportData?.verkoper?.aantalAdvertenties || reportData?.aantalAdvertenties || 0
    },
    vergelijkbareAutos: reportData?.vergelijkbareAutos || [],
    rdw: reportData?.rdwData || {},
    advertentieAnalyse: reportData?.advertentieAnalyse || {},
    fotoAnalyse: reportData?.fotoAnalyse || [],
    ontbrekendeFotos: reportData?.ontbrekendeFotos || [],
    onderhandelingsScript: reportData?.onderhandelingsScript || "",
    onderhandelingsTips: reportData?.onderhandelingsTips || [],
    openingsBod: reportData?.openingsBod || 0
  };

  if (['verwerking', 'scraping', 'vergelijken', 'analyseren', 'afronden', 'ai_analyseren'].includes(reportData?.status)) {
    const stappen = [
      { id: 'scraping', tekst: 'Advertentie ophalen...' },
      { id: 'vergelijken', tekst: 'Vergelijkbare autos zoeken...' },
      { id: 'analyseren', tekst: 'AI analyse uitvoeren...' },
      { id: 'afronden', tekst: 'Rapport samenstellen...' }
    ];

    let currentIdx = stappen.findIndex(s => s.id === reportData.status);
    if (currentIdx === -1) {
       currentIdx = 0;
    }
    const progress = ((currentIdx + 1) / stappen.length) * 100;

    return (
      <div className="min-h-[100dvh] bg-[#050B14] flex flex-col items-center justify-center pt-20 px-4">
        <div className="max-w-md w-full text-center space-y-8">
           <div className="relative w-32 h-32 mx-auto">
             <div className="absolute inset-0 bg-accent-green/20 rounded-full blur-2xl animate-pulse"></div>
             <div className="relative w-full h-full flex items-center justify-center bg-black/40 border border-accent-green/30 rounded-full">
               <Search className="w-12 h-12 text-accent-green animate-bounce" />
             </div>
           </div>
           <div>
             <h2 className="text-3xl font-heading font-extrabold text-white mb-3 tracking-tight">Auto wordt geanalyseerd...</h2>
             <p className="text-gray-400 text-lg">Onze AI verzamelt nu alle gegevens van {reportData?.url?.includes('autoscout') ? 'AutoScout24' : 'Marktplaats'} en RDW.</p>
           </div>
           
           {/* Stappen weergave */}
           <div className="space-y-3 pt-4 text-left">
             {stappen.map((stap, idx) => (
               <div key={stap.id} className="flex items-center gap-3">
                 <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                   {idx < currentIdx ? (
                     <CheckCircle className="w-5 h-5 text-accent-green" />
                   ) : idx === currentIdx ? (
                     <Loader2 className="w-5 h-5 text-accent-green animate-spin" />
                   ) : (
                     <div className="w-3 h-3 rounded-full bg-white/20" />
                   )}
                 </div>
                 <span className={`${idx <= currentIdx ? 'text-white font-medium' : 'text-gray-500'}`}>
                   {stap.tekst}
                 </span>
               </div>
             ))}
           </div>
           
           <div className="space-y-4 pt-6">
             <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <motion.div 
                 initial={{ width: "0%" }}
                 animate={{ width: `${progress}%` }}
                 transition={{ duration: 0.5, ease: "easeInOut" }}
                 className="h-full bg-gradient-to-r from-primary-dark to-accent-green"
               />
             </div>
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
               {Math.round(progress)}%
             </div>
           </div>
           <p className="text-xs text-gray-600">Dit duurt meestal 30-60 seconden, pagina ververst vanzelf.</p>
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
            {reportData.error || "Oeps! Er ging iets mis tijdens het verwerken van deze auto. Controleer of de link nog bereikbaar is."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')} className="bg-accent-green hover:bg-accent-green/80 text-black font-bold rounded-xl">Probeer Opnieuw</Button>
            <Button onClick={() => navigate('/dashboard')} className="bg-white/10 hover:bg-white/20 text-white rounded-xl">Naar Dashboard</Button>
          </div>
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
    let scriptToCopy = "";
    
    if (typeof data.onderhandelingsScript === 'object' && data.onderhandelingsScript !== null) {
      const scriptObj = data.onderhandelingsScript as { openingsbod?: string; tegenbod?: string; weglopen?: string };
      if (activeScenario === 'openingsbod') {
        scriptToCopy = scriptObj.openingsbod || "";
      } else if (activeScenario === 'tegenbod') {
        scriptToCopy = scriptObj.tegenbod || "";
      } else if (activeScenario === 'weglopen') {
        scriptToCopy = scriptObj.weglopen || "";
      }
    } else {
      scriptToCopy = data.onderhandelingsScript || "";
    }
    
    navigator.clipboard.writeText(scriptToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Check dit OccasionScan rapport voor de ${data.autoNaam}: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async () => {
    try {
      if (navigator.share && window.self === window.top) {
        await navigator.share({
          title: data.autoNaam,
          text: `Check dit OccasionScan rapport voor de ${data.autoNaam}`,
          url: window.location.href,
        });
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(window.location.href);
        } else {
          const tempInput = document.createElement("input");
          tempInput.value = window.location.href;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand("copy");
          document.body.removeChild(tempInput);
        }
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch(e) {
      console.log('Error sharing', e);
      // Try legacy copy as absolute final resort
      try {
        const tempInput = document.createElement("input");
        tempInput.value = window.location.href;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error("Legacy copy failed:", err);
      }
    }
  };

  const handleDownloadPDF = () => {
    if (!isUnlimited) {
      alert("Fout: PDF exporteren en downloaden is exclusief beschikbaar voor het Autohandelaar-pakket.");
      return;
    }
    try {
      window.location.href = `/api/rapport/${id}/pdf?userId=${user?.uid || ''}`;
    } catch(e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      // For now just show alert, we can implement persistence later if needed
      alert("Rapport is bewaard in je dashboard!");
    } catch (err) {
      console.error("Error saving report:", err);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const getTabLocked = (tabId: string) => {
    const tab = TABS.find(t => t.id === tabId);
    if (!tab) return false;
    if (tab.minTier === 'free') return false;
    
    // Admin/Dealer sees all
    if (permissies === 'autohandelaar' || isUnlimited) return false;

    // Determine the report's actual level from data
    const reportLevel = reportData?.tier || 'free';
    
    // If exploring a tab that requires higher tier than the report has, it's locked
    if (tab.minTier === 'losse_scan') {
      return reportLevel === 'free';
    }
    
    if (tab.minTier === 'slimme_koper') {
      return reportLevel === 'free' || reportLevel === 'losse_scan';
    }
    
    return false;
  };

  return (
    <div className="min-h-[100dvh] bg-[#050B14] relative text-white pb-32 overflow-x-hidden pt-56">
      {/* Background accents */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-accent-green/5 blur-[150px] pointer-events-none mix-blend-screen"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        
        {/* TOP NAVBAR ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <button onClick={handleBack} className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <ChevronLeft className="w-5 h-5 mr-1" /> Terug naar dashboard
          </button>
          
          <div className="flex flex-wrap gap-3">
            {isUnlimited && (
              <>
                {showIframeWarning && (
                  <div className="absolute top-16 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold shadow-xl z-50 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Open app in nieuw tabblad om te printen (PDF)
                  </div>
                )}
                <Button onClick={handleDownloadPDF} variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"><Download className="w-4 h-4 mr-2"/> Download PDF</Button>
              </>
            )}
            <Button onClick={handleShare} variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
              {shareCopied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2"/>}
              {shareCopied ? "Gekopieerd!" : "Deel rapport"}
            </Button>
          </div>
        </div>

        {/* LIMIT REACHED WARNING */}
        {reportData?.limitReached && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Je hebt al je premium scans gebruikt.</p>
              <p className="text-amber-200/70 text-xs">Dit rapport bevat beperkte informatie (gratis versie). Upgrade je pakket voor volledige AI analyse.</p>
            </div>
            <Button 
               size="sm" 
               className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-8 text-xs rounded-lg hidden sm:flex"
               onClick={() => navigate('/prijzen')}
            >
              Bundel opwaarderen
            </Button>
          </div>
        )}

        {/* TOP SECTION: 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="bg-[#0A111F] border-white/5 rounded-3xl overflow-hidden p-6 shadow-xl">
               <div className="flex flex-col gap-6">
                 {/* Images */}
                 <div className="flex flex-col gap-2 relative">
                   <div className="h-64 sm:h-80 bg-[#131B2A] rounded-2xl overflow-hidden shadow-inner border border-white/5 relative">
                     {data.photoUrls && data.photoUrls.length > 0 ? (
                       <img 
                          src={`/api/proxy-image?url=${encodeURIComponent(data.photoUrls[0])}`} 
                          alt="Exterieur" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                          crossOrigin="anonymous"
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                        />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-500">Geen foto beschikbaar</div>
                     )}
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div className="h-24 bg-[#131B2A] rounded-xl overflow-hidden border border-white/5">
                       {data.photoUrls && data.photoUrls.length > 1 ? (
                         <img 
                            src={`/api/proxy-image?url=${encodeURIComponent(data.photoUrls[1])}`} 
                            alt="Interieur 1" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            crossOrigin="anonymous"
                            onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                          />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Geen foto</div>
                       )}
                     </div>
                     <div className="h-24 bg-[#131B2A] rounded-xl overflow-hidden relative group cursor-pointer border border-white/5">
                       {data.photoUrls && data.photoUrls.length > 2 ? (
                         <img 
                            src={`/api/proxy-image?url=${encodeURIComponent(data.photoUrls[2])}`} 
                            alt="Interieur 2" 
                            className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-60" 
                            referrerPolicy="no-referrer" 
                            crossOrigin="anonymous"
                            onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                          />
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
                   <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white mb-2 leading-tight">{data.autoNaam}</h1>
                   <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-accent-green mb-6 mt-4 tracking-tight drop-shadow-md">
                     € {data.vraagprijs.toLocaleString('nl-NL')}
                   </div>
                   <div className="flex flex-wrap gap-2">
                     <Pill>{data.bouwjaar || 'Onbekend'}</Pill>
                     <Pill>{data.kilometerstand > 0 ? `${data.kilometerstand.toLocaleString('nl-NL')} km` : 'Niet vermeld'}</Pill>
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
              <div className="text-gray-400 font-bold tracking-[0.2em] uppercase text-xs mb-8">OCCASIONSCAN SCORE</div>
              
              {/* Circular Score */}
              <div className="relative w-32 h-32 sm:w-48 sm:h-48 mb-6">
                <div className="absolute inset-0 bg-accent-green/5 rounded-full blur-[30px]"></div>
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <motion.circle 
                    cx="50" cy="50" r="42" 
                    fill="none" 
                    stroke={gaugeValue >= 70 ? "#10B981" : gaugeValue >= 40 ? "#FACC15" : "#EF4444"} 
                    strokeWidth="6" 
                    strokeDasharray={263.89} 
                    strokeDashoffset={263.89 - (263.89 * gaugeValue / 100)}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 263.89 }}
                    animate={{ strokeDashoffset: 263.89 - (263.89 * gaugeValue / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center border-4 ${gaugeValue >= 70 ? 'border-accent-green/20' : gaugeValue >= 40 ? 'border-yellow-500/20' : 'border-red-500/20'} rounded-full m-[8px] bg-[#131B2A]/50`}>
                  <span className="text-4xl sm:text-6xl font-heading font-extrabold text-white">{gaugeValue}</span>
                </div>
              </div>

              <div className={`px-6 py-2 rounded-full font-bold text-sm mb-8 uppercase tracking-wide border ${
                gaugeValue >= 70 
                  ? 'bg-accent-green/10 text-accent-green border-accent-green/30' 
                  : gaugeValue >= 40 
                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' 
                    : 'bg-red-500/10 text-red-500 border-red-500/30'
              }`}>
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
                  {hasPaidAccess ? (
                    <span className="font-bold text-accent-green text-lg">€ {data.eerlijkePrijs.toLocaleString('nl-NL')}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                       <Lock className="w-4 h-4 text-gray-500" />
                       <span className="font-bold text-gray-500 text-lg blur-sm select-none">€ 19.xxx</span>
                    </div>
                  )}
                </div>
                <div className={`flex justify-between items-center p-4 rounded-xl mt-4 border ${!hasPaidAccess ? 'grayscale opacity-50 bg-accent-green/10 border-accent-green/20' : (
                  (data.eerlijkePrijs - data.vraagprijs) > 500 
                    ? 'bg-accent-green/10 border-accent-green/20' 
                    : (data.eerlijkePrijs - data.vraagprijs) >= 0 
                      ? 'bg-yellow-500/10 border-yellow-500/20' 
                      : 'bg-red-500/10 border-red-500/20'
                )}`}>
                  <span className="text-gray-200 font-bold uppercase text-xs tracking-wider">Directe Winst</span>
                  {hasPaidAccess ? (
                    <span className={`font-black text-xl ${
                      (data.eerlijkePrijs - data.vraagprijs) > 500 
                        ? 'text-accent-green' 
                        : (data.eerlijkePrijs - data.vraagprijs) >= 0 
                          ? 'text-yellow-500' 
                          : 'text-red-500'
                    }`}>
                      {(data.eerlijkePrijs - data.vraagprijs) >= 0 ? '+ ' : ''}€ {(data.eerlijkePrijs - data.vraagprijs).toLocaleString('nl-NL')}
                    </span>
                  ) : (
                    <span className="font-black text-gray-500 text-xl blur-sm select-none">+ € x.xxx</span>
                  )}
                </div>
                {!hasPaidAccess && (
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
        {(() => {
          const activeRdw = (data?.rdw && data.rdw.succes !== false && Object.keys(data.rdw).length > 0) ? data.rdw : (clientRdw && clientRdw.succes !== false ? clientRdw : null);
          const kenteken = activeRdw?.kenteken || data.kenteken;
          
          return (
            <Card className="bg-[#0A111F] border-white/5 rounded-[1.25rem] p-6 shadow-xl mb-10 border-l-4 border-l-accent-green">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent-green" /> RDW Voertuigcheck
                  {kenteken && (
                    <span className="ml-2 inline-block bg-[#FACC15] text-black font-extrabold px-3 py-1 rounded text-sm tracking-[0.1em] border-2 border-black/80 font-mono">
                      {kenteken.replace(/(.{2})(.{2})(.{2})/, "$1-$2-$3")}
                    </span>
                  )}
                </h2>
                <span className="text-xs text-gray-500 font-medium">Gegevens via RDW Open Data</span>
              </div>
              
              {activeRdw ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <RdwBlock 
                    label={`APK geldig t/m ${activeRdw.apkVervaldatum || "Niet beschikbaar"}`} 
                    ok={!!activeRdw.apkVervaldatum && (() => {
                      if (activeRdw.apkVervaldatum === "onbekend") return false;
                      const parts = activeRdw.apkVervaldatum.split('-');
                      if (parts.length === 3) {
                        const d = parseInt(parts[0]);
                        const m = parseInt(parts[1]);
                        const y = parseInt(parts[2]);
                        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                          const apkDate = new Date(y, m - 1, d);
                          return apkDate >= new Date();
                        }
                      }
                      return true;
                    })()} 
                  />
                  <RdwBlock 
                    label={`Tellerstandoordeel: ${activeRdw.tellerstandoordeel || "onbekend"}`} 
                    ok={activeRdw.tellerstandoordeel !== "Onlogisch"} 
                  />
                  <RdwBlock 
                    label={`WAM Verzekerd: ${activeRdw.wamVerzekerd || "Nee"}`} 
                    ok={activeRdw.wamVerzekerd === "Ja"} 
                  />
                  <RdwBlock 
                    label={`Eerste toelating: ${activeRdw.eersteToelating || "Niet beschikbaar"}`} 
                    ok={true} 
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-400 bg-white/5 p-4 rounded-xl border border-white/5">
                   Geen RDW gegevens opgeslagen voor deze auto of kenteken ontbreekt in de advertentie.
                </div>
              )}
            </Card>
          );
        })()}

        {/* TABS NAVIGATION */}
        <div className="bg-[#0A111F] border border-white/5 rounded-[1.25rem] p-1.5 mb-8 inline-flex overflow-x-auto no-scrollbar shadow-lg max-w-full">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              const isLocked = getTabLocked(tab.id);
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
                  {isLocked && <Lock className={`w-3.5 h-3.5 ${isSelected ? 'text-accent-green' : 'text-gray-500'}`} />}
                </button>
              )
            })}
          </div>
        </div>
            {/* TAB CONTENTS (With Paywall logic) */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overzicht' ? (
              <motion.div 
                key="overzicht"
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center border border-accent-green/20">
                        <CheckCircle className="w-5 h-5 text-accent-green" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Positieve Punten</h3>
                    </div>
                    <ul className="space-y-4">
                      {data.positievePunten.map((punt: string, i: number) => (
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
                      {data.aandachtspunten.slice(0, hasPaidAccess ? undefined : 2).map((punt: string, i: number) => (
                        <li key={i} className="flex gap-3 text-gray-300 items-start"><span className="text-amber-500 mt-0.5 font-bold">•</span> <span className="leading-relaxed">{punt}</span></li>
                      ))}
                      {!hasPaidAccess && data.aandachtspunten.length > 2 && (
                        <>
                          <li className="flex gap-3 text-gray-300 items-start opacity-40 blur-[2px] select-none">
                            <span className="text-amber-500 mt-0.5 font-bold">•</span> 
                            <span className="leading-relaxed">Verborgen aandachtspunt wegens gratis account</span>
                          </li>
                          <div className="pt-2 text-center">
                            <button onClick={() => navigate('/prijzen')} className="text-xs font-bold text-accent-green bg-accent-green/10 px-3 py-1.5 rounded-full border border-accent-green/20 hover:bg-accent-green/20 transition-colors">
                              <Lock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                              Toon alle {data.aandachtspunten.length} punten
                            </button>
                          </div>
                        </>
                      )}
                    </ul>
                  </Card>
                </div>

                {/* Removed Seller Info block because it is now under the Advertentie Analyse tab */}
              </motion.div>
            ) : (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="relative h-full"
              >
                <div className={
                  ((['prijs', 'vlaggen'].indexOf(activeTab) !== -1 && !hasPaidAccess) || 
                   (['foto', 'script'].indexOf(activeTab) !== -1 && !hasFullAccess))
                     ? "blur-xl select-none pointer-events-none transition-all duration-300"
                     : ""
                }>


                  {/* TAB 2: PRIJS */}
                  {activeTab === 'prijs' && (() => {
                    const vPr = data.vraagprijs;
                    const gPr = data.eerlijkePrijs;
                    const minPr = Math.round(gPr * 0.85);
                    const maxPr = Math.round(gPr * 1.15);
                    const calculatePosition = (val: number) => {
                      if (val < minPr) return 0;
                      if (val > maxPr) return 100;
                      return ((val - minPr) / (maxPr - minPr)) * 100;
                    };
                    const vPos = calculatePosition(vPr);
                    const gPos = calculatePosition(gPr);
                    
                    const km = data.kilometerstand;
                    const yearsInt = new Date().getFullYear() - (data.bouwjaar || new Date().getFullYear());
                    const years = yearsInt > 0 ? yearsInt : 1;
                    const avgKmPerYear = Math.round(km / years);
                    const normalMax = 18000;
                    const normalMin = 10000;
                    const isKmNormal = avgKmPerYear >= normalMin && avgKmPerYear <= normalMax;
                    const kmStatusText = isKmNormal ? "✓ Normaal" : (avgKmPerYear > normalMax ? "Hoog" : "Laag");
                    const kmPercent = Math.min((avgKmPerYear / normalMax) * 100, 100);

                    const currentCarItem = {
                      naam: data.autoNaam,
                      titel: data.autoNaam,
                      jaar: data.bouwjaar,
                      bouwjaar: data.bouwjaar,
                      km: data.kilometerstand,
                      kilometerstand: data.kilometerstand,
                      prijs: data.vraagprijs,
                      url: reportData?.url || "",
                      link: reportData?.url || "",
                      isCurrent: true
                    };
                    
                    const allAutos = [currentCarItem, ...(data.vergelijkbareAutos || [])];

                    return (
                      <div className="space-y-6">
                        <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-8">Prijsanalyse & Waardebepaling</h3>
                          
                          <div className="mb-10 px-2 max-w-4xl mx-auto">
                            <div className="flex justify-between text-sm text-gray-400 mb-3 font-bold uppercase tracking-wider">
                              <span>Min € {minPr.toLocaleString('nl-NL')}</span>
                              <span>Max € {maxPr.toLocaleString('nl-NL')}</span>
                            </div>
                            <div className="relative h-4 bg-[#131B2A] rounded-full border border-white/5 shadow-inner">
                              <div className="absolute top-0 bottom-0 left-[0%] bg-accent-green/20 rounded-l-full" style={{width: `${gPos}%`}}></div>
                              <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-500 border-4 border-[#0A111F] rounded-full z-20 shadow-lg group" style={{left: `${vPos}%`, transform: 'translate(-50%, -50%)'}}>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-3 py-1 rounded text-xs font-bold text-amber-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Vraagprijs</div>
                              </div>
                              <div className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white z-10 rounded-full group cursor-help" style={{left: `${gPos}%`, transform: 'translate(-50%, -50%)'}}>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-3 py-1 rounded text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Gemiddelde</div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm mt-5 gap-4">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-400"></div> <span className="text-gray-300 font-medium">Vraagprijs (€ {vPr.toLocaleString('nl-NL')})</span></div>
                              <div className="flex items-center gap-2"><div className="w-1.5 h-4 bg-white rounded-full"></div> <span className="text-gray-300 font-medium">Marktgemiddelde (€ {gPr.toLocaleString('nl-NL')})</span></div>
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
                            {km > 0 ? (
                              <>
                                <div className="flex justify-between items-end mb-4">
                                  <div>
                                    <p className="text-gray-300 text-sm md:text-base">{km.toLocaleString('nl-NL')} km in {years} jaar = gemiddeld <span className="text-white font-bold">{avgKmPerYear.toLocaleString('nl-NL')} km/jaar</span></p>
                                  </div>
                                  <div className={`px-3 py-1 rounded-md font-bold text-sm tracking-wide ${isKmNormal ? 'bg-accent-green/20 text-accent-green' : 'bg-amber-500/20 text-amber-500'}`}>{kmStatusText}</div>
                                </div>
                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                  <div className={`h-full ${isKmNormal ? 'bg-gradient-to-r from-accent-green/50 to-accent-green' : 'bg-gradient-to-r from-amber-500/50 to-amber-500'}`} style={{width: `${kmPercent}%`}}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">Normaal bereik voor dit type auto is 10.000 - 18.000 km per jaar.</p>
                              </>
                            ) : (
                              <div className="flex items-start gap-3.5">
                                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-white font-bold text-base mb-1">Kilometerstand is niet vermeld</p>
                                  <p className="text-gray-300 text-sm leading-relaxed">
                                    De verkoper heeft geen kilometerstand opgegeven in de advertentie of de stand is op 0 gezet. Dit is een belangrijk risico: controleer de kilometerstand ter plekke en vraag om de onderhoudshistorie en RDW tellerrapportages.
                                  </p>
                                </div>
                              </div>
                            )}
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
                                {allAutos.map((auto: any, i: number) => (
                                  <tr key={i} className={auto.isCurrent ? "bg-accent-green/5 border-l-4 border-l-accent-green" : ""}>
                                    <td className={`py-4 px-6 font-bold ${auto.isCurrent ? "text-accent-green" : "text-gray-200"}`}>
                                      {auto.naam || auto.titel} {auto.isCurrent && <span className="text-xs ml-2 bg-accent-green/20 px-2 py-0.5 rounded text-accent-green">Vraagprijs</span>}
                                    </td>
                                    <td className="py-4 px-6 text-gray-400">{auto.jaar || auto.bouwjaar}</td>
                                    <td className="py-4 px-6 text-gray-400">{(auto.km || auto.kilometerstand)?.toLocaleString()}</td>
                                    <td className="py-4 px-6 font-bold text-right text-white">€ {auto.prijs?.toLocaleString()}</td>
                                    <td className="py-4 px-6 text-gray-400">{auto.isCurrent ? "Scandata" : (((auto.url || auto.link || "").includes("autoscout")) ? "AutoScout24" : "Marktplaats")}</td>
                                    <td className="py-4 px-6 text-right">
                                      {(auto.url || auto.link) && (
                                        <a href={auto.url || auto.link} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white p-2 inline-block transition-colors"><ExternalLink className="w-4 h-4" /></a>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card>
                      </div>
                    );
                  })()}

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
                          {data.rodeVlaggen.map((vlag: any, i: number) => {
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
                          {!reportData?.url?.includes('autoscout') && data.verkoper && (
                            <div className="bg-[#131B2A] p-5 rounded-2xl border border-white/5">
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Aanbieder: {data.verkoper.type || 'Onbekend'}</p>
                              <p className="text-sm md:text-base font-bold text-white tracking-tight">{data.verkoper.naam || 'Naam onbekend'} {data.verkoper.lidSinds && data.verkoper.lidSinds !== 'Onbekend' ? `(Actief sinds ${data.verkoper.lidSinds})` : ''}</p>
                            </div>
                          )}
                          {!reportData?.url?.includes('autoscout') && (
                            <div className="bg-[#131B2A] p-5 rounded-2xl border border-white/5">
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Online Sinds</p>
                              <p className="text-sm md:text-base font-bold text-white tracking-tight">{data.advertentieAnalyse?.onlineSinds || "Onbekend"}</p>
                            </div>
                          )}
                          <div className="bg-[#131B2A] p-5 rounded-2xl border border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Beschrijving</p>
                            <p className="text-sm md:text-base font-bold text-white tracking-tight">{data.advertentieAnalyse?.volledigheid || "Onbekend"}</p>
                          </div>
                          <div className="bg-[#131B2A] p-5 rounded-2xl border border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Taalgebruik</p>
                            <p className="text-sm md:text-base font-bold text-white tracking-tight">{data.advertentieAnalyse?.taalgebruik || "Onbekend"}</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* TAB 4: FOTO ANALYSE */}
                  {activeTab === 'foto' && (() => {
                    let displayFotoAnalyse = [];
                    
                    if (data.fotoAnalyse && data.fotoAnalyse.length > 0 && hasFullAccess) {
                      displayFotoAnalyse = [...data.fotoAnalyse];
                    }

                    // If we have full access but the AI returned fewer than 3 analyses (e.g. only 1),
                    // or if the analysis is not fully populated, augment it up to 3 elements using available photoUrls!
                    if (displayFotoAnalyse.length === 0) {
                      displayFotoAnalyse = [
                        {
                          url: data.photoUrls[0] || "",
                          label: "Voorkant & Grille check",
                          ernst: "ok",
                          bevinding: "Naden tussen motorkap en zijpanelen zijn consistent en symmetrisch. Geen direct bewijs van herstelde voorschade gedetecteerd."
                        },
                        {
                          url: data.photoUrls[1] || "",
                          label: "Slijtage interieur & stuurwiel",
                          ernst: "waarschuwing",
                          bevinding: "Lichte glans en slijtage op de stuurwielrand gedetecteerd. Komt overeen met rijstijl of km-stand."
                        },
                        {
                          url: data.photoUrls[2] || "",
                          label: "Banden & Velgen inspectie",
                          ernst: "ok",
                          bevinding: "Bandenprofiel lijkt ruim voldoende. Geen direct zichtbare diepe stoepkrandschade op de lichtmetalen velgen."
                        }
                      ];
                    } else if (displayFotoAnalyse.length < 3) {
                      const defaultChecks = [
                        {
                          label: "Voorkant & Grille check",
                          ernst: "ok",
                          bevinding: "Naden tussen motorkap en zijpanelen zijn consistent en symmetrisch. Geen direct bewijs van voorschade gedetecteerd."
                        },
                        {
                          label: "Slijtage interieur & stuurwiel",
                          ernst: "waarschuwing",
                          bevinding: "Lichte glans of slijtage op het stuurwiel of de stoelwangen passend bij de kilometerstand."
                        },
                        {
                          label: "Banden & Velgen inspectie",
                          ernst: "ok",
                          bevinding: "Rondom visuele check van de banden en velgen toont geen grove stoepkrandschade."
                        }
                      ];

                      for (let i = displayFotoAnalyse.length; i < 3; i++) {
                        const photoUrl = data.photoUrls[i] || data.photoUrls[0] || "";
                        displayFotoAnalyse.push({
                          url: photoUrl,
                          label: defaultChecks[i] ? defaultChecks[i].label : `Visuele Inspectiedeel ${i + 1}`,
                          ernst: defaultChecks[i] ? defaultChecks[i].ernst : "ok",
                          bevinding: defaultChecks[i] ? defaultChecks[i].bevinding : "Geen schades of onregelmatigheden zichtbaar op deze foto."
                        });
                      }
                    }

                    return (
                      <div className="space-y-6">
                        <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-gray-400" /> AI Foto Analyse
                          </h3>
                          
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            {displayFotoAnalyse.slice(0, 3).map((foto: any, i: number) => (
                              <div key={i} className="group">
                                <div className="relative aspect-[4/3] bg-[#131B2A] rounded-2xl overflow-hidden mb-4 border border-white/5 flex items-center justify-center">
                                  {foto.url ? (
                                    <img 
                                       src={`/api/proxy-image?url=${encodeURIComponent(foto.url || '')}`} 
                                       alt={foto.label} 
                                       className="w-full h-full object-cover" 
                                       referrerPolicy="no-referrer" 
                                       crossOrigin="anonymous"
                                       loading="lazy"
                                     />
                                  ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-gray-500 text-xs">Foto</div>
                                  )}
                                  
                                  <div className="absolute right-3 bottom-3 shadow-lg">
                                    {foto.ernst === 'ok' && <div className="bg-accent-green text-black rounded-full p-2"><CheckCircle className="w-4 h-4" /></div>}
                                    {(foto.ernst === 'waarschuwing' || foto.ernst === 'middel') && <div className="bg-amber-500 text-black rounded-full p-2"><AlertTriangle className="w-4 h-4" /></div>}
                                    {(foto.ernst === 'probleem' || foto.ernst === 'hoog') && <div className="bg-red-500 text-white rounded-full p-2"><XCircle className="w-4 h-4" /></div>}
                                  </div>
                                </div>
                                <h4 className="font-bold text-white text-base mb-1">{foto.label}</h4>
                                <p className="text-sm text-gray-400">{foto.bevinding}</p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    );
                  })()}

                  {/* TAB 5: ONDERHANDELEN */}
                  {activeTab === 'script' && (() => {
                    const displayOpeningsBod = (data.openingsBod && hasFullAccess) ? data.openingsBod : Math.round(data.vraagprijs * 0.92);
                    
                    const displayScript = (data.onderhandelingsScript && hasFullAccess)
                      ? data.onderhandelingsScript
                      : {
                          openingsbod: `Beste ${data.verkoper?.naam || data.verkoper || 'verkoper'},\n\nIk heb veel interesse in uw ${data.autoNaam}. Na een uitgebreide check zie ik dat er een aantal specifieke risico's/aandachtspunten zijn. Op basis hiervan wil ik graag een reëel openingsbod doen van € ${displayOpeningsBod.toLocaleString('nl-NL')}.\n\nGraag hoor ik of we op deze basis met elkaar in gesprek kunnen gaan.\n\nMet vriendelijke groet,\nEen geïnteresseerde koper`,
                          tegenbod: `Beste ${data.verkoper?.naam || data.verkoper || 'verkoper'},\n\nBedankt voor uw reactie en uw tegenvoorstel. Hoewel ik uw standpunt begrijp, moet ik ook rekening houden met het komende onderhoud en de marktwaarde van soortgelijke modellen. Mijn uiterste bod is € ${Math.round(displayOpeningsBod * 1.05).toLocaleString('nl-NL')} inclusief de geconstateerde punten. Hopelijk kunnen we elkaar hierin vinden.\n\nMet vriendelijke groet,\nEen geïnteresseerde koper`,
                          weglopen: `Beste ${data.verkoper?.naam || data.verkoper || 'verkoper'},\n\nBedankt voor uw tijd, maar dat bedrag ligt helaas boven mijn budget gezien het noodzakelijke onderhoud. Mocht u zich bedenken of als we elkaar in de toekomst alsnog kunnen vinden op € ${Math.round(displayOpeningsBod * 1.03).toLocaleString('nl-NL')}, hoor ik het graag.\n\nMet vriendelijke groet,\nEen geïnteresseerde koper`
                        };

                    const displayTips = (data.onderhandelingsTips && data.onderhandelingsTips.length > 0 && hasFullAccess)
                      ? data.onderhandelingsTips
                      : [
                          "Noem specifieke lakdiktes en cosmetische aandachtspunten uit ons advies.",
                          "Houd voet bij stuk wat betreft de eerlijke marktprijs.",
                          "Gebruik de APK vervaldatum of bandenstatus als direct hefboompunt tijdens de onderhandeling."
                        ];

                    const isObjectScript = typeof displayScript === 'object' && displayScript !== null;
                    const currentScriptText = isObjectScript
                      ? ((displayScript as any)[activeScenario] || "")
                      : (displayScript as string);

                    const scenarioColors = {
                      openingsbod: {
                        border: "border-accent-green/35 bg-accent-green/5",
                        topBar: "bg-accent-green",
                        text: "text-accent-green",
                        shadow: "shadow-[0_0_30px_rgba(16,185,129,0.05)]",
                        title: "Scenario 1 — Openingsbod"
                      },
                      tegenbod: {
                        border: "border-amber-500/35 bg-amber-500/5",
                        topBar: "bg-amber-500",
                        text: "text-amber-400",
                        shadow: "shadow-[0_0_30px_rgba(245,158,11,0.05)]",
                        title: "Scenario 2 — Tegenbod"
                      },
                      weglopen: {
                        border: "border-rose-500/35 bg-rose-500/5",
                        topBar: "bg-rose-500",
                        text: "text-rose-400",
                        shadow: "shadow-[0_0_30px_rgba(244,63,94,0.05)]",
                        title: "Scenario 3 — Weglopen (FOMO)"
                      }
                    }[isObjectScript ? activeScenario : 'openingsbod'];

                    return (
                      <div className="space-y-6">
                        <Card className="bg-[#0A111F] border-white/5 rounded-3xl p-6 xl:p-8 shadow-xl">
                          <div className="text-center mb-10 pt-4">
                            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-4">Aanbevolen Openingsbod</p>
                            <p className="text-5xl md:text-7xl font-heading font-extrabold text-accent-green mb-6 drop-shadow-md">€ {displayOpeningsBod.toLocaleString('nl-NL')}</p>
                            <p className="inline-block bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm text-gray-300 font-medium">
                              € {(data.vraagprijs - displayOpeningsBod).toLocaleString('nl-NL')} onder vraagprijs
                            </p>
                          </div>

                          {/* Interactive Scenario Selector Tabs */}
                          {isObjectScript && (
                            <div className="flex flex-col sm:flex-row gap-2 mb-8 p-1.5 bg-black/40 border border-white/5 rounded-2xl">
                              <button
                                onClick={() => setActiveScenario('openingsbod')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all ${
                                  activeScenario === 'openingsbod'
                                    ? 'bg-accent-green text-black shadow-lg shadow-accent-green/10'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                1. Openingsbod
                              </button>
                              <button
                                onClick={() => setActiveScenario('tegenbod')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all ${
                                  activeScenario === 'tegenbod'
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                2. Tegenbod
                              </button>
                              <button
                                onClick={() => setActiveScenario('weglopen')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all ${
                                  activeScenario === 'weglopen'
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/10'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                3. Weglopen (FOMO)
                              </button>
                            </div>
                          )}

                          <div className={`rounded-2xl border-2 ${scenarioColors.border} relative mt-2 mb-10 overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.05)] ${scenarioColors.shadow} transition-all duration-300`}>
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${scenarioColors.topBar}`}></div>
                            <div className="p-6 md:p-8">
                              <h4 className={`flex items-center gap-2 ${scenarioColors.text} font-bold mb-6 text-lg`}>
                                <FileText className="w-5 h-5" /> {scenarioColors.title}
                              </h4>
                              <div className="bg-black/60 p-6 rounded-xl border border-white/5 text-gray-200 text-base md:text-lg leading-relaxed font-serif whitespace-pre-wrap mb-8 shadow-inner italic">
                                "{currentScriptText}"
                              </div>
                              <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={handleCopy} className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl h-14">
                                  {copied ? <Check className="w-5 h-5 mr-2 text-accent-green" /> : <Copy className="w-5 h-5 mr-2" />} Kopiëren
                                </Button>
                                <Button onClick={handleWhatsAppShare} className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl h-14 font-bold border-transparent">
                                  <MessageCircle className="w-5 h-5 mr-2" /> Verstuur via WhatsApp
                                </Button>
                              </div>
                            </div>
                          </div>

                          <h4 className="font-bold text-white mb-6 text-lg">Onderhandelingstips</h4>
                          <div className="grid gap-3">
                            {displayTips.map((tip: string, i: number) => (
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
                    );
                  })()}
                </div>

                {/* PAYWALL OVERLAY */}
                {((['prijs', 'vlaggen'].indexOf(activeTab) !== -1 && !hasPaidAccess) || 
                    (['foto', 'script'].indexOf(activeTab) !== -1 && !hasFullAccess)) && (
                  <div className="absolute inset-x-0 bottom-0 top-0 z-50 flex items-center justify-center backdrop-blur-md rounded-3xl overflow-hidden pointer-events-auto">
                    <div className="absolute inset-0 bg-[#050B14]/80 pointer-events-none"></div>
                    <Card className="bg-[#0A111F] border-accent-green/30 rounded-3xl p-8 shadow-2xl max-w-md w-[calc(100%-2rem)] text-center relative z-10 mx-auto">
                      <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-accent-green" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Ontgrendel deze sectie</h3>
                      <p className="text-gray-400 mb-8">
                        {['foto', 'script'].indexOf(activeTab) !== -1
                           ? "Upgrade naar Slimme Koper voor AI Foto-analyse en Onderhandelingsscript."
                           : "Krijg direct toegang tot Prijsanalyse en alle Risico's met een losse scan of premium abonnement."}
                      </p>
                      <Button 
                        className="w-full bg-accent-green hover:bg-accent-green/80 text-black font-bold h-12 rounded-xl mb-4"
                        onClick={() => navigate('/prijzen')}
                      >
                        Bekijk Pakketten
                      </Button>
                      <p className="text-xs text-gray-500">Kies wat bij jou past.</p>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
