'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { Screen } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaDisplay, FaLocationDot, FaArrowRight } from 'react-icons/fa6';
import { Monitor } from 'lucide-react';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card: React.CSSProperties = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg };

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  digital:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  billboard: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  indoor:    { bg: theme.color.successLight, text: '#2F6A3B', border: '#C7E0BE' },
  outdoor:   { bg: theme.color.goldLight, text: theme.color.goldDark, border: theme.color.goldMid },
};

export default function ListingsPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', type: 'digital', size: '', price_per_sec: '', impressions_per_day: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchScreens = async () => {
    try { const r = await api.get('/screens?my=true'); setScreens(r.data.screens || []); }
    catch { setScreens([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchScreens(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.location.trim()) { toast('Name and location are required', 'error'); return; }
    setSaving(true);
    try {
      await api.post('/screens', { ...form, price_per_sec: parseFloat(form.price_per_sec) || 0, impressions_per_day: parseInt(form.impressions_per_day) || 0 });
      setShowModal(false);
      setForm({ name: '', location: '', type: 'digital', size: '', price_per_sec: '', impressions_per_day: '' });
      toast('Screen listed!', 'success');
      fetchScreens();
    } catch { toast('Failed to add listing', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this listing?')) return;
    try { await api.delete(`/screens/${id}`); setScreens(p => p.filter(s => s.id !== id)); toast('Listing removed', 'info'); }
    catch { toast('Failed to remove', 'error'); }
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                <Monitor size={17} color={theme.color.gold} />
                <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>My Listings</h1>
              </div>
              <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>{screens.length} screen{screens.length !== 1 ? 's' : ''} listed</p>
            </div>
            <Button onClick={() => setShowModal(true)} variant="primary">
              <FaPlus size={13} /> Add Listing
            </Button>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ ...card, padding: 20 }}><Skeleton height={42} width={42} radius={12} style={{ marginBottom: 14 }} /><Skeleton height={14} style={{ marginBottom: 8 }} /><Skeleton height={12} width="70%" /></div>)}
            </div>
          ) : screens.length === 0 ? (
            <FadeCard style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <FaDisplay size={24} color={theme.color.gold} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: theme.color.text2, margin: '0 0 6px' }}>No screens listed yet</p>
              <p style={{ fontSize: 13, color: theme.color.text3, margin: '0 0 18px', lineHeight: 1.5 }}>List your display and start earning when advertisers book your slots</p>
              <div style={{ display: 'inline-block' }}>
                <Button onClick={() => setShowModal(true)} variant="primary">
                  <FaPlus size={12} /> Add first screen
                </Button>
              </div>
            </FadeCard>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {screens.map((s, i) => {
                const tm = typeColors[s.type] || typeColors.digital;
                return (
                  <FadeCard key={s.id} delay={i * 0.05} style={{ ...card, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: tm.bg, border: `1px solid ${tm.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={19} color={tm.text} />
                      </div>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(s.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.color.border, display: 'flex', padding: 4 }}
                        onMouseOver={e => (e.currentTarget.style.color = theme.color.error)} onMouseOut={e => (e.currentTarget.style.color = theme.color.border)}>
                        <FaTrash size={13} />
                      </motion.button>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: theme.color.text1, margin: '0 0 4px' }}>{s.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                      <FaLocationDot size={11} color={theme.color.text3} />
                      <p style={{ fontSize: 12, color: theme.color.text3, margin: 0 }}>{s.location}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tm.text, background: tm.bg, border: `1px solid ${tm.border}`, padding: '2px 9px', borderRadius: 100, textTransform: 'capitalize' }}>{s.type}</span>
                      {s.size && <span style={{ fontSize: 11, color: theme.color.text3 }}>{s.size}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${theme.color.border2}` }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.gold, margin: 0 }}>₦{s.price_per_sec}/sec</p>
                        <p style={{ fontSize: 11, color: theme.color.text3, margin: '1px 0 0' }}>{Number(s.impressions_per_day).toLocaleString()} impressions/day</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  </FadeCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Add listing modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
              <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: 16 }}>
                <motion.div key="modal"
                  initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.22, ease: theme.motion.easing }}
                  style={{ width: '100%', maxWidth: 500, pointerEvents: 'auto' }}>
                <div style={{ background: theme.color.surface, borderRadius: theme.radius.xl, padding: 28, boxShadow: theme.shadow.lg, fontFamily: F }}>
                  <h2 style={{ fontFamily: theme.font.display, fontSize: 20, fontWeight: 600, color: theme.color.text1, margin: '0 0 20px', letterSpacing: '-0.2px' }}>Add New Listing</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Input label="Screen name *" type="text" placeholder="e.g. Library Avenue LED" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
                    <Input label="Location *" type="text" placeholder="e.g. Orieagu Market, Umuahia" value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                          style={{ width: '100%', padding: '11px 14px', background: theme.color.surface, border: `1.5px solid ${theme.color.border}`, borderRadius: theme.radius.sm, fontSize: 13, outline: 'none', fontFamily: F, color: theme.color.text1, boxSizing: 'border-box', cursor: 'pointer' }}>
                          <option value="digital">Digital LED</option>
                          <option value="billboard">Billboard</option>
                          <option value="indoor">Indoor</option>
                          <option value="outdoor">Outdoor</option>
                        </select>
                      </div>
                      <Input label="Size" type="text" placeholder="e.g. 10ft × 6ft" value={form.size}
                        onChange={e => setForm({ ...form, size: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input label="Price per second (₦)" type="number" placeholder="e.g. 16.67" value={form.price_per_sec}
                        onChange={e => setForm({ ...form, price_per_sec: e.target.value })} />
                      <Input label="Impressions / day" type="number" placeholder="e.g. 15000" value={form.impressions_per_day}
                        onChange={e => setForm({ ...form, impressions_per_day: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <Button onClick={() => setShowModal(false)} variant="secondary" style={{ flex: 1 }}>Cancel</Button>
                    <Button onClick={handleCreate} loading={saving} loadingText="Saving..." variant="primary" style={{ flex: 1 }}>
                      <FaArrowRight size={12} /> Add Listing
                    </Button>
                  </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </PageTransition>
    </DashboardLayout>
  );
}
