import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUE, CUTS, Cover, End, SaturnShot, T } from "./scenes";

/** ROCKETS #01 — Inside the Saturn V: 3 stages. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Saturn30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const pulse = (a: number, len = 22) => (f >= a && f < a + len ? Math.min(1, Math.max(0, 1 - (f - a - 3) / (len - 6))) * Math.min(1, (f - a) / 3) : 0);
  // soft stage-coloured flash on every separation / ignition
  const fl = Math.max(pulse(CUE.split, 20) * 0.5, pulse(CUE.eng0, 16) * 0.5, pulse(CUE.drop1, 20) * 0.8, pulse(CUE.sii, 16) * 0.5, pulse(CUE.drop2, 20) * 0.8, pulse(CUE.b1, 14) * 0.5, pulse(CUE.b2, 16) * 0.6, pulse(CUE.fade, 20) * 0.6);
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 55%, rgba(255,181,71,${0.16 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><SaturnShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      {CUTS.slice(1, -1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="01" label="ROCKETS" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/saturn/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const SaturnCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
