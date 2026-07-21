'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, ChevronUp, Trash2, Clock, Calendar, Edit2, Timer, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/ToastProvider';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import { FaWallet, FaCreditCard, FaLock } from 'react-icons/fa6';
import { AnimatedButton, PageTransition } from '@/components/ui/Animations';
import { theme } from '@/lib/theme';
import EditCartModal from '@/components/ui/EditCartModal';
import CampaignPicker from '@/components/ui/CampaignPicker';
import { CartItem } from '@/store/cartStore';

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
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [initialTab, setInitialTab] = useState<'time' | 'period'>('time');

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const groupedCart = useMemo(() => {
    const groups: Record<string, { creative: any, totalCost: number, items: CartItem[], dates: Set<string> }> = {};
    
    cart.forEach(c => {
      const cId = c.creative?.id || 'unknown';
      if (!groups[cId]) {
        groups[cId] = { creative: c.creative, totalCost: 0, items: [], dates: new Set() };
      }
      groups[cId].items.push(c);
      groups[cId].totalCost += c.priceInfo.cost;
      groups[cId].dates.add(new Date(c.date).toDateString());
    });

    return Object.values(groups);
  }, [cart]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const removeCampaign = (creativeId: string) => {
    const itemsToRemove = cart.filter(c => (c.creative?.id || 'unknown') === creativeId);
    itemsToRemove.forEach(item => removeFromCart(item.id));
  };

  // Modal countdown timer
  useEffect(() => {
    if (!showInvoice || !lockedUntil) {
      setTimeLeft(null);
      return;
    }
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((lockedUntil - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setShowInvoice(false);
        setBookingId(null);
        setLockedUntil(null);
        toast("Payment window expired. Please proceed to checkout again.", "error");
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [showInvoice, lockedUntil, toast]);

  // If cart is modified, invalidate the current reservation
  useEffect(() => {
    setBookingId(null);
    setLockedUntil(null);
  }, [cart, clearCart]); // Actually clearCart is stable, but depending on cart means any change resets it.

  const mins = timeLeft ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft ? timeLeft % 60 : 0;

  const cartTotal = getCartTotal();

  const handleReserve = async () => {
    if (cart.length === 0) return;
    
    // If we already have a valid unexpired reservation, just reopen the invoice modal
    if (bookingId && lockedUntil && Date.now() < lockedUntil) {
      setShowInvoice(true);
      return;
    }

    const selectedCreative = cart[0].creative;
    if (!selectedCreative) return;

    setReserving(true);
    try {
      const slots = cart.map(c => {
         const dateStr = typeof c.date === 'string' ? c.date : `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, '0')}-${String(c.date.getDate()).padStart(2, '0')}`;
         const [year, month, day] = dateStr.split('-');
         const startHour = Math.floor(c.startMin / 60);
         const startMins = c.startMin % 60;
         
         // Construct Date strictly in UTC, treating the intended time as WAT (UTC+1). So we subtract 1 hour.
         const startDt = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), startHour - 1, startMins));
         const endDt = new Date(startDt.getTime() + c.durationSec * 1000);
         return { start: startDt.toISOString(), end: endDt.toISOString(), mins: c.durationSec / 60 };
      });

      const res = await api.post('/bookings/reserve', {
        screen_id: SCREEN_ID,
        ad_id: selectedCreative.id,
        slots: slots,
        campaign_id: campaignId || undefined,
      });
      setBookingId(res.data.booking_id);
      setLockedUntil(new Date(res.data.locked_until).getTime());
      setShowInvoice(true);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to reserve slots', 'error');
    } finally {
      setReserving(false);
    }
  };

  const handlePay = async (method: 'monnify' | 'paystack' | 'wallet') => {
    if (!bookingId) return;
    setPaying(true);
    try {
      if (method === 'monnify') {
        const res = await api.post('/payments/initialize', { booking_id: bookingId });
        window.location.href = res.data.checkout_url || res.data.authorization_url;
      } else if (method === 'paystack') {
        const res = await api.post('/payments/paystack/initialize', { booking_id: bookingId });
        window.location.href = res.data.checkout_url;
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
    <>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
                {groupedCart.map((group) => {
                  const creativeId = group.creative?.id || 'unknown';
                  // Always start closed, regardless of how many campaigns
                  const isExpanded = !!expandedGroups[creativeId];
                  
                  // group by date inside
                  const itemsByDate: Record<string, CartItem[]> = {};
                  group.items.forEach(c => {
                    const dKey = new Date(c.date).toDateString();
                    if (!itemsByDate[dKey]) itemsByDate[dKey] = [];
                    itemsByDate[dKey].push(c);
                  });

                  // Sort dates
                  const sortedDates = Object.keys(itemsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

                  return (
                    <div key={creativeId} style={{ background: theme.color.surface, borderRadius: 16, border: `1px solid ${theme.color.border}`, overflow: 'hidden' }}>
                      {/* Campaign Header */}
                      <div onClick={() => toggleGroup(creativeId)} style={{ padding: "clamp(16px, 4vw, 20px) clamp(16px, 5vw, 24px)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer", background: isExpanded ? theme.color.surface2 : 'transparent', transition: 'all 0.2s' }}>
                        <div style={{ flex: '1 1 min-content' }}>
                           <div style={{ fontWeight: 800, fontSize: "clamp(16px, 4vw, 18px)", fontFamily: theme.font.display, color: theme.color.text1, marginBottom: 4 }}>
                             {group.creative?.title || 'Unknown Ad'}
                           </div>
                           <div style={{ color: theme.color.text3, fontSize: "clamp(12px, 3.5vw, 14px)", fontWeight: 500, display: "flex", gap: 8 }}>
                             <span>{group.dates.size} Day(s)</span>
                             <span>&bull;</span>
                             <span>{group.items.length} Block(s)</span>
                           </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 4vw, 20px)" }}>
                           <span className="mono" style={{ color: theme.color.goldDark, fontWeight: 800, fontSize: "clamp(16px, 4.5vw, 18px)" }}>{naira(group.totalCost)}</span>
                           <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: "50%", padding: 6, display: "flex", color: theme.color.text2 }}>
                             {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                           </div>
                        </div>
                      </div>

                      {/* Expanded Content: Grouped by Date */}
                      {isExpanded && (
                         <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${theme.color.border}` }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 0" }}>
                               <button onClick={(e) => { e.stopPropagation(); removeCampaign(creativeId); }} style={{ display: "flex", alignItems: "center", gap: 6, color: theme.color.error, fontSize: 13, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 8, transition: "background 0.2s" }} className="hover:bg-red-50">
                                 <Trash2 size={14} /> Remove Entire Campaign
                               </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                              {sortedDates.map(dateKey => (
                                <div key={dateKey}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: theme.color.text2, fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    <Calendar size={16} color={theme.color.goldDark} />
                                    {new Date(dateKey).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                                  </div>
                                  
                                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {itemsByDate[dateKey].sort((a, b) => a.startMin - b.startMin).map(c => (
                                      <div key={c.id} style={{ background: theme.color.surface2, borderRadius: 12, padding: "12px 16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, border: `1px solid ${theme.color.border}` }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: theme.color.text1, fontWeight: 600, fontSize: 14 }}>
                                          <Clock size={14} color={theme.color.text3} style={{ marginTop: 2 }} />
                                          <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span>{formatMin(c.startMin)} – {formatMin(c.startMin + Math.max(1, Math.ceil(c.durationSec / 60)))}</span>
                                            <span style={{ color: theme.color.text4, fontWeight: 500, fontSize: 12 }}>({Math.ceil(c.durationSec / 60)} min alloc)</span>
                                          </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                          <span className="mono" style={{ color: theme.color.success, fontWeight: 700, fontSize: 15 }}>{naira(c.priceInfo.cost)}</span>
                                          <div style={{ display: "flex", gap: 8 }}>
                                            <button onClick={() => { setEditingItem(c); setInitialTab('time'); }} style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.color.text2 }} title="Edit">
                                              <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => removeFromCart(c.id)} style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} title="Remove">
                                              <Trash2 size={14} color={theme.color.error} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                         </div>
                      )}
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
                <div style={{ background: theme.color.surface, borderRadius: 16, padding: 20, border: `1px solid ${theme.color.border}` }}>
                  <CampaignPicker value={campaignId} onChange={setCampaignId} />
                </div>
                <AnimatedButton onClick={handleReserve} disabled={reserving} style={{ width: "100%", padding: "18px 0", borderRadius: 12, border: "none", background: theme.color.gold, color: theme.color.charcoal900, fontWeight: 800, fontSize: 18, cursor: reserving ? 'not-allowed' : 'pointer', opacity: reserving ? 0.7 : 1, display: "flex", gap: 10, alignItems: "center", justifyContent: "center", boxShadow: theme.shadow.gold }}>
                  {reserving ? 'Reserving Slots...' : <>Proceed to Checkout</>}
                </AnimatedButton>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </DashboardLayout>

    {/* Premium Invoice Modal */}
    {showInvoice && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(10, 12, 16, 0.85)", backdropFilter: "blur(16px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.3s ease-out" }}>
        <div style={{ background: "linear-gradient(180deg, #1A1D24 0%, #13151A 100%)", borderRadius: 28, width: "100%", maxWidth: 460, padding: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 32px 64px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden", animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          
          {/* Top Golden Accent Line */}
          <div style={{ height: 4, width: "100%", background: "linear-gradient(90deg, #D4AF37, #F1B945, #D4AF37)" }} />

          <button onClick={() => setShowInvoice(false)} style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#A0AEC0", transition: "all 0.2s" }} className="hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
          
          <div style={{ padding: "40px 32px 32px" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.2)", color: "#F1B945", padding: "8px 16px", borderRadius: 30, fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F1B945", boxShadow: "0 0 8px #F1B945" }} />
                Slots Reserved
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", fontFamily: theme.font.display, marginBottom: 8, letterSpacing: "-0.5px" }}>Checkout Invoice</h2>
              <p style={{ color: "#A0AEC0", fontSize: 15, lineHeight: 1.5 }}>Complete your payment now to secure these premium slots permanently.</p>
            </div>

            {timeLeft !== null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "16px 20px", borderRadius: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Timer size={20} color="#EF4444" />
                  <div style={{ color: "#EF4444", fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>Time Remaining</div>
                </div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "#EF4444", textShadow: "0 0 12px rgba(239, 68, 68, 0.4)" }}>
                  {pad(mins)}:{pad(secs)}
                </div>
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: 24, marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, color: "#A0AEC0", fontSize: 15 }}>
                <span style={{ fontWeight: 500 }}>Total Airtime</span>
                <span className="mono" style={{ fontWeight: 700, color: "#E2E8F0" }}>{cart.length} block(s)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, color: "#A0AEC0", fontSize: 15 }}>
                <span style={{ fontWeight: 500 }}>Screen</span>
                <span style={{ fontWeight: 600, color: "#E2E8F0" }}>Bems Junction, Umuahia</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "20px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Due</span>
                <span className="mono" style={{ color: "#F1B945", fontWeight: 800, fontSize: 32, textShadow: "0 0 24px rgba(212, 175, 55, 0.3)" }}>{naira(cartTotal)}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Paystack */}
              <AnimatedButton onClick={() => handlePay('paystack')} disabled={paying} style={{ background: "linear-gradient(135deg, #00C3FF 0%, #0052CC 100%)", color: "#fff", border: "none", padding: "18px", borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: paying ? 'not-allowed' : 'pointer', display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 12px 24px rgba(0,82,204,0.25)", transition: "all 0.2s" }}>
                <FaCreditCard size={20} /> Pay with Paystack
              </AnimatedButton>
              {/* Monnify */}
              <AnimatedButton onClick={() => handlePay('monnify')} disabled={paying} style={{ background: "linear-gradient(135deg, #F1B945 0%, #D4AF37 100%)", color: "#1A1A1A", border: "none", padding: "18px", borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: paying ? 'not-allowed' : 'pointer', display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 12px 24px rgba(212, 175, 55, 0.25)", transition: "all 0.2s" }}>
                <FaCreditCard size={20} /> Pay with Monnify
              </AnimatedButton>
              {/* Wallet */}
              <AnimatedButton onClick={() => handlePay('wallet')} disabled={paying} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFFFFF", padding: "18px", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: "flex", alignItems: "center", justifyContent: "center", gap: 12, transition: "all 0.2s" }} className="hover:bg-white/10">
                <FaWallet size={20} color="#A0AEC0" /> Pay from Wallet
              </AnimatedButton>
            </div>

            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#718096", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <FaLock size={10} /> Secured by Paystack &amp; Monnify
            </div>
          </div>
        </div>
      </div>
    )}

    {editingItem && (
      <EditCartModal 
        item={editingItem} 
        onClose={() => setEditingItem(null)} 
        initialTab={initialTab} 
      />
    )}
  </>
);
}
