import json, sys
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = m.transcribe(src, word_timestamps=True, vad_filter=False, beam_size=5)
res = {"language": info.language, "prob": info.language_probability, "segments": []}
for s in segs:
    res["segments"].append({"start": s.start, "end": s.end, "text": s.text.strip(),
        "words": [{"w": w.word.strip(), "s": w.start, "e": w.end} for w in s.words]})
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
print(res["language"], res["prob"])
for s in res["segments"]: print(f'{s["start"]:.2f}-{s["end"]:.2f} {s["text"]}')
