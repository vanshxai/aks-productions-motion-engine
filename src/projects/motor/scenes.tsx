import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Layer, Tag, clamp01, ioB, meshPhase } from "../gearbox/kit";

/** Global frames from public/projects/motor/vo.json. Keep in sync with soundtrack.py. */
export const T = { force: 140, coil: 268, twist: 394, stuck: 420, flip: 545, hero: 675, end: 830, total: 900 };
export const CUTS = [0, 140, 268, 420, 545, 675, 830];
const RED = K.red, GREEN = K.green, N_COL = K.amber, S_COL = "#5CD3FF";
const D2R = Math.PI / 180;

/**
 * Rotor angle φ (deg, math convention: CCW positive, 0 = arm horizontal, conductor A on the right).
 * Torque ∝ cos φ with fixed current (no commutator) → it swings to vertical and stalls.
 * With the split-ring commutator the current flips each half turn → torque ∝ |cos φ| → it keeps turning.
 * Precomputed once so every frame (and the soundtrack) agrees.
 */
export const PHI: number[] = (() => {
  const out = new Array(901).fill(0);
  let phi = -65, w = 0;
  for (let g = 0; g <= 900; g++) {
    if (g < T.force) { out[g] = 30 + 9 * g; continue; }
    if (g < T.twist) { out[g] = -65; continue; }
    if (g < T.flip) { // no commutator
      const a = 0.0040 * Math.cos(phi * D2R) * 57.3 - 0.07 * w; w += a; phi += w; out[g] = phi; continue;
    }
    if (g === T.flip) w = 2.2; // a nudge past the dead spot
    const k = g < T.hero ? 0.012 : 0.012 + (g - T.hero) * 0.00012;
    const a = k * Math.abs(Math.cos(phi * D2R)) * 57.3 - 0.035 * w; w += a; phi += w; out[g] = phi;
  }
  return out;
})();
export const commutated = (g: number) => g < T.force || g >= T.flip;

/* ────────── drawing helpers ────────── */
const RC = { x: 540, y: 960 }, RR = 150;
const Conductor: React.FC<{ x: number; y: number; out: boolean; on: number; glow?: number }> = ({ x, y, out, on, glow = 0 }) => (
  <g>
    {glow > 0 && <circle cx={x} cy={y} r={44} fill={K.amber} opacity={0.35 * glow} style={{ filter: "blur(10px)" }} />}
    <circle cx={x} cy={y} r={28} fill={K.bgDeep} stroke={on > 0.5 ? K.amber : K.text} strokeWidth={5} />
    {on > 0.05 && (out
      ? <circle cx={x} cy={y} r={8} fill={K.amber} opacity={on} />
      : <g stroke={K.amber} strokeWidth={5} strokeLinecap="round" opacity={on}><line x1={x - 12} y1={y - 12} x2={x + 12} y2={y + 12} /><line x1={x + 12} y1={y - 12} x2={x - 12} y2={y + 12} /></g>)}
  </g>
);
const VArrow: React.FC<{ x: number; y: number; dir: number; len: number; col: string; o: number }> = ({ x, y, dir, len, col, o }) => {
  if (o <= 0.01 || len < 4) return null;
  const y1 = y - dir * 36, y2 = y1 - dir * len;
  return (
    <g opacity={o}>
      <line x1={x} y1={y1} x2={x} y2={y2 + dir * 18} stroke={col} strokeWidth={9} strokeLinecap="round" />
      <path d={`M ${x} ${y2} l -16 ${dir * 24} l 32 0 Z`} fill={col} />
    </g>
  );
};
const Poles: React.FC<{ g: number; glow?: number }> = ({ g, glow = 0 }) => {
  const top = 700, bot = 1220, face = 250;
  const arc = (side: number) => {
    const xIn = RC.x + side * face * Math.cos(Math.asin(260 / 300)) ;
    return xIn;
  };
  return (
    <g>
      {[-1, 1].map((side) => {
        const col = side < 0 ? N_COL : S_COL;
        const xo = side < 0 ? 80 : 1000, xi = RC.x + side * 255;
        const d = `M ${xo} ${top} L ${xi} ${top} Q ${RC.x + side * 205} ${RC.y} ${xi} ${bot} L ${xo} ${bot} Z`;
        return (
          <g key={side}>
            {glow > 0 && <path d={d} fill={col} opacity={0.25 * glow} style={{ filter: "blur(14px)" }} />}
            <path d={d} fill={col} fillOpacity={0.14} stroke={col} strokeWidth={4} />
            <text x={(xo + xi) / 2} y={RC.y + 30} textAnchor="middle" fontFamily={K.head} fontWeight={800} fontSize={96} fill={col}>{side < 0 ? "N" : "S"}</text>
          </g>
        );
      })}
      {/* field lines N → S */}
      {Array.from({ length: 7 }).map((_, i) => {
        const y = 760 + i * 66;
        return <line key={i} x1={RC.x - 250} y1={y} x2={RC.x + 250} y2={y} stroke={K.line} strokeWidth={2} strokeDasharray="14 12" strokeDashoffset={-g * 1.6} opacity={0.35} />;
      })}
      <text x={RC.x + 190} y={748} fontFamily={K.mono} fontSize={22} fill={K.muted}>B →</text>
      {arc(0) > 0 ? null : null}
    </g>
  );
};
/** Split-ring commutator inset: ring halves turn with φ, brushes fixed left/right. */
const Commutator: React.FC<{ phi: number; o: number; flash: number; x?: number; y?: number }> = ({ phi, o, flash, x = 540, y = 1390 }) => {
  const r = 58, gap = 14;
  const half = (start: number, col: string) => {
    const a0 = (start + gap / 2) * D2R, a1 = (start + 180 - gap / 2) * D2R;
    const p = (a: number, rr: number) => `${x + rr * Math.cos(a)} ${y - rr * Math.sin(a)}`;
    return <path d={`M ${p(a0, r)} A ${r} ${r} 0 0 0 ${p(a1, r)} L ${p(a1, r - 22)} A ${r - 22} ${r - 22} 0 0 1 ${p(a0, r - 22)} Z`} fill={col} fillOpacity={0.3} stroke={col} strokeWidth={3} />;
  };
  const right = Math.cos(phi * D2R) >= 0; // which half touches the + brush
  return (
    <g opacity={o}>
      {flash > 0 && <circle cx={x} cy={y} r={r + 30} fill={K.amber} opacity={0.35 * flash} style={{ filter: "blur(12px)" }} />}
      {half(phi - 90, right ? K.amber : S_COL)}
      {half(phi + 90, right ? S_COL : K.amber)}
      <rect x={x + r} y={y - 14} width={44} height={28} rx={4} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
      <rect x={x - r - 44} y={y - 14} width={44} height={28} rx={4} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
      <path d={`M ${x + r + 44} ${y} L ${x + 200} ${y} L ${x + 200} ${y + 90} L ${x + 30} ${y + 90}`} stroke={K.amber} strokeWidth={4} fill="none" />
      <path d={`M ${x - r - 44} ${y} L ${x - 200} ${y} L ${x - 200} ${y + 90} L ${x - 30} ${y + 90}`} stroke={S_COL} strokeWidth={4} fill="none" />
      <line x1={x + 30} y1={y + 70} x2={x + 30} y2={y + 110} stroke={K.text} strokeWidth={5} />
      <line x1={x - 30} y1={y + 80} x2={x - 30} y2={y + 100} stroke={K.text} strokeWidth={9} />
      <text x={x + 222} y={y + 8} fontFamily={K.mono} fontSize={26} fill={K.amber}>+</text>
      <text x={x - 236} y={y + 8} fontFamily={K.mono} fontSize={26} fill={S_COL}>−</text>
      <text x={x} y={y + 140} textAnchor="middle" fontFamily={K.mono} fontSize={19} letterSpacing={3} fill={K.muted}>SPLIT RING + BRUSHES</text>
    </g>
  );
};

/* ────────── the whole shot (0 – 830) ────────── */
export const MotorShot: React.FC = () => {
  const g = useCurrentFrame();
  const phi = PHI[Math.min(900, g)];
  const rotorO = g < T.force ? 1 - io(g, [130, 142], [0, 1]) : io(g, [T.coil, T.coil + 12], [0, 1]);
  const wireO = io(g, [T.force + 2, T.force + 12], [0, 1]) * (1 - io(g, [T.coil, T.coil + 10], [0, 1]));
  const comm = commutated(g);
  const c = Math.cos(phi * D2R), s = Math.sin(phi * D2R);
  const A = { x: RC.x + RR * c, y: RC.y - RR * s }, B = { x: RC.x - RR * c, y: RC.y + RR * s };
  const aOut = comm ? c >= 0 : true; // A carries current out (⊙) → pushed UP
  const curOn = g < T.force ? 1 : g >= T.coil ? io(g, [296, 304], [0, 1]) : 0;
  const forceO = g < T.force ? 0.9 : g >= T.coil ? curOn : 0;
  const leftShown = g >= T.coil && g < 340 ? 0 : 1; // "one side goes up" first, then the other
  const torque = (comm ? Math.abs(c) : c);
  const flash = comm && g >= T.flip ? clamp01(1 - Math.abs(Math.cos(phi * D2R)) * 6) : 0;
  const commO = g < T.force ? 0 : io(g, [T.flip, T.flip + 14], [0, 1]);
  // single wire shove (force scene)
  const shove = io(g, [222, 244], [0, 1], easeOut);
  const wy = RC.y - 150 * shove;
  const heroGlowN = io(g, [679, 686], [0, 1]) * (1 - io(g, [712, 730], [0, 1]));
  const heroGlowI = io(g, [716, 722], [0, 1]) * (1 - io(g, [748, 766], [0, 1]));
  const heroFlip = io(g, [751, 756], [0, 1]) * (1 - io(g, [760, 780], [0, 1]));
  const stuckO = io(g, [509, 516], [0, 1]) * (1 - io(g, [T.flip, T.flip + 8], [0, 1]));
  const fadeOut = io(g, [822, 832], [0, 1]);
  const ghost = g >= T.hero ? clamp01((PHI[Math.min(900, g)] - PHI[Math.min(900, g - 1)]) / 30) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fadeOut }}>
      {/* headlines — the hook is on screen in frame 0 */}
      <Headline f={g} lines={["No fuel.", "*Just magnets.*"]} at={-30} exitAt={132} size={100} />
      <Headline f={g} lines={["Current + magnet", "= *a shove*"]} at={146} exitAt={262} size={92} />
      <Headline f={g} lines={["A loop = *a twist*"]} at={272} exitAt={415} size={92} />
      <Headline f={g} lines={["Half a turn…", "*then it stalls*"]} at={425} exitAt={540} size={92} accent={RED} />
      <Headline f={g} lines={["Flip the current,", "*keep spinning*"]} at={548} exitAt={670} size={92} accent={GREEN} />
      <Headline f={g} lines={["Magnets."]} at={679} exitAt={712} size={104} />
      <Headline f={g} lines={["Current."]} at={716} exitAt={747} size={104} />
      <Headline f={g} lines={["Flip."]} at={751} exitAt={780} size={104} />
      <Headline f={g} lines={["That's an *electric motor.*"]} at={784} size={84} />
      <Layer>
        <Poles g={g} glow={heroGlowN} />
        {/* single wire */}
        {wireO > 0 && (
          <g opacity={wireO}>
            <Conductor x={RC.x} y={wy} out on={io(g, [146, 154], [0, 1])} />
            <VArrow x={RC.x} y={wy} dir={1} len={110} col={K.amber} o={io(g, [218, 226], [0, 1])} />
            {shove > 0.05 && Array.from({ length: 3 }).map((_, i) => <line key={i} x1={RC.x - 30 + i * 30} y1={wy + 50 + i * 4} x2={RC.x - 30 + i * 30} y2={wy + 50 + 60 * shove + i * 4} stroke={K.text} strokeWidth={3} opacity={0.4} />)}
          </g>
        )}
        {/* rotor */}
        {rotorO > 0 && (
          <g opacity={rotorO}>
            {ghost > 0.05 && [1, 2, 3].map((k) => {
              const pk = PHI[Math.max(0, g - k)] * D2R;
              return <line key={k} x1={RC.x + RR * Math.cos(pk)} y1={RC.y - RR * Math.sin(pk)} x2={RC.x - RR * Math.cos(pk)} y2={RC.y + RR * Math.sin(pk)} stroke={K.line} strokeWidth={6} opacity={0.18 * ghost / k} />;
            })}
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={K.lineDim} strokeWidth={8} strokeDasharray="4 10" strokeLinecap="round" />
            <circle cx={RC.x} cy={RC.y} r={20} fill={K.bgDeep} stroke={K.line} strokeWidth={4} />
            {/* torque arc */}
            {forceO > 0.05 && Math.abs(torque) > 0.05 && (() => {
              const r = 205, sweep = 70 * Math.abs(torque), dirSign = torque > 0 ? 1 : -1, a0 = phi + 40;
              const p = (a: number) => `${RC.x + r * Math.cos(a * D2R)} ${RC.y - r * Math.sin(a * D2R)}`;
              const a1 = a0 + dirSign * sweep, col = torque > 0 ? GREEN : RED;
              return (
                <g opacity={forceO * (g >= T.coil && g < 394 ? 0 : 1)}>
                  <path d={`M ${p(a0)} A ${r} ${r} 0 0 ${dirSign > 0 ? 0 : 1} ${p(a1)}`} stroke={col} strokeWidth={8} fill="none" strokeLinecap="round" />
                  <circle cx={RC.x + r * Math.cos(a1 * D2R)} cy={RC.y - r * Math.sin(a1 * D2R)} r={11} fill={col} />
                </g>
              );
            })()}
            <VArrow x={A.x} y={A.y} dir={aOut ? 1 : -1} len={95} col={K.amber} o={forceO} />
            <VArrow x={B.x} y={B.y} dir={aOut ? -1 : 1} len={95} col={K.amber} o={forceO * leftShown * (g >= 340 && g < 360 ? io(g, [344, 352], [0, 1]) : 1)} />
            <Conductor x={A.x} y={A.y} out={aOut} on={curOn} glow={heroGlowI} />
            <Conductor x={B.x} y={B.y} out={!aOut} on={curOn} glow={heroGlowI} />
          </g>
        )}
        <Commutator phi={phi} o={commO} flash={Math.max(flash, heroFlip)} />
      </Layer>
      <Label f={g} at={-40} out={130} text="NO EXHAUST · NO PISTONS" x={540} y={608} size={22} align="center" color={K.line} />
      <Tag f={g} at={226} text="F = B · I · L" x={780} y={1300} color={K.amber} solid size={30} out={262} />
      <Label f={g} at={150} out={262} text="⊙ CURRENT OUT OF SCREEN" x={540} y={1260} size={20} align="center" />
      <Tag f={g} at={398} text="TORQUE" x={RC.x + 250} y={RC.y - 220} color={GREEN} size={24} out={466} />
      <Tag f={g} at={470} text="PUSH REVERSES" x={RC.x} y={1300} color={RED} size={26} out={540} />
      {stuckO > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 1350, textAlign: "center", opacity: stuckO }}>
        <span style={{ fontFamily: K.mono, fontWeight: 700, fontSize: 64, color: RED, letterSpacing: 6 }}>STUCK</span></div>}
      <Tag f={g} at={600} text="FLIPS EVERY HALF TURN" x={540} y={1290} color={K.amber} size={24} out={670} />
      <Label f={g} at={790} text="ELECTRIC MOTORS: 85–95% EFFICIENT · PETROL ENGINES: ~20–35%" x={540} y={600} size={19} align="center" color={K.text} />
      <Label f={g} at={700} text="REAL MOTORS USE MANY COILS (NO DEAD SPOT) · EVs FLIP WITH ELECTRONICS" x={540} y={640} size={16} align="center" />
    </div>
  );
};

/* ────────── end card ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const fade = 1 - io(f, [62, 69], [0, 1]);
  const m = 18, cd = (m * 23) / 2, cx = 540 - cd * 0.17, cy = 1060 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Headline f={f} lines={["Which machine", "*next?*"]} at={2} top={420} size={100} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1000px", opacity: clamp01(p) }}>
        <Gear N={14} m={m} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
      </div>
      <Tag f={f} at={16} text="COMMENT BELOW  ↓" x={540} y={1300} color={K.amber} solid size={32} />
      <Label f={f} at={20} text="AKS PRODUCTIONS" x={540} y={1385} size={30} align="center" color={K.text} />
      <Label f={f} at={24} text="FOLLOW FOR PART 07 · HYDRAULICS" x={540} y={1440} size={20} align="center" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => {
  const phi = 25;
  const c = Math.cos(phi * D2R), s = Math.sin(phi * D2R);
  const A = { x: RC.x + RR * c, y: RC.y - RR * s + 280 }, B = { x: RC.x - RR * c, y: RC.y + RR * s + 280 };
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.amber }}>HOW IT WORKS · 06</div>
        <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 128, lineHeight: 1, color: K.text, letterSpacing: -4 }}>The electric</div>
        <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: K.amber }}>motor</div>
      </div>
      <Layer>
        <g transform="translate(0 280)"><Poles g={0} glow={0.6} /></g>
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={K.lineDim} strokeWidth={8} strokeDasharray="4 10" />
        <VArrow x={A.x} y={A.y} dir={1} len={95} col={K.amber} o={1} />
        <VArrow x={B.x} y={B.y} dir={-1} len={95} col={K.amber} o={1} />
        <Conductor x={A.x} y={A.y} out on={1} glow={0.6} />
        <Conductor x={B.x} y={B.y} out={false} on={1} glow={0.6} />
      </Layer>
    </>
  );
};

export { easeInOut };
