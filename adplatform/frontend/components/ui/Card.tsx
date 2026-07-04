'use client';

import { motion } from 'framer-motion';
import { theme } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

const PADDING = { sm: 16, md: 20, lg: 28 };

export default function Card({ children, style, padding = 'md', hoverable = false, onClick }: CardProps) {
  const base: React.CSSProperties = {
    background: theme.color.surface,
    border: `1px solid ${theme.color.border}`,
    borderRadius: theme.radius.lg,
    padding: PADDING[padding],
    fontFamily: theme.font.body,
    ...style,
  };

  if (!hoverable) {
    return <div style={base} onClick={onClick}>{children}</div>;
  }

  return (
    <motion.div
      style={{ ...base, cursor: onClick ? 'pointer' : undefined }}
      whileHover={{ y: -3, boxShadow: theme.shadow.lg }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
