'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { CalendarCheck, Search } from 'lucide-react';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, overflow: 'hidden' } as React.CSSProperties;

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
            <CalendarCheck size={18} color={theme.color.gold} />
            <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>All Bookings</h1>
          </div>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>{bookings.length} total bookings on the platform</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.color.text3 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 10, color: theme.color.text1, fontSize: 13, outline: 'none', fontFamily: F, boxSizing: 'border-box' }} />
        </div>

        <div style={card}>
          <Table>
            <TableHead>
              {['Booking #', 'Advertiser', 'Screen', 'Total Cost', 'Start', 'Status'].map(h => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableHead>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><Skeleton height={12} width={80} /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: theme.color.text3 }}>No bookings found</td></tr>
              ) : filtered.map(b => (
                <TableRow key={b.id}>
                  <TableCell><span style={{ fontWeight: 700, color: theme.color.text1 }}>{b.booking_number}</span></TableCell>
                  <TableCell>{b.user_name || b.user_email || '—'}</TableCell>
                  <TableCell>{b.screen_name || '—'}</TableCell>
                  <TableCell><span style={{ color: theme.color.success, fontWeight: 700 }}>₦{Number(b.total_cost || 0).toLocaleString()}</span></TableCell>
                  <TableCell><span style={{ fontSize: 12 }}>{b.start_time ? new Date(b.start_time).toLocaleDateString() : '—'}</span></TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageTransition>
  );
}
