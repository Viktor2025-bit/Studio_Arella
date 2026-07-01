'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  FaEye, FaEyeSlash, FaArrowRight, FaCheck,
  FaLocationDot, FaChartLine, FaBolt, FaCreditCard, FaUser, FaBuilding, FaPhone,
} from 'react-icons/fa6';
import GoogleButton from '@/components/ui/GoogleButton';
import { motion } from 'framer-motion';
import { AnimatedButton } from '@/components/ui/Animations';

const F = "'Quicksand', sans-serif";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#EF4444', '#D4AF37', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score-1] : '#F3F4F6', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: score > 0 ? colors[score-1] : '#94A3B8' }}>{score > 0 ? labels[score-1] : ''}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 10, color: c.pass ? '#22c55e' : '#CBD5E1', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.pass ? '#22c55e' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.pass && <FaCheck size={5} color="#fff" />}
              </div>
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm_password: '',
    business_name: '', phone: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: '#fff',
    border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14,
    fontFamily: F, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const onFocus = (e: any) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; };
  const onBlur  = (e: any) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#475569', display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.first_name.trim())    { setError('Please enter your first name'); return; }
    if (!form.last_name.trim())     { setError('Please enter your last name'); return; }
    if (!form.email.trim())         { setError('Please enter your email'); return; }
    if (form.password.length < 6)   { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    try {
      await register(form.first_name, form.last_name, form.email, form.password, form.business_name || undefined, form.phone || undefined);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={{ fontFamily: F, minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F4F5F9' }}>

      {/* â”€â”€ Left panel â”€â”€ */}
      <div style={{ background: '#1A1A1A', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 52 }}>
            <img src="/logo-white.png" alt="Studio Arella Logo" style={{ height: 80, objectFit: 'contain' }} />
          </Link>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 100, padding: '4px 12px', marginBottom: 22 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>Screen live at Bems Junction, Umuahia</span>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.6px', lineHeight: 1.15 }}>
            Get your business seen<br />by thousands every day.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, margin: '0 0 36px' }}>
            Book ad slots on the Studio Arella LED screen at Bems Junction â€” starting from just â‚¦1,000 per minute. No agency fees, no long contracts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { Icon: FaCheck,      color: '#22c55e', text: 'Free to join â€” no credit card required' },
              { Icon: FaBolt,       color: '#D4AF37', text: 'Book and go live in under an hour' },
              { Icon: FaChartLine,  color: '#60A5FA', text: 'Real-time impression tracking dashboard' },
              { Icon: FaCreditCard, color: '#E8CE5E', text: 'Secure payment via Monnify' },
            ].map(({ Icon, color, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FaLocationDot size={12} color="#D4AF37" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37' }}>Studio Arella Â· Bems Junction, Umuahia</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', lineHeight: 1.5 }}>
            10ft Ã— 6ft digital LED display at one of Umuahia's highest-traffic points. Thousands of daily road users.
          </p>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#D4AF37', margin: 0 }}>From â‚¦1,000 per minute</p>
        </div>
      </div>

      {/* â”€â”€ Right panel â”€â”€ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ width: '100%', maxWidth: 420 }}>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.4px' }}>Create your account</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none' }}>Sign in now</Link>
          </p>

          <GoogleButton label="Sign up with Google" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>or register with email</span>
            <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13, padding: '11px 14px', borderRadius: 10, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>First name *</label>
                <input type="text" placeholder="e.g. Chukwuemeka"
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  required autoFocus style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={labelStyle}>Last name *</label>
                <input type="text" placeholder="e.g. Agu"
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            {/* Business name */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FaBuilding size={9} /> Business / Brand name <span style={{ color: '#94A3B8', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </span>
              </label>
              <input type="text" placeholder="e.g. Agu Supermarket"
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FaPhone size={9} /> Phone number <span style={{ color: '#94A3B8', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </span>
              </label>
              <input type="tel" placeholder="e.g. 08012345678"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email address *</label>
              <input type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required style={{ ...inputStyle, paddingRight: 44 }} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                  {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPw ? 'text' : 'password'} placeholder="Confirm your password"
                  value={form.confirm_password}
                  onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                  required style={{ ...inputStyle, paddingRight: 44 }} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                  {showConfirmPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <AnimatedButton
              type="submit"
              loading={isLoading}
              loadingText="Creating account"
              style={{ width: '100%', padding: '13px', background: '#D4AF37', color: '#111111', borderRadius: 11, fontSize: 15, fontWeight: 800, boxShadow: '0 4px 14px rgba(212,175,55,0.3)', marginTop: 4 }}
            >
              Create free account <FaArrowRight size={14} />
            </AnimatedButton>
          </form>

          <p style={{ fontSize: 11, color: '#CBD5E1', textAlign: 'center', marginTop: 18, lineHeight: 1.6 }}>
            By creating an account you agree to our{' '}
            <Link href="/support" style={{ color: '#94A3B8', textDecoration: 'none' }}>Terms</Link>
            {' '}&amp;{' '}
            <Link href="/support" style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

