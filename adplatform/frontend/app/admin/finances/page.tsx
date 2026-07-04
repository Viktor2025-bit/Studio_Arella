'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, padding: 20 } as React.CSSProperties;

export default function AdminFinancesPage() {
  const [stats, setStats] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/transactions?limit=20')])
      .then(([s, t]) => { setStats(s.data); setTxns(t.data.transactions || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const summaryCards = [
    { label: 'Total Platform Revenue', value: `₦${Number(stats?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: theme.color.success, bg: theme.color.successLight },
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: theme.color.gold, bg: theme.color.goldLight },
    { label: 'Active Bookings', value: stats?.bookings || 0, icon: CreditCard, color: theme.color.gold, bg: theme.color.goldLight },
    { label: 'Registered Screens', value: stats?.screens || 0, icon: TrendingUp, color: theme.color.gold, bg: '#F5F3FF' },
  ];

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <DollarSign size={18} color={theme.color.success} />
            <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>Platform Revenue</h1>
          </div>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>Financial overview of the entire Bems Screens ecosystem</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {summaryCards.map(({ label, value, icon: Icon, color, bg }, i) => (
            <FadeCard key={label} delay={i * 0.08} style={{ ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <div>
                  {loading ? <Skeleton width={60} height={20} style={{ marginBottom: 4 }} /> : <p style={{ fontSize: 20, fontWeight: 800, color: theme.color.text1, margin: 0, letterSpacing: '-0.3px' }}>{value}</p>}
                  <p style={{ fontSize: 11, color: theme.color.text3, margin: '2px 0 0' }}>{label}</p>
                </div>
              </div>
            </FadeCard>
          ))}
        </div>

        <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.color.border2}` }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: theme.color.text1, margin: 0 }}>Recent Transactions</p>
          </div>
          <Table>
            <TableHead>
              {['Date', 'Type', 'Source', 'Amount', 'Reference'].map(h => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableHead>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => <td key={j} style={{ padding: '14px 20px' }}><Skeleton height={12} width={80} /></td>)}
                </tr>
              )) : txns.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: theme.color.text3 }}>No transactions yet</td></tr>
              ) : txns.map(t => (
                <TableRow key={t.id}>
                  <TableCell><span style={{ fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</span></TableCell>
                  <TableCell>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.type === 'credit' ? theme.color.success : theme.color.error, background: t.type === 'credit' ? theme.color.successLight : theme.color.errorLight, padding: '2px 8px', borderRadius: 100 }}>{t.type}</span>
                  </TableCell>
                  <TableCell><span style={{ textTransform: 'capitalize' }}>{t.source}</span></TableCell>
                  <TableCell>
                    <span style={{ fontWeight: 700, color: t.type === 'credit' ? theme.color.success : theme.color.error }}>
                      {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell><span style={{ fontSize: 11, fontFamily: 'monospace', color: theme.color.text3 }}>{t.reference || '—'}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageTransition>
  );
}
