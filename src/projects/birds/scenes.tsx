import React from "react";
import { useCurrentFrame } from "remotion";
import { easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Headline, clamp01, ioB, W, H } from "../gearbox/kit";
import { Wire3D, project, V3, WireLine, WireView } from "../../engine/wire3d";

/**
 * HOW IT WORKS #22 — Why don't birds get electrocuted on power lines?     30 s · 1080×1920 · 30 fps · 900 frames
 * HIT-STYLE: frame 0 is a finished hook (question headline + wireframe pylon with birds on the lines). Voice starts at 0.1 s.
 * House rule: no end card — last picture holds, a small AKS PRODUCTIONS tag (EndTag) fades in over the last second.
 *
 * BEATS PLAN — VO phrases: public/projects/birds/vo.json (frames @30)
 *    3 hook   "Birds sit on power lines all day and never get zapped."   pylon + birds on the lines
 *  110        "Why?"
 *  127 diff   "Electricity only flows when there's a voltage difference."  ball on flat ground (same level, no flow) vs ball on a slope (flow)
 *  235        "Like water, it needs a slope."                              water analogy highlighted
 *  298 one    "A bird on one wire touches just one voltage."               bird on ONE wire
 *  398        "Both feet are at the same level."                           two equal voltage bars under the feet, SAME VOLTAGE
 *  448 stay   "So the current stays in the wire."                          current arrows run along the wire, past the bird
 *  512        "The wire is the easy path."                                 two meters: through the wire vs through the bird (illustration)
 *  559 two    "But touch two wires,"                                       big bird bridges two live wires -> red path
 *  603        "or a wire and the pole,"                                    path wire -> bird -> pole (ground)
 *  647        "and it's a different story."                                red DIFFERENT VOLTAGES flash
 *  686 big    "That's why big birds are most at risk,"                     small bird can't reach both wires; big bird can
 *  751        "and why crews fit covers."                                  insulating covers on the wires
 *  794 end    "It's not about the bird. It's about the difference."        recap: same voltage = safe, different = danger
 *
 * Facts on screen (sources in the delivery notes): bird is hurt when it bridges two energized parts, or an energized part and a grounded one;
 * on a single wire it does not complete a circuit (APLIC FAQ, USFWS); bigger wingspans are the main concern, small birds too small to bridge conductors (APLIC FAQ);
 * covers / separation are the standard fixes (APLIC FAQ, USFWS). Gauges/arrows are ILLUSTRATIONS (tagged SIMPLIFIED SCHEMATIC). No voltage numbers shown except ground = 0 V.
 */

export const T = { diff: 127, one: 298, stay: 448, two: 559, big: 686, end: 794, total: 900 };
export const CUTS = [0, 127, 298, 448, 559, 686, 794];
export const CUE = { why: 110, water: 235, feet: 398, easy: 512, pole: 603, story: 647, small: 686, covers: 751, nota: 794, diffl: 846 };

const AM = K.amber, LN = K.line, DIM = K.lineDim, MU = K.muted, GR = K.green, RD = K.red, WH = K.text;
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 24} letterSpacing={o.ls ?? (o.size ?? 24) * 0.08} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);
const Panel: React.FC<{ o: number; a: string; b: React.ReactNode; c?: string }> = ({ o, a, b, c }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1412, height: 138, opacity: o, borderRadius: 12, border: `2px solid ${DIM}`, background: "rgba(3,11,24,0.85)", boxSizing: "border-box", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
    <div style={{ fontFamily: K.mono, fontSize: 27, letterSpacing: 4, color: AM, fontWeight: 700, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: K.head, fontSize: 43, fontWeight: 700, color: K.text, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b}</div>
    {c && <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 1.5, color: K.muted, whiteSpace: "nowrap", fontWeight: 500 }}>{c}</div>}
  </div>
);
const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: AM }}>{children}</span>;
const Pill: React.FC<{ x: number; y: number; text: string; o?: number; color?: string; size?: number; solid?: boolean; pop?: number }> = ({ x, y, text, o = 1, color = AM, size = 28, solid, pop = 1 }) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.9, sc = 0.7 + 0.3 * pop;
  return (
    <g opacity={o} transform={`translate(${x} ${y}) scale(${sc})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? color : "rgba(6,20,42,0.94)"} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={size * 0.35} fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={solid ? K.bgDeep : color}>{text}</text>
    </g>
  );
};
const Frame: React.FC = () => (
  <g>
    {[[60, 664, 1, 1], [1020, 664, -1, 1], [60, 1396, 1, -1], [1020, 1396, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={DIM} strokeWidth={2.4} />
    ))}
  </g>
);
/** moving dashes along a polyline = current flowing */
const Flow: React.FC<{ pts: [number, number][]; g: number; color: string; w?: number; o?: number; speed?: number }> = ({ pts, g, color, w = 12, o = 1, speed = 7 }) => {
  if (o <= 0.01) return null;
  const d = "M " + pts.map((p) => p.join(" ")).join(" L ");
  return (
    <g opacity={o} style={{ filter: `drop-shadow(0 0 10px ${color})` }}>
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${w * 2.2} ${w * 2.0}`} strokeDashoffset={-g * speed} />
    </g>
  );
};
const Meter: React.FC<{ x: number; y: number; w: number; v: number; label: string; value: string; color: string; o?: number }> = ({ x, y, w, v, label, value, color, o = 1 }) => (
  <g opacity={o}>
    {T_(x, y + 24, label, { size: 28, c: WH, a: "start", ls: 3 })}
    {T_(x + w, y + 24, value, { size: 28, c: color, a: "end", w: 700, ls: 3 })}
    <rect x={x} y={y + 42} width={w} height={40} rx={5} fill="rgba(3,11,24,0.6)" stroke={DIM} strokeWidth={2} />
    <rect x={x + 5} y={y + 47} width={Math.max(4, (w - 10) * clamp01(v))} height={30} rx={3} fill={color} opacity={0.92} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
  </g>
);

/* ───────────────────────── birds ───────────────────────── */
/** side view, faces right, feet on y = 0 at x = 0. Legs at x = ±26 */
const BirdSide: React.FC<{ x: number; y: number; s: number; color?: string; glow?: string; flip?: boolean; o?: number }> = ({ x, y, s, color = WH, glow, flip, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={o} style={glow ? { filter: `drop-shadow(0 0 12px ${glow})` } : undefined}>
    <g fill="none" stroke={color} strokeWidth={4 / Math.sqrt(s)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M -26 -42 L -26 0 L -8 0 M 26 -42 L 26 0 L 44 0" />
      <path d="M -54 -86 L -132 -112 L -128 -82 L -48 -64 Z" fill="rgba(6,20,42,0.95)" />
      <ellipse cx="0" cy="-78" rx="64" ry="40" transform="rotate(-10 0 -78)" fill="rgba(6,20,42,0.95)" />
      <path d="M -42 -98 Q 8 -118 46 -86 Q 0 -48 -70 -78 Z" />
      <circle cx="60" cy="-124" r="21" fill="rgba(6,20,42,0.95)" />
      <path d="M 78 -130 L 108 -120 L 78 -112 Z" fill={color} />
    </g>
    <circle cx="66" cy="-128" r="3.6" fill={color} />
  </g>
);
/** front view, wings spread and drooping to tips at (±300, -60); feet on y = 0 */
const BirdFront: React.FC<{ s: number; color?: string; glow?: string }> = ({ s, color = WH, glow }) => {
  const wing = (sg: number) => {
    const P: [number, number][] = [[34, -215], [160, -210], [260, -150], [300, -60], [268, -84], [262, -56], [226, -90], [214, -60], [180, -100], [160, -72], [130, -112], [110, -90], [70, -120], [40, -100]];
    return "M " + P.map(([a, b]) => `${a * sg} ${b}`).join(" L ") + " Z";
  };
  return (
    <g transform={`scale(${s})`} style={glow ? { filter: `drop-shadow(0 0 14px ${glow})` } : undefined}>
      <g fill="rgba(6,20,42,0.95)" stroke={color} strokeWidth={4 / Math.sqrt(s)} strokeLinecap="round" strokeLinejoin="round">
        <path d="M -18 -70 L -22 0 L -40 0 M 18 -70 L 22 0 L 40 0" fill="none" />
        <path d={wing(1)} /><path d={wing(-1)} />
        <ellipse cx="0" cy="-150" rx="44" ry="84" />
        <circle cx="0" cy="-262" r="28" />
        <path d="M -9 -256 L 9 -256 L 0 -230 Z" fill={color} />
      </g>
      <circle cx="-11" cy="-268" r="4.5" fill={color} /><circle cx="11" cy="-268" r="4.5" fill={color} />
    </g>
  );
};
const BirdFly: React.FC<{ x: number; y: number; s: number; g: number; o?: number }> = ({ x, y, s, g, o = 1 }) => {
  const a = Math.sin(g * 0.55) * 18;
  return <path d={`M ${x - 34 * s} ${y + a * s * 0.6} Q ${x - 16 * s} ${y - 14 * s + a * s} ${x} ${y} Q ${x + 16 * s} ${y - 14 * s + a * s} ${x + 34 * s} ${y + a * s * 0.6}`} fill="none" stroke={WH} strokeWidth={4} strokeLinecap="round" opacity={o} />;
};

/* ───────────────────────── hook: pylon + lines + birds ───────────────────────── */
const tower = (z: number, h = 16): WireLine[] => {
  const L: WireLine[] = [];
  const hw = (y: number) => 3.2 - 2.4 * (y / h);
  const lv = [0, 4, 8, 12, h];
  const corners = (y: number): V3[] => [[-hw(y), y, z - hw(y)], [hw(y), y, z - hw(y)], [hw(y), y, z + hw(y)], [-hw(y), y, z + hw(y)]];
  lv.forEach((y) => L.push({ pts: corners(y), closed: true }));
  for (let i = 0; i < 4; i++) L.push({ pts: lv.map((y) => corners(y)[i]) });
  for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) {
    const a = corners(lv[k])[i], b = corners(lv[k + 1])[(i + 1) % 4];
    L.push({ pts: [a, b], op: 0.7 });
  }
  // crossarms (3 levels), conductors hang from the tips
  [[9, 5.6], [12, 4.6], [15, 3.6]].forEach(([y, hx]) => {
    L.push({ pts: [[-hx, y, z], [hx, y, z]], color: WH, w: 1.3 });
    L.push({ pts: [[-hx, y - 1.4, z], [-hx, y, z]], color: WH, w: 0.9 });
    L.push({ pts: [[hx, y - 1.4, z], [hx, y, z]], color: WH, w: 0.9 });
  });
  return L;
};
const SPAN = 24;
const sag = (t: number) => 4 * 1.3 * t * (1 - t);
/** conductor point at fraction t along a span */
const cpt = (hx: number, y: number, z0: number, t: number): V3 => [hx, y - 1.4 - sag(t), z0 - SPAN * t];
const CONDS: [number, number][] = [[-5.6, 9], [5.6, 9], [-4.6, 12], [4.6, 12], [-3.6, 15], [3.6, 15]];
const pylonLines = (): WireLine[] => {
  const L = [...tower(0), ...tower(-SPAN)];
  CONDS.forEach(([hx, y]) => {
    const pts: V3[] = Array.from({ length: 13 }, (_, i) => cpt(hx, y, 0, i / 12));
    L.push({ pts, color: AM, w: 1.5 });
  });
  return L;
};
const HOOK_VIEW: WireView = { yaw: -0.5, pitch: 0.16, dist: 140, scale: 34, cx: 590, cy: 1000, pivot: [0, 7.5, -SPAN * 0.45] };
const HookLayer: React.FC<{ g: number; cover?: boolean }> = ({ g, cover }) => {
  const lines = React.useMemo(pylonLines, []);
  const v = { ...HOOK_VIEW, yaw: HOOK_VIEW.yaw + (cover ? 0 : Math.sin(g * 0.012) * 0.05) };
  const perch: [number, number, number][] = [[-5.6, 9, 0.3], [5.6, 9, 0.5], [-4.6, 12, 0.42], [4.6, 12, 0.22], [-3.6, 15, 0.6], [3.6, 15, 0.35], [5.6, 9, 0.7]];
  const lands = io(g, [18, 52], [0, 1], easeOut); // one bird glides in and lands on the last perch
  return (
    <g>
      <Wire3D lines={lines} view={v} width={2.5} glow={6} depthFade={0.3} hiddenFade={0.5} />
      {perch.map(([hx, y, t], i) => {
        const p = project(cpt(hx, y, 0, t), v);
        const last = i === perch.length - 1;
        if (last) {
          const sx = lerp(1180, p.x, lands), sy = lerp(p.y - 260, p.y, lands * lands);
          return lands >= 1 ? <BirdSide key={i} x={p.x} y={p.y + 4} s={0.6 * p.k} flip={i % 2 === 1} /> : <BirdFly key={i} x={sx} y={sy} s={1.3} g={g} />;
        }
        return <BirdSide key={i} x={p.x} y={p.y + 4} s={0.6 * p.k} flip={i % 2 === 1} />;
      })}
      <BirdFly x={lerp(1160, -120, clamp01(g / 110))} y={760 + Math.sin(g * 0.06) * 12} s={1.2} g={g + 7} o={cover ? 0 : 1} />
      {/* bird count tag */}
      <Pill x={540} y={1352} text="WHY?" size={40} solid pop={ioB(g, CUE.why, CUE.why + 12)} o={win(g, CUE.why, T.diff + 4, 4, 10)} />
    </g>
  );
};

/* ───────────────────────── water / voltage analogy ───────────────────────── */
const Slope: React.FC<{ g: number }> = ({ g }) => {
  const a = g - T.diff;
  const o1 = io(a, [2, 14], [0, 1]), o2 = io(a, [14, 26], [0, 1]);
  const roll = ((g - T.diff - 20) % 54) / 54; // ball rolls down, loops
  const hi = 1060, lo = 1280;
  // top panel: flat platform (y 800); bottom: slope from (130,hi) to (900,lo)
  const bx = lerp(190, 840, roll), by = lerp(hi - 42, lo - 42, roll);
  const wCue = io(g, [CUE.water, CUE.water + 14], [0, 1]);
  return (
    <g>
      {/* flat */}
      <g opacity={o1}>
        <rect x={110} y={664} width={860} height={236} rx={12} fill="rgba(6,20,42,0.55)" stroke={DIM} strokeWidth={2} />
        <line x1={150} y1={820} x2={930} y2={820} stroke={LN} strokeWidth={6} strokeLinecap="round" />
        <circle cx={540} cy={782} r={36} fill="none" stroke={WH} strokeWidth={5} />
        <line x1={150} y1={738} x2={930} y2={738} stroke={AM} strokeWidth={2.4} strokeDasharray="14 12" opacity={0.8} />
        {T_(150, 716, "SAME VOLTAGE", { size: 30, c: AM, w: 700 })}
        <Pill x={780} y={862} text="NO FLOW" size={32} color={MU} solid />
        {T_(150, 880, "SAME LEVEL", { size: 26, c: MU })}
      </g>
      {/* slope */}
      <g opacity={o2}>
        <rect x={110} y={924} width={860} height={440} rx={12} fill="rgba(6,20,42,0.55)" stroke={DIM} strokeWidth={2} />
        <line x1={150} y1={hi} x2={930} y2={lo} stroke={LN} strokeWidth={6} strokeLinecap="round" />
        <circle cx={bx} cy={by} r={36} fill="rgba(255,181,71,0.2)" stroke={AM} strokeWidth={5} style={{ filter: `drop-shadow(0 0 ${8 + 8 * wCue}px ${AM})` }} />
        <line x1={150} y1={hi - 50} x2={930} y2={hi - 50} stroke={AM} strokeWidth={2.4} strokeDasharray="14 12" opacity={0.5} />
        <line x1={150} y1={lo + 2} x2={930} y2={lo + 2} stroke={AM} strokeWidth={2.4} strokeDasharray="14 12" opacity={0.5} />
        {T_(150, hi - 62, "HIGH VOLTAGE", { size: 28, c: RD, w: 700 })}
        {T_(930, 1336, "LOW VOLTAGE", { size: 28, c: GR, w: 700, a: "end" })}
        <Pill x={420} y={1320} text="FLOW!" size={32} color={AM} solid pop={ioB(a, 20, 32)} />
        
        <g opacity={wCue}>
          <Pill x={400} y={1215} text="LIKE WATER" size={30} color={LN} solid pop={ioB(g, CUE.water, CUE.water + 12)} />
        </g>
      </g>
    </g>
  );
};

/* ───────────────────────── one wire: same voltage, current stays in the wire ───────────────────────── */
const WIRE_Y = 980, BX = 540, BS = 2.1;
const OneWire: React.FC<{ g: number }> = ({ g }) => {
  const feet = io(g, [CUE.feet, CUE.feet + 14], [0, 1]) * (1 - io(g, [T.stay - 2, T.stay + 10], [0, 1]));
  const stay = io(g, [T.stay, T.stay + 12], [0, 1]) * (1 - io(g, [T.two - 12, T.two - 2], [0, 1]));
  const easy = io(g, [CUE.easy, CUE.easy + 14], [0, 1]) * (1 - io(g, [T.two - 12, T.two - 2], [0, 1]));
  const recap = io(g, [T.end, T.end + 14], [0, 1]);
  const live = io(g, [T.one, T.one + 12], [0, 1]) * (1 - io(g, [T.two - 12, T.two - 2], [0, 1])) + recap;
  const fx = (sg: number) => BX + sg * 26 * BS;
  const barsO = Math.max(feet, recap * 0);
  return (
    <g opacity={Math.min(1, live)}>
      {/* the wire */}
      <g style={{ filter: `drop-shadow(0 0 8px ${LN})` }}>
        <line x1={60} y1={WIRE_Y + 8} x2={1020} y2={WIRE_Y + 8} stroke={LN} strokeWidth={12} strokeLinecap="round" />
      </g>
      <line x1={60} y1={WIRE_Y + 3} x2={1020} y2={WIRE_Y + 3} stroke={WH} strokeWidth={2.5} opacity={0.55} />
      {T_(80, WIRE_Y + 52, "LIVE WIRE", { size: 26, c: LN, w: 700 })}
      <BirdSide x={BX + 24} y={WIRE_Y} s={BS} glow={stay > 0.4 || recap > 0.4 ? GR : undefined} color={WH} />
      {/* feet markers */}
      <g opacity={Math.max(feet, recap)}>
        <circle cx={fx(-1)} cy={WIRE_Y + 4} r={11} fill={AM} /><circle cx={fx(1)} cy={WIRE_Y + 4} r={11} fill={AM} />
      </g>
      {/* intro tag */}
      <g opacity={io(g, [T.one + 6, T.one + 18], [0, 1]) * (1 - io(g, [CUE.feet - 4, CUE.feet + 6], [0, 1]))}>
        <Pill x={540} y={1130} text="ONE WIRE = ONE VOLTAGE" size={34} color={AM} solid pop={ioB(g, T.one + 6, T.one + 18)} />
      </g>
      {/* equal voltage bars under the feet */}
      <g opacity={barsO}>
        {[fx(-1) - 70, fx(1) + 70].map((cx, i) => (
          <g key={i}>
            <rect x={cx - 70} y={1090} width={140} height={240} rx={8} fill="rgba(255,181,71,0.22)" stroke={AM} strokeWidth={4} />
            {T_(cx, 1226, "V", { size: 90, c: AM, a: "middle", w: 800 })}
            {T_(cx, 1304, i === 0 ? "FOOT 1" : "FOOT 2", { size: 24, c: WH, a: "middle" })}
          </g>
        ))}
        <line x1={160} y1={1090} x2={920} y2={1090} stroke={AM} strokeWidth={3} strokeDasharray="14 12" />
        <Pill x={540} y={1050} text="SAME VOLTAGE" size={30} color={GR} solid pop={ioB(g, CUE.feet, CUE.feet + 12)} />
        <Pill x={540} y={1372} text="DIFFERENCE = 0" size={26} color={LN} solid pop={ioB(g, CUE.feet + 18, CUE.feet + 30)} o={clamp01((g - (CUE.feet + 16)) / 6)} />
      </g>
      {/* current: along the wire, past the bird */}
      <Flow pts={[[70, WIRE_Y + 8], [1010, WIRE_Y + 8]]} g={g} color={AM} w={11} o={stay * (1 - recap)} speed={9} />
      <g opacity={stay * (1 - recap)}>
        <Pill x={190} y={WIRE_Y - 120} text="CURRENT →" size={30} color={AM} solid pop={ioB(g, T.stay, T.stay + 12)} />
        <Pill x={860} y={WIRE_Y - 150} text="BIRD IS SAFE" size={30} color={GR} solid pop={ioB(g, T.stay + 16, T.stay + 28)} o={clamp01((g - (T.stay + 14)) / 6)} />
      </g>
      <g opacity={easy}>
        <Meter x={150} y={1080} w={780} v={0.94} label="THROUGH THE WIRE" value="EASY PATH" color={AM} />
        <Meter x={150} y={1190} w={780} v={0.04} label="THROUGH THE BIRD" value="ALMOST NONE" color={GR} />
        {T_(540, 1318, "ILLUSTRATION · NOT MEASURED", { size: 22, c: MU, a: "middle" })}
      </g>
      {/* recap chips */}
      <g opacity={recap}>
        <Pill x={540} y={1110} text="ONE WIRE · SAME VOLTAGE = SAFE" size={29} color={GR} solid pop={ioB(g, T.end + 4, T.end + 16)} />
        <Pill x={540} y={1210} text="TWO WIRES · DIFFERENT VOLTAGE = DANGER" size={25} color={RD} solid pop={ioB(g, CUE.diffl - 36, CUE.diffl - 24)} o={clamp01((g - (CUE.diffl - 38)) / 6)} />
        <Pill x={540} y={1310} text="IT'S THE DIFFERENCE" size={34} color={AM} pop={ioB(g, CUE.diffl, CUE.diffl + 12)} o={clamp01((g - (CUE.diffl - 2)) / 6)} />
      </g>
    </g>
  );
};

/* ───────────────────────── pole scene: two wires / wire + pole / big vs small / covers ───────────────────────── */
const PY = -60; // global lift of the whole pole drawing
const CX = [240, 840], COND_Y = 1070 + PY, ARM_Y = 1130 + PY, FEET = { x: 540, y: ARM_Y };
const Pole: React.FC<{ g: number }> = ({ g }) => {
  const show = io(g, [T.two, T.two + 12], [0, 1]) * (1 - io(g, [T.end - 12, T.end - 2], [0, 1]));
  if (show <= 0.01) return null;
  const phase1 = g < CUE.pole, phase2 = g >= CUE.pole && g < CUE.story, phase3 = g >= CUE.story && g < T.big;
  const covered = g >= CUE.covers;
  const grow = g < T.big ? 1 : io(g, [CUE.small + 18, CUE.small + 36], [0.45, 1], easeOut);
  const s = g < T.big ? 1 : grow;
  const reach = s > 0.97;
  const danger = g < T.big ? 1 : g < CUE.covers ? (reach ? 1 : 0) : 0;
  const flash = phase3 ? Math.max(0, 1 - ((g - CUE.story) % 18) / 18) * 0.6 + 0.4 : 0;
  const pathLR: [number, number][] = [[CX[0], COND_Y], [FEET.x - 300 * 0.55, ARM_Y - 90], [FEET.x - 30, ARM_Y - 190], [FEET.x, ARM_Y - 150], [FEET.x + 30, ARM_Y - 190], [FEET.x + 300 * 0.55, ARM_Y - 90], [CX[1], COND_Y]];
  const pathLP: [number, number][] = [[CX[0], COND_Y], [FEET.x - 300 * 0.55, ARM_Y - 90], [FEET.x - 30, ARM_Y - 190], [FEET.x, ARM_Y - 150], [FEET.x + 4, ARM_Y - 60], [FEET.x + 4, ARM_Y + 10], [FEET.x + 4, ARM_Y + 200]];
  const pathOn = phase1 ? pathLR : pathLP;
  const redO = (danger > 0 && g < T.big ? 1 : 0) + (g >= T.big && g < CUE.covers ? danger * io(g, [CUE.small + 30, CUE.small + 40], [0, 1]) : 0);
  const cov = io(g, [CUE.covers, CUE.covers + 14], [0, 1]);
  return (
    <g opacity={show}>
      {/* pole + crossarm */}
      <rect x={FEET.x - 28} y={ARM_Y + 18} width={56} height={1330 - ARM_Y - 18} fill="rgba(143,179,209,0.12)" stroke={DIM} strokeWidth={3} />
      <rect x={150} y={ARM_Y} width={780} height={22} rx={4} fill="rgba(143,179,209,0.2)" stroke={MU} strokeWidth={3} />
      {CX.map((cx, i) => (
        <g key={i}>
          <rect x={cx - 14} y={COND_Y + 22} width={28} height={ARM_Y - COND_Y - 22} fill="rgba(6,20,42,0.9)" stroke={MU} strokeWidth={3} />
          <circle cx={cx} cy={COND_Y} r={20} fill="rgba(255,181,71,0.35)" stroke={AM} strokeWidth={5} style={{ filter: `drop-shadow(0 0 10px ${AM})` }} />
          {/* covers */}
          <circle cx={cx} cy={COND_Y} r={44} fill="rgba(92,211,255,0.22)" stroke={LN} strokeWidth={5} opacity={cov} style={{ filter: `drop-shadow(0 0 10px ${LN})` }} />
        </g>
      ))}
      {/* bird */}
      <g transform={`translate(${FEET.x} ${FEET.y})`}><BirdFront s={s} glow={redO > 0 ? RD : undefined} color={redO > 0 ? "#FFD6D6" : WH} /></g>
      {/* current through the bird (red) */}
      <Flow pts={pathOn} g={g} color={RD} w={12} o={redO * (phase1 || phase2 || phase3 || g >= T.big ? 1 : 0)} speed={10} />
      {/* contact rings */}
      {redO > 0 && CX.map((cx, i) => <circle key={i} cx={cx} cy={COND_Y} r={30 + 6 * Math.sin(g * 0.5)} fill="none" stroke={RD} strokeWidth={4} opacity={(phase2 && i === 1) ? 0.15 : 1} />)}
      {/* labels */}
      <g opacity={1 - cov}>
        <Pill x={CX[0]} y={COND_Y - 80} text="VOLTAGE A" size={26} color={AM} solid />
        <Pill x={CX[1]} y={COND_Y - 80} text="VOLTAGE B" size={26} color={LN} solid o={phase2 ? 0.25 : 1} />
      </g>
      <g opacity={cov}>
        <Pill x={CX[0]} y={COND_Y - 96} text="COVER" size={28} color={LN} solid pop={ioB(g, CUE.covers, CUE.covers + 12)} />
        <Pill x={CX[1]} y={COND_Y - 96} text="COVER" size={28} color={LN} solid pop={ioB(g, CUE.covers + 4, CUE.covers + 16)} />
      </g>
      <g opacity={io(g, [CUE.pole - 4, CUE.pole + 8], [0, 1]) * (1 - io(g, [T.big - 2, T.big + 8], [0, 1]))}>
        <Pill x={FEET.x} y={1250} text="POLE · GROUND 0 V" size={30} color={GR} solid pop={ioB(g, CUE.pole, CUE.pole + 12)} />
      </g>
      {/* beat pills */}
      <Pill x={540} y={712} text="TWO LIVE WIRES" size={34} color={RD} solid pop={ioB(g, T.two + 4, T.two + 16)} o={phase1 ? 1 : 0} />
      <Pill x={540} y={712} text="WIRE + POLE" size={34} color={RD} solid pop={ioB(g, CUE.pole, CUE.pole + 12)} o={phase2 ? 1 : 0} />
      <Pill x={540} y={712} text="DIFFERENT VOLTAGES" size={36} color={RD} solid pop={ioB(g, CUE.story, CUE.story + 12)} o={phase3 ? 0.55 + 0.45 * flash : 0} />
      <Pill x={540} y={712} text="TOO SMALL TO REACH BOTH" size={30} color={GR} solid pop={ioB(g, T.big, T.big + 10)} o={g >= T.big && g < CUE.small + 22 ? 1 : 0} />
      <Pill x={540} y={712} text="BIG WINGSPAN REACHES BOTH" size={30} color={RD} solid pop={ioB(g, CUE.small + 26, CUE.small + 38)} o={g >= CUE.small + 26 && g < CUE.covers ? 1 : 0} />
      <Pill x={540} y={712} text="COVERED = NO CONTACT" size={32} color={GR} solid pop={ioB(g, CUE.covers + 4, CUE.covers + 16)} o={g >= CUE.covers ? 1 : 0} />
      {/* red flash on the danger line */}
      {phase3 && <rect x={0} y={0} width={W} height={H} fill={RD} opacity={0.07 * flash} />}
    </g>
  );
};

/* ───────────────────────── main shot ───────────────────────── */
export const BirdsShot: React.FC = () => {
  const g = useCurrentFrame();
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={g} lines={["Why don't birds", "get *electrocuted*", "on power lines?"]} at={-30} exitAt={T.diff - 12} size={96} top={346} />
      <Headline f={g} lines={["No *difference,*", "no flow"]} at={T.diff + 3} exitAt={T.one - 8} size={112} />
      <Headline f={g} lines={["One wire,", "*one voltage*"]} at={T.one + 3} exitAt={T.stay - 8} size={112} />
      <Headline f={g} lines={["Current stays", "*in the wire*"]} at={T.stay + 3} exitAt={T.two - 8} size={108} />
      <Headline f={g} lines={["Two *different*", "voltages"]} at={T.two + 3} exitAt={T.big - 8} size={112} />
      <Headline f={g} lines={["Big birds", "*reach both*"]} at={T.big + 3} exitAt={CUE.covers - 8} size={112} />
      <Headline f={g} lines={["Covers", "*block contact*"]} at={CUE.covers + 3} exitAt={T.end - 8} size={112} />
      <Headline f={g} lines={["It's the", "*difference*"]} at={T.end + 2} size={120} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <g opacity={win(g, -10, T.diff + 2, 8, 8)}><HookLayer g={g} /></g>
        <g opacity={win(g, T.diff, T.one + 2, 8, 8)}><Slope g={g} /></g>
        <OneWire g={g} />
        <Pole g={g} />
        <g opacity={io(g, [20, 36], [0, 1])}>{T_(540, 1584, "SIMPLIFIED SCHEMATIC · NEVER TOUCH OR APPROACH POWER LINES", { c: K.muted, a: "middle", size: 20 })}</g>
      </svg>

      <Panel o={pn(-10, T.diff + 2)} a="THE QUESTION" b={<>Perched on live lines, <Em>no shock</Em></>} c="High-voltage lines · schematic, not to scale" />
      <Panel o={pn(T.diff, CUE.water + 2)} a="RULE 1 · VOLTAGE DIFFERENCE" b={<>No difference, <Em>no flow</Em></>} c="Same level: nothing moves · different level: flow" />
      <Panel o={pn(CUE.water, T.one + 2)} a="THINK OF WATER" b={<>It only flows <Em>downhill</Em></>} c="Analogy · a ball rolls only when there's a slope" />
      <Panel o={pn(T.one, CUE.feet + 2)} a="BIRD ON ONE WIRE" b={<>Touches <Em>one voltage</Em></>} c="Perching on a single wire doesn't complete a circuit" />
      <Panel o={pn(CUE.feet, T.stay + 2)} a="BOTH FEET, SAME WIRE" b={<>Same voltage = <Em>no difference</Em></>} c="Nothing pushes current through the body · APLIC · USFWS" />
      <Panel o={pn(T.stay, CUE.easy + 2)} a="CURRENT TAKES THE EASY PATH" b={<>It stays in the <Em>wire</Em></>} c="Simplified · arrows are an illustration" />
      <Panel o={pn(CUE.easy, T.two + 2)} a="WIRE = EASY · BIRD = HARD" b={<>Almost none goes through the <Em>bird</Em></>} c="Illustration, not measured values" />
      <Panel o={pn(T.two, CUE.pole + 2)} a="TWO PARTS AT ONCE" b={<>Bridge two live wires: <Em>shock</Em></>} c="Danger: touching two energized parts · APLIC · USFWS" />
      <Panel o={pn(CUE.pole, T.big + 2)} a="WIRE + GROUNDED POLE" b={<>Different voltages: <Em>danger</Em></>} c="An energized part plus a grounded one · APLIC · USFWS" />
      <Panel o={pn(T.big, CUE.covers + 2)} a="WINGSPAN MATTERS" b={<>Big birds can <Em>reach both</Em></>} c="Small birds are too small to bridge the gap · APLIC" />
      <Panel o={pn(CUE.covers, T.end + 2)} a="THE FIX" b={<>Covers + wider gaps <Em>keep them safe</Em></>} c="Insulating covers and spacing · USFWS · APLIC" />
      <Panel o={pn(T.end, T.total + 20)} a="NOW YOU KNOW" b={<>Not the bird. <Em>The difference.</Em></>} c="Same voltage = safe · different voltage = danger" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 296, display: "flex", justifyContent: "center", fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>HOW IT WORKS · 22</div>
    <Headline f={200} lines={["Why don't birds", "get *electrocuted*", "on power lines?"]} at={0} size={100} top={370} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Frame />
      <HookLayer g={96} cover />
      {T_(540, 1584, "SIMPLIFIED SCHEMATIC · NEVER TOUCH OR APPROACH POWER LINES", { c: K.muted, a: "middle", size: 20 })}
    </svg>
  </>
);
void H;
