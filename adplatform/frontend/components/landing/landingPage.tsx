'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  FaLocationDot, FaDisplay, FaBolt, FaBullhorn, FaArrowRight,
  FaMapPin, FaStar, FaChevronDown, FaXTwitter, FaLinkedinIn, 
  FaInstagram, FaPhone, FaEnvelope, FaPlay, FaFilm, FaPaintbrush,
} from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";

function useTypewriter(phrases: string[], speed = 110, pause = 2400) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = phrases[phraseIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx <= current.length) {
      t = setTimeout(() => { setDisplayed(current.slice(0, charIdx)); setCharIdx(i => i + 1); }, speed);
    } else if (!deleting && charIdx > current.length) {
      t = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      t = setTimeout(() => { setDisplayed(current.slice(0, charIdx - 1)); setCharIdx(i => i - 1); }, speed / 2.5);
    } else {
      setDeleting(false); setPhraseIdx(i => (i + 1) % phrases.length);
    }
    return () => clearTimeout(t);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);
  return displayed;
}

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}


const PLANS = [
  { name: 'Starter', minutes: 1, price: 1000, popular: false },
  { name: 'Standard', minutes: 5, price: 4500, popular: false },
  { name: 'Popular', minutes: 10, price: 8000, popular: true },
  { name: 'Business', minutes: 30, price: 20000, popular: false },
  { name: 'Premium', minutes: 60, price: 35000, popular: false },
  { name: 'Full Day', minutes: 480, price: 80000, popular: false },
];

const SERVICES = [
  { Icon: FaDisplay, color: '#D4AF37', bg: '#F9F6EA', border: '#E3C762', title: 'Digital Screen Advertising', desc: "Your ad displayed on our 10ft × 6ft LED screen at Bems Junction — one of Umuahia's highest-traffic locations." },
  { Icon: FaPaintbrush, color: '#EAB308', bg: '#FEF9C3', border: '#FDE047', title: 'Professional Graphic Design', desc: 'Our creative team designs eye-catching adverts and promotional flyers that effectively communicate your brand\'s message.' },
  { Icon: FaFilm, color: '#06B6D4', bg: '#CFFAFE', border: '#67E8F9', title: 'Video Production', desc: 'We visit your business location, office, store, or event to create high-quality promotional videos at budget-friendly rates.' },
  { Icon: FaBolt, color: '#22C55E', bg: '#DCFCE7', border: '#86EFAC', title: 'Instant Ad Delivery', desc: 'Upload your creative from anywhere in the world. Book your slot, pay online, and your ad goes live — no delays.' },
];

const HOW = [
  { n: '01', title: 'Create your account', body: "Sign up free in seconds — no credit card required. You're instantly ready to start booking ad slots on Studio Arella." },
  { n: '02', title: 'Pick your slot on the calendar', body: 'Browse the live booking calendar. Select your preferred date and time. Choose from plans starting at ₦1,000.' },
  { n: '03', title: 'Upload or request your ad', body: 'Upload your own creative, or let our team create a professional design for you — graphics or video.' },
  { n: '04', title: 'Pay and go live', body: 'Pay securely via Monnify. Your ad is pushed directly to the Studio Arella screen. Track impressions in real time.' },
];

const FAQS = [
  { q: 'Where exactly is the Studio Arella screen located?', a: 'The screen is at Bems Junction, Finbars, Bende Road, Umuahia, Abia State — a high-traffic location with thousands of daily road users. It is a 10ft × 6ft digital LED display.' },
  { q: 'How much does it cost to advertise?', a: 'Plans start from ₦1,000 for a 1-minute slot. We offer packages up to 8-hour full-day bookings. All plans are billed once at time of booking with no hidden fees.' },
  { q: "I don't have an ad — can your team create one?", a: 'Yes. Our professional creative team offers graphic design services and promotional video production. Contact us via the Request Creative page or call 08164523926 to discuss your needs.' },
  { q: 'How do I make payment?', a: 'All payments are processed securely via Monnify. We accept debit cards and bank transfers. Credits are confirmed instantly and your booking goes live immediately.' },
  { q: 'Can I book a slot from outside Umuahia?', a: "Absolutely. That's exactly why we built this platform. Upload your ad, book your slot, make payment — and your ad plays on the Studio Arella screen from anywhere in the world." },
  { q: 'How do I know my ad actually played?', a: 'Your dashboard shows real-time impression tracking — exactly when your ad played, how many times, and estimated audience reach. You always know what you\'re getting.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #E2E8F0' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.4, fontFamily: F }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ width: 32, height: 32, borderRadius: 10, background: open ? '#D4AF37' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FaChevronDown size={12} color={open ? '#fff' : '#64748B'} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.75, margin: '0 0 20px', paddingRight: 48, fontFamily: F, fontWeight: 500 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ value, suffix = '', label, start }: { value: number; suffix?: string; label: string; start: boolean }) {
  const count = useCountUp(value, 1800, start);
  return (
    <div style={{ textAlign: 'center', background: '#fff', padding: '36px 20px', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: '#F9F6EA', marginBottom: 16 }}>
        <FaStar size={20} color="#D4AF37" />
      </div>
      <p style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1, fontFamily: F }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p style={{ fontSize: 14, color: '#64748B', margin: 0, fontWeight: 600 }}>{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const typed = useTypewriter(['book a 1-minute slot for ₦1,000.', 'reach thousands daily at Bems Junction.', 'push your ad live from anywhere.', 'grow your business across Umuahia.', 'advertise without the agency fees.'], 100, 2200);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const statsReveal = useReveal();
  const servicesReveal = useReveal();
  const howReveal = useReveal();
  const plansReveal = useReveal();
  const faqReveal = useReveal();
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(244,245,249,0)', 'rgba(255,255,255,0.97)']);
  const navBorder = useTransform(scrollY, [0, 80], ['rgba(226,232,240,0)', 'rgba(226,232,240,1)']);
  const navShadow = useTransform(scrollY, [0, 80], ['none', '0 4px 20px rgba(0,0,0,0.04)']);

  return (
    <div style={{ fontFamily: F, background: '#F4F5F9', color: '#1A1A1A', overflowX: 'hidden' }}>
      <style>{`
        @keyframes tickerScroll{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
        .ticker-scroll{animation:tickerScroll 22s linear infinite}
        .ticker-scroll.paused{animation-play-state:paused}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .cursor{animation:blink 1s step-end infinite}
        @keyframes floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .float-a{animation:floatA 4s ease-in-out infinite}
        .float-b{animation:floatB 4s ease-in-out 1.5s infinite}
        .plan-card{transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s}
        .plan-card:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(212,175,55,0.15);border-color:#D4AF37 !important}
        .service-card{transition:transform 0.2s,box-shadow 0.2s}
        .service-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,0.06)}
        .nav-link-item{color:#64748B;text-decoration:none;font-size:14px;font-weight:700;transition:color 0.15s}
        .nav-link-item:hover{color:#D4AF37}
        .cta-btn{transition:transform 0.15s,box-shadow 0.15s}
        .cta-btn:hover{transform:translateY(-2px)}
        .orb-1{position:fixed;top:-10%;left:-10%;width:50vw;height:50vw;background:radial-gradient(circle,rgba(196,181,253,0.35) 0%,rgba(244,245,249,0) 70%);border-radius:50%;filter:blur(60px);z-index:0;pointer-events:none}
        .orb-2{position:fixed;top:20%;right:-10%;width:40vw;height:40vw;background:radial-gradient(circle,rgba(253,224,71,0.25) 0%,rgba(244,245,249,0) 70%);border-radius:50%;filter:blur(60px);z-index:0;pointer-events:none}
        .orb-3{position:fixed;bottom:-10%;left:20%;width:45vw;height:45vw;background:radial-gradient(circle,rgba(103,232,249,0.25) 0%,rgba(244,245,249,0) 70%);border-radius:50%;filter:blur(60px);z-index:0;pointer-events:none}
        @media(max-width:768px){.desktop-nav{display:none !important}.mobile-ctas{display:flex !important}.hero-grid{grid-template-columns:1fr !important}.hero-ticker{display:none !important}.services-grid{grid-template-columns:1fr !important}.plans-grid{grid-template-columns:repeat(2,1fr) !important}.how-grid{grid-template-columns:1fr !important}.stats-grid{grid-template-columns:repeat(2,1fr) !important}.footer-grid{grid-template-columns:1fr !important}.dual-cta-grid{grid-template-columns:1fr !important}}
        @media(max-width:480px){.plans-grid{grid-template-columns:1fr !important}.stats-grid{grid-template-columns:1fr !important}}
      `}</style>

      <div className="orb-1" /><div className="orb-2" /><div className="orb-3" />

      {/* NAV */}
      <motion.nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: navBg, borderBottom: '1px solid', borderBottomColor: navBorder, boxShadow: navShadow, padding: '0 24px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Studio Arella Logo" style={{ height: 64, objectFit: 'contain' }} />
        </Link>
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[['#services','Services'],['#how','How it works'],['#pricing','Pricing'],['#faq','FAQ']].map(([h,l]) => <a key={h} href={h} className="nav-link-item">{l}</a>)}
        </div>
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/auth/login" style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', fontWeight: 700, padding: '8px 14px' }}>Sign in</Link>
          <Link href="/auth/register" className="cta-btn" style={{ fontSize: 14, fontWeight: 800, textDecoration: 'none', background: '#D4AF37', color: '#111111', padding: '10px 22px', borderRadius: 12, boxShadow: '0 4px 14px rgba(212,175,55,0.3)' }}>Get started free</Link>
        </div>
        <button className="mobile-ctas" onClick={() => setMobileMenuOpen(o => !o)} style={{ display: 'none', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', color: '#1A1A1A', padding: '6px 12px', fontSize: 18, fontWeight: 700 }}>☰</button>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 99, background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['#services','Services'],['#how','How it works'],['#pricing','Pricing'],['#faq','FAQ']].map(([h,l]) => (
              <a key={h} href={h} onClick={() => setMobileMenuOpen(false)} style={{ color: '#1A1A1A', textDecoration: 'none', fontSize: 16, fontWeight: 700, padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>{l}</a>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', border: '2px solid #E2E8F0', borderRadius: 12, color: '#64748B', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Sign in</Link>
              <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#D4AF37', borderRadius: 12, color: '#111111', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>Get started</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section style={{ minHeight: '100vh', paddingTop: 68, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 64, alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 100, padding: '6px 16px', marginBottom: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EAB308', boxShadow: '0 0 10px #EAB308' }} />
                <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 800 }}>Screen LIVE at Bems Junction, Umuahia</span>
              </div>
              <h1 style={{ fontSize: 'clamp(42px,6vw,80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', color: '#1A1A1A', margin: '0 0 16px' }}>
                Studio Arella<br /><span style={{ color: '#D4AF37' }}>Digital Screen</span>
              </h1>
              <div style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-1px', color: '#64748B', margin: '0 0 28px', minHeight: '1.3em', lineHeight: 1.25 }}>
                Now anyone can <span style={{ color: '#06B6D4' }}>{typed}</span><span className="cursor" style={{ color: '#06B6D4' }}>|</span>
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#475569', maxWidth: 540, margin: '0 0 40px', fontWeight: 500 }}>
                Advertise your business, brand, event or campaign on Umuahia's premier digital screen — reaching thousands of daily road users at Bems Junction, Finbars, Bende Road.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 56 }}>
                <Link href="/auth/register" className="cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D4AF37', color: '#111111', padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,175,55,0.3)' }}>
                  Book Your Ad Slot <FaArrowRight size={14} />
                </Link>
                <a href="#services" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '2px solid #E2E8F0', color: '#475569', padding: '16px 28px', borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: 'none', background: '#fff' }}>
                  <FaPlay size={12} color="#EAB308" /> See our services
                </a>
              </div>
              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {[['₦1,000','per minute'],['Bems Junction','high-traffic location'],['Instant','ad delivery']].map(([v,l]) => (
                  <div key={l}><p style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', margin: 0, letterSpacing: '-0.5px' }}>{v}</p><p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>{l}</p></div>
                ))}
              </div>
            </motion.div>

            <motion.div className="hero-ticker" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.04)', overflow: 'hidden', height: 380, position: 'relative', padding: 8 }}>
                  <div style={{ background: '#F8FAFC', borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                    <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop" alt="Digital Billboard" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                    <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(to bottom, #F8FAFC, #F1F5F9)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <FaDisplay size={14} color="#D4AF37" />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Premium Display</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.3 }}>Showcase your brand to thousands daily</h3>
                      <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>Vibrant 10ft × 6ft LED display with crystal-clear visibility, day and night.</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  <Link href="/auth/register" className="float-a" style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '14px 16px', textDecoration: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ width: 40, height: 40, background: '#FEF9C3', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FaBullhorn size={18} color="#EAB308" /></div>
                    <div><p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Start advertising</p><p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>From ₦1,000/minute →</p></div>
                  </Link>
                  <Link href="/creative" className="float-b" style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '14px 16px', textDecoration: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ width: 40, height: 40, background: '#CFFAFE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FaPaintbrush size={18} color="#06B6D4" /></div>
                    <div><p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Need a creative team?</p><p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>We design & film for you →</p></div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <section style={{ background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '32px 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          {[['WITHOUT US','Cold-call billboard companies. Wait weeks. No proof your ad ran. Opaque pricing. Middlemen.','#94A3B8','#F1F5F9'],['WITH STUDIO ARELLA','Book online in minutes. Pay securely. Ad goes live instantly. Track every impression in real time.','#D4AF37','#F9F6EA']].map(([l,t,c,bg]) => (
            <div key={l as string} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', maxWidth: 440 }}>
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: c as string, background: bg as string, padding: '6px 12px', borderRadius: 100, flexShrink: 0, marginTop: 2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{l as string}</span>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, margin: 0, fontWeight: 600 }}>{t as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: '120px 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} ref={servicesReveal.ref}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={servicesReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>What we offer</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#1A1A1A', margin: '0 0 16px', lineHeight: 1.1 }}>Everything your brand needs<br />to get seen in Umuahia</h2>
            <p style={{ fontSize: 18, color: '#64748B', maxWidth: 600, margin: '0 auto', lineHeight: 1.7, fontWeight: 500 }}>From digital screen bookings to professional creative production — we handle every part of your advertising journey.</p>
          </motion.div>
          <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24 }}>
            {SERVICES.map((s,i) => (
              <motion.div key={s.title} className="service-card" initial={{ opacity: 0, y: 24 }} animate={servicesReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i*0.1 }}
                style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 24, padding: '40px 32px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <s.Icon size={28} color={s.color} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', margin: '0 0 12px', letterSpacing: '-0.5px' }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, margin: '0 0 24px', fontWeight: 500 }}>{s.desc}</p>
                <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 800, color: s.color, textDecoration: 'none' }}>Get started <FaArrowRight size={12} /></Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" style={{ padding: '120px 24px', background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} ref={howReveal.ref}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={howReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#06B6D4', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>The process</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#1A1A1A', margin: 0, lineHeight: 1.1 }}>From sign-up to screen<br />in four simple steps</h2>
          </motion.div>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 32, left: '12.5%', right: '12.5%', height: 2, background: '#F1F5F9', zIndex: 0 }} />
            {HOW.map((s,i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 24 }} animate={howReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i*0.12 }}
                style={{ padding: '0 16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: i===0 ? '#06B6D4' : '#fff', border: i===0 ? 'none' : '2px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: i===0 ? '0 10px 20px rgba(6,182,212,0.3)' : '0 4px 10px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: i===0  ? '#111111' : '#06B6D4' }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', margin: '0 0 12px', letterSpacing: '-0.3px', lineHeight: 1.3 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{s.body}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={howReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }} style={{ textAlign: 'center', marginTop: 72 }}>
            <Link href="/auth/register" className="cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#06B6D4', color: '#fff', padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 900, textDecoration: 'none', boxShadow: '0 8px 24px rgba(6,182,212,0.3)' }}>
              Start now — it only takes a minute <FaArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '120px 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} ref={plansReveal.ref}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={plansReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 72 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#EAB308', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#1A1A1A', margin: '0 0 16px', lineHeight: 1.1 }}>Simple, affordable, transparent</h2>
            <p style={{ fontSize: 18, color: '#64748B', maxWidth: 540, margin: '0 auto', lineHeight: 1.7, fontWeight: 500 }}>Advertising starts from as low as ₦1,000 per minute. No hidden fees.</p>
          </motion.div>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {PLANS.map((p,i) => (
              <motion.div key={p.name} className="plan-card" initial={{ opacity: 0, y: 24 }} animate={plansReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i*0.08 }}
                style={{ background: '#fff', border: `2px solid ${p.popular ? '#EAB308' : '#E2E8F0'}`, borderRadius: 24, padding: '36px 32px', position: 'relative', boxShadow: p.popular ? '0 20px 40px rgba(234,179,8,0.1)' : '0 10px 30px rgba(0,0,0,0.02)' }}>
                {p.popular && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#EAB308', color: '#fff', fontSize: 11, fontWeight: 900, padding: '6px 18px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '0.08em', boxShadow: '0 4px 12px rgba(234,179,8,0.3)' }}>RECOMMENDED</div>}
                <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px' }}>{p.name}</p>
                <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', fontWeight: 600 }}>{p.minutes < 60 ? `${p.minutes} minute${p.minutes>1?'s':''}` : `${p.minutes/60} hour${p.minutes>60?'s':''}`}</p>
                <p style={{ fontSize: 42, fontWeight: 900, color: p.popular ? '#EAB308' : '#1A1A1A', margin: '0 0 8px', letterSpacing: '-1.5px' }}>₦{p.price.toLocaleString()}</p>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 32px', fontWeight: 600 }}>₦1,000/min</p>
                <Link href="/auth/register" style={{ display: 'block', textAlign: 'center', background: p.popular ? '#EAB308' : '#F1F5F9', color: p.popular  ? '#111111' : '#475569', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: p.popular ? '0 8px 20px rgba(234,179,8,0.2)' : 'none' }}>
                  Book {p.name} slot
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '80px 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} ref={statsReveal.ref}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
            <StatCard value={15000} suffix="+" label="Daily road users at Bems Junction" start={statsReveal.visible} />
            <StatCard value={1000} suffix="" label="₦ to get started today" start={statsReveal.visible} />
            <StatCard value={24} suffix="/7" label="Screen visibility hours" start={statsReveal.visible} />
            <StatCard value={100} suffix="%" label="Nigerian-owned & operated" start={statsReveal.visible} />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ padding: '120px 24px', background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>About Studio Arella</p>
            <h2 style={{ fontSize: 'clamp(30px,3.5vw,46px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#1A1A1A', margin: '0 0 24px', lineHeight: 1.15 }}>Umuahia's premier digital advertising screen</h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.8, margin: '0 0 20px', fontWeight: 500 }}>Studio Arella is an initiative of <strong style={{ color: '#1A1A1A' }}>Bems Group</strong> — dedicated to helping businesses, brands, organisations, events, and campaigns gain greater visibility within and beyond Abia State.</p>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.8, margin: '0 0 36px', fontWeight: 500 }}>Our digital screen is strategically located at <strong style={{ color: '#D4AF37' }}>Bems Junction, Finbars, Bende Road</strong> — one of Umuahia's highest-traffic points with thousands of daily road users.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{Icon:FaLocationDot,color:'#D4AF37',bg:'#F9F6EA',text:'Bems Junction, Finbars, Bende Road, Umuahia, Abia State'},{Icon:FaPhone,color:'#22c55e',bg:'#DCFCE7',text:'08164523926 — Diekolayomi Samuel Babatunde (Manager)'},{Icon:FaEnvelope,color:'#06B6D4',bg:'#CFFAFE',text:'Reach us through the support page for bookings enquiries'}].map(({Icon,color,bg,text}) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={16} color={color} /></div>
                  <span style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, marginTop: 8, fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 32, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
              <img src="https://images.unsplash.com/photo-1511268559489-34b624fbfcf5?w=700&q=85&auto=format&fit=crop" alt="Digital billboard" style={{ width: '100%', height: 500, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,10,10,0.6) 0%,transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '20px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} /><span style={{ fontSize: 12, fontWeight: 900, color: '#16A34A', letterSpacing: '0.06em' }}>SCREEN ONLINE</span></div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px' }}>Studio Arella — Bems Junction</p>
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 600 }}>10ft × 6ft Digital LED Display · Umuahia, Abia State</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '120px 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#EAB308', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>What people say</p>
            <h2 style={{ fontSize: 'clamp(32px,3.5vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#1A1A1A', margin: 0 }}>Trusted by Umuahia businesses</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
            {[{name:'Chukwuemeka Agu',role:'Owner, Agu Supermarket',text:"I listed my shop-front screen and had my first booking within the week. No phone calls, no negotiation — the ad was running. That's exactly what we needed.",color:'#D4AF37',avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&q=80&auto=format&fit=crop&crop=face'},{name:'Ngozi Obi',role:'Marketing Officer, Abia SME',text:'We booked two slots near Umuahia market for a product launch, uploaded our graphic, and it went live the same day. The real-time data was a bonus we did not expect.',color:'#22c55e',avatar:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&q=80&auto=format&fit=crop&crop=face'},{name:'Ifeanyi Nwosu',role:'Brand Manager, Nwosu & Sons',text:'No minimum spend, no agency fees. We spent ₦15,000 on a one-week booking and got proper impression reports. Will definitely scale this up.',color:'#06B6D4',avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&q=80&auto=format&fit=crop&crop=face'}].map(t => (
              <motion.div key={t.name} whileHover={{ y: -4 }} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 24, padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>{[...Array(5)].map((_,i) => <FaStar key={i} size={16} color="#EAB308" />)}</div>
                <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.75, margin: '0 0 28px', fontStyle: 'italic', fontWeight: 500 }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${t.color}30`, flexShrink: 0 }} />
                  <div><p style={{ fontSize: 15, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>{t.name}</p><p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>{t.role}</p></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '120px 24px', background: '#fff', borderTop: '1px solid #E2E8F0', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }} ref={faqReveal.ref}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={faqReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(32px,3.5vw,46px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#1A1A1A', margin: '0 0 16px' }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: 18, color: '#64748B', fontWeight: 500 }}>Got questions? We've got answers.</p>
          </motion.div>
          <div style={{ borderTop: '1px solid #E2E8F0' }}>
            {FAQS.map((f,i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={faqReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: i*0.05 }}>
                <FAQItem q={f.q} a={f.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DUAL CTA */}
      <section style={{ padding: '60px 24px 120px', background: '#fff', position: 'relative', zIndex: 2 }}>
        <div className="dual-cta-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: 'linear-gradient(135deg,#D4AF37 0%,#6D28D9 100%)', borderRadius: 32, padding: '48px 40px', position: 'relative', overflow: 'hidden', color: '#fff', boxShadow: '0 20px 40px rgba(212,175,55,0.2)' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <h3 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 16px', letterSpacing: '-1px' }}>Ready to launch your ad?</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', margin: '0 0 32px', maxWidth: 360, lineHeight: 1.6, fontWeight: 500 }}>Create your account, upload your creative, and go live on the Studio Arella screen today.</p>
            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#6D28D9', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 900, textDecoration: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
              Create Advertiser Account <FaArrowRight size={13} />
            </Link>
          </div>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 32, padding: '48px 40px' }}>
            <h3 style={{ fontSize: 32, fontWeight: 900, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-1px' }}>Need an ad design?</h3>
            <p style={{ fontSize: 16, color: '#64748B', margin: '0 0 32px', maxWidth: 360, lineHeight: 1.6, fontWeight: 500 }}>Our professional graphic design and video production team is ready to bring your brand to life.</p>
            <Link href="/creative" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1A1A1A', color: '#fff', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 900, textDecoration: 'none' }}>
              Request Creative Services <FaArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#1A1A1A', padding: '80px 24px 40px', color: '#fff', position: 'relative', zIndex: 2 }}>
        <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 48, marginBottom: 64 }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
              <img src="/logo-white.png" alt="Studio Arella Logo" style={{ height: 80, objectFit: 'contain' }} />
            </Link>
            <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, maxWidth: 300, margin: '0 0 24px', fontWeight: 500 }}>The easiest way to book premium digital screen advertising space in Umuahia, Abia State. A Bems Group Initiative.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              {[FaXTwitter,FaLinkedinIn,FaInstagram].map((Icon,i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}><Icon size={14} /></a>
              ))}
            </div>
          </div>
          {[{title:'Platform',links:[['#how','How it works'],['#pricing','Pricing Plans'],['/auth/register','Create Account'],['/auth/login','Sign in']]},{title:'Company',links:[['#','About Bems Group'],['#services','Our Services'],['/creative','Request Creative'],['#faq','FAQ & Support']]}].map(({title,links}) => (
            <div key={title}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: '0 0 20px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {links.map(([h,l]) => <a key={h} href={h} style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'none', fontWeight: 500 }}>{l}</a>)}
              </div>
            </div>
          ))}
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: '0 0 20px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contact Us</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><FaLocationDot size={14} color="#E8CE5E" style={{ marginTop: 3 }} /><span style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, fontWeight: 500 }}>Bems Junction, Finbars, Bende Road, Umuahia, Abia State</span></div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><FaPhone size={14} color="#E8CE5E" /><span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>08164523926</span></div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 32, borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 500 }}>© {new Date().getFullYear()} Bems Group. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</a>
            <a href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
