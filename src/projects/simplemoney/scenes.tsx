import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, DISPLAY, FONT, blurF, easeInOut, easeOut, io, rgba } from "../../engine/util";
import { MaskLines, Odometer, Underline } from "../../engine/Type";
import { LightSweep } from "../../engine/Wipe";
import { GOLD, KABIR, SERIF } from "./brand";
import { FINAL, emmaAt, jakeAt, short } from "./data";
import { CoinStacks3D } from "./Coins3D";

const W = 1080;

/* ───────── shared pieces ───────── */

export const Bg: React.FC<{ glowY?: number }> = ({ glowY = 108 }) => {
  const f = useCurrentFrame();
  const b = 0.85 + 0.15 * Math.sin(f / 30);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 40% at 50% ${glowY}%, ${rgba(C.glow, 0.85 * b)} 0%, ${rgba(C.glow, 0.3)} 35%, transparent 72%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 30% at 50% -6%, ${rgba(C.violet, 0.12)}, transparent 70%)` }} />
      <AbsoluteFill
        style={{
          opacity: 0.5,
          backgroundImage: `linear-gradient(${rgba("#ffffff", 0.035)} 1px, transparent 1px), linear-gradient(90deg, ${rgba("#ffffff", 0.035)} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${(f * 0.6) % 90}px`,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 45%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 45%, black, transparent)",
        }}
      />
    </AbsoluteFill>
  );
};

/** The Simple Money coin mark (2D). */
export const CoinMark: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle at 32% 28%, ${C.violet2}, ${C.violet} 45%, #14A86E)`, boxShadow: `0 0 ${size * 0.5}px ${rgba(C.violet, 0.45)}, inset 0 -${size * 0.06}px ${size * 0.1}px rgba(0,0,0,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
    <div style={{ position: "absolute", inset: size * 0.09, borderRadius: "50%", border: `${Math.max(2, size * 0.035)}px solid ${rgba(C.bgDeep, 0.35)}` }} />
    <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: size * 0.56, color: C.bgDeep, lineHeight: 1, marginTop: -size * 0.03 }}>$</span>
  </div>
);

const Label: React.FC<{ text: string; color?: string; size?: number; o?: number }> = ({ text, color = C.textOnDarkMuted, size = 26, o = 1 }) => (
  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: size * 0.2, color, textTransform: "uppercase", opacity: o }}>{text}</div>
);

const Pill: React.FC<{ f: number; at: number; children: React.ReactNode; color?: string; bg?: string; size?: number }> = ({ f, at, children, color = C.textOnDark, bg = rgba("#ffffff", 0.07), size = 36 }) => {
  const p = io(f, [at, at + 14], [0, 1]);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: `${size * 0.42}px ${size * 0.8}px`, borderRadius: 999, background: bg, border: `1.5px solid ${rgba(C.violet, 0.35)}`, fontFamily: FONT, fontWeight: 600, fontSize: size, color, clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 999px)`, transform: `translateY(${(1 - p) * 12}px)`, whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
};

/** Ledger row: small label + giant number that masks up. */
const BigRow: React.FC<{ f: number; at: number; label: string; value: string; after: string; color: string; arrow: "in" | "out" }> = ({ f, at, label, value, after, color, arrow }) => {
  const p = io(f, [at, at + 16], [0, 1]);
  const lp = io(f, [at - 4, at + 10], [0, 1]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: lp }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: rgba(color, 0.16), border: `2px solid ${rgba(color, 0.5)}`, display: "flex", alignItems: "center", justifyContent: "center", color, fontFamily: FONT, fontWeight: 700, fontSize: 30 }}>{arrow === "in" ? "↓" : "↑"}</div>
        <Label text={label} color={color} size={28} />
      </div>
      <div style={{ overflow: "hidden", paddingBottom: 16 }}>
        <div style={{ transform: `translateY(${(1 - p) * 105}%)`, display: "flex", alignItems: "baseline", gap: 22, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 176, letterSpacing: -6, color, lineHeight: 1.05, textShadow: `0 0 60px ${rgba(color, 0.35)}` }}>{value}</span>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 76, color: C.textOnDark, letterSpacing: -2 }}>{after}</span>
        </div>
      </div>
    </div>
  );
};

/* ───────── 1 · HOOK (0–90) ───────── */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const sub = io(f, [92, 104], [0, 1]);
  const bob = Math.sin(f / 5) * 6;
  return (
    <AbsoluteFill>
      <Bg />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70, paddingBottom: 140 }}>
        <BigRow f={f} at={6} label="Invest" value="$24K" after="more" color={GOLD} arrow="in" />
        <div style={{ width: 760 * io(f, [40, 58], [0, 1]), height: 2, background: `linear-gradient(90deg, transparent, ${rgba(C.violet, 0.6)}, transparent)` }} />
        <BigRow f={f} at={62} label="End up" value="$300K" after="richer" color={C.violet} arrow="out" />
        <div style={{ opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 10 }}>
          <span style={{ fontFamily: FONT, fontSize: 44, color: C.violet, transform: `translateY(${bob}px)` }}>↓</span>
        </div>
      </AbsoluteFill>
      <LightSweep f={f} at={64} dur={20} color={C.violet} opacity={0.35} />
    </AbsoluteFill>
  );
};

/* ───────── 2 · TWO FRIENDS (90–210) ───────── */
const FriendCard: React.FC<{ f: number; at: number; name: string; age: string; color: string; from: "left" | "right" }> = ({ f, at, name, age, color, from }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 120 } });
  const x = (1 - s) * (from === "left" ? -620 : 620);
  return (
    <div style={{ width: 440, padding: "44px 0 40px", borderRadius: 40, background: `linear-gradient(180deg, ${rgba("#ffffff", 0.08)}, ${rgba("#ffffff", 0.03)})`, border: `2px solid ${rgba(color, 0.45)}`, boxShadow: `0 30px 80px rgba(0,0,0,0.35), 0 0 70px ${rgba(color, 0.12)}`, transform: `translateX(${x}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 132, height: 132, borderRadius: "50%", background: rgba(color, 0.18), border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, color }}>{name[0]}</div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 60, color: C.textOnDark, letterSpacing: -1 }}>{name}</div>
      <Label text="starts at" size={24} />
      <Odometer f={f} start={at + 6} dur={30} value={age} size={170} color={color} weight={900} font={DISPLAY} />
    </div>
  );
};

export const Friends: React.FC = () => {
  const f = useCurrentFrame();
  const q = io(f, [104, 116], [0, 1]);
  return (
    <AbsoluteFill>
      <Bg glowY={100} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <MaskLines f={f} lines={["Two friends.", "*Same* plan."]} start={2} stagger={7} size={96} color={C.textOnDark} accent={C.violet} weight={800} />
        <div style={{ display: "flex", gap: 40, marginTop: 56 }}>
          <FriendCard f={f} at={4} name="Emma" age="22" color={C.violet} from="left" />
          <FriendCard f={f} at={64} name="Jake" age="32" color={KABIR} from="right" />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 52, flexWrap: "wrap", justifyContent: "center", width: 960 }}>
          <Pill f={f} at={84}>$200 / month</Pill>
          <Pill f={f} at={90}>10% a year</Pill>
          <Pill f={f} at={96}>till age 52</Pill>
        </div>
        <div style={{ marginTop: 44, opacity: q, filter: blurF((1 - q) * 8), fontFamily: SERIF, fontStyle: "italic", fontSize: 72, color: C.textOnDark }}>
          Who ends up <span style={{ color: C.violet }}>richer?</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────── 3 · RACE CHART (210–510) ───────── */
// local frames per age milestone, timed to the voiceover ("At thirty-two…" / "By forty-two…")
const AGE_F = [14, 62, 148, 230], AGES = [22, 32, 42, 52];
export const RACE = { start: AGE_F[0], end: AGE_F[3] };
export const ageAt = (f: number) => interpolate(f, AGE_F, AGES, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.linear });
export const frameOfAge = (a: number) => interpolate(a, AGES, AGE_F, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const CH = { x: 120, y: 620, w: 840, h: 620, max: 480000 };
const px = (age: number) => CH.x + ((age - 22) / 30) * CH.w;
const py = (v: number) => CH.y + CH.h - (v / CH.max) * CH.h;

const pathTo = (fn: (a: number) => number, a0: number, a1: number) => {
  if (a1 <= a0) return "";
  const n = Math.max(2, Math.ceil((a1 - a0) * 12));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    d += `${i ? "L" : "M"}${px(a).toFixed(1)} ${py(fn(a)).toFixed(1)}`;
  }
  return d;
};

const Tip: React.FC<{ age: number; v: number; color: string; below?: boolean; o: number }> = ({ age, v, color, below, o }) => {
  const x = px(age), y = py(v);
  const flip = x > CH.x + CH.w * 0.62;
  return (
    <>
      <div style={{ position: "absolute", left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: "50%", background: color, boxShadow: `0 0 0 8px ${rgba(color, 0.22)}, 0 0 30px ${color}`, opacity: o }} />
      <div style={{ position: "absolute", left: flip ? x - 24 : x + 24, top: below && !flip ? y - 32 : y - 84, transform: flip ? "translateX(-100%)" : undefined, padding: "8px 20px", borderRadius: 16, background: color, color: C.bgDeep, fontFamily: DISPLAY, fontWeight: 800, fontSize: 44, letterSpacing: -1, whiteSpace: "nowrap", opacity: o, fontVariantNumeric: "tabular-nums" }}>{short(v)}</div>
    </>
  );
};

const Callout: React.FC<{ f: number; at: number; until: number; children: React.ReactNode }> = ({ f, at, until, children }) => {
  const p = io(f, [at, at + 12], [0, 1]) * (1 - io(f, [until - 8, until], [0, 1]));
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 418, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 20}px) scale(${0.96 + p * 0.04})` }}>
      <div style={{ padding: "22px 36px", borderRadius: 28, background: rgba("#ffffff", 0.07), border: `1.5px solid ${rgba(C.violet, 0.35)}`, fontFamily: FONT, fontWeight: 600, fontSize: 40, color: C.textOnDark, whiteSpace: "nowrap" }}>{children}</div>
    </div>
  );
};

export const Race: React.FC = () => {
  const f = useCurrentFrame();
  const age = ageAt(f);
  const axes = io(f, [6, 26], [0, 1]);
  const kOn = age > 32;
  const tipO = io(f, [RACE.start, RACE.start + 6], [0, 1]);
  const kTipO = io(f, [frameOfAge(32), frameOfAge(32) + 6], [0, 1]);
  const marker = io(f, [frameOfAge(32) - 4, frameOfAge(32) + 10], [0, 1]);
  const ageInt = Math.floor(age + 1e-6);
  const done = io(f, [RACE.end, RACE.end + 10], [0, 1]);
  return (
    <AbsoluteFill>
      <Bg glowY={115} />
      {/* header */}
      <div style={{ position: "absolute", left: 90, top: 270, display: "flex", flexDirection: "column", gap: 4 }}>
        <Label text="$200 every month" o={axes} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 58, color: C.textOnDark, opacity: axes, letterSpacing: -1 }}>Watch it grow</div>
      </div>
      <div style={{ position: "absolute", right: 90, top: 250, textAlign: "right", opacity: axes }}>
        <Label text="age" />
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, lineHeight: 1, color: done > 0 ? C.violet : C.textOnDark, fontVariantNumeric: "tabular-nums", transform: `scale(${1 + done * 0.08 * (1 - io(f, [RACE.end + 10, RACE.end + 24], [0, 1]))})`, transformOrigin: "right center" }}>{ageInt}</div>
      </div>

      <Callout f={f} at={frameOfAge(32)} until={frameOfAge(42)}>At 32, Emma already has <b style={{ color: C.violet }}>{short(emmaAt(32))}</b></Callout>
      <Callout f={f} at={frameOfAge(42)} until={RACE.end}>At 42 · Emma <b style={{ color: C.violet }}>{short(emmaAt(42))}</b> · Jake <b style={{ color: KABIR }}>{short(jakeAt(42))}</b></Callout>
      <Callout f={f} at={RACE.end + 4} until={400}>Same $200. <b style={{ color: C.violet }}>10 extra years.</b></Callout>

      {/* chart */}
      <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="riyaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.violet} stopOpacity={0.35} />
            <stop offset="100%" stopColor={C.violet} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="kabFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={KABIR} stopOpacity={0.28} />
            <stop offset="100%" stopColor={KABIR} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[100000, 200000, 300000, 400000].map((v, i) => (
          <g key={v} opacity={io(f, [8 + i * 4, 22 + i * 4], [0, 1])}>
            <line x1={CH.x} x2={CH.x + CH.w * axes} y1={py(v)} y2={py(v)} stroke={rgba("#ffffff", 0.1)} strokeWidth={2} strokeDasharray="6 10" />
            <text x={CH.x - 16} y={py(v) + 10} textAnchor="end" fill={C.textOnDarkMuted} fontFamily={FONT} fontWeight={600} fontSize={26}>{`$${v / 1000}K`}</text>
          </g>
        ))}
        <line x1={CH.x} x2={CH.x + CH.w * axes} y1={CH.y + CH.h} y2={CH.y + CH.h} stroke={rgba("#ffffff", 0.35)} strokeWidth={3} />
        {[22, 32, 42, 52].map((a, i) => (
          <text key={a} x={px(a)} y={CH.y + CH.h + 48} textAnchor="middle" fill={age >= a ? C.textOnDark : C.textOnDarkMuted} fontFamily={FONT} fontWeight={700} fontSize={30} opacity={io(f, [10 + i * 4, 22 + i * 4], [0, 1])}>{a}</text>
        ))}
        {/* age-32 marker */}
        {marker > 0 && <line x1={px(32)} x2={px(32)} y1={CH.y + CH.h} y2={CH.y + CH.h - CH.h * marker} stroke={rgba(KABIR, 0.6)} strokeWidth={3} strokeDasharray="4 8" />}
        {/* Riya */}
        {age > 22 && (
          <>
            <path d={`${pathTo(emmaAt, 22, age)} L${px(age)} ${CH.y + CH.h} L${px(22)} ${CH.y + CH.h} Z`} fill="url(#riyaFill)" />
            <path d={pathTo(emmaAt, 22, age)} fill="none" stroke={C.violet} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 14px ${rgba(C.violet, 0.7)})` }} />
          </>
        )}
        {/* Kabir */}
        {kOn && (
          <>
            <path d={`${pathTo(jakeAt, 32, age)} L${px(age)} ${CH.y + CH.h} L${px(32)} ${CH.y + CH.h} Z`} fill="url(#kabFill)" />
            <path d={pathTo(jakeAt, 32, age)} fill="none" stroke={KABIR} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
      {marker > 0 && (
        <div style={{ position: "absolute", left: px(32) - 4, top: CH.y + CH.h - CH.h * 0.5, transform: `translate(-100%, -50%) scale(${marker})`, transformOrigin: "right center", padding: "8px 16px", borderRadius: 12, background: rgba(KABIR, 0.16), border: `1.5px solid ${KABIR}`, fontFamily: FONT, fontWeight: 700, fontSize: 26, color: KABIR, whiteSpace: "nowrap", opacity: 1 - io(f, [frameOfAge(40), frameOfAge(42)], [0, 1]) }}>Jake starts →</div>
      )}
      {age > 22 && <Tip age={age} v={emmaAt(age)} color={C.violet} o={tipO} />}
      {kOn && <Tip age={age} v={jakeAt(age)} color={KABIR} below o={kTipO} />}

      {/* legend */}
      <div style={{ position: "absolute", left: 0, right: 0, top: CH.y + CH.h + 92, display: "flex", justifyContent: "center", gap: 48, opacity: axes, fontFamily: FONT, fontWeight: 600, fontSize: 32, color: C.textOnDark }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}><i style={{ width: 22, height: 22, borderRadius: 6, background: C.violet, display: "inline-block" }} />Emma · from 22</span>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}><i style={{ width: 22, height: 22, borderRadius: 6, background: KABIR, display: "inline-block" }} />Jake · from 32</span>
      </div>
      <Disclaimer o={axes} />
      <LightSweep f={f} at={RACE.end - 2} dur={18} color={C.violet} opacity={0.3} />
    </AbsoluteFill>
  );
};

export const Disclaimer: React.FC<{ o: number; top?: number }> = ({ o, top = 1440 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: FONT, fontWeight: 500, fontSize: 22, color: rgba(C.textOnDarkMuted, 0.75), opacity: o }}>
    Illustration · 10% yearly return assumed, compounded monthly · Not investment advice
  </div>
);

/* ───────── 4 · RESULT (510–630) ───────── */
const ResultRow: React.FC<{ f: number; at: number; name: string; started: string; value: string; invested: string; color: string }> = ({ f, at, name, started, value, invested, color }) => {
  const p = io(f, [at, at + 14], [0, 1]);
  const inv = io(f, [at + 22, at + 36], [0, 1]);
  return (
    <div style={{ width: 900, padding: "36px 48px", borderRadius: 40, background: rgba("#ffffff", 0.05), border: `2px solid ${rgba(color, 0.4)}`, opacity: p, transform: `translateY(${(1 - p) * 40}px)`, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, color: C.textOnDark }}>{name}</span>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color, padding: "8px 20px", borderRadius: 999, background: rgba(color, 0.14) }}>{started}</span>
      </div>
      <Odometer f={f} start={at + 4} dur={34} value={value} prefix="$" suffix="K" size={200} color={color} weight={900} font={DISPLAY} />
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34, color: C.textOnDarkMuted, opacity: inv }}>
        You put in <b style={{ color: C.textOnDark }}>{invested}</b>
      </div>
    </div>
  );
};

export const Result: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = spring({ frame: f - 100, fps, config: { damping: 11, stiffness: 180 } });
  const ratio = Math.round(FINAL.emma / FINAL.jake); // 2.98 → 3
  return (
    <AbsoluteFill>
      <Bg glowY={105} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 290, gap: 34 }}>
        <MaskLines f={f} lines={["At age *52*"]} start={2} size={92} color={C.textOnDark} accent={C.violet} weight={800} />
        <ResultRow f={f} at={10} name="Emma" started="started at 22" value={String(Math.round(FINAL.emma / 1000))} invested="$72K" color={C.violet} />
        <ResultRow f={f} at={50} name="Jake" started="started at 32" value={String(Math.round(FINAL.jake / 1000))} invested="$48K" color={KABIR} />
      </AbsoluteFill>
      {f >= 100 && (
        <div style={{ position: "absolute", left: "50%", top: 1262, whiteSpace: "nowrap", transform: `translateX(-50%) rotate(-4deg) scale(${2 - stamp})`, opacity: Math.min(1, stamp * 1.4), padding: "16px 30px", borderRadius: 24, border: `5px solid ${C.violet}`, background: rgba(C.bgDeep, 0.85), fontFamily: DISPLAY, fontWeight: 900, fontSize: 54, color: C.violet, letterSpacing: -1, boxShadow: `0 0 50px ${rgba(C.violet, 0.4)}` }}>
          Emma ends with {ratio}× more
        </div>
      )}
      <Disclaimer o={io(f, [10, 24], [0, 1])} top={1420} />
    </AbsoluteFill>
  );
};

/* ───────── 5 · 3D COINS (630–750) ───────── */
export const COINS = { at: 8, gap: 1.1, left: 45, right: 15 }; // 1 coin = $10K
export const Coins: React.FC = () => {
  const f = useCurrentFrame();
  const head = io(f, [2, 16], [0, 1]);
  const landed = (n: number) => Math.max(0, Math.min(n, Math.floor((f - COINS.at) / COINS.gap) + 1));
  const r = landed(COINS.left), k = landed(COINS.right);
  const l1 = io(f, [6, 20], [0, 1]);
  const l2 = io(f, [62, 76], [0, 1]);
  return (
    <AbsoluteFill>
      <Bg glowY={80} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 270, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #FFE7A3, ${GOLD} 50%, #B8862A)` }} />
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, color: C.textOnDark }}>= $10K</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 390 }}>
        <CoinStacks3D l={f} w={1080} h={860} at={COINS.at} gap={COINS.gap} left={COINS.left} right={COINS.right} />
      </div>
      {/* stack labels */}
      {[{ x: 300, n: r, name: "Emma", c: C.violet }, { x: 780, n: k, name: "Jake", c: KABIR }].map((s) => (
        <div key={s.name} style={{ position: "absolute", left: s.x - 180, width: 360, top: 1200, textAlign: "center", opacity: head }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, color: s.c, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.n}</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: C.textOnDarkMuted }}>{s.name}'s coins</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center", gap: 26, fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, whiteSpace: "nowrap" }}>
        <span style={{ opacity: l1, transform: `translateY(${(1 - l1) * 20}px)`, color: GOLD }}>$24K more in</span>
        <span style={{ opacity: l2, color: C.textOnDarkMuted }}>→</span>
        <span style={{ opacity: l2, transform: `translateY(${(1 - l2) * 20}px) scale(${1 + 0.1 * (1 - io(f, [74, 86], [0, 1])) * l2})`, color: C.violet, textShadow: `0 0 30px ${rgba(C.violet, 0.5)}` }}>$300K more out</span>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── 6 · LESSON (750–825) ───────── */
export const Lesson: React.FC = () => {
  const f = useCurrentFrame();
  const u = io(f, [56, 72], [0, 1], easeInOut);
  return (
    <AbsoluteFill>
      <Bg glowY={120} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 160 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 70, color: C.textOnDarkMuted, opacity: io(f, [2, 14], [0, 1]), textDecoration: f > 32 ? "line-through" : undefined, textDecorationColor: rgba(C.red, 0.8), textDecorationThickness: 6 }}>Not more money.</div>
        <div style={{ overflow: "hidden", marginTop: 10 }}>
          <div style={{ transform: `translateY(${(1 - io(f, [44, 58], [0, 1])) * 105}%)`, fontFamily: SERIF, fontStyle: "italic", fontSize: 190, color: C.violet, lineHeight: 1.05, textShadow: `0 0 70px ${rgba(C.violet, 0.4)}` }}>More time.</div>
        </div>
        <div style={{ marginTop: -6 }}><Underline p={u} width={600} color={C.violet} thickness={7} /></div>
        <div style={{ marginTop: 50, display: "flex", gap: 16 }}>
          <Pill f={f} at={78} size={40}>Start small</Pill>
          <Pill f={f} at={92} size={40} color={C.bgDeep} bg={C.violet}>Start today</Pill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────── 7 · END CARD (825–900) ───────── */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 2, fps, config: { damping: 12, stiffness: 140 } });
  const word = io(f, [10, 26], [0, 1]);
  const ring = io(f, [0, 30], [0, 1]);
  return (
    <AbsoluteFill>
      <Bg glowY={60} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 180 }}>
        <div style={{ position: "relative", width: 300, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 300 + ring * 400, height: 300 + ring * 400, borderRadius: "50%", border: `3px solid ${rgba(C.violet, 0.5 * (1 - ring))}` }} />
          <div style={{ transform: `scale(${s}) rotate(${(1 - s) * -90}deg)` }}><CoinMark size={240} /></div>
        </div>
        <div style={{ marginTop: 46, overflow: "hidden" }}>
          <div style={{ transform: `translateY(${(1 - word) * 105}%)`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, color: C.textOnDark, letterSpacing: -3, whiteSpace: "nowrap" }}>
            the simple <span style={{ color: C.violet }}>money</span>
          </div>
        </div>
        <div style={{ marginTop: 18, fontFamily: SERIF, fontStyle: "italic", fontSize: 54, color: C.textOnDarkMuted, opacity: io(f, [22, 36], [0, 1]) }}>money, made simple.</div>
        <div style={{ marginTop: 48 }}>
          <Pill f={f} at={10} size={40} color={C.bgDeep} bg={C.violet}>Follow for lesson #02 →</Pill>
        </div>
      </AbsoluteFill>
      <Disclaimer o={io(f, [10, 24], [0, 1])} top={1400} />
      <LightSweep f={f} at={2} dur={20} color={C.violet} opacity={0.4} />
    </AbsoluteFill>
  );
};

/* ───────── HUD (series branding) ───────── */
export const HUD: React.FC<{ until: number }> = ({ until }) => {
  const f = useCurrentFrame();
  const o = io(f, [6, 20], [0, 1]) * (1 - io(f, [until - 8, until], [0, 1]));
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 150, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <CoinMark size={44} />
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: 4.5, color: rgba(C.textOnDark, 0.8) }}>THE SIMPLE MONEY</span>
      </div>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: C.violet, padding: "8px 16px", borderRadius: 999, background: rgba(C.violet, 0.12) }}>#01 · COMPOUNDING</span>
    </div>
  );
};

export { easeOut };
