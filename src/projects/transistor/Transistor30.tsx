import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUTS, CrossSection, End, Hero, Hook, NotGate, Switch, T } from "./scenes";

/** How It Works #02 — "Billions of these run your phone" (the transistor). 30 s · 1080×1920 · 30 fps. */
export const Transistor30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const drop = f >= T.hero + 2 ? Math.max(0, 1 - (f - T.hero - 2) / 10) : 0;
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={f} flash={drop} />
      <Scene from={T.hook} dur={T.sw - T.hook + 6} inF={0} outF={8}><Hook /></Scene>
      <Scene from={T.sw} dur={T.xs - T.sw + 6}><Switch /></Scene>
      <Scene from={T.xs} dur={T.gate - T.xs + 6}><CrossSection /></Scene>
      <Scene from={T.gate} dur={T.hero - T.gate + 4} outF={4}><NotGate /></Scene>
      <Scene from={T.hero} dur={T.end - T.hero + 6} inF={4}><Hero /></Scene>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      {[T.sw, T.xs, T.gate, T.end].map((a) => <Scan key={a} f={f} at={a - 4} />)}
      <HUD f={f} total={T.total} ep="02" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/transistor/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
