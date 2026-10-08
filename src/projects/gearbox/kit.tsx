import React from "react";
import { blurF, easeInOut, easeOut, io } from "../../engine/util";
import { K } from "./brand";

export const W = 1080;
export const H = 1920;
export const TAU = Math.PI * 2;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const back = (t: number) => { const c = 1.6; const u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
export const ioB = (f: number, a: number, b: number) => back(clamp01((f - a) / (b - a)));

/* ───────────────────────── gear geometry ───────────────────────── */

/** Gear outline (module m, N teeth) centred at 0,0. Trapezoid teeth with a pitch-circle waist — reads as involute at video scale. */
export const gearPath = (N: number, m: number) => {
  const rp = (m * N) / 2, ra = rp + m, rf = rp - 1.25 * m;
  const p = TAU / N;
  const tip = p * 0.13, pitch = p * 0.25, root = p * 0.33;
  const pt = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  let d = `M ${pt(rf, -p / 2)}`;
  for (let k = 0; k < N; k++) {
    const c = k * p;
    d += ` A ${rf} ${rf} 0 0 1 ${pt(rf, c - root)}`;
    d += ` L ${pt(rp, c - pitch)} L ${pt(ra, c - tip)}`;
    d += ` A ${ra} ${ra} 0 0 1 ${pt(ra, c + tip)}`;
    d += ` L ${pt(rp, c + pitch)} L ${pt(rf, c + root)}`;
    d += ` A ${rf} ${rf} 0 0 1 ${pt(rf, c + p / 2)}`;
  }
  return d + " Z";
};

/** Phase (radians) for a gear meshing with a driver whose tooth points along `dir`. */
export const meshPhase = (N2: number, dir: number) => dir + Math.PI + Math.PI / N2;

/**
 * Blueprint gear. `draw` 0→1 strokes the outline on; `fill` fades the body; `rot` in radians.
 * `marker` puts an amber dot on tooth 0 (to count turns). `glow` 0→1 adds an amber rim.
 */
export const Gear: React.FC<{
  N: number; m: number; x: number; y: number; rot: number; draw?: number; fill?: number; marker?: boolean;
  glow?: number; color?: string; scale?: number; opacity?: number; spokes?: boolean; dashPitch?: boolean;
}> = ({ N, m, x, y, rot, draw = 1, fill = 1, marker, glow = 0, color = K.line, scale = 1, opacity = 1, spokes = true, dashPitch = true }) => {
  const rp = (m * N) / 2, ra = rp + m, rf = rp - 1.25 * m;
  const hub = Math.max(m * 1.4, rf * 0.28);
  const bore = hub * 0.45;
  const deg = (rot * 180) / Math.PI;
  const holes = rf > 3.2 * hub ? 5 : rf > 2.3 * hub ? 4 : 0;
  const holeR = (rf - hub) * 0.32;
  const holeC = (rf + hub) / 2;
  const sw = 3.2 / scale;
  const pad = ra + 30;
  return (
    <svg width={pad * 2} height={pad * 2} viewBox={`${-pad} ${-pad} ${pad * 2} ${pad * 2}`}
      style={{ position: "absolute", left: x - pad, top: y - pad, overflow: "visible", opacity, transform: `scale(${scale})` }}>
      {glow > 0.01 && <circle r={ra + 6} fill="none" stroke={K.amber} strokeWidth={10} opacity={glow * 0.35} style={{ filter: "blur(10px)" }} />}
      <g transform={`rotate(${deg})`}>
        <path d={gearPath(N, m)} fill={color} fillOpacity={0.07 * fill * clamp01(draw * 2 - 1)} stroke={glow > 0.5 ? K.amber : color} strokeWidth={sw}
          strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        {spokes && holes > 0 && Array.from({ length: holes }).map((_, i) => {
          const a = (i / holes) * TAU + 0.3;
          return <circle key={i} cx={holeC * Math.cos(a)} cy={holeC * Math.sin(a)} r={holeR} fill={K.bg} fillOpacity={0.55 * fill * clamp01(draw * 2 - 1)}
            stroke={color} strokeWidth={sw * 0.8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(draw * 1.4 - 0.4)} />;
        })}
        <circle r={hub} fill="none" stroke={color} strokeWidth={sw * 0.9} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(draw * 1.3 - 0.3)} />
        <path d={`M ${-bore} 0 A ${bore} ${bore} 0 1 1 ${bore} 0 A ${bore} ${bore} 0 1 1 ${-bore} 0`} fill={K.bgDeep} stroke={color} strokeWidth={sw * 0.8} opacity={clamp01(draw * 2 - 1)} />
        <rect x={-bore * 0.25} y={-bore - bore * 0.3} width={bore * 0.5} height={bore * 0.45} fill={color} opacity={clamp01(draw * 2 - 1) * 0.9} />
        {marker && <circle cx={rp + m * 0.35} cy={0} r={Math.max(7, m * 0.42)} fill={K.amber} opacity={clamp01(draw * 2 - 1)} />}
      </g>
      {dashPitch && <circle r={rp} fill="none" stroke={color} strokeWidth={1.4 / scale} strokeDasharray="10 8" opacity={0.35 * clamp01(draw * 2 - 1)} />}
      <g opacity={0.5 * clamp01(draw * 2 - 1)} stroke={color} strokeWidth={1.4 / scale}>
        <line x1={-ra - 18} y1={0} x2={-hub - 6} y2={0} strokeDasharray="22 6 4 6" />
        <line x1={hub + 6} y1={0} x2={ra + 18} y2={0} strokeDasharray="22 6 4 6" />
        <line x1={0} y1={-ra - 18} x2={0} y2={-hub - 6} strokeDasharray="22 6 4 6" />
        <line x1={0} y1={hub + 6} x2={0} y2={ra + 18} strokeDasharray="22 6 4 6" />
      </g>
    </svg>
  );
};

/* ───────────────────────── background + HUD ───────────────────────── */

export const Blueprint: React.FC<{ f: number; flash?: number }> = ({ f, flash = 0 }) => {
  const p = io(f, [0, 22], [0, 1], easeOut);
  const push = 1 + f * 0.00004;
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 42%, #0B2245 0%, ${K.bg} 55%, ${K.bgDeep} 100%)`, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: -40, transform: `scale(${push})`, opacity: p,
        backgroundImage: `linear-gradient(${K.gridMajor} 1.5px, transparent 1.5px), linear-gradient(90deg, ${K.gridMajor} 1.5px, transparent 1.5px), linear-gradient(${K.grid} 1px, transparent 1px), linear-gradient(90deg, ${K.grid} 1px, transparent 1px)`,
        backgroundSize: "200px 200px, 200px 200px, 40px 40px, 40px 40px", backgroundPosition: "20px 0, 20px 0, 20px 0, 20px 0",
        WebkitMaskImage: `linear-gradient(180deg, transparent 0%, black ${(1 - p) * 100}%, black 100%)`,
      }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 55% at 50% 50%, transparent 40%, rgba(2,8,18,0.75) 100%)" }} />
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: K.amber, opacity: flash * 0.09, mixBlendMode: "screen" }} />}
    </div>
  );
};

/** Corner registration marks + series label + progress line. Kept inside Reels safe zones. */
export const HUD: React.FC<{ f: number; total: number; ep?: string; cuts?: number[]; label?: string; accent?: string }> = ({ f, total, ep = "01", label = "HOW IT WORKS", accent = K.amber, cuts = [0, 58, 112, 182, 234, 362, 446, 488, 578, 712, 828] }) => {
  const o = io(f, [6, 20], [0, 1]) * (1 - io(f, [total - 70, total - 58], [0, 1]));
  const mark = (x: number, y: number, sx: number, sy: number) => (
    <path d={`M ${x} ${y + sy * 36} L ${x} ${y} L ${x + sx * 36} ${y}`} stroke={K.lineDim} strokeWidth={2} fill="none" />
  );
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {mark(48, 236, 1, 1)}{mark(W - 48, 236, -1, 1)}{mark(48, 1560, 1, -1)}{mark(W - 48, 1560, -1, -1)}
      </svg>
      <div style={{ position: "absolute", left: 96, top: 256, fontFamily: K.mono, fontSize: 22, letterSpacing: 4, color: K.muted, fontWeight: 500 }}>
        {label} <span style={{ color: accent }}>/</span> {ep}
      </div>
      <div style={{ position: "absolute", right: 96, top: 256, fontFamily: K.mono, fontSize: 22, letterSpacing: 4, color: K.muted }}>
        FIG.<span style={{ color: K.text }}>{String(cuts.filter((a) => f >= a).length).padStart(2, "0")}</span>
      </div>
      <div style={{ position: "absolute", left: 96, right: 96, top: 300, height: 2, background: "rgba(92,211,255,0.14)" }}>
        <div style={{ width: `${clamp01(f / total) * 100}%`, height: 2, background: K.line, boxShadow: `0 0 12px ${K.line}` }} />
      </div>
    </div>
  );
};

/* ───────────────────────── typography ───────────────────────── */

const parse = (s: string) => s.split(/(\*[^*]+\*)/g).filter(Boolean).map((t) => (t.startsWith("*") ? { t: t.slice(1, -1), a: true } : { t, a: false }));

/** Headline: each line masks up; *accent* words in serif italic amber. Optional exit. */
export const Headline: React.FC<{ f: number; lines: string[]; at: number; size?: number; top?: number; exitAt?: number; stagger?: number; accent?: string }> = ({
  f, lines, at, size = 92, top = 360, exitAt, stagger = 5, accent = K.amber,
}) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center" }}>
    {lines.map((line, i) => {
      const p = io(f, [at + i * stagger, at + i * stagger + 16], [0, 1], easeOut);
      const out = exitAt !== undefined ? io(f, [exitAt + i * 2, exitAt + i * 2 + 10], [0, 1], easeInOut) : 0;
      return (
        <div key={i} style={{ overflow: "hidden", padding: `0 20px ${size * 0.16}px`, marginBottom: -size * 0.1 }}>
          <div style={{ transform: `translateY(${(1 - p) * 110 - out * 110}%)`, whiteSpace: "nowrap", fontFamily: K.head, fontWeight: 700, fontSize: size, lineHeight: 1.06, letterSpacing: -size * 0.03, color: K.text }}>
            {parse(line).map((s, j) => (
              <span key={j} style={s.a ? { color: accent, fontFamily: K.serif, fontStyle: "italic", fontWeight: 400, fontSize: size * 1.12, letterSpacing: -size * 0.01 } : undefined}>{s.t}</span>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

/** Mono technical label with a leading tick; types on. */
export const Label: React.FC<{ f: number; at: number; text: string; x: number; y: number; color?: string; size?: number; align?: "left" | "center" | "right"; out?: number }> = ({
  f, at, text, x, y, color = K.muted, size = 24, align = "left", out,
}) => {
  const n = Math.floor(io(f, [at, at + Math.max(6, text.length * 0.9)], [0, text.length], (t) => t));
  const o = io(f, [at, at + 4], [0, 1]) * (out !== undefined ? 1 - io(f, [out, out + 8], [0, 1]) : 1);
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx})`, opacity: o, fontFamily: K.mono, fontSize: size, letterSpacing: size * 0.12, color, whiteSpace: "nowrap", fontWeight: 500 }}>
      {text.slice(0, n)}<span style={{ opacity: n < text.length ? 1 : 0, color: K.line }}>▍</span>
    </div>
  );
};

/** Big mono readout (tabular). */
export const Readout: React.FC<{ value: string; size?: number; color?: string; weight?: number }> = ({ value, size = 120, color = K.text, weight = 700 }) => (
  <span style={{ fontFamily: K.mono, fontSize: size, color, fontWeight: weight, letterSpacing: -size * 0.04, fontVariantNumeric: "tabular-nums" }}>{value}</span>
);

/** Pill tag (pops in). */
export const Tag: React.FC<{ f: number; at: number; text: string; x: number; y: number; color?: string; solid?: boolean; size?: number; out?: number }> = ({
  f, at, text, x, y, color = K.amber, solid, size = 30, out,
}) => {
  const p = ioB(f, at, at + 12);
  const o = clamp01((f - at) / 4) * (out !== undefined ? 1 - io(f, [out, out + 8], [0, 1]) : 1);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * p})`, opacity: o,
      padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: 999, border: `2px solid ${color}`, background: solid ? color : "rgba(6,20,42,0.85)",
      color: solid ? K.bgDeep : color, fontFamily: K.mono, fontWeight: 700, fontSize: size, letterSpacing: size * 0.08, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

/** Horizontal meter bar with label + value. */
export const Meter: React.FC<{ x: number; y: number; w: number; v: number; label: string; value: string; color: string; o?: number }> = ({ x, y, w, v, label, value, color, o = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, opacity: o }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: K.mono, fontSize: 26, letterSpacing: 3, color: K.muted, marginBottom: 12 }}>
      <span>{label}</span><span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
    <div style={{ height: 26, borderRadius: 4, border: `2px solid ${K.lineDim}`, padding: 3, background: "rgba(3,11,24,0.6)" }}>
      <div style={{ width: `${clamp01(v) * 100}%`, height: "100%", borderRadius: 2, background: `repeating-linear-gradient(90deg, ${color} 0 14px, transparent 14px 18px)`, boxShadow: `0 0 18px ${color}88` }} />
    </div>
  </div>
);

/* ───────────────────────── objects ───────────────────────── */

/** Wheel with tyre, rim and 5 spokes. rot in radians. */
export const Wheel: React.FC<{ r: number; rot: number; stroke?: number; color?: string; draw?: number }> = ({ r, rot, stroke = 3, color = K.line, draw = 1 }) => (
  <g>
    <circle r={r} fill={K.bgDeep} fillOpacity={0.9 * clamp01(draw * 2 - 1)} stroke={color} strokeWidth={stroke} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
    <circle r={r * 0.68} fill="none" stroke={color} strokeWidth={stroke * 0.8} opacity={draw} />
    <g transform={`rotate(${(rot * 180) / Math.PI})`} opacity={draw}>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * TAU;
        return <line key={i} x1={Math.cos(a) * r * 0.16} y1={Math.sin(a) * r * 0.16} x2={Math.cos(a) * r * 0.64} y2={Math.sin(a) * r * 0.64} stroke={color} strokeWidth={stroke * 1.6} strokeLinecap="round" />;
      })}
      <circle r={r * 0.15} fill="none" stroke={color} strokeWidth={stroke} />
      <circle cx={r * 0.84} cy={0} r={Math.max(4, r * 0.05)} fill={K.amber} />
    </g>
  </g>
);

/** Side-profile sedan in line art (600 × 190 box, wheels at 115/475, ground at y=188). */
export const Car: React.FC<{ draw: number; wheelRot: number; engineGlow?: number; color?: string }> = ({ draw, wheelRot, engineGlow = 0, color = K.line }) => {
  const body = "M 70 150 A 45 45 0 0 1 160 150 L 430 150 A 45 45 0 0 1 520 150 L 578 150 Q 596 149 596 131 L 592 112 Q 588 98 562 94 L 470 84 Q 428 40 372 32 L 262 32 Q 212 36 162 84 L 66 94 Q 28 100 24 124 L 24 140 Q 26 150 40 150 Z";
  const win1 = "M 182 84 Q 222 46 266 44 L 308 44 L 308 84 Z";
  const win2 = "M 324 44 L 370 44 Q 418 50 450 84 L 324 84 Z";
  const sd = (p: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - clamp01(p) });
  return (
    <g>
      {engineGlow > 0 && <ellipse cx={530} cy={115} rx={70} ry={40} fill={K.amber} opacity={engineGlow * 0.45} style={{ filter: "blur(16px)" }} />}
      <path d={body} fill={color} fillOpacity={0.06 * clamp01(draw * 2 - 1)} stroke={color} strokeWidth={3.2} strokeLinejoin="round" {...sd(draw * 1.15)} />
      <path d={win1} fill={color} fillOpacity={0.1 * clamp01(draw * 2 - 1)} stroke={color} strokeWidth={2.4} {...sd(draw * 1.6 - 0.5)} />
      <path d={win2} fill={color} fillOpacity={0.1 * clamp01(draw * 2 - 1)} stroke={color} strokeWidth={2.4} {...sd(draw * 1.6 - 0.55)} />
      <line x1={316} y1={92} x2={316} y2={146} stroke={color} strokeWidth={2} opacity={clamp01(draw * 2 - 1)} />
      <line x1={560} y1={106} x2={590} y2={108} stroke={K.amber} strokeWidth={5} strokeLinecap="round" opacity={clamp01(draw * 2 - 1)} />
      <g transform="translate(115 150)"><Wheel r={38} rot={wheelRot} stroke={3} draw={clamp01(draw * 1.4 - 0.3)} color={color} /></g>
      <g transform="translate(475 150)"><Wheel r={38} rot={wheelRot} stroke={3} draw={clamp01(draw * 1.4 - 0.3)} color={color} /></g>
    </g>
  );
};

/** 240° gauge. v 0..1. Ticks + numbers 0..max. */
export const Gauge: React.FC<{ r: number; v: number; max: number; color?: string; redFrom?: number; draw?: number; label?: string }> = ({ r, v, max, color = K.line, redFrom = 0.8, draw = 1, label }) => {
  const a0 = (150 * Math.PI) / 180, span = (240 * Math.PI) / 180;
  const arc = (rr: number, t0: number, t1: number) => {
    const s = a0 + span * t0, e = a0 + span * t1;
    return `M ${rr * Math.cos(s)} ${rr * Math.sin(s)} A ${rr} ${rr} 0 ${e - s > Math.PI ? 1 : 0} 1 ${rr * Math.cos(e)} ${rr * Math.sin(e)}`;
  };
  const na = a0 + span * clamp01(v);
  return (
    <g>
      <path d={arc(r, 0, 1)} fill="none" stroke={K.lineDim} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      <path d={arc(r, redFrom, 1)} fill="none" stroke={K.red} strokeWidth={10} opacity={draw} />
      <path d={arc(r - 14, 0, Math.min(clamp01(v), 1))} fill="none" stroke={v > redFrom ? K.red : color} strokeWidth={8} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${color})` }} opacity={draw} />
      {Array.from({ length: max * 2 + 1 }).map((_, i) => {
        const t = i / (max * 2), a = a0 + span * t, big = i % 2 === 0;
        return (
          <g key={i} opacity={clamp01(draw * 2 - t)}>
            <line x1={(r + 6) * Math.cos(a)} y1={(r + 6) * Math.sin(a)} x2={(r + (big ? 30 : 18)) * Math.cos(a)} y2={(r + (big ? 30 : 18)) * Math.sin(a)} stroke={t >= redFrom ? K.red : K.text} strokeWidth={big ? 4 : 2} />
            {big && <text x={(r + 58) * Math.cos(a)} y={(r + 58) * Math.sin(a) + 11} textAnchor="middle" fontFamily={K.mono} fontSize={30} fill={K.muted}>{i / 2}</text>}
          </g>
        );
      })}
      <line x1={-24 * Math.cos(na)} y1={-24 * Math.sin(na)} x2={(r - 30) * Math.cos(na)} y2={(r - 30) * Math.sin(na)} stroke={K.amber} strokeWidth={7} strokeLinecap="round" opacity={draw} />
      <circle r={16} fill={K.bgDeep} stroke={K.amber} strokeWidth={5} opacity={draw} />
      {label && <text y={r * 0.9} textAnchor="middle" fontFamily={K.mono} fontSize={26} letterSpacing={5} fill={K.muted} opacity={draw}>{label}</text>}
    </g>
  );
};

/** Curved torque arrow around a centre (radius r), sweep 0..1 of 300°, thickness scales with `mag`. */
export const TorqueArrow: React.FC<{ r: number; sweep: number; mag: number; color: string; start?: number }> = ({ r, sweep, mag, color, start = -100 }) => {
  if (sweep <= 0.01) return null;
  const s = (start * Math.PI) / 180, e = s + ((300 * Math.PI) / 180) * clamp01(sweep);
  const sw = 6 + mag * 16;
  const ex = r * Math.cos(e), ey = r * Math.sin(e);
  const tx = -Math.sin(e), ty = Math.cos(e);
  const nx = Math.cos(e), ny = Math.sin(e);
  const hl = sw * 1.9, hw = sw * 1.25;
  return (
    <g style={{ filter: `drop-shadow(0 0 14px ${color})` }}>
      <path d={`M ${r * Math.cos(s)} ${r * Math.sin(s)} A ${r} ${r} 0 ${e - s > Math.PI ? 1 : 0} 1 ${ex} ${ey}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <path d={`M ${ex + tx * hl} ${ey + ty * hl} L ${ex + nx * hw} ${ey + ny * hw} L ${ex - nx * hw} ${ey - ny * hw} Z`} fill={color} />
    </g>
  );
};

/** Blueprint dimension line between two points with a centred label. */
export const Dim: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number; label?: string; color?: string }> = ({ x1, y1, x2, y2, p, label, color = K.muted }) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const hx = (x2 - x1) / 2 * p, hy = (y2 - y1) / 2 * p;
  return (
    <g opacity={clamp01(p * 3)}>
      <line x1={mx - hx} y1={my - hy} x2={mx + hx} y2={my + hy} stroke={color} strokeWidth={2} markerStart="url(#arr)" markerEnd="url(#arr)" />
      {label && <text x={mx} y={my - 14} textAnchor="middle" fontFamily={K.mono} fontSize={24} fill={color} opacity={clamp01(p * 2 - 1)}>{label}</text>}
    </g>
  );
};

export const Defs: React.FC = () => (
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill={K.muted} />
    </marker>
  </defs>
);

/** Full-canvas SVG layer. */
export const Layer: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>
    <Defs />
    {children}
  </svg>
);

/** Quick scan line sweep (blueprint "refresh") used on scene changes. */
export const Scan: React.FC<{ f: number; at: number; dur?: number }> = ({ f, at, dur = 14 }) => {
  const p = io(f, [at, at + dur], [0, 1], easeInOut);
  if (p <= 0 || p >= 1) return null;
  const y = -40 + p * (H + 80);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - 120, height: 120, background: `linear-gradient(180deg, transparent, ${K.line}22 70%, ${K.line}aa 100%)`, filter: blurF(1) }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: K.line, boxShadow: `0 0 18px ${K.line}` }} />
    </div>
  );
};
