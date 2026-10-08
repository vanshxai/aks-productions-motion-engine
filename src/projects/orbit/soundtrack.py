"""How It Works #15 (how rockets reach orbit) soundtrack: an epic-but-calm space bed (A minor, 66 bpm: wide slow pad, deep drone, a slow rising
string-like swell, sparse glassy bell notes) that opens up as the picture zooms out, goes silent for the engine cut-off beat, then blooms into
the orbit. SFX: cannon shots, thuds, zoom-out sweep, tick counter, rocket ignition rumble, stage clunks, weight-block pops, cut-off silence + orbit chimes.
Scene starts and cue frames are the same numbers as scenes.tsx (T, CUE). Run: python3 src/projects/orbit/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(up=112, side=175, orbit=249, speed=391, turn=470, fuel=553, stage=620, loop=693, end=795)
CUE = dict(cross=52, side=68, throw=114, land0=168, zoom=166, fire1=192, fire2=214, fire3=252, land1=208, land2=247, tag=359, count0=398, count1=452,
           launch=474, tip=508, join=538, fill=560, blocks=572, sep1=640, sep2=664, cut=693, lap=783)
mus = Mix(seconds=SEC, fps=FPS, seed=151); fx = Mix(seconds=SEC, fps=FPS, seed=95)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(152)
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
gm = np.interp(fr_t, [0, 160, 200, 470, 553, 690, 693, 712, 790, 840, 899], [.8, .8, 1.0, 1.1, 1.0, 1.0, .05, .95, 1.1, .85, .6])
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
fx.sfx("swoosh1", 2, .14); fx.sfx("tap", 4, .06)
fx.mono(tick(1500, .06), CUE["cross"], .12); fx.mono(thud(.6, 90), CUE["cross"], .08)
fx.sfx("swoosh2", CUE["side"] - 8, .15); fx.mono(fx.chime([69, 76], 1.2), CUE["side"] + 10, .06)
# ── up ──
fx.sfx("swoosh1", T["up"] - 3, .14); fx.mono(cannon(.7), CUE["throw"], .17); fx.sfx("pop", CUE["throw"], .08)
fx.mono(tick(1800, .05), CUE["throw"] + 26, .06); fx.mono(thud(.7, 100), CUE["land0"], .14)
# ── side ──
fx.mono(sweepdown(.75), CUE["zoom"] - 2, .1); fx.sfx("swoosh2", CUE["zoom"] + 4, .1)
fx.sfx("swoosh1", T["side"] - 3, .12)
fx.mono(cannon(.9), CUE["fire1"], .19); fx.mono(thud(.5, 130), CUE["land1"], .08); fx.mono(tick(1700, .05), CUE["land1"], .08)
fx.mono(cannon(1.0), CUE["fire2"], .21); fx.mono(thud(.6, 120), CUE["land2"], .1); fx.mono(tick(1500, .05), CUE["land2"], .08)
# ── orbit ──
fx.sfx("swoosh2", T["orbit"] - 4, .14)
fx.mono(cannon(1.0), CUE["fire3"], .26); fx.sfx("boom", CUE["fire3"], .1); fx.mono(fx.riser(1.6), CUE["fire3"] + 4, .04)
fx.mono(fx.chime([69, 76, 81], 1.8), CUE["fire3"] + 86, .06)       # the circle closes
fx.sfx("pop", CUE["tag"], .16); fx.mono(fx.chime([69, 76, 81, 88], 2.2), CUE["tag"] + 1, .1)  # AN ORBIT
# ── speed ──
fx.sfx("swoosh1", T["speed"] - 3, .14); fx.sfx("tap", T["speed"] + 3, .06)
fx.mono(fx.riser(1.8), CUE["count0"] - 6, .05)
for k, f0 in enumerate(range(CUE["count0"], CUE["count1"], 2)): fx.mono(tick(1000 + 45 * k, .03), f0, .022 + .001 * k)
fx.sfx("pop", CUE["count1"], .16); fx.mono(thud(.9, 100), CUE["count1"], .12); fx.mono(fx.chime([69, 76, 81, 88], 1.8), CUE["count1"], .09)   # 28,000
# ── turn: ignition, climb, tip ──
fx.sfx("swoosh2", T["turn"] - 3, .12)
fx.mono(rumble(2.6, 1.0), CUE["launch"] - 6, .15); fx.mono(thud(1.0, 80), CUE["launch"], .18); fx.sfx("boom", CUE["launch"] + 2, .12)
fx.mono(fx.riser(.9), CUE["tip"] - 14, .05); fx.sfx("swoosh1", CUE["tip"], .12)
fx.mono(fx.chime([69, 76, 81], 1.4), CUE["join"], .07)
# ── fuel ──
fx.sfx("swoosh1", T["fuel"] - 3, .14); fx.sfx("tap", T["fuel"] + 3, .06)
fx.mono(fx.riser(.5), CUE["fill"] - 2, .04)
for k in range(10): fx.sfx("pop", CUE["blocks"] + 3 * k + 4, .06 + .005 * k); fx.mono(tick(1200 + 90 * k, .04), CUE["blocks"] + 3 * k + 4, .03)
fx.mono(fx.chime([69, 76, 81], 1.4), CUE["blocks"] + 36, .07)
# ── stages ──
fx.sfx("swoosh2", T["stage"] - 3, .12); fx.sfx("tap", T["stage"] + 3, .06)
fx.mono(rumble(1.2, .8), T["stage"] - 4, .08)
fx.mono(clunk(1.0), CUE["sep1"], .22); fx.sfx("impact", CUE["sep1"], .12); fx.sfx("swoosh1", CUE["sep1"] + 2, .1); fx.mono(fx.chime([76, 81], 1.0), CUE["sep1"] + 10, .05)
fx.mono(clunk(.9), CUE["sep2"], .2); fx.sfx("impact", CUE["sep2"], .1); fx.sfx("swoosh1", CUE["sep2"] + 2, .1); fx.mono(fx.chime([79, 84], 1.0), CUE["sep2"] + 10, .06)
fx.mono(fx.riser(.8), CUE["sep2"] + 14, .04)
# ── engine cut-off: a short true silence, then a soft chime as it coasts ──
fx.mono(thud(.5, 70), CUE["cut"] - 3, .06)
fx.mono(fx.chime([57, 64, 69, 76], 3.0), CUE["cut"] + 21, .12); fx.sfx("pop", CUE["cut"] + 21, .08)
fx.mono(fx.chime([69, 76, 81, 88], 2.6), CUE["lap"], .1); fx.sfx("pop", CUE["lap"], .12)   # one lap done
# ── end card (same hits as #12–#14) ──
fx.sfx("swoosh1", T["end"] - 4, .24); fx.sfx("pop", T["end"] + 8, .28); fx.mono(fx.chime([74, 81], 1.0), T["end"] + 9, .08)
fx.mono(fx.chime([69, 76], 1.0), T["end"] + 37, .05)
fx.typing(851, 24, 1.0, .1); fx.typing(865, 30, 2.0, .08)
fx.mono(fx.chime([62, 69, 74, 81], 2.2), 863, .08)

# silence window for the cut-off: both bed and SFX tail die out for ~half a second before the soft chime
sil = np.interp(fr_t, [CUE["cut"] - 6, CUE["cut"] - 1, CUE["cut"] + 12, CUE["cut"] + 20], [1, .04, .04, 1])
for m_ in (fx,): m_.L *= sil; m_.R *= sil
# restore the intended hits that sit inside the window (chime + pop)
vo, sr = sf.read("public/projects/orbit/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/orbit/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/orbit/soundtrack.wav", fade_from_frame=893)
