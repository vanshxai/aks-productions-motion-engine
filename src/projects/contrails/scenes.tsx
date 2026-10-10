import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Headline, clamp01, ioB, W, H } from "../gearbox/kit";
import { Wire3D, project, V3, WireView } from "../../engine/wire3d";
import { airliner, trailLines, ENG, NOZZLE_Z, INLET_Z } from "./plane";

/**
 * HOW IT WORKS #17 — Why do planes leave white trails?           30 s · 1080×1920 · 30 fps · 900 frames
 * HIT-STYLE: frame 0 is a finished hook (question headline + wireframe airliner with its trail already drawn). Voice starts at 0.1 s.
 * House rule: no end card — the last picture holds and a small AKS PRODUCTIONS tag (EndTag) fades in over the last second.
 * STYLE UPGRADE: "2D that rotates like 3D wireframe" -> src/engine/wire3d.tsx (rotating SIMPLIFIED airliner schematic, engine close-up).
 *
 * BEATS PLAN — one idea per beat, the picture shows exactly what the voice says (VO phrases: public/projects/contrails/vo.json)
 *    3 hook  "Planes don't leave smoke."   wireframe airliner turns slowly, trail already drawn; NOT SMOKE pill
 *   59       "They leave clouds."          A CLOUD OF ICE pill pops
 *   92 fuel  "Burning fuel makes water."   the plane swings in on one engine (same 3D model, zoom): fuel + air in, burn, CO2 + H2O out
 *  149       "Hot steam,"                 H2O dots stream out, callout 'about 1.2 kg water per 1 kg fuel'
 *  182       "blasting out the back."     exhaust surge
 *  217 cold  "Up there, the air is minus fifty."  altitude ruler 0-12 km, plane climbs to 10 km, thermometer falls to -50 C
 *  287 ice   "The steam hits that cold and freezes into tiny ice crystals,"  particle animation: steam dots -> freeze front -> ice crystals
 *  401       "like your breath on a cold day."    same animation with breath puffs
 *  446 line  "That's the white line you see."     the airliner returns with its trail; magnifier on the ice crystals
 *  504       "A thin cloud of ice, not smoke."    pills
 *  573 air   "If the air is dry, it fades fast."  DRY AIR: trail erodes from the old end
 *  661       "If it's humid, it stays and spreads."  HUMID AIR: trail lingers, widens, spreads
 *  734 end   "Fly low, and there's no trail. The air is too warm."  two planes on an altitude/temperature column; -40 C line
 *
 * Facts on screen (source URLs in the delivery notes):
 *  - contrails = ice crystals formed from the condensation of engine-exhaust water vapour (FAA contrails page, Met Office, Wikipedia 'Contrail')
 *  - burning kerosene makes water: EI(H2O) about 1.23-1.26 kg per kg fuel (pycontrails Jet A table 1.23; Atmos. Chem. Phys. 25, 7903 (2025) 1.26) -> shown as 'about 1.2'
 *  - cruise 'about 8-12 km' (Wikipedia 'Contrail' infobox 7.5-12 km; FAA 'several miles up'); air 'about -50 C' = ISA at 10 km (15 - 6.5 C/km; NASA Glenn atmosphere model)
 *  - trails need ambient air 'generally colder than -40 C' (NASA Langley/Minnis contrail guide); FAA: as cold as -70 F
 *  - dry air: trail lasts seconds-minutes; humid air: minutes to hours, can spread into cirrus-like cloud (FAA fact sheet, Met Office, Wikipedia)
 *  - low flight: air too warm (Met Office: trail base above 20,000 ft; NASA: needs air colder than -40 C) -> 'usually'
 * SIMPLIFIED (tagged on screen): airliner = generic line schematic, not a real type, not to scale; particles / puffs / erosion are illustrations,
 * not a simulation; temperatures are the standard-atmosphere model (real air varies). Everything is a pure function of the frame.
 */

/** Global frames from public/projects/contrails/vo.json. Keep in sync with soundtrack.py. */
export const T = { fuel: 92, cold: 217, ice: 287, line: 446, air: 573, end: 734, total: 900 };
export const CUTS = [0, 92, 217, 287, 446, 573, 734];
export const CUE = {
  smoke: 3, cloud: 59, burnIn: 100, equation: 118, burn: 126, steam: 149, surge: 182, number: 160,
  climb0: 219, climb1: 246, readout: 250,
  hot: 292, freeze: 334, crystals: 352, zoom: 356, breath: 401, same: 418,
  line: 448, thin: 504, notsmoke: 548,
  dry: 575, fades: 614, humidL: 661, spreads: 695,
  low: 736, notrail: 764, warm: 814,
};

const AM = K.amber, LN = K.line, DIM = K.lineDim, WH = K.text;
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fract = (x: number) => x - Math.floor(x);
const rnd = (a: number, b = 0) => fract(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) * 2 - 1; // -1..1, deterministic
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };

const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 24} letterSpacing={o.ls ?? (o.size ?? 24) * 0.08} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);
/** H2O / CO2 in SVG text with real subscripts (no reliance on unicode subscript glyphs). */
const Chem: React.FC<{ x: number; y: number; parts: [string, string?][]; size?: number; c?: string; a?: "start" | "middle" | "end"; op?: number; w?: number }> = ({ x, y, parts, size = 26, c = K.muted, a = "middle", op = 1, w = 700 }) => (
  <text x={x} y={y} textAnchor={a} fontFamily={K.mono} fontWeight={w} fontSize={size} letterSpacing={size * 0.04} fill={c} opacity={op}>
    {parts.map(([t, sub], i) => (
      <React.Fragment key={i}>
        <tspan>{t}</tspan>
        {sub && <tspan fontSize={size * 0.68} dy={size * 0.2}>{sub}</tspan>}
        {sub && <tspan dy={-size * 0.2}>{"​"}</tspan>}
      </React.Fragment>
    ))}
  </text>
);
const CO2: [string, string?][] = [["CO", "2"]];

const Panel: React.FC<{ o: number; a: string; b: React.ReactNode; c?: string }> = ({ o, a, b, c }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1412, height: 138, opacity: o, borderRadius: 12, border: `2px solid ${DIM}`, background: "rgba(3,11,24,0.85)", boxSizing: "border-box", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
    <div style={{ fontFamily: K.mono, fontSize: 27, letterSpacing: 4, color: AM, fontWeight: 700, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: K.head, fontSize: 43, fontWeight: 700, color: K.text, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b}</div>
    {c && <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 1.5, color: K.muted, whiteSpace: "nowrap", fontWeight: 500 }}>{c}</div>}
  </div>
);
const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: AM }}>{children}</span>;
const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ fontSize: "0.68em", verticalAlign: "-0.18em" }}>{children}</span>;
const Pill: React.FC<{ x: number; y: number; text: string; o?: number; color?: string; size?: number; solid?: boolean; pop?: number; strike?: boolean }> = ({ x, y, text, o = 1, color = AM, size = 28, solid, pop = 1, strike }) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.9, sc = 0.7 + 0.3 * pop;
  return (
    <g opacity={o} transform={`translate(${x} ${y}) scale(${sc})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={solid ? color : "rgba(6,20,42,0.94)"} stroke={color} strokeWidth={3} />
      <text textAnchor="middle" y={size * 0.35} fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={solid ? K.bgDeep : color}>{text}</text>
      {strike && <line x1={-w / 2 + size} y1={0} x2={w / 2 - size} y2={0} stroke={color} strokeWidth={4} />}
    </g>
  );
};
const Frame: React.FC = () => (
  <g>
    {[[VIEW.x0, VIEW.y0, 1, 1], [VIEW.x1, VIEW.y0, -1, 1], [VIEW.x0, VIEW.y1, 1, -1], [VIEW.x1, VIEW.y1, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={DIM} strokeWidth={2.4} />
    ))}
  </g>
);

/** Six-armed ice crystal (stroke only), radius r, rotation in radians. */
const crystalD = (r: number) => {
  let d = "";
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a);
    d += `M0 0L${(r * c).toFixed(1)} ${(r * s).toFixed(1)}`;
    for (const t of [0.5, 0.78]) {
      const bx = r * t * c, by = r * t * s, bl = r * (0.34 - 0.14 * (t - 0.5) * 3);
      for (const sg of [-1, 1]) { const ba = a + sg * (Math.PI / 3); d += `M${bx.toFixed(1)} ${by.toFixed(1)}L${(bx + bl * Math.cos(ba)).toFixed(1)} ${(by + bl * Math.sin(ba)).toFixed(1)}`; }
    }
  }
  return d;
};
const Crystal: React.FC<{ x: number; y: number; r: number; rot: number; o?: number; color?: string; sw?: number }> = ({ x, y, r, rot, o = 1, color = WH, sw = 2.4 }) => (
  <g transform={`translate(${x} ${y}) rotate(${(rot * 180) / Math.PI})`} opacity={o}>
    <path d={crystalD(r)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  </g>
);

/* ───────────────────────── camera for the 3D airliner (plane scenes) ───────────────────────── */
const NEAR_ENG: V3 = [-ENG[0], ENG[1], -0.5];
const zoomOf = (g: number) => (g < 300 ? io(g, [92, 128], [0, 1], easeInOut) : 0);
export const planeView = (g: number): WireView => {
  const zoom = zoomOf(g);
  const inLine = g >= 400;
  const yawHook = g < 92 ? 1.0 + 0.4 * io(g, [0, 92], [0, 1], (t) => t) : 1.4 + 0.0009 * (g - 92);
  const yaw = inLine ? 0.85 + 0.5 * clamp01((g - 446) / 127) : yawHook;
  const pitch = lerp(0.3, 0.16, zoom);
  const scale = Math.exp(lerp(Math.log(10.5), Math.log(36), zoom)) * (g > 150 && g < 230 ? 1 + 0.0006 * (g - 150) : 1);
  const pivot: V3 = [NEAR_ENG[0] * zoom, NEAR_ENG[1] * zoom, NEAR_ENG[2] * zoom];
  return { yaw, pitch, dist: 150, scale, cx: lerp(660, 610, zoom), cy: lerp(990, 1000, zoom), pivot };
};
const planeVis = (g: number) => (g < 300 ? 1 - io(g, [208, 224], [0, 1]) : io(g, [446, 462], [0, 1]) * (1 - io(g, [560, 576], [0, 1])));

const TRAIL_LEN = 110;
const PlaneLayer: React.FC<{ g: number }> = ({ g }) => {
  const vis = planeVis(g);
  if (vis <= 0.005) return null;
  const view = planeView(g);
  const zoom = zoomOf(g);
  const body = 1 - 0.8 * zoom;
  const trailOp = (1 - clamp01(zoom * 1.6)) * vis;
  const reveal = g >= 400 ? io(g, [446, 486], [0, 1]) : 1;
  const fan = g * 0.55;
  const planeLines = airliner({ fan, body, eng: 1, fanOp: lerp(0.5, 1, zoom), farOp: 1 - 0.85 * zoom });
  const tl = trailLines(TRAIL_LEN);
  // soft cloud underlay along the two trail centres (projected circles, blurred)
  const puffs: React.ReactNode[] = [];
  if (trailOp > 0.01) {
    for (const sx of [1, -1]) {
      for (let i = 0; i <= 22; i++) {
        const d = (i / 22) * TRAIL_LEN * reveal;
        const p = project([sx * ENG[0], ENG[1] - d * 0.012, NOZZLE_Z - 2.4 - d], view);
        const r = (1.1 + 0.2 * d) * p.k * view.scale * 0.5;
        puffs.push(<circle key={`${sx}-${i}`} cx={p.x} cy={p.y} r={r} fill={WH} opacity={0.17 * trailOp * (1 - i / 30)} />);
      }
    }
  }
  return (
    <g opacity={vis} mask="url(#edgeMask)">
      <defs>
        <linearGradient id="edgeFade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" /><stop offset="0.07" stopColor="#fff" /><stop offset="0.93" stopColor="#fff" /><stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="edgeMask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}><rect x="0" y="0" width={W} height={H} fill="url(#edgeFade)" /></mask>
      </defs>
      <g style={{ filter: "blur(16px)" }}>{puffs}</g>
      <g opacity={trailOp}><Wire3D lines={tl} view={view} width={3.2} color={WH} accent={WH} depthFade={0.3} glow={9} reveal={reveal} /></g>
      <Wire3D lines={planeLines} view={view} width={2.7} glow={zoom > 0.5 ? 4 : 7} depthFade={0.25} hiddenFade={0.35} />
    </g>
  );
};

/* ───────────────────────── scene 1: fuel + air -> water (engine close-up) ───────────────────────── */
const Fuel: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.fuel + 22, T.cold - 2, 10, 12);
  if (o <= 0.01) return null;
  const v = planeView(g);
  const I = project([NEAR_ENG[0], ENG[1], INLET_Z], v);
  const C = project([NEAR_ENG[0], ENG[1], -2.2], v);
  const N = project([NEAR_ENG[0], ENG[1], NOZZLE_Z - 2.4], v);
  const air = Array.from({ length: 26 }, (_, i) => {
    const u = fract(g * 0.0125 + (i * 0.6180339) % 1), s = rnd(i, 3);
    const x = I.x + Math.min(330, 1010 - I.x) * (1 - u), y = I.y + s * 62 * (1 - u * 0.8) + 4 * Math.sin(g * 0.2 + i);
    const inside = u > 0.97;
    return inside ? null : <circle key={i} cx={x} cy={y} r={5.5} fill="none" stroke="#8FD0FF" strokeWidth={2.4} opacity={0.9 * clamp01(u * 6) * win(g, CUE.burnIn, T.cold, 8, 12)} />;
  });
  const fuelDrops = Array.from({ length: 7 }, (_, i) => {
    const u = fract(g * 0.018 + i / 7);
    return <circle key={i} cx={C.x + 8 * rnd(i, 9)} cy={C.y - 215 + u * 175} r={8 - 2 * u} fill={AM} opacity={win(g, CUE.burnIn, T.cold, 8, 12) * (u < 0.9 ? 1 : 0)} />;
  });
  const burn = win(g, CUE.burn, T.cold - 4, 10, 12);
  const pulse = 0.7 + 0.3 * Math.sin(g * 0.45);
  const surge = io(g, [CUE.surge - 4, CUE.surge + 10], [0, 1]);
  const exh = Array.from({ length: 46 }, (_, i) => {
    const sp = 0.012 + 0.007 * surge;
    const u = fract(g * sp + (i * 0.7548776) % 1), s = rnd(i, 5);
    const reach = Math.max(180, N.x - 100);
    const x = N.x - 20 - u * reach, y = N.y + s * (12 + 80 * u) - 20 * u;
    const kind = i % 6 === 0 ? "co2" : i % 6 === 3 ? "soot" : "h2o";
    const fo = win(g, CUE.steam - 20, T.cold, 10, 10) * clamp01(u * 8) * (1 - clamp01((u - 0.85) * 7));
    if (kind === "co2") return <rect key={i} x={x - 6} y={y - 6} width={12} height={12} fill="none" stroke={K.muted} strokeWidth={2.4} opacity={0.85 * fo} />;
    if (kind === "soot") return <circle key={i} cx={x} cy={y} r={4} fill={AM} opacity={0.7 * fo} />;
    const hot = clamp01(1 - u * 1.6);
    const col = hot > 0.3 ? AM : WH;
    return (
      <g key={i} opacity={fo}>
        <circle cx={x} cy={y} r={13 + 5 * u} fill={col} fillOpacity={0.12 + 0.12 * hot} stroke={col} strokeWidth={2.6} />
      </g>
    );
  });
  const lab = (t: [string, string?][], x: number, y: number, o2: number, c = WH) => <Chem x={x} y={y} parts={t} size={22} c={c} op={o2} />;
  void lab;
  return (
    <g opacity={o}>
      {air}
      {fuelDrops}
      <ellipse cx={C.x} cy={C.y} rx={120} ry={64} fill="url(#burnGrad)" opacity={burn * pulse} />
      <defs><radialGradient id="burnGrad"><stop offset="0" stopColor="#FFE9B0" stopOpacity={0.95} /><stop offset="0.35" stopColor={AM} stopOpacity={0.55} /><stop offset="1" stopColor={AM} stopOpacity={0} /></radialGradient></defs>
      {exh}
      {/* labels */}
      <g opacity={win(g, CUE.burnIn, T.cold, 8, 12)}>
        {T_(Math.min(I.x + 130, 930), I.y - 92, "AIR · OXYGEN", { size: 24, c: "#8FD0FF", a: "middle" })}
        {T_(C.x, C.y - 250, "FUEL", { size: 26, c: AM, a: "middle", w: 700 })}
      </g>
      <g opacity={win(g, CUE.burn, T.cold, 8, 12)}>{T_(C.x + 20, C.y + 112, "BURNS", { size: 24, c: AM, a: "middle", w: 700 })}</g>
      <g opacity={win(g, CUE.steam, T.cold, 10, 12)}>
        <Pill x={N.x + 40} y={N.y - 170} text="HOT STEAM" size={28} solid pop={ioB(g, CUE.steam, CUE.steam + 12)} />
        <line x1={N.x + 40} y1={N.y - 140} x2={N.x - 30} y2={N.y - 24} stroke={AM} strokeWidth={2.6} strokeDasharray="6 6" />
      </g>
    </g>
  );
};
const FuelDiagram: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, CUE.equation, T.cold - 2, 10, 12);
  const num = win(g, CUE.number, T.cold - 2, 10, 12);
  if (o <= 0.01) return null;
  return (
    <g>
      <g opacity={o}>
        <rect x={80} y={1236} width={920} height={86} rx={14} fill="rgba(3,11,24,0.82)" stroke={DIM} strokeWidth={2} />
        {T_(120, 1292, "FUEL", { size: 40, c: AM, w: 700 })}
        {T_(262, 1292, "+", { size: 40, c: K.muted, w: 500 })}
        <Chem x={318} y={1292} parts={[["O", "2"]]} size={40} c="#8FD0FF" a="start" />
        <path d="M 430 1279 L 500 1279 M 484 1264 L 502 1279 L 484 1294" fill="none" stroke={WH} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <Chem x={530} y={1292} parts={CO2} size={40} c={WH} a="start" />
        {T_(642, 1292, "+", { size: 40, c: K.muted, w: 500 })}
        <Chem x={696} y={1292} parts={[["H", "2"], ["O"]]} size={40} c={AM} a="start" />
        {T_(806, 1292, "+ SOOT", { size: 26, c: K.muted, w: 600 })}
      </g>
      <g opacity={num}>
        <Pill x={540} y={1190} text="ABOUT 1.2 KG WATER PER 1 KG FUEL" size={25} color={WH} pop={ioB(g, CUE.number, CUE.number + 12)} />
      </g>
    </g>
  );
};

/* ───────────────────────── scene 2: it is minus fifty up there ───────────────────────── */
const ALT0 = 1350, KM = 54;                       // 0 km at y 1350, 54 px per km  (12 km -> y 702)
const altY = (km: number) => ALT0 - km * KM;
const isa = (km: number) => (km <= 11 ? 15 - 6.5 * km : -56.5);
const Cold: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.cold + 2, T.ice - 2, 10, 10);
  if (o <= 0.01) return null;
  const climb = io(g, [CUE.climb0, CUE.climb1], [0, 1], easeInOut);
  const km = 10 * climb;
  const temp = isa(km);
  const planeY = altY(km);
  const tubeTop = 730, tubeBot = 1320;                // thermometer tube y-range = +20 .. -60 C
  const ty = (c: number) => lerp(tubeBot, tubeTop, (c + 60) / 80);
  const fillY = ty(temp);
  const ticks = [-60, -40, -20, 0, 20];
  const frost = clamp01((15 - temp) / 65);
  const view: WireView = { yaw: 1.48, pitch: 0.12, dist: 150, scale: 3.5, cx: 400, cy: planeY - 2, pivot: [0, 0, 0] };
  const planeL = airliner({ fan: g * 0.5, body: 1, eng: 1, fanOp: 0.4 });
  const read = win(g, CUE.readout - 10, T.ice - 2, 10, 10);
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id="skyG" x1="0" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor="#1B5C8F" stopOpacity={0.55} /><stop offset="0.5" stopColor="#0B2245" stopOpacity={0.8} /><stop offset="1" stopColor="#03101F" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <rect x={140} y={altY(12)} width={690} height={altY(0) - altY(12)} fill="url(#skyG)" stroke={DIM} strokeWidth={2} />
      {/* cruise band 8-12 km */}
      <rect x={140} y={altY(12)} width={690} height={KM * 4} fill={LN} opacity={0.07} />
      <line x1={140} y1={altY(8)} x2={830} y2={altY(8)} stroke={LN} strokeWidth={2} strokeDasharray="14 10" opacity={0.6} />
      {T_(160, altY(12) + 32, "ABOUT 8–12 KM", { size: 22, c: LN, a: "start", op: win(g, T.cold + 8, T.ice, 8, 8) })}
      {T_(160, altY(12) + 58, "CRUISE", { size: 22, c: LN, a: "start", op: win(g, T.cold + 8, T.ice, 8, 8) })}
      {/* ground */}
      <rect x={140} y={altY(0)} width={690} height={8} fill={K.muted} opacity={0.5} />
      {/* ruler */}
      <line x1={118} y1={altY(0)} x2={118} y2={altY(12)} stroke={K.muted} strokeWidth={2.4} />
      {[0, 2, 4, 6, 8, 10, 12].map((k) => (
        <g key={k}>
          <line x1={104} y1={altY(k)} x2={128} y2={altY(k)} stroke={K.muted} strokeWidth={2.4} />
          {T_(96, altY(k) + 8, k === 0 ? "0" : String(k), { size: 22, c: K.muted, a: "end", ls: 1 })}
        </g>
      ))}
      {T_(118, altY(12) - 20, "KM", { size: 20, c: K.muted, a: "middle" })}
      {/* frost specks around the plane grow as it gets colder */}
      {Array.from({ length: 22 }, (_, i) => {
        const x = 180 + ((i * 97) % 640), y = altY(0) - 120 - ((i * 233) % 1000) * 0.62;
        const show = clamp01((frost - 0.25) * 1.6) * (i % 3 === 0 ? 1 : 0.6);
        return <Crystal key={i} x={x} y={y} r={7 + (i % 3) * 3} rot={g * 0.01 + i} o={0.35 * show} color={LN} sw={1.6} />;
      })}
      {/* dashed link from plane to thermometer */}
      <line x1={470} y1={planeY} x2={880} y2={fillY} stroke={AM} strokeWidth={2} strokeDasharray="6 8" opacity={0.3} />
      {/* thermometer */}
      <g>
        <rect x={886} y={tubeTop - 14} width={36} height={tubeBot - tubeTop + 28} rx={18} fill="rgba(3,11,24,0.9)" stroke={DIM} strokeWidth={2.4} />
        <rect x={896} y={fillY} width={16} height={tubeBot - fillY + 20} rx={8} fill={temp < -10 ? LN : AM} opacity={0.95} />
        <circle cx={904} cy={tubeBot + 36} r={32} fill={temp < -10 ? LN : AM} stroke={DIM} strokeWidth={2.4} />
        {ticks.map((c) => (
          <g key={c}>
            <line x1={866} y1={ty(c)} x2={884} y2={ty(c)} stroke={K.muted} strokeWidth={2.2} />
            {T_(858, ty(c) + 8, c > 0 ? `+${c}` : c < 0 ? `-${-c}` : "0", { size: 20, c: c === -40 ? AM : K.muted, a: "end", ls: 1 })}
          </g>
        ))}
        {T_(904, tubeTop - 30, "°C", { size: 22, c: K.muted, a: "middle" })}
      </g>
      {/* plane */}
      <Wire3D lines={planeL} view={view} width={2.4} glow={6} depthFade={0.3} />
      {T_(400, planeY + 92, `${km.toFixed(0)} KM UP`, { size: 22, c: LN, a: "middle", op: clamp01(climb * 3) })}
      {/* big readout */}
      <g opacity={read}>
        <text x={480} y={altY(5.7)} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={190} letterSpacing={-8} fill={AM}>{temp < 0 ? `-${Math.round(-temp)}` : `${Math.round(temp)}`}</text>
        {T_(480, altY(5.7) + 56, "°C · AIR AT 10 KM", { size: 28, c: K.muted, a: "middle" })}
        {T_(480, altY(5.7) + 90, "STANDARD ATMOSPHERE · REAL AIR VARIES", { size: 19, c: K.muted, a: "middle", op: 0.8 })}
      </g>
    </g>
  );
};

/* ───────────────────────── scene 3: steam freezes into ice crystals (+ breath) ───────────────────────── */
const NX = 100, NY = 868, LIFE = 130, NP = 52;
const Ice: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.ice + 2, T.line + 8, 10, 8);
  if (o <= 0.01) return null;
  const t0 = T.ice + 4;
  const parts = Array.from({ length: NP }, (_, i) => {
    const birth = t0 + (i * LIFE) / NP;
    if (g < birth) return null;
    const u = ((g - birth) % LIFE) / LIFE;
    const uf = 0.4 + 0.07 * rnd(i, 1);
    const x = 128 + u * 880, y = NY + rnd(i, 2) * (6 + 105 * u) + 8 * Math.sin(g * 0.12 + i) * u;
    if (u < uf - 0.07) return <circle key={i} cx={x} cy={y} r={11} fill={AM} fillOpacity={0.22} stroke={AM} strokeWidth={2.6} />;
    if (u < uf) { const m = (u - (uf - 0.07)) / 0.07; return <circle key={i} cx={x} cy={y} r={lerp(11, 7, m)} fill={m > 0.5 ? LN : AM} fillOpacity={0.3} stroke={m > 0.5 ? LN : AM} strokeWidth={2.6} />; }
    const m = clamp01((u - uf) / 0.05);
    return <Crystal key={i} x={x} y={y} r={lerp(6, 15, m)} rot={g * 0.03 + i} o={clamp01((1 - u) * 5) * 0.95} />;
  });
  // white cloud band behind the crystals
  const band = io(g, [CUE.freeze, CUE.zoom + 40], [0, 1]);
  const showBreath = io(g, [CUE.breath - 4, CUE.breath + 8], [0, 1]);
  const topDim = 1 - 0.35 * showBreath;
  return (
    <g opacity={o}>
      <g opacity={topDim}>
        {/* stage */}
        <rect x={72} y={706} width={896} height={324} rx={10} fill="rgba(5,18,38,0.65)" stroke={DIM} strokeWidth={2} />
        <defs><linearGradient id="hotcold" x1="0" x2="1"><stop offset="0" stopColor={AM} stopOpacity={0.28} /><stop offset="0.38" stopColor={AM} stopOpacity={0.02} /><stop offset="1" stopColor={LN} stopOpacity={0.1} /></linearGradient></defs>
        <rect x={72} y={706} width={896} height={324} rx={10} fill="url(#hotcold)" />
        <g style={{ filter: "blur(20px)" }}><ellipse cx={730} cy={NY} rx={270 * band} ry={50 + 40 * band} fill={WH} opacity={0.2 * band} /></g>
        {/* engine nozzle */}
        <path d={`M ${NX - 44} ${NY - 36} L ${NX - 4} ${NY - 18} L ${NX - 4} ${NY + 18} L ${NX - 44} ${NY + 36} Z`} fill="none" stroke={AM} strokeWidth={3.2} strokeLinejoin="round" />
        <line x1={NX - 44} y1={NY - 36} x2={NX - 44} y2={NY + 36} stroke={AM} strokeWidth={3.2} />
        {parts}
        {/* brackets */}
        <g opacity={win(g, CUE.hot, T.line, 8, 10)}>
          <path d={`M 140 744 L 140 732 L 440 732 L 440 744`} fill="none" stroke={AM} strokeWidth={2.6} />
          {T_(290, 722, "HOT STEAM", { size: 24, c: AM, a: "middle", w: 700 })}
        </g>
        <g opacity={win(g, CUE.crystals, T.line, 8, 10)}>
          <path d={`M 560 744 L 560 732 L 940 732 L 940 744`} fill="none" stroke={WH} strokeWidth={2.6} />
          {T_(750, 722, "ICE CRYSTALS", { size: 24, c: WH, a: "middle", w: 700 })}
        </g>
        {/* freeze front */}
        <g opacity={win(g, CUE.freeze, T.line, 6, 10)}>
          <line x1={496} y1={750} x2={496} y2={1000} stroke={LN} strokeWidth={2.6} strokeDasharray="10 8" />
          <Pill x={496} y={1018} text="FREEZES" size={24} color={LN} solid pop={ioB(g, CUE.freeze, CUE.freeze + 10)} />
        </g>
        {T_(980, 1004, "COLD AIR", { size: 20, c: LN, a: "end", op: 0.9 })}
      </g>
      {/* crystal zoom (until the breath comparison) */}
      <g opacity={win(g, CUE.freeze + 6, CUE.breath - 2, 10, 8)}>
        <line x1={720} y1={900} x2={640} y2={1100} stroke={WH} strokeWidth={2} strokeDasharray="6 7" opacity={0.7} />
        <circle cx={540} cy={1226} r={142} fill="rgba(3,11,24,0.85)" stroke={WH} strokeWidth={3} />
        <Crystal x={540} y={1226} r={104} rot={g * 0.012} sw={4.4} />
        {T_(540, 1400, "TINY ICE CRYSTAL · MAGNIFIED", { size: 21, c: K.muted, a: "middle" })}
      </g>
      {/* breath comparison */}
      <Breath g={g} />
    </g>
  );
};
const Breath: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, CUE.breath - 2, T.line, 10, 8);
  if (o <= 0.01) return null;
  const BY = 1226;
  const dots = Array.from({ length: 34 }, (_, i) => {
    const birth = CUE.breath + (i * 90) / 34;
    if (g < birth) return null;
    const u = ((g - birth) % 90) / 90;
    const x = 210 + u * 740, y = BY - 30 * u + rnd(i, 4) * (4 + 46 * u);
    if (u < 0.28) return <circle key={i} cx={x} cy={y} r={7} fill={AM} fillOpacity={0.25} stroke={AM} strokeWidth={2.4} />;
    const m = clamp01((u - 0.28) / 0.3);
    return <circle key={i} cx={x} cy={y} r={lerp(8, 30, m)} fill={WH} opacity={lerp(0.1, 0.26, m) * (1 - clamp01((u - 0.8) * 5))} />;
  });
  return (
    <g opacity={o}>
      <rect x={72} y={1076} width={896} height={300} rx={10} fill="rgba(5,18,38,0.65)" stroke={DIM} strokeWidth={2} />
      <g style={{ filter: "blur(6px)" }}>{dots}</g>
      {dots}
      <ellipse cx={180} cy={BY} rx={20} ry={12} fill="none" stroke={AM} strokeWidth={3.2} />
      <line x1={160} y1={BY} x2={200} y2={BY} stroke={AM} strokeWidth={2.2} />
      {T_(178, BY + 62, "YOUR BREATH", { size: 22, c: AM, a: "middle", w: 700 })}
      {T_(940, 1112, "COLD DAY", { size: 20, c: LN, a: "end", op: 0.9 })}
      <Pill x={700} y={1330} text="SAME IDEA" size={26} solid pop={ioB(g, CUE.same, CUE.same + 12)} o={io(g, [CUE.same, CUE.same + 6], [0, 1])} />
    </g>
  );
};

/* ───────────────────────── scene 4: the white line (3D plane returns) ───────────────────────── */
const Line: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.line, T.air + 4, 4, 14);
  if (o <= 0.01) return null;
  const v = planeView(g);
  const a = project([ENG[0], ENG[1], NOZZLE_Z - 2.4 - 70], v);
  const mx = 250, my = 1215;
  const pts = Array.from({ length: 10 }, (_, i) => ({ x: mx + rnd(i, 6) * 78, y: my + rnd(i, 7) * 78, r: 9 + (i % 3) * 5, s: rnd(i, 8) }));
  return (
    <g opacity={o}>
      <Pill x={540} y={706} text="THE WHITE LINE" size={28} solid pop={ioB(g, CUE.line, CUE.line + 12)} o={win(g, CUE.line, CUE.thin + 6, 4, 8)} />
      <Pill x={540} y={706} text="A THIN CLOUD OF ICE" size={28} solid pop={ioB(g, CUE.thin, CUE.thin + 12)} o={win(g, CUE.thin, CUE.notsmoke + 4, 4, 8)} />
      <g opacity={win(g, CUE.thin + 4, T.air, 10, 12)}>
        <line x1={mx + 100} y1={my - 95} x2={a.x} y2={a.y} stroke={WH} strokeWidth={2} strokeDasharray="6 7" opacity={0.7} />
        <circle cx={a.x} cy={a.y} r={22} fill="none" stroke={WH} strokeWidth={2.6} />
        <circle cx={mx} cy={my} r={128} fill="rgba(3,11,24,0.88)" stroke={WH} strokeWidth={3} />
        {pts.map((p, i) => <Crystal key={i} x={p.x} y={p.y} r={p.r} rot={g * 0.015 * (1 + p.s) + i} o={0.95} sw={2.2} />)}
        {T_(mx, my + 160, "ICE CRYSTALS · MAGNIFIED", { size: 20, c: K.muted, a: "middle" })}
      </g>
      <g opacity={win(g, CUE.notsmoke, T.air, 8, 12)}>
        <Pill x={720} y={1300} text="ICE, NOT SMOKE" size={30} color={AM} solid pop={ioB(g, CUE.notsmoke, CUE.notsmoke + 12)} />
      </g>
    </g>
  );
};

/* ───────────────────────── scene 5: dry vs humid air ───────────────────────── */
const Sky: React.FC<{ g: number; x0: number; start: number; humid: boolean }> = ({ g, x0, start, humid }) => {
  const pw = 465, y0 = 706, ph = 560;
  const l = g - start;
  if (l < -2) return null;
  const fly = clamp01(l / 30);                                // plane crosses the panel
  const px = x0 + 40 + (pw - 150) * fly, py = y0 + 150;
  const puffs = Array.from({ length: 30 }, (_, i) => {
    const bx = x0 + 40 + ((pw - 150) * i) / 29;                // where the plane was when it dropped this puff
    if (bx > px) return null;
    const born = start + (30 * i) / 29;
    const age = Math.max(0, g - born);
    if (humid) {
      const gr = clamp01(age / 70);
      const r = lerp(9, 26 + 18 * Math.abs(rnd(i, 1)), gr);
      const dy = rnd(i, 2) * 24 * gr + gr * 20 * Math.sin(i);
      return <ellipse key={i} cx={bx + rnd(i, 3) * 10 * gr} cy={py + 6 + dy} rx={r * 1.5} ry={r * 0.8} fill={WH} opacity={lerp(0.26, 0.2, gr)} />;
    }
    const gone = io(g, [CUE.fades + (i / 29) * 10, CUE.fades + 26 + (i / 29) * 14], [0, 1], easeInOut);   // oldest (left) end dissolves first
    const sh = 1 - gone;
    if (sh <= 0.01) return null;
    return <ellipse key={i} cx={bx} cy={py + 6} rx={17 * sh + 2} ry={10 * sh + 1} fill={WH} opacity={0.6 * sh} />;
  });
  const dots = Array.from({ length: humid ? 56 : 12 }, (_, i) => (
    <circle key={i} cx={x0 + 24 + (((i * 83) % 417) + 8)} cy={y0 + 30 + (((i * 137) % 480) + 4)} r={3} fill="#8FD0FF" opacity={0.28 + 0.2 * Math.sin(g * 0.1 + i)} />
  ));
  // extra wisps that spread (humid only)
  const spread = humid ? io(g, [CUE.spreads, CUE.spreads + 36], [0, 1], easeOut) : 0;
  const wisps = humid ? Array.from({ length: 7 }, (_, i) => (
    <ellipse key={i} cx={x0 + 120 + i * 40} cy={py + 6 + (i - 3) * 28 * spread} rx={(40 + 18 * (i % 3)) * (0.6 + 0.9 * spread)} ry={(8 + 12 * spread)} fill={WH} opacity={0.12 * spread} />
  )) : null;
  const dryDone = !humid ? io(g, [CUE.fades + 10, CUE.fades + 40], [0, 1]) : 0;
  return (
    <g>
      <rect x={x0} y={y0} width={pw} height={ph} rx={10} fill="rgba(5,18,38,0.7)" stroke={humid ? LN : DIM} strokeWidth={2.4} />
      <clipPath id={`clip${x0}`}><rect x={x0} y={y0} width={pw} height={ph} rx={10} /></clipPath>
      <g clipPath={`url(#clip${x0})`}>
        <rect x={x0} y={y0} width={pw} height={ph} fill={humid ? LN : AM} opacity={humid ? 0.12 : 0.04} />
        {dots}
        <g style={{ filter: "blur(9px)" }}>{puffs}{wisps}</g>
        <g>{puffs}</g>
        <Wire3D lines={airliner({ fan: g * 0.5, fanOp: 0.3 })} view={{ yaw: 1.5, pitch: 0.14, dist: 150, scale: 2.5, cx: px, cy: py - 14, pivot: [0, 0, 0] }} width={2.1} glow={5} depthFade={0.35} />
        {/* sparkle where ice vanishes */}
        {!humid && dryDone < 1 && dryDone > 0 && Array.from({ length: 6 }, (_, i) => <circle key={i} cx={x0 + 60 + dryDone * 300 + i * 22} cy={py + 6 + rnd(i, 8) * 16} r={2.5} fill={WH} opacity={0.6 * (1 - dryDone)} />)}
      </g>
      {T_(x0 + 18, y0 + 34, humid ? "HUMID AIR" : "DRY AIR", { size: 22, c: humid ? LN : AM, w: 700 })}
      {T_(x0 + pw - 18, y0 + ph - 18, "TIME-LAPSE", { size: 18, c: K.muted, a: "end", op: 0.9 })}
    </g>
  );
};
const Air: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.air + 2, T.end + 10, 10, 10);
  if (o <= 0.01) return null;
  return (
    <g opacity={o}>
      <Sky g={g} x0={60} start={CUE.dry} humid={false} />
      <g opacity={io(g, [CUE.humidL - 18, CUE.humidL - 6], [0.0, 1])}><Sky g={g} x0={555} start={CUE.humidL} humid /></g>
      <Pill x={292} y={1322} text="DRY AIR: GONE" size={25} color={AM} solid pop={ioB(g, CUE.fades, CUE.fades + 12)} o={io(g, [CUE.fades, CUE.fades + 4], [0, 1])} />
      <Pill x={788} y={1322} text="HUMID AIR: LINGERS" size={25} color={LN} solid pop={ioB(g, CUE.spreads, CUE.spreads + 12)} o={io(g, [CUE.spreads, CUE.spreads + 4], [0, 1])} />
      {T_(292, 1366, "SECONDS TO MINUTES", { size: 19, c: K.muted, a: "middle", op: io(g, [CUE.fades + 8, CUE.fades + 16], [0, 1]) })}
      {T_(788, 1366, "MINUTES TO HOURS", { size: 19, c: K.muted, a: "middle", op: io(g, [CUE.spreads + 8, CUE.spreads + 16], [0, 1]) })}
    </g>
  );
};

/* ───────────────────────── scene 6: fly low, no trail ───────────────────────── */
const End: React.FC<{ g: number }> = ({ g }) => {
  const o = win(g, T.end + 2, T.total + 40, 10, 10);
  if (o <= 0.01) return null;
  const colX = 118;
  const lowKm = 2, highKm = 10, thrKm = (15 + 40) / 6.5;       // -40 C in the standard atmosphere = 8.46 km
  const lowIn = io(g, [T.end + 2, T.end + 30], [0, 1], easeOut);
  const lowX = lerp(180, 640, lowIn);
  const warmP = win(g, CUE.warm, T.total + 40, 8, 8);
  const flashT = Math.max(0, 1 - Math.abs(g - CUE.warm - 6) / 12);
  const highIn = io(g, [T.end + 8, T.end + 30], [0, 1]);
  const view = (x: number, km: number): WireView => ({ yaw: 1.48 + 0.02 * Math.sin(g * 0.03), pitch: 0.12, dist: 150, scale: 3.5, cx: x, cy: altY(km) - 2, pivot: [0, 0, 0] });
  const planeHi = airliner({ fan: g * 0.5, fanOp: 0.4 });
  const trail = Array.from({ length: 14 }, (_, i) => <ellipse key={i} cx={470 - 12 - i * 18} cy={altY(highKm) + 5} rx={14 + i * 1.8} ry={5 + i * 0.5} fill={WH} opacity={0.34 * (1 - i / 16)} />);
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id="tempG" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor={AM} /><stop offset="0.55" stopColor="#8FB3D1" /><stop offset="1" stopColor={LN} /></linearGradient>
        <linearGradient id="skyE" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor={AM} stopOpacity={0.16} /><stop offset="0.45" stopColor="#0B2245" stopOpacity={0.7} /><stop offset="1" stopColor="#03101F" stopOpacity={0.95} /></linearGradient>
      </defs>
      <rect x={150} y={altY(12)} width={850} height={altY(0) - altY(12)} fill="url(#skyE)" stroke={DIM} strokeWidth={2} />
      {/* temperature column */}
      <rect x={colX - 8} y={altY(12)} width={16} height={altY(0) - altY(12)} rx={8} fill="url(#tempG)" opacity={0.95} />
      {[0, 2, 4, 6, 8, 10, 12].map((k) => (
        <g key={k}>
          <line x1={colX + 12} y1={altY(k)} x2={colX + 30} y2={altY(k)} stroke={K.muted} strokeWidth={2.2} />
          {T_(colX - 20, altY(k) + 8, String(k), { size: 20, c: K.muted, a: "end", ls: 1 })}
        </g>
      ))}
      {T_(colX, altY(12) - 18, "KM", { size: 18, c: K.muted, a: "middle" })}
      {/* the -40 C line */}
      <g opacity={io(g, [T.end + 6, T.end + 20], [0, 1])}>
        <line x1={150} y1={altY(thrKm)} x2={1000} y2={altY(thrKm)} stroke={AM} strokeWidth={3} strokeDasharray="16 10" opacity={0.7 + 0.3 * flashT} />
        {T_(990, altY(thrKm) - 14, "-40 °C", { size: 26, c: AM, a: "end", w: 700 })}
        {T_(990, altY(thrKm) - 46, "COLD ENOUGH FOR TRAILS", { size: 20, c: LN, a: "end", op: 0.95 })}
        {T_(990, altY(thrKm) + 36, "TOO WARM", { size: 20, c: AM, a: "end", op: 0.95 })}
      </g>
      {/* high plane with trail */}
      <g opacity={highIn}>
        <g style={{ filter: "blur(5px)" }}>{trail}</g>
        <Wire3D lines={planeHi} view={view(470, highKm)} width={2.4} glow={6} depthFade={0.3} />
        {T_(470, altY(highKm) + 78, "10 KM · -50 °C", { size: 21, c: LN, a: "middle" })}
        {T_(250, altY(highKm) - 28, "TRAIL", { size: 20, c: WH, a: "middle", w: 700 })}
      </g>
      {/* low plane: no trail */}
      <g>
        <Wire3D lines={planeHi} view={view(lowX, lowKm)} width={2.4} glow={6} depthFade={0.3} />
        <g opacity={win(g, CUE.notrail - 6, T.total + 40, 8, 8)}>
          <Pill x={lowX - 200} y={altY(lowKm) + 6} text="NO TRAIL" size={26} color={K.red} solid pop={ioB(g, CUE.notrail - 4, CUE.notrail + 8)} />
        </g>
        <g opacity={warmP}>
          {T_(lowX + 10, altY(lowKm) + 82, "2 KM · +2 °C · WARM", { size: 21, c: AM, a: "middle", w: 700 })}
        </g>
      </g>
      {T_(575, altY(6), "STANDARD ATMOSPHERE · REAL AIR VARIES", { size: 18, c: K.muted, a: "middle", op: 0.85 })}
    </g>
  );
};

/* ───────────────────────── main shot ───────────────────────── */
export const ContrailsShot: React.FC = () => {
  const g = useCurrentFrame();
  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Headline f={g} lines={["Why do planes", "leave *white trails?*"]} at={-30} exitAt={T.fuel - 12} size={100} />
      <Headline f={g} lines={["Fuel burns into", "*water vapour*"]} at={T.fuel + 3} exitAt={T.cold - 8} size={100} />
      <Headline f={g} lines={["Up there it's", "*minus fifty*"]} at={T.cold + 3} exitAt={T.ice - 8} size={104} />
      <Headline f={g} lines={["Steam meets cold,", "turns to *ice*"]} at={T.ice + 3} exitAt={T.line - 8} size={100} />
      <Headline f={g} lines={["That's the", "*white line*"]} at={T.line + 3} exitAt={T.air - 8} size={108} />
      <Headline f={g} lines={["Dry air: *gone.*", "Humid air: *stays.*"] } at={T.air + 3} exitAt={T.end - 8} size={96} />
      <Headline f={g} lines={["Fly low?", "*No trail.*"]} at={T.end + 3} size={112} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <PlaneLayer g={g} />
        <Fuel g={g} />
        <FuelDiagram g={g} />
        <Cold g={g} />
        <Ice g={g} />
        <Line g={g} />
        <Air g={g} />
        <End g={g} />
        {/* hook pills (frame 0 is already a finished hook) */}
        <g opacity={win(g, -10, CUE.cloud + 4, 8, 8) * planeVis(g)}>
          <Pill x={300} y={1262} text="NOT SMOKE" size={28} color={K.muted} strike pop={1} />
        </g>
        <g opacity={win(g, CUE.cloud, T.fuel + 2, 4, 8)}>
          <Pill x={680} y={1262} text="A CLOUD OF ICE" size={28} solid pop={ioB(g, CUE.cloud, CUE.cloud + 12)} />
        </g>
        <g opacity={io(g, [20, 36], [0, 1])}>{T_(540, 1584, g >= T.cold - 20 && g < T.ice ? "STANDARD-ATMOSPHERE VALUES · NOT TO SCALE" : "SIMPLIFIED SCHEMATIC · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}</g>
      </svg>

      <Panel o={pn(-10, T.fuel + 2)} a="CONTRAIL = CONDENSATION TRAIL" b={<>Not smoke. A <Em>cloud</Em> of ice.</>} c="Tiny ice crystals · made in the engine exhaust" />
      <Panel o={pn(T.fuel, CUE.number)} a="STEP 1 · THE ENGINE" b={<>Burning fuel makes <Em>water</Em></>} c="Fuel + oxygen from the air → CO₂ + water vapour" />
      <Panel o={pn(CUE.number, T.cold + 2)} a="STEP 1 · THE ENGINE" b={<>Hot, wet <Em>exhaust</Em></>} c="About 1.2 kg of water per 1 kg of jet fuel" />
      <Panel o={pn(T.cold, T.ice + 2)} a="STEP 2 · ABOUT 8–12 KM UP" b={<>Air around <Em>-50 °C</Em></>} c="Trails need air colder than about -40 °C" />
      <Panel o={pn(T.ice, CUE.breath + 2)} a="STEP 3 · HOT STEAM MEETS COLD AIR" b={<>Steam <Em>freezes</Em> into ice crystals</>} c="Water condenses on tiny particles, then freezes" />
      <Panel o={pn(CUE.breath, T.line + 2)} a="SAME IDEA AS YOUR BREATH" b={<>Warm, wet air meets <Em>cold</Em> air</>} c="You see your breath on a cold day · FAA" />
      <Panel o={pn(T.line, CUE.notsmoke + 2)} a="STEP 4 · THE WHITE LINE" b={<>A thin <Em>cloud of ice</Em></>} c="Ice crystals trail behind the engines" />
      <Panel o={pn(CUE.notsmoke, T.air + 2)} a="STEP 4 · THE WHITE LINE" b={<>It's <Em>ice</Em>, not smoke</>} c="Water frozen in the exhaust" />
      <Panel o={pn(T.air, CUE.humidL)} a="STEP 5 · IT DEPENDS ON THE AIR" b={<><Em>Dry</Em> air: the trail fades</>} c="Ice turns back into invisible vapour" />
      <Panel o={pn(CUE.humidL, T.end + 2)} a="STEP 5 · IT DEPENDS ON THE AIR" b={<><Em>Humid</Em> air: it stays, spreads</>} c="Can last hours · can spread into cirrus-like cloud" />
      <Panel o={pn(T.end, T.total + 20)} a="LOW ALTITUDE" b={<>Warm air: <Em>no trail</Em></>} c="Trails usually need air colder than about -40 °C" />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 296, display: "flex", justifyContent: "center", fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>HOW IT WORKS · 17</div>
    <Headline f={200} lines={["Why do planes", "leave *white*", "*trails?*"]} at={0} size={124} top={350} />
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Frame />
      <PlaneLayer g={34} />
      <g opacity={1}><Pill x={300} y={1262} text="NOT SMOKE" size={28} color={K.muted} strike /></g>
      <g opacity={1}><Pill x={680} y={1262} text="A CLOUD OF ICE" size={28} solid /></g>
      {T_(540, 1584, "SIMPLIFIED SCHEMATIC · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}
    </svg>
  </>
);
void easeOut; void INLET_Z;
