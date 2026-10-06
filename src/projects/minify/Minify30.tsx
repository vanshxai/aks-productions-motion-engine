import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand, K } from "./brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "./kit";
import { CUTS, CodeCard, Cover, End, Heads, HeroPipe, Lesson, Lower, Stamp, T } from "./scenes";

const Shot: React.FC = () => {
  const g = useCurrentFrame();
  return (
    <>
      <CodeCard g={g} />
      <Lower g={g} />
      <HeroPipe g={g} />
      <Lesson g={g} />
      <Stamp g={g} />
      <Heads g={g} />
    </>
  );
};

/** DevAegis · How It Works #01 — minified code isn't hidden. 30 s · 1080×1920 · 30 fps · 2D only. Frame 0 is a finished hook. */
export const Minify30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const flash = (at: number, d = 22) => (f >= at && f < at + d ? 1 - (f - at) / d : 0);
  const fl = Math.max(flash(290), flash(450), flash(589, 16), flash(714));
  return (
    <AbsoluteFill style={{ background: K.bgDeep }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(70% 38% at 50% 45%, rgba(245,169,60,${0.18 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 6}><Shot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={402} />
      <Scan f={f} at={604} dur={12} />
      <Scan f={f} at={T.end - 4} />
      <HUD f={Math.max(f, 22)} total={T.total + 80} ep="01" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/minify/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const MinifyCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: K.bgDeep }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
