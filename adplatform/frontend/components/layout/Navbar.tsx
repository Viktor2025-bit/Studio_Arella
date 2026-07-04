'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { FaArrowRightFromBracket, FaCalendarCheck } from 'react-icons/fa6';
import NotificationBell from '@/components/ui/NotificationBell';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';

const F = theme.font.body;

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  return (
    <header style={{ height: 72, background: theme.color.surface, borderBottom: `1px solid ${theme.color.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, fontFamily: F }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

        <img src="/logo.png" alt="Studio Arella Logo" style={{ height: 56, objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: theme.color.gold, color: theme.color.charcoal900, padding: '8px 16px', borderRadius: theme.radius.sm, fontSize: 12, fontWeight: 800, textDecoration: 'none', boxShadow: theme.shadow.gold }}>
          <FaCalendarCheck size={12} /> Book Slot
        </Link>

        <NotificationBell />

        <div style={{ position: 'relative' }}>
          <button onClick={() => setDropOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.pill, padding: '5px 12px 5px 5px', cursor: 'pointer', fontFamily: F }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${theme.color.gold},${theme.color.charcoal700})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text1, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</span>
          </button>
          <AnimatePresence>
            {dropOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setDropOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, padding: 8, minWidth: 200, boxShadow: theme.shadow.md, zIndex: 10 }}>
                  <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.color.border2}`, marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: theme.color.text1, margin: '0 0 2px' }}>{user?.name}</p>
                    <p style={{ fontSize: 11, color: theme.color.text4, margin: 0, fontWeight: 500 }}>{user?.email}</p>
                  </div>
                  {[{ label: 'My Dashboard', href: '/dashboard' }, { label: 'Settings', href: '/settings' }, { label: 'Support', href: '/support' }].map(({ label, href }) => (
                    <Link key={href} href={href} onClick={() => setDropOpen(false)}
                      style={{ display: 'block', padding: '9px 12px', fontSize: 13, fontWeight: 600, color: theme.color.text2, textDecoration: 'none', borderRadius: theme.radius.sm, transition: 'background 0.1s' }}
                      onMouseOver={e => (e.currentTarget.style.background = theme.color.surface2)}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                      {label}
                    </Link>
                  ))}
                  <div style={{ borderTop: `1px solid ${theme.color.border2}`, marginTop: 6, paddingTop: 6 }}>
                    <button onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', fontSize: 13, fontWeight: 700, color: theme.color.error, background: 'none', border: 'none', cursor: 'pointer', borderRadius: theme.radius.sm, fontFamily: F, textAlign: 'left' }}
                      onMouseOver={e => (e.currentTarget.style.background = theme.color.errorLight)}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                      <FaArrowRightFromBracket size={13} /> Sign out
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
