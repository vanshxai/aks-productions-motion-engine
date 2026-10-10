"""How It Works #17 (why planes leave white trails) soundtrack: a cool, airy bed (A minor, 84 bpm: wide pad, high shimmer, sparse glass plucks) with
SFX synthesised for this episode: jet whoosh + spool, fuel ticks and a burn thump, steam hiss, frost chimes (freeze), breath puffs, a rising sparkle for the
cloud/line reveals, dry fade-out sweep vs humid swell, a soft thud for NO TRAIL, a soft chime for the AKS tag. No end-card hits (house rule from #16).
Scene starts and cue frames are the same numbers as scenes.tsx (T, CUE). Run: python3 src/projects/contrails/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(fuel=92, cold=217, ice=287, line=446, air=573, end=734)
mus = Mix(seconds=SEC, fps=FPS, seed=171); fx = Mix(seconds=SEC, fps=FPS, seed=97)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(172)
tt = lambda s: np.arange(int(s * SR)) / SR
fr_t = np.arange(N) / SR * FPS

# ── bed ──
mus.music(drums_on=[(0, 0)], soft=[(0, 0)], arp_on=[(0, 0)], bpm=84, prog=[[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 55, 59]], final_chord=[57, 64, 69], level=0.065)
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

# ── hook ──
fx.sfx("swoosh1", 2, .12); fx.mono(hiss(1.6, .5, .3), 4, .05)
fx.sfx("pop", 59, .15); fx.mono(fx.chime([76, 83, 88], 1.6), 60, .08)                      # a cloud of ice
# ── scene cuts ──
for c in (T["fuel"], T["cold"], T["ice"], T["line"], T["air"], T["end"]):
    fx.sfx("swoosh1" if c % 2 else "swoosh2", c - 4, .11)
# ── fuel ──
fx.mono(spool(1.3), 94, .09)
for k in range(7): fx.mono(tick(1300 + 60 * k, .04), 104 + 5 * k, .04)                    # fuel droplets
fx.mono(thud(1.0, 85), 126, .16); fx.sfx("boom", 127, .07); fx.mono(hiss(.5, 1, .2), 126, .05)   # burn
fx.sfx("pop", 149, .13); fx.mono(hiss(2.4, .9, .35), 150, .08)                              # hot steam
fx.mono(fx.riser(.9), 172, .05); fx.mono(puff(1.2, 1.0), 182, .12); fx.sfx("pop", 160, .08)   # surge / 1.2 kg
# ── cold ──
fx.mono(fx.sweep(1.0, 200, 900), 219, .05)                                                  # climb
for k, m in enumerate([88, 84, 79, 76]): fx.mono(glassing(note(m), .9, 1.0), 240 + 3 * k, .05)
fx.sfx("pop", 250, .15); fx.mono(thud(.9, 70), 250, .12)                                    # -50
# ── ice ──
for k in range(18): fx.mono(tick(900 + 30 * k, .03), 290 + 3 * k, .02)                       # steam dots
fx.mono(fx.sweep(.5, 1800, 4200), 332, .05); fx.sfx("pop", 334, .15)                        # freezes
for k, m in enumerate([88, 91, 95, 100, 93, 97]): fx.mono(glassing(note(m), .8, 1.0), 336 + 5 * k, .03, [-.6, .6][k % 2])   # frost chimes
fx.sfx("pop", 356, .1); fx.mono(fx.chime([84, 91], 1.4), 357, .06)                         # zoom on a crystal
fx.mono(puff(.9, 1.0), 401, .12); fx.mono(puff(.9, 1.0), 420, .09); fx.sfx("pop", 418, .1)  # breath, same idea
# ── line ──
fx.mono(fx.riser(.6), 436, .04); fx.sfx("pop", 448, .14); fx.mono(fx.chime([76, 83, 88], 1.8), 449, .08)
fx.sfx("pop", 504, .12); fx.mono(fx.chime([83, 88], 1.4), 505, .06)
fx.sfx("pop", 548, .14); fx.mono(thud(.7, 90), 548, .08)                                    # ice, not smoke
# ── dry vs humid ──
fx.mono(fx.sweep(1.8, 3000, 400), 614, .05); fx.mono(hiss(1.6, .8, .45), 614, .05); fx.sfx("pop", 616, .1)   # dry fades away
fx.mono(fx.riser(1.1), 650, .04); fx.sfx("pop", 661, .12)
fx.mono(puff(1.8, 1.0), 695, .14); fx.mono(fx.chime([72, 79, 84], 2.2), 697, .08); fx.sfx("pop", 695, .1)   # stays and spreads
# ── fly low ──
fx.mono(spool(1.0), 738, .07)
fx.sfx("pop", 764, .14); fx.mono(thud(.9, 75), 764, .12)                                    # NO TRAIL
fx.mono(fx.chime([64, 69, 72], 1.8), 814, .09); fx.sfx("pop", 814, .1)                      # too warm
fx.mono(fx.chime([69, 76], 2.0), 868, .05)                                                  # soft hit for the AKS tag

vo, sr = sf.read("public/projects/contrails/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/contrails/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/contrails/soundtrack.wav", fade_from_frame=893)
