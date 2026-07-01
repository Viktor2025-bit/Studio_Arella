'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { Campaign } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMagnifyingGlass, FaPlus, FaTrash, FaArrowRight, FaBullhorn } from 'react-icons/fa6';
import Link from 'next/link';

const F = "'Quicksand', sans-serif";

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: '#fff',
  border: '1.5px solid #E5E7EB',
  borderRadius: 10,
  fontSize: 13,
  outline: 'none',
  fontFamily: F,
  color: '#1A1A1A',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#D4AF37';
  e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)';
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#E5E7EB';
  e.target.style.boxShadow = 'none';
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', budget: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data.campaigns || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast('Please enter a campaign name', 'error'); return; }
    setSaving(true);
    try {
      await api.post('/campaigns', { ...form, budget: parseFloat(form.budget) || 0 });
      setShowModal(false);
      setForm({ name: '', budget: '', start_date: '', end_date: '' });
      toast('Campaign created!', 'success');
      fetchCampaigns();
    } catch {
      toast('Failed to create campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast('Campaign deleted', 'info');
    } catch {
      toast('Failed to delete campaign', 'error');
    }
  };

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                <FaBullhorn size={17} color="#D4AF37" />
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>My Campaigns</h1>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
            >
              <FaPlus size={13} /> New Campaign
            </motion.button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <FaMagnifyingGlass size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Table */}
          <FadeCard style={{ ...card, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
                    {['Campaign Name', 'Status', 'Budget', 'Spent', 'Impressions', 'Ads', 'Start', 'End', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 18px', color: '#94A3B8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} style={{ padding: '14px 18px' }}><Skeleton height={13} width={j === 0 ? 120 : 60} /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '56px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F9F6EA', border: '1px solid #E3C762', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaBullhorn size={20} color="#D4AF37" />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#475569', margin: 0 }}>No campaigns yet</p>
                          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Create your first campaign to start tracking your ad performance</p>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setShowModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4, fontFamily: F }}>
                            <FaPlus size={12} /> Create Campaign
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(c => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ borderTop: '1px solid #F8FAFC' }}
                      whileHover={{ background: '#FAFAFA' }}>
                      <td style={{ padding: '13px 18px', fontWeight: 700, color: '#1A1A1A' }}>{c.name}</td>
                      <td style={{ padding: '13px 18px' }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: '13px 18px', color: '#64748B' }}>₦{Number(c.budget).toLocaleString()}</td>
                      <td style={{ padding: '13px 18px', color: '#64748B' }}>₦{Number(c.spent).toLocaleString()}</td>
                      <td style={{ padding: '13px 18px', color: '#64748B' }}>{Number(c.impressions).toLocaleString()}</td>
                      <td style={{ padding: '13px 18px', color: '#64748B' }}>{c.ad_count || 0}</td>
                      <td style={{ padding: '13px 18px', color: '#94A3B8', fontSize: 12 }}>{c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '13px 18px', color: '#94A3B8', fontSize: 12 }}>{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', display: 'flex', padding: 4 }}
                          onMouseOver={e => (e.currentTarget.style.color = '#EF4444')}
                          onMouseOut={e => (e.currentTarget.style.color = '#CBD5E1')}>
                          <FaTrash size={13} />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeCard>
        </div>

        {/* Create modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, backdropFilter: 'blur(3px)' }}
              />
              <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: 16 }}>
                <motion.div
                  key="modal"
                  initial={{ opacity: 0, scale: 0.93, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ width: '100%', maxWidth: 480, pointerEvents: 'auto' }}
                >
                <div style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.14)', fontFamily: F }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 20px', letterSpacing: '-0.3px' }}>New Campaign</h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campaign name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Grand Opening — August 2025"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        style={inputStyle}
                        onFocus={onFocus} onBlur={onBlur}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Budget (₦)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={form.budget}
                        onChange={e => setForm({ ...form, budget: e.target.value })}
                        style={inputStyle}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Start date</label>
                        <input
                          type="date"
                          value={form.start_date}
                          onChange={e => setForm({ ...form, start_date: e.target.value })}
                          style={inputStyle}
                          onFocus={onFocus} onBlur={onBlur}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>End date</label>
                        <input
                          type="date"
                          value={form.end_date}
                          onChange={e => setForm({ ...form, end_date: e.target.value })}
                          style={inputStyle}
                          onFocus={onFocus} onBlur={onBlur}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <button
                      onClick={() => setShowModal(false)}
                      style={{ flex: 1, padding: '12px', background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'border-color 0.15s' }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                      onMouseOut={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={!saving ? { scale: 1.02 } : {}}
                      whileTap={!saving ? { scale: 0.98 } : {}}
                      onClick={handleCreate}
                      disabled={saving}
                      style={{ flex: 1, padding: '12px', background: saving ? '#E3C762' : '#D4AF37', color: '#111111', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: saving ? 0.75 : 1 }}
                    >
                      {saving ? 'Creating...' : <><FaArrowRight size={12} /> Create Campaign</>}
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
