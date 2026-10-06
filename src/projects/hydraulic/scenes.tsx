import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Car, Gear, Headline, Label, Layer, Readout, Tag, clamp01, ioB, meshPhase } from "../gearbox/kit";

/**
 * Drawn to scale: 11.2 px = 1 cm. Pump piston 10 cm² (Ø 3.57 cm → 40 px), lift piston 1,000 cm² (Ø 35.7 cm → 400 px).
 * 200 N on the pump → 200 kPa (2 bar) → 20,000 N on the lift ≈ 2,000 kg. A 10 cm pump stroke lifts the car 1 mm.
 */
export const T = { pascal: 72, formula: 200, area: 283, nums: 440, catchB: 540, hero: 665, end: 806, total: 900 };
export const CUTS = [0, 72, 200, 283, 440, 540, 665, 806];
const PX_CM = 11.2;
const SX = 190, SW = 40, BX = 700, BW = 400; // cylinder centres / bores
const PIPE_Y = 1290, PIPE_H = 44, S_TOP0 = 880, B_TOP0 = 1010;
const FLUID = "#2B9FD8", P_COL = K.amber;
const RES = { x: 40, w: 70, y: 1080 };

/** Pump strokes completed by frame g (hero), and the pump piston drop (px) inside the current stroke. */
const pump = (g: number) => {
  if (g < T.hero + 6) return { strokes: 0, drop: 0, down: false };
  const h = g - T.hero - 6;
  // slow strokes first (14 frames each), then time-lapse up to 200 strokes
  const s = h < 42 ? 0.5 + h / 14 : 3.5 + Math.pow((h - 42) / 93, 1.6) * 196.5; // starts mid-stroke (piston down) to continue the last push
  const strokes = Math.min(200, s);
  const ph = strokes % 1;
  const slow = h < 42;
  const drop = slow ? (ph < 0.5 ? ph * 2 : (1 - ph) * 2) * 110 : 55 + 55 * Math.sin(h * 2.3);
  return { strokes, drop, down: ph < 0.5 };
};

export const HydraulicShot: React.FC = () => {
  const g = useCurrentFrame();
  // single 10 cm push during the explanation (pascal → catch)
  const push1 = io(g, [76, 96], [0, 0.25], easeOut) + io(g, [583, 630], [0, 0.75], easeInOut);
  const pu = pump(g);
  const sDrop = g < T.hero ? push1 * 110 : pu.drop;
  const lift = (g < T.hero ? push1 * 1.12 : 1.12 + Math.floor(pu.strokes) * 1.12 + (pu.down ? 0 : 0)); // px (1 mm per stroke)
  const sTop = S_TOP0 + sDrop, bTop = B_TOP0 - lift;
  const pressure = 1; // the car's weight keeps the fluid at 2 bar; the hand holds it
  const pumpBar = g < T.hero ? 2 : pu.down ? 2 : 0; // on the upstroke the pump side opens to the tank
  const ripple = g >= 76 && g < 200 ? (g - 76) : -1;
  const equal = io(g, [121, 132], [0, 1]) * (1 - io(g, [196, 206], [0, 1]));
  const bigF = io(g, [359, 380], [0, 1], easeOut);
  const fade = io(g, [798, 808], [0, 1]);
  const fluidPath = `M ${SX - SW / 2} ${sTop + 26} L ${SX - SW / 2} ${PIPE_Y + PIPE_H} L ${BX + BW / 2} ${PIPE_Y + PIPE_H} L ${BX + BW / 2} ${bTop + 30} L ${BX - BW / 2} ${bTop + 30} L ${BX - BW / 2} ${PIPE_Y} L ${SX + SW / 2} ${PIPE_Y} L ${SX + SW / 2} ${sTop + 26} Z`;
  const wallPts: [number, number, number, number][] = [];
  for (let y = sTop + 60; y < PIPE_Y; y += 70) { wallPts.push([SX - SW / 2, y, -1, 0]); wallPts.push([SX + SW / 2, y, 1, 0]); }
  for (let x = SX + 70; x < BX - BW / 2; x += 80) { wallPts.push([x, PIPE_Y, 0, -1]); wallPts.push([x, PIPE_Y + PIPE_H, 0, 1]); }
  for (let y = bTop + 70; y < PIPE_Y; y += 70) { wallPts.push([BX - BW / 2, y, -1, 0]); wallPts.push([BX + BW / 2, y, 1, 0]); }
  for (let x = BX - BW / 2 + 60; x < BX + BW / 2; x += 80) wallPts.push([x, bTop + 30, 0, -1]);
  const hero = g >= T.hero;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Headline f={g} lines={["One hand.", "*Two tonnes.*"]} at={-30} exitAt={70} size={100} />
      <Headline f={g} lines={["Pressure spreads", "*equally*"]} at={76} exitAt={196} size={92} />
      <Headline f={g} lines={["P = F ÷ *A*"]} at={203} exitAt={279} size={110} />
      <Headline f={g} lines={["100× the area", "= *100× the force*"]} at={287} exitAt={436} size={88} />
      <Headline f={g} lines={["20 kg in.", "*2,000 kg out.*"]} at={447} exitAt={536} size={96} />
      <Headline f={g} lines={["The catch:", "*100× the distance*"]} at={545} exitAt={660} size={88} accent={K.red} />
      <Headline f={g} lines={["Pump, pump, pump…"]} at={671} exitAt={765} size={92} />
      <Headline f={g} lines={["That's *hydraulics.*"]} at={769} size={100} />
      <Layer>
        {/* reservoir + check valves (shown in the hero) */}
        <g opacity={io(g, [T.hero - 10, T.hero + 6], [0, 1])}>
          <rect x={RES.x} y={RES.y} width={RES.w} height={PIPE_Y + PIPE_H - RES.y} fill={FLUID} fillOpacity={0.25} stroke={K.line} strokeWidth={3} />
          <text x={RES.x + RES.w / 2} y={RES.y - 14} textAnchor="middle" fontFamily={K.mono} fontSize={18} fill={K.muted}>TANK</text>
          <circle cx={(RES.x + RES.w + SX - SW / 2) / 2} cy={PIPE_Y + 20} r={11} fill={!pu.down && hero ? K.green : K.bgDeep} stroke={K.text} strokeWidth={3} />
          <circle cx={SX + SW / 2 + 40} cy={PIPE_Y + 20} r={11} fill={pu.down && hero ? K.green : K.bgDeep} stroke={K.text} strokeWidth={3} />
          <path d={`M ${RES.x + RES.w} ${PIPE_Y} L ${SX - SW / 2} ${PIPE_Y} M ${RES.x + RES.w} ${PIPE_Y + PIPE_H} L ${SX - SW / 2} ${PIPE_Y + PIPE_H}`} stroke={K.line} strokeWidth={3} />
          <text x={SX + SW / 2 + 40} y={PIPE_Y + 80} textAnchor="middle" fontFamily={K.mono} fontSize={16} fill={K.muted}>CHECK VALVES</text>
        </g>
        {/* fluid */}
        <path d={fluidPath} fill={FLUID} fillOpacity={0.35 + 0.25 * pressure} />
        {pressure > 0.05 && <path d={fluidPath} fill={P_COL} fillOpacity={0.14 * pressure} />}
        {ripple >= 0 && [0, 1, 2].map((k) => {
          const r = ((ripple * 9 + k * 160) % 520);
          return <circle key={k} cx={SX} cy={sTop + 40} r={r} fill="none" stroke={P_COL} strokeWidth={4} opacity={0.5 * (1 - r / 520)} clipPath="url(#fluidclip)" />;
        })}
        <clipPath id="fluidclip"><path d={fluidPath} /></clipPath>
        {/* equal-pressure arrows on every wall */}
        {equal > 0 && wallPts.map(([x, y, nx, ny], i) => (
          <g key={i} opacity={equal}>
            <line x1={x - nx * 4} y1={y - ny * 4} x2={x + nx * 26} y2={y + ny * 26} stroke={P_COL} strokeWidth={4} strokeLinecap="round" />
            <path d={`M ${x + nx * 34} ${y + ny * 34} l ${-nx * 12 + ny * 9} ${-ny * 12 - nx * 9} l ${ny * -18} ${nx * 18} Z`} fill={P_COL} />
          </g>
        ))}
        {/* walls */}
        <path d={`M ${SX - SW / 2} ${S_TOP0 - 120} L ${SX - SW / 2} ${PIPE_Y + PIPE_H} L ${BX + BW / 2} ${PIPE_Y + PIPE_H} L ${BX + BW / 2} ${B_TOP0 - 280} M ${SX + SW / 2} ${S_TOP0 - 120} L ${SX + SW / 2} ${PIPE_Y} L ${BX - BW / 2} ${PIPE_Y} L ${BX - BW / 2} ${B_TOP0 - 280}`} stroke={K.line} strokeWidth={6} fill="none" strokeLinejoin="round" />
        {/* pump piston + rod + handle */}
        <rect x={SX - SW / 2 + 3} y={sTop} width={SW - 6} height={26} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
        <line x1={SX} y1={sTop} x2={SX} y2={sTop - 150} stroke={K.text} strokeWidth={8} />
        <rect x={SX - 50} y={sTop - 164} width={100} height={16} rx={6} fill={K.text} />
        {(g < T.hero || pu.down) && (
          <g opacity={hero ? 0.7 : 1}>
            <line x1={SX} y1={sTop - 290} x2={SX} y2={sTop - 186} stroke={K.amber} strokeWidth={10} strokeLinecap="round" />
            <path d={`M ${SX} ${sTop - 168} l -20 -28 l 40 0 Z`} fill={K.amber} />
          </g>
        )}
        {/* lift piston + car */}
        <rect x={BX - BW / 2 + 4} y={bTop} width={BW - 8} height={30} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
        <g transform={`translate(${BX - 300 * 0.7} ${bTop - 190 * 0.7}) scale(0.7)`}><Car draw={1} wheelRot={0} /></g>
        {bigF > 0 && (
          <g opacity={bigF}>
            <line x1={BX} y1={bTop + 200} x2={BX} y2={bTop + 200 - 150 * bigF} stroke={K.green} strokeWidth={26} strokeLinecap="round" />
            <path d={`M ${BX} ${bTop + 200 - 150 * bigF - 46} l -40 46 l 80 0 Z`} fill={K.green} />
          </g>
        )}
        {/* catch: distance dimension lines */}
        {g >= 583 && g < T.hero && (
          <g opacity={io(g, [590, 600], [0, 1]) * (1 - io(g, [655, 665], [0, 1]))}>
            <line x1={SX + 60} y1={S_TOP0} x2={SX + 60} y2={S_TOP0 + 110 * clamp01(push1 / 0.999)} stroke={K.red} strokeWidth={4} />
            <path d={`M ${SX + 60} ${S_TOP0 + 110 * push1 + 4} l -10 -16 l 20 0 Z`} fill={K.red} />
          </g>
        )}
      </Layer>
      {/* gauges */}
      {[{ x: 360, lbl: "PUMP SIDE" }, { x: 1000, lbl: "LIFT SIDE" }].map((gg, i) => (
        <div key={i} style={{ position: "absolute", left: gg.x - (i ? 130 : 60), top: 1385, width: 190, textAlign: "center", fontFamily: K.mono, opacity: (g < 4 ? 1 : 1) * (1 - fade) }}>
          <div style={{ fontSize: 17, color: K.muted, letterSpacing: 2 }}>{gg.lbl}</div>
          <Readout value={`${(i === 0 ? pumpBar : 2).toFixed(1)} bar`} size={42} color={i === 0 && pumpBar < 1 ? K.muted : K.amber} />
        </div>
      ))}
      <Label f={g} at={-40} text="PUMP Ø 3.6 cm · LIFT Ø 36 cm" x={540} y={1488} size={18} align="center" color={K.muted} out={T.hero} />
      {/* formula panel */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 628, textAlign: "center", fontFamily: K.mono, fontSize: 28, color: K.text, opacity: io(g, [242, 252], [0, 1]) * (1 - io(g, [436, 446], [0, 1])) }}>
        200 N ÷ 10 cm² = <b style={{ color: K.amber }}>20 N/cm²</b>
        <div style={{ marginTop: 10, opacity: bigF }}>20 N/cm² × 1,000 cm² = <b style={{ color: K.green }}>20,000 N</b></div>
      </div>
      <Tag f={g} at={292} text="10 cm²" x={SX + 110} y={S_TOP0 - 110} color={K.line} size={24} out={440} />
      <Tag f={g} at={300} text="1,000 cm²" x={BX} y={B_TOP0 + 120} color={K.line} solid size={26} out={440} />
      <Tag f={g} at={449} text="20 kg PUSH" x={SX + 170} y={S_TOP0 - 170} color={K.amber} solid size={26} out={540} />
      <Tag f={g} at={504} text="2,000 kg LIFTED" x={BX} y={B_TOP0 - 200} color={K.green} solid size={28} out={540} />
      <Tag f={g} at={600} text="PUSH 10 cm ↓" x={SX + 150} y={S_TOP0 + 60} color={K.red} solid size={24} out={662} />
      <Tag f={g} at={612} text="LIFTS 1 mm ↑" x={BX} y={B_TOP0 - 200} color={K.red} size={26} out={662} />
      <Label f={g} at={622} text="WORK IN = WORK OUT · 200 N × 10 cm = 20,000 N × 1 mm" x={540} y={600} size={19} align="center" color={K.text} out={662} />
      {/* hero counters */}
      {hero && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 590, display: "flex", justifyContent: "center", gap: 70, fontFamily: K.mono, opacity: io(g, [T.hero + 4, T.hero + 14], [0, 1]) }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, color: K.muted, letterSpacing: 3 }}>PUMP STROKES</div><Readout value={String(Math.floor(pu.strokes))} size={64} color={K.amber} /></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, color: K.muted, letterSpacing: 3 }}>CAR RAISED</div><Readout value={`${(Math.floor(pu.strokes) / 10).toFixed(1)} cm`} size={64} color={K.green} /></div>
        </div>
      )}
      <Label f={g} at={T.hero + 50} text="TIME-LAPSE · 1 mm PER STROKE" x={540} y={1488} size={18} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── end card ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const fade = 1 - io(f, [86, 93], [0, 1]);
  const m = 18, cd = (m * 23) / 2, cx = 540 - cd * 0.17, cy = 1060 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Headline f={f} lines={["Which machine", "*next?*"]} at={2} top={420} size={100} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1000px", opacity: clamp01(p) }}>
        <Gear N={14} m={m} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
      </div>
      <Tag f={f} at={16} text="COMMENT BELOW  ↓" x={540} y={1300} color={K.amber} solid size={32} />
      <Label f={f} at={20} text="AKS PRODUCTIONS" x={540} y={1385} size={30} align="center" color={K.text} />
      <Label f={f} at={24} text="FOLLOW FOR PART 08 · THE REFRIGERATOR" x={540} y={1440} size={20} align="center" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.amber }}>HOW IT WORKS · 07</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 124, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>One hand.</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 140, lineHeight: 1, color: K.amber }}>Two tonnes.</div>
    </div>
    <Layer>
      <g transform="translate(0 80)">
        <path d={`M ${SX - SW / 2} ${S_TOP0 + 26} L ${SX - SW / 2} ${PIPE_Y + PIPE_H} L ${BX + BW / 2} ${PIPE_Y + PIPE_H} L ${BX + BW / 2} ${B_TOP0 + 30} L ${BX - BW / 2} ${B_TOP0 + 30} L ${BX - BW / 2} ${PIPE_Y} L ${SX + SW / 2} ${PIPE_Y} L ${SX + SW / 2} ${S_TOP0 + 26} Z`} fill={FLUID} fillOpacity={0.5} />
        <path d={`M ${SX - SW / 2} ${S_TOP0 - 120} L ${SX - SW / 2} ${PIPE_Y + PIPE_H} L ${BX + BW / 2} ${PIPE_Y + PIPE_H} L ${BX + BW / 2} ${B_TOP0 - 280} M ${SX + SW / 2} ${S_TOP0 - 120} L ${SX + SW / 2} ${PIPE_Y} L ${BX - BW / 2} ${PIPE_Y} L ${BX - BW / 2} ${B_TOP0 - 280}`} stroke={K.line} strokeWidth={6} fill="none" />
        <rect x={BX - BW / 2 + 4} y={B_TOP0} width={BW - 8} height={30} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
        <g transform={`translate(${BX - 210} ${B_TOP0 - 133}) scale(0.7)`}><Car draw={1} wheelRot={0} /></g>
        <rect x={SX - 17} y={S_TOP0} width={34} height={26} fill={K.bgDeep} stroke={K.text} strokeWidth={3} />
        <line x1={SX} y1={S_TOP0 - 200} x2={SX} y2={S_TOP0 - 20} stroke={K.amber} strokeWidth={10} />
        <path d={`M ${SX} ${S_TOP0 - 4} l -20 -28 l 40 0 Z`} fill={K.amber} />
      </g>
    </Layer>
  </>
);

export { easeInOut, PX_CM };
