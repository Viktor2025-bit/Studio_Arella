'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Clock, Info, X, Check, Ticket, AlertTriangle, Trash2, Repeat as RepeatIcon } from "lucide-react";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import { FaImage, FaFilm, FaWallet, FaCreditCard } from 'react-icons/fa6';
import { AnimatedButton, PageTransition } from '@/components/ui/Animations';
import { theme } from '@/lib/theme';

const SCREEN_ID = '00000000-0000-0000-0000-000000000001';
const START_HOUR = 7;
const END_HOUR = 20; // 8 PM
const DAY_MIN = (END_HOUR - START_HOUR) * 60;
const PPM = 1.4; 

function calcCost(totalSeconds: number, rate: number) {
  if (totalSeconds <= 0) return { cost: 0, base: 0, extra: 0, extraSeconds: 0 };
  if (totalSeconds <= 60) return { cost: rate, base: rate, extra: 0, extraSeconds: 0 };
  const extraSeconds = totalSeconds - 60;
  const extra = Math.round(extraSeconds * (rate / 60) * 100) / 100;
  const cost = Math.round((rate + extra) * 100) / 100;
  return { cost, base: rate, extra, extraSeconds };
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
  const [baseRate, setBaseRate] = useState(333.33);

  useEffect(() => {
    api.get('/pricing/rate').then(res => setBaseRate(res.data.rate)).catch(console.error);
  }, []);
  
  // Creatives integration
  const [approvedCreatives, setApprovedCreatives] = useState<any[]>([]);
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);
  const videoSeconds = selectedCreative?.duration_seconds || 60;
  
  const { cart, addToCart, addMultipleToCart, updateCartItem, getCartTotal } = useCartStore();
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  
  const [draft, setDraft] = useState<any>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [spreadModal, setSpreadModal] = useState(false);
  const [spreadDuration, setSpreadDuration] = useState("4weeks");
  const [spreadPattern, setSpreadPattern] = useState("weekdays");
  const [customDays, setCustomDays] = useState<number[]>([]);
  
  const [editCartItem, setEditCartItem] = useState<any>(null);
  const [editHour, setEditHour] = useState(8);
  const [editMinute, setEditMinute] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedHour, setSelectedHour] = useState(8);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [requestedMinutes, setRequestedMinutes] = useState(1);
  const anchorRef = useRef<number | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Fetch approved ads
  useEffect(() => {
    api.get('/ads').then((a) => {
      const allowed = (a.data.ads || []).filter((ad: any) => ad.status === 'approved' || ad.status === 'pending');
      setApprovedCreatives(allowed);
      if (allowed.length > 0) setSelectedCreative(allowed[0]);
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
  const draftPrice = calcCost(draftDurationSec, baseRate);

  function handleAddToCart() {
    if (!selectedCreative) { toast("Please select a creative first", "error"); return; }
    if (!draft || draft.loops < 1) { setMessage("There isn't enough open room here to fit even one full play of your video."); return; }
    if (draftInsideBooking || draft.loops > draftMaxLoops) {
      setMessage("That overlaps a booking already on this day — adjust the time.");
      return;
    }
    addToCart({
      id: crypto.randomUUID(),
      creative: selectedCreative,
      date: draft.date,
      startMin: draft.startMin,
      loops: draft.loops,
      durationSec: draftDurationSec,
      priceInfo: draftPrice
    });
    setDraft(null);
    setMessage("");
    toast("Added to cart", "success");
  }

  function handleSpreadAdd() {
    if (!selectedCreative) { toast("Please select a creative first", "error"); return; }
    if (!draft || draft.loops < 1) { toast("There isn't enough open room here to fit even one full play of your video.", "error"); return; }
    
    const startDate = draft.date;
    let endDate = new Date(startDate);
    if (spreadDuration === "1week") endDate = addDays(startDate, 7);
    else if (spreadDuration === "4weeks") endDate = addDays(startDate, 28);
    else if (spreadDuration === "3months") endDate = addMonths(startDate, 3);
    else if (spreadDuration === "6months") endDate = addMonths(startDate, 6);
    else if (spreadDuration === "1year") endDate = addYears(startDate, 1);

    let added = 0, skipped = 0;
    const newItems: any[] = [];
    let curDate = new Date(startDate);
    
    let dayIndex = 0;
    while (curDate < endDate) {
      const dayOfWeek = curDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
      
      let shouldAdd = false;
      if (spreadPattern === "daily") shouldAdd = true;
      else if (spreadPattern === "weekdays") shouldAdd = (dayOfWeek >= 1 && dayOfWeek <= 5);
      else if (spreadPattern === "weekends") shouldAdd = (dayOfWeek === 0 || dayOfWeek === 6);
      else if (spreadPattern === "custom") shouldAdd = customDays.includes(dayOfWeek);
      else if (spreadPattern === "alternate") shouldAdd = (dayIndex % 2 === 0);
      
      if (shouldAdd) {
        const dateKey = localDateKey(curDate);
        const existing = [
          ...liveBookings.filter((b) => b.dateKey === dateKey).map((b) => ({ ...b, type: "other" })),
          ...cart.filter((c) => localDateKey(c.date) === dateKey).map((c) => ({ startMin: c.startMin, durationMin: Math.round(c.durationSec / 60) })),
          ...newItems.filter((n) => localDateKey(n.date) === dateKey).map((n) => ({ startMin: n.startMin, durationMin: Math.round(n.durationSec / 60) })),
        ];
        const requiredEnd = draft.startMin + draftDurationSec / 60;
        const conflict = isStartInsideBooking(draft.startMin, existing) || existing.some((b) => draft.startMin < b.startMin + (b.durationMin || 0) && requiredEnd > b.startMin);
        
        if (conflict) { 
          skipped++; 
        } else {
          newItems.push({ id: crypto.randomUUID(), creative: selectedCreative, date: new Date(curDate), startMin: draft.startMin, durationSec: draftDurationSec, videoSeconds, loops: draft.loops, priceInfo: draftPrice });
          added++;
        }
      }
      
      curDate = addDays(curDate, 1);
      dayIndex++;
    }
    
    if (newItems.length > 0) addMultipleToCart(newItems);
    setSpreadModal(false);
    setDraft(null);
    setMessage(skipped > 0 ? `Added ${added} bookings. Skipped ${skipped} due to conflicts.` : `Successfully spread ${added} bookings.`);
    toast(`Added ${added} slots`, "success");
  }

  function openCartEdit(item: any) {
    setEditCartItem(item);
    setEditHour(Math.floor(item.startMin / 60));
    setEditMinute(item.startMin % 60);
  }

  function saveCartEdit() {
    if (!editCartItem) return;
    const newStartMin = editHour * 60 + editMinute;
    if (newStartMin < START_HOUR * 60 || newStartMin >= END_HOUR * 60) {
       toast("Time must be between 7 AM and 8 PM", "error"); return;
    }
    
    const dateKey = localDateKey(editCartItem.date);
    const existing = [
      ...liveBookings.filter((b) => b.dateKey === dateKey).map((b) => ({ ...b, type: "other" })),
      ...cart.filter((c) => c.id !== editCartItem.id && localDateKey(c.date) === dateKey).map((c) => ({ startMin: c.startMin, durationMin: Math.round(c.durationSec / 60) })),
    ];
    const requiredEnd = newStartMin + editCartItem.durationSec / 60;
    const conflict = isStartInsideBooking(newStartMin, existing) || existing.some((b) => newStartMin < b.startMin + (b.durationMin || 0) && requiredEnd > b.startMin);
    
    if (conflict) {
       toast("This time slot is already booked on this day. Choose another time.", "error"); return;
    }
    
    updateCartItem(editCartItem.id, { startMin: newStartMin });
    setEditCartItem(null);
    toast("Time updated successfully", "success");
  }

  const cartTotal = getCartTotal();

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
        <div className="qs" style={{ minHeight: "100%", color: theme.color.text1 }}>
          <style>{`
            .qs { font-family: var(--font-quicksand), 'Quicksand', sans-serif; }
            .mono { font-family: var(--font-plex), 'IBM Plex Mono', monospace; }
            .timeline-bg { touch-action: none; }
            .day-cell { transition: all 120ms ease; }
            .day-cell:hover:not(.empty) { background: ${theme.color.goldLight}; }
            input[type="number"]::-webkit-inner-spin-button { opacity: 1; }
            .pill { box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-thumb { background: ${theme.color.border}; border-radius: 4px; }
          `}</style>

          {/* Header & Step Indicator */}
          <div style={{ background: theme.color.charcoal900, padding: "20px 28px", borderRadius: 16, marginBottom: 24, border: `1px solid ${theme.color.border}`, boxShadow: theme.shadow.md }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ color: theme.color.gold, fontWeight: 800, fontSize: 22, letterSpacing: '-0.3px' }}>Studio Arella</div>
                <div className="mono" style={{ color: theme.color.text4, fontSize: 13, marginTop: 4 }}>Bems Junction LED Screen — Umuahia</div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {[
                  { step: 1, label: "Choose Ad" },
                  { step: 2, label: "Schedule" },
                  
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

          {/* STEP 1: CHOOSE AD */}
          {currentStep === 1 && (
            <div style={{ background: theme.color.surface, borderRadius: 24, padding: "clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)", border: `1px solid ${theme.color.border2}`, boxShadow: theme.shadow.md, transition: "all 0.3s ease" }}>
              <div style={{ fontWeight: 800, fontSize: 26, marginBottom: 12, color: theme.color.text1, letterSpacing: "-0.5px" }}>Step 1: Choose Your Creative</div>
              <p style={{ color: theme.color.text3, fontSize: 15, marginBottom: 32 }}>Select the advertisement you want to schedule on the screen.</p>
              
              {approvedCreatives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', background: theme.color.surface2, borderRadius: 12, border: `1px dashed ${theme.color.border}` }}>
                  <FaFilm size={32} color={theme.color.text4} style={{ marginBottom: 16 }} />
                  <p style={{ fontSize: 15, color: theme.color.text3 }}>You have no approved ads yet.</p>
                  <AnimatedButton onClick={() => router.push('/creative')} style={{ marginTop: 16, background: theme.color.charcoal900, color: theme.color.surface, border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    Create or Upload Ad
                  </AnimatedButton>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
                  {approvedCreatives.map(c => {
                    const isSelected = selectedCreative?.id === c.id;
                    return (
                      <div key={c.id} onClick={() => setSelectedCreative(c)}
                        style={{
                          border: isSelected ? `2px solid ${theme.color.gold}` : `1px solid ${theme.color.border}`,
                          borderRadius: 14, padding: 18, cursor: 'pointer',
                          background: isSelected ? theme.color.goldLight : theme.color.surface,
                          display: 'flex', gap: 16, alignItems: 'center',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 4px 12px ${theme.color.goldLight}` : "none"
                        }}>
                        <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 12, background: theme.color.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: "hidden" }}>
                          {c.file_url ? (
                            (c.file_type || c.media_type || '').includes('video') ? (
                              <video 
                                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${c.file_url}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                autoPlay muted loop playsInline 
                              />
                            ) : (
                              <img 
                                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${c.file_url}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                alt="Ad preview" 
                              />
                            )
                          ) : (
                            (c.file_type || c.media_type || '').includes('video') ? <FaFilm color={theme.color.text3} size={20} /> : <FaImage color={theme.color.text3} size={20} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: theme.color.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</p>
                          <p className="mono" style={{ margin: 0, fontSize: 12, color: theme.color.text3 }}>Duration: {c.duration_seconds || 60} sec</p>
                        </div>
                        <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', border: isSelected ? `6px solid ${theme.color.gold}` : `2px solid ${theme.color.border2}` }} />
                      </div>
                    );
                  })}
                </div>
              )}
              

              
              {selectedCreative && (
                <div style={{ marginTop: 32, display: 'flex' }}>
                  <AnimatedButton onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} style={{ background: theme.color.gold, color: theme.color.charcoal900, border: "none", padding: "16px 32px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: theme.shadow.gold, width: "100%" }}>
                    Next: Choose Date & Time <ChevronRight size={18} />
                  </AnimatedButton>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SCHEDULE */}
          {currentStep === 2 && (
            <div className="booking-layout">
              
              {/* LEFT COLUMN: Calendar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setCurrentStep(1)} style={{ background: theme.color.surface2, border: `1px solid ${theme.color.border}`, color: theme.color.text1, padding: "8px 16px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800, transition: "all 0.2s" }}>
                    <ChevronLeft size={16} /> Back to Step 1
                  </button>
                </div>

                <div style={{ background: theme.color.surface, borderRadius: 24, padding: "32px", border: `1px solid ${theme.color.border2}`, boxShadow: theme.shadow.md, transition: "all 0.3s ease" }}>
                  <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8, color: theme.color.text1, letterSpacing: "-0.5px" }}>Select a Date</div>
                  <div style={{ fontSize: 14, color: theme.color.text3, marginBottom: 24 }}>Green dots mean fully available.</div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, background: theme.color.surface2, padding: "10px 14px", borderRadius: 12, border: `1px solid ${theme.color.border}` }}>
                    <button onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1))} style={iconBtnStyle}><ChevronLeft size={18} color={theme.color.text2} /></button>
                    <div style={{ fontWeight: 800, fontSize: 16, color: theme.color.text1 }}>
                      {calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                    <button onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1))} style={iconBtnStyle}><ChevronRight size={18} color={theme.color.text2} /></button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 14 }}>
                    {WEEKDAYS.map((w) => <div key={w} className="mono" style={{ fontSize: 13, textAlign: "center", color: theme.color.text3, fontWeight: 700 }}>{w}</div>)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
                    {monthCells.map((d, i) => {
                      if (!d) return <div key={i} />;
                      const status = dayStatus(d);
                      const isViewing = isSameDate(d, viewDate);
                      const isToday = isSameDate(d, today);
                      const isPast = d.getTime() < today.getTime();
                      const colorMap: any = { 'green': theme.color.success, 'amber': theme.color.warning, 'red': theme.color.error, 'none': 'transparent' };
                      
                      return (
                        <button key={i} onClick={() => { 
                            if (status === 'red' || isPast) return;
                            setViewDate(d); 
                            setSelectedHour(8);
                            autoSelectSlot(d, 8);
                            setShowSlotModal(true);
                          }} className="day-cell"
                          style={{
                            aspectRatio: "1", borderRadius: 12, border: isToday && !isViewing ? `1px solid ${theme.color.gold}` : "1px solid transparent",
                            background: isViewing ? theme.color.surface2 : "transparent", color: isPast ? theme.color.text4 : theme.color.text1,
                            fontSize: 16, cursor: (status === 'red' || isPast) ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                            boxShadow: isViewing ? `inset 0 0 0 2px ${theme.color.charcoal900}` : "none",
                            opacity: isPast ? 0.4 : 1
                          }}>
                          <span className="mono" style={{ fontWeight: isViewing ? 800 : 600 }}>{d.getDate()}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: colorMap[status] }} title={status === 'green' ? 'Available' : status === 'amber' ? 'Partially full' : 'Full'} />
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 24, marginTop: 24, fontSize: 13, color: theme.color.text3, justifyContent: "center", fontWeight: 600 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Dot color={theme.color.success} /> Available</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Dot color={theme.color.warning} /> Partially full</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Dot color={theme.color.error} /> Full</span>
                  </div>
                </div>
              </div>

                            {/* RIGHT COLUMN: Cart Status */}
              <div style={{ background: theme.color.surface, borderRadius: 24, border: `1px solid ${theme.color.border2}`, padding: "28px 24px", position: "sticky", top: 24, boxShadow: theme.shadow.md, transition: "all 0.3s ease" }}>
                 <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 24, color: theme.color.text1, letterSpacing: "-0.3px" }}>Your Cart</div>
                 <div style={{ textAlign: "center", padding: "20px 0" }}>
                   <p style={{ fontSize: 16, fontWeight: 700, color: theme.color.text1 }}>{cart.length} slot(s) selected</p>
                   <p className="mono" style={{ fontSize: 22, fontWeight: 900, color: theme.color.gold, margin: "10px 0 24px" }}>{naira(cartTotal)}</p>
                   <AnimatedButton onClick={() => router.push('/cart')} disabled={cart.length === 0} style={{ width: "100%", background: cart.length > 0 ? theme.color.gold : theme.color.surface2, color: cart.length > 0 ? theme.color.charcoal900 : theme.color.text3, border: "none", padding: "16px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: cart.length > 0 ? "pointer" : "not-allowed", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, boxShadow: cart.length > 0 ? theme.shadow.gold : 'none' }}>
                     Go to Cart <ChevronRight size={18} />
                   </AnimatedButton>
                 </div>
              </div>
            </div>
          )}

          {/* ALL MODALS (Rendered outside step logic so they can appear in any step) */}
          <Portal>
            {/* SLOT MODAL: Period & Minute Grid */}
            {showSlotModal && (
              <div className="qs" style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(10,10,10,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn 0.2s ease-out" }}>
              <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }`}</style>
              <div style={{ background: theme.color.surface, borderRadius: 24, width: "100%", maxWidth: 700, maxHeight: "95vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", border: `1px solid ${theme.color.border2}` }}>
                
                <button onClick={() => setShowSlotModal(false)} style={{ position: "absolute", top: 16, right: 16, background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: "50%", padding: 10, cursor: "pointer", zIndex: 10, display: "flex", color: theme.color.text1 }}>
                  <X size={18} />
                </button>
                
                <div style={{ padding: "clamp(20px, 5vw, 36px) clamp(20px, 5vw, 32px)" }}>
                  <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 28, paddingRight: 40, color: theme.color.text1 }}>
                    Schedule for {viewDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </div>

                  {/* Period Selector (Hours) */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: theme.color.text3, textTransform: "uppercase", letterSpacing: '0.05em', marginBottom: 14 }}>Select Hour</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
                      {hours.map((h) => (
                        <button key={h} onClick={() => {
                          setSelectedHour(h);
                          autoSelectSlot(viewDate, h);
                        }}
                          style={{
                            background: selectedHour === h ? theme.color.gold : theme.color.surface2,
                            color: selectedHour === h ? theme.color.charcoal900 : theme.color.text1,
                            fontWeight: selectedHour === h ? 800 : 700,
                            border: `1px solid ${selectedHour === h ? theme.color.goldMid : theme.color.border}`,
                            borderRadius: 999, padding: "12px 0", fontSize: 14, cursor: "pointer", transition: "all 0.2s ease",
                            boxShadow: selectedHour === h ? theme.shadow.gold : "0 2px 4px rgba(0,0,0,0.02)"
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
                      <div style={{ marginTop: 28, padding: "28px", background: isInvalid ? theme.color.errorLight : `linear-gradient(135deg, ${theme.color.surface2} 0%, ${theme.color.surface} 100%)`, border: `1px solid ${isInvalid ? theme.color.error : theme.color.border2}`, borderRadius: 20, boxShadow: theme.shadow.md }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                          <div style={{ fontWeight: 800, fontSize: 20, color: isInvalid ? theme.color.error : theme.color.text1, letterSpacing: "-0.3px" }}>
                            {isInvalid ? 'Invalid Selection' : 'Duration & Booking Details'}
                          </div>
                          <button onClick={() => setDraft(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: theme.color.text3, fontSize: 13, fontWeight: 700 }}><X size={16} /> Clear</button>
                        </div>

                        {/* Loops Stepper */}
                        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: theme.color.text3, textTransform: "uppercase", marginBottom: 6 }}>Loops (Full Plays)</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button onClick={() => setDraft((d: any) => ({ ...d, loops: Math.max(1, d.loops - 1) }))} style={{...stepBtnStyle, width: 36, height: 36}}>−</button>
                              <span className="mono" style={{ width: 44, textAlign: "center", fontWeight: 800, fontSize: 20, color: theme.color.text1 }}>{draft.loops}</span>
                              <button
                                onClick={() => setDraft((d: any) => ({ ...d, loops: Math.min(draftMaxLoops, d.loops + 1) }))}
                                disabled={draft.loops >= draftMaxLoops}
                                style={{ ...stepBtnStyle, width: 36, height: 36, opacity: draft.loops >= draftMaxLoops ? 0.4 : 1, cursor: draft.loops >= draftMaxLoops ? "not-allowed" : "pointer" }}>
                                +
                              </button>
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ background: theme.color.surface, borderRadius: 16, padding: "16px 20px", border: `1px solid ${theme.color.border2}`, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                              <div className="mono" style={{ fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
                                <span style={{ color: theme.color.text2 }}>
                                  {formatMin(draft.startMin)} – {formatMin(draft.startMin + draftDurationSec / 60)} <span style={{ color: theme.color.text4, fontWeight: 500, fontSize: 13 }}>({formatDurationSec(draftDurationSec)})</span>
                                </span>
                                <span style={{ color: theme.color.goldDark, fontWeight: 800, fontSize: 20 }}>{naira(draftPrice.cost)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isInvalid ? (
                           <div style={{ display: "flex", gap: 10, alignItems: "center", background: theme.color.surface, borderRadius: 10, padding: "14px", fontSize: 14, color: theme.color.error, border: `1px solid ${theme.color.errorLight}` }}>
                             <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                             <span style={{ fontWeight: 600 }}>{draftInsideBooking ? "That start time is already booked." : `Not enough open room here for even one full play of your video. Try a different start time.`}</span>
                           </div>
                        ) : (
                           <>
                             <div style={{ fontSize: 14, color: theme.color.text3, lineHeight: 1.6, marginBottom: 20, fontWeight: 500 }}>
                               <strong>Video Length:</strong> {videoSeconds}s<br/>
                               <strong>Total Time Needed:</strong> {videoSeconds * draft.loops}s<br/>
                               <strong style={{ color: theme.color.text1 }}>Maximum allocated time for your video:</strong> {draftDurationMin} Minute{draftDurationMin === 1 ? "" : "s"}
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full">
                               <button onClick={() => {
                                  handleAddToCart();
                                  toast("Added to Cart! You can close this window to checkout.");
                               }} className="flex-1 min-w-[200px] justify-center" style={{ padding: "16px 28px", borderRadius: 12, border: "none", background: theme.color.gold, color: theme.color.charcoal900, fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", gap: 10, alignItems: "center", boxShadow: theme.shadow.gold, transition: "all 0.2s" }}>
                                 Add to Cart
                               </button>
                               <button onClick={() => setSpreadModal(true)} className="flex-1 min-w-[160px] justify-center" style={{ padding: "14px 20px", borderRadius: 12, border: `1px solid ${theme.color.border2}`, background: theme.color.surface, fontSize: 15, fontWeight: 700, cursor: "pointer", color: theme.color.text1, display: "flex", gap: 8, alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                                 <RepeatIcon size={16} /> Spread Booking...
                               </button>
                               {cart.length > 0 && (
                                 <button onClick={() => {
                                    setShowSlotModal(false);
                                    setCurrentStep(3);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                 }} className="w-full md:w-auto md:flex-1 justify-center" style={{ padding: "14px 20px", borderRadius: 12, border: "none", background: theme.color.charcoal900, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", gap: 8, alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                                   View Cart ({cart.length}) <ChevronRight size={16} />
                                 </button>
                               )}
                             </div>
                           </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Minute Grid */}
                  <div style={{ background: theme.color.surface2, borderRadius: 20, padding: "28px", border: `1px solid ${theme.color.border2}`, marginTop: 28, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: theme.color.text1, letterSpacing: "-0.3px" }}>{formatMin(selectedHour * 60)} Slots (Minute-by-Minute)</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: theme.color.goldDark, background: theme.color.goldLight, padding: "6px 12px", borderRadius: 8 }}>
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

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))", gap: 8 }}>
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
                              aspectRatio: "1.5", borderRadius: 10, border: `1px solid ${isSelected ? theme.color.goldMid : isBooked ? "transparent" : theme.color.border2}`,
                              background: isBooked ? theme.color.surface2 : isSelected ? theme.color.gold : theme.color.surface,
                              color: isBooked ? theme.color.text4 : isSelected ? theme.color.charcoal900 : theme.color.text2,
                              fontWeight: isSelected ? 800 : 600,
                              fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: isBooked ? "not-allowed" : "pointer", opacity: isBooked ? 0.6 : 1, transition: "all 0.2s ease",
                              boxShadow: isSelected ? theme.shadow.gold : "0 1px 2px rgba(0,0,0,0.03)"
                            }}
                            className="mono">
                            1m
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </div>
            )}
            
            {/* SPREAD MODAL */}
            {spreadModal && draft && (
              <div className="qs" style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,10,10,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn 0.2s ease-out" }}>
                <div style={{ background: theme.color.surface, borderRadius: 24, width: "100%", maxWidth: 500, padding: "clamp(20px, 5vw, 32px)", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", border: `1px solid ${theme.color.border2}` }}>
                  <button onClick={() => setSpreadModal(false)} style={{ position: "absolute", top: 16, right: 16, background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: "50%", padding: 10, cursor: "pointer", color: theme.color.text1 }}>
                    <X size={18} />
                  </button>
                  <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8, color: theme.color.text1 }}>Spread Booking</div>
                  <div style={{ fontSize: 14, color: theme.color.text3, marginBottom: 24 }}>Select how you want to duplicate your {formatMin(draft.startMin)} slot.</div>
                  
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: theme.color.text2 }}>1. Duration (How long?)</label>
                    <select value={spreadDuration} onChange={e => setSpreadDuration(e.target.value)} style={{ ...inputStyle, padding: "12px", fontSize: 15, fontWeight: 600 }}>
                      <option value="1week">1 Week</option>
                      <option value="4weeks">4 Weeks</option>
                      <option value="3months">3 Months</option>
                      <option value="6months">6 Months</option>
                      <option value="1year">1 Year</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: theme.color.text2 }}>2. Pattern (Which days?)</label>
                    <select value={spreadPattern} onChange={e => setSpreadPattern(e.target.value)} style={{ ...inputStyle, padding: "12px", fontSize: 15, fontWeight: 600 }}>
                      <option value="daily">Every Day</option>
                      <option value="weekdays">Every Weekday (Mon-Fri)</option>
                      <option value="weekends">Every Weekend (Sat-Sun)</option>
                      <option value="alternate">Every Other Day</option>
                      <option value="custom">Custom Days...</option>
                    </select>
                  </div>
                  
                  {spreadPattern === "custom" && (
                    <div style={{ marginBottom: 24 }}>
                       <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: theme.color.text2 }}>Select Days</label>
                       <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                         {[1, 2, 3, 4, 5, 6, 0].map(day => (
                           <button key={day} onClick={() => {
                             if (customDays.includes(day)) setCustomDays(prev => prev.filter(d => d !== day));
                             else setCustomDays(prev => [...prev, day]);
                           }} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${customDays.includes(day) ? theme.color.goldMid : theme.color.border}`, background: customDays.includes(day) ? theme.color.goldLight : theme.color.surface2, color: customDays.includes(day) ? theme.color.goldDark : theme.color.text1, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                             {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}
                  
                  <div style={{ background: theme.color.surface2, padding: 16, borderRadius: 12, marginBottom: 24, fontSize: 13, color: theme.color.text2, border: `1px solid ${theme.color.border}` }}>
                    <Info size={16} style={{ float: "left", marginRight: 8, color: theme.color.gold }} />
                    If any future slots clash with existing bookings, we'll simply skip those blocked days and add the rest!
                  </div>
                  
                  <AnimatedButton onClick={handleSpreadAdd} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: theme.color.gold, color: theme.color.charcoal900, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: theme.shadow.gold }}>
                    Generate Booking Spread
                  </AnimatedButton>
                </div>
              </div>
            )}
            {/* SUCCESS / MESSAGE MODAL */}
            {message && (
              <div className="qs" style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,10,10,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn 0.2s ease-out" }}>
                <div style={{ background: theme.color.surface, borderRadius: 24, width: "100%", maxWidth: 400, padding: "32px", textAlign: "center", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", border: `1px solid ${theme.color.border2}` }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: theme.color.success + "20", color: theme.color.success, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Check size={32} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 12, color: theme.color.text1 }}>Booking Spread Complete</div>
                  <div style={{ fontSize: 15, color: theme.color.text2, marginBottom: 32, lineHeight: 1.5 }}>
                    {message}
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <AnimatedButton onClick={() => {
                      setMessage("");
                      setShowSlotModal(false);
                      setCurrentStep(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: theme.color.gold, color: theme.color.charcoal900, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: theme.shadow.gold, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                      View Cart & Checkout <ChevronRight size={18} />
                    </AnimatedButton>
                    <button onClick={() => {
                      setMessage("");
                    }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${theme.color.border}`, background: "transparent", color: theme.color.text2, fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all 0.2s" }}>
                      Continue Scheduling
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* EDIT CART ITEM MODAL */}
            {editCartItem && (
              <div className="qs" style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,10,10,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn 0.2s ease-out" }}>
                <div style={{ background: theme.color.surface, borderRadius: 24, width: "100%", maxWidth: 400, padding: "clamp(20px, 5vw, 32px)", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", border: `1px solid ${theme.color.border2}` }}>
                  <button onClick={() => setEditCartItem(null)} style={{ position: "absolute", top: 16, right: 16, background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: "50%", padding: 10, cursor: "pointer", color: theme.color.text1 }}>
                    <X size={18} />
                  </button>
                  <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8, color: theme.color.text1 }}>Edit Slot Time</div>
                  <div style={{ fontSize: 14, color: theme.color.text3, marginBottom: 24 }}>For {editCartItem.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
                  
                  <div style={{ display: "flex", gap: 12, marginBottom: 32, alignItems: "center", justifyContent: "center" }}>
                    <select 
                      value={editHour % 12 === 0 ? 12 : editHour % 12} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        const isPM = editHour >= 12;
                        setEditHour((val === 12 ? 0 : val) + (isPM ? 12 : 0));
                      }} 
                      style={{ ...inputStyle, padding: "12px", fontSize: 18, fontWeight: 800, textAlign: "center", width: 80 }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span style={{ fontSize: 20, fontWeight: 800, color: theme.color.text2 }}>:</span>
                    <select value={editMinute} onChange={e => setEditMinute(Number(e.target.value))} style={{ ...inputStyle, padding: "12px", fontSize: 18, fontWeight: 800, textAlign: "center", width: 80 }}>
                      {Array.from({length: 60}).map((_, m) => <option key={m} value={m}>{pad(m)}</option>)}
                    </select>
                    <select 
                      value={editHour < 12 ? 'AM' : 'PM'} 
                      onChange={e => {
                        if (e.target.value === 'PM' && editHour < 12) setEditHour(editHour + 12);
                        if (e.target.value === 'AM' && editHour >= 12) setEditHour(editHour - 12);
                      }} 
                      style={{ ...inputStyle, padding: "12px", fontSize: 18, fontWeight: 800, textAlign: "center", width: 80, marginLeft: 8 }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  
                  <AnimatedButton onClick={saveCartEdit} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: theme.color.gold, color: theme.color.charcoal900, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: theme.shadow.gold }}>
                    Save New Time
                  </AnimatedButton>
                </div>
              </div>
            )}
          </Portal>



        </div>
      </PageTransition>
    </DashboardLayout>
  );
}

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.color.border}`, fontSize: 14, boxSizing: "border-box" as const, background: theme.color.surface, color: theme.color.text1 };
const iconBtnStyle = { background: "none", border: `1px solid ${theme.color.border}`, borderRadius: 10, padding: 6, cursor: "pointer", display: "flex" };
const stepBtnStyle = { width: 30, height: 30, borderRadius: 8, border: `1px solid ${theme.color.border}`, background: theme.color.surface, color: theme.color.text1, fontSize: 18, lineHeight: 1, cursor: "pointer" };

function Dot({ color }: { color: string }) {
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />;
}
