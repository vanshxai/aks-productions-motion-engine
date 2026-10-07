"""How It Works #11 (why ice floats) soundtrack: cold synth score + ice SFX (glass shimmer, crystal click-snaps as each molecule
locks, freeze thud + creak, splash / slosh when the cube drops in, fish bloops, riser + boom on the hero) kept under the paced VO.
Scene starts and cue frames are the same numbers as scenes.tsx / physics.ts (T_LOCK). Run: python3 src/projects/ice/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(liquid=96, lock=209, ring=304, vol=386, float=515, lake=587, hero=671, end=771)
mus = Mix(seconds=SEC, fps=FPS, seed=111); fx = Mix(seconds=SEC, fps=FPS, seed=73)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(117)
tt = lambda s: np.arange(int(s * SR)) / SR
# colder, glassier score than the others: Gm / Eb / Bb / F
mus.music(drums_on=[(216, 600), (748, 842)], soft=[(10, 216), (600, 748)], arp_on=[(96, 842)],
          bpm=104, prog=[[55, 58, 62], [51, 55, 58], [58, 62, 65], [53, 57, 60]], final_chord=[55, 58, 62, 67], level=0.045)

# ── ice-themed one-shots ──
def glass(m, s=.5):
    x = tt(s); return (np.sin(2 * np.pi * note(m) * x) + .45 * np.sin(2 * np.pi * note(m) * 2.76 * x) + .2 * np.sin(2 * np.pi * note(m) * 5.4 * x)) * np.exp(-x * 9)
def snap(i=0, s=.09):
    """crystal click: a bright noise tick plus two inharmonic glass partials; pitch walks up with i"""
    x = tt(s); f0 = 2600 + 55 * (i % 9)
    return (fx.hp(rng.standard_normal(len(x)), .55) * np.exp(-x * 160) * .8
            + np.sin(2 * np.pi * f0 * x) * np.exp(-x * 70) * .6 + np.sin(2 * np.pi * f0 * 1.51 * x) * np.exp(-x * 90) * .35)
def tick(f0=2600, s=.05):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 150) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 220) * .5
def thud(g=1.0):
    x = tt(.6); lo = np.sin(2 * np.pi * np.cumsum(95 - 50 * np.minimum(1, x * 7)) / SR) * np.exp(-x * 9)
    return (lo + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 26) * 1.1) * g
def creak(s=1.2, f0=70, f1=48):
    x = tt(s); f = f0 + (f1 - f0) * x / s + 6 * np.sin(2 * np.pi * 7 * x)
    saw = (((np.cumsum(f) / SR) % 1) * 2 - 1)
    n = fx.lp(rng.standard_normal(len(x)), .04) * 1.6
    am = .6 + .4 * np.sin(2 * np.pi * (5 + 4 * x / s) * x) ** 2
    return fx.lp(saw * .8 + n, .06) * am * np.minimum(1, x / .1) * np.minimum(1, (s - x) / .25) * 1.6
def crackle(s=1.0, dens=60):
    x = tt(s); y = np.zeros(len(x))
    for _ in range(int(s * dens)):
        p = rng.integers(0, len(x) - 1500); k = np.arange(1500) / SR
        y[p:p + 1500] += fx.hp(rng.standard_normal(1500), .5) * np.exp(-k * 400) * rng.uniform(.15, .6)
    return y * np.minimum(1, x / .1) * np.minimum(1, (s - x) / .2)
def splash(s=.8):
    x = tt(s); n = fx.lp(rng.standard_normal(len(x)), .22) * np.exp(-x * 7) * 1.4
    plop = np.sin(2 * np.pi * np.cumsum(520 - 380 * np.minimum(1, x * 6)) / SR) * np.exp(-x * 14) * .8
    return n + plop
def slosh(s=1.1):
    x = tt(s); n = fx.lp(rng.standard_normal(len(x)), .035) * 5 * (.5 + .5 * np.sin(2 * np.pi * 2.6 * x - 1.2)) ** 1.5
    return n * np.minimum(1, x / .08) * np.minimum(1, (s - x) / .5)
def bloop(f0=380, f1=900, s=.14):
    x = tt(s); return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * x / s) / SR) * np.exp(-x * 22)
def wind(s=1.5):
    x = tt(s); return fx.lp(fx.hp(rng.standard_normal(len(x)), .05), .12) * np.sin(np.pi * x / s) ** 2 * 2.2
def ping(m, s=.35): x = tt(s); return (np.sin(2 * np.pi * note(m) * x) + .3 * np.sin(2 * np.pi * note(m + 12) * x)) * np.exp(-x * 9)
def hum(s, f0=55):
    x = tt(s); return sum(np.sin(2 * np.pi * f0 * k * x) / k for k in (1, 2, 3)) * np.minimum(1, x / .4) * np.minimum(1, (s - x) / .4)

# ── hook: solid sinks, ice floats ──
fx.mono(fx.chime([88, 95, 100], 1.4), 3, .08)                     # cold open
fx.mono(wind(1.4), 0, .035)
fx.mono(thud(.8), 38, .12)                                        # the solid lands on the beaker floor
fx.sfx("pop", 66, .12); fx.mono(fx.sweep(.4, 400, 1500) * .5, 60, .05)   # "Water grows" -> the +9 % pill
fx.mono(glass(95, .7), 72, .07)
# ── liquid: zoom into the water, molecules jostle, bonds flicker ──
fx.sfx("swoosh2", 96, .16); fx.mono(fx.sweep(.7, 300, 1900) * .5, 90, .05)
for k in range(24): fx.mono(tick(1700 + 130 * (k % 6), .035), 104 + k * 4 + int(rng.integers(0, 3)), .028 + .01 * (k % 3 == 0), [-.5, .4, -.2, .5][k % 4])
for fr in (118, 140, 162, 186): fx.mono(bloop(520, 760, .09), fr, .03, .3 if fr % 2 else -.3)
fx.mono(fx.sweep(.5, 1700, 400) * .5, 152, .05)                  # "bonds break"
# ── lock: 0 °C, the crystal front snaps molecule after molecule ──
fx.mono(fx.sweep(1.2, 1500, 200) * .5, 190, .06)
fx.mono(thud(1.0), 216, .16); fx.mono(creak(1.4, 80, 44), 216, .07); fx.sfx("boom", 217, .1)
fx.mono(fx.chime([88, 95, 100, 107], 2.0), 217, .1)
LOCK = [226, 235, 236, 237, 244, 244, 245, 246, 246, 247, 247, 249, 250, 256, 256, 256, 257, 257, 257, 260, 260, 261, 262, 262, 267, 267, 268, 268, 268, 268, 268, 269, 272, 279, 280, 281, 282, 285]
LOCKX = [583, 670, 583, 497, 670, 757, 497, 410, 670, 497, 583, 757, 410, 670, 323, 757, 497, 843, 410, 843, 323, 843, 323, 583, 410, 843, 237, 757, 237, 930, 930, 323, 237, 150, 237, 150, 150, 150]  # physics.ts T_LOCK + 7, ICE_PTS x
for i, (fr, x) in enumerate(zip(LOCK, LOCKX)): fx.mono(snap(i), fr, .04 + .0012 * (i % 4), (x - 540) / 450)
for k, fr in enumerate([260, 267, 274, 281]): fx.mono(ping(86 + 3 * k, .3), fr, .07, [-.3, 0, .3, 0][k]); fx.sfx("tap", fr, .06)   # the "1 2 3 4" bond badges
fx.mono(fx.chime([95, 100, 107], 1.6), 293, .09)
# ── ring: hexagons light up one by one ──
fx.sfx("swoosh1", 304, .16)
for k in range(12): fx.mono(glass([83, 86, 88, 91, 95, 91, 88, 86, 83, 86, 88, 95][k], .4), 312 + 6 * k, .05, ((k % 4) - 1.5) * .35)
fx.mono(fx.sweep(.7, 320, 1500) * .5, 350, .05); fx.sfx("pop", 354, .13)       # the +9 % level arrow
# ── vol: same mass, two jars ──
fx.sfx("swoosh2", 386, .16)
fx.mono(thud(.5), 389, .1, -.4); fx.mono(thud(.5), 390, .1, .4)            # the two 1 kg weights
fx.mono(crackle(1.0, 70), 398, .09); fx.mono(creak(1.0, 90, 60), 402, .06)  # the right jar freezes
fx.mono(fx.riser(.55), 402, .06)
fx.mono(fx.sweep(.9, 260, 700) * .5, 406, .05)                             # the level climbs
fx.sfx("pop", 424, .22); fx.mono(glass(95, .8), 424, .08)                  # +9 %
for k, fr in enumerate(range(446, 482, 3)): fx.mono(tick(1900 + 70 * k, .04), fr, .032 + .001 * k)   # 1.00 -> 1.09 L counts up
fx.mono(fx.chime([88, 95, 100], 1.5), 482, .08); fx.sfx("tap", 482, .09)
# ── float: the cube drops in ──
fx.sfx("whoosh2", 514, .09, .5)
fx.mono(splash(.9), 527, .15); fx.mono(thud(.5), 527, .08)
fx.mono(slosh(1.2), 531, .1); fx.mono(slosh(1.0), 556, .05, .3)
for fr, g_ in ((536, .05), (546, .045), (556, .04), (566, .03)): fx.mono(bloop(300, 520, .12), fr, g_, -.3)
for k, fr in enumerate(range(545, 565, 2)): fx.mono(tick(2100 + 90 * k, .035), fr, .04)              # 92 % counts
fx.mono(fx.chime([88, 95, 100, 107], 1.5), 564, .1); fx.sfx("tap", 564, .1)
fx.mono(ping(83, .3), 573, .07, -.3); fx.mono(ping(90, .3), 578, .07, .3)                              # W = F
# ── lake: cold sinks, ice forms from the top ──
fx.sfx("swoosh1", 587, .16); fx.mono(wind(2.4), 588, .06)
for k in range(5): fx.mono(fx.sweep(.32, 1500 - 60 * k, 700) * .5, 594 + 7 * k, .04, [-.5, .2, -.1, .5, 0][k])   # sinking arrows
fx.mono(creak(1.5, 74, 46), 622, .09); fx.mono(crackle(1.2, 60), 624, .06)                 # the sheet thickens
fx.mono(fx.sweep(1.0, 200, 900) * .4, 624, .04)
for k, fr in enumerate([638, 645, 652]): fx.mono(ping([83, 88, 93][k], .3), fr, .06, .3)    # 0, 2, 4 °C
fx.sfx("pop", 646, .2); fx.mono(glass(100, .7), 646, .07)                                  # DENSEST AT 4 °C
for fr in (600, 620, 641, 660): fx.mono(bloop(330, 820, .16), fr, .05, -.4 if fr % 2 else .4)   # fish
fx.sfx("pop", 647, .08)
# ── hero: open rings / less density / ice floats ──
fx.mono(fx.riser(.45), 660, .07)
fx.mono(thud(.9), 674, .18); fx.mono(fx.chime([88, 95, 100], 1.6), 674, .1)
for k in range(6): fx.mono(glass([76, 79, 83, 86, 88, 91][k], .3), 682 + 3 * k, .04)         # the six molecules
fx.sfx("swoosh2", 704, .15)
fx.mono(thud(.9), 709, .14); fx.mono(hum(1.3, 55), 709, .03)
for k, fr in enumerate(range(715, 740, 2)): fx.mono(tick(1700 + 80 * k, .04), fr, .045)          # bars count up
fx.sfx("pop", 737, .18); fx.mono(fx.chime([83, 90], 1.0), 738, .08)
fx.mono(fx.riser(.55), 730, .09)
fx.mono(splash(.9), 747, .2); fx.mono(thud(1.1), 748, .26); fx.sfx("boom", 749, .13); fx.mono(fx.chime([88, 95, 100, 107], 2.2), 748, .13)
fx.mono(slosh(1.0), 756, .05)
# ── end card ──
fx.sfx("swoosh1", 767, .24); fx.sfx("pop", 779, .28); fx.mono(fx.chime([81, 88], 1.0), 780, .08)
fx.mono(fx.chime([76, 83], 1.0), 812, .05)
fx.typing(835, 24, 1.0, .1); fx.typing(849, 30, 2.0, .08)
fx.mono(fx.chime([69, 76, 81, 88], 2.2), 840, .08)

# pull the music back under the one-phrase hero beats
gm = np.ones(N); a0, a1 = fx.T(674), fx.T(772); gm[a0:a1] = 0.55
gm[fx.T(440):fx.T(572)] = 0.62
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/ice/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/ice/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/ice/soundtrack.wav", fade_from_frame=893)
