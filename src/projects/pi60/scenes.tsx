import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Tag, clamp01, ioB, meshPhase, W, H } from "../gearbox/kit";
import { P } from "../pi/theme";
import data from "./data.json";

/**
 * AI MATH #01 (60 s, plain language) — "Is π secretly almost a fraction?"     1080×1920 · 30 fps · 1800 frames · frame 0 is a finished hook
 *
 * ONE RUNNING ANALOGY: a fraction is a *guess* for π. Each guess gets a CLOSENESS SCORE (= digits it gets right, compared with how big its
 * numbers are; maths name: effective irrationality exponent μ = ln(1/error)/ln q). Score 2 is NORMAL (every number gets fractions that good for
 * free — Dirichlet/pigeonhole). Above 2 = lucky. A number that really hides behind fractions has scores that climb forever. OpenAI's claim: for π,
 * past some size, nobody beats 2. And 2 is the lowest score possible, so π is as un-fraction-like as a number can be.
 *
 * BEATS (global frames; VO phrase starts from public/projects/pi60/vo.json — keep in sync with soundtrack.py)
 *   0    hook      "OpenAI claims its AI just settled an old question about pi."          big π, digits stream (never end), CLAIM pill
 *   127  guess     "Pi never ends, | so we guess it with a fraction. | 22/7: | close, | not exact."   π digits row → "fraction = one number ÷ another" →
 *                  number line (window 3.140–3.144): π, 22/7 pin drops (214), gap bracket (256), "NOT EXACT" off by 0.0013 (277)
 *   306  better    "355/113: | six decimals right, | from tiny numbers."                  zoom ×2,500: 22/7 flies off, 355/113 peels off π;
 *                  digit rows: 3.141592 matches (370); "only 3-digit numbers" (410)
 *   447  question  "Is pi secretly almost a fraction? | Do fractions keep landing this close, | forever?"   big π ≈ ?/? (447) → pins converge on π, then "?" (519–581)
 *   602  score     "Give each fraction a closeness score. | Two is normal. | Anything higher is luck."   score scale 0–6; example bar fills to 2 (666) → 3.6 lucky (701)
 *   743  lucky     "22/7: | 3.4. | 355/113: | 3.2. | After that: | about two."           bars from computed data; next 8 best fractions sit at ~2 (957)
 *   982  fake      "Some numbers do hide behind fractions. | This made-up one's score climbs forever."   0.1100010…: cut-offs score 2,3,4,5,… no limit (1056+)
 *   1119 claim     "OpenAI claims pi isn't like that. | Past some size, | no fraction scores above two."   size-vs-score plot from data; empty zone (1226)
 *   1279 floor     "Two is the lowest score possible. | So pi is as far from a fraction as it gets."   impossible zone below 2; π marker slides down, locks on 2 (1390, hero)
 *   1417 honest    "Big if. | Outside mathematicians haven't checked OpenAI's claim yet. | proof files are public; | we haven't checked those either."   status card
 *   1680 end       "Follow for more." (VO at 1692)
 * Everything is a pure function of the frame. Numbers come from data.json (make_data.py, mpmath).
 */

export const T = { guess: 127, better: 306, question: 447, score: 602, lucky: 743, fake: 982, claim: 1119, floor: 1279, lock: 1390, honest: 1417, end: 1680, total: 1800 };
export const CUTS = [0, T.guess, T.better, T.question, T.score, T.lucky, T.fake, T.claim, T.floor, T.honest, T.end];

const ACC = P.acc, MINT = P.mint, CORAL = P.coral, BLUE = P.blue;
const win = (g: number, a: number, b: number, fi = 6, fo = 6) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const sm = (x: number, a: number, b: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const f1 = (x: number) => x.toFixed(1);
const f2 = (x: number) => x.toFixed(2);
const CX = 540;

/* ───────────── computed data ───────────── */
type Conv = { p: number; q: number; err: number; mu: number | null; off: number; digits_right: number; normal_digits: number; log10q: number };
const CV = data.conv as Conv[];
const c227 = CV.find((c) => c.q === 7)!, c355 = CV.find((c) => c.q === 113)!;
const LATER = CV.filter((c) => c.q > 113 && c.q < 2_000_000);             // 103993/33102 … 5419351/1725033  (8 fractions)
const muLo = Math.min(...LATER.map((c) => c.mu!)), muHi = Math.max(...LATER.map((c) => c.mu!));
const PI_DIGITS = data.pi_digits as string;                              // "3.14159…"
const F355 = (() => { // 355/113 to 40 decimals by long division
  let r = 355 % 113, s = "3."; for (let i = 0; i < 40; i++) { r *= 10; s += Math.floor(r / 113); r %= 113; } return s;
})();
const F227 = (() => { let r = 22 % 7, s = "3."; for (let i = 0; i < 40; i++) { r *= 10; s += Math.floor(r / 7); r %= 7; } return s; })();
const LIO = data.lio as { n: number; qdigits: number; p: string | null; mu: number }[];
const LIO_STR = data.lio_str as string;

/* ───────────── small drawing helpers ───────────── */
const Panel: React.FC<{ o: number; children: React.ReactNode; h?: number }> = ({ o, children, h = 116 }) => (
  <div style={{ position: "absolute", left: 70, width: 940, top: 1424, height: h, opacity: o, borderRadius: 12, border: `2px solid ${K.lineDim}`, background: "rgba(3,11,24,0.82)", boxSizing: "border-box", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: K.head, fontWeight: 600, fontSize: 35, lineHeight: 1.18, color: K.text }}>
    <div>{children}</div>
  </div>
);
const Hl: React.FC<{ c: string; children: React.ReactNode }> = ({ c, children }) => <span style={{ color: c, fontWeight: 700 }}>{children}</span>;
const Frame: React.FC = () => (
  <g>
    {[[60, 664, 1, 1], [1020, 664, -1, 1], [60, 1396, 1, -1], [1020, 1396, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={K.lineDim} strokeWidth={2.4} />
    ))}
    <rect x={60} y={664} width={960} height={732} fill="rgba(3,11,24,0.32)" stroke="rgba(92,211,255,0.10)" strokeWidth={1.5} />
  </g>
);
type TO = { halo?: boolean; size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number; sans?: boolean; it?: boolean };
const T_ = (x: number, y: number, s: string, o: TO = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={o.sans ? K.head : K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 28} letterSpacing={o.ls ?? (o.sans ? -0.5 : (o.size ?? 28) * 0.06)}
    fill={o.c ?? K.muted} opacity={o.op ?? 1} fontStyle={o.it ? "italic" : undefined}
    {...(o.halo ? { stroke: "#071730", strokeWidth: 12, paintOrder: "stroke", strokeLinejoin: "round" as const } : {})}>{s}</text>
);
const Pill: React.FC<{ x: number; y: number; text: string; c: string; size?: number; o?: number; solid?: boolean; s?: number }> = ({ x, y, text, c, size = 28, o = 1, solid, s = 1 }) => {
  const w = text.length * size * 0.62 + size * 1.5, h = size * 1.9;
  return (
    <g opacity={o} transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? c : "rgba(6,20,42,0.9)"} stroke={c} strokeWidth={2.6} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.06} fill={solid ? K.bgDeep : c}>{text}</text>
    </g>
  );
};
const Bar: React.FC<{ x0: number; y: number; w: number; h?: number; c: string; glow?: number }> = ({ x0, y, w, h = 44, c, glow = 0 }) => (
  <rect x={x0} y={y - h / 2} width={Math.max(0, w)} height={h} rx={4} fill={c} fillOpacity={0.36} stroke={c} strokeWidth={3} style={glow ? { filter: `drop-shadow(0 0 ${glow}px ${c}cc)` } : undefined} />
);

/* ───────────── scene 0: hook ───────────── */
const HookScene: React.FC<{ g: number }> = ({ g }) => {
  const scroll = g * 2.4;
  const s = 1 + 0.015 * Math.sin(g / 18);
  const ring = (k: number) => { const t = ((g + k * 40) % 120) / 120; return <circle key={k} cx={CX} cy={960} r={150 + 230 * t} fill="none" stroke={ACC} strokeWidth={2.4} opacity={0.35 * (1 - t)} />; };
  return (
    <g>
      <defs>
        <linearGradient id="hk" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="0.12" stopColor="#fff" stopOpacity={1} /><stop offset="0.88" stopColor="#fff" stopOpacity={1} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></linearGradient>
        <mask id="hkm"><rect x={60} y={1170} width={960} height={90} fill="url(#hk)" /></mask>
      </defs>
      {[0, 1, 2].map(ring)}
      <g transform={`translate(${CX} 960) scale(${s})`}>
        <circle r={150} fill="rgba(3,11,24,0.7)" stroke={ACC} strokeWidth={4} style={{ filter: `drop-shadow(0 0 22px ${ACC}88)` }} />
        <text x={0} y={72} textAnchor="middle" fontFamily={K.serif} fontStyle="italic" fontSize={210} fill={ACC}>π</text>
      </g>
      <g mask="url(#hkm)">
        <text x={90 - scroll} y={1232} fontFamily={K.mono} fontWeight={700} fontSize={56} letterSpacing={4} fill={K.text}>{PI_DIGITS.slice(0, 64)}</text>
      </g>
      {T_(CX, 1300, "THE DIGITS NEVER END", { c: K.muted, a: "middle", size: 28, op: io(g, [40, 60], [0, 1]) })}
      <Pill x={CX} y={738} text="OPENAI'S CLAIM" c={ACC} size={32} solid />
      <g opacity={io(g, [70, 86], [0, 1])}>
        <Pill x={CX} y={1366} text="AN OLD PUZZLE" c={MINT} size={30} />
      </g>
    </g>
  );
};

/* ───────────── scenes 1+2: number line (22/7 → zoom → 355/113) ───────────── */
const AXY = 1140, HALF = 430;
const DC0 = 3.142 - 3.14159265358979;                                // window centre sits 0.000407 above π at the start
const ZOOM_A = T.better, ZOOM_B = T.better + 62;
const lineView = (g: number) => {
  const e = easeInOut(clamp01((g - ZOOM_A) / (ZOOM_B - ZOOM_A)));
  const w0 = 0.002, w1 = 8e-7;
  const w = w0 * Math.pow(w1 / w0, e);
  const dc = w * (DC0 / w0) * (1 - e);                                  // π drifts from x≈452 to the centre
  return { w, dc, pxPer: HALF / w, e };
};
const NumberLine: React.FC<{ g: number }> = ({ g }) => {
  const { w, dc, pxPer, e } = lineView(g);
  const X = (off: number) => CX + (off - dc) * pxPer;
  const ticks: React.ReactNode[] = [];
  for (let m = 3; m <= 7; m++) {
    const step = 10 ** -m, spacing = step * pxPer, op = sm(spacing, 10, 34);
    if (op <= 0.01) continue;
    const scaled = Number(PI_DIGITS.slice(0, 2 + m).replace(".", "")), r = Number("0." + PI_DIGITS.slice(2 + m));
    const kmin = Math.ceil(dc / step + r - w / step) - 1, kmax = Math.floor(dc / step + r + w / step) + 1;
    if (kmax - kmin > 80) continue;
    const lop = sm(spacing, 150, 230);
    for (let k = kmin; k <= kmax; k++) {
      const off = (k - r) * step, x = X(off);
      if (x < 112 || x > 968) continue;
      const edge = sm(x, 112, 160) * (1 - sm(x, 920, 968));
      ticks.push(
        <g key={`${m}_${k}`} opacity={op * edge}>
          <line x1={x} x2={x} y1={AXY} y2={AXY + 16} stroke={K.muted} strokeWidth={2.2} />
          {lop > 0.02 && <text x={x} y={AXY + 56} textAnchor="middle" fontFamily={K.mono} fontWeight={600} fontSize={26} fill={K.muted} opacity={lop}>{((scaled + k) / 10 ** m).toFixed(m)}</text>}
        </g>,
      );
    }
  }
  const edgeO = (x: number) => sm(x, 112, 170) * (1 - sm(x, 910, 968));
  const x227 = X(c227.off), x355 = X(c355.off), xpi = X(0);
  const pin = (x: number, label: string, o: number, labelO: number) => (
    <g>
      <g opacity={o * edgeO(x)}>
        <line x1={x} x2={x} y1={AXY - 70} y2={AXY + 8} stroke={MINT} strokeWidth={3.6} />
        <circle cx={x} cy={AXY} r={10} fill={MINT} />
      </g>
      <g opacity={labelO * o * edgeO(x)}>
        <line x1={x} x2={x + 14} y1={AXY - 70} y2={AXY - 96} stroke={MINT} strokeWidth={2.2} />
        {T_(x + 20, AXY - 92, label, { c: MINT, size: 40, w: 700, ls: 0 })}
      </g>
    </g>
  );
  const bracket = (xa: number, xb: number, o: number, label: string, sub?: string) => (
    <g opacity={o}>
      <line x1={xa} x2={xb} y1={AXY + 112} y2={AXY + 112} stroke={CORAL} strokeWidth={4} />
      <line x1={xa} x2={xa} y1={AXY + 98} y2={AXY + 126} stroke={CORAL} strokeWidth={4} />
      <line x1={xb} x2={xb} y1={AXY + 98} y2={AXY + 126} stroke={CORAL} strokeWidth={4} />
      {T_((xa + xb) / 2, AXY + 160, label, { c: CORAL, a: "middle", size: 36, w: 700, ls: 0.5 })}
      {sub && T_((xa + xb) / 2, AXY + 204, sub, { c: K.muted, a: "middle", size: 26 })}
    </g>
  );
  const dropIn = (t0: number) => { const p = ioB(g, t0, t0 + 14); return { o: clamp01((g - t0) / 4), dy: (1 - p) * -90 }; };
  const d227 = dropIn(214), d355 = dropIn(ZOOM_A + 2);
  const guessPhase = g < ZOOM_A;
  const sepPi355 = Math.abs(x355 - xpi);
  const lblPin355 = sm(sepPi355, 60, 100);
  const b227o = guessPhase ? io(g, [256, 270], [0, 1]) : (1 - sm(x227, 880, 960));
  const b355o = io(g, [ZOOM_B - 14, ZOOM_B + 4], [0, 1]) * sm(sepPi355, 80, 120);
  const lineOn = io(g, [T.guess + 36, T.guess + 56], [0, 1], easeOut);
  return (
    <g>
      <g opacity={lineOn}>
        <line x1={110} x2={970} y1={AXY} y2={AXY} stroke={BLUE} strokeWidth={4} />
        {ticks}
        {/* π marker */}
        <line x1={xpi} x2={xpi} y1={AXY - 110} y2={AXY + 20} stroke={ACC} strokeWidth={5} />
        <circle cx={xpi} cy={AXY} r={12} fill={ACC} />
        {T_(xpi, AXY - 124, "π", { c: ACC, a: "middle", size: 54, w: 700, ls: 0 })}
      </g>
      <g transform={`translate(0 ${d227.dy})`}>{pin(x227, "22/7", d227.o, guessPhase ? 1 : 1 - sm(x227, 760, 900))}</g>
      <g transform={`translate(0 ${d355.dy})`}>{g >= ZOOM_A && pin(x355, "355/113", d355.o, lblPin355)}</g>
      {bracket(xpi, x227, b227o, "gap: 0.0013", g >= 277 ? "NOT EXACT" : undefined)}
      {bracket(xpi, x355, b355o, "gap: 0.00000027")}
      {/* zoom readout */}
      <g opacity={io(g, [ZOOM_A, ZOOM_A + 8], [0, 1]) * (1 - io(g, [T.question - 10, T.question], [0, 1]))}>
        {T_(960, AXY - 196, `ZOOM ×${Math.round(0.002 / w).toLocaleString("en-US")}`, { c: K.muted, a: "end", size: 30, w: 700 })}
      </g>
      {void e}
    </g>
  );
};
/* digits rows shared by scenes 1+2 */
const DIG_X = 340, DIG_SZ = 46, CW = DIG_SZ * 0.6 + DIG_SZ * 0.04;
const DigitsRows: React.FC<{ g: number }> = ({ g }) => {
  const nPi = Math.floor(io(g, [T.guess + 2, T.guess + 34], [3, 17], (t) => t));
  const piStr = PI_DIGITS.slice(0, 17);
  const guessPhase = g < T.better + 6;
  const rowFrac = guessPhase ? "22/7" : "355/113";
  const fStr = (guessPhase ? F227 : F355).slice(0, 17);
  const fO = guessPhase ? io(g, [214, 226], [0, 1]) : io(g, [T.better + 6, T.better + 18], [0, 1]);
  const match = io(g, [370, 384], [0, 1], easeOut);
  const mCount = 8;                                      // "3.141592"
  const row = (y: number, label: string, col: string, str: string, n: number, o: number, isFrac: boolean) => (
    <g opacity={o}>
      {T_(DIG_X - 20, y, label, { c: col, a: "end", size: 40, w: 700, ls: 0 })}
      {isFrac && !guessPhase && <rect x={DIG_X - 4} y={y - 40} width={mCount * CW + 4} height={56} rx={6} fill={MINT} fillOpacity={0.16 * match} />}
      {!isFrac && <rect x={DIG_X - 4} y={y - 40} width={mCount * CW + 4} height={56} rx={6} fill={MINT} fillOpacity={0.16 * match * (guessPhase ? 0 : 1)} />}
      <text x={DIG_X} y={y} fontFamily={K.mono} fontWeight={700} fontSize={DIG_SZ} letterSpacing={DIG_SZ * 0.04} fill={K.text}>
        {str.slice(0, n).split("").map((ch, i) => <tspan key={i} fill={!guessPhase && i >= mCount ? CORAL : K.text} fillOpacity={!guessPhase && i >= mCount ? 1 : 1}>{ch}</tspan>)}
        {!isFrac && n >= 17 && <tspan fill={K.muted}>…</tspan>}
        {isFrac && <tspan fill={K.muted}>…</tspan>}
      </text>
    </g>
  );
  return (
    <g>
      {row(780, "π", ACC, piStr, nPi, 1, false)}
      {row(852, rowFrac, MINT, fStr, 17, fO, true)}
      {/* never-ends hint */}
      <g opacity={io(g, [T.guess + 20, T.guess + 34], [0, 1]) * (1 - io(g, [T.guess + 60, T.guess + 72], [0, 1]))}>
        {T_(CX, 920, "…and on forever, no pattern", { c: K.muted, a: "middle", size: 30 })}
      </g>
      {/* what a fraction is */}
      <g opacity={io(g, [T.guess + 36, T.guess + 48], [0, 1]) * (1 - io(g, [208, 216], [0, 1])) * (g < T.better ? 1 : 0)}>
        <Pill x={CX} y={918} text="FRACTION = ONE NUMBER ÷ ANOTHER" c={MINT} size={27} />
      </g>
      <g opacity={io(g, [226, 238], [0, 1]) * (g < T.better ? 1 : 0)}>
        {T_(CX, 924, "22 ÷ 7  =  3.142857…", { c: MINT, a: "middle", size: 34, w: 700 })}
      </g>
      {/* better scene annotations */}
      <g opacity={match}>
        <line x1={DIG_X} x2={DIG_X + mCount * CW - 8} y1={900} y2={900} stroke={MINT} strokeWidth={4} />
        {T_(DIG_X + (mCount * CW) / 2 - 4, 944, "6 DECIMALS RIGHT", { c: MINT, a: "middle", size: 30, w: 700 })}
      </g>
      <g opacity={io(g, [410, 424], [0, 1]) * (1 - io(g, [T.question - 10, T.question], [0, 1]))}>
        <Pill x={CX} y={1362} text="TINY NUMBERS: JUST 355 ÷ 113" c={MINT} size={28} solid />
      </g>
    </g>
  );
};

/* ───────────── scene 3: the question ───────────── */
const QuestionScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.question;
  const bigO = io(g, [a, a + 14], [0, 1]) * (1 - io(g, [a + 70, a + 84], [0, 1]) * 0.0);
  const pop = ioB(g, a + 2, a + 22);
  const AY = 1130;
  const pins: { off: number; label: string; t: number; solid: boolean }[] = [
    { off: 330, label: "22/7", t: 526, solid: true }, { off: 126, label: "355/113", t: 546, solid: true },
    { off: 48, label: "?", t: 562, solid: false }, { off: 18, label: "", t: 574, solid: false }, { off: 7, label: "", t: 586, solid: false },
  ];
  const lineO = io(g, [a + 12, a + 28], [0, 1]);
  const dots = io(g, [596, 604], [0, 1]);
  return (
    <g>
      <g opacity={bigO} transform={`translate(0 ${(1 - pop) * 26})`}>
        <text x={330} y={870} textAnchor="middle" fontFamily={K.serif} fontStyle="italic" fontSize={230} fill={ACC} style={{ filter: `drop-shadow(0 0 20px ${ACC}77)` }}>π</text>
        <text x={470} y={858} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={120} fill={K.text}>≈</text>
        {/* a ghost fraction  ? over ?  */}
        <g opacity={0.5 + 0.5 * Math.sin(g / 6) * Math.sin(g / 6)}>
          <text x={690} y={812} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={120} fill={ACC}>?</text>
          <line x1={610} x2={770} y1={836} y2={836} stroke={ACC} strokeWidth={8} strokeDasharray="14 10" />
          <text x={690} y={940} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={120} fill={ACC}>?</text>
        </g>
      </g>
      <g opacity={lineO}>
        <line x1={110} x2={970} y1={AY} y2={AY} stroke={BLUE} strokeWidth={4} />
        <line x1={CX} x2={CX} y1={AY - 150} y2={AY + 20} stroke={ACC} strokeWidth={5} />
        <circle cx={CX} cy={AY} r={12} fill={ACC} />
        {T_(CX - 24, AY - 120, "π", { c: ACC, a: "end", size: 58, w: 700, ls: 0 })}
      </g>
      {pins.map((p, i) => {
        const pr = ioB(g, p.t, p.t + 14), o = clamp01((g - p.t) / 4), x = CX + p.off, dy = (1 - pr) * -80;
        const c = p.solid ? MINT : ACC;
        return (
          <g key={i} opacity={o} transform={`translate(0 ${dy})`}>
            <line x1={x} x2={x} y1={AY - 70} y2={AY + 8} stroke={c} strokeWidth={3.6} strokeDasharray={p.solid ? undefined : "7 6"} />
            <circle cx={x} cy={AY} r={10} fill={p.solid ? c : "none"} stroke={c} strokeWidth={3.2} />
            {p.label && <g><line x1={x} x2={x + 14} y1={AY - 70} y2={AY - 96} stroke={c} strokeWidth={2.2} />{T_(x + 20, AY - 92, p.label, { c, size: p.solid ? 38 : 56, w: 700, ls: 0 })}</g>}
          </g>
        );
      })}
      <g opacity={dots}>
        {T_(CX - 30, AY + 100, "closer and closer…", { c: ACC, a: "end", size: 36, w: 700, ls: 0, sans: true })}
        <path d={`M ${CX - 14} ${AY + 88} h 70 m -16 -14 l 16 14 l -16 14`} fill="none" stroke={ACC} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {T_(CX + 74, AY + 100, "forever?", { c: ACC, size: 38, w: 700, ls: 0, sans: true })}
      </g>
      <g opacity={io(g, [a + 12, a + 28], [0, 1]) * (1 - io(g, [519, 527], [0, 1]))}>
        <circle cx={CX} cy={AY} r={34 + 10 * Math.sin(g / 5)} fill="none" stroke={ACC} strokeWidth={3} strokeDasharray="6 7" />
        {T_(CX, AY + 120, "a number hiding behind fractions?", { c: ACC, a: "middle", size: 38, w: 700, ls: 0, sans: true })}
      </g>
      <g opacity={io(g, [a + 66, a + 82], [0, 1])}>
        {T_(CX, AY + 190, "(? = made-up guesses, not real fractions)", { c: K.muted, a: "middle", size: 26 })}
      </g>
    </g>
  );
};

/* ───────────── scenes 4–6: the score board (score → lucky → made-up number) ───────────── */
const SX0 = 340, SX1 = 984, SMAX = 6;
const sx = (v: number) => SX0 + (v / SMAX) * (SX1 - SX0);
const AXIS_Y = 1368;
const ScoreAxis: React.FC<{ g: number }> = ({ g }) => {
  const a = T.score;
  const ax = io(g, [a, a + 14], [0, 1], easeOut);
  const nl = io(g, [a + 62, a + 78], [0, 1], easeOut);
  const lz = io(g, [701, 720], [0, 1], easeOut);
  return (
    <g>
      <g opacity={ax}>
        {Array.from({ length: SMAX + 1 }, (_, i) => (
          <g key={i}>
            <line x1={sx(i)} x2={sx(i)} y1={742} y2={AXIS_Y} stroke="rgba(110,180,255,0.12)" strokeWidth={1.5} />
            {T_(sx(i), AXIS_Y + 36, String(i), { a: "middle", size: 30, ls: 0 })}
          </g>
        ))}
        <line x1={SX0} x2={SX1} y1={AXIS_Y} y2={AXIS_Y} stroke={K.muted} strokeWidth={2.6} />
        {T_(100, 722, "CLOSENESS SCORE", { c: K.text, size: 30, w: 700 })}
      </g>
      {/* lucky zone (right of 2) */}
      <rect x={sx(2)} y={742} width={SX1 - sx(2)} height={AXIS_Y - 742} fill={ACC} fillOpacity={0.09 * lz} />
      <g opacity={lz}>{T_(SX1 - 6, 722, "LUCKY ZONE", { c: ACC, a: "end", size: 28, w: 700 })}</g>
      {/* normal line */}
      <g opacity={nl}>
        <line x1={sx(2)} x2={sx(2)} y1={742} y2={AXIS_Y} stroke={BLUE} strokeWidth={5} strokeDasharray="14 9" style={{ filter: `drop-shadow(0 0 8px ${BLUE}99)` }} />
        {T_(sx(2) - 12, 722, "NORMAL", { c: BLUE, a: "end", size: 30, w: 700 })}
      </g>
    </g>
  );
};
const ScoreContent: React.FC<{ g: number }> = ({ g }) => {
  const a = T.score;
  const fill2 = io(g, [666, 692], [0, 1], easeOut), fill3 = io(g, [704, 730], [0, 1], easeOut);
  const val = 2 * fill2 + 1.6 * fill3;
  return (
    <g opacity={win(g, a, T.lucky + 2, 8, 8)}>
      <g opacity={io(g, [a + 8, a + 22], [0, 1])}>
        <rect x={80} y={760} width={920} height={134} rx={10} fill="#071730" fillOpacity={0.94} />
        {T_(CX, 810, "digits it gets right,", { c: K.text, a: "middle", size: 42, w: 600, sans: true })}
        {T_(CX, 866, "compared with how big its numbers are", { c: K.text, a: "middle", size: 42, w: 600, sans: true })}
      </g>
      <g opacity={io(g, [a + 20, a + 34], [0, 1])}>
        {T_(100, 1036, "EXAMPLE", { c: K.muted, size: 26, w: 700 })}
        {T_(100, 1068, "FRACTION", { c: K.muted, size: 26, w: 700 })}
        <rect x={SX0} y={1020} width={SX1 - SX0} height={44} rx={4} fill="none" stroke={K.lineDim} strokeWidth={2} strokeDasharray="3 6" />
      </g>
      <g opacity={io(g, [a + 26, a + 38], [0, 1]) * (1 - io(g, [666, 676], [0, 1]))}>
        {T_(SX0 + 40, 1054, "score = ?", { c: ACC, size: 40, w: 700, ls: 0, op: 0.55 + 0.45 * Math.sin(g / 5) * Math.sin(g / 5) })}
      </g>
      {val > 0.02 && <Bar x0={SX0} y={1042} w={sx(val) - SX0} c={val > 2.04 ? ACC : BLUE} glow={val > 2.04 ? 10 : 0} />}
      <g opacity={io(g, [676, 690], [0, 1]) * (1 - fill3)}>
        {T_(sx(2) + 18, 1112, "= what any number gets for free", { c: BLUE, size: 30, w: 700, sans: true, halo: true })}
      </g>
      <g opacity={fill3}>{T_(sx(val) + 16, 1054, f1(val), { c: ACC, size: 44, w: 700, ls: 0 })}</g>
      <g opacity={io(g, [716, 730], [0, 1])}>
        <Pill x={sx(4.7)} y={1130} text="LUCKY" c={ACC} size={30} solid />
      </g>
    </g>
  );
};
const LuckyContent: React.FC<{ g: number }> = ({ g }) => {
  const a = T.lucky;
  const row = (y: number, label: string, c: Conv, tLabel: number, tFill: number) => {
    const p = io(g, [tFill, tFill + 26], [0, 1], easeOut);
    const v = c.mu! * p;
    return (
      <g>
        <g opacity={io(g, [tLabel, tLabel + 8], [0, 1])}>{T_(100, y + 14, label, { c: MINT, size: label.length > 5 ? 34 : 42, w: 700, ls: 0 })}</g>
        <g opacity={io(g, [tLabel, tLabel + 8], [0, 1])}><rect x={SX0} y={y - 22} width={SX1 - SX0} height={44} rx={4} fill="none" stroke={K.lineDim} strokeWidth={2} strokeDasharray="3 6" /></g>
        {p > 0.01 && <Bar x0={SX0} y={y} w={sx(v) - SX0} c={MINT} glow={6} />}
        <g opacity={clamp01((p - 0.8) * 5)}>
          {T_(sx(c.mu!) + 16, y + 14, f1(c.mu!), { c: ACC, size: 44, w: 700, ls: 0 })}
          {T_(SX0, y + 58, `${f1(c.digits_right)} digits right · a normal one: ${f1(c.normal_digits)}`, { c: K.text, size: 26, halo: true })}
        </g>
      </g>
    );
  };
  const gT = 927;
  const gp = (i: number) => io(g, [gT + i * 2, gT + i * 2 + 24], [0, 1], easeOut);
  return (
    <g opacity={win(g, a, T.fake + 2, 8, 8)}>
      {row(800, "22/7", c227, a, 785)}
      {row(944, "355/113", c355, 825 - 4, 888)}
      <g opacity={io(g, [gT - 4, gT + 6], [0, 1])}>
        {T_(100, 1086, "NEXT 8", { c: MINT, size: 30, w: 700 })}
        {T_(100, 1122, "BEST ONES", { c: MINT, size: 30, w: 700 })}
      </g>
      {LATER.map((c, i) => {
        const y = 1070 + i * 32;
        return (
          <g key={c.q} opacity={clamp01(gp(i) * 3)}>
            <Bar x0={SX0} y={y} w={sx(c.mu! * gp(i)) - SX0} h={22} c={MINT} />
          </g>
        );
      })}
      <g opacity={io(g, [957, 975], [0, 1])}>
        {T_(sx(muHi) + 24, 1172, `${f1(muLo)}–${f1(muHi)}`, { c: BLUE, size: 44, w: 700, ls: 0 })}
        {T_(sx(muHi) + 24, 1216, "just normal", { c: BLUE, size: 30, w: 700, sans: true })}
      </g>
    </g>
  );
};
const FakeContent: React.FC<{ g: number }> = ({ g }) => {
  const a = T.fake;
  const show = win(g, a, T.claim + 2, 8, 8);
  const ones = [1, 2, 6, 24];
  const SZ = 40, CW2 = SZ * 0.6 + 1.6;
  const strDigits = LIO_STR.slice(0, 26);
  const rows: { y: number; lab: string; v: number; t: number }[] = [
    { y: 1010, lab: "1/10", v: LIO[0].mu, t: 1052 },
    { y: 1096, lab: "11/100", v: LIO[1].mu, t: 1064 },
    { y: 1182, lab: "110001/10⁶", v: LIO[2].mu, t: 1076 },
    { y: 1268, lab: "…/10²⁴", v: LIO[3].mu, t: 1088 },
  ];
  return (
    <g opacity={show}>
      <Pill x={CX} y={768} text="MADE-UP NUMBER · NOT π" c={BLUE} size={28} />
      <g opacity={io(g, [a + 6, a + 20], [0, 1])}>
        <text x={CX} y={856} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={SZ} letterSpacing={1.6} fill={K.muted}>
          <tspan fill={K.text}>0.</tspan>
          {strDigits.split("").map((ch, i) => {
            const pos = i + 1, on = ones.includes(pos);
            return <tspan key={i} fill={on ? ACC : K.muted} fillOpacity={on ? 1 : 0.55} fontWeight={on ? 800 : 600}>{ch}</tspan>;
          })}
          <tspan fill={K.muted}>…</tspan>
        </text>
        {T_(CX, 910, "ones only at spots 1, 2, 6, 24, 120…", { c: K.text, a: "middle", size: 28, halo: true })}
      </g>
      <g opacity={io(g, [a + 40, a + 52], [0, 1]) * (1 - io(g, [1050, 1056], [0, 1]))}>
        {T_(CX, 1000, "cut it off after each 1 →", { c: BLUE, a: "middle", size: 36, w: 700, sans: true })}
      </g>
      {ones.map((pos, i) => {
        const t = 1020 + i * 9, o = io(g, [t, t + 6], [0, 1]), x = CX - (strDigits.length + 3) * CW2 / 2 + (2 + pos) * CW2 - 1;
        return (<g key={pos} opacity={o}><line x1={x} x2={x} y1={820} y2={874} stroke={BLUE} strokeWidth={4} strokeDasharray="6 5" /></g>);
      })}
      {rows.map((r, i) => {
        const p = io(g, [r.t, r.t + 22], [0, 1], easeOut);
        const v = r.v * p;
        return (
          <g key={i} opacity={clamp01((g - r.t) / 4)}>
            {T_(100, r.y + 12, r.lab, { c: BLUE, size: r.lab.length > 8 ? 29 : 34, w: 700, ls: 0 })}
            <rect x={SX0} y={r.y - 22} width={SX1 - SX0} height={44} rx={4} fill="none" stroke={K.lineDim} strokeWidth={2} strokeDasharray="3 6" />
            <Bar x0={SX0} y={r.y} w={sx(v) - SX0} c={BLUE} glow={6} />
            <g opacity={clamp01((p - 0.8) * 5)}>{T_(sx(r.v) + 16, r.y + 14, f1(r.v), { c: BLUE, size: 44, w: 700, ls: 0 })}</g>
          </g>
        );
      })}
      <g opacity={io(g, [1098, 1112], [0, 1])}>
        {T_(SX1, 1338, "6, 7, 8, … NO LIMIT  →", { c: BLUE, a: "end", size: 34, w: 700, halo: true })}
      </g>
    </g>
  );
};

/* ───────────── scene 7: the claim — size vs score ───────────── */
const PX0 = 190, PX1 = 984, PY0 = 764, PY1 = 1280, XMAX = 8, S0 = 1, S1 = 4;
const gx = (lx: number) => PX0 + (lx / XMAX) * (PX1 - PX0);
const gy = (s: number) => PY1 - ((s - S0) / (S1 - S0)) * (PY1 - PY0);
const QX = 4.4, HAIR = 2.28;
const PlotScene: React.FC<{ g: number; cover?: boolean }> = ({ g, cover }) => {
  const a = T.claim;
  const ax = cover ? 1 : io(g, [a, a + 14], [0, 1], easeOut);
  const pts = CV.filter((c) => c.q >= 7 && c.q < 1e8);
  const tPt = (i: number) => (cover ? -1 : a + 8 + i * 4);
  const qm = cover ? 1 : io(g, [1194, 1212], [0, 1], easeOut);
  const zone = cover ? 1 : io(g, [1230, 1256], [0, 1], easeOut);
  return (
    <g>
      <g opacity={ax}>
        {[1, 2, 3, 4].map((s) => (
          <g key={s}>
            <line x1={PX0} x2={PX1} y1={gy(s)} y2={gy(s)} stroke="rgba(110,180,255,0.12)" strokeWidth={1.5} />
            {T_(PX0 - 16, gy(s) + 10, String(s), { a: "end", size: 30, ls: 0 })}
          </g>
        ))}
        {[0, 2, 4, 6, 8].map((i) => (
          <g key={i}>
            <line x1={gx(i)} x2={gx(i)} y1={PY0} y2={PY1} stroke="rgba(110,180,255,0.10)" strokeWidth={1.5} />
            {T_(gx(i), PY1 + 38, i === 0 ? "1" : i === 2 ? "100" : `10${SUP[String(i)]}`, { a: "middle", size: 28, ls: 0 })}
          </g>
        ))}
        <line x1={PX0} x2={PX0} y1={PY0 - 6} y2={PY1} stroke={K.muted} strokeWidth={2.6} />
        <line x1={PX0} x2={PX1} y1={PY1} y2={PY1} stroke={K.muted} strokeWidth={2.6} />
        {T_(PX0 + 8, PY0 - 22, "SCORE ↑", { size: 28, c: K.text, w: 700 })}
        {T_(PX1, PY1 + 84, "HOW BIG THE FRACTION'S NUMBERS ARE →", { size: 26, c: K.muted, a: "end" })}
        <line x1={PX0} x2={PX1} y1={gy(2)} y2={gy(2)} stroke={BLUE} strokeWidth={5} strokeDasharray="14 9" style={{ filter: `drop-shadow(0 0 8px ${BLUE}99)` }} />
        {T_(PX1 - 8, gy(2) + 40, "NORMAL = 2", { c: BLUE, a: "end", size: 30, w: 700 })}
      </g>
      {/* empty zone */}
      <rect x={gx(QX)} y={gy(S1)} width={PX1 - gx(QX)} height={gy(HAIR) - gy(S1)} fill={ACC} fillOpacity={0.14 * zone} />
      <g opacity={zone}>
        <line x1={gx(QX)} x2={PX1} y1={gy(HAIR)} y2={gy(HAIR)} stroke={ACC} strokeWidth={3.6} strokeDasharray="10 8" />
        {T_((gx(QX) + PX1) / 2, gy(3.2), "NO FRACTION", { c: ACC, a: "middle", size: 34, w: 700 })}
        {T_((gx(QX) + PX1) / 2, gy(3.2) + 42, "SCORES HERE", { c: ACC, a: "middle", size: 34, w: 700 })}
      </g>
      <line x1={gx(QX)} x2={gx(QX)} y1={PY1} y2={PY1 - (PY1 - PY0) * qm} stroke={ACC} strokeWidth={3} strokeDasharray="5 8" />
      <g opacity={qm}>
        {T_(gx(QX) - 12, PY1 - 66, "SOME SIZE", { c: ACC, a: "end", size: 28, w: 700 })}
        {T_(gx(QX) - 12, PY1 - 32, "(how big? unknown)", { c: K.muted, a: "end", size: 24 })}
      </g>
      {pts.map((c, i) => {
        const t = tPt(i), p = cover ? 1 : ioB(g, t, t + 10), hero = c.q === 7 || c.q === 113;
        if (!cover && g < t) return null;
        const x = gx(c.log10q), y = gy(c.mu!), r = hero ? 15 : 10;
        return (
          <g key={c.q}>
            <circle cx={x} cy={y} r={r * (0.5 + 0.5 * p)} fill={MINT} stroke={K.bgDeep} strokeWidth={2.4} />
            {hero && c.q === 7 && <g opacity={clamp01(p)}>{T_(x - 8, y - 32, `22/7 · score ${f1(c.mu!)}`, { c: MINT, size: 32, w: 700, ls: 0 })}</g>}
            {hero && c.q === 113 && <g opacity={clamp01(p)}>{T_(x + 24, y - 12, `${c.p}/${c.q}`, { c: MINT, size: 32, w: 700, ls: 0 })}{T_(x + 24, y + 26, `score ${f1(c.mu!)}`, { c: K.text, size: 30, w: 700, ls: 0 })}</g>}
          </g>
        );
      })}
    </g>
  );
};

/* ───────────── scene 8: the floor ───────────── */
const FloorScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.floor;
  const ys = 1150;
  const sxF = (v: number) => 170 + (v / 7) * (980 - 170);                 // 0..7
  const slide = io(g, [a + 68, T.lock], [0, 1], easeInOut);
  const piScore = 5.6 + (2 - 5.6) * slide;
  const lockP = ioB(g, T.lock, T.lock + 12);
  const hatch = io(g, [a, a + 18], [0, 1], easeOut);
  const wall = io(g, [a + 6, a + 22], [0, 1], easeOut);
  const ring = io(g, [T.lock, T.lock + 24], [0, 1], easeOut);
  return (
    <g>
      <defs>
        <pattern id="hatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="22" stroke={CORAL} strokeWidth="5" strokeOpacity="0.5" /></pattern>
      </defs>
      <g opacity={hatch}>
        <rect x={sxF(0)} y={ys - 130} width={sxF(2) - sxF(0)} height={260} fill="url(#hatch)" />
        <rect x={sxF(0)} y={ys - 130} width={sxF(2) - sxF(0)} height={260} fill="rgba(255,107,122,0.07)" stroke={CORAL} strokeWidth={2.6} strokeOpacity={0.7} />
        {T_((sxF(0) + sxF(2)) / 2, ys - 160, "IMPOSSIBLE", { c: CORAL, a: "middle", size: 34, w: 700 })}
        {T_((sxF(0) + sxF(2)) / 2, ys + 178, "no score under 2", { c: CORAL, a: "middle", size: 28, w: 700, sans: true })}
      </g>
      <line x1={sxF(0)} x2={sxF(7)} y1={ys} y2={ys} stroke={K.muted} strokeWidth={3} />
      {[2, 3, 4, 5, 6].map((v) => (
        <g key={v} opacity={hatch}>
          <line x1={sxF(v)} x2={sxF(v)} y1={ys - 10} y2={ys + 10} stroke={K.muted} strokeWidth={2.6} />
          {T_(sxF(v), ys + 54, String(v), { a: "middle", size: 32, ls: 0 })}
        </g>
      ))}
      <g opacity={wall}>
        <line x1={sxF(2)} x2={sxF(2)} y1={ys - 150} y2={ys + 30} stroke={MINT} strokeWidth={6} style={{ filter: `drop-shadow(0 0 10px ${MINT}aa)` }} />
        {T_(sxF(2) + 66, ys - 112, "LOWEST", { c: MINT, size: 34, w: 700 })}
        {T_(sxF(2) + 66, ys - 70, "POSSIBLE", { c: MINT, size: 34, w: 700 })}
      </g>
      {/* made-up number runs off to the right */}
      <g opacity={io(g, [a + 20, a + 36], [0, 1])}>
        <path d={`M ${sxF(5.3)} ${ys + 150} h 150 m -18 -16 l 18 16 l -18 16`} fill="none" stroke={BLUE} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {T_(sxF(5.3) + 75, ys + 206, "made-up number:", { c: BLUE, a: "middle", size: 26, w: 700 })}
        {T_(sxF(5.3) + 75, ys + 238, "no limit", { c: BLUE, a: "middle", size: 26, w: 700 })}
      </g>
      {/* π marker */}
      <g opacity={io(g, [a + 52, a + 62], [0, 1])} transform={`translate(${sxF(piScore)} ${ys - 70})`}>
        <circle r={22 + 70 * (g >= T.lock ? ring : 0)} fill="none" stroke={ACC} strokeWidth={4} opacity={g >= T.lock ? 1 - ring : 0} />
        <line x1={0} x2={0} y1={0} y2={70} stroke={ACC} strokeWidth={4.4} />
        <circle r={44 + 6 * (g >= T.lock ? lockP : 0)} fill="rgba(3,11,24,0.9)" stroke={ACC} strokeWidth={5} style={{ filter: `drop-shadow(0 0 ${8 + 14 * lockP}px ${ACC}aa)` }} />
        <text x={0} y={22} textAnchor="middle" fontFamily={K.serif} fontStyle="italic" fontSize={64} fill={ACC}>π</text>
      </g>
      <g opacity={io(g, [a + 56, a + 66], [0, 1]) * (1 - io(g, [T.lock - 20, T.lock - 8], [0, 1]))}>
        {T_(sxF(5.6), ys - 178, "OpenAI's claim:", { c: ACC, a: "middle", size: 28, w: 700, sans: true, ls: 0 })}
        {T_(sxF(5.6), ys - 146, "where does π land?", { c: ACC, a: "middle", size: 28, w: 700, sans: true, ls: 0 })}
      </g>
      <g opacity={clamp01((g - T.lock) / 6)} transform={`translate(0 ${(1 - lockP) * 20})`}>
        <text x={CX} y={840} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={130} fill={ACC} letterSpacing={-4} style={{ filter: `drop-shadow(0 0 18px ${ACC}88)` }}>π = 2</text>
        {T_(CX, 892, "OPENAI'S CLAIM · THE LOWEST SCORE", { c: ACC, a: "middle", size: 26, w: 700 })}
      </g>
      <g opacity={io(g, [T.lock + 14, T.lock + 28], [0, 1])}>
        {T_(sxF(2) + 20, ys + 110, "← LEAST FRACTION-LIKE", { c: ACC, size: 26, w: 700 })}
      </g>
      <g opacity={io(g, [a + 40, a + 52], [0, 1]) * (1 - io(g, [T.lock - 20, T.lock - 8], [0, 1]) * 0)}>
        {T_(sxF(7) - 4, ys + 110, "MORE FRACTION-LIKE →", { c: K.muted, a: "end", size: 26, w: 700, op: 0.9 })}
      </g>
    </g>
  );
};

/* ───────────── scene 9: honest status card ───────────── */
type Row = { k: string; v: string; sub?: string; t: number; tIcon: number; kind: "ok" | "no" };
const ROWS: Row[] = [
  { k: "WHO SAYS IT", v: "OpenAI (Sept 2026 paper)", sub: "made by an unreleased AI model", t: T.honest + 6, tIcon: T.honest + 22, kind: "ok" },
  { k: "CHECKED BY OTHER MATHEMATICIANS", v: "not yet", t: 1456, tIcon: 1500, kind: "no" },
  { k: "COMPUTER-CHECKABLE PROOF FILES", v: "public", sub: "anyone can download them", t: 1562, tIcon: 1596, kind: "ok" },
  { k: "CHECKED BY US", v: "not yet", t: 1634, tIcon: 1648, kind: "no" },
];
const StatusScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.honest, y0 = 804, st = 142;
  const card = io(g, [a, a + 14], [0, 1], easeOut);
  return (
    <g>
      <rect x={90} y={700} width={900} height={668} rx={16} fill="rgba(3,11,24,0.72)" stroke={ACC} strokeWidth={3.4} opacity={card} />
      <g opacity={card}>{T_(130, 756, "OPENAI'S CLAIM ABOUT π", { c: ACC, size: 32, w: 700, ls: 2 })}<line x1={130} x2={950} y1={782} y2={782} stroke={K.lineDim} strokeWidth={2} /></g>
      {ROWS.map((r, i) => {
        const p = ioB(g, r.tIcon, r.tIcon + 12), y = y0 + i * st, c = r.kind === "ok" ? MINT : CORAL;
        return (
          <g key={r.k}>
            <g opacity={io(g, [r.t, r.t + 8], [0, 1])}>
              {T_(240, y + 30, r.k, { c: K.muted, size: 25, w: 600 })}
              <g opacity={clamp01((g - r.tIcon) / 5)}>{T_(240, y + 82, r.v, { c: r.kind === "ok" ? K.text : c, size: 46, w: 700, ls: 0, sans: true })}</g>
              {r.sub && <g opacity={clamp01((g - r.tIcon) / 5)}>{T_(240, y + 122, r.sub, { c: K.muted, size: 26 })}</g>}
            </g>
            <g transform={`translate(172 ${y + 52}) scale(${0.5 + 0.5 * p})`} opacity={clamp01(p * 2)}>
              <circle r={36} fill="rgba(3,11,24,0.92)" stroke={c} strokeWidth={4.4} />
              {r.kind === "ok" ? <path d="M -15 2 L -5 13 L 16 -13" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" />}
            </g>
          </g>
        );
      })}
    </g>
  );
};

/* ───────────── composition of the shot ───────────── */
export const PiShot: React.FC = () => {
  const g = useCurrentFrame();
  const sHook = win(g, -40, T.guess + 3), sLine = win(g, T.guess - 3, T.question + 3), sQ = win(g, T.question - 3, T.score + 3), sScore = win(g, T.score - 3, T.claim + 3),
    sClaim = win(g, T.claim - 3, T.floor + 3), sFloor = win(g, T.floor - 3, T.honest + 3), sSt = win(g, T.honest - 3, T.end + 6, 6, 8);
  const fade = io(g, [T.end - 6, T.end + 2], [0, 1]);
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Headline f={g} lines={["OpenAI *claims* it", "settled a *π* puzzle"]} at={-30} exitAt={T.guess - 12} size={86} accent={ACC} />
      <Headline f={g} lines={["Guessing *π*", "with a *fraction*"]} at={T.guess + 2} exitAt={T.better - 14} size={92} accent={ACC} />
      <Headline f={g} lines={["A far *closer*", "guess"]} at={T.better + 2} exitAt={T.question - 14} size={92} accent={ACC} />
      <Headline f={g} lines={["Is π secretly", "almost a *fraction*?"]} at={T.question + 2} exitAt={T.score - 14} size={86} accent={ACC} />
      <Headline f={g} lines={["Give each guess a", "*closeness score*"]} at={T.score + 2} exitAt={T.lucky - 14} size={84} accent={ACC} />
      <Headline f={g} lines={["Two lucky *guesses*,", "then back to *normal*"]} at={T.lucky + 2} exitAt={T.fake - 14} size={80} accent={ACC} />
      <Headline f={g} lines={["A number that", "*hides* behind fractions"]} at={T.fake + 2} exitAt={T.claim - 14} size={80} accent={ACC} />
      <Headline f={g} lines={["Past some size,", "nobody beats *normal*"]} at={T.claim + 2} exitAt={T.floor - 14} size={84} accent={ACC} />
      <Headline f={g} lines={["Two is the *floor*"]} at={T.floor + 2} exitAt={T.honest - 12} size={100} accent={ACC} />
      <Headline f={g} lines={["Big *if*"]} at={T.honest + 2} exitAt={T.end - 14} size={116} accent={ACC} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <g opacity={sHook}><HookScene g={g} /></g>
        <g opacity={sLine}><NumberLine g={g} /><DigitsRows g={g} /></g>
        <g opacity={sQ}><QuestionScene g={g} /></g>
        <g opacity={sScore}><ScoreAxis g={g} /><ScoreContent g={g} /><LuckyContent g={g} /><FakeContent g={g} /></g>
        <g opacity={sClaim}><PlotScene g={g} /></g>
        <g opacity={sFloor}><FloorScene g={g} /></g>
        <g opacity={sSt}><StatusScene g={g} /></g>
      </svg>

      <Panel o={pn(-40, T.guess + 3)}>A claim from OpenAI about the number <Hl c={ACC}>π</Hl></Panel>
      <Panel o={pn(T.guess - 3, T.better + 3)}>Zoomed in: this whole line is only <Hl c={MINT}>0.004</Hl> wide</Panel>
      <Panel o={pn(T.better - 3, T.question + 3)}><Hl c={MINT}>355/113</Hl> = 3.1415929…   <Hl c={ACC}>π</Hl> = 3.1415926…</Panel>
      <Panel o={pn(T.question - 3, T.score + 3)}>Would small-number fractions <Hl c={ACC}>keep</Hl> landing this close?</Panel>
      <Panel o={pn(T.score - 3, T.lucky + 3)}><Hl c={BLUE}>2 is normal.</Hl> Higher is <Hl c={ACC}>lucky</Hl></Panel>
      <Panel o={pn(T.lucky - 3, T.fake + 3)}>Best fractions of π, tested up to <Hl c={MINT}>1,725,033</Hl></Panel>
      <Panel o={pn(T.fake - 3, T.claim + 3)}>Made-up number: its scores <Hl c={BLUE}>never stop</Hl> rising</Panel>
      <Panel o={pn(T.claim - 3, T.floor + 3)}>The claim: past some size, <Hl c={ACC}>nobody beats normal</Hl> by even a hair</Panel>
      <Panel o={pn(T.floor - 3, T.honest + 3)}>The lowest score a number that isn't a fraction can have</Panel>
      <Panel o={pn(T.honest - 3, T.end - 4)}>A <Hl c={ACC}>claim</Hl>, not a proven fact — yet</Panel>
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
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 112, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>Is π secretly</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 112, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>almost a fraction?</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 92, lineHeight: 1.1, color: ACC }}>OpenAI claims: no</div>
    </div>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform="translate(0 150)"><Frame /><PlotScene g={T.claim + 120} cover /></g>
    </svg>
  </>
);
export { easeInOut, easeOut };
