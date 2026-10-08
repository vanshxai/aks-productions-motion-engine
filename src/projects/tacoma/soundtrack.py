"""How It Works #13 (Tacoma Narrows) soundtrack: a low, slow, tense-but-calm bed (open Dm drone + heartbeat pulse that tightens as the
swing grows) that releases into a warm major bed once the fix arrives; wind SFX that builds with the story, wood/steel creaks and groans,
cable twangs, the failure hit + splash, then fan hum and a relief chime for the wind tunnel / open truss. Kept under the paced VO.
Scene starts and cue frames are the same numbers as scenes.tsx (T, BREAK_FRAME). Run: python3 src/projects/tacoma/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(gertie=123, slab=220, tilt=320, loop=420, key=470, fail=576, tunnel=640, truss=716, end=799)
BREAK = 610
mus = Mix(seconds=SEC, fps=FPS, seed=131); mus2 = Mix(seconds=SEC, fps=FPS, seed=132); fx = Mix(seconds=SEC, fps=FPS, seed=83)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(133)
tt = lambda s: np.arange(int(s * SR)) / SR
fr_t = np.arange(N) / SR * FPS                      # frame number of every sample

# ── beds: tense (Dm / Bb / Gm / A, slow, no drums, no arp)  →  relief (D / Bm / G / A, gentle pulse + arp) ──
mus.music(drums_on=[(0, 0)], soft=[], arp_on=[(0, 0)], bpm=64,
          prog=[[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]], final_chord=[50, 57, 62], level=0.06)
mus2.music(drums_on=[(716, 792)], soft=[(640, 716)], arp_on=[(640, 842)], bpm=92,
           prog=[[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]], final_chord=[62, 66, 69, 74], level=0.05)

# ── one-shots ──
def wind(s, env):
    """gusty wind. env(frame) = level 0..1.6; brighter and louder as it builds"""
    x = tt(s); n = rng.standard_normal(len(x))
    lo, hi = fx.lp(n, .025), fx.lp(n, .16)
    f = fr_t[: len(x)]; e = env(f)
    k = np.clip((e - .4) / 1.2, 0, 1)
    gust = .72 + .28 * np.sin(2 * np.pi * (.23 * x) + 1.3 * np.sin(2 * np.pi * .07 * x))
    return (lo * (1 - k) * 3.2 + hi * k * 2.2) * e * gust
def gust(s=1.2, peak=.45):
    x = tt(s); n = fx.lp(rng.standard_normal(len(x)), .08) * 4; return n * np.sin(np.pi * np.clip(x / s, 0, 1) ** (1 / peak * .5)) ** 2
def groan(s=1.1, f0=70, rise=.35, g=1.0):
    x = tt(s); f = f0 * (1 + rise * (x / s)) * (1 + .04 * np.sin(2 * np.pi * 5.5 * x))
    saw = ((np.cumsum(f) / SR) % 1) * 2 - 1
    y = fx.lp(saw, .05) * 2.2 + fx.hp(rng.standard_normal(len(x)), .5) * .05 * (1 + np.sin(2 * np.pi * 17 * x))
    return y * np.sin(np.pi * np.clip(x / s, 0, 1)) ** 1.5 * g
def creak(s=.45, f0=520, g=1.0):
    x = tt(s); f = f0 * (1 + .5 * fx.lp(rng.standard_normal(len(x)), .01) * 12)
    sq = np.sign(np.sin(np.cumsum(f) / SR * 2 * np.pi)); am = .55 + .45 * np.sign(np.sin(2 * np.pi * 36 * x))
    return fx.lp(sq * am, .22) * np.sin(np.pi * np.clip(x / s, 0, 1)) ** 2 * g
def twang(m=50, s=.9, g=1.0):
    x = tt(s); f = note(m) * (1 + .05 * np.exp(-x * 28))
    return sum(np.sin(2 * np.pi * f * k * x + k) * np.exp(-x * (2.4 + 1.4 * k)) / k for k in range(1, 7)) * g * np.minimum(1, x / .004)
def snap(g=1.0):
    x = tt(.5); return (fx.hp(rng.standard_normal(len(x)), .4) * np.exp(-x * 60) * 1.2 + np.sin(2 * np.pi * np.cumsum(180 - 120 * np.minimum(1, x * 9)) / SR) * np.exp(-x * 11)) * g
def crash(s=1.4, g=1.0):
    x = tt(s); y = np.zeros(len(x))
    for r in (1, 1.46, 2.09, 2.57, 3.11, 3.9, 5.2): y += np.sin(2 * np.pi * 310 * r * x + r) * np.exp(-x * (5 + 3 * r)) / r
    return (y * .9 + fx.hp(rng.standard_normal(len(x)), .25) * np.exp(-x * 9) * .9) * g
def fall(s=.5):
    x = tt(s); f = 1300 * np.exp(-x * 3.2); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.clip(x / s, 0, 1)) ** .5 * .45
def splash(s=.9, g=1.0):
    x = tt(s); n = rng.standard_normal(len(x)); return (fx.lp(n, .3) * np.exp(-x * 5) + fx.hp(n, .5) * np.exp(-x * 14) * .5) * g * np.minimum(1, x / .01)
def thud(g=1.0):
    x = tt(.55); return (np.sin(2 * np.pi * np.cumsum(88 - 44 * np.minimum(1, x * 7)) / SR) * np.exp(-x * 9) + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 26)) * g
def beat_thump(g=1.0):
    x = tt(.28); return np.sin(2 * np.pi * np.cumsum(62 - 24 * np.minimum(1, x * 12)) / SR) * np.exp(-x * 13) * g
def tick(f0=2400, s=.04):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 140) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 210) * .4
def ping(m, s=.4): x = tt(s); return (np.sin(2 * np.pi * note(m) * x) + .3 * np.sin(2 * np.pi * note(m + 12) * x)) * np.exp(-x * 8)
def fanhum(s, g=1.0):
    x = tt(s); f = 70 + 85 * np.minimum(1, x / 1.1) ** .6
    y = (np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * np.sin(4 * np.pi * np.cumsum(f) / SR) + .25 * np.sin(6 * np.pi * np.cumsum(f) / SR)) * (.8 + .2 * np.sin(2 * np.pi * 21 * x))
    y += fx.lp(rng.standard_normal(len(x)), .12) * 1.6
    return y * np.minimum(1, x / .25) * np.minimum(1, (s - x) / .35) * g
def warm_pad(s=2.0, ms=(62, 66, 69, 74), g=1.0):
    x = tt(s); y = sum(np.sin(2 * np.pi * note(m) * x) + .3 * np.sin(2 * np.pi * note(m) * 2 * x) for m in ms)
    return y * np.minimum(1, x / .06) * np.exp(-x * 1.7) * g

# ── tense heartbeat: a low thump every beat from the tilt on, tighter and louder as the swing grows ──
fr = 336.0
while fr < BREAK - 2:
    k = (fr - 336) / (BREAK - 336)
    fx.mono(beat_thump(.4 + 1.1 * k), fr, .05 + .06 * k)
    fr += 30 - 12 * k                                              # 1 beat/s → 2.5 beats/s

# ── wind bed: builds across the whole story, cut dead at the break, then a calm fan-driven airflow ──
env = lambda f: np.interp(f, [0, 30, 110, 123, 240, 273, 300, 330, 420, 500, 576, 609, 610], [.55, .75, .7, .5, .55, .8, .7, .8, 1.0, 1.15, 1.4, 1.6, 0])
wb = wind(609 / FPS + .05, env); fx.mono(wb, 0, .042)
# ── hook ──
fx.mono(fx.chime([62, 69, 74], 1.6), 3, .07)
fx.sfx("pop", 12, .1); fx.mono(gust(1.4), 8, .03)                              # wind starts, tag already on screen
fx.mono(groan(1.5, 62, .5, 1.0), 66, .05)                                      # the road starts to twist — groaning
fx.mono(twang(50, 1.0), 100, .06, -.3)
# ── gertie: bounces in plain wind ──
fx.sfx("swoosh1", 123, .16); fx.mono(creak(.4, 480), 133, .05, -.3)
fx.mono(creak(.4, 400), 153, .05, .3); fx.mono(creak(.4, 520), 173, .05, -.3); fx.mono(creak(.4, 430), 193, .05, .3)
fx.mono(groan(.9, 58, .2), 141, .05); fx.mono(groan(.9, 54, .2), 181, .05)
fx.sfx("tap", 148, .1); fx.mono(ping(81, .3), 148, .05)                         # ONE HALF UP / DOWN markers
# ── slab: solid road, wind hits it like a sail ──
fx.sfx("swoosh2", 220, .16); fx.mono(thud(.6), 226, .08)                       # slab drawn
fx.sfx("tap", 240, .1); fx.sfx("tap", 247, .08)                                # 39 ft / 8 ft dimensions
fx.mono(gust(1.6, .5), 266, .09)                                               # wind slams in
fx.sfx("pop", 292, .12); fx.mono(thud(.9), 290, .12)                           # push arrow lands
fx.mono(creak(.5, 440), 300, .05); fx.sfx("pop", 298, .1); fx.mono(ping(86, .4), 298, .06)   # sail icon
# ── tilt: a tilted road catches more ──
fx.sfx("swoosh1", 320, .16)
fx.mono(groan(1.9, 60, .55, 1.0), 326, .07)                                    # road tilts slowly
fx.sfx("tap", 366, .1); fx.mono(ping(83, .35), 366, .06)                       # wall-the-wind-sees bracket
fx.mono(twang(48, 1.0), 376, .08, .3)
fx.sfx("pop", 384, .13); fx.mono(thud(.7), 384, .09)                           # BIGGER WALL = MORE PUSH
# ── loop: the swing grows ──
fx.sfx("swoosh2", 420, .16)
for i, f0 in enumerate((424, 432, 440)): fx.sfx("pop", f0, .1 + .01 * i); fx.mono(ping(62 + 4 * i, .3), f0, .05)   # ring nodes
for i, f0 in enumerate(range(420, BREAK - 40, 22)):                            # one creak/groan per swing, getting louder and higher
    k = i / 7
    fx.mono(creak(.4, 380 + 90 * i, 1.0), f0 + 2, .03 + .012 * i, [-.4, .4][i % 2])
    if i % 2 == 0: fx.mono(groan(.7, 56 + 4 * i, .3), f0, .03 + .008 * i)
fx.mono(twang(50, 1.0), 444, .07); fx.mono(twang(53, 1.0), 466, .07, .3)
# ── key: wind alone vs wind + tilt ──
fx.sfx("swoosh1", 470, .16); fx.sfx("tap", 478, .1); fx.mono(ping(74, .4), 478, .05)    # WIND ALONE bar
fx.mono(fx.riser(1.8), 508, .05)                                               # tension up
fx.sfx("pop", 524, .14); fx.mono(thud(.8), 524, .1); fx.mono(twang(55, 1.0), 524, .07)   # WIND + TILT bar appears
for k, f0 in enumerate(range(530, 574, 4)): fx.mono(tick(1700 + 70 * k, .035), f0, .03 + .001 * k)  # bar climbs
fx.mono(twang(57, 1.0), 556, .08, -.3)
# ── fail: an hour later ──
fx.sfx("swoosh2", 576, .18)
for k, f0 in enumerate(range(580, BREAK - 2, 2)): fx.mono(tick(2200 + 25 * k, .03), f0, .018 + .0007 * k, [-.3, .3][k % 2])  # the clock races 10:00 → 11:02
for i, f0 in enumerate((582, 592, 600, 605)): fx.mono(groan(.8, 66 + 9 * i, .6), f0, .06 + .02 * i)   # louder, higher groans
for i, f0 in enumerate((586, 596, 603, 607)): fx.mono(twang(50 + 3 * i, .7), f0, .07 + .02 * i, [-.4, .4][i % 2])
fx.mono(fx.riser(1.0), 584, .06)
# THE BREAK
fx.mono(snap(1.0), BREAK, .2); fx.mono(snap(1.0), BREAK + 1, .12, .4)                # cables / deck let go
fx.sfx("boom", BREAK + 1, .22); fx.mono(thud(1.3), BREAK, .22); fx.mono(crash(1.6, 1.0), BREAK + 1, .1)
fx.mono(fall(.5), BREAK + 3, .12)                                              # section falls
fx.mono(splash(1.0, 1.0), 623, .2); fx.mono(thud(.7), 623, .1); fx.sfx("pop", 625, .08)  # lands in the water
fx.mono(twang(38, 1.4, 1.0), BREAK + 2, .1, .4)
# ── tunnel: relief ──
fx.sfx("swoosh1", 640, .15); fx.mono(fx.chime([62, 69, 74], 1.5), 643, .09)
fx.mono(fanhum(2.4, 1.0), 646, .05)                                            # fan spins up, then steady
fx.mono(gust(1.8, .5), 652, .03)
fx.sfx("pop", 664, .12); fx.mono(ping(74, .35), 664, .05)                      # BIG FAN
fx.sfx("pop", 680, .13); fx.mono(ping(78, .35), 680, .05)                      # TINY MODEL
for k, f0 in enumerate((684, 688, 692, 696, 700)): fx.mono(tick(2400, .03), f0, .03, [-.3, .3][k % 2])   # model wobbles — tap-tap-tap
fx.sfx("tap", 696, .1); fx.mono(ping(81, .4), 696, .05)                        # TEST FIRST. BUILD LATER.
# ── truss: gaps, relief ──
fx.sfx("swoosh2", 716, .16)
for i, (f0, m) in enumerate(zip(range(720, 744, 3), (62, 66, 69, 74, 78, 81, 86, 90))): fx.mono(ping(m, .3), f0, .045)  # joints light up
fx.mono(gust(1.4, .5), 732, .035)                                              # wind flows through, soft
fx.sfx("pop", 754, .1); fx.mono(ping(86, .4), 754, .04)                       # GAPS
fx.sfx("pop", 770, .12); fx.mono(ping(81, .3), 770, .05)                       # tiny push
fx.mono(fx.chime([74, 78, 81, 86], 1.9), 776, .09); fx.mono(warm_pad(2.0), 776, .035); fx.sfx("tap", 774, .1)   # the check mark
# ── end card (same hits as #11/#12) ──
fx.sfx("swoosh1", 795, .24); fx.sfx("pop", 807, .28); fx.mono(fx.chime([74, 81], 1.0), 808, .08)
fx.mono(fx.chime([69, 76], 1.0), 836, .05)
fx.typing(850, 24, 1.0, .1); fx.typing(864, 30, 2.0, .08)
fx.mono(fx.chime([62, 69, 74, 81], 2.2), 862, .08)
# headline taps on every beat
for f0 in (4, 126, 223, 323, 422, 473, 579, 643, 719): fx.sfx("tap", f0, .06)

# ── beds, gated: tense until the break, silent beat, relief afterwards ──
g1 = np.interp(fr_t, [0, 596, 611, 640], [1, 1, .02, 0])
g2 = np.interp(fr_t, [0, 636, 664, 790, 899], [0, 0, 1, 1, .7])
bed_L = mus.L * g1 + mus2.L * g2; bed_R = mus.R * g1 + mus2.R * g2
# low drone under the tense part: D2 with a slow swell + tremolo (rises with the story)
x = np.arange(N) / SR
drone = (np.sin(2 * np.pi * note(38) * x) + .5 * np.sin(2 * np.pi * note(45) * x) + .25 * np.sin(2 * np.pi * note(38) * 2.003 * x)) * (.75 + .25 * np.sin(2 * np.pi * .18 * x))
drone *= np.interp(fr_t, [0, 120, 420, 609, 611, 640], [.35, .5, .8, 1.2, 0, 0]) * .02
bed_L = bed_L + drone; bed_R = bed_R + drone

vo, sr = sf.read("public/projects/tacoma/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env_v = np.abs(vo); kk = int(0.25 * SR); env_v = np.minimum(1, np.convolve(env_v, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = bed_L * (1 - 0.8 * env_v) + fx.L * (1 - 0.6 * env_v) + vo_f * 1.6
R = bed_R * (1 - 0.8 * env_v) + fx.R * (1 - 0.6 * env_v) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/tacoma/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/tacoma/soundtrack.wav", fade_from_frame=895)
