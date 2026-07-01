'use client';

import { motion, AnimatePresence } from 'framer-motion';

const F = "'Quicksand', sans-serif";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

export function FadeCard({ children, style, delay = 0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }} style={style}>
      {children}
    </motion.div>
  );
}

export function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(0,0,0,0.07)' }} transition={{ duration: 0.18 }} style={style}>
      {children}
    </motion.div>
  );
}

// ── Bouncing dots — shown during any loading state ────────────────────────────
export function BouncingDots({ color = 'rgba(255,255,255,0.9)' }: { color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <style>{`
        @keyframes _dot-bounce {
          0%,80%,100% { transform: scale(0.55); opacity: 0.45; }
          40%          { transform: scale(1);    opacity: 1; }
        }
        ._dot {
          width: 7px; height: 7px; border-radius: 50%;
          display: inline-block;
          animation: _dot-bounce 1s ease-in-out infinite;
        }
        ._dot:nth-child(2) { animation-delay: 0.18s; }
        ._dot:nth-child(3) { animation-delay: 0.36s; }
      `}</style>
      <span className="_dot" style={{ background: color }} />
      <span className="_dot" style={{ background: color }} />
      <span className="_dot" style={{ background: color }} />
    </span>
  );
}

// ── AnimatedButton — wraps any primary CTA, handles loading state internally ──
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  dotsColor?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({
  children, onClick, disabled, loading, loadingText,
  dotsColor = 'rgba(255,255,255,0.9)', style, type = 'button',
}: AnimatedButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      style={{
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        border: 'none',
        fontFamily: F,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: loading ? 0.85 : 1,
        transition: 'opacity 0.2s',
        ...style,
      }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {loadingText && <span>{loadingText}</span>}
            <BouncingDots color={dotsColor} />
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function Skeleton({ height = 16, width, radius = 8, style }: { height?: number; width?: number | string; radius?: number; style?: React.CSSProperties }) {
  return (
    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ height, width: width || '100%', borderRadius: radius, background: '#F1F5F9', ...style }} />
  );
}

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.4)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 201, padding: 16, pointerEvents: 'none' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.14)', pointerEvents: 'all', fontFamily: F }}>
          {title && <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', margin: '0 0 20px', letterSpacing: '-0.3px' }}>{title}</h2>}
          {children}
        </div>
      </motion.div>
    </>
  );
}

const TOAST_STYLES = {
  success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', dot: '#22C55E' },
  error:   { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', dot: '#EF4444' },
  info:    { bg: '#F9F6EA', border: '#E3C762', text: '#8F7212', dot: '#D4AF37' },
  warning: { bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', dot: '#EAB308' },
};

export function ToastContainer({ toasts, removeToast }: { toasts: any[]; removeToast: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
      <AnimatePresence>
        {toasts.map(t => {
          const s = TOAST_STYLES[t.type as keyof typeof TOAST_STYLES] || TOAST_STYLES.info;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '13px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontFamily: F }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0, marginTop: 4 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: s.text, margin: 0, flex: 1, lineHeight: 1.5 }}>{t.message}</p>
              <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text, opacity: 0.5, fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
