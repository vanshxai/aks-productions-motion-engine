#!/bin/bash
cd "$(dirname "$0")"
for s in "$@"; do
  n=$(python3 -c "import sys;sys.path.insert(0,'.');from shots import SHOTS;print(SHOTS['$s'][1])" 2>/dev/null | tail -1)
  mid=$((n/2)); python3 render_shot.py -- $s still $mid 2>&1 | grep -E "STILLS|Error|Traceback|Exception" 
done
