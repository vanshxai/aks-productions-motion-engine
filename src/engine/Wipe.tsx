import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { C, easeInOut, io, rgba } from "./util";

export type WipeType = "left" | "right" | "up" | "down" | "iris" | "diag" | "cut" | "fade";

const Inner: React.FC<{ type: WipeType; inF: number; ox: number; oy: number; edge: boolean; children: React.ReactNode }> = ({ type, inF, ox, oy, edge, children }) => {
  const f = useCurrentFrame();
  const p = type === "cut" ? 1 : io(f, [0, inF], [0, 1], easeInOut);
  let clip = "none";
  let edgeEl: React.ReactNode = null;
  const edgeStyle: React.CSSProperties = { position: "absolute", background: `linear-gradient(90deg, ${rgba(C.violet, 0)}, ${C.violet}, ${rgba(C.violet, 0)})`, boxShadow: `0 0 24px ${rgba(C.violet, 0.8)}`, opacity: p > 0 && p < 1 ? 1 : 0 };
  if (type === "left") { clip = `inset(0 ${(1 - p) * 100}% 0 0)`; if (edge) edgeEl = <div style={{ ...edgeStyle, top: 0, bottom: 0, width: 3, left: `calc(${p * 100}% - 1px)`, background: C.violet }} />; }
  if (type === "right") { clip = `inset(0 0 0 ${(1 - p) * 100}%)`; if (edge) edgeEl = <div style={{ ...edgeStyle, top: 0, bottom: 0, width: 3, left: `calc(${(1 - p) * 100}% - 1px)`, background: C.violet }} />; }
  if (type === "up") { clip = `inset(${(1 - p) * 100}% 0 0 0)`; if (edge) edgeEl = <div style={{ ...edgeStyle, left: 0, right: 0, height: 3, top: `calc(${(1 - p) * 100}% - 1px)`, background: C.violet }} />; }
  if (type === "down") { clip = `inset(0 0 ${(1 - p) * 100}% 0)`; if (edge) edgeEl = <div style={{ ...edgeStyle, left: 0, right: 0, height: 3, top: `calc(${p * 100}% - 1px)`, background: C.violet }} />; }
  if (type === "iris") clip = `circle(${p * 150}% at ${ox}% ${oy}%)`;
  if (type === "diag") { const x = -40 + p * 180; clip = `polygon(0 0, ${x}% 0, ${x - 40}% 100%, 0 100%)`; if (edge) edgeEl = <div style={{ position: "absolute", top: "-10%", height: "120%", width: 4, left: `${x - 20}%`, transform: "skewX(-21.8deg)", background: C.violet, boxShadow: `0 0 30px ${rgba(C.violet, 0.9)}`, opacity: p > 0 && p < 1 ? 1 : 0 }} />; }
  const op = type === "fade" ? p : 1;
  return (
    <>
      <AbsoluteFill style={{ clipPath: clip === "none" ? undefined : clip, opacity: op }}>{children}</AbsoluteFill>
      {edgeEl}
    </>
  );
};

/**
 * Level-2 scene wrapper: the new scene is REVEALED over the previous one (mask wipe / iris / diagonal / cut).
 * Give each scene its own opaque background. Keep durations overlapping by ≥ inF so the old scene sits under the wipe.
 */
export const Wipe: React.FC<{ from: number; dur: number; type?: WipeType; inF?: number; ox?: number; oy?: number; edge?: boolean; children: React.ReactNode }> = ({ from, dur, type = "left", inF = 16, ox = 50, oy = 50, edge = true, children }) => (
  <Sequence from={from} durationInFrames={dur}>
    <Inner type={type} inF={inF} ox={ox} oy={oy} edge={edge}>{children}</Inner>
  </Sequence>
);

/** Diagonal light band sweeping across the frame (use on a cut / hero landing). */
export const LightSweep: React.FC<{ f: number; at: number; dur?: number; color?: string; opacity?: number }> = ({ f, at, dur = 18, color = "#FFFFFF", opacity = 0.55 }) => {
  const p = io(f, [at, at + dur], [0, 1], easeInOut);
  if (p <= 0 || p >= 1) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <div style={{ position: "absolute", top: "-20%", height: "140%", width: 380, left: `${-30 + p * 160}%`, transform: "skewX(-22deg)", background: `linear-gradient(90deg, transparent, ${rgba(color, opacity)}, transparent)` }} />
    </AbsoluteFill>
  );
};

/** Animated paper/film grain (SVG turbulence). Cheap; opacity ~0.05–0.09. */
export const Grain: React.FC<{ f: number; opacity?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({ f, opacity = 0.07, blend = "multiply" }) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: blend }}>
    <svg width="100%" height="100%">
      <filter id={`grain${Math.floor(f / 2) % 6}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(f / 2) % 6} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain${Math.floor(f / 2) % 6})`} />
    </svg>
  </AbsoluteFill>
);
