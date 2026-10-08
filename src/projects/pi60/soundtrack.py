"""AI Math #01 (60 s, plain language) soundtrack: calm, curious score (D / Bm / G / A pads, sparse glass-bell motif in D pentatonic, soft drums only under the
claim/floor beats) + SFX for pins and bars landing, the score lock on 2, check ticks on the status card, light sidechain ducking under the paced VO.
Scene starts and cue frames are the same numbers as scenes.tsx (VO phrase starts from public/projects/pi60/vo.json).
Run: python3 src/projects/pi60/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 60
T = dict(guess=127, better=306, question=447, score=602, lucky=743, fake=982, claim=1119, floor=1279, lock=1390, honest=1417, end=1680)
mus = Mix(seconds=SEC, fps=FPS, seed=131); fx = Mix(seconds=SEC, fps=FPS, seed=97)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(133)
tt = lambda s: np.arange(int(s * SR)) / SR

# bed: soft pads (arp parked out of range), drums only under claim -> floor, then our own sparse glass-bell motif
mus.music(drums_on=[(T["claim"], T["honest"])], soft=[(0, T["claim"]), (T["honest"], T["end"])], arp_on=[(0, 0)],
          bpm=84, prog=[[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]], final_chord=[62, 66, 69, 74], level=0.05)
def bell(m, s=.9):
    x = tt(s); f = note(m)
    return (np.sin(2 * np.pi * f * x + 1.2 * np.sin(2 * np.pi * f * 2.01 * x) * np.exp(-x * 6)) + .25 * np.sin(2 * np.pi * f * 3 * x)) * np.exp(-x * 5) * np.minimum(1, x / .004)
PENT = [74, 76, 78, 81, 83, 86, 88]
beat = FPS * 60 / 84
k = 0; fr = 12.0
while fr < T["end"]:
    if rng.random() < .55:
        m = PENT[(k * 3 + int(rng.integers(0, 3))) % len(PENT)]
        mus.mono(bell(m, 1.1), fr, .045 if not (T["claim"] < fr < T["honest"]) else .035, [-.5, .5][k % 2])
    k += 1; fr += beat / 2

def ping(m, s=.35): x = tt(s); return (np.sin(2 * np.pi * note(m) * x) + .3 * np.sin(2 * np.pi * note(m + 12) * x)) * np.exp(-x * 8)
def tick(f0=2400, s=.04):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 140) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 210) * .4
def thud(g=1.0, f=80):
    x = tt(.5); return (np.sin(2 * np.pi * np.cumsum(f - 40 * np.minimum(1, x * 7)) / SR) * np.exp(-x * 10) + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 28)) * g
def glass(m, s=.6): return bell(m, s)
def shimmer(s=1.2, m=86):
    x = tt(s); y = sum(np.sin(2 * np.pi * note(m + d) * x) * a for d, a in ((0, 1), (7, .6), (12, .5), (16, .3)))
    return y * np.exp(-x * 3.2) * np.minimum(1, x / .01)
def blip(m, s=.12): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 30)
def fill(a, b, m0, m1, g=.04):                 # rising ticks while a bar fills
    for i, fr_ in enumerate(range(a, b, 3)): fx.mono(tick(1500 + (m1 - m0) * 40 * (i / max(1, (b - a) / 3)), .03), fr_, g)

# ── hook ──
fx.mono(fx.chime([81, 86, 93], 1.6), 3, .08); fx.sfx("pop", 4, .1)
fx.mono(fx.sweep(1.6, 250, 1400) * .5, 30, .03)
fx.sfx("pop", 72, .1); fx.mono(glass(88), 72, .06)                               # "an old puzzle" pill
# ── guess ──
fx.sfx("swoosh2", 125, .13)
fx.typing(129, 32, 1.0, .08)                                                     # π digits type on
fx.mono(fx.sweep(.7, 300, 1500) * .5, 165, .04); fx.mono(tick(1800, .04), 166, .06)   # number line + "fraction = ÷"
fx.sfx("pop", 214, .14); fx.mono(glass(81), 214, .09); fx.mono(ping(88, .5), 215, .05)  # 22/7 pin drops
fx.mono(tick(2400, .03), 226, .05)
fx.mono(blip(79, .2), 256, .07)                                                  # gap bracket
fx.sfx("tap", 277, .1); fx.mono(thud(.5, 80), 278, .1)                           # NOT EXACT
# ── better ──
fx.sfx("swoosh1", 304, .15)
fx.mono(fx.sweep(2.1, 250, 2400) * .5, 308, .05)                                 # zoom ×2500
for k_, fr_ in enumerate((322, 336, 350, 362)): fx.mono(tick(1700 + 160 * k_, .03), fr_, .035)
fx.sfx("pop", 366, .14); fx.mono(glass(88), 366, .09)                            # 355/113 peels off π
fx.mono(fx.chime([86, 93], 1.2), 372, .07); fx.sfx("tap", 372, .08)              # 3.141592 matches
fx.sfx("pop", 412, .12); fx.mono(glass(90), 412, .07)                            # tiny numbers pill
# ── question ──
fx.sfx("swoosh2", 445, .14)
fx.sfx("pop", 450, .12); fx.mono(glass(81), 450, .08)                            # big π ≈ ?/?
fx.mono(tick(1600, .05), 461, .06)
fx.sfx("swoosh1", 519, .1)
fx.sfx("pop", 526, .12); fx.mono(glass(81), 526, .08)                            # 22/7
fx.sfx("pop", 546, .12); fx.mono(glass(88), 546, .08)                            # 355/113
for k_, fr_ in enumerate((562, 574, 586)): fx.mono(blip(86 - 3 * k_, .14), fr_, .05 - .008 * k_, [-.3, .3, -.3][k_])   # ghost pins
fx.mono(fx.chime([81, 88], 1.4), 598, .06)
# ── score ──
fx.sfx("swoosh1", 600, .14)
fx.mono(tick(1500, .05), 612, .06); fx.mono(tick(1800, .04), 630, .05)
fx.mono(fx.sweep(.9, 300, 900) * .5, 666, .04); fill(668, 692, 70, 80, .03)
fx.mono(ping(83, .5), 692, .07); fx.sfx("tap", 692, .08)                         # bar reaches normal 2
fx.mono(fx.sweep(.9, 600, 1700) * .5, 704, .045); fill(706, 730, 80, 92, .03)
fx.sfx("pop", 716, .13); fx.mono(fx.chime([83, 90], 1.4), 716, .08)              # LUCKY
# ── lucky ──
fx.sfx("swoosh2", 741, .13)
fx.mono(fx.sweep(.9, 300, 1500) * .5, 785, .04); fill(787, 811, 70, 85, .03)
fx.sfx("pop", 811, .15); fx.mono(glass(81), 811, .1); fx.mono(ping(88, .5), 812, .05)   # 22/7: 3.4
fx.mono(fx.sweep(.9, 300, 1500) * .5, 888, .04); fill(890, 914, 70, 85, .03)
fx.sfx("pop", 914, .15); fx.mono(glass(88), 914, .1); fx.mono(fx.chime([83, 90], 1.2), 915, .07)   # 355/113: 3.2
for k_ in range(8): fx.mono(blip(77 + [0, 2, 4, 5, 7, 9, 11, 12][k_], .1), 927 + 2 * k_, .04, [-.3, .3][k_ % 2])   # next 8 bars
fx.mono(thud(.5, 75), 957, .09); fx.sfx("tap", 958, .08)                         # about two
# ── fake number ──
fx.sfx("swoosh1", 980, .14)
fx.sfx("pop", 986, .1); fx.mono(glass(86), 986, .06)
for k_, fr_ in enumerate((1020, 1029, 1038, 1047)): fx.mono(tick(1900 + 140 * k_, .03), fr_, .05)    # cut marks
for k_, (fr_, m_) in enumerate(zip((1052, 1064, 1076, 1088), (81, 84, 88, 91))):
    fx.mono(glass(m_, .5), fr_ + 20, .07); fx.mono(fx.sweep(.5, 500 + 250 * k_, 1300 + 300 * k_) * .5, fr_, .03)
fx.mono(fx.chime([83, 90, 95], 1.6), 1100, .07)                                  # no limit
# ── claim ──
fx.sfx("swoosh2", 1117, .14); fx.mono(fx.sweep(1.0, 300, 1500) * .5, 1121, .04)
fx.sfx("pop", 1128, .12); fx.mono(glass(81), 1128, .08)                          # 22/7 point
fx.sfx("pop", 1136, .12); fx.mono(glass(88), 1136, .08)                          # 355/113 point
for k_ in range(12): fx.mono(blip(77 + [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19][k_], .1), 1146 + 4 * k_, .035, [-.3, .3][k_ % 2])
fx.mono(tick(1500, .05), 1200, .07); fx.sfx("click", 1200, .09)                  # SOME SIZE marker
fx.mono(fx.sweep(.9, 400, 1700) * .5, 1228, .045)
fx.sfx("pop", 1254, .14); fx.mono(fx.chime([78, 85, 90], 1.8), 1254, .08); fx.mono(thud(.5, 70), 1256, .1)   # empty zone
# ── floor ──
fx.sfx("swoosh1", 1277, .15)
fx.mono(thud(.8, 70), 1285, .12); fx.mono(ping(74, .5), 1285, .05); fx.sfx("tap", 1286, .08)   # impossible zone + wall
fx.sfx("pop", 1332, .12); fx.mono(glass(86), 1332, .07)                          # π marker
fx.mono(fx.sweep(1.45, 1800, 220) * .5, 1346, .06)                               # slide down to 2
for k_, fr_ in enumerate(range(1348, 1388, 4)): fx.mono(tick(2600 - 90 * k_, .035), fr_, .028)
fx.mono(thud(1.0, 85), T["lock"], .26); fx.sfx("boom", T["lock"] + 1, .1); fx.sfx("pop", T["lock"], .18)   # LOCK on 2
fx.mono(fx.chime([74, 81, 86, 93], 2.4), T["lock"], .12); fx.mono(shimmer(1.4, 86), T["lock"] + 2, .06)
# ── honest status card ──
fx.sfx("swoosh2", 1415, .14); fx.sfx("tap", 1420, .1)
for fr_, kind in ((1439, "ok"), (1500, "no"), (1596, "ok"), (1648, "no")):
    if kind == "ok": fx.mono(tick(3000, .04), fr_ + 3, .07); fx.mono(glass(93, .4), fr_ + 3, .05)
    else: fx.mono(thud(.5, 110), fr_ + 3, .12); fx.mono(tick(1200, .05), fr_ + 3, .06)
for fr_ in (1423, 1458, 1565, 1636): fx.mono(blip(79, .15), fr_, .045)
# ── end card ──
fx.sfx("swoosh1", 1676, .24); fx.sfx("pop", 1688, .28); fx.mono(fx.chime([74, 81], 1.0), 1691, .08)
fx.mono(fx.chime([69, 76], 1.0), 1722, .05)
fx.typing(1742, 24, 1.0, .1); fx.typing(1756, 30, 2.0, .08)
fx.mono(fx.chime([62, 69, 74, 81], 2.2), 1750, .08)

vo, sr = sf.read("public/projects/pi60/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
DUCK_M, DUCK_F = 0.8, 0.55
L = mus.L * (1 - DUCK_M * env) + fx.L * (1 - DUCK_F * env) + vo_f * 1.6
R = mus.R * (1 - DUCK_M * env) + fx.R * (1 - DUCK_F * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/pi60/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/pi60/soundtrack.wav", fade_from_frame=1792)
