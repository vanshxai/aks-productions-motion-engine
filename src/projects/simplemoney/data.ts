/**
 * Reel #01 data — COMPUTED, not invented.
 * ₹1,000 invested at the end of every month, 12% p.a. assumed (1% per month), until age 52.
 * Riya starts at 22 (360 months) → ₹34,94,964 · invested ₹3,60,000
 * Kabir starts at 32 (240 months) → ₹9,89,255  · invested ₹2,40,000
 */
export const SIP = 1000;
export const RATE_M = 0.01;

/** Value after n monthly contributions (fractional n interpolates within the month). */
export const fv = (n: number) => {
  if (n <= 0) return 0;
  const whole = Math.floor(n);
  const v = (SIP * (Math.pow(1 + RATE_M, whole) - 1)) / RATE_M;
  const next = v * (1 + RATE_M) + SIP;
  return v + (next - v) * (n - whole);
};

/** Riya / Kabir value at a (fractional) age. */
export const riyaAt = (age: number) => fv((age - 22) * 12);
export const kabirAt = (age: number) => fv((age - 32) * 12);

export const FINAL = { riya: fv(360), kabir: fv(240), riyaIn: 360000, kabirIn: 240000 };

/** ₹ short format: ₹12K, ₹2.3L, ₹34.9L */
export const short = (v: number) => {
  if (v < 1000) return `₹${Math.round(v)}`;
  if (v < 100000) return `₹${Math.round(v / 1000)}K`;
  return `₹${(v / 100000).toFixed(1)}L`;
};

/** Indian digit grouping: 3494964 → 34,94,964 */
export const inr = (v: number) => {
  const s = Math.round(v).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
};
