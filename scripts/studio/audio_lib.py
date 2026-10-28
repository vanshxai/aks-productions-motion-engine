"""Kimu Studio audio toolkit: every sound here is synthesised from scratch, so there is nothing to license.

Instruments: piano, pad, strings, pluck (marimba/pizz), bell, bass.  Percussion: shaker, wood, kick.
Effects: reverb, crickets, wind, chirp, door, hum, spark, whoosh, pop, shutdown beeps.
Voices: mumble() makes cartoon "blah" speech and returns a mouth envelope for lip flap.
Everything returns mono float32 arrays at SR (48 kHz).
"""
import numpy as np
from scipy.signal import lfilter, butter, sosfilt, fftconvolve

SR = 48000
rng = np.random.default_rng(7)
NOTES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def hz(name):
    """'C#4' -> frequency."""
    n = NOTES[name[0]]
    i = 1
    if len(name) > 2 and name[1] in "#b":
        n += 1 if name[1] == "#" else -1
        i = 2
    octv = int(name[i:])
    return 440.0 * 2 ** ((12 * (octv + 1) + n - 69) / 12)


def t_of(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = max(na, 1)
    e[:na] = np.linspace(0, 1, na)
    if nd > 0:
        e[na:na + nd] = np.linspace(1, s, min(nd, max(n - na, 0)))[: max(min(nd, n - na), 0)]
    if nr > 0 and nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def place(buf, x, t, gain=1.0):
    """Add x into buf at time t (s). Grows nothing; clips at the end."""
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    a = max(0, -i)
    n = min(len(x) - a, len(buf) - max(i, 0))
    buf[max(i, 0):max(i, 0) + n] += x[a:a + n] * gain


# ---------------------------------------------------------------- instruments
def piano(f, dur=2.0, vel=0.7):
    t = t_of(dur + 0.6)
    y = np.zeros_like(t)
    for n in range(1, 12):
        fn = f * n * np.sqrt(1 + 0.0004 * n * n)
        if fn > 9000:
            break
        decay = 1.6 + 0.9 * n + f / 400.0
        y += (1.0 / n ** 1.15) * np.sin(2 * np.pi * fn * t + n) * np.exp(-t * decay / (1.0 + 0.15 * dur))
    hammer = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 90) * 0.08
    y = (y + hammer) * (1 - np.exp(-t * 600))
    y *= np.minimum(1, (dur + 0.6 - t) / 0.3)
    return (y * vel * 0.55).astype(np.float32)


def pad(freqs, dur=4.0, vel=0.5, a=0.8, r=1.2, bright=1800):
    t = t_of(dur)
    y = np.zeros_like(t)
    for f in freqs:
        for det in (-0.007, 0.0, 0.007):
            ff = f * (1 + det)
            ph = (ff * t) % 1.0
            y += (2 * ph - 1) * 0.33
    y = lp(y, bright, 2)
    return (y * env_adsr(len(t), a, 0.2, 0.85, r) * vel * 0.25 / max(1, len(freqs) ** 0.5)).astype(np.float32)


def strings(freqs, dur=4.0, vel=0.5, a=0.5, r=1.0, vib=5.0):
    t = t_of(dur)
    y = np.zeros_like(t)
    for k, f in enumerate(freqs):
        for det in (-0.004, 0.004):
            ff = f * (1 + det) * (1 + 0.003 * np.sin(2 * np.pi * (vib + 0.3 * k) * t) * np.minimum(1, t / 0.8))
            ph = np.cumsum(ff) / SR % 1.0
            y += (2 * ph - 1) * 0.5
    y = lp(y, 2600, 2)
    return (y * env_adsr(len(t), a, 0.3, 0.85, r) * vel * 0.2 / max(1, len(freqs) ** 0.5)).astype(np.float32)


def pluck(f, dur=0.6, vel=0.7, bright=1.0):
    t = t_of(dur)
    y = np.sin(2 * np.pi * f * t) + 0.35 * bright * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30) + 0.2 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 12)
    y *= np.exp(-t * (7 + f / 120.0)) * (1 - np.exp(-t * 800))
    return (y * vel * 0.5).astype(np.float32)


def bell(f, dur=2.5, vel=0.5):
    t = t_of(dur)
    idx = 3.0 * np.exp(-t * 3.0)
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 1.6)
    y += 0.4 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3)
    return (y * vel * 0.4 * (1 - np.exp(-t * 500))).astype(np.float32)


def bass(f, dur=0.8, vel=0.7):
    t = t_of(dur)
    y = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    y *= env_adsr(len(t), 0.01, 0.1, 0.7, 0.15)
    return (y * vel * 0.5).astype(np.float32)


def shaker(dur=0.12, vel=0.5):
    t = t_of(dur)
    return (hp(rng.standard_normal(len(t)), 6000) * np.exp(-t * 35) * vel * 0.25).astype(np.float32)


def wood(vel=0.6, f=900):
    t = t_of(0.12)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 55) * vel * 0.5).astype(np.float32)


def kick(vel=0.7):
    t = t_of(0.3)
    f = 50 + 90 * np.exp(-t * 28)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * vel * 0.8).astype(np.float32)


# ---------------------------------------------------------------- reverb
def reverb_ir(rt=1.8, damp=4500, seed=1):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t * 6.9 / rt)
    ir = lp(ir, damp, 1)
    ir[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt((ir ** 2).sum())


def reverb(x, wet=0.25, rt=1.8):
    l = fftconvolve(x, reverb_ir(rt, 4500, 1))[: len(x)]
    r = fftconvolve(x, reverb_ir(rt, 4200, 2))[: len(x)]
    return np.stack([x * (1 - wet) + l * wet, x * (1 - wet) + r * wet], axis=1)


# ---------------------------------------------------------------- sound effects
def hum(dur, f=100, vel=0.3):
    t = t_of(dur)
    y = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t)
    y += lp(rng.standard_normal(len(t)), 400) * 0.4
    return (y * vel * 0.4).astype(np.float32)


def spindown(dur=1.4, f0=110, vel=0.4):
    t = t_of(dur)
    f = f0 * np.exp(-t * 2.2)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    y += lp(rng.standard_normal(len(t)), 600) * 0.3 * np.exp(-t * 3)
    return (y * np.exp(-t * 2.0) * vel * 0.5).astype(np.float32)


def thunk(vel=0.8):
    t = t_of(0.5)
    f = 140 * np.exp(-t * 14) + 38
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    y += lp(rng.standard_normal(len(t)), 1200) * np.exp(-t * 60) * 0.5
    return (y * vel * 0.8).astype(np.float32)


def crickets(dur, vel=0.3):
    t = t_of(dur)
    y = np.zeros_like(t)
    for k in range(5):
        f = 4200 + 260 * k
        start = rng.uniform(0, 1.2)
        rate = 26 + 3 * k
        gate = (np.sin(2 * np.pi * rate * t) > 0.2).astype(float)
        burst = ((t + start + k * 0.37) % (1.1 + 0.15 * k)) < (0.45 + 0.05 * k)
        y += np.sin(2 * np.pi * f * t) * lp(gate.astype(float), 200, 1) * burst * (0.5 / 5)
    return (bp(y, 3500, 6500) * vel).astype(np.float32)


def wind(dur, vel=0.3):
    n = rng.standard_normal(int(dur * SR))
    t = t_of(dur)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t) * np.sin(2 * np.pi * 0.07 * t + 1)
    return (bp(n, 150, 900) * mod * vel * 1.6).astype(np.float32)


def chirp(f0=3200, dur=0.16, vel=0.4, up=True):
    t = t_of(dur)
    f = f0 * (1 + (0.5 if up else -0.3) * (t / dur) ** 1.3)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) ** 1.5
    return (y * vel * 0.5).astype(np.float32)


def bird_song(vel=0.4, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros(int(1.4 * SR), dtype=np.float32)
    t = 0.0
    for _ in range(r.integers(3, 6)):
        place(out, chirp(r.uniform(2400, 4200), r.uniform(0.07, 0.17), 1.0, bool(r.integers(0, 2))), t)
        t += r.uniform(0.1, 0.2)
    return out * vel


def flutter(vel=0.3):
    t = t_of(0.35)
    n = bp(rng.standard_normal(len(t)), 500, 3000)
    return (n * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * t)) * np.sin(np.pi * t / 0.35) * vel).astype(np.float32)


def creak(dur=1.2, vel=0.35):
    t = t_of(dur)
    f = 180 + 120 * np.sin(2 * np.pi * 0.9 * t) + 60 * t
    y = ((np.cumsum(f) / SR) % 1.0) * 2 - 1
    y = bp(y, 300, 2200) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t))
    return (y * np.sin(np.pi * t / dur) * vel).astype(np.float32)


def sigh(vel=0.3):
    t = t_of(0.9)
    n = bp(rng.standard_normal(len(t)), 400, 2600)
    return (n * np.sin(np.pi * t / 0.9) ** 2 * vel * 0.8).astype(np.float32)


def slide(dur=0.55, vel=0.35):
    t = t_of(dur)
    n = bp(rng.standard_normal(len(t)), 200, 1800) * np.sin(np.pi * t / dur)
    return (n * vel).astype(np.float32)


def whoosh(dur=0.7, vel=0.35, up=True):
    t = t_of(dur)
    n = rng.standard_normal(len(t))
    sweep = np.linspace(400, 5000, len(t)) if up else np.linspace(5000, 400, len(t))
    y = np.zeros_like(n)
    blk = 1024
    for i in range(0, len(t), blk):
        c = sweep[min(i, len(sweep) - 1)]
        y[i:i + blk] = bp(n[i:i + blk + 256], c * 0.7, c * 1.4, 1)[:len(y[i:i + blk])]
    return (y * np.sin(np.pi * t / dur) ** 2 * vel * 2.2).astype(np.float32)


def pop(f=700, vel=0.4):
    t = t_of(0.18)
    fr = f * (1 + 1.2 * np.exp(-t * 40))
    return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 22) * vel * 0.6).astype(np.float32)


def beep(f=880, dur=0.12, vel=0.3):
    t = t_of(dur)
    return (np.sin(2 * np.pi * f * t) * env_adsr(len(t), 0.005, 0, 1, 0.03) * vel * 0.5).astype(np.float32)


def buzz(dur=0.22, vel=0.3, f=110):
    t = t_of(dur)
    y = (((f * t) % 1.0) * 2 - 1) > 0
    return (lp(y.astype(float) * 2 - 1, 1500) * env_adsr(len(t), 0.005, 0, 1, 0.03) * vel * 0.5).astype(np.float32)


def spark(dur=1.4, vel=0.4):
    t = t_of(dur)
    y = np.zeros_like(t)
    for _ in range(14):
        s = rng.uniform(0, dur - 0.1)
        i = int(s * SR)
        L = int(rng.uniform(0.01, 0.04) * SR)
        y[i:i + L] += rng.standard_normal(L) * np.hanning(L)
    return (hp(y, 1800) * vel * 0.8).astype(np.float32)


def rip(dur=0.45, vel=0.35):
    t = t_of(dur)
    n = hp(rng.standard_normal(len(t)), 2000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 45 * t))) * np.sin(np.pi * t / dur)
    return (n * vel * 0.8).astype(np.float32)


def powerup(dur=0.9, vel=0.35):
    t = t_of(dur)
    f = 60 + 90 * (t / dur) ** 2
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return (y * np.minimum(1, t / 0.3) * np.exp(-np.maximum(0, t - 0.6) * 5) * vel * 0.5).astype(np.float32)


def clink(vel=0.35):
    t = t_of(0.5)
    y = np.sin(2 * np.pi * 3400 * t) * np.exp(-t * 14) + 0.5 * np.sin(2 * np.pi * 5100 * t) * np.exp(-t * 20)
    return (y * vel * 0.5).astype(np.float32)


# ---------------------------------------------------------------- cartoon "blah" voices
FORMANTS = [(730, 1090), (270, 2290), (300, 870), (530, 1840), (660, 1720)]


def syllables(text):
    out = []
    for w in text.replace("-", " ").split():
        w2 = "".join(ch for ch in w.lower() if ch.isalpha())
        if not w2:
            continue
        groups = max(1, len([g for g in "".join(c if c in "aeiouy" else " " for c in w2).split() if g]))
        out.append((w, groups, w[-1] in "?!.,"))
    return out


def mumble(text, base=120.0, syll=0.15, seed=0, question=None):
    """Returns (audio, envelope[(t, open0..1)], duration)."""
    r = np.random.default_rng(seed)
    sy = syllables(text)
    total = sum(g for _, g, _ in sy)
    q = question if question is not None else text.strip().endswith("?")
    parts, env, t = [], [], 0.0
    k = 0
    for w, g, punct in sy:
        for s in range(g):
            d = syll * r.uniform(0.85, 1.2)
            n = int(d * SR)
            tt = np.arange(n) / SR
            prog = (k + 1) / total
            contour = 1.0 + 0.12 * np.sin(np.pi * prog) + (0.18 * prog if q else -0.08 * prog)
            f0 = base * contour * r.uniform(0.94, 1.1)
            f1, f2 = FORMANTS[r.integers(0, len(FORMANTS))]
            src = ((np.cumsum(np.full(n, f0)) / SR) % 1.0) * 2 - 1
            y = bp(src, f1 * 0.8, f1 * 1.2, 1) + 0.7 * bp(src, f2 * 0.85, f2 * 1.15, 1)
            y *= np.sin(np.pi * np.linspace(0, 1, n)) ** 0.6
            parts.append(y.astype(np.float32) * 0.8)
            env.append((round(t + d * 0.1, 3), round(float(r.uniform(0.55, 1.0)), 2)))
            env.append((round(t + d * 0.85, 3), 0.0))
            t += d
            k += 1
        gap = 0.09 + (0.12 if punct else 0)
        parts.append(np.zeros(int(gap * SR), dtype=np.float32))
        t += gap
    audio = np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)
    audio = lp(audio, 3800, 1)
    audio = audio / (np.abs(audio).max() + 1e-6) * 0.6
    return audio, env, len(audio) / SR


def to_stereo(x):
    return np.stack([x, x], axis=1) if x.ndim == 1 else x


# ================================================================ v2: warmer, grown-up instruments and real-world effects
def felt_piano(f, dur=2.0, vel=0.6):
    """Soft felt-damped piano: rounder than piano(), good for sad / tender lines."""
    y = piano(f, dur, vel)
    return (lp(y, 1900, 2) * 1.15).astype(np.float32)


def ep(f, dur=1.6, vel=0.5):
    """Warm electric piano (FM tine)."""
    t = t_of(dur)
    idx = 1.6 * np.exp(-t * 5)
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    y += 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 4)
    y *= np.exp(-t * 1.8) * (1 - np.exp(-t * 400))
    y *= 1 + 0.08 * np.sin(2 * np.pi * 4.8 * t)
    return (y * vel * 0.45).astype(np.float32)


def flute(f, dur=1.5, vel=0.5, vib=5.2):
    """Breathy wooden flute for nostalgic melody lines."""
    t = t_of(dur)
    ff = f * (1 + 0.006 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / 0.5))
    ph = np.cumsum(ff) / SR
    y = np.sin(2 * np.pi * ph) + 0.18 * np.sin(4 * np.pi * ph) + 0.06 * np.sin(6 * np.pi * ph)
    breath = bp(rng.standard_normal(len(t)), f * 1.5, f * 6) * 0.1
    y = (y + breath) * env_adsr(len(t), 0.09, 0.15, 0.85, 0.3)
    return (y * vel * 0.4).astype(np.float32)


def guitar(f, dur=1.2, vel=0.6):
    """Nylon-string guitar (Karplus-Strong)."""
    n = int(dur * SR)
    N = int(SR / f)
    x = np.zeros(n)
    x[:N] = rng.uniform(-1, 1, N)
    x[:N] = lp(x[:N], 5500, 1)
    a = np.zeros(N + 2)
    a[0] = 1.0
    a[N] = -0.4985
    a[N + 1] = -0.4985
    y = lfilter([1.0], a, x)
    y = lp(y, 4200, 1)
    return (y * vel * 0.9 / (np.abs(y).max() + 1e-9) * 0.5).astype(np.float32)


def cello(f, dur=3.0, vel=0.5, a=0.35, r=0.8):
    t = t_of(dur)
    ff = f * (1 + 0.004 * np.sin(2 * np.pi * 4.6 * t) * np.minimum(1, t / 0.7))
    ph = np.cumsum(ff) / SR % 1.0
    y = (2 * ph - 1)
    y = lp(y, 1400, 2) + 0.4 * np.sin(2 * np.pi * np.cumsum(ff) / SR)
    return (y * env_adsr(len(t), a, 0.2, 0.9, r) * vel * 0.3).astype(np.float32)


def upright(f, dur=0.6, vel=0.7):
    t = t_of(dur)
    y = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 8) + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 14)
    y *= np.exp(-t * 5.5) * (1 - np.exp(-t * 300))
    return (y * vel * 0.55).astype(np.float32)


def conga(vel=0.5, f=190):
    t = t_of(0.28)
    fr = f * (1 + 0.5 * np.exp(-t * 40))
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 16) + lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 90) * 0.3
    return (y * vel * 0.5).astype(np.float32)


def brush(dur=0.18, vel=0.4):
    t = t_of(dur)
    return (bp(rng.standard_normal(len(t)), 3000, 9000) * np.exp(-t * 18) * vel * 0.2).astype(np.float32)


def tick(vel=0.4, f=2200):
    t = t_of(0.05)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 200) * 0.5
    return (y * vel * 0.5).astype(np.float32)


def key_tap(vel=0.4):
    t = t_of(0.06)
    y = bp(rng.standard_normal(len(t)), 1800, 5200) * np.exp(-t * 110) + np.sin(2 * np.pi * 320 * t) * np.exp(-t * 90) * 0.4
    return (y * vel * 0.4).astype(np.float32)


def heartbeat(vel=0.5):
    t = t_of(0.5)
    def thump(t0, g):
        tt = t - t0
        m = tt > 0
        f = 62 * np.exp(-np.clip(tt, 0, None) * 12) + 40
        y = np.sin(2 * np.pi * np.cumsum(np.where(m, f, 0)) / SR) * np.exp(-np.clip(tt, 0, None) * 16) * m
        return y * g
    return ((thump(0.0, 1.0) + thump(0.17, 0.7)) * vel * 0.7).astype(np.float32)


def thud(vel=0.6):
    """Hand on a wooden desk."""
    t = t_of(0.3)
    y = np.sin(2 * np.pi * (95 * np.exp(-t * 18) + 55) * t) * np.exp(-t * 20) + lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 60) * 0.7
    return (y * vel * 0.8).astype(np.float32)


def cloth(dur=0.5, vel=0.3):
    t = t_of(dur)
    env = np.sin(np.pi * t / dur) ** 2
    return (bp(rng.standard_normal(len(t)), 800, 4500) * env * vel * 0.25).astype(np.float32)


def door_close(vel=0.6):
    t = t_of(0.6)
    y = np.sin(2 * np.pi * (80 * np.exp(-t * 12) + 45) * t) * np.exp(-t * 9) + lp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 40) * 0.6
    y += 0.15 * bp(rng.standard_normal(len(t)), 400, 1200) * np.exp(-np.clip(t - 0.08, 0, None) * 18) * (t > 0.08)
    return (y * vel * 0.8).astype(np.float32)


def low_battery(vel=0.3):
    """Two soft descending device tones."""
    t = t_of(0.6)
    y = np.zeros_like(t)
    for t0, f in ((0.0, 523.0), (0.22, 392.0)):
        m = (t >= t0)
        tt = np.clip(t - t0, 0, None)
        y += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * m * (1 - np.exp(-tt * 300))
    return (lp(y, 2500) * vel * 0.4).astype(np.float32)


def relay_clack(vel=0.5):
    t = t_of(0.25)
    y = bp(rng.standard_normal(len(t)), 600, 3500) * np.exp(-t * 110) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 40) * 0.5
    y += 0.6 * (bp(rng.standard_normal(len(t)), 800, 4000) * np.exp(-np.clip(t - 0.09, 0, None) * 120) * (t > 0.09))
    return (y * vel * 0.5).astype(np.float32)


def fluoro(dur=1.0, vel=0.3):
    """Tube light flicker + hum coming on."""
    t = t_of(dur)
    gate = ((np.sin(2 * np.pi * 11 * t) > 0.1) | (t > 0.55)).astype(float)
    y = (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200 * t)) * lp(gate, 400, 1) * np.minimum(1, t / 0.6)
    y += bp(rng.standard_normal(len(t)), 2000, 6000) * np.exp(-t * 20) * 0.3
    return (y * vel * 0.4).astype(np.float32)


def mosquito(dur, vel=0.05):
    t = t_of(dur)
    f = 520 + 40 * np.sin(2 * np.pi * 0.6 * t) + 14 * np.sin(2 * np.pi * 3.1 * t)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.23 * t)) ** 2
    return (y * vel).astype(np.float32)


def room_tone(dur, vel=0.12):
    t = t_of(dur)
    y = lp(rng.standard_normal(len(t)), 220, 2) * 1.4 + lp(rng.standard_normal(len(t)), 900, 1) * 0.15
    return (y * vel).astype(np.float32)


def street_bed(dur, vel=0.15):
    """Distant traffic murmur."""
    t = t_of(dur)
    y = lp(rng.standard_normal(len(t)), 500, 2) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.11 * t))
    return (y * vel).astype(np.float32)


def stab_low(dur=2.5, vel=0.4):
    """Dark low cluster for anger / tension."""
    return strings([hz("A1"), hz("E2"), hz("F2"), hz("A2")], dur, vel, a=0.6, r=1.2, vib=4.0)


def pan(x, p):
    """Mono -> stereo with constant-power pan, p in [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1).astype(np.float32)
