"""DevAegis rung-3 SFX pack, synthesized (new sounds, no reuse from rungs 1–2). Run from repo root:
   python3 src/projects/devaegis/make_sfx.py  →  public/projects/devaegis/sfx/*.wav (48 kHz stereo)"""
import numpy as np, os, wave
from scipy.signal import butter, lfilter

SR = 48000; OUT = "public/projects/devaegis/sfx"; rng = np.random.default_rng(3)
os.makedirs(OUT, exist_ok=True)
t_ = lambda s: np.arange(int(s * SR)) / SR
def bp(x, a, b): bb, aa = butter(2, [a / (SR / 2), b / (SR / 2)], "band"); return lfilter(bb, aa, x)
def lp(x, c): bb, aa = butter(2, c / (SR / 2), "low"); return lfilter(bb, aa, x)
def hp(x, c): bb, aa = butter(2, c / (SR / 2), "high"); return lfilter(bb, aa, x)
def env(n, a, d): e = np.exp(-np.arange(n) / (d * SR)); k = max(1, int(a * SR)); e[:k] *= np.linspace(0, 1, k); return e
def save(name, x, width=0.15):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    d = int(0.0007 * SR); L = x; R = np.concatenate([np.zeros(d), x[:-d]]) * (1 - width) + x * width
    st = np.stack([L, R], 1)
    with wave.open(f"{OUT}/{name}.wav", "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype("<i2").tobytes())
def ring(freqs, dur, decay, amps=None):
    t = t_(dur); x = np.zeros_like(t)
    for i, f in enumerate(freqs): x += (amps[i] if amps else 1 / (i + 1)) * np.sin(2 * np.pi * f * t) * np.exp(-t / (decay * (1 - 0.1 * i)))
    return x

# mechanical keyboard clack
t = t_(0.09); x = bp(rng.standard_normal(len(t)), 1500, 7000) * env(len(t), 0.0005, 0.008) + 0.5 * ring([2300, 3900], 0.09, 0.012)
save("clack", x)
# vault lock clunk: low thump + latch click
t = t_(0.6); x = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 9) * 1.2 + 0.6 * bp(rng.standard_normal(len(t)), 800, 4000) * env(len(t), 0.0005, 0.02) + 0.4 * ring([1180, 2760, 4410], 0.6, 0.05)
save("clunk", x)
# armour facet snap (metallic tick with inharmonic ring)
t = t_(0.35); x = ring([3100, 4870, 6620, 8150], 0.35, 0.05) * 0.7 + bp(rng.standard_normal(len(t)), 3000, 12000) * env(len(t), 0.0003, 0.004)
save("snap", x)
# chain rattle
x = np.zeros(int(0.7 * SR))
for k in range(9):
    s = int((0.02 + k * 0.07 + rng.random() * 0.03) * SR); c = ring([2500 + rng.random() * 2500, 5200 + rng.random() * 2000], 0.12, 0.02)
    x[s:s + len(c)] += c[: len(x) - s] * (0.6 + rng.random() * 0.4)
save("chain", x, 0.3)
# servo whine (rising)
t = t_(0.6); f = 300 + 900 * (t / t[-1]) ** 1.5; x = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * env(len(t), 0.05, 0.4) * 0.5 + lp(rng.standard_normal(len(t)), 900) * 0.2
save("servo", x)
# heavy lever throw: air swish → metal slam → sub
t = t_(1.6); sw = bp(rng.standard_normal(len(t)), 400, 3000) * np.clip(1 - np.abs(t - 0.18) / 0.18, 0, 1) ** 2 * 0.6
slam = np.zeros_like(t); s0 = int(0.34 * SR); tt = t[: len(t) - s0]
slam[s0:] = np.sin(2 * np.pi * (48 + 60 * np.exp(-tt * 18)) * tt) * np.exp(-tt * 3.2) * 1.4 + ring([610, 1480, 2330, 3970], tt[-1] + 1 / SR, 0.18) * 0.8 + bp(rng.standard_normal(len(tt)), 200, 5000) * np.exp(-tt * 40)
save("lever", sw + slam)
# glitch crunch (bit-crushed gated noise)
t = t_(0.45); x = rng.standard_normal(len(t)); x = np.round(x * 3) / 3; gate = (np.floor(t * 38) % 3 != 1).astype(float); x = hp(x, 400) * gate * env(len(t), 0.002, 0.2) + 0.5 * np.sign(np.sin(2 * np.pi * 110 * t)) * gate * env(len(t), 0.002, 0.15)
save("glitch", x)
# coin clink
t = t_(0.8); x = ring([2637, 4061, 5320, 6890], 0.8, 0.22, [1, .6, .45, .3]) + bp(rng.standard_normal(len(t)), 4000, 12000) * env(len(t), 0.0002, 0.003)
save("coin", x)
# ember whoosh (swell)
t = t_(1.1); x = bp(rng.standard_normal(len(t)), 300, 5000) * np.sin(np.pi * t / t[-1]) ** 2 + 0.15 * lp(rng.standard_normal(len(t)), 150)
save("ember", x, 0.4)
# scan sweep
t = t_(1.3); f = 900 + 1800 * t / t[-1]; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) * 0.4 + bp(rng.standard_normal(len(t)), 5000, 11000) * np.sin(np.pi * t / t[-1]) * 0.25
save("scan", x)
# deny (two short buzzes)
x = np.zeros(int(0.42 * SR))
for s in (0.0, 0.18):
    tt = t_(0.14); b = np.sign(np.sin(2 * np.pi * 155 * tt)) * env(len(tt), 0.002, 0.06); b = lp(b, 1800); x[int(s * SR): int(s * SR) + len(b)] += b
save("deny", x)
# notification (two-tone bell)
x = np.zeros(int(1.2 * SR))
for s, f0 in ((0.0, 1046.5), (0.12, 1568)):
    c = ring([f0, f0 * 2.01, f0 * 3.02], 1.0, 0.35, [1, .35, .15]); x[int(s * SR): int(s * SR) + len(c)] += c
save("bell", x)
# sub drop (for the lever slam / logo)
t = t_(2.2); x = np.sin(2 * np.pi * (80 * np.exp(-t * 1.6) + 28) * t) * np.exp(-t * 1.2) + 0.2 * lp(rng.standard_normal(len(t)), 120) * np.exp(-t * 3)
save("subdrop", x)
# iris servo-blades (mechanical ratchet)
x = np.zeros(int(0.9 * SR))
for k in range(14):
    c = ring([1800 + k * 60, 3400], 0.05, 0.008) + bp(rng.standard_normal(int(0.05 * SR)), 2000, 8000) * env(int(0.05 * SR), 0.0003, 0.004)
    s = int(k * 0.055 * SR); x[s: s + len(c)] += c * (1 - k / 18)
save("ratchet", x)
print("sfx ->", sorted(os.listdir(OUT)))
