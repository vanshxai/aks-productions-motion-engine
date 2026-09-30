#!/usr/bin/env bash
# Full render.  usage: scripts/render.sh <CompositionId> <out.mp4>
# Uses all CPU cores; on a Mac, angle GL uses the GPU for the 3D shots.
set -e; cd "$(dirname "$0")/.."
npx remotion render src/index.ts "$1" "$2" --crf=18 --concurrency="${CONCURRENCY:-100%}"
ffmpeg -loglevel error -y -i "$2" -vf "fps=1/2,scale=480:-1,tile=5x6" -frames:v 1 "qa/$(basename "$2" .mp4)_sheet.png" && echo "contact sheet: qa/$(basename "$2" .mp4)_sheet.png"
