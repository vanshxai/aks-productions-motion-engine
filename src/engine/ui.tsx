import React from "react";
import { Img, staticFile } from "remotion";
import { C, FONT, blurF, easeInOut, io, rgba } from "./util";

/** Asset helper for a project: const A = assets("projects/acme"); A("logo.png") */
export const assets = (root: string) => (p: string) => staticFile(`${root}/${p}`);

/** CSS filter that turns a white/any logo into near-black ink (for light scenes). */
export const INK_FILTER = "brightness(0) saturate(100%) invert(8%) sepia(16%) saturate(1800%) hue-rotate(190deg)";

/** Logo image with optional left→right wipe reveal and ink tint. */
export const LogoImg: React.FC<{ src: string; h: number; aspect: number; dark?: boolean; reveal?: number }> = ({ src, h, aspect, dark, reveal = 1 }) => (
  <Img src={src} style={{ height: h, width: h * aspect, filter: dark ? INK_FILTER : undefined, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }} />
);

/** Crop a region (sx,sy,sw in source px) of a source image of width srcW into a w×h box. */
export const Crop: React.FC<{ src: string; srcW: number; sx: number; sy: number; sw: number; w: number; h: number; style?: React.CSSProperties }> = ({ src, srcW, sx, sy, sw, w, h, style }) => {
  const k = w / sw;
  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundImage: `url(${src})`,
        backgroundSize: `${srcW * k}px auto`,
        backgroundPosition: `${-sx * k}px ${-sy * k}px`,
        backgroundRepeat: "no-repeat",
        ...style,
      }}
    />
  );
};

export const fmt = (n: number, decimals = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Eased count from 0 → to between local frames [s, s+d]. */
export const count = (l: number, s: number, d: number, to: number, decimals = 0) =>
  fmt(io(l, [s, s + d], [0, to], easeInOut), decimals);

/** Blur-to-sharp entrance for any block. */
export const Reveal: React.FC<{ l: number; at: number; dur?: number; y?: number; x?: number; scale?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ l, at, dur = 14, y = 24, x = 0, scale = 0.96, style, children }) => {
  const p = io(l, [at, at + dur], [0, 1]);
  return (
    <div
      style={{
        opacity: p,
        filter: blurF((1 - p) * 12),
        transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px) scale(${scale + (1 - scale) * p})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const CheckDot: React.FC<{ p: number; size?: number; color?: string }> = ({ p, size = 26, color = C.green }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" style={{ flexShrink: 0 }}>
    <circle cx={13} cy={13} r={12} fill={p > 0 ? color : "none"} fillOpacity={0.15 + 0.85 * Math.min(1, p * 2)} stroke={p > 0 ? color : "#C9C5D6"} strokeWidth={1.6} />
    <path d="M7.5 13.5 L11.3 17 L18.5 9.5" pathLength={1} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - io(p, [0.3, 1], [0, 1])} />
  </svg>
);

export const Spinner: React.FC<{ l: number; size?: number; color?: string }> = ({ l, size = 22, color = C.violet }) => (
  <div style={{ width: size, height: size, borderRadius: size, border: `2.5px solid ${color}33`, borderTopColor: color, transform: `rotate(${l * 24}deg)`, boxSizing: "border-box", flexShrink: 0 }} />
);

/** Line icons for pipeline / badges. */
export const Icon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 40, color = "#fff" }) => {
  const p: Record<string, React.ReactNode> = {
    inbox: <path d="M4 13h5l2 3h2l2-3h5M5 5h14l1 8v6H4v-6z" />,
    doc: <path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 15.5h6M9.5 9h2.5" />,
    spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />,
    tag: <path d="M3 12V4h8l10 10-8 8zM7.5 8.5h.01" />,
    pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
    shield: <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z" />,
    lock: <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3" />,
    moon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
    server: <path d="M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
};

export const glassCard = (): React.CSSProperties => ({
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${rgba(C.lilac, 0.28)}`,
  borderRadius: 22,
  boxShadow: "0 30px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
});
export const whiteCard = (): React.CSSProperties => ({
  background: "#FFFFFF",
  borderRadius: 22,
  boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12)",
  fontFamily: FONT,
  color: C.ink,
});
export const lightCard = (): React.CSSProperties => ({
  background: "#FFFFFF",
  borderRadius: 22,
  border: "1px solid #E2E1E5",
  boxShadow: `0 24px 60px ${rgba(C.violet, 0.1)}`,
  fontFamily: FONT,
  color: C.ink,
});
