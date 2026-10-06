/**
 * Pin-tumbler lock geometry, in millimetres. x runs from the front face inward, y runs DOWN from the shear line (y = 0).
 * Everything animated in scenes.tsx is derived from this: pin heights come from the key's cut profile (no hand-keyed motion),
 * and a pair is "aligned" only when the key-pin / driver-pin split sits exactly on y = 0.
 */
export const PIN_X = [4.5, 8.46, 12.42, 16.38, 20.34]; // 3.96 mm pin spacing
export const PLUG_D = 12.7; // plug diameter
export const Y_B = 1.8; // uncut blade top = keyway ceiling
export const STEP = 0.7; // cut-depth increment per level
export const FLAT = 1.0; // flat at the bottom of every cut
export const RIGHT = [3, 5, 2, 4, 1]; // the code
export const WRONG = [3, 2, 4, 4, 3]; // a key that matches 2 of 5
export const LD = 5.0; // driver pin length
export const CEIL = -10; // chamber ceiling (spring seat)
export const REST = 6.6; // where key-pin tips hang with no key
export const PIN_W = 2.6, BORE = 3.0, SLOT = 2.8, TIP_W = 0.9;
export const TIP_H = ((PIN_W - TIP_W) / 2) * 1.732;
export const K_TIP = 24, TIP_Y = 7.6, K_BOT = 10.5; // key length, nose height, blade bottom
const TAN65 = Math.tan((65 * Math.PI) / 180);

export const cutY = (d: number) => Y_B + STEP * d;
/** key-pin lengths are set by the right key's cuts */
export const KEY_PIN_LEN = RIGHT.map(cutY);

/** height (y, down) of the key's top surface at key coordinate k (mm from the shoulder). 99 = no key there. */
export const profile = (cuts: number[], k: number) => {
  if (k > K_TIP) return 99;
  let y = Y_B;
  for (let i = 0; i < 5; i++) {
    const v = cutY(cuts[i]) - Math.max(0, Math.abs(k - PIN_X[i]) - FLAT / 2); // 45° walls
    if (v > y) y = v;
  }
  const r = TIP_Y - (K_TIP - k) * TAN65; // chamfered nose
  return r > y ? r : y;
};

/** where the key-pin tip sits: springs push it down until it touches the key (tapered tip), or hangs at REST */
export const tipY = (i: number, cuts: number[] | null, s: number) => {
  if (!cuts) return REST;
  let m = REST;
  for (let dx = -1.3; dx <= 1.3001; dx += 0.05) {
    const v = profile(cuts, PIN_X[i] + dx + s) + Math.max(0, Math.abs(dx) - TIP_W / 2) * 1.732;
    if (v < m) m = v;
  }
  return m;
};

export type PinSt = { low: number; yb: number; top: number; ok: boolean };
export const pinState = (i: number, cuts: number[] | null, s: number): PinSt => {
  const low = tipY(i, cuts, s);
  const yb = low - KEY_PIN_LEN[i]; // y of the split between key pin and driver pin
  return { low, yb, top: yb - LD, ok: Math.abs(yb) < 0.06 };
};
export const allPins = (cuts: number[] | null, s: number) => PIN_X.map((_, i) => pinState(i, cuts, s));

/** key outline (top surface sampled from the profile) in mm, key-local coordinates */
export const keyOutline = (cuts: number[]) => {
  const top: [number, number][] = [];
  for (let k = 0; k <= K_TIP + 1e-6; k += 0.1) top.push([k, profile(cuts, k)]);
  return top;
};

/** slider-crank: cam pin at angle th (rad, clockwise) pulls the bolt through a link. px units. */
export const BOLT = { R: 140, LR: 300, TIP_LEN: 120, TAIL: 100 };
export const boltX = (thDeg: number) => {
  const th = (thDeg * Math.PI) / 180;
  const R = BOLT.R, Lr = BOLT.LR;
  return R * Math.cos(th) + Math.sqrt(Lr * Lr - (R * Math.sin(th)) ** 2); // tail-pin x relative to plug centre
};
