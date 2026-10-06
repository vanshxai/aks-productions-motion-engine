"""The Simple Money · Reel 01 soundtrack (synth score + free SFX).
Run from repo root:  python3 src/projects/simplemoney/soundtrack.py
120 BPM = 15 frames/beat. Scene starts must match S in Reel01.tsx.
"""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix

S = dict(hook=0, friends=90, race=210, result=510, coins=630, lesson=750, end=825, total=900)
RACE0, RACE1 = S["race"] + 26, S["race"] + 260          # age 22 → 52
age_f = lambda a: RACE0 + (a - 22) / 30 * (RACE1 - RACE0)

m = Mix(seconds=30, fps=30, seed=21)
# bright, optimistic progression (C maj7 · A m7 · F maj7 · G) — breakdown under the lesson, drop on the logo
m.music(drums_on=[(S["friends"], S["lesson"]), (S["end"], S["total"])], soft=[(0, S["friends"])],
        arp_on=[(S["friends"], S["lesson"]), (S["end"], S["total"])], bpm=120,
        prog=[[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]],
        final_chord=[48, 55, 60, 64, 67], level=0.05)

# 1 · hook
m.sfx("impact", 4, .55, max_s=1.2)
m.sfx("impact", 26, .7, max_s=1.4); m.mono(m.chime([72, 79, 84]), 26, .10)
m.sfx("swish", 30, .25)
m.sfx("softnotif", 58, .30)
# 2 · friends
m.sfx("whoosh2", S["friends"] + 4, .35)
m.sfx("swish", S["friends"] + 10, .35); m.sfx("flip", S["friends"] + 16, .25)
m.sfx("swish", S["friends"] + 22, .35); m.sfx("flip", S["friends"] + 28, .25)
for d in (50, 58, 66): m.sfx("tap2", S["friends"] + d, .30)
m.sfx("ding2", S["friends"] + 86, .30, max_s=1.2)
# 3 · race chart — a soft tick every year, hits at 32 / 42 / 52
m.sfx("whoosh2", S["race"] + 4, .35)
for a in range(23, 53):
    m.sfx("tap2", age_f(a), .07 + .05 * (a in (32, 42)))
m.sfx("pop", age_f(32), .40); m.sfx("softnotif", age_f(32) + 2, .25)
m.sfx("pop", age_f(42), .40); m.sfx("softnotif", age_f(42) + 2, .25)
m.sfx("impact", RACE1, .55, max_s=1.2); m.mono(m.chime([76, 79, 84, 88], 1.8), RACE1, .10)
m.sfx("tap2", RACE1 + 6, .25)
# 4 · result
m.sfx("whoosh2", S["result"] + 4, .35)
m.sfx("flip", S["result"] + 12, .3); m.sfx("flip", S["result"] + 26, .3)
m.sfx("tap2", S["result"] + 30, .25); m.sfx("tap2", S["result"] + 44, .25)
m.sfx("stamp", S["result"] + 76, .55, max_s=1.0)
# 5 · 3D coins — clinks as coins land (every other coin), payoff on "₹25L more out"
m.sfx("whoosh2", S["coins"] + 4, .35)
for i in range(0, 35, 2):
    m.sfx("coin", S["coins"] + 14 + i * 1.6, .10 if i < 10 else .07, max_s=0.5)
m.sfx("tap2", S["coins"] + 72, .3)
m.sfx("impact", S["coins"] + 88, .55, max_s=1.2); m.sfx("coin", S["coins"] + 88, .3); m.mono(m.chime([79, 84, 88, 91]), S["coins"] + 88, .10)
# 6 · lesson (breakdown: drums out)
m.sfx("swish", S["lesson"] + 18, .35)
m.mono(m.chime([72, 76, 79], 2.0), S["lesson"] + 24, .12)
m.sfx("tap2", S["lesson"] + 46, .3); m.sfx("tap2", S["lesson"] + 54, .3)
m.sfx("riser", S["end"] - 2, .35, max_s=4.0)
# 7 · end card — the drop
m.sfx("boom", S["end"] + 2, .8); m.mono(m.chime([72, 79, 84, 88, 91], 2.4), S["end"] + 4, .14)
m.sfx("swish", S["end"] + 12, .25)
m.sfx("pop", S["end"] + 36, .35)
m.save("public/projects/simplemoney/reel01.wav", fade_from_frame=870)
