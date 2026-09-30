import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { DarkBG, LightBG } from "../../engine/Backgrounds";
import { Scene } from "../../engine/Scene";
import { FONT, applyBrand, io } from "../../engine/util";
import { brand } from "./brand";
import { DoorsLogo, Gap, Hook, SmeStats } from "./act1";
import { Decision, Origination, Pipeline, Signals } from "./act2a";
import { Agentic, Compliance, Embedded, Ring } from "./act2b";
import { Clients, EndCard, Proof, Quote } from "./act3";

export const LIGHT_AT = 1320;
// Scene starts (also used by the audio mix)
export const S = { hook: 0, sme: 100, gap: 208, doors: 294, pipe: 402, orig: 490, sig: 606, dec: 738, ring: 882, agent: 942, emb: 1086, comp: 1216, proof: 1322, clients: 1456, quote: 1546, end: 1634 };

const CHAPTERS: [number, number, string][] = [[0, 400, "01 · THE GAP"], [400, LIGHT_AT, "02 · THE PLATFORM"], [LIGHT_AT, 1640, "03 · THE PROOF"]];
const ChapterHUD: React.FC = () => {
  const f = useCurrentFrame();
  const light = f >= LIGHT_AT;
  return (
    <>
      {CHAPTERS.map(([a, b, t]) => {
        const o = io(f, [a + 6, a + 20], [0, 1]) * (1 - io(f, [b - 8, b], [0, 1]));
        if (o <= 0) return null;
        return (
          <div key={t} style={{ position: "absolute", left: 64, top: 46, display: "flex", alignItems: "center", gap: 12, fontFamily: FONT, fontSize: 15, letterSpacing: 3.2, fontWeight: 600, color: light ? "rgba(16,24,40,0.5)" : "rgba(233,227,255,0.55)", opacity: o }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: "#8B5CF6", boxShadow: "0 0 10px #8B5CF6" }} />
            {t}
          </div>
        );
      })}
    </>
  );
};

export const Abwab60: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#07050D" }}>
      <DarkBG />
      <LightBG opacity={io(f, [LIGHT_AT, LIGHT_AT + 10], [0, 1])} draw={f - LIGHT_AT} />
      {/* ACT 1 */}
      <Scene from={S.hook} dur={106} inF={0} outF={10}><Hook /></Scene>
      <Scene from={S.sme} dur={114} outF={10}><SmeStats /></Scene>
      <Scene from={S.gap} dur={92} inF={8} outF={0}><Gap /></Scene>
      <Scene from={S.doors} dur={116} inF={6} outF={10}><DoorsLogo /></Scene>
      {/* ACT 2 */}
      <Scene from={S.pipe} dur={94} outF={10}><Pipeline /></Scene>
      <Scene from={S.orig} dur={122} outF={10}><Origination /></Scene>
      <Scene from={S.sig} dur={138} outF={10}><Signals /></Scene>
      <Scene from={S.dec} dur={150} outF={10}><Decision /></Scene>
      <Scene from={S.ring} dur={66} outF={8}><Ring /></Scene>
      <Scene from={S.agent} dur={150} outF={10}><Agentic /></Scene>
      <Scene from={S.emb} dur={136} outF={10}><Embedded /></Scene>
      <Scene from={S.comp} dur={108} outF={8}><Compliance /></Scene>
      {/* ACT 3 (light) */}
      <Scene from={S.proof} dur={140} inF={8} outF={10}><Proof /></Scene>
      <Scene from={S.clients} dur={96} outF={10}><Clients /></Scene>
      <Scene from={S.quote} dur={94} outF={10}><Quote /></Scene>
      <Scene from={S.end} dur={166} outF={0}><EndCard /></Scene>
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: io(f, [LIGHT_AT - 6, LIGHT_AT, LIGHT_AT + 10], [0, 0.9, 0]), pointerEvents: "none" }} />
      <ChapterHUD />
      {withAudio && <Audio src={staticFile("projects/abwab/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
