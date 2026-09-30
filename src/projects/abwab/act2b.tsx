import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { Cascade, GlowPill, Word } from "../../engine/Text";
import { C, FONT, blurF, easeInOut, io } from "../../engine/util";
import { CheckDot, Icon, Reveal, count, glassCard, whiteCard } from "../../engine/ui";
import { MarkTile } from "./assets";
import { Ring3D, Shield3D } from "../../engine/three/shots";

const W = (s: string, accent: string[] = []): Word[] => s.split(" ").map((t) => ({ t, accent: accent.includes(t) }));
const abs = (left: number, top: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left, top, ...extra });

/* ───────── B5 · 1.2s ring → check ───────── */
export const Ring: React.FC = () => {
  const l = useCurrentFrame();
  const prog = io(l, [2, 24], [0, 1], easeInOut);
  const spin = io(l, [0, 24], [0, 280], easeInOut);
  const check = io(l, [24, 32], [0, 1]);
  const pop = 1 + 0.08 * Math.sin(Math.PI * io(l, [24, 34], [0, 1], Easing.linear));
  const R = 96, circ = 2 * Math.PI * R;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 36%, rgba(0,201,80,0.18), transparent 30%)", opacity: check }} />
      <div style={abs(960 - 230, 130)}>
        <Ring3D l={l} size={460} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 60, fontWeight: 600, color: "#fff", opacity: 1 - check, fontVariantNumeric: "tabular-nums" }}>
          {io(l, [2, 24], [0, 1.2], easeInOut).toFixed(1)}s
        </div>
      </div>
      <div style={abs(0, 590, { right: 0 })}>
        <Cascade f={l} start={26} stagger={3} size={72} weight={400} words={W("Approved. Priced. Logged.", ["Priced."])} />
      </div>
      <div style={abs(0, 720, { right: 0, display: "flex", justifyContent: "center", gap: 18 })}>
        {[["Decision", "Approve"], ["Amount", "SAR 250k"], ["Risk-based price", "14.5%"], ["Audit", "Logged"]].map(([k, v], i) => (
          <Reveal key={k} l={l} at={32 + i * 3} dur={10} y={16}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(196,181,253,0.35)", borderRadius: 14, padding: "14px 26px", fontFamily: FONT, display: "flex", gap: 12, alignItems: "baseline" }}>
              <span style={{ fontSize: 18, color: "#A99FC4" }}>{k}</span>
              <span style={{ fontSize: 28, fontWeight: 600, color: k === "Decision" ? "#3EE58A" : "#fff" }}>{v}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ───────── B6 · Agentic Credit Intelligence ───────── */
const TRIAGE = [
  { k: "Grow", n: 1204, a: "Upsell · raise limit", c: "#34D399", arrow: "▲" },
  { k: "Watch", n: 318, a: "Monitor cashflow", c: "#FBBF24", arrow: "◆" },
  { k: "Act now", n: 27, a: "Early outreach · restructure", c: "#F87171", arrow: "▼" },
];
const TICKER = [["▲", "POS volume +38%", "#34D399"], ["▲", "VAT filings up", "#34D399"], ["▼", "Payment delay 12d", "#F87171"], ["▲", "Strong repayment", "#34D399"], ["▼", "Covenant breach", "#F87171"], ["✦", "412 actions queued", C.lilac], ["▲", "Pre-qualified lead → LOS", "#34D399"]];
export const Agentic: React.FC = () => {
  const l = useCurrentFrame();
  const live = 0.5 + 0.5 * Math.sin(l / 4);
  return (
    <AbsoluteFill>
      <div style={abs(0, 100, { right: 0 })}><GlowPill f={l} start={0} text="Agentic Credit Intelligence" size={24} maxW={460} /></div>
      <div style={abs(0, 180, { right: 0 })}><Cascade f={l} start={4} stagger={3} size={70} words={W("A 24/7 virtual RM for your entire book.", ["24/7", "virtual", "RM"])} /></div>
      <div style={abs(0, 320, { right: 0, display: "flex", justifyContent: "center" })}>
        <Reveal l={l} at={14} y={20}>
          <div style={{ ...glassCard(), borderRadius: 999, padding: "16px 34px", display: "flex", alignItems: "center", gap: 18, fontFamily: FONT }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#3EE58A", boxShadow: `0 0 ${8 + live * 14}px #3EE58A` }} />
            <span style={{ fontSize: 44, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{count(l, 14, 34, 12480)}</span>
            <span style={{ fontSize: 24, color: "#B9AEDB" }}>SMEs monitored · live 24/7</span>
          </div>
        </Reveal>
      </div>
      <div style={abs(250, 460, { display: "flex", gap: 40 })}>
        {TRIAGE.map((t, i) => (
          <Reveal key={t.k} l={l} at={34 + i * 8} y={50}>
            <div style={{ ...glassCard(), width: 440, height: 260, padding: "28px 32px", boxSizing: "border-box", fontFamily: FONT, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 4, background: t.c, boxShadow: `0 0 20px ${t.c}` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 26, fontWeight: 600, color: t.c }}>{t.arrow} {t.k}</span>
                <span style={{ fontSize: 15, color: "#A99FC4", letterSpacing: 1.2 }}>RECOMMENDED</span>
              </div>
              <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 84, fontWeight: 700, color: "#fff", letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>{count(l, 36 + i * 8, 28, t.n)}</span>
                <span style={{ fontSize: 24, color: "#B9AEDB" }}>SMEs</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 21, color: "#E6E1F2" }}>→ {t.a}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <div style={abs(0, 780, { right: 0, height: 70, overflow: "hidden", opacity: io(l, [60, 72], [0, 1]), WebkitMaskImage: "linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)" })}>
        <div style={{ display: "flex", gap: 18, transform: `translateX(${200 - l * 4}px)`, whiteSpace: "nowrap" }}>
          {[...TICKER, ...TICKER, ...TICKER].map(([a, t, c], i) => (
            <div key={i} style={{ flexShrink: 0, display: "flex", gap: 10, alignItems: "center", fontFamily: FONT, fontSize: 22, color: "#E6E1F2", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "12px 22px" }}>
              <span style={{ color: c }}>{a}</span>{t}
            </div>
          ))}
        </div>
      </div>
      <div style={abs(0, 900, { right: 0 })}>
        <Cascade f={l} start={80} stagger={2} size={30} weight={400} color="#B9AEDB" words={W("It recommends. Your team approves.", ["Your", "team", "approves."])} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────── B7 · Embedded Financing ───────── */
const PLAT = ["Payroll", "E-commerce", "POS", "ERP"];
const LEND = ["Banks", "NBFIs", "Funds"];
export const Embedded: React.FC = () => {
  const l = useCurrentFrame();
  const notif = io(l, [14, 26], [0, 1]);
  const tap = io(l, [48, 52, 58], [0, 1, 0]);
  const ripple = io(l, [50, 66], [0, 1]);
  const funded = l >= 78;
  const px = 800, py = [470, 545, 620, 695], hub = { x: 1250, y: 582 }, lx = 1500, ly = [505, 582, 659];
  const draw = io(l, [26, 50], [0, 1]);
  return (
    <AbsoluteFill>
      {/* phone */}
      <div style={abs(250, 140)}>
        <Reveal l={l} at={0} y={80}>
          <div style={{ width: 400, height: 800, borderRadius: 60, background: "#0F0C18", padding: 12, boxSizing: "border-box", boxShadow: "0 50px 120px rgba(0,0,0,0.65), 0 0 0 2px #2A2438" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 48, background: "#FBF9FE", overflow: "hidden", position: "relative", fontFamily: FONT, color: C.ink }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 30px 0", fontSize: 16, fontWeight: 600 }}><span>9:41</span><span>●●● 􀙇</span></div>
              <div style={{ padding: "26px 26px 0" }}>
                <div style={{ fontSize: 15, color: C.muted }}>Payroll · September run</div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>SAR 184,300</div>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 58, borderBottom: "1px solid #EEEAF5" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 17, background: "#EDE9FE" }} />
                      <div style={{ width: 110 + ((i * 37) % 60), height: 10, borderRadius: 5, background: "#E4E1EC" }} />
                    </div>
                    <div style={{ width: 60, height: 10, borderRadius: 5, background: "#E4E1EC" }} />
                  </div>
                ))}
              </div>
              {/* offer */}
              <div style={{ position: "absolute", left: 14, right: 14, top: 64, transform: `translateY(${(1 - notif) * -220}px)`, opacity: notif, ...whiteCard(), borderRadius: 24, padding: 20, boxShadow: "0 20px 50px rgba(76,29,149,0.28)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MarkTile size={30} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Abwab financing</span>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: C.muted }}>now</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 14, lineHeight: 1.25, color: funded ? "#008236" : C.ink }}>{funded ? "Funded · SAR 250,000" : "You're pre-qualified for SAR 250,000"}</div>
                <div style={{ fontSize: 15, color: C.muted, marginTop: 6 }}>Working capital · 12 months</div>
                {l < 56 ? (
                  <div style={{ position: "relative", marginTop: 16, background: C.violet, color: "#fff", fontSize: 17, fontWeight: 600, textAlign: "center", borderRadius: 14, padding: "14px 0", transform: `scale(${1 - tap * 0.05})` }}>
                    Accept offer
                    <div style={{ position: "absolute", left: "50%", top: "50%", width: 54, height: 54, marginLeft: -27, marginTop: -27, borderRadius: 27, background: "rgba(255,255,255,0.35)", border: "2px solid rgba(255,255,255,0.8)", opacity: io(l, [40, 46, 54], [0, 1, 0]), transform: `scale(${1 - tap * 0.25})` }} />
                  </div>
                ) : (
                  <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
                    {["Notified", "One tap", "Funded"].map((s, i) => (
                      <div key={s} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14, fontWeight: 600 }}>
                        <CheckDot p={io(l, [56 + i * 8, 64 + i * 8], [0, 1])} size={22} /> {s}
                      </div>
                    ))}
                  </div>
                )}
                {ripple > 0 && ripple < 1 && <div style={{ position: "absolute", inset: 0, borderRadius: 24, boxShadow: `0 0 0 ${ripple * 26}px rgba(124,58,237,${0.3 * (1 - ripple)})` }} />}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      {/* copy */}
      <div style={abs(px, 150)}>
        <GlowPill f={l} start={4} text="Embedded Financing" size={24} maxW={360} align="flex-start" />
        <div style={{ height: 26 }} />
        <Cascade f={l} start={8} stagger={3} size={66} justify="flex-start" words={W("Reach SMEs where")} />
        <Cascade f={l} start={14} stagger={3} size={66} justify="flex-start" words={W("they already work.", ["already", "work."])} />
      </div>
      {/* network */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {py.map((y, i) => <path key={`p${i}`} d={`M ${px + 200} ${y + 25} C ${px + 330} ${y + 25}, ${hub.x - 150} ${hub.y}, ${hub.x - 60} ${hub.y}`} pathLength={1} fill="none" stroke="rgba(196,181,253,0.55)" strokeWidth={2} strokeDasharray="1 1" strokeDashoffset={1 - draw} />)}
        {ly.map((y, i) => <path key={`l${i}`} d={`M ${hub.x + 60} ${hub.y} C ${hub.x + 140} ${hub.y}, ${lx - 110} ${y + 25}, ${lx} ${y + 25}`} pathLength={1} fill="none" stroke="rgba(196,181,253,0.55)" strokeWidth={2} strokeDasharray="1 1" strokeDashoffset={1 - io(l, [40, 60], [0, 1])} />)}
      </svg>
      {l > 52 &&
        py.map((y, i) => {
          const t = (((l - 52) / 26 + i * 0.27) % 1);
          const x0 = px + 200, x1 = hub.x - 60;
          const xx = x0 + (x1 - x0) * t;
          const yy = y + 25 + (hub.y - y - 25) * (t * t * (3 - 2 * t));
          return <div key={i} style={abs(xx - 5, yy - 5, { width: 10, height: 10, borderRadius: 5, background: "#fff", boxShadow: "0 0 14px 4px rgba(167,139,250,0.9)" })} />;
        })}
      {PLAT.map((p, i) => (
        <div key={p} style={abs(px, py[i])}>
          <Reveal l={l} at={20 + i * 3} x={-30} y={0}>
            <div style={{ width: 200, height: 50, borderRadius: 14, ...glassCard(), boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 20, color: "#fff" }}>{p}</div>
          </Reveal>
        </div>
      ))}
      <div style={abs(hub.x - 60, hub.y - 60)}>
        <Reveal l={l} at={30} y={0} scale={0.6}>
          <div style={{ borderRadius: 30, boxShadow: `0 0 ${40 + 20 * Math.sin(l / 6)}px rgba(139,92,246,0.9)` }}><MarkTile size={120} /></div>
        </Reveal>
      </div>
      {LEND.map((p, i) => (
        <div key={p} style={abs(lx, ly[i])}>
          <Reveal l={l} at={46 + i * 3} x={30} y={0}>
            <div style={{ width: 190, height: 50, borderRadius: 14, background: "rgba(124,58,237,0.18)", border: "1px solid rgba(196,181,253,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 20, fontWeight: 600, color: "#fff" }}>{p}</div>
          </Reveal>
        </div>
      ))}
      <div style={abs(px, 820)}>
        <Reveal l={l} at={70} y={20}>
          <div style={{ display: "flex", gap: 16, alignItems: "baseline", fontFamily: FONT }}>
            <span style={{ fontSize: 60, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{count(l, 70, 24, 62)}%</span>
            <span style={{ fontSize: 26, color: "#B9AEDB" }}>match · <b style={{ color: "#fff" }}>{count(l, 70, 24, 154000)}</b> of 248,000 SMEs pre-qualified</span>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── B8 · Compliance ───────── */
const BADGES = [
  ["shield", "SAMA Cybersecurity Framework", "Aligned across all four domains"],
  ["lock", "PDPL-compliant", "Every borrower record protected"],
  ["moon", "Sharia-validated", "Independently reviewed structures"],
  ["server", "In-Kingdom data residency", "On-premise, behind your firewall"],
];
export const Compliance: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={abs(0, 70, { right: 0 })}><GlowPill f={l} start={0} text="Built in Saudi Arabia, for MENA" size={22} maxW={460} /></div>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 28%, rgba(124,58,237,0.35), transparent 22%)", opacity: io(l, [4, 20], [0, 1]) }} />
      <div style={abs(960 - 190, 130)}><Shield3D l={l} w={380} h={330} /></div>
      <div style={abs(0, 470, { right: 0 })}><Cascade f={l} start={12} stagger={3} size={70} words={W("Compliance built in, not bolted on.", ["built", "in,"])} /></div>
      <div style={abs(150, 590, { display: "flex", gap: 30 })}>
        {BADGES.map(([ic, t, d], i) => (
          <Reveal key={t} l={l} at={24 + i * 7} y={50}>
            <div style={{ ...glassCard(), width: 382, height: 250, padding: 28, boxSizing: "border-box", fontFamily: FONT }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${C.violet2}, ${C.violet})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(139,92,246,0.6)" }}>
                <Icon name={ic} size={34} />
              </div>
              <div style={{ marginTop: 22, fontSize: 27, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{t}</div>
              <div style={{ marginTop: 10, fontSize: 20, color: "#B9AEDB" }}>{d}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <div style={abs(0, 900, { right: 0 })}>
        <Cascade f={l} start={58} stagger={2} size={32} weight={400} color="#B9AEDB" words={W("Human-verified AI with a full audit trail on every decision.", ["full", "audit", "trail"])} />
      </div>
    </AbsoluteFill>
  );
};
