'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { FaEye, FaEyeSlash, FaArrowRight, FaLocationDot } from 'react-icons/fa6';
import GoogleButton from '@/components/ui/GoogleButton';
import { AnimatedButton } from '@/components/ui/Animations';
import { motion } from 'framer-motion';

const F = "'Quicksand', sans-serif";

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 14,
    fontFamily: F, color: '#F8FAFC', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  };
  const onFocus = (e: any) => { 
    e.target.style.borderColor = '#D4AF37'; 
    e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.15)'; 
    e.target.style.background = 'rgba(255,255,255,0.05)';
  };
  const onBlur  = (e: any) => { 
    e.target.style.borderColor = 'rgba(255,255,255,0.1)'; 
    e.target.style.boxShadow = 'none'; 
    e.target.style.background = 'rgba(255,255,255,0.03)';
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 800, color: '#94A3B8', display: 'block',
    marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      router.push((user as any)?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Incorrect email or password', 'error');
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #0a0a0a 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr', color: '#F8FAFC' }}>

      {/* Left panel */}
      <div style={{ background: `linear-gradient(to right, rgba(5,5,5,0.95), rgba(5,5,5,0.6)), url("https://images.unsplash.com/photo-1511268559489-34b624fbfcf5?w=1200&q=85&auto=format&fit=crop")`, backgroundSize: 'cover', backgroundPosition: 'center', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <img src="/logo-white.png" alt="Studio Arella Logo" style={{ height: 80, objectFit: 'contain' }} />
          </Link>
          <h2 style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 900, color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15 }}>Welcome back to<br />Studio Arella</h2>
          <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.7, margin: '0 0 40px', fontWeight: 500, maxWidth: 400 }}>
            Sign in to manage your ad campaigns, track impressions, and book new slots on the Studio Arella screen at Bems Junction.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['₦1,000/minute','Starting price for ad slots'],['Bems Junction','Umuahia\'s highest-traffic location'],['Instant delivery','Your ad goes live immediately']].map(([v,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', flexShrink: 0, boxShadow: '0 0 10px rgba(212,175,55,0.5)' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{v}</span>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>— {l}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '18px 22px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#22c55e', letterSpacing: '0.06em' }}>SCREEN ONLINE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaLocationDot size={13} color="#D4AF37" />
            <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>Bems Junction, Finbars by Bende Road, Umuahia</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', background: '#0a0a0a', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 60%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} 
          style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
          
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F8FAFC', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Sign in</h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 28px', fontWeight: 500 }}>
            Don't have an account?{' '}
            <Link href="/auth/register" style={{ color: '#D4AF37', fontWeight: 800, textDecoration: 'none' }}>Create one free →</Link>
          </p>

          <GoogleButton label="Continue with Google" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={labelStyle}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ ...inputStyle, paddingRight: 44 }} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <AnimatedButton
              type="submit"
              loading={loading}
              loadingText="Signing in"
              style={{ width: '100%', padding: '13px', background: '#D4AF37', color: '#111111', borderRadius: 12, fontSize: 15, fontWeight: 800, boxShadow: '0 8px 24px rgba(212,175,55,0.3)', marginTop: 8 }}
            >
              Sign in <FaArrowRight size={14} />
            </AnimatedButton>
          </form>

          <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 24, lineHeight: 1.6, fontWeight: 500 }}>
            By signing in you agree to our{' '}
            <Link href="/support" style={{ color: '#94A3B8', textDecoration: 'none' }}>Terms</Link> &amp;{' '}
            <Link href="/support" style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
