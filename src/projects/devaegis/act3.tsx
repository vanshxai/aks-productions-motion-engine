import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io, rgba } from "../../engine/util";
import { T } from "./brand";
import { Invoice, Portal } from "./act1";
import { Decrypt, Embers, ForgeBG, GlitchSlice, Kicker, Logo, Pill, Slab, abs, glass } from "./kit";
import { Coins3D, Lever3D, Star3D } from "./three";

/* ACT 3 — THE PAYOFF (amber → gold) ─────────────────────────────────────────── */

/** S14 · The client's portal glitches and goes dark: "Service suspended. Contact your developer." */
export const Suspended: React.FC = () => {
  const l = useCurrentFrame();
  const state = l < 8 ? "live" : "suspended";
  return (
    <AbsoluteFill>
      <ForgeBG heat={0.6} />
      <GlitchSlice f={l} at={2} dur={14}>
        <AbsoluteFill>
          <Slab f={l + 40} at={0} x={410} y={130} w={1100} h={720} style={{ border: `1px solid ${rgba(state === "live" ? T.live : T.danger, 0.35)}` }}>
            <Portal state={state} t={io(l, [10, 26], [0, 1])} />
          </Slab>
        </AbsoluteFill>
      </GlitchSlice>
      <div style={abs(410, 880, { display: "flex", gap: 18, alignItems: "center", opacity: io(l, [18, 28], [0, 1]) })}>
        <Pill label="Suspended" tone="danger" size={26} />
        <Decrypt f={l} at={22} text="their site, paused from your dashboard" size={28} weight={600} color={T.ink2} spacing={0} align="left" />
      </div>
      <div style={abs(410, 80)}><Kicker f={l} at={16} text="Meanwhile, at Northwind" /></div>
      <AbsoluteFill style={{ background: T.amber, opacity: io(l, [0, 2, 12], [0.5, 0.35, 0]), mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

/** S15 · Paid. The notification lands, the invoice flips to Paid, coins drop. */
export const Paid: React.FC = () => {
  const l = useCurrentFrame();
  const n = io(l, [6, 18], [0, 1], easeOut);
  return (
    <AbsoluteFill>
      <ForgeBG />
      <Embers f={l + 400} n={34} />
      <Slab f={l} at={0} x={130} y={250} w={720} h={520} from="left"><Invoice status={l < 34 ? "Overdue" : "Paid"} /></Slab>
      <div style={abs(700, 150)}><Coins3D l={l} at={34} w={620} h={780} /></div>
      <div style={abs(1260, 260, { width: 560, transform: `translateY(${(1 - n) * -80}px)`, opacity: n })}>
        <div style={{ ...glass({ borderRadius: 30, padding: "26px 30px" }), display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ width: 70, height: 70, borderRadius: 18, background: T.cta, display: "flex", alignItems: "center", justifyContent: "center", color: "#2e1502", fontSize: 38 }}>✦</div>
          <div style={{ fontFamily: T.sans }}>
            <div style={{ color: T.ink3, fontSize: 17, fontWeight: 600 }}>DevAegis · now</div>
            <div style={{ color: T.ink, fontSize: 30, fontWeight: 800 }}>Payment received</div>
            <div style={{ color: T.ink2, fontSize: 21, fontWeight: 500 }}>INV-0042 · $1,850.00</div>
          </div>
        </div>
      </div>
      <div style={abs(1260, 470)}>
        <Decrypt f={l} at={40} text="*Paid.*" size={150} align="left" grad="linear-gradient(180deg,#d9ffe4,#7fd69b)" />
      </div>
    </AbsoluteFill>
  );
};

/** S16 · One click restores the site. */
export const Restore: React.FC = () => {
  const l = useCurrentFrame();
  const back = io(l, [14, 26], [0, 1], easeInOut);
  return (
    <AbsoluteFill>
      <ForgeBG />
      <div style={abs(40, 140)}><Lever3D l={l} w={820} h={760} rise={1} throw={1 - back} restore={back} /></div>
      <Slab f={l} at={0} x={900} y={220} w={880} h={560} from="right" style={{ border: `1px solid ${rgba(back > 0.5 ? T.live : T.danger, 0.4)}` }}>
        <Portal state={back > 0.5 ? "live" : "suspended"} />
        <div style={{ position: "absolute", right: 18, bottom: 18 }}><Pill label={back > 0.5 ? "Live" : "Suspended"} tone={back > 0.5 ? "live" : "danger"} size={20} /></div>
      </Slab>
      <div style={abs(900, 830)}>
        <Decrypt f={l} at={28} text="One click to restore." size={54} align="left" />
      </div>
    </AbsoluteFill>
  );
};

/** S17 · The real headline. */
export const Headline: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ForgeBG />
      <Embers f={l + 500} n={60} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <Decrypt f={l} at={4} text="Your code is *money*." size={140} grad={T.h1a} dur={26} />
        <div style={{ height: 18 }} />
        <Decrypt f={l} at={34} text="Ship it protected." size={140} grad={T.h1a} dur={24} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** S18 · End card: molten ✦, wordmark, CTA pill (clicked), devaegis.com. */
export const End: React.FC = () => {
  const l = useCurrentFrame();
  const cta = io(l, [44, 60], [0, 1], easeOut);
  const cur = io(l, [62, 84], [0, 1], easeInOut);
  const press = io(l, [86, 90, 96], [0, 1, 0]);
  return (
    <AbsoluteFill>
      <ForgeBG />
      <Embers f={l + 600} n={60} burst={1} burstAt={88} />
      <div style={abs(710, 60)}><Star3D l={l} at={0} w={500} h={440} /></div>
      <div style={abs(0, 470, { width: 1920, display: "flex", justifyContent: "center" })}>
        <Logo size={120} star={false} reveal={io(l, [14, 36], [0, 1], easeInOut)} glow={0.8} />
      </div>
      <div style={abs(0, 660, { width: 1920, display: "flex", justifyContent: "center", opacity: cta, transform: `translateY(${(1 - cta) * 20}px) scale(${1 - press * 0.05})` })}>
        <div style={{ padding: "26px 60px", borderRadius: 999, background: T.cta, color: "#2e1502", fontFamily: T.sans, fontWeight: 700, fontSize: 38, boxShadow: `0 0 ${50 + press * 40}px ${rgba(T.amber, 0.55)}` }}>Get started for free</div>
      </div>
      <div style={abs(0, 800, { width: 1920, textAlign: "center", opacity: io(l, [54, 66], [0, 1]), fontFamily: T.sans, fontSize: 32, fontWeight: 600, color: T.ink2, letterSpacing: 1 })}>devaegis.com</div>
      {/* cursor */}
      <div style={abs(1300 - cur * 240, 900 - cur * 170, { opacity: io(l, [60, 64], [0, 1]) * (1 - io(l, [120, 130], [0, 1])), transform: `scale(${1 - press * 0.15})` })}>
        <svg width={40} height={52}><path d="M2 2 L2 42 L12 32 L20 50 L28 46 L20 29 L36 29 Z" fill="#fff" stroke="#000" strokeWidth={2.5} /></svg>
      </div>
    </AbsoluteFill>
  );
};
