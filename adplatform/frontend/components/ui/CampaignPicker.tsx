'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { theme } from '@/lib/theme';
import { FaPlus, FaBullhorn, FaXmark, FaChevronDown } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

const F = theme.font.body;

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget?: number;
}

interface Props {
  value: string | null;           // selected campaign_id or null
  onChange: (id: string | null) => void;
}

export default function CampaignPicker({ value, onChange }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'none' | 'existing' | 'new'>('none');
  const [open, setOpen] = useState(false);

  // "Create new" form state
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/campaigns')
      .then(r => setCampaigns(r.data.campaigns || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedCampaign = campaigns.find(c => c.id === value);

  const handleSelectExisting = (id: string) => {
    onChange(id);
    setMode('existing');
    setOpen(false);
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) { setError('Campaign name is required'); return; }
    setCreating(true);
    setError('');
    try {
      const res = await api.post('/campaigns', {
        name: newName.trim(),
        budget: parseFloat(newBudget) || 0,
        start_date: newStart || null,
        end_date: newEnd || null,
      });
      const created = res.data;
      setCampaigns(prev => [created, ...prev]);
      onChange(created.id);
      setMode('existing');
      setNewName(''); setNewBudget(''); setNewStart(''); setNewEnd('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setMode('none');
    setNewName(''); setNewBudget(''); setNewStart(''); setNewEnd('');
    setError('');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: theme.color.surface2,
    border: `1.5px solid ${theme.color.border}`, borderRadius: 8, fontSize: 13,
    fontFamily: F, color: theme.color.text1, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: F }}>
      {/* Header label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <FaBullhorn size={13} color={theme.color.gold} />
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text1 }}>
            Campaign <span style={{ color: theme.color.text4, fontWeight: 500, fontSize: 12 }}>(optional)</span>
          </span>
        </div>
        {mode !== 'none' && (
          <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.color.text4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontFamily: F }}>
            <FaXmark size={11} /> No campaign
          </button>
        )}
      </div>

      {mode === 'none' && (
        /* Entry buttons */
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Link to existing */}
          <button
            onClick={() => setMode('existing')}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px dashed ${theme.color.border}`,
              background: theme.color.surface2, color: theme.color.text2, fontSize: 12,
              fontWeight: 700, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 7, transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = theme.color.gold; e.currentTarget.style.color = theme.color.goldDark; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = theme.color.border; e.currentTarget.style.color = theme.color.text2; }}
          >
            <FaBullhorn size={12} /> Add to Campaign
          </button>
          {/* Create new */}
          <button
            onClick={() => setMode('new')}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px dashed ${theme.color.border}`,
              background: theme.color.surface2, color: theme.color.text2, fontSize: 12,
              fontWeight: 700, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 7, transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = theme.color.gold; e.currentTarget.style.color = theme.color.goldDark; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = theme.color.border; e.currentTarget.style.color = theme.color.text2; }}
          >
            <FaPlus size={12} /> New Campaign
          </button>
        </div>
      )}

      <AnimatePresence>
        {mode === 'existing' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {/* Custom dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpen(o => !o)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1.5px solid ${value ? theme.color.gold : theme.color.border}`,
                  background: theme.color.surface2, color: value ? theme.color.text1 : theme.color.text4,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: value ? `0 0 0 3px ${theme.color.goldLight}` : 'none',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaBullhorn size={12} color={value ? theme.color.gold : theme.color.text4} />
                  {value ? (selectedCampaign?.name || 'Campaign selected') : 'Select a campaign...'}
                </span>
                <FaChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {open && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                        marginTop: 6, background: theme.color.surface,
                        border: `1px solid ${theme.color.border}`, borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto',
                      }}
                    >
                      {loading ? (
                        <div style={{ padding: '14px 16px', color: theme.color.text4, fontSize: 13 }}>Loading campaigns...</div>
                      ) : campaigns.length === 0 ? (
                        <div style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: 13, color: theme.color.text4, margin: '0 0 10px' }}>No campaigns yet.</p>
                          <button onClick={() => { setOpen(false); setMode('new'); }} style={{ fontSize: 12, fontWeight: 700, color: theme.color.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F }}>
                            + Create your first campaign
                          </button>
                        </div>
                      ) : (
                        campaigns.map(c => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectExisting(c.id)}
                            style={{
                              width: '100%', padding: '11px 16px', background: c.id === value ? theme.color.goldLight : 'transparent',
                              border: 'none', cursor: 'pointer', fontFamily: F, textAlign: 'left',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              transition: 'background 0.12s',
                            }}
                            onMouseOver={e => { if (c.id !== value) e.currentTarget.style.background = theme.color.surface2; }}
                            onMouseOut={e => { if (c.id !== value) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text1 }}>{c.name}</span>
                            <span style={{ fontSize: 11, color: theme.color.text4, textTransform: 'capitalize' }}>{c.status}</span>
                          </button>
                        ))
                      )}
                      <div style={{ borderTop: `1px solid ${theme.color.border2}`, padding: '10px 16px' }}>
                        <button onClick={() => { setOpen(false); setMode('new'); }} style={{ fontSize: 12, fontWeight: 700, color: theme.color.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FaPlus size={10} /> Create new campaign
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {mode === 'new' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ background: theme.color.surface2, border: `1.5px solid ${theme.color.border}`, borderRadius: 12, padding: '16px' }}
          >
            <p style={{ fontSize: 12, fontWeight: 800, color: theme.color.text2, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
              Create New Campaign
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Campaign Name *
                </label>
                <input
                  value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Grand Opening Promo"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Budget (₦) — optional
                </label>
                <input
                  type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)}
                  placeholder="e.g. 50000"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</label>
                  <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text3, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</label>
                  <input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} style={inputStyle} />
                </div>
              </div>
              {error && <p style={{ fontSize: 12, color: theme.color.error, margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={handleCreateNew} disabled={creating}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                    background: creating ? theme.color.border : theme.color.gold,
                    color: theme.color.charcoal900, fontSize: 13, fontWeight: 800,
                    cursor: creating ? 'not-allowed' : 'pointer', fontFamily: F,
                  }}
                >
                  {creating ? 'Creating...' : 'Create & Link'}
                </button>
                <button
                  onClick={() => setMode(campaigns.length > 0 ? 'existing' : 'none')}
                  style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${theme.color.border}`, background: 'transparent', color: theme.color.text3, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
                >
                  Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected indicator */}
      {value && selectedCampaign && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.color.success }} />
          <span style={{ fontSize: 12, color: theme.color.success, fontWeight: 700 }}>
            Linked to: {selectedCampaign.name}
          </span>
        </div>
      )}
    </div>
  );
}
