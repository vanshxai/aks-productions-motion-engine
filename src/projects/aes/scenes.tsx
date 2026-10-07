import React from "react";
import { easeInOut, io } from "../../engine/util";
import { K } from "../minify/brand";
import { Headline, Label, Meter, Readout, Tag, clamp01, ioB } from "../minify/kit";
import { AES } from "./states";

/** Global frames from public/projects/aes/vo.json. Keep in sync with soundtrack.py. */
export const T = { grid: 137, key0: 214, sub: 244, shift: 326, mix: 399, key: 449, rounds: 488, loop: 532, loopEnd: 600, hero: 610, lesson: 705, end: 767, total: 900 };
export const CUTS = [0, 137, 244, 326, 399, 449, 488, 610, 705, 767];
export const HEROF = [610, 635, 659, 684];
type W = [number, number];
type Tbl = { key0: W; sub: W; shift: W; mix: W; key: W };
const MAIN: Tbl = { key0: [216, 238], sub: [250, 304], shift: [340, 384], mix: [404, 436], key: [454, 480] };
const HERO: Tbl = { key0: [0, 0], sub: [612, 632], shift: [637, 656], mix: [661, 680], key: [686, 702] };
const R = AES.rounds, R1 = R[1], PT = Array.from(new TextEncoder().encode(AES.plaintext));
const hx = (b: number) => b.toString(16).padStart(2, "0");
const rnd = (seed: number) => hx(Math.abs(Math.floor(Math.sin(seed * 12.9898) * 43758.5453)) % 256);

/* grid geometry (1080 wide) */
const CWD = 190, CHT = 150, GAP = 14, GX = 139, GY = 640;
const cx = (c: number) => GX + c * (CWD + GAP), cy = (r: number) => GY + r * (CHT + GAP);

type Cell = { text: string; x: number; y: number; o: number; glow: number; col: string; ascii?: string };
const morph = (g: number, w: W, k: number, n: number, from: number, to: number, seed: number) => {
  const sp = 0.5, a = w[0] + (w[1] - w[0]) * sp * (k / Math.max(1, n - 1)), b = a + (w[1] - w[0]) * (1 - sp);
  const p = clamp01((g - a) / (b - a));
  const text = p <= 0 ? hx(from) : p < 0.28 ? hx(from) : p < 0.72 ? rnd(seed + Math.floor(g / 2)) : hx(to);
  return { text, glow: Math.sin(Math.PI * p) * (p > 0 && p < 1 ? 1 : 0), p };
};

const stageCells = (g: number, t: Tbl, hasKey0: boolean): Cell[] => {
  const out: Cell[] = [];
  const stage = g >= t.key[0] ? "key" : g >= t.mix[0] ? "mix" : g >= t.shift[0] ? "shift" : g >= t.sub[0] ? "sub" : hasKey0 && g >= t.key0[0] ? "key0" : "base";
  for (let i = 0; i < 16; i++) {
    const c = Math.floor(i / 4), r = i % 4;
    let text: string, glow = 0, x = c, y = r, o = 1, col = K.line, ascii: string | undefined;
    if (stage === "base") { text = hx(hasKey0 ? PT[i] : R1.start[i]); col = hasKey0 ? K.text : K.line; if (hasKey0) ascii = AES.plaintext[i]; }
    else if (stage === "key0") { const m = morph(g, t.key0, i, 16, PT[i], R1.start[i], i); text = m.text; glow = m.glow; col = m.p < 0.5 ? K.text : K.line; }
    else if (stage === "sub") { const m = morph(g, t.sub, i, 16, R1.start[i], R1.sub![i], i * 3); text = m.text; glow = m.glow; }
    else if (stage === "shift") {
      text = hx(R1.sub![i]);
      const p = io(g, t.shift, [0, 1], easeInOut), xr = c - r * p; glow = r > 0 ? Math.sin(Math.PI * p) * 0.8 : 0;
      if (xr >= -0.5) { x = xr; o = xr < 0 ? 1 - -xr / 0.5 : 1; } else { x = xr + 4; o = clamp01((-0.5 - xr) / 0.5); }
    }
    else if (stage === "mix") { const m = morph(g, t.mix, c, 4, R1.shift![i], R1.mix![i], i * 5); text = m.text; glow = m.glow; }
    else { const m = morph(g, t.key, i, 16, R1.mix![i], R1.out[i], i * 7); text = m.text; glow = m.glow; }
    out.push({ text, x: cx(x), y: cy(y), o, glow, col, ascii });
  }
  return out;
};
const roundCells = (g: number): Cell[] => {
  const k = Math.min(14, 2 + Math.floor((g - 536) / 4.2)), frac = ((g - 536) / 4.2) % 1, fl = frac < 0.4 && g >= 536 && g < T.loopEnd;
  const st = R[Math.max(1, g < 536 ? 1 : k)].out;
  return st.map((b, i) => ({ text: fl ? rnd(i * 11 + k) : hx(b), x: cx(Math.floor(i / 4)), y: cy(i % 4), o: 1, glow: fl ? 0.6 : 0, col: K.line }));
};
const finalCells = (): Cell[] => R[14].out.map((b, i) => ({ text: hx(b), x: cx(Math.floor(i / 4)), y: cy(i % 4), o: 1, glow: 0, col: "#d9786e" }));
const cellsAt = (g: number): Cell[] => (g < T.loop ? stageCells(g, MAIN, true) : g < T.hero ? roundCells(g) : g < T.lesson ? stageCells(g, HERO, false) : finalCells());

const keyWin = (g: number) => (g >= 450 && g < 490 ? io(g, [450, 458], [0, 1]) * (1 - io(g, [478, 488], [0, 1])) : g >= 682 && g < 708 ? io(g, [682, 688], [0, 1]) * (1 - io(g, [698, 706], [0, 1])) : 0);

export const Grid: React.FC<{ g: number }> = ({ g }) => {
  const cells = cellsAt(g), kw = keyWin(g);
  const dim = g >= T.lesson ? 1 : 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: dim }}>
      {cells.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: CWD, height: CHT, opacity: c.o, borderRadius: 18,
          border: `2px solid ${c.glow > 0.05 ? K.line : K.rule}`, background: `linear-gradient(180deg, rgba(245,169,60,${0.03 + 0.2 * c.glow}), rgba(11,7,5,0.95))`,
          boxShadow: c.glow > 0.05 ? `0 0 ${34 * c.glow}px rgba(245,169,60,${0.45 * c.glow})` : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: K.mono, fontWeight: 700, fontSize: 72, letterSpacing: -2, color: c.glow > 0.4 ? K.amber : c.col, fontVariantNumeric: "tabular-nums" }}>{c.text}</div>
          {c.ascii && <div style={{ fontFamily: K.mono, fontSize: 26, color: K.dim, marginTop: -2 }}>{c.ascii === " " ? "␣" : c.ascii}</div>}
          {kw > 0.01 && (
            <div style={{ position: "absolute", right: 12, top: 8, fontFamily: K.mono, fontSize: 24, color: K.amber, opacity: kw }}>⊕{hx(R1.key[i])}</div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ────────── step labels, chips, counters ────────── */
const stepAt = (g: number): { i: number; label: string } | null => {
  const m: [number, number, number, string][] = [
    [T.key0, T.sub, -1, "ROUND 0 · KEY IN"], [T.sub, T.shift, 0, "SUBBYTES"], [T.shift, T.mix, 1, "SHIFTROWS"], [T.mix, T.key, 2, "MIXCOLUMNS"], [T.key, T.rounds, 3, "ADDROUNDKEY"],
    [HEROF[0], HEROF[1], 0, "SUBBYTES"], [HEROF[1], HEROF[2], 1, "SHIFTROWS"], [HEROF[2], HEROF[3], 2, "MIXCOLUMNS"], [HEROF[3], T.lesson, 3, "ADDROUNDKEY"],
  ];
  const s = m.find(([a, b]) => g >= a && g < b);
  return s ? { i: s[2], label: s[3] } : null;
};
export const Lower: React.FC<{ g: number }> = ({ g }) => {
  const s = stepAt(g);
  const chips = ["SWAP", "SHIFT", "MIX", "KEY"];
  const showChips = (g >= T.sub && g < T.rounds) || (g >= T.hero && g < T.lesson);
  const k = g < 536 ? 1 : Math.min(14, 2 + Math.floor((g - 536) / 4.2));
  const showRound = g >= T.rounds && g < T.hero - 6;
  const ro = clamp01((g - T.rounds) / 8) * (1 - io(g, [T.hero - 14, T.hero - 6], [0, 1]));
  const ct = AES.ct.map(hx).join("");
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* hook: plaintext string */}
      {g < T.sub && <>
        <Tag f={g} at={6} text="PLAINTEXT · 16 BYTES" x={540} y={1350} color={K.amber} solid size={28} out={T.grid - 6} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1400, textAlign: "center", opacity: io(g, [10, 22], [0, 1]) * (1 - io(g, [T.grid - 10, T.grid + 2], [0, 1])) }}><Readout value={`"${AES.plaintext}"`} size={52} color={K.text} /></div>
        <Tag f={g} at={T.grid + 10} text="128 BITS = 16 BYTES" x={540} y={1350} color={K.amber} solid size={28} out={T.key0 - 6} />
        <Label f={g} at={T.grid + 40} text="FILLED COLUMN BY COLUMN ↓" x={540} y={1410} size={24} align="center" color={K.muted} out={T.key0 - 6} />
        <Tag f={g} at={T.key0 + 4} text="ROUND 0 · KEY IN" x={540} y={1350} color={K.line} solid size={28} out={T.sub - 4} />
      </>}
      {s && s.i >= 0 && <Tag f={g} at={s.i === 0 && g < 400 ? T.sub : g < 700 ? [T.sub, T.shift, T.mix, T.key][s.i] : HEROF[s.i]} text={s.label} x={540} y={1350} color={K.line} solid size={32} />}
      {/* s-box lookup (real byte) */}
      {g >= 258 && g < 326 && <div style={{ position: "absolute", left: 0, right: 0, top: 1400, textAlign: "center", opacity: io(g, [258, 268], [0, 1]) * (1 - io(g, [312, 322], [0, 1])) }}>
        <span style={{ fontFamily: K.mono, fontSize: 34, color: K.muted, letterSpacing: 3 }}>S-BOX  </span><Readout value={`${hx(R1.start[0])} → ${hx(R1.sub![0])}`} size={44} color={K.amber} />
      </div>}
      {/* shift: how far each row moves */}
      {g >= 330 && g < 400 && [0, 1, 2, 3].map((r) => (
        <div key={r} style={{ position: "absolute", left: 24, width: 104, textAlign: "center", top: cy(r) + CHT / 2 - 22, fontFamily: K.mono, fontWeight: 700, fontSize: 30, color: r ? K.amber : K.dim, opacity: io(g, [330 + r * 3, 340 + r * 3], [0, 1]) * (1 - io(g, [388, 398], [0, 1])) }}>{r ? `←${r}` : "·0"}</div>
      ))}
      {g >= 408 && g < 446 && <Label f={g} at={408} text="EACH COLUMN BLENDS ITS 4 BYTES" x={540} y={1410} size={24} align="center" color={K.muted} out={440} />}
      {/* step chips */}
      {showChips && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1450, display: "flex", justifyContent: "center", gap: 14 }}>
          {chips.map((w, i) => {
            const cur = s ? s.i === i : false, done = s ? s.i > i : false;
            return <div key={w} style={{ padding: "14px 22px", borderRadius: 999, border: `2px solid ${cur || done ? K.line : K.rule}`, background: cur ? K.line : done ? "rgba(245,169,60,0.14)" : "transparent", color: cur ? K.bgDeep : done ? K.line : K.dim, fontFamily: K.mono, fontWeight: 700, fontSize: 26, letterSpacing: 2 }}>{w}</div>;
          })}
        </div>
      )}
      {/* round counter */}
      {showRound && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1320, opacity: ro }}>
          <div style={{ textAlign: "center" }}><Readout value={`ROUND ${String(k).padStart(2, "0")} / 14`} size={64} color={k === 14 ? K.green : K.amber} /></div>
          <Meter x={139} y={92} w={802} v={k / 14} label="ROUNDS COMPLETE" value={`${k}`} color={K.line} />
        </div>
      )}
      <Tag f={g} at={T.loopEnd - 6} text="256-BIT KEY · 14 ROUNDS" x={540} y={1530} color={K.green} size={26} out={T.hero - 6} />
      {/* lesson: plaintext vs ciphertext */}
      {g >= T.lesson && (
        <div style={{ position: "absolute", left: 100, right: 100, top: 1372, opacity: io(g, [T.lesson, T.lesson + 10], [0, 1]) * (1 - io(g, [T.end - 8, T.end], [0, 1])) }}>
          <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 5, color: K.dim }}>PLAINTEXT</div>
          <Readout value={AES.plaintext} size={44} color={K.text} />
          <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 5, color: K.dim, marginTop: 22 }}>CIPHERTEXT</div>
          <Readout value={ct.slice(0, 16) + "…"} size={44} color="#d9786e" />
        </div>
      )}
      <Tag f={g} at={T.lesson + 14} text="NOISE ✕" x={850} y={1338} color="#d9786e" solid size={30} out={T.end - 8} />
    </div>
  );
};

export const Heads: React.FC<{ g: number }> = ({ g }) => (
  <>
    <Headline f={g} at={-30} exitAt={128} lines={["A grid, scrambled", "*14 times*"]} top={340} size={90} />
    <Headline f={g} at={T.grid} exitAt={236} lines={["16 bytes,", "one *grid*"]} top={340} size={96} />
    <Headline f={g} at={T.sub} exitAt={320} lines={["*Swap*", "every byte"]} top={340} size={96} />
    <Headline f={g} at={T.shift} exitAt={392} lines={["*Shift*", "each row"]} top={340} size={96} />
    <Headline f={g} at={T.mix} exitAt={442} lines={["*Mix*", "every column"]} top={340} size={96} />
    <Headline f={g} at={T.key} exitAt={482} lines={["Add the", "*key*"]} top={340} size={96} />
    <Headline f={g} at={T.rounds} exitAt={528} lines={["That's one", "*round*"]} top={340} size={96} />
    <Headline f={g} at={T.loop} exitAt={602} lines={["Fourteen", "*rounds*"]} top={340} size={96} />
    {["Swap.", "Shift.", "Mix.", "Key."].map((w, i) => (
      <Headline key={w} f={g} at={HEROF[i] - 2} exitAt={i < 3 ? HEROF[i + 1] - 8 : T.lesson - 8} lines={[`*${w}*`]} top={380} size={128} />
    ))}
    <Headline f={g} at={T.lesson} exitAt={T.end - 10} lines={["Without the key,", "it's *noise*"]} top={340} size={92} />
  </>
);

export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.line }}>HOW IT WORKS · 02</div>
      <div style={{ fontFamily: K.head, fontWeight: 800, fontSize: 112, lineHeight: 1.02, color: K.text, letterSpacing: -4, textAlign: "center" }}>AES-256 is</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: K.amber }}>just a grid</div>
    </div>
    <Grid g={0} />
  </>
);
export { ioB };
