import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Tag, clamp01, ioB, meshPhase, W, H } from "../gearbox/kit";
import { P } from "./theme";
import data from "./data.json";

/**
 * AI MATH #01 — π is as hard to approximate as any number can be     30 s · 1080×1920 · 30 fps · frame 0 is a finished hook
 *
 * PLAN (global frames; VO phrases from public/projects/pi/vo.json)
 *   0    hook   "OpenAI claims its AI just settled a famous question about pi."  Number line zooms ×6000 on π; 22/7 pin, then 355/113
 *               pin peels off π (offsets computed with mpmath). π digits resolve as the window shrinks.
 *   129  plot   "22/7 is close. 355/113 is closer."  log–log: digits correct vs denominator q, reference line = exponent 2 (error ≈ 1/q²).
 *               Real convergents of π land: 22/7 and 355/113 sit far above the line (μ≈3.43, 3.20); 333/106 and the later ones hug it (μ≈2.0–2.2).
 *   272  claim  "The claim: past some size, no fraction beats exponent two."  Dashed 2+ε line, Q(ε) marker (exists, not explicit), empty zone shaded.
 *   390  floor  "Two is the lowest possible, so pi is as hard to approximate as it gets."  Ratchet of published upper bounds on μ(π)
 *               (42 → 21 → 8.016 → 7.606 → 7.1032) and the OpenAI claim: dial/bar locks on exactly 2 (frame 478, hero beat + violet flash).
 *   523  fh     "It implies the Flint-Hills series converges."  Partial sums of Σ 1/(n³ sin² n) computed to N = 10⁸: one term at n = 355 is ≈ 24.6.
 *   593  status "Status: an OpenAI claim, not peer reviewed. Lean files published, not checked by us."  CLAIM STATUS card, rows tick in on the phrases.
 *   802  end    Follow-for-more end card (same pattern as #10–#12).
 * Everything is a pure function of the frame. Numbers come from data.json (make_data.py, mpmath + numpy).
 */

/** Global frames from public/projects/pi/vo.json. Keep in sync with soundtrack.py. */
export const T = { plot: 129, claim: 272, floor: 390, lock: 478, fh: 523, status: 593, stamp: 786, end: 802, total: 900 };
export const CUTS = [0, 129, 272, 390, 523, 593, 802];

const ACC = P.acc, MINT = P.mint, CORAL = P.coral, BLUE = P.blue;
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const sm = (x: number, a: number, b: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const sci = (x: number, d = 2) => { const e = Math.floor(Math.log10(Math.abs(x))); const m = x / 10 ** e; return `${m.toFixed(d - 1)}×10${String(e).split("").map((c) => SUP[c]).join("")}`; };
const f2 = (x: number, d = 2) => x.toFixed(d);

/* ───────────── computed data ───────────── */
type Conv = { p: number; q: number; err: number; log10err: number; log10q: number; mu: number | null; off: number };
const CV = data.conv as Conv[];
const c227 = CV.find((c) => c.q === 7)!, c333 = CV.find((c) => c.q === 106)!, c355 = CV.find((c) => c.q === 113)!;
const LATER = CV.filter((c) => c.q > 113 && c.q < 2_000_000);     // 103993/33102 … 5419351/1725033
const muLo = Math.min(...LATER.map((c) => c.mu!)), muHi = Math.max(...LATER.map((c) => c.mu!));
const PI_STR = "3.14159265358979323846";
const FH_PTS = data.fh_pts as [number, number][];
const FH_BIG = data.fh_big as [number, number][];
const T355 = FH_BIG.find((b) => b[0] === 355)![1];
const S_END = data.fh_S;

/* ───────────── shared bits ───────────── */
const Panel: React.FC<{ o: number; children: React.ReactNode; h?: number }> = ({ o, children, h = 118 }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1424, height: h, opacity: o, borderRadius: 10, border: `2px solid ${K.lineDim}`, background: "rgba(3,11,24,0.78)", boxSizing: "border-box", padding: "14px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
    {children}
  </div>
);
const Row: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 30, color = K.muted }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 12, fontFamily: K.mono, fontSize: size, letterSpacing: size * 0.04, color, whiteSpace: "nowrap", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{children}</div>
);
const Hl: React.FC<{ c: string; children: React.ReactNode }> = ({ c, children }) => <span style={{ color: c, fontWeight: 700 }}>{children}</span>;
const Frame: React.FC = () => (
  <g>
    {[[VIEW.x0, VIEW.y0, 1, 1], [VIEW.x1, VIEW.y0, -1, 1], [VIEW.x0, VIEW.y1, 1, -1], [VIEW.x1, VIEW.y1, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={K.lineDim} strokeWidth={2.4} />
    ))}
    <rect x={VIEW.x0} y={VIEW.y0} width={VIEW.x1 - VIEW.x0} height={VIEW.y1 - VIEW.y0} fill="rgba(3,11,24,0.32)" stroke="rgba(92,211,255,0.10)" strokeWidth={1.5} />
  </g>
);
const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number; rot?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 22} letterSpacing={o.ls ?? (o.size ?? 22) * 0.1} fill={o.c ?? K.muted} opacity={o.op ?? 1}
    transform={o.rot ? `rotate(${o.rot} ${x} ${y})` : undefined}>{s}</text>
);

/* ───────────── scene 0: hook — number line zoom on π ───────────── */
const AXY = 1010, HALF = 430, CX = 540;
const HookScene: React.FC<{ g: number }> = ({ g }) => {
  const e = easeInOut(clamp01(g / 104));
  const w = 0.006 * Math.pow(2e-6 / 0.006, e);                    // half-width of the window, in value units
  const pxPer = HALF / w;
  // tick levels (decimal places m): ticks sit at multiples of 10^-m, offsets from π taken from the digit string
  const ticks: React.ReactNode[] = [];
  for (let m = 1; m <= 8; m++) {
    const step = 10 ** -m, spacing = step * pxPer;
    const op = sm(spacing, 12, 40);
    if (op <= 0.01) continue;
    const N0 = Math.floor(Number(PI_STR.slice(0, 2 + m)) * 10 ** m + 0.5 - 0.5);
    const N0i = Math.round(Number(PI_STR.slice(0, 2 + m).replace(".", "")));
    const r = Number("0." + PI_STR.slice(2 + m));
    void N0;
    const kmin = Math.ceil(r - w * 10 ** m), kmax = Math.floor(r + w * 10 ** m);
    if (kmax - kmin > 90) continue;
    const lop = sm(spacing, 120, 190) * (1 - sm(spacing, 520, 900));
    for (let k = kmin; k <= kmax; k++) {
      const off = (k - r) * step, x = CX + off * pxPer;
      if (x < 112 || x > 968) continue;
      const major = (N0i + k) % 10 === 0;
      const edge = sm(x, 112, 150) * (1 - sm(x, 930, 968));
      ticks.push(
        <g key={`${m}_${k}`} opacity={op * edge}>
          <line x1={x} x2={x} y1={AXY} y2={AXY + (major ? 22 : 14)} stroke={K.muted} strokeWidth={major ? 2.4 : 1.8} />
          {lop > 0.02 && <text x={x} y={AXY + 52} textAnchor="middle" fontFamily={K.mono} fontWeight={600} fontSize={23} fill={K.muted} opacity={lop}>{((N0i + k) / 10 ** m).toFixed(m)}</text>}
        </g>,
      );
    }
  }
  const pin = (off: number, label: string, sub: string, col: string, side: "up" | "down", dxLabel: number, fade: number) => {
    const x = CX + off * pxPer;
    const edge = sm(x, 112, 170) * (1 - sm(x, 910, 968));
    const sep = Math.abs(x - CX);
    const lop = sm(sep, 34, 56) * edge * fade;
    const o = edge * fade;
    return (
      <g>
        <line x1={x} x2={x} y1={AXY - 70} y2={AXY + 8} stroke={col} strokeWidth={3.4} opacity={o} />
        <circle cx={x} cy={AXY} r={9} fill={col} opacity={o} />
        <g opacity={lop}>
          <line x1={x} x2={x + 14} y1={AXY - 70} y2={AXY - 96} stroke={col} strokeWidth={2} />
          {T_(x + 18, AXY - 94, label, { c: col, a: "start", size: 34, w: 700, ls: 1 })}
        </g>
      </g>
    );
  };
  const nd = Math.max(3, Math.min(15, Math.ceil(-Math.log10(w)) + 3));
  const off227 = c227.off, off355 = c355.off;
  const x227 = CX + off227 * pxPer, x355 = CX + off355 * pxPer;
  // bracket between π and the pin that is currently most separated but visible
  const bracket = (x: number, o: number, label: string) => (
    <g opacity={o}>
      <line x1={CX} x2={x} y1={AXY + 100} y2={AXY + 100} stroke={MINT} strokeWidth={3} />
      <line x1={CX} x2={CX} y1={AXY + 90} y2={AXY + 110} stroke={MINT} strokeWidth={3} />
      <line x1={x} x2={x} y1={AXY + 90} y2={AXY + 110} stroke={MINT} strokeWidth={3} />
      {T_((CX + x) / 2, AXY + 142, label, { c: MINT, a: "middle", size: 22, w: 700, ls: 1 })}
    </g>
  );
  const b227 = sm(x227 - CX, 30, 56) * (1 - sm(x227, 880, 960));
  const b355 = sm(x355 - CX, 34, 56) * io(g, [60, 76], [0, 1]);
  const digits = "3." + PI_STR.slice(2, 2 + nd - 1);
  return (
    <g>
      <line x1={110} x2={970} y1={AXY} y2={AXY} stroke={BLUE} strokeWidth={3} />
      {ticks}
      {/* π marker */}
      <line x1={CX} x2={CX} y1={AXY - 140} y2={AXY + 20} stroke={ACC} strokeWidth={4} />
      <circle cx={CX} cy={AXY} r={11} fill={ACC} />
      {T_(CX, AXY - 156, "π", { c: ACC, a: "middle", size: 44, w: 700, ls: 0 })}
      {pin(off227, "22/7", "", MINT, "up", 0, 1)}
      {pin(off355, "355/113", "", MINT, "up", 0, 1)}
      {bracket(x227, b227 * (1 - b355), sci(Math.abs(off227), 2))}
      {bracket(x355, b355, sci(Math.abs(off355), 2))}
      {/* readouts */}
      <text x={CX} y={760} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={52} fill={K.text} letterSpacing={-1}>π = {digits}…</text>
      {T_(CX, 818, `WINDOW  ±${sci(w, 2)}`, { c: K.muted, a: "middle", size: 24 })}
      {/* error table */}
      <g opacity={1}>
        <rect x={110} y={1210} width={860} height={150} rx={10} fill="rgba(3,11,24,0.6)" stroke={K.lineDim} strokeWidth={2} />
        {T_(140, 1262, "22/7", { c: MINT, size: 30, w: 700 })}
        {T_(300, 1262, `= ${(22 / 7).toFixed(7)}…`, { c: K.text, size: 28 })}
        {T_(940, 1262, `off by ${sci(Math.abs(off227), 2)}`, { c: MINT, a: "end", size: 28, w: 700, ls: 0.5 })}
        <g opacity={io(g, [58, 74], [0, 1])}>
          {T_(140, 1328, "355/113", { c: MINT, size: 30, w: 700 })}
          {T_(375, 1328, `= ${(355 / 113).toFixed(7)}…`, { c: K.text, size: 28 })}
          {T_(940, 1328, `off by ${sci(Math.abs(off355), 2)}`, { c: MINT, a: "end", size: 28, w: 700, ls: 0.5 })}
        </g>
      </g>
    </g>
  );
};

/* ───────────── scene 1+2: log–log plot ───────────── */
const PX0 = 200, PX1 = 984, PY0 = 740, PY1 = 1290, XMAX = 7, YMAX = 15;
const gx = (lx: number) => PX0 + (lx / XMAX) * (PX1 - PX0);
const gy = (ly: number) => PY1 - (ly / YMAX) * (PY1 - PY0);
const NU = 2.25, QX = 3.6;
const PlotScene: React.FC<{ g: number }> = ({ g }) => {
  const ax = io(g, [T.plot, T.plot + 18], [0, 1], easeOut);
  const lineP = io(g, [T.plot + 6, T.plot + 40], [0, 1], easeOut);
  const land = (c: Conv) => {
    const t = c.q === 7 ? 142 : c.q === 106 ? 186 : c.q === 113 ? 204 : 222 + 5 * LATER.indexOf(c);
    return t;
  };
  const pts = CV.filter((c) => c.q >= 7 && c.q < 2_000_000);
  const nuP = io(g, [T.claim + 31, T.claim + 58], [0, 1], easeOut);
  const qP = io(g, [T.claim + 31, T.claim + 50], [0, 1], easeOut);
  const zone = io(g, [T.claim + 66, T.claim + 88], [0, 1], easeOut);
  const x2end = XMAX, xNuEnd = YMAX / NU;
  const rot = -Math.atan2(2 * (PY1 - PY0) / YMAX, (PX1 - PX0) / XMAX) * 180 / Math.PI;
  return (
    <g>
      {/* axes + grid */}
      <g opacity={ax}>
        {Array.from({ length: XMAX + 1 }, (_, i) => (
          <g key={`x${i}`}>
            <line x1={gx(i)} x2={gx(i)} y1={PY0} y2={PY1} stroke="rgba(110,180,255,0.10)" strokeWidth={1.5} />
            <line x1={gx(i)} x2={gx(i)} y1={PY1} y2={PY1 + 10} stroke={K.muted} strokeWidth={2} />
            {T_(gx(i), PY1 + 38, i === 0 ? "1" : i === 1 ? "10" : `10${SUP[String(i)]}`, { a: "middle", size: 21, ls: 0 })}
          </g>
        ))}
        {Array.from({ length: YMAX / 3 + 1 }, (_, i) => (
          <g key={`y${i}`}>
            <line x1={PX0} x2={PX1} y1={gy(i * 3)} y2={gy(i * 3)} stroke="rgba(110,180,255,0.10)" strokeWidth={1.5} />
            {T_(PX0 - 14, gy(i * 3) + 7, String(i * 3), { a: "end", size: 21, ls: 0 })}
          </g>
        ))}
        <line x1={PX0} x2={PX0} y1={PY0 - 6} y2={PY1} stroke={K.muted} strokeWidth={2.4} />
        <line x1={PX0} x2={PX1} y1={PY1} y2={PY1} stroke={K.muted} strokeWidth={2.4} />
        {T_(PX0 + 12, PY0 - 22, "DIGITS CORRECT", { size: 20, c: K.muted })}
        {T_(PX1, PY1 + 78, "DENOMINATOR q  (log scale)", { size: 20, c: K.muted, a: "end" })}
      </g>
      {/* reference line: error = 1/q² → digits = 2·log₁₀ q */}
      <line x1={gx(0)} y1={gy(0)} x2={gx(x2end * lineP)} y2={gy(2 * x2end * lineP)} stroke={BLUE} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${BLUE}99)` }} />
      <g opacity={io(g, [T.plot + 34, T.plot + 48], [0, 1])}>
        {T_(gx(3.35), gy(6.7) + 44, "EXPONENT 2  ·  ERROR ≈ 1/q²", { c: BLUE, a: "middle", size: 21, w: 700, rot })}
      </g>
      {/* claim: 2+ε line, Q marker, empty zone */}
      <g opacity={zone}>
        <polygon points={`${gx(QX)},${gy(NU * QX)} ${gx(xNuEnd)},${gy(YMAX)} ${gx(QX)},${gy(YMAX)}`} fill={ACC} fillOpacity={0.14} stroke="none" />
        {Array.from({ length: 9 }, (_, i) => {
          const y0 = NU * QX + (i + 1) * 0.8; if (y0 >= YMAX) return null;
          const xa = QX, xb = Math.min(xNuEnd, QX + (YMAX - y0) / 1);
          return <line key={i} x1={gx(xa)} y1={gy(y0)} x2={gx(Math.min(xb, (y0) / NU > xb ? xb : xb))} y2={gy(Math.min(YMAX, y0 + (xb - xa)))} stroke={ACC} strokeOpacity={0.0} />;
        })}
        {T_(gx(4.75), gy(14.0), "NOTHING HERE", { c: ACC, a: "middle", size: 23, w: 700 })}
        {T_(gx(4.75), gy(14.0) + 28, "(CLAIMED)", { c: ACC, a: "middle", size: 20, w: 600 })}
      </g>
      <line x1={gx(0)} y1={gy(0)} x2={gx(xNuEnd * nuP)} y2={gy(YMAX * nuP)} stroke={ACC} strokeWidth={3.4} strokeDasharray="12 9" strokeLinecap="round" />
      <g opacity={nuP}>{T_(gx(xNuEnd) - 12, gy(YMAX) + 30, "2 + ε", { c: ACC, a: "end", size: 26, w: 700, ls: 1 })}</g>
      <line x1={gx(QX)} x2={gx(QX)} y1={PY1} y2={PY1 - (PY1 - PY0) * qP} stroke={ACC} strokeWidth={2.6} strokeDasharray="4 7" />
      <g opacity={qP}>
        {T_(gx(QX), PY0 - 22, "Q(ε)", { c: ACC, a: "middle", size: 26, w: 700, ls: 1 })}
        {T_(gx(QX) - 12, PY1 - 22, "EXISTS · NOT EXPLICIT", { c: ACC, a: "end", size: 19, w: 700, ls: 1 })}
      </g>
      {/* convergent points */}
      {pts.map((c) => {
        const t = land(c), p = ioB(g, t, t + 10), hero = c.q === 7 || c.q === 113;
        if (g < t) return null;
        const x = gx(c.log10q), y = gy(-c.log10err);
        const r = hero ? 13 : 8;
        const ring = hero ? io(g, [t, t + 22], [0, 1], easeOut) : 0;
        return (
          <g key={c.q} opacity={clamp01((g - t) / 3)}>
            {hero && <circle cx={x} cy={y} r={r + 30 * ring} fill="none" stroke={MINT} strokeWidth={3} opacity={(1 - ring) * 0.8} />}
            {hero && <line x1={x} x2={x} y1={y} y2={gy(2 * c.log10q)} stroke={MINT} strokeWidth={2.4} strokeDasharray="4 6" opacity={0.7 * io(g, [t + 6, t + 20], [0, 1])} />}
            <circle cx={x} cy={y} r={r * (0.5 + 0.5 * p)} fill={MINT} stroke={K.bgDeep} strokeWidth={2.4} />
          </g>
        );
      })}
      {/* labels for the two famous fractions */}
      {[{ c: c227, t: 142, lx: 232, ly: 1120, a: "start" as const }, { c: c355, t: 204, lx: gx(c355.log10q) - 24, ly: gy(-c355.log10err) - 26, a: "end" as const }].map(({ c, t, lx, ly, a }) => (
        <g key={c.q} opacity={io(g, [t + 8, t + 20], [0, 1])}>
          {T_(lx, ly, `${c.p}/${c.q}`, { c: MINT, a, size: 30, w: 700, ls: 1 })}
          {T_(lx, ly + 30, `μ ≈ ${f2(c.mu!)}`, { c: K.text, a, size: 24, w: 700, ls: 1 })}
        </g>
      ))}
      <g opacity={io(g, [T.plot + 138, T.plot + 150], [0, 1])}>
        {T_(PX1 - 10, PY1 - 40, `LATER ONES HUG THE LINE`, { c: MINT, a: "end", size: 22, w: 700 })}
        {T_(PX1 - 10, PY1 - 12, `μ ≈ ${f2(muLo)} – ${f2(muHi)}`, { c: K.text, a: "end", size: 24, w: 700 })}
      </g>
    </g>
  );
};

/* ───────────── scene 3: ratchet of published bounds → claim locks on 2 ───────────── */
const BOUNDS: { who: string; yr: string; v: number; txt: string }[] = [
  { who: "MAHLER", yr: "1953", v: 42, txt: "42" },
  { who: "MIGNOTTE", yr: "1974", v: 21, txt: "21" },
  { who: "HATA", yr: "1993", v: 8.01604539, txt: "8.016" },
  { who: "SALIKHOV", yr: "2008", v: 7.606308, txt: "7.606" },
  { who: "ZEILBERGER–ZUDILIN", yr: "2020", v: 7.103205334137, txt: "7.1032" },
];
const BX0 = 420, BX1 = 880, BMAX = 42, BY0 = 760, BSTEP = 92;
const bw = (v: number) => (v / BMAX) * (BX1 - BX0);
const FloorScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.floor;
  const rows = BOUNDS.length;
  const shrink = io(g, [a + 58, T.lock], [0, 1], easeInOut);              // claim bar slides from 7.1032 down to 2
  const val = 7.103205334137 + (2 - 7.103205334137) * shrink;
  const lockP = ioB(g, T.lock, T.lock + 12);
  const yClaim = BY0 + rows * BSTEP;
  return (
    <g>
      {T_(110, 716, "UPPER BOUNDS ON μ(π)  ·  SMALLER = TIGHTER", { c: K.muted, size: 21 })}
      {/* floor line at 2 */}
      <g opacity={io(g, [a + 2, a + 16], [0, 1])}>
        <line x1={BX0 + bw(2)} x2={BX0 + bw(2)} y1={BY0 - 30} y2={yClaim + 62} stroke={MINT} strokeWidth={3} strokeDasharray="8 8" />
        {T_(BX0 + bw(2) + 12, yClaim + 104, "FLOOR = 2", { c: MINT, size: 24, w: 700 })}
        {T_(BX0 + bw(2) + 12, yClaim + 136, "EVERY IRRATIONAL  ≥ 2", { c: K.muted, size: 19 })}
      </g>
      <line x1={BX0} x2={BX0} y1={BY0 - 30} y2={yClaim + 62} stroke={K.muted} strokeWidth={2.4} />
      {BOUNDS.map((b, i) => {
        const t = a + 8 + i * 6, p = io(g, [t, t + 18], [0, 1], easeOut), y = BY0 + i * BSTEP;
        return (
          <g key={b.who} opacity={clamp01(p * 3)}>
            {T_(110, y + 10, b.who, { c: K.text, size: b.who.length > 10 ? 18 : 22, w: 700, ls: 1 })}
            {T_(110, y + 40, b.yr, { c: K.muted, size: 20 })}
            <rect x={BX0} y={y - 20} width={Math.max(2, bw(b.v) * p)} height={44} rx={4} fill={BLUE} fillOpacity={0.32} stroke={BLUE} strokeWidth={2.4} />
            {T_(BX0 + bw(b.v) * p + 14, y + 12, `≤ ${b.txt}`, { c: BLUE, size: 28, w: 700, ls: 0.5 })}
          </g>
        );
      })}
      {/* the claim */}
      <g opacity={io(g, [a + 52, a + 62], [0, 1])}>
        {T_(110, yClaim + 10, "OPENAI CLAIM", { c: ACC, size: 22, w: 700, ls: 1 })}
        {T_(110, yClaim + 40, "2026", { c: K.muted, size: 20 })}
        <rect x={BX0} y={yClaim - 20} width={Math.max(2, bw(val))} height={44} rx={4} fill={ACC} fillOpacity={0.4} stroke={ACC} strokeWidth={3.2} style={{ filter: `drop-shadow(0 0 ${6 + 14 * lockP}px ${ACC}aa)` }} />
        {T_(BX0 + bw(val) + 14, yClaim + 12, shrink >= 1 ? "= 2  exactly" : `≤ ${f2(val, 4)}`, { c: ACC, size: 30, w: 700, ls: 0.5 })}
      </g>
      {/* hero readout */}
      <g opacity={clamp01((g - T.lock) / 5)} transform={`translate(0 ${(1 - lockP) * 24})`}>
        {T_(960, 1010, "μ(π)", { c: K.muted, a: "end", size: 30, w: 700 })}
        <text x={960} y={1130} textAnchor="end" fontFamily={K.mono} fontWeight={700} fontSize={150} fill={ACC} letterSpacing={-6} style={{ filter: `drop-shadow(0 0 18px ${ACC}88)` }}>= 2</text>
        {T_(960, 1176, "OPENAI'S CLAIM", { c: ACC, a: "end", size: 19, w: 700 })}
      </g>
      {/* lock ring */}
      {g >= T.lock && (
        <g>
          <circle cx={BX0 + bw(2)} cy={yClaim + 2} r={18 + 70 * io(g, [T.lock, T.lock + 22], [0, 1], easeOut)} fill="none" stroke={ACC} strokeWidth={4} opacity={1 - io(g, [T.lock, T.lock + 22], [0, 1])} />
        </g>
      )}
    </g>
  );
};

/* ───────────── scene 4: Flint–Hills partial sums ───────────── */
const FX0 = 190, FX1 = 984, FY0 = 860, FY1 = 1290, FXMAX = 8, FYMAX = 32;
const fx = (lx: number) => FX0 + (lx / FXMAX) * (FX1 - FX0);
const fy = (s: number) => FY1 - (s / FYMAX) * (FY1 - FY0);
const FhScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.fh;
  const cur = io(g, [a + 8, a + 44], [0, 1], easeInOut) * FXMAX;          // cursor in log10 N
  const pts = FH_PTS.filter((p) => Math.log10(p[0]) <= cur);
  let d = "";
  pts.forEach((p, i) => { d += `${i ? "L" : "M"} ${fx(Math.log10(Math.max(1, p[0]))).toFixed(1)} ${fy(p[1]).toFixed(1)} `; });
  const last = pts[pts.length - 1] ?? FH_PTS[0];
  const lastS = last[1];
  const nAnn = io(g, [a + 22, a + 30], [0, 1]);
  const fin = io(g, [a + 48, a + 60], [0, 1]);
  return (
    <g>
      <g opacity={io(g, [a + 2, a + 14], [0, 1])}>
        <text x={CX} y={738} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={50} fill={K.text} letterSpacing={0}>Σ  1 / (n³ sin² n)</text>
        {T_(CX, 784, "n IN RADIANS  ·  PARTIAL SUM  S(N)", { c: K.muted, a: "middle", size: 21 })}
      </g>
      {Array.from({ length: FXMAX + 1 }, (_, i) => (
        <g key={i}>
          <line x1={fx(i)} x2={fx(i)} y1={FY0} y2={FY1} stroke="rgba(110,180,255,0.10)" strokeWidth={1.5} />
          {T_(fx(i), FY1 + 36, i === 0 ? "1" : i === 1 ? "10" : `10${SUP[String(i)]}`, { a: "middle", size: 20, ls: 0 })}
        </g>
      ))}
      {[0, 10, 20, 30].map((v) => (
        <g key={v}>
          <line x1={FX0} x2={FX1} y1={fy(v)} y2={fy(v)} stroke="rgba(110,180,255,0.10)" strokeWidth={1.5} />
          {T_(FX0 - 14, fy(v) + 7, String(v), { a: "end", size: 21, ls: 0 })}
        </g>
      ))}
      <line x1={FX0} x2={FX0} y1={FY0 - 6} y2={FY1} stroke={K.muted} strokeWidth={2.4} />
      <line x1={FX0} x2={FX1} y1={FY1} y2={FY1} stroke={K.muted} strokeWidth={2.4} />
      {T_(FX1, FY1 + 78, "N  (log scale)", { size: 20, c: K.muted, a: "end" })}
      <path d={d} fill="none" stroke={BLUE} strokeWidth={4.4} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 7px ${BLUE}aa)` }} />
      <circle cx={fx(Math.log10(Math.max(1, last[0])))} cy={fy(lastS)} r={9} fill={BLUE} />
      {/* the n = 355 jump */}
      <g opacity={nAnn}>
        <line x1={fx(Math.log10(355))} x2={fx(Math.log10(355)) + 70} y1={fy(17)} y2={fy(17)} stroke={MINT} strokeWidth={2.4} />
        {T_(fx(Math.log10(355)) + 80, fy(17) - 8, "n = 355", { c: MINT, size: 28, w: 700 })}
        {T_(fx(Math.log10(355)) + 80, fy(17) + 24, `one term ≈ ${f2(T355, 1)}`, { c: K.text, size: 24, w: 700 })}
        {T_(fx(Math.log10(355)) + 80, fy(17) + 52, "(355/113 ≈ π)", { c: K.muted, size: 19 })}
      </g>
      <g opacity={fin}>
        {T_(FX1, fy(S_END) - 26, `S(10⁸) = ${f2(S_END, 4)}`, { c: K.text, a: "end", size: 30, w: 700, ls: 0.5 })}
      </g>
    </g>
  );
};

/* ───────────── scene 5: claim status card ───────────── */
const STATUS_ROWS: { k: string; v: string; sub?: string; t: number; kind: "ok" | "no" | "open" }[] = [
  { k: "SOURCE", v: "OpenAI · Sep 24, 2026", sub: "23-page manuscript", t: T.status + 28, kind: "ok" },
  { k: "MADE BY", v: "internal OpenAI model", sub: "~3 h compute / result", t: T.status + 44, kind: "ok" },
  { k: "THRESHOLD Q(ν)", v: "not explicit", sub: "paper: argument is not effective", t: T.status + 60, kind: "open" },
  { k: "PEER REVIEW", v: "none yet", sub: "", t: 676, kind: "no" },
  { k: "LEAN FILES", v: "published in the repo", sub: "OAI/NumberTheory/PiExponent", t: 724, kind: "ok" },
  { k: "OUR CHECK", v: "not run", sub: "we have not compiled them", t: 771, kind: "no" },
];
const Icon: React.FC<{ kind: "ok" | "no" | "open"; x: number; y: number; p: number }> = ({ kind, x, y, p }) => {
  const c = kind === "ok" ? MINT : kind === "no" ? CORAL : ACC;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.5 + 0.5 * p})`} opacity={clamp01(p * 2)}>
      <circle r={22} fill="rgba(3,11,24,0.9)" stroke={c} strokeWidth={3.4} />
      {kind === "ok" && <path d="M -9 1 L -3 8 L 10 -8" fill="none" stroke={c} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />}
      {kind === "no" && <path d="M -8 -8 L 8 8 M 8 -8 L -8 8" fill="none" stroke={c} strokeWidth={4.4} strokeLinecap="round" />}
      {kind === "open" && <path d="M -9 0 L 9 0" fill="none" stroke={c} strokeWidth={4.4} strokeLinecap="round" />}
    </g>
  );
};
const StatusScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.status, y0 = 818, st = 82;
  const card = io(g, [a + 2, a + 18], [0, 1], easeOut);
  return (
    <g>
      <rect x={100} y={700} width={880} height={600} rx={14} fill="rgba(3,11,24,0.7)" stroke={ACC} strokeWidth={3} opacity={card} />
      <g opacity={card}>
        {T_(140, 752, "THE IRRATIONALITY EXPONENT OF π IS 2", { c: ACC, size: 24, w: 700, ls: 2 })}
        <line x1={140} x2={940} y1={776} y2={776} stroke={K.lineDim} strokeWidth={2} />
      </g>
      {STATUS_ROWS.map((r, i) => {
        const p = ioB(g, r.t, r.t + 12), y = y0 + 20 + i * st;
        const c = r.kind === "ok" ? MINT : r.kind === "no" ? CORAL : ACC;
        return (
          <g key={r.k} opacity={clamp01((g - r.t) / 4)}>
            <Icon kind={r.kind} x={176} y={y + 4} p={p} />
            {T_(222, y - 8, r.k, { c: K.muted, size: 20, w: 600 })}
            {T_(222, y + 30, r.v, { c: r.kind === "ok" ? K.text : c, size: 32, w: 700, ls: 0.5 })}
            {r.sub && T_(940, y + 28, r.sub, { c: K.muted, size: 17, a: "end", ls: 0.5 })}
          </g>
        );
      })}
    </g>
  );
};

/* ───────────── composition of the shot ───────────── */
export const PiShot: React.FC = () => {
  const g = useCurrentFrame();
  const sHook = win(g, -40, 132, 1, 10), sPlot = win(g, 126, 396, 8, 8), sFloor = win(g, 386, 529, 8, 8), sFh = win(g, 519, 599, 8, 8), sSt = win(g, 589, 810, 8, 10);
  const fade = io(g, [T.end - 6, T.end + 2], [0, 1]);
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Headline f={g} lines={["OpenAI *claims*", "a new result on *π*"]} at={-30} exitAt={120} size={96} accent={ACC} />
      <Headline f={g} lines={["How close can a", "fraction *get*?"]} at={T.plot + 4} exitAt={T.claim - 14} size={96} accent={ACC} />
      <Headline f={g} lines={["Past some size,", "none beats *exponent 2*"]} at={T.claim - 2} exitAt={T.floor - 8} size={84} accent={ACC} />
      <Headline f={g} lines={["The floor is *2*", "so π is *hardest*"]} at={T.floor + 4} exitAt={T.fh - 8} size={96} accent={ACC} />
      <Headline f={g} lines={["Consequence:", "*Flint–Hills* converges"]} at={T.fh + 4} exitAt={T.status - 8} size={84} accent={ACC} />
      <Headline f={g} lines={["*Claim* status"]} at={T.status + 4} exitAt={T.end - 14} size={110} accent={ACC} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <g opacity={sHook}><HookScene g={g} /></g>
        <g opacity={sPlot}><PlotScene g={g} /></g>
        <g opacity={sFloor}><FloorScene g={g} /></g>
        <g opacity={sFh}><FhScene g={g} /></g>
        <g opacity={sSt}><StatusScene g={g} /></g>
      </svg>

      <Panel o={pn(-40, 130)} h={92}>
        <Row size={23}><Hl c={ACC}>π</Hl><span>= 3.14159265358979…</span><span style={{ opacity: 0.4 }}>|</span><Hl c={MINT}>22/7</Hl><span>·</span><Hl c={MINT}>355/113</Hl></Row>
      </Panel>
      <Panel o={pn(126, 278)} h={118}>
        <Row size={25}><span>μ = ln(1/error) / ln q</span><span>:</span><Hl c={MINT}>22/7 {f2(c227.mu!)}</Hl><span>·</span><Hl c={MINT}>355/113 {f2(c355.mu!)}</Hl></Row>
        <Row size={20}><span>FINITE EXCEPTIONS · CONVERGENTS OF π (CONTINUED FRACTION)</span></Row>
      </Panel>
      <Panel o={pn(268, 396)} h={118}>
        <Row size={25}><span>∀ ν &gt; 2 ∃ Q :</span><Hl c={ACC}>|π − p/q| ≥ q⁻ᵛ</Hl><span>for q ≥ Q</span></Row>
        <Row size={20}><span>THEOREM 1.1 (CLAIMED) · ν = 2 + ε FOR ANY ε &gt; 0</span></Row>
      </Panel>
      <Panel o={pn(386, 529)} h={118}>
        <Row size={25}><span>μ(π) =</span><Hl c={ACC}>2</Hl><span>· PIGEONHOLE: EVERY IRRATIONAL ≥ 2</span></Row>
        <Row size={19}><span>BOUNDS FROM THE PAPER §1.1 · BEST PUBLISHED BEFORE: 7.1032</span></Row>
      </Panel>
      <Panel o={pn(519, 599)} h={118}>
        <Row size={25}><span>N = 10⁸ TERMS ·</span><Hl c={MINT}>S = {f2(S_END, 4)}</Hl><span>· FLATTENS OUT</span></Row>
        <Row size={20}><span>CONVERGENCE FOLLOWS FROM THE CLAIM (COR. 1.2)</span></Row>
      </Panel>
      <Panel o={pn(589, 810)} h={118}>
        <Row size={24}><Hl c={ACC}>CLAIMED</Hl><span>·</span><Hl c={CORAL}>NOT PEER REVIEWED</Hl><span>·</span><Hl c={MINT}>LEAN IN REPO</Hl></Row>
        <Row size={19}><span>SOURCES: PAPER (SEP 24 2026) · github.com/openai/math</span></Row>
      </Panel>
      <Tag f={g} at={T.stamp - 2} text="CLAIM · NOT YET CHECKED" x={540} y={1356} color={ACC} solid size={24} out={T.end - 14} />
    </div>
  );
};

/* ────────── end card (same pattern as #10–#12, series accent) ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const m_ = 18, cd = (m_ * 23) / 2, cx = 540 - cd * 0.17, cy = 1085 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={f} lines={["Follow for", "*more*"]} at={2} top={380} size={118} accent={ACC} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1020px", opacity: clamp01(p) }}>
        <Gear N={14} m={m_} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} accent={ACC} />
        <Gear N={9} m={m_} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} accent={ACC} />
        <Gear N={9} m={m_} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} accent={ACC} />
      </div>
      <Tag f={f} at={8} text="FOLLOW  +" x={540} y={1330} color={ACC} solid size={32} />
      <Label f={f} at={64} text="AKS PRODUCTIONS" x={540} y={1410} size={30} align="center" color={K.text} />
      <Label f={f} at={78} text="AI MATH · @DEAD.SIMPLE.ENGINEERING" x={540} y={1466} size={20} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: ACC }}>AI MATH · 01</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 124, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>Hardest to</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 124, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>approximate</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 92, lineHeight: 1.1, color: ACC }}>π, OpenAI claims</div>
    </div>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Frame />
      <g transform="translate(0 24)"><PlotScene g={T.claim + 120} /></g>
    </svg>
  </>
);
export { easeInOut, easeOut };
