'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { FaDisplay, FaMapPin } from 'react-icons/fa6';
import { Search, Monitor } from 'lucide-react';

const F = "'Quicksand', sans-serif";
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' } as React.CSSProperties;

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

  const typeColors: Record<string, string> = { digital: '#D4AF37', billboard: '#D4AF37', indoor: '#22c55e', outdoor: '#D4AF37' };

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Monitor size={18} color="#22c55e" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Studio Arella Screen</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{screens.length} screens managed by Bems Group</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search screens, locations, owners..." style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, color: '#1A1A1A', fontSize: 13, outline: 'none', fontFamily: F, boxSizing: 'border-box' }} />
        </div>

        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid 1px solid #E2E8F0' }}>
                {['Screen', 'Location', 'Type', 'Owner', 'Price/sec', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #FAFAFA' }}>
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><Skeleton height={12} width={80} /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
                  <FaDisplay size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                  No screens found
                </td></tr>
              ) : filtered.map(s => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderTop: '1px solid #FAFAFA' }} whileHover={{ background: '#FAFAFA' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${typeColors[s.type] || '#D4AF37'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FaDisplay size={14} color={typeColors[s.type] || '#D4AF37'} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaMapPin size={11} color="#94A3B8" />{s.location}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: typeColors[s.type] || '#D4AF37', background: `${typeColors[s.type] || '#D4AF37'}18`, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }}>{s.type}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>{s.owner_name || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#22c55e', fontWeight: 600 }}>₦{s.price_per_sec}/s</td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={s.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
