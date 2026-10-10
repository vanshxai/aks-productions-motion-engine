import React from "react";
import { useCurrentFrame } from "remotion";
import { easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Car, Headline, Layer, clamp01 } from "../gearbox/kit";
import { Wire3D, project, V3, WireLine, WireView, ring } from "../../engine/wire3d";

/**
 * HOW IT WORKS #21 — Do you really need to warm up your car?     30 s · 1080×1920 · 30 fps · 900 frames
 * HIT-STYLE: frame 0 is a finished hook (question headline + big line-art car, idling clock). Voice from 0.1 s. No end card; small AKS tag via EndTag.
 *
 * BEATS PLAN — VO phrases: public/projects/warmup/vo.json (frames @30)
 *    3 hook   "You don't need to warm up your car for five minutes."  car idling, clock 5:00 struck through at the end
 *   74 old    "That advice comes from old carburetor cars."          carburetor schematic
 *  165        "Cold fuel didn't turn to vapor well,"                 big fuel drops stay drops, vapor meter low
 *  228        "so they ran rough."                                   cylinder shakes, ROUGH
 *  260 modern "Modern engines use sensors to meter the fuel,"        sensors -> computer -> injector
 *  340        "so they run fine right away."                         fine mist, smooth
 *  387 oil    "Oil reaches the engine parts in seconds."             wire3d engine block, oil gallery lights up
 *  455 thirty "About thirty seconds is plenty."                      30 s ring fills
 *  520        "Then drive gently."                                   car rolls
 *  558 zero   "Idling gets zero miles per gallon,"                   0 MPG
 *  627        "and the engine warms up slower than when you drive."  two warmth bars race
 *  702 end    "So skip the wait. Just go, gently."                   final picture
 * Facts: see delivery notes (RepairPal, Autoblog, NPS Idle Free, ORNL/DOE, NRCan). SIMPLIFIED schematics are tagged on screen; bars are ILLUSTRATIVE.
 */
export const T = { old: 74, modern: 260, oil: 387, thirty: 455, zero: 558, end: 702, total: 900 };
export const CUTS = [0, 74, 260, 387, 455, 558, 702];
export const CUE = { hook: 3, cold: 165, rough: 228, sens: 275, fine: 340, drive: 520, zero2: 627, skip: 702, go: 750, gently: 779 };

const AM = K.amber, LN = K.line, DIM = K.lineDim, MU = K.muted, GR = K.green, RD = K.red;
const AIRC = "#8FD0FF";
const SC: [number, number][] = [[0, 74], [74, 260], [260, 387], [387, 455], [455, 558], [558, 702], [702, 900]];
const vis = (f: number, i: number) => {
  const [a, b] = SC[i];
  return (i === 0 ? 1 : io(f, [a - 2, a + 5], [0, 1])) * (i === SC.length - 1 ? 1 : 1 - io(f, [b - 5, b + 2], [0, 1]));
};
const fract = (x: number) => x - Math.floor(x);
const rnd = (a: number, b = 0) => fract(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) * 2 - 1;

const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 26} letterSpacing={o.ls ?? (o.size ?? 26) * 0.08} fill={o.c ?? MU} opacity={o.op ?? 1}>{s}</text>
);
const Panel: React.FC<{ o: number; a: string; b: string; c?: string }> = ({ o, a, b, c }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1412, height: 138, opacity: o, borderRadius: 12, border: `2px solid ${DIM}`, background: "rgba(3,11,24,0.85)", boxSizing: "border-box", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
    <div style={{ fontFamily: K.mono, fontSize: 27, letterSpacing: 4, color: AM, fontWeight: 700, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: K.head, fontSize: 43, fontWeight: 700, color: K.text, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b}</div>
    {c && <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 1.5, color: MU, whiteSpace: "nowrap", fontWeight: 500 }}>{c}</div>}
  </div>
);
const Pill: React.FC<{ x: number; y: number; text: string; o?: number; color?: string; size?: number; solid?: boolean; pop?: number }> = ({ x, y, text, o = 1, color = AM, size = 30, solid, pop = 1 }) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.9, sc = 0.7 + 0.3 * pop;
  return (
    <g opacity={o} transform={`translate(${x} ${y}) scale(${sc})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? color : "rgba(6,20,42,0.94)"} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={size * 0.35} fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={solid ? K.bgDeep : color}>{text}</text>
    </g>
  );
};
const Meter: React.FC<{ x: number; y: number; w: number; v: number; label: string; value: string; color: string; o?: number }> = ({ x, y, w, v, label, value, color, o = 1 }) => (
  <g opacity={o}>
    {T_(x, y + 22, label, { size: 28, c: MU, ls: 3 })}
    {T_(x + w, y + 22, value, { size: 28, c: color, a: "end", w: 700, ls: 3 })}
    <rect x={x} y={y + 38} width={w} height={34} rx={4} fill="rgba(3,11,24,0.6)" stroke={DIM} strokeWidth={2} />
    <rect x={x + 4} y={y + 42} width={Math.max(0, (w - 8) * clamp01(v))} height={26} rx={2} fill={color} opacity={0.92} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
  </g>
);
const Title: React.FC<{ f: number; i: number; lines: string[]; size?: number }> = ({ f, i, lines, size = 80 }) => (
  <div style={{ opacity: i === 0 ? 1 : vis(f, i) > 0.02 ? 1 : 0 }}>
    <Headline f={f} lines={lines} at={SC[i][0] + (i === 0 ? -20 : 2)} size={size} top={340} exitAt={i === SC.length - 1 ? undefined : SC[i][1] - 6} stagger={4} />
  </div>
);

/* ─────────── intake + cylinder schematic (carburetor / injector) ─────────── */
const PIPE_T = 770, PIPE_B = 870, CX0 = 650, CX1 = 970, CY0 = 640, CY1 = 1010;
const Cylinder: React.FC<{ f: number; shake: number; fillMix?: React.ReactNode }> = ({ f, shake, fillMix }) => {
  const sx = shake * rnd(f, 1) * 7, sy = shake * rnd(f, 2) * 6;
  const pist = 840 + 55 * Math.sin(f * 0.42);
  return (
    <g transform={`translate(${sx} ${sy})`}>
      <path d={`M ${CX0} ${CY0} L ${CX0} ${CY1} M ${CX1} ${CY0} L ${CX1} ${CY1} M ${CX0 - 14} ${CY0} L ${CX1 + 14} ${CY0}`} stroke={LN} strokeWidth={5} fill="none" strokeLinecap="round" />
      <rect x={CX0 + 3} y={CY0 + 3} width={CX1 - CX0 - 6} height={pist - CY0 - 3} fill="rgba(92,211,255,0.05)" />
      {fillMix}
      <rect x={CX0 + 6} y={pist} width={CX1 - CX0 - 12} height={70} rx={6} fill="rgba(92,211,255,0.14)" stroke={LN} strokeWidth={4} />
      <line x1={CX0 + 6} y1={pist + 22} x2={CX1 - 6} y2={pist + 22} stroke={LN} strokeWidth={2.4} />
      <line x1={CX0 + 6} y1={pist + 44} x2={CX1 - 6} y2={pist + 44} stroke={LN} strokeWidth={2.4} />
      <line x1={(CX0 + CX1) / 2} y1={pist + 70} x2={(CX0 + CX1) / 2} y2={CY1 + 90} stroke={LN} strokeWidth={8} />
    </g>
  );
};
const Pipe: React.FC<{ f: number; venturi?: boolean }> = ({ f, venturi }) => {
  const top = venturi ? `M 80 ${PIPE_T} L 270 ${PIPE_T} L 340 ${PIPE_T + 24} L 410 ${PIPE_T} L ${CX0} ${PIPE_T}` : `M 80 ${PIPE_T} L ${CX0} ${PIPE_T}`;
  const bot = venturi ? `M 80 ${PIPE_B} L 270 ${PIPE_B} L 340 ${PIPE_B - 24} L 410 ${PIPE_B} L ${CX0} ${PIPE_B}` : `M 80 ${PIPE_B} L ${CX0} ${PIPE_B}`;
  return (
    <g>
      <path d={top} stroke={LN} strokeWidth={5} fill="none" strokeLinejoin="round" />
      <path d={bot} stroke={LN} strokeWidth={5} fill="none" strokeLinejoin="round" />
      {Array.from({ length: 9 }, (_, i) => {
        const t = fract(f * 0.011 + i / 9); const x = 100 + t * 540;
        return <circle key={i} cx={x} cy={PIPE_T + 22 + ((i * 37) % 56)} r={6} fill="none" stroke={AIRC} strokeWidth={2.6} opacity={0.85 * Math.min(1, t * 6)} />;
      })}
      {T_(84, PIPE_T - 18, "AIR", { size: 28, c: AIRC, ls: 5 })}
    </g>
  );
};

const CarbScene: React.FC<{ f: number }> = ({ f }) => {
  const g = f - SC[1][0];
  const cold = io(f, [CUE.cold - 4, CUE.cold + 14], [0, 1]);
  const rough = io(f, [CUE.rough - 2, CUE.rough + 6], [0, 1]);
  const fuelOp = io(f, [88, 104], [0, 1]);
  return (
    <g opacity={vis(f, 1)}>
      <Pipe f={f} venturi />
      <g opacity={fuelOp}>
        <rect x={270} y={985} width={140} height={78} rx={8} fill="rgba(255,181,71,0.14)" stroke={AM} strokeWidth={4} />
        <line x1={340} y1={985} x2={340} y2={PIPE_B - 24} stroke={AM} strokeWidth={5} />
        {T_(340, 1100, "FUEL", { size: 28, c: AM, a: "middle", ls: 5 })}
        {/* fuel drops */}
        {Array.from({ length: 14 }, (_, i) => {
          const t = fract(g * 0.0105 + i / 14); const x = 340 + t * 540;
          const big = cold; const r = 5 + 7 * big - 4 * (1 - big) * t;
          const sag = big * Math.pow(t, 1.5) * 38;
          const op = (1 - big * 0.0) * Math.min(1, t * 8) * (big > 0.5 ? 1 : 1 - Math.min(1, Math.max(0, t - 0.25) * 1.3));
          return <circle key={i} cx={x} cy={PIPE_T + 40 + ((i * 29) % 36) + sag} r={r} fill={AM} opacity={0.95 * op} style={{ filter: `drop-shadow(0 0 6px ${AM})` }} />;
        })}
      </g>
      <Cylinder f={f} shake={rough} fillMix={
        <g>
          {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={CX0 + 50 + ((i * 61) % 230)} cy={CY0 + 50 + ((i * 47) % 120)} r={6 + 6 * cold} fill={AM} opacity={0.9 * cold * io(f, [CUE.cold, CUE.cold + 20], [0, 1])} />)}
          {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={CX0 + 30 + ((i * 53) % 270)} cy={CY0 + 25 + ((i * 41) % 170)} r={2.5} fill={AM} opacity={0.55 * (1 - cold) * io(f, [100, 120], [0, 1])} />)}
        </g>} />
      <Pill x={340} y={700} text="CARBURETOR" o={io(f, [78, 92], [0, 1])} size={30} />
      <Pill x={540} y={1000} text="COLD" o={cold} color={AIRC} size={30} solid pop={cold} />
      <Pill x={810} y={1075} text="ROUGH" o={rough} color={RD} size={34} solid pop={rough} />
      <Meter x={100} y={1160} w={880} v={0.78 - 0.58 * cold} label="FUEL TURNS TO VAPOR" value={cold > 0.5 ? "LOW" : "OK"} color={cold > 0.5 ? RD : GR} o={io(f, [92, 108], [0, 1])} />
      <Meter x={100} y={1270} w={880} v={0.9 - 0.65 * rough} label="SMOOTH RUNNING" value={rough > 0.5 ? "ROUGH" : "OK"} color={rough > 0.5 ? RD : GR} o={io(f, [100, 116], [0, 1])} />
    </g>
  );
};

const InjScene: React.FC<{ f: number }> = ({ f }) => {
  const g = f - SC[2][0];
  const fine = io(f, [CUE.fine - 2, CUE.fine + 10], [0, 1]);
  const ecu = io(f, [CUE.sens, CUE.sens + 12], [0, 1]);
  const sens = [[120, "AIR"], [220, "TEMP"], [320, "O2"]] as const;
  const pulse = 0.5 + 0.5 * Math.sin(g * 0.5);
  return (
    <g opacity={vis(f, 2)}>
      <Pipe f={f} />
      {/* sensors -> computer -> injector */}
      {sens.map(([x, s], i) => {
        const o = io(f, [CUE.sens + i * 5, CUE.sens + 12 + i * 5], [0, 1]);
        return (
          <g key={s} opacity={o}>
            <circle cx={x} cy={680} r={34} fill="rgba(6,20,42,0.9)" stroke={LN} strokeWidth={4} />
            {T_(x, 690, s, { size: 24, c: K.text, a: "middle", ls: 1 })}
            <path d={`M ${x} 714 L ${x} ${PIPE_T}`} stroke={LN} strokeWidth={3} strokeDasharray="6 6" />
            <path d={`M ${x + 30} 662 L 450 640`} stroke={AM} strokeWidth={2.6} opacity={0.8} />
            <circle cx={x + 30 + (450 - x - 30) * fract(g * 0.03 + i * 0.3)} cy={662 - 22 * fract(g * 0.03 + i * 0.3)} r={5} fill={AM} />
          </g>
        );
      })}
      <g opacity={ecu}>
        <rect x={450} y={600} width={160} height={84} rx={10} fill="rgba(255,181,71,0.12)" stroke={AM} strokeWidth={4} />
        {T_(530, 652, "BRAIN", { size: 32, c: AM, a: "middle", w: 700, ls: 4 })}
        <path d={`M 610 640 L 800 640 L 800 ${CY0}`} stroke={AM} strokeWidth={3} fill="none" />
        <circle cx={610 + 190 * fract(g * 0.03)} cy={640} r={5.5} fill={AM} opacity={pulse + 0.4} />
      </g>
      <Cylinder f={f} shake={0} fillMix={
        <g>
          <path d={`M 800 ${CY0 + 4} l -26 20 h 52 z`} fill={AM} opacity={ecu} />
          {Array.from({ length: 34 }, (_, i) => {
            const t = fract(g * 0.03 + i / 34); const sp = rnd(i, 3) * 90 * t;
            return <circle key={i} cx={800 + sp} cy={CY0 + 28 + t * 170} r={3} fill={AM} opacity={0.85 * fine * (1 - t * 0.6)} />;
          })}
        </g>} />
      <Pill x={800} y={1075} text="SMOOTH" o={fine} color={GR} size={34} solid pop={fine} />
      <Pill x={250} y={960} text="SENSORS" o={ecu} size={30} />
      <Meter x={100} y={1160} w={880} v={0.15 + 0.8 * ecu} label="FUEL AMOUNT CHECKED BY SENSORS" value="YES" color={GR} o={ecu} />
      <Meter x={100} y={1270} w={880} v={0.2 + 0.75 * fine} label="RUNS FINE RIGHT AWAY" value={fine > 0.5 ? "YES" : "…"} color={GR} o={io(f, [CUE.sens + 20, CUE.sens + 34], [0, 1])} />
    </g>
  );
};

/* ─────────── oil: wire3d engine block ─────────── */
const block = (): WireLine[] => {
  const L: WireLine[] = [];
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color?: string, w = 1, op = 1) => {
    const p = (x: number, y: number, z: number): V3 => [x, y, z];
    L.push({ pts: [p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0)], closed: true, color, w, op });
    L.push({ pts: [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], closed: true, color, w, op });
    [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].forEach(([x, y]) => L.push({ pts: [p(x, y, z0), p(x, y, z1)], color, w, op }));
  };
  box(-9.5, 9.5, -2.4, 5, -3.6, 3.6);          // block + head
  box(-9, 9, -6.6, -2.4, -3, 3, undefined, 1, 0.7); // oil pan
  [-6.5, -2.2, 2.2, 6.5].forEach((x) => {
    L.push({ pts: ring([x, 5, 0], 1.7, "y", 20), closed: true });
    L.push({ pts: ring([x, 0.6, 0], 1.7, "y", 20), closed: true, op: 0.7 });
    [0, 5, 10, 15].forEach((k) => { const a = (k / 20) * Math.PI * 2; L.push({ pts: [[x + 1.7 * Math.cos(a), 5, 1.7 * Math.sin(a)], [x + 1.7 * Math.cos(a), 0.6, 1.7 * Math.sin(a)]], op: 0.5 }); });
    L.push({ pts: ring([x, 2.6, 0], 1.7, "y", 20), closed: true, color: "#8FD0FF", w: 1.4 }); // piston
  });
  L.push({ pts: [[-9.2, -1.4, 0], [9.2, -1.4, 0]], w: 2 }); // crankshaft
  return L;
};
const BLOCK = block();
const OIL_PTS: V3[] = [[0, -5.6, 0], [0, -3.4, 2.6], [-8.6, -1.9, 2.6], [8.6, -1.9, 2.6]];
const oilLines = (): WireLine[] => {
  const o: WireLine[] = [{ pts: [[0, -5.8, 0], [0, -3.4, 0], [0, -3.4, 2.6], [0, -1.9, 2.6]], color: AM, w: 2.4 }, { pts: [[-8.6, -1.9, 2.6], [8.6, -1.9, 2.6]], color: AM, w: 2.4 }];
  [-6.5, -2.2, 2.2, 6.5].forEach((x) => { o.push({ pts: [[x, -1.9, 2.6], [x, -1.4, 0], [x, 2.6, 0], [x, 5, 0]], color: AM, w: 2.4 }); });
  return o;
};
const OIL = oilLines();
const OilScene: React.FC<{ f: number }> = ({ f }) => {
  const g = f - SC[3][0];
  const view: WireView = { yaw: 0.55 + 0.1 * Math.sin(f * 0.03), pitch: 0.34, dist: 150, scale: 38, cx: 540, cy: 980, pivot: [0, 0, 0] };
  const rv = io(f, [SC[3][0] + 6, SC[3][0] + 52], [0, 1]);
  const pump = project([0, -6.2, 0], view);
  const dots = Array.from({ length: 16 }, (_, i) => {
    const t = fract(g * 0.018 + i / 16) * rv;
    // along: pump -> gallery -> top
    const pts: V3[] = [[0, -5.8, 0], [0, -3.4, 2.6], [0, -1.9, 2.6], [-6.5 + 13 * ((i % 4) / 3), -1.9, 2.6], [-6.5 + 13 * ((i % 4) / 3), 2.6, 0], [-6.5 + 13 * ((i % 4) / 3), 5, 0]];
    const seg = Math.min(4, Math.floor(t * 5)); const u = t * 5 - seg;
    const a = pts[seg], b = pts[seg + 1];
    return project([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], view);
  });
  return (
    <g opacity={vis(f, 3)}>
      <Wire3D lines={BLOCK} view={view} width={3.2} glow={6} />
      <Wire3D lines={OIL} view={view} width={4} glow={10} reveal={rv} />
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={7} fill={AM} opacity={0.95} style={{ filter: `drop-shadow(0 0 8px ${AM})` }} />)}
      <Pill x={pump.x} y={pump.y + 70} text="OIL PUMP" o={io(f, [SC[3][0] + 4, SC[3][0] + 16], [0, 1])} size={30} />
      <Pill x={540} y={680} text="IN SECONDS" o={io(f, [SC[3][0] + 30, SC[3][0] + 46], [0, 1])} size={40} solid pop={io(f, [SC[3][0] + 30, SC[3][0] + 46], [0, 1])} />
    </g>
  );
};

/* ─────────── 30 s ring + drive ─────────── */
const ThirtyScene: React.FC<{ f: number }> = ({ f }) => {
  const a = SC[4][0];
  const p = io(f, [a + 4, a + 54], [0, 1], easeOut);
  const R = 215, C = 2 * Math.PI * R;
  const carO = io(f, [CUE.drive - 4, CUE.drive + 10], [0, 1]);
  const roll = Math.max(0, f - CUE.drive);
  const cx = 150 + 60 * easeOut(clamp01(roll / 40)) + roll * 0.4;
  return (
    <g opacity={vis(f, 4)}>
      <g opacity={1 - 0.0 * carO} transform={`translate(0 ${-30 * carO})`}>
        <circle cx={540} cy={900} r={R} fill="rgba(6,20,42,0.6)" stroke={DIM} strokeWidth={14} />
        <circle cx={540} cy={900} r={R} fill="none" stroke={AM} strokeWidth={20} strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} transform="rotate(-90 540 900)" style={{ filter: `drop-shadow(0 0 10px ${AM})` }} />
        <text x={540} y={955} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={200} fill={K.text}>{Math.round(30 * p)}</text>
        {T_(540, 1020, "SECONDS", { size: 36, c: AM, a: "middle", ls: 8 })}
      </g>
      <g opacity={carO} transform={`translate(${cx} 1170) scale(1.05)`}>
        {[0, 1, 2, 3].map((i) => <line key={i} x1={-40 - i * 8 - ((roll * 6) % 60)} y1={60 + i * 26} x2={-110 - i * 8 - ((roll * 6) % 60)} y2={60 + i * 26} stroke={LN} strokeWidth={4} strokeLinecap="round" opacity={0.5} />)}
        <Car draw={1} wheelRot={roll * 0.18} engineGlow={0.5} />
      </g>
      <Pill x={800} y={1150} text="GENTLY" o={carO} color={GR} size={36} solid pop={carO} />
    </g>
  );
};

/* ─────────── idling vs driving ─────────── */
const Bar: React.FC<{ x: number; v: number; color: string; label: string; o?: number }> = ({ x, v, color, label, o = 1 }) => (
  <g opacity={o}>
    <rect x={x - 70} y={900} width={140} height={400} rx={14} fill="rgba(3,11,24,0.6)" stroke={DIM} strokeWidth={3} />
    <rect x={x - 62} y={1292 - 384 * clamp01(v)} width={124} height={384 * clamp01(v)} rx={8} fill={color} opacity={0.92} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
    {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={x + 70} y1={1292 - 384 * t} x2={x + 90} y2={1292 - 384 * t} stroke={MU} strokeWidth={2} />)}
    {T_(x, 1348, label, { size: 34, c: color, a: "middle", w: 700, ls: 5 })}
  </g>
);
const ZeroScene: React.FC<{ f: number }> = ({ f }) => {
  const a = SC[5][0];
  const z = io(f, [a + 2, a + 16], [0, 1]);
  const race = io(f, [CUE.zero2 - 2, CUE.zero2 + 70], [0, 1], easeOut);
  const roll = Math.max(0, f - a);
  return (
    <g opacity={vis(f, 5)}>
      <g transform="translate(95 640) scale(0.7)"><Car draw={1} wheelRot={0} engineGlow={0.4 + 0.2 * Math.sin(f * 0.4)} /></g>
      <g transform="translate(575 640) scale(0.7)"><Car draw={1} wheelRot={roll * 0.2} engineGlow={0.5} /></g>
      {[0, 1, 2].map((i) => <line key={i} x1={560 - ((roll * 7 + i * 30) % 90)} y1={720 + i * 30} x2={520 - ((roll * 7 + i * 30) % 90)} y2={720 + i * 30} stroke={LN} strokeWidth={3} opacity={0.4} strokeLinecap="round" />)}
      {T_(300, 860, "0 MPG", { size: 70, c: RD, a: "middle", w: 700, ls: 4, op: z })}
      {T_(780, 860, "MOVING", { size: 56, c: GR, a: "middle", w: 700, ls: 4, op: z })}
      <Bar x={300} v={0.05 + 0.33 * race} color={RD} label="IDLING" o={io(f, [CUE.zero2 - 14, CUE.zero2], [0, 1])} />
      <Bar x={780} v={0.05 + 0.9 * race} color={GR} label="DRIVING" o={io(f, [CUE.zero2 - 14, CUE.zero2], [0, 1])} />
      {T_(540, 1115, "ENGINE", { size: 26, c: MU, a: "middle", ls: 5, op: io(f, [CUE.zero2, CUE.zero2 + 10], [0, 1]) })}
      {T_(540, 1150, "WARMTH", { size: 26, c: MU, a: "middle", ls: 5, op: io(f, [CUE.zero2, CUE.zero2 + 10], [0, 1]) })}
    </g>
  );
};

/* ─────────── hook + end car scenes ─────────── */
const HookScene: React.FC<{ f: number }> = ({ f }) => {
  const o = vis(f, 0);
  const cross = io(f, [60, 70], [0, 1]);
  return (
    <g opacity={o}>
      {Array.from({ length: 5 }, (_, i) => {
        const t = fract(f * 0.018 + i / 5);
        return <circle key={i} cx={95 - t * 60} cy={900 - t * 140 - 20} r={14 + t * 40} fill="rgba(143,179,209,0.18)" stroke={MU} strokeWidth={2} opacity={(1 - t) * 0.9} />;
      })}
      <g transform={`translate(${90 + 0.8 * rnd(f, 5)} ${760 + 0.8 * rnd(f, 6)}) scale(1.5)`}><Car draw={1} wheelRot={0} engineGlow={0.55 + 0.35 * Math.sin(f * 0.4)} /></g>
      {T_(540, 1135, "WARM-UP TIME?", { size: 32, c: MU, a: "middle", ls: 8 })}
      <text x={540} y={1300} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={190} fill={AM} style={{ filter: `drop-shadow(0 0 14px ${AM})` }}>5:00</text>
      {cross > 0 && <line x1={250} y1={1250} x2={250 + 580 * cross} y2={1250} stroke={RD} strokeWidth={10} strokeLinecap="round" />}
    </g>
  );
};
const EndScene: React.FC<{ f: number }> = ({ f }) => {
  const a = SC[6][0];
  const r = f - a;
  const c1 = io(f, [CUE.skip + 20, CUE.skip + 34], [0, 1]), c2 = io(f, [CUE.go + 4, CUE.go + 18], [0, 1]);
  return (
    <g opacity={vis(f, 6)}>
      <g>
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={((i * 190 - r * 9) % 1330 + 1330) % 1330 - 100} y1={1000} x2={((i * 190 - r * 9) % 1330 + 1330) % 1330 - 20} y2={1000} stroke={DIM} strokeWidth={6} strokeLinecap="round" />)}
        <line x1={0} y1={992} x2={1080} y2={992} stroke={LN} strokeWidth={3} opacity={0.5} />
      </g>
      <g transform={`translate(${70 + 0.0 * r} ${815 + 3 * Math.sin(r * 0.22)}) scale(1.6)`}>
        {[0, 1, 2].map((i) => <line key={i} x1={-20 - i * 12 - ((r * 8) % 50)} y1={30 + i * 34} x2={-90 - i * 12 - ((r * 8) % 50)} y2={30 + i * 34} stroke={LN} strokeWidth={4} opacity={0.45} strokeLinecap="round" />)}
        <Car draw={1} wheelRot={r * 0.25} engineGlow={0.6} />
      </g>
      <Pill x={300} y={1230} text="30 SEC IDLE" o={c1} size={34} pop={c1} />
      <Pill x={770} y={1230} text="DRIVE GENTLY" o={c2} color={GR} size={34} pop={c2} solid />
    </g>
  );
};

export const WarmUpShot: React.FC<{ fo?: number }> = ({ fo }) => {
  const fr = useCurrentFrame(); const f = fo ?? fr;
  const P = (i: number, a: string, b: string, c?: string) => <Panel o={vis(f, i)} a={a} b={b} c={c} />;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Layer>
        <HookScene f={f} /><CarbScene f={f} /><InjScene f={f} /><OilScene f={f} /><ThirtyScene f={f} /><ZeroScene f={f} /><EndScene f={f} />
      </Layer>
      <Title f={f} i={0} lines={["Do you really need", "to *warm up* your car?"]} size={84} />
      <Title f={f} i={1} lines={["Old *carburetor*", "cars"]} />
      <Title f={f} i={2} lines={["Modern engines:", "*sensors* meter fuel"]} size={76} />
      <Title f={f} i={3} lines={["Oil reaches the", "parts *fast*"]} />
      <Title f={f} i={4} lines={["About *30 seconds*", "is plenty"]} />
      <Title f={f} i={5} lines={["Idling vs", "*driving*"]} />
      <Title f={f} i={6} lines={["Skip the wait.", "Just *go*, gently."]} size={88} />
      {P(0, "COMMON ADVICE", "Warm up for minutes?", "VERDICT: OLD-CAR HABIT")}
      {P(1, "OLD CARBURETOR CARS", "Cold fuel stayed in drops", "SIMPLIFIED SCHEMATIC")}
      {P(2, "MODERN FUEL INJECTION", "Sensors meter the fuel", "SIMPLIFIED SCHEMATIC")}
      {P(3, "OIL FLOW", "Reaches the parts in seconds", "SIMPLIFIED SCHEMATIC · NOT TO SCALE")}
      {P(4, "RULE OF THUMB", "~30 s idle, then drive gently", "VERY COLD DAYS: A BIT LONGER (NRCAN)")}
      {P(5, "IDLING VS DRIVING", "0 mpg, and slower to warm", "ILLUSTRATIVE · NOT MEASURED DATA")}
      {P(6, "THE RULE", "30 s, then drive gently", "")}
    </div>
  );
};
export const Cover: React.FC = () => <WarmUpShot fo={30} />;
