import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Smear } from "../../engine/Smear";
import { Cascade, GlowPill, Typewriter, Word } from "../../engine/Text";
import { C, FONT, blurF, easeIn, easeInOut, io } from "../../engine/util";
import { Crop, INK_FILTER, Reveal, count } from "../../engine/ui";
import { A, AbwabLogo , MARK } from "./assets";
import { Img } from "remotion";
import { Cubes3D, Doors3D, Mark3D } from "../../engine/three/shots";

const W = (s: string, accent: string[] = []): Word[] => s.split(" ").map((t) => ({ t, accent: accent.includes(t) }));
const center: React.CSSProperties = { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" };

const frag = (x: number, y: number, blur: number, op = 0.9): React.CSSProperties => ({
  position: "absolute", left: x, top: y, borderRadius: 16, overflow: "hidden", filter: `blur(${blur}px)`, opacity: op,
  boxShadow: "0 30px 70px rgba(0,0,0,0.5)", background: "#fff",
});

/* 0–105 · typewriter hook over drifting fragments of the real Live Pulse report */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const d = -f * 0.5;
  const fade = io(f, [0, 16], [0, 1]) * (1 - io(f, [92, 104], [0, 1]));
  const out1 = io(f, [42, 50], [0, 1], easeIn);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, opacity: fade }}>
        <div style={frag(250, 40 + d, 1.6)}><Crop src={A("report/transactions.png")} srcW={952} sx={0} sy={150} sw={952} w={520} h={142} /></div>
        <div style={frag(1180, -30 + d * 0.8, 2.4, 0.8)}><Crop src={A("report/profitability.png")} srcW={952} sx={0} sy={100} sw={952} w={560} h={176} /></div>
        <div style={frag(160, 760 + d * 0.9, 2.2, 0.85)}><Crop src={A("report/transactions.png")} srcW={952} sx={0} sy={880} sw={952} w={560} h={212} /></div>
        <div style={frag(1200, 730 + d * 0.7, 1.4)}><Crop src={A("report/profitability.png")} srcW={952} sx={0} sy={600} sw={952} w={500} h={158} /></div>
      </div>
      {f < 52 && (
        <div style={{ ...center, opacity: 1 - out1, transform: `translateY(${-out1 * 40}px)`, filter: blurF(out1 * 12) }}>
          <Typewriter f={f} text="Still underwriting SMEs" start={6} fpc={1.3} cursor={f < 44} />
        </div>
      )}
      {f >= 50 && (
        <div style={center}>
          <Typewriter f={f} text="one spreadsheet at a time?" start={52} fpc={1.15} accentFrom={4} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* 3.4–7.2s · 1,000 cubes = Saudi businesses. 99.6% SMEs, only ~10% reached by credit */
export const SmeStats: React.FC = () => {
  const l = useCurrentFrame();
  const n = io(l, [4, 36], [0, 99.6]);
  const p1 = io(l, [2, 18], [0, 1]);
  const p2 = io(l, [40, 54], [0, 1]);
  const num = (p: number, accent?: boolean): React.CSSProperties => ({
    fontFamily: FONT, fontSize: 150, fontWeight: 600, letterSpacing: -6, lineHeight: 1, opacity: p, filter: blurF((1 - p) * 16),
    fontVariantNumeric: "tabular-nums", ...(accent ? { backgroundImage: `linear-gradient(90deg, ${C.lilac}, ${C.violet2})`, WebkitBackgroundClip: "text", color: "transparent" } : { color: "#fff" }),
  });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 80 }}>
        <GlowPill f={l} start={0} text="Saudi Arabia · SME credit" size={22} maxW={430} />
      </div>
      <div style={{ position: "absolute", left: 180, width: 700, top: 160, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={num(p1)}>{n.toFixed(1)}%</div>
        <div style={{ marginTop: 10 }}><Cascade f={l} start={10} stagger={2} size={32} weight={400} color="#E9E4F7" words={W("of Saudi private businesses are SMEs")} /></div>
      </div>
      <div style={{ position: "absolute", left: 959, top: 170, width: 2, height: 220, background: "linear-gradient(180deg, transparent, rgba(196,181,253,0.5), transparent)", transform: `scaleY(${io(l, [30, 44], [0, 1])})` }} />
      <div style={{ position: "absolute", left: 1040, width: 700, top: 160, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={num(p2, true)}>~{Math.round(io(l, [40, 60], [0, 10]))}%</div>
        <div style={{ marginTop: 10 }}><Cascade f={l} start={46} stagger={2} size={32} weight={400} color="#E9E4F7" words={W("of bank credit reaches them", ["reaches", "them"])} /></div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 418, display: "flex", justifyContent: "center", gap: 34, fontFamily: FONT, fontSize: 17, letterSpacing: 2.2, fontWeight: 600, color: "#9C8FC2" }}>
        <span style={{ opacity: io(l, [14, 24], [0, 1]) }}>▢ 1 CUBE = 1 BUSINESS</span>
        <span style={{ opacity: io(l, [22, 32], [0, 1]), color: "#FBBF24" }}>■ LARGE CORPORATES 0.4%</span>
        <span style={{ opacity: io(l, [52, 62], [0, 1]), color: C.lilac }}>■ RECEIVES BANK CREDIT</span>
      </div>
      <div style={{ position: "absolute", left: 210, top: 460 }}>
        <Cubes3D l={l} w={1500} h={600} />
      </div>
    </AbsoluteFill>
  );
};

/* 6.8–10.1s · $250B+ gap → the economics insight → whip */
export const Gap: React.FC = () => {
  const l = useCurrentFrame();
  const up = io(l, [44, 60], [0, 1]);
  const whip = io(l, [80, 92], [0, 1], easeIn);
  const p = io(l, [2, 20], [0, 1]);
  return (
    <AbsoluteFill>
      <Smear x={-whip * 1100} amount={io(l, [80, 84, 92], [0, 1, 1])}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 300 - up * 170, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${1 - up * 0.42})`, opacity: 1 - io(l, [86, 92], [0, 1]) }}>
          <div style={{ fontFamily: FONT, fontSize: 240, fontWeight: 600, letterSpacing: -9, lineHeight: 1, opacity: p, filter: blurF((1 - p) * 18), backgroundImage: `linear-gradient(180deg, #FFFFFF 30%, ${C.lilac})`, WebkitBackgroundClip: "text", color: "transparent", fontVariantNumeric: "tabular-nums" }}>
            ${count(l, 2, 36, 250)}B+
          </div>
          <div style={{ marginTop: 20, opacity: 1 - up }}>
            <Cascade f={l} start={14} stagger={3} size={46} weight={400} color="#E9E4F7" words={W("GCC SME financing gap")} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 500, opacity: 1 - io(l, [86, 92], [0, 1]) }}>
          <Cascade f={l} start={52} stagger={3} size={68} words={W("Assessing a small business costs")} />
          <div style={{ height: 14 }} />
          <Cascade f={l} start={64} stagger={3} size={68} words={W("almost as much as a corporate.", ["almost", "as", "much"])} />
        </div>
      </Smear>
    </AbsoluteFill>
  );
};

/* Doors open (Abwab = "doors"), we push through the light, the 3D mark lands next to the real wordmark */
export const LOGO_H = 190;
export const Logo3DLockup: React.FC<{ l: number; at: number; dark?: boolean; top: number }> = ({ l, at, dark, top }) => {
  const wmW = (1608 * LOGO_H) / 367;
  const markBox = 340;
  const total = LOGO_H * 0.97 + 36 + wmW;
  const left = 960 - total / 2;
  const wp = io(l, [at + 10, at + 28], [0, 1]);
  return (
    <>
      <div style={{ position: "absolute", left: left + (LOGO_H * 0.97) / 2 - markBox / 2, top: top + LOGO_H / 2 - markBox / 2 }}>
        <Mark3D l={l} at={at} size={markBox} tint={dark ? C.violet : C.violet2} mark={MARK} />
      </div>
      <Img
        src={A("wordmark.png")}
        style={{
          position: "absolute", left: left + LOGO_H * 0.97 + 36, top, height: LOGO_H, width: wmW,
          clipPath: `inset(0 ${(1 - wp) * 100}% 0 0)`, opacity: wp, filter: [dark ? INK_FILTER : "", blurF((1 - wp) * 8) ?? ""].join(" ").trim() || undefined,
        }}
      />
    </>
  );
};

export const DoorsLogo: React.FC = () => {
  const l = useCurrentFrame();
  const flood = io(l, [16, 28, 36, 54], [0, 1, 1, 0], easeInOut);
  const doorsOut = io(l, [30, 34], [1, 0]);
  return (
    <AbsoluteFill>
      {l < 36 && (
        <AbsoluteFill style={{ opacity: doorsOut }}>
          <Doors3D l={l} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #FFFFFF 0%, #EDE4FF ${20 + 30 * io(l, [16, 28], [0, 1])}%, rgba(139,92,246,${0.4 + 0.6 * io(l, [16, 28], [0, 1])}) ${60 + 40 * io(l, [16, 28], [0, 1])}%, transparent 100%)`, opacity: flood, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, rgba(124,58,237,0.5), transparent 38%)", opacity: io(l, [40, 54], [0, 1]) * (0.75 + 0.25 * Math.cos(l / 9)) }} />
      {l >= 34 && <Logo3DLockup l={l} at={36} top={300} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: 590 }}>
        <GlowPill f={l} start={58} text="Lend More. Risk Less." maxW={520} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 700 }}>
        <Cascade f={l} start={72} stagger={3} size={38} weight={400} color="#E4DDF7" words={[{ t: "Abwab" }, { t: "means" }, { t: "“doors”", accent: true }, { t: "in" }, { t: "Arabic." }]} />
      </div>
    </AbsoluteFill>
  );
};
