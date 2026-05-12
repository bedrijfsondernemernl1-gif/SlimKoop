import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, CreditCard, Shield, Moon, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useStore } from '@/src/store/useStore';

export const DashboardSettings: React.FC = () => {
  const { isPremium } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profiel', icon: User },
    { id: 'subscription', label: 'Abonnement', icon: CreditCard },
    { id: 'notifications', label: 'Notificaties', icon: Bell },
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
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-primary-dark/40 border-2 border-accent-green flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_15px_rgba(0,200,83,0.2)]">
                  JD
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="h-10 px-4 rounded-xl border-white/10 text-white bg-white/5 hover:bg-white/10">Nieuwe foto uploaden</Button>
                  <Button variant="ghost" className="h-10 px-4 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 block mb-0">Verwijder foto</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Voornaam</label>
                  <Input defaultValue="Jan" className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-accent-green" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Achternaam</label>
                  <Input defaultValue="Directeur" className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-accent-green" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-400">Email adres</label>
                  <Input defaultValue="jan.directeur@voorbeeld.nl" type="email" className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-accent-green" />
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
                    <h4 className="text-2xl font-bold text-white mb-1">{isPremium ? 'SlimKoop Unlimited' : 'Gratis Account'}</h4>
                    <p className="text-gray-400">{isPremium ? 'Je account verloopt op 11 Mei 2027.' : 'Beperkte toegang. Upgrade voor volledige inzichten.'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-heading font-bold text-white">{isPremium ? '€19' : '€0'}</div>
                    <div className="text-gray-500 text-sm">per maand</div>
                  </div>
                </div>
                
                <div className="flex gap-3 relative z-10">
                  <Button 
                    className="bg-white text-black hover:bg-gray-200 font-semibold rounded-xl flex-1"
                    onClick={() => !isPremium && navigate('/prijzen')}
                  >
                    {isPremium ? 'Details bekijken' : 'Upgrade nu'}
                  </Button>
                  {isPremium && (
                    <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white bg-white/5 rounded-xl flex-1">
                      Facturen
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <h4 className="text-lg font-semibold text-white mb-4">Betaalmethode</h4>
                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-white rounded-md flex items-center justify-center">
                       <span className="text-blue-900 font-bold text-xs italic">VISA</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">•••• •••• •••• 4242</p>
                      <p className="text-xs text-gray-500">Verloopt 12/28</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-accent-green hover:text-accent-green/80 hover:bg-accent-green/10">Aanpassen</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 relative z-10">
              <h3 className="text-xl font-bold text-white mb-6">Notificatie Voorkeuren</h3>
              
              <div className="space-y-6">
                {[
                  { title: "Prijsdalingen", desc: "Mail mij zodra een auto in mijn garage in prijs daalt." },
                  { title: "Nieuwe Rapportages", desc: "Bevestiging en samenvatting zodra een AI rapport klaar is." },
                  { title: "Systeem Updates", desc: "Blijf op de hoogte van nieuwe functies en verbeteringen." },
                  { title: "Marketing & Aanbiedingen", desc: "Occassionele mails met kortingscodes en unieke data-inzichten." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between pb-6 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="pr-8">
                      <h4 className="text-white font-medium mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-green"></div>
                    </label>
                  </div>
                ))}
              </div>
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
                <Button variant="outline" className="border-white/10 text-white bg-white/5 hover:bg-white/10 rounded-xl h-11 px-6">
                  Wachtwoord Wijzigen
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-red-500">Gevarenzone</h4>
                <p className="text-sm text-gray-400 mb-4">Verwijder je account en alle bijbehorende autogegevens permanent. Dit proces is onomkeerbaar.</p>
                <Button variant="ghost" className="text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 rounded-xl h-11 px-6 gap-2 border border-red-500/20">
                  <Trash2 className="w-4 h-4" />
                  Account Volledig Verwijderen
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
