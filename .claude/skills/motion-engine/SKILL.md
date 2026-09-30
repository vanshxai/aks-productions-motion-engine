---
name: "motion-engine"
description: "Use when Vansh asks to plan, build, frame-check or render a promo video — Remotion motion graphics (density D1–D5, rungs) or a 3D Blender short film — on any device or cloud session."
---

# Motion Engine (Vansh's video studio: AKS Productions)

This skill works on any device or session. The engine's source of truth is the private GitHub repo **`vanshxai/aks-productions-motion-engine`**.

## 0. Find the engine (in this order)
1. **Current folder**: if it has `CLAUDE.md` + `package.json` named `motion-engine`, you are in it. Read `CLAUDE.md` (the full playbook), `AGENTS.md` and `docs/ARCHITECTURE.mmd`.
2. **GitHub**: attach `vanshxai/aks-productions-motion-engine` (add_repo, push access if you will commit) and `git clone --depth 1` it. After `npm install`, you have the full engine.
3. **Linked computer**: the MacBook copy lives at `~/Movies/motion-engine`. It may be ahead of GitHub, so ask before overwriting either copy.
4. **Nothing reachable**: work from this summary (plans, beat sheets, shot lists, reviews), and say so plainly.

Pinned stack (exact versions; mismatches break 3D):
`remotion@4.0.290 @remotion/cli@4.0.290 @remotion/three@4.0.290 three@0.169.0 @react-three/fiber@8.17.10 @react-three/drei@9.114.0 react@18.3.1 typescript@5.5.4`. Use `npm install --no-package-lock` when the lockfile is out of sync. For film3d, Blender is `pip install bpy==5.0.1` on Python 3.11.

## Working style with Vansh
- Crisp. Bottom line first. Bullets or tables. "One statement" means one sentence.
- "Just plan it" means no building. "Tell me if you understand" means a short confirmation, then wait.
- Think like a director. Never spend money: free tools, and copyright-free, commercial-use audio only.
- Brand fidelity: only the client's real logo, colours, numbers, UI and quotes. Never invent stats. No real people's photos without consent.
- Frame-check stills before any full render. Deliver with a density scorecard. Say what is a recreation.
- Give render ETAs up front. When something blocks (network, compute), say so and offer the next-best path.

## Vocabulary
**Density** D1–D5 is scored on six sub-terms: beat rate, layer count, data load, motion vocabulary, 3D share and sound sync. D3 means a new event every 1.5–2 s, 3–5 layers, 2–4 real numbers per scene, about 10 techniques, 20–40% 3D and about 80% sound sync.

Other terms: beat, hero moment (3–5/min), brand fidelity, locked camera, frame-check, rung, hold, free audio.

**Ladder**: Abwab D3 (done) → WebEpex D3.5 (done) → D4 → D4.5 → D5 flagship. Every rung changes everything except the engine.

## Mode A: motion-graphics promo (Remotion)
- Locked camera; push-ins are OK. Something new every beat. Real data. 3–5 hero moments per minute. Holds after headlines. Every beat lands on a sound hit; the music drops on the logo. Structure: Act 1 problem → Act 2 product → Act 3 proof + CTA.
- Workflow: scan the brand (`scripts/scan_brand.js`) → bundle and decode assets → plan in `docs/plans/NN-<client>.md` and get approval → build from the `src/projects/abwab` template with `applyBrand(brand)` → `scripts/stills.sh` frame-check → soundtrack.py → `scripts/render.sh` → contact-sheet QA.
- Gotchas:
  - Declarative @font-face only.
  - 3D driven by `useCurrentFrame` (no `useFrame`).
  - `MeshTransmissionMaterial` renders black, so use BrandGlass.
  - Lightformers, not HDRIs.
  - R3F clamps dpr to at least 1, so pass a dpr prop for drafts.

## Mode B: 3D short film (`film3d/`)
- Direct it like a film. Write the shot list first (lens, move, framing, light, duration, sound). Each shot is its own scene that builds only what its camera sees. Render shots separately, check them, then cut.
- Never hand-build what exists as a free premade. `film3d/fetch_assets.sh` pulls in:
  - Rocketbox actors and mocap (MIT)
  - Poly Haven furniture (CC0)
  - an iPhone 14 Pro (CC-BY, Imagigoo; logo painted out)
  - a laptop
  - an office chair (CC0)
- Pipeline: `film3d/make_film.sh setup | screens | audio | stills | shots | cut`.
  - Screens are Remotion 2D image sequences mapped onto the laptop and phone.
  - Actors are driven by mocap with world-space copy-rotation.
  - Typing hands use a baked analytic 2-bone IK.
  - Faces use ARKit shape keys.
- Cost: about 20–25 s per frame at 540×960, 8 spp on 2 CPU cores (about 8 h for 60 s). Renders are resumable. Idle cloud sessions get reclaimed, so stay active. A linked computer's sandbox shell kills processes after about 3 minutes.
- Vansh's MacBook is a 2019 Intel i5 with no Blender GPU speedup; Blender 4.5 LTS is the last version for Intel Macs.
