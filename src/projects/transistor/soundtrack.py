"""How It Works #02 (transistor) soundtrack: synth score + synthesized electric SFX pack + Kokoro VO (af_heart).
Run from repo root:  python3 src/projects/transistor/soundtrack.py"""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

FPS, SEC = 30, 30
T = dict(hook=0, sw=56, xs=174, gate=548, hero=664, end=822)  # keep in sync with scenes.tsx
VO = [("v01", 8), ("v02", 60), ("v03", 177), ("v04", 269), ("v05", 390), ("v06", 555), ("v07a", 672), ("v07b", 708), ("v07c", 759), ("v08", 828)]

mus = Mix(seconds=SEC, fps=FPS, seed=21)
fx = Mix(seconds=SEC, fps=FPS, seed=9)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(13)
tt = lambda s: np.arange(int(s * SR)) / SR

# ── score: E-minor, 124 bpm; breakdown under the OFF beat, drop on "billions of switches"
mus.music(drums_on=[(56, 266), (388, 548), (666, 822)], soft=[(20, 56), (266, 388), (548, 640)], arp_on=[(56, 822)],
          bpm=124, prog=[[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]], final_chord=[52, 55, 59, 64], level=0.05)
beat = FPS * 60 / 124
k = 0
while 666 + k * beat < 822:
    s = tt(0.4); mus.mono(np.sin(2 * np.pi * note(28) * s) * np.exp(-s * 5), 666 + k * beat, 0.35); k += 1

# ── electric SFX pack (all synthesized)
def blip(m=84, s=0.1, sq=False):
    x = tt(s); w = np.sign(np.sin(2 * np.pi * note(m) * x)) * 0.5 if sq else np.sin(2 * np.pi * note(m) * x)
    return w * np.exp(-x * 30)
def zap(s=0.35):
    x = tt(s); f = 2400 * np.exp(-x * 9) + 120
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + fx.hp(rng.standard_normal(len(x)), 0.3) * 0.5) * np.exp(-x * 12)
def relay():
    x = tt(0.12); return (rng.standard_normal(len(x)) * np.exp(-x * 220) + np.sin(2 * np.pi * 900 * x) * np.exp(-x * 60) * 0.5)
def buzz(s=0.3):
    x = tt(s); return np.sign(np.sin(2 * np.pi * 98 * x)) * 0.35 * np.minimum(1, (s - x) / 0.04) * np.minimum(1, x / 0.01)
def powerup(s=0.8, f0=120, f1=900):
    x = tt(s); f = f0 + (f1 - f0) * (x / s) ** 1.6
    return (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * 0.3) * np.minimum(1, x / 0.05) * np.minimum(1, (s - x) / 0.08)
def thud():
    x = tt(0.4); return np.sin(2 * np.pi * np.cumsum(55 + 120 * np.exp(-x * 25)) / SR) * np.exp(-x * 10)
def hum(s):
    x = tt(s); h = sum(np.sin(2 * np.pi * 100 * k_ * x) / k_ for k_ in (1, 2, 3, 5)) + fx.lp(rng.standard_normal(len(x)), 0.02) * 2
    return h * np.minimum(1, x / 0.3) * np.minimum(1, (s - x) / 0.3)

# hook
fx.mono(fx.sweep(0.9, 200, 520) * 0.6, 2, 0.1); fx.mono(blip(88), 18, 0.18)
fx.mono(fx.riser(0.8), 30, 0.18); fx.sfx("whoosh", 50, 0.35); fx.sfx("pop", 44, 0.3); fx.mono(blip(91, 0.15), 45, 0.12)
# switch
fx.mono(blip(84), 60, 0.16); fx.mono(fx.sweep(0.9, 300, 700) * 0.5, 62, 0.08); fx.sfx("swoosh2", 106, 0.25)
for i, l in enumerate([62, 76, 90, 104, 118]):
    fx.mono(relay(), T["sw"] + l, 0.3)
    if i % 2 == 0: fx.mono(zap(0.2), T["sw"] + l + 1, 0.08)
fx.mono(buzz(), 148, 0.14); fx.sfx("pop", 154, 0.25); fx.mono(blip(88, 0.2), 155, 0.12)
# cross-section: anatomy
fx.mono(fx.sweep(0.8, 160, 420) * 0.5, 177, 0.08)
for fr, m in [(210, 76), (228, 79), (246, 83)]: fx.sfx("pop", fr, 0.22); fx.mono(blip(m, 0.18), fr, 0.14)
# off
fx.mono(blip(72, 0.12, True), 278, 0.06); fx.mono(buzz(0.35), 314, 0.16)
fx.mono(thud(), 368, 0.5); fx.mono(blip(64, 0.3, True), 368, 0.08)
# on
fx.mono(powerup(0.8), 390, 0.14)
for i in range(16): fx.mono(blip(84 + (i % 5) * 2, 0.06), 410 + i * 3.2, 0.06)
fx.mono(blip(95, 0.2), 454, 0.1)
fx.mono(zap(0.3), 472, 0.14); fx.mono(hum(2.6), 472, 0.05)
fx.mono(fx.chime([76, 83, 88], 1.2), 524, 0.14); fx.sfx("pop", 524, 0.3)
# not gate
fx.mono(fx.sweep(0.9, 200, 600) * 0.5, 550, 0.08); fx.mono(blip(88), 560, 0.14)
fx.mono(relay(), 617, 0.3); fx.mono(zap(0.25), 618, 0.12); fx.mono(blip(70, 0.25, True), 636, 0.08); fx.sfx("pop", 637, 0.22)
# hero
fx.mono(fx.riser(0.9), 640, 0.22); fx.sfx("boom", 666, 0.55); fx.sfx("whoosh", 662, 0.35)
for i in range(130):
    fr = 668 + rng.uniform(0, 88); fx.mono(blip(int(rng.integers(84, 100)), 0.03), fr, 0.03 + 0.02 * rng.random())
for i in range(6): fx.mono(blip(79 + i * 2, 0.08, True), 712 + i * 7, 0.06)
fx.sfx("boom", 758, 0.4); fx.mono(fx.chime([64, 71, 76, 83], 2.0), 759, 0.16); fx.mono(fx.sweep(0.8, 300, 900) * 0.5, 764, 0.06)
# end
fx.sfx("swoosh1", 824, 0.3); fx.sfx("pop", 844, 0.3); fx.mono(fx.chime([83, 88], 1.0), 845, 0.08)

# ── VO + ducking
vo = np.zeros(N)
for name, fr in VO:
    a_, sr = sf.read(f"public/projects/transistor/vo/{name}_t.wav")
    a_ = resample_poly(a_, SR, sr); s = fx.T(fr); e = min(N, s + len(a_)); vo[s:e] += a_[: e - s]
vo = vo / np.abs(vo).max() * 0.9
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.6 * env) + fx.L * (1 - 0.45 * env) + vo_f * 1.6
R = mus.R * (1 - 0.6 * env) + fx.R * (1 - 0.45 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    for name, fr in VO:
        s = fx.T(fr); e = s + int(0.8 * SR); r = lambda x: round(20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9), 1)
        print(name, "vo", r(vo_f * 1.6), "bed", r(L - vo_f * 1.6))
fx.L, fx.R = L, R
fx.save("public/projects/transistor/soundtrack.wav", fade_from_frame=880)
