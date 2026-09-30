import React from "react";
import { Composition } from "remotion";
import { Abwab60 } from "./projects/abwab/Abwab60";
import { WebEpex60 } from "./projects/webepex/WebEpex60";

/**
 * One <Composition> per video. Convention:
 *   "<Project>-60s"        final render (with soundtrack)
 *   "<Project>-60s-silent" used by scripts/stills.sh for fast frame-checks
 * Add new projects below (see docs/NEW_PROJECT.md).
 */
export const Root: React.FC = () => (
  <>
    <Composition id="Abwab-60s" component={Abwab60} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ withAudio: true }} />
    <Composition id="Abwab-60s-silent" component={Abwab60} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ withAudio: false }} />
    <Composition id="WebEpex-60s" component={WebEpex60} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ withAudio: true }} />
    <Composition id="WebEpex-60s-silent" component={WebEpex60} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ withAudio: false }} />
  </>
);
