import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye } from 'lucide-react';
import { Footer } from '@/src/components/Footer';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pt-40 flex flex-col relative overflow-hidden">
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-accent-green/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 flex-1 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6">Privacybeleid</h1>
            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
              Bij OccasionScan nemen we de bescherming van jouw persoonlijke gegevens uiterst serieus.
            </p>
          </div>

          <div className="glass-panel border-white/10 rounded-3xl p-8 md:p-12 mb-16 bg-black/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/5 blur-3xl rounded-full"></div>
            <div className="relative z-10 space-y-8 text-gray-300 leading-relaxed text-sm md:text-base">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-accent-green" />
                  1. Welke gegevens we verzamelen
                </h2>
                <p>
                  Om onze diensten aan te bieden, verzamelen we bepaalde informatie wanneer je onze website bezoekt:
                </p>
                <ul className="list-disc ml-6 mt-3 space-y-2">
                  <li><strong>Accountgegevens:</strong> E-mailadres en wachtwoord wanneer je een account aanmaakt.</li>
                  <li><strong>Gebruiksgegevens:</strong> Informatie over hoe je onze website gebruikt, zoals de auto's die je analyseert.</li>
                  <li><strong>Betalingsgegevens:</strong> Wanneer je een premium abonnement afsluit, worden betalingen veilig afgehandeld door onze betalingspartner Mollie. Wij slaan zelf geen creditcardgegevens op.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Lock className="w-6 h-6 text-accent-green" />
                  2. Hoe we jouw gegevens gebruiken
                </h2>
                <p>
                  Jouw gegevens worden uitsluitend gebruikt voor de volgende doeleinden:
                </p>
                <ul className="list-disc ml-6 mt-3 space-y-2">
                  <li>Het verlenen van toegang tot jouw dashboard en opgeslagen rapporten.</li>
                  <li>Het verbeteren van onze AI-modellen en analyseresultaten.</li>
                  <li>Het versturen van belangrijke updates over jouw account of onze diensten.</li>
                  <li>Het versturen van commerciële e-mailcampagnes en promoties omtrent updates, aanbiedingen en nieuwsbrieven over OccasionScan (waarbij je je op elk moment kunt afmelden).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Eye className="w-6 h-6 text-accent-green" />
                  3. Beveiliging van gegevens
                </h2>
                <p>
                  Wij passen strikte technische en organisatorische beveiligingsmaatregelen toe om verlies, misbruik of wijziging van jouw persoonsgegevens te voorkomen. Alle dataoverdracht vindt plaats via beveiligde SSL-verbindingen.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Cookies</h2>
                <p>
                  OccasionScan maakt gebruik van functionele cookies om de gebruikerservaring te verbeteren en om te onthouden of je bent ingelogd. Je kunt cookies via jouw browserinstellingen uitschakelen, maar houd er rekening mee dat sommige onderdelen van de website dan mogelijk niet meer optimaal functioneren.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Jouw rechten</h2>
                <p>
                  Op basis van de AVG (GDPR) heb je het recht om:
                </p>
                <ul className="list-disc ml-6 mt-3 space-y-2">
                  <li>Inzage te vragen in de gegevens die we van je hebben.</li>
                  <li>Correctie of verwijdering van jouw gegevens aan te vragen.</li>
                  <li>Bezwaar te maken tegen de verwerking van jouw gegevens.</li>
                </ul>
                <p className="mt-4">
                  Neem hiervoor contact met ons op via de contactpagina.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Nauwkeurigheid & disclaimer van data</h2>
                <p>
                  Indachtig onze dienstverlening is het verwerken en tonen van voertuiginformatie en AI-analyse-uitkomsten puur adviserend en indicatief van aard. OccasionScan aggregeert informatie uit diverse externe openbare bronnen en registers. Wij kunnen de absolute juistheid, volledigheid of foutloosheid van deze gegevens of de daarop gebaseerde berekeningen en voorspellingen niet garanderen. Voor onze uitgebreide aansprakelijkheidsbeperkingen en uitsluitingen in relatie tot de geleverde rapporten verwijzen wij je uitdrukkelijk naar onze <a href="/voorwaarden" className="text-accent-green hover:underline">Algemene Voorwaarden</a>.
                </p>
              </section>
              
              <div className="pt-8 border-t border-white/5 text-gray-500 italic text-xs">
                Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};
