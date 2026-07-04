import { theme } from '@/lib/theme';

const neutral = { bg: theme.color.surface2, text: theme.color.text3, dot: theme.color.text4 };

const configs: Record<string, { bg: string; text: string; dot: string }> = {
  active:          { bg: theme.color.successLight, text: '#2F6A3B', dot: theme.color.success },
  confirmed:       { bg: theme.color.successLight, text: '#2F6A3B', dot: theme.color.success },
  approved:        { bg: theme.color.successLight, text: '#2F6A3B', dot: theme.color.success },
  // "live" is the one deliberate, sparing use of the glitch accent outside hero/marketing surfaces.
  live:            { bg: '#DFFAFD', text: '#046A80', dot: theme.color.glitchCyan },
  pending:         { bg: theme.color.warningLight, text: '#96631D', dot: theme.color.warning },
  pending_payment: { bg: theme.color.warningLight, text: '#96631D', dot: theme.color.warning },
  paused:          { bg: theme.color.warningLight, text: '#96631D', dot: theme.color.warning },
  draft:           neutral,
  completed:       { bg: theme.color.goldLight, text: theme.color.goldDark, dot: theme.color.gold },
  cancelled:       { bg: theme.color.errorLight, text: '#8F3226', dot: theme.color.error },
  rejected:        { bg: theme.color.errorLight, text: '#8F3226', dot: theme.color.error },
  suspended:       { bg: theme.color.errorLight, text: '#8F3226', dot: theme.color.error },
  failed:          { bg: theme.color.errorLight, text: '#8F3226', dot: theme.color.error },
  inactive:        neutral,
};

export default function StatusBadge({ status }: { status: string }) {
  const c = configs[status?.toLowerCase()] || configs.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: theme.radius.pill, background: c.bg, fontSize: 11, fontWeight: 800, color: c.text, fontFamily: theme.font.body, whiteSpace: 'nowrap', letterSpacing: '0.02em', textTransform: 'capitalize' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0, display: 'inline-block' }} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
