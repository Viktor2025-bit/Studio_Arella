'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2, Clock, Calendar, Edit2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/ToastProvider';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import { FaWallet, FaCreditCard } from 'react-icons/fa6';
import { AnimatedButton, PageTransition } from '@/components/ui/Animations';
import { theme } from '@/lib/theme';

const SCREEN_ID = '00000000-0000-0000-0000-000000000001';

function naira(n: number) { return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`; }
function pad(n: number) { return String(n).padStart(2, "0"); }
function formatMin(min: number) {
  const totalSeconds = Math.round(min * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const period = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  if (s > 0) return `${hh}:${pad(m)}:${pad(s)} ${period}`;
  return `${hh}:${pad(m)} ${period}`;
}
function formatDurationSec(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m} min` : `${m}m ${s}s`;
}

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { cart, removeFromCart, getCartTotal, clearCart } = useCartStore();
  
  const [reserving, setReserving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const cartTotal = getCartTotal();

  const handleReserve = async () => {
    if (cart.length === 0) return;
    const selectedCreative = cart[0].creative; // Assume same creative for all items in cart based on previous logic
    if (!selectedCreative) return;

    setReserving(true);
    try {
      const slots = cart.map(c => {
         const d = c.date;
         const startDt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(c.startMin / 60), c.startMin % 60);
         const endDt = new Date(startDt.getTime() + c.durationSec * 1000);
         return { start: startDt.toISOString(), end: endDt.toISOString(), mins: c.durationSec / 60 };
      });

      const res = await api.post('/bookings/reserve', {
        screen_id: SCREEN_ID,
        ad_id: selectedCreative.id,
        slots: slots
      });
      setBookingId(res.data.booking_id);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to reserve slots', 'error');
    } finally {
      setReserving(false);
    }
  };

  const handlePay = async (method: 'monnify' | 'wallet') => {
    if (!bookingId) return;
    setPaying(true);
    try {
      if (method === 'monnify') {
        const res = await api.post('/payments/initialize', { booking_id: bookingId });
        window.location.href = res.data.checkout_url || res.data.authorization_url;
      } else {
        const res = await api.post('/payments/wallet', { booking_id: bookingId });
        toast(res.data.message || 'Payment successful!', 'success');
        clearCart();
        router.push('/bookings');
      }
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Payment failed', 'error');
      setPaying(false);
    }
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ maxWidth: 750, margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <button onClick={() => router.push('/book')} style={{ background: theme.color.surface2, border: `1px solid ${theme.color.border}`, color: theme.color.text1, padding: "8px 16px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800, transition: "all 0.2s" }}>
              <ChevronLeft size={16} /> Keep Browsing Slots
            </button>
            <div style={{ fontWeight: 800, fontSize: "clamp(22px, 5vw, 28px)", color: theme.color.text1 }}>Your Cart</div>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", background: theme.color.surface, borderRadius: 16, border: `1px dashed ${theme.color.border2}` }}>
              <p style={{ fontSize: 16, color: theme.color.text3, fontWeight: 500 }}>Your cart is empty.</p>
              <AnimatedButton onClick={() => router.push('/book')} style={{ marginTop: 24, background: theme.color.charcoal900, color: theme.color.surface, border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                Go Schedule Slots
              </AnimatedButton>
            </div>
          ) : (
            <div style={{ background: theme.color.surface, borderRadius: 16, border: `1px solid ${theme.color.border}`, padding: "40px 32px", boxShadow: theme.shadow.sm }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
                {[...cart].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startMin - b.startMin).map((c) => {
                  const d = new Date(c.date);
                  return (
                    <div key={c.id} style={{ background: theme.color.surface2, borderRadius: 14, padding: "clamp(14px, 4vw, 20px) clamp(16px, 4vw, 24px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "clamp(12px, 3vw, 20px)", border: `1px solid ${theme.color.border}`, flexWrap: "wrap" }}>
                      <div className="mono" style={{ color: theme.color.text3, fontSize: "clamp(12px, 3vw, 14px)", flex: 1 }}>
                        <div style={{ color: theme.color.text1, fontWeight: 800, marginBottom: 8, fontSize: "clamp(15px, 4vw, 18px)", fontFamily: theme.font.display }}>
                          {c.creative?.title || 'Unknown Ad'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: theme.color.text2, fontWeight: 600 }}>
                          <Calendar size={14} />
                          {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} />
                          {formatMin(c.startMin)} – {formatMin(c.startMin + Math.max(1, Math.ceil(c.durationSec / 60)))} · {formatDurationSec(c.durationSec)} airtime
                        </div>
                      </div>
                      <div className="w-full md:w-auto flex justify-between md:justify-end items-center" style={{ gap: "clamp(10px, 3vw, 14px)" }}>
                        <span className="mono" style={{ color: theme.color.success, fontWeight: 800, fontSize: "clamp(15px, 4.5vw, 18px)" }}>{naira(c.priceInfo.cost)}</span>
                        <div style={{ display: "flex", gap: "clamp(10px, 3vw, 14px)" }}>
                          <button onClick={() => { removeFromCart(c.id); router.push('/book'); }} style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, cursor: "pointer", padding: "clamp(6px, 2vw, 10px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.color.text2 }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => removeFromCart(c.id)} style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, cursor: "pointer", padding: "clamp(6px, 2vw, 10px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete">
                            <Trash2 size={16} color={theme.color.error} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: theme.color.charcoal900, borderRadius: 16, padding: "clamp(16px, 4vw, 24px) clamp(20px, 5vw, 32px)", marginBottom: 32, color: '#fff', boxShadow: theme.shadow.md }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontWeight: 700, fontSize: "clamp(14px, 3.5vw, 16px)", color: theme.color.text4 }}>Total Airtime</span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: "clamp(14px, 3.5vw, 16px)" }}>{cart.length} block(s)</span>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 20 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: "clamp(16px, 4vw, 20px)" }}>Total Amount</span>
                  <span className="mono" style={{ color: theme.color.gold, fontWeight: 900, fontSize: "clamp(20px, 6vw, 28px)" }}>{naira(cartTotal)}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, flexDirection: "column" }}>
                {bookingId ? (
                   <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                     <div style={{ textAlign: "center", color: theme.color.success, fontWeight: 800, marginBottom: 8, fontSize: 16 }}>Slots reserved successfully! Choose a payment method:</div>
                     <AnimatedButton onClick={() => handlePay('wallet')} disabled={paying} style={{ background: theme.color.charcoal900, color: '#fff', border: 'none', padding: '18px', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                       <FaWallet size={20} /> Pay from Wallet
                     </AnimatedButton>
                     <AnimatedButton onClick={() => handlePay('monnify')} disabled={paying} style={{ background: theme.color.goldLight, color: theme.color.goldDark, border: `2px solid ${theme.color.goldMid}`, padding: '18px', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                       <FaCreditCard size={20} /> Pay with Card / Bank
                     </AnimatedButton>
                   </div>
                ) : (
                  <AnimatedButton onClick={handleReserve} disabled={reserving} style={{ width: "100%", padding: "18px 0", borderRadius: 12, border: "none", background: theme.color.gold, color: theme.color.charcoal900, fontWeight: 800, fontSize: 18, cursor: reserving ? 'not-allowed' : 'pointer', opacity: reserving ? 0.7 : 1, display: "flex", gap: 10, alignItems: "center", justifyContent: "center", boxShadow: theme.shadow.gold }}>
                    {reserving ? 'Reserving Slots...' : <>Proceed to Checkout</>}
                  </AnimatedButton>
                )}
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
