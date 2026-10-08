import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Defs, Gear, Headline, Label, Tag, clamp01, ioB, meshPhase, W, H, TAU } from "../gearbox/kit";
import { DEG, SLAB, faceRatio, pathOf, streamline, swingDeg, swingIndex, tiltAt } from "./flow";

/**
 * HOW IT WORKS #13 — Why the Tacoma Narrows bridge twisted apart      30 s · 1080×1920 · 30 fps · 900 frames
 *
 * PLAN — one idea per beat, the picture shows exactly what the voice says (VO phrases: public/projects/tacoma/vo.json)
 *   0   hook    "In 1940 ordinary wind tore a new bridge apart."  Side view of the bridge, wind streaks. 2,800 ft span (dimension line),
 *               opened Jul 1 → collapsed Nov 7 1940 (4 months), wind ≈ 40 mph.
 *   123 gertie  "It bounced in plain wind and was called Galloping Gertie."  The road rises/falls in two halves, several feet (drawn bigger).
 *   220 slab    "Its road was a solid slab, so wind hit it like a sail."  End-on slice of the road: 39 ft × 8 ft, then wind bends around it
 *               (potential-flow streamlines) + a sail icon.
 *   320 tilt    "Wind tilts the road, and a tilted road catches more."  Slab tilts; bracket = how much wall the wind sees grows; push arrow grows.
 *   420 loop    "So every swing grows bigger."  3-step cycle ring (wind tilts it → tilt catches more wind → tilts even more), swing counter + tilt readout.
 *   470 key     "Not just wind. The tilt made the wind push harder."  Two meters: wind alone = flat, wind + tilt = rising.
 *   576 hero    "An hour later, it broke apart."  Side view: 10:00 → 11:02 clock, the road twists, middle section drops, splash.
 *   640 tunnel  "Now engineers blow wind on tiny models."  Wind tunnel: big fan + tiny model (wobbling), flow lines.
 *   716 truss   "The new bridge has gaps, so wind slips through."  Open frame of triangles, flow lines pass through the gaps.
 *   799 end     Follow-for-more end card (same as #11/#12).
 * "Simplified" parts (tagged on screen): flow lines = textbook ideal flow around a thin ellipse (real wind also swirls behind the slab);
 * tilt/push numbers = a growth illustration (swing × ~1.15 per cycle), not measured data; the swing is shown sped up.
 * Everything is a pure function of the frame.
 */

/** Global frames from public/projects/tacoma/vo.json. Keep in sync with soundtrack.py. */
export const T = { gertie: 123, slab: 220, tilt: 320, loop: 420, key: 470, fail: 576, tunnel: 640, truss: 716, end: 799, total: 900 };
export const CUTS = [0, 123, 220, 320, 420, 470, 576, 640, 716, 799];
export const BREAK_FRAME = 610;   // frame the middle section lets go ("broke apart" starts at 608)
const BREAK = BREAK_FRAME;

const WIND = K.line, PUSH = K.amber, RED = K.red, GREEN = K.green;
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };
const pad2 = (n: number) => String(n).padStart(2, "0");

/* ───────────── shared bits (same look as #12) ───────────── */
const Panel: React.FC<{ o: number; children: React.ReactNode; h?: number }> = ({ o, children, h = 118 }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1424, height: h, opacity: o, borderRadius: 10, border: `2px solid ${K.lineDim}`, background: "rgba(3,11,24,0.78)", boxSizing: "border-box", padding: "14px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
    {children}
  </div>
);
const Row: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 30, color = K.muted }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 12, fontFamily: K.mono, fontSize: size, letterSpacing: size * 0.04, color, whiteSpace: "nowrap", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{children}</div>
);
const Hl: React.FC<{ c: string; children: React.ReactNode }> = ({ c, children }) => <span style={{ color: c, fontWeight: 700 }}>{children}</span>;

const Frame: React.FC = () => (
  <g>
    {[[VIEW.x0, VIEW.y0, 1, 1], [VIEW.x1, VIEW.y0, -1, 1], [VIEW.x0, VIEW.y1, 1, -1], [VIEW.x1, VIEW.y1, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={K.lineDim} strokeWidth={2.4} />
    ))}
    <rect x={VIEW.x0} y={VIEW.y0} width={VIEW.x1 - VIEW.x0} height={VIEW.y1 - VIEW.y0} fill="rgba(3,11,24,0.32)" stroke="rgba(92,211,255,0.10)" strokeWidth={1.5} />
    <clipPath id="vclip"><rect x={VIEW.x0} y={VIEW.y0} width={VIEW.x1 - VIEW.x0} height={VIEW.y1 - VIEW.y0} /></clipPath>
  </g>
);
const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 24} letterSpacing={o.ls ?? (o.size ?? 24) * 0.08} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);

/** Pill label inside an SVG (the engine Tag is HTML). */
const Pill: React.FC<{ x: number; y: number; text: string; p: number; c?: string; solid?: boolean; size?: number }> = ({ x, y, text, p, c = K.text, solid, size = 32 }) => {
  const w = text.length * size * 0.66 + size * 1.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * clamp01(p)})`} opacity={clamp01(p * 3)}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.9} rx={size * 0.95} fill={solid ? c : "rgba(6,20,42,0.9)"} stroke={c} strokeWidth={3} />
      <text y={size * 0.34} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.06} fill={solid ? K.bgDeep : c}>{text}</text>
    </g>
  );
};

/** Arrow pointing right whose HEAD is at (x, y). */
const Arrow: React.FC<{ x: number; y: number; len: number; w?: number; c?: string; o?: number; glow?: boolean }> = ({ x, y, len, w = 14, c = PUSH, o = 1, glow = true }) => {
  if (len < 4 || o <= 0.01) return null;
  const hl = w * 1.9, hw = w * 1.35;
  return (
    <g opacity={o} style={glow ? { filter: `drop-shadow(0 0 12px ${c}99)` } : undefined}>
      <line x1={x - len} y1={y} x2={x - hl * 0.6} y2={y} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <path d={`M ${x} ${y} L ${x - hl} ${y - hw} L ${x - hl} ${y + hw} Z`} fill={c} />
    </g>
  );
};

/** Moving wind: chevrons (>) sliding right along horizontal rows. */
const Streaks: React.FC<{ g: number; ys: number[]; x0?: number; x1?: number; o?: number; speed?: number; c?: string; sw?: number }> = ({ g, ys, x0 = VIEW.x0 + 6, x1 = VIEW.x1 - 6, o = 1, speed = 5, c = WIND, sw = 5 }) => {
  const span = x1 - x0, gap = 230;
  return (
    <g opacity={o}>
      {ys.map((y, i) => (
        <g key={i}>
          {Array.from({ length: Math.ceil(span / gap) + 1 }, (_, k) => {
            const x = x0 + ((((g * speed + k * gap + i * 71) % (span + gap)) + (span + gap)) % (span + gap)) - gap * 0.5;
            if (x < x0 + 20 || x > x1 - 30) return null;
            const e = Math.min(1, (x - x0) / 90, (x1 - x) / 90);
            return (
              <g key={k} opacity={0.75 * e}>
                <line x1={x - 56} y1={y} x2={x} y2={y} stroke={c} strokeWidth={sw} strokeLinecap="round" />
                <path d={`M ${x - 18} ${y - 14} L ${x} ${y} L ${x - 18} ${y + 14}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
};

/* ───────────── side-view bridge ───────────── */
const SB = { xl: 90, xr: 990, t1: 270, t2: 810, yd: 1100, yt: 790, yw: 1235 };
const cableY = (x: number) => SB.yt + (1005 - SB.yt) * (1 - ((x - 540) / 270) ** 2);
const uOf = (x: number) => (x - SB.t1) / (SB.t2 - SB.t1);
const HW = 100, KY = 0.09;

/** Road seen from the side as a ribbon. dy = vertical move of the centre line, phi = roll (twist) in radians. */
const Ribbon: React.FC<{ x0: number; x1: number; dy: (x: number) => number; phi: (x: number) => number; step?: number; o?: number }> = ({ x0, x1, dy, phi, step = 9, o = 1 }) => {
  const xs: number[] = [];
  for (let x = x0; x < x1; x += step) xs.push(x);
  xs.push(x1);
  const A = xs.map((x) => SB.yd + dy(x) - HW * Math.sin(phi(x)) - KY * HW * Math.cos(phi(x)));
  const B = xs.map((x) => SB.yd + dy(x) + HW * Math.sin(phi(x)) + KY * HW * Math.cos(phi(x)));
  return (
    <g opacity={o}>
      {xs.slice(0, -1).map((x, i) => {
        const p = phi((x + xs[i + 1]) / 2);
        const hot = clamp01(Math.abs(p) / 0.5);
        return <path key={i} d={`M ${x} ${A[i]} L ${xs[i + 1]} ${A[i + 1]} L ${xs[i + 1]} ${B[i + 1]} L ${x} ${B[i]} Z`} fill={p >= 0 ? WIND : PUSH} fillOpacity={0.14 + 0.3 * hot} stroke="none" />;
      })}
      <path d={xs.map((x, i) => `${i ? "L" : "M"} ${x} ${A[i]}`).join(" ")} fill="none" stroke={K.text} strokeWidth={4} strokeLinejoin="round" />
      <path d={xs.map((x, i) => `${i ? "L" : "M"} ${x} ${B[i]}`).join(" ")} fill="none" stroke={K.text} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

const Water: React.FC<{ g: number; o?: number }> = ({ g, o = 1 }) => (
  <g opacity={o}>
    {[0, 1, 2].map((k) => {
      const y = SB.yw + 22 + k * 30;
      const d = Array.from({ length: 49 }, (_, i) => { const x = VIEW.x0 + 6 + i * 19.6; return `${i ? "L" : "M"} ${x.toFixed(1)} ${(y + 4 * Math.sin(i * 0.7 + g * 0.09 + k * 2)).toFixed(1)}`; }).join(" ");
      return <path key={k} d={d} fill="none" stroke={K.lineDim} strokeWidth={2.4} opacity={0.75 - k * 0.2} />;
    })}
    <line x1={VIEW.x0 + 6} y1={SB.yw} x2={VIEW.x1 - 6} y2={SB.yw} stroke={K.lineDim} strokeWidth={2} strokeDasharray="14 10" opacity={0.7} />
  </g>
);

const Towers: React.FC = () => (
  <g>
    {[SB.t1, SB.t2].map((x) => (
      <g key={x}>
        <rect x={x - 15} y={SB.yt - 22} width={30} height={SB.yw + 84 - (SB.yt - 22)} fill={K.line} fillOpacity={0.07} stroke={K.line} strokeWidth={4} />
        {[0, 1, 2, 3].map((i) => <line key={i} x1={x - 15} y1={SB.yt + 20 + i * 90} x2={x + 15} y2={SB.yt + 20 + i * 90 + 50} stroke={K.lineDim} strokeWidth={2.4} />)}
        <circle cx={x} cy={SB.yt} r={11} fill={K.bgDeep} stroke={K.text} strokeWidth={4} />
      </g>
    ))}
  </g>
);

const Cables: React.FC<{ hangers?: (x: number) => number | null }> = ({ hangers }) => (
  <g>
    <path d={`M ${SB.xl} ${SB.yd - 8} Q ${(SB.xl + SB.t1) / 2} ${(SB.yd + SB.yt) / 2 + 36} ${SB.t1} ${SB.yt}`} fill="none" stroke={K.line} strokeWidth={3.4} />
    <path d={`M ${SB.t2} ${SB.yt} Q ${(SB.xr + SB.t2) / 2} ${(SB.yd + SB.yt) / 2 + 36} ${SB.xr} ${SB.yd - 8}`} fill="none" stroke={K.line} strokeWidth={3.4} />
    <path d={`M ${SB.t1} ${SB.yt} Q 540 ${2 * 1005 - SB.yt} ${SB.t2} ${SB.yt}`} fill="none" stroke={K.line} strokeWidth={4.4} />
    {hangers && Array.from({ length: 17 }, (_, k) => {
      const x = SB.t1 + 30 * (k + 1);
      const y = hangers(x);
      if (y === null) return null;
      return <line key={k} x1={x} y1={cableY(x)} x2={x} y2={y} stroke={K.lineDim} strokeWidth={2} />;
    })}
  </g>
);

/** The bridge in a given state. mode picks how the main span moves. */
const BridgeSide: React.FC<{ g: number; dy: (x: number) => number; phi: (x: number) => number }> = ({ g, dy, phi }) => (
  <g>
    <Water g={g} />
    <Cables hangers={(x) => SB.yd + dy(x) - HW * Math.sin(phi(x)) - KY * HW * Math.cos(phi(x))} />
    <Towers />
    <Ribbon x0={SB.xl} x1={SB.t1} dy={() => 0} phi={() => 0} />
    <Ribbon x0={SB.t2} x1={SB.xr} dy={() => 0} phi={() => 0} />
    <Ribbon x0={SB.t1} x1={SB.t2} dy={dy} phi={phi} />
  </g>
);

/* ───────────── scene 0: hook ───────────── */
const HookScene: React.FC<{ g: number }> = ({ g }) => {
  const sway = (x: number) => 3 * Math.sin(TAU * uOf(x)) * Math.sin(g * 0.12);
  const tease = io(g, [64, 112], [0, 1], easeInOut);            // the road starts to twist as the voice says "tore it apart"
  const twist = (x: number) => 0.34 * tease * Math.sin(TAU * uOf(x)) * Math.cos(g * 0.24);
  const tagO = 1, dimO = 1;
  return (
    <g>
      <Streaks g={g} ys={[800, 880, 960, 1040, 1180]} o={0.9} />
      <BridgeSide g={g} dy={sway} phi={twist} />
      {/* main-span dimension */}
      <g opacity={dimO}>
        <line x1={SB.t1} y1={724} x2={SB.t1} y2={760} stroke={K.muted} strokeWidth={2} />
        <line x1={SB.t2} y1={724} x2={SB.t2} y2={760} stroke={K.muted} strokeWidth={2} />
        <line x1={SB.t1 + 6} y1={742} x2={SB.t1 + 6 + (SB.t2 - SB.t1 - 12) * dimO} y2={742} stroke={K.muted} strokeWidth={2.4} />
        <rect x={540 - 190} y={712} width={380} height={44} rx={8} fill="rgba(3,11,24,0.92)" stroke={K.lineDim} strokeWidth={2} />
        {T_(540, 743, "MAIN SPAN  2,800 FT", { c: K.text, a: "middle", size: 26, w: 700 })}
      </g>
      <g transform={`translate(215 1358) scale(${0.6 + 0.4 * tagO})`} opacity={clamp01(tagO)}>
        <rect x={-150} y={-26} width={300} height={52} rx={26} fill={WIND} />
        <text y={10} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={28} fill={K.bgDeep}>WIND ≈ 40 MPH</text>
      </g>
      {T_(1000, 1370, "TACOMA NARROWS · USA", { c: K.muted, a: "end", size: 24 })}
    </g>
  );
};

/* ───────────── scene 1: Galloping Gertie ───────────── */
const GertieScene: React.FC<{ g: number }> = ({ g }) => {
  const a = g - T.gertie;
  const ramp = io(a, [4, 40], [0, 1], easeOut);
  const w = (TAU * a) / 40;
  const dy = (x: number) => 40 * ramp * Math.sin(TAU * uOf(x)) * Math.sin(w);
  const q1 = SB.t1 + (SB.t2 - SB.t1) * 0.25, q2 = SB.t1 + (SB.t2 - SB.t1) * 0.75;
  const tri = (x: number, up: boolean, o: number) => {
    const y = SB.yd + (up ? -112 : 112) , s = up ? -1 : 1;
    return <path d={`M ${x} ${y + s * 30} L ${x - 20} ${y} L ${x + 20} ${y} Z`} fill={PUSH} opacity={o} transform={`rotate(${up ? 0 : 180} ${x} ${y + s * 15})`} />;
  };
  const m1 = Math.sin(w) > 0.15, m2 = Math.sin(w) < -0.15;
  const ind = clamp01(a / 24);
  return (
    <g>
      <Streaks g={g} ys={[800, 880, 960, 1040, 1180]} o={0.55} />
      <BridgeSide g={g} dy={dy} phi={() => 0} />
      {/* rise / fall markers at the two halves (quarter points) */}
      <g opacity={ind}>
        {[q1, q2].map((x, i) => {
          const d = dy(x), up = d < 0;
          const y0 = SB.yd + d;
          return (
            <g key={i}>
              <line x1={x} y1={SB.yd - 130} x2={x} y2={SB.yd + 130} stroke={K.muted} strokeWidth={1.8} strokeDasharray="5 7" opacity={0.7} />
              <path d={up ? `M ${x} ${y0 - 36} L ${x - 15} ${y0 - 14} L ${x + 15} ${y0 - 14} Z` : `M ${x} ${y0 + 36} L ${x - 15} ${y0 + 14} L ${x + 15} ${y0 + 14} Z`} fill={PUSH} />
            </g>
          );
        })}
        {void m1 || void m2}
        {T_(q1, SB.yd + 176, "ONE HALF UP", { c: PUSH, a: "middle", size: 24, w: 700 })}
        {T_(q2, SB.yd + 176, "ONE HALF DOWN", { c: PUSH, a: "middle", size: 24, w: 700 })}
      </g>
    </g>
  );
};

/* ───────────── cross-section pieces ───────────── */
const CX = 540, CY = 960;

const Slab: React.FC<{ cx: number; cy: number; theta: number; a?: number; b?: number; draw?: number; o?: number; hot?: number }> = ({ cx, cy, theta, a = SLAB.a, b = SLAB.b, draw = 1, o = 1, hot = 0 }) => (
  <g transform={`translate(${cx} ${cy}) rotate(${(theta * 180) / Math.PI})`} opacity={o}>
    <rect x={-a} y={-b} width={2 * a} height={2 * b} rx={6} fill={WIND} fillOpacity={0.16 * clamp01(draw * 2 - 1)} stroke={hot > 0.5 ? PUSH : WIND} strokeWidth={5.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(draw)} />
    {Array.from({ length: 9 }, (_, i) => -a + 24 + i * ((2 * a - 48) / 8)).map((x, i) => (
      <line key={i} x1={x} y1={-b} x2={x} y2={-b - 14 * clamp01(draw * 2 - 1)} stroke={K.text} strokeWidth={3} opacity={0.8} />
    ))}
    <line x1={-a + 20} y1={0} x2={a - 20} y2={0} stroke={K.muted} strokeWidth={2} strokeDasharray="14 12" opacity={0.6 * clamp01(draw * 2 - 1)} />
  </g>
);

/** Flow lines around the slab (ideal flow around a thin ellipse). */
const Flow: React.FC<{ g: number; cx: number; cy: number; theta: number; px?: number; o?: number; ss?: number[]; clip?: boolean; sw?: number; speed?: number }> = ({
  g, cx, cy, theta, px = SLAB.a, o = 1, ss = [-1.25, -0.85, -0.55, -0.33, -0.15, 0.15, 0.33, 0.55, 0.85, 1.25], clip = true, sw = 4, speed = 6,
}) => (
  <g opacity={o} clipPath={clip ? "url(#vclip)" : undefined}>
    {ss.map((s, i) => (
      <path key={i} d={pathOf(streamline(s, theta, px), cx, cy)} fill="none" stroke={WIND} strokeWidth={sw} strokeLinecap="round" strokeDasharray="30 22" strokeDashoffset={-(g * speed + i * 11)} opacity={0.5 + 0.4 * (1 - Math.min(1, Math.abs(s) / 1.3))} />
    ))}
  </g>
);

/** Messy air behind a solid slab (simplified: a vortex pair). */
const Wake: React.FC<{ g: number; cx: number; cy: number; theta: number; o?: number }> = ({ g, cx, cy, theta, o = 1 }) => {
  const a = SLAB.a, b = SLAB.b;
  const ex = cx + (a + 62) * Math.cos(theta), ey = cy + (a + 62) * Math.sin(theta);
  return (
    <g opacity={o}>
      {[-1, 1].map((sgn) => {
        const vx = ex + sgn * 0 + 0, vy = ey + sgn * (b + 22);
        const rot = (sgn * g * 9) % 360;
        return (
          <g key={sgn} transform={`translate(${vx} ${vy}) rotate(${rot})`}>
            <circle r={34} fill="none" stroke={RED} strokeWidth={4} strokeDasharray="34 22" opacity={0.85} />
            <circle r={16} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="14 12" opacity={0.7} />
          </g>
        );
      })}
    </g>
  );
};

/* ───────────── scene 2: solid slab = sail ───────────── */
const SlabScene: React.FC<{ g: number }> = ({ g }) => {
  const a = g - T.slab;
  const draw = io(a, [2, 16], [0, 1], easeInOut);
  const dims = io(a, [18, 28], [0, 1]) * (1 - io(a, [44, 52], [0, 1]));
  const flow = io(g, [273, 292], [0, 1]);
  const sail = ioB(g, 290, 306);
  const push = io(g, [284, 306], [0, 1], easeOut);
  return (
    <g>
      <Defs />
      <Flow g={g} cx={CX} cy={CY} theta={0} o={flow} />
      <Wake g={g} cx={CX} cy={CY} theta={0} o={io(g, [292, 308], [0, 1])} />
      <Slab cx={CX} cy={CY} theta={0} draw={draw} />
      <Arrow x={CX - SLAB.a - 14} y={CY} len={78 * push} w={16} />
      {T_(VIEW.x0 + 36, CY - 262 + 0, "WIND →", { c: WIND, size: 28, w: 700, op: flow })}
      {/* dimensions */}
      <g opacity={dims}>
        <line x1={CX - SLAB.a} y1={CY + SLAB.b + 44} x2={CX + SLAB.a} y2={CY + SLAB.b + 44} stroke={K.muted} strokeWidth={2.4} markerStart="url(#arr)" markerEnd="url(#arr)" />
        {T_(CX, CY + SLAB.b + 88, "39 FT WIDE", { c: K.text, a: "middle", size: 28, w: 700 })}
        <line x1={CX + SLAB.a + 44} y1={CY - SLAB.b} x2={CX + SLAB.a + 44} y2={CY + SLAB.b} stroke={K.muted} strokeWidth={2.4} markerStart="url(#arr)" markerEnd="url(#arr)" />
        {T_(CX + SLAB.a + 62, CY + 9, "8 FT", { c: K.text, size: 28, w: 700 })}
      </g>
      {/* sail icon */}
      <g opacity={clamp01(sail)} transform={`translate(${VIEW.x0 + 56} 1236)`}>
        <path d="M 0 120 L 250 120 L 218 150 L 34 150 Z" fill={K.bgDeep} stroke={K.text} strokeWidth={4} strokeLinejoin="round" />
        <line x1={118} y1={118} x2={118} y2={-4} stroke={K.text} strokeWidth={5} />
        <path d={`M 126 4 Q ${216 + 14 * Math.sin(g * 0.25)} 56 190 108 L 126 108 Z`} fill={PUSH} fillOpacity={0.3} stroke={PUSH} strokeWidth={4.4} strokeLinejoin="round" />
        <Arrow x={-6} y={58} len={64} w={9} glow={false} />
      </g>
      {T_(VIEW.x0 + 340, 1334, "= A SAIL", { c: PUSH, size: 46, w: 700, ls: 1, op: clamp01(sail) })}
    </g>
  );
};

/* ───────────── scene 3: tilt catches more ───────────── */
const TiltScene: React.FC<{ g: number }> = ({ g }) => {
  const th = tiltAt(g, T.tilt);
  const P = faceRatio(th);
  const a = g - T.tilt;
  const bracketO = io(g, [362, 376], [0, 1]);
  const hP = 2 * SLAB.b * P;
  const bx = VIEW.x0 + 112;
  return (
    <g>
      <Defs />
      <Flow g={g} cx={CX} cy={CY} theta={th} o={0.9} />
      <Wake g={g} cx={CX} cy={CY} theta={th} o={clamp01(P - 1)} />
      <Slab cx={CX} cy={CY} theta={th} hot={bracketO} />
      <Arrow x={CX - SLAB.a - 14} y={CY} len={78 + 70 * (P - 1)} w={16 + 4 * (P - 1)} />
      {T_(VIEW.x0 + 36, CY - 262, "WIND →", { c: WIND, size: 28, w: 700 })}
      {/* how much wall the wind sees */}
      <g opacity={bracketO}>
        <line x1={bx - 26} y1={CY - hP / 2} x2={bx + 26} y2={CY - hP / 2} stroke={K.text} strokeWidth={3} />
        <line x1={bx - 26} y1={CY + hP / 2} x2={bx + 26} y2={CY + hP / 2} stroke={K.text} strokeWidth={3} />
        <line x1={bx} y1={CY - hP / 2} x2={bx} y2={CY + hP / 2} stroke={K.text} strokeWidth={3.4} markerStart="url(#arr)" markerEnd="url(#arr)" />
        <rect x={bx - 100} y={CY - hP / 2 - 84} width={200} height={66} rx={8} fill="rgba(3,11,24,0.94)" stroke={K.lineDim} strokeWidth={2} />
        {T_(bx, CY - hP / 2 - 54, "WALL THE", { c: K.text, a: "middle", size: 26, w: 700 })}
        {T_(bx, CY - hP / 2 - 26, "WIND SEES", { c: K.text, a: "middle", size: 26, w: 700 })}
      </g>
      <g opacity={io(g, [378, 392], [0, 1])}>
        <rect x={CX - 250} y={CY + 236} width={500} height={64} rx={32} fill={PUSH} />
        {T_(CX, CY + 278, "BIGGER WALL = MORE PUSH", { c: K.bgDeep, a: "middle", size: 28, w: 700, ls: 1 })}
      </g>
      {void a}
    </g>
  );
};

/* ───────────── scene 4: the loop ───────────── */
const RING = { cx: 540, cy: 960 };
const NODES = [
  { x: 540, y: 730, w: 370, t1: "1  WIND TILTS IT", t2: "" },
  { x: 800, y: 1160, w: 340, t1: "2  TILT CATCHES", t2: "MORE WIND" },
  { x: 280, y: 1160, w: 340, t1: "3  SO IT TILTS", t2: "EVEN MORE" },
];
// curved arrows between the pills: [start, control, end]
const ARCS: [number, number, number, number, number, number][] = [
  [734, 740, 910, 760, 826, 1100],
  [618, 1160, 540, 1160, 454, 1160],
  [250, 1100, 150, 760, 350, 732],
];
const LoopScene: React.FC<{ g: number }> = ({ g }) => {
  const th = tiltAt(g, T.tilt);
  const a = g - T.loop;
  const act = Math.floor(clamp01(a / 48) * 3 - 0.001);   // which node is lit (0,1,2)
  const deg = swingDeg(g), n = Math.max(1, swingIndex(g));
  return (
    <g>
      <Defs />
      <Flow g={g} cx={RING.cx} cy={RING.cy} theta={th} o={0.28} ss={[-1.25, -0.7, -0.33, 0.33, 0.7, 1.25]} />
      <Slab cx={RING.cx} cy={RING.cy} theta={th} />
      {ARCS.map(([x0, y0, cx, cy, x1, y1], i) => {
        const on = io(a, [4 + i * 8, 14 + i * 8], [0, 1]);
        const lit = act === i;
        const ang = Math.atan2(y1 - cy, x1 - cx);
        const col = lit ? PUSH : K.lineDim;
        return (
          <g key={i} opacity={on}>
            <path d={`M ${x0} ${y0} Q ${cx} ${cy} ${x1 - 18 * Math.cos(ang)} ${y1 - 18 * Math.sin(ang)}`} fill="none" stroke={col} strokeWidth={lit ? 8 : 5} strokeLinecap="round" strokeDasharray={lit ? "18 12" : "none"} strokeDashoffset={-g * 3} />
            <path d={`M ${x1} ${y1} L ${x1 - 28 * Math.cos(ang - 0.45)} ${y1 - 28 * Math.sin(ang - 0.45)} L ${x1 - 28 * Math.cos(ang + 0.45)} ${y1 - 28 * Math.sin(ang + 0.45)} Z`} fill={col} />
          </g>
        );
      })}
      {NODES.map((nd, i) => {
        const o = ioB(a, 2 + i * 8, 14 + i * 8);
        const lit = act === i;
        return (
          <g key={i} transform={`translate(${nd.x} ${nd.y}) scale(${0.7 + 0.3 * o})`} opacity={clamp01(o)}>
            <rect x={-nd.w / 2} y={nd.t2 ? -52 : -36} width={nd.w} height={nd.t2 ? 104 : 72} rx={nd.t2 ? 20 : 36} fill={lit ? PUSH : "rgba(6,20,42,0.94)"} stroke={PUSH} strokeWidth={3} />
            {nd.t2 ? (
              <g>{T_(0, -8, nd.t1, { c: lit ? K.bgDeep : K.text, a: "middle", size: 30, w: 700, ls: 1 })}{T_(0, 32, nd.t2, { c: lit ? K.bgDeep : PUSH, a: "middle", size: 30, w: 700, ls: 1 })}</g>
            ) : T_(0, 11, nd.t1, { c: lit ? K.bgDeep : K.text, a: "middle", size: 30, w: 700, ls: 1 })}
          </g>
        );
      })}
      {/* readouts */}
      <g opacity={io(a, [6, 18], [0, 1])}>
        {T_(VIEW.x0 + 40, 1346, `SWING ${n}`, { c: K.text, size: 44, w: 700, ls: 0 })}
        {T_(VIEW.x1 - 40, 1346, `TILT ${Math.round(deg)}°`, { c: PUSH, a: "end", size: 44, w: 700, ls: 0 })}
      </g>
    </g>
  );
};

/* ───────────── scene 5: wind alone vs wind + tilt ───────────── */
const KeyScene: React.FC<{ g: number }> = ({ g }) => {
  const th = tiltAt(g, T.tilt);
  const cy = 850;
  const P = faceRatio(th);
  const env = faceRatio(swingDeg(g) * DEG);
  const a = g - T.key;
  const alone = io(a, [4, 18], [0, 1]);
  const tiltO = io(g, [518, 534], [0, 1]);
  const v2 = clamp01(env / 4.2) * io(g, [520, 548], [0, 1], easeOut);
  const bar = (y: number, v: number, label: string, value: string, c: string, o: number) => (
    <g opacity={o}>
      {T_(100, y, label, { c: K.muted, size: 28, w: 700 })}
      {T_(980, y, value, { c, a: "end", size: 36, w: 700, ls: 0 })}
      <rect x={100} y={y + 16} width={880} height={36} rx={5} fill="rgba(3,11,24,0.6)" stroke={K.lineDim} strokeWidth={2.4} />
      <rect x={105} y={y + 21} width={Math.max(0, 870 * v)} height={26} rx={3} fill={c} fillOpacity={0.9} style={{ filter: `drop-shadow(0 0 10px ${c}88)` }} />
    </g>
  );
  return (
    <g>
      <Defs />
      <Flow g={g} cx={CX} cy={cy} theta={th} o={0.42} ss={[-1.45, -0.95, -0.55, 0.55, 0.95, 1.45]} />
      <Slab cx={CX} cy={cy} theta={th} />
      {/* push on the road */}
      <Arrow x={CX - SLAB.a - 14} y={cy} len={78} w={16} c={WIND} o={alone} glow={false} />
      <g opacity={tiltO}><Arrow x={CX - SLAB.a - 14} y={cy} len={Math.min(250, 78 + 52 * (P - 1))} w={16 + 3 * Math.min(3, P - 1)} /></g>
      {bar(1060, 1 / 4.2, "WIND ALONE", "× 1", WIND, alone)}
      {bar(1190, v2, "WIND + TILT", `× ${(env).toFixed(1)}`, PUSH, tiltO)}
      <g opacity={tiltO}>{T_(540, 1330, "PUSH KEEPS GROWING", { c: K.text, a: "middle", size: 30, w: 700 })}</g>
    </g>
  );
};

/* ───────────── scene 6: the failure ───────────── */
const FailScene: React.FC<{ g: number }> = ({ g }) => {
  const a = g - T.fail, tb = g - BREAK;
  const U0 = 0.34, U1 = 0.66;
  const xa = SB.t1 + (SB.t2 - SB.t1) * U0, xb = SB.t1 + (SB.t2 - SB.t1) * U1;
  const Phi = 0.16 + 0.62 * io(g, [T.fail, BREAK], [0, 1], (t) => t * t);
  const osc = Math.cos((TAU * a) / 26);
  const after = tb > 0 ? Math.exp(-tb / 6) : 1;
  const phiOf = (x: number) => Phi * after * Math.sin(TAU * uOf(x)) * osc;
  const sagE = tb > 0 ? io(tb, [0, 16], [0, 1], easeOut) : 0;
  const sagL = (x: number) => 150 * sagE * ((x - SB.t1) / (xa - SB.t1)) ** 2;
  const sagR = (x: number) => 150 * sagE * ((SB.t2 - x) / (SB.t2 - xb)) ** 2;
  const tm = Math.max(0, tb);
  const fall = Math.min(0.75 * tm * tm, 128 + 3 * Math.max(0, tm - 13));
  const rot = 0.6 * Math.min(1, tm / 16) ** 1.5;
  const fragO = 1 - io(tm, [18, 28], [0, 1]);
  const min = Math.round(62 * io(g, [T.fail + 4, BREAK - 2], [0, 1], easeInOut));
  const clock = `${10 + Math.floor(min / 60)}:${pad2(min % 60)} AM`;
  const split = tb > 0;
  const hang = (x: number): number | null => {
    if (x > xa && x < xb) return split ? null : SB.yd - HW * Math.sin(phiOf(x)) - KY * HW * Math.cos(phiOf(x));
    const d = x <= xa ? sagL(x) : sagR(x);
    return SB.yd + d - HW * Math.sin(phiOf(x)) - KY * HW * Math.cos(phiOf(x));
  };
  const splash = tm - 13;
  return (
    <g>
      <Streaks g={g} ys={[800, 880, 960, 1040, 1180]} o={0.7} speed={11} />
      <Water g={g} />
      <Cables hangers={(x) => hang(x)} />
      <Towers />
      <Ribbon x0={SB.xl} x1={SB.t1} dy={() => 0} phi={() => 0} />
      <Ribbon x0={SB.t2} x1={SB.xr} dy={() => 0} phi={() => 0} />
      {!split && <Ribbon x0={SB.t1} x1={SB.t2} dy={() => 0} phi={phiOf} step={7} />}
      {split && (
        <g>
          <Ribbon x0={SB.t1} x1={xa} dy={sagL} phi={phiOf} step={7} />
          <Ribbon x0={xb} x1={SB.t2} dy={sagR} phi={phiOf} step={7} />
          <g transform={`translate(0 ${fall}) rotate(${(rot * 180) / Math.PI} 540 ${SB.yd})`} opacity={fragO}>
            <Ribbon x0={xa} x1={xb} dy={() => 0} phi={() => 0.18 * after} step={7} />
          </g>
        </g>
      )}
      {splash > 0 && [0, 7, 14].map((d, i) => {
        const p = clamp01((splash - d) / 30);
        return p > 0 && p < 1 ? <ellipse key={i} cx={540 + (i - 1) * 16} cy={SB.yw + 6} rx={14 + 150 * p} ry={4 + 20 * p} fill="none" stroke={K.text} strokeWidth={4 - 2 * p} opacity={0.9 * (1 - p)} /> : null;
      })}
      {/* clock */}
      <g>
        <rect x={540 - 190} y={704} width={380} height={142} rx={12} fill="rgba(3,11,24,0.9)" stroke={tb > 0 ? RED : K.lineDim} strokeWidth={2.4} />
        {T_(540, 738, "NOV 7, 1940", { c: K.muted, a: "middle", size: 26, w: 700 })}
        {T_(540, 800, clock, { c: tb > 0 ? RED : PUSH, a: "middle", size: 62, w: 700, ls: 0 })}
        {T_(540, 834, tb > 0 ? "A SECTION FALLS" : "TWISTING", { c: tb > 0 ? RED : K.muted, a: "middle", size: 24, w: 700 })}
      </g>
      {/* the same tilt, seen end-on */}
      <g>
        <Slab cx={915} cy={772} theta={Phi * after * osc * 1.1} a={70} b={14.4} />
        {T_(915, 850, "END VIEW", { c: K.muted, a: "middle", size: 20, w: 700 })}
      </g>
    </g>
  );
};

/* ───────────── scene 7: wind tunnel ───────────── */
const TunnelScene: React.FC<{ g: number }> = ({ g }) => {
  const a = g - T.tunnel;
  const x0 = 100, x1 = 980, y0 = 770, y1 = 1130;
  const draw = io(a, [2, 22], [0, 1], easeInOut);
  const spin = a * 0.3;
  const mx = 650, my = 950;
  const th = 0.3 * Math.sin(a * 0.34) * io(a, [20, 40], [0, 1]);
  const f1 = ioB(a, 22, 36), f2 = ioB(a, 38, 52);
  const lines = [830, 876, 1024, 1070];
  return (
    <g>
      <Defs />
      {/* tube */}
      <g opacity={draw}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={46} fill="rgba(3,11,24,0.55)" stroke={K.line} strokeWidth={5} />
        <rect x={x0 + 14} y={y0 + 14} width={x1 - x0 - 28} height={y1 - y0 - 28} rx={34} fill="none" stroke={K.lineDim} strokeWidth={1.8} strokeDasharray="10 9" />
      </g>
      <g clipPath="url(#vclip)" opacity={draw}>
        <g clipPath="url(#tube)">
          {lines.map((y, i) => <line key={i} x1={x0 + 130} y1={y} x2={x1 - 12} y2={y} stroke={WIND} strokeWidth={4} strokeLinecap="round" strokeDasharray="34 26" strokeDashoffset={-(g * 10 + i * 19)} opacity={0.7} />)}
          {[-1.8, -1.2, -0.7, -0.4, 0.4, 0.7, 1.2, 1.8].map((s, i) => (
            <path key={i} d={pathOf(streamline(s * 0.6, th, 66, 120, 0.09).filter((p) => p[0] > -520), mx, my)} fill="none" stroke={WIND} strokeWidth={4} strokeLinecap="round" strokeDasharray="30 22" strokeDashoffset={-(g * 9 + i * 13)} opacity={0.7} />
          ))}
        </g>
      </g>
      <clipPath id="tube"><rect x={x0 + 8} y={y0 + 8} width={x1 - x0 - 16} height={y1 - y0 - 16} rx={40} /></clipPath>
      {/* fan */}
      <g transform={`translate(215 950)`} opacity={draw}>
        <circle r={86} fill={K.bgDeep} stroke={K.text} strokeWidth={5} />
        <g transform={`rotate(${(spin * 180) / Math.PI})`}>
          {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={0} cy={-46} rx={17} ry={42} fill={WIND} fillOpacity={0.5} stroke={WIND} strokeWidth={3.4} transform={`rotate(${i * 90})`} />)}
        </g>
        <circle r={13} fill={K.text} />
      </g>
      {/* model on a stand */}
      <g opacity={draw}>
        <line x1={mx} y1={my + 30} x2={mx} y2={y1 - 6} stroke={K.text} strokeWidth={5} />
        <line x1={mx - 40} y1={y1 - 6} x2={mx + 40} y2={y1 - 6} stroke={K.text} strokeWidth={5} strokeLinecap="round" />
        <Slab cx={mx} cy={my} theta={th} a={66} b={13.5} />
      </g>
      <Arrow x={x0 + 340} y={950} len={90} w={12} c={WIND} o={io(a, [20, 32], [0, 1])} glow={false} />
      {/* labels */}
      <g opacity={clamp01(f1)}>
        <line x1={215} y1={1040} x2={215} y2={1196} stroke={K.text} strokeWidth={2.4} />
        <Pill x={215} y={1236} text="BIG FAN" p={f1} c={K.text} />
      </g>
      <g opacity={clamp01(f2)}>
        <line x1={mx} y1={1130} x2={mx} y2={1196} stroke={PUSH} strokeWidth={2.4} />
        <Pill x={mx} y={1236} text="TINY MODEL" p={f2} c={PUSH} solid />
      </g>
      {T_(540, 1340, "TEST FIRST.  BUILD LATER.", { c: K.text, a: "middle", size: 34, w: 700, op: io(a, [50, 64], [0, 1]) })}
    </g>
  );
};

/* ───────────── scene 8: the open truss ───────────── */
const TrussScene: React.FC<{ g: number }> = ({ g }) => {
  const a = g - T.truss;
  const cy = 950, hw = 250, hh = 130;
  const draw = io(a, [2, 26], [0, 1], easeInOut);
  const top = Array.from({ length: 5 }, (_, i) => -hw + i * (hw / 2));
  const bot = Array.from({ length: 4 }, (_, i) => -hw + hw / 4 + i * (hw / 2));
  const zig: [number, number][] = [];
  for (let i = 0; i < 4; i++) { zig.push([top[i], -hh], [bot[i], hh]); }
  zig.push([top[4], -hh]);
  const members = zig.slice(0, -1).map((p, i) => [p, zig[i + 1]] as [[number, number], [number, number]]);
  const ys = [-185, -100, -50, 0, 50, 100, 260];
  const flow = io(a, [14, 30], [0, 1]);
  const gapO = ioB(a, 36, 50);
  const check = ioB(a, 56, 72);
  const pushO = ioB(a, 52, 66);
  return (
    <g>
      <Defs />
      <g clipPath="url(#vclip)" opacity={flow}>
        {ys.map((y0, i) => {
          const d = Array.from({ length: 61 }, (_, k) => {
            const x = VIEW.x0 + (k * (VIEW.x1 - VIEW.x0)) / 60;
            const bump = Math.exp(-(((x - CX) / 230) ** 2));
            return `${k ? "L" : "M"} ${x.toFixed(1)} ${(cy + y0 + 6 * bump * Math.sin(x * 0.05 + i * 1.7)).toFixed(1)}`;
          }).join(" ");
          return <path key={i} d={d} fill="none" stroke={WIND} strokeWidth={4} strokeLinecap="round" strokeDasharray="34 24" strokeDashoffset={-(g * 7 + i * 17)} opacity={0.85} />;
        })}
      </g>
      <g transform={`translate(${CX} ${cy})`} opacity={draw}>
        <rect x={-hw - 20} y={-hh - 26} width={2 * hw + 40} height={16} rx={3} fill={K.text} fillOpacity={0.5} stroke={K.text} strokeWidth={3} />
        {[[-hw, -hh, hw, -hh], [-hw, hh, hw, hh], [-hw, -hh, -hw, hh], [hw, -hh, hw, hh]].map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={K.line} strokeWidth={10} strokeLinecap="round" />)}
        {members.map(([p, q], i) => <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={K.line} strokeWidth={8} strokeLinecap="round" />)}
        {[...top.map((x) => [x, -hh]), ...bot.map((x) => [x, hh])].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={10} fill={K.bgDeep} stroke={K.text} strokeWidth={3.4} />)}
      </g>
      {/* the gaps */}
      <g opacity={clamp01(gapO)}>
        {[[-hw / 2, hh / 3], [hw / 4, -hh / 3]].map(([x, y], i) => (
          <circle key={i} cx={CX + x} cy={cy + y} r={42 + 3 * Math.sin(g * 0.3 + i)} fill="none" stroke={GREEN} strokeWidth={5} strokeDasharray="10 9" />
        ))}
        <Pill x={CX} y={cy + 196} text="GAPS" p={gapO} c={GREEN} solid />
      </g>
      <g opacity={clamp01(pushO)}>
        <Arrow x={VIEW.x0 + 150} y={1330} len={34} w={8} glow={false} />
        {T_(VIEW.x0 + 180, 1340, "TINY PUSH", { c: PUSH, size: 34, w: 700 })}
      </g>
      <g transform={`translate(880 760) scale(${0.5 + 0.5 * check})`} opacity={clamp01(check)}>
        <circle r={52} fill={GREEN} fillOpacity={0.18} stroke={GREEN} strokeWidth={5} />
        <path d="M -24 2 L -6 22 L 28 -20" fill="none" stroke={GREEN} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {T_(VIEW.x0 + 36, 722, "WIND →", { c: WIND, size: 28, w: 700 })}
    </g>
  );
};

/* ───────────── composition of the shot ───────────── */
export const TacomaShot: React.FC = () => {
  const g = useCurrentFrame();
  const sHook = win(g, -40, T.gertie + 4, 1, 10), sG = win(g, T.gertie - 4, T.slab + 4), sS = win(g, T.slab - 4, T.tilt + 4), sT = win(g, T.tilt - 4, T.loop + 4),
    sL = win(g, T.loop - 4, T.key + 4), sK = win(g, T.key - 4, T.fail + 4), sF = win(g, T.fail - 4, T.tunnel + 4), sTu = win(g, T.tunnel - 4, T.truss + 4),
    sTr = win(g, T.truss - 4, T.end + 4, 8, 10);
  const fade = io(g, [T.end - 6, T.end + 2], [0, 1]);
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Headline f={g} lines={["Plain *wind.*", "New *bridge.*"]} at={-30} exitAt={114} size={104} />
      <Headline f={g} lines={["*Galloping*", "Gertie"]} at={T.gertie + 3} exitAt={T.slab - 8} size={112} />
      <Headline f={g} lines={["A solid *slab*", "= a *sail*"]} at={T.slab + 3} exitAt={T.tilt - 8} size={100} />
      <Headline f={g} lines={["Tilted: catches", "*more* wind"]} at={T.tilt + 3} exitAt={T.loop - 8} size={100} />
      <Headline f={g} lines={["Every swing", "grows *bigger*"]} at={T.loop + 2} exitAt={T.key - 4} size={100} />
      <Headline f={g} lines={["Not just *wind*"]} at={T.key + 3} exitAt={T.key + 44} size={108} />
      <Headline f={g} lines={["The *tilt* adds push"]} at={T.key + 50} exitAt={T.fail - 8} size={94} />
      <Headline f={g} lines={["An hour later:", "*broke* apart"]} at={T.fail + 3} exitAt={T.tunnel - 8} size={104} accent={RED} />
      <Headline f={g} lines={["Test tiny *models*", "in real wind"]} at={T.tunnel + 3} exitAt={T.truss - 8} size={96} />
      <Headline f={g} lines={["Open *gaps*:", "wind slips through"]} at={T.truss + 3} exitAt={T.end - 10} size={96} accent={GREEN} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <g opacity={sHook}><HookScene g={g} /></g>
        <g opacity={sG}><GertieScene g={g} /></g>
        <g opacity={sS}><SlabScene g={g} /></g>
        <g opacity={sT}><TiltScene g={g} /></g>
        <g opacity={sL}><LoopScene g={g} /></g>
        <g opacity={sK}><KeyScene g={g} /></g>
        <g opacity={sF}><FailScene g={g} /></g>
        <g opacity={sTu}><TunnelScene g={g} /></g>
        <g opacity={sTr}><TrussScene g={g} /></g>
      </svg>

      <Panel o={pn(-40, T.gertie)} h={118}>
        <Row size={26}><Hl c={PUSH}>OPENED JUL 1, 1940</Hl><span>→</span><Hl c={RED}>COLLAPSED NOV 7, 1940</Hl></Row>
        <Row size={23}><span>4 MONTHS · WIND ≈ 40 MPH (64 km/h)</span></Row>
      </Panel>
      <Panel o={pn(T.gertie, T.slab)} h={118}>
        <Row size={26}><span>THE ROAD </span><Hl c={PUSH}>ROSE &amp; FELL</Hl><span>IN PLAIN WIND</span></Row>
        <Row size={22}><span>SEVERAL FEET · DRAWN BIGGER</span></Row>
      </Panel>
      <Panel o={pn(T.slab, T.tilt)} h={118}>
        <Row size={27}><Hl c={WIND}>SOLID</Hl><span>ROAD · 8 FT DEEP × 39 FT WIDE</span></Row>
        <Row size={22}><span>(2.4 m × 12 m) · FLOW LINES SIMPLIFIED</span></Row>
      </Panel>
      <Panel o={pn(T.tilt, T.loop)} h={92}>
        <Row size={25}><span>WIND TILTS IT → </span><Hl c={PUSH}>BIGGER WALL</Hl></Row>
      </Panel>
      <Panel o={pn(T.loop, T.key)} h={92}>
        <Row size={24}><span>SPED UP · </span><Hl c={PUSH}>SIMPLIFIED MODEL</Hl><span>· NOT REAL DATA</span></Row>
      </Panel>
      <Panel o={pn(T.key, T.fail)} h={118}>
        <Row size={26}><Hl c={WIND}>WIND ALONE:</Hl><span>SAME PUSH</span><Hl c={PUSH}>+ TILT:</Hl><span>MORE</span></Row>
        <Row size={22}><span>SIMPLIFIED MODEL · NOT REAL DATA</span></Row>
      </Panel>
      <Panel o={pn(T.fail, T.tunnel)} h={118}>
        <Row size={26}><span>ONE SWING ≈ </span><Hl c={PUSH}>5 SECONDS</Hl><span>· SHOWN SPED UP</span></Row>
        <Row size={22}><span>ABOUT AN HOUR OF TWISTING</span></Row>
      </Panel>
      <Panel o={pn(T.tunnel, T.truss)} h={92}>
        <Row size={25}><Hl c={WIND}>WIND TUNNEL</Hl><span>= BIG FAN + SMALL MODEL</span></Row>
      </Panel>
      <Panel o={pn(T.truss, T.end + 6)} h={118}>
        <Row size={25}><span>NEW BRIDGE (1950): </span><Hl c={GREEN}>OPEN FRAME</Hl></Row>
        <Row size={22}><span>BUILT FROM TRIANGLES · SEE EP. 04</span></Row>
      </Panel>
    </div>
  );
};

/* ────────── end card (same as #10/#11/#12) ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const m_ = 18, cd = (m_ * 23) / 2, cx = 540 - cd * 0.17, cy = 1085 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={f} lines={["Follow for", "*more*"]} at={2} top={380} size={118} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1020px", opacity: clamp01(p) }}>
        <Gear N={14} m={m_} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
        <Gear N={9} m={m_} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
        <Gear N={9} m={m_} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
      </div>
      <Tag f={f} at={8} text="FOLLOW  +" x={540} y={1330} color={PUSH} solid size={32} />
      <Label f={f} at={64} text="AKS PRODUCTIONS" x={540} y={1410} size={30} align="center" color={K.text} />
      <Label f={f} at={78} text="HOW IT WORKS · @DEAD.SIMPLE.ENGINEERING" x={540} y={1466} size={20} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: PUSH }}>HOW IT WORKS · 13</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 120, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>Tacoma Narrows</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 84, lineHeight: 1.1, color: PUSH }}>why it twisted apart</div>
    </div>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Frame />
      <Streaks g={0} ys={[800, 880, 960, 1040, 1180]} o={0.6} />
      <BridgeSide g={0} dy={() => 0} phi={(x) => 0.5 * Math.sin(TAU * uOf(x))} />
      {T_(1000, 1370, "TACOMA NARROWS · 1940", { c: K.muted, a: "end", size: 24 })}
    </svg>
  </>
);
export { easeInOut, easeOut };
