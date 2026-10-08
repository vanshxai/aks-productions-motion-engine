/**
 * Deterministic physics for "How It Works #15".  Everything the picture shows is INTEGRATED here, never hand-drawn:
 *  - the cannonballs are stepped with RK4 under real inverse-square gravity toward the planet centre,
 *  - the "fast enough" ball is launched at exactly the circular-orbit speed  v = sqrt(GM / r)  and the integration proves it closes a circle,
 *  - the lap time of the drawing is the real lap time  T = 2π r / v  (LAP frames per lap).
 * Units: screen pixels (x right, y DOWN), planet centre at (0,0), time in frames.  NOT to scale (the drawing's Earth is fat and its orbit is high).
 * Real numbers (computed in the delivery notes): GM = 3.986004418e14 m³/s², R = 6371 km, ISS height ≈ 400 km → v ≈ 7.67 km/s ≈ 27 600 km/h, T ≈ 92 min.
 */
export const R = 240;            // planet radius (px)
export const R0 = 304;           // launch / orbit radius (px): the cannon's muzzle sits on a tower above the ground
export const LAP = 90;           // frames for one lap of the circular orbit in the picture
export const VC = (2 * Math.PI * R0) / LAP;     // circular speed in px/frame (v = 2πr/T)
export const GM = VC * VC * R0;                 // from v² = GM / r
export type P = { x: number; y: number };

const acc = (x: number, y: number): [number, number] => {
  const r2 = x * x + y * y, r3 = r2 * Math.sqrt(r2);
  return [(-GM * x) / r3, (-GM * y) / r3];
};
const rk4 = (s: number[], h: number): number[] => {
  const f = (a: number[]) => { const [ax, ay] = acc(a[0], a[1]); return [a[2], a[3], ax, ay]; };
  const add = (a: number[], b: number[], k: number) => a.map((v, i) => v + b[i] * k);
  const k1 = f(s), k2 = f(add(s, k1, h / 2)), k3 = f(add(s, k2, h / 2)), k4 = f(add(s, k3, h));
  return s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
};

export type Shot = { v: number; pts: P[]; land: number | null; landPt: P | null; end: number };
/** Fire sideways from the top of the tower at `frac` × circular speed.  pts[i] = position after i frames (4 RK4 sub-steps each). */
export const fire = (frac: number, maxFrames: number): Shot => {
  let s = [0, -R0, VC * frac, 0];
  const pts: P[] = [{ x: s[0], y: s[1] }];
  let land: number | null = null, landPt: P | null = null;
  for (let i = 1; i <= maxFrames; i++) {
    let prev = s;
    for (let k = 0; k < 4; k++) { prev = s; s = rk4(s, 0.25); if (Math.hypot(s[0], s[1]) <= R) {
      // linear interpolation to the exact surface crossing
      const r0_ = Math.hypot(prev[0], prev[1]), r1_ = Math.hypot(s[0], s[1]), t = (r0_ - R) / (r0_ - r1_);
      landPt = { x: prev[0] + (s[0] - prev[0]) * t, y: prev[1] + (s[1] - prev[1]) * t };
      land = i - 1 + (k + t) / 4; break;
    } }
    if (land !== null) { pts.push(landPt!); return { v: frac, pts, land, landPt, end: i }; }
    pts.push({ x: s[0], y: s[1] });
  }
  return { v: frac, pts, land, landPt, end: maxFrames };
};
/** position at (fractional) frame u after firing; clamps at landing */
export const at = (sh: Shot, u: number): P => {
  const uu = Math.max(0, Math.min(sh.pts.length - 1, u)); const i = Math.floor(uu), t = uu - i;
  const a = sh.pts[i], b = sh.pts[Math.min(i + 1, sh.pts.length - 1)];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};
/** polyline path up to frame u */
export const trail = (sh: Shot, u: number, map: (p: P) => [number, number]) => {
  const uu = Math.max(0, Math.min(sh.pts.length - 1, u)); const n = Math.floor(uu);
  let d = ""; for (let i = 0; i <= n; i++) { const [x, y] = map(sh.pts[i]); d += (i ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1); }
  if (uu > n) { const [x, y] = map(at(sh, uu)); d += " L " + x.toFixed(1) + " " + y.toFixed(1); }
  return d;
};

/** the three throws of the picture */
export const SLOW = fire(0.6, 400), MID = fire(0.9, 400), FAST = fire(1.0, LAP * 3);
/** closing error of the circular orbit after one lap (px) — should be ≈ 0 */
export const ORBIT_ERR = Math.hypot(at(FAST, LAP).x - FAST.pts[0].x, at(FAST, LAP).y - FAST.pts[0].y);
export const RADIUS_DRIFT = Math.max(...FAST.pts.map((p) => Math.abs(Math.hypot(p.x, p.y) - R0)));
/** landing angle (degrees round the planet from the top) */
export const landDeg = (sh: Shot) => (sh.landPt ? (Math.atan2(sh.landPt.x, -sh.landPt.y) * 180) / Math.PI : NaN);

/* ───── the rocket's simplified climb-then-turn path (a drawing, tagged SIMPLIFIED): up from the pad, tips over, joins the orbit circle tangentially ───── */
export const TURN_PHI = (62 * Math.PI) / 180;      // how far round the planet the climb takes it
/** t in 0..1 → position + heading (radians, screen angle of the velocity) */
export const climb = (t: number): P & { h: number; r: number; phi: number } => {
  const tt = Math.max(0, Math.min(1, t));
  const phi = TURN_PHI * Math.pow(tt, 2.4);
  const r = R + (R0 - R) * (1 - Math.pow(1 - tt, 2.6));
  const pos = (q: number, rr: number): P => ({ x: rr * Math.sin(q), y: -rr * Math.cos(q) });
  const p = pos(phi, r);
  const e = 0.002, a = pos(TURN_PHI * Math.pow(Math.max(0, tt - e), 2.4), R + (R0 - R) * (1 - Math.pow(1 - Math.max(0, tt - e), 2.6)));
  const b = pos(TURN_PHI * Math.pow(Math.min(1, tt + e), 2.4), R + (R0 - R) * (1 - Math.pow(1 - Math.min(1, tt + e), 2.6)));
  return { ...p, h: Math.atan2(b.y - a.y, b.x - a.x), r, phi };
};
