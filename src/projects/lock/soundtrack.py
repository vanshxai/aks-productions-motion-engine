"""How It Works #09 (pin-tumbler lock) soundtrack: synth score + lock SFX (key scrape, pin ticks, spring boing,
jam clunk, cam ratchet, bolt thunk) kept quiet under the paced VO. Run: python3 src/projects/lock/soundtrack.py [--stems]"""
import sys, json; sys.path.insert(0, "scripts/audio")
from engine_mix import Mix, note
import numpy as np, soundfile as sf

FPS, SEC = 30, 30
mus = Mix(seconds=SEC, fps=FPS, seed=91); fx = Mix(seconds=SEC, fps=FPS, seed=53)
SR, N = fx.SR, fx.N
rng = np.random.default_rng(97)
tt = lambda s: np.arange(int(s * SR)) / SR
# calmer, darker score than the fridge: Dm / Bb / C / A
mus.music(drums_on=[(326, 598), (611, 832)], soft=[(10, 326), (598, 611)], arp_on=[(104, 832)],
          bpm=108, prog=[[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], final_chord=[50, 53, 57, 62], level=0.045)

def tick(f0=2600, s=.05):
    x = tt(s); return (np.sin(2 * np.pi * f0 * x) * np.exp(-x * 150) + fx.hp(rng.standard_normal(len(x)), .5) * np.exp(-x * 220) * .5)
def blip(m, s=.12): x = tt(s); return np.sin(2 * np.pi * note(m) * x) * np.exp(-x * 28)
def scrape(s):
    """metal key sliding in a keyway: band-limited noise with a slow stutter"""
    x = tt(s); n = fx.lp(fx.hp(rng.standard_normal(len(x)), .18), .55)
    stutter = .55 + .45 * np.sin(2 * np.pi * (24 + 10 * x / s) * x) ** 2
    return n * stutter * np.minimum(1, x / .04) * np.minimum(1, (s - x) / .08) * 1.8
def clunk(g=1.0):
    x = tt(.45); lo = np.sin(2 * np.pi * np.cumsum(120 - 70 * np.minimum(1, x * 9)) / SR) * np.exp(-x * 14)
    ring = (np.sin(2 * np.pi * 1180 * x) + .6 * np.sin(2 * np.pi * 1790 * x)) * np.exp(-x * 38) * .35
    return (lo + ring) * g
def thunk():
    x = tt(.6); lo = np.sin(2 * np.pi * np.cumsum(90 - 45 * np.minimum(1, x * 6)) / SR) * np.exp(-x * 9)
    return lo + fx.lp(rng.standard_normal(len(x)), .06) * np.exp(-x * 24) * 1.2
def boing(s=.9):
    x = tt(s); f = 260 + 90 * np.exp(-x * 3) * np.sin(2 * np.pi * 11 * x)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 5.5)
def buzz(s=.28):
    x = tt(s); return np.sign(np.sin(2 * np.pi * 74 * x)) * fx.lp(np.ones(len(x)), .3) * np.exp(-x * 7) * .5 + np.sin(2 * np.pi * 148 * x) * .3 * np.exp(-x * 9)
def tickf(fr, g=.1, f0=2600, pan=0.0): fx.mono(tick(f0), fr, g, pan)

# ── hook: five pin numbers pop, key slides out, pins drop ──
fx.mono(fx.chime([81, 88], 1.2), 4, .07)
for i, fr in enumerate([53, 58, 63, 68, 73]): fx.mono(blip(76 + [0, 2, 4, 5, 7][i], .1), fr, .07, [-.5, -.25, 0, .25, .5][i])
fx.mono(scrape(.8), 98, .05); tickf(103, .08, 2100); tickf(103, .06, 3000); tickf(105, .08, 2400); tickf(105, .06, 2800); tickf(105, .06, 3300)
# ── pins beat: labels pop, spring boings ──
for fr in (121, 136, 152, 168, 184): tickf(fr, .075, 3200)
fx.mono(boing(1.0), 170, .07); fx.mono(boing(.8), 188, .045)
# ── shear line ──
fx.mono(fx.sweep(.55, 380, 1500) * .5, 214, .05); tickf(232, .07, 3400)
for i, fr in enumerate([238, 244, 250, 256, 262]): fx.mono(blip(72 + [0, 2, 4, 7, 9][i], .15), fr, .06)
fx.mono(fx.chime([81, 88], 1.0), 277, .08)
fx.sfx("swoosh1", 304, .2)
# ── wrong key: scrape in, pins ride up, seat; red blocks; the plug jams ──
fx.mono(scrape(1.5), 326, .06)
for fr, f0 in zip([353, 355, 357, 360, 364], [1900, 2100, 2300, 2500, 2700]): tickf(fr, .11, f0)
fx.mono(clunk(.6), 378, .09)
fx.mono(blip(52, .3), 356, .12)
fx.mono(clunk(1.0), 394, .26); fx.mono(buzz(), 394, .06); fx.mono(clunk(.85), 409, .24); fx.mono(buzz(.22), 409, .05)
fx.mono(blip(46, .35), 410, .1)
# ── wrong key out, right key in ──
fx.mono(scrape(.55), 421, .05)
for k in range(5): tickf(424 + k, .06, 2000 + 250 * k)
fx.mono(scrape(1.8), 440, .06)
for fr, f0 in zip([469, 471, 473, 476, 481], [2000, 2200, 2400, 2600, 2900]): tickf(fr, .11, f0)
for k in range(2): tickf(483, .05, 2300 + 400 * k)
fx.mono(fx.riser(.55), 478, .07)
fx.mono(clunk(.5), 496, .08)
fx.mono(fx.chime([76, 81, 85, 88], 1.8), 497, .12)
# ── plug turns (cam ratchet), bolt retracts ──
for k, fr in enumerate(range(526, 592, 5)): tickf(fr, .035 + .035 * min(1, k / 8), 1500 + 90 * k, .2)
fx.mono(fx.chime([88, 93], 1.0), 578, .07)
fx.mono(thunk(), 592, .24); fx.sfx("tap", 593, .12)
# ── rewind ──
fx.mono(fx.sweep(.4, 1600, 260) * .5, 598, .06); fx.sfx("swoosh2", 602, .17)
# ── hero: lift, align, turn, open ──
fx.mono(scrape(.7), 611, .05)
for fr, f0 in zip([623, 623, 624, 626, 627], [2000, 2300, 2400, 2600, 2800]): tickf(fr, .09, f0)
fx.mono(clunk(.5), 633, .07); fx.mono(fx.chime([81, 88, 93], 1.4), 636, .12)
for k, fr in enumerate(range(663, 698, 4)): tickf(fr, .045 + .02 * (k % 2), 1600 + 120 * k, .2)
fx.mono(thunk(), 693, .3); fx.sfx("boom", 694, .12); fx.mono(fx.chime([88, 93, 100], 1.8), 688, .1)
# ── end card ──
fx.sfx("swoosh1", 704, .24); fx.sfx("pop", 714, .28); fx.mono(fx.chime([81, 88], 1.0), 715, .08)
fx.mono(fx.chime([76, 83], 1.0), 748, .05)
fx.typing(816, 22, 1.0, .1); fx.typing(842, 24, 2.0, .09)
fx.mono(fx.chime([69, 76, 81, 88], 2.2), 846, .08)

# pull the music back under the one-word hero beats
gm = np.ones(N); a0, a1 = fx.T(606), fx.T(706); gm[a0:a1] = 0.55
gm = np.convolve(gm, np.ones(4800) / 4800, mode="same"); mus.L *= gm; mus.R *= gm
vo, sr = sf.read("public/projects/lock/vo.wav"); assert sr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.abs(vo); kk = int(0.25 * SR); env = np.minimum(1, np.convolve(env, np.ones(kk) / kk, mode="same") / 0.05)
vo_f = vo - 0.25 * (vo - fx.lp(vo, 0.35))
L = mus.L * (1 - 0.8 * env) + fx.L * (1 - 0.55 * env) + vo_f * 1.6
R = mus.R * (1 - 0.8 * env) + fx.R * (1 - 0.55 * env) + vo_f * 1.6
if "--stems" in sys.argv:
    low = 0
    for b in json.load(open("public/projects/lock/vo.json"))["beats"]:
        for p in b["phrases"]:
            s = int(p["start"] * SR); e = int(p["end"] * SR); r = lambda x: 20 * np.log10(np.sqrt((x[s:e] ** 2).mean()) + 1e-9)
            d = r(vo_f * 1.6) - r(L - vo_f * 1.6)
            tag = "LOW" if d < 6 else "ok "
            if d < 6: low += 1
            print(f"{tag} {p['text'][:34]:34} {d:5.1f} dB")
    print("checked, LOW phrases:", low)
fx.L, fx.R = L, R
fx.save("public/projects/lock/soundtrack.wav", fade_from_frame=893)
