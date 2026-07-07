'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import BookingCalendar from '@/components/calendar/BookingCalendar';
import { PageTransition } from '@/components/ui/Animations';
import { FaCalendarDays, FaCircleInfo } from 'react-icons/fa6';
import Link from 'next/link';
import { theme } from '@/lib/theme';

const F = theme.font.body;

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <FaCalendarDays size={18} color={theme.color.gold} />
                <h1 style={{ fontFamily: theme.font.display, fontSize: 26, fontWeight: 600, color: theme.color.text1, margin: 0, letterSpacing: '-0.2px' }}>Booking Calendar</h1>
              </div>
              <p style={{ fontSize: 13, color: theme.color.text2, margin: 0 }}>
                Visual overview of all your screen and podcast bookings. Click any event for details.
              </p>
            </div>
            <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: theme.color.gold, color: theme.color.charcoal900, padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              + Book New Slot
            </Link>
          </div>

          <div style={{ background: 'rgba(224,165,38,0.07)', border: '1px solid rgba(224,165,38,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <FaCircleInfo size={14} color={theme.color.gold} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, color: theme.color.text1, fontWeight: 600, margin: '0 0 2px' }}>How to use the calendar</p>
              <p style={{ fontSize: 12, color: theme.color.text2, margin: 0, lineHeight: 1.6 }}>
                Switch between Month, Week, and Day views using the toolbar. Purple blocks represent podcast studio bookings. Other coloured blocks represent ad screen bookings (Green = active, amber = paused, grey = ended, red = cancelled). Click any event to see details.
              </p>
            </div>
          </div>

          <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, padding: "clamp(12px, 3vw, 24px)", overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: 800 }}>
              <BookingCalendar />
            </div>
          </div>

        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
