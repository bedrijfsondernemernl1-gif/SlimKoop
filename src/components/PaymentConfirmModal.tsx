import React from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageName: string | null;
  onConfirm: (code: string | null) => void;
  isProcessing: boolean;
}

const PACKAGE_DETAILS: Record<string, {
  price: string;
  type: string;
  description: string;
  features: string[];
}> = {
  "Losse Scan": {
    price: "€9,99",
    type: "Eenmalige betaling",
    description: "Ideaal wanneer je één specifieke occasion op het oog hebt en alle risico's wilt uitsluiten.",
    features: [
      "1 volledige diepgaande scan",
      "RDW APK & Kenteken Historie check",
      "AI Schade check op foto's",
      "Prijsadvies & DealScore berekening",
      "Direct online beschikbaar"
    ]
  },
  "Slimme Koper": {
    price: "€19,99",
    type: "Eenmalige betaling",
    description: "Het meest gekozen pakket. Vergelijk meerdere auto's en kies met 100% zekerheid de beste deal.",
    features: [
      "3 volledige scans (60 dagen geldig)",
      "RDW APK & Kenteken Historie check",
      "AI Schade check op foto's",
      "Uitgebreide DealScore & Prijsadvies",
      "Honderden euro's besparen op je aankoop",
      "Direct online beschikbaar"
    ]
  },
  "Autohandelaar": {
    price: "€29,00",
    type: "Maandelijks abonnement",
    description: "Voor de actieve autohandelaar of autobedrijf die onbeperkt rapporten wil genereren.",
    features: [
      "Onbeperkt aantal scans per maand",
      "Volledige toegang tot alle Slimme Koper functionaliteiten",
      "Snelle PDF export om te delen met klanten",
      "Altijd als eerste toegang tot nieuwe AI-updates",
      "Maandelijks opzegbaar"
    ]
  }
};

export const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  isOpen,
  onClose,
  packageName,
  onConfirm,
  isProcessing
}) => {
  const [couponCode, setCouponCode] = React.useState('');
  const [isChecking, setIsChecking] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<any>(null);
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setCouponCode('');
      setValidationResult(null);
      setErrorMsg('');
      setIsChecking(false);
    }
  }, [isOpen]);

  if (typeof document === 'undefined') return null;
  if (!packageName) return null;

  const pkg = PACKAGE_DETAILS[packageName];
  if (!pkg) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsChecking(true);
    setErrorMsg('');
    setValidationResult(null);
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, packageName })
      });
      const data = await res.json();
      if (data.valid) {
        setValidationResult(data);
      } else {
        setErrorMsg(data.error || 'Ongeldige kortingscode.');
      }
    } catch (err) {
      setErrorMsg('Kon kortingscode niet verifiëren.');
    } finally {
      setIsChecking(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
            onClick={isProcessing ? undefined : onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg z-[9999] p-0.5 rounded-[2rem] overflow-hidden"
          >
            {/* Inner Border Glow wrapper */}
            <div className="relative glass-panel border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.85)] bg-[#070D19]/98 backdrop-blur-3xl overflow-y-auto max-h-[92vh] scrollbar-hide no-scrollbar flex flex-col">
              
              {/* Background ambient light effects */}
              <div className="absolute top-0 left-1/4 w-48 h-48 bg-accent-green/5 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-36 h-36 bg-accent-green/5 blur-[50px] rounded-full pointer-events-none" />

              {/* Close button */}
              <button
                id="close-confirm-modal"
                onClick={onClose}
                disabled={isProcessing}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="mb-4 text-center sm:text-left">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent-green bg-accent-green/10 border border-accent-green/20 px-3 py-1 rounded-full inline-block mb-2">
                  Bestelling Controleren
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
                  Kies je voor {packageName}?
                </h2>
              </div>

              {/* Package Details Box */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">{packageName}</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">{pkg.description}</p>
                </div>
                <div className="text-right flex flex-col justify-center shrink-0 min-w-[120px] bg-accent-green/5 border border-accent-green/10 rounded-xl p-3">
                  {validationResult ? (
                    <>
                      <div className="text-xs text-gray-500 line-through text-center">
                        {pkg.price}
                      </div>
                      <div className="text-xl sm:text-2xl font-heading font-extrabold text-accent-green text-center">
                        €{parseFloat(validationResult.finalPrice).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                      </div>
                    </>
                  ) : (
                    <div className="text-2xl sm:text-3xl font-heading font-extrabold text-white text-center">
                      {pkg.price}
                    </div>
                  )}
                  <div className="text-[10px] uppercase font-bold text-accent-green mt-0.5 tracking-wider text-center">
                    {pkg.type}
                  </div>
                </div>
              </div>

              {/* Coupon input section */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 mb-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Heb je een kortingscode?
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Bijv. INFLUENCER10"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    disabled={isProcessing || isChecking || !!validationResult}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-green/50 disabled:opacity-50 uppercase font-mono tracking-wider"
                  />
                  {validationResult ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCouponCode('');
                        setValidationResult(null);
                      }}
                      disabled={isProcessing}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-55 border border-red-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Wissen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isProcessing || isChecking || !couponCode.trim()}
                      className="bg-white/10 hover:bg-white/20 text-white disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 min-w-[75px] justify-center"
                    >
                      {isChecking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Koppelen"
                      )}
                    </button>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-400 mt-1.5 font-medium flex items-center gap-1">
                    <span>⚠</span> {errorMsg}
                  </p>
                )}

                {validationResult && (
                  <div className="text-xs text-accent-green mt-2 font-medium flex flex-col gap-0.5 bg-accent-green/5 border border-accent-green/10 rounded-lg p-2.5">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-green shrink-0" />
                      Code <strong>{validationResult.code}</strong> toegepast! (<strong>{validationResult.discountPercent}%</strong> korting)
                    </span>
                    <span className="text-gray-400 mt-0.5 text-[11px]">
                      Origineel: €{validationResult.originalPrice.toLocaleString('nl-NL', { minimumFractionDigits: 2 })} | <strong>Nieuwe prijs: €{parseFloat(validationResult.finalPrice).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Features checklist */}
              <div className="mb-5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                  Inbegrepen in dit pakket:
                </span>
                <ul className="space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="rounded-full p-0.5 shrink-0 flex items-center justify-center h-5 w-5 mt-0.5 bg-accent-green/10 text-accent-green">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Secure payment banner */}
              <div className="mb-5 bg-white/[0.01] border border-white/5 p-3 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-accent-green" />
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">Beveiligde Transactie</span>
                  <span className="text-[11px] text-gray-400 block">Je wordt veilig doorverwezen naar Mollie om te betalen via iDEAL.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-auto">
                <button
                  id="confirm-payment-button"
                  onClick={() => onConfirm(validationResult ? validationResult.code : null)}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 rounded-xl bg-accent-green hover:bg-accent-green/90 disabled:bg-accent-green/50 text-black font-extrabold text-base transition-all active:scale-[0.98] shadow-[0_4px_25px_rgba(0,200,83,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Moment geduld...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 fill-current" />
                      Afrekenen met iDEAL
                    </>
                  )}
                </button>

                <button
                  id="cancel-payment-button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full py-3 px-6 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-400 hover:text-white text-sm font-bold transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  Annuleren en terug
                </button>
              </div>

              {/* Security trust badge spacer */}
              <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-medium">
                <Lock className="w-3 h-3" />
                128-bit SSL Versleutelde Verbinding
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
};
