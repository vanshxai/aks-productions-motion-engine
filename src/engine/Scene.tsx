import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { blurF, easeIn, io } from "./util";

const Inner: React.FC<{
  dur: number;
  inF: number;
  outF: number;
  children: React.ReactNode;
}> = ({ dur, inF, outF, children }) => {
  const f = useCurrentFrame();
  const enter = inF > 0 ? io(f, [0, inF], [0, 1]) : 1;
  const exit = outF > 0 ? io(f, [dur - outF, dur], [0, 1], easeIn) : 0;
  const blur = (1 - enter) * 14 + exit * 16;
  return (
    <AbsoluteFill
      style={{
        opacity: enter * (1 - exit),
        filter: blurF(blur),
        transform: `scale(${1 + (1 - enter) * 0.04 + exit * 0.05})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{
  from: number;
  dur: number;
  inF?: number;
  outF?: number;
  children: React.ReactNode;
}> = ({ from, dur, inF = 8, outF = 8, children }) => (
  <Sequence from={from} durationInFrames={dur}>
    <Inner dur={dur} inF={inF} outF={outF}>
      {children}
    </Inner>
  </Sequence>
);
