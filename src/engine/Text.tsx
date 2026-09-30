import React from "react";
import { interpolateColors } from "remotion";
import { C, DISPLAY, FONT, blurF, io, rgba } from "./util";

/** Typewriter line: fresh characters arrive lilac and cool to white. */
export const Typewriter: React.FC<{
  f: number;
  text: string;
  start: number;
  fpc: number;
  accentFrom?: number;
  size?: number;
  cursor?: boolean;
  display?: boolean;
}> = ({ f, text, start, fpc, accentFrom = 9999, size = 112, cursor = true, display = false }) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((f - start) / fpc) + 1));
  const typing = f >= start && n < text.length;
  const blinkOn = typing || f < start || Math.floor(f / 9) % 2 === 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: display ? DISPLAY : FONT,
        fontWeight: display ? C.displayWeight : 300,
        fontSize: size,
        letterSpacing: display ? -1 : -2.5,
        whiteSpace: "pre",
        lineHeight: 1.1,
      }}
    >
      {text
        .slice(0, n)
        .split("")
        .map((ch, i) => {
          const age = f - (start + i * fpc);
          const accent = i >= accentFrom;
          const color = accent
            ? interpolateColors(Math.min(1, age / 10), [0, 1], [C.violet2, C.lilac])
            : interpolateColors(Math.min(1, age / 12), [0, 1], [C.lilac2, "#FFFFFF"]);
          return (
            <span key={i} style={{ color, opacity: Math.min(1, 0.4 + age / 4), fontStyle: display && accent && C.displayItalicAccent ? "italic" : undefined }}>
              {ch}
            </span>
          );
        })}
      {cursor && (
        <span
          style={{
            display: "inline-block",
            width: 4,
            height: size * 0.92,
            marginLeft: 6,
            background: C.textOnDark,
            opacity: blinkOn ? 1 : 0,
            borderRadius: 2,
          }}
        />
      )}
    </div>
  );
};

export type Word = { t: string; accent?: boolean };

/** Word-by-word blur cascade (reference: "Send one or multiple invoices"). */
export const Cascade: React.FC<{
  f: number;
  words: Word[];
  start: number;
  stagger?: number;
  size?: number;
  weight?: number;
  color?: string;
  accentColor?: string;
  justify?: "center" | "flex-start" | "flex-end";
  /** Use the brand display font (e.g. a serif) instead of the UI font. Accent words go italic if the brand says so. */
  display?: boolean;
}> = ({
  f,
  words,
  start,
  stagger = 4,
  size = 80,
  weight,
  color = "#FFFFFF",
  accentColor,
  justify = "center",
  display = false,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: justify,
      gap: `0 ${size * 0.26}px`,
      fontFamily: display ? DISPLAY : FONT,
      fontWeight: weight ?? (display ? C.displayWeight : 300),
      fontSize: size,
      letterSpacing: display ? -size * 0.012 : -size * 0.025,
      lineHeight: 1.15,
      whiteSpace: "nowrap",
    }}
  >
    {words.map((w, i) => {
      const p = io(f, [start + i * stagger, start + i * stagger + 14], [0, 1]);
      const accentStyle: React.CSSProperties = w.accent
        ? accentColor
          ? { color: accentColor }
          : {
              backgroundImage: `linear-gradient(90deg, ${C.lilac} 0%, ${C.violet2} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }
        : { color };
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: p,
            filter: blurF((1 - p) * 12),
            transform: `translateY(${(1 - p) * 14}px)`,
            fontStyle: display && w.accent && C.displayItalicAccent ? "italic" : undefined,
            ...accentStyle,
          }}
        >
          {w.t}
        </span>
      );
    })}
  </div>
);

/** Pill that wipes open from its icon (reference: "AI-powered payment assistant"). */
export const GlowPill: React.FC<{
  f: number;
  start: number;
  text: string;
  icon?: string;
  variant?: "glass" | "black" | "light";
  size?: number;
  maxW?: number;
  align?: "center" | "flex-start";
}> = ({ f, start, text, icon = "✦", variant = "glass", size = 28, maxW = 720, align = "center" }) => {
  const l = f - start;
  const appear = io(l, [0, 8], [0, 1]);
  const wipe = io(l, [6, 30], [0, 1]);
  const txt = io(l, [12, 26], [0, 1]);
  const h = size * 2.1;
  const glass = variant === "glass";
  const light = variant === "light";
  return (
    <div style={{ display: "flex", justifyContent: align, opacity: appear }}>
      <div
        style={{
          height: h,
          maxWidth: h + wipe * (maxW - h),
          overflow: "hidden",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          gap: size * 0.45,
          padding: `0 ${size * 0.95}px`,
          whiteSpace: "nowrap",
          transform: `scale(${0.8 + appear * 0.2})`,
          transformOrigin: align === "center" ? "center" : "left center",
          background: light ? rgba(C.violet, 0.08) : glass ? "rgba(255,255,255,0.06)" : "#0B0911",
          border: light ? `1.5px solid ${rgba(C.violet, 0.35)}` : glass ? `1.5px solid ${rgba(C.lilac, 0.55)}` : "none",
          boxShadow: light
            ? "none"
            : glass
            ? `0 0 ${30 * wipe}px ${rgba(C.violet2, 0.55)}, inset 0 0 18px ${rgba(C.lilac, 0.18)}`
            : "0 10px 30px rgba(16,24,40,0.18)",
          fontFamily: FONT,
          fontSize: size,
          fontWeight: light ? 500 : 400,
          color: light ? C.violet : C.textOnDark,
        }}
      >
        {icon && <span style={{ color: light ? C.violet : C.lilac, flexShrink: 0 }}>{icon}</span>}
        <span style={{ opacity: txt, filter: blurF((1 - txt) * 6), flexShrink: 0 }}>{text}</span>
      </div>
    </div>
  );
};
