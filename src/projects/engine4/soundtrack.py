"""How It Works #05 (4-stroke engine) soundtrack. Firing pulses are generated from the SAME crank-angle
timeline as scenes.tsx, so every bang lands on a spark. Run from repo root: python3 src/projects/engine4/soundtrack.py"""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(hero=723, end=841)
mus = Mix(seconds=SEC, fps=FPS, seed=51); fx = Mix(seconds=SEC, fps=FPS, seed=27)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(37)
tt = lambda s: np.arange(int(s * SR)) / SR
def ease_io(t): return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2
def ease_o(t): return 1 - (1 - t) ** 3
def ease_i(t): return t ** 3
def seg(g, a, b, va, vb, e):
    t = min(1, max(0, (g - a) / (b - a))); return va + (vb - va) * e(t)
def theta(g):  # mirror of scenes.tsx theta()
    if g <= 105: return -2160 + g / 105 * 1680
    if g <= 178: return seg(g, 105, 178, -480, 0, ease_o)
    if g <= 300: return seg(g, 230, 300, 0, 180, ease_io)
    if g < 479: return seg(g, 359, 430, 180, 359.5, ease_io)
    if g <= 575: return seg(g, 520, 575, 360, 540, ease_i)
    return seg(g, 624, 700, 540, 720, ease_io)
def hero_th(h): return 720 + 6 * h + 0.11 * h * h

mus.music(drums_on=[(125, 446), (725, 841)], soft=[(10, 125), (446, 725)], arp_on=[(125, 841)],
          bpm=120, prog=[[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47]], final_chord=[45, 48, 52, 57], level=0.045)

def bang(g=1.0, bright=0.5):
    x = tt(0.22); body = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-x * 40)) / SR) * np.exp(-x * 22)
    crack = fx.hp(rng.standard_normal(len(x)), 0.25) * np.exp(-x * 70) * bright
    return (body + crack) * g
def click(p=3000): x = tt(0.04); return (np.sin(2 * np.pi * p * x) * .6 + rng.standard_normal(len(x)) * .4) * np.exp(-x * 140)
def hiss(s, lo=0.08, hi=0.4):
    x = tt(s); n = fx.hp(fx.lp(rng.standard_normal(len(x)), hi), lo); return n * np.sin(np.pi * x / s) ** 2
def zap():
    x = tt(0.18); return np.sin(2 * np.pi * np.cumsum(3000 * np.exp(-x * 20) + 400) / SR) * np.exp(-x * 25) + rng.standard_normal(len(x)) * np.exp(-x * 60) * .4
def blip(m, s=.12): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 28)

# firing events: each time the crank passes 360 (mod 720) → bang; valves click at 0 and 540
def crossings(fn, f0, f1, step=0.05):
    out, prev = [], fn(f0)
    g = f0 + step
    while g <= f1:
        cur = fn(g)
        for target, kind in [(360, "fire"), (0, "inval"), (540, "exval")]:
            k0 = np.floor((prev - target) / 720); k1 = np.floor((cur - target) / 720)
            if k1 > k0: out.append((g, kind))
        prev = cur; g += step
    return out
for g, kind in crossings(theta, 0, 178):
    if kind == "fire": fx.mono(bang(0.32, 0.5), g, 1); fx.mono(zap(), g, 0.05)
    else: fx.mono(click(2400 if kind == "inval" else 1900), g, 0.12)
# explained strokes (synced to the VO beats)
fx.mono(hiss(2.4, 0.05, 0.3), 232, 0.18)                                  # intake rush
fx.mono(click(2600), 232, 0.2); fx.mono(click(2200), 306, 0.2)             # intake valve open/close
fx.mono(fx.sweep(2.4, 120, 360) * 0.5, 359, 0.07); fx.mono(blip(81, 0.25), 410, 0.12)   # compression rising
fx.mono(zap(), 479, 0.2); fx.mono(bang(1.0, 0.9), 482, 0.55); fx.sfx("boom", 520, 0.3)   # spark + blast
fx.mono(click(1900), 610, 0.2); fx.mono(hiss(2.6, 0.02, 0.15), 626, 0.16)  # exhaust valve + puff
# hero: inline-4, order 1-3-4-2 → a bang every 180° of crank
offs = [0, 540, 180, 360]
for o in offs:
    for g, kind in crossings(lambda h: hero_th(h) - o, 0, 118, 0.02):
        if kind == "fire": fx.mono(bang(0.22, 0.35), T["hero"] + g, 1)
fx.mono(fx.riser(0.8), 700, 0.16); fx.sfx("boom", 725, 0.35)
fx.mono(fx.chime([69, 76, 81], 1.6), 805, 0.12)
fx.sfx("swoosh1", 843, 0.3); fx.sfx("pop", 857, 0.3); fx.mono(fx.chime([81, 88], 1.0), 858, 0.08)

vo, sr = sf.read("public/projects/engine4/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.7 * env) + fx.L * (1 - 0.5 * env) + vo_f * 1.6
R = mus.R * (1 - 0.7 * env) + fx.R * (1 - 0.5 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    import json
    for b in json.load(open("public/projects/engine4/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: round(20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9), 1)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            if d < 6: print(f"LOW {p['text'][:30]:30} margin {d:.1f} dB")
    print("checked")
fx.L, fx.R = L, R
fx.save("public/projects/engine4/soundtrack.wav", fade_from_frame=888)
