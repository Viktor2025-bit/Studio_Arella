'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { FaDisplay, FaMapPin } from 'react-icons/fa6';
import { Search, Monitor } from 'lucide-react';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, overflow: 'hidden' } as React.CSSProperties;

export default function AdminScreensPage() {
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    api.get('/admin/screens?limit=100')
      .then(r => setScreens(r.data.screens || []))
      .catch(() => setScreens([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = screens.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const typeColors: Record<string, string> = { digital: theme.color.gold, billboard: theme.color.gold, indoor: theme.color.success, outdoor: theme.color.gold };

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Monitor size={18} color={theme.color.success} />
            <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>Studio Arella Screen</h1>
          </div>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>{screens.length} screens managed by Bems Group</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.color.text3 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search screens, locations, owners..." style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 10, color: theme.color.text1, fontSize: 13, outline: 'none', fontFamily: F, boxSizing: 'border-box' }} />
        </div>

        <div style={card}>
          <Table>
            <TableHead>
              {['Screen', 'Location', 'Type', 'Owner', 'Price/sec', 'Status'].map(h => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableHead>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><Skeleton height={12} width={80} /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: theme.color.text3 }}>
                  <FaDisplay size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                  No screens found
                </td></tr>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${typeColors[s.type] || theme.color.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FaDisplay size={14} color={typeColors[s.type] || theme.color.gold} />
                      </div>
                      <span style={{ fontWeight: 700, color: theme.color.text1 }}>{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaMapPin size={11} color={theme.color.text3} />{s.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 11, fontWeight: 700, color: typeColors[s.type] || theme.color.gold, background: `${typeColors[s.type] || theme.color.gold}18`, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }}>{s.type}</span>
                  </TableCell>
                  <TableCell>{s.owner_name || '—'}</TableCell>
                  <TableCell><span style={{ color: theme.color.success, fontWeight: 700 }}>₦{s.price_per_sec}/s</span></TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageTransition>
  );
}
