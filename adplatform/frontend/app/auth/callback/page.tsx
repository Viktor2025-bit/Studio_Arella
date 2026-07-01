'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaCircleCheck, FaCircleXmark } from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    if (error) { setErrorMsg('Google sign-in failed. Please try again.'); setStatus('error'); return; }
    if (!token) { setErrorMsg('No authentication token received.'); setStatus('error'); return; }
    const user = {
      id: searchParams.get('id') || '',
      name: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      role: (searchParams.get('role') || 'advertiser') as any,
      credits: parseFloat(searchParams.get('credits') || '0'),
      avatar: searchParams.get('avatar') || undefined,
    };
    const isNew = searchParams.get('new') === '1';
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    updateUser(user);
    router.replace(isNew ? '/onboarding' : user.role === 'admin' ? '/admin' : '/dashboard');
  }, [searchParams, router, updateUser]);

  const btnStyle = (primary: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '11px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    textDecoration: 'none', border: primary ? 'none' : '1.5px solid #E5E7EB',
    background: primary ? '#D4AF37' : '#fff', color: primary  ? '#111111' : '#475569',
  });

  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, background: '#D4AF37', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#111111' }}>B</div>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>Bems<span style={{ fontWeight: 400, color: '#94A3B8' }}>Screens</span></span>
      </Link>

      {status === 'loading' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid #E3C762', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px' }}>Signing you in with Google...</p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>This only takes a second</p>
        </div>
      )}

      {status === 'error' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 36, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <FaCircleXmark size={28} color="#EF4444" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>Sign-in failed</h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>{errorMsg}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/auth/login" style={btnStyle(true)}>Back to login <FaArrowRight size={12} /></Link>
            <Link href="/auth/register" style={btnStyle(false)}>Register with email</Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
