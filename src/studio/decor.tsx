import React from "react";
import { hash } from "./util";
import { shade } from "./Person";

/** Set dressing for the Kimu world: everyday objects of a middle-class city home, terrace and lane.
 *  Every prop is unbranded, drawn around its own origin (bottom-centre unless noted) with an outline, a shade side and a contact shadow. */

const ol = (c: string) => shade(c, -0.55);
const Shadow: React.FC<{ w: number; y?: number; o?: number }> = ({ w, y = 0, o = 0.22 }) => <ellipse cx="0" cy={y} rx={w} ry={w * 0.12} fill="#000" opacity={o} />;

/* ============================== INDOOR ============================== */
/** Wall rack with books, plant, globe, trophy, family photo. Origin: top-left of the board. */
export const BookRack: React.FC = () => {
  const cols = ["#B3402F", "#2F6FD6", "#E8B33E", "#3F8F6A", "#7C4A9C", "#D2762C", "#3A5F8F", "#8A2F2F", "#2E7D7A", "#C9A24A"];
  return (
    <g>
      {[0, 1].map((r) => (
        <g key={r} transform={`translate(0 ${r * 150})`}>
          <rect x="-8" y="146" width="334" height="16" rx="3" fill="#7A4D2A" stroke="#4C2F1C" strokeWidth="3" />
          <rect x="0" y="162" width="318" height="8" fill="#000" opacity="0.18" />
          {r === 0 && (
            <g>
              {cols.map((c, i) => { const h = 80 + (i * 37) % 36; return <g key={i}><rect x={8 + i * 21} y={146 - h} width="19" height={h} rx="2" fill={c} stroke={ol(c)} strokeWidth="2" /><rect x={11 + i * 21} y={146 - h + 12} width="13" height="4" fill="#fff" opacity="0.5" /></g>; })}
              <g transform="translate(250 146)">{/* plant */}<path d="M-18 0 L18 0 L12 -34 L-12 -34 Z" fill="#B3402F" stroke="#6E2A20" strokeWidth="3" /><path d="M0 -34 C-30 -60 -26 -90 -6 -76 M0 -34 C20 -64 40 -66 30 -84 M0 -34 C-4 -70 8 -92 0 -104" stroke="#2E8F4E" strokeWidth="8" fill="none" strokeLinecap="round" /></g>
            </g>
          )}
          {r === 1 && (
            <g>
              {/* globe */}
              <g transform="translate(46 146)"><rect x="-20" y="-6" width="40" height="6" rx="3" fill="#5A3A22" /><path d="M0 -6 V-22" stroke="#5A3A22" strokeWidth="5" /><circle cx="0" cy="-58" r="36" fill="#3C86C8" stroke="#1E4E7A" strokeWidth="3" /><path d="M-22 -66 q10 -12 22 -2 t12 14 q-14 10 -30 4 Z M6 -48 q10 0 16 10 q-12 6 -18 -2 Z" fill="#6DBA6A" /><path d="M-36 -58 H36" stroke="#fff" strokeWidth="1.6" opacity="0.4" /><ellipse cx="-12" cy="-74" rx="8" ry="5" fill="#fff" opacity="0.35" /></g>
              {/* family photo */}
              <g transform="translate(130 146)"><rect x="-34" y="-86" width="68" height="84" rx="4" fill="#6B4B33" stroke="#3E2A1B" strokeWidth="3" /><rect x="-27" y="-79" width="54" height="70" fill="#CFE3F2" />
                <circle cx="-12" cy="-54" r="8" fill="#C9936A" /><circle cx="10" cy="-54" r="8" fill="#D9A57C" /><circle cx="0" cy="-34" r="6" fill="#E2B38C" /><rect x="-20" y="-46" width="16" height="30" rx="5" fill="#B9A58A" /><rect x="2" y="-46" width="16" height="30" rx="5" fill="#2E7D7A" /><rect x="-7" y="-28" width="14" height="20" rx="4" fill="#2F6FD6" /></g>
              {/* trophy */}
              <g transform="translate(200 146)"><rect x="-16" y="-8" width="32" height="8" rx="2" fill="#5A3A22" /><path d="M-4 -8 V-26 M4 -8 V-26" stroke="#C9A24A" strokeWidth="5" /><path d="M-22 -62 H22 C22 -40 12 -28 0 -26 C-12 -28 -22 -40 -22 -62 Z" fill="#E8C26A" stroke="#8A6A1E" strokeWidth="3" /><path d="M-22 -56 C-36 -56 -34 -40 -18 -40 M22 -56 C36 -56 34 -40 18 -40" stroke="#C9A24A" strokeWidth="4" fill="none" /><path d="M-12 -58 L-12 -44" stroke="#fff" strokeWidth="3" opacity="0.6" /></g>
              {/* radio */}
              <g transform="translate(272 146)"><rect x="-38" y="-52" width="76" height="52" rx="8" fill="#6A4A33" stroke="#3E2A1B" strokeWidth="3" /><circle cx="-16" cy="-26" r="14" fill="#3C3C46" stroke="#1E1E26" strokeWidth="2" /><path d="M-26 -26 H-6 M-16 -36 V-16" stroke="#555" strokeWidth="1.5" /><rect x="6" y="-42" width="26" height="14" rx="2" fill="#E7D7A8" /><circle cx="19" cy="-14" r="5" fill="#C9A24A" /><path d="M20 -52 L48 -90" stroke="#8D95A6" strokeWidth="3" strokeLinecap="round" /></g>
            </g>
          )}
        </g>
      ))}
      <path d="M0 0 V30 M318 0 V30" stroke="#8D95A6" strokeWidth="3" opacity="0" />
    </g>
  );
};

export const Pinboard: React.FC = () => (
  <g>
    <rect x="-8" y="-8" width="216" height="256" rx="6" fill="#7A4D2A" stroke="#4C2F1C" strokeWidth="3" />
    <rect x="0" y="0" width="200" height="240" fill="#C9A06A" />
    <g fill="#000" opacity="0.1">{Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={hash(i) * 196 + 2} cy={hash(i * 3) * 236 + 2} r="2" />)}</g>
    {[[16, 20, 80, 62, "#FFF2A8", -4], [112, 16, 74, 58, "#B9E6C9", 5], [20, 104, 74, 52, "#FFD1DC", 3], [108, 96, 80, 70, "#fff", -3]].map(([x, y, w, h, c, r], i) => (
      <g key={i} transform={`rotate(${r} ${(x as number) + (w as number) / 2} ${(y as number) + (h as number) / 2})`}>
        <rect x={x as number} y={y as number} width={w as number} height={h as number} fill={c as string} stroke="#00000030" strokeWidth="2" />
        <circle cx={(x as number) + (w as number) / 2} cy={(y as number) + 7} r="4.5" fill="#D93A3A" />
        {i === 3 ? <path d={`M${(x as number) + 10} ${(y as number) + 52} H${(x as number) + 30} V${(y as number) + 28} H${(x as number) + 52} V${(y as number) + 44} H${(x as number) + 70}`} stroke="#2F6FD6" strokeWidth="3.4" fill="none" /> : <path d={`M${(x as number) + 10} ${(y as number) + 26} h${(w as number) - 24} M${(x as number) + 10} ${(y as number) + 38} h${(w as number) - 36}`} stroke="#555" strokeWidth="3" opacity="0.6" />}
      </g>
    ))}
    <g transform="translate(40 176)"><rect width="130" height="56" fill="#1F6A47" stroke="#0E3A27" strokeWidth="2" /><g fill="#C9D3E0">{Array.from({ length: 8 }).map((_, i) => <rect key={i} x={8 + i * 15} y="4" width="8" height="8" />)}</g><rect x="40" y="22" width="48" height="24" fill="#22242C" /><circle cx="14" cy="34" r="6" fill="#E8C26A" /></g>
    <path d="M30 20 C90 70 140 40 170 120" stroke="#D93A3A" strokeWidth="2" fill="none" opacity="0.7" />
  </g>
);

export const Calendar: React.FC = () => (
  <g>
    <rect x="0" y="0" width="112" height="150" rx="5" fill="#F7F3E8" stroke="#BFB59A" strokeWidth="3" />
    <rect x="0" y="0" width="112" height="40" rx="5" fill="#C45B4B" />
    <circle cx="20" cy="2" r="5" fill="#6B6358" /><circle cx="92" cy="2" r="5" fill="#6B6358" />
    <text x="56" y="28" textAnchor="middle" fontFamily="Nunito" fontWeight="700" fontSize="20" fill="#fff">OCTOBER</text>
    {Array.from({ length: 28 }).map((_, i) => <rect key={i} x={8 + (i % 7) * 14} y={50 + Math.floor(i / 7) * 22} width="9" height="9" fill={i === 17 ? "#D93A3A" : "#8E897A"} opacity={i === 17 ? 1 : 0.5} />)}
  </g>
);

export const SwitchBoard: React.FC = () => (
  <g>
    <rect x="0" y="0" width="64" height="104" rx="6" fill="#F1EEE4" stroke="#B5AD97" strokeWidth="3" />
    {[14, 40].map((y) => <rect key={y} x="12" y={y} width="16" height="22" rx="3" fill="#E4DFCF" stroke="#A59D88" strokeWidth="2" />)}
    <rect x="36" y="14" width="16" height="22" rx="3" fill="#E4DFCF" stroke="#A59D88" strokeWidth="2" />
    <rect x="34" y="52" width="22" height="40" rx="4" fill="#DAD4C2" stroke="#A59D88" strokeWidth="2" /><circle cx="40" cy="68" r="2.4" fill="#444" /><circle cx="50" cy="68" r="2.4" fill="#444" /><rect x="43" y="76" width="4" height="6" fill="#444" />
    <circle cx="16" cy="92" r="4" fill="#3FAE6A" />
  </g>
);

export const Almirah: React.FC = () => (
  <g>
    <rect x="0" y="0" width="230" height="800" rx="8" fill="#7C8EA0" stroke="#43515F" strokeWidth="4" />
    <rect x="12" y="12" width="98" height="776" fill="#8EA0B2" stroke="#43515F" strokeWidth="3" /><rect x="120" y="12" width="98" height="776" fill="#8EA0B2" stroke="#43515F" strokeWidth="3" />
    <path d="M20 40 L100 700" stroke="#fff" strokeWidth="14" opacity="0.1" /><path d="M130 40 L210 700" stroke="#fff" strokeWidth="14" opacity="0.1" />
    <rect x="96" y="380" width="8" height="70" rx="4" fill="#C9D3E0" /><rect x="126" y="380" width="8" height="70" rx="4" fill="#C9D3E0" />
    <rect x="-6" y="790" width="242" height="14" fill="#43515F" />
  </g>
);

export const Rug: React.FC<{ w?: number }> = ({ w = 420 }) => (
  <g>
    <ellipse cx="0" cy="0" rx={w} ry={w * 0.14} fill="#8A3B34" stroke="#5A1F1B" strokeWidth="4" />
    <ellipse cx="0" cy="0" rx={w * 0.84} ry={w * 0.1} fill="none" stroke="#E8C26A" strokeWidth="4" strokeDasharray="14 10" />
    <ellipse cx="0" cy="0" rx={w * 0.6} ry={w * 0.07} fill="#A8514A" />
  </g>
);

export const Backpack: React.FC = () => (
  <g>
    <Shadow w={62} y={2} />
    <rect x="-52" y="-120" width="104" height="120" rx="26" fill="#2F6FD6" stroke="#173A7A" strokeWidth="4" />
    <rect x="-36" y="-70" width="72" height="46" rx="10" fill="#2A5FBA" stroke="#173A7A" strokeWidth="3" /><path d="M-36 -52 H36" stroke="#173A7A" strokeWidth="3" />
    <path d="M-52 -110 Q-62 -64 -52 -30" stroke="#173A7A" strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M-30 -118 Q0 -140 30 -118" stroke="#173A7A" strokeWidth="9" fill="none" strokeLinecap="round" />
    <rect x="-14" y="-112" width="28" height="12" rx="4" fill="#fff" opacity="0.18" />
  </g>
);

export const Bin: React.FC = () => (
  <g>
    <Shadow w={44} y={2} />
    <path d="M-34 -80 L34 -80 L28 0 L-28 0 Z" fill="#3A4660" stroke="#1E2638" strokeWidth="4" />
    <ellipse cx="0" cy="-80" rx="34" ry="8" fill="#252E44" stroke="#1E2638" strokeWidth="3" />
    <path d="M-26 -62 L-22 -10 M-8 -66 L-6 -10 M12 -66 L10 -10" stroke="#fff" strokeWidth="3" opacity="0.1" />
    <path d="M-12 -86 L-4 -104 L8 -88 L16 -100" stroke="#EDEBE3" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** Desk items; origin = desk top surface (y=0), spread across x in [-460, 460]. */
export const DeskItems: React.FC<{ show?: string[] }> = ({ show }) => {
  const has = (k: string) => !show || show.includes(k);
  return (
  <g>
    {/* soldering iron + stand */}
    {has("iron") &&     <g transform="translate(-30 0)">
      <rect x="-26" y="-12" width="52" height="12" rx="4" fill="#3A3F4C" stroke="#1E212A" strokeWidth="3" />
      <path d="M-14 -12 C-14 -60 14 -60 14 -12" fill="none" stroke="#9AA3B3" strokeWidth="5" />
      <path d="M-70 -20 L-8 -26" stroke="#E5483A" strokeWidth="12" strokeLinecap="round" /><path d="M-8 -26 L40 -30" stroke="#C9CFD8" strokeWidth="5" strokeLinecap="round" />
      <path d="M-70 -20 C-90 -12 -96 -4 -110 -2" stroke="#222" strokeWidth="4" fill="none" />
    </g>}
    {/* multimeter (generic) */}
    {has("multimeter") &&     <g transform="translate(150 0)">
      <rect x="-34" y="-96" width="68" height="96" rx="10" fill="#F2C94C" stroke="#8A6A1E" strokeWidth="4" />
      <rect x="-24" y="-86" width="48" height="26" rx="3" fill="#BFD7C0" stroke="#4C5E4E" strokeWidth="2" /><text x="0" y="-66" textAnchor="middle" fontFamily="Fredoka" fontSize="18" fontWeight="600" fill="#2A3A2C">0.00</text>
      <circle cx="0" cy="-30" r="16" fill="#2A2E3A" stroke="#111" strokeWidth="2" /><path d="M0 -30 L9 -37" stroke="#fff" strokeWidth="3" />
      <circle cx="-18" cy="-8" r="5" fill="#222" /><circle cx="0" cy="-8" r="5" fill="#E5483A" /><circle cx="18" cy="-8" r="5" fill="#222" />
      <path d="M-18 -4 C-60 20 -70 -10 -90 6" stroke="#222" strokeWidth="4" fill="none" /><path d="M0 -4 C20 24 70 -6 96 4" stroke="#E5483A" strokeWidth="4" fill="none" />
    </g>}
    {/* pen / screwdriver cup */}
    {has("cup") &&     <g transform="translate(330 0)">
      <path d="M-22 -50 H22 L18 0 H-18 Z" fill="#3F8F6A" stroke="#1E4E38" strokeWidth="3" />
      {[[-10, -86, "#E5483A"], [0, -94, "#2F6FD6"], [10, -84, "#F2C94C"]].map(([x, y, c], i) => <g key={i}><rect x={(x as number) - 4} y={y as number} width="8" height={-50 - (y as number) + 4} fill={c as string} stroke="#00000040" strokeWidth="1.5" /></g>)}
      <path d="M-14 -50 L-20 -90" stroke="#C9CFD8" strokeWidth="4" strokeLinecap="round" />
    </g>}
    {/* desk lamp (off) */}
    {has("lamp") &&     <g transform="translate(430 0)">
      <ellipse cx="0" cy="-4" rx="34" ry="7" fill="#2A2E3A" /><path d="M0 -6 L-30 -86 L26 -140" stroke="#4A4F5E" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 -150 L60 -134 L46 -108 L0 -126 Z" fill="#E8B33E" stroke="#8A6A1E" strokeWidth="3" strokeLinejoin="round" />
    </g>}
    {/* notebook with a sketch */}
    {has("notebook") &&     <g transform="translate(-290 0)">
      <path d="M-70 0 L-62 -10 L70 -10 L78 0 Z" fill="#E9E2CC" stroke="#8A8470" strokeWidth="2.5" />
      <path d="M-62 -10 L-56 -16 L64 -16 L70 -10 Z" fill="#F7F3E8" stroke="#8A8470" strokeWidth="2.5" />
      <path d="M-40 -13 h22 v-3 M-8 -13 h28 M30 -14 l10 -2" stroke="#2F6FD6" strokeWidth="2.2" fill="none" />
    </g>}
    {/* headphones */}
    {has("phones") &&     <g transform="translate(-380 0)"><path d="M-26 -10 C-26 -64 26 -64 26 -10" stroke="#2A2E3A" strokeWidth="7" fill="none" /><rect x="-34" y="-30" width="16" height="28" rx="7" fill="#3A4660" stroke="#1E2638" strokeWidth="3" /><rect x="18" y="-30" width="16" height="28" rx="7" fill="#3A4660" stroke="#1E2638" strokeWidth="3" /></g>}
    {/* water bottle */}
    {has("bottle") &&     <g transform="translate(500 0)"><rect x="-17" y="-100" width="34" height="100" rx="12" fill="#BFE3FF" fillOpacity="0.7" stroke="#5BA6E6" strokeWidth="3" /><rect x="-9" y="-116" width="18" height="18" rx="4" fill="#2F6FD6" /><rect x="-12" y="-70" width="24" height="64" fill="#9FD3FF" opacity="0.6" /></g>}
  </g>
  );
};

/* ============================== TERRACE ============================== */
export const WaterTank: React.FC = () => (
  <g>
    <rect x="-86" y="0" width="12" height="150" fill="#2A2F45" /><rect x="74" y="0" width="12" height="150" fill="#2A2F45" /><rect x="-90" y="60" width="180" height="10" fill="#2A2F45" />
    <rect x="-90" y="-170" width="180" height="170" rx="22" fill="#262C4A" stroke="#151A30" strokeWidth="4" />
    <path d="M-90 -120 H90 M-90 -60 H90" stroke="#151A30" strokeWidth="4" />
    <path d="M-70 -150 L-60 -20" stroke="#8FA6E8" strokeWidth="8" opacity="0.22" strokeLinecap="round" />
    <rect x="-18" y="-186" width="36" height="16" rx="8" fill="#1B2040" stroke="#151A30" strokeWidth="3" />
    <path d="M60 -80 q30 20 20 80" stroke="#1B2040" strokeWidth="8" fill="none" />
  </g>
);

export const Clothesline: React.FC<{ t: number; w?: number }> = ({ t, w = 520 }) => (
  <g>
    <path d={`M0 0 Q${w / 2} 26 ${w} 0`} stroke="#6B7390" strokeWidth="3" fill="none" />
    {[[70, "#C45B4B", 80, 130], [170, "#E8C26A", 70, 100], [270, "#3C6FA8", 96, 120], [380, "#EDEAE0", 70, 150]].map(([x, c, ww, h], i) => (
      <g key={i} transform={`translate(${x} ${12 + 10 * Math.sin((x as number) / w * Math.PI)}) skewX(${3 * Math.sin(t * 1.3 + i)})`}>
        <path d={`M${-(ww as number) / 2} 0 H${(ww as number) / 2} L${(ww as number) / 2 - 6} ${h} Q0 ${(h as number) + 12} ${-(ww as number) / 2 + 6} ${h} Z`} fill={c as string} stroke={ol(c as string)} strokeWidth="2.5" opacity="0.9" />
        <rect x={-(ww as number) / 2 + 6} y="-4" width="10" height="14" rx="2" fill="#E8B33E" /><rect x={(ww as number) / 2 - 16} y="-4" width="10" height="14" rx="2" fill="#E8B33E" />
      </g>
    ))}
  </g>
);

export const PlantPot: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <Shadow w={36} y={2} />
    <path d="M-30 -56 H30 L22 0 H-22 Z" fill="#9C4A3A" stroke="#5A261C" strokeWidth="3.5" />
    <rect x="-34" y="-64" width="68" height="12" rx="4" fill="#B3604B" stroke="#5A261C" strokeWidth="3" />
    <path d="M0 -64 C-34 -96 -40 -130 -14 -126 M0 -64 C26 -100 52 -104 40 -128 M0 -64 C-6 -110 10 -140 0 -156 M0 -64 C-18 -90 -50 -80 -52 -104" stroke="#2E8F4E" strokeWidth="9" fill="none" strokeLinecap="round" />
    <circle cx="40" cy="-128" r="8" fill="#F29BC0" /><circle cx="-14" cy="-126" r="7" fill="#F29BC0" />
  </g>
);

export const Antenna: React.FC = () => (
  <g stroke="#1B2040" strokeWidth="5" strokeLinecap="round" fill="none">
    <path d="M0 0 V-260" /><path d="M-60 -250 H60 M-48 -214 H48 M-36 -178 H36 M-26 -142 H26" /><path d="M0 -260 L-36 -300 M0 -260 L36 -300" />
    <ellipse cx="-150" cy="-120" rx="46" ry="38" fill="#222B4A" stroke="#151A30" /><path d="M-150 -120 L-120 -148" /><path d="M-150 -82 V0" />
  </g>
);

/** The stair-room ("mumty") with a door. Origin: bottom-left. */
export const StairRoom: React.FC = () => (
  <g>
    <rect x="0" y="-360" width="300" height="360" fill="#3A4264" stroke="#1B2040" strokeWidth="4" />
    <rect x="-14" y="-380" width="328" height="26" fill="#2A3150" stroke="#1B2040" strokeWidth="4" />
    <rect x="86" y="-250" width="128" height="250" rx="6" fill="#4A3526" stroke="#2A1D14" strokeWidth="4" />
    <path d="M150 -250 V0" stroke="#2A1D14" strokeWidth="4" /><circle cx="140" cy="-120" r="6" fill="#E8C26A" /><circle cx="160" cy="-120" r="6" fill="#E8C26A" />
    <rect x="230" y="-300" width="46" height="60" fill="#FFC96B" opacity="0.8" stroke="#1B2040" strokeWidth="3" />
    <path d="M10 -40 H290 M10 -120 H290" stroke="#000" strokeWidth="3" opacity="0.1" />
  </g>
);

export const Stool: React.FC = () => (
  <g>
    <Shadow w={44} y={2} />
    <rect x="-34" y="-62" width="68" height="14" rx="5" fill="#8A5A32" stroke="#4C2F1C" strokeWidth="3" />
    <path d="M-26 -48 L-32 0 M26 -48 L32 0" stroke="#6E4626" strokeWidth="7" strokeLinecap="round" />
  </g>
);

/* ============================== STREET ============================== */
export const Tree: React.FC<{ s?: number; t?: number }> = ({ s = 1, t = 0 }) => (
  <g transform={`scale(${s})`}>
    <path d="M-16 0 C-14 -120 -22 -200 -12 -300 L22 -300 C14 -200 20 -120 18 0 Z" fill="#6B4A33" stroke="#3E2A1B" strokeWidth="4" />
    {[[-90, -330, 90], [60, -350, 100], [-10, -420, 110], [-130, -400, 70], [120, -420, 74], [20, -300, 96]].map(([x, y, r], i) => (
      <circle key={i} cx={(x as number) + 4 * Math.sin(t * 0.8 + i)} cy={y as number} r={r as number} fill={i % 2 ? "#3F9A55" : "#2E8F4E"} stroke="#1E5A31" strokeWidth="4" />
    ))}
    <circle cx="-30" cy="-440" r="40" fill="#fff" opacity="0.1" />
  </g>
);

export const Scooter: React.FC = () => (
  <g>
    <Shadow w={120} y={2} />
    <circle cx="-74" cy="-28" r="28" fill="#2A2E3A" stroke="#111" strokeWidth="4" /><circle cx="-74" cy="-28" r="12" fill="#8D95A6" />
    <circle cx="90" cy="-28" r="28" fill="#2A2E3A" stroke="#111" strokeWidth="4" /><circle cx="90" cy="-28" r="12" fill="#8D95A6" />
    <path d="M-100 -50 C-110 -110 -50 -120 -10 -100 L30 -100 C60 -100 70 -80 80 -56 L100 -56 L96 -130 L64 -140" fill="#C45B4B" stroke="#7A2E24" strokeWidth="4" strokeLinejoin="round" />
    <path d="M-60 -112 C-30 -126 20 -124 40 -112 L36 -104 L-56 -104 Z" fill="#2A2E3A" />
    <path d="M70 -146 L110 -150" stroke="#222" strokeWidth="8" strokeLinecap="round" /><circle cx="116" cy="-136" r="10" fill="#FFF3B0" stroke="#8A6A1E" strokeWidth="2" />
    <path d="M-30 -100 C-20 -150 10 -150 20 -140" stroke="#fff" strokeWidth="5" opacity="0.2" fill="none" />
  </g>
);

export const LampPost: React.FC = () => (
  <g>
    <rect x="-7" y="-460" width="14" height="460" fill="#3A4660" stroke="#1E2638" strokeWidth="3" />
    <path d="M0 -460 Q40 -480 70 -460" stroke="#3A4660" strokeWidth="10" fill="none" />
    <path d="M50 -462 L92 -462 L84 -440 L58 -440 Z" fill="#8D95A6" stroke="#1E2638" strokeWidth="3" />
  </g>
);

export const Hedge: React.FC<{ w: number }> = ({ w }) => (
  <g>
    {Array.from({ length: Math.floor(w / 46) }).map((_, i) => <circle key={i} cx={i * 46 + 23} cy={-26 - (i % 2) * 10} r={34} fill={i % 3 ? "#3F9A55" : "#2E8F4E"} stroke="#1E5A31" strokeWidth="3" />)}
  </g>
);

/** Vignette + soft colour-grade overlay to pull the whole frame together. */
export const Vignette: React.FC<{ strength?: number; w: number; h: number }> = ({ strength = 0.55, w, h }) => (
  <g pointerEvents="none">
    <defs>
      <radialGradient id="vigG" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#05081A" stopOpacity={strength} /></radialGradient>
    </defs>
    <rect x="0" y="0" width={w} height={h} fill="url(#vigG)" />
  </g>
);
