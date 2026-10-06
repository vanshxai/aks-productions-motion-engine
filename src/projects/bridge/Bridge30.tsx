import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { Bend, BridgeShot, CUTS, End, Hero, Hook, Shapes, T, Why } from "./scenes";

/** How It Works #04 — "Why are bridges full of triangles?" (the truss). 30 s · 1080×1920 · 30 fps. */
export const Bridge30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const drop = f >= T.hero + 7 ? Math.max(0, 1 - (f - T.hero - 7) / 10) : 0;
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={f} flash={drop} />
      <Scene from={T.hook} dur={T.shapes - T.hook + 6} inF={0} outF={8}><Hook /></Scene>
      <Scene from={T.shapes} dur={T.why - T.shapes + 6}><Shapes /></Scene>
      <Scene from={T.why} dur={T.bridge - T.why + 6}><Why /></Scene>
      <Scene from={T.bridge} dur={T.bend - T.bridge + 6}><BridgeShot /></Scene>
      <Scene from={T.bend} dur={T.hero - T.bend + 4} outF={4}><Bend /></Scene>
      <Scene from={T.hero} dur={T.end - T.hero + 6} inF={4}><Hero /></Scene>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      {[T.shapes, T.why, T.bridge, T.bend, T.end].map((a) => <Scan key={a} f={f} at={a - 4} />)}
      <HUD f={f} total={T.total} ep="04" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/bridge/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
