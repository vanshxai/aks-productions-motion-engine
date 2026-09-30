import React from "react";
import { Composition } from "remotion";
import { ScreenSeq, SCREENS } from "./ScreenSeq";
import { Film60, TOTAL } from "./Film60";

// scr-<kind>: UI screen sequences that Blender maps onto the laptop/phone screens.
// Film60: final composite (upscaled shots + captions + end card + audio).
export const Root: React.FC = () => (
  <>
    {Object.entries(SCREENS).map(([k, v]) => (
      <Composition key={k} id={"scr-" + k} component={ScreenSeq} durationInFrames={v.d} fps={24} width={v.w} height={v.h} defaultProps={{ kind: k }} />
    ))}
    <Composition id="Film60" component={Film60} durationInFrames={TOTAL} fps={24} width={720} height={1280} />
  </>
);
