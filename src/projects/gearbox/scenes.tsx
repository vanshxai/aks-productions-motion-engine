import React from "react";
import { useCurrentFrame } from "remotion";
import { easeIn, easeInOut, easeOut, io } from "../../engine/util";
import { K } from "./brand";
import {
  Car, Gauge, Gear, Headline, Label, Layer, Meter, Readout, TAU, Tag, TorqueArrow, Wheel, clamp01, gearPath, ioB, meshPhase,
} from "./kit";

/** Scene starts (global frames @30fps). Keep in sync with soundtrack.py. */
export const T = { hook: 0, engine: 58, wheel: 112, small: 182, mesh: 234, trade: 362, eq: 446, first: 488, shift: 578, hero: 712, end: 828, total: 900 };

const BASE_SPIN = 0.012; // driver rad/frame while idling
/** Driver angle (global frame) — continuous across small → mesh → trade so the gears never jump. */
const driverAngle = (g: number) => {
  const spin = io(g, [T.mesh + 36, T.mesh + 120], [0, 3 * TAU], easeInOut);
  const after = Math.max(0, g - (T.mesh + 120)) * 0.05;
  return g * BASE_SPIN + spin + after;
};

/* ────────── 1 · HOOK ────────── */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const draw = io(f, [3, 40], [0, 1], easeInOut);
  const push = io(f, [46, 64], [1, 1.9], easeIn);
  const glow = f > 28 ? 0.55 + 0.45 * Math.sin(f * 0.45) : 0;
  const s = 1.45, cx = 105, cy = 880;
  const ex = cx + 530 * s, ey = cy + 115 * s; // engine point
  const wx = cx + 115 * s, wy = cy + 150 * s; // rear wheel
  const cl = io(f, [24, 34], [0, 1]);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: `${ex}px ${ey}px` }}>
      <Headline f={f} lines={["Why does your car", "need *gears?*"]} at={8} />
      <Layer>
        <line x1={60} y1={cy + 188 * s} x2={60 + 960 * draw} y2={cy + 188 * s} stroke={K.lineDim} strokeWidth={2.5} />
        {Array.from({ length: 24 }).map((_, i) => (
          <line key={i} x1={60 + i * 42} y1={cy + 188 * s + 4} x2={44 + i * 42} y2={cy + 188 * s + 20} stroke={K.lineDim} strokeWidth={1.5} opacity={draw} />
        ))}
        <g transform={`translate(${cx} ${cy}) scale(${s})`}><Car draw={draw} wheelRot={0} engineGlow={glow} /></g>
        <g opacity={cl}>
          <circle cx={ex} cy={ey} r={9} fill={K.amber} />
          <circle cx={ex} cy={ey} r={9 + ((f * 1.2) % 30)} fill="none" stroke={K.amber} strokeWidth={2} opacity={1 - ((f * 1.2) % 30) / 30} />
          <polyline points={`${ex},${ey} ${ex},${ey - 230 * cl} ${ex - 60 * cl},${ey - 230 * cl}`} fill="none" stroke={K.amber} strokeWidth={2} />
          <circle cx={wx} cy={wy} r={8} fill={K.line} />
          <polyline points={`${wx},${wy} ${wx},${wy + 150 * cl} ${wx + 60 * cl},${wy + 150 * cl}`} fill="none" stroke={K.line} strokeWidth={2} />
        </g>
      </Layer>
      <Label f={f} at={30} text="ENGINE" x={ex - 76} y={ey - 247} color={K.amber} size={26} align="right" />
      <Label f={f} at={34} text="WHEELS" x={wx + 76} y={wy + 133} color={K.line} size={26} />
      <Label f={f} at={20} text="FIG.01 — SEDAN · SIDE ELEVATION" x={540} y={1440} size={22} align="center" />
    </div>
  );
};

/* ────────── 2 · ENGINE LOVES SPEED ────────── */
export const EngineSpeed: React.FC = () => {
  const f = useCurrentFrame();
  const v = io(f, [4, 40], [0.1, 0.75], easeOut) + (f > 40 ? Math.sin(f * 1.7) * 0.006 : 0);
  const rpm = Math.round((v * 8000) / 50) * 50;
  const draw = io(f, [0, 18], [0, 1], easeOut);
  const ang = f * 0.02 + io(f, [4, 40], [0, 9], easeIn) + Math.max(0, f - 40) * 0.55;
  const cy = 1000;
  return (
    <>
      <Headline f={f} lines={["Engines love", "*speed*"]} at={3} />
      {[3, 2, 1].map((k) => (
        <Gear key={k} N={60} m={6} x={540} y={cy} rot={ang - k * 0.05 * clamp01(f / 30)} draw={draw} opacity={0.18 * k * clamp01(f / 25)} spokes dashPitch={false} />
      ))}
      <Gear N={60} m={6} x={540} y={cy} rot={ang} draw={draw} spokes />
      <Layer>
        <g transform={`translate(540 ${cy})`}><Gauge r={300} v={v} max={8} draw={draw} label="RPM × 1000" /></g>
      </Layer>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1420, textAlign: "center", opacity: io(f, [8, 16], [0, 1]) }}>
        <Readout value={rpm.toLocaleString("en-US")} size={104} color={K.amber} />
        <span style={{ fontFamily: K.mono, fontSize: 30, color: K.muted, marginLeft: 14, letterSpacing: 4 }}>RPM</span>
      </div>
    </>
  );
};

/* ────────── 3 · WHEELS NEED FORCE ────────── */
export const WheelForce: React.FC = () => {
  const f = useCurrentFrame();
  const draw = io(f, [0, 20], [0, 1], easeOut);
  const strain = f > 22 ? Math.sin(f * 2.1) * 0.025 * clamp01((f - 22) / 8) : 0;
  const jx = f > 22 ? Math.sin(f * 3.7) * 2.5 : 0;
  const cx = 540 + jx, cy = 1010, r = 220;
  const sweep = io(f, [16, 34], [0, 0.3], easeOut) + (f > 34 ? Math.sin(f * 1.3) * 0.02 : 0);
  return (
    <>
      <Headline f={f} lines={["…but wheels", "need *force*"]} at={3} />
      <Layer>
        <line x1={80} y1={cy + r} x2={80 + 920 * draw} y2={cy + r} stroke={K.lineDim} strokeWidth={3} />
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={i} x1={80 + i * 44} y1={cy + r + 4} x2={64 + i * 44} y2={cy + r + 20} stroke={K.lineDim} strokeWidth={1.5} opacity={draw} />
        ))}
        <g transform={`translate(${cx} ${cy})`}>
          <Wheel r={r} rot={strain} stroke={4} draw={draw} />
          <g transform="rotate(0)"><TorqueArrow r={r + 52} sweep={sweep} mag={0.12} color={K.red} start={-150} /></g>
        </g>
        {f > 40 && Array.from({ length: 3 }).map((_, i) => (
          <line key={i} x1={cx - r - 40 - i * 26} y1={cy + r - 12 - i * 18} x2={cx - r - 70 - i * 26} y2={cy + r - 12 - i * 18}
            stroke={K.muted} strokeWidth={3} strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(f * 1.5 + i)} />
        ))}
      </Layer>
      <Tag f={f} at={40} text="NOT ENOUGH TORQUE" x={540} y={cy - r - 110} color={K.red} solid size={28} />
      <Meter x={150} y={1300} w={780} v={io(f, [22, 40], [0, 0.88])} label="TORQUE NEEDED" value="HIGH" color={K.amber} o={io(f, [20, 28], [0, 1])} />
      <Meter x={150} y={1410} w={780} v={io(f, [30, 48], [0, 0.2])} label="ENGINE ALONE" value="LOW" color={K.red} o={io(f, [28, 36], [0, 1])} />
    </>
  );
};

/* ────────── 4 · SO WE USE GEARS ────────── */
const toothDots = (f: number, at: number, N: number, m: number, x: number, y: number, s: number, rot: number) =>
  Array.from({ length: N }).map((_, k) => {
    const on = f >= at + k * 2;
    const a = rot + (k * TAU) / N;
    const rr = ((m * N) / 2 + m + 26) * s;
    return <circle key={k} cx={x + rr * Math.cos(a)} cy={y + rr * Math.sin(a)} r={on ? 7 : 0} fill={K.amber} opacity={on ? 1 - io(f, [at + k * 2 + 14, at + k * 2 + 30], [0, 0.6]) : 0} />;
  });

export const SmallGear: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.small + f;
  const draw = io(f, [2, 30], [0, 1], easeInOut);
  const rot = driverAngle(g);
  const n = Math.min(10, Math.max(0, Math.floor((f - 18) / 2) + 1));
  return (
    <>
      <Headline f={f} lines={["So we use", "*gears.*"]} at={2} exitAt={46} />
      <Gear N={10} m={20} x={540} y={980} rot={rot} draw={draw} scale={1.6} marker />
      <Layer>{toothDots(f, 18, 10, 20, 540, 980, 1.6, rot)}</Layer>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center", opacity: io(f, [16, 22], [0, 1]) }}>
        <Readout value={String(n).padStart(2, "0")} size={120} color={K.amber} />
        <span style={{ fontFamily: K.mono, fontSize: 34, color: K.muted, marginLeft: 16, letterSpacing: 6 }}>TEETH</span>
      </div>
    </>
  );
};

/* ────────── 5 · MESH: 3 TURNS → 1 TURN ────────── */
const PAIR = { y: 960, x1: 240, x2: 640 };
export const Mesh: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.mesh + f;
  const mv = io(f, [0, 22], [0, 1], easeInOut);
  const x1 = 540 + (PAIR.x1 - 540) * mv, y1 = 980 + (PAIR.y - 980) * mv, s1 = 1.6 - 0.6 * mv;
  const bx = io(f, [6, 30], [980, PAIR.x2], easeOut);
  const bdraw = io(f, [8, 40], [0, 1], easeInOut);
  const t1 = driverAngle(g);
  const t2 = meshPhase(30, 0) - (t1 * 10) / 30;
  const spin = io(g, [T.mesh + 36, T.mesh + 120], [0, 3], easeInOut);
  const done = f >= 120;
  return (
    <>
      <Headline f={f} lines={["Small: *3 turns*", "Big: *1 turn*"]} at={40} stagger={14} />
      <Headline f={f} lines={["Two gears"]} at={0} exitAt={36} />
      <Gear N={10} m={20} x={x1} y={y1} rot={t1} scale={s1} marker glow={done ? io(f, [120, 126], [0, 1]) : 0} />
      <Gear N={30} m={20} x={bx} y={PAIR.y} rot={t2} draw={bdraw} marker />
      <Tag f={f} at={10} text="10 TEETH" x={PAIR.x1} y={PAIR.y + 200} color={K.line} size={24} />
      <Tag f={f} at={30} text="30 TEETH" x={PAIR.x2} y={PAIR.y + 362} color={K.line} size={24} />
      {[{ x: 270, lbl: "SMALL", v: spin }, { x: 810, lbl: "BIG", v: spin / 3 }].map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x, top: 1390, transform: "translateX(-50%)", textAlign: "center", opacity: io(f, [34 + i * 4, 42 + i * 4], [0, 1]) }}>
          <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 5, color: K.muted }}>{c.lbl} · TURNS</div>
          <Readout value={c.v.toFixed(1)} size={96} color={i === 0 ? K.amber : K.text} />
        </div>
      ))}
      <Tag f={f} at={121} text="×3" x={540} y={1450} color={K.amber} solid size={40} />
    </>
  );
};

/* ────────── 6 · LOSE SPEED, GAIN FORCE ────────── */
export const Trade: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.trade + f;
  const t1 = driverAngle(g);
  const t2 = meshPhase(30, 0) - (t1 * 10) / 30;
  const sp = io(f, [6, 28], [1, 1 / 3], easeInOut);
  const tq = io(f, [40, 62], [1 / 3, 1], easeInOut);
  const shrink = io(f, [0, 16], [1, 0.72], easeInOut);
  return (
    <>
      <Headline f={f} lines={["Lose *speed*,"]} at={2} />
      <Headline f={f} lines={["gain *force*"]} at={38} top={460} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${-90 * (1 - shrink) / 0.28}px) scale(${shrink})`, transformOrigin: "440px 960px" }}>
        <Gear N={10} m={20} x={PAIR.x1} y={PAIR.y} rot={t1} marker />
        <Gear N={30} m={20} x={PAIR.x2} y={PAIR.y} rot={t2} marker glow={io(f, [44, 60], [0, 1])} />
        <Layer>
          <g transform={`translate(${PAIR.x2} ${PAIR.y})`}><TorqueArrow r={360} sweep={io(f, [42, 62], [0, 0.45])} mag={0.9} color={K.amber} start={-60} /></g>
        </Layer>
      </div>
      <Meter x={150} y={1250} w={780} v={sp} label="OUTPUT SPEED" value={`${Math.round(sp * 100)}%`} color={K.line} o={io(f, [2, 8], [0, 1])} />
      <Meter x={150} y={1360} w={780} v={tq} label="OUTPUT TORQUE" value={`×${(tq * 3).toFixed(1)}`} color={K.amber} o={io(f, [34, 40], [0, 1])} />
      <Label f={f} at={66} text="POWER = TORQUE × SPEED  (≈ CONSTANT)" x={540} y={1470} size={22} align="center" color={K.text} />
    </>
  );
};

/* ────────── 7 · EQUATION HOLD ────────── */
export const Equation: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.eq + f;
  const t1 = driverAngle(g);
  const a = ioB(f, 2, 16), b = ioB(f, 12, 26);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 0.16 }}>
        <Gear N={10} m={20} x={300} y={1000} rot={t1} scale={1.3} />
        <Gear N={30} m={20} x={300 + 520} y={1000} rot={meshPhase(30, 0) - t1 / 3} scale={1.3} />
      </div>
      <Label f={f} at={0} text="GEAR RATIO" x={540} y={640} size={34} align="center" color={K.line} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 730, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ transform: `scale(${0.7 + 0.3 * a})`, opacity: clamp01(a) }}>
          <Readout value="30 ÷ 10" size={150} />
        </div>
        <div style={{ height: 3, width: 620 * clamp01(b), background: K.lineDim, margin: "26px 0" }} />
        <div style={{ transform: `scale(${0.7 + 0.3 * b})`, opacity: clamp01(b) }}>
          <Readout value="3 : 1" size={210} color={K.amber} />
        </div>
      </div>
      <Label f={f} at={18} text="DRIVEN TEETH ÷ DRIVER TEETH" x={540} y={1250} size={26} align="center" />
    </>
  );
};

/* ────────── 8 · FIRST GEAR = MAX FORCE ────────── */
export const FirstGear: React.FC = () => {
  const f = useCurrentFrame();
  const t = Math.max(0, f - 22);
  const dist = 0.5 * 0.11 * t * t; // px, steady acceleration from standstill
  const s = 1.2, road = 1250;
  const carX = 70 + dist * 0.35;
  const wheelRot = dist / (38 * s);
  const g = T.first + f;
  const t1 = g * 0.09;
  return (
    <>
      <Headline f={f} lines={["1st gear =", "*max force*"]} at={2} />
      <div style={{ position: "absolute", left: 540, top: 735, transform: "translate(-50%,-50%)", opacity: io(f, [4, 12], [0, 1]) }}>
        <div style={{ position: "relative", width: 420, height: 230 }}>
          <Gear N={10} m={20} x={110} y={115} rot={t1} scale={0.42} dashPitch={false} />
          <Gear N={30} m={20} x={110 + 400 * 0.42} y={115} rot={meshPhase(30, 0) - t1 / 3} scale={0.42} dashPitch={false} glow={1} />
        </div>
      </div>
      <Tag f={f} at={8} text="1ST · 3.00 : 1" x={540} y={880} color={K.amber} size={28} />
      <Layer>
        <line x1={0} y1={road} x2={1080} y2={road} stroke={K.lineDim} strokeWidth={3} />
        {Array.from({ length: 9 }).map((_, i) => {
          const x = ((i * 150 - dist * 0.65) % 1350 + 1350) % 1350 - 135;
          return <line key={i} x1={x} y1={road + 26} x2={x + 70} y2={road + 26} stroke={K.lineDim} strokeWidth={5} strokeLinecap="round" />;
        })}
        <g transform={`translate(${carX} ${road - 188 * s}) scale(${s})`}>
          <Car draw={1} wheelRot={wheelRot} engineGlow={0.8} />
          <g transform="translate(115 150)"><TorqueArrow r={62} sweep={io(f, [24, 40], [0, 0.85])} mag={1} color={K.amber} start={-110} /></g>
          <g transform="translate(475 150)"><TorqueArrow r={62} sweep={io(f, [28, 44], [0, 0.85])} mag={1} color={K.amber} start={-110} /></g>
          {t > 4 && [0, 1, 2].map((i) => (
            <line key={i} x1={-20 - i * 30} y1={70 + i * 32} x2={-80 - i * 30 - Math.min(60, t)} y2={70 + i * 32} stroke={K.line} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
          ))}
        </g>
      </Layer>
      <Meter x={150} y={1330} w={780} v={io(f, [30, 46], [0, 1])} label="WHEEL TORQUE" value="×3" color={K.amber} o={io(f, [26, 32], [0, 1])} />
      <Meter x={150} y={1440} w={780} v={io(f, [34, 50], [0, 0.33])} label="WHEEL SPEED" value="÷3" color={K.line} o={io(f, [30, 36], [0, 1])} />
    </>
  );
};

/* ────────── 9 · SHIFTING UP ────────── */
export const GEARS: [number, number][] = [[10, 30], [14, 26], [17, 23], [20, 20], [23, 17]];
export const SHIFT_AT = [0, 31, 61, 91, 118]; // local frames (global = T.shift + x)
const RATIO = GEARS.map(([a, b]) => b / a);
/** Road speed (arbitrary units) at each shift so the engine hits 6,000 rpm just before every shift. */
const V_AT = [600, 2000, 6000 / RATIO[1], 6000 / RATIO[2], 6000 / RATIO[3], 7500];
const V_F = [0, 31, 61, 91, 118, 136];

export const Shift: React.FC = () => {
  const f = useCurrentFrame();
  let gi = 0;
  SHIFT_AT.forEach((s, i) => { if (f >= s) gi = i; });
  const [n1, n2] = GEARS[gi];
  const sinceShift = f - SHIFT_AT[gi];
  const pop = gi > 0 ? ioB(f, SHIFT_AT[gi], SHIFT_AT[gi] + 10) : 1;
  const flash = gi > 0 ? 1 - io(f, [SHIFT_AT[gi], SHIFT_AT[gi] + 14], [0, 1]) : 0;
  const v = io(f, V_F, V_AT, (x) => x);
  const rpm = Math.min(6000, v * RATIO[gi]);
  const t1 = (T.shift + f) * 0.16;
  const m = 16, xA = 380, xB = 700, y = 900;
  return (
    <>
      <Headline f={f} lines={["Shift up =", "*more speed*"]} at={2} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.92 + 0.08 * pop})`, transformOrigin: `540px ${y}px` }}>
        <Gear N={n1} m={m} x={xA} y={y} rot={t1} glow={flash} dashPitch={false} />
        <Gear N={n2} m={m} x={xB} y={y} rot={meshPhase(n2, 0) - (t1 * n1) / n2} glow={flash} dashPitch={false} />
        <Label f={sinceShift} at={0} text={`${n1}T`} x={xA} y={y - 8 * n1 - 60} size={24} align="center" color={K.line} />
        <Label f={sinceShift} at={0} text={`${n2}T`} x={xB} y={y - 8 * n2 - 60} size={24} align="center" color={K.line} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center", gap: 18 }}>
        {[1, 2, 3, 4, 5].map((k) => {
          const on = k - 1 === gi;
          return (
            <div key={k} style={{ width: 92, height: 76, borderRadius: 10, border: `2px solid ${on ? K.amber : K.lineDim}`, background: on ? K.amber : "rgba(3,11,24,0.6)",
              color: on ? K.bgDeep : K.muted, fontFamily: K.mono, fontWeight: 700, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${on ? 0.9 + 0.1 * pop : 1})` }}>{k}</div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center" }}>
        <span style={{ fontFamily: K.mono, fontSize: 26, color: K.muted, letterSpacing: 5, marginRight: 18 }}>RATIO</span>
        <Readout value={`${RATIO[gi].toFixed(2)} : 1`} size={76} color={K.amber} />
      </div>
      <Meter x={150} y={1350} w={780} v={rpm / 8000} label="ENGINE RPM" value={(Math.round(rpm / 50) * 50).toLocaleString("en-US")} color={rpm > 5600 ? K.red : K.line} />
      <Meter x={150} y={1450} w={780} v={v / 7500} label="ROAD SPEED" value={`${Math.round((v / 7500) * 100)}%`} color={K.amber} />
    </>
  );
};

/* ────────── 10 · HERO: THE GEARBOX ────────── */
export const Hero: React.FC = () => {
  const f = useCurrentFrame();
  const xA = 360, xB = 680, y0 = 650, dy = 166, th = 62, sc = 8;
  const shaft = io(f, [0, 14], [0, 1], easeOut);
  const t1 = (T.hero + f) * 0.22;
  const sel = f < 40 ? 0 : f < 70 ? Math.min(4, Math.floor((f - 42) / 6) + 1) : 4;
  const inGlow = io(f, [11, 18], [0, 1]) * (1 - io(f, [34, 44], [0, 0.6]));
  const allGlow = io(f, [73, 80], [0, 1]);
  const engineOn = io(f, [11, 16], [0, 1]);
  return (
    <>
      <Headline f={f} lines={["One engine."]} at={9} exitAt={38} size={96} />
      <Headline f={f} lines={["Many *ratios.*"]} at={40} exitAt={64} size={96} />
      <Headline f={f} lines={["That's a *gearbox.*"]} at={73} size={96} />
      <Layer>
        <defs>
          {GEARS.map(([n1, n2], i) => (
            <React.Fragment key={i}>
              <pattern id={`ta${i}`} width={16} height={th} patternUnits="userSpaceOnUse" patternTransform={`translate(${(t1 * n1 * sc / 2) % 16} 0)`}>
                <rect width={9} height={th} fill={K.line} opacity={0.35} />
              </pattern>
              <pattern id={`tb${i}`} width={16} height={th} patternUnits="userSpaceOnUse" patternTransform={`translate(${(-t1 * n1 * sc / 2) % 16} 0)`}>
                <rect width={9} height={th} fill={i === sel ? K.amber : K.line} opacity={i === sel ? 0.7 : 0.25} />
              </pattern>
            </React.Fragment>
          ))}
        </defs>
        {/* shafts */}
        <line x1={xA} y1={545} x2={xA} y2={545 + 880 * shaft} stroke={inGlow > 0.05 ? K.amber : K.line} strokeWidth={14} strokeLinecap="round" opacity={0.9} style={{ filter: `drop-shadow(0 0 ${18 * inGlow}px ${K.amber})` }} />
        <line x1={xB} y1={1460 - 900 * shaft} x2={xB} y2={1460} stroke={allGlow > 0.5 ? K.amber : K.line} strokeWidth={14} strokeLinecap="round" opacity={0.9} />
        {GEARS.map(([n1, n2], i) => {
          const y = y0 + i * dy;
          const ex = ioB(f, 8 + i * 4, 22 + i * 4);
          const w1 = n1 * sc * ex, w2 = n2 * sc * ex;
          const on = i === sel;
          return (
            <g key={i} opacity={clamp01((f - 8 - i * 4) / 4)}>
              <rect x={xA - w1} y={y - th / 2} width={w1 * 2} height={th} rx={6} fill={`url(#ta${i})`} stroke={K.line} strokeWidth={3} />
              <rect x={xB - w2} y={y - th / 2} width={w2 * 2} height={th} rx={6} fill={`url(#tb${i})`} stroke={on || allGlow > 0.5 ? K.amber : K.line} strokeWidth={on ? 5 : 3} />
              {on && <rect x={xB - 22} y={y - th / 2 - 16} width={44} height={th + 32} rx={6} fill={K.amber} />}
              <text x={110} y={y + 14} fontFamily={K.mono} fontWeight={700} fontSize={40} fill={on ? K.amber : K.muted} opacity={ex}>{i + 1}</text>
              <text x={xB + w2 + 18} y={y + 10} fontFamily={K.mono} fontSize={26} fill={on ? K.amber : K.text} opacity={io(f, [42 + i * 6, 48 + i * 6], [0, 1])}>{(n2 / n1).toFixed(2)}</text>
            </g>
          );
        })}
      </Layer>
      <Label f={f} at={12} out={66} text="ENGINE IN ↓" x={xA} y={500} size={24} align="center" color={engineOn > 0.5 ? K.amber : K.muted} />
      <Label f={f} at={20} text="↓ TO WHEELS" x={xB} y={1478} size={24} align="center" color={K.line} />
      <Label f={f} at={24} text="SIMPLIFIED SCHEMATIC · 5-SPEED" x={540} y={1530} size={20} align="center" />
    </>
  );
};

/* ────────── 11 · END CARD ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.end + f;
  const a = g * 0.05;
  const p = ioB(f, 2, 18);
  const fade = 1 - io(f, [64, 72], [0, 1]);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Headline f={f} lines={["Which machine", "*next?*"]} at={4} top={420} size={100} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1000px", opacity: clamp01(p) }}>
        {(() => {
          const m = 18, cd = (m * 23) / 2, cx = 540 - cd * 0.17, cy = 1060 + cd * 0.29;
          const d3 = (-120 * Math.PI) / 180;
          return (
            <>
              <Gear N={14} m={m} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
              <Gear N={9} m={m} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
              <Gear N={9} m={m} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
            </>
          );
        })()}
      </div>
      <Tag f={f} at={22} text="COMMENT BELOW  ↓" x={540} y={1300} color={K.amber} solid size={32} />
      <Label f={f} at={30} text="AKS PRODUCTIONS" x={540} y={1385} size={30} align="center" color={K.text} />
      <Label f={f} at={36} text="FOLLOW FOR PART 02 · THE ENGINE" x={540} y={1440} size={22} align="center" />
    </div>
  );
};

export { gearPath };
