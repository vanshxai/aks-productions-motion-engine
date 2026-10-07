import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { CUTS, Cover, End, PiShot, T } from "./scenes";
import { P } from "./theme";

/** AI Math #01 — π is as hard to approximate as any number can be. 30 s · 1080×1920 · 30 fps. Frame 0 is a finished hook. */
export const Pi30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // soft violet flash when the exponent dial locks on 2 (hero beat) and when the status stamp lands
  const pulse = (a: number, len: number, k: number) => (f >= a && f < a + len ? Math.min(1, Math.max(0, 1 - (f - a - 4) / (len - 4))) * Math.min(1, (f - a) / 4) * k : 0);
  const fl = Math.max(pulse(T.lock, 28, 1), pulse(T.stamp, 22, 0.6));
  return (
    <AbsoluteFill style={{ background: "#030B18" }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 30% at 50% 52.6%, rgba(183,156,255,${0.18 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 4}><PiShot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={T.end - 4} />
      {CUTS.slice(1, -1).map((c) => <Scan key={c} f={f} at={c - 4} dur={10} />)}
      <HUD f={Math.max(f, 22)} total={T.total} ep="01" label="AI MATH" accent={P.acc} cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/pi/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const PiCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
