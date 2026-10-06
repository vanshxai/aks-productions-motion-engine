/**
 * Reel #01 data — COMPUTED, not invented.
 * $200 invested at the end of every month, 10% a year assumed (10/12 % per month), until age 52.
 * Emma starts at 22 (360 months) → $452,098 · invested $72,000
 * Jake starts at 32 (240 months) → $151,874 · invested $48,000
 * Emma puts in $24,000 more and ends with $300,224 more (≈3×).
 */
export const SIP = 200;
export const RATE_M = 0.1 / 12;

/** Value after n monthly contributions (fractional n interpolates within the month). */
export const fv = (n: number) => {
  if (n <= 0) return 0;
  const whole = Math.floor(n);
  const v = (SIP * (Math.pow(1 + RATE_M, whole) - 1)) / RATE_M;
  const next = v * (1 + RATE_M) + SIP;
  return v + (next - v) * (n - whole);
};

/** Emma / Jake value at a (fractional) age. */
export const emmaAt = (age: number) => fv((age - 22) * 12);
export const jakeAt = (age: number) => fv((age - 32) * 12);

export const FINAL = { emma: fv(360), jake: fv(240), emmaIn: 72000, jakeIn: 48000 };

/** $ short format: $850, $4.6K, $41K, $452K, $1.2M */
export const short = (v: number) => {
  if (v < 1000) return `$${Math.round(v)}`;
  if (v < 10000) return `$${(v / 1000).toFixed(1)}K`;
  if (v < 1e6) return `$${Math.round(v / 1000)}K`;
  return `$${(v / 1e6).toFixed(1)}M`;
};
