import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Kicker, MaskLines, Odometer, WordSwap } from "../../engine/Type";
import { CalendarGrid, LineDraw, Marquee, TagChip, Waveform } from "../../engine/Charts";
import { C, DISPLAY, FONT, blurF, easeInOut, easeOut, io, rgba } from "../../engine/util";
import { Crop, Reveal } from "../../engine/ui";
import { Laptop3D, Ring247_3D, Seal3D } from "../../engine/three/objects";
import { CreamBG, EspressoBG, MARK, WORK } from "./assets";

const abs = (left: number, top: number, x: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left, top, ...x });
const card = (): React.CSSProperties => ({ background: "#FFFDF9", borderRadius: 20, border: `1px solid ${rgba(C.ink, 0.08)}`, boxShadow: `0 24px 60px ${rgba("#3A2A15", 0.14)}`, fontFamily: FONT, color: C.ink });

/* S5 · Three stages. One system. */
const STAGES = [["I", "The Foundation", "Conversion websites"], ["II", "The Engine", "Paid ads & social"], ["III", "The Machine", "AI automation"]];
export const Stages: React.FC = () => {
  const l = useCurrentFrame();
  const line = io(l, [26, 56], [0, 1], easeInOut);
  return (
    <AbsoluteFill>
      <CreamBG />
      <div style={abs(0, 150, { right: 0 })}>
        <MaskLines f={l} start={2} stagger={6} lines={["Three stages.", "*One system.*"]} size={120} color={C.ink} accent={C.violet} />
      </div>
      <div style={abs(300, 648, { width: 1320 * line, height: 2, background: C.violet })} />
      <div style={abs(230, 560, { display: "flex", gap: 120 })}>
        {STAGES.map(([n, t, d], i) => (
          <Reveal key={n} l={l} at={22 + i * 8} y={30}>
            <div style={{ ...card(), width: 400, padding: "26px 30px", display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 64, color: C.violet, lineHeight: 1, width: 70 }}>{n}</div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 36 }}>{t}</div>
                <div style={{ fontSize: 19, color: C.muted, marginTop: 2 }}>{d}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* S6 · I · The Foundation — 3D laptop with real client builds; 2–5× conversions; live in 7–10 days. */
export const Foundation: React.FC = () => {
  const l = useCurrentFrame();
  const days = io(l, [96, 140], [0, 1], easeInOut);
  return (
    <AbsoluteFill>
      <CreamBG />
      <div style={abs(760, 120)}><Laptop3D l={l} at={2} src={WORK.ghostboard} src2={WORK.badbros} swapAt={120} w={1160} h={820} /></div>
      <div style={abs(140, 180)}>
        <Kicker f={l} at={4} text="I · The Foundation" />
        <div style={{ height: 24 }} />
        <MaskLines f={l} start={8} stagger={6} lines={["A website", "that *sells.*"]} size={108} align="left" color={C.ink} accent={C.violet} />
        <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
          {["Researched design", "Sales copy", "On-page SEO"].map((t, i) => (
            <Reveal key={t} l={l} at={34 + i * 5} y={14}><TagChip text={t} /></Reveal>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 40 }}>
          <Odometer f={l} start={52} dur={30} value="5" prefix="2–" suffix="×" size={110} color={C.ink} font={DISPLAY} weight={400} />
          <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, paddingBottom: 22, opacity: io(l, [60, 72], [0, 1]) }}>more conversions<br />from the same traffic</div>
        </div>
        <div style={{ marginTop: 28, opacity: io(l, [92, 104], [0, 1]) }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: 520, fontFamily: FONT, fontSize: 18, color: C.muted, fontWeight: 600, letterSpacing: 1 }}>
            <span>DAY 1</span><span style={{ color: C.violet }}>LIVE · DAY 7–10</span>
          </div>
          <div style={{ width: 520, height: 10, borderRadius: 5, background: rgba(C.ink, 0.08), marginTop: 8, position: "relative" }}>
            <div style={{ width: `${days * 100}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${C.violet2}, ${C.violet})` }} />
            <div style={{ position: "absolute", left: "70%", right: 0, top: -4, bottom: -4, borderRadius: 7, border: `1.5px dashed ${C.violet}` }} />
          </div>
        </div>
        <div style={{ marginTop: 26, opacity: io(l, [112, 124], [0, 1]) }}><TagChip text="From $900 · one-time" /></div>
      </div>
      {[["Conversion-first layout", 1180, 170, 70], ["SEO baked in", 1560, 250, 82]].map(([t, x, y, at]) => {
        const p = io(l, [at as number, (at as number) + 12], [0, 1]);
        return (
          <div key={t as string} style={abs(x as number, y as number, { ...card(), padding: "12px 18px", fontSize: 19, fontWeight: 600, display: "flex", gap: 10, alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 16}px) scale(${0.92 + 0.08 * p})` })}>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: C.green, color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>{t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* S7 · II · The Engine — creatives fan out, platforms, weekly report: cost ↓ revenue ↑. */
const CREATIVES: { src: string; video: boolean; sx: number; sw: number }[] = [
  { src: WORK.cricket11, video: true, sx: 1150, sw: 520 }, { src: WORK.hismile, video: true, sx: 120, sw: 520 },
  { src: WORK.statsedge, video: false, sx: 0, sw: 1100 }, { src: WORK.chainbox, video: false, sx: 400, sw: 1100 },
  { src: WORK.idps, video: false, sx: 300, sw: 1100 }, { src: WORK.shiba, video: false, sx: 200, sw: 1100 },
];
export const Engine: React.FC = () => {
  const l = useCurrentFrame();
  const fan = io(l, [14, 44], [0, 1], easeOut);
  const lift = io(l, [96, 118], [0, 1], easeInOut);
  const chart = io(l, [110, 170], [0, 1], easeInOut);
  return (
    <AbsoluteFill>
      <CreamBG />
      <div style={abs(140, 180)}>
        <Kicker f={l} at={4} text="II · The Engine" />
        <div style={{ height: 24 }} />
        <MaskLines f={l} start={8} stagger={6} lines={["Ads that find", "*ready buyers.*"]} size={100} align="left" color={C.ink} accent={C.violet} />
        <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
          {["Meta", "Google", "LinkedIn"].map((t, i) => <Reveal key={t} l={l} at={30 + i * 5} y={14}><TagChip text={t} /></Reveal>)}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, marginTop: 34, lineHeight: 1.45, opacity: io(l, [50, 64], [0, 1]) }}>
          <b style={{ color: C.ink }}>2 video + 4 banner</b> creatives every month<br />Weekly reports with real numbers
        </div>
        <div style={{ marginTop: 26, opacity: io(l, [70, 82], [0, 1]) }}><TagChip text="From $700 / month" /></div>
      </div>
      {/* creative fan */}
      <div style={abs(1310, 470 - lift * 170, { transform: `scale(${1 - lift * 0.22})` })}>
        {CREATIVES.map((c, i) => {
          const k = i - 2.5;
          const rot = k * 9 * fan;
          const x = k * 118 * fan;
          const w = c.video ? 180 : 300, h = c.video ? 320 : 200;
          const p = io(l, [8 + i * 3, 20 + i * 3], [0, 1]);
          return (
            <div key={i} style={{ position: "absolute", left: x - w / 2, top: -h / 2 + Math.abs(k) * 16 * fan, width: w, height: h, borderRadius: 16, overflow: "hidden", transform: `rotate(${rot}deg)`, transformOrigin: "50% 160%", boxShadow: "0 20px 44px rgba(28,22,18,0.28)", border: "3px solid #FFFDF9", opacity: p }}>
              <Crop src={c.src} srcW={1920} sx={c.sx} sy={0} sw={c.sw} w={w} h={h} />
              {c.video && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 54, height: 54, borderRadius: 27, background: "rgba(255,253,249,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.ink, paddingLeft: 4 }}>▶</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* weekly report */}
      <div style={abs(1000, 540, { opacity: io(l, [100, 114], [0, 1]), transform: `translateY(${(1 - io(l, [100, 118], [0, 1])) * 60}px)` })}>
        <div style={{ ...card(), width: 780, padding: "26px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 36 }}>Weekly report</div>
            <div style={{ fontSize: 16, color: C.muted, letterSpacing: 2, fontWeight: 600 }}>WEEK 1 → 6</div>
          </div>
          <div style={{ display: "flex", gap: 30, marginTop: 18, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 16, color: C.muted, fontWeight: 600, marginBottom: 8 }}>COST PER RESULT <span style={{ color: C.green }}>▼</span></div>
              <LineDraw id="cpr" p={chart} points={[0.92, 0.8, 0.84, 0.6, 0.48, 0.36, 0.3, 0.2]} w={330} h={150} color={C.violet} />
            </div>
            <div>
              <div style={{ fontSize: 16, color: C.muted, fontWeight: 600, marginBottom: 8 }}>REVENUE <span style={{ color: C.green }}>▲</span></div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 150 }}>
                {[0.22, 0.3, 0.42, 0.5, 0.66, 0.86].map((v, i) => (
                  <div key={i} style={{ width: 44, height: `${v * io(l, [118 + i * 6, 140 + i * 6], [0, 1], easeOut) * 100}%`, borderRadius: "8px 8px 3px 3px", background: i === 5 ? C.violet : rgba(C.violet2, 0.55) }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* S8 · III · The Machine (dark) — AI receptionist answers a 2 AM call in 4 languages; 24/7 ring; leads stack. */
const LANGS: [string, string, string][] = [
  ["EN", "Hi! Thanks for calling — how can I help?", "InterTight"],
  ["AR", "مرحباً! كيف يمكنني مساعدتك اليوم؟", "NotoArabic"],
  ["RU", "Здравствуйте! Чем могу помочь?", "InterTightCyr"],
  ["FR", "Bonjour ! Comment puis-je vous aider ?", "InterTight"],
];
const NOTES = ["Call answered · 02:14 AM", "Lead qualified · budget confirmed", "Meeting booked · Tue 10:30"];
export const Machine: React.FC = () => {
  const l = useCurrentFrame();
  const li = Math.min(3, Math.max(0, Math.floor((l - 40) / 24)));
  const lp = io(l - 40 - li * 24, [0, 10], [0, 1]);
  return (
    <AbsoluteFill>
      <EspressoBG glow={1.2} />
      <div style={abs(140, 190)}>
        <Kicker f={l} at={4} text="III · The Machine" color={C.textOnDarkMuted} />
        <div style={{ height: 24 }} />
        <MaskLines f={l} start={8} stagger={6} lines={["Every lead", "answered. *24/7.*"]} size={100} align="left" color={C.textOnDark} accent={C.violet2} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30, width: 620 }}>
          {["AI receptionist", "Cold caller", "Email manager", "Lead capture"].map((t, i) => <Reveal key={t} l={l} at={30 + i * 4} y={14}><TagChip text={t} dark /></Reveal>)}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 36 }}>
          <Odometer f={l} start={70} dur={30} value="40" prefix="35–" suffix="%" size={96} color={C.violet2} font={DISPLAY} weight={400} />
          <div style={{ fontFamily: FONT, fontSize: 22, color: C.textOnDarkMuted, paddingBottom: 18, opacity: io(l, [78, 90], [0, 1]) }}>usual revenue bump<br />from The Machine alone</div>
        </div>
        <div style={{ marginTop: 22, opacity: io(l, [104, 116], [0, 1]) }}><TagChip text="From $2K setup" dark /></div>
      </div>
      {/* phone */}
      <div style={abs(900, 130)}>
        <Reveal l={l} at={6} y={70}>
          <div style={{ width: 400, height: 810, borderRadius: 58, background: "#1A1512", padding: 12, boxSizing: "border-box", boxShadow: `0 50px 120px rgba(0,0,0,0.6), 0 0 0 2px ${rgba(C.violet2, 0.35)}` }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 46, background: `linear-gradient(180deg, #2A221C, #120E0B)`, padding: "40px 26px", boxSizing: "border-box", fontFamily: FONT, color: C.textOnDark, position: "relative", overflow: "hidden" }}>
              <div style={{ textAlign: "center", fontSize: 15, letterSpacing: 2, color: C.textOnDarkMuted }}>INCOMING · 02:14 AM</div>
              <div style={{ width: 96, height: 96, borderRadius: 48, margin: "22px auto 0", background: rgba(C.violet2, 0.18), border: `2px solid ${C.violet2}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 44, color: C.violet2 }}>AI</div>
              <div style={{ textAlign: "center", fontFamily: DISPLAY, fontSize: 32, marginTop: 14 }}>WebEpex Receptionist</div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
                <Waveform l={l} w={300} h={70} color={C.violet2} active={io(l, [30, 40], [0.2, 1])} />
              </div>
              <div style={{ marginTop: 26, background: rgba(C.violet2, 0.12), border: `1px solid ${rgba(C.violet2, 0.3)}`, borderRadius: 18, padding: "16px 18px", minHeight: 120 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {LANGS.map(([code], i) => (
                    <span key={code} style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, padding: "4px 9px", borderRadius: 8, background: i === li && l >= 40 ? C.violet2 : "transparent", color: i === li && l >= 40 ? C.bg : C.textOnDarkMuted, border: `1px solid ${rgba(C.violet2, 0.4)}` }}>{code}</span>
                  ))}
                </div>
                {l >= 40 && (
                  <div style={{ fontFamily: LANGS[li][2], fontSize: 21, lineHeight: 1.35, direction: li === 1 ? "rtl" : "ltr", opacity: lp, filter: blurF((1 - lp) * 6), transform: `translateY(${(1 - lp) * 8}px)` }}>{LANGS[li][1]}</div>
                )}
              </div>
              <div style={{ position: "absolute", left: 26, right: 26, bottom: 36, display: "flex", justifyContent: "center", gap: 60 }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✆</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      {/* 24/7 ring + lead stack */}
      <div style={abs(1370, 110)}>
        <Ring247_3D l={l} at={20} size={440} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 88, color: C.textOnDark, lineHeight: 1 }}>24/7</div>
          <div style={{ fontFamily: FONT, fontSize: 15, letterSpacing: 3, color: C.textOnDarkMuted, marginTop: 6 }}>ZERO MISSED CALLS</div>
        </div>
      </div>
      <div style={abs(1400, 590, { display: "flex", flexDirection: "column", gap: 14 })}>
        {NOTES.map((n, i) => {
          const p = io(l, [96 + i * 20, 108 + i * 20], [0, 1]);
          return (
            <div key={n} style={{ opacity: p, transform: `translateX(${(1 - p) * 40}px)`, background: "rgba(245,240,232,0.06)", border: `1px solid ${rgba(C.violet2, 0.3)}`, borderRadius: 16, padding: "14px 18px", fontFamily: FONT, fontSize: 19, color: C.textOnDark, display: "flex", gap: 12, alignItems: "center", width: 380 }}>
              <span style={{ width: 24, height: 24, borderRadius: 12, background: C.green, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</span>{n}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* S9 · The guarantee, proven: 45-day calendar fills, conversion line crosses +25%, seal stamps. */
export const Calendar: React.FC = () => {
  const l = useCurrentFrame();
  const line = io(l, [22, 96], [0, 1], (t) => t);
  return (
    <AbsoluteFill>
      <CreamBG />
      <div style={abs(140, 250)}>
        <Kicker f={l} at={4} text="The guarantee" />
        <div style={{ height: 24 }} />
        <MaskLines f={l} start={8} stagger={6} lines={["*+25%* in 45 days.", "Or every penny back."]} size={88} align="left" color={C.ink} accent={C.violet} />
        <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, marginTop: 30, lineHeight: 1.45, opacity: io(l, [40, 54], [0, 1]) }}>
          No magic wand. Just a system, a team,<br />and ruthless focus on one number.
        </div>
      </div>
      <div style={abs(1010, 330)}>
        <CalendarGrid l={l} start={18} days={45} cols={9} cell={70} gap={10} perDay={1.65} fill={C.violet2} text={C.muted} highlightLast={C.violet} />
      </div>
      <div style={abs(1010, 190)}>
        <div style={{ position: "relative", width: 710, height: 120 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 26, borderTop: `2px dashed ${C.violet}`, opacity: io(l, [16, 26], [0, 1]) }} />
          <div style={{ position: "absolute", right: 0, top: -2, fontFamily: FONT, fontSize: 16, fontWeight: 700, letterSpacing: 2, color: C.violet, opacity: io(l, [16, 26], [0, 1]) }}>+25% TARGET</div>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <LineDraw id="conv" p={line} points={[0.02, 0.06, 0.12, 0.2, 0.32, 0.46, 0.6, 0.76, 0.88, 1.0]} w={710} h={110} color={C.green} stroke={4} />
          </div>
        </div>
      </div>
      <div style={abs(1600, 640)}>
        <Seal3D l={l} at={98} size={300} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 52, color: C.violet2, opacity: io(l, [110, 120], [0, 1]) }}>✓</div>
      </div>
    </AbsoluteFill>
  );
};

/* S10 · Niches + regions, two opposing lanes. */
export const Lanes: React.FC = () => {
  const l = useCurrentFrame();
  return (
    <AbsoluteFill>
      <EspressoBG />
      <div style={abs(0, 150, { right: 0, textAlign: "center", fontFamily: FONT, fontSize: 20, letterSpacing: 5, fontWeight: 600, color: C.textOnDarkMuted, opacity: io(l, [2, 12], [0, 1]) })}>BUILT FOR COMPETITIVE NICHES · WORLDWIDE</div>
      <div style={abs(0, 290, { right: 0, overflow: "hidden", opacity: io(l, [0, 10], [0, 1]) })}>
        <Marquee l={l} items={["Trading", "Crypto", "Options", "E-sports", "Finance", "Luxury", "SaaS", "D2C"]} speed={9} dir={-1} size={150} color={C.textOnDark} font={DISPLAY} italic offset={0} />
      </div>
      <div style={abs(0, 560, { right: 0, overflow: "hidden", opacity: io(l, [6, 16], [0, 1]) })}>
        <Marquee l={l} items={["GCC", "USA", "Europe", "Canada", "India"]} speed={9} dir={1} size={120} color={C.violet2} font={FONT} offset={-2400} />
      </div>
      <div style={abs(0, 820, { right: 0, textAlign: "center" })}>
        <MaskLines f={l} start={14} lines={["Same-day reply. *Worldwide.*"]} size={54} color={C.textOnDark} accent={C.violet2} />
      </div>
    </AbsoluteFill>
  );
};
