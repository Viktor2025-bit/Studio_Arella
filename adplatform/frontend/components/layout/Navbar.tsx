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
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: dropOpen ? theme.color.surface2 : 'transparent', border: `1px solid ${theme.color.border}`, borderRadius: 40, padding: '4px 14px 4px 4px', cursor: 'pointer', fontFamily: F, transition: 'all 0.2s', boxShadow: dropOpen ? `0 0 0 2px ${theme.color.goldLight}` : 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color.gold}, #e8a825)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.color.charcoal900, boxShadow: '0 2px 6px rgba(239, 184, 66, 0.3)' }}>
              <FaUser size={14} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text1, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</span>
          </button>
          <AnimatePresence>
            {dropOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setDropOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2, type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 14, background: theme.color.surface, border: `1px solid ${theme.color.border2}`, borderRadius: 20, padding: 8, minWidth: 260, boxShadow: '0 24px 54px rgba(0,0,0,0.15), 0 4px 14px rgba(0,0,0,0.05)', zIndex: 10, overflow: 'hidden' }}>
                  
                  <div style={{ padding: '16px 18px', background: theme.color.surface2, borderRadius: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color.gold}, #e8a825)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.color.charcoal900, flexShrink: 0, boxShadow: '0 4px 10px rgba(239, 184, 66, 0.3)' }}>
                      <FaUser size={18} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: theme.color.text1, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>{user?.name}</p>
                      <p style={{ fontSize: 12, color: theme.color.text3, margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="show-on-mobile" style={{ borderBottom: `1px solid ${theme.color.border2}`, marginBottom: 8, paddingBottom: 8 }}>
                    {user?.role !== 'admin' && (
                      <Link href="/cart" onClick={() => setDropOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', fontSize: 14, fontWeight: 700, color: theme.color.text1, textDecoration: 'none', borderRadius: 12, transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = theme.color.goldLight; e.currentTarget.style.color = theme.color.goldDark; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.color.text1; }}>
                        <ShoppingCart size={16} strokeWidth={2.5} /> Cart
                      </Link>
                    )}
                    <button onClick={() => { toggleTheme(); setDropOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', fontSize: 14, fontWeight: 700, color: theme.color.text2, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 12, fontFamily: F, textAlign: 'left', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.color = theme.color.text1; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.color.text2; }}>
                      {appTheme === 'dark' ? <FaSun size={16} /> : <FaMoon size={16} />} {appTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[{ label: 'My Dashboard', href: '/dashboard', icon: FaChartPie }, { label: 'Settings', href: '/settings', icon: FaGear }, { label: 'Support', href: '/support', icon: FaHeadset }].map(({ label, href, icon: Icon }) => (
                      <Link key={href} href={href} onClick={() => setDropOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', fontSize: 14, fontWeight: 700, color: theme.color.text2, textDecoration: 'none', borderRadius: 12, transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.color = theme.color.text1; (e.currentTarget.firstChild as HTMLElement).style.color = theme.color.gold; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.color.text2; (e.currentTarget.firstChild as HTMLElement).style.color = theme.color.text3; }}>
                        <Icon size={16} color={theme.color.text3} style={{ transition: 'color 0.2s' }} /> {label}
                      </Link>
                    ))}
                  </div>

                  <div style={{ borderTop: `1px solid ${theme.color.border2}`, marginTop: 8, paddingTop: 8 }}>
                    <button onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', fontSize: 14, fontWeight: 700, color: theme.color.error, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 12, fontFamily: F, textAlign: 'left', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = theme.color.errorLight; e.currentTarget.style.color = theme.color.error; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.color.error; }}>
                      <FaArrowRightFromBracket size={16} /> Sign out
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
