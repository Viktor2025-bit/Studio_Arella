'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaHouse, FaMagnifyingGlass } from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";

export default function NotFound() {
  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>

        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 80, height: 80, background: '#F9F6EA', border: '2px solid #E3C762', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <FaMagnifyingGlass size={32} color="#D4AF37" />
        </motion.div>

        <p style={{ fontSize: 12, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>404 — Not Found</p>
        <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, color: '#1A1A1A', margin: '0 0 14px', letterSpacing: '-1px', lineHeight: 1.1 }}>
          This page doesn&apos;t exist
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', maxWidth: 380, margin: '0 auto 36px', lineHeight: 1.65 }}>
          The link you followed may be broken, or the page may have been removed.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Go to Dashboard <FaArrowRight size={13} />
          </Link>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1.5px solid #E5E7EB', color: '#475569', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            <FaHouse size={13} /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
