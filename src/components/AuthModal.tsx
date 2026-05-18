import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Car, Mail, Lock, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'verify_message';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();
  const { login: setZustandLogin } = useStore();

  const handleSaveUser = async (user: any) => {
    const userRef = doc(db, 'gebruikers', user.uid);
    const userSnap = await getDoc(userRef).catch(err => handleFirestoreError(err, OperationType.GET, `gebruikers/${user.uid}`));
    if (userSnap && !userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        uid: user.uid,
        aanmaakdatum: new Date().toISOString()
      }).catch(err => handleFirestoreError(err, OperationType.WRITE, `gebruikers/${user.uid}`));
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await handleSaveUser(userCredential.user);
        // Do NOT redirect, show verification message
        setMode('verify_message');
        // Sign out so they represent logged-out state until they verify and login manually
        await signOut(auth);
      } else if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError('Controleer je e-mail om je account te verifiëren voordat je inlogt.');
          await signOut(auth);
        } else {
          await handleSaveUser(userCredential.user);
          setZustandLogin();
          onClose();
          navigate('/dashboard');
        }
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Wachtwoord reset link is verstuurd. Controleer je e-mail.');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('Dit e-mailadres is al in gebruik.');
      else if (err.code === 'auth/invalid-credential') setError('De inloggegevens zijn onjuist.');
      else setError(err.message || 'Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleSaveUser(result.user);
      setZustandLogin();
      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      setError('Inloggen met Google mislukt.');
    } finally {
      setLoading(false);
    }
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
            <div className="relative glass-panel border-white/10 rounded-3xl p-6 shadow-2xl bg-[#0A111F]/90 backdrop-blur-2xl overflow-y-auto no-scrollbar w-full flex-1">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-0 right-0 w-48 h-48 bg-accent-green/10 blur-[60px] rounded-full pointer-events-none"></div>

              <div className="flex justify-center mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://i.ibb.co/Y7MMQR76/f06abe35-17e0-4185-96aa-eae12841c0f5-removalai-preview.png" 
                    alt="OccasionScan Logo" 
                    className="h-16 w-auto"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {mode === 'verify_message' && (
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-green/30">
                    <CheckCircle className="w-8 h-8 text-accent-green" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Verifieer je e-mail</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    We hebben een verificatielink gestuurd naar <strong>{email}</strong>. Klik op de link om je account te activeren.
                  </p>
                  <Button 
                    onClick={() => setMode('login')}
                    className="w-full bg-accent-green text-black font-semibold rounded-xl"
                  >
                    Naar inloggen
                  </Button>
                </div>
              )}

              {mode !== 'verify_message' && (
                <>
                  <h1 className="text-xl font-bold text-white text-center mb-1.5 relative z-10">
                    {mode === 'login' && 'Welkom terug'}
                    {mode === 'register' && 'Maak een account aan'}
                    {mode === 'forgot' && 'Wachtwoord vergeten'}
                  </h1>
                  <p className="text-gray-400 text-center text-xs mb-6 relative z-10">
                    {mode === 'login' && 'Log in om je rapporten te bekijken.'}
                    {mode === 'register' && 'Krijg toegang tot premium inzichten.'}
                    {mode === 'forgot' && 'Vul je e-mail in om een reset link te ontvangen.'}
                  </p>

                  {error && (
                    <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-500 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-4 flex items-center gap-2 bg-accent-green/10 border border-accent-green/20 p-3 rounded-xl text-accent-green text-xs">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleEmailAuth} className="space-y-3 relative z-10">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="naam@voorbeeld.nl" 
                          className="pl-9 bg-black/50 border-white/10 text-white text-sm rounded-xl h-10 focus-visible:ring-accent-green"
                          required
                        />
                      </div>
                    </div>
                    
                    {mode !== 'forgot' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Wachtwoord</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••" 
                            className="pl-9 bg-black/50 border-white/10 text-white text-sm rounded-xl h-10 focus-visible:ring-accent-green"
                            required
                          />
                        </div>
                      </div>
                    )}
                    
                    {mode === 'login' && (
                      <div className="flex justify-end pt-0.5">
                        <span 
                          onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                          className="text-xs text-accent-green hover:text-accent-green/80 cursor-pointer font-medium transition-colors"
                        >
                          Wachtwoord vergeten?
                        </span>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-10 rounded-xl bg-accent-green hover:bg-accent-green/90 text-black font-semibold mt-4 shadow-[0_0_15px_rgba(0,200,83,0.2)] disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        mode === 'login' ? 'Inloggen' : 
                        mode === 'register' ? 'Registreren' : 'Stuur reset link'
                      )}
                    </Button>

                    {mode !== 'forgot' && (
                      <>
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-[#0A111F] text-gray-400 font-medium whitespace-nowrap rounded-md">Of doorgaan met</span>
                          </div>
                        </div>

                        <Button 
                          type="button" 
                          onClick={handleGoogleLogin}
                          disabled={loading}
                          variant="outline" 
                          className="w-full h-10 rounded-xl bg-white/5 border-white/20 text-white hover:bg-white/10 font-semibold flex items-center justify-center gap-2 text-sm"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Google
                        </Button>
                      </>
                    )}
                  </form>

                  <p className="text-center text-xs text-gray-400 mt-6 relative z-10">
                    {mode === 'login' && (
                      <>Nog geen account? <button onClick={() => { setMode('register'); setError(''); }} className="text-accent-green font-medium hover:underline underline-offset-4">Schrijf je in</button></>
                    )}
                    {mode === 'register' && (
                      <>Heb je al een account? <button onClick={() => { setMode('login'); setError(''); }} className="text-accent-green font-medium hover:underline underline-offset-4">Log in</button></>
                    )}
                    {mode === 'forgot' && (
                      <button onClick={() => { setMode('login'); setError(''); }} className="text-accent-green font-medium hover:underline underline-offset-4">Terug naar inloggen</button>
                    )}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
};
