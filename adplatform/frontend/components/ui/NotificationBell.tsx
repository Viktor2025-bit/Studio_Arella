'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck, FaTrash, FaCircleCheck, FaCircleXmark, FaCalendarCheck, FaCreditCard, FaBullhorn, FaCalendarDays } from 'react-icons/fa6';
import api from '@/lib/api';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const POLL_INTERVAL = 30_000; // 30 seconds

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { Icon: any; color: string; bg: string; border: string }> = {
  creative_approved:   { Icon: FaCircleCheck,  color: '#2F6A3B', bg: theme.color.successLight, border: '#C7E0BE' },
  creative_rejected:   { Icon: FaCircleXmark,  color: '#8F3226', bg: theme.color.errorLight, border: '#EACAC3' },
  booking_confirmed:   { Icon: FaCalendarCheck,color: theme.color.goldDark, bg: theme.color.goldLight, border: theme.color.goldMid },
  booking_reminder:    { Icon: FaCalendarDays, color: '#96631D', bg: theme.color.warningLight, border: '#F0D19E' },
  booking_cancelled:   { Icon: FaCircleXmark,  color: '#8F3226', bg: theme.color.errorLight, border: '#EACAC3' },
  payment_received:    { Icon: FaCreditCard,   color: '#2F6A3B', bg: theme.color.successLight, border: '#C7E0BE' },
  new_creative_review: { Icon: FaBullhorn,     color: '#96631D', bg: theme.color.warningLight, border: '#F0D19E' },
  new_booking:         { Icon: FaCalendarCheck,color: '#0E7490', bg: '#DFFAFD', border: '#9CE9F2' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchUnread = useCallback(async () => {
    try {
      const r = await api.get('/notifications/unread');
      setUnread(r.data.unread || 0);
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data.notifications || []);
      setUnread(r.data.unread || 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // Fetch full list when panel opens
  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      setNotifications(n => n.filter(x => x.id !== id));
      if (wasUnread) setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const handleClick = (n: Notification) => {
    if (!n.read) handleMarkRead(n.id);
    if (n.link) { router.push(n.link); setOpen(false); }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ width: 38, height: 38, borderRadius: '50%', background: open ? theme.color.goldLight : theme.color.surface2, border: `1px solid ${open ? theme.color.goldMid : theme.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.15s' }}
      >
        <FaBell size={15} color={open ? theme.color.gold : theme.color.text2} />

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: theme.color.gold, border: `2px solid ${theme.color.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: theme.color.charcoal900, fontFamily: F }}
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 360, background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, boxShadow: theme.shadow.lg, zIndex: 50, overflow: 'hidden', fontFamily: F }}
          >
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.color.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 900, color: theme.color.text1, margin: 0 }}>Notifications</p>
                {unread > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, background: theme.color.goldLight, color: theme.color.goldDark, padding: '2px 8px', borderRadius: 100 }}>
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button onClick={handleMarkAllRead}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: theme.color.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F }}>
                  <FaCheck size={10} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ width: 22, height: 22, border: `2.5px solid ${theme.color.goldMid}`, borderTopColor: theme.color.gold, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <p style={{ fontSize: 12, color: theme.color.text3, margin: 0, fontWeight: 500 }}>Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: theme.color.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <FaBell size={20} color={theme.color.border} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: theme.color.text2, margin: '0 0 4px' }}>All caught up</p>
                  <p style={{ fontSize: 12, color: theme.color.text3, margin: 0, fontWeight: 500 }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n, i) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.new_booking;
                  const { Icon } = cfg;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleClick(n)}
                      style={{ display: 'flex', gap: 12, padding: '13px 18px', cursor: n.link ? 'pointer' : 'default', background: n.read ? 'transparent' : theme.color.goldLight, borderBottom: `1px solid ${theme.color.border2}`, transition: 'background 0.15s', position: 'relative' }}
                      onMouseOver={e => { if (n.link) (e.currentTarget as HTMLElement).style.background = theme.color.surface2; }}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : theme.color.goldLight}
                    >
                      {/* Unread dot */}
                      {!n.read && (
                        <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: theme.color.gold }} />
                      )}

                      {/* Icon */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 6 }}>
                        <Icon size={16} color={cfg.color} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: n.read ? 600 : 800, color: theme.color.text1, margin: '0 0 3px', lineHeight: 1.3 }}>{n.title}</p>
                        <p style={{ fontSize: 12, color: theme.color.text2, margin: '0 0 5px', lineHeight: 1.5, fontWeight: 500 }}>{n.body}</p>
                        <p style={{ fontSize: 10, color: theme.color.text3, margin: 0, fontWeight: 600 }}>{timeAgo(n.created_at)}</p>
                      </div>

                      {/* Delete */}
                      <button onClick={e => handleDelete(e, n.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.color.border, padding: '2px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', marginTop: 2, opacity: 0, transition: 'opacity 0.15s' }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = theme.color.error; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; (e.currentTarget as HTMLElement).style.color = theme.color.border; }}>
                        <FaTrash size={11} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{ padding: '11px 18px', borderTop: `1px solid ${theme.color.border2}`, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: theme.color.text3, margin: 0, fontWeight: 500 }}>
                  Showing last {notifications.length} notifications · Updates every 30s
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
