import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { W, H, FPS, clamp, ramp, kf, easeOut, envAt, hash, backOut, lerp } from "../../studio/util";
import { Person, KIMU, DAD, MOM, UNCLE, Pose } from "../../studio/Person";
import { LaptopBack, Bird, TeaCup, Note, ToolBag, Spark } from "../../studio/props";
import { RoomBack, RoomChair, RoomDesk, RoomDark, HallLight, TerraceBack, StreetBack, MeterBoard, BIRD_X, birdWireY } from "../../studio/sets";
import { PanelA, PanelB, PanelC, PanelD, Tag } from "../../studio/info";
import { Vignette } from "../../studio/decor";
import tl from "../../../public/studio/s1e01/timeline.json";
import packet from "../../studio/s1e01/packet.json";

const FONT_CSS = `
@font-face{font-family:'Fredoka';font-weight:500;src:url(${staticFile("studio/fonts/fredoka-latin-500-normal.woff2")}) format('woff2');}
@font-face{font-family:'Fredoka';font-weight:600;src:url(${staticFile("studio/fonts/fredoka-latin-600-normal.woff2")}) format('woff2');}
@font-face{font-family:'Nunito';font-weight:400;src:url(${staticFile("studio/fonts/nunito-latin-400-normal.woff2")}) format('woff2');}
@font-face{font-family:'Nunito';font-weight:700;src:url(${staticFile("studio/fonts/nunito-latin-700-normal.woff2")}) format('woff2');}
`;

export const TOTAL = packet.duration_s * FPS;

/* ---------------- timeline + voice lines (written by scripts/studio/build_s1e01_audio.py) ---------------- */
type Line = { id: string; char: string; emo: string; text: string; t: number; end: number; dur: number; env: [number, number][] };
const LINES = tl.lines as unknown as Line[];
const L = (id: string) => LINES.find((l) => l.id === id)!;
const talk = (id: string, t: number) => envAt(L(id).env, t);
const SHOT = Object.fromEntries(tl.shots.map((s) => [s.id, s])) as Record<string, { t0: number; t1: number; src0: number; k: number }>;
/** real time -> the scene's own (source) time, so S2-S4 keep their original choreography at a new pace */
const local = (id: string, t: number) => SHOT[id].src0 + (t - SHOT[id].t0) * SHOT[id].k;

/* ---------------- shared helpers ---------------- */
type Cam = { cx: number; cy: number; z: number };
const camAt = (t: number, k: [number, number, number, number][]): Cam => ({
  cx: kf(t, k.map(([tt, cx]) => [tt, cx] as [number, number])),
  cy: kf(t, k.map(([tt, , cy]) => [tt, cy] as [number, number])),
  z: kf(t, k.map(([tt, , , z]) => [tt, z] as [number, number])),
});
const CamG: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <g transform={`translate(${W / 2} ${H / 2}) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>{children}</g>
);
const blinkAt = (t: number, seed = 0) => ((t + seed) % 3.6) < 0.12;
const sec = (t: number, a: number, b: number, first = false, last = false) =>
  (first ? 1 : clamp((t - a) / 0.35)) * (last ? 1 : clamp((b - t) / 0.35));
const pulse = (t: number, t0: number, d = 0.35) => (t < t0 ? 0 : Math.exp(-(t - t0) / d));
const win = (t: number, a: number, b: number, f = 0.25) => clamp((t - a) / f) * clamp((b - t) / f);
/** Front-view walk with knee lift. f is the step frequency in the scene's own time. */
const walk = (t: number, f = 2.0, amp = 20) => {
  const ph = t * Math.PI * 2 * f;
  const s = Math.sin(ph), c = Math.cos(ph);
  // Legs are mirrored copies, so equal angles open/close symmetrically: alternate wide and narrow (a step), lifting each knee in turn.
  return { legL: 12 + s * amp * 0.55, legR: 12 - s * amp * 0.55, kneeL: Math.max(0, c) * amp * 1.9, kneeR: Math.max(0, -c) * amp * 1.9, armL: 5 + s * 6, armR: 5 - s * 6, bob: -Math.abs(c) * 7 };
};

/* ====================================================================== */
/*  S1  Kimu's room: the power cut, Dad at the door                        */
/* ====================================================================== */
const RoomScene: React.FC<{ t: number }> = ({ t }) => {
  const k0 = L("k0"), d1 = L("d1"), k1 = L("k1"), d2 = L("d2"), d3 = L("d3"), m1 = L("m1"), d4 = L("d4"), k2 = L("k2");
  const cam = camAt(t, [
    [0, 760, 1100, 1.38], [2.5, 760, 1100, 1.38],
    [d1.t - 0.5, 640, 1080, 1.05], [d1.t + 0.9, 620, 1070, 1.1],
    [k1.t - 0.1, 780, 1060, 1.6], [k1.t + 1.8, 790, 1050, 1.7],
    [d2.t - 0.25, 560, 1240, 1.5], [d2.t + 1.2, 600, 1230, 1.4],
    [d3.t - 0.1, 400, 1040, 1.85], [d3.t + 1.35, 410, 1040, 1.9],
    [d3.t + 1.55, 790, 1070, 1.95], [m1.t - 0.1, 790, 1070, 1.9],
    [m1.t + 0.1, 430, 1070, 1.3], [d4.t - 0.1, 400, 1050, 1.75], [d4.t + 1.9, 410, 1050, 1.8],
    [k2.t - 0.05, 790, 1060, 1.7], [k2.t + 1.5, 790, 1060, 1.75], [k2.t + 1.9, 620, 1100, 1.15], [19, 620, 1100, 1.1],
  ]);

  /* ---------- signals ---------- */
  const typing = t < 0.8;
  const cut = ramp(t, 0.8, 1.0);
  const closeT = d1.t + 0.75;
  const lidOpen = 1 - ramp(t, closeT, closeT + 0.3);
  const screenOn = lidOpen;
  const fear = ramp(t, d1.t - 0.55, d1.t + 0.3) * (1 - ramp(t, d4.t - 0.2, d4.t + 0.8) * 0.85);
  const cornered = ramp(t, d2.t, d2.t + 0.4) * (1 - ramp(t, m1.t, m1.t + 0.5));
  const sad = ramp(t, m1.t, m1.t + 0.7) * (1 - ramp(t, k2.t + 1.4, k2.t + 2.1));
  const resolve = ramp(t, k2.t + 1.4, k2.t + 2.1);
  const flinch = pulse(t, d3.t + 0.75) + pulse(t, d3.t + 1.55) + pulse(t, d3.t + 2.4);
  const kTalkEnv = Math.max(talk("k0", t), talk("k1", t), talk("k2", t));
  const kTalking = kTalkEnv > 0.05;
  const pre = ramp(t, k0.t - 0.3, k0.t) * (1 - ramp(t, d1.t - 0.9, d1.t - 0.6));

  /* ---------- Kimu at the desk ---------- */
  const rest = (a: number, b: number) => lerp(a, b, cut);
  const kPose: Pose = {
    armL: typing ? -10 + 3 * Math.sin(t * 9) : kf(t, [[0.8, -10], [d1.t + 0.1, -6], [d1.t + 0.7, 36], [d1.t + 1.2, 24], [d3.t, 16], [d4.t, 8], [k2.t + 1.2, 8]]) + 1.5 * Math.sin(t * 17) * fear,
    foreL: typing ? 72 + 8 * Math.sin(t * 11) : kf(t, [[0.8, 72], [d1.t + 0.7, 40], [d1.t + 1.2, 96], [d3.t, 84], [d4.t, 80], [k2.t + 1.2, 70]]),
    armR: typing ? -10 + 3 * Math.sin(t * 8 + 1) : kf(t, [[0.8, -10], [d1.t + 0.1, -6], [d1.t + 0.7, 34], [d1.t + 1.2, 22], [d3.t, 16], [d4.t, 8], [k2.t + 1.2, 8]]) + 1.5 * Math.sin(t * 19) * fear,
    foreR: typing ? 72 + 8 * Math.sin(t * 10) : kf(t, [[0.8, 72], [d1.t + 0.7, 44], [d1.t + 1.2, 100], [d3.t, 88], [d4.t, 80], [k2.t + 1.2, 70]]),
    handL: cornered > 0.4 ? "fist" : "open", handR: cornered > 0.4 ? "fist" : "open",
    headRot: kf(t, [[0, -3], [0.8, 0], [1.0, -5], [d1.t, -6], [d3.t, 3], [d4.t, 6], [k2.t, 9], [k2.t + 1.5, 6], [k2.t + 2.2, -2]]) + 2 * Math.sin(t * 3) * fear - 3 * flinch,
    headDy: 6 * sad - 8 * flinch,
    lean: -5 * fear - 3 * cornered - 2 * flinch + 2 * resolve,
    lookX: typing ? 0.2 : t < d1.t - 0.6 ? 0.2 : t < d1.t + 0.5 ? -1 : t < k1.t ? -0.9
      : t < d2.t ? Math.sin(t * 7) * 0.8 : t < d2.t + 0.7 ? -1 : t < d3.t ? -0.6 : t < m1.t ? -0.5 + 0.2 * Math.sin(t * 9)
      : t < d4.t ? -0.9 : t < k2.t ? -0.7 : t < k2.t + 1.2 ? -0.3 : -1 * (1 - ramp(t, k2.t + 1.8, k2.t + 2.4)) + 0.2,
    lookY: typing ? 0.7 : cornered > 0.3 ? 0.35 + 0.2 * Math.sin(t * 5) : sad > 0.5 ? 0.8 : 0.1,
    eyes: typing ? "open" : fear > 0.35 && sad < 0.3 ? "wide" : sad > 0.6 && kTalking ? "down" : "open",
    pupil: lerp(1, 0.45, fear) + 0.25 * sad * (1 - fear) + 0.2 * resolve,
    brow: 0.25 + 0.7 * fear + 0.4 * pre - 0.2 * resolve,
    browTilt: 0.55 * pre + 0.85 * fear + 0.5 * sad - 0.35 * resolve,
    lid: 0.3 * sad + 0.18 * resolve,
    lidTilt: 0.8 * sad - 0.55 * resolve,
    mouth: kTalking ? "open" : fear > 0.3 ? (cornered > 0.3 ? "wavy" : "o") : resolve > 0.5 ? "smirk" : sad > 0.3 ? "sad" : pre > 0.3 ? "o" : "flat",
    open: kTalkEnv,
    sweat: clamp(0.35 * pre + ramp(t, d1.t - 0.2, d1.t + 0.5) * (1 - ramp(t, d4.t + 0.6, d4.t + 1.3))),
    pale: clamp(0.6 * fear + 0.4 * cornered),
    tear: clamp(ramp(t, d3.t + 1.7, d3.t + 2.5) * (1 - 0.8 * ramp(t, k2.t + 1.6, k2.t + 2.6))),
    shake: 1.2 * fear + 1.4 * flinch,
    blink: blinkAt(t) && fear < 0.5,
    bob: Math.sin(t * 1.7) * 1.5 - 14 * pulse(t, d1.t - 0.62, 0.22) - 7 * flinch,
  };

  /* ---------- Dad ---------- */
  const dadIn = ramp(t, d1.t - 0.95, d1.t - 0.72) * (1 - ramp(t, k2.t + 1.6, k2.t + 2.0));
  const dx = kf(t, [[d1.t - 0.95, 150], [d1.t - 0.1, 360], [k2.t + 0.35, 360], [k2.t + 1.9, 160]]);
  const walking = (t > d1.t - 0.95 && t < d1.t - 0.1) || (t > k2.t + 0.35 && t < k2.t + 1.9);
  const dW = walking ? walk(t, 1.8, 14) : {};
  const dTalkEnv = Math.max(talk("d1", t), talk("d2", t), talk("d3", t), talk("d4", t));
  const dTalking = dTalkEnv > 0.05;
  const angry = ramp(t, d2.t + 0.9, d3.t + 0.35) * (1 - ramp(t, m1.t - 0.1, m1.t + 0.7));
  const susp = ramp(t, d1.t - 0.3, d1.t + 0.3) * (1 - ramp(t, d3.t, d3.t + 0.3));
  const dSad = ramp(t, d4.t - 0.5, d4.t + 0.4) * (1 - ramp(t, k2.t + 0.6, k2.t + 1.3) * 0.5);
  const jab = (t: number) => pulse(t, d3.t + 0.75, 0.18) + pulse(t, d3.t + 1.55, 0.18) + pulse(t, d3.t + 2.4, 0.18);
  const inD3 = t > d3.t - 0.1 && t < d3.t + 2.9;
  const dPose: Pose = {
    ...dW,
    armR: 66 - 30 * dSad, foreR: 30 + 10 * dSad,
    armL: inD3 ? 118 - 70 * (jab(t) > 0.35 ? 1 : 0) - 10 * Math.sin(t * 11) : dTalking ? 30 + 18 * Math.sin(t * 6.5) : 4,
    foreL: inD3 ? 40 : dTalking ? 50 : 0,
    handL: inD3 ? (jab(t) > 0.35 ? "fist" : "point") : "open",
    lean: 4 * susp + 9 * angry - 5 * dSad,
    headRot: (dTalking ? 2.5 * Math.sin(t * 5) : 0) + (t > m1.t - 0.1 && t < m1.t + 1.4 ? -5 : 0) + 4 * Math.sin(t * 24) * angry * 0.4,
    headDy: 8 * dSad,
    lookX: t > m1.t - 0.1 && t < m1.t + 1.4 ? -1 : 1,
    lookY: dSad * 0.7 * (t < d4.t + 1.2 ? 1 : 0),
    eyes: dSad > 0.5 && !dTalking ? "down" : "open",
    lid: 0.42 * susp + 0.4 * angry + 0.3 * dSad,
    lidTilt: -0.3 * susp - 1.0 * angry + 0.9 * dSad,
    brow: 0.55 * ramp(t, d2.t - 0.1, d2.t + 0.4) * (1 - angry) + 0.2 * dSad - 0.3 * angry,
    browTilt: -0.3 * susp - 1.0 * angry + 0.9 * dSad,
    mouth: angry > 0.4 ? (dTalkEnv > 0.25 ? "shout" : "grit") : dSad > 0.4 ? (dTalking ? "open" : "frown") : dTalking ? "open" : susp > 0.4 ? "frown" : "flat",
    open: dTalkEnv * (angry > 0.4 ? 1 : 0.8),
    vein: angry * ramp(t, d3.t, d3.t + 0.4),
    shake: 1.8 * angry,
    tear: dSad * 0.7 * ramp(t, d4.t + 0.8, d4.t + 1.6),
    blink: blinkAt(t, 1.3) && angry < 0.3,
    bob: (walking ? (dW as any).bob : 0) + 5 * dSad - 4 * jab(t),
  };

  /* ---------- Mom ---------- */
  const momIn = ramp(t, m1.t - 0.85, m1.t - 0.55) * (1 - ramp(t, k2.t + 1.7, k2.t + 2.0));
  const mx = kf(t, [[m1.t - 0.85, 50], [m1.t - 0.1, 150], [k2.t + 0.45, 150], [k2.t + 2.0, 40]]);
  const mWalk = (t > m1.t - 0.85 && t < m1.t - 0.1) || (t > k2.t + 0.45 && t < k2.t + 2.0);
  const mW = mWalk ? walk(t, 1.7, 12) : {};
  const mTalkEnv = talk("m1", t);
  const mPose: Pose = {
    ...mW,
    armL: 28, foreL: 108, armR: 28, foreR: 108, handL: "fist", handR: "open",
    mouth: mTalkEnv > 0.05 ? "open" : "sad", open: mTalkEnv,
    brow: 0.6, browTilt: 0.95, lid: 0.15, lidTilt: 0.5, eyes: "open", lookX: 1, lookY: 0.1,
    headRot: -4, tear: 0.5 * ramp(t, d4.t, d4.t + 1), blink: blinkAt(t, 0.6),
    bob: mWalk ? (mW as any).bob : 0,
  };

  const hallA = ramp(t, d1.t - 0.95, d1.t - 0.65) * (1 - ramp(t, k2.t + 1.8, k2.t + 2.3));
  const torchAngle = kf(t, [[d1.t - 0.9, -3], [d2.t - 0.3, -3], [d2.t + 0.1, 17], [d3.t - 0.2, 17], [d3.t + 0.2, -20], [m1.t, -20], [d4.t, 24], [d4.t + 1, 30]]) + 2.5 * Math.sin(t * 31) * angry;
  const torchI = dadIn * (t < d4.t ? 0.9 : 0.9 - 0.45 * ramp(t, d4.t, d4.t + 0.8)) * (1 - ramp(t, k2.t + 0.9, k2.t + 1.3));
  const torch: [number, number, number, number] = [dx + 195, 1235 + 4 * dSad * 0, torchAngle, torchI];

  return (
    <CamG cam={cam}>
      <RoomBack t={t} />
      <HallLight a={hallA} t={t} />
      <Person spec={MOM} x={mx} y={1560} scale={0.95} pose={mPose} opacity={momIn} />
      <Person spec={DAD} x={dx} y={1560} scale={0.98} pose={dPose} opacity={dadIn} heldR={<g transform="translate(0 -6)"><rect x="-10" y="-26" width="22" height="42" rx="5" fill="#222" /><rect x="-7" y="-23" width="16" height="30" rx="3" fill="#FFF7D6" /></g>} />
      <RoomChair />
      <Person spec={KIMU} x={800} y={1618} scale={1.0} pose={kPose} hideLegs />
      <g transform="translate(800 1322)"><LaptopBack w={250} on={screenOn} open={lidOpen} /></g>
      <RoomDesk t={t} />
      <RoomDark t={t} screenOn={screenOn} glowAt={[800, 1130]} torch={torch} />
      {/* battery tag */}
      <g transform="translate(560 1090)" opacity={ramp(t, 0.9, 1.2) * (1 - ramp(t, d1.t - 0.9, d1.t - 0.6))}>
        <Tag text="3%" a={1} color="#FF6A5E" />
      </g>
    </CamG>
  );
};

/* ====================================================================== */
/*  S2  Terrace: the prayer (time is the scene's source time)              */
/* ====================================================================== */
const birdPos = (t: number) => {
  const by = birdWireY();
  if (t < 21.6) return null;
  if (t < 22.25) {
    const k = easeOut((t - 21.6) / 0.65);
    return { x: 1250 + (BIRD_X - 1250) * k, y: 380 + (by - 380) * k - Math.sin(k * Math.PI) * 120, flying: true };
  }
  return { x: BIRD_X, y: by, flying: false };
};
const BirdAt: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const p = birdPos(t);
  if (!p) return null;
  const idle = Math.sin(t * 2.1) * 0.5;
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <Bird s={s} wing={p.flying ? Math.sin(t * 40) : 0} tilt={p.flying ? -14 : idle * 2} headTurn={p.flying ? 0 : Math.sin(t * 1.1) * 0.8} beakOpen={!p.flying && t > 22.7 ? 0.5 + 0.5 * Math.sin(t * 9) * (t < 24 ? 1 : 0.2) : 0} />
    </g>
  );
};

const TERRACE_Y = 1760;
const TerraceScene: React.FC<{ t: number }> = ({ t }) => {
  const cam = camAt(t, [[12.6, 440, 1160, 1.0], [14.6, 440, 1180, 1.05], [15.2, 450, 1180, 1.15], [20.4, 450, 1180, 1.3], [21.4, 450, 1180, 1.3], [23.2, 520, 1010, 1.5]]);
  const x = kf(t, [[12.6, -170], [14.6, 430]], (u) => u);
  const walking = t < 14.6;
  const prayer = ramp(t, 15.1, 15.9) * (1 - ramp(t, 21.1, 21.5));
  const glow = ramp(t, 15.8, 17.2) * (1 - ramp(t, 21.3, 22.4));
  const wake = ramp(t, 21.2, 21.6);
  const w: any = walking ? walk(t, 1.42, 15) : {};
  const settle = ramp(t, 14.4, 15.1);
  const pose: Pose = {
    legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR,
    bob: walking ? w.bob : Math.sin(t * 1.4) * 2,
    armL: walking ? w.armL : 6 * prayer + 10 * (1 - prayer), foreL: 108 * prayer,
    armR: walking ? w.armR : 6 * prayer + 10 * (1 - prayer), foreR: 108 * prayer,
    eyes: prayer > 0.5 ? "closed" : "open", brow: prayer > 0.5 ? 0.4 : 0, browTilt: prayer * 0.7,
    lid: 0.2 * (1 - prayer), lidTilt: 0.5 * (1 - settle),
    mouth: wake > 0.5 ? "o" : prayer > 0.5 ? "smile" : "sad", open: 0.4,
    headRot: -4 * prayer, lookX: wake > 0.4 ? 1 : t < 15 ? 1 : 0, lookY: walking ? -0.2 : 0,
    tear: 0.7 * prayer * (1 - ramp(t, 20.6, 21.2)),
    glow, blink: blinkAt(t, 0.4),
  };
  if (wake > 0.4) { pose.headRot = -8; pose.eyes = "wide"; pose.pupil = 0.9; pose.brow = 0.8; pose.browTilt = 0.4; }
  return (
    <CamG cam={cam}>
      <TerraceBack t={t} />
      <BirdAt t={t} s={0.85} />
      <Person spec={KIMU} x={x} y={TERRACE_Y} scale={0.95} pose={pose} />
    </CamG>
  );
};

/* ====================================================================== */
/*  S3  The lesson: wire close-up + infographic                            */
/* ====================================================================== */
const PANELS: [string, number, number, React.FC<{ u: number }>][] = [
  ["A", 24.6, 29.8, PanelA], ["B", 29.8, 35.5, PanelB], ["C", 35.6, 41.0, PanelC], ["D", 41.0, 46.4, PanelD],
];
const TeachScene: React.FC<{ t: number }> = ({ t }) => {
  const z = kf(t, [[24.0, 1.4], [26.4, 2.5], [46.6, 2.9]]);
  const by = birdWireY();
  const cam: Cam = { cx: BIRD_X + 20, cy: by - 400 / z, z };
  const react = (() => {
    if (t < 27) return { eyes: "wide" as const, mouth: "o" as const, brow: 0.8, browTilt: 0.3, pupil: 0.9 };
    if (t < 35.5) return { eyes: "open" as const, mouth: "smile" as const, brow: 0.5, browTilt: 0 };
    if (t < 41) return { eyes: "open" as const, mouth: "grin" as const, brow: 0.7, browTilt: 0 };
    return { eyes: "wide" as const, mouth: "o" as const, brow: 0.6, browTilt: 0.9, pupil: 0.6 };
  })();
  const rx = ramp(t, 24.6, 25.2, backOut);
  return (
    <g>
      <CamG cam={cam}>
        <TerraceBack t={t} />
        <BirdAt t={t} s={0.85} />
      </CamG>
      <rect x="0" y="0" width={W} height="940" fill="#050A22" opacity="0.35" />
      {PANELS.map(([id, a, b, P]) => {
        const op = clamp((t - a) / 0.3) * clamp((b - t) / 0.3);
        if (op <= 0) return null;
        return <g key={id} transform="translate(90 150)" opacity={op}><P u={t - a} /></g>;
      })}
      <path d={`M540 910 L540 1180`} stroke="#7FE3FF" strokeWidth="4" strokeDasharray="10 12" opacity={0.7 * ramp(t, 25, 25.6)} />
      <g transform={`translate(200 1500) scale(${rx})`}>
        <clipPath id="reactClip"><circle r="140" /></clipPath>
        <circle r="148" fill="#fff" />
        <circle r="140" fill="#27406B" />
        <g clipPath="url(#reactClip)">
          <rect x="-150" y="-150" width="300" height="300" fill="#16224A" />
          <Person spec={KIMU} x={0} y={504} scale={0.9} hideLegs pose={{ ...react, blink: blinkAt(t, 0.4), headRot: Math.sin(t * 1.3) * 3, sweat: t > 42.5 ? 0.9 : 0 }} />
        </g>
        <circle r="140" fill="none" stroke="#7FE3FF" strokeWidth="6" />
      </g>
    </g>
  );
};

/* ====================================================================== */
/*  S4  Morning street                                                     */
/* ====================================================================== */
const StreetScene: React.FC<{ t: number }> = ({ t }) => {
  const lit = ramp(t, 54.6, 55.3);
  const FIX = 53.7;
  const fixed = ramp(t, FIX, FIX + 0.5);
  const cam = camAt(t, [
    [46.6, 640, 1000, 1.05], [48.6, 560, 1080, 1.1], [49.7, 520, 1140, 1.15], [50.9, 340, 1330, 2.2], [53.2, 340, 1340, 2.3], [54.3, 360, 1340, 2.0], [55.4, 440, 1150, 1.15],
    [56.3, 460, 1100, 1.15], [57.2, 880, 1000, 2.0], [58.4, 880, 1010, 2.0], [59.4, 540, 1000, 1.05],
  ]);
  const kx = kf(t, [[46.9, 830], [48.6, 520]], (u) => u);
  const moving = t > 46.9 && t < 48.6;
  const w: any = moving ? walk(t, 1.9, 13) : {};
  const point = ramp(t, 50.1, 50.6) * (1 - ramp(t, 53.0, 53.4));
  const work = ramp(t, 53.3, 53.7) * (1 - ramp(t, 54.5, 54.8));
  const grin = ramp(t, 55.0, 55.4);
  const noteK = ramp(t, 55.9, 56.5);
  const kPose: Pose = {
    legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR,
    armL: 120 * point + 50 * work + (-6 * grin) + 55 * noteK, foreL: 20 * point + 70 * work + 60 * noteK,
    armR: w.armR ?? 4, foreR: 8,
    eyes: "open", lookX: -1 * (t > 49 ? 1 : 0), brow: 0.2 + point * 0.4, browTilt: -0.3 * point - 0.2 * work,
    lid: 0.15 * work, mouth: grin > 0.5 ? "grin" : work > 0.5 ? "grit" : "smile", headRot: -6 * point,
    blink: blinkAt(t, 0.9), bob: w.bob ?? Math.sin(t * 1.6) * 1.5,
  };
  const uTalk = talkLocal(t);
  const relieved = ramp(t, 54.8, 55.3);
  const uPose: Pose = {
    armR: 150 * (1 - relieved) * ramp(t, 47.3, 47.8) + 60 * ramp(t, 55.8, 56.1) * (1 - ramp(t, 56.6, 57.0)), foreR: 10 + 40 * ramp(t, 55.8, 56.1),
    armL: 10, foreL: 0,
    eyes: relieved > 0.5 ? "open" : "wide", lookX: 1, brow: 0.5 * (1 - relieved), browTilt: 0.9 * (1 - relieved), pupil: 0.8 + 0.2 * relieved,
    sweat: 0.9 * (1 - relieved) * ramp(t, 47.4, 47.9),
    mouth: uTalk > 0.05 ? "open" : relieved > 0.5 ? "grin" : "sad", open: uTalk, blink: blinkAt(t, 2), blush: 0.4 * relieved,
    headRot: relieved > 0.5 ? 3 * Math.sin(t * 6) * (uTalk > 0.02 ? 1 : 0) : 0,
  };
  const noteK2 = ramp(t, 55.9, 56.5);
  const notePos = { x: 300 + 170 * noteK2, y: 1470 - 20 * Math.sin(noteK2 * Math.PI) - 10 * noteK2 };
  const bx = 330, by = 1260;
  const lerpN = (a: number, b: number) => a + (b - a) * fixed;
  const tipRx = lerpN(4, -36), tipLx = lerpN(-4, 36), tipY = lerpN(172, 182);
  return (
    <CamG cam={cam}>
      <StreetBack t={t} lit={lit} />
      <g transform={`translate(${bx} ${by})`}>
        <MeterBoard t={t} fixT={FIX} />
        <path d={`M-12 90 C-16 120 ${tipRx - 4} 150 ${tipRx} ${tipY}`} stroke="#D84A3A" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d={`M12 90 C16 120 ${tipLx + 4} 150 ${tipLx} ${tipY}`} stroke="#222" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d={`M${tipRx - 3} ${tipY - 4} L${tipRx} ${tipY + 10} M${tipLx + 3} ${tipY - 4} L${tipLx} ${tipY + 10}`} stroke="#E8A860" strokeWidth="5" strokeLinecap="round" />
        {fixed > 0.5 && <g><rect x="-28" y="118" width="56" height="16" rx="5" fill="#F2C94C" /><path d="M-24 118 L-14 134 M-8 118 L2 134 M8 118 L18 134" stroke="#C99A1A" strokeWidth="3" /></g>}
        <g transform={`translate(0 ${tipY + 4})`}><Spark t={t} a={50.7} b={53.7} /></g>
      </g>
      <Person spec={UNCLE} x={170} y={1650} scale={0.9} pose={uPose} />
      <Person spec={KIMU} x={kx} y={1650} scale={0.9} pose={kPose}
        heldR={<g transform="translate(0 4) scale(0.8)"><rect x="-44" y="-70" width="86" height="64" rx="5" fill="#C9CFD8" stroke="#7B869B" strokeWidth="3" /><ToolBag /></g>} />
      {noteK2 > 0 && t < 56.9 && <g transform={`translate(${notePos.x} ${notePos.y}) rotate(${-12 + 10 * noteK2})`}><Note /></g>}
      <g>
        <clipPath id="momWin"><rect x="790" y="880" width="190" height="240" /></clipPath>
        <g clipPath="url(#momWin)">
          <rect x="790" y="880" width="190" height="240" fill="#FFE2A8" />
          <Person spec={MOM} x={885} y={1219} scale={0.5} hideLegs pose={{ mouth: ramp(t, 56.6, 57.2) > 0.5 ? "grin" : "smile", eyes: "open", lookX: -1, blink: blinkAt(t, 1.2), brow: 0.2, headRot: 3 * Math.sin(t * 1.2), armL: 30, foreL: 120, armR: 30, foreR: 120 }}
            heldL={<g transform="translate(-14 -6) scale(0.4)"><TeaCup t={t} /></g>} />
        </g>
        <rect x="782" y="872" width="206" height="256" rx="6" fill="none" stroke="#6C8F7E" strokeWidth="14" />
      </g>
    </CamG>
  );
};
/** uncle's mouth envelope is in real time, but the street scene runs on source time: convert back */
const talkLocal = (tSrc: number) => {
  const s = SHOT.S4;
  const real = s.t0 + (tSrc - s.src0) / s.k;
  return talk("u1", real);
};

/* ====================================================================== */
/*  overlays: hook, subtitles, title                                       */
/* ====================================================================== */
const NAMES: Record<string, string> = { kimu: "KIMU", dad: "DAD", mom: "MOM", uncle: "UNCLE" };
const Subtitles: React.FC<{ t: number }> = ({ t }) => {
  const ln = LINES.find((l) => t >= l.t - 0.05 && t <= l.end + 0.2);
  if (!ln) return null;
  const text = ln.text;
  let lines = [text];
  if (text.length > 30) {
    const mid = text.length / 2;
    let best = -1;
    for (let i = 0; i < text.length; i++) if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    if (best > 0) lines = [text.slice(0, best), text.slice(best + 1)];
  }
  const narr = ln.char === "narrator";
  const wMax = Math.max(...lines.map((l) => l.length)) * 21 + 72;
  const hh = 40 + lines.length * 52;
  const a = clamp((t - ln.t + 0.05) / 0.15) * clamp((ln.end + 0.2 - t) / 0.2);
  return (
    <g transform={`translate(540 ${1800 - (lines.length - 1) * 26})`} opacity={a}>
      <rect x={-wMax / 2} y={-hh / 2} width={wMax} height={hh} rx="38" fill="#0B1230" fillOpacity={narr ? 0.7 : 0.86} stroke={narr ? "#7FE3FF" : "none"} strokeOpacity="0.4" strokeWidth="2" />
      {!narr && <text x={-wMax / 2 + 30} y={-hh / 2 - 12} fontFamily="Fredoka" fontWeight="600" fontSize="24" fill="#FFC857" letterSpacing="3" stroke="#0B1230" strokeWidth="6" paintOrder="stroke">{NAMES[ln.char]}</text>}
      {lines.map((l, i) => <text key={i} x="0" y={-hh / 2 + 58 + i * 52 - 8} textAnchor="middle" fontFamily="Nunito" fontWeight="700" fontStyle={narr ? "italic" : "normal"} fontSize="40" fill={narr ? "#CFE8FF" : "#fff"}>{l}</text>)}
    </g>
  );
};

const Overlay: React.FC<{ t: number }> = ({ t }) => {
  const hook = packet.hook;
  const ha = clamp((t - hook.t0) / 0.1) * clamp((hook.t1 - t) / 0.3);
  const chip = clamp((6.0 - t) / 0.5);
  const title = ramp(t, 57.7, 58.3);
  return (
    <g>
      <g opacity={ha} transform="translate(540 190)">
        <rect x="-440" y="-58" width="880" height="116" rx="58" fill="#0B1230" fillOpacity="0.85" stroke="#FF6A5E" strokeWidth="5" />
        <text x="0" y="18" textAnchor="middle" fontFamily="Fredoka" fontWeight="600" fontSize="50" fill="#fff" letterSpacing="1">{hook.text}</text>
      </g>
      <g opacity={chip} transform="translate(54 90)">
        <rect x="0" y="-30" width="560" height="60" rx="30" fill="#fff" fillOpacity="0.92" />
        <text x="28" y="9" fontFamily="Fredoka" fontWeight="600" fontSize="28" fill="#1B2347" letterSpacing="1.5">THE ADVENTURES OF KIMU</text>
      </g>
      <g opacity={title} transform={`translate(540 ${430 + (1 - title) * 30})`}>
        <rect x="-420" y="-110" width="840" height="220" rx="44" fill="#0B1230" fillOpacity="0.88" />
        <text x="0" y="-30" textAnchor="middle" fontFamily="Fredoka" fontWeight="500" fontSize="30" fill="#7FE3FF" letterSpacing="5">THE ADVENTURES OF KIMU</text>
        <text x="0" y="40" textAnchor="middle" fontFamily="Fredoka" fontWeight="600" fontSize="76" fill="#fff">The Bird on the Wire</text>
        <text x="0" y="86" textAnchor="middle" fontFamily="Fredoka" fontWeight="500" fontSize="22" fill="#AFC3EE" letterSpacing="8">AKS PRODUCTIONS</text>
      </g>
    </g>
  );
};

/* ====================================================================== */
export const KimuS1E01: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const s1 = SHOT.S1, s2 = SHOT.S2, s3 = SHOT.S3, s4 = SHOT.S4;
  const vis = (s: { t0: number; t1: number }) => t > s.t0 - 0.4 && t < s.t1 + 0.4;
  const t2 = local("S2", t), t3 = local("S3", t), t4 = local("S4", t);
  return (
    <AbsoluteFill style={{ background: "#0B1230" }}>
      <style>{FONT_CSS}</style>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {vis(s1) && <g opacity={sec(t, s1.t0, s1.t1, true)}><RoomScene t={t} /></g>}
        {vis(s2) && <g opacity={sec(t, s2.t0, s2.t1)}><TerraceScene t={t2} /></g>}
        {vis(s3) && <g opacity={sec(t, s3.t0, s3.t1)}><TeachScene t={t3} /></g>}
        {vis(s4) && <g opacity={sec(t, s4.t0, s4.t1, false, true)}><StreetScene t={t4} /></g>}
        <g transform="translate(540 380)" opacity={win(t, s4.t0 + (50.5 - s4.src0) / s4.k, s4.t0 + (53.2 - s4.src0) / s4.k, 0.35)}><Tag text="Short circuit!" a={1} color="#FFC857" /></g>
        <Vignette w={W} h={H} strength={0.5} />
        <Subtitles t={t} />
        <Overlay t={t} />
      </svg>
      {withAudio && <Audio src={staticFile("studio/s1e01/mix.wav")} />}
    </AbsoluteFill>
  );
};
