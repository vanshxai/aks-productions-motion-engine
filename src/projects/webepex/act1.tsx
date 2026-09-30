import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Kicker, MaskLines, Odometer } from "../../engine/Type";
import { LightSweep } from "../../engine/Wipe";
import { C, DISPLAY, FONT, blurF, easeInOut, io, rgba } from "../../engine/util";
import { Mark3D } from "../../engine/three/shots";
import { Funnel3D, Seal3D } from "../../engine/three/objects";
import { EspressoBG, MARK, WORK, Wordmark } from "./assets";

const abs = (left: number, top: number, x: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left, top, ...x });

/* S1 · A wall of real client sites. "Your website looks great." → it dims → "It just doesn't sell." */
const WALL = [WORK.ghostboard, WORK.statsedge, WORK.chainbox, WORK.badbros, WORK.cricket11, WORK.hismile];
export const Hook: React.FC = () => {
  const l = useCurrentFrame();
  const push = 1 + 0.06 * io(l, [0, 100], [0, 1], (t) => t);
  const dim = io(l, [40, 56], [0, 1], easeInOut);
  return (
    <AbsoluteFill>
      <EspressoBG />
      <div style={abs(0, 0, { right: 0, bottom: 0, transform: `scale(${push})` })}>
        {WALL.map((src, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const p = io(l, [i * 2, i * 2 + 16], [0, 1]);
          return (
            <div key={i} style={abs(70 + col * 610, 150 + row * 400, { width: 560, height: 315, borderRadius: 14, overflow: "hidden", opacity: p * (1 - 0.72 * dim), transform: `translateY(${(1 - p) * 40}px)`, boxShadow: "0 30px 60px rgba(0,0,0,0.5)", filter: `grayscale(${dim}) blur(${dim * 3}px)` })}>
              <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 50%, ${rgba(C.bg, 0.92)}, ${rgba(C.bg, 0.35)} 75%)`, opacity: 0.55 + 0.45 * io(l, [4, 20], [0, 1]) }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <MaskLines f={l} start={8} lines={["Your website looks *great.*"]} size={124} color={C.textOnDark} accent={C.violet2} exitAt={40} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <MaskLines f={l} start={50} lines={["It just doesn't *sell.*"]} size={124} color={C.textOnDark} accent={C.violet2} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* S2 · Leaking funnel (3D): traffic pours in, revenue leaks out. Leak labels map to the three stages. */
const LEAKS: [string, string, number, number, number][] = [
  ["Weak design & copy", "→ The Foundation", 1250, 330, 34],
  ["Wrong traffic", "→ The Engine", 1330, 480, 46],
  ["Missed leads, 2 AM calls", "→ The Machine", 1260, 630, 58],
];
export const Funnel: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <EspressoBG />
      <div style={abs(470, 90)}><Funnel3D l={l} w={980} h={900} /></div>
      <div style={abs(140, 330)}>
        <Kicker f={l} at={4} text="Where revenue goes" color={C.textOnDarkMuted} />
        <div style={{ height: 26 }} />
        <MaskLines f={l} start={8} stagger={7} lines={["Traffic *pours in.*", "Revenue *leaks out.*"]} size={80} align="left" color={C.textOnDark} accent={C.violet2} />
      </div>
      {LEAKS.map(([t, s, x, y, at]) => {
        const p = io(l, [at, at + 14], [0, 1]);
        return (
          <div key={t} style={abs(x, y, { opacity: p, transform: `translateX(${(1 - p) * -30}px)`, display: "flex", alignItems: "center", gap: 16 })}>
            <div style={{ width: 70 * p, height: 1.5, background: C.violet2 }} />
            <div style={{ fontFamily: FONT }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: C.textOnDark }}>{t}</div>
              <div style={{ fontSize: 19, color: C.violet2, marginTop: 2 }}>{s}</div>
            </div>
          </div>
        );
      })}
      <div style={abs(880, 930, { opacity: io(l, [70, 84], [0, 1]), fontFamily: FONT, fontSize: 18, letterSpacing: 3.5, fontWeight: 600, color: C.violet2 })}>▼ BUYERS</div>
    </AbsoluteFill>
  );
};

/* S3 · The guarantee: 25% (odometer) in 45 days — or we work for free. Gold seal stamps down. */
export const Guarantee: React.FC = () => {
  const l = useCurrentFrame();
  const face = io(l, [76, 90], [0, 1]);
  return (
    <AbsoluteFill>
      <EspressoBG glow={1.4} />
      <div style={abs(150, 240)}>
        <Kicker f={l} at={2} text="The WebEpex guarantee" color={C.textOnDarkMuted} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 26, marginTop: 20 }}>
          <Odometer f={l} start={8} dur={34} value="25" suffix="%" size={230} color={C.violet2} font={DISPLAY} weight={400} />
        </div>
        <div style={{ marginTop: 6 }}>
          <MaskLines f={l} start={18} lines={["more conversions in *45 days*"]} size={72} align="left" color={C.textOnDark} accent={C.violet2} />
        </div>
        <div style={{ marginTop: 18 }}>
          <MaskLines f={l} start={50} lines={["— or we work for *free.*"]} size={72} align="left" color={C.textOnDark} accent={C.violet2} />
        </div>
      </div>
      <div style={abs(1210, 260)}>
        <Seal3D l={l} at={64} size={560} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: face, transform: `scale(${0.9 + 0.1 * face})` }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 118, color: C.violet2, lineHeight: 1 }}>45</div>
          <div style={{ fontFamily: FONT, fontSize: 17, letterSpacing: 4, fontWeight: 700, color: C.textOnDark, marginTop: 4 }}>DAY GUARANTEE</div>
          <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 26, color: C.violet2, marginTop: 6 }}>+25% or free</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* S4 · On the drop: gold 3D mark lands beside the real wordmark, light sweep, tagline. */
export const LogoLand: React.FC = () => {
  const l = useCurrentFrame();
  const wm = io(l, [8, 26], [0, 1]);
  const markH = 170;
  return (
    <AbsoluteFill>
      <EspressoBG glow={1.6} />
      <div style={abs(0, 330, { right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 34 })}>
        <div style={{ width: markH * 1.18, height: markH, position: "relative" }}>
          <div style={{ position: "absolute", left: (markH * 1.18) / 2 - 190, top: markH / 2 - 190 }}>
            <Mark3D l={l} at={-14} size={380} mark={MARK} material="gold" tint="#F0D5A0" />
          </div>
        </div>
        <div style={{ opacity: wm, filter: blurF((1 - wm) * 8) }}><Wordmark h={markH * 0.8} reveal={wm} /></div>
      </div>
      <LightSweep f={l} at={10} dur={20} color="#FFF3DC" opacity={0.5} />
      <div style={abs(0, 600, { right: 0, display: "flex", justifyContent: "center" })}>
        <MaskLines f={l} start={22} lines={["Revenue over *promises.*"]} size={64} color={C.textOnDark} accent={C.violet2} />
      </div>
      <div style={abs(0, 710, { right: 0, textAlign: "center", fontFamily: FONT, fontSize: 19, letterSpacing: 4.5, fontWeight: 600, color: C.textOnDarkMuted, opacity: io(l, [40, 54], [0, 1]) })}>
        58+ BUSINESSES · $1.5M+ GENERATED · SINCE 2024
      </div>
    </AbsoluteFill>
  );
};
