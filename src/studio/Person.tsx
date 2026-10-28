import React from "react";

/** Kimu Studio puppet rig. One generic person drawn in the Kimu character-sheet style (front view, flat shapes,
 *  top-left light, white shine spots). Cast members are just different `Spec`s. All motion comes from `Pose`. */

export type Spec = {
  id: string;
  skin: string; hair: string; hairStyle: "curly" | "short" | "bun" | "grey";
  glasses?: "round" | "none"; glassColor?: string;
  mustache?: boolean;
  top: string; topStyle: "tee" | "shirt" | "kurta" | "check"; longSleeve?: boolean; topAccent?: string;
  bottom: string; shoes: string;
  belly?: number;          // 0..1 extra width
  broad?: number;          // 0..1 shoulder width
  dupatta?: string;        // colour of a shoulder scarf
  bindi?: boolean;
};

export type Pose = {
  lean?: number; bob?: number; headRot?: number; headDx?: number;
  armL?: number; armR?: number; foreL?: number; foreR?: number;   // upper-arm swing and elbow bend, degrees (0 = hanging)
  legL?: number; legR?: number;
  mouth?: "smile" | "flat" | "sad" | "open" | "o" | "grin";
  open?: number;            // 0..1 mouth openness when talking
  brow?: number; browTilt?: number;
  eyes?: "open" | "closed" | "wide" | "down";
  lookX?: number;
  sweat?: number;
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

const FACE = "M100 24 C128 24 150 44 158 78 C164 100 168 118 160 140 C150 172 124 204 100 222 C76 204 50 172 40 140 C32 118 36 100 42 78 C50 44 72 24 100 24 Z";

const Grad: React.FC<{ id: string; c: string }> = ({ id, c }) => (
  <linearGradient id={id} x1="0.1" y1="0" x2="0.9" y2="1">
    <stop offset="0" stopColor={shade(c, 0.36)} /><stop offset="0.5" stopColor={c} /><stop offset="1" stopColor={shade(c, -0.32)} />
  </linearGradient>
);

/* ------------------------------- head ------------------------------- */
const Hair: React.FC<{ s: Spec; back: boolean }> = ({ s, back }) => {
  const g = `url(#${s.id}-hair)`;
  if (s.hairStyle === "curly") {
    return back ? (
      <g fill={g}>
        <circle cx="30" cy="78" r="24" /><circle cx="170" cy="78" r="24" /><circle cx="28" cy="108" r="17" /><circle cx="172" cy="108" r="17" />
        <circle cx="34" cy="52" r="20" /><circle cx="166" cy="52" r="20" /><circle cx="56" cy="34" r="26" /><circle cx="144" cy="34" r="26" /><circle cx="100" cy="20" r="30" />
      </g>
    ) : (
      <g>
        <g fill={g} stroke="rgba(0,0,0,0.28)" strokeWidth="1.3">
          <circle cx="48" cy="52" r="16" /><circle cx="152" cy="52" r="16" /><circle cx="72" cy="36" r="21" /><circle cx="128" cy="36" r="21" /><circle cx="100" cy="26" r="23" />
          <circle cx="50" cy="74" r="13" /><circle cx="66" cy="62" r="16" /><circle cx="85" cy="56" r="16" /><circle cx="105" cy="54" r="17" /><circle cx="125" cy="57" r="16" /><circle cx="142" cy="63" r="16" /><circle cx="152" cy="76" r="13" />
          <circle cx="40" cy="94" r="12" /><circle cx="160" cy="94" r="12" />
        </g>
        <g fill="none" stroke="#000" strokeWidth="2.4" strokeLinecap="round" opacity="0.3">
          <path d="M58 66 q6 -10 14 -2" /><path d="M94 46 q8 -10 16 0" /><path d="M130 60 q6 -10 14 -2" /><path d="M78 72 q6 -6 12 0" /><path d="M60 30 q8 -8 16 0" /><path d="M124 28 q8 -8 16 0" />
        </g>
        <g fill="#fff" opacity="0.16"><ellipse cx="84" cy="30" rx="14" ry="5" transform="rotate(-16 84 30)" /><ellipse cx="124" cy="34" rx="10" ry="4" transform="rotate(14 124 34)" /></g>
      </g>
    );
  }
  if (s.hairStyle === "short") {
    return back ? null : (
      <g>
        <path d="M38 96 C30 44 66 18 100 18 C134 18 170 44 162 96 C160 78 150 64 138 58 C120 50 80 50 62 58 C50 64 40 78 38 96 Z" fill={g} stroke="rgba(0,0,0,0.25)" strokeWidth="1.4" />
        <ellipse cx="80" cy="34" rx="20" ry="7" fill="#fff" opacity="0.14" transform="rotate(-14 80 34)" />
      </g>
    );
  }
  if (s.hairStyle === "bun") {
    return back ? (
      <g fill={g}><ellipse cx="100" cy="86" rx="64" ry="72" /><circle cx="100" cy="6" r="24" /></g>
    ) : (
      <g>
        <path d="M40 100 C30 40 70 16 100 16 C130 16 170 40 160 100 C156 70 140 52 100 52 C60 52 44 70 40 100 Z" fill={g} stroke="rgba(0,0,0,0.22)" strokeWidth="1.3" />
        <path d="M100 18 C96 34 84 46 66 54" stroke="#000" strokeWidth="2.4" fill="none" opacity="0.25" strokeLinecap="round" />
        <ellipse cx="82" cy="30" rx="18" ry="6" fill="#fff" opacity="0.16" transform="rotate(-16 82 30)" />
      </g>
    );
  }
  // grey: side tufts only (bald top)
  return back ? null : (
    <g fill={g}>
      <path d="M40 104 C28 84 34 62 48 62 C50 80 50 92 52 106 Z" /><path d="M160 104 C172 84 166 62 152 62 C150 80 150 92 148 106 Z" />
      <path d="M60 50 C80 34 120 34 140 50 C120 44 80 44 60 50 Z" opacity="0.7" />
    </g>
  );
};

const Head: React.FC<{ s: Spec; p: Pose }> = ({ s, p }) => {
  const open = p.open ?? 0;
  const eyes = p.blink ? "closed" : p.eyes ?? "open";
  const lx = (p.lookX ?? 0) * 5;
  const brow = (p.brow ?? 0) * -8;
  const tilt = (p.browTilt ?? 0) * 16;
  const mouth = p.mouth ?? "smile";
  return (
    <g>
      <Hair s={s} back />
      <ellipse cx="38" cy="130" rx="13" ry="17" fill={`url(#${s.id}-skin)`} /><ellipse cx="162" cy="130" rx="13" ry="17" fill={`url(#${s.id}-skin)`} />
      <ellipse cx="38" cy="132" rx="6" ry="9" fill="#8A5A3C" opacity="0.28" /><ellipse cx="162" cy="132" rx="6" ry="9" fill="#8A5A3C" opacity="0.28" />
      <path d={FACE} fill={`url(#${s.id}-skin)`} />
      <ellipse cx="64" cy="166" rx="13" ry="8" fill="#E58C6F" opacity="0.35" /><ellipse cx="136" cy="166" rx="13" ry="8" fill="#E58C6F" opacity="0.35" />
      <path d="M94 152 C94 160 106 160 106 152" stroke="#B07A55" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="100" cy="149" rx="7" ry="4" fill="#fff" opacity="0.3" />
      {s.bindi && <circle cx="100" cy="86" r="4.5" fill="#B3262E" />}
      {s.mustache && <path d="M64 168 C74 156 92 156 100 164 C108 156 126 156 136 168 C126 172 112 170 100 168 C88 170 74 172 64 168 Z" fill={`url(#${s.id}-hair)`} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />}
      <Hair s={s} back={false} />
      {/* brows */}
      <g stroke={shade(s.hair, -0.1)} strokeWidth="5.5" fill="none" strokeLinecap="round">
        <path d="M54 104 Q70 97 88 103" transform={`translate(0 ${brow}) rotate(${-tilt} 71 101)`} />
        <path d="M112 103 Q130 97 146 104" transform={`translate(0 ${brow}) rotate(${tilt} 129 101)`} />
      </g>
      {/* eyes */}
      {eyes === "closed" ? (
        <g stroke="#1A1412" strokeWidth="4.5" fill="none" strokeLinecap="round"><path d="M58 130 Q70 140 82 130" /><path d="M118 130 Q130 140 142 130" /></g>
      ) : (
        <g>
          {[70, 130].map((cx) => {
            const wide = eyes === "wide";
            const ry = wide ? 10.5 : eyes === "down" ? 6 : 8.5;
            return (
              <g key={cx}>
                <ellipse cx={cx + lx} cy={eyes === "down" ? 134 : 128} rx={wide ? 8 : 6.5} ry={ry} fill="#1A1412" />
                <circle cx={cx + lx - 2} cy={eyes === "down" ? 131 : 125} r="2.4" fill="#fff" />
              </g>
            );
          })}
        </g>
      )}
      {/* mouth */}
      {mouth === "open" ? (
        <g><ellipse cx="100" cy="188" rx={13 + open * 3} ry={3 + open * 15} fill="#6B2A22" /><ellipse cx="100" cy={188 + open * 9} rx={8} ry={2 + open * 5} fill="#E8776A" /></g>
      ) : mouth === "o" ? (
        <ellipse cx="100" cy="190" rx="8" ry="10" fill="#6B2A22" />
      ) : mouth === "grin" ? (
        <g><path d="M74 178 Q100 214 126 178 Z" fill="#6B2A22" /><path d="M80 179 Q100 188 120 179 Q100 184 80 179 Z" fill="#fff" /></g>
      ) : mouth === "sad" ? (
        <path d="M82 192 Q100 178 118 192" stroke="#7A3B2E" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      ) : mouth === "flat" ? (
        <path d="M84 186 L116 186" stroke="#7A3B2E" strokeWidth="4.5" strokeLinecap="round" />
      ) : (
        <path d="M80 182 Q100 198 120 182" stroke="#7A3B2E" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      )}
      {s.glasses === "round" && (
        <g stroke={s.glassColor ?? "#25324D"} strokeWidth="4.5" fill="none" strokeLinecap="round">
          <rect x="48" y="110" width="44" height="36" rx="14" fill="#CFE6FF" fillOpacity="0.2" /><rect x="108" y="110" width="44" height="36" rx="14" fill="#CFE6FF" fillOpacity="0.2" />
          <path d="M92 124 Q100 117 108 124" /><path d="M48 124 L38 126 M152 124 L162 126" />
          <path d="M57 138 L68 118 M117 138 L128 118" stroke="#fff" strokeWidth="3" opacity="0.5" />
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
  tee: "M96 244 C96 236 116 232 136 234 L164 234 C184 232 204 236 204 244 L212 408 L88 408 Z",
  shirt: "M92 244 C92 236 116 232 136 234 L164 234 C184 232 208 236 208 244 L222 340 C224 374 214 406 200 410 L100 410 C86 406 76 374 78 340 Z",
  check: "M94 244 C94 236 116 232 136 234 L164 234 C184 232 206 236 206 244 L218 340 C220 374 212 408 200 412 L100 412 C88 408 80 374 82 340 Z",
  kurta: "M100 244 C100 236 118 232 136 234 L164 234 C182 232 200 236 200 244 L214 340 L226 520 L74 520 L86 340 Z",
};

const Arm: React.FC<{ s: Spec; angle: number; fore: number; held?: React.ReactNode }> = ({ s, angle, fore, held }) => {
  const long = s.longSleeve || s.topStyle === "kurta";
  const topFill = `url(#${s.id}-top)`;
  return (
    <g transform={`translate(102 252) rotate(${angle}) translate(-102 -252)`}>
      <path d="M98 244 C82 250 72 278 68 314 L98 324 C100 294 108 272 116 252 Z" fill={topFill} />
      <g transform={`translate(82 322) rotate(${-fore}) translate(-82 -322)`}>
        <path d="M67 322 L97 332 C95 360 93 378 92 390 L66 386 C66 362 66 342 67 322 Z" fill={long ? topFill : `url(#${s.id}-skin)`} />
        {long && <path d="M66 380 L92 384 L92 392 L66 388 Z" fill={shade(s.top, -0.35)} />}
        <circle cx="79" cy="398" r="13" fill={`url(#${s.id}-skin)`} />
        {held && <g transform="translate(79 398)">{held}</g>}
      </g>
    </g>
  );
};

const Leg: React.FC<{ s: Spec; angle: number }> = ({ s, angle }) => (
  <g transform={`translate(126 404) rotate(${angle}) translate(-126 -404)`}>
    <path d="M102 402 L150 402 L146 598 L110 598 Z" fill={`url(#${s.id}-bot)`} />
    <path d="M108 590 L148 590 L150 612 C150 626 92 626 88 616 C86 606 98 598 108 590 Z" fill={`url(#${s.id}-shoe)`} />
    <path d="M88 614 C92 630 150 630 150 614 L150 620 C150 634 90 634 87 622 Z" fill="url(#white-sole)" />
  </g>
);

export const Person: React.FC<{
  spec: Spec; x: number; y: number; scale?: number; flip?: boolean; pose?: Pose; hideLegs?: boolean; heldL?: React.ReactNode; heldR?: React.ReactNode; opacity?: number;
}> = ({ spec: s, x, y, scale = 1, flip = false, pose = {}, hideLegs = false, heldL, heldR, opacity = 1 }) => {
  const p = pose;
  const kurta = s.topStyle === "kurta";
  const wide = 1 + (s.belly ?? 0) * 0.14;
  const lean = p.lean ?? 0;
  const bob = p.bob ?? 0;
  const gl = p.glow ?? 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale}) translate(-150 -634)`} opacity={opacity}>
      <defs>
        <Grad id={`${s.id}-skin`} c={s.skin} /><Grad id={`${s.id}-hair`} c={s.hair} /><Grad id={`${s.id}-top`} c={s.top} />
        <Grad id={`${s.id}-bot`} c={s.bottom} /><Grad id={`${s.id}-shoe`} c={s.shoes} />
        <linearGradient id="white-sole" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#C6CCD8" /></linearGradient>
        <radialGradient id={`${s.id}-glow`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFE9A8" stopOpacity="0.9" /><stop offset="1" stopColor="#FFE9A8" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="150" cy="634" rx="104" ry="11" fill="#000" opacity="0.18" />
      {gl > 0 && <circle cx="150" cy="260" r={330} fill={`url(#${s.id}-glow)`} opacity={gl} />}
      {!hideLegs && (
        <g>
          <Leg s={s} angle={p.legL ?? 0} />
          <g transform="translate(300 0) scale(-1 1)"><Leg s={s} angle={p.legR ?? 0} /></g>
          {kurta && <path d="M104 512 L196 512 L190 596 L110 596 Z" fill={shade(s.bottom, 0.1)} opacity="0" />}
        </g>
      )}
      <g transform={`translate(0 ${bob}) rotate(${lean} 150 404)`}>
        <g transform={`translate(150 0) scale(${wide} 1) translate(-150 0)`}>
          {s.dupatta && <path d="M104 238 C90 270 92 330 100 430 L120 430 C116 340 116 280 132 240 Z" fill={s.dupatta} opacity="0.95" />}
          <path d="M132 204 L168 204 L170 248 L130 248 Z" fill={shade(s.skin, -0.14)} />
          <ellipse cx="150" cy="228" rx="28" ry="9" fill="#8A5A3C" opacity="0.28" />
          <path d={TORSO[s.topStyle]} fill={`url(#${s.id}-top)`} />
          {s.topStyle === "check" && (
            <g clipPath={`url(#${s.id}-clip)`} opacity="0.35" stroke={s.topAccent ?? "#fff"} strokeWidth="4">
              {Array.from({ length: 9 }).map((_, i) => <path key={"v" + i} d={`M${86 + i * 16} 232 V420`} />)}
              {Array.from({ length: 11 }).map((_, i) => <path key={"h" + i} d={`M70 ${250 + i * 18} H235`} />)}
            </g>
          )}
          {s.topStyle === "check" && <clipPath id={`${s.id}-clip`}><path d={TORSO.check} /></clipPath>}
          <path d="M134 233 C138 256 162 256 166 233 Z" fill={shade(s.skin, -0.14)} />
          <path d="M133 234 C138 258 162 258 167 234" fill="none" stroke={shade(s.top, -0.3)} strokeWidth="4.5" strokeLinecap="round" />
          {s.topStyle === "shirt" && <rect x="98" y="396" width="104" height="12" rx="3" fill="#2A2018" />}
          {s.topStyle === "shirt" && <rect x="143" y="398" width="14" height="8" rx="2" fill="#C9A24A" />}
          <ellipse cx="118" cy="256" rx="22" ry="8" fill="#fff" opacity="0.22" transform="rotate(-12 118 256)" />
        </g>
        <Arm s={s} angle={p.armL ?? 0} fore={p.foreL ?? 0} held={heldL} />
        <g transform="translate(300 0) scale(-1 1)"><Arm s={s} angle={p.armR ?? 0} fore={p.foreR ?? 0} held={heldR ? <g transform="scale(-1 1)">{heldR}</g> : undefined} /></g>
        <g transform={`translate(${50 + (p.headDx ?? 0)} 0) rotate(${p.headRot ?? 0} 100 222)`}>
          <Head s={s} p={p} />
        </g>
      </g>
    </g>
  );
};

/* ------------------------------- cast ------------------------------- */
export const KIMU: Spec = {
  id: "kimu", skin: "#E2B38C", hair: "#2D1F1B", hairStyle: "curly", glasses: "round",
  top: "#2F6FD6", topStyle: "tee", bottom: "#27406B", shoes: "#1F56B8",
};
export const DAD: Spec = {
  id: "dad", skin: "#C9936A", hair: "#16110F", hairStyle: "short", glasses: "none", mustache: true,
  top: "#B9A58A", topStyle: "shirt", longSleeve: true, bottom: "#3A3A44", shoes: "#4A3526", belly: 0.8,
};
export const MOM: Spec = {
  id: "mom", skin: "#D9A57C", hair: "#1B1210", hairStyle: "bun", glasses: "none", bindi: true,
  top: "#9C2F4A", topStyle: "kurta", bottom: "#E9DCC7", shoes: "#6B4A3A", dupatta: "#F0C15A",
};
export const UNCLE: Spec = {
  id: "uncle", skin: "#BF8A62", hair: "#B8B8B8", hairStyle: "grey", glasses: "round", glassColor: "#3A2A1F", mustache: true,
  top: "#7BA37B", topStyle: "check", topAccent: "#ffffff", longSleeve: true, bottom: "#D8D2C2", shoes: "#5A4636", belly: 1,
};
