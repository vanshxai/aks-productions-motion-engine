import React from "react";
import { C, FONT, rgba } from "./util";

/** Four L-shaped scan corners that snap in around a w×h box (p: 0→1). */
export const Brackets: React.FC<{ p: number; w: number; h: number }> = ({ p, w, h }) => {
  const off = 26 + (1 - p) * 50;
  const L = 56;
  const s: React.CSSProperties = { position: "absolute", width: L, height: L, borderColor: C.lilac2, borderStyle: "solid", opacity: p, filter: `drop-shadow(0 0 8px ${rgba(C.violet2, 0.8)})` };
  return (
    <>
      <div style={{ ...s, left: -off, top: -off, borderWidth: "4px 0 0 4px", borderTopLeftRadius: 10 }} />
      <div style={{ ...s, left: w + off - L, top: -off, borderWidth: "4px 4px 0 0", borderTopRightRadius: 10 }} />
      <div style={{ ...s, left: -off, top: h + off - L, borderWidth: "0 0 4px 4px", borderBottomLeftRadius: 10 }} />
      <div style={{ ...s, left: w + off - L, top: h + off - L, borderWidth: "0 4px 4px 0", borderBottomRightRadius: 10 }} />
    </>
  );
};

/** Horizontal scan line sweeping down a box of height h (p: 0→1). */
export const ScanLine: React.FC<{ p: number; h: number; radius?: number }> = ({ p, h, radius = 20 }) =>
  p <= 0 || p >= 1 ? null : (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: radius, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: p * h - 120, height: 120, background: `linear-gradient(180deg, ${rgba(C.violet2, 0)} 0%, ${rgba(C.violet2, 0.16)} 100%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: p * h, height: 3, background: C.violet2, boxShadow: `0 0 18px 4px ${rgba(C.violet2, 0.8)}` }} />
    </div>
  );

/** Highlight box + angled connector + floating tag, positioned in the parent's coordinate space. */
export const CalloutTag: React.FC<{
  p: number; x: number; y: number; w: number; h: number;
  side: "left" | "right"; dy?: number; tag: string; value: string; valueColor?: string; parentW: number;
}> = ({ p, x, y, w, h, side, dy = 0, tag, value, valueColor = "#fff", parentW }) => {
  const left = side === "left";
  const ex = left ? x - 4 : x + w + 4, ey = y + h / 2;
  const dx = left ? -70 : 70, len = Math.hypot(dx, dy) * p, ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <>
      <div style={{ position: "absolute", left: x - 4, top: y - 3, width: w + 8, height: h + 6, borderRadius: 10, boxShadow: `inset 0 0 0 3px ${rgba(C.violet, p)}, 0 0 ${24 * p}px ${rgba(C.violet, 0.5 * p)}`, background: rgba(C.violet, 0.08 * p) }} />
      <div style={{ position: "absolute", left: ex, top: ey, width: len, height: 2, background: C.lilac2, opacity: p, transformOrigin: "0 50%", transform: `rotate(${ang}deg)` }} />
      <div style={{ position: "absolute", top: ey + dy, ...(left ? { right: parentW - x + 70 } : { left: x + w + 70 }), transform: `translate(${(1 - p) * (left ? 24 : -24)}px, -50%)`, opacity: p, background: "rgba(22,18,31,0.94)", border: `1.5px solid ${rgba(C.lilac, 0.55)}`, boxShadow: `0 0 28px ${rgba(C.violet2, 0.45)}`, borderRadius: 14, padding: "12px 20px", whiteSpace: "nowrap", fontFamily: FONT, textAlign: left ? "right" : "left" }}>
        <div style={{ fontSize: 14, letterSpacing: 1.4, color: C.lilac, fontWeight: 600 }}>✦ {tag}</div>
        <div style={{ fontSize: 28, color: valueColor, fontWeight: 700, marginTop: 2 }}>{value}</div>
      </div>
    </>
  );
};
