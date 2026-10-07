import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUTS, Cover, End, IceShot, T } from "./scenes";

/** How It Works #11 — why ice floats. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Ice30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // pale-ice flash on the hero beat ("Ice floats.") and when the crystal front snaps across the box
  const fl = Math.max(
    f >= 748 && f < 772 ? Math.min(1, Math.max(0, 1 - (f - 752) / 20)) * Math.min(1, (f - 748) / 4) : 0,
    f >= 216 && f < 250 ? Math.min(1, Math.max(0, 1 - (f - 222) / 22)) * Math.min(1, (f - 216) / 4) * 0.7 : 0,
  );
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 52.6%, rgba(205,235,255,${0.2 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><IceShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      {CUTS.slice(1, -1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="11" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/ice/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const IceCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
