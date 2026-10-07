import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Tag, clamp01, ioB, meshPhase, W, H, TAU } from "../gearbox/kit";

/**
 * HOW IT WORKS #12 — AC vs DC            30 s · 1080×1920 · 30 fps · frame 0 is a finished hook
 *
 * PLAN (global frames; VO phrases from public/projects/acdc/vo.json)
 *   0   hook  two scopes: wall socket = sine (AC, 230 V, 50 Hz), phone = flat line (DC, 5 V). Sweeping cursors.
 *   99  dc    wire cut-away: electrons drift ONE way at steady speed; flat scope trace
 *   144 ac    electrons shuffle back and forth, net zero; sine scope, 50 Hz = 100 reversals/s (slow-mo x50), live counter
 *   218 peak  230 V RMS × √2 = 325 V peak, drawn on the sine (RMS band, peak markers); US 120 V / 60 Hz / 170 V peak in the panel
 *   320 why   transformer rows: AC in → bigger AC out (flux swings); DC in → flat → NOTHING out
 *   398 loss  same power P = V·I: 1× V → I, loss 100 %; 10× V → I/10, loss (1/10)² = 1 %
 *   487 line  plant → step-up → 400 kV line → step-down → 230 V house, voltage profile steps
 *   610 rect  AC → bridge |v| → capacitor smooth (computed RC waveform) → DC
 *   680 hero  GRID (AC) → CHARGER → PHONE (DC); "Grid is AC, phone is DC, charger translates" + flash
 *   790 end   Follow-for-more end card (same as #10/#11)
 * Everything is a pure function of the frame.
 */

/** Global frames from public/projects/acdc/vo.json. Keep in sync with soundtrack.py. */
export const T = { dc: 99, ac: 144, peak: 218, why: 320, loss: 398, line: 487, rect: 610, hero: 680, end: 790, total: 900 };
export const CUTS = [0, 99, 144, 218, 320, 398, 487, 610, 680, 790];

const AC = K.line, DC = K.amber, RED = K.red, GREEN = K.green;
const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };
const pmod = (x: number, m: number) => ((x % m) + m) % m;

/* physics constants shown on screen (all derived, not typed in twice) */
export const F_HZ = 50, V_RMS = 230, V_PEAK = V_RMS * Math.SQRT2;          // 325.27 V
export const US_RMS = 120, US_HZ = 60, US_PEAK = US_RMS * Math.SQRT2;      // 169.7 V
export const K_STEP = 10, LOSS_RATIO = (1 / K_STEP) ** 2;                  // 0.01
export const V_LINE = 400_000;

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
const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 22} letterSpacing={o.ls ?? (o.size ?? 22) * 0.1} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);

/* ───────────── waveform scope ───────────── */
/** fn: u∈[0,1] → value ∈[-1,1]. cur<0 hides the cursor (full trace). Trace is fixed; the cursor sweeps, left of it bright, right dim. */
const Scope: React.FC<{ x: number; y: number; w: number; h: number; fn: (u: number) => number; cur: number; color: string; draw?: number; amp?: number; box?: boolean; dotR?: number; grid?: boolean }> = ({
  x, y, w, h, fn, cur, color, draw = 1, amp = 0.8, box = true, dotR = 10, grid = true,
}) => {
  const n = 220, cy = y + h / 2, A = (h / 2) * amp;
  const pt = (i: number) => `${(x + (i / n) * w).toFixed(1)} ${(cy - fn(i / n) * A).toFixed(1)}`;
  const upto = cur < 0 ? n : Math.round(cur * n);
  const d1 = Array.from({ length: upto + 1 }, (_, i) => (i ? "L " : "M ") + pt(i)).join(" ");
  const d2 = Array.from({ length: n - upto + 1 }, (_, i) => (i ? "L " : "M ") + pt(i + upto)).join(" ");
  const cx = x + (cur < 0 ? 1 : cur) * w;
  return (
    <g>
      {box && <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(3,11,24,0.55)" stroke={K.lineDim} strokeWidth={2} />}
      {grid && Array.from({ length: Math.round(w / 80) - 1 }, (_, k) => <line key={k} x1={x + (k + 1) * (w / Math.round(w / 80))} y1={y + 4} x2={x + (k + 1) * (w / Math.round(w / 80))} y2={y + h - 4} stroke="rgba(110,180,255,0.10)" strokeWidth={1.5} />)}
      <line x1={x + 4} y1={cy} x2={x + w - 4} y2={cy} stroke="rgba(143,179,209,0.45)" strokeWidth={1.8} strokeDasharray="6 7" />
      <g opacity={draw}>
        {cur >= 0 && <path d={d2} fill="none" stroke={color} strokeWidth={4} opacity={0.22} strokeLinejoin="round" />}
        <path d={d1} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 7px ${color}aa)` }} />
        {cur >= 0 && (
          <g>
            <line x1={cx} y1={y + 4} x2={cx} y2={y + h - 4} stroke={color} strokeWidth={1.8} strokeDasharray="4 6" opacity={0.55} />
            <circle cx={cx} cy={cy - fn(cur) * A} r={dotR + 8} fill={color} opacity={0.18} />
            <circle cx={cx} cy={cy - fn(cur) * A} r={dotR} fill={color} />
          </g>
        )}
      </g>
    </g>
  );
};
const sine2 = (u: number) => Math.sin(TAU * 2 * u);       // two cycles across the scope
const flat = () => 1;
const sweep = (g: number, a: number, dur = 60) => pmod((g - a) / dur, 1);

/* ───────────── wire cut-away with electrons ───────────── */
const WX0 = 170, WX1 = 920, NE = 11, SP = (WX1 - WX0) / NE;
const Wire: React.FC<{ y: number; mode: "dc" | "ac"; g: number; phase: number; o?: number }> = ({ y, mode, g, phase, o = 1 }) => {
  const col = mode === "dc" ? DC : AC;
  const els = Array.from({ length: NE }, (_, i) => {
    const rest = WX0 + SP * (i + 0.5);
    const x = mode === "dc" ? WX0 + pmod(SP * (i + 0.5) + g * 2.9, WX1 - WX0) : rest + 30 * Math.sin(TAU * phase);
    const edge = Math.min(1, (x - WX0) / 24, (WX1 - x) / 24);
    return { x, rest, edge: clamp01(edge), hero: i === 5 };
  });
  return (
    <g opacity={o}>
      <rect x={WX0 - 14} y={y - 34} width={WX1 - WX0 + 28} height={68} rx={34} fill="rgba(3,11,24,0.7)" stroke={K.lineDim} strokeWidth={3} />
      {/* source on the left, load on the right */}
      <circle cx={104} cy={y} r={36} fill={K.bgDeep} stroke={col} strokeWidth={4} />
      {mode === "dc" ? (
        <g><line x1={90} y1={y - 14} x2={90} y2={y + 14} stroke={col} strokeWidth={4} /><line x1={106} y1={y - 8} x2={106} y2={y + 8} stroke={col} strokeWidth={4} /><text x={120} y={y + 8} fontFamily={K.mono} fontSize={22} fontWeight={700} fill={col}>+</text></g>
      ) : (
        <path d={`M ${86} ${y} q 9 -20 18 0 t 18 0`} fill="none" stroke={col} strokeWidth={4} strokeLinecap="round" />
      )}
      <path d={`M ${950} ${y} l 10 -18 l 14 36 l 14 -36 l 14 36 l 10 -18`} fill="none" stroke={K.text} strokeWidth={3.4} strokeLinejoin="round" opacity={0.85} />
      {els.map((e, i) => (
        <g key={i} opacity={e.edge}>
          {e.hero && mode === "ac" && <g><line x1={e.rest} y1={y - 52} x2={e.rest} y2={y + 52} stroke={K.text} strokeWidth={2} strokeDasharray="4 5" opacity={0.6} /></g>}
          <circle cx={e.x} cy={y} r={e.hero && mode === "ac" ? 17 : 14} fill={col} fillOpacity={0.22} stroke={e.hero && mode === "ac" ? K.text : col} strokeWidth={e.hero && mode === "ac" ? 4 : 3} />
          <line x1={e.x - 6} y1={y} x2={e.x + 6} y2={y} stroke={e.hero && mode === "ac" ? K.text : col} strokeWidth={3.4} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

/* ───────────── scene 0: hook ───────────── */
const HookScene: React.FC<{ g: number }> = ({ g }) => {
  const cur = sweep(g, -80, 90);
  const pop = ioB(g, 40, 56), pop2 = ioB(g, 66, 82);
  return (
    <g>
      <Scope x={90} y={706} w={900} h={300} fn={sine2} cur={cur} color={AC} amp={0.6} />
      <Scope x={90} y={1070} w={900} h={300} fn={flat} cur={cur} color={DC} amp={0.45} />
      {T_(112, 740, "WALL SOCKET  ·  INDIA", { c: AC, size: 22 })}
      {T_(112, 1104, "PHONE BATTERY / CHIP", { c: DC, size: 22 })}
      <g transform={`translate(868 740) scale(${0.6 + 0.4 * pop})`} opacity={clamp01(pop)}>
        <rect x={-100} y={-24} width={200} height={46} rx={23} fill={AC} />
        <text y={9} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={26} fill={K.bgDeep}>AC ~</text>
      </g>
      <g transform={`translate(868 1104) scale(${0.6 + 0.4 * pop2})`} opacity={clamp01(pop2)}>
        <rect x={-100} y={-24} width={200} height={46} rx={23} fill={DC} />
        <text y={9} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={26} fill={K.bgDeep}>DC ⎓</text>
      </g>
      {T_(112, 986, "230 V  ·  50 Hz", { c: K.text, size: 24, w: 700 })}
      {T_(112, 1350, "5 V  ·  steady", { c: K.text, size: 24, w: 700 })}
    </g>
  );
};

/* ───────────── scene 1: DC ───────────── */
const DcScene: React.FC<{ g: number }> = ({ g }) => {
  const cur = sweep(g, T.dc, 60);
  return (
    <g>
      <Wire y={790} mode="dc" g={g - T.dc} phase={0} />
      {T_(540, 872, "ELECTRONS DRIFT ONE WAY  →", { c: DC, a: "middle", size: 22 })}
      <Scope x={90} y={950} w={900} h={380} fn={flat} cur={cur} color={DC} amp={0.5} />
      {T_(112, 986, "VOLTAGE  vs  TIME", { size: 20 })}
      {T_(966, 986, "+ V", { c: DC, a: "end", size: 22, w: 700 })}
      {T_(966, 1318, "t →", { a: "end", size: 20 })}
    </g>
  );
};

/* ───────────── scene 2: AC ───────────── */
const AcScene: React.FC<{ g: number }> = ({ g }) => {
  const cur = sweep(g, T.ac, 60);
  const ph = 2 * cur;                                   // cycles within the scope window = 2
  const rev = Math.floor(2 * (g - T.ac) / 30 * 1) ;       // reversals counted in slow-mo: 2 per displayed cycle (1 cycle / 30 f)
  const cnt = Math.max(0, Math.min(100, Math.round(io(g, [T.ac + 8, T.ac + 68], [0, 100], easeOut))));
  void rev;
  return (
    <g>
      <Wire y={790} mode="ac" g={g - T.ac} phase={ph} />
      {T_(540, 872, "ELECTRONS SHUFFLE  ←  →  NET MOVEMENT ZERO", { c: AC, a: "middle", size: 21 })}
      <Scope x={90} y={950} w={900} h={290} fn={sine2} cur={cur} color={AC} />
      {T_(112, 986, "VOLTAGE  vs  TIME", { size: 20 })}
      {T_(966, 986, "+", { c: AC, a: "end", size: 26, w: 700 })}
      {T_(966, 1228, "−", { c: AC, a: "end", size: 26, w: 700 })}
      <g opacity={ioB(g, T.ac + 12, T.ac + 28)}>
        <rect x={90} y={1262} width={900} height={104} rx={10} fill="rgba(3,11,24,0.85)" stroke={AC} strokeWidth={2.4} />
        {T_(116, 1306, "SLOW-MO ×50", { c: K.muted, size: 22 })}
        {T_(116, 1344, "1 CYCLE = 20 ms", { c: K.muted, size: 22 })}
        {T_(964, 1338, `${fmt(cnt)} flips / s`, { c: AC, a: "end", size: 54, w: 700, ls: 0 })}
      </g>
    </g>
  );
};

/* ───────────── scene 3: peak vs RMS ───────────── */
const PeakScene: React.FC<{ g: number }> = ({ g }) => {
  const x = 150, y = 700, w = 600, h = 640, cy = y + h / 2, A = (h / 2) * 0.82;
  const r = V_RMS / V_PEAK;
  const cur = sweep(g, T.peak, 60);
  const pk = ioB(g, T.peak + 30, T.peak + 46);
  const rm = io(g, [T.peak + 66, T.peak + 84], [0, 1], easeOut);
  const yPk = cy - A, yRm = cy - A * r;
  return (
    <g>
      <Scope x={x} y={y} w={w} h={h} fn={sine2} cur={cur} color={AC} amp={0.82} />
      {/* axis labels */}
      {T_(x - 12, yPk + 8, "+325", { c: AC, a: "end", size: 20, w: 700 })}
      {T_(x - 12, cy + 8, "0", { a: "end", size: 20 })}
      {T_(x - 12, cy + A + 8, "−325", { c: AC, a: "end", size: 20, w: 700 })}
      {/* peak guides */}
      <line x1={x + 6} y1={yPk} x2={x + w - 6} y2={yPk} stroke={AC} strokeWidth={2.4} strokeDasharray="10 8" opacity={0.8 * pk} />
      <line x1={x + 6} y1={cy + A} x2={x + w - 6} y2={cy + A} stroke={AC} strokeWidth={2.4} strokeDasharray="10 8" opacity={0.8 * pk} />
      <g transform={`translate(888 ${yPk}) scale(${0.6 + 0.4 * pk})`} opacity={clamp01(pk)}>
        <rect x={-120} y={-26} width={240} height={52} rx={26} fill={AC} />
        <text y={10} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={26} fill={K.bgDeep}>PEAK 325 V</text>
      </g>
      <line x1={x + 6} y1={yRm} x2={x + 6 + (w - 12) * rm} y2={yRm} stroke={DC} strokeWidth={4} />
      <line x1={x + 6} y1={cy + A * r} x2={x + 6 + (w - 12) * rm} y2={cy + A * r} stroke={DC} strokeWidth={4} />
      <g opacity={rm}>
        <rect x={768} y={yRm - 30} width={240} height={68} rx={8} fill="rgba(3,11,24,0.88)" stroke={DC} strokeWidth={2} />
        {T_(782, yRm + 0, "230 V RMS", { c: DC, size: 26, w: 700, ls: 1 })}
        {T_(782, yRm + 26, "heats like 230 V DC", { size: 15, ls: 0.5 })}
      </g>
    </g>
  );
};

/* ───────────── scene 4: transformer ───────────── */
const rectPt = (s: number, x0: number, y0: number, x1: number, y1: number) => {
  const wd = x1 - x0, ht = y1 - y0, per = 2 * (wd + ht), d = pmod(s, 1) * per;
  if (d < wd) return { x: x0 + d, y: y0 };
  if (d < wd + ht) return { x: x1, y: y0 + d - wd };
  if (d < 2 * wd + ht) return { x: x1 - (d - wd - ht), y: y1 };
  return { x: x0, y: y1 - (d - 2 * wd - ht) };
};
const Transformer: React.FC<{ cy: number; g: number; ac: boolean }> = ({ cy, g, ac }) => {
  const x0 = 410, x1 = 670, y0 = cy - 66, y1 = cy + 66;
  const ph = (g - T.why) / 30;                       // 1 cycle per second (slow-mo)
  const sw = ac ? Math.sin(TAU * ph) : 0;
  const coil = (lx: number, n: number, c: string) => Array.from({ length: n }, (_, k) => {
    const yy = y0 + 14 + (k * (y1 - y0 - 28)) / (n - 1);
    return <path key={k} d={`M ${lx - 26} ${yy - 5} L ${lx + 26} ${yy + 5}`} stroke={c} strokeWidth={5} strokeLinecap="round" />;
  });
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke="#1E4F73" strokeWidth={26} strokeLinejoin="round" />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke={K.lineDim} strokeWidth={2} strokeLinejoin="round" />
      {coil(x0, 6, AC)}{coil(x1, 14, ac ? AC : K.lineDim)}
      {/* flux: dots slosh along the core with sin φ */}
      {Array.from({ length: 10 }, (_, i) => {
        const p = rectPt(i / 10 + 0.07 * sw, x0, y0, x1, y1);
        return <circle key={i} cx={p.x} cy={p.y} r={5.5} fill={ac ? K.text : K.lineDim} opacity={ac ? 0.4 + 0.6 * Math.abs(sw) : 0.35} />;
      })}
      {T_((x0 + x1) / 2, cy + 5, ac ? "FLUX SWINGS" : "FLUX CONSTANT", { c: ac ? K.text : K.muted, a: "middle", size: 16, op: 0.95 })}
    </g>
  );
};
const WhyScene: React.FC<{ g: number }> = ({ g }) => {
  const ph = (g - T.why) / 30;
  const tag = ioB(g, T.why + 44, T.why + 58);
  const rows = [{ cy: 860, ac: true }, { cy: 1200, ac: false }];
  return (
    <g>
      {rows.map(({ cy, ac }) => {
        const inFn = (u: number) => (ac ? Math.sin(TAU * (2 * u)) * 0.34 : 0.34);
        const outFn = (u: number) => (ac ? Math.sin(TAU * (2 * u)) * 1 : 0);
        const col = ac ? AC : DC;
        const cur = sweep(g, T.why, 60);
        return (
          <g key={cy}>
            <Scope x={80} y={cy - 80} w={260} h={160} fn={inFn} cur={cur} color={col} amp={0.9} dotR={7} grid={false} />
            <Scope x={750} y={cy - 80} w={260} h={160} fn={outFn} cur={cur} color={ac ? AC : K.muted} amp={0.9} dotR={7} grid={false} />
            <line x1={340} y1={cy} x2={384} y2={cy} stroke={col} strokeWidth={4} />
            <line x1={696} y1={cy} x2={750} y2={cy} stroke={ac ? AC : K.muted} strokeWidth={4} strokeDasharray={ac ? undefined : "6 8"} />
            {T_(210, cy - 96, ac ? "AC IN" : "DC IN", { c: col, a: "middle", size: 22, w: 700 })}
            {T_(880, cy - 96, ac ? "AC OUT · STEPPED UP" : "OUT  =  0 V", { c: ac ? AC : K.muted, a: "middle", size: 22, w: 700 })}
            <Transformer cy={cy} g={g} ac={ac} />
          </g>
        );
      })}
      <g transform={`translate(540 ${1040}) scale(${0.6 + 0.4 * tag})`} opacity={clamp01(tag)}>
        <rect x={-300} y={-26} width={600} height={52} rx={26} fill={DC} />
        <text y={9} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={25} fill={K.bgDeep}>NO CHANGE → NO VOLTAGE INDUCED</text>
      </g>
      {void ph}
    </g>
  );
};

/* ───────────── scene 5: I²R loss ───────────── */
const LossScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.loss;
  const cols = [
    { x: 70, title: "1× VOLTAGE", Vx: "1", I: 1, loss: 1, c: RED },
    { x: 560, title: "10× VOLTAGE", Vx: "10", I: 1 / K_STEP, loss: LOSS_RATIO, c: GREEN },
  ];
  const reveal = io(g, [a + 8, a + 30], [0, 1], easeOut);
  const lossAnim = (v: number) => (v === 1 ? 1 : io(g, [a + 40, a + 70], [1, v], easeInOut));
  return (
    <g>
      {cols.map((c, k) => {
        const lv = lossAnim(c.loss) * reveal + (1 - reveal) * 1;
        const heat = lv;
        const barH = 250 * lv, base = 1330;
        const pulse = 0.75 + 0.25 * Math.sin(g * 0.5 + k);
        const cx = c.x + 215;
        return (
          <g key={k}>
            <rect x={c.x} y={700} width={430} height={660} rx={10} fill="rgba(3,11,24,0.5)" stroke={K.lineDim} strokeWidth={2} />
            {T_(cx, 744, c.title, { c: c.c, a: "middle", size: 26, w: 700 })}
            {T_(cx, 790, `P = V × I  =  same`, { a: "middle", size: 20 })}
            {/* wire: thickness ∝ current, glow ∝ I²R */}
            <rect x={c.x + 30} y={850 - 4 - 14 * c.I} width={370} height={8 + 28 * c.I} rx={6} fill={c.c} fillOpacity={0.3 + 0.5 * heat * pulse} stroke={c.c} strokeWidth={3} style={{ filter: `drop-shadow(0 0 ${4 + 22 * heat}px ${c.c})` }} />
            {T_(cx, 920, `I  =  ${c.I === 1 ? "1" : "1/10"}`, { c: K.text, a: "middle", size: 38, w: 700, ls: 0 })}
            {T_(cx, 960, "CURRENT", { a: "middle", size: 18 })}
            {/* loss gauge */}
            <rect x={cx - 60} y={base - 250} width={120} height={250} fill="none" stroke={K.lineDim} strokeWidth={2.4} />
            <rect x={cx - 60} y={base - barH} width={120} height={barH} fill={c.c} fillOpacity={0.45} stroke={c.c} strokeWidth={3} />
            {T_(cx, base - 262, "RELATIVE LOSS = I² R", { c: K.muted, a: "middle", size: 20 })}
            {T_(cx + 76, base - barH / 2 - 0, "", {})}
            {T_(cx, 1010, `${fmt(lv * 100, lv < 0.1 ? 0 : 0)} %`, { c: c.c, a: "middle", size: 54, w: 700, ls: 0 })}
          </g>
        );
      })}
      <g opacity={io(g, [a + 52, a + 66], [0, 1])}>
        {T_(540, 1005, "", {})}
      </g>
    </g>
  );
};

/* ───────────── scene 6: the grid chain ───────────── */
const NODES = [{ x: 130, n: "POWER PLANT" }, { x: 330, n: "STEP-UP" }, { x: 750, n: "STEP-DOWN" }, { x: 950, n: "HOME" }];
const Pylon: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <g opacity={o} stroke={K.text} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={`M ${x - 18} ${y + 60} L ${x - 5} ${y - 30} L ${x + 5} ${y - 30} L ${x + 18} ${y + 60}`} />
    <line x1={x - 30} y1={y - 18} x2={x + 30} y2={y - 18} /><line x1={x - 22} y1={y + 6} x2={x + 22} y2={y + 6} />
    <line x1={x - 14} y1={y + 30} x2={x + 14} y2={y - 6} opacity={0.6} />
  </g>
);
const LineScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.line, y = 1030;
  const p = io(g, [a + 4, a + 44], [0, 1], easeInOut);              // chain draws left→right
  const nodeO = (i: number) => clamp01(p * 4 - i * 0.9);
  const e = ioB(g, a + 44, a + 58), e2 = ioB(g, a + 92, a + 106);
  const kv = io(g, [a + 36, a + 66], [0, V_LINE / 1000], easeOut);
  const dots = Array.from({ length: 9 }, (_, i) => pmod(g * 0.018 + i / 9, 1));
  const xAt = (u: number) => 130 + u * 820;
  const lv = (x: number) => (x < 330 ? 0 : x < 750 ? 1 : 0);        // voltage level along the chain
  return (
    <g>
      {/* power wire */}
      <path d={`M 130 ${y} L 950 ${y}`} stroke={K.lineDim} strokeWidth={3} strokeDasharray="8 8" opacity={0.5} />
      <path d={`M 130 ${y} L ${130 + 820 * p} ${y}`} stroke={AC} strokeWidth={5} style={{ filter: `drop-shadow(0 0 8px ${AC})` }} />
      {dots.map((u, i) => u < p ? <circle key={i} cx={xAt(u)} cy={y} r={7} fill={K.text} opacity={0.9} /> : null)}
      {[460, 540, 620].map((x, i) => <Pylon key={x} x={x} y={y + 5} o={clamp01(p * 3 - 1 - i * 0.3)} />)}
      {NODES.map((nd, i) => (
        <g key={i} opacity={nodeO(i)}>
          <circle cx={nd.x} cy={y} r={50} fill={K.bgDeep} stroke={i === 1 || i === 2 ? DC : AC} strokeWidth={4} />
          {i === 0 && <path d={`M ${nd.x - 22} ${y} q 11 -26 22 0 t 22 0`} fill="none" stroke={AC} strokeWidth={4.5} strokeLinecap="round" />}
          {(i === 1 || i === 2) && <g stroke={DC} strokeWidth={4.5} fill="none" strokeLinecap="round"><circle cx={nd.x - 11} cy={y} r={13} /><circle cx={nd.x + 11} cy={y} r={13} /></g>}
          {i === 3 && <path d={`M ${nd.x - 24} ${y + 4} L ${nd.x} ${y - 20} L ${nd.x + 24} ${y + 4} M ${nd.x - 17} ${y} L ${nd.x - 17} ${y + 20} L ${nd.x + 17} ${y + 20} L ${nd.x + 17} ${y}`} fill="none" stroke={AC} strokeWidth={4.5} strokeLinejoin="round" />}
          {T_(nd.x, y + 92, nd.n, { c: K.muted, a: "middle", size: 18 })}
        </g>
      ))}
      {/* voltage profile */}
      <g opacity={clamp01(p * 2 - 0.5)}>
        <path d="M 130 1260 L 330 1260 L 330 1170 L 750 1170 L 750 1260 L 950 1260" fill="none" stroke={DC} strokeWidth={3.5} />
        {T_(540, 1156, "400 kV", { c: DC, a: "middle", size: 24, w: 700 })}
        {T_(850, 1296, "230 V", { c: GREEN, a: "middle", size: 24, w: 700 })}
        {T_(230, 1296, "GENERATOR LEVEL", { c: K.muted, a: "middle", size: 16 })}
      </g>
      {void lv}
      {/* readouts */}
      <g transform={`translate(330 ${y - 126}) scale(${0.6 + 0.4 * e})`} opacity={clamp01(e)}>
        <rect x={-92} y={-26} width={184} height={52} rx={26} fill={DC} />
        <text y={9} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={26} fill={K.bgDeep}>STEP UP ↑</text>
      </g>
      <g transform={`translate(750 ${y - 126}) scale(${0.6 + 0.4 * e2})`} opacity={clamp01(e2)}>
        <rect x={-110} y={-26} width={220} height={52} rx={26} fill={DC} />
        <text y={9} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={26} fill={K.bgDeep}>STEP DOWN ↓</text>
      </g>
      {T_(540, 790, `${fmt(Math.min(kv, V_LINE / 1000))} kV`, { c: DC, a: "middle", size: 84, w: 700, ls: 0, op: io(g, [a + 34, a + 44], [0, 1]) * (1 - io(g, [a + 82, a + 88], [0, 1])) })}
      {T_(540, 790, `${fmt(V_RMS)} V`, { c: GREEN, a: "middle", size: 84, w: 700, ls: 0, op: io(g, [a + 86, a + 94], [0, 1]) })}
      {T_(540, 836, g < a + 84 ? "ON THE LONG LINE" : "AT YOUR HOME", { a: "middle", size: 22 })}
    </g>
  );
};

/* ───────────── scene 7: rectifier ───────────── */
const SAMPLES = 220;
/** capacitor-smoothed |sin|: simulated deterministically over 5 windows, the last (periodic) one is used */
const SMOOTH = (() => {
  const dt = 2 / SAMPLES, tau = 2.4, d = Math.exp(-dt / tau);
  let vc = 0, out: number[] = [];
  for (let w = 0; w < 6; w++) { out = []; for (let i = 0; i <= SAMPLES; i++) { const v = Math.abs(Math.sin(TAU * 2 * (i / SAMPLES))); vc = Math.max(v, vc * d); out.push(vc); } }
  return out;
})();
const smoothFn = (u: number) => SMOOTH[Math.min(SAMPLES, Math.round(u * SAMPLES))];
const rectFn = (u: number) => Math.abs(Math.sin(TAU * 2 * u));
const RectScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.rect;
  const cur = sweep(g, a, 50);
  const rows = [
    { y: 730, h: 180, t: "AC IN", fn: sine2, c: AC, at: a, amp: 0.8, m: false },
    { y: 960, h: 180, t: "BRIDGE: FLIP NEGATIVE HALF", fn: rectFn, c: GREEN, at: a + 14, amp: 0.8, m: true },
    { y: 1190, h: 180, t: "CAPACITOR: SMOOTH", fn: (u: number) => smoothFn(u) * 2 - 1, c: DC, at: a + 34, amp: 0.8, m: true },
  ];
  return (
    <g>
      {rows.map((r, i) => {
        const o = io(g, [r.at, r.at + 8], [0, 1]);
        const mapped = r.m ? (u: number) => (i === 1 ? rectFn(u) * 2 - 1 : r.fn(u)) : r.fn;
        return (
          <g key={i} opacity={o}>
            <Scope x={90} y={r.y} w={900} h={r.h} fn={mapped} cur={cur} color={r.c} amp={0.78} dotR={8} />
            {T_(94, r.y - 10, r.t, { c: r.c, size: 20, w: 700 })}
            {i > 0 && <g transform={`translate(950 ${r.y - 24})`}><path d="M -14 -10 L 0 6 L 14 -10" fill="none" stroke={K.text} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} /></g>}
          </g>
        );
      })}
      {T_(966, 1190 + 30, "RIPPLE", { c: DC, a: "end", size: 18, op: io(g, [a + 44, a + 54], [0, 1]) })}
    </g>
  );
};

/* ───────────── scene 8: hero chain ───────────── */
const HeroScene: React.FC<{ g: number }> = ({ g }) => {
  const a = T.hero;
  const hi = [clamp01((g - 682) / 6) * (1 - clamp01((g - 716) / 8) * 0.55), clamp01((g - 716) / 6) * (1 - clamp01((g - 754) / 8) * 0.55), clamp01((g - 754) / 6)];
  const cur = sweep(g, a, 60);
  const bx = [70, 410, 750];
  const col = [AC, GREEN, DC];
  const ttl = ["GRID", "CHARGER", "PHONE"];
  const sub = ["AC · 230 V", "RECTIFIER", "DC · USB 5 V"];
  const flow = pmod(g * 0.03, 1);
  return (
    <g>
      {bx.map((x, i) => (
        <g key={i} opacity={io(g, [a + 2 + i * 4, a + 12 + i * 4], [0, 1])}>
          <rect x={x - 8 * hi[i]} y={720 - 8 * hi[i]} width={260 + 16 * hi[i]} height={420 + 16 * hi[i]} rx={14} fill="rgba(3,11,24,0.6)" stroke={col[i]} strokeWidth={2.4 + 3 * hi[i]} style={{ filter: hi[i] > 0.1 ? `drop-shadow(0 0 ${22 * hi[i]}px ${col[i]})` : undefined }} />
          {T_(x + 130, 770, ttl[i], { c: col[i], a: "middle", size: 28, w: 700 })}
          {T_(x + 130, 1100, sub[i], { c: K.text, a: "middle", size: 20, w: 700, ls: 1.5 })}
        </g>
      ))}
      <Scope x={bx[0] + 20} y={830} w={220} h={220} fn={sine2} cur={cur} color={AC} box={false} grid={false} dotR={7} />
      <Scope x={bx[2] + 20} y={830} w={220} h={220} fn={flat} cur={cur} color={DC} amp={0.5} box={false} grid={false} dotR={7} />
      {/* charger internals: diodes + capacitor */}
      <g opacity={io(g, [a + 10, a + 22], [0, 1])}>
        <path d={`M 450 920 L 490 920 L 490 960 M 490 900 L 490 940 L 460 920 Z`} fill="none" stroke="none" />
        {[0, 1].map((k) => <g key={k} transform={`translate(${470 + 70 * k} 880)`}><path d="M -16 -18 L 16 0 L -16 18 Z" fill={GREEN} fillOpacity={0.3} stroke={GREEN} strokeWidth={3.4} strokeLinejoin="round" /><line x1={18} y1={-18} x2={18} y2={18} stroke={GREEN} strokeWidth={4} /></g>)}
        <g transform="translate(510 990)"><line x1={-34} y1={-6} x2={34} y2={-6} stroke={GREEN} strokeWidth={4.4} /><line x1={-34} y1={8} x2={34} y2={8} stroke={GREEN} strokeWidth={4.4} /><line x1={0} y1={-26} x2={0} y2={-6} stroke={GREEN} strokeWidth={3} /><line x1={0} y1={8} x2={0} y2={28} stroke={GREEN} strokeWidth={3} /></g>
        {T_(540, 842, "DIODES", { c: K.muted, a: "middle", size: 16 })}
        {T_(610, 1008, "CAP", { c: K.muted, a: "start", size: 16 })}
      </g>
      {/* arrows between blocks, with travelling pulse */}
      {[0, 1].map((k) => {
        const x0 = bx[k] + 262, x1 = bx[k + 1] - 2;
        return (
          <g key={k} opacity={io(g, [a + 8 + 6 * k, a + 18 + 6 * k], [0, 1])}>
            <line x1={x0} y1={930} x2={x1} y2={930} stroke={K.text} strokeWidth={4} />
            <path d={`M ${x1 - 12} 918 L ${x1} 930 L ${x1 - 12} 942`} fill="none" stroke={K.text} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={x0 + (x1 - x0) * flow} cy={930} r={7} fill={col[k + 1]} />
          </g>
        );
      })}
      {T_(540, 1200, "THE CHARGER IS THE TRANSLATOR", { c: K.text, a: "middle", size: 24, w: 700, op: io(g, [754, 766], [0, 1]) })}
    </g>
  );
};

/* ───────────── composition of the shot ───────────── */
export const AcDcShot: React.FC = () => {
  const g = useCurrentFrame();
  const sHook = win(g, -40, 104, 1, 10), sDc = win(g, 96, 150, 8, 8), sAc = win(g, 142, 224, 8, 8), sPk = win(g, 214, 326, 8, 8),
    sWhy = win(g, 316, 404, 8, 8), sLoss = win(g, 394, 493, 8, 8), sLine = win(g, 483, 616, 8, 8), sRect = win(g, 606, 686, 8, 8), sHero = win(g, 676, 800, 8, 10);
  const fade = io(g, [T.end - 6, T.end + 2], [0, 1]);
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Headline f={g} lines={["Socket: *AC*", "Phone: *DC*"]} at={-30} exitAt={92} size={100} />
      <Headline f={g} lines={["*DC*: one way"]} at={102} exitAt={138} size={112} />
      <Headline f={g} lines={["*AC* reverses", "100× a second"]} at={148} exitAt={210} size={92} />
      <Headline f={g} lines={["230 V *RMS*", "325 V *peak*"]} at={222} exitAt={312} size={96} />
      <Headline f={g} lines={["Transformers", "need *AC*"]} at={324} exitAt={392} size={100} />
      <Headline f={g} lines={["10× voltage", "1/100 the *loss*"]} at={402} exitAt={480} size={92} />
      <Headline f={g} lines={["Grid *400 kV*", "Home *230 V*"]} at={490} exitAt={604} size={96} />
      <Headline f={g} lines={["The *rectifier*", "makes DC"]} at={614} exitAt={674} size={100} />
      <Headline f={g} lines={["Grid is *AC*"]} at={682} exitAt={712} size={120} />
      <Headline f={g} lines={["Phone is *DC*"]} at={717} exitAt={750} size={120} accent={DC} />
      <Headline f={g} lines={["Charger", "*translates*"]} at={756} exitAt={786} size={104} accent={GREEN} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <g opacity={sHook}><HookScene g={g} /></g>
        <g opacity={sDc}><DcScene g={g} /></g>
        <g opacity={sAc}><AcScene g={g} /></g>
        <g opacity={sPk}><PeakScene g={g} /></g>
        <g opacity={sWhy}><WhyScene g={g} /></g>
        <g opacity={sLoss}><LossScene g={g} /></g>
        <g opacity={sLine}><LineScene g={g} /></g>
        <g opacity={sRect}><RectScene g={g} /></g>
        <g opacity={sHero}><HeroScene g={g} /></g>
      </svg>

      <Panel o={pn(-40, 100)} h={92}>
        <Row size={25}><Hl c={AC}>AC 230 V · 50 Hz</Hl><span style={{ opacity: 0.4 }}>|</span><Hl c={DC}>DC 5 V</Hl></Row>
      </Panel>
      <Panel o={pn(98, 146)} h={92}>
        <Row size={26} color={K.muted}><Hl c={DC}>DC</Hl><span>= one direction, constant voltage</span></Row>
      </Panel>
      <Panel o={pn(144, 220)} h={118}>
        <Row size={26}><Hl c={AC}>50 Hz</Hl><span>= 50 cycles / s</span><span>=</span><Hl c={K.text}>100 reversals / s</Hl></Row>
        <Row size={21}><span>INDIA &amp; MOST OF THE WORLD · US 60 Hz = 120 / s</span></Row>
      </Panel>
      <Panel o={pn(218, 322)} h={118}>
        <Row size={28}><Hl c={DC}>230 V</Hl><span>RMS</span><span>× √2 =</span><Hl c={AC}>{fmt(V_PEAK)} V</Hl><span>PEAK</span></Row>
        <Row size={21}><span>US: {US_RMS} V RMS · {US_HZ} Hz · {fmt(US_PEAK)} V PEAK</span></Row>
      </Panel>
      <Panel o={pn(320, 400)} h={92}>
        <Row size={24}><span>FLUX MUST </span><Hl c={AC}>CHANGE</Hl><span>TO INDUCE A VOLTAGE</span></Row>
      </Panel>
      <Panel o={pn(398, 490)} h={118}>
        <Row size={26}><span>SAME P = V × I:</span><Hl c={GREEN}>10× V</Hl><span>→</span><Hl c={K.text}>I ÷ 10</Hl></Row>
        <Row size={26}><span>LOSS = I² R:</span><Hl c={GREEN}>(1/10)² = 1/100</Hl></Row>
      </Panel>
      <Panel o={pn(487, 614)} h={92}>
        <Row size={24}><Hl c={AC}>PLANT</Hl><span>→</span><Hl c={DC}>400 kV</Hl><span>→</span><Hl c={GREEN}>230 V</Hl><span>AT HOME (INDIA)</span></Row>
      </Panel>
      <Panel o={pn(610, 684)} h={92}>
        <Row size={25}><Hl c={AC}>AC</Hl><span>→</span><Hl c={GREEN}>|AC|</Hl><span>→</span><Hl c={DC}>≈ DC</Hl><span>· EVERY CHARGER</span></Row>
      </Panel>
      <Panel o={pn(680, 794)} h={92}>
        <Row size={21}><Hl c={AC}>230 V AC</Hl><span>→ RECTIFY → SMOOTH → STEP DOWN →</span><Hl c={DC}>5 V DC</Hl></Row>
      </Panel>
    </div>
  );
};

/* ────────── end card (same as #10/#11) ────────── */
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
      <Tag f={f} at={8} text="FOLLOW  +" x={540} y={1330} color={DC} solid size={32} />
      <Label f={f} at={64} text="AKS PRODUCTIONS" x={540} y={1410} size={30} align="center" color={K.text} />
      <Label f={f} at={78} text="HOW IT WORKS · @DEAD.SIMPLE.ENGINEERING" x={540} y={1466} size={20} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: DC }}>HOW IT WORKS · 12</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 130, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>AC vs DC</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 84, lineHeight: 1.1, color: DC }}>who translates?</div>
    </div>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Frame />
      <Scope x={90} y={706} w={900} h={300} fn={sine2} cur={-1} color={AC} />
      <Scope x={90} y={1070} w={900} h={300} fn={flat} cur={-1} color={DC} amp={0.45} />
      {T_(112, 740, "AC  ·  WALL SOCKET", { c: AC, size: 22 })}
      {T_(112, 1104, "DC  ·  YOUR PHONE", { c: DC, size: 22 })}
    </svg>
  </>
);
export { easeInOut, easeOut };
