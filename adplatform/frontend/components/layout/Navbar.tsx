'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { FaArrowRightFromBracket, FaCalendarCheck } from 'react-icons/fa6';
import NotificationBell from '@/components/ui/NotificationBell';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const F = "'Quicksand', sans-serif";

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  return (
    <header style={{ height: 72, background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, fontFamily: F }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {onMenuClick && (
          <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 4 }} className="lg:hidden">
            <Menu size={20} />
          </button>
        )}
        <img src="/logo.png" alt="Studio Arella Logo" style={{ height: 56, objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, textDecoration: 'none', boxShadow: '0 2px 8px rgba(212,175,55,0.3)' }}>
          <FaCalendarCheck size={12} /> Book Slot
        </Link>

        <NotificationBell />

        <div style={{ position: 'relative' }}>
          <button onClick={() => setDropOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: '1px solid #E2E8F0', borderRadius: 100, padding: '5px 12px 5px 5px', cursor: 'pointer', fontFamily: F }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#D4AF37,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</span>
          </button>
          <AnimatePresence>
            {dropOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setDropOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 8, minWidth: 200, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', zIndex: 10 }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', margin: '0 0 2px' }}>{user?.name}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontWeight: 500 }}>{user?.email}</p>
                  </div>
                  {[{ label: 'My Dashboard', href: '/dashboard' }, { label: 'Settings', href: '/settings' }, { label: 'Support', href: '/support' }].map(({ label, href }) => (
                    <Link key={href} href={href} onClick={() => setDropOpen(false)}
                      style={{ display: 'block', padding: '9px 12px', fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none', borderRadius: 10, transition: 'background 0.1s' }}
                      onMouseOver={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                      {label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 6, paddingTop: 6 }}>
                    <button onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', fontSize: 13, fontWeight: 700, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10, fontFamily: F, textAlign: 'left' }}
                      onMouseOver={e => (e.currentTarget.style.background = '#FEF2F2')}
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
