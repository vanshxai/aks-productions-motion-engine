"""Season 1 / Episode 1 audio v2: real voices (Kimu Voice Engine), warm original score, natural sound effects.

usage: python3 scripts/studio/build_s1e01_audio.py
reads  src/studio/s1e01/script.json
writes public/studio/s1e01/{voice/*.wav, timeline.json, music.wav, sfx.wav, mix.wav}   (48 kHz stereo)
Everything is synthesised here, voiced by Kokoro-82M, or a Kenney MIT clip (public/studio/audio/kenney).
"""
import json, os, sys, hashlib
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(__file__))
from audio_lib import *
import kimu_voice as kv

OUT = "public/studio/s1e01"
KEN = "public/studio/audio/kenney"
SCRIPT = "src/studio/s1e01/script.json"
DUR = 60.0
N = int(DUR * SR)
PAN = {"kimu": 0.3, "dad": -0.35, "mom": -0.45, "uncle": -0.3, "narrator": 0.0}


def kenney(name, gain=1.0):
    y, sr = sf.read(f"{KEN}/{name}.wav")
    if y.ndim > 1:
        y = y.mean(1)
    if sr != SR:
        y = resample_poly(y, SR, sr)
    return (y * gain).astype(np.float32)


def step(x, t, n=0.28, g=6.0):
    place(x, kenney("walking", g)[: int(n * SR)], t)


# ------------------------------------------------------------------ voices + timeline
def build_voices():
    sc = json.load(open(SCRIPT))
    os.makedirs(f"{OUT}/voice", exist_ok=True)
    lines, prev = {}, None
    for ln in sc["lines"]:
        key = hashlib.md5(json.dumps([kv.VERSION, ln["char"], ln.get("emo"), ln["text"], kv.CAST[ln["char"]], kv.EMOTIONS[ln.get("emo", "neutral")]], sort_keys=True).encode()).hexdigest()[:10]
        wav, js = f"{OUT}/voice/{ln['id']}.wav", f"{OUT}/voice/{ln['id']}.{key}.json"
        if os.path.exists(js) and os.path.exists(wav):
            m = json.load(open(js))
        else:
            y, sr, m = kv.speak(ln["char"], ln["text"], ln.get("emo", "neutral"), ln.get("speed"), ln.get("pitch"), ln.get("gain"))
            sf.write(wav, y, sr)
            json.dump(m, open(js, "w"))
        t = ln["t"] if "t" in ln else prev + ln["gap"]
        m = dict(m, id=ln["id"], t=round(t, 3), end=round(t + m["dur"], 3))
        m["env"] = [[round(t + e[0], 3), e[1]] for e in m["env"]]
        prev = m["end"]
        lines[ln["id"]] = m
    shots = []
    for s in sc["timeline"]:
        shots.append(dict(s, k=round((s["src1"] - s["src0"]) / (s["t1"] - s["t0"]), 5)))
    json.dump({"shots": shots, "lines": list(lines.values())}, open(f"{OUT}/timeline.json", "w"))
    return lines, shots


def make_T(shots):
    def T(old):
        """old (source) time -> new time, for cues written against the original S2-S4 timings."""
        for s in shots:
            if s["id"] != "S1" and s["src0"] <= old <= s["src1"] + 1e-6:
                return s["t0"] + (old - s["src0"]) / s["k"]
        return old
    return T


# ------------------------------------------------------------------ music
def music(L, T):
    m = np.zeros(N, dtype=np.float32)
    ln = lambda i: L[i]
    # ---------- S1  (0-19): lone felt piano, A minor; tension under anger; tenderness; hope
    d1, d3, d4, k2 = ln("d1"), ln("d3"), ln("d4"), ln("k2")
    for t, nm, g in [(1.9, "E4", .5), (3.0, "A3", .45), (4.4, "C4", .45), (5.6, "E4", .4), (7.0, "D4", .4)]:
        place(m, felt_piano(hz(nm), 2.2, g), t)
    place(m, pad([hz(c) for c in ["A2", "E3", "A3"]], 7.0, 0.35, a=2.0, r=2.0, bright=700), 2.2)
    # anger: low strings swell and a slow pulse, peaking at d3
    place(m, stab_low(d3["end"] - d3["t"] + 2.6, 0.55), d3["t"] - 1.0)
    for k in range(7):
        place(m, kick(0.28 + 0.04 * k), d3["t"] - 0.9 + k * 0.5)
    # sadness / tenderness at d4
    for t, nm, g in [(d4["t"] - 0.2, "C5", .5), (d4["t"] + 0.7, "B4", .45), (d4["t"] + 1.5, "A4", .5), (k2["t"] + 0.2, "E4", .45)]:
        place(m, felt_piano(hz(nm), 2.4, g), t)
    place(m, cello(hz("A2"), 5.0, 0.6, a=0.8, r=1.5), d4["t"] - 0.4)
    place(m, cello(hz("E3"), 4.0, 0.45, a=0.8, r=1.5), d4["t"] + 0.4)
    # resolve to hope at the end of S1 (leading into the prayer)
    place(m, pad([hz(c) for c in ["F2", "C3", "A3", "C4"]], 4.0, 0.4, a=1.6, r=1.6, bright=1200), 15.6)
    place(m, flute(hz("C5"), 2.2, 0.45), 17.2)
    # ---------- S2 (19-28): prayer, warm C major
    place(m, pad([hz(c) for c in ["C3", "G3", "E4", "C5"]], 5.6, 0.5, a=1.8, r=1.6, bright=1400), T(13.2))
    place(m, pad([hz(c) for c in ["F2", "C3", "A3", "F4"]], 4.6, 0.5, a=1.3, r=1.6, bright=1400), T(18.6))
    arp = ["C4", "E4", "G4", "C5", "G4", "E4"]
    for k in range(11):
        nm = arp[k % 6] if k < 6 else ["F3", "A3", "C4", "F4", "C4", "A3"][k % 6]
        place(m, guitar(hz(nm), 1.4, 0.5), T(15.2) + k * 0.46)
    for t, nm, ln_ in [(15.0, "G4", 1.4), (16.6, "E4", 1.0), (17.8, "G4", 1.2), (19.2, "A4", 2.2)]:
        place(m, felt_piano(hz(nm), ln_, 0.45), T(t))
    for i, nm in enumerate(["E5", "G5", "C6"]):        # the answer at the bird: a soft flute phrase, not a toy bell
        place(m, flute(hz(nm), 1.4 + 0.3 * i, 0.4), T(21.3) + i * 0.4)
    place(m, cello(hz("C3"), 4.0, 0.5, a=1.0, r=1.4), T(21.2))
    # ---------- S3 (28-46): curious, light groove ~108 bpm, nylon guitar + upright + soft percussion
    s = 60 / 108
    t0 = T(24.0)
    bl = [("C2", "G2"), ("C2", "G2"), ("F2", "C3"), ("F2", "C3"), ("G2", "D3"), ("G2", "D3"), ("C2", "G2"), ("C2", "G2")]
    stop = T(41.0)
    for bar in range(11):
        pair = bl[bar % 8]
        for b in range(4):
            tt = t0 + (bar * 4 + b) * s
            if tt >= stop:
                continue
            place(m, upright(hz(pair[b % 2]), 0.45, 0.62), tt)
            place(m, brush(0.16, 0.5 if b % 2 else 0.3), tt + 0.5 * s)
            if b % 2:
                place(m, conga(0.3), tt)
    riff = [(0, "E4", .5), (.5, "G4", .5), (1, "A4", .5), (1.5, "G4", .5), (2, "E4", .5), (3, "D4", .5), (3.5, "E4", .5),
            (4, "C4", .5), (4.5, "D4", .5), (5, "E4", 1), (6, "D4", .5), (7, "C4", .5)]
    for rep in range(3):
        for b, nm, _ in riff:
            tt = t0 + (rep * 8 + b) * s
            if t0 <= tt < stop:
                place(m, guitar(hz(nm), 0.8, 0.55), tt)
    for k in range(20):                               # answering flute / ep from the second panel
        tt = T(29.8) + k * s
        if tt < stop and k % 2 == 0:
            place(m, ep(hz(["E5", "G5", "A5", "C6"][(k // 2) % 4]), 0.9, 0.28), tt)
    place(m, strings([hz(c) for c in ["A2", "E3", "A3", "C4"]], 4.4, 0.55, a=0.8, r=0.8), stop - 0.2)
    place(m, cello(hz("A2"), 4.4, 0.6, a=0.6, r=0.8), stop - 0.2)
    for i in range(4):
        place(m, kick(0.5), stop + 0.4 + i * 0.5)
    # ---------- S4 (46-60): uplifting piano + strings + flute
    chords = [(T(46.5), ["C3", "G3", "E4", "C5"]), (T(48.9), ["G2", "D3", "B3", "G4"]), (T(51.3), ["A2", "E3", "C4", "A4"]),
              (T(53.7), ["F2", "C3", "A3", "F4"]), (T(56.1), ["C3", "G3", "E4", "C5"]), (T(58.0), ["F2", "C3", "A3", "F4"])]
    for t, ch in chords:
        place(m, pad([hz(c) for c in ch], 2.9, 0.45, a=0.5, r=1.0, bright=2000), t)
        for k, c in enumerate(ch[:4]):
            place(m, felt_piano(hz(c), 1.4, 0.42), t + k * 0.3)
    place(m, strings([hz(c) for c in ["C4", "E4", "G4", "C5"]], 4.0, 0.7, a=1.4, r=1.5), T(56.0))
    mel = [(47.0, "E5", .9), (47.9, "G5", .9), (48.8, "A5", 1.4), (50.2, "G5", .7), (51.0, "E5", .9), (51.9, "C5", 1.4), (53.7, "D5", .8), (54.5, "E5", 1.4), (56.3, "G5", 1.3), (57.6, "E5", 1.0)]
    for t, nm, ln_ in mel:
        place(m, flute(hz(nm), ln_, 0.42), T(t))
    for t, nm in ((58.4, "C5"), (58.4, "E5"), (58.4, "G4")):
        place(m, felt_piano(hz(nm), 2.4, 0.5), T(t))
    place(m, cello(hz("C3"), 3.0, 0.6, a=0.4, r=1.2), T(58.4))
    for k in range(8):
        place(m, brush(0.14, 0.3), T(47.0) + k * 1.2 + 0.3)
    m = np.clip(m, -1, 1)
    st = reverb(m, wet=0.34, rt=2.6)
    st[-int(0.9 * SR):] *= np.linspace(1, 0, int(0.9 * SR))[:, None]
    return st.astype(np.float32)


# ------------------------------------------------------------------ sound effects (mono bus with a few positioned ones)
def sfx(L, T):
    x = np.zeros(N, dtype=np.float32)
    bed = np.zeros(N, dtype=np.float32)
    st = np.zeros((N, 2), dtype=np.float32)          # spatial environment sounds (panned left/right)
    d1, d3, d4, k2, m1 = L["d1"], L["d3"], L["d4"], L["k2"], L["m1"]
    # ---- ambience: room tone, fan, crickets, a mosquito (very much a real night)
    place(bed, room_tone(19, 0.5), 0.0)
    place(x, hum(0.85, 100, 0.3), 0.0)                 # fan + fridge before the cut
    place(bed, crickets(19, 0.12), 1.0)
    place(bed, mosquito(10, 0.04), 2.0)
    place(bed, wind(9.5, 0.14), T(12.6))
    place(bed, crickets(9, 0.1), T(12.6))
    place(bed, street_bed(14, 0.35), 46.0)
    place(bed, kenney("ambience", 0.35)[: int(14 * SR)], 46.0)
    # ---- v4 environment: things that move and glow around the scene
    place_st(st, fan_bed(19, 1.7, 0.10), 0.0, 0.55)                         # ceiling fan, right
    place_st(st, plug_in(0.45), 0.6, -0.4)                                    # charger clicked in
    place_st(st, dog(0.16), 6.4, 0.85); place_st(st, dog(0.12), 12.3, 0.9)   # distant dog through the window
    place_st(st, horn(0.5, 0.09), 9.2, 0.8)
    place_st(st, crackle(0.55, 0.28), L["d2"]["t"] + 0.05, -0.25)             # torch finds the live wires: contacts spit
    place_st(st, multimeter_beep(0.22), L["d2"]["t"] + 0.4, -0.15)
    place_st(st, crackle(0.35, 0.22), L["d3"]["t"] + 0.8, -0.25)
    place_st(st, pen_tap(0.25), 1.9, 0.2)
    # terrace (S2)
    place_st(st, wind(9.5, 0.12), T(12.6), -0.3)
    for k_, tt_ in enumerate(np.arange(T(13.0), T(23.0), 0.9)):
        place_st(st, flap(0.4, 0.22 + 0.1 * rng.random()), float(tt_) + rng.random() * 0.3, -0.7 if k_ % 2 else -0.5)   # washing on the line
    place_st(st, street_bed(9, 0.12), 19.0, 0.0)
    place_st(st, dog(0.14), 24.3, 0.9)
    place_st(st, gurgle(1.0, 0.08), 21.8, 0.7)                               # water tank drip
    # lesson (S3): hum of the live wire, water finding its level, wing flaps
    place_st(st, flutter(0.35), 28.4, 0.5)
    place_st(st, crackle(0.25, 0.07), 30.4, 0.35); place_st(st, crackle(0.2, 0.06), 38.6, 0.35)   # the odd tick of a live line, never a hum
    place_st(st, gurgle(3.2, 0.2), L["n4"]["t"] + 0.2, 0.0)
    place_st(st, crackle(0.9, 0.3), T(42.6), 0.0)
    # morning street (S4)
    for k_ in range(10):
        place_st(st, meter_click(0.22), 46.9 + k_ * 0.6, 0.45)                # electricity meter ticking
    place_st(st, scooter(3.2, 0.2), 47.6, -0.8)                              # passes from left
    place_st(st, horn(0.45, 0.08), 51.6, -0.7)
    place_st(st, flutter(0.3), 52.0, 0.6)
    place_st(st, crackle(1.3, 0.45), T(51.0), 0.2)                           # the short circuit
    # ---- S1 room
    for t in np.arange(0.05, 0.78, 0.11):             # typing
        place(x, key_tap(0.35 + 0.2 * rng.random()), t)
    place(x, thunk(0.8), 0.8)
    place(x, spindown(1.6, 110, 0.4), 0.82)
    place(x, low_battery(0.28), 1.0)
    place(x, creak(1.2, 0.25), d1["t"] - 0.8)
    place(x, tick(0.3, 1500), d1["t"] - 0.45)         # torch click
    for dt in (-0.5, -0.05):
        step(x, d1["t"] + dt)
    place(x, cloth(0.4, 0.5), d1["t"] + 0.1)
    tb = d1["t"] + 0.2                                # heartbeat while Kimu is cornered: calm -> racing at d3 -> fades as Dad softens
    while tb < d4["t"] - 0.1:
        place(x, heartbeat(0.55 if tb < d3["t"] else 0.85), tb)
        tb += 0.88 if tb < d3["t"] else 0.62
    place(x, cloth(0.35, 0.5), d1["t"] + 0.7)         # Kimu snaps the laptop shut
    place(x, tick(0.5, 900), d1["t"] + 0.95)
    place(x, tick(0.35, 1800), L["d2"]["t"] - 0.15)   # torch swings to the desk
    for i, off in enumerate((0.75, 1.55, 2.4)):       # Dad's hand on the desk, three beats of the sentence
        place(x, thud(0.7 if i < 2 else 1.0), d3["t"] + off)
    place(x, cloth(0.4, 0.5), m1["t"] - 0.3)
    step(x, m1["t"] - 0.35, 0.25, 4)
    place(x, sigh(0.3), d4["t"] - 0.4)
    for dt in (0.55, 1.0, 1.45, 1.9):                 # Dad leaves
        step(x, k2["t"] + dt, 0.26, 5)
    place(x, door_close(0.55), k2["t"] + 2.45)
    # ---- S2 terrace (original cue times via T)
    for tt_ in np.arange(19.05, 20.55, 0.28):         # Kimu walks onto the terrace
        step(x, float(tt_), 0.26, 6)
    place(x, chirp(3300, 0.16, 0.35), T(21.3))
    place(x, chirp(3800, 0.14, 0.3), T(21.55))
    place(x, flutter(0.35), T(21.75))
    place(x, kenney("placement-c", 0.4), T(22.15))
    place(x, bird_song(0.28, 3), T(22.5))
    # ---- S3 lesson: quiet, tactile cues
    place(x, whoosh(0.8, 0.3, True), T(23.7))
    for t in (25.2, 30.3, 35.4):
        place(x, tick(0.45, 1300), T(t))
    for k in range(6):
        place(x, key_tap(0.25), T(31.0) + k * 0.28 / 1.25)
    place(x, buzz(0.25, 0.3, 90), T(41.7))
    place(x, buzz(0.25, 0.3, 90), T(42.1))
    place(x, spark(0.5, 0.35), T(42.6))
    place(x, whoosh(0.8, 0.3, False), T(45.7))
    # ---- S4 morning
    for dt in (47.0, 47.45, 47.9, 48.35):
        step(x, T(dt), 0.28, 7)
    place(x, bird_song(0.22, 8), T(46.8))
    place(x, bird_song(0.18, 9), T(52.4))
    place(x, spark(1.3, 0.45), T(51.0))
    place(x, buzz(0.3, 0.2, 100), T(51.0))
    place(x, rip(0.45, 0.35), T(53.6))
    place(x, relay_clack(0.6), T(54.58))
    place(x, fluoro(1.2, 0.35), T(54.6))
    place(x, powerup(0.9, 0.2), T(54.62))
    place(x, kenney("coin", 1.2), T(56.1))
    place(x, clink(0.3), T(57.6))
    return x, bed, st


def tt_lt(a, b):
    return a < b


# ------------------------------------------------------------------ mix
def smooth_mask(x, win=0.18):
    e = np.abs(x)
    k = int(win * SR)
    e = np.convolve(e, np.ones(k) / k, mode="same")
    return np.clip(e / (e.max() + 1e-9) * 3.0, 0, 1)


def main():
    lines, shots = build_voices()
    T = make_T(shots)
    mus = music(lines, T)
    fx, bed, env = sfx(lines, T)
    voc = np.zeros((N, 2), dtype=np.float32)
    dmono = np.zeros(N, dtype=np.float32)
    for l in lines.values():
        y, sr = sf.read(f"{OUT}/voice/{l['id']}.wav")
        y = y.astype(np.float32)
        wet = reverb(y, wet=0.03 if l["char"] != "narrator" else 0.0, rt=0.4)
        st = pan(y, PAN[l["char"]]) * 0.0 + wet * np.array([[np.cos((PAN[l['char']] + 1) * np.pi / 4) * 1.4, np.sin((PAN[l['char']] + 1) * np.pi / 4) * 1.4]])
        i = int(l["t"] * SR)
        n = min(len(st), N - i)
        voc[i:i + n] += st[:n]
        dmono[i:i + n] += y[:n]
    duck = np.clip(smooth_mask(dmono) * 0.9, 0, 1)
    duck = np.convolve(duck, np.ones(int(0.3 * SR)) / int(0.3 * SR), mode="same")
    music_g = (1 - 0.72 * duck)[:, None]
    sfx_g = (1 - 0.5 * duck)
    BG = 0.35                                          # background (music, room/street beds, environment) at 35% so voices stay clear
    mix = mus * music_g * 0.62 * BG
    mono = fx * sfx_g * 0.95 + bed * sfx_g * 0.9 * BG
    mix = mix + np.stack([mono, mono], axis=1) + env * sfx_g[:, None] * BG + voc * 1.3
    sf.write(f"{OUT}/music.wav", mus, SR)
    sf.write(f"{OUT}/sfx.wav", np.stack([fx + bed] * 2, 1), SR)
    rms = np.sqrt((mix ** 2).mean())
    mix = mix * (0.105 / rms)
    mix = np.tanh(mix * 1.15) / 1.15
    mix = mix * min(1.0, 0.92 / np.abs(mix).max())
    sf.write(f"{OUT}/mix.wav", mix.astype(np.float32), SR)
    print("peak", round(float(np.abs(mix).max()), 3), "rms", round(float(np.sqrt((mix ** 2).mean())), 4))
    for l in lines.values():
        print(f"{l['id']:3s} {l['t']:6.2f}-{l['end']:6.2f}  {l['text']}")


if __name__ == "__main__":
    main()
