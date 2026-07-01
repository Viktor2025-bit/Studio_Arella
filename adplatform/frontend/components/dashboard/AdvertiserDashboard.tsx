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

const F = "'Quicksand', sans-serif";
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 3px', fontFamily: F }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 800, color: '#E8CE5E', margin: 0, fontFamily: F }}>{payload[0]?.value} impressions</p>
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
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/analytics/hourly'),
      api.get('/bookings?limit=6'),
      api.get('/finances/balance'),
    ]).then(([s, c, b, bal]) => {
      setStats(s.data); setChartData(c.data);
      setBookings(b.data.bookings || []); setBalance(bal.data);
    }).catch(() => {
      setStats({ total_revenue: 0, active_campaigns: 0, active_screens: 0 });
      setBalance({ credits: 0 }); setChartData([]); setBookings([]);
    }).finally(() => setLoading(false));
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
        <div style={{ width: 24, height: 24, border: '2.5px solid #E3C762', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 500 }}>
            {hasStats ? "Here's your advertising performance on Studio Arella today." : 'Welcome to Bems Screens. Your Studio Arella dashboard is ready.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 292px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Total Ad Spend', value: `₦${(stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: '#D4AF37', bg: '#F9F6EA', border: '#E3C762', change: '+12%' },
                { label: 'Active Campaigns', value: stats?.active_campaigns || 0, icon: Megaphone, color: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0', change: '' },
                { label: 'Slots Booked', value: stats?.active_screens || 0, icon: Monitor, color: '#0E7490', bg: '#CFFAFE', border: '#67E8F9', change: '' },
              ].map(({ label, value, icon: Icon, color, bg, border, change }, i) => (
                <FadeCard key={label} delay={i * 0.07} style={{ ...card, padding: '20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right,${bg},transparent)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={color} />
                    </div>
                    {change && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 100, padding: '2px 8px' }}>
                        <FaCircleArrowUp size={10} color="#16A34A" />
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A' }}>{change}</span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', margin: '0 0 3px', letterSpacing: '-0.5px' }}>{value}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontWeight: 600 }}>{label}</p>
                </FadeCard>
              ))}
            </div>

            {/* Chart */}
            <FadeCard delay={0.16} style={{ ...card, padding: '22px 22px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', margin: '0 0 2px', letterSpacing: '-0.2px' }}>Impression Activity</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontWeight: 500 }}>Hourly performance on Studio Arella today</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 100, padding: '4px 10px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#15803D' }}>Live</span>
                </div>
              </div>
              {chart.some((d: any) => d.impressions > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chart} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#CBD5E1', fontFamily: F }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: '#CBD5E1', fontFamily: F }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="impressions" stroke="#D4AF37" strokeWidth={2.5} fill="url(#purpleGrad)" dot={false} activeDot={{ r: 5, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #E2E8F0' }}>
                  <FaArrowTrendUp size={28} color="#E2E8F0" />
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', margin: 0 }}>No impression data yet</p>
                  <Link href="/book" style={{ fontSize: 12, color: '#D4AF37', textDecoration: 'none', fontWeight: 700 }}>Book your first slot →</Link>
                </div>
              )}
            </FadeCard>

            {/* Bookings table */}
            <FadeCard delay={0.24} style={{ ...card, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', margin: '0 0 2px' }}>Recent Bookings</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontWeight: 500 }}>Your Studio Arella ad slots</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1A1A1A', borderRadius: 9, padding: '7px 10px 7px 28px', fontSize: 12, outline: 'none', width: 130, fontFamily: F, fontWeight: 600 }} />
                  </div>
                  <Link href="/bookings" style={{ fontSize: 12, color: '#D4AF37', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    View all <FaArrowRight size={10} />
                  </Link>
                </div>
              </div>
              {!hasActivity ? (
                <div style={{ padding: '40px 0', textAlign: 'center', background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #E2E8F0' }}>
                  <FaCalendarDays size={28} color="#E2E8F0" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#475569', margin: '0 0 4px' }}>No bookings yet</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 18px', fontWeight: 500 }}>Book your first Studio Arella slot to start reaching your audience</p>
                  <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D4AF37', color: '#111111', padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>
                    Book Ad Slot <FaArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        {['Booking #','Date','Duration','Cost','Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: '#94A3B8', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F1F5F9' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(b => (
                        <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ background: '#F8FAFC' }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#1A1A1A', borderBottom: '1px solid #F8FAFC', fontFamily: 'monospace', fontSize: 12 }}>{b.booking_number}</td>
                          <td style={{ padding: '12px', color: '#64748B', borderBottom: '1px solid #F8FAFC', fontSize: 12, fontWeight: 500 }}>{b.start_time ? new Date(b.start_time).toLocaleDateString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td style={{ padding: '12px', color: '#64748B', borderBottom: '1px solid #F8FAFC', fontSize: 12, fontWeight: 500 }}>{b.interval_seconds ? `${Math.round(b.interval_seconds / 60)} min` : '—'}</td>
                          <td style={{ padding: '12px', color: '#D4AF37', fontWeight: 800, borderBottom: '1px solid #F8FAFC' }}>₦{Number(b.total_cost || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #F8FAFC' }}><StatusBadge status={b.status} /></td>
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
            <FadeCard delay={0.08} style={{ background: 'linear-gradient(135deg,#D4AF37 0%,#6D28D9 100%)', borderRadius: 16, padding: '24px 22px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(212,175,55,0.25)' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>Studio Arella Screen</p>
              <p style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Book your ad slot from ₦1,000/min</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 18px', fontWeight: 500 }}>Bems Junction · Thousands of daily viewers</p>
              <Link href="/book" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fff', color: '#6D28D9', padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
                Choose date & time <FaArrowRight size={12} />
              </Link>
            </FadeCard>

            {/* Credits */}
            <FadeCard delay={0.14} style={{ ...card, padding: '20px 22px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Account Balance</p>
              <p style={{ fontSize: 30, fontWeight: 900, color: '#1A1A1A', margin: '0 0 2px', letterSpacing: '-0.8px' }}>₦{(balance?.credits || 0).toLocaleString()}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 14px', fontWeight: 500 }}>Available credits</p>
              {(balance?.credits || 0) < 1000 && (
                <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 9, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 11, color: '#854D0E', fontWeight: 700 }}>Min ₦1,000 to book a 1-min slot</span>
                </div>
              )}
              <Link href="/finances" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#1A1A1A', color: '#fff', padding: '10px', borderRadius: 9, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Add Credits <FaArrowRight size={11} />
              </Link>
            </FadeCard>

            {/* Quick actions */}
            <FadeCard delay={0.20} style={{ ...card, padding: '20px 22px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Quick Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Book Ad Slot',          href: '/book',      bg: '#F9F6EA', color: '#8F7212', border: '#E3C762', Icon: FaCalendar },
                  { label: 'Request Creative Team', href: '/creative',  bg: '#FEF9C3', color: '#854D0E', border: '#FDE047', Icon: FaPaintbrush },
                  { label: 'View Calendar',          href: '/calendar',  bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0', Icon: FaCalendarDays },
                  { label: 'Create Campaign',        href: '/campaigns', bg: '#CFFAFE', color: '#0E7490', border: '#67E8F9', Icon: FaBullhorn },
                ].map(({ label, href, bg, color, border, Icon: ActionIcon }) => (
                  <Link key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 10, textDecoration: 'none', transition: 'opacity 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.opacity = '0.8')} onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
                    <ActionIcon size={13} color={color} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', flex: 1 }}>{label}</span>
                    <FaArrowRight size={10} color="#CBD5E1" />
                  </Link>
                ))}
              </div>
            </FadeCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
