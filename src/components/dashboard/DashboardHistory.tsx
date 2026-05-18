import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Play, ExternalLink, Loader2, History, ArrowRight } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { PaywallOverlay } from './PaywallOverlay';

interface HistoryItem {
  id: string;
  rapportId: string;
  date: string;
  time: string;
  title: string;
  score: number;
  status: string;
  statusColor: string;
  price: string;
  url: string;
}

export const DashboardHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState('all');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, isPremium, permissies } = useStore();

  const isFreePlan = !isPremium || permissies === 'free';

  useEffect(() => {
    async function fetchHistory() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch it all, we will truncate UI for free users
        const q = query(
          collection(db, 'analyses'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          let dateObj = new Date();
          if (d.createdAt) {
            try {
              dateObj = typeof d.createdAt.toMillis === 'function' ? new Date(d.createdAt.toMillis()) : new Date(d.createdAt);
            } catch(e) { console.error(e); }
          }
          return {
            id: doc.id,
            rapportId: d.rapportId,
            date: dateObj.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: dateObj.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
            title: d.title || 'Onbekende auto',
            score: d.score || 0,
            status: d.status || 'Onbekende status',
            statusColor: d.statusColor || 'text-gray-400',
            price: d.price || 'Prijs op aanvraag',
            url: d.url || '#',
          };
        });
        setHistoryData(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user, isPremium, permissies]);

  const filteredData = historyData
    .filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(item => {
      if (filterScore === '70+') return item.score >= 70;
      if (filterScore === '50-69') return item.score >= 50 && item.score < 70;
      if (filterScore === '<50') return item.score < 50;
      return true;
    });

  const displayedData = isFreePlan ? filteredData.slice(0, 2) : filteredData;
  const showPaywall = isFreePlan && filteredData.length > 2;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="p-6 md:p-10 pb-6">
        <h2 className="text-3xl font-heading font-bold text-white tracking-tight mb-2">Geschiedenis</h2>
        <p className="text-gray-400 mb-8">Bekijk en beheer al je eerdere rapporten.</p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              type="text" 
              placeholder="Zoek op merk, model of datum..." 
              className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus-visible:ring-accent-green focus-visible:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterScore}
                onChange={(e) => setFilterScore(e.target.value)}
                className="h-12 bg-white/5 border border-white/10 text-gray-300 rounded-xl px-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-accent-green cursor-pointer"
              >
                <option value="all" className="bg-black text-white">Filter: Alles</option>
                <option value="70+" className="bg-black text-white">Score: 70+ (Goede deal)</option>
                <option value="50-69" className="bg-black text-white">Score: 50-69 (Redelijk)</option>
                <option value="<50" className="bg-black text-white">Score: &lt;50 (Slechte deal)</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {(searchTerm || filterScore !== 'all') && (
              <Button 
                variant="ghost" 
                onClick={() => { setSearchTerm(''); setFilterScore('all'); }}
                className="h-12 px-4 rounded-xl text-gray-400 hover:text-white"
              >
                Wis filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 relative">
        <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[300px] relative">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
            </div>
          ) : historyData.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-48 text-gray-400">
              <p>Geen geschiedenis gevonden.</p>
              <Button variant="link" className="text-accent-green mt-2" onClick={() => navigate('/dashboard')}>
                Start een nieuwe analyse
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto min-w-[700px] relative">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 tracking-wider">
                    <th className="py-5 px-6 font-medium">VOERTUIG</th>
                    <th className="py-5 px-6 font-medium w-32">DATUM</th>
                    <th className="py-5 px-6 font-medium w-32">SCORE</th>
                    <th className="py-5 px-6 font-medium w-40">STATUS</th>
                    <th className="py-5 px-6 font-medium text-right w-48">ACTIES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayedData.map((row, i) => (
                    <motion.tr 
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-5 px-6">
                        <div className="font-semibold text-white group-hover:text-accent-green transition-colors">{row.title}</div>
                        <div className="text-gray-500 text-sm mt-1">{row.price}</div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="text-gray-300">{row.date}</div>
                        <div className="text-gray-600 text-xs mt-1">{row.time}</div>
                      </td>
                      <td className="py-5 px-6">
                         <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold border border-white/10 ${row.score >= 70 ? 'bg-primary-dark/40 text-accent-green' : row.score >= 50 ? 'bg-black/40 text-accent-orange' : 'bg-black/40 text-destructive'}`}>
                            {row.score}
                         </div>
                      </td>
                      <td className={`py-5 px-6 text-sm font-medium ${row.statusColor}`}>
                        {row.status}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/analyze?url=${encodeURIComponent(row.url)}`)}
                            title="Heranalyseren"
                            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => navigate(`/rapport/${row.rapportId}`)}
                            className="h-10 gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-primary transition-colors text-sm font-medium border border-white/5"
                          >
                            Rapport <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  
                  {/* Visual indication of more items blurred in background if free */}
                  {showPaywall && (
                    <tr className="border-none">
                      <td colSpan={5} className="py-20 px-6 text-center text-gray-500 italic relative">
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 backdrop-blur-[2px]" />
                         Er zijn meer rapporten in je geschiedenis...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {showPaywall && (
                <PaywallOverlay 
                  title="Bekijk je volledige historie" 
                  description="Upgrade nu om toegang te krijgen tot al je eerder gemaakte analyses en rapporten." 
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
