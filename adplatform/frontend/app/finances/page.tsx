'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, Skeleton, AnimatedButton, BouncingDots } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaPlus, FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import Link from 'next/link';

const F = "'Quicksand', sans-serif";
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: F, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' };

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
                <DollarSign size={17} color="#D4AF37" />
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Finances</h1>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Manage your credits and view transaction history</p>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              <FaPlus size={13} /> Add Credits
            </motion.button>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { label: 'Available Credits', value: `₦${(balance?.credits || 0).toLocaleString()}`, icon: CreditCard, color: '#D4AF37', bg: '#F9F6EA', border: '#E3C762', loading },
              { label: 'Total Ad Spend', value: `₦${(balance?.total_revenue || 0).toLocaleString()}`, icon: TrendingUp, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', loading },
              { label: 'Transactions', value: transactions.length, icon: DollarSign, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', loading },
            ].map(({ label, value, icon: Icon, color, bg, border, loading: l }, i) => (
              <FadeCard key={label} delay={i * 0.07} style={{ ...card, padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${bg}, transparent)`, pointerEvents: 'none' }} />
                <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} color={color} />
                </div>
                {l ? <Skeleton height={26} width={100} style={{ marginBottom: 6 }} /> : <p style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', margin: '0 0 3px', letterSpacing: '-0.5px' }}>{value}</p>}
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontWeight: 500 }}>{label}</p>
              </FadeCard>
            ))}
          </div>

          {/* Credits card */}
          <FadeCard delay={0.2} style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #6D28D9 100%)', borderRadius: 16, padding: '28px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', margin: '0 0 8px' }}>Current Balance</p>
            <p style={{ fontSize: 42, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-1px' }}>₦{(balance?.credits || 0).toLocaleString()}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 24px' }}>Use credits to book ad slots on Studio Arella · Minimum ₦1,000/minute</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', color: '#D4AF37', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: F }}>
                <FaPlus size={12} /> Add Credits
              </button>
              <Link href="/book" style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Book Slot <FaArrowRight size={12} />
              </Link>
            </div>
          </FadeCard>

          {/* Transactions */}
          <FadeCard delay={0.28} style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Transaction History</p>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>{transactions.length} records</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    {['Date', 'Type', 'Source', 'Amount', 'Reference'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 18px', color: '#94A3B8', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} style={{ padding: '14px 18px' }}><Skeleton height={13} width={70} /></td>)}</tr>
                  )) : transactions.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#CBD5E1', fontSize: 13 }}>No transactions yet</td></tr>
                  ) : transactions.map(t => (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ background: '#FAFAFA' }}>
                      <td style={{ padding: '12px 18px', color: '#94A3B8', fontSize: 12, borderBottom: '1px solid #F8FAFC' }}>{new Date(t.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '12px 18px', borderBottom: '1px solid #F8FAFC' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {t.type === 'credit' ? <FaArrowTrendUp size={12} color="#16A34A" /> : <FaArrowTrendDown size={12} color="#EF4444" />}
                          <span style={{ fontSize: 11, fontWeight: 700, color: t.type === 'credit' ? '#15803D' : '#B91C1C', background: t.type === 'credit' ? '#DCFCE7' : '#FEE2E2', padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' }}>{t.type}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px', color: '#64748B', borderBottom: '1px solid #F8FAFC', textTransform: 'capitalize' }}>{t.source}</td>
                      <td style={{ padding: '12px 18px', fontWeight: 800, color: t.type === 'credit' ? '#16A34A' : '#EF4444', borderBottom: '1px solid #F8FAFC' }}>
                        {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#CBD5E1', fontSize: 11, fontFamily: 'monospace', borderBottom: '1px solid #F8FAFC' }}>{t.reference || '—'}</td>
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
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
              <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: 16 }}>
                <motion.div key="modal"
                  initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.22 }}
                  style={{ width: '100%', maxWidth: 420, pointerEvents: 'auto' }}>
                <div style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.14)', fontFamily: F }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px', letterSpacing: '-0.3px' }}>Add Credits</h2>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 22px', lineHeight: 1.6 }}>
                    Credits are used to book ad slots on Studio Arella. Minimum top-up is ₦1,000 (1 minute of airtime).
                  </p>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Amount (₦)</label>
                    <input type="number" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} autoFocus
                      onFocus={e => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div style={{ background: '#F9F6EA', border: '1px solid #E3C762', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                    <p style={{ fontSize: 12, color: '#8F7212', margin: 0, lineHeight: 1.55 }}>
                      You will be redirected to <strong>Monnify</strong> to securely add credits via card or bank transfer.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Cancel</button>
                    <AnimatedButton
                      loading={adding}
                      loadingText="Adding"
                      onClick={handleAdd}
                      style={{ flex: 1, padding: '12px', background: '#D4AF37', color: '#111111', borderRadius: 10, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                    >
                      <FaArrowRight size={12} /> Add Credits
                    </AnimatedButton>
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
