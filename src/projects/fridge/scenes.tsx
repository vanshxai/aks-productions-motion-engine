import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Layer, Tag, clamp01, ioB, meshPhase } from "../gearbox/kit";

/** Global frames from public/projects/fridge/vo.json. Keep in sync with soundtrack.py. */
export const T = { liquid: 104, evap: 192, comp: 322, cond: 415, valve: 548, hero: 658, end: 832, total: 900 };
export const CUTS = [0, 104, 192, 322, 415, 548, 658, 832];
const COLD = "#4FA8FF", COOL = "#8BE2FF", HOT = "#FF7A3D", WARM = K.amber;

/* refrigerant loop (screen coords): valve → evaporator → suction → compressor → condenser → back to valve */
const P: [number, number][] = [[745, 690], [700, 700], [590, 700], [590, 730], [700, 730], [700, 760], [590, 760], [590, 790], [700, 790], [700, 820], [590, 820], [590, 850], [700, 850], [765, 870], [765, 1330], [835, 1360], [905, 1320], [950, 1260],
  [800, 1260], [800, 1200], [950, 1200], [950, 1140], [800, 1140], [800, 1080], [950, 1080], [950, 1020], [800, 1020], [800, 960], [950, 960], [950, 900], [800, 900], [800, 840], [950, 840], [950, 780], [800, 780], [800, 720], [745, 690]];
const SEG = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1]));
const LEN = SEG.reduce((a, b) => a + b, 0);
const CUM = SEG.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1] + s], [0]);
const at = (u: number) => {
  const d = (((u % 1) + 1) % 1) * LEN;
  let i = 0; while (i < SEG.length - 1 && CUM[i + 1] < d) i++;
  const t = (d - CUM[i]) / SEG[i];
  return { x: P[i][0] + (P[i + 1][0] - P[i][0]) * t, y: P[i][1] + (P[i + 1][1] - P[i][1]) * t, d };
};
// zone boundaries along the path (by distance)
const D_EVAP_END = CUM[12], D_COMP_IN = CUM[14], D_COMP_OUT = CUM[16], D_COND_HALF = CUM[26];
type St = { col: string; r: number; name: string };
const stateAt = (d: number): St => {
  if (d < D_EVAP_END * 0.55) return { col: COLD, r: 8, name: "cold liquid" };
  if (d < D_EVAP_END) return { col: COLD, r: 6, name: "boiling" };
  if (d < D_COMP_IN) return { col: COOL, r: 4.5, name: "cool gas" };
  if (d < D_COMP_OUT) return { col: HOT, r: 4.5, name: "hot gas" };
  if (d < D_COND_HALF) return { col: HOT, r: 4.5, name: "hot gas" };
  return { col: WARM, r: 8, name: "warm liquid" };
};
const loopPath = "M " + P.map((p) => p.join(" ")).join(" L ");

/** Highlight: 0 all, 1 evaporator, 2 compressor, 3 condenser, 4 valve */
const focus = (g: number) => (g < T.evap ? 0 : g < T.comp ? 1 : g < T.cond ? 2 : g < T.valve ? 3 : g < T.hero ? 4 : 0);

const Wavy: React.FC<{ x: number; y: number; dx: number; dy: number; col: string; o: number; g: number }> = ({ x, y, dx, dy, col, o, g }) => {
  if (o <= 0.01) return null;
  const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const pts = Array.from({ length: 13 }).map((_, i) => {
    const t = i / 12, w = Math.sin(t * Math.PI * 3 - g * 0.4) * 7;
    return `${x + dx * t + nx * w} ${y + dy * t + ny * w}`;
  });
  const ex = x + dx, ey = y + dy;
  return (
    <g opacity={o}>
      <path d={"M " + pts.join(" L ")} stroke={col} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d={`M ${ex + ux * 14} ${ey + uy * 14} L ${ex - uy * 10} ${ey + ux * 10} L ${ex + uy * 10} ${ey - ux * 10} Z`} fill={col} />
    </g>
  );
};

export const FridgeShot: React.FC = () => {
  const g = useCurrentFrame();
  const fo = focus(g);
  const dim = (k: number) => (fo === 0 || fo === k ? 1 : 0.35);
  const flowU = g < T.hero ? g * 0.0028 : T.hero * 0.0028 + (g - T.hero) * 0.0028 + (g - T.hero) ** 2 * 0.000025;
  const fade = io(g, [824, 834], [0, 1]);
  const NP = 120;
  const heatIn = (g < T.liquid ? 0.6 : 0) + io(g, [270, 282], [0, 1]) * (1 - io(g, [318, 326], [0, 1])) + (g >= T.hero ? 0.7 : 0);
  const heatOut = (g < T.liquid ? 1 : 0) + io(g, [421, 433], [0, 1]) * (1 - io(g, [540, 550], [0, 1])) + (g >= T.hero ? 0.8 : 0);
  const compPulse = 1 + 0.04 * Math.sin(g * 1.2) * (fo === 2 || g >= T.hero ? 1 : 0.3);
  const valveFlash = io(g, [553, 560], [0, 1]) * (1 - io(g, [600, 620], [0, 1]));
  const heroTag = (at0: number) => g >= at0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Headline f={g} lines={["Fridges don't", "*make cold*"]} at={-30} exitAt={60} size={100} />
      <Headline f={g} lines={["They *pump heat out*"]} at={66} exitAt={100} size={88} />
      <Headline f={g} lines={["A liquid that boils", "*below freezing*"]} at={108} exitAt={188} size={84} />
      <Headline f={g} lines={["1 · *Boil*"]} at={196} exitAt={318} size={104} accent={COOL} />
      <Headline f={g} lines={["2 · *Squeeze*"]} at={328} exitAt={411} size={104} accent={HOT} />
      <Headline f={g} lines={["3 · *Release*"]} at={421} exitAt={544} size={104} />
      <Headline f={g} lines={["4 · *Expand*"]} at={553} exitAt={652} size={104} accent={COOL} />
      <Headline f={g} lines={["*Boil.*"]} at={662} exitAt={690} size={104} accent={COOL} />
      <Headline f={g} lines={["*Squeeze.*"]} at={694} exitAt={725} size={104} accent={HOT} />
      <Headline f={g} lines={["*Release.*"]} at={729} exitAt={761} size={104} />
      <Headline f={g} lines={["*Expand.*"]} at={765} exitAt={798} size={104} accent={COOL} />
      <Headline f={g} lines={["That's a *fridge.*"]} at={803} size={100} />
      <Layer>
        {/* kitchen room tint behind the back */}
        <rect x={760} y={640} width={260} height={800} fill={HOT} opacity={0.03 + 0.05 * clamp01(heatOut)} />
        {/* cabinet */}
        <g opacity={fo === 0 || fo === 1 ? 1 : 0.55}>
          <rect x={250} y={650} width={490} height={780} rx={18} fill={K.line} fillOpacity={0.05} stroke={K.line} strokeWidth={5} />
          <rect x={270} y={668} width={450} height={210} rx={8} fill={COLD} fillOpacity={0.1} stroke={K.lineDim} strokeWidth={3} />
          <rect x={270} y={896} width={450} height={514} rx={8} fill={COOL} fillOpacity={0.06} stroke={K.lineDim} strokeWidth={3} />
          {[1040, 1180, 1310].map((y) => <line key={y} x1={276} y1={y} x2={600} y2={y} stroke={K.lineDim} strokeWidth={3} />)}
          {/* food */}
          <rect x={300} y={980} width={46} height={60} rx={6} fill="none" stroke={K.text} strokeWidth={3} />
          <path d="M 380 1040 L 380 975 Q 380 960 392 955 L 392 935 L 404 935 L 404 955 Q 416 960 416 975 L 416 1040 Z" fill="none" stroke={K.text} strokeWidth={3} />
          <ellipse cx={470} cy={1160} rx={44} ry={20} fill="none" stroke={K.text} strokeWidth={3} />
          <rect x={300} y={1235} width={90} height={75} rx={8} fill="none" stroke={K.text} strokeWidth={3} />
          <rect x={300} y={760} width={70} height={60} rx={6} fill="none" stroke={K.text} strokeWidth={3} />
          <line x1={252} y1={700} x2={252} y2={860} stroke={K.text} strokeWidth={8} strokeLinecap="round" />
          <line x1={252} y1={940} x2={252} y2={1180} stroke={K.text} strokeWidth={8} strokeLinecap="round" />
        </g>
        {/* tubing */}
        <path d={loopPath} fill="none" stroke={K.lineDim} strokeWidth={16} strokeLinejoin="round" opacity={0.6} />
        <path d={loopPath} fill="none" stroke={K.bgDeep} strokeWidth={10} strokeLinejoin="round" />
        {/* component highlights */}
        <rect x={575} y={688} width={140} height={178} rx={10} fill="none" stroke={COOL} strokeWidth={3} strokeDasharray="10 8" opacity={dim(1) * (fo === 1 ? 1 : 0.3)} />
        <rect x={785} y={708} width={180} height={566} rx={10} fill="none" stroke={HOT} strokeWidth={3} strokeDasharray="10 8" opacity={dim(3) * (fo === 3 ? 1 : 0.3)} />
        {/* compressor */}
        <g opacity={dim(2)} transform={`translate(860 1365) scale(${compPulse}) translate(-860 -1365)`}>
          {fo === 2 && <circle cx={860} cy={1365} r={80} fill={HOT} opacity={0.25} style={{ filter: "blur(14px)" }} />}
          <path d="M 800 1410 L 800 1350 Q 800 1300 860 1300 Q 920 1300 920 1350 L 920 1410 Z" fill={K.bgDeep} stroke={fo === 2 ? HOT : K.text} strokeWidth={4} />
          <line x1={790} y1={1412} x2={930} y2={1412} stroke={K.text} strokeWidth={5} />
          <text x={860} y={1372} textAnchor="middle" fontFamily={K.mono} fontSize={18} fill={K.muted}>COMP</text>
        </g>
        {/* valve / capillary */}
        <g opacity={dim(4)}>
          {valveFlash > 0 && <circle cx={745} cy={690} r={46} fill={COOL} opacity={0.4 * valveFlash} style={{ filter: "blur(10px)" }} />}
          <path d="M 728 678 L 762 702 L 762 678 L 728 702 Z" fill={K.bgDeep} stroke={fo === 4 ? COOL : K.text} strokeWidth={3} />
        </g>
        {/* refrigerant particles */}
        {Array.from({ length: NP }).map((_, i) => {
          const u = i / NP + flowU;
          const p = at(u), st = stateAt(p.d);
          const z = p.d < D_EVAP_END + 40 ? 1 : p.d < D_COMP_OUT ? 2 : p.d < CUM[35] ? 3 : 4;
          const bub = st.name === "boiling" ? Math.sin(g * 0.8 + i) * 3 : 0;
          return <circle key={i} cx={p.x + bub} cy={p.y} r={st.r} fill={st.col} opacity={(fo === 0 || fo === z ? 1 : 0.4)} />;
        })}
        {/* heat in (from food) and heat out (to kitchen) */}
        {[[350, 990], [400, 960], [480, 1140], [340, 1240], [340, 780]].map(([x, y], i) => (
          <Wavy key={i} x={x + 10} y={y} dx={560 - x - 10} dy={(760 + (i % 3) * 30) - y} col={HOT} o={clamp01(heatIn) * 0.9} g={g + i * 7} />
        ))}
        {[760, 880, 1000, 1120, 1240].map((y, i) => (
          <Wavy key={i} x={965} y={y} dx={80} dy={-20 + (i % 2) * 40} col={HOT} o={clamp01(heatOut)} g={g + i * 5} />
        ))}
      </Layer>
      {/* temperatures */}
      <div style={{ position: "absolute", left: 290, top: 830, fontFamily: K.mono, fontSize: 24, color: COLD, fontWeight: 700 }}>−18 °C</div>
      <div style={{ position: "absolute", left: 470, top: 1360, fontFamily: K.mono, fontSize: 24, color: COOL, fontWeight: 700 }}>4 °C</div>
      <div style={{ position: "absolute", left: 880, top: 660, fontFamily: K.mono, fontSize: 20, color: HOT }}>ROOM</div>
      {/* beat labels */}
      <Tag f={g} at={-30} text="HEAT OUT →" x={900} y={600} color={HOT} solid size={24} out={100} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: K.mono, fontSize: 24, color: K.text, opacity: io(g, [126, 136], [0, 1]) * (1 - io(g, [184, 192], [0, 1])) }}>
        REFRIGERANT R600a BOILS AT <b style={{ color: COLD }}>≈ −12 °C</b>
      </div>
      <Tag f={g} at={226} text="EVAPORATOR" x={645} y={630} color={COOL} size={22} out={318} />
      <Tag f={g} at={272} text="HEAT FROM FOOD →" x={420} y={900} color={HOT} size={20} out={318} />
      <Tag f={g} at={334} text="LOW → HIGH PRESSURE" x={720} y={1470} color={HOT} size={22} out={411} />
      <Tag f={g} at={386} text="HOT GAS" x={960} y={1300} color={HOT} solid size={22} out={411} />
      <Tag f={g} at={426} text="CONDENSER" x={875} y={630} color={HOT} size={22} out={544} />
      <Tag f={g} at={506} text="GAS → LIQUID" x={870} y={1470} color={WARM} solid size={22} out={544} />
      <Tag f={g} at={556} text="EXPANSION VALVE" x={720} y={600} color={COOL} solid size={22} out={652} />
      <Tag f={g} at={614} text="PRESSURE DROPS → ICE COLD" x={540} y={1470} color={COOL} size={22} out={652} />
      {/* hero: four words around the loop */}
      {heroTag(662) && <Tag f={g} at={662} text="BOIL" x={560} y={630} color={COOL} solid size={30} />}
      {heroTag(694) && <Tag f={g} at={694} text="SQUEEZE" x={860} y={1480} color={HOT} solid size={30} />}
      {heroTag(729) && <Tag f={g} at={729} text="RELEASE" x={985} y={1000} color={WARM} solid size={26} />}
      {heroTag(765) && <Tag f={g} at={765} text="EXPAND" x={880} y={630} color={COOL} solid size={26} />}
      <Label f={g} at={668} text="LOW PRESSURE · COLD SIDE   |   HIGH PRESSURE · HOT SIDE" x={540} y={1530} size={16} align="center" />
    </div>
  );
};

/* ────────── end card ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const fade = 1 - io(f, [62, 68], [0, 1]);
  const m = 18, cd = (m * 23) / 2, cx = 540 - cd * 0.17, cy = 1060 + cd * 0.29, d3 = (-120 * Math.PI) / 180;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Headline f={f} lines={["Which machine", "*next?*"]} at={2} top={420} size={100} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "540px 1000px", opacity: clamp01(p) }}>
        <Gear N={14} m={m} x={cx} y={cy} rot={a} glow={0.6} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd} y={cy} rot={meshPhase(9, 0) - (a * 14) / 9} dashPitch={false} />
        <Gear N={9} m={m} x={cx + cd * Math.cos(d3)} y={cy + cd * Math.sin(d3)} rot={meshPhase(9, d3) + (14 / 9) * d3 - (a * 14) / 9} dashPitch={false} />
      </div>
      <Tag f={f} at={14} text="COMMENT BELOW  ↓" x={540} y={1300} color={K.amber} solid size={32} />
      <Label f={f} at={18} text="AKS PRODUCTIONS" x={540} y={1385} size={30} align="center" color={K.text} />
      <Label f={f} at={22} text="FOLLOW FOR PART 09 · THE LOCK AND KEY" x={540} y={1440} size={20} align="center" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.amber }}>HOW IT WORKS · 08</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 116, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>Fridges don't</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 140, lineHeight: 1, color: COOL }}>make cold</div>
    </div>
    <Layer>
      <g transform="translate(-30 160)">
        <rect x={250} y={650} width={490} height={780} rx={18} fill={K.line} fillOpacity={0.05} stroke={K.line} strokeWidth={5} />
        <rect x={270} y={668} width={450} height={210} rx={8} fill={COLD} fillOpacity={0.12} stroke={K.lineDim} strokeWidth={3} />
        <path d={loopPath} fill="none" stroke={K.lineDim} strokeWidth={16} strokeLinejoin="round" opacity={0.6} />
        {Array.from({ length: 120 }).map((_, i) => { const p = at(i / 120), st = stateAt(p.d); return <circle key={i} cx={p.x} cy={p.y} r={st.r} fill={st.col} />; })}
        {[760, 880, 1000, 1120, 1240].map((y, i) => <Wavy key={i} x={965} y={y} dx={80} dy={-20 + (i % 2) * 40} col={HOT} o={1} g={i * 5} />)}
      </g>
    </Layer>
  </>
);

export { easeInOut, easeOut };
