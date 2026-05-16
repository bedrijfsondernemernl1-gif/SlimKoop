import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Clock, MapPin, Send, CheckCircle } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Footer } from '@/src/components/Footer';

export const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const data = new FormData(form);
    
    try {
      const response = await fetch("https://formspree.io/f/mqenndyv", {
        method: "POST",
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsSubmitted(true);
        form.reset();
      } else {
        alert("Er ging iets mis met het versturen van uw bericht. Probeer het later opnieuw.");
      }
    } catch (error) {
      alert("Er ging iets mis met het versturen van uw bericht. Probeer het later opnieuw.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-32 flex flex-col relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-accent-green/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10 flex-1 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-6">Contacteer Ons</h1>
            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
              Heb je een vraag over een rapport, ons abonnement of iets anders? We helpen je graag verder.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Stuur een bericht</h2>
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel border-accent-green/20 p-8 rounded-2xl bg-accent-green/5 text-center flex flex-col items-center justify-center min-h-[300px]"
                  >
                    <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center mb-6">
                      <CheckCircle className="w-8 h-8 text-accent-green" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Bedankt voor je bericht!</h3>
                    <p className="text-gray-300">
                      We hebben je bericht in goede orde ontvangen en nemen zo snel mogelijk contact met je op.
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                      className="mt-8 border-white/20 text-white hover:bg-white/10"
                    >
                      Nog een bericht sturen
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Naam</label>
                      <Input name="name" type="text" placeholder="Jouw naam" className="bg-black/50 border-white/10 text-white rounded-xl h-12" required disabled={isSubmitting} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mailadres</label>
                      <Input name="email" type="email" placeholder="naam@voorbeeld.nl" className="bg-black/50 border-white/10 text-white rounded-xl h-12" required disabled={isSubmitting} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Onderwerp</label>
                      <Input name="subject" type="text" placeholder="Waar gaat het over?" className="bg-black/50 border-white/10 text-white rounded-xl h-12" disabled={isSubmitting} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Bericht</label>
                      <textarea 
                        name="message"
                        className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-4 min-h-[150px] focus:ring-2 focus:ring-accent-green focus:border-transparent outline-none transition-all resize-none disabled:opacity-50"
                        placeholder="Typ hier je bericht..."
                        required
                        disabled={isSubmitting}
                      ></textarea>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl bg-accent-green text-black font-semibold mt-2" disabled={isSubmitting}>
                      <Send className="w-4 h-4 mr-2" /> {isSubmitting ? 'Versturen...' : 'Versturen'}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Onze Gegevens</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                      <Mail className="w-5 h-5 text-accent-green" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">E-mail</h3>
                      <p className="text-gray-400 text-sm">support@slimkoop.nl</p>
                      <p className="text-gray-500 text-xs mt-1">We streven ernaar binnen 24 uur te reageren.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                      <Clock className="w-5 h-5 text-accent-green" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Werktijden</h3>
                      <p className="text-gray-400 text-sm">Maandag - Vrijdag</p>
                      <p className="text-gray-400 text-sm">09:00 - 17:00</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                      <MapPin className="w-5 h-5 text-accent-green" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Kantoor</h3>
                      <p className="text-gray-400 text-sm">Amsterdam, Nederland</p>
                      <p className="text-gray-500 text-xs mt-1">Wij werken volledig online, bezoekuitsluitend op afspraak.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};
