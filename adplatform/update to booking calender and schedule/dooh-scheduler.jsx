import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Info, X, Check, Ticket, AlertTriangle, Trash2, Repeat as RepeatIcon } from "lucide-react";

// ---------- Brand tokens (Studio Arella) ----------
const C = {
  gold: "#E8A020",
  darkGold: "#C47D0E",
  black: "#0A0A0A",
  cream: "#F7F4EF",
  hazard: "#8B4A42",
  hazardDark: "#6E3A34",
  pending: "#B8860B",
  muted: "rgba(10,10,10,0.55)",
  mutedOnDark: "rgba(247,244,239,0.6)",
  line: "rgba(10,10,10,0.10)",
  panel: "#FFFFFF",
};

// ---------- Business rules ----------
const RATE_PER_MINUTE = 1000;
const START_HOUR = 6;
const END_HOUR = 22;
const DAY_MIN = (END_HOUR - START_HOUR) * 60;
const PPM = 1.4; // pixels per minute on the timeline

function calcCost(totalSeconds) {
  if (totalSeconds <= 0) return { cost: 0, base: 0, extra: 0, extraSeconds: 0 };
  if (totalSeconds <= 60) return { cost: RATE_PER_MINUTE, base: RATE_PER_MINUTE, extra: 0, extraSeconds: 0 };
  const extraSeconds = totalSeconds - 60;
  const extra = Math.round(extraSeconds * (RATE_PER_MINUTE / 60) * 100) / 100;
  const cost = Math.round((RATE_PER_MINUTE + extra) * 100) / 100;
  return { cost, base: RATE_PER_MINUTE, extra, extraSeconds };
}

function naira(n) {
  return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}
function pad(n) { return String(n).padStart(2, "0"); }
function localDateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function addYears(d, n) { const r = new Date(d); r.setFullYear(r.getFullYear() + n); return r; }
function isSameDate(a, b) { return localDateKey(a) === localDateKey(b); }
function minutesToHHMM(min) { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`; }
function formatMin(min) {
  const h = Math.floor(min / 60), m = min % 60;
  const period = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m)} ${period}`;
}
function formatDurationSec(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m} min` : `${m}m ${s}s`;
}
// A creative must always be sold in whole "full-play" blocks so it is never cut off
// mid-video and never bleeds into whatever the next advertiser bought.
// Under 60s: video loops to fill a full minute (matches the ₦1,000 floor). Over 60s: one full play.
function getMBU(videoSeconds) {
  if (!videoSeconds || videoSeconds <= 0) return 60;
  if (videoSeconds >= 60) return videoSeconds;
  return Math.ceil(60 / videoSeconds) * videoSeconds;
}
// How many whole MBU blocks fit going forward from startMin before the next booking (or day end).
function maxLoopsForward(startMin, mbu, bookings) {
  const dayEnd = END_HOUR * 60;
  let boundary = dayEnd;
  for (const b of bookings) if (b.startMin >= startMin && b.startMin < boundary) boundary = b.startMin;
  return Math.floor(Math.max(0, (boundary - startMin) * 60) / mbu);
}
// How many whole MBU blocks fit going backward, ending exactly at endMin.
function maxLoopsBackward(endMin, mbu, bookings) {
  const dayStart = START_HOUR * 60;
  let boundary = dayStart;
  for (const b of bookings) { const be = b.startMin + b.durationMin; if (be <= endMin && be > boundary) boundary = be; }
  return Math.floor(Math.max(0, (endMin - boundary) * 60) / mbu);
}
function isStartInsideBooking(startMin, bookings) {
  return bookings.some((b) => startMin >= b.startMin && startMin < b.startMin + b.durationMin);
}

const VIDEO_PRESETS = [15, 30, 60, 90, 110];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function DoohScheduler() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [viewDate, setViewDate] = useState(today);
  const [calCursor, setCalCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [videoSeconds, setVideoSeconds] = useState(30);
  const [advertiserName, setAdvertiserName] = useState("");
  const [cart, setCart] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [draft, setDraft] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [paid, setPaid] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [repeatCount, setRepeatCount] = useState(4);
  const [repeatUnit, setRepeatUnit] = useState("weeks");
  const anchorRef = useRef(null);
  const timelineRef = useRef(null);

  const otherBookings = useMemo(() => {
    const mk = (offset, startMin, durationMin, label) => ({ dateKey: localDateKey(addDays(today, offset)), startMin, durationMin, label });
    return [
      mk(0, 9 * 60, 45, "GTBank Promo"),
      mk(0, 13 * 60, 60, "Chicken Republic"),
      mk(0, 16 * 60 + 20, 3, "Zenith QuickAd"),
      mk(1, 18 * 60, 30, "MTN Data Bundle"),
      mk(3, 20 * 60, 60, "FirstBank Prime Time"),
      mk(7, 8 * 60 + 30, 20, "Nkechi's Kitchen"),
      mk(30, 12 * 60, 90, "Zenith Bank Launch"),
    ];
  }, [today]);

  function bookingsForDate(dateKey) {
    const others = otherBookings.filter((b) => b.dateKey === dateKey).map((b) => ({ ...b, type: "other" }));
    const cartItems = cart.filter((c) => localDateKey(c.date) === dateKey)
      .map((c) => ({ startMin: c.startMin, durationMin: Math.max(1, Math.round(c.durationSec / 60)), label: advertiserName || "Your booking", type: "cart" }));
    const confirmedItems = confirmed.filter((c) => localDateKey(c.date) === dateKey)
      .map((c) => ({ startMin: c.startMin, durationMin: Math.max(1, Math.round(c.durationSec / 60)), label: c.label, type: "confirmed" }));
    return [...others, ...cartItems, ...confirmedItems];
  }

  function minuteFromClientY(clientY) {
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollTop = timelineRef.current.scrollTop;
    const y = clientY - rect.top + scrollTop;
    let min = START_HOUR * 60 + y / PPM;
    min = Math.round(min);
    return Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, min));
  }

  function handleTimelineDown(e) {
    if (e.target.closest("[data-pill]")) return;
    const point = e.touches ? e.touches[0] : e;
    const min = minuteFromClientY(point.clientY);
    const bookings = bookingsForDate(localDateKey(viewDate));
    if (isStartInsideBooking(min, bookings)) return;
    anchorRef.current = min;
    setDraft({ date: viewDate, startMin: min, loops: 1 });
    setDragging(true);
    setMessage("");
  }

  useEffect(() => {
    if (!dragging) return;
    function move(e) {
      const point = e.touches ? e.touches[0] : e;
      const cur = minuteFromClientY(point.clientY);
      const anchor = anchorRef.current;
      const bookings = bookingsForDate(localDateKey(viewDate));
      const mbu = getMBU(videoSeconds);
      const direction = cur >= anchor ? 1 : -1;
      const desiredLoops = Math.max(1, Math.round((Math.abs(cur - anchor) * 60) / mbu));
      let loops, startMin;
      if (direction > 0) {
        const maxL = maxLoopsForward(anchor, mbu, bookings);
        loops = Math.min(desiredLoops, maxL);
        startMin = anchor;
      } else {
        const maxL = maxLoopsBackward(anchor, mbu, bookings);
        loops = Math.min(desiredLoops, maxL);
        startMin = anchor - (loops * mbu) / 60;
      }
      setDraft({ date: viewDate, startMin, loops });
    }
    function up() { setDragging(false); }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const mbu = getMBU(videoSeconds);
  const playsPerBlock = Math.max(1, Math.round(mbu / (videoSeconds || mbu)));
  const draftBookings = draft ? bookingsForDate(localDateKey(draft.date)) : [];
  const draftInsideBooking = draft ? isStartInsideBooking(draft.startMin, draftBookings) : false;
  const draftMaxLoops = draft && !draftInsideBooking ? maxLoopsForward(draft.startMin, mbu, draftBookings) : 0;
  const draftDurationSec = draft ? draft.loops * mbu : 0;
  const draftPrice = calcCost(draftDurationSec);

  function handleAddToCart() {
    if (!draft || draft.loops < 1) { setMessage("There isn't enough open room here to fit even one full play of your video."); return; }
    if (draftInsideBooking || draft.loops > draftMaxLoops) {
      setMessage("That overlaps a booking already on this day — adjust the time.");
      return;
    }
    setCart((prev) => [...prev, { id: Date.now() + Math.random(), date: draft.date, startMin: draft.startMin, durationSec: draftDurationSec, videoSeconds, mbu, loops: draft.loops, priceInfo: calcCost(draftDurationSec) }]);
    setDraft(null);
    setMessage("");
  }

  function handleRepeatAdd() {
    if (!draft || draft.loops < 1) { setMessage("There isn't enough open room here to fit even one full play of your video."); return; }
    const stepDate = (i) => {
      if (repeatUnit === "days") return addDays(draft.date, i);
      if (repeatUnit === "weeks") return addDays(draft.date, i * 7);
      if (repeatUnit === "months") return addMonths(draft.date, i);
      return addYears(draft.date, i);
    };
    let added = 0, skipped = 0;
    const newItems = [];
    for (let i = 0; i < repeatCount; i++) {
      const d = stepDate(i);
      const dateKey = localDateKey(d);
      const existing = [
        ...otherBookings.filter((b) => b.dateKey === dateKey),
        ...cart.filter((c) => localDateKey(c.date) === dateKey).map((c) => ({ startMin: c.startMin, durationMin: Math.round(c.durationSec / 60) })),
        ...newItems.filter((n) => localDateKey(n.date) === dateKey).map((n) => ({ startMin: n.startMin, durationMin: Math.round(n.durationSec / 60) })),
      ];
      const requiredEnd = draft.startMin + draftDurationSec / 60;
      const conflict = isStartInsideBooking(draft.startMin, existing) || existing.some((b) => draft.startMin < b.startMin + (b.durationMin || 0) && requiredEnd > b.startMin);
      if (conflict) { skipped++; continue; }
      newItems.push({ id: Date.now() + Math.random() + i, date: d, startMin: draft.startMin, durationSec: draftDurationSec, videoSeconds, mbu, loops: draft.loops, priceInfo: calcCost(draftDurationSec) });
      added++;
    }
    setCart((prev) => [...prev, ...newItems]);
    setDraft(null);
    setMessage(skipped > 0 ? `Added ${added} booking${added === 1 ? "" : "s"} to cart. Skipped ${skipped} — they clashed with an existing booking.` : `Added ${added} booking${added === 1 ? "" : "s"} to cart.`);
  }

  function removeFromCart(id) { setCart((prev) => prev.filter((c) => c.id !== id)); }

  const cartTotal = cart.reduce((s, c) => s + c.priceInfo.cost, 0);

  function handlePaySuccess() {
    const items = cart.map((c) => ({ ...c, label: advertiserName || "Your booking" }));
    setConfirmed((prev) => [...prev, ...items]);
    setCart([]);
    setPaid(true);
  }
  function closeCheckout() { setShowCheckout(false); setPaid(false); }

  // ---- month calendar cells ----
  const monthCells = useMemo(() => {
    const year = calCursor.getFullYear(), month = calCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calCursor]);

  function dayIndicator(d) {
    if (!d) return { other: 0, mine: 0 };
    const key = localDateKey(d);
    const other = otherBookings.filter((b) => b.dateKey === key).length;
    const mine = cart.filter((c) => localDateKey(c.date) === key).length + confirmed.filter((c) => localDateKey(c.date) === key).length;
    return { other, mine };
  }

  const hours = [];
  for (let h = START_HOUR; h < END_HOUR; h++) hours.push(h);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const showNowLine = isSameDate(viewDate, today) && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;

  return (
    <div className="qs" style={{ background: C.cream, minHeight: "100%", color: C.black }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .qs { font-family: 'Quicksand', sans-serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .timeline-bg { touch-action: none; }
        .day-cell { transition: all 120ms ease; }
        .day-cell:hover:not(.empty) { background: rgba(232,160,32,0.10); }
        input[type="number"]::-webkit-inner-spin-button { opacity: 1; }
        .pill { box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .hazard-stripe { background-image: repeating-linear-gradient(135deg, ${C.hazard}, ${C.hazard} 5px, ${C.hazardDark} 5px, ${C.hazardDark} 10px); }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(184,134,11,0.5); } 50% { box-shadow: 0 0 0 5px rgba(184,134,11,0); } }
        .pending-pulse { animation: pulseGlow 1.8s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(10,10,10,0.15); border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ background: C.black, padding: "18px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ color: C.gold, fontWeight: 700, fontSize: 20 }}>Studio Arella</div>
            <div className="mono" style={{ color: C.mutedOnDark, fontSize: 12, marginTop: 2 }}>Bems Junction LED Screen — Umuahia</div>
          </div>
          <div className="mono" style={{ color: C.mutedOnDark, fontSize: 12, textAlign: "right" }}>
            Rate: {naira(RATE_PER_MINUTE)} / minute · book by the minute, any day
          </div>
        </div>
      </div>

      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="lg:col-span-1">
          {/* Video card */}
          <div style={{ background: C.panel, borderRadius: 14, padding: 16, border: `1px solid ${C.line}` }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={16} color={C.darkGold} /> Your creative
            </div>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Video length (seconds)</label>
            <input type="number" min={1} value={videoSeconds}
              onChange={(e) => setVideoSeconds(Math.max(0, Number(e.target.value)))}
              className="mono" style={inputStyle} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0 12px" }}>
              {VIDEO_PRESETS.map((v) => (
                <button key={v} onClick={() => setVideoSeconds(v)} className="mono"
                  style={{ fontSize: 11, padding: "5px 9px", borderRadius: 6, border: `1px solid ${videoSeconds === v ? C.gold : C.line}`, background: videoSeconds === v ? "rgba(232,160,32,0.12)" : "transparent", cursor: "pointer" }}>
                  {v}s
                </button>
              ))}
            </div>
            <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Business / brand name</label>
            <input type="text" placeholder="e.g. BemsFarms Fresh Produce" value={advertiserName}
              onChange={(e) => setAdvertiserName(e.target.value)} style={inputStyle} />
          </div>

          {/* Month calendar */}
          <div style={{ background: C.panel, borderRadius: 14, padding: 16, border: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <button onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1))} style={iconBtnStyle}><ChevronLeft size={16} /></button>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
              <button onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1))} style={iconBtnStyle}><ChevronRight size={16} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
              {WEEKDAYS.map((w) => <div key={w} className="mono" style={{ fontSize: 10, textAlign: "center", color: C.muted }}>{w}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {monthCells.map((d, i) => {
                if (!d) return <div key={i} />;
                const ind = dayIndicator(d);
                const isViewing = isSameDate(d, viewDate);
                const isToday = isSameDate(d, today);
                return (
                  <button key={i} onClick={() => setViewDate(d)} className="day-cell"
                    style={{
                      aspectRatio: "1", borderRadius: 8, border: isToday && !isViewing ? `1px solid ${C.gold}` : "1px solid transparent",
                      background: isViewing ? C.gold : "transparent", color: isViewing ? C.black : C.black,
                      fontSize: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    }}>
                    <span className="mono">{d.getDate()}</span>
                    <span style={{ display: "flex", gap: 2 }}>
                      {ind.other > 0 && <Dot color={isViewing ? C.black : C.hazard} />}
                      {ind.mine > 0 && <Dot color={isViewing ? C.black : C.darkGold} />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 10, color: C.muted }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Dot color={C.hazard} /> other bookings</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Dot color={C.darkGold} /> your bookings</span>
            </div>
          </div>

          {/* Cart */}
          <div style={{ background: C.black, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: C.cream, fontWeight: 600, fontSize: 13 }}>Booking cart</span>
              <span className="mono" style={{ color: C.mutedOnDark, fontSize: 11 }}>{cart.length} slot{cart.length === 1 ? "" : "s"}</span>
            </div>
            {cart.length === 0 ? (
              <div className="mono" style={{ color: C.mutedOnDark, fontSize: 12 }}>
                No slots added yet. Drag on the timeline to create one.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                {[...cart].sort((a, b) => a.date - b.date || a.startMin - b.startMin).map((c) => (
                  <div key={c.id} style={{ background: "rgba(247,244,239,0.06)", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div className="mono" style={{ fontSize: 11, color: C.mutedOnDark }}>
                      <div style={{ color: C.cream }}>{c.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      <div>{formatMin(c.startMin)} · {formatDurationSec(c.durationSec)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="mono" style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>{naira(c.priceInfo.cost)}</span>
                      <button onClick={() => removeFromCart(c.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <Trash2 size={13} color={C.mutedOnDark} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <>
                <div style={{ height: 1, background: "rgba(247,244,239,0.15)", margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: C.cream, fontWeight: 600, fontSize: 13 }}>Total</span>
                  <span className="mono" style={{ color: C.gold, fontWeight: 700, fontSize: 16 }}>{naira(cartTotal)}</span>
                </div>
                <button onClick={() => { setCheckoutItems(cart); setCheckoutTotal(cartTotal); setShowCheckout(true); }} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: C.gold, color: C.black, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Checkout
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: TIMELINE */}
        <div className="lg:col-span-2" style={{ background: C.panel, borderRadius: 14, border: `1px solid ${C.line}`, padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => setViewDate(addDays(viewDate, -1))} style={iconBtnStyle}><ChevronLeft size={16} /></button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {viewDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              {isSameDate(viewDate, today) && <div className="mono" style={{ fontSize: 10, color: C.darkGold }}>TODAY</div>}
            </div>
            <button onClick={() => setViewDate(addDays(viewDate, 1))} style={iconBtnStyle}><ChevronRight size={16} /></button>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12, fontSize: 11, color: C.muted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span className="hazard-stripe" style={{ width: 12, height: 12, borderRadius: 3, display: "inline-block" }} /> Booked by another advertiser</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: C.pending, display: "inline-block" }} /> In your cart (unpaid)</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: C.gold, display: "inline-block" }} /> Your confirmed booking</span>
          </div>

          {/* Draft editor */}
          {draft && isSameDate(draft.date, viewDate) && (
            <div style={{ background: "#FBF6EC", border: `1px solid ${C.gold}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>New booking</div>
                <button onClick={() => setDraft(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={15} /></button>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, alignItems: "flex-end" }}>
                <div>
                  <label style={miniLabel}>Start time</label>
                  <input type="time" value={minutesToHHMM(draft.startMin)}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      const startMin = h * 60 + m;
                      const bookings = bookingsForDate(localDateKey(draft.date));
                      const inside = isStartInsideBooking(startMin, bookings);
                      const maxL = inside ? 0 : maxLoopsForward(startMin, mbu, bookings);
                      const loops = maxL < 1 ? 0 : Math.min(Math.max(1, draft.loops), maxL);
                      setDraft((d) => ({ ...d, startMin, loops }));
                    }}
                    className="mono" style={{ ...inputStyle, width: 110 }} />
                </div>
                <div>
                  <label style={miniLabel}>Full plays (loops)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => setDraft((d) => ({ ...d, loops: Math.max(1, d.loops - 1) }))} style={stepBtnStyle}>−</button>
                    <span className="mono" style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>{draft.loops}</span>
                    <button
                      onClick={() => setDraft((d) => ({ ...d, loops: Math.min(draftMaxLoops, d.loops + 1) }))}
                      disabled={draft.loops >= draftMaxLoops}
                      style={{ ...stepBtnStyle, opacity: draft.loops >= draftMaxLoops ? 0.4 : 1, cursor: draft.loops >= draftMaxLoops ? "not-allowed" : "pointer" }}>
                      +
                    </button>
                  </div>
                </div>
              </div>

              {draftInsideBooking || draftMaxLoops < 1 ? (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#B23B3B" }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    {draftInsideBooking ? "That start time is already booked." : `Not enough open room here for even one full play (needs ${formatDurationSec(mbu)}). Try a different start time.`}
                  </span>
                </div>
              ) : (
                <>
                  <div className="mono" style={{ fontSize: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                    <span style={{ color: C.muted }}>
                      {formatMin(draft.startMin)} – {formatMin(draft.startMin + draftDurationSec / 60)} · {formatDurationSec(draftDurationSec)} airtime
                    </span>
                    <span style={{ color: C.darkGold, fontWeight: 600, fontSize: 14 }}>{naira(draftPrice.cost)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
                    Your {videoSeconds}s video {playsPerBlock > 1 ? `loops ${playsPerBlock}× to fill each ${formatDurationSec(mbu)} block` : `plays once per ${formatDurationSec(mbu)} block`} — {draft.loops} block{draft.loops === 1 ? "" : "s"} = {draft.loops * playsPerBlock} total play{draft.loops * playsPerBlock === 1 ? "" : "s"}, always finishing cleanly. It will never be cut off mid-play or run into the next advertiser's slot.
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button onClick={handleAddToCart} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: C.black, color: C.cream, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Add to cart
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
                      <RepeatIcon size={13} />
                      <input type="number" min={1} max={365} value={repeatCount} onChange={(e) => setRepeatCount(Math.max(1, Number(e.target.value)))} className="mono" style={{ ...inputStyle, width: 52, padding: "5px 6px" }} />
                      <select value={repeatUnit} onChange={(e) => setRepeatUnit(e.target.value)} style={{ ...inputStyle, padding: "5px 6px", width: "auto" }}>
                        <option value="days">day(s) apart</option>
                        <option value="weeks">week(s) apart</option>
                        <option value="months">month(s) apart</option>
                        <option value="years">year(s) apart</option>
                      </select>
                      <button onClick={handleRepeatAdd} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.line}`, background: "transparent", fontSize: 12, cursor: "pointer" }}>
                        Add {repeatCount}×
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {message && (
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 10, fontSize: 12, color: "#8a5a00" }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{message}</span>
            </div>
          )}

          {!draft && (
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 10, fontSize: 12, color: C.muted }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Click and drag on the timeline to pick a start time. Bookings are always sold in whole "full-play" blocks of your video, so it's never cut off mid-way and never eats into the next advertiser's slot.</span>
            </div>
          )}

          {/* Timeline */}
          <div ref={timelineRef} onPointerDown={handleTimelineDown}
            className="timeline-bg" style={{ position: "relative", height: 520, overflowY: "auto", border: `1px solid ${C.line}`, borderRadius: 10, cursor: "crosshair" }}>
            <div style={{ position: "relative", height: DAY_MIN * PPM }}>
              {hours.map((h) => (
                <div key={h} style={{ position: "absolute", top: (h - START_HOUR) * 60 * PPM, left: 0, right: 0, borderTop: `1px solid ${C.line}` }}>
                  <span className="mono" style={{ position: "absolute", left: 6, top: 2, fontSize: 10, color: C.muted, background: C.panel, paddingRight: 4 }}>
                    {formatMin(h * 60)}
                  </span>
                </div>
              ))}
              {showNowLine && (
                <div style={{ position: "absolute", top: (nowMin - START_HOUR * 60) * PPM, left: 0, right: 0, borderTop: "1.5px solid #D64545", zIndex: 3 }}>
                  <span style={{ position: "absolute", left: -4, top: -4, width: 8, height: 8, borderRadius: "50%", background: "#D64545" }} />
                </div>
              )}

              {bookingsForDate(localDateKey(viewDate)).map((b, i) => {
                const top = (b.startMin - START_HOUR * 60) * PPM;
                const height = Math.max(b.durationMin * PPM, 16);
                const isOther = b.type === "other";
                const isCart = b.type === "cart";
                const bg = isOther ? undefined : isCart ? C.pending : C.gold;
                return (
                  <div key={i} data-pill
                    title={`${b.label} · ${formatMin(b.startMin)}–${formatMin(b.startMin + b.durationMin)}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`pill ${isOther ? "hazard-stripe" : ""} ${isCart ? "pending-pulse" : ""}`}
                    style={{
                      position: "absolute", top, height, left: 62, right: 8, borderRadius: 6, background: bg,
                      padding: "2px 8px", overflow: "hidden", zIndex: 2, display: "flex", alignItems: "center",
                    }}>
                    <span className="mono" style={{ fontSize: 10, color: isOther ? "#fff" : C.black, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {b.label} · {formatMin(b.startMin)}
                    </span>
                  </div>
                );
              })}

              {draft && isSameDate(draft.date, viewDate) && draft.loops > 0 && (
                <div style={{
                  position: "absolute", top: (draft.startMin - START_HOUR * 60) * PPM, height: Math.max((draftDurationSec / 60) * PPM, 16),
                  left: 62, right: 8, borderRadius: 6, border: `2px dashed ${C.gold}`, background: "rgba(232,160,32,0.15)", zIndex: 4,
                }} />
              )}
            </div>
          </div>

          {/* Text list of the day's bookings — reliable even when a pill is too short to read */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              Booked on {viewDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
            {(() => {
              const list = bookingsForDate(localDateKey(viewDate)).slice().sort((a, b) => a.startMin - b.startMin);
              if (list.length === 0) {
                return <div className="mono" style={{ fontSize: 12, color: C.muted }}>Nothing booked yet — the whole day is open.</div>;
              }
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {list.map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: "#F2EFE8", fontSize: 12 }}>
                      <span className="mono" style={{ color: C.muted, width: 150, flexShrink: 0 }}>
                        {formatMin(b.startMin)} – {formatMin(b.startMin + b.durationMin)}
                      </span>
                      <span style={{ flex: 1, fontWeight: 500 }}>{b.label}</span>
                      <span className="mono" style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 999, color: b.type === "other" ? "#fff" : C.black,
                        background: b.type === "other" ? C.hazard : b.type === "cart" ? C.pending : C.gold,
                      }}>
                        {b.type === "other" ? "Booked" : b.type === "cart" ? "Cart" : "Confirmed"}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ background: C.cream, borderRadius: 16, maxWidth: 460, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ background: C.black, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.gold, fontWeight: 700 }}><Ticket size={18} /> Invoice</div>
              <button onClick={closeCheckout} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={C.mutedOnDark} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{advertiserName || "Your booking"}</div>
              <div className="mono" style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{checkoutItems.length} time slot(s) · Bems Junction LED Screen</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {checkoutItems.map((c) => (
                  <div key={c.id} style={{ background: "#fff", borderRadius: 10, padding: 12, fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, marginBottom: 4 }}>
                      <span>{c.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span className="mono">{naira(c.priceInfo.cost)}</span>
                    </div>
                    <div className="mono" style={{ color: C.muted, fontSize: 11 }}>
                      {formatMin(c.startMin)} – {formatMin(c.startMin + Math.round(c.durationSec / 60))} ({formatDurationSec(c.durationSec)} airtime)
                    </div>
                    <div className="mono" style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>
                      Base {naira(c.priceInfo.base)}{c.priceInfo.extra > 0 ? ` + ${c.priceInfo.extraSeconds}s extra @ ${naira(RATE_PER_MINUTE / 60)}/s = ${naira(c.priceInfo.extra)}` : " (flat minimum — under 1 min)"}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                      {c.loops} full-play block{c.loops === 1 ? "" : "s"} of your {c.videoSeconds}s video — plays to completion every time, never cut off, never overlaps the next booking.
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.black, borderRadius: 10, padding: "12px 16px" }}>
                <span style={{ color: C.cream, fontWeight: 600, fontSize: 13 }}>Total to pay</span>
                <span className="mono" style={{ color: C.gold, fontWeight: 700, fontSize: 20 }}>{naira(checkoutTotal)}</span>
              </div>

              <div style={{ marginTop: 14 }}>
                {!paid ? (
                  <button onClick={handlePaySuccess} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: C.gold, color: C.black, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Simulate payment (Paystack)
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#2E7D32", fontSize: 13, fontWeight: 600 }}>
                    <Check size={16} /> Payment confirmed — all slots locked in
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13, boxSizing: "border-box" };
const iconBtnStyle = { background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: 4, cursor: "pointer", display: "flex" };
const miniLabel = { fontSize: 10, color: C.muted, display: "block", marginBottom: 4 };
const stepBtnStyle = { width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.line}`, background: "#fff", fontSize: 15, lineHeight: 1, cursor: "pointer" };

function Dot({ color }) {
  return <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, display: "inline-block" }} />;
}
