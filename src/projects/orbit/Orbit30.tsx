import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUE, CUTS, Cover, End, OrbitShot, T } from "./scenes";

/** How It Works #15 — How rockets reach orbit. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Orbit30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const pulse = (a: number, len = 22) => (f >= a && f < a + len ? Math.min(1, Math.max(0, 1 - (f - a - 3) / (len - 6))) * Math.min(1, (f - a) / 3) : 0);
  // soft amber flash on every cannon shot, rocket ignition, stage drop and engine cut-off
  const fl = Math.max(pulse(CUE.throw, 14) * 0.5, pulse(CUE.fire1, 14) * 0.5, pulse(CUE.fire2, 14) * 0.5, pulse(CUE.fire3, 20), pulse(CUE.launch, 24) * 0.8, pulse(CUE.sep1, 16) * 0.8, pulse(CUE.sep2, 16) * 0.8, pulse(CUE.tag, 20) * 0.6);
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 55%, rgba(255,181,71,${0.16 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><OrbitShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      {CUTS.slice(1, -1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="15" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/orbit/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const OrbitCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
