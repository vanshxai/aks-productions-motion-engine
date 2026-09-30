import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { FONT_CSS } from "./lib";

// shot starts (24 fps)
const FR: [string, number][] = [["S01",108],["S02",84],["S03",72],["S04",84],["S05",96],["S06",72],["S07",84],["S08",108],["S09",108],["S10",72],["S11",84],["S12",60],["S13",84],["S14",72],["S15",60],["S16",72],["S17",48],["S18",72]];
export const START: Record<string, number> = {}; let acc = 0; for (const [k, n] of FR) { START[k] = acc; acc += n; }
export const TOTAL = acc;

const CAPS: { t: string; a: number; b: number; amber?: boolean }[] = [
  { t: "FIRST", a: START.S01 + 18, b: START.S01 + 56 },
  { t: "CLIENT.", a: START.S01 + 56, b: START.S01 + 104 },
  { t: "SENT.", a: START.S02 + 44, b: START.S02 + 82 },
  { t: "GHOSTED.", a: START.S05 + 36, b: START.S05 + 94 },
  { t: "PROTECTED.", a: START.S09 + 84, b: START.S09 + 107, amber: true },
  { t: "ONE CLICK.", a: START.S13 + 50, b: START.S13 + 83, amber: true },
  { t: "SUSPENDED.", a: START.S14 + 30, b: START.S14 + 71 },
  { t: "PAID.", a: START.S16 + 18, b: START.S16 + 70, amber: true },
];

const Caption: React.FC<{ t: string; a: number; b: number; amber?: boolean }> = ({ t, a, b, amber }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  if (f < a || f > b) return null;
  const s = spring({ frame: f - a, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  const out = interpolate(f, [b - 5, b], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "66%", textAlign: "center", transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(s * 1.4, 1) * out }}>
      <span style={{ fontFamily: "Plus Jakarta Sans", fontWeight: 800, fontSize: 78, letterSpacing: -1.5, color: amber ? "#ffcb80" : "#fff",
        textShadow: "0 4px 24px rgba(0,0,0,.65), 0 0 2px rgba(0,0,0,.9)", WebkitTextStroke: "1.5px rgba(0,0,0,.35)" }}>{t}</span>
    </div>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame() - START.S18; const { fps } = useVideoConfig();
  if (f < 0) return null;
  const dim = interpolate(f, [0, 14], [0, 0.72], { extrapolateRight: "clamp" });
  const s1 = spring({ frame: f - 6, fps, config: { damping: 16 } }); const s2 = spring({ frame: f - 16, fps, config: { damping: 18 } }); const s3 = spring({ frame: f - 26, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: `rgba(8,4,2,${dim})`, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ opacity: s1, transform: `translateY(${(1 - s1) * 20}px)`, display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ color: "#f5a93c", fontSize: 48, fontFamily: "Plus Jakarta Sans" }}>✦</span>
        <span style={{ color: "#f4e9de", fontSize: 92, fontFamily: "Instrument Serif", fontStyle: "italic" }}>DevAegis</span>
      </div>
      <div style={{ opacity: s2, transform: `translateY(${(1 - s2) * 16}px)`, marginTop: 18, textAlign: "center", fontFamily: "Plus Jakarta Sans", fontWeight: 600, fontSize: 40, lineHeight: 1.2,
        background: "linear-gradient(#fff0dc,#f9b569)", WebkitBackgroundClip: "text", color: "transparent" }}>
        Your code is <span style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontWeight: 400, fontSize: 48 }}>money</span>.<br />Ship it protected.
      </div>
      <div style={{ opacity: s3, marginTop: 40, padding: "18px 40px", borderRadius: 40, background: "linear-gradient(#ffcb80,#ee8517)", color: "#2e1502", fontFamily: "Plus Jakarta Sans", fontWeight: 700, fontSize: 30, boxShadow: "0 0 40px rgba(245,169,60,.45)" }}>
        Get started for free
      </div>
      <div style={{ opacity: s3, marginTop: 22, color: "#c9b49f", fontFamily: "Plus Jakarta Sans", fontWeight: 500, fontSize: 26 }}>devaegis.com</div>
    </AbsoluteFill>
  );
};

export const Film60: React.FC = () => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, 10], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style>{FONT_CSS}</style>
      <OffthreadVideo src={staticFile("film/film60_silent.mp4")} />
      {/* subtle film vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.35) 100%)" }} />
      {CAPS.map((c) => <Caption key={c.t + c.a} {...c} />)}
      <EndCard />
      <AbsoluteFill style={{ background: `rgba(0,0,0,${fadeIn})` }} />
      <Audio src={staticFile("film/mix60.wav")} />
    </AbsoluteFill>
  );
};
