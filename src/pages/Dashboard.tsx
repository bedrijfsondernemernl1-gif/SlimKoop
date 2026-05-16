import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { LayoutDashboard as LayoutDashboardIcon, Heart, History, Settings } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useStore } from '@/src/store/useStore';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { DashboardOverview } from '@/src/components/dashboard/DashboardOverview';
import { DashboardGarage } from '@/src/components/dashboard/DashboardGarage';
import { DashboardHistory } from '@/src/components/dashboard/DashboardHistory';
import { DashboardSettings } from '@/src/components/dashboard/DashboardSettings';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPremium, subscriptionPlan } = useStore();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isSuccess = searchParams.get('success');

    if (isSuccess === 'true') {
      setShowSuccess(true);
      if (sessionId) {
        fetch(`/api/verify-checkout-session?session_id=${sessionId}`)
          .then(res => res.json())
          .then(async (data) => {
            console.log("Session verified:", data);
            if (data.success && data.pakket) {
              if (auth.currentUser) {
                const userRef = doc(db, 'gebruikers', auth.currentUser.uid);
                await setDoc(userRef, {
                  subscriptionStatus: 'active',
                  pakket: data.pakket,
                  permissies: data.permissies || (data.pakket.toLowerCase() === 'autohandelaar' ? 'autohandelaar' : (data.pakket.toLowerCase() === 'slimme koper' ? 'slimme_koper' : 'losse_scan')),
                }, { merge: true }).catch(err => console.error("Client DB set fallback failed:", err));
              }
            }
          })
          .catch(err => console.error("Verify session error:", err));
      }
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  const menuItems = [
    { id: 'dashboard', label: 'Overzicht', icon: LayoutDashboardIcon, path: '/dashboard' },
    { id: 'garage', label: 'Mijn Garage', icon: Heart, path: '/dashboard/garage' },
    { id: 'history', label: 'Geschiedenis', icon: History, path: '/dashboard/history' },
    { id: 'settings', label: 'Instellingen', icon: Settings, path: '/dashboard/settings' },
  ];

  const getButtonClass = (isActive: boolean) => 
    isActive 
      ? "w-full justify-start gap-3 bg-white/10 text-white font-medium hover:bg-white/15 rounded-xl border border-white/5" 
      : "w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl border border-transparent";

  const getMobileButtonClass = (isActive: boolean) => 
    isActive
      ? "shrink-0 gap-2 bg-white/10 border border-white/10 text-white font-medium hover:bg-white/15 h-10 px-4 rounded-xl"
      : "shrink-0 gap-2 text-gray-400 border border-transparent hover:text-white hover:bg-white/5 h-10 px-4 rounded-xl";

  const getIconColor = (isActive: boolean) => 
    isActive ? "text-accent-green drop-shadow-[0_0_8px_rgba(0,200,83,0.5)]" : "text-gray-400";

  return (
    <div className="flex h-screen pt-[88px] relative z-10 w-full bg-black">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border border-accent-green/50 p-8 rounded-2xl max-w-sm text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Betaling Succesvol</h3>
            <p className="text-gray-300 mb-6">Bedankt voor je aankoop! Je hebt nu direct toegang tot je pakket en alle bijbehorende functies.</p>
            <Button onClick={() => setShowSuccess(false)} className="w-full">Sluiten</Button>
          </div>
        </div>
      )}
      {/* Desktop Sidebar */}
      <aside className="w-64 hidden md:flex flex-col border-r border-white/10 p-6 bg-black relative">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary-dark/50 blur-3xl rounded-full pointer-events-none"></div>
        <div className="space-y-2 flex-1 relative z-10">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Button 
                key={item.id}
                variant="ghost" 
                className={getButtonClass(isActive)}
                onClick={() => navigate(item.path)}
              >
                <item.icon className={`w-5 h-5 ${getIconColor(isActive)}`} />
                {item.label}
              </Button>
            );
          })}
        </div>
        
        <div className="p-5 bg-gradient-to-br from-primary-dark/60 to-black/60 rounded-2xl border border-white/5 text-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="font-semibold text-white mb-1 flex items-center gap-2">
              {isPremium ? (subscriptionPlan || 'Pro Abonnement') : 'Gratis Account'}
            </p>
            <p className="text-gray-400 mb-4 text-xs">
              {isPremium ? 'Je hebt premium voordelen.' : 'Upgrade voor meer inzicht.'}
            </p>
            <Button 
              variant={isPremium ? "outline" : "default"} 
              size="sm" 
              className="w-full text-xs h-9 rounded-xl"
              onClick={() => navigate('/prijzen')}
            >
              {isPremium ? 'Beheer plan' : 'Upgrade nu'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-black/40 backdrop-blur-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-dark/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex overflow-x-auto gap-2 px-6 py-4 border-b border-white/5 scrollbar-hide shrink-0 items-center bg-black/50 backdrop-blur-md relative z-20">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Button 
                key={item.id}
                variant="ghost" 
                className={getMobileButtonClass(isActive)}
                onClick={() => navigate(item.path)}
              >
                <item.icon className={`w-4 h-4 ${getIconColor(isActive)}`} />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* Content routing */}
        <div className="flex-1 overflow-hidden flex flex-col relative z-10 w-full h-full max-h-full">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="garage" element={<DashboardGarage />} />
            <Route path="history" element={<DashboardHistory />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
