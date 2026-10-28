import React from "react";
import { W, H, clamp, ramp, kf, hash, easeOut } from "./util";
import { Pole, quad, wireY, Stars, ClockFace, WindowFrame } from "./props";
import { BookRack, Pinboard, Calendar, SwitchBoard, Almirah, Rug, Backpack, Bin, DeskItems, WaterTank, Clothesline, PlantPot, Antenna, StairRoom, Stool, Tree, Scooter, LampPost, Hedge } from "./decor";

/** Reusable sets (backgrounds). Sizes are screen pixels at camera zoom 1: 1080 x 1920. */

export const FLOOR_ROOM = 1560;

/* ===================================================================== */
/*  KIMU'S ROOM  (middle-class study room)                                */
/* ===================================================================== */
export const RoomBack: React.FC<{ t: number }> = ({ t }) => {
  const fan = t < 0.8 ? t * 11 : 8.8 + 3.2 * (1 - Math.exp(-(t - 0.8) * 1.6));
  return (
    <g>
      <defs>
        <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EBD9AE" /><stop offset="1" stopColor="#D8BE8E" /></linearGradient>
        <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8A5E3B" /><stop offset="1" stopColor="#5E3C25" /></linearGradient>
        <linearGradient id="deskG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B07A4A" /><stop offset="1" stopColor="#8A5A32" /></linearGradient>
      </defs>
      <rect x="-200" y="-100" width="1500" height="1700" fill="url(#wallG)" />
      <rect x="-200" y={FLOOR_ROOM} width="1500" height="500" fill="url(#floorG)" />
      <rect x="-200" y={FLOOR_ROOM - 22} width="1500" height="22" fill="#F2E7CC" />
      <rect x="-200" y={FLOOR_ROOM - 22} width="1500" height="8" fill="#000" opacity="0.1" />
      {/* subtle wall texture + soft light falloff */}
      {Array.from({ length: 24 }).map((_, i) => <rect key={i} x={-200 + i * 64} y="-100" width="3" height="1660" fill="#fff" opacity="0.07" />)}
      <rect x="-200" y="-100" width="1500" height="260" fill="#000" opacity="0.08" />
      <g transform={`translate(760 ${FLOOR_ROOM + 120})`}><Rug w={470} /></g>
      {/* tube light (off) */}
      <g transform="translate(300 52)"><rect width="360" height="22" rx="8" fill="#E9ECEF" stroke="#9AA3B3" strokeWidth="3" /><rect x="14" y="5" width="332" height="12" rx="6" fill="#F7F9FB" /></g>
      {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M${-200 + i * 330} ${FLOOR_ROOM} L${-380 + i * 440} 1960`} stroke="#4C2F1C" strokeWidth="4" opacity="0.5" />)}
      {/* ceiling fan */}
      <g transform="translate(540 120)">
        <rect x="-6" y="-120" width="12" height="100" fill="#6B6358" />
        {[0, 120, 240].map((a) => <ellipse key={a} cx="0" cy="-8" rx="170" ry="14" fill="#7C7468" transform={`rotate(${a + (fan * 57.3) % 360})`} opacity="0.92" style={{ transformOrigin: "0 0" }} />)}
        <circle r="30" fill="#4C463E" />
      </g>
      {/* window with curtains + moon */}
      <g transform="translate(700 300)">
        <WindowFrame w={270} h={420} lit={0} />
        <rect x="0" y="0" width="270" height="420" fill="#14213D" />
        <g clipPath="url(#winClip)"><Stars t={t} n={26} w={270} h={300} /><circle cx="196" cy="86" r="30" fill="#FFF6D6" /><circle cx="208" cy="78" r="26" fill="#14213D" /></g>
        <clipPath id="winClip"><rect width="270" height="420" /></clipPath>
        <path d="M0 0 V420 M135 0 V420 M0 210 H270" stroke="#8B6B4A" strokeWidth="7" />
        <path d="M-30 -20 C20 40 30 380 -10 440 L-50 440 L-50 -20 Z" fill="#C45B4B" /><path d="M300 -20 C250 40 240 380 280 440 L320 440 L320 -20 Z" fill="#C45B4B" />
      </g>
      {/* wall clock + poster + shelf */}
      <g transform="translate(450 270)"><ClockFace r={52} /></g>
      <g transform="translate(60 150) scale(0.86)">
        <rect width="230" height="300" rx="6" fill="#F4F1E8" stroke="#BFB59A" strokeWidth="4" />
        <path d="M30 70 H90 V110 H150 M30 150 H80 V200 H120 M150 150 V240 H200" fill="none" stroke="#2F6FD6" strokeWidth="5" />
        {[[90, 70], [150, 110], [120, 200], [200, 240]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="#D93A3A" />)}
        <text x="115" y="285" textAnchor="middle" fontFamily="Nunito" fontWeight="700" fontSize="18" fill="#6B6358">CIRCUIT NOTES</text>
      </g>
      <g transform="translate(372 520)"><BookRack /></g>
      <g transform="translate(548 300)"><Calendar /></g>
      <g transform="translate(1000 330)"><Pinboard /></g>
      <g transform="translate(372 960)"><SwitchBoard /></g>
      <g transform="translate(1010 760)"><Almirah /></g>
      <g transform="translate(1185 1585)"><Bin /></g>
      {/* mosquito racket on a hook + wall socket cable */}
      <g transform="translate(700 720)"><circle cx="0" cy="0" r="5" fill="#6B6358" /><path d="M0 4 V30" stroke="#6B6358" strokeWidth="4" /><ellipse cx="0" cy="62" rx="26" ry="32" fill="none" stroke="#2A2E3A" strokeWidth="5" /><path d="M-18 48 H18 M-22 62 H22 M-18 76 H18 M-8 34 V90 M8 34 V90" stroke="#8D95A6" strokeWidth="1.6" /></g>
      {/* door frame (hallway side) */}
      <g>
        <rect x="-10" y="520" width="360" height="1060" fill="#5E3C25" />
        <rect x="26" y="556" width="290" height="1004" fill="#1E2438" />
      </g>
    </g>
  );
};

/** Hallway light that spills through the door while Dad / Mom stand there. a = intensity. */
export const HallLight: React.FC<{ a: number; t?: number }> = ({ a, t = 0 }) => (
  <g opacity={a}>
    <rect x="26" y="556" width="290" height="1004" fill="#FFE7B0" />
    <path d="M316 556 L700 760 L700 1560 L316 1560 Z" fill="#FFE7B0" opacity="0.22" />
    {Array.from({ length: 22 }).map((_, i) => (
      <circle key={i} cx={340 + hash(i * 2.1) * 330 + 14 * Math.sin(t * 0.6 + i)} cy={720 + hash(i * 5.3) * 800 + 20 * Math.sin(t * 0.4 + i * 2)} r={2 + hash(i) * 2.4} fill="#FFF7D6" opacity={0.35 + 0.3 * hash(i * 9)} />
    ))}
  </g>
);

export const RoomChair: React.FC = () => (
  <g>
    <rect x="720" y="1060" width="160" height="300" rx="30" fill="#8A2F2F" />
    <rect x="700" y="1330" width="200" height="40" rx="14" fill="#6E2323" />
  </g>
);

export const RoomDesk: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x="340" y="1318" width="800" height="34" rx="6" fill="url(#deskG)" />
    <rect x="360" y="1352" width="740" height={FLOOR_ROOM - 1352} fill="#7A4D2A" />
    <rect x="380" y="1380" width="300" height="120" rx="6" fill="#8A5A32" stroke="#5E3C25" strokeWidth="4" />
    <rect x="520" y="1432" width="40" height="10" rx="4" fill="#E8C26A" />
    <rect x="740" y="1380" width="300" height="120" rx="6" fill="#8A5A32" stroke="#5E3C25" strokeWidth="4" />
    <rect x="880" y="1432" width="40" height="10" rx="4" fill="#E8C26A" />
    {/* breadboard + wires on the desk (left side) */}
    <g transform="translate(470 1318)">
      <rect x="-72" y="-30" width="150" height="30" rx="5" fill="#EDEBE3" stroke="#BDB8A8" strokeWidth="3" />
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={-60 + i * 12} cy={-15} r="2.4" fill="#8E897A" />)}
      <rect x="-30" y="-46" width="36" height="16" rx="3" fill="#2A2E3A" />
      <circle cx="40" cy="-38" r="8" fill="#E5483A" />
      <path d="M-50 -30 C-70 -70 -110 -40 -120 -4 M0 -30 C0 -90 70 -90 90 -4 M30 -30 C60 -60 40 -10 120 -6" fill="none" stroke="#E5483A" strokeWidth="5" strokeLinecap="round" />
      <path d="M-20 -30 C-30 -60 -90 -70 -100 -2" fill="none" stroke="#2A2E3A" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 -30 C70 -64 110 -50 120 -4" fill="none" stroke="#F0C03C" strokeWidth="5" strokeLinecap="round" />
    </g>
    {/* mug + books */}
    <g transform="translate(470 1318)"><DeskItems show={["multimeter"]} /></g>
    <g transform="translate(640 1318)"><DeskItems show={["cup", "lamp", "bottle"]} /></g>
    <rect x="880" y="1280" width="90" height="38" fill="#2F6FD6" /><rect x="886" y="1252" width="80" height="28" fill="#E8B33E" />
  </g>
);

/** Darkness after the power cut + glows. Draw AFTER the people. torch: [x,y,angleDeg,intensity] */
export const RoomDark: React.FC<{ t: number; torch?: [number, number, number, number]; glowAt?: [number, number]; screenOn: number }> = ({ t, torch, glowAt = [800, 1090], screenOn }) => {
  const d = ramp(t, 0.8, 1.25) * 0.72;
  return (
    <g>
      <rect x="-200" y="-100" width="1500" height="2200" fill="#040A1C" opacity={d} />
      <g style={{ mixBlendMode: "screen" as const }}>
        {/* moonlight from the window */}
        <path d="M700 300 L1000 300 L760 1560 L330 1560 Z" fill="#7FA2E8" opacity={0.1 * d} />
        <ellipse cx={glowAt[0]} cy={glowAt[1]} rx="330" ry="360" fill="url(#lapGlow)" opacity={screenOn * 0.5} />
        {torch && torch[3] > 0 && (
          <g transform={`translate(${torch[0]} ${torch[1]}) rotate(${torch[2]})`} opacity={torch[3]}>
            <path d="M0 0 L620 -190 L620 190 Z" fill="url(#torchG)" />
          </g>
        )}
      </g>
      <defs>
        <radialGradient id="lapGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#8EE3FF" stopOpacity="0.55" /><stop offset="1" stopColor="#8EE3FF" stopOpacity="0" /></radialGradient>
        <linearGradient id="torchG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFF1C2" stopOpacity="0.8" /><stop offset="1" stopColor="#FFF1C2" stopOpacity="0" /></linearGradient>
      </defs>
    </g>
  );
};

/* ===================================================================== */
/*  TERRACE AT NIGHT                                                      */
/* ===================================================================== */
export const WIRE_Y0 = 820;
const INS = [750, 880, 1010];
export const BIRD_X = 520;
export const birdWireY = () => wireY(INS[1], WIRE_Y0, -140, WIRE_Y0 + 70, 60, BIRD_X);

export const TerraceBack: React.FC<{ t: number; lit?: number }> = ({ t, lit = 0 }) => (
  <g>
    <defs>
      <linearGradient id="floorT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A5070" /><stop offset="1" stopColor="#2A2F4C" /></linearGradient>
      <linearGradient id="parG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#58627C" /><stop offset="1" stopColor="#2E3550" /></linearGradient>
      <linearGradient id="nightG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#070C1F" /><stop offset="0.55" stopColor="#14214A" /><stop offset="1" stopColor="#3A3F78" /></linearGradient>
    </defs>
    <rect x="-300" y="-200" width="1700" height="2300" fill="url(#nightG)" />
    <Stars t={t} n={90} w={1080} h={1000} />
    <g transform="translate(220 260)"><circle r="62" fill="#FFF3C8" /><circle cx="22" cy="-12" r="56" fill="#0B1230" opacity="0.92" /><circle r="110" fill="#FFF3C8" opacity="0.07" /></g>
    {/* far + near skyline */}
    <g fill="#10183A">
      {[[-60, 1180, 130, 400], [90, 1100, 110, 480], [210, 1210, 140, 370], [360, 1130, 120, 450], [500, 1240, 160, 340], [680, 1150, 120, 430], [820, 1220, 150, 360], [980, 1120, 140, 460]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
    </g>
    <g fill="#0A1030">
      {[[-20, 1290, 170, 300], [170, 1260, 130, 340], [330, 1320, 150, 280], [500, 1280, 190, 320], [710, 1340, 140, 260], [870, 1270, 210, 330]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
    </g>
    {/* a few windows still lit (inverters, candles, phones) */}
    {Array.from({ length: 26 }).map((_, i) => {
      const x = hash(i * 4.1) * 1040, y = 1140 + hash(i * 9.3) * 380;
      const on = lit > 0 ? 1 : (hash(i * 1.7) > 0.8 ? 0.8 + 0.2 * Math.sin(t * (2 + hash(i) * 3) + i) : 0);
      return on > 0 ? <rect key={i} x={x} y={y} width="12" height="16" fill="#FFC96B" opacity={on} /> : null;
    })}
    {/* pole and the power line */}
    <g transform="translate(880 760)"><Pole h={1000} /></g>
    {INS.map((ix, i) => (
      <g key={ix}>
        <path d={quad(ix, WIRE_Y0, -140, WIRE_Y0 + 70 + i * 22, 60)} stroke="#0A0E1C" strokeWidth="6" fill="none" />
        <path d={quad(ix, WIRE_Y0, -140, WIRE_Y0 + 70 + i * 22, 60)} stroke="#4A5A85" strokeWidth="1.6" fill="none" opacity="0.8" />
        <path d={quad(ix, WIRE_Y0, 1220, WIRE_Y0 + 60 + i * 22, 60)} stroke="#0A0E1C" strokeWidth="6" fill="none" />
        <path d={quad(ix, WIRE_Y0, 1220, WIRE_Y0 + 60 + i * 22, 60)} stroke="#4A5A85" strokeWidth="1.6" fill="none" opacity="0.8" />
      </g>
    ))}
    {/* our terrace: stair room, water tank, clothesline, plants, antenna, parapet wall and floor (everything behind the actors) */}
    <g transform="translate(-150 1580)"><StairRoom /></g>
    <g transform="translate(60 1200)"><Antenna /></g>
    <g transform="translate(90 1190)"><Clothesline t={t} w={460} /></g>
    <rect x="-300" y="1400" width="1700" height="200" fill="url(#parG)" />
    <rect x="-300" y="1380" width="1700" height="30" fill="#7C86A2" /><rect x="-300" y="1410" width="1700" height="8" fill="#000" opacity="0.22" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M${-40 + i * 200} 1418 V1590`} stroke="#252B44" strokeWidth="3" opacity="0.5" />)}
    {[[190, 0.8], [440, 0.9], [980, 0.85]].map(([x, sc]) => <g key={x} transform={`translate(${x} 1382)`}><PlantPot s={sc} /></g>)}
    <rect x="-300" y="1590" width="1700" height="520" fill="url(#floorT)" />
    <rect x="-300" y="1590" width="1700" height="10" fill="#000" opacity="0.3" />
    {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${-300 + i * 220} 1600 L${-420 + i * 260} 2000`} stroke="#1D2240" strokeWidth="3" opacity="0.5" />)}
    <g transform="translate(840 1790)"><WaterTank /></g>
    <g transform="translate(560 1810)"><Stool /></g>
    <g transform="translate(560 1748)">
      <rect x="-64" y="-14" width="128" height="14" rx="5" fill="#B7BFCE" stroke="#7B869B" strokeWidth="3" /><rect x="-60" y="-14" width="120" height="5" rx="2" fill="#fff" opacity="0.35" />
      <rect x="-44" y="-18" width="88" height="5" rx="2" fill="#8892A6" />
    </g>
  </g>
);

export const TerraceParapet: React.FC = () => null;

/* ===================================================================== */
/*  STREET IN THE MORNING                                                 */
/* ===================================================================== */
export const GROUND_Y = 1640;

export const StreetBack: React.FC<{ t: number; lit: number }> = ({ t, lit }) => (
  <g>
    <defs>
      <linearGradient id="morG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8CC8F2" /><stop offset="0.6" stopColor="#CDE9F6" /><stop offset="1" stopColor="#FFE9C8" /></linearGradient>
      <linearGradient id="roadG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C8087" /><stop offset="1" stopColor="#5A5E66" /></linearGradient>
      <linearGradient id="houseA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2C98F" /><stop offset="1" stopColor="#E0AE70" /></linearGradient>
      <linearGradient id="houseB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9D8C8" /><stop offset="1" stopColor="#9BC2AE" /></linearGradient>
    </defs>
    <rect x="-300" y="-200" width="1700" height="2300" fill="url(#morG)" />
    <circle cx="170" cy="330" r="120" fill="#FFF6D0" opacity="0.9" /><circle cx="170" cy="330" r="220" fill="#FFF6D0" opacity="0.25" />
    {[[300, 220, 1], [760, 360, 0.8], [980, 160, 0.7]].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x + 30 * Math.sin(t * 0.1 + i)} ${y}) scale(${s})`} fill="#fff" opacity="0.92"><ellipse rx="110" ry="36" /><ellipse cx="-50" cy="-24" rx="60" ry="34" /><ellipse cx="40" cy="-30" rx="70" ry="38" /></g>
    ))}
    {/* uncle's house (left) */}
    <g>
      <rect x="-60" y="700" width="700" height="940" fill="url(#houseA)" />
      <rect x="-80" y="670" width="740" height="36" fill="#B77A4A" />
      <rect x="-60" y="1080" width="700" height="14" fill="#D49A5E" />
      <g transform="translate(90 800)"><WindowFrame w={150} h={190} lit={lit} /></g>
      <g transform="translate(380 800)"><WindowFrame w={150} h={190} lit={lit} /></g>
      <g transform="translate(90 1150)"><WindowFrame w={150} h={170} lit={lit} /></g>
      <rect x="-60" y="1420" width="700" height="220" fill="#C99256" />
      {/* boundary wall + gate */}
      <rect x="-60" y="1380" width="700" height="260" fill="#C7B393" />
      <rect x="-60" y="1370" width="700" height="24" fill="#A8946F" />
      <rect x="470" y="1300" width="60" height="340" fill="#A8946F" /><rect x="456" y="1286" width="88" height="26" fill="#8C7855" />
      <rect x="540" y="1400" width="100" height="240" fill="#4C6B7A" />
      {/* porch lamp that comes on */}
      <g transform="translate(590 1330)"><rect x="-6" y="-30" width="12" height="30" fill="#6B5A44" /><ellipse cx="0" cy="8" rx="22" ry="26" fill={lit > 0.05 ? "#FFF3B0" : "#C8D2D8"} />{lit > 0.05 && <circle cx="0" cy="8" r="80" fill="#FFF3B0" opacity={0.3 * lit} />}</g>
    </g>
    {/* kimu's house (right) */}
    <g>
      <rect x="690" y="780" width="520" height="860" fill="url(#houseB)" />
      <rect x="670" y="750" width="560" height="36" fill="#6C8F7E" />
      <g transform="translate(790 880)"><WindowFrame w={190} h={240} lit={0.9} mullions={false} /></g>
      <rect x="760" y="1330" width="140" height="310" rx="8" fill="#7C4A2E" /><circle cx="880" cy="1490" r="9" fill="#E8C26A" />
      <rect x="700" y="1630" width="320" height="22" fill="#8F8F94" />
    </g>
    {/* ground */}
    <rect x="-300" y="1620" width="1700" height="400" fill="url(#roadG)" />
    <rect x="-300" y="1620" width="1700" height="26" fill="#B6B2A6" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={40 + i * 280} y="1810" width="150" height="14" rx="6" fill="#E8E2CE" />)}
    {/* lane dressing */}
    <g transform="translate(1180 1630)"><Tree s={1.05} t={t} /></g>
    <g transform="translate(-30 1640)"><Hedge w={300} /></g>
    <g transform="translate(980 1690)"><Scooter /></g>
    <g transform="translate(760 1640)"><PlantPot s={0.8} /></g>
    <g transform="translate(850 1640)"><PlantPot s={0.7} /></g>
    <g transform="translate(-10 1620)"><LampPost /></g>
    {/* street pole between the houses with a line across */}
    <g transform="translate(655 700)"><Pole h={940} /></g>
    {[0, 1].map((i) => <path key={i} d={quad(655, 750 + i * 22, -200, 780 + i * 22, 40)} stroke="#2A2F3A" strokeWidth="5" fill="none" />)}
    {[0, 1].map((i) => <path key={"r" + i} d={quad(655, 750 + i * 22, 1300, 770 + i * 22, 40)} stroke="#2A2F3A" strokeWidth="5" fill="none" />)}
  </g>
);

/** The neighbour's meter board, drawn big. state: 0 = faulty (two bare wires touching), 1 = fixed. */
export const MeterBoard: React.FC<{ t: number; fixT: number }> = ({ t, fixT }) => {
  const fixed = clamp((t - fixT) / 0.4);
  return (
    <g>
      <rect x="-70" y="-100" width="140" height="190" rx="10" fill="#8E9AA4" stroke="#5C666E" strokeWidth="5" />
      <rect x="-54" y="-84" width="108" height="76" rx="6" fill="#E9EEF1" />
      <rect x="-40" y="-70" width="80" height="26" rx="3" fill="#2A3A3F" />
      <text x="0" y="-51" textAnchor="middle" fontFamily="Fredoka" fontWeight="600" fontSize="19" fill="#9CF0B5">00482</text>
      <rect x="-54" y="0" width="108" height="70" rx="6" fill="#F1F4F6" />
      <rect x="-34" y="14" width="22" height="42" rx="3" fill="#2E6FD6" /><rect x="12" y="14" width="22" height="42" rx="3" fill={fixed > 0.5 ? "#3FAE6A" : "#D84A3A"} />
    </g>
  );
};

export const StreetCamHelpers = { clamp, ramp, kf, easeOut, W, H };
