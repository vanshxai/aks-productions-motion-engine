"""Story 2 (The Whistle) audio. Reuses the S1E01 builder (voices, mixing) with its own script, music and effects.
usage: python3 scripts/studio/build_s1e02_audio.py [voices]   ('voices' = only speak the lines and write timeline.json)"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import build_s1e01_audio as b
b.OUT = "public/studio/s1e02"
b.SCRIPT = "src/studio/s1e02/script.json"
b.PAN = {"kimu": 0.3, "dad": -0.35, "mom": -0.45, "uncle": -0.3, "narrator": 0.0}
if len(sys.argv) > 1 and sys.argv[1] == "voices":
    lines, shots = b.build_voices()
    for l in lines.values():
        print(f"{l['id']:3s} {l['t']:6.2f}-{l['end']:6.2f} ({l['end']-l['t']:.1f}s)  {l['text']}")
    sys.exit(0)
from s1e02_sound import music, sfx      # noqa: E402  (written after the choreography is fixed)
b.music, b.sfx = music, sfx
b.main()
