import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "./brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "./kit";
import { EngineSpeed, End, Equation, FirstGear, Hero, Hook, Mesh, Shift, SmallGear, T, Trade, WheelForce } from "./scenes";

/** How It Works #01 — "Why does your car need gears?"  30 s · 1080×1920 · 30 fps. */
export const Gearbox30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const drop = f >= T.hero + 8 ? Math.max(0, 1 - (f - T.hero - 8) / 10) : 0;
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={f} flash={drop} />
      <Scene from={T.hook} dur={T.engine - T.hook + 6} inF={0} outF={8}><Hook /></Scene>
      <Scene from={T.engine} dur={T.wheel - T.engine + 6}><EngineSpeed /></Scene>
      <Scene from={T.wheel} dur={T.small - T.wheel + 6}><WheelForce /></Scene>
      <Scene from={T.small} dur={T.mesh - T.small} outF={0}><SmallGear /></Scene>
      <Scene from={T.mesh} dur={T.trade - T.mesh} inF={0} outF={0}><Mesh /></Scene>
      <Scene from={T.trade} dur={T.eq - T.trade + 6} inF={0}><Trade /></Scene>
      <Scene from={T.eq} dur={T.first - T.eq + 6}><Equation /></Scene>
      <Scene from={T.first} dur={T.shift - T.first + 6}><FirstGear /></Scene>
      <Scene from={T.shift} dur={T.hero - T.shift + 4} outF={4}><Shift /></Scene>
      <Scene from={T.hero} dur={T.end - T.hero + 6} inF={4}><Hero /></Scene>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      {[T.engine, T.wheel, T.eq, T.first, T.shift, T.end].map((a) => <Scan key={a} f={f} at={a - 4} />)}
      <HUD f={f} total={T.total} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/gearbox/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
