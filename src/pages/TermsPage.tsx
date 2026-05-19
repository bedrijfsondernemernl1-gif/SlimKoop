import React from 'react';
import { motion } from 'motion/react';
import { FileText, Gavel, AlertCircle } from 'lucide-react';
import { Footer } from '@/src/components/Footer';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pt-40 flex flex-col relative overflow-hidden">
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-accent-green/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 flex-1 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6">Algemene Voorwaarden</h1>
            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
              Lees deze voorwaarden zorgvuldig door voordat je gebruikmaakt van OccasionScan.
            </p>
          </div>

          <div className="glass-panel border-white/10 rounded-3xl p-8 md:p-12 mb-16 bg-black/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-accent-green/5 blur-3xl rounded-full"></div>
            <div className="relative z-10 space-y-8 text-gray-300 leading-relaxed text-sm md:text-base">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-accent-green" />
                  1. Diensten van OccasionScan
                </h2>
                <p>
                  OccasionScan biedt een platform voor de analyse van tweedehands voertuigen op basis van online advertenties en openbare data. De resultaten zijn bedoeld als hulpmiddel en advies, niet als bindende taxatie of garantie op de staat van een voertuig.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <Gavel className="w-6 h-6 text-accent-green" />
                  2. Gebruik van het Platform
                </h2>
                <p>
                  Als gebruiker ga je akkoord met het volgende:
                </p>
                <ul className="list-disc ml-6 mt-3 space-y-2">
                  <li>Je verstrekt alleen correcte gegevens bij het aanmaken van een account.</li>
                  <li>Je gebruikt het platform niet voor illegale doeleinden of om de systemen van OccasionScan te overbelasten.</li>
                  <li>Het is niet toegestaan om geautomatiseerde scripts te gebruiken om data van OccasionScan te scrapen zonder uitdrukkelijke toestemming.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-accent-green" />
                  3. Disclaimer & Aansprakelijkheid
                </h2>
                <p>
                  Hoewel onze AI-modellen met de grootste zorg zijn samengesteld, kan OccasionScan niet aansprakelijk worden gesteld voor:
                </p>
                <ul className="list-disc ml-6 mt-3 space-y-2">
                  <li>Financiële verliezen naar aanleiding van een voertuigaankoop.</li>
                  <li>Onjuistheden in de data die afkomstig is van externe bronnen zoals Marktplaats of AutoScout24.</li>
                  <li>Invalide analyses door onvolledige informatie in een advertentie.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Betalingen en Abonnementen</h2>
                <p>
                  Premium diensten worden gefactureerd via Stripe. Abonnementen worden automatisch verlengd, tenzij je deze opzegt via jouw dashboardinstellingen. Restitutie voor verbruikte diensten is in de regel niet mogelijk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Intellectueel Eigendom</h2>
                <p>
                  Alle inhoud op deze website, inclusief de AI-algoritmen en de gegenereerde rapporten, is eigendom van OccasionScan en mag niet zonder toestemming worden gekopieerd of gedistribueerd.
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
