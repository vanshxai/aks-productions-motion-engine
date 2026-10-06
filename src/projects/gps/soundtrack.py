"""How It Works #10 (GPS) soundtrack: synth score + radar-ish SFX (satellite pings, signal sweeps, clock ticks, error buzz,
circle-collapse chimes) kept quiet under the paced VO. Run: python3 src/projects/gps/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
mus = Mix(seconds=SEC, fps=FPS, seed=101); fx = Mix(seconds=SEC, fps=FPS, seed=63)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(107)
tt = lambda s: np.arange(int(s * SR)) / SR
# calmer, darker score than the fridge: Dm / Bb / C / A
mus.music(drums_on=[(302, 598), (650, 832)], soft=[(10, 302), (598, 650)], arp_on=[(104, 832)],
          bpm=108, prog=[[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], final_chord=[50, 53, 57, 62], level=0.045)

def tick(f0=2600, s=.05):
    x = tt(s); return (np.sin(2 * np.pi * f0 * x) * np.exp(-x * 150) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 220) * .5)
def blip(m, s=.12): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 28)
def scrape(s):
    """metal key sliding in a keyway: band-limited noise with a slow stutter"""
    x = tt(s); n = fx.lp(fx.hp(rng.standard_normal(len(x)), .18), .55)
    stutter = .55 + .45 * np.sin(2 * np.pi * (24 + 10 * x / s) * x) ** 2
    return n * stutter * np.minimum(1, x / .04) * np.minimum(1, (s - x) / .08) * 1.8
def clunk(g=1.0):
    x = tt(.45); lo = np.sin(2 * np.pi * np.cumsum(120 - 70 * np.minimum(1, x * 9)) / SR) * np.exp(-x * 14)
    ring = (np.sin(2 * np.pi * 1180 * x) + .6 * np.sin(2 * np.pi * 1790 * x)) * np.exp(-x * 38) * .35
    return (lo + ring) * g
def thunk():
    x = tt(.6); lo = np.sin(2 * np.pi * np.cumsum(90 - 45 * np.minimum(1, x * 6)) / SR) * np.exp(-x * 9)
    return lo + fx.lp(rng.standard_normal(len(x)), .06) * np.exp(-x * 24) * 1.2
def boing(s=.9):
    x = tt(s); f = 260 + 90 * np.exp(-x * 3) * np.sin(2 * np.pi * 11 * x)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 5.5)
def buzz(s=.28):
    x = tt(s); return np.sign(np.sin(2 * np.pi * 74 * x)) * fx.lp(np.ones(len(x)), .3) * np.exp(-x * 7) * .5 + np.sin(2 * np.pi * 148 * x) * .3 * np.exp(-x * 9)
def tickf(fr, g=.1, f0=2600, pan=0.0): fx.mono(tick(f0), fr, g, pan)


def ping(m, s=.35): x = tt(s); return (np.sin(2 * np.pi * note(m) * x) + .3 * np.sin(2 * np.pi * note(m + 12) * x)) * np.exp(-x * 9)
def tock(f0=900, s=.07): x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 70) + fx.hp(rng.standard_normal(len(x)), .4) * np.exp(-x * 160) * .3
def err(s=.5):
    x = tt(s); return (np.sign(np.sin(2 * np.pi * 96 * x)) * .5 + np.sin(2 * np.pi * 103 * x) * .5) * fx.lp(np.ones(len(x)), .3) * np.exp(-x * 5) * .6

# ── hook: signals flow in, phone only listens ──
fx.mono(fx.chime([81, 88], 1.2), 4, .07)
for fr, m in zip([14, 26, 38, 50], [76, 79, 83, 86]): fx.mono(ping(m, .3), fr, .05, [-.5, .4, 0, .3][[76, 79, 83, 86].index(m)])
fx.mono(err(.35), 66, .04); fx.sfx("tap", 66, .1)
# ── satellites stamp the send time ──
for k, fr in enumerate([115, 121, 127, 133]): fx.mono(ping(84 + [0, 3, 7, 10][k], .3), fr, .06, [-.5, .5, 0, .3][k]); tickf(fr, .05, 3000)
fx.mono(fx.sweep(.5, 500, 1600) * .5, 150, .035)
# ── light: the packet flies, delay x c = distance ──
fx.mono(fx.sweep(1.2, 300, 2400) * .5, 192, .06)
for fr in range(200, 236, 6): tickf(fr, .035, 2400)
fx.mono(ping(88, .5), 237, .09); fx.sfx("tap", 238, .1)
fx.mono(fx.chime([81, 88, 93], 1.2), 242, .08)
# ── one circle: a ring grows, dots mark possible positions ──
fx.mono(fx.sweep(.9, 260, 1500) * .55, 254, .06)
for k, fr in enumerate(range(262, 296, 4)): tickf(fr, .06, 2200 + 140 * k)
# ── two circles: second ring, two crossings ──
fx.mono(fx.sweep(.8, 320, 1700) * .55, 304, .06)
fx.mono(ping(86, .4), 326, .08); fx.sfx("pop", 333, .12)
# ── three circles: ruled out, one point ──
fx.mono(fx.sweep(.8, 340, 1900) * .55, 349, .06)
fx.mono(clunk(.7), 368, .1); fx.mono(buzz(.25), 368, .04)
fx.mono(fx.chime([81, 88, 93, 100], 1.8), 372, .12); fx.sfx("tap", 372, .1)
# ── catch: a cheap clock ticks, drifts, the circles swell ──
for k, fr in enumerate(range(386, 432, 11)): fx.mono(tock(900 if k % 2 == 0 else 760), fr, .09)
fx.mono(err(.9), 436, .05)
fx.mono(fx.sweep(1.0, 500, 160) * .5, 436, .06)
fx.mono(clunk(.8), 470, .1); fx.mono(err(.45), 470, .06)
for k, fr in enumerate(range(452, 482, 6)): tickf(fr, .04, 1600 + 90 * k)
# ── fourth satellite: pop, then every circle shrinks together ──
fx.sfx("pop", 521, .24); fx.mono(ping(93, .5), 522, .08)
fx.mono(fx.sweep(.8, 400, 1800) * .55, 524, .06)
fx.mono(fx.sweep(1.35, 1700, 280) * .6, 552, .07)
for k, fr in enumerate(range(556, 592, 4)): tickf(fr, .035 + .03 * (k / 9), 1400 + 130 * k, .2)
fx.mono(fx.riser(.6), 576, .07)
fx.mono(thunk(), 592, .2); fx.mono(fx.chime([81, 88, 93, 100], 2.0), 593, .13); fx.sfx("boom", 593, .1)
# ── rewind + hero: listen, measure, intersect ──
fx.mono(fx.sweep(.4, 1600, 260) * .5, 598, .06); fx.sfx("swoosh2", 602, .17)
fx.mono(ping(81, .3), 603, .08)
for fr, m in zip([608, 614, 620], [76, 79, 83]): fx.mono(ping(m, .25), fr, .045)
fx.mono(ping(85, .3), 628, .08); fx.mono(fx.sweep(.7, 300, 1800) * .5, 630, .06)
for k, fr in enumerate(range(634, 650, 4)): tickf(fr, .05, 2000 + 200 * k)
fx.mono(fx.riser(.55), 650, .07)
fx.mono(thunk(), 668, .26); fx.sfx("boom", 669, .12); fx.mono(fx.chime([88, 93, 100], 1.8), 668, .1)
fx.mono(fx.chime([81, 88, 93, 100], 2.0), 676, .09)
# ── end card ──
fx.sfx("swoosh1", 704, .24); fx.sfx("pop", 714, .28); fx.mono(fx.chime([81, 88], 1.0), 715, .08)
fx.mono(fx.chime([76, 83], 1.0), 748, .05)
fx.typing(842, 24, 1.0, .1); fx.typing(856, 30, 2.0, .08)
fx.mono(fx.chime([69, 76, 81, 88], 2.2), 846, .08)

# pull the music back under the one-word hero beats
gm = np.ones(N); a0, a1 = fx.T(601), fx.T(706); gm[a0:a1] = 0.55
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/gps/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/gps/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/gps/soundtrack.wav", fade_from_frame=893)
