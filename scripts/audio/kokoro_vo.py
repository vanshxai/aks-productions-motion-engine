"""Kokoro TTS voiceover (open-source, Apache-2.0 model; runs offline via kokoro-onnx).
usage: python3 scripts/audio/kokoro_vo.py <lines.json> <out_dir> [voice] [speed]
lines.json: {"id": "text", ...}. Writes <id>_t.wav (24 kHz, silence-trimmed) and prints durations.
Model files: KOKORO_DIR (default ~/models/kokoro) with kokoro-v1.0.onnx + voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0  (pip install kokoro-onnx soundfile)"""
import sys, os, json
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

lines = json.load(open(sys.argv[1])); out = sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "af_heart"; speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
d = os.environ.get("KOKORO_DIR", os.path.expanduser("~/models/kokoro"))
k = Kokoro(os.path.join(d, "kokoro-v1.0.onnx"), os.path.join(d, "voices-v1.0.bin"))
os.makedirs(out, exist_ok=True)
for key, text in lines.items():
    a, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    env = np.abs(a) > 0.01; idx = np.where(env)[0]
    a = a[max(0, idx[0] - int(.02 * sr)): idx[-1] + int(.08 * sr)]
    sf.write(os.path.join(out, f"{key}_t.wav"), a, sr)
    print(f"{key}\t{len(a) / sr:.2f}s\t{text}")
