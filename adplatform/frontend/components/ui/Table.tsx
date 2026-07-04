'use client';

import { motion } from 'framer-motion';
import { theme } from '@/lib/theme';

export function Table({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: theme.font.body, ...style }}>
      {children}
    </table>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${theme.color.border}` }}>{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th style={{
      textAlign: align, padding: '10px 14px', fontSize: 11, fontWeight: 800, color: theme.color.text3,
      textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.tr
      onClick={onClick}
      whileHover={{ background: theme.color.surface2 }}
      transition={{ duration: 0.12 }}
      style={{ borderBottom: `1px solid ${theme.color.border2}`, cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </motion.tr>
  );
}

export function TableCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <td style={{ textAlign: align, padding: '12px 14px', fontSize: 13, color: theme.color.text1 }}>
      {children}
    </td>
  );
}
