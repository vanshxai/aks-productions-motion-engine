"""How It Works #20 (why rockets don't go straight up) soundtrack: calm bed + SFX on the beat cuts/cues in scenes.tsx (T, CUE).
Run: python3 src/projects/rocketup/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf
FPS, SEC = 30, 30
T = dict(side=83, grav=251, tilt=325, turn=455, flat=570, end=718)
mus = Mix(seconds=SEC, fps=FPS, seed=201); fx = Mix(seconds=SEC, fps=FPS, seed=202)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(203)
tt = lambda s: np.arange(int(s * SR)) / SR
fr_t = np.arange(N) / SR * FPS
mus.music(drums_on=[(0, 0)], soft=[(0, 0)], arp_on=[(0, 0)], bpm=84, prog=[[45, 52, 57], [41, 48, 53], [48, 55, 60], [43, 50, 55]], final_chord=[45, 52, 57], level=0.065)
def drone(f, s=30.0):
    x = tt(s); return (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2 * x + .4)) * np.minimum(1, x / 2.0)
mus.mono(drone(55.0), 0, .07); mus.mono(drone(110.0), 0, .02)
gm = np.interp(fr_t, [0, 120, 450, 718, 860, 899], [.9, .95, 1.0, 1.05, .9, .6]); mus.L *= gm; mus.R *= gm
def whoosh(s, g=1.0):
    x = tt(s); return fx.lp(rng.standard_normal(len(x)), .08) * 2.5 * np.sin(np.pi * x / s) ** 1.3 * g
def rumble(s, g=1.0):
    x = tt(s); env = np.minimum(1, x / .15) * np.minimum(1, (s - x) / .3)
    return (fx.lp(rng.standard_normal(len(x)), .05) * 2.4 * (.6 + .4 * np.sign(np.sin(2 * np.pi * 9 * x))) + np.sin(2 * np.pi * 45 * x) * .5) * env * g
def thud(g=1.0, f0=100):
    x = tt(.5); return (np.sin(2 * np.pi * np.cumsum(f0 - 55 * np.minimum(1, x * 6)) / SR) * np.exp(-x * 9) + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 24)) * g
def tick(f0=2200, s=.04):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 140) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 210) * .4
for c in (T["side"], T["grav"], T["tilt"], T["turn"], T["flat"], T["end"]):
    fx.sfx("swoosh1" if c % 2 else "swoosh2", c - 4, .11)
fx.mono(rumble(1.6, .8), 2, .08); fx.mono(fx.sweep(1.2, 150, 700), 8, .05)               # liftoff
fx.sfx("pop", 50, .1); fx.mono(thud(1.0, 80), 66, .12)                                   # falls back
fx.mono(whoosh(2.5, .7), 90, .05); fx.sfx("pop", 125, .1); fx.sfx("pop", 140, .08)       # sideways
for k in range(12): fx.mono(tick(1200 + 80 * k, .03), 178 + 4 * k, .035)                  # counter
fx.mono(fx.chime([62, 69, 74], 1.6), 232, .08); fx.sfx("pop", 232, .12)
fx.mono(rumble(2.2, .8), 255, .06)
for k in range(3): fx.mono(thud(1.0, 80 - 8 * k), 275 + 12 * k, .1)                       # gravity pull
fx.mono(rumble(2.0, .7), 328, .06); fx.sfx("pop", 392, .1); fx.mono(fx.sweep(1.6, 200, 800), 394, .05)
fx.sfx("pop", 460, .1); fx.mono(thud(1.0, 70), 462, .1); fx.sfx("pop", 527, .12); fx.mono(fx.chime([64, 71], 1.4), 528, .07)
fx.mono(whoosh(3.0, .6), 572, .05); fx.sfx("pop", 662, .1); fx.mono(fx.chime([62, 69, 74], 1.8), 664, .07)
fx.mono(fx.chime([57, 64, 69], 2.4), 722, .09); fx.sfx("pop", 722, .12); fx.mono(fx.chime([69, 76], 1.8), 760, .06)
fx.sfx("pop", 758, .1); fx.mono(fx.chime([69, 76], 2.0), 868, .05)
vo, sr = sf.read("public/projects/rocketup/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/rocketup/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6); low += d < 6
            print(("LOW" if d < 6 else "ok "), f"{p['text'][:34]:34} {d:5.1f} dB")
    print("LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/rocketup/soundtrack.wav", fade_from_frame=893)
