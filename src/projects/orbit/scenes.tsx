import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Meter, Tag, clamp01, ioB, meshPhase, W, H, TAU } from "../gearbox/kit";
import { FAST, LAP, MID, R, R0, SLOW, TURN_PHI, at, climb, landDeg, trail } from "./physics";
import type { P } from "./physics";

/**
 * HOW IT WORKS #15 — How rockets reach orbit          30 s · 1080×1920 · 30 fps · 900 frames
 *
 * BEATS PLAN — one idea per beat, the picture shows exactly what the voice says (VO phrases: public/projects/orbit/vo.json)
 *   0   hook   "Orbit isn't about going up. It's about going sideways."  a big UP arrow gets crossed out; a SIDEWAYS arrow lights up
 *   112 up     "A ball thrown up just comes back down."                  cannon fires a ball straight up; it rises, stops, falls back to the tower
 *   175 side   "Throw it sideways harder and it lands farther."          camera-locked zoom-out reveals the round Earth; two integrated shots: slow lands near, faster lands farther
 *   249 orbit  "Fast enough and the Earth curves away as fast as it falls. That's an orbit."  third shot at exactly circular speed closes a full circle; dashed straight line shows where it would go
 *   391 speed  "That's about 28,000 kilometers an hour."                 speed readout inside the Earth counts 0 → 28,000 km/h while the ball keeps looping
 *   470 turn   "So rockets climb out of the air then tip sideways."      cannon becomes a launch pad; rocket climbs through the thick air, tips over and joins the circle
 *   553 fuel   "Nine tenths of a rocket's weight is fuel."               rocket stack (3 sections) fills with fuel; 10 weight blocks, 9 amber = fuel (Saturn V, NASA)
 *   620 stage  "Empty tanks drop off so the rest speeds up."              bottom section burns empty and drops, then the next; weight meter falls, speed meter rises
 *   693 loop   "Engines off, it falls around Earth every ninety minutes." flame goes out, the craft coasts once round the circle; clock counts 0 → 90 minutes
 *   795 end    Follow-for-more end card (same as #13/#14)
 *
 * Facts on screen (sources/computations in the delivery notes):
 *  - orbit speed ≈ 28,000 km/h: v = sqrt(GM/r), GM = 3.986004418e14 m³/s², r = 6371 km + 400 km → 7.67 km/s = 27,620 km/h (28,040 at 200 km; NASA: ISS 17,500 mph ≈ 28,160 km/h)
 *  - ~90 min per lap: T = 2π sqrt(r³/GM) = 92.4 min at 400 km; NASA: "orbits Earth every 90 minutes"
 *  - gravity at ISS height still ≈ 89%: g = g0 (R/(R+h))² = 88.5% at 400 km; NASA Glenn: 88.8% at 250 miles
 *  - fuel ≈ 90% of liftoff weight: Saturn V, NASA Apollo 4 press kit: 6,220,025 lb at liftoff; propellant ≈ 4.4 M (S-IC) + ≈ 0.945 M (S-II) + 0.23 M (S-IVB) lb ≈ 5.58 M lb = 89.7%
 * SIMPLIFIED (tagged on screen): Earth is drawn fat and the orbit is drawn high, the shots run partly in slow motion, the rocket path is a drawing (not a flight
 * simulation), the Saturn-V-like stack has three sections. The cannonball paths themselves are integrated (RK4, inverse-square gravity) in physics.ts.
 * Everything is a pure function of the frame.
 */

/** Global frames from public/projects/orbit/vo.json. Keep in sync with soundtrack.py. */
export const T = { up: 112, side: 175, orbit: 249, speed: 391, turn: 470, fuel: 553, stage: 620, loop: 693, end: 795, total: 900 };
export const CUTS = [0, 112, 175, 249, 391, 470, 553, 620, 693, 795];
/** Key cue frames (used by soundtrack.py) */
export const SF = 0.7; // slow-motion factor for the first two shots
export const CUE = {
  cross: 52, side: 68, throw: 114, land0: 168, zoom: 166, fire1: 192, fire2: 214, fire3: 252, tag: 359, count0: 398, count1: 452,
  launch: 474, tip: 508, join: 538, fill: 560, blocks: 572, sep1: 640, sep2: 664, cut: 693, lap: 783,
};
export const LAND1 = CUE.fire1 + SLOW.land! / SF, LAND2 = CUE.fire2 + MID.land! / SF;

const AM = K.amber, LN = K.line;
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const NS = { vectorEffect: "non-scaling-stroke" } as const;
const CX = 540;

/* ───────────── shared bits (same look as #14) ───────────── */
const Frame: React.FC = () => (
  <g>
    {[[VIEW.x0, VIEW.y0, 1, 1], [VIEW.x1, VIEW.y0, -1, 1], [VIEW.x0, VIEW.y1, 1, -1], [VIEW.x1, VIEW.y1, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={K.lineDim} strokeWidth={2.4} />
    ))}
  </g>
);
const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 24} letterSpacing={o.ls ?? (o.size ?? 24) * 0.08} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);
const Panel: React.FC<{ o: number; a: string; b: React.ReactNode; c?: string }> = ({ o, a, b, c }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1412, height: 138, opacity: o, borderRadius: 12, border: `2px solid ${K.lineDim}`, background: "rgba(3,11,24,0.85)", boxSizing: "border-box", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4 }}>
    <div style={{ fontFamily: K.mono, fontSize: 27, letterSpacing: 4, color: AM, fontWeight: 700, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: K.head, fontSize: 43, fontWeight: 700, color: K.text, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b}</div>
    {c && <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 1.5, color: K.muted, whiteSpace: "nowrap", fontWeight: 500 }}>{c}</div>}
  </div>
);
const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: AM }}>{children}</span>;

/** SVG pill label centred at (x, y). */
const Pill: React.FC<{ x: number; y: number; text: string; o?: number; color?: string; size?: number; solid?: boolean }> = ({ x, y, text, o = 1, color = AM, size = 30, solid }) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.9;
  return (
    <g opacity={o} transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? color : "rgba(6,20,42,0.92)"} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={size * 0.35} fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={solid ? K.bgDeep : color}>{text}</text>
    </g>
  );
};

/* ───────────── camera: zoom-out (objects scale; the camera itself never moves) ───────────── */
const cam = (g: number) => {
  const z = io(g, [CUE.zoom, CUE.zoom + 30], [0, 1], easeInOut);
  return { s: lerp(2.0, 1.0, z), ay: lerp(1180, 766, z) };
};
const barrelDeg = (g: number) => lerp(-90, 0, io(g, [CUE.zoom + 6, CUE.zoom + 26], [0, 1], easeInOut));
const HV = 215;                                                  // apex height of the straight-up throw (world px)
const FV = 54;                                                   // frames in the air for the straight-up throw
const upH = (u: number) => 4 * HV * u * (1 - u);                // flat-ground parabola (constant gravity) for the short throw

/* ───────────── the Earth world ───────────── */
const Planet: React.FC<{ s: number; ay: number; o: number; air: number }> = ({ s, ay, o, air }) => {
  const cy = ay + s * R0, rr = s * R, ra = s * (R + 50);
  const ticks = Array.from({ length: 120 }, (_, i) => (i / 120) * TAU);
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id="atm" cx="0.5" cy="0.5" r="0.5">
          <stop offset={(R - 4) / (R + 50)} stopColor={LN} stopOpacity={0.5 * air} />
          <stop offset="1" stopColor={LN} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="earth" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stopColor="#0E2F5C" /><stop offset="1" stopColor="#061A36" /></radialGradient>
      </defs>
      <circle cx={CX} cy={cy} r={ra} fill="url(#atm)" />
      <circle cx={CX} cy={cy} r={rr} fill="url(#earth)" stroke={LN} strokeWidth={4} {...NS} />
      <circle cx={CX} cy={cy} r={rr * 0.72} fill="none" stroke={K.lineDim} strokeWidth={1.5} strokeDasharray="10 12" opacity={0.5} {...NS} />
      <circle cx={CX} cy={cy} r={rr * 0.44} fill="none" stroke={K.lineDim} strokeWidth={1.5} strokeDasharray="10 12" opacity={0.4} {...NS} />
      {ticks.map((a, i) => (
        <line key={i} x1={CX + Math.sin(a) * rr} y1={cy - Math.cos(a) * rr} x2={CX + Math.sin(a) * (rr - 12 * Math.min(s, 1.4))} y2={cy - Math.cos(a) * (rr - 12 * Math.min(s, 1.4))} stroke={LN} strokeWidth={1.6} opacity={0.3} {...NS} />
      ))}
    </g>
  );
};

/** cannon on a tower, drawn in world scale. deg: barrel angle (-90 = straight up, 0 = sideways). kick: recoil 0..1 */
const Cannon: React.FC<{ s: number; ay: number; deg: number; o: number; flash: number; kick?: number }> = ({ s, ay, deg, o, flash, kick = 0 }) => {
  if (o <= 0.01) return null;
  const tower = R0 - R + 4;
  return (
    <g opacity={o}>
      <g transform={`translate(${CX} ${ay}) scale(${s})`}>
        <path d={`M -9 ${tower} L -6 4 L 6 4 L 9 ${tower} Z`} fill="#0A2548" stroke={LN} strokeWidth={3} strokeLinejoin="round" {...NS} />
        <line x1={-7} y1={22} x2={7} y2={12} stroke={K.lineDim} strokeWidth={1.6} {...NS} /><line x1={-8} y1={36} x2={8} y2={22} stroke={K.lineDim} strokeWidth={1.6} {...NS} />
        <g transform={`rotate(${deg}) translate(${-kick * 7} 0)`}>
          <rect x={-6} y={-9} width={46} height={18} rx={5} fill="#0A2548" stroke={AM} strokeWidth={3.4} {...NS} />
          <rect x={30} y={-11} width={10} height={22} rx={3} fill={AM} />
          {flash > 0 && <g opacity={flash}><circle cx={46} cy={0} r={8 + 18 * (1 - flash)} fill={AM} opacity={0.85} /><circle cx={46} cy={0} r={4 + 8 * (1 - flash)} fill="#fff" opacity={0.9} /></g>}
        </g>
        <circle cx={0} cy={0} r={11} fill="#0A2548" stroke={AM} strokeWidth={3.4} {...NS} />
      </g>
    </g>
  );
};
const Ball: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r * 2.3} fill={AM} opacity={0.18} />
    <circle cx={x} cy={y} r={r} fill={AM} stroke="#fff" strokeWidth={2} {...NS} />
  </g>
);
const Cross: React.FC<{ x: number; y: number; r?: number; color?: string; o?: number }> = ({ x, y, r = 12, color = AM, o = 1 }) => (
  <g opacity={o} stroke={color} strokeWidth={5} strokeLinecap="round"><line x1={x - r} y1={y - r} x2={x + r} y2={y + r} /><line x1={x + r} y1={y - r} x2={x - r} y2={y + r} /></g>
);
const Burst: React.FC<{ x: number; y: number; p: number; color?: string }> = ({ x, y, p, color = AM }) => (p > 0 && p < 1 ? <circle cx={x} cy={y} r={10 + 54 * p} fill="none" stroke={color} strokeWidth={4} opacity={(1 - p) * 0.9} /> : null);

/** little rocket pointing up in local coords, length ≈ 56; thrust 0..1 */
const RocketIcon: React.FC<{ thrust: number; f: number }> = ({ thrust, f }) => (
  <g>
    {thrust > 0.02 && <path d={`M -7 26 Q 0 ${40 + thrust * (28 + 10 * Math.sin(f * 1.7))} 7 26 Z`} fill={AM} opacity={0.95} />}
    {thrust > 0.02 && <path d={`M -3.5 26 Q 0 ${34 + thrust * (14 + 6 * Math.sin(f * 2.3))} 3.5 26 Z`} fill="#fff" opacity={0.9} />}
    <path d="M -12 14 L -22 30 L -9 24 Z M 12 14 L 22 30 L 9 24 Z" fill="#0A2548" stroke={LN} strokeWidth={2.4} strokeLinejoin="round" {...NS} />
    <path d="M 0 -32 Q 12 -14 11 22 L -11 22 Q -12 -14 0 -32 Z" fill="#0A2548" stroke={K.text} strokeWidth={3} strokeLinejoin="round" {...NS} />
    <circle cx={0} cy={-6} r={5} fill={AM} />
  </g>
);

/** The whole Earth stage (beats 0–6 and 8). */
const EarthStage: React.FC<{ g: number }> = ({ g }) => {
  const { s, ay } = cam(g);
  const M = (p: P): [number, number] => [CX + s * p.x, ay + s * (p.y + R0)];
  const cy = ay + s * R0;
  const worldO = 1 - io(g, [T.fuel - 6, T.fuel + 4], [0, 1]) + io(g, [T.loop - 8, T.loop + 2], [0, 1]) * (g > T.stage ? 1 : 0);
  const deg = barrelDeg(g);
  const cannonO = 1 - io(g, [T.turn - 14, T.turn - 4], [0, 1]);
  /* hook arrows (s = 2) */
  const upArrow = io(g, [6, 30], [0, 1], easeOut) * (1 - io(g, [96, 108], [0, 1]));
  const crossP = ioB(g, CUE.cross, CUE.cross + 10);
  const sideArrow = io(g, [CUE.side, CUE.side + 22], [0, 1], easeOut) * (1 - io(g, [T.up - 12, T.up - 2], [0, 1]));
  /* straight-up throw */
  const uV = (g - CUE.throw) / FV;
  const showUp = g >= CUE.throw && g < CUE.zoom + 8;
  const fadeUp = 1 - io(g, [CUE.zoom - 2, CUE.zoom + 8], [0, 1]);
  const hv = upH(clamp01(uV));
  const downSide = uV > 0.5 ? 20 : 0;
  const tower0 = M({ x: 0, y: -R0 });
  const ballUp: [number, number] = [tower0[0] + (uV > 0.5 ? 20 * clamp01((uV - 0.5) * 6) : 0), tower0[1] - s * hv];
  /* shots */
  const u1 = (g - CUE.fire1) * SF, u2 = (g - CUE.fire2) * SF, u3 = g - CUE.fire3;
  const l1 = g >= CUE.fire1 && u1 >= (SLOW.land ?? 0), l2 = g >= CUE.fire2 && u2 >= (MID.land ?? 0);
  const flash = (f0: number) => clamp01(1 - (g - f0) / 6) * (g >= f0 ? 1 : 0);
  const kick = (f0: number) => clamp01(1 - (g - f0) / 8) * (g >= f0 ? 1 : 0);
  const fl = Math.max(flash(CUE.throw), flash(CUE.fire1), flash(CUE.fire2), flash(CUE.fire3));
  const kk = Math.max(kick(CUE.throw), kick(CUE.fire1), kick(CUE.fire2), kick(CUE.fire3));
  const trailsO = 1 - io(g, [T.speed + 60, T.turn - 8], [0, 1]);
  const ringO = io(g, [CUE.fire3 - 2, CUE.fire3 + 14], [0, 1]) * (1 - io(g, [T.turn - 12, T.turn - 2], [0, 1]) + io(g, [T.loop - 2, T.loop + 8], [0, 1]) * (g > T.stage ? 1 : 0));
  const ballFastO = (g >= CUE.fire3 ? 1 : 0) * (1 - io(g, [T.turn - 12, T.turn - 3], [0, 1]));
  const pFast = at(FAST, Math.min(u3, FAST.pts.length - 1));
  const lapDone = clamp01(u3 / LAP);
  /* rocket climb (beat 6) */
  const tClimb = clamp01((g - CUE.launch) / (CUE.join - CUE.launch));
  const rk = climb(tClimb);
  const rkOn = g >= T.turn - 6 && g < T.fuel - 2;
  const lateLap = g > CUE.join ? ((g - CUE.join) * TAU) / LAP : 0;
  const rkPhi = tClimb < 1 ? rk.phi : TURN_PHI + lateLap;
  const rkPos: P = tClimb < 1 ? rk : { x: R0 * Math.sin(rkPhi), y: -R0 * Math.cos(rkPhi) };
  const rkHead = tClimb < 1 ? rk.h : rkPhi + Math.PI / 2;
  const rkO = io(g, [T.turn - 6, T.turn + 2], [0, 1]) * (1 - io(g, [T.fuel - 10, T.fuel - 2], [0, 1]));
  const thrustR = io(g, [CUE.launch - 6, CUE.launch + 4], [0, 1]) * (1 - io(g, [T.fuel - 18, T.fuel - 8], [0, 1]));
  const pathN = Math.round(tClimb * 80);
  const pathPts = (a: number, b: number) => {
    let d = "";
    for (let i = Math.round(a * 80); i <= Math.min(pathN, Math.round(b * 80)); i++) { const c = climb(i / 80); const [x, y] = M(c); d += (d ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1); }
    return d;
  };
  const airO = io(g, [T.turn - 4, T.turn + 8], [0, 1]) * (1 - io(g, [T.fuel - 12, T.fuel - 2], [0, 1]));
  /* beat 9: the craft coasts once round */
  const uL = clamp01((g - T.loop) / LAP);
  const lp = g >= T.loop - 2;
  const satPhi = uL * TAU;
  const satPos: P = { x: R0 * Math.sin(satPhi), y: -R0 * Math.cos(satPhi) };
  const satO = io(g, [T.loop - 6, T.loop + 2], [0, 1]);
  const flame = g < T.loop + 12 ? clamp01(1 - (g - (T.loop + 2)) / 10) : 0;
  const arcD = (() => {
    let d = ""; const n = Math.max(1, Math.round(uL * 72));
    for (let i = 0; i <= n; i++) { const a = (i / 72) * TAU; const [x, y] = M({ x: R0 * Math.sin(a), y: -R0 * Math.cos(a) }); d += (d ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1); }
    return uL > 0.001 ? d : "";
  })();
  const mins = Math.round(90 * uL);
  /* speed readout */
  const spd = Math.round(io(g, [CUE.count0, CUE.count1], [0, 28000], easeInOut) / 100) * 100;
  const spdO = win(g, T.speed + 2, T.turn - 2, 6, 8);
  const [bx3, by3] = M(pFast);
  return (
    <g>
      <clipPath id="vclip"><rect x={VIEW.x0} y={VIEW.y0} width={VIEW.x1 - VIEW.x0} height={VIEW.y1 - VIEW.y0} /></clipPath>
      <g clipPath="url(#vclip)">
        <Planet s={s} ay={ay} o={worldO} air={g < T.turn - 6 ? 0.25 : 0.25 + 0.75 * airO} />
        <g opacity={worldO}>
          {/* hook: UP is crossed out, SIDEWAYS lights up */}
          {upArrow > 0.01 && (
            <g opacity={upArrow}>
              <line x1={CX} y1={ay - 30} x2={CX} y2={ay - 30 - 340 * upArrow} stroke={LN} strokeWidth={10} strokeLinecap="round" strokeDasharray="22 14" />
              <path d={`M ${CX - 34} ${ay - 30 - 340 * upArrow + 8} L ${CX} ${ay - 30 - 340 * upArrow - 40} L ${CX + 34} ${ay - 30 - 340 * upArrow + 8} Z`} fill={LN} />
              <Pill x={CX + 130} y={ay - 220} text="UP" color={LN} size={34} o={clamp01(upArrow * 2 - 1)} />
              <Cross x={CX} y={ay - 190} r={46 * crossP} color={K.red} o={crossP} />
            </g>
          )}
          {sideArrow > 0.01 && (
            <g opacity={sideArrow} style={{ filter: `drop-shadow(0 0 14px ${AM})` }}>
              <line x1={CX + 50} y1={ay - 28} x2={CX + 50 + 330 * sideArrow} y2={ay - 28} stroke={AM} strokeWidth={14} strokeLinecap="round" />
              <path d={`M ${CX + 50 + 330 * sideArrow + 52} ${ay - 28} L ${CX + 50 + 330 * sideArrow - 8} ${ay - 70} L ${CX + 50 + 330 * sideArrow - 8} ${ay + 14} Z`} fill={AM} />
            </g>
          )}
          {/* straight-up throw */}
          {showUp && (
            <g opacity={fadeUp}>
              {uV > 0 && (
                <>
                  <line x1={tower0[0]} y1={tower0[1]} x2={tower0[0]} y2={tower0[1] - s * upH(clamp01(Math.min(uV, 0.5)))} stroke={LN} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />
                  {uV > 0.5 && <line x1={tower0[0] + 20} y1={tower0[1] - s * HV} x2={tower0[0] + 20} y2={ballUp[1]} stroke={AM} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />}
                  {uV > 0.5 && <line x1={tower0[0]} y1={tower0[1] - s * HV} x2={tower0[0] + 20} y2={tower0[1] - s * HV} stroke={K.lineDim} strokeWidth={3} />}
                </>
              )}
              {uV >= 0 && uV <= 1.02 && <Ball x={ballUp[0]} y={ballUp[1]} r={7 * s + 3} />}
              <Burst x={tower0[0] + 10} y={tower0[1]} p={clamp01((g - CUE.land0) / 14)} />
              <Pill x={CX + 160} y={tower0[1] - s * HV + 4} text="TOP" color={K.muted} size={24} o={win(g, CUE.throw + 24, CUE.throw + 50, 4, 8)} />
              <Pill x={CX + 190} y={tower0[1] - s * HV * 0.45} text="FALLS BACK" color={AM} size={28} o={win(g, CUE.throw + 36, CUE.zoom, 6, 6)} />
            </g>
          )}
          {/* the three shots */}
          <g opacity={trailsO}>
            {g >= CUE.fire1 && <path d={trail(SLOW, Math.min(u1, SLOW.pts.length - 1), M)} fill="none" stroke={LN} strokeWidth={5} strokeLinecap="round" opacity={0.85} />}
            {g >= CUE.fire2 && <path d={trail(MID, Math.min(u2, MID.pts.length - 1), M)} fill="none" stroke={LN} strokeWidth={5} strokeLinecap="round" />}
            {g >= CUE.fire1 && !l1 && <Ball {...(() => { const [x, y] = M(at(SLOW, u1)); return { x, y }; })()} r={10} />}
            {g >= CUE.fire2 && !l2 && <Ball {...(() => { const [x, y] = M(at(MID, u2)); return { x, y }; })()} r={10} />}
            {l1 && <><Cross {...(() => { const [x, y] = M(SLOW.landPt!); return { x, y }; })()} r={13} /><Burst {...(() => { const [x, y] = M(SLOW.landPt!); return { x, y }; })()} p={clamp01((g - LAND1) / 14)} /></>}
            {l2 && <><Cross {...(() => { const [x, y] = M(MID.landPt!); return { x, y }; })()} r={13} /><Burst {...(() => { const [x, y] = M(MID.landPt!); return { x, y }; })()} p={clamp01((g - LAND2) / 14)} /></>}
          </g>
          {/* orbit ring + straight line */}
          {ringO > 0.01 && <circle cx={CX} cy={cy} r={s * R0} fill="none" stroke={K.lineDim} strokeWidth={2.4} strokeDasharray="8 10" opacity={ringO * 0.9} {...NS} />}
          {g >= CUE.fire3 && g < T.speed && (
            <g opacity={io(g, [CUE.fire3 + 2, CUE.fire3 + 14], [0, 1]) * (1 - io(g, [T.speed - 20, T.speed - 6], [0, 1]))}>
              <line x1={CX} y1={ay} x2={VIEW.x1 - 6} y2={ay} stroke={K.muted} strokeWidth={3} strokeDasharray="14 12" />
              {T_(VIEW.x1 - 14, ay - 18, "STRAIGHT LINE", { c: K.muted, a: "end", size: 22 })}
            </g>
          )}
          {g >= CUE.fire3 && trailsO > 0 && <path d={trail(FAST, Math.min(u3, LAP), M)} fill="none" stroke={AM} strokeWidth={7} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${AM})` }} opacity={trailsO} />}
          {ballFastO > 0.01 && trailsO > 0 && <Ball x={bx3} y={by3} r={11} o={ballFastO} />}
          {/* the cannon */}
          <Cannon s={s} ay={ay} deg={deg} o={cannonO} flash={fl} kick={kk} />
          {/* beat 6: rocket path */}
          {g >= T.turn - 6 && g < T.fuel && (
            <g opacity={rkO}>
              <path d={pathPts(0, 0.42)} fill="none" stroke={LN} strokeWidth={6} strokeLinecap="round" />
              <path d={pathPts(0.42, 1)} fill="none" stroke={AM} strokeWidth={6} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${AM})` }} />
              <Pill x={300} y={1010} text="THICK AIR" color={LN} size={28} o={win(g, T.turn + 6, T.fuel - 6, 8, 8)} />
              <line x1={372} y1={1010} x2={CX - s * (R + 12) * Math.sin(0.62) + 36} y2={cy - s * (R + 12) * Math.cos(0.62)} stroke={LN} strokeWidth={2.4} strokeDasharray="6 7" opacity={win(g, T.turn + 6, T.fuel - 6, 8, 8) * 0.8} />
              <Pill x={CX - 60} y={706} text="UP" color={LN} size={30} o={win(g, CUE.launch + 8, CUE.tip + 14, 6, 6)} />
              <Pill x={800} y={806} text="SIDEWAYS" color={AM} size={30} o={win(g, CUE.tip + 20, T.fuel - 6, 8, 8)} />
              {rkO > 0.01 && (() => { const [x, y] = M(rkPos); return <g transform={`translate(${x} ${y - 4}) rotate(${(rkHead * 180) / Math.PI + 90}) scale(0.85)`}><RocketIcon thrust={thrustR} f={g} /></g>; })()}
            </g>
          )}
          {/* beat 9: coast */}
          {lp && g < T.end && (
            <g opacity={satO}>
              {arcD && <path d={arcD} fill="none" stroke={AM} strokeWidth={7} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${AM})` }} />}
              {(() => {
                const [x, y] = M(satPos);
                return (
                  <g transform={`translate(${x} ${y}) rotate(${(satPhi * 180) / Math.PI + 90})`}>
                    {flame > 0.02 && <path d={`M -7 18 Q 0 ${28 + 34 * flame} 7 18 Z`} fill={AM} opacity={flame} />}
                    <rect x={-8} y={-17} width={16} height={34} rx={4} fill="#0A2548" stroke={K.text} strokeWidth={3} {...NS} />
                    <rect x={-44} y={-6} width={30} height={12} fill="rgba(92,211,255,0.25)" stroke={LN} strokeWidth={2.4} {...NS} />
                    <rect x={14} y={-6} width={30} height={12} fill="rgba(92,211,255,0.25)" stroke={LN} strokeWidth={2.4} {...NS} />
                    <circle cx={0} cy={-6} r={3.5} fill={AM} />
                  </g>
                );
              })()}
              <Pill x={800} y={720} text="ENGINES OFF" color={AM} size={28} o={win(g, T.loop + 2, T.loop + 56, 6, 8)} />
              <Pill x={800} y={720} text="1 LAP" color={AM} size={28} o={win(g, T.loop + 70, T.end + 4, 6, 3)} solid />
            </g>
          )}
        </g>
      </g>
      {/* "AN ORBIT" tag */}
      <Pill x={300} y={716} text="AN ORBIT" color={AM} size={30} solid o={win(g, CUE.tag, T.speed + 6, 6, 10)} />
      {/* shot labels sit on the planet, beside the landing crosses */}
      {g >= CUE.fire1 && (() => {
        const [x1, y1] = M(SLOW.landPt!), [x2, y2] = M(MID.landPt!);
        const o1 = win(g, LAND1 + 2, T.orbit + 60, 6, 8), o2 = win(g, LAND2 + 2, T.orbit + 60, 6, 8);
        return (
          <g>
            <Pill x={x1 - 70} y={y1 + 80} text="LANDS NEAR" color={LN} size={24} o={o1} />
            <Pill x={x2 - 130} y={y2 + 40} text="LANDS FARTHER" color={LN} size={24} o={o2} />
          </g>
        );
      })()}
      {/* speed readout inside the Earth */}
      <g opacity={spdO}>
        {T_(CX, cy - 120, "SPEED NEEDED", { c: K.muted, a: "middle", size: 26 })}
        <text x={CX} y={cy + 20} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={118} letterSpacing={-4} fill={spd >= 28000 ? AM : K.text} style={{ fontVariantNumeric: "tabular-nums" }}>{spd.toLocaleString("en-US")}</text>
        {T_(CX, cy + 84, "KM / H", { c: AM, a: "middle", size: 40, w: 700 })}
        <g opacity={clamp01((g - CUE.count1) / 8)}>{T_(CX, cy + 140, "ABOUT", { c: K.muted, a: "middle", size: 26 })}</g>
      </g>
      {/* beat 9: lap clock inside the Earth */}
      <g opacity={win(g, T.loop + 6, T.end + 4, 8, 3)}>
        {T_(CX, cy - 100, "TIME FOR ONE LAP", { c: K.muted, a: "middle", size: 26 })}
        <text x={CX} y={cy + 24} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={140} letterSpacing={-4} fill={mins >= 90 ? AM : K.text} style={{ fontVariantNumeric: "tabular-nums" }}>{mins}</text>
        {T_(CX, cy + 88, "MINUTES", { c: AM, a: "middle", size: 38, w: 700 })}
      </g>
    </g>
  );
};

/* ───────────── beats 7–8: the rocket stack ───────────── */
const SX = 300;
type Sec = { id: "s1" | "s2" | "s3"; hw: number; y0: number; y1: number };
const SECS: Sec[] = [
  { id: "s3", hw: 36, y0: 815, y1: 915 },
  { id: "s2", hw: 50, y0: 921, y1: 1071 },
  { id: "s1", hw: 64, y0: 1077, y1: 1297 },
];
const Stack: React.FC<{ g: number }> = ({ g }) => {
  const fillIn = io(g, [CUE.fill, CUE.fill + 22], [0, 1], easeOut);
  const lift = io(g, [T.stage + 8, T.loop - 6], [0, 1], easeInOut) * 52;
  const sep = (g0: number) => Math.max(0, g - g0);
  const drain = (a: number, b: number) => 1 - io(g, [a, b], [0, 1], (t) => t);
  const o = win(g, T.fuel - 2, T.loop - 2, 8, 8);
  if (o <= 0.01) return null;
  const shake = g > T.stage && g < CUE.sep1 + 6 ? Math.sin(g * 2.4) * 1.5 : 0;
  const frac = (id: Sec["id"]) => (id === "s1" ? (g < T.stage ? 1 : drain(T.stage + 2, CUE.sep1 - 2)) : id === "s2" ? (g < CUE.sep1 ? 1 : drain(CUE.sep1 + 8, CUE.sep2 - 2)) : (g < CUE.sep2 ? 1 : 0.9 - 0 * 1));
  const gone = (id: Sec["id"]) => (id === "s1" ? CUE.sep1 : id === "s2" ? CUE.sep2 : 9999);
  const burning = (id: Sec["id"]) => (id === "s1" ? g >= T.fuel + 6 && g < CUE.sep1 : id === "s2" ? g >= CUE.sep1 + 6 && g < CUE.sep2 : g >= CUE.sep2 + 6);
  const sec = (s: Sec) => {
    const t0 = gone(s.id);
    const dt = sep(t0);
    const dropY = dt > 0 ? 0.55 * dt * dt : 0, rot = dt > 0 ? dt * (s.id === "s1" ? 1.1 : -1.4) : 0, so = dt > 0 ? 1 - io(g, [t0 + 12, t0 + 34], [0, 1]) : 1;
    const fy = s.id === "s1" ? 0 : 0;
    const ty = (s.id === "s1" || (s.id === "s2" && g < CUE.sep1) ? 0 : 0) + fy;
    void ty;
    const stayLift = dt > 0 ? 0 : -lift;
    const cxx = SX + (dt > 0 ? (s.id === "s1" ? -dt * 1.6 : dt * 1.8) : 0) + shake;
    const h = s.y1 - s.y0, inner = (h - 14) * 0.9;
    const f = frac(s.id) * fillIn * (s.id === "s3" && g >= CUE.sep2 ? 1 : 1);
    const fh = inner * clamp01(f);
    const th = burning(s.id) ? 1 : 0;
    return (
      <g key={s.id} opacity={so} transform={`translate(${cxx} ${dropY + stayLift}) rotate(${rot} 0 ${(s.y0 + s.y1) / 2})`}>
        {/* engine bells */}
        {s.id === "s1" ? [-34, 0, 34].map((x) => <path key={x} d={`M ${x - 14} ${s.y1} L ${x + 14} ${s.y1} L ${x + 20} ${s.y1 + 28} L ${x - 20} ${s.y1 + 28} Z`} fill="#0A2548" stroke={LN} strokeWidth={2.6} {...NS} />) : <path d={`M -16 ${s.y1} L 16 ${s.y1} L 22 ${s.y1 + 14} L -22 ${s.y1 + 14} Z`} fill="#0A2548" stroke={LN} strokeWidth={2.6} {...NS} />}
        {th > 0 && (s.id === "s1" ? [-34, 0, 34] : [0]).map((x) => <g key={x}><path d={`M ${x - 12} ${s.y1 + (s.id === "s1" ? 28 : 14)} Q ${x} ${s.y1 + (s.id === "s1" ? 28 : 14) + 62 + 14 * Math.sin(g * 1.9 + x)} ${x + 12} ${s.y1 + (s.id === "s1" ? 28 : 14)} Z`} fill={AM} opacity={0.95} /><path d={`M ${x - 5} ${s.y1 + (s.id === "s1" ? 28 : 14)} Q ${x} ${s.y1 + (s.id === "s1" ? 28 : 14) + 30 + 8 * Math.sin(g * 2.6 + x)} ${x + 5} ${s.y1 + (s.id === "s1" ? 28 : 14)} Z`} fill="#fff" opacity={0.9} /></g>)}
        <rect x={-s.hw} y={s.y0} width={s.hw * 2} height={h} rx={8} fill="#0A2548" stroke={K.text} strokeWidth={3.4} {...NS} />
        <clipPath id={"tk" + s.id}><rect x={-s.hw + 7} y={s.y0 + 7} width={s.hw * 2 - 14} height={h - 14} rx={4} /></clipPath>
        <g clipPath={`url(#tk${s.id})`}>
          <rect x={-s.hw} y={s.y1 - 7 - fh} width={s.hw * 2} height={fh} fill={AM} opacity={0.72} />
        </g>
        <line x1={-s.hw} y1={s.y0 + 26} x2={s.hw} y2={s.y0 + 26} stroke={K.lineDim} strokeWidth={1.6} opacity={0.0} />
      </g>
    );
  };
  return (
    <g opacity={o}>
      {/* speed lines (grow as parts drop) */}
      {g > T.stage && Array.from({ length: 10 }, (_, i) => {
        const sp = 18 + 22 * io(g, [T.stage, T.loop - 10], [0, 1]);
        const x = SX - 112 + (i % 5) * 56 + (i > 4 ? 28 : 0);
        const y = ((g * sp + i * 97) % 680) + 700;
        const len = 30 + 40 * io(g, [T.stage, T.loop - 10], [0, 1]);
        return <line key={i} x1={x} y1={y} x2={x} y2={y + len} stroke={LN} strokeWidth={3} strokeLinecap="round" opacity={0.28 * Math.min(1, (g - T.stage) / 12) * (y < 1380 ? 1 : 0)} />;
      })}
      {SECS.map(sec)}
      {/* nose cone, always with the top section */}
      <g transform={`translate(${SX + shake} ${-lift})`}>
        <path d="M -36 815 Q -28 770 0 726 Q 28 770 36 815 Z" fill="#0A2548" stroke={K.text} strokeWidth={3.4} strokeLinejoin="round" {...NS} />
        <circle cx={0} cy={786} r={8} fill="rgba(92,211,255,0.3)" stroke={LN} strokeWidth={2.4} {...NS} />
      </g>
      {/* beat 7: weight blocks */}
      {(() => {
        const bo = win(g, T.fuel, T.stage, 8, 8);
        return (
          <g opacity={bo}>
            {T_(790, 816, "WEIGHT AT LIFTOFF", { c: K.muted, a: "middle", size: 26 })}
            {Array.from({ length: 10 }, (_, i) => {
              const c = i % 5, r = Math.floor(i / 5);
              const fuel = i < 9;
              const p = ioB(g, CUE.blocks + i * 3, CUE.blocks + i * 3 + 12);
              return <rect key={i} x={612 + c * 74 + 37 * (1 - p)} y={844 + r * 74 + 37 * (1 - p)} width={64 * p} height={64 * p} rx={8} fill={fuel ? "rgba(255,181,71,0.7)" : "rgba(92,211,255,0.55)"} stroke={fuel ? AM : LN} strokeWidth={3} opacity={clamp01(p * 2)} />;
            })}
            <g opacity={clamp01((g - (CUE.blocks + 30)) / 8)}>
              <rect x={622} y={1014} width={28} height={28} rx={5} fill="rgba(255,181,71,0.7)" stroke={AM} strokeWidth={3} />
              {T_(664, 1040, "FUEL  9 of 10", { c: AM, size: 32, w: 700 })}
              <rect x={622} y={1062} width={28} height={28} rx={5} fill="rgba(92,211,255,0.55)" stroke={LN} strokeWidth={3} />
              {T_(664, 1088, "ROCKET + CARGO", { c: LN, size: 28, w: 700 })}
              {T_(664, 1124, "1 of 10", { c: LN, size: 28, w: 700 })}
            </g>
          </g>
        );
      })()}
    </g>
  );
};
const StageMeters: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.stage, T.loop, 8, 8);
  if (o <= 0.01) return null;
  const wt = 1 - 0.34 * io(g, [CUE.sep1, CUE.sep1 + 16], [0, 1], easeInOut) - 0.28 * io(g, [CUE.sep2, CUE.sep2 + 16], [0, 1], easeInOut);
  const sp = 0.16 + 0.26 * io(g, [T.stage, CUE.sep1], [0, 1], easeInOut) + 0.28 * io(g, [CUE.sep1 + 8, CUE.sep2], [0, 1], easeInOut) + 0.3 * io(g, [CUE.sep2 + 6, T.loop - 8], [0, 1], easeInOut);
  const d1 = ioB(g, CUE.sep1 + 2, CUE.sep1 + 14), d2 = ioB(g, CUE.sep2 + 2, CUE.sep2 + 14);
  return (
    <g opacity={o}>
      <foreignObject x={0} y={0} width={W} height={H}>
        <div style={{ position: "relative", width: W, height: H }}>
          <Meter x={580} y={820} w={400} v={wt} label="WEIGHT TO PUSH" value="LESS" color={LN} />
          <Meter x={580} y={950} w={400} v={sp} label="SPEED" value="MORE" color={AM} />
        </div>
      </foreignObject>
      <Pill x={184} y={1268} text="DEAD WEIGHT" color={K.red} size={26} o={d1 * (1 - io(g, [CUE.sep1 + 34, CUE.sep1 + 46], [0, 1]))} />
      <Pill x={200} y={1130} text="DEAD WEIGHT" color={K.red} size={26} o={d2 * (1 - io(g, [CUE.sep2 + 34, CUE.sep2 + 46], [0, 1]))} />
      <Pill x={790} y={1130} text="LIGHTER = FASTER" color={AM} size={26} o={clamp01((g - (CUE.sep2 + 24)) / 8) * (1 - io(g, [T.loop - 10, T.loop - 2], [0, 1]))} />
    </g>
  );
};

/* ───────────── main shot (frames 0 → end+4) ───────────── */
export const OrbitShot: React.FC = () => {
  const g = useCurrentFrame();
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  const fade = io(g, [T.end - 6, T.end + 2], [0, 1]);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Headline f={g} lines={["Orbit isn't *up*", "it's *sideways*"]} at={-30} exitAt={T.up - 12} size={100} />
      <Headline f={g} lines={["A ball thrown", "*up* comes down"]} at={T.up + 3} exitAt={T.side - 8} size={100} />
      <Headline f={g} lines={["Throw it *sideways*", "it lands *farther*"]} at={T.side + 3} exitAt={T.orbit - 8} size={92} />
      <Headline f={g} lines={["Fast enough:", "it *never lands*"]} at={T.orbit + 3} exitAt={T.speed - 8} size={100} />
      <Headline f={g} lines={["How *fast*?"]} at={T.speed + 3} exitAt={T.turn - 8} size={120} />
      <Headline f={g} lines={["Climb, then", "tip *sideways*"]} at={T.turn + 3} exitAt={T.fuel - 8} size={100} />
      <Headline f={g} lines={["*Nine tenths*", "is fuel"]} at={T.fuel + 3} exitAt={T.stage - 8} size={104} />
      <Headline f={g} lines={["Empty tanks", "*drop off*"]} at={T.stage + 3} exitAt={T.loop - 8} size={104} />
      <Headline f={g} lines={["Engines *off*", "one lap, *90 min*"]} at={T.loop + 3} exitAt={T.end - 8} size={100} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8FB3D1" /></marker>
        </defs>
        <Frame />
        <EarthStage g={g} />
        <Stack g={g} />
        <StageMeters g={g} />
        <g opacity={io(g, [20, 36], [0, 1])}>{T_(540, 1584, "SIMPLIFIED DRAWING · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}</g>
      </svg>

      <Panel o={pn(-10, T.up + 2)} a="THE BIG IDEA" b={<>Orbit needs <Em>sideways</Em> speed</>} c="Going up alone can't keep you there" />
      <Panel o={pn(T.up, T.side + 2)} a="STRAIGHT UP" b={<>Goes up, stops, falls <Em>back</Em></>} c="Gravity pulls it back to the ground" />
      <Panel o={pn(T.side, T.orbit + 2)} a="THROW IT SIDEWAYS" b={<>Harder throw, lands <Em>farther</Em></>} c="The Earth is round, so the ground curves away" />
      <Panel o={pn(T.orbit, CUE.tag - 2)} a="FAST ENOUGH" b={<>The ground <Em>curves away</Em> as it falls</>} c="Gravity keeps pulling it, but it never lands" />
      <Panel o={pn(CUE.tag - 4, T.speed + 2)} a="THAT'S AN ORBIT" b={<>Falling… and <Em>missing</Em> the Earth</>} c="Newton's cannonball idea" />
      <Panel o={pn(T.speed, T.turn + 2)} a="SPEED NEEDED FOR ORBIT" b={<>About <Em>28,000</Em> km/h</>} c="Nearly 8 kilometers every second" />
      <Panel o={pn(T.turn, T.fuel + 2)} a="HOW ROCKETS DO IT" b={<>Up a little, then <Em>sideways</Em></>} c="Up gets it out of the thick air first" />
      <Panel o={pn(T.fuel, T.stage + 2)} a="EXAMPLE · SATURN V (APOLLO)" b={<>About <Em>90%</Em> of its weight is fuel</>} c="Weight at liftoff · NASA figures" />
      <Panel o={pn(T.stage, T.loop + 2)} a="DROPPING THE EMPTY PARTS" b={<>Less weight, <Em>more speed</Em></>} c="Each dropped piece is called a stage" />
      <Panel o={pn(T.loop, T.end + 2)} a="STILL FALLING" b={<>Gravity up there is still <Em>89%</Em></>} c="Astronauts float because they are falling too" />
    </div>
  );
};

/* ────────── end card (same as #13/#14) ────────── */
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
      <Tag f={f} at={8} text="FOLLOW  +" x={540} y={1330} color={AM} solid size={32} />
      <Label f={f} at={64} text="AKS PRODUCTIONS" x={540} y={1410} size={30} align="center" color={K.text} />
      <Label f={f} at={78} text="HOW IT WORKS · @DEAD.SIMPLE.ENGINEERING" x={540} y={1466} size={20} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => {
  const ay = 856, s = 1, M = (p: P): [number, number] => [CX + s * p.x, ay + s * (p.y + R0)];
  const cy = ay + R0;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>HOW IT WORKS · 15</div>
        <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 112, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>How rockets</div>
        <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 112, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>reach orbit</div>
        <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 84, lineHeight: 1.1, color: AM }}>sideways, not up</div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Planet s={s} ay={ay} o={1} air={0.35} />
        <circle cx={CX} cy={cy} r={R0} fill="none" stroke={K.lineDim} strokeWidth={2.4} strokeDasharray="8 10" {...NS} />
        <path d={trail(SLOW, SLOW.pts.length - 1, M)} fill="none" stroke={LN} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <path d={trail(MID, MID.pts.length - 1, M)} fill="none" stroke={LN} strokeWidth={5} strokeLinecap="round" />
        <path d={trail(FAST, LAP, M)} fill="none" stroke={AM} strokeWidth={8} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${AM})` }} />
        <Cannon s={s} ay={ay} deg={0} o={1} flash={0} />
        {(() => { const [x, y] = M(at(FAST, 62)); return <Ball x={x} y={y} r={12} />; })()}
      </svg>
    </>
  );
};
void landDeg; void lerp; void easeOut;
export { easeInOut, TAU };
