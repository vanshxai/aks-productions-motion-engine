import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeInOut, easeOut, io, rgba } from "../../engine/util";
import { T } from "./brand";
import { Bubble, Invoice, Terminal } from "./act1";
import { Callout, Dashboard, Decrypt, Embers, ForgeBG, Kicker, Logo, Pill, Slab, abs, glass, hash } from "./kit";
import { Lever3D, Star3D, Vault3D } from "./three";

/* ACT 2 — SHIP IT PROTECTED (the forge wakes up) ─────────────────────────────── */

/** S5 · The vault opens: the ✦ ignites in molten amber, the wordmark writes on. (VaultIris lives in the root.) */
export const Ignite: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ForgeBG heat={io(l, [0, 30], [0.3, 1])} />
      <Embers f={l} heat={io(l, [0, 30], [0.2, 1])} burst={1} burstAt={8} />
      <div style={abs(560, 40)}><Star3D l={l} at={2} w={800} h={700} /></div>
      <div style={abs(0, 700, { width: 1920, display: "flex", justifyContent: "center" })}>
        <Logo size={130} star={false} reveal={io(l, [22, 44], [0, 1], easeInOut)} glow={io(l, [22, 60], [0, 1])} />
      </div>
    </AbsoluteFill>
  );
};

/** S6 · "Code protection + invoicing, in one system." — the cube and the invoice chain together. */
export const OneSystem: React.FC = () => {
  const l = useCurrentFrame();
  const link = io(l, [26, 50], [0, 1], easeInOut);
  return (
    <AbsoluteFill>
      <ForgeBG />
      <Embers f={l + 80} n={30} />
      <div style={abs(0, 110, { width: 1920, display: "flex", justifyContent: "center" })}>
        <div style={{ ...glass({ borderRadius: 999, padding: "16px 34px" }), display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ color: T.amber, fontSize: 26 }}>✦</span>
          <Decrypt f={l} at={2} text="Code protection + invoicing, in one system" size={34} weight={700} color={T.amber} dur={20} spacing={0} />
        </div>
      </div>
      <div style={abs(140, 260)}><Vault3D l={l + 300} w={760} h={640} spin={-0.4} /></div>
      <Slab f={l} at={6} x={1080} y={330} w={680} h={470} from="right"><Invoice status="Sent" /></Slab>
      {/* the chain */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs><linearGradient id="ch" x1="0" x2="1"><stop offset="0" stopColor={T.hi} /><stop offset="1" stopColor={T.deep} /></linearGradient></defs>
        {Array.from({ length: 9 }).map((_, i) => {
          const t = (i + 0.5) / 9; if (t > link) return null;
          const x = 800 + t * 290, y = 580 + Math.sin(t * Math.PI) * 26;
          return <ellipse key={i} cx={x} cy={y} rx={17} ry={9} fill="none" stroke="url(#ch)" strokeWidth={5} transform={`rotate(${i % 2 ? 0 : 90} ${x} ${y})`} style={{ filter: `drop-shadow(0 0 8px ${T.deep})` }} />;
        })}
      </svg>
      <div style={abs(820, 640, { opacity: io(l, [46, 56], [0, 1]) })}>
        <Decrypt f={l} at={46} text="code ⟷ invoice" size={26} weight={700} color={T.ink2} spacing={2} mono />
      </div>
    </AbsoluteFill>
  );
};

/** S7 · Real CLI (from the DevAegis docs) types while an AES-256 hex shell forges around the cube. */
export const Forge: React.FC = () => {
  const l = useCurrentFrame();
  const shell = io(l, [30, 128], [0, 1], (t) => t);
  const flash = io(l, [128, 132, 150], [0, 1, 0]);
  return (
    <AbsoluteFill>
      <ForgeBG />
      <Embers f={l + 160} n={36} burst={1} burstAt={128} />
      <Slab f={l} at={0} x={100} y={200} w={820} h={560} from="left">
        <Terminal f={l} size={27} lines={[
          { t: "npm i -g devaegis", kind: "cmd", at: 6 },
          { t: "devaegis setup", kind: "cmd", at: 26 },
          { t: "devaegis secure <project-id>", kind: "cmd", at: 44 },
          { t: "Encrypting build · AES-256", kind: "out", at: 70, speed: 2.4 },
          { t: "devaegis export", kind: "cmd", at: 96 },
          { t: "dist-secured/ is ready", kind: "ok", at: 118 },
        ]} />
      </Slab>
      <div style={abs(900, 110)}><Vault3D l={l + 400} w={960} h={860} shell={shell} shellGlow={flash} spin={-0.6} /></div>
      <div style={abs(100, 800, { width: 820 })}>
        <Kicker f={l} at={8} text="Ship it protected" />
      </div>
      <div style={abs(1180, 930, { opacity: io(l, [118, 128], [0, 1]) })}><Pill label="Protected build" tone="amber" size={24} /></div>
    </AbsoluteFill>
  );
};

/** Hex glyph stream leaving the cube as ciphertext. */
const Cipher: React.FC<{ l: number; x: number; y: number; on: number }> = ({ l, x, y, on }) => (
  <>
    {Array.from({ length: 22 }).map((_, i) => {
      const t = ((l * (0.9 + hash(i) * 0.8) + hash(i + 4) * 80) % 80) / 80;
      const ang = hash(i + 9) * Math.PI * 2;
      const r = 120 + t * 520;
      const s = "0123456789ABCDEF";
      const txt = Array.from({ length: 4 }, (_, k) => s[Math.floor(hash(i * 5 + k + Math.floor(l / 3)) * 16)]).join("");
      return <div key={i} style={abs(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.6, { fontFamily: T.mono, fontSize: 18 + hash(i) * 10, color: T.amber, opacity: on * Math.sin(Math.PI * t) * 0.8, textShadow: `0 0 10px ${T.deep}` })}>{txt}</div>;
    })}
  </>
);

/** S8 · Callout 1 — AES-256: a scan passes; bytes leave as ciphertext. */
export const Aes: React.FC = () => {
  const l = useCurrentFrame();
  const scan = io(l, [6, 70], [1, -1], easeInOut);
  return (
    <AbsoluteFill>
      <ForgeBG />
      <Cipher l={l} x={1180} y={520} on={io(l, [10, 24], [0, 1])} />
      <div style={abs(700, 60)}><Vault3D l={l + 500} w={960} h={960} shell={1} scan={scan} spin={-0.6} scale={1.15} /></div>
      <div style={abs(150, 330)}>
        <Kicker f={l} at={2} text="01 · Encryption" />
        <div style={{ height: 22 }} />
        <Decrypt f={l} at={6} text="AES-256" size={150} align="left" grad={T.h1b} />
        <div style={{ height: 10 }} />
        <Decrypt f={l} at={20} text={"Every build is encrypted\nbefore it leaves your machine."} size={36} weight={500} color={T.ink2} align="left" spacing={0} dur={26} />
      </div>
    </AbsoluteFill>
  );
};

/** S9 · Callout 2 — Domain lock: the padlock clamps; a copy on another domain is rejected. */
export const DomainLock: React.FC = () => {
  const l = useCurrentFrame();
  const lock = io(l, [4, 40], [0, 1], (t) => t);
  const rej = io(l, [66, 70, 84], [0, 1, 0]);
  const chip = io(l, [52, 64], [0, 1]);
  const bounce = io(l, [66, 72, 80], [0, -40, 0]);
  return (
    <AbsoluteFill>
      <ForgeBG />
      <div style={abs(80, 60)}><Vault3D l={l + 600} w={960} h={960} shell={1} lock={lock} reject={rej} spin={-0.6} scale={1.05} /></div>
      <div style={abs(1080, 300)}>
        <Kicker f={l} at={2} text="02 · Domain lock" />
        <div style={{ height: 22 }} />
        <Decrypt f={l} at={6} text="Runs on one domain." size={70} align="left" />
        <div style={{ height: 22 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...glass({ borderRadius: 16, padding: "16px 22px" }), display: "flex", alignItems: "center", gap: 16, opacity: io(l, [24, 34], [0, 1]), width: 560 }}>
            <span style={{ fontSize: 26 }}>🔒</span><span style={{ fontFamily: T.mono, fontSize: 26, color: T.ink }}>portal.northwind.io</span><div style={{ marginLeft: "auto" }}><Pill label="Allowed" tone="live" size={18} /></div>
          </div>
          <div style={{ ...glass({ borderRadius: 16, padding: "16px 22px", border: `1px solid ${rgba(T.danger, 0.2 + 0.6 * rej)}` }), display: "flex", alignItems: "center", gap: 16, opacity: chip, width: 560, transform: `translateX(${(1 - chip) * 60 + bounce}px)` }}>
            <span style={{ fontSize: 26 }}>⧉</span><span style={{ fontFamily: T.mono, fontSize: 26, color: T.ink2 }}>copy-of-portal.net</span><div style={{ marginLeft: "auto", opacity: io(l, [66, 70], [0, 1]) }}><Pill label="Blocked" tone="danger" size={18} /></div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** S10 · Callout 3 — tied to the invoice: fields fill, chain glows. */
export const TiedToInvoice: React.FC = () => {
  const l = useCurrentFrame();
  const fill = io(l, [16, 70], [0, 1], (t) => t);
  const glow = 0.5 + 0.5 * Math.sin(l / 5);
  return (
    <AbsoluteFill>
      <ForgeBG />
      <div style={abs(40, 220)}><Vault3D l={l + 700} w={700} h={640} shell={1} lock={1} spin={-0.6} scale={0.95} /></div>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d="M 640 540 C 760 520, 820 560, 930 540" stroke={T.amber} strokeWidth={5} fill="none" strokeDasharray="14 10" strokeDashoffset={-l * 2} style={{ filter: `drop-shadow(0 0 ${8 + 10 * glow}px ${T.deep})` }} />
      </svg>
      <Slab f={l} at={0} x={940} y={220} w={740} h={560} from="right">
        <Invoice status="Sent" filled={fill} extra={
          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: io(l, [70, 80], [0, 1]) }}>
            <span style={{ fontFamily: T.sans, color: T.ink3, fontSize: 20, fontWeight: 600 }}>Build access</span>
            <Pill label="Tied to this invoice" tone="amber" size={20} />
          </div>
        } />
      </Slab>
      <div style={abs(940, 110)}><Kicker f={l} at={2} text="03 · Tied to the invoice" /></div>
      <div style={abs(940, 820, { width: 800 })}>
        <Decrypt f={l} at={40} text="Access follows payment." size={50} align="left" color={T.ink} />
      </div>
    </AbsoluteFill>
  );
};

/** S11 · The real DevAegis dashboard on a glass slab; a ring finds the project row. */
export const DashboardScene: React.FC = () => {
  const l = useCurrentFrame();
  const ring = io(l, [40, 56], [0, 1]);
  const W = 1280, H = 800;
  return (
    <AbsoluteFill>
      <ForgeBG />
      <Slab f={l} at={0} x={320} y={150} w={W} h={H} from="below" tilt={16} style={{ padding: 0 }}>
        <Dashboard w={W} h={H} />
        <div style={{ position: "absolute", inset: 0, background: `rgba(8,4,2,${0.5 * ring})` }} />
        <div style={abs((1099 / 1440) * W - 8, (642 / 900) * H - 8, { width: (304 / 1440) * W + 16, height: (77 / 900) * H + 16, borderRadius: 14, border: `3px solid ${T.amber}`, boxShadow: `0 0 ${30 * ring}px ${T.deep}, inset 0 0 0 9999px rgba(245,169,60,0.05)`, opacity: ring })} />
      </Slab>
      <div style={abs(320, 90)}><Kicker f={l} at={4} text="Your DevAegis dashboard" /></div>
      <div style={abs(1100, 975, { opacity: io(l, [56, 66], [0, 1]) })}>
        <Decrypt f={l} at={56} text="Every project. Every invoice. One place." size={30} weight={600} color={T.ink2} spacing={0} align="left" />
      </div>
    </AbsoluteFill>
  );
};

/** S12 · The kill switch rises. */
export const LeverRise: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ForgeBG />
      <Embers f={l + 240} n={30} />
      <div style={abs(620, 90)}><Lever3D l={l} w={1100} h={900} rise={io(l, [0, 40], [0, 1], (t) => t)} throw={0} /></div>
      <div style={abs(130, 360)}>
        <Kicker f={l} at={8} text="04 · The kill switch" />
        <div style={{ height: 22 }} />
        <Decrypt f={l} at={14} text="Pause the build." size={92} align="left" />
        <div style={{ height: 8 }} />
        <Decrypt f={l} at={40} text="*One click.*" size={92} align="left" />
      </div>
    </AbsoluteFill>
  );
};

/** S13 · "We'll pay next week." — again. The lever slams (lands on the music drop). */
export const Slam: React.FC = () => {
  const l = useCurrentFrame();
  const th = io(l, [74, 86], [0, 1], (t) => t * t);
  const shock = io(l, [86, 104], [0, 1]);
  const shake = l >= 86 && l < 96 ? (hash(l) - 0.5) * 18 * (1 - (l - 86) / 10) : 0;
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <ForgeBG />
      <Embers f={l + 300} n={40} burst={2} burstAt={86} />
      <div style={abs(620, 90)}><Lever3D l={l} w={1100} h={900} rise={1} throw={th} shock={shock} /></div>
      <div style={abs(120, 300, { width: 620 })}>
        <div style={{ ...glass({ borderRadius: 26, padding: "26px 28px", background: "rgba(20,20,26,0.9)" }), opacity: io(l, [4, 12], [0, 1]) }}>
          <div style={{ fontFamily: T.sans, color: "#8a8a94", fontSize: 18, marginBottom: 14 }}>Northwind Client · next project</div>
          <Bubble f={l} at={8} text="We'll pay next week." size={38} />
        </div>
        <div style={{ height: 36 }} />
        <Decrypt f={l} at={40} text="Not this time." size={78} align="left" grad={T.h1b} />
      </div>
      <AbsoluteFill style={{ background: T.hi, opacity: io(l, [86, 88, 96], [0, 0.55, 0]), mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
