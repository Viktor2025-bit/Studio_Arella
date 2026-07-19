'use client';

import { motion } from 'framer-motion';
import { theme } from '@/lib/theme';

export function Table({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="responsive-table-wrapper">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: theme.font.body, ...style }}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead style={{ background: theme.color.surface2 }}>
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th style={{
      textAlign: align, padding: '16px 24px', fontSize: 12, fontWeight: 700, color: theme.color.text3,
      textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderBottom: `1px solid ${theme.color.border}`
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
      transition={{ duration: 0.15 }}
      style={{ borderBottom: `1px solid ${theme.color.border2}`, cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </motion.tr>
  );
}

export function TableCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <td style={{ textAlign: align, padding: '18px 24px', fontSize: 14, color: theme.color.text1 }}>
      {children}
    </td>
  );
}
