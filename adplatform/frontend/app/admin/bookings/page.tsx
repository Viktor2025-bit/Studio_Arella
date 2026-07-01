'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { CalendarCheck } from 'lucide-react';
import { Search } from 'lucide-react';

const F = "'Quicksand', sans-serif";
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' } as React.CSSProperties;

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/bookings?limit=100')
      .then(r => setBookings(r.data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(b =>
    b.booking_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.screen_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <CalendarCheck size={18} color="#D4AF37" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>All Bookings</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{bookings.length} total bookings on the platform</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, color: '#1A1A1A', fontSize: 13, outline: 'none', fontFamily: F, boxSizing: 'border-box' }} />
        </div>

        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid 1px solid #E2E8F0' }}>
                {['Booking #', 'Advertiser', 'Screen', 'Total Cost', 'Start', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #FAFAFA' }}>
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><Skeleton height={12} width={80} /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>No bookings found</td></tr>
              ) : filtered.map(b => (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderTop: '1px solid #FAFAFA' }} whileHover={{ background: '#FAFAFA' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1A1A1A' }}>{b.booking_number}</td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>{b.user_name || b.user_email || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>{b.screen_name || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#22c55e', fontWeight: 600 }}>₦{Number(b.total_cost || 0).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>{b.start_time ? new Date(b.start_time).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={b.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
