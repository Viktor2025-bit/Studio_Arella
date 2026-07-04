'use client';

import { useEffect, useState } from 'react';
import { Search, CalendarCheck } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import api from '@/lib/api';
import { Booking } from '@/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = filter !== 'all' ? `?status=${filter}` : '';
        const res = await api.get(`/bookings${params}`);
        setBookings(res.data.bookings || []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filter]);

  const filtered = bookings.filter((b) =>
    b.booking_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="space-y-4 font-body">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#211D17]">My Bookings</h1>
              <p className="text-sm text-[#A69C87] mt-0.5">{bookings.length} bookings total</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter buttons */}
              {['all', 'active', 'paused', 'ended'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    filter === f ? 'bg-charcoal-900 text-white' : 'bg-cream-surface text-[#57503F] hover:bg-cream-2'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-2.5 text-[#A69C87]" />
            <input
              type="text"
              placeholder="Search by booking #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-cream-surface border border-[#E8DFC8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <div className="bg-cream-surface border border-[#E8DFC8] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              {!loading && filtered.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={CalendarCheck} title="No bookings found" subtitle="Bookings you make will show up here." />
                </div>
              ) : (
                <Table>
                  <TableHead>
                    {['Booking #', 'Start Time', 'Screens', 'Impression', 'View', 'Interval', 'Cost', 'Total', 'Status'].map((h) => (
                      <TableHeaderCell key={h}>{h}</TableHeaderCell>
                    ))}
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <tr><td colSpan={9} className="px-5 py-12 text-center text-[#A69C87]">Loading...</td></tr>
                    ) : filtered.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <span className="font-semibold text-[#211D17]">{b.booking_number}</span>
                        </TableCell>
                        <TableCell>
                          {b.start_time ? new Date(b.start_time).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </TableCell>
                        <TableCell>{String(b.screen_count).padStart(2, '0')}</TableCell>
                        <TableCell>{String(b.impressions).padStart(2, '0')}</TableCell>
                        <TableCell>{b.views}</TableCell>
                        <TableCell>{String(b.interval_seconds).padStart(2, '0')}</TableCell>
                        <TableCell>₦{b.cost_per_sec}/Sec</TableCell>
                        <TableCell>₦{Number(b.total_cost).toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
