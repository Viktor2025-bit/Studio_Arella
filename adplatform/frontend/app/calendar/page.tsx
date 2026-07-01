'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import BookingCalendar from '@/components/calendar/BookingCalendar';
import { PageTransition } from '@/components/ui/Animations';
import { FaCalendarDays, FaCircleInfo } from 'react-icons/fa6';
import Link from 'next/link';

const F = "'Quicksand', sans-serif";

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <FaCalendarDays size={18} color="#D4AF37" />
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.3px' }}>Booking Calendar</h1>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Visual overview of all your screen bookings. Click any event for details.
              </p>
            </div>
            <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              + Book New Slot
            </Link>
          </div>

          <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <FaCircleInfo size={14} color="#D4AF37" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 600, margin: '0 0 2px' }}>How to use the calendar</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
                Switch between Month, Week, and Day views using the toolbar. Each coloured block is a booking.
                Green = active, amber = paused, grey = ended, red = cancelled. Click any event to see details.
              </p>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24 }}>
            <BookingCalendar />
          </div>

        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
