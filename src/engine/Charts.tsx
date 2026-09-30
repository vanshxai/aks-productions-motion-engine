import React from "react";
import { C, FONT, easeInOut, easeOut, io, rgba } from "./util";

/** Line chart that draws itself; optional gradient area + head dot. points: y values 0..1 (x evenly spaced). */
export const LineDraw: React.FC<{ p: number; points: number[]; w: number; h: number; color?: string; stroke?: number; area?: boolean; id: string }> = ({ p, points, w, h, color = C.violet, stroke = 5, area = true, id }) => {
  const xy = points.map((v, i) => [(i / (points.length - 1)) * w, h - v * h]);
  const d = xy.map(([x, y], i) => (i ? `L${x},${y}` : `M${x},${y}`)).join(" ");
  const n = (points.length - 1) * p;
  const i0 = Math.floor(n), fr = n - i0;
  const head = i0 >= points.length - 1 ? xy[xy.length - 1] : [xy[i0][0] + (xy[i0 + 1][0] - xy[i0][0]) * fr, xy[i0][1] + (xy[i0 + 1][1] - xy[i0][1]) * fr];
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`ag-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity={0.28} /><stop offset="1" stopColor={color} stopOpacity={0} /></linearGradient>
        <clipPath id={`cp-${id}`}><rect x={0} y={-20} width={head[0]} height={h + 40} /></clipPath>
      </defs>
      {area && <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#ag-${id})`} clipPath={`url(#cp-${id})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#cp-${id})`} />
      {p > 0.01 && <circle cx={head[0]} cy={head[1]} r={stroke * 1.8} fill="#fff" stroke={color} strokeWidth={stroke * 0.8} />}
    </svg>
  );
};

/** Day-by-day calendar grid that fills in (e.g. a 45-day guarantee window). */
export const CalendarGrid: React.FC<{ l: number; start: number; days?: number; cols?: number; cell?: number; gap?: number; perDay?: number; fill?: string; empty?: string; text?: string; highlightLast?: string }> = ({
  l, start, days = 45, cols = 9, cell = 64, gap = 10, perDay = 1.2, fill = C.violet, empty = "rgba(0,0,0,0.06)", text = C.ink, highlightLast,
}) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap }}>
    {Array.from({ length: days }).map((_, i) => {
      const p = io(l, [start + i * perDay, start + i * perDay + 6], [0, 1], easeOut);
      const last = i === days - 1 && highlightLast;
      return (
        <div key={i} style={{ width: cell, height: cell, borderRadius: 12, background: p > 0 ? (last ? highlightLast : fill) : empty, opacity: p > 0 ? 0.25 + 0.75 * p : 1, transform: `scale(${0.85 + 0.15 * p})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: cell * 0.3, fontWeight: 600, color: p > 0.5 ? "#fff" : text }}>
          {i + 1}
        </div>
      );
    })}
  </div>
);

/** Voice waveform bars (live-call feel), deterministic per frame. */
export const Waveform: React.FC<{ l: number; bars?: number; w: number; h: number; color?: string; active?: number }> = ({ l, bars = 42, w, h, color = C.violet, active = 1 }) => {
  const bw = w / bars;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: bw * 0.35, width: w, height: h }}>
      {Array.from({ length: bars }).map((_, i) => {
        const env = Math.sin((i / bars) * Math.PI);
        const v = 0.15 + 0.85 * Math.abs(Math.sin(l * 0.35 + i * 0.9) * Math.sin(l * 0.13 + i * 0.37)) * env;
        return <div key={i} style={{ width: bw * 0.65, height: Math.max(4, v * h * active), borderRadius: bw, background: color }} />;
      })}
    </div>
  );
};

/** Horizontal text lane that scrolls (dir -1 = left). */
export const Marquee: React.FC<{ l: number; items: string[]; speed?: number; dir?: 1 | -1; size?: number; color?: string; font?: string; italic?: boolean; sep?: string; offset?: number }> = ({
  l, items, speed = 3, dir = -1, size = 72, color = C.ink, font = FONT, italic, sep = "✦", offset = 0,
}) => (
  <div style={{ display: "flex", whiteSpace: "nowrap", transform: `translateX(${offset + dir * l * speed}px)`, fontFamily: font, fontSize: size, color, fontStyle: italic ? "italic" : undefined, gap: size * 0.5, alignItems: "center" }}>
    {[...items, ...items, ...items, ...items].map((t, i) => (
      <React.Fragment key={i}>
        <span>{t}</span>
        <span style={{ color: C.violet, fontSize: size * 0.45 }}>{sep}</span>
      </React.Fragment>
    ))}
  </div>
);

/** Price/offer tag chip. */
export const TagChip: React.FC<{ text: string; dark?: boolean; size?: number }> = ({ text, dark, size = 20 }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: size, fontWeight: 600, padding: `${size * 0.45}px ${size * 0.9}px`, borderRadius: 999, background: dark ? rgba(C.violet, 0.16) : rgba(C.violet, 0.12), color: dark ? C.lilac : C.violet2, border: `1px solid ${rgba(C.violet, 0.35)}`, whiteSpace: "nowrap" }}>
    {text}
  </span>
);
