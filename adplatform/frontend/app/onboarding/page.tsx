'use client';
import { AnimatedButton, BouncingDots } from '@/components/ui/Animations';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  FaArrowRight, FaCheck, FaChartLine, FaLocationDot,
  FaCreditCard, FaRocket, FaCalendarCheck, FaGaugeHigh, FaPaintbrush,
} from 'react-icons/fa6';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';

const F = theme.font.body;

function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const colors = [theme.color.gold, theme.color.glitchMagenta, theme.color.goldMid, theme.color.charcoal900, theme.color.success, theme.color.glitchCyan];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 2, d: Math.random() * 80 + 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10, ts: Math.random() * 0.1 + 0.04,
    }));
    let angle = 0, frame: number;
    let startTime: number | null = null;
    const TOTAL = 8000;   // run for 8 seconds
    const FADE  = 6000;   // start fading at 6 seconds

    const draw = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      // Graceful fade-out in final 2 seconds
      if (elapsed >= FADE) {
        canvas.style.opacity = String(Math.max(0, 1 - (elapsed - FADE) / (TOTAL - FADE)));
      }
      if (elapsed >= TOTAL) { canvas.style.opacity = '0'; return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angle += 0.01;
      pieces.forEach((p, i) => {
        p.tilt += p.ts; p.y += (Math.cos(angle + p.d) + 2) * 1.4; p.x += Math.sin(angle) * 0.7;
        if (p.y > canvas.height + 10) pieces[i] = { ...p, y: -10, x: Math.random() * canvas.width };
        ctx.beginPath(); ctx.lineWidth = p.r / 2; ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4); ctx.stroke();
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, opacity: 1 }} />;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i} animate={{ flex: i < step ? 2 : 1 }}
          style={{ height: 4, borderRadius: 2, background: i < step ? theme.color.gold : theme.color.border, transition: 'background 0.4s' }} />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { user, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadFromStorage();
    const t = localStorage.getItem('token');
    if (!t) router.push('/auth/login');
  }, []);

  const handleStep2 = async () => {
    setSaving(true);
    try {
      if (campaignName.trim()) {
        await api.post('/campaigns', { name: campaignName, budget: parseFloat(budget) || 0 });
      }
    } catch {}
    setSaving(false);
    setShowConfetti(true);
    setStep(3);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: theme.color.surface,
    border: `1.5px solid ${theme.color.border}`, borderRadius: 10, fontSize: 14,
    fontFamily: F, color: theme.color.text1, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const onFocus = (e: any) => { e.target.style.borderColor = theme.color.gold; e.target.style.boxShadow = `0 0 0 3px rgba(224,165,38,0.14)`; };
  const onBlur  = (e: any) => { e.target.style.borderColor = theme.color.border; e.target.style.boxShadow = 'none'; };

  const BUDGETS = ['Under ₦10,000', '₦10k – ₦50k', '₦50k – ₦200k', '₦200k+'];

  const NEXT_ACTIONS = [
    { Icon: FaLocationDot,   color: theme.color.gold, bg: theme.color.goldLight, border: theme.color.goldMid, title: 'Book your first ad slot',     sub: 'Pick a date on the Studio Arella calendar', href: '/book' },
    { Icon: FaCreditCard,    color: theme.color.success, bg: theme.color.successLight, border: '#C7E0BE', title: 'Add credits to your account', sub: 'Pay via Monnify — cards or bank transfer',       href: '/finances' },
    { Icon: FaPaintbrush,    color: theme.color.goldDark, bg: '#F5F3FF', border: '#DDD6FE', title: 'Request our creative team',   sub: 'We design and film your ad for you',         href: '/creative' },
    { Icon: FaGaugeHigh,     color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', title: 'Go to your dashboard',        sub: 'See all your campaigns and stats',            href: '/dashboard' },
  ];

  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: theme.color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative' }}>
      {showConfetti && <Confetti />}

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Studio Arella Logo" style={{ height: 48, objectFit: 'contain' }} />
          </Link>
        </div>

        <ProgressBar step={step} total={3} />

        <AnimatePresence mode="wait">

          {/* Step 1: Welcome + name confirm */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: theme.color.gold, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Step 1 of 3</p>
              <h1 style={{ fontFamily: theme.font.display, fontSize: 32, fontWeight: 600, color: theme.color.text1, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h1>
              <p style={{ fontSize: 14, color: theme.color.text2, margin: '0 0 32px', lineHeight: 1.7 }}>
                Your Bems Screens account is ready. You can now book ad slots on the <strong style={{ color: theme.color.text1 }}>Studio Arella</strong> LED screen at Bems Junction, Umuahia — reaching thousands of daily road users.
              </p>

              {/* What you can do */}
              <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 14, padding: '20px 22px', marginBottom: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: theme.color.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>What you can do on this platform</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { Icon: FaCalendarCheck, color: theme.color.gold, bg: theme.color.goldLight, border: theme.color.goldMid, text: 'Book ad slots on Studio Arella from anywhere in the world' },
                    { Icon: FaChartLine,     color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', text: 'Track real-time impressions on your live campaigns' },
                    { Icon: FaPaintbrush,    color: theme.color.goldDark, bg: '#F5F3FF', border: '#DDD6FE', text: 'Request our creative team to design or film your ad' },
                    { Icon: FaCreditCard,    color: theme.color.success, bg: theme.color.successLight, border: '#C7E0BE', text: 'Pay securely via Monnify — cards or bank transfer' },
                  ].map(({ Icon, color, bg, border, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} color={color} />
                      </div>
                      <span style={{ fontSize: 13, color: theme.color.text2, lineHeight: 1.4 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button onClick={() => setStep(2)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: '13px', background: theme.color.gold, color: theme.color.charcoal900, border: 'none', borderRadius: 11, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: F }}>
                Get started <FaArrowRight size={14} />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Create first campaign */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: theme.color.gold, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Step 2 of 3</p>
              <h1 style={{ fontFamily: theme.font.display, fontSize: 28, fontWeight: 600, color: theme.color.text1, margin: '0 0 8px', letterSpacing: '-0.3px' }}>Set up your first campaign</h1>
              <p style={{ fontSize: 14, color: theme.color.text2, margin: '0 0 26px', lineHeight: 1.6 }}>
                Give your advertising campaign a name and an optional budget. You can change everything later from your dashboard.
              </p>

              <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 14, padding: '22px', display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 22 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campaign name</label>
                  <input type="text" placeholder="e.g. Grand Opening — August 2025" value={campaignName}
                    onChange={e => setCampaignName(e.target.value)} style={inputStyle} autoFocus onFocus={onFocus} onBlur={onBlur} />
                  <p style={{ fontSize: 11, color: theme.color.text4, margin: '5px 0 0' }}>What are you advertising? A product launch, event, business promo?</p>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly budget range (optional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {BUDGETS.map(b => (
                      <button key={b} onClick={() => setBudget(b)}
                        style={{ padding: '10px 12px', border: `1.5px solid ${budget === b ? theme.color.gold : theme.color.border}`, background: budget === b ? theme.color.goldLight : theme.color.surface2, color: budget === b ? theme.color.goldDark : theme.color.text2, borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F, transition: 'all 0.15s' }}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)}
                  style={{ padding: '12px 20px', background: theme.color.surface, color: theme.color.text2, border: `1.5px solid ${theme.color.border}`, borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: F, fontWeight: 600 }}>
                  Back
                </button>
                <motion.button onClick={handleStep2} disabled={saving} whileHover={!saving ? { scale: 1.02 } : {}} whileTap={!saving ? { scale: 0.98 } : {}}
                  style={{ flex: 1, padding: '12px', background: saving ? theme.color.goldMid : theme.color.gold, color: theme.color.charcoal900, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: saving ? 0.75 : 1, fontFamily: F }}>
                  {saving ? 'Saving...' : <><span>{campaignName.trim() ? 'Create campaign & continue' : 'Skip for now'}</span><FaArrowRight size={13} /></>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: All done */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color.gold}, ${theme.color.charcoal700})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
                <FaRocket size={28} color="#fff" />
              </motion.div>

              <p style={{ fontSize: 11, fontWeight: 700, color: theme.color.success, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Account ready</p>
              <h1 style={{ fontFamily: theme.font.display, fontSize: 28, fontWeight: 600, color: theme.color.text1, margin: '0 0 10px', letterSpacing: '-0.3px' }}>
                You're all set{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h1>
              <p style={{ fontSize: 14, color: theme.color.text2, margin: '0 0 30px', lineHeight: 1.7, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                Your Bems Screens advertiser account is ready. Book your first Studio Arella slot and get your business in front of thousands of people at Bems Junction today.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
                {NEXT_ACTIONS.map(({ Icon, color, bg, border, title, sub, href }) => (
                  <Link key={title} href={href} style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.color.gold; (e.currentTarget as HTMLElement).style.boxShadow = theme.shadow.gold; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.color.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: theme.color.text1, margin: '0 0 2px' }}>{title}</p>
                      <p style={{ fontSize: 11, color: theme.color.text3, margin: 0 }}>{sub}</p>
                    </div>
                    <FaArrowRight size={12} color={theme.color.border} />
                  </Link>
                ))}
              </div>

              <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: theme.color.gold, color: theme.color.charcoal900, padding: '13px 32px', borderRadius: 11, fontSize: 15, fontWeight: 800, textDecoration: 'none', fontFamily: F, boxShadow: theme.shadow.gold }}>
                Go to my dashboard <FaArrowRight size={14} />
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
