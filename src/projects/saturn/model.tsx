import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { continueRender, delayRender, staticFile } from "remotion";

/**
 * The REAL NASA Saturn V exterior model (github.com/nasa/NASA-3D-Resources, "Saturn V.glb"), cut into stage groups
 * by triangle-centroid Y at boundaries verified against the geometry (see CREDITS.md). No invented parts.
 * The only added geometry is flat cap discs at the cut planes so the open stage ends do not show hollow tubes.
 */
export type Stage = "sic" | "eng" | "sii" | "sivb" | "iu" | "sla" | "cap";
export const STAGES: Stage[] = ["sic", "eng", "sii", "sivb", "iu", "sla", "cap"];

/** model units (Y up, base of engine bells at -0.141, tower tip at 12.846 ≙ 110.6 m → 0.1175 units/m) */
export const B = { sic: 4.83, sii: 7.74, sivb: 10.03, iu: 10.22, sla: 11.01 }; // top of each group
export const AXIS = { x: 0.004, z: 0.743 };
export const MODEL_H = 12.846;
const ENG_TOP = 0.45; // F-1 engines (five meshes named polySurf*) are the only parts below this that are not hull

export const stageOfY = (y: number): Stage => (y < B.sic ? "sic" : y < B.sii ? "sii" : y < B.sivb ? "sivb" : y < B.iu ? "iu" : y < B.sla ? "sla" : "cap");

/** Palette: faithful Apollo livery from the model's own materials/decals, each stage gets a tint + emissive accent used for the colour coding. */
export const LOOK: Record<Stage, { tint: string; accent: string; label: string }> = {
  sic: { tint: "#ffffff", accent: "#ffb547", label: "S-IC" },
  eng: { tint: "#9aa0a8", accent: "#ff8a1e", label: "F-1" },
  sii: { tint: "#ffffff", accent: "#5cd3ff", label: "S-II" },
  sivb: { tint: "#ffffff", accent: "#3ee08f", label: "S-IVB" },
  iu: { tint: "#ffffff", accent: "#c8b6ff", label: "IU" },
  sla: { tint: "#ffffff", accent: "#c8b6ff", label: "ADAPTER" },
  cap: { tint: "#ffffff", accent: "#ff6a6e", label: "SPACECRAFT" },
};

type Parts = Record<Stage, THREE.Mesh[]>;
let CACHE: { parts: Parts } | null = null;
let PENDING: Promise<{ parts: Parts }> | null = null;

const splitGeometry = (src: THREE.BufferGeometry, pick: (cy: number) => Stage, force?: Stage) => {
  const pos = src.getAttribute("position"); const idx = src.getIndex()!;
  const buckets: Record<string, number[]> = {};
  for (let t = 0; t < idx.count; t += 3) {
    const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2);
    const cy = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
    const s = force ?? pick(cy);
    (buckets[s] ??= []).push(a, b, c);
  }
  return Object.entries(buckets).map(([s, ids]) => {
    const g = new THREE.BufferGeometry();
    for (const k of Object.keys(src.attributes)) g.setAttribute(k, src.getAttribute(k)); // shared vertex data, own index
    g.setIndex(ids);
    return [s as Stage, g] as const;
  });
};

const build = (gltf: any): { parts: Parts } => {
  const parts = Object.fromEntries(STAGES.map((s) => [s, [] as THREE.Mesh[]])) as unknown as Parts;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o: any) => {
    if (!o.isMesh) return;
    const isEngine = /^polySurf/.test(o.name) || /^polySurf/.test(o.parent?.name ?? "");
    const geo = o.geometry as THREE.BufferGeometry;
    const mats: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
    // glTF primitives of one mesh are separate THREE meshes (each with its own material) — handle each as a unit
    for (const [stage, g] of splitGeometry(geo, stageOfY, isEngine ? "eng" : undefined)) {
      const m = new THREE.Mesh(g, mats[0]);
      m.matrixAutoUpdate = false; m.matrix.copy(o.matrixWorld); m.matrixWorldNeedsUpdate = true;
      parts[stage].push(m);
    }
  });
  return { parts };
};

export const loadSaturn = () => {
  if (CACHE) return Promise.resolve(CACHE);
  PENDING ??= new Promise((res, rej) => new GLTFLoader().load(staticFile("projects/saturn/saturn_v.glb"), (g) => { CACHE = build(g); res(CACHE); }, undefined, rej));
  return PENDING;
};

export const useSaturn = () => {
  const [d, setD] = useState(CACHE);
  const [h] = useState(() => (CACHE ? null : delayRender("saturn glb")));
  useEffect(() => { if (h !== null) loadSaturn().then((r) => { setD(r); continueRender(h); }).catch((e) => { console.error(e); continueRender(h); }); }, [h]);
  return d;
};

/** hull radius (from the geometry) just below / above each cut plane, used only for the flat cap discs */
const CUT_R: Record<string, [number, number]> = { sic: [0.632, 0.659], sii: [0.632, 0.632], sivb: [0.437, 0.437], iu: [0.437, 0.422], sla: [0.235, 0.235] };
const ENDS: Record<Stage, [number | null, number | null, number, number]> = {
  // [yLo, yHi, rLo, rHi]
  sic: [null, B.sic, 0, 0.632], eng: [null, null, 0, 0], sii: [B.sic, B.sii, 0.659, 0.632], sivb: [B.sii, B.sivb, 0.632, 0.437],
  iu: [B.sivb, B.iu, 0.437, 0.437], sla: [B.iu, B.sla, 0.422, 0.235], cap: [B.sla, null, 0.235, 0],
};
void CUT_R;

/** Palette function: the model's own white/black livery + decals are kept; beige/grey paint is pulled to a clean white (Apollo-era paint),
 *  blacks stay black, engines get a metallic look. The stage colour-coding is applied as accent light + a gentle edge glow (see StageMesh). */
const paint = (c: THREE.Color, stage: Stage) => {
  const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  if (stage === "eng") return c.clone().lerp(new THREE.Color("#8d949c"), 0.6);
  return l > 0.45 ? new THREE.Color("#e9edf2") : c.clone();
};
const stageMaterial = (m: THREE.MeshStandardMaterial, stage: Stage) => {
  const c = m.clone() as THREE.MeshStandardMaterial;
  c.color = paint(c.color, stage);
  c.userData.base = c.color.clone();
  c.metalness = stage === "eng" ? 0.7 : 0.1;
  c.roughness = stage === "eng" ? 0.42 : 0.34;
  c.envMapIntensity = 1.0;
  c.emissive = new THREE.Color(LOOK[stage].accent);
  c.side = THREE.FrontSide;
  if (c.map) c.map.anisotropy = 8;
  return c;
};

/** Per-engine centres (x, z relative to the rocket axis) measured from the five `polySurf*` bounding boxes of the GLB. */
export const F1_XZ: [number, number][] = [[-0.478, -0.334], [0.316, -0.455], [0.442, 0.333], [-0.016, 0.0], [-0.348, 0.455]];

/** One stage as a group (own materials so a stage can glow / fade independently). glow = accent emissive 0..1, ghost = fade-out 0..1 */
export const StageMesh: React.FC<{ parts: Parts; stage: Stage; glow?: number; ghost?: number; dim?: number; y?: number; caps?: boolean }> = ({ parts, stage, glow = 0, ghost = 0, dim = 0, y = 0, caps = true }) => {
  const items = useMemo(() => parts[stage].map((m) => {
    const mesh = new THREE.Mesh(m.geometry, stageMaterial(m.material as THREE.MeshStandardMaterial, stage));
    mesh.matrixAutoUpdate = false; mesh.matrix.copy(m.matrix); return mesh;
  }), [parts, stage]);
  const em = 0.28 * glow, k = 1 - 0.62 * dim;
  items.forEach((m) => {
    const mt = m.material as THREE.MeshStandardMaterial;
    mt.color.copy(mt.userData.base).multiplyScalar(k); mt.emissiveIntensity = em; mt.transparent = ghost > 0.001; mt.opacity = 1 - ghost; mt.depthWrite = ghost < 0.5;
  });
  const [yLo, yHi, rLo, rHi] = ENDS[stage];
  const disc = (yy: number, r: number, up: boolean) => (
    <mesh key={String(up)} position={[AXIS.x, yy, AXIS.z]} rotation={[up ? -Math.PI / 2 : Math.PI / 2, 0, 0]}>
      <circleGeometry args={[r, 64]} />
      <meshStandardMaterial color={new THREE.Color("#cfd5dc").multiplyScalar(1 - 0.62 * dim)} roughness={0.6} metalness={0.1} emissive={LOOK[stage].accent} emissiveIntensity={em} transparent={ghost > 0.001} opacity={1 - ghost} />
    </mesh>
  );
  return (
    <group position={[0, y, 0]}>
      {items.map((m, i) => <primitive key={i} object={m} />)}
      {caps && yHi !== null && disc(yHi, rHi, true)}
      {caps && yLo !== null && disc(yLo, rLo, false)}
    </group>
  );
};
