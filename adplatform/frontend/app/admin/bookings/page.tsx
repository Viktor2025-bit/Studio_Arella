'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { CalendarCheck, Search } from 'lucide-react';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm } as React.CSSProperties;

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
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: '8px', background: theme.color.goldLight, borderRadius: theme.radius.md, display: 'flex' }}>
              <CalendarCheck size={20} color={theme.color.goldDark} />
            </div>
            <h1 style={{ fontFamily: theme.font.display, fontSize: 26, fontWeight: 700, color: theme.color.text1, margin: 0, letterSpacing: '-0.02em' }}>All Bookings</h1>
            <button 
              onClick={() => {
                if(confirm('Are you absolutely sure you want to completely clear the database of all bookings and transactions?')) {
                  api.get('/nuke-db').then(() => {
                    alert('Database cleared successfully!');
                    window.location.reload();
                  }).catch((err: any) => alert('Error clearing database: ' + err.message));
                }
              }}
              style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
            >
              ⚠️ Clear Entire Database
            </button>
          </div>
          <p style={{ fontSize: 14, color: theme.color.text3, margin: 0 }}>{bookings.length} total bookings on the platform</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.color.text3 }} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search bookings..." 
            style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.md, color: theme.color.text1, fontSize: 14, outline: 'none', fontFamily: F, boxSizing: 'border-box', transition: 'all 0.2s ease', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} 
            onFocus={e => { e.currentTarget.style.borderColor = theme.color.gold; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.color.goldLight}` }} 
            onBlur={e => { e.currentTarget.style.borderColor = theme.color.border; e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
          />
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
