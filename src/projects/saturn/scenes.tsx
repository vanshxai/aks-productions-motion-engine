import React from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { easeIn, easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Meter, Tag, clamp01, ioB, meshPhase, W, H } from "../gearbox/kit";
import { Rocket3D } from "./stage3d";
import type { Cam, Pose } from "./stage3d";
import { F1_XZ, LOOK } from "./model";
import type { Stage } from "./model";

/**
 * ROCKETS #01 — Inside the Saturn V: 3 stages          30 s · 1080×1920 · 30 fps · 900 frames
 * Real NASA exterior model (NASA-3D-Resources "Saturn V.glb"), cut into stage groups by triangle-centroid Y (model.tsx). No invented parts, no internals.
 *
 * BEATS PLAN — one idea per beat, the picture shows exactly what the voice says (VO timing: public/projects/saturn/vo.json)
 *   0   hook    "This is the Saturn V. The rocket that took people to the Moon."   low hero camera, slow push-in on the full stack, big title behind the rocket
 *   118 size    "It's 111 meters tall. Nine tenths of its weight is fuel."          dimension line grows base→tip (counter 0→111 m); column of 10 blocks fills 9 amber
 *   241 stages  "It's built in three stages."                                       the stack separates (smooth exploded view) and the stages get numbered 1·2·3
 *   290 sic     "Stage one has five giant engines. It burns for two and a half minutes, then drops away."   camera dives to the 5 F-1 bells (numbered), burn bar fills, stage falls away
 *   467 sii     "Stage two takes over and carries it almost to orbit."              camera rises to S-II (cyan), burn bar ~6 min, stage falls away
 *   558 sivb    "Stage three reaches orbit, then fires again to go to the Moon."    S-IVB (green): burn 1 → coast → burn 2 timeline
 *   670 cap     "Only the tiny capsule at the top came home."                        everything else fades; the Apollo spacecraft on top is lit
 *   745 end     Follow-for-more end card + "3D MODEL: NASA · SIMPLIFIED EXTERIOR VIEW"
 */
export const T = { size: 118, stages: 241, sic: 290, sii: 467, sivb: 558, cap: 670, end: 745, total: 900 };
export const CUTS = [0, T.size, T.stages, T.sic, T.sii, T.sivb, T.cap, T.end];
/** cue frames shared with soundtrack.py */
export const CUE = {
  push: 6, dim: 150, fuel0: 192, split: 246, pills: 270, eng0: 300, burn: 378, drop1: 440, sii: 480, burn2: 500, drop2: 552, b1: 572, coast: 614, b2: 628, cap: 678, fade: 690,
};

const AM = K.amber, LN = K.line;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────────── motion helpers (all pure functions of the frame) ───────────── */
/** monotone cubic (PCHIP) through [frame, value] keys: smooth, no overshoot, zero speed on holds */
export const track = (f: number, k: [number, number][]) => {
  if (f <= k[0][0]) return k[0][1]; if (f >= k[k.length - 1][0]) return k[k.length - 1][1];
  let i = 0; while (f > k[i + 1][0]) i++;
  const n = k.length, h = (j: number) => k[j + 1][0] - k[j][0], d = (j: number) => (k[j + 1][1] - k[j][1]) / h(j);
  const m = (j: number) => {
    if (j === 0 || j === n - 1) return 0;
    const d0 = d(j - 1), d1 = d(j); if (d0 * d1 <= 0) return 0;
    const w1 = 2 * h(j) + h(j - 1), w2 = h(j) + 2 * h(j - 1); return (w1 + w2) / (w1 / d0 + w2 / d1);
  };
  const t = (f - k[i][0]) / h(i), t2 = t * t, t3 = t2 * t, hh = h(i);
  return (2 * t3 - 3 * t2 + 1) * k[i][1] + (t3 - 2 * t2 + t) * hh * m(i) + (-2 * t3 + 3 * t2) * k[i + 1][1] + (t3 - t2) * hh * m(i + 1);
};
const ks = (rows: number[][], c: number): [number, number][] => rows.map((r) => [r[0], r[c]]);

/** camera keys: [frame, azimuth, elevation, distance, target-y] */
const CAMK = [
  [0, 0.52, -0.1, 48, 5.6],
  [118, 0.8, -0.05, 40, 5.3],
  [185, 0.92, 0.0, 43, 5.3],
  [241, 0.95, 0.03, 43, 5.3],
  [280, 1.08, 0.05, 56, 7.0],
  [292, 1.08, 0.05, 56, 7.0],
  [334, 0.78, -0.2, 24, 1.75],
  [440, 1.2, -0.02, 24, 1.9],
  [490, 1.32, 0.03, 24, 6.85],
  [548, 1.72, 0.04, 24, 6.9],
  [600, 1.8, 0.04, 24, 10.7],
  [670, 2.3, 0.03, 24, 10.9],
  [694, 2.38, 0.03, 16, 14.6],
  [724, 2.5, 0.02, 12, 16.2],
  [760, 2.6, 0.02, 11, 16.3],
];
export const camAt = (f: number): Cam => ({ az: track(f, ks(CAMK, 1)), el: track(f, ks(CAMK, 2)), d: track(f, ks(CAMK, 3)), ty: track(f, ks(CAMK, 4)), fov: 30 });

/* world layout of the exploded stack (model units; y offsets applied per stage group) */
const GAP = 1.15;
export const SC: Record<string, number> = { sic: 2.3, sii: 6.3, sivb: 8.9, cap: 11.93 }; // stage centres in the assembled stack
const win = (f: number, a: number, b: number, fi = 14, fo = 14) => io(f, [a, a + fi], [0, 1], easeInOut) * (1 - io(f, [b - fo, b], [0, 1], easeInOut));

const poseAt = (f: number): { pose: Pose; off: Record<string, number> } => {
  const E = io(f, [CUE.split, CUE.split + 30], [0, 1], easeInOut);
  const D1 = io(f, [CUE.drop1 - 2, CUE.drop1 + 42], [0, 1], easeIn) * 8;
  const D2 = io(f, [CUE.drop2 - 2, CUE.drop2 + 42], [0, 1], easeIn) * 8;
  const D3 = io(f, [CUE.fade - 2, CUE.fade + 40], [0, 1], easeIn) * 8;
  const g1 = io(f, [CUE.drop1 + 8, CUE.drop1 + 34], [0, 1]), g2 = io(f, [CUE.drop2 + 8, CUE.drop2 + 34], [0, 1]), g3 = io(f, [CUE.fade + 4, CUE.fade + 30], [0, 1]);
  const off = { sic: -D1, sii: GAP * E - D2, sivb: 2 * GAP * E - D3, sla: 3 * GAP * E - D3, cap: 4 * GAP * E };
  // who is lit (stage colour-coding) and who is dimmed
  const act = {
    sic: win(f, CUE.eng0 - 6, CUE.drop1 + 14, 22, 18),
    sii: win(f, T.sii + 4, CUE.drop2 + 14, 22, 18),
    sivb: win(f, T.sivb + 4, CUE.fade + 6, 22, 18),
    cap: win(f, T.cap + 4, 900, 22, 1),
  };
  const focus = Math.max(act.sic, act.sii, act.sivb, act.cap);
  const dimOf = (a: number) => (focus > 0 ? clamp01(focus * (1 - a)) : 0);
  const pulse = (a: number, p = 0.34) => 0.65 + 0.35 * Math.sin(f * p + a);
  const burn = {
    sic: io(f, [CUE.eng0 + 4, CUE.eng0 + 24], [0.25, 1]) * (1 - io(f, [CUE.drop1 - 8, CUE.drop1 + 6], [0, 1])),
    sii: io(f, [CUE.sii, CUE.sii + 16], [0.25, 1]) * (1 - io(f, [CUE.drop2 - 8, CUE.drop2 + 6], [0, 1])),
    sivb: Math.max(0.25, win(f, CUE.b1, CUE.coast, 8, 8), win(f, CUE.b2, CUE.fade - 8, 8, 8)),
    cap: 0.9,
  };
  const g = (s: keyof typeof act) => act[s] * burn[s] * pulse(s.length);
  const pose: Pose = {
    ex: { sic: off.sic, eng: off.sic, sii: off.sii, sivb: off.sivb, iu: off.sivb, sla: off.sla, cap: off.cap },
    glow: { sic: g("sic"), eng: g("sic"), sii: g("sii"), sivb: g("sivb"), iu: g("sivb"), sla: g("sivb"), cap: g("cap") },
    ghost: { sic: g1, eng: g1, sii: g2, sivb: g3, iu: g3, sla: g3 },
    dim: { sic: dimOf(act.sic), eng: dimOf(act.sic), sii: dimOf(act.sii), sivb: dimOf(act.sivb), iu: dimOf(act.sivb), sla: dimOf(act.sivb), cap: dimOf(act.cap) },
  };
  // one stage-coloured light follows the active stage (its side facing the camera)
  const cands: [keyof typeof act, Stage][] = [["sic", "sic"], ["sii", "sii"], ["sivb", "sivb"], ["cap", "cap"]];
  let best = cands[0]; for (const c of cands) if (act[c[0]] > act[best[0]]) best = c;
  const cam = camAt(f);
  const k = best[0] === "sic" ? "sic" : best[0] === "sii" ? "sii" : best[0] === "sivb" ? "sivb" : "cap";
  const cy = SC[k] + (off as any)[k];
  const toCam = [Math.sin(cam.az), Math.cos(cam.az)];
  pose.spot = { pos: [toCam[0] * 2.4 + toCam[1] * 1.6, cy + 0.6, toCam[1] * 2.4 - toCam[0] * 1.6], color: LOOK[best[1]].accent, i: act[best[0]] * (k === "cap" ? 5 : 9) };
  return { pose, off: { ...off, sii0: off.sii, eng: off.sic } };
};

/* ───────────── projection: where a 3D point lands on the 1080×1920 canvas ───────────── */
const PC = new THREE.PerspectiveCamera(30, W / H, 0.5, 120);
export const project = (c: Cam, p: [number, number, number]) => {
  const cy = Math.cos(c.el), sy = Math.sin(c.el);
  PC.position.set(Math.sin(c.az) * cy * c.d, c.ty + sy * c.d, Math.cos(c.az) * cy * c.d);
  PC.up.set(0, 1, 0); PC.lookAt(0, c.ty, 0); PC.fov = c.fov ?? 30; PC.updateProjectionMatrix(); PC.updateMatrixWorld(true);
  const v = new THREE.Vector3(...p).project(PC);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};
const right = (c: Cam, r: number): [number, number] => [Math.cos(c.az) * r, -Math.sin(c.az) * r];

/* ───────────── small 2D pieces ───────────── */
const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 24} letterSpacing={(o.size ?? 24) * 0.08} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);
const Panel: React.FC<{ o: number; a: string; b: React.ReactNode; c?: string; col?: string }> = ({ o, a, b, c, col = AM }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1412, height: 138, opacity: o, borderRadius: 12, border: `2px solid ${col}66`, background: "rgba(3,11,24,0.82)", boxSizing: "border-box", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4 }}>
    <div style={{ fontFamily: K.mono, fontSize: 27, letterSpacing: 4, color: col, fontWeight: 700, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: K.head, fontSize: 43, fontWeight: 700, color: K.text, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b}</div>
    {c && <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 1.5, color: K.muted, whiteSpace: "nowrap", fontWeight: 500 }}>{c}</div>}
  </div>
);
const Em: React.FC<{ children: React.ReactNode; col?: string }> = ({ children, col = AM }) => <span style={{ color: col }}>{children}</span>;
const Pill: React.FC<{ x: number; y: number; text: string; o?: number; color?: string; size?: number; solid?: boolean }> = ({ x, y, text, o = 1, color = AM, size = 30, solid }) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.9;
  return (
    <g opacity={o} transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? color : "rgba(6,20,42,0.92)"} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={size * 0.35} fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={solid ? K.bgDeep : color}>{text}</text>
    </g>
  );
};
const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ───────────── the whole shot: 3D + overlays ───────────── */
export const SaturnShot: React.FC<{ still?: number }> = ({ still }) => {
  const fr = useCurrentFrame();
  const g = still ?? fr;
  const cam = camAt(g);
  const { pose, off } = poseAt(g);
  const fade = io(g, [T.end - 6, T.end + 2], [0, 1]);
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  const P = (x: number, y: number, z: number) => project(cam, [x, y, z]);

  /* hook: giant title behind the rocket */
  const tIn = io(g, [2, 26], [0, 1], easeOut), tOut = io(g, [T.size - 22, T.size - 4], [0, 1], easeInOut);

  /* size: dimension line right of the rocket, base → tip */
  const sz = io(g, [T.size + 12, T.size + 62], [0, 1], easeInOut);
  const r1 = right(cam, 1.15);
  const bot = P(r1[0], -0.14, r1[1]), top = P(r1[0], lerp(-0.14, 12.846, sz), r1[1]);
  const dimO = io(g, [T.size + 10, T.size + 18], [0, 1]) * (1 - io(g, [T.stages - 14, T.stages - 2], [0, 1]));
  const meters = Math.round(111 * sz);
  /* fuel blocks (9 of 10 amber) on the left */
  const blocks = Array.from({ length: 10 }, (_, i) => i);
  const fuelO = io(g, [CUE.fuel0 - 4, CUE.fuel0 + 4], [0, 1]) * (1 - io(g, [T.stages - 14, T.stages - 2], [0, 1]));

  /* stages: numbered pills right of each stage */
  const pillO = io(g, [CUE.pills, CUE.pills + 10], [0, 1]) * (1 - io(g, [T.sic + 30, T.sic + 44], [0, 1]));
  const stageTags: { k: string; n: string; t: string; c: string; y: number; at: number }[] = [
    { k: "sic", n: "1", t: "S-IC", c: LOOK.sic.accent, y: SC.sic + off.sic, at: 0 },
    { k: "sii", n: "2", t: "S-II", c: LOOK.sii.accent, y: SC.sii + off.sii, at: 8 },
    { k: "sivb", n: "3", t: "S-IVB", c: LOOK.sivb.accent, y: SC.sivb + off.sivb, at: 16 },
  ];

  /* S-IC engines: 5 numbered markers on the real F-1 bells */
  const engO = io(g, [CUE.eng0 - 6, CUE.eng0 + 2], [0, 1]) * (1 - io(g, [CUE.burn - 20, CUE.burn - 8], [0, 1]));
  const sic = io(g, [CUE.burn, CUE.drop1 - 10], [0, 1], (t) => t);
  const sii = io(g, [CUE.burn2, CUE.drop2 - 10], [0, 1], (t) => t);

  /* S-IVB timeline */
  const tlO = io(g, [CUE.b1 - 8, CUE.b1 - 1], [0, 1]) * (1 - io(g, [CUE.fade - 6, CUE.fade + 2], [0, 1]));
  const b1 = io(g, [CUE.b1, CUE.coast], [0, 1], (t) => t), b2 = io(g, [CUE.b2, CUE.fade - 12], [0, 1], (t) => t);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      {/* poster title sits BEHIND the rocket */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", opacity: tIn * (1 - tOut), transform: `translateY(${(1 - tIn) * 40}px) scale(${1 + g * 0.0006})` }}>
        <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 250, lineHeight: 0.92, letterSpacing: -10, color: K.text }}>SATURN</div>
        <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 640, lineHeight: 0.8, color: AM, marginTop: 10, letterSpacing: -20 }}>V</div>
      </div>

      <Rocket3D w={W} h={H} cam={cam} pose={pose} />

      {/* legibility scrims */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 640, background: "linear-gradient(180deg, rgba(3,11,24,0.78) 0%, rgba(3,11,24,0.55) 55%, rgba(3,11,24,0) 100%)", opacity: io(g, [T.size - 14, T.size + 2], [0, 1]) }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 700, background: "linear-gradient(0deg, rgba(3,11,24,0.82) 0%, rgba(3,11,24,0.55) 60%, rgba(3,11,24,0) 100%)" }} />

      <Headline f={g} lines={["*111 m* tall", "9/10 is *fuel*"]} at={T.size + 3} exitAt={T.stages - 10} size={100} top={330} />
      <Headline f={g} lines={["Built in", "three *stages*"]} at={T.stages + 3} exitAt={T.sic - 8} size={100} top={330} />
      <Headline f={g} lines={["Stage 1:", "*five* giant engines"]} at={T.sic + 3} exitAt={T.sii - 8} size={92} top={330} />
      <Headline f={g} lines={["Stage 2:", "almost to *orbit*"]} at={T.sii + 3} exitAt={T.sivb - 8} size={96} top={330} />
      <Headline f={g} lines={["Stage 3:", "orbit, then the *Moon*"]} at={T.sivb + 3} exitAt={T.cap - 8} size={92} top={330} />
      <Headline f={g} lines={["Only the *capsule*", "came home"]} at={T.cap + 3} exitAt={T.end - 8} size={96} top={330} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* size: dimension line */}
        <g opacity={dimO}>
          <line x1={bot.x} y1={bot.y} x2={top.x} y2={top.y} stroke={AM} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${AM})` }} />
          <line x1={bot.x - 22} y1={bot.y} x2={bot.x + 22} y2={bot.y} stroke={AM} strokeWidth={4} />
          <line x1={top.x - 22} y1={top.y} x2={top.x + 22} y2={top.y} stroke={AM} strokeWidth={4} />
          <g transform={`translate(${Math.min(W - 150, bot.x + 70)} ${(bot.y + top.y) / 2})`}>
            <rect x={-96} y={-52} width={192} height={104} rx={14} fill="rgba(3,11,24,0.88)" stroke={AM} strokeWidth={3} />
            <text textAnchor="middle" y={14} fontFamily={K.mono} fontWeight={700} fontSize={64} fill={K.text} style={{ fontVariantNumeric: "tabular-nums" }}>{meters}</text>
            <text textAnchor="middle" y={46} fontFamily={K.mono} fontWeight={700} fontSize={24} letterSpacing={4} fill={AM}>METERS</text>
          </g>
        </g>
        {/* size: fuel column — 9 of 10 blocks are fuel (Apollo 4 press kit: ≈ 89.7 % of 6,220,025 lb) */}
        <g opacity={fuelO}>
          {blocks.map((i) => {
            const pop = ioB(g, CUE.fuel0 + i * 3, CUE.fuel0 + i * 3 + 10);
            const isFuel = i < 9;
            const y = 1270 - i * 58;
            return (
              <g key={i} opacity={clamp01(pop)} transform={`translate(${90 + (1 - pop) * -50} ${y})`}>
                <rect width={120} height={46} rx={6} fill={isFuel ? AM : "rgba(143,179,209,0.25)"} stroke={isFuel ? "#fff" : K.muted} strokeWidth={2} opacity={isFuel ? 0.95 : 1} />
              </g>
            );
          })}
          <g opacity={io(g, [CUE.fuel0 + 32, CUE.fuel0 + 40], [0, 1])}>
            {T_(100, 1334, "FUEL  9 / 10", { size: 26, c: AM, w: 700 })}
            {T_(100, 1366, "≈ 90 % OF WEIGHT", { size: 20, c: K.muted })}
            {T_(228, 1270 - 9 * 58 + 33, "EVERYTHING ELSE", { size: 18, c: K.muted })}
          </g>
        </g>
        {/* stages: 1·2·3 pills */}
        {stageTags.map((s) => {
          const c0 = P(0, s.y, 0), rr = right(cam, 1.0), c1 = P(rr[0], s.y, rr[1]);
          const o = pillO * clamp01((g - CUE.pills - s.at) / 8);
          return (
            <g key={s.k} opacity={o}>
              <line x1={c1.x} y1={c1.y} x2={Math.max(c1.x + 40, 780)} y2={c1.y} stroke={s.c} strokeWidth={3} strokeDasharray="8 8" />
              <circle cx={c1.x} cy={c1.y} r={7} fill={s.c} />
              <Pill x={Math.max(c1.x + 40, 780) + 118} y={c1.y} text={`${s.n} · ${s.t}`} color={s.c} size={32} />
              <g opacity={0} />{c0.x < 0 ? null : null}
            </g>
          );
        })}
        {/* S-IC: five numbered F-1 engines */}
        <g opacity={engO}>
          {F1_XZ.map(([ex, ez], i) => {
            const p = P(ex, 0.1 + off.sic, ez);
            const o = clamp01((g - CUE.eng0 - i * 5) / 6);
            return (
              <g key={i} opacity={o} transform={`translate(${p.x} ${p.y + 6}) scale(${0.6 + 0.4 * ioB(g, CUE.eng0 + i * 5, CUE.eng0 + i * 5 + 10)})`}>
                <circle r={26} fill="rgba(3,11,24,0.82)" stroke={AM} strokeWidth={3.5} style={{ filter: `drop-shadow(0 0 8px ${AM})` }} />
                <text textAnchor="middle" y={11} fontFamily={K.mono} fontWeight={700} fontSize={32} fill={AM}>{i + 1}</text>
              </g>
            );
          })}
        </g>
      </svg>

      <Meter x={80} y={1300} w={920} v={sic} label="S-IC  BURN TIME" value="ABOUT 2.5 MIN" color={AM} o={io(g, [CUE.burn - 8, CUE.burn], [0, 1]) * (1 - io(g, [CUE.drop1 + 8, CUE.drop1 + 18], [0, 1]))} />
      <Meter x={80} y={1300} w={920} v={sii} label="S-II  BURN TIME" value="ABOUT 6 MIN" color={LOOK.sii.accent} o={io(g, [CUE.burn2 - 8, CUE.burn2], [0, 1]) * (1 - io(g, [CUE.drop2 + 8, CUE.drop2 + 18], [0, 1]))} />
      {/* S-IVB: burn 1 → coast → burn 2 */}
      <div style={{ position: "absolute", left: 80, width: 920, top: 1290, opacity: tlO }}>
        <div style={{ display: "flex", fontFamily: K.mono, fontSize: 24, letterSpacing: 3, fontWeight: 700, marginBottom: 12 }}>
          <span style={{ width: 380, color: LOOK.sivb.accent }}>BURN 1 · TO ORBIT</span>
          <span style={{ width: 160, color: K.muted, textAlign: "center" }}>COAST</span>
          <span style={{ width: 380, color: LOOK.sivb.accent, textAlign: "right" }}>BURN 2 · TO THE MOON</span>
        </div>
        <div style={{ display: "flex", gap: 10, height: 30 }}>
          {[b1, 1, b2].map((v, i) => (
            <div key={i} style={{ width: i === 1 ? 140 : 380, border: `2px solid ${i === 1 ? K.lineDim : LOOK.sivb.accent}`, borderRadius: 4, padding: 3, background: "rgba(3,11,24,0.6)", boxSizing: "border-box" }}>
              {i !== 1 && <div style={{ width: `${clamp01(v) * 100}%`, height: "100%", background: `repeating-linear-gradient(90deg, ${LOOK.sivb.accent} 0 14px, transparent 14px 18px)`, boxShadow: `0 0 16px ${LOOK.sivb.accent}88` }} />}
            </div>
          ))}
        </div>
      </div>

      <Panel o={pn(-10, T.size + 2)} a="APOLLO PROGRAM · NASA" b={<>The rocket that took people to the <Em>Moon</Em></>} c="Saturn V · three stages + the Apollo spacecraft" />
      <Panel o={pn(T.size, CUE.fuel0 + 40 - 12)} a="HEIGHT · FULL STACK" b={<>About <Em>111 meters</Em> tall</>} c="110.6 m with the spacecraft and escape tower" />
      <Panel o={pn(CUE.fuel0 + 24, T.stages + 2)} a="LIFTOFF WEIGHT · NASA FIGURES" b={<>Nine tenths is <Em>fuel</Em></>} c="6,220,025 lb at liftoff · ≈ 89.7 % propellant" />
      <Panel o={pn(T.stages, T.sic + 2)} a="BUILT IN THREE STAGES" b={<><Em col={LOOK.sic.accent}>S-IC</Em> · <Em col={LOOK.sii.accent}>S-II</Em> · <Em col={LOOK.sivb.accent}>S-IVB</Em></>} c="Stacked on top of each other, then the spacecraft" />
      <Panel o={pn(T.sic, T.sii + 2)} col={LOOK.sic.accent} a="STAGE 1 · S-IC" b={<>5 F-1 engines · drops away after <Em>~2.5 min</Em></>} c="The biggest, bottom stage of the stack" />
      <Panel o={pn(T.sii, T.sivb + 2)} col={LOOK.sii.accent} a="STAGE 2 · S-II" b={<>5 J-2 engines · burns <Em col={LOOK.sii.accent}>~6 min</Em></>} c="Takes over and carries it almost to orbit" />
      <Panel o={pn(T.sivb, T.cap + 2)} col={LOOK.sivb.accent} a="STAGE 3 · S-IVB" b={<>1 J-2 engine · <Em col={LOOK.sivb.accent}>fires twice</Em></>} c="Restartable: second burn = trans-lunar injection" />
      <Panel o={pn(T.cap, T.end + 2)} col={LOOK.cap.accent} a="APOLLO SPACECRAFT" b={<>Only the <Em col={LOOK.cap.accent}>command module</Em> came home</>} c="Everything else was discarded on the way" />

      <div style={{ position: "absolute", left: 0, right: 0, top: 1584, textAlign: "center", fontFamily: K.mono, fontSize: 22, letterSpacing: 4, color: K.muted, opacity: io(g, [20, 36], [0, 1]) }}>EXTERIOR MODEL — NASA 3D RESOURCES</div>
    </div>
  );
};

/* ────────── end card (same layout as the other episodes) ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const m_ = 18, cd = (m_ * 23) / 2, cx = 540 - cd * 0.17, cy = 1085 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={f} lines={["Follow for", "*more*"]} at={2} top={380} size={118} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1020px", opacity: clamp01(p) }}>
        <Gear N={14} m={m_} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
        <Gear N={9} m={m_} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
        <Gear N={9} m={m_} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
      </div>
      <Tag f={f} at={8} text="FOLLOW  +" x={540} y={1330} color={AM} solid size={32} />
      <Label f={f} at={64} text="AKS PRODUCTIONS" x={540} y={1410} size={30} align="center" color={K.text} />
      <Label f={f} at={78} text="ROCKETS · @DEAD.SIMPLE.ENGINEERING" x={540} y={1466} size={20} align="center" color={K.muted} />
      <Label f={f} at={92} text="3D MODEL: NASA · SIMPLIFIED EXTERIOR VIEW" x={540} y={1514} size={18} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => {
  const cam: Cam = { az: 0.62, el: -0.16, d: 27, ty: 6.0, fov: 30 };
  const pose: Pose = { ex: {}, glow: {}, ghost: {}, spot: { pos: [2.2, 1.2, 2.6], color: AM, i: 6 } };
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 250, lineHeight: 0.92, letterSpacing: -10, color: K.text }}>SATURN</div>
        <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 640, lineHeight: 0.8, color: AM, marginTop: 10, letterSpacing: -20 }}>V</div>
      </div>
      <Rocket3D w={W} h={H} cam={cam} pose={pose} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 560, background: "linear-gradient(0deg, rgba(3,11,24,0.9) 0%, rgba(3,11,24,0.6) 60%, rgba(3,11,24,0) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1400, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>ROCKETS · 01</div>
        <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 84, lineHeight: 1.02, letterSpacing: -3, color: K.text }}>Inside the Saturn V</div>
        <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 76, color: AM }}>3 stages</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1700, textAlign: "center", fontFamily: K.mono, fontSize: 20, letterSpacing: 4, color: K.muted }}>EXTERIOR MODEL — NASA 3D RESOURCES</div>
    </>
  );
};
void easeIn;
