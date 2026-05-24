import React from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';

export const ScanLimitModal: React.FC = () => {
  const navigate = useNavigate();
  const { isScanLimitModalOpen, closeScanLimitModal } = useStore();

  const handleUpgrade = () => {
    closeScanLimitModal();
    navigate('/prijzen');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isScanLimitModalOpen && (
        <React.Fragment>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9998]"
            onClick={closeScanLimitModal}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[9999] p-0.5 rounded-3xl overflow-hidden"
          >
            {/* Inner Border Glow wrapper */}
            <div className="relative glass-panel border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-[#0A111F]/95 backdrop-blur-3xl overflow-y-auto max-h-[90vh] scrollbar-hide no-scrollbar flex flex-col items-center text-center">
              
              {/* Background ambient light effects */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent-green/10 blur-[50px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-accent-green/5 blur-[40px] rounded-full pointer-events-none" />

              {/* Top-Right X Close button */}
              <button
                id="close-scan-limit-modal-top"
                onClick={closeScanLimitModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Premium Icon Header */}
              <div className="relative z-10 flex items-center justify-center mb-6">
                <div className="relative">
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-full bg-accent-green/20 animate-ping opacity-75" />
                  {/* Second outer ring */}
                  <div className="absolute -inset-2 rounded-full border border-accent-green/20" />
                  {/* Icon body */}
                  <div className="relative w-16 h-16 bg-accent-green/10 border-2 border-accent-green/40 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-accent-green fill-accent-green/20" />
                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-accent-green animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Title / Heading */}
              <h2 className="relative z-10 text-2xl font-bold font-heading text-white tracking-tight leading-snug mb-3">
                Gratis scan limiet bereikt
              </h2>

              {/* Short explanation/text */}
              <p className="relative z-10 text-gray-300 text-sm md:text-[15px] leading-relaxed mb-6 max-w-sm">
                Je gratis scan is gebruikt. Upgrade naar <span className="text-accent-green font-semibold">Losse Scan</span>, <span className="text-accent-green font-semibold">Slimme Koper</span> of <span className="text-accent-green font-semibold">Autohandelaar</span> om direct weer volledige advertenties te analyseren.
              </p>

              {/* CTA Upgrade Button */}
              <button
                id="modal-upgrade-cta-button"
                onClick={handleUpgrade}
                className="relative z-10 w-full py-3.5 px-6 rounded-xl bg-accent-green hover:bg-accent-green/90 text-black font-extrabold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(0,200,83,0.3)] mb-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-current" />
                Upgrade Nu
              </button>

              {/* Plain Secondary Close text button */}
              <button
                id="modal-close-cancel-button"
                onClick={closeScanLimitModal}
                className="relative z-10 text-gray-400 hover:text-white text-sm font-semibold py-2 transition-colors cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
};
