import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Readout, Tag, clamp01, ioB, meshPhase, W, H } from "../gearbox/kit";
import {
  BIAS_PX, C_KM_S, DELAY_MS, GHOST, ONE_US_M, PHONE, PSEUDO_PX, RANGE_KM, RANGE_PX, SATS, SOLVED_BIAS_PX, VIEW,
  dist, misfit, nearPoints,
} from "./geometry";

/** Global frames from public/projects/gps/vo.json. Keep in sync with soundtrack.py. */
export const T = { sats: 109, light: 187, one: 252, two: 302, three: 347, catch: 380, fourth: 521, hero: 601, fin: 674, end: 706, total: 900 };
export const CUTS = [0, 109, 187, 252, 302, 347, 380, 521, 601, 674, 706];

const AMBER = K.amber, GREEN = K.green, RED = K.red;
/** one cool hue per satellite so every circle can be followed */
const SC = ["#5CD3FF", "#8EA8FF", "#4FE3C8", "#FF9BD6"];
const lin = (t: number) => t;
const grow = (g: number, a: number, d = 24) => io(g, [a, a + d], [0, 1], easeOut);
const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const bearing = (i: number) => Math.atan2(PHONE.y - SATS[i].y, PHONE.x - SATS[i].x);
const BI = SOLVED_BIAS_PX; // the clock bias the solver recovered from the circles (px)
const MIS0 = misfit(SATS, PSEUDO_PX);

/* ────────── choreography: everything the circles do, as a function of the global frame ────────── */
export type CS = { R: number[]; o: number; bias: number };
export const circlesAt = (g: number): CS => {
  const R = [0, 0, 0, 0];
  if (g < 626) {
    const gr = [grow(g, 254, 26), grow(g, 304, 24), grow(g, 349, 24), grow(g, 524, 26)];
    const b = g < 598 ? BI * io(g, [436, 470], [0, 1], easeInOut) * (1 - io(g, [552, 592], [0, 1], easeInOut)) : 0;
    for (let i = 0; i < 4; i++) R[i] = (RANGE_PX[i] + b) * gr[i];
    const o = g < 598 ? 1 : 1 - io(g, [598, 608], [0, 1]);
    return { R, o, bias: b };
  }
  if (g < 650) {
    for (let i = 0; i < 4; i++) R[i] = (RANGE_PX[i] + BI) * grow(g, 626 + i * 3, 18);
    return { R, o: 1, bias: BI };
  }
  const t = io(g, [650, 668], [0, 1], easeInOut);
  const b = g < 674 ? BI * (1 - t) : 0;
  for (let i = 0; i < 4; i++) R[i] = RANGE_PX[i] + b;
  return { R, o: 1, bias: b };
};
/** satellites taking part (others dim) */
const satO = (g: number, i: number) => {
  const sub = (a: number) => io(g, [a, a + 8], [1, 0.28]);
  if (g < T.light) return 1;
  if (g < T.one) return i === 0 ? 1 : sub(T.light + 2);
  if (g < T.two) return i === 0 ? 1 : sub(T.one);
  if (g < T.three) return i < 2 ? 1 : sub(T.two);
  if (g < T.fourth) return i < 3 ? 1 : 0.28;
  if (g < 598) return 1;
  return 1;
};
const phoneIconO = (g: number) => (g < 598 ? 1 - io(g, [250, 260], [0, 1]) : io(g, [601, 611], [0, 1]) * (1 - io(g, [648, 656], [0, 1])));

/* ────────── drawing helpers ────────── */
const circ = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const arcPath = (c: { x: number; y: number }, r: number, a0: number, a1: number) =>
  `M ${c.x + r * Math.cos(a0)} ${c.y + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${c.x + r * Math.cos(a1)} ${c.y + r * Math.sin(a1)}`;

/** the satellite: body, two solar panels, dish pointing at the phone */
const SatIcon: React.FC<{ i: number; o?: number; s?: number; pulse?: number }> = ({ i, o = 1, s = 0.95, pulse = 0 }) => {
  const c = SC[i], p = SATS[i], a = (bearing(i) * 180) / Math.PI;
  const away = { x: -Math.cos(bearing(i)), y: -Math.sin(bearing(i)) };
  const panel = (y0: number) => (
    <g>
      <rect x={-11} y={y0} width={22} height={46} fill={c} fillOpacity={0.12} stroke={c} strokeWidth={3.4} />
      <line x1={-11} y1={y0 + 15.3} x2={11} y2={y0 + 15.3} stroke={c} strokeWidth={2} opacity={0.7} />
      <line x1={-11} y1={y0 + 30.6} x2={11} y2={y0 + 30.6} stroke={c} strokeWidth={2} opacity={0.7} />
      <line x1={0} y1={y0} x2={0} y2={y0 + 46} stroke={c} strokeWidth={2} opacity={0.7} />
    </g>
  );
  return (
    <g opacity={o}>
      <g transform={`translate(${p.x} ${p.y}) rotate(${a}) scale(${s * (1 + pulse * 0.35)})`}>
        <line x1={0} y1={-26} x2={0} y2={-24} stroke={c} strokeWidth={3} />
        {panel(-72)}{panel(26)}
        <rect x={-15} y={-15} width={30} height={30} rx={4} fill={K.bgDeep} stroke={c} strokeWidth={3.6} />
        <path d="M 15 -8 L 34 -19 L 34 19 L 15 8 Z" fill={c} fillOpacity={0.18} stroke={c} strokeWidth={3.2} strokeLinejoin="round" />
        <circle cx={-3} cy={0} r={4.5} fill={c} />
      </g>
      <g transform={`translate(${p.x + away.x * 60} ${p.y + away.y * 60})`}>
        <circle r={15} fill={K.bgDeep} stroke={c} strokeWidth={2.4} />
        <text y={7} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={20} fill={c}>{i + 1}</text>
      </g>
    </g>
  );
};

/** the phone: a small handset that melts into the amber fix dot */
const PhoneMark: React.FC<{ g: number; iconO: number; ringO?: number }> = ({ g, iconO, ringO = 0 }) => {
  const pulse = 0.5 + 0.5 * Math.sin(g * 0.3);
  return (
    <g transform={`translate(${PHONE.x} ${PHONE.y})`}>
      {ringO > 0 && [0, 1, 2].map((k) => {
        const t = ((g * 0.022 + k / 3) % 1);
        return <circle key={k} r={14 + t * 70} fill="none" stroke={AMBER} strokeWidth={3} opacity={ringO * (1 - t) * 0.8} />;
      })}
      <g opacity={iconO} transform={`scale(${1.15})`}>
        <rect x={-30} y={-52} width={60} height={104} rx={11} fill={K.bgDeep} stroke={K.text} strokeWidth={3.6} />
        <rect x={-23} y={-39} width={46} height={78} rx={4} fill={K.line} fillOpacity={0.08} stroke={K.lineDim} strokeWidth={2} />
        <line x1={-8} y1={-46} x2={8} y2={-46} stroke={K.muted} strokeWidth={3} strokeLinecap="round" />
      </g>
      <circle r={22 + pulse * 3} fill="none" stroke={AMBER} strokeWidth={2.4} opacity={0.5 + 0.3 * pulse} />
      <circle r={11} fill={AMBER} />
      <circle r={20} fill={AMBER} opacity={0.18} />
    </g>
  );
};

/** a travelling radio wave: arcs expanding from a satellite toward the phone, never beyond it */
const Waves: React.FC<{ g: number; sats?: number[]; speed?: number; o?: number }> = ({ g, sats = [0, 1, 2, 3], speed = 2.6, o = 1 }) => (
  <g opacity={o}>
    {sats.map((i) => {
      const d = RANGE_PX[i], b = bearing(i);
      return [0, 1, 2].map((k) => {
        const r = (((g * speed + (k * d) / 3 + i * 41) % d) + d) % d;
        const op = Math.sin((Math.PI * r) / d) ** 0.7 * 0.85;
        const half = 0.5 - 0.1 * (r / d);
        return <path key={`${i}${k}`} d={arcPath(SATS[i], r, b - half, b + half)} fill="none" stroke={SC[i]} strokeWidth={4} strokeLinecap="round" opacity={op} />;
      });
    })}
  </g>
);

/** broadcast in all directions (the satellite "talking") */
const Broadcast: React.FC<{ g: number; i: number; o?: number }> = ({ g, i, o = 1 }) => (
  <g opacity={o}>
    {[0, 1, 2].map((k) => {
      const r = (((g * 2.1 + k * 52) % 156) + 156) % 156;
      return <circle key={k} cx={SATS[i].x} cy={SATS[i].y} r={36 + r} fill="none" stroke={SC[i]} strokeWidth={3} opacity={(1 - r / 156) * 0.8} />;
    })}
  </g>
);

const Dashed: React.FC<{ i: number; o: number; arrow?: boolean }> = ({ i, o, arrow = true }) => {
  const b = bearing(i), p = SATS[i];
  const x2 = PHONE.x - Math.cos(b) * 46, y2 = PHONE.y - Math.sin(b) * 46;
  const x1 = p.x + Math.cos(b) * 56, y1 = p.y + Math.sin(b) * 56;
  if (o <= 0.01) return null;
  const hx = 14, hy = 9;
  return (
    <g opacity={o}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={SC[i]} strokeWidth={2.6} strokeDasharray="12 10" opacity={0.7} />
      {arrow && <path d={`M ${x2} ${y2} l ${-Math.cos(b) * hx - Math.sin(b) * hy} ${-Math.sin(b) * hx + Math.cos(b) * hy} l ${Math.sin(b) * 2 * hy} ${-Math.cos(b) * 2 * hy} Z`} fill={SC[i]} opacity={0.9} />}
    </g>
  );
};

const Circle: React.FC<{ i: number; r: number; o?: number; w?: number }> = ({ i, r, o = 1, w = 4.4 }) =>
  r < 0.5 ? null : (
    <g opacity={o}>
      <circle cx={SATS[i].x} cy={SATS[i].y} r={r} fill={SC[i]} fillOpacity={0.045} />
      <circle cx={SATS[i].x} cy={SATS[i].y} r={r} fill="none" stroke={SC[i]} strokeWidth={w + 9} opacity={0.12} />
      <circle cx={SATS[i].x} cy={SATS[i].y} r={r} fill="none" stroke={SC[i]} strokeWidth={w} />
    </g>
  );

const Panel: React.FC<{ o: number; children: React.ReactNode; h?: number }> = ({ o, children, h = 118 }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1424, height: h, opacity: o, borderRadius: 10, border: `2px solid ${K.lineDim}`, background: "rgba(3,11,24,0.78)", boxSizing: "border-box", padding: "14px 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
    {children}
  </div>
);
const Row: React.FC<{ children: React.ReactNode; size?: number; color?: string; justify?: string }> = ({ children, size = 30, color = K.muted, justify = "center" }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: justify, gap: 14, fontFamily: K.mono, fontSize: size, letterSpacing: size * 0.06, color, whiteSpace: "nowrap", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{children}</div>
);
const Hl: React.FC<{ c: string; children: React.ReactNode }> = ({ c, children }) => <span style={{ color: c, fontWeight: 700 }}>{children}</span>;

/** a little clock face with a drifting second hand */
const Clock: React.FC<{ g: number; x: number; y: number; r?: number; wobble?: number; o?: number }> = ({ g, x, y, r = 36, wobble = 0, o = 1 }) => {
  const a = (g * 9 + Math.sin(g * 0.9) * 14 * wobble) * (Math.PI / 180);
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <circle r={r} fill={K.bgDeep} stroke={K.text} strokeWidth={3.4} />
      {Array.from({ length: 12 }).map((_, k) => {
        const t = (k / 12) * Math.PI * 2;
        return <line key={k} x1={Math.sin(t) * (r - 4)} y1={-Math.cos(t) * (r - 4)} x2={Math.sin(t) * (r - (k % 3 ? 9 : 14))} y2={-Math.cos(t) * (r - (k % 3 ? 9 : 14))} stroke={K.muted} strokeWidth={2} />;
      })}
      <line x1={0} y1={0} x2={Math.sin(a) * (r - 9)} y2={-Math.cos(a) * (r - 9)} stroke={wobble > 0.01 ? RED : AMBER} strokeWidth={3.6} strokeLinecap="round" />
      <circle r={4} fill={K.text} />
    </g>
  );
};

/* ────────── the one continuous shot ────────── */
export const Stage: React.FC<{ g: number }> = ({ g }) => {
  const { R, o: co, bias } = circlesAt(g);
  const hero = g >= 598;
  const tHook = g < T.sats;
  const phoneO = phoneIconO(g);
  // which satellites are drawn at all: 4th appears on its beat but is in the hook picture too
  const gr4 = grow(g, 524, 26);
  const n = g >= T.fourth && g < 598 && gr4 > 0.98 ? 4 : g >= 626 && g < 674 ? 4 : g >= 598 ? 4 : 3;
  const activeIdx = Array.from({ length: n }, (_, i) => i);
  const pts = bias > 1.2 && co > 0.9 ? nearPoints(activeIdx.map((i) => SATS[i]), activeIdx.map((i) => R[i])) : [];
  const showPoly = g >= 440 && g < 540 && pts.length === 3;
  const mis = pts.length ? misfit(activeIdx.map((i) => SATS[i]), activeIdx.map((i) => R[i])) : 0;
  const lineO = (i: number) => (g < T.one ? satO(g, i) * (g < T.light ? 0.55 : i === 0 ? 1 : 0.0) * (1 - io(g, [T.one - 4, T.one + 6], [0, 1])) : 0);
  const wavesO = g < T.sats ? 1 : g >= 601 && g < 626 ? 1 : 0;
  const tx0 = io(g, [T.light + 5, T.light + 49], [0, 1], lin); // packet progress
  const b0 = bearing(0);
  const pk = { x: SATS[0].x + (PHONE.x - SATS[0].x) * tx0, y: SATS[0].y + (PHONE.y - SATS[0].y) * tx0 };
  const showGhost = g >= T.two + 20 && g < T.three + 30;
  const ghostO = io(g, [T.two + 20, T.two + 30], [0, 1]) * (1 - io(g, [T.three + 24, T.three + 34], [0, 1]));
  const cand = (() => {
    if (g < 258 || g >= 308) return [] as { x: number; y: number; k: number }[];
    const a0 = Math.atan2(PHONE.y - SATS[0].y, PHONE.x - SATS[0].x);
    const out: { x: number; y: number; k: number }[] = [];
    for (let k = -5; k <= 5; k++) {
      if (k === 0) continue;
      const a = a0 + k * 0.36;
      const x = SATS[0].x + RANGE_PX[0] * Math.cos(a), y = SATS[0].y + RANGE_PX[0] * Math.sin(a);
      if (x > VIEW.x0 + 24 && x < VIEW.x1 - 24 && y > VIEW.y0 + 24 && y < VIEW.y1 - 24) out.push({ x, y, k });
    }
    return out;
  })();
  const flashSat3 = io(g, [T.fourth, T.fourth + 6], [0, 1]) * (1 - io(g, [T.fourth + 6, T.fourth + 20], [0, 1]));
  const fixO = io(g, [592, 600], [0, 1]) * (1 - io(g, [598, 608], [0, 1]));
  const finO = io(g, [T.fin, T.fin + 10], [0, 1]) * (1 - io(g, [698, 710], [0, 1]));
  const heroFlash = io(g, [666, 672], [0, 1]) * (1 - io(g, [672, 690], [0, 1]));
  const dimSats = hero ? 1 : 1;
  void dimSats; void tHook; void flashSat3; void fixO; void heroFlash;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <clipPath id="vp"><rect x={VIEW.x0} y={VIEW.y0} width={VIEW.x1 - VIEW.x0} height={VIEW.y1 - VIEW.y0} /></clipPath>
        </defs>
        {/* the drawing window */}
        {[[VIEW.x0, VIEW.y0, 1, 1], [VIEW.x1, VIEW.y0, -1, 1], [VIEW.x0, VIEW.y1, 1, -1], [VIEW.x1, VIEW.y1, -1, -1]].map(([x, y, sx, sy], k) => (
          <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={K.lineDim} strokeWidth={2.4} />
        ))}
        <rect x={VIEW.x0} y={VIEW.y0} width={VIEW.x1 - VIEW.x0} height={VIEW.y1 - VIEW.y0} fill="rgba(3,11,24,0.32)" stroke="rgba(92,211,255,0.10)" strokeWidth={1.5} />

        <g clipPath="url(#vp)">
          {/* faint range rings around the phone */}
          {[150, 300, 450].map((r) => <circle key={r} cx={PHONE.x} cy={PHONE.y} r={r} fill="none" stroke="rgba(110,180,255,0.07)" strokeWidth={1.6} strokeDasharray="4 12" />)}
          <line x1={PHONE.x} y1={VIEW.y0} x2={PHONE.x} y2={VIEW.y1} stroke="rgba(110,180,255,0.07)" strokeWidth={1.5} />
          <line x1={VIEW.x0} y1={PHONE.y} x2={VIEW.x1} y2={PHONE.y} stroke="rgba(110,180,255,0.07)" strokeWidth={1.5} />
          {/* circles */}
          <g opacity={co}>
            {[0, 1, 2, 3].map((i) => <Circle key={i} i={i} r={R[i]} o={i < 3 || g >= 520 ? 1 : 0} />)}
          </g>
          {/* waves */}
          <Waves g={g} o={wavesO} speed={g >= 601 ? 3.6 : 2.6} />
          {/* misfit polygon + points */}
          {showPoly && (
            <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={RED} fillOpacity={0.2 * io(g, [450, 470], [0, 1])} stroke={RED} strokeWidth={3} strokeDasharray="8 6" opacity={io(g, [450, 470], [0, 1])} />
          )}
          {pts.map((p, k) => <circle key={k} cx={p.x} cy={p.y} r={8} fill={RED} stroke={K.bgDeep} strokeWidth={2.5} opacity={co} />)}
          {/* candidate positions on circle 1 */}
          {cand.map(({ x, y, k }) => {
            const at = 262 + Math.abs(k) * 4 + (k > 0 ? 2 : 0);
            const p = ioB(g, at, at + 10) * (1 - io(g, [300, 308], [0, 1]));
            return (
              <g key={k} transform={`translate(${x} ${y}) scale(${p})`}>
                <circle r={10} fill={K.bgDeep} stroke={K.line} strokeWidth={3} />
                <circle r={3.6} fill={K.line} />
              </g>
            );
          })}
          {/* ghost point (second intersection of circles 1 & 2) */}
          {showGhost && (
            <g transform={`translate(${GHOST.x} ${GHOST.y})`} opacity={ghostO}>
              <circle r={16 + 4 * Math.sin(g * 0.4)} fill="none" stroke={g > T.three + 8 ? RED : K.text} strokeWidth={3} />
              <circle r={7} fill={g > T.three + 8 ? RED : K.text} />
              {g > T.three + 14 && (
                <g stroke={RED} strokeWidth={5} strokeLinecap="round" opacity={io(g, [T.three + 14, T.three + 22], [0, 1])}>
                  <line x1={-26} y1={-26} x2={26} y2={26} /><line x1={26} y1={-26} x2={-26} y2={26} />
                </g>
              )}
            </g>
          )}
        </g>

        {/* lines + waves-in-flight + satellites (not clipped: icons sit inside the window anyway) */}
        {[0, 1, 2, 3].map((i) => <Dashed key={i} i={i} o={lineO(i) * (g >= T.light + 49 ? 0.5 : 1)} />)}
        {g >= T.sats - 2 && g < T.light && [0, 1, 2, 3].map((i) => (
          <Broadcast key={i} g={g} i={i} o={io(g, [T.sats + 2 + i * 4, T.sats + 10 + i * 4], [0, 1]) * (1 - io(g, [T.light - 12, T.light - 4], [0, 1]))} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <SatIcon key={i} i={i} o={satO(g, i) * (i === 3 && g >= T.fourth && g < T.fourth + 12 ? io(g, [T.fourth, T.fourth + 8], [0.28, 1]) / Math.max(satO(g, i), 0.28) : 1)} pulse={i === 3 ? flashSat3 : 0} />
        ))}

        {/* light scene: the packet and the 21,000 km dimension */}
        {g >= T.light + 3 && g < T.one + 6 && (
          <g opacity={1 - io(g, [T.one, T.one + 6], [0, 1])}>
            <g opacity={tx0 < 1 ? 1 : 0}>
              <circle cx={pk.x} cy={pk.y} r={18} fill={AMBER} opacity={0.22} />
              <circle cx={pk.x} cy={pk.y} r={9} fill={AMBER} />
              {[1, 2, 3, 4].map((k) => <circle key={k} cx={pk.x - Math.cos(b0) * k * 14 * tx0} cy={pk.y - Math.sin(b0) * k * 14 * tx0} r={7 - k} fill={AMBER} opacity={0.5 - k * 0.1} />)}
            </g>
            {g >= T.light + 54 && (() => {
              const nx = -Math.sin(b0) * 44, ny = Math.cos(b0) * 44;
              const a = { x: SATS[0].x + Math.cos(b0) * 66 + nx, y: SATS[0].y + Math.sin(b0) * 66 + ny };
              const b = { x: PHONE.x - Math.cos(b0) * 52 + nx, y: PHONE.y - Math.sin(b0) * 52 + ny };
              const p = io(g, [T.light + 54, T.light + 70], [0, 1]);
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              return (
                <g opacity={p}>
                  <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * p} y2={a.y + (b.y - a.y) * p} stroke={GREEN} strokeWidth={3} />
                  <line x1={a.x - nx * 0.25} y1={a.y - ny * 0.25} x2={a.x + nx * 0.25} y2={a.y + ny * 0.25} stroke={GREEN} strokeWidth={3} />
                  <line x1={b.x - nx * 0.25} y1={b.y - ny * 0.25} x2={b.x + nx * 0.25} y2={b.y + ny * 0.25} stroke={GREEN} strokeWidth={3} />
                  <text transform={`translate(${mx + nx * 0.55} ${my + ny * 0.55}) rotate(${(b0 * 180) / Math.PI})`} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={26} fill={GREEN}>{fmt(RANGE_KM[0])} km</text>
                </g>
              );
            })()}
          </g>
        )}

        {/* inward "shrink" arrows on every circle while the fourth satellite fixes the clock */}
        {g >= 552 && g < 596 && [0, 1, 2, 3].map((i) => {
          const rr = R[i];
          const offs = [1.1, -1.1, 1.5, -1.5, 0.8, -0.8, 1.9, -1.9, 2.3, -2.3];
          const bb = bearing(i);
          const off = offs.find((o) => {
            const x = SATS[i].x + Math.cos(bb + o) * rr, y = SATS[i].y + Math.sin(bb + o) * rr;
            return x > VIEW.x0 + 70 && x < VIEW.x1 - 70 && y > VIEW.y0 + 70 && y < VIEW.y1 - 80 && Math.hypot(x - PHONE.x, y - PHONE.y) > 150;
          }) ?? 1.1;
          const ang = bb + off, ux = Math.cos(ang), uy = Math.sin(ang);
          const sx = SATS[i].x + ux * (rr + 4), sy = SATS[i].y + uy * (rr + 4);
          const L = 52, ex = SATS[i].x + ux * (rr + 4 - L), ey = SATS[i].y + uy * (rr + 4 - L);
          const o = io(g, [552, 560], [0, 1]) * (1 - io(g, [586, 594], [0, 1]));
          return (
            <g key={i} opacity={o}>
              <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={AMBER} strokeWidth={5} strokeLinecap="round" />
              <path d={`M ${ex} ${ey} l ${ux * 2 - uy * 13} ${uy * 2 + ux * 13} l ${uy * 26} ${-ux * 26} Z`} fill={AMBER} />
            </g>
          );
        })}

        <PhoneMark g={g} iconO={phoneO} ringO={finO} />

        {/* fix pin */}
        {finO > 0.01 && (
          <g transform={`translate(${PHONE.x} ${PHONE.y - 16}) scale(${0.9 + 0.1 * ioB(g, T.fin, T.fin + 14)})`} opacity={finO}>
            <path d="M 0 0 C -16 -24 -26 -38 -26 -52 A 26 26 0 1 1 26 -52 C 26 -38 16 -24 0 0 Z" fill={AMBER} stroke={K.bgDeep} strokeWidth={3} />
            <circle cy={-52} r={10} fill={K.bgDeep} />
          </g>
        )}
        {/* "you are here" window label */}
      </svg>

      {/* tags in the window */}
      <Label f={g} at={-30} text={bias > 1 && g < 598 ? "CLOCK ERROR EXAGGERATED" : "TOP-DOWN 2D SLICE"} x={VIEW.x0 + 22} y={VIEW.y1 - 40} size={18} color={bias > 1 && g < 598 ? RED : K.muted} />

      {/* hook */}
      <Tag f={g} at={-30} text="RECEIVE ONLY" x={366} y={1092} color={GREEN} size={22} out={T.sats} />
      <Tag f={g} at={66} text="NO SIGNAL SENT" x={316} y={1146} color={RED} size={22} out={T.sats} />
      {/* satellites beat: each one stamps its send time */}
      {[
        { i: 0, x: 268, y: 806 },
        { i: 1, x: 835, y: 786 },
        { i: 2, x: 770, y: 1333 },
        { i: 3, x: 800, y: 1236 },
      ].map(({ i, x, y }) => (
        <Tag key={i} f={g} at={T.sats + 6 + i * 6} text="SENT 12:00:00.000" x={x} y={y} color={SC[i]} size={20} out={T.light - 8} />
      ))}
      <Label f={g} at={T.sats + 38} text="SATELLITE CLOCKS: ATOMIC" x={VIEW.x1 - 22} y={VIEW.y0 + 22} size={18} align="right" color={K.muted} out={T.light - 8} />
      {/* circle scenes */}
      <Tag f={g} at={T.one + 24} text="SOMEWHERE ON THIS CIRCLE" x={246} y={1236} color={SC[0]} size={20} out={T.two + 4} />
      <Tag f={g} at={T.two + 24} text="OR HERE?" x={GHOST.x + 150} y={GHOST.y - 40} color={K.text} size={22} out={T.three + 20} />
      <Tag f={g} at={T.two + 30} text="YOU" x={PHONE.x + 78} y={PHONE.y - 60} color={AMBER} solid size={22} out={T.catch} />
      <Tag f={g} at={T.three + 20} text="RULED OUT" x={GHOST.x + 150} y={GHOST.y - 40} color={RED} size={22} out={T.three + 32} />
      <Tag f={g} at={T.three + 10} text="ONE POINT" x={PHONE.x - 190} y={PHONE.y + 70} color={GREEN} solid size={24} out={T.catch + 2} />
      {/* catch + fourth */}
      <Tag f={g} at={470} text="NO SINGLE POINT" x={316} y={PHONE.y + 130} color={RED} solid size={24} out={534} />
      <Tag f={g} at={T.fourth + 10} text="SAME SHRINK ON ALL" x={PHONE.x + 40} y={VIEW.y0 + 58} color={AMBER} size={22} out={594} />
      <Tag f={g} at={594} text="CLOCK FIXED" x={PHONE.x - 190} y={PHONE.y + 100} color={GREEN} solid size={26} out={604} />
      {/* hero chips */}
      <Tag f={g} at={604} text="LISTEN" x={540} y={1480} color={K.line} solid size={28} out={624} />
      <Tag f={g} at={629} text="MEASURE" x={540} y={1480} color={SC[2]} solid size={28} out={648} />
      <Tag f={g} at={653} text="INTERSECT" x={540} y={1480} color={AMBER} solid size={28} out={673} />
      <Tag f={g} at={677} text="FIX LOCKED" x={540} y={1456} color={GREEN} solid size={28} />
      <Label f={g} at={684} text="4 SATELLITES · 4 CIRCLES · 1 POINT" x={540} y={1510} size={22} align="center" color={K.text} />

      {/* hook panel */}
      <Panel o={io(g, [-30, -29], [1, 1]) * (1 - io(g, [T.sats - 6, T.sats + 2], [0, 1]))} h={92}>
        <Row size={26} color={K.muted}><Hl c={GREEN}>SATELLITE → PHONE</Hl><span>signal</span><span style={{ opacity: 0.4 }}>|</span><Hl c={RED}>PHONE → SATELLITE</Hl><span>nothing</span></Row>
      </Panel>
      {/* sats panel */}
      <Panel o={io(g, [T.sats + 2, T.sats + 12], [0, 1]) * (1 - io(g, [T.light - 8, T.light], [0, 1]))} h={92}>
        <Row size={28} color={K.text}><span style={{ color: K.muted }}>EVERY SIGNAL CARRIES ITS</span><Hl c={AMBER}>SEND TIME</Hl></Row>
      </Panel>
      {/* light panel */}
      <Panel o={io(g, [T.light + 2, T.light + 10], [0, 1]) * (1 - io(g, [T.one, T.one + 6], [0, 1]))} h={118}>
        <Row size={26} color={K.muted} justify="flex-start"><span>LIGHT SPEED</span><Hl c={AMBER}>c = {fmt(C_KM_S)} km/s</Hl></Row>
        <Row size={36} color={K.text}>
          <Hl c={AMBER}>{fmt(DELAY_MS[0] * tx0, 2)} ms</Hl>
          <span style={{ opacity: io(g, [T.light + 49, T.light + 53], [0, 1]) }}>× c =</span>
          <span style={{ opacity: io(g, [T.light + 52, T.light + 56], [0, 1]), color: GREEN, fontWeight: 700 }}>{fmt(RANGE_KM[0] * io(g, [T.light + 52, T.light + 66], [0, 1]))} km</span>
        </Row>
      </Panel>
      {/* one / two / three panel */}
      <Panel o={io(g, [T.one + 6, T.one + 16], [0, 1]) * (1 - io(g, [T.catch - 2, T.catch + 6], [0, 1]))} h={92}>
        <Row size={30} color={K.text}>
          <span style={{ color: K.muted }}>{g < T.two ? "POSSIBLE POSITIONS" : g < T.three ? "POSSIBLE POSITIONS" : "POSSIBLE POSITIONS"}</span>
          <Hl c={g < T.two ? SC[0] : g < T.three ? K.text : GREEN}>{g < T.two ? "A CIRCLE" : g < T.three ? "2 POINTS" : "1 POINT"}</Hl>
          <span style={{ color: K.muted, fontSize: 22 }}>{g < T.two ? "(3D: A SPHERE)" : ""}</span>
        </Row>
      </Panel>
      {/* catch panel 1: the cheap clock */}
      <Panel o={io(g, [T.catch + 4, T.catch + 12], [0, 1]) * (1 - io(g, [428, 436], [0, 1]))} h={112}>
        <Row size={28} color={K.text} justify="flex-start"><span style={{ width: 96 }} /><Hl c={RED}>PHONE CLOCK</Hl><span style={{ color: K.muted }}>cheap quartz</span></Row>
        <Row size={28} color={K.text} justify="flex-start"><span style={{ width: 96 }} /><Hl c={GREEN}>SATELLITE CLOCK</Hl><span style={{ color: K.muted }}>atomic</span></Row>
      </Panel>
      {g >= T.catch && g < 436 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: io(g, [T.catch + 4, T.catch + 12], [0, 1]) * (1 - io(g, [428, 436], [0, 1])) }}>
          <Clock g={g} x={150} y={1483} r={34} wobble={io(g, [396, 410], [0, 1])} />
        </svg>
      )}
      {/* catch panel 2: 1 µs = 300 m */}
      <Panel o={io(g, [434, 444], [0, 1]) * (1 - io(g, [T.fourth - 4, T.fourth + 4], [0, 1]))} h={118}>
        <Row size={26} color={K.muted} justify="flex-start"><span>CLOCK ERROR</span><Hl c={RED}>1 µs</Hl><span>= 0.000001 s</span></Row>
        <Row size={36} color={K.text}>
          <span style={{ opacity: io(g, [446, 452], [0, 1]) }}>1 µs × c =</span>
          <Hl c={RED}>{fmt(ONE_US_M * io(g, [452, 480], [0, 1]))} m</Hl>
        </Row>
      </Panel>
      {/* fourth panel */}
      <Panel o={io(g, [T.fourth + 2, T.fourth + 12], [0, 1]) * (1 - io(g, [598, 606], [0, 1]))} h={118}>
        <Row size={24} color={K.muted}><span>x · y · z · TIME</span><Hl c={AMBER}>= 4 UNKNOWNS = 4 SATELLITES</Hl></Row>
        <Meter ratio={mis / MIS0} g={g} />
      </Panel>
      {/* fin panel (tags above handle the text) */}
    </div>
  );
};

const Meter: React.FC<{ ratio: number; g: number }> = ({ ratio, g }) => {
  const v = g < 548 ? 1 : clamp01(ratio);
  const done = v < 0.02 && g > 586;
  const col = done ? GREEN : RED;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: K.mono, fontSize: 24, letterSpacing: 2, color: K.muted, fontWeight: 600 }}>
      <span style={{ width: 150 }}>MISFIT</span>
      <div style={{ flex: 1, height: 22, borderRadius: 4, border: `2px solid ${K.lineDim}`, padding: 3, background: "rgba(3,11,24,0.6)" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", borderRadius: 2, background: `repeating-linear-gradient(90deg, ${col} 0 12px, transparent 12px 16px)`, boxShadow: `0 0 14px ${col}88` }} />
      </div>
      <span style={{ width: 90, textAlign: "right", color: col, fontWeight: 700 }}>{done ? "0" : fmt(v * 100)}%</span>
    </div>
  );
};

export const GpsShot: React.FC = () => {
  const g = useCurrentFrame();
  const fade = io(g, [698, 710], [0, 1]);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      {/* headlines */}
      <Headline f={g} lines={["GPS doesn't", "*track* you"]} at={-30} exitAt={52} size={108} />
      <Headline f={g} lines={["Your phone", "only *listens*"]} at={66} exitAt={102} size={100} />
      <Headline f={g} lines={["Each satellite", "sends the *time*"]} at={112} exitAt={178} size={92} />
      <Headline f={g} lines={["Delay × light", "= *distance*"]} at={190} exitAt={244} size={92} />
      <Headline f={g} lines={["One distance =", "one *circle*"]} at={255} exitAt={294} size={90} />
      <Headline f={g} lines={["Two circles =", "*two* spots"]} at={305} exitAt={340} size={90} />
      <Headline f={g} lines={["Three circles =", "*one* spot"]} at={350} exitAt={374} size={90} />
      <Headline f={g} lines={["Phone clocks", "are *cheap*"]} at={383} exitAt={426} size={92} accent={RED} />
      <Headline f={g} lines={["1 µs off =", "*300 m* off"]} at={434} exitAt={514} size={92} accent={RED} />
      <Headline f={g} lines={["Shrink every", "circle *equally*"]} at={524} exitAt={596} size={90} accent={GREEN} />
      <Headline f={g} lines={["*Listen.*"]} at={603} exitAt={620} size={118} />
      <Headline f={g} lines={["*Measure.*"]} at={628} exitAt={645} size={118} accent={SC[2]} />
      <Headline f={g} lines={["*Intersect.*"]} at={652} exitAt={670} size={118} />
      <Headline f={g} lines={["That's *GPS*"]} at={676} exitAt={703} size={140} accent={GREEN} />
      <Stage g={g} />
    </div>
  );
};

/* ────────── end card (same as #9) ────────── */
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
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.amber }}>HOW IT WORKS · 10</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 116, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>GPS doesn't</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: AMBER }}>track you</div>
    </div>
    <Stage g={26} />
  </>
);

export { easeInOut, easeOut, BIAS_PX, PSEUDO_PX, dist, Readout };
