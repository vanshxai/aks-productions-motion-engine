"""How It Works #14 (inside a smartphone) soundtrack: a bright, curious, bouncy bed (G major, marimba-style plucks, bubbly bass, shaker ticks)
that keeps one steady groove and gets a little fuller as the parts pile up, plus gadget SFX: pop-apart, glass taps, battery charge-up,
chip power-up + switch ticks, camera shutter, sensor number ticks, radio pings, snap-together clicks. Kept under the paced VO.
Scene starts and cue frames are the same numbers as scenes.tsx (T, CUE). Run: python3 src/projects/phone/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(glass=49, battery=148, share=295, brain=395, chip=471, camera=582, radio=644, back=722, end=797)
CUE = dict(pop=14, tap1=102, drag=120, boltFill=160, biggest=252, bar=344, chipOn=408, count0=490, count1=534, shutter=600, nums=612, radio=660, back=726, snap=756, tags=758)
mus = Mix(seconds=SEC, fps=FPS, seed=141); fx = Mix(seconds=SEC, fps=FPS, seed=91)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(142)
tt = lambda s: np.arange(int(s * SR)) / SR
fr_t = np.arange(N) / SR * FPS

# ── bed: soft pad (G / D / Em / C) + custom marimba groove, no kick drum — different feel from #12 (driving) and #13 (tense drone) ──
mus.music(drums_on=[(0, 0)], soft=[(0, 0)], arp_on=[(0, 0)], bpm=104, prog=[[55, 59, 62], [50, 54, 57], [52, 55, 59], [48, 52, 55]], final_chord=[55, 59, 62, 67], level=0.05)

def marimba(m, s=.34, g=1.0):
    x = tt(s); f = note(m)
    return (np.sin(2 * np.pi * f * x) + .45 * np.sin(2 * np.pi * f * 4 * x) * np.exp(-x * 40) + .15 * np.sin(2 * np.pi * f * 2 * x)) * np.exp(-x * 11) * np.minimum(1, x / .002) * g
def bass(m, s=.3, g=1.0):
    x = tt(s); f = note(m)
    return (np.sin(2 * np.pi * f * x) + .35 * np.sin(2 * np.pi * f * 2 * x)) * np.exp(-x * 9) * np.minimum(1, x / .004) * g
def shaker(s=.07, g=1.0):
    x = tt(s); return mus.hp(rng.standard_normal(len(x)), .55) * np.exp(-x * 60) * np.minimum(1, x / .004) * g
def tick(f0=2400, s=.04):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 140) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 210) * .4
def ping(m, s=.4): x = tt(s); return (np.sin(2 * np.pi * note(m) * x) + .3 * np.sin(2 * np.pi * note(m + 12) * x)) * np.exp(-x * 8)
def thud(g=1.0):
    x = tt(.5); return (np.sin(2 * np.pi * np.cumsum(90 - 45 * np.minimum(1, x * 7)) / SR) * np.exp(-x * 10) + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 28)) * g
def glass_tap(g=1.0):
    x = tt(.25); return (np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 60) + .5 * np.sin(2 * np.pi * 3100 * x) * np.exp(-x * 90) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 150) * .5) * g
def charge(s=1.7, f0=220, f1=880):
    x = tt(s); f = f0 * (f1 / f0) ** ((x / s) ** 1.3)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * (.55 + .45 * np.sin(2 * np.pi * 14 * x)) * np.minimum(1, x / .05) * np.minimum(1, (s - x) / .2)
def powerup(s=.9, f0=200, f1=1600):
    x = tt(s); f = f0 * (f1 / f0) ** (x / s); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, x / .02) * np.exp(-np.maximum(0, x - s * .6) * 5)
def blip(m, s=.09): x = tt(s); return np.sign(np.sin(2 * np.pi * note(m) * x)) * .5 * np.exp(-x * 40) * np.minimum(1, x / .002)
def click(g=1.0):
    x = tt(.05); return (np.sin(2 * np.pi * 1400 * x) * np.exp(-x * 120) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 200) * .6) * g
def sonar(m=88, s=.9): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 5) * (1 + .3 * np.sin(2 * np.pi * 6 * x))

# groove: 8th-note marimba pattern per chord (2 bars per chord) in G pentatonic, bass on the 1 and the "and of 2", shaker 16ths
beat = FPS * 60 / 104; chord_f = beat * 4
roots = [43, 38, 40, 36]
pat = [[67, 71, 74, 71, 79, 74, 71, 74], [66, 69, 74, 69, 78, 74, 69, 74], [67, 71, 76, 71, 79, 76, 71, 76], [64, 67, 72, 67, 76, 72, 67, 72]]
dens = lambda f: np.interp(f, [0, 49, 148, 295, 471, 722, 800, 899], [.5, .75, .85, .9, 1.0, 1.0, .8, .5])
fr = 0.0; k = 0
while fr < SEC * FPS:
    c = int(fr // chord_f) % 4
    i = k % 8
    d = dens(fr)
    sw = beat / 2 * (0.12 if k % 2 else 0)                            # light swing
    if fr < T["end"] - 4 or fr > T["end"] + 6:
        if i not in (3, 7) or d > .8:
            mus.mono(marimba(pat[c][i], .34, 1.0), fr + sw, .05 * d, [-.5, .5][k % 2])
        if i == 0: mus.mono(bass(roots[c], .38), fr, .1 * d)
        if i == 5: mus.mono(bass(roots[c] + 7, .28), fr + sw, .06 * d)
    if k % 2 == 1 or d > .95: mus.mono(shaker(.07, 1.0), fr + beat / 4, .035 * d, [.4, -.4][k % 2])
    k += 1; fr += beat / 2

# ── hook: pop apart ──
fx.sfx("pop", CUE["pop"], .2); fx.sfx("swoosh2", CUE["pop"] - 6, .14); fx.mono(thud(.9), CUE["pop"], .14)
fx.mono(fx.chime([79, 86, 91], 1.2), CUE["pop"] + 1, .08); fx.mono(fx.riser(.45), CUE["pop"] - 12, .05)
for f0, m in zip((24, 30, 36), (74, 79, 86)): fx.mono(ping(m, .25), f0, .035)          # layers settle
# ── glass ──
fx.sfx("swoosh1", T["glass"] - 3, .16); fx.sfx("tap", T["glass"] + 3, .06)
fx.sfx("pop", T["glass"] + 8, .1)                                                       # GLASS pill
for k, f0 in enumerate(range(T["glass"] + 6, T["glass"] + 24, 3)): fx.mono(tick(2600 + 90 * k, .03), f0, .02)   # wires appear
fx.mono(glass_tap(1.0), CUE["tap1"], .22); fx.sfx("tap2", CUE["tap1"], .12); fx.mono(ping(91, .3), CUE["tap1"] + 1, .05)  # finger lands
for k, f0 in enumerate(range(CUE["drag"], CUE["drag"] + 22, 4)): fx.mono(tick(2200 + 140 * k, .03), f0, .028, [-.3, .3][k % 2])   # drag: row/col follow
fx.mono(glass_tap(.7), CUE["drag"] + 22, .1); fx.mono(ping(95, .3), CUE["drag"] + 22, .04)
# ── battery ──
fx.sfx("swoosh2", T["battery"] - 3, .16); fx.sfx("tap", T["battery"] + 3, .06); fx.mono(thud(.7), T["battery"] + 8, .1)
fx.sfx("pop", T["battery"] + 12, .11); fx.mono(ping(79, .35), T["battery"] + 12, .05)    # BATTERY pill
fx.mono(charge(4.0, 196, 880), CUE["boltFill"], .045)                                    # charging up
for k, f0 in enumerate(range(CUE["boltFill"], CUE["biggest"] + 28, 6)): fx.mono(tick(1500 + 18 * k, .035), f0, .02)   # percent ticks
fx.sfx("pop", CUE["biggest"], .14); fx.mono(thud(.8), CUE["biggest"], .1); fx.mono(fx.chime([79, 86], 1.0), CUE["biggest"], .06)   # BIGGEST PART
# ── share ──
fx.sfx("swoosh1", T["share"] - 3, .16); fx.sfx("tap", T["share"] + 3, .06)
fx.mono(fx.riser(.5), CUE["bar"] - 20, .05); fx.sfx("swoosh2", CUE["bar"] - 6, .12)     # bar grows
for k, f0 in enumerate(range(CUE["bar"] - 4, CUE["bar"] + 34, 5)): fx.mono(tick(1700 + 60 * k, .03), f0, .02)
fx.sfx("pop", CUE["bar"] + 26, .14); fx.mono(thud(.8), CUE["bar"] + 26, .1); fx.mono(fx.chime([79, 83, 86], 1.3), CUE["bar"] + 26, .07)   # ≈ ⅔
# ── brain ──
fx.sfx("swoosh1", T["brain"] - 3, .16); fx.sfx("tap", T["brain"] + 3, .06)
fx.sfx("pop", T["brain"] + 6, .11); fx.mono(ping(83, .3), T["brain"] + 6, .05)          # CHIP pill
fx.mono(click(1.0), CUE["chipOn"], .12); fx.sfx("pop", CUE["chipOn"] + 4, .12); fx.mono(ping(86, .4), CUE["chipOn"] + 4, .05)   # chip card
fx.mono(tick(2000, .04), T["brain"] + 40, .05); fx.mono(ping(74, .3), T["brain"] + 40, .04)  # "about 1 cm" ruler
# ── switches ──
fx.sfx("swoosh2", T["chip"] - 3, .16); fx.sfx("tap", T["chip"] + 3, .06)
fx.mono(powerup(.9, 180, 1500), T["chip"] + 2, .09); fx.mono(thud(1.0), T["chip"] + 2, .14)
for k in range(12): fx.mono(blip(79 + [0, 4, 7, 12, 7, 4][k % 6], .08), T["chip"] + 8 + 3 * k, .025, [-.5, .5][k % 2])   # toggles flip
for k, f0 in enumerate(range(CUE["count0"], CUE["count1"], 2)): fx.mono(tick(1200 + 55 * k, .03), f0, .022 + .0012 * k)   # counter climbs
fx.mono(fx.riser(1.1), CUE["count0"] - 4, .05)
fx.sfx("pop", CUE["count1"], .16); fx.mono(thud(1.0), CUE["count1"], .12); fx.mono(fx.chime([79, 86, 91, 98], 1.8), CUE["count1"], .09)   # 19,000,000,000
# ── camera ──
fx.sfx("swoosh1", T["camera"] - 3, .16); fx.sfx("tap", T["camera"] + 3, .06)
fx.sfx("pop", T["camera"] + 6, .11); fx.mono(ping(81, .3), T["camera"] + 6, .05)        # CAMERA pill
fx.mono(fx.riser(.5), T["camera"] + 8, .04); fx.sfx("swoosh2", T["camera"] + 12, .1)    # rays
fx.sfx("shutter", CUE["shutter"], .3)
for k in range(36): fx.mono(tick(1800 + 25 * (k % 9) + 40 * (k // 6), .03), CUE["nums"] + 3 + int(k * 0.9), .022, [-.4, .4][k % 2])   # numbers appear
fx.mono(fx.chime([81, 88, 93], 1.4), CUE["nums"] + 34, .07)
# ── radio ──
fx.sfx("swoosh2", T["radio"] - 3, .16); fx.sfx("tap", T["radio"] + 3, .06)
fx.sfx("pop", T["radio"] + 6, .11); fx.mono(ping(86, .3), T["radio"] + 6, .05)          # RADIO pill
fx.mono(sonar(88, 1.1), CUE["radio"], .06, -.4); fx.sfx("pop", T["radio"] + 16, .1)     # tower
fx.mono(sonar(93, 1.1), CUE["radio"] + 14, .06, .4); fx.sfx("pop", T["radio"] + 30, .1)  # router
for k, f0 in enumerate(range(CUE["radio"] + 12, CUE["radio"] + 56, 11)): fx.mono(ping([88, 93, 91, 95][k % 4], .25), f0, .035, [-.5, .5][k % 2])
# ── put it back together ──
fx.sfx("swoosh1", T["back"] - 3, .18); fx.sfx("tap", T["back"] + 3, .06)
fx.mono(fx.riser(.6), CUE["back"] - 6, .05); fx.sfx("swoosh2", CUE["back"] + 4, .14)
for i, f0 in enumerate((744, 748, 752)): fx.mono(click(1.0), f0, .06 + .02 * i, [-.4, .4, 0][i])
fx.mono(thud(1.0), CUE["snap"], .2); fx.mono(click(1.0), CUE["snap"], .18); fx.sfx("pop", CUE["snap"] + 2, .14)    # snap!
for i, (m, f0) in enumerate(zip((79, 83, 86, 91, 95), range(CUE["tags"], CUE["tags"] + 20, 4))): fx.sfx("pop", f0, .08); fx.mono(ping(m, .35), f0, .05)   # five tags
fx.mono(fx.chime([79, 86, 91, 98], 2.0), CUE["tags"] + 22, .11)
# ── end card (same hits as #12/#13) ──
fx.sfx("swoosh1", T["end"] - 4, .24); fx.sfx("pop", T["end"] + 8, .28); fx.mono(fx.chime([74, 81], 1.0), T["end"] + 9, .08)
fx.mono(fx.chime([69, 76], 1.0), T["end"] + 37, .05)
fx.typing(851, 24, 1.0, .1); fx.typing(865, 30, 2.0, .08)
fx.mono(fx.chime([62, 69, 74, 81], 2.2), 863, .08)
# headline taps on every beat
for f0 in (4,):
    fx.sfx("tap", f0, .06)

# gentle dips so the music never fights the picture-beats; steady bed through the end card, fade at the very end
gm = np.interp(fr_t, [0, 790, 840, 899], [1, 1, .85, .6])
mus.L *= gm; mus.R *= gm

vo, sr = sf.read("public/projects/phone/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/phone/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/phone/soundtrack.wav", fade_from_frame=893)
