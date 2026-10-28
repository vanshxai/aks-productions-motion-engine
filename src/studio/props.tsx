import React from "react";
import { clamp, hash } from "./util";
import { shade } from "./Person";

/** Reusable props for the Kimu world. Each is drawn around its own origin so a set can place it anywhere. */

/* ---------------- laptop (unbranded, generic silver) ---------------- */
/** Held closed: origin at the hand (top edge). */
export const LaptopClosed: React.FC<{ rot?: number }> = ({ rot = 0 }) => (
  <g transform={`rotate(${rot})`}>
    <defs><linearGradient id="lapG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EDF0F6" /><stop offset="1" stopColor="#9FA9BC" /></linearGradient></defs>
    <rect x="-33" y="-2" width="74" height="52" rx="6" fill="#6C778C" />
    <rect x="-37" y="-6" width="74" height="52" rx="6" fill="url(#lapG)" stroke="#7B869B" strokeWidth="2" />
    <path d="M-28 2 L-6 2 L-24 36 L-28 36 Z" fill="#fff" opacity="0.4" />
    <rect x="-37" y="38" width="74" height="8" rx="4" fill="#7B869B" />
  </g>
);

/** Open laptop seen from behind (lid back toward camera) with a glow on the user. Origin: bottom centre of the base. */
export const LaptopBack: React.FC<{ w?: number; on?: number; open?: number }> = ({ w = 300, on = 1, open = 1 }) => {
  const h = w * 0.62 * (0.12 + 0.88 * open);
  return (
    <g>
      <defs><linearGradient id="lapB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E7EBF2" /><stop offset="1" stopColor="#A2ACBE" /></linearGradient></defs>
      <path d={`M${-w / 2} 0 L${w / 2} 0 L${w / 2 + 14} 14 L${-w / 2 - 14} 14 Z`} fill="#8892A6" />
      <rect x={-w / 2} y={-h} width={w} height={h} rx="12" fill="url(#lapB)" stroke="#7B869B" strokeWidth="3" />
      <path d={`M${-w / 2 + 20} ${-h + 14} L${-w / 2 + 90} ${-h + 14} L${-w / 2 + 30} ${-h * 0.35} Z`} fill="#fff" opacity="0.35" />
      <circle cx="0" cy={-h / 2} r="0" fill="none" />
      {on > 0 && <ellipse cx="0" cy={-h - 6} rx={w * 0.52} ry="14" fill="#9CE7FF" opacity={0.5 * on} />}
    </g>
  );
};

/* ---------------- bird (small brown sparrow-like, faces left) ---------------- */
export const Bird: React.FC<{ s?: number; tilt?: number; wing?: number; beakOpen?: number; headTurn?: number; shock?: number }> = ({ s = 1, tilt = 0, wing = 0, beakOpen = 0, headTurn = 0, shock = 0 }) => (
  <g transform={`scale(${s}) rotate(${tilt})`}>
    {/* origin = feet on the wire */}
    <path d="M-6 -2 L-6 -26 M8 -2 L8 -26" stroke="#E08A3A" strokeWidth="4" strokeLinecap="round" />
    <path d="M-12 -2 L-3 -2 M2 -2 L12 -2" stroke="#E08A3A" strokeWidth="4" strokeLinecap="round" />
    <path d="M26 -40 L74 -30 L30 -22 Z" fill="#7A5A44" />
    <ellipse cx="0" cy="-48" rx="38" ry="30" fill="#A9794F" />
    <ellipse cx="-4" cy="-40" rx="26" ry="19" fill="#F1E2C6" />
    <path d={`M8 -62 C28 ${-66 - wing * 22} 40 ${-48 - wing * 30} 30 -34 C16 -34 6 -46 8 -62 Z`} fill="#7A5A44" />
    <g transform={`translate(${-24 + headTurn * 6} -76)`}>
      <circle cx="0" cy="0" r="20" fill="#B88458" />
      <ellipse cx="-3" cy="-2" rx="12" ry="8" fill="#fff" opacity="0.15" />
      <path d={`M-18 -2 L-36 ${2 - beakOpen * 3} L-18 ${6 + beakOpen * 4} Z`} fill="#F5A623" />
      <circle cx="-7" cy="-5" r={shock ? 5.2 : 3.6} fill="#1A1412" /><circle cx="-8" cy="-6.4" r="1.3" fill="#fff" />
    </g>
  </g>
);

/* ---------------- power line ---------------- */
export const quad = (x0: number, y0: number, x1: number, y1: number, sag: number) => `M${x0} ${y0} Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + sag * 2} ${x1} ${y1}`;
/** y of the quadratic wire at x (matches `quad`). */
export const wireY = (x0: number, y0: number, x1: number, y1: number, sag: number, x: number) => {
  const u = (x - x0) / (x1 - x0);
  return (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * ((y0 + y1) / 2 + sag * 2) + u * u * y1;
};

export const Pole: React.FC<{ h?: number }> = ({ h = 900 }) => (
  <g>
    <defs><linearGradient id="poleG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5C5148" /><stop offset="0.5" stopColor="#8A7C6E" /><stop offset="1" stopColor="#3F372F" /></linearGradient></defs>
    <rect x="-18" y="0" width="36" height={h} fill="url(#poleG)" />
    <rect x="-150" y="30" width="300" height="20" rx="6" fill="#4A3F36" />
    <rect x="-110" y="120" width="220" height="16" rx="6" fill="#4A3F36" />
    {[-130, 0, 130].map((x) => <g key={x}><rect x={x - 7} y="6" width="14" height="26" rx="5" fill="#C9D3E0" /><rect x={x - 9} y="22" width="18" height="8" rx="3" fill="#8FA0B5" /></g>)}
  </g>
);

/* ---------------- tea cup with steam ---------------- */
export const TeaCup: React.FC<{ t: number; steam?: number }> = ({ t, steam = 1 }) => (
  <g>
    <ellipse cx="0" cy="62" rx="64" ry="10" fill="#EDEFF4" />
    <path d="M-44 0 L44 0 C44 40 26 60 0 60 C-26 60 -44 40 -44 0 Z" fill="#F7F1E4" stroke="#D8CDB6" strokeWidth="3" />
    <ellipse cx="0" cy="0" rx="44" ry="9" fill="#B97A3E" />
    <path d="M44 12 C70 8 70 40 38 40" fill="none" stroke="#D8CDB6" strokeWidth="7" strokeLinecap="round" />
    {[-16, 0, 16].map((x, i) => {
      const ph = t * 1.6 + i * 1.7;
      return <path key={i} d={`M${x} -12 q${8 * Math.sin(ph)} -22 0 -40 q${-8 * Math.sin(ph + 1)} -20 0 -36`} stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity={0.55 * steam} />;
    })}
  </g>
);

/* ---------------- rupee note ---------------- */
export const Note: React.FC = () => (
  <g>
    <rect x="-52" y="-26" width="104" height="52" rx="5" fill="#7FB89B" stroke="#4F8A6F" strokeWidth="3" />
    <circle cx="0" cy="0" r="14" fill="#A8D5BE" stroke="#4F8A6F" strokeWidth="2" />
    <text x="0" y="8" textAnchor="middle" fontFamily="Fredoka" fontWeight="600" fontSize="22" fill="#2F6A50">₹</text>
    <rect x="-44" y="-18" width="14" height="36" rx="3" fill="#4F8A6F" opacity="0.4" />
  </g>
);

/* ---------------- wire bundle for the neighbour's meter board ---------------- */
export const Spark: React.FC<{ t: number; a: number; b: number }> = ({ t, a, b }) => {
  const k = t - a;
  if (k < 0 || t > b) return null;
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => {
        const ang = hash(i + Math.floor(t * 18)) * Math.PI * 2;
        const r = 14 + hash(i * 3 + Math.floor(t * 18)) * 46;
        return <path key={i} d={`M0 0 L${Math.cos(ang) * r} ${Math.sin(ang) * r}`} stroke={i % 2 ? "#FFE08A" : "#fff"} strokeWidth="5" strokeLinecap="round" />;
      })}
      <circle r={22 + 6 * Math.sin(t * 60)} fill="#FFF3B0" opacity="0.8" />
    </g>
  );
};

/* ---------------- tool bag ---------------- */
export const ToolBag: React.FC = () => (
  <g>
    <path d="M-52 0 L52 0 L60 62 L-60 62 Z" fill="#B3402F" stroke="#7E281C" strokeWidth="3" />
    <path d="M-30 0 C-30 -34 30 -34 30 0" fill="none" stroke="#4A2A22" strokeWidth="9" strokeLinecap="round" />
    <rect x="-52" y="22" width="104" height="8" fill="#7E281C" opacity="0.5" />
    <rect x="30" y="-12" width="9" height="36" rx="2" fill="#F5A623" transform="rotate(14 34 0)" />
  </g>
);

/* ---------------- window with lamp glow ---------------- */
export const WindowFrame: React.FC<{ w: number; h: number; lit: number; mullions?: boolean }> = ({ w, h, lit, mullions = true }) => (
  <g>
    <rect x="-8" y="-8" width={w + 16} height={h + 16} rx="6" fill="#8B6B4A" />
    <rect x="0" y="0" width={w} height={h} fill={lit > 0.05 ? "#FFD88A" : "#3C4C66"} />
    {lit > 0.05 && <rect x="0" y="0" width={w} height={h} fill="#FFF3C8" opacity={0.55 * lit} />}
    {mullions && <path d={`M${w / 2} 0 V${h} M0 ${h / 2} H${w}`} stroke="#8B6B4A" strokeWidth="6" />}
  </g>
);

export const Stars: React.FC<{ t: number; n?: number; w?: number; h?: number }> = ({ t, n = 70, w = 1080, h = 900 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const x = hash(i * 1.3) * w, y = hash(i * 7.7) * h * (0.4 + 0.6 * hash(i)), r = 1.2 + hash(i * 2.9) * 2.4;
      const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + hash(i) * 2) + i);
      return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={tw * (0.5 + 0.5 * hash(i * 5))} />;
    })}
  </g>
);

export const ClockFace: React.FC<{ r?: number }> = ({ r = 60 }) => (
  <g>
    <circle r={r + 8} fill="#6B4B33" /><circle r={r} fill="#F4EEDD" />
    {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M0 ${-r + 6} v${i % 3 === 0 ? 10 : 5}`} transform={`rotate(${i * 30})`} stroke="#3A2A20" strokeWidth="3" />)}
    <path d="M0 0 L0 -30" stroke="#3A2A20" strokeWidth="6" strokeLinecap="round" transform="rotate(354)" />
    <path d="M0 0 L0 -44" stroke="#3A2A20" strokeWidth="4" strokeLinecap="round" transform="rotate(288)" />
    <circle r="5" fill="#B3262E" />
  </g>
);

export const clampN = clamp;
export const tint = shade;
