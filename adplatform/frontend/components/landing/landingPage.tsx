'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  FaLocationDot, FaDisplay, FaBolt, FaBullhorn, FaArrowRight,
  FaStar, FaChevronDown, FaXTwitter, FaLinkedinIn,
  FaInstagram, FaPhone, FaEnvelope, FaPlay, FaFilm, FaPaintbrush, FaMicrophone, FaRadio, FaHeadphones
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
  { name: 'Standard', minutes: 5, price: 5000, popular: false },
  { name: 'Popular', minutes: 10, price: 10000, popular: true },
  { name: 'Business', minutes: 30, price: 30000, popular: false },
  { name: 'Premium', minutes: 60, price: 60000, popular: false },
  { name: 'Full Day', minutes: 780, price: 780000, popular: false },
];

const PODCAST_PLANS = [
  { name: 'Audio Only', price: 10000, desc: 'Professional mics & soundproofing', popular: false },
  { name: 'Audio + Video', price: 20000, desc: 'Multi-cam setup with professional lighting', popular: true }
];

const SERVICES = [
  { Icon: FaDisplay, color: '#D4AF37', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.2)', title: 'Digital Screen Advertising', desc: "Your ad displayed on our 10ft × 6ft LED screen at Bems Junction — one of Umuahia's highest-traffic locations." },
  { Icon: FaMicrophone, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', title: 'Premium Podcast Studio', desc: "Record your next viral podcast with professional mics, soundproofing, and optional multi-cam video or live-streaming setups." },
  { Icon: FaPaintbrush, color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)', title: 'Professional Graphic Design', desc: "Our creative team designs eye-catching adverts and promotional flyers that effectively communicate your brand's message." },
  { Icon: FaFilm, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', title: 'Video Production', desc: 'We visit your business location, office, store, or event to create high-quality promotional videos at budget-friendly rates.' },
  { Icon: FaBolt, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', title: 'Instant Ad Delivery', desc: 'Upload your creative from anywhere in the world. Book your slot, pay online, and your ad goes live — no delays.' },
];

const HOW = [
  { n: '01', title: 'Create your account', body: "Sign up free in seconds — no credit card required. You're instantly ready to start booking ad slots on Studio Arella." },
  { n: '02', title: 'Pick your slot on the calendar', body: 'Browse the live booking calendar. Select your preferred date and time. Choose from plans starting at ₦1,000.' },
  { n: '03', title: 'Upload or request your ad', body: 'Upload your own creative, or let our team create a professional design for you — graphics or video.' },
  { n: '04', title: 'Pay and go live', body: 'Pay securely via Monnify. Your ad is pushed directly to the Studio Arella screen. Track impressions in real time.' },
];

const FAQS = [
  { q: 'Where exactly is the Studio Arella screen located?', a: 'The screen is at Bems Junction, Finbars, Bende Road, Umuahia, Abia State — a high-traffic location with thousands of daily road users. It is a 10ft × 6ft digital LED display.' },
  { q: 'Where is the Podcast Studio located?', a: 'The Studio Arella podcast suite is located at our main office in Umuahia. It is fully soundproofed and equipped with premium microphones, professional lighting, and multi-camera setups.' },
  { q: 'How much does it cost to advertise on the screen?', a: 'Plans start from ₦1,000 for a 1-minute slot. We offer packages up to 8-hour full-day bookings. All plans are billed once at time of booking with no hidden fees.' },
  { q: 'How much does it cost to book the Podcast Studio?', a: 'Our Audio-Only podcast sessions start at ₦10,000 per hour. If you require Audio + Video with a multi-cam setup, the rate is ₦20,000 per hour.' },
  { q: "I don't have an ad — can your team create one?", a: 'Yes. Our professional creative team offers graphic design services and promotional video production. Contact us via the Request Creative page or call 08164523926 to discuss your needs.' },
  { q: 'How do I make payment?', a: 'All payments are processed securely via Monnify. We accept debit cards and bank transfers. Credits are confirmed instantly and your booking goes live immediately.' },
  { q: 'Can I book a slot from outside Umuahia?', a: "Absolutely. That's exactly why we built this platform. Upload your ad, book your slot, make payment — and your ad plays on the Studio Arella screen from anywhere in the world." },
  { q: 'How do I know my ad actually played?', a: "Your dashboard shows real-time impression tracking — exactly when your ad played, how many times, and estimated audience reach. You always know what you're getting." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.4, fontFamily: F }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ width: 32, height: 32, borderRadius: 10, background: open ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FaChevronDown size={12} color={open ? '#D4AF37' : '#94A3B8'} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, margin: '0 0 20px', paddingRight: 48, fontFamily: F, fontWeight: 500 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ value, suffix = '', label, start }: { value: number; suffix?: string; label: string; start: boolean }) {
  const count = useCountUp(value, 1800, start);
  return (
    <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.03)', padding: '36px 20px', borderRadius: 24, backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'rgba(212,175,55,0.1)', marginBottom: 16 }}>
        <FaStar size={20} color="#D4AF37" />
      </div>
      <p style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1, fontFamily: F }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p style={{ fontSize: 14, color: '#475569', margin: 0, fontWeight: 600 }}>{label}</p>
    </div>
  );
}

function HeroBackgroundCarousel() {
  const [idx, setIdx] = useState(0);
  const items = [
    { src: "/billboards/dennis-maliepaard-7b7wSvGn2W4-unsplash.jpg" },
    { src: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80" },
    { src: "/billboards/lee-soo-hyun-Z5cyBi5CLPg-unsplash.jpg" },
    { src: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&q=80" },
    { src: "/billboards/pawel-czerwinski-_9dSF0Hwitw-unsplash.jpg" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
      {items.map((item, i) => (
        <motion.div
          key={item.src}
          initial={false}
          animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.05 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </motion.div>
      ))}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.75)', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '150px', background: 'linear-gradient(to bottom, rgba(0,0,0,0), #ffffff)', zIndex: 2, pointerEvents: 'none' }} />
    </div>
  );
}

function ImageCarousel() {
  const [idx, setIdx] = useState(0);
  const items = [
    { src: "/billboards/dennis-maliepaard-7b7wSvGn2W4-unsplash.jpg", caption: "Premium Outdoor Displays" },
    { src: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80", caption: "Professional Podcast Studio" },
    { src: "/billboards/lee-soo-hyun-Z5cyBi5CLPg-unsplash.jpg", caption: "High-Traffic City Billboards" },
    { src: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&q=80", caption: "Soundproof Environment" },
    { src: "/billboards/pawel-czerwinski-_9dSF0Hwitw-unsplash.jpg", caption: "Vibrant Digital Screens" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 260, overflow: 'hidden', background: '#000' }}>
      {items.map((item, i) => (
        <motion.div
          key={item.src}
          initial={false}
          animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: i === idx ? 'auto' : 'none' }}
        >
          <img src={item.src} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#0f172a', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, letterSpacing: '0.04em' }}>
            {item.caption}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PodcastCarousel() {
  const [idx, setIdx] = useState(0);
  const items = [
    { src: "/podcast/studio-1.jpg", caption: "Professional Audio Setup" },
    { src: "/podcast/studio-2.jpg", caption: "Studio Lighting & Multi-cam" },
    { src: "/podcast/studio-3.jpg", caption: "Acoustically Treated Space" },
    { src: "/podcast/studio-4.jpg", caption: "Comfortable Seating" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400, overflow: 'hidden', background: '#000' }}>
      {items.map((item, i) => (
        <motion.div
          key={item.src}
          initial={false}
          animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: i === idx ? 'auto' : 'none' }}
        >
          <img src={item.src} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#0f172a', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 8, letterSpacing: '0.04em' }}>
            {item.caption}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const typed = useTypewriter(['book a 1-minute slot for ₦1,000.', 'record your next viral podcast.', 'reach thousands daily at Bems Junction.', 'push your ad live from anywhere.', 'grow your business across Umuahia.', 'advertise without the agency fees.'], 100, 2200);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const statsReveal = useReveal();
  const servicesReveal = useReveal();
  const howReveal = useReveal();
  const plansReveal = useReveal();
  const faqReveal = useReveal();
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)']);
  const navBorder = useTransform(scrollY, [0, 80], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']);
  const navShadow = useTransform(scrollY, [0, 80], ['none', '0 4px 30px rgba(0,0,0,0.5)']);

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    return scrollY.on('change', (latest) => setIsScrolled(latest > 10));
  }, [scrollY]);

  return (
    <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', minHeight: '100vh', color: '#0f172a', fontFamily: F, overflowX: 'hidden' }}>
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
        .plan-card{transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s; background: rgba(0,0,0,0.02); backdrop-filter: blur(12px)}
        .plan-card:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(212,175,55,0.15);border-color:#D4AF37 !important}
        .service-card{transition:transform 0.2s,box-shadow 0.2s; background: rgba(0,0,0,0.02); backdrop-filter: blur(12px)}
        .service-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,0.4)}
        .nav-link-item{color:#D4AF37;text-decoration:none;font-size:14px;font-weight:700;transition:transform 0.2s, color 0.15s; display:inline-block}
        .nav-link-item:hover{transform:scale(1.15);text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:2px}
        .cta-btn{transition:transform 0.15s,box-shadow 0.15s}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 0 20px rgba(212,175,55,0.5) !important}
        .orb-1{position:fixed;top:-10%;left:-10%;width:50vw;height:50vw;background:radial-gradient(circle,rgba(212,175,55,0.15) 0%,rgba(255,255,255,0) 70%);border-radius:50%;filter:blur(60px);z-index:0;pointer-events:none}
        .orb-2{position:fixed;top:20%;right:-10%;width:40vw;height:40vw;background:radial-gradient(circle,rgba(6,182,212,0.15) 0%,rgba(255,255,255,0) 70%);border-radius:50%;filter:blur(60px);z-index:0;pointer-events:none}
        .orb-3{position:fixed;bottom:-10%;left:20%;width:45vw;height:45vw;background:radial-gradient(circle,rgba(139,92,246,0.1) 0%,rgba(255,255,255,0) 70%);border-radius:50%;filter:blur(60px);z-index:0;pointer-events:none}
        @media(max-width:768px){.desktop-nav{display:none !important}.mobile-ctas{display:flex !important}.hero-grid{grid-template-columns:1fr !important}.hero-ticker{display:none !important}.services-grid{grid-template-columns:1fr !important}.plans-grid{grid-template-columns:repeat(2,1fr) !important}.how-grid{grid-template-columns:1fr !important}.stats-grid{grid-template-columns:repeat(2,1fr) !important}.footer-grid{grid-template-columns:1fr !important}.dual-cta-grid{grid-template-columns:1fr !important}}
        @media(max-width:480px){.plans-grid{grid-template-columns:1fr !important}.stats-grid{grid-template-columns:1fr !important}}
      `}</style>

      <div className="orb-1" /><div className="orb-2" /><div className="orb-3" />

      {/* NAV */}
      <motion.nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: navBg, borderBottom: '1px solid', borderBottomColor: navBorder, boxShadow: navShadow, padding: '0 24px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={isScrolled ? "/logo.png" : "/logo-white.png"} alt="Studio Arella Logo" style={{ height: 64, objectFit: 'contain' }} />
        </Link>
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[['#services', 'Services'], ['#how', 'How it works'], ['#pricing', 'Pricing'], ['#faq', 'FAQ'], ['#podcast-studio', 'Podcast Studio']].map(([h, l]) => <a key={h} href={h} className="nav-link-item">{l}</a>)}
        </div>
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/auth/login" className="nav-link-item" style={{ padding: '8px 14px' }}>Sign in</Link>
          <Link href="/auth/register" className="cta-btn" style={{ fontSize: 14, fontWeight: 800, textDecoration: 'none', background: '#D4AF37', color: '#ffffff', padding: '10px 22px', borderRadius: 12, boxShadow: '0 4px 14px rgba(212,175,55,0.3)' }}>Get started now</Link>
        </div>
        <button className="mobile-ctas" onClick={() => setMobileMenuOpen(o => !o)} style={{ display: 'none', background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, cursor: 'pointer', color: '#0f172a', padding: '6px 12px', fontSize: 18, fontWeight: 700 }}>☰</button>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', top: 68, bottom: 0, left: 0, right: 0, zIndex: 98, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            />
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 99, background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['#services', 'Services'], ['#how', 'How it works'], ['#pricing', 'Pricing'], ['#faq', 'FAQ'], ['#podcast-studio', 'Podcast Studio']].map(([h, l]) => (
                <a key={h} href={h} onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', fontSize: 16, fontWeight: 700, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{l}</a>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', border: '2px solid rgba(0,0,0,0.1)', borderRadius: 12, color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Sign in</Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#D4AF37', borderRadius: 12, color: '#ffffff', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>Get started</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section style={{ minHeight: '100vh', paddingTop: 68, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2, overflow: 'hidden' }}>
        <HeroBackgroundCarousel />
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: 'var(--landing-py-sm, 80px) 24px', position: 'relative', zIndex: 1 }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 64, alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EAB308', boxShadow: '0 0 10px #EAB308' }} />
                <span style={{ fontSize: 13, color: '#f8fafc', fontWeight: 800 }}>Umuahia's Premier Media Destination</span>
              </div>
              <h1 style={{ fontSize: 'clamp(42px,6vw,80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', color: '#ffffff', margin: '0 0 16px' }}>
                Studio Arella<br /><span style={{ color: '#D4AF37', textShadow: '0 0 30px rgba(212,175,55,0.4)' }}>Media Hub</span>
              </h1>
              <div style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-1px', color: '#cbd5e1', margin: '0 0 28px', minHeight: '1.3em', lineHeight: 1.25 }}>
                Now anyone can <span style={{ color: '#06B6D4', textShadow: '0 0 20px rgba(6,182,212,0.4)' }}>{typed}</span><span className="cursor" style={{ color: '#06B6D4' }}>|</span>
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#e2e8f0', maxWidth: 540, margin: '0 0 40px', fontWeight: 500 }}>
                Advertise your business on Umuahia's premier digital screen, or record professional audio and video in our premium podcast studio.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 56 }}>
                <Link href="/auth/register" className="cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D4AF37', color: '#ffffff', padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,175,55,0.3)' }}>
                  Book Your Ad Slot <FaArrowRight size={14} />
                </Link>
                <Link href="/auth/register" className="cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(139,92,246,0.5)', color: '#ffffff', padding: '16px 28px', borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: 'none', background: 'rgba(139,92,246,0.2)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(139,92,246,0.2)' }}>
                  <FaMicrophone size={14} color="#d8b4fe" /> Book Podcast Studio
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {[['10ft × 6ft', 'digital screen'], ['Studio', 'premium podcasting'], ['Instant', 'booking & delivery']].map(([v, l]) => (
                  <div key={l}><p style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>{v}</p><p style={{ fontSize: 13, color: '#cbd5e1', margin: '2px 0 0', fontWeight: 600 }}>{l}</p></div>
                ))}
              </div>
            </motion.div>

            <motion.div className="hero-ticker" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ perspective: 1000 }}>
              <div style={{ transform: 'rotateY(-10deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 24, boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.1)', overflow: 'hidden', height: 460, position: 'relative', padding: 8, backdropFilter: 'blur(20px)' }}>
                  <div style={{ background: '#ffffff', borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                    <ImageCarousel />
                    <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), #0f172a)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <FaBolt size={14} color="#D4AF37" />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Premium Facilities</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.3 }}>Screen & Studio Booking</h3>
                      <p style={{ fontSize: 13, color: '#475569', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>Book your billboard ad slots or reserve your podcast studio time instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, transform: 'rotateY(-10deg) rotateX(5deg) translateZ(30px)' }}>
                <Link href="/auth/register" className="float-a" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 16, padding: '14px 16px', textDecoration: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(234,179,8,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FaBullhorn size={18} color="#EAB308" /></div>
                  <div><p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>Start advertising</p><p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0', fontWeight: 600 }}>From ₦1,000/minute →</p></div>
                </Link>
                <Link href="/creative" className="float-b" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 16, padding: '14px 16px', textDecoration: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(6,182,212,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FaPaintbrush size={18} color="#06B6D4" /></div>
                  <div><p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>Need a creative team?</p><p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0', fontWeight: 600 }}>We design & film for you →</p></div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* STRIP */}
      <section style={{ background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '32px 24px', position: 'relative', zIndex: 2, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          {[['WITHOUT US', 'Cold-call billboard companies. Rent mediocre podcast gear. Wait weeks. Opaque pricing. Middlemen.', '#94A3B8', 'rgba(0,0,0,0.05)'], ['WITH STUDIO ARELLA', 'Book screens or studios online in minutes. Pay securely. Ad goes live instantly. Premium gear ready.', '#D4AF37', 'rgba(212,175,55,0.1)']].map(([l, t, c, bg]) => (
            <div key={l as string} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start max-w-[440px]">
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: c as string, background: bg as string, padding: '6px 12px', borderRadius: 100, flexShrink: 0, marginTop: 2, textTransform: 'uppercase', whiteSpace: 'nowrap', border: `1px solid ${bg === 'rgba(212,175,55,0.1)' ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.1)'}` }}>{l as string}</span>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, margin: 0, fontWeight: 600 }}>{t as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: 'var(--landing-py, 120px) 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} ref={servicesReveal.ref}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={servicesReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>What we offer</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', margin: '0 0 16px', lineHeight: 1.1 }}>Everything your brand needs<br />to get seen in Umuahia</h2>
            <p style={{ fontSize: 18, color: '#475569', maxWidth: 600, margin: '0 auto', lineHeight: 1.7, fontWeight: 500 }}>From digital screen bookings to professional creative production — we handle every part of your advertising journey.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVICES.map((s, i) => (
              <motion.div key={s.title} className="service-card" initial={{ opacity: 0, y: 24 }} animate={servicesReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 24, padding: '40px 32px' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <s.Icon size={28} color={s.color} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.5px' }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, margin: '0 0 24px', fontWeight: 500 }}>{s.desc}</p>
                <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 800, color: s.color, textDecoration: 'none' }}>Get started <FaArrowRight size={12} /></Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" style={{ padding: 'var(--landing-py, 120px) 24px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'relative', zIndex: 2, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} ref={howReveal.ref}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={howReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#06B6D4', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>The process</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', margin: 0, lineHeight: 1.1 }}>From sign-up to screen<br />in four simple steps</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            <div style={{ position: 'absolute', top: 32, left: '12.5%', right: '12.5%', height: 2, background: 'rgba(0,0,0,0.1)', zIndex: 0 }} />
            {HOW.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 24 }} animate={howReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.12 }}
                style={{ padding: '0 16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: i === 0 ? '#06B6D4' : '#0f172a', border: i === 0 ? 'none' : '2px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: i === 0 ? '0 0 20px rgba(6,182,212,0.4)' : 'none' }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: i === 0 ? '#ffffff' : '#06B6D4' }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.3px', lineHeight: 1.3 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{s.body}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={howReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }} style={{ textAlign: 'center', marginTop: 72 }}>
            <Link href="/auth/register" className="cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#06B6D4', color: '#ffffff', padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 900, textDecoration: 'none', boxShadow: '0 8px 24px rgba(6,182,212,0.3)' }}>
              Start now — it only takes a minute <FaArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: 'var(--landing-py, 120px) 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} ref={plansReveal.ref}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={plansReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 72 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#EAB308', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textShadow: '0 0 20px rgba(234,179,8,0.5)' }}>Pricing</p>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', margin: '0 0 16px', lineHeight: 1.1 }}>Simple, affordable, transparent</h2>
            <p style={{ fontSize: 18, color: '#475569', maxWidth: 540, margin: '0 auto', lineHeight: 1.7, fontWeight: 500 }}>Screen advertising starts from ₦1,000/minute. Podcast studio sessions start from ₦10,000/hour.</p>
          </motion.div>

          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 32px', textAlign: 'center', letterSpacing: '-0.5px' }}>Digital Screen Packages</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {PLANS.map((p, i) => (
              <motion.div key={p.name} className="plan-card" initial={{ opacity: 0, y: 24 }} animate={plansReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.08 }}
                style={{ border: `2px solid ${p.popular ? '#EAB308' : 'rgba(0,0,0,0.08)'}`, borderRadius: 24, padding: '36px 32px', position: 'relative', boxShadow: p.popular ? '0 0 40px rgba(234,179,8,0.2)' : 'none' }}>
                {p.popular && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#EAB308', color: '#ffffff', fontSize: 11, fontWeight: 900, padding: '6px 18px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '0.08em', boxShadow: '0 4px 12px rgba(234,179,8,0.4)' }}>RECOMMENDED</div>}
                <p style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>{p.name}</p>
                <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px', fontWeight: 600 }}>{p.minutes < 60 ? `${p.minutes} minute${p.minutes > 1 ? 's' : ''}` : `${p.minutes / 60} hour${p.minutes > 60 ? 's' : ''}`}</p>
                <p style={{ fontSize: 42, fontWeight: 900, color: p.popular ? '#EAB308' : '#0f172a', margin: '0 0 8px', letterSpacing: '-1.5px', textShadow: p.popular ? '0 0 20px rgba(234,179,8,0.4)' : 'none' }}>₦{p.price.toLocaleString()}</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 32px', fontWeight: 600 }}>₦1,000/min</p>
                <Link href="/auth/register" style={{ display: 'block', textAlign: 'center', background: p.popular ? '#EAB308' : 'rgba(0,0,0,0.1)', color: p.popular ? '#ffffff' : '#0f172a', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: p.popular ? '0 8px 20px rgba(234,179,8,0.2)' : 'none' }}>
                  Book {p.name} slot
                </Link>
              </motion.div>
            ))}
          </div>

          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 32px', textAlign: 'center', letterSpacing: '-0.5px' }}>Podcast Studio Packages</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            {PODCAST_PLANS.map((p, i) => (
              <motion.div key={p.name} className="plan-card" initial={{ opacity: 0, y: 24 }} animate={plansReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.08 }}
                style={{ border: `2px solid ${p.popular ? '#8B5CF6' : 'rgba(0,0,0,0.08)'}`, borderRadius: 24, padding: '36px 32px', position: 'relative', boxShadow: p.popular ? '0 0 40px rgba(139,92,246,0.15)' : 'none' }}>
                {p.popular && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#8B5CF6', color: '#ffffff', fontSize: 11, fontWeight: 900, padding: '6px 18px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '0.08em', boxShadow: '0 4px 12px rgba(139,92,246,0.4)' }}>RECOMMENDED</div>}
                <p style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>{p.name}</p>
                <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px', fontWeight: 600 }}>{p.desc}</p>
                <p style={{ fontSize: 42, fontWeight: 900, color: p.popular ? '#A78BFA' : '#0f172a', margin: '0 0 8px', letterSpacing: '-1.5px', textShadow: p.popular ? '0 0 20px rgba(167,139,250,0.4)' : 'none' }}>₦{p.price.toLocaleString()}</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 32px', fontWeight: 600 }}>Per hour</p>
                <Link href="/auth/register" style={{ display: 'block', textAlign: 'center', background: p.popular ? '#8B5CF6' : 'rgba(0,0,0,0.1)', color: p.popular ? '#ffffff' : '#0f172a', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: p.popular ? '0 8px 20px rgba(139,92,246,0.2)' : 'none' }}>
                  Book Studio
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* STATS */}
      <section style={{ padding: 'var(--landing-py-sm, 80px) 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} ref={statsReveal.ref}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard value={15000} suffix="+" label="Daily road users at Bems Junction" start={statsReveal.visible} />
            <StatCard value={1000} suffix="" label="₦ to get started today" start={statsReveal.visible} />
            <StatCard value={3} suffix="+" label="Podcast mics & pro cameras ready" start={statsReveal.visible} />
            <StatCard value={100} suffix="%" label="Nigerian-owned & operated" start={statsReveal.visible} />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ padding: 'var(--landing-py, 120px) 24px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'relative', zIndex: 2, backdropFilter: 'blur(10px)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-[1200px] mx-auto">
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16, textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>About Studio Arella</p>
            <h2 style={{ fontSize: 'clamp(30px,3.5vw,46px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', margin: '0 0 24px', lineHeight: 1.15 }}>Umuahia's premier media and advertising hub</h2>
            <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.8, margin: '0 0 20px', fontWeight: 500 }}>Studio Arella is an initiative of <strong style={{ color: '#0f172a' }}>Bems Group</strong> — providing a high-traffic digital screen and a professional podcast studio to help your brand gain greater visibility within and beyond Abia State.</p>
            <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.8, margin: '0 0 36px', fontWeight: 500 }}>Our digital screen is located at <strong style={{ color: '#D4AF37' }}>Bems Junction, Finbars, Bende Road</strong> — reaching thousands daily, while our in-house studio provides the perfect acoustic environment for creators.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{ Icon: FaLocationDot, color: '#D4AF37', bg: 'rgba(212,175,55,0.1)', text: 'Bems Junction, Finbars, Bende Road, Umuahia, Abia State' }, { Icon: FaPhone, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', text: '08164523926 — Diekolayomi Samuel Babatunde (Manager)' }, { Icon: FaEnvelope, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', text: 'Reach us through the support page for bookings enquiries' }].map(({ Icon, color, bg, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${bg.replace('0.1', '0.2')}` }}><Icon size={16} color={color} /></div>
                  <span style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, marginTop: 8, fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', perspective: 1000 }}>
            <div style={{ borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.05)', transform: 'rotateY(5deg) rotateX(2deg)' }}>
              <img src="https://images.unsplash.com/photo-1511268559489-34b624fbfcf5?w=700&q=85&auto=format&fit=crop" alt="Digital billboard" style={{ width: '100%', height: 500, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(255,255,255,0.8) 0%,transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 20, padding: '20px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} /><span style={{ fontSize: 12, fontWeight: 900, color: '#22c55e', letterSpacing: '0.06em' }}>SCREEN ONLINE</span></div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Studio Arella — Bems Junction</p>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0, fontWeight: 600 }}>10ft × 6ft Digital LED Display · Umuahia, Abia State</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: 'var(--landing-py, 120px) 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#EAB308', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textShadow: '0 0 20px rgba(234,179,8,0.5)' }}>What people say</p>
            <h2 style={{ fontSize: 'clamp(32px,3.5vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', margin: 0 }}>Trusted by Umuahia businesses</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 320px),1fr))', gap: 24 }}>
            {[{ name: 'Chukwuemeka Agu', role: 'Owner, Agu Supermarket', text: "I listed my shop-front screen and had my first booking within the week. No phone calls, no negotiation — the ad was running. That's exactly what we needed.", color: '#D4AF37', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&q=80&auto=format&fit=crop&crop=face' }, { name: 'Ngozi Obi', role: 'Marketing Officer, Abia SME', text: 'We booked two slots near Umuahia market for a product launch, uploaded our graphic, and it went live the same day. The real-time data was a bonus we did not expect.', color: '#22c55e', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&q=80&auto=format&fit=crop&crop=face' }, { name: 'Ifeanyi Nwosu', role: 'Brand Manager, Nwosu & Sons', text: 'No minimum spend, no agency fees. We spent ₦15,000 on a one-week booking and got proper impression reports. Will definitely scale this up.', color: '#06B6D4', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&q=80&auto=format&fit=crop&crop=face' }].map(t => (
              <motion.div key={t.name} whileHover={{ y: -4 }} style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 24, padding: '32px', backdropFilter: 'blur(16px)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>{[...Array(5)].map((_, i) => <FaStar key={i} size={16} color="#EAB308" />)}</div>
                <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.75, margin: '0 0 28px', fontStyle: 'italic', fontWeight: 500 }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${t.color}30`, flexShrink: 0 }} />
                  <div><p style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0 }}>{t.name}</p><p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>{t.role}</p></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: 'var(--landing-py, 120px) 24px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.05)', position: 'relative', zIndex: 2, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }} ref={faqReveal.ref}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={faqReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(32px,3.5vw,46px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', margin: '0 0 16px' }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: 18, color: '#475569', fontWeight: 500 }}>Got questions? We've got answers.</p>
          </motion.div>
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {FAQS.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={faqReveal.visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <FAQItem q={f.q} a={f.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PODCAST STUDIO */}
      <section id="podcast-studio" style={{ padding: 'var(--landing-py, 120px) 24px', position: 'relative', zIndex: 2 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-[1200px] mx-auto">
          <div style={{ position: 'relative', perspective: 1000, height: 500 }}>
            <div style={{ borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.15)', transform: 'rotateY(-5deg) rotateX(2deg)', height: '100%', border: '1px solid rgba(139,92,246,0.2)' }}>
              <PodcastCarousel />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#A78BFA', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16, textShadow: '0 0 20px rgba(167,139,250,0.5)' }}>Premium Facility</p>
            <h2 style={{ fontSize: 'clamp(30px,3.5vw,46px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', margin: '0 0 24px', lineHeight: 1.15 }}>Acoustically Treated Podcast Studio</h2>
            <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.8, margin: '0 0 20px', fontWeight: 500 }}>Whether you're starting a new show, recording an audiobook, or hosting a live stream, our fully-equipped podcast studio gives you the professional edge.</p>
            <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.8, margin: '0 0 36px', fontWeight: 500 }}>Book <strong style={{ color: '#0f172a' }}>Audio Only</strong> or <strong style={{ color: '#0f172a' }}>Audio + Video</strong> sessions. We provide the microphones, lighting, and engineering support.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
              {[{ Icon: FaMicrophone, color: '#A78BFA', bg: 'rgba(139,92,246,0.1)', text: 'High-end dynamic microphones and audio interfaces' }, { Icon: FaRadio, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', text: 'Live streaming setup to YouTube, Facebook, and Instagram' }, { Icon: FaHeadphones, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', text: 'Dedicated sound engineer available on request' }].map(({ Icon, color, bg, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${bg.replace('0.1', '0.2')}` }}><Icon size={16} color={color} /></div>
                  <span style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#8B5CF6', color: '#0f172a', padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>
              Start Recording <FaArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* DUAL CTA */}
      <section style={{ padding: 'var(--landing-py-half, 60px) 24px var(--landing-py, 120px)', background: '#ffffff', position: 'relative', zIndex: 2 }}>
        <div className="dual-cta-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(6,182,212,0.2) 100%)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 32, padding: '48px 40px', position: 'relative', overflow: 'hidden', color: '#0f172a', boxShadow: '0 20px 60px rgba(212,175,55,0.15)', backdropFilter: 'blur(20px)' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(0,0,0,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <h3 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 16px', letterSpacing: '-1px', color: '#0f172a' }}>Ready to launch your ad?</h3>
            <p style={{ fontSize: 16, color: '#334155', margin: '0 0 32px', maxWidth: 360, lineHeight: 1.6, fontWeight: 500 }}>Create your account, upload your creative, and go live on the Studio Arella screen today.</p>
            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D4AF37', color: '#ffffff', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 900, textDecoration: 'none', boxShadow: '0 8px 20px rgba(212,175,55,0.3)' }}>
              Create Advertiser Account <FaArrowRight size={13} />
            </Link>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 32, padding: '48px 40px', backdropFilter: 'blur(20px)' }}>
            <h3 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-1px' }}>Need an ad design?</h3>
            <p style={{ fontSize: 16, color: '#475569', margin: '0 0 32px', maxWidth: 360, lineHeight: 1.6, fontWeight: 500 }}>Our professional graphic design and video production team is ready to bring your brand to life.</p>
            <Link href="/creative" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F8FAFC', color: '#0f172a', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 900, textDecoration: 'none' }}>
              Request Creative Services <FaArrowRight size={13} />
            </Link>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 100%)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 32, padding: '48px 40px', backdropFilter: 'blur(20px)' }}>
            <h3 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-1px' }}>Host your podcast?</h3>
            <p style={{ fontSize: 16, color: '#475569', margin: '0 0 32px', maxWidth: 360, lineHeight: 1.6, fontWeight: 500 }}>Step into our soundproof studio. High-end mics, multi-cam video, and a dedicated engineer ready for you.</p>
            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#8B5CF6', color: '#0f172a', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 900, textDecoration: 'none', boxShadow: '0 8px 20px rgba(139,92,246,0.3)' }}>
              Book Studio Time <FaArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#f8fafc', padding: '80px 24px 40px', color: '#0f172a', position: 'relative', zIndex: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 48, marginBottom: 64 }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
              <img src="/logo.png" alt="Studio Arella Logo" style={{ height: 80, objectFit: 'contain' }} />
            </Link>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, maxWidth: 300, margin: '0 0 24px', fontWeight: 500 }}>The easiest way to book premium digital screen advertising and professional podcast studio sessions in Umuahia. A Bems Group Initiative.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              {[FaXTwitter, FaLinkedinIn, FaInstagram].map((Icon, i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', textDecoration: 'none', transition: 'color 0.2s, background 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.background = '#cbd5e1'; }} onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = '#e2e8f0'; }}><Icon size={14} /></a>
              ))}
            </div>
          </div>
          {[{ title: 'Platform', links: [['#how', 'How it works'], ['#pricing', 'Pricing Plans'], ['/auth/register', 'Create Account'], ['/auth/login', 'Sign in']] }, { title: 'Company', links: [['#', 'About Bems Group'], ['#services', 'Our Services'], ['/creative', 'Request Creative'], ['#faq', 'FAQ & Support']] }].map(({ title, links }) => (
            <div key={title}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 20px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {links.map(([h, l]) => <a key={h} href={h} style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'} onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>{l}</a>)}
              </div>
            </div>
          ))}
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 20px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contact</p>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 8px', fontWeight: 500 }}>hello@studioarella.com</p>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', fontWeight: 500 }}>08164523926</p>
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '0.05em' }}>OFFICE</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>Bems Junction, Finbars, Bende Road, Umuahia, Abia State</p>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 500 }}>© {new Date().getFullYear()} Studio Arella. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
