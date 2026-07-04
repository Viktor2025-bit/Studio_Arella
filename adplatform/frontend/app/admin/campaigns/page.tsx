'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Megaphone, Search } from 'lucide-react';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, overflow: 'hidden' } as React.CSSProperties;

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/campaigns?limit=100')
      .then(r => setCampaigns(r.data.campaigns || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Megaphone size={18} color={theme.color.gold} />
            <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>All Campaigns</h1>
          </div>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>{campaigns.length} campaigns across the platform</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.color.text3 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns or owners..." style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 10, color: theme.color.text1, fontSize: 13, outline: 'none', fontFamily: F, boxSizing: 'border-box' }} />
        </div>

        <div style={card}>
          <Table>
            <TableHead>
              {['Campaign', 'Owner', 'Budget', 'Spent', 'Impressions', 'Status'].map(h => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableHead>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><Skeleton height={12} width={80} /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: theme.color.text3 }}>No campaigns found</td></tr>
              ) : filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell><span style={{ fontWeight: 700, color: theme.color.text1 }}>{c.name}</span></TableCell>
                  <TableCell>{c.user_name || '—'}</TableCell>
                  <TableCell>₦{Number(c.budget || 0).toLocaleString()}</TableCell>
                  <TableCell><span style={{ color: theme.color.gold, fontWeight: 700 }}>₦{Number(c.spent || 0).toLocaleString()}</span></TableCell>
                  <TableCell>{Number(c.impressions || 0).toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageTransition>
  );
}
