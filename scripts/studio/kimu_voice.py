#!/usr/bin/env python3
"""Kimu Voice Engine: text in, character voice out. Fully offline.

Model : Kokoro-82M, int8 ONNX (92 MB, Apache-2.0), run on CPU with onnxruntime. No network, no cost.
Voices: Kokoro style vectors, blended per character (see CAST). Trimmed to models/kimu_voice/voices.npz.
Emotion: text shaping (pauses, emphasis) + speed + pitch + loudness + light DSP (see EMOTIONS).
Output: 48 kHz mono wav + a JSON sidecar with duration and a 30 fps mouth envelope for lip-sync.

CLI
  python3 scripts/studio/kimu_voice.py say --char dad --emo angry --text "Study first." -o out/dad.wav
  python3 scripts/studio/kimu_voice.py batch src/studio/s1e01/script.json public/studio/s1e01/voice
  python3 scripts/studio/kimu_voice.py cast          # list characters and emotions
Python
  from kimu_voice import speak;  audio, sr, meta = speak("kimu", "I know, Dad.", "sad")
"""
import argparse, json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MODEL = os.path.join(ROOT, "models", "kimu_voice", "kokoro-v1.0.int8.onnx")
VOICES = os.path.join(ROOT, "models", "kimu_voice", "voices.npz")
SR = 48000

# character -> blend of Kokoro voices (weights sum to 1), base speed, pitch shift in semitones
CAST = {
    "kimu":     {"mix": {"am_liam": 0.6, "am_adam": 0.4}, "speed": 1.0, "pitch": 0.0, "note": "young adult, warm, a little unsure"},
    "dad":      {"mix": {"am_michael": 0.5, "bm_george": 0.5}, "speed": 0.95, "pitch": -1.5, "note": "middle-aged father, deep, tired, loving but stern"},
    "mom":      {"mix": {"af_heart": 0.6, "af_nicole": 0.4}, "speed": 0.97, "pitch": 0.0, "note": "gentle, warm, modern metro mother"},
    "uncle":    {"mix": {"bm_lewis": 0.6, "am_michael": 0.4}, "speed": 0.98, "pitch": -0.5, "note": "friendly neighbour, relieved and cheerful"},
    "narrator": {"mix": {"am_liam": 0.5, "bm_daniel": 0.5}, "speed": 0.98, "pitch": -0.5, "note": "Kimu's inner voice, calm and close"},
}

# emotion -> speed multiplier, pitch (semitones), gain (dB), text mode, dsp flags
EMOTIONS = {
    "neutral": dict(speed=1.00, pitch=0.0, gain=0.0),
    "calm":    dict(speed=0.94, pitch=-0.3, gain=-1.5),
    "warm":    dict(speed=0.96, pitch=0.3, gain=0.0),
    "sad":     dict(speed=0.86, pitch=-0.9, gain=-3.0, soften=True),
    "worried": dict(speed=1.06, pitch=0.6, gain=-1.0, tremble=0.25),
    "scared":  dict(speed=1.12, pitch=1.3, gain=-0.5, tremble=0.5, breathy=True),
    "annoyed": dict(speed=1.04, pitch=-0.6, gain=0.5),
    "angry":   dict(speed=1.07, pitch=-0.8, gain=2.5, drive=0.35),
    "shout":   dict(speed=1.10, pitch=0.2, gain=4.0, drive=0.6),
    "joy":     dict(speed=1.07, pitch=0.9, gain=1.0),
    "relieved": dict(speed=0.98, pitch=0.5, gain=0.0, breathy=True),
    "whisper": dict(speed=0.92, pitch=0.0, gain=-5.0, breathy=True),
    "inner":   dict(speed=0.96, pitch=-0.4, gain=-1.0, inner=True),
}


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
    mix = CAST[char]["mix"]
    v = sum(w * d[name] for name, w in mix.items())
    return v.astype(np.float32)


def shape_text(text, emo):
    """Light prosody hints Kokoro responds to: punctuation, ellipses, commas."""
    t = text.strip()
    if emo in ("sad", "worried", "scared", "whisper", "inner"):
        t = t.replace(". ", "... ").replace(", ", ", ")
    if emo in ("angry", "shout", "annoyed"):
        t = t.replace(". ", "! ") if emo != "annoyed" else t
    return t


def pitch_shift(x, sr, semis):
    if abs(semis) < 0.05:
        return x
    import subprocess, tempfile
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
        sf.write(a, x.astype(np.float32), sr)
        r = 2 ** (semis / 12)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a, "-af", f"rubberband=pitch={r:.5f}:formant=preserved:pitchq=quality", b], check=True)
        y, _ = sf.read(b)
        return y.astype(np.float32)


def apply_dsp(x, sr, e):
    if e.get("tremble"):
        n = len(x)
        t = np.arange(n) / sr
        x = x * (1 + e["tremble"] * 0.12 * np.sin(2 * np.pi * 6.0 * t)).astype(np.float32)
    if e.get("breathy"):
        rng = np.random.default_rng(3)
        noise = rng.standard_normal(len(x)).astype(np.float32)
        sos = butter(2, [2500 / (sr / 2), 7500 / (sr / 2)], btype="band", output="sos")
        env = np.abs(x)
        env = np.convolve(env, np.ones(int(0.02 * sr)) / int(0.02 * sr), mode="same")
        x = x + 0.35 * sosfilt(sos, noise) * env
    if e.get("drive"):
        d = 1 + 4 * e["drive"]
        x = np.tanh(x * d) / np.tanh(d) * 0.9
    if e.get("soften"):
        sos = butter(2, 5200 / (sr / 2), btype="low", output="sos")
        x = sosfilt(sos, x)
    if e.get("inner"):
        sos = butter(2, [140 / (sr / 2), 6500 / (sr / 2)], btype="band", output="sos")
        x = sosfilt(sos, x)
        ir_n = int(0.9 * sr)
        rng = np.random.default_rng(7)
        ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / (0.22 * sr))
        ir[:int(0.012 * sr)] = 0
        from scipy.signal import fftconvolve
        wet = fftconvolve(x, ir)[: len(x) + ir_n] * 0.04
        x = np.concatenate([x, np.zeros(ir_n)])
        wet = np.pad(wet, (0, max(0, len(x) - len(wet))))[: len(x)]
        x = x + wet
    return x.astype(np.float32)


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
    c = CAST[char]
    e = dict(EMOTIONS[emo])
    spd = (speed or 1.0) * c["speed"] * e["speed"]
    st = c["pitch"] + e["pitch"] + (pitch or 0)
    k = _model()
    audio, sr = k.create(shape_text(text, emo), voice=voice_vector(char), speed=float(np.clip(spd, 0.6, 1.5)), lang="en-us")
    audio = audio.astype(np.float32)
    audio = pitch_shift(audio, sr, st)
    audio = apply_dsp(audio, sr, e)
    audio = resample_poly(audio, SR, sr).astype(np.float32)
    # trim leading/trailing silence, keep a small tail
    idx = np.where(np.abs(audio) > 0.01)[0]
    if len(idx):
        audio = audio[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.12 * SR)]
    g = 10 ** (((gain or 0) + e["gain"]) / 20)
    audio = audio / (np.abs(audio).max() + 1e-9) * 0.7 * g
    meta = {"char": char, "emo": emo, "text": text, "dur": round(len(audio) / SR, 3), "env": mouth_envelope(audio, SR)}
    return audio, SR, meta


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
