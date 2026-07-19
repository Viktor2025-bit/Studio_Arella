'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, Skeleton, AnimatedButton } from '@/components/ui/Animations';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaTrash, FaFilm, FaImage, FaArrowRight,
  FaCloudArrowUp, FaCircleCheck, FaXmark,
} from 'react-icons/fa6';
import Link from 'next/link';
import { BsFiletypeGif } from 'react-icons/bs';
import CampaignPicker from '@/components/ui/CampaignPicker';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card: React.CSSProperties = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg };
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

type AdStatus = 'pending' | 'approved' | 'rejected' | 'draft';

interface Ad {
  id: string;
  title: string;
  status: AdStatus;
  file_type: string;
  file_url: string;
  media_url: string;
  duration_seconds: number;
  campaign_name?: string;
  rejection_reason?: string;
  created_at: string;
}

const ALLOWED_TYPES = ['video/mp4','video/quicktime','image/jpeg','image/jpg','image/png','image/gif'];
const MAX_SIZE_MB = 500;

function FileDropZone({ onFile }: { onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      alert('Unsupported file type. Please upload MP4, MOV, JPG, PNG, or GIF.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }
    onFile(f);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? theme.color.gold : theme.color.border}`,
        background: dragging ? theme.color.goldLight : theme.color.surface2,
        borderRadius: 12, padding: '32px 20px', textAlign: 'center',
        cursor: 'pointer', transition: 'all 0.18s',
      }}
    >
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,image/jpeg,image/jpg,image/png,image/gif"
        style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
      <div style={{ width: 48, height: 48, borderRadius: 14, background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <FaCloudArrowUp size={22} color={theme.color.gold} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: theme.color.text1, margin: '0 0 4px' }}>
        {dragging ? 'Drop your file here' : 'Click to upload or drag & drop'}
      </p>
      <p style={{ fontSize: 12, color: theme.color.text3, margin: 0 }}>MP4, MOV, JPG, PNG, GIF · Max 500MB</p>
    </div>
  );
}

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: theme.color.text2, fontWeight: 600 }}>Uploading...</span>
        <span style={{ fontSize: 12, color: theme.color.gold, fontWeight: 700 }}>{progress}%</span>
      </div>
      <div style={{ height: 6, background: theme.color.surface2, borderRadius: 3, overflow: 'hidden' }}>
        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${theme.color.gold}, ${theme.color.charcoal700})`, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function FilePreview({ file, onDurationChange }: { file: File, onDurationChange?: (duration: number) => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const isVideo = file.type.startsWith('video/');
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

  return (
    <div style={{ background: theme.color.charcoal900, border: `1px solid ${theme.color.border}`, borderRadius: 10, overflow: 'hidden' }}>
      {isVideo ? (
        <video
          src={url || undefined}
          autoPlay
          loop
          muted
          playsInline
          controls
          onLoadedMetadata={e => onDurationChange?.(e.currentTarget.duration)}
          style={{ width: '100%', maxHeight: 220, display: 'block', background: '#000' }}
        />
      ) : (
        <img src={url || undefined} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', background: theme.color.surface2 }} />
      )}
      <div style={{ padding: '10px 14px', background: theme.color.surface2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: theme.color.text2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{file.name}</span>
        <span style={{ fontSize: 12, color: theme.color.text3, flexShrink: 0 }}>{sizeMB} MB</span>
      </div>
    </div>
  );
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const { toast } = useToast();

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: theme.color.surface,
    border: `1.5px solid ${theme.color.border}`, borderRadius: 10, fontSize: 13,
    fontFamily: F, color: theme.color.text1, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const fetchAds = async () => {
    try { const r = await api.get('/ads'); setAds(r.data.ads || []); }
    catch { setAds([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchAds(); }, []);

  const handleUpload = async () => {
    if (!title.trim()) { toast('Please enter an ad title', 'error'); return; }
    if (!selectedFile)  { toast('Please select a file to upload', 'error'); return; }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      if (videoDuration > 0) {
        formData.append('duration_seconds', Math.ceil(videoDuration).toString());
      }
      if (campaignId) {
        formData.append('campaign_id', campaignId);
      }

      const token = localStorage.getItem('token');

      // Use XMLHttpRequest for upload progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else {
            try { reject(new Error(JSON.parse(xhr.responseText)?.message || 'Upload failed')); }
            catch { reject(new Error('Upload failed')); }
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ads`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      toast('Creative uploaded! It\'s now in the admin review queue. You\'ll be notified when approved.', 'success');
      setShowModal(false);
      setSelectedFile(null);
      setTitle('');
      setCampaignId(null);
      setUploadProgress(0);
      fetchAds();
    } catch (err: any) {
      toast(err?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this creative?')) return;
    try {
      await api.delete(`/ads/${id}`);
      setAds(p => p.filter(a => a.id !== id));
      toast('Creative deleted', 'info');
    } catch { toast('Failed to delete', 'error'); }
  };

  const fileIcon = (type: string) => {
    if (type === 'video') return <FaFilm size={26} color={theme.color.text3} />;
    if (type === 'gif')   return <BsFiletypeGif  size={26} color={theme.color.text3} />;
    return <FaImage size={26} color={theme.color.text3} />;
  };

  const statusInfo: Record<string, { text: string; bg: string; color: string }> = {
    pending:  { text: 'This creative is currently pending and cannot be used yet.', bg: theme.color.goldLight, color: theme.color.goldDark },
    approved: { text: 'Approved! You can now attach this creative to a booking.', bg: theme.color.successLight, color: '#2F6A3B' },
    rejected: { text: 'Rejected by admin — see reason below. Please re-upload a corrected version.', bg: theme.color.errorLight, color: '#8F3226' },
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: theme.color.text1, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FaFilm size={24} color={theme.color.gold} /> My Ad Creatives
              </h2>
              <p style={{ fontSize: 13, color: theme.color.text3, margin: '4px 0 0' }}>
                Upload your videos and images here. All creatives are instantly available for your bookings.
              </p>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setShowModal(true); setSelectedFile(null); setTitle(''); setUploadProgress(0); }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: theme.color.gold, color: theme.color.charcoal900, border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              <FaPlus size={13} /> Upload Creative
            </motion.button>
          </div>

          {/* Info banner */}
          <div style={{ background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
            <FaCircleCheck size={14} color={theme.color.gold} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: theme.color.goldDark, margin: '0 0 2px' }}>How creatives work</p>
              <p style={{ fontSize: 12, color: theme.color.text3, margin: 0, lineHeight: 1.6 }}>
                Upload your image or video → you can instantly attach it to any booking.
                Don't have a creative? <Link href="/creative" style={{ color: theme.color.gold, fontWeight: 700, textDecoration: 'none' }}>Request our design team →</Link>
              </p>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 240px),1fr))', gap: 14 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ ...card, padding: 18 }}>
                  <Skeleton height={120} radius={10} style={{ marginBottom: 12 }} />
                  <Skeleton height={14} style={{ marginBottom: 8 }} />
                  <Skeleton height={12} width="60%" />
                </div>
              ))}
            </div>
          ) : ads.length === 0 ? (
            <FadeCard style={{ ...card, padding: '52px 20px', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 17, background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FaCloudArrowUp size={26} color={theme.color.gold} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: theme.color.text1, margin: '0 0 6px' }}>No creatives uploaded yet</p>
              <p style={{ fontSize: 13, color: theme.color.text3, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                Upload your first image or video to display on the Studio Arella screen at Bems Junction.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: theme.color.gold, color: theme.color.charcoal900, border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                  <FaCloudArrowUp size={13} /> Upload creative
                </motion.button>
                <Link href="/creative" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: theme.color.surface2, border: `1px solid ${theme.color.border}`, color: theme.color.text2, borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Request creative team
                </Link>
              </div>
            </FadeCard>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 260px),1fr))', gap: 14 }}>
              {ads.map((ad, i) => {
                const fileUrl = ad.file_url 
                  ? (ad.file_url.startsWith('http') ? ad.file_url : `${API_BASE}${ad.file_url}`) 
                  : null;
                const info = statusInfo[ad.status] || statusInfo.pending;
                return (
                  <FadeCard key={ad.id} delay={i * 0.05} style={{ ...card, overflow: 'hidden' }}>
                    {/* Thumbnail / preview */}
                    <div 
                      style={{ height: 220, background: theme.color.charcoal900, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
                      onMouseEnter={e => {
                        const vid = e.currentTarget.querySelector('video');
                        if (vid) {
                          const p = vid.play();
                          if (p !== undefined) p.catch(() => {});
                        }
                      }}
                      onMouseLeave={e => {
                        const vid = e.currentTarget.querySelector('video');
                        if (vid) {
                          vid.pause();
                          vid.currentTime = 0;
                        }
                      }}
                    >
                      {fileUrl && ad.file_type === 'video' ? (
                        <video
                          src={fileUrl}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : fileUrl && (ad.file_type === 'image' || ad.file_type === 'gif') ? (
                        <img src={fileUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: theme.color.surface2 }}>
                          {fileIcon(ad.file_type)}
                        </div>
                      )}
                      {/* Status overlay badge */}
                      {ad.status !== 'pending' && ad.status !== 'approved' && (
                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
                          <StatusBadge status={ad.status} />
                        </div>
                      )}
                      {/* Type badge */}
                      <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(10,10,10,0.7)', borderRadius: 6, padding: '2px 8px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ad.file_type || 'image'}</span>
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: theme.color.text1, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.title}</p>
                      <p style={{ fontSize: 11, color: theme.color.text3, margin: '0 0 10px' }}>
                        {ad.campaign_name ? `Campaign: ${ad.campaign_name}` : 'No campaign linked'}
                        {ad.duration_seconds ? ` · ${ad.duration_seconds}s` : ''}
                      </p>

                      {/* Status message */}
                      {ad.status === 'rejected' && (
                        <div style={{ background: info.bg, borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: info.color, lineHeight: 1.5 }}>
                            {info.text}
                            {ad.rejection_reason && <span style={{ display: 'block', marginTop: 4, opacity: 0.8 }}>"{ad.rejection_reason}"</span>}
                          </p>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        {ad.status !== 'rejected' && (
                          <Link href="/book" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: theme.color.success, textDecoration: 'none', background: theme.color.successLight, border: '1px solid #C7E0BE', padding: '5px 10px', borderRadius: 7 }}>
                            Use in booking <FaArrowRight size={9} />
                          </Link>
                        )}
                        {ad.status === 'rejected' && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setShowModal(true); setTitle(ad.title); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: theme.color.gold, background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: F }}>
                            Re-upload <FaCloudArrowUp size={9} />
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(ad.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.color.border, display: 'flex', padding: 4, marginLeft: 'auto' }}
                          onMouseOver={e => (e.currentTarget.style.color = theme.color.error)}
                          onMouseOut={e => (e.currentTarget.style.color = theme.color.border)}>
                          <FaTrash size={13} />
                        </motion.button>
                      </div>
                    </div>
                  </FadeCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !uploading && setShowModal(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.45)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
              <motion.div key="modal"
                initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.22 }}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
                <div style={{ background: theme.color.surface, borderRadius: theme.radius.xl, padding: 28, boxShadow: theme.shadow.lg, fontFamily: F, width: '100%', maxWidth: 520, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', pointerEvents: 'all' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontFamily: theme.font.display, fontSize: 20, fontWeight: 600, color: theme.color.text1, margin: 0 }}>Upload Ad Creative</h2>
                    {!uploading && (
                      <button onClick={() => { setShowModal(false); setCampaignId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.color.text3, display: 'flex', padding: 4 }}>
                        <FaXmark size={18} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ad title *</label>
                      <input type="text" placeholder="e.g. Grand Opening Promo — August 2025" value={title}
                        onChange={e => setTitle(e.target.value)} style={inputStyle} autoFocus
                        onFocus={e => { e.target.style.borderColor = theme.color.gold; e.target.style.boxShadow = `0 0 0 3px rgba(224,165,38,0.14)`; }}
                        onBlur={e => { e.target.style.borderColor = theme.color.border; e.target.style.boxShadow = 'none'; }} />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        File <span style={{ color: theme.color.text3, fontWeight: 400, textTransform: 'none' }}>— MP4, MOV (video) or JPG, PNG, GIF (image)</span>
                      </label>
                      {!selectedFile ? (
                        <FileDropZone onFile={f => {
                          setSelectedFile(f);
                          if (!title.trim()) {
                            setTitle(f.name.replace(/\.[^/.]+$/, ""));
                          }
                        }} />
                      ) : (
                        <div>
                          <FilePreview file={selectedFile} onDurationChange={setVideoDuration} />
                          {!uploading && (
                            <button onClick={() => setSelectedFile(null)}
                              style={{ marginTop: 8, fontSize: 12, color: theme.color.text3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, textDecoration: 'underline' }}>
                              Choose a different file
                            </button>
                          )}
                          {uploading && <UploadProgress progress={uploadProgress} />}
                        </div>
                      )}
                    </div>

                    {/* Campaign picker — optional */}
                    <div style={{ borderTop: `1px solid ${theme.color.border2}`, paddingTop: 16 }}>
                      <CampaignPicker value={campaignId} onChange={setCampaignId} />
                    </div>

                  </div>

                  {!uploading ? (
                    <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                      <button onClick={() => setShowModal(false)}
                        style={{ flex: 1, padding: '12px', background: theme.color.surface2, color: theme.color.text2, border: `1.5px solid ${theme.color.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                        Cancel
                      </button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleUpload} disabled={!selectedFile || !title.trim()}
                        style={{ flex: 1, padding: '12px', background: selectedFile && title.trim() ? theme.color.gold : theme.color.surface2, color: selectedFile && title.trim() ? theme.color.charcoal900 : theme.color.text3, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: selectedFile && title.trim() ? 'pointer' : 'not-allowed', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                        <FaCloudArrowUp size={14} /> Upload Creative
                      </motion.button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 22, padding: '14px', background: theme.color.goldLight, border: `1px solid ${theme.color.goldMid}`, borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: theme.color.goldDark, margin: 0 }}>
                        Uploading... {uploadProgress}% — please don't close this window
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </PageTransition>
    </DashboardLayout>
  );
}
