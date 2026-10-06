"""DevAegis How It Works #01 (minified isn't hidden): synth score + code SFX (key ticks, deletes, glyph scramble,
line-join zips, format click, stamp) quiet under the paced VO. Run: python3 src/projects/minify/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
mus = Mix(seconds=SEC, fps=FPS, seed=17); fx = Mix(seconds=SEC, fps=FPS, seed=29)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(7)
tt = lambda s: np.arange(int(s * SR)) / SR
# warm minor score (Am / F / C / G), drums once the squash starts
mus.music(drums_on=[(226, 611), (640, 760)], soft=[(10, 226), (611, 640)], arp_on=[(96, 770)],
          bpm=112, prog=[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], final_chord=[57, 60, 64, 69], level=0.045)

def tick(f0=2600, s=.05):
    x = tt(s); return np.sin(2 * np.pi * f0 * x) * np.exp(-x * 160) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 240) * .5
def blip(m, s=.12): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 28)
def zap(s=.18, f0=1800, f1=300):
    x = tt(s); f = f0 * (f1 / f0) ** (x / s); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9)
def zip_(s=.6):
    x = tt(s); n = fx.hp(rng.standard_normal(len(x)), .3); return n * (.5 + .5 * np.sin(2 * np.pi * (30 + 60 * x / s) * x) ** 2) * np.minimum(1, x / .05) * np.minimum(1, (s - x) / .1)
def thud():
    x = tt(.5); return np.sin(2 * np.pi * np.cumsum(110 - 60 * np.minimum(1, x * 7)) / SR) * np.exp(-x * 10)
def tk(fr, g=.08, f0=2600, pan=0.0): fx.mono(tick(f0), fr, g, pan)

# hook
fx.mono(fx.chime([81, 88], 1.2), 4, .07)
# strip: comment struck, red dots pop, tokens close up
fx.mono(zap(.2, 900, 200), 106, .08)
for k in range(10): tk(112 + k * 2, .045, 3000 + 120 * k, (k % 3 - 1) * .3)
fx.sfx("swoosh1", 140, .14); fx.mono(zap(.3, 600, 180), 150, .06)
# rename: highlight ticks, glyph scramble
for k in range(11): tk(182 + int(k * 1.4), .05, 2200 + 140 * k)
fx.typing(198, 22, 1.0, .12)
for k, fr in enumerate(range(196, 222, 4)): fx.mono(blip(76 + k, .08), fr, .03)
# squash: line-end markers, lines zip together, "1 LINE"
for k in range(5): fx.mono(blip(72 - k, .1), 230 + k * 3, .05)
fx.mono(zip_(.9), 252, .09); fx.mono(fx.riser(.6), 266, .05)
fx.mono(thud(), 290, .2); fx.sfx("pop", 292, .18)
fx.mono(fx.chime([76, 83], 1.0), 300, .06)
for k, fr in enumerate(range(336, 352, 2)): tk(fr, .05, 3200 - 150 * k)
fx.mono(fx.chime([81, 88, 93], 1.2), 350, .08)
# formatter
fx.sfx("pop", 384, .16); fx.sfx("click", 404, .3); fx.sfx("swoosh2", 406, .16)
fx.mono(zip_(.8)[::-1].copy(), 412, .07)
fx.mono(fx.chime([76, 81, 88], 1.4), 450, .1)
# what survives
fx.mono(blip(52, .3), 468, .1); fx.mono(zap(.15, 500, 140), 468, .05)
for k in range(7): fx.mono(blip(79 + [0, 2, 4, 7, 9, 12, 14][k], .1), 513 + k * 2, .04)
fx.mono(fx.chime([84, 91], 1.0), 544, .08)
fx.sfx("stamp", 590, .32); fx.mono(thud(), 590, .22)
# rewind + hero
fx.mono(fx.sweep(.4, 1600, 260) * .5, 604, .06)
for i, fr in enumerate([617, 641, 667, 694]):
    fx.sfx("swoosh1" if i % 2 == 0 else "swoosh2", fr, .12); fx.mono(blip(69 + [0, 3, 7, 12][i], .2), fr + 2, .09)
fx.mono(fx.chime([81, 88, 93], 1.6), 714, .1); fx.sfx("boom", 714, .1)
# lesson
fx.sfx("pop", 724, .16); fx.mono(blip(50, .3), 746, .1); fx.sfx("pop", 746, .14)
# end card: star spins in, follow taps
fx.sfx("swoosh1", 776, .24); fx.mono(fx.chime([69, 76, 81, 88], 2.2), 782, .1)
fx.sfx("pop", 812, .22)
for fr in (847, 887): fx.sfx("tap", fr, .2)

gm = np.ones(N); a0, a1 = fx.T(608), fx.T(716); gm[a0:a1] = 0.55
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/minify/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/minify/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            if d < 6: low += 1
            print(f"{'LOW' if d < 6 else 'ok '} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/minify/soundtrack.wav", fade_from_frame=893)
