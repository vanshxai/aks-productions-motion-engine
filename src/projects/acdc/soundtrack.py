"""How It Works #12 (AC vs DC) soundtrack: pulsing synth score + electrical SFX (50 Hz mains hum, zaps/buzz, transformer hum,
rectifier clicks, DC tone, power-up chimes) kept under the paced VO.
Scene starts and cue frames are the same numbers as scenes.tsx. Run: python3 src/projects/acdc/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(dc=99, ac=144, peak=218, why=320, loss=398, line=487, rect=610, hero=680, end=790)
mus = Mix(seconds=SEC, fps=FPS, seed=121); fx = Mix(seconds=SEC, fps=FPS, seed=79)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(122)
tt = lambda s: np.arange(int(s * SR)) / SR
# brighter, driving score than the ice one: Am / F / C / G
mus.music(drums_on=[(144, 610), (680, 842)], soft=[(10, 144), (610, 680)], arp_on=[(60, 842)],
          bpm=116, prog=[[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], final_chord=[57, 60, 64, 69], level=0.045)

def mains(s, f0=50, g=1.0):
    """mains hum: 50 Hz + harmonics (100 / 150 / 250) with a slow flutter"""
    x = tt(s); y = sum(a * np.sin(2 * np.pi * f0 * k * x) for k, a in ((1, .6), (2, 1.0), (3, .55), (5, .2)))
    return y * (.85 + .15 * np.sin(2 * np.pi * 3 * x)) * np.minimum(1, x / .15) * np.minimum(1, (s - x) / .3) * g
def dctone(s, m=57):
    x = tt(s); return (np.sin(2 * np.pi * note(m) * x) + .3 * np.sin(2 * np.pi * note(m + 12) * x)) * np.minimum(1, x / .1) * np.minimum(1, (s - x) / .25)
def zap(s=.35, f0=1800):
    x = tt(s); n = fx.hp(rng.standard_normal(len(x)), .3) * np.exp(-x * 14)
    saw = (((np.cumsum(f0 * np.exp(-x * 6)) / SR) % 1) * 2 - 1) * np.exp(-x * 10)
    return n * .7 + saw * .6
def buzz(s=.6, f0=100):
    x = tt(s); saw = (((f0 * x) % 1) * 2 - 1); sq = np.sign(np.sin(2 * np.pi * f0 * 2 * x))
    return fx.lp(saw * .7 + sq * .3 + fx.hp(rng.standard_normal(len(x)), .4) * .15, .3) * np.minimum(1, x / .03) * np.minimum(1, (s - x) / .12)
def clk(s=.04, f0=3200):
    x = tt(s); return (np.sin(2 * np.pi * f0 * x) * np.exp(-x * 160) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 260) * .7)
def tick(f0=2400, s=.04):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 140) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 210) * .4
def thud(g=1.0):
    x = tt(.5); return (np.sin(2 * np.pi * np.cumsum(90 - 45 * np.minimum(1, x * 7)) / SR) * np.exp(-x * 10) + fx.lp(rng.standard_normal(len(x)), .05) * np.exp(-x * 28)) * g
def ping(m, s=.35): x = tt(s); return (np.sin(2 * np.pi * note(m) * x) + .3 * np.sin(2 * np.pi * note(m + 12) * x)) * np.exp(-x * 8)
def powerup(s=.9, f0=200, f1=1400):
    x = tt(s); f = f0 * (f1 / f0) ** (x / s); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, x / .02) * np.exp(-np.maximum(0, x - s * .6) * 5)
def powerdown(s=.6): return powerup(s, 900, 120)[::1] * 0 + fx.sweep(s, 900, 130) * .6

# ── hook: socket AC, phone DC ──
fx.mono(fx.chime([81, 88, 93], 1.4), 3, .08)
fx.mono(mains(1.4, 50, 1), 4, .05)
fx.sfx("pop", 44, .12); fx.mono(zap(.3, 2000), 44, .05)                       # "AC ~" pill
fx.sfx("pop", 70, .12); fx.mono(dctone(.9, 57), 70, .04)                     # "DC" pill
# ── dc: one way ──
fx.sfx("swoosh2", 99, .16); fx.mono(dctone(1.4, 52), 102, .035)
for k in range(8): fx.mono(tick(1800 + 60 * k, .03), 104 + 4 * k, .022, .3)  # electrons drifting past
# ── ac: reverses ──
fx.sfx("swoosh1", 144, .16); fx.mono(mains(2.4, 50, 1), 146, .06)
for k, fr in enumerate(range(152, 212, 3)): fx.mono(tick(2200 + 40 * k, .03), fr, .026 + .0004 * k, [-.3, .3][k % 2])   # flips/s counter
fx.sfx("pop", 160, .1); fx.sfx("tap", 212, .1); fx.mono(fx.chime([88, 93], 1.0), 212, .06)   # 100 flips / s
# ── peak vs RMS ──
fx.sfx("swoosh2", 218, .14)
fx.mono(fx.sweep(.5, 300, 1600) * .5, 234, .05); fx.mono(zap(.4, 2400), 248, .09); fx.sfx("pop", 249, .12)   # PEAK 325 V
fx.mono(fx.chime([88, 93], 1.0), 249, .06)
fx.sfx("tap", 284, .1); fx.mono(ping(86, .4), 284, .08)                      # RMS band lands
fx.mono(ping(91, .4), 300, .07, .3)
# ── why: transformers need AC ──
fx.sfx("swoosh1", 320, .16)
fx.mono(buzz(2.1, 55), 326, .045); fx.mono(buzz(1.6, 110), 332, .02)         # transformer hum (AC row)
fx.mono(fx.sweep(.6, 250, 900) * .5, 340, .05)                                # output grows
fx.mono(thud(.5), 362, .1); fx.mono(powerdown(.6), 364, .06); fx.sfx("pop", 364, .12)   # NO CHANGE -> NO VOLTAGE
# ── loss: 1/100 ──
fx.sfx("swoosh2", 398, .16); fx.mono(buzz(1.0, 120), 404, .03)               # the hot 1x wire
fx.sfx("tap", 408, .08); fx.sfx("tap", 412, .08, ); 
for k, fr in enumerate(range(438, 470, 2)): fx.mono(tick(2600 - 55 * k, .035), fr, .035)     # loss counts down 100 -> 1 %
fx.sfx("pop", 469, .2); fx.mono(fx.chime([88, 93, 100], 1.5), 469, .1)
fx.mono(ping(95, .5), 478, .06, -.3)
# ── line: 400 kV grid ──
fx.sfx("swoosh1", 487, .16); fx.mono(fx.sweep(1.3, 200, 1800) * .5, 491, .05)   # chain draws
for fr in (500, 512, 524): fx.mono(clk(.03, 2800), fr, .06)                  # nodes light up
for k, fr in enumerate(range(523, 553, 2)): fx.mono(tick(1600 + 90 * k, .04), fr, .034)    # kV counts up
fx.mono(zap(.45, 1500), 531, .1); fx.sfx("pop", 531, .14); fx.mono(buzz(.9, 100), 531, .04)  # STEP UP
fx.mono(thud(.6), 541, .1); fx.mono(fx.chime([83, 88, 95], 1.4), 553, .08)
fx.mono(fx.sweep(.5, 1500, 250) * .5, 573, .05)
fx.mono(zap(.4, 900), 579, .09); fx.sfx("pop", 579, .14)                     # STEP DOWN
fx.mono(fx.chime([79, 84, 88], 1.6), 575, .1)                                  # 230 V
# ── rect: AC -> |AC| -> DC ──
fx.sfx("swoosh2", 610, .15); fx.mono(mains(.8, 50, 1), 612, .04)
fx.mono(clk(.04, 3200), 624, .12); fx.sfx("click", 624, .14); fx.mono(thud(.4), 626, .07)       # bridge flips the negative half
fx.mono(clk(.04, 2600), 644, .12); fx.sfx("click", 644, .14); fx.mono(fx.sweep(.6, 200, 800) * .5, 644, .05)   # capacitor smooths
fx.mono(dctone(.9, 57), 654, .04); fx.mono(ping(93, .4), 660, .06)
# ── hero: Grid is AC / Phone is DC / Charger translates ──
fx.mono(fx.riser(.4), 674, .06)
fx.mono(thud(.9), 682, .16); fx.mono(mains(.9, 50, 1), 682, .05); fx.mono(fx.chime([81, 88], 1.0), 682, .08)
fx.sfx("pop", 717, .18); fx.mono(dctone(.8, 57), 717, .05); fx.mono(fx.chime([88, 93], 1.0), 717, .08)
fx.mono(fx.riser(.55), 740, .09)
fx.mono(thud(1.1), 754, .26); fx.sfx("boom", 755, .12); fx.mono(powerup(.8, 220, 1760), 754, .09)
fx.mono(fx.chime([81, 88, 93, 100], 2.2), 756, .13)
for k in range(5): fx.mono(ping([81, 85, 88, 93, 97][k], .3), 764 + 3 * k, .04)
# ── end card ──
fx.sfx("swoosh1", 786, .24); fx.sfx("pop", 798, .28); fx.mono(fx.chime([81, 88], 1.0), 799, .08)
fx.mono(fx.chime([76, 83], 1.0), 830, .05)
fx.typing(850, 24, 1.0, .1); fx.typing(864, 30, 2.0, .08)
fx.mono(fx.chime([69, 76, 81, 88], 2.2), 858, .08)

gm = np.ones(N); gm[fx.T(680):fx.T(790)] = 0.55; gm[fx.T(320):fx.T(500)] = 0.7
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/acdc/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/acdc/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/acdc/soundtrack.wav", fade_from_frame=893)
