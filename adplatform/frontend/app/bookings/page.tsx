'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
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
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-400 mt-0.5">{bookings.length} bookings total</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter buttons */}
            {['all', 'active', 'paused', 'ended'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Booking #', 'Start Time', 'Screens', 'Impression', 'View', 'Interval', 'Cost', 'Total', 'Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-gray-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-gray-400">No bookings found.</td></tr>
                ) : filtered.map((b) => (
                  <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{b.booking_number}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {b.start_time ? new Date(b.start_time).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{String(b.screen_count).padStart(2, '0')}</td>
                    <td className="px-5 py-3.5 text-gray-600">{String(b.impressions).padStart(2, '0')}</td>
                    <td className="px-5 py-3.5 text-gray-600">{b.views}</td>
                    <td className="px-5 py-3.5 text-gray-600">{String(b.interval_seconds).padStart(2, '0')}</td>
                    <td className="px-5 py-3.5 text-gray-600">₦{b.cost_per_sec}/Sec</td>
                    <td className="px-5 py-3.5 text-gray-600">₦{Number(b.total_cost).toLocaleString()}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
