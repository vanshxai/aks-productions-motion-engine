import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { easeInOut, easeOut, io, rgba } from "../../engine/util";
import { T } from "./brand";

/* ────────────────────────────────────────────────────────────── helpers */
export const abs = (left: number, top: number, x: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left, top, ...x });
export const hash = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
export const A = (p: string) => staticFile(`projects/devaegis/${p}`);

/* ────────────────────────────────────────────────────────────── background: the forge */
/** heat 0 = cold steel-blue night (act 1), 1 = molten amber forge (acts 2–3). */
export const ForgeBG: React.FC<{ heat?: number; floor?: boolean }> = ({ heat = 1, floor = true }) => {
  const warm = rgba(T.deep, 0.30 * heat), warm2 = rgba(T.amber, 0.12 * heat), cold = rgba("#3a5a8a", 0.22 * (1 - heat));
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 55% at 50% 118%, ${warm}, transparent 70%), radial-gradient(ellipse 55% 40% at 50% -12%, ${warm2}, transparent 70%), radial-gradient(ellipse 70% 60% at 50% 40%, ${cold}, transparent 75%)` }} />
      {floor && (
        <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: "50% 30%" }}>
          <div style={{ position: "absolute", left: "-50%", right: "-50%", top: "62%", height: "90%", transform: "rotateX(72deg)", transformOrigin: "50% 0%",
            backgroundImage: `linear-gradient(${rgba(heat > 0.5 ? T.amber : "#8fa6c4", 0.09)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(heat > 0.5 ? T.amber : "#8fa6c4", 0.09)} 1px, transparent 1px)`,
            backgroundSize: "90px 90px", maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 70%)", WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 70%)" }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Embers drifting up (deterministic). */
export const Embers: React.FC<{ f: number; n?: number; heat?: number; burst?: number; burstAt?: number }> = ({ f, n = 46, heat = 1, burst = 0, burstAt = -999 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: n }).map((_, i) => {
      const sp = 0.6 + hash(i) * 1.6, life = 150 + hash(i + 7) * 160, ph = hash(i + 3) * life;
      const t = ((f * sp + ph) % life) / life;
      const x = hash(i + 11) * 1920 + Math.sin((f + i * 40) / 38) * 26;
      const y = 1120 - t * 1250;
      const b = io(f, [burstAt, burstAt + 4, burstAt + 40], [0, 1, 0]) * burst;
      const s = 2 + hash(i + 5) * 4 + b * 4;
      const o = heat * Math.sin(Math.PI * t) * (0.35 + hash(i + 9) * 0.65) + b * 0.6;
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: T.hi, boxShadow: `0 0 ${8 + s * 3}px ${T.deep}`, opacity: Math.min(1, o) }} />;
    })}
  </AbsoluteFill>
);

/* ────────────────────────────────────────────────────────────── decrypt-scramble type (rung-3 signature) */
const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*+/<>=?@[]{}";
const parse = (s: string) => s.split(/(\*[^*]+\*)/g).filter(Boolean).map((t) => (t.startsWith("*") ? { t: t.slice(1, -1), a: true } : { t, a: false }));

/** Text resolves from random glyphs into the real copy, left → right. *word* = Instrument Serif italic accent with the amber gradient. */
export const Decrypt: React.FC<{ f: number; at: number; text: string; size: number; dur?: number; color?: string; weight?: number; align?: "left" | "center"; exitAt?: number; grad?: string; spacing?: number; mono?: boolean }> = ({
  f, at, text, size, dur = 22, color = T.ink, weight = 700, align = "center", exitAt, grad, spacing, mono,
}) => {
  const segs = parse(text);
  const total = text.replace(/\*/g, "").length;
  let idx = 0;
  const out = exitAt !== undefined ? io(f, [exitAt, exitAt + 10], [0, 1], easeInOut) : 0;
  if (f < at) return null;
  return (
    <div style={{ fontFamily: mono ? T.mono : T.sans, fontWeight: weight, fontSize: size, lineHeight: 1.08, letterSpacing: spacing ?? -size * 0.025, color, textAlign: align, whiteSpace: "pre", opacity: 1 - out, filter: out > 0 ? `blur(${out * 8}px)` : undefined }}>
      {segs.map((s, j) => (
        <span key={j} style={s.a ? { fontFamily: T.serif, fontStyle: "italic", fontWeight: 400, fontSize: size * 1.12, letterSpacing: 0, background: grad ?? T.h1b, WebkitBackgroundClip: "text", color: "transparent", paddingRight: size * 0.06 } : grad ? { background: grad, WebkitBackgroundClip: "text", color: "transparent" } : undefined}>
          {s.t.split("").map((ch, k) => {
            const i = idx++;
            const lock = at + (i / Math.max(1, total)) * dur;
            if (f >= lock + 3 || ch === " ") return <span key={k}>{ch}</span>;
            const on = f >= lock - 10;
            const g = GLYPHS[Math.floor(hash(i * 7 + Math.floor(f / 2)) * GLYPHS.length)];
            return <span key={k} style={{ color: on ? T.amber : "transparent", WebkitTextFillColor: on ? T.amber : "transparent", opacity: on ? 0.9 : 0, fontFamily: T.mono, fontStyle: "normal" }}>{g}</span>;
          })}
        </span>
      ))}
    </div>
  );
};

/** Small caps kicker with a decrypting label and an amber tick. */
export const Kicker: React.FC<{ f: number; at: number; text: string; color?: string }> = ({ f, at, text, color = T.ink3 }) => {
  const p = io(f, [at, at + 12], [0, 1]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: p }}>
      <span style={{ width: 34 * p, height: 2, background: T.amber, boxShadow: `0 0 10px ${T.deep}` }} />
      <Decrypt f={f} at={at} text={text.toUpperCase()} size={17} weight={700} color={color} spacing={4} dur={14} align="left" />
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── obsidian glass panel */
export const glass = (x: React.CSSProperties = {}): React.CSSProperties => ({
  background: "linear-gradient(160deg, rgba(34,22,14,0.86), rgba(12,7,4,0.92))", border: `1px solid ${rgba(T.amber, 0.18)}`, borderRadius: 22,
  boxShadow: `0 40px 90px rgba(0,0,0,0.65), inset 0 1px 0 ${rgba(T.hi, 0.12)}, 0 0 0 1px rgba(0,0,0,0.4)`, ...x,
});

/** A floating slab: CSS-3D tilt in, then settles; a light glint crosses it. Object moves, camera stays locked. */
export const Slab: React.FC<{ f: number; at: number; w: number; h: number; x: number; y: number; from?: "left" | "right" | "below" | "above"; tilt?: number; children: React.ReactNode; out?: number; style?: React.CSSProperties }> = ({
  f, at, w, h, x, y, from = "below", tilt = 12, children, out, style,
}) => {
  const p = io(f, [at, at + 22], [0, 1], easeOut);
  const e = out !== undefined ? io(f, [out, out + 12], [0, 1], easeInOut) : 0;
  const dx = from === "left" ? -260 : from === "right" ? 260 : 0, dy = from === "below" ? 220 : from === "above" ? -220 : 0;
  const ry = (from === "left" ? tilt : from === "right" ? -tilt : 0) * (1 - p) + (from === "left" ? 4 : from === "right" ? -4 : 0);
  const rx = (from === "below" ? tilt : from === "above" ? -tilt : 0) * (1 - p) + 5;
  const glint = io(f, [at + 14, at + 40], [-0.3, 1.3], easeInOut);
  return (
    <div style={abs(x, y, { width: w, height: h, perspective: 1400 })}>
      <div style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `translate3d(${dx * (1 - p)}px, ${dy * (1 - p) + e * 40}px, ${-200 * (1 - p)}px) rotateX(${rx}deg) rotateY(${ry}deg)`, opacity: p * (1 - e), filter: `blur(${(1 - p) * 10 + e * 8}px)` }}>
        <div style={glass({ width: "100%", height: "100%", overflow: "hidden", position: "relative", ...style })}>
          {children}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(115deg, transparent ${glint * 100 - 12}%, ${rgba(T.hi, 0.14)} ${glint * 100}%, transparent ${glint * 100 + 12}%)` }} />
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── status pill */
export const Pill: React.FC<{ label: string; tone: "live" | "amber" | "danger" | "muted"; size?: number }> = ({ label, tone, size = 22 }) => {
  const c = tone === "live" ? T.live : tone === "amber" ? T.amber : tone === "danger" ? T.danger : T.ink3;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.45, padding: `${size * 0.35}px ${size * 0.8}px`, borderRadius: 999, background: rgba(c, 0.13), border: `1px solid ${rgba(c, 0.35)}`, fontFamily: T.sans, fontWeight: 700, fontSize: size, color: c }}>
      <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: "50%", background: c, boxShadow: `0 0 ${size * 0.6}px ${c}` }} />{label}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── ✦ DevAegis wordmark (Instrument Serif italic, as on the site) */
export const Logo: React.FC<{ size: number; reveal?: number; glow?: number; star?: boolean }> = ({ size, reveal = 1, glow = 0, star = true }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: size * 0.18, clipPath: `inset(-20% ${(1 - reveal) * 100}% -20% -5%)` }}>
    {star && <span style={{ fontFamily: T.sans, color: T.amber, fontSize: size * 0.6, textShadow: `0 0 ${20 * glow}px ${T.deep}` }}>✦</span>}
    <span style={{ fontFamily: T.serif, fontStyle: "italic", color: T.ink, fontSize: size, letterSpacing: -size * 0.01, textShadow: `0 0 ${30 * glow}px ${rgba(T.deep, 0.8)}` }}>DevAegis</span>
  </div>
);

/* ────────────────────────────────────────────────────────────── callout: line + label that decrypts */
export const Callout: React.FC<{ f: number; at: number; x: number; y: number; len?: number; dir?: 1 | -1; title: string; sub?: string }> = ({ f, at, x, y, len = 150, dir = 1, title, sub }) => {
  const p = io(f, [at, at + 12], [0, 1]);
  return (
    <div style={abs(x, y, { display: "flex", alignItems: "center", gap: 18, flexDirection: dir === 1 ? "row" : "row-reverse", transform: dir === 1 ? undefined : "translateX(-100%)" })}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: T.amber, boxShadow: `0 0 16px ${T.deep}`, opacity: p }} />
      <div style={{ width: len * p, height: 2, background: `linear-gradient(90deg, ${T.amber}, ${rgba(T.amber, 0.2)})` }} />
      <div style={{ textAlign: dir === 1 ? "left" : "right" }}>
        <Decrypt f={f} at={at + 6} text={title} size={40} weight={800} align={dir === 1 ? "left" : "left"} dur={14} />
        {sub && <div style={{ marginTop: 6, opacity: io(f, [at + 16, at + 28], [0, 1]) }}><Decrypt f={f} at={at + 16} text={sub} size={22} weight={500} color={T.ink2} align="left" dur={14} spacing={0} /></div>}
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────── vault-shutter iris (rung-3 transition) */
/** 8 steel blades rotate open from the centre. p: 0 closed → 1 open. Put ABOVE the incoming scene. */
export const VaultIris: React.FC<{ p: number; cx?: number; cy?: number }> = ({ p, cx = 960, cy = 540 }) => {
  if (p >= 1) return null;
  const R = 1400, n = 8;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id="blade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a2622" /><stop offset="0.5" stopColor="#15110e" /><stop offset="1" stopColor="#060504" /></linearGradient>
        </defs>
        {Array.from({ length: n }).map((_, i) => {
          const a0 = (i / n) * Math.PI * 2 + p * 0.9;
          const open = p * 900;
          const ox = cx + Math.cos(a0 + Math.PI / 2) * open, oy = cy + Math.sin(a0 + Math.PI / 2) * open;
          const pts = [[0, 0], [R, -R * 0.12], [R, R * 0.9], [-R * 0.1, R * 0.6]].map(([x, y]) => {
            const c = Math.cos(a0), s = Math.sin(a0);
            return `${ox + x * c - y * s},${oy + x * s + y * c}`;
          }).join(" ");
          return <polygon key={i} points={pts} fill="url(#blade)" stroke={rgba(T.amber, 0.35 + 0.4 * (1 - p))} strokeWidth={2} />;
        })}
        <circle cx={cx} cy={cy} r={24 + p * 400} fill="none" stroke={rgba(T.hi, 0.6 * (1 - p))} strokeWidth={3} />
      </svg>
    </AbsoluteFill>
  );
};

/* ────────────────────────────────────────────────────────────── glitch slice (only on the "suspended" beat) */
export const GlitchSlice: React.FC<{ f: number; at: number; dur?: number; children: React.ReactNode }> = ({ f, at, dur = 12, children }) => {
  const on = f >= at && f < at + dur;
  if (!on) return <>{children}</>;
  const k = f - at;
  return (
    <AbsoluteFill>
      {Array.from({ length: 9 }).map((_, i) => {
        const y0 = (i / 9) * 100, y1 = ((i + 1) / 9) * 100;
        const dx = (hash(i * 13 + k * 7) - 0.5) * 180 * (1 - k / dur);
        return (
          <AbsoluteFill key={i} style={{ clipPath: `inset(${y0}% 0 ${100 - y1}% 0)`, transform: `translateX(${dx}px)`, filter: i % 3 === 0 ? "hue-rotate(-30deg) saturate(1.6)" : undefined }}>
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

export const Dashboard: React.FC<{ w: number; h: number }> = ({ w, h }) => <Img src={A("dashboard-dark.png")} style={{ width: w, height: h, objectFit: "cover" }} />;
