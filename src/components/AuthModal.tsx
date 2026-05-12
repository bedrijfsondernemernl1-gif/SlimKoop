import React from 'react';
import { createPortal } from 'react-dom';
import { Car, Mail, Lock, X } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = React.useState(true);
  const navigate = useNavigate();
  const { login } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    onClose();
    navigate('/dashboard');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[9999] max-h-[85vh] flex flex-col"
          >
            <div className="relative glass-panel border-white/10 rounded-3xl p-6 shadow-2xl bg-black/60 backdrop-blur-2xl overflow-y-auto no-scrollbar w-full flex-1">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-0 right-0 w-48 h-48 bg-accent-green/10 blur-[60px] rounded-full pointer-events-none"></div>

              <div className="flex justify-center mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="bg-accent-green/20 p-2 rounded-xl border border-accent-green/30">
                    <Car className="h-5 w-5 text-accent-green" />
                  </div>
                  <span className="text-xl font-heading font-black tracking-tight text-white">
                    Slim<span className="text-accent-green">Koop</span>
                  </span>
                </div>
              </div>

              <h1 className="text-xl font-bold text-white text-center mb-1.5 relative z-10">
                {isLogin ? 'Welkom terug' : 'Maak een account aan'}
              </h1>
              <p className="text-gray-400 text-center text-xs mb-6 relative z-10">
                {isLogin ? 'Log in om je rapporten te bekijken.' : 'Krijg toegang tot premium inzichten.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                      type="email" 
                      placeholder="naam@voorbeeld.nl" 
                      className="pl-9 bg-black/50 border-white/10 text-white text-sm rounded-xl h-10 focus-visible:ring-accent-green"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Wachtwoord</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-9 bg-black/50 border-white/10 text-white text-sm rounded-xl h-10 focus-visible:ring-accent-green"
                      required
                    />
                  </div>
                </div>
                
                {isLogin && (
                  <div className="flex justify-end pt-0.5">
                    <span className="text-xs text-accent-green hover:text-accent-green/80 cursor-pointer font-medium transition-colors">
                      Wachtwoord vergeten?
                    </span>
                  </div>
                )}
                
                <Button type="submit" className="w-full h-10 rounded-xl bg-accent-green hover:bg-accent-green/90 text-black font-semibold mt-4 shadow-[0_0_15px_rgba(0,200,83,0.2)]">
                  {isLogin ? 'Inloggen' : 'Registreren'}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-black/50 text-gray-400 font-medium whitespace-nowrap backdrop-blur-sm rounded-md">Of doorgaan met</span>
                  </div>
                </div>

                <Button type="button" variant="outline" className="w-full h-10 rounded-xl bg-white/5 border-white/20 text-white hover:bg-white/10 font-semibold flex items-center justify-center gap-2 text-sm">
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-6 relative z-10">
                {isLogin ? 'Nog geen account? ' : 'Heb je al een account? '}
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-accent-green font-medium hover:underline underline-offset-4"
                >
                  {isLogin ? 'Schrijf je in' : 'Log in'}
                </button>
              </p>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
};
