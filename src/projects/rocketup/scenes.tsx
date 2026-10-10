import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Headline, clamp01, ioB, W, H } from "../gearbox/kit";
import { Wire3D, V3, WireLine, ring } from "../../engine/wire3d";

/**
 * HOW IT WORKS #20 — Why don't rockets go straight up?     30 s · 1080×1920 · 30 fps · 900 frames
 * HIT-STYLE: frame 0 is a finished hook (question headline + wireframe rocket mid-climb with an UP path and a dashed FALL path). Voice starts at 0.1 s.
 * House rule: no end card. The last picture holds and a small AKS PRODUCTIONS tag (EndTag) fades in over the last second.
 *
 * BEATS PLAN — VO phrases: public/projects/rocketup/vo.json (frames @30)
 *    3 hook   "A rocket that only goes up falls straight back down."   rocket climbs (amber), stops, falls back down a dashed red path
 *   83 side   "To stay in orbit, you need sideways speed."            horizontal rocket, SIDEWAYS bar full, UP bar nearly empty
 *  176        "About seven point seven kilometers a second."          counter 0 -> 7.7 KM/S, ≈ 27,700 KM/H
 *  251 grav   "Straight up just fights gravity and wastes fuel."      thrust up vs gravity down, fuel meter drains
 *  325 tilt   "So it climbs through the thick air first,"             ascent stage: rocket climbs straight, air is thick near the ground
 *  390        "then tips over, little by little."                     path bends, TILT readout 0 -> ~88 deg
 *  455 turn   "Gravity itself helps bend the path."                   gravity arrow + straight (no-gravity) dashed line vs the curved path
 *  527        "It's called a gravity turn."                           GRAVITY TURN pill
 *  570 flat   "Near the top, the path is almost flat."                path nearly horizontal, thin air
 *  661        "Sideways, above the air."                              ABOVE THE AIR pill, rocket flying sideways
 *  718 end    "A rocket doesn't go up to reach space."                recap headline, rocket keeps going along the dashed orbit arc
 *  793        "It goes sideways to stay there."
 *
 * Facts on screen (source URLs in the delivery notes):
 *  - low-Earth-orbit speed about 7.7 km/s = 27,720 km/h (Wikipedia 'Orbital speed' table: 7.7–6.9 km/s for 200–2,000 km; 'Low Earth orbit' ~7.8 km/s ~28,000 km/h)
 *  - straight up burns fuel against gravity ('gravity drag', Wikipedia 'Gravity turn'; Sky at Night: straight up would quickly exhaust the fuel)
 *  - atmosphere thickest up to 10–20 km, trajectory starts to flatten by about 160 km (Sky at Night 'why do rockets not launch straight up')
 *  - gravity turn: little steering, thrust goes to speed, early pitch-over (Wikipedia 'Gravity turn')
 *  - orbit = fast enough sideways that you keep falling around Earth (Sky at Night)
 * SIMPLIFIED (tagged on screen): rocket = generic wire schematic, ascent path/tilt readout/fuel meter are illustrations, not a simulation, not to scale.
 */

export const T = { side: 83, grav: 251, tilt: 325, turn: 455, flat: 570, end: 718, total: 900 };
export const CUTS = [0, 83, 251, 325, 455, 570, 718];
export const CUE = { count: 176, bend: 390, gturn: 527, above: 661, stay: 793 };

const AM = K.amber, LN = K.line, DIM = K.lineDim, MU = K.muted, GR = K.green, RD = K.red;
const AIRC = "#8FD0FF";
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 24} letterSpacing={o.ls ?? (o.size ?? 24) * 0.08} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);
const Panel: React.FC<{ o: number; a: string; b: React.ReactNode; c?: string }> = ({ o, a, b, c }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1412, height: 138, opacity: o, borderRadius: 12, border: `2px solid ${DIM}`, background: "rgba(3,11,24,0.85)", boxSizing: "border-box", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
    <div style={{ fontFamily: K.mono, fontSize: 27, letterSpacing: 4, color: AM, fontWeight: 700, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: K.head, fontSize: 43, fontWeight: 700, color: K.text, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b}</div>
    {c && <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 1.2, color: K.muted, whiteSpace: "nowrap", fontWeight: 500 }}>{c}</div>}
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
    {[[60, 640, 1, 1], [1020, 640, -1, 1], [60, 1390, 1, -1], [1020, 1390, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={DIM} strokeWidth={2.4} />
    ))}
  </g>
);
/** arrow from (x1,y1) tail to (x2,y2) tip */
const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; w: number; color: string; o?: number; dash?: string }> = ({ x1, y1, x2, y2, w, color, o = 1, dash }) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (o <= 0.01 || len < w * 3) return null;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len, hl = w * 2.6, hw = w * 1.6;
  const bx = x2 - ux * hl, by = y2 - uy * hl;
  return (
    <g opacity={o} style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
      <line x1={x1} y1={y1} x2={bx + ux * 2} y2={by + uy * 2} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      <path d={`M ${x2} ${y2} L ${bx - uy * hw} ${by + ux * hw} L ${bx + uy * hw} ${by - ux * hw} Z`} fill={color} />
    </g>
  );
};
const Meter: React.FC<{ x: number; y: number; w: number; v: number; label: string; value: string; color: string; o?: number; h?: number }> = ({ x, y, w, v, label, value, color, o = 1, h = 40 }) => (
  <g opacity={o}>
    {T_(x, y + 24, label, { size: 28, c: MU, ls: 3 })}
    {T_(x + w, y + 24, value, { size: 28, c: color, a: "end", w: 700, ls: 3 })}
    <rect x={x} y={y + 40} width={w} height={h} rx={5} fill="rgba(3,11,24,0.6)" stroke={DIM} strokeWidth={2} />
    <rect x={x + 4} y={y + 44} width={Math.max(0, (w - 8) * clamp01(v))} height={h - 8} rx={3} fill={color} opacity={0.92} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
  </g>
);

/* ───────────────────────── wireframe rocket (generic schematic, not any real vehicle) ───────────────────────── */
/** Model space: +Y = nose direction, 30 units long, ~4.8 wide. */
const STN: [number, number][] = [[0, 2.0], [1.5, 2.4], [18, 2.4], [19.5, 2.4], [23.5, 1.9], [26.5, 1.05], [29.5, 0.2]];
const NR = 12;
const BODY: WireLine[] = (() => {
  const out: WireLine[] = [];
  const rings = STN.map(([y, r]) => ring([0, y, 0], r, "y", NR, 0.2));
  rings.forEach((pts, i) => { if (i > 0) out.push({ pts, closed: true, w: 0.95 }); });
  for (let k = 0; k < NR; k += 2) out.push({ pts: rings.map((r) => r[k]), w: 0.75 });
  out.push({ pts: ring([0, 11, 0], 2.42, "y", NR, 0.2), closed: true, w: 1.3, color: AM });        // stage band
  out.push({ pts: ring([0, 21, 0], 2.2, "y", NR, 0.2), closed: true, w: 1.1, color: AM });
  for (let a = 0; a < 4; a++) {
    const t = (a / 4) * Math.PI * 2 + 0.2, dx = Math.cos(t), dz = Math.sin(t);
    out.push({ pts: [[dx * 2.4, 8, dz * 2.4], [dx * 6, -0.8, dz * 6], [dx * 6, 0.6, dz * 6], [dx * 2.4, 1.5, dz * 2.4]], closed: true, w: 1.05, color: "#EAF4FF" }); // fins
  }
  const nz = ring([0, -1.8, 0], 1.25, "y", NR, 0.2);
  out.push({ pts: nz, closed: true, w: 1, color: AM });
  for (let k = 0; k < NR; k += 3) out.push({ pts: [rings[0][k], nz[k]], w: 0.8, color: AM });
  return out;
})();
const flameLines = (fl: number, f: number): WireLine[] => {
  if (fl <= 0.02) return [];
  const L = (7 + 3 * Math.sin(f * 1.7)) * fl;
  const out: WireLine[] = [];
  for (let k = 0; k < NR; k += 3) { const a = 0.2 + (k / NR) * Math.PI * 2; out.push({ pts: [[Math.cos(a) * 1.2, -1.8, Math.sin(a) * 1.2], [Math.cos(a) * 0.3, -1.8 - L, Math.sin(a) * 0.3]], color: AM, w: 1.5 }); }
  out.push({ pts: [[0, -1.8, 0], [0, -1.8 - L * 1.25, 0]], color: "#FFE2A8", w: 1.7 });
  return out;
};
/** Rocket centred on (cx,cy); `roll` rotates it on screen (0 = nose up, -PI/2 = nose right). */
const Rocket: React.FC<{ cx: number; cy: number; scale: number; roll?: number; yaw: number; flame?: number; f: number; op?: number }> = ({ cx, cy, scale, roll = 0, yaw, flame = 0, f, op = 1 }) => (
  <Wire3D lines={[...BODY, ...flameLines(flame, f)]} view={{ yaw, pitch: 0.14, roll, dist: 150, scale, cx, cy, pivot: [0, 14, 0] as V3 }} width={2.9} glow={5} opacity={op} />
);

/* ───────────────────────── scene 0: hook — up, then back down ───────────────────────── */
const GROUND = 1340;
const hookPos = (g: number): { x: number; y: number; roll: number; flame: number } => {
  const up = easeOut(clamp01(g / 46));
  let y = lerp(1010, 790, up), x = 490, roll = 0, flame = g < 44 ? 1 : 0;
  if (g > 40) { const s = easeInOut(clamp01((g - 40) / 18)); x = 490 + 100 * s; roll = Math.PI * easeInOut(clamp01((g - 42) / 22)); }
  if (g > 46) { const q = clamp01((g - 46) / 36); y = 790 + (GROUND - 90 - 790) * q * q; }
  return { x, y, roll, flame };
};
const HookLayer: React.FC<{ g: number; cover?: boolean }> = ({ g, cover }) => {
  const f = cover ? 36 : g;
  const p = hookPos(f);
  const upPts: string[] = [], dnPts: string[] = [];
  for (let t = 0; t <= f; t += 2) { const q = hookPos(t); (t <= 44 ? upPts : dnPts).push(`${q.x.toFixed(1)} ${(q.y + (t <= 44 ? 105 : -105) * 0).toFixed(1)}`); }
  const upD = "M 490 " + (GROUND - 4) + " L " + upPts.join(" L ");
  const showDn = f > 50;
  return (
    <g>
      <line x1={110} y1={GROUND} x2={970} y2={GROUND} stroke={LN} strokeWidth={3} opacity={0.9} />
      {Array.from({ length: 22 }, (_, i) => <line key={i} x1={130 + i * 40} y1={GROUND} x2={110 + i * 40} y2={GROUND + 22} stroke={DIM} strokeWidth={2} opacity={0.6} />)}
      {T_(110, GROUND + 52, "GROUND", { size: 22, c: MU })}
      <path d={upD} fill="none" stroke={AM} strokeWidth={5} opacity={0.85} strokeLinecap="round" />
      {showDn && <path d={"M " + dnPts.join(" L ")} fill="none" stroke={RD} strokeWidth={5} strokeDasharray="14 12" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${RD})` }} />}
      <Arrow x1={330} y1={1180} x2={330} y2={900} w={9} color={AM} o={io(f, [0, 10], [0, 1])} />
      <Pill x={330} y={1230} text="UP" size={34} solid pop={1} o={io(f, [0, 8], [0, 1])} />
      <Arrow x1={800} y1={900} x2={800} y2={1180} w={9} color={RD} o={io(f, [52, 64], [0, 1])} />
      <Pill x={800} y={1230} text="BACK DOWN" size={30} color={RD} solid pop={ioB(f, 52, 64)} o={io(f, [52, 60], [0, 1])} />
      <Rocket cx={p.x} cy={p.y} scale={9.4} roll={p.roll} yaw={0.6 + f * 0.035} flame={p.flame} f={f} />
    </g>
  );
};

/* ───────────────────────── scene 1: sideways speed ───────────────────────── */
const Sideways: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.side - 2, T.grav + 2, 8, 8);
  if (o <= 0.01) return null;
  const s = g - T.side;
  const pop = ioB(g, T.side, T.side + 16);
  const cnt = easeOut(clamp01((g - CUE.count) / 52)) * 7.7;
  const kmh = Math.round((cnt / 7.7) * 27700 / 100) * 100;
  const streak = (i: number) => { const x = ((i * 233 - s * 22) % 1000 + 1000) % 1000 + 40; return <line key={i} x1={x} y1={690 + (i % 5) * 64} x2={x + 90 + (i % 3) * 40} y2={690 + (i % 5) * 64} stroke={LN} strokeWidth={3} opacity={0.35} strokeLinecap="round" />; };
  return (
    <g opacity={o}>
      {Array.from({ length: 9 }, (_, i) => streak(i))}
      <Rocket cx={560} cy={810} scale={9.4 * (0.7 + 0.3 * pop)} roll={-Math.PI / 2} yaw={0.55 + s * 0.012} flame={1} f={g} />
      <Arrow x1={760} y1={930} x2={960} y2={930} w={10} color={AM} o={io(g, [T.side + 30, T.side + 42], [0, 1])} />
      <g opacity={io(g, [CUE.count - 4, CUE.count + 6], [0, 1])}>
        <text x={540} y={1090} textAnchor="middle" fontFamily={K.head} fontWeight={700} fontSize={190} letterSpacing={-6} fill={K.text}>{cnt.toFixed(1)}<tspan fontSize={64} fill={AM} letterSpacing={2} dx={14}>KM/S</tspan></text>
      </g>
      <g opacity={io(g, [CUE.count + 52, CUE.count + 64], [0, 1])}>{T_(540, 1150, `≈ ${kmh.toLocaleString("en-US")} KM/H`, { size: 40, c: AM, a: "middle", w: 700, ls: 4 })}</g>
      <Meter x={90} y={1178} w={900} v={easeOut(clamp01((g - 124) / 24))} label="SIDEWAYS" value="ABOUT 7.7 KM/S" color={AM} o={io(g, [118, 128], [0, 1])} h={36} />
      <Meter x={90} y={1268} w={900} v={0.025} label="UP (STEADY ORBIT)" value="≈ 0" color={LN} o={io(g, [138, 148], [0, 1])} h={36} />
    </g>
  );
};

/* ───────────────────────── scene 2: straight up fights gravity ───────────────────────── */
const Gravity: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.grav - 2, T.tilt + 2, 8, 8);
  if (o <= 0.01) return null;
  const s = g - T.grav;
  const y = lerp(1020, 930, clamp01(s / 70));
  const fuel = lerp(0.96, 0.5, clamp01(s / 66));
  return (
    <g opacity={o}>
      <Rocket cx={540} cy={y} scale={9.4} roll={0} yaw={0.6 + s * 0.03} flame={1} f={g} />
      <Arrow x1={350} y1={y + 150} x2={350} y2={y - 150} w={11} color={AM} o={io(g, [T.grav + 6, T.grav + 18], [0, 1])} />
      <Pill x={350} y={y + 215} text="ENGINES" size={30} solid pop={ioB(g, T.grav + 6, T.grav + 18)} o={io(g, [T.grav + 6, T.grav + 14], [0, 1])} />
      <Arrow x1={730} y1={y - 150} x2={730} y2={y + 150} w={11} color={RD} o={io(g, [T.grav + 22, T.grav + 34], [0, 1])} />
      <Pill x={730} y={y + 215} text="GRAVITY" size={30} color={RD} solid pop={ioB(g, T.grav + 22, T.grav + 34)} o={io(g, [T.grav + 22, T.grav + 30], [0, 1])} />
      <Meter x={90} y={1230} w={900} v={fuel} label="FUEL" value={fuel > 0.8 ? "FULL" : fuel > 0.62 ? "BURNING" : "SPENT"} color={AM} o={io(g, [T.grav + 38, T.grav + 48], [0, 1])} h={40} />
    </g>
  );
};

/* ───────────────────────── scenes 3-6: the ascent (one stage) ───────────────────────── */
const R_E = 3000, CX = 560, CYE = 1340 + R_E;                 // Earth: huge circle, top at (560, 1340)
const END = { x: 700, y: 790 };
/** heading from straight up (rad) vs progress t: straight, then tips over little by little, ending nearly flat */
const theta = (t: number) => { const u = clamp01((t - 0.1) / 0.9); return 1.53 * Math.pow(u, 0.85) * (0.4 + 0.6 * u) / 1 * (1 / (0.4 + 0.6)); };
const PATH = (() => {
  const N = 240; const raw: { x: number; y: number; th: number }[] = []; let x = 0, y = 0;
  for (let i = 0; i <= N; i++) { const t = i / N, th = theta(t); raw.push({ x, y, th }); x += Math.sin(th); y += Math.cos(th); }
  const s = (1370 - END.y) / raw[N].y; const x0 = END.x - raw[N].x * s;
  return raw.map((r) => ({ x: x0 + r.x * s, y: 1370 - r.y * s, th: r.th }));
})();
const pathAt = (p: number) => { const f = clamp01(p) * (PATH.length - 1), i = Math.min(PATH.length - 2, Math.floor(f)), k = f - i; const a = PATH[i], b = PATH[i + 1]; return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), th: lerp(a.th, b.th, k) }; };
const progress = (g: number) => g < T.tilt ? 0 : g < T.turn ? 0.43 * easeInOut(clamp01((g - T.tilt) / (T.turn - T.tilt))) ** 0.9 : g < T.flat ? lerp(0.43, 0.8, clamp01((g - T.turn) / (T.flat - T.turn))) : g < T.end ? lerp(0.8, 1, clamp01((g - T.flat) / (T.end - T.flat))) : 1;
const ORB_R = Math.hypot(END.x - CX, END.y - CYE);
const orbAng0 = Math.atan2(END.y - CYE, END.x - CX);            // angle of the end point seen from Earth's centre
const Ascent: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.tilt - 4, T.total + 40, 10, 10);
  if (o <= 0.01) return null;
  const s0 = Math.max(g, T.tilt);
  // rocket position: lead-in (straight up from the pad) then along the path; after the end, along the orbit arc
  let p = progress(s0);
  const lead = easeOut(clamp01((g - (T.tilt - 4)) / 14));
  const pos = pathAt(p);
  let rx = pos.x, ry = pos.y, th = pos.th;
  const sOrb = Math.max(0, g - T.end);
  const dAng = (sOrb * 1.15 * easeInOut(clamp01(sOrb / 40) * 0.6 + 0.4)) / ORB_R;
  if (g > T.end) { const a = orbAng0 + dAng; rx = CX + ORB_R * Math.cos(a); ry = CYE + ORB_R * Math.sin(a); th = Math.PI / 2 + (a - orbAng0) * -1 + (PATH[PATH.length - 1].th - Math.PI / 2) * 0 - (a - orbAng0) * 0; th = PATH[PATH.length - 1].th + (a - orbAng0); }
  const tilt = th;
  const fl = g < T.end + 70 ? 1 : Math.max(0, 1 - (g - T.end - 70) / 20);
  const upto = Math.floor(p * (PATH.length - 1));
  const drawn = PATH.slice(0, upto + 1).map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
  drawn.push(`${rx.toFixed(1)} ${ry.toFixed(1)}`);
  const a1 = orbAng0 + 0.002, a2 = orbAng0 + 0.55;
  const arc = `M ${CX + ORB_R * Math.cos(a1)} ${CYE + ORB_R * Math.sin(a1)} A ${ORB_R} ${ORB_R} 0 0 1 ${CX + ORB_R * Math.cos(a2)} ${CYE + ORB_R * Math.sin(a2)}`;
  const arcOn = io(g, [T.end - 4, T.end + 14], [0, 1]);
  const deg = Math.round((tilt * 180) / Math.PI);
  // gravity-turn annotations: gravity arrow + the straight line it would take without gravity
  const gt = win(g, T.turn + 2, T.flat - 4, 10, 10);
  const dxh = Math.sin(th), dyh = -Math.cos(th);
  return (
    <g opacity={o}>
      {/* Earth + air */}
      <defs>
        <radialGradient id="atmo" gradientUnits="userSpaceOnUse" cx={CX} cy={CYE} r={R_E + 620}>
          <stop offset={R_E / (R_E + 620)} stopColor={AIRC} stopOpacity={0.5} />
          <stop offset={(R_E + 150) / (R_E + 620)} stopColor={AIRC} stopOpacity={0.2} />
          <stop offset={(R_E + 330) / (R_E + 620)} stopColor={AIRC} stopOpacity={0.07} />
          <stop offset={1} stopColor={AIRC} stopOpacity={0} />
        </radialGradient>
        <clipPath id="stageclip"><rect x={0} y={560} width={W} height={860} /></clipPath>
      </defs>
      <g clipPath="url(#stageclip)">
        <circle cx={CX} cy={CYE} r={R_E + 620} fill="url(#atmo)" />
        <circle cx={CX} cy={CYE} r={R_E} fill="#07192F" stroke={LN} strokeWidth={4} />
        <circle cx={CX} cy={CYE} r={R_E - 26} fill="none" stroke={DIM} strokeWidth={2} opacity={0.5} />
        {arcOn > 0.01 && <path d={arc} fill="none" stroke={AM} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={arcOn * 0.9} />}
        <path d={"M " + PATH[0].x.toFixed(1) + " 1372 L " + drawn.join(" L ")} fill="none" stroke={AM} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 9px ${AM})` }} opacity={lead} />
        {gt > 0.01 && (
          <g opacity={gt}>
            <line x1={rx} y1={ry} x2={rx + dxh * 330} y2={ry + dyh * 330} stroke={MU} strokeWidth={3} strokeDasharray="10 10" opacity={0.9} />
            <Arrow x1={rx} y1={ry} x2={rx} y2={ry + 190} w={10} color={RD} o={1} />
          </g>
        )}
        <Rocket cx={rx} cy={ry} scale={7.4} roll={-tilt} yaw={0.55 + (g - T.tilt) * 0.02} flame={fl * lead} f={g} />
      </g>
      {/* labels (outside the clip) */}
      <Pill x={760} y={1285} text="THICK AIR" size={28} color={AIRC} pop={ioB(g, T.tilt + 4, T.tilt + 16)} o={win(g, T.tilt + 4, CUE.bend + 30, 8, 10)} />
      <g opacity={win(g, CUE.bend, T.end + 30, 10, 10)}>
        {T_(86, 700, "TILT", { size: 26, c: MU, ls: 5 })}
        <text x={86} y={776} fontFamily={K.head} fontWeight={700} fontSize={84} letterSpacing={-2} fill={AM}>{deg}°</text>
        {T_(86, 812, "FROM STRAIGHT UP", { size: 22, c: MU })}
      </g>
      <Pill x={rx > 700 ? rx - 190 : rx + 270} y={ry - 18} text="GRAVITY" size={28} color={RD} solid pop={ioB(g, T.turn + 4, T.turn + 16)} o={gt} />
      <Pill x={780} y={1010} text="GRAVITY TURN" size={32} solid pop={ioB(g, CUE.gturn, CUE.gturn + 14)} o={win(g, CUE.gturn, T.flat + 10, 6, 10)} />
      <Pill x={820} y={690} text="ABOVE THE AIR" size={30} color={AIRC} pop={ioB(g, CUE.above, CUE.above + 14)} o={win(g, CUE.above, T.total + 40, 8, 8)} />
      <Pill x={760} y={1285} text="THIN AIR" size={26} color={AIRC} pop={ioB(g, T.flat, T.flat + 12)} o={win(g, T.flat, CUE.above, 8, 8)} />
      <Pill x={520} y={1185} text="STAYS UP" size={30} color={GR} solid pop={ioB(g, T.end + 40, T.end + 54)} o={io(g, [T.end + 40, T.end + 48], [0, 1])} />
    </g>
  );
};

/* ───────────────────────── main shot ───────────────────────── */
export const RocketUpShot: React.FC = () => {
  const g = useCurrentFrame();
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={g} lines={["Why don't rockets", "go straight *up?*"]} at={-30} exitAt={T.side - 12} size={100} top={346} />
      <Headline f={g} lines={["Orbit needs", "*sideways* speed"]} at={T.side + 3} exitAt={T.grav - 8} size={104} />
      <Headline f={g} lines={["Straight up", "wastes *fuel*"]} at={T.grav + 3} exitAt={T.tilt - 8} size={108} />
      <Headline f={g} lines={["Climb first,", "then *tip over*"]} at={T.tilt + 3} exitAt={T.turn - 8} size={108} />
      <Headline f={g} lines={["Gravity *bends*", "the path"]} at={T.turn + 3} exitAt={T.flat - 8} size={108} />
      <Headline f={g} lines={["Nearly flat,", "above the *air*"]} at={T.flat + 3} exitAt={T.end - 8} size={104} />
      <Headline f={g} lines={["Up reaches space.", "*Sideways* stays."]} at={T.end + 3} size={96} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <g opacity={win(g, -10, T.side, 8, 6)}><HookLayer g={g} /></g>
        <Sideways g={g} />
        <Gravity g={g} />
        <Ascent g={g} />
        <g opacity={io(g, [20, 36], [0, 1])}>{T_(540, 1590, "SIMPLIFIED SCHEMATIC · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}</g>
      </svg>

      <Panel o={pn(-10, T.side + 2)} a="THE PROBLEM" b={<>Straight up: <Em>up, then back down</Em></>} c="No sideways speed = no orbit · simplified" />
      <Panel o={pn(T.side, CUE.count + 2)} a="TO STAY IN ORBIT" b={<>You need <Em>sideways</Em> speed</>} c="Falling around Earth, not down · Sky at Night" />
      <Panel o={pn(CUE.count, T.grav + 2)} a="LOW EARTH ORBIT · ABOUT" b={<><Em>7.7 km/s</Em> ≈ 27,700 km/h</>} c="Wikipedia: Orbital speed · varies with altitude" />
      <Panel o={pn(T.grav, T.tilt + 2)} a="GRAVITY LOSS" b={<>Fuel burns just <Em>fighting gravity</Em></>} c="'Gravity drag' · Wikipedia: Gravity turn · simplified" />
      <Panel o={pn(T.tilt, T.turn + 2)} a="FIRST, THE THICK AIR" b={<>Climb up, then <Em>tip over slowly</Em></>} c="Air is thickest up to 10–20 km · Sky at Night" />
      <Panel o={pn(T.turn, T.flat + 2)} a="THE GRAVITY TURN" b={<>Gravity <Em>helps bend</Em> the path</>} c="Little steering needed · Wikipedia: Gravity turn" />
      <Panel o={pn(T.flat, T.end + 2)} a="HIGH UP, ABOVE THE AIR" b={<>Almost <Em>flat</Em>, flying sideways</>} c="Path flattens by about 160 km · Sky at Night" />
      <Panel o={pn(T.end, T.total + 20)} a="NOW YOU KNOW" b={<>Up reaches space. <Em>Sideways</Em> stays.</>} c="Fast enough sideways = you keep falling around Earth" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 296, display: "flex", justifyContent: "center", fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>HOW IT WORKS · 20</div>
    <Headline f={200} lines={["Why don't rockets", "go straight *up?*"]} at={0} size={108} top={380} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Frame />
      <HookLayer g={96} cover />
      {T_(540, 1590, "SIMPLIFIED SCHEMATIC · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}
    </svg>
  </>
);
void H;
