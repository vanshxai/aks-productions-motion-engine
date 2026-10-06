import React from "react";
import { Composition } from "remotion";
import { Abwab60 } from "./projects/abwab/Abwab60";
import { WebEpex60 } from "./projects/webepex/WebEpex60";
import { DevAegis60 } from "./projects/devaegis/DevAegis60";
import { Gearbox30 } from "./projects/gearbox/Gearbox30";
import { Transistor30 } from "./projects/transistor/Transistor30";
import { Jet30 } from "./projects/jet/Jet30";
import { Bridge30 } from "./projects/bridge/Bridge30";
import { Engine4_30, Engine4Cover } from "./projects/engine4/Engine4_30";
import { Motor30, MotorCover } from "./projects/motor/Motor30";

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
    <Composition id="DevAegis-60s" component={DevAegis60} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ withAudio: true }} />
    <Composition id="DevAegis-60s-silent" component={DevAegis60} durationInFrames={1800} fps={30} width={1920} height={1080} defaultProps={{ withAudio: false }} />
    <Composition id="Gearbox-30s" component={Gearbox30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Gearbox-30s-silent" component={Gearbox30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Transistor-30s" component={Transistor30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Transistor-30s-silent" component={Transistor30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Jet-30s" component={Jet30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Jet-30s-silent" component={Jet30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Bridge-30s" component={Bridge30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Bridge-30s-silent" component={Bridge30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Engine4-30s" component={Engine4_30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Engine4-30s-silent" component={Engine4_30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Engine4-cover" component={Engine4Cover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Motor-30s" component={Motor30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Motor-30s-silent" component={Motor30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Motor-cover" component={MotorCover} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
