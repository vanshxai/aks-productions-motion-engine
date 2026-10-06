import React from "react";
import { useCurrentFrame } from "remotion";
import { easeIn, easeInOut, easeOut, io } from "../../engine/util";
import { K } from "../gearbox/brand";
import { Gear, Headline, Label, Layer, Readout, Tag, clamp01, ioB, meshPhase } from "../gearbox/kit";
import { Cylinder, HEAD_Y, HOT, pistonTop, strokeOf } from "./cylinder";

/** Global frames @30fps from public/projects/engine4/vo.json. Keep in sync with soundtrack.py. */
export const T = { shot: 0, hero: 723, end: 841, total: 900 };
export const CUTS = [0, 125, 194, 321, 446, 586, 723, 841];
const mod = (a: number, m: number) => ((a % m) + m) % m;

/** Crank angle (deg) for the single-cylinder shot. */
export const theta = (g: number) => {
  if (g <= 105) return -2160 + (g / 105) * 1680;
  if (g <= 178) return io(g, [105, 178], [-480, 0], easeOut);
  if (g <= 300) return io(g, [230, 300], [0, 180], easeInOut);
  if (g < 479) return io(g, [359, 430], [180, 359.5], easeInOut); // hold just before TDC until the spark
  if (g <= 575) return io(g, [520, 575], [360, 540], easeIn);
  return io(g, [624, 700], [540, 720], easeInOut);
};
const S = 1.15, CX = 540, CY = 1330;
const toScr = (x: number, y: number) => ({ x: CX + x * S, y: CY + y * S });
const STROKES: [string, string][] = [["INTAKE", K.line], ["COMPRESSION", "#8BE2FF"], ["POWER", HOT], ["EXHAUST", "#9FB0C6"]];

const StrokeBar: React.FC<{ th: number; o: number; y?: number }> = ({ th, o, y = 1500 }) => {
  const a = mod(th, 720), st = strokeOf(th);
  const x0 = 70, w = 940;
  return (
    <div style={{ position: "absolute", left: x0, top: y, width: w, opacity: o }}>
      <div style={{ display: "flex", gap: 6 }}>
        {STROKES.map(([n, c], i) => (
          <div key={n} style={{ flex: 1, height: 14, borderRadius: 3, background: i === st ? c : "rgba(92,211,255,0.14)", boxShadow: i === st ? `0 0 14px ${c}` : undefined }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: `${(a / 720) * 100}%`, top: -8, width: 4, height: 30, marginLeft: -2, background: K.text, borderRadius: 2 }} />
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {STROKES.map(([n, c], i) => (
          <div key={n} style={{ flex: 1, textAlign: "center", fontFamily: K.mono, fontSize: 19, letterSpacing: 2, color: i === st ? c : K.muted, fontWeight: i === st ? 700 : 500 }}>{i + 1} · {n}</div>
        ))}
      </div>
    </div>
  );
};

/* ────────── the single-cylinder shot: hook → four strokes (0–723) ────────── */
export const CylinderShot: React.FC = () => {
  const g = useCurrentFrame();
  const th = theta(g), a = mod(th, 720), st = strokeOf(th);
  const fast = g < 178;
  const spark = fast ? clamp01(1 - Math.abs(a - 360) / 30) : io(g, [479, 483], [0, 1]) * (1 - io(g, [486, 500], [0, 1]));
  const flameBase = a >= 360 && a <= 540 ? clamp01(1 - (a - 360) / 200) : 0;
  const flame = fast ? flameBase * clamp01((a - 360) / 12) : flameBase * io(g, [482, 500], [0, 1]);
  const pT = pistonTop(th);
  const vol = pT - HEAD_Y;
  const ratio = 200 / Math.max(20, vol);
  const heroOut = io(g, [712, 723], [0, 1]);
  const cam = toScr(-62, HEAD_Y - 150), ex = toScr(62, HEAD_Y - 150), plug = toScr(0, HEAD_Y - 120);
  const inPort = toScr(-300, HEAD_Y - 65), exPort = toScr(300, HEAD_Y - 65);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - heroOut }}>
      {/* hook headline is already on screen in frame 0 */}
      <Headline f={g} lines={["Fires *25× a second*"]} at={-30} exitAt={116} size={92} />
      <Headline f={g} lines={["In *4* strokes"]} at={127} exitAt={186} size={100} />
      <Headline f={g} lines={["1 · *Intake*"]} at={192} exitAt={314} size={104} />
      <Headline f={g} lines={["2 · *Compression*"]} at={319} exitAt={438} size={96} />
      <Headline f={g} lines={["3 · *Power*"]} at={444} exitAt={578} size={104} accent={HOT} />
      <Headline f={g} lines={["4 · *Exhaust*"]} at={584} exitAt={712} size={104} />
      <Label f={g} at={-40} out={110} text="PER CYLINDER · @ 3,000 RPM" x={540} y={490} size={24} align="center" color={K.line} />
      <Layer>
        <g transform={`translate(${CX} ${CY}) scale(${S})`}>
          <Cylinder th={th} g={g} spark={spark} flame={flame} />
        </g>
        {/* intake / exhaust flow arrows */}
        {st === 0 && !fast && (
          <g opacity={io(g, [232, 244], [0, 1]) * (1 - io(g, [300, 312], [0, 1]))}>
            <path d={`M ${inPort.x - 120} ${inPort.y} L ${inPort.x} ${inPort.y}`} stroke={K.line} strokeWidth={8} strokeLinecap="round" />
            <path d={`M ${inPort.x + 22} ${inPort.y} l -26 -18 l 0 36 Z`} fill={K.line} />
          </g>
        )}
        {st === 3 && !fast && (
          <g opacity={io(g, [626, 638], [0, 1]) * (1 - io(g, [700, 712], [0, 1]))}>
            <path d={`M ${exPort.x} ${exPort.y} L ${exPort.x + 120} ${exPort.y}`} stroke="#9FB0C6" strokeWidth={8} strokeLinecap="round" />
            <path d={`M ${exPort.x + 142} ${exPort.y} l -26 -18 l 0 36 Z`} fill="#9FB0C6" />
          </g>
        )}
      </Layer>
      {/* hook data */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 540, textAlign: "center", opacity: 1 - io(g, [108, 118], [0, 1]) }}>
        <span style={{ fontFamily: K.mono, fontSize: 22, color: K.muted, letterSpacing: 2 }}>3,000 rpm ÷ 2 turns per fire ÷ 60 s = <b style={{ color: K.amber }}>25</b></span>
      </div>
      {/* stage labels */}
      <Tag f={g} at={240} text="AIR + FUEL IN" x={inPort.x - 30} y={inPort.y - 60} color={K.line} size={22} out={312} />
      <Label f={g} at={200} text="CAMSHAFT · ½ CRANK SPEED" x={540} y={cam.y - 90} size={20} align="center" out={350} />
      <Tag f={g} at={360} text="VALVES SHUT" x={540} y={toScr(0, HEAD_Y - 205).y} color={K.amber} size={22} out={440} />
      <div style={{ position: "absolute", left: 50, top: 1080, width: 330, whiteSpace: "nowrap", opacity: io(g, [370, 380], [0, 1]) * (1 - io(g, [436, 446], [0, 1])), fontFamily: K.mono }}>
        <div style={{ fontSize: 20, color: K.muted, letterSpacing: 3 }}>SQUEEZED</div>
        <Readout value={`${ratio.toFixed(1)} : 1`} size={58} color={K.amber} />
        <div style={{ fontSize: 17, color: K.muted, letterSpacing: 1, marginTop: 4 }}>TYPICAL PETROL ≈ 10:1</div>
      </div>
      <Tag f={g} at={479} text="⚡ SPARK" x={plug.x + 150} y={plug.y + 10} color={K.amber} solid size={26} out={575} />
      <Tag f={g} at={528} text="THE ONLY STROKE THAT MAKES POWER" x={540} y={1440} color={HOT} size={22} out={580} />
      <Tag f={g} at={630} text="BURNT GAS OUT" x={exPort.x + 20} y={exPort.y - 60} color="#9FB0C6" size={22} out={712} />
      <Label f={g} at={150} text={`CRANK ${Math.round(a)}°`} x={70} y={1430} size={22} color={K.text} out={712} />
      <StrokeBar th={th} o={io(g, [128, 140], [0, 1]) * (1 - heroOut)} />
    </div>
  );
};

/* ────────── hero: inline-4, firing order 1-3-4-2 ────────── */
export const Hero: React.FC = () => {
  const h = useCurrentFrame(); // 0 = global 723
  const g = T.hero + h;
  const th = 720 + 6 * h + 0.11 * h * h;
  const xs = [195, 425, 655, 885], offs = [0, 540, 180, 360]; // cyl 1,2,3,4 → order 1-3-4-2
  const sc = 0.55, cy = 1330;
  const turns = (th - 720) / 360;
  const sweep = io(h, [41, 70], [0, 1], easeInOut);
  return (
    <>
      <Headline f={h} lines={["Four *strokes.*"]} at={0} exitAt={39} size={100} />
      <Headline f={h} lines={["Two *turns.*"]} at={41} exitAt={78} size={100} />
      <Headline f={h} lines={["That's your *engine.*"]} at={80} size={96} />
      <Label f={h} at={6} text="INLINE-4 · FIRING ORDER 1 · 3 · 4 · 2" x={540} y={560} size={24} align="center" color={K.line} />
      <Layer>
        <line x1={xs[0] - 60} y1={cy} x2={xs[3] + 60} y2={cy} stroke={K.lineDim} strokeWidth={10} strokeLinecap="round" />
        {xs.map((x, i) => {
          const t = th - offs[i], a = mod(t, 720);
          const spark = clamp01(1 - Math.abs(a - 360) / 28);
          const flame = a >= 360 && a <= 540 ? clamp01(1 - (a - 360) / 200) * clamp01((a - 360) / 10) : 0;
          return (
            <g key={i} transform={`translate(${x} ${cy}) scale(${sc})`}>
              <Cylinder th={t} g={g} detail={false} spark={spark} flame={flame} />
            </g>
          );
        })}
        {xs.map((x, i) => (
          <text key={i} x={x} y={cy + 95} textAnchor="middle" fontFamily={K.mono} fontSize={30} fontWeight={700} fill={K.muted}>{i + 1}</text>
        ))}
        {/* two-turn sweep dial */}
        <g transform="translate(540 700)" opacity={clamp01(h / 8)}>
          <circle r={70} fill="none" stroke="rgba(92,211,255,0.18)" strokeWidth={10} />
          <circle r={70} fill="none" stroke={K.amber} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${sweep} 1`} transform="rotate(-90)" />
          <text y={12} textAnchor="middle" fontFamily={K.mono} fontSize={34} fontWeight={700} fill={K.text}>{Math.min(2, turns).toFixed(1)}</text>
          <text y={40} textAnchor="middle" fontFamily={K.mono} fontSize={16} fill={K.muted} letterSpacing={2}>TURNS</text>
        </g>
      </Layer>
      <Label f={h} at={46} text="720° = EVERY CYLINDER FIRES ONCE" x={540} y={800} size={20} align="center" color={K.amber} />
      <Label f={h} at={20} text="SIMPLIFIED · PETROL 4-STROKE" x={540} y={1480} size={18} align="center" />
    </>
  );
};

/* ────────── end card ────────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = (T.end + f) * 0.05;
  const p = ioB(f, 2, 18);
  const fade = 1 - io(f, [52, 59], [0, 1]);
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
      <Label f={f} at={24} text="FOLLOW FOR PART 06 · THE ELECTRIC MOTOR" x={540} y={1440} size={20} align="center" />
    </div>
  );
};

/* ────────── cover (single frame) ────────── */
export const Cover: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontFamily: K.mono, fontSize: 30, letterSpacing: 8, color: K.amber }}>HOW IT WORKS · 05</div>
      <div style={{ fontFamily: K.head, fontWeight: 700, fontSize: 132, lineHeight: 1, color: K.text, letterSpacing: -4, textAlign: "center" }}>The 4-stroke</div>
      <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 150, lineHeight: 1, color: K.amber }}>engine</div>
    </div>
    <Layer>
      <g transform={`translate(540 1500) scale(1.05)`}><Cylinder th={420} g={0} spark={0} flame={0.85} /></g>
    </Layer>
  </>
);

export { easeOut };
