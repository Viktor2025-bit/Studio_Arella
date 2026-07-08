export const START_HOUR = 7;
export const END_HOUR = 20; // 8 PM
export const DAY_MIN = (END_HOUR - START_HOUR) * 60;
export const PPM = 1000;

export function calcCost(totalSeconds: number, rate: number) {
  if (totalSeconds <= 0) return { cost: 0, base: 0, extra: 0, extraSeconds: 0 };
  const totalMinutes = Math.ceil(totalSeconds / 60);
  const cost = totalMinutes * rate;
  const extra = totalMinutes > 1 ? cost - rate : 0;
  const extraSeconds = totalSeconds > 60 ? totalSeconds - 60 : 0;
  return { cost, base: rate, extra, extraSeconds };
}

export function naira(n: number) { 
  return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`; 
}

export function pad(n: number) { 
  return String(n).padStart(2, "0"); 
}

export function localDateKey(d: Date) { 
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; 
}

export function addDays(d: Date, n: number) { 
  const r = new Date(d); 
  r.setDate(r.getDate() + n); 
  return r; 
}

export function addMonths(d: Date, n: number) { 
  const r = new Date(d); 
  r.setMonth(r.getMonth() + n); 
  return r; 
}

export function addYears(d: Date, n: number) { 
  const r = new Date(d); 
  r.setFullYear(r.getFullYear() + n); 
  return r; 
}

export function isSameDate(a: Date, b: Date) { 
  return localDateKey(a) === localDateKey(b); 
}

export function formatMin(min: number) {
  const totalSeconds = Math.round(min * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const period = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  if (s > 0) return `${hh}:${pad(m)}:${pad(s)} ${period}`;
  return `${hh}:${pad(m)} ${period}`;
}

export function formatDurationSec(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m} min` : `${m}m ${s}s`;
}

export function isStartInsideBooking(startMin: number, bookings: any[]) {
  return bookings.some((b) => startMin >= b.startMin && startMin < b.startMin + (b.durationMin || 0));
}
