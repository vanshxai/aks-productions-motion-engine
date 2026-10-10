"""How It Works #22 (birds on power lines) soundtrack: calm bed (D minor, 78 bpm, low drone + sparse glass plucks) with
SFX: climb whoosh, thin-air hiss, dot fades, drag thumps, fuel ticks, cold shimmer, storm rumble, too-thin buzz, sweet-spot chime, step-climb rises, a soft chime for the AKS tag. No end-card hits.
Scene starts and cue frames are the same numbers as scenes.tsx (T, CUE). Run: python3 src/projects/birds/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(diff=127, one=298, stay=448, two=559, big=686, end=794)
mus = Mix(seconds=SEC, fps=FPS, seed=221); fx = Mix(seconds=SEC, fps=FPS, seed=229)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(192)
tt = lambda s: np.arange(int(s * SR)) / SR
fr_t = np.arange(N) / SR * FPS

# ── bed ──
mus.music(drums_on=[(0, 0)], soft=[(0, 0)], arp_on=[(0, 0)], bpm=78, prog=[[50, 53, 57], [46, 50, 53], [43, 46, 50], [48, 52, 55]], final_chord=[50, 57, 62], level=0.065)
def drone(f, s=30.0):
    x = tt(s); return (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2 * x + .4) + .2 * np.sin(2 * np.pi * f * 3.01 * x)) * np.minimum(1, x / 2.0)
mus.mono(drone(55.0), 0, .07); mus.mono(drone(110.0), 0, .02)
def pluck(m, s=1.4):
    x = tt(s); f = note(m)
    return (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2 * x) * np.exp(-x * 4) + .25 * np.sin(2 * np.pi * f * 3 * x) * np.exp(-x * 7)) * np.exp(-x * 3.2) * np.minimum(1, x / .003)
for k, (fr, m) in enumerate([(10, 81), (60, 76), (120, 72), (190, 76), (250, 69), (300, 81), (360, 84), (420, 88), (480, 84), (545, 81), (610, 76), (680, 72), (740, 69), (800, 76), (850, 81)]):
    mus.mono(pluck(m), fr, .03, [-.5, .5][k % 2])
gm = np.interp(fr_t, [0, 90, 217, 446, 600, 734, 860, 899], [.9, .95, .85, 1.0, 1.0, 1.05, .9, .6])
mus.L *= gm; mus.R *= gm

# ── SFX synths ──
def ping(f0=1180, s=.7, g=1.0):
    x = tt(s); return (np.sin(2 * np.pi * f0 * x) + .5 * np.sin(2 * np.pi * f0 * 2.76 * x) * np.exp(-x * 12) + .3 * np.sin(2 * np.pi * f0 * 5.4 * x) * np.exp(-x * 25)) * np.exp(-x * 7) * np.minimum(1, x / .002) * g + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 160) * .3 * g
def clang(g=1.0):
    x = tt(1.3); return (np.sin(2 * np.pi * 220 * x) * np.exp(-x * 5) + .7 * np.sin(2 * np.pi * 612 * x) * np.exp(-x * 8) + .5 * np.sin(2 * np.pi * 1180 * x) * np.exp(-x * 11) + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 9) * .8 + fx.hp(rng.standard_normal(len(x)), .4) * np.exp(-x * 70) * .6) * g
def thud(g=1.0, f0=100):
    x = tt(.5); return (np.sin(2 * np.pi * np.cumsum(f0 - 55 * np.minimum(1, x * 6)) / SR) * np.exp(-x * 9) + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 24)) * g
def tick(f0=2200, s=.04):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 140) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 210) * .4
def zip_(s=.9):
    x = tt(s); f = 300 * (2400 / 300) ** (x / s); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .4 + fx.hp(rng.standard_normal(len(x)), .3) * .5) * np.sin(np.pi * x / s) ** 1.5
def windnoise(s, g=1.0):
    x = tt(s); n = fx.lp(rng.standard_normal(len(x)), .03) * 3.0 + fx.lp(rng.standard_normal(len(x)), .1) * .7
    return n * (np.sin(np.pi * x / s) ** .7) * (.7 + .3 * np.sin(2 * np.pi * 1.3 * x)) * g
def rumble(s, g=1.0):
    x = tt(s); env = np.minimum(1, x / .2) * np.minimum(1, (s - x) / .4)
    return (fx.lp(rng.standard_normal(len(x)), .05) * 2.4 * (.6 + .4 * np.sign(np.sin(2 * np.pi * 9 * x))) + np.sin(2 * np.pi * 42 * x) * .6) * env * g
def trainpass(s=3.0):
    x = tt(s); env = np.sin(np.pi * x / s) ** 1.4
    return (fx.lp(rng.standard_normal(len(x)), .08) * 1.6 * (.6 + .4 * np.sign(np.sin(2 * np.pi * 12 * x))) + np.sin(2 * np.pi * 55 * x) * .5) * env

def hiss(s, g=1.0, c=.4):
    x = tt(s); return fx.hp(rng.standard_normal(len(x)), c) * np.sin(np.pi * x / s) ** 1.3 * g
def spool(s=1.2):
    x = tt(s); f = 180 + 1400 * (x / s) ** 2; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .25 + fx.hp(rng.standard_normal(len(x)), .25) * .5) * np.sin(np.pi * x / s) ** 1.2
def glassing(f0, s=.9, g=1.0):
    x = tt(s); return (np.sin(2 * np.pi * f0 * x) + .4 * np.sin(2 * np.pi * f0 * 2.4 * x) * np.exp(-x * 9)) * np.exp(-x * 5) * np.minimum(1, x / .002) * g
def thud(g=1.0, f0=100):
    x = tt(.5); return (np.sin(2 * np.pi * np.cumsum(f0 - 55 * np.minimum(1, x * 6)) / SR) * np.exp(-x * 9) + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 24)) * g
def tick(f0=2200, s=.04):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 140) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 210) * .4
def puff(s=.5, g=1.0):
    x = tt(s); return fx.lp(rng.standard_normal(len(x)), .12) * 2.2 * np.sin(np.pi * x / s) ** 1.5 * g

# ── cues (same frames as scenes.tsx) ──
fx.sfx("swoosh1", 2, .12); fx.mono(fx.sweep(1.2, 200, 800), 4, .05)                    # bird glides in
fx.sfx("pop", 110, .12); fx.mono(fx.chime([69, 76], 1.6), 111, .07)                     # why
for c in T.values(): fx.sfx("swoosh1" if c % 2 else "swoosh2", c - 4, .11)
for k in range(6): fx.mono(tick(1400 + 80 * k, .03), 150 + 4 * k, .04)                # ball rolls
fx.sfx("pop", 235, .1); fx.mono(glassing(note(84), .9), 236, .05)                     # like water
fx.sfx("pop", 300, .12); fx.mono(fx.chime([62, 69], 1.4), 301, .06)                   # one wire
fx.sfx("pop", 398, .12); fx.mono(fx.chime([69, 76, 81], 1.6), 399, .07)               # same level
fx.mono(spool(1.2), 452, .05); fx.sfx("pop", 450, .1)                                  # current flows
fx.mono(fx.chime([74, 81], 1.4), 470, .06); fx.sfx("pop", 512, .1)
fx.mono(hiss(1.0, .5, .4), 514, .04)
fx.sfx("pop", 561, .12); fx.mono(fx.riser(1.0), 562, .05)                              # two wires
fx.mono(clang(.5), 580, .06); fx.sfx("pop", 603, .1); fx.mono(thud(1.0, 80), 604, .12)  # pole
fx.mono(rumble(1.0, .7), 647, .06); fx.mono(clang(.7), 648, .08); fx.mono(thud(1.0, 70), 650, .14)  # different story
fx.sfx("pop", 688, .1); fx.mono(thud(1.0, 90), 706, .1); fx.mono(clang(.4), 712, .05)    # big bird
fx.sfx("pop", 751, .12); fx.mono(fx.chime([64, 71, 76], 1.8), 752, .08)               # covers
fx.sfx("pop", 794, .14); fx.mono(fx.chime([57, 64, 69], 2.2), 795, .09)               # closing line
fx.mono(fx.chime([69, 76], 2.0), 868, .05)                                             # soft hit for the AKS tag

vo, sr = sf.read("public/projects/birds/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/birds/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/birds/soundtrack.wav", fade_from_frame=893)
