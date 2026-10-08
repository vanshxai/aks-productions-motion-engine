/**
 * Deterministic geometry for episode #13 (Tacoma Narrows). Pure functions, no state.
 *
 *  - streamline(): textbook potential flow past an ELLIPSE via the Joukowski map (a flat slab is a thin ellipse).
 *    This is a SIMPLIFIED picture of how air bends around a solid deck: real wind separates and swirls behind it.
 *  - tilt model: the swing grows each cycle, A(t) = A0·e^(σt). Also a simplified illustration, not measured data.
 */

export const DEG = Math.PI / 180;

/** Joukowski ellipse: semi-axes a=1 (along flow) and b≈0.2 (R + c²/R = 1, R − c²/R = 0.2). */
const R = 0.6, C2 = 0.24;

type P = [number, number];

/**
 * One streamline of potential flow past the slab.
 * @param s     lateral start offset, in half-widths (a = 1). Positive = above the slab on screen.
 * @param theta slab tilt on screen, radians, clockwise-positive (right end goes down, windward end goes up).
 * @param px    half-width of the slab on screen, px
 * @returns screen points relative to the slab centre (x right, y DOWN), upstream → downstream.
 */
export const streamline = (s: number, theta: number, px: number, n = 130, step = 0.075): P[] => {
  // body frame (math coords, y up). Body is turned by β = −θ (math ccw); in the body frame the wind comes from angle γ = −β = θ.
  const g = theta;
  const cg = Math.cos(g), sg = Math.sin(g);
  // free stream direction e^{iγ}; start 4.2 units upstream, lateral offset s (s>0 = "above" in the WORLD frame → rotate)
  // world offset (0, s) → body frame: rotate by −β = +θ…  handled by writing the start in the flow-aligned frame.
  let zx = -4.2 * cg - s * sg, zy = -4.2 * sg + s * cg;
  const vel = (x: number, y: number): P => {
    // dw/dz = e^{-iγ} − R² e^{iγ} / z²  (U=1); velocity = conj(dw/dz)
    const r2 = x * x + y * y;
    const z2x = (x * x - y * y) / (r2 * r2), z2y = (-2 * x * y) / (r2 * r2); // 1/z² = conj(z²)/|z|⁴ → (x²−y², −2xy)/|z|⁴
    const ax = cg - R * R * (cg * z2x - sg * z2y), ay = -sg - R * R * (cg * z2y + sg * z2x);
    // velocity = conj(dw/dz) = (ax, −ay)
    return [ax, -ay];
  };
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    // map to the ellipse plane, rotate to the world, flip y for the screen
    const r2 = zx * zx + zy * zy;
    const wx = zx + (C2 * zx) / r2, wy = zy - (C2 * zy) / r2; // ζ = z + c²/z
    const b = -theta; // body rotation (math ccw)
    const wxr = wx * Math.cos(b) - wy * Math.sin(b), wyr = wx * Math.sin(b) + wy * Math.cos(b);
    out.push([wxr * px, -wyr * px]);
    // RK2 along the unit velocity (constant arclength steps)
    const v1 = vel(zx, zy); const m1 = Math.hypot(v1[0], v1[1]) || 1;
    const mx = zx + (v1[0] / m1) * step * 0.5, my = zy + (v1[1] / m1) * step * 0.5;
    const v2 = vel(mx, my); const m2 = Math.hypot(v2[0], v2[1]) || 1;
    zx += (v2[0] / m2) * step; zy += (v2[1] / m2) * step;
    if (zx * zx + zy * zy < R * R * 0.98) break;
  }
  return out;
};

export const pathOf = (pts: P[], ox: number, oy: number) => pts.map((p, i) => `${i ? "L" : "M"} ${(ox + p[0]).toFixed(1)} ${(oy + p[1]).toFixed(1)}`).join(" ");

/* ───────── simplified "swing grows" model (illustration) ───────── */

/** Slab proportions on screen: 39 ft wide × 8 ft deep ≈ 4.9 : 1. */
export const SLAB = { a: 170, b: 35 };

/** Face the wind sees, relative to the level slab: cosθ + (a/b)·sin|θ|  (1.0 when level). Projected-height argument only. */
export const faceRatio = (theta: number) => Math.cos(theta) + (SLAB.a / SLAB.b) * Math.abs(Math.sin(theta));

/** Frame numbers: keep in sync with scenes.tsx T. */
const LOOP0 = 420, END = 576;
const PERIOD = 22;             // frames per (sped-up) swing
const A0 = 12, SIGMA = Math.log(40 / 12) / (END - LOOP0);   // 12° → 40° across the loop + key beats

/** Tilt of the deck cross-section in radians (clockwise-positive). */
export const tiltAt = (g: number, tiltStart: number) => {
  if (g < LOOP0) {
    const u = Math.max(0, Math.min(1, (g - (tiltStart + 6)) / 50));
    const e = u * u * (3 - 2 * u);
    return A0 * DEG * e;
  }
  const t = g - LOOP0;
  return A0 * Math.exp(SIGMA * t) * DEG * Math.cos((2 * Math.PI * t) / PERIOD);
};
/** Envelope of the swing (degrees) — for the readout. */
export const swingDeg = (g: number) => (g < LOOP0 ? A0 * Math.min(1, Math.max(0, (g - 326) / 50)) : A0 * Math.exp(SIGMA * (g - LOOP0)));
export const swingIndex = (g: number) => (g < LOOP0 ? 0 : 1 + Math.floor((g - LOOP0) / PERIOD));
export const SWING_PERIOD = PERIOD;
