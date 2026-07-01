'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';

const F = "'Quicksand', sans-serif";

interface PlaylistItem {
  booking_reference: string;
  booking_id: string;
  creative_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  media_url: string;
  media_type: 'image' | 'video';
}

export default function ScreenPlayerPage() {
  const params = useParams();
  const screen_id = params.screen_id as string;

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentAd, setCurrentAd] = useState<PlaylistItem | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [logsQueue, setLogsQueue] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Fetch Playlist
  const fetchManifest = async () => {
    try {
      // For the player, we might bypass the usual interceptor or assume it allows no-auth for this route.
      // Assuming api.get handles it or we use raw fetch if auth fails.
      const res = await api.get(`/player/manifest/${screen_id}`);
      setPlaylist(res.data.manifest || []);
      setOfflineMode(false);
    } catch (err) {
      console.error('Failed to fetch manifest. Entering offline mode.', err);
      setOfflineMode(true);
    }
  };

  useEffect(() => {
    fetchManifest();
    // Refresh manifest every 5 minutes
    const interval = setInterval(fetchManifest, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [screen_id]);

  // 2. Playback Loop
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      let activeAd: PlaylistItem | null = null;

      for (const item of playlist) {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        if (now >= start && now <= end) {
          activeAd = item;
          break;
        }
      }

      setCurrentAd(activeAd);
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 1000); // Check every second
    return () => clearInterval(interval);
  }, [playlist]);

  // 3. Log playback
  const logPlay = (ad: PlaylistItem, status: string) => {
    const log = {
      screen_id,
      booking_id: ad.booking_id,
      creative_id: ad.creative_id,
      start_timestamp: ad.start_time, // approximate, in a real system we'd track exact start
      end_timestamp: new Date().toISOString(),
      completion_status: status
    };
    
    setLogsQueue(prev => [...prev, log]);
  };

  // Sync logs to server
  useEffect(() => {
    const syncLogs = async () => {
      if (logsQueue.length === 0) return;
      try {
        await api.post('/player/logs', { logs: logsQueue });
        setLogsQueue([]); // Clear queue on success
      } catch (e) {
        console.error('Failed to sync logs, will retry.', e);
      }
    };
    const interval = setInterval(syncLogs, 60000); // Sync every minute
    return () => clearInterval(interval);
  }, [logsQueue]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative', fontFamily: F }}>
      {offlineMode && (
        <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(239,68,68,0.8)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, zIndex: 50 }}>
          OFFLINE CACHE
        </div>
      )}
      
      {!currentAd ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
          <h1 style={{ color: '#fff', fontSize: '5vw', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>STUDIO ARELLA</h1>
          <p style={{ color: '#6B7280', fontSize: '2vw', marginTop: 10, textTransform: 'uppercase', letterSpacing: '8px' }}>Digital Billboard</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {currentAd.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentAd.media_url}
              autoPlay
              muted
              loop // In a real system, we'd listen for 'ended' event to log and move on. Since this is time-based slots, looping is safer if slot > video duration.
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onEnded={() => logPlay(currentAd, 'completed')}
            />
          ) : (
            <img 
              src={currentAd.media_url} 
              alt="Ad" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              onLoad={() => {
                // For static images, we just log it as played if it stayed on screen for the slot duration.
                // We'll log it when the component unmounts or the ad changes.
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
