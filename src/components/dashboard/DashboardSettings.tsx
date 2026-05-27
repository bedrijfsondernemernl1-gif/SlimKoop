import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, CreditCard, Shield, Moon, Trash2, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useStore } from '@/src/store/useStore';
import { auth, db } from '../../lib/firebase';
import { sendPasswordResetEmail, deleteUser, signOut, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { deleteDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';

export const DashboardSettings: React.FC = () => {
  const { isPremium, subscriptionPlan, user, scansOver } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Proactively sync subscription when returning to settings tab
    const syncSubscription = async () => {
      if (user?.uid) {
        try {
          await fetch('/api/sync-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid })
          });
        } catch (e) {}
      }
    };
    syncSubscription();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSubscription();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      setPasswordError('');
      await sendPasswordResetEmail(auth, user.email);
      setPasswordResetSent(true);
      setTimeout(() => setPasswordResetSent(false), 5000);
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      setPasswordError(error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    // Check if user has an active subscription
    // Users with an active monthly subscription (Autohandelaar or Particulier) must cancel first
    // Admins are excluded from this check
    const adminEmails = ['ibrahimdiscord675@gmail.com', 'sblzakelijk@gmail.com', 'bedrijfsondernemernl1@gmail.com'];
    const isAdmin = adminEmails.includes((user.email || '').toLowerCase());
    
    if (isPremium && subscriptionPlan !== 'Losse Scan' && !isAdmin) {
      alert("Neem contact op met support@occasionscan.nl om je abonnement op te zeggen voordat je je account kunt verwijderen.");
      setShowDeleteConfirm(false);
      return;
    }

    setDeleteLoading(true);
    try {
      // 1. Delete all user analyses
      const analysesQuery = query(collection(db, 'analyses'), where('userId', '==', user.uid));
      const analysesSnapshot = await getDocs(analysesQuery);
      const deletePromises = analysesSnapshot.docs.map(d => deleteDoc(doc(db, 'analyses', d.id)));
      await Promise.all(deletePromises);
      
      // 2. Delete user document from firestore
      await deleteDoc(doc(db, 'gebruikers', user.uid));

      // 3. Delete auth user
      try {
        await deleteUser(user);
      } catch (authError: any) {
        if (authError.code === 'auth/requires-recent-login') {
          // Attempt to re-authenticate with Google
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(user, provider);
          // Retry deletion
          await deleteUser(user);
        } else {
          throw authError;
        }
      }
      
      // Navigate to home, zustand handles the state implicitly through onAuthStateChanged
      navigate('/');
    } catch (error: any) {
      console.error("Error deleting account", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Je moet recent ingelogd zijn om je account te verwijderen. Log alsjeblieft uit en opnieuw in om dit te voltooien.");
      } else {
        alert("Er is iets misgegaan bij het verwijderen. (" + error.message + ")");
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profiel', icon: User },
    { id: 'subscription', label: 'Abonnement', icon: CreditCard },
    { id: 'account', label: 'Account', icon: Shield },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <h2 className="text-3xl font-heading font-bold text-white tracking-tight mb-2">Instellingen</h2>
      <p className="text-gray-400 mb-8">Beheer je account, facturatie en voorkeuren.</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 max-w-3xl glass-panel rounded-3xl border border-white/10 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-dark/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          {activeTab === 'profile' && (
            <div className="space-y-8 relative z-10">
              <h3 className="text-xl font-bold text-white mb-6">Profiel Informatie</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Naam</label>
                  <Input defaultValue={user?.displayName || ''} placeholder="Je naam" disabled className="h-12 bg-black/50 border-white/10 text-gray-400 rounded-xl focus-visible:ring-transparent cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Email adres</label>
                  <Input defaultValue={user?.email || ''} type="email" disabled className="h-12 bg-black/50 border-white/10 text-gray-400 rounded-xl focus-visible:ring-transparent cursor-not-allowed" />
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
                <Button className="bg-accent-green hover:bg-accent-green/90 text-black font-semibold rounded-xl h-12 px-8 shadow-lg">
                  Wijzigingen opslaan
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-8 relative z-10">
              <h3 className="text-xl font-bold text-white mb-6">Jouw Abonnement</h3>
              
              <div className="bg-gradient-to-br from-primary-dark/40 to-black p-6 rounded-2xl border border-accent-green/30 shadow-[inset_0_0_30px_rgba(0,200,83,0.05)] relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent-green/20 blur-3xl rounded-full"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-medium mb-3">
                      Huidig Plan
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-1">
                      {isPremium ? (subscriptionPlan || 'Abonnement') : 'Gratis Account'}
                    </h4>
                    <p className="text-gray-400">
                      {isPremium ? 'Actief abonnement.' : 'Beperkte toegang. Upgrade voor volledige inzichten.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-heading font-bold text-white">
                      {isPremium ? (subscriptionPlan === 'Autohandelaar' ? '€29' : (subscriptionPlan === 'Losse Scan' ? '€9,99' : '€19,99')) : '€0'}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {subscriptionPlan === 'Autohandelaar' ? 'per maand' : (isPremium ? 'eenmalig' : '')}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 border-t border-white/10 pt-4 relative z-10">
                  {isPremium ? (
                    <p className="text-sm text-gray-400">
                      Voor het wijzigen of annuleren van je actieve abonnement kun je mailen naar{" "}
                      <a href="mailto:support@occasionscan.nl" className="text-accent-green hover:underline font-medium">
                        support@occasionscan.nl
                      </a>
                      .
                    </p>
                  ) : (
                    <Button 
                      className="bg-accent-green hover:bg-accent-green/90 text-black font-semibold rounded-xl w-full h-11"
                      onClick={() => navigate('/prijzen')}
                    >
                      Upgrade nu
                    </Button>
                  )}
                </div>
              </div>

              {isPremium && (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <h4 className="text-lg font-semibold text-white mb-4">Betaalmethode</h4>
                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-white/10 rounded-md flex items-center justify-center border border-white/10">
                         <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Betaling via iDEAL / Bancontact</p>
                        <p className="text-xs text-gray-500">Veilig verwerkt door Mollie</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-8 relative z-10">
              <h3 className="text-xl font-bold text-white mb-6">Account Instellingen</h3>

              <div className="space-y-4 pb-8 border-b border-white/5">
                <h4 className="text-lg font-semibold text-white">Interface Uiterlijk</h4>
                <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-3 text-white">
                    <Moon className="w-5 h-5 text-accent-green" />
                    <span>Dark Mode forceer</span>
                  </div>
                  <Button variant="ghost" className="bg-white/10 text-white cursor-default hover:bg-white/10">Actief</Button>
                </div>
              </div>
              
              <div className="space-y-4 pb-8 border-b border-white/5">
                <h4 className="text-lg font-semibold text-white">Wachtwoord & Beveiliging</h4>
                <p className="text-sm text-gray-400 mb-4">Zorg dat je account goed beveiligd is door een sterk wachtwoord te gebruiken.</p>
                
                {passwordResetSent ? (
                  <div className="p-4 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-xl">
                    Er is een e-mail verzonden naar <strong>{user?.email}</strong> met instructies om je wachtwoord te wijzigen.
                  </div>
                ) : (
                  <div>
                    <Button 
                      onClick={handlePasswordReset}
                      variant="outline" 
                      className="border-white/10 text-white bg-white/5 hover:bg-white/10 rounded-xl h-11 px-6"
                    >
                      Stuur Wachtwoord Wijzigen E-mail
                    </Button>
                    {passwordError && <p className="text-red-400 text-sm mt-3">{passwordError}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-red-500">Gevarenzone</h4>
                <p className="text-sm text-gray-400 mb-4">Verwijder je account en alle bijbehorende autogegevens permanent. Dit proces is onomkeerbaar.</p>
                
                {showDeleteConfirm ? (
                  <div className="p-5 border border-red-500/30 bg-red-500/10 rounded-2xl space-y-4">
                    <h5 className="font-bold text-white">Weet je het heel zeker?</h5>
                    <p className="text-sm text-red-200">Al je opgeslagen rapportages en gegevens worden permanent verwijderd. Dit is niet ongedaan te maken.</p>
                    <div className="flex items-center gap-3 pt-2">
                       <Button 
                         onClick={handleDeleteAccount}
                         disabled={deleteLoading}
                         className="bg-red-500 hover:bg-red-600 text-white border-none rounded-xl"
                       >
                         {deleteLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto mr-2" /> : null}
                         Ja, verwijder mijn account permanent
                       </Button>
                       <Button
                         onClick={() => setShowDeleteConfirm(false)}
                         disabled={deleteLoading}
                         variant="ghost" 
                         className="text-gray-300 hover:text-white"
                       >
                         Annuleren
                       </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="ghost" 
                    className="text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 rounded-xl h-11 px-6 gap-2 border border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Account Volledig Verwijderen
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
