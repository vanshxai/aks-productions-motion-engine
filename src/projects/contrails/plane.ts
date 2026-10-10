import { V3, WireLine, ring, mirrorX } from "../../engine/wire3d";

/**
 * SIMPLIFIED generic twin-engine airliner schematic made only of lines (not any real type, not to scale).
 * Model space: +Z = nose, +Y = up, +X = right wing. 60 units long, 56 units span. Static geometry; `airliner()` only sets opacities / fan angle per call.
 */
export type Grp = "body" | "wing" | "eng" | "fan" | "trail";
export interface PlaneLine extends WireLine { grp: Grp }

const AMBER = "#FFB547";
const WHITE = "#EAF4FF";

// fuselage stations: [z, radius, centre-y]
const ST: [number, number, number][] = [
  [30, 0.25, -0.2], [29, 1.3, -0.2], [27, 2.3, -0.1], [24, 2.95, 0], [19, 3.3, 0], [8, 3.4, 0], [-4, 3.4, 0], [-12, 3.3, 0.1],
  [-18, 2.9, 0.5], [-23, 2.2, 1.1], [-27, 1.4, 1.7], [-30, 0.55, 2.1],
];
const NR = 14;
const fuselage = (): PlaneLine[] => {
  const out: PlaneLine[] = [];
  const rings = ST.map(([z, r, y]) => ring([0, y, z], r, "z", NR, Math.PI / NR));
  rings.forEach((pts, i) => { if (i > 0) out.push({ pts, closed: true, grp: "body", w: 0.9 }); });
  for (let k = 0; k < NR; k += 2) out.push({ pts: rings.map((r) => r[k]), grp: "body", w: 0.7 });
  // cockpit windscreen: a short arc of 3 lines on the nose
  out.push({ pts: [[-1.6, 1.1, 27.8], [1.6, 1.1, 27.8]], grp: "body", w: 1.2, color: AMBER });
  return out;
};

const wingR = (): PlaneLine[] => {
  const root = (z: number): V3 => [3.2, -1.9, z], tip = (z: number): V3 => [28, -0.1, z];
  const outl: V3[] = [root(7), tip(-9), tip(-14), root(-6)];
  const ribs: PlaneLine[] = [0.33, 0.66].map((t) => {
    const x = 3.2 + 24.8 * t, y = -1.9 + 1.8 * t, zl = 7 - 16 * t, zt = -6 - 8 * t;
    return { pts: [[x, y, zl], [x, y, zt]] as V3[], grp: "wing" as Grp, w: 0.7 };
  });
  return [
    { pts: outl, closed: true, grp: "wing", n: [0, 1, 0], w: 1.15 },
    { pts: [root(1), tip(-11)], grp: "wing", w: 0.7 },
    ...ribs,
    { pts: [tip(-9), [28.9, 3.4, -12.5], [28.9, 3.4, -14.8], tip(-14)], grp: "wing", w: 0.9 },
  ];
};
const tailR = (): PlaneLine[] => [
  { pts: [[1.6, 1.5, -21], [11, 2.5, -28.5], [11, 2.5, -31.5], [1.6, 1.5, -27.5]], closed: true, grp: "wing", n: [0, 1, 0], w: 1 },
  { pts: [[1.6, 1.5, -24.2], [11, 2.5, -30]], grp: "wing", w: 0.6 },
];
const fin = (): PlaneLine[] => [
  { pts: [[0, 3, -16], [0, 14.5, -27.5], [0, 14.5, -30.5], [0, 2.4, -28.5]], closed: true, grp: "wing", n: [1, 0, 0], w: 1.05 },
  { pts: [[0, 3, -21], [0, 14.5, -29]], grp: "wing", w: 0.6 },
];

export const ENG: V3 = [10.5, -4.3, 0];       // engine centre (right engine)
export const NOZZLE_Z = -6.2, INLET_Z = 5.4;

const engineR = (fan: number): PlaneLine[] => {
  const [ex, ey] = ENG;
  const rs: [number, number][] = [[INLET_Z, 2.5], [4.2, 2.75], [2, 2.85], [-1, 2.6], [-3.4, 2.15]];
  const rings = rs.map(([z, r]) => ring([ex, ey, z], r, "z", 18, Math.PI / 18));
  const out: PlaneLine[] = rings.map((pts) => ({ pts, closed: true, grp: "eng" as Grp, w: 1.1, color: WHITE }));
  for (let k = 0; k < 18; k += 3) out.push({ pts: rings.map((r) => r[k]), grp: "eng", w: 0.8 });
  // core cowl + exhaust cone
  const core = [ring([ex, ey, -3.4], 1.35, "z", 12), ring([ex, ey, NOZZLE_Z], 0.9, "z", 12)];
  core.forEach((pts) => out.push({ pts, closed: true, grp: "eng", w: 1, color: AMBER }));
  for (let k = 0; k < 12; k += 3) out.push({ pts: [core[0][k], core[1][k]], grp: "eng", w: 0.8, color: AMBER });
  out.push({ pts: [[ex, ey, NOZZLE_Z], [ex, ey, NOZZLE_Z - 2.4]], grp: "eng", w: 1, color: AMBER });
  // fan: hub + 12 blades (spokes), spun by `fan`
  const hub = ring([ex, ey, 4.0], 0.55, "z", 8);
  out.push({ pts: hub, closed: true, grp: "fan", w: 1 });
  out.push({ pts: ring([ex, ey, 4.0], 2.1, "z", 18), closed: true, grp: "fan", w: 0.8 });
  for (let b = 0; b < 12; b++) {
    const a = fan + (b / 12) * Math.PI * 2;
    out.push({ pts: [[ex + 0.55 * Math.cos(a), ey + 0.55 * Math.sin(a), 4.0], [ex + 2.1 * Math.cos(a + 0.35), ey + 2.1 * Math.sin(a + 0.35), 4.0]], grp: "fan", w: 0.9, color: AMBER });
  }
  // pylon
  out.push({ pts: [[ex - 0.9, ey + 2.7, 2.5], [ex - 0.9, -1.1, 1.2]], grp: "eng", w: 0.7 });
  out.push({ pts: [[ex + 0.9, ey + 2.7, -1.8], [ex + 0.9, -0.9, -3]], grp: "eng", w: 0.7 });
  return out;
};

const STATIC: PlaneLine[] = (() => {
  const right = [...wingR(), ...tailR()];
  return [...fuselage(), ...fin(), ...right, ...(mirrorX(right) as PlaneLine[])];
})();

export interface PlaneOpts { fan?: number; body?: number; eng?: number; fanOp?: number; farOp?: number }

/** The airliner as wire lines. body = airframe opacity, eng = engines opacity. Both engines are built (mirror). */
export const airliner = ({ fan = 0, body = 1, eng = 1, fanOp = 1, farOp = 1 }: PlaneOpts = {}): PlaneLine[] => {
  const e = engineR(fan);
  const both = [...e.map((l) => ({ ...l, op: (l.op ?? 1) * farOp })), ...(mirrorX(e) as PlaneLine[])];
  const out: PlaneLine[] = [];
  for (const l of STATIC) out.push(body >= 0.999 ? l : { ...l, op: (l.op ?? 1) * body });
  for (const l of both) out.push({ ...l, op: (l.op ?? 1) * eng * (l.grp === "fan" ? fanOp : 1) });
  return out;
};

/**
 * Contrail polylines behind both engines: centre line + two flank lines that widen with distance.
 * `len` = how far (model units) the trail has been drawn; `decay` 0..1 eats it away from the far end.
 */
export const trailLines = (len: number, spread = 1): PlaneLine[] => {
  const out: PlaneLine[] = [];
  const N = Math.max(2, Math.round(len / 6));
  for (const sx of [1, -1]) {
    for (const lane of [-1, 0, 1]) {
      const pts: V3[] = [];
      for (let i = 0; i <= N; i++) {
        const d = (i / N) * len;
        const w = (0.25 + 0.075 * d) * spread;
        pts.push([sx * ENG[0] + lane * w, ENG[1] + (lane === 0 ? 0 : lane * w * 0.35) - d * 0.012, NOZZLE_Z - 2.4 - d]);
      }
      out.push({ pts, grp: "trail", color: WHITE, w: lane === 0 ? 2.1 : 1.1, op: lane === 0 ? 1 : 0.8 });
    }
  }
  return out;
};
