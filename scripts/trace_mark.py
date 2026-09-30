"""Trace a logo mark into polygons for the 3D mark (engine/three: Mark3D).
usage: python3 scripts/trace_mark.py <logo.png|webp> <out mark.json> [x0 x1]   (x0..x1 = pixel columns of the mark only)
Needs: pip install opencv-python-headless pillow numpy
Tip: find the mark/wordmark split by looking for an empty column run (printed below)."""
import sys, json, cv2, numpy as np
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGBA"); A = np.array(im)
alpha = A[:, :, 3] if A[:, :, 3].min() < 250 else (255 - np.array(im.convert("L")))  # use darkness if no transparency
occ = (alpha.max(0) > 40).astype(int); runs, s = [], None
for i, v in enumerate(occ):
    if v and s is None: s = i
    if not v and s is not None: runs.append((s, i)); s = None
if s is not None: runs.append((s, len(occ)))
print("ink column runs:", runs)
x0, x1 = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (runs[0][0], runs[0][1])
_, th = cv2.threshold(np.ascontiguousarray(alpha[:, x0:x1]), 128, 255, cv2.THRESH_BINARY)
cs, hier = cv2.findContours(th, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
polys = [{"pts": cv2.approxPolyDP(c, 1.2, True).reshape(-1, 2).astype(float).tolist(), "hole": int(hier[0][i][3]) != -1} for i, c in enumerate(cs) if cv2.contourArea(c) > 30]
allp = np.concatenate([np.array(p["pts"]) for p in polys]); mn, mx = allp.min(0), allp.max(0); c = (mn + mx) / 2; k = 2.0 / (mx[1] - mn[1])
for p in polys: p["pts"] = [[(x - c[0]) * k, -(y - c[1]) * k] for x, y in p["pts"]]
json.dump({"polys": polys, "aspect": float((mx[0] - mn[0]) / (mx[1] - mn[1]))}, open(sys.argv[2], "w"))
print(f"{len(polys)} contours -> {sys.argv[2]}  (mark aspect {(mx[0]-mn[0])/(mx[1]-mn[1]):.3f})")
