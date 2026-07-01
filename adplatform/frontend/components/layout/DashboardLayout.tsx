'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const F = "'Quicksand', sans-serif";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !localStorage.getItem('token')) {
      router.push('/auth/login');
    }
  }, [mounted, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F4F5F9', fontFamily: F, overflow: 'hidden' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: 240 }}>
        <Navbar onMenuClick={() => setMobileOpen(o => !o)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
