import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { GoldMetal, Studio, clamp01, hash } from "../../engine/three/kit";
import { LookAt } from "../../engine/three/objects";

/** Coin i of a stack lands at frame `at + i*gap`. Ease with a small settle bounce. */
const drop = (l: number, land: number) => {
  const t = clamp01((l - (land - 9)) / 9); // 9-frame fall
  if (t >= 1) {
    const s = l - land; // settle
    return Math.max(0, Math.sin(Math.min(s, 6) / 6 * Math.PI)) * 0.08 * Math.exp(-s / 4);
  }
  return (1 - t * t) * 7.5;
};

const COIN_H = 0.17;

const Stack: React.FC<{ l: number; n: number; x: number; at: number; gap: number; tint: string; seed: number }> = ({ l, n, x, at, gap, tint, seed }) => (
  <group position={[x, 0, 0]}>
    {Array.from({ length: n }).map((_, i) => {
      const land = at + i * gap;
      if (l < land - 9) return null;
      const y = i * COIN_H + COIN_H / 2 + drop(l, land);
      const jx = (hash(seed + i * 3.1) - 0.5) * 0.09;
      const jz = (hash(seed + i * 7.7) - 0.5) * 0.09;
      return (
        <group key={i} position={[jx, y, jz]} rotation={[0, hash(seed + i) * 6.28, 0]}>
          <mesh>
            <cylinderGeometry args={[1, 1, COIN_H * 0.9, 64]} />
            <GoldMetal tint={tint} roughness={0.3} glow={0.12} />
          </mesh>
          {/* raised rim: slightly wider thin band reads as a minted edge */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, COIN_H * 0.42, 0]}>
            <torusGeometry args={[0.93, 0.035, 8, 64]} />
            <GoldMetal tint={tint} roughness={0.22} glow={0.14} />
          </mesh>
        </group>
      );
    })}
  </group>
);

export const CoinStacks3D: React.FC<{ l: number; w: number; h: number; at: number; gap: number; left: number; right: number }> = ({ l, w, h, at, gap, left, right }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: [0, 7.4, 19.5], fov: 30 }} gl={{ antialias: true, alpha: true }}>
    <LookAt target={[0, 3.7, 0]} />
    <Studio intensity={1.15} />
    <directionalLight position={[-4, 9, 7]} intensity={1.4} />
    <Stack l={l} n={left} x={-1.75} at={at} gap={gap} tint="#E9B949" seed={1} />
    <Stack l={l} n={right} x={1.75} at={at} gap={gap} tint="#E9B949" seed={9} />
  </ThreeCanvas>
);
