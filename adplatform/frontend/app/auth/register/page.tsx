'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import {
  FaEye, FaEyeSlash, FaArrowRight, FaCheck,
  FaLocationDot, FaChartLine, FaBolt, FaCreditCard, FaBuilding, FaPhone,
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
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score-1] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: score > 0 ? colors[score-1] : '#94A3B8' }}>{score > 0 ? labels[score-1] : ''}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 10, color: c.pass ? '#22c55e' : '#64748B', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.pass ? '#22c55e' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  const { register, isLoading } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14,
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
    fontSize: 11, fontWeight: 700, color: '#94A3B8', display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim())    { toast('Please enter your first name', 'error'); return; }
    if (!form.last_name.trim())     { toast('Please enter your last name', 'error'); return; }
    if (!form.email.trim())         { toast('Please enter your email', 'error'); return; }
    if (form.password.length < 6)   { toast('Password must be at least 6 characters', 'error'); return; }
    if (form.password !== form.confirm_password) { toast('Passwords do not match', 'error'); return; }
    try {
      await register(form.first_name, form.last_name, form.email, form.password, form.business_name || undefined, form.phone || undefined);
      router.push('/onboarding');
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Response data:', err?.response?.data);
      console.error('Status:', err?.response?.status);
      const msg = err?.response?.data?.message 
        || err?.response?.data?.error 
        || err?.message 
        || 'Registration failed. Please try again.';
      toast(msg, 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2" style={{ fontFamily: F, minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #0a0a0a 100%)', color: '#F8FAFC' }}>
      
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between" style={{ background: `linear-gradient(to right, rgba(5,5,5,0.95), rgba(5,5,5,0.6)), url("https://images.unsplash.com/photo-1511268559489-34b624fbfcf5?w=1200&q=85&auto=format&fit=crop")`, backgroundSize: 'cover', backgroundPosition: 'center', padding: 48, position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 52 }}>
            <img src="/logo-white.png" alt="Studio Arella Logo" style={{ height: 80, objectFit: 'contain' }} />
          </Link>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 100, padding: '4px 12px', marginBottom: 22, backdropFilter: 'blur(8px)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>Screen live at Bems Junction, Umuahia</span>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#F8FAFC', margin: '0 0 14px', letterSpacing: '-0.6px', lineHeight: 1.15 }}>
            Get your business seen<br />by thousands every day.
          </h2>
          <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.75, margin: '0 0 36px', maxWidth: 400 }}>
            Book ad slots on the Studio Arella LED screen at Bems Junction — starting from just ₦1,000 per minute. No agency fees, no long contracts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { Icon: FaCheck,      color: '#22c55e', text: 'Free to join — no credit card required' },
              { Icon: FaBolt,       color: '#D4AF37', text: 'Book and go live in under an hour' },
              { Icon: FaChartLine,  color: '#06B6D4', text: 'Real-time impression tracking dashboard' },
              { Icon: FaCreditCard, color: '#EAB308', text: 'Secure payment via Monnify' },
            ].map(({ Icon, color, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(255,255,255,0.03)`, border: `1px solid rgba(255,255,255,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </div>
                <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FaLocationDot size={12} color="#D4AF37" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>Studio Arella · Bems Junction, Umuahia</span>
          </div>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 6px', lineHeight: 1.5 }}>
            10ft × 6ft digital LED display at one of Umuahia's highest-traffic points. Thousands of daily road users.
          </p>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>From ₦1,000 per minute</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex items-center justify-center p-6 md:p-12 lg:p-14" style={{ overflowY: 'auto', background: '#0a0a0a', position: 'relative' }}>
        
        {/* Subtle background glow for the form area */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 60%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="w-full max-w-[420px] p-6 md:p-10"
          style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F8FAFC', margin: '0 0 4px', letterSpacing: '-0.4px' }}>Create your account</h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 20px' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none' }}>Sign in now</Link>
          </p>

          <GoogleButton label="Sign up with Google" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or register with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <FaBuilding size={9} /> Business / Brand name <span style={{ color: '#64748B', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
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
                  <FaPhone size={9} /> Phone number <span style={{ color: '#64748B', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
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

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10, marginBottom: 4 }}>
              <input type="checkbox" id="terms" required style={{ marginTop: 2, accentColor: '#D4AF37', cursor: 'pointer', width: 14, height: 14 }} />
              <label htmlFor="terms" style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, cursor: 'pointer' }}>
                I agree to the <Link href="/terms" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
              </label>
            </div>

            <AnimatedButton
              type="submit"
              loading={isLoading}
              loadingText="Creating account"
              style={{ width: '100%', padding: '13px', background: '#D4AF37', color: '#111111', borderRadius: 11, fontSize: 15, fontWeight: 800, boxShadow: '0 8px 24px rgba(212,175,55,0.3)', marginTop: 8 }}
            >
              Create free account <FaArrowRight size={14} />
            </AnimatedButton>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
// force rebuild