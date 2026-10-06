import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUTS, Cover, End, LockShot, T } from "./scenes";

/** How It Works #09 — the pin-tumbler lock and key. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Lock30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // amber flash when every pin lands on the shear line (right key, then the hero replay)
  const fl = Math.max(
    f >= 494 && f < 530 ? Math.min(1, Math.max(0, 1 - (f - 497) / 24)) : 0,
    f >= 633 && f < 660 ? Math.min(1, Math.max(0, 1 - (f - 636) / 18)) : 0,
  );
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(70% 38% at 50% 40%, rgba(255,181,71,${0.2 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><LockShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      <Scan f={f} at={598} dur={12} />
      <HUD f={Math.max(f, 22)} total={T.total} ep="09" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/lock/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const LockCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
