import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'motion/react';
import { ChevronLeft, Download, Bookmark, Share2, AlertTriangle, CheckCircle, Lock, Car, Search, AlertCircle, FileText, Check, Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useStore } from '@/src/store/useStore';
import { AuthModal } from '@/src/components/AuthModal';

const demoRapport = {
  id: "demo-001",
  autoNaam: "Volkswagen Golf 1.4 TSI Highline",
  jaar: 2018,
  kilometerstand: 91500,
  vraagprijs: 8500,
  marktGemiddelde: 9200,
  dealScore: 72,
  verdict: "redelijk",
  aanmaakDatum: "2026-05-11",
  link: "https://www.marktplaats.nl/v/auto-s/volkswagen/...",
  rodeVlaggen: [
    { ernst: "hoog", titel: "Geen proefrit mogelijk", uitleg: "Serieuze verkopers staan altijd een proefrit toe." },
    { ernst: "middel", titel: "'Kleine kras' zonder foto", uitleg: "Vraag om extra foto's voor je gaat kijken." },
    { ernst: "laag", titel: "Onderhoudshistorie aanwezig", uitleg: "Positief — verkoper is transparant." }
  ],
  vergelijkbareAutos: [
    { naam: "VW Golf 1.4 TSI", jaar: 2018, km: 88000, prijs: 9100, bron: "AutoTrack" },
    { naam: "VW Golf 1.6 TDI", jaar: 2018, km: 95000, prijs: 8800, bron: "Marktplaats" },
    { naam: "VW Golf 1.4 TSI", jaar: 2019, km: 76000, prijs: 9600, bron: "Marktplaats" },
    { naam: "VW Golf 1.4 TSI Highline", jaar: 2018, km: 93000, prijs: 8900, bron: "AutoWeek" }
  ],
  onderhandelingsScript: "Ik heb vergelijkbare Golfs in de regio bekeken — die gaan gemiddeld voor €8.200. Gezien de kilometerstand en het ontbreken van een onderstelsfoto zou ik willen beginnen op €7.800. Is daar ruimte voor?",
  openingsBod: 7800,
  samenvatting: [
    "Prijs is gunstig ten opzichte van de markt",
    "Geen proefrit is een serieuze waarschuwing",
    "Vraag om onderstels- en motorruimtefoto",
    "Aanbevolen openingsbod: €7.800"
  ]
};

export const ReportPage: React.FC = () => {
  const { id } = useParams();
  const { isPremium, isLoggedIn } = useStore();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Use demoRapport
  const data = demoRapport;
  
  const [gaugeValue, setGaugeValue] = useState(0);
  const [copied, setCopied] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    controls.start("show");
    const timeout = setTimeout(() => {
      setGaugeValue(data.dealScore);
    }, 400);
    return () => clearTimeout(timeout);
  }, [data.dealScore, controls]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.onderhandelingsScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreCircumference = 282.7;
  const strokeDashoffset = scoreCircumference - (scoreCircumference * gaugeValue / 100);

  // Background color based on dealScore
  let scoreColor = '#EF4444'; // Red
  let scoreText = 'Vermijden';
  let scoreBg = 'bg-red-500/10 border-red-500/20';

  if (data.dealScore >= 86) {
    scoreColor = '#F59E0B'; // Amber
    scoreText = 'Koopje';
    scoreBg = 'bg-amber-500/10 border-amber-500/20';
  } else if (data.dealScore >= 66) {
    scoreColor = '#10B981'; // Green
    scoreText = 'Redelijke deal';
    scoreBg = 'bg-accent-green/10 border-accent-green/20';
  } else if (data.dealScore >= 41) {
    scoreColor = '#F97316'; // Orange
    scoreText = 'Wees voorzichtig';
    scoreBg = 'bg-orange-500/10 border-orange-500/20';
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60 } }
  };

  const handleMijnRapportenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="container mx-auto px-4 py-8 max-w-5xl relative z-10 min-h-screen pt-32 pb-24"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants} className="mb-8">
        <button onClick={handleMijnRapportenClick} className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4 text-sm font-medium">
          <ChevronLeft className="w-4 h-4 mr-1" /> Mijn rapporten
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-2">{data.autoNaam} · €{data.vraagprijs.toLocaleString('nl-NL')}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span>{data.aanmaakDatum}</span>
              <a href="#" className="flex items-center text-accent-green hover:underline"><Search className="w-3.5 h-3.5 mr-1" /> Bekijk op Marktplaats</a>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 px-4 bg-white/5 border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20"><Bookmark className="w-4 h-4 mr-2"/> Bewaar</Button>
            <Button variant="outline" className="h-10 px-4 bg-white/5 border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20"><Share2 className="w-4 h-4 mr-2"/> Deel</Button>
            {isPremium && <Button className="h-10 px-4 bg-accent-green text-black hover:bg-accent-green/90 rounded-xl"><Download className="w-4 h-4 mr-2"/> PDF</Button>}
          </div>
        </div>
      </motion.div>

      {/* SECTIE A — DEALSCORE KAART */}
      <motion.div variants={itemVariants} className="mb-12">
        <Card className={`overflow-hidden rounded-3xl border shadow-lg ${scoreBg} backdrop-blur-sm relative`}>
          <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay"></div>
          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
            {/* Score Cirkel */}
            <div className="relative w-48 h-48 flex-shrink-0 group">
              <svg className="w-full h-full transform -rotate-90 relative z-10 drop-shadow-xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle 
                  cx="50" cy="50" r="44" 
                  fill="none" 
                  stroke={scoreColor} 
                  strokeWidth="8" 
                  strokeDasharray={scoreCircumference} 
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: scoreCircumference }}
                  animate={{ strokeDashoffset: strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className="text-6xl font-heading font-extrabold" style={{ color: scoreColor }}>
                  {gaugeValue}
                </span>
                <span className="text-xs text-white/50 font-bold uppercase tracking-wider mt-1">Score / 100</span>
              </div>
            </div>

            {/* Prijs Informatie */}
            <div className="flex-1 w-full text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ color: scoreColor }}>{scoreText}</h2>
              <p className="text-gray-300 font-medium mb-8">Je hebt onderhandelingsruimte. Zie het script hieronder.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Vraagprijs</p>
                  <p className="text-2xl font-bold text-white">€{data.vraagprijs.toLocaleString('nl-NL')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Marktgemiddelde</p>
                  <p className="text-2xl font-bold text-gray-300">€{data.marktGemiddelde.toLocaleString('nl-NL')}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-sm text-gray-400 mb-1">Verschil</p>
                  <p className="text-2xl font-bold text-accent-green">+€{(data.marktGemiddelde - data.vraagprijs).toLocaleString('nl-NL')} onder markt</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* PREMIUM CONTENT WRAPPER */}
      <div className="relative mb-12">
        <div className="space-y-8">
          
          {/* SECTIE B — PRIJSANALYSE */}
          <motion.div variants={itemVariants}>
            <Card className="glass-panel border-white/5 rounded-2xl overflow-hidden p-8 shadow-sm">
              <h3 className="text-xl font-bold text-white mb-6">Prijsanalyse</h3>
              
              <div className="mb-8">
                <div className="h-3 w-full bg-white/10 rounded-full mb-2 relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-accent-green via-yellow-500 to-red-500 opacity-50"></div>
                  
                  {/* Marker Average */}
                  <div className="absolute top-0 bottom-0 w-1 bg-white left-[60%] -translate-x-1/2"></div>
                  
                  {/* Marker Asking Price */}
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent-green rounded-full border-2 border-black left-[45%] -translate-x-1/2 shadow-lg"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Minimum marktwaarde</span>
                  <span>Deze auto</span>
                  <span>Gemiddeld</span>
                  <span>Maximum marktwaarde</span>
                </div>
                <p className="text-gray-300 mt-4 text-sm font-medium">Deze auto is €{(data.marktGemiddelde - data.vraagprijs).toLocaleString('nl-NL')} goedkoper dan het marktgemiddelde voor vergelijkbare modellen.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 font-medium tracking-wide">
                      <th className="py-3 px-2">Merk/Model</th>
                      <th className="py-3 px-2">Jaar</th>
                      <th className="py-3 px-2">Kilometerstand</th>
                      <th className="py-3 px-2">Prijs</th>
                      <th className="py-3 px-2">Bron</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.vergelijkbareAutos.map((auto, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-2 font-medium text-white">{auto.naam}</td>
                        <td className="py-3 px-2">{auto.jaar}</td>
                        <td className="py-3 px-2">{auto.km.toLocaleString('nl-NL')} km</td>
                        <td className="py-3 px-2 font-semibold">€{auto.prijs.toLocaleString('nl-NL')}</td>
                        <td className="py-3 px-2 flex items-center justify-between group">
                          {auto.bron}
                          <Search className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          {/* SECTIE C — RODE VLAGGEN DETECTOR */}
          <motion.div variants={itemVariants}>
            <Card className="glass-panel border-white/5 rounded-2xl overflow-hidden p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl font-bold text-white">Rode Vlaggen Detector</h3>
                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded border border-red-500/30">
                  {data.rodeVlaggen.length} signalen
                </span>
              </div>
              
              <div className="grid gap-4">
                {data.rodeVlaggen.map((vlag, i) => {
                  let badgeColors = "bg-red-500/20 text-red-400 border-red-500/30";
                  let icon = <AlertTriangle className="w-5 h-5 text-red-500" />;
                  if (vlag.ernst === 'middel') {
                    badgeColors = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                    icon = <AlertCircle className="w-5 h-5 text-amber-500" />;
                  } else if (vlag.ernst === 'laag') {
                    badgeColors = "bg-accent-green/20 text-accent-green border-accent-green/30";
                    icon = <CheckCircle className="w-5 h-5 text-accent-green" />;
                  }

                  return (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-black/40 items-start">
                      <div className="shrink-0 mt-1">{icon}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-white">{vlag.titel}</h4>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColors}`}>
                            {vlag.ernst}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 font-light">{vlag.uitleg}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>

          {/* SECTIE D — FOTO ANALYSE */}
          <motion.div variants={itemVariants}>
            <Card className="glass-panel border-white/5 rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-white mb-6">Foto-analyse AI</h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-white/10 group cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=400" alt="Exterieur" className="object-cover w-full h-full opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute top-2 left-2 bg-accent-green/80 text-black text-xs font-bold px-2 py-1 rounded backdrop-blur-md">✓ OK</div>
                  <div className="absolute bottom-2 left-2 right-2 text-xs font-medium text-white text-center bg-black/60 rounded px-2 py-1 backdrop-blur-sm">Carrosserie (Geen zichtbare grote schade)</div>
                </div>
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-white/10 group cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=400" alt="Interieur" className="object-cover w-full h-full opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute top-2 left-2 bg-amber-500/80 text-black text-xs font-bold px-2 py-1 rounded backdrop-blur-md">⚠️ Let op</div>
                  <div className="absolute bottom-2 left-2 right-2 text-xs font-medium text-white text-center bg-black/60 rounded px-2 py-1 backdrop-blur-sm">Lichte slijtage bestuurdersstoel</div>
                </div>
                <div className="relative aspect-video rounded-xl bg-black flex items-center justify-center border border-dashed border-red-500/30">
                  <div className="text-center">
                     <AlertTriangle className="w-8 h-8 text-red-500/50 mx-auto mb-2" />
                     <p className="text-xs font-medium text-red-400">Motorruimte</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/5 rounded-xl border border-red-500/10 p-5">
                <h4 className="text-red-400 font-semibold mb-3 text-sm">Ontbrekende cruciale foto's:</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2 items-center"><span className="text-red-500 font-bold">❌</span> Onderstelsfoto ontbreekt — vraag hier altijd om i.v.m. roest.</li>
                  <li className="flex gap-2 items-center"><span className="text-red-500 font-bold">❌</span> Motorruimtefoto ontbreekt.</li>
                </ul>
              </div>
            </Card>
          </motion.div>

          {/* SECTIE E — ONDERHANDELINGSSCRIPT */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl overflow-hidden p-8 border border-accent-orange shadow-[0_0_30px_rgba(255,152,0,0.1)] bg-gradient-to-br from-black to-accent-orange/10 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-orange/20 blur-[100px] rounded-full"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-accent-orange" /> Jouw onderhandelingsscript
                </h3>
                <p className="text-gray-400 font-light mb-8">Gebruik dit data-gedreven bericht om direct krachtig te openen.</p>
                
                <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                  <div className="text-center md:text-left">
                    <p className="text-sm text-gray-400 mb-1">Aanbevolen openingsbod</p>
                    <p className="text-5xl font-heading font-black text-accent-orange drop-shadow-md">€{data.openingsBod.toLocaleString('nl-NL')}</p>
                  </div>
                  <div className="flex-1 w-full relative">
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent-orange/20 hidden md:flex items-center justify-center -translate-x-1/2">
                      <div className="w-2 h-2 rounded-full bg-accent-orange"></div>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md rounded-xl p-5 border border-white/10 relative">
                      <div className="text-sm text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {data.onderhandelingsScript}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleCopy}
                    className="flex-1 h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 font-medium"
                  >
                    {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                    {copied ? "Gekopieerd!" : "Kopieer script"}
                  </Button>
                  <Button className="flex-1 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-medium">
                    <MessageCircle className="w-5 h-5 mr-2" /> Stuur via WhatsApp
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>

      {/* SECTIE F — CONCLUSIE (Altijd Zichtbaar) */}
      <motion.div variants={itemVariants}>
        <Card className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-white mb-6">Samenvatting</h3>
            <ul className="space-y-3 mb-8">
              {data.samenvatting.map((punt, i) => (
                <li key={i} className="flex gap-3 text-gray-300 text-sm md:text-base">
                  <div className="mt-1 bg-accent-green/20 rounded-full p-0.5 shrink-0 flex items-center justify-center h-5 w-5 border border-accent-green/30">
                    <CheckCircle className="w-3 h-3 text-accent-green" />
                  </div>
                  {punt}
                </li>
              ))}
            </ul>
            
            <div className="flex flex-col sm:flex-row gap-4 border-t border-white/10 pt-8 mt-4">
               <Button variant="outline" onClick={() => !isLoggedIn && setIsAuthModalOpen(true)} className="flex-1 h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10"><Check className="w-4 h-4 mr-2" /> Rapport opslaan</Button>
               <Button variant="outline" className="flex-1 h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10"><Share2 className="w-4 h-4 mr-2" /> Rapport delen</Button>
               <Link to="/analyseer" className="flex-1 block">
                 <Button className="w-full h-12 rounded-xl bg-accent-green hover:bg-accent-green/90 text-black font-semibold"><Search className="w-4 h-4 mr-2" /> Analyseer nieuwe auto</Button>
               </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </motion.div>
  );
};
