import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Dim, Gear, Headline, Label, Layer, Meter, Readout, Tag, TorqueArrow, clamp01, ioB, meshPhase } from "../gearbox/kit";
import {
  BOLT, BORE, CEIL, K_BOT, K_TIP, LD, PIN_W, PIN_X, PLUG_D, RIGHT, SLOT, TIP_H, TIP_W, TIP_Y, WRONG, Y_B,
  allPins, boltX, cutY, keyOutline, pinState, KEY_PIN_LEN, PinSt,
} from "./geometry";

/** Global frames from public/projects/lock/vo.json. Keep in sync with soundtrack.py. */
export const T = { pins: 117, shear: 213, wrong: 317, right: 430, bolt: 562, hero: 611, end: 706, total: 900 };
export const CUTS = [0, 117, 213, 317, 430, 562, 611, 706];

const S = 26; // px per mm in the side section
const SE = 20; // px per mm in the end-on section
const GREEN = K.green, RED = K.red, AMBER = K.amber;
const m = (mm: number) => mm * S;
const bump = (g: number, a: number, b: number) => (g > a && g < b ? Math.sin((Math.PI * (g - a)) / (b - a)) : 0);

/* ────────── choreography: everything the lock does, as a function of the global frame ────────── */
const OUT = 40; // key fully withdrawn (mm of travel, off the left edge)
export type KS = { kind: "right" | "wrong" | null; cuts: number[] | null; s: number };
export const keyAt = (g: number): KS => {
  const mv = (a: number, b: number, from: number, to: number) => io(g, [a, b], [from, to], easeInOut);
  if (g < 96) return { kind: "right", cuts: RIGHT, s: 0 };
  if (g < 136) return { kind: "right", cuts: RIGHT, s: mv(96, 134, 0, OUT) };
  if (g < 326) return { kind: null, cuts: null, s: OUT };
  if (g < 421) return { kind: "wrong", cuts: WRONG, s: mv(326, 378, OUT, 0) };
  if (g < 442) return { kind: "wrong", cuts: WRONG, s: mv(421, 441, 0, OUT) };
  if (g < 598) return { kind: "right", cuts: RIGHT, s: mv(440, 496, OUT, 0) };
  if (g < 611) return { kind: "right", cuts: RIGHT, s: mv(598, 608, 0, OUT) };
  return { kind: "right", cuts: RIGHT, s: mv(611, 633, OUT, 0) };
};
/** plug rotation, degrees clockwise */
export const thetaAt = (g: number) => {
  const e = (a: number, b: number) => io(g, [a, b], [0, 1], easeInOut);
  if (g < 392) return 0;
  if (g < 430) return 2.0 * bump(g, 392, 404) + 1.7 * bump(g, 408, 421);
  if (g < 524) return 0;
  if (g < 598) return 90 * e(524, 594);
  if (g < 611) return 90 * (1 - e(598, 608));
  if (g < 661) return 0;
  return 90 * e(661, 697);
};

/* view morph: full-size side section (phase 1) → small section on top + end-on section below (phase 2) */
const viewAt = (g: number, base?: { tx: number; ty: number }) => {
  const k = io(g, [302, 324], [0, 1], easeInOut);
  const t0 = base ?? { tx: 320, ty: 930 };
  return { tx: t0.tx + (300 - t0.tx) * k, ty: t0.ty + (794 - t0.ty) * k, sc: 1 + (0.7 - 1) * k, k };
};
type View = ReturnType<typeof viewAt>;
const P = (v: View, xmm: number, ymm: number) => ({ x: v.tx + xmm * S * v.sc, y: v.ty + ymm * S * v.sc });

/* ────────── drawing helpers ────────── */
const keyPinPath = (xc: number, yb: number, low: number) => {
  const w = PIN_W / 2, t = TIP_W / 2;
  return `M ${m(xc - w)} ${m(yb)} L ${m(xc + w)} ${m(yb)} L ${m(xc + w)} ${m(low - TIP_H)} L ${m(xc + t)} ${m(low)} L ${m(xc - t)} ${m(low)} L ${m(xc - w)} ${m(low - TIP_H)} Z`;
};
const springPath = (xc: number, y0: number, y1: number, coils = 6) => {
  const pts: string[] = [];
  for (let j = 0; j <= coils * 2; j++) {
    const t = j / (coils * 2), y = y0 + (y1 - y0) * t;
    const x = j === 0 || j === coils * 2 ? xc : xc + (j % 2 ? 1 : -1) * 1.0;
    pts.push(`${m(x)} ${m(y)}`);
  }
  return "M " + pts.join(" L ");
};
const housingPath = () => {
  let d = `M 0 ${m(-12.6)} L ${m(26.5)} ${m(-12.6)} L ${m(26.5)} ${m(15.3)} L 0 ${m(15.3)} L 0 ${m(PLUG_D)} L ${m(25)} ${m(PLUG_D)} L ${m(25)} 0`;
  for (let i = 4; i >= 0; i--) {
    const a = PIN_X[i] + BORE / 2, b = PIN_X[i] - BORE / 2;
    d += ` L ${m(a)} 0 L ${m(a)} ${m(CEIL)} L ${m(b)} ${m(CEIL)} L ${m(b)} 0`;
  }
  return d + " L 0 0 Z";
};
const plugBody = () =>
  `M ${m(PIN_X[4] + BORE / 2)} 0 L ${m(25)} 0 L ${m(25)} ${m(PLUG_D)} L 0 ${m(PLUG_D)} L 0 ${m(10.8)} L ${m(24)} ${m(10.8)} L ${m(24)} ${m(Y_B)} L ${m(PIN_X[4] + BORE / 2)} ${m(Y_B)} Z`;
const skins = () => {
  const xs = [0, ...PIN_X.flatMap((x) => [x - BORE / 2, x + BORE / 2])];
  const out: [number, number][] = [];
  for (let i = 0; i < 5; i++) out.push([i === 0 ? 0 : PIN_X[i - 1] + BORE / 2, PIN_X[i] - BORE / 2]);
  void xs;
  return out;
};

const Defs2: React.FC = () => (
  <defs>
    <pattern id="hatchP" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="16" stroke={K.line} strokeOpacity="0.2" strokeWidth="2.2" />
    </pattern>
    <pattern id="hatchH" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="18" stroke={K.lineDim} strokeOpacity="0.32" strokeWidth="2" />
    </pattern>
    <pattern id="hatchD" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="22" stroke={K.lineDim} strokeOpacity="0.28" strokeWidth="2" />
    </pattern>
  </defs>
);

/** the key (right = amber, wrong = steel) in key-local px; translate by -s */
const Key: React.FC<{ cuts: number[]; right: boolean; s: number; nums?: number }> = ({ cuts, right, s, nums = 1 }) => {
  const top = keyOutline(cuts);
  const col = right ? AMBER : K.muted;
  let d = `M ${m(-6.8)} ${m(0.4)} L 0 ${m(0.4)} L 0 ${m(Y_B)}`;
  top.forEach(([k, y]) => { d += ` L ${m(k)} ${m(Math.min(y, TIP_Y + 0.001))}`; });
  d += ` L ${m(K_TIP)} ${m(K_BOT)} L 0 ${m(K_BOT)} L 0 ${m(11.9)} L ${m(-6.8)} ${m(11.9)} Q ${m(-9.2)} ${m(11.9)} ${m(-9.2)} ${m(9.5)} L ${m(-9.2)} ${m(2.8)} Q ${m(-9.2)} ${m(0.4)} ${m(-6.8)} ${m(0.4)} Z`;
  return (
    <g transform={`translate(${-s * S} 0)`}>
      <path d={d} fill={right ? "#241A07" : "#0F2540"} />
      <path d={d} fill={col} fillOpacity={right ? 0.24 : 0.14} stroke={col} strokeWidth={3.4} strokeLinejoin="round" />
      <circle cx={m(-4.6)} cy={m(6.15)} r={m(1.45)} fill={K.bgDeep} stroke={col} strokeWidth={3} />
      {nums > 0 && cuts.map((d_, i) => (
        <text key={i} x={m(PIN_X[i])} y={m(8.9)} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={36} fill={col} opacity={nums}>{d_}</text>
      ))}
    </g>
  );
};

/* ────────── side section (pins, springs, shear line, key) ────────── */
const Side: React.FC<{
  g: number; v: View; ks: KS; pins: PinSt[]; allOk: boolean; dim?: number; bob?: number; ghost?: number; shear?: number; cutMark?: number; springHi?: number; nums?: number; crossO?: number;
}> = ({ g, v, ks, pins, allOk, dim = 1, bob = 0, ghost = 0, shear = 1, cutMark = 0, springHi = 0, nums = 1, crossO = 1 }) => {
  const pulse = 0.65 + 0.35 * Math.sin(g * 0.35);
  return (
    <g transform={`translate(${v.tx} ${v.ty}) scale(${v.sc})`} opacity={dim}>
      {/* body */}
      <path d={housingPath()} fill="url(#hatchH)" stroke={K.lineDim} strokeWidth={3.2} strokeLinejoin="round" />
      <rect x={0} y={m(Y_B)} width={m(24)} height={m(10.8 - Y_B)} fill={K.bgDeep} opacity={0.55} />
      <path d={plugBody()} fill="url(#hatchP)" stroke={K.line} strokeWidth={3.2} strokeLinejoin="round" />
      {skins().map(([a, b], i) => (
        <rect key={i} x={m(a)} y={0} width={m(b - a)} height={m(Y_B)} fill="url(#hatchP)" stroke={K.line} strokeWidth={3.2} />
      ))}
      <text x={m(24.5)} y={m(11.9)} fontFamily={K.mono} fontSize={22} fill={K.muted} textAnchor="middle" opacity={0.0}>·</text>
      {/* ghost: where every pair has to split */}
      {ghost > 0.01 && PIN_X.map((xc, i) => {
        const o = clamp01(ghost * 5 - i);
        return (
          <g key={i} opacity={o * 0.9}>
            <path d={keyPinPath(xc, 0, KEY_PIN_LEN[i])} fill="none" stroke={AMBER} strokeWidth={2.6} strokeDasharray="9 7" />
            <rect x={m(xc - PIN_W / 2)} y={m(-LD)} width={m(PIN_W)} height={m(LD)} fill="none" stroke={AMBER} strokeWidth={2.6} strokeDasharray="9 7" />
            <circle cx={m(xc)} cy={0} r={9} fill={AMBER} />
          </g>
        );
      })}
      {/* pins + springs */}
      {pins.map((p, i) => {
        const xc = PIN_X[i];
        const yb = p.yb + bob, low = p.low + bob, top = p.top + bob;
        const cross = p.ok ? 0 : yb > 0 ? 1 : -1;
        return (
          <g key={i}>
            <path d={springPath(xc, CEIL, top)} fill="none" stroke={springHi > 0.01 ? AMBER : K.muted} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
            <rect x={m(xc - PIN_W / 2)} y={m(top)} width={m(PIN_W)} height={m(LD)} fill="#0A1F3A" stroke={K.text} strokeWidth={3} strokeLinejoin="round" />
            <rect x={m(xc - PIN_W / 2)} y={m(top)} width={m(PIN_W)} height={m(LD)} fill={K.text} fillOpacity={0.07} />
            <path d={keyPinPath(xc, yb, low)} fill="#0A1F3A" />
            <path d={keyPinPath(xc, yb, low)} fill={K.line} fillOpacity={0.22} stroke={K.line} strokeWidth={3} strokeLinejoin="round" />
            {cross !== 0 && crossO > 0.01 && (
              <g opacity={crossO}>
                <rect x={m(xc - PIN_W / 2) - 2} y={m(Math.min(0, yb))} width={m(PIN_W) + 4} height={Math.max(6, Math.abs(m(yb)))} fill={RED} fillOpacity={0.35 + 0.25 * pulse} stroke={RED} strokeWidth={4} />
                {g >= 340 && g < 430 && <circle cx={m(xc)} cy={m(yb / 2)} r={m(2.1) + 5 * pulse} fill="none" stroke={RED} strokeWidth={3} opacity={0.8} />}
              </g>
            )}
          </g>
        );
      })}
      {/* shear line */}
      <line x1={m(-1.2)} y1={0} x2={m(26.5)} y2={0} stroke={AMBER} strokeWidth={allOk ? 4 : 2.5} strokeDasharray={allOk ? undefined : "14 9"} opacity={shear} />
      {allOk && <rect x={0} y={-6} width={m(25)} height={12} fill={AMBER} opacity={0.35 * pulse * shear} style={{ filter: "blur(7px)" }} />}
      {pins.map((p, i) => (
        <circle key={i} cx={m(PIN_X[i])} cy={0} r={p.ok ? 8 : 6} fill={p.ok ? AMBER : RED} opacity={shear * (p.ok ? 1 : 0.9 * crossO)} />
      ))}
      {/* cut plane A–A through pin 3 */}
      {cutMark > 0.01 && (
        <g opacity={cutMark}>
          <line x1={m(PIN_X[2])} y1={m(-12.6)} x2={m(PIN_X[2])} y2={m(15.3)} stroke={AMBER} strokeWidth={2.4} strokeDasharray="26 7 4 7" opacity={0.8} />
          <text x={m(PIN_X[2] + 1.6)} y={m(-11.0)} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={34} fill={AMBER}>A</text>
          <text x={m(PIN_X[2] + 1.6)} y={m(14.6)} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={34} fill={AMBER}>A</text>
        </g>
      )}
      {/* key on top */}
      {ks.cuts && <Key cuts={ks.cuts} right={ks.kind === "right"} s={ks.s} nums={nums} />}
    </g>
  );
};

/* ────────── end-on section (plug turns, bolt retracts) ────────── */
const CX = 390, CY = 1320, ES = 0.85;
const End2: React.FC<{ g: number; theta: number; pin: PinSt; keyTop: number; ok: boolean; o: number; right: boolean }> = ({ g, theta, pin, keyTop, ok, o, right }) => {
  const e = (mm: number) => mm * SE;
  const rp = PLUG_D / 2, R_H = 11, BUMP = 3.7, TOP = -(rp + 5.8);
  const tail = boltX(theta);
  const th = (theta * Math.PI) / 180;
  const camX = BOLT.R * Math.cos(th), camY = BOLT.R * Math.sin(th);
  const yy = Math.sqrt(R_H * R_H - BUMP * BUMP);
  const housing = `M ${e(-BUMP)} ${e(-yy)} L ${e(-BUMP)} ${e(TOP)} L ${e(BUMP)} ${e(TOP)} L ${e(BUMP)} ${e(-yy)} A ${e(R_H)} ${e(R_H)} 0 1 1 ${e(-BUMP)} ${e(-yy)} Z`;
  const bw = BORE / 2, sw = SLOT / 2, cx0 = Math.sqrt(rp * rp - bw * bw);
  const plug = `M ${e(-bw)} ${-e(cx0)} A ${e(rp)} ${e(rp)} 0 1 0 ${e(bw)} ${-e(cx0)} L ${e(bw)} ${e(Y_B - rp)} L ${e(sw)} ${e(Y_B - rp)} L ${e(sw)} ${e(10.8 - rp)} L ${e(-sw)} ${e(10.8 - rp)} L ${e(-sw)} ${e(Y_B - rp)} L ${e(-bw)} ${e(Y_B - rp)} Z`;
  const boltL = tail - BOLT.TAIL, boltR = tail + BOLT.TIP_LEN;
  const yb = pin.yb - rp, low = pin.low - rp, dtop = yb - LD;
  const pw = PIN_W / 2, tw = TIP_W / 2;
  const jam = !ok && theta > 0.01;
  return (
    <g transform={`translate(${CX} ${CY}) scale(${ES})`} opacity={o}>
      {/* door + jamb */}
      <rect x={-270} y={-254} width={670} height={482} fill="url(#hatchD)" stroke={K.lineDim} strokeWidth={3} />
      <path d={`M 480 -254 L 620 -254 L 620 228 L 480 228 L 480 42 L 585 42 L 585 -42 L 480 -42 Z`} fill="url(#hatchD)" stroke={K.lineDim} strokeWidth={3} />
      {/* bolt: hidden dashed inside the door, solid outside */}
      <defs>
        <clipPath id="inDoor"><rect x={-300} y={-60} width={700} height={120} /></clipPath>
        <clipPath id="outDoor"><rect x={400} y={-60} width={400} height={120} /></clipPath>
      </defs>
      <g clipPath="url(#outDoor)">
        <rect x={boltL} y={-34} width={boltR - boltL} height={68} fill="#0A1F3A" stroke={AMBER} strokeWidth={3.4} />
        <rect x={boltL} y={-34} width={boltR - boltL} height={68} fill={AMBER} fillOpacity={0.22} />
      </g>
      <g clipPath="url(#inDoor)">
        <rect x={boltL} y={-34} width={boltR - boltL} height={68} fill={AMBER} fillOpacity={0.08} stroke={AMBER} strokeWidth={2.4} strokeDasharray="12 8" opacity={0.85} />
      </g>
      {/* housing */}
      <path d={housing} fill={K.bgDeep} fillOpacity={0.9} />
      <path d={housing} fill="url(#hatchH)" stroke={K.lineDim} strokeWidth={3.2} strokeLinejoin="round" />
      <rect x={e(-BORE / 2 - 0.0)} y={e(TOP) + 2} width={e(BORE)} height={e(-rp - TOP)} fill={K.bgDeep} />
      <circle r={e(rp) + 1} fill={K.bgDeep} />
      <line x1={e(-BORE / 2)} y1={e(TOP)} x2={e(-BORE / 2)} y2={-e(rp)} stroke={K.lineDim} strokeWidth={3} />
      <line x1={e(BORE / 2)} y1={e(TOP)} x2={e(BORE / 2)} y2={-e(rp)} stroke={K.lineDim} strokeWidth={3} />
      {/* break symbol on the chamber top */}
      <path d={`M ${e(-BUMP) - 8} ${e(TOP) - 2} l 14 -8 l 14 10 l 14 -10 l 14 10 l 14 -10 l 14 10 l 14 -10 l 14 10 l 14 -10 l 14 10`} fill="none" stroke={K.muted} strokeWidth={2} opacity={0.8} transform={`translate(${e(-BUMP) * 0 + 6} 0)`} />
      {/* driver pin + spring (stay in the housing) */}
      <path d={springPathE(0, dtop, TOP + 0.2, 4, SE)} fill="none" stroke={K.muted} strokeWidth={3} strokeLinejoin="round" />
      <rect x={e(-pw)} y={e(dtop)} width={e(PIN_W)} height={e(LD)} fill="#0A1F3A" stroke={K.text} strokeWidth={3} />
      <rect x={e(-pw)} y={e(dtop)} width={e(PIN_W)} height={e(LD)} fill={K.text} fillOpacity={0.07} />
      {/* the plug and everything locked to it */}
      <g transform={`rotate(${theta})`}>
        <path d={plug} fill="url(#hatchP)" stroke={K.line} strokeWidth={3.2} strokeLinejoin="round" />
        <rect x={e(-1.3)} y={e(keyTop - rp)} width={e(2.6)} height={e(K_BOT - keyTop)} fill={right ? "#241A07" : "#0F2540"} />
        <rect x={e(-1.3)} y={e(keyTop - rp)} width={e(2.6)} height={e(K_BOT - keyTop)} fill={right ? AMBER : K.muted} fillOpacity={right ? 0.24 : 0.14} stroke={right ? AMBER : K.muted} strokeWidth={3} />
        <path d={`M ${e(-pw)} ${e(yb)} L ${e(pw)} ${e(yb)} L ${e(pw)} ${e(low - TIP_H)} L ${e(tw)} ${e(low)} L ${e(-tw)} ${e(low)} L ${e(-pw)} ${e(low - TIP_H)} Z`} fill="#0A1F3A" />
        <path d={`M ${e(-pw)} ${e(yb)} L ${e(pw)} ${e(yb)} L ${e(pw)} ${e(low - TIP_H)} L ${e(tw)} ${e(low)} L ${e(-tw)} ${e(low)} L ${e(-pw)} ${e(low - TIP_H)} Z`} fill={K.line} fillOpacity={0.22} stroke={K.line} strokeWidth={3} strokeLinejoin="round" />
      </g>
      {/* shear circle */}
      <circle r={e(rp)} fill="none" stroke={AMBER} strokeWidth={ok ? 3.4 : 2.2} strokeDasharray={ok ? undefined : "12 8"} opacity={0.9} />
      {jam && <rect x={e(-pw) - 3} y={e(-rp)} width={e(PIN_W) + 6} height={Math.max(6, e(yb + rp))} fill={RED} fillOpacity={0.5} stroke={RED} strokeWidth={4} />}
      {!jam && !ok && pin.yb > 0.06 && <rect x={e(-pw) - 3} y={e(-rp)} width={e(PIN_W) + 6} height={Math.max(6, e(pin.yb))} fill={RED} fillOpacity={0.5} stroke={RED} strokeWidth={4} />}
      {/* turning intent: red and short when jammed, amber and following the plug when free */}
      {g >= 390 && g < 428 && (
        <g opacity={Math.min(1, bump(g, 390, 428) * 3)}>
          <TorqueArrow r={e(rp) + 36} sweep={0.2} mag={0.25} color={RED} start={-52} />
          <g transform={`translate(${(e(rp) + 36) * Math.cos((-52 + 60) * Math.PI / 180)} ${(e(rp) + 36) * Math.sin((-52 + 60) * Math.PI / 180)})`} opacity={io(g, [404, 412], [0, 1])}>
            <circle r={22} fill={K.bgDeep} stroke={RED} strokeWidth={4} />
            <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke={RED} strokeWidth={5} strokeLinecap="round" />
          </g>
        </g>
      )}
      {((g >= 524 && g < 598) || g >= 661) && theta > 3 && <TorqueArrow r={e(rp) + 36} sweep={theta / 300} mag={0.25} color={AMBER} start={-52} />}
      {/* hidden linkage: cam on the back of the plug → link → bolt */}
      <g opacity={0.9}>
        <line x1={0} y1={0} x2={camX} y2={camY} stroke={AMBER} strokeWidth={5} strokeLinecap="round" strokeDasharray="14 9" />
        <line x1={camX} y1={camY} x2={tail} y2={0} stroke={AMBER} strokeWidth={3} strokeDasharray="10 8" />
        <circle cx={camX} cy={camY} r={9} fill={K.bgDeep} stroke={AMBER} strokeWidth={3.4} />
        <circle cx={tail} cy={0} r={8} fill={K.bgDeep} stroke={AMBER} strokeWidth={3.4} />
        <circle r={7} fill={AMBER} />
      </g>
    </g>
  );
};
const springPathE = (xc: number, y0: number, y1: number, coils: number, sc: number) => {
  const pts: string[] = [];
  for (let j = 0; j <= coils * 2; j++) {
    const t = j / (coils * 2), y = y0 + (y1 - y0) * t;
    const x = j === 0 || j === coils * 2 ? xc : xc + (j % 2 ? 1 : -1) * 0.95;
    pts.push(`${x * sc} ${y * sc}`);
  }
  return "M " + pts.join(" L ");
};

/* right-hand readout panel (phase 2) */
const Panel: React.FC<{ g: number; pins: PinSt[]; n: number; o: number }> = ({ g, pins, n, o }) => {
  const col = n === 5 ? GREEN : RED;
  return (
    <div style={{ position: "absolute", left: 806, top: 588, width: 226, opacity: o }}>
      <div style={{ fontFamily: K.mono, fontSize: 20, letterSpacing: 4, color: K.muted }}>AT SHEAR LINE</div>
      <div style={{ marginTop: 2 }}><Readout value={`${n}/5`} size={104} color={col} /></div>
      <div style={{ marginTop: 14, borderTop: `2px solid ${K.lineDim}`, paddingTop: 12 }}>
        {pins.map((p, i) => {
          const v = Math.abs(p.yb) < 0.06 ? 0 : p.yb;
          const c = Math.abs(p.yb) < 0.06 ? GREEN : RED;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: K.mono, fontSize: 24, letterSpacing: 1, lineHeight: "38px", color: K.muted }}>
              <span>P{i + 1}</span>
              <span style={{ color: c, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{(v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1)} mm</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Leader: React.FC<{ x1: number; y1: number; x2: number; y2: number; at: number; g: number; out?: number; color?: string }> = ({ x1, y1, x2, y2, at, g, out, color = K.muted }) => {
  const p = io(g, [at, at + 10], [0, 1]) * (out !== undefined ? 1 - io(g, [out, out + 8], [0, 1]) : 1);
  if (p <= 0.01) return null;
  return <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={color} strokeWidth={2} opacity={0.9} />;
};

/* ────────── the one continuous shot ────────── */
export const LockShot: React.FC = () => {
  const g = useCurrentFrame();
  const v = viewAt(g);
  const ks = keyAt(g);
  const theta = thetaAt(g);
  const pins = allPins(ks.cuts, ks.s);
  const nOk = pins.filter((p) => p.ok).length;
  const allOk = nOk === 5;
  const fade = io(g, [698, 710], [0, 1]);
  const phase2 = v.k;
  const bob = g > 168 && g < 212 ? 0.22 * Math.sin((g - 168) * 0.55) * Math.min(1, (212 - g) / 14) : 0;
  const springHi = g > 168 && g < 206 ? 1 : 0;
  const ghost = io(g, [236, 266], [0, 1]) * (1 - phase2);
  const sideDim = 1 - 0.45 * clamp01(theta / 14) * (g < 600 ? 1 : 0) - (g >= 661 ? 0.45 * clamp01(theta / 14) : 0);
  const p3 = pins[2];
  const keyTop = ks.cuts ? cutY(ks.cuts[2]) : 99;
  const keyIn = ks.cuts ? clamp01((OUT - ks.s) / 8) : 0;
  const keyTopEnd = ks.cuts ? cutY(ks.cuts[2]) : Y_B + 4.0;
  void keyTop; void keyIn;
  const endO = io(g, [310, 330], [0, 1]);
  const flash = Math.max(io(g, [494, 500], [0, 1]) * (1 - io(g, [500, 530], [0, 1])), io(g, [633, 637], [0, 1]) * (1 - io(g, [637, 656], [0, 1])));
  void flash;
  const bolt = boltX(theta);
  const unlocked = bolt < 300;
  const sh = P(v, 0, 0);
  const pL = (xm: number, ym: number) => P(v, xm, ym);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      {/* headlines */}
      <Headline f={g} lines={["Your key is", "a *code*"]} at={-30} exitAt={100} size={104} />
      <Headline f={g} lines={["Two pins", "*per hole*"]} at={121} exitAt={207} size={96} />
      <Headline f={g} lines={["One *shear line*"]} at={216} exitAt={301} size={94} />
      <Headline f={g} lines={["Wrong key =", "*jammed*"]} at={322} exitAt={425} size={88} accent={RED} />
      <Headline f={g} lines={["Right key =", "*aligned*"]} at={436} exitAt={516} size={88} accent={GREEN} />
      <Headline f={g} lines={["Plug turns,", "bolt *retracts*"]} at={528} exitAt={604} size={88} />
      <Headline f={g} lines={["*Lift.*"]} at={611} exitAt={625} size={110} />
      <Headline f={g} lines={["*Align.*"]} at={635} exitAt={651} size={110} accent={GREEN} />
      <Headline f={g} lines={["*Turn.*"]} at={661} exitAt={675} size={110} />
      <Headline f={g} lines={["*Open.*"]} at={685} exitAt={702} size={110} accent={GREEN} />

      <Layer>
        <Defs2 />
        <Side g={g} v={v} ks={ks} pins={pins} allOk={allOk} dim={sideDim} bob={bob} ghost={ghost} cutMark={io(g, [306, 330], [0, 1])} springHi={springHi} crossO={g < 317 ? io(g, [262, 276], [0, 1]) : 1}
          shear={Math.max(io(g, [212, 232], [0, 1]), allOk ? 1 : 0)} nums={1} />
        {/* end-on section */}
        <End2 g={g} theta={theta} pin={p3} keyTop={keyTopEnd} ok={p3.ok} o={endO} right={ks.kind !== "wrong"} />
        {/* phase-1 leaders (labels left of the face) */}
        <Leader g={g} at={125} out={205} x1={300} y1={pL(0, -11.3).y} x2={pL(1.2, -11.3).x} y2={pL(1.2, -11.3).y} />
        <Leader g={g} at={140} out={205} x1={300} y1={pL(0, 0.4).y + 0} x2={pL(PIN_X[0] - 1.35, 0.4).x} y2={pL(0, 0.4).y} />
        <Leader g={g} at={156} out={205} x1={300} y1={pL(0, 4.7).y} x2={pL(PIN_X[0] - 1.25, 4.7).x} y2={pL(0, 4.7).y} />
        <Leader g={g} at={172} out={205} x1={300} y1={pL(0, -6.2).y} x2={pL(PIN_X[0] - 0.9, -6.2).x} y2={pL(0, -6.2).y} />
        <Leader g={g} at={188} out={205} x1={300} y1={pL(0, 11.8).y} x2={pL(1.0, 11.8).x} y2={pL(0, 11.8).y} />
        {/* shear-scene dimensions */}
        {g > 236 && g < 308 && (
          <g opacity={io(g, [238, 252], [0, 1]) * (1 - io(g, [298, 308], [0, 1]))}>
            <Dim x1={pL(PIN_X[0], 0).x} y1={1368} x2={pL(PIN_X[1], 0).x} y2={1368} p={io(g, [240, 258], [0, 1])} label="3.96 mm" />
            <line x1={pL(PIN_X[0], 0).x} y1={1350} x2={pL(PIN_X[0], 0).x} y2={1378} stroke={K.muted} strokeWidth={2} />
            <line x1={pL(PIN_X[1], 0).x} y1={1350} x2={pL(PIN_X[1], 0).x} y2={1378} stroke={K.muted} strokeWidth={2} />
            <Dim x1={284} y1={pL(0, 0).y} x2={284} y2={pL(0, PLUG_D).y} p={io(g, [246, 264], [0, 1])} />
            <text x={252} y={(pL(0, 0).y + pL(0, PLUG_D).y) / 2} fontFamily={K.mono} fontSize={24} fill={K.muted} textAnchor="middle" transform={`rotate(-90 252 ${(pL(0, 0).y + pL(0, PLUG_D).y) / 2})`} opacity={io(g, [256, 268], [0, 1])}>PLUG Ø 12.7 mm</text>
          </g>
        )}
        {/* phase-2: cut-plane link */}
        {phase2 > 0.5 && (
          <g opacity={(phase2 - 0.5) * 2 * (1 - fade)}>
            <line x1={pL(PIN_X[2], 15.3).x} y1={pL(PIN_X[2], 15.3).y + 14} x2={CX} y2={CY - 12.15 * SE * ES} stroke={AMBER} strokeWidth={2} strokeDasharray="6 8" opacity={0.7} />
          </g>
        )}
      </Layer>

      {/* hook: code readout + tag at the bottom */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1350, textAlign: "center", opacity: 1 - io(g, [104, 116], [0, 1]) }}>
        <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 6, color: K.muted, marginBottom: 6 }}>KEY CUT DEPTHS</div>
        <Readout value="3 · 5 · 2 · 4 · 1" size={84} color={AMBER} />
      </div>
      <Tag f={g} at={-30} text="5 PINS · 1 KEY" x={540} y={1532} color={AMBER} solid size={30} out={110} />
      {/* pin numbers over the chambers */}
      {PIN_X.map((xc, i) => (
        <Tag key={i} f={g} at={53 + i * 5} text={`${i + 1}`} x={pL(xc, -11.3).x} y={pL(xc, -11.3).y} color={K.line} size={22} out={112} />
      ))}

      {/* pins beat: labels left of the face */}
      <Tag f={g} at={121} text="HOUSING" x={176} y={pL(0, -11.3).y} color={K.muted} size={22} out={205} />
      <Tag f={g} at={136} text="DRIVER PIN" x={166} y={pL(0, 0.4).y} color={K.text} size={22} out={205} />
      <Tag f={g} at={152} text="KEY PIN" x={186} y={pL(0, 4.7).y} color={K.line} size={22} out={205} />
      <Tag f={g} at={168} text="SPRING" x={186} y={pL(0, -6.2).y} color={K.muted} size={22} out={205} />
      <Tag f={g} at={184} text="PLUG" x={196} y={pL(0, 11.8).y} color={K.line} size={22} out={205} />

      {/* shear beat */}
      <Tag f={g} at={276} text="SHEAR LINE" x={174} y={sh.y - 44} color={AMBER} solid size={22} out={302} />
      <div style={{ position: "absolute", left: 100, width: 880, top: 1424, opacity: io(g, [232, 244], [0, 1]) * (1 - io(g, [298, 308], [0, 1])) }}>
        <Meter x={0} y={0} w={880} v={nOk / 5} label="PAIRS SPLIT AT THE LINE" value={`${nOk} / 5`} color={nOk === 5 ? GREEN : RED} />
      </div>

      {/* phase 2: readout panel + state chips */}
      <Panel g={g} pins={pins} n={nOk} o={io(g, [316, 332], [0, 1]) * (1 - fade)} />
      <Tag f={g} at={356} text="BLOCKED" x={919} y={1012} color={RED} solid size={26} out={440} />
      <Tag f={g} at={392} text="PLUG JAMMED" x={690} y={1196} color={RED} solid size={24} out={425} />
      <Tag f={g} at={330} text="KEY B" x={pL(-4.6, -1.2).x} y={pL(-4.6, -1.2).y - 16} color={K.muted} size={22} out={420} />
      <Tag f={g} at={448} text="KEY A" x={pL(-4.6, -1.2).x} y={pL(-4.6, -1.2).y - 16} color={AMBER} size={22} out={600} />
      <Tag f={g} at={497} text="ALIGNED" x={919} y={1012} color={GREEN} solid size={26} out={598} />
      <Tag f={g} at={530} text="PLUG TURNS ↻" x={690} y={1196} color={AMBER} size={22} out={558} />
      <Tag f={g} at={566} text="BOLT" x={780} y={1262} color={AMBER} size={22} out={598} />
      <Tag f={g} at={578} text="UNLOCKED" x={762} y={1384} color={GREEN} solid size={26} out={598} />
      {/* hero chips */}
      <Tag f={g} at={613} text="LIFT" x={919} y={1012} color={K.line} solid size={26} out={632} />
      <Tag f={g} at={637} text="ALIGN" x={919} y={1012} color={GREEN} solid size={26} out={658} />
      <Tag f={g} at={663} text="TURN" x={919} y={1012} color={AMBER} solid size={26} out={682} />
      <Tag f={g} at={687} text="OPEN" x={919} y={1012} color={GREEN} solid size={26} />
      <Tag f={g} at={690} text="UNLOCKED" x={762} y={1384} color={GREEN} solid size={26} />
      <Label f={g} at={316} text="SECTION A–A" x={166} y={1114} size={20} />
    </div>
  );
};

/* ────────── end card ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const m_ = 18, cd = (m_ * 23) / 2, cx = 540 - cd * 0.17, cy = 1085 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={f} lines={["Comment", "*anything*"]} at={2} top={380} size={118} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", fontFamily: K.head, fontWeight: 600, fontSize: 40, letterSpacing: -0.5, color: K.text, opacity: io(f, [40, 52], [0, 1]) }}>
        Get the free PDF: <span style={{ color: AMBER, fontFamily: K.serif, fontStyle: "italic", fontWeight: 400, fontSize: 48 }}>How AI Works</span>
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1020px", opacity: clamp01(p) }}>
        <Gear N={14} m={m_} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
        <Gear N={9} m={m_} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
        <Gear N={9} m={m_} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
      </div>
      <Tag f={f} at={8} text="COMMENT ANYTHING  ↓" x={540} y={1330} color={AMBER} solid size={32} />
      <Label f={f} at={110} text="FOLLOW US TO RECEIVE IT" x={540} y={1410} size={26} align="center" color={K.text} />
      <Label f={f} at={136} text="AKS PRODUCTIONS" x={540} y={1466} size={30} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => {
  const v = { tx: 320, ty: 1040, sc: 1, k: 0 };
  const ks: KS = { kind: "right", cuts: RIGHT, s: 0 };
  const pins = allPins(RIGHT, 0);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.amber }}>HOW IT WORKS · 09</div>
        <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 116, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>Your key is</div>
        <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: AMBER }}>a code</div>
      </div>
      <Layer>
        <Defs2 />
        <Side g={60} v={v} ks={ks} pins={pins} allOk dim={1} />
      </Layer>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1490, textAlign: "center" }}>
        <Readout value="3 · 5 · 2 · 4 · 1" size={72} color={K.muted} />
      </div>
    </>
  );
};

export { easeInOut, easeOut, pinState };
