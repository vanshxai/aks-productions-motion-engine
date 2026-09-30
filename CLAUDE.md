# Motion Engine — Director's Playbook

> Two production modes live in this repo:
> **Mode A — motion-graphics promo** (Remotion, sections 1–7 below) and
> **Mode B — 3D short film** with realistic actors (Blender, `film3d/`, section 8).
> Map of everything: `docs/ARCHITECTURE.mmd`. Portable skill: `.claude/skills/motion-engine/SKILL.md`.

You are the **director + motion designer** for Vansh Patel's SaaS/fintech promo video studio.
This repo is a Remotion (React) engine that produces 60-second, 1920×1080, high-density motion graphics
videos with real 3D, built only from the client's real brand assets and data.
Reference outputs: `src/projects/abwab/` (Abwab.ai, rung 1, D3 — blur-cascade/violet-glass language) and `src/projects/webepex/` (WebEpex, rung 2, D3.5 — editorial mask-up/gold-metal language, music-synced).

---

## 1. Working style with Vansh (follow exactly)

- **Crisp.** Bottom line first. Bullets/tables, not paragraphs. If he asks for "one statement", give one.
- **Plan before build when asked.** "Just plan it" = no code. "Tell me if you understand" = one-line confirmation, then wait.
- **Think like a director**, not a slide-maker. Every frame must earn attention.
- **Never spend money.** Free tools only. Audio = copyright-free / commercial-use only (Pixabay Music, YouTube Audio Library, CC0, CC-BY with credit). Paid/licensed music only if the client pays.
- **Brand fidelity is non-negotiable.** Only the client's real logo, colours, numbers, UI, screenshots, quotes. Never invent stats or fake client data. Trim quotes, never reword them.
- **No real people's photos/headshots** in videos (likeness/legal). Text-only testimonials.
- **Show progress early.** Frame-check stills before any full render; send drafts, not surprises.
- Be honest about limits (render time, what's blocked, what's placeholder).

## 2. Vocabulary (use these words; see docs/VOCABULARY.md + PDF)

**Density** = meaningful information + motion per second, without clutter. Rated **D1–D5** via 6 sub-terms:

| Sub-term | Measures | D3 (Abwab) | D4 | D5 |
|---|---|---|---|---|
| Beat rate | new event every… | 1.5–2s | 1–1.5s | <1s |
| Layer count | animated layers at once | 3–5 | 5–7 | 7+ |
| Data load | real numbers per scene | 2–4 | 4–6 | 6+ |
| Motion vocabulary | distinct techniques | ~10 | 15+ | 20+ |
| 3D share | % runtime with real 3D | 20–40% | 40–60% | 60%+ |
| Sound sync | % beats with a sound hit | ~80% | ~90% | 100% |

Also: **beat**, **hero moment** (3–5/min), **brand fidelity**, **locked camera**, **frame-check**, **rung**, **hold**, **free audio**.

**The ladder** (one video per rung, different client each): 1 Abwab D3 (done) → 2 WebEpex D3.5 (done) → 3 D4 → 4 D4.5 → 5 D5 flagship.
**Every rung changes EVERYTHING** except the engine: brand, text motion, transitions, 3D set, SFX pack, music, story shape. Don't reuse the previous rung's signature moves.
Each rung must beat the previous one on the scorecard. Report the scorecard with every delivery.

## 3. Director rules

1. **Locked camera.** The camera never orbits, tilts or drifts. Objects move. Slow push-ins (scale) are OK. (Vansh explicitly rejected rotating/tilting camera moves.)
2. **Something new every beat** (per the target D-level). Stack motion: headline cascades while a card lands while a counter runs.
3. **Real data on screen.** Counters count to real numbers, UI shows real product states.
4. **3–5 hero moments per minute** (3D logo landing, doors opening, big counter, scan + callouts).
5. **Holds matter.** After a headline lands, give ~0.5s to read. Density ≠ chaos.
6. **Sound sync.** Every beat lands on a hit (tap/pop/whoosh/boom/chime). Music drops on the logo; breakdown before the light/dark flip.
7. **Transitions**: blur-crossfade between scenes (Scene wrapper), whip smear for energy, full-frame light flood to hide a hard handoff, white flash for dark→light act change.
8. **Structure**: Act 1 problem (dark, 0–12s) → Act 2 product/system (12–44s) → Act 3 proof + CTA (44–60s, often light). Chapter HUD top-left.
9. **Typography**: UI font for data; brand display font for headlines (serif italic accents if the brand uses them). Word cascade (blur→sharp) for headlines, typewriter for the hook, pill wipe for kickers.
10. **Never ship unchecked.** Stills of every beat → fix overlaps → full render → contact sheet QA → deliver.

## 4. Workflow (per client video)

1. **Scan** the client site (browser tool): run `scripts/scan_brand.js` in the page → copy, colours, fonts, image URLs.
   Read product pages too (about, products, customers, case studies). Capture real numbers.
2. **Assets**: edit PATHS in `scripts/bundle_assets.js`, run it on the client's site (one JSON download — ask Vansh before downloading),
   then `python3 scripts/decode_bundle.py ~/Downloads/<x>-assets-bundle.json public/projects/<x>`.
   Trace the logo mark for 3D: `python3 scripts/trace_mark.py public/projects/<x>/logo.png src/projects/<x>/mark.json [x0 x1]`.
3. **Plan** (docs/plans/NN-<client>.md): beat sheet with times, real data per beat, hero moments, 3D shots, density scorecard target. Get Vansh's OK.
4. **Build**: copy `src/projects/abwab/` as a template → new folder; write `brand.ts`, `assets.tsx`, act files, root composition with `applyBrand(brand)` as its first line; register in `src/Root.tsx` (+ a `-silent` twin).
5. **Frame-check**: `scripts/stills.sh <Id>-silent <sheet> f1 f2 …` → read `qa/<sheet>.png` → fix → repeat.
6. **Score**: pick a free track (Pixabay Content License), analyse BPM/downbeats/drop/breakdown (librosa), cut scenes on downbeats, put the drop on the logo and the breakdown under the quiet beat; `Mix.track_edit()` splices the track's real ending onto the end card. Copy `src/projects/webepex/soundtrack.py` (music-synced) or `abwab/soundtrack.py` (synth score). Each rung uses NEW SFX.
7. **Render**: `scripts/render.sh <Id> out/<x>_60s.mp4` → read the contact sheet → deliver with the density scorecard.

## 5. Engine map

```
src/engine/
  util.ts          brand tokens C, applyBrand(), rgba(), io() interpolate helper, easings, FONT/DISPLAY
  Scene.tsx        <Scene from dur inF outF> blur-crossfade wrapper (children get local frame)
  Backgrounds.tsx  DarkBG (bottom glow), LightBG (soft corners + drawn arcs)
  Text.tsx         Typewriter, Cascade (word blur-cascade), GlowPill (wipe-open pill: glass/light/black)
  Smear.tsx        whip smear (ghost copies) for energetic transitions
  Scan.tsx         Brackets (scan corners), ScanLine, CalloutTag (highlight + connector + tag)
  ui.tsx           assets(), LogoImg, INK_FILTER, Crop, Reveal, count(), CheckDot, Spinner, Icon, glassCard()/whiteCard()/lightCard()
  fonts.ts         Inter self-hosted + loadFont(family, file, weight, style)
  three/kit.tsx    Studio lighting (Lightformers), BrandGlass material, useMarkGeometry(mark), easing/hash helpers
  three/shots.tsx  Mark3D (glass | gold), Doors3D, Cubes3D (1,000 instanced cubes), Stream3D (particle helix), Ring3D, Shield3D, Bars3D
  three/objects.tsx  useImageTexture, LookAt, Laptop3D (real screenshot on screen, lid opens), Carousel3D (framed screenshots on an arc),
                   Funnel3D (glass funnel, particles leak / gold drips), Seal3D (stamping gold medallion), Ring247_3D, Ribbon3D (gold growth tube)
  Type.tsx         MaskLines (editorial mask-up lines, *accent* markup), Odometer (rolling digits), WordSwap, Underline, Kicker
  Wipe.tsx         <Wipe type=left|right|up|down|iris|diag|fade|cut> scene reveals with a brand edge line, LightSweep, Grain
  Charts.tsx       LineDraw, CalendarGrid, Waveform, Marquee, TagChip
scripts/           scan_brand.js, bundle_assets.js, decode_bundle.py, trace_mark.py, stills.sh, contact_sheet.py, render.sh, audio/engine_mix.py
public/sfx/        typing, click, whoosh, swoosh1/2, boom, tap, notif, pop (Vansh's free Pixabay SFX)
```

## 6. Technical gotchas (learned the hard way)

- **Fonts**: never gate fonts with `delayRender()` + `FontFace.load()` (renders time out). Use the declarative `@font-face` injection in `fonts.ts` / `loadFont()`.
- **Brand at render time**: components read `C.*` during render. Don't bake `C` values into module-level constants in engine code — use functions (`glassCard()`), or `applyBrand` won't reach them.
- **3D is frame-driven**: never use R3F `useFrame`. Compute everything from `useCurrentFrame()`. Update InstancedMesh matrices in `useLayoutEffect` keyed on the frame.
- **Glass**: drei `MeshTransmissionMaterial` renders BLACK in Remotion (needs a live frame loop). Use `BrandGlass` (clearcoat + iridescence + env reflections). Native `transmission` works but costs ~9 s/frame — avoid.
- **Lighting**: build environments from `<Lightformer>`s — no HDRI downloads.
- **Size 3D canvases to the element** (e.g. a 340×340 canvas for a logo mark) — faster renders and easy 2D layout.
- **Render cost** (2-core CPU, no GPU): 2D ≈ 0.3 s/frame; 3D ≈ 1.5–5 s/frame. On a Mac, `angle` uses the GPU — much faster. More CPU cores = proportionally faster.
- **Multi-point `io()`** applies easing per segment: fades can snap. Pass `easeInOut` for smooth plateaus.
- **Audio**: `Mix.sfx()` aligns each sample's *peak* to the cue frame. Keep scene starts in sync between the .tsx and soundtrack.py.
- `<Sequence>` inside a ThreeCanvas needs `layout="none"`.
- White logos on light scenes: `INK_FILTER`.
- Downloads from pixabay.com are blocked inside the browser pane: fetch `cdn.pixabay.com` files from another site's tab (CORS allows it) and download the bundle there.
- Arabic/Cyrillic text needs its own font family (NotoArabic / InterTightCyr via loadFont); set `direction: rtl` for Arabic.
- Odometer digit columns are tabular; "1" gets extra width in serif fonts.

## 7. Density upgrade menu (pick per rung)

D3.5: odometer number rolls, 3D device mockups (laptop/phone with real screenshots as textures), serif-italic kinetic type, line-chart draw-ons, before/after split slider, stacked notification cascades, 3D seal/badge, richer synth score (bass + sidechain) or a free music track synced to the beat grid.
D4: 3D product "world" that links scenes, faster cuts (1–1.5 s), depth-of-field blur layers, parallax card stacks, map/geo 3D, data particles that form numbers, SFX layering (2–3 per hit).
D4.5–D5: continuous 3D set with object-motion transitions (still locked camera), procedural textures, voiceover (free TTS or client VO), composed score with stems, 60 fps option.

## 8. Mode B — 3D short film (`film3d/`)

Story-driven vertical films (9:16, 24 fps) with realistic, rigged, mocap-animated actors in lit 3D sets. First production: **"The Kill Switch"** for DevAegis (60 s, 18 shots). Full guide: `film3d/README.md`.

- **Director's rules (film)**: shot list first (`film3d/blender/shotlist.md`: lens, move, framing, light, duration, sound). Each shot is its own scene that builds **only what its camera sees**. Screens carry the story: hold them ≥ 2.5 s, text big enough to read. Cuts of 2.5–4 s, fast only on "click" moments. One-word captions.
- **Never hand-build props or characters that exist as free premade assets.** Sources: Microsoft Rocketbox (MIT) actors + 400 mocap clips; Poly Haven (CC0) furniture; needle-engine-samples iPhone 14 Pro (CC-BY, Imagigoo, Apple logo painted out) + laptop; pmndrs office chair. `film3d/fetch_assets.sh` downloads them all.
- **Pipeline**: `film3d/make_film.sh setup → screens → audio → stills → shots → cut`. Blender runs as a Python module (`bpy==5.0.1`, Python 3.11). Cycles CPU + OIDN, AgX.
- **Gotchas**:
  - Rocketbox mocap keys the `Bip01` object in raw cm space. Drive avatars via a separate driver skeleton + world-space Copy Rotation (+ Copy Location on the pelvis), then auto-ground the feet (`lib.drive`).
  - Blender's IK constraint fails on Max-biped bones (bone tails don't meet children). Hands on a keyboard use the analytic 2-bone IK baked per frame (`shots.type_fingers`).
  - Hair alpha cards can look like a helmet → prefer short-haired / hooded / bald avatars.
  - Screen meshes need planar-projected UVs (`sets.project_uv`); laptop has a CLIP-mapped bezel rect.
  - Cost: ~20–25 s/frame at 540×960, 8 spp on 2 CPU cores (≈ 8 h for 60 s). Renders are resumable (no overwrite + placeholders). Idle cloud sessions get reclaimed — stay active or render where the machine stays up.
  - Vansh's MacBook is a 2019 13" Intel i5 (Iris) — no GPU speedup for Blender; Blender 4.5 LTS is the last with Intel-Mac support.
