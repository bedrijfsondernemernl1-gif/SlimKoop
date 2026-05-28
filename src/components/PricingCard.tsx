import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, ShieldCheck, AlertCircle, X, CreditCard } from 'lucide-react';
import { Button } from './ui/button';

export const PricingCard = ({ title, price, period, description, features, btnText, featured = false, badgeText, buttonStyle = 'outline', onClick, isDealer = false, disabled = false }: any) => {
  const isFeatured = featured;
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  
  let btnClasses = "bg-transparent text-white border-white/20 hover:border-white/40 hover:bg-white/10";
  if (buttonStyle === 'primary') {
    btnClasses = "bg-accent-green hover:bg-accent-green/90 text-black shadow-lg shadow-accent-green/20 border-transparent";
  } else if (buttonStyle === 'outline-green') {
    btnClasses = "bg-transparent text-accent-green border-accent-green hover:bg-accent-green/10";
  } else if (buttonStyle === 'dealer-premium') {
    btnClasses = "bg-gradient-to-r from-accent-green to-emerald-500 hover:opacity-95 active:scale-98 text-black font-bold shadow-[0_4px_20px_rgba(0,200,83,0.15)] border-transparent transition-all duration-350";
  }

  if (disabled) {
    if (buttonStyle === 'dealer-premium' || buttonStyle === 'primary') {
      btnClasses = "bg-gray-800 text-gray-500 border-transparent cursor-not-allowed opacity-60";
    } else {
      btnClasses = "bg-transparent text-gray-500 border-gray-800 cursor-not-allowed opacity-60";
    }
  }

  const handleBtnClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (title === "Autohandelaar") {
      setIsConsentModalOpen(true);
      return;
    }
    if (onClick) onClick();
  };

  const handleModalConfirm = () => {
    if (!consentChecked) {
      setShowConsentError(true);
      return;
    }
    
    setShowConsentError(false);
    setIsConsentModalOpen(false);
    
    if (onClick) {
      onClick();
    }
  };

  const handleModalClose = () => {
    setIsConsentModalOpen(false);
    setShowConsentError(false);
  };

  return (
    <motion.div 
      whileHover={disabled ? {} : { y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className={`relative p-6 sm:p-8 rounded-[2rem] flex flex-col h-full transition-all duration-300 ${
        isDealer
        ? 'bg-gradient-to-b from-[#01140A] via-primary-dark/95 to-black/95 border-2 border-accent-green/30 shadow-[0_0_30px_rgba(0,200,83,0.05)] z-10 lg:scale-[1.02]'
        : isFeatured 
          ? 'bg-gradient-to-b from-primary-dark/80 to-black/90 border border-accent-green/40 shadow-[0_0_20px_rgba(0,200,83,0.08)] z-10 lg:scale-[1.01]' 
          : 'glass-panel border-white/5 bg-black/40'
      }`}
    >
      {badgeText && (
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[11px] font-extrabold rounded-full tracking-wider shadow-lg whitespace-nowrap flex items-center gap-1.5 border ${
          isDealer 
          ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 border-transparent uppercase'
          : isFeatured 
            ? 'bg-accent-green text-black border-transparent uppercase' 
            : 'bg-white/10 text-white border-white/20'
        }`}>
          {isDealer && <Sparkles className="w-3.5 h-3.5" />}
          {badgeText}
        </div>
      )}
      
      <div className="mb-8 mt-2">
        <h3 className={`text-2xl font-bold mb-2 ${isDealer ? 'text-white' : 'text-gray-100'}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-400 min-h-[2.5rem] lg:min-h-0 lg:h-10">{description}</p>
        <div className="flex items-baseline gap-1 mt-4">
          <span className={`text-5xl font-heading font-extrabold text-white`}>{price}</span>
          {period && <span className="text-gray-500 font-medium">{period}</span>}
        </div>
      </div>
      
      <ul className="space-y-4 mb-10 flex-1">
        {features.map((f: any, i: number) => (
          <li key={i} className="flex gap-4 items-start">
            {f.included ? (
              <div className={`rounded-full p-0.5 shrink-0 flex items-center justify-center h-6 w-6 mt-0.5 ${isDealer ? 'bg-accent-green/25 text-accent-green shadow-[0_0_8px_rgba(0,199,83,0.2)]' : 'bg-accent-green/20 text-accent-green'}`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="bg-white/5 rounded-full p-0.5 shrink-0 flex items-center justify-center h-6 w-6 mt-0.5">
                <div className="w-2 h-2 rounded-full border border-white/20" />
              </div>
            )}
            <span className={`text-sm pt-0.5 ${f.included ? 'text-gray-200' : 'text-gray-500'}`}>{f.text}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        size="lg" 
        variant={(isDealer || buttonStyle === 'primary') ? "default" : "outline"}
        className={`w-full h-14 rounded-xl text-md font-bold transition-all duration-300 ${btnClasses}`}
        onClick={handleBtnClick}
        disabled={disabled}
      >
        {btnText}
      </Button>

      {/* Portal Consent Modal for Recurring Subscription */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isConsentModalOpen && (
            <React.Fragment>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
                onClick={handleModalClose}
              />

              {/* Modal window */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg z-[9999] p-0.5 rounded-3xl overflow-hidden"
              >
                <div className="relative glass-panel border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85)] bg-[#030d07] backdrop-blur-3xl overflow-y-auto max-h-[90vh]">
                  
                  {/* Subtle ambient green glow under the dialog */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent-green/10 blur-[60px] rounded-full pointer-events-none" />

                  {/* Close icon */}
                  <button
                    onClick={handleModalClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                    aria-label="Sluiten"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="h-14 w-14 rounded-2xl bg-accent-green/10 flex items-center justify-center border border-accent-green/20 mb-4 shadow-[0_0_15px_rgba(0,199,83,0.1)]">
                      <ShieldCheck className="w-8 h-8 text-accent-green" />
                    </div>

                    <h3 className="text-xl font-bold font-heading text-white mb-2 text-center">Machtiging &amp; Toestemming</h3>
                    <p className="text-xs text-gray-400 mb-6 text-center max-w-sm leading-relaxed">
                      Om je premium <strong className="text-white">Autohandelaar</strong> abonnement van <strong className="text-white">€29/maand</strong> te activeren, dient er via Mollie een eerste mandaat-betaling te worden voldaan.
                    </p>

                    {/* Transparency info section */}
                    <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-xl text-left text-xs text-gray-400 mb-6 flex flex-col gap-2">
                      <div className="flex justify-between border-b border-white/5 pb-1.5 font-medium">
                        <span className="text-gray-400">Pakket:</span>
                        <span className="text-white">Autohandelaar Premium</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span>Maandbedrag:</span>
                        <span className="text-white font-bold">€29,00</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span>Frequentie:</span>
                        <span className="text-accent-green font-semibold">Per maand</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span>Type betaling:</span>
                        <span className="text-white">Doorlopende automatische incasso</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Opzegvoorwaarden:</span>
                        <span className="text-white text-right">Maandelijks direct opzegbaar via je dashboard</span>
                      </div>
                    </div>

                    {/* Subscription Consent Box */}
                    <div className={`w-full mb-6 p-4 rounded-xl border text-left transition-all duration-300 ${
                      showConsentError 
                        ? 'border-red-500 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.2)]' 
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          id="modal-recurring-consent"
                          onClick={() => {
                            const newValue = !consentChecked;
                            setConsentChecked(newValue);
                            if (newValue) {
                              setShowConsentError(false);
                            }
                          }}
                          className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center border transition-all duration-200 shrink-0 ${
                            consentChecked
                              ? "bg-accent-green border-accent-green text-black shadow-[0_0_10px_rgba(34,240,126,0.3)]"
                              : "border-white/20 bg-white/5 hover:border-white/40 text-transparent"
                          }`}
                          aria-checked={consentChecked}
                          role="checkbox"
                        >
                          <svg
                            className={`w-3.5 h-3.5 stroke-[3] transition-transform duration-200 ${
                              consentChecked ? "scale-100" : "scale-0"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <span
                          onClick={() => {
                            const newValue = !consentChecked;
                            setConsentChecked(newValue);
                            if (newValue) {
                              setShowConsentError(false);
                            }
                          }}
                          className="text-xs text-gray-200 cursor-pointer select-none leading-relaxed"
                        >
                          Ik geef toestemming voor een terugkerende maandelijkse betaling totdat het abonnement wordt opgezegd. <span className="text-red-500 font-bold">*</span>
                        </span>
                      </div>

                      {showConsentError && (
                        <div className="flex items-center gap-1.5 text-red-400 text-[11px] font-semibold mt-3 animate-pulse font-sans">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Toestemming is verplicht om dit abonnement te activeren.</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        size="lg"
                        className="w-full h-12 rounded-xl bg-accent-green hover:bg-accent-green/90 text-black font-extrabold shadow-lg shadow-accent-green/10"
                        onClick={handleModalConfirm}
                      >
                        Akkoord, ga naar betaling
                      </Button>
                      <Button
                        size="lg"
                        variant="ghost"
                        className="w-full h-12 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
                        onClick={handleModalClose}
                      >
                        Annuleren
                      </Button>
                    </div>

                    <div className="flex items-center gap-1.5 justify-center mt-4 text-[10px] text-gray-500">
                      <CreditCard className="w-3.5 h-3.5" /> Beveiligde transactie via Mollie payments
                    </div>

                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          )}
        </AnimatePresence>,
        document.body
      )}

    </motion.div>
  );
};
