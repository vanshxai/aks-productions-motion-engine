import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { BREAK_FRAME, CUTS, Cover, End, TacomaShot, T } from "./scenes";

/** How It Works #13 — Tacoma Narrows. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Tacoma30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // red flash when the middle of the road lets go (hero beat)
  const fl = f >= BREAK_FRAME && f < BREAK_FRAME + 26 ? Math.min(1, Math.max(0, 1 - (f - BREAK_FRAME - 4) / 20)) * Math.min(1, (f - BREAK_FRAME) / 3) : 0;
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 56%, rgba(255,90,95,${0.2 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><TacomaShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      {CUTS.slice(1, -1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="13" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/tacoma/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const TacomaCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
