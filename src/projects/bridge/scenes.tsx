import React from "react";
import { useCurrentFrame } from "remotion";
import { easeIn, easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Layer, Tag, clamp01, ioB, meshPhase } from "../gearbox/kit";
import { solve, truckLoads, warren } from "./truss";

/** Scene starts (global @30fps) — taken from public/projects/bridge/vo.json phrase timings. Keep in sync with soundtrack.py. */
export const T = { hook: 0, shapes: 66, why: 226, bridge: 343, bend: 558, hero: 690, end: 832, total: 900 };
export const CUTS = [0, 66, 226, 343, 458, 558, 690, 832];
const COMP = K.amber, TENS = "#5CD3FF", RED = K.red, GREEN = K.green;

/* ────────── shared bits ────────── */
const Ground: React.FC<{ y: number; x0: number; x1: number; o?: number }> = ({ y, x0, x1, o = 1 }) => (
  <g opacity={o}>
    <line x1={x0} y1={y} x2={x1} y2={y} stroke={K.lineDim} strokeWidth={3} />
    {Array.from({ length: Math.floor((x1 - x0) / 40) }).map((_, i) => (
      <line key={i} x1={x0 + 16 + i * 40} y1={y + 3} x2={x0 + i * 40} y2={y + 19} stroke={K.lineDim} strokeWidth={1.5} />
    ))}
  </g>
);
const Joint: React.FC<{ x: number; y: number; o?: number; c?: string }> = ({ x, y, o = 1, c = K.text }) => (
  <circle cx={x} cy={y} r={11} fill={K.bgDeep} stroke={c} strokeWidth={4} opacity={o} />
);
const Bar: React.FC<{ a: [number, number]; b: [number, number]; c: string; w?: number; o?: number; draw?: number }> = ({ a, b, c, w = 10, o = 1, draw = 1 }) => (
  <line x1={a[0]} y1={a[1]} x2={a[0] + (b[0] - a[0]) * clamp01(draw)} y2={a[1] + (b[1] - a[1]) * clamp01(draw)} stroke={c} strokeWidth={w} strokeLinecap="round" opacity={o} />
);
const PushArrow: React.FC<{ x: number; y: number; dir: number; p: number; c?: string }> = ({ x, y, dir, p, c = K.amber }) => {
  if (p <= 0.01) return null;
  const tx = x - dir * (1 - p) * 120;
  return (
    <g opacity={clamp01(p * 3)}>
      <line x1={tx - dir * 120} y1={y} x2={tx - dir * 30} y2={y} stroke={c} strokeWidth={12} strokeLinecap="round" />
      <path d={`M ${tx} ${y} L ${tx - dir * 40} ${y - 24} L ${tx - dir * 40} ${y + 24} Z`} fill={c} />
    </g>
  );
};

/* ────────── 1 · HOOK: truss bridge silhouette ────────── */
const BR = warren(6, 140, 120);
const BX = 120, BY = 1120;
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const draw = io(f, [2, 34], [0, 1], easeInOut);
  const pulse = f > 34 ? 0.5 + 0.5 * Math.sin((f - 34) * 0.35) : 0;
  return (
    <>
      <Headline f={f} lines={["Why are bridges", "full of *triangles?*"]} at={4} exitAt={58} />
      <Layer>
        <path d={`M 40 ${BY + 40} Q 540 ${BY + 70} 1040 ${BY + 40}`} stroke={K.lineDim} strokeWidth={2} fill="none" opacity={draw} />
        {Array.from({ length: 6 }).map((_, i) => (
          <path key={i} d={`M ${180 + i * 130} ${BY + 120 + (i % 2) * 22} q 30 -10 60 0 t 60 0`} stroke={K.lineDim} strokeWidth={2} fill="none" opacity={draw * 0.7} />
        ))}
        {[BX, BX + 840].map((x, i) => <rect key={i} x={x - 30} y={BY} width={60} height={200} fill={K.line} fillOpacity={0.06} stroke={K.line} strokeWidth={3} opacity={draw} />)}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = BR.nodes[i], b = BR.nodes[i + 1], t = BR.nodes[7 + i];
          const on = clamp01(draw * 7 - i);
          return (
            <path key={i} d={`M ${BX + a.x} ${BY + a.y} L ${BX + t.x} ${BY + t.y} L ${BX + b.x} ${BY + b.y} Z`} fill={K.amber} fillOpacity={0.05 + 0.18 * pulse * (i % 2 ? 1 : 0.6)}
              stroke="none" opacity={on} />
          );
        })}
        {BR.members.map(([a, b], k) => (
          <Bar key={k} a={[BX + BR.nodes[a].x, BY + BR.nodes[a].y]} b={[BX + BR.nodes[b].x, BY + BR.nodes[b].y]} c={K.line} w={6} draw={draw * 1.6 - (k / BR.members.length) * 0.6} />
        ))}
      </Layer>
      <Label f={f} at={22} text="FIG.01 — TRUSS BRIDGE · SIDE ELEVATION" x={540} y={1400} size={22} align="center" />
    </>
  );
};

/* ────────── 2 · SQUARE FOLDS, TRIANGLE HOLDS ────────── */
export const Shapes: React.FC = () => {
  const L = useCurrentFrame(); // 0 = global 66
  const g = L + 66;
  const draw = io(L, [0, 18], [0, 1], easeOut);
  const S = 250, base = 1180;
  // square: racking angle
  const phi = io(g, [106, 128], [0, 1.25], easeIn) + (g > 128 ? Math.sin((g - 128) * 0.9) * 0.02 * Math.max(0, 1 - (g - 128) / 12) : 0);
  const sx = 330;
  const A: [number, number] = [sx, base], B: [number, number] = [sx + S, base];
  const D: [number, number] = [sx - S * Math.sin(phi), base - S * Math.cos(phi)], Cc: [number, number] = [sx + S - S * Math.sin(phi), base - S * Math.cos(phi)];
  const sqCol = g > 108 ? RED : K.line;
  // triangle
  const tx = 660;
  const shake = g > 190 && g < 206 ? Math.sin(g * 3.2) * 3 : 0;
  const TA: [number, number] = [tx, base], TB: [number, number] = [tx + S, base], TC: [number, number] = [tx + S / 2 + shake, base - S * 0.866];
  const triCol = g > 190 ? GREEN : K.line;
  return (
    <>
      <Headline f={g} lines={["Square: *folds*"]} at={74} exitAt={140} />
      <Headline f={g} lines={["Triangle: *holds*"]} at={148} />
      <Layer>
        <Ground y={base + 12} x0={80} x1={1000} o={draw} />
        <g opacity={draw}>
          <Bar a={A} b={B} c={sqCol} /><Bar a={B} b={Cc} c={sqCol} /><Bar a={Cc} b={D} c={sqCol} /><Bar a={D} b={A} c={sqCol} />
          {[A, B, Cc, D].map((p, i) => <Joint key={i} x={p[0]} y={p[1]} />)}
        </g>
        <PushArrow x={Cc[0] + 20} y={Cc[1]} dir={-1} p={io(g, [76, 98], [0, 1], easeOut) * (1 - io(g, [136, 146], [0, 1]))} />
        <g opacity={draw}>
          <Bar a={TA} b={TB} c={triCol} /><Bar a={TB} b={TC} c={triCol} /><Bar a={TC} b={TA} c={triCol} />
          {[TA, TB, TC].map((p, i) => <Joint key={i} x={p[0]} y={p[1]} />)}
        </g>
        <PushArrow x={TC[0] + 24} y={TC[1]} dir={-1} p={io(g, [150, 172], [0, 1], easeOut)} />
      </Layer>
      <Tag f={g} at={112} text="FOLDS FLAT" x={360} y={1290} color={RED} solid size={28} />
      <Tag f={g} at={192} text="HOLDS SHAPE ✓" x={785} y={1290} color={GREEN} solid size={28} />
      <Label f={g} at={70} text="4 PINNED JOINTS" x={360} y={1350} size={20} align="center" />
      <Label f={g} at={150} text="3 PINNED JOINTS" x={785} y={1350} size={20} align="center" />
    </>
  );
};

/* ────────── 3 · WHY: 3 fixed sides = 1 shape ────────── */
export const Why: React.FC = () => {
  const L = useCurrentFrame(); // 0 = global 226
  const g = L + 226;
  const draw = io(L, [0, 20], [0, 1], easeInOut);
  const side = 460, cx = 540, base = 1200;
  const A: [number, number] = [cx - side / 2, base], B: [number, number] = [cx + side / 2, base];
  const pull = io(g, [296, 312], [0, 1], easeOut) * (1 - io(g, [322, 334], [0, 1], easeIn));
  const C: [number, number] = [cx + 120 * pull, base - side * 0.866 + 30 * pull];
  const lenB = Math.hypot(C[0] - B[0], C[1] - B[1]), lenA = Math.hypot(C[0] - A[0], C[1] - A[1]);
  const dA = ((lenA - side) / side) * 4, dB = ((lenB - side) / side) * 4; // in metres for a 4 m triangle
  const fmt = (d: number) => `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(2)} m`;
  const strained = pull > 0.05;
  return (
    <>
      <Headline f={g} lines={["3 fixed sides", "= *1 shape*"]} at={236} />
      <Layer>
        {strained && (
          <g opacity={pull * 0.35}>
            <Bar a={A} b={[cx, base - side * 0.866]} c={K.lineDim} w={6} /><Bar a={B} b={[cx, base - side * 0.866]} c={K.lineDim} w={6} />
          </g>
        )}
        <g opacity={draw}>
          <Bar a={A} b={B} c={K.line} w={12} />
          <Bar a={B} b={C} c={strained ? RED : K.line} w={12} />
          <Bar a={C} b={A} c={strained ? RED : K.line} w={12} />
          {[A, B, C].map((p, i) => <Joint key={i} x={p[0]} y={p[1]} />)}
        </g>
        {strained && <PushArrow x={C[0] + 40} y={C[1]} dir={1} p={pull} c={RED} />}
      </Layer>
      <Label f={L} at={14} text="a = 4.00 m" x={540} y={base + 30} size={26} align="center" color={K.text} />
      <div style={{ position: "absolute", left: cx - side / 4 - 210, top: base - side * 0.45, width: 200, textAlign: "right", fontFamily: K.mono, fontSize: 26, color: strained ? RED : K.text, opacity: draw }}>
        {strained ? fmt(dA) : "b = 4.00 m"}
      </div>
      <div style={{ position: "absolute", left: cx + side / 4 + 20, top: base - side * 0.45, width: 220, fontFamily: K.mono, fontSize: 26, color: strained ? RED : K.text, opacity: draw }}>
        {strained ? fmt(dB) : "c = 4.00 m"}
      </div>
      <Tag f={g} at={298} text="SIDES WOULD HAVE TO STRETCH" x={540} y={1330} color={RED} size={24} out={330} />
      <Tag f={g} at={330} text="SO IT WON'T MOVE" x={540} y={1330} color={GREEN} solid size={26} />
    </>
  );
};

/* ────────── 4–5 · BRIDGE: truck + live member forces ────────── */
const Truck: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-120} y={-62} width={86} height={50} rx={4} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
    <path d="M -30 -12 L -30 -48 L 0 -48 L 16 -28 L 16 -12 Z" fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
    <rect x={-22} y={-42} width={18} height={12} fill={K.line} opacity={0.6} />
    {[-100, -58, 2].map((wx, i) => <circle key={i} cx={wx} cy={-8} r={9} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />)}
  </g>
);

export const BridgeShot: React.FC = () => {
  const L = useCurrentFrame(); // 0 = global 343
  const g = L + 343;
  const draw = io(L, [0, 26], [0, 1], easeInOut);
  const truckX = io(g, [352, 548], [-180, 1020], (t) => t);
  const pos = truckX - 40 - BX; // load point (truck centre) along the chord
  const loads = truckLoads(6, 140, pos >= 0 && pos <= 840 ? pos : null, 1, 0.12);
  const F = solve(BR, loads);
  const show = io(g, [400, 416], [0, 1]);
  const fmax = 1.9;
  const topLbl = io(g, [463, 472], [0, 1]), botLbl = io(g, [521, 530], [0, 1]);
  const exit = io(g, [548, 558], [0, 1]);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${-exit * 40}px)`, opacity: 1 - exit }}>
      <Headline f={g} lines={["Load *flows*", "through the triangles"]} at={351} exitAt={456} size={84} />
      <Headline f={g} lines={["*Squeezed* on top"]} at={463} exitAt={552} size={84} />
      <Headline f={g} lines={["*Stretched* below"]} at={521} top={460} size={84} accent={TENS} />
      <Layer>
        {[BX, BX + 840].map((x, i) => <rect key={i} x={x - 30} y={BY} width={60} height={200} fill={K.line} fillOpacity={0.06} stroke={K.line} strokeWidth={3} opacity={draw} />)}
        <path d={`M 40 ${BY + 150} Q 540 ${BY + 175} 1040 ${BY + 150}`} stroke={K.lineDim} strokeWidth={2} fill="none" opacity={draw} />
        <line x1={0} y1={BY} x2={BX - 30} y2={BY} stroke={K.lineDim} strokeWidth={4} opacity={draw} />
        <line x1={BX + 870} y1={BY} x2={1080} y2={BY} stroke={K.lineDim} strokeWidth={4} opacity={draw} />
        {BR.members.map(([a, b], k) => {
          const f = F[k] / fmax, mag = clamp01(Math.abs(f));
          const col = Math.abs(f) < 0.04 ? K.lineDim : f < 0 ? COMP : TENS;
          const isTop = k >= 6 && k < 11, isBot = k < 6;
          const hl = isTop ? 1 + topLbl * 0.5 : isBot ? 1 + botLbl * 0.5 : 1;
          return (
            <Bar key={k} a={[BX + BR.nodes[a].x, BY + BR.nodes[a].y]} b={[BX + BR.nodes[b].x, BY + BR.nodes[b].y]}
              c={show > 0.5 ? col : K.line} w={(5 + 13 * mag * show) * hl} draw={draw * 1.6 - (k / BR.members.length) * 0.6}
              o={(topLbl > 0 || botLbl > 0) && !isTop && !isBot ? 0.55 : 1} />
          );
        })}
        {BR.nodes.map((n, i) => <circle key={i} cx={BX + n.x} cy={BY + n.y} r={7} fill={K.bgDeep} stroke={K.text} strokeWidth={3} opacity={draw} />)}
        <Truck x={truckX} y={BY - 2} />
        {show > 0 && pos >= 0 && pos <= 840 && (
          <g opacity={show}>
            <line x1={truckX - 40} y1={BY - 150} x2={truckX - 40} y2={BY - 82} stroke={K.text} strokeWidth={5} />
            <path d={`M ${truckX - 40} ${BY - 70} l -14 -20 l 28 0 Z`} fill={K.text} />
          </g>
        )}
      </Layer>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1380, display: "flex", justifyContent: "center", gap: 60, fontFamily: K.mono, fontSize: 26, letterSpacing: 3, opacity: show }}>
        <span style={{ color: COMP }}>━ COMPRESSION</span><span style={{ color: TENS }}>━ TENSION</span>
      </div>
      <Label f={L} at={30} text="WARREN TRUSS · LIVE MEMBER FORCES (SOLVED)" x={540} y={1440} size={20} align="center" />
    </div>
  );
};

/* ────────── 6 · BENDING vs PUSH/PULL ────────── */
export const Bend: React.FC = () => {
  const L = useCurrentFrame(); // 0 = global 558
  const g = L + 558;
  const draw = io(L, [0, 16], [0, 1], easeOut);
  const sag = io(g, [574, 596], [0, 1], easeInOut);
  const x0 = 140, x1 = 940, y = 820, th = 46;
  const beam = (o: number) => {
    const pts = Array.from({ length: 41 }).map((_, i) => {
      const u = i / 40, x = x0 + (x1 - x0) * u, dy = 90 * sag * Math.sin(Math.PI * u);
      return [x, y + dy + o] as [number, number];
    });
    return "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  };
  const band = () => {
    const top = Array.from({ length: 41 }).map((_, i) => { const u = i / 40; return [x0 + (x1 - x0) * u, y - th / 2 + 90 * sag * Math.sin(Math.PI * u)]; });
    const bot = top.map(([x, yy]) => [x, yy + th]).reverse();
    return "M " + [...top, ...bot].map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ") + " Z";
  };
  const sec = io(g, [628, 646], [0, 1], easeOut);
  return (
    <>
      <Headline f={g} lines={["Ideally,", "nothing *bends*"]} at={564} size={88} />
      <Layer>
        <g opacity={draw}>
          <path d={band()} fill={RED} fillOpacity={0.14 * sag} stroke="none" />
          <path d={beam(-th / 2)} stroke={sag > 0.3 ? RED : K.line} strokeWidth={4} fill="none" />
          <path d={beam(th / 2)} stroke={sag > 0.3 ? RED : K.line} strokeWidth={4} fill="none" />
          <line x1={x0} y1={y - th / 2} x2={x0} y2={y + th / 2} stroke={K.line} strokeWidth={4} />
          <line x1={x1} y1={y - th / 2} x2={x1} y2={y + th / 2} stroke={K.line} strokeWidth={4} />
          {[x0, x1].map((x, i) => <path key={i} d={`M ${x} ${y + th / 2} l -26 40 l 52 0 Z`} fill="none" stroke={K.text} strokeWidth={3} />)}
          <path d={`M 540 ${y - th / 2 - 110 + 90 * sag} l 0 70`} stroke={K.text} strokeWidth={6} />
          <path d={`M 540 ${y - th / 2 - 22 + 90 * sag} l -16 -24 l 32 0 Z`} fill={K.text} />
        </g>
      </Layer>
      <Tag f={g} at={594} text="PLAIN BEAM: BENDS" x={540} y={1010} color={RED} size={24} />
      {/* cross-section stress: bending vs axial */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1090, display: "flex", justifyContent: "center", gap: 90, opacity: sec }}>
        {[["BENDING", "ONLY THE EDGES WORK"], ["PUSH / PULL", "ALL OF IT WORKS"]].map(([t, s], i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: K.mono }}>
            <svg width={240} height={240} style={{ display: "block", margin: "0 auto" }}>
              <defs>
                <linearGradient id={`st${i}`} x1="0" y1="0" x2="0" y2="1">
                  {i === 0 ? (<><stop offset="0" stopColor={COMP} /><stop offset="0.5" stopColor={K.bgDeep} /><stop offset="1" stopColor={TENS} /></>)
                    : (<><stop offset="0" stopColor={TENS} /><stop offset="1" stopColor={TENS} /></>)}
                </linearGradient>
              </defs>
              <rect x={40} y={20} width={160} height={200 * sec} fill={`url(#st${i})`} opacity={0.85} />
              <rect x={40} y={20} width={160} height={200} fill="none" stroke={K.text} strokeWidth={3} />
            </svg>
            <div style={{ fontSize: 26, color: i === 0 ? RED : GREEN, fontWeight: 700, letterSpacing: 3, marginTop: 10 }}>{t}</div>
            <div style={{ fontSize: 19, color: K.muted, letterSpacing: 2, marginTop: 6 }}>{s}</div>
          </div>
        ))}
      </div>
      <Label f={g} at={600} text="TRUSS MEMBERS: PUSH / PULL ONLY" x={540} y={1465} size={22} align="center" color={K.text} />
    </>
  );
};

/* ────────── 7 · HERO: light, strong, rigid ────────── */
const HB = warren(8, 112, 110);
const HX = 92, HY = 1080;
export const Hero: React.FC = () => {
  const L = useCurrentFrame(); // 0 = global 690
  const g = L + 690;
  const draw = io(L, [0, 14], [0, 1], easeOut);
  const trucks = [io(g, [690, 830], [-150, 1100], (t) => t), io(g, [740, 900], [-150, 1100], (t) => t)];
  const loads: Record<number, number> = truckLoads(8, 112, null, 0, 0.12);
  trucks.forEach((tx) => { const p = tx - 40 - HX; if (p >= 0 && p <= 896) { const l = truckLoads(8, 112, p, 1, 0); for (const k in l) loads[+k] += l[+k]; } });
  const F = solve(HB, loads);
  const words: [string, number, string][] = [["LIGHT", 697, K.line], ["STRONG", 731, K.amber], ["RIGID", 766, GREEN]];
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", gap: 34 }}>
        {words.map(([w, at, c]) => {
          const p = ioB(g, at, at + 12);
          return <span key={w} style={{ fontFamily: K.head, fontWeight: 700, fontSize: 92, color: c, letterSpacing: -2, transform: `scale(${0.5 + 0.5 * p})`, opacity: clamp01((g - at) / 3), display: "inline-block" }}>{w}.</span>;
        })}
      </div>
      <Headline f={g} lines={["That's a *truss.*"]} at={801} top={490} size={100} />
      <Layer>
        <line x1={0} y1={HY} x2={1080} y2={HY} stroke={K.lineDim} strokeWidth={4} opacity={draw} />
        {[HX, HX + 896].map((x, i) => <rect key={i} x={x - 26} y={HY} width={52} height={190} fill={K.line} fillOpacity={0.06} stroke={K.line} strokeWidth={3} opacity={draw} />)}
        {HB.members.map(([a, b], k) => {
          const f = F[k] / 2.2, mag = clamp01(Math.abs(f));
          const col = Math.abs(f) < 0.04 ? K.lineDim : f < 0 ? COMP : TENS;
          const pulse = g >= 801 ? 0.4 + 0.6 * Math.abs(Math.sin((g - 801) * 0.25 - k * 0.3)) : 1;
          return <Bar key={k} a={[HX + HB.nodes[a].x, HY + HB.nodes[a].y]} b={[HX + HB.nodes[b].x, HY + HB.nodes[b].y]} c={col} w={(5 + 12 * mag) * (g >= 801 ? 0.8 + 0.4 * pulse : 1)} draw={draw * 2 - (k / HB.members.length)} />;
        })}
        {HB.nodes.map((n, i) => <circle key={i} cx={HX + n.x} cy={HY + n.y} r={6} fill={K.bgDeep} stroke={K.text} strokeWidth={3} opacity={draw} />)}
        {trucks.map((tx, i) => <Truck key={i} x={tx} y={HY - 2} s={0.85} />)}
      </Layer>
      <Label f={g} at={806} text="THIS ONE: A WARREN TRUSS" x={540} y={1320} size={24} align="center" color={K.text} />
      <Label f={g} at={812} text="ALSO: PRATT · HOWE · K-TRUSS" x={540} y={1370} size={20} align="center" />
      <Label f={L} at={20} text="SIMPLIFIED · IDEAL PIN JOINTS" x={540} y={1470} size={18} align="center" />
    </>
  );
};

/* ────────── 8 · END CARD ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const fade = 1 - io(f, [60, 68], [0, 1]);
  const m = 18, cd = (m * 23) / 2, cx = 540 - cd * 0.17, cy = 1060 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Headline f={f} lines={["Which machine", "*next?*"]} at={4} top={420} size={100} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1000px", opacity: clamp01(p) }}>
        <Gear N={14} m={m} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
      </div>
      <Tag f={f} at={20} text="COMMENT BELOW  ↓" x={540} y={1300} color={K.amber} solid size={32} />
      <Label f={f} at={26} text="AKS PRODUCTIONS" x={540} y={1385} size={30} align="center" color={K.text} />
      <Label f={f} at={32} text="FOLLOW FOR PART 05 · THE 4-STROKE ENGINE" x={540} y={1440} size={20} align="center" />
    </div>
  );
};

export { easeOut };
