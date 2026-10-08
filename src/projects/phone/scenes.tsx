import React from "react";
import { useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Tag, clamp01, ioB, meshPhase, W, H, TAU } from "../gearbox/kit";

/**
 * HOW IT WORKS #14 — What's inside a smartphone          30 s · 1080×1920 · 30 fps · 900 frames
 *
 * BEATS PLAN — one idea per beat, the picture shows exactly what the voice says (VO phrases: public/projects/phone/vo.json)
 *   0   hook     "Let's open your phone up."                    finished phone, front-on; at f12 it pops apart into two layers (glass lifts, insides drop)
 *   49  glass    "Glass on top. Wires under it feel your finger." glass layer: grid of invisible wires; a finger lands, drags; the wire row + column under it light up
 *   148 battery  "Next, the battery. It stores energy, and it's the biggest part."  glass fades away, insides rise; battery lights up and fills with energy
 *   295 share    "In one very thin phone, it's two thirds of the inside."  bar: battery ≈ ⅔ vs everything else ≈ ⅓  (iFixit iPhone Air teardown, via Ars)
 *   395 brain    "The brain is a tiny chip that does the thinking."  chip lights up, magnified card: about 1 cm across
 *   471 switch   "One popular chip has 19 billion tiny on-off switches."  card turns into a field of toggling switches + counter to 19,000,000,000 (A17 Pro, iPhone 15 Pro)
 *   582 camera   "The camera turns light into numbers."          scene → lens → sensor grid of dots, each dot gets one number (how bright)
 *   644 radio    "The radio talks to cell towers and Wi-Fi."     radio chip lights up; invisible waves go both ways to a tower and a router
 *   722 back     "Put it back together, and that's your phone."  layers snap back, see-through phone with 5 tags: THINK · TALK · SEE · TOUCH · POWER
 *   797 end      Follow-for-more end card (same as #12/#13)
 * Facts on screen (sources in the delivery notes): battery ≈ ⅔ of the inside in one very thin phone (iPhone Air teardown, iFixit via Ars Technica);
 * A17 Pro = 19 billion transistors (Apple, iPhone 15 Pro); A17 Pro die ≈ 103.8 mm² ≈ 1 cm across (die-size reports); touch = grid of transparent electrodes,
 * a finger changes the electric field at one spot (touch-panel explainer).
 * SIMPLIFIED (tagged on screen): layout and proportions of the drawing are generic; sensor shown as 6×6 dots; switches are a few of 19 billion; layers drawn flat.
 * Everything is a pure function of the frame.
 */

/** Global frames from public/projects/phone/vo.json. Keep in sync with soundtrack.py. */
export const T = { glass: 49, battery: 148, share: 295, brain: 395, chip: 471, camera: 582, radio: 644, back: 722, end: 797, total: 900 };
export const CUTS = [0, 49, 148, 295, 395, 471, 582, 644, 722, 797];
/** Key cue frames (used by soundtrack.py) */
export const CUE = { pop: 14, tap1: 102, drag: 120, boltFill: 160, biggest: 252, bar: 344, chipOn: 408, count0: 490, count1: 534, shutter: 600, nums: 612, radio: 660, back: 726, snap: 756, tags: 758 };

const AM = K.amber, LN = K.line;
const win = (g: number, a: number, b: number, fi = 8, fo = 8) => io(g, [a, a + fi], [0, 1]) * (1 - io(g, [b - fo, b], [0, 1]));
const VIEW = { x0: 60, x1: 1020, y0: 664, y1: 1396 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ───────────── shared bits ───────────── */
const Frame: React.FC = () => (
  <g>
    {[[VIEW.x0, VIEW.y0, 1, 1], [VIEW.x1, VIEW.y0, -1, 1], [VIEW.x0, VIEW.y1, 1, -1], [VIEW.x1, VIEW.y1, -1, -1]].map(([x, y, sx, sy], k) => (
      <path key={k} d={`M ${x} ${y + sy * 30} L ${x} ${y} L ${x + sx * 30} ${y}`} fill="none" stroke={K.lineDim} strokeWidth={2.4} />
    ))}
  </g>
);
const T_ = (x: number, y: number, s: string, o: { size?: number; c?: string; a?: "start" | "middle" | "end"; w?: number; op?: number; ls?: number } = {}) => (
  <text x={x} y={y} textAnchor={o.a ?? "start"} fontFamily={K.mono} fontWeight={o.w ?? 600} fontSize={o.size ?? 24} letterSpacing={o.ls ?? (o.size ?? 24) * 0.08} fill={o.c ?? K.muted} opacity={o.op ?? 1}>{s}</text>
);

/** Bottom job panel: part name (amber, mono) + one-line job (big) + small note */
const Panel: React.FC<{ o: number; a: string; b: React.ReactNode; c?: string }> = ({ o, a, b, c }) => (
  <div style={{ position: "absolute", left: 80, width: 920, top: 1412, height: 138, opacity: o, borderRadius: 12, border: `2px solid ${K.lineDim}`, background: "rgba(3,11,24,0.85)", boxSizing: "border-box", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4 }}>
    <div style={{ fontFamily: K.mono, fontSize: 27, letterSpacing: 4, color: AM, fontWeight: 700, whiteSpace: "nowrap" }}>{a}</div>
    <div style={{ fontFamily: K.head, fontSize: 43, fontWeight: 700, color: K.text, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1.1 }}>{b}</div>
    {c && <div style={{ fontFamily: K.mono, fontSize: 22, letterSpacing: 1.5, color: K.muted, whiteSpace: "nowrap", fontWeight: 500 }}>{c}</div>}
  </div>
);
const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: AM }}>{children}</span>;

/** Leader line + pill label. (px,py) = the part, (tx,ty) = pill centre. */
const Call: React.FC<{ g: number; at: number; px: number; py: number; tx: number; ty: number; text: string; out?: number; color?: string; size?: number }> = ({ g, at, px, py, tx, ty, text, out, color = AM, size = 32 }) => {
  const p = clamp01((g - at) / 10);
  const o = p * (out !== undefined ? 1 - io(g, [out, out + 8], [0, 1]) : 1);
  if (o <= 0) return null;
  const ex = tx + (px > tx ? 1 : -1) * (text.length * size * 0.36 + size * 0.7), ey = ty;
  return (
    <g opacity={o}>
      <path d={`M ${px} ${py} L ${ex} ${ey}`} stroke={color} strokeWidth={3} fill="none" strokeDasharray="8 6" />
      <circle cx={px} cy={py} r={9} fill={color} />
      <circle cx={px} cy={py} r={9 + 8 * (1 - p)} fill="none" stroke={color} strokeWidth={2} opacity={1 - p} />
      <g transform={`translate(${tx} ${ty}) scale(${0.7 + 0.3 * ioB(g, at, at + 12)})`}>
        <rect x={-text.length * size * 0.36 - size * 0.7} y={-size * 0.95} width={text.length * size * 0.72 + size * 1.4} height={size * 1.9} rx={size * 0.95} fill="rgba(6,20,42,0.92)" stroke={color} strokeWidth={3} />
        <text textAnchor="middle" y={size * 0.34} fontFamily={K.mono} fontWeight={700} fontSize={size} letterSpacing={size * 0.08} fill={color}>{text}</text>
      </g>
    </g>
  );
};

/* ───────────── fake-3D layer projection (locked camera; layers are drawn in their own flat coordinates) ───────────── */
const LW = 330, LH = 680;
type M = { a: number; b: number; c: number; d: number; e: number; f: number };
const mat = (e: number, cx: number, cy: number): M => {
  const th = (55 * Math.PI / 180) * e, fl = 1 - 0.62 * e, s = 1.04 - 0.06 * e;
  return { a: s * Math.cos(th), b: s * fl * Math.sin(th), c: -s * Math.sin(th), d: s * fl * Math.cos(th), e: cx, f: cy };
};
const proj = (m: M, u: number, v: number): [number, number] => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f];
const tf = (m: M, dy = 0) => `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f + dy})`;
const NS = { vectorEffect: "non-scaling-stroke" } as const;
const glow = (h: number, c = AM) => (h > 0.02 ? { filter: `drop-shadow(0 0 ${12 * h}px ${c})` } : undefined);
const mixc = (h: number, base = LN, hi = AM) => (h > 0.5 ? hi : base);

/* ───────────── the layout state, function of the frame ───────────── */
const REST = 1010;
const S = (g: number) => {
  const e = io(g, [12, 44], [0, 1], easeInOut) * (1 - io(g, [T.back, T.back + 36], [0, 1], easeInOut));
  const ex = io(g, [12, 44], [0, 1], easeInOut);                       // explode amount for y offsets
  const back = io(g, [T.back, T.back + 36], [0, 1], easeInOut);
  // vertical positions
  const gy0 = lerp(REST, 835, ex);
  const gyBat = io(g, [T.battery, T.battery + 26], [0, 1], easeInOut);
  const gy = back > 0 ? lerp(835, REST, io(g, [T.back + 6, T.back + 38], [0, 1], easeInOut)) : lerp(gy0, 740, gyBat);
  const ga = back > 0 ? io(g, [T.back, T.back + 16], [0, 1]) : 1 - io(g, [T.battery, T.battery + 22], [0, 1]);
  const iy0 = lerp(REST, 1175, ex);
  const iy1 = lerp(iy0, 930, io(g, [T.battery, T.battery + 30], [0, 1], easeInOut));
  const iy = lerp(lerp(iy1, 930, io(g, [T.share, T.share + 22], [0, 1], easeInOut)), REST, back);
  const xray = io(g, [T.back + 22, T.back + 40], [0, 1]);
  return { e, gy, ga, iy, xray, back };
};

/* ───────────── glass layer ───────────── */
const touchPath = (g: number) => {
  // finger: arrives 88→100, taps (-40,-60), drags to (70,115) 118→138, holds to ~146, leaves
  const p1: [number, number] = [-40, -60], p2: [number, number] = [70, 115];
  const d = io(g, [118, 140], [0, 1], easeInOut);
  const u = lerp(p1[0], p2[0], d), v = lerp(p1[1], p2[1], d);
  const near = io(g, [88, 100], [0, 1], easeOut) * (1 - io(g, [140, 150], [0, 1], easeInOut));
  const press = io(g, [98, 102], [0, 1]) * (1 - io(g, [138, 144], [0, 1]));
  return { u, v, near, press };
};
const GlassLayer: React.FC<{ g: number; m: M; o: number; scr: number; wires: number; xray: number; hl: number }> = ({ g, m, o, scr, wires, xray, hl }) => {
  const tp = touchPath(g);
  const col = Math.max(0, Math.min(6, Math.round((tp.u + 125) / 41.67))), row = Math.max(0, Math.min(12, Math.round((tp.v + 300) / 50)));
  const act = tp.press;
  const apps = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) apps.push([-111 + c * 74, -230 + r * 74, (r * 4 + c) % 5 === 2]);
  return (
    <g opacity={o}>
      <g transform={tf(m, 12)}><rect x={-LW / 2} y={-LH / 2} width={LW} height={LH} rx={44} fill="#071a35" stroke={K.lineDim} strokeWidth={2} {...NS} opacity={1 - xray} /></g>
      <g transform={tf(m)} style={glow(hl * 0.6)}>
        <rect x={-LW / 2} y={-LH / 2} width={LW} height={LH} rx={44} fill={`rgba(13,40,76,${lerp(0.96, 0.10, xray)})`} stroke={hl > 0.5 ? AM : LN} strokeWidth={4} {...NS} />
        <rect x={-LW / 2 + 14} y={-LH / 2 + 14} width={LW - 28} height={LH - 28} rx={32} fill="none" stroke={LN} strokeWidth={1.5} {...NS} opacity={0.35 * (1 - xray)} />
        <g opacity={scr * (1 - xray)}>
          {apps.map(([x, y, a], i) => <rect key={i} x={x - 26} y={y - 26} width={52} height={52} rx={14} fill={a ? "rgba(255,181,71,0.55)" : "rgba(92,211,255,0.22)"} stroke={a ? AM : LN} strokeWidth={1.5} {...NS} opacity={0.9} />)}
          <rect x={-40} y={-LH / 2 + 22} width={80} height={22} rx={11} fill="#030B18" stroke={K.lineDim} strokeWidth={1.5} {...NS} />
          <rect x={-60} y={LH / 2 - 34} width={120} height={7} rx={3.5} fill={K.text} opacity={0.5} />
        </g>
        {/* the wires */}
        <g opacity={wires * (1 - xray)}>
          {Array.from({ length: 7 }, (_, i) => <line key={"c" + i} x1={-125 + i * 41.67} y1={-300} x2={-125 + i * 41.67} y2={300} stroke={i === col && act > 0 ? AM : LN} strokeWidth={i === col && act > 0 ? 5 : 1.6} opacity={i === col && act > 0 ? 1 : 0.45} {...NS} />)}
          {Array.from({ length: 13 }, (_, j) => <line key={"r" + j} x1={-135} y1={-300 + j * 50} x2={135} y2={-300 + j * 50} stroke={j === row && act > 0 ? AM : LN} strokeWidth={j === row && act > 0 ? 5 : 1.6} opacity={j === row && act > 0 ? 1 : 0.45} {...NS} />)}
          {act > 0 && <circle cx={-125 + col * 41.67} cy={-300 + row * 50} r={14} fill={AM} opacity={act} />}
        </g>
      </g>
    </g>
  );
};
const Finger: React.FC<{ g: number; m: M }> = ({ g, m }) => {
  const tp = touchPath(g);
  if (tp.near <= 0) return null;
  const [x, y] = proj(m, tp.u, tp.v);
  const lift = (1 - tp.near) * 150 + (1 - tp.press) * 16;
  const rip = clamp01((g - 100) / 22);
  return (
    <g>
      {tp.press > 0 && g < 126 && <circle cx={x} cy={y} r={20 + 70 * rip} fill="none" stroke={AM} strokeWidth={4} opacity={(1 - rip) * 0.9} />}
      <g transform={`translate(${x + lift * 0.45} ${y + lift * 0.9}) rotate(-24)`} opacity={tp.near}>
        <path d="M -36 190 L -36 38 A 36 36 0 0 1 36 38 L 36 190 Z" fill="url(#fgF)" />
        <path d="M -36 190 L -36 38 A 36 36 0 0 1 36 38 L 36 190" fill="none" stroke="url(#fgS)" strokeWidth={4} strokeLinecap="round" />
        <path d="M -20 30 Q 0 6 20 30" fill="none" stroke={K.text} strokeWidth={3} opacity={0.6} />
      </g>
    </g>
  );
};

/* ───────────── inside layer ───────────── */
const BATT = { u0: -145, v0: -140, w: 290, h: 461 };
const PART = { chip: [-65, -255], cam: [85, -250], radio: [-65, -182] } as const;
const InsideLayer: React.FC<{ g: number; m: M; o: number; hb: number; hc: number; hm: number; hr: number; chg: number; sel?: boolean }> = ({ g, m, o, hb, hc, hm, hr, chg }) => {
  const bx = BATT.u0, by = BATT.v0, bw = BATT.w, bh = BATT.h;
  const fillH = bh * chg;
  const dim = (h: number) => (h > 0.5 ? AM : LN);
  return (
    <g opacity={o}>
      <g transform={tf(m, 14)}><rect x={-LW / 2} y={-LH / 2} width={LW} height={LH} rx={44} fill="#071a35" stroke={K.lineDim} strokeWidth={2} {...NS} /></g>
      <g transform={tf(m)}>
        <rect x={-LW / 2} y={-LH / 2} width={LW} height={LH} rx={44} fill="rgba(4,14,30,0.94)" stroke={hr > 0.5 ? AM : LN} strokeWidth={4} {...NS} style={glow(hr * 0.7)} />
        {/* antenna strips along the edge */}
        <g style={glow(hr)} opacity={0.9}>
          <path d={`M -140 -326 L 140 -326`} stroke={dim(hr)} strokeWidth={hr > 0.5 ? 6 : 3} strokeLinecap="round" fill="none" {...NS} />
          <path d={`M -156 -270 L -156 -190`} stroke={dim(hr)} strokeWidth={hr > 0.5 ? 6 : 3} strokeLinecap="round" fill="none" {...NS} />
          <path d={`M 156 -300 L 156 -150`} stroke={dim(hr)} strokeWidth={hr > 0.5 ? 6 : 3} strokeLinecap="round" fill="none" {...NS} />
        </g>
        {/* board area */}
        <rect x={-145} y={-312} width={290} height={160} rx={14} fill="rgba(92,211,255,0.05)" stroke={K.lineDim} strokeWidth={1.8} strokeDasharray="10 8" {...NS} />
        {/* battery */}
        <g style={glow(hb * 0.9)}>
          <rect x={bx} y={by} width={bw} height={bh} rx={16} fill={`rgba(255,181,71,${0.06 + 0.1 * hb})`} stroke={dim(hb)} strokeWidth={hb > 0.5 ? 5 : 3} {...NS} />
          <clipPath id="batclip"><rect x={bx + 8} y={by + 8} width={bw - 16} height={bh - 16} rx={10} /></clipPath>
          <g clipPath="url(#batclip)"><rect x={bx} y={by + bh - fillH} width={bw} height={fillH} fill={AM} opacity={0.55} /></g>
          {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={bx + 20} y1={by + bh * t} x2={bx + bw - 20} y2={by + bh * t} stroke={dim(hb)} strokeWidth={1.2} opacity={0.35} {...NS} />)}
          <path d="M 14 -70 L -38 20 L -4 20 L -20 96 L 40 -2 L 6 -2 Z" transform={`translate(0 ${by + bh / 2 - 12}) scale(1)`} fill={chg > 0.05 ? K.bgDeep : "none"} stroke={chg > 0.05 ? K.bgDeep : dim(hb)} strokeWidth={3} strokeLinejoin="round" opacity={0.9} {...NS} />
          <rect x={-26} y={by - 12} width={52} height={12} rx={4} fill={dim(hb)} />
        </g>
        {/* chip */}
        <g style={glow(hc)}>
          {Array.from({ length: 5 }, (_, i) => <g key={i}><line x1={PART.chip[0] - 40 + 16 * i} y1={PART.chip[1] - 48} x2={PART.chip[0] - 40 + 16 * i} y2={PART.chip[1] - 40} stroke={dim(hc)} strokeWidth={3} {...NS} /><line x1={PART.chip[0] - 40 + 16 * i} y1={PART.chip[1] + 40} x2={PART.chip[0] - 40 + 16 * i} y2={PART.chip[1] + 48} stroke={dim(hc)} strokeWidth={3} {...NS} /></g>)}
          <rect x={PART.chip[0] - 40} y={PART.chip[1] - 40} width={80} height={80} rx={8} fill={`rgba(255,181,71,${0.08 + 0.14 * hc})`} stroke={dim(hc)} strokeWidth={hc > 0.5 ? 5 : 3} {...NS} />
          <rect x={PART.chip[0] - 20} y={PART.chip[1] - 20} width={40} height={40} rx={4} fill="none" stroke={dim(hc)} strokeWidth={2} {...NS} />
        </g>
        {/* radio chip */}
        <g style={glow(hr)}>
          <rect x={PART.radio[0] - 36} y={PART.radio[1] - 15} width={72} height={30} rx={5} fill={`rgba(255,181,71,${0.06 + 0.14 * hr})`} stroke={dim(hr)} strokeWidth={hr > 0.5 ? 5 : 3} {...NS} />
        </g>
        {/* camera */}
        <g style={glow(hm)}>
          <rect x={PART.cam[0] - 56} y={PART.cam[1] - 56} width={112} height={112} rx={28} fill={`rgba(255,181,71,${0.06 + 0.12 * hm})`} stroke={dim(hm)} strokeWidth={hm > 0.5 ? 5 : 3} {...NS} />
          <circle cx={PART.cam[0]} cy={PART.cam[1]} r={34} fill="#030B18" stroke={dim(hm)} strokeWidth={3.5} {...NS} />
          <circle cx={PART.cam[0]} cy={PART.cam[1]} r={17} fill="none" stroke={dim(hm)} strokeWidth={2.5} {...NS} />
          <circle cx={PART.cam[0] - 7} cy={PART.cam[1] - 7} r={5} fill={dim(hm)} opacity={0.8} />
        </g>
      </g>
    </g>
  );
};

/* ───────────── micro-diagrams (screen space) ───────────── */
const CARD = { x: 150, y: 1072, w: 780, h: 314 };
const Card: React.FC<{ o: number }> = ({ o }) => (
  <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={14} fill="rgba(3,11,24,0.85)" stroke={K.lineDim} strokeWidth={2.2} opacity={o} />
);
const Toggle: React.FC<{ x: number; y: number; on: number; w?: number }> = ({ x, y, on, w = 50 }) => {
  const h = w * 0.54;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={on > 0.5 ? "rgba(255,181,71,0.35)" : "rgba(3,11,24,0.9)"} stroke={on > 0.5 ? AM : K.lineDim} strokeWidth={2.4} />
      <circle cx={x + (on - 0.5) * (w - h)} cy={y} r={h * 0.36} fill={on > 0.5 ? AM : K.muted} />
    </g>
  );
};

/** brain: magnified chip + "about 1 cm" */
const ChipCard: React.FC<{ g: number; ox: number; oy: number }> = ({ g, ox, oy }) => {
  const a = T.brain;
  const p = ioB(g, a + 6, a + 24);
  const cx = 440, cy = 1190, sz = 170 * (0.7 + 0.3 * p);
  const dimP = io(g, [a + 40, a + 58], [0, 1], easeOut);
  return (
    <g opacity={clamp01(p * 2)}>
      <Card o={1} />
      <path d={`M ${ox} ${oy} L ${cx - sz / 2 + 30} ${cy - sz / 2}`} stroke={AM} strokeWidth={2.4} strokeDasharray="8 6" opacity={0.7} />
      {Array.from({ length: 8 }, (_, i) => {
        const t = -sz / 2 + (sz / 8) * (i + 0.5);
        return (
          <g key={i} stroke={AM} strokeWidth={4} strokeLinecap="round">
            <line x1={cx + t} y1={cy - sz / 2 - 16} x2={cx + t} y2={cy - sz / 2} /><line x1={cx + t} y1={cy + sz / 2} x2={cx + t} y2={cy + sz / 2 + 16} />
            <line x1={cx - sz / 2 - 16} y1={cy + t} x2={cx - sz / 2} y2={cy + t} /><line x1={cx + sz / 2} y1={cy + t} x2={cx + sz / 2 + 16} y2={cy + t} />
          </g>
        );
      })}
      <rect x={cx - sz / 2} y={cy - sz / 2} width={sz} height={sz} rx={14} fill="rgba(255,181,71,0.14)" stroke={AM} strokeWidth={5} />
      <rect x={cx - sz * 0.3} y={cy - sz * 0.3} width={sz * 0.6} height={sz * 0.6} rx={8} fill="none" stroke={AM} strokeWidth={2.4} opacity={0.8} />
      {Array.from({ length: 4 }, (_, i) => <line key={i} x1={cx - sz * 0.3} y1={cy - sz * 0.15 + i * sz * 0.1} x2={cx + sz * 0.3} y2={cy - sz * 0.15 + i * sz * 0.1} stroke={AM} strokeWidth={1.6} opacity={0.4} />)}
      {/* dimension */}
      <g opacity={dimP}>
        <line x1={cx - sz / 2 * dimP} y1={cy + sz / 2 + 44} x2={cx + sz / 2 * dimP} y2={cy + sz / 2 + 44} stroke={K.text} strokeWidth={3} markerStart="url(#arr)" markerEnd="url(#arr)" />
      </g>
      {T_(cx, cy + sz / 2 + 84, "ABOUT 1 CM", { c: K.text, a: "middle", size: 26, w: 700, op: dimP })}
      <g opacity={io(g, [a + 24, a + 38], [0, 1])}>
        {T_(630, 1170, "THE BRAIN", { c: AM, size: 40, w: 700 })}
        {T_(630, 1232, "does all the", { c: K.text, size: 32, w: 600 })}
        {T_(630, 1278, "thinking", { c: K.text, size: 32, w: 600 })}
      </g>
    </g>
  );
};

/** switches: field of toggles + counter */
const SwitchCard: React.FC<{ g: number }> = ({ g }) => {
  const a = T.chip;
  const p = ioB(g, a, a + 14);
  const cols = 12, rows = 4;
  const cnt = Math.round(io(g, [CUE.count0, CUE.count1], [0, 19_000_000_000], easeInOut));
  const txt = cnt.toLocaleString("en-US");
  return (
    <g opacity={clamp01(p * 3)}>
      <Card o={1} />
      <text x={540} y={1144} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={cnt >= 19e9 ? 66 : 64} fill={cnt >= 19e9 ? AM : K.text} letterSpacing={-2} style={{ fontVariantNumeric: "tabular-nums" }}>{txt}</text>
      {Array.from({ length: cols * rows }, (_, k) => {
        const i = k % cols, j = Math.floor(k / cols);
        const rate = 7 + hash(k) * 8, ph = hash(k + 50) * 40;
        const on = Math.sin((g - a) / rate * 1 + ph) > 0.1 ? 1 : 0;
        const settle = Math.max(0, Math.sin((g - a) / rate + ph));
        void settle;
        return <Toggle key={k} x={196 + i * 62} y={1190 + j * 44} on={on} w={46} />;
      })}
      {T_(540, 1366, "TINY ON / OFF SWITCHES", { c: K.text, a: "middle", size: 28, w: 700 })}
    </g>
  );
};

/** camera: scene → lens → sensor numbers */
const PIC = [[5, 9, 9, 5, 4, 4], [5, 9, 9, 5, 4, 4], [4, 5, 5, 4, 3, 4], [4, 4, 3, 3, 2, 3], [2, 2, 2, 2, 2, 2], [1, 1, 1, 1, 1, 1]];
const CamCard: React.FC<{ g: number }> = ({ g }) => {
  const a = T.camera;
  const cell = 42, sx = 664, sy = 1110;
  const rays = io(g, [a + 10, a + 34], [0, 1], easeOut);
  const reveal = (i: number, j: number) => clamp01((g - (CUE.nums + (j * 6 + i) * 0.9)) / 6);
  const flash = clamp01(1 - Math.abs(g - CUE.shutter) / 5);
  return (
    <g>
      <Card o={win(g, a, T.radio, 8, 6)} />
      <g opacity={win(g, a, T.radio, 8, 6)}>
        {/* the scene */}
        <rect x={190} y={1138} width={150} height={150} rx={14} fill="rgba(92,211,255,0.08)" stroke={LN} strokeWidth={3} />
        <circle cx={238} cy={1186} r={22} fill={AM} />
        <path d="M 190 1250 L 250 1210 L 290 1240 L 316 1222 L 340 1240 L 340 1288 L 190 1288 Z" fill="rgba(92,211,255,0.25)" stroke={LN} strokeWidth={2.4} />
        {T_(265, 1320, "LIGHT", { c: AM, a: "middle", size: 28, w: 700 })}
        {/* rays: scene -> lens -> sensor */}
        {[1163, 1213, 1263].map((y, i) => {
          const r2 = clamp01((rays - 0.3) / 0.7);
          return (
            <g key={i}>
              <line x1={346} y1={y} x2={346 + (432 - 346) * rays} y2={y} stroke={AM} strokeWidth={4} opacity={rays} />
              <line x1={478} y1={1213 + (y - 1213) * 0.5} x2={478 + (sx - 8 - 478) * r2} y2={1213 + (y - 1213) * 0.5 + (1250 + (y - 1213) - 1213 - (y - 1213) * 0.5) * r2} stroke={AM} strokeWidth={4} opacity={r2} />
            </g>
          );
        })}
        {/* lens */}
        <path d="M 440 1128 Q 478 1213 440 1298 Q 402 1213 440 1128 Z" fill="rgba(92,211,255,0.2)" stroke={LN} strokeWidth={4} />
        {T_(440, 1335, "LENS", { c: K.muted, a: "middle", size: 24 })}
        {/* sensor grid */}
        {T_(sx + cell * 3, sy - 14, "SENSOR", { c: LN, a: "middle", size: 26, w: 700 })}
        {PIC.map((row, j) => row.map((b, i) => {
          const r = reveal(i, j);
          return (
            <g key={`${i}-${j}`}>
              <rect x={sx + i * cell} y={sy + j * cell} width={cell - 3} height={cell - 3} rx={5} fill={`rgba(255,181,71,${(0.04 + (b / 9) * 0.6) * r})`} stroke={LN} strokeWidth={1.8} opacity={0.9} />
              <text x={sx + i * cell + (cell - 3) / 2} y={sy + j * cell + 29} textAnchor="middle" fontFamily={K.mono} fontWeight={700} fontSize={24} fill={K.text} opacity={r}>{b}</text>
            </g>
          );
        }))}
      </g>
      {flash > 0 && <rect x={sx} y={sy} width={cell * 6} height={cell * 6} fill="#fff" opacity={flash * 0.5} />}
    </g>
  );
};

/** radio: tower + router with waves both ways */
const Tower: React.FC<{ x: number; y: number; o: number; g: number }> = ({ x, y, o, g }) => (
  <g opacity={o}>
    <path d={`M ${x - 46} ${y + 60} L ${x} ${y - 70} L ${x + 46} ${y + 60} M ${x - 30} ${y + 20} L ${x + 30} ${y + 20} M ${x - 18} ${y - 20} L ${x + 18} ${y - 20} M ${x - 46} ${y + 60} L ${x + 30} ${y + 20} M ${x + 46} ${y + 60} L ${x - 30} ${y + 20}`} fill="none" stroke={LN} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={x} cy={y - 78} r={8} fill={AM} />
    {[0, 1, 2].map((k) => { const ph = ((g * 0.03 + k / 3) % 1); return <path key={k} d={`M ${x - 24 - ph * 34} ${y - 78 - 14 - ph * 20} A ${30 + ph * 40} ${30 + ph * 40} 0 0 1 ${x + 24 + ph * 34} ${y - 78 - 14 - ph * 20}`} fill="none" stroke={AM} strokeWidth={3.4} opacity={(1 - ph) * 0.9} />; })}
    {T_(x, y + 108, "CELL TOWER", { c: K.text, a: "middle", size: 26, w: 700 })}
  </g>
);
const Router: React.FC<{ x: number; y: number; o: number; g: number }> = ({ x, y, o, g }) => (
  <g opacity={o}>
    <rect x={x - 62} y={y + 10} width={124} height={44} rx={10} fill="rgba(92,211,255,0.12)" stroke={LN} strokeWidth={4} />
    <circle cx={x - 38} cy={y + 32} r={5} fill={AM} /><circle cx={x - 20} cy={y + 32} r={5} fill={LN} />
    <line x1={x - 40} y1={y + 10} x2={x - 50} y2={y - 44} stroke={LN} strokeWidth={4} strokeLinecap="round" /><line x1={x + 40} y1={y + 10} x2={x + 50} y2={y - 44} stroke={LN} strokeWidth={4} strokeLinecap="round" />
    {[0, 1, 2].map((k) => { const ph = ((g * 0.03 + k / 3) % 1); const r = 18 + ph * 48; return <path key={k} d={`M ${x - r * 0.8} ${y - 30 - r * 0.6} A ${r} ${r} 0 0 1 ${x + r * 0.8} ${y - 30 - r * 0.6}`} fill="none" stroke={AM} strokeWidth={3.4} opacity={(1 - ph) * 0.9} />; })}
    {T_(x, y + 108, "WI-FI", { c: K.text, a: "middle", size: 26, w: 700 })}
  </g>
);
const RadioScene: React.FC<{ g: number; rp: [number, number] }> = ({ g, rp }) => {
  const a = T.radio;
  const tx = 190, ty = 1230, rx = 890, ry = 1232;
  const curve = (x1: number, y1: number, x2: number, y2: number) => `M ${x1} ${y1} Q ${(x1 + x2) / 2 + (x2 > x1 ? 0 : 0)} ${Math.min(y1, y2) + 20} ${x2} ${y2 - 100}`;
  const dots = (x1: number, y1: number, x2: number, y2: number, k: number) => {
    const q = (x1 + x2) / 2, qy = Math.min(y1, y2) + 20, ex = x2, ey = y2 - 100;
    const pts = [];
    for (let n = 0; n < 4; n++) {
      const t0 = ((g - a) * 0.022 + n / 4) % 1;
      const out = (n % 2 === 0);
      const t = out ? t0 : 1 - t0;
      const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * q + t * t * ex, by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * qy + t * t * ey;
      pts.push(<circle key={n + "" + k} cx={bx} cy={by} r={10} fill={out ? AM : LN} />);
    }
    return pts;
  };
  const pOn = io(g, [a + 14, a + 30], [0, 1]);
  return (
    <g opacity={win(g, a, T.back, 8, 8)}>
      <Tower x={tx} y={ty} o={pOn} g={g} />
      <Router x={rx} y={ry} o={io(g, [a + 26, a + 40], [0, 1])} g={g} />
      <g opacity={io(g, [a + 28, a + 44], [0, 1])}>
        <path d={curve(rp[0], rp[1], tx, ty)} fill="none" stroke={AM} strokeWidth={3} strokeDasharray="4 9" opacity={0.7} />
        {dots(rp[0], rp[1], tx, ty, 0)}
      </g>
      <g opacity={io(g, [a + 38, a + 54], [0, 1])}>
        <path d={curve(rp[0], rp[1], rx, ry)} fill="none" stroke={AM} strokeWidth={3} strokeDasharray="4 9" opacity={0.7} />
        {dots(rp[0], rp[1], rx, ry, 1)}
      </g>
    </g>
  );
};

/** battery beat: energy meter (battery % that everyone knows) */
const EnergyMeter: React.FC<{ g: number; chg: number }> = ({ g, chg }) => {
  const o = win(g, T.battery + 14, T.share, 8, 8);
  const x = 150, w = 780, y = 1136;
  return (
    <g opacity={o}>
      <Card o={1} />
      {T_(x + 30, 1124, "ENERGY STORED", { c: K.muted, size: 28, w: 700 })}
      <text x={x + w - 30} y={1134} textAnchor="end" fontFamily={K.mono} fontWeight={700} fontSize={64} fill={AM} letterSpacing={-2}>{Math.round(chg * 100)}%</text>
      <rect x={x + 30} y={y + 40} width={w - 60} height={80} rx={12} fill="rgba(3,11,24,0.7)" stroke={K.lineDim} strokeWidth={3} />
      <rect x={x + 36} y={y + 46} width={Math.max(0, (w - 72) * chg)} height={68} rx={8} fill="url(#segs)" />
      {T_(540, 1350, "SIMPLIFIED · FOR ILLUSTRATION", { c: K.muted, a: "middle", size: 20, op: 0.9 })}
    </g>
  );
};

/** share-of-inside bar */
const ShareBar: React.FC<{ g: number }> = ({ g }) => {
  const a = T.share, x = 190, w = 700, y = 1110, h = 90;
  const grow = io(g, [CUE.bar - 6, CUE.bar + 34], [0, 1], easeOut);
  const bw = w * (2 / 3) * grow;
  const rest = io(g, [CUE.bar + 20, CUE.bar + 40], [0, 1]);
  return (
    <g opacity={win(g, a, T.brain, 8, 8)}>
      <Card o={1} />
      {T_(540, 1108, "INSIDE ONE VERY THIN PHONE", { c: K.muted, a: "middle", size: 26, w: 700 })}
      <rect x={x} y={y + 16} width={w} height={h} rx={10} fill="rgba(3,11,24,0.7)" stroke={K.lineDim} strokeWidth={3} />
      <rect x={x + 4} y={y + 20} width={Math.max(0, bw - 8)} height={h - 8} rx={6} fill={AM} opacity={0.9} />
      <rect x={x + w * (2 / 3)} y={y + 20} width={(w / 3 - 4) * rest} height={h - 8} rx={6} fill="rgba(92,211,255,0.35)" />
      {T_(x + (w * 2 / 3) / 2, y + 16 + h / 2 + 16, "BATTERY", { c: K.bgDeep, a: "middle", size: 44, w: 700, op: io(g, [CUE.bar + 10, CUE.bar + 24], [0, 1]) })}
      {T_(x + w * (5 / 6), y + 16 + h / 2 + 12, "REST", { c: K.text, a: "middle", size: 34, w: 700, op: rest })}
      <text x={540} y={1330} textAnchor="middle" fontFamily={K.head} fontWeight={700} fontSize={104} fill={AM} opacity={io(g, [CUE.bar + 24, CUE.bar + 42], [0, 1])} letterSpacing={-3}>≈ ⅔</text>
      {T_(540, 1372, "OPENED UP BY iFIXIT · iPHONE AIR · APPROX.", { c: K.muted, a: "middle", size: 22, op: io(g, [CUE.bar + 34, CUE.bar + 50], [0, 1]) })}
    </g>
  );
};

/* ───────────── composition of the shot ───────────── */
export const PhoneShot: React.FC = () => {
  const g = useCurrentFrame();
  const s = S(g);
  const gm = mat(s.e, 540, s.gy), im = mat(s.e, 540, s.iy);
  // highlights
  const hGlass = win(g, T.glass + 2, T.battery + 4, 6, 14);
  const hBat = Math.max(win(g, T.battery + 6, T.brain - 2, 10, 10) * 1, 0);
  const hChip = win(g, T.brain, T.camera - 4, 8, 10);
  const hCam = win(g, T.camera, T.radio - 4, 8, 10);
  const hRad = win(g, T.radio, T.back - 4, 8, 12);
  const batDim = 0; void batDim;
  const chg = io(g, [CUE.boltFill, CUE.biggest + 30], [0.12, 0.92], easeInOut) * (g < T.brain ? 1 : 1);
  const insideO = 1 - 0.45 * io(g, [T.chip + 4, T.chip + 24], [0, 1]) * (1 - io(g, [T.camera, T.camera + 10], [0, 1]));
  const rp = proj(im, PART.radio[0], PART.radio[1]);
  const [chx, chy] = proj(im, PART.chip[0], PART.chip[1]);
  const [cmx, cmy] = proj(im, PART.cam[0], PART.cam[1]);
  const [bx, by] = proj(im, 0, 90);
  const [gx, gy] = proj(gm, -165, -100);
  // tags at the end
  const tg = (i: number) => ioB(g, CUE.tags + i * 4, CUE.tags + i * 4 + 12);
  const pe = mat(0, 540, REST);
  const anc = { think: proj(pe, PART.chip[0] - 30, PART.chip[1]), talk: proj(pe, PART.radio[0] - 20, PART.radio[1]), see: proj(pe, PART.cam[0] + 40, PART.cam[1]), touch: proj(pe, 165, -100), power: proj(pe, 145, 100) };
  const fade = io(g, [T.end - 6, T.end + 2], [0, 1]);

  const pn = (a: number, b: number) => win(g, a, b, 8, 8);
  const guides = io(g, [24, 44], [0, 1]) * (1 - io(g, [T.battery, T.battery + 10], [0, 1])) + 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Headline f={g} lines={["Open your", "*phone* up"]} at={-30} exitAt={36} size={104} />
      <Headline f={g} lines={["*Glass* on top", "feels your finger"]} at={T.glass + 3} exitAt={T.battery - 8} size={92} />
      <Headline f={g} lines={["The *battery*", "stores energy"]} at={T.battery + 3} exitAt={T.share - 8} size={98} />
      <Headline f={g} lines={["*Two thirds*", "is battery"]} at={T.share + 3} exitAt={T.brain - 8} size={104} />
      <Headline f={g} lines={["The *brain*", "is a tiny chip"]} at={T.brain + 3} exitAt={T.chip - 8} size={100} />
      <Headline f={g} lines={["*19 billion*", "tiny switches"]} at={T.chip + 3} exitAt={T.camera - 8} size={100} />
      <Headline f={g} lines={["Light becomes", "*numbers*"]} at={T.camera + 3} exitAt={T.radio - 8} size={100} />
      <Headline f={g} lines={["The *radio*", "talks to towers"]} at={T.radio + 3} exitAt={T.back - 8} size={98} />
      <Headline f={g} lines={["Put it *back*", "together"]} at={T.back + 3} exitAt={CUE.tags - 6} size={104} />
      <Headline f={g} lines={["Your *phone*"]} at={CUE.tags + 4} exitAt={T.end - 8} size={120} />

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="fgF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a2a52" stopOpacity="0.95" /><stop offset="1" stopColor="#0a2a52" stopOpacity="0" /></linearGradient>
          <linearGradient id="fgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EAF4FF" stopOpacity="1" /><stop offset="1" stopColor="#EAF4FF" stopOpacity="0" /></linearGradient>
          <pattern id="segs" width="22" height="60" patternUnits="userSpaceOnUse"><rect width="18" height="60" fill="#FFB547" /></pattern>
          <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8FB3D1" /></marker>
        </defs>
        <Frame />
        {/* exploded-view guides */}
        <g opacity={guides * 0.7} stroke={K.lineDim} strokeWidth={2} strokeDasharray="6 8">
          {[[-165, -340], [165, -340], [165, 340], [-165, 340]].map(([u, v], i) => { const a = proj(gm, u, v), b = proj(im, u, v); return <line key={i} x1={a[0]} y1={a[1] + 12} x2={b[0]} y2={b[1]} />; })}
        </g>
        <InsideLayer g={g} m={im} o={insideO} hb={hBat} hc={hChip} hm={hCam} hr={hRad} chg={g < T.battery ? 0 : (g < T.share + 60 ? chg : 0.92)} />
        <GlassLayer g={g} m={gm} o={s.ga} scr={1} wires={io(g, [T.glass + 4, T.glass + 22], [0, 1])} xray={s.xray} hl={hGlass} />
        <Finger g={g} m={gm} />

        {/* callouts */}
        <Call g={g} at={T.glass + 8} px={gx} py={gy} tx={190} ty={800} text="GLASS" out={T.battery} />
        <Call g={g} at={T.battery + 12} px={bx} py={by} tx={170} ty={1010} text="BATTERY" out={T.share - 4} />
        <Call g={g} at={CUE.biggest} px={bx + 40} py={by - 60} tx={850} ty={1010} text="BIGGEST PART" out={T.share - 4} size={28} />
        <Call g={g} at={T.brain + 6} px={chx} py={chy} tx={190} ty={800} text="CHIP" out={T.chip - 2} />
        <Call g={g} at={T.camera + 6} px={cmx} py={cmy} tx={850} ty={780} text="CAMERA" out={T.radio - 2} />
        <Call g={g} at={T.radio + 6} px={rp[0]} py={rp[1]} tx={190} ty={780} text="RADIO" out={T.back - 2} />

        {/* micro-diagrams */}
        <EnergyMeter g={g} chg={chg} />
        <ShareBar g={g} />
        <g opacity={win(g, T.brain, T.chip + 6, 6, 4)}><ChipCard g={g} ox={chx} oy={chy} /></g>
        <g opacity={win(g, T.chip, T.camera, 6, 8)}><SwitchCard g={g} /></g>
        <CamCard g={g} />
        <RadioScene g={g} rp={[rp[0], rp[1]]} />

        {/* final tags */}
        {g >= CUE.tags && (
          <g>
            {([["THINK", anc.think, 190, 700, "l"], ["TALK", anc.talk, 190, 800, "l"], ["SEE", anc.see, 890, 700, "r"], ["TOUCH", anc.touch, 890, 920, "r"], ["POWER", anc.power, 890, 1160, "r"]] as const).map(([t, a, tx, ty], i) => (
              <Call key={t} g={g} at={CUE.tags + i * 4} px={a[0]} py={a[1]} tx={tx} ty={ty} text={t} color={i % 2 ? LN : AM} />
            ))}
          </g>
        )}
        {/* simplified note */}
        <g opacity={io(g, [40, 56], [0, 1])}>{T_(540, 1584, "SIMPLIFIED DRAWING · NOT TO SCALE", { c: K.muted, a: "middle", size: 22 })}</g>
      </svg>

      <Panel o={pn(-10, T.glass + 2)} a="TAKEN APART" b={<>Five parts. <Em>One job</Em> each.</>} />
      <Panel o={pn(T.glass, T.battery + 2)} a="GLASS SCREEN" b={<>Job: feel <Em>where</Em> you touch</>} c="Invisible wires under the glass" />
      <Panel o={pn(T.battery, T.share + 2)} a="BATTERY" b={<>Job: <Em>store</Em> the energy</>} c="It powers every other part" />
      <Panel o={pn(T.share, T.brain + 2)} a="ONE VERY THIN PHONE (iPHONE AIR)" b={<>Battery ≈ <Em>two thirds</Em> inside</>} c="Approx. · drawing is simplified" />
      <Panel o={pn(T.brain, T.chip + 2)} a="CHIP · THE BRAIN" b={<>Job: do all the <Em>thinking</Em></>} c="Example: A17 Pro, about 1 cm across" />
      <Panel o={pn(T.chip, T.camera + 2)} a="EXAMPLE · A17 PRO · IPHONE 15 PRO" b={<><Em>19 billion</Em> on/off switches</>} c="Each switch is either on or off" />
      <Panel o={pn(T.camera, T.radio + 2)} a="CAMERA" b={<>Job: light <Em>into numbers</Em></>} c="Each dot writes 1 number: how bright" />
      <Panel o={pn(T.radio, T.back + 2)} a="RADIO" b={<>Job: <Em>talk</Em> to towers &amp; Wi-Fi</>} c="Invisible radio waves, sent and caught" />
    </div>
  );
};

/* ────────── end card (same as #12/#13) ────────── */
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
      <Label f={f} at={78} text="HOW IT WORKS · @DEAD.SIMPLE.ENGINEERING" x={540} y={1466} size={20} align="center" color={K.muted} />
    </div>
  );
};

/* ────────── cover ────────── */
export const Cover: React.FC = () => {
  const m = mat(1, 540, 1100), m2 = mat(1, 540, 900);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: AM }}>HOW IT WORKS · 14</div>
        <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 124, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>Inside a phone</div>
        <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 84, lineHeight: 1.1, color: AM }}>five parts, five jobs</div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Frame />
        <InsideLayer g={0} m={m} o={1} hb={0.3} hc={0} hm={0} hr={0} chg={0.7} />
        <GlassLayer g={0} m={m2} o={1} scr={1} wires={0} xray={0} hl={0} />
      </svg>
    </>
  );
};
export { easeInOut, easeOut, TAU };
