import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand, K } from "../minify/brand";
import { applyBrand } from "../../engine/util";
import { Scene } from "../../engine/Scene";
import { Grain } from "../../engine/Wipe";
import { Blueprint, HUD, Scan } from "../minify/kit";
import { End } from "../minify/scenes";
import { CUTS, Cover, Grid, Heads, Lower, T } from "./scenes";

const Shot: React.FC = () => { const g = useCurrentFrame(); return (<><Grid g={g} /><Lower g={g} /><Heads g={g} /></>); };

/** DevAegis · How It Works #02 — AES-256 in one round. 30 s · 1080×1920 · 30 fps · 2D only. Real AES states. */
export const Aes30: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  const flash = (at: number, d = 22) => (f >= at && f < at + d ? 1 - (f - at) / d : 0);
  const fl = Math.max(flash(238), flash(304, 16), flash(384, 16), flash(436, 16), flash(480), flash(598), flash(702));
  return (
    <AbsoluteFill style={{ background: K.bgDeep }}>
      <Blueprint f={Math.max(f, 30)} />
      {fl > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(70% 38% at 50% 45%, rgba(245,169,60,${0.16 * fl}), transparent 70%)` }} />}
      <Sequence from={0} durationInFrames={T.end + 6}><Shot /></Sequence>
      <Scene from={T.end} dur={T.total - T.end}><End /></Scene>
      <Scan f={f} at={604} dur={12} />
      <Scan f={f} at={700} dur={10} />
      <Scan f={f} at={T.end - 4} />
      <HUD f={Math.max(f, 22)} total={T.total + 80} ep="02" cuts={CUTS} />
      <Grain f={f} opacity={0.05} blend="overlay" />
      {withAudio && <Audio src={staticFile("projects/aes/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
export const AesCover: React.FC = () => {
  applyBrand(brand);
  return (<AbsoluteFill style={{ background: K.bgDeep }}><Blueprint f={60} /><Cover /><Grain f={0} opacity={0.05} blend="overlay" /></AbsoluteFill>);
};
