'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaPlus, FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card: React.CSSProperties = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg };

export default function FinancesPage() {
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [b, t, r] = await Promise.all([
        api.get('/finances/balance'),
        api.get('/finances/transactions?limit=30'),
        api.get('/finances/revenue'),
      ]);
      setBalance({ ...b.data, total_revenue: r.data.total_revenue });
      setTransactions(t.data.transactions || []);
    } catch {
      setBalance({ credits: 0, sales_pct: 0, referral_pct: 0, total_revenue: 0 });
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    const val = parseFloat(amount);
    if (!val || val < 1000) { toast('Minimum top-up is ₦1,000', 'error'); return; }
    setAdding(true);
    try {
      const { data } = await api.post('/payments/initialize-credits', { amount: val });
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch { toast('Failed to initialize payment', 'error'); }
    finally { setAdding(false); }
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                <DollarSign size={17} color={theme.color.gold} />
                <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>Finances</h1>
              </div>
              <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>Manage your credits and view transaction history</p>
            </div>
            <Button onClick={() => setShowModal(true)} variant="primary">
              <FaPlus size={13} /> Add Credits
            </Button>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
            {[
              { label: 'Available Credits', value: `₦${(balance?.credits || 0).toLocaleString()}`, icon: CreditCard, color: theme.color.gold, bg: theme.color.goldLight, border: theme.color.goldMid, loading },
              { label: 'Total Spending', value: `₦${(balance?.total_revenue || 0).toLocaleString()}`, icon: TrendingUp, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', loading },
              { label: 'Transactions', value: transactions.length, icon: DollarSign, color: theme.color.success, bg: theme.color.successLight, border: '#C7E0BE', loading },
            ].map(({ label, value, icon: Icon, color, bg, border, loading: l }, i) => (
              <FadeCard key={label} delay={i * 0.07} style={{ ...card, padding: 'clamp(16px, 4vw, 20px)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${bg}, transparent)`, pointerEvents: 'none' }} />
                <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} color={color} />
                </div>
                {l ? <Skeleton height={26} width={100} style={{ marginBottom: 6 }} /> : <p style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 900, color: theme.color.text1, margin: '0 0 3px', letterSpacing: '-0.5px', wordBreak: "break-word" }}>{value}</p>}
                <p style={{ fontSize: "clamp(11px, 3vw, 13px)", color: theme.color.text3, margin: 0, fontWeight: 500 }}>{label}</p>
              </FadeCard>
            ))}
          </div>

          {/* Credits card */}
          <FadeCard delay={0.2} style={{ background: `linear-gradient(135deg, ${theme.color.charcoal800} 0%, ${theme.color.charcoal900} 100%)`, borderRadius: 20, padding: '36px 32px', position: 'relative', overflow: 'hidden', boxShadow: theme.shadow.md, border: `1px solid rgba(255,255,255,0.05)` }}>
            {/* Ambient gold glows */}
            <div style={{ position: 'absolute', top: -80, right: -40, width: 250, height: 250, background: `radial-gradient(circle, ${theme.color.goldDark} 0%, transparent 60%)`, opacity: 0.25, borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -50, left: '15%', width: 200, height: 200, background: `radial-gradient(circle, ${theme.color.gold} 0%, transparent 60%)`, opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }} />
            
            <p style={{ position: 'relative', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.color.gold, margin: '0 0 10px' }}>Current Balance</p>
            <p style={{ position: 'relative', fontFamily: theme.font.display, fontSize: 'clamp(36px, 5vw, 48px)', fontWeight: 600, color: '#fff', margin: '0 0 4px', letterSpacing: '-1px' }}>₦{(balance?.credits || 0).toLocaleString()}</p>
            <p style={{ position: 'relative', fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 32px', fontWeight: 500 }}>Use credits to book ad slots on Studio Arella · Minimum ₦1,000/minute</p>
            <div style={{ position: 'relative', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: theme.color.gold, color: theme.color.charcoal900, border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: F, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(224, 165, 38, 0.2)' }}>
                <FaPlus size={12} /> Add Credits
              </button>
              <Link href="/book" style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
                Book Slot <FaArrowRight size={12} />
              </Link>
            </div>
          </FadeCard>

          {/* Transactions */}
          <FadeCard delay={0.28} style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.color.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1, margin: 0 }}>Transaction History</p>
              <span style={{ fontSize: 12, color: theme.color.text3 }}>{transactions.length} records</span>
            </div>
            <div className="responsive-table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: theme.color.surface2 }}>
                    {['Date', 'Type', 'Source', 'Amount', 'Reference'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 18px', color: theme.color.text3, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${theme.color.border2}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} style={{ padding: '14px 18px' }}><Skeleton height={13} width={70} /></td>)}</tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: theme.color.surface2, marginBottom: 16 }}>
                        <DollarSign size={24} color={theme.color.text4} />
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: theme.color.text1, margin: '0 0 4px' }}>No transactions yet</p>
                      <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>When you add credits or book a slot, it will appear here.</p>
                    </td></tr>
                  ) : transactions.map(t => (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ background: theme.color.surface2 }}>
                      <td style={{ padding: '12px 18px', color: theme.color.text3, fontSize: 12, borderBottom: `1px solid ${theme.color.border2}` }}>{new Date(t.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '12px 18px', borderBottom: `1px solid ${theme.color.border2}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {t.type === 'credit' ? <FaArrowTrendUp size={12} color={theme.color.success} /> : <FaArrowTrendDown size={12} color={theme.color.error} />}
                          <span style={{ fontSize: 11, fontWeight: 700, color: t.type === 'credit' ? '#2F6A3B' : '#8F3226', background: t.type === 'credit' ? theme.color.successLight : theme.color.errorLight, padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' }}>{t.type}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px', color: theme.color.text2, borderBottom: `1px solid ${theme.color.border2}`, textTransform: 'capitalize' }}>{t.source}</td>
                      <td style={{ padding: '12px 18px', fontWeight: 800, color: t.type === 'credit' ? theme.color.success : theme.color.error, borderBottom: `1px solid ${theme.color.border2}` }}>
                        {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 18px', color: theme.color.text4, fontSize: 11, fontFamily: 'monospace', borderBottom: `1px solid ${theme.color.border2}` }}>{t.reference || '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeCard>
        </div>

        {/* Add credits modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
              <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: 16 }}>
                <motion.div key="modal"
                  initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.22 }}
                  style={{ width: '100%', maxWidth: 420, pointerEvents: 'auto' }}>
                <div style={{ background: theme.color.surface, borderRadius: theme.radius.xl, padding: 28, boxShadow: theme.shadow.lg, fontFamily: F }}>
                  <h2 style={{ fontFamily: theme.font.display, fontSize: 20, fontWeight: 600, color: theme.color.text1, margin: '0 0 6px', letterSpacing: '-0.2px' }}>Add Credits</h2>
                  <p style={{ fontSize: 13, color: theme.color.text3, margin: '0 0 22px', lineHeight: 1.6 }}>
                    Credits are used to book ad slots on Studio Arella. Minimum top-up is ₦1,000 (1 minute of airtime).
                  </p>
                  <div style={{ marginBottom: 14 }}>
                    <Input label="Amount (₦)" type="number" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
                  </div>
                  <div style={{ background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                    <p style={{ fontSize: 12, color: theme.color.goldDark, margin: 0, lineHeight: 1.55 }}>
                      You will be redirected to <strong>Monnify</strong> to securely add credits via card or bank transfer.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button onClick={() => setShowModal(false)} variant="secondary" style={{ flex: 1 }}>Cancel</Button>
                    <Button loading={adding} loadingText="Adding" onClick={handleAdd} variant="primary" style={{ flex: 1 }}>
                      <FaArrowRight size={12} /> Add Credits
                    </Button>
                  </div>
                </div>
              </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </PageTransition>
    </DashboardLayout>
  );
}
