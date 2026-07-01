'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { FaEye, FaEyeSlash, FaArrowRight, FaLocationDot } from 'react-icons/fa6';
import GoogleButton from '@/components/ui/GoogleButton';
import { AnimatedButton } from '@/components/ui/Animations';
import { motion } from 'framer-motion';

const F = "'Quicksand', sans-serif";
const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, fontSize: 14, fontFamily: F, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', fontWeight: 600, transition: 'border-color 0.2s, box-shadow 0.2s' };
const onF = (e: any) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; };
const onB = (e: any) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; };

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      router.push((user as any)?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Incorrect email or password');
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: '#F4F5F9', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

      {/* Left panel */}
      <div style={{ background: '#1A1A1A', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <img src="/logo-white.png" alt="Studio Arella Logo" style={{ height: 80, objectFit: 'contain' }} />
          </Link>
          <h2 style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15 }}>Welcome back to<br />Studio Arella</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 40px', fontWeight: 500 }}>
            Sign in to manage your ad campaigns, track impressions, and book new slots on the Studio Arella screen at Bems Junction.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['₦1,000/minute','Starting price for ad slots'],['Bems Junction','Umuahia\'s highest-traffic location'],['Instant delivery','Your ad goes live immediately']].map(([v,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{v}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>— {l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '18px 22px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#22c55e', letterSpacing: '0.06em' }}>SCREEN ONLINE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaLocationDot size={13} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Bems Junction, Finbars by Bende Road, Umuahia</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', background: '#F4F5F9' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Sign in</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px', fontWeight: 500 }}>
            Don't have an account?{' '}
            <Link href="/auth/register" style={{ color: '#D4AF37', fontWeight: 800, textDecoration: 'none' }}>Create one free →</Link>
          </p>

          <GoogleButton label="Continue with Google" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 20, fontWeight: 600 }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#1A1A1A', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inp} onFocus={onF} onBlur={onB} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ ...inp, paddingRight: 44 }} onFocus={onF} onBlur={onB} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <AnimatedButton
              type="submit"
              loading={loading}
              loadingText="Signing in"
              style={{ width: '100%', padding: '13px', background: '#D4AF37', color: '#111111', borderRadius: 12, fontSize: 15, fontWeight: 800, boxShadow: '0 4px 14px rgba(212,175,55,0.3)', marginTop: 4 }}
            >
              Sign in <FaArrowRight size={14} />
            </AnimatedButton>
          </form>

          <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 24, lineHeight: 1.6, fontWeight: 500 }}>
            By signing in you agree to our{' '}
            <Link href="/support" style={{ color: '#64748B', textDecoration: 'none' }}>Terms</Link> &amp;{' '}
            <Link href="/support" style={{ color: '#64748B', textDecoration: 'none' }}>Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
