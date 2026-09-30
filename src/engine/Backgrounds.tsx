import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, io, rgba } from "./util";

export const DarkBG: React.FC = () => {
  const f = useCurrentFrame();
  const b = 0.82 + 0.18 * Math.sin(f / 38);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 72% 46% at 50% 110%, ${rgba(C.glow, 0.9 * b)} 0%, ${rgba(C.glow, 0.42)} 28%, ${rgba(C.glow, 0.16)} 52%, transparent 74%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            `radial-gradient(ellipse 55% 35% at 50% -5%, ${rgba(C.glow, 0.13)}, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const LightBG: React.FC<{ opacity: number; draw: number }> = ({
  opacity,
  draw,
}) => (
  <AbsoluteFill style={{ opacity, background: C.light }}>
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(ellipse 55% 55% at 0% 105%, ${rgba(C.lilac, 0.6)}, transparent 70%), radial-gradient(ellipse 50% 45% at 105% -5%, ${rgba(C.lilac, 0.4)}, transparent 70%)`,
      }}
    />
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      {[
        "M 1920 120 C 1500 160 1180 420 1120 1080",
        "M 0 980 C 380 900 700 640 760 0",
        "M 1920 300 C 1620 360 1380 640 1330 1080",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill="none"
          stroke={C.lilac2}
          strokeWidth={i === 2 ? 1.2 : 2}
          strokeOpacity={i === 2 ? 0.35 : 0.55}
          strokeDasharray="1 1"
          strokeDashoffset={1 - io(draw, [i * 4, 30 + i * 4], [0, 1])}
        />
      ))}
    </svg>
  </AbsoluteFill>
);
