# Dead Simple Engineering — subsidiary of AKS Productions

Instagram: **@dead.simple.engineering** · Owner: Vansh Patel · Produced with Claude + the Remotion engine in this repo.

**One line:** 30-second, 2D-only animated explainers that make an engineering idea "dead simple" for any engineer or curious viewer. Series name: **How It Works**.

**Read this folder first if you are a generator/agent asked to make a video in this style for ANY subject.** The engineering topics are interchangeable; the format, look, voice, pacing and CTA are the brand.

## What a video is
| Item | Rule |
|---|---|
| Length / size | 30 s, 1080×1920 (9:16), 30 fps, 900 frames |
| Style | 2D animation and motion graphics only. **No 3D.** Locked camera, one continuous shot, no stock footage, no real people |
| Look | Blueprint: deep navy `#06142A`, cyan lines `#5CD3FF`, amber `#FFB547`, red/green for state, JetBrains Mono for labels, serif-italic accent words in headlines |
| Hook | Frame 0 is already a finished, readable image with a bold claim ("Fridges don't make cold", "Your key is a code"). No slow intro |
| Structure | Hook claim → the one key idea → 3–5 mechanism steps (each drawn to real geometry/physics) → hero moment → one-word recap → end card |
| Voice | Generated, female Kokoro `af_heart`, ~1.1× speed, **with real punctuation pauses** (comma 0.26 s, full stop 0.55 s) via `vo_assemble.py`. Short sentences, plain words, ~75 words per video |
| Sound | Soft music bed + synthesized SFX on every beat, sidechain-ducked under the voice; every phrase must stay clearly above the bed |
| Truth | Animations come from real physics/geometry (solvers, kinematics), never decorative fakes. Never invent stats |
| End card (current) | "Follow for *more*"; amber tag "FOLLOW +"; AKS PRODUCTIONS; "HOW IT WORKS · @DEAD.SIMPLE.ENGINEERING"; VO "Follow for more, and see how everything works." (#1–8 ended with "comment which machine next"; #9 and #10 were first made with the comment-for-PDF CTA, then redone with Follow. The PDF CTA is the planned future version once the PDF and automation exist.) |

## Examples in this folder
- `examples/videos/` — 4 reference videos (540p copies): #1 Gearbox, #5 4-stroke engine, #8 Refrigerator, #9 Lock and key.
- `examples/covers/` — covers of #5–#9 (the cover is a 1-frame still of the hook).
- `examples/scripts/` — voiceover scripts (JSON), the phrase-paced voice assembler, and one full scene file (lock) as a code example.
- Full source of every video is in `src/projects/<name>/` on the `howitworks-NN-*` branches.

## Docs
- `STYLE_GUIDE.md` — visual, motion, copy and audio rules in detail.
- `PRODUCTION_PLAYBOOK.md` — the exact pipeline, commands and gotchas to produce one video.
- `SERIES_PLAN_FIRST_50.md` — topic plan and status for the first 50 videos.
- `FUNNEL.md` — comment-to-PDF funnel and lead-magnet strategy.
- `INSIGHTS.md` — running log of the owner's decisions and feedback.
