import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Grain } from "../../engine/Wipe";
import { Blueprint, EndTag, HUD, Scan } from "../gearbox/kit";
import { CUTS, Cover, T, WarmUpShot } from "./scenes";

/** How It Works #21 — Do you really need to warm up your car? 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. No end card; small AKS PRODUCTIONS tag in the last second. */
export const WarmUp30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      <WarmUpShot />
      {CUTS.slice(1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="21" cuts={CUTS} hold />
      <EndTag f={f} total={T.total} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/warmup/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const WarmUpCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
