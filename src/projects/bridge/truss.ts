/**
 * Tiny 2D pin-jointed truss solver (method of joints, solved as one linear system).
 * Screen coordinates (y down). Tension = positive, compression = negative.
 */
export type Truss = { nodes: { x: number; y: number }[]; members: [number, number][]; pin: number; roller: number };

/** Warren truss: `n` panels of width `w`, height `h`, bottom chord at y=0 starting x=0. */
export const warren = (n: number, w: number, h: number): Truss => {
  const nodes: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) nodes.push({ x: i * w, y: 0 });
  for (let i = 0; i < n; i++) nodes.push({ x: (i + 0.5) * w, y: -h });
  const B = (i: number) => i, Tn = (i: number) => n + 1 + i;
  const members: [number, number][] = [];
  for (let i = 0; i < n; i++) members.push([B(i), B(i + 1)]);
  for (let i = 0; i < n - 1; i++) members.push([Tn(i), Tn(i + 1)]);
  for (let i = 0; i < n; i++) { members.push([B(i), Tn(i)]); members.push([Tn(i), B(i + 1)]); }
  return { nodes, members, pin: 0, roller: n };
};

/** Solve member forces for vertical loads at nodes: loads[nodeIndex] = downward force. */
export const solve = (t: Truss, loads: Record<number, number>) => {
  const J = t.nodes.length, M = t.members.length, U = M + 3;
  const A: number[][] = Array.from({ length: 2 * J }, () => new Array(U + 1).fill(0));
  t.members.forEach(([a, b], k) => {
    const dx = t.nodes[b].x - t.nodes[a].x, dy = t.nodes[b].y - t.nodes[a].y, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;
    // tension pulls node a toward b, node b toward a
    A[2 * a][k] += ux; A[2 * a + 1][k] += uy;
    A[2 * b][k] -= ux; A[2 * b + 1][k] -= uy;
  });
  A[2 * t.pin][M] = 1; A[2 * t.pin + 1][M + 1] = 1; A[2 * t.roller + 1][M + 2] = 1; // reactions Rx, Ry(pin), Ry(roller)
  for (const [n, P] of Object.entries(loads)) A[2 * +n + 1][U] -= P; // ΣF + load = 0  →  ΣF = −load
  // Gaussian elimination with partial pivoting
  const R = A.length;
  for (let c = 0; c < U; c++) {
    let p = c;
    for (let r = c + 1; r < R; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c]; if (Math.abs(d) < 1e-12) continue;
    for (let j = c; j <= U; j++) A[c][j] /= d;
    for (let r = 0; r < R; r++) if (r !== c && A[r][c] !== 0) { const m = A[r][c]; for (let j = c; j <= U; j++) A[r][j] -= m * A[c][j]; }
  }
  return A.slice(0, M).map((row) => row[U]);
};

/** Loads for a truck of weight P at chord position x (+ dead load per bottom node). */
export const truckLoads = (n: number, w: number, x: number | null, P: number, dead: number) => {
  const L: Record<number, number> = {};
  for (let i = 0; i <= n; i++) L[i] = dead;
  if (x !== null && x >= 0 && x <= n * w) {
    const i = Math.min(n - 1, Math.floor(x / w)), fr = x / w - i;
    L[i] += P * (1 - fr); L[i + 1] += P * fr;
  }
  return L;
};
