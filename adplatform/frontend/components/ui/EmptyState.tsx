'use client';

import { LucideIcon } from 'lucide-react';
import { theme } from '@/lib/theme';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '48px 24px', border: `1.5px dashed ${theme.color.border}`,
      borderRadius: theme.radius.lg, fontFamily: theme.font.body,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', background: theme.color.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      }}>
        <Icon size={22} color={theme.color.text3} strokeWidth={1.8} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1, margin: 0 }}>{title}</p>
      {subtitle && (
        <p style={{ fontSize: 13, color: theme.color.text3, margin: '6px 0 0', maxWidth: 320 }}>{subtitle}</p>
      )}
      {actionLabel && onAction && (
        <div style={{ marginTop: 18 }}>
          <Button onClick={onAction} variant="primary">{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
