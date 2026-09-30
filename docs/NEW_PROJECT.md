# New video checklist

1. `docs/plans/NN-client.md` — brand, real data (with source page), beat sheet, 3D shots, density scorecard target. Get Vansh's OK.
2. Assets → `public/projects/<client>/` (scan_brand.js → bundle_assets.js → decode_bundle.py). Ask before downloading.
3. Fonts: copy free woff2/ttf to `public/fonts/`, register with `loadFont()` at the top of the project's root file.
4. `src/projects/<client>/`
   - `brand.ts` — `Partial<Brand>` (all colour roles, font, displayFont, glass3D, light3D)
   - `assets.tsx` — `export const A = assets("projects/<client>")`, logo components, `MARK` (from trace_mark.py)
   - act files (copy/adapt from `src/projects/abwab/`), each scene = one component using local frames
   - `<Client>60.tsx` — root: `applyBrand(brand)` FIRST, backgrounds, `<Scene>` timeline, chapter HUD, `<Audio>`
   - `soundtrack.py` — scene starts (same numbers as the .tsx) + cues → `public/projects/<client>/soundtrack.wav`
5. Register `<Client>-60s` and `<Client>-60s-silent` in `src/Root.tsx`.
6. Frame-check every act with `scripts/stills.sh` → fix → render with `scripts/render.sh` → QA the contact sheet.
7. Deliver the mp4 + density scorecard (vs previous rung).
