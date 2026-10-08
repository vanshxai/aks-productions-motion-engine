import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUE, CUTS, Cover, End, PhoneShot, T } from "./scenes";

/** How It Works #14 — What's inside a smartphone. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Phone30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // soft amber flash when the phone pops apart, and when the chip powers up
  const fl = Math.max(
    f >= CUE.pop && f < CUE.pop + 24 ? Math.min(1, Math.max(0, 1 - (f - CUE.pop - 4) / 18)) * Math.min(1, (f - CUE.pop) / 3) : 0,
    f >= T.chip && f < T.chip + 24 ? Math.min(1, Math.max(0, 1 - (f - T.chip - 4) / 18)) * Math.min(1, (f - T.chip) / 3) * 0.7 : 0,
  );
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 55%, rgba(255,181,71,${0.16 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><PhoneShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      {CUTS.slice(1, -1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="14" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/phone/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const PhoneCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
