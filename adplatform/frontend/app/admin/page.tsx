'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { FaUsers, FaArrowRight, FaShield, FaDisplay, FaMoneyBillWave, FaCalendarCheck } from 'react-icons/fa6';
import { DollarSign, Megaphone, Monitor, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card: React.CSSProperties = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg };

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/bookings?limit=5')])
      .then(([s, b]) => { setStats(s.data); setRecentBookings(b.data.bookings || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const topCards = [
    { label: 'Total Users',    value: stats?.users    || 0, icon: FaUsers,        color: theme.color.gold, bg: theme.color.goldLight, border: theme.color.goldMid, href: '/admin/users' },
    { label: 'Total Revenue',  value: `₦${Number(stats?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: theme.color.success, bg: theme.color.successLight, border: theme.color.success, href: '/admin/finances' },
    { label: 'All Campaigns',  value: stats?.campaigns || 0, icon: Megaphone,      color: theme.color.info, bg: theme.color.infoLight, border: theme.color.infoBorder, href: '/admin/campaigns' },
    { label: 'All Bookings',   value: stats?.bookings  || 0, icon: CalendarCheck,  color: theme.color.warning, bg: theme.color.warningLight, border: theme.color.warning, href: '/admin/bookings' },
    { label: 'Reg. Screens',   value: stats?.screens   || 0, icon: Monitor,        color: theme.color.glitchCyan, bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)', href: '/admin/screens' },
  ];

  const adminActions = [
    { label: 'Manage Users',       href: '/admin/users',     Icon: FaUsers,        color: theme.color.gold, bg: theme.color.goldLight, border: theme.color.goldMid },
    { label: 'All Campaigns',      href: '/admin/campaigns', Icon: Megaphone,      color: theme.color.info, bg: theme.color.infoLight, border: theme.color.infoBorder },
    { label: 'All Screens',        href: '/admin/screens',   Icon: FaDisplay,      color: theme.color.success, bg: theme.color.successLight, border: theme.color.success },
    { label: 'Platform Finances',  href: '/admin/finances',  Icon: FaMoneyBillWave,color: theme.color.warning, bg: theme.color.warningLight, border: theme.color.warning },
  ];

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <FaShield size={16} color={theme.color.gold} />
            <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0, letterSpacing: '-0.2px' }}>Platform Overview</h1>
          </div>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>Real-time snapshot of the Bems Screens ecosystem</p>
        </div>

        {/* Stat cards */}
        <div className="stats-grid" style={{ marginBottom: 18 }}>
          {topCards.map(({ label, value, icon: Icon, color, bg, border, href }, i) => (
            <FadeCard key={label} delay={i * 0.06}>
              <Link href={href} style={{ ...card, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10, textDecoration: 'none', transition: 'box-shadow 0.15s' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ marginTop: 8 }}>
                  {loading ? <Skeleton width={50} height={22} style={{ marginBottom: 4 }} /> : <p style={{ fontSize: 22, fontWeight: 900, color: theme.color.text1, margin: 0, letterSpacing: '-0.4px' }}>{value}</p>}
                  <p style={{ fontSize: 11, color: theme.color.text3, margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                </div>
              </Link>
            </FadeCard>
          ))}
        </div>

        <div className="stats-grid" style={{ gap: 16 }}>
          {/* Recent bookings */}
          <FadeCard delay={0.2} style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: theme.color.text1, margin: 0 }}>Recent Bookings</p>
              <Link href="/admin/bookings" style={{ fontSize: 12, color: theme.color.gold, textDecoration: 'none', fontWeight: 700 }}>View all →</Link>
            </div>
            {recentBookings.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', background: theme.color.surface2, borderRadius: 10, border: `1px dashed ${theme.color.border}` }}>
                <FaCalendarCheck size={24} color={theme.color.border} style={{ display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: theme.color.text4, margin: 0 }}>No bookings yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentBookings.map((b: any) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: theme.color.surface2, borderRadius: 10, border: `1px solid ${theme.color.border2}` }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: theme.color.text1, margin: 0 }}>{b.booking_number}</p>
                      <p style={{ fontSize: 11, color: theme.color.text3, margin: '1px 0 0' }}>₦{Number(b.total_cost || 0).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </FadeCard>

          {/* Admin quick actions */}
          <FadeCard delay={0.25} style={{ ...card, padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: theme.color.text1, margin: '0 0 14px' }}>Admin Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {adminActions.map(({ label, href, Icon, color, bg, border }) => (
                <Link key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 10, textDecoration: 'none', transition: 'opacity 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '0.8')} onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text1, flex: 1 }}>{label}</span>
                  <FaArrowRight size={11} color={theme.color.text4} />
                </Link>
              ))}
              <div style={{ marginTop: 8, padding: '10px 12px', background: theme.color.successLight, border: '1px solid #C7E0BE', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: theme.color.success, boxShadow: `0 0 5px ${theme.color.success}` }} />
                <span style={{ fontSize: 12, color: '#2F6A3B', fontWeight: 700 }}>Platform running normally</span>
              </div>
            </div>
          </FadeCard>

          {/* Recent users */}
          <FadeCard delay={0.3} style={{ ...card, gridColumn: 'span 2', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${theme.color.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: theme.color.text1, margin: 0 }}>Recent Signups</p>
              <Link href="/admin/users" style={{ fontSize: 12, color: theme.color.gold, textDecoration: 'none', fontWeight: 700 }}>Manage users →</Link>
            </div>
            {!stats?.recent_users?.length ? (
              <div style={{ padding: '32px', textAlign: 'center', color: theme.color.text4, fontSize: 13 }}>No users signed up yet</div>
            ) : (
              <div className="responsive-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: theme.color.surface2 }}>
                    {['Name','Email','Role','Credits','Joined'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: theme.color.text3, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_users.map((u: any) => {
                    const rm = { admin: { bg: theme.color.goldLight, text: theme.color.goldDark }, advertiser: { bg: '#EFF6FF', text: '#1D4ED8' } }[u.role as string] || { bg: theme.color.surface2, text: theme.color.text2 };
                    return (
                      <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderTop: `1px solid ${theme.color.border2}` }} whileHover={{ background: theme.color.surface2 }}>
                        <td style={{ padding: '11px 16px', fontWeight: 700, color: theme.color.text1 }}>{u.name}</td>
                        <td style={{ padding: '11px 16px', color: theme.color.text2 }}>{u.email}</td>
                        <td style={{ padding: '11px 16px' }}><span style={{ fontSize: 11, fontWeight: 700, color: rm.text, background: rm.bg, padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' }}>{u.role?.replace('_',' ')}</span></td>
                        <td style={{ padding: '11px 16px', color: theme.color.success, fontWeight: 700 }}>₦{Number(u.credits||0).toLocaleString()}</td>
                        <td style={{ padding: '11px 16px', color: theme.color.text3, fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </FadeCard>
        </div>
      </div>
    </PageTransition>
  );
}
