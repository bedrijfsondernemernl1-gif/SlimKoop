import React from 'react';
import { motion } from 'motion/react';
import { Footer } from '@/src/components/Footer';
import { CheckCircle2, Search, Link as LinkIcon, Cpu, ShieldCheck } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pt-40 flex flex-col">
      <div className="container mx-auto px-6 relative z-10 flex-1 pb-24">
        
        <div className="text-center max-w-3xl mx-auto mb-24 relative">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-7xl font-heading font-extrabold text-white mb-6 tracking-tight drop-shadow-lg"
          >
            Hoe werkt <span className="text-accent-green">OccasionScan</span>?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 font-light"
          >
            Van een normale occasionzoeker naar een gewapende onderhandelaar in 3 simpele stappen. Onze AI analyseert alles in real-time.
          </motion.p>
        </div>

        <div className="max-w-5xl mx-auto space-y-24">
          
          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 order-2 md:order-1">
              <div className="text-accent-green font-bold text-lg mb-2">Stap 01</div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Plak de Marktplaats of AutoScout24 link</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Zodra je een interessante auto ziet staan, plak je simpelweg de URL van de advertentie in onze zoekbalk. Je hoeft niks te downloaden en geen account aan te maken om te beginnen.
              </p>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> Veilig en anoniem</li>
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> Binnen seconden verwerkt</li>
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> Werkt op elk platform</li>
              </ul>
            </div>
            <div className="flex-1 order-1 md:order-2 w-full">
              <div className="glass-panel border-white/10 rounded-[2rem] p-8 relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent">
                 <div className="absolute inset-0 bg-noise opacity-30"></div>
                 <div className="w-20 h-20 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative z-10 mb-6">
                    <LinkIcon className="text-accent-green w-10 h-10" />
                 </div>
                 <div className="bg-black/60 rounded-xl p-4 border border-white/10 flex items-center gap-3 relative z-10">
                   <Search className="w-5 h-5 text-gray-500" />
                   <div className="h-2 w-2/3 bg-gray-600/50 rounded-full"></div>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 w-full">
              <div className="glass-panel border-white/10 rounded-[2rem] p-8 relative overflow-hidden bg-gradient-to-br from-primary-dark/20 to-transparent">
                 <div className="absolute inset-0 bg-noise opacity-30"></div>
                 <div className="w-20 h-20 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative z-10 mb-6 mx-auto md:ml-0 md:mr-auto lg:ml-auto lg:mr-0">
                    <Cpu className="text-primary w-10 h-10" />
                 </div>
                 <div className="flex flex-col gap-3 relative z-10">
                   <div className="h-16 w-full bg-white/5 rounded-xl border border-white/10 flex items-center px-4">
                     <div className="h-2 w-1/3 bg-accent-green/50 rounded-full animate-pulse"></div>
                   </div>
                   <div className="h-16 w-full bg-white/5 rounded-xl border border-white/10 flex items-center px-4">
                     <div className="h-2 w-1/2 bg-accent-orange/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                   </div>
                   <div className="h-16 w-full bg-white/5 rounded-xl border border-white/10 flex items-center px-4">
                     <div className="h-2 w-1/4 bg-red-500/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                   </div>
                 </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-primary font-bold text-lg mb-2">Stap 02</div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">De AI analyseert álles</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Onze bot downloadt de foto's, leest de beschrijving, controleert het RDW kenteken en vergelijkt de vraagprijs met 10.000 andere advertenties in seconden.
              </p>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-primary" /> Visual AI scant op deuken, roest & slijtage</li>
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-primary" /> Kenteken check op wok, apk, kilometerstand</li>
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-primary" /> Data model checkt de reële dagwaarde</li>
              </ul>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 order-2 md:order-1">
              <div className="text-accent-green font-bold text-lg mb-2">Stap 03</div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Ontvang Rapport & Onderhandel Script</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Je krijgt een kristalhelder overzicht mét Deal Score (0-100). Is de auto te duur? Wij vertellen je exact wat je tegen de verkoper moet zeggen in een persoonlijk script.
              </p>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> Deal Score (Is dit een slimme koop of miskoop?)</li>
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> Concreet "Kopieer & Plak" onderhandel script</li>
                 <li className="flex items-center gap-3 text-gray-300"><CheckCircle2 className="w-5 h-5 text-accent-green" /> Overzichtelijke lijst met plus en minpunten</li>
              </ul>
            </div>
            <div className="flex-1 order-1 md:order-2 w-full">
              <div className="glass-panel border-white/10 rounded-[2rem] p-8 relative overflow-hidden bg-gradient-to-br from-black to-primary-dark/30">
                 <div className="absolute inset-0 bg-noise opacity-30"></div>
                 <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
                    <div className="w-16 h-16 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-center">
                       <ShieldCheck className="text-accent-green w-8 h-8" />
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Deal Score</p>
                       <p className="text-4xl font-heading font-black text-accent-green">89</p>
                    </div>
                 </div>
                 <div className="space-y-4 relative z-10">
                    <div className="h-6 w-3/4 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-6 w-full bg-white/5 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-6 w-5/6 bg-white/5 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                 </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
      <Footer />
    </div>
  );
};
