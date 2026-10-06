"""The Simple Money · Reel 01 soundtrack:
  music  — "Abstract Fashion Pop (Rails)" by Qube Sounds, Pixabay Content License (free, commercial use, no credit required)
  voice  — Kokoro TTS (open-source, Apache-2.0), voice af_heart — lines in vo_lines.json, made with scripts/audio/kokoro_vo.py
  sfx    — engine pack (public/sfx)
Run from repo root:  python3 src/projects/simplemoney/soundtrack.py   (--stems prints VO vs bed levels)
Scene starts must match S in Reel01.tsx.
"""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

S = dict(hook=0, friends=119, race=252, result=503, coins=622, lesson=728, end=845, total=900)
VO = [("v01", 6), ("v02", 125), ("v04", 316), ("v05", 404), ("v07", 507), ("v08", 627), ("v09", 731), ("v10", 805)]
AGE_F = {22: 14, 32: 62, 42: 148, 52: 230}            # race-scene local frames (scenes.tsx)
age_f = lambda a: S["race"] + float(np.interp(a, list(AGE_F), list(AGE_F.values())))
TRACK = "public/projects/simplemoney/music/abstract-fashion-pop-rails_qubesounds.wav"

mus = Mix(seconds=30, fps=30, seed=21)
fx = Mix(seconds=30, fps=30, seed=5)
SR, N = fx.SR, fx.N
t = lambda fr: fr / 30

# ── music edit (136 BPM): open on the full groove · build under the lesson · drop on the logo
mus.track_edit(TRACK, [
    (0.0,            12.353, t(S["lesson"]) + 0.06),   # full groove from the first frame
    (t(S["lesson"]), 51.154, t(S["end"] - S["lesson"]) + 0.06),  # quiet build → drop
    (t(S["end"]),    55.055, t(S["total"] - S["end"]) + 0.3),    # the drop under the logo
], gain=0.5, xfade_s=0.06)

# ── SFX
# 1 hook
fx.sfx("impact", 6, .45, max_s=1.2)
fx.sfx("impact", 62, .55, max_s=1.4); fx.mono(fx.chime([72, 79, 84]), 62, .08)
fx.sfx("swish", 66, .2)
# 2 friends
fx.sfx("whoosh2", S["friends"] + 4, .3)
fx.sfx("swish", S["friends"] + 4, .3); fx.sfx("flip", S["friends"] + 12, .2)
fx.sfx("swish", S["friends"] + 64, .3); fx.sfx("flip", S["friends"] + 72, .2)
for d in (84, 90, 96): fx.sfx("tap2", S["friends"] + d, .25)
fx.sfx("ding2", S["friends"] + 106, .22, max_s=1.2)
# 3 race chart: soft tick each year, hits at 32 / 42 / 52
fx.sfx("whoosh2", S["race"] + 4, .3)
for a in range(23, 53):
    fx.sfx("tap2", age_f(a), .05 + .04 * (a in (32, 42)))
fx.sfx("pop", age_f(32), .3); fx.sfx("pop", age_f(42), .3)
fx.sfx("impact", age_f(52), .45, max_s=1.2); fx.mono(fx.chime([76, 79, 84, 88], 1.8), age_f(52), .08)
# 4 result
fx.sfx("whoosh2", S["result"] + 4, .3)
fx.sfx("flip", S["result"] + 14, .25); fx.sfx("flip", S["result"] + 54, .25)
fx.sfx("stamp", S["result"] + 102, .45, max_s=1.0)
# 5 coins: clinks as they land, payoff on "$300K more out"
fx.sfx("whoosh2", S["coins"] + 4, .3)
for i in range(0, 45, 2):
    fx.sfx("coin", S["coins"] + 8 + i * 1.1, .08 if i < 15 else .055, max_s=0.5)
fx.sfx("tap2", S["coins"] + 8, .25)
fx.sfx("impact", S["coins"] + 62, .45, max_s=1.2); fx.sfx("coin", S["coins"] + 62, .25)
# 6 lesson
fx.sfx("swish", S["lesson"] + 32, .3)
fx.mono(fx.chime([72, 76, 79], 2.0), S["lesson"] + 46, .1)
fx.sfx("tap2", S["lesson"] + 78, .25); fx.sfx("tap2", S["lesson"] + 92, .25)
# 7 end card: the drop
fx.sfx("boom", S["end"] + 1, .6); fx.mono(fx.chime([72, 79, 84, 88, 91], 2.4), S["end"] + 3, .1)
fx.sfx("pop", S["end"] + 12, .3)

# ── voiceover (Kokoro 24 kHz → 48 kHz) + sidechain duck of music & SFX
vo = np.zeros(N)
for name, fr in VO:
    a, sr = sf.read(f"public/projects/simplemoney/vo/{name}_t.wav")
    a = resample_poly(a, SR, sr); s = fx.T(fr); e = min(N, s + len(a)); vo[s:e] += a[: e - s]
vo = vo / np.abs(vo).max() * 0.9
env = np.abs(vo); k = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(k) / k, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))            # gentle de-harsh
L = mus.L * (1 - 0.72 * env) + fx.L * (1 - 0.6 * env) + vo_f * 1.9
R = mus.R * (1 - 0.72 * env) + fx.R * (1 - 0.6 * env) + vo_f * 1.9
if "--stems" in sys.argv:
    for name, fr in VO:
        s = fx.T(fr); e = s + int(0.8 * SR); db = lambda x: round(20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9), 1)
        print(name, "vo", db(vo_f * 1.9), "bed", db(L - vo_f * 1.9))
fx.L, fx.R = L, R
fx.save("public/projects/simplemoney/reel01.wav", fade_from_frame=885)
