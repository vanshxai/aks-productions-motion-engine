import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Grain } from "../../engine/Wipe";
import { Blueprint, EndTag, HUD, Scan } from "../gearbox/kit";
import { CUE, CUTS, ChenabShot, Cover, T } from "./scenes";

/** How It Works #16 — How the Chenab rail bridge was built. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook.
 *  House rule from #16 on: no end card. The final picture holds and a small AKS PRODUCTIONS tag fades in over the last second. */
export const Chenab30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const pulse = (a: number, len = 22) => (f >= a && f < a + len ? Math.min(1, Math.max(0, 1 - (f - a - 3) / (len - 6))) * Math.min(1, (f - a) / 3) : 0);
  // soft amber flash on the TALLER reveal, arch closure, deck join and the first train
  const fl = Math.max(pulse(CUE.taller, 16) * 0.5, pulse(CUE.close, 22), pulse(CUE.span, 14) * 0.5, pulse(CUE.join, 22) * 0.9, pulse(CUE.zone, 14) * 0.4, pulse(CUE.train, 20) * 0.6);
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 55%, rgba(255,181,71,${0.16 * fl}), transparent 70%)` }} />}
      <ChenabShot />
      {CUTS.slice(1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="16" cuts={CUTS} hold />
      <EndTag f={f} total={T.total} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/chenab/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const ChenabCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
