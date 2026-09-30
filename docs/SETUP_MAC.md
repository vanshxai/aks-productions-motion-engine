# Motion Engine

60-second, 1080p, high-density (D3+) SaaS promo videos with real 3D — built in Remotion from a client's real brand assets.
Read **CLAUDE.md** first (it is also what Claude Code loads automatically).

## Set up on the MacBook (one time)

1. **Node.js 20 LTS** — download the macOS installer from nodejs.org (or `brew install node@20`). Check: `node -v`
2. **ffmpeg** — `brew install ffmpeg` (used for contact sheets). No Homebrew? Install it from brew.sh first.
3. **Python packages** (audio mixer + logo tracer):
   `pip3 install numpy scipy pillow opencv-python-headless`
4. **Install the engine**:
   ```bash
   cd ~/Movies/motion-engine
   npm install
   ```
   The first render downloads Remotion's headless Chrome once (needs internet). After that, rendering is fully offline.
5. **Smoke test** (should look identical to the videos you already have):
   ```bash
   scripts/stills.sh Abwab-60s-silent smoke 150 470 905 1420 1770   # → qa/smoke.png
   scripts/stills.sh WebEpex-60s-silent smoke2 300 560 960 1500     # rung 2
   scripts/render.sh Abwab-60s out/abwab_60s.mp4                      # full render + qa contact sheet
   npx remotion studio                                                 # live preview in the browser
   ```

## Use it with Claude Code

```bash
npm install -g @anthropic-ai/claude-code
cd ~/Movies/motion-engine
claude
```
CLAUDE.md loads automatically (playbook, vocabulary, workflow, gotchas). Good first prompts:
- "Frame-check the Abwab project at frames 150, 470, 905 and show me the sheet."
- "Build video 2 from docs/plans/02-webepex.md. Follow CLAUDE.md. Frame-check every act before rendering."

Claude Code needs internet for the AI itself; the engine and renders run locally.

## Your Mac's specs (paste the output back to Claude)
```bash
sysctl -n machdep.cpu.brand_string; sysctl -n hw.ncpu; echo "$(( $(sysctl -n hw.memsize) / 1073741824 )) GB RAM"
system_profiler SPDisplaysDataType | grep -E "Chipset|VRAM|Metal"
```
More cores = faster renders. A GPU makes the 3D shots much faster (Remotion uses it through `angle`).

## Rendering on another PC (Linux/Windows, no GPU)
Same steps (Node, ffmpeg, Python, `npm install`). CPU-only works; speed scales with core count.
Run Claude Code on that PC directly — no SSH needed.

## Layout
- `src/engine/` reusable components (2D + 3D) — brand-driven via `applyBrand()`
- `src/projects/<client>/` one folder per video (brand.ts, assets.tsx, act files, soundtrack.py)
- `public/projects/<client>/` that client's assets + rendered soundtrack
- `public/sfx/` free SFX pack · `public/fonts/` self-hosted fonts
- `scripts/` scan → bundle → decode → trace → stills → render
- `docs/` vocabulary (md + PDF), new-project checklist, per-video plans
