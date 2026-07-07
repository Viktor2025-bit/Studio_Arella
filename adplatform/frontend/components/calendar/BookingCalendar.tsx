'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './BookingCalendar.module.css';
import api from '@/lib/api';
import { FaArrowRight, FaCalendarDays, FaLocationDot } from 'react-icons/fa6';
import { ChevronLeft, ChevronRight, Monitor, Mic } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

const F = theme.font.body;

const locales = { 'en-NG': require('date-fns/locale/en-GB') };
const localizer = dateFnsLocalizer({
  format, parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay, locales,
});

interface CalEvent {
  id: string; title: string; start: Date; end: Date;
  resource: { type: string; status: string; screen?: string; cost?: number; bookingNumber?: string; };
}

const statusColors: Record<string, string> = {
  active: theme.color.success, paused: theme.color.gold,
  ended: theme.color.text4, cancelled: theme.color.error,
};

const CustomToolbar = (toolbar: any) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');

  const label = () => {
    const date = format(toolbar.date, 'MMMM yyyy');
    return <span style={{ fontSize: 16, fontWeight: 800, color: theme.color.text1, letterSpacing: '-0.3px' }}>{date}</span>;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <button onClick={goToCurrent} style={{ padding: '8px 16px', background: theme.color.surface2, color: theme.color.text2, border: `1px solid ${theme.color.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.background = theme.color.goldLight; e.currentTarget.style.color = theme.color.goldDark; e.currentTarget.style.borderColor = theme.color.goldMid; }}
          onMouseOut={e => { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.color = theme.color.text2; e.currentTarget.style.borderColor = theme.color.border; }}>
          Today
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={goToBack} style={{ padding: '6px', background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', color: theme.color.text2, transition: 'all 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.background = theme.color.surface; e.currentTarget.style.color = theme.color.text1; }}
          onMouseOut={e => { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.color = theme.color.text2; }}>
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        
        {label()}

        <button onClick={goToNext} style={{ padding: '6px', background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', color: theme.color.text2, transition: 'all 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.background = theme.color.surface; e.currentTarget.style.color = theme.color.text1; }}
          onMouseOut={e => { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.color = theme.color.text2; }}>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ display: 'flex', background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: 8, padding: 3 }}>
        {['month', 'week', 'day', 'agenda'].map(v => (
          <button
            key={v}
            onClick={() => toolbar.onView(v)}
            style={{
              padding: '6px 14px', background: toolbar.view === v ? theme.color.surface : 'transparent',
              color: toolbar.view === v ? theme.color.text1 : theme.color.text3,
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: toolbar.view === v ? theme.shadow.sm : 'none',
              textTransform: 'capitalize', transition: 'all 0.15s'
            }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

const CustomEvent = ({ event }: { event: CalEvent }) => {
  const isPodcast = event.resource.type === 'podcast';
  const Icon = isPodcast ? Mic : Monitor;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px', height: '100%' }}>
      <Icon size={12} style={{ opacity: 0.85, flexShrink: 0 }} />
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
        {event.title}
      </span>
    </div>
  );
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
      const [adRes, podRes] = await Promise.all([
        api.get(url),
        !screenId ? api.get('/podcasts/my-bookings').catch(() => ({ data: { bookings: [] } })) : Promise.resolve({ data: { bookings: [] } })
      ]);

      const adMapped: CalEvent[] = (adRes.data.bookings || [])
        .filter((b: any) => b.start_time && b.end_time)
        .map((b: any) => ({
          id: b.id,
          title: (b.creative_title || b.campaign_name || b.booking_number) + (b.screen_name ? ` · ${b.screen_name}` : ''),
          start: new Date(b.start_time),
          end: new Date(b.end_time),
          resource: { type: 'ad', status: b.status, screen: b.screen_name, cost: b.total_cost, bookingNumber: b.booking_number },
        }));

      const podMapped: CalEvent[] = (podRes.data.bookings || [])
        .filter((b: any) => b.start_time && b.end_time)
        .map((b: any) => ({
          id: b.id,
          title: (b.package_type || 'Podcast Session') + ' · Podcast Studio',
          start: new Date(b.start_time),
          end: new Date(b.end_time),
          resource: { type: 'podcast', status: b.status, screen: 'Podcast Studio', cost: b.total_cost, bookingNumber: b.booking_number },
        }));

      setEvents([...adMapped, ...podMapped]);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, [screenId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div className={styles.calendar} style={{ fontFamily: F }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(statusColors).map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
            <span style={{ fontSize: 11, color: theme.color.text3, fontWeight: 600, textTransform: 'capitalize' }}>Ad {s}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: '#8B5CF6' }} />
          <span style={{ fontSize: 11, color: theme.color.text3, fontWeight: 600 }}>Podcast Session</span>
        </div>
        <span style={{ fontSize: 11, color: theme.color.text4, marginLeft: 'auto' }}>{events.length} bookings shown</span>
      </div>

      {loading ? (
        <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, border: `2.5px solid ${theme.color.goldMid}`, borderTopColor: theme.color.gold, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : (
        <Calendar
          localizer={localizer} events={events}
          startAccessor="start" endAccessor="end"
          style={{ height: 500 }}
          view={view} onView={setView} date={date} onNavigate={setDate}
          selectable
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent
          }}
          onSelectSlot={(slotInfo) => {
            const iso = format(slotInfo.start, 'yyyy-MM-dd');
            router.push(`/book?date=${iso}`);
          }}
          eventPropGetter={e => {
            const isPodcast = (e as CalEvent).resource.type === 'podcast';
            const baseColor = isPodcast ? '#8B5CF6' : (statusColors[(e as CalEvent).resource.status] || theme.color.gold);
            return {
              style: { 
                background: baseColor, 
                border: '1px solid rgba(0,0,0,0.1)', 
                borderRadius: 6, 
                color: isPodcast ? '#fff' : theme.color.charcoal900, 
                fontSize: 11, 
                fontWeight: 800, 
                opacity: (e as CalEvent).resource.status === 'cancelled' ? 0.4 : 1,
                boxShadow: theme.shadow.sm,
              }
            };
          }}
          onSelectEvent={e => setSelected(e as CalEvent)}
          popup
        />
      )}

      {/* Event detail */}
      <AnimatePresence>
        {selected && (
          <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
            style={{ marginTop: 16, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 14, padding: 20, boxShadow: theme.shadow.md }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaCalendarDays size={14} color={theme.color.gold} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1 }}>{selected.resource.bookingNumber}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: selected.resource.type === 'podcast' ? '#8B5CF6' : (statusColors[selected.resource.status] || theme.color.gold), padding: '2px 9px', borderRadius: 100, textTransform: 'capitalize' }}>
                    {selected.resource.type === 'podcast' ? `Podcast ${selected.resource.status}` : selected.resource.status}
                  </span>
                </div>
                {selected.resource.screen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <FaLocationDot size={12} color={theme.color.text3} />
                    <span style={{ fontSize: 13, color: theme.color.text2 }}>{selected.resource.screen}</span>
                  </div>
                )}
                <p style={{ fontSize: 12, color: theme.color.text3, margin: '4px 0 0' }}>
                  {format(selected.start, 'dd MMM yyyy, h:mm a')} → {format(selected.end, 'dd MMM yyyy, h:mm a')}
                </p>
                {selected.resource.cost !== undefined && (
                  <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.gold, margin: '8px 0 0' }}>₦{Number(selected.resource.cost).toLocaleString()} total</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/bookings" style={{ display: 'flex', alignItems: 'center', gap: 5, background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, color: theme.color.goldDark, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  View <FaArrowRight size={10} />
                </Link>
                <button onClick={() => setSelected(null)} style={{ background: theme.color.surface2, border: `1px solid ${theme.color.border}`, color: theme.color.text2, padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: F, fontWeight: 600 }}>
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
