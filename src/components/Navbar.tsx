import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogIn, LayoutDashboard, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '@/src/store/useStore';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const isLoggedIn = useStore(state => state.isLoggedIn);
  const logout = useStore(state => state.logout);
  const isAuthModalOpen = useStore(state => state.isAuthModalOpen);
  const openAuthModal = useStore(state => state.openAuthModal);
  const closeAuthModal = useStore(state => state.closeAuthModal);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleScrollToTop = () => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: "Hoe het werkt", href: "/hoe-het-werkt" },
    { label: "Prijzen", href: "/prijzen" },
    { label: "Blog", href: "/blog" },
    { label: "Over ons", href: "/over-ons" },
    { label: "Contact", href: "/contact" }
  ];

  const isBlogPostPage = location.pathname.startsWith('/blog/');
  
  return (
    <>
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 py-4 pointer-events-none"
      >
        <div className={`mx-auto max-w-7xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto rounded-[2rem] ${
          (isScrolled || isBlogPostPage) 
            ? 'glass-panel border-white/10 px-6 py-3 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.8)] bg-black/90 backdrop-blur-3xl' 
            : 'bg-transparent px-6 py-4'
        }`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 group z-50">
              <img 
                src="https://i.ibb.co/Y7MMQR76/f06abe35-17e0-4185-96aa-eae12841c0f5-removalai-preview.png" 
                alt="OccasionScan - AI auto scan tool voor Marktplaats & AutoScout" 
                loading="eager"
                className="h-14 sm:h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            </Link>
            
            {/* Desktop Navigation Center */}
            <div className="hidden md:flex items-center space-x-0.5 lg:space-x-1 text-sm font-medium text-gray-300 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
              {navLinks.map((link) => (
                <Link key={link.label} to={link.href} className="px-3 lg:px-5 py-2.5 rounded-xl hover:text-white hover:bg-white/10 transition-all relative overflow-hidden group/link">
                  <span className="relative z-10 whitespace-nowrap">{link.label}</span>
                  <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover/link:opacity-100 transition-opacity"></div>
                </Link>
              ))}
            </div>

            {/* Desktop Actions Right */}
            <div className="hidden md:flex items-center gap-1 lg:gap-3">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" className="gap-2 font-medium bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl h-11 px-3 lg:px-5 transition-all shadow-[inset_0_1px_rgba(255,255,255,0.05)]">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden xl:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Button variant="glass" size="icon" className="rounded-xl h-11 w-11 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 group transition-all" onClick={handleLogout} title="Uitloggen">
                    <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={openAuthModal}
                  className="font-semibold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl h-11 px-4 lg:px-5 transition-all cursor-pointer"
                >
                  Inloggen
                </Button>
              )}
              
              <Link to="/analyseer">
                <Button 
                  className="gap-2 font-semibold bg-accent-green hover:bg-accent-green/90 text-black shadow-[0_0_20px_rgba(0,200,83,0.3)] hover:shadow-[0_0_30px_rgba(0,200,83,0.5)] rounded-xl h-11 px-4 lg:px-6 transition-all group cursor-pointer whitespace-nowrap"
                >
                  <span className="hidden lg:inline">Gratis Analyseren</span>
                  <span className="lg:hidden">Analyseer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-3 z-50">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="cursor-pointer p-2.5 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all backdrop-blur-md"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Slide-in Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/80 flex flex-col pt-28 px-6 pb-6 md:hidden"
          >
            <div className="flex flex-col gap-2 relative z-10 flex-1">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col gap-2 bg-white/5 p-2 rounded-2xl border border-white/10"
              >
                {navLinks.map((link) => (
                  <Link 
                    key={link.label} 
                    to={link.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-5 py-4 rounded-xl text-lg font-medium text-gray-200 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all text-center"
                  >
                    {link.label}
                  </Link>
                ))}
              </motion.div>

              <div className="mt-8 flex flex-col gap-3">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link to="/analyseer" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      className="w-full h-14 text-lg font-semibold bg-accent-green hover:bg-accent-green/90 text-black shadow-[0_0_20px_rgba(0,200,83,0.3)] rounded-2xl flex justify-center items-center gap-2 cursor-pointer"
                    >
                      Gratis Analyseren
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {isLoggedIn ? (
                    <div className="flex gap-2">
                       <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                         <Button variant="ghost" className="w-full h-14 gap-2 text-lg font-medium bg-white/5 border border-white/10 text-white rounded-2xl">
                           <LayoutDashboard className="w-5 h-5" />
                           Dashboard
                         </Button>
                       </Link>
                       <Button variant="glass" className="h-14 w-14 rounded-2xl shrink-0 text-red-400 hover:bg-red-500/20" onClick={handleLogout}>
                         <LogOut className="w-5 h-5" />
                       </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal();
                      }}
                      variant="ghost" 
                      className="w-full h-14 text-lg font-medium bg-white/5 border border-white/10 text-white rounded-2xl cursor-pointer" 
                    >
                      <LogIn className="w-5 h-5 mr-2" /> Inloggen
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
            
            {/* Ambient background for menu */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary-dark/30 to-transparent pointer-events-none"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </>
  );
};

