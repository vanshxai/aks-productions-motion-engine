import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Headline, clamp01, ioB, W, H } from "../gearbox/kit";

/**
 * HOW IT WORKS #16 — How the Chenab rail bridge was built          30 s · 1080×1920 · 30 fps · 900 frames
 * (first episode WITHOUT an end card: only a small AKS PRODUCTIONS tag fades in over the last second)
 *
 * BEATS PLAN — one idea per beat, the picture shows exactly what the voice says (VO phrases: public/projects/chenab/vo.json)
 *    4 hook   "This railway bridge is taller than the Eiffel Tower."  Eiffel Tower (330 m) stands in the gorge, the deck line (359 m) sits above it; height ruler
 *   86 gorge  "It spans a deep gorge with no road at the bottom."      bridge fades away, the empty V gorge; 359 m depth arrow; STEEP tags; NO ROAD pill at the river
 *  169 risk   "It's earthquake country, with strong winds."            ground shakes + seismograph trace; then wind streamlines blow through the gorge
 *  244 crane  "So builders cut roads, then hung a cable crane across." roads drawn down both slopes (truck), two towers + cables across, trolleys carry the first blocks
 *  344 arch   "The steel arch grew outward from both sides, held back by cables."  bays added from both springings; temporary towers + stay cables hold each half back
 *  463 meet   "They met in the middle, 467 meters across."              last piece drops in (closure), 467 m span dimension
 *  570 deck   "Piers on the arch carry the track deck."                temporary towers and crane leave; piers rise from the arch; deck slides in from both banks
 *  628 design "Designed for 266 kilometer an hour winds and the top earthquake zone."  wind lines + 266 km/h counter; then ground shake + ZONE V
 *  778 end    "Trains began crossing in June 2025."                    a train crosses the deck; closing facts; AKS PRODUCTIONS tag fades in at ~29 s
 *
 * Facts on screen (source URLs in the delivery notes):
 *  - deck 359 m above the river bed (KRCL brief, Railway Gazette, WSP, ENR, Wikipedia, PIB/narendramodi.in)   - Eiffel Tower 330 m incl. antennas (Wikipedia, since the 2022 antenna; KRCL still quotes 324 m)
 *  - arch span 467 m (KRCL, Railway Gazette, ENR, LAP, Wikipedia)       - total length 1,315 m (KRCL, Railway Gazette, WSP, Wikipedia, PIB)
 *  - cable crane span about 915 m (KRCL brief, NBMCW)                   - arch closed 5 April 2021 (Railway Gazette, NBMCW, Wikipedia)
 *  - design wind 266 km/h (KRCL brief, Railway Gazette, ENR, Wikipedia)  - seismic Zone V (WSP; Wikipedia "zone V - highest risk")
 *  - opened for trains June 2025 (Wikipedia; AIR News 6 Jun 2025: "inaugurated the world's highest railway arch bridge")
 * SIMPLIFIED (tagged on screen): the drawing is a side-view sketch, NOT TO SCALE (heights use one ruler, widths/cranes/towers/arch rise are schematic);
 * wind lines and shaking are illustrations of the design loads, not a simulation. Everything is a pure function of the frame.
 */

/** Global frames from public/projects/chenab/vo.json. Keep in sync with soundtrack.py. */
export const T = { gorge: 86, risk: 169, crane: 244, arch: 344, meet: 463, deck: 570, design: 628, end: 778, total: 900 };
export const CUTS = [0, 86, 169, 244, 344, 463, 570, 628, 778];
export const BAY0 = 352, BSTEP = 9.4, CLOSE = 478;
export const CUE = {
  taller: 44, vanish: 62, dimDown: 92, noroad: 136, quake0: 170, quake1: 214, wind0: 211, roads: 246, towers: 286, cable: 304, hooks: 322,
  tag: 420, close: CLOSE, span: 504, tw_off: 552, piers: 572, deck0: 592, join: 626, wind: 630, count1: 716, zone: 722, quake2: 724, train: 782, tag2: 868,
};

const AM = K.amber, LN = K.line, DIM = K.lineDim;
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fract = (x: number) => x - Math.floor(x);
const rnd = (a: number, b = 0) => fract(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) * 2 - 1; // -1..1, deterministic
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };

/* ───────────── geometry (all in screen px; ONE ruler: 1.5 px per metre, ground = river bed y 1340) ───────────── */
const GROUND = 1340, PXM = 1.5;
const yAt = (m: number) => GROUND - m * PXM;                 // metres above river bed -> y
const DECK_T = yAt(359), DECK_B = DECK_T + 12;                // 802 .. 814
const SL: [number, number][] = [[60, 816], [130, 816], [158, 886], [190, 962], [228, 1032], [257, 1100], [304, 1172], [346, 1242], [404, 1300], [450, 1340]];
const SR: [number, number][] = [[1020, 816], [970, 816], [932, 886], [890, 962], [853, 1030], [823, 1100], [772, 1170], [733, 1240], [676, 1300], [630, 1340]];
const slopeY = (pts: [number, number][], x: number) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if ((x - x0) * (x - x1) <= 0 && x0 !== x1) return lerp(y0, y1, (x - x0) / (x1 - x0));
  }
  return pts[pts.length - 1][1];
};

const AX0 = 190, AX1 = 890, YS = 962, RISE = 112, DEP = 30, NB = 21;
const ux = (u: number) => AX0 + (AX1 - AX0) * u;
const yb = (u: number) => YS - RISE * 4 * u * (1 - u);
const yt = (u: number) => yb(u) - DEP;
const bayT = (j: number) => BAY0 + BSTEP * j;                  // j = 0..9 counted from each springing
const bayDone = (j: number) => bayT(j) + 7;

const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 24} letterSpacing={o.ls ?? (o.size ?? 24) * 0.08} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);
const Panel: React.FC<{ o: number; a: string; b: React.ReactNode; c?: string }> = ({ o, a, b, c }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1412, height: 138, opacity: o, borderRadius: 12, border: `2px solid ${DIM}`, background: "rgba(3,11,24,0.85)", boxSizing: "border-box", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
    <div style={{ fontFamily: K.mono, fontSize: 27, letterSpacing: 4, color: AM, fontWeight: 700, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: K.head, fontSize: 43, fontWeight: 700, color: K.text, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b}</div>
    {c && <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 1.5, color: K.muted, whiteSpace: "nowrap", fontWeight: 500 }}>{c}</div>}
  </div>
);
const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: AM }}>{children}</span>;
const Pill: React.FC<{ x: number; y: number; text: string; o?: number; color?: string; size?: number; solid?: boolean; pop?: number }> = ({ x, y, text, o = 1, color = AM, size = 28, solid, pop = 1 }) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.9, sc = 0.7 + 0.3 * pop;
  return (
    <g opacity={o} transform={`translate(${x} ${y}) scale(${sc})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? color : "rgba(6,20,42,0.94)"} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={size * 0.35} fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={solid ? K.bgDeep : color}>{text}</text>
    </g>
  );
};
const Frame: React.FC = () => (
  <g>
    {[[VIEW.x0, VIEW.y0, 1, 1], [VIEW.x1, VIEW.y0, -1, 1], [VIEW.x0, VIEW.y1, 1, -1], [VIEW.x1, VIEW.y1, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={DIM} strokeWidth={2.4} />
    ))}
  </g>
);

/* ───────────── terrain, ruler, river ───────────── */
const Terrain: React.FC<{ g: number }> = ({ g }) => {
  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x} ${y}`).join(" L ");
  const rock = `M 60 1396 L ${poly(SL)} L ${poly([...SR].reverse())} L 1020 1396 Z`;
  const edge = `M ${poly(SL)} L ${poly([...SR].reverse())}`;
  const waves = Array.from({ length: 9 }, (_, i) => i);
  return (
    <g>
      <defs>
        <pattern id="hatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><line x1="0" y1="0" x2="0" y2="22" stroke={DIM} strokeWidth="2" opacity="0.45" /></pattern>
        <clipPath id="rockClip"><path d={rock} /></clipPath>
      </defs>
      <path d={rock} fill="#071A33" />
      <path d={rock} fill="url(#hatch)" opacity={0.85} />
      <path d={edge} fill="none" stroke={LN} strokeWidth={4.5} strokeLinejoin="round" opacity={0.95} />
      {/* river */}
      <g opacity={0.9}>
        <rect x={452} y={GROUND - 2} width={176} height={8} fill="#0F4C7A" opacity={0.8} />
        {waves.map((i) => (
          <path key={i} d={`M ${462 + i * 18} ${GROUND + 8 + (i % 2) * 7} q 5 -5 10 0 t 10 0`} fill="none" stroke={LN} strokeWidth={2} opacity={0.5 + 0.3 * Math.sin(g * 0.12 + i)} />
        ))}
      </g>
      {T_(540, GROUND + 56, "CHENAB RIVER", { a: "middle", size: 20, c: K.muted, op: 0.8 })}
    </g>
  );
};

/** Vertical height ruler (metres above the river bed) – left edge of the drawing. */
const Ruler: React.FC<{ o: number }> = ({ o }) => {
  if (o <= 0.01) return null;
  return (
    <g opacity={o}>
      <line x1={96} y1={GROUND} x2={96} y2={DECK_T} stroke={K.muted} strokeWidth={2.4} />
      {[0, 100, 200, 300].map((m) => (
        <g key={m}>
          <line x1={96} y1={yAt(m)} x2={116} y2={yAt(m)} stroke={K.muted} strokeWidth={2.4} />
          {T_(124, yAt(m) + 7, m === 0 ? "0 m" : String(m), { size: 20, c: K.muted, ls: 1 })}
        </g>
      ))}
      <line x1={86} y1={DECK_T} x2={128} y2={DECK_T} stroke={AM} strokeWidth={4} />
    </g>
  );
};

/* ───────────── Eiffel Tower (330 m incl. antenna → 495 px) ───────────── */
const Eiffel: React.FC<{ o: number }> = ({ o }) => {
  if (o <= 0.01) return null;
  const cx = 540, base = GROUND, H0 = 470;
  const w = (h: number) => 4 + 54 * Math.pow(1 - h / H0, 2.7);
  const hs = Array.from({ length: 41 }, (_, i) => (i / 40) * H0);
  const left = hs.map((h) => `${cx - w(h)} ${base - h}`);
  const right = [...hs].reverse().map((h) => `${cx + w(h)} ${base - h}`);
  const plat = [85, 172, 414];
  const brace = (h0: number, h1: number) => (
    <g key={h0} stroke={LN} strokeWidth={1.8} opacity={0.75}>
      <line x1={cx - w(h0)} y1={base - h0} x2={cx + w(h1)} y2={base - h1} /><line x1={cx + w(h0)} y1={base - h0} x2={cx - w(h1)} y2={base - h1} />
    </g>
  );
  return (
    <g opacity={o}>
      <path d={`M ${left.join(" L ")} L ${right.join(" L ")} Z`} fill={LN} fillOpacity={0.09} stroke={LN} strokeWidth={3.4} strokeLinejoin="round" />
      <path d={`M ${cx - w(0) * 0.6} ${base} Q ${cx} ${base - 120} ${cx + w(0) * 0.6} ${base}`} fill="none" stroke={LN} strokeWidth={2.4} opacity={0.8} />
      {brace(0, 85)}{brace(85, 172)}{brace(172, 300)}{brace(300, 414)}
      {plat.map((h) => <rect key={h} x={cx - w(h) - 7} y={base - h - 3} width={(w(h) + 7) * 2} height={7} fill={LN} opacity={0.9} />)}
      <line x1={cx} y1={base - H0} x2={cx} y2={base - H0 - 25} stroke={LN} strokeWidth={3} />
    </g>
  );
};

/* ───────────── lattice tower (cable-crane tower / temporary arch tower) ───────────── */
const Lattice: React.FC<{ x: number; yBase: number; yTop: number; wB: number; wT: number; p: number; color?: string; sw?: number }> = ({ x, yBase, yTop, wB, wT, p, color = LN, sw = 2.6 }) => {
  if (p <= 0.01) return null;
  const hFull = yBase - yTop, h = hFull * clamp01(p), yh = yBase - h;
  const wAt = (y: number) => lerp(wB, wT, (yBase - y) / hFull);
  const n = Math.max(2, Math.round(hFull / 30));
  const rows = Array.from({ length: n + 1 }, (_, i) => yBase - (hFull * i) / n).filter((y) => y >= yh - 0.5);
  return (
    <g stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round">
      <line x1={x - wB / 2} y1={yBase} x2={x - wAt(yh) / 2} y2={yh} /><line x1={x + wB / 2} y1={yBase} x2={x + wAt(yh) / 2} y2={yh} />
      {rows.slice(0, -1).map((y, i) => {
        const yn = rows[i + 1], a = wAt(y) / 2, b = wAt(yn) / 2;
        return <g key={i} strokeWidth={sw * 0.6}><line x1={x - a} y1={y} x2={x + b} y2={yn} /><line x1={x + a} y1={y} x2={x - b} y2={yn} /><line x1={x - b} y1={yn} x2={x + b} y2={yn} /></g>;
      })}
    </g>
  );
};

/* ───────────── arch bays ───────────── */
const chord = (u0: number, u1: number, fn: (u: number) => number) => {
  const pts = Array.from({ length: 5 }, (_, i) => { const u = lerp(u0, u1, i / 4); return [ux(u), fn(u)] as [number, number]; });
  return pts;
};
const Bay: React.FC<{ k: number; p: number; hot: number; dy?: number }> = ({ k, p, hot, dy = 0 }) => {
  if (p <= 0.01) return null;
  const u0 = k / NB, u1 = (k + 1) / NB;
  const b = chord(u0, u1, yb), t = chord(u0, u1, yt);
  const P = (a: [number, number][]) => a.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
  const col = hot > 0.05 ? AM : LN;
  const diag = k % 2 === 0 ? [ux(u0), yb(u0), ux(u1), yt(u1)] : [ux(u0), yt(u0), ux(u1), yb(u1)];
  return (
    <g opacity={clamp01(p * 1.5)} transform={`translate(0 ${dy})`} style={{ filter: hot > 0.05 ? `drop-shadow(0 0 ${8 * hot}px ${AM})` : undefined }}>
      <path d={`M ${P(t)} L ${P([...b].reverse())} Z`} fill={LN} fillOpacity={0.1} stroke="none" />
      <path d={`M ${P(b)}`} fill="none" stroke={col} strokeWidth={4.4} strokeLinecap="round" />
      <path d={`M ${P(t)}`} fill="none" stroke={col} strokeWidth={4.4} strokeLinecap="round" />
      <line x1={ux(u0)} y1={yb(u0)} x2={ux(u0)} y2={yt(u0)} stroke={col} strokeWidth={2.6} />
      <line x1={ux(u1)} y1={yb(u1)} x2={ux(u1)} y2={yt(u1)} stroke={col} strokeWidth={2.6} />
      <line x1={diag[0]} y1={diag[1]} x2={diag[2]} y2={diag[3]} stroke={col} strokeWidth={2.4} />
    </g>
  );
};

/** time at which bay k (0..20) appears; middle bay 10 is the closure piece */
const bayTime = (k: number) => (k <= 9 ? bayT(k) : k === 10 ? CLOSE : bayT(20 - k) + 2);
const bayP = (g: number, k: number) => clamp01((g - bayTime(k)) / 6);

/* ───────────── cable crane ───────────── */
const CT = { xl: 84, xr: 996, yTop: 680, yBase: 816 };
const cableY = (x: number) => { const t = clamp01((x - CT.xl) / (CT.xr - CT.xl)); return CT.yTop + 240 * t * (1 - t); };
const tipX = (j: number) => ux((j + 0.5) / NB);                 // centre of left bay j
const tipYy = (j: number) => yt((j + 0.5) / NB) - 6;

/** hook state for the LEFT trolley at frame g: { x, d (0 at the cable .. 1 at the arch tip), y1, loaded } */
const hookL = (g: number) => {
  if (g < BAY0) {
    const x = lerp(CT.xl + 14, tipX(0), easeInOut(clamp01((g - CUE.hooks) / (BAY0 - CUE.hooks))));
    const d = clamp01((g - CUE.hooks - 8) / (BAY0 - CUE.hooks - 8));
    return { x, d, tipY: tipYy(0), loaded: true };
  }
  const tau = (g - BAY0) / BSTEP, j = Math.floor(tau), ph = tau - j;
  if (j <= 9) {
    const x = lerp(tipX(j), tipX(Math.min(j + 1, 10)), easeInOut(clamp01((ph - 0.2) / 0.55)));
    const d = ph < 0.35 ? 1 - ph / 0.35 : (ph - 0.35) / 0.65;
    return { x, d, tipY: lerp(tipYy(j), tipYy(Math.min(j + 1, 10)), clamp01((ph - 0.2) / 0.55)), loaded: ph > 0.3 };
  }
  // after the 10th bay: both hooks bring the closure piece to the middle, then rise
  const s = clamp01((g - 448) / 24), x = lerp(tipX(9), 505, easeInOut(s));
  const rise = clamp01((g - CLOSE - 2) / 14);
  const d = (g < CLOSE ? lerp(0.45, 1, clamp01((g - 462) / 14)) : 1 - rise);
  return { x, d, tipY: yt(0.5) - 4, loaded: g < CLOSE };
};

const Crane: React.FC<{ g: number; o: number }> = ({ g, o }) => {
  if (o <= 0.01 || g < CUE.towers - 4) return null;
  const tp = io(g, [CUE.towers, CUE.towers + 20], [0, 1], easeOut);
  const cp = io(g, [CUE.cable, CUE.cable + 22], [0, 1], easeInOut);
  const path = (dy: number) => `M ${CT.xl} ${CT.yTop + dy} Q ${(CT.xl + CT.xr) / 2} ${CT.yTop + 120 + dy} ${CT.xr} ${CT.yTop + dy}`;
  const hl = hookL(g), onCable = g >= CUE.hooks - 6;
  const trolley = (xx: number, d: number, tipY: number, loaded: boolean, dy: number, mirror: boolean) => {
    const cy = cableY(xx) + dy;
    const y1 = lerp(cy + 14, tipY, d);
    return (
      <g>
        <rect x={xx - 11} y={cy - 9} width={22} height={13} rx={3} fill={AM} />
        <line x1={xx} y1={cy + 4} x2={xx} y2={y1} stroke={AM} strokeWidth={2.2} />
        {loaded && <rect x={xx - 18} y={y1} width={36} height={12} rx={2} fill="#0A2548" stroke={AM} strokeWidth={3} />}
        {!loaded && <circle cx={xx} cy={y1 + 2} r={4} fill={AM} />}
        {mirror && null}
      </g>
    );
  };
  const hr = { x: W - hl.x, d: hl.d, tipY: hl.tipY, loaded: hl.loaded };
  return (
    <g opacity={o}>
      <Lattice x={CT.xl} yBase={CT.yBase} yTop={CT.yTop} wB={34} wT={18} p={tp} color={LN} />
      <Lattice x={CT.xr} yBase={CT.yBase} yTop={CT.yTop} wB={34} wT={18} p={tp} color={LN} />
      {cp > 0.01 && (<>
        <path d={path(0)} fill="none" stroke={LN} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - cp} opacity={0.95} />
        <path d={path(12)} fill="none" stroke={LN} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - cp} opacity={0.75} />
      </>)}
      {onCable && trolley(hl.x, hl.d, hl.tipY, hl.loaded, 0, false)}
      {onCable && trolley(hr.x, hr.d, hr.tipY, hr.loaded, 12, true)}
    </g>
  );
};

/* ───────────── temporary towers + stay cables for the arch halves ───────────── */
const TTOW = { xl: 172, xr: 908, yTop: 742 };
const AnchorL: [number, number] = [112, 818];
const AnchorR: [number, number] = [968, 818];
const Stays: React.FC<{ g: number; o: number }> = ({ g, o }) => {
  if (o <= 0.01 || g < 318) return null;
  const tp = io(g, [318, 346], [0, 1], easeOut);
  const yl = slopeY(SL, TTOW.xl), yr = slopeY(SR, TTOW.xr);
  const stay = (side: 1 | -1) => {
    const tx = side === 1 ? TTOW.xl : TTOW.xr, anc = side === 1 ? AnchorL : AnchorR;
    const els: React.ReactNode[] = [];
    els.push(<line key="back" x1={tx} y1={TTOW.yTop} x2={anc[0]} y2={anc[1]} stroke={AM} strokeWidth={3} opacity={tp} />);
    for (let j = 1; j <= 9; j += 2) {
      const kk = side === 1 ? j : 20 - j;               // bay index whose far end the stay holds
      const u = side === 1 ? (j + 1) / NB : (20 - j) / NB;
      const p = clamp01((g - bayT(j) - 4) / 5);
      if (p <= 0) continue;
      const x1 = ux(u), y1 = yt(u);
      els.push(<line key={j} x1={tx} y1={TTOW.yTop} x2={lerp(tx, x1, p)} y2={lerp(TTOW.yTop, y1, p)} stroke={AM} strokeWidth={2.4} opacity={0.9} />);
      void kk;
    }
    return els;
  };
  return (
    <g opacity={o}>
      <Lattice x={TTOW.xl} yBase={yl} yTop={TTOW.yTop} wB={34} wT={14} p={tp} color={AM} sw={2.6} />
      <Lattice x={TTOW.xr} yBase={yr} yTop={TTOW.yTop} wB={34} wT={14} p={tp} color={AM} sw={2.6} />
      {stay(1)}{stay(-1)}
    </g>
  );
};

/* ───────────── roads ───────────── */
/** polyline cut at fraction t of its length -> { pts, end } */
const partial = (a: [number, number][], t: number) => {
  const len = a.slice(1).map((q, i) => Math.hypot(q[0] - a[i][0], q[1] - a[i][1]));
  const tot = len.reduce((x, y) => x + y, 0);
  let want = tot * clamp01(t);
  const out: [number, number][] = [a[0]];
  for (let i = 0; i < len.length; i++) {
    if (want >= len[i]) { out.push(a[i + 1]); want -= len[i]; continue; }
    const f2 = want / len[i];
    out.push([lerp(a[i][0], a[i + 1][0], f2), lerp(a[i][1], a[i + 1][1], f2)]);
    break;
  }
  return out;
};
const Roads: React.FC<{ g: number; o: number }> = ({ g, o }) => {
  if (o <= 0.01) return null;
  const p = io(g, [CUE.roads, CUE.roads + 34], [0, 1], easeInOut);
  const mk = (pts: [number, number][], dx: number) => pts.map(([x, y]) => [x + dx, y + 6] as [number, number]);
  const L = mk([SL[1], SL[2], SL[3]], -15), R = mk([SR[1], SR[2], SR[3]], 15);
  const d = (a: [number, number][]) => `M ${a.map(([x, y]) => `${x} ${y}`).join(" L ")}`;
  const pl = partial(L, p), pr = partial(R, p);
  const [lx, ly] = pl[pl.length - 1], [rx, ry] = pr[pr.length - 1];
  return (
    <g opacity={o}>
      <path d={d(pl)} fill="none" stroke={AM} strokeWidth={7} strokeLinecap="round" strokeDasharray="16 11" opacity={0.95} />
      <path d={d(pr)} fill="none" stroke={AM} strokeWidth={7} strokeLinecap="round" strokeDasharray="16 11" opacity={0.95} />
      <rect x={lx - 11} y={ly - 9} width={22} height={14} rx={3} fill={AM} stroke="#fff" strokeWidth={1.5} />
      <rect x={rx - 11} y={ry - 9} width={22} height={14} rx={3} fill={AM} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
};

/* ───────────── wind + quake illustrations ───────────── */
const Wind: React.FC<{ g: number; o: number; ys: number[]; gust?: number }> = ({ g, o, ys, gust = 1 }) => {
  if (o <= 0.01) return null;
  return (
    <g opacity={o}>
      {ys.map((y, i) => (
        <path key={i} d={`M 90 ${y} C 280 ${y - 22 * gust}, 420 ${y + 22 * gust}, 560 ${y} S 840 ${y - 20 * gust}, 1000 ${y}`} fill="none" stroke={LN} strokeWidth={3.6} strokeLinecap="round"
          strokeDasharray="78 54" strokeDashoffset={-(g * (12 + (i % 3) * 3) + i * 29)} opacity={0.5 + 0.35 * ((i + 1) % 2)} />
      ))}
    </g>
  );
};
const quakeShake = (g: number, a: number, b: number, amp: number) => {
  const e = io(g, [a, a + 4], [0, 1]) * (1 - io(g, [b - 14, b], [0, 1], easeInOut));
  return { x: rnd(Math.floor(g), 1) * amp * e, y: rnd(Math.floor(g), 2) * amp * 0.6 * e, e };
};
const Seismo: React.FC<{ g: number; e: number }> = ({ g, e }) => {
  if (e <= 0.02) return null;
  const pts = Array.from({ length: 81 }, (_, i) => {
    const x = 392 + i * 3.9, env = Math.sin((i / 80) * Math.PI) ** 0.6;
    return `${x.toFixed(1)} ${(1236 + rnd(i, Math.floor(g)) * 24 * e * env).toFixed(1)}`;
  });
  return (
    <g opacity={Math.min(1, e * 1.6)}>
      <line x1={380} y1={1236} x2={704} y2={1236} stroke={DIM} strokeWidth={1.5} strokeDasharray="6 8" />
      <path d={`M ${pts.join(" L ")}`} fill="none" stroke={AM} strokeWidth={3.2} strokeLinejoin="round" />
    </g>
  );
};

/* ───────────── the finished bridge (arch + piers + deck) ───────────── */
const DeckBar: React.FC<{ pl: number; pr: number; o?: number }> = ({ pl, pr, o = 1 }) => {
  const xl = lerp(60, 540, clamp01(pl)), xr = lerp(1020, 540, clamp01(pr));
  const seg = (x0: number, x1: number, key: string) => x1 - x0 > 1 && (
    <g key={key}>
      <rect x={x0} y={DECK_T} width={x1 - x0} height={12} fill="#12406B" stroke={LN} strokeWidth={3} />
      <line x1={x0} y1={DECK_T} x2={x1} y2={DECK_T} stroke={AM} strokeWidth={4} />
    </g>
  );
  return <g opacity={o}>{seg(60, xl, "l")}{seg(xr, 1020, "r")}</g>;
};
const Piers: React.FC<{ g: number }> = ({ g }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i <= NB; i++) {
    const u = i / NB, r = Math.min(i, NB - i), p = ioB(g, CUE.piers + r * 2.2, CUE.piers + r * 2.2 + 10);
    if (p <= 0.01) continue;
    const x = ux(u), y0 = yt(u), h = (y0 - DECK_B) * clamp01(p), y1 = y0 - h;
    out.push(<g key={i} stroke={LN} strokeWidth={3} strokeLinecap="round">
      <line x1={x} y1={y0} x2={x} y2={y1} />
      {Array.from({ length: Math.floor(h / 26) }, (_, q) => <line key={q} x1={x - 6} y1={y0 - 13 - q * 26} x2={x + 6} y2={y0 - 26 - q * 26} strokeWidth={1.8} opacity={0.7} />)}
    </g>);
  }
  // viaduct piers on the slopes next to the arch
  for (const [pts, x] of [[SL, 150], [SR, 930]] as [[number, number][], number][]) {
    const p = ioB(g, CUE.piers + 18, CUE.piers + 30);
    if (p > 0.01) { const y0 = slopeY(pts, x); out.push(<line key={`v${x}`} x1={x} y1={y0} x2={x} y2={y0 - (y0 - DECK_B) * clamp01(p)} stroke={LN} strokeWidth={3} strokeLinecap="round" />); }
  }
  return <g>{out}</g>;
};
const Train: React.FC<{ g: number }> = ({ g }) => {
  const s = clamp01((g - CUE.train) / 92), x = lerp(-380, 1130, s);
  if (s <= 0 || s >= 1) return null;
  const cars = 6, cw = 60, gap = 7;
  return (
    <g>
      <ellipse cx={x + 10} cy={DECK_T - 8} rx={110} ry={26} fill={AM} opacity={0.12} />
      {Array.from({ length: cars }, (_, i) => {
        const cx = x - i * (cw + gap), loco = i === 0;
        return (
          <g key={i}>
            <rect x={cx - cw} y={DECK_T - 30} width={cw} height={28} rx={loco ? 10 : 4} fill={loco ? AM : "#0A2548"} stroke={AM} strokeWidth={3} />
            {!loco && [0, 1, 2, 3].map((q) => <rect key={q} x={cx - cw + 8 + q * 13} y={DECK_T - 24} width={8} height={9} rx={1.5} fill={LN} opacity={0.9} />)}
          </g>
        );
      })}
      <circle cx={x + 3} cy={DECK_T - 17} r={5} fill="#fff" />
    </g>
  );
};

/* ───────────── drawing: everything as a function of the frame ───────────── */
const Drawing: React.FC<{ g: number }> = ({ g }) => {
  const bridgeOp = io(g, [CUE.vanish, CUE.vanish + 22], [1, 0]);
  // wind phases: gorge-hazard (211-244), design (628-722)
  const hazWind = win(g, CUE.wind0, T.crane, 8, 8);
  const desWind = win(g, T.design, CUE.zone + 6, 10, 10);
  // quake phases
  const q1 = quakeShake(g, CUE.quake0, CUE.quake1, 5.5), q2 = quakeShake(g, CUE.quake2, T.end - 6, 4.5);
  const sx = q1.x + q2.x, sy = q1.y + q2.y, qe = Math.max(q1.e, q2.e);
  // build state
  const built = g >= T.gorge;
  const nTow = 1 - io(g, [CUE.tw_off, CUE.tw_off + 20], [0, 1]);
  const closeP = bayP(g, 10);
  const hot = (k: number) => clamp01(1 - (g - bayTime(k) - 3) / 9);
  const spanP = io(g, [CUE.span, CUE.span + 16], [0, 1], easeOut);
  const dimP = io(g, [CUE.dimDown, CUE.dimDown + 22], [0, 1], easeInOut);
  const hookP = ioB(g, 18, 34);
  const deckL = io(g, [CUE.deck0, T.design - 2], [0, 1], easeInOut);
  return (
    <g>
      {/* wind behind the terrain so lines stop at the rock */}
      <Wind g={g} o={hazWind * 0.9} ys={[860, 925, 990, 1055, 1120, 1185]} gust={1.4} />
      <Wind g={g} o={desWind * 0.85} ys={[760, 850, 940, 1040, 1130, 1215]} gust={1.1} />
      <g transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)})`}>
        <Terrain g={g} />
        <Ruler o={1} />
        {/* hook beat: deck line + Eiffel Tower */}
        <g opacity={bridgeOp}>
          <line x1={96} y1={DECK_T} x2={1020} y2={DECK_T} stroke={AM} strokeWidth={2.6} strokeDasharray="14 9" opacity={0.65} />
          <line x1={160} y1={yAt(330)} x2={925} y2={yAt(330)} stroke={LN} strokeWidth={2.2} strokeDasharray="10 9" opacity={0.6} />
          <Eiffel o={1} />
          <DeckBar pl={1} pr={1} />
          {T_(150, DECK_T - 16, "BRIDGE DECK · 359 m", { c: AM, size: 26, w: 700 })}
          {T_(508, yAt(330) - 9, "EIFFEL TOWER · 330 m", { c: LN, size: 22, a: "end", w: 700 })}
          <g opacity={hookP}>
            <line x1={780} y1={DECK_T + 1} x2={780} y2={yAt(330) - 1} stroke={AM} strokeWidth={3} markerStart="url(#arr)" markerEnd="url(#arr)" />
            <Pill x={780} y={912} text="TALLER" size={28} solid pop={hookP} />
          </g>
        </g>
        {/* gorge beat: depth arrow + steep + no road */}
        {g >= T.gorge - 4 && g < T.risk + 6 && (
          <g opacity={win(g, T.gorge, T.risk + 4, 4, 10)}>
            <line x1={540} y1={DECK_T} x2={540} y2={lerp(DECK_T, GROUND - 4, dimP)} stroke={AM} strokeWidth={3} strokeDasharray="12 8" markerEnd="url(#arr)" opacity={0.95} />
            <g opacity={clamp01(dimP * 2 - 0.6)}><Pill x={540} y={1020} text="359 m DOWN" size={30} /></g>
            <Pill x={332} y={1062} text="STEEP" size={26} color={LN} o={ioB(g, 118, 130)} pop={ioB(g, 118, 130)} />
            <Pill x={748} y={1062} text="STEEP" size={26} color={LN} o={ioB(g, 124, 136)} pop={ioB(g, 124, 136)} />
            <Pill x={540} y={1282} text="NO ROAD" size={30} color={K.red} solid o={ioB(g, CUE.noroad, CUE.noroad + 12)} pop={ioB(g, CUE.noroad, CUE.noroad + 12)} />
          </g>
        )}
        {/* hazards */}
        <Seismo g={g} e={Math.max(q1.e, q2.e)} />
        {g >= CUE.quake0 && g < T.crane && <Pill x={540} y={1130} text="EARTHQUAKE ZONE" size={28} color={K.red} o={win(g, CUE.quake0 + 2, CUE.wind0 + 14, 6, 10)} pop={ioB(g, CUE.quake0 + 2, CUE.quake0 + 14)} />}
        {g >= CUE.wind0 && g < T.crane && <Pill x={540} y={900} text="STRONG WINDS" size={28} color={LN} solid o={win(g, CUE.wind0 + 2, T.crane - 2, 6, 6)} pop={ioB(g, CUE.wind0 + 2, CUE.wind0 + 14)} />}
        {/* build */}
        <Roads g={g} o={win(g, CUE.roads - 2, T.arch + 40, 4, 24) } />
        <Crane g={g} o={1 - io(g, [CUE.tw_off, CUE.tw_off + 20], [0, 1])} />
        <Stays g={g} o={nTow} />
        {built && (
          <g>
            {Array.from({ length: NB }, (_, k) => {
              const p = bayP(g, k);
              if (k === 10) return <Bay key={k} k={k} p={p} hot={hot(k)} dy={-(1 - clamp01((g - CLOSE) / 7)) * 46} />;
              return <Bay key={k} k={k} p={p} hot={hot(k)} />;
            })}
          </g>
        )}
        {/* span dimension */}
        {spanP > 0.01 && (
          <g opacity={Math.min(1, spanP * 1.4) * (1 - io(g, [CUE.tw_off, CUE.tw_off + 16], [0, 1]))}>
            <line x1={AX0} y1={976} x2={AX0} y2={1014} stroke={K.muted} strokeWidth={2} />
            <line x1={AX1} y1={976} x2={AX1} y2={1014} stroke={K.muted} strokeWidth={2} />
            <line x1={AX0} y1={1000} x2={lerp(AX0, 540 - 120, spanP)} y2={1000} stroke={AM} strokeWidth={3} markerStart="url(#arr)" />
            <line x1={AX1} y1={1000} x2={lerp(AX1, 540 + 120, spanP)} y2={1000} stroke={AM} strokeWidth={3} markerStart="url(#arr)" />
            <Pill x={540} y={1000} text="467 m" size={38} solid pop={spanP} />
          </g>
        )}
        {/* pills for the build steps */}
        <Pill x={540} y={1130} text="ACCESS ROADS" size={28} o={win(g, CUE.roads + 4, CUE.towers + 6, 8, 8)} pop={ioB(g, CUE.roads + 4, CUE.roads + 16)} />
        <Pill x={540} y={1130} text="CABLE CRANE" size={28} o={win(g, CUE.cable - 4, T.arch + 4, 8, 8)} pop={ioB(g, CUE.cable - 4, CUE.cable + 8)} />
        <Pill x={540} y={1130} text="TEMPORARY CABLES" size={28} o={win(g, CUE.tag, CLOSE - 4, 8, 6)} pop={ioB(g, CUE.tag, CUE.tag + 12)} />
        <Pill x={540} y={1130} text="CLOSURE · APRIL 2021" size={28} solid o={win(g, CLOSE + 2, T.deck - 6, 8, 10)} pop={ioB(g, CLOSE + 2, CLOSE + 14)} />
        {/* deck */}
        <Piers g={g} />
        <DeckBar pl={g >= CUE.deck0 ? deckL : 0} pr={g >= CUE.deck0 ? deckL : 0} />
        {g >= CUE.join - 3 && g < CUE.join + 16 && <circle cx={540} cy={DECK_T + 6} r={8 + (g - CUE.join) * 3} fill="none" stroke={AM} strokeWidth={3} opacity={clamp01(1 - (g - CUE.join) / 14)} />}
        {/* design readouts */}
        <g opacity={win(g, T.design + 6, CUE.zone + 2, 8, 8)}>
          {T_(540, 1105, `${Math.round(266 * io(g, [T.design + 10, CUE.count1], [0, 1], easeOut))}`, { size: 150, c: AM, a: "middle", w: 700, ls: -6 })}
          {T_(540, 1158, "KM/H · DESIGN WIND", { size: 26, c: K.muted, a: "middle" })}
        </g>
        <g opacity={win(g, CUE.zone + 2, T.end - 4, 10, 10)}>
          <Pill x={540} y={1070} text="SEISMIC ZONE V" size={40} color={K.red} solid pop={ioB(g, CUE.zone + 2, CUE.zone + 16)} />
          {T_(540, 1140, "HIGHEST RISK CLASS", { size: 24, c: K.muted, a: "middle" })}
        </g>
        <Train g={g} />
      </g>
    </g>
  );
};

/* ───────────── main shot ───────────── */
export const ChenabShot: React.FC = () => {
  const g = useCurrentFrame();
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={g} lines={["Taller than the", "*Eiffel Tower*"]} at={-30} exitAt={T.gorge - 12} size={100} />
      <Headline f={g} lines={["A *deep* gorge", "no *road* in"]} at={T.gorge + 3} exitAt={T.risk - 8} size={100} />
      <Headline f={g} lines={["Quakes and", "*strong winds*"]} at={T.risk + 3} exitAt={T.crane - 8} size={100} />
      <Headline f={g} lines={["Roads, then a", "*cable crane*"]} at={T.crane + 3} exitAt={T.arch - 8} size={100} />
      <Headline f={g} lines={["The arch grows", "from *both sides*"]} at={T.arch + 3} exitAt={T.meet - 8} size={96} />
      <Headline f={g} lines={["They *meet*", "in the middle"]} at={T.meet + 3} exitAt={T.deck - 8} size={104} />
      <Headline f={g} lines={["Piers carry", "the *deck*"]} at={T.deck + 3} exitAt={T.design - 8} size={104} />
      <Headline f={g} lines={["Built for", "*wind* and *quakes*"]} at={T.design + 3} exitAt={T.end - 8} size={98} />
      <Headline f={g} lines={["Open for", "*trains*"]} at={T.end + 3} size={110} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8FB3D1" /></marker>
        </defs>
        <Frame />
        <Drawing g={g} />
        <g opacity={io(g, [20, 36], [0, 1])}>{T_(540, 1584, "SIMPLIFIED DRAWING · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}</g>
      </svg>

      <Panel o={pn(-10, T.gorge + 2)} a="WORLD'S HIGHEST RAILWAY ARCH BRIDGE" b={<>Deck <Em>359 m</Em> above the river</>} c="Eiffel Tower: 330 m · Chenab Bridge, India" />
      <Panel o={pn(T.gorge, T.risk + 2)} a="THE CHENAB GORGE · JAMMU & KASHMIR" b={<>Deep gorge, <Em>no road</Em> at the bottom</>} c="Steep Himalayan slopes · access had to be built" />
      <Panel o={pn(T.risk, T.crane + 2)} a="TWO BIG CHALLENGES" b={<><Em>Earthquakes</Em> and strong <Em>winds</Em></>} c="A major seismic zone · windy gorge" />
      <Panel o={pn(T.crane, CUE.cable - 6)} a="STEP 1 · ACCESS" b={<>Cut <Em>roads</Em> into the slopes</>} c="So machines and steel can reach the foundations" />
      <Panel o={pn(CUE.cable - 8, T.arch + 2)} a="STEP 2 · CABLE CRANE" b={<>Steel <Em>flies over</Em> the gorge</>} c="Crane span about 915 m · lifts steel blocks" />
      <Panel o={pn(T.arch, T.meet + 2)} a="STEP 3 · BUILD THE ARCH" b={<>Two halves grow <Em>outward</Em></>} c="Temporary cables hold each half back" />
      <Panel o={pn(T.meet, T.deck + 2)} a="STEP 4 · CLOSURE" b={<>The halves <Em>meet</Em> in the middle</>} c="Arch closed April 2021 · span 467 m" />
      <Panel o={pn(T.deck, T.design + 2)} a="STEP 5 · THE DECK" b={<>Piers on the arch <Em>carry</Em> the track</>} c="Deck pushed out from both banks over the piers" />
      <Panel o={pn(T.design, CUE.zone + 10)} a="DESIGNED FOR WIND" b={<>Up to <Em>266 km/h</Em> winds</>} c="A design value, not a measured gust" />
      <Panel o={pn(CUE.zone + 2, T.end + 2)} a="DESIGNED FOR EARTHQUAKES" b={<>Seismic <Em>Zone V</Em></>} c="The highest risk class in India's building code" />
      <Panel o={pn(T.end, T.total + 20)} a="OPEN FOR TRAINS · JUNE 2025" b={<><Em>1,315 m</Em> long · <Em>467 m</Em> arch</>} c="Part of the Udhampur–Srinagar–Baramulla line" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>HOW IT WORKS · 16</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 108, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>How the Chenab</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 108, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>bridge was built</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 84, lineHeight: 1.1, color: AM }}>359 m above a river</div>
    </div>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8FB3D1" /></marker></defs>
      <Frame />
      <Drawing g={838} />
      {T_(540, 1584, "SIMPLIFIED DRAWING · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}
    </svg>
  </>
);
void easeOut; void H;
