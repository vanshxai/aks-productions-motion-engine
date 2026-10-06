# 04 · The Simple Money — Reel #01 "Start at 22 vs 32" (compound interest) — v2 (global)

Format: 1080×1920, 30 fps, 30 s (900 f). Instagram Reel, global audience (USD, English names). Target density **D3**.
Brand: deep green bg, mint primary, gold coins, Inter / Inter Display.
Safe zone: key content between y 230–1480 (Reels UI covers top ~200 px, bottom ~420 px, right ~140 px).

## Real data (computed, not invented)
$200 invested every month, 10% a year assumed (10/12 % per month), contributions at month end, to age 52.
| | Starts | Invested | Value at 52 |
|---|---|---|---|
| Emma | 22 (30 yrs) | $72K | $452K ($452,098) |
| Jake | 32 (20 yrs) | $48K | $152K ($151,874) |
Emma at 32: $41K; at 42: $152K. Gap: puts in $24K more, ends $300K richer (≈3×). On-screen disclaimer: illustration, not advice.

## Audio
- **Voiceover:** Kokoro TTS (open-source, Apache-2.0) voice `af_heart`, speed 1.15 — `src/projects/simplemoney/vo_lines.json` → `scripts/audio/kokoro_vo.py`.
  Model files (kokoro-onnx, from GitHub releases): `~/models/kokoro/kokoro-v1.0.onnx` + `voices-v1.0.bin`; `pip install kokoro-onnx soundfile`.
- **Music:** "Abstract Fashion Pop (Rails)" — Qube Sounds, Pixabay Content License. 136 BPM. Edit: groove from 12.35 s → build (51.15 s) under the lesson → drop (55.06 s) on the logo.
- **Mix:** music ducks −72% and SFX −60% under the voice (`soundtrack.py --stems` prints levels).

## Beat sheet (timed to VO, cuts snapped to the 136 BPM grid)
| f | Scene | VO |
|---|---|---|
| 0–119 | Hook: "$24K more → $300K richer" | "Invest twenty-four grand more. End up three hundred grand richer." |
| 119–252 | Two friends: Emma 22 / Jake 32, plan chips | "Emma starts investing at twenty-two. Jake waits until thirty-two." |
| 252–503 | **Hero 1: race chart** (age 22→52) | "At thirty-two, Emma already has forty-one thousand." / "By forty-two? A hundred and fifty thousand." |
| 503–622 | Result odometers $452K vs $152K, "3× more" stamp | "At fifty-two? Four fifty-two, versus one fifty-two." |
| 622–728 | **Hero 2: 3D coins** (1 coin = $10K, 45 vs 15) | "Just twenty-four thousand more in. Three hundred thousand more out." |
| 728–845 | Lesson (music build) | "The secret isn't more money. It's more time." / "Start small. Start today." |
| 845–900 | **Hero 3: end card** on the drop | "Follow The Simple Money." |
