import React from "react";
import { W, H, clamp, ramp, hash, easeOut, backOut } from "./util";
import { shade } from "./Person";
import { ClockFace, WindowFrame } from "./props";
import { Calendar } from "./decor";
import { Card } from "./info";

/** Kitchen set + pressure-cooker props + the four lesson panels of story 2 "The Whistle".
 *  World coordinates: floor at y=1560, counter + stove on the left (x 80..760), dining table on the right (x 790..1330). */
export const KFLOOR = 1560;
export const COUNTER_Y = 1340;
export const COOKER_X = 430;

const FONT = "Fredoka, sans-serif";
const BODY = "Nunito, sans-serif";
const CYAN = "#7FE3FF", AMBER = "#FFC857", RED = "#FF5A4E", GREEN = "#7CF0A8";

/* ---------------- steam ---------------- */
export const Steam: React.FC<{ x: number; y: number; t: number; rate?: number; spread?: number; size?: number; n?: number; rise?: number; col?: string; dir?: number }> = ({ x, y, t, rate = 1, spread = 30, size = 1, n = 9, rise = 200, col = "#fff", dir = 0 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const ph = (((t * 0.55 * rate + i / n + hash(i * 3.1) * 0.2) % 1) + 1) % 1;
      const px = x + dir * ph * rise * 0.6 + Math.sin(ph * 5 + i) * spread * ph;
      const py = y - (dir ? ph * rise * 0.35 : ph * rise);
      return <circle key={i} cx={px} cy={py} r={(14 + 34 * ph) * size} fill={col} opacity={0.5 * (1 - ph) * Math.min(1, ph * 6) * Math.min(1, rate)} />;
    })}
  </g>
);

/* ---------------- gas flame ---------------- */
export const Flame: React.FC<{ t: number; on: number }> = ({ t, on }) => {
  if (on <= 0.02) return null;
  return (
    <g opacity={on}>
      {Array.from({ length: 11 }).map((_, i) => {
        const a = (i / 11) * Math.PI * 2 + 0.3;
        const fl = 0.75 + 0.25 * Math.sin(t * 17 + i * 2.1) + 0.1 * Math.sin(t * 29 + i);
        const x = Math.cos(a) * 52, y = Math.sin(a) * 9;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d={`M-9 0 C-10 -${16 * fl} 0 -${34 * fl} 0 -${40 * fl} C0 -${34 * fl} 10 -${16 * fl} 9 0 Z`} fill="#4A8CFF" opacity="0.9" />
            <path d={`M-5 0 C-5 -${10 * fl} 0 -${20 * fl} 0 -${24 * fl} C0 -${20 * fl} 5 -${10 * fl} 5 0 Z`} fill="#C8F0FF" />
          </g>
        );
      })}
      <ellipse cx="0" cy="-4" rx="74" ry="26" fill="#FF9A3C" opacity={0.18 * on} />
    </g>
  );
};

/* ---------------- the pressure cooker (origin: centre of the base) ---------------- */
export const Cooker: React.FC<{ t: number; lid?: number; lift?: number; steamJet?: number; leak?: number; hiss?: number; flame?: number }> = ({ t, lid = 0, lift = 0, steamJet = 0, leak = 0, hiss = 0 }) => {
  const rock = lift ? Math.sin(t * 38) * 2.2 * lift : 0;
  return (
    <g>
      <defs>
        <linearGradient id="steelG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8E97A6" /><stop offset="0.3" stopColor="#E3E8EF" /><stop offset="0.55" stopColor="#BAC2CE" /><stop offset="1" stopColor="#7D8696" /></linearGradient>
        <linearGradient id="lidG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#99A2B0" /><stop offset="0.35" stopColor="#EEF1F6" /><stop offset="1" stopColor="#8A93A2" /></linearGradient>
      </defs>
      <ellipse cx="0" cy="8" rx="170" ry="16" fill="#000" opacity="0.25" />
      {/* body */}
      <path d="M-128 -200 L-132 -14 Q-132 0 -118 0 L118 0 Q132 0 132 -14 L128 -200 Z" fill="url(#steelG)" stroke="#5E6674" strokeWidth="4" />
      <path d="M-100 -180 L-104 -20" stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity="0.45" />
      {[-165, 150].map((x, i) => <g key={i}>
        <rect x={i ? 128 : -178} y="-148" width="52" height="26" rx="10" fill="#2A2420" stroke="#14100E" strokeWidth="3" />
        <rect x={i ? 132 : -170} y="-143" width="38" height="6" rx="3" fill="#6B5B50" opacity="0.7" />
      </g>)}
      {/* lid group lifts away when opened */}
      <g transform={`translate(${lid * -120} ${-lid * 190}) rotate(${-lid * 18})`}>
        <rect x="-138" y="-218" width="276" height="26" rx="11" fill="url(#lidG)" stroke="#5E6674" strokeWidth="4" />
        <path d="M-120 -218 C-100 -262 100 -262 120 -218 Z" fill="url(#lidG)" stroke="#5E6674" strokeWidth="4" />
        <path d="M-90 -232 C-60 -252 -20 -255 10 -253" stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.5" />
        <rect x="-150" y="-236" width="82" height="22" rx="9" fill="#2A2420" stroke="#14100E" strokeWidth="3" />
        <circle cx="62" cy="-246" r="9" fill="#C23A31" stroke="#6E1F1A" strokeWidth="3" />
        {/* the weight (regulator) */}
        <g transform={`translate(${rock} ${-lift * 13})`}>
          <rect x="-6" y="-266" width="12" height="16" fill="#7D8696" />
          <rect x="-17" y="-296" width="34" height="34" rx="6" fill="#2B2B30" stroke="#0E0E12" strokeWidth="3" />
          <rect x="-12" y="-300" width="24" height="9" rx="4" fill="#8A93A2" />
        </g>
        <path d="M-134 -206 L134 -206" stroke="#2B2B30" strokeWidth="5" opacity="0.8" />
      </g>
      {/* steam: jet from the weight, leaks from the rim, quiet hiss */}
      {steamJet > 0.02 && <Steam x={0} y={-300 - lift * 12} t={t} rate={2.4 * steamJet} spread={26} size={1.15 * steamJet} n={12} rise={260} />}
      {leak > 0.02 && <>
        <Steam x={-132} y={-206} t={t + 0.4} rate={1.5 * leak} spread={14} size={0.8 * leak} n={7} rise={210} dir={-1} />
        <Steam x={132} y={-206} t={t} rate={1.5 * leak} spread={14} size={0.8 * leak} n={7} rise={210} dir={1} />
      </>}
      {hiss > 0.02 && <Steam x={0} y={-300} t={t} rate={0.8 * hiss} spread={16} size={0.6 * hiss} n={5} rise={150} />}
    </g>
  );
};

/* ---------------- kitchen background ---------------- */
const Jar: React.FC<{ x: number; c: string; lid?: string; h?: number }> = ({ x, c, lid = "#E8E2D0", h = 74 }) => (
  <g transform={`translate(${x} 0)`}>
    <rect x="-26" y={-h} width="52" height={h} rx="10" fill={c} stroke={shade(c, -0.45)} strokeWidth="3" />
    <rect x="-18" y={-h + 18} width="36" height="22" rx="4" fill="#F4EEDC" opacity="0.8" />
    <rect x="-28" y={-h - 12} width="56" height="14" rx="6" fill={lid} stroke={shade(lid, -0.4)} strokeWidth="3" />
    <path d={`M-18 ${-h + 8} V-8`} stroke="#fff" strokeWidth="5" opacity="0.3" strokeLinecap="round" />
  </g>
);

export const KitchenBack: React.FC<{ t: number; flame: number; dim?: number }> = ({ t, flame, dim = 0 }) => (
  <g>
    <defs>
      <linearGradient id="kWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2DFB4" /><stop offset="1" stopColor="#E3C78E" /></linearGradient>
      <linearGradient id="kFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C9B79A" /><stop offset="1" stopColor="#8E7A5E" /></linearGradient>
      <linearGradient id="kCab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F8F8A" /><stop offset="1" stopColor="#216B68" /></linearGradient>
      <linearGradient id="kDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3C4B8F" /><stop offset="0.6" stopColor="#E58B5A" /><stop offset="1" stopColor="#F6C27A" /></linearGradient>
      <radialGradient id="kLamp" cx="0.5" cy="0.35" r="0.7"><stop offset="0" stopColor="#FFE7A8" stopOpacity="0.7" /><stop offset="1" stopColor="#FFE7A8" stopOpacity="0" /></radialGradient>
    </defs>
    <rect x="-300" y="-200" width="2200" height="1800" fill="url(#kWall)" />
    {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={-300 + i * 76} y="-200" width="3" height="1760" fill="#fff" opacity="0.06" />)}
    {/* tiled backsplash behind the counter */}
    <g transform={`translate(80 ${COUNTER_Y - 560})`}>
      <rect width="700" height="560" fill="#F7F1E2" />
      {Array.from({ length: 8 }).map((_, r) => Array.from({ length: 14 }).map((__, c) => (
        <rect key={`${r}${c}`} x={c * 50 + (r % 2 ? 25 : 0) - 25} y={r * 70} width="46" height="64" rx="4" fill={(r + c) % 5 === 0 ? "#BFE3DF" : "#EFE7D2"} stroke="#D8CDB2" strokeWidth="2" />
      )))}
      <rect width="700" height="560" fill="none" stroke="#C9BC9C" strokeWidth="6" />
    </g>
    {/* window with dusk sky */}
    <g transform="translate(870 330)">
      <rect x="-14" y="-14" width="268" height="388" rx="10" fill="#8B6B4A" />
      <rect x="0" y="0" width="240" height="360" fill="url(#kDusk)" />
      <circle cx="170" cy="250" r="42" fill="#FFE2A0" opacity="0.7" />
      <path d="M0 330 L40 300 L70 320 L110 285 L150 318 L200 296 L240 322 V360 H0Z" fill="#2A2F5E" opacity="0.8" />
      <path d="M120 0 V360 M0 180 H240" stroke="#8B6B4A" strokeWidth="8" />
      <path d="M-20 -20 C40 20 30 160 -10 380 L-30 380 L-30 -20Z" fill="#E37B5E" opacity="0.92" />
      <path d="M260 -20 C200 20 210 160 250 380 L270 380 L270 -20Z" fill="#E37B5E" opacity="0.92" />
    </g>
    {/* wall clock, calendar */}
    <g transform="translate(1110 470)"><ClockFace r={64} /></g>
    <g transform="translate(1250 330) scale(0.9)"><Calendar /></g>
    {/* shelves with jars and plates */}
    {[0, 1].map((r) => (
      <g key={r} transform={`translate(110 ${COUNTER_Y - 700 + r * 175})`}>
        <rect x="0" y="0" width="520" height="14" rx="5" fill="#8B5A33" stroke="#5E3A20" strokeWidth="3" />
        <path d="M30 14 v26 M490 14 v26" stroke="#5E3A20" strokeWidth="8" />
        <g transform="translate(0 0)">
          {r === 0
            ? <>{[60, 130, 200, 270].map((x, i) => <Jar key={i} x={x} c={["#D9A441", "#C0502F", "#7A9A4A", "#D8CDB6"][i]} lid={i % 2 ? "#3A3A44" : "#B8423A"} />)}
              {[360, 425, 490].map((x, i) => <g key={i} transform={`translate(${x} 0)`}><rect x="-30" y="-12" width="60" height="12" rx="4" fill="#fff" stroke="#C9BFA6" strokeWidth="3" /><rect x="-30" y="-24" width="60" height="12" rx="4" fill="#F4EEDC" stroke="#C9BFA6" strokeWidth="3" /></g>)}</>
            : <>{[60, 125, 190].map((x, i) => <Jar key={i} x={x} h={64} c={["#E8B33E", "#C9A24A", "#B3402F"][i]} lid="#EDE8D6" />)}
              <g transform="translate(300 0)"><path d="M-40 0 C-40 -50 40 -50 40 0Z" fill="#8FB8D8" stroke="#4F7596" strokeWidth="3" /><rect x="-6" y="-66" width="12" height="18" rx="4" fill="#4F7596" /></g>
              <g transform="translate(410 0)"><rect x="-34" y="-58" width="68" height="58" rx="8" fill="#C9CFD8" stroke="#6B7384" strokeWidth="3" /><rect x="-34" y="-38" width="68" height="8" fill="#6B7384" opacity="0.5" /></g></>}
        </g>
      </g>
    ))}
    {/* hanging utensil rail */}
    <g transform={`translate(150 ${COUNTER_Y - 520})`}>
      <rect x="0" y="0" width="400" height="8" rx="4" fill="#6B7384" />
      {[40, 110, 180, 250, 320].map((x, i) => <g key={i} transform={`translate(${x} 8)`}>
        <path d="M0 0 V70" stroke="#8A93A2" strokeWidth="6" strokeLinecap="round" />
        {i % 2 === 0 ? <ellipse cx="0" cy="84" rx="20" ry="15" fill="#C9CFD8" stroke="#6B7384" strokeWidth="3" /> : <rect x="-12" y="70" width="24" height="44" rx="6" fill="#B87333" stroke="#6E4318" strokeWidth="3" />}
      </g>)}
    </g>
    {/* garlic string + hanging towel */}
    <g transform={`translate(680 ${COUNTER_Y - 640})`}>
      <path d="M0 0 V120" stroke="#8B6B4A" strokeWidth="4" />
      {[20, 55, 90].map((y, i) => <ellipse key={i} cx={i % 2 ? 10 : -10} cy={y} rx="16" ry="20" fill="#F2EBDB" stroke="#CFC4A8" strokeWidth="3" />)}
    </g>
    {/* floor */}
    <rect x="-300" y={KFLOOR} width="2200" height="500" fill="url(#kFloor)" />
    {Array.from({ length: 22 }).map((_, i) => <path key={i} d={`M${-300 + i * 110} ${KFLOOR} L${-500 + i * 150} 1960`} stroke="#6E5C44" strokeWidth="3" opacity="0.35" />)}
    <rect x="-300" y={KFLOOR - 22} width="2200" height="22" fill="#F5EEDC" /><rect x="-300" y={KFLOOR - 22} width="2200" height="7" fill="#000" opacity="0.1" />
    {/* counter + cabinets */}
    <g>
      <rect x="80" y={COUNTER_Y} width="690" height={KFLOOR - COUNTER_Y - 22} fill="url(#kCab)" stroke="#164643" strokeWidth="5" />
      {[0, 1, 2].map((i) => <g key={i}><rect x={96 + i * 224} y={COUNTER_Y + 24} width="208" height={KFLOOR - COUNTER_Y - 70} rx="10" fill="#2A827D" stroke="#164643" strokeWidth="4" /><rect x={96 + i * 224 + 90} y={COUNTER_Y + 52} width="28" height="8" rx="4" fill="#F0E4C0" /></g>)}
      <rect x="66" y={COUNTER_Y - 26} width="718" height="30" rx="8" fill="#D9D2C2" stroke="#8E8670" strokeWidth="4" />
      <rect x="66" y={COUNTER_Y - 26} width="718" height="8" rx="4" fill="#fff" opacity="0.5" />
    </g>
    {/* stove hob + burner */}
    <g transform={`translate(${COOKER_X} ${COUNTER_Y - 26})`}>
      <rect x="-190" y="-22" width="380" height="24" rx="8" fill="#2C2F3A" stroke="#14161D" strokeWidth="4" />
      <ellipse cx="0" cy="-22" rx="74" ry="12" fill="#14161D" />
      <ellipse cx="0" cy="-24" rx="46" ry="7" fill="#3C404D" />
      <g transform="translate(0 -22)"><Flame t={t} on={flame} /></g>
      <g transform="translate(-130 -18)"><circle r="12" fill="#14161D" stroke="#6B7384" strokeWidth="3" /><path d="M0 0 L8 -8" stroke="#E6EAF2" strokeWidth="4" strokeLinecap="round" transform={`rotate(${flame > 0.5 ? 0 : -60})`} /></g>
    </g>
    {/* counter clutter: kettle, chopping board with veg, spice box, tea towel, fruit */}
    <g transform={`translate(190 ${COUNTER_Y - 26})`}>
      <path d="M-34 0 C-34 -50 34 -50 34 0Z" fill="#B24A3E" stroke="#6E2A22" strokeWidth="3" /><rect x="-8" y="-60" width="16" height="12" rx="4" fill="#2A2420" /><path d="M34 -24 q28 -10 22 -34" stroke="#6E2A22" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
    <g transform={`translate(640 ${COUNTER_Y - 26})`}>
      <rect x="-70" y="-10" width="140" height="12" rx="4" fill="#C99B5C" stroke="#8A6330" strokeWidth="3" />
      <circle cx="-34" cy="-24" r="16" fill="#D9442F" stroke="#8E241A" strokeWidth="3" /><circle cx="2" cy="-20" r="13" fill="#7EBE56" stroke="#4A7A2E" strokeWidth="3" /><ellipse cx="38" cy="-20" rx="20" ry="11" fill="#F0A33A" stroke="#A8691C" strokeWidth="3" />
    </g>
    <g transform={`translate(740 ${COUNTER_Y - 26})`}><rect x="-28" y="-44" width="56" height="44" rx="6" fill="#C0392B" stroke="#7A2018" strokeWidth="3" /><path d="M-28 -24 H28" stroke="#fff" strokeWidth="4" opacity="0.6" /></g>
    <path d={`M770 ${COUNTER_Y - 10} q14 40 4 80`} stroke="#E8D9B0" strokeWidth="26" fill="none" strokeLinecap="round" />
    {/* dining table, chairs, tableware */}
    <g>
      <rect x="1180" y="1190" width="112" height="370" rx="8" fill="#A9784A" stroke="#6E4A2A" strokeWidth="5" />
      <rect x="1198" y="1210" width="76" height="180" rx="6" fill="#C08B58" opacity="0.7" />
      <rect x="1050" y="1090" width="46" height="90" rx="10" fill="#8B5A33" opacity="0" />
    </g>
    {/* ambient warm lamp glow */}
    <ellipse cx="760" cy="760" rx="760" ry="620" fill="url(#kLamp)" opacity="0.65" />
    {dim > 0 && <rect x="-300" y="-200" width="2200" height="2200" fill="#06091E" opacity={0.55 * dim} />}
  </g>
);

/** Dining table (drawn over a seated Dad's lap) + chair backs behind. Origin world coords. */
export const DiningBack: React.FC<{ chairShift?: number; chairTilt?: number }> = ({ chairShift = 0, chairTilt = 0 }) => (
  <g>
    {[{ x: 830, s: chairShift, r: chairTilt }, { x: 1210, s: 0, r: 0 }].map((c, i) => (
      <g key={i} transform={`translate(${c.x + c.s} ${KFLOOR}) rotate(${c.r})`}>
        <rect x="-56" y="-420" width="112" height="170" rx="16" fill="#A9784A" stroke="#6E4A2A" strokeWidth="5" />
        <path d="M-40 -400 V-270 M0 -400 V-270 M40 -400 V-270" stroke="#7C5532" strokeWidth="9" strokeLinecap="round" />
        <rect x="-62" y="-250" width="124" height="22" rx="8" fill="#8E6238" stroke="#6E4A2A" strokeWidth="4" />
        <path d="M-52 -228 V0 M52 -228 V0" stroke="#6E4A2A" strokeWidth="12" strokeLinecap="round" />
      </g>
    ))}
  </g>
);

export const DiningFront: React.FC<{ t: number; plates: number; steam: number }> = ({ t, plates, steam }) => (
  <g>
    <rect x="780" y="1330" width="560" height="26" rx="8" fill="#C9985F" stroke="#7C5532" strokeWidth="5" />
    <rect x="780" y="1330" width="560" height="8" rx="4" fill="#fff" opacity="0.35" />
    <path d="M800 1356 V1560 M1320 1356 V1560" stroke="#7C5532" strokeWidth="18" strokeLinecap="round" />
    <rect x="800" y="1356" width="520" height="30" fill="#B07F48" opacity="0.9" />
    {/* tableware */}
    {[860, 1040, 1230].map((x, i) => <g key={i} transform={`translate(${x} 1326)`}>
      <ellipse cx="0" cy="2" rx="60" ry="9" fill="#EDEFF4" stroke="#B9BFCB" strokeWidth="3" /><ellipse cx="0" cy="0" rx="44" ry="6" fill="#fff" />
      {plates > 0.5 && <ellipse cx="0" cy="-4" rx="34" ry="9" fill="#F6E7B8" />}
    </g>)}
    <g transform="translate(985 1326)"><rect x="-14" y="-60" width="28" height="60" rx="8" fill="#9CC4E8" opacity="0.8" stroke="#4F7596" strokeWidth="3" /><path d="M14 -48 q16 4 0 26" stroke="#4F7596" strokeWidth="4" fill="none" /></g>
    <g transform="translate(1100 1326)">{[0, 1].map((i) => <rect key={i} x={-34 + i * 40} y="-34" width="26" height="34" rx="5" fill="#D5DAE3" stroke="#7B8496" strokeWidth="3" />)}</g>
    {steam > 0.02 && [860, 1040, 1230].map((x, i) => <Steam key={i} x={x} y={1322} t={t + i} rate={0.8} spread={10} size={0.35 * steam} n={4} rise={100} />)}
  </g>
);

/* ---------------- the four lesson panels (900 x 760 each) ---------------- */
const Gauge: React.FC<{ x: number; y: number; v: number; r?: number }> = ({ x, y, v, r = 70 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r + 8} fill="#E3E8EF" stroke="#7D8696" strokeWidth="4" /><circle r={r} fill="#0E1840" />
    <path d={`M${-r * 0.8} ${r * 0.45} A${r * 0.9} ${r * 0.9} 0 1 1 ${r * 0.8} ${r * 0.45}`} stroke="#3A4A80" strokeWidth="10" fill="none" strokeLinecap="round" />
    <path d={`M${r * 0.25} ${-r * 0.7} A${r * 0.9} ${r * 0.9} 0 0 1 ${r * 0.8} ${r * 0.45}`} stroke={RED} strokeWidth="10" fill="none" strokeLinecap="round" />
    <g transform={`rotate(${-130 + v * 260})`}><path d={`M0 0 L0 ${-r * 0.8}`} stroke={AMBER} strokeWidth="6" strokeLinecap="round" /></g>
    <circle r="8" fill="#fff" />
  </g>
);

const Bubble: React.FC<{ x0: number; x1: number; y0: number; y1: number; t: number; n?: number; r?: number; col?: string }> = ({ x0, x1, y0, y1, t, n = 14, r = 7, col = "#CFE8FF" }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const bx = x0 + hash(i * 2.3) * (x1 - x0), by = y0 + hash(i * 5.1) * (y1 - y0);
      const wob = Math.sin(t * (2 + hash(i) * 3) + i * 1.9);
      return <circle key={i} cx={bx + wob * 16} cy={by + Math.cos(t * (2.4 + hash(i * 3) * 2) + i) * 14} r={r * (0.7 + 0.6 * hash(i * 7))} fill={col} opacity="0.85" />;
    })}
  </g>
);

const PotCut: React.FC<{ x: number; y: number; w?: number; h?: number; water?: number; sealed?: boolean }> = ({ x, y, w = 380, h = 300, water = 0.4, sealed = true }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y="0" width={w} height={h} rx="22" fill="#101C46" stroke="#C9D3E6" strokeWidth="8" />
    <rect x={-w / 2 + 6} y={h - h * water} width={w - 12} height={h * water - 6} rx="16" fill="#3FA2FF" opacity="0.85" />
    {sealed && <rect x={-w / 2 - 10} y="-18" width={w + 20} height="26" rx="10" fill="#B7BEC9" stroke="#7D8696" strokeWidth="4" />}
  </g>
);

export const CookerA: React.FC<{ u: number }> = ({ u }) => {
  const a = easeOut(clamp(u / 0.4));
  const p = ramp(u, 0.7, 3.4);
  return (
    <Card step="01" title="A sealed pot" a={a}>
      <PotCut x={400} y={300} water={0.38} />
      <Bubble x0={230} x1={570} y0={330} y1={400} t={u} n={9} r={6} col="#fff" />
      <Bubble x0={230} x1={570} y0={420} y1={520} t={u * 1.3} n={10} r={8} col="#BFE3FF" />
      {/* steam trapped under the lid: arrows bounce */}
      {[0, 1, 2].map((i) => <g key={i} transform={`translate(${290 + i * 110} ${352 - 18 * Math.abs(Math.sin(u * 4 + i))})`} opacity="0.95"><path d="M0 28 L0 0 M-14 14 L0 0 L14 14" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)}
      <Gauge x={760} y={380} v={0.12 + 0.7 * p} />
      <text x="760" y="494" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="30" fill="#fff">Pressure</text>
      <text x="48" y="676" fontFamily={BODY} fontWeight="700" fontSize="40" fill={CYAN}>Steam can't escape, so it pushes harder.</text>
    </Card>
  );
};

export const CookerB: React.FC<{ u: number }> = ({ u }) => {
  const a = easeOut(clamp(u / 0.4));
  const h = ramp(u, 0.8, 3.0);
  const T = (v: number) => 640 - (v - 90) * 12;  // y of a temperature
  return (
    <Card step="02" title="Hotter water" a={a}>
      <g transform="translate(180 0)">
        <rect x="-26" y={T(130)} width="52" height={T(90) - T(130)} rx="26" fill="#101C46" stroke="#C9D3E6" strokeWidth="6" />
        <rect x="-16" y={T(100 + 20 * h)} width="32" height={T(90) - T(100 + 20 * h) + 20} rx="16" fill={RED} />
        <circle cx="0" cy={T(90) + 30} r="38" fill={RED} stroke="#C9D3E6" strokeWidth="6" />
        <path d={`M-40 ${T(100)} H40`} stroke="#fff" strokeWidth="4" strokeDasharray="8 8" />
        <text x="62" y={T(100) + 12} fontFamily={FONT} fontWeight="600" fontSize="34" fill="#fff">100°C</text>
        <text x="62" y={T(120) + 12} fontFamily={FONT} fontWeight="600" fontSize="34" fill={AMBER} opacity={ramp(u, 2.6, 3.2)}>about 120°C</text>
      </g>
      <g transform="translate(560 0)">
        <PotCut x={0} y={280} w={250} h={190} water={0.45} sealed={false} />
        <Bubble x0={-100} x1={100} y0={350} y1={450} t={u * 1.6} n={8} r={6} />
        <text x="0" y="530" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="30" fill="#fff">Open pan: 100°C</text>
        <g opacity={ramp(u, 1.2, 1.8)}>
          <PotCut x={0} y={560} w={250} h={130} water={0.5} sealed />
          <text x="0" y="722" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="30" fill={AMBER}>Cooker: hotter, faster</text>
        </g>
      </g>
    </Card>
  );
};

export const CookerC: React.FC<{ u: number }> = ({ u }) => {
  const a = easeOut(clamp(u / 0.4));
  const lift = ramp(u, 0.9, 1.4, backOut);
  const jet = ramp(u, 1.0, 1.5);
  return (
    <Card step="03" title="The whistle" a={a}>
      <PotCut x={400} y={330} water={0.36} />
      <Bubble x0={230} x1={570} y0={370} y1={420} t={u * 1.4} n={10} r={7} col="#fff" />
      <g transform={`translate(400 ${322 - lift * 22 + Math.sin(u * 40) * 3 * lift})`}>
        <rect x="-16" y="-50" width="32" height="44" rx="6" fill="#2B2B30" stroke="#fff" strokeWidth="3" />
        <rect x="-10" y="-8" width="20" height="14" fill="#7D8696" />
      </g>
      {jet > 0.02 && <g opacity={jet}>{[0, 1, 2, 3].map((i) => <path key={i} d={`M${380 + i * 14} ${290 - i * 10} q-${30 + i * 6} -50 -${10 + i * 8} -${90 + i * 10}`} stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" opacity={0.8 - i * 0.15} transform={`translate(${Math.sin(u * 20 + i) * 3} 0)`} />)}</g>}
      {lift > 0.5 && [0, 1, 2].map((i) => <path key={i} d={`M${505 + i * 34} ${250 - i * 8} q18 -22 0 -44`} stroke={AMBER} strokeWidth="8" fill="none" strokeLinecap="round" opacity={0.9 - 0.25 * ((u * 2 + i * 0.5) % 1)} />)}
      <Gauge x={760} y={440} v={0.82} />
      <text x="760" y="554" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="30" fill="#fff">Ready</text>
      <text x="48" y="676" fontFamily={BODY} fontWeight="700" fontSize="40" fill={CYAN}>Steam lifts the weight. That's the whistle.</text>
    </Card>
  );
};

export const CookerD: React.FC<{ u: number }> = ({ u }) => {
  const a = easeOut(clamp(u / 0.4));
  const lk = ramp(u, 0.6, 1.2);
  return (
    <Card step="04" title="No whistle?" a={a}>
      <PotCut x={400} y={330} water={0.36} />
      <g transform="translate(400 322)"><rect x="-16" y="-44" width="32" height="40" rx="6" fill="#2B2B30" stroke="#fff" strokeWidth="3" /></g>
      {/* steam leaking out of both rim edges */}
      {lk > 0.02 && [-1, 1].map((s) => <g key={s} opacity={lk}>{[0, 1, 2].map((i) => <path key={i} d={`M${400 + s * 200} ${326 - i * 4} q${s * (38 + i * 12)} -14 ${s * (70 + i * 18)} ${-6 - i * 14}`} stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" opacity={0.85 - i * 0.2 + 0.1 * Math.sin(u * 14 + i)} />)}</g>)}
      <g opacity={ramp(u, 1.2, 1.8)}><circle cx="400" cy="262" r="34" fill="none" stroke={RED} strokeWidth="7" /><path d="M376 238 L424 286 M424 238 L376 286" stroke={RED} strokeWidth="7" strokeLinecap="round" /></g>
      <Gauge x={760} y={440} v={0.1 + 0.03 * Math.sin(u * 3)} />
      <text x="760" y="554" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="30" fill="#fff">Low</text>
      <text x="48" y="676" fontFamily={BODY} fontWeight="700" fontSize="40" fill={AMBER}>Leak at the rim means no pressure.</text>
    </Card>
  );
};

export const GasketCrust: React.FC<{ clean: number; w?: number }> = ({ clean, w = 340 }) => (
  <g>
    <ellipse cx="0" cy="0" rx={w} ry={w * 0.22} fill="none" stroke="#1D1D22" strokeWidth="34" />
    <ellipse cx="0" cy="-6" rx={w} ry={w * 0.22} fill="none" stroke="#3A3A44" strokeWidth="10" opacity="0.7" />
    {/* dried starch crust on the rim, wiped away by `clean` */}
    {[[-170, 54, 90], [-40, 72, 70], [130, 56, 110], [260, 18, 60]].map(([x, y, ww], i) => (
      <ellipse key={i} cx={x} cy={y * 0.6} rx={ww * (1 - clean)} ry={11 * (1 - clean)} fill="#F4E4B0" stroke="#C9A24A" strokeWidth="3" opacity={1 - clean * 0.4} />
    ))}
  </g>
);

export const Spotlight: React.FC<{ x: number; y: number; r?: number; a: number }> = ({ x, y, r = 280, a }) => (
  <g opacity={a} pointerEvents="none">
    <defs><radialGradient id="spotG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFF0B8" stopOpacity="0.85" /><stop offset="1" stopColor="#FFF0B8" stopOpacity="0" /></radialGradient></defs>
    <circle cx={x} cy={y} r={r} fill="url(#spotG)" />
  </g>
);

export const KW = { W, H };
