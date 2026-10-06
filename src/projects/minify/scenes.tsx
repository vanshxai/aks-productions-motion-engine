import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "./brand";
import { Headline, Label, Meter, Readout, Tag, clamp01, ioB } from "./kit";
import { BY, BYTES, LINES, LOGIC, NAMES, RENAMES, ROUTE, STAGES, TOKS, Kind } from "./code";

/** Global frames from public/projects/minify/vo.json. Keep in sync with soundtrack.py. */
export const T = { strip: 100, rename: 180, squash: 226, bytes: 294, to92: 339, restore: 374, survive: 466, logic: 511, routes: 542, notnot: 589, hero: 615, lesson: 718, end: 777, total: 900 };
export const HERO = [615, 639, 665, 692];
export const CUTS = [0, 100, 180, 226, 374, 466, 615, 718, 777];

/* ────────── stage choreography ────────── */
type Seg = { a: number; b: number; from: number; to: number; st: number };
const SEGS: Seg[] = [
  { a: 138, b: 170, from: 0, to: 1, st: 0.25 },     // strip: comments + spaces go, tokens close up
  { a: 196, b: 224, from: 1, to: 2, st: 0.35 },     // rename: identifiers shrink to one letter
  { a: 250, b: 292, from: 2, to: 3, st: 0.45 },     // squash: every line flows onto one
  { a: 410, b: 452, from: 3, to: 4, st: 0.45 },     // formatter: structure comes back
  { a: 611, b: 612, from: 4, to: 0, st: 0 },        // hero replay (hidden under the scan)
  { a: 617, b: 634, from: 0, to: 1, st: 0.1 },
  { a: 641, b: 658, from: 1, to: 2, st: 0.12 },
  { a: 667, b: 686, from: 2, to: 3, st: 0.18 },
  { a: 694, b: 714, from: 3, to: 4, st: 0.18 },
];
const ORDER = TOKS.map((t) => t.id);
const segAt = (g: number) => {
  let s: Seg | null = null;
  for (const x of SEGS) if (g >= x.a) s = x;
  return s;
};
/** stage index the card "is" at (for byte / line readouts and the header) */
export const stageAt = (g: number) => {
  const s = segAt(g);
  if (!s) return { from: 0, to: 0, p: 1 };
  return { from: s.from, to: s.to, p: io(g, [s.a, s.b], [0, 1], easeInOut) };
};

/* ────────── code card geometry ────────── */
const FS = 30, CW = FS * 0.6, LH = FS * 1.62;
const CX = 60, CY = 610, CWID = 960, CH = 510, HEAD = 64;
const X0 = CX + 48, Y0 = CY + HEAD + 36;
const COL: Record<Kind, string> = { kw: K.line, id: K.text, prop: K.cold, pun: K.dim, op: K.muted, str: K.green, num: K.amber, cm: "#7d6a58" };
const GLYPHS = "abcdefghijklmnopqrstuvwxyz$_";
const scramble = (n: number, seed: number) => Array.from({ length: n }, (_, i) => GLYPHS[Math.abs(Math.floor(Math.sin((seed + i) * 91.7) * 1e4)) % GLYPHS.length]).join("");

const tokState = (g: number, id: string, idx: number) => {
  const s = segAt(g);
  const from = s ? STAGES[s.from].toks[id] : STAGES[0].toks[id];
  const to = s ? STAGES[s.to].toks[id] : STAGES[0].toks[id];
  if (!s) return { col: from?.col ?? 0, row: from?.row ?? 0, o: from ? 1 : 0, text: from?.text ?? "", p: 1 };
  const span = s.b - s.a, n = ORDER.length;
  const lag = s.st * span * (idx / n);
  const p = io(g, [s.a + lag, s.a + lag + span * (1 - s.st)], [0, 1], easeInOut);
  if (!from && !to) return { col: 0, row: 0, o: 0, text: "", p };
  if (!to) return { col: from!.col, row: from!.row, o: 1 - p, text: from!.text, p };
  if (!from) return { col: to.col, row: to.row, o: p, text: to.text, p };
  let text = to.text;
  if (from.text !== to.text) {
    if (p < 0.35) text = from.text;
    else if (p < 0.75) { const k = Math.round(from.text.length + (to.text.length - from.text.length) * ((p - 0.35) / 0.4)); text = scramble(Math.max(1, k), idx * 7 + Math.floor(g / 2)); }
  }
  return { col: from.col + (to.col - from.col) * p, row: from.row + (to.row - from.row) * p, o: 1, text, p };
};

/** whitespace removed by the strip step, drawn as red dots before the tokens close up */
const stripDots = () => {
  const a = STAGES[0], b = STAGES[1], out: { col: number; row: number }[] = [];
  const prevEnd = (st: typeof a, id: string) => {
    const me = st.toks[id]; let end = 0;
    for (const t of ORDER) { const q = st.toks[t]; if (!q || t === id) { if (t === id) break; continue; } if (q.row === me.row) end = q.col + q.text.length; }
    return end;
  };
  for (const id of ORDER) {
    const x = a.toks[id], y = b.toks[id];
    if (!x || !y || id === "cm") continue;
    const ga = x.col - prevEnd(a, id), gb = y.col - prevEnd(b, id);
    for (let k = 0; k < ga - gb; k++) out.push({ col: x.col - ga + k, row: x.row });
  }
  return out;
};
const DOTS = stripDots();
/** line ends that the squash step removes */
const NL = Array.from({ length: STAGES[2].rows - 1 }, (_, r) => {
  let end = 0;
  for (const id of ORDER) { const q = STAGES[2].toks[id]; if (q && q.row === r) end = Math.max(end, q.col + q.text.length); }
  return { col: end, row: r };
});

const HEADER = ["invoice.js", "invoice.js · stripped", "invoice.js · renamed", "invoice.min.js", "invoice.min.js · formatted"];

export const CodeCard: React.FC<{ g: number }> = ({ g }) => {
  const st = stageAt(g);
  const shown = st.p > 0.5 ? st.to : st.from;
  const inHero = g >= 611 && g < 718;
  const dim = g >= T.lesson ? 0.85 : 1;
  // highlight windows
  const ren = (i: number) => (g >= 180 && g < 236 ? clamp01((g - 182 - i * 1.4) / 8) * (1 - io(g, [226, 236], [0, 1])) : 0);
  const gone = g >= T.survive && g < T.hero ? io(g, [T.survive, T.survive + 12], [0, 1]) : 0;
  const logic = (i: number) => (g >= T.logic && g < T.hero ? clamp01((g - T.logic - i * 2) / 8) : 0);
  const route = g >= T.routes && g < T.hero ? clamp01((g - T.routes) / 8) : 0;
  const cmRed = g >= 106 && g < 140 ? clamp01((g - 106) / 6) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: dim }}>
      {/* card */}
      <div style={{ position: "absolute", left: CX, top: CY, width: CWID, height: CH, borderRadius: 22, background: "linear-gradient(180deg,#120b07,#0b0705)", border: `2px solid ${K.rule}`, boxShadow: `0 0 0 1px rgba(245,169,60,0.08), 0 30px 80px rgba(0,0,0,0.6)` }}>
        <div style={{ height: HEAD, borderBottom: `2px solid ${K.rule}`, display: "flex", alignItems: "center", padding: "0 26px", gap: 12 }}>
          {["#ff5a4f", "#f5a93c", "#7fd69b"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.85 }} />)}
          <div style={{ marginLeft: 18, fontFamily: K.mono, fontSize: 24, color: K.muted, letterSpacing: 1 }}>{HEADER[shown]}</div>
          <div style={{ marginLeft: "auto", fontFamily: K.mono, fontSize: 22, color: shown >= 3 ? K.line : K.dim, letterSpacing: 3 }}>{shown === 0 ? "SOURCE" : shown === 4 ? "FORMATTED" : shown === 3 ? "MINIFIED" : "MINIFYING…"}</div>
        </div>
      </div>
      {/* gutter line numbers */}
      {Array.from({ length: 7 }).map((_, r) => {
        const rows = st.p > 0.5 ? LINES[st.to] : LINES[st.from];
        return <div key={r} style={{ position: "absolute", left: CX + 12, top: Y0 + r * LH, width: 24, textAlign: "right", fontFamily: K.mono, fontSize: 18, lineHeight: `${LH}px`, color: "#4a3a2c", opacity: r < rows ? 1 : 0 }}>{r + 1}</div>;
      })}
      {/* removed whitespace dots */}
      {DOTS.map((d, i) => {
        const o = (g >= 112 && g < 170 ? clamp01((g - 112 - (i % 12)) / 6) * (1 - io(g, [138, 156], [0, 1])) : 0) + (inHero ? bump(g, 612, 626) : 0);
        return o > 0.01 ? <div key={i} style={{ position: "absolute", left: X0 + d.col * CW + CW / 2 - 4, top: Y0 + d.row * LH + LH / 2 - 4, width: 8, height: 8, borderRadius: 4, background: K.red, opacity: o, boxShadow: `0 0 10px ${K.red}` }} /> : null;
      })}
      {/* line-break markers */}
      {NL.map((d, i) => {
        const o = (g >= 230 && g < 300 ? clamp01((g - 230 - i * 3) / 6) * (1 - io(g, [252, 270], [0, 1])) : 0) + (inHero ? bump(g, 658, 672) : 0);
        return o > 0.01 ? <div key={i} style={{ position: "absolute", left: X0 + d.col * CW + 6, top: Y0 + d.row * LH, fontFamily: K.mono, fontSize: FS, lineHeight: `${LH}px`, color: K.red, opacity: o, textShadow: `0 0 12px ${K.red}` }}>↵</div> : null;
      })}
      {/* tokens */}
      {ORDER.map((id, idx) => {
        const s = tokState(g, id, idx);
        if (s.o <= 0.01) return null;
        const tk = BY[id];
        const ni = NAMES.indexOf(id), li = LOGIC.indexOf(id);
        let color = COL[tk.k], bg = "transparent", line = "none";
        if (id === "cm" && cmRed > 0) { color = K.red; line = "line-through"; }
        if (ni >= 0 && ren(ni) > 0) { color = K.amber; bg = `rgba(245,169,60,${0.22 * ren(ni)})`; }
        if (ni >= 0 && gone > 0) { color = K.red; bg = `rgba(255,90,79,${0.14 * gone})`; }
        if (li >= 0 && logic(li) > 0) { bg = `rgba(127,214,155,${0.2 * logic(li)})`; color = K.green; }
        if (ROUTE.includes(id) && route > 0) { bg = `rgba(127,214,155,${0.24 * route})`; color = K.green; }
        return (
          <div key={id} style={{ position: "absolute", left: X0 + s.col * CW, top: Y0 + s.row * LH, height: LH, fontFamily: K.mono, fontSize: FS, lineHeight: `${LH}px`, whiteSpace: "pre", fontVariantLigatures: "none", fontFeatureSettings: '"liga" 0, "calt" 0',
            color, background: bg, borderRadius: 6, opacity: s.o, textDecoration: line, textDecorationThickness: 3, fontStyle: tk.k === "cm" ? "italic" : "normal", fontWeight: tk.k === "kw" ? 700 : 400 }}>{s.text}</div>
        );
      })}
    </div>
  );
};
const bump = (g: number, a: number, b: number) => (g > a && g < b ? Math.sin((Math.PI * (g - a)) / (b - a)) : 0);

/* ────────── readouts under the card ────────── */
const lerpStage = (g: number, arr: number[]) => { const s = stageAt(g); return Math.round(arr[s.from] + (arr[s.to] - arr[s.from]) * s.p); };

const Stat: React.FC<{ x: number; label: string; value: string; color: string; o: number }> = ({ x, label, value, color, o }) => (
  <div style={{ position: "absolute", left: x, top: 1160, opacity: o }}>
    <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 5, color: K.dim, marginBottom: 4 }}>{label}</div>
    <Readout value={value} size={78} color={color} />
  </div>
);

export const Lower: React.FC<{ g: number }> = ({ g }) => {
  const b = lerpStage(g, BYTES), l = lerpStage(g, LINES);
  const o = 1 - io(g, [T.hero - 8, T.hero], [0, 1]);
  const small = b < BYTES[0];
  const big = g >= T.bytes && g < T.restore ? io(g, [T.bytes, T.bytes + 10], [0, 1]) * (1 - io(g, [T.restore - 8, T.restore], [0, 1])) : 0;
  const pct = Math.round((1 - BYTES[3] / BYTES[0]) * 100);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Stat x={110} label="SIZE" value={`${b} B`} color={small ? K.amber : K.text} o={o} />
      <Stat x={560} label="LINES" value={`${l}`} color={l === 1 ? K.amber : K.text} o={o} />
      {/* strip tags */}
      <Tag f={g} at={110} text="− COMMENTS" x={300} y={1380} color={K.red} size={26} out={176} />
      <Tag f={g} at={122} text="− SPACES" x={700} y={1380} color={K.red} size={26} out={176} />
      {/* rename legend (the real renames terser made) */}
      {RENAMES.map(([a, z], i) => {
        const p = g >= 196 && g < 300 ? clamp01((g - 196 - i * 4) / 8) * (1 - io(g, [288, 296], [0, 1])) : 0;
        const col = i % 2, row = Math.floor(i / 2);
        return p > 0.01 ? (
          <div key={i} style={{ position: "absolute", left: 110 + col * 450, top: 1330 + row * 54, opacity: p, transform: `translateY(${(1 - p) * 16}px)`, fontFamily: K.mono, fontSize: 28, color: K.muted, whiteSpace: "nowrap" }}>
            <span style={{ color: K.text }}>{a}</span><span style={{ color: K.dim }}>  →  </span><span style={{ color: K.amber, fontWeight: 700 }}>{z}</span>
          </div>) : null;
      })}
      {/* squash: 209 → 92 */}
      <Tag f={g} at={292} text="1 LINE" x={860} y={1192} color={K.amber} solid size={24} out={372} />
      {big > 0.01 && (
        <div style={{ position: "absolute", left: 110, width: 860, top: 1340, opacity: big }}>
          <Meter x={0} y={0} w={860} v={io(g, [T.to92 - 4, T.to92 + 14], [1, BYTES[3] / BYTES[0]], easeOut)} label={`SIZE VS SOURCE (${BYTES[0]} B)`} value={g >= T.to92 ? `${BYTES[3]} B` : `${BYTES[0]} B`} color={K.line} />
        </div>
      )}
      <Tag f={g} at={T.to92 + 10} text={`${pct}% SMALLER`} x={540} y={1480} color={K.green} solid size={28} out={372} />
      {/* formatter */}
      <FormatBtn g={g} />
      <Tag f={g} at={452} text="STRUCTURE IS BACK" x={540} y={1480} color={K.amber} size={26} out={466} />
      {/* what survives */}
      <Check g={g} at={T.survive} y={1330} ok={false} text="NAMES" note="gone" />
      <Check g={g} at={T.logic} y={1390} ok text="LOGIC" note="readable" />
      <Check g={g} at={T.routes} y={1450} ok text="API ROUTES" note="readable" />
    </div>
  );
};

const FormatBtn: React.FC<{ g: number }> = ({ g }) => {
  if (g < 380 || g > 470) return null;
  const p = ioB(g, 380, 394), press = bump(g, 400, 412), o = 1 - io(g, [452, 462], [0, 1]);
  const on = g >= 404;
  return (
    <div style={{ position: "absolute", left: 540, top: 1380, transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * p) * (1 - 0.08 * press)})`, opacity: clamp01((g - 380) / 4) * o,
      padding: "18px 34px", borderRadius: 16, border: `2px solid ${K.line}`, background: on ? K.line : K.tagBg, color: on ? K.bgDeep : K.line,
      fontFamily: K.mono, fontWeight: 700, fontSize: 30, letterSpacing: 3, whiteSpace: "nowrap", boxShadow: on ? `0 0 40px ${K.line}88` : "none" }}>
      ▸ FORMAT DOCUMENT
    </div>
  );
};

const Check: React.FC<{ g: number; at: number; y: number; ok: boolean; text: string; note: string }> = ({ g, at, y, ok, text, note }) => {
  if (g < at || g >= T.hero) return null;
  const p = ioB(g, at, at + 12), o = clamp01((g - at) / 4) * (1 - io(g, [T.hero - 8, T.hero], [0, 1]));
  const c = ok ? K.green : K.red;
  return (
    <div style={{ position: "absolute", left: 140, top: y, opacity: o, transform: `translateX(${(1 - p) * -30}px)`, display: "flex", alignItems: "center", gap: 22, fontFamily: K.mono, fontSize: 32, whiteSpace: "nowrap" }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${c}`, background: `${c}22`, color: c, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{ok ? "✓" : "✕"}</div>
      <span style={{ color: K.text, fontWeight: 700, letterSpacing: 3 }}>{text}</span>
      <span style={{ color: c }}>{note}</span>
    </div>
  );
};

/** READABLE stamp across the card */
export const Stamp: React.FC<{ g: number }> = ({ g }) => {
  if (g < T.notnot || g >= T.hero) return null;
  const p = ioB(g, T.notnot, T.notnot + 10), o = clamp01((g - T.notnot) / 3) * (1 - io(g, [T.hero - 6, T.hero], [0, 1]));
  return (
    <div style={{ position: "absolute", left: 540, top: 1000, transform: `translate(-50%,-50%) rotate(-8deg) scale(${1.6 - 0.6 * p})`, opacity: o,
      border: `6px solid ${K.red}`, borderRadius: 14, padding: "8px 30px", fontFamily: K.mono, fontWeight: 700, fontSize: 64, letterSpacing: 10, color: K.red, background: "rgba(8,4,2,0.82)", boxShadow: `0 0 50px ${K.red}55` }}>
      READABLE
    </div>
  );
};

/* ────────── hero: four steps light up in order ────────── */
export const HeroPipe: React.FC<{ g: number }> = ({ g }) => {
  if (g < T.hero - 2 || g >= T.lesson + 10) return null;
  const words = ["STRIP", "RENAME", "SQUASH", "RESTORE"];
  const o = io(g, [T.hero - 2, T.hero + 8], [0, 1]) * (1 - io(g, [T.lesson, T.lesson + 10], [0, 1]));
  const b = lerpStage(g, BYTES);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1190, opacity: o }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
        {words.map((w, i) => {
          const on = g >= HERO[i] + 2, cur = on && (i === 3 || g < HERO[i + 1] + 2);
          const c = i === 3 ? K.green : K.line;
          return (
            <div key={w} style={{ padding: "14px 18px", borderRadius: 999, border: `2px solid ${on ? c : K.rule}`, background: cur ? c : on ? `${c}22` : "transparent",
              color: cur ? K.bgDeep : on ? c : K.dim, fontFamily: K.mono, fontWeight: 700, fontSize: 25, letterSpacing: 2, transform: `scale(${cur ? 1 + 0.08 * bump(g, HERO[i] + 2, HERO[i] + 14) : 1})` }}>{w}</div>
          );
        })}
      </div>
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Readout value={`${b} B`} size={72} color={b <= BYTES[3] ? K.amber : K.text} />
      </div>
    </div>
  );
};

/* ────────── headlines ────────── */
export const Heads: React.FC<{ g: number }> = ({ g }) => (
  <>
    <Headline f={g} at={-30} exitAt={92} lines={["Minified isn't", "*hidden*"]} top={340} size={96} />
    <Headline f={g} at={100} exitAt={174} lines={["Strip the", "*extras*"]} top={340} size={96} />
    <Headline f={g} at={180} exitAt={220} lines={["Rename", "*everything*"]} top={340} size={96} />
    <Headline f={g} at={226} exitAt={366} lines={["Squash it to", "*one line*"]} top={340} size={96} />
    <Headline f={g} at={374} exitAt={458} lines={["Paste it into a", "*formatter*"]} top={340} size={96} />
    <Headline f={g} at={466} exitAt={606} lines={["Names gone.", "*Logic* stays."]} top={340} size={96} />
    {["Strip.", "Rename.", "Squash.", "Restore."].map((w, i) => (
      <Headline key={w} f={g} at={HERO[i] - 2} exitAt={i < 3 ? HERO[i + 1] - 8 : T.lesson - 8} lines={[`*${w}*`]} top={380} size={128} />
    ))}
    <Headline f={g} at={T.lesson} exitAt={T.end - 10} lines={["Smaller,", "not *secret*"]} top={340} size={104} />
  </>
);

/** lesson tags */
export const Lesson: React.FC<{ g: number }> = ({ g }) => (
  <>
    <Tag f={g} at={T.lesson + 6} text="SMALLER ✓" x={330} y={1250} color={K.green} solid size={34} out={T.end - 8} />
    <Tag f={g} at={746} text="SECRET ✕" x={750} y={1250} color={K.red} solid size={34} out={T.end - 8} />
  </>
);

/* ────────── end card: follow only ────────── */
const Star: React.FC<{ s: number; c: string; glow?: number }> = ({ s, c, glow = 0 }) => (
  <svg width={s * 2} height={s * 2} viewBox="-1.1 -1.1 2.2 2.2" style={{ overflow: "visible", filter: glow ? `drop-shadow(0 0 ${18 * glow}px ${K.amberDeep})` : undefined }}>
    <path d="M 0 -1 Q 0.14 -0.14 1 0 Q 0.14 0.14 0 1 Q -0.14 0.14 -1 0 Q -0.14 -0.14 0 -1 Z" fill={c} />
  </svg>
);

export const End: React.FC = () => {
  const f = useCurrentFrame();
  const p = ioB(f, 2, 20), spin = io(f, [2, 30], [-90, 0], easeOut);
  const tap = (f - 70) % 40, ring = f >= 70 && f < 118 ? clamp01(tap / 22) : 0;
  const press = f >= 70 && f < 118 ? bump(tap, 0, 10) : 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 540, top: 560, transform: `translate(-50%,-50%) rotate(${spin}deg) scale(${0.4 + 0.6 * p})`, opacity: clamp01(f / 6) }}>
        <Star s={110} c={K.line} glow={0.9 + 0.3 * Math.sin(f * 0.2)} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: K.serif, fontStyle: "italic", fontSize: 168, lineHeight: 1, color: K.text, letterSpacing: -2,
        opacity: io(f, [8, 22], [0, 1]), transform: `translateY(${io(f, [8, 26], [30, 0], easeOut)}px)` }}>
        Dev<span style={{ color: K.line }}>Aegis</span>
      </div>
      <Label f={f} at={26} text="YOUR CODE IS MONEY. LEARN TO PROTECT IT." x={540} y={910} size={24} align="center" color={K.muted} />
      {/* follow button with tap ring */}
      <div style={{ position: "absolute", left: 540, top: 1150, transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * ioB(f, 34, 48)) * (1 - 0.06 * press)})`, opacity: clamp01((f - 34) / 4) }}>
        <div style={{ position: "relative", padding: "26px 74px", borderRadius: 999, background: "linear-gradient(180deg,#ffcb80,#ee8517)", color: "#2e1502", fontFamily: K.head, fontWeight: 800, fontSize: 54, letterSpacing: -0.5, whiteSpace: "nowrap", boxShadow: `0 0 60px rgba(238,133,23,0.45)` }}>
          Follow
          {ring > 0 && <div style={{ position: "absolute", left: "50%", top: "50%", width: 120, height: 120, marginLeft: -60, marginTop: -60, borderRadius: 60, border: `4px solid ${K.text}`, transform: `scale(${0.4 + 2.4 * ring})`, opacity: 0.8 * (1 - ring) }} />}
        </div>
      </div>
      <Label f={f} at={52} text="@devaegis" x={540} y={1262} size={34} align="center" color={K.text} />
      <Label f={f} at={66} text="ONE DEV LESSON PER REEL" x={540} y={1326} size={24} align="center" color={K.dim} />
    </div>
  );
};

/* ────────── cover (frame-0 hook as a still) ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.line }}>HOW IT WORKS · 01</div>
      <div style={{ fontFamily: K.head, fontWeight: 800, fontSize: 112, lineHeight: 1.02, color: K.text, letterSpacing: -4, textAlign: "center" }}>Minified isn't</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: K.amber }}>hidden</div>
    </div>
    <CodeCard g={0} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1190, textAlign: "center" }}><Readout value={`${BYTES[0]} B → ${BYTES[3]} B`} size={72} color={K.amber} /></div>
  </>
);

export { easeInOut };
