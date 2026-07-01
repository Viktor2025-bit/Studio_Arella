'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedButton } from '@/components/ui/Animations';
import { FaArrowRight, FaEnvelope } from 'react-icons/fa6';
import api from '@/lib/api';

const F = "'Quicksand', sans-serif";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/auth/forgot-password', { email }).catch(() => {});
    setSent(true); setLoading(false);
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: F, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: F }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 40, maxWidth: 420, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, background: '#D4AF37', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#111111' }}>B</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>Bems<span style={{ fontWeight: 500, color: '#94A3B8' }}>Screens</span></span>
        </Link>

        {!sent ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', margin: '0 0 6px' }}>Forgot your password?</h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>Enter your email and we'll send you a reset link valid for 15 minutes.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <AnimatedButton
              type="submit"
              loading={loading}
              loadingText="Sending"
              style={{ width: '100%', padding: '13px', background: '#D4AF37', color: '#111111', borderRadius: 11, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(212,175,55,0.25)' }}
            >
              <FaEnvelope size={13} /> Send reset link
            </AnimatedButton>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#F9F6EA', border: '2px solid #E3C762', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <FaEnvelope size={24} color="#D4AF37" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px' }}>Check your inbox</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>
              If <strong>{email}</strong> is registered, a password reset link has been sent. Check your spam folder if you don't see it.
            </p>
            <p style={{ fontSize: 12, color: '#CBD5E1', margin: '0 0 18px' }}>The link expires in 15 minutes.</p>
          </div>
        )}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginTop: 20 }}>
          <Link href="/auth/login" style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none' }}>← Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
