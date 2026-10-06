"""How It Works #06 (electric motor) soundtrack. Motor whine pitch follows the rotor speed from phi.json
(exported from scenes.tsx PHI), and a commutator click lands on every current flip.
Run from repo root: python3 src/projects/motor/soundtrack.py"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
T = dict(force=140, coil=268, twist=394, flip=545, hero=675, end=830)
PHI = np.array(json.load(open("public/projects/motor/phi.json")))
mus = Mix(seconds=SEC, fps=FPS, seed=61); fx = Mix(seconds=SEC, fps=FPS, seed=33)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(43)
tt = lambda s: np.arange(int(s * SR)) / SR

mus.music(drums_on=[(140, 420), (679, 830)], soft=[(10, 140), (420, 679)], arp_on=[(140, 830)],
          bpm=118, prog=[[52, 55, 59], [48, 52, 55], [50, 53, 57], [47, 50, 54]], final_chord=[52, 55, 59, 64], level=0.045)
def blip(m, s=.12): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 28)
def click(p=2800): x = tt(0.035); return (np.sin(2 * np.pi * p * x) * .5 + rng.standard_normal(len(x)) * .5) * np.exp(-x * 160)
def thud(): x = tt(0.4); return np.sin(2 * np.pi * np.cumsum(70 + 160 * np.exp(-x * 25)) / SR) * np.exp(-x * 9)
def zap(): x = tt(0.2); return np.sin(2 * np.pi * np.cumsum(2600 * np.exp(-x * 18) + 300) / SR) * np.exp(-x * 22)

# motor whine: frequency ∝ rotor speed (deg/frame), only while the rotor is visible and powered
fr = np.arange(N) / SR * FPS
w = np.gradient(PHI)                              # deg per frame
wf = np.interp(fr, np.arange(len(w)), np.abs(w))
vis = ((fr < T["force"] - 4) | (fr > T["twist"])).astype(float)
hz = 90 + 26 * wf
ph = 2 * np.pi * np.cumsum(hz) / SR
whine = (np.sin(ph) * 0.5 + np.sin(2 * ph) * 0.3 + np.sin(3.01 * ph) * 0.15) * np.minimum(1, wf / 4) * vis
whine += fx.lp(rng.standard_normal(N), 0.02) * np.minimum(1, wf / 10) * vis * 0.6
sm = np.convolve(vis, np.ones(2400) / 2400, mode="same")
fx.L += whine * sm * 0.05; fx.R += whine * sm * 0.05
# commutator clicks: every time cos(phi) changes sign while commutated
c = np.cos(np.radians(PHI))
for g in range(1, len(PHI)):
    comm = g < T["force"] or g >= T["flip"]
    if comm and np.sign(c[g]) != np.sign(c[g - 1]): fx.mono(click(3000 if g < T["hero"] else 3400), g - 0.5, 0.16)
# beats
fx.mono(zap(), 146, 0.12); fx.mono(thud(), 222, 0.45); fx.mono(blip(84), 226, 0.1)
fx.mono(blip(79), 298, 0.12); fx.mono(blip(74), 344, 0.12); fx.mono(fx.sweep(0.6, 200, 600) * 0.5, 394, 0.08)
fx.mono(fx.sweep(0.8, 500, 160) * 0.5, 469, 0.1); fx.mono(thud(), 509, 0.35); fx.mono(blip(60, 0.4), 509, 0.08)
fx.sfx("swoosh2", 548, 0.25); fx.mono(fx.chime([76, 83, 88], 1.0), 604, 0.1)
fx.mono(fx.riser(0.8), 655, 0.18); fx.sfx("boom", 676, 0.4)
for g_, m in [(679, 72), (716, 76), (751, 79)]: fx.mono(blip(m, 0.3), g_, 0.14); fx.mono(thud(), g_, 0.18)
fx.mono(fx.chime([64, 71, 76, 83], 1.8), 785, 0.14)
fx.sfx("swoosh1", 832, 0.3); fx.sfx("pop", 846, 0.3); fx.mono(fx.chime([83, 88], 1.0), 847, 0.08)

vo, sr = sf.read("public/projects/motor/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.7 * env) + fx.L * (1 - 0.5 * env) + vo_f * 1.6
R = mus.R * (1 - 0.7 * env) + fx.R * (1 - 0.5 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    for b in json.load(open("public/projects/motor/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            if d < 6: print(f"LOW {p['text'][:32]:32} {d:.1f} dB")
    print("checked")
fx.L, fx.R = L, R
fx.save("public/projects/motor/soundtrack.wav", fade_from_frame=888)
