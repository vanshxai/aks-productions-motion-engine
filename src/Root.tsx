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
import { Hydraulic30, HydraulicCover } from "./projects/hydraulic/Hydraulic30";
import { Fridge30, FridgeCover } from "./projects/fridge/Fridge30";
import { Lock30, LockCover } from "./projects/lock/Lock30";
import { Gps30, GpsCover } from "./projects/gps/Gps30";
import { Ice30, IceCover } from "./projects/ice/Ice30";
import { AcDc30, AcDcCover } from "./projects/acdc/AcDc30";
import { Tacoma30, TacomaCover } from "./projects/tacoma/Tacoma30";
import { Phone30, PhoneCover } from "./projects/phone/Phone30";
import { Orbit30, OrbitCover } from "./projects/orbit/Orbit30";
import { Chenab30, ChenabCover } from "./projects/chenab/Chenab30";
import { Contrails30, ContrailsCover } from "./projects/contrails/Contrails30";
import { WindowHole30, WindowHoleCover } from "./projects/windowhole/Window30";
import { FlyHigh30, FlyHighCover } from "./projects/flyhigh/FlyHigh30";
// ── HOW IT WORKS #20 (additive block; branch howitworks-20-rocket-up) ──
import { RocketUp30, RocketUpCover } from "./projects/rocketup/RocketUp30";
import { WarmUp30, WarmUpCover } from "./projects/warmup/WarmUp30"; // HOW IT WORKS #21 (additive block)

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
    <Composition id="Hydraulic-30s" component={Hydraulic30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Hydraulic-30s-silent" component={Hydraulic30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Hydraulic-cover" component={HydraulicCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Fridge-30s" component={Fridge30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Fridge-30s-silent" component={Fridge30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Fridge-cover" component={FridgeCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Lock-30s" component={Lock30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Lock-30s-silent" component={Lock30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Lock-cover" component={LockCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Gps-30s" component={Gps30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Gps-30s-silent" component={Gps30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Gps-cover" component={GpsCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Ice-30s" component={Ice30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Ice-30s-silent" component={Ice30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Ice-cover" component={IceCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="AcDc-30s" component={AcDc30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="AcDc-30s-silent" component={AcDc30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="AcDc-cover" component={AcDcCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Tacoma-30s" component={Tacoma30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Tacoma-30s-silent" component={Tacoma30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Tacoma-cover" component={TacomaCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Phone-30s" component={Phone30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Phone-30s-silent" component={Phone30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Phone-cover" component={PhoneCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Orbit-30s" component={Orbit30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Orbit-30s-silent" component={Orbit30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Orbit-cover" component={OrbitCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Chenab-30s" component={Chenab30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Chenab-30s-silent" component={Chenab30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Chenab-cover" component={ChenabCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Contrails-30s" component={Contrails30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="Contrails-30s-silent" component={Contrails30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="Contrails-cover" component={ContrailsCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="WindowHole-30s" component={WindowHole30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="WindowHole-30s-silent" component={WindowHole30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="WindowHole-cover" component={WindowHoleCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="FlyHigh-30s" component={FlyHigh30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="FlyHigh-30s-silent" component={FlyHigh30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="FlyHigh-cover" component={FlyHighCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    {/* ── HOW IT WORKS #20 — Why don't rockets go straight up? (additive block; remove/merge with sibling branches) ── */}
    <Composition id="RocketUp-30s" component={RocketUp30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="RocketUp-30s-silent" component={RocketUp30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="RocketUp-cover" component={RocketUpCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    {/* ── HOW IT WORKS #21 — Do you really need to warm up your car? (additive block, branch howitworks-21-warm-up) ── */}
    <Composition id="WarmUp-30s" component={WarmUp30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
    <Composition id="WarmUp-30s-silent" component={WarmUp30} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ withAudio: false }} />
    <Composition id="WarmUp-cover" component={WarmUpCover} durationInFrames={1} fps={30} width={1080} height={1920} />
    {/* ── end #21 ── */}
  </>
);
