import React from "react";

/** Kimu Studio puppet rig v2. One generic person drawn in the Kimu character-sheet style (front view),
 *  now with outlines, cel shading, real eyes (sclera/iris/pupil/lids), a full set of mouths, anger / fear markers,
 *  jointed legs (hip + knee) and three hand shapes. Cast members are just different `Spec`s. All motion comes from `Pose`. */

export type Spec = {
  id: string;
  skin: string; hair: string; hairStyle: "curly" | "short" | "bun" | "grey" | "pony";
  glasses?: "round" | "none"; glassColor?: string;
  mustache?: boolean;
  top: string; topStyle: "tee" | "shirt" | "kurta" | "check"; longSleeve?: boolean; topAccent?: string;
  sleeve?: "short" | "three4" | "long";
  bottom: string; shoes: string;
  belly?: number;          // 0..1 extra width
  broad?: number;          // 0..1 shoulder width
  dupatta?: string;        // colour of a shoulder scarf
  bindi?: boolean;
  earrings?: string;       // stud colour
  wrinkles?: boolean;
  slim?: boolean;          // slim trousers
};

export type Mouth = "smile" | "flat" | "sad" | "open" | "o" | "grin" | "shout" | "grit" | "frown" | "wavy" | "smirk";
export type Pose = {
  lean?: number; bob?: number; headRot?: number; headDx?: number; headDy?: number;
  armL?: number; armR?: number; foreL?: number; foreR?: number;   // upper-arm swing and elbow bend, degrees (0 = hanging)
  handL?: "open" | "fist" | "point"; handR?: "open" | "fist" | "point";
  legL?: number; legR?: number; kneeL?: number; kneeR?: number;
  mouth?: Mouth;
  open?: number;            // 0..1 mouth openness when talking
  brow?: number; browTilt?: number;   // brow>0 raised; browTilt<0 angry V, >0 worried
  eyes?: "open" | "closed" | "wide" | "down";
  lid?: number;             // 0..1 upper-lid droop (tired / suspicious)
  lidTilt?: number;         // <0 angry slant, >0 sad slant
  pupil?: number;           // 1 normal, 0.5 terrified pin-pricks
  lookX?: number; lookY?: number;
  sweat?: number; tear?: number; vein?: number; pale?: number; blush?: number;
  shake?: number;           // px of head tremble
  glow?: number;            // prayer glow 0..1
  blink?: boolean;
};

export const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return `rgb(${r},${g},${b})`;
};
const OL = (c: string) => shade(c, -0.6);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const FACE = "M100 24 C128 24 150 44 158 78 C164 100 168 118 160 140 C150 172 124 204 100 222 C76 204 50 172 40 140 C32 118 36 100 42 78 C50 44 72 24 100 24 Z";
export const FEET = 692;      // y of the soles in character space (origin of the Person transform)

const Grad: React.FC<{ id: string; c: string }> = ({ id, c }) => (
  <linearGradient id={id} x1="0.1" y1="0" x2="0.9" y2="1">
    <stop offset="0" stopColor={shade(c, 0.3)} /><stop offset="0.5" stopColor={c} /><stop offset="1" stopColor={shade(c, -0.3)} />
  </linearGradient>
);

/* ------------------------------- hair ------------------------------- */
const Hair: React.FC<{ s: Spec; back: boolean }> = ({ s, back }) => {
  const g = `url(#${s.id}-hair)`;
  const ol = OL(s.hair);
  if (s.hairStyle === "curly") {
    return back ? (
      <g fill={g} stroke={ol} strokeWidth="2">
        <circle cx="30" cy="78" r="24" /><circle cx="170" cy="78" r="24" /><circle cx="28" cy="108" r="17" /><circle cx="172" cy="108" r="17" />
        <circle cx="34" cy="52" r="20" /><circle cx="166" cy="52" r="20" /><circle cx="56" cy="34" r="26" /><circle cx="144" cy="34" r="26" /><circle cx="100" cy="20" r="30" />
      </g>
    ) : (
      <g>
        <g fill={g} stroke={ol} strokeWidth="2">
          <circle cx="48" cy="52" r="16" /><circle cx="152" cy="52" r="16" /><circle cx="72" cy="36" r="21" /><circle cx="128" cy="36" r="21" /><circle cx="100" cy="26" r="23" />
          <circle cx="50" cy="74" r="13" /><circle cx="66" cy="62" r="16" /><circle cx="85" cy="56" r="16" /><circle cx="105" cy="54" r="17" /><circle cx="125" cy="57" r="16" /><circle cx="142" cy="63" r="16" /><circle cx="152" cy="76" r="13" />
          <circle cx="40" cy="94" r="12" /><circle cx="160" cy="94" r="12" />
        </g>
        <g fill="none" stroke="#000" strokeWidth="2.4" strokeLinecap="round" opacity="0.32">
          <path d="M58 66 q6 -10 14 -2" /><path d="M94 46 q8 -10 16 0" /><path d="M130 60 q6 -10 14 -2" /><path d="M78 72 q6 -6 12 0" /><path d="M60 30 q8 -8 16 0" /><path d="M124 28 q8 -8 16 0" />
        </g>
        <path d="M110 40 C130 44 160 60 160 96 C162 70 150 52 128 46 Z" fill="#000" opacity="0.18" />
        <g fill="#fff" opacity="0.2"><ellipse cx="84" cy="30" rx="14" ry="5" transform="rotate(-16 84 30)" /><ellipse cx="124" cy="34" rx="10" ry="4" transform="rotate(14 124 34)" /></g>
      </g>
    );
  }
  if (s.hairStyle === "short") {
    return back ? null : (
      <g>
        <path d="M38 96 C30 44 66 18 100 18 C134 18 170 44 162 96 C160 78 150 64 138 58 C120 50 80 50 62 58 C50 64 40 78 38 96 Z" fill={g} stroke={ol} strokeWidth="2" strokeLinejoin="round" />
        <path d="M110 22 C140 24 164 48 160 94 C158 62 140 42 116 30 Z" fill="#000" opacity="0.2" />
        <path d="M70 34 q12 -8 26 -8 M104 28 q12 0 22 6" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.16" strokeLinecap="round" />
        <ellipse cx="80" cy="34" rx="20" ry="7" fill="#fff" opacity="0.16" transform="rotate(-14 80 34)" />
      </g>
    );
  }
  if (s.hairStyle === "bun") {
    return back ? (
      <g fill={g} stroke={ol} strokeWidth="2"><ellipse cx="100" cy="86" rx="64" ry="72" /><circle cx="100" cy="6" r="24" /></g>
    ) : (
      <g>
        <path d="M40 100 C30 40 70 16 100 16 C130 16 170 40 160 100 C156 70 140 52 100 52 C60 52 44 70 40 100 Z" fill={g} stroke={ol} strokeWidth="2" strokeLinejoin="round" />
        <path d="M100 18 C96 34 84 46 66 54" stroke="#000" strokeWidth="2.4" fill="none" opacity="0.25" strokeLinecap="round" />
        <ellipse cx="82" cy="30" rx="18" ry="6" fill="#fff" opacity="0.18" transform="rotate(-16 82 30)" />
      </g>
    );
  }
  if (s.hairStyle === "pony") {
    return back ? (
      <g fill={g} stroke={ol} strokeWidth="2">
        <ellipse cx="100" cy="90" rx="62" ry="74" />
        <path d="M150 70 C196 90 214 200 190 330 C176 380 150 380 150 340 C158 250 150 160 130 100 Z" />
      </g>
    ) : (
      <g>
        <path d="M38 108 C26 40 70 14 104 14 C140 14 172 42 162 110 C160 84 150 62 124 54 C100 48 70 54 54 74 C44 86 40 98 38 108 Z" fill={g} stroke={ol} strokeWidth="2" strokeLinejoin="round" />
        <path d="M118 18 C146 26 164 56 160 108 C158 74 142 46 112 34 Z" fill="#000" opacity="0.2" />
        <path d="M66 46 C86 30 120 30 140 50" stroke="#fff" strokeWidth="3" fill="none" opacity="0.2" strokeLinecap="round" />
        <rect x="150" y="76" width="14" height="22" rx="5" fill="#E8B33E" stroke="#8A6A1E" strokeWidth="1.6" transform="rotate(-14 157 87)" />
      </g>
    );
  }
  return back ? null : (
    <g fill={g} stroke={ol} strokeWidth="1.6">
      <path d="M40 104 C28 84 34 62 48 62 C50 80 50 92 52 106 Z" /><path d="M160 104 C172 84 166 62 152 62 C150 80 150 92 148 106 Z" />
      <path d="M60 50 C80 34 120 34 140 50 C120 44 80 44 60 50 Z" opacity="0.7" />
    </g>
  );
};

/* ------------------------------- eyes ------------------------------- */
const Eye: React.FC<{ s: Spec; p: Pose; cx: number; closed: boolean }> = ({ s, p, cx, closed }) => {
  const inner = cx < 100 ? 1 : -1;
  const kind = p.eyes ?? "open";
  const cy = 128;
  if (closed) {
    return <path d={`M${cx - 15} ${cy + 2} Q${cx} ${cy + 14} ${cx + 15} ${cy + 2}`} stroke="#1A1412" strokeWidth="4.5" fill="none" strokeLinecap="round" />;
  }
  const ry = kind === "wide" ? 15 : kind === "down" ? 10 : 12;
  const lid = clamp01(p.lid ?? 0);
  const tilt = p.lidTilt ?? 0;
  const lx = (p.lookX ?? 0) * 5.5, ly = (p.lookY ?? 0) * 4 + (kind === "down" ? 4 : 0);
  const pup = p.pupil ?? (kind === "wide" ? 0.8 : 1);
  const id = `${s.id}-ec${cx}`;
  const yo = cy - ry + lid * ry * 1.7 + Math.max(0, tilt) * -2;
  const yi = yo + -tilt * 10;
  const xo = cx - inner * 19, xi = cx + inner * 19;
  const top = cy - ry - 14;
  return (
    <g>
      <clipPath id={id}><ellipse cx={cx} cy={cy} rx="15.5" ry={ry} /></clipPath>
      <ellipse cx={cx} cy={cy} rx="15.5" ry={ry} fill="#FBFBF8" stroke="#3A2A24" strokeWidth="2" />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx + lx} cy={cy + ly} r="9.2" fill="#4A2E1F" />
        <circle cx={cx + lx} cy={cy + ly} r="9.2" fill="none" stroke="#1E120C" strokeWidth="1.6" />
        <circle cx={cx + lx} cy={cy + ly} r={4.8 * pup + 0.4} fill="#0B0706" />
        <circle cx={cx + lx - 3.6} cy={cy + ly - 3.8} r="2.8" fill="#fff" /><circle cx={cx + lx + 3} cy={cy + ly + 3.2} r="1.3" fill="#fff" opacity="0.8" />
      </g>
      <path d={`M${xo} ${top} L${xi} ${top} L${xi} ${yi} L${xo} ${yo} Z`} fill={s.skin} />
      <path d={`M${xo} ${yo} Q${cx} ${(yo + yi) / 2 - 3} ${xi} ${yi}`} stroke="#241713" strokeWidth="4.6" fill="none" strokeLinecap="round" />
      <path d={`M${cx - 14} ${cy + ry + 3} Q${cx} ${cy + ry + 7} ${cx + 14} ${cy + ry + 3}`} stroke={shade(s.skin, -0.3)} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
      {s.wrinkles && <path d={`M${cx - 15} ${cy + ry + 10} Q${cx} ${cy + ry + 16} ${cx + 15} ${cy + ry + 10}`} stroke={shade(s.skin, -0.35)} strokeWidth="2.4" fill="none" opacity="0.55" strokeLinecap="round" />}
    </g>
  );
};

const MouthShape: React.FC<{ m: Mouth; open: number; t: string; skin: string }> = ({ m, open, t, skin }) => {
  const lip = "#9C4A3C", dark = "#4E1C18", tongue = "#E27D70";
  switch (m) {
    case "open":
      return (
        <g>
          <path d={`M${84 - open * 2} 184 Q100 ${180 - open * 2} ${116 + open * 2} 184 Q${114 + open * 3} ${190 + open * 22} 100 ${192 + open * 22} Q${86 - open * 3} ${190 + open * 22} ${84 - open * 2} 184 Z`} fill={dark} stroke={lip} strokeWidth="3" strokeLinejoin="round" />
          {open > 0.3 && <path d={`M88 185 Q100 182 112 185 L111 ${190 + open * 3} Q100 ${188 + open * 3} 89 ${190 + open * 3} Z`} fill="#fff" />}
          <ellipse cx="100" cy={190 + open * 18} rx={8 + open * 3} ry={3 + open * 4} fill={tongue} />
        </g>
      );
    case "shout":
      return (
        <g>
          <path d="M68 178 Q100 168 132 178 Q130 222 100 226 Q70 222 68 178 Z" fill={dark} stroke={lip} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M72 179 Q100 171 128 179 L127 192 Q100 186 73 192 Z" fill="#fff" />
          <path d="M84 176 V190 M100 173 V188 M116 176 V190" stroke="#C9C2B0" strokeWidth="1.6" />
          <ellipse cx="100" cy="214" rx="17" ry="8" fill={tongue} />
        </g>
      );
    case "grit":
      return (
        <g>
          <rect x="72" y="180" width="56" height="22" rx="9" fill="#fff" stroke={dark} strokeWidth="3.5" />
          <path d="M72 191 H128 M86 180 V202 M100 180 V202 M114 180 V202" stroke="#B9B2A0" strokeWidth="1.8" />
          <path d="M68 184 Q60 176 66 170 M132 184 Q140 176 134 170" stroke={shade(skin, -0.3)} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "o":
      return <g><ellipse cx="100" cy="192" rx="9" ry="11" fill={dark} stroke={lip} strokeWidth="3" /><ellipse cx="100" cy="198" rx="5" ry="4" fill={tongue} /></g>;
    case "grin":
      return (
        <g>
          <path d="M72 177 Q100 220 128 177 Z" fill={dark} stroke={lip} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M77 178 Q100 190 123 178 L121 185 Q100 195 79 185 Z" fill="#fff" />
          <path d="M84 206 Q100 196 116 206 Q100 214 84 206 Z" fill={tongue} />
        </g>
      );
    case "sad":
      return <path d="M82 194 Q100 180 118 194" stroke={t} strokeWidth="4.5" fill="none" strokeLinecap="round" />;
    case "frown":
      return <g><path d="M78 196 Q100 176 122 196" stroke={t} strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M76 197 q-2 -6 -8 -8 M124 197 q2 -6 8 -8" stroke={shade(skin, -0.28)} strokeWidth="3" fill="none" strokeLinecap="round" /></g>;
    case "flat":
      return <path d="M84 187 L116 187" stroke={t} strokeWidth="4.5" strokeLinecap="round" />;
    case "wavy":
      return <path d="M80 190 q5 -9 10 0 t10 0 t10 0 t10 0" stroke={t} strokeWidth="4.2" fill="none" strokeLinecap="round" />;
    case "smirk":
      return <path d="M84 190 Q100 190 118 180" stroke={t} strokeWidth="4.5" fill="none" strokeLinecap="round" />;
    default:
      return (
        <g>
          <path d="M80 182 Q100 199 120 182" stroke={t} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M80 182 q-5 -3 -6 -9 M120 182 q5 -3 6 -9" stroke={shade(skin, -0.25)} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      );
  }
};

const Head: React.FC<{ s: Spec; p: Pose }> = ({ s, p }) => {
  const open = p.open ?? 0;
  const closed = !!p.blink || p.eyes === "closed";
  const brow = (p.brow ?? 0) * -9;
  const tilt = (p.browTilt ?? 0) * 18;
  const mouth = p.mouth ?? "smile";
  const faceClip = `${s.id}-face`;
  const pale = clamp01(p.pale ?? 0), blush = clamp01(p.blush ?? 0);
  const skinDark = shade(s.skin, -0.34);
  const browCol = shade(s.hair, -0.1);
  const mouthCol = "#7A3B2E";
  return (
    <g>
      <clipPath id={faceClip}><path d={FACE} /></clipPath>
      <Hair s={s} back />
      <ellipse cx="38" cy="130" rx="13" ry="17" fill={`url(#${s.id}-skin)`} stroke={OL(s.skin)} strokeWidth="2" /><ellipse cx="162" cy="130" rx="13" ry="17" fill={`url(#${s.id}-skin)`} stroke={OL(s.skin)} strokeWidth="2" />
      <path d="M36 122 q-4 8 0 16 M164 122 q4 8 0 16" stroke={skinDark} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {s.earrings && <><circle cx="38" cy="150" r="3.6" fill={s.earrings} stroke="#8A6A1E" strokeWidth="1" /><circle cx="162" cy="150" r="3.6" fill={s.earrings} stroke="#8A6A1E" strokeWidth="1" /></>}
      <path d={FACE} fill={`url(#${s.id}-skin)`} stroke={OL(s.skin)} strokeWidth="2.6" strokeLinejoin="round" />
      <g clipPath={`url(#${faceClip})`}>
        <path d="M118 30 C150 50 168 100 160 140 C150 176 126 204 100 224 L138 224 L176 140 L176 20 Z" fill="#7A4A30" opacity="0.14" />
        <ellipse cx="100" cy="64" rx="70" ry="22" fill="#000" opacity="0.1" />
        {pale > 0 && <rect x="30" y="20" width="140" height="210" fill="#C9E0F5" opacity={pale * 0.34} />}
        <ellipse cx="62" cy="168" rx="15" ry="9" fill="#E8685C" opacity={0.28 + blush * 0.5} /><ellipse cx="138" cy="168" rx="15" ry="9" fill="#E8685C" opacity={0.28 + blush * 0.5} />
      </g>
      <path d="M97 120 Q94 142 88 152" stroke={skinDark} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M90 154 C92 162 108 162 110 154" stroke={skinDark} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <ellipse cx="102" cy="148" rx="6" ry="3.6" fill="#fff" opacity="0.28" />
      {s.bindi && <circle cx="100" cy="88" r="3.6" fill="#B3262E" />}
      {s.mustache && <path d="M62 170 C72 156 92 156 100 164 C108 156 128 156 138 170 C128 176 112 172 100 170 C88 172 72 176 62 170 Z" fill={`url(#${s.id}-hair)`} stroke={OL(s.hair)} strokeWidth="1.4" />}
      {s.wrinkles && <g stroke={skinDark} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.5"><path d="M56 160 Q52 176 58 190" /><path d="M144 160 Q148 176 142 190" /><path d="M70 90 Q100 84 130 90" opacity={0.6} /></g>}
      <Hair s={s} back={false} />
      {/* brows (tapered shapes) */}
      <g fill={browCol} stroke={browCol} strokeWidth="2" strokeLinejoin="round">
        <path d="M52 106 Q70 96 90 104 Q70 101 54 111 Z" transform={`translate(0 ${brow}) rotate(${-tilt} 71 104)`} />
        <path d="M110 104 Q130 96 148 106 Q130 101 106 111 Z" transform={`translate(0 ${brow}) rotate(${tilt} 129 104)`} />
      </g>
      <Eye s={s} p={p} cx={70} closed={closed} /><Eye s={s} p={p} cx={130} closed={closed} />
      <MouthShape m={mouth} open={open} t={mouthCol} skin={s.skin} />
      {s.glasses === "round" && (
        <g stroke={s.glassColor ?? "#25324D"} strokeWidth="4.5" fill="none" strokeLinecap="round">
          <rect x="46" y="108" width="48" height="40" rx="15" fill="#CFE6FF" fillOpacity="0.16" /><rect x="106" y="108" width="48" height="40" rx="15" fill="#CFE6FF" fillOpacity="0.16" />
          <path d="M94 124 Q100 117 106 124" /><path d="M46 124 L36 126 M154 124 L164 126" />
          <path d="M55 140 L66 118 M115 140 L126 118" stroke="#fff" strokeWidth="3" opacity="0.5" />
        </g>
      )}
      {(p.vein ?? 0) > 0 && (
        <g transform={`translate(138 62) scale(${0.6 + 0.5 * (p.vein ?? 0)})`} stroke="#E0342B" strokeWidth="6" fill="none" strokeLinecap="round" opacity={clamp01((p.vein ?? 0) * 2)}>
          <path d="M-14 -14 Q-4 -8 -8 4 M14 -14 Q4 -8 8 4 M-14 14 Q-4 8 -8 -4 M14 14 Q4 8 8 -4" />
        </g>
      )}
      {(p.tear ?? 0) > 0 && (
        <g opacity={clamp01(p.tear ?? 0)}>
          <ellipse cx="70" cy="152" rx="15" ry="4" fill="#9FD3FF" opacity="0.7" />
          <path d={`M60 150 C56 ${158 + (p.tear ?? 0) * 10} 60 ${164 + (p.tear ?? 0) * 12} 64 ${160 + (p.tear ?? 0) * 12} C68 ${156 + (p.tear ?? 0) * 8} 64 152 60 150 Z`} fill="#BFE3FF" stroke="#5BA6E6" strokeWidth="1.6" />
        </g>
      )}
      {(p.sweat ?? 0) > 0 && (
        <path d="M168 84 C178 100 182 108 176 116 C170 122 160 116 162 108 C163 100 166 94 168 84 Z" fill="#9FD3FF" stroke="#5BA6E6" strokeWidth="2" opacity={p.sweat} transform={`translate(0 ${(1 - (p.sweat ?? 0)) * -10})`} />
      )}
    </g>
  );
};

/* ------------------------------- body ------------------------------- */
const TORSO: Record<Spec["topStyle"], string> = {
  tee: "M130 236 C108 238 92 242 86 254 C82 262 86 300 94 340 C98 366 100 392 98 410 L202 410 C200 392 202 366 206 340 C214 300 218 262 214 254 C208 242 192 238 170 236 Z",
  shirt: "M130 236 C108 238 90 244 88 256 L80 340 C78 374 86 406 100 412 L200 412 C214 406 222 374 220 340 L212 256 C210 244 192 238 170 236 Z",
  check: "M130 236 C108 238 92 244 90 256 L82 340 C80 374 88 408 100 414 L200 414 C212 408 220 374 218 340 L210 256 C208 244 192 238 170 236 Z",
  kurta: "M130 236 C110 238 96 244 94 256 L92 330 L80 470 L68 556 L120 566 L150 548 L180 566 L232 556 L220 470 L208 330 L206 256 C204 244 190 238 170 236 Z",
};

const Hand: React.FC<{ s: Spec; kind: "open" | "fist" | "point" }> = ({ s, kind }) => {
  const f = `url(#${s.id}-skin)`, o = OL(s.skin);
  if (kind === "fist")
    return (<g><rect x="66" y="388" width="26" height="24" rx="9" fill={f} stroke={o} strokeWidth="2" /><path d="M70 398 H88 M72 405 H86" stroke={o} strokeWidth="1.6" opacity="0.6" /><ellipse cx="94" cy="394" rx="6" ry="9" fill={f} stroke={o} strokeWidth="2" /></g>);
  if (kind === "point")
    return (<g><circle cx="79" cy="398" r="13" fill={f} stroke={o} strokeWidth="2" /><rect x="74" y="402" width="11" height="40" rx="5.5" fill={f} stroke={o} strokeWidth="2" /><ellipse cx="94" cy="396" rx="6" ry="8" fill={f} stroke={o} strokeWidth="2" /></g>);
  return (<g><circle cx="79" cy="398" r="13" fill={f} stroke={o} strokeWidth="2" /><ellipse cx="93" cy="396" rx="6" ry="9" fill={f} stroke={o} strokeWidth="2" transform="rotate(-20 93 396)" /><path d="M72 408 q7 5 14 0" stroke={o} strokeWidth="1.6" fill="none" opacity="0.6" /></g>);
};

const Arm: React.FC<{ s: Spec; angle: number; fore: number; hand: "open" | "fist" | "point"; held?: React.ReactNode }> = ({ s, angle, fore, hand, held }) => {
  const sleeve = s.sleeve ?? (s.longSleeve || s.topStyle === "kurta" ? "long" : "short");
  const topFill = `url(#${s.id}-top)`;
  const skinFill = `url(#${s.id}-skin)`;
  const o = OL(s.top), os = OL(s.skin);
  const cover = sleeve === "long" ? 66 : sleeve === "three4" ? 36 : 0;      // how far the forearm cloth reaches (px of 68)
  return (
    <g transform={`translate(102 252) rotate(${angle}) translate(-102 -252)`}>
      <path d="M100 242 C84 248 72 278 68 316 L98 326 C100 296 108 274 118 252 Z" fill={topFill} stroke={o} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M72 300 q10 -6 22 -2" stroke={shade(s.top, -0.35)} strokeWidth="2.4" fill="none" opacity="0.5" strokeLinecap="round" />
      <g transform={`translate(82 322) rotate(${-fore}) translate(-82 -322)`}>
        <path d="M67 322 L97 332 C95 360 93 378 92 392 L66 388 C66 362 66 342 67 322 Z" fill={skinFill} stroke={os} strokeWidth="2.4" strokeLinejoin="round" />
        {cover > 0 && <path d={`M67 322 L97 332 C96 ${332 + cover * 0.55} 94 ${332 + cover * 0.75} 93 ${322 + cover} L66 ${318 + cover} C66 ${338 + cover * 0.3} 66 ${330} 67 322 Z`} fill={topFill} stroke={o} strokeWidth="2.4" strokeLinejoin="round" />}
        {cover > 0 && <path d={`M66 ${318 + cover} L93 ${322 + cover}`} stroke={shade(s.top, -0.4)} strokeWidth="4" strokeLinecap="round" />}
        <Hand s={s} kind={hand} />
        {held && <g transform="translate(79 398)">{held}</g>}
      </g>
    </g>
  );
};

/** Leg with hip + knee. The thigh swings about the hip; the shin bends about the knee. */
const Leg: React.FC<{ s: Spec; angle: number; knee: number }> = ({ s, angle, knee }) => {
  const w = s.slim ? 0.84 : 1;
  const o = OL(s.bottom);
  const hip = 127;
  const L = (x: number) => hip + (x - hip) * w;
  return (
    <g transform={`translate(${hip} 404) rotate(${angle}) translate(${-hip} -404)`}>
      <path d={`M${L(100)} 402 L${L(152)} 402 L${L(148)} 524 L${L(106)} 524 Z`} fill={`url(#${s.id}-bot)`} stroke={o} strokeWidth="2.6" strokeLinejoin="round" />
      <g transform={`translate(${hip} 524) rotate(${-knee}) translate(${-hip} -524)`}>
        <path d={`M${L(105)} 520 L${L(149)} 520 L${L(144)} 670 L${L(112)} 670 Z`} fill={`url(#${s.id}-bot)`} stroke={o} strokeWidth="2.6" strokeLinejoin="round" />
        <path d={`M${L(108)} 666 L${L(146)} 666 L${L(152)} 676 C${L(156)} 690 ${L(98)} 694 ${L(86)} 686 C${L(84)} 678 ${L(98)} 672 ${L(108)} 666 Z`} fill={`url(#${s.id}-shoe)`} stroke={OL(s.shoes)} strokeWidth="2.6" strokeLinejoin="round" />
        <path d={`M${L(86)} 684 C${L(98)} 698 ${L(156)} 694 ${L(154)} 684 L${L(154)} 690 C${L(154)} 700 ${L(92)} 702 ${L(85)} 692 Z`} fill="url(#white-sole)" stroke="#8D95A6" strokeWidth="1.6" />
      </g>
    </g>
  );
};

export const Person: React.FC<{
  spec: Spec; x: number; y: number; scale?: number; flip?: boolean; pose?: Pose; hideLegs?: boolean; heldL?: React.ReactNode; heldR?: React.ReactNode; opacity?: number;
}> = ({ spec: s, x, y, scale = 1, flip = false, pose = {}, hideLegs = false, heldL, heldR, opacity = 1 }) => {
  const p = pose;
  const kurta = s.topStyle === "kurta";
  const wide = 1 + (s.belly ?? 0) * 0.14;
  const lean = p.lean ?? 0;
  const bob = p.bob ?? 0;
  const gl = p.glow ?? 0;
  const topO = OL(s.top);
  const shk = p.shake ?? 0;
  const jx = shk ? Math.sin((p.bob ?? 0) * 7 + shk * 91) * shk : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale}) translate(-150 ${-FEET})`} opacity={opacity}>
      <defs>
        <Grad id={`${s.id}-skin`} c={s.skin} /><Grad id={`${s.id}-hair`} c={s.hair} /><Grad id={`${s.id}-top`} c={s.top} />
        <Grad id={`${s.id}-bot`} c={s.bottom} /><Grad id={`${s.id}-shoe`} c={s.shoes} />
        <linearGradient id="white-sole" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#C6CCD8" /></linearGradient>
        <radialGradient id={`${s.id}-glow`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFE9A8" stopOpacity="0.9" /><stop offset="1" stopColor="#FFE9A8" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="150" cy={FEET + 2} rx="112" ry="13" fill="#000" opacity="0.2" />
      <ellipse cx="150" cy={FEET + 2} rx="70" ry="8" fill="#000" opacity="0.16" />
      {gl > 0 && <circle cx="150" cy="260" r={330} fill={`url(#${s.id}-glow)`} opacity={gl} />}
      {!hideLegs && (
        <g>
          <Leg s={s} angle={p.legL ?? 0} knee={p.kneeL ?? 0} />
          <g transform="translate(300 0) scale(-1 1)"><Leg s={s} angle={p.legR ?? 0} knee={p.kneeR ?? 0} /></g>
        </g>
      )}
      <g transform={`translate(0 ${bob}) rotate(${lean} 150 404)`}>
        <g transform={`translate(150 0) scale(${wide} 1) translate(-150 0)`}>
          {s.dupatta && <path d="M104 238 C90 270 92 330 100 430 L120 430 C116 340 116 280 132 240 Z" fill={s.dupatta} opacity="0.95" />}
          <path d="M130 200 L170 200 L172 250 L128 250 Z" fill={shade(s.skin, -0.14)} stroke={OL(s.skin)} strokeWidth="2" />
          <ellipse cx="150" cy="230" rx="30" ry="10" fill="#6A3E28" opacity="0.3" />
          <path d={TORSO[s.topStyle]} fill={`url(#${s.id}-top)`} stroke={topO} strokeWidth="3" strokeLinejoin="round" />
          {/* cel shadow on the lit-away side + folds */}
          <path d={kurta ? "M176 240 L206 256 L208 330 L220 470 L232 556 L186 566 L176 480 L182 330 Z" : "M178 238 L212 256 L218 340 C220 374 214 404 202 412 L184 412 C192 370 190 320 178 238 Z"} fill="#000" opacity="0.15" />
          <g fill="none" stroke={shade(s.top, -0.4)} strokeWidth="2.6" strokeLinecap="round" opacity="0.5">
            <path d="M104 300 q8 14 4 34" /><path d="M196 300 q-8 14 -4 34" /><path d="M120 370 q14 8 30 4" />
            {kurta && <path d="M110 470 q4 30 -2 70 M190 470 q-4 30 2 70" />}
          </g>
          {s.topStyle === "check" && (
            <g clipPath={`url(#${s.id}-clip)`} opacity="0.35" stroke={s.topAccent ?? "#fff"} strokeWidth="4">
              {Array.from({ length: 9 }).map((_, i) => <path key={"v" + i} d={`M${86 + i * 16} 232 V420`} />)}
              {Array.from({ length: 11 }).map((_, i) => <path key={"h" + i} d={`M70 ${250 + i * 18} H235`} />)}
            </g>
          )}
          {s.topStyle === "check" && <clipPath id={`${s.id}-clip`}><path d={TORSO.check} /></clipPath>}
          {kurta ? (
            <g>
              {/* mandarin collar, placket with buttons, hem trim */}
              <path d="M128 236 C140 252 160 252 172 236 L172 246 C160 262 140 262 128 246 Z" fill={shade(s.top, 0.12)} stroke={topO} strokeWidth="2" />
              <path d="M150 256 V440" stroke={shade(s.top, -0.35)} strokeWidth="3" />
              {[286, 330, 374].map((yy) => <circle key={yy} cx="150" cy={yy} r="4.5" fill="#F4EAD2" stroke={shade(s.top, -0.5)} strokeWidth="1.6" />)}
              <path d="M70 548 L232 548" stroke="#F4EAD2" strokeWidth="6" opacity="0.8" /><path d="M70 556 L232 556" stroke="#F4EAD2" strokeWidth="2" opacity="0.8" strokeDasharray="8 6" />
              <path d="M132 238 C138 252 162 252 168 238" fill="none" stroke="#F4EAD2" strokeWidth="2.4" opacity="0.8" />
            </g>
          ) : (
            <>
              <path d="M134 234 C138 258 162 258 166 234 Z" fill={shade(s.skin, -0.14)} />
              <path d="M133 234 C138 260 162 260 167 234" fill="none" stroke={shade(s.top, -0.35)} strokeWidth="5" strokeLinecap="round" />
            </>
          )}
          {s.topStyle === "shirt" && <rect x="98" y="396" width="104" height="14" rx="3" fill="#2A2018" />}
          {s.topStyle === "shirt" && <rect x="143" y="398" width="14" height="10" rx="2" fill="#C9A24A" />}
          {s.topStyle === "shirt" && <path d="M150 262 V396" stroke={shade(s.top, -0.35)} strokeWidth="2.4" />}
          <ellipse cx="118" cy="258" rx="22" ry="8" fill="#fff" opacity="0.2" transform="rotate(-12 118 258)" />
        </g>
        <Arm s={s} angle={p.armL ?? 0} fore={p.foreL ?? 0} hand={p.handL ?? "open"} held={heldL} />
        <g transform="translate(300 0) scale(-1 1)"><Arm s={s} angle={p.armR ?? 0} fore={p.foreR ?? 0} hand={p.handR ?? "open"} held={heldR ? <g transform="scale(-1 1)">{heldR}</g> : undefined} /></g>
        <g transform={`translate(${50 + (p.headDx ?? 0) + jx} ${p.headDy ?? 0}) rotate(${p.headRot ?? 0} 100 222) translate(100 222) scale(0.88) translate(-100 -222)`}>
          <Head s={s} p={p} />
        </g>
      </g>
    </g>
  );
};

/* ------------------------------- cast ------------------------------- */
export const KIMU: Spec = {
  id: "kimu", skin: "#E2B38C", hair: "#2D1F1B", hairStyle: "curly", glasses: "round",
  top: "#2F6FD6", topStyle: "tee", bottom: "#27406B", shoes: "#1F56B8", sleeve: "short",
};
export const DAD: Spec = {
  id: "dad", skin: "#C9936A", hair: "#16110F", hairStyle: "short", glasses: "none", mustache: true, wrinkles: true,
  top: "#B9A58A", topStyle: "shirt", longSleeve: true, sleeve: "long", bottom: "#3A3A44", shoes: "#4A3526", belly: 0.8,
};
/** Mom: a modern metro-city look. Straight knee-length cotton kurta with mandarin collar and 3/4 sleeves, slim cream trousers, neat ponytail, small studs. */
export const MOM: Spec = {
  id: "mom", skin: "#D9A57C", hair: "#1B1210", hairStyle: "pony", glasses: "none", bindi: true, earrings: "#F0C15A",
  top: "#2E7D7A", topStyle: "kurta", sleeve: "three4", bottom: "#EDE3CF", shoes: "#7A5A44", slim: true,
};
export const UNCLE: Spec = {
  id: "uncle", skin: "#BF8A62", hair: "#B8B8B8", hairStyle: "grey", glasses: "round", glassColor: "#3A2A1F", mustache: true, wrinkles: true,
  top: "#7BA37B", topStyle: "check", topAccent: "#ffffff", longSleeve: true, sleeve: "long", bottom: "#D8D2C2", shoes: "#5A4636", belly: 1,
};
