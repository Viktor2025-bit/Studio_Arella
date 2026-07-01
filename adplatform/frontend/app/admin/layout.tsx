'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { FaShield } from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role !== 'admin') { router.push('/dashboard'); return; }
    }
    setChecking(false);
  }, []);

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, fontFamily: F }}>
      <div style={{ width: 40, height: 40, background: '#F9F6EA', border: '1px solid #E3C762', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FaShield size={18} color="#D4AF37" />
      </div>
      <div style={{ width: 28, height: 28, border: '2.5px solid #E3C762', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#94A3B8' }}>Verifying admin access...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (user && user.role !== 'admin') return null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8FAFC' }}>
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: 240, overflow: 'hidden' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Admin banner */}
          <div style={{ background: '#F9F6EA', border: '1px solid #E3C762', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaShield size={14} color="#D4AF37" />
            <span style={{ fontSize: 12, color: '#8F7212', fontWeight: 700 }}>Admin Panel</span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>— You have full platform access. Actions here affect all users.</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
