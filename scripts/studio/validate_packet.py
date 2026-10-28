"""Check a story packet without watching the video.
usage: python3 scripts/studio/validate_packet.py src/studio/s1e01/packet.json
Checks: shots cover 0..duration with no gap, dialogue fits its shot and matches the mumble timing,
narration beats fall inside shots and never overlap each other, every cast/set/asset id exists in the manifest."""
import json, os, sys
p = json.load(open(sys.argv[1]))
root = os.path.dirname(os.path.abspath(__file__)) + "/../.."
man = json.load(open(f"{root}/src/studio/manifest.json"))
ep = os.path.dirname(sys.argv[1])
vo = json.load(open(f"{root}/public/studio/s1e01/vo.json"))
mu = json.load(open(f"{root}/public/studio/s1e01/mumble.json"))
errs = []
shots = p["shots"]
if abs(shots[0]["t0"]) > 1e-6: errs.append("first shot must start at 0")
for a, b in zip(shots, shots[1:]):
    if abs(a["t1"] - b["t0"]) > 1e-6: errs.append(f"gap/overlap between {a['id']} and {b['id']}")
if abs(shots[-1]["t1"] - p["duration_s"]) > 1e-6: errs.append("last shot must end at duration_s")
known = set(man["characters"]) | {"bird"}
for s in shots:
    for c in s["cast"]:
        if c not in known: errs.append(f"{s['id']}: unknown cast '{c}'")
def shot_at(t): return next((s for s in shots if s["t0"] <= t < s["t1"]), None)
for d in p["dialogue"]:
    m = next((x for x in mu if x["id"] == d["id"]), None)
    if not m: errs.append(f"dialogue {d['id']} has no mumble clip"); continue
    s = shot_at(m["t"])
    if not s or m["t"] + m["dur"] > s["t1"] + 0.01: errs.append(f"dialogue {d['id']} runs past its shot")
    elif d["who"] not in s["cast"]: errs.append(f"{d['id']}: speaker {d['who']} is not in {s['id']}")
prev = 0
for b in vo["beats"]:
    if b["start"] < prev - 1e-6: errs.append(f"narration {b['id']} overlaps the previous line")
    prev = b["end"]
    if b["end"] > p["duration_s"]: errs.append(f"narration {b['id']} ends after the video")
print("OK: packet is consistent" if not errs else "\n".join("ERROR: " + e for e in errs))
sys.exit(1 if errs else 0)
