"""60 s sound design for 'The Kill Switch': room tone, rain, synth score, SFX cut to picture.
Output: /home/claude/film/audio/mix60.wav (48 kHz stereo)."""
import numpy as np, subprocess, os
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 48000; DUR = 60.0; N = int(SR * DUR)
SFX = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public/sfx")
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)
FR = [("S01",108),("S02",84),("S03",72),("S04",84),("S05",96),("S06",72),("S07",84),("S08",108),("S09",108),("S10",72),("S11",84),("S12",60),("S13",84),("S14",72),("S15",60),("S16",72),("S17",48),("S18",72)]
T = {}; _acc = 0
for _k, _n in FR: T[_k] = _acc / 24; _acc += _n


def load(name):
    tmp = f"/tmp/_sfx60_{name}.wav"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{SFX}/{name}.wav", "-ar", str(SR), "-ac", "2", tmp], check=True)
    sr, d = wavfile.read(tmp); return d.astype(np.float32) / (32768.0 if d.dtype == np.int16 else 1.0)


def put(sig, at, gain=1.0, pan=0.0, peak=True, trim=None):
    s = sig if sig.ndim == 2 else np.stack([sig, sig], 1)
    if trim: s = s[: int(trim * SR)]
    off = int(np.argmax(np.abs(s).max(1))) if peak else 0
    i0 = int(at * SR) - off; a, b = max(0, i0), min(N, i0 + len(s))
    if b <= a: return
    seg = s[a - i0: b - i0] * gain
    L[a:b] += seg[:, 0] * (1 - max(0, pan)); R[a:b] += seg[:, 1] * (1 + min(0, pan))


def mono(x, at, g=1.0, pan=0.0):
    i = int(at * SR); n = min(len(x), N - i)
    if n <= 0: return
    L[i:i + n] += x[:n] * g * (1 - max(0, pan)); R[i:i + n] += x[:n] * g * (1 + min(0, pan))


def lp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, f0, f1, o=2): b, a = butter(o, [f0 / (SR / 2), f1 / (SR / 2)], "band"); return lfilter(b, a, x)
def env(n, a, r): e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] = np.linspace(1, 0, nr); return e


# ---------------------------------------------------------------- ambience: dev room (rain on glass + room tone), office (air + traffic)
def ambience(t0, t1, kind):
    n = int((t1 - t0) * SR); x = rng.standard_normal(n)
    if kind == "room":
        rain = bp(x, 900, 7000) * 0.05 + lp(rng.standard_normal(n), 300) * 0.04
        drops = (rng.random(n) < 0.0006) * rng.standard_normal(n) * 0.6; rain += bp(drops, 1500, 6000) * 0.4
        y = rain
    else:
        y = lp(x, 500) * 0.05 + bp(rng.standard_normal(n), 120, 900) * 0.03
    y *= env(n, 0.05, 0.05); mono(y, t0, 1.0)


for a, b, k in [(0, T["S11"], "room"), (T["S11"], T["S13"], "office"), (T["S13"], T["S14"], "room"), (T["S14"], T["S16"], "office"), (T["S16"], 60, "room")]:
    ambience(a, b, k)

# ---------------------------------------------------------------- score
tt = np.arange(N) / SR
def chord(freqs, t0, t1, g, bright=1400, att=0.8, rel=0.8):
    n = int((t1 - t0) * SR); tn = np.arange(n) / SR; x = np.zeros(n)
    for f in freqs:
        for det in (-0.35, 0.0, 0.35):
            x += np.sin(2 * np.pi * (f + det) * tn) * 0.5 + (2 * ((f + det) * tn % 1) - 1) * 0.1
    x = lp(x / (len(freqs) * 3), bright) * env(n, att, rel) * g
    i = int(t0 * SR); L[i:i + n] += x * 0.92; R[i:i + n] += x
Am = [110.0, 164.81, 220.0, 261.63]; F = [87.31, 130.81, 174.61, 220.0]; Dm = [73.42, 146.83, 174.61, 220.0]; E = [82.41, 123.47, 164.81, 207.65]
C = [65.41, 130.81, 196.0, 261.63]; G = [98.0, 146.83, 196.0, 246.94]; Fm = [87.31, 130.81, 174.61, 207.65]
# act 1: hopeful-but-quiet, then sinking
chord(C, 0, 4.6, 0.30, 1100); chord(G, 4.4, 8.2, 0.30, 1100); chord(Am, 8.0, 11.6, 0.32, 1200)
chord(F, 11.4, 15.2, 0.34, 900); chord(Dm, 15.0, 19.2, 0.36, 700); chord(E, 19.0, 25.6, 0.36, 650)
# act 2: discovery — amber lift
chord(Am, 25.4, 29.8, 0.40, 1600); chord(F, 29.6, 34.2, 0.42, 1800); chord(C, 34.0, 37.6, 0.44, 2000)
# act 3: client — tension drone
n = int((43.5 - 37.5) * SR); tn = np.arange(n) / SR
drone = (np.sin(2 * np.pi * 55 * tn) + 0.5 * np.sin(2 * np.pi * 82.4 * tn + np.sin(tn * 2))) * env(n, 0.5, 0.3) * 0.22
mono(lp(drone, 400), 37.5)
chord(Fm, 43.5, 47.2, 0.30, 700); chord(E, 47.0, 52.6, 0.34, 800)
# act 4: payoff — resolve major
chord(C, 52.5, 55.7, 0.45, 2400); chord(G, 55.5, 57.7, 0.45, 2400); chord(C, 57.5, 60.0, 0.5, 2600, rel=1.5)

def pluck(at, f, g=0.2, bright=4000):
    n = int(0.6 * SR); tn = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * tn) + 0.35 * np.sin(2 * np.pi * 2 * f * tn)) * np.exp(-tn * 6) * g
    mono(lp(x, bright), at, 1.0, pan=0.2 * np.sin(at))
arp = [220.0, 261.63, 329.63, 392.0, 440.0, 392.0, 329.63, 261.63]
k = 0; t = 25.5
while t < 37.4: pluck(t, arp[k % 8], 0.17); t += 0.25; k += 1
t = 52.5; k = 0
while t < 59.5: pluck(t, arp[k % 8] * 2, 0.15, 6000); t += 0.25; k += 1
# heartbeat under GHOSTED
for at in np.arange(15.2, 19.0, 0.82):
    n = int(0.25 * SR); tn = np.arange(n) / SR; hb = np.sin(2 * np.pi * 50 * tn) * np.exp(-tn * 16) * 0.9
    mono(hb, at); mono(hb * 0.6, at + 0.18)
# kick pulse under the protect sequence and the payoff
def kick(at, g=0.9):
    n = int(0.45 * SR); tn = np.arange(n) / SR
    mono(np.sin(2 * np.pi * (45 * np.exp(-tn * 10) + 42) * tn) * np.exp(-tn * 7) * g, at)
for at in np.arange(30.0, 34.4, 0.5): kick(at, 0.5)
for at in np.arange(52.5, 57.4, 0.5): kick(at, 0.75)
# sub drop on ONE CLICK and on the logo
def subdrop(at, g=1.0):
    n = int(1.6 * SR); tn = np.arange(n) / SR
    mono(np.sin(2 * np.pi * (70 * np.exp(-tn * 1.8) + 30) * tn) * np.exp(-tn * 1.6) * g, at)
subdrop(45.3, 0.9); subdrop(57.6, 0.8)

# ---------------------------------------------------------------- SFX
S = {n: load(n) for n in ["typing", "keys", "notif", "softnotif", "boom", "impact", "whoosh", "whoosh2", "swoosh1", "swish", "click", "stamp", "ding2", "pop", "coin", "riser", "tap", "tap2", "shutter"]}

def buzz(at, dur=0.45, g=0.6):
    n = int(dur * SR); tn = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 170 * tn)) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * tn))
    x = bp(x, 120, 1800) * env(n, 0.01, 0.03) * g
    mono(x, at); mono(x, at + dur + 0.25)

put(S["typing"], 0.4, 0.35, peak=False, trim=4.0)                      # S01 typing
put(S["keys"], T["S02"] + 0.3, 0.5, peak=False, trim=0.9)
put(S["click"], T["S02"] + 1.2, 0.8); put(S["whoosh2"], T["S02"] + 1.3, 0.55); put(S["softnotif"], T["S02"] + 1.6, 0.6)  # sent
put(S["tap2"], T["S03"] + 0.6, 0.25)                                   # chair creak-ish
buzz(T["S04"] + 0.5, g=0.55)                                             # phone buzz on wood
put(S["notif"], T["S04"] + 0.55, 0.35)
put(S["whoosh"], T["S05"], 0.35, trim=0.9)
put(S["tap"], T["S06"] + 0.4, 0.3)
for i in range(6): put(S["tap"], T["S06"] + 0.5 + i * 0.5, 0.12)        # clock ticks
put(S["swish"], T["S07"] + 0.5, 0.25)
put(S["whoosh2"], T["S08"], 0.5); put(S["ding2"], T["S08"] + 0.8, 0.35)
put(S["keys"], T["S09"] + 0.3, 0.55, peak=False, trim=3.2)
put(S["click"], T["S09"] + 3.6, 0.7); put(S["stamp"], T["S09"] + 3.9, 0.75)   # PROTECTED
put(S["click"], T["S10"] + 1.5, 0.6); put(S["whoosh2"], T["S10"] + 1.6, 0.6)  # sends the build
put(S["swoosh1"], T["S11"], 0.35); put(S["tap"], T["S11"] + 1.2, 0.2); put(S["tap"], T["S11"] + 1.5, 0.2); put(S["pop"], T["S11"] + 2.4, 0.35)
buzz(T["S12"] + 0.4, g=0.6); put(S["notif"], T["S12"] + 0.45, 0.35)
put(S["whoosh"], T["S13"], 0.4, trim=0.9)
put(S["click"], T["S13"] + 1.85, 1.0); put(S["impact"], T["S13"] + 1.9, 0.7)  # ONE CLICK (toggle at p=.55 of 84f ≈ 1.9 s)
put(S["shutter"], T["S14"] + 0.8, 0.4); put(S["stamp"], T["S14"] + 1.1, 0.8); put(S["boom"], T["S14"] + 1.1, 0.6)   # SUSPENDED
put(S["swish"], T["S15"] + 0.2, 0.4); put(S["impact"], T["S15"] + 0.3, 0.45)
buzz(T["S16"] + 0.3, g=0.5); put(S["coin"], T["S16"] + 0.5, 0.7); put(S["notif"], T["S16"] + 0.55, 0.5)   # PAID
put(S["click"], T["S17"] + 0.9, 0.6); put(S["ding2"], T["S17"] + 1.0, 0.45)
put(S["riser"], T["S18"] - 1.0, 0.45, peak=False, trim=1.0); put(S["boom"], T["S18"] + 0.1, 0.7); put(S["ding2"], T["S18"] + 0.4, 0.5)

# ---------------------------------------------------------------- master
m = max(np.abs(L).max(), np.abs(R).max()); g = 0.89 / m
L *= g; R *= g
fade = np.ones(N); fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR)); L *= fade; R *= fade
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build/audio"), exist_ok=True)
wavfile.write(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build/audio/mix60.wav"), SR, (np.stack([L, R], 1) * 32767).astype(np.int16))
print("mix60 peak", round(float(m), 2))
