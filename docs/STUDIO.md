# Kimu Studio — story engine

Series: **The Adventures of Kimu** · 1-minute episodes · 1080×1920 · 30 fps. First episode: S1E01 "The Bird on the Wire".

## The idea
Draw every object, character and set **once**. Every episode after that is a short script that moves existing pieces.
Nobody watches every frame: only a brand-new asset or move is checked (a short test clip); everything reused is trusted.

## Pipeline (one episode)
1. **Story packet** (`src/studio/sN/eNN/packet.json`) — written by a big chat AI (ChatGPT-style) after you paste it the asset list from `src/studio/manifest.json`.
   Timed shots, who is in each, dialogue, narration lines, music mood. It may only use asset names that exist in the manifest.
2. **Voices** — narration: Kokoro TTS (`scripts/audio/vo_assemble.py`). Character speech: cartoon "blah" (`mumble()` in `scripts/studio/audio_lib.py`) that also outputs a mouth envelope for lip flap.
3. **Audio** — `scripts/studio/build_sNeNN_audio.py` composes original music, sound effects and the final mix, ducking music under voices.
4. **Check without watching** — `python3 scripts/studio/validate_packet.py <packet.json>` (names exist, timings fit, nobody speaks off-shot).
5. **Render** — `npx remotion render src/index.ts Kimu-S1E01 out/Kimu_S1E01.mp4 --crf=16 --concurrency=2 --gl=angle` (about 9 minutes on 2 CPU cores).
6. **Approval** — Vansh watches the video. A new asset gets a one-off look at stills before the render.

## Three pillars
| Pillar | Where | Input | Output |
|---|---|---|---|
| Objects | `src/studio/props.tsx`, `info.tsx` | a vision-chat description of a photo/image, in a fixed template | a drawn prop in the Kimu style |
| Characters | `src/studio/Person.tsx` | a character brief | a `Spec` (colours, hair, outfit, build) on the shared rig |
| Worlds | `src/studio/sets.tsx` | a product / place brief | a set with named parts |

Missing pillars we added: **actions** (poses in `Person.tsx`), **sound** (`audio_lib.py`), **director/checker** (`S1E01.tsx` + `validate_packet.py`), **style** (this file + manifest).

## Rules
- All pictures are code (SVG in React), so a scene is data and any frame renders alone.
- Everything is a function of time `t`; no state between frames.
- Zero copyright risk: music and SFX are synthesised here or come from Kenney (MIT/CC0, `public/studio/audio/kenney`). See `docs/STUDIO_LICENSES.md`.
