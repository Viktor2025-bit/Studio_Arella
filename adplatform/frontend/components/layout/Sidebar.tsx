'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarCheck, Megaphone, Film, DollarSign, Settings, HelpCircle, X, Shield, Calendar, Paintbrush, Monitor, BarChart2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/lib/theme';

const F = theme.font.body;

const advertiserNav = [
  { href: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/analytics',  label: 'Analytics',        icon: BarChart2 },
  { href: '/book',       label: 'Book Ad Slot',      icon: CalendarCheck, highlight: true },
  { href: '/calendar',   label: 'My Calendar',       icon: Calendar },
  { href: '/campaigns',  label: 'My Campaigns',      icon: Megaphone },
  { href: '/ads',        label: 'My Ads',            icon: Film },
  { href: '/creative',   label: 'Request Creative',  icon: Paintbrush },
  { href: '/finances',   label: 'Finances',          icon: DollarSign },
];

const adminNav = [
  { href: '/admin',           label: 'Overview',        icon: Shield },
  { href: '/admin/users',     label: 'All Users',       icon: LayoutDashboard },
  { href: '/admin/review',    label: 'Review Queue',    icon: Film },
  { href: '/admin/campaigns', label: 'All Campaigns',   icon: Megaphone },
  { href: '/admin/bookings',  label: 'All Bookings',    icon: CalendarCheck },
  { href: '/admin/screens',   label: 'Screen Settings', icon: Monitor },
  { href: '/admin/finances',  label: 'Revenue',         icon: DollarSign },
];

const bottomNav = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support',  label: 'Support',  icon: HelpCircle },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const navItems = user?.role === 'admin' ? adminNav : advertiserNav;
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));

  return (
    <>
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.45)', zIndex: 20, backdropFilter: 'blur(2px)' }}
          onClick={onClose} />
      )}
      <aside style={{ width: 240, background: theme.color.charcoal900, height: '100%', borderRight: 'none', display: 'flex', flexDirection: 'column', fontFamily: F, position: 'fixed', top: 0, left: 0, zIndex: 30 }}>

        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img src="/logo-white.png" alt="Studio Arella Logo" style={{ height: 56, objectFit: 'contain' }} />
            </Link>
            {mobileOpen && (
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                <X size={16} />
              </button>
            )}
          </div>
          {/* Role badge */}
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(224,165,38,0.15)', border: '1px solid rgba(224,165,38,0.28)', borderRadius: theme.radius.pill, padding: '3px 10px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.color.gold, display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: theme.color.goldMid, letterSpacing: '0.04em' }}>
              {user?.role === 'admin' ? 'Admin — Bems Group' : 'Advertiser'}
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(({ href, label, icon: Icon, highlight }: any) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link href={href} onClick={onClose} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: theme.radius.sm,
                    textDecoration: 'none', fontSize: 13, fontWeight: active ? 800 : 600,
                    color: active  ? theme.color.charcoal900 : highlight ? theme.color.goldMid : 'rgba(255,255,255,0.5)',
                    background: active ? theme.color.gold : 'transparent',
                    boxShadow: active ? theme.shadow.gold : 'none',
                    transition: 'all 0.15s',
                  }}
                    onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(224,165,38,0.12)'; }}
                    onMouseOut={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                    {label}
                    {highlight && !active && (
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 900, background: theme.color.warning, color: '#fff', padding: '2px 7px', borderRadius: theme.radius.pill, letterSpacing: '0.05em' }}>BOOK</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 6 }}>Account</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {bottomNav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link href={href} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: theme.radius.sm, textDecoration: 'none', fontSize: 13, fontWeight: active ? 800 : 600, color: active  ? theme.color.charcoal900 : 'rgba(255,255,255,0.4)', background: active ? theme.color.gold : 'transparent', transition: 'all 0.15s' }}
                      onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(224,165,38,0.12)'; }}
                      onMouseOut={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <Icon size={15} strokeWidth={1.8} />{label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${theme.color.gold},${theme.color.charcoal700})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
