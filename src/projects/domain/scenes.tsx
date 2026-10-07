import React from "react";
import { easeInOut, io } from "../../engine/util";
import { K } from "../minify/brand";
import { Headline, Readout, Tag, clamp01, ioB } from "../minify/kit";

/** Global frames from public/projects/domain/vo.json. Keep in sync with soundtrack.py. */
export const T = { read: 78, check: 173, match: 224, block: 280, weak: 351, strong: 415, copy: 529, hero: 616, lesson: 716, end: 764, total: 900 };
export const CUTS = [0, 78, 173, 224, 280, 351, 415, 529, 616, 716, 764];
export const HEROF = [616, 640, 663, 688];
const GREEN = K.green, RED = K.red;
const OK = "client-approved.com", BAD1 = "resale-attempt.io", BAD2 = "different-server.net";
const FS = 30, CW = FS * 0.6, LH = FS * 1.62, BX = 60, BW = 960, HEAD = 64, PAD = 36;
const bump = (g: number, a: number, b: number) => (g > a && g < b ? Math.sin((Math.PI * (g - a)) / (b - a)) : 0);
const hexc = (seed: number) => "0123456789abcdef"[Math.abs(Math.floor(Math.sin(seed * 78.233) * 43758.5453)) % 16];

/* ────────── state machine ────────── */
const URLS: [number, string][] = [[80, OK], [284, BAD1], [480, OK], [535, BAD2], [T.hero, OK]];
const urlAt = (g: number) => {
  let cur: [number, string] | null = null;
  for (const u of URLS) if (g >= u[0]) cur = u;
  if (!cur) return "";
  const n = Math.floor(io(g, [cur[0], cur[0] + 14], [0, cur[1].length], (t) => t));
  return cur[1].slice(0, n);
};
type Body = "idle" | "loading" | "check" | "run" | "block" | "free";
const bodyAt = (g: number): Body => {
  if (g < 80) return "idle";
  if (g < 110) return "loading";
  if (g < T.match) return "check";
  if (g < 284) return "run";
  if (g < 385) return "block";
  if (g < T.strong) return "free";
  if (g < 495) return "block";
  if (g < 535) return "run";
  if (g < T.hero) return "block";
  if (g < HEROF[0] + 24) return "loading";
  if (g < HEROF[3]) return "check";
  return "run";
};
const PLAIN = ['const allowed = ["' + OK + '"];', "const host = location.hostname;", "if (allowed.includes(host)) run();", "else block();"];
const REAL = ["function checkout(cart) {", "  return total(cart);", "}", "checkout(cart);"];
const lineHi = (g: number): (string | null)[] => {
  const h: (string | null)[] = [null, null, null, null];
  if (g >= 116 && g < 173) h[1] = K.line;
  if (g >= T.check && g < T.match) { h[0] = K.line; h[2] = K.line; }
  if (g >= T.match && g < 284) h[2] = GREEN;
  if (g >= 300 && g < T.weak) h[3] = RED;
  if (g >= HEROF[0] && g < HEROF[1]) h[1] = K.line;
  if (g >= HEROF[1] && g < HEROF[2]) { h[0] = K.line; h[2] = K.line; }
  if (g >= HEROF[2] && g < HEROF[3]) h[2] = GREEN;
  return h;
};

/* ────────── browser mock ────────── */
export const Browser: React.FC<{ g: number }> = ({ g }) => {
  const o = io(g, [66, 82], [0, 1]) * (1 - io(g, [T.lesson - 8, T.lesson], [0, 1]));
  if (o <= 0.01) return null;
  const b = bodyAt(g), url = urlAt(g);
  const spec: Record<Body, [string, string, string]> = {
    idle: ["", K.dim, K.rule], loading: ["LOADING…", K.muted, K.rule], check: ["CHECKING DOMAIN…", K.amber, K.lineDim],
    run: ["APP RUNNING ✓", GREEN, GREEN], block: ["NOT LICENSED ✕", RED, RED], free: ["RUNS ANYWHERE ✕", RED, RED],
  };
  const [txt, col, bc] = spec[b];
  const shake = b === "block" ? bump(g % 200, 0, 6) * 0 : 0;
  return (
    <div style={{ position: "absolute", left: BX, top: 600, width: BW, height: 320, opacity: o, borderRadius: 22, border: `2px solid ${bc}`, background: "linear-gradient(180deg,#120b07,#0b0705)", boxShadow: b === "run" ? `0 0 50px rgba(127,214,155,0.25)` : b === "block" || b === "free" ? `0 0 50px rgba(255,90,79,0.22)` : "none", transform: `translateX(${shake}px)` }}>
      <div style={{ height: 84, borderBottom: `2px solid ${K.rule}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        {["#ff5a4f", "#f5a93c", "#7fd69b"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.85 }} />)}
        <div style={{ marginLeft: 16, flex: 1, height: 52, borderRadius: 26, background: "rgba(3,2,1,0.7)", border: `2px solid ${K.rule}`, display: "flex", alignItems: "center", padding: "0 22px", fontFamily: K.mono, fontSize: 30, color: K.text, whiteSpace: "nowrap" }}>
          <span style={{ color: K.dim, marginRight: 10 }}>⌂</span>{url}<span style={{ color: K.line, opacity: url.length < 4 || (g % 20) < 10 ? 1 : 0 }}>▍</span>
        </div>
      </div>
      <div style={{ height: 232, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ fontFamily: K.mono, fontWeight: 700, fontSize: 52, letterSpacing: 3, color: col }}>{txt}</div>
        {b === "loading" && <div style={{ width: 420, height: 10, borderRadius: 5, background: K.rule }}><div style={{ width: `${clamp01(((g - 80) % 36) / 30) * 100}%`, height: 10, borderRadius: 5, background: K.line }} /></div>}
      </div>
    </div>
  );
};

/* ────────── code card (plain / deleted / encrypted / decrypting) ────────── */
export const Code: React.FC<{ g: number }> = ({ g }) => {
  const o = io(g, [70, 86], [0, 1]) * (1 - io(g, [T.lesson - 8, T.lesson], [0, 1]));
  if (o <= 0.01) return null;
  const hi = lineHi(g);
  // 0 = plain, 1 = enc noise, 2 = decrypted real code
  const encP = g >= T.strong && g < T.hero - 6 ? 1 : 0;
  const dec = g >= 495 && g < 550 ? io(g, [495, 520], [0, 1]) * (1 - io(g, [535, 550], [0, 1])) : 0; // 1 = fully decrypted
  const mode = encP ? "enc" : "plain";
  const title = mode === "enc" ? (dec > 0.5 ? "app.js · decrypted here" : "app.js · encrypted") : "domain-check.js";
  const strike = g >= 360 && g < T.strong ? io(g, [360, 372], [0, 1]) : 0;
  const gone = g >= 380 && g < T.strong ? io(g, [380, 396], [0, 1]) : 0;
  const rows = [0, 1, 2, 3].map((i) => {
    if (mode === "enc") {
      const real = REAL[i];
      let s = "";
      for (let c = 0; c < 44; c++) {
        const ch = real[c] ?? " ";
        const reveal = dec * 44 > c;
        s += reveal ? ch : (c % 5 === 4 ? " " : hexc(i * 99 + c + (dec > 0 && dec < 1 ? Math.floor(g / 2) : 0)));
      }
      return <span style={{ color: dec > 0.5 ? K.green : K.dim }}>{s}</span>;
    }
    const isDel = (i === 2 || i === 3) && strike > 0;
    return <span style={{ color: isDel ? RED : i === 3 ? K.muted : K.text, textDecoration: isDel ? "line-through" : "none", textDecorationThickness: 3, opacity: isDel ? 1 - 0.65 * gone : 1 }}>{PLAIN[i]}</span>;
  });
  return (
    <div style={{ position: "absolute", left: BX, top: 960, width: BW, height: HEAD + PAD * 2 + 4 * LH, opacity: o, borderRadius: 22, background: "linear-gradient(180deg,#120b07,#0b0705)", border: `2px solid ${mode === "enc" ? K.line : K.rule}`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
      <div style={{ height: HEAD, borderBottom: `2px solid ${K.rule}`, display: "flex", alignItems: "center", padding: "0 26px", gap: 12 }}>
        {["#ff5a4f", "#f5a93c", "#7fd69b"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.85 }} />)}
        <div style={{ marginLeft: 18, fontFamily: K.mono, fontSize: 24, color: K.muted }}>{title}</div>
        <div style={{ marginLeft: "auto", fontFamily: K.mono, fontSize: 22, letterSpacing: 3, color: mode === "enc" ? K.line : K.dim }}>{mode === "enc" ? "🔒 AES-256" : "PLAIN JS"}</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 24, right: 24, top: HEAD + PAD + i * LH, height: LH, lineHeight: `${LH}px`, padding: "0 24px", borderRadius: 8, background: hi[i] ? `${hi[i]}26` : "transparent", fontFamily: K.mono, fontSize: FS, whiteSpace: "pre", fontVariantLigatures: "none", boxShadow: hi[i] ? `inset 4px 0 0 ${hi[i]}` : "none" }}>{r}</div>
      ))}
    </div>
  );
};

/* ────────── lower tags / readouts ────────── */
export const Lower: React.FC<{ g: number }> = ({ g }) => {
  const y = 1345;
  const ro = (text: string, c: string, a: number, b: number) => g >= a && g < b ? (
    <div style={{ position: "absolute", left: 0, right: 0, top: y + 5, textAlign: "center", opacity: io(g, [a, a + 8], [0, 1]) * (1 - io(g, [b - 8, b], [0, 1])) }}><Readout value={text} size={36} color={c} /></div>) : null;
  const chips = ["LOAD", "CHECK", "MATCH", "RUN"];
  const idx = HEROF.filter((f) => g >= f + 2).length - 1;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {ro(`host = "${OK}"`, K.amber, 120, 173)}
      {ro(`allowed = ["${OK}"]`, K.amber, 178, T.match)}
      <Tag f={g} at={T.match + 4} text="MATCH  →  RUN" x={540} y={y + 30} color={GREEN} solid size={34} out={282} />
      <Tag f={g} at={T.block + 24} text="NO MATCH  →  BLOCK" x={540} y={y + 30} color={RED} solid size={34} out={349} />
      <Tag f={g} at={T.weak + 36} text="CHECK DELETED  →  RUNS ANYWHERE" x={540} y={y + 30} color={RED} solid size={30} out={T.strong - 4} />
      <Tag f={g} at={T.strong + 6} text="STILL ENCRYPTED  →  BLOCKED" x={540} y={y + 30} color={K.line} solid size={30} out={478} />
      <Tag f={g} at={500} text="DOMAIN OK  →  DECRYPT" x={540} y={y + 30} color={GREEN} solid size={32} out={T.copy - 4} />
      <Tag f={g} at={T.copy + 30} text="COPIED  →  STAYS LOCKED" x={540} y={y + 30} color={RED} solid size={32} out={T.hero - 8} />
      {g >= T.hero - 4 && g < T.lesson + 4 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", gap: 14, opacity: io(g, [T.hero - 4, T.hero + 6], [0, 1]) * (1 - io(g, [T.lesson - 6, T.lesson + 4], [0, 1])) }}>
          {chips.map((w, i) => {
            const on = i <= idx, cur = i === idx, c = i === 3 ? GREEN : K.line;
            return <div key={w} style={{ padding: "16px 26px", borderRadius: 999, border: `2px solid ${on ? c : K.rule}`, background: cur ? c : on ? `${c}22` : "transparent", color: cur ? K.bgDeep : on ? c : K.dim, fontFamily: K.mono, fontWeight: 700, fontSize: 30, letterSpacing: 2, transform: `scale(${cur ? 1 + 0.07 * bump(g, HEROF[i] + 2, HEROF[i] + 16) : 1})` }}>{w}</div>;
          })}
        </div>
      )}
    </div>
  );
};

/* ────────── the three-domain table (hook + recap) ────────── */
export const Table: React.FC<{ g: number }> = ({ g }) => {
  const hook = g < T.read ? 1 - io(g, [66, 78], [0, 1]) : 0;
  const rec = g >= T.lesson ? io(g, [T.lesson, T.lesson + 12], [0, 1]) * (1 - io(g, [T.end - 8, T.end], [0, 1])) : 0;
  const o = Math.max(hook, rec);
  if (o <= 0.01) return null;
  const rows: [string, boolean][] = [[OK, true], [BAD1, false], [BAD2, false]];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      {rows.map(([d, ok], i) => {
        const p = g < T.read ? 1 : ioB(g, T.lesson + 2 + i * 8, T.lesson + 16 + i * 8);
        const c = ok ? GREEN : RED;
        return (
          <div key={d} style={{ position: "absolute", left: 80, right: 80, top: 640 + i * 170, height: 140, borderRadius: 22, border: `2px solid ${c}`, background: `${c}14`, display: "flex", alignItems: "center", padding: "0 40px", opacity: clamp01(p), transform: `translateX(${(1 - clamp01(p)) * -40}px)`, boxShadow: `0 0 36px ${c}22` }}>
            <span style={{ fontFamily: K.mono, fontWeight: 700, fontSize: 40, color: K.text }}>{d}</span>
            <span style={{ marginLeft: "auto", padding: "10px 28px", borderRadius: 999, background: c, color: K.bgDeep, fontFamily: K.mono, fontWeight: 700, fontSize: 32, letterSpacing: 3 }}>{ok ? "RUN ✓" : "BLOCK ✕"}</span>
          </div>
        );
      })}
      <Tag f={g} at={g < T.read ? 6 : T.lesson + 30} text="ALLOWED DOMAIN  =  1" x={540} y={1190} color={K.amber} size={28} />
    </div>
  );
};

export const Heads: React.FC<{ g: number }> = ({ g }) => (
  <>
    <Headline f={g} at={-30} exitAt={T.read - 12} lines={["Where may your", "code *run?*"]} top={340} size={100} />
    <Headline f={g} at={T.read} exitAt={T.check - 10} lines={["It reads its", "*own* domain"]} top={340} size={96} />
    <Headline f={g} at={T.check} exitAt={T.match - 10} lines={["Then checks an", "*allow list*"]} top={340} size={96} />
    <Headline f={g} at={T.match} exitAt={T.block - 10} lines={["*Match.*", "It runs"]} top={340} size={104} />
    <Headline f={g} at={T.block} exitAt={T.weak - 10} lines={["*No match.*", "Blocked"]} top={340} size={104} />
    <Headline f={g} at={T.weak} exitAt={T.strong - 10} lines={["A plain check", "can be *deleted*"]} top={340} size={96} />
    <Headline f={g} at={T.strong} exitAt={T.copy - 10} lines={["Stay *encrypted*", "until it matches"]} top={340} size={92} />
    <Headline f={g} at={T.copy} exitAt={T.hero - 12} lines={["Copied elsewhere,", "*won't run*"]} top={340} size={92} />
    {["Load.", "Check.", "Match.", "Run."].map((w, i) => (
      <Headline key={w} f={g} at={HEROF[i] - 2} exitAt={i < 3 ? HEROF[i + 1] - 8 : T.lesson - 8} lines={[`*${w}*`]} top={380} size={128} />
    ))}
    <Headline f={g} at={T.lesson} exitAt={T.end - 10} lines={["Code that knows", "its *home*"]} top={340} size={96} />
  </>
);

export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.line }}>HOW IT WORKS · 04</div>
      <div style={{ fontFamily: K.head, fontWeight: 800, fontSize: 112, lineHeight: 1.02, color: K.text, letterSpacing: -4, textAlign: "center" }}>Where may your</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: K.amber }}>code run?</div>
    </div>
    <Table g={0} />
  </>
);
export { easeInOut };
