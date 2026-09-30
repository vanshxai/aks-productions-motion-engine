import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeInOut, io, rgba } from "../../engine/util";
import { T } from "./brand";
import { Decrypt, ForgeBG, Kicker, Pill, Slab, abs, glass } from "./kit";
import { Vault3D } from "./three";

/* Shared UI pieces for acts 1 and 3 ──────────────────────────────────────────── */

/** Terminal body: lines type in one after another. kind: cmd ($ prompt), out, ok (✓ green). */
export type TLine = { t: string; kind: "cmd" | "out" | "ok"; at: number; speed?: number };
export const Terminal: React.FC<{ f: number; lines: TLine[]; size?: number; title?: string }> = ({ f, lines, size = 26, title = "northwind-portal — zsh" }) => {
  const vis = lines.filter((x) => f >= x.at).length;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: T.mono }}>
      <div style={{ height: 50, background: "rgba(26,20,16,0.9)", display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: `1px solid ${T.line}` }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />)}
        <span style={{ flex: 1, textAlign: "center", color: T.ink3, fontFamily: T.sans, fontSize: 16, fontWeight: 600, marginRight: 60 }}>{title}</span>
      </div>
      <div style={{ padding: "26px 30px", fontSize: size, lineHeight: 1.75 }}>
        {lines.map((ln, i) => {
          if (f < ln.at) return null;
          const n = Math.floor((f - ln.at) * (ln.speed ?? (ln.kind === "cmd" ? 1.6 : 4)));
          const s = ln.t.slice(0, n);
          return (
            <div key={i} style={{ whiteSpace: "pre", color: ln.kind === "ok" ? T.live : ln.kind === "out" ? T.ink2 : T.ink }}>
              {ln.kind === "cmd" && <span style={{ color: T.amber }}>$ </span>}
              {ln.kind === "ok" && "✓ "}
              {s}
              {i === vis - 1 && Math.floor(f / 8) % 2 === 0 && <span style={{ display: "inline-block", width: size * 0.55, height: size * 1.05, background: T.amber, verticalAlign: "text-bottom", marginLeft: 2 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** The client's portal in a browser: live site, or "Service suspended" (real copy). */
export const Portal: React.FC<{ state: "live" | "suspended"; t?: number }> = ({ state, t = 1 }) => (
  <div style={{ position: "absolute", inset: 0, background: state === "live" ? "#f6f7fb" : "#101014", fontFamily: T.sans }}>
    <div style={{ height: 52, background: state === "live" ? "#e7e9f0" : "#1b1b21", display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
      <div style={{ marginLeft: 14, flex: 1, height: 30, borderRadius: 15, background: state === "live" ? "#fff" : "#2a2a32", display: "flex", alignItems: "center", padding: "0 16px", color: state === "live" ? "#6b7080" : "#9a9aa6", fontSize: 16, fontWeight: 600 }}>🔒 portal.northwind.io</div>
    </div>
    {state === "live" ? (
      <div style={{ padding: "28px 34px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 30, color: "#0f1b3d" }}>Northwind</div>
          <div style={{ display: "flex", gap: 22, color: "#4a5068", fontSize: 16, fontWeight: 600 }}>{["Dashboard", "Orders", "Reports"].map((x) => <span key={x}>{x}</span>)}</div>
        </div>
        <div style={{ marginTop: 26, fontWeight: 800, fontSize: 38, color: "#0f1b3d", letterSpacing: -1 }}>Good afternoon, Richard.</div>
        <div style={{ display: "flex", gap: 16, marginTop: 22 }}>
          {[["Orders today", "1,284"], ["Revenue", "$48,210"]].map(([a, b]) => (
            <div key={a} style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 6px 20px rgba(15,27,61,0.06)" }}>
              <div style={{ color: "#6b7080", fontSize: 15, fontWeight: 600 }}>{a}</div>
              <div style={{ color: "#0f1b3d", fontSize: 34, fontWeight: 800, marginTop: 6 }}>{b}</div>
            </div>
          ))}
        </div>
        <svg width="100%" height="120" style={{ marginTop: 20, background: "#fff", borderRadius: 16 }} viewBox="0 0 400 120" preserveAspectRatio="none">
          <polyline fill="none" stroke="#3b6cff" strokeWidth="3" points={Array.from({ length: 30 }, (_, i) => `${10 + i * 13},${100 - (Math.sin(i * 0.4) * 0.5 + 0.5 + i / 40) * 55}`).join(" ")} />
        </svg>
      </div>
    ) : (
      <div style={{ position: "absolute", top: 52, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
          <div style={{ width: 96, height: 96, margin: "0 auto", borderRadius: "50%", background: rgba(T.amber, 0.14), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46 }}>🔒</div>
          <div style={{ marginTop: 26, color: "#fff", fontWeight: 800, fontSize: 44 }}>Service suspended.</div>
          <div style={{ marginTop: 10, color: "#a1a1aa", fontWeight: 500, fontSize: 26 }}>Contact your developer.</div>
        </div>
      </div>
    )}
  </div>
);

/** Invoice card (glass) with a status pill that flips. */
export const Invoice: React.FC<{ status: "Sent" | "Viewed" | "Overdue" | "Paid" | "Draft"; filled?: number; extra?: React.ReactNode }> = ({ status, filled = 1, extra }) => {
  const tone = status === "Paid" ? "live" : status === "Overdue" ? "danger" : status === "Viewed" ? "amber" : "muted";
  const rows: [string, string][] = [["Client", "Northwind Portal"], ["Project", "portal.northwind.io"], ["Amount", "$1,850.00"], ["Due", "Jun 30"]];
  return (
    <div style={{ position: "absolute", inset: 0, padding: "34px 40px", fontFamily: T.sans }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: T.ink3, fontSize: 16, letterSpacing: 4, fontWeight: 700 }}>INVOICE</div>
          <div style={{ color: T.ink, fontSize: 40, fontWeight: 800, marginTop: 4 }}>INV-0042</div>
        </div>
        <Pill label={status} tone={tone as "live"} size={22} />
      </div>
      <div style={{ height: 1, background: T.line, margin: "24px 0" }} />
      {rows.map(([k, v], i) => {
        const p = io(filled * rows.length, [i, i + 1], [0, 1]);
        return (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 24, margin: "12px 0", opacity: 0.25 + 0.75 * p }}>
            <span style={{ color: T.ink3, fontWeight: 600 }}>{k}</span>
            <span style={{ color: k === "Amount" ? T.hi : T.ink, fontWeight: 700 }}>{v.slice(0, Math.ceil(v.length * p))}</span>
          </div>
        );
      })}
      {extra}
    </div>
  );
};

export const Bubble: React.FC<{ f: number; at: number; text: string; mine?: boolean; size?: number }> = ({ f, at, text, mine, size = 34 }) => {
  const p = io(f, [at, at + 10], [0, 1]);
  if (p <= 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", transform: `scale(${0.85 + 0.15 * p}) translateY(${(1 - p) * 16}px)`, transformOrigin: mine ? "100% 100%" : "0% 100%", opacity: p }}>
      <div style={{ padding: `${size * 0.45}px ${size * 0.75}px`, borderRadius: size, background: mine ? "#0a84ff" : "#2a2a30", color: "#fff", fontFamily: T.sans, fontWeight: 600, fontSize: size, maxWidth: 760 }}>{text}</div>
    </div>
  );
};

/* ACT 1 — THE GHOST (cold) ─────────────────────────────────────────────────── */

/** S1 · Build shipped: terminal zips the build; the code cube flies out to the client's portal, which goes Live. */
export const Ship: React.FC = () => {
  const l = useCurrentFrame();
  const fly = io(l, [44, 92], [0, 1], easeInOut);
  const arrive = io(l, [88, 96], [0, 1]);
  return (
    <AbsoluteFill>
      <ForgeBG heat={0.12} />
      <Slab f={l} at={0} x={110} y={250} w={700} h={430} from="left">
        <Terminal f={l} size={25} lines={[
          { t: "npm run build", kind: "cmd", at: 6 },
          { t: "✓ compiled 214 modules", kind: "out", at: 22 },
          { t: "zip -r northwind-portal.zip dist", kind: "cmd", at: 28 },
          { t: "Final build shipped.", kind: "ok", at: 52 },
        ]} />
      </Slab>
      <div style={abs(380, 170)}>
        <Vault3D l={l} w={1200} h={760} cold={1} heat={0.2} x={-0.9 + fly * 4.4} y={0.2 - fly * 0.1} scale={1 - fly * 0.55} spin={fly * 3} />
      </div>
      <Slab f={l} at={30} x={1300} y={240} w={520} h={500} from="right">
        <Portal state="live" />
        <div style={{ position: "absolute", right: 18, bottom: 18, opacity: arrive }}><Pill label="Live" tone="live" size={20} /></div>
      </Slab>
      <div style={abs(110, 740, { width: 700 })}>
        <Kicker f={l} at={60} text="Delivered to the client" color={T.cold} />
      </div>
    </AbsoluteFill>
  );
};

/** S2 · The invoice: Sent → Viewed → Overdue. */
export const InvoiceScene: React.FC = () => {
  const l = useCurrentFrame();
  const status = l < 30 ? "Sent" : l < 56 ? "Viewed" : "Overdue";
  const days = Math.floor(io(l, [56, 86], [0, 14], (t) => t));
  return (
    <AbsoluteFill>
      <ForgeBG heat={0.1} />
      <Slab f={l} at={0} x={560} y={200} w={800} h={560} from="below">
        <Invoice status={status} />
      </Slab>
      <div style={abs(1400, 330, { opacity: io(l, [56, 64], [0, 1]) })}>
        <div style={{ fontFamily: T.sans, color: T.ink3, fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>OVERDUE</div>
        <div style={{ fontFamily: T.sans, color: T.danger, fontSize: 120, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{days}<span style={{ fontSize: 40, color: T.ink2, marginLeft: 10 }}>days</span></div>
      </div>
      <div style={abs(150, 380, { width: 360 })}>
        <Kicker f={l} at={4} text="Invoice sent" color={T.cold} />
        <div style={{ height: 18 }} />
        <Decrypt f={l} at={8} text="Code delivered." size={46} align="left" color={T.ink} />
        <div style={{ height: 8 }} />
        <Decrypt f={l} at={40} text="Invoice ignored." size={46} align="left" color={T.cold} />
      </div>
    </AbsoluteFill>
  );
};

/** S3 · The line every freelancer knows (from the DevAegis site): "We'll pay next week." → follow-up left on Seen. */
export const Chat: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ForgeBG heat={0.05} />
      <Slab f={l} at={0} x={560} y={110} w={800} h={860} from="below" style={{ background: "linear-gradient(180deg, rgba(20,20,26,0.95), rgba(8,8,12,0.97))" }}>
        <div style={{ height: 110, borderBottom: "1px solid #24242c", display: "flex", alignItems: "center", gap: 18, padding: "0 30px", fontFamily: T.sans }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#3a3a44", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 26 }}>N</div>
          <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 26 }}>Northwind Client</div><div style={{ color: "#8a8a94", fontSize: 17 }}>last seen 2:14 AM</div></div>
        </div>
        <div style={{ padding: "30px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
          <Bubble f={l} at={6} mine text="Final build is live. Invoice attached." size={38} />
          <Bubble f={l} at={20} text="We'll pay next week." size={48} />
          <div style={{ textAlign: "center", color: "#8a8a94", fontFamily: T.sans, fontSize: 24, opacity: io(l, [36, 42], [0, 1]), marginTop: 18 }}>2 weeks later</div>
          <Bubble f={l} at={44} mine text="Hi! Any update on INV-0042?" size={38} />
          <div style={{ textAlign: "right", color: "#8a8a94", fontFamily: T.sans, fontSize: 26, opacity: io(l, [58, 64], [0, 1]) }}>Seen 2:14 AM</div>
          <div style={{ opacity: io(l, [62, 66], [0, 1]) * (1 - io(l, [76, 80], [0, 1])), display: "flex", gap: 8, padding: "16px 22px", background: "#2a2a30", borderRadius: 26, width: 96 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: "#8a8a94", transform: `translateY(${-Math.abs(Math.sin(l * 0.3 + i)) * 6}px)` }} />)}
          </div>
        </div>
      </Slab>
      <div style={abs(1440, 460, { opacity: io(l, [70, 80], [0, 1]) })}>
        <Decrypt f={l} at={70} text="…nothing." size={52} color={T.cold} align="left" />
      </div>
    </AbsoluteFill>
  );
};

/** S4 · The hook headline. */
export const Ghosted: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ForgeBG heat={0.05} />
      <div style={abs(1180, 250, { opacity: 0.55 * io(l, [0, 20], [0, 1]) })}>
        <Vault3D l={l + 200} w={640} h={560} cold={1} heat={0.1} scale={0.9} />
      </div>
      <div style={abs(1270, 820, { opacity: 0.6 * io(l, [10, 24], [0, 1]), fontFamily: T.sans, color: T.cold, fontSize: 20, letterSpacing: 4, fontWeight: 700 })}>THEIR SERVER</div>
      <div style={abs(140, 360)}>
        <Decrypt f={l} at={4} text="They have your code." size={104} align="left" />
        <div style={{ height: 14 }} />
        <Decrypt f={l} at={38} text="*You* have nothing." size={104} align="left" color={T.cold} grad="linear-gradient(180deg,#dfe9ff,#8fa6c4)" />
      </div>
    </AbsoluteFill>
  );
};
