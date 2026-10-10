import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Headline, clamp01, ioB, W, H } from "../gearbox/kit";
import { Wire3D, project, V3, WireView } from "../../engine/wire3d";
import { airliner, ENG, INLET_Z } from "../contrails/plane";

/**
 * HOW IT WORKS #19 — Why do planes fly so high?        30 s · 1080×1920 · 30 fps · 900 frames
 * HIT-STYLE: frame 0 is a finished hook (question headline + rotating wireframe airliner climbing past a big altitude ruler). Voice starts at 0.1 s.
 * House rule: no end card — the last picture holds and a small AKS PRODUCTIONS tag (EndTag) fades in over the last second.
 * "2D that rotates like 3D wireframe" -> src/engine/wire3d.tsx + src/projects/contrails/plane.ts (generic twin-engine airliner schematic, not to scale).
 *
 * BEATS PLAN — VO phrases: public/projects/flyhigh/vo.json (frames @30)
 *    3 hook   "Planes fly about ten kilometers up."        plane climbs past the altitude ruler to 10.7 km (35,000 ft); typical-cruise band
 *   80        "Why?"                                       WHY? pill
 *  113        "Because the air gets thin."                 dots appear: dense near the ground, sparse up high
 *  154 dens   "Near the ground, air is packed tight."      left box: sea-level air, packed dots
 *  238        "Up there, there's only about a third as much."  right box starts equal, two thirds of the dots fade out (0.31)
 *  320 drag   "Less air means less drag."                  two planes, same speed: thick drag arrows at sea level, thin up high (drag ~ density)
 *  375        "Less drag means less fuel."                 two fuel-burn gauges: high needle vs lower needle
 *  422 cold   "The cold air helps the engines too."        thermometer falls to about -54 C; cold air flows into the engine inlet; efficiency bar up
 *  477 wx     "And it's above most of the weather."        cloud layer below the wings, troposphere top ~11 km, a tall storm can still reach up
 *  526 high   "Why not higher?"                            plane climbs into the TOO THIN zone, air dots vanish
 *  571        "Wings and engines need air too."            lift arrows shrink, engine intake starves
 *  625 sweet  "So pilots pick the sweet spot."             plane returns to the green band
 *  690        "As fuel burns off,"                         fuel bar falls
 *  734        "the plane gets lighter and climbs a little."  step climb: staircase, the best-altitude marker rises, the plane follows
 *  800 end    "Thin air is the cheat code."                recap chips
 *
 * Facts on screen (source URLs in the delivery notes):
 *  - cruise 31,000-38,000 ft (Wikipedia 'Cruise (aeronautics)'); 35,000 ft = 10.67 km; shown 'ABOUT 10 KM'
 *  - density ratio at 35,000 ft = 0.31 of sea level (EngineeringToolbox standard-atmosphere table sigma 0.310; NASA Glenn model gives 0.311; ISA 0.310) -> 'about a third'
 *  - drag is proportional to air density (NASA Glenn drag equation D = Cd rho V^2 A / 2) at the same speed -> SIMPLIFIED, tagged
 *  - air about -54 C at 35,000 ft (NASA Glenn model -54.2 C; ISA -54.3 C); cold intake air helps the engine cycle (ScienceABC, flyawaysimulation, MIT Brayton note) -> SIMPLIFIED
 *  - weather: troposphere top ~11 km (NASA Glenn model 11,000 m; Wikipedia 'Cruising altitude'), most weather is in the troposphere (Wikipedia 'Tropopause'); strong storms can reach it -> 'most'
 *  - why not higher: thin air limits lift and engine thrust (Military Aerospace, ScienceABC, flyawaysimulation)
 *  - best altitude rises as weight falls; step climbs (Wikipedia 'Cruise (aeronautics)' + 'Step climb', Airbus backgrounder)
 * SIMPLIFIED (tagged on screen): airliner = generic line schematic; dots, arrows and gauges are illustrations, not a simulation. Pure functions of the frame.
 */

/** Global frames from public/projects/flyhigh/vo.json. Keep in sync with soundtrack.py. */
export const T = { dens: 154, drag: 320, cold: 422, wx: 477, high: 526, sweet: 625, end: 800, total: 900 };
export const CUTS = [0, 154, 320, 422, 477, 526, 625, 800];
export const CUE = {
  why: 80, thin: 113,
  near: 154, packed: 189, up: 238, third: 264,
  less: 320, fuel: 375,
  cold: 422, weather: 477,
  higher: 526, need: 571,
  sweet: 625, burn: 690, light: 734,
  cheat: 800,
};

const AM = K.amber, LN = K.line, DIM = K.lineDim, WH = K.text, MU = K.muted, GR = K.green, RD = K.red;
const AIRC = "#8FD0FF";
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fract = (x: number) => x - Math.floor(x);
const rnd = (a: number, b = 0) => fract(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) * 2 - 1; // -1..1, deterministic
const r01 = (a: number, b = 0) => (rnd(a, b) + 1) / 2;
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
const AirDot: React.FC<{ x: number; y: number; o?: number; r?: number; c?: string }> = ({ x, y, o = 0.88, r = 5.5, c = AIRC }) => <circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth={2.4} opacity={o} />;

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
/** vertical arrow (up when y2 < y1) */
const VArrow: React.FC<{ x: number; y1: number; y2: number; w: number; color: string; o?: number }> = ({ x, y1, y2, w, color, o = 1 }) => {
  const d = y2 < y1 ? 1 : -1;
  if (o <= 0.01 || Math.abs(y1 - y2) < w * 2.4) return null;
  const hl = w * 2.1, hw = w * 1.45;
  return (
    <g opacity={o} style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
      <line x1={x} y1={y1} x2={x} y2={y2 + d * hl * 0.8} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M ${x} ${y2} L ${x - hw} ${y2 + d * hl} L ${x + hw} ${y2 + d * hl} Z`} fill={color} />
    </g>
  );
};

const SvgMeter: React.FC<{ x: number; y: number; w: number; v: number; label: string; value: string; color: string; o?: number }> = ({ x, y, w, v, label, value, color, o = 1 }) => (
  <g opacity={o}>
    {T_(x, y + 22, label, { size: 26, c: MU, a: "start", ls: 3 })}
    {T_(x + w, y + 22, value, { size: 26, c: color, a: "end", w: 700, ls: 3 })}
    <rect x={x} y={y + 38} width={w} height={32} rx={4} fill="rgba(3,11,24,0.6)" stroke={DIM} strokeWidth={2} />
    <rect x={x + 4} y={y + 42} width={(w - 8) * clamp01(v)} height={24} rx={2} fill={color} opacity={0.9} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
  </g>
);

/* ───────────────────────── altitude world (shared by hook, weather, higher, sweet) ───────────────────────── */
const ALT0 = 1372, KMP = 50;                   // 0 km at y 1372, 50 px per km (12 km -> 772, 14 km -> 672)
const altY = (km: number) => ALT0 - km * KMP;
const CRUISE = { lo: 9.4, hi: 11.6, best: 10.67 };   // 31,000-38,000 ft ; 35,000 ft = 10.67 km
/** ISA-style density ratio (troposphere power law, flattened above 11 km) */
const dens = (km: number) => (km <= 11 ? Math.pow(1 - km / 44.33, 4.256) : 0.2972 * Math.exp(-(km - 11) / 6.34));

const Ruler: React.FC<{ maxKm: number; x?: number; o?: number }> = ({ maxKm, x = 118, o = 1 }) => (
  <g opacity={o}>
    <line x1={x} y1={altY(0)} x2={x} y2={altY(maxKm)} stroke={MU} strokeWidth={2.4} />
    {Array.from({ length: Math.floor(maxKm / 2) + 1 }, (_, i) => i * 2).map((k) => (
      <g key={k}>
        <line x1={x - 14} y1={altY(k)} x2={x + 10} y2={altY(k)} stroke={MU} strokeWidth={2.4} />
        {T_(x - 22, altY(k) + 8, String(k), { size: 22, c: MU, a: "end", ls: 1 })}
      </g>
    ))}
    {T_(x, altY(maxKm) - 18, "KM", { size: 20, c: MU, a: "middle" })}
  </g>
);
const Ground: React.FC<{ o?: number }> = ({ o = 1 }) => <rect x={140} y={altY(0)} width={870} height={7} fill={MU} opacity={0.5 * o} />;

/** wireframe airliner at (cx, cy). yaw ~1.48 = side view, nose to the right; roll > 0 tips the nose up. */
const Plane: React.FC<{ g: number; cx: number; cy: number; scale: number; yaw: number; pitch?: number; roll?: number; op?: number; glow?: number; farOp?: number }> = ({ g, cx, cy, scale, yaw, pitch = 0.2, roll = 0, op = 1, glow = 7, farOp = 1 }) => {
  const view: WireView = { yaw, pitch, roll, dist: 150, scale, cx, cy, pivot: [0, 3, 0] };
  return <g opacity={op}><Wire3D lines={airliner({ fan: g * 0.5, fanOp: 0.5, farOp })} view={view} width={2.7} glow={glow} depthFade={0.28} hiddenFade={0.35} /></g>;
};

/* ───────────────────────── scene 0: hook — plane climbs past the ruler ───────────────────────── */
const HookLayer: React.FC<{ g: number; cover?: boolean }> = ({ g, cover }) => {
  const o = cover ? 1 : win(g, -10, T.dens + 6, 8, 12);
  if (o <= 0.01) return null;
  const km = lerp(6.2, CRUISE.best, easeOut(clamp01(g / 100)));
  const py = altY(km);
  const yaw = 1.0 + 0.5 * clamp01(g / 150);
  const dotsOn = 1;
  // air dots: same cells everywhere, kept with probability = density at that height
  const dots: React.ReactNode[] = [];
  if (dotsOn > 0.01) {
    const C = 46;
    for (let cx = 0; cx < 18; cx++) for (let cy = 0; cy < 15; cy++) {
      const x = 190 + cx * C + C / 2 + 8 * rnd(cx, cy), y = 690 + cy * C + C / 2 + 8 * rnd(cx + 40, cy);
      const h = (ALT0 - y) / KMP;
      if (r01(cx, cy + 7) > dens(h) * 0.92) continue;
      const delay = (1 - dens(h)) * 14 + r01(cx, cy) * 8;
      const on = cover ? 1 : clamp01((g + 8 - delay * 0.3) / 8);
      dots.push(<AirDot key={`${cx}-${cy}`} x={x + 3 * Math.sin(g * 0.06 + cx * 2 + cy)} y={y + 3 * Math.cos(g * 0.05 + cy * 3 + cx)} r={4.8} o={0.5 * on * dotsOn} />);
    }
  }
  const pop = clamp01((g - 4) / 10);
  return (
    <g opacity={o}>
      <Ruler maxKm={12} />
      <Ground />
      {/* typical cruise band */}
      <rect x={140} y={altY(CRUISE.hi)} width={870} height={(CRUISE.hi - CRUISE.lo) * KMP} fill={LN} opacity={0.08} />
      <line x1={140} y1={altY(CRUISE.hi)} x2={1010} y2={altY(CRUISE.hi)} stroke={LN} strokeWidth={2} strokeDasharray="14 10" opacity={0.55} />
      <line x1={140} y1={altY(CRUISE.lo)} x2={1010} y2={altY(CRUISE.lo)} stroke={LN} strokeWidth={2} strokeDasharray="14 10" opacity={0.55} />
      {T_(1004, altY(CRUISE.hi) + 30, "TYPICAL CRUISE", { size: 20, c: LN, a: "end", w: 700 })}
      {T_(1004, altY(CRUISE.hi) + 56, "31,000–38,000 FT", { size: 20, c: LN, a: "end" })}
      {dots}
      {/* ruler marker + link to the plane */}
      <g>
        <path d={`M ${118 + 14} ${py} l 16 -9 l 0 18 z`} fill={AM} />
        <line x1={148} y1={py} x2={226} y2={py} stroke={AM} strokeWidth={2} strokeDasharray="6 7" opacity={0.7} />
      </g>
      <Plane g={g} cx={480} cy={py} scale={10} yaw={yaw} pitch={0.3 - 0.08 * clamp01(g / 120)} roll={0.16 * (1 - easeOut(clamp01(g / 110)) * 0.6)} />
      {/* altitude readout (follows the plane) */}
      <g opacity={pop}>
        <text x={1004} y={py + 112} textAnchor="end" fontFamily={K.mono} fontWeight={700} fontSize={50} letterSpacing={-2} fill={AM}>{km.toFixed(1)} KM</text>
        {T_(1004, py + 144, `${Math.round((km * 1000) / 0.3048 / 100) * 100 >= 10000 ? (Math.round((km * 1000) / 0.3048 / 100) * 100).toLocaleString("en-US") : ""} FT`, { size: 22, c: MU, a: "end" })}
      </g>
      {/* thin / dense labels */}
      <g opacity={dotsOn}>
        {T_(1004, 712, "THIN AIR", { size: 22, c: AIRC, a: "end", w: 700 })}
        {T_(1004, 1348, "DENSE AIR", { size: 22, c: AIRC, a: "end", w: 700 })}
      </g>
      {/* pills */}
      <Pill x={700} y={1244} text="ABOUT 10 KM UP" size={28} color={MU} pop={cover ? 1 : ioB(g, 6, 18)} o={cover ? 1 : win(g, 4, T.dens + 2, 6, 10)} />
      <Pill x={700} y={1304} text="WHY SO HIGH?" size={28} solid pop={cover ? 1 : ioB(g, CUE.why, CUE.why + 12)} o={cover ? 1 : win(g, CUE.why, T.dens + 2, 4, 10)} />
    </g>
  );
};

/* ───────────────────────── scene 1: the air up there is a third as thick ───────────────────────── */
const BOX = { y0: 700, h: 560 };
const COLS = 8, ROWS = 10, CW = 52, RH = 44;
const Density: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.dens, T.drag + 4, 8, 10);
  if (o <= 0.01) return null;
  const boxes = [{ x: 78, key: "L" }, { x: 558, key: "R" }];
  const FOOT = { hw: 100, hh: 52 };
  // cell list, skipping a footprint around the small plane at the centre of each box
  const cells: { c: number; r: number; x: number; y: number; rank: number }[] = [];
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const x = (c + 0.5) * CW + 12 + 8 * rnd(c, r), y = 78 + (r + 0.5) * RH + 6 * rnd(c + 30, r);
    if (Math.abs(x - 222) < FOOT.hw && Math.abs(y - 78 - 220 - 22) < FOOT.hh) continue;
    cells.push({ c, r, x, y, rank: r01(c, r + 3) });
  }
  const keepN = Math.round(cells.length * 0.31);
  const sorted = [...cells].sort((a, b) => a.rank - b.rank);
  const keep = new Set(sorted.slice(0, keepN).map((q) => `${q.c}-${q.r}`));
  const thinP = (k: string, i: number) => (keep.has(k) ? 0 : clamp01((g - (CUE.third + 2 + (i % 40) * 0.7)) / 9));
  const bar = (x: number, v: number, label: string, col: string, show: number) => (
    <g opacity={show}>
      <rect x={x} y={1296} width={404} height={22} rx={4} fill="rgba(3,11,24,0.6)" stroke={DIM} strokeWidth={2} />
      <rect x={x + 3} y={1299} width={398 * v} height={16} rx={2} fill={col} opacity={0.9} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />
      {T_(x + 202, 1356, label, { size: 26, c: col, a: "middle", w: 700 })}
    </g>
  );
  return (
    <g opacity={o}>
      {boxes.map((b, bi) => {
        const on = bi === 0 ? 1 : io(g, [CUE.up - 4, CUE.up + 8], [0, 1]);
        const t0 = bi === 0 ? CUE.near : CUE.up;
        return (
          <g key={b.key} opacity={on}>
            <rect x={b.x} y={BOX.y0} width={444} height={BOX.h} rx={12} fill="rgba(5,18,38,0.65)" stroke={bi === 0 ? DIM : LN} strokeWidth={2.4} strokeDasharray={bi === 0 ? undefined : "4 8"} />
            {T_(b.x + 222, BOX.y0 + 46, bi === 0 ? "NEAR THE GROUND" : "35,000 FT UP", { size: 25, c: bi === 0 ? AM : LN, a: "middle", w: 700 })}
            <g transform={`translate(${b.x} ${BOX.y0})`}>
              {cells.map((q, i) => {
                const k = `${q.c}-${q.r}`;
                const vis = clamp01((g - (t0 + (i % 30) * 0.9)) / 8) * (bi === 1 ? 1 - thinP(k, i) : 1);
                if (vis <= 0.01) return null;
                return <AirDot key={k} x={q.x + 4 * Math.sin(g * 0.07 + i)} y={q.y + 4 * Math.cos(g * 0.08 + i * 1.3)} o={0.9 * vis} />;
              })}
            </g>
            {/* the plane sits in the middle of the cloud of dots */}
            <Plane g={g} cx={b.x + 222} cy={BOX.y0 + 78 + 242} scale={3.5} yaw={1.48} pitch={0.14} op={clamp01((g - t0) / 10)} glow={5} />
          </g>
        );
      })}
      {bar(78, 1, "SEA LEVEL · 1.00", AM, win(g, CUE.packed, T.drag + 4, 8, 10))}
      {bar(558, 0.31, "ABOUT 0.31 ×", LN, io(g, [CUE.third, CUE.third + 10], [0, 1]) * (1 - io(g, [T.drag - 2, T.drag + 4], [0, 1])))}
      <Pill x={540} y={970} text="ABOUT ⅓" size={34} solid pop={ioB(g, CUE.third + 14, CUE.third + 28)} o={win(g, CUE.third + 12, T.drag + 2, 6, 8)} />
      <g opacity={io(g, [CUE.third, CUE.third + 10], [0, 1])}>{T_(780, BOX.y0 + BOX.h - 18, "AIR DENSITY", { size: 20, c: MU, a: "middle", op: 0.9 })}</g>
    </g>
  );
};

/* ───────────────────────── scene 2: less air, less drag, less fuel ───────────────────────── */
const Drag: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.drag, T.cold + 4, 8, 10);
  if (o <= 0.01) return null;
  const rowsP = win(g, T.drag, CUE.fuel + 2, 8, 10);
  const gaugeP = win(g, CUE.fuel - 4, T.cold + 4, 10, 10);
  const rows = [{ cy: 878, ty: 724, dn: 0.9, label: "SEA LEVEL", pct: "100%", col: AM, w: 12, arrows: 4 }, { cy: 1236, ty: 1070, dn: 0.31, label: "35,000 FT", pct: "31%", col: LN, w: 5, arrows: 3 }];
  const flow = (row: typeof rows[number], ri: number) => {
    const n = Math.round(row.dn * 40);
    return Array.from({ length: n }, (_, i) => {
      const u = fract(g * 0.008 + (i * 0.6180339) % 1);
      const x = lerp(1000, 120, u), y = row.cy - 120 + r01(i, ri + 5) * 240;
      if (Math.abs(x - 330) < 190 && Math.abs(y - row.cy) < 70) return null;
      return <AirDot key={i} x={x} y={y + 4 * Math.sin(g * 0.1 + i)} o={0.55 * clamp01(u * 8) * (1 - clamp01((u - 0.9) * 10))} r={5} />;
    });
  };
  const gauges = [{ cx: 300, v: 0.82, label: "SEA LEVEL", col: AM, tag: "MORE FUEL" }, { cx: 780, v: 0.34, label: "35,000 FT", col: LN, tag: "LESS FUEL" }];
  return (
    <g opacity={o}>
      <g opacity={rowsP}>
        {rows.map((row, ri) => {
          const p = clamp01((g - (T.drag + 4 + ri * 8)) / 10);
          return (
            <g key={ri} opacity={p}>
              <rect x={72} y={ri === 0 ? 700 : 1046} width={936} height={ri === 0 ? 316 : 344} rx={10} fill="rgba(5,18,38,0.6)" stroke={DIM} strokeWidth={2} />
              {T_(104, row.ty + 18, row.label, { size: 26, c: row.col, a: "start", w: 700 })}
              {T_(104, row.ty + 48, ri === 0 ? "THICK AIR" : "THIN AIR · ABOUT 0.31 ×", { size: 20, c: MU })}
              {flow(row, ri)}
              <Plane g={g} cx={330} cy={row.cy + 10} scale={6.2} yaw={1.48} pitch={0.1} glow={6} />
              {/* drag arrows push back on the nose */}
              {Array.from({ length: row.arrows }, (_, k) => {
                const y = row.cy + 10 - ((row.arrows - 1) / 2) * 34 + k * 34;
                const gr = clamp01((g - (CUE.less + 6 + k * 3 + ri * 4)) / 8);
                return <Arrow key={k} x1={lerp(560, 640, ri === 0 ? 1 : 0.55) + 0} x2={560 - 0} y={y} w={row.w} color={row.col} o={gr} />;
              })}
              <text x={1000} y={row.cy + 10} textAnchor="end" fontFamily={K.mono} fontWeight={700} fontSize={96} letterSpacing={-4} fill={row.col} opacity={clamp01((g - (CUE.less + 8 + ri * 8)) / 8)}>{row.pct}</text>
              {T_(1000, row.cy - 92, "DRAG", { size: 26, c: MU, a: "end", w: 700, op: clamp01((g - (CUE.less + 8 + ri * 8)) / 8) })}
              {T_(1000, row.cy + 62, ri === 0 ? "AT THE SAME SPEED" : "SAME SPEED", { size: 20, c: MU, a: "end", op: clamp01((g - (CUE.less + 8 + ri * 8)) / 8) * 0.9 })}
            </g>
          );
        })}
      </g>
      <g opacity={gaugeP}>
        {gauges.map((gg, i) => {
          const t = clamp01((g - (CUE.fuel + i * 6)) / 24);
          const v = lerp(0.04, gg.v, easeOut(t));
          return (
            <g key={i}>
              <FuelGauge cx={gg.cx} cy={1090} r={180} v={v} color={gg.col} />
              <Plane g={g} cx={gg.cx} cy={820} scale={4.2} yaw={1.48} pitch={0.1} glow={5} />
              {T_(gg.cx, 1222, gg.label, { size: 26, c: gg.col, a: "middle", w: 700 })}
              <Pill x={gg.cx} y={1296} text={gg.tag} size={26} color={gg.col} solid pop={ioB(g, CUE.fuel + 18 + i * 6, CUE.fuel + 30 + i * 6)} o={clamp01((g - (CUE.fuel + 16 + i * 6)) / 6)} />
            </g>
          );
        })}
        {T_(540, 722, "FUEL BURN · ILLUSTRATION", { size: 22, c: MU, a: "middle", op: 0.9 })}
      </g>
    </g>
  );
};
const FuelGauge: React.FC<{ cx: number; cy: number; r: number; v: number; color: string }> = ({ cx, cy, r, v, color }) => {
  const pt = (t: number, rr: number) => ({ x: cx + rr * Math.cos(Math.PI + Math.PI * t), y: cy + rr * Math.sin(Math.PI + Math.PI * t) });
  const arc = (t0: number, t1: number, rr: number) => { const a = pt(t0, rr), b = pt(t1, rr); return `M ${a.x} ${a.y} A ${rr} ${rr} 0 0 1 ${b.x} ${b.y}`; };
  const n = pt(clamp01(v), r - 34);
  return (
    <g>
      <path d={arc(0, 1, r)} fill="none" stroke={DIM} strokeWidth={6} />
      <path d={arc(0.78, 1, r)} fill="none" stroke={RD} strokeWidth={10} opacity={0.9} />
      <path d={arc(0, clamp01(v), r - 16)} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      {Array.from({ length: 11 }, (_, i) => { const a = pt(i / 10, r + 8), b = pt(i / 10, r + (i % 5 === 0 ? 30 : 20)); return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={i >= 8 ? RD : WH} strokeWidth={i % 5 === 0 ? 4 : 2} />; })}
      <line x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={AM} strokeWidth={8} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={17} fill={K.bgDeep} stroke={AM} strokeWidth={5} />
      {T_(cx - r + 10, cy + 44, "LOW", { size: 22, c: MU, a: "middle" })}
      {T_(cx + r - 10, cy + 44, "HIGH", { size: 22, c: RD, a: "middle" })}
      {T_(cx, cy + 74, "FUEL BURN", { size: 22, c: MU, a: "middle" })}
    </g>
  );
};

/* ───────────────────────── scene 3: cold air helps the engines ───────────────────────── */
const NEAR_ENG: V3 = [-ENG[0], ENG[1], -0.5];
const Cold: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.cold, T.wx + 4, 6, 8);
  if (o <= 0.01) return null;
  const fall = easeInOut(clamp01((g - (T.cold + 2)) / 26));
  const temp = lerp(15, -54, fall);
  const tubeTop = 740, tubeBot = 1290;
  const ty = (c: number) => lerp(tubeBot, tubeTop, (c + 60) / 80);
  const fillY = ty(temp);
  const view: WireView = { yaw: 1.42, pitch: 0.16, dist: 150, scale: 27, cx: 720, cy: 1060, pivot: NEAR_ENG };
  const I = project([NEAR_ENG[0], ENG[1], INLET_Z], view);
  const cooled = clamp01(fall);
  const air = Array.from({ length: 24 }, (_, i) => {
    const u = fract(g * 0.0165 + (i * 0.6180339) % 1), s = rnd(i, 3);
    const x = I.x + (1010 - I.x) * (1 - u), y = I.y + s * 66 * (1 - u * 0.75) + 4 * Math.sin(g * 0.2 + i);
    return <AirDot key={i} x={x} y={y} r={6} c={cooled > 0.4 ? "#B8EBFF" : AM} o={0.95 * clamp01(u * 5) * (u > 0.96 ? 0 : 1)} />;
  });
  const eff = lerp(0.46, 0.74, easeOut(clamp01((g - (T.cold + 10)) / 30)));
  return (
    <g opacity={o}>
      {/* thermometer */}
      <g>
        <rect x={134} y={tubeTop - 14} width={38} height={tubeBot - tubeTop + 28} rx={19} fill="rgba(3,11,24,0.9)" stroke={DIM} strokeWidth={2.4} />
        <rect x={144} y={fillY} width={18} height={tubeBot - fillY + 20} rx={9} fill={temp < -10 ? LN : AM} />
        <circle cx={153} cy={tubeBot + 40} r={34} fill={temp < -10 ? LN : AM} stroke={DIM} strokeWidth={2.4} />
        {[-60, -40, -20, 0, 20].map((c) => (
          <g key={c}>
            <line x1={176} y1={ty(c)} x2={194} y2={ty(c)} stroke={MU} strokeWidth={2.2} />
            {T_(202, ty(c) + 8, c > 0 ? `+${c}` : c < 0 ? `-${-c}` : "0", { size: 20, c: c === -40 ? AM : MU, a: "start", ls: 1 })}
          </g>
        ))}
        {T_(153, tubeTop - 36, "°C", { size: 22, c: MU, a: "middle" })}
      </g>
      <g style={{ filter: "blur(30px)" }}><ellipse cx={I.x + 120} cy={I.y} rx={190} ry={120} fill={LN} opacity={0.22 * cooled} /></g>
      <Wire3D lines={airliner({ fan: g * 0.55, body: 0.12, eng: 1, fanOp: 1, farOp: 0.1 })} view={view} width={2.7} glow={6} depthFade={0.25} hiddenFade={0.35} />
      {air}
      <g opacity={clamp01((g - (T.cold + 8)) / 6)}>
        <text x={560} y={800} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={120} letterSpacing={-6} fill={LN}>{temp < 0 ? `-${Math.round(-temp)}` : `${Math.round(temp)}`}<tspan fontSize={50} dy={-48}> °C</tspan></text>
        {T_(560, 846, "AIR AT 35,000 FT", { size: 22, c: MU, a: "middle" })}
        {T_(I.x + 10, I.y - 92, "COLD AIR IN", { size: 24, c: "#B8EBFF", a: "middle", w: 700, op: cooled })}
      </g>
      <SvgMeter x={300} y={1290} w={700} v={eff} label="ENGINE EFFICIENCY" value="BETTER" color={GR} o={clamp01((g - (T.cold + 10)) / 8)} />
    </g>
  );
};

/* ───────────────────────── scene 4: above most of the weather ───────────────────────── */
const Puffs: React.FC<{ cx: number; base: number; w: number; hgt: number; seed: number }> = ({ cx, base, w, hgt, seed }) => (
  <g>
    {Array.from({ length: 7 }, (_, i) => {
      const t = (i + 0.5) / 7, r = hgt * (0.3 + 0.3 * Math.sin(Math.PI * t)) * (0.8 + 0.4 * r01(i, seed));
      return <circle key={i} cx={cx - w / 2 + w * t} cy={base - r * 0.75} r={r} />;
    })}
    <rect x={cx - w / 2} y={base - hgt * 0.22} width={w} height={hgt * 0.22} />
  </g>
);
const Weather: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.wx, T.high + 4, 6, 8);
  if (o <= 0.01) return null;
  const drift = (g - T.wx) * 0.5;
  const py = altY(CRUISE.best) - 4 * Math.sin(g * 0.08);
  const clouds = [{ cx: 330, base: altY(0.3), w: 420, hh: 190, s: 1, op: 0.5 }, { cx: 700, base: altY(0.3), w: 460, hh: 230, s: 2, op: 0.55 }, { cx: 520, base: altY(2.4), w: 360, hh: 150, s: 3, op: 0.45 }, { cx: 860, base: altY(2.2), w: 200, hh: 200, s: 4, op: 0.45 }, { cx: 250, base: altY(2.6), w: 200, hh: 130, s: 5, op: 0.4 }];
  const stormP = clamp01((g - (T.wx + 12)) / 12);
  const sx = 900, sTop = altY(10.5);
  const bolt = Math.floor(g / 7) % 2 === 0;
  return (
    <g opacity={o}>
      <Ruler maxKm={12} />
      <Ground />
      {/* troposphere top */}
      <g opacity={clamp01((g - (T.wx + 6)) / 10)}>
        <line x1={140} y1={altY(11)} x2={1010} y2={altY(11)} stroke={AM} strokeWidth={3} strokeDasharray="16 10" opacity={0.75} />
        {T_(1004, altY(11) - 38, "WEATHER LAYER ENDS", { size: 20, c: AM, a: "end", w: 700 })}
        {T_(1004, altY(11) - 12, "ABOUT 11 KM", { size: 20, c: AM, a: "end", w: 700 })}
      </g>
      {/* clouds */}
      <g style={{ filter: "blur(1px)" }}>
        {clouds.map((c, i) => (
          <g key={i} transform={`translate(${((drift * (0.4 + 0.15 * i)) % 20) - 10} 0)`} opacity={clamp01((g - (T.wx + 2 + i * 2)) / 8)}>
            <g fill={WH} opacity={0.26} style={{ filter: "blur(2px)" }}><Puffs cx={c.cx} base={c.base} w={c.w} hgt={c.hh * 0.85} seed={c.s} /></g>
          </g>
        ))}
      </g>
      {/* rain + a tall storm */}
      {Array.from({ length: 16 }, (_, i) => {
        const u = fract(g * 0.03 + i * 0.37), x = 200 + i * 52 + 10 * rnd(i, 1), y = altY(2.2) + u * 140;
        return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 22} stroke={AIRC} strokeWidth={2.4} opacity={0.5 * clamp01((g - (T.wx + 6)) / 10) * (1 - u)} />;
      })}
      <g opacity={stormP}>
        <path d={`M ${sx - 70} ${altY(0.3)} L ${sx - 80} ${altY(7)} Q ${sx - 90} ${sTop + 40} ${sx} ${sTop} Q ${sx + 90} ${sTop + 40} ${sx + 80} ${altY(7)} L ${sx + 70} ${altY(0.3)} Z`} fill={WH} fillOpacity={0.08} stroke={WH} strokeWidth={3} strokeDasharray="10 8" />
        {bolt && <path d={`M ${sx + 6} ${altY(7.4)} l -26 60 l 22 0 l -22 62`} fill="none" stroke={AM} strokeWidth={5} strokeLinejoin="miter" style={{ filter: `drop-shadow(0 0 10px ${AM})` }} />}
        {T_(sx - 4, sTop + 120, "TALL STORMS", { size: 19, c: WH, a: "middle", w: 700 })}
        {T_(sx - 4, sTop + 144, "CAN REACH UP", { size: 19, c: MU, a: "middle" })}
      </g>
      <Plane g={g} cx={520} cy={py} scale={7.2} yaw={1.3} pitch={0.28} roll={0.03} />
      <Pill x={420} y={altY(7.2)} text="ABOVE MOST WEATHER" size={30} solid pop={ioB(g, T.wx + 14, T.wx + 28)} o={clamp01((g - (T.wx + 12)) / 6)} />
      {T_(240, altY(0.15) - 14, "CLOUDS · RAIN · STORMS", { size: 20, c: MU, a: "start", op: 0.9 })}
    </g>
  );
};

/* ───────────────────────── scenes 5-6: the sweet spot and the step climb (one shared column) ───────────────────────── */
const ZONES = [
  { lo: 0, hi: CRUISE.lo, col: AM, a: "TOO LOW", b: "THICK AIR, MORE DRAG", mid: 4.4 },
  { lo: CRUISE.lo, hi: CRUISE.hi, col: GR, a: "SWEET SPOT", b: "ABOUT 9–12 KM", mid: 10.5 },
  { lo: CRUISE.hi, hi: 14, col: RD, a: "TOO THIN", b: "FOR WINGS + ENGINES", mid: 12.9 },
];
const Zones: React.FC<{ g: number; o: number; marker?: number }> = ({ g, o, marker }) => (
  <g opacity={o}>
    {ZONES.map((z, i) => (
      <g key={i}>
        <rect x={134} y={altY(z.hi)} width={26} height={(z.hi - z.lo) * KMP} fill={z.col} opacity={0.75} />
        <rect x={160} y={altY(z.hi)} width={850} height={(z.hi - z.lo) * KMP} fill={z.col} opacity={0.055} />
        {T_(190, altY(z.mid) - 2, z.a, { size: 26, c: z.col, a: "start", w: 700 })}
        {T_(190, altY(z.mid) + 28, z.b, { size: 19, c: MU, a: "start" })}
      </g>
    ))}
    {marker !== undefined && (
      <g>
        <path d={`M 134 ${altY(marker)} l -26 -14 l 0 28 z`} fill={AM} />
        <line x1={134} y1={altY(marker)} x2={1010} y2={altY(marker)} stroke={AM} strokeWidth={2} strokeDasharray="4 9" opacity={0.65} />
      </g>
    )}
  </g>
);

/** air dots on the stage for the "too thin" beat: count follows the density at the plane's height */
const Higher: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.high, T.sweet + 6, 6, 12);
  if (o <= 0.01) return null;
  const up = easeInOut(clamp01((g - (T.high + 2)) / 36));
  const down = easeInOut(clamp01((g - (T.sweet - 6)) / 24));
  const km = lerp(CRUISE.best, 12.5, up) - (12.5 - CRUISE.best) * down;
  const py = altY(km);
  const d = dens(km) / dens(CRUISE.best);               // relative to the sweet spot
  const PX = 770;
  const view: WireView = { yaw: 1.2, pitch: 0.3, roll: 0, dist: 150, scale: 6.6, cx: PX, cy: py, pivot: [0, 3, 0] };
  // lift arrows from the wing, intake dots at the engine
  const wing = project([-17, -1, -3], view);
  const I = project([-ENG[0], ENG[1], INLET_Z + 1], view);
  const lift = clamp01(0.25 + 0.75 * d) * (1 - 0.0);
  const liftOn = io(g, [CUE.need, CUE.need + 10], [0, 1]) * (1 - io(g, [T.sweet - 6, T.sweet + 4], [0, 1]) * 0.6);
  const intake = Array.from({ length: 14 }, (_, i) => {
    if (r01(i, 21) > d * 1.1) return null;
    const u = fract(g * 0.014 + i * 0.37);
    return <AirDot key={i} x={I.x + 190 * (1 - u)} y={I.y + rnd(i, 2) * 40 * (1 - 0.6 * u)} r={5} o={0.9 * clamp01(u * 6) * (1 - clamp01((u - 0.9) * 10)) * liftOn} />;
  });
  const starved = io(g, [T.high + 28, T.high + 42], [0, 1]) * (1 - down);
  const flashRed = starved * (0.55 + 0.45 * Math.sin(g * 0.4));
  return (
    <g opacity={o}>
      <Ruler maxKm={14} />
      <Ground />
      <Zones g={g} o={1} marker={km} />
      {/* thin-air dots follow the density around the plane */}
      {Array.from({ length: 90 }, (_, i) => {
        const x = 330 + r01(i, 1) * 680, y = 680 + r01(i, 2) * 700, h = (ALT0 - y) / KMP;
        if (r01(i, 3) > dens(h) * 0.8) return null;
        if (Math.abs(x - PX) < 250 && Math.abs(y - py) < 120) return null;
        return <AirDot key={i} x={x + 3 * Math.sin(g * 0.06 + i)} y={y + 3 * Math.cos(g * 0.05 + i)} r={4.6} o={0.38} />;
      })}
      <Plane g={g} cx={PX} cy={py} scale={6.6} yaw={1.2} pitch={0.3} />
      {intake}
      {/* wing lift */}
      <g opacity={liftOn}>
        <VArrow x={wing.x} y1={wing.y + 4} y2={wing.y - 20 - 120 * lift} w={5 + 7 * lift} color={lift < 0.5 ? RD : GR} o={1} />
        {T_(wing.x, wing.y + 54, "LIFT", { size: 22, c: lift < 0.5 ? RD : GR, a: "middle", w: 700 })}
        {T_(I.x + 70, I.y + 88, "ENGINE AIR", { size: 22, c: AIRC, a: "middle", w: 700 })}
      </g>
      <Pill x={700} y={altY(7.6)} text="TOO THIN" size={36} color={RD} solid pop={ioB(g, T.high + 28, T.high + 40)} o={starved * (0.8 + 0.2 * Math.sin(g * 0.4))} />
      <rect x={VIEW.x0} y={VIEW.y0} width={VIEW.x1 - VIEW.x0} height={VIEW.y1 - VIEW.y0} fill="none" stroke={RD} strokeWidth={4} opacity={flashRed * 0.35} />
      <Pill x={700} y={altY(7.6)} text="BACK TO THE BAND" size={26} color={GR} solid pop={ioB(g, T.sweet - 4, T.sweet + 8)} o={win(g, T.sweet - 4, T.sweet + 14, 4, 8)} />
    </g>
  );
};

const STEPS = [{ at: 0, km: 9.7 }, { at: CUE.light + 4, km: 10.2 }, { at: CUE.light + 34, km: 10.7 }];
const Sweet: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.sweet - 4, T.total + 40, 10, 10);
  if (o <= 0.01) return null;
  // plane height: settles in the sweet spot, then two small steps up as it lightens
  const stepP = (i: number) => easeInOut(clamp01((g - STEPS[i].at) / 14));
  const km = STEPS[0].km + (STEPS[1].km - STEPS[0].km) * stepP(1) + (STEPS[2].km - STEPS[1].km) * stepP(2);
  const settle = easeOut(clamp01((g - (T.sweet - 2)) / 18));
  const kmShown = lerp(CRUISE.best, km, settle);
  // plane glides right across the stage as the staircase is drawn
  const PX = lerp(560, 840, clamp01((g - T.sweet) / 175));
  const py = altY(kmShown);
  const best = km + 0.25;                                   // the best-altitude marker leads the plane
  const fuel = lerp(0.92, 0.44, clamp01((g - CUE.burn) / 90));
  const fuelOn = clamp01((g - (CUE.burn - 6)) / 8);
  const stairs: string = (() => {
    let d = `M 330 ${altY(STEPS[0].km)}`;
    const x1 = lerp(560, 840, clamp01((STEPS[1].at - T.sweet) / 175)), x2 = lerp(560, 840, clamp01((STEPS[2].at - T.sweet) / 175));
    d += ` L ${x1 - 24} ${altY(STEPS[0].km)}`;
    if (g > STEPS[1].at) d += ` L ${x1 + 8} ${altY(STEPS[1].km)}`;
    if (g > STEPS[1].at + 14) d += ` L ${Math.min(PX - 120, x2 - 24)} ${altY(STEPS[1].km)}`;
    if (g > STEPS[2].at) d += ` L ${x2 + 8} ${altY(STEPS[2].km)}`;
    if (g > STEPS[2].at + 14) d += ` L ${PX - 120} ${altY(STEPS[2].km)}`;
    return d;
  })();
  const recap = clamp01((g - (CUE.cheat + 6)) / 10);
  const lighter = win(g, CUE.light, T.end + 2, 6, 8);
  return (
    <g opacity={o}>
      <Ruler maxKm={14} />
      <Ground />
      <Zones g={g} o={1} marker={g > CUE.light - 6 ? best : CRUISE.best} />
      {g > T.sweet + 10 && <path d={stairs} fill="none" stroke={AM} strokeWidth={4} strokeDasharray="12 9" strokeLinejoin="round" opacity={0.9} style={{ filter: `drop-shadow(0 0 8px ${AM})` }} />}
      <Plane g={g} cx={PX} cy={py + 10} scale={7.2} yaw={1.42} pitch={0.18} roll={0.05 + 0.1 * (stepP(1) * (1 - stepP(2)) + stepP(2) * (1 - clamp01((g - STEPS[2].at - 14) / 10)))} />
      {/* callouts */}
      <Pill x={780} y={altY(CRUISE.hi) - 44} text="SWEET SPOT" size={30} solid pop={ioB(g, T.sweet, T.sweet + 12)} o={win(g, T.sweet + 2, CUE.burn, 6, 8)} />
      <Pill x={780} y={altY(CRUISE.hi) - 44} text="BEST HEIGHT RISES" size={28} solid pop={ioB(g, CUE.light, CUE.light + 12)} o={win(g, CUE.light + 2, T.end, 6, 8)} />
      {/* fuel bar */}
      <g opacity={fuelOn * (1 - recap)}>
        <SvgMeter x={330} y={1286} w={670} v={fuel} label="FUEL ON BOARD" value={fuel > 0.7 ? "FULL-ISH" : fuel > 0.55 ? "BURNING OFF" : "LIGHTER"} color={AM} />
      </g>
      <g opacity={lighter * (1 - recap)}>
        <Pill x={570} y={1210} text="LIGHTER PLANE" size={26} color={LN} solid pop={ioB(g, CUE.light, CUE.light + 12)} />
        <Pill x={870} y={1210} text="CLIMB IN STEPS" size={24} color={AM} solid pop={ioB(g, CUE.light + 16, CUE.light + 28)} o={clamp01((g - (CUE.light + 14)) / 6)} />
      </g>
      {/* recap chips */}
      <g opacity={recap}>
        <Pill x={680} y={1060} text="LESS AIR · LESS DRAG" size={28} color={LN} solid pop={ioB(g, CUE.cheat + 6, CUE.cheat + 18)} />
        <Pill x={680} y={1138} text="LESS DRAG · LESS FUEL" size={28} color={AM} solid pop={ioB(g, CUE.cheat + 14, CUE.cheat + 26)} o={clamp01((g - (CUE.cheat + 12)) / 6)} />
        <Pill x={680} y={1216} text="COLD HELPS · ABOVE WEATHER" size={26} color={GR} solid pop={ioB(g, CUE.cheat + 22, CUE.cheat + 34)} o={clamp01((g - (CUE.cheat + 20)) / 6)} />
      </g>
    </g>
  );
};

/* ───────────────────────── main shot ───────────────────────── */
export const FlyHighShot: React.FC = () => {
  const g = useCurrentFrame();
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={g} lines={["Why do planes", "fly so *high?*"]} at={-30} exitAt={T.dens - 12} size={118} top={346} />
      <Headline f={g} lines={["About *a third*", "as much air"]} at={T.dens + 3} exitAt={T.drag - 8} size={104} />
      <Headline f={g} lines={["Less air,", "*less drag*"]} at={T.drag + 3} exitAt={CUE.fuel - 8} size={108} />
      <Headline f={g} lines={["Less drag,", "*less fuel*"]} at={CUE.fuel + 3} exitAt={T.cold - 8} size={108} />
      <Headline f={g} lines={["Cold air helps", "*the engines*"]} at={T.cold + 3} exitAt={T.wx - 6} size={104} />
      <Headline f={g} lines={["Above *most*", "of the weather"]} at={T.wx + 3} exitAt={T.high - 6} size={104} />
      <Headline f={g} lines={["Why not", "*higher?*"]} at={T.high + 3} exitAt={CUE.need - 8} size={112} />
      <Headline f={g} lines={["Wings and engines", "*need air too*"]} at={CUE.need + 3} exitAt={T.sweet - 8} size={92} />
      <Headline f={g} lines={["Pick the", "*sweet spot*"]} at={T.sweet + 3} exitAt={CUE.burn - 8} size={112} />
      <Headline f={g} lines={["Lighter plane,", "*higher steps*"]} at={CUE.burn + 3} exitAt={T.end - 8} size={104} />
      <Headline f={g} lines={["Thin air is", "the *cheat code*"]} at={T.end + 2} size={112} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <HookLayer g={g} />
        <Density g={g} />
        <Drag g={g} />
        <Cold g={g} />
        <Weather g={g} />
        <Higher g={g} />
        <Sweet g={g} />
        <g opacity={io(g, [20, 36], [0, 1])}>{T_(540, 1584, "SIMPLIFIED SCHEMATIC · STANDARD ATMOSPHERE VALUES · NOT TO SCALE", { c: K.muted, a: "middle", size: 20 })}</g>
      </svg>

      <Panel o={pn(-10, T.dens + 2)} a="TYPICAL CRUISE · 31,000–38,000 FT" b={<>Airliners cruise about <Em>10 km</Em> up</>} c="35,000 ft = 10.7 km · the air thins as you climb" />
      <Panel o={pn(T.dens, CUE.up + 2)} a="STEP 1 · NEAR THE GROUND" b={<>Air is <Em>packed tight</Em></>} c="Sea level = 1.00 · standard atmosphere" />
      <Panel o={pn(CUE.up, T.drag + 2)} a="STEP 1 · AT 35,000 FT" b={<>About <Em>a third</Em> as much air</>} c="Density 0.31 × sea level · NASA Glenn · ISA" />
      <Panel o={pn(T.drag, CUE.fuel + 2)} a="STEP 2 · DRAG" b={<>Less air, <Em>less drag</Em></>} c="Drag scales with air density · same speed · NASA Glenn" />
      <Panel o={pn(CUE.fuel, T.cold + 2)} a="STEP 2 · FUEL" b={<>Less drag, <Em>less fuel</Em></>} c="Simplified · gauges are an illustration, not data" />
      <Panel o={pn(T.cold, T.wx + 2)} a="STEP 3 · ABOUT -54 °C AT 35,000 FT" b={<>Cold intake air helps the <Em>engine</Em></>} c="Colder air = better engine cycle · simplified" />
      <Panel o={pn(T.wx, T.high + 2)} a="STEP 4 · THE WEATHER LAYER" b={<>Cruise sits above <Em>most</Em> weather</>} c="Weather layer ends about 11 km · some storms go higher" />
      <Panel o={pn(T.high, CUE.need + 2)} a="WHY NOT HIGHER?" b={<>The air gets <Em>too thin</Em></>} c="Less air to lift the wings and feed the engines" />
      <Panel o={pn(CUE.need, T.sweet + 2)} a="WINGS + ENGINES NEED AIR" b={<>Too high: lift and thrust <Em>fade</Em></>} c="Less spare power · thinner safety margin up there" />
      <Panel o={pn(T.sweet, CUE.burn + 2)} a="THE SWEET SPOT" b={<>Not too low, not too <Em>high</Em></>} c="Typical cruise: 31,000–38,000 ft · it varies by plane" />
      <Panel o={pn(CUE.burn, CUE.light + 2)} a="FUEL BURNS OFF" b={<>The plane gets <Em>lighter</Em></>} c="A lighter plane's best altitude moves up" />
      <Panel o={pn(CUE.light, T.end + 2)} a="THE STEP CLIMB" b={<>Climb a little, <Em>in steps</Em></>} c="Best altitude rises as weight falls · Airbus · Wikipedia" />
      <Panel o={pn(T.end, T.total + 20)} a="NOW YOU KNOW" b={<>Thin air is the <Em>cheat code</Em></>} c="Less drag · less fuel · cold helps · above most weather" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 296, display: "flex", justifyContent: "center", fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>HOW IT WORKS · 19</div>
    <Headline f={200} lines={["Why do planes", "fly so *high?*"]} at={0} size={128} top={380} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Frame />
      <HookLayer g={96} cover />
      {T_(540, 1584, "SIMPLIFIED SCHEMATIC · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}
    </svg>
  </>
);
void easeOut; void H; void lerp;
