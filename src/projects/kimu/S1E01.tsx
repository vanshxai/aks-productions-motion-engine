import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { W, H, FPS, clamp, ramp, kf, easeOut, easeInOut, envAt, hash, backOut } from "../../studio/util";
import { Person, KIMU, DAD, MOM, UNCLE, Pose } from "../../studio/Person";
import { LaptopBack, LaptopClosed, Bird, TeaCup, Note, ToolBag, Spark } from "../../studio/props";
import { RoomBack, RoomChair, RoomDesk, RoomDark, HallLight, TerraceBack, TerraceParapet, StreetBack, MeterBoard, BIRD_X, birdWireY } from "../../studio/sets";
import { PanelA, PanelB, PanelC, PanelD, Tag } from "../../studio/info";
import vo from "../../../public/studio/s1e01/vo.json";
import mumble from "../../../public/studio/s1e01/mumble.json";
import packet from "../../studio/s1e01/packet.json";

const FONT_CSS = `
@font-face{font-family:'Fredoka';font-weight:500;src:url(${staticFile("studio/fonts/fredoka-latin-500-normal.woff2")}) format('woff2');}
@font-face{font-family:'Fredoka';font-weight:600;src:url(${staticFile("studio/fonts/fredoka-latin-600-normal.woff2")}) format('woff2');}
@font-face{font-family:'Nunito';font-weight:400;src:url(${staticFile("studio/fonts/nunito-latin-400-normal.woff2")}) format('woff2');}
@font-face{font-family:'Nunito';font-weight:700;src:url(${staticFile("studio/fonts/nunito-latin-700-normal.woff2")}) format('woff2');}
`;

export const TOTAL = packet.duration_s * FPS;
const SHOT = Object.fromEntries(packet.shots.map((s) => [s.id, s])) as Record<string, { t0: number; t1: number }>;

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
const mum = (id: string) => (mumble as any[]).find((m) => m.id === id)!;
const talking = (id: string, t: number) => envAt(mum(id).env, t);
const sec = (t: number, a: number, b: number, first = false, last = false) =>
  (first ? 1 : clamp((t - a) / 0.35)) * (last ? 1 : clamp((b - t) / 0.35));
const walk = (t: number, f = 2.2, amp = 18) => {
  const s = Math.sin(t * Math.PI * 2 * f);
  return { legL: s * amp, legR: -s * amp, armL: -s * 14, armR: s * 14, bob: -Math.abs(s) * 7 };
};

/* ---------------- speech bubble ---------------- */
const Bubble: React.FC<{ x: number; y: number; w: number; lines: string[]; tx: number; ty: number; a: number; who?: string }> = ({ x, y, w, lines, tx, ty, a, who }) => {
  const h = 54 + lines.length * 56;
  const pop = backOut(clamp(a));
  const ox = Math.max(-w / 2 + 60, Math.min(w / 2 - 60, (tx - x) * 0.6));
  return (
    <g opacity={clamp(a * 2)} transform={`translate(${x} ${y}) scale(${0.8 + 0.2 * pop})`}>
      <path d={`M${ox - 30} ${h / 2 - 4} L${tx - x} ${ty - y} L${ox + 30} ${h / 2 - 4} Z`} fill="#fff" stroke="#1B2347" strokeWidth="5" strokeLinejoin="round" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="34" fill="#fff" stroke="#1B2347" strokeWidth="5" />
      <path d={`M${ox - 27} ${h / 2 - 8} L${ox + 27} ${h / 2 - 8} L${ox + 27} ${h / 2 + 6} L${ox - 27} ${h / 2 + 6} Z`} fill="#fff" />
      {who && <text x={-w / 2 + 28} y={-h / 2 - 12} fontFamily="Fredoka" fontWeight="600" fontSize="26" fill="#fff" stroke="#1B2347" strokeWidth="6" paintOrder="stroke">{who}</text>}
      {lines.map((l, i) => <text key={i} x="0" y={-h / 2 + 62 + i * 56} textAnchor="middle" fontFamily="Fredoka" fontWeight="500" fontSize="42" fill="#1B2347">{l}</text>)}
    </g>
  );
};
const dlg = (id: string) => (packet.dialogue as any[]).find((d) => d.id === id)!;
const bubbleA = (id: string, t: number) => {
  const m = mum(id);
  return clamp((t - m.t + 0.05) / 0.2) * clamp((m.t + m.dur + 0.5 - t) / 0.25);
};

/* ====================================================================== */
/*  S1  Kimu's room                                                        */
/* ====================================================================== */
const RoomScene: React.FC<{ t: number }> = ({ t }) => {
  const cam = camAt(t, [[0, 700, 1090, 1.3], [2.2, 700, 1090, 1.3], [3.4, 560, 980, 1.0], [4.6, 560, 980, 1.0], [6.4, 780, 1060, 1.55], [9.0, 790, 1090, 1.6], [12.6, 700, 1000, 1.2]]);
  const dark = ramp(t, 0.8, 1.25);
  const screenOn = 1 - ramp(t, 10.4, 10.8);
  /* Kimu at the desk */
  const typing = t < 3.1 || (t > 9.9 && t < 10.4);
  const surprised = ramp(t, 3.0, 3.3) * (1 - ramp(t, 3.9, 4.4));
  const worry = ramp(t, 3.8, 4.6) * (1 - ramp(t, 8.8, 9.6) * 0.4);
  const kTalk = talking("kimu1", t);
  const sorrow = ramp(t, 7.4, 8.4);
  const putAway = ramp(t, 9.0, 9.4) * (1 - ramp(t, 9.9, 10.3));
  const kPose: Pose = {
    armL: typing ? -10 + 3 * Math.sin(t * 9) : -6 + putAway * 70, foreL: typing ? 72 + 8 * Math.sin(t * 11) : 70 - putAway * 40,
    armR: typing ? -10 + 3 * Math.sin(t * 8 + 1) : -6 + putAway * 80, foreR: typing ? 72 + 8 * Math.sin(t * 10) : 70 - putAway * 30,
    headRot: -5 * surprised + (t > 7.4 ? 6 * sorrow : 0) - 3 * Math.sin(t * 1.3) * 0.3,
    lookX: -1.0 * (surprised + worry * 0.6) + (t < 3 ? 0 : 0),
    eyes: t < 3 ? "down" : sorrow > 0.5 ? "down" : surprised > 0.4 ? "wide" : "open",
    brow: 0.3 + worry * 0.7, browTilt: worry * 0.9,
    mouth: kTalk > 0.05 ? "open" : worry > 0.4 ? "sad" : t < 3 ? "flat" : "smile", open: kTalk,
    sweat: clamp(ramp(t, 4.0, 4.5) * (1 - ramp(t, 7.0, 7.4))),
    blink: blinkAt(t), bob: Math.sin(t * 1.7) * 1.5,
  };
  /* Dad in the doorway */
  const dadIn = ramp(t, 2.6, 2.9) * (1 - ramp(t, 8.3, 8.7));
  const dx = kf(t, [[2.7, 190], [3.5, 360], [7.2, 360], [8.3, 200]]);
  const dTalk = talking("dad1", t);
  const dadWalk = (t > 2.9 && t < 3.6) || (t > 7.2 && t < 8.3) ? walk(t, 1.8, 12) : {};
  const dPose: Pose = {
    ...dadWalk,
    armR: 66, foreR: 30,
    armL: dTalk > 0.02 ? 35 + 22 * Math.sin(t * 7) : 4, foreL: dTalk > 0.02 ? 50 : 0,
    mouth: dTalk > 0.05 ? "open" : "flat", open: dTalk, brow: -0.4, browTilt: -0.6, blink: blinkAt(t, 1.3),
    headRot: dTalk > 0.02 ? 3 * Math.sin(t * 5) : 0,
  };
  /* Mom behind */
  const momIn = ramp(t, 6.3, 6.7) * (1 - ramp(t, 9.0, 9.5));
  const mPose: Pose = { mouth: "sad", brow: 0.4, browTilt: 0.8, eyes: "open", lookX: 1, headRot: -3, armL: 4, armR: 4, foreL: 25, foreR: 25, blink: blinkAt(t, 0.6) };
  const hallA = ramp(t, 2.5, 2.8) * (1 - ramp(t, 9.2, 9.8));
  const wiresOn = 1 - putAway * 0 - ramp(t, 9.3, 9.6);
  const torch: [number, number, number, number] = [dx + 195, 1235, -4, dadIn * (t < 8.0 ? 0.9 : 0.9 * (1 - ramp(t, 7.9, 8.3)))];
  const fan = null;
  return (
    <CamG cam={cam}>
      <RoomBack t={t} />
      <HallLight a={hallA} />
      <Person spec={MOM} x={105} y={1560} scale={0.98} pose={mPose} opacity={momIn} />
      <Person spec={DAD} x={dx} y={1560} scale={0.98} pose={dPose} opacity={dadIn} heldR={<g transform="translate(0 -6)"><rect x="-10" y="-26" width="22" height="42" rx="5" fill="#222" /><rect x="-7" y="-23" width="16" height="30" rx="3" fill="#FFF7D6" /></g>} />
      <RoomChair />
      <Person spec={KIMU} x={800} y={1560} scale={1.0} pose={kPose} hideLegs />
      <g transform="translate(800 1322)"><LaptopBack w={250} on={screenOn} /></g>
      <g opacity={wiresOn}><RoomDesk t={t} /></g>
      {wiresOn < 1 && <g opacity={1 - wiresOn} style={{ display: "none" }} />}
      <RoomDark t={t} screenOn={screenOn} glowAt={[800, 1130]} torch={torch} />
      {/* speech */}
      <Bubble x={450} y={740} w={560} lines={dlg("dad1").lines} tx={dx + 10} ty={1000} a={bubbleA("dad1", t)} />
      <Bubble x={830} y={760} w={360} lines={dlg("kimu1").lines} tx={810} ty={930} a={bubbleA("kimu1", t)} />
      {/* battery tag */}
      <g transform="translate(560 1100)" opacity={ramp(t, 0.9, 1.2) * (1 - ramp(t, 3.0, 3.3)) + ramp(t, 10.3, 10.5) * (1 - ramp(t, 11.8, 12.2))}>
        <Tag text={t < 5 ? "3%" : "0%"} a={1} color="#FF6A5E" />
      </g>
    </CamG>
  );
};

/* ====================================================================== */
/*  S2  Terrace: the prayer                                                */
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

const TerraceScene: React.FC<{ t: number }> = ({ t }) => {
  const cam = camAt(t, [[12.6, 540, 960, 1.0], [15.0, 540, 1000, 1.0], [20.4, 450, 1130, 1.28], [21.4, 450, 1130, 1.28], [23.2, 520, 1010, 1.5]]);
  const x = kf(t, [[12.6, -160], [14.1, 430]]);
  const walking = t < 14.1;
  const prayer = ramp(t, 15.1, 15.9) * (1 - ramp(t, 21.1, 21.5));
  const glow = ramp(t, 15.8, 17.2) * (1 - ramp(t, 21.3, 22.4));
  const wake = ramp(t, 21.2, 21.6);
  const w = walking ? walk(t, 2.0, 0) : {};
  const pose: Pose = {
    bob: walking ? -Math.abs(Math.sin(t * Math.PI * 2 * 2)) * 8 : Math.sin(t * 1.4) * 2,
    armL: 6 * prayer + 10 * (1 - prayer), foreL: 108 * prayer, armR: 6 * prayer + 10 * (1 - prayer), foreR: 108 * prayer,
    eyes: prayer > 0.5 ? "closed" : "open", brow: prayer > 0.5 ? 0.5 : 0, browTilt: prayer * 0.5,
    mouth: wake > 0.5 ? "o" : prayer > 0.5 ? "smile" : "flat", open: 0.4,
    headRot: -4 * prayer + (wake > 0.5 ? 0 : 0), headDx: 0, lookX: wake > 0.4 ? 1 : t < 15 ? 1 : 0,
    glow, blink: blinkAt(t, 0.4),
  };
  if (wake > 0.4) { pose.headRot = -8; pose.eyes = "wide"; }
  return (
    <CamG cam={cam}>
      <TerraceBack t={t} />
      <BirdAt t={t} s={0.85} />
      <Person spec={KIMU} x={x} y={1650} scale={0.95} pose={pose} hideLegs />
      <TerraceParapet />
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
  /* reaction cam */
  const react = (() => {
    if (t < 27) return { eyes: "wide" as const, mouth: "o" as const, brow: 0.8, browTilt: 0.3 };
    if (t < 35.5) return { eyes: "open" as const, mouth: "smile" as const, brow: 0.5, browTilt: 0 };
    if (t < 41) return { eyes: "open" as const, mouth: "grin" as const, brow: 0.7, browTilt: 0 };
    return { eyes: "wide" as const, mouth: "o" as const, brow: 0.6, browTilt: 0.9 };
  })();
  const rx = ramp(t, 24.6, 25.2, backOut);
  return (
    <g>
      <CamG cam={cam}>
        <TerraceBack t={t} />
        <BirdAt t={t} s={0.85} />
      </CamG>
      {/* dim the lower sky slightly so the board reads */}
      <rect x="0" y="0" width={W} height="940" fill="#050A22" opacity="0.35" />
      {PANELS.map(([id, a, b, P]) => {
        const op = clamp((t - a) / 0.3) * clamp((b - t) / 0.3);
        if (op <= 0) return null;
        return <g key={id} transform="translate(90 150)" opacity={op}><P u={t - a} /></g>;
      })}
      {/* connector from panel to bird */}
      <path d={`M540 910 L540 1180`} stroke="#7FE3FF" strokeWidth="4" strokeDasharray="10 12" opacity={0.7 * ramp(t, 25, 25.6)} />
      {/* reaction cam */}
      <g transform={`translate(200 1500) scale(${rx})`}>
        <clipPath id="reactClip"><circle r="140" /></clipPath>
        <circle r="148" fill="#fff" />
        <circle r="140" fill="#27406B" />
        <g clipPath="url(#reactClip)">
          <rect x="-150" y="-150" width="300" height="300" fill="#16224A" />
          <Person spec={KIMU} x={0} y={452} scale={0.9} hideLegs pose={{ ...react, blink: blinkAt(t, 0.4), headRot: Math.sin(t * 1.3) * 3, sweat: t > 42.5 ? 0.9 : 0 }} />
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
  /* Kimu walks out of his house to the neighbour's wall */
  const kx = kf(t, [[46.9, 830], [48.6, 520]]);
  const moving = t > 46.9 && t < 48.6;
  const w: any = moving ? walk(t, 2.0, 18) : {};
  const point = ramp(t, 50.1, 50.6) * (1 - ramp(t, 53.0, 53.4));
  const work = ramp(t, 53.3, 53.7) * (1 - ramp(t, 54.5, 54.8));
  const grin = ramp(t, 55.0, 55.4);
  const noteK = ramp(t, 55.9, 56.5);
  const kPose: Pose = {
    ...w,
    armL: 120 * point + 50 * work + (-6 * grin) + 55 * noteK,
    foreL: 20 * point + 70 * work + 60 * noteK,
    armR: w.armR ?? 4, foreR: 8,
    eyes: "open", lookX: -1 * (t > 49 ? 1 : 0), brow: 0.2 + point * 0.4,
    mouth: grin > 0.5 ? "grin" : "smile", headRot: -6 * point,
    blink: blinkAt(t, 0.9), bob: w.bob ?? Math.sin(t * 1.6) * 1.5,
  };
  /* Uncle */
  const uTalk = talking("uncle1", t);
  const relieved = ramp(t, 54.8, 55.3);
  const uPose: Pose = {
    armR: 150 * (1 - relieved) * ramp(t, 47.3, 47.8) + 60 * ramp(t, 55.8, 56.1) * (1 - ramp(t, 56.6, 57.0)), foreR: 10 + 40 * ramp(t, 55.8, 56.1),
    armL: 10, foreL: 0,
    eyes: "open", lookX: 1, brow: 0.5 * (1 - relieved), browTilt: 0.8 * (1 - relieved), sweat: 0.9 * (1 - relieved) * ramp(t, 47.4, 47.9),
    mouth: uTalk > 0.05 ? "open" : relieved > 0.5 ? "grin" : "sad", open: uTalk, blink: blinkAt(t, 2),
    headRot: relieved > 0.5 ? 3 * Math.sin(t * 6) * (uTalk > 0.02 ? 1 : 0) : 0,
  };
  /* money note flies from uncle's hand to Kimu's hand */
  const noteK2 = ramp(t, 55.9, 56.5);
  const notePos = { x: 300 + 170 * noteK2, y: 1470 - 20 * Math.sin(noteK2 * Math.PI) - 10 * noteK2 };
  /* meter-board wires */
  const bx = 330, by = 1260;
  const lerpN = (a: number, b: number) => a + (b - a) * fixed;
  const tipRx = lerpN(4, -36), tipLx = lerpN(-4, 36), tipY = lerpN(172, 182);
  return (
    <CamG cam={cam}>
      <StreetBack t={t} lit={lit} />
      {/* meter board + wires */}
      <g transform={`translate(${bx} ${by})`}>
        <MeterBoard t={t} fixT={FIX} />
        <path d={`M-12 90 C-16 120 ${tipRx - 4} 150 ${tipRx} ${tipY}`} stroke="#D84A3A" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d={`M12 90 C16 120 ${tipLx + 4} 150 ${tipLx} ${tipY}`} stroke="#222" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d={`M${tipRx - 3} ${tipY - 4} L${tipRx} ${tipY + 10} M${tipLx + 3} ${tipY - 4} L${tipLx} ${tipY + 10}`} stroke="#E8A860" strokeWidth="5" strokeLinecap="round" />
        {fixed > 0.5 && <g><rect x="-28" y="118" width="56" height="16" rx="5" fill="#F2C94C" /><path d="M-24 118 L-14 134 M-8 118 L2 134 M8 118 L18 134" stroke="#C99A1A" strokeWidth="3" /></g>}
        <g transform={`translate(0 ${tipY + 4})`}><Spark t={t} a={50.7} b={53.7} /></g>
      </g>
      <Person spec={UNCLE} x={170} y={1650} scale={0.9} pose={uPose} />
      <Person spec={KIMU} x={kx} y={1650} scale={0.9} pose={kPose} heldR={<g transform="translate(0 4) scale(0.8)"><ToolBag /></g>} />
      {noteK2 > 0 && t < 56.9 && <g transform={`translate(${notePos.x} ${notePos.y}) rotate(${-12 + 10 * noteK2})`}><Note /></g>}
      <Bubble x={330} y={1010} w={420} lines={dlg("uncle1").lines} tx={200} ty={1180} a={bubbleA("uncle1", t)} />
      {/* Mom at the window with a cup of tea */}
      <g>
        <clipPath id="momWin"><rect x="790" y="880" width="190" height="240" /></clipPath>
        <g clipPath="url(#momWin)">
          <rect x="790" y="880" width="190" height="240" fill="#FFE2A8" />
          <Person spec={MOM} x={885} y={1190} scale={0.5} hideLegs pose={{ mouth: ramp(t, 56.6, 57.2) > 0.5 ? "grin" : "smile", eyes: "open", lookX: -1, blink: blinkAt(t, 1.2), brow: 0.2, headRot: 3 * Math.sin(t * 1.2), armL: 30, foreL: 120, armR: 30, foreR: 120 }}
            heldL={<g transform="translate(-14 -6) scale(0.4)"><TeaCup t={t} /></g>} />
        </g>
        <rect x="782" y="872" width="206" height="256" rx="6" fill="none" stroke="#6C8F7E" strokeWidth="14" />
      </g>
    </CamG>
  );
};

/* ====================================================================== */
/*  overlays: hook, narration captions, title                              */
/* ====================================================================== */
const Captions: React.FC<{ t: number }> = ({ t }) => {
  let text = "";
  for (const b of (vo as any).beats) for (const p of b.phrases) if (t >= p.start - 0.05 && t <= p.end + 0.25) text = p.text;
  if (!text) return null;
  let lines = [text];
  if (text.length > 34) {
    const mid = text.length / 2;
    let best = -1;
    for (let i = 0; i < text.length; i++) if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    if (best > 0) lines = [text.slice(0, best), text.slice(best + 1)];
  }
  const wMax = Math.max(...lines.map((l) => l.length)) * 22 + 64;
  const hh = 40 + lines.length * 50;
  return (
    <g transform={`translate(540 ${1790 - (lines.length - 1) * 25})`}>
      <rect x={-wMax / 2} y={-hh / 2} width={wMax} height={hh} rx="40" fill="#0B1230" fillOpacity="0.84" />
      {lines.map((l, i) => <text key={i} x="0" y={-hh / 2 + 56 + i * 50 - 6} textAnchor="middle" fontFamily="Nunito" fontWeight="700" fontSize="40" fill="#fff">{l}</text>)}
    </g>
  );
};

const Overlay: React.FC<{ t: number }> = ({ t }) => {
  const hook = packet.hook;
  const ha = clamp((t - hook.t0) / 0.1) * clamp((hook.t1 - t) / 0.3);
  const chip = clamp((6.0 - t) / 0.5);
  const title = ramp(t, 58.6, 59.2);
  return (
    <g>
      <g opacity={ha} transform="translate(540 190)">
        <rect x="-440" y="-58" width="880" height="116" rx="58" fill="#0B1230" fillOpacity="0.85" stroke="#FF6A5E" strokeWidth="5" />
        <text x="0" y="18" textAnchor="middle" fontFamily="Fredoka" fontWeight="600" fontSize="50" fill="#fff" letterSpacing="1">{hook.text}</text>
      </g>
      <g opacity={chip} transform="translate(54 90)">
        <rect x="0" y="-30" width="560" height="60" rx="30" fill="#fff" fillOpacity="0.92" />
        <text x="28" y="9" fontFamily="Fredoka" fontWeight="600" fontSize="28" fill="#1B2347" letterSpacing="1.5">THE ADVENTURES OF KIMU · S1 E1</text>
      </g>
      <g opacity={title} transform={`translate(540 ${430 + (1 - title) * 30})`}>
        <rect x="-420" y="-110" width="840" height="220" rx="44" fill="#0B1230" fillOpacity="0.88" />
        <text x="0" y="-30" textAnchor="middle" fontFamily="Fredoka" fontWeight="500" fontSize="30" fill="#7FE3FF" letterSpacing="5">THE ADVENTURES OF KIMU · S1 E1</text>
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
  return (
    <AbsoluteFill style={{ background: "#0B1230" }}>
      <style>{FONT_CSS}</style>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {vis(s1) && <g opacity={sec(t, s1.t0, s1.t1, true)}><RoomScene t={t} /></g>}
        {vis(s2) && <g opacity={sec(t, s2.t0, s2.t1)}><TerraceScene t={t} /></g>}
        {vis(s3) && <g opacity={sec(t, s3.t0, s3.t1)}><TeachScene t={t} /></g>}
        {vis(s4) && <g opacity={sec(t, s4.t0, s4.t1, false, true)}><StreetScene t={t} /></g>}
        <g transform="translate(540 380)" opacity={ramp(t, 50.5, 50.9) * (1 - ramp(t, 53.0, 53.4))}><Tag text="Short circuit!" a={1} color="#FFC857" /></g>
        <Captions t={t} />
        <Overlay t={t} />
      </svg>
      {withAudio && <Audio src={staticFile("studio/s1e01/mix.wav")} />}
    </AbsoluteFill>
  );
};
