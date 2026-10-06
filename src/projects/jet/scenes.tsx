import React from "react";
import { useCurrentFrame } from "remotion";
import { easeIn, easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Layer, Meter, Readout, Tag, TAU, clamp01, ioB, meshPhase } from "../gearbox/kit";

/** Scene starts (global frames @30fps). Keep in sync with soundtrack.py. */
export const T = { hook: 0, words: 66, suck: 160, squeeze: 284, bang: 404, blow: 524, hero: 645, end: 812, total: 900 };
export const CUTS = [0, 66, 160, 284, 404, 524, 645, 812];
const hash = (i: number, j = 0) => { const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); };
const HOT = "#FF7A3D";

/* ────────── engine geometry (engine space: x 0..1000, y −230..230) ────────── */
const COMP = Array.from({ length: 8 }).map((_, i) => ({ x: 232 + i * 31, tip: 108 - i * 6.5, rotor: i % 2 === 0 }));
const TURB = Array.from({ length: 4 }).map((_, i) => ({ x: 632 + i * 32, tip: 70 + i * 7, rotor: i % 2 === 0 }));
const HUB = 26;
/** core flow radius along x */
const rCore = (x: number) => {
  const X = [-60, 200, 230, 470, 500, 620, 640, 760, 1060], R = [190, 118, 108, 58, 64, 64, 70, 92, 86];
  for (let i = 0; i < X.length - 1; i++) if (x <= X[i + 1]) return R[i] + (R[i + 1] - R[i]) * ((x - X[i]) / (X[i + 1] - X[i]));
  return R[R.length - 1];
};
/** particle u → x (slow + dense through the compressor, fast out of the nozzle) */
const uToX = (u: number, core: boolean) => {
  const U = core ? [0, 0.22, 0.6, 0.72, 1] : [0, 1], Xs = core ? [-80, 220, 480, 620, 1080] : [-80, 1080];
  for (let i = 0; i < U.length - 1; i++) if (u <= U[i + 1]) return Xs[i] + (Xs[i + 1] - Xs[i]) * ((u - U[i]) / (U[i + 1] - U[i]));
  return Xs[Xs.length - 1];
};
const NP = 220;

type Cam = { fx: number; s: number };
const CAM: [number, Cam][] = [
  [66, { fx: 500, s: 1 }], [160, { fx: 500, s: 1 }], [182, { fx: 120, s: 1.75 }], [284, { fx: 120, s: 1.75 }], [306, { fx: 350, s: 2.05 }],
  [404, { fx: 350, s: 2.05 }], [426, { fx: 555, s: 2.4 }], [524, { fx: 555, s: 2.4 }], [546, { fx: 700, s: 1.9 }], [592, { fx: 700, s: 1.9 }],
  [614, { fx: 520, s: 1.02 }], [645, { fx: 520, s: 1.02 }], [812, { fx: 520, s: 1.1 }],
];
const cam = (g: number): Cam => {
  for (let i = 0; i < CAM.length - 1; i++) {
    const [a, A] = CAM[i], [b, B] = CAM[i + 1];
    if (g <= b) { const t = easeInOut(clamp01((g - a) / (b - a))); return { fx: A.fx + (B.fx - A.fx) * t, s: A.s + (B.s - A.s) * t }; }
  }
  return CAM[CAM.length - 1][1];
};

/** Which section is in focus: 0 all, 1 fan, 2 compressor, 3 combustor, 4 turbine+nozzle */
const focusAt = (g: number) => (g < 70 ? 0 : g < 160 ? (g < 92 ? 1 : g < 116 ? 2 : g < 137 ? 3 : 4) : g < 284 ? 1 : g < 404 ? 2 : g < 524 ? 3 : g < 600 ? 4 : 0);

const RotorRow: React.FC<{ id: string; x: number; tip: number; w: number; off: number; color: string; o: number }> = ({ id, x, tip, w, off, color, o }) => (
  <g opacity={o}>
    <defs>
      <pattern id={id} width={w} height={12} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${off % 12})`}>
        <path d={`M 0 12 L ${w} 0`} stroke={color} strokeWidth={4} />
      </pattern>
    </defs>
    {[-1, 1].map((sgn) => (
      <rect key={sgn} x={x - w / 2} y={sgn < 0 ? -tip : HUB} width={w} height={tip - HUB} rx={3} fill={`url(#${id})`} stroke={color} strokeWidth={2} />
    ))}
  </g>
);

export const Engine: React.FC<{ g: number; draw: number; flow: number; flame: number; shaftGlow: number; thrust: number }> = ({ g, draw, flow, flame, shaftGlow, thrust }) => {
  const sd = (p: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - clamp01(p) });
  const fo = focusAt(g);
  const dim = (sec: number) => (fo === 0 || fo === sec ? 1 : 0.3);
  const spin = g * 7;
  const fanAng = g * 0.32;
  const d2 = clamp01(draw * 1.6 - 0.6);
  // nacelle + core outlines (top half; mirrored)
  const nacelle = "M 0 -205 Q -6 -228 24 -232 L 600 -222 Q 700 -214 770 -196 L 770 -186 Q 700 -196 600 -204 L 40 -208 Q 14 -206 0 -205 Z";
  const core = "M 200 -126 Q 206 -132 222 -122 L 480 -70 Q 492 -82 520 -84 L 610 -84 Q 630 -84 640 -80 L 770 -104 L 960 -92 L 960 -86 L 770 -96 L 760 -94";
  const tail = "M 760 -36 Q 900 -30 1010 0";
  return (
    <g>
      {/* bypass + core duct outlines */}
      {[-1, 1].map((sg) => (
        <g key={sg} transform={`scale(1 ${sg})`}>
          <path d={nacelle} fill={K.line} fillOpacity={0.07 * d2} stroke={K.line} strokeWidth={3} {...sd(draw)} />
          <path d={core} fill="none" stroke={K.line} strokeWidth={3} {...sd(draw * 1.2 - 0.1)} />
          <path d={tail} fill="none" stroke={K.lineDim} strokeWidth={3} {...sd(draw * 1.3 - 0.3)} />
          {/* combustor liner */}
          <path d="M 492 -36 Q 500 -64 530 -66 L 600 -66 Q 616 -60 620 -40" fill="none" stroke={flame > 0.1 ? HOT : K.line} strokeWidth={2.5} opacity={d2 * dim(3)} />
        </g>
      ))}
      {/* spinner */}
      <path d="M 120 -30 Q 30 -22 10 0 Q 30 22 120 30 Z" fill={K.bgDeep} stroke={K.line} strokeWidth={3} {...sd(draw)} opacity={dim(1)} />
      {/* shaft */}
      <g opacity={d2}>
        <rect x={110} y={-9} width={660} height={18} rx={4} fill={shaftGlow > 0.05 ? K.amber : K.lineDim} fillOpacity={0.3 + 0.5 * shaftGlow} stroke={shaftGlow > 0.05 ? K.amber : K.lineDim} strokeWidth={2}
          style={shaftGlow > 0.05 ? { filter: `drop-shadow(0 0 ${14 * shaftGlow}px ${K.amber})` } : undefined} />
        {shaftGlow > 0.05 && Array.from({ length: 6 }).map((_, i) => {
          const x = 760 - (((g * 9 + i * 110) % 660));
          return <path key={i} d={`M ${x + 16} -6 L ${x} 0 L ${x + 16} 6`} stroke={K.bgDeep} strokeWidth={3} fill="none" opacity={shaftGlow} />;
        })}
      </g>
      {/* fan (side view of spinning blades) */}
      <g opacity={d2 * dim(1)}>
        {Array.from({ length: 22 }).map((_, k) => {
          const a = fanAng + (k / 22) * TAU;
          const y = Math.sin(a) * 196, c = Math.cos(a);
          if (Math.abs(y) < 32) return null;
          return <line key={k} x1={92 - 14 * c} y1={y - 10} x2={92 + 14 * c} y2={y + 10} stroke={c > 0 ? K.line : K.lineDim} strokeWidth={c > 0 ? 6 : 3} strokeLinecap="round" opacity={c > 0 ? 1 : 0.5} />;
        })}
        <rect x={76} y={-202} width={32} height={404} rx={10} fill={K.line} fillOpacity={0.05} stroke={K.lineDim} strokeWidth={2} />
      </g>
      {/* compressor rows */}
      {COMP.map((c, i) => (
        <RotorRow key={i} id={`c${i}`} x={c.x} tip={c.tip} w={18} off={c.rotor ? spin * (1 + i * 0.08) : 0} color={c.rotor ? K.line : K.lineDim} o={d2 * dim(2) * clamp01(draw * 3 - 1 - i * 0.12)} />
      ))}
      {/* fuel injectors + flame */}
      <g opacity={d2 * dim(3)}>
        {[-1, 1].map((sg) => <rect key={sg} x={488} y={sg * 50 - 6} width={18} height={12} rx={3} fill={K.text} />)}
        {flame > 0.02 && [-1, 1].map((sg) => (
          <g key={sg}>
            {Array.from({ length: 7 }).map((_, k) => {
              const fl = 0.75 + 0.25 * Math.sin(g * 0.9 + k * 1.7);
              return <ellipse key={k} cx={530 + k * 12} cy={sg * 50} rx={(26 - k * 2) * flame * fl} ry={(14 - k) * flame * fl}
                fill={k < 2 ? "#FFF1B8" : k < 4 ? K.amber : HOT} opacity={(0.85 - k * 0.08) * flame} style={{ filter: "blur(3px)" }} />;
            })}
          </g>
        ))}
        {flame > 0.02 && <rect x={500} y={-64} width={120} height={128} fill={HOT} opacity={0.12 * flame} style={{ filter: "blur(18px)" }} />}
      </g>
      {/* turbine rows */}
      {TURB.map((c, i) => (
        <RotorRow key={i} id={`t${i}`} x={c.x} tip={c.tip} w={20} off={c.rotor ? -spin * 1.2 : 0} color={c.rotor ? (flame > 0.3 ? K.amber : K.line) : K.lineDim} o={d2 * dim(4) * clamp01(draw * 3 - 1.6 - i * 0.1)} />
      ))}
      {/* particles */}
      {flow > 0 && Array.from({ length: NP }).map((_, i) => {
        const core = i % 100 < 62;
        const speed = core ? 0.0042 : 0.0062;
        const u = (hash(i) + g * speed * (0.9 + 0.2 * hash(i, 5))) % 1;
        const x = uToX(u, core);
        const lane = (hash(i, 2) * 2 - 1);
        let y: number;
        if (core) y = lane * (rCore(x) - 14);
        else { const sg = lane < 0 ? -1 : 1; const r = 132 + Math.abs(lane) * 64; y = sg * (x < 0 ? r + 18 : x > 770 ? r - (x - 770) * 0.12 : r); }
        const hot = core && x > 490;
        const heat = core ? clamp01((x - 490) / 60) * flame : 0;
        const comp = core ? clamp01((x - 230) / 240) : 0;
        const col = heat > 0.5 ? (x > 640 ? HOT : K.amber) : K.line;
        const sec = x < 200 ? 1 : !core ? 0 : x < 480 ? 2 : x < 625 ? 3 : 4;
        const o = flow * (fo === 0 || fo === sec || (!core && fo === 1) ? 1 : 0.25) * (x > 1000 ? clamp01((1080 - x) / 80) : 1);
        const len = core ? (x > 640 ? 22 + 20 * flame : x < 230 ? 14 : 8 - comp * 3) : 14;
        return <line key={i} x1={x - len} y1={y} x2={x} y2={y} stroke={col} strokeWidth={hot ? 4.5 : 3.5} strokeLinecap="round" opacity={o * (core ? 0.95 : 0.6)} />;
      })}
      {/* exhaust plume */}
      {flame > 0.05 && <ellipse cx={1000} cy={0} rx={160} ry={70 + 10 * Math.sin(g * 0.7)} fill={HOT} opacity={0.12 * flame} style={{ filter: "blur(24px)" }} />}
      {thrust > 0 && (
        <g opacity={clamp01(thrust)}>
          <path d={`M ${-30} 0 L ${-30 - 240 * thrust} 0`} stroke={K.green} strokeWidth={14} strokeLinecap="round" />
          <path d={`M ${-30 - 240 * thrust - 34} 0 L ${-30 - 240 * thrust + 4} -26 L ${-30 - 240 * thrust + 4} 26 Z`} fill={K.green} />
        </g>
      )}
    </g>
  );
};

/** Engine shot: maps engine space → screen with the keyframed push-in, clipped to a detail window. */
const EX0 = 40, EY = 960;
export const EngineShot: React.FC = () => {
  const L = useCurrentFrame();
  const g = T.words + L;
  const c = cam(g);
  const draw = io(g, [66, 104], [0, 1], easeInOut);
  const flow = io(g, [150, 180], [0.25, 1]) * (g < 150 ? clamp01((g - 80) / 30) * 0.25 / 0.25 : 1);
  const flame = io(g, [432, 452], [0, 1], easeOut);
  const shaftGlow = io(g, [556, 566], [0, 1]) * (1 - io(g, [610, 622], [0, 1])) + io(g, [700, 712], [0, 0.6]);
  const thrust = io(g, [690, 712], [0, 1], easeOut);
  const tx = 540 - (EX0 + c.fx) * c.s;
  const shake = g >= 652 && g < 680 ? Math.sin(g * 3.1) * 3 * (1 - (g - 652) / 28) : 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 590, height: 720, overflow: "hidden",
      WebkitMaskImage: "linear-gradient(180deg, transparent 0, black 60px, black 660px, transparent 720px)" }}>
      <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ overflow: "visible" }}>
        <g transform={`translate(${tx + shake} ${EY - 590}) scale(${c.s}) translate(${EX0} 0)`}>
          <Engine g={g} draw={draw} flow={flow} flame={flame} shaftGlow={shaftGlow} thrust={0 * thrust} />
        </g>
      </svg>
    </div>
  );
};
/** Engine-space point → screen (for labels that sit outside the clip window). */
const toScreen = (g: number, x: number, y: number) => { const c = cam(g); return { x: 540 + (EX0 + x - (EX0 + c.fx)) * c.s, y: EY + y * c.s }; };

/* ────────── 1 · HOOK (front view airliner → push into engine) ────────── */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const draw = io(f, [2, 28], [0, 1], easeInOut);
  const push = io(f, [40, 66], [1, 6.5], easeIn);
  const sd = (p: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - clamp01(p) });
  const eng = (cx: number) => (
    <g>
      <circle cx={cx} cy={1040} r={58} fill={K.bgDeep} stroke={K.line} strokeWidth={4} {...sd(draw * 1.2)} />
      <circle cx={cx} cy={1040} r={14} fill={K.line} opacity={clamp01(draw * 2 - 1)} />
      {Array.from({ length: 14 }).map((_, k) => {
        const a = f * 0.35 + (k / 14) * TAU;
        return <line key={k} x1={cx + Math.cos(a) * 16} y1={1040 + Math.sin(a) * 16} x2={cx + Math.cos(a + 0.35) * 52} y2={1040 + Math.sin(a + 0.35) * 52} stroke={K.line} strokeWidth={3} opacity={clamp01(draw * 2 - 1) * 0.9} />;
      })}
    </g>
  );
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "760px 1040px" }}>
        <Layer>
          <path d="M 540 870 L 552 690 L 528 690 Z" fill={K.line} fillOpacity={0.1} stroke={K.line} strokeWidth={3} {...sd(draw)} />
          <path d="M 470 880 L 610 880" stroke={K.line} strokeWidth={3} {...sd(draw)} />
          <path d="M 90 960 Q 300 990 470 975 M 610 975 Q 780 990 990 960" stroke={K.line} strokeWidth={5} fill="none" strokeLinecap="round" {...sd(draw)} />
          <circle cx={540} cy={960} r={84} fill={K.line} fillOpacity={0.06} stroke={K.line} strokeWidth={4} {...sd(draw)} />
          {[[512, 930], [568, 930]].map(([x, y], i) => <rect key={i} x={x - 16} y={y - 8} width={32} height={14} rx={5} fill={K.lineDim} opacity={clamp01(draw * 2 - 1)} />)}
          <line x1={330} y1={985} x2={330} y2={1000} stroke={K.line} strokeWidth={4} opacity={draw} />
          <line x1={760} y1={985} x2={760} y2={1000} stroke={K.line} strokeWidth={4} opacity={draw} />
          {eng(330)}{eng(760)}
          <line x1={70} y1={1150} x2={70 + 940 * draw} y2={1150} stroke={K.lineDim} strokeWidth={2.5} />
        </Layer>
      </div>
      <Headline f={f} lines={["4 words run every", "*jet engine*"]} at={6} exitAt={58} />
      <Label f={f} at={20} text="FIG.01 — AIRLINER · FRONT VIEW" x={540} y={1260} size={22} align="center" out={40} />
    </>
  );
};

/* ────────── 2 · THE FOUR WORDS (stamps over the engine) ────────── */
const WORDS: [string, number, number][] = [["SUCK", 70, 90], ["SQUEEZE", 92, 350], ["BANG", 116, 555], ["BLOW", 137, 800]];
export const Words: React.FC = () => {
  const L = useCurrentFrame();
  const g = T.words + L;
  return (
    <>
      <Headline f={L} lines={["Suck. Squeeze.", "*Bang. Blow.*"]} at={4} size={88} exitAt={86} />
      {WORDS.map(([w, at, x], i) => {
        const p = toScreen(g, x, i % 2 === 0 ? -265 : 265);
        return <Tag key={w} f={g} at={at} text={`${i + 1} · ${w}`} x={p.x} y={p.y} color={K.amber} solid={g >= at && g < at + 22} size={26} />;
      })}
      <Label f={L} at={10} text="TURBOFAN · CUTAWAY" x={540} y={1360} size={22} align="center" />
    </>
  );
};

/* ────────── 3–6 · STAGES ────────── */
const StageHead: React.FC<{ f: number; n: number; word: string; sub: string; exitAt: number }> = ({ f, n, word, sub, exitAt }) => (
  <>
    <Headline f={f} lines={[`${n} · *${word}*`]} at={2} exitAt={exitAt} size={104} />
    <Label f={f} at={10} text={sub} x={540} y={530} size={24} align="center" color={K.line} out={exitAt} />
  </>
);

export const Suck: React.FC = () => {
  const f = useCurrentFrame();
  const kg = io(f, [30, 90], [0, 1000], easeOut);
  return (
    <>
      <StageHead f={f} n={1} word="Suck" sub="INTAKE + FAN" exitAt={116} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1350, textAlign: "center", opacity: io(f, [26, 34], [0, 1]) }}>
        <div style={{ fontFamily: K.mono, fontSize: 24, letterSpacing: 5, color: K.muted }}>AIRFLOW</div>
        <Readout value={`${Math.round(kg).toLocaleString("en-US")}+`} size={104} color={K.amber} />
        <span style={{ fontFamily: K.mono, fontSize: 32, color: K.muted, marginLeft: 12 }}>kg/s</span>
        <div style={{ fontFamily: K.mono, fontSize: 20, letterSpacing: 3, color: K.muted, marginTop: 6 }}>LARGE TURBOFAN · TAKEOFF</div>
      </div>
      <Tag f={f} at={56} text="MOST AIR BYPASSES THE CORE" x={540} y={1290} color={K.line} size={22} out={112} />
    </>
  );
};

export const Squeeze: React.FC = () => {
  const f = useCurrentFrame();
  const p = io(f, [30, 100], [1, 40], (t) => easeInOut(t));
  return (
    <>
      <StageHead f={f} n={2} word="Squeeze" sub="COMPRESSOR · BLADES GET SMALLER" exitAt={116} />
      <Meter x={150} y={1360} w={780} v={p / 40} label="PRESSURE" value={`${p.toFixed(0)}×`} color={K.line} o={io(f, [24, 30], [0, 1])} />
      <Label f={f} at={34} text="ROTOR = SPINS · STATOR = STILL" x={540} y={1470} size={22} align="center" />
      <Tag f={f} at={100} text="≈40× ATMOSPHERE" x={540} y={1300} color={K.amber} solid size={26} out={114} />
    </>
  );
};

export const Bang: React.FC = () => {
  const f = useCurrentFrame();
  const t = io(f, [28, 70], [20, 1500], easeOut);
  return (
    <>
      <StageHead f={f} n={3} word="Bang" sub="COMBUSTOR · FUEL + AIR" exitAt={116} />
      <Meter x={150} y={1360} w={780} v={t / 1600} label="GAS TEMPERATURE" value={`${Math.round(t).toLocaleString("en-US")} °C${t > 1499 ? "+" : ""}`} color={t > 900 ? HOT : K.amber} o={io(f, [24, 30], [0, 1])} />
      <Label f={f} at={40} text="CONTINUOUS BURN — NOT EXPLOSIONS" x={540} y={1470} size={22} align="center" />
    </>
  );
};

export const Blow: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.blow + f;
  return (
    <>
      <StageHead f={f} n={4} word="Blow" sub="TURBINE + NOZZLE" exitAt={116} />
      <Tag f={g} at={556} text="TURBINE DRIVES FAN + COMPRESSOR" x={540} y={1340} color={K.amber} solid size={24} out={612} />
      <Label f={f} at={34} text="SAME SHAFT ←" x={540} y={1410} size={22} align="center" out={88} />
      <Tag f={g} at={606} text="EXHAUST OUT THE BACK →" x={540} y={1340} color={HOT} size={26} />
    </>
  );
};

/* ────────── 7 · HERO: thrust ────────── */
export const Hero: React.FC = () => {
  const f = useCurrentFrame();
  const g = T.hero + f;
  return (
    <>
      <Headline f={f} lines={["Air goes *back*"]} at={14} exitAt={44} size={96} />
      <Headline f={f} lines={["Plane goes *forward*"]} at={45} exitAt={84} size={88} />
      <Headline f={f} lines={["That's *thrust.*"]} at={87} size={104} />
      {[["1 · SUCK", 120], ["2 · SQUEEZE", 350], ["3 · BANG", 555], ["4 · BLOW", 800]].map(([t, x], i) => {
        const p = toScreen(g, x as number, i % 2 === 0 ? -258 : 258);
        return <Tag key={i} f={f} at={6 + i * 3} text={t as string} x={p.x} y={p.y} color={K.amber} size={22} />;
      })}
      <Layer>
        {(() => {
          const a = io(f, [14, 30], [0, 1], easeOut), b = io(f, [45, 61], [0, 1], easeOut);
          return (
            <g>
              <g opacity={clamp01(a * 3)}>
                <line x1={560} y1={1335} x2={560 + 360 * a} y2={1335} stroke={HOT} strokeWidth={12} strokeLinecap="round" />
                <path d={`M ${590 + 360 * a} 1335 L ${556 + 360 * a} 1312 L ${556 + 360 * a} 1358 Z`} fill={HOT} />
              </g>
              <g opacity={clamp01(b * 3)}>
                <line x1={520} y1={1335} x2={520 - 360 * b} y2={1335} stroke={K.green} strokeWidth={16} strokeLinecap="round" />
                <path d={`M ${484 - 360 * b} 1335 L ${522 - 360 * b} 1308 L ${522 - 360 * b} 1362 Z`} fill={K.green} />
              </g>
            </g>
          );
        })()}
      </Layer>
      <Label f={f} at={22} text="AIR →" x={760} y={1372} size={24} align="center" color={HOT} />
      <Label f={f} at={52} text="← PLANE" x={330} y={1372} size={24} align="center" color={K.green} />
      <Label f={f} at={88} text="NEWTON'S 3RD LAW · ACTION = REACTION" x={540} y={1440} size={22} align="center" color={K.text} />
      <Label f={f} at={96} text="SIMPLIFIED CUTAWAY · TWIN-SPOOL DETAIL OMITTED" x={540} y={1490} size={18} align="center" />
    </>
  );
};

/* ────────── 8 · END CARD ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const fade = 1 - io(f, [80, 88], [0, 1]);
  const m = 18, cd = (m * 23) / 2, cx = 540 - cd * 0.17, cy = 1060 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Headline f={f} lines={["Which machine", "*next?*"]} at={4} top={420} size={100} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1000px", opacity: clamp01(p) }}>
        <Gear N={14} m={m} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
      </div>
      <Tag f={f} at={22} text="COMMENT BELOW  ↓" x={540} y={1300} color={K.amber} solid size={32} />
      <Label f={f} at={30} text="AKS PRODUCTIONS" x={540} y={1385} size={30} align="center" color={K.text} />
      <Label f={f} at={36} text="FOLLOW FOR PART 04 · WHY BRIDGES USE TRIANGLES" x={540} y={1440} size={20} align="center" />
    </div>
  );
};

export { easeOut };
