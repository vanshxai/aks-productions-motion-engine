"""How It Works #07 (hydraulics) soundtrack: synth score + hydraulic SFX + paced VO.
Pump strokes in the hero use the same stroke timing as scenes.tsx pump(). Run: python3 src/projects/hydraulic/soundtrack.py"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(pascal=72, formula=200, area=283, nums=440, catch=540, hero=665, end=806)
mus = Mix(seconds=SEC, fps=FPS, seed=71); fx = Mix(seconds=SEC, fps=FPS, seed=39)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(53)
tt = lambda s: np.arange(int(s * SR)) / SR
mus.music(drums_on=[(200, 540), (671, 806)], soft=[(10, 200), (540, 671)], arp_on=[(72, 806)],
          bpm=116, prog=[[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 48, 52]], final_chord=[50, 53, 57, 62], level=0.045)
def blip(m, s=.12): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 28)
def thud(): x = tt(0.4); return np.sin(2 * np.pi * np.cumsum(60 + 140 * np.exp(-x * 25)) / SR) * np.exp(-x * 9)
def squish(s=0.35):
    x = tt(s); return fx.lp(rng.standard_normal(len(x)), 0.06) * 3 * np.sin(np.pi * x / s) ** 2 + np.sin(2 * np.pi * np.cumsum(180 - 80 * x / s) / SR) * 0.3 * np.exp(-x * 6)
def clack(): x = tt(0.05); return (rng.standard_normal(len(x)) * .6 + np.sin(2 * np.pi * 1800 * x) * .4) * np.exp(-x * 120)
def ripple(s=1.2):
    x = tt(s); return np.sin(2 * np.pi * (300 + 200 * np.sin(2 * np.pi * 3 * x)) * x) * np.exp(-x * 3) * 0.5

fx.mono(squish(0.5), 76, 0.3); fx.mono(ripple(1.4), 80, 0.08)
for i in range(6): fx.mono(blip(76 + i, 0.08), 121 + i * 4, 0.06)
fx.mono(blip(84), 203, 0.12); fx.mono(blip(88), 242, 0.1)
fx.mono(blip(72), 292, 0.12); fx.mono(blip(84), 300, 0.12); fx.mono(fx.sweep(0.7, 200, 700) * 0.5, 359, 0.1); fx.mono(thud(), 378, 0.35)
fx.sfx("pop", 449, 0.25); fx.mono(thud(), 504, 0.4); fx.mono(fx.chime([74, 81, 86], 1.2), 505, 0.1)
fx.mono(squish(1.6), 583, 0.25); fx.mono(blip(64, 0.3), 612, 0.08)
# hero pump strokes (mirror of scenes.tsx pump())
def strokes(h): return 0.5 + h / 14 if h < 42 else 3.5 + ((h - 42) / 93) ** 1.6 * 196.5
prev = strokes(0)
for k in range(1, 135 * 4):
    h = k / 4; s = min(200, strokes(h))
    if np.floor(s * 2) > np.floor(prev * 2):
        down = (s % 1) < 0.5
        g = T["hero"] + 6 + h
        gain = 0.25 if h < 42 else 0.06
        fx.mono(clack(), g, gain); fx.mono(squish(0.18), g, gain * 0.6)
    prev = s
fx.mono(fx.riser(0.9), 645, 0.18); fx.sfx("boom", 671, 0.35)
fx.mono(fx.chime([62, 69, 74, 81], 1.8), 770, 0.14)
fx.sfx("swoosh1", 808, 0.3); fx.sfx("pop", 822, 0.3); fx.mono(fx.chime([81, 86], 1.0), 823, 0.08)

vo, sr = sf.read("public/projects/hydraulic/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.7 * env) + fx.L * (1 - 0.5 * env) + vo_f * 1.6
R = mus.R * (1 - 0.7 * env) + fx.R * (1 - 0.5 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    for b in json.load(open("public/projects/hydraulic/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            if d < 6: print(f"LOW {p['text'][:32]:32} {d:.1f} dB")
    print("checked")
fx.L, fx.R = L, R
fx.save("public/projects/hydraulic/soundtrack.wav", fade_from_frame=888)
