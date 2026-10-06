import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import "../../engine/fonts";
import { brand } from "./brand";
import { Wipe } from "../../engine/Wipe";
import { C, applyBrand } from "../../engine/util";
import { Coins, End, Friends, HUD, Hook, Lesson, Race, Result } from "./scenes";

/** Scene starts — timed to the Kokoro voiceover and snapped to the music's 136 BPM grid (13.24 f/beat). Keep in sync with soundtrack.py. */
export const S = { hook: 0, friends: 119, race: 252, result: 503, coins: 622, lesson: 728, end: 845, total: 900 };

export const Reel01: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Wipe from={S.hook} dur={S.friends - S.hook + 16} type="cut"><Hook /></Wipe>
      <Wipe from={S.friends} dur={S.race - S.friends + 16} type="diag" inF={14}><Friends /></Wipe>
      <Wipe from={S.race} dur={S.result - S.race + 16} type="up" inF={14}><Race /></Wipe>
      <Wipe from={S.result} dur={S.coins - S.result + 16} type="iris" inF={14} ox={50} oy={40}><Result /></Wipe>
      <Wipe from={S.coins} dur={S.lesson - S.coins + 16} type="left" inF={14}><Coins /></Wipe>
      <Wipe from={S.lesson} dur={S.end - S.lesson + 16} type="fade" inF={10}><Lesson /></Wipe>
      <Wipe from={S.end} dur={S.total - S.end} type="iris" inF={12} ox={50} oy={42}><End /></Wipe>
      <HUD until={S.end} />
      {withAudio && <Audio src={staticFile("projects/simplemoney/reel01.wav")} />}
    </AbsoluteFill>
  );
};
