'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';
import { BouncingDots } from './Animations';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

function variantStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: theme.color.gold, color: theme.color.charcoal900, boxShadow: theme.shadow.gold };
    case 'secondary':
      return { background: theme.color.surface2, color: theme.color.text1, border: `1px solid ${theme.color.border}` };
    case 'ghost':
      return { background: 'transparent', color: theme.color.text2, border: `1px solid ${theme.color.border}` };
    case 'danger':
      return { background: theme.color.errorLight, color: '#8F3226', border: '1px solid #EACAC3' };
  }
}

export default function Button({
  children, onClick, variant = 'primary', disabled, loading, loadingText, style, type = 'button',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const dotsColor = variant === 'primary' ? theme.color.charcoal900 : theme.color.text2;

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
        fontFamily: theme.font.body,
        fontSize: 13,
        fontWeight: 800,
        borderRadius: theme.radius.md,
        padding: '10px 18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: loading ? 0.85 : isDisabled ? 0.5 : 1,
        transition: 'opacity 0.2s',
        ...variantStyle(variant),
        ...style,
      }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {loadingText && <span>{loadingText}</span>}
            <BouncingDots color={dotsColor} />
          </motion.span>
        ) : (
          <motion.span key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
