'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '@/lib/api';
import { FaArrowRight, FaCalendarDays, FaLocationDot } from 'react-icons/fa6';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const F = "'Quicksand', sans-serif";

const locales = { 'en-NG': require('date-fns/locale/en-GB') };
const localizer = dateFnsLocalizer({
  format, parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay, locales,
});

interface CalEvent {
  id: string; title: string; start: Date; end: Date;
  resource: { status: string; screen?: string; cost?: number; bookingNumber?: string; };
}

const statusColors: Record<string, string> = {
  active: '#22c55e', paused: '#D4AF37',
  ended: '#94A3B8', cancelled: '#EF4444',
};

export default function BookingCalendar({ screenId }: { screenId?: string }) {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchBookings = useCallback(async () => {
    try {
      const url = screenId ? `/bookings?screen_id=${screenId}` : '/bookings?limit=100';
      const res = await api.get(url);
      const mapped: CalEvent[] = (res.data.bookings || [])
        .filter((b: any) => b.start_time && b.end_time)
        .map((b: any) => ({
          id: b.id,
          title: b.booking_number + (b.screen_name ? ` · ${b.screen_name}` : ''),
          start: new Date(b.start_time),
          end: new Date(b.end_time),
          resource: { status: b.status, screen: b.screen_name, cost: b.total_cost, bookingNumber: b.booking_number },
        }));
      setEvents(mapped);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, [screenId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div style={{ fontFamily: F }}>
      <style>{`
        .rbc-calendar { background: transparent; color: #1A1A1A; border: none; font-family: ${F}; }
        .rbc-toolbar { padding: 0 0 16px; flex-wrap: wrap; gap: 8px; }
        .rbc-toolbar button { background: #F8FAFC; border: 1px solid #E2E8F0; color: #64748B; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-family: ${F}; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .rbc-toolbar button:hover { background: #F9F6EA; color: #D4AF37; border-color: #E3C762; }
        .rbc-toolbar button.rbc-active { background: #D4AF37; color: #fff; border-color: #D4AF37; }
        .rbc-toolbar-label { font-size: 15px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.3px; }
        .rbc-header { background: #FAFAFA; border-bottom: 1px solid #F3F4F6; color: #94A3B8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; padding: 9px 0; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #F3F4F6; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #F3F4F6; }
        .rbc-off-range-bg { background: #FAFAFA; }
        .rbc-today { background: #F9F6EA; }
        .rbc-date-cell { color: #64748B; font-size: 12px; padding: 5px 7px; }
        .rbc-date-cell.rbc-now a { color: #D4AF37; font-weight: 800; }
        .rbc-show-more { color: #D4AF37; font-size: 11px; font-weight: 700; background: none; border: none; cursor: pointer; }
        .rbc-time-content { border-top: 1px solid #E2E8F0; }
        .rbc-timeslot-group { border-bottom: 1px solid #F8FAFC; }
        .rbc-time-gutter .rbc-label { color: #CBD5E1; font-size: 10px; }
        .rbc-current-time-indicator { background: #D4AF37; }
        .rbc-agenda-view table.rbc-agenda-table { border: 1px solid #E2E8F0; }
        .rbc-agenda-view table.rbc-agenda-table thead > tr > th { border-bottom: 1px solid #E2E8F0; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
        .rbc-agenda-view table.rbc-agenda-table tbody > tr > td { border-top: 1px solid #F3F4F6; color: #64748B; font-size: 12px; }
        .rbc-agenda-event-cell { color: #1A1A1A; font-weight: 600; }
        .rbc-event { border-radius: 5px !important; font-size: 11px !important; font-weight: 700 !important; }
        .rbc-day-bg:hover { background: #F9F6EA !important; }
      `}</style>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(statusColors).map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'capitalize' }}>{s}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: '#CBD5E1', marginLeft: 'auto' }}>{events.length} bookings shown</span>
      </div>

      {loading ? (
        <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, border: '2.5px solid #E3C762', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <Calendar
          localizer={localizer} events={events}
          startAccessor="start" endAccessor="end"
          style={{ height: 500 }}
          view={view} onView={setView} date={date} onNavigate={setDate}
          selectable
          onSelectSlot={(slotInfo) => {
            const iso = format(slotInfo.start, 'yyyy-MM-dd');
            router.push(`/book?date=${iso}`);
          }}
          eventPropGetter={e => ({
            style: { background: statusColors[(e as CalEvent).resource.status] || '#D4AF37', border: 'none', borderRadius: 5, color: '#111111', fontSize: 11, fontWeight: 700, opacity: (e as CalEvent).resource.status === 'cancelled' ? 0.4 : 1 }
          })}
          onSelectEvent={e => setSelected(e as CalEvent)}
          popup
        />
      )}

      {/* Event detail */}
      <AnimatePresence>
        {selected && (
          <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
            style={{ marginTop: 16, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaCalendarDays size={14} color="#D4AF37" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>{selected.resource.bookingNumber}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: statusColors[selected.resource.status] || '#D4AF37', padding: '2px 9px', borderRadius: 100 }}>
                    {selected.resource.status}
                  </span>
                </div>
                {selected.resource.screen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <FaLocationDot size={12} color="#94A3B8" />
                    <span style={{ fontSize: 13, color: '#64748B' }}>{selected.resource.screen}</span>
                  </div>
                )}
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
                  {format(selected.start, 'dd MMM yyyy, h:mm a')} → {format(selected.end, 'dd MMM yyyy, h:mm a')}
                </p>
                {selected.resource.cost !== undefined && (
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#D4AF37', margin: '8px 0 0' }}>₦{Number(selected.resource.cost).toLocaleString()} total</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/bookings" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F9F6EA', border: '1px solid #E3C762', color: '#8F7212', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  View <FaArrowRight size={10} />
                </Link>
                <button onClick={() => setSelected(null)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: F, fontWeight: 600 }}>
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
