"""How It Works #03 (jet engine) soundtrack: synth score + synthesized aero SFX pack + Kokoro VO (af_heart).
Run from repo root:  python3 src/projects/jet/soundtrack.py"""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

FPS, SEC = 30, 30
T = dict(hook=0, words=66, suck=160, squeeze=284, bang=404, blow=524, hero=645, end=812)  # keep in sync with scenes.tsx
VO = [("j01", 8), ("j02a", 70), ("j02b", 92), ("j02c", 116), ("j02d", 137), ("j03", 168), ("j04", 291), ("j05", 411), ("j06", 532),
      ("j07a", 660), ("j07b", 690), ("j07c", 732), ("j08", 822)]

mus = Mix(seconds=SEC, fps=FPS, seed=31)
fx = Mix(seconds=SEC, fps=FPS, seed=17)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(23)
tt = lambda s: np.arange(int(s * SR)) / SR

# score: D-minor, 118 bpm; drums in from the words, breakdown under "bang", drop on thrust
mus.music(drums_on=[(66, 404), (524, 645), (652, 812)], soft=[(20, 66), (404, 524)], arp_on=[(66, 812)],
          bpm=118, prog=[[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], final_chord=[50, 53, 57, 62], level=0.05)
beat = FPS * 60 / 118; k = 0
while 652 + k * beat < 812:
    s = tt(0.45); mus.mono(np.sin(2 * np.pi * note(26) * s) * np.exp(-s * 4.5), 652 + k * beat, 0.38); k += 1

# ── aero SFX pack (synthesized)
def bed(f0, f1, rpm_fn, whine_g, roar_fn):
    """Continuous engine bed: fan/compressor whine whose pitch follows rpm_fn(frame) 0..1, plus filtered roar."""
    n0, n1 = fx.T(f0), fx.T(f1); n = n1 - n0
    fr = f0 + np.arange(n) / SR * FPS
    r = np.array([rpm_fn(x) for x in fr]); ro = np.array([roar_fn(x) for x in fr])
    ph = 2 * np.pi * np.cumsum(180 + 1700 * r) / SR
    whine = (np.sin(ph) + 0.5 * np.sin(ph * 2.01) + 0.25 * np.sin(ph * 3.03)) * r
    noise = rng.standard_normal(n)
    roar = fx.lp(noise, 0.03) * 3 + fx.lp(noise, 0.12) * 0.6
    env = np.minimum(1, np.arange(n) / (0.3 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.4 * SR))
    sig = (whine * whine_g + roar * ro) * env
    fx.L[n0:n1] += sig; fx.R[n0:n1] += sig * 0.96
spool = lambda fr: min(1, max(0, (fr - 70) / 110)) ** 0.7
roar = lambda fr: 0.025 + 0.06 * min(1, max(0, (fr - 432) / 20)) + 0.05 * min(1, max(0, (fr - 652) / 10)) - 0.05 * min(1, max(0, (fr - 770) / 40))
bed(60, 812, lambda fr: spool(fr) * (1 - 0.6 * min(1, max(0, (fr - 760) / 50))), 0.018, roar)
def blip(m=84, s=0.1):
    x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 30)
def stamp():
    x = tt(0.3); return np.sin(2 * np.pi * np.cumsum(90 + 220 * np.exp(-x * 30)) / SR) * np.exp(-x * 12) + rng.standard_normal(len(x)) * np.exp(-x * 90) * 0.4
def ignite():
    x = tt(1.2); crack = rng.standard_normal(len(x)) * np.exp(-x * 30)
    whoomp = fx.lp(rng.standard_normal(len(x)), 0.02) * 6 * np.exp(-x * 2.5) * np.minimum(1, x / 0.05)
    return crack * 0.6 + whoomp
def suction(s=1.2):
    x = tt(s); return fx.hp(fx.lp(rng.standard_normal(len(x)), 0.15), 0.02) * np.sin(np.pi * x / s) ** 2

# hook
fx.mono(fx.sweep(1.0, 180, 480) * 0.6, 2, 0.1); fx.mono(fx.riser(0.8), 40, 0.2); fx.sfx("whoosh", 60, 0.4)
# the four words: a stamp per word
for fr in (70, 92, 116, 137): fx.mono(stamp(), fr, 0.35); fx.mono(blip(76 + (fr % 7)), fr, 0.1)
# suck
fx.mono(suction(1.4), 170, 0.25); fx.sfx("pop", 216, 0.2)
for i in range(6): fx.mono(blip(88, 0.05), 200 + i * 9, 0.05)
# squeeze: rising tick per pressure step
for i in range(10): fx.mono(blip(72 + i * 2, 0.08), 314 + i * 7, 0.08)
fx.sfx("pop", 384, 0.25); fx.mono(fx.chime([74, 81], 0.8), 384, 0.08)
# bang: ignition
fx.mono(ignite(), 432, 0.55); fx.sfx("boom", 434, 0.3)
fx.mono(fx.sweep(1.2, 200, 900) * 0.5, 432, 0.06)
# blow: turbine scream + shaft link + exhaust whoosh
fx.mono(fx.sweep(1.0, 900, 2200) * 0.4, 548, 0.05); fx.sfx("pop", 556, 0.25); fx.mono(blip(86, 0.2), 557, 0.1)
fx.sfx("whoosh", 604, 0.45)
# hero: riser → drop, thrust arrows
fx.mono(fx.riser(1.0), 622, 0.24); fx.sfx("boom", 652, 0.55); fx.sfx("whoosh", 648, 0.3)
fx.sfx("swoosh2", 662, 0.3); fx.sfx("swoosh1", 692, 0.3)
fx.sfx("boom", 731, 0.4); fx.mono(fx.chime([62, 69, 74, 81], 2.0), 732, 0.16)
# end
fx.sfx("swoosh1", 814, 0.3); fx.sfx("pop", 834, 0.3); fx.mono(fx.chime([81, 86], 1.0), 835, 0.08)

# VO + ducking
vo = np.zeros(N)
for name, fr in VO:
    a_, sr = sf.read(f"public/projects/jet/vo/{name}_t.wav")
    a_ = resample_poly(a_, SR, sr); s = fx.T(fr); e = min(N, s + len(a_)); vo[s:e] += a_[: e - s]
vo = vo / np.abs(vo).max() * 0.9
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.6 * env) + fx.L * (1 - 0.5 * env) + vo_f * 1.6
R = mus.R * (1 - 0.6 * env) + fx.R * (1 - 0.5 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    for name, fr in VO:
        s = fx.T(fr); e = s + int(0.5 * SR); r = lambda x: round(20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9), 1)
        print(name, "vo", r(vo_f * 1.6), "bed", r(L - vo_f * 1.6))
fx.L, fx.R = L, R
fx.save("public/projects/jet/soundtrack.wav", fade_from_frame=885)
