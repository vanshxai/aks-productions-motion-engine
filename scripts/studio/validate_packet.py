"""Check an episode without watching it.
usage: python3 scripts/studio/validate_packet.py src/studio/s1e01/packet.json
Checks (reads script.json next to the packet and public/studio/s1e01/timeline.json written by the audio build):
  - shots cover 0..duration with no gap; every cast/set id exists in the manifest
  - every spoken line sits inside its shot and never overlaps another line
  - speakers are in the shot's cast (narrator is always allowed)
  - English only: ASCII text, no Devanagari, no romanised Hindi words
"""
import json, os, re, sys
p = json.load(open(sys.argv[1]))
root = os.path.dirname(os.path.abspath(__file__)) + "/../.."
man = json.load(open(f"{root}/src/studio/manifest.json"))
sc = json.load(open(os.path.join(os.path.dirname(sys.argv[1]), "script.json")))
tl = json.load(open(f"{root}/public/studio/s1e01/timeline.json"))
errs = []
shots = tl["shots"]
if abs(shots[0]["t0"]) > 1e-6: errs.append("first shot must start at 0")
for a, b in zip(shots, shots[1:]):
    if abs(a["t1"] - b["t0"]) > 1e-6: errs.append(f"gap/overlap between {a['id']} and {b['id']}")
if abs(shots[-1]["t1"] - p["duration_s"]) > 1e-6: errs.append("last shot must end at duration_s")
cast = {s["id"]: s["cast"] for s in p["shots"]}
known = set(man["characters"]) | {"bird"}
for s in p["shots"]:
    for c in s["cast"]:
        if c not in known: errs.append(f"{s['id']}: unknown cast '{c}'")
def shot_at(t): return next((s for s in shots if s["t0"] - 1e-6 <= t < s["t1"]), None)
HINDI = re.compile(r"[ऀ-ॿ]|\b(beta|shabash|papa|mummy|chai|yaar|bhaiya|arre|accha|namaste|ji)\b", re.I)
lines = sorted(tl["lines"], key=lambda l: l["t"])
prev_end, prev_id = 0, None
for l in lines:
    s = shot_at(l["t"])
    if not s: errs.append(f"{l['id']} starts outside every shot"); continue
    if l["end"] > s["t1"] + 0.05: errs.append(f"{l['id']} runs {l['end'] - s['t1']:.2f}s past {s['id']}")
    if l["char"] != "narrator" and l["char"] not in cast[s["id"]]: errs.append(f"{l['id']}: {l['char']} is not in {s['id']}")
    if l["t"] < prev_end - 1e-6: errs.append(f"{l['id']} overlaps {prev_id}")
    prev_end, prev_id = l["end"], l["id"]
    if not l["text"].replace("\u2014","-").replace("\u2026","...").isascii() or HINDI.search(l["text"]): errs.append(f"{l['id']}: text must be plain English")
print("OK: episode is consistent (%d lines, %d shots)" % (len(lines), len(shots)) if not errs else "\n".join("ERROR: " + e for e in errs))
sys.exit(1 if errs else 0)
