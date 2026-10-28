# Kimu Voice Engine (offline text -> character voice)

**What it is.** One Python file, `scripts/studio/kimu_voice.py`. You give it a character, an emotion and English text; it gives back a 48 kHz wav plus a lip-sync envelope (JSON). Nothing leaves your machine, nothing costs money.

**Why this model.** Kokoro-82M (Apache-2.0). It is the best quality-per-megabyte open voice model we found: 82 million parameters, **92 MB** as an int8 ONNX file, runs on a plain CPU (about 1-2 s of compute per second of speech on 2 cores, much faster on a laptop). Smaller models (Piper "low", ~15-20 MB) are noticeably more robotic; bigger ones (XTTS, F5, 400 MB+) need a GPU.

## Use
```bash
scripts/studio/fetch_voice_model.sh          # once: downloads the 92 MB model
python3 scripts/studio/kimu_voice.py cast    # list characters + emotions
python3 scripts/studio/kimu_voice.py say --char dad --emo angry --text "Study first. Then a job." -o out/dad.wav
python3 scripts/studio/kimu_voice.py batch src/studio/s1e01/script.json public/studio/s1e01/voice
```
```python
from kimu_voice import speak
audio, sr, meta = speak("kimu", "I know, Dad. Sorry.", "sad")   # meta["env"] = [[t, mouth_open], ...] at 30 fps
```

## Characters (voice = blend of Kokoro voices, so each one is unique)
| id | blend | pitch | note |
|---|---|---|---|
| kimu | am_liam 60% + am_adam 40% | 0 | young, warm, a little unsure |
| dad | am_michael 50% + bm_george 50% | -1.5 st | deep, tired, stern but loving |
| mom | af_heart 60% + af_nicole 40% | 0 | gentle, modern |
| uncle | bm_lewis 60% + am_michael 40% | -0.5 st | friendly neighbour |
| narrator | am_liam 50% + bm_daniel 50% | -0.5 st | Kimu's inner voice (close, soft room) |

New character = add one entry to `CAST` (any blend of the 8 voices in `voices.npz`, or run `trim-voices` with the full `voices-v1.0.bin` after adding names).

## Emotions
neutral, calm, warm, sad, worried, scared, annoyed, angry, shout, joy, relieved, whisper, inner. Each is speed + pitch + loudness + light DSP (tremble, breath, drive, soft low-pass, inner-voice room). Punctuation also steers delivery: "..." slows and softens, "!" pushes.

## Files
- `models/kimu_voice/voices.npz` (3.7 MB, committed) - the 8 style vectors we use.
- `models/kimu_voice/kokoro-v1.0.int8.onnx` (92 MB, **not** committed) - fetched by the script.
- Lip-sync: the mouth envelope comes from the audio itself, so lips follow real syllables.

## Honest limits
Voices are good, not human-actor level: strong emotions (crying, shouting) are suggested by pitch/speed/DSP, not acted. Audio was verified numerically (pitch per character, loudness, no clipping, line timings) but has not been judged by ear.
