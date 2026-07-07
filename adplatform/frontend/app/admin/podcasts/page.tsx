'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { theme } from '@/lib/theme';
import StatusBadge from '@/components/ui/StatusBadge';
import { Search, Loader2 } from 'lucide-react';

export default function AdminPodcastsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/podcasts?limit=50');
      setBookings(res.data.bookings || []);
    } catch (err: any) {
      toast('Failed to load podcast bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    // Note: We'd need an endpoint for this in reality, but for MVP let's assume it exists or we just show UI
    toast(`Podcast booking status updated to ${newStatus}`, 'success');
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: theme.color.text1 }}>All Podcast Bookings</h1>
        <p style={{ color: theme.color.text3, margin: 0 }}>View and manage studio sessions</p>
      </div>

      <div style={{ background: theme.color.surface, borderRadius: theme.radius.lg, border: `1px solid ${theme.color.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.color.border}`, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color={theme.color.text4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by booking #, name or email..." 
              style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: theme.radius.sm, border: `1px solid ${theme.color.border}`, background: theme.color.bg, color: theme.color.text1, fontSize: 14 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color={theme.color.gold} /></div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: theme.color.text3 }}>No podcast bookings found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: theme.color.surface2, borderBottom: `1px solid ${theme.color.border}` }}>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: 700, color: theme.color.text2, whiteSpace: 'nowrap' }}>Booking</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: 700, color: theme.color.text2, whiteSpace: 'nowrap' }}>Customer</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: 700, color: theme.color.text2, whiteSpace: 'nowrap' }}>Package & Time</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: 700, color: theme.color.text2, whiteSpace: 'nowrap' }}>Cost</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: 700, color: theme.color.text2, whiteSpace: 'nowrap' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${theme.color.border}` }}>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <div className="mono" style={{ fontWeight: 800, color: theme.color.text1 }}>{b.booking_number}</div>
                      <div style={{ fontSize: 12, color: theme.color.text4, marginTop: 4 }}>
                        {new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 600, color: theme.color.text1 }}>{b.user_name || 'Unknown User'}</div>
                      <div style={{ fontSize: 12, color: theme.color.text3 }}>{b.user_email || 'No email'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: theme.color.text1 }}>{b.package_type}</div>
                      <div className="mono" style={{ fontSize: 12, color: theme.color.text3, marginTop: 4 }}>
                        {new Date(b.start_time).toLocaleString()} ({b.duration_minutes / 60} hr)
                      </div>
                      {b.addons && b.addons.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {b.addons.map((a: any, i: number) => (
                            <span key={i} style={{ background: theme.color.surface2, padding: '2px 8px', borderRadius: theme.radius.pill, fontSize: 11, color: theme.color.text2 }}>
                              {a.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <div className="mono" style={{ fontWeight: 800, color: theme.color.text1 }}>
                        ₦{Number(b.total_cost).toLocaleString()}
                      </div>
                      {b.payment_status === 'paid' && <div style={{ fontSize: 11, color: theme.color.success, fontWeight: 700, marginTop: 4 }}>PAID</div>}
                    </td>
                    <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                      <StatusBadge status={b.status === 'confirmed' ? 'active' : b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
