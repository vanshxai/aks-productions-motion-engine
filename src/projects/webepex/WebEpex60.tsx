import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand } from "./brand";
import { Grain, Wipe } from "../../engine/Wipe";
import { C, FONT, applyBrand, io } from "../../engine/util";
import { Funnel, Guarantee, Hook, LogoLand } from "./act1";
import { Calendar, Engine, Foundation, Lanes, Machine, Stages } from "./act2";
import { End, Receipts, Trust, Work } from "./act3";

/** Scene starts, cut on the music's downbeats (103.4 BPM, drop at 336 = 11.2 s). Keep in sync with soundtrack.py. */
export const S = { hook: 0, funnel: 92, guar: 210, logo: 330, stages: 406, found: 475, engine: 684, machine: 893, cal: 1102, lanes: 1242, receipts: 1311, work: 1451, trust: 1590, end: 1660 };
const DARK: [number, number][] = [[0, 406], [893, 1102], [1242, 1311], [1451, 1590]];
const CHAPTERS: [number, number, string][] = [[0, 406, "I · THE LEAK"], [406, 1311, "II · THE SYSTEM"], [1311, 1660, "III · THE RECEIPTS"]];

const HUD: React.FC = () => {
  const f = useCurrentFrame();
  const dark = DARK.some(([a, b]) => f >= a + 8 && f < b + 8);
  return (
    <>
      {CHAPTERS.map(([a, b, t]) => {
        const o = io(f, [a + 8, a + 22], [0, 1]) * (1 - io(f, [b - 6, b + 2], [0, 1]));
        if (o <= 0) return null;
        return (
          <div key={t} style={{ position: "absolute", left: 64, top: 46, display: "flex", alignItems: "center", gap: 14, fontFamily: FONT, fontSize: 15, letterSpacing: 3.6, fontWeight: 600, color: dark ? "rgba(245,240,232,0.6)" : "rgba(28,22,18,0.5)", opacity: o }}>
            <span style={{ width: 26, height: 1.5, background: C.violet2 }} />
            {t}
          </div>
        );
      })}
      <div style={{ position: "absolute", right: 64, top: 44, fontFamily: FONT, fontSize: 15, letterSpacing: 3.6, fontWeight: 700, color: dark ? "rgba(245,240,232,0.5)" : "rgba(28,22,18,0.4)", opacity: io(f, [8, 22], [0, 1]) * (1 - io(f, [1654, 1662], [0, 1])) }}>WEBEPEX</div>
    </>
  );
};

export const WebEpex60: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Wipe from={S.hook} dur={102} type="cut"><Hook /></Wipe>
      <Wipe from={S.funnel} dur={128} type="diag" inF={14}><Funnel /></Wipe>
      <Wipe from={S.guar} dur={128} type="iris" inF={16} ox={50} oy={55}><Guarantee /></Wipe>
      <Wipe from={S.logo} dur={84} type="iris" inF={8} ox={77} oy={50}><LogoLand /></Wipe>
      <Wipe from={S.stages} dur={77} type="up" inF={16}><Stages /></Wipe>
      <Wipe from={S.found} dur={217} type="left" inF={16}><Foundation /></Wipe>
      <Wipe from={S.engine} dur={217} type="left" inF={16}><Engine /></Wipe>
      <Wipe from={S.machine} dur={217} type="down" inF={16}><Machine /></Wipe>
      <Wipe from={S.cal} dur={148} type="iris" inF={16} ox={50} oy={50}><Calendar /></Wipe>
      <Wipe from={S.lanes} dur={78} type="up" inF={14}><Lanes /></Wipe>
      <Wipe from={S.receipts} dur={148} type="diag" inF={16}><Receipts /></Wipe>
      <Wipe from={S.work} dur={147} type="left" inF={16}><Work /></Wipe>
      <Wipe from={S.trust} dur={78} type="fade" inF={12}><Trust /></Wipe>
      <Wipe from={S.end} dur={140} type="iris" inF={14} ox={50} oy={50}><End /></Wipe>
      <Grain f={f} opacity={0.08} blend="soft-light" />
      <HUD />
      {withAudio && <Audio src={staticFile("projects/webepex/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
