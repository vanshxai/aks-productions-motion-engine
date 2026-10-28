"""Season 1 / Episode 1 audio: original music + sound effects + cartoon mumble voices, mixed under the narration.

usage: python3 scripts/studio/build_s1e01_audio.py
reads  public/studio/s1e01/vo.wav (Kokoro narration)
writes public/studio/s1e01/{music,sfx,mumble}.wav, mumble.json, mix.wav  (48 kHz stereo)
All sounds are synthesised here or are Kenney CC0/MIT clips in public/studio/audio/kenney.
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(__file__))
from audio_lib import *

OUT = "public/studio/s1e01"
KEN = "public/studio/audio/kenney"
DUR = 60.0
N = int(DUR * SR)


def kenney(name, gain=1.0):
    y, sr = sf.read(f"{KEN}/{name}.wav")
    if y.ndim > 1:
        y = y.mean(1)
    if sr != SR:
        y = resample_poly(y, SR, sr)
    return (y * gain).astype(np.float32)


def seq(buf, t0, notes, fn, step, **kw):
    """notes: list of (beat, 'C4', beats_long). fn(freq, dur, **kw) -> array."""
    for b, nm, ln in notes:
        place(buf, fn(hz(nm), ln * step, **kw), t0 + b * step)


# ================================================================ MUSIC
def music():
    m = np.zeros(N, dtype=np.float32)
    # ---- S1 (0-13.5) sad, A minor, 62 bpm
    s = 60 / 62
    for t, ch in [(0.8, ["A2", "E3", "A3", "C4"]), (4.7, ["F2", "C3", "F3", "A3"]), (8.6, ["G2", "D3", "G3", "B3"]), (11.6, ["A2", "E3", "A3", "C4"])]:
        place(m, pad([hz(c) for c in ch], 4.2, 0.5, a=1.2, r=1.5, bright=900), t)
    mel = [(0.8, "E5", 1.8), (2.7, "D5", 1.3), (4.5, "C5", 1.6), (6.4, "D5", 1.0), (7.7, "B4", 2.4), (10.4, "A4", 3.2)]
    for t, nm, ln in mel:
        place(m, piano(hz(nm), ln, 0.62), t + 0.3)
    for k in range(12):                       # soft left-hand arpeggio
        nm = ["A3", "E4", "C4", "E4"][k % 4] if k < 5 else ["F3", "C4", "A3", "C4"][k % 4] if k < 9 else ["G3", "D4", "B3", "D4"][k % 4]
        place(m, piano(hz(nm), 0.9, 0.28), 1.0 + k * 1.05)
    place(m, bass(hz("A1"), 3.4, 0.5), 3.0)
    # ---- S2 (13.5-24) prayer, warm C major
    place(m, pad([hz(c) for c in ["C3", "G3", "E4", "C5"]], 5.4, 0.55, a=1.5, r=1.5, bright=1500), 13.4)
    place(m, pad([hz(c) for c in ["F2", "C3", "A3", "F4"]], 4.8, 0.55, a=1.2, r=1.5, bright=1500), 18.6)
    arp = ["C4", "E4", "G4", "C5", "G4", "E4"]
    for k in range(13):
        place(m, pluck(hz(arp[k % 6] if k < 7 else ["F3", "A3", "C4", "F4", "C4", "A3"][k % 6]), 0.9, 0.34), 15.2 + k * 0.5)
    for t, nm, ln in [(15.0, "G4", 1.4), (16.6, "E4", 1.0), (17.8, "G4", 1.2), (19.2, "A4", 2.2)]:
        place(m, piano(hz(nm), ln, 0.45), t)
    for i, nm in enumerate(["C6", "E6", "G6", "C7"]):      # the answer: sparkle at the bird
        place(m, bell(hz(nm), 2.0, 0.42), 21.2 + i * 0.18)
    # ---- S3 (24-46.5) curious / playful, 116 bpm
    s = 60 / 116
    t0 = 24.0
    bass_line = [("C2", "G2"), ("C2", "G2"), ("F2", "C3"), ("F2", "C3"), ("G2", "D3"), ("G2", "D3"), ("C2", "G2"), ("C2", "G2")]
    for bar in range(11):
        pair = bass_line[bar % 8]
        for b in range(4):
            if t0 + (bar * 4 + b) * s >= 41.0:
                continue
            place(m, bass(hz(pair[b % 2]), 0.28, 0.6), t0 + (bar * 4 + b) * s)
            place(m, shaker(0.1, 0.5 if b % 2 else 0.3), t0 + (bar * 4 + b + 0.5) * s)
            if b % 2:
                place(m, wood(0.35), t0 + (bar * 4 + b) * s)
    riff = [(0, "E5", .5), (.5, "G5", .5), (1, "A5", .5), (1.5, "G5", .5), (2, "E5", .5), (3, "D5", .5), (3.5, "E5", .5),
            (4, "C5", .5), (4.5, "D5", .5), (5, "E5", 1), (6, "D5", .5), (7, "C5", .5)]
    for rep in range(3):
        for b, nm, ln in riff:
            tt = t0 + 0.5 * s * 0 + (rep * 8 + b) * s
            if tt < 41.0 and tt >= 24.0 + 0.0:
                place(m, pluck(hz(nm), 0.5, 0.5, 1.2), tt)
    for k in range(20):                        # answering high bells from 29.8
        tt = 29.8 + k * s * 1.0
        if tt < 41.0 and k % 2 == 0:
            place(m, bell(hz(["C6", "E6", "G6", "A6"][(k // 2) % 4]), 0.9, 0.22), tt)
    # tension: "a different story" (41-45)
    place(m, strings([hz(c) for c in ["A2", "E3", "A3", "C4"]], 4.2, 0.55, a=0.8, r=0.8), 40.8)
    for i in range(4):
        place(m, kick(0.6), 41.3 + i * 0.5)
    place(m, bell(hz("E4"), 2.0, 0.3), 41.0)
    # ---- S4 (46.5-60) uplifting
    s = 60 / 100
    chords = [(46.5, ["C3", "G3", "E4", "C5"], "C"), (48.9, ["G2", "D3", "B3", "G4"], "G"), (51.3, ["A2", "E3", "C4", "A4"], "Am"), (53.7, ["F2", "C3", "A3", "F4"], "F"),
              (56.1, ["C3", "G3", "E4", "C5"], "C"), (58.0, ["F2", "C3", "A3", "F4"], "F")]
    for t, ch, nm in chords:
        place(m, pad([hz(c) for c in ch], 2.8, 0.5, a=0.5, r=1.0, bright=2200), t)
        for k, c in enumerate(ch[:4]):
            place(m, piano(hz(c), 1.2, 0.4), t + k * 0.3)
    place(m, strings([hz(c) for c in ["C4", "E4", "G4", "C5"]], 4.0, 0.7, a=1.4, r=1.5), 56.0)
    mel2 = [(47.0, "E6", .5), (47.5, "G6", .5), (48.0, "A6", 1.0), (50.0, "G6", .5), (50.5, "E6", .5), (51.3, "C6", 1.0), (53.7, "D6", .5), (54.2, "E6", 1.0), (56.3, "G6", 1.0), (57.4, "E6", .7)]
    for t, nm, ln in mel2:
        place(m, bell(hz(nm), 1.2, 0.3), t)
    place(m, chords and bell(hz("C6"), 2.5, 0.5), 58.4)
    place(m, piano(hz("C5"), 2.2, 0.55), 58.4)
    place(m, piano(hz("E5"), 2.2, 0.45), 58.4)
    # kick-less warm pulse in S4
    for k in range(int(8)):
        place(m, shaker(0.1, 0.25), 47.0 + k * 0.6 * 2 + 0.3)
    m = np.clip(m, -1, 1)
    st = reverb(m, wet=0.32, rt=2.2)
    st[-int(0.8 * SR):] *= np.linspace(1, 0, int(0.8 * SR))[:, None]
    return st.astype(np.float32)


# ================================================================ SFX
def sfx():
    x = np.zeros(N, dtype=np.float32)
    bed = np.zeros(N, dtype=np.float32)
    # fridge / fan hum, then power cut at 0.8
    place(x, hum(0.85, 100, 0.35), 0.0)
    place(x, thunk(0.85), 0.8)
    place(x, spindown(1.6, 110, 0.4), 0.82)
    place(bed, crickets(24, 0.16), 1.0)
    place(bed, wind(11.5, 0.2), 13.2)
    place(bed, kenney("ambience", 0.5)[: int(14 * SR)], 46.4)
    place(bed, wind(3, 0.08), 46.4)
    # S1 room
    place(x, creak(1.2, 0.3), 2.7)
    for dt in (3.0, 3.45):
        place(x, kenney("walking", 7.0)[: int(0.28 * SR)], dt)
    for dt in (7.2, 7.65, 8.1):
        place(x, kenney("walking", 6.0)[: int(0.28 * SR)], dt)
    place(x, sigh(0.28), 8.2)
    place(x, slide(0.5, 0.3), 9.0)
    place(x, kenney("placement-a", 0.9), 9.6)
    place(x, beep(660, 0.12, 0.3), 10.4)
    place(x, beep(440, 0.16, 0.3), 10.56)
    place(x, beep(300, 0.3, 0.28), 10.76)
    # S2 terrace
    for dt in (12.1, 12.55, 13.0, 13.45, 13.9):
        place(x, kenney("walking", 7.0)[: int(0.28 * SR)], dt)
    place(x, chirp(3300, 0.16, 0.4), 21.3)
    place(x, chirp(3800, 0.14, 0.35), 21.55)
    place(x, flutter(0.35), 21.75)
    place(x, kenney("placement-c", 0.5), 22.15)
    place(x, bird_song(0.3, 3), 22.5)
    # S3 teaching
    place(x, whoosh(0.8, 0.4, True), 23.7)
    place(x, pop(650, 0.45), 25.2)
    place(x, pop(760, 0.45), 30.3)
    for k in range(6):
        place(x, beep(520 + 90 * k, 0.07, 0.15), 31.0 + k * 0.28)
    place(x, pop(880, 0.45), 35.4)
    place(x, buzz(0.25, 0.3, 90), 41.7)
    place(x, buzz(0.25, 0.3, 90), 42.1)
    place(x, spark(0.5, 0.4), 42.6)
    place(x, whoosh(0.8, 0.4, False), 45.7)
    # S4 morning
    for dt in (47.0, 47.45, 47.9, 48.35):
        place(x, kenney("walking", 7.0)[: int(0.28 * SR)], dt)
    place(x, bird_song(0.25, 8), 46.8)
    place(x, bird_song(0.2, 9), 52.4)
    place(x, spark(1.3, 0.5), 51.0)
    place(x, buzz(0.3, 0.2, 100), 51.0)
    place(x, rip(0.45, 0.4), 53.6)
    place(x, kenney("toggle", 3.0), 54.6)
    place(x, powerup(0.9, 0.35), 54.62)
    place(x, pop(1100, 0.3), 55.4)
    place(x, kenney("coin", 1.6), 56.1)
    place(x, clink(0.3), 57.6)
    place(x, bell(hz("G6"), 1.5, 0.25), 59.0)
    return x, bed


# ================================================================ VOICES
MUMBLE = [
    {"id": "dad1", "who": "dad", "t": 3.3, "text": "Still playing with wires? Study your syllabus!", "base": 105, "syll": 0.15, "seed": 11},
    {"id": "kimu1", "who": "kimu", "t": 6.2, "text": "Okay, Papa.", "base": 165, "syll": 0.16, "seed": 5},
    {"id": "uncle1", "who": "uncle", "t": 55.2, "text": "Shabash, beta! Well done!", "base": 98, "syll": 0.15, "seed": 21},
]


def voices():
    v = np.zeros(N, dtype=np.float32)
    meta = []
    for m in MUMBLE:
        a, env, d = mumble(m["text"], m["base"], m["syll"], m["seed"])
        place(v, a, m["t"])
        meta.append({"id": m["id"], "who": m["who"], "t": m["t"], "dur": round(d, 3), "text": m["text"],
                     "env": [[round(m["t"] + e[0], 3), e[1]] for e in env]})
    return v, meta


def smooth_mask(x, win=0.18):
    e = np.abs(x)
    k = int(win * SR)
    e = np.convolve(e, np.ones(k) / k, mode="same")
    return np.clip(e / (e.max() + 1e-9) * 3.0, 0, 1)


def main():
    os.makedirs(OUT, exist_ok=True)
    vo, sr = sf.read(f"{OUT}/vo.wav")
    if vo.ndim > 1:
        vo = vo.mean(1)
    if sr != SR:
        vo = resample_poly(vo, SR, sr)
    vo = np.pad(vo, (0, max(0, N - len(vo))))[:N].astype(np.float32)
    mus = music()
    fx, bed = sfx()
    mum, meta = voices()
    json.dump(meta, open(f"{OUT}/mumble.json", "w"), indent=1)
    duck = np.clip(smooth_mask(vo) * 0.8 + smooth_mask(mum) * 0.6, 0, 1)
    duck = np.convolve(duck, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
    music_g = (1 - 0.55 * duck)[:, None]
    sfx_g = (1 - 0.3 * duck)
    mus_lvl, fx_lvl, bed_lvl, vo_lvl, mum_lvl = 0.55, 0.9, 0.9, 1.0, 0.9
    mix = mus * music_g * mus_lvl
    mono = (fx * sfx_g * fx_lvl + bed * bed_lvl * sfx_g + vo * vo_lvl + mum * mum_lvl)
    mix = mix + np.stack([mono, mono], axis=1)
    for name, arr in (("music", mus), ("sfx", np.stack([fx + bed] * 2, 1)), ("mumble", np.stack([mum] * 2, 1))):
        sf.write(f"{OUT}/{name}.wav", arr, SR)
    pk = np.abs(mix).max()
    rms = np.sqrt((mix ** 2).mean())
    mix = mix * (0.105 / rms)                 # about -19.5 dBFS RMS
    mix = np.tanh(mix * 1.15) / 1.15          # soft limiter keeps peaks in range
    mix = mix * min(1.0, 0.92 / np.abs(mix).max())
    sf.write(f"{OUT}/mix.wav", mix.astype(np.float32), SR)
    print("peak", round(float(np.abs(mix).max()), 3), "rms", round(float(np.sqrt((mix ** 2).mean())), 4))


if __name__ == "__main__":
    main()
