'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/authStore';
import StatusBadge from '@/components/ui/StatusBadge';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import api from '@/lib/api';
import { Booking } from '@/types';
import { FaArrowRight, FaArrowTrendUp, FaCalendarDays, FaBullhorn, FaPaintbrush, FaCalendar, FaCircleArrowUp } from 'react-icons/fa6';
import { DollarSign, Megaphone, Monitor, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { theme } from '@/lib/theme';
import DashboardTour from '@/components/ui/DashboardTour';

const F = theme.font.body;
const card: React.CSSProperties = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, boxShadow: theme.shadow.sm };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) return (
    <div style={{ background: theme.color.charcoal900, border: `1px solid rgba(224,165,38,0.3)`, borderRadius: 12, padding: '10px 14px', boxShadow: theme.shadow.lg }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 3px', fontFamily: F }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.goldMid, margin: 0, fontFamily: F }}>{payload[0]?.value} impressions</p>
    </div>
  );
  return null;
};

export default function AdvertiserDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      api.get('/dashboard/stats').then(res => { if (isMounted) setStats(prev => ({ ...prev, ...res.data })) }),
      api.get('/analytics/hourly').then(res => { if (isMounted) setChartData(res.data) }),
      api.get('/bookings?limit=6').then(res => { if (isMounted) setBookings(res.data.bookings || []) }),
      api.get('/finances/balance').then(res => { if (isMounted) setBalance(res.data) }),
      api.get('/finances/revenue').then(res => {
        if (isMounted) setStats((prev: any) => ({ ...prev, total_revenue: res.data.total_revenue || 0 }));
      })
    ]).then(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i % 12 || 12}${i >= 12 ? 'pm' : 'am'}`);
  const chart = chartData.map((d: any, i: number) => ({ ...d, label: hourLabels[d.hour ?? i] }));
  const filtered = bookings.filter(b => b.booking_number?.toLowerCase().includes(search.toLowerCase()));
  const hasActivity = bookings.length > 0;
  const hasStats = stats && stats.total_revenue > 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div>
        <img src="/logo.png" alt="Loading..." style={{ height: 80, objectFit: 'contain', margin: '0 auto 14px', display: 'block' }} />
        <div style={{ width: 24, height: 24, border: `2.5px solid ${theme.color.goldMid}`, borderTopColor: theme.color.gold, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <DashboardTour />
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: theme.font.display, fontSize: 26, fontWeight: 600, color: theme.color.text1, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0, fontWeight: 500 }}>
            {hasStats ? "Here's your advertising performance on Studio Arella today." : 'Welcome to Bems Screens. Your Studio Arella dashboard is ready.'}
          </p>
        </div>

        <div className="dashboard-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

            {/* Stat cards */}
            <div id="tour-stats" className="stats-grid">
              {[
                { label: 'Total Spending', value: `₦${(stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: theme.color.gold, bg: theme.color.goldLight, border: theme.color.goldMid, change: '+12%' },
                { label: 'Active Campaigns', value: stats?.active_campaigns || 0, icon: Megaphone, color: theme.color.success, bg: theme.color.successLight, border: theme.color.success, change: '' },
                { label: 'Slots Booked', value: stats?.active_screens || 0, icon: Monitor, color: theme.color.info, bg: theme.color.infoLight, border: theme.color.infoBorder, change: '' },
              ].map(({ label, value, icon: Icon, color, bg, border, change }, i) => (
                <FadeCard key={label} delay={i * 0.07} style={{ ...card, padding: '20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right,${bg},transparent)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={color} />
                    </div>
                    {change && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: theme.color.successLight, border: `1px solid ${theme.color.success}`, borderRadius: 100, padding: '2px 8px' }}>
                        <FaCircleArrowUp size={10} color={theme.color.success} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: theme.color.success }}>{change}</span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 900, color: theme.color.text1, margin: '0 0 3px', letterSpacing: '-0.5px' }}>{value}</p>
                  <p style={{ fontSize: 11, color: theme.color.text3, margin: 0, fontWeight: 600 }}>{label}</p>
                </FadeCard>
              ))}
            </div>

            {/* Chart */}
            <div id="tour-chart">
              <FadeCard delay={0.16} style={{ ...card, padding: '22px 22px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1, margin: '0 0 2px', letterSpacing: '-0.2px' }}>Impression Activity</p>
                  <p style={{ fontSize: 11, color: theme.color.text3, margin: 0, fontWeight: 500 }}>Hourly performance on Studio Arella today</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: theme.color.infoLight, border: `1px solid ${theme.color.infoBorder}`, borderRadius: 100, padding: '4px 10px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.color.glitchCyan }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: theme.color.info }}>Live</span>
                </div>
              </div>
              {chart.some((d: any) => d.impressions > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chart} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.color.gold} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={theme.color.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke={theme.color.surface2} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.color.text4, fontFamily: F }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: theme.color.text4, fontFamily: F }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="impressions" stroke={theme.color.gold} strokeWidth={2.5} fill="url(#goldGrad)" dot={false} activeDot={{ r: 5, fill: theme.color.gold, stroke: theme.color.surface, strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: theme.color.surface2, borderRadius: 12, border: `1.5px dashed ${theme.color.border}` }}>
                  <FaArrowTrendUp size={28} color={theme.color.border} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: theme.color.text4, margin: 0 }}>No impression data yet</p>
                  <Link href="/book" style={{ fontSize: 12, color: theme.color.gold, textDecoration: 'none', fontWeight: 700 }}>Book your first slot →</Link>
                </div>
              )}
            </FadeCard>
            </div>

            {/* Bookings table */}
            <FadeCard delay={0.24} style={{ ...card, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1, margin: '0 0 2px' }}>Recent Bookings</p>
                  <p style={{ fontSize: 11, color: theme.color.text3, margin: 0, fontWeight: 500 }}>Your Studio Arella ad slots</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: theme.color.text4 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ background: theme.color.surface2, border: `1px solid ${theme.color.border}`, color: theme.color.text1, borderRadius: 9, padding: '7px 10px 7px 28px', fontSize: 12, outline: 'none', width: 130, fontFamily: F, fontWeight: 600 }} />
                  </div>
                  <Link href="/bookings" style={{ fontSize: 12, color: theme.color.gold, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    View all <FaArrowRight size={10} />
                  </Link>
                </div>
              </div>
              {!hasActivity ? (
                <div style={{ padding: '40px 0', textAlign: 'center', background: theme.color.surface2, borderRadius: 12, border: `1.5px dashed ${theme.color.border}` }}>
                  <FaCalendarDays size={28} color={theme.color.border} style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text2, margin: '0 0 4px' }}>No bookings yet</p>
                  <p style={{ fontSize: 12, color: theme.color.text3, margin: '0 0 18px', fontWeight: 500 }}>Book your first Studio Arella slot to start reaching your audience</p>
                  <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: theme.color.gold, color: theme.color.charcoal900, padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: theme.shadow.gold }}>
                    Book Ad Slot <FaArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: theme.color.surface2 }}>
                        {['Booking #','Date','Duration','Cost','Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: theme.color.text3, fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${theme.color.border2}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(b => (
                        <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ background: theme.color.surface2 }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: theme.color.text1, borderBottom: `1px solid ${theme.color.border2}`, fontFamily: 'monospace', fontSize: 12 }}>{b.booking_number}</td>
                          <td style={{ padding: '12px', color: theme.color.text2, borderBottom: `1px solid ${theme.color.border2}`, fontSize: 12, fontWeight: 500 }}>{b.start_time ? new Date(b.start_time).toLocaleDateString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td style={{ padding: '12px', color: theme.color.text2, borderBottom: `1px solid ${theme.color.border2}`, fontSize: 12, fontWeight: 500 }}>{b.interval_seconds ? `${Math.round(b.interval_seconds / 60)} min` : '—'}</td>
                          <td style={{ padding: '12px', color: theme.color.gold, fontWeight: 800, borderBottom: `1px solid ${theme.color.border2}` }}>₦{Number(b.total_cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px', borderBottom: `1px solid ${theme.color.border2}` }}><StatusBadge status={b.status} /></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FadeCard>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Primary CTA */}
            <FadeCard delay={0.08} style={{ background: `linear-gradient(135deg,${theme.color.gold} 0%,${theme.color.charcoal900} 100%)`, borderRadius: 16, padding: '24px 22px', position: 'relative', overflow: 'hidden', boxShadow: theme.shadow.gold }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
              <p style={{ fontFamily: theme.font.display, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', margin: '0 0 8px' }}>Studio Arella Screen</p>
              <p style={{ fontFamily: theme.font.display, fontSize: 18, fontWeight: 600, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.2px', lineHeight: 1.2 }}>Book your ad slot from ₦1,000/min</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 18px', fontWeight: 500 }}>Bems Junction · Thousands of daily viewers</p>
              <Link href="/book" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#1A1A1A', color: '#FFFFFF', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                Choose date & time <FaArrowRight size={12} color={theme.color.gold} />
              </Link>
            </FadeCard>

            {/* Credits */}
            <div id="tour-balance">
              <FadeCard delay={0.14} style={{ ...card, padding: '20px 22px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: theme.color.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Account Balance</p>
              <p style={{ fontSize: 30, fontWeight: 900, color: theme.color.text1, margin: '0 0 2px', letterSpacing: '-0.8px' }}>₦{(balance?.credits || 0).toLocaleString()}</p>
              <p style={{ fontSize: 11, color: theme.color.text3, margin: '0 0 14px', fontWeight: 500 }}>Available credits</p>
              {(balance?.credits || 0) < 1000 && (
                <div style={{ background: theme.color.warningLight, border: `1px solid ${theme.color.warning}`, borderRadius: 9, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 11, color: theme.color.warning, fontWeight: 700 }}>Min ₦1,000 to book a 1-min slot</span>
                </div>
              )}
              <Link href="/finances" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: theme.color.charcoal900, color: '#fff', padding: '10px', borderRadius: 9, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Add Credits <FaArrowRight size={11} />
              </Link>
            </FadeCard>
            </div>

            {/* Quick actions */}
            <div id="tour-actions">
              <FadeCard delay={0.20} style={{ ...card, padding: '20px 22px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: theme.color.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Quick Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Book Ad Slot',          href: '/book',      bg: theme.color.goldLight,    color: theme.color.goldDark, border: theme.color.goldMid, Icon: FaCalendar },
                  { label: 'Request Creative Team', href: '/creative',  bg: theme.color.warningLight,  color: theme.color.warning, border: theme.color.warning, Icon: FaPaintbrush },
                  { label: 'View Calendar',          href: '/calendar',  bg: theme.color.successLight,  color: theme.color.success, border: theme.color.success, Icon: FaCalendarDays },
                  { label: 'Create Campaign',        href: '/campaigns', bg: theme.color.infoLight,                 color: theme.color.info, border: theme.color.infoBorder, Icon: FaBullhorn },
                ].map(({ label, href, bg, color, border, Icon: ActionIcon }) => (
                  <Link key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 10, textDecoration: 'none', transition: 'opacity 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.opacity = '0.8')} onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
                    <ActionIcon size={13} color={color} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: theme.color.text1, flex: 1 }}>{label}</span>
                    <FaArrowRight size={10} color={theme.color.text4} />
                  </Link>
                ))}
              </div>
            </FadeCard>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
