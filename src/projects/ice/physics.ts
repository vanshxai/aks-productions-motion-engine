/**
 * Ice physics + geometry for "How It Works #11 — why ice floats". Screen pixels (x right, y down).
 *
 * Everything drawn is derived from here, as a pure function of the frame (no Math.random at render time):
 *   - densities:  water ≈ 1000 kg/m³ (999.8 at 0 °C, 999.97 at 4 °C), ice Ih ≈ 917 kg/m³ (916.7 at 0 °C)
 *       → volume ×1000/917 = 1.0905 (1 kg: 1.00 L → 1.09 L) and submerged fraction 917/1000 = 91.7 % (8.3 % above the surface)
 *   - the 2-D molecule box: the SAME N molecules sit in a honeycomb (hexagonal-ring) patch when frozen, and in a disordered packing
 *     (found by a seeded relaxation) inside a box 1/1.0905 as tall when liquid. So the level rise on freezing is the true 9 %.
 *   - H₂O is drawn as O + 2 H at 104.5°. A, B = the two sub-lattices of the honeycomb: A donates 2 in-plane H-bonds, B donates 1 in-plane
 *     and 1 out of the page (a 2-D top view cannot show the 4th bond of each molecule; it points out of the page).
 *   - the gap drawn between liquid and ice is EXAGGERATED in the honeycomb picture; the true numbers are the ones printed.
 */
export type V = { x: number; y: number };

export const RHO_WATER = 1000; // kg/m³  (≈ 999.8 at 0 °C)
export const RHO_ICE = 917; // kg/m³  (ice Ih, 916.7 at 0 °C)
export const EXPAND = RHO_WATER / RHO_ICE; // 1.0905  → "+9 %"
export const SUBMERGED = RHO_ICE / RHO_WATER; // 0.917   → "92 % below"
export const ABOVE = 1 - SUBMERGED; // 0.083   → "8 % above"
export const ICE_L = 1 * EXPAND; // 1 kg of water (1.00 L) freezes to 1.09 L

/* ───────────────────────── small deterministic helpers ───────────────────────── */
export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mulberry32 = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rad = (d: number) => (d * Math.PI) / 180;
export const wrapPi = (a: number) => { let x = (a + Math.PI) % (2 * Math.PI); if (x < 0) x += 2 * Math.PI; return x - Math.PI; };
export const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y);
const smooth = (t: number) => { const c = Math.max(0, Math.min(1, t)); return c * c * (3 - 2 * c); };

/* ───────────────────────── molecule geometry ───────────────────────── */
export const RO = 25; // O radius (px)
export const RH = 12; // H radius
export const OH = 36; // O–H length drawn
export const ANG = rad(104.5); // H–O–H angle
export const LB = 100; // O···O spacing in the drawn lattice (px)
const SQ3 = Math.sqrt(3);

/* ───────────────────────── the box ───────────────────────── */
type Raw = V & { key: string };
const rawV: Raw[] = [];
const ROWS = 3, COLS = 4;
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const cx = c * SQ3 * LB + (r % 2 ? (SQ3 * LB) / 2 : 0), cy = r * 1.5 * LB;
  for (let k = 0; k < 6; k++) {
    const a = rad(-90 + 60 * k), x = cx + LB * Math.cos(a), y = cy + LB * Math.sin(a);
    if (!rawV.some((q) => Math.hypot(q.x - x, q.y - y) < 6)) rawV.push({ x, y, key: "" });
  }
}
const minX = Math.min(...rawV.map((p) => p.x)), maxX = Math.max(...rawV.map((p) => p.x));
const minY = Math.min(...rawV.map((p) => p.y)), maxY = Math.max(...rawV.map((p) => p.y));
export const BOX_CX = 540;
export const BOX_BOTTOM = 1326;
const PAD_X = 52, PAD_T = 56, PAD_B = 56;
const offX = BOX_CX - (minX + maxX) / 2;
const offY = BOX_BOTTOM - PAD_B - maxY;
export const ICE_PTS: V[] = rawV.map((p) => ({ x: p.x + offX, y: p.y + offY }));
export const N = ICE_PTS.length;
export const BOX = {
  x0: minX + offX - PAD_X, x1: maxX + offX + PAD_X,
  yTop: minY + offY - PAD_T, yBot: BOX_BOTTOM,
};
export const BOX_H_ICE = BOX.yBot - BOX.yTop;
export const BOX_H_LIQ = BOX_H_ICE / EXPAND; // the liquid fills only 1/1.0905 of the height the ice needs
export const Y_LIQ = BOX.yBot - BOX_H_LIQ; // liquid surface (before freezing)

/* neighbours + sub-lattice */
export const NEI: number[][] = ICE_PTS.map((p, i) => ICE_PTS.map((q, j) => (j !== i && Math.abs(dist(p, q) - LB) < 4 ? j : -1)).filter((j) => j >= 0));
export const KIND: ("A" | "B")[] = ICE_PTS.map((p, i) => (NEI[i].some((j) => Math.abs(ICE_PTS[j].x - p.x) < 4 && ICE_PTS[j].y < p.y - 40) ? "A" : "B"));

/** donor bonds in the frozen lattice: from the H of molecule i (h = 0|1) to the O of molecule j */
export type Bond = { i: number; h: 0 | 1; j: number };
export const BONDS: Bond[] = [];
ICE_PTS.forEach((p, i) => {
  NEI[i].forEach((j) => {
    const dx = ICE_PTS[j].x - p.x, dy = ICE_PTS[j].y - p.y;
    if (KIND[i] === "A" && dy > 20) BONDS.push({ i, h: dx > 0 ? 0 : 1, j }); // A → its two lower neighbours
    if (KIND[i] === "B" && dy > 40) BONDS.push({ i, h: 0, j }); // B → the A directly below
  });
});

/** the rings (hexagons): list of vertex indices around each hex centre */
export const RINGS: { c: V; v: number[] }[] = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const cx = c * SQ3 * LB + (r % 2 ? (SQ3 * LB) / 2 : 0) + offX, cy = r * 1.5 * LB + offY;
  const v: number[] = [];
  for (let k = 0; k < 6; k++) {
    const a = rad(-90 + 60 * k);
    const idx = ICE_PTS.findIndex((q) => Math.hypot(q.x - (cx + LB * Math.cos(a)), q.y - (cy + LB * Math.sin(a))) < 6);
    if (idx >= 0) v.push(idx);
  }
  RINGS.push({ c: { x: cx, y: cy }, v });
}

/* ice orientation of each molecule: angle of H1, and which way H2 sits (σ) */
export const ICE_A1: number[] = KIND.map((k) => (k === "A" ? rad(90) - ANG / 2 : rad(90)));
export const SIGMA: number[] = KIND.map((k) => (k === "A" ? 1 : -1));

/* ───────────────────────── liquid packing (seeded relaxation) ───────────────────────── */
export const LIQ_PTS: V[] = (() => {
  const R = mulberry32(2024);
  const pad = 52, D0 = 92;
  const lo = { x: BOX.x0 + 74, x1: BOX.x1 - 74, y0: Y_LIQ + pad, y1: BOX.yBot - 64 };
  const P = ICE_PTS.map((p) => ({ x: p.x + (R() - 0.5) * 60, y: lo.y1 - ((lo.y1 - p.y) * (lo.y1 - lo.y0)) / (lo.y1 - ICE_PTS[0].y + 400) + (R() - 0.5) * 60 }));
  // start squeezed into the liquid height, then push apart
  for (let i = 0; i < N; i++) P[i].y = Math.max(lo.y0, Math.min(lo.y1, Y_LIQ + pad + ((ICE_PTS[i].y - BOX.yTop - PAD_T) / (BOX.yBot - PAD_B - BOX.yTop - PAD_T)) * (lo.y1 - lo.y0) + (R() - 0.5) * 40));
  for (let it = 0; it < 600; it++) {
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d = Math.hypot(dx, dy) || 1e-6;
      if (d < D0) { const k = ((D0 - d) / d) * 0.5 * 0.5; P[i].x -= dx * k; P[i].y -= dy * k; P[j].x += dx * k; P[j].y += dy * k; }
    }
    for (const p of P) { p.x = Math.max(lo.x, Math.min(lo.x1, p.x)); p.y = Math.max(lo.y0, Math.min(lo.y1, p.y)); }
  }
  return P;
})();
export const LIQ_MINSEP = (() => { let m = 1e9; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) m = Math.min(m, dist(LIQ_PTS[i], LIQ_PTS[j])); return m; })();

/** per-molecule liquid motion constants */
export const MOT = ICE_PTS.map((_, i) => ({
  px: hash(i + 1) * 6.28, py: hash(i + 77) * 6.28, wx: 0.13 + hash(i + 5) * 0.12, wy: 0.11 + hash(i + 9) * 0.13,
  qx: hash(i + 21) * 6.28, qy: hash(i + 33) * 6.28, vx: 0.031 + hash(i + 41) * 0.03, vy: 0.027 + hash(i + 47) * 0.03,
  th0: hash(i + 3) * 6.28, om: (hash(i + 13) > 0.5 ? 1 : -1) * (0.05 + hash(i + 19) * 0.07),
}));

/* ───────────────────────── timeline of the freeze (global frames) ───────────────────────── */
export const COOL0 = 98, COOL1 = 214; // 20 °C → 0 °C
export const FREEZE0 = 216; // first molecule locks
export const TEMP = (g: number) => 20 * (1 - smooth((g - COOL0) / (COOL1 - COOL0)));
/** accumulated "thermal clock" so tumbling slows smoothly as the water cools */
export const PHI: number[] = (() => { const a = [0]; for (let k = 0; k < 1000; k++) a.push(a[k] + 0.3 + 0.7 * (TEMP(k) / 20)); return a; })();
const phi = (g: number) => { const k = Math.max(0, Math.min(999, g)); const f = Math.floor(k); return PHI[f] + (PHI[f + 1] - PHI[f]) * (k - f); };

/** the molecule that nucleates the crystal: an A-type vertex nearest the middle */
export const SEED = (() => {
  const c = { x: BOX_CX, y: (BOX.yTop + BOX.yBot) / 2 };
  let best = -1, bd = 1e9;
  ICE_PTS.forEach((p, i) => { if (KIND[i] === "A") { const d = dist(p, c); if (d < bd) { bd = d; best = i; } } });
  return best;
})();
export const GROW_V = 8.2; // px per frame the crystal front advances
export const T_LOCK = ICE_PTS.map((p, i) => FREEZE0 + dist(p, ICE_PTS[SEED]) / GROW_V + hash(i + 200) * 3);
export const LOCK_END = Math.max(...T_LOCK) + 16;

export type MolState = { x: number; y: number; a1: number; a2: number; s: number; f2: number };
export const molAt = (i: number, g: number): MolState => {
  const m = MOT[i], T = TEMP(g) / 20;
  const s = smooth((g - T_LOCK[i]) / 16);
  const amp = (7 + 12 * T) * (1 - s);
  const lx = LIQ_PTS[i].x + amp * Math.sin(m.wx * phi(g) + m.px) + 0.55 * amp * Math.sin(m.vx * g + m.qx);
  const ly = LIQ_PTS[i].y + amp * Math.cos(m.wy * phi(g) + m.py) + 0.55 * amp * Math.cos(m.vy * g + m.qy);
  const x = lx + (ICE_PTS[i].x - lx) * s, y = ly + (ICE_PTS[i].y - ly) * s;
  const raw = m.th0 + m.om * phi(g);
  const a1 = ICE_A1[i] + wrapPi(raw - ICE_A1[i]) * (1 - s);
  const a2 = a1 + SIGMA[i] * ANG;
  const f2 = KIND[i] === "B" ? 1 - 0.62 * s : 1; // B's second H points out of the page → foreshortened
  return { x, y, a1, a2, s, f2 };
};
/** progress of the whole freeze 0..1 (mean lock) → level of the surface */
export const freezeFrac = (g: number) => { let t = 0; for (let i = 0; i < N; i++) t += smooth((g - T_LOCK[i]) / 16); return t / N; };

export const hPos = (m: MolState, h: 0 | 1): V => {
  const a = h === 0 ? m.a1 : m.a2, L = OH * (h === 1 ? m.f2 : 1);
  return { x: m.x + L * Math.cos(a), y: m.y + L * Math.sin(a) };
};

if (typeof process !== "undefined" && process.env?.ICE_SELFTEST) {
  /* eslint-disable no-console */
  console.log("N", N, "A", KIND.filter((k) => k === "A").length, "bonds", BONDS.length, "rings", RINGS.map((r) => r.v.length).join(","));
  console.log("box", BOX, "H_ice", BOX_H_ICE.toFixed(1), "H_liq", BOX_H_LIQ.toFixed(1), "rise", (BOX_H_ICE - BOX_H_LIQ).toFixed(1), "ratio", (BOX_H_ICE / BOX_H_LIQ).toFixed(4));
  console.log("liquid min separation", LIQ_MINSEP.toFixed(1), "seed", SEED, "lock end", LOCK_END.toFixed(0));
  console.log("EXPAND", EXPAND.toFixed(4), "SUB", SUBMERGED, "1 kg →", ICE_L.toFixed(3), "L");
  console.log("deg", NEI.map((n) => n.length).join(""));
}
