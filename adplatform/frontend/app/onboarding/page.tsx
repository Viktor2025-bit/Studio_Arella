'use client';
import { AnimatedButton, BouncingDots } from '@/components/ui/Animations';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  FaArrowRight, FaCheck, FaChartLine, FaLocationDot,
  FaCreditCard, FaRocket, FaCalendarCheck, FaGaugeHigh, FaPaintbrush, FaMicrophone
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
    <div style={{ fontFamily: F, minHeight: '100vh', background: theme.color.bg, display: 'flex', position: 'relative' }}>
      {showConfetti && <Confetti />}

      {/* LEFT PANEL: Visuals & Brand (Hidden on mobile) */}
      <div className="hidden lg:flex" style={{ flex: 1, flexDirection: 'column', padding: '64px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)` }}>
        
        {/* Animated abstract background elements */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '140%', background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 50%)', zIndex: 0 }} />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: '0%', left: '0%', width: '100%', height: '100%', background: 'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 60%)', zIndex: 0 }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 'auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo-white.png" alt="Studio Arella Logo" style={{ height: 48, objectFit: 'contain' }} />
          </Link>
        </div>

        {/* Hero Text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(40px, 4vw, 56px)', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 24 }}>
            Your creative vision,<br />amplified.
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.6, maxWidth: 480, fontWeight: 500 }}>
            Studio Arella Media Hub is Umuahia's premier destination for high-impact digital screen advertising and professional podcast production.
          </p>
        </div>

        {/* Feature Cards */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', display: 'flex', gap: 24 }}>
           <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 24, borderRadius: 16, backdropFilter: 'blur(10px)', flex: 1 }}>
             <FaLocationDot size={24} color={theme.color.gold} style={{ marginBottom: 16 }} />
             <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC', marginBottom: 4 }}>Bems Junction Screen</div>
             <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Reach 15,000+ daily road users</div>
           </div>
           <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 24, borderRadius: 16, backdropFilter: 'blur(10px)', flex: 1 }}>
             <FaMicrophone size={24} color="#8B5CF6" style={{ marginBottom: 16 }} />
             <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC', marginBottom: 4 }}>Premium Podcast Studio</div>
             <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Professional mics & acoustics</div>
           </div>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: theme.color.bg, position: 'relative', zIndex: 2 }}>
        
        {/* Mobile Logo */}
        <div style={{ position: 'absolute', top: 32, left: 24, display: 'block' }}>
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 1024px) { .mobile-logo { display: none !important; } }
          `}} />
          <Link href="/" className="mobile-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
             <img src="/logo.png" alt="Studio Arella Logo" style={{ height: 40, objectFit: 'contain' }} />
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: 440 }}>
          <ProgressBar step={step} total={3} />

          <AnimatePresence mode="wait">

            {/* Step 1: Welcome */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: theme.color.gold, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Step 1 of 3</p>
                <h1 style={{ fontFamily: theme.font.display, fontSize: 32, fontWeight: 600, color: theme.color.text1, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                  Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                </h1>
                <p style={{ fontSize: 14, color: theme.color.text2, margin: '0 0 32px', lineHeight: 1.7 }}>
                  Your account is ready. You can now book advertising slots on our <strong style={{ color: theme.color.text1 }}>Digital Screen</strong> or reserve sessions in our <strong style={{ color: theme.color.text1 }}>Podcast Studio</strong>.
                </p>

                {/* What you can do */}
                <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 14, padding: '20px 22px', marginBottom: 24, boxShadow: theme.shadow.sm }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: theme.color.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>What you can do</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { Icon: FaLocationDot,   color: theme.color.gold, bg: theme.color.goldLight, border: theme.color.goldMid, text: 'Book ad slots on the Studio Arella LED screen' },
                      { Icon: FaMicrophone,    color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', text: 'Reserve sessions in our premium podcast studio' },
                      { Icon: FaPaintbrush,    color: theme.color.goldDark, bg: '#FEF3C7', border: '#FDE68A', text: 'Request our creative team to design or film for you' },
                      { Icon: FaCreditCard,    color: theme.color.success, bg: theme.color.successLight, border: '#C7E0BE', text: 'Pay securely via Monnify using cards or bank transfer' },
                    ].map(({ Icon, color, bg, border, text }) => (
                      <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={15} color={color} />
                        </div>
                        <span style={{ fontSize: 13, color: theme.color.text2, lineHeight: 1.4, fontWeight: 500 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <motion.button onClick={() => setStep(2)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ width: '100%', padding: '14px', background: theme.color.gold, color: theme.color.charcoal900, border: 'none', borderRadius: 11, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: F, boxShadow: theme.shadow.gold }}>
                    Get started <FaArrowRight size={14} />
                  </motion.button>
                  <Link href="/dashboard" style={{ textAlign: 'center', fontSize: 13, color: theme.color.text3, textDecoration: 'none', fontWeight: 600 }}>
                    Skip to dashboard
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Step 2: Create first campaign */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: theme.color.gold, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Step 2 of 3</p>
                <h1 style={{ fontFamily: theme.font.display, fontSize: 28, fontWeight: 600, color: theme.color.text1, margin: '0 0 8px', letterSpacing: '-0.3px' }}>Set up a campaign</h1>
                <p style={{ fontSize: 14, color: theme.color.text2, margin: '0 0 26px', lineHeight: 1.6 }}>
                  If you're booking screen ads, give your campaign a name and an optional budget. You can change this later.
                </p>

                <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 14, padding: '22px', display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 22, boxShadow: theme.shadow.sm }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: theme.color.text2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campaign name</label>
                    <input type="text" placeholder="e.g. Grand Opening — August 2025" value={campaignName}
                      onChange={e => setCampaignName(e.target.value)} style={inputStyle} autoFocus onFocus={onFocus} onBlur={onBlur} />
                    <p style={{ fontSize: 11, color: theme.color.text4, margin: '6px 0 0', fontWeight: 500 }}>What are you advertising? A product launch, event, business promo?</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: theme.color.text2, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly budget range (optional)</label>
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
                    style={{ padding: '14px 22px', background: theme.color.surface, color: theme.color.text2, border: `1.5px solid ${theme.color.border}`, borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: F, fontWeight: 700 }}>
                    Back
                  </button>
                  <motion.button onClick={handleStep2} disabled={saving} whileHover={!saving ? { scale: 1.02 } : {}} whileTap={!saving ? { scale: 0.98 } : {}}
                    style={{ flex: 1, padding: '14px', background: saving ? theme.color.goldMid : theme.color.gold, color: theme.color.charcoal900, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.75 : 1, fontFamily: F, boxShadow: theme.shadow.gold }}>
                    {saving ? 'Saving...' : <><span>{campaignName.trim() ? 'Create & continue' : 'Skip for now'}</span><FaArrowRight size={13} /></>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: All done */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                  style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color.gold}, ${theme.color.charcoal700})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', boxShadow: theme.shadow.gold }}>
                  <FaRocket size={28} color="#fff" />
                </motion.div>

                <p style={{ fontSize: 11, fontWeight: 700, color: theme.color.success, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Account ready</p>
                <h1 style={{ fontFamily: theme.font.display, fontSize: 28, fontWeight: 600, color: theme.color.text1, margin: '0 0 10px', letterSpacing: '-0.3px' }}>
                  You're all set{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                </h1>
                <p style={{ fontSize: 14, color: theme.color.text2, margin: '0 0 30px', lineHeight: 1.7, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                  Your advertiser account is fully set up. Book your first Digital Screen slot or Podcast Studio session today.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
                  {NEXT_ACTIONS.map(({ Icon, color, bg, border, title, sub, href }) => (
                    <Link key={title} href={href} style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.color.gold; (e.currentTarget as HTMLElement).style.boxShadow = theme.shadow.sm; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.color.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} color={color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1, margin: '0 0 2px' }}>{title}</p>
                        <p style={{ fontSize: 12, color: theme.color.text3, margin: 0, fontWeight: 500 }}>{sub}</p>
                      </div>
                      <FaArrowRight size={12} color={theme.color.border} />
                    </Link>
                  ))}
                </div>

                <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: theme.color.gold, color: theme.color.charcoal900, padding: '14px 32px', borderRadius: 11, fontSize: 15, fontWeight: 800, textDecoration: 'none', fontFamily: F, boxShadow: theme.shadow.gold, transition: 'transform 0.1s', }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.98)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
                  Go to my dashboard <FaArrowRight size={14} />
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
