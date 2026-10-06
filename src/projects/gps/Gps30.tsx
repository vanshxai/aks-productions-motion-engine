import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUTS, Cover, End, GpsShot, T } from "./scenes";

/** How It Works #10 — how GPS finds you. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Gps30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // amber flash when the circles collapse onto the phone (clock fixed, then the hero replay)
  const fl = Math.max(
    f >= 586 && f < 625 ? Math.min(1, Math.max(0, 1 - (f - 592) / 26)) * Math.min(1, (f - 586) / 6) : 0,
    f >= 664 && f < 700 ? Math.min(1, Math.max(0, 1 - (f - 668) / 24)) * Math.min(1, (f - 664) / 4) : 0,
  );
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 52.6%, rgba(255,181,71,${0.26 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><GpsShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      <Scan f={f} at={598} dur={12} />
      <HUD f={Math.max(f, 22)} total={T.total} ep="10" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/gps/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const GpsCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
