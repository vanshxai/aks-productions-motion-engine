"""ROCKETS #01 (Saturn V, 3 stages) soundtrack: calm space bed (A minor, 66 bpm) + deep rumbles on ignitions, clunks on stage separations, ticks on counters.
Scene starts and cue frames are the same numbers as scenes.tsx (T, CUE). Run: python3 src/projects/saturn/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(size=118, stages=241, sic=290, sii=467, sivb=558, cap=670, end=745)
CUE = dict(split=246, pills=270, eng0=300, burn=378, drop1=440, sii=480, burn2=500, drop2=552, b1=572, coast=614, b2=628, fade=690, fuel0=192)
mus = Mix(seconds=SEC, fps=FPS, seed=161); fx = Mix(seconds=SEC, fps=FPS, seed=96)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(162)
tt = lambda s: np.arange(int(s * SR)) / SR
fr_t = np.arange(N) / SR * FPS

# ── bed: long pad chords (Am / F / C / G), then a deep drone, a slow swell, sparse bells ──
mus.music(drums_on=[(0, 0)], soft=[(0, 0)], arp_on=[(0, 0)], bpm=66, prog=[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], final_chord=[57, 64, 69], level=0.07)
def drone(f=55.0, s=30.0):
    x = tt(s); return (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2 * x + .6) + .25 * np.sin(2 * np.pi * f * 3.01 * x)) * np.minimum(1, x / 2.0)
mus.mono(drone(55.0), 0, .075); mus.mono(drone(82.4), 0, .03)
def swell(m, s=3.2):
    x = tt(s); y = np.zeros(len(x))
    for d in (-.12, 0, .12):
        fq = note(m) * 2 ** (d / 12)
        for h in range(1, 5): y += np.sin(2 * np.pi * fq * h * x + h) / h
    return y * np.sin(np.pi * x / s) ** 2
def bell(m, s=1.6):
    x = tt(s); f = note(m)
    return (np.sin(2 * np.pi * f * x) + .4 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 3) + .2 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x * 6)) * np.exp(-x * 2.4) * np.minimum(1, x / .004)
for k, (fr, m) in enumerate([(10, 69), (112, 72), (200, 76), (258, 81), (330, 76), (420, 72), (480, 69), (545, 76), (610, 72), (730, 81), (770, 88)]):
    mus.mono(bell(m), fr, .03, [-.5, .5][k % 2])
for fr, m in [(20, 57), (120, 60), (225, 64), (330, 69), (470, 64), (590, 60), (700, 69)]:
    mus.mono(swell(m, 3.4), fr, .035, [-.4, .4][int(fr) % 2])
# openness: the bed swells as we zoom out, dips for the cut-off, blooms at the orbit
gm = np.interp(fr_t, [0, 118, 241, 300, 470, 670, 745, 840, 899], [.9, .9, 1.0, 1.1, 1.1, 1.0, .9, .85, .6])
mus.L *= gm; mus.R *= gm

# ── SFX synths ──
def thud(g=1.0, f0=110):
    x = tt(.55); return (np.sin(2 * np.pi * np.cumsum(f0 - 60 * np.minimum(1, x * 6)) / SR) * np.exp(-x * 9) + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 24)) * g
def cannon(g=1.0):
    x = tt(.9); return (np.sin(2 * np.pi * np.cumsum(140 * np.exp(-x * 7) + 38) / SR) * np.exp(-x * 5) + fx.lp(rng.standard_normal(len(x)), .12) * np.exp(-x * 9) * 1.4 + fx.hp(rng.standard_normal(len(x)), .4) * np.exp(-x * 60) * .5) * g
def tick(f0=2400, s=.04):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 140) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 210) * .4
def rumble(s=2.2, g=1.0):
    x = tt(s); env = (x / s) ** 1.6 * np.minimum(1, (s - x) / .25)
    return (fx.lp(rng.standard_normal(len(x)), .06) * 2.2 + np.sin(2 * np.pi * np.cumsum(48 + 30 * (x / s)) / SR) * .8 + fx.lp(rng.standard_normal(len(x)), .3) * .5 * (x / s)) * env * g
def clunk(g=1.0):
    x = tt(.4); return (np.sin(2 * np.pi * 180 * x) * np.exp(-x * 22) + .6 * np.sin(2 * np.pi * 410 * x) * np.exp(-x * 40) + fx.hp(rng.standard_normal(len(x)), .45) * np.exp(-x * 120) * .7 + np.sin(2 * np.pi * 95 * x) * np.exp(-x * 14)) * g
def sweepdown(s=.7):
    x = tt(s); f = 1400 * (180 / 1400) ** (x / s); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / s) * .6 + fx.lp(rng.standard_normal(len(x)), .1) * np.sin(np.pi * x / s) * .6

# ── hook ──
fx.sfx("swoosh1", 2, .14); fx.sfx("tap", 4, .06); fx.mono(rumble(2.6, .7), 4, .1); fx.mono(thud(.9, 70), 30, .12)
fx.mono(fx.chime([69, 76], 1.4), 62, .06)
# ── size: ticks while the meter counts, fuel blocks pop ──
fx.sfx("swoosh2", T["size"] - 3, .14); fx.sfx("tap", T["size"] + 4, .06)
for k, f0 in enumerate(range(T["size"] + 14, T["size"] + 62, 3)): fx.mono(tick(900 + 40 * k, .03), f0, .02 + .001 * k)
fx.sfx("pop", T["size"] + 63, .16); fx.mono(thud(.8, 100), T["size"] + 63, .12); fx.mono(fx.chime([69, 76, 81], 1.6), T["size"] + 64, .08)
for k in range(10): fx.sfx("pop", CUE["fuel0"] + 3 * k + 3, .06 + .005 * k); fx.mono(tick(1200 + 90 * k, .04), CUE["fuel0"] + 3 * k + 3, .03)
fx.mono(fx.chime([69, 76, 81], 1.4), CUE["fuel0"] + 36, .07)
# ── stages: the stack comes apart ──
fx.sfx("swoosh2", T["stages"] - 3, .14); fx.mono(rumble(1.4, .8), CUE["split"] - 10, .1)
fx.mono(clunk(1.0), CUE["split"] + 4, .2); fx.sfx("impact", CUE["split"] + 4, .1); fx.sfx("swoosh1", CUE["split"] + 6, .1)
for k in range(3): fx.sfx("pop", CUE["pills"] + 8 * k + 3, .12); fx.mono(fx.chime([[69, 76], [76, 81], [81, 88]][k], 1.0), CUE["pills"] + 8 * k + 3, .06)
# ── S-IC: ignition, long rumble, markers, drop ──
fx.sfx("swoosh2", T["sic"] - 3, .12)
fx.mono(rumble(2.4, 1.0), CUE["eng0"] - 20, .14); fx.mono(thud(1.0, 70), CUE["eng0"], .16); fx.sfx("boom", CUE["eng0"], .12)
for i in range(5): fx.sfx("pop", CUE["eng0"] + 5 * i + 3, .1); fx.mono(tick(1300 + 200 * i, .04), CUE["eng0"] + 5 * i + 3, .06)
fx.mono(rumble(4.4, .55), CUE["eng0"] + 40, .07)
fx.mono(fx.riser(2.0), CUE["burn"] - 4, .04)
fx.mono(fx.chime([69, 76], 1.2), CUE["drop1"] - 10, .05)
fx.mono(clunk(1.0), CUE["drop1"], .22); fx.sfx("impact", CUE["drop1"], .12); fx.sfx("swoosh1", CUE["drop1"] + 2, .1); fx.mono(sweepdown(.9), CUE["drop1"] + 4, .08)
# ── S-II ──
fx.sfx("swoosh2", T["sii"] - 3, .12); fx.sfx("tap", T["sii"] + 3, .06)
fx.mono(rumble(1.6, .75), CUE["sii"] - 8, .1); fx.mono(thud(.8, 85), CUE["sii"], .12)
fx.mono(rumble(2.4, .4), CUE["sii"] + 30, .06)
fx.mono(clunk(.9), CUE["drop2"], .2); fx.sfx("impact", CUE["drop2"], .1); fx.sfx("swoosh1", CUE["drop2"] + 2, .1); fx.mono(sweepdown(.8), CUE["drop2"] + 4, .07)
# ── S-IVB: burn 1, coast, burn 2 ──
fx.sfx("swoosh2", T["sivb"] - 3, .12); fx.sfx("tap", T["sivb"] + 3, .06)
fx.mono(rumble(1.4, .6), CUE["b1"] - 6, .09); fx.mono(thud(.7, 95), CUE["b1"], .1)
fx.mono(fx.chime([76, 81, 88], 1.8), CUE["coast"], .08); fx.sfx("pop", CUE["coast"], .1)
fx.mono(rumble(1.8, .8), CUE["b2"] - 6, .11); fx.mono(thud(.9, 80), CUE["b2"], .13); fx.sfx("boom", CUE["b2"], .08); fx.mono(fx.riser(1.2), CUE["b2"] + 4, .04)
# ── capsule ──
fx.mono(clunk(.8), CUE["fade"], .16); fx.sfx("swoosh1", CUE["fade"] + 2, .1); fx.sfx("swoosh2", T["cap"] - 3, .12)
fx.mono(fx.chime([62, 69, 74, 81], 2.6), T["cap"] + 12, .1); fx.sfx("pop", T["cap"] + 12, .1)
# ── end card (same hits as the other episodes) ──
fx.sfx("swoosh1", T["end"] - 4, .24); fx.sfx("pop", T["end"] + 8, .28); fx.mono(fx.chime([74, 81], 1.0), T["end"] + 9, .08)
fx.mono(fx.chime([69, 76], 1.0), T["end"] + 37, .05)
fx.typing(851, 24, 1.0, .1); fx.typing(865, 30, 2.0, .08)
fx.mono(fx.chime([62, 69, 74, 81], 2.2), 863, .08)

vo, sr = sf.read("public/projects/saturn/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/saturn/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/saturn/soundtrack.wav", fade_from_frame=893)
