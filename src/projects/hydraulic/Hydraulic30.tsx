import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUTS, Cover, End, HydraulicShot, T } from "./scenes";

/** How It Works #07 — Pascal's law / hydraulics. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Hydraulic30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const drop = f >= T.hero + 6 ? Math.max(0, 1 - (f - T.hero - 6) / 10) : 0;
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} flash={drop} />
      <Sequence from={0} durationInFrames={T.end + 4}><HydraulicShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      <HUD f={Math.max(f, 22)} total={T.total} ep="07" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/hydraulic/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const HydraulicCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
