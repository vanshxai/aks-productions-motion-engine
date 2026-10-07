"""Computes every number shown in AI Math #01 (continued-fraction convergents of pi, effective exponents, Flint-Hills partial sums).
Run: python3 src/projects/pi/make_data.py  ->  src/projects/pi/data.json"""
import json, math
import numpy as np
from mpmath import mp, mpf, floor, log, sin, pi as MPI
mp.dps = 60
x = +MPI; conv = []
h0, h1, k0, k1 = 1, int(floor(x)), 0, 1; r = x
a = int(floor(r)); h_1, h_2, k_1, k_2 = a, 1, 1, 0
conv.append((a, 1))
for _ in range(14):
    r = 1 / (r - a); a = int(floor(r))
    h = a * h_1 + h_2; k = a * k_1 + k_2
    h_2, h_1, k_2, k_1 = h_1, h, k_1, k; conv.append((h, k))
out = []
for p, q in conv:
    err = abs(MPI - mpf(p) / q)
    mu = (log(1 / err) / log(q)) if q > 1 else None
    out.append(dict(p=p, q=q, err=float(err), log10err=float(log(err, 10)), log10q=math.log10(q),
                    mu=float(mu) if mu is not None else None, off=float(mpf(p) / q - MPI)))
# Flint-Hills partial sums S(N)=sum_{n<=N} 1/(n^3 sin^2 n) (double-precision sin of integers; correct range reduction)
N = 10**8; S = 0.0; chunk = 10**6; n0 = 1
LOGSTEP = 30  # samples per decade beyond n=2000
tg = sorted(set(int(10 ** (k / LOGSTEP)) for k in range(0, 8 * LOGSTEP + 1)))
ti = 0; pts = []; big = []
while n0 <= N:
    n = np.arange(n0, min(N, n0 + chunk - 1) + 1, dtype=np.float64)
    t = 1.0 / (n ** 3 * np.sin(n) ** 2)
    cs = np.cumsum(t) + S
    for i in np.nonzero(t > 2e-5)[0]:
        big.append((int(n[i]), float(t[i])))
        if i > 0: pts.append((int(n[i]) - 1, float(cs[i - 1])))
        pts.append((int(n[i]), float(cs[i])))
    if n0 == 1:
        for i in range(0, 2000): pts.append((int(n[i]), float(cs[i])))
    while ti < len(tg) and tg[ti] <= n[-1]:
        if tg[ti] >= n[0]: pts.append((tg[ti], float(cs[int(tg[ti] - n[0])])))
        ti += 1
    S = float(cs[-1]); n0 += chunk
pts = sorted(set(pts)); jumps = sorted(set(big))
json.dump(dict(conv=out, fh_pts=pts, fh_big=jumps, fh_N=N, fh_S=S), open("src/projects/pi/data.json", "w"), indent=1)
for c in out: print(c["p"], c["q"], f'{c["err"]:.3e}', c["mu"] and round(c["mu"], 3))
print("S(1e8)=", S); print(pts[-4:]); print(jumps)
