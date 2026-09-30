#!/bin/bash
# Downloads the free 3D assets this pipeline needs into film3d/assets (idempotent).
#  - Microsoft Rocketbox avatars + mocap (MIT)            -> assets/rb
#  - iPhone 14 Pro (CC-BY 4.0, Imagigoo) + laptop (needle-engine-samples) -> assets/props
#  - Office chair (pmndrs market, CC0)                    -> assets/props
# Poly Haven furniture (CC0) already ships in public/projects/story3d/models.
set -e
cd "$(dirname "$0")"
RB=https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/master
mkdir -p assets/rb assets/props
while read -r src dst; do
  [ -s "assets/rb/$dst" ] && continue
  mkdir -p "assets/rb/$(dirname "$dst")"; curl -sfL -m 600 -o "assets/rb/$dst" "$RB/$src" && echo "ok $dst"
done < rocketbox_files.txt
N=https://raw.githubusercontent.com/needle-tools/needle-engine-samples/HEAD/package/Runtime
get() { [ -s "assets/props/$2" ] || { curl -sfL -m 600 -o "assets/props/$2" "$1" && echo "ok $2"; }; }
get "$N/Stencil%20Portals/Content/Phone/Models/phone.glb" phone.glb
get "$N/Configurator/Content/Laptop/Models/Laptop.glb" laptop.glb
get "$N/Configurator/Content/Laptop/Textures/LaptopFrameTexture.png" laptop_frame.png
get "https://raw.githubusercontent.com/pmndrs/market-assets/HEAD/_files/too-big/office-chair/chair_textures.gltf" office_chair.gltf
cp -n phone_albedo_clean.png assets/props/ 2>/dev/null || true   # phone texture with the Apple logo painted out
echo "assets ready"
