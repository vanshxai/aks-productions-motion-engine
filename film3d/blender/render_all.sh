#!/bin/bash
cd "$(dirname "$0")"
for s in "$@"; do

  ${PYTHON:-python3} render_shot.py -- $s anim 2>&1 | grep -E "ANIM|Error|Traceback" | grep -v CUEW
done
echo ALLDONE
