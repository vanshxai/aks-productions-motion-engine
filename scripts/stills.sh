#!/usr/bin/env bash
# Frame-check: render half-size stills of chosen frames and tile them into one contact sheet.
# usage: scripts/stills.sh <CompositionId-silent> <sheet-name> <frame> [frame ...]
# example: scripts/stills.sh Abwab-60s-silent act1 20 90 150 300
set -e
cd "$(dirname "$0")/.."
comp=$1; name=$2; shift 2
mkdir -p qa/tmp; rm -f qa/tmp/*.png
for fr in "$@"; do
  npx remotion still src/index.ts "$comp" "qa/tmp/$(printf %05d "$fr").png" --frame="$fr" --scale=0.5 --log=error >/dev/null 2>&1 || echo "still failed: frame $fr"
done
python3 scripts/contact_sheet.py qa/tmp "qa/$name.png" 3
echo "qa/$name.png"
