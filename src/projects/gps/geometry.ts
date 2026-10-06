/**
 * GPS geometry for "How It Works #10". Top-down 2D slice, screen pixels (x right, y down).
 * Scale: 1 px = 70 km, so the satellites sit 20 300 – 24 150 km from the phone (the real range of GPS slant distances is about
 * 20 200 – 25 800 km). Everything animated in scenes.tsx is derived from here:
 *   - the radius of each circle is the true satellite-to-phone distance  (= delay × c),
 *   - the intersections are computed (circleCircle), never hand-placed,
 *   - the clock-error step uses pseudoranges (true range + the same bias on every circle) and a real least-squares solver
 *     (solveWithClock) that recovers BOTH the position and the bias from the satellites' circles alone.
 * The bias in the drawing is exaggerated (a real 1 µs error is only 0.3 km = 0.004 px at this scale).
 */
export type V = { x: number; y: number };

export const C_KM_S = 299792.458; // speed of light, km/s (exact by definition of the metre)
export const KM_PER_PX = 70;
export const PHONE: V = { x: 540, y: 1010 };
export const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 }; // the drawing window (circles are clipped to it)

const rad = (d: number) => (d * Math.PI) / 180;
export const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y);

/** satellite placement: bearing from the phone (degrees, screen angle) and slant distance in km */
const SAT_DEF = [
  { deg: 205, km: 21000 },
  { deg: 335, km: 24150 },
  { deg: 90, km: 22750 },
  { deg: 30, km: 20300 },
];
export const SATS: V[] = SAT_DEF.map((s) => ({
  x: PHONE.x + (Math.cos(rad(s.deg)) * s.km) / KM_PER_PX,
  y: PHONE.y + (Math.sin(rad(s.deg)) * s.km) / KM_PER_PX,
}));

/** true distances */
export const RANGE_PX = SATS.map((s) => dist(s, PHONE));
export const RANGE_KM = RANGE_PX.map((r) => r * KM_PER_PX);
/** signal delay = distance / c, in milliseconds */
export const DELAY_MS = RANGE_KM.map((k) => (k / C_KM_S) * 1000);

/** a 1 µs clock error, in metres: c × 1e-6 s */
export const ONE_US_M = C_KM_S * 1e-6 * 1000; // 299.79 m

/** exaggerated clock bias (px) used in the "catch" scene — shown on screen as EXAGGERATED */
export const BIAS_PX = 54;
export const PSEUDO_PX = RANGE_PX.map((r) => r + BIAS_PX);

/* ───────────────────────── solvers ───────────────────────── */

/** two circles → their two intersection points (null if they do not meet) */
export const circleCircle = (c0: V, r0: number, c1: V, r1: number): [V, V] | null => {
  const d = dist(c0, c1);
  if (d > r0 + r1 || d < Math.abs(r0 - r1) || d === 0) return null;
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
  const mx = c0.x + (a * (c1.x - c0.x)) / d, my = c0.y + (a * (c1.y - c0.y)) / d;
  const ox = (h * (c1.y - c0.y)) / d, oy = (h * (c1.x - c0.x)) / d;
  return [{ x: mx + ox, y: my - oy }, { x: mx - ox, y: my + oy }];
};

/** exact trilateration from three circles: subtracting the circle equations leaves two linear equations in (x, y). */
export const trilaterate = (s: V[], r: number[]): V => {
  const A = [0, 1].map((k) => [2 * (s[k + 1].x - s[0].x), 2 * (s[k + 1].y - s[0].y)]);
  const b = [0, 1].map((k) => r[0] ** 2 - r[k + 1] ** 2 + s[k + 1].x ** 2 + s[k + 1].y ** 2 - s[0].x ** 2 - s[0].y ** 2);
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return { x: (b[0] * A[1][1] - b[1] * A[0][1]) / det, y: (A[0][0] * b[1] - A[1][0] * b[0]) / det };
};

/**
 * Gauss–Newton least squares for position AND clock bias: pseudorange_i = |p − s_i| + b.
 * Needs one more satellite than a clock-free fix has unknowns (in real 3-D GPS: x, y, z and time = 4 unknowns = 4 satellites).
 */
export const solveWithClock = (s: V[], rho: number[]): { p: V; b: number; iters: number; resid: number } => {
  let p = { x: s.reduce((a, q) => a + q.x, 0) / s.length, y: s.reduce((a, q) => a + q.y, 0) / s.length };
  let b = 0, iters = 0, resid = 0;
  for (; iters < 50; iters++) {
    // normal equations JᵀJ δ = Jᵀ e, unknowns (x, y, b)
    const JTJ = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], JTe = [0, 0, 0];
    resid = 0;
    s.forEach((q, i) => {
      const d = dist(p, q);
      const e = rho[i] - (d + b);
      const J = [(p.x - q.x) / d, (p.y - q.y) / d, 1];
      for (let r = 0; r < 3; r++) { JTe[r] += J[r] * e; for (let c = 0; c < 3; c++) JTJ[r][c] += J[r] * J[c]; }
      resid += e * e;
    });
    const dlt = solve3(JTJ, JTe);
    p = { x: p.x + dlt[0], y: p.y + dlt[1] }; b += dlt[2];
    if (Math.hypot(dlt[0], dlt[1], dlt[2]) < 1e-10) break;
  }
  return { p, b, iters, resid: Math.sqrt(resid) };
};
const solve3 = (A: number[][], y: number[]) => {
  const M = A.map((row, i) => [...row, y[i]]);
  for (let i = 0; i < 3; i++) {
    let piv = i;
    for (let r = i + 1; r < 3; r++) if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
    [M[i], M[piv]] = [M[piv], M[i]];
    for (let r = i + 1; r < 3; r++) { const k = M[r][i] / M[i][i]; for (let c = i; c < 4; c++) M[r][c] -= k * M[i][c]; }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) { let v = M[i][3]; for (let c = i + 1; c < 3; c++) v -= M[i][c] * x[c]; x[i] = v / M[i][i]; }
  return x;
};

/* ───────────────────────── precomputed facts (module constants) ───────────────────────── */

/** two circles (sats 1, 2) meet at the phone and at a mirror-image ghost point */
const two = circleCircle(SATS[0], RANGE_PX[0], SATS[1], RANGE_PX[1])!;
export const TWO_PTS: [V, V] = dist(two[0], PHONE) < dist(two[1], PHONE) ? [two[0], two[1]] : [two[1], two[0]];
export const GHOST = TWO_PTS[1];
/** how far the third circle misses the ghost point (px) — it is the reason a third satellite picks one point */
export const GHOST_MISS_PX = Math.abs(dist(SATS[2], GHOST) - RANGE_PX[2]);

/** three clean circles → the phone */
export const FIX3 = trilaterate(SATS.slice(0, 3), RANGE_PX.slice(0, 3));
/** four circles with a shared clock bias → phone AND bias recovered from the circles alone */
export const FIX4 = solveWithClock(SATS, PSEUDO_PX);
export const SOLVED_BIAS_PX = FIX4.b;
/** a clock-error step of 1 µs would be this many px at this scale (for the record) */
export const ONE_US_PX = (ONE_US_M / 1000) / KM_PER_PX;

/** For each pair of circles, the intersection that lies closest to the true phone; used to show the "gap". */
export const nearPoints = (s: V[], r: number[], ref: V = PHONE): V[] => {
  const out: V[] = [];
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
    const k = circleCircle(s[i], r[i], s[j], r[j]);
    if (k) out.push(dist(k[0], ref) < dist(k[1], ref) ? k[0] : k[1]);
  }
  return out;
};
/** misfit = largest distance between those pairwise intersections (px). 0 when every circle passes through one point. */
export const misfit = (s: V[], r: number[]): number => {
  const pts = nearPoints(s, r);
  let m = 0;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) m = Math.max(m, dist(pts[i], pts[j]));
  return m;
};

if (typeof process !== "undefined" && process.env?.GPS_SELFTEST) {
  /* eslint-disable no-console */
  console.log("sats", SATS.map((s) => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(" | "));
  console.log("range km", RANGE_KM.map((k) => k.toFixed(0)).join(" "), "delay ms", DELAY_MS.map((d) => d.toFixed(2)).join(" "));
  console.log("FIX3 err px", dist(FIX3, PHONE).toExponential(2));
  console.log("FIX4 err px", dist(FIX4.p, PHONE).toExponential(2), "bias px", FIX4.b.toFixed(6), "iters", FIX4.iters, "resid", FIX4.resid.toExponential(2));
  console.log("ghost", GHOST.x.toFixed(1), GHOST.y.toFixed(1), "miss px", GHOST_MISS_PX.toFixed(1));
  console.log("misfit with bias (3 / 4 sats)", misfit(SATS.slice(0, 3), PSEUDO_PX.slice(0, 3)).toFixed(1), misfit(SATS, PSEUDO_PX).toFixed(1));
  console.log("misfit shrunk", misfit(SATS, PSEUDO_PX.map((p) => p - SOLVED_BIAS_PX)).toExponential(2));
  console.log("1us =", ONE_US_M.toFixed(2), "m =", ONE_US_PX.toFixed(4), "px");
}
