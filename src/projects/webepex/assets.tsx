import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { assets } from "../../engine/ui";
import { C, rgba } from "../../engine/util";
import markData from "./mark.json";

export const A = assets("projects/webepex");
export const MARK = markData;
export const WORK = {
  ghostboard: A("assets/work/w1.png"), statsedge: A("assets/work/w2.png"), chainbox: A("assets/work/w3.png"), badbros: A("assets/work/w4.png"),
  idps: A("assets/work/w5.png"), cricket11: A("assets/work/w6.png"), hismile: A("assets/work/w7.png"), shiba: A("assets/work/w8.png"),
};
export const CLIENTS = Array.from({ length: 12 }, (_, i) => A(`assets/clients/${i + 1}.png`));

/** Wordmark "WEBEPEX" (514×198 crop of the real logo). */
export const Wordmark: React.FC<{ h: number; dark?: boolean; reveal?: number }> = ({ h, dark, reveal = 1 }) => (
  <Img src={A(dark ? "wordmark-b.png" : "wordmark-w.png")} style={{ height: h, width: (h * 514) / 198, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }} />
);

/** Cream paper background with a soft warm vignette. */
export const CreamBG: React.FC = () => (
  <AbsoluteFill style={{ background: C.light }}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255,255,255,0.55), transparent 70%), radial-gradient(ellipse 80% 60% at 50% 110%, ${rgba("#8B7D6F", 0.22)}, transparent 60%)` }} />
  </AbsoluteFill>
);

/** Espresso background with a warm gold glow from above. */
export const EspressoBG: React.FC<{ glow?: number }> = ({ glow = 1 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, #1A1410 0%, ${C.bg} 70%)` }}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% -8%, ${rgba(C.violet2, 0.28 * glow)}, transparent 70%)` }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 40% at 50% 110%, ${rgba(C.violet, 0.16 * glow)}, transparent 70%)` }} />
  </AbsoluteFill>
);
