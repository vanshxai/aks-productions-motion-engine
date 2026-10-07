"""DevAegis How It Works #02 (AES-256 round): synth score + code SFX (key ticks, deletes, glyph scramble,
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
mus.music(drums_on=[(244, 610), (640, 760)], soft=[(10, 244), (610, 640)], arp_on=[(100, 770)],
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

def buzz(s=.28):
    x = tt(s); return np.sign(np.sin(2 * np.pi * 74 * x)) * fx.lp(np.ones(len(x)), .3) * np.exp(-x * 7) * .5
# hook: grid pops, bytes tick in
fx.mono(fx.chime([81, 88], 1.2), 4, .07)
for k in range(16): tk(8 + k, .035, 2400 + 60 * k, (k % 4 - 1.5) * .25)
# grid + round 0 key-in
fx.sfx("pop", 147, .16); fx.typing(177, 24, 1.0, .1)
fx.mono(zap(.25, 1400, 260), 216, .07)
for k in range(16): tk(216 + int(k * 1.4), .05, 2600 + 80 * k, (k % 4 - 1.5) * .25)
fx.mono(fx.chime([76, 83], 1.0), 240, .08)
# sub: 16 staggered cell swaps, s-box readout
fx.sfx("pop", 258, .12)
for k in range(16): tk(250 + int(k * 1.7), .06, 1800 + 110 * k, (k % 4 - 1.5) * .25)
fx.mono(fx.chime([81, 88], 1.0), 304, .08)
# shift: rows slide
fx.sfx("swoosh1", 340, .16)
for r, fr in enumerate([344, 352, 360]): fx.mono(zip_(.35), fr, .06 + .02 * r)
fx.mono(thud(), 384, .16)
# mix: four columns blend
for c in range(4): fx.mono(blip(72 + c * 3, .14), 404 + c * 5, .07); fx.mono(zip_(.3), 404 + c * 5, .05)
fx.mono(fx.chime([76, 83, 88], 1.2), 436, .09)
# key: xor in
fx.sfx("pop", 452, .14)
for k in range(16): tk(454 + int(k * 1.6), .06, 2900 - 60 * k, (k % 4 - 1.5) * .25)
fx.mono(fx.chime([81, 88, 93], 1.4), 480, .11); fx.sfx("tap", 481, .14)
# one round done, then 14 ticks
fx.sfx("pop", 490, .15)
for j in range(13): tk(536 + int(j * 4.2), .035, 1500 + 130 * j)
fx.mono(fx.riser(.7), 530, .02)
fx.mono(fx.chime([76, 83, 88, 93], 1.8), 601, .1); fx.mono(thud(), 601, .12)
# rewind + hero
fx.mono(fx.sweep(.4, 1600, 260) * .5, 604, .06)
for i, fr in enumerate([612, 637, 661, 686]):
    fx.sfx("swoosh1" if i % 2 == 0 else "swoosh2", fr, .12); fx.mono(blip(69 + [0, 3, 7, 12][i], .2), fr + 2, .09)
fx.mono(fx.chime([81, 88, 93], 1.6), 706, .1); fx.sfx("boom", 706, .1)
# lesson: noise
fx.sfx("pop", 722, .16); fx.mono(buzz(.3), 722, .05); fx.mono(blip(50, .3), 740, .09)
# end card
fx.sfx("swoosh1", 776, .24); fx.mono(fx.chime([69, 76, 81, 88], 2.2), 782, .1)
fx.sfx("pop", 812, .22)
for fr in (847, 887): fx.sfx("tap", fr, .2)

gm = np.ones(N); a0, a1 = fx.T(608), fx.T(716); gm[a0:a1] = 0.55; gm[fx.T(530):fx.T(606)] = 0.55
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/aes/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/aes/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            if d < 6: low += 1
            print(f"{'LOW' if d < 6 else 'ok '} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/aes/soundtrack.wav", fade_from_frame=893)
