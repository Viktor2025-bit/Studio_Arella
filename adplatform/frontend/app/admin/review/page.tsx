'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { PageTransition, FadeCard, Skeleton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { FaCircleCheck, FaCircleXmark, FaFilm, FaImage, FaEye } from 'react-icons/fa6';
import { Clock } from 'lucide-react';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card: React.CSSProperties = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg };

export default function AdminReviewPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const fetchQueue = async () => {
    try {
      const r = await api.get('/ads/review-queue');
      setQueue(r.data.queue || []);
    } catch { setQueue([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchQueue(); }, []);

  const handleDecision = async (adId: string, decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !reason.trim()) {
      toast('A rejection reason is required', 'error'); return;
    }
    setReviewing(adId);
    try {
      await api.put(`/ads/${adId}/review`, { decision, rejection_reason: reason });
      toast(`Creative ${decision}. Advertiser has been notified by email.`, 'success');
      setSelected(null); setReason('');
      fetchQueue();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Review failed', 'error');
    } finally { setReviewing(null); }
  };

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <FaEye size={17} color={theme.color.gold} />
            <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>Creative Review Queue</h1>
          </div>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>
            {queue.length} creative{queue.length !== 1 ? 's' : ''} total — pending ads are shown at the top
          </p>
        </div>

        {/* Warning */}
        <div style={{ background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} color={theme.color.gold} />
          <p style={{ fontSize: 13, color: theme.color.goldDark, fontWeight: 600, margin: 0 }}>Only APPROVED creatives can be attached to bookings — review promptly so advertisers aren't blocked.</p>
        </div>

        {loading ? (
          <div style={{ ...card, overflow: 'hidden' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: '18px 20px', borderBottom: `1px solid ${theme.color.border2}`, display: 'flex', gap: 14 }}>
                <Skeleton width={56} height={56} radius={10} />
                <div style={{ flex: 1 }}>
                  <Skeleton height={14} width={160} style={{ marginBottom: 8 }} />
                  <Skeleton height={12} width={100} />
                </div>
              </div>
            ))}
          </div>
        ) : queue.length === 0 ? (
          <FadeCard style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: theme.color.surface2, border: `1px solid ${theme.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <FaEye size={24} color={theme.color.text3} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: theme.color.text2, margin: '0 0 4px' }}>No creatives found</p>
            <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>No creatives have been submitted yet.</p>
          </FadeCard>
        ) : (
          <div style={{ ...card, overflow: 'hidden' }}>
            {queue.map((ad, i) => (
              <motion.div key={ad.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ padding: '18px 20px', borderBottom: i < queue.length - 1 ? `1px solid ${theme.color.border2}` : 'none' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* Thumbnail / file icon */}
                  <div style={{ width: 72, height: 54, borderRadius: 10, background: theme.color.surface2, border: `1px solid ${theme.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {ad.file_url && (ad.file_type === 'image' || ad.file_type === 'gif') ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${ad.file_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} onError={e => (e.currentTarget.style.display = 'none')} />
                    ) : ad.file_type === 'video' ? (
                      <FaFilm size={22} color={theme.color.text3} />
                    ) : (
                      <FaImage size={22} color={theme.color.text3} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1, margin: '0 0 2px' }}>{ad.title}</p>
                        <p style={{ fontSize: 12, color: theme.color.text3, margin: '0 0 6px' }}>
                          By <strong style={{ color: theme.color.text2 }}>{ad.advertiser_name}</strong> · {ad.advertiser_email}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: theme.color.text2, background: theme.color.surface2, padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' }}>{ad.file_type || ad.media_type}</span>
                          {ad.duration_seconds && <span style={{ fontSize: 10, fontWeight: 700, color: theme.color.text2, background: theme.color.surface2, padding: '2px 8px', borderRadius: 100 }}>{ad.duration_seconds}s</span>}
                          <span style={{ fontSize: 10, color: theme.color.text4 }}>Submitted {new Date(ad.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <StatusBadge status={ad.status} />
                    </div>

                    {/* Preview & actions */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                      {ad.file_url && (
                        <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${ad.file_url}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: theme.color.text2, textDecoration: 'none' }}>
                          <FaEye size={12} color={theme.color.text3} /> Preview
                        </a>
                      )}
                      {ad.status === 'pending' && (
                        <button onClick={() => { setSelected(ad); setReason(''); }}
                          style={{ padding: '7px 14px', background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, color: theme.color.goldDark, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Review modal */}
        <AnimatePresence>
          {selected && (
            <>
              <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelected(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
              <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: 16 }}>
                <motion.div key="modal"
                  initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.22 }}
                  style={{ width: '100%', maxWidth: 520, pointerEvents: 'auto' }}>
                <div style={{ background: theme.color.surface, borderRadius: theme.radius.xl, padding: 28, boxShadow: theme.shadow.lg, fontFamily: F }}>
                  <h2 style={{ fontFamily: theme.font.display, fontSize: 19, fontWeight: 600, color: theme.color.text1, margin: '0 0 4px' }}>Review: {selected.title}</h2>
                  <p style={{ fontSize: 13, color: theme.color.text3, margin: '0 0 18px' }}>by {selected.advertiser_name}</p>

                  {selected.file_url && (
                    <div style={{ background: theme.color.surface2, border: `1px solid ${theme.color.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 18, maxHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selected.file_type === 'video' ? (
                        <video src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${selected.file_url}`} controls style={{ maxWidth: '100%', maxHeight: 220 }} />
                      ) : (
                        <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${selected.file_url}`} alt="" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }} />
                      )}
                    </div>
                  )}

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Rejection reason <span style={{ color: theme.color.error }}>*</span> <span style={{ color: theme.color.text4, fontWeight: 400 }}>(required only if rejecting)</span>
                    </label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. Low resolution, content policy violation, unclear messaging..."
                      style={{ width: '100%', padding: '11px 14px', background: theme.color.surface, border: `1.5px solid ${theme.color.border}`, borderRadius: 10, fontSize: 13, fontFamily: F, color: theme.color.text1, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                      onFocus={e => { e.target.style.borderColor = theme.color.gold; e.target.style.boxShadow = `0 0 0 3px rgba(224,165,38,0.14)`; }}
                      onBlur={e => { e.target.style.borderColor = theme.color.border; e.target.style.boxShadow = 'none'; }} />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleDecision(selected.id, 'rejected')}
                      disabled={reviewing === selected.id}
                      style={{ flex: 1, padding: '12px', background: theme.color.errorLight, color: '#8F3226', border: '1.5px solid #EACAC3', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: F }}>
                      <FaCircleXmark size={14} /> Reject
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleDecision(selected.id, 'approved')}
                      disabled={reviewing === selected.id}
                      style={{ flex: 1, padding: '12px', background: theme.color.successLight, color: '#2F6A3B', border: '1.5px solid #C7E0BE', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: F }}>
                      <FaCircleCheck size={14} /> Approve
                    </motion.button>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', color: theme.color.text3, border: `1px solid ${theme.color.border}`, borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: F }}>
                    Cancel
                  </button>
                </div>
              </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
