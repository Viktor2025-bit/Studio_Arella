'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { FaArrowRightFromBracket, FaCalendarCheck, FaMoon, FaSun, FaUser, FaChartPie, FaGear, FaHeadset } from 'react-icons/fa6';
import NotificationBell from '@/components/ui/NotificationBell';
import { Menu, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';

const F = theme.font.body;

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuthStore();
  const { theme: appTheme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  return (
    <header style={{ height: 72, background: theme.color.surface, borderBottom: `1px solid ${theme.color.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, fontFamily: F }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="show-on-mobile-flex" onClick={onMenuClick} style={{ alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: theme.color.text1, cursor: 'pointer', padding: 4 }}>
          <Menu size={24} />
        </button>
        <img src={appTheme === 'dark' ? "/logo-white.png" : "/logo.png"} alt="Studio Arella Logo" style={{ 
          height: 56, 
          objectFit: 'contain'
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user?.role !== 'admin' && (
          <Link href="/cart" className="hide-on-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: theme.color.gold, color: '#1A1A1A', padding: '8px 16px', borderRadius: theme.radius.sm, fontSize: 12, fontWeight: 800, textDecoration: 'none', boxShadow: theme.shadow.gold }}>
            <ShoppingCart size={14} strokeWidth={2.5} /> Cart
          </Link>
        )}

        <button onClick={toggleTheme} className="hide-on-mobile" style={{ width: 38, height: 38, borderRadius: '50%', background: theme.color.surface2, border: `1px solid ${theme.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', color: theme.color.text2 }}>
          {appTheme === 'dark' ? <FaSun size={15} /> : <FaMoon size={15} />}
        </button>

        <NotificationBell />

        <div style={{ position: 'relative' }}>
          <button onClick={() => setDropOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.pill, padding: '5px 12px 5px 5px', cursor: 'pointer', fontFamily: F }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: theme.color.surface2, border: `1px solid ${theme.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.color.text3 }}>
              <FaUser size={13} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text1, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</span>
          </button>
          <AnimatePresence>
            {dropOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setDropOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 16, padding: '8px', minWidth: 240, boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)', zIndex: 10 }}>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.color.border2}`, marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
                    <p style={{ fontSize: 12, color: theme.color.text4, margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                  </div>
                  <div className="show-on-mobile" style={{ borderBottom: `1px solid ${theme.color.border2}`, marginBottom: 8, paddingBottom: 8 }}>
                    {user?.role !== 'admin' && (
                      <Link href="/cart" onClick={() => setDropOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: theme.color.goldDark, textDecoration: 'none', borderRadius: theme.radius.md, transition: 'background 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.background = theme.color.goldLight)}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                        <ShoppingCart size={14} strokeWidth={2.5} /> Cart
                      </Link>
                    )}
                    <button onClick={() => { toggleTheme(); setDropOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: theme.color.text2, background: 'none', border: 'none', cursor: 'pointer', borderRadius: theme.radius.md, fontFamily: F, textAlign: 'left', transition: 'background 0.15s' }}
                      onMouseOver={e => { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.color = theme.color.text1; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.color.text2; }}>
                      {appTheme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />} {appTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                  </div>
                  {[{ label: 'My Dashboard', href: '/dashboard', icon: FaChartPie }, { label: 'Settings', href: '/settings', icon: FaGear }, { label: 'Support', href: '/support', icon: FaHeadset }].map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setDropOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: theme.color.text2, textDecoration: 'none', borderRadius: theme.radius.md, transition: 'all 0.15s' }}
                      onMouseOver={e => { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.color = theme.color.text1; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.color.text2; }}>
                      <Icon size={14} color={theme.color.text3} style={{ transition: 'color 0.15s' }} /> {label}
                    </Link>
                  ))}
                  <div style={{ borderTop: `1px solid ${theme.color.border2}`, marginTop: 8, paddingTop: 8 }}>
                    <button onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: theme.color.error, background: 'none', border: 'none', cursor: 'pointer', borderRadius: theme.radius.md, fontFamily: F, textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseOver={e => (e.currentTarget.style.background = theme.color.errorLight)}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                      <FaArrowRightFromBracket size={14} /> Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
