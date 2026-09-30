import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { LookAt } from "../../engine/three/objects";
import { clamp01, ease, easeIO, hash, range } from "../../engine/three/kit";

/* ───────────────────────────── lighting: the forge (amber key from below, cool steel rim) */
export const Forge: React.FC<{ heat?: number; cold?: number }> = ({ heat = 1, cold = 0 }) => (
  <>
    <ambientLight intensity={0.25} />
    <directionalLight position={[3, 5, 6]} intensity={1.2 + 0.4 * heat} color={cold > 0.5 ? "#cfe0ff" : "#fff1e0"} />
    <pointLight position={[0, -2.6, 2.2]} intensity={40 * heat} distance={12} color="#ff9a2e" />
    <directionalLight position={[-6, 2, -3]} intensity={0.9} color="#9fb7ff" />
    <Environment resolution={256} frames={1}>
      <Lightformer intensity={4} position={[0, 4, 5]} scale={[10, 1.2, 1]} color={cold > 0.5 ? "#dfe9ff" : "#fff0dc"} />
      <Lightformer intensity={3 * heat + 0.3} position={[0, -4, 3]} rotation-x={Math.PI / 2} scale={[12, 3, 1]} color="#ee8517" />
      <Lightformer intensity={2.5} position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[1, 8, 1]} color="#8fa6c4" />
      <Lightformer intensity={2.5 * heat + 0.4} position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[1, 8, 1]} color="#ffcb80" />
    </Environment>
  </>
);

/* ───────────────────────────── materials */
const Obsidian: React.FC<{ glow?: number; opacity?: number }> = ({ glow = 0.15, opacity = 1 }) => (
  <meshPhysicalMaterial color="#1a120c" metalness={0.35} roughness={0.08} clearcoat={1} clearcoatRoughness={0.04} iridescence={0.35} iridescenceIOR={1.3}
    envMapIntensity={1.8} emissive="#ee8517" emissiveIntensity={glow} transparent={opacity < 1} opacity={opacity} />
);
const Steel: React.FC<{ glow?: number; tint?: string; rough?: number }> = ({ glow = 0, tint = "#6b625a", rough = 0.32 }) => (
  <meshPhysicalMaterial color={tint} metalness={0.95} roughness={rough} clearcoat={0.4} clearcoatRoughness={0.25} envMapIntensity={1.9} emissive="#ee8517" emissiveIntensity={glow} />
);
const Molten: React.FC<{ heat: number }> = ({ heat }) => (
  <meshPhysicalMaterial color="#f5a93c" metalness={0.75} roughness={0.18} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={2.2} emissive="#ff7a10" emissiveIntensity={0.25 + 1.4 * heat} />
);
const Gold: React.FC = () => <meshPhysicalMaterial color="#e8b04a" metalness={1} roughness={0.22} clearcoat={0.6} envMapIntensity={2.4} emissive="#6a3a00" emissiveIntensity={0.25} />;

/* ───────────────────────────── code texture for the cube faces */
const useCodeTexture = (seed = 1) =>
  useMemo(() => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d")!;
    g.fillStyle = "#0b0704"; g.fillRect(0, 0, 512, 512);
    const cols = ["#f5a93c", "#ffcb80", "#c9b49f", "#7fd69b", "#8fa6c4"];
    for (let i = 0; i < 26; i++) {
      let x = 28 + (hash(i * 3 + seed) < 0.3 ? 30 : 0) + (hash(i * 5 + seed) < 0.2 ? 60 : 0);
      const y = 30 + i * 18.5;
      const toks = 2 + Math.floor(hash(i + seed * 9) * 5);
      for (let k = 0; k < toks; k++) {
        const w = 18 + hash(i * 11 + k + seed) * 90;
        g.fillStyle = cols[Math.floor(hash(i * 7 + k * 3 + seed) * cols.length)]; g.globalAlpha = 0.85;
        g.fillRect(x, y, w, 7); x += w + 10;
      }
    }
    g.globalAlpha = 1; g.strokeStyle = "rgba(245,169,60,0.5)"; g.lineWidth = 6; g.strokeRect(3, 3, 506, 506);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }, [seed]);

/* ───────────────────────────── the code cube + AES hex shell + domain padlock (one object that evolves across scenes) */
const SHELL_TRIS = (() => {
  const ico = new THREE.IcosahedronGeometry(1.6, 1).toNonIndexed();
  const p = ico.getAttribute("position");
  const out: { g: THREE.BufferGeometry; e: THREE.EdgesGeometry; n: THREE.Vector3; y: number }[] = [];
  for (let i = 0; i < p.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, i), b = new THREE.Vector3().fromBufferAttribute(p, i + 1), c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
    const g = new THREE.BufferGeometry().setFromPoints([a, b, c]); g.computeVertexNormals();
    const n = a.clone().add(b).add(c).normalize();
    out.push({ g, e: new THREE.EdgesGeometry(g), n, y: n.y });
  }
  return out.sort((u, v) => v.y - u.y);   // lock in from the top down
})();
const N_PLATES = 34;
const plateDirs = (() => {
  const out: THREE.Vector3[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N_PLATES; i++) {
    const y = 1 - (i / (N_PLATES - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i;
    out.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
  }
  return out;
})();

export type VaultState = {
  l: number;            // local frame (drives idle spin)
  spin?: number;        // extra rotation (radians)
  x?: number; y?: number; z?: number; scale?: number;
  cold?: number;        // 1 = cold-blue code (unprotected), 0 = amber
  shell?: number;       // 0..1 plates snapped in (sequential)
  shellGlow?: number;   // flash on completion
  scan?: number;        // -1..1 scan plane position (AES callout); NaN = off
  lock?: number;        // 0..1 padlock drop + clamp
  reject?: number;      // 0..1 red flash on the padlock (wrong domain)
  heat?: number;
};

const Vault: React.FC<VaultState> = ({ l, spin = 0, x = 0, y = 0, z = 0, scale = 1, cold = 0, shell = 0, shellGlow = 0, scan = NaN, lock = 0, reject = 0 }) => {
  const tex = useCodeTexture(3);
  const rotY = l * 0.012 + spin, rotX = 0.42 + Math.sin(l / 70) * 0.05;
  const codeCol = new THREE.Color().lerpColors(new THREE.Color("#f5a93c"), new THREE.Color("#8fb4ff"), cold);
  return (
    <group position={[x, y, z]} scale={scale}>
      <group rotation={[rotX, rotY, 0.08]}>
        {/* inner code core */}
        <mesh>
          <boxGeometry args={[1.18, 1.18, 1.18]} />
          <meshBasicMaterial map={tex} color={codeCol} toneMapped={false} />
        </mesh>
        {/* obsidian glass shell of the cube */}
        <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.12} smoothness={4}>
          <Obsidian glow={0.05} opacity={0.42} />
        </RoundedBox>
        {/* AES-256 armour: a faceted shell whose facets fly in and lock, with glowing seams */}
        {SHELL_TRIS.map((tri, i) => {
          const k = clamp01(shell * SHELL_TRIS.length * 0.55 - i * 0.55);
          if (k <= 0) return null;
          const e = ease(k);
          const off = tri.n.clone().multiplyScalar((1 - e) * 3.0);
          const landed = k >= 1;
          return (
            <group key={i} position={off} rotation={[0, 0, 0]}>
              <mesh geometry={tri.g}>
                <meshPhysicalMaterial color="#231a13" metalness={0.85} roughness={0.22} clearcoat={0.8} envMapIntensity={1.8} transparent opacity={0.62}
                  emissive="#ee8517" emissiveIntensity={(landed ? 0.05 : 0.5) + shellGlow * 0.8} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
              <lineSegments geometry={tri.e}>
                <lineBasicMaterial color="#ffb347" transparent opacity={0.55 + 0.45 * shellGlow} toneMapped={false} />
              </lineSegments>
            </group>
          );
        })}
        {/* scan plane */}
        {!Number.isNaN(scan) && (
          <group position={[0, scan * 1.8, 0]} rotation-x={-Math.PI / 2}>
            <mesh><ringGeometry args={[1.72, 1.77, 96]} /><meshBasicMaterial color="#ffd9a0" side={THREE.DoubleSide} toneMapped={false} /></mesh>
            <mesh><circleGeometry args={[1.72, 96]} /><meshBasicMaterial color="#f5a93c" transparent opacity={0.1} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} /></mesh>
          </group>
        )}
      </group>
      {/* padlock clamps on the front */}
      {lock > 0 && (() => {
        const drop = ease(range(lock, 0, 0.55)), clampP = easeIO(range(lock, 0.55, 0.85));
        const py = 2.6 * (1 - drop) - 0.35, shackle = 0.34 * (1 - clampP);
        const red = reject;
        return (
          <group position={[0, py, 2.05]} scale={0.95} rotation-x={-0.18}>
            <RoundedBox args={[1.25, 1.0, 0.42]} radius={0.12} smoothness={4}>
              <meshPhysicalMaterial color="#2e2823" metalness={0.95} roughness={0.28} clearcoat={0.6} envMapIntensity={2} emissive={red > 0 ? "#ff3b30" : "#ee8517"} emissiveIntensity={0.12 + red * 1.4} />
            </RoundedBox>
            <mesh position={[0, 0.5 + shackle, 0]}>
              <torusGeometry args={[0.38, 0.085, 20, 48, Math.PI]} />
              <Steel tint="#8b8279" rough={0.2} />
            </mesh>
            <mesh position={[0, -0.02, 0.215]}>
              <ringGeometry args={[0.1, 0.16, 32]} />
              <meshBasicMaterial color={red > 0 ? "#ff5a4f" : "#ffcb80"} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.14, 0.215]}>
              <planeGeometry args={[0.07, 0.2]} />
              <meshBasicMaterial color={red > 0 ? "#ff5a4f" : "#ffcb80"} toneMapped={false} />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
};

export const Vault3D: React.FC<VaultState & { w: number; h: number; fov?: number; heat?: number; cam?: [number, number, number] }> = ({ w, h, fov = 30, heat = 1, cam = [0, 0.4, 9], ...s }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: cam, fov }} gl={{ antialias: true, alpha: true }}>
    <LookAt target={[0, 0, 0]} />
    <Forge heat={heat} cold={s.cold ?? 0} />
    <Vault {...s} />
  </ThreeCanvas>
);

/* ───────────────────────────── ✦ mark in molten glass (four-point star with concave sides) */
const useStarGeometry = () =>
  useMemo(() => {
    const s = new THREE.Shape(); const R = 1, k = 0.2;
    const pts = [[0, R], [R, 0], [0, -R], [-R, 0]];
    s.moveTo(0, R);
    for (let i = 0; i < 4; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % 4];
      s.quadraticCurveTo((x0 + x1) * k, (y0 + y1) * k, x1, y1);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 6, curveSegments: 24 });
    g.center(); g.computeVertexNormals(); return g;
  }, []);

export const Star3D: React.FC<{ l: number; at: number; w: number; h: number; heat?: number; spin?: number }> = ({ l, at, w, h, heat = 1, spin = 0 }) => {
  const geo = useStarGeometry();
  const p = ease(range(l, at, at + 26));
  const ign = range(l, at + 4, at + 30);
  const s = 0.2 + 0.8 * p;
  return (
    <ThreeCanvas width={w} height={h} camera={{ position: [0, 0, 7], fov: 30 }} gl={{ antialias: true, alpha: true }}>
      <LookAt target={[0, 0, 0]} />
      <Forge heat={heat} />
      <pointLight position={[0, 0, 1.6]} intensity={8 * ign} color="#ff8a1e" distance={6} />
      <group scale={s * 1.25} rotation={[0.15 * Math.sin(l / 40), (1 - p) * 2.6 + Math.sin(l / 55) * 0.25 + spin, (1 - p) * -0.6]}>
        <mesh geometry={geo}><Molten heat={ign * heat} /></mesh>
      </group>
    </ThreeCanvas>
  );
};

/* ───────────────────────────── the kill-switch lever (hazard base, steel arm, amber knob) */
const useHazardTexture = () =>
  useMemo(() => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 128; const g = c.getContext("2d")!;
    g.fillStyle = "#111"; g.fillRect(0, 0, 512, 128);
    g.fillStyle = "#f5a93c";
    for (let i = -2; i < 12; i++) { g.beginPath(); g.moveTo(i * 56, 128); g.lineTo(i * 56 + 28, 128); g.lineTo(i * 56 + 28 + 128, 0); g.lineTo(i * 56 + 128, 0); g.closePath(); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);

export const Lever3D: React.FC<{ l: number; w: number; h: number; rise: number; throw: number; shock?: number; heat?: number; restore?: number }> = ({ l, w, h, rise, throw: th, shock = 0, heat = 1, restore = 0 }) => {
  const hz = useHazardTexture();
  const ang = -0.95 + 1.9 * th;           // up (live) → down (suspended)
  const y = -3.4 * (1 - ease(rise));
  const knobGlow = 0.6 + 1.8 * th * (1 - restore) + restore * 0.2;
  return (
    <ThreeCanvas width={w} height={h} camera={{ position: [3.4, 2.4, 6.6], fov: 30 }} gl={{ antialias: true, alpha: true }}>
      <LookAt target={[0, 0.9, 0]} />
      <Forge heat={heat} />
      <group position={[0, y, 0]}>
        {/* floor plate with hazard stripes */}
        <mesh position={[0, -0.05, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[4.6, 3.2]} />
          <meshStandardMaterial color="#0d0a08" roughness={0.6} metalness={0.4} />
        </mesh>
        {[[-1.95, 0, 0, 0.35, 3.0], [1.95, 0, 0, 0.35, 3.0]].map(([x, , , ww, dd], i) => (
          <mesh key={i} position={[x, -0.03, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[ww, dd]} />
            <meshStandardMaterial map={hz} roughness={0.5} />
          </mesh>
        ))}
        {/* housing */}
        <RoundedBox args={[2.2, 0.7, 1.5]} radius={0.1} position={[0, 0.35, 0]} smoothness={4}>
          <Steel tint="#35302b" rough={0.35} />
        </RoundedBox>
        <mesh position={[0, 0.71, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.5, 0.28]} />
          <meshBasicMaterial color="#050403" />
        </mesh>
        {/* status lamps */}
        <mesh position={[-0.75, 0.52, 0.76]}><sphereGeometry args={[0.08, 20, 20]} /><meshBasicMaterial color={th < 0.5 || restore > 0.5 ? "#7fd69b" : "#1b2a1f"} toneMapped={false} /></mesh>
        <mesh position={[0.75, 0.52, 0.76]}><sphereGeometry args={[0.08, 20, 20]} /><meshBasicMaterial color={th >= 0.5 && restore < 0.5 ? "#ff5a4f" : "#2a1614"} toneMapped={false} /></mesh>
        {/* arm, pivoting on the housing */}
        <group position={[0, 0.72, 0]} rotation-x={ang}>
          <mesh position={[0, 0.95, 0]}><cylinderGeometry args={[0.11, 0.13, 1.9, 24]} /><Steel tint="#9a9088" rough={0.18} /></mesh>
          <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.32, 32, 32]} />
            <meshPhysicalMaterial color="#f5a93c" metalness={0.3} roughness={0.2} clearcoat={1} emissive="#ff7a10" emissiveIntensity={knobGlow} />
          </mesh>
        </group>
        {/* shockwave ring on the slam */}
        {shock > 0 && shock < 1 && (
          <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.4 + shock * 5.5, 0.55 + shock * 5.8, 96]} />
            <meshBasicMaterial color="#ffb347" transparent opacity={(1 - shock) * 0.9} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </ThreeCanvas>
  );
};

/* ───────────────────────────── gold coins dropping and stacking */
export const Coins3D: React.FC<{ l: number; at: number; w: number; h: number; n?: number }> = ({ l, at, w, h, n = 9 }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: [0, 2.2, 7.2], fov: 30 }} gl={{ antialias: true, alpha: true }}>
    <LookAt target={[0, 0.4, 0]} />
    <Forge heat={1} />
    {Array.from({ length: n }).map((_, i) => {
      const t0 = at + i * 4;
      const t = range(l, t0, t0 + 14);
      if (t <= 0) return null;
      const stackY = i * 0.13;
      const fall = 1 - t * t;
      const bounce = t >= 1 ? Math.abs(Math.sin(range(l, t0 + 14, t0 + 22) * Math.PI)) * 0.08 * (1 - range(l, t0 + 14, t0 + 22)) : 0;
      const yy = stackY + fall * 4.2 + bounce;
      const jx = (hash(i) - 0.5) * 0.08;
      return (
        <mesh key={i} position={[jx, yy, (hash(i + 3) - 0.5) * 0.06]} rotation={[t < 1 ? (1 - t) * 3 : 0.02 * hash(i), hash(i + 1) * 6, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.11, 64]} />
          <Gold />
        </mesh>
      );
    })}
  </ThreeCanvas>
);
