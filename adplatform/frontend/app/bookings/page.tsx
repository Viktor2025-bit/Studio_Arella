'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, CalendarCheck, Mic, CreditCard, Wallet } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import api from '@/lib/api';
import { Booking } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { theme } from '@/lib/theme';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [podcastBookings, setPodcastBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<'screens' | 'podcasts'>(tabParam === 'podcasts' ? 'podcasts' : 'screens');
  const { toast } = useToast();

  const fetchScreens = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/bookings${params}`);
      setBookings(res.data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/podcasts/my-bookings`);
      let data = res.data.bookings || [];
      if (filter !== 'all') data = data.filter((b: any) => b.status === filter);
      setPodcastBookings(data);
    } catch {
      setPodcastBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'screens') fetchScreens();
    else fetchPodcasts();
  }, [filter, activeTab]);

  const handlePay = async (bookingId: string, method: 'monnify' | 'wallet') => {
    try {
      if (method === 'monnify') {
        const res = await api.post('/payments/initialize', { booking_id: bookingId, booking_type: 'podcast' });
        window.location.href = res.data.checkout_url || res.data.authorization_url;
      } else {
        const res = await api.post('/payments/wallet', { booking_id: bookingId, booking_type: 'podcast' });
        toast(res.data.message || 'Payment successful!', 'success');
        fetchPodcasts();
      }
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Payment failed', 'error');
    }
  };

  const filteredScreens = bookings.filter((b) => b.booking_number.toLowerCase().includes(search.toLowerCase()));
  const filteredPodcasts = podcastBookings.filter((b) => b.booking_number.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: theme.font.body }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: theme.color.text1, margin: 0 }}>My Bookings</h1>
              <p style={{ fontSize: 14, color: theme.color.text3, margin: '4px 0 0' }}>
                {activeTab === 'screens' ? bookings.length : podcastBookings.length} {activeTab} bookings total
              </p>
            </div>

            <div style={{ display: 'flex', background: theme.color.surface2, border: `1px solid ${theme.color.border}`, padding: 4, borderRadius: 12 }}>
              <button 
                onClick={() => setActiveTab('screens')} 
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                  background: activeTab === 'screens' ? `linear-gradient(90deg, ${theme.color.gold}, #f6c04f)` : 'transparent',
                  color: activeTab === 'screens' ? '#1a1a1a' : theme.color.text2,
                  boxShadow: activeTab === 'screens' ? `0 2px 10px rgba(224,165,38,0.3)` : 'none'
                }}>
                <CalendarCheck size={16} /> Screen Ads
              </button>
              <button 
                onClick={() => setActiveTab('podcasts')} 
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                  background: activeTab === 'podcasts' ? `linear-gradient(90deg, ${theme.color.gold}, #f6c04f)` : 'transparent',
                  color: activeTab === 'podcasts' ? '#1a1a1a' : theme.color.text2,
                  boxShadow: activeTab === 'podcasts' ? `0 2px 10px rgba(224,165,38,0.3)` : 'none'
                }}>
                <Mic size={16} /> Podcast Studio
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
              <Search size={15} color={theme.color.text3} style={{ position: 'absolute', left: 12, top: 10 }} />
              <input 
                type="text" 
                placeholder="Search by booking #..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{
                  width: '100%', padding: '9px 16px 9px 36px', background: theme.color.surface2, 
                  border: `1px solid ${theme.color.border}`, borderRadius: 12, fontSize: 14,
                  color: theme.color.text1, outline: 'none'
                }} 
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'pending', 'active', 'ended', 'cancelled'].map((f) => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: 'capitalize', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: filter === f ? theme.color.charcoal900 : theme.color.surface2,
                    color: filter === f ? '#fff' : theme.color.text2
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 24, boxShadow: theme.shadow.sm, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              
              {/* SCREENS TABLE */}
              {activeTab === 'screens' && (
                !loading && filteredScreens.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center' }}><EmptyState icon={CalendarCheck} title="No screen bookings found" subtitle="Bookings you make will show up here." /></div>
                ) : (
                  <Table>
                    <TableHead>
                      {['Campaign Info', 'Schedule', 'Configuration', 'Performance', 'Billing', 'Status'].map((h) => <TableHeaderCell key={h}>{h}</TableHeaderCell>)}
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <tr><td colSpan={6} style={{ padding: '64px 20px', textAlign: 'center', color: theme.color.text3 }}>Loading your bookings...</td></tr>
                      ) : filteredScreens.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <CalendarCheck size={20} color={theme.color.goldDark} />
                               </div>
                               <div>
                                 <div style={{ fontWeight: 800, color: theme.color.text1, fontSize: 14, letterSpacing: '-0.2px' }}>{b.booking_number}</div>
                                 <div style={{ fontSize: 12, color: theme.color.text3, marginTop: 2 }}>Screen Campaign</div>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ fontSize: 13, color: theme.color.text1, fontWeight: 600 }}>
                              {b.start_time ? new Date(b.start_time).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </div>
                            <div style={{ fontSize: 12, color: theme.color.text3, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ color: theme.color.text4 }}>to</span> {b.end_time ? new Date(b.end_time).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                               <div style={{ fontSize: 12, color: theme.color.text2, display: 'flex', justifyContent: 'space-between', width: 100 }}>
                                 <span style={{ color: theme.color.text3 }}>Screens:</span> 
                                 <span style={{ fontWeight: 700, color: theme.color.text1 }}>{String(b.screen_count).padStart(2, '0')}</span>
                               </div>
                               <div style={{ fontSize: 12, color: theme.color.text2, display: 'flex', justifyContent: 'space-between', width: 100 }}>
                                 <span style={{ color: theme.color.text3 }}>Interval:</span> 
                                 <span style={{ fontWeight: 700, color: theme.color.text1 }}>{b.interval_seconds}s</span>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                               <div style={{ fontSize: 12, color: theme.color.text2, display: 'flex', justifyContent: 'space-between', width: 100 }}>
                                 <span style={{ color: theme.color.text3 }}>Impressions:</span> 
                                 <span style={{ fontWeight: 700, color: theme.color.text1 }}>{String(b.impressions).padStart(2, '0')}</span>
                               </div>
                               <div style={{ fontSize: 12, color: theme.color.text2, display: 'flex', justifyContent: 'space-between', width: 100 }}>
                                 <span style={{ color: theme.color.text3 }}>Views:</span> 
                                 <span style={{ fontWeight: 700, color: theme.color.text1 }}>{b.views}</span>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ fontWeight: 800, color: theme.color.text1, fontSize: 15 }}>₦{Number(b.total_cost).toLocaleString()}</div>
                            <div style={{ fontSize: 11, color: theme.color.text3, marginTop: 4 }}>₦{Number(b.cost_per_sec).toFixed(2)}/Sec</div>
                          </TableCell>
                          <TableCell><StatusBadge status={b.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}

              {/* PODCASTS TABLE */}
              {activeTab === 'podcasts' && (
                !loading && filteredPodcasts.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center' }}><EmptyState icon={Mic} title="No podcast bookings found" subtitle="Your podcast reservations will show up here." /></div>
                ) : (
                  <Table>
                    <TableHead>
                      {['Booking Info', 'Schedule', 'Duration', 'Billing', 'Status', 'Action'].map((h) => <TableHeaderCell key={h}>{h}</TableHeaderCell>)}
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <tr><td colSpan={6} style={{ padding: '64px 20px', textAlign: 'center', color: theme.color.text3 }}>Loading your bookings...</td></tr>
                      ) : filteredPodcasts.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <Mic size={20} color={theme.color.goldDark} />
                               </div>
                               <div>
                                 <div style={{ fontWeight: 800, color: theme.color.text1, fontSize: 14, letterSpacing: '-0.2px' }}>{b.booking_number}</div>
                                 <div style={{ fontSize: 12, color: theme.color.text3, marginTop: 2, textTransform: 'capitalize' }}>{b.package_type} Package</div>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ fontSize: 13, color: theme.color.text1, fontWeight: 600 }}>
                              {new Date(b.start_time).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: 12, color: theme.color.text3, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ color: theme.color.text4 }}>to</span> {new Date(b.end_time).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.text1 }}>
                              {b.duration_minutes / 60} hr{b.duration_minutes / 60 > 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ fontWeight: 800, color: theme.color.text1, fontSize: 15 }}>₦{Number(b.total_cost).toLocaleString()}</div>
                          </TableCell>
                          <TableCell><StatusBadge status={b.status} /></TableCell>
                          <TableCell>
                            {b.status === 'pending' && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => handlePay(b.id, 'wallet')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: theme.color.charcoal900, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} className="hover:opacity-90" title="Pay from Wallet">
                                  <Wallet size={14} /> Wallet
                                </button>
                                <button onClick={() => handlePay(b.id, 'monnify')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(212,175,55,0.1)', color: theme.color.goldDark, border: `1px solid rgba(212,175,55,0.4)`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-gold/20" title="Pay with Card">
                                  <CreditCard size={14} /> Card
                                </button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}

            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
