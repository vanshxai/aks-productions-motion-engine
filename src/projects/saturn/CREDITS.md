# ROCKETS #01 — Saturn V: credits and modifications

- **Model**: "Saturn V.glb" from NASA 3D Resources — https://github.com/nasa/NASA-3D-Resources (3D Models/Saturn V). 22 meshes, 927 KB, with its own decal textures (USA, UNITED STATES, flags).
- **Licence caveat**: NASA media usage guidelines apply (https://www.nasa.gov/nasa-brand-center/images-and-media/). Generally not copyrighted, but do not imply NASA endorsement and do not use NASA logos (the NASA insignia is not used in the video). The on-screen credit reads "3D MODEL: NASA".
- **What we changed** (src/projects/saturn/model.tsx):
  - Triangles are split into stage groups by triangle-centroid Y at fixed boundaries (S-IC / S-II / S-IVB / IU / adapter / spacecraft), plus the five `polySurf*` F-1 engine meshes as their own group. Geometry itself is untouched.
  - Added geometry: flat circular cap discs at the cut planes only (so separated stages do not show hollow tubes).
  - Colours: the model's own white/black livery and decals are kept; beige/grey paint is pulled to clean white, engines made metallic; stage colour-coding is done with accent light, edge glow and tinted labels.
  - No internals, no invented parts. Simplified exterior view only.
