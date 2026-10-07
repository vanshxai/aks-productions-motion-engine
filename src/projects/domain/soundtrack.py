"""DevAegis How It Works #04 (domain lock): synth score + code SFX (key ticks, deletes, glyph scramble,
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
mus.music(drums_on=[(224, 616), (620, 760)], soft=[(10, 224), (616, 620)], arp_on=[(100, 770)],
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
# hook: three domains
fx.mono(fx.chime([81, 88], 1.2), 4, .07)
for fr in (8, 16, 24): fx.sfx("pop", fr, .12)
# read: url types, page loads
fx.typing(80, 20, 1.0, .1); fx.mono(fx.sweep(.8, 400, 1200) * .5, 96, .04); fx.mono(fx.chime([76, 83], 1.0), 112, .07)
fx.mono(blip(72, .12), 118, .06); fx.sfx("pop", 124, .12)
# check: allow list lines light
fx.mono(blip(76, .12), 178, .07); fx.mono(blip(79, .12), 186, .07); fx.sfx("pop", 192, .1)
# match: green
fx.mono(fx.chime([76, 83, 88], 1.4), 226, .11); fx.sfx("tap", 227, .14); fx.sfx("pop", 228, .14)
# no match: red
fx.typing(284, 16, 1.0, .1); fx.mono(buzz(.35), 302, .07); fx.mono(thud(), 302, .14); fx.sfx("pop", 304, .14)
# weak: check deleted
fx.mono(zap(.2, 1400, 200), 360, .08); fx.mono(zap(.2, 1100, 160), 366, .07)
fx.mono(buzz(.4), 386, .07); fx.sfx("stamp", 388, .22)
# strong: encrypted, still blocked, then domain matches and it decrypts
fx.sfx("boom", 417, .12); fx.mono(thud(), 417, .14)
for k in range(6): tk(420 + k * 3, .04, 1800 + 150 * k)
fx.typing(480, 15, 1.0, .1)
for k in range(14): tk(496 + int(k * 1.8), .045, 1600 + 120 * k)
fx.mono(fx.chime([76, 83, 88, 93], 1.6), 522, .1); fx.sfx("pop", 502, .12)
# copy: dead on another site
fx.typing(535, 15, 1.0, .1)
for k in range(8): tk(550 + int(k * 2), .045, 3000 - 150 * k)
fx.mono(buzz(.35), 566, .06); fx.mono(thud(), 566, .13); fx.sfx("pop", 562, .12)
# hero
for i, fr in enumerate([616, 640, 663]):
    fx.sfx("swoosh1" if i % 2 == 0 else "swoosh2", fr, .12); fx.mono(blip(69 + [0, 3, 7][i], .2), fr + 2, .09)
fx.mono(fx.chime([81, 88, 93], 1.6), 689, .1); fx.sfx("boom", 689, .1)
# lesson: three rows return
for fr in (720, 728, 736): fx.sfx("pop", fr, .13)
fx.mono(fx.chime([76, 83], 1.0), 740, .07)
# end card
fx.sfx("swoosh1", 770, .24); fx.mono(fx.chime([69, 76, 81, 88], 2.2), 776, .1)
fx.sfx("pop", 806, .22)
for fr in (836, 862): fx.sfx("tap", fr, .2)

gm = np.ones(N); a0, a1 = fx.T(614), fx.T(716); gm[a0:a1] = 0.55
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/domain/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/domain/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            if d < 6: low += 1
            print(f"{'LOW' if d < 6 else 'ok '} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/domain/soundtrack.wav", fade_from_frame=893)
