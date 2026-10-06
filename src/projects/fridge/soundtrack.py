"""How It Works #08 (refrigerator) soundtrack: synth score + fridge SFX (compressor hum, boiling fizz,
condenser warmth, valve hiss) + paced VO. Run: python3 src/projects/fridge/soundtrack.py"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(liquid=104, evap=192, comp=322, cond=415, valve=548, hero=658, end=832)
mus = Mix(seconds=SEC, fps=FPS, seed=81); fx = Mix(seconds=SEC, fps=FPS, seed=47)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(63)
tt = lambda s: np.arange(int(s * SR)) / SR
mus.music(drums_on=[(192, 548), (662, 832)], soft=[(10, 192), (548, 662)], arp_on=[(104, 832)],
          bpm=114, prog=[[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], final_chord=[57, 60, 64, 69], level=0.045)
def blip(m, s=.12): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 28)
def hum(s, f0=50):
    x = tt(s); h = sum(np.sin(2 * np.pi * f0 * k * x) / k for k in (1, 2, 3, 4, 6)) + fx.lp(rng.standard_normal(len(x)), 0.03) * 1.5
    return h * np.minimum(1, x / 0.4) * np.minimum(1, (s - x) / 0.4)
def fizz(s):
    x = tt(s); n = np.zeros(len(x))
    for _ in range(int(s * 120)):
        p = rng.integers(0, len(x) - 2400); k = np.arange(2400) / SR
        n[p:p + 2400] += np.sin(2 * np.pi * rng.uniform(900, 2400) * k) * np.exp(-k * 120) * rng.uniform(.2, .6)
    return n * np.minimum(1, x / .3) * np.minimum(1, (s - x) / .3)
def hiss(s): x = tt(s); return fx.hp(rng.standard_normal(len(x)), 0.35) * np.exp(-x * 3) * np.minimum(1, x / 0.02)
def thud(): x = tt(0.4); return np.sin(2 * np.pi * np.cumsum(60 + 140 * np.exp(-x * 25)) / SR) * np.exp(-x * 9)
def whoomp(s=1.2): x = tt(s); return fx.lp(rng.standard_normal(len(x)), 0.015) * 4 * np.sin(np.pi * x / s)

fx.mono(whoomp(1.4), 8, 0.16); fx.mono(blip(84), 66, 0.1)
fx.mono(fizz(1.6), 126, 0.08); fx.mono(blip(88, 0.2), 140, 0.08)
fx.mono(fizz(4.0), 200, 0.1); fx.mono(fx.sweep(1.0, 300, 900) * 0.4, 272, 0.06)
fx.mono(hum(3.1, 50), 326, 0.05); fx.mono(thud(), 330, 0.15); fx.mono(fx.sweep(0.9, 150, 600) * 0.5, 383, 0.08)
fx.mono(whoomp(3.0), 425, 0.05); fx.mono(blip(72, 0.3), 506, 0.1)
fx.mono(hiss(1.2), 555, 0.22); fx.mono(fx.chime([84, 91, 96], 1.0), 614, 0.09)
fx.mono(fx.riser(0.8), 640, 0.16); fx.sfx("boom", 660, 0.32)
fx.mono(hum(5.6, 50), 662, 0.025)
for g_, m in [(662, 76), (694, 72), (729, 69), (765, 79)]: fx.mono(blip(m, 0.3), g_ - 3, 0.06)
fx.mono(hiss(0.6), 765, 0.14); fx.mono(fizz(1.0), 662, 0.06)
fx.mono(fx.chime([69, 76, 81, 88], 1.8), 804, 0.13)
fx.sfx("swoosh1", 834, 0.3); fx.sfx("pop", 846, 0.3); fx.mono(fx.chime([81, 88], 1.0), 847, 0.08)

# pull the music back under the one-word hero beats so each word reads clearly
gm = np.ones(N); a0, a1 = fx.T(655), fx.T(800); gm[a0:a1] = 0.55
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/fridge/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.5 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.5 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    for b in json.load(open("public/projects/fridge/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            if d < 6: print(f"LOW {p['text'][:32]:32} {d:.1f} dB")
    print("checked")
fx.L, fx.R = L, R
fx.save("public/projects/fridge/soundtrack.wav", fade_from_frame=893)
if "--probe" in sys.argv:
    s = int(694 / 30 * SR); e = int(725 / 30 * SR)
    r = lambda x: round(20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9), 1)
    print("mus", r(mus.L * (1 - 0.8 * env)), "fx", r(fx.L), "vo", r(vo_f * 1.6))
