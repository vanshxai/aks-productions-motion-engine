"""How It Works #04 (bridge truss) soundtrack: synth score + synthesized structural SFX + paced Kokoro VO (vo.wav from vo_assemble.py).
Run from repo root:  python3 src/projects/bridge/soundtrack.py"""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(hook=0, shapes=66, why=226, bridge=343, bend=558, hero=690, end=832)  # keep in sync with scenes.tsx

mus = Mix(seconds=SEC, fps=FPS, seed=41)
fx = Mix(seconds=SEC, fps=FPS, seed=19)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(29)
tt = lambda s: np.arange(int(s * SR)) / SR

# score: G major-ish, 112 bpm; breakdown under "why", drop on "Light."
mus.music(drums_on=[(66, 226), (343, 558), (697, 832)], soft=[(20, 66), (226, 343), (558, 697)], arp_on=[(66, 832)],
          bpm=112, prog=[[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]], final_chord=[55, 59, 62, 67], level=0.05)
beat = FPS * 60 / 112; k = 0
while 697 + k * beat < 832:
    s = tt(0.45); mus.mono(np.sin(2 * np.pi * note(31) * s) * np.exp(-s * 4.5), 697 + k * beat, 0.24); k += 1

# ── structural SFX pack
def clank(f0=420):
    x = tt(0.9); modes = [(f0, 5), (f0 * 2.76, 8), (f0 * 5.4, 12), (f0 * 8.9, 18)]
    return sum(np.sin(2 * np.pi * f * x) * np.exp(-x * d) / (i + 1) for i, (f, d) in enumerate(modes)) + rng.standard_normal(len(x)) * np.exp(-x * 120) * 0.3
def creak(s=0.7):
    x = tt(s); f = 140 + 90 * np.sin(2 * np.pi * 1.3 * x) + 60 * x / s
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return fx.lp(saw, 0.08) * np.minimum(1, x / 0.05) * np.minimum(1, (s - x) / 0.1) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * x))
def thud():
    x = tt(0.45); return np.sin(2 * np.pi * np.cumsum(60 + 140 * np.exp(-x * 25)) / SR) * np.exp(-x * 9)
def tick(p=2600):
    x = tt(0.05); return (np.sin(2 * np.pi * p * x) * 0.6 + rng.standard_normal(len(x)) * 0.4) * np.exp(-x * 100)
def rumble(s):
    x = tt(s); return fx.lp(rng.standard_normal(len(x)), 0.012) * 5 * np.minimum(1, x / 0.6) * np.minimum(1, (s - x) / 0.6)
def blip(m=84, s=0.12):
    x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 28)

# hook: bars draw → ticks, triangles pulse
for i in range(12): fx.mono(tick(2000 + i * 90), 4 + i * 2.6, 0.12)
fx.mono(clank(380), 36, 0.18)
# shapes
fx.sfx("swoosh2", 76, 0.25); fx.mono(creak(0.8), 104, 0.3); fx.mono(thud(), 128, 0.45); fx.sfx("pop", 112, 0.2); fx.mono(blip(60, 0.25), 112, 0.08)
fx.sfx("swoosh2", 150, 0.16); fx.mono(clank(520), 184, 0.16); fx.mono(fx.chime([79, 86], 0.9), 192, 0.12)
# why
fx.mono(blip(84), 236, 0.12); fx.mono(creak(0.5), 296, 0.18); fx.mono(clank(600), 324, 0.25); fx.sfx("pop", 330, 0.22)
# bridge: build ticks, truck rumble, force reveal, labels
for i in range(10): fx.mono(tick(1800 + i * 120), 343 + i * 2.6, 0.1)
fx.mono(rumble(6.6), 352, 0.12)
fx.mono(fx.sweep(0.7, 250, 700) * 0.5, 400, 0.08); fx.mono(clank(450), 403, 0.18)
fx.mono(blip(76, 0.2), 463, 0.12); fx.mono(clank(330), 464, 0.15)
fx.mono(blip(88, 0.2), 521, 0.12); fx.mono(clank(660), 522, 0.15)
# bend
fx.sfx("swoosh1", 560, 0.25); fx.mono(creak(0.9), 574, 0.25); fx.mono(thud(), 596, 0.3)
fx.mono(fx.chime([74, 81, 86], 1.2), 630, 0.1)
# hero: riser, drop on "Light.", stamp per word, truss pulse
fx.mono(fx.riser(0.9), 670, 0.2); fx.sfx("boom", 693, 0.3)
for fr, f0 in [(697, 420), (731, 520), (766, 640)]: fx.mono(clank(f0), fr - 2, 0.16); fx.mono(thud(), fr - 2, 0.14)
fx.mono(rumble(4.5), 700, 0.1)
fx.sfx("boom", 800, 0.4); fx.mono(fx.chime([67, 74, 79, 86], 2.0), 801, 0.15)
# end
fx.sfx("swoosh1", 834, 0.3); fx.sfx("pop", 852, 0.3); fx.mono(fx.chime([79, 86], 1.0), 853, 0.08)

# ── paced VO (already 48 kHz, timing baked in) + ducking
vo, sr = sf.read("public/projects/bridge/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.7 * env) + fx.L * (1 - 0.5 * env) + vo_f * 1.6
R = mus.R * (1 - 0.7 * env) + fx.R * (1 - 0.5 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    import json
    for b in json.load(open("public/projects/bridge/vo.json"))["beats"]:
        s = int(b["phrases"][0]["start"] * SR); e = int(b["phrases"][0]["end"] * SR); r = lambda x: round(20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9), 1)
        print(f"{b['id']:>7} vo {r(vo_f * 1.6)} bed {r(L - vo_f * 1.6)}")
fx.L, fx.R = L, R
fx.save("public/projects/bridge/soundtrack.wav", fade_from_frame=888)
