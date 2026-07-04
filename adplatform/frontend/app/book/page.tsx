'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Clock, Info, X, Check, Ticket, AlertTriangle, Trash2, Repeat as RepeatIcon } from "lucide-react";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { FaImage, FaFilm, FaWallet, FaCreditCard } from 'react-icons/fa6';
import { AnimatedButton, PageTransition } from '@/components/ui/Animations';

// ---------- Brand tokens (Studio Arella) ----------
const C = {
  gold: "#E8A020",
  darkGold: "#C47D0E",
  black: "#0A0A0A",
  cream: "#F7F4EF",
  hazard: "#D32F2F", // Booked/Unavailable (Red)
  hazardDark: "#B71C1C",
  pending: "#FFCA28", // Partially Booked (Yellow)
  muted: "rgba(10,10,10,0.55)",
  mutedOnDark: "rgba(247,244,239,0.6)",
  line: "rgba(10,10,10,0.10)",
  panel: "#FFFFFF",
  green: "#388E3C", // Available (Green)
  greenLight: "rgba(56,142,60,0.15)",
};

const SCREEN_ID = '00000000-0000-0000-0000-000000000001';
const RATE_PER_MINUTE = 1000;
const START_HOUR = 6;
const END_HOUR = 19; // 7 PM
const DAY_MIN = (END_HOUR - START_HOUR) * 60;
const PPM = 1.4; 

function calcCost(totalSeconds: number) {
  if (totalSeconds <= 0) return { cost: 0, base: 0, extra: 0, extraSeconds: 0 };
  if (totalSeconds <= 60) return { cost: RATE_PER_MINUTE, base: RATE_PER_MINUTE, extra: 0, extraSeconds: 0 };
  const extraSeconds = totalSeconds - 60;
  const extra = Math.round(extraSeconds * (RATE_PER_MINUTE / 60) * 100) / 100;
  const cost = Math.round((RATE_PER_MINUTE + extra) * 100) / 100;
  return { cost, base: RATE_PER_MINUTE, extra, extraSeconds };
}

function naira(n: number) { return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`; }
function pad(n: number) { return String(n).padStart(2, "0"); }
function localDateKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function addYears(d: Date, n: number) { const r = new Date(d); r.setFullYear(r.getFullYear() + n); return r; }
function isSameDate(a: Date, b: Date) { return localDateKey(a) === localDateKey(b); }
function minutesToHHMM(min: number) { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`; }
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
function getMBU(videoSeconds: number) {
  if (!videoSeconds || videoSeconds <= 0) return 60;
  if (videoSeconds >= 60) return videoSeconds;
  return Math.ceil(60 / videoSeconds) * videoSeconds;
}

// Removed getMBU, maxLoopsForward, maxLoopsBackward. Using availableMinsForward and availableMinsBackward
function availableMinsForward(startMin: number, bookings: any[]) {
  const dayEnd = END_HOUR * 60;
  let boundary = dayEnd;
  for (const b of bookings) if (b.startMin >= startMin && b.startMin < boundary) boundary = b.startMin;
  return Math.max(0, boundary - startMin);
}

function availableMinsBackward(endMin: number, bookings: any[]) {
  const dayStart = START_HOUR * 60;
  let boundary = dayStart;
  for (const b of bookings) { const be = b.startMin + b.durationMin; if (be <= endMin && be > boundary) boundary = be; }
  return Math.max(0, endMin - boundary);
}
function isStartInsideBooking(startMin: number, bookings: any[]) {
  return bookings.some((b) => startMin >= b.startMin && startMin < b.startMin + b.durationMin);
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default function BookPage() {
  return (
    <Suspense fallback={<div />}>
      <DoohScheduler />
    </Suspense>
  );
}

function DoohScheduler() {
  const { toast } = useToast();
  const router = useRouter();
  
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [viewDate, setViewDate] = useState(today);
  const [calCursor, setCalCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  
  // Creatives integration
  const [approvedCreatives, setApprovedCreatives] = useState<any[]>([]);
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);
  const videoSeconds = selectedCreative?.duration_seconds || 60;
  
  const [cart, setCart] = useState<any[]>([]);
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  
  const [draft, setDraft] = useState<any>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [repeatCount, setRepeatCount] = useState(4);
  const [repeatUnit, setRepeatUnit] = useState("weeks");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedHour, setSelectedHour] = useState(8);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [requestedMinutes, setRequestedMinutes] = useState(1);
  const anchorRef = useRef<number | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Fetch approved ads
  useEffect(() => {
    api.get('/ads').then((a) => {
      const approved = (a.data.ads || []).filter((ad: any) => ad.status === 'approved');
      setApprovedCreatives(approved);
      if (approved.length > 0) setSelectedCreative(approved[0]);
    }).catch(() => {});
  }, []);

  // Fetch live bookings
  useEffect(() => {
    const fetchSlots = () => {
      const s = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1).toISOString();
      const e = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 0).toISOString();
      api.get(`/bookings/slots?screen_id=${SCREEN_ID}&start_date=${s}&end_date=${e}`)
        .then(res => {
           const slots = res.data.slots || [];
           const formatted = slots.map((s: any) => {
             const sd = new Date(s.start_time);
             const ed = new Date(s.end_time);
             return {
               dateKey: localDateKey(sd),
               startMin: sd.getHours() * 60 + sd.getMinutes(),
               durationMin: (ed.getTime() - sd.getTime()) / 60000,
               label: "Booked Slot"
             };
           });
           setLiveBookings(formatted);
        })
        .catch(console.error);
    };
    fetchSlots();
    const interval = setInterval(fetchSlots, 10000);
    return () => clearInterval(interval);
  }, [calCursor]);

  function bookingsForDate(dateKey: string) {
    const others = liveBookings.filter((b) => b.dateKey === dateKey).map((b) => ({ ...b, type: "other" }));
    const cartItems = cart.filter((c) => localDateKey(c.date) === dateKey)
      .map((c) => ({ startMin: c.startMin, durationMin: Math.max(1, Math.round(c.durationSec / 60)), label: selectedCreative?.title || "Your booking", type: "cart" }));
    return [...others, ...cartItems];
  }

  const autoSelectSlot = (date: Date, hour: number) => {
    const bookings = bookingsForDate(localDateKey(date));
    let firstAvailMin = hour * 60;
    while(firstAvailMin < (hour + 1) * 60 && isStartInsideBooking(firstAvailMin, bookings)) {
      firstAvailMin++;
    }
    if (firstAvailMin < (hour + 1) * 60) {
      setDraft({ date, startMin: firstAvailMin, loops: 1 });
    } else {
      setDraft(null);
    }
  };

  function minuteFromClientY(clientY: number) {
    if (!timelineRef.current) return START_HOUR * 60;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollTop = timelineRef.current.scrollTop;
    const y = clientY - rect.top + scrollTop;
    let min = START_HOUR * 60 + y / PPM;
    min = Math.round(min);
    return Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, min));
  }

  function handleTimelineDown(e: any) {
    if (!selectedCreative) {
      toast("Please select an ad creative first", "error");
      return;
    }
    if (e.target.closest("[data-pill]")) return;
    const point = e.touches ? e.touches[0] : e;
    const min = minuteFromClientY(point.clientY);
    const bookings = bookingsForDate(localDateKey(viewDate));
    if (isStartInsideBooking(min, bookings)) return;
    anchorRef.current = min;
    setDraft({ date: viewDate, startMin: min, loops: 1 });
    setDragging(true);
    setMessage("");
  }

  useEffect(() => {
    if (!dragging) return;
    function move(e: any) {
      if (!anchorRef.current) return;
      const point = e.touches ? e.touches[0] : e;
      const cur = minuteFromClientY(point.clientY);
      const anchor = anchorRef.current;
      const bookings = bookingsForDate(localDateKey(viewDate));
      const direction = cur >= anchor ? 1 : -1;
      
      const draggedMins = Math.max(1, Math.abs(cur - anchor));
      const desiredLoops = Math.max(1, Math.floor((draggedMins * 60) / (videoSeconds || 60)));
      
      let loops, startMin;
      if (direction > 0) {
        const availMins = availableMinsForward(anchor, bookings);
        const maxL = Math.floor((availMins * 60) / (videoSeconds || 60));
        loops = Math.min(desiredLoops, maxL);
        startMin = anchor;
      } else {
        const availMins = availableMinsBackward(anchor, bookings);
        const maxL = Math.floor((availMins * 60) / (videoSeconds || 60));
        loops = Math.min(desiredLoops, maxL);
        
        const allocatedMins = Math.ceil((loops * (videoSeconds || 60)) / 60);
        startMin = anchor - allocatedMins;
      }
      setDraft({ date: viewDate, startMin, loops });
    }
    function up() { setDragging(false); }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [dragging, viewDate, videoSeconds, liveBookings, cart]);

  const draftBookings = draft ? bookingsForDate(localDateKey(draft.date)) : [];
  const draftInsideBooking = draft ? isStartInsideBooking(draft.startMin, draftBookings) : false;
  
  const availMins = draft ? availableMinsForward(draft.startMin, draftBookings) : 0;
  const draftMaxLoops = draft ? Math.floor((availMins * 60) / (videoSeconds || 60)) : 0;
  
  const draftDurationMin = draft ? Math.ceil((videoSeconds * draft.loops) / 60) : 0;
  const draftDurationSec = draftDurationMin * 60;
  const draftPrice = calcCost(draftDurationSec);

  function handleAddToCart() {
    if (!selectedCreative) { toast("Please select a creative first", "error"); return; }
    if (!draft || draft.loops < 1) { setMessage("There isn't enough open room here to fit even one full play of your video."); return; }
    if (draftInsideBooking || draft.loops > draftMaxLoops) {
      setMessage("That overlaps a booking already on this day — adjust the time.");
      return;
    }
    setCart((prev) => [...prev, {
      id: crypto.randomUUID(),
      creative: selectedCreative,
      date: draft.date,
      startMin: draft.startMin,
      loops: draft.loops,
      durationSec: draftDurationSec,
      priceInfo: draftPrice
    }]);
    setDraft(null);
    setMessage("");
    toast("Added to cart", "success");
  }

  function handleRepeatAdd() {
    if (!selectedCreative) { toast("Please select a creative first", "error"); return; }
    if (!draft || draft.loops < 1) { setMessage("There isn't enough open room here to fit even one full play of your video."); return; }
    const stepDate = (i: number) => {
      if (repeatUnit === "days") return addDays(draft.date, i);
      if (repeatUnit === "weeks") return addDays(draft.date, i * 7);
      if (repeatUnit === "months") return addMonths(draft.date, i);
      return addYears(draft.date, i);
    };
    let added = 0, skipped = 0;
    const newItems: any[] = [];
    for (let i = 0; i < repeatCount; i++) {
      const d = stepDate(i);
      const dateKey = localDateKey(d);
      const existing = [
        ...liveBookings.filter((b) => b.dateKey === dateKey).map((b) => ({ ...b, type: "other" })),
        ...cart.filter((c) => localDateKey(c.date) === dateKey).map((c) => ({ startMin: c.startMin, durationMin: Math.round(c.durationSec / 60) })),
        ...newItems.filter((n) => localDateKey(n.date) === dateKey).map((n) => ({ startMin: n.startMin, durationMin: Math.round(n.durationSec / 60) })),
      ];
      const requiredEnd = draft.startMin + draftDurationSec / 60;
      const conflict = isStartInsideBooking(draft.startMin, existing) || existing.some((b) => draft.startMin < b.startMin + (b.durationMin || 0) && requiredEnd > b.startMin);
      if (conflict) { skipped++; continue; }
      newItems.push({ id: crypto.randomUUID(), creative: selectedCreative, date: d, startMin: draft.startMin, durationSec: draftDurationSec, videoSeconds, loops: draft.loops, priceInfo: draftPrice });
      added++;
    }
    if (newItems.length > 0) setCart((prev) => [...prev, ...newItems]);
    setDraft(null);
    setMessage(skipped > 0 ? `Added ${added} booking${added === 1 ? "" : "s"} to cart. Skipped ${skipped} — they clashed with an existing booking.` : `Added ${added} booking${added === 1 ? "" : "s"} to cart.`);
    toast(`Added ${added} slots`, "success");
  }

  function removeFromCart(id: any) { setCart((prev) => prev.filter((c) => c.id !== id)); }

  const cartTotal = cart.reduce((s, c) => s + c.priceInfo.cost, 0);

  const handleReserve = async () => {
    if (cart.length === 0 || !selectedCreative) return;
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
      setCheckoutItems(cart);
      setCheckoutTotal(cartTotal);
      setShowCheckout(true);
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
        router.push('/campaigns');
      }
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Payment failed', 'error');
      setPaying(false);
    }
  };

  function closeCheckout() { setShowCheckout(false); }

  // ---- month calendar cells ----
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

  function dayStatus(d: Date) {
    if (!d) return 'none';
    const key = localDateKey(d);
    const other = liveBookings.filter((b) => b.dateKey === key);
    const mine = cart.filter((c) => localDateKey(c.date) === key);
    
    if (other.length === 0 && mine.length === 0) return 'green';
    
    let bookedMins = 0;
    other.forEach(b => bookedMins += b.durationMin);
    mine.forEach(m => bookedMins += Math.max(1, Math.round(m.durationSec / 60)));
    
    if (bookedMins >= DAY_MIN) return 'red';
    return 'amber';
  }

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const showNowLine = isSameDate(viewDate, today) && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="qs" style={{ minHeight: "100%", color: C.black }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
            .qs { font-family: 'Quicksand', sans-serif; }
            .mono { font-family: 'IBM Plex Mono', monospace; }
            .timeline-bg { touch-action: none; }
            .day-cell { transition: all 120ms ease; }
            .day-cell:hover:not(.empty) { background: rgba(232,160,32,0.10); }
            input[type="number"]::-webkit-inner-spin-button { opacity: 1; }
            .pill { box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
            .hazard-stripe { background-image: repeating-linear-gradient(135deg, ${C.hazard}, ${C.hazard} 5px, ${C.hazardDark} 5px, ${C.hazardDark} 10px); }
            @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(184,134,11,0.5); } 50% { box-shadow: 0 0 0 5px rgba(184,134,11,0); } }
            .pending-pulse { animation: pulseGlow 1.8s ease-in-out infinite; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-thumb { background: rgba(10,10,10,0.15); border-radius: 4px; }
          `}</style>

          {/* Header & Step Indicator */}
          <div style={{ background: C.black, padding: "18px 24px", borderRadius: 14, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ color: C.gold, fontWeight: 700, fontSize: 20 }}>Studio Arella</div>
                <div className="mono" style={{ color: C.mutedOnDark, fontSize: 12, marginTop: 2 }}>Bems Junction LED Screen — Umuahia</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {[
                  { step: 1, label: "Choose Ad" },
                  { step: 2, label: "Schedule" },
                  { step: 3, label: "Checkout" }
                ].map((s) => (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 8, opacity: currentStep === s.step ? 1 : 0.5 }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: "50%",
                      background: currentStep === s.step ? C.gold : currentStep > s.step ? C.green : "rgba(247,244,239,0.1)",
                      color: currentStep === s.step ? C.black : "#fff",
                      fontWeight: 700, fontSize: 12, transition: "all 0.2s"
                    }}>
                      {currentStep > s.step ? "✓" : s.step}
                    </div>
                    <span style={{ color: currentStep === s.step ? C.gold : C.cream, fontSize: 13, fontWeight: 600, display: "none" }} className="md:inline-block">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 1: CHOOSE AD */}
          {currentStep === 1 && (
            <div style={{ background: C.panel, borderRadius: 14, padding: "32px 24px", border: `1px solid ${C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Step 1: Choose Your Creative</div>
              <p style={{ color: C.muted, fontSize: 15, marginBottom: 32 }}>Select the advertisement you want to schedule on the screen.</p>
              
              {approvedCreatives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', background: "rgba(10,10,10,0.02)", borderRadius: 12 }}>
                  <FaFilm size={32} color={C.line} style={{ marginBottom: 16 }} />
                  <p style={{ fontSize: 15, color: C.muted }}>You have no approved ads yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {approvedCreatives.map(c => {
                    const isSelected = selectedCreative?.id === c.id;
                    return (
                      <div key={c.id} onClick={() => setSelectedCreative(c)}
                        style={{
                          border: isSelected ? `2px solid ${C.gold}` : `1px solid ${C.line}`,
                          borderRadius: 12, padding: 16, cursor: 'pointer',
                          background: isSelected ? "rgba(232,160,32,0.05)" : C.panel,
                          display: 'flex', gap: 16, alignItems: 'center',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? "0 4px 12px rgba(232,160,32,0.15)" : "none"
                        }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(10,10,10,0.05)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(c.file_type || c.media_type || '').includes('video') ? <FaFilm color={C.muted} size={18} /> : <FaImage color={C.muted} size={18} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: C.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</p>
                          <p className="mono" style={{ margin: 0, fontSize: 12, color: C.muted }}>Duration: {c.duration_seconds || 60} sec</p>
                        </div>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: isSelected ? `5px solid ${C.gold}` : `2px solid ${C.line}` }} />
                      </div>
                    );
                  })}
                </div>
              )}
              
              {selectedCreative && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
                  <AnimatedButton onClick={() => setCurrentStep(2)} style={{ background: C.gold, color: C.black, border: 'none', padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: "flex", gap: 8, alignItems: "center" }}>
                    Next: Choose Date & Time <ChevronRight size={18} />
                  </AnimatedButton>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SCHEDULE */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              
              {/* LEFT COLUMN: Calendar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 500 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setCurrentStep(1)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 600 }}>
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button onClick={() => setCurrentStep(3)} style={{ background: C.black, color: C.cream, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
                    <Ticket size={14} /> View Cart ({cart.length})
                  </button>
                </div>

                <div style={{ background: C.panel, borderRadius: 14, padding: 24, border: `1px solid ${C.line}` }}>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4, textAlign: "center" }}>Select a Date</div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, textAlign: "center" }}>Green dots mean fully available.</div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, background: "rgba(10,10,10,0.03)", padding: 8, borderRadius: 10 }}>
                    <button onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1))} style={iconBtnStyle}><ChevronLeft size={16} /></button>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                    <button onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1))} style={iconBtnStyle}><ChevronRight size={16} /></button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 12 }}>
                    {WEEKDAYS.map((w) => <div key={w} className="mono" style={{ fontSize: 12, textAlign: "center", color: C.muted, fontWeight: 600 }}>{w}</div>)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                    {monthCells.map((d, i) => {
                      if (!d) return <div key={i} />;
                      const status = dayStatus(d);
                      const isViewing = isSameDate(d, viewDate);
                      const isToday = isSameDate(d, today);
                      const isPast = d.getTime() < today.getTime();
                      const colorMap: any = { 'green': C.green, 'amber': C.pending, 'red': C.hazard, 'none': 'transparent' };
                      
                      return (
                        <button key={i} onClick={() => { 
                            if (status === 'red' || isPast) return;
                            setViewDate(d); 
                            setSelectedHour(8);
                            autoSelectSlot(d, 8);
                            setShowSlotModal(true);
                          }} className="day-cell"
                          style={{
                            aspectRatio: "1", borderRadius: 10, border: isToday && !isViewing ? `1px solid ${C.gold}` : "1px solid transparent",
                            background: isViewing ? "rgba(10,10,10,0.05)" : "transparent", color: isPast ? C.muted : C.black,
                            fontSize: 15, cursor: (status === 'red' || isPast) ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                            boxShadow: isViewing ? "inset 0 0 0 2px #0A0A0A" : "none",
                            opacity: isPast ? 0.4 : 1
                          }}>
                          <span className="mono" style={{ fontWeight: isViewing ? 700 : 500 }}>{d.getDate()}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: colorMap[status] }} title={status === 'green' ? 'Available' : status === 'amber' ? 'Partially full' : 'Full'} />
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 20, marginTop: 20, fontSize: 12, color: C.muted, justifyContent: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Dot color={C.green} /> Available</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Dot color={C.pending} /> Partially full</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Dot color={C.hazard} /> Full</span>
                  </div>
                </div>
              </div>

              {/* SLOT MODAL: Period & Minute Grid */}
              <Portal>
                {showSlotModal && (
                  <div className="qs" style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(10,10,10,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                  <div style={{ background: C.panel, borderRadius: 16, width: "100%", maxWidth: 650, maxHeight: "95vh", overflowY: "auto", position: "relative" }}>
                    
                    <button onClick={() => setShowSlotModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(10,10,10,0.05)", border: "none", borderRadius: "50%", padding: 8, cursor: "pointer", zIndex: 10, display: "flex" }}>
                      <X size={18} />
                    </button>
                    
                    <div style={{ padding: "32px 24px" }}>
                      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 24, paddingRight: 32 }}>
                        Schedule for {viewDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>

                      {/* Period Selector (Hours) */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Period (Hour)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                          {hours.map((h) => (
                            <button key={h} onClick={() => {
                              setSelectedHour(h);
                              autoSelectSlot(viewDate, h);
                            }}
                              style={{
                                background: selectedHour === h ? C.gold : "rgba(10,10,10,0.03)",
                                color: selectedHour === h ? C.black : C.black,
                                fontWeight: selectedHour === h ? 700 : 600,
                                border: `1px solid ${selectedHour === h ? C.gold : "transparent"}`,
                                borderRadius: 8, padding: "10px 0", fontSize: 13, cursor: "pointer", transition: "all 0.15s"
                              }}>
                              {formatMin(h * 60)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Draft Summary & Add to Cart */}
                      {draft && isSameDate(draft.date, viewDate) && (() => {
                        const isInvalid = draftInsideBooking || draftMaxLoops < 1;
                        return (
                          <div style={{ marginTop: 24, padding: "20px", background: isInvalid ? "rgba(211,47,47,0.05)" : C.greenLight, border: `1px solid ${isInvalid ? C.hazard : C.green}`, borderRadius: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                              <div style={{ fontWeight: 700, fontSize: 16, color: isInvalid ? C.hazard : C.green }}>
                                {isInvalid ? 'Invalid Selection' : 'Duration & Booking Details'}
                              </div>
                              <button onClick={() => setDraft(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: C.muted, fontSize: 12 }}><X size={14} /> Clear</button>
                            </div>

                            {/* Loops Stepper */}
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Loops (Full Plays)</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <button onClick={() => setDraft((d: any) => ({ ...d, loops: Math.max(1, d.loops - 1) }))} style={{...stepBtnStyle, width: 32, height: 32}}>−</button>
                                  <span className="mono" style={{ width: 40, textAlign: "center", fontWeight: 700, fontSize: 18 }}>{draft.loops}</span>
                                  <button
                                    onClick={() => setDraft((d: any) => ({ ...d, loops: Math.min(draftMaxLoops, d.loops + 1) }))}
                                    disabled={draft.loops >= draftMaxLoops}
                                    style={{ ...stepBtnStyle, width: 32, height: 32, opacity: draft.loops >= draftMaxLoops ? 0.4 : 1, cursor: draft.loops >= draftMaxLoops ? "not-allowed" : "pointer" }}>
                                    +
                                  </button>
                                </div>
                              </div>
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ background: "#fff", borderRadius: 8, padding: "12px", border: `1px solid ${C.line}` }}>
                                  <div className="mono" style={{ fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: C.muted }}>
                                      {formatMin(draft.startMin)} – {formatMin(draft.startMin + draftDurationSec / 60)} ({formatDurationSec(draftDurationSec)})
                                    </span>
                                    <span style={{ color: C.green, fontWeight: 700, fontSize: 16 }}>{naira(draftPrice.cost)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isInvalid ? (
                               <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", borderRadius: 8, padding: "12px", fontSize: 13, color: "#B23B3B" }}>
                                 <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                                 <span>{draftInsideBooking ? "That start time is already booked." : `Not enough open room here for even one full play of your video. Try a different start time.`}</span>
                               </div>
                            ) : (
                               <>
                                 <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                                   <strong>Video Length:</strong> {videoSeconds}s<br/>
                                   <strong>Total Time Needed:</strong> {videoSeconds * draft.loops}s<br/>
                                   <strong style={{ color: C.black }}>Maximum allocated time for your video:</strong> {draftDurationMin} Minute{draftDurationMin === 1 ? "" : "s"}
                                 </div>
                                 
                                 <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                   <button onClick={() => {
                                      handleAddToCart();
                                      toast("Added to Cart! You can close this window to checkout.");
                                   }} style={{ padding: "12px 20px", borderRadius: 8, border: "none", background: C.black, color: C.cream, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
                                     <Ticket size={16} /> Add to Cart
                                   </button>
                                   <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.muted, background: "#fff", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.line}` }}>
                                     <RepeatIcon size={14} /> Repeat?
                                     <input type="number" min={1} max={365} value={repeatCount} onChange={(e) => setRepeatCount(Math.max(1, Number(e.target.value)))} className="mono" style={{ ...inputStyle, width: 56, padding: "6px" }} />
                                     <select value={repeatUnit} onChange={(e) => setRepeatUnit(e.target.value)} style={{ ...inputStyle, padding: "6px", width: "auto" }}>
                                       <option value="days">days</option>
                                       <option value="weeks">weeks</option>
                                       <option value="months">months</option>
                                     </select>
                                     <button onClick={() => {
                                        handleRepeatAdd();
                                        toast("Added Repeating Slots to Cart!");
                                     }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "rgba(10,10,10,0.05)", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.black }}>
                                       Add {repeatCount}×
                                     </button>
                                   </div>
                                 </div>
                               </>
                            )}
                          </div>
                        );
                      })()}

                      {/* Minute Grid */}
                      <div style={{ background: "rgba(10,10,10,0.02)", borderRadius: 12, padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{formatMin(selectedHour * 60)} Slots (Minute-by-Minute)</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.darkGold, background: "rgba(232,160,32,0.15)", padding: "4px 8px", borderRadius: 6 }}>
                            {(() => {
                               const bookings = bookingsForDate(localDateKey(viewDate));
                               let available = 0;
                               for(let m=0; m<60; m++) {
                                 if(!isStartInsideBooking(selectedHour * 60 + m, bookings)) available++;
                               }
                               return `${available} Available Slots`;
                            })()}
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
                          {Array.from({ length: 60 }).map((_, m) => {
                            const minOfDay = selectedHour * 60 + m;
                            const bookings = bookingsForDate(localDateKey(viewDate));
                            const isBooked = isStartInsideBooking(minOfDay, bookings);
                            
                            let isSelected = false;
                            if (draft && isSameDate(draft.date, viewDate)) {
                              const draftEnd = draft.startMin + draftDurationSec / 60;
                              if (minOfDay >= draft.startMin && minOfDay < draftEnd) {
                                isSelected = true;
                              }
                            }

                            return (
                              <button key={m}
                                onClick={() => {
                                  if (isBooked) return;
                                  setDraft({ date: viewDate, startMin: minOfDay, loops: 1 });
                                }}
                                disabled={isBooked}
                                style={{
                                  aspectRatio: "1.5", borderRadius: 6, border: `1px solid ${isSelected ? C.gold : isBooked ? "transparent" : C.line}`,
                                  background: isBooked ? "rgba(211,47,47,0.1)" : isSelected ? C.gold : "#fff",
                                  color: isBooked ? C.hazard : isSelected ? C.black : C.muted,
                                  fontWeight: isSelected ? 700 : 500,
                                  fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                                  cursor: isBooked ? "not-allowed" : "pointer", opacity: isBooked ? 0.7 : 1, transition: "all 0.1s"
                                }}
                                className="mono">
                                1 min
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                )}
              </Portal>
            </div>
          )}

          {/* STEP 3: REVIEW & CHECKOUT */}
          {currentStep === 3 && (
            <div style={{ maxWidth: 700, margin: "0 auto", background: C.panel, borderRadius: 14, border: `1px solid ${C.line}`, padding: "32px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <button onClick={() => setCurrentStep(2)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 600 }}>
                  <ChevronLeft size={16} /> Back to Schedule
                </button>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Checkout</div>
              </div>

              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", background: "rgba(10,10,10,0.02)", borderRadius: 12 }}>
                  <Ticket size={32} color={C.line} style={{ marginBottom: 16 }} />
                  <p style={{ fontSize: 15, color: C.muted }}>Your cart is empty.</p>
                  <AnimatedButton onClick={() => setCurrentStep(2)} style={{ marginTop: 16, background: C.black, color: C.cream, border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    Go Schedule Slots
                  </AnimatedButton>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    {[...cart].sort((a, b) => a.date.getTime() - b.date.getTime() || a.startMin - b.startMin).map((c) => (
                      <div key={c.id} style={{ background: "rgba(10,10,10,0.03)", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                        <div className="mono" style={{ fontSize: 13, color: C.muted }}>
                          <div style={{ color: C.black, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                          <div>{formatMin(c.startMin)} – {formatMin(c.startMin + Math.round(c.durationSec / 60))} · {formatDurationSec(c.durationSec)} airtime</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <span className="mono" style={{ color: C.green, fontSize: 16, fontWeight: 700 }}>{naira(c.priceInfo.cost)}</span>
                          <button onClick={() => removeFromCart(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} className="hover:bg-red-100">
                            <Trash2 size={16} color={C.hazard} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: C.black, borderRadius: 12, padding: "20px 24px", marginBottom: 24, color: C.cream }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>Total Airtime</span>
                      <span className="mono" style={{ fontWeight: 600, fontSize: 16 }}>{cart.length} block(s)</span>
                    </div>
                    <div style={{ height: 1, background: "rgba(247,244,239,0.15)", marginBottom: 16 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 18 }}>Total Amount</span>
                      <span className="mono" style={{ color: C.gold, fontWeight: 700, fontSize: 24 }}>{naira(cartTotal)}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
                    {bookingId ? (
                       <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                         <div style={{ textAlign: "center", color: C.green, fontWeight: 700, marginBottom: 8 }}>Slots reserved successfully! Choose a payment method:</div>
                         <AnimatedButton onClick={() => handlePay('wallet')} disabled={paying} style={{ background: C.black, color: '#fff', border: 'none', padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                           <FaWallet size={18} /> Pay from Wallet
                         </AnimatedButton>
                         <AnimatedButton onClick={() => handlePay('monnify')} disabled={paying} style={{ background: "rgba(232,160,32,0.1)", color: C.darkGold, border: `2px solid ${C.gold}`, padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                           <FaCreditCard size={18} /> Pay with Card / Bank
                         </AnimatedButton>
                       </div>
                    ) : (
                      <AnimatedButton onClick={handleReserve} disabled={reserving} style={{ width: "100%", padding: "16px 0", borderRadius: 10, border: "none", background: C.gold, color: C.black, fontWeight: 700, fontSize: 16, cursor: reserving ? 'not-allowed' : 'pointer', opacity: reserving ? 0.7 : 1, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                        {reserving ? 'Reserving Slots...' : <><Ticket size={18} /> Reserve & Proceed to Payment</>}
                      </AnimatedButton>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </PageTransition>
    </DashboardLayout>
  );
}

const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13, boxSizing: "border-box" as const };
const iconBtnStyle = { background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: 4, cursor: "pointer", display: "flex" };
const miniLabel = { fontSize: 10, color: C.muted, display: "block", marginBottom: 4 };
const stepBtnStyle = { width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.line}`, background: "#fff", fontSize: 15, lineHeight: 1, cursor: "pointer" };

function Dot({ color }: { color: string }) {
  return <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, display: "inline-block" }} />;
}
