import React from "react";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../minify/brand";
import { Headline, Label, Readout, Tag, clamp01, ioB } from "../minify/kit";

/** Global frames from public/projects/leak/vo.json. Keep in sync with soundtrack.py. */
export const T = { env: 103, build: 189, found: 271, why: 384, fix: 472, hero: 635, lesson: 724, end: 779, total: 900 };
export const CUTS = [0, 103, 189, 271, 384, 472, 635, 724, 779];
export const HEROF = [635, 657, 681, 703];
const KEY = "sk_live_9f3a7c21";
const FS = 30, CW = FS * 0.6, LH = FS * 1.62, BX = 60, BW = 960, HEAD = 64, PAD = 36;
const RED = K.red, GREEN = K.green, AMB = K.line;
const bump = (g: number, a: number, b: number) => (g > a && g < b ? Math.sin((Math.PI * (g - a)) / (b - a)) : 0);

type Seg = [string, string, string?];
const lx = (col: number) => BX + 48 + col * CW;
const ly = (top: number, row: number) => top + HEAD + PAD + row * LH;

/** a code box. `rows` = array of segment lists. */
const Box: React.FC<{ top: number; title: string; badge?: string; rows: Seg[][]; o: number; hiKey?: number; keyShow?: number; ty?: number }> = ({ top, title, badge, rows, o, hiKey = 0, keyShow = 1, ty = 0 }) => {
  const h = HEAD + PAD * 2 + rows.length * LH;
  return (
    <div style={{ position: "absolute", left: BX, top: top + ty, width: BW, height: h, opacity: o, borderRadius: 22, background: "linear-gradient(180deg,#120b07,#0b0705)", border: `2px solid ${K.rule}`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
      <div style={{ height: HEAD, borderBottom: `2px solid ${K.rule}`, display: "flex", alignItems: "center", padding: "0 26px", gap: 12 }}>
        {["#ff5a4f", "#f5a93c", "#7fd69b"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.85 }} />)}
        <div style={{ marginLeft: 18, fontFamily: K.mono, fontSize: 24, color: K.muted }}>{title}</div>
        {badge && <div style={{ marginLeft: "auto", fontFamily: K.mono, fontSize: 22, color: K.dim, letterSpacing: 3 }}>{badge}</div>}
      </div>
      {rows.map((segs, r) => (
        <div key={r} style={{ position: "absolute", left: 48, top: HEAD + PAD + r * LH, height: LH, lineHeight: `${LH}px`, fontFamily: K.mono, fontSize: FS, whiteSpace: "pre", fontVariantLigatures: "none" }}>
          {segs.map(([t, c, id], j) => {
            const isKey = id === "key";
            return <span key={j} style={{ color: isKey && hiKey > 0 ? K.text : c, background: isKey && hiKey > 0 ? `rgba(255,90,79,${0.55 * hiKey})` : "transparent", borderRadius: 6, boxShadow: isKey && hiKey > 0 ? `0 0 ${24 * hiKey}px rgba(255,90,79,${0.7 * hiKey})` : "none", opacity: isKey ? keyShow : 1 }}>{t}</span>;
          })}
        </div>
      ))}
    </div>
  );
};
const boxH = (n: number) => HEAD + PAD * 2 + n * LH;

const ENV_ROWS = (hi: number, tagO: number): Seg[][] => [
  [["DATABASE_URL", K.muted], ["=", K.dim], ["postgres://db.internal/shop", K.text]],
  [["VITE_", hi > 0 ? K.amber : K.line], ["API_KEY", K.line], ["=", K.dim], [KEY, K.green]],
];
const BUN_ROWS: Seg[][] = [
  [["(function(){ … })();", "#7d6a58"]],
  [["const ", K.line], ["c", K.text], ["=", K.dim], ['"', K.dim], [KEY, K.green, "key"], ['";', K.dim]],
  [["fetch", K.cold], ['("https://api.example.com/charge",', K.text]],
  [['{headers:{Authorization:"Bearer "+c}});', K.text]],
];
const KEYCOL = 10; // column where the key starts in bundle row 1
const ENV_KEYCOL = 13; // column where the key starts in env row 1

export const Cards: React.FC<{ g: number }> = ({ g }) => {
  const A = 610, envB = 560, bunB = 1000;
  // visibility windows
  const hookO = g < T.env ? 1 - io(g, [T.env - 8, T.env], [0, 1]) : 0;
  const envA = g >= T.env && g < T.build ? io(g, [T.env, T.env + 14], [0, 1]) : 0;
  const envMove = io(g, [T.build, T.build + 16], [0, 1], easeInOut);
  const envO = g < T.build ? envA : g < T.found ? 1 : 1 - io(g, [T.found, T.found + 12], [0, 1]);
  const envTop = A + (envB - A) * envMove;
  const hi = g >= T.env + 24 && g < T.found ? 1 : 0;
  // bundle box
  let bunTop = bunB, bunO = 0, keyShow = 1;
  if (g < T.env) { bunTop = A; bunO = hookO; }
  else if (g >= T.build + 14 && g < T.found) { bunTop = bunB; bunO = io(g, [T.build + 14, T.build + 28], [0, 1]); keyShow = io(g, [236, 246], [0, 1]); }
  else if (g >= T.found) { const m = io(g, [T.found, T.found + 22], [0, 1], easeInOut); bunTop = bunB + (A - bunB) * m; bunO = g < T.fix ? 1 : 1 - io(g, [T.fix - 8, T.fix], [0, 1]); }
  if (g >= T.hero - 6) bunO = 0;
  const exposed = g < T.env ? 1 : g >= 312 && g < T.fix ? io(g, [312, 322], [0, 1]) : 0;
  const pulse = 0.75 + 0.25 * Math.sin(g * 0.3);
  // travelling key token (build step)
  const tp = io(g, [214, 242], [0, 1], easeInOut);
  const tx = lx(ENV_KEYCOL) + (lx(KEYCOL) - lx(ENV_KEYCOL)) * tp, tyy = ly(envB, 1) + (ly(bunB, 1) - ly(envB, 1)) * tp;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Box top={envTop} title=".env  ·  sample project" badge="SOURCE" rows={ENV_ROWS(hi, 0)} o={envO} />
      <Box top={bunTop} title="dist/assets/index-wc5oigVz.js" badge="819 B · MINIFIED" rows={BUN_ROWS} o={bunO} hiKey={exposed * pulse} keyShow={keyShow} />
      {g >= 214 && g < 246 && <div style={{ position: "absolute", left: tx, top: tyy, height: LH, lineHeight: `${LH}px`, fontFamily: K.mono, fontSize: FS, color: K.amber, fontWeight: 700, opacity: io(g, [214, 218], [0, 1]) * (1 - io(g, [240, 246], [0, 1])), textShadow: `0 0 18px ${K.line}`, whiteSpace: "pre" }}>{KEY}</div>}
      {/* env tags */}
      <Tag f={g} at={T.env + 20} text="VITE_  =  PUBLIC PREFIX" x={620} y={ly(A, 1) + 128} color={K.line} solid size={24} out={T.build - 4} />
      <Tag f={g} at={T.env + 42} text="NO PREFIX  =  NOT BUNDLED" x={600} y={ly(A, 1) + 200} color={GREEN} size={24} out={T.build - 4} />
      {/* build chip */}
      {g >= T.build + 2 && g < T.found && <BuildChip g={g} y={envB + boxH(2) + 60} />}
      <Tag f={g} at={T.build + 58} text="KEY IS NOW IN THE BUNDLE" x={540} y={bunB + boxH(4) + 60} color={RED} solid size={28} out={T.found - 4} />
      {/* search bar */}
      <Search g={g} y={A + boxH(4) + 40} />
      <Tag f={g} at={T.found + 52} text="1 RESULT · EXPOSED" x={540} y={A + boxH(4) + 190} color={RED} solid size={30} out={T.why - 6} />
      {g < T.env && <Tag f={g} at={4} text="EXPOSED" x={540} y={A + boxH(4) + 190} color={RED} solid size={30} />}
      {/* why: three ways in */}
      {g >= T.why && g < T.fix && (
        <div style={{ position: "absolute", left: 0, right: 0, top: A + boxH(4) + 150, display: "flex", justifyContent: "center", gap: 16, opacity: 1 - io(g, [T.fix - 10, T.fix - 2], [0, 1]) }}>
          {["VIEW SOURCE", "DEVTOOLS", "CURL"].map((w, i) => {
            const p = ioB(g, T.why + 8 + i * 8, T.why + 22 + i * 8);
            return <div key={w} style={{ transform: `scale(${0.6 + 0.4 * p})`, opacity: clamp01(p), padding: "14px 26px", borderRadius: 999, border: `2px solid ${RED}`, background: "rgba(255,90,79,0.14)", color: RED, fontFamily: K.mono, fontWeight: 700, fontSize: 28, letterSpacing: 2 }}>{w}</div>;
          })}
        </div>
      )}
      <Tag f={g} at={T.why + 44} text="MINIFIED ≠ HIDDEN" x={540} y={A + boxH(4) + 290} color={K.amber} solid size={30} out={T.fix - 8} />
    </div>
  );
};

const BuildChip: React.FC<{ g: number; y: number }> = ({ g, y }) => {
  const p = ioB(g, T.build + 2, T.build + 16), press = bump(g, T.build + 8, T.build + 18);
  const o = 1 - io(g, [T.found - 10, T.found - 2], [0, 1]);
  return <div style={{ position: "absolute", left: 770, top: y, transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * p) * (1 - 0.07 * press)})`, opacity: clamp01(p) * o, padding: "16px 34px", borderRadius: 16, border: `2px solid ${K.line}`, background: g >= T.build + 10 ? K.line : K.tagBg, color: g >= T.build + 10 ? K.bgDeep : K.line, fontFamily: K.mono, fontWeight: 700, fontSize: 30, letterSpacing: 3, whiteSpace: "nowrap", boxShadow: `0 0 36px ${K.line}77` }}>▸ vite build</div>;
};

const Search: React.FC<{ g: number; y: number }> = ({ g, y }) => {
  const full = g < T.env, show = full || (g >= T.found + 14 && g < T.fix);
  if (!show) return null;
  const n = full ? 7 : Math.floor(io(g, [T.found + 20, T.found + 38], [0, 7], (t) => t));
  const o = full ? 1 - io(g, [T.env - 8, T.env], [0, 1]) : io(g, [T.found + 14, T.found + 22], [0, 1]) * (1 - io(g, [T.fix - 8, T.fix], [0, 1]));
  const found = full || g >= T.found + 42;
  return (
    <div style={{ position: "absolute", left: BX, top: y, width: BW, height: 84, borderRadius: 18, border: `2px solid ${found ? RED : K.rule}`, background: "rgba(14,9,6,0.95)", display: "flex", alignItems: "center", padding: "0 28px", opacity: o, boxShadow: found ? `0 0 30px rgba(255,90,79,0.3)` : "none" }}>
      <span style={{ fontFamily: K.mono, fontSize: 34, color: K.dim, marginRight: 18 }}>⌕</span>
      <span style={{ fontFamily: K.mono, fontSize: 36, color: K.text, letterSpacing: 1 }}>{"sk_live".slice(0, n)}<span style={{ color: K.line, opacity: n < 7 ? 1 : 0 }}>▍</span></span>
      <span style={{ marginLeft: "auto", fontFamily: K.mono, fontSize: 26, color: found ? RED : K.dim, fontWeight: 700 }}>{found ? "1 / 1" : "0 / 0"}</span>
    </div>
  );
};

/* ────────── the fix: key stays on the server ────────── */
const Node: React.FC<{ y: number; h: number; title: string; sub: string; o: number; color: string; children?: React.ReactNode }> = ({ y, h, title, sub, o, color, children }) => (
  <div style={{ position: "absolute", left: 160, width: 760, top: y, height: h, opacity: o, borderRadius: 20, border: `2px solid ${color}`, background: "linear-gradient(180deg,#120b07,#0b0705)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
    <div style={{ fontFamily: K.head, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: K.text }}>{title}</div>
    <div style={{ fontFamily: K.mono, fontSize: 24, color: K.muted, letterSpacing: 2 }}>{sub}</div>
    {children}
  </div>
);
const Pill: React.FC<{ x: number; y: number; text: string; color: string; o: number }> = ({ x, y, text, color, o }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", opacity: o, padding: "10px 24px", borderRadius: 999, border: `2px solid ${color}`, background: K.tagBg, color, fontFamily: K.mono, fontWeight: 700, fontSize: 26, whiteSpace: "nowrap", letterSpacing: 1 }}>{text}</div>
);
export const Fix: React.FC<{ g: number }> = ({ g }) => {
  if (g < T.fix - 4 || g >= T.hero) return null;
  const o = io(g, [T.fix, T.fix + 12], [0, 1]) * (1 - io(g, [T.hero - 12, T.hero - 4], [0, 1]));
  const ys = [620, 900, 1210], hs = [150, 200, 140];
  const a1 = io(g, [T.fix + 70, T.fix + 98], [0, 1], easeInOut), a2 = io(g, [T.fix + 104, T.fix + 130], [0, 1], easeInOut), back = io(g, [T.fix + 134, T.fix + 160], [0, 1], easeInOut);
  const arrow = (y1: number, y2: number, on: number) => <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}><line x1={540} y1={y1} x2={540} y2={y2} stroke={on > 0 ? K.line : K.rule} strokeWidth={4} strokeDasharray="10 8" /><path d={`M 528 ${y2 - 16} L 540 ${y2} L 552 ${y2 - 16}`} fill="none" stroke={on > 0 ? K.line : K.rule} strokeWidth={4} /></svg>;
  const keyChip = (
    <div style={{ marginTop: 10, padding: "6px 22px", borderRadius: 12, background: "rgba(245,169,60,0.14)", border: `2px solid ${K.line}`, fontFamily: K.mono, fontSize: 28, color: K.amber, fontWeight: 700 }}>.env  API_KEY=••••••••</div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <Node y={ys[0]} h={hs[0]} title="BROWSER" sub="public code · no keys" o={ioB(g, T.fix + 2, T.fix + 16)} color={K.line} />
      <Node y={ys[1]} h={hs[1]} title="YOUR SERVER" sub="private · key lives here" o={ioB(g, T.fix + 14, T.fix + 28)} color={GREEN}>{g >= T.fix + 36 && <div style={{ opacity: io(g, [T.fix + 36, T.fix + 48], [0, 1]) }}>{keyChip}</div>}</Node>
      <Node y={ys[2]} h={hs[2]} title="THIRD-PARTY API" sub="api.example.com" o={ioB(g, T.fix + 26, T.fix + 40)} color={K.lineDim} />
      {arrow(ys[0] + hs[0], ys[1], a1)}{arrow(ys[1] + hs[1], ys[2], a2)}
      <Pill x={540} y={835} text="POST /api/charge" color={K.line} o={a1 > 0 && a1 < 1 ? 1 : 0} />
      <Pill x={540} y={1155} text="Bearer ••••••••" color={K.amber} o={a2 > 0 && a2 < 1 ? 1 : 0} />
      <Pill x={790} y={back < 0.5 ? 1155 : 835} text="✓ 200 OK" color={GREEN} o={back > 0 && back < 1 ? 1 : 0} />
      <Tag f={g} at={T.fix + 120} text="KEY NEVER REACHES THE BROWSER" x={540} y={1440} color={GREEN} solid size={28} out={T.hero - 8} />
    </div>
  );
};

/* ────────── hero pipeline ────────── */
export const Hero: React.FC<{ g: number }> = ({ g }) => {
  if (g < T.hero - 4 || g >= T.lesson + 8) return null;
  const o = io(g, [T.hero - 4, T.hero + 6], [0, 1]) * (1 - io(g, [T.lesson - 6, T.lesson + 6], [0, 1]));
  const names = ["BUILD", "BUNDLE", "SHIP", "FOUND"], w = 220, gap = 24, x0 = 64;
  const idx = HEROF.filter((f) => g >= f + 2).length - 1;
  const kx = io(g, [HEROF[0], HEROF[3] + 4], [x0 + w / 2, x0 + 3 * (w + gap) + w / 2], easeInOut);
  const found = g >= HEROF[3] + 2;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={{ position: "absolute", left: x0, top: 760, display: "flex", gap }}>
        {names.map((n, i) => {
          const on = i <= idx, cur = i === idx, bad = i === 3 && on;
          const c = bad ? RED : K.line;
          return <div key={n} style={{ width: w, height: 130, borderRadius: 20, border: `2px solid ${on ? c : K.rule}`, background: cur ? c : on ? `${c}22` : "rgba(14,9,6,0.9)", color: cur ? K.bgDeep : on ? c : K.dim, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: K.mono, fontWeight: 700, fontSize: 34, letterSpacing: 3, transform: `scale(${cur ? 1 + 0.06 * bump(g, HEROF[i] + 2, HEROF[i] + 16) : 1})`, boxShadow: cur ? `0 0 36px ${c}88` : "none" }}>{n}</div>;
        })}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={960} x2={1080 - x0} y2={960} stroke={K.rule} strokeWidth={4} />
        <line x1={x0 + w / 2} y1={960} x2={kx} y2={960} stroke={found ? RED : K.line} strokeWidth={4} />
        <circle cx={kx} cy={960} r={14} fill={found ? RED : K.line} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1030, textAlign: "center" }}><Readout value={KEY} size={64} color={found ? RED : K.amber} /></div>
      <Tag f={g} at={HEROF[3] + 4} text="READABLE BY ANYONE" x={540} y={1190} color={RED} solid size={30} out={T.lesson - 6} />
    </div>
  );
};

export const Lesson: React.FC<{ g: number }> = ({ g }) => {
  if (g < T.lesson) return null;
  const o = io(g, [T.lesson, T.lesson + 10], [0, 1]) * (1 - io(g, [T.end - 8, T.end], [0, 1]));
  const row = (y: number, a: string, b: string, c: string, ok: boolean, at: number) => {
    const p = ioB(g, at, at + 12);
    return <div style={{ position: "absolute", left: 100, right: 100, top: y, height: 130, borderRadius: 20, border: `2px solid ${c}`, background: `${c}18`, display: "flex", alignItems: "center", gap: 28, padding: "0 36px", opacity: clamp01(p), transform: `translateX(${(1 - p) * -40}px)`, fontFamily: K.mono, fontWeight: 700, fontSize: 38, whiteSpace: "nowrap" }}>
      <div style={{ width: 62, height: 62, borderRadius: 14, border: `2px solid ${c}`, color: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{ok ? "✓" : "✕"}</div>
      <span style={{ color: K.text, letterSpacing: 3 }}>{a}</span><span style={{ color: c, marginLeft: "auto" }}>{b}</span></div>;
  };
  return <div style={{ position: "absolute", inset: 0, opacity: o }}>{row(760, "BROWSER", "secrets: public", RED, false, T.lesson + 4)}{row(930, "SERVER", "secrets: private", GREEN, true, T.lesson + 16)}</div>;
};

export const Heads: React.FC<{ g: number }> = ({ g }) => (
  <>
    <Headline f={g} at={-30} exitAt={T.env - 12} lines={["Your API key", "is *public*"]} top={340} size={100} />
    <Headline f={g} at={T.env} exitAt={T.build - 10} lines={["It starts in", "*.env*"]} top={340} size={96} />
    <Headline f={g} at={T.build} exitAt={T.found - 10} lines={["The build", "*copies* it"]} top={340} size={96} />
    <Headline f={g} at={T.found} exitAt={T.why - 10} lines={["Search the", "*bundle*"]} top={340} size={96} />
    <Headline f={g} at={T.why} exitAt={T.fix - 10} lines={["Minified isn't", "*hidden*"]} top={340} size={96} />
    <Headline f={g} at={T.fix} exitAt={T.hero - 14} lines={["Keep it on", "your *server*"]} top={340} size={96} />
    {["Build.", "Bundle.", "Ship.", "Found."].map((w, i) => (
      <Headline key={w} f={g} at={HEROF[i] - 2} exitAt={i < 3 ? HEROF[i + 1] - 8 : T.lesson - 8} lines={[`*${w}*`]} top={380} size={128} />
    ))}
    <Headline f={g} at={T.lesson} exitAt={T.end - 10} lines={["Browser code is", "*public* code"]} top={340} size={96} />
  </>
);

export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.line }}>HOW IT WORKS · 03</div>
      <div style={{ fontFamily: K.head, fontWeight: 800, fontSize: 112, lineHeight: 1.02, color: K.text, letterSpacing: -4, textAlign: "center" }}>Your API key</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: K.amber }}>is public</div>
    </div>
    <Cards g={60} />
  </>
);
export { easeOut, Label };
