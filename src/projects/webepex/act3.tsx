import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Kicker, MaskLines, Odometer } from "../../engine/Type";
import { LightSweep } from "../../engine/Wipe";
import { C, DISPLAY, FONT, blurF, easeInOut, io, rgba } from "../../engine/util";
import { Reveal } from "../../engine/ui";
import { Mark3D } from "../../engine/three/shots";
import { Carousel3D, Ribbon3D } from "../../engine/three/objects";
import { CLIENTS, CreamBG, EspressoBG, MARK, WORK, Wordmark } from "./assets";

const abs = (left: number, top: number, x: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left, top, ...x });

/* S11 · Results over promises — odometer stat row over a rising 3D gold ribbon. */
const STATS: { v: string; pre?: string; suf?: string; k: string }[] = [
  { v: "7.4", suf: "×", k: "average conversion increase" },
  { v: "1.5", pre: "$", suf: "M+", k: "revenue generated for clients" },
  { v: "58", suf: "+", k: "businesses scaled since 2024" },
  { v: "45", k: "days to hit the guarantee" },
];
export const Receipts: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CreamBG />
      <div style={abs(0, 560)}><Ribbon3D l={l} at={20} w={1920} h={520} /></div>
      <div style={abs(0, 110, { right: 0 })}>
        <MaskLines f={l} start={2} lines={["Results over *promises.*"]} size={104} color={C.ink} accent={C.violet} />
      </div>
      <div style={abs(0, 250, { right: 0, textAlign: "center", fontFamily: FONT, fontSize: 19, letterSpacing: 4, fontWeight: 600, color: C.muted, opacity: io(l, [12, 24], [0, 1]) })}>EVERY NUMBER FROM LIVE CLIENT DASHBOARDS</div>
      <div style={abs(130, 340, { display: "flex", gap: 40 })}>
        {STATS.map((s, i) => (
          <div key={s.k} style={{ width: 385, borderLeft: `2px solid ${rgba(C.violet, 0.5)}`, paddingLeft: 26, opacity: io(l, [16 + i * 6, 26 + i * 6], [0, 1]) }}>
            <Odometer f={l} start={18 + i * 7} dur={34} value={s.v} prefix={s.pre} suffix={s.suf} size={112} color={C.ink} font={DISPLAY} weight={400} />
            <div style={{ fontFamily: FONT, fontSize: 21, color: C.muted, marginTop: 6 }}>{s.k}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* S12 · The work behind the numbers — 3D carousel of real client builds with their results. */
const CASES = [
  { src: WORK.ghostboard, name: "Ghostboard", what: "US stock option flow platform", res: "6× revenue" },
  { src: WORK.chainbox, name: "ChainBox", what: "Crypto & stock perps trading", res: "$100M+ trading volume" },
  { src: WORK.cricket11, name: "Cricket 11 Team", what: "Cricket e-sports", res: "$1K/day within 30 days" },
  { src: WORK.hismile, name: "Hi-Smile India", what: "Dropshipping store", res: "$5K in 30 days" },
];
const STEPS = [0, 30, 62, 94];
export const Work: React.FC = () => {
  const l = useCurrentFrame();
  let idx = 0;
  STEPS.forEach((s, i) => { if (l >= s + 6) idx = i; });
  const tp = io(l, [STEPS[idx] + 6, STEPS[idx] + 18], [0, 1]);
  const c = CASES[idx];
  return (
    <AbsoluteFill>
      <EspressoBG glow={1.3} />
      <div style={abs(0, 150)}><Carousel3D l={l} srcs={CASES.map((c) => c.src)} stepAt={STEPS} w={1920} h={700} /></div>
      <div style={abs(140, 80)}>
        <MaskLines f={l} start={2} lines={["The work behind *the numbers.*"]} size={64} align="left" color={C.textOnDark} accent={C.violet2} />
      </div>
      <div style={abs(0, 860, { right: 0, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 26, opacity: tp, transform: `translateY(${(1 - tp) * 18}px)`, filter: blurF((1 - tp) * 6) })}>
        <span style={{ fontFamily: DISPLAY, fontSize: 54, color: C.textOnDark }}>{c.name}</span>
        <span style={{ fontFamily: FONT, fontSize: 22, color: C.textOnDarkMuted }}>{c.what}</span>
        <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 54, color: C.violet2 }}>{c.res}</span>
      </div>
      <div style={abs(0, 950, { right: 0, display: "flex", justifyContent: "center", gap: 12 })}>
        {CASES.map((_, i) => <div key={i} style={{ width: i === idx ? 36 : 10, height: 10, borderRadius: 5, background: i === idx ? C.violet2 : rgba(C.textOnDark, 0.25) }} />)}
      </div>
    </AbsoluteFill>
  );
};

/* S13 · Client wall + text-only testimonial (music breakdown — calm). */
export const Trust: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CreamBG />
      <div style={abs(0, 110, { right: 0, textAlign: "center", fontFamily: FONT, fontSize: 19, letterSpacing: 4.5, fontWeight: 600, color: C.muted, opacity: io(l, [0, 10], [0, 1]) })}>TRUSTED BY BUSINESSES ACROSS TRADING · CRYPTO · SAAS · FINANCE</div>
      <div style={abs(150, 180, { display: "grid", gridTemplateColumns: "repeat(6, 240px)", gap: "26px 30px" })}>
        {CLIENTS.map((src, i) => (
          <Reveal key={src} l={l} at={2 + i * 1.5} dur={10} y={16}>
            <div style={{ width: 240, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Img src={src} style={{ maxWidth: 210, maxHeight: 70, objectFit: "contain", opacity: 0.82 }} />
            </div>
          </Reveal>
        ))}
      </div>
      <div style={abs(0, 520, { right: 0 })}>
        <MaskLines f={l} start={18} stagger={5} lines={["“Every element reflects their expertise", "and commitment to *excellence.*”"]} size={58} color={C.ink} accent={C.violet} />
      </div>
      <div style={abs(0, 720, { right: 0, textAlign: "center", fontFamily: FONT, fontSize: 22, color: C.muted, opacity: io(l, [36, 48], [0, 1]) })}>
        <b style={{ color: C.ink }}>Fayaz P.</b> · Founder, GhostBoard & ChainBox
      </div>
    </AbsoluteFill>
  );
};

/* S14 · End: "Let's build something unstoppable." → gold mark + wordmark → webepex.com → CTA click. */
export const End: React.FC = () => {
  const l = useCurrentFrame();
  const logo = io(l, [36, 42], [0, 1]);
  const wm = io(l, [44, 60], [0, 1]);
  const press = io(l, [96, 99, 104], [0, 1, 0]);
  const ripple = io(l, [99, 116], [0, 1]);
  const cx = io(l, [72, 96], [1560, 1010], easeInOut), cy = io(l, [72, 96], [1010, 742], easeInOut);
  const markH = 150;
  return (
    <AbsoluteFill>
      <CreamBG />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <MaskLines f={l} start={2} stagger={6} lines={["Let's build something", "*unstoppable.*"]} size={124} color={C.ink} accent={C.violet} exitAt={34} />
      </AbsoluteFill>
      {l >= 34 && (
        <>
          <div style={abs(0, 300, { right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 30, opacity: logo })}>
            <div style={{ width: markH * 1.18, height: markH, position: "relative" }}>
              <div style={{ position: "absolute", left: (markH * 1.18) / 2 - 170, top: markH / 2 - 170 }}>
                <Mark3D l={l} at={36} size={340} mark={MARK} material="gold" tint="#C9A77A" />
              </div>
            </div>
            <div style={{ opacity: wm, filter: blurF((1 - wm) * 8) }}><Wordmark h={markH * 0.8} dark reveal={wm} /></div>
          </div>
          <LightSweep f={l} at={58} dur={20} color="#FFFFFF" opacity={0.7} />
          <div style={abs(0, 540, { right: 0, display: "flex", justifyContent: "center" })}>
            <Reveal l={l} at={58} y={14}>
              <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 600, color: C.light, background: C.ink, borderRadius: 999, padding: "12px 28px" }}>webepex.com</div>
            </Reveal>
          </div>
          <div style={abs(0, 700, { right: 0, display: "flex", justifyContent: "center" })}>
            <Reveal l={l} at={66} y={18}>
              <div style={{ position: "relative", fontFamily: FONT, fontSize: 30, fontWeight: 600, color: C.light, background: `linear-gradient(135deg, ${C.violet2}, ${C.violet})`, borderRadius: 18, padding: "24px 46px", transform: `scale(${1 - press * 0.05})`, boxShadow: `0 18px 44px ${rgba(C.violet, 0.35 + press * 0.3)}` }}>
                Book my free strategy call →
                {ripple > 0 && ripple < 1 && <div style={{ position: "absolute", inset: 0, borderRadius: 18, boxShadow: `0 0 0 ${ripple * 28}px ${rgba(C.violet2, 0.35 * (1 - ripple))}` }} />}
              </div>
            </Reveal>
          </div>
          <div style={abs(0, 860, { right: 0, textAlign: "center", fontFamily: FONT, fontSize: 19, letterSpacing: 4.5, fontWeight: 600, color: C.muted, opacity: io(l, [104, 118], [0, 1]) })}>
            WORLDWIDE · GCC · USA · EUROPE · CANADA · INDIA
          </div>
          {l >= 70 && (
            <svg width={48} height={56} viewBox="0 0 22 26" style={{ position: "absolute", left: cx, top: cy, transform: `scale(${1 - press * 0.15})`, transformOrigin: "top left", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))", opacity: io(l, [70, 76], [0, 1]) * (1 - io(l, [124, 134], [0, 1])) }}>
              <path d="M2 2 L2 21 L7 16.5 L10.5 24 L13.8 22.5 L10.4 15.2 L17 15 Z" fill="#1C1612" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
            </svg>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};
