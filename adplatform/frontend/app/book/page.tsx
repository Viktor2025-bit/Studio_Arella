'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isBefore, startOfDay, addMinutes, setHours, setMinutes, startOfMonth, endOfMonth, addDays } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, AnimatedButton } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { FaLocationDot, FaCheck, FaTrash, FaClock, FaCalendarDays, FaDisplay, FaFilm, FaChevronLeft, FaWallet, FaCreditCard, FaArrowRight, FaImage } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

const F = "'Quicksand', sans-serif";
const SCREEN_ID = '00000000-0000-0000-0000-000000000001';

const locales = { 'en-NG': require('date-fns/locale/en-GB') };
const localizer = dateFnsLocalizer({
  format, parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay, locales,
});

interface CartBlock { start: Date; end: Date; mins: number; }
interface Creative {
  id: string; title: string; file_type: string;
  file_url: string; status: string;
  duration_seconds: number;
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
};

const STEPS = [
  { n: 1, label: 'Select creative' },
  { n: 2, label: 'Schedule & Cart' },
  { n: 3, label: 'Review & pay' },
];

export default function BookPage() {
  return (
    <Suspense fallback={<div />}>
      <BookPageContent />
    </Suspense>
  );
}

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [approvedCreatives, setApprovedCreatives] = useState<Creative[]>([]);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  
  const initDateParam = searchParams?.get('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (initDateParam) {
      const d = new Date(initDateParam);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [cart, setCart] = useState<CartBlock[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{start_time: string, end_time: string}[]>([]);
  const [durationMins, setDurationMins] = useState('1');
  const [durationSecs, setDurationSecs] = useState('0');
  const [recurrence, setRecurrence] = useState('none');
  const [recurrenceCount, setRecurrenceCount] = useState('1');
  const [showInvoice, setShowInvoice] = useState(false);

  const [paying, setPaying] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [calView, setCalView] = useState<View>('month');
  const [calDate, setCalDate] = useState(() => selectedDate || new Date());

  
  const allBooked = useMemo(() => {
    return [
      ...bookedSlots,
      ...cart.map(c => ({
        start_time: c.start.toISOString(),
        end_time: c.end.toISOString()
      }))
    ];
  }, [bookedSlots, cart]);

  useEffect(() => {
    const fetchSlots = () => {
      const s = startOfMonth(calDate).toISOString();
      const e = endOfMonth(calDate).toISOString();
      api.get(`/bookings/slots?screen_id=${SCREEN_ID}&start_date=${s}&end_date=${e}`)
        .then(res => setBookedSlots(res.data.slots || []))
        .catch(console.error);
    };
    
    fetchSlots();
    const interval = setInterval(fetchSlots, 5000);
    return () => clearInterval(interval);
  }, [calDate]);

  useEffect(() => {
    api.get('/ads').then((a) => {
      const approved = (a.data.ads || []).filter((ad: any) => ad.status === 'approved');
      setApprovedCreatives(approved);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCreative && selectedCreative.duration_seconds) {
      setDurationMins(Math.floor(selectedCreative.duration_seconds / 60).toString());
      setDurationSecs((selectedCreative.duration_seconds % 60).toString());
      setRecurrence('none');
    }
  }, [selectedCreative]);
  
  const handleAddToCart = () => {
    if (!selectedDate) return;
    const hour = parseInt(startHour);
    const minute = parseInt(startMinute);
    
    let blocks: CartBlock[] = [];
    const startDt = setMinutes(setHours(new Date(selectedDate), hour), minute);

    if (hour < 6 || hour >= 20) {
      toast('Operating hours are between 6:00 AM and 8:00 PM', 'error');
      return;
    }
    
    if (isBefore(startDt, new Date())) {
      toast('Cannot book a time in the past', 'error');
      return;
    }

    let endDt = new Date(startDt);
    const dMins = parseInt(durationMins || '0');
    const dSecs = parseInt(durationSecs || '0');
    let totalSecs = dMins * 60 + dSecs;

    if (totalSecs <= 0) {
      toast('Duration must be greater than 0', 'error');
      return;
    }

    const val = parseInt(recurrenceCount || '1');
    const reps = recurrence === 'daily' ? val : recurrence === 'weekly' ? val * 7 : recurrence === 'monthly' ? val * 30 : 1;

    for (let i = 0; i < reps; i++) {
       const blockStartDt = addDays(startDt, i);
       const blockEndDt = new Date(blockStartDt.getTime() + totalSecs * 1000);
       
       if (blockEndDt.getHours() >= 20 && (blockEndDt.getHours() > 20 || blockEndDt.getMinutes() > 0 || blockEndDt.getSeconds() > 0)) {
         toast('Booking extends beyond operating hours (8 PM)', 'error');
         return;
       }
       blocks.push({ start: blockStartDt, end: blockEndDt, mins: totalSecs / 60 });
    }

    const hasConflict = blocks.some(b => {
      return allBooked.some(booked => {
        const bookedStart = new Date(booked.start_time).getTime();
        const bookedEnd = new Date(booked.end_time).getTime();
        const bStart = b.start.getTime();
        const bEnd = b.end.getTime();
        return bStart < bookedEnd && bEnd > bookedStart;
      });
    });

    if (hasConflict) {
      toast('This time slot is already booked by someone else!', 'error');
      return;
    }

    setCart(prev => [...prev, ...blocks]);
    toast('Added to cart', 'success');
  };

  const removeCartItem = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const costPerMinute = 1000;
  const cartTotalSeconds = cart.reduce((acc, c) => acc + (c.end.getTime() - c.start.getTime()) / 1000, 0);
  const totalCost = Math.round(cartTotalSeconds * (1000 / 60));

  const handleReserve = async () => {
    if (cart.length === 0 || !selectedCreative) return;
    setReserving(true);
    try {
      const res = await api.post('/bookings/reserve', {
        screen_id: SCREEN_ID,
        ad_id: selectedCreative.id,
        slots: cart.map(b => ({ start: b.start.toISOString(), end: b.end.toISOString(), mins: b.mins }))
      });
      setBookingId(res.data.booking_id);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const formatAmPm = (h: string, m: string) => {
    const n = parseInt(h);
    const suffix = n < 12 ? 'AM' : 'PM';
    const h12 = n === 0 ? 12 : n > 12 ? n - 12 : n;
    return `${h12}:${m} ${suffix}`;
  };

  const hours = Array.from({ length: 15 }, (_, i) => String(i + 6).padStart(2, '0')); // 06 – 20
  const mins = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const toAmPm = (h: string) => {
    const n = parseInt(h);
    if (n === 0)  return '12:00 AM';
    if (n < 12)   return `${n}:00 AM`;
    if (n === 12) return '12:00 PM';
    return `${n - 12}:00 PM`;
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, maxWidth: 960, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FaCalendarDays size={17} color="#D4AF37" />
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', margin: 0, letterSpacing: '-0.3px' }}>
                Book Ad Slot — Studio Arella
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <FaLocationDot size={12} color="#D4AF37" />
              <span style={{ fontSize: 13, color: '#94A3B8' }}>Bems Junction, Finbars by Bende Road, Umuahia · ₦1,000/minute</span>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, flexWrap: 'wrap', rowGap: 12 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <motion.div animate={{ scale: step === s.n ? 1.1 : 1 }}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: step > s.n ? '#22c55e' : step === s.n ? '#D4AF37' : '#F3F4F6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                      color: step >= s.n  ? '#111111' : '#94A3B8',
                      border: step === s.n ? '2.5px solid rgba(212,175,55,0.3)' : '2px solid transparent',
                      cursor: step > s.n ? 'pointer' : 'default',
                    }}
                    onClick={() => { if (step > s.n) setStep(s.n as any); }}
                  >
                    {step > s.n ? <FaCheck size={11} /> : s.n}
                  </motion.div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: step === s.n ? '#1A1A1A' : step > s.n ? '#22c55e' : '#94A3B8', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 32, height: 1, background: step > s.n ? '#22c55e' : '#E5E7EB', margin: '0 10px' }} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ══ STEP 1: Select Creative ══ */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div style={{ ...card, padding: 24 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', color: '#1A1A1A' }}>Choose an approved ad to schedule</p>
                  {approvedCreatives.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <FaFilm size={24} color="#CBD5E1" style={{ marginBottom: 12 }} />
                      <p style={{ fontSize: 13, color: '#64748B' }}>You have no approved ads yet.</p>
                      <button onClick={() => router.push('/ads')} style={{ marginTop: 12, background: '#D4AF37', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                        Upload Ad
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {approvedCreatives.map(c => {
                        const isSelected = selectedCreative?.id === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCreative(c)}
                            style={{
                              border: isSelected ? '2px solid #D4AF37' : '1px solid #E2E8F0',
                              borderRadius: 12, padding: 16, cursor: 'pointer',
                              background: isSelected ? '#F9F6EA' : '#fff',
                              display: 'flex', gap: 12, alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {(c.file_type || c.media_type || '').includes('video') ? <FaFilm color="#94A3B8" /> : <FaImage color="#94A3B8" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</p>
                              <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Duration: {c.duration_seconds || 60} sec</p>
                            </div>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: isSelected ? '5px solid #D4AF37' : '2px solid #CBD5E1' }} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    <AnimatedButton
                      onClick={() => setStep(2)}
                      disabled={!selectedCreative}
                      style={{ background: selectedCreative ? '#1A1A1A' : '#E2E8F0', color: selectedCreative ? '#fff' : '#94A3B8', padding: '12px 24px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: selectedCreative ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      Next Step <FaArrowRight size={12} />
                    </AnimatedButton>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ STEP 2: Schedule & Cart ══ */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                
                {/* Info Bar */}
                <div style={{ ...card, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 2px' }}>Selected Ad</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{selectedCreative?.title} ({selectedCreative?.duration_seconds || 60}s)</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 2px' }}>Cost per Minute</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: '#D4AF37', margin: 0 }}>₦{costPerMinute.toLocaleString()}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
                  
                  {/* Left: Picker */}
                  <div style={{ ...card, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#1A1A1A' }}>1. Pick a Date</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#22C55E' }}/> Available</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B' }}/> Partially Booked</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444' }}/> Fully Booked</span>
                      </div>
                    </div>
                    <style>{`
                      .rbc-calendar { background: transparent; color: #1A1A1A; border: none; font-family: ${F}; }
                      .rbc-toolbar { padding: 0 0 14px; flex-wrap: wrap; gap: 8px; }
                      .rbc-toolbar button { background: #F8FAFC; border: 1px solid #E2E8F0; color: #64748B; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }
                      .rbc-toolbar button:hover { background: #F9F6EA; color: #D4AF37; border-color: #E3C762; }
                      .rbc-toolbar button.rbc-active { background: #D4AF37; color: #fff; border-color: #D4AF37; }
                      .rbc-month-view { border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; background: #fff; }
                      .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row { border-color: #F1F5F9; }
                      .rbc-header { padding: 8px 0; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #94A3B8; border-bottom: 1px solid #F1F5F9; }
                      .rbc-date-cell { padding: 4px; font-size: 12px; font-weight: 600; }
                      .rbc-off-range-bg { background: #F8FAFC; }
                    `}</style>
                    <div style={{ height: 340, marginBottom: 24 }}>
                      <Calendar
                        localizer={localizer}
                        events={[]}
                        startAccessor="start"
                        endAccessor="end"
                        views={['month']}
                        view={calView}
                        onView={setCalView}
                        date={calDate}
                        onNavigate={setCalDate}
                        selectable
                        onSelectSlot={({ start }) => {
                           if (isBefore(startOfDay(start), startOfDay(new Date()))) {
                             toast('Cannot select past dates', 'error'); return;
                           }
                           setSelectedDate(start);
                        }}
                        dayPropGetter={(d) => {
                          if (selectedDate && startOfDay(d).getTime() === startOfDay(selectedDate).getTime()) {
                            return { style: { background: 'rgba(212,175,55,0.2)', border: '2px solid #D4AF37' } };
                          }
                          
                          // Calculate total booked minutes for this specific day
                          const dStart = startOfDay(d).getTime();
                          let bookedMinutes = 0;
                          allBooked.forEach(b => {
                            const bStart = new Date(b.start_time);
                            const bEnd = new Date(b.end_time);
                            if (startOfDay(bStart).getTime() === dStart) {
                               bookedMinutes += (bEnd.getTime() - bStart.getTime()) / 60000;
                            }
                          });

                          // 14 hours * 60 = 840 minutes is the maximum operating time
                          if (bookedMinutes >= 840) {
                            return { style: { background: 'rgba(239,68,68,0.15)', borderBottom: '3px solid #EF4444' } }; // Red for fully booked
                          } else if (bookedMinutes > 0) {
                            return { style: { background: 'rgba(245,158,11,0.1)', borderBottom: '3px solid #F59E0B' } }; // Orange for partially booked
                          } else {
                            // Green for fully available
                            return { style: { background: 'rgba(34,197,94,0.05)', borderBottom: '3px solid #22C55E' } };
                          }
                        }}
                      />
                    </div>

                    {/* Daily Availability Timeline */}
                    {(() => {
                      if (!selectedDate) return null;
                      const dayBookings = allBooked.filter(b => startOfDay(new Date(b.start_time)).getTime() === startOfDay(selectedDate).getTime());
                      dayBookings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                      const startOfOp = setHours(startOfDay(selectedDate), 6).getTime();
                      const endOfOp = setHours(startOfDay(selectedDate), 20).getTime();

                      const availableBlocks: {start: number, end: number}[] = [];
                      let currentStart = startOfOp;

                      dayBookings.forEach(b => {
                        const bStart = new Date(b.start_time).getTime();
                        const bEnd = new Date(b.end_time).getTime();
                        
                        if (bStart > currentStart) {
                          availableBlocks.push({ start: currentStart, end: bStart });
                        }
                        if (bEnd > currentStart) {
                          currentStart = bEnd;
                        }
                      });

                      if (currentStart < endOfOp) {
                        availableBlocks.push({ start: currentStart, end: endOfOp });
                      }

                      return (
                        <div style={{ marginBottom: 24, padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', margin: '0 0 12px' }}>
                            Available Times on {format(selectedDate, 'MMM d, yyyy')}
                          </p>
                          {availableBlocks.length === 0 ? (
                            <p style={{ fontSize: 14, color: '#EF4444', fontWeight: 700, margin: 0 }}>Fully Booked</p>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {availableBlocks.map((blk, i) => (
                                <div key={i} style={{ background: '#E2E8F0', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                                  {format(new Date(blk.start), 'hh:mm a')} - {format(new Date(blk.end), 'hh:mm a')}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', color: '#1A1A1A' }}>2. Pick a Time & Add</p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      
                      <div style={{ flex: '0 0 100px' }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>HOUR</label>
                        <select
                          value={startHour} onChange={e => setStartHour(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: F, fontWeight: 600, outline: 'none', boxSizing: 'border-box', height: 42 }}
                        >
                          {hours.map(h => <option key={h} value={h}>{toAmPm(h)}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: '0 0 100px' }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>MINUTE</label>
                        <select
                          value={startMinute} onChange={e => setStartMinute(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: F, fontWeight: 600, outline: 'none', boxSizing: 'border-box', height: 42 }}
                        >
                          {mins.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      
                      <div style={{ flex: '0 0 110px', position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>DURATION</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '0 8px', height: 42, boxSizing: 'border-box' }}>
                          <input
                            type="number" min="0" max="1440"
                            value={durationMins} onChange={e => setDurationMins(e.target.value)}
                            style={{ width: '36px', padding: '0', border: 'none', fontSize: 14, fontFamily: F, fontWeight: 600, outline: 'none', textAlign: 'center', background: 'transparent' }}
                            placeholder="0"
                          />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>m</span>
                          <input
                            type="number" min="0" max="59"
                            value={durationSecs} onChange={e => setDurationSecs(e.target.value)}
                            style={{ width: '36px', padding: '0', border: 'none', fontSize: 14, fontFamily: F, fontWeight: 600, outline: 'none', textAlign: 'center', background: 'transparent' }}
                            placeholder="0"
                          />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>s</span>
                        </div>
                        {selectedCreative?.duration_seconds && (
                          <div style={{ position: 'absolute', bottom: -20, left: 4, fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                            ~ {Math.floor(((parseInt(durationMins || '0') * 60) + parseInt(durationSecs || '0')) / selectedCreative.duration_seconds)} loop(s)
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>REPEAT</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select
                            value={recurrenceCount} onChange={e => setRecurrenceCount(e.target.value)}
                            disabled={recurrence === 'none'}
                            style={{ width: '60px', padding: '10px 4px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: F, fontWeight: 600, outline: 'none', boxSizing: 'border-box', height: 42, background: recurrence === 'none' ? '#F1F5F9' : '#fff' }}
                          >
                            {Array.from({ length: recurrence === 'daily' ? 31 : recurrence === 'weekly' ? 4 : 12 }, (_, i) => i + 1).map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <select
                            value={recurrence} onChange={e => { setRecurrence(e.target.value); setRecurrenceCount('1'); }}
                            style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: F, fontWeight: 600, outline: 'none', boxSizing: 'border-box', height: 42 }}
                          >
                            <option value="none">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>
                      <AnimatedButton
                        onClick={handleAddToCart}
                        style={{ padding: '0 24px', background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42, marginTop: 19 }}
                      >
                        Add
                      </AnimatedButton>
                    </div>

                  </div>

                  {/* Right: Cart */}
                  <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#1A1A1A' }}>Your Cart</p>
                      <span style={{ background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{cart.length} blocks</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 400, paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                          <FaClock size={24} style={{ marginBottom: 12, opacity: 0.5 }} />
                          <p style={{ fontSize: 13, margin: 0 }}>Cart is empty.<br/>Select a date and time to add slots.</p>
                        </div>
                      ) : (
                        cart.map((d, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px' }}>{format(d.start, 'MMM d, yyyy')}</p>
                              <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>{format(d.start, 'h:mm a')} - {format(d.end, 'h:mm a')} ({Math.floor(d.mins)}m {Math.round((d.mins % 1) * 60)}s)</p>
                            </div>
                            <button onClick={() => removeCartItem(i)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}>
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>Total</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>₦{totalCost.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setStep(1)} style={{ padding: '12px', background: '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#64748B' }}>
                          <FaChevronLeft />
                        </button>
                        <AnimatedButton
                          disabled={cart.length === 0 || reserving}
                          onClick={handleReserve}
                          style={{ flex: 1, padding: '12px', background: cart.length > 0 ? '#1A1A1A' : '#E2E8F0', color: cart.length > 0 ? '#fff' : '#94A3B8', border: 'none', borderRadius: 8, fontWeight: 700, cursor: cart.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                        >
                          {reserving ? 'Reserving...' : 'Reserve Slots'}
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ══ STEP 3: Review & Pay ══ */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div style={{ ...card, padding: 32, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F9F6EA', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <FaCheck size={28} />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px' }}>Booking Invoice</h2>
                  <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.5 }}>
                    Your slots are locked for 5 minutes. Please review your invoice and complete payment.
                  </p>
                  
                  <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 12, marginBottom: 24, textAlign: 'left', border: '1px solid #E2E8F0' }}>
                    <div style={{ borderBottom: '1px dashed #CBD5E1', paddingBottom: 16, marginBottom: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Invoice Details</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>Ad Creative</span>
                        <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 700 }}>{selectedCreative?.title || 'Unknown Ad'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>Total Slots Booked</span>
                        <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 700 }}>{cart.length} slots</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>Total Screen Time</span>
                        <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 700 }}>
                          {Math.floor(cartTotalSeconds / 60)} mins {Math.round(cartTotalSeconds % 60)} secs
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>Rate</span>
                        <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 700 }}>₦1,000 / 60s</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, color: '#1A1A1A', fontWeight: 800 }}>Total Amount Due</span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#D4AF37' }}>₦{totalCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <AnimatedButton
                      onClick={() => handlePay('wallet')}
                      disabled={paying}
                      style={{ background: '#1A1A1A', color: '#fff', border: 'none', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <FaWallet size={16} /> Pay from Wallet
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => handlePay('monnify')}
                      disabled={paying}
                      style={{ background: '#F9F6EA', color: '#D4AF37', border: '2px solid #D4AF37', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <FaCreditCard size={16} /> Pay with Card / Bank
                    </AnimatedButton>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
