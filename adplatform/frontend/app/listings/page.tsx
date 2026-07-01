'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { Screen } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaDisplay, FaLocationDot, FaArrowRight } from 'react-icons/fa6';
import { Monitor } from 'lucide-react';

const F = "'Quicksand', sans-serif";
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: F, color: '#1A1A1A', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' };
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; };
const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; };

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  digital:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  billboard: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  indoor:    { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  outdoor:   { bg: '#F9F6EA', text: '#8F7212', border: '#E3C762' },
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
                <Monitor size={17} color="#D4AF37" />
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>My Listings</h1>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>{screens.length} screen{screens.length !== 1 ? 's' : ''} listed</p>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              <FaPlus size={13} /> Add Listing
            </motion.button>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ ...card, padding: 20 }}><Skeleton height={42} width={42} radius={12} style={{ marginBottom: 14 }} /><Skeleton height={14} style={{ marginBottom: 8 }} /><Skeleton height={12} width="70%" /></div>)}
            </div>
          ) : screens.length === 0 ? (
            <FadeCard style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F9F6EA', border: '1px solid #E3C762', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <FaDisplay size={24} color="#D4AF37" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#475569', margin: '0 0 6px' }}>No screens listed yet</p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 18px', lineHeight: 1.5 }}>List your display and start earning when advertisers book your slots</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                <FaPlus size={12} /> Add first screen
              </motion.button>
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
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', display: 'flex', padding: 4 }}
                        onMouseOver={e => (e.currentTarget.style.color = '#EF4444')} onMouseOut={e => (e.currentTarget.style.color = '#CBD5E1')}>
                        <FaTrash size={13} />
                      </motion.button>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>{s.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                      <FaLocationDot size={11} color="#94A3B8" />
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{s.location}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tm.text, background: tm.bg, border: `1px solid ${tm.border}`, padding: '2px 9px', borderRadius: 100, textTransform: 'capitalize' }}>{s.type}</span>
                      {s.size && <span style={{ fontSize: 11, color: '#94A3B8' }}>{s.size}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#D4AF37', margin: 0 }}>₦{s.price_per_sec}/sec</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0' }}>{Number(s.impressions_per_day).toLocaleString()} impressions/day</p>
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
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
              <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: 16 }}>
                <motion.div key="modal"
                  initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.22, ease: [0.25,0.46,0.45,0.94] }}
                  style={{ width: '100%', maxWidth: 500, pointerEvents: 'auto' }}>
                <div style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.14)', fontFamily: F }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 20px', letterSpacing: '-0.3px' }}>Add New Listing</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Screen name *</label>
                      <input type="text" placeholder="e.g. Library Avenue LED" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} onFocus={onFocus} onBlur={onBlur} autoFocus />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location *</label>
                      <input type="text" placeholder="e.g. Orieagu Market, Umuahia" value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                          style={{ ...inputStyle, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                          <option value="digital">Digital LED</option>
                          <option value="billboard">Billboard</option>
                          <option value="indoor">Indoor</option>
                          <option value="outdoor">Outdoor</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Size</label>
                        <input type="text" placeholder="e.g. 10ft × 6ft" value={form.size}
                          onChange={e => setForm({ ...form, size: e.target.value })} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price per second (₦)</label>
                        <input type="number" placeholder="e.g. 16.67" value={form.price_per_sec}
                          onChange={e => setForm({ ...form, price_per_sec: e.target.value })} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Impressions / day</label>
                        <input type="number" placeholder="e.g. 15000" value={form.impressions_per_day}
                          onChange={e => setForm({ ...form, impressions_per_day: e.target.value })} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <button onClick={() => setShowModal(false)}
                      style={{ flex: 1, padding: '12px', background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = '#CBD5E1')} onMouseOut={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                      Cancel
                    </button>
                    <motion.button whileHover={!saving ? { scale: 1.02 } : {}} whileTap={!saving ? { scale: 0.98 } : {}}
                      onClick={handleCreate} disabled={saving}
                      style={{ flex: 1, padding: '12px', background: saving ? '#E3C762' : '#D4AF37', color: '#111111', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: saving ? 0.75 : 1 }}>
                      {saving ? 'Saving...' : <><FaArrowRight size={12} /> Add Listing</>}
                    </motion.button>
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
