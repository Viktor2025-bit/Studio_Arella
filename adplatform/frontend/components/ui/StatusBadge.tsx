const configs: Record<string, { bg: string; text: string; dot: string }> = {
  active:          { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
  confirmed:       { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
  approved:        { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
  live:            { bg: '#CFFAFE', text: '#0E7490', dot: '#06B6D4' },
  pending:         { bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' },
  pending_payment: { bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' },
  paused:          { bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' },
  draft:           { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' },
  completed:       { bg: '#F9F6EA', text: '#8F7212', dot: '#D4AF37' },
  cancelled:       { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  rejected:        { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  suspended:       { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  failed:          { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  inactive:        { bg: '#F1F5F9', text: '#94A3B8', dot: '#CBD5E1' },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = configs[status?.toLowerCase()] || configs.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: c.bg, fontSize: 11, fontWeight: 800, color: c.text, fontFamily: "'Quicksand', sans-serif", whiteSpace: 'nowrap', letterSpacing: '0.02em', textTransform: 'capitalize' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0, display: 'inline-block' }} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
