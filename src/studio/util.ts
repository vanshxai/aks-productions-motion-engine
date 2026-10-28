/** Kimu Studio helpers. Everything is a pure function of time `t` (seconds) so any frame renders on its own. */
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const backOut = (x: number) => { const c = 1.7; const u = x - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
export const smooth = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a)));
/** 0 before a, 1 after b, eased. */
export const ramp = (t: number, a: number, b: number, e = easeInOut) => e(clamp((t - a) / (b - a)));
/** Pulse that rises at a, holds, falls at b. */
export const window_ = (t: number, a: number, b: number, fade = 0.25) => clamp((t - a) / fade) * clamp((b - t) / fade);

/** Piecewise interpolation. kf = [[t, v], ...] sorted by t. */
export function kf(t: number, pts: [number, number][], e: (x: number) => number = easeInOut): number {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      return lerp(v0, v1, e((t - t0) / (t1 - t0)));
    }
  }
  return pts[pts.length - 1][1];
}

export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export type Env = [number, number][];
/** Mouth openness from a [time, open] envelope list: linear between points, 0 outside. */
export function envAt(env: Env, t: number): number {
  if (!env.length || t < env[0][0] - 0.05 || t > env[env.length - 1][0] + 0.05) return 0;
  let prev = env[0];
  for (const p of env) {
    if (p[0] >= t) {
      const span = p[0] - prev[0];
      if (span <= 0) return p[1];
      return lerp(prev[1], p[1], clamp((t - prev[0]) / span));
    }
    prev = p;
  }
  return 0;
}

/** Mouth openness from the real narration audio: 1 when a phrase is being spoken (beat level). */
export function inWindows(t: number, w: [number, number][]) {
  return w.some(([a, b]) => t >= a && t <= b);
}
