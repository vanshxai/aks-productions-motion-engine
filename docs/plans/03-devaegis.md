# Video 3: DevAegis (rung 3, target D4)

**Client:** DevAegis (devaegis.com). Code protection and invoicing in one system for freelance developers: encrypted builds, domain lock, a kill switch, and access tied to the invoice.
**Format:** 60 s, 1920×1080, 30 fps, locked camera, free audio only. A 9:16 cut-down (1080×1920) is re-framed from the same scenes.
**Style rule:** 3D is built in code only (Remotion + three.js). No characters, no Blender; the story is told through objects.
**Promise to beat:** WebEpex (D3.5). Every sub-term goes up, and every signature move is new.

## Brand (from the 2026-09-30 scan; re-verify before build)
- Colours: bg `#080402`, surface `#0a0503`, card `#0e0906`, line `#2a1d14`, amber `#f5a93c` / deep `#ee8517` / hi `#ffcb80`, sand `#ffe7c4`, ink `#f4e9de` / `#c9b49f` / `#95836f`, live green `#7fd69b`.
  - H1 gradients `#fff0dc→#f9b569` and `#ffe7c4→#f59b36`.
  - CTA gradient `#ffcb80→#ee8517` with text `#2e1502`.
- Type: **Plus Jakarta Sans** 500–800 (UI and headlines) + **Instrument Serif italic** (the "✦DevAegis" logo and the accent word "*money*"). Both are free (OFL).
- Tone: dev-to-dev, protective, a little defiant. "Your code is money. Ship it protected."
- Assets we have:
  - real dashboard screenshots (dark and light, 2880×1800)
  - the ✦ mark and wordmark (Instrument Serif), rebuilt as text; trace the ✦ for 3D
- To grab in the re-scan: favicon/logo files, product-page screenshots, pricing page and any published numbers.

## Real data to use (all on devaegis.com or its dashboard)

| Source | What |
|---|---|
| Headline | "Your code is *money*. Ship it protected." |
| Pill | "Code protection + invoicing, in one system" |
| Sub | "DevAegis encrypts every build, locks it to one domain, and ties access to the invoice." |
| Features | AES-256 encryption · domain lock · kill switch |
| Scenario line (from the site) | "We'll pay next week." |
| CLI | `npm i -g devaegis` → `devaegis setup` → `devaegis secure <project-id>` → `devaegis export` → `dist-secured/` |
| Dashboard (real screenshot values) | $12,501.00 earnings figure, a "Northwind Portal … Suspended" activity row, INV-0042 |
| Client screen | "Service suspended. Contact your developer." |
| CTA | "Get started for free" · devaegis.com |

**Gap for D4:** D4 wants 4–6 real numbers per scene, and the site shows few stats.
- Re-scan pricing, docs and changelog for real figures such as plan prices, free-tier limits, supported frameworks and export sizes.
- If there are none, carry the data load with real product states (statuses, file names, commands, invoice fields) instead of invented stats.
- Never invent numbers. "$1,850" from the film draft must be confirmed as dashboard demo data or dropped.

## Visual language (new for rung 3; none of rung 1 or 2's moves)
- **World:** a single dark **"vault forge"**. Obsidian glass and brushed dark-steel objects lit by molten-amber light, with ember particles drifting. One continuous 3D set whose objects transition into each other, with a locked camera. This is the D4 "3D product world" item.
- **Text motion:** **decrypt-scramble.** Headlines resolve from random glyphs into the real copy, and amber-underlined keywords lock with a "clack". Rung 1 used a blur cascade and rung 2 a mask-up; neither is reused.
- **Transitions:**
  - vault-shutter iris (6 steel blades close and open)
  - glitch-slice cut (only on the "suspended" beat)
  - amber light flood
  - ember burst
- **3D objects (all built in code):**
  1. code cube (a glass cube with scrolling code on its faces)
  2. invoice card (thick glass card, embossed amber)
  3. AES shell (hex-lattice cage that snaps shut around the cube)
  4. domain lock (padlock with the URL engraved)
  5. **kill-switch lever** (industrial toggle with a hazard-amber base)
  6. client portal (floating browser slab)
  7. gold coin stack
  8. ✦ mark in molten amber glass
  9. particle "data stream" with lock icons
- **Screens:** the real dashboard screenshot on a floating glass slab, and a terminal typing the real CLI.

## Beat sheet (frames @30 fps)

| Time | Beat | Technique / 3D | Data |
|---|---|---|---|
| **ACT 1: THE GHOST (0–13 s, near-black, cold)** | | | |
| 0.0–2.0 | Terminal cursor blinks. Scramble-decode types "Final build shipped." Tiny send whoosh. | terminal type, scramble | `northwind-portal.zip` |
| 2.0–4.5 | **Code cube** (glass, glowing code) flies out of frame to the right toward a floating **client portal** slab that lights up "Live". | 3D cube + portal slab (hero #1 setup) | status: Live |
| 4.5–7.0 | **Invoice card** lands, then its status flips *Sent → Viewed → Overdue* in amber; a day counter rolls. | glass card, status flips, odometer | INV-0042, Overdue |
| 7.0–9.5 | Chat bubble pops: "We'll pay next week." It hangs, then "Seen" appears. Cold blue tint, heartbeat thud. | bubble, read receipt, colour grade shift | real scenario line |
| 9.5–13.0 | Decrypt headline: "They have your code. *You* have nothing." The cube on the portal glows; your invoice card fades to grey. | scramble headline, fade | — |
| **ACT 2: SHIP IT PROTECTED (13–44 s, amber forge wakes up)** | | | |
| 13.0–15.0 | **Vault-shutter iris** opens on amber light. The ✦ mark ignites in molten glass. "DevAegis" in Instrument Serif. | iris transition, ✦ Mark3D molten (hero #2) | — |
| 15.0–17.5 | Pill decodes: "Code protection + invoicing, in one system." Two objects slide together: the code cube and the invoice card link with an amber chain. | pill scramble, 3D link | — |
| 17.5–22.5 | **Terminal slab**: the real CLI types line by line. Each command lands with a key clack, and a progress bar forges an **AES-256 hex shell** around the cube (plates snap shut one by one). | terminal + 3D hex cage assembly | `npm i -g devaegis` … `dist-secured/` |
| 22.5–26.0 | Callout 1, **AES-256**: a scan line passes over the shell and bytes scramble into ciphertext particles. | ScanLine + particles, callout | AES-256 |
| 26.0–29.5 | Callout 2, **Domain lock**: a padlock engraved with `portal.northwind.io` clamps onto the cube; a second domain tries to load it and gets a red ✕ bounce. | padlock 3D, rejection bounce | domain lock |
| 29.5–33.0 | Callout 3, **Tied to the invoice**: the chain from the cube to the invoice card glows. Invoice fields fill in (client, amount, due date) with a status pill. | chain glow, form fill | INV-0042 fields |
| 33.0–37.0 | **Dashboard slab**: the real dashboard screenshot tilts in on glass (locked camera, the object moves) and a highlight ring finds the project row. | image slab 3D, highlight ring | $12,501.00, Northwind Portal row |
| 37.0–41.0 | **Kill-switch lever** rises from the floor in a hazard-amber pool of light. Chapter HUD: "03 · Kill switch". Hold on the lever: "Pause the build. One click." | lever 3D reveal (hero #3 setup) | — |
| 41.0–44.0 | "We'll pay next week." comes back. **The lever slams down**, with an amber shockwave and a sub-drop. | lever throw, shockwave, sub-drop (**hero #3**) | — |
| **ACT 3: THE PAYOFF (44–60 s, amber → gold)** | | | |
| 44.0–47.0 | **Glitch-slice cut**: the client portal slab fractures and goes dark. It shows "Service suspended. Contact your developer." with a lock icon. | glitch slice, slab fracture (hero #4) | status: Suspended |
| 47.0–50.0 | Notification cascade on the phone slab: "Payment received · INV-0042". The invoice pill flips *Overdue → Paid* in green, and **gold coins** drop onto the card. | notification stack, pill flip, coin physics | INV-0042 Paid (amount only if verified) |
| 50.0–52.5 | Lever flips back up and the portal slab relights "Live" in green. "One click to restore." | reverse lever, relight | status: Live |
| 52.5–56.0 | Headline decodes: "Your code is *money*." then "Ship it protected." in H1 gradients. Embers rise. | scramble → serif accent, ember field | real headline |
| 56.0–60.0 | End card: the molten ✦ mark and wordmark, CTA pill "Get started for free" (clicked), devaegis.com. The music resolves on the logo. | Mark3D final, CTA click (**hero #5**) | real CTA |

**Hero moments (5):** cube ships to the client · ✦ molten ignition · lever slam · portal fracture to "Suspended" · end mark and CTA.

## 3D shots and render plan
- One `ThreeCanvas` per shot, sized to the element, lit with Lightformers only.
- Materials: BrandGlass (obsidian/amber variant), brushed steel, molten emissive gradient.
- Every object is procedural (box, hex-lattice instanced mesh, lathe padlock, extruded lever, instanced coins, traced ✦ mark). Nothing is downloaded and nothing is modelled by hand in Blender.
- Estimated cost: about 60% of frames are 3D at 1.5–5 s/frame, plus 2D at about 0.3 s/frame. The full 60 s renders in about **1.5–2 h** on the 2-core cloud box, and faster on the Mac with `angle`.

## Density scorecard (target vs WebEpex)

| Sub-term | WebEpex (D3.5) | DevAegis target (D4) |
|---|---|---|
| Beat rate | 1.2–1.5 s | 1.0–1.5 s |
| Layer count | 4–6 | 5–7 (object + slab + HUD + particles + callout + type) |
| Data load | 3–5 | 4–6 real facts per scene (commands, statuses, invoice fields, dashboard values). Numbers only if verified on the site. |
| Motion vocabulary | ~15 | ~20. New: decrypt-scramble type, vault-shutter iris, glitch-slice cut, hex-shell assembly, padlock clamp + rejection bounce, chain link glow, lever throw + shockwave, slab fracture, coin drop, ember field, status-pill flips, image-slab tilt |
| 3D share | ~45% | ~60% (one continuous forge world) |
| Sound sync | ~90% | ~95% with 2–3 SFX layers per hero hit |

## Audio (free only; all new for this rung)
- **Music:** Vansh picks 2–3 free commercial-use tracks from Pixabay Music: dark hybrid trailer or techno, 120–130 BPM, with a clear breakdown around 40 s and a drop around 41–44 s. Cuts sync to downbeats via `Mix.track()`. Fallback: a synth score in a minor key (ember pad, pulsing sub, metallic plucks).
- **New SFX pack** (Pixabay):
  - mechanical key clacks
  - vault servo and lock clunks
  - hex-plate snaps
  - chain rattle
  - a heavy lever throw
  - glitch-slice crunch
  - coin drops
  - an ember whoosh

  Rung 2's shutter, stamp and seal sounds are not reused.

## Open questions for Vansh
1. **Format:** 16:9 master + 9:16 cut-down (recommended), or 9:16 only?
2. **Music:** will you pull the Pixabay tracks, or should I use the synth fallback?
3. **Numbers:** should I re-scan devaegis.com (pricing and docs) for real figures? The $1,850 payment amount stays out unless it's verified.
