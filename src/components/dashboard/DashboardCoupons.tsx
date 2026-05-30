import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, Plus, Trash2, Edit2, CheckCircle2, XCircle, 
  TrendingUp, Percent, DollarSign, Calendar, Clock, 
  Search, Loader2, RefreshCw, Power, PowerOff, ShieldAlert,
  Tag, BarChart3, Receipt
} from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { useStore } from '@/src/store/useStore';
import { 
  collection, doc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';

interface CouponCode {
  id: string;
  code: string;
  kortingPercentage: number;
  actief: boolean;
  aanmaakdatum?: any;
  createdAt?: any;
  laatstGebruikt?: any;
  aantalGebruikt: number;
  aantalVerkopen: number;
  totaleOmzet: number;
  totaleKorting: number;
}

interface CouponUsage {
  id: string;
  code: string;
  buyerEmail: string;
  pakket: string;
  amountPaid: number;
  discountPercent: number;
  discountAmount: number;
  createdAt?: any;
}

export const DashboardCoupons: React.FC = () => {
  const { user } = useStore();
  const isAdmin = user?.email?.toLowerCase() === 'admin@occasionscan.nl';

  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Custom modal for silent deletion confirmation inside standard DOM (essential inside sandboxed frames!)
  const [deletingCoupon, setDeletingCoupon] = useState<CouponCode | null>(null);

  // Form states for creating/editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formPercentage, setFormPercentage] = useState<number>(15);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local form notification notices (so we can avoid alert popup)
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Real-time Subscription to Coupons & Usages
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to kortingscodes
    const qCoupons = query(collection(db, 'kortingscodes'), orderBy('createdAt', 'desc'));
    const unsubCoupons = onSnapshot(qCoupons, (snapshot) => {
      const list: CouponCode[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          code: data.code || doc.id,
          kortingPercentage: data.kortingPercentage || data.discountPercent || 10,
          actief: data.actief !== false,
          aanmaakdatum: data.aanmaakdatum || data.createdAt || null,
          createdAt: data.createdAt || null,
          laatstGebruikt: data.laatstGebruikt || null,
          aantalGebruikt: data.aantalGebruikt || data.aantalVerkopen || 0,
          aantalVerkopen: data.aantalVerkopen || 0,
          totaleOmzet: data.totaleOmzet || 0,
          totaleKorting: data.totaleKorting || 0,
        });
      });
      setCoupons(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading coupons error:", error);
      setErrorNotice("Geen machtiging of fout bij het ophalen van kortingscodes.");
      setLoading(false);
    });

    // Subscribe to couponusages
    const qUsages = query(collection(db, 'coupon_usages'), orderBy('createdAt', 'desc'));
    const unsubUsages = onSnapshot(qUsages, (snapshot) => {
      const list: CouponUsage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          code: data.code || '',
          buyerEmail: data.buyerEmail || 'onbekend',
          pakket: data.pakket || 'Onbekend',
          amountPaid: data.amountPaid || 0,
          discountPercent: data.discountPercent || 0,
          discountAmount: data.discountAmount || 0,
          createdAt: data.createdAt || null,
        });
      });
      setUsages(list);
    }, (error) => {
      console.error("Firestore loading usages error:", error);
    });

    return () => {
      unsubCoupons();
      unsubUsages();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Toegang Geweigerd</h2>
        <p className="text-gray-400 max-w-md text-sm">
          Dit dashboard is exclusief gereserveerd voor het beheerderaccount van <span className="text-white font-medium">OccasionScan.nl</span>.
        </p>
      </div>
    );
  }

  // Save/Create coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const cleanCode = formCode.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

    if (!cleanCode || cleanCode.length < 3) {
      setFormError("Voer een geldige code in (minimaal 3 tekens)");
      return;
    }

    if (formPercentage < 1 || formPercentage > 100) {
      setFormError("Kortingspercentage moet tussen 1 en 100 liggen");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editingId) {
        // Update existing
        const couponRef = doc(db, 'kortingscodes', editingId);
        await updateDoc(couponRef, {
          kortingPercentage: Number(formPercentage),
          actief: formActive
        });
        setFormSuccess(`Kortingscode ${cleanCode} succesvol bijgewerkt.`);
      } else {
        // Double check uniqueness
        const codeExist = coupons.some(c => c.code === cleanCode);
        if (codeExist) {
          setFormError(`De kortingscode ${cleanCode} bestaat al.`);
          setSaving(false);
          return;
        }

        // Create new
        const couponRef = doc(db, 'kortingscodes', cleanCode);
        await setDoc(couponRef, {
          code: cleanCode,
          kortingPercentage: Number(formPercentage),
          actief: formActive,
          createdAt: serverTimestamp(),
          aantalGebruikt: 0,
          aantalVerkopen: 0,
          totaleOmzet: 0,
          totaleKorting: 0,
          laatstGebruikt: null
        });
        setFormSuccess(`Kortingscode ${cleanCode} is succesvol aangemaakt.`);
      }

      // Reset form
      const cachedSuccess = `Kortingscode ${cleanCode} is succesvol opgeslagen!`;
      resetForm();
      setFormSuccess(cachedSuccess);
      setTimeout(() => setFormSuccess(null), 5000);
    } catch (err) {
      console.error("Fout bij opslaan coupon:", err);
      setFormError("Kon de kortingscode niet opslaan. Probeer het opnieuw.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormCode('');
    setFormPercentage(15);
    setFormActive(true);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleEditClick = (c: CouponCode) => {
    setFormError(null);
    setFormSuccess(null);
    setIsEditing(true);
    setEditingId(c.id);
    setFormCode(c.code);
    setFormPercentage(c.kortingPercentage);
    setFormActive(c.actief);
  };

  const handleDeleteClick = (id: string, code: string) => {
    const found = coupons.find(c => c.id === id);
    if (found) {
      setDeletingCoupon(found);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCoupon) return;
    try {
      await deleteDoc(doc(db, 'kortingscodes', deletingCoupon.id));
      setSuccessNotice(`Kortingscode "${deletingCoupon.code}" is permanent verwijderd.`);
      setTimeout(() => setSuccessNotice(null), 4000);
      setDeletingCoupon(null);
    } catch (err) {
      console.error("Fout bij verwijderen:", err);
      setErrorNotice("Kon de kortingscode niet verwijderen.");
      setTimeout(() => setErrorNotice(null), 4000);
      setDeletingCoupon(null);
    }
  };

  const toggleActiveStatus = async (c: CouponCode) => {
    try {
      await updateDoc(doc(db, 'kortingscodes', c.id), {
        actief: !c.actief
      });
    } catch (err) {
      console.error("Fout bij wijzigen status:", err);
    }
  };

  // Aggregates for widgets
  const aggTotalRevenue = coupons.reduce((sum, c) => sum + c.totaleOmzet, 0);
  const aggTotalDiscount = coupons.reduce((sum, c) => sum + c.totaleKorting, 0);
  const aggTotalUses = coupons.reduce((sum, c) => sum + c.aantalGebruikt, 0);

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'Nooit';
    try {
      const d = typeof ts.toMillis === 'function' ? new Date(ts.toMillis()) : new Date(ts);
      return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Onbekend';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-black w-full text-white pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 text-accent-green mb-1 text-sm font-semibold tracking-wide uppercase">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              Beheerderspaneel
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight">Kortingscodes & Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Beheer exclusieve kortingsacties, activeer of deactiveer coupons en analyseer campagneresultaten.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-ping"></span>
            <span className="text-gray-400">Ingelogd als:</span>
            <span className="text-accent-green font-bold text-xs">{user?.email}</span>
          </div>
        </div>

        {errorNotice && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/25 text-accent-green text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-green/10 text-accent-green border border-accent-green/20 flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Actieve Codes</div>
              <div className="text-2xl font-bold font-heading text-white mt-0.5">
                {coupons.filter(c => c.actief).length} <span className="text-xs text-gray-500 font-normal">/ {coupons.length} totaal</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Totaal Gebruikt</div>
              <div className="text-2xl font-bold font-heading text-white mt-0.5">{aggTotalUses}x</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Gegenereerde Omzet</div>
              <div className="text-2xl font-bold font-heading text-accent-green mt-0.5">{formatEuro(aggTotalRevenue)}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Totale Korting</div>
              <div className="text-2xl font-bold font-heading text-purple-400 mt-0.5">{formatEuro(aggTotalDiscount)}</div>
            </div>
          </div>
        </div>

        {/* Manager Layout: Form (Left/Top) & Coupon List (Right/Bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coupon Form Creator / Editor */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 backdrop-blur-3xl space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent-green/10 text-accent-green flex items-center justify-center border border-accent-green/15">
                <Tag className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold font-heading text-white">
                {isEditing ? 'Code Bewerken' : 'Nieuwe Kortingscode'}
              </h2>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-accent-green/10 border border-accent-green/25 text-accent-green text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">Unieke Kortingscode</label>
                <div className="relative">
                  <Input 
                    type="text"
                    disabled={isEditing}
                    placeholder="E.G. ZOMER15"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="h-10 text-xs font-bold tracking-widest bg-black/40 border-white/10 uppercase placeholder:text-gray-600 focus-visible:ring-accent-green text-white"
                  />
                  {!isEditing && <Gift className="absolute right-3.5 top-3 w-4 h-4 text-gray-500" />}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Alleen hoofdletters en cijfers. Dit is de exacte code die klanten invoeren.</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">Korting Percentage (%)</label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number"
                    min="1"
                    max="100"
                    placeholder="15"
                    value={formPercentage || ''}
                    onChange={(e) => setFormPercentage(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                    className="h-10 text-xs font-bold bg-black/40 border-white/10 focus-visible:ring-accent-green text-white w-24 shrink-0"
                  />
                  <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-400/80">
                    Klanten ontvangen <span className="text-accent-green font-bold text-sm mx-0.5">{formPercentage || 0}%</span> korting bij het afrekenen.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Status</span>
                  <span className="text-[10px] text-gray-500">Klanten kunnen deze code gebruiken</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${formActive ? 'bg-accent-green' : 'bg-gray-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${formActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-accent-green hover:bg-emerald-600 text-black font-bold text-xs h-10 rounded-xl"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : (isEditing ? 'Wijzigingen Opslaan' : 'Code Activeren')}
                </Button>
                {isEditing && (
                  <Button 
                    type="button" 
                    onClick={resetForm}
                    className="bg-white/10 hover:bg-white/15 text-white font-semibold text-xs h-10 rounded-xl px-4"
                  >
                    Annuleren
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Coupon database lists */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Filter bar */}
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
              <Search className="w-4 h-4 text-gray-500 ml-1 shrink-0" />
              <input 
                type="text"
                placeholder="Zoeken op kortingscode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-0 text-xs w-full text-white placeholder:text-gray-500 focus:outline-none focus:ring-0"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-xs text-gray-500 hover:text-white mr-1">
                  Wissen
                </button>
              )}
            </div>

            {/* Coupons Table */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-3xl">
              <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent-green" />
                  Kortingscodes Overzicht ({filteredCoupons.length})
                </h3>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-green mb-2" />
                  <span className="text-xs">Gegevens laden...</span>
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs text-light">
                  {searchTerm ? 'Geen kortingscodes gevonden voor deze zoekopdracht.' : 'Nieuwe kortingscodes verschijnen hier zodra ze worden aangemaakt.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400 font-bold bg-white/[0.01]">
                        <th className="p-4">CODE</th>
                        <th className="p-4">KORTING %</th>
                        <th className="p-4">STATUS</th>
                        <th className="p-4 text-center">GEBRUIKT / VERKOPEN</th>
                        <th className="p-4">OMZET / KORTING</th>
                        <th className="p-4">LAATST GEBRUIKT</th>
                        <th className="p-4 text-right">ACTIES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredCoupons.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4">
                            <span className="font-mono font-bold text-white bg-white/5 border border-white/15 px-2 py-1 rounded tracking-widest text-[11px]">
                              {c.code}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-accent-green font-heading text-sm">
                            {c.kortingPercentage}%
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => toggleActiveStatus(c)}
                              title={c.actief ? "Code deactiveren" : "Code activeren"}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${c.actief ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${c.actief ? 'bg-accent-green' : 'bg-red-400'}`}></span>
                              {c.actief ? 'ACTIEF' : 'INACTIEF'}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <div className="font-semibold text-white">{c.aantalGebruikt}x</div>
                            <div className="text-[10px] text-gray-500">verkopen</div>
                          </td>
                          <td className="p-4 space-y-0.5">
                            <div className="font-bold text-emerald-400">{formatEuro(c.totaleOmzet)}</div>
                            <div className="text-[10px] text-purple-400">-{formatEuro(c.totaleKorting)} korting</div>
                          </td>
                          <td className="p-4 text-gray-400 text-[10px]">
                            {formatDate(c.laatstGebruikt)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex gap-1.5">
                              <button 
                                onClick={() => handleEditClick(c)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                                title="Bewerken"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(c.id, c.code)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-colors"
                                title="Verwijderen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Real-time usage logs */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-3xl">
              <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-400" />
                  Recente Coupon Transacties ({usages.length})
                </h3>
              </div>

              {usages.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  Er zijn nog geen betalingen gedaan met couponcodes.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400 font-bold bg-white/[0.01]">
                        <th className="p-3">CODE</th>
                        <th className="p-3">EMAIL KOPER</th>
                        <th className="p-3">PAKKET</th>
                        <th className="p-3">BETAALD (OMZET)</th>
                        <th className="p-3">KORTING VERSTREKT</th>
                        <th className="p-3">DATUM & TIJD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usages.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.005] transition-colors">
                          <td className="p-3">
                            <span className="font-mono font-bold text-gray-300 bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                              {u.code}
                            </span>
                          </td>
                          <td className="p-3 text-white truncate max-w-[150px]" title={u.buyerEmail}>
                            {u.buyerEmail}
                          </td>
                          <td className="p-3 text-gray-400 text-[11px]">
                            {u.pakket}
                          </td>
                          <td className="p-3 font-semibold text-emerald-400">
                            {formatEuro(u.amountPaid)}
                          </td>
                          <td className="p-3 text-purple-300 font-semibold">
                            -{formatEuro(u.discountAmount)} <span className="text-[10px] text-gray-500 font-normal">({u.discountPercent}%)</span>
                          </td>
                          <td className="p-3 text-gray-500 text-[10px]">
                            {formatDate(u.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Sleek Deletion Confirm Modal (Standard DOM-based to avoid sandbox-iframe restrictions on confirm) */}
      <AnimatePresence>
        {deletingCoupon && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 text-red-500 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-heading text-white">Coupon verwijderen?</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Weet je zeker dat je de kortingscode <span className="text-white font-mono font-bold bg-white/5 border border-white/10 px-1.5 py-0.5 rounded ml-0.5 tracking-wider">{deletingCoupon.code}</span> permanent wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setDeletingCoupon(null)}
                  className="bg-white/5 hover:bg-white/10 text-white font-semibold text-xs h-9 rounded-xl px-4 border border-white/5 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold text-xs h-9 rounded-xl px-4 transition-colors"
                >
                  Permanent Verwijderen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
