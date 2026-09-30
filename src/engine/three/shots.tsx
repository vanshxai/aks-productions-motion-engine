import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { RoundedBox } from "@react-three/drei";
import { GoldMetal, MarkPolys, Studio, VioletGlass, clamp01, ease, easeIO, hash, range, useMarkGeometry } from "./kit";
import { C } from "../util";

/* ───────── 3D Abwab mark: flies in from depth, settles, gently sways ───────── */
const MarkMesh: React.FC<{ l: number; at: number; tint?: string; mark: MarkPolys; material?: "glass" | "gold" }> = ({ l, at, tint, mark, material = "glass" }) => {
  const geo = useMarkGeometry(mark);
  const p = ease(range(l, at, at + 24));
  const settle = easeIO(range(l, at, at + 30));
  const rotY = -1.5 + 1.3 * settle + Math.sin((l - at) / 26) * 0.1 * settle;
  const rotX = 0.35 * (1 - settle) + Math.sin((l - at) / 34) * 0.04;
  const z = -9 * (1 - p);
  const pop = 1 + 0.08 * Math.sin(Math.PI * range(l, at + 18, at + 30));
  return (
    <mesh geometry={geo} position={[0, 0, z]} rotation={[rotX, rotY, 0]} scale={pop}>
      {material === "gold" ? <GoldMetal tint={tint} /> : <VioletGlass tint={tint} />}
    </mesh>
  );
};
export const Mark3D: React.FC<{ l: number; at: number; size: number; tint?: string; mark: MarkPolys; material?: "glass" | "gold" }> = ({ l, at, size, tint, mark, material }) => (
  <ThreeCanvas width={size} height={size} camera={{ position: [0, 0, 6.2], fov: 30 }} gl={{ antialias: true, alpha: true }}>
    <Studio />
    <MarkMesh l={l} at={at} tint={tint} mark={mark} material={material} />
  </ThreeCanvas>
);

/* ───────── Doors (Abwab = "doors") swinging open, then we push through ───────── */
const Door: React.FC<{ side: -1 | 1; open: number }> = ({ side, open }) => {
  const W = 1.45, H = 3.7;
  return (
    <group position={[side * W * 2 * 0.5 * 1.0 * 1, 0, 0]} rotation={[0, side * open * 1.9, 0]}>
      {/* hinge at outer edge: panel offset toward centre */}
      <group position={[-side * W / 2, 0, 0]}>
        <RoundedBox args={[W, H, 0.14]} radius={0.04}>
          <meshPhysicalMaterial color="#1B1428" metalness={0.55} roughness={0.22} clearcoat={1} envMapIntensity={1.4} />
        </RoundedBox>
        {/* inset panels with lilac edge light */}
        {[0.95, -0.55].map((y, i) => (
          <mesh key={i} position={[0, y, 0.075]}>
            <planeGeometry args={[W * 0.7, i === 0 ? 1.6 : 1.2]} />
            <meshStandardMaterial color="#231A35" emissive={C.violet} emissiveIntensity={0.12} />
          </mesh>
        ))}
        <mesh position={[side * -(W / 2 - 0.03), 0, 0.08]}>
          <boxGeometry args={[0.03, H, 0.02]} />
          <meshBasicMaterial color={C.lilac} />
        </mesh>
        {/* handle */}
        <mesh position={[-side * (W / 2 - 0.22), -0.1, 0.12]}>
          <boxGeometry args={[0.05, 0.55, 0.06]} />
          <meshPhysicalMaterial color={C.lilac} metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};
export const Doors3D: React.FC<{ l: number }> = ({ l }) => {
  const open = easeIO(range(l, 8, 34));
  const push = easeIO(range(l, 20, 42));
  const seam = 0.5 + 0.5 * Math.sin(l / 3);
  return (
    <ThreeCanvas width={1920} height={1080} camera={{ position: [0, 0, 10], fov: 35 }} gl={{ antialias: true, alpha: true }}>
      <Studio intensity={0.8} />
      <group position={[0, 0, push * 8.6]}>
        {/* light behind the doors */}
        <mesh position={[0, 0, -0.6]}>
          <planeGeometry args={[2.9, 3.7]} />
          <meshBasicMaterial color={new THREE.Color(C.textOnDark).multiplyScalar(0.4 + 0.6 * open)} />
        </mesh>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[0.06 + open * 2.8, 3.7]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6 + 0.4 * seam * (1 - open)} />
        </mesh>
        {/* frame */}
        {[[-1.55, 0, 0.14, 4.0], [1.55, 0, 0.14, 4.0], [0, 1.95, 3.24, 0.14]].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[w, h, 0.3]} />
            <meshPhysicalMaterial color="#2A1F3D" metalness={0.6} roughness={0.25} emissive={C.violet} emissiveIntensity={0.25} />
          </mesh>
        ))}
        <Door side={-1} open={open} />
        <Door side={1} open={open} />
      </group>
    </ThreeCanvas>
  );
};

/* ───────── 1,000-cube SME field: 99.6% are SMEs, only ~10% get credit ───────── */
const COLS = 50, ROWS = 20;
const CubeField: React.FC<{ l: number }> = ({ l }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colA = useMemo(() => new THREE.Color(), []);
  const lit = useMemo(() => new THREE.Color(C.textOnDark), []);
  const dim = useMemo(() => new THREE.Color("#2B2340"), []);
  const vio = useMemo(() => new THREE.Color(C.violet2), []);
  const corp = useMemo(() => new THREE.Color(C.amber), []);
  const corpIdx = useMemo(() => new Set([163, 488, 721, 934]), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const rise = ease(range(l, 2 + c * 0.45 + r * 0.25, 16 + c * 0.45 + r * 0.25));
        const credit = hash(i * 3.17) < 0.1 && !corpIdx.has(i);
        const sweep = ease(range(l, 44 + c * 0.35, 58 + c * 0.35));
        const zPop = credit ? sweep * 0.9 : 0;
        dummy.position.set(c - (COLS - 1) / 2, (ROWS - 1) / 2 - r, -6 * (1 - rise) + zPop);
        const s = 0.72 * rise * (credit ? 1 + 0.12 * sweep : 1);
        dummy.scale.set(s, s, s * (credit ? 1 + 1.2 * sweep : 1));
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        if (corpIdx.has(i)) colA.copy(corp);
        else if (credit) colA.copy(lit).lerp(vio, sweep);
        else colA.copy(lit).lerp(dim, sweep * 0.85);
        m.setColorAt(i, colA);
      }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [l, dummy, colA, lit, dim, vio, corp, corpIdx]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COLS * ROWS]} rotation={[-0.2, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial roughness={0.3} metalness={0.1} clearcoat={0.8} emissive={C.glass3DEmissive} emissiveIntensity={0.15} />
    </instancedMesh>
  );
};
export const Cubes3D: React.FC<{ l: number; w: number; h: number }> = ({ l, w, h }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: [0, 0, 44], fov: 30 }} gl={{ antialias: true, alpha: true }}>
    <Studio />
    <CubeField l={l} />
  </ThreeCanvas>
);

/* ───────── Particle helix streaming along the pipeline track ───────── */
const N_P = 240;
const Particles: React.FC<{ l: number; p: number; span: number }> = ({ l, p, span }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < N_P; i++) {
      const u = (hash(i) + l * 0.007) % 1;
      const ph = hash(i * 7.1) * Math.PI * 2;
      const rad = 16 + hash(i * 3.3) * 34;
      const ang = u * 22 + ph + l * 0.12;
      const vis = u <= p ? 1 : 0;
      const fade = Math.min(1, (p - u) * 12) * vis;
      dummy.position.set(-span / 2 + u * span, Math.sin(ang) * rad, Math.cos(ang) * rad);
      const s = (2.2 + hash(i * 1.7) * 3.2) * fade;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [l, p, span, dummy]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N_P]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={C.textOnDark} emissive={C.lilac2} emissiveIntensity={1.1} roughness={0.3} />
    </instancedMesh>
  );
};
export const Stream3D: React.FC<{ l: number; p: number; w: number; h: number; span: number }> = ({ l, p, w, h, span }) => (
  <ThreeCanvas width={w} height={h} orthographic camera={{ zoom: 1, position: [0, 0, 500], near: 1, far: 2000 }} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={0.6} />
    <directionalLight position={[0, 200, 300]} intensity={1.5} />
    <Particles l={l} p={p} span={span} />
  </ThreeCanvas>
);

/* ───────── 3D decision ring + check ───────── */
const CHECK = [new THREE.Vector3(-0.62, 0.02, 0), new THREE.Vector3(-0.18, -0.42, 0), new THREE.Vector3(0.68, 0.48, 0)];
const RingMesh: React.FC<{ l: number }> = ({ l }) => {
  const prog = easeIO(range(l, 2, 24));
  const check = ease(range(l, 24, 32));
  const arc = Math.max(0.001, prog) * Math.PI * 2;
  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.35, 0.11, 24, 160, arc), [arc]);
  const checkGeo = useMemo(() => {
    if (check <= 0.001) return null;
    const pts: THREE.Vector3[] = [];
    const segs = 40;
    for (let k = 0; k <= segs; k++) {
      const t = (k / segs) * check * 2;
      const a = t <= 1 ? CHECK[0].clone().lerp(CHECK[1], t) : CHECK[1].clone().lerp(CHECK[2], t - 1);
      pts.push(a);
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.01), 64, 0.11, 16, false);
  }, [check]);
  const pop = 1 + 0.1 * Math.sin(Math.PI * range(l, 24, 36));
  const spin = -Math.PI / 2 + easeIO(range(l, 0, 24)) * 4.8;
  return (
    <group scale={pop} rotation={[Math.sin(l / 20) * 0.12, Math.sin(l / 26) * 0.18, 0]}>
      <mesh>
        <torusGeometry args={[1.35, 0.1, 16, 120]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.07} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[0, 0, spin]}>
        <meshPhysicalMaterial color="#3EE58A" emissive="#00C950" emissiveIntensity={0.9} roughness={0.18} clearcoat={1} />
      </mesh>
      {checkGeo && (
        <mesh geometry={checkGeo} position={[0, 0, 0.1]}>
          <meshPhysicalMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.25} roughness={0.15} clearcoat={1} />
        </mesh>
      )}
    </group>
  );
};
export const Ring3D: React.FC<{ l: number; size: number }> = ({ l, size }) => (
  <ThreeCanvas width={size} height={size} camera={{ position: [0, 0, 6.4], fov: 32 }} gl={{ antialias: true, alpha: true }}>
    <Studio />
    <RingMesh l={l} />
  </ThreeCanvas>
);

/* ───────── Glass shield with check (compliance) ───────── */
const ShieldMesh: React.FC<{ l: number }> = ({ l }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1.25);
    s.bezierCurveTo(0.45, 1.05, 0.8, 1.0, 1.05, 1.0);
    s.lineTo(1.05, 0.1);
    s.bezierCurveTo(1.05, -0.6, 0.55, -1.05, 0, -1.3);
    s.bezierCurveTo(-0.55, -1.05, -1.05, -0.6, -1.05, 0.1);
    s.lineTo(-1.05, 1.0);
    s.bezierCurveTo(-0.8, 1.0, -0.45, 1.05, 0, 1.25);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 6, curveSegments: 32 });
    g.center();
    return g;
  }, []);
  const check = ease(range(l, 18, 30));
  const checkGeo = useMemo(() => {
    if (check <= 0.001) return null;
    const A = [new THREE.Vector3(-0.45, 0.02, 0), new THREE.Vector3(-0.12, -0.32, 0), new THREE.Vector3(0.5, 0.36, 0)];
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 30; k++) {
      const t = (k / 30) * check * 2;
      pts.push(t <= 1 ? A[0].clone().lerp(A[1], t) : A[1].clone().lerp(A[2], t - 1));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.085, 12, false);
  }, [check]);
  const inP = ease(range(l, 0, 20));
  const rotY = -1.3 * (1 - easeIO(range(l, 0, 26))) + Math.sin(l / 24) * 0.16;
  return (
    <group scale={0.4 + 0.6 * inP} rotation={[0.05, rotY, 0]}>
      <mesh geometry={geo}>
        <VioletGlass />
      </mesh>
      {checkGeo && (
        <mesh geometry={checkGeo} position={[0, 0, 0.3]}>
          <meshPhysicalMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} roughness={0.12} clearcoat={1} />
        </mesh>
      )}
    </group>
  );
};
export const Shield3D: React.FC<{ l: number; w: number; h: number }> = ({ l, w, h }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: [0, 0, 6.8], fov: 30 }} gl={{ antialias: true, alpha: true }}>
    <Studio />
    <ShieldMesh l={l} />
  </ThreeCanvas>
);

/* ───────── Glossy growth bars (light scene) ───────── */
const GROWTH = [1, 3.2, 6.8, 13];
const barCol = () => [C.lilac, C.lilac2, C.violet2, C.violet];
export const Bars3D: React.FC<{ l: number; w: number; h: number; at: number }> = ({ l, w, h, at }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: [0, 1.4, 11], fov: 30 }} gl={{ antialias: true, alpha: true }} shadows>
    <Studio intensity={1.1} />
    <directionalLight position={[4, 8, 6]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
    <group position={[0, -1.9, 0]} rotation={[0.12, -0.32, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[14, 8]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
      {GROWTH.map((g, i) => {
        const hgt = Math.max(0.02, (g / 13) * 4.2 * easeIO(range(l, at + i * 7, at + 26 + i * 7)));
        return (
          <RoundedBox key={i} args={[0.95, hgt, 0.95]} radius={0.08} smoothness={4} position={[-2.25 + i * 1.5, hgt / 2, 0]} castShadow>
            <meshPhysicalMaterial color={barCol()[i]} roughness={0.18} clearcoat={1} clearcoatRoughness={0.06} iridescence={0.4} envMapIntensity={1.3} />
          </RoundedBox>
        );
      })}
    </group>
  </ThreeCanvas>
);
