# Kimu Studio — licences (all free for commercial use)

| Asset | Source | Licence |
|---|---|---|
| Music cues (sad, tender, prayer, curious, uplifting) | Composed and synthesised from scratch in `scripts/studio/audio_lib.py` / `build_s1e01_audio.py` | Original, no third party |
| Sound effects: hum, thunk, creak, chirps, pops, buzz, spark, whoosh, rip, clink, crickets, wind | Synthesised from scratch (same files) | Original |
| Character voices (Kimu, dad, mom, uncle) and inner narrator | Kimu Voice Engine: Kokoro-82M int8 ONNX, blended voices (`scripts/studio/kimu_voice.py`). Pitch shift via ffmpeg/rubberband at build time only | Apache-2.0 (model), MIT (library); generated audio is ours |
| Instruments (felt piano, flute, nylon guitar, cello, pads, upright bass, brush/conga) and natural SFX (heartbeat, desk thud, relay, tube light, room tone) | Synthesised from scratch in `scripts/studio/audio_lib.py` | Original |
| Footsteps, switch click, coin, desk thud (`walking`, `toggle`, `coin`, `placement-a/c`) | Kenney Starter Kits, github.com/KenneyNL (Starter-Kit-3D-Platformer, Starter-Kit-City-Builder) — `public/studio/audio/kenney` | MIT licence (file `LICENSE-Kenney-MIT.md`) |
| Fonts: Fredoka, Nunito | `@fontsource` packages | SIL Open Font License 1.1 |
| All artwork (characters, sets, props, infographics) | Drawn in code in this repo | Original |

Note: `public/sfx/*` (older Pixabay clips from earlier videos) are NOT used in Kimu episodes.
