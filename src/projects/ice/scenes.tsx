import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Tag, clamp01, ioB, meshPhase, W, H } from "../gearbox/kit";
import {
  ANG, BONDS, BOX, EXPAND, ICE_PTS, KIND, LB, MolState, N, NEI, OH, RH, RHO_ICE, RHO_WATER, RINGS, RO, SEED, SUBMERGED, ABOVE,
  T_LOCK, TEMP, Y_LIQ, dist, freezeFrac, hPos, molAt, ICE_A1, SIGMA,
} from "./physics";

/**
 * HOW IT WORKS #11 — WHY ICE FLOATS            30 s · 1080×1920 · 30 fps · frame 0 is a finished hook
 *
 * PLAN (global frames; VO phrases from public/projects/ice/vo.json)
 *   0   hook    two beakers: a typical solid SINKS in its own liquid, ice FLOATS (917 < 1000 kg/m³). 65 "Water grows" → +9 % tag
 *   96  liquid  zoom into the water: 45-odd H₂O (O + 2 H at 104.5°) tumbling, flickering H-bonds, thermometer 20 → 0 °C
 *   209 lock    0 °C: a crystal nucleates mid-box and grows outward; molecules snap into place; the 4-bond callout on the seed molecule
 *   304 ring    hexagonal Ih lattice: rings light up one by one, an empty hexagon in each; O···O 2.76 Å; level rises +9 %
 *   386 vol     same mass, two jars: water 1.00 L vs ice 1.09 L (to scale); ρ = 1 kg / 1.09 L = 917 kg/m³
 *   515 float   cube drops in, bobs, settles: 92 % below / 8 % above, computed from 917 / 1000; weight = buoyancy
 *   587 lake    winter lake: water is densest at 4 °C, so the cold stays on top, ice forms from the top, fish live below
 *   671 hero    "Open rings." (ring) · "Less density." (1000 vs 917 bars) · "Ice floats." (cube + flash)
 *   771 end     Follow-for-more end card, same as #10
 *
 * Everything is a pure function of the frame; geometry/physics live in physics.ts.
 */

/** Global frames from public/projects/ice/vo.json. Keep in sync with soundtrack.py. */
export const T = { liquid: 96, lock: 209, ring: 304, vol: 386, float: 515, lake: 587, hero: 671, end: 771, total: 900 };
export const CUTS = [0, 96, 209, 304, 386, 515, 587, 671, 771];

const AMBER = K.amber, GREEN = K.green, RED = K.red;
const WATER = K.line, ICE = "#CDEBFF", SOLID = "#8EA8FF";
const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };
const sm = (t: number) => { const c = clamp01(t); return c * c * (3 - 2 * c); };

/* ───────────────────────── tiny shared bits ───────────────────────── */
const Panel: React.FC<{ o: number; children: React.ReactNode; h?: number }> = ({ o, children, h = 118 }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1424, height: h, opacity: o, borderRadius: 10, border: `2px solid ${K.lineDim}`, background: "rgba(3,11,24,0.78)", boxSizing: "border-box", padding: "14px 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
    {children}
  </div>
);
const Row: React.FC<{ children: React.ReactNode; size?: number; color?: string; justify?: string }> = ({ children, size = 30, color = K.muted, justify = "center" }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: justify, gap: 14, fontFamily: K.mono, fontSize: size, letterSpacing: size * 0.06, color, whiteSpace: "nowrap", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{children}</div>
);
const Hl: React.FC<{ c: string; children: React.ReactNode }> = ({ c, children }) => <span style={{ color: c, fontWeight: 700 }}>{children}</span>;

const Frame: React.FC<{ o?: number }> = ({ o = 1 }) => (
  <g opacity={o}>
    {[[VIEW.x0, VIEW.y0, 1, 1], [VIEW.x1, VIEW.y0, -1, 1], [VIEW.x0, VIEW.y1, 1, -1], [VIEW.x1, VIEW.y1, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={K.lineDim} strokeWidth={2.4} />
    ))}
    <rect x={VIEW.x0} y={VIEW.y0} width={VIEW.x1 - VIEW.x0} height={VIEW.y1 - VIEW.y0} fill="rgba(3,11,24,0.32)" stroke="rgba(92,211,255,0.10)" strokeWidth={1.5} />
  </g>
);

const hexPts = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, k) => { const a = ((-90 + 60 * k) * Math.PI) / 180; return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`; }).join(" ");
/** honeycomb texture used for "ice" fills (a hint of the lattice) */
const HexDefs: React.FC = () => {
  const r = 16, w = Math.sqrt(3) * r;
  return (
    <defs>
      <pattern id="hexp" width={w} height={3 * r} patternUnits="userSpaceOnUse">
        {[[w / 2, r], [0, 2.5 * r], [w, 2.5 * r], [0, -0.5 * r], [w, -0.5 * r]].map(([x, y], k) => <polygon key={k} points={hexPts(x, y, r)} fill="none" stroke="rgba(234,244,255,0.5)" strokeWidth={1.6} />)}
      </pattern>
    </defs>
  );
};

/* ───────────────────────── the H₂O molecule ───────────────────────── */
const Molecule: React.FC<{ m: MolState; hi?: number; sc?: number; dim?: number }> = ({ m, hi = 0, sc = 1, dim = 1 }) => {
  const h1 = { x: OH * Math.cos(m.a1), y: OH * Math.sin(m.a1) };
  const l2 = OH * m.f2;
  const h2 = { x: l2 * Math.cos(m.a2), y: l2 * Math.sin(m.a2) };
  const foreshort = m.f2 < 0.9;
  return (
    <g transform={`translate(${m.x} ${m.y}) scale(${sc})`} opacity={dim}>
      <line x1={0} y1={0} x2={h1.x} y2={h1.y} stroke={K.text} strokeWidth={4.5} strokeLinecap="round" opacity={0.75} />
      <circle cx={h1.x} cy={h1.y} r={RH} fill={K.bgDeep} stroke={K.text} strokeWidth={2.6} />
      <circle r={RO + 2} fill={K.bgDeep} />
      <circle r={RO} fill={WATER} fillOpacity={0.24} stroke={hi > 0.5 ? AMBER : WATER} strokeWidth={hi > 0.5 ? 4.6 : 3.4} />
      {hi > 0.5 && <circle r={RO + 12} fill="none" stroke={AMBER} strokeWidth={2} opacity={0.45 * hi} />}
      {!foreshort && <line x1={0} y1={0} x2={h2.x} y2={h2.y} stroke={K.text} strokeWidth={4.5} strokeLinecap="round" opacity={0.75} />}
      <circle cx={h2.x} cy={h2.y} r={RH * (foreshort ? 0.9 : 1)} fill={K.bgDeep} stroke={K.text} strokeWidth={2.6} />
    </g>
  );
};

/** dashed hydrogen bond from an H to the O it points at */
const HBond: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; o?: number; w?: number; sc?: number }> = ({ a, b, o = 1, w = 3, sc = 1 }) => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
  const s = RH * sc + 2, e = RO * sc + 3;
  if (d < s + e + 6) return null;
  return <line x1={a.x + ux * s} y1={a.y + uy * s} x2={b.x - ux * e} y2={b.y - uy * e} stroke={AMBER} strokeWidth={w} strokeDasharray="7 6" strokeLinecap="round" opacity={o} />;
};

/* ───────────────────────── scene 0: the hook — solid sinks, ice floats ───────────────────────── */
const Beaker: React.FC<{ cx: number; g: number; tint: string; glow?: number; children?: React.ReactNode }> = ({ cx, g, tint, glow = 0, children }) => {
  const w = 340, x0 = cx - w / 2, x1 = cx + w / 2, y0 = 800, y1 = 1318, yS = 890;
  const wave = Array.from({ length: 29 }, (_, k) => { const t = k / 28; return `${x0 + 3 + t * (w - 6)} ${yS + 3.2 * Math.sin(t * 14 + g * 0.22)}`; });
  const glass = `M ${x0} ${y0} L ${x0} ${y1 - 18} Q ${x0} ${y1} ${x0 + 18} ${y1} L ${x1 - 18} ${y1} Q ${x1} ${y1} ${x1} ${y1 - 18} L ${x1} ${y0}`;
  const body = `M ${x0 + 3} ${yS} L ${x0 + 3} ${y1 - 17} Q ${x0 + 3} ${y1 - 3} ${x0 + 19} ${y1 - 3} L ${x1 - 19} ${y1 - 3} Q ${x1 - 3} ${y1 - 3} ${x1 - 3} ${y1 - 17} L ${x1 - 3} ${yS} Z`;
  return (
    <g>
      {glow > 0.01 && <rect x={x0 - 24} y={y0 - 24} width={w + 48} height={y1 - y0 + 48} rx={30} fill={AMBER} opacity={0.1 * glow} style={{ filter: "blur(22px)" }} />}
      <path d={body} fill={tint} fillOpacity={0.12} />
      <path d={"M " + wave.join(" L ")} fill="none" stroke={tint} strokeWidth={4} strokeLinecap="round" />
      {children}
      <path d={glass} fill="none" stroke={K.text} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={x0} y1={y1 - t * (y1 - y0)} x2={x0 + 16} y2={y1 - t * (y1 - y0)} stroke={K.lineDim} strokeWidth={2.4} />)}
    </g>
  );
};

const HookScene: React.FC<{ g: number }> = ({ g }) => {
  const S = 100, yS = 890, floorY = 1318 - 4;
  // left: the solid falls through its own liquid and rests on the bottom
  const fall = io(g, [-34, 38], [0, 1], easeOut);
  const bTop = yS - 150 + (floorY - S - (yS - 150)) * fall;
  const thud = g > 38 && g < 52 ? 3 * Math.sin((g - 38) * 1.4) * (1 - (g - 38) / 14) : 0;
  const falling = g < 38;
  // right: the ice cube floats with 8 % above the surface
  const bob = 4.2 * Math.sin(g * 0.11) + 2.2 * Math.sin(g * 0.27 + 1);
  const cTop = yS - ABOVE * S + bob + io(g, [-34, -10], [-120, 0], easeOut);
  const pop = ioB(g, 64, 78);
  const glow = io(g, [60, 76], [0, 1]);
  return (
    <g>
      {/* left beaker: any other substance */}
      <Beaker cx={300} g={g} tint={SOLID}>
        <g transform={`translate(0 ${thud})`}>
          {falling && [0, 1, 2].map((k) => <line key={k} x1={262 + k * 38} y1={bTop - 40 - k * 6} x2={262 + k * 38} y2={bTop - 8} stroke={SOLID} strokeWidth={3} opacity={0.4 * (1 - fall)} strokeLinecap="round" />)}
          <rect x={250} y={bTop} width={S} height={S} rx={6} fill={SOLID} fillOpacity={0.3} stroke={SOLID} strokeWidth={4.5} />
          <line x1={250} y1={bTop} x2={350} y2={bTop + S} stroke={SOLID} strokeWidth={2} opacity={0.5} />
          <line x1={350} y1={bTop} x2={250} y2={bTop + S} stroke={SOLID} strokeWidth={2} opacity={0.5} />
        </g>
      </Beaker>
      {/* right beaker: water */}
      <Beaker cx={780} g={g} tint={WATER} glow={glow}>
        <g>
          <rect x={730} y={cTop} width={S} height={S} rx={6} fill={ICE} fillOpacity={0.35} stroke={ICE} strokeWidth={4.5} />
          <rect x={730} y={cTop} width={S} height={S} rx={6} fill="url(#hexp)" opacity={0.7} />
          <path d={`M 738 ${cTop + 10} L 738 ${cTop + 34}`} stroke={K.text} strokeWidth={3.5} strokeLinecap="round" opacity={0.65} />
        </g>
      </Beaker>
      {/* water line marker on the cube */}
      <line x1={690} y1={yS} x2={870} y2={yS} stroke={WATER} strokeWidth={1.6} strokeDasharray="4 8" opacity={0.5} />
      <g transform={`translate(780 ${742}) scale(${0.55 + 0.45 * pop})`} opacity={clamp01(pop)}>
        <rect x={-150} y={-32} width={300} height={64} rx={32} fill={AMBER} />
        <text y={11} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={32} letterSpacing={1} fill={K.bgDeep}>+9 % VOLUME</text>
      </g>
      <text x={300} y={742} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={34} fill={SOLID} opacity={0.9 * io(g, [-30, -20], [0, 1])} letterSpacing={2}>SHRINKS</text>
    </g>
  );
};

/* ───────────────────────── scenes 1–3: the molecule box ───────────────────────── */
/** hexagonal ring highlight sequence during the ring beat */
const ringGlow = (g: number, k: number) => {
  const at = 312 + k * 6;
  return io(g, [at, at + 6], [0, 1]) * (1 - io(g, [at + 18, at + 28], [0, 1]) * (k < 11 ? 1 : 0));
};

const IceBox: React.FC<{ g: number }> = ({ g }) => {
  const fz = freezeFrac(g);
  const surf = Y_LIQ + (BOX.yTop - Y_LIQ) * sm(fz);
  const wave = Array.from({ length: 36 }, (_, k) => { const t = k / 35; return `${BOX.x0 + 3 + t * (BOX.x1 - BOX.x0 - 6)} ${surf + (1 - sm(fz * 1.2)) * 4 * Math.sin(t * 16 + g * 0.25)}`; });
  const st = Array.from({ length: N }, (_, i) => molAt(i, g));
  const locked = (i: number) => st[i].s;
  const T = TEMP(g);
  // flickering H-bonds in the liquid (geometry-driven: an H that points at a close neighbour's O)
  const liq: { a: { x: number; y: number }; b: { x: number; y: number }; o: number }[] = [];
  const liqO = (1 - sm(fz * 3)) * io(g, [100, 112], [0, 1]);
  if (liqO > 0.02) {
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const dx = st[j].x - st[i].x, dy = st[j].y - st[i].y, d = Math.hypot(dx, dy);
      if (d > 118) continue;
      let best: 0 | 1 = 0, bd = 9;
      ([0, 1] as const).forEach((h) => { const a = h === 0 ? st[i].a1 : st[i].a2; let df = Math.abs(((a - Math.atan2(dy, dx) + Math.PI * 3) % (Math.PI * 2)) - Math.PI); df = Math.abs(Math.PI - df); if (df < bd) { bd = df; best = h; } });
      if (bd < 0.4) liq.push({ a: hPos(st[i], best), b: st[j], o: liqO * (1 - bd / 0.4) });
    }
  }
  const hiA = clamp01((g - 238) / 6);
  const nei = NEI[SEED];
  const four = io(g, [258, 266], [0, 1]) * (1 - io(g, [300, 308], [0, 1]));
  const showLvl = io(g, [FREEZE0_UI, FREEZE0_UI + 8], [0, 1]);
  return (
    <g>
      {/* container */}
      <rect x={BOX.x0} y={surf} width={BOX.x1 - BOX.x0} height={BOX.yBot - surf} fill={fz > 0.5 ? ICE : WATER} fillOpacity={fz > 0.5 ? 0.06 : 0.09} />
      <path d={"M " + wave.join(" L ")} fill="none" stroke={fz > 0.6 ? ICE : WATER} strokeWidth={4} strokeLinecap="round" />
      <path d={`M ${BOX.x0} ${BOX.yTop - 18} L ${BOX.x0} ${BOX.yBot} L ${BOX.x1} ${BOX.yBot} L ${BOX.x1} ${BOX.yTop - 18}`} fill="none" stroke={K.text} strokeWidth={5} strokeLinejoin="round" opacity={0.85} />
      {/* old liquid level */}
      <g opacity={showLvl * (g < 395 ? 1 : 0)}>
        <line x1={BOX.x0 + 6} y1={Y_LIQ} x2={BOX.x1 - 6} y2={Y_LIQ} stroke={WATER} strokeWidth={2} strokeDasharray="10 9" opacity={0.7} />
      </g>
      {/* bonds */}
      {liq.map((b, k) => <HBond key={k} a={b.a} b={b.b} o={b.o * 0.9} w={3} />)}
      {BONDS.map((b, k) => {
        const o = Math.min(locked(b.i), locked(b.j));
        if (o < 0.55) return null;
        const hp = hPos(st[b.i], b.h);
        return <HBond key={k} a={hp} b={st[b.j]} o={clamp01((o - 0.55) / 0.45)} w={3.2} />;
      })}
      {/* ring voids (ring beat) */}
      {RINGS.map((r, k) => {
        const o = ringGlow(g, k);
        if (o < 0.01 || g < 304) return null;
        return (
          <g key={k} opacity={o}>
            <polygon points={r.v.map((v) => `${ICE_PTS[v].x},${ICE_PTS[v].y}`).join(" ")} fill={AMBER} fillOpacity={0.1} stroke={AMBER} strokeWidth={3.4} strokeLinejoin="round" />
            <circle cx={r.c.x} cy={r.c.y} r={LB - RO - 16} fill="none" stroke={AMBER} strokeWidth={2} strokeDasharray="3 9" opacity={0.8} />
          </g>
        );
      })}
      {/* molecules */}
      {st.map((m, i) => <Molecule key={i} m={m} hi={i === SEED ? hiA : 0} />)}
      {/* 4 bonds callout on the seed molecule */}
      <g opacity={four}>
        {nei.map((j, k) => {
          const a = ICE_PTS[SEED], b = ICE_PTS[j], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const p = ioB(g, 260 + k * 7, 272 + k * 7);
          return (
            <g key={j} transform={`translate(${mx} ${my}) scale(${p})`}>
              <circle r={17} fill={AMBER} /><text y={7} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={22} fill={K.bgDeep}>{k + 1}</text>
            </g>
          );
        })}
        {(() => {
          const a = ICE_PTS[SEED], p = ioB(g, 281, 293);
          return (
            <g transform={`translate(${a.x + 38} ${a.y - 40}) scale(${p})`}>
              <circle r={17} fill={AMBER} /><text y={7} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={22} fill={K.bgDeep}>4</text>
              <circle cx={0} cy={0} r={26} fill="none" stroke={AMBER} strokeWidth={2.4} strokeDasharray="4 5" />
            </g>
          );
        })()}
      </g>
      {/* level arrows (ring beat → volume beat) */}
      {(() => {
        const o = io(g, [352, 362], [0, 1]) * (1 - io(g, [380, 388], [0, 1]));
        const x = BOX.x1 - 20;
        return (
          <g opacity={o}>
            <line x1={x} y1={Y_LIQ + 6} x2={x} y2={BOX.yTop + 8} stroke={AMBER} strokeWidth={4} />
            <path d={`M ${x} ${BOX.yTop - 2} l -9 16 l 18 0 Z`} fill={AMBER} />
            <g transform={`translate(${x - 110} ${BOX.yTop - 36})`}><rect x={-76} y={-24} width={152} height={48} rx={24} fill={AMBER} /><text y={10} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={30} letterSpacing={1} fill={K.bgDeep}>+9 %</text></g>
            <line x1={BOX.x0 + 6} y1={BOX.yTop} x2={BOX.x1 - 6} y2={BOX.yTop} stroke={ICE} strokeWidth={2} strokeDasharray="10 9" opacity={0.7} />
          </g>
        );
      })()}
      <text x={BOX.x0 + 16} y={BOX.yTop - 34} fontFamily={K.mono} fontSize={19} letterSpacing={3} fill={K.muted} opacity={io(g, [100, 110], [0, 1]) * (1 - io(g, [344, 352], [0, 1]))}>2-D SCHEMATIC · 4TH BOND POINTS OUT OF THE PAGE</text>
    </g>
  );
};
const FREEZE0_UI = 232;

/* ───────────────────────── scene 4: same mass, two jars (to scale) ───────────────────────── */
const JAR = { w: 300, top: 772, bot: 1336, litre: 470 }; // 1.00 L = 470 px of fill
const Jar: React.FC<{ cx: number; fillTop: number; ice: number; g: number; label: string; children?: React.ReactNode }> = ({ cx, fillTop, ice, g, label, children }) => {
  const x0 = cx - JAR.w / 2, x1 = cx + JAR.w / 2, y0 = JAR.top, y1 = JAR.bot;
  const glass = `M ${x0 - 14} ${y0} L ${x0} ${y0} L ${x0} ${y1 - 20} Q ${x0} ${y1} ${x0 + 20} ${y1} L ${x1 - 20} ${y1} Q ${x1} ${y1} ${x1} ${y1 - 20} L ${x1} ${y0} L ${x1 + 14} ${y0}`;
  const wave = Array.from({ length: 21 }, (_, k) => { const t = k / 20; return `${x0 + 3 + t * (JAR.w - 6)} ${fillTop + (1 - ice) * 3 * Math.sin(t * 12 + g * 0.24)}`; });
  return (
    <g>
      <clipPath id={`jc${cx}`}><path d={`M ${x0 + 3} ${y0} L ${x0 + 3} ${y1 - 19} Q ${x0 + 3} ${y1 - 3} ${x0 + 21} ${y1 - 3} L ${x1 - 21} ${y1 - 3} Q ${x1 - 3} ${y1 - 3} ${x1 - 3} ${y1 - 19} L ${x1 - 3} ${y0} Z`} /></clipPath>
      <g clipPath={`url(#jc${cx})`}>
        <rect x={x0} y={fillTop} width={JAR.w} height={y1 - fillTop} fill={ice > 0.5 ? ICE : WATER} fillOpacity={ice > 0.5 ? 0.2 : 0.16} />
        <rect x={x0} y={fillTop} width={JAR.w} height={y1 - fillTop} fill="url(#hexp)" opacity={ice * 0.9} />
        {children}
      </g>
      <path d={"M " + wave.join(" L ")} fill="none" stroke={ice > 0.5 ? ICE : WATER} strokeWidth={4.5} strokeLinecap="round" />
      <path d={glass} fill="none" stroke={K.text} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      <text x={cx} y={y1 + 42} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={30} letterSpacing={5} fill={K.muted}>{label}</text>
    </g>
  );
};

const VolScene: React.FC<{ g: number }> = ({ g }) => {
  const L = JAR.litre, yBase = JAR.bot - 3;
  const topW = yBase - L; // 1.00 L mark
  const rise = io(g, [400, 428], [0, 1], easeInOut); // ice level rises to 1.09 L
  const topI = yBase - L * (1 + (EXPAND - 1) * rise);
  const iceP = io(g, [396, 420], [0, 1]);
  const lit = 1 + (EXPAND - 1) * io(g, [450, 480], [0, 1], easeInOut);
  const wt = io(g, [388, 398], [0, 1]);
  return (
    <g>
      <Jar cx={250} fillTop={topW} ice={0} g={g} label="WATER" />
      <Jar cx={800} fillTop={topI} ice={iceP} g={g} label="ICE" />
      {/* 1.00 L marks */}
      {[250, 800].map((cx) => <g key={cx}><line x1={cx - 150} y1={topW} x2={cx + 150} y2={topW} stroke={AMBER} strokeWidth={2} strokeDasharray="8 8" opacity={0.7} /></g>)}
      <text x={250} y={topW + 34} textAnchor="middle" fontFamily={K.mono} fontSize={22} letterSpacing={3} fill={AMBER}>1.00 L MARK</text>
      {/* same mass */}
      <g opacity={wt}>
        {[250, 800].map((cx) => (
          <g key={cx} transform={`translate(${cx} ${1220})`}>
            <path d="M -44 28 L -30 -16 L 30 -16 L 44 28 Z" fill={K.bgDeep} stroke={K.text} strokeWidth={3.2} />
            <text y={14} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={26} fill={K.text}>1 kg</text>
          </g>
        ))}
        <text x={525} y={1128} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={22} letterSpacing={3} fill={K.muted}>SAME MASS</text>
        <line x1={420} y1={1148} x2={630} y2={1148} stroke={K.lineDim} strokeWidth={2} />
        <text x={525} y={1223} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={52} fill={K.text}>=</text>
      </g>
      {/* +9 % */}
      {(() => {
        const p = ioB(g, 418, 432), x = 800 + 150;
        return (
          <g opacity={clamp01(p)}>
            <line x1={x - 150} y1={topI} x2={x + 36} y2={topI} stroke={AMBER} strokeWidth={2.4} strokeDasharray="6 7" opacity={0.8} />
            <line x1={x + 22} y1={topW - 4} x2={x + 22} y2={topI + 6} stroke={AMBER} strokeWidth={5} />
            <path d={`M ${x + 22} ${topI - 2} l -10 18 l 20 0 Z`} fill={AMBER} />
          </g>
        );
      })()}
      <g transform={`translate(800 ${topI + 48}) scale(${0.55 + 0.45 * ioB(g, 422, 436)})`} opacity={clamp01(ioB(g, 422, 436))}>
        <rect x={-92} y={-30} width={184} height={60} rx={30} fill={AMBER} />
        <text y={13} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={38} letterSpacing={2} fill={K.bgDeep}>+9 %</text>
      </g>
      {/* volume readouts */}
      <text x={250} y={742} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={64} letterSpacing={-2} fill={WATER} opacity={io(g, [388, 398], [0, 1])}>1.00 L</text>
      <text x={800} y={742} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={64} letterSpacing={-2} fill={AMBER} opacity={io(g, [446, 454], [0, 1])} style={{ display: g >= 446 ? undefined : "none" }}>{fmt(lit, 2)} L</text>
    </g>
  );
};

/* ───────────────────────── scene 5 (and hero): the floating cube ───────────────────────── */
const TANK = { x0: 150, x1: 770, top: 770, bot: 1366, surf: 1108, S: 244 };
const FloatTank: React.FC<{ g: number; t0: number; labels?: number; flash?: number }> = ({ g, t0, labels = 1, flash = 0 }) => {
  const t = g - t0, { x0, x1, top, bot, surf, S } = TANK, cx = (x0 + x1) / 2;
  const drop = io(t, [0, 12], [-430, 0], (u) => u * u);
  const tb = Math.max(0, t - 12);
  const bobv = 30 * Math.exp(-tb / 16) * Math.cos(tb * 0.36) * (t >= 12 ? 1 : 0);
  const sub = SUBMERGED * S;
  const cTop = surf - (S - sub) + (t < 12 ? drop : bobv * 0.55);
  const cLeft = cx - S / 2;
  const wave = (a: number) => Array.from({ length: 41 }, (_, k) => { const u = k / 40, x = x0 + 3 + u * (x1 - x0 - 6); const dd = Math.abs(x - cx) - S / 2; const rip = t >= 12 ? a * Math.exp(-Math.max(0, dd) / 150 - tb / 30) * Math.sin(Math.max(0, dd) * 0.05 - tb * 0.5) : 0; return `${x} ${surf + rip + 1.6 * Math.sin(u * 20 + g * 0.18)}`; });
  const lab = clamp01(labels);
  const split = io(t, [30, 48], [0, 1]);
  const below = SUBMERGED * 100 * split, above = ABOVE * 100 * split;
  const glassP = `M ${x0} ${top} L ${x0} ${bot - 22} Q ${x0} ${bot} ${x0 + 22} ${bot} L ${x1 - 22} ${bot} Q ${x1} ${bot} ${x1} ${bot - 22} L ${x1} ${top}`;
  const ripple = t >= 12 && t < 48 ? [0, 1].map((k) => ({ r: (t - 12 - k * 8) * 9, o: clamp01(1 - (t - 12 - k * 8) / 30) })).filter((q) => q.r > 0) : [];
  const dropO = t < 0 ? 0 : 1;
  return (
    <g>
      <clipPath id="tankc"><rect x={x0 + 3} y={surf} width={x1 - x0 - 6} height={bot - surf - 3} /></clipPath>
      <rect x={x0 + 3} y={surf} width={x1 - x0 - 6} height={bot - surf - 3} fill={WATER} fillOpacity={0.12} />
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M ${x0 + 20} ${surf + 60 + k * 46} q 40 -8 80 0 t 80 0`} fill="none" stroke={WATER} strokeWidth={1.6} opacity={0.12} />)}
      <path d={"M " + wave(7).join(" L ")} fill="none" stroke={WATER} strokeWidth={4.5} strokeLinecap="round" />
      {ripple.map((q, k) => <ellipse key={k} cx={cx} cy={surf} rx={q.r + S / 2} ry={7 + q.r * 0.05} fill="none" stroke={WATER} strokeWidth={2.4} opacity={q.o * 0.7} />)}
      {/* the cube: lower part clipped under the waterline gets a cooler tint */}
      <g opacity={dropO}>
        <rect x={cLeft} y={cTop} width={S} height={S} rx={8} fill={ICE} fillOpacity={0.28} />
        <rect x={cLeft} y={cTop} width={S} height={S} rx={8} fill="url(#hexp)" opacity={0.75} />
        <rect x={cLeft} y={cTop} width={S} height={S} rx={8} fill="none" stroke={ICE} strokeWidth={5} />
        <rect x={cLeft + 14} y={cTop + 14} width={5} height={46} rx={2.5} fill={K.text} opacity={0.6} />
        {/* waterline across the cube */}
        {t >= 12 && <line x1={cLeft - 18} y1={surf} x2={cLeft + S + 18} y2={surf} stroke={WATER} strokeWidth={3} />}
      </g>
      <path d={glassP} fill="none" stroke={K.text} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      {/* brackets: 8 % above, 92 % below */}
      <g opacity={lab * io(t, [26, 36], [0, 1])}>
        <path d={`M ${x1 + 22} ${surf - (S - sub)} L ${x1 + 36} ${surf - (S - sub)} L ${x1 + 36} ${surf - 2} L ${x1 + 22} ${surf - 2}`} fill="none" stroke={AMBER} strokeWidth={3.6} />
        <path d={`M ${x1 + 22} ${surf + 2} L ${x1 + 36} ${surf + 2} L ${x1 + 36} ${surf + sub} L ${x1 + 22} ${surf + sub}`} fill="none" stroke={WATER} strokeWidth={3.6} />
        <text x={x1 + 46} y={surf - 30} fontFamily={K.mono} fontWeight={700} fontSize={50} letterSpacing={-2} fill={AMBER}>{fmt(above)}%</text>
        <text x={x1 + 46} y={surf + sub / 2 + 22} fontFamily={K.mono} fontWeight={700} fontSize={64} letterSpacing={-3} fill={WATER}>{fmt(below)}%</text>
      </g>
      {/* weight = buoyancy */}
      <g opacity={lab * io(t, [46, 58], [0, 1])}>
        {(() => {
          const cy = cTop + S - sub / 2;
          return (
            <g>
              <line x1={cx - 54} y1={cy - 6} x2={cx - 54} y2={cy + 82} stroke={RED} strokeWidth={6} strokeLinecap="round" />
              <path d={`M ${cx - 54} ${cy + 100} l -14 -24 l 28 0 Z`} fill={RED} />
              <line x1={cx + 54} y1={cy + 6} x2={cx + 54} y2={cy - 82} stroke={GREEN} strokeWidth={6} strokeLinecap="round" />
              <path d={`M ${cx + 54} ${cy - 100} l -14 24 l 28 0 Z`} fill={GREEN} />
              <text x={cx - 54} y={cy - 18} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={34} fill={RED}>W</text>
              <text x={cx + 54} y={cy + 34} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={34} fill={GREEN}>F</text>
            </g>
          );
        })()}
      </g>
      {void flash}
    </g>
  );
};

/* ───────────────────────── scene 6: a winter lake ───────────────────────── */
const LAKE = { x0: 100, x1: 980, top: 800, bot: 1332 };
const Fish: React.FC<{ x: number; y: number; dir: number; t: number; s?: number; c?: string }> = ({ x, y, dir, t, s = 1, c = AMBER }) => (
  <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
    <path d={`M 40 0 Q 12 -24 -22 -4 L -34 ${-16 + 6 * Math.sin(t * 0.4)} L -34 ${16 + 6 * Math.sin(t * 0.4)} L -22 4 Q 12 24 40 0 Z`} fill={c} fillOpacity={0.2} stroke={c} strokeWidth={3.4} strokeLinejoin="round" />
    <circle cx={22} cy={-3} r={3.6} fill={c} />
    <path d="M 10 -8 Q 4 0 10 8" fill="none" stroke={c} strokeWidth={2.4} />
  </g>
);

const LakeScene: React.FC<{ g: number }> = ({ g }) => {
  const { x0, x1, top, bot } = LAKE;
  const t = g - T.lake;
  const iceT = 78 * io(g, [622, 656], [0, 1], easeInOut); // ice sheet thickness
  const sink = io(g, [592, 604], [0, 1]) * (1 - io(g, [630, 640], [0, 1]));
  const temps = [{ y: top + 118, v: "0 °C", c: "#CDEBFF" }, { y: top + 280, v: "2 °C", c: "#8BE2FF" }, { y: bot - 66, v: "4 °C", c: "#5CD3FF" }];
  const tt = io(g, [636, 650], [0, 1]);
  const f1x = 270 + 100 * Math.sin(g * 0.035), f1d = Math.cos(g * 0.035) >= 0 ? 1 : -1;
  const f2x = 640 + 130 * Math.sin(g * 0.028 + 2), f2d = Math.cos(g * 0.028 + 2) >= 0 ? 1 : -1;
  return (
    <g>
      {/* lake body: warm-to-cool gradient */}
      <defs>
        <linearGradient id="lakeg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CDEBFF" stopOpacity={0.05 + 0.1 * tt} />
          <stop offset="1" stopColor="#2E8DB8" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <rect x={x0} y={top} width={x1 - x0} height={bot - top} fill="url(#lakeg)" />
      {/* lake bed */}
      <path d={`M ${x0 - 20} ${bot - 30} Q ${x0 + 160} ${bot - 6} ${x0 + 330} ${bot - 22} T ${x1 + 20} ${bot - 28} L ${x1 + 20} ${bot + 20} L ${x0 - 20} ${bot + 20} Z`} fill={K.bgDeep} stroke={K.lineDim} strokeWidth={3} />
      {[0, 1].map((k) => <path key={k} d={`M ${x0 + 140 + k * 560} ${bot - 20} q 8 -50 0 -90 M ${x0 + 160 + k * 560} ${bot - 20} q -6 -40 2 -70`} fill="none" stroke={GREEN} strokeWidth={3.4} opacity={0.6} strokeLinecap="round" />)}
      {/* walls */}
      <path d={`M ${x0} ${top - 20} L ${x0} ${bot} M ${x1} ${top - 20} L ${x1} ${bot}`} stroke={K.text} strokeWidth={5} opacity={0.85} />
      {/* cold air + snow flecks */}
      <text x={x0 + 16} y={top - 40} fontFamily={K.mono} fontWeight={700} fontSize={26} letterSpacing={4} fill={K.muted} opacity={io(g, [592, 604], [0, 1])}>AIR BELOW 0 °C</text>
      {Array.from({ length: 14 }).map((_, k) => {
        const x = x0 + 40 + k * 62 + 18 * Math.sin(g * 0.05 + k), y = top - 130 + ((g * 1.4 + k * 53) % 120);
        return <circle key={k} cx={x} cy={y} r={3} fill={ICE} opacity={0.5 * io(g, [592, 606], [0, 1])} />;
      })}
      {/* cold surface water sinks until the whole lake is 4 °C */}
      <g opacity={sink}>
        {[0, 1, 2, 3].map((k) => {
          const x = 250 + k * 190, p = ((g * 0.018 + k * 0.25) % 1), y = top + 20 + p * (bot - top - 170);
          return <g key={k} opacity={Math.sin(p * Math.PI)}><line x1={x} y1={y - 34} x2={x} y2={y + 14} stroke={WATER} strokeWidth={5} strokeLinecap="round" /><path d={`M ${x} ${y + 34} l -12 -20 l 24 0 Z`} fill={WATER} /></g>;
        })}
        <text x={540} y={top + 54} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={24} letterSpacing={3} fill={WATER}>COOLING WATER SINKS</text>
      </g>
      {/* the ice sheet */}
      <g opacity={iceT > 0.5 ? 1 : 0}>
        <rect x={x0 + 3} y={top - 4} width={x1 - x0 - 6} height={iceT + 4} fill={ICE} fillOpacity={0.3} />
        <rect x={x0 + 3} y={top - 4} width={x1 - x0 - 6} height={iceT + 4} fill="url(#hexp)" opacity={0.75} />
        <line x1={x0 + 3} y1={top + iceT} x2={x1 - 3} y2={top + iceT} stroke={ICE} strokeWidth={5} />
      </g>
      {/* temperature gradient labels */}
      <g opacity={tt}>
        {temps.map((q) => (
          <g key={q.v}>
            <line x1={x1 - 130} y1={q.y} x2={x1 - 100} y2={q.y} stroke={q.c} strokeWidth={4} />
            <text x={x1 - 90} y={q.y + 11} fontFamily={K.mono} fontWeight={700} fontSize={32} fill={q.c}>{q.v}</text>
          </g>
        ))}
        <line x1={x1 - 130} y1={temps[0].y} x2={x1 - 130} y2={temps[2].y} stroke={K.lineDim} strokeWidth={2.4} strokeDasharray="4 8" />
        <g transform={`translate(${470} ${top + 300})`} opacity={io(g, [644, 654], [0, 1])}>
          <rect x={-170} y={-24} width={340} height={48} rx={24} fill={WATER} fillOpacity={0.15} stroke={WATER} strokeWidth={2.4} />
          <text y={10} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={26} letterSpacing={2} fill={WATER}>DENSEST AT 4 °C</text>
        </g>
      </g>
      <Fish x={f1x} y={bot - 100} dir={f1d} t={g} />
      <Fish x={f2x} y={bot - 150} dir={f2d} t={g + 9} s={0.82} c={GREEN} />
      <text x={x0 + 18} y={top + iceT + 38} fontFamily={K.mono} fontWeight={700} fontSize={26} letterSpacing={3} fill={ICE} opacity={io(g, [650, 662], [0, 1])}>ICE SHEET INSULATES</text>
    </g>
  );
};

/* ───────────────────────── hero: big ring, density bars, floating cube ───────────────────────── */
const RING_R = 250, RING_C = { x: 540, y: 1040 };
const HeroRing: React.FC<{ g: number; o: number }> = ({ g, o }) => {
  const kinds: ("A" | "B")[] = ["A", "B", "A", "B", "A", "B"];
  const sc = 2.2;
  const pts = Array.from({ length: 6 }, (_, k) => { const a = ((-90 + 60 * k) * Math.PI) / 180; return { x: RING_C.x + RING_R * Math.cos(a), y: RING_C.y + RING_R * Math.sin(a) }; });
  const mols: MolState[] = pts.map((p, k) => ({ x: p.x, y: p.y, a1: kinds[k] === "A" ? Math.PI / 2 - ANG / 2 : Math.PI / 2, a2: (kinds[k] === "A" ? Math.PI / 2 - ANG / 2 : Math.PI / 2) + (kinds[k] === "A" ? 1 : -1) * ANG, s: 1, f2: kinds[k] === "B" ? 0.38 : 1 }));
  const draw = io(g, [T.hero + 2, T.hero + 22], [0, 1], easeOut);
  const pulse = 0.5 + 0.5 * Math.sin(g * 0.25);
  // donors: A gives to its two lower neighbours, B gives to the A directly below (same rule as the lattice)
  const bonds: [number, number, 0 | 1][] = [[0, 1, 0], [0, 5, 1], [1, 2, 0], [5, 4, 0], [2, 3, 1], [4, 3, 0]];
  const ringPts = pts.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <g opacity={o}>
      <circle cx={RING_C.x} cy={RING_C.y} r={RING_R - 70} fill={AMBER} fillOpacity={0.05 + 0.04 * pulse} stroke={AMBER} strokeWidth={2.4} strokeDasharray="4 10" opacity={draw} />
      <polygon points={ringPts} fill="none" stroke={K.lineDim} strokeWidth={2} opacity={0.5 * draw} />
      {bonds.map(([i, j, h], k) => {
        const hp = { x: pts[i].x + OH * 2.2 * Math.cos(mols[i].a1 + (h === 1 ? ANG : 0)), y: pts[i].y + OH * 2.2 * Math.sin(mols[i].a1 + (h === 1 ? ANG : 0)) };
        void k;
        return <HBond key={k} a={hp} b={pts[j]} o={draw} w={4.8} sc={2.2} />;
      })}
      {mols.map((m, k) => <Molecule key={k} m={m} sc={sc * clamp01(draw * 1.4 - 0.2 * k * 0.3)} />)}
      <g opacity={draw}>
        <text x={RING_C.x} y={RING_C.y + 12} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={44} letterSpacing={6} fill={AMBER}>EMPTY</text>
        <text x={RING_C.x} y={RING_C.y + 52} textAnchor="middle" fontFamily={K.mono} fontWeight={600} fontSize={20} letterSpacing={3} fill={K.muted}>6 MOLECULES · 1 GAP</text>
      </g>
    </g>
  );
};

const HeroBars: React.FC<{ g: number }> = ({ g }) => {
  const base = 1330, hMax = 440, a = T.hero + 38;
  const gw = io(g, [a, a + 18], [0, 1], easeOut), gi = io(g, [a + 8, a + 28], [0, 1], easeOut);
  const hW = hMax * gw, hI = hMax * SUBMERGED * gi;
  const cnt = io(g, [a + 6, a + 30], [0, 1]);
  const gap = io(g, [a + 28, a + 38], [0, 1]);
  return (
    <g>
      <line x1={110} y1={base} x2={970} y2={base} stroke={K.lineDim} strokeWidth={3} />
      <rect x={150} y={base - hW} width={220} height={hW} fill={WATER} fillOpacity={0.22} stroke={WATER} strokeWidth={4} />
      <rect x={710} y={base - hI} width={220} height={hI} fill={ICE} fillOpacity={0.2} stroke={ICE} strokeWidth={4} />
      <rect x={710} y={base - hI} width={220} height={hI} fill="url(#hexp)" opacity={0.7} />
      <text x={260} y={base - hW - 24} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={84} letterSpacing={-3} fill={WATER}>{fmt(RHO_WATER * cnt)}</text>
      <text x={820} y={base - hI - 24} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={84} letterSpacing={-3} fill={ICE}>{fmt(RHO_ICE * cnt)}</text>
      <text x={260} y={base + 44} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={28} letterSpacing={5} fill={K.muted}>WATER</text>
      <text x={820} y={base + 44} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={28} letterSpacing={5} fill={K.muted}>ICE</text>
      <text x={540} y={base + 44} textAnchor="middle" fontFamily={K.mono} fontSize={22} letterSpacing={3} fill={K.muted} opacity={0.8}>kg/m³</text>
      <g opacity={gap}>
        <line x1={380} y1={base - hMax} x2={700} y2={base - hMax} stroke={AMBER} strokeWidth={2.4} strokeDasharray="9 8" />
        <line x1={684} y1={base - hMax + 2} x2={684} y2={base - hI - 6} stroke={AMBER} strokeWidth={5} />
        <path d={`M 684 ${base - hI - 2} l -10 -18 l 20 0 Z`} fill={AMBER} />
        <rect x={430} y={base - hMax - 62} width={220} height={52} rx={26} fill={AMBER} />
        <text x={540} y={base - hMax - 26} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={32} letterSpacing={1} fill={K.bgDeep}>−8.3 %</text>
      </g>
    </g>
  );
};

/* ───────────────────────── the one stage ───────────────────────── */
export const IceShot: React.FC = () => {
  const g = useCurrentFrame();
  const fade = io(g, [763, 775], [0, 1]);
  const T_ = TEMP(g);
  const frozen = g >= 232;
  const sHook = win(g, -40, 100, 1, 10), sBox = win(g, 90, 396, 10, 10), sVol = win(g, 384, 524, 10, 10), sFloat = win(g, 512, 596, 10, 10), sLake = win(g, 584, 680, 10, 10);
  const hero1 = win(g, 668, 712, 8, 8), hero2 = win(g, 704, 752, 8, 8), hero3 = win(g, 744, 776, 8, 10);
  const flash = io(g, [748, 754], [0, 1]) * (1 - io(g, [754, 772], [0, 1]));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      {/* headlines */}
      <Headline f={g} lines={["Most things", "*shrink* when frozen"]} at={-30} exitAt={56} size={96} />
      <Headline f={g} lines={["Water", "*grows*"]} at={62} exitAt={92} size={120} />
      <Headline f={g} lines={["Liquid water =", "a *jostling* crowd"]} at={100} exitAt={146} size={90} />
      <Headline f={g} lines={["Bonds *break*", "and re-form"]} at={152} exitAt={204} size={96} />
      <Headline f={g} lines={["Cool it: it", "*locks in*"]} at={212} exitAt={252} size={96} />
      <Headline f={g} lines={["*4* bonds each"]} at={258} exitAt={300} size={104} />
      <Headline f={g} lines={["A hexagonal", "*lattice*"]} at={308} exitAt={342} size={96} />
      <Headline f={g} lines={["Empty space", "inside every *ring*"]} at={346} exitAt={382} size={90} />
      <Headline f={g} lines={["*+9 %* more room"]} at={390} exitAt={442} size={104} />
      <Headline f={g} lines={["1 L becomes", "*1.09 L*"]} at={450} exitAt={510} size={104} />
      <Headline f={g} lines={["Less dense", "so it *floats*"]} at={518} exitAt={582} size={100} />
      <Headline f={g} lines={["Lakes freeze", "from the *top*"]} at={590} exitAt={636} size={96} />
      <Headline f={g} lines={["Fish live", "*below*"]} at={642} exitAt={668} size={104} />
      <Headline f={g} lines={["*Open rings.*"]} at={674} exitAt={700} size={118} />
      <Headline f={g} lines={["*Less density.*"]} at={708} exitAt={744} size={118} accent={ICE} />
      <Headline f={g} lines={["Ice *floats*"]} at={750} exitAt={766} size={140} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <HexDefs />
        <Frame />
        <g opacity={sHook}><HookScene g={g} /></g>
        <g opacity={sBox}><IceBox g={g} /></g>
        <g opacity={sVol}><VolScene g={g} /></g>
        <g opacity={sFloat}><FloatTank g={g} t0={T.float} /></g>
        <g opacity={sLake}><LakeScene g={g} /></g>
        <HeroRing g={g} o={hero1} />
        <g opacity={hero2}><HeroBars g={g} /></g>
        <g opacity={hero3}><FloatTank g={g} t0={T.hero + 64} labels={1} flash={flash} /></g>
      </svg>

      {/* html labels */}
      <div style={{ position: "absolute", inset: 0, opacity: sHook }}>
        <Label f={g} at={-30} text="ANY OTHER SOLID" x={300} y={1340} size={22} align="center" color={K.muted} />
        <Label f={g} at={-30} text="WATER" x={780} y={1340} size={22} align="center" color={K.muted} />
        <Tag f={g} at={-30} text="SINKS  ↓" x={300} y={1120} color={SOLID} size={26} />
        <Tag f={g} at={-30} text="FLOATS  ↑" x={780} y={1120} color={AMBER} solid size={26} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: sLake }}>
        <Tag f={g} at={T.lake + 58} text="FISH LIVE BELOW" x={540} y={LAKE.bot - 74} color={AMBER} solid size={24} />
      </div>
      {/* panels */}
      <Panel o={win(g, -40, 100, 1, 8)} h={92}>
        <Row size={26} color={K.muted}><Hl c={SOLID}>MOST SOLIDS SINK</Hl><span style={{ opacity: 0.4 }}>|</span><Hl c={AMBER}>ICE FLOATS</Hl><span style={{ color: K.muted }}>917 &lt; 1000 kg/m³</span></Row>
      </Panel>
      <Panel o={win(g, 100, 216, 8, 8)} h={118}>
        <Row size={26} color={K.muted}><span>H₂O = O + 2 H</span><Hl c={K.text}>104.5°</Hl><span>· dashed = H-bond</span></Row>
        <Row size={34} color={K.text}><span style={{ color: K.muted }}>TEMP</span><Hl c={T_ > 0.5 ? WATER : ICE}>{fmt(Math.max(0, T_), 1)} °C</Hl><span style={{ fontSize: 22, color: K.muted }}>H-BONDS LAST ≈ 1 ps</span></Row>
      </Panel>
      <Panel o={win(g, 212, 304, 8, 8)} h={118}>
        <Row size={26} color={K.muted}><span>FREEZING POINT</span><Hl c={ICE}>0 °C</Hl><span>· ICE Ih</span></Row>
        <Row size={32} color={K.text}><Hl c={AMBER}>2 GIVEN</Hl><span style={{ color: K.muted }}>+</span><Hl c={AMBER}>2 RECEIVED</Hl><span style={{ color: K.muted }}>=</span><Hl c={K.text}>4 BONDS</Hl></Row>
      </Panel>
      <Panel o={win(g, 304, 392, 8, 8)} h={118}>
        <Row size={26} color={K.muted}><span>ONE EMPTY HEXAGON IN EVERY RING</span></Row>
        <Row size={32} color={K.text}><span style={{ color: K.muted }}>O···O</span><Hl c={AMBER}>2.76 Å</Hl><span style={{ color: K.muted }}>·</span><span style={{ color: K.muted }}>LEVEL</span><Hl c={AMBER}>+9 %</Hl></Row>
      </Panel>
      <Panel o={win(g, 386, 520, 8, 8)} h={118}>
        <Row size={26} color={K.muted}><span>1 kg WATER</span><Hl c={WATER}>1.00 L</Hl><span>· 1 kg ICE</span><Hl c={AMBER}>{fmt(1 + (EXPAND - 1) * io(g, [450, 480], [0, 1], easeInOut), 2)} L</Hl></Row>
        <Row size={32} color={K.text}><span style={{ color: K.muted }}>ρ = 1 kg / 1.09 L =</span><Hl c={ICE}>917 kg/m³</Hl></Row>
      </Panel>
      <Panel o={win(g, 515, 592, 8, 8)} h={118}>
        <Row size={26} color={K.muted}><span>ρ ICE / ρ WATER = 917 / 1000 =</span><Hl c={AMBER}>0.917</Hl></Row>
        <Row size={32} color={K.text}><Hl c={WATER}>92 % BELOW</Hl><span style={{ color: K.muted }}>·</span><Hl c={AMBER}>8 % ABOVE</Hl></Row>
      </Panel>
      <Panel o={win(g, 587, 676, 8, 8)} h={118}>
        <Row size={26} color={K.muted}><span>WATER IS DENSEST AT</span><Hl c={WATER}>4 °C</Hl><span>· COLDER = LIGHTER</span></Row>
        <Row size={32} color={K.text}><Hl c={ICE}>0 °C ICE</Hl><span style={{ color: K.muted }}>ON TOP ·</span><Hl c={WATER}>4 °C</Hl><span style={{ color: K.muted }}>BELOW</span></Row>
      </Panel>
      <Panel o={win(g, 744, 776, 8, 8)} h={92}>
        <Row size={30} color={K.text}><Hl c={AMBER}>ρ ice 917</Hl><span style={{ color: K.muted }}>&lt;</span><Hl c={WATER}>ρ water 1000</Hl><span style={{ color: K.muted }}>kg/m³</span></Row>
      </Panel>
      {frozen && null}
    </div>
  );
};

/* ────────── end card (same as #10) ────────── */
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
      <Tag f={f} at={8} text="FOLLOW  +" x={540} y={1330} color={AMBER} solid size={32} />
      <Label f={f} at={64} text="AKS PRODUCTIONS" x={540} y={1410} size={30} align="center" color={K.text} />
      <Label f={f} at={78} text="HOW IT WORKS · @DEAD.SIMPLE.ENGINEERING" x={540} y={1466} size={20} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.amber }}>HOW IT WORKS · 11</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 116, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>Why ice</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: AMBER }}>floats</div>
    </div>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <HexDefs />
      <Frame />
      <FloatTank g={T.float + 90} t0={T.float} labels={1} />
    </svg>
  </>
);

export { easeInOut, easeOut, dist, KIND, T_LOCK, ICE_A1, SIGMA };
