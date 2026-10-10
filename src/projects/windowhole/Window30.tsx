import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Grain } from "../../engine/Wipe";
import { Blueprint, EndTag, HUD, Scan } from "../gearbox/kit";
import { CUE, CUTS, Cover, T, WindowShot } from "./scenes";

/** How It Works #18 — Why do airplane windows have a tiny hole? 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook (question + wireframe window panes + the hole).
 *  House rule: no end card. The final picture holds and a small AKS PRODUCTIONS tag fades in over the last second. */
export const WindowHole30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const pulse = (a: number, len = 22) => (f >= a && f < a + len ? Math.min(1, Math.max(0, 1 - (f - a - 3) / (len - 6))) * Math.min(1, (f - a) / 3) : 0);
  // soft amber flash on: the safe line, the push, the hole opening, the spare, the crack, the final line
  const fl = Math.max(pulse(CUE.safe, 18) * 0.5, pulse(CUE.push, 16) * 0.5, pulse(CUE.air, 16) * 0.4, pulse(CUE.spare, 16) * 0.4, pulse(CUE.fail, 16) * 0.5, pulse(CUE.know, 16) * 0.5);
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 55%, rgba(255,181,71,${0.16 * fl}), transparent 70%)` }} />}
      <WindowShot />
      {CUTS.slice(1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="18" cuts={CUTS} hold />
      <EndTag f={f} total={T.total} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/windowhole/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const WindowHoleCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
