"""Computes every number shown in AI Math #01 (60 s plain-language cut): best fractions for pi (continued-fraction convergents),
their closeness scores (effective exponent  mu = ln(1/error)/ln(q)), digits right vs 'normal' digits (2*log10 q), and the
made-up Liouville-style number 0.1 1 0001 ... (ones at the factorial positions 1,2,6,24,120).
Run: python3 src/projects/pi60/make_data.py  ->  src/projects/pi60/data.json"""
import json, math
from math import factorial
from mpmath import mp, mpf, floor, log, pi as MPI
mp.dps = 600
x = +MPI
a = int(floor(x)); r = x; h_1, h_2, k_1, k_2 = a, 1, 1, 0
conv = [(a, 1)]
for _ in range(14):
    r = 1 / (r - a); a = int(floor(r)); h = a * h_1 + h_2; k = a * k_1 + k_2
    h_2, h_1, k_2, k_1 = h_1, h, k_1, k; conv.append((h, k))
out = []
for p, q in conv:
    err = abs(MPI - mpf(p) / q)
    mu = float(log(1 / err) / log(q)) if q > 1 else None
    out.append(dict(p=p, q=q, err=float(err), digits_right=float(-log(err, 10)), normal_digits=2 * math.log10(q), log10q=math.log10(q), mu=mu, off=float(mpf(p) / q - MPI)))
digits = mp.nstr(MPI, 70, strip_zeros=False)  # '3.1415...'
# made-up number: digit k (after the point) is 1 iff k is a factorial (1,2,6,24,120,720), else 0
POS = [factorial(n) for n in range(1, 7)]
L = sum(mpf(10) ** (-p) for p in POS)
lio = []
for n in range(1, 5):
    qd = factorial(n)                                   # denominator 10^qd
    p_int = int(floor(L * mpf(10) ** qd)); q = mpf(10) ** qd
    err = L - mpf(p_int) / q
    lio.append(dict(n=n, qdigits=qd, p=str(p_int) if qd <= 8 else None, mu=float(log(1 / err) / log(q))))
strL = "".join("1" if k in POS else "0" for k in range(1, 61))
json.dump(dict(conv=out, pi_digits=digits, lio=lio, lio_str=strL), open("src/projects/pi60/data.json", "w"), indent=1)
for c in out: print(c["p"], c["q"], f'{c["err"]:.3e}', c["mu"] and round(c["mu"], 3), round(c["digits_right"], 2), round(c["normal_digits"], 2))
print(digits); print(lio); print(strL)
