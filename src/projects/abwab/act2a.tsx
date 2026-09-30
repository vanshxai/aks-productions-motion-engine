import React from "react";
import { AbsoluteFill, Easing, Img, useCurrentFrame } from "remotion";
import { Brackets, ScanLine } from "../../engine/Scan";
import { Cascade, GlowPill, Word } from "../../engine/Text";
import { C, FONT, blurF, easeIn, easeInOut, io } from "../../engine/util";
import { CheckDot, Crop, Icon, Reveal, Spinner, count, glassCard, whiteCard } from "../../engine/ui";
import { A } from "./assets";
import { Stream3D } from "../../engine/three/shots";

const W = (s: string, accent: string[] = []): Word[] => s.split(" ").map((t) => ({ t, accent: accent.includes(t) }));
const abs = (left: number, top: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left, top, ...extra });

/* ───────── B1 · Pipeline ───────── */
const STEPS = [
  { k: "Intake", d: "Digital application, no RM", i: "inbox" },
  { k: "Parse & enrich", d: "Statements, CR, SIMAH, Qawaem", i: "doc" },
  { k: "Decision", d: "Your rules + AI, real time", i: "spark" },
  { k: "Price & offer", d: "Risk-based terms, audit log", i: "tag" },
  { k: "Monitor & grow", d: "24/7 signals, next best action", i: "pulse" },
];
export const Pipeline: React.FC = () => {
  const l = useCurrentFrame();
  const p = io(l, [20, 74], [0, 1], easeInOut);
  const x0 = 360, span = 1200, y = 590;
  return (
    <AbsoluteFill>
      <div style={abs(0, 110, { right: 0 })}><GlowPill f={l} start={0} text="The platform" size={24} maxW={300} /></div>
      <div style={abs(0, 190, { right: 0 })}><Cascade f={l} start={4} stagger={3} size={66} words={W("One decisioning pipeline.")} /></div>
      <div style={abs(0, 275, { right: 0 })}><Cascade f={l} start={12} stagger={3} size={66} words={W("Raw documents to a funded loan.", ["funded", "loan."])} /></div>
      <div style={abs(x0 - 50, y - 110)}>
        <Stream3D l={l} p={p} w={span + 100} h={220} span={span} />
      </div>
      {/* track */}
      <div style={abs(x0, y - 1, { width: span, height: 2, background: "rgba(255,255,255,0.12)", opacity: io(l, [10, 20], [0, 1]) })} />
      <div style={abs(x0, y - 2, { width: span * p, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${C.violet}, ${C.lilac})`, boxShadow: "0 0 16px rgba(139,92,246,0.9)" })} />
      {p > 0 && p < 1 && <div style={abs(x0 + span * p - 9, y - 9, { width: 18, height: 18, borderRadius: 9, background: "#fff", boxShadow: "0 0 24px 8px rgba(167,139,250,0.9)" })} />}
      {STEPS.map((s, i) => {
        const a = Math.max(0, Math.min(1, (p - i / 4) / 0.04 + 1));
        const on = p >= i / 4 - 0.001;
        const pop = on ? 1 + 0.12 * Math.sin(Math.PI * Math.min(1, (p - i / 4) / 0.08)) : 1;
        const cx = x0 + (span / 4) * i;
        return (
          <div key={s.k} style={abs(cx - 150, y - 52, { width: 300, display: "flex", flexDirection: "column", alignItems: "center", opacity: io(l, [8 + i * 2, 18 + i * 2], [0, 1]) })}>
            <div style={{ width: 104, height: 104, borderRadius: 52, display: "flex", alignItems: "center", justifyContent: "center", background: on ? `radial-gradient(circle, ${C.violet2}, ${C.violet})` : "#16121F", border: `2px solid ${on ? C.lilac : "rgba(196,181,253,0.3)"}`, boxShadow: on ? "0 0 40px rgba(139,92,246,0.8)" : "none", transform: `scale(${pop})` }}>
              <Icon name={s.i} size={44} color={on ? "#fff" : "#8D84A8"} />
            </div>
            <div style={{ marginTop: 26, fontFamily: FONT, fontSize: 30, fontWeight: 600, color: on ? "#fff" : "#8D84A8" }}>{s.k}</div>
            <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 20, color: "#A99FC4", textAlign: "center", opacity: a, filter: blurF((1 - a) * 6), width: 260 }}>{s.d}</div>
          </div>
        );
      })}
      <div style={abs(0, 880, { right: 0 })}>
        <Cascade f={l} start={70} stagger={2} size={30} weight={400} color="#B9AEDB" words={W("Plugs into your stack. No core replacement.", ["No", "core", "replacement."])} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────── B2 · Loan Origination → eligibility funnel ───────── */
const ROWS: [string, string][] = [["Intake", "Captured"], ["KYC & onboarding", "Verified"], ["Documents", "Parsed"], ["Eligibility", "Auto-scored"], ["Decision-ready", "Approve"]];
const FUNNEL = [
  { k: "Internal criteria", c: "$", v: 100 },
  { k: "CR · Kafalah · sector", c: "$", v: 62 },
  { k: "Wathiq · open banking · Qawaem", c: "$$", v: 34 },
  { k: "SIMAH bureau", c: "$$$", v: 14 },
];
export const Origination: React.FC = () => {
  const l = useCurrentFrame();
  const sw = io(l, [62, 72], [0, 1], easeIn);
  const mins = Math.round(io(l, [12, 58], [0, 8]));
  return (
    <AbsoluteFill>
      {/* left copy, phase A */}
      <div style={abs(170, 300, { opacity: 1 - sw, filter: blurF(sw * 10) })}>
        <GlowPill f={l} start={2} text="Loan Origination" size={24} maxW={340} align="flex-start" />
        <div style={{ height: 34 }} />
        <Cascade f={l} start={8} stagger={3} size={92} justify="flex-start" words={W("Minutes,")} />
        <Cascade f={l} start={14} stagger={3} size={92} justify="flex-start" words={W("not weeks.", ["weeks."])} />
        <div style={{ height: 26 }} />
        <Cascade f={l} start={22} stagger={3} size={38} weight={400} color="#B9AEDB" justify="flex-start" words={W("No RM. No branch. Fully digital.")} />
      </div>
      {/* left copy, phase B */}
      {l > 64 && (
        <div style={abs(170, 330)}>
          <Cascade f={l} start={68} stagger={3} size={84} justify="flex-start" words={W("Cheapest checks")} />
          <Cascade f={l} start={74} stagger={3} size={84} justify="flex-start" words={W("first.", ["first."])} />
          <div style={{ height: 26 }} />
          <Cascade f={l} start={82} stagger={3} size={36} weight={400} color="#B9AEDB" justify="flex-start" words={W("Pay for expensive data only when it's worth it.")} />
        </div>
      )}
      {/* application card */}
      <div style={abs(1040, 210, { opacity: 1 - sw, filter: blurF(sw * 12), transform: `scale(${1 - sw * 0.05})` })}>
        <Reveal l={l} at={2} y={60}>
          <div style={{ ...whiteCard(), width: 700, padding: 36, boxSizing: "border-box" }}>
            <div style={{ fontSize: 14, color: C.muted, background: "#F4F3F8", borderRadius: 8, padding: "6px 14px", display: "inline-block" }}>app.abwab.ai/origination</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>Application #5102</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.violet, background: "rgba(124,58,237,0.1)", borderRadius: 999, padding: "8px 16px" }}>Retail SME · SAR 250k</div>
            </div>
            <div style={{ marginTop: 22 }}>
              {ROWS.map(([k, v], i) => {
                const t = l - (12 + i * 9);
                const last = i === 4;
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 16, height: 62, borderTop: "1px solid #F1EEF7" }}>
                    {t < 0 ? <div style={{ width: 26, height: 26, borderRadius: 13, border: "1.6px solid #D6D2E2" }} /> : t < 5 ? <Spinner l={l} size={26} /> : <CheckDot p={io(t, [5, 11], [0, 1])} />}
                    <div style={{ flex: 1, fontSize: 20, fontWeight: 600, color: t < 0 ? "#9CA3AF" : C.ink }}>{k}</div>
                    {t >= 5 &&
                      (last ? (
                        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, color: "#008236", background: "#DBFCE7", borderRadius: 8, padding: "6px 12px", transform: `scale(${io(t, [5, 10], [0.7, 1])})` }}>APPROVE</div>
                      ) : (
                        <div style={{ fontSize: 17, color: C.muted, opacity: io(t, [5, 10], [0, 1]) }}>{v}</div>
                      ))}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F3EEFF", borderRadius: 14, padding: "14px 20px" }}>
              <span style={{ fontSize: 17, color: C.violet, fontWeight: 600 }}>Elapsed · {mins} min</span>
              <span style={{ fontSize: 17, color: C.violet, fontWeight: 600, opacity: io(l, [56, 62], [0, 1]) }}>No analyst touch</span>
            </div>
          </div>
        </Reveal>
      </div>
      {/* eligibility funnel */}
      {l > 66 && (
        <div style={abs(1040, 230)}>
          <Reveal l={l} at={68} y={40}>
            <div style={{ ...glassCard(), width: 700, padding: "30px 36px", boxSizing: "border-box", fontFamily: FONT }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#A99FC4", fontSize: 18, letterSpacing: 1.6, fontWeight: 600 }}>
                <span>ELIGIBILITY PIPELINE</span><span>PASS RATE</span>
              </div>
              {FUNNEL.map((r, i) => {
                const p = io(l, [74 + i * 7, 90 + i * 7], [0, 1]);
                const last = i === 3;
                return (
                  <div key={r.k} style={{ marginTop: 26, opacity: io(l, [72 + i * 7, 80 + i * 7], [0, 1]) }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, color: "#fff", fontWeight: 500 }}>
                      <span>{r.k} <span style={{ color: last ? "#FBBF24" : C.lilac, fontWeight: 700, marginLeft: 8 }}>{r.c}</span></span>
                      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{Math.round(r.v * p)}%</span>
                    </div>
                    <div style={{ marginTop: 10, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.08)" }}>
                      <div style={{ width: `${r.v * p}%`, height: "100%", borderRadius: 9, background: last ? `linear-gradient(90deg, ${C.violet}, #F472B6)` : `linear-gradient(90deg, ${C.violet}, ${C.lilac})`, boxShadow: last ? "0 0 20px rgba(244,114,182,0.8)" : "0 0 12px rgba(139,92,246,0.6)" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 26, fontSize: 18, color: "#D9D0F5", opacity: io(l, [104, 112], [0, 1]) }}>
                ✦ SIMAH, the most expensive check, runs last, on survivors only.
              </div>
            </div>
          </Reveal>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ───────── B3 · Data partners → real Live Pulse report, scanned ───────── */
const PARTNERS = [
  ["integrations/simah.png", 1875, 1103],
  ["integrations/lean.webp", 1250, 498],
  ["integrations/tarabut.webp", 2276, 640],
  ["integrations/qawaem.png", 719, 229],
  ["integrations/gosi.png", 1280, 516],
  ["integrations/bayan.png", 426, 104],
] as const;
const SLOTS = [[170, 360], [170, 540], [170, 720], [1510, 360], [1510, 540], [1510, 720]];
const K = 1100 / 952;
const HL = [
  { x: 30, y: 245, w: 690, h: 45, side: "left", tag: "CASH SHARE", v: "Flagged · −2", c: "#F87171", dy: -46 },
  { x: 30, y: 293, w: 690, h: 45, side: "left", tag: "GROWTH OF CREDIT", v: "+104% · +2", c: "#34D399", dy: 46 },
  { x: 752, y: 222, w: 150, h: 76, side: "right", tag: "TRANSACTIONS RISK", v: "Moderate", c: "#FBBF24", dy: 0 },
];
export const Signals: React.FC = () => {
  const l = useCurrentFrame();
  const head = 1 - io(l, [58, 66], [0, 1]);
  const s = l < 60 ? io(l, [40, 56], [0.55, 0.75]) : io(l, [60, 80], [0.75, 1], easeInOut);
  return (
    <AbsoluteFill>
      <div style={abs(0, 140, { right: 0, opacity: head, filter: blurF((1 - head) * 10) })}>
        <Cascade f={l} start={2} stagger={3} size={80} words={W("It reads every signal.", ["every", "signal."])} />
      </div>
      {PARTNERS.map(([src, w, h], i) => {
        const [x, y] = SLOTS[i];
        const inP = io(l, [6 + i * 3, 18 + i * 3], [0, 1]);
        const fly = io(l, [32 + i * 2, 48 + i * 2], [0, 1], easeIn);
        const tx = (960 - (x + 120)) * fly, ty = (560 - (y + 48)) * fly;
        const ih = Math.min(58, (190 * h) / w);
        return (
          <div key={src} style={abs(x, y, { width: 240, height: 96, borderRadius: 22, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(196,181,253,0.35)", opacity: inP * (1 - io(fly, [0.7, 1], [0, 1])), filter: blurF((1 - inP) * 10 + fly * 4), transform: `translate(${tx + (1 - inP) * (i < 3 ? -60 : 60)}px, ${ty}px) scale(${1 - fly * 0.7})` })}>
            <Img src={A(src)} style={{ height: ih, maxWidth: 190, objectFit: "contain" }} />
          </div>
        );
      })}
      {/* report */}
      <div style={abs(960 - 550, 560 - 231, { width: 1100, height: 462, transform: `scale(${s})`, opacity: io(l, [40, 50], [0, 1]), filter: blurF(io(l, [40, 52], [12, 0])) })}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)" }}>
          <Crop src={A("report/profitability.png")} srcW={952} sx={0} sy={0} sw={952} w={1100} h={462} />
        </div>
        <ScanLine p={io(l, [72, 100], [0, 1], Easing.linear)} h={462} />
        <Brackets p={io(l, [66, 78], [0, 1])} w={1100} h={462} />
        {HL.map((hl, i) => {
          const p = io(l, [86 + i * 8, 96 + i * 8], [0, 1]);
          const left = hl.side === "left";
          return (
            <React.Fragment key={hl.tag}>
              <div style={{ position: "absolute", left: hl.x * K - 4, top: hl.y * K - 3, width: hl.w * K + 8, height: hl.h * K + 6, borderRadius: 10, boxShadow: `inset 0 0 0 3px rgba(124,58,237,${p}), 0 0 ${24 * p}px rgba(124,58,237,${0.5 * p})`, background: `rgba(124,58,237,${0.08 * p})` }} />
              {(() => {
                const ex = left ? hl.x * K - 4 : (hl.x + hl.w) * K + 4, ey = (hl.y + hl.h / 2) * K;
                const dx = left ? -70 : 70, len = Math.hypot(dx, hl.dy) * p, ang = (Math.atan2(hl.dy, dx) * 180) / Math.PI;
                return <div style={{ position: "absolute", left: ex, top: ey, width: len, height: 2, background: C.lilac2, opacity: p, transformOrigin: "0 50%", transform: `rotate(${ang}deg)` }} />;
              })()}
              <div style={{ position: "absolute", top: (hl.y + hl.h / 2) * K + hl.dy, ...(left ? { right: 1100 - hl.x * K + 70 } : { left: (hl.x + hl.w) * K + 70 }), transform: `translate(${(1 - p) * (left ? 24 : -24)}px, -50%)`, opacity: p, background: "rgba(22,18,31,0.94)", border: "1.5px solid rgba(196,181,253,0.55)", boxShadow: "0 0 28px rgba(139,92,246,0.45)", borderRadius: 14, padding: "12px 20px", whiteSpace: "nowrap", fontFamily: FONT, textAlign: left ? "right" : "left" }}>
                <div style={{ fontSize: 14, letterSpacing: 1.4, color: C.lilac, fontWeight: 600 }}>✦ {hl.tag}</div>
                <div style={{ fontSize: 28, color: hl.c, fontWeight: 700, marginTop: 2 }}>{hl.v}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={abs(0, 900, { right: 0 })}>
        <Cascade f={l} start={104} stagger={2} size={30} weight={400} color="#B9AEDB" words={W("Cashflow tells the real story. Trained on Saudi SME data.", ["real", "story."])} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────── B4 · Credit Decisioning: the site's hero card, rebuilt ───────── */
const BARS = [0.34, 0.46, 0.4, 0.58, 0.52, 0.74, 0.66, 0.9];
const BAR_C = ["#C4B5FD", "#B89BF7", "#A273F2", "#9560F0", "#874BEE", "#7F3FED", "#7D3BED", "#7C3AED"];
const POLICY: [string, string, string][] = [["DSCR ≥ 1.3", "Pass", "#34D399"], ["Sector in allowed list", "Pass", "#34D399"], ["Exposure ≤ SAR 500k", "Refer", "#FBBF24"], ["PEP / sanctions screen", "Clear", "#34D399"]];
export const Decision: React.FC = () => {
  const l = useCurrentFrame();
  const score = Math.round(io(l, [20, 56], [0, 742], easeInOut));
  const lim = count(l, 58, 18, 850000);
  const badge = (at: number) => ({ opacity: io(l, [at, at + 8], [0, 1]), transform: `scale(${io(l, [at, at + 10], [0.7, 1])})` });
  return (
    <AbsoluteFill>
      <div style={abs(150, 190)}>
        <GlowPill f={l} start={2} text="Credit Decisioning" size={24} maxW={360} align="flex-start" />
        <div style={{ height: 30 }} />
        <Cascade f={l} start={6} stagger={3} size={90} justify="flex-start" words={W("Your rules.")} />
        <Cascade f={l} start={12} stagger={3} size={90} justify="flex-start" words={W("Our engine.", ["Our", "engine."])} />
        <div style={{ height: 18 }} />
        <Cascade f={l} start={20} stagger={2} size={32} weight={400} color="#B9AEDB" justify="flex-start" words={W("No black box. Full audit trail on every decision.")} />
      </div>
      <div style={abs(150, 640)}>
        <Reveal l={l} at={36} y={30}>
          <div style={{ ...glassCard(), width: 660, padding: "22px 28px", boxSizing: "border-box", fontFamily: FONT }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: "#fff" }}>Credit policy</span>
              <span style={{ fontSize: 15, color: C.lilac, border: "1px solid rgba(196,181,253,0.4)", borderRadius: 999, padding: "4px 12px" }}>v12 · active</span>
            </div>
            {POLICY.map(([k, v, c], i) => {
              const t = l - (44 + i * 7);
              return (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 50, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize: 20, color: "#E6E1F2" }}>{k}</span>
                  {t < 0 ? <span style={{ color: "#6F6688" }}>—</span> : t < 5 ? <Spinner l={l} size={20} color={C.lilac} /> : (
                    <span style={{ fontSize: 16, fontWeight: 700, color: c, background: `${c}22`, borderRadius: 8, padding: "5px 12px", transform: `scale(${io(t, [5, 10], [0.7, 1])})` }}>{v}</span>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
      {/* hero card */}
      <div style={abs(930, 230)}>
        <Reveal l={l} at={2} y={70}>
          <div style={{ ...whiteCard(), width: 840, padding: 34, boxSizing: "border-box", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ fontSize: 14, color: C.muted, background: "#F4F3F8", borderRadius: 8, padding: "6px 16px" }}>🔒 app.abwab.ai/decisioning</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 20 }}>
              <div>
                <div style={{ fontSize: 16, color: C.muted }}>Credit assessment · #4821</div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>Najd Trading Est.</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1.2, color: "#008236", background: "#DBFCE7", borderRadius: 10, padding: "9px 16px", boxShadow: `0 0 ${io(l, [74, 80, 96], [0, 26, 0])}px rgba(0,201,80,0.7)`, ...badge(74) }}>APPROVE</div>
            </div>
            <div style={{ display: "flex", gap: 36, marginTop: 24 }}>
              <div style={{ width: 350 }}>
                <div style={{ fontSize: 16, color: C.muted }}>Risk score</div>
                <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{score}</div>
                <div style={{ height: 10, borderRadius: 5, background: "#EEEAF5", marginTop: 6 }}>
                  <div style={{ width: `${(score / 850) * 100}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${C.lilac}, ${C.violet})` }} />
                </div>
                <div style={{ marginTop: 20 }}>
                  {["Bank statements verified", "VAT returns matched", "SIMAH bureau pulled"].map((t, i) => (
                    <div key={t} style={{ display: "flex", gap: 12, alignItems: "center", height: 40, fontSize: 18, color: io(l, [24 + i * 10, 30 + i * 10], [0, 1]) > 0 ? C.ink : "#A1A1AA" }}>
                      <CheckDot p={io(l, [24 + i * 10, 32 + i * 10], [0, 1])} size={24} /> {t}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, color: C.muted }}>Cashflow, last 12 months</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 150, marginTop: 14 }}>
                  {BARS.map((b, i) => (
                    <div key={i} style={{ flex: 1, height: `${b * io(l, [12 + i * 3, 30 + i * 3], [0, 1]) * 100}%`, borderRadius: "6px 6px 2px 2px", background: BAR_C[i] }} />
                  ))}
                </div>
                <div style={{ marginTop: 18, background: "#F4F3F8", borderRadius: 12, padding: "12px 18px", opacity: io(l, [56, 62], [0, 1]) }}>
                  <div style={{ fontSize: 14, color: C.muted }}>Recommended limit</div>
                  <div style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>SAR {lim}</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", background: "#F3EEFF", borderRadius: 12, padding: "13px 18px", fontSize: 17, fontWeight: 600, color: C.violet, opacity: io(l, [82, 90], [0, 1]) }}>
              <span>● Decisioned in 1.2s</span><span>Next: upsell limit +25%</span>
            </div>
            <div style={{ position: "absolute", left: -46, top: -34, ...whiteCard(), borderRadius: 16, padding: "12px 18px", display: "flex", gap: 12, alignItems: "center", ...badge(96) }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="spark" size={22} color={C.violet} /></div>
              <div><div style={{ fontSize: 16, fontWeight: 700 }}>Auto-decisioned</div><div style={{ fontSize: 13, color: C.muted }}>No analyst touch</div></div>
            </div>
            <div style={{ position: "absolute", right: -40, bottom: -40, ...whiteCard(), borderRadius: 16, padding: "12px 18px", display: "flex", gap: 12, alignItems: "center", ...badge(104) }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#DBFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="shield" size={22} color="#008236" /></div>
              <div><div style={{ fontSize: 16, fontWeight: 700 }}>SAMA-ready</div><div style={{ fontSize: 13, color: C.muted }}>Full audit trail</div></div>
            </div>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
