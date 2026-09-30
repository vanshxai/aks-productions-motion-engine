import React from "react";
import { Img } from "remotion";
import { assets, LogoImg } from "../../engine/ui";
import markData from "./mark.json";

export const A = assets("projects/abwab");
export const MARK = markData;

/** Real abwab.ai logo (white on transparent, 2048×367). */
export const AbwabLogo: React.FC<{ h: number; dark?: boolean; reveal?: number }> = ({ h, dark, reveal }) => (
  <LogoImg src={A("abwab-logo.webp")} h={h} aspect={2048 / 367} dark={dark} reveal={reveal} />
);

/** Abwab "A" app-icon tile. */
export const MarkTile: React.FC<{ size: number }> = ({ size }) => (
  <Img src={A("site/icon.png")} style={{ width: size, height: size, borderRadius: size * 0.24 }} />
);
