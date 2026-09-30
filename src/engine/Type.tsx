import React from "react";
import { C, DISPLAY, FONT, blurF, easeInOut, easeOut, io } from "./util";

/** Parse "Your website looks *great.*" → segments; *…* = accent (italic display + accent colour). */
const parse = (s: string) => s.split(/(\*[^*]+\*)/g).filter(Boolean).map((t) => (t.startsWith("*") ? { t: t.slice(1, -1), a: true } : { t, a: false }));

/**
 * Editorial mask-up lines: each line slides up from behind its own mask (no blur). Level-2 signature text motion.
 * lines: ["Your website looks *great.*", "It just doesn't *sell.*"]
 */
export const MaskLines: React.FC<{
  f: number; lines: string[]; start: number; stagger?: number; size?: number; color?: string; accent?: string;
  align?: "center" | "left" | "right"; display?: boolean; weight?: number; lineGap?: number; exitAt?: number;
}> = ({ f, lines, start, stagger = 6, size = 96, color = C.ink, accent = C.violet, align = "center", display = true, weight, lineGap = 0.08, exitAt }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : align === "left" ? "flex-start" : "flex-end" }}>
    {lines.map((line, i) => {
      const p = io(f, [start + i * stagger, start + i * stagger + 18], [0, 1], easeOut);
      const out = exitAt !== undefined ? io(f, [exitAt + i * 3, exitAt + i * 3 + 12], [0, 1], easeInOut) : 0;
      return (
        <div key={i} style={{ overflow: "hidden", paddingBottom: size * 0.12, marginBottom: -size * 0.12 + size * lineGap }}>
          <div style={{ transform: `translateY(${(1 - p) * 105 - out * 105}%)`, whiteSpace: "nowrap", fontFamily: display ? DISPLAY : FONT, fontWeight: weight ?? (display ? C.displayWeight : 500), fontSize: size, lineHeight: 1.08, letterSpacing: display ? -size * 0.012 : -size * 0.03, color }}>
            {parse(line).map((s, j) => (
              <span key={j} style={s.a ? { color: accent, fontStyle: C.displayItalicAccent ? "italic" : undefined } : undefined}>{s.t}</span>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

/** Rolling-digit odometer. value like "7.4", "1.5", "58", "45". Digits roll in with a per-column stagger. */
export const Odometer: React.FC<{ f: number; start: number; dur?: number; value: string; prefix?: string; suffix?: string; size?: number; color?: string; weight?: number; font?: string }> = ({
  f, start, dur = 36, value, prefix = "", suffix = "", size = 120, color = C.ink, weight = 600, font,
}) => {
  const chars = value.split("");
  const digits = chars.filter((c) => /\d/.test(c)).length;
  let di = 0;
  const h = size * 1.05;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", fontFamily: font ?? FONT, fontWeight: weight, fontSize: size, color, lineHeight: `${h}px`, letterSpacing: -size * 0.03, fontVariantNumeric: "tabular-nums" }}>
      {prefix && <span>{prefix}</span>}
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} style={ch === "." || ch === "," ? { margin: `0 ${-size * 0.06}px` } : undefined}>{ch}</span>;
        const d = +ch;
        const col = di++;
        const lag = (digits - 1 - col) * 4;
        const p = io(f, [start + lag * 0.5, start + dur - lag], [0, 1], easeOut);
        const rolls = 10 + d + col * 0;
        const y = -p * rolls * h;
        return (
          <span key={i} style={{ display: "inline-block", height: h, overflow: "hidden", verticalAlign: "bottom" }}>
            <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${y}px)` }}>
              {Array.from({ length: 21 }).map((_, k) => (
                <span key={k} style={{ height: h }}>{k % 10}</span>
              ))}
            </span>
          </span>
        );
      })}
      {suffix && <span>{suffix}</span>}
    </div>
  );
};

/** Vertical roll between words at given frames: words[i] shows from at[i]. */
export const WordSwap: React.FC<{ f: number; words: string[]; at: number[]; size?: number; color?: string; italic?: boolean; display?: boolean }> = ({ f, words, at, size = 96, color = C.violet, italic = true, display = true }) => {
  const h = size * 1.15;
  let idx = 0;
  at.forEach((a, i) => { if (f >= a) idx = i; });
  const p = io(f, [at[idx], at[idx] + 12], [0, 1], easeOut);
  return (
    <span style={{ display: "inline-block", height: h, overflow: "hidden", verticalAlign: "bottom", fontFamily: display ? DISPLAY : FONT, fontSize: size, lineHeight: `${h}px`, color, fontStyle: italic ? "italic" : undefined }}>
      <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-(idx - 1 + p) * h}px)` }}>
        {[idx > 0 ? words[idx - 1] : "", words[idx]].map((w, k) => <span key={k} style={{ height: h, whiteSpace: "nowrap" }}>{w}</span>)}
      </span>
    </span>
  );
};

/** Hand-drawn-feel underline that draws left→right. */
export const Underline: React.FC<{ p: number; width: number; color?: string; thickness?: number }> = ({ p, width, color = C.violet, thickness = 5 }) => (
  <svg width={width} height={thickness * 4} style={{ display: "block", overflow: "visible" }}>
    <path d={`M2 ${thickness * 2} Q ${width * 0.5} ${thickness * 0.6}, ${width - 2} ${thickness * 2.2}`} pathLength={1} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - p} />
  </svg>
);

/** Small uppercase label with a leading rule, editorial style. */
export const Kicker: React.FC<{ f: number; at: number; text: string; color?: string; size?: number; rule?: string }> = ({ f, at, text, color = C.muted, size = 18, rule = C.violet }) => {
  const p = io(f, [at, at + 16], [0, 1]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: p, filter: blurF((1 - p) * 4) }}>
      <div style={{ width: 44 * p, height: 2, background: rule }} />
      <span style={{ fontFamily: FONT, fontSize: size, letterSpacing: size * 0.22, fontWeight: 600, color, textTransform: "uppercase" }}>{text}</span>
    </div>
  );
};
