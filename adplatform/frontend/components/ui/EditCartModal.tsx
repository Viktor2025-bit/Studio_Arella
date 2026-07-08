'use client';

import { useState, useEffect } from 'react';
import { X, Info, Clock, Calendar as CalendarIcon, Check } from 'lucide-react';
import { theme } from '@/lib/theme';
import api from '@/lib/api';
import { useCartStore, CartItem } from '@/store/cartStore';
import { START_HOUR, END_HOUR, PPM, calcCost, naira, localDateKey, isStartInsideBooking, formatMin, addDays } from '@/lib/utils';
import { AnimatedButton } from '@/components/ui/Animations';

const SCREEN_ID = '00000000-0000-0000-0000-000000000001';

interface EditCartModalProps {
  item: CartItem;
  onClose: () => void;
  initialTab?: 'time' | 'period';
}

export default function EditCartModal({ item, onClose, initialTab = 'time' }: EditCartModalProps) {
  const { cart, updateCartItem } = useCartStore();
  const [editDate, setEditDate] = useState<Date>(new Date(item.date));
  const [editHour, setEditHour] = useState<number>(Math.floor(item.startMin / 60));
  const [editMinute, setEditMinute] = useState<number>(item.startMin % 60);
  const [editLoops, setEditLoops] = useState<number>(item.loops);
  
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const s = new Date(editDate.getFullYear(), editDate.getMonth(), 1).toISOString();
    const e = new Date(editDate.getFullYear(), editDate.getMonth() + 1, 0).toISOString();
    api.get(`/bookings/slots?screen_id=${SCREEN_ID}&start_date=${s}&end_date=${e}`)
      .then(res => {
         const slots = res.data.slots || [];
         const formatted = slots.map((s: any) => {
           const sd = new Date(s.start_time);
           const ed = new Date(s.end_time);
           return {
             id: s.id,
             dateKey: localDateKey(sd),
             startMin: sd.getHours() * 60 + sd.getMinutes(),
             durationMin: (ed.getTime() - sd.getTime()) / 60000,
           };
         });
         setLiveBookings(formatted);
      })
      .catch(() => setError("Failed to fetch availability"))
      .finally(() => setLoading(false));
  }, [editDate]);

  function getBookingsForDate(dateKey: string) {
    const others = liveBookings.filter((b) => b.dateKey === dateKey);
    const cartItems = cart
      .filter((c) => localDateKey(new Date(c.date)) === dateKey && c.id !== item.id)
      .map((c) => ({ startMin: c.startMin, durationMin: Math.max(1, Math.ceil(c.durationSec / 60)) }));
    return [...others, ...cartItems];
  }

  const durationSec = editLoops * (item.creative?.duration_seconds || 60);
  const durationMin = Math.max(1, Math.ceil(durationSec / 60));
  const startMin = editHour * 60 + editMinute;
  
  const bookings = getBookingsForDate(localDateKey(editDate));
  
  let conflict = false;
  for (let m = 0; m < durationMin; m++) {
    if (isStartInsideBooking(startMin + m, bookings)) {
      conflict = true;
      break;
    }
  }

  const priceInfo = calcCost(durationSec, item.creative?.ppm_rate || PPM);

  const handleSave = () => {
    if (conflict) return;
    updateCartItem(item.id, {
      date: editDate,
      startMin: startMin,
      loops: editLoops,
      durationSec: durationSec,
      priceInfo: priceInfo
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      
      <div style={{ background: theme.color.surface, width: "100%", maxWidth: 500, borderRadius: 24, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${theme.color.border}` }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: theme.color.text1 }}>
            {initialTab === 'period' ? 'Change Period' : 'Edit Cart Item'}
          </div>
          <button onClick={onClose} style={{ background: theme.color.surface2, border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", color: theme.color.text2 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 32, overflowY: "auto" }}>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: theme.color.text2, marginBottom: 8 }}>Date</div>
            <input 
              type="date" 
              value={localDateKey(editDate)}
              min={localDateKey(new Date())}
              onChange={(e) => setEditDate(new Date(e.target.value))}
              style={{ width: "100%", padding: 16, borderRadius: 12, border: `1px solid ${theme.color.border}`, background: theme.color.surface2, color: theme.color.text1, fontFamily: "inherit", fontSize: 16, fontWeight: 600 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.color.text2, marginBottom: 8 }}>Start Hour</div>
              <select 
                value={editHour}
                onChange={(e) => setEditHour(Number(e.target.value))}
                style={{ width: "100%", padding: 16, borderRadius: 12, border: `1px solid ${theme.color.border}`, background: theme.color.surface2, color: theme.color.text1, fontFamily: "inherit", fontSize: 16, fontWeight: 600 }}
              >
                {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                  const h = START_HOUR + i;
                  return <option key={h} value={h}>{formatMin(h * 60).replace(':00', '')}</option>;
                })}
              </select>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.color.text2, marginBottom: 8 }}>Start Minute</div>
              <select 
                value={editMinute}
                onChange={(e) => setEditMinute(Number(e.target.value))}
                style={{ width: "100%", padding: 16, borderRadius: 12, border: `1px solid ${theme.color.border}`, background: theme.color.surface2, color: theme.color.text1, fontFamily: "inherit", fontSize: 16, fontWeight: 600 }}
              >
                {Array.from({ length: 60 }).map((_, m) => (
                  <option key={m} value={m}>:{String(m).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: theme.color.text2, marginBottom: 8 }}>Loops (Plays)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button 
                onClick={() => setEditLoops(Math.max(1, editLoops - 1))}
                style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${theme.color.border}`, background: theme.color.surface2, fontSize: 20, fontWeight: 600, cursor: "pointer", color: theme.color.text1 }}
              >-</button>
              <div style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 18, color: theme.color.text1 }}>
                {editLoops}
              </div>
              <button 
                onClick={() => setEditLoops(editLoops + 1)}
                style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${theme.color.border}`, background: theme.color.surface2, fontSize: 20, fontWeight: 600, cursor: "pointer", color: theme.color.text1 }}
              >+</button>
            </div>
          </div>

          <div style={{ background: conflict ? theme.color.error + '10' : theme.color.goldLight, padding: 16, borderRadius: 12, border: `1px solid ${conflict ? theme.color.error : theme.color.goldMid}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Info size={18} color={conflict ? theme.color.error : theme.color.goldDark} style={{ marginTop: 2 }} />
            <div>
              {conflict ? (
                <div style={{ color: theme.color.error, fontWeight: 700, fontSize: 14 }}>This time slot overlaps with an existing booking. Please select another time.</div>
              ) : (
                <>
                  <div style={{ color: theme.color.goldDark, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Time Slot Available</div>
                  <div style={{ color: theme.color.goldDark, fontSize: 13, opacity: 0.8 }}>
                    Your video will play for {durationMin} minute(s). Total: <strong>{naira(priceInfo.cost)}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        <div style={{ padding: "24px 32px", borderTop: `1px solid ${theme.color.border}`, background: theme.color.surface }}>
          <AnimatedButton 
            onClick={handleSave} 
            disabled={conflict || loading}
            style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: theme.color.charcoal900, color: theme.color.surface, fontWeight: 800, fontSize: 16, cursor: conflict || loading ? "not-allowed" : "pointer", opacity: conflict || loading ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
          >
            {loading ? 'Checking...' : conflict ? 'Slot Unavailable' : <><Check size={18} /> Save Changes</>}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
