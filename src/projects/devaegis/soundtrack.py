"""DevAegis 60s soundtrack. Run from repo root:  python3 src/projects/devaegis/soundtrack.py
Music: "Future Design" by penguinmusic (Pixabay Content License: free commercial use, no attribution required).
Edit: track 2.0→57.5 s plays over video 0→55.5 s (groove kicks in at video 13.3 s = the ✦ ignition; the track drops out at
video 43.8 s = the lever slam); the track's ending (68.7→73.2 s) is spliced on at 55.5 s for the end card.
SFX: new synthesized pack in public/projects/devaegis/sfx (make_sfx.py). Scene starts must match DevAegis60.tsx."""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix

S = dict(ship=0, invoice=113, chat=205, ghost=295, ignite=399, system=475, forge=548, aes=699, lock=788, tie=894, dash=1000, lever=1135, slam=1225, susp=1315, paid=1404, restore=1495, head=1569, end=1660)
m = Mix(seconds=60, sfx_dir="public/projects/devaegis/sfx")
m.track_edit("public/projects/devaegis/music/future-design_penguinmusic.wav", [(0.0, 2.0, 55.5 + 0.06), (55.5, 68.7, 4.5)], gain=0.6)

def keys(start, n, every=3, g=0.16):
    for i in range(n): m.sfx("clack", start + i * every, g * (0.8 + 0.4 * ((i * 7) % 5) / 5))

# ── ACT I: the ghost
keys(S["ship"] + 6, 3); keys(S["ship"] + 28, 7)
m.sfx("bell", S["ship"] + 52, .18); m.sfx("ember", S["ship"] + 60, .35); m.sfx("clunk", S["ship"] + 92, .35)
m.sfx("ember", S["invoice"], .25); m.sfx("snap", S["invoice"] + 30, .3); m.sfx("deny", S["invoice"] + 56, .3)
for i in range(10): m.sfx("clack", S["invoice"] + 58 + i * 3, .1)
m.sfx("bell", S["chat"] + 7, .16); m.sfx("bell", S["chat"] + 21, .22); m.sfx("bell", S["chat"] + 45, .14)
m.sfx("snap", S["chat"] + 58, .15)
keys(S["ghost"] + 4, 6, 3, .12); keys(S["ghost"] + 38, 6, 3, .12)
m.sfx("ratchet", S["ignite"] - 12, .45); m.sfx("clunk", S["ignite"], .6)
# ── ACT II: ship it protected
m.sfx("ratchet", S["ignite"] + 4, .4); m.sfx("ember", S["ignite"] + 10, .55); m.sfx("subdrop", S["ignite"] + 4, .45)
m.sfx("snap", S["ignite"] + 30, .25)
keys(S["system"] + 2, 7, 3, .12); m.sfx("chain", S["system"] + 30, .5)
keys(S["forge"] + 6, 5); keys(S["forge"] + 26, 4); keys(S["forge"] + 44, 8); keys(S["forge"] + 96, 5)
for i in range(22): m.sfx("snap", S["forge"] + 32 + i * 4.4, .14)
m.sfx("clunk", S["forge"] + 128, .6); m.sfx("ember", S["forge"] + 124, .4)
m.sfx("scan", S["aes"] + 8, .45); keys(S["aes"] + 6, 5, 3, .12)
m.sfx("servo", S["lock"] + 4, .35); m.sfx("clunk", S["lock"] + 36, .65); m.sfx("deny", S["lock"] + 66, .45)
m.sfx("chain", S["tie"] + 2, .45)
for i in range(9): m.sfx("clack", S["tie"] + 16 + i * 6, .12)
m.sfx("ember", S["dash"], .3); m.sfx("snap", S["dash"] + 40, .3); m.sfx("bell", S["dash"] + 44, .12)
m.sfx("servo", S["lever"] + 2, .45); m.sfx("clunk", S["lever"] + 40, .5)
m.sfx("bell", S["slam"] + 9, .3)
m.sfx("lever", S["slam"] + 86, 1.0); m.sfx("subdrop", S["slam"] + 86, .8); m.sfx("ember", S["slam"] + 84, .4)
# ── ACT III: the payoff
m.sfx("glitch", S["susp"] + 2, .6); m.sfx("clunk", S["susp"] + 14, .45)
m.sfx("bell", S["paid"] + 8, .4)
for i in range(9): m.sfx("coin", S["paid"] + 48 + i * 4, .22)
m.sfx("snap", S["paid"] + 34, .25)
m.sfx("servo", S["restore"] + 8, .3); m.sfx("clunk", S["restore"] + 26, .45); m.sfx("bell", S["restore"] + 30, .2)
m.sfx("ember", S["head"], .35); keys(S["head"] + 4, 7, 3, .1); keys(S["head"] + 34, 7, 3, .1)
m.sfx("ember", S["end"], .4); m.sfx("clunk", S["end"] + 88, .5); m.sfx("bell", S["end"] + 90, .3)
m.save("public/projects/devaegis/soundtrack.wav", fade_from_frame=1770)
