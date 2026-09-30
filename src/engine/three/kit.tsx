import React, { useMemo } from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { C } from "../util";

export type MarkPolys = { polys: { pts: number[][]; hole: boolean }[] };

/** Extruded geometry of a client mark traced with scripts/trace_mark.py (height = 2 units). Holes are supported. */
export const useMarkGeometry = (mark: MarkPolys, depth = 0.42) =>
  useMemo(() => {
    const toPath = (pts: number[][], s: THREE.Shape | THREE.Path) => {
      pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
      s.closePath();
      return s;
    };
    const outer = mark.polys.filter((p) => !p.hole);
    const holes = mark.polys.filter((p) => p.hole);
    const shapes = outer.map((p) => {
      const s = toPath(p.pts, new THREE.Shape()) as THREE.Shape;
      holes.forEach((h) => s.holes.push(toPath(h.pts, new THREE.Path()) as THREE.Path));
      return s;
    });
    const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.045, bevelSegments: 5, curveSegments: 12 });
    g.center();
    g.computeVertexNormals();
    return g;
  }, [mark, depth]);

/** Studio lighting built from local light panels (no HDRI download). */
export const Studio: React.FC<{ warm?: boolean; intensity?: number }> = ({ intensity = 1 }) => (
  <>
    <ambientLight intensity={0.35 * intensity} />
    <directionalLight position={[3, 5, 6]} intensity={1.8 * intensity} />
    <directionalLight position={[-5, -2, 3]} intensity={0.6 * intensity} color={C.light3D[1]} />
    <Environment resolution={256}>
      <Lightformer intensity={5} position={[0, 4, 5]} scale={[10, 1.2, 1]} color={C.light3D[0]} />
      <Lightformer intensity={3} position={[-5, 0, 3]} rotation-y={Math.PI / 2} scale={[1, 8, 1]} color={C.light3D[1]} />
      <Lightformer intensity={3} position={[5, -1, 3]} rotation-y={-Math.PI / 2} scale={[1, 8, 1]} color={C.light3D[2]} />
      <Lightformer intensity={2} position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} color={C.light3D[3]} />
    </Environment>
  </>
);

/** Glossy brand "glass" — clearcoat + iridescence + env reflections. No transmission pass (too slow / renders black offline). */
export const VioletGlass: React.FC<{ tint?: string; opacity?: number; emissive?: string; emissiveIntensity?: number }> = ({ tint, opacity = 1, emissive, emissiveIntensity = 0.35 }) => (
  <meshPhysicalMaterial
    color={tint ?? C.glass3D}
    metalness={0.25}
    roughness={0.12}
    clearcoat={1}
    clearcoatRoughness={0.05}
    iridescence={0.9}
    iridescenceIOR={1.35}
    iridescenceThicknessRange={[200, 700]}
    envMapIntensity={1.6}
    emissive={emissive ?? C.glass3DEmissive}
    emissiveIntensity={emissiveIntensity}
    transparent={opacity < 1}
    opacity={opacity}
  />
);

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIO = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const range = (l: number, a: number, b: number) => clamp01((l - a) / (b - a));
export const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Alias with a brand-neutral name. */
export const BrandGlass = VioletGlass;

/** Brushed metal in the brand's 3D colour (e.g. gold). */
export const GoldMetal: React.FC<{ tint?: string; roughness?: number; glow?: number }> = ({ tint, roughness = 0.28, glow = 0.14 }) => (
  <meshPhysicalMaterial color={tint ?? C.glass3D} metalness={0.92} roughness={roughness} clearcoat={0.5} clearcoatRoughness={0.2} envMapIntensity={2.1} emissive={tint ?? C.glass3D} emissiveIntensity={glow} />
);
