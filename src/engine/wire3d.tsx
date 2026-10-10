/**
 * wire3d — "2D that rotates like 3D wireframe".
 *
 * A tiny, dependency-free, frame-driven 3D -> 2D line renderer for Remotion (no three.js, no canvas, no useFrame).
 * Everything is a PURE FUNCTION of its inputs: give it the same `lines` + `view` and you get the same SVG. Animate by changing `view`
 * (yaw / pitch / scale / pivot) or the lines from `useCurrentFrame()`.
 *
 *   import { Wire3D, ring, project, V3, WireLine } from "../../engine/wire3d";
 *   const lines: WireLine[] = [{ pts: ring([0, 0, 0], 3, "z", 16), closed: true }, { pts: [[0, 0, -9], [0, 0, 9]] }];
 *   <svg width={1080} height={1920}><Wire3D lines={lines} view={{ yaw: f * 0.02, pitch: 0.25, dist: 150, scale: 20, cx: 540, cy: 900 }} /></svg>
 *
 * Model space: X right, Y up, Z toward the nose / the viewer when yaw = 0. Units are arbitrary; `view.scale` is pixels per unit.
 * Transform order: translate(-pivot) -> rotate about Y (yaw) -> rotate about X (pitch) -> rotate about Z (roll) -> perspective.
 * Perspective: camera sits on +Z at `dist` units; k = dist / (dist - z). Use a large dist (120-200) for a calm look, ~60 for dramatic.
 *
 * Look: amber-on-navy HUD palette (`color` = cyan lines, `accent` = amber lines/glow, per-line `color` overrides).
 *  - depth cue: near segments are brighter and thicker, far segments fade (`depthFade`: opacity at the far end, `widthFade`: width ratio at the far end)
 *  - hidden-line fade: give a polyline an outward face normal `n` and it dims by `hiddenFade` while it faces away from the camera
 *  - `reveal` 0..1 draws the first fraction of all segments (in polyline order) -> draw-on animation
 *  - `glow` px: a blurred copy underneath (set 0 to skip the filter on very busy pages)
 * Cost: segments are batched into depth buckets (8 per colour) -> a few dozen <path> nodes however many lines you pass.
 * Backwards-compatible: nothing in the engine imports this file; existing episodes are untouched.
 */
import React from "react";

export type V3 = [number, number, number];
export interface WireLine {
  pts: V3[];
  closed?: boolean;
  /** stroke colour override (e.g. "#FFB547"); default is the `color` prop */
  color?: string;
  /** opacity multiplier 0..1 (fade groups in and out) */
  op?: number;
  /** width multiplier */
  w?: number;
  /** outward face normal (model space) for the hidden-line fade */
  n?: V3;
}
export interface WireView {
  yaw: number; pitch: number; roll?: number;
  /** camera distance in model units (perspective strength) */
  dist: number;
  /** pixels per model unit at z = 0 */
  scale: number;
  /** screen position of the pivot */
  cx: number; cy: number;
  /** model point that stays at (cx, cy) while rotating (default origin) */
  pivot?: V3;
}
export interface P3 { x: number; y: number; z: number; k: number }

/** Project one model point to the screen. z is the rotated depth (+ toward the camera), k the perspective factor. */
export const project = (p: V3, v: WireView): P3 => {
  const pv = v.pivot ?? [0, 0, 0];
  let x = p[0] - pv[0], y = p[1] - pv[1], z = p[2] - pv[2];
  const cy_ = Math.cos(v.yaw), sy_ = Math.sin(v.yaw);
  const x1 = x * cy_ + z * sy_, z1 = -x * sy_ + z * cy_;
  const cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
  const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
  let x3 = x1, y3 = y2;
  if (v.roll) { const cr = Math.cos(v.roll), sr = Math.sin(v.roll); x3 = x1 * cr - y2 * sr; y3 = x1 * sr + y2 * cr; }
  const k = v.dist / Math.max(1, v.dist - z2);
  return { x: v.cx + x3 * k * v.scale, y: v.cy - y3 * k * v.scale, z: z2, k };
};

/** Rotate a direction (normal) with the view (no perspective). Returns z (+ toward the camera). */
const facing = (n: V3, v: WireView) => {
  const cy_ = Math.cos(v.yaw), sy_ = Math.sin(v.yaw), cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
  const z1 = -n[0] * sy_ + n[2] * cy_;
  return n[1] * sp + z1 * cp;
};

/** Closed/open circle of `n` points around `c`, lying in the plane perpendicular to `axis`. `rot` spins the start angle. */
export const ring = (c: V3, r: number, axis: "x" | "y" | "z" = "z", n = 16, rot = 0): V3[] =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2, u = r * Math.cos(a), w = r * Math.sin(a);
    return axis === "z" ? [c[0] + u, c[1] + w, c[2]] : axis === "x" ? [c[0], c[1] + u, c[2] + w] : [c[0] + u, c[1], c[2] + w];
  });

/** Mirror a set of lines across x = 0 (handy for symmetric airframes). */
export const mirrorX = (ls: WireLine[]): WireLine[] => ls.map((l) => ({ ...l, pts: l.pts.map(([x, y, z]) => [-x, y, z] as V3), n: l.n ? ([-l.n[0], l.n[1], l.n[2]] as V3) : undefined }));

const NB = 8; // depth buckets per colour

export const Wire3D: React.FC<{
  lines: WireLine[];
  view: WireView;
  /** default line colour (HUD cyan) */
  color?: string;
  /** glow colour (HUD amber) */
  accent?: string;
  /** base stroke width in px at mid depth */
  width?: number;
  /** opacity of the farthest segments (nearest = 1) */
  depthFade?: number;
  /** width ratio of the farthest segments (nearest = 1.25 x base) */
  widthFade?: number;
  /** opacity multiplier for back-facing lines that carry a normal `n` (1 = off) */
  hiddenFade?: number;
  /** 0..1 draw-on over all segments in order */
  reveal?: number;
  /** blur radius of the glow copy (0 = none) */
  glow?: number;
  opacity?: number;
}> = ({ lines, view, color = "#5CD3FF", accent = "#FFB547", width = 2.6, depthFade = 0.22, widthFade = 0.55, hiddenFade = 0.3, reveal = 1, glow = 7, opacity = 1 }) => {
  // 1. project every point once
  const P = lines.map((l) => l.pts.map((p) => project(p, view)));
  let zmin = Infinity, zmax = -Infinity;
  for (const pl of P) for (const q of pl) { if (q.z < zmin) zmin = q.z; if (q.z > zmax) zmax = q.z; }
  const zr = Math.max(1e-6, zmax - zmin);
  let total = 0;
  for (const l of lines) total += l.closed ? l.pts.length : l.pts.length - 1;
  let budget = reveal >= 1 ? Infinity : Math.max(0, reveal) * total;
  // 2. bucket segments by (colour, depth, back-facing)
  const buckets = new Map<string, { d: string; col: string; b: number; hid: boolean; wm: number; op: number }>();
  for (let li = 0; li < lines.length && budget > 0; li++) {
    const l = lines[li], q = P[li];
    const col = l.color ?? color;
    const hid = !!l.n && hiddenFade < 1 && facing(l.n, view) < -0.02;
    const nseg = l.closed ? q.length : q.length - 1;
    for (let s = 0; s < nseg && budget > 0; s++) {
      const a = q[s], b = q[(s + 1) % q.length];
      let x2 = b.x, y2 = b.y;
      if (budget < 1) { x2 = a.x + (b.x - a.x) * budget; y2 = a.y + (b.y - a.y) * budget; }
      budget -= 1;
      const t = ((a.z + b.z) / 2 - zmin) / zr;
      const bi = Math.min(NB - 1, Math.max(0, Math.floor(t * NB)));
      const key = `${col}|${bi}|${hid ? 1 : 0}|${l.op ?? 1}|${l.w ?? 1}`;
      let bk = buckets.get(key);
      if (!bk) { bk = { d: "", col, b: bi, hid, wm: l.w ?? 1, op: l.op ?? 1 }; buckets.set(key, bk); }
      bk.d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
  }
  const items = Array.from(buckets.values());
  const style = (it: (typeof items)[number]) => {
    const t = (it.b + 0.5) / NB;
    return { o: opacity * it.op * (depthFade + (1 - depthFade) * t) * (it.hid ? hiddenFade : 1), w: width * it.wm * (widthFade + (1.25 - widthFade) * t) };
  };
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {glow > 0 && (
        <g style={{ filter: `blur(${glow}px)` }}>
          {items.map((it, i) => { const s = style(it); return <path key={i} d={it.d} stroke={it.col === color ? accent : it.col} strokeWidth={s.w * 2.4} opacity={s.o * 0.5} />; })}
        </g>
      )}
      {items.map((it, i) => { const s = style(it); return <path key={i} d={it.d} stroke={it.col} strokeWidth={s.w} opacity={s.o} />; })}
    </g>
  );
};
