import React from "react";
import { K } from "../gearbox/brand";
import { clamp01 } from "../gearbox/kit";

/**
 * One cylinder of a 4-stroke petrol engine, drawn to scale (stroke 180, clearance 20 → 10:1).
 * Crank angle th in degrees: 0 = TDC at the start of intake; 0–180 intake, 180–360 compression,
 * 360–540 power, 540–720 exhaust. Cams turn at half crank speed.
 * Local coordinates: bore centre x=0, crank centre y=0 (y up is negative).
 */
export const R = 90, L = 260, PISTON_H = 100, BORE = 250, HEAD_Y = -410; // head (chamber top) y
export const HOT = "#FF7A3D";
const rad = (d: number) => (d * Math.PI) / 180;
const mod = (a: number, m: number) => ((a % m) + m) % m;
export const pinY = (th: number) => -(R * Math.cos(rad(th)) + Math.sqrt(L * L - (R * Math.sin(rad(th))) ** 2));
export const pistonTop = (th: number) => pinY(th) - 40;
export const strokeOf = (th: number) => Math.floor(mod(th, 720) / 180); // 0 intake 1 comp 2 power 3 exhaust
const lift = (th: number, open: number, close: number) => {
  const a = mod(th, 720);
  if (a < open || a > close) return 0;
  return Math.sin(Math.PI * (a - open) / (close - open));
};
const hash = (i: number, j = 0) => { const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); };

export const Cylinder: React.FC<{ th: number; g: number; detail?: boolean; spark?: number; flame?: number; glowStroke?: number }> = ({ th, g, detail = true, spark = 0, flame = 0, glowStroke = -1 }) => {
  const a = mod(th, 720);
  const st = strokeOf(th);
  const pT = pistonTop(th), pPin = pinY(th);
  const cx = R * Math.sin(rad(th)), cy = -R * Math.cos(rad(th));
  const inL = lift(th, 0, 190), exL = lift(th, 530, 720);
  const VX_IN = -62, VX_EX = 62, VW = 34, CAM_Y = HEAD_Y - 150;
  const vol = (pT - HEAD_Y); // chamber height
  // gas colour per stroke
  const comp = st === 1 ? clamp01((a - 180) / 180) : st === 0 ? 0 : 1;
  const gasCol = st === 0 ? K.line : st === 1 ? K.line : st === 2 ? HOT : "#7D8FA6";
  const gasO = st === 0 ? 0.08 + 0.12 * (a / 180) : st === 1 ? 0.2 + 0.25 * comp : st === 2 ? 0.55 * (1 - (a - 360) / 220) + 0.15 : 0.18 * (1 - (a - 540) / 200);
  const N = 54;
  const parts = Array.from({ length: N }).map((_, i) => {
    const u = hash(i) * 2 - 1, v = hash(i, 1);
    let x = u * (BORE / 2 - 14) + Math.sin(g * 0.2 + i) * 3;
    let y = HEAD_Y + 8 + v * (vol - 16);
    let o = 1;
    if (st === 0) { // entering through the intake valve
      const born = hash(i, 3) * 160; o = clamp01((a - born) / 16);
      const t = clamp01((a - born) / 40);
      x = VX_IN + (x - VX_IN) * t; y = HEAD_Y + 6 + (y - HEAD_Y - 6) * t;
    }
    if (st === 3) { // leaving through the exhaust valve
      const leave = 540 + hash(i, 4) * 150; const t = clamp01((a - leave) / 30);
      x = x + (VX_EX + 60 - x) * t; y = y + (HEAD_Y - 70 - y) * t; o = 1 - clamp01((a - leave - 22) / 10);
    }
    return { x, y, o };
  });
  const cam = (x: number, phase: number) => {
    const ang = th / 2 + phase; // half crank speed
    return (
      <g transform={`translate(${x} ${CAM_Y}) rotate(${ang})`}>
        <path d="M -26 0 A 26 26 0 1 1 26 0 Q 18 30 0 46 Q -18 30 -26 0 Z" fill={K.bgDeep} stroke={K.line} strokeWidth={3} />
        <circle r={7} fill={K.line} />
      </g>
    );
  };
  // phase so the lobe points down (toward valve) at mid-open: lobe drawn pointing +y (down) at rotation 0
  const inMid = 95, exMid = 625;
  const valve = (x: number, l: number, col: string) => {
    const y = HEAD_Y + l * 26;
    return (
      <g>
        <line x1={x} y1={y} x2={x} y2={CAM_Y + 30} stroke={K.text} strokeWidth={6} />
        <path d={Array.from({ length: 7 }).map((_, k) => `${k ? "L" : "M"} ${x + (k % 2 ? 12 : -12)} ${HEAD_Y - 70 - k * ((60 - l * 18) / 6)}`).join(" ")} stroke={K.lineDim} strokeWidth={3} fill="none" />
        <path d={`M ${x - VW} ${y} L ${x + VW} ${y} L ${x + 8} ${y - 12} L ${x - 8} ${y - 12} Z`} fill={col} stroke={K.text} strokeWidth={2} />
      </g>
    );
  };
  return (
    <g>
      {/* ports */}
      <path d={`M -330 ${HEAD_Y - 90} Q -140 ${HEAD_Y - 90} ${VX_IN - VW} ${HEAD_Y} M -330 ${HEAD_Y - 40} Q -170 ${HEAD_Y - 40} ${VX_IN - 14} ${HEAD_Y - 10}`} stroke={K.line} strokeWidth={3} fill="none" opacity={0.8} />
      <path d={`M 330 ${HEAD_Y - 90} Q 140 ${HEAD_Y - 90} ${VX_EX + VW} ${HEAD_Y} M 330 ${HEAD_Y - 40} Q 170 ${HEAD_Y - 40} ${VX_EX + 14} ${HEAD_Y - 10}`} stroke={exL > 0.05 ? "#9FB0C6" : K.line} strokeWidth={3} fill="none" opacity={0.8} />
      {/* cylinder walls + head */}
      <rect x={-BORE / 2 - 22} y={HEAD_Y - 6} width={22} height={356} fill={K.line} fillOpacity={0.08} stroke={K.line} strokeWidth={3} />
      <rect x={BORE / 2} y={HEAD_Y - 6} width={22} height={356} fill={K.line} fillOpacity={0.08} stroke={K.line} strokeWidth={3} />
      <path d={`M ${-BORE / 2 - 22} ${HEAD_Y - 6} L ${VX_IN - VW - 6} ${HEAD_Y - 6} M ${VX_IN + VW + 6} ${HEAD_Y - 6} L ${VX_EX - VW - 6} ${HEAD_Y - 6} M ${VX_EX + VW + 6} ${HEAD_Y - 6} L ${BORE / 2 + 22} ${HEAD_Y - 6}`} stroke={K.line} strokeWidth={4} />
      {/* gas */}
      <rect x={-BORE / 2} y={HEAD_Y} width={BORE} height={Math.max(0, vol)} fill={gasCol} opacity={gasO} />
      {flame > 0.01 && <ellipse cx={0} cy={HEAD_Y + vol * 0.45} rx={BORE * 0.48 * flame} ry={vol * 0.5 * flame} fill={HOT} opacity={0.8 * flame} style={{ filter: "blur(10px)" }} />}
      {flame > 0.3 && <ellipse cx={0} cy={HEAD_Y + 14} rx={50 * flame} ry={22 * flame} fill="#FFF1B8" opacity={flame} style={{ filter: "blur(6px)" }} />}
      {detail && parts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4.5} fill={st === 2 ? "#FFD08A" : st === 3 ? "#A9B6C8" : K.line} opacity={p.o * (st === 2 ? 0.7 : 0.85)} />)}
      {/* valves + cams + spark plug */}
      {valve(VX_IN, inL, inL > 0.05 ? K.line : K.bgDeep)}
      {valve(VX_EX, exL, exL > 0.05 ? "#9FB0C6" : K.bgDeep)}
      {cam(VX_IN, -inMid / 2)}{cam(VX_EX, -exMid / 2)}
      <g>
        <rect x={-10} y={HEAD_Y - 120} width={20} height={70} rx={4} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
        <rect x={-5} y={HEAD_Y - 50} width={10} height={44} fill={K.text} />
        {spark > 0.01 && <circle cx={0} cy={HEAD_Y + 2} r={10 + 30 * spark} fill="#FFF6C8" opacity={spark} style={{ filter: "blur(4px)" }} />}
        {spark > 0.01 && <path d={`M -4 ${HEAD_Y - 4} L 6 ${HEAD_Y + 6} L -2 ${HEAD_Y + 8} L 8 ${HEAD_Y + 20}`} stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={spark} />}
      </g>
      {/* piston + rings */}
      <g>
        <rect x={-BORE / 2 + 3} y={pT} width={BORE - 6} height={PISTON_H} rx={8} fill={K.bgDeep} stroke={glowStroke >= 0 ? K.amber : K.text} strokeWidth={3.5} />
        {[14, 28, 42].map((d) => <line key={d} x1={-BORE / 2 + 3} y1={pT + d} x2={BORE / 2 - 3} y2={pT + d} stroke={K.lineDim} strokeWidth={2} />)}
        <circle cx={0} cy={pPin} r={12} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
      </g>
      {/* rod + crank */}
      <line x1={0} y1={pPin} x2={cx} y2={cy} stroke={K.text} strokeWidth={20} strokeLinecap="round" opacity={0.95} />
      <line x1={0} y1={pPin} x2={cx} y2={cy} stroke={K.bgDeep} strokeWidth={10} strokeLinecap="round" />
      <g transform={`rotate(${th})`}>
        <path d={`M -95 40 A 110 110 0 0 0 95 40 L 30 -10 L -30 -10 Z`} fill={K.line} fillOpacity={0.12} stroke={K.line} strokeWidth={3} />
        <rect x={-22} y={-R - 22} width={44} height={R + 22} rx={14} fill={K.bgDeep} stroke={K.line} strokeWidth={3} />
      </g>
      <circle cx={cx} cy={cy} r={16} fill={K.bgDeep} stroke={K.amber} strokeWidth={4} />
      <circle cx={0} cy={0} r={20} fill={K.bgDeep} stroke={K.line} strokeWidth={4} />
      <circle cx={0} cy={0} r={6} fill={K.line} />
    </g>
  );
};
