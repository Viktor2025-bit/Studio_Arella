'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { PenTool, Search, Eye, X, Check } from 'lucide-react';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm } as React.CSSProperties;

export default function AdminCreativeRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const fetchRequests = () => {
    api.get('/creative-requests/all')
      .then(r => setRequests(r.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      await api.put(`/creative-requests/${id}/status`, { status: newStatus });
      setRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = requests.filter(r =>
    r.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.ad_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: '8px', background: theme.color.goldLight, borderRadius: theme.radius.md, display: 'flex' }}>
              <PenTool size={20} color={theme.color.goldDark} />
            </div>
            <h1 style={{ fontFamily: theme.font.display, fontSize: 26, fontWeight: 700, color: theme.color.text1, margin: 0, letterSpacing: '-0.02em' }}>Creative Requests</h1>
          </div>
          <p style={{ fontSize: 14, color: theme.color.text3, margin: 0 }}>{requests.length} ad design requests submitted by advertisers</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.color.text3 }} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search business name, user, or ad type..." 
            style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.md, color: theme.color.text1, fontSize: 14, outline: 'none', fontFamily: F, boxSizing: 'border-box', transition: 'all 0.2s ease', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} 
            onFocus={e => { e.currentTarget.style.borderColor = theme.color.gold; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.color.goldLight}` }} 
            onBlur={e => { e.currentTarget.style.borderColor = theme.color.border; e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
          />
        </div>

        <div style={card}>
          <Table>
            <TableHead>
              {['Business', 'Advertiser', 'Ad Type', 'Budget', 'Date', 'Status', 'Action'].map(h => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableHead>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><Skeleton height={12} width={80} /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: theme.color.text3 }}>No creative requests found</td></tr>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell><span style={{ fontWeight: 700, color: theme.color.text1 }}>{r.business_name}</span></TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 13, color: theme.color.text1 }}>{r.user_name || '—'}</span>
                      <span style={{ fontSize: 11, color: theme.color.text3 }}>{r.user_email || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell><span style={{ textTransform: 'capitalize' }}>{r.ad_type}</span></TableCell>
                  <TableCell>{r.budget_range || '—'}</TableCell>
                  <TableCell><span style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</span></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <button onClick={() => setSelectedRequest(r)} style={{ background: theme.color.surface2, border: `1px solid ${theme.color.border}`, padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: theme.color.text2, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = theme.color.goldLight; e.currentTarget.style.borderColor = theme.color.goldMid; e.currentTarget.style.color = theme.color.goldDark; }} onMouseOut={e => { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.borderColor = theme.color.border; e.currentTarget.style.color = theme.color.text2; }}>
                      <Eye size={14} /> View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {selectedRequest && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,10,10,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: theme.color.surface, width: '100%', maxWidth: 600, borderRadius: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', border: `1px solid ${theme.color.border2}`, overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `1px solid ${theme.color.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: theme.color.goldLight, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PenTool size={18} color={theme.color.goldDark} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.color.text1 }}>Request Details</h2>
                      <p style={{ margin: 0, fontSize: 13, color: theme.color.text3 }}>{selectedRequest.business_name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRequest(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.color.text3 }}>
                    <X size={20} />
                  </button>
                </div>
                
                <div style={{ padding: '32px', maxHeight: '60vh', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                     <div>
                       <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.text4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Contact Phone</div>
                       <div style={{ fontSize: 14, color: theme.color.text1, fontWeight: 600 }}>{selectedRequest.contact_phone}</div>
                     </div>
                     <div>
                       <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.text4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Advertiser Email</div>
                       <div style={{ fontSize: 14, color: theme.color.text1, fontWeight: 600 }}>{selectedRequest.user_email}</div>
                     </div>
                     <div>
                       <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.text4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ad Type</div>
                       <div style={{ fontSize: 14, color: theme.color.text1, fontWeight: 600, textTransform: 'capitalize' }}>{selectedRequest.ad_type}</div>
                     </div>
                     <div>
                       <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.text4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Target Audience</div>
                       <div style={{ fontSize: 14, color: theme.color.text1, fontWeight: 600 }}>{selectedRequest.target_audience || 'Not specified'}</div>
                     </div>
                  </div>

                  <div style={{ background: theme.color.bg, padding: 20, borderRadius: 12, border: `1px solid ${theme.color.border}`, marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.text4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Ad Brief & Description</div>
                    <p style={{ margin: 0, fontSize: 15, color: theme.color.text1, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {selectedRequest.description}
                    </p>
                  </div>

                  {selectedRequest.reference_links && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.text4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Reference Links</div>
                      <a href={selectedRequest.reference_links} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: theme.color.goldDark, fontWeight: 600 }}>{selectedRequest.reference_links}</a>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: theme.color.surface2, borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: theme.color.text3, fontWeight: 600 }}>Current Status</div>
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        disabled={updating || selectedRequest.status === 'contacted'}
                        onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                        style={{ padding: '8px 16px', background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: theme.color.text1, cursor: updating || selectedRequest.status === 'contacted' ? 'not-allowed' : 'pointer', opacity: selectedRequest.status === 'contacted' ? 0.5 : 1 }}
                      >
                        Mark Contacted
                      </button>
                      <button 
                        disabled={updating || selectedRequest.status === 'completed'}
                        onClick={() => updateStatus(selectedRequest.id, 'completed')}
                        style={{ padding: '8px 16px', background: theme.color.gold, border: `1px solid ${theme.color.goldDark}`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: updating || selectedRequest.status === 'completed' ? 'not-allowed' : 'pointer', opacity: selectedRequest.status === 'completed' ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Check size={16} /> Mark Completed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
    </PageTransition>
  );
}
