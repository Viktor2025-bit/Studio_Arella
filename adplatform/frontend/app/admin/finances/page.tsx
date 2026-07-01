'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';

const F = "'Quicksand', sans-serif";
const card = { background: '#fff', border: '1px solid 1px solid #E2E8F0', borderRadius: 16, padding: 20 } as React.CSSProperties;

export default function AdminFinancesPage() {
  const [stats, setStats] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/finances/transactions?limit=20')])
      .then(([s, t]) => { setStats(s.data); setTxns(t.data.transactions || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const summaryCards = [
    { label: 'Total Platform Revenue', value: `₦${Number(stats?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: '#D4AF37', bg: 'rgba(212,175,55,0.1)' },
    { label: 'Active Bookings', value: stats?.bookings || 0, icon: CreditCard, color: '#D4AF37', bg: 'rgba(212,175,55,0.12)' },
    { label: 'Registered Screens', value: stats?.screens || 0, icon: TrendingUp, color: '#D4AF37', bg: 'rgba(167,139,250,0.12)' },
  ];

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <DollarSign size={18} color="#22c55e" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Platform Revenue</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Financial overview of the entire Bems Screens ecosystem</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {summaryCards.map(({ label, value, icon: Icon, color, bg }, i) => (
            <FadeCard key={label} delay={i * 0.08} style={{ ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <div>
                  {loading ? <Skeleton width={60} height={20} style={{ marginBottom: 4 }} /> : <p style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.3px' }}>{value}</p>}
                  <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{label}</p>
                </div>
              </div>
            </FadeCard>
          ))}
        </div>

        <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Recent Transactions</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                {['Date', 'Type', 'Source', 'Amount', 'Reference'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: '#94A3B8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #FAFAFA' }}>
                  {Array.from({ length: 5 }).map((_, j) => <td key={j} style={{ padding: '14px 20px' }}><Skeleton height={12} width={80} /></td>)}
                </tr>
              )) : txns.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No transactions yet</td></tr>
              ) : txns.map(t => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderTop: '1px solid #FAFAFA' }} whileHover={{ background: '#FAFAFA' }}>
                  <td style={{ padding: '12px 20px', color: '#64748B', fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.type === 'credit' ? '#22c55e' : '#ef4444', background: t.type === 'credit' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 100 }}>{t.type}</span>
                  </td>
                  <td style={{ padding: '12px 20px', color: '#64748B', textTransform: 'capitalize' }}>{t.source}</td>
                  <td style={{ padding: '12px 20px', fontWeight: 600, color: t.type === 'credit' ? '#22c55e' : '#ef4444' }}>
                    {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 20px', color: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}>{t.reference || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
