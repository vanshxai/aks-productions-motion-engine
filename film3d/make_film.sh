#!/bin/bash
# End-to-end build of the 60 s 3D film "The Kill Switch" (DevAegis).
# Usage: film3d/make_film.sh [step]   steps: setup | screens | audio | stills | shots | cut | all
# Everything is resumable: re-running a step skips work that is already on disk.
set -e
F="$(cd "$(dirname "$0")" && pwd)"; R="$(dirname "$F")"; B="$F/build"
PY="${PYTHON:-python3}"          # must be Python 3.11 with bpy==5.0.1 (pip install bpy==5.0.1)
step="${1:-all}"
mkdir -p "$B/screens" "$B/shots" "$B/audio" "$B/cut"

if [[ $step == setup || $step == all ]]; then
  "$F/fetch_assets.sh"
  $PY -c "import bpy" 2>/dev/null || $PY -m pip install bpy==5.0.1 numpy scipy pillow
  (cd "$F/screens" && npm install --no-package-lock)
fi

if [[ $step == screens || $step == all ]]; then   # UI shown on the laptop/phone screens (JPEG sequences)
  cd "$F/screens"
  for k in editor send lock1 chat site term lock2 kill portal lock3 restore; do
    [ -d "$B/screens/$k" ] && [ "$(ls "$B/screens/$k" | wc -l)" -gt 10 ] && continue
    npx remotion render src/index.ts "scr-$k" "$B/screens/$k" --sequence --image-format=jpeg --jpeg-quality=95 --log=error
  done
fi

if [[ $step == audio || $step == all ]]; then $PY "$F/blender/soundtrack60.py"; fi

if [[ $step == stills ]]; then       # frame-check: middle frame of every shot -> build/shots/Sxx/still_*.jpg
  "$F/blender/batch_stills.sh" S01 S02 S03 S04 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S17 S18
fi

if [[ $step == shots || $step == all ]]; then      # heavy part: ~20-25 s/frame on 2 CPU cores
  PYTHON=$PY "$F/blender/render_all.sh" S01 S02 S03 S04 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S17 S18
fi

if [[ $step == cut || $step == all ]]; then        # upscale + concat shots, then captions/end card/audio in Remotion
  : > "$B/cut/list.txt"
  for s in S01 S02 S03 S04 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S17 S18; do
    ffmpeg -loglevel error -y -framerate 24 -i "$B/shots/$s/f_%04d.jpg" -vf "scale=720:1280:flags=lanczos,unsharp=5:5:0.4" \
      -c:v libx264 -crf 16 -pix_fmt yuv420p "$B/cut/$s.mp4"
    echo "file '$B/cut/$s.mp4'" >> "$B/cut/list.txt"
  done
  mkdir -p "$F/screens/public/film"
  ffmpeg -loglevel error -y -f concat -safe 0 -i "$B/cut/list.txt" -c copy "$F/screens/public/film/film60_silent.mp4"
  cp "$B/audio/mix60.wav" "$F/screens/public/film/mix60.wav"
  (cd "$F/screens" && npx remotion render src/index.ts Film60 "$B/DevAegis_TheKillSwitch_60s.mp4" --log=error)
  echo "done -> $B/DevAegis_TheKillSwitch_60s.mp4"
fi
