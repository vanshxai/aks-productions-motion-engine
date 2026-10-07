import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUTS, Cover, End, AcDcShot, T } from "./scenes";

/** How It Works #12 — AC vs DC. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const AcDc30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // soft amber flash when the charger "translates" (hero beat) and on the rectifier click
  const fl = Math.max(
    f >= 754 && f < 780 ? Math.min(1, Math.max(0, 1 - (f - 758) / 20)) * Math.min(1, (f - 754) / 4) : 0,
    f >= 626 && f < 650 ? Math.min(1, Math.max(0, 1 - (f - 630) / 16)) * Math.min(1, (f - 626) / 3) * 0.6 : 0,
  );
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 52.6%, rgba(255,181,71,${0.16 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><AcDcShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      {CUTS.slice(1, -1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="12" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/acdc/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const AcDcCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
