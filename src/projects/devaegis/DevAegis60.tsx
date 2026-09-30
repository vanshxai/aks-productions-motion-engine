import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import "../../engine/fonts";
import { brand, T } from "./brand";
import { Grain } from "../../engine/Wipe";
import { applyBrand, io, rgba } from "../../engine/util";
import { Chat, Ghosted, InvoiceScene, Ship } from "./act1";
import { Aes, DashboardScene, DomainLock, Forge, Ignite, LeverRise, OneSystem, Slam, TiedToInvoice } from "./act2";
import { End, Headline, Paid, Restore, Suspended } from "./act3";
import { VaultIris } from "./kit";

/** Scene starts on the music's beats (“Future Design”, 117.5 BPM; track offset 2.0 s; groove at 399; drop-out at 1315). Keep in sync with soundtrack.py. */
export const S = { ship: 0, invoice: 113, chat: 205, ghost: 295, ignite: 399, system: 475, forge: 548, aes: 699, lock: 788, tie: 894, dash: 1000, lever: 1135, slam: 1225, susp: 1315, paid: 1404, restore: 1495, head: 1569, end: 1660, total: 1800 };
const ORDER: [keyof typeof S, React.FC][] = [
  ["ship", Ship], ["invoice", InvoiceScene], ["chat", Chat], ["ghost", Ghosted],
  ["ignite", Ignite], ["system", OneSystem], ["forge", Forge], ["aes", Aes], ["lock", DomainLock], ["tie", TiedToInvoice], ["dash", DashboardScene], ["lever", LeverRise], ["slam", Slam],
  ["susp", Suspended], ["paid", Paid], ["restore", Restore], ["head", Headline], ["end", End],
];
const CHAPTERS: [number, number, string][] = [[S.ship, S.ignite, "I · THE GHOST"], [S.ignite, S.susp, "II · SHIP IT PROTECTED"], [S.susp, S.end, "III · THE PAYOFF"]];

/** Quick blur-in cut on the beat (hard cuts, 4-frame focus pull). */
const Cut: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const b = io(f, [0, 4], [10, 0]);
  return <AbsoluteFill style={{ filter: b > 0.1 ? `blur(${b}px)` : undefined }}>{children}</AbsoluteFill>;
};

const HUD: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {CHAPTERS.map(([a, b, t]) => {
        const o = io(f, [a + 6, a + 20], [0, 1]) * (1 - io(f, [b - 6, b], [0, 1]));
        if (o <= 0) return null;
        return (
          <div key={t} style={{ position: "absolute", left: 64, top: 46, display: "flex", alignItems: "center", gap: 14, fontFamily: T.sans, fontSize: 15, letterSpacing: 3.6, fontWeight: 700, color: rgba(T.ink, 0.55), opacity: o }}>
            <span style={{ width: 26, height: 2, background: T.amber }} />{t}
          </div>
        );
      })}
      <div style={{ position: "absolute", right: 64, top: 40, fontFamily: T.serif, fontStyle: "italic", fontSize: 26, color: rgba(T.ink, 0.5), opacity: io(f, [6, 20], [0, 1]) * (1 - io(f, [S.end - 6, S.end], [0, 1])) }}>
        <span style={{ fontFamily: T.sans, fontStyle: "normal", color: T.amber, fontSize: 16, marginRight: 6 }}>✦</span>DevAegis
      </div>
    </>
  );
};

export const DevAegis60: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  applyBrand(brand);
  const f = useCurrentFrame();
  // vault-shutter iris: blades close over the end of act 1, open on the ignition
  const irisP = f < S.ignite ? io(f, [S.ignite - 12, S.ignite], [1, 0]) : io(f, [S.ignite, S.ignite + 26], [0, 1]);
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      {ORDER.map(([k, C], i) => {
        const from = S[k]; const to = i < ORDER.length - 1 ? S[ORDER[i + 1][0]] : S.total;
        return <Sequence key={k} from={from} durationInFrames={to - from}><Cut><C /></Cut></Sequence>;
      })}
      {f >= S.ignite - 12 && f < S.ignite + 26 && <VaultIris p={irisP} />}
      <Grain f={f} opacity={0.07} blend="soft-light" />
      <HUD />
      {withAudio && <Audio src={staticFile("projects/devaegis/soundtrack.wav")} />}
    </AbsoluteFill>
  );
};
