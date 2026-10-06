import React from "react";
import { useCurrentFrame } from "remotion";
import { easeIn, easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Layer, Meter, Readout, Tag, clamp01, ioB, meshPhase } from "../gearbox/kit";

/** Scene starts (global frames @30fps). Keep in sync with soundtrack.py. */
export const T = { hook: 0, sw: 56, xs: 174, gate: 548, hero: 664, end: 822, total: 900 };
export const CUTS = [0, 56, 174, 266, 388, 548, 664, 822];

const hash = (i: number, j = 0) => { const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); };
const GREEN = K.green;

/* ────────── phone + chip (hook + hero bookend) ────────── */
const Phone: React.FC<{ draw: number; chipGlow: number }> = ({ draw, chipGlow }) => {
  const sd = (p: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - clamp01(p) });
  return (
    <g>
      <rect x={360} y={620} width={360} height={720} rx={52} fill={K.line} fillOpacity={0.04 * clamp01(draw * 2 - 1)} stroke={K.line} strokeWidth={3.5} {...sd(draw * 1.1)} />
      <rect x={378} y={640} width={324} height={680} rx={38} fill="none" stroke={K.lineDim} strokeWidth={2} {...sd(draw * 1.3 - 0.3)} />
      <rect x={500} y={658} width={80} height={18} rx={9} fill={K.lineDim} opacity={clamp01(draw * 2 - 1)} />
      <g opacity={clamp01(draw * 2 - 0.8)}>
        {chipGlow > 0 && <rect x={470} y={930} width={140} height={140} rx={10} fill={K.amber} opacity={chipGlow * 0.35} style={{ filter: "blur(18px)" }} />}
        {Array.from({ length: 6 }).map((_, i) => (
          <React.Fragment key={i}>
            <line x1={490 + i * 20} y1={932} x2={490 + i * 20} y2={916} stroke={K.line} strokeWidth={2.5} />
            <line x1={490 + i * 20} y1={1068} x2={490 + i * 20} y2={1084} stroke={K.line} strokeWidth={2.5} />
            <line x1={472} y1={950 + i * 20} x2={456} y2={950 + i * 20} stroke={K.line} strokeWidth={2.5} />
            <line x1={608} y1={950 + i * 20} x2={624} y2={950 + i * 20} stroke={K.line} strokeWidth={2.5} />
          </React.Fragment>
        ))}
        <rect x={472} y={932} width={136} height={136} rx={8} fill={K.bgDeep} stroke={K.amber} strokeWidth={3} />
        {/* die: 12×12 transistor cells */}
        {Array.from({ length: 144 }).map((_, i) => {
          const c = i % 12, r = Math.floor(i / 12);
          return <rect key={i} x={480 + c * 10} y={940 + r * 10} width={8} height={8} rx={1} fill={hash(i) > 0.55 ? K.amber : K.line} opacity={0.25 + 0.5 * hash(i, 3)} />;
        })}
      </g>
    </g>
  );
};

/* ────────── 1 · HOOK ────────── */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const draw = io(f, [2, 26], [0, 1], easeInOut);
  const push = io(f, [30, 54], [1, 7.5], easeIn);
  const glow = f > 18 ? 0.6 + 0.4 * Math.sin(f * 0.5) : 0;
  const br = io(f, [40, 48], [0, 1]);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 1000px" }}>
        <Layer><Phone draw={draw} chipGlow={glow} /></Layer>
      </div>
      <Headline f={f} lines={["Billions of *these*", "run your phone"]} at={6} exitAt={46} />
      {br > 0 && (
        <Layer>
          <g opacity={br} stroke={K.amber} strokeWidth={4} fill="none">
            {[[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]].map(([x, y, sx, sy], i) => {
              const X = 505 + x * 70, Y = 965 + y * 70;
              return <path key={i} d={`M ${X} ${Y + sy * 20} L ${X} ${Y} L ${X + sx * 20} ${Y}`} />;
            })}
          </g>
        </Layer>
      )}
      <Label f={f} at={14} text="CHIP · SYSTEM-ON-CHIP" x={540} y={1380} size={22} align="center" out={30} />
      <Tag f={f} at={44} text="1 TRANSISTOR" x={540} y={1120} color={K.amber} solid size={28} />
    </>
  );
};

/* ────────── 2 · A TRANSISTOR = A SWITCH ────────── */
const MosSymbol: React.FC<{ cx: number; cy: number; draw: number; on: number; s?: number }> = ({ cx, cy, draw, on, s = 1 }) => {
  const col = on > 0.5 ? GREEN : K.line;
  const sd = (p: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - clamp01(p) });
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} strokeLinecap="round" fill="none">
      <path d="M -150 0 L -40 0 M -40 -75 L -40 75" stroke={on > 0.5 ? K.amber : K.line} strokeWidth={6} {...sd(draw * 1.2)} />
      {[[-80, -40], [-20, 20], [40, 80]].map(([a, b], i) => (
        <line key={i} x1={-15} y1={a} x2={-15} y2={b} stroke={col} strokeWidth={8} opacity={clamp01(draw * 2 - 0.6)} />
      ))}
      {on > 0.05 && <line x1={-15} y1={-80} x2={-15} y2={80} stroke={GREEN} strokeWidth={8} opacity={on} />}
      <path d="M -15 -60 L 70 -60 L 70 -170" stroke={col} strokeWidth={6} {...sd(draw * 1.3 - 0.2)} />
      <path d="M -15 60 L 70 60 L 70 170" stroke={col} strokeWidth={6} {...sd(draw * 1.3 - 0.2)} />
      <path d="M -15 0 L 70 0 L 70 60" stroke={col} strokeWidth={4} {...sd(draw * 1.3 - 0.3)} />
      <path d="M 2 -12 L -12 0 L 2 12 Z" fill={col} stroke="none" opacity={clamp01(draw * 2 - 1)} />
      <g fontFamily={K.mono} fontSize={34} fontWeight={700} fill={K.muted} stroke="none" opacity={clamp01(draw * 2 - 1)}>
        <text x={-185} y={12}>G</text><text x={90} y={-150}>D</text><text x={90} y={175}>S</text>
      </g>
    </g>
  );
};

export const Switch: React.FC = () => {
  const f = useCurrentFrame();
  const draw = io(f, [4, 34], [0, 1], easeInOut);
  const split = io(f, [48, 64], [0, 1], easeInOut);
  const tx = 540 + 230 * split;
  const swDraw = io(f, [52, 72], [0, 1], easeOut);
  const cyc = f >= 62 ? Math.floor((f - 62) / 14) % 2 : 1; // 1 = open
  const lever = cyc === 1 ? -32 : 0;
  const lev = f >= 62 ? lever + (cyc === 1 ? 1 : -1) * 6 * (1 - clamp01(((f - 62) % 14) / 4)) : -32;
  const on = f >= 62 && cyc === 0 ? 1 : 0;
  const strike = io(f, [92, 102], [0, 1], easeOut);
  const cx0 = 150, cx1 = 390, cy = 1010;
  return (
    <>
      <Headline f={f} lines={["A *transistor*"]} at={4} />
      <Headline f={f} lines={["= a tiny switch"]} at={52} top={460} size={80} />
      <Layer>
        <MosSymbol cx={tx} cy={cy} draw={draw} on={on * split} s={1 - 0.15 * split} />
        <g opacity={swDraw}>
          <line x1={60} y1={cy} x2={cx0} y2={cy} stroke={on ? GREEN : K.line} strokeWidth={6} strokeLinecap="round" />
          <line x1={cx1} y1={cy} x2={470} y2={cy} stroke={on ? GREEN : K.line} strokeWidth={6} strokeLinecap="round" />
          <circle cx={cx0} cy={cy} r={12} fill={K.bgDeep} stroke={K.line} strokeWidth={4} />
          <circle cx={cx1} cy={cy} r={12} fill={K.bgDeep} stroke={K.line} strokeWidth={4} />
          <g transform={`rotate(${lev} ${cx0} ${cy})`}>
            <line x1={cx0} y1={cy} x2={cx1 + 6} y2={cy} stroke={on ? GREEN : K.text} strokeWidth={9} strokeLinecap="round" />
          </g>
          {f >= 62 && ((f - 62) % 14) < 3 && cyc === 0 && <circle cx={cx1} cy={cy} r={26} fill={K.amber} opacity={0.6} style={{ filter: "blur(6px)" }} />}
        </g>
        {strike > 0 && (
          <g stroke={K.red} strokeWidth={10} strokeLinecap="round" opacity={strike}>
            <line x1={170} y1={880} x2={170 + 230 * strike} y2={880 + 230 * strike} />
            <line x1={400} y1={880} x2={400 - 230 * strike} y2={880 + 230 * strike} />
          </g>
        )}
      </Layer>
      <Label f={f} at={60} text="MECHANICAL" x={270} y={1210} size={24} align="center" color={K.muted} />
      <Label f={f} at={60} text="ELECTRONIC" x={tx} y={1210} size={24} align="center" color={K.muted} />
      <Tag f={f} at={92} text="MOVING PARTS" x={270} y={1290} color={K.red} size={26} />
      <Tag f={f} at={98} text="NO MOVING PARTS" x={770} y={1290} color={GREEN} solid size={26} />
    </>
  );
};

/* ────────── 3–5 · CROSS-SECTION: anatomy → off → on (one continuous shot) ────────── */
const X = { subL: 110, subR: 970, subT: 980, subB: 1360, sL: 170, sR: 400, dL: 680, dR: 910, wellB: 1110, gL: 400, gR: 680, gT: 860, oxT: 950, sx: 285, gx: 540, dx: 795, top: 770 };
const NE = 70; // electrons

export const CrossSection: React.FC = () => {
  const L = useCurrentFrame(); // local, 0 = global 174
  const g = L + 174;
  const sub = io(L, [3, 24], [0, 1], easeInOut);
  const src = io(L, [36, 50], [0, 1], easeOut);
  const drn = io(L, [54, 68], [0, 1], easeOut);
  const gat = io(L, [72, 86], [0, 1], easeOut);
  const vg = io(L, [216, 240], [0, 1], easeInOut);
  const chan = io(L, [236, 286], [0, 1], easeInOut);
  const flow = io(L, [298, 312], [0, 1]);
  const block = io(L, [140, 150], [0, 1]) * (1 - io(L, [214, 222], [0, 1]));
  const sd = (p: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - clamp01(p) });
  const zero = ioB(L, 194, 206) * (1 - io(L, [214, 222], [0, 1]));
  const one = ioB(L, 350, 362);
  const electron = (i: number) => {
    // home: inside source / drain wells (most) or loose in substrate
    const inWell = i < 52;
    const left = i % 2 === 0;
    const hx = inWell ? (left ? X.sL : X.dL) + 18 + hash(i) * 194 : X.subL + 40 + hash(i) * 780;
    const hy = inWell ? X.subT + 18 + hash(i, 1) * 96 : X.wellB + 40 + hash(i, 1) * 200;
    const jx = Math.sin(g * 0.13 + i) * 4, jy = Math.cos(g * 0.11 + i * 1.7) * 4;
    // channel slot for the channel-forming electrons
    const isChan = i >= 40 && i < 64;
    const k = i - 40;
    const tx = X.gL + 10 + (k / 23) * (X.gR - X.gL - 20), ty = X.subT + 12 + (k % 2) * 12;
    const c = isChan ? clamp01(chan * 1.6 - (k / 23) * 0.6) : 0;
    let x = hx + jx + (tx - hx) * c, y = hy + jy + (ty - hy) * c;
    // current: chan electrons stream source → drain once ON
    if (isChan && flow > 0) {
      const u = ((g * 0.018 + k / 24) % 1);
      const path = [[X.sx, X.top + 10], [X.sx, X.subT + 18], [X.gL, X.subT + 18], [X.gR, X.subT + 18], [X.dx, X.subT + 18], [X.dx, X.top + 10]];
      const seg = [0.18, 0.08, 0.3, 0.08, 0.18];
      const tot = seg.reduce((a, b) => a + b);
      let uu = u * tot, s = 0;
      while (s < seg.length - 1 && uu > seg[s]) { uu -= seg[s]; s++; }
      const t = Math.min(1, uu / seg[s]);
      const px = path[s][0] + (path[s + 1][0] - path[s][0]) * t, py = path[s][1] + (path[s + 1][1] - path[s][1]) * t;
      x = x + (px - x) * flow; y = y + (py - y) * flow;
    }
    return { x, y };
  };
  const phase = L < 92 ? 0 : L < 214 ? 1 : 2;
  return (
    <>
      <Headline f={L} lines={["3 *parts*"]} at={4} exitAt={86} />
      <Headline f={L} lines={["No voltage", "= *off*"]} at={96} exitAt={176} />
      <Headline f={L} lines={["Add voltage", "= *on*"]} at={222} exitAt={334} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", transform: `scale(${0.6 + 0.4 * zero})`, opacity: clamp01(zero) }}>
        <Readout value="0" size={260} color={K.red} /><span style={{ fontFamily: K.mono, fontSize: 40, color: K.muted, letterSpacing: 6, marginLeft: 20 }}>OFF</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", transform: `scale(${0.6 + 0.4 * one})`, opacity: clamp01(one) }}>
        <Readout value="1" size={260} color={GREEN} /><span style={{ fontFamily: K.mono, fontSize: 40, color: K.muted, letterSpacing: 6, marginLeft: 20 }}>ON</span>
      </div>
      <Layer>
        {/* substrate */}
        <rect x={X.subL} y={X.subT} width={X.subR - X.subL} height={X.subB - X.subT} fill={K.line} fillOpacity={0.05 * sub} stroke={K.line} strokeWidth={3} {...sd(sub)} />
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={i} x1={X.subL + 20 + i * 30} y1={X.subB} x2={X.subL + 4 + i * 30} y2={X.subB + 16} stroke={K.lineDim} strokeWidth={1.5} opacity={sub} />
        ))}
        {/* wells */}
        {[[X.sL, X.sR, src], [X.dL, X.dR, drn]].map(([a, b, p], i) => (
          <path key={i} d={`M ${a} ${X.subT} L ${a} ${X.wellB - 30} Q ${a} ${X.wellB} ${a + 30} ${X.wellB} L ${b - 30} ${X.wellB} Q ${b} ${X.wellB} ${b} ${X.wellB - 30} L ${b} ${X.subT}`}
            fill={K.line} fillOpacity={0.12 * p} stroke={K.line} strokeWidth={3} {...sd(p)} />
        ))}
        {/* oxide + gate */}
        <rect x={X.gL - 20} y={X.oxT} width={X.gR - X.gL + 40} height={X.subT - X.oxT} fill={K.muted} fillOpacity={0.25 * gat} stroke={K.muted} strokeWidth={2} opacity={gat} />
        <rect x={X.gL} y={X.gT} width={X.gR - X.gL} height={X.oxT - X.gT} rx={4} fill={vg > 0.05 ? K.amber : K.line} fillOpacity={(0.12 + 0.5 * vg) * gat} stroke={vg > 0.05 ? K.amber : K.line} strokeWidth={3} {...sd(gat)}
          style={vg > 0.05 ? { filter: `drop-shadow(0 0 ${20 * vg}px ${K.amber})` } : undefined} />
        {vg > 0.2 && Array.from({ length: 7 }).map((_, i) => (
          <text key={i} x={X.gL + 30 + i * 37} y={X.gT + 58} fontFamily={K.mono} fontSize={34} fontWeight={700} fill={K.bgDeep} opacity={clamp01(vg * 2 - 0.5)} textAnchor="middle">+</text>
        ))}
        {/* terminals */}
        {[[X.sx, X.subT, src], [X.gx, X.gT, gat], [X.dx, X.subT, drn]].map(([x, y, p], i) => (
          <g key={i} opacity={p}>
            <line x1={x} y1={y} x2={x} y2={y - (y - X.top) * p} stroke={i === 1 && vg > 0.05 ? K.amber : flow > 0 && i !== 1 ? GREEN : K.text} strokeWidth={5} strokeLinecap="round" />
            <rect x={x - 26} y={y - 10} width={52} height={14} fill={K.text} opacity={0.8} />
          </g>
        ))}
        {/* channel highlight */}
        {chan > 0 && <rect x={X.gL} y={X.subT + 2} width={(X.gR - X.gL) * chan} height={26} fill={GREEN} opacity={0.18 + 0.2 * flow} />}
        {/* electrons */}
        {phase >= 1 || L > 40 ? Array.from({ length: NE }).map((_, i) => {
          const e = electron(i);
          const show = i % 2 === 0 ? src : drn;
          return <circle key={i} cx={e.x} cy={e.y} r={6} fill={i >= 40 && i < 64 && chan > 0.3 ? GREEN : K.line} opacity={clamp01(show * 1.5) * (i >= 52 && i < 64 ? clamp01((L - 90) / 10) : 1)} />;
        }) : null}
        {/* blocked current X */}
        {block > 0 && (
          <g opacity={block} stroke={K.red} strokeWidth={9} strokeLinecap="round">
            <line x1={515} y1={1000} x2={565} y2={1050} /><line x1={565} y1={1000} x2={515} y2={1050} />
            <path d={`M 330 1060 L 470 1060`} stroke={K.red} strokeWidth={4} strokeDasharray="10 8" />
            <path d={`M 610 1060 L 750 1060`} stroke={K.red} strokeWidth={4} strokeDasharray="10 8" />
          </g>
        )}
      </Layer>
      <Label f={L} at={38} text="SOURCE" x={X.sx} y={X.top - 52} size={26} align="center" color={K.line} />
      <Label f={L} at={56} text="DRAIN" x={X.dx} y={X.top - 52} size={26} align="center" color={K.line} />
      <Label f={L} at={74} text="GATE" x={X.gx} y={X.top - 52} size={26} align="center" color={K.amber} />
      <Label f={L} at={14} text="SILICON" x={540} y={1300} size={22} align="center" color={K.muted} />
      <Label f={L} at={84} text="OXIDE" x={X.gR + 40} y={X.oxT - 46} size={18} color={K.muted} />
      <Label f={L} at={280} text="CHANNEL" x={540} y={X.subT + 44} size={20} align="center" color={GREEN} />
      <Meter x={150} y={1400} w={780} v={vg} label="GATE VOLTAGE" value={vg > 0.02 ? `≈${vg.toFixed(1)} V` : "0 V"} color={K.amber} o={io(L, [98, 106], [0, 1])} />
      <Meter x={150} y={1490} w={780} v={flow * (0.85 + 0.03 * Math.sin(g * 0.7))} label="CURRENT" value={flow > 0.5 ? "FLOWING" : "NONE"} color={flow > 0.5 ? GREEN : K.red} o={io(L, [104, 112], [0, 1])} />
    </>
  );
};

/* ────────── 6 · NOT GATE (CMOS inverter) ────────── */
export const NotGate: React.FC = () => {
  const f = useCurrentFrame();
  const draw = io(f, [2, 30], [0, 1], easeInOut);
  const vin = f < 69 ? 0 : 1;
  const out = f < 88 ? (f < 69 ? 1 : 1 - io(f, [69, 80], [0, 1])) : 0;
  const pOn = vin === 0, nOn = vin === 1;
  const sd = (p: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - clamp01(p) });
  const cx = 560, inX = 200, outX = 880, yV = 700, yP = 850, yM = 1000, yN = 1150, yG = 1300;
  const fet = (y: number, p: boolean, on: boolean) => {
    const col = on ? GREEN : K.lineDim;
    return (
      <g strokeLinecap="round" fill="none">
        {[-1, 0, 1].map((k) => <line key={k} x1={cx} y1={y + k * 40 - 15} x2={cx} y2={y + k * 40 + 15} stroke={col} strokeWidth={8} />)}
        {on && <line x1={cx} y1={y - 55} x2={cx} y2={y + 55} stroke={GREEN} strokeWidth={8} />}
        <line x1={cx - 30} y1={y - 55} x2={cx - 30} y2={y + 55} stroke={K.text} strokeWidth={6} />
        {p && <circle cx={cx - 46} cy={y} r={11} stroke={K.text} strokeWidth={4} />}
        <line x1={cx - (p ? 57 : 30)} y1={y} x2={cx - 110} y2={y} stroke={vin ? K.amber : K.text} strokeWidth={5} />
        <text x={cx + 30} y={y + 12} fontFamily={K.mono} fontSize={30} fill={on ? GREEN : K.muted} stroke="none">{p ? "pMOS" : "nMOS"} · {on ? "ON" : "OFF"}</text>
      </g>
    );
  };
  const dots = (y0: number, y1: number) => Array.from({ length: 5 }).map((_, i) => {
    const u = ((f * 0.04 + i / 5) % 1);
    return <circle key={i} cx={cx} cy={y0 + (y1 - y0) * u} r={7} fill={GREEN} />;
  });
  return (
    <>
      <Headline f={f} lines={["2 transistors =", "a *NOT gate*"]} at={2} />
      <Layer>
        <g opacity={draw}>
          <line x1={cx - 160} y1={yV} x2={cx + 160} y2={yV} stroke={K.text} strokeWidth={6} strokeLinecap="round" />
          <text x={cx + 180} y={yV + 12} fontFamily={K.mono} fontSize={30} fill={K.amber}>+V</text>
          <line x1={cx} y1={yV} x2={cx} y2={yP - 55} stroke={pOn ? GREEN : K.line} strokeWidth={5} />
          <line x1={cx} y1={yP + 55} x2={cx} y2={yN - 55} stroke={K.line} strokeWidth={5} />
          <line x1={cx} y1={yN + 55} x2={cx} y2={yG - 20} stroke={nOn ? GREEN : K.line} strokeWidth={5} />
          <path d={`M ${cx - 50} ${yG - 20} L ${cx + 50} ${yG - 20} M ${cx - 32} ${yG - 4} L ${cx + 32} ${yG - 4} M ${cx - 14} ${yG + 12} L ${cx + 14} ${yG + 12}`} stroke={K.text} strokeWidth={5} strokeLinecap="round" />
          <text x={cx + 70} y={yG + 6} fontFamily={K.mono} fontSize={26} fill={K.muted}>GROUND</text>
        </g>
        <path d={`M ${inX} ${yM} L ${cx - 110} ${yM} M ${cx - 110} ${yP} L ${cx - 110} ${yN}`} stroke={vin ? K.amber : K.text} strokeWidth={5} fill="none" {...sd(draw)} />
        <path d={`M ${cx} ${yM} L ${outX} ${yM}`} stroke={out > 0.5 ? K.amber : K.line} strokeWidth={5} {...sd(draw)} />
        <circle cx={cx} cy={yM} r={10} fill={K.text} opacity={draw} />
        <g opacity={draw}>{fet(yP, true, pOn)}{fet(yN, false, nOn)}</g>
        <g opacity={clamp01(draw * 2 - 1)}>{pOn ? dots(yV, yM) : dots(yM, yG - 20)}</g>
      </Layer>
      {/* IN / OUT badges */}
      {[[inX - 50, "IN", vin, K.amber], [outX + 40, "OUT", out > 0.5 ? 1 : 0, out > 0.5 ? K.amber : K.muted]].map(([x, lbl, v, c], i) => (
        <div key={i} style={{ position: "absolute", left: x as number, top: yM - 92, transform: "translateX(-50%)", textAlign: "center", opacity: draw }}>
          <div style={{ fontFamily: K.mono, fontSize: 24, letterSpacing: 4, color: K.muted }}>{lbl as string}</div>
          <Readout value={String(v)} size={92} color={c as string} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 300, width: 480, top: 1370, fontFamily: K.mono, opacity: io(f, [24, 32], [0, 1]) }}>
        <div style={{ display: "flex", justifyContent: "space-around", fontSize: 24, letterSpacing: 4, color: K.muted, paddingBottom: 8, borderBottom: `2px solid ${K.lineDim}` }}><span>IN</span><span>OUT</span></div>
        {[[0, 1], [1, 0]].map(([a, b], i) => {
          const on = (i === 0 && f < 69) || (i === 1 && f >= 88);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-around", fontSize: 44, fontWeight: 700, padding: "6px 0", color: on ? K.bgDeep : K.text, background: on ? K.amber : "transparent", borderRadius: 6 }}>
              <span>{a}</span><span>{b}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

/* ────────── 7 · HERO: billions of switches ────────── */
export const Hero: React.FC = () => {
  const f = useCurrentFrame(); // 0 = global 664
  const g = f + 664;
  const cols = 22, rows = 20, cell = 40, x0 = 100, y0 = 600;
  const shrink = io(f, [92, 116], [0, 1], easeInOut);
  const sc = 1 - shrink * (1 - 136 / 880);
  const phone = io(f, [100, 124], [0, 1], easeInOut);
  const clock = io(f, [42, 50], [0, 1]) * (1 - io(f, [90, 98], [0, 1]));
  const ticks = io(f, [44, 86], [0, 3e9], easeOut);
  return (
    <>
      <Headline f={f} lines={["Billions of", "*switches.*"]} at={6} exitAt={40} />
      <Headline f={f} lines={["Billions of times", "a *second.*"]} at={44} exitAt={90} size={84} />
      <Headline f={f} lines={["That's a *computer.*"]} at={95} size={92} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${(540 - 540) * shrink}px, ${(1000 - 1000) * shrink}px) scale(${sc})`, transformOrigin: "540px 1000px" }}>
        <Layer>
          {Array.from({ length: cols * rows }).map((_, i) => {
            const c = i % cols, r = Math.floor(i / cols);
            const d = Math.hypot(c - cols / 2, (r - rows / 2) * 1.1);
            const rev = clamp01((f - 2 - d * 1.1) / 6);
            if (rev <= 0) return null;
            const rate = 2 + (i % 4);
            const bit = hash(i, Math.floor(g / rate)) > 0.5;
            const wave = 0.5 + 0.5 * Math.sin(d * 0.6 - g * 0.35);
            return (
              <text key={i} x={x0 + c * cell + cell / 2} y={y0 + r * cell + cell * 0.72} textAnchor="middle" fontFamily={K.mono} fontSize={26} fontWeight={700}
                fill={bit ? K.amber : K.line} opacity={rev * (bit ? 0.55 + 0.45 * wave : 0.25 + 0.25 * wave)}>{bit ? "1" : "0"}</text>
            );
          })}
          <rect x={x0 - 8} y={y0 - 8} width={cols * cell + 16} height={rows * cell + 16} rx={10} fill="none" stroke={K.amber} strokeWidth={3 / sc} opacity={shrink} />
        </Layer>
      </div>
      {phone > 0 && (
        <Layer>
          <g opacity={phone}>
            <rect x={360} y={620} width={360} height={720} rx={52} fill="none" stroke={K.line} strokeWidth={3.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - phone} />
            <rect x={500} y={658} width={80} height={18} rx={9} fill={K.lineDim} />
          </g>
        </Layer>
      )}
      {clock > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1430, opacity: clock }}>
          <svg width={1080} height={70} style={{ display: "block" }}>
            <path d={Array.from({ length: 30 }).map((_, i) => {
              const x = ((i * 64 - g * 6) % 1920 + 1920) % 1920 - 64;
              return `M ${x} 60 L ${x} 10 L ${x + 32} 10 L ${x + 32} 60 L ${x + 64} 60`;
            }).join(" ")} stroke={K.line} strokeWidth={4} fill="none" />
          </svg>
          <div style={{ textAlign: "center", marginTop: 6 }}>
            <Readout value={Math.round(ticks).toLocaleString("en-US")} size={64} color={K.amber} />
            <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 4, color: K.muted }}>CLOCK TICKS / SECOND · 3 GHz</div>
          </div>
        </div>
      )}
    </>
  );
};

/* ────────── 8 · END CARD ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const fade = 1 - io(f, [64, 72], [0, 1]);
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
      <Label f={f} at={36} text="FOLLOW FOR PART 03 · THE JET ENGINE" x={540} y={1440} size={22} align="center" />
    </div>
  );
};

export { easeOut };
