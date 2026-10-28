import React from "react";
import { clamp, ramp, easeOut, backOut } from "./util";
import { Bird } from "./props";

/** Infographic panels that live INSIDE the cartoon (a glowing board over the night sky).
 *  Each panel draws in a 900 x 760 box; `u` is seconds since the panel started. */

const FONT = "Fredoka, sans-serif";
const BODY = "Nunito, sans-serif";
const CYAN = "#7FE3FF", AMBER = "#FFC857", RED = "#FF5A4E", GREEN = "#7CF0A8";

export const Card: React.FC<{ step: string; title: string; a: number; children: React.ReactNode }> = ({ step, title, a, children }) => (
  <g opacity={a} transform={`translate(0 ${(1 - a) * 30})`}>
    <rect x="0" y="0" width="900" height="760" rx="40" fill="#0A1232" fillOpacity="0.86" stroke="#6FA8FF" strokeOpacity="0.7" strokeWidth="3" />
    <text x="48" y="74" fontFamily={FONT} fontWeight="500" fontSize="26" letterSpacing="5" fill={CYAN}>HOW IT WORKS · {step}</text>
    <text x="48" y="134" fontFamily={FONT} fontWeight="600" fontSize="54" fill="#fff">{title}</text>
    {children}
  </g>
);

/** Dots flowing along y between x0..x1. dir = 1 right, -1 left. */
const Flow: React.FC<{ x0: number; x1: number; y: number; t: number; n?: number; col?: string; dir?: number; gap?: [number, number]; r?: number }> = ({ x0, x1, y, t, n = 16, col = AMBER, dir = 1, gap, r = 8 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const ph = ((i / n + t * 0.35 * dir) % 1 + 1) % 1;
      const x = x0 + (x1 - x0) * ph;
      if (gap && x > gap[0] && x < gap[1]) return null;
      return <circle key={i} cx={x} cy={y} r={r} fill={col} opacity="0.95" />;
    })}
  </g>
);

const Tank: React.FC<{ x: number; y: number; level: number; label: string; col: string }> = ({ x, y, level, label, col }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="-70" y="0" width="140" height="260" rx="14" fill="#101C46" stroke="#9CC4FF" strokeWidth="4" />
    <rect x="-66" y={260 - 256 * level} width="132" height={256 * level} rx="10" fill={col} opacity="0.85" />
    <text x="0" y="300" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="30" fill="#fff">{label}</text>
  </g>
);

/* A: the question */
export const PanelA: React.FC<{ u: number }> = ({ u }) => {
  const a = clamp(u / 0.5);
  const bolt = 0.5 + 0.5 * Math.sin(u * 9);
  return (
    <Card step="01" title="A bird on a live wire" a={a}>
      <path d="M60 480 H840" stroke="#E5E9F5" strokeWidth="14" strokeLinecap="round" />
      <Flow x0={60} x1={840} y={480} t={u} col={AMBER} r={6} n={20} />
      <g transform="translate(450 470)"><Bird s={1.7} beakOpen={0.3 + 0.3 * Math.sin(u * 5)} /></g>
      <g transform="translate(150 320)" opacity={0.6 + 0.4 * bolt}><path d="M20 -50 L-16 8 H8 L-10 60 L34 -6 H8 Z" fill={AMBER} /></g>
      <g transform="translate(760 330)" opacity={0.6 + 0.4 * (1 - bolt)}><path d="M20 -50 L-16 8 H8 L-10 60 L34 -6 H8 Z" fill={AMBER} /></g>
      <text x="450" y="640" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="48" fill={AMBER}>Thousands of volts</text>
      <text x="450" y="700" textAnchor="middle" fontFamily={BODY} fontWeight="700" fontSize="36" fill="#fff" opacity={ramp(u, 2.6, 3.4)}>…and the bird is fine</text>
    </Card>
  );
};

/* B: current needs a difference (water tanks) */
export const PanelB: React.FC<{ u: number }> = ({ u }) => {
  const a = clamp(u / 0.5);
  const level = ramp(u, 0.6, 1.4);
  const flow = ramp(u, 1.4, 1.8);
  return (
    <Card step="02" title="Flow needs a difference" a={a}>
      <Tank x={210} y={220} level={0.92 * level} label="HIGH" col="#FF8A4E" />
      <Tank x={690} y={220} level={0.3 * level} label="LOW" col="#4EB4FF" />
      <rect x="280" y="430" width="340" height="26" fill="#17255A" stroke="#9CC4FF" strokeWidth="3" />
      {flow > 0.1 && <Flow x0={280} x1={620} y={443} t={u} col="#FFB677" n={10} r={7} />}
      <text x="450" y="570" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="42" fill="#fff">Water flows when levels differ</text>
      <text x="450" y="640" textAnchor="middle" fontFamily={BODY} fontWeight="700" fontSize="38" fill={CYAN} opacity={ramp(u, 2.6, 3.2)}>Voltage is the “level”</text>
    </Card>
  );
};

/* C: one wire = no difference */
export const PanelC: React.FC<{ u: number }> = ({ u }) => {
  const a = clamp(u / 0.5);
  const show = ramp(u, 1.6, 2.2);
  return (
    <Card step="03" title="One wire, one level" a={a}>
      <path d="M60 470 H840" stroke="#E5E9F5" strokeWidth="14" strokeLinecap="round" />
      <Flow x0={60} x1={840} y={470} t={u} col={AMBER} r={6} n={22} />
      <g transform="translate(450 462)"><Bird s={1.6} /></g>
      {/* foot markers */}
      <g opacity={show}>
        <circle cx="440" cy="470" r="14" fill="none" stroke={GREEN} strokeWidth="5" />
        <circle cx="468" cy="470" r="14" fill="none" stroke={GREEN} strokeWidth="5" />
        <path d="M440 520 V560 H468 V520" fill="none" stroke={GREEN} strokeWidth="4" />
        <text x="454" y="610" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="38" fill={GREEN}>same level</text>
      </g>
      <text x="450" y="690" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="44" fill="#fff" opacity={ramp(u, 3.2, 3.8)}>Difference ≈ 0  →  no current</text>
    </Card>
  );
};

/* D: two wires = danger */
export const PanelD: React.FC<{ u: number }> = ({ u }) => {
  const a = clamp(u / 0.5);
  const zap = ramp(u, 1.2, 1.6);
  const fl = 0.5 + 0.5 * Math.sin(u * 22);
  return (
    <Card step="04" title="Two wires? Danger" a={a}>
      <path d="M60 350 H840" stroke="#E5E9F5" strokeWidth="14" strokeLinecap="round" />
      <path d="M60 520 H840" stroke="#E5E9F5" strokeWidth="14" strokeLinecap="round" />
      <text x="70" y="326" fontFamily={FONT} fontWeight="600" fontSize="30" fill="#FF8A4E">HIGH</text>
      <text x="70" y="568" fontFamily={FONT} fontWeight="600" fontSize="30" fill="#4EB4FF">LOW</text>
      <g transform="translate(450 352)"><Bird s={1.4} tilt={0} wing={0} shock={zap > 0.5 ? 1 : 0} /></g>
      <path d="M470 340 L600 430" stroke="#7A5A44" strokeWidth="0" />
      {zap > 0.3 && (
        <g opacity={0.5 + 0.5 * fl}>
          <path d="M452 360 L430 410 L470 424 L440 470 L474 484 L452 520" fill="none" stroke={RED} strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="452" cy="440" r="60" fill={RED} opacity="0.2" />
        </g>
      )}
      <text x="450" y="650" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="44" fill={RED} opacity={ramp(u, 1.4, 1.9)}>Big difference → big current</text>
      <text x="450" y="710" textAnchor="middle" fontFamily={BODY} fontWeight="700" fontSize="34" fill="#fff" opacity={ramp(u, 2.6, 3.2)}>Never touch a power line</text>
    </Card>
  );
};

/* Neighbour fix label: "Two bare wires touching" */
export const Tag: React.FC<{ text: string; a: number; color?: string }> = ({ text, a, color = "#fff" }) => (
  <g opacity={a} transform={`scale(${0.85 + 0.15 * easeOut(a)})`}>
    <rect x={-text.length * 12.5 - 24} y="-40" width={text.length * 25 + 48} height="80" rx="40" fill="#10183A" fillOpacity="0.9" stroke={color} strokeWidth="4" />
    <text x="0" y="14" textAnchor="middle" fontFamily={FONT} fontWeight="600" fontSize="42" fill={color}>{text}</text>
  </g>
);

export { backOut };
