"""How It Works #16 (how the Chenab rail bridge was built) soundtrack: a warm, steady construction bed (D minor, 72 bpm: wide pad, low drone, slow plucked
steel-string notes) that opens up as the arch closes. SFX (new pack): metal pings for every arch bay, a cable-crane zip, road ticks, a closure clang + chime,
pier ticks, deck slam, wind noise bed, quake rumble, train pass, soft end chime for the AKS tag. No end-card hits (house rule from #16).
Scene starts and cue frames are the same numbers as scenes.tsx (T, CUE, BAY0, BSTEP). Run: python3 src/projects/chenab/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(gorge=86, risk=169, crane=244, arch=344, meet=463, deck=570, design=628, end=778)
BAY0, BSTEP, CLOSE = 352, 9.4, 478
mus = Mix(seconds=SEC, fps=FPS, seed=161); fx = Mix(seconds=SEC, fps=FPS, seed=96)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(162)
tt = lambda s: np.arange(int(s * SR)) / SR
fr_t = np.arange(N) / SR * FPS

# ── bed ──
mus.music(drums_on=[(0, 0)], soft=[(0, 0)], arp_on=[(0, 0)], bpm=72, prog=[[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], final_chord=[50, 57, 62], level=0.07)
def drone(f, s=30.0):
    x = tt(s); return (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2 * x + .4) + .2 * np.sin(2 * np.pi * f * 3.01 * x)) * np.minimum(1, x / 2.0)
mus.mono(drone(36.7), 0, .08); mus.mono(drone(73.4), 0, .025)
def pluck(m, s=1.4):
    x = tt(s); f = note(m)
    return (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2 * x) * np.exp(-x * 4) + .25 * np.sin(2 * np.pi * f * 3 * x) * np.exp(-x * 7)) * np.exp(-x * 3.2) * np.minimum(1, x / .003)
for k, (fr, m) in enumerate([(8, 74), (60, 69), (120, 65), (175, 62), (250, 69), (300, 74), (360, 77), (420, 81), (480, 86), (540, 81), (600, 77), (660, 74), (720, 69), (790, 74), (840, 81)]):
    mus.mono(pluck(m), fr, .034, [-.5, .5][k % 2])
gm = np.interp(fr_t, [0, 160, 250, 470, 480, 640, 780, 860, 899], [.85, .8, .95, 1.0, 1.15, 1.05, 1.1, .9, .6])
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

# ── hook ──
fx.sfx("swoosh1", 2, .14); fx.sfx("tap", 4, .06)
fx.sfx("pop", 36, .16); fx.mono(fx.chime([62, 69], 1.2), 37, .07)           # TALLER
# ── scene cuts ──
for c in (T["gorge"], T["risk"], T["crane"], T["arch"], T["meet"], T["deck"], T["design"], T["end"]):
    fx.sfx("swoosh1" if c % 2 else "swoosh2", c - 4, .11)
# ── gorge ──
fx.mono(zip_(.8), 92, .05); fx.sfx("tap", 118, .05); fx.sfx("tap", 124, .05); fx.sfx("pop", 136, .14); fx.mono(thud(.7, 80), 136, .1)
# ── risk: quake then wind ──
fx.mono(rumble(1.8, 1.0), 170, .16); fx.mono(thud(.9, 70), 170, .12)
fx.mono(windnoise(1.5, 1.0), 211, .11); fx.sfx("pop", 213, .1)
# ── crane ──
for k in range(14): fx.mono(tick(1000 + 40 * k, .04), 246 + 2.4 * k, .03)           # road dashes
fx.mono(clang(.6), 290, .1); fx.mono(clang(.6), 298, .09)                              # towers up
fx.mono(zip_(.9), 304, .08)                                                           # cable pulled across
fx.sfx("pop", 322, .1); fx.mono(tick(1500, .05), 330, .06)
# ── arch bays (left on the beat, right 2 frames later), then cable hum ──
for j in range(10):
    t0 = BAY0 + BSTEP * j
    fx.mono(ping(1100 + 55 * j, .7, 1.0), t0, .075, -.4); fx.mono(ping(1180 + 55 * j, .7, .9), t0 + 2, .07, .4)
    fx.mono(tick(1800, .03), t0 - 3, .03)
fx.mono(fx.riser(1.8), 420, .04); fx.sfx("pop", 421, .08)
# ── closure ──
fx.mono(clang(1.0), CLOSE + 6, .22); fx.sfx("boom", CLOSE + 6, .09); fx.mono(fx.chime([62, 69, 74, 81], 2.4), CLOSE + 8, .12)
fx.sfx("pop", 504, .14); fx.mono(fx.chime([69, 74], 1.4), 505, .07)                  # 467 m
# ── deck ──
fx.mono(zip_(.5), 552, .04)
for r in range(11): fx.mono(tick(1200 + 70 * r, .04), 572 + 2.2 * r, .04)
fx.mono(thud(.8, 90), 592, .08); fx.mono(zip_(1.0), 592, .06)
fx.mono(clang(1.0), 626, .2); fx.mono(fx.chime([62, 69, 74, 81], 2.2), 627, .11)    # deck joins
# ── design: wind + counter, then quake ──
fx.mono(windnoise(3.2, 1.0), 630, .14)
for k in range(44): fx.mono(tick(900 + 24 * k, .03), 638 + 1.8 * k, .018 + .0004 * k)
fx.sfx("pop", 717, .15); fx.mono(thud(.8, 100), 717, .1)
fx.mono(rumble(1.8, 1.0), 724, .15); fx.sfx("pop", 724, .12); fx.mono(fx.chime([62, 65, 69], 1.6), 726, .07)
# ── trains ──
fx.mono(trainpass(3.2), 780, .13); fx.mono(fx.chime([62, 69, 74, 81], 2.6), 790, .1)
fx.mono(fx.chime([62, 69], 2.0), 868, .05)                                           # soft hit for the AKS tag

vo, sr = sf.read("public/projects/chenab/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/chenab/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/chenab/soundtrack.wav", fade_from_frame=893)
