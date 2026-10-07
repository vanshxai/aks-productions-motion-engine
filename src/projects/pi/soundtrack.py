"""AI Math #01 (pi exponent) soundtrack: calm, curious score (D / Bm / G / A pads, sparse glass-bell motif in D pentatonic, no drums until the floor beat)
+ SFX for pins/points landing, the exponent dial lock, check ticks on the status card, kept under the paced VO.
Scene starts and cue frames are the same numbers as scenes.tsx. Run: python3 src/projects/pi/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(plot=129, claim=272, floor=390, lock=478, fh=523, status=593, stamp=786, end=802)
mus = Mix(seconds=SEC, fps=FPS, seed=131); fx = Mix(seconds=SEC, fps=FPS, seed=97)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(133)
tt = lambda s: np.arange(int(s * SR)) / SR

# bed: soft pads only (arp parked out of range), then our own sparse glass-bell motif
mus.music(drums_on=[(390, 478), (593, 786)], soft=[(0, 390), (478, 593)], arp_on=[(0, 0)],
          bpm=84, prog=[[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]], final_chord=[62, 66, 69, 74], level=0.05)
def bell(m, s=.9):
    x = tt(s); f = note(m)
    return (np.sin(2 * np.pi * f * x + 1.2 * np.sin(2 * np.pi * f * 2.01 * x) * np.exp(-x * 6)) + .25 * np.sin(2 * np.pi * f * 3 * x)) * np.exp(-x * 5) * np.minimum(1, x / .004)
PENT = [74, 76, 78, 81, 83, 86, 88]
beat = FPS * 60 / 84
k = 0; fr = 12.0
while fr < 786:
    if rng.random() < .62:
        m = PENT[(k * 3 + int(rng.integers(0, 3))) % len(PENT)]
        mus.mono(bell(m, 1.1), fr, .05 if fr < 390 else .04, [-.5, .5][k % 2])
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

# ── hook: zoom on pi ──
fx.mono(fx.chime([81, 86, 93], 1.6), 3, .08)
fx.mono(fx.sweep(3.4, 250, 2200) * .5, 6, .045)                                 # zoom ×3000 rising whoosh
fx.sfx("pop", 10, .08); fx.mono(glass(86), 10, .07)                              # 22/7 pin visible
for k_, fr_ in enumerate((34, 52, 70, 88, 104)): fx.mono(tick(1800 + 150 * k_, .03), fr_, .03)   # digits resolving
fx.sfx("pop", 62, .12); fx.mono(glass(90), 62, .08)                              # 355/113 row + pin peels off
fx.mono(fx.chime([86, 93], 1.2), 100, .06)
# ── plot ──
fx.sfx("swoosh2", 129, .14); fx.mono(fx.sweep(1.0, 300, 1500) * .5, 135, .04)    # axes + exponent-2 line
fx.sfx("pop", 142, .14); fx.mono(glass(81), 142, .09); fx.mono(ping(88, .5), 143, .05)    # 22/7 lands
fx.mono(blip(86), 186, .06)                                                    # 333/106 on the line
fx.sfx("pop", 204, .16); fx.mono(glass(88), 204, .1); fx.mono(fx.chime([83, 90], 1.2), 205, .07)   # 355/113 lands
for k_ in range(8): fx.mono(blip(81 + [0, 2, 4, 5, 7, 9, 11, 12][k_], .1), 222 + 5 * k_, .045, [-.3, .3][k_ % 2])  # later ones hug the line
fx.sfx("tap", 266, .09)
# ── claim ──
fx.sfx("swoosh1", 272, .15)
fx.mono(fx.sweep(.9, 400, 1700) * .5, 303, .045)                               # 2+eps dashed line
fx.mono(tick(1500, .05), 318, .08); fx.sfx("click", 318, .1)                   # Q marker
fx.sfx("pop", 338, .14); fx.mono(fx.chime([78, 85, 90], 1.8), 338, .08); fx.mono(thud(.5, 70), 340, .1)   # empty zone
# ── floor ──
fx.sfx("swoosh2", 390, .15)
for k_ in range(5): fx.mono(glass(90 - 3 * k_, .4), 398 + 6 * k_, .06, [-.4, .4][k_ % 2]); fx.mono(tick(2400 - 160 * k_), 398 + 6 * k_, .03)   # bounds ratchet down
fx.sfx("tap", 442, .1); fx.mono(ping(83, .4), 442, .06)
fx.mono(fx.sweep(1.0, 1800, 220) * .5, 450, .06)                               # slide from 7.1032 down to 2
for k_, fr_ in enumerate(range(452, 478, 3)): fx.mono(tick(2600 - 90 * k_, .035), fr_, .028)
fx.mono(thud(1.0, 85), 478, .26); fx.sfx("boom", 479, .1); fx.sfx("pop", 478, .18)   # dial LOCK on exactly 2
fx.mono(fx.chime([74, 81, 86, 93], 2.4), 478, .12); fx.mono(shimmer(1.4, 86), 480, .06)
# ── Flint–Hills ──
fx.sfx("swoosh1", 523, .15)
def bez(x1, y1, x2, y2):
    def f(t):
        lo, hi = 0.0, 1.0
        for _ in range(60):
            s = (lo + hi) / 2; bx = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s * s * x2 + s ** 3
            lo, hi = (s, hi) if bx < t else (lo, s)
        s = (lo + hi) / 2; return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s * s * y2 + s ** 3
    return f
eio = bez(.65, 0, .35, 1)
def frame_at(logN):                       # frame where the cursor passes log10 N
    u = logN / 8
    lo, hi = 0.0, 1.0
    for _ in range(50):
        m = (lo + hi) / 2; lo, hi = (m, hi) if eio(m) < u else (lo, m)
    return T["fh"] + 8 + (lo + hi) / 2 * 36
fx.mono(fx.sweep(1.2, 300, 1400) * .5, 531, .04)
for n_, g_ in ((3, .05), (22, .07), (355, .16), (710, .08)):
    fr_ = frame_at(np.log10(n_)); fx.mono(blip(78 + int(round(12 * np.log10(n_) / 2.85)), .14), fr_, g_)
fr355 = frame_at(np.log10(355)); fx.mono(thud(.8, 75), fr355, .18); fx.sfx("pop", fr355 + 4, .14); fx.mono(glass(88), fr355 + 4, .1)
fx.mono(fx.chime([81, 88], 1.2), 571, .08); fx.sfx("tap", 572, .08)
# ── status card ──
fx.sfx("swoosh2", 593, .14); fx.sfx("tap", 597, .1)
ROWS = [(621, "ok"), (637, "ok"), (653, "open"), (676, "no"), (724, "ok"), (771, "no")]
for fr_, kind in ROWS:
    if kind == "ok": fx.mono(tick(3000, .04), fr_ + 3, .07); fx.mono(glass(93, .4), fr_ + 3, .05)
    elif kind == "no": fx.mono(thud(.5, 110), fr_ + 3, .12); fx.mono(tick(1200, .05), fr_ + 3, .06)
    else: fx.mono(blip(79, .15), fr_ + 3, .06)
fx.sfx("pop", T["stamp"], .16); fx.mono(fx.chime([74, 81, 86], 1.6), T["stamp"], .09); fx.mono(thud(.6, 85), T["stamp"], .12)
# ── end card ──
fx.sfx("swoosh1", 798, .24); fx.sfx("pop", 810, .28); fx.mono(fx.chime([74, 81], 1.0), 811, .08)
fx.mono(fx.chime([69, 76], 1.0), 842, .05)
fx.typing(862, 24, 1.0, .1); fx.typing(876, 30, 2.0, .08)
fx.mono(fx.chime([62, 69, 74, 81], 2.2), 870, .08)

gm = np.ones(N); gm[fx.T(478):fx.T(530)] = 0.8
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/pi/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/pi/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/pi/soundtrack.wav", fade_from_frame=893)
