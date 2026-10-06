import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { Bang, Blow, CUTS, End, EngineShot, Hero, Hook, Squeeze, Suck, T, Words } from "./scenes";

/** How It Works #03 — "Suck, squeeze, bang, blow" (the jet engine). 30 s · 1080×1920 · 30 fps. */
export const Jet30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const drop = f >= T.hero + 7 ? Math.max(0, 1 - (f - T.hero - 7) / 10) : 0;
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={f} flash={drop} />
      <Scene from={T.hook} dur={T.words - T.hook + 6} inF={0} outF={8}><Hook /></Scene>
      <Scene from={T.words} dur={T.end - T.words + 4} inF={12} outF={6}><EngineShot /></Scene>
      <Scene from={T.words} dur={T.suck - T.words + 4}><Words /></Scene>
      <Scene from={T.suck} dur={T.squeeze - T.suck + 4}><Suck /></Scene>
      <Scene from={T.squeeze} dur={T.bang - T.squeeze + 4}><Squeeze /></Scene>
      <Scene from={T.bang} dur={T.blow - T.bang + 4}><Bang /></Scene>
      <Scene from={T.blow} dur={T.hero - T.blow + 4}><Blow /></Scene>
      <Scene from={T.hero} dur={T.end - T.hero + 4}><Hero /></Scene>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      {[T.words, T.end].map((a) => <Scan key={a} f={f} at={a - 4} />)}
      <HUD f={f} total={T.total} ep="03" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/jet/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
