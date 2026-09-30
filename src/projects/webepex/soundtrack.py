"""WebEpex 60s soundtrack. Run from repo root:  python3 src/projects/webepex/soundtrack.py
Music: "Stylish Deep Electronic" by NverAvetyanMusic (Pixabay Content License — free commercial use, no attribution required).
Edit: track −2.0→53.32 s plays over video 0→55.32 s (drop at video 11.2 s = logo); then the track's ending (90.47→95.15 s)
is spliced on a downbeat at video 55.32 s for the end card. Cuts sit on the 103.4 BPM downbeat grid."""
import sys; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix

S = dict(hook=0, funnel=92, guar=210, logo=330, stages=406, found=475, engine=684, machine=893, cal=1102, lanes=1242, receipts=1311, work=1451, trust=1590, end=1660)
m = Mix(seconds=60)
m.track_edit("public/projects/webepex/music/stylish-deep-electronic_nveravetyan.wav", [(0.0, -2.0, 55.32 + 0.06), (55.32, 90.47, 4.68)], gain=0.62)

# Act I — the leak
m.sfx("paper", S["hook"] + 10, .35, max_s=1.2); m.sfx("flip", S["hook"] + 42, .3); m.sfx("paper", S["hook"] + 52, .35, max_s=1.2)
m.sfx("whoosh2", S["funnel"] + 2, .4)
for d in (34, 46, 58): m.sfx("tap2", S["funnel"] + d, .35)
for d in (62, 78, 94): m.sfx("coin", S["funnel"] + d, .16)
m.sfx("swish", S["guar"] + 2, .45)
m.sfx("keys", S["guar"] + 10, .22, max_s=1.0)
m.sfx("riser", S["logo"] + 4, .45)                      # peaks right on the drop
m.sfx("stamp", S["guar"] + 74, .8); m.sfx("impact", S["guar"] + 74, .35, max_s=1.5)
m.sfx("impact", S["logo"] + 6, .7); m.sfx("swish", S["logo"] + 18, .3)
# Act II — the system
m.sfx("whoosh2", S["stages"] + 2, .38)
for i in range(3): m.sfx("tap2", S["stages"] + 24 + i * 8, .32)
m.sfx("swish", S["found"] + 2, .4); m.sfx("flip", S["found"] + 22, .3)
for i in range(3): m.sfx("tap2", S["found"] + 34 + i * 5, .28)
m.sfx("keys", S["found"] + 52, .2, max_s=0.9); m.sfx("softnotif", S["found"] + 72, .22); m.sfx("softnotif", S["found"] + 84, .18)
m.sfx("coin", S["found"] + 112, .3); m.sfx("shutter", S["found"] + 122, .5)
m.sfx("swish", S["engine"] + 2, .4); m.sfx("paper", S["engine"] + 16, .4, max_s=1.4)
for i in range(3): m.sfx("tap2", S["engine"] + 30 + i * 5, .28)
m.sfx("whoosh2", S["engine"] + 100, .3)
for i in range(6): m.sfx("tap2", S["engine"] + 120 + i * 6, .16)
m.sfx("coin", S["engine"] + 72, .26)
m.sfx("whoosh2", S["machine"] + 2, .42); m.sfx("softnotif", S["machine"] + 8, .35)
for i in range(4): m.sfx("tap2", S["machine"] + 40 + i * 24, .3)
m.sfx("keys", S["machine"] + 70, .2, max_s=0.9)
for i in range(3): m.sfx("softnotif", S["machine"] + 98 + i * 20, .26)
m.sfx("coin", S["machine"] + 106, .26)
m.sfx("swish", S["cal"] + 2, .42)
for i in range(15): m.sfx("tap2", S["cal"] + 20 + i * 5, .12)
m.sfx("stamp", S["cal"] + 108, .7); m.sfx("impact", S["cal"] + 108, .25, max_s=1.2)
m.sfx("whoosh2", S["lanes"] + 2, .4)
# Act III — the receipts
m.sfx("swish", S["receipts"] + 2, .42)
m.sfx("keys", S["receipts"] + 20, .18, max_s=1.2); m.sfx("ding2", S["receipts"] + 58, .38)
m.sfx("whoosh2", S["work"] + 2, .4)
for d in (8, 38, 70, 102): m.sfx("shutter", S["work"] + d, .5)
m.sfx("paper", S["trust"] + 20, .3, max_s=1.2)
m.sfx("impact", S["end"] + 2, .5); m.sfx("paper", S["end"] + 4, .3, max_s=1.2)
m.sfx("swish", S["end"] + 38, .35); m.sfx("swish", S["end"] + 60, .3)
m.sfx("tap2", S["end"] + 60, .3); m.sfx("tap2", S["end"] + 68, .3)
m.sfx("tap2", S["end"] + 99, .7); m.sfx("softnotif", S["end"] + 102, .3)
m.save("public/projects/webepex/soundtrack.wav")
