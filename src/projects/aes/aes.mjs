// Real AES-256, written out round by round so every step can be drawn. Verified against node:crypto below.
import crypto from "node:crypto";
import fs from "node:fs";
const sbox = new Uint8Array(256); { let p = 1, q = 1; do { p = p ^ ((p << 1) & 255) ^ (p & 0x80 ? 0x1b : 0); q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 255; if (q & 0x80) q ^= 0x09; const x = q ^ ((q << 1) | (q >> 7)) & 255 ^ ((q << 2) | (q >> 6)) & 255 ^ ((q << 3) | (q >> 5)) & 255 ^ ((q << 4) | (q >> 4)) & 255; sbox[p] = (x ^ 0x63) & 255; } while (p !== 1); sbox[0] = 0x63; }
const xt = (a) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 255;
const mul = (a, b) => { let r = 0; while (b) { if (b & 1) r ^= a; a = xt(a); b >>= 1; } return r; };
const subBytes = (s) => s.map((b) => sbox[b]);
// state is column-major: s[4*c + r]
const shiftRows = (s) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[4 * c + r] = s[4 * ((c + r) % 4) + r]; return o; };
const mixColumns = (s) => { const o = new Array(16); for (let c = 0; c < 4; c++) { const [a0, a1, a2, a3] = s.slice(4 * c, 4 * c + 4); o[4 * c] = mul(a0, 2) ^ mul(a1, 3) ^ a2 ^ a3; o[4 * c + 1] = a0 ^ mul(a1, 2) ^ mul(a2, 3) ^ a3; o[4 * c + 2] = a0 ^ a1 ^ mul(a2, 2) ^ mul(a3, 3); o[4 * c + 3] = mul(a0, 3) ^ a1 ^ a2 ^ mul(a3, 2); } return o; };
const xor = (a, b) => a.map((v, i) => v ^ b[i]);
function expand(key) { // 32-byte key -> 15 round keys (16 bytes each)
  const w = []; for (let i = 0; i < 8; i++) w.push(Array.from(key.slice(4 * i, 4 * i + 4)));
  let rc = 1;
  for (let i = 8; i < 60; i++) { let t = w[i - 1].slice();
    if (i % 8 === 0) { t = [sbox[t[1]] ^ rc, sbox[t[2]], sbox[t[3]], sbox[t[0]]]; rc = xt(rc); } else if (i % 8 === 4) t = t.map((b) => sbox[b]);
    w.push(w[i - 8].map((b, j) => b ^ t[j])); }
  return Array.from({ length: 15 }, (_, r) => w.slice(4 * r, 4 * r + 4).flat());
}
export function aes256(pt, key) {
  const rk = expand(key); let s = xor(Array.from(pt), rk[0]);
  const rounds = [{ round: 0, start: Array.from(pt), key: rk[0], out: s }];
  for (let r = 1; r <= 14; r++) {
    const a = subBytes(s), b = shiftRows(a), c = r < 14 ? mixColumns(b) : b, d = xor(c, rk[r]);
    rounds.push({ round: r, start: s, sub: a, shift: b, mix: c, key: rk[r], out: d }); s = d;
  }
  return { rounds, ct: s };
}
const hex = (a) => Buffer.from(a).toString("hex");
// FIPS-197 appendix C.3 known answer
const k = Buffer.from(Array.from({ length: 32 }, (_, i) => i));
const fips = aes256(Buffer.from("00112233445566778899aabbccddeeff", "hex"), k);
console.log("FIPS-197 C.3:", hex(fips.ct), hex(fips.ct) === "8ea2b7ca516745bfeafc49904b496089" ? "OK" : "MISMATCH");
const pt = Buffer.from("DevAegis secret!");
const mine = aes256(pt, k);
const c = crypto.createCipheriv("aes-256-ecb", k, null); c.setAutoPadding(false);
const ref = Buffer.concat([c.update(pt), c.final()]);
console.log("node crypto :", ref.toString("hex")); console.log("this impl   :", hex(mine.ct), hex(mine.ct) === ref.toString("hex") ? "MATCH" : "MISMATCH");
if (hex(mine.ct) !== ref.toString("hex") || hex(fips.ct) !== "8ea2b7ca516745bfeafc49904b496089") process.exit(1);
fs.writeFileSync("src/projects/aes/states.json", JSON.stringify({ plaintext: "DevAegis secret!", key: hex(k), rounds: mine.rounds, ct: mine.ct }));
console.log("round1 start", hex(mine.rounds[1].start), "\nsub  ", hex(mine.rounds[1].sub), "\nshift", hex(mine.rounds[1].shift), "\nmix  ", hex(mine.rounds[1].mix), "\nkey  ", hex(mine.rounds[1].key), "\nout  ", hex(mine.rounds[1].out));
