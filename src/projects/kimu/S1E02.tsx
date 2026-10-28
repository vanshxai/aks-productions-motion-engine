import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { W, H, FPS, clamp, ramp, kf, envAt, backOut } from "../../studio/util";
import { Person, KIMU, DAD, MOM, Pose } from "../../studio/Person";
import { Tag } from "../../studio/info";
import { Vignette } from "../../studio/decor";
import { KitchenBack, DiningBack, DiningFront, Cooker, Flame, Steam, CookerA, CookerB, CookerC, CookerD, GasketCrust, Spotlight, KFLOOR, COUNTER_Y, COOKER_X } from "../../studio/kitchen";
import tl from "../../../public/studio/s1e02/timeline.json";
import packet from "../../studio/s1e02/packet.json";

/** The Adventures of Kimu: "The Whistle". One continuous kitchen, 60 s. Every motion is a pure function of time. */
const FONT_CSS = `
@font-face{font-family:'Fredoka';font-weight:500;src:url(${staticFile("studio/fonts/fredoka-latin-500-normal.woff2")}) format('woff2');}
@font-face{font-family:'Fredoka';font-weight:600;src:url(${staticFile("studio/fonts/fredoka-latin-600-normal.woff2")}) format('woff2');}
@font-face{font-family:'Nunito';font-weight:400;src:url(${staticFile("studio/fonts/nunito-latin-400-normal.woff2")}) format('woff2');}
@font-face{font-family:'Nunito';font-weight:700;src:url(${staticFile("studio/fonts/nunito-latin-700-normal.woff2")}) format('woff2');}
`;
export const TOTAL = packet.duration_s * FPS;

type Line = { id: string; char: string; emo: string; text: string; t: number; end: number; dur: number; env: [number, number][] };
const LINES = tl.lines as unknown as Line[];
const L = (id: string) => LINES.find((l) => l.id === id)!;
const talk = (id: string, t: number) => envAt(L(id).env, t);
const talkAny = (ids: string[], t: number) => Math.max(...ids.map((i) => talk(i, t)));

type Cam = { cx: number; cy: number; z: number };
const camAt = (t: number, k: [number, number, number, number][]): Cam => ({
  cx: kf(t, k.map(([tt, cx]) => [tt, cx] as [number, number])),
  cy: kf(t, k.map(([tt, , cy]) => [tt, cy] as [number, number])),
  z: kf(t, k.map(([tt, , , z]) => [tt, z] as [number, number])),
});
const blinkAt = (t: number, seed = 0) => ((t + seed) % 3.6) < 0.12;
const win = (t: number, a: number, b: number, f = 0.25) => clamp((t - a) / f) * clamp((b - t) / f);
const walk = (t: number, f = 2.0, amp = 20) => {
  const ph = t * Math.PI * 2 * f, s = Math.sin(ph), c = Math.cos(ph);
  return { legL: 12 + s * amp * 0.55, legR: 12 - s * amp * 0.55, kneeL: Math.max(0, c) * amp * 1.9, kneeR: Math.max(0, -c) * amp * 1.9, armL: 5 + s * 6, armR: 5 - s * 6, bob: -Math.abs(c) * 7 };
};

/* ---- story clock (seconds) ---- */
const FLAME_OFF = 46.75, FLAME_ON = 52.95, WHISTLE = 53.5;
const LID_OPEN = 50.0, LID_SHUT = 52.4;
const SEAT_Y = KFLOOR + 57;

const Notebook = () => <g transform="translate(0 -6)"><rect x="-22" y="-30" width="44" height="58" rx="5" fill="#C0392B" stroke="#7A2018" strokeWidth="3" /><rect x="-16" y="-24" width="6" height="46" fill="#7A2018" opacity="0.5" /></g>;
const Cloth = () => <g transform="translate(0 4)"><rect x="-26" y="-12" width="52" height="30" rx="9" fill="#F2EBDB" stroke="#CFC4A8" strokeWidth="3" /><path d="M-16 -4 H16 M-16 6 H16" stroke="#E1362B" strokeWidth="4" /></g>;

/* ====================================================================== */
const World: React.FC<{ t: number }> = ({ t }) => {
  const m0 = L("m0"), d1 = L("d1"), m1 = L("m1"), d2 = L("d2"), k0 = L("k0"), m2 = L("m2"), d3 = L("d3"), m3 = L("m3"), k1 = L("k1");
  const n2 = L("n2"), n3 = L("n3"), n6 = L("n6"), n7 = L("n7"), n8 = L("n8"), m4 = L("m4"), d4 = L("d4");

  /* ---------- camera ---------- */
  const cam = camAt(t, [
    [0, 430, 1160, 1.55], [3.2, 430, 1160, 1.55],
    [d1.t - 0.25, 1090, 1150, 1.7], [d1.t + 1.2, 1090, 1150, 1.7],
    [m1.t - 0.2, 400, 1150, 1.6], [m1.t + 2.6, 400, 1150, 1.6],
    [d2.t - 0.2, 1090, 1150, 1.75], [d2.t + 0.8, 1090, 1150, 1.75],
    [k0.t - 0.4, 640, 1140, 1.35], [k0.t + 1.6, 620, 1140, 1.45],
    [m2.t - 0.2, 300, 1100, 1.95], [m2.t + 2.1, 300, 1100, 2.0],
    [d3.t - 0.2, 1090, 1150, 1.8], [d3.t + 1.0, 1090, 1150, 1.8],
    [m3.t - 0.2, 290, 1080, 2.2], [m3.t + 1.7, 290, 1080, 2.35],
    [k1.t - 0.1, 700, 1100, 1.55], [18.9, 690, 1100, 1.7],
    [19.3, 700, 1120, 1.7], [22.4, 700, 1120, 1.75], [23.4, 560, 1180, 2.1], [27.6, 440, 1180, 2.2],
    [28.3, COOKER_X, 915, 1.6], [45.8, COOKER_X, 915, 1.6],
    [46.4, 520, 1120, 1.65], [49.6, 480, 1170, 1.95], [50.3, 470, 1130, 2.0], [52.3, 470, 1130, 2.0], [53.1, 520, 1120, 1.4],
    [m4.t - 0.2, 300, 1100, 2.0], [m4.t + 1.2, 300, 1100, 2.0],
    [d4.t - 0.2, 1040, 1110, 1.6], [d4.t + 1.4, 1000, 1110, 1.5],
    [57.4, 800, 1080, 1.15], [60, 800, 1080, 1.1],
  ]);

  /* ---------- signals ---------- */
  const leak = ramp(t, 0.5, 5.0) * 0.9 * (1 - ramp(t, FLAME_OFF + 0.2, 49.2)) + 0.1 * (t > 52.9 ? 0 : 0);
  const hissBoost = ramp(t, k0.t - 0.6, k0.t + 0.3);
  const flame = (t < FLAME_OFF ? ramp(t, 0.3, 0.7) : 0) + (t > FLAME_ON ? ramp(t, FLAME_ON, FLAME_ON + 0.3) : 0);
  const lidP = ramp(t, LID_OPEN, LID_OPEN + 0.6) * (1 - ramp(t, LID_SHUT, LID_SHUT + 0.4));
  const whistling = ramp(t, WHISTLE, WHISTLE + 0.2);
  const jet = whistling * (0.75 + 0.25 * Math.sin(t * 9));
  const lift = whistling * (0.7 + 0.3 * Math.sin(t * 9 + 1));
  const quiet = ramp(t, FLAME_OFF + 0.2, 49.5);
  const pray = ramp(t, 19.3, 20.0) * (1 - ramp(t, 22.7, 23.0));
  const glow = ramp(t, 19.9, 21.1) * (1 - ramp(t, 22.9, 23.5));
  const wake = ramp(t, 22.9, 23.3);
  const dim = ramp(t, 19.0, 19.5) * (1 - ramp(t, 23.2, 24.0));

  /* ---------- Mom ---------- */
  const mTalk = talkAny(["m0", "m1", "m2", "m3", "m4"], t);
  const sad = ramp(t, m2.t - 0.3, m2.t + 0.6) * (1 - ramp(t, 19.5, 20.5)) + 0.3 * ramp(t, 21, 22) * (1 - ramp(t, 46, 47)) * 0;
  const tearsIn = ramp(t, m3.t, m3.t + 1.2) * (1 - ramp(t, 46.0, 47.0));
  const relief = ramp(t, WHISTLE + 0.2, WHISTLE + 0.8);
  const smileM = relief;
  const mPose: Pose = {
    armR: 38 + 14 * Math.sin(t * 3.2) * (1 - relief) - 20 * relief, foreR: 78 + 10 * Math.cos(t * 3.2) - 25 * relief, handR: "open",
    armL: 30 - 24 * relief, foreL: 105 + 50 * relief, handL: relief > 0.4 ? "open" : "fist",
    lean: 3 - 2 * relief, headRot: -3 * sad + 2 * Math.sin(t * 1.3) + (relief ? -4 * relief : 0),
    eyes: "open", lookX: t > k0.t - 0.2 && t < m3.t ? 1 : t < 17.6 ? 1 : 0.4, lookY: sad * 0.3,
    brow: 0.5 * (1 - relief) + 0.2 * relief, browTilt: (0.5 + 0.5 * sad) * (1 - relief) - 0.2 * relief,
    lid: 0.12 + 0.2 * sad, lidTilt: 0.3 + 0.5 * sad - 0.5 * relief,
    mouth: mTalk > 0.05 ? "open" : smileM > 0.5 ? "grin" : sad > 0.4 ? "sad" : "flat", open: mTalk * (relief > 0.4 ? 0.8 : 1),
    tear: Math.max(0.5 * tearsIn, 0.6 * relief * (t < 57 ? 1 : 0.5)), blush: 0.3 * relief, sweat: 0.4 * ramp(t, 1, 3) * (1 - sad) * (t < 6 ? 1 : 0),
    blink: blinkAt(t, 0.6), bob: Math.sin(t * 1.6) * 1.2,
  };
  const mCover = ramp(t, m4.t - 0.1, m4.t + 0.3) * (1 - ramp(t, m4.t + 1.1, m4.t + 1.5));
  mPose.armR = (mPose.armR as number) + 100 * mCover; mPose.foreR = (mPose.foreR as number) + 40 * mCover;

  /* ---------- Dad ---------- */
  const dTalk = talkAny(["d1", "d2", "d3", "d4"], t);
  const stand = ramp(t, 55.0, 55.3);
  const dSad = ramp(t, m3.t + 0.3, m3.t + 1.2) * (1 - ramp(t, 46, 47));
  const dAnn = (ramp(t, d2.t - 0.3, d2.t + 0.3) * (1 - ramp(t, m2.t, m2.t + 0.4)) + 0.7 * ramp(t, d3.t - 0.2, d3.t + 0.2)) * (1 - ramp(t, m3.t, m3.t + 0.6));
  const dx = kf(t, [[55.3, 1210], [56.6, 940]], (u) => u);
  const dWalk = t > 55.3 && t < 56.6;
  const dW: any = dWalk ? walk(t, 1.7, 12) : {};
  const dPose: Pose = {
    ...(dWalk ? dW : {}),
    armL: dTalk > 0.05 && t > d3.t - 0.1 && t < d3.t + 1.2 ? 66 + 16 * Math.sin(t * 9) : stand ? 70 * ramp(t, d4.t - 0.1, d4.t + 0.4) : 24,
    foreL: dTalk > 0.05 && t > d3.t - 0.1 && t < d3.t + 1.2 ? 36 : stand ? 25 : 86,
    handL: stand ? "open" : "fist",
    armR: stand ? 8 : 22, foreR: stand ? 10 : 84 + 5 * Math.sin(t * 9) * (1 - dSad) * (t < 15 ? 1 : 0),
    lean: 3 * dAnn - 3 * dSad, headRot: (dTalk > 0.05 ? 2 * Math.sin(t * 5) : 0) - 3 * dSad,
    lookX: t < 17.5 ? -1 : -0.6, lookY: 0.5 * dSad, eyes: dSad > 0.5 && dTalk < 0.05 ? "down" : "open",
    lid: 0.2 + 0.25 * dAnn + 0.25 * dSad, lidTilt: -0.5 * dAnn + 0.9 * dSad - 0.2 * stand,
    brow: 0.2 - 0.2 * dAnn + 0.2 * dSad + 0.3 * stand, browTilt: -0.6 * dAnn + 0.9 * dSad - 0.2 * stand,
    mouth: dTalk > 0.05 ? "open" : stand > 0.5 ? "smile" : dAnn > 0.4 ? "frown" : dSad > 0.4 ? "frown" : "flat", open: dTalk,
    tear: 0.5 * dSad * ramp(t, m3.t + 1.0, m3.t + 2.0) * (t < 46 ? 1 : 0), vein: 0.5 * dAnn * ramp(t, d3.t - 0.1, d3.t + 0.3) * (1 - dSad),
    blink: blinkAt(t, 1.3), bob: dWalk ? dW.bob : Math.sin(t * 1.5) * 1.2,
  };

  /* ---------- Kimu ---------- */
  const kTalk = talkAny(["k0", "k1", "n2"], t);
  const enter = t > 6.7 && t < 8.9;
  const kx = kf(t, [[6.7, 1450], [8.9, 760], [23.5, 760], [25.2, 700], [57.0, 700], [58.2, 880]], (u) => u);
  const kWalk = enter || (t > 23.5 && t < 25.2) || (t > 57.0 && t < 58.2);
  const kW: any = kWalk ? walk(t, 1.9, 13) : {};
  const point = ramp(t, k0.t - 0.1, k0.t + 0.3) * (1 - ramp(t, k0.t + 1.7, k0.t + 2.2));
  const resolve = ramp(t, k1.t - 0.1, k1.t + 0.3) * (1 - ramp(t, 19.0, 19.4));
  const knob = ramp(t, FLAME_OFF - 0.3, FLAME_OFF) * (1 - ramp(t, FLAME_OFF + 0.7, FLAME_OFF + 1.1));
  const wipe = ramp(t, 51.0, 51.3) * (1 - ramp(t, 52.2, 52.45));
  const openL = ramp(t, LID_OPEN - 0.2, LID_OPEN + 0.3) * (1 - ramp(t, 52.3, 52.7));
  const joy = ramp(t, WHISTLE + 0.1, WHISTLE + 0.7);
  const kPose: Pose = {
    ...(kWalk ? kW : {}),
    armL: kWalk ? kW.armL : 8 + 6 * pray * 0 + 20 * resolve + 100 * pray * 0 + 20 * wipe - 4 * joy, foreL: kWalk ? 0 : 108 * pray + 70 * wipe + 20 * openL,
    armR: kWalk ? kW.armR : 8 + 92 * point + 100 * knob + 20 * resolve + 60 * openL + (wipe ? 22 * Math.sin(t * 15) * wipe : 0),
    foreR: kWalk ? 0 : 108 * pray + 18 * point + 12 * knob + 30 * openL + 70 * wipe,
    handR: point > 0.4 || knob > 0.4 ? "point" : resolve > 0.5 ? "fist" : "open",
    ...(pray > 0.2 ? { armL: 6, armR: 6, foreL: 108 * pray, foreR: 108 * pray } : {}),
    lean: 4 * resolve + 5 * (openL + wipe) - 2 * joy,
    eyes: pray > 0.5 ? "closed" : wake > 0.4 && wake < 1 && t < 24 ? "wide" : "open",
    brow: 0.4 * pray + 0.5 * point + 0.2 * (1 - resolve) * 0 + 0.6 * wake * (1 - ramp(t, 24, 25)), browTilt: 0.7 * pray + 0.5 * point * 0 + 0.6 * point - 0.5 * resolve - 0.3 * (openL + wipe),
    lid: 0.12 * (1 - pray) * (1 - resolve) + 0.15 * resolve, lidTilt: 0.4 * (1 - pray) * (t < 19 ? 1 : 0) - 0.4 * resolve,
    mouth: kTalk > 0.05 ? (t > 20 && t < 23 ? "o" : "open") : joy > 0.5 ? "grin" : pray > 0.5 ? "smile" : point > 0.4 ? "o" : resolve > 0.5 ? "smirk" : "flat", open: kTalk * (t > 20 && t < 23 ? 0.4 : 1),
    lookX: t < 8.9 ? -0.3 : t > 57 ? 0 : -0.9, lookY: pray ? 0 : 0.1,
    headRot: -4 * pray - 5 * point + 3 * resolve, glow, tear: 0.5 * pray * ramp(t, 20.5, 21.5),
    blush: 0.5 * ramp(t, d4.t, d4.t + 0.6), sweat: 0.7 * point * (1 - ramp(t, k0.t + 1.4, k0.t + 1.9)),
    blink: blinkAt(t, 0.4) && !pray, bob: kWalk ? kW.bob : Math.sin(t * 1.5) * 1.4,
  };
  const kHeldL = t < 9.2 ? <Notebook /> : undefined;
  const kHeldR = wipe > 0.05 || (openL > 0.3 && t < 52.3) ? <Cloth /> : undefined;

  const chairShift = -48 * ramp(t, 57.3, 57.9);

  return (
    <g>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>
        <KitchenBack t={t} flame={0} dim={dim} />
        <DiningBack chairShift={chairShift} chairTilt={chairShift * 0.1} />
        {/* Dad: seated until the whistle, then up */}
        <Person spec={DAD} x={stand > 0.5 ? dx : 1210} y={stand > 0.5 ? KFLOOR : SEAT_Y} scale={0.98} pose={dPose} hideLegs={stand < 0.5} />
        <DiningFront t={t} plates={t > 55 ? 1 : 0} steam={ramp(t, 55, 56)} />
        <Person spec={MOM} x={185} y={KFLOOR} scale={0.95} pose={mPose} />
        {/* the cooker on the hob */}
        <g transform={`translate(${COOKER_X} ${COUNTER_Y - 26 - 22 - 20})`}>
          <Cooker t={t} lid={lidP} lift={lift} steamJet={jet} leak={Math.max(0, leak * (1 + 0.4 * hissBoost)) * (1 - 0.0)} hiss={0.7 * (t < FLAME_OFF ? 1 : 0.5 * (1 - quiet))} />
        </g>
        <g transform={`translate(${COOKER_X} ${COUNTER_Y - 26 - 22 + 8}) scale(1.9 1.25)`}><Flame t={t} on={flame} /></g>
        {/* Kimu steps in front of the counter */}
        <Person spec={KIMU} x={kx} y={KFLOOR} scale={1.0} pose={kPose} heldL={kHeldL} heldR={kHeldR} />
        <Spotlight x={kx} y={1080} r={420} a={glow * 0.9} />
        {/* leftover steam drifting across the room after the whistle */}
        {whistling > 0.3 && <Steam x={COOKER_X} y={900} t={t} rate={0.6} spread={80} size={1.4} n={7} rise={300} />}
      </g>
    </g>
  );
};

/* ---------------- lesson overlay (S3) and gasket close-up (S4) ---------------- */
const PANELS: [string, number, number, React.FC<{ u: number }>][] = [
  ["A", 28.15, 33.1, CookerA], ["B", 32.95, 37.95, CookerB], ["C", 37.75, 42.1, CookerC], ["D", 41.9, 46.0, CookerD],
];
const KimuInset: React.FC<{ t: number }> = ({ t }) => {
  const a = ramp(t, 28.4, 29.0, backOut) * (1 - ramp(t, 45.7, 46.2));
  if (a <= 0.01) return null;
  const phase = t < 33 ? "curious" : t < 37.8 ? "wow" : t < 42 ? "happy" : "serious";
  const p: Pose = {
    eyes: phase === "wow" ? "wide" : "open", brow: phase === "wow" ? 0.8 : phase === "curious" ? 0.4 : 0.1, browTilt: phase === "serious" ? -0.5 : phase === "curious" ? 0.4 : 0,
    mouth: phase === "wow" ? "o" : phase === "happy" ? "grin" : phase === "serious" ? "frown" : "smile", open: 0.5, lookX: -0.3,
    headRot: Math.sin(t * 1.3) * 3, blink: blinkAt(t, 0.4), lid: phase === "serious" ? 0.2 : 0, pupil: phase === "wow" ? 0.9 : 1,
  };
  return (
    <g transform={`translate(200 1500) scale(${a})`}>
      <clipPath id="insetClip"><circle r="140" /></clipPath>
      <circle r="148" fill="#fff" /><circle r="140" fill="#27406B" />
      <g clipPath="url(#insetClip)"><rect x="-150" y="-150" width="300" height="300" fill="#16224A" /><Person spec={KIMU} x={0} y={504} scale={0.9} hideLegs pose={p} /></g>
      <circle r="140" fill="none" stroke="#7FE3FF" strokeWidth="6" />
    </g>
  );
};
const Lesson: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x="0" y="0" width={W} height="940" fill="#050A22" opacity={0.4 * win(t, 28.1, 46.2, 0.4)} />
    {PANELS.map(([id, a, b, P]) => {
      const op = clamp((t - a) / 0.3) * clamp((b - t) / 0.3);
      return op <= 0 ? null : <g key={id} transform="translate(90 150)" opacity={op}><P u={t - a} /></g>;
    })}
    <KimuInset t={t} />
  </g>
);
const GasketInset: React.FC<{ t: number }> = ({ t }) => {
  const a = ramp(t, 50.45, 50.9, backOut) * (1 - ramp(t, 52.35, 52.7));
  if (a <= 0.01) return null;
  const clean = ramp(t, 51.1, 52.2);
  return (
    <g transform={`translate(540 560) scale(${a})`}>
      <clipPath id="gClip"><circle r="270" /></clipPath>
      <circle r="282" fill="#fff" /><circle r="270" fill="#E7DCC0" />
      <g clipPath="url(#gClip)">
        <rect x="-280" y="-280" width="560" height="560" fill="#C9CFD8" /><rect x="-280" y="-60" width="560" height="340" fill="#8E97A6" />
        <g transform="translate(0 20) scale(0.74)"><GasketCrust clean={clean} /></g>
        <g transform={`translate(${-90 + 180 * ((Math.sin(t * 15) + 1) / 2) * (clean < 1 && t > 51 ? 1 : 0)} 40)`} opacity={ramp(t, 51.0, 51.2) * (1 - ramp(t, 52.1, 52.3))}><rect x="-70" y="-26" width="140" height="64" rx="16" fill="#F2EBDB" stroke="#CFC4A8" strokeWidth="4" /><path d="M-48 -8 H48 M-48 8 H48" stroke="#E1362B" strokeWidth="5" /></g>
      </g>
      <circle r="270" fill="none" stroke="#7FE3FF" strokeWidth="7" />
      <g transform="translate(0 340)"><Tag text={clean < 0.5 ? "Dried starch on the rim" : "Wiped clean"} a={1} color={clean < 0.5 ? "#FFC857" : "#7CF0A8"} /></g>
    </g>
  );
};

/* ---------------- subtitles + overlays ---------------- */
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
        <text x="0" y="40" textAnchor="middle" fontFamily="Fredoka" fontWeight="600" fontSize="76" fill="#fff">{packet.title}</text>
        <text x="0" y="86" textAnchor="middle" fontFamily="Fredoka" fontWeight="500" fontSize="22" fill="#AFC3EE" letterSpacing="8">AKS PRODUCTIONS</text>
      </g>
    </g>
  );
};

export const KimuS1E02: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const dip = Math.max(win(t, 18.85, 19.3, 0.2) * 0, win(t, 52.7, 53.45, 0.25)) * 0.9;
  return (
    <AbsoluteFill style={{ background: "#0B1230" }}>
      <style>{FONT_CSS}</style>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <World t={t} />
        <Lesson t={t} />
        <GasketInset t={t} />
        <rect x="0" y="0" width={W} height={H} fill="#05081A" opacity={dip} />
        <g transform="translate(540 960)" opacity={win(t, 52.85, 53.5, 0.2)}><Tag text="Ten minutes later" a={1} color="#FFC857" /></g>
        <Vignette w={W} h={H} strength={0.5} />
        <Subtitles t={t} />
        <Overlay t={t} />
      </svg>
      {withAudio && <Audio src={staticFile("studio/s1e02/mix.wav")} />}
    </AbsoluteFill>
  );
};
