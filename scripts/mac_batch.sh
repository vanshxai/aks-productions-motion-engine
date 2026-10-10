#!/usr/bin/env bash
# One-command batch renderer for a Mac (written for an Intel MacBook, works on any macOS/Linux with node + ffmpeg).
#   ./scripts/mac_batch.sh Contrails-30s Foo-30s ...        render each composition id, one after another
#   ./scripts/mac_batch.sh --dry-run Contrails-30s          print what would run, change nothing
# Output: ~/Movies/aks-renders/<id>.mp4 and <id>.log. Keeps going if one video fails. Uses caffeinate so the Mac stays awake.
set -u
cd "$(dirname "$0")/.."

DRY=0
IDS=()
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    -h|--help) sed -n '2,6p' "$0"; exit 0 ;;
    *) IDS+=("$a") ;;
  esac
done
[ ${#IDS[@]} -gt 0 ] || { echo "usage: $0 [--dry-run] <CompositionId> [<CompositionId> ...]"; exit 2; }

run() { if [ "$DRY" = 1 ]; then echo "[dry-run] $*"; else "$@"; fi; }

# 1. tools
missing=0
command -v node >/dev/null 2>&1 || { echo "node not found.   Install:  brew install node"; missing=1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found. Install:  brew install ffmpeg"; missing=1; }
if [ "$missing" = 1 ]; then
  if [ "$DRY" = 1 ]; then echo "[dry-run] (continuing the dry run despite missing tools)"; else exit 1; fi
fi

# 2. dependencies
if [ ! -d node_modules ]; then run npm ci; else echo "node_modules present, skipping npm ci"; fi

# 3. Chrome for Remotion (Remotion's own download, cached after the first run)
run npx remotion browser ensure

# 4. concurrency = logical cores - 1 (min 1)
if command -v sysctl >/dev/null 2>&1 && NCPU=$(sysctl -n hw.ncpu 2>/dev/null); then :; else NCPU=$(nproc 2>/dev/null || echo 2); fi
CONC=$((NCPU - 1)); [ "$CONC" -ge 1 ] || CONC=1
echo "logical cores: $NCPU  ->  --concurrency=$CONC"

OUT="$HOME/Movies/aks-renders"
run mkdir -p "$OUT"
CAF=""; command -v caffeinate >/dev/null 2>&1 && CAF="caffeinate -i"

# 5. render sequentially, keep going on failure
ok=(); bad=()
for id in "${IDS[@]}"; do
  start=$(date +%s)
  echo "=== $id ==="
  if [ "$DRY" = 1 ]; then
    echo "[dry-run] $CAF npx remotion render src/index.ts $id $OUT/$id.mp4 --crf=16 --concurrency=$CONC > $OUT/$id.log 2>&1"
    ok+=("$id"); continue
  fi
  if $CAF npx remotion render src/index.ts "$id" "$OUT/$id.mp4" --crf=16 --concurrency="$CONC" > "$OUT/$id.log" 2>&1; then
    ok+=("$id"); st="done"
  else
    bad+=("$id"); st="FAILED (see $OUT/$id.log)"
  fi
  el=$(( $(date +%s) - start ))
  printf "%s: %s in %dm%02ds\n" "$id" "$st" $((el / 60)) $((el % 60))
done

echo "---- summary ----"
echo "ok:     ${ok[*]:-none}"
echo "failed: ${bad[*]:-none}"
echo "files:  $OUT"
[ ${#bad[@]} -eq 0 ]
