"""Decode a *-assets-bundle.json (from bundle_assets.js) into real files.
usage: python3 scripts/decode_bundle.py <bundle.json> <out_dir>"""
import json, base64, os, sys
b = json.load(open(sys.argv[1])); out = sys.argv[2]
for k, v in b.items():
    p = os.path.join(out, k); os.makedirs(os.path.dirname(p) or out, exist_ok=True)
    open(p, "wb").write(base64.b64decode(v.split(",", 1)[1]))
print(f"{len(b)} files -> {out}")
