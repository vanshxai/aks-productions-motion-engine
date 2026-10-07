import React from "react";
import { AbsoluteFill } from "remotion";
import "../../engine/fonts";
import { brand, K } from "./brand";
import { applyBrand } from "../../engine/util";

const Star: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s * 2} height={s * 2} viewBox="-1.1 -1.1 2.2 2.2" style={{ overflow: "visible", filter: `drop-shadow(0 0 ${s * 0.22}px #ee8517)` }}>
    <defs><linearGradient id="sg" x1="0" y1="-1" x2="0" y2="1"><stop offset="0" stopColor="#ffe7c4" /><stop offset="0.5" stopColor="#ffcb80" /><stop offset="1" stopColor="#ee8517" /></linearGradient></defs>
    <path d="M 0 -1 Q 0.14 -0.14 1 0 Q 0.14 0.14 0 1 Q -0.14 0.14 -1 0 Q -0.14 -0.14 0 -1 Z" fill="url(#sg)" />
  </svg>
);
/** Instagram profile pictures (1080² — Instagram crops to a circle, so everything sits in the middle ~70%). Rebuilt mark, not the official file. */
export const Profile: React.FC<{ variant: "wordmark" | "mark" }> = ({ variant }) => {
  applyBrand(brand);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% 48%, #2a1608 0%, ${K.bg} 62%, ${K.bgDeep} 100%)`, alignItems: "center", justifyContent: "center" }}>
      {variant === "wordmark" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: -20 }}>
          <Star s={190} />
          <div style={{ fontFamily: K.serif, fontStyle: "italic", fontSize: 200, lineHeight: 1, color: K.text, letterSpacing: -3 }}>Dev<span style={{ color: K.line }}>Aegis</span></div>
        </div>
      ) : (
        <Star s={330} />
      )}
    </AbsoluteFill>
  );
};
