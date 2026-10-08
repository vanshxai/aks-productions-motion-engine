import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "../gearbox/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../gearbox/kit";
import { P } from "../pi/theme";
import { CUTS, Cover, End, PiShot, T } from "./scenes";

/** AI Math #01 (60 s, plain-language cut) — "Is π secretly almost a fraction?" 1080×1920 · 30 fps · 1800 frames. Frame 0 is a finished hook. */
export const Pi60: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // soft violet flash when the score locks on the floor (hero beat)
  const pulse = (a: number, len: number, k: number) => (f >= a && f < a + len ? Math.min(1, Math.max(0, 1 - (f - a - 4) / (len - 4))) * Math.min(1, (f - a) / 4) * k : 0);
  const fl = pulse(T.lock, 30, 1);
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
      {withAudio && <Audio src={staticFile("projects/pi60/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const Pi60Cover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: "#030B18" }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
