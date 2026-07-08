'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedButton } from '@/components/ui/Animations';
import { FaArrowRight, FaEye, FaEyeSlash, FaCircleCheck } from 'react-icons/fa6';
import api from '@/lib/api';

const F = "'Quicksand', sans-serif";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = params.get('token') || '';
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: F, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: F }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="p-6 md:p-10"
        style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, maxWidth: 420, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, background: '#D4AF37', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#111111' }}>B</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>Bems<span style={{ fontWeight: 500, color: '#94A3B8' }}>Screens</span></span>
        </Link>

        {!done ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', margin: '0 0 6px' }}>Set new password</h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>Choose a strong password for your account.</p>
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={e => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                    {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <AnimatedButton
              type="submit"
              loading={loading}
              loadingText="Resetting"
              style={{ width: '100%', padding: '13px', background: '#D4AF37', color: '#111111', borderRadius: 11, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(212,175,55,0.25)' }}
            >
              <FaArrowRight size={13} /> Set new password
            </AnimatedButton>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#DCFCE7', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <FaCircleCheck size={26} color="#16A34A" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px' }}>Password reset!</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Redirecting you to sign in...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
