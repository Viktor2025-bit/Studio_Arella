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

const F = "'Quicksand', sans-serif";
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 };
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
        border: `2px dashed ${dragging ? '#D4AF37' : '#E5E7EB'}`,
        background: dragging ? '#F9F6EA' : '#FAFAFA',
        borderRadius: 12, padding: '32px 20px', textAlign: 'center',
        cursor: 'pointer', transition: 'all 0.18s',
      }}
    >
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,image/jpeg,image/jpg,image/png,image/gif"
        style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F9F6EA', border: '1px solid #E3C762', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <FaCloudArrowUp size={22} color="#D4AF37" />
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>
        {dragging ? 'Drop your file here' : 'Click to upload or drag & drop'}
      </p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>MP4, MOV, JPG, PNG, GIF · Max 500MB</p>
    </div>
  );
}

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Uploading...</span>
        <span style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700 }}>{progress}%</span>
      </div>
      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }}
          style={{ height: '100%', background: 'linear-gradient(90deg, #D4AF37, #6D28D9)', borderRadius: 3 }} />
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
    <div style={{ background: '#1A1A1A', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
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
        <img src={url || undefined} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', background: '#F8FAFC' }} />
      )}
      <div style={{ padding: '10px 14px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{file.name}</span>
        <span style={{ fontSize: 12, color: '#94A3B8', flexShrink: 0 }}>{sizeMB} MB</span>
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
  const { toast } = useToast();

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: '#fff',
    border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13,
    fontFamily: F, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box',
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
    if (type === 'video') return <FaFilm size={26} color="#94A3B8" />;
    if (type === 'gif')   return <BsFiletypeGif  size={26} color="#94A3B8" />;
    return <FaImage size={26} color="#94A3B8" />;
  };

  const statusInfo: Record<string, { text: string; bg: string; color: string }> = {
    pending:  { text: 'Awaiting admin review before you can use this creative in a booking.', bg: '#F9F6EA', color: '#8F7212' },
    approved: { text: 'Approved! You can now attach this creative to a booking.', bg: '#F0FDF4', color: '#15803D' },
    rejected: { text: 'Rejected by admin — see reason below. Please re-upload a corrected version.', bg: '#FEF2F2', color: '#B91C1C' },
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                <FaFilm size={17} color="#D4AF37" />
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>My Ad Creatives</h1>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                Upload your videos and images here. All creatives are reviewed by our team before going live.
              </p>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setShowModal(true); setSelectedFile(null); setTitle(''); setUploadProgress(0); }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              <FaPlus size={13} /> Upload Creative
            </motion.button>
          </div>

          {/* Info banner */}
          <div style={{ background: '#F9F6EA', border: '1px solid #E3C762', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
            <FaCircleCheck size={14} color="#D4AF37" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#8F7212', margin: '0 0 2px' }}>How creatives work</p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                Upload your image or video → our team reviews it → once <strong style={{ color: '#16A34A' }}>Approved</strong> you can attach it to any booking.
                Don't have a creative? <Link href="/creative" style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none' }}>Request our design team →</Link>
              </p>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
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
              <div style={{ width: 60, height: 60, borderRadius: 17, background: '#F9F6EA', border: '1px solid #E3C762', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FaCloudArrowUp size={26} color="#D4AF37" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px' }}>No creatives uploaded yet</p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                Upload your first image or video to display on the Studio Arella screen at Bems Junction.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                  <FaCloudArrowUp size={13} /> Upload creative
                </motion.button>
                <Link href="/creative" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Request creative team
                </Link>
              </div>
            </FadeCard>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
              {ads.map((ad, i) => {
                const fileUrl = ad.file_url ? `${API_BASE}${ad.file_url}` : null;
                const info = statusInfo[ad.status] || statusInfo.pending;
                return (
                  <FadeCard key={ad.id} delay={i * 0.05} style={{ ...card, overflow: 'hidden' }}>
                    {/* Thumbnail / preview */}
                    <div style={{ height: 140, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      {fileUrl && ad.file_type === 'video' ? (
                        <video
                          src={fileUrl}
                          muted
                          loop
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onMouseOver={e => (e.currentTarget as HTMLVideoElement).play()}
                          onMouseOut={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                        />
                      ) : fileUrl && (ad.file_type === 'image' || ad.file_type === 'gif') ? (
                        <img src={fileUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#F8FAFC' }}>
                          {fileIcon(ad.file_type)}
                        </div>
                      )}
                      {/* Status overlay badge */}
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <StatusBadge status={ad.status} />
                      </div>
                      {/* Type badge */}
                      <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(10,10,10,0.7)', borderRadius: 6, padding: '2px 8px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ad.file_type || 'image'}</span>
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.title}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 10px' }}>
                        {ad.campaign_name ? `Campaign: ${ad.campaign_name}` : 'No campaign linked'}
                        {ad.duration_seconds ? ` · ${ad.duration_seconds}s` : ''}
                      </p>

                      {/* Status message */}
                      <div style={{ background: info.bg, borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
                        <p style={{ fontSize: 11, color: info.color, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                          {ad.status === 'rejected' && ad.rejection_reason
                            ? `Rejected: ${ad.rejection_reason}`
                            : info.text}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        {ad.status === 'approved' && (
                          <Link href="/book" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#16A34A', textDecoration: 'none', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '5px 10px', borderRadius: 7 }}>
                            Use in booking <FaArrowRight size={9} />
                          </Link>
                        )}
                        {ad.status === 'rejected' && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setShowModal(true); setTitle(ad.title); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#D4AF37', background: '#F9F6EA', border: '1px solid #E3C762', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: F }}>
                            Re-upload <FaCloudArrowUp size={9} />
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(ad.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', display: 'flex', padding: 4, marginLeft: 'auto' }}
                          onMouseOver={e => (e.currentTarget.style.color = '#EF4444')}
                          onMouseOut={e => (e.currentTarget.style.color = '#CBD5E1')}>
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
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
              <motion.div key="modal"
                initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.22 }}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
                <div style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: F, width: '100%', maxWidth: 520, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', pointerEvents: 'all' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Upload Ad Creative</h2>
                    {!uploading && (
                      <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4 }}>
                        <FaXmark size={18} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ad title *</label>
                      <input type="text" placeholder="e.g. Grand Opening Promo — August 2025" value={title}
                        onChange={e => setTitle(e.target.value)} style={inputStyle} autoFocus
                        onFocus={e => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        File <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none' }}>— MP4, MOV (video) or JPG, PNG, GIF (image)</span>
                      </label>
                      {!selectedFile ? (
                        <FileDropZone onFile={f => setSelectedFile(f)} />
                      ) : (
                        <div>
                          <FilePreview file={selectedFile} onDurationChange={setVideoDuration} />
                          {!uploading && (
                            <button onClick={() => setSelectedFile(null)}
                              style={{ marginTop: 8, fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, textDecoration: 'underline' }}>
                              Choose a different file
                            </button>
                          )}
                          {uploading && <UploadProgress progress={uploadProgress} />}
                        </div>
                      )}
                    </div>

                    {!uploading && (
                      <div style={{ background: '#F9F6EA', border: '1px solid #E3C762', borderRadius: 10, padding: '10px 14px' }}>
                        <p style={{ fontSize: 12, color: '#8F7212', margin: 0, lineHeight: 1.55 }}>
                          After uploading, your creative enters our <strong>review queue</strong>. You'll receive an email once approved. Only approved creatives can be used in bookings.
                        </p>
                      </div>
                    )}
                  </div>

                  {!uploading ? (
                    <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                      <button onClick={() => setShowModal(false)}
                        style={{ flex: 1, padding: '12px', background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                        Cancel
                      </button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleUpload} disabled={!selectedFile || !title.trim()}
                        style={{ flex: 1, padding: '12px', background: selectedFile && title.trim() ? '#D4AF37' : '#F3F4F6', color: selectedFile && title.trim()  ? '#111111' : '#94A3B8', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: selectedFile && title.trim() ? 'pointer' : 'not-allowed', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                        <FaCloudArrowUp size={14} /> Upload Creative
                      </motion.button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 22, padding: '14px', background: '#F9F6EA', border: '1px solid #E3C762', borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#8F7212', margin: 0 }}>
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
