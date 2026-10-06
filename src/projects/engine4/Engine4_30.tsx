import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUTS, Cover, CylinderShot, End, Hero, T } from "./scenes";

/** How It Works #05 — the 4-stroke engine. 30 s · 1080×1920 · 30 fps. Frame 0 is already a finished, readable hook. */
export const Engine4_30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const drop = f >= T.hero + 2 ? Math.max(0, 1 - (f - T.hero - 2) / 10) : 0;
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} flash={drop} />
      <Sequence from={0} durationInFrames={T.hero + 2}><CylinderShot /></Sequence>
      <Scene from={T.hero} dur={T.end - T.hero + 6} inF={6}><Hero /></Scene>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      <HUD f={Math.max(f, 22)} total={T.total} ep="05" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/engine4/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};

export const Engine4Cover: React.FC = () => {
  applyBrand(brand);
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={60} />
      <Cover />
      <Grain f={0} opacity={0.05} blend="overlay" />
    </AbsoluteFill>
  );
};
