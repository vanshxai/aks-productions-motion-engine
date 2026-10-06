# Production playbook (one video ≈ 35–40 min on a 2-core machine)

Stack: Remotion 4.0.290, react 18.3.1, typescript 5.5.4 (`npm install --no-package-lock`), Kokoro TTS (`kokoro-onnx`, files `kokoro-v1.0.onnx` + `voices-v1.0.bin`), ffmpeg, Python 3.

1. **Script**: write `src/projects/<name>/vo_script.json` (list of `{id,text,after}`), run `scripts/audio/vo_assemble.py` → `public/projects/<name>/vo.wav` + `vo.json` (phrase timings in frames).
2. **Scenes**: copy `src/projects/fridge/` (or `lock/`) → `scenes.tsx`, `<Name>30.tsx`. Time scenes to `vo.json`. Series kit: `src/projects/gearbox/kit.tsx`, `brand.ts`. Derive motion from real maths (e.g. truss solver, slider-crank, geometry file).
3. **Register** in `src/Root.tsx`: `<Name>-30s`, `<Name>-30s-silent`, `<Name>-cover` (1-frame still).
4. **Frame-check** before rendering: `node scripts/fast_stills.mjs <CompId> qa/tmp <scale> f1 f2 …` then `python3 scripts/contact_sheet.py qa/tmp qa/<name>.png <cols>`; fix overlaps, clipping, physics errors.
5. **Soundtrack**: copy a `soundtrack.py`; music + SFX + `vo.wav` with sidechain ducking; run `--stems`.
6. **Render** (Chrome download is blocked in the cloud; use the preinstalled headless shell):
   `REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell npx remotion render src/index.ts <Id> out/x.mp4 --crf=16 --concurrency=2 --gl=angle --browser-executable=$REMOTION_CHROME`
   (`--gl=angle` is ~4× faster than swangle). Run in background; never block one tool call > ~5 min.
7. **Mux**: `ffmpeg -i video.mp4 -i soundtrack.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out.mp4`
8. **QA**: contact sheet of the final file, read it, then commit on its own branch `howitworks-NN-<name>` and push.

## Gotchas learned
- Never gate fonts with `delayRender`. Don't bake brand values at module level.
- Ignition/heat/etc. must not appear before its cause (keep the cause and effect frames in sync across visuals and sound).
- A readout that can wrap must be `whiteSpace: nowrap`. Gauges must show physically correct values.
- Precompute simulations once (e.g. motor stall) and export constants.
