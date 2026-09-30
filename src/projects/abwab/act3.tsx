import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Cascade, GlowPill, Word } from "../../engine/Text";
import { C, FONT, blurF, easeIn, easeInOut, io } from "../../engine/util";
import { Reveal, count, lightCard } from "../../engine/ui";
import { A, AbwabLogo } from "./assets";
import { Bars3D } from "../../engine/three/shots";
import { Logo3DLockup } from "./act1";

const W = (s: string, accent: string[] = []): Word[] => s.split(" ").map((t) => ({ t, accent: accent.includes(t) }));
const abs = (left: number, top: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left, top, ...extra });
const MUTED = "#4A5565";

/* ───────── C1 · proof numbers ───────── */
export const Proof: React.FC = () => {
  const l = useCurrentFrame();
  const m = Math.round(io(l, [22, 52], [0, 1000], easeInOut));
  const cards = [
    { v: m >= 1000 ? "SAR 1B+" : `SAR ${m}M`, k: "MSME loans processed", p: 1 },
    { v: `${count(l, 30, 30, 70)}%`, k: "faster credit decisions", p: 0.7 },
    { v: `${count(l, 38, 30, 90)}%`, k: "lower cost per case", p: 0.9 },
    { v: `${count(l, 46, 30, 40)}%`, k: "fewer defaults", p: 0.4 },
  ];
  return (
    <AbsoluteFill>
      <div style={abs(0, 80, { right: 0 })}><GlowPill f={l} start={2} text="Production-proven" variant="light" size={22} maxW={320} /></div>
      <div style={abs(0, 160, { right: 0 })}><Cascade f={l} start={6} stagger={3} size={76} weight={500} color={C.ink} accentColor={C.violet} words={W("Live in production. Not a pilot.", ["Not", "a", "pilot."])} /></div>
      {cards.map((c, i) => (
        <div key={c.k} style={abs(150 + (i % 2) * 380, 330 + Math.floor(i / 2) * 236)}>
          <Reveal l={l} at={18 + i * 7} y={40}>
            <div style={{ ...lightCard(), width: 356, height: 212, padding: "28px 30px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: i === 0 ? 60 : 66, whiteSpace: "nowrap", fontWeight: 700, letterSpacing: -2, color: i === 0 ? C.violet : C.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1.05 }}>{c.v}</div>
              <div style={{ fontSize: 21, color: MUTED, marginTop: 10 }}>{c.k}</div>
              <div style={{ position: "absolute", left: 30, right: 30, bottom: 26, height: 7, borderRadius: 4, background: "#EEEAF5" }}>
                <div style={{ width: `${c.p * io(l, [26 + i * 7, 56 + i * 7], [0, 1], easeInOut) * 100}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.lilac}, ${C.violet})` }} />
              </div>
            </div>
          </Reveal>
        </div>
      ))}
      <div style={abs(990, 330, { width: 800 })}>
        <Reveal l={l} at={26} y={20}>
          <div style={{ fontFamily: FONT, display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontSize: 64, fontWeight: 700, color: C.violet, letterSpacing: -2 }}>{count(l, 30, 50, 13)}x</span>
            <span style={{ fontSize: 28, color: C.ink, fontWeight: 500 }}>growth in four quarters</span>
          </div>
        </Reveal>
      </div>
      <div style={abs(990, 410)}><Bars3D l={l} at={30} w={800} h={420} /></div>
      <div style={abs(0, 890, { right: 0 })}>
        <Cascade f={l} start={70} stagger={2} size={30} weight={400} color={MUTED} accentColor={C.violet} words={W("30% uplift in default prediction · independently validated", ["30%"])} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────── C2 · client logo marquee + data ecosystem ───────── */
const CLIENTS = ["logos/sme-bank.png", "logos/aljuf.svg", "logos/lendo.png", "logos/hala.png", "logos/kafalah.svg", "logos/raqamyah.png", "logos/watad.png", "logos/surepay.webp", "logos/salesfine.svg", "logos/ldun.svg"];
const PARTNERS = ["simah.png", "bayan.png", "qawaem.png", "lean.webp", "tarabut.webp", "gosi.png", "balady.png", "thiqah.png", "focal.png"];
const LogoCard: React.FC<{ src: string }> = ({ src }) => (
  <div style={{ ...lightCard(), flexShrink: 0, width: 300, height: 140, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 34px rgba(76,29,149,0.08)" }}>
    <Img src={A(src)} style={{ width: 220, height: 72, objectFit: "contain" }} />
  </div>
);
export const Clients: React.FC = () => {
  const l = useCurrentFrame();
  const row = (items: string[], dir: number, top: number, at: number) => (
    <div style={abs(0, top, { right: 0, height: 150, overflow: "hidden", opacity: io(l, [at, at + 12], [0, 1]), WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)" })}>
      <div style={{ display: "flex", gap: 28, transform: `translateX(${dir < 0 ? 40 - l * 3.2 : -1000 + l * 3.2}px)`, paddingTop: 4 }}>
        {[...items, ...items, ...items].map((s, i) => <LogoCard key={i} src={s} />)}
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={abs(0, 170, { right: 0 })}><Cascade f={l} start={2} stagger={3} size={74} weight={500} color={C.ink} accentColor={C.violet} words={W("Trusted by 13+ financial institutions.", ["13+"])} /></div>
      {row(CLIENTS.slice(0, 5), -1, 360, 8)}
      {row(CLIENTS.slice(5), 1, 530, 14)}
      <div style={abs(0, 745, { right: 0, textAlign: "center", fontFamily: FONT, fontSize: 18, letterSpacing: 3, fontWeight: 600, color: "#7A7F8C", opacity: io(l, [40, 50], [0, 1]) })}>
        INTEGRATED WITH THE SAUDI CREDIT AND DATA ECOSYSTEM
      </div>
      <div style={abs(0, 800, { right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 46 })}>
        {PARTNERS.map((p, i) => (
          <Reveal key={p} l={l} at={46 + i * 3} dur={10} y={14}>
            <Img src={A(`integrations/${p}`)} style={{ height: 52, maxWidth: 150, objectFit: "contain" }} />
          </Reveal>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ───────── C3 · testimonial (text only) ───────── */
export const Quote: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={abs(0, 170, { right: 0 })}><GlowPill f={l} start={0} text="What lenders say" variant="light" size={24} maxW={320} /></div>
      <div style={abs(260, 270)}>
        <Reveal l={l} at={2} y={50}>
          <div style={{ ...lightCard(), width: 1400, padding: "70px 90px 60px", boxSizing: "border-box", position: "relative", borderRadius: 32 }}>
            <div style={{ position: "absolute", left: 50, top: -30, fontSize: 200, lineHeight: 1, color: C.violet, fontFamily: "Georgia, serif", opacity: io(l, [6, 14], [0, 1]) }}>“</div>
            <Cascade f={l} start={8} stagger={2} size={54} weight={400} color={C.ink} accentColor={C.violet} justify="flex-start" words={W("Abwab.ai gave us instant, data-driven credit", ["instant,", "data-driven"])} />
            <div style={{ height: 8 }} />
            <Cascade f={l} start={22} stagger={2} size={54} weight={400} color={C.ink} accentColor={C.violet} justify="flex-start" words={W("decisions with minimal integration effort.”", ["minimal", "integration", "effort.”"])} />
            <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 28, opacity: io(l, [38, 48], [0, 1]), filter: blurF((1 - io(l, [38, 48], [0, 1])) * 8) }}>
              <Img src={A("logos/salesfine.svg")} style={{ height: 46 }} />
              <div style={{ width: 1.5, height: 54, background: "#E2E1E5" }} />
              <div style={{ fontFamily: FONT }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>Mohammed Damiri</div>
                <div style={{ fontSize: 20, color: MUTED, marginTop: 2 }}>Chief Product Officer, SalesFine</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── C4 · end card ───────── */
export const EndCard: React.FC = () => {
  const l = useCurrentFrame();
  const tOut = io(l, [40, 48], [0, 1], easeIn);
  const logo = io(l, [40, 46], [0, 1]);
  const press = io(l, [100, 103, 108], [0, 1, 0]);
  const ripple = io(l, [103, 120], [0, 1]);
  const cx = io(l, [78, 100], [1500, 1010], easeInOut), cy = io(l, [78, 100], [1000, 718], easeInOut);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - tOut, filter: blurF(tOut * 12), transform: `scale(${1 + tOut * 0.04})` }}>
        <Cascade f={l} start={2} stagger={4} size={128} weight={600} color={C.ink} accentColor={C.violet} words={W("Lend More. Risk Less.", ["Risk", "Less."])} />
      </div>
      {l >= 42 && (
        <>
          <div style={{ position: "absolute", inset: 0, opacity: logo }}>
            <Logo3DLockup l={l} at={42} dark top={330} />
          </div>
          <div style={abs(0, 575, { right: 0 })}><GlowPill f={l} start={58} text="abwab.ai" icon="" variant="black" size={26} maxW={260} /></div>
          <div style={abs(0, 670, { right: 0, display: "flex", justifyContent: "center" })}>
            <Reveal l={l} at={64} y={20}>
              <div style={{ position: "relative", background: C.violet, color: "#fff", fontFamily: FONT, fontSize: 28, fontWeight: 600, padding: "22px 44px", borderRadius: 16, transform: `scale(${1 - press * 0.05})`, boxShadow: `0 16px 40px rgba(124,58,237,${0.35 + press * 0.3})` }}>
                Request a demo →
                {ripple > 0 && ripple < 1 && <div style={{ position: "absolute", inset: 0, borderRadius: 16, boxShadow: `0 0 0 ${ripple * 26}px rgba(124,58,237,${0.35 * (1 - ripple)})` }} />}
              </div>
            </Reveal>
          </div>
          <div style={abs(0, 820, { right: 0 })}>
            <Cascade f={l} start={112} stagger={2} size={32} weight={400} color={MUTED} words={W("See what your credit team is missing.")} />
          </div>
          {l >= 76 && (
            <svg width={48} height={56} viewBox="0 0 22 26" style={{ position: "absolute", left: cx, top: cy, transform: `scale(${1 - press * 0.15})`, transformOrigin: "top left", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))", opacity: io(l, [76, 82], [0, 1]) * (1 - io(l, [130, 140], [0, 1])) }}>
              <path d="M2 2 L2 21 L7 16.5 L10.5 24 L13.8 22.5 L10.4 15.2 L17 15 Z" fill="#101828" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
            </svg>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};
