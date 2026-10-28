#!/usr/bin/env python3
"""Kimu Voice Engine: text in, character voice out. Fully offline.

Model : Kokoro-82M, int8 ONNX (92 MB, Apache-2.0), run on CPU with onnxruntime. No network, no cost.
Voices: Kokoro style vectors, blended per character (see CAST). Trimmed to models/kimu_voice/voices.npz.
Speech : spoken phrase by phrase, pitch re-drawn per phrase (WORLD), real pauses + breaths, dry close-mic sound (no reverb).
Output: 48 kHz mono wav + a JSON sidecar with duration and a 30 fps mouth envelope for lip-sync.

CLI
  python3 scripts/studio/kimu_voice.py say --char dad --emo angry --text "Study first." -o out/dad.wav
  python3 scripts/studio/kimu_voice.py batch src/studio/s1e01/script.json public/studio/s1e01/voice
  python3 scripts/studio/kimu_voice.py cast          # list characters and emotions
Python
  from kimu_voice import speak;  audio, sr, meta = speak("kimu", "I know, Dad.", "sad")
"""
import argparse, hashlib, json, os, re, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MODEL = os.path.join(ROOT, "models", "kimu_voice", "kokoro-v1.0.int8.onnx")
VOICES = os.path.join(ROOT, "models", "kimu_voice", "voices.npz")
SR = 48000

VERSION = 8   # bump when the engine changes so cached lines are rebuilt

# One distinct Kokoro voice per character (single voices keep their natural intonation; blends flatten it).
# `shift` = whole-voice pitch change in semitones with formants moved too, so the speaker sounds like a different person.
CAST = {
    "kimu":     {"mix": {"am_eric": 1.0},   "lang": "en-us", "speed": 1.02, "shift": 1.5,  "note": "early 20s, light and quick, trails off, stammers when nervous"},
    "dad":      {"mix": {"am_onyx": 1.0},   "lang": "en-us", "speed": 0.95, "shift": 2.0,  "note": "50s, deep and gravelly, few words, long pauses, a bark when angry"},
    "mom":      {"mix": {"af_heart": 1.0},  "lang": "en-us", "speed": 0.98, "shift": 0.0,  "note": "40s, warm and soft, falls gently at line ends, quick when worried"},
    "uncle":    {"mix": {"am_fenrir": 1.0}, "lang": "en-us", "speed": 0.97, "shift": -3.0, "note": "60s, big warm neighbour, loud and rounded, laughs while talking"},
    "narrator": {"mix": {"bm_fable": 1.0},  "lang": "en-gb", "speed": 0.97, "shift": 0.0,  "note": "calm storyteller, British, dry and close, never echoes"},
}

# emotion -> speed, pause scale, pitch range multiplier on the voice's own movement, base offset (st), final fall (st),
#            declination (st over the line), stress (st on a marked word), limit L (soft cap of pitch swing, st), vibrato (st), gain (dB)
EMOTIONS = {
    "neutral":  dict(speed=1.00, pace=1.0,  rng=0.85, off=0.0,  fall=1.2, decl=0.8, stress=1.2, lim=3.5, vib=0,    gain=0.0),
    "calm":     dict(speed=0.95, pace=1.1,  rng=0.75, off=-0.3, fall=1.2, decl=0.6, stress=0.8, lim=3.0, vib=0,    gain=-1.5),
    "warm":     dict(speed=0.97, pace=1.0,  rng=0.95, off=0.4,  fall=1.0, decl=0.6, stress=1.4, lim=3.8, vib=0,    gain=0.0),
    "stern":    dict(speed=0.95, pace=1.2,  rng=0.70, off=-0.8, fall=2.0, decl=0.4, stress=1.2, lim=3.0, vib=0,    gain=0.5),
    "sad":      dict(speed=0.90, pace=1.25, rng=0.75, off=-1.2, fall=2.0, decl=1.0, stress=0.6, lim=3.0, vib=0.25, gain=-3.0, soften=True),
    "worried":  dict(speed=1.04, pace=0.85, rng=0.95, off=0.8,  fall=0.4, decl=0.3, stress=1.4, lim=4.0, vib=0.30, gain=-1.0, tremble=0.25),
    "scared":   dict(speed=1.08, pace=0.75, rng=1.00, off=1.6,  fall=0.0, decl=0.0, stress=1.6, lim=4.5, vib=0.50, gain=-0.5, tremble=0.5, breathy=True),
    "annoyed":  dict(speed=1.00, pace=1.0,  rng=0.85, off=-0.5, fall=1.8, decl=0.6, stress=1.3, lim=3.5, vib=0,    gain=0.5),
    "angry":    dict(speed=1.05, pace=0.80, rng=0.95, off=0.3,  fall=1.0, decl=0.2, stress=2.0, lim=4.5, vib=0.12, gain=2.5, drive=0.35),
    "shout":    dict(speed=1.08, pace=0.70, rng=1.05, off=1.5,  fall=0.8, decl=0.0, stress=2.2, lim=5.0, vib=0.15, gain=4.0, drive=0.6),
    "joy":      dict(speed=1.05, pace=0.90, rng=1.00, off=0.9,  fall=0.6, decl=0.2, stress=1.8, lim=4.5, vib=0,    gain=1.0),
    "relieved": dict(speed=0.97, pace=1.2,  rng=0.85, off=0.3,  fall=1.5, decl=0.8, stress=1.0, lim=3.5, vib=0,    gain=0.0, breathy=True),
    "whisper":  dict(speed=0.90, pace=1.2,  rng=0.70, off=0.0,  fall=1.0, decl=0.5, stress=0.5, lim=3.0, vib=0,    gain=-5.0, breathy=True),
    "narrate":  dict(speed=1.04, pace=0.85, rng=0.75, off=0.0,  fall=1.5, decl=0.5, stress=1.0, lim=3.0, vib=0,    gain=0.0),
    "inner":    dict(speed=0.97, pace=1.1,  rng=0.80, off=-0.2, fall=1.2, decl=0.6, stress=0.8, lim=3.0, vib=0,    gain=-0.5),
}
PAUSE = {",": 0.12, ";": 0.18, ":": 0.18, ".": 0.30, "!": 0.26, "?": 0.32, "...": 0.52, "\u2014": 0.24}   # seconds, before the emotion pace scale


# ----------------------------------------------------------------------------------------------
_kokoro = None


def _model():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(MODEL, VOICES)
    return _kokoro


def voice_vector(char):
    d = np.load(VOICES)
    v = sum(w * d[name] for name, w in CAST[char]["mix"].items())
    return v.astype(np.float32)


UNIT = re.compile(r"\s*([^,.;:!?\u2026\u2014\u2013]+?)\s*(\.{2,}|[,.;:!?\u2026]+|[\u2014\u2013]+|$)")


def parse(text):
    """'No, no, no\u2014not now.' -> [(phrase, punct)]  (\u2014 = cut off mid-thought)"""
    out = []
    for m in UNIT.finditer(text.strip()):
        w, p = m.group(1).strip(), m.group(2)
        if not w:
            continue
        if p.startswith("..") or p.startswith("\u2026"): p = "..."
        elif p[:1] in "\u2014\u2013": p = "\u2014"
        elif p == "": p = "."
        else: p = p[0]
        out.append((w, p))
    return out


def shape_line(x, sr, e, off, bumps, rise):
    """One PSOLA pass over the whole line (keeps the natural waveform and the voice's own flow).
    pitch(t) = natural movement * rng + offset - declination + a landing fall on the last words (or a rise for a question)
               + gentle stress on marked words + a shake for fear/worry, then softly capped so it never goes sing-song."""
    try:
        import parselmouth
        from parselmouth.praat import call
        snd = parselmouth.Sound(x.astype(np.float64), sr)
        man = call(snd, "To Manipulation", 0.005, 60, 500)
        pt = call(man, "Extract pitch tier")
        n = call(pt, "Get number of points")
        if n < 8:
            return x
        ts = np.array([call(pt, "Get time from index", i + 1) for i in range(n)])
        fs = np.array([call(pt, "Get value at index", i + 1) for i in range(n)])
        med = np.median(fs)
        u = np.clip((ts - ts[0]) / max(1e-3, ts[-1] - ts[0]), 0, 1)
        dev = 12 * np.log2(fs / med) * e["rng"]
        dev = dev - e["decl"] * u
        if rise:
            dev = dev + rise * np.clip((u - 0.78) / 0.22, 0, 1) ** 2
        else:
            dev = dev - e["fall"] * np.clip((u - 0.8) / 0.2, 0, 1) ** 1.3
        for c_, w_, a_ in bumps:                                  # seconds
            fade = 1 - np.clip((u - 0.86) / 0.14, 0, 1)             # never lift the very last syllable
            dev = dev + a_ * np.exp(-(((ts - c_) / max(w_, 0.06)) ** 2)) * fade
        if e.get("vib"):
            dev = dev + e["vib"] * np.sin(2 * np.pi * 5.5 * ts) * np.clip(u * 3, 0, 1)
        L = e["lim"]
        dev = L * np.tanh(dev / L)                                  # soft cap: expressive but human-sized
        nt = call("Create PitchTier", "p", 0, snd.duration)
        for tt, ff in zip(ts, med * 2 ** ((dev + e["off"] + off) / 12)):
            call(nt, "Add point", float(tt), float(ff))
        call([nt, man], "Replace pitch tier")
        y = call(man, "Get resynthesis (overlap-add)").values[0].astype(np.float32)
        return np.pad(y, (0, max(0, len(x) - len(y))))[: len(x)]
    except Exception:
        return x


def split_chunks(a, sr, min_gap=0.06):
    """Speech chunks separated by real silences (inside the line)."""
    k = int(0.01 * sr)
    env = np.convolve(np.abs(a), np.ones(k) / k, mode="same")
    quiet = env < max(0.006, 0.03 * env.max())
    chunks, i, n = [], 0, len(a)
    while i < n:
        if quiet[i]:
            i += 1
            continue
        j = i
        while j < n:
            if not quiet[j]:
                j += 1
                continue
            q = j
            while q < n and quiet[q]:
                q += 1
            if (q - j) / sr >= min_gap or q >= n:
                break
            j = q
        chunks.append((i, j))
        i = j
    return chunks


def breath(sr, dur=0.16, level=0.035, seed=5):
    rng = np.random.default_rng(seed)
    n = int(dur * sr)
    y = sosfilt(butter(2, [400 / (sr / 2), 4500 / (sr / 2)], btype="band", output="sos"), rng.standard_normal(n)).astype(np.float32)
    return y * np.hanning(n).astype(np.float32) * level


def apply_dsp(x, sr, e):
    if e.get("tremble"):
        t = np.arange(len(x)) / sr
        x = x * (1 + e["tremble"] * 0.12 * np.sin(2 * np.pi * 6.0 * t)).astype(np.float32)
    if e.get("breathy"):
        rng = np.random.default_rng(3)
        noise = rng.standard_normal(len(x)).astype(np.float32)
        sos = butter(2, [2500 / (sr / 2), 7500 / (sr / 2)], btype="band", output="sos")
        env = np.convolve(np.abs(x), np.ones(int(0.02 * sr)) / int(0.02 * sr), mode="same")
        x = x + 0.30 * sosfilt(sos, noise) * env
    if e.get("drive"):
        d = 1 + 4 * e["drive"]
        x = np.tanh(x * d) / np.tanh(d) * 0.9
    if e.get("soften"):
        x = sosfilt(butter(2, 5200 / (sr / 2), btype="low", output="sos"), x)
    # crisp, dry, close-mic: low cut + gentle presence lift. No reverb anywhere.
    x = sosfilt(butter(2, 85 / (sr / 2), btype="high", output="sos"), x)
    return deess(x, sr).astype(np.float32)


def deess(x, sr):
    """Tame Kokoro's harsh, hissy s/sh/t sounds: duck the 5-11 kHz band only while it spikes, then roll off the very top."""
    x = x.astype(np.float64)
    hf = sosfilt(butter(4, [5000 / (sr / 2), min(0.98, 11000 / (sr / 2))], btype="band", output="sos"), x)
    k = max(1, int(0.004 * sr))
    env = np.sqrt(np.convolve(hf ** 2, np.ones(k) / k, mode="same")) + 1e-9
    ref = np.percentile(env[env > env.max() * 0.02], 55) if (env > env.max() * 0.02).any() else env.max()
    g = np.clip(ref * 1.1 / env, 0.28, 1.0)
    g = np.convolve(g, np.ones(k) / k, mode="same")
    y = x - hf + hf * g
    return sosfilt(butter(2, 9500 / (sr / 2), btype="low", output="sos"), y)


def char_shift(x, sr, semis):
    """Whole-voice pitch change with formants moved too (a different-sized speaker)."""
    if abs(semis) < 0.05:
        return x
    import subprocess, tempfile
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
        sf.write(a, x.astype(np.float32), sr)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a, "-af", f"rubberband=pitch={2 ** (semis / 12):.5f}:formant=shifted:pitchq=quality", b], check=True)
        return sf.read(b)[0].astype(np.float32)


def mouth_envelope(x, sr, fps=30):
    """Mouth openness 0..1 per frame from the audio itself (so lips follow the real speech)."""
    hop = int(sr / fps)
    n = len(x) // hop
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    if e.max() <= 0:
        return []
    e = e / np.percentile(e, 95)
    e = np.clip(e, 0, 1) ** 0.8
    e[e < 0.08] = 0
    # light smoothing keeps the lips from jittering
    k = np.array([0.25, 0.5, 0.25])
    e = np.convolve(e, k, mode="same")
    return [[round(i / fps, 3), round(float(v), 2)] for i, v in enumerate(e)]


def speak(char, text, emo="neutral", speed=None, pitch=None, gain=None):
    """text -> natural speech. The whole line is spoken in one go (so intonation flows like a person's),
    then pitch is gently reshaped (landing fall / question rise / stress on *marked* words) and every pause is
    rebuilt from the punctuation: short inside a thought, longer at a full stop, a held beat at '...'."""
    c, e = CAST[char], dict(EMOTIONS[emo])
    k, vec = _model(), voice_vector(char)
    units = parse(text)
    rnd = np.random.default_rng(int(hashlib.md5((char + text).encode()).hexdigest()[:8], 16))
    spd = (speed or 1.0) * c["speed"] * e["speed"]
    kt = " ".join(w.replace("*", "") + {"—": ","}.get(p, p) for w, p in units)
    a, sr = k.create(kt, voice=vec, speed=float(np.clip(spd, 0.6, 1.5)), lang=c["lang"])
    a = a.astype(np.float32)
    chunks = split_chunks(a, sr)
    bumps = []                                    # stress on marked words, located by characters inside their chunk
    if chunks:
        aligned = len(chunks) == len(units)
        for i, (w, p) in enumerate(units):
            ws = w.split()
            nch = max(1, sum(len(x.strip("*")) + 1 for x in ws))
            pos = 0
            for j, wd in enumerate(ws):
                clean = wd.strip("*")
                f0_, f1_ = pos / nch, (pos + len(clean)) / nch
                pos += len(clean) + 1
                strength = 1.0 if wd.startswith("*") else (0.35 if (j == len(ws) - 1 and len(ws) > 1 and len(clean) > 3) else 0)
                if not strength:
                    continue
                if aligned:
                    s0, s1 = chunks[i][0] / sr, chunks[i][1] / sr
                else:                              # chunks do not match phrases: spread by position over all speech
                    s0, s1 = chunks[0][0] / sr, chunks[-1][1] / sr
                    f0_, f1_ = (i + f0_) / len(units), (i + f1_) / len(units)
                ca, cb = s0 + f0_ * (s1 - s0), s0 + f1_ * (s1 - s0)
                bumps.append(((ca + cb) / 2, (cb - ca) / 2 + 0.05, min(2.2, e["stress"] * strength)))
    rise = 2.5 if units and units[-1][1] == "?" else 0.0
    a = shape_line(a, sr, e, (pitch or 0) + rnd.uniform(-0.2, 0.2), bumps, rise)
    # cut the line at every punctuation boundary: at the voice's own silence if there is one, else at the quietest point nearby
    nat = split_chunks(a, sr) or [(0, len(a))]
    gaps = [(nat[q][1], nat[q + 1][0]) for q in range(len(nat) - 1)]
    sp0, sp1 = nat[0][0], nat[-1][1]
    tot_ch = sum(len(w.replace("*", "")) + 1 for w, _ in units)
    k5 = int(0.012 * sr)
    env = np.convolve(np.abs(a), np.ones(k5) / k5, mode="same")
    cuts, used, acc = [], set(), 0
    for bi in range(len(units) - 1):
        acc += len(units[bi][0].replace("*", "")) + 1
        te = sp0 + (acc / tot_ch) * (sp1 - sp0)
        best = min(((abs((g0 + g1) / 2 - te), gi) for gi, (g0, g1) in enumerate(gaps) if gi not in used), default=None)
        if best and best[0] < 0.28 * sr:
            used.add(best[1]); cuts.append(((gaps[best[1]][0], gaps[best[1]][1]), units[bi][1]))
        else:
            lo, hi = int(max(sp0, te - 0.12 * sr)), int(min(sp1, te + 0.12 * sr))
            m = lo + int(np.argmin(env[lo:hi])) if hi > lo else int(te)
            cuts.append(((m, m), units[bi][1]))
    cuts.sort(key=lambda c: c[0][0])
    out = []
    if len(units) >= 4 or emo in ("sad", "scared", "worried", "relieved"):
        out.append(breath(sr, level=0.03 if emo not in ("scared", "sad") else 0.05))
    start = sp0
    for (g0, g1), tok in cuts + [((sp1, sp1), None)]:
        seg = a[max(0, start - int(0.012 * sr)): min(len(a), g0 + int(0.02 * sr))].copy()
        f_in, f_out = int(0.006 * sr), int(0.01 * sr)
        if len(seg) > f_in + f_out:
            seg[:f_in] *= np.linspace(0, 1, f_in); seg[-f_out:] *= np.linspace(1, 0, f_out)
        out.append(seg)
        if tok is not None:
            out.append(np.zeros(int(PAUSE[tok] * e["pace"] * (1 + rnd.uniform(-0.12, 0.12)) * sr), dtype=np.float32))
        start = g1
    audio = apply_dsp(np.concatenate(out), sr, e)
    audio = char_shift(audio, sr, c["shift"])
    audio = resample_poly(audio, SR, sr).astype(np.float32)
    idx = np.where(np.abs(audio) > 0.01)[0]
    if len(idx):
        audio = audio[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.10 * SR)]
    g = 10 ** (((gain or 0) + e["gain"]) / 20)
    audio = audio / (np.abs(audio).max() + 1e-9) * 0.7 * g
    meta = {"char": char, "emo": emo, "text": text.replace("*", "").replace("—", "...").replace("–", "..."), "dur": round(len(audio) / SR, 3), "env": mouth_envelope(audio, SR), "f0_std_st": pitch_spread(audio, SR)}
    return audio, SR, meta


def pitch_spread(x, sr):
    """Standard deviation of pitch in semitones across the line (monotone ~1-2, lively 3-5)."""
    import pyworld as pw
    f0, _ = pw.harvest(x.astype(np.float64), sr, f0_floor=60, f0_ceil=500, frame_period=10.0)
    f = f0[f0 > 0]
    return round(float((12 * np.log2(f / np.median(f))).std()), 2) if len(f) > 5 else 0.0


# ----------------------------------------------------------------------------------------------
def build_voices_npz(src):
    need = sorted({n for c in CAST.values() for n in c["mix"]})
    d = np.load(src)
    np.savez_compressed(VOICES, **{n: d[n] for n in need})
    print("wrote", VOICES, os.path.getsize(VOICES) // 1024, "KB for", need)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("say")
    s.add_argument("--char", required=True, choices=list(CAST)); s.add_argument("--emo", default="neutral", choices=list(EMOTIONS))
    s.add_argument("--text", required=True); s.add_argument("-o", required=True)
    s.add_argument("--speed", type=float); s.add_argument("--pitch", type=float)
    b = sub.add_parser("batch"); b.add_argument("script"); b.add_argument("outdir")
    sub.add_parser("cast")
    t = sub.add_parser("trim-voices"); t.add_argument("src")
    a = ap.parse_args()
    if a.cmd == "cast":
        for k, v in CAST.items():
            print(f"{k:9s} {v['note']}   mix={v['mix']}")
        print("emotions:", ", ".join(EMOTIONS))
    elif a.cmd == "trim-voices":
        build_voices_npz(a.src)
    elif a.cmd == "say":
        y, sr, m = speak(a.char, a.text, a.emo, a.speed, a.pitch)
        os.makedirs(os.path.dirname(os.path.abspath(a.o)), exist_ok=True)
        sf.write(a.o, y, sr); json.dump(m, open(os.path.splitext(a.o)[0] + ".json", "w"))
        print(a.o, m["dur"], "s")
    elif a.cmd == "batch":
        sc = json.load(open(a.script)); os.makedirs(a.outdir, exist_ok=True); out = []
        for ln in sc["lines"]:
            y, sr, m = speak(ln["char"], ln["text"], ln.get("emo", "neutral"), ln.get("speed"), ln.get("pitch"), ln.get("gain"))
            sf.write(os.path.join(a.outdir, ln["id"] + ".wav"), y, sr)
            m["id"] = ln["id"]; out.append(m); print(ln["id"], m["dur"], "s")
        json.dump(out, open(os.path.join(a.outdir, "lines.json"), "w"))


if __name__ == "__main__":
    main()
