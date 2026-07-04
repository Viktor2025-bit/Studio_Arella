'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import api from '@/lib/api';
import { Campaign } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMagnifyingGlass, FaPlus, FaTrash, FaBullhorn } from 'react-icons/fa6';
import { theme } from '@/lib/theme';

const F = theme.font.body;

const card: React.CSSProperties = {
  background: theme.color.surface,
  border: `1px solid ${theme.color.border}`,
  borderRadius: theme.radius.lg,
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
                <FaBullhorn size={17} color={theme.color.gold} />
                <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>My Campaigns</h1>
              </div>
              <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total</p>
            </div>
            <Button onClick={() => setShowModal(true)} variant="primary">
              <FaPlus size={13} /> New Campaign
            </Button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <FaMagnifyingGlass size={13} style={{ position: 'absolute', left: 12, top: 16, color: theme.color.text3, zIndex: 1 }} />
            <Input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          {/* Table */}
          <FadeCard style={{ ...card, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  {['Campaign Name', 'Status', 'Budget', 'Spent', 'Impressions', 'Ads', 'Start', 'End', ''].map(h => (
                    <TableHeaderCell key={h}>{h}</TableHeaderCell>
                  ))}
                </TableHead>
                <TableBody>
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
                          <div style={{ width: 48, height: 48, borderRadius: 14, background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaBullhorn size={20} color={theme.color.gold} />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: theme.color.text2, margin: 0 }}>No campaigns yet</p>
                          <p style={{ fontSize: 12, color: theme.color.text3, margin: 0 }}>Create your first campaign to start tracking your ad performance</p>
                          <div style={{ marginTop: 4 }}>
                            <Button onClick={() => setShowModal(true)} variant="primary">
                              <FaPlus size={12} /> Create Campaign
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell><span style={{ fontWeight: 700, color: theme.color.text1 }}>{c.name}</span></TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell>₦{Number(c.budget).toLocaleString()}</TableCell>
                      <TableCell>₦{Number(c.spent).toLocaleString()}</TableCell>
                      <TableCell>{Number(c.impressions).toLocaleString()}</TableCell>
                      <TableCell>{c.ad_count || 0}</TableCell>
                      <TableCell><span style={{ fontSize: 12, color: theme.color.text3 }}>{c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}</span></TableCell>
                      <TableCell><span style={{ fontSize: 12, color: theme.color.text3 }}>{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</span></TableCell>
                      <TableCell>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.color.border, display: 'flex', padding: 4 }}
                          onMouseOver={e => (e.currentTarget.style.color = theme.color.error)}
                          onMouseOut={e => (e.currentTarget.style.color = theme.color.border)}>
                          <FaTrash size={13} />
                        </motion.button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }}
              />
              <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: 16 }}>
                <motion.div
                  key="modal"
                  initial={{ opacity: 0, scale: 0.93, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ duration: 0.22, ease: theme.motion.easing }}
                  style={{ width: '100%', maxWidth: 480, pointerEvents: 'auto' }}
                >
                <div style={{ background: theme.color.surface, borderRadius: theme.radius.xl, padding: 28, boxShadow: theme.shadow.lg, fontFamily: F }}>
                  <h2 style={{ fontFamily: theme.font.display, fontSize: 20, fontWeight: 600, color: theme.color.text1, margin: '0 0 20px', letterSpacing: '-0.2px' }}>New Campaign</h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Input
                      label="Campaign name *"
                      type="text"
                      placeholder="e.g. Grand Opening — August 2025"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      autoFocus
                    />
                    <Input
                      label="Budget (₦)"
                      type="number"
                      placeholder="e.g. 50000"
                      value={form.budget}
                      onChange={e => setForm({ ...form, budget: e.target.value })}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input
                        label="Start date"
                        type="date"
                        value={form.start_date}
                        onChange={e => setForm({ ...form, start_date: e.target.value })}
                      />
                      <Input
                        label="End date"
                        type="date"
                        value={form.end_date}
                        onChange={e => setForm({ ...form, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <Button onClick={() => setShowModal(false)} variant="secondary" style={{ flex: 1 }}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} loading={saving} loadingText="Creating..." variant="primary" style={{ flex: 1 }}>
                      Create Campaign
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
