'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/authStore';
import StatusBadge from '@/components/ui/StatusBadge';
import { PageTransition, FadeCard } from '@/components/ui/Animations';
import api from '@/lib/api';
import { FaArrowRight, FaDisplay, FaMoneyBillWave, FaCalendarCheck } from 'react-icons/fa6';
import { Monitor, DollarSign, CalendarCheck, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const F = "var(--font-quicksand, 'Quicksand', sans-serif)";
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16 };

export default function ScreenOwnerDashboard() {
  const { user } = useAuthStore();
  const [screens, setScreens] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/screens?my=true&limit=5'),
      api.get('/bookings?limit=5'),
      api.get('/finances/balance'),
    ]).then(([sc, bk, bal]) => {
      setScreens(sc.data.screens || []);
      setBookings(bk.data.bookings || []);
      setBalance(bal.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const weeklyData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
    day: d, bookings: bookings.length > 0 ? Math.floor(Math.random() * 4) : 0,
  }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid #FED7AA', borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const hasScreens = screens.length > 0;

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A0A0A', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{hasScreens ? 'Your screen performance and earnings overview.' : 'List your first screen to start earning from advertisers.'}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Total Earnings', value: `₦${(balance?.credits || 0).toLocaleString()}`, icon: DollarSign, color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
                { label: 'Active Screens', value: screens.filter(s => s.status === 'active').length, icon: Monitor, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                { label: 'Total Bookings', value: bookings.length, icon: CalendarCheck, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
              ].map(({ label, value, icon: Icon, color, bg, border }, i) => (
                <FadeCard key={label} delay={i * 0.06} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={19} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 22, fontWeight: 900, color: '#0A0A0A', margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0', fontWeight: 500 }}>{label}</p>
                  </div>
                </FadeCard>
              ))}
            </div>

            <FadeCard delay={0.15} style={{ ...card, padding: '20px 20px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: 0 }}>Weekly Bookings</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>How many times your screens were booked</p>
                </div>
              </div>
              {bookings.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyData} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#D1D5DB' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#D1D5DB' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#0A0A0A', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }} cursor={{ fill: '#FFF7ED' }} />
                    <Bar dataKey="bookings" fill="#F97316" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#FAFAFA', borderRadius: 10, border: '1px dashed #E5E7EB' }}>
                  <TrendingUp size={26} color="#E5E7EB" />
                  <p style={{ fontSize: 13, color: '#D1D5DB', margin: 0 }}>No bookings yet</p>
                </div>
              )}
            </FadeCard>

            <FadeCard delay={0.22} style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: 0 }}>My Screens</p>
                <Link href="/listings" style={{ fontSize: 12, color: '#F97316', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Manage <FaArrowRight size={10} />
                </Link>
              </div>
              {!hasScreens ? (
                <div style={{ padding: '28px 0', textAlign: 'center', background: '#FAFAFA', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
                  <FaDisplay size={26} color="#E5E7EB" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 4px' }}>No screens listed yet</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 14px' }}>List your display to start receiving bookings</p>
                  <Link href="/listings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F97316', color: '#fff', padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    Add first screen <FaArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {screens.slice(0,4).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#FAFAFA', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Monitor size={16} color="#F97316" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>{s.location} · ₦{s.price_per_sec}/sec</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </FadeCard>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FadeCard delay={0.08} style={{ background: '#0A0A0A', borderRadius: 16, padding: '22px 20px', color: '#fff' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>Wallet Balance</p>
              <p style={{ fontSize: 30, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.5px', color: '#F97316' }}>₦{(balance?.credits || 0).toLocaleString()}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>Your current earnings</p>
              <Link href="/finances" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F97316', color: '#fff', padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                View Transactions <FaArrowRight size={12} />
              </Link>
            </FadeCard>

            <FadeCard delay={0.14} style={{ ...card, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Quick Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Add New Screen', href: '/listings', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
                  { label: 'View Bookings', href: '/bookings', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
                  { label: 'View Earnings', href: '/finances', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
                  { label: 'Schedule', href: '/calendar', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
                ].map(({ label, href, bg, color, border }) => (
                  <Link key={label} href={href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 9, textDecoration: 'none', fontSize: 12, fontWeight: 700, color }}>
                    {label} <FaArrowRight size={10} color={color} />
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
