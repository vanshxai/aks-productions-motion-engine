"""Story 2 'The Whistle': music + kitchen sound design. Called from build_s1e02_audio.py.
Rules: no steady pure tones (no hums); noise beds are quiet; every sound is tied to something visible."""
import numpy as np
from audio_lib import *
import build_s1e01_audio as b

N = b.N
FLAME_OFF, FLAME_ON, WHISTLE = 46.75, 52.95, 53.5
LID_OPEN, LID_SHUT = 50.0, 52.4


def music(L, T):
    m = np.zeros(N, dtype=np.float32)
    m0, d1, k0, m2, d3, m3, k1, m4, d4 = (L[i] for i in ("m0", "d1", "k0", "m2", "d3", "m3", "k1", "m4", "d4"))
    # ---------- S1 (0-19): a tense, tired evening; felt piano + low strings; Mom's line gets the cello
    place(m, pad([hz(c) for c in ["D2", "A2", "D3"]], 8.0, 0.32, a=2.2, r=2.0, bright=650), 0.6)
    for t, nm, g in [(1.6, "F4", .45), (3.4, "A3", .4), (5.2, "D4", .4), (7.0, "C4", .4), (9.4, "F4", .4)]:
        place(m, felt_piano(hz(nm), 2.2, g), t)
    place(m, stab_low(3.0, 0.38), d3["t"] - 0.6)                         # Dad: "Buy a new one."
    place(m, cello(hz("D3"), 5.0, 0.55, a=0.9, r=1.5), m3["t"] - 0.6)    # Mom: "My mother gave me this one."
    place(m, cello(hz("A3"), 4.0, 0.45, a=0.9, r=1.5), m3["t"] + 0.3)
    for t, nm, g in [(m3["t"] - 0.2, "A4", .5), (m3["t"] + 0.9, "G4", .45), (m3["t"] + 1.8, "F4", .5)]:
        place(m, felt_piano(hz(nm), 2.4, g), t)
    place(m, pad([hz(c) for c in ["Bb2", "F3", "D4"]], 3.4, 0.4, a=1.4, r=1.4, bright=1100), 16.4)
    place(m, flute(hz("D5"), 2.0, 0.42), k1["t"] + 0.3)                  # Kimu decides
    # ---------- S2 (19-28): the prayer, warm and still
    place(m, pad([hz(c) for c in ["C3", "G3", "E4", "C5"]], 6.0, 0.5, a=1.8, r=1.6, bright=1400), 19.2)
    for k in range(9):
        nm = ["C4", "E4", "G4", "C5", "G4", "E4"][k % 6]
        place(m, guitar(hz(nm), 1.4, 0.48), 20.0 + k * 0.5)
    for i, nm in enumerate(["E5", "G5", "C6"]):
        place(m, flute(hz(nm), 1.4 + 0.3 * i, 0.4), 23.1 + i * 0.45)
    place(m, cello(hz("C3"), 4.0, 0.5, a=1.0, r=1.4), 23.0)
    # ---------- S3 (28-46): curious, light groove (~104 bpm): upright, brush, nylon guitar
    s = 60 / 104
    for bar in range(11):
        t0 = 28.0 + bar * 4 * s
        root = ["C2", "A1", "F2", "G2"][bar % 4]
        place(m, upright(hz(root), 0.6, 0.55), t0); place(m, upright(hz(root) * 1.5, 0.5, 0.4), t0 + 2 * s)
        for q in range(4):
            place(m, brush(0.18, 0.28), t0 + q * s + 0.5 * s)
        for k, nm in enumerate(["E4", "G4", "C5", "G4"]):
            place(m, guitar(hz(nm), 0.8, 0.34), t0 + k * s)
    place(m, pad([hz(c) for c in ["C3", "G3", "E4"]], 6.0, 0.3, a=1.8, r=1.8, bright=1200), 28.0)
    place(m, cello(hz("A2"), 4.0, 0.45, a=0.6, r=1.2), 42.0)            # the leak: a touch of worry
    # ---------- S4 (46-60): safe, patient, then the whistle and warmth
    place(m, pad([hz(c) for c in ["F2", "C3", "A3", "C4"]], 5.0, 0.4, a=1.6, r=1.6, bright=1100), 46.0)
    for t, nm, g in [(47.0, "A4", .4), (48.2, "C5", .4), (49.4, "G4", .38), (50.6, "A4", .38)]:
        place(m, felt_piano(hz(nm), 1.8, g), t)
    place(m, pad([hz(c) for c in ["C3", "G3", "E4", "C5"]], 7.0, 0.55, a=0.6, r=2.0, bright=1600), WHISTLE - 0.2)
    place(m, strings([hz(c) for c in ["C3", "G3", "E4"]], 5.0, 0.5, a=0.9, r=1.6), WHISTLE)
    for i, nm in enumerate(["G5", "E5", "C5", "D5", "E5", "G5"]):
        place(m, flute(hz(nm), 1.0 + 0.1 * i, 0.4), m4["t"] + 0.2 + i * 0.5)
    place(m, felt_piano(hz("C4"), 3.0, 0.5), 57.4); place(m, felt_piano(hz("G4"), 3.0, 0.45), 57.55); place(m, felt_piano(hz("E5"), 3.0, 0.45), 57.7)
    return np.stack([m, m], axis=1).astype(np.float32)


def sfx(L, T):
    x = np.zeros(N, dtype=np.float32)
    bed = np.zeros(N, dtype=np.float32)
    st = np.zeros((N, 2), dtype=np.float32)
    m0, d1, d2, k0, m2, d3, m3, k1, m4, d4 = (L[i] for i in ("m0", "d1", "d2", "k0", "m2", "d3", "m3", "k1", "m4", "d4"))
    # ---- ambience (noise only, no tones): kitchen room, evening crickets through the window, far street
    place(bed, room_tone(60, 0.25), 0.0)
    place(bed, crickets(60, 0.07), 0.0)
    place(bed, street_bed(60, 0.09), 0.0)
    # ---- stove: ignite, then the gas rush while the flame burns
    for k in range(3):
        place_st(st, tick(0.4, 2600 + 120 * k), 0.15 + 0.12 * k, -0.3)
    place_st(st, whoomp(0.5), 0.45, -0.3)
    place_st(st, gas_hiss(FLAME_OFF - 0.6, 0.07), 0.5, -0.3)
    # ---- the cooker: simmer and rumble, and the leak hiss that rises, then dies when the flame goes off
    place_st(st, gurgle(FLAME_OFF - 1.0, 0.07), 0.6, -0.25)
    place_st(st, steam_hiss(5.0, 0.1), 0.6, -0.2)
    place_st(st, steam_hiss(FLAME_OFF - 5.6, 0.2), 5.6, -0.2)
    place_st(st, steam_hiss(2.6, 0.1), FLAME_OFF, -0.2)             # dying away while the pressure drops
    place_st(st, steam_hiss(1.4, 0.07), FLAME_OFF + 2.4, -0.2)
    # ---- people: spoon, chair, fingers on the table, footsteps
    for t in (1.9, 4.1, 6.3):
        place_st(st, spoon_clink(0.22), t, -0.45)
    place_st(st, creak(1.0, 0.25), d1["t"] - 0.6, 0.5)
    for k in range(7):                                              # Dad's fingers on the table
        place_st(st, wood(0.28, 1100), 5.2 + k * 0.62, 0.55)
    for t in np.arange(6.9, 8.9, 0.5):
        place_st(st, b.kenney("walking", 6.0)[: int(0.26 * SR)], float(t), 0.3)
    place_st(st, cloth(0.4, 0.4), k0["t"] - 0.15, 0.3)              # Kimu turns toward the cooker
    place_st(st, sigh(0.28), m2["t"] + 1.7, -0.4)
    place_st(st, thud(0.5), d3["t"] + 0.5, 0.55)                    # Dad's hand waves it away
    place_st(st, sigh(0.25), m3["t"] + 1.8, 0.5)
    # ---- the prayer: still room, one soft breath, the moment of seeing
    place_st(st, sigh(0.3), 22.6, 0.3)
    place_st(st, tick(0.4, 1800), 23.4, 0.0)
    for t in np.arange(23.6, 25.0, 0.48):
        place_st(st, b.kenney("walking", 6.0)[: int(0.26 * SR)], float(t), 0.25)
    # ---- the lesson
    place_st(st, gurgle(3.2, 0.14), 28.6, 0.0)
    for k in range(9):
        place_st(st, tick(0.3 + 0.03 * k, 1200 + 130 * k), 29.4 + k * 0.38, 0.4)   # the gauge climbing
    place_st(st, gurgle(3.0, 0.16), 33.4, 0.0)
    place_st(st, pop(900, 0.3), 35.4, 0.0)
    place_st(st, steam_hiss(1.0, 0.25), 38.6, 0.0); place_st(st, cooker_whistle(1.5, 0.28), 38.75, 0.0)     # the whistle, explained
    place_st(st, steam_hiss(2.4, 0.22), 42.8, 0.0)                                                            # the leak, explained
    place_st(st, whoosh(0.7, 0.3, True), 28.0, 0.0)
    # ---- the fix
    place_st(st, relay_clack(0.45), FLAME_OFF, -0.2)                # knob click
    place_st(st, steam_hiss(0.5, 0.12), FLAME_OFF + 0.05, -0.2)
    place_st(st, lid_clank(0.35), LID_OPEN + 0.1, -0.1)             # the lid comes off
    place_st(st, steam_hiss(1.2, 0.26), LID_OPEN + 0.05, -0.1)      # a puff of the last steam
    place_st(st, rub(1.1, 0.34), 51.1, -0.1)                        # wiping the rim
    place_st(st, lid_clank(0.5), LID_SHUT + 0.2, -0.1)              # lid back on
    place_st(st, whoosh(0.8, 0.3, False), 52.8, 0.0)                # time skip
    for k in range(3):
        place_st(st, tick(0.4, 2600 + 120 * k), FLAME_ON + 0.05 + 0.1 * k, -0.3)
    place_st(st, whoomp(0.5), FLAME_ON + 0.35, -0.3)
    place_st(st, gas_hiss(60 - FLAME_ON - 0.4, 0.07), FLAME_ON + 0.3, -0.3)
    for k in range(5):                                              # the whistle, again and again, steam around it
        place_st(st, cooker_whistle(0.9 if k < 4 else 1.4, 0.34 - 0.04 * k), WHISTLE + k * 1.05, -0.2)
        place_st(st, steam_hiss(0.9, 0.2), WHISTLE + k * 1.05, -0.2)
    place_st(st, sigh(0.3), m4["t"] - 0.6, -0.4)                    # Mom's breath out
    for t in np.arange(55.3, 56.6, 0.45):
        place_st(st, b.kenney("walking", 6.0)[: int(0.26 * SR)], float(t), 0.4)
    place_st(st, creak(0.8, 0.3), 55.0, 0.5)                        # Dad's chair
    place_st(st, slide(0.5, 0.3), 57.3, 0.1)                        # Kimu's chair
    for k, t in enumerate((56.4, 57.0, 57.6)):
        place_st(st, clink(0.22), t, 0.3 + 0.1 * k)                 # plates set down
    for t in np.arange(57.0, 58.2, 0.45):
        place_st(st, b.kenney("walking", 6.0)[: int(0.26 * SR)], float(t), 0.0)
    return x, bed, st
