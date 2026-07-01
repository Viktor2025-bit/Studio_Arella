'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCircleCheck, FaCircleXmark, FaArrowRight } from 'react-icons/fa6';
import api from '@/lib/api';

const F = "'Quicksand', sans-serif";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(r => { setStatus('success'); setMessage(r.data.message); })
      .catch(e => { setStatus('error'); setMessage(e?.response?.data?.message || 'Verification failed.'); });
  }, [params]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: F }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, background: '#D4AF37', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#111111' }}>B</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>Bems<span style={{ fontWeight: 500, color: '#94A3B8' }}>Screens</span></span>
        </Link>

        {status === 'loading' && (
          <>
            <div style={{ width: 44, height: 44, border: '3px solid #E3C762', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 20px' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <FaCircleCheck size={28} color="#16A34A" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px' }}>Email verified!</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
              Go to dashboard <FaArrowRight size={13} />
            </Link>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', border: '2px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <FaCircleXmark size={28} color="#EF4444" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px' }}>Verification failed</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <ResendButton />
              <Link href="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '10px 20px', borderRadius: 10, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                Sign in
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function ResendButton() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const F = "'Quicksand', sans-serif";

  if (sent) return <p style={{ fontSize: 13, color: '#16A34A', fontWeight: 700 }}>Sent! Check your inbox.</p>;

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)}
        style={{ padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13, fontFamily: F, outline: 'none', width: 180 }} />
      <button onClick={async () => {
        if (!email) return; setSending(true);
        await api.post('/auth/resend-verification', { email }).catch(() => {});
        setSent(true); setSending(false);
      }} style={{ padding: '9px 14px', background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
        {sending ? '...' : 'Resend'}
      </button>
    </div>
  );
}
