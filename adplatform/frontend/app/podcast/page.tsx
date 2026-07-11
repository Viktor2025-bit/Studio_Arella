'use client';

import { useState, useEffect, useMemo, Suspense } from "react";
import { ChevronLeft, ChevronRight, Check, Info, AlertTriangle, Mic, Video, Headphones, Radio, Plus, CheckCircle2, Ticket } from "lucide-react";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AnimatedButton, PageTransition } from '@/components/ui/Animations';
import { theme } from '@/lib/theme';
import { FaWallet, FaCreditCard } from "react-icons/fa6";

const PACKAGES = [
  { id: 'audio', title: 'Audio Only', price: 10000, icon: Mic, desc: 'Pro mics, soundproofing & dedicated engineer included' },
  { id: 'video', title: 'Audio + Video', price: 20000, icon: Video, desc: 'Multi-cam, lighting & dedicated engineer included' }
];

const ADDONS = [
  { id: 'social_clips', title: '3x Short-form Clips (TikTok/Reels)', price: 15000, icon: Video },
  { id: 'post_prod', title: 'Full Post-Production & Editing', price: 25000, icon: Headphones },
  { id: 'livestream', title: 'Live Streaming Setup', price: 15000, icon: Radio },
  { id: 'extramic', title: 'Extra Microphone (Beyond 2)', price: 5000, icon: Plus }
];

const START_HOUR = 9;
const END_HOUR = 18; // 6 PM

function naira(n: number) { return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`; }
function pad(n: number) { return String(n).padStart(2, "0"); }
function localDateKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function formatMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m)} ${period}`;
}

export default function PodcastPage() {
  return (
    <Suspense fallback={<div />}>
      <PodcastScheduler />
    </Suspense>
  );
}

function PodcastScheduler() {
  const { toast } = useToast();
  const router = useRouter();
  
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  
  const [calCursor, setCalCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [viewDate, setViewDate] = useState<Date>(today);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]); // array of minutes (e.g. 540 for 9am)
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [paying, setPaying] = useState(false);

  // Fetch live bookings
  useEffect(() => {
    if (currentStep !== 2) return;
    const fetchSlots = () => {
      const s = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1).toISOString();
      const e = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 0).toISOString();
      api.get(`/podcasts/availability?start_date=${s}&end_date=${e}`)
        .then(res => setLiveBookings(res.data.slots || []))
        .catch(console.error);
    };
    fetchSlots();
    const interval = setInterval(fetchSlots, 10000);
    return () => clearInterval(interval);
  }, [calCursor, currentStep]);

  const pkg = PACKAGES.find(p => p.id === selectedPkg);
  const hours = selectedSlots.length; // Each slot is 1 hour
  const baseCost = pkg ? pkg.price * hours : 0;
  const addonsCost = selectedAddons.reduce((sum, id) => sum + (ADDONS.find(a => a.id === id)?.price || 0), 0);
  const totalCost = baseCost + addonsCost;

  function toggleSlot(minOfDay: number) {
    if (selectedSlots.includes(minOfDay)) {
      setSelectedSlots(prev => prev.filter(s => s !== minOfDay));
    } else {
      setSelectedSlots(prev => [...prev, minOfDay].sort((a,b)=>a-b));
    }
  }

  function toggleAddon(id: string) {
    if (selectedAddons.includes(id)) {
      setSelectedAddons(prev => prev.filter(a => a !== id));
    } else {
      setSelectedAddons(prev => [...prev, id]);
    }
  }

  const handleReserve = async () => {
    if (!selectedPkg || selectedSlots.length === 0) return;
    setReserving(true);
    try {
      const startMin = selectedSlots[0];
      const endMin = selectedSlots[selectedSlots.length - 1] + 60; // contiguous assumption
      const d = viewDate;
      const startDt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(startMin / 60), startMin % 60);
      const endDt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(endMin / 60), endMin % 60);

      const res = await api.post('/podcasts/reserve', {
        package_type: pkg?.title,
        start_time: startDt.toISOString(),
        end_time: endDt.toISOString(),
        duration_minutes: hours * 60,
        addons: selectedAddons.map(id => {
          const a = ADDONS.find(x => x.id === id);
          return { name: a?.title, price: a?.price };
        }),
        base_cost: baseCost,
        addons_cost: addonsCost,
        total_cost: totalCost
      });
      setBookingId(res.data.booking_id);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to reserve slot', 'error');
    } finally {
      setReserving(false);
    }
  };

  const handlePay = async (method: 'monnify' | 'paystack' | 'wallet') => {
    if (!bookingId) return;
    setPaying(true);
    try {
      if (method === 'monnify') {
        const res = await api.post('/payments/initialize', { booking_id: bookingId, booking_type: 'podcast' });
        window.location.href = res.data.checkout_url || res.data.authorization_url;
      } else if (method === 'paystack') {
        const res = await api.post('/payments/paystack/initialize', { booking_id: bookingId, booking_type: 'podcast' });
        window.location.href = res.data.checkout_url;
      } else {
        const res = await api.post('/payments/wallet', { booking_id: bookingId, booking_type: 'podcast' });
        toast(res.data.message || 'Payment successful!', 'success');
        router.push('/bookings?tab=podcasts');
      }
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Payment failed', 'error');
      setPaying(false);
    }
  };

  // Month cells
  const monthCells = useMemo(() => {
    const year = calCursor.getFullYear(), month = calCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calCursor]);

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="qs" style={{ minHeight: "100%", color: theme.color.text1 }}>
          <style>{`
            .qs { font-family: var(--font-quicksand), 'Quicksand', sans-serif; }
            .mono { font-family: var(--font-plex), 'IBM Plex Mono', monospace; }
          `}</style>

          <div style={{ background: theme.color.charcoal900, padding: "20px 28px", borderRadius: 16, marginBottom: 24, border: `1px solid ${theme.color.border}`, boxShadow: theme.shadow.md }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ color: theme.color.gold, fontWeight: 800, fontSize: 22, letterSpacing: '-0.3px' }}>Studio Arella Podcasts</div>
                <div className="mono" style={{ color: theme.color.text4, fontSize: 13, marginTop: 4 }}>Professional Podcasting Setup — Lagos</div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {[
                  { step: 1, label: "Package" },
                  { step: 2, label: "Schedule" },
                  { step: 3, label: "Add-ons" },
                  { step: 4, label: "Checkout" }
                ].map((s) => (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 8, opacity: currentStep === s.step ? 1 : 0.5 }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: "50%",
                      background: currentStep === s.step ? theme.color.gold : currentStep > s.step ? theme.color.success : theme.color.surface2,
                      color: currentStep === s.step ? theme.color.charcoal900 : theme.color.text1,
                      fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                      border: currentStep > s.step ? `1px solid ${theme.color.success}` : `1px solid ${theme.color.border}`
                    }}>
                      {currentStep > s.step ? "✓" : s.step}
                    </div>
                    <span style={{ color: currentStep === s.step ? theme.color.gold : theme.color.surface, fontSize: 14, fontWeight: 700, display: "none" }} className="md:inline-block">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="booking-layout">
            
            {/* LEFT CONTENT */}
            <div style={{ background: theme.color.surface, borderRadius: 16, padding: "36px 32px", border: `1px solid ${theme.color.border}`, boxShadow: theme.shadow.sm }}>
              
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(prev => prev - 1)} style={{ background: "none", border: "none", color: theme.color.text3, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}

              {/* STEP 1: PACKAGE */}
              {currentStep === 1 && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8, color: theme.color.text1 }}>Select Your Package</div>
                  <p style={{ color: theme.color.text3, fontSize: 15, marginBottom: 32 }}>Choose the base setup for your podcast recording.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
                    {PACKAGES.map(p => {
                      const isSelected = selectedPkg === p.id;
                      const Icon = p.icon;
                      return (
                        <div key={p.id} onClick={() => setSelectedPkg(p.id)}
                          style={{
                            border: isSelected ? `2px solid ${theme.color.gold}` : `1px solid ${theme.color.border}`,
                            borderRadius: 14, padding: 24, cursor: 'pointer',
                            background: isSelected ? theme.color.goldLight : theme.color.surface,
                            display: 'flex', flexDirection: 'column', gap: 12,
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 4px 12px ${theme.color.goldLight}` : "none"
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Icon size={32} color={isSelected ? theme.color.goldDark : theme.color.text2} />
                            <div style={{ width: 22, height: 22, borderRadius: '50%', border: isSelected ? `6px solid ${theme.color.gold}` : `2px solid ${theme.color.border2}` }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: theme.color.text1, marginBottom: 4 }}>{p.title}</div>
                            <div style={{ fontSize: 14, color: theme.color.text3, marginBottom: 12 }}>{p.desc}</div>
                            <div className="mono" style={{ fontSize: 18, fontWeight: 900, color: isSelected ? theme.color.goldDark : theme.color.text1 }}>
                              {naira(p.price)} <span style={{ fontSize: 12, color: theme.color.text3, fontWeight: 500 }}>/ hr</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 36, paddingTop: 24, borderTop: `1px solid ${theme.color.border}` }}>
                    <AnimatedButton onClick={() => { if (selectedPkg) setCurrentStep(2); }} disabled={!selectedPkg} style={{ background: theme.color.gold, color: theme.color.charcoal900, border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: selectedPkg ? 'pointer' : 'not-allowed', opacity: selectedPkg ? 1 : 0.5, display: "flex", gap: 8, alignItems: "center", boxShadow: theme.shadow.gold }}>
                      Next: Choose Date & Time <ChevronRight size={18} />
                    </AnimatedButton>
                  </div>
                </div>
              )}

              {/* STEP 2: SCHEDULE */}
              {currentStep === 2 && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8, color: theme.color.text1 }}>Select Date & Time</div>
                  <p style={{ color: theme.color.text3, fontSize: 15, marginBottom: 32 }}>We operate from 9:00 AM to 6:00 PM daily. Note: Please select contiguous hours.</p>

                  <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    {/* Calendar */}
                    <div style={{ flex: '1 1 300px', minWidth: 300 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, background: theme.color.surface2, padding: "10px 14px", borderRadius: 12, border: `1px solid ${theme.color.border}` }}>
                        <button onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1))} style={{ background: "none", border: `1px solid ${theme.color.border}`, borderRadius: 10, padding: 6, cursor: "pointer", display: "flex" }}><ChevronLeft size={18} color={theme.color.text2} /></button>
                        <div style={{ fontWeight: 800, fontSize: 16, color: theme.color.text1 }}>
                          {calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </div>
                        <button onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1))} style={{ background: "none", border: `1px solid ${theme.color.border}`, borderRadius: 10, padding: 6, cursor: "pointer", display: "flex" }}><ChevronRight size={18} color={theme.color.text2} /></button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 14 }}>
                        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((w) => <div key={w} className="mono" style={{ fontSize: 13, textAlign: "center", color: theme.color.text3, fontWeight: 700 }}>{w}</div>)}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
                        {monthCells.map((d, i) => {
                          if (!d) return <div key={i} />;
                          const isViewing = d.getTime() === viewDate.getTime();
                          const isPast = d.getTime() < today.getTime();
                          
                          return (
                            <button key={i} onClick={() => { 
                                if (isPast) return;
                                setViewDate(d); 
                                setSelectedSlots([]);
                              }}
                              style={{
                                aspectRatio: "1", borderRadius: 12, border: "1px solid transparent",
                                background: isViewing ? theme.color.gold : theme.color.surface2, color: isViewing ? theme.color.charcoal900 : isPast ? theme.color.text4 : theme.color.text1,
                                fontSize: 16, cursor: isPast ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: isPast ? 0.4 : 1, fontWeight: isViewing ? 800 : 600
                              }}>
                              <span className="mono">{d.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div style={{ flex: '1 1 300px', minWidth: 300 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: theme.color.text1, marginBottom: 16 }}>Available Hours on {viewDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                          const h = START_HOUR + i;
                          const minOfDay = h * 60;
                          
                          // Check if booked
                          const dateKey = localDateKey(viewDate);
                          let isBooked = false;
                          liveBookings.forEach(b => {
                            const bStart = new Date(b.start_time);
                            const bEnd = new Date(b.end_time);
                            if (localDateKey(bStart) === dateKey) {
                               const startM = bStart.getHours() * 60 + bStart.getMinutes();
                               const endM = bEnd.getHours() * 60 + bEnd.getMinutes();
                               if (minOfDay >= startM && minOfDay < endM) isBooked = true;
                            }
                          });

                          const isSelected = selectedSlots.includes(minOfDay);

                          return (
                            <button key={h} disabled={isBooked} onClick={() => toggleSlot(minOfDay)}
                              style={{
                                background: isBooked ? theme.color.errorLight : isSelected ? theme.color.gold : theme.color.surface2,
                                color: isBooked ? theme.color.error : isSelected ? theme.color.charcoal900 : theme.color.text1,
                                border: `1px solid ${isSelected ? theme.color.goldMid : theme.color.border}`,
                                borderRadius: 10, padding: "14px 10px", fontSize: 14, fontWeight: isSelected ? 800 : 600, cursor: isBooked ? 'not-allowed' : 'pointer',
                                opacity: isBooked ? 0.6 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center'
                              }}>
                              {formatMin(minOfDay)} - {formatMin(minOfDay + 60)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 36, paddingTop: 24, borderTop: `1px solid ${theme.color.border}` }}>
                    <AnimatedButton onClick={() => { if (hours > 0) setCurrentStep(3); }} disabled={hours === 0} style={{ background: theme.color.gold, color: theme.color.charcoal900, border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: hours > 0 ? 'pointer' : 'not-allowed', opacity: hours > 0 ? 1 : 0.5, display: "flex", gap: 8, alignItems: "center", boxShadow: theme.shadow.gold }}>
                      Next: Add-ons <ChevronRight size={18} />
                    </AnimatedButton>
                  </div>
                </div>
              )}

              {/* STEP 3: ADDONS */}
              {currentStep === 3 && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8, color: theme.color.text1 }}>Enhance Your Session (Optional)</div>
                  <p style={{ color: theme.color.text3, fontSize: 15, marginBottom: 32 }}>Select any extra services you need for your recording.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {ADDONS.map(a => {
                      const isSelected = selectedAddons.includes(a.id);
                      const Icon = a.icon;
                      return (
                        <div key={a.id} onClick={() => toggleAddon(a.id)}
                          style={{
                            border: isSelected ? `2px solid ${theme.color.gold}` : `1px solid ${theme.color.border}`,
                            borderRadius: 14, padding: 20, cursor: 'pointer',
                            background: isSelected ? theme.color.goldLight : theme.color.surface,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: 'all 0.2s',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: isSelected ? theme.color.goldMid : theme.color.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={20} color={isSelected ? theme.color.charcoal900 : theme.color.text2} />
                            </div>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: theme.color.text1 }}>{a.title}</div>
                              <div className="mono" style={{ fontSize: 14, color: theme.color.text3 }}>{naira(a.price)} / session</div>
                            </div>
                          </div>
                          {isSelected ? <CheckCircle2 color={theme.color.goldDark} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${theme.color.border2}` }} />}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 36, paddingTop: 24, borderTop: `1px solid ${theme.color.border}` }}>
                    <AnimatedButton onClick={() => setCurrentStep(4)} style={{ background: theme.color.gold, color: theme.color.charcoal900, border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: "flex", gap: 8, alignItems: "center", boxShadow: theme.shadow.gold }}>
                      Review & Checkout <ChevronRight size={18} />
                    </AnimatedButton>
                  </div>
                </div>
              )}

              {/* STEP 4: CHECKOUT */}
              {currentStep === 4 && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8, color: theme.color.text1 }}>Checkout</div>
                  <p style={{ color: theme.color.text3, fontSize: 15, marginBottom: 32 }}>Review your booking details and complete payment.</p>

                  <div style={{ background: theme.color.surface2, borderRadius: 14, padding: 24, marginBottom: 32, border: `1px solid ${theme.color.border}` }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                       <span style={{ color: theme.color.text3, fontWeight: 600 }}>Date</span>
                       <span className="mono" style={{ color: theme.color.text1, fontWeight: 800 }}>{viewDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                       <span style={{ color: theme.color.text3, fontWeight: 600 }}>Time</span>
                       <span className="mono" style={{ color: theme.color.text1, fontWeight: 800 }}>{formatMin(selectedSlots[0])} - {formatMin(selectedSlots[selectedSlots.length-1] + 60)} ({hours} hr{hours>1?'s':''})</span>
                     </div>
                  </div>

                  <div style={{ display: "flex", gap: 20, flexDirection: "column" }}>
                    {bookingId ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                         <div style={{ textAlign: 'center', color: theme.color.success, fontWeight: 800, marginBottom: 4, fontSize: 16 }}>Slots reserved successfully!</div>
                         <div style={{ textAlign: 'center', color: theme.color.error, fontWeight: 700, fontSize: 13, background: theme.color.errorLight, padding: 8, borderRadius: 8 }}>
                           <AlertTriangle size={14} style={{ display: 'inline', marginBottom: 2 }} /> This reservation expires in 5 minutes. Pay immediately!
                         </div>
                         {/* Paystack - recommended */}
                         <AnimatedButton onClick={() => handlePay('paystack')} disabled={paying} style={{ background: 'linear-gradient(135deg, #00C3FF 0%, #0052CC 100%)', color: '#fff', border: 'none', padding: '18px', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                           <FaCreditCard size={20} /> Pay with Paystack
                         </AnimatedButton>
                         {/* Monnify */}
                         <AnimatedButton onClick={() => handlePay('monnify')} disabled={paying} style={{ background: theme.color.goldLight, color: theme.color.goldDark, border: `2px solid ${theme.color.goldMid}`, padding: '18px', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                           <FaCreditCard size={20} /> Pay with Monnify
                         </AnimatedButton>
                         {/* Wallet */}
                         <AnimatedButton onClick={() => handlePay('wallet')} disabled={paying} style={{ background: theme.color.charcoal900, color: '#fff', border: 'none', padding: '18px', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                           <FaWallet size={20} /> Pay from Wallet
                         </AnimatedButton>
                         <button onClick={() => router.push('/bookings')} style={{ background: 'transparent', color: theme.color.text3, border: 'none', padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                           Pay Later (Go to My Bookings)
                         </button>
                       </div></div>
                    ) : (
                      <AnimatedButton onClick={handleReserve} disabled={reserving} style={{ width: "100%", padding: "18px 0", borderRadius: 12, border: "none", background: theme.color.gold, color: theme.color.charcoal900, fontWeight: 800, fontSize: 18, cursor: reserving ? 'not-allowed' : 'pointer', opacity: reserving ? 0.7 : 1, display: "flex", gap: 10, alignItems: "center", justifyContent: "center", boxShadow: theme.shadow.gold }}>
                        {reserving ? 'Reserving Slots...' : <>Reserve & Proceed to Payment</>}
                      </AnimatedButton>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* RIGHT CONTENT: Cart Summary */}
            <div style={{ background: theme.color.surface, borderRadius: 16, border: `1px solid ${theme.color.border}`, padding: 24, position: "sticky", top: 24, boxShadow: theme.shadow.sm }}>
               <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20, color: theme.color.text1 }}>Booking Summary</div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.color.text2, fontSize: 14 }}>
                   <span>{pkg?.title || 'Package'} {hours > 0 && `(${hours} hr${hours>1?'s':''})`}</span>
                   <span className="mono" style={{ fontWeight: 600 }}>{naira(baseCost)}</span>
                 </div>
                 {selectedAddons.map(id => {
                   const a = ADDONS.find(x => x.id === id);
                   return (
                     <div key={id} style={{ display: 'flex', justifyContent: 'space-between', color: theme.color.text2, fontSize: 14 }}>
                       <span>+ {a?.title}</span>
                       <span className="mono" style={{ fontWeight: 600 }}>{naira(a?.price || 0)}</span>
                     </div>
                   );
                 })}
               </div>

               <div style={{ borderTop: `1px dashed ${theme.color.border}`, paddingTop: 20, marginBottom: 24 }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style={{ fontSize: 15, color: theme.color.text2, fontWeight: 700 }}>Total Due</span>
                   <span className="mono" style={{ fontSize: 24, fontWeight: 900, color: theme.color.gold }}>{naira(totalCost)}</span>
                 </div>
               </div>

               {currentStep < 4 && (
                 <div style={{ fontSize: 13, color: theme.color.text3, textAlign: 'center', background: theme.color.surface2, padding: 12, borderRadius: 8 }}>
                   Complete all steps to proceed to payment.
                 </div>
               )}
            </div>

          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
