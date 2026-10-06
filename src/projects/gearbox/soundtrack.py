"""How It Works #01 (gearbox) soundtrack: synth score + synthesized mechanical SFX + Kokoro VO (af_heart).
Run from repo root:  python3 src/projects/gearbox/soundtrack.py
All audio is generated here (no samples except the engine's free whoosh/boom) — free to use commercially."""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

FPS, SEC = 30, 30
# Scene starts — keep in sync with T in scenes.tsx
T = dict(hook=0, engine=58, wheel=112, small=182, mesh=234, trade=362, eq=446, first=488, shift=578, hero=712, end=828)
VO = [("vo01", 9), ("vo02", 60), ("vo03", 116), ("vo04", 185), ("vo05", 233), ("vo06", 368), ("vo07", 489), ("vo08", 582),
      ("vo09a", 723), ("vo09b", 752), ("vo09c", 785), ("vo10", 831)]

mus = Mix(seconds=SEC, fps=FPS, seed=3)
fx = Mix(seconds=SEC, fps=FPS, seed=7)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(5)
tt = lambda s: np.arange(int(s * SR)) / SR

# ── score: A-minor tech pulse, 120 bpm (beat = 15 frames). Drums from the problem beat, breakdown under the equation, drop on the gearbox.
mus.music(drums_on=[(112, 446), (720, 828)], soft=[(30, 112), (488, 720)], arp_on=[(58, 446), (488, 828)],
          bpm=120, prog=[[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], final_chord=[57, 60, 64, 69], level=0.05)
# sub bass on the drop
for b in range(0, 108, 15):
    s = tt(0.42); bass = np.sin(2 * np.pi * note(33) * s) * np.exp(-s * 5)
    mus.mono(bass, 720 + b, 0.35)

# ── synthesized mechanical SFX (new pack for this series)
def tick(pitch=3200, dec=90, s=0.05):
    x = tt(s); return (np.sin(2 * np.pi * pitch * x) * 0.6 + rng.standard_normal(len(x)) * 0.4) * np.exp(-x * dec)
def clunk():
    x = tt(0.45)
    thump = np.sin(2 * np.pi * np.cumsum(70 + 160 * np.exp(-x * 30)) / SR) * np.exp(-x * 11)
    metal = sum(np.sin(2 * np.pi * f * x) * np.exp(-x * d) for f, d in [(1180, 22), (1730, 28), (2650, 35)]) * 0.18
    click = rng.standard_normal(len(x)) * np.exp(-x * 160) * 0.5
    return thump + metal + click
def buzz(s=0.32):
    x = tt(s); return np.sign(np.sin(2 * np.pi * 110 * x)) * 0.35 * np.minimum(1, (s - x) / 0.04) * np.minimum(1, x / 0.01)
def blip(m=84, s=0.12):
    x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 30)

def engine_tone(rpm_fn, f0, f1):
    """Engine drone whose pitch follows rpm (4-cyl firing freq = rpm/30 Hz) + harmonics, filtered."""
    n0, n1 = fx.T(f0), fx.T(f1); n = n1 - n0
    fr = f0 + np.arange(n) / SR * FPS
    hz = np.array([rpm_fn(x) for x in fr]) / 30.0
    ph = 2 * np.pi * np.cumsum(hz) / SR
    sig = sum(np.sin(ph * h + h) / h ** 1.1 for h in range(1, 9))
    sig += fx.lp(rng.standard_normal(n), 0.05) * 0.6
    env = np.minimum(1, np.arange(n) / (0.15 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.12 * SR))
    fx.L[n0:n1] += sig * env * 0.035; fx.R[n0:n1] += sig * env * 0.035

# hook
fx.mono(fx.sweep(1.2, 180, 420) * 0.6, 3, 0.10)              # pen draw
fx.mono(tick(2600), 30, 0.25); fx.mono(tick(2200), 34, 0.22)
fx.sfx("whoosh", 56, 0.35)
# engine loves speed: rev 1,000 → 6,000 rpm following the gauge
engine_tone(lambda fr: 800 + 5200 * min(1, max(0, (fr - 62) / 36)) ** 0.6, 58, 116)
fx.mono(tick(3000), 60, 0.2)
# wheels need force: strain rumble + error buzz
x = tt(2.0); fx.mono(fx.lp(rng.standard_normal(len(x)), 0.01) * 4 * np.minimum(1, x / 0.6), 134, 0.18)
fx.mono(buzz(), 152, 0.16); fx.mono(buzz(0.2), 162, 0.12)
# so we use gears: one tick per tooth
fx.sfx("swoosh2", 184, 0.25)
for k in range(10): fx.mono(tick(2400 + k * 120, 120), T["small"] + 18 + k * 2, 0.22)
# mesh: big gear slides in, then a ratchet tick per tooth passing + chime per small-gear turn
fx.sfx("swoosh1", 244, 0.3); fx.mono(clunk(), 262, 0.35)
ease = lambda u: 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
a, b = T["mesh"] + 36, T["mesh"] + 120
for k in range(1, 31):  # 3 turns × 10 teeth
    target = k / 30; lo, hi = 0.0, 1.0
    for _ in range(30):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if ease(mid) < target else (lo, mid)
    fx.mono(tick(1900, 140, 0.03), a + lo * (b - a), 0.16)
for k in (1, 2, 3):
    lo, hi = 0.0, 1.0
    for _ in range(30):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if ease(mid) < k / 3 else (lo, mid)
    fx.mono(blip(76 + k * 3, 0.3), a + lo * (b - a), 0.14)
fx.mono(fx.chime([81, 88, 93], 1.2), 355, 0.12); fx.sfx("pop", 355, 0.3)
# trade: speed falls, torque rises
fx.mono(fx.sweep(0.7, 900, 300), 368, 0.10)
fx.mono(fx.sweep(0.7, 220, 640), 402, 0.10); fx.mono(clunk(), 424, 0.3)
fx.mono(tick(2800), 428, 0.2)
# equation (breakdown): two clean hits
fx.mono(blip(88, 0.25), 450, 0.18); fx.mono(clunk(), 460, 0.4); fx.mono(fx.chime([69, 76, 81], 1.6), 460, 0.12)
# first gear: clunk into gear, launch growl
fx.sfx("swoosh2", 490, 0.25); fx.mono(clunk(), 494, 0.45)
engine_tone(lambda fr: 1800 + 2800 * min(1, max(0, (fr - 510) / 70)), 508, 580)
# shifting: engine rpm sawtooth identical to the on-screen meter, clunk on every shift
G = [(10, 30), (14, 26), (17, 23), (20, 20), (23, 17)]
R = [b_ / a_ for a_, b_ in G]
SH = [0, 31, 61, 91, 118]
VA = [600, 2000, 6000 / R[1], 6000 / R[2], 6000 / R[3], 7500]; VF = [0, 31, 61, 91, 118, 136]
def rpm_at(fr):
    l = fr - T["shift"]; gi = max(i for i, s in enumerate(SH) if l >= s)
    v = np.interp(l, VF, VA); return min(6000, v * R[gi])
engine_tone(rpm_at, T["shift"], T["hero"] + 2)
for s in SH[1:]: fx.mono(clunk(), T["shift"] + s, 0.42); fx.mono(tick(3400), T["shift"] + s + 1, 0.2)
# hero: riser → drop, bars click in, selector clunks through 1-5, title slam
fx.mono(fx.riser(1.0), 690, 0.22); fx.sfx("boom", 720, 0.55); fx.sfx("whoosh", 714, 0.4)
for i in range(5): fx.mono(tick(2000 + i * 300, 100), T["hero"] + 14 + i * 4, 0.2)
for i in range(4): fx.mono(clunk(), T["hero"] + 42 + i * 6 + 6, 0.24); fx.mono(blip(79 + i * 2), T["hero"] + 48 + i * 6, 0.1)
fx.sfx("boom", 784, 0.4); fx.mono(fx.chime([69, 76, 81, 88], 2.0), 786, 0.16)
# end card
fx.sfx("swoosh1", 830, 0.3); fx.sfx("pop", 850, 0.3); fx.mono(fx.chime([81, 88], 1.0), 851, 0.08)
fx.mono(tick(2600), 858, 0.18)

# ── voiceover (Kokoro af_heart, 24 kHz → 48 kHz) + sidechain duck for music
vo = np.zeros(N)
for name, fr in VO:
    a_, sr = sf.read(f"public/projects/gearbox/vo/{name}_t.wav")
    a_ = resample_poly(a_, SR, sr)
    s = fx.T(fr); e = min(N, s + len(a_)); vo[s:e] += a_[: e - s]
vo = vo / np.abs(vo).max() * 0.9
env = np.abs(vo); k = int(0.25 * SR)
env = np.convolve(env, np.ones(k) / k, mode="same"); env = np.minimum(1, env / 0.05)
duck = 1 - 0.6 * env
# tame VO harshness a little (gentle high shelf cut) and add a touch of presence
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))

fduck = 1 - 0.45 * env
L = mus.L * duck + fx.L * fduck + vo_f * 1.6
Rr = mus.R * duck + fx.R * fduck + vo_f * 1.6
fx.L, fx.R = L, Rr
fx.save("public/projects/gearbox/soundtrack.wav", fade_from_frame=880)

if "--stems" in sys.argv:
    bed = (mus.L * duck + fx.L - vo_f * 1.25)  # fx.L now holds the full mix
    for name, fr in VO:
        s = fx.T(fr); e = s + int(0.8 * SR)
        r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
        print(name, "vo", round(r(vo_f * 1.6), 1), "bed", round(r(L - vo_f * 1.6), 1))
