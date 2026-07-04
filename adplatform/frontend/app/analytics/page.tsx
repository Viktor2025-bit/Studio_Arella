'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { BarChart2, Calendar, PlayCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { theme } from '@/lib/theme';

const F = theme.font.body;

interface PlayData {
  creative_title: string;
  booking_number: string;
  play_count: string;
  last_played: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<PlayData[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/proof-of-play')
      .then(r => {
        setData(r.data.breakdown || []);
        setTotalPlays(r.data.total_plays || 0);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, fontFamily: F }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: theme.font.display, fontSize: 26, fontWeight: 600, color: theme.color.text1, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Proof of Play Analytics</h1>
            <p style={{ fontSize: 13, color: theme.color.text2, margin: 0, fontWeight: 500 }}>Track how many times your creatives have been played.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.color.text3 }}>Loading analytics...</div>
        ) : (
          <>
            {/* Overview Card */}
            <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: theme.color.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayCircle size={28} color={theme.color.success} />
              </div>
              <div>
                <p style={{ fontSize: 13, color: theme.color.text2, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Plays</p>
                <p style={{ fontSize: 32, fontWeight: 900, color: theme.color.text1, margin: 0, letterSpacing: '-1px' }}>{totalPlays.toLocaleString()}</p>
              </div>
            </div>

            {/* Breakdown Table */}
            <div style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.color.border2}`, background: theme.color.surface2 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: theme.color.text1, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart2 size={16} color={theme.color.text2} /> Play Breakdown
                </h2>
              </div>
              {data.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, background: theme.color.surface2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <BarChart2 size={24} color={theme.color.border} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: theme.color.text2, margin: '0 0 4px' }}>No analytics yet</p>
                  <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>Data will appear here once your ads start playing.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.color.border2}` }}>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: theme.color.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Creative</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: theme.color.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Ref</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: theme.color.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Play Count</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: theme.color.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <motion.tr key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ borderBottom: `1px solid ${theme.color.border2}`, transition: 'background 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.background = theme.color.surface2)}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: theme.color.text1 }}>{row.creative_title}</td>
                        <td style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: theme.color.text2, fontFamily: 'monospace' }}>{row.booking_number}</td>
                        <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 800, color: theme.color.success }}>{parseInt(row.play_count).toLocaleString()}</td>
                        <td style={{ padding: '16px 24px', fontSize: 12, color: theme.color.text2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} />
                          {row.last_played ? format(new Date(row.last_played), 'MMM d, h:mm a') : '—'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
