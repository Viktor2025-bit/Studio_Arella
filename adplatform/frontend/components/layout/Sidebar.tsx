'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarCheck, Megaphone, Film, DollarSign, Settings, HelpCircle, X, Shield, Calendar, Paintbrush, Monitor, BarChart2, Mic } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/lib/theme';

const F = theme.font.body;

const advertiserNav = [
  { href: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/analytics',  label: 'Analytics',        icon: BarChart2 },
  { href: '/book',       label: 'Book Ad Slot',      icon: CalendarCheck, highlight: true },
  { href: '/podcast',    label: 'Book Podcast',      icon: Mic },
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
  { href: '/admin/podcasts',  label: 'All Podcasts',    icon: Mic },
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
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', padding: '4px 0' }}>
              <img src="/logo-white.png" alt="Studio Arella Logo" style={{ height: 46, objectFit: 'contain' }} />
            </Link>
            {mobileOpen && (
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 6, borderRadius: '50%' }}>
                <X size={16} />
              </button>
            )}
          </div>
          {/* Role badge */}
          <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(90deg, rgba(224,165,38,0.15) 0%, transparent 100%)`, border: '1px solid rgba(224,165,38,0.2)', borderRight: 'none', borderRadius: 100, padding: '4px 12px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.color.gold, boxShadow: `0 0 8px ${theme.color.gold}` }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: theme.color.gold, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {user?.role === 'admin' ? 'Admin' : 'Advertiser'}
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map(({ href, label, icon: Icon, highlight }: any) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link href={href} id={href === '/book' ? 'tour-book-ad' : href === '/podcast' ? 'tour-book-podcast' : undefined} onClick={onClose} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                    textDecoration: 'none', fontSize: 13, fontWeight: active ? 800 : 600,
                    color: active ? '#1a1a1a' : highlight ? theme.color.goldMid : 'rgba(255,255,255,0.55)',
                    background: active ? `linear-gradient(90deg, ${theme.color.gold}, #f6c04f)` : 'transparent',
                    boxShadow: active ? `0 4px 14px rgba(224,165,38,0.25)` : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                    onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseOut={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.8 }} />
                    <span style={{ letterSpacing: '-0.1px' }}>{label}</span>
                    {highlight && !active && (
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 900, background: `linear-gradient(90deg, ${theme.color.gold}, #f6c04f)`, color: '#1a1a1a', padding: '3px 8px', borderRadius: 100, letterSpacing: '0.05em', boxShadow: `0 2px 8px rgba(224,165,38,0.3)` }}>BOOK</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 14px', marginBottom: 8 }}>Account</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bottomNav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link href={href} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: active ? 800 : 600, color: active ? '#1a1a1a' : 'rgba(255,255,255,0.55)', background: active ? `linear-gradient(90deg, ${theme.color.gold}, #f6c04f)` : 'transparent', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseOut={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <Icon size={16} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.8 }} />
                      <span style={{ letterSpacing: '-0.1px' }}>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color.gold}, #f6c04f)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#1a1a1a', flexShrink: 0, boxShadow: `0 2px 10px rgba(224,165,38,0.3)` }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.1px' }}>{user?.name}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
