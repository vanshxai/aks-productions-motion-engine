import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Headline, clamp01, ioB, W, H } from "../gearbox/kit";
import { Wire3D, project, ring, V3, WireLine, WireView } from "../../engine/wire3d";

/**
 * HOW IT WORKS #18 — Why do airplane windows have a tiny hole?        30 s · 1080×1920 · 30 fps · 900 frames
 * HIT-STYLE: frame 0 is a finished hook (question headline + rotating wireframe of the three window panes, bleed hole glowing). Voice starts at 0.1 s.
 * House rule: no end card — the last picture holds and a small AKS PRODUCTIONS tag (EndTag) fades in over the last second.
 * "2D that rotates like 3D wireframe" -> src/engine/wire3d.tsx: the three panes start exploded and turning, then settle edge-on into the cross-section.
 *
 * BEATS PLAN — VO phrases: public/projects/windowhole/vo.json (frames @30)
 *    3 hook   "That tiny hole in your window isn't a defect."  rotating exploded 3-pane wireframe, hole ringed; 'A DEFECT?' struck through
 *   94        "It's keeping you safe."                        KEEPING YOU SAFE pill
 *  131 layers "Your window is three layers, not one."          stack turns edge-on = cross-section; OUTER / MIDDLE / INNER tagged
 *  203 push   "Outside air is thin."                           left: sparse air, ~3.5 psi at 35,000 ft
 *  254        "The cabin is pressurized."                      right: dense air, ~11 psi
 *  314        "So the window gets pushed outward,"             six big arrows push left, 'about 8 psi push'
 *  371        "hard."                                          arrows surge, the pane flexes
 *  390 outer  "The outer layer takes that push."               arrows reach the OUTER pane, it glows, flexes
 *  440 hole   "The tiny hole lets cabin air into the gap,"     air flows through the hole in the MIDDLE pane into the gap
 *  518        "so the middle layer feels no push."             equal air both sides of the middle pane, opposing arrows cancel
 *  587        "It's the spare."                                SPARE pill on the middle pane
 *  613 fog    "It also lets moisture escape,"                  fog patches + droplets leave through the hole
 *  670        "so the window doesn't fog up."                  CLEAR VIEW
 *  715 end    "If the outer layer failed,"                     outer pane cracks
 *  763        "the middle one would hold."                     arrows now stop at the middle pane, it holds
 *  812        "Now you know."                                  TINY HOLE. BIG BACKUP.
 *
 * Facts on screen (source URLs in the delivery notes):
 *  - three panes: outer (structural), middle (backup, has the hole), inner 'scratch pane' (not structural): Migflug, ScienceAlert, Afar, ScienceBlog, Fortune
 *  - the hole lets the gap between outer and middle panes equalise with the cabin, so the outer pane carries the pressure and the middle one is a backup
 *  - pressure at 35,000 ft: about 3.5 psi (NASA Glenn atmosphere model 23.9 kPa = 3.47 psi; Mental Floss 3.4 psi); cabin about 11 psi (Mental Floss; = 8,000 ft cabin altitude, FAA 14 CFR 25.841(a));
 *    difference 'about 8 psi' (Migflug) -> tagged TYPICAL on screen
 *  - moisture vent / anti-fog: secondary function (Fortune, Afar, ScienceAlert, Migflug) -> tagged 'COMMON EXPLANATION'
 *  - 'if the outer pane failed the middle one holds': ScienceAlert, Fortune, Migflug, Mental Floss
 * SIMPLIFIED (tagged on screen): pane spacing and hole size exaggerated, window drawn as a schematic, particles/arrows are illustrations. Pure functions of the frame.
 */

/** Global frames from public/projects/windowhole/vo.json. Keep in sync with soundtrack.py. */
export const T = { layers: 131, push: 203, outer: 390, hole: 440, fog: 613, end: 715, total: 900 };
export const CUTS = [0, 131, 203, 390, 440, 613, 715];
export const CUE = {
  defect: 3, safe: 94,
  outerTag: 140, midTag: 152, innerTag: 164,
  thin: 205, cabin: 256, push: 316, hard: 373,
  takes: 392,
  air: 442, equal: 520, spare: 589,
  fog: 615, clear: 672,
  fail: 717, holds: 765, know: 814,
};

const AM = K.amber, LN = K.line, DIM = K.lineDim, WH = K.text, MU = K.muted;
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fract = (x: number) => x - Math.floor(x);
const rnd = (a: number, b = 0) => fract(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) * 2 - 1; // -1..1, deterministic
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };

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
const Pill: React.FC<{ x: number; y: number; text: string; o?: number; color?: string; size?: number; solid?: boolean; pop?: number; strike?: boolean }> = ({ x, y, text, o = 1, color = AM, size = 28, solid, pop = 1, strike }) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.9, sc = 0.7 + 0.3 * pop;
  return (
    <g opacity={o} transform={`translate(${x} ${y}) scale(${sc})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? color : "rgba(6,20,42,0.94)"} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={size * 0.35} fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={solid ? K.bgDeep : color}>{text}</text>
      {strike && <line x1={-w / 2 + size} y1={0} x2={w / 2 - size} y2={0} stroke={color} strokeWidth={4} />}
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

/* ───────────────────────── geometry: the three panes ───────────────────────── */
const S = 230;                                   // px per model unit in the cross-section
const PX = { o: 340, m: 540, i: 740 };           // pane centres (screen x) in the cross-section; outside is LEFT, cabin is RIGHT
const CY = 1040, HH = 300;                       // window centre y and half-height (px) in the cross-section
const SW = 14;                                   // half thickness of a drawn slab (exaggerated)
const HOLE_Y = CY + 205, GAP_H = 9;              // bleed hole: low on the MIDDLE pane
const HW_U = 0.95, HH_U = HH / S;                // window half width / half height in model units
const zOf = (px: number) => (px - 540) / S;

/** rounded-rectangle outline (window shape) at depth z */
const rr = (hw: number, hh: number, r: number, z: number, n = 7): V3[] => {
  const pts: V3[] = [];
  const corners: [number, number, number][] = [[hw - r, hh - r, 0], [-hw + r, hh - r, 1], [-hw + r, -hh + r, 2], [hw - r, -hh + r, 3]];
  for (const [cx, cy, q] of corners) for (let k = 0; k <= n; k++) { const a = (q + k / n) * (Math.PI / 2); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); }
  return pts;
};

/** spacing 1 = the cross-section spacing; the hook explodes the stack wider */
const paneLines = (spacing: number, o: { mid: number; outer: number; inner: number; hole: number; frame: number }): WireLine[] => {
  const zo = zOf(PX.o) * spacing, zm = 0, zi = zOf(PX.i) * spacing;
  const t = SW / S;
  const lines: WireLine[] = [];
  const pane = (z: number, col: string, op: number, w: number, tag: V3) => {
    if (op <= 0.01) return;
    lines.push({ pts: rr(HW_U, HH_U, 0.55, z - t), closed: true, color: col, op, w, n: tag });
    lines.push({ pts: rr(HW_U, HH_U, 0.55, z + t), closed: true, color: col, op: op * 0.8, w, n: tag });
    for (const [x, y] of [[HW_U - 0.55 + 0.55 * Math.SQRT1_2, HH_U - 0.55 + 0.55 * Math.SQRT1_2], [-HW_U + 0.55 - 0.55 * Math.SQRT1_2, HH_U - 0.55 + 0.55 * Math.SQRT1_2], [-HW_U + 0.55 - 0.55 * Math.SQRT1_2, -HH_U + 0.55 - 0.55 * Math.SQRT1_2], [HW_U - 0.55 + 0.55 * Math.SQRT1_2, -HH_U + 0.55 - 0.55 * Math.SQRT1_2]])
      lines.push({ pts: [[x, y, z - t], [x, y, z + t]], color: col, op: op * 0.7, w: 0.8 });
  };
  pane(zo, LN, o.outer, 1.15, [0, 0, -1]);
  pane(zm, AM, o.mid, 1.15, [0, 0, 1]);
  pane(zi, MU, o.inner, 0.9, [0, 0, 1]);
  // window frame / seal around the outer pane
  if (o.frame > 0.01) {
    lines.push({ pts: rr(HW_U + 0.34, HH_U + 0.34, 0.8, zo - t - 0.05), closed: true, color: DIM, op: o.frame * 0.9, w: 0.9 });
    lines.push({ pts: rr(HW_U + 0.34, HH_U + 0.34, 0.8, zo + t + 0.05), closed: true, color: DIM, op: o.frame * 0.6, w: 0.8 });
  }
  // the bleed hole: a small ring on the middle pane
  if (o.hole > 0.01) {
    const hy = (CY - HOLE_Y) / S;
    lines.push({ pts: ring([0, hy, zm], 0.075, "z", 14), closed: true, color: "#FFE9B0", op: o.hole, w: 1.5 });
  }
  return lines;
};

/* camera: exploded + turning (hook) -> settles edge-on (cross-section) */
const SETTLE = 203;
const stackView = (g: number): WireView => {
  const t = io(g, [T.layers, SETTLE], [0, 1], easeInOut);
  const yaw = g < T.layers ? 0.5 + 0.0033 * g : lerp(0.5 + 0.0033 * T.layers, Math.PI / 2, t);
  return { yaw, pitch: lerp(0.17, 0, t), dist: 150, scale: lerp(238, S, t), cx: 540, cy: CY, pivot: [0, 0, 0] };
};
const spacingAt = (g: number) => lerp(1.32, 1, io(g, [T.layers, SETTLE], [0, 1], easeInOut));

/* ───────────────────────── 2D cross-section pieces ───────────────────────── */
/** slab (vertical bar) path with optional sideways bow (px, negative = toward outside/left) */
const slabD = (x: number, y0: number, y1: number, bow: number, sw = SW) => {
  const n = 14, L: string[] = [], R: string[] = [];
  for (let k = 0; k <= n; k++) {
    const y = y0 + ((y1 - y0) * k) / n, b = bow * Math.sin((Math.PI * k) / n);
    L.push(`${(x - sw + b).toFixed(1)} ${y.toFixed(1)}`); R.push(`${(x + sw + b).toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M ${L.join(" L ")} L ${R.reverse().join(" L ")} Z`;
};
const Slab: React.FC<{ x: number; col: string; bow?: number; fill?: number; glow?: number; gap?: boolean; sw?: number; o?: number; dash?: boolean }> = ({ x, col, bow = 0, fill = 0.16, glow = 0, gap, sw = SW, o = 1, dash }) => {
  const parts = gap
    ? [slabD(x, CY - HH, HOLE_Y - GAP_H, bow * 0.9, sw), slabD(x, HOLE_Y + GAP_H, CY + HH, bow * 0.5, sw)]
    : [slabD(x, CY - HH, CY + HH, bow, sw)];
  return (
    <g opacity={o}>
      {glow > 0.01 && <g style={{ filter: "blur(14px)" }}>{parts.map((d, i) => <path key={i} d={d} fill={col} opacity={glow * 0.8} stroke={col} strokeWidth={10} />)}</g>}
      {parts.map((d, i) => <path key={i} d={d} fill={col} fillOpacity={fill} stroke={col} strokeWidth={3} strokeLinejoin="round" strokeDasharray={dash ? "8 6" : undefined} />)}
    </g>
  );
};
/** arrow from x1 (tail) to x2 (tip); works in either direction */
const Arrow: React.FC<{ x1: number; x2: number; y: number; w: number; color: string; o?: number }> = ({ x1, x2, y, w, color, o = 1 }) => {
  const d = x2 < x1 ? 1 : -1;
  if (o <= 0.01 || Math.abs(x1 - x2) < w * 2.4) return null;
  const hl = w * 2.1, hw = w * 1.45;
  return (
    <g opacity={o} style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
      <line x1={x1} y1={y} x2={x2 + d * hl * 0.8} y2={y} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M ${x2} ${y} L ${x2 + d * hl} ${y - hw} L ${x2 + d * hl} ${y + hw} Z`} fill={color} />
    </g>
  );
};

/* ───────────────────────── the diagram (scenes 2-6) ───────────────────────── */
const ARROW_Y = [-95, -15, 65, 145].map((d) => CY + d);
const GAP = { x0: PX.o + SW + 14, x1: PX.m - SW - 14, y0: CY - HH + 18, y1: CY + HH - 18 };
const GAP_N = 24;
const gapPos = (k: number) => ({ x: lerp(GAP.x0, GAP.x1, (rnd(k, 11) + 1) / 2), y: lerp(GAP.y0, GAP.y1, (rnd(k, 12) + 1) / 2) });

const Diagram: React.FC<{ g: number }> = ({ g }) => {
  const o = io(g, [T.layers + 52, T.push + 6], [0, 1]);
  if (o <= 0.01) return null;
  // ── phase factors ──
  const loadP = io(g, [CUE.push, CUE.push + 14], [0, 1], easeOut);                       // pushed by the cabin
  const surge = io(g, [CUE.hard - 2, CUE.hard + 12], [0, 1]) * (1 - io(g, [T.outer, T.outer + 6], [0, 1]));
  const toOuter = io(g, [T.outer, T.outer + 16], [0, 1], easeOut);                         // arrows reach the outer pane
  const failP = io(g, [CUE.fail - 2, CUE.fail + 10], [0, 1]);
  const holdP = io(g, [CUE.holds - 2, CUE.holds + 12], [0, 1]);
  const equalP = io(g, [CUE.equal, CUE.equal + 14], [0, 1]);
  const bowOuter = -14 * loadP * (1 + 0.45 * surge) * (1 - failP);
  const bowMid = -12 * holdP * (failP > 0 ? 1 : 0) + 0;
  const pulse = 0.75 + 0.25 * Math.sin(g * 0.35);
  // ── arrows ──
  const arrowEnd = lerp(PX.i + SW + 22, PX.o + SW + 12, toOuter);                         // first reach the window, then the outer pane
  const endNow = failP > 0.5 ? lerp(PX.o + SW + 12, PX.m + SW + 12, holdP) : arrowEnd;
  const aw = 7 + 4 * loadP + 3 * surge;
  const arrowsOn = clamp01(loadP) * win(g, CUE.push, T.total + 40, 4, 8);
  const drift = (i: number) => 5 * Math.sin(g * 0.3 + i);
  // ── air dots ──
  const cabin = Array.from({ length: 64 }, (_, i) => {
    let x = lerp(572, 1008, (rnd(i, 1) + 1) / 2), y = lerp(CY - HH + 175, CY + HH + 20, (rnd(i, 2) + 1) / 2);
    if (Math.abs(x - PX.i) < SW + 16) x += x < PX.i ? -28 : 28;
    const jx = 7 * Math.sin(g * 0.11 + i * 1.7), jy = 7 * Math.cos(g * 0.13 + i * 2.3);
    const on = clamp01((g - (CUE.cabin + (i % 16) * 1.2)) / 8);
    return <circle key={i} cx={x + jx} cy={y + jy} r={5.5} fill="none" stroke="#8FD0FF" strokeWidth={2.4} opacity={0.88 * on} />;
  });
  const out = Array.from({ length: 9 }, (_, i) => {
    const x = lerp(78, 306, (rnd(i, 3) + 1) / 2), y = lerp(CY - HH + 175, CY + HH - 20, (rnd(i, 4) + 1) / 2);
    const on = clamp01((g - (CUE.thin + i * 1.6)) / 8);
    return <circle key={i} cx={x + 9 * Math.sin(g * 0.07 + i * 3)} cy={y + 9 * Math.cos(g * 0.08 + i)} r={5.5} fill="none" stroke="#8FD0FF" strokeWidth={2.4} opacity={0.8 * on} />;
  });
  // ── gap air (flows in through the hole) ──
  const gapDots: React.ReactNode[] = [];
  const dropDots: React.ReactNode[] = [];
  for (let k = 0; k < GAP_N; k++) {
    const t0 = CUE.air + k * 3.2, t = clamp01((g - t0) / 34);
    if (t <= 0) continue;
    const gp = gapPos(k);
    const hx = PX.m + SW + 6, hx2 = PX.m - SW - 4;
    const start = { x: 660 + 40 * rnd(k, 5), y: HOLE_Y + 28 * rnd(k, 6) };
    let x: number, y: number;
    if (t < 0.5) { const u = easeInOut(t / 0.5); x = lerp(start.x, hx, u); y = lerp(start.y, HOLE_Y, u); }
    else { const u = easeOut((t - 0.5) / 0.5); x = lerp(hx2, gp.x, u); y = lerp(HOLE_Y, gp.y, u); }
    x += (t >= 1 ? 6 * Math.sin(g * 0.1 + k * 2) : 0); y += (t >= 1 ? 6 * Math.cos(g * 0.12 + k) : 0);
    const isDrop = k % 2 === 0 && g >= CUE.fog;
    if (isDrop) {
      const te = clamp01((g - (CUE.fog + 6 + (k / 2) * 5)) / 46);
      if (te <= 0) { gapDots.push(<circle key={k} cx={x} cy={y} r={5.5} fill="none" stroke="#8FD0FF" strokeWidth={2.4} opacity={0.88} />); continue; }
      let dx: number, dy: number;
      if (te < 0.5) { const u = easeInOut(te / 0.5); dx = lerp(x, hx2, u); dy = lerp(y, HOLE_Y, u); }
      else { const u = (te - 0.5) / 0.5; dx = lerp(hx2, 700 + 40 * rnd(k, 8), u); dy = lerp(HOLE_Y, HOLE_Y + 34 * rnd(k, 9) + 30, u); }
      const fo = te < 0.5 ? 1 : 1 - clamp01((te - 0.75) / 0.25);
      dropDots.push(
        <g key={k} opacity={fo}>
          <path d={`M ${dx} ${dy - 12} Q ${dx + 8} ${dy + 2} ${dx} ${dy + 8} Q ${dx - 8} ${dy + 2} ${dx} ${dy - 12} Z`} fill={LN} fillOpacity={0.55} stroke={WH} strokeWidth={2} />
        </g>
      );
    } else {
      gapDots.push(<circle key={k} cx={x} cy={y} r={5.5} fill="none" stroke="#8FD0FF" strokeWidth={2.4} opacity={0.88} />);
    }
  }
  // fog patches on the outer pane (appear with 'moisture', clear as the drops leave)
  const fogP = io(g, [CUE.fog - 2, CUE.fog + 8], [0, 1]) * (1 - io(g, [CUE.fog + 30, CUE.clear + 18], [0, 1], easeInOut));
  const fogBlobs = fogP > 0.01 ? Array.from({ length: 9 }, (_, i) => (
    <ellipse key={i} cx={PX.o + SW + 12 + 8 * rnd(i, 7)} cy={CY - HH + 60 + i * 62} rx={20 + 14 * Math.abs(rnd(i, 6))} ry={34} fill={WH} opacity={0.34 * fogP} />
  )) : null;
  const dim = (c: string) => c;
  void dim;
  // ── crack on the outer pane ──
  const crackP = io(g, [CUE.fail - 2, CUE.fail + 12], [0, 1], easeOut);
  const crack = failP > 0.01 ? (() => {
    const pts: [number, number][] = [[PX.o - 4, CY - 240], [PX.o + 12, CY - 170], [PX.o - 10, CY - 100], [PX.o + 14, CY - 30], [PX.o - 12, CY + 40], [PX.o + 10, CY + 110], [PX.o - 6, CY + 190], [PX.o + 6, CY + 250]];
    const n = Math.floor(pts.length * crackP);
    const d = pts.slice(0, Math.max(2, n)).map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
    return <g><path d={d} stroke={K.red} strokeWidth={4.5} fill="none" strokeLinejoin="miter" style={{ filter: `drop-shadow(0 0 8px ${K.red})` }} />
      <path d={`M ${PX.o + 12} ${CY - 170} l 34 -22 M ${PX.o - 10} ${CY - 100} l -34 -14 M ${PX.o + 14} ${CY - 30} l 36 12 M ${PX.o - 12} ${CY + 40} l -36 20 M ${PX.o + 10} ${CY + 110} l 34 18`} stroke={K.red} strokeWidth={3} fill="none" opacity={crackP} /></g>;
  })() : null;

  const outerCol = failP > 0.3 ? K.red : LN;
  const outerGlow = Math.max(io(g, [T.outer, T.outer + 10], [0, 1]) * (1 - failP) * pulse * 0.55, 0);
  const midGlow = Math.max(io(g, [CUE.spare, CUE.spare + 10], [0, 1]) * (1 - failP) * pulse * 0.4, holdP * pulse * 0.7);
  const loadedMid = failP < 0.5 && g >= T.outer ? 0 : 1;
  void loadedMid;

  return (
    <g opacity={o}>
      {/* zone backgrounds */}
      <rect x={72} y={CY - HH - 6} width={224} height={2 * HH + 40} rx={10} fill={LN} opacity={0.05} stroke={DIM} strokeWidth={2} strokeDasharray="4 8" />
      <rect x={PX.m + SW + 22} y={CY - HH - 6} width={1008 - PX.m - SW - 6} height={2 * HH + 40} rx={10} fill={AM} opacity={0.045 * clamp01((g - CUE.cabin + 4) / 10)} stroke={DIM} strokeWidth={2} strokeDasharray="4 8" />
      {/* labelled zones + big readouts */}
      <g opacity={win(g, CUE.thin - 4, T.total + 40, 8, 8)}>
        {T_(184, CY - HH - 18, "OUTSIDE", { size: 24, c: LN, a: "middle", w: 700 })}
      </g>
      <g opacity={win(g, CUE.thin - 2, T.total + 40, 8, 8)}>
        <text x={184} y={CY - HH + 80} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={78} letterSpacing={-3} fill={LN}>3.5</text>
        {T_(184, CY - HH + 118, "PSI · THIN AIR", { size: 21, c: MU, a: "middle" })}
        {T_(184, CY - HH + 146, "AT 35,000 FT", { size: 19, c: MU, a: "middle", op: 0.9 })}
      </g>
      <g opacity={win(g, CUE.cabin - 4, T.total + 40, 8, 8)}>
        {T_(880, CY - HH - 18, "CABIN", { size: 24, c: AM, a: "middle", w: 700 })}
        <text x={880} y={CY - HH + 80} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={78} letterSpacing={-3} fill={AM}>11</text>
        {T_(880, CY - HH + 118, "PSI · PRESSURIZED", { size: 21, c: MU, a: "middle" })}
        {T_(880, CY - HH + 146, "TYPICAL · ABOUT", { size: 19, c: MU, a: "middle", op: 0.9 })}
      </g>
      {out}
      {cabin}
      {/* panes */}
      <Slab x={PX.o} col={outerCol} bow={bowOuter} fill={0.2 + 0.1 * outerGlow} glow={outerGlow} />
      <Slab x={PX.m} col={AM} bow={bowMid} fill={0.17} glow={midGlow} gap />
      <Slab x={PX.i} col={MU} fill={0.1} sw={9} />
      {crack}
      {/* fog + gap air */}
      <g style={{ filter: "blur(10px)" }}>{fogBlobs}</g>
      {gapDots}
      {dropDots}
      {/* hole marker */}
      <g opacity={win(g, CUE.air - 30, T.total + 40, 10, 8)}>
        <circle cx={PX.m} cy={HOLE_Y} r={20 + 3 * pulse} fill="none" stroke="#FFE9B0" strokeWidth={2.6} opacity={0.9} />
        <line x1={PX.m + 22} y1={HOLE_Y + 16} x2={PX.m + 150} y2={HOLE_Y + 78} stroke="#FFE9B0" strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />
        {T_(PX.m + 160, HOLE_Y + 92, "BLEED HOLE", { size: 22, c: "#FFE9B0", a: "start", w: 700 })}
      </g>
      {/* arrows: the cabin pushes outward */}
      {ARROW_Y.map((y, i) => (
        <Arrow key={i} x1={lerp(1004, 960, loadP)} x2={endNow + drift(i) * 0.4} y={y} w={aw} color={failP > 0.3 && holdP < 0.5 ? K.red : AM} o={arrowsOn * clamp01((g - (CUE.push + i * 2)) / 6) * (g >= T.hole && failP < 0.1 ? 0.5 : 0.92)} />
      ))}
      {/* the middle pane: equal push from both sides cancels (hole beat) */}
      <g opacity={equalP * (1 - io(g, [T.fog - 8, T.fog + 4], [0, 1])) * (failP > 0 ? 0 : 1)}>
        {[CY - 130, CY - 50, CY + 30, CY + 110].map((y, i) => (
          <g key={i}>
            <Arrow x1={PX.m + SW + 78} x2={PX.m + SW + 8} y={y} w={5} color={WH} o={0.95} />
            <Arrow x1={PX.m - SW - 78} x2={PX.m - SW - 8} y={y} w={5} color={WH} o={0.95} />
          </g>
        ))}
      </g>
      {/* pane tags above / roles below */}
      <g>
        {T_(PX.o, CY - HH - 52, "OUTER", { size: 25, c: outerCol, a: "middle", w: 700, op: io(g, [SETTLE - 6, SETTLE + 4], [0, 1]) })}
        {T_(PX.m, CY - HH - 52, "MIDDLE", { size: 25, c: AM, a: "middle", w: 700, op: io(g, [SETTLE - 6, SETTLE + 4], [0, 1]) })}
        {T_(PX.i, CY - HH - 52, "INNER", { size: 25, c: MU, a: "middle", w: 700, op: io(g, [SETTLE - 6, SETTLE + 4], [0, 1]) })}
        {T_(PX.o, CY + HH + 40, failP > 0.3 ? "FAILED" : g >= T.outer ? "TAKES THE LOAD" : "STRONG PANE", { size: 19, c: failP > 0.3 ? K.red : LN, a: "middle", w: 700, op: io(g, [SETTLE - 6, SETTLE + 4], [0, 1]) })}
        {T_(PX.m, CY + HH + 40, holdP > 0.5 ? "HOLDS THE LOAD" : g >= CUE.spare ? "THE SPARE" : g >= CUE.air ? "HAS THE HOLE" : "BACKUP PANE", { size: 19, c: AM, a: "middle", w: 700, op: io(g, [SETTLE - 6, SETTLE + 4], [0, 1]) })}
        {T_(PX.i, CY + HH + 40, "SCRATCH SHIELD", { size: 19, c: MU, a: "middle", w: 700, op: io(g, [SETTLE - 6, SETTLE + 4], [0, 1]) })}
      </g>
      {/* callout pills */}
      <Pill x={540} y={CY - 70} text="≈ 8 PSI PUSH" size={34} solid pop={ioB(g, CUE.push, CUE.push + 12)} o={win(g, CUE.push + 4, T.outer + 4, 6, 8)} />
      <Pill x={PX.m} y={CY - 215} text="NO NET PUSH" size={26} color={WH} solid pop={ioB(g, CUE.equal, CUE.equal + 12)} o={win(g, CUE.equal, CUE.spare + 2, 6, 8)} />
      <Pill x={PX.m} y={CY - 215} text="THE SPARE" size={28} color={AM} solid pop={ioB(g, CUE.spare, CUE.spare + 12)} o={win(g, CUE.spare, T.fog + 2, 6, 8)} />
      <Pill x={PX.m + 150} y={CY - 215} text="MOISTURE OUT" size={25} color={LN} solid pop={ioB(g, CUE.fog + 10, CUE.fog + 22)} o={win(g, CUE.fog + 8, CUE.clear - 2, 6, 6)} />
      <Pill x={PX.m} y={CY - 215} text="CLEAR VIEW" size={28} color={AM} solid pop={ioB(g, CUE.clear, CUE.clear + 12)} o={win(g, CUE.clear, T.end + 4, 6, 10)} />
      <Pill x={540} y={CY - 70} text="OUTER PANE FAILS" size={28} color={K.red} solid pop={ioB(g, CUE.fail, CUE.fail + 12)} o={win(g, CUE.fail, CUE.holds + 4, 4, 8)} />
      <Pill x={PX.i + 20} y={CY - 70} text="MIDDLE HOLDS" size={28} color={AM} solid pop={ioB(g, CUE.holds, CUE.holds + 12)} o={win(g, CUE.holds, T.total + 40, 4, 8)} />
    </g>
  );
};

/* ───────────────────────── the 3D wire stack (hook -> layers) ───────────────────────── */
const StackLayer: React.FC<{ g: number }> = ({ g }) => {
  const vis = 1 - io(g, [SETTLE + 6, SETTLE + 26], [0, 0.0]);                    // stays as edge-on outlines
  const o = { outer: 1, inner: 1, mid: 1 - io(g, [SETTLE - 14, SETTLE - 2], [0, 1]), hole: 1 - io(g, [SETTLE - 14, SETTLE - 2], [0, 1]), frame: 1 - io(g, [T.layers + 10, SETTLE - 20], [0, 1]) };
  const view = stackView(g);
  const lines = paneLines(spacingAt(g), o);
  const reveal = g < 40 ? 1 : 1;
  const hy = (CY - HOLE_Y) / S;
  const hp = project([0, hy, 0], view);
  const pulse = 0.7 + 0.3 * Math.sin(g * 0.3);
  const hookP = win(g, -10, T.layers + 14, 8, 14);
  return (
    <g opacity={vis}>
      <Wire3D lines={lines} view={view} width={2.8} glow={6} depthFade={0.4} widthFade={0.7} hiddenFade={0.55} reveal={reveal} />
      {/* hole highlight (hook) */}
      <g opacity={hookP}>
        <circle cx={hp.x} cy={hp.y} r={30 + 6 * pulse} fill="none" stroke="#FFE9B0" strokeWidth={3} opacity={0.9} />
        <circle cx={hp.x} cy={hp.y} r={52 + 10 * pulse} fill="none" stroke={AM} strokeWidth={2} opacity={0.4} />
        <circle cx={hp.x} cy={hp.y} r={7} fill="#FFE9B0" />
        <line x1={hp.x + 36} y1={hp.y + 14} x2={hp.x + 100} y2={hp.y + 20} stroke="#FFE9B0" strokeWidth={2.4} strokeDasharray="6 6" />
        {T_(hp.x + 108, hp.y + 30, "THE HOLE", { size: 28, c: "#FFE9B0", a: "start", w: 700 })}
      </g>
    </g>
  );
};

/* layer tags on the hook/layers rotation */
const LayerTags: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, CUE.outerTag - 4, SETTLE - 8, 6, 8);
  if (o <= 0.01) return null;
  const view = stackView(g), sp = spacingAt(g);
  const items: [string, number, string, number][] = [["OUTER PANE", zOf(PX.o) * sp, LN, CUE.outerTag], ["MIDDLE PANE", 0, AM, CUE.midTag], ["INNER PANE", zOf(PX.i) * sp, MU, CUE.innerTag]];
  return (
    <g opacity={o}>
      {items.map(([t, z, c, at], i) => {
        const p = project([0, HH_U + 0.05, z], view);
        const p2 = project([0, HH_U, z], view);
        void p2;
        const y = 706 + i * 0;
        return (
          <g key={i} opacity={clamp01((g - at) / 6)}>
            <line x1={p.x} y1={p.y} x2={p.x} y2={y + 22} stroke={c} strokeWidth={2} strokeDasharray="5 6" opacity={0.8} />
            <Pill x={p.x} y={y} text={t} size={20} color={c} solid pop={ioB(g, at, at + 10)} />
          </g>
        );
      })}
    </g>
  );
};

/* ───────────────────────── main shot ───────────────────────── */
export const WindowShot: React.FC = () => {
  const g = useCurrentFrame();
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={g} lines={["Why is there a", "tiny hole in", "*airplane windows?*"]} at={-30} exitAt={T.layers - 12} size={90} top={346} />
      <Headline f={g} lines={["Your window is", "*three layers*"]} at={T.layers + 3} exitAt={T.push - 8} size={100} />
      <Headline f={g} lines={["Cabin air pushes", "*outward, hard*"]} at={T.push + 3} exitAt={T.outer - 8} size={98} />
      <Headline f={g} lines={["The *outer layer*", "takes the push"]} at={T.outer + 3} exitAt={T.hole - 8} size={98} />
      <Headline f={g} lines={["The hole lets", "*air into the gap*"]} at={T.hole + 3} exitAt={T.fog - 8} size={98} />
      <Headline f={g} lines={["Moisture escapes,", "*no fog*"]} at={T.fog + 3} exitAt={T.end - 8} size={98} />
      <Headline f={g} lines={["Outer fails?", "*Middle holds.*"]} at={T.end + 3} exitAt={CUE.know - 8} size={104} />
      <Headline f={g} lines={["Tiny hole.", "*Big backup.*"]} at={CUE.know + 2} size={112} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <Diagram g={g} />
        <StackLayer g={g} />
        <LayerTags g={g} />
        {/* hook pills (frame 0 is already a finished hook) */}
        <g opacity={win(g, -10, T.layers + 4, 8, 10)}>
          <Pill x={230} y={1366} text="A DEFECT?" size={28} color={MU} strike pop={1} />
        </g>
        <g opacity={win(g, CUE.safe - 2, T.layers + 4, 4, 10)}>
          <Pill x={720} y={1366} text="KEEPING YOU SAFE" size={28} solid pop={ioB(g, CUE.safe, CUE.safe + 12)} />
        </g>
        <g opacity={io(g, [20, 36], [0, 1])}>{T_(540, 1584, "SIMPLIFIED SCHEMATIC · NOT TO SCALE · SIZES EXAGGERATED", { c: K.muted, a: "middle", size: 21 })}</g>
      </svg>

      <Panel o={pn(-10, T.layers + 2)} a="THE BLEED HOLE · BREATHER HOLE" b={<>Not a defect. A <Em>safety</Em> feature.</>} c="Tiny hole in the middle pane of the window" />
      <Panel o={pn(T.layers, T.push + 2)} a="THE WINDOW" b={<><Em>Three</Em> panes, not one</>} c="Outer · middle · inner (a scratch pane) · commonly described" />
      <Panel o={pn(T.push, CUE.cabin + 2)} a="STEP 1 · AT 35,000 FT" b={<>Outside: thin air, <Em>≈ 3.5 psi</Em></>} c="Standard-atmosphere value · NASA Glenn model" />
      <Panel o={pn(CUE.cabin, CUE.push + 2)} a="STEP 1 · INSIDE THE CABIN" b={<>Pressurized: <Em>≈ 11 psi</Em></>} c="Cabin altitude is capped at 8,000 ft · FAA 14 CFR 25.841" />
      <Panel o={pn(CUE.push, T.outer + 2)} a="STEP 2 · THE PUSH" b={<>About <Em>8 psi</Em> pushes the window out</>} c="Typical values · they vary by aircraft and flight" />
      <Panel o={pn(T.outer, T.hole + 2)} a="STEP 3 · THE OUTER PANE" b={<>The outer pane takes the <Em>load</Em></>} c="It is the strong, structural pane" />
      <Panel o={pn(T.hole, CUE.equal + 2)} a="STEP 4 · THE BLEED HOLE" b={<>Cabin air flows <Em>into the gap</Em></>} c="The hole is in the middle pane · tiny, exaggerated here" />
      <Panel o={pn(CUE.equal, T.fog + 2)} a="STEP 4 · THE BLEED HOLE" b={<>Middle pane feels <Em>no push</Em></>} c="Same pressure on both sides · it is the spare" />
      <Panel o={pn(T.fog, T.end + 2)} a="STEP 5 · MOISTURE" b={<>Damp air <Em>escapes</Em> · no fog</>} c="Secondary job · COMMON EXPLANATION · SIMPLIFIED" />
      <Panel o={pn(T.end, CUE.know + 2)} a="IF THE OUTER PANE EVER FAILED" b={<>The <Em>middle</Em> pane would hold</>} c="Fail-safe backup · common explanation" />
      <Panel o={pn(CUE.know, T.total + 20)} a="NOW YOU KNOW" b={<>Tiny hole, <Em>big backup</Em></>} c="The bleed (breather) hole · tell a friend" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 296, display: "flex", justifyContent: "center", fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>HOW IT WORKS · 18</div>
    <Headline f={200} lines={["Why is there a", "tiny hole in", "*airplane windows?*"]} at={0} size={100} top={346} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Frame />
      <StackLayer g={40} />
      <g><Pill x={230} y={1366} text="A DEFECT?" size={28} color={MU} strike /></g>
      <g><Pill x={720} y={1366} text="KEEPING YOU SAFE" size={28} solid /></g>
      {T_(540, 1584, "SIMPLIFIED SCHEMATIC · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}
    </svg>
  </>
);
void easeOut; void H;
