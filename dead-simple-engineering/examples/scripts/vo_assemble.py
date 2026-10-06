"""Paced voiceover: Kokoro TTS one phrase at a time, joined with punctuation pauses.

Kokoro reads a long line in one breath, so commas and full stops come out too short.
This splits every beat at punctuation, renders each phrase on its own, trims the edges,
and joins them with real pauses. The output timing JSON drives the animation.

usage:
  python3 scripts/audio/vo_assemble.py <script.json> <out_dir> [--voice af_heart] [--speed 1.05]

script.json:
  {"start": 0.25, "beats": [{"id": "hook", "text": "Why are bridges full of triangles?", "after": 0.7}, ...]}
  - "after" = extra silence after the beat (topic break). Defaults to PAUSE["beat"].
  - "at"    = optional absolute start time (s) for a beat; the timeline waits until then.

writes:
  <out_dir>/vo.wav     48 kHz mono, the whole voice track
  <out_dir>/vo.json    per beat + per phrase start/end (seconds and frames @30)
Model files: KOKORO_DIR (default /home/claude/tts) with kokoro-v1.0.onnx + voices-v1.0.bin.
"""
import json, os, re, sys
import numpy as np, soundfile as sf, librosa
from scipy.signal import resample_poly

PAUSE = {",": 0.26, ";": 0.32, ":": 0.36, "—": 0.30, ".": 0.55, "?": 0.6, "!": 0.55, "beat": 0.45}
FPS, SR_OUT = 30, 48000

def phrases(text):
    """Split into (phrase, trailing_punct). Keeps decimals like 3.5 together."""
    parts = re.findall(r".+?(?:[,;:—](?=\s)|[.?!](?=\s|$)|$)", text.strip())
    out = []
    for p in parts:
        p = p.strip()
        if not p: continue
        punct = p[-1] if p[-1] in PAUSE else ""
        out.append((p, punct))
    return out

def main():
    args = sys.argv[1:]
    script, out_dir = args[0], args[1]
    voice = args[args.index("--voice") + 1] if "--voice" in args else "af_heart"
    speed = float(args[args.index("--speed") + 1]) if "--speed" in args else 1.05
    from kokoro_onnx import Kokoro
    kd = os.environ.get("KOKORO_DIR", "/home/claude/tts")
    k = Kokoro(f"{kd}/kokoro-v1.0.onnx", f"{kd}/voices-v1.0.bin")
    spec = json.load(open(script))
    os.makedirs(out_dir, exist_ok=True)
    t = float(spec.get("start", 0.25))
    track, timing = [], []
    cursor = 0  # samples written
    def pad_to(sec):
        nonlocal cursor
        n = int(sec * SR_OUT) - cursor
        if n > 0: track.append(np.zeros(n)); cursor += n
    for beat in spec["beats"]:
        if "at" in beat: t = max(t, float(beat["at"]))
        b = {"id": beat["id"], "text": beat["text"], "phrases": []}
        ph = phrases(beat["text"])
        for i, (p, punct) in enumerate(ph):
            a, sr = k.create(p, voice=voice, speed=speed, lang="en-us")
            _, idx = librosa.effects.trim(a, top_db=38)
            pad = int(0.025 * sr); a = a[max(0, idx[0] - pad): idx[1] + pad]
            a = resample_poly(a, SR_OUT, sr)
            fade = int(0.008 * SR_OUT); a[:fade] *= np.linspace(0, 1, fade); a[-fade:] *= np.linspace(1, 0, fade)
            pad_to(t)
            track.append(a); cursor += len(a)
            dur = len(a) / SR_OUT
            b["phrases"].append({"text": p, "start": round(t, 3), "end": round(t + dur, 3), "f0": round(t * FPS), "f1": round((t + dur) * FPS)})
            t += dur
            last = i == len(ph) - 1
            t += PAUSE.get(punct, 0.12) if not last else 0
        t += float(beat.get("after", PAUSE["beat"]))
        b["start"], b["end"] = b["phrases"][0]["start"], b["phrases"][-1]["end"]
        b["f0"], b["f1"] = b["phrases"][0]["f0"], b["phrases"][-1]["f1"]
        timing.append(b)
    pad_to(t)
    y = np.concatenate(track); y = y / max(1e-9, np.abs(y).max()) * 0.9
    sf.write(f"{out_dir}/vo.wav", y, SR_OUT)
    json.dump({"fps": FPS, "total": round(t, 3), "beats": timing}, open(f"{out_dir}/vo.json", "w"), indent=1)
    for b in timing:
        print(f"{b['id']:>8} {b['start']:6.2f}-{b['end']:6.2f}  " + " | ".join(f"{p['f0']}:{p['text']}" for p in b["phrases"]))
    print("total", round(t, 2), "s")

if __name__ == "__main__":
    main()
