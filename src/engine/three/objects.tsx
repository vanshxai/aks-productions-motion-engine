import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { GoldMetal, Studio, clamp01, ease, easeIO, hash, range } from "./kit";
import { C } from "../util";

/** Load an image as a texture, holding the render until it's ready. */
export const useImageTexture = (url: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender(`texture ${url}`));
  useEffect(() => {
    new THREE.TextureLoader().load(
      url,
      (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; setTex(t); continueRender(handle); },
      undefined,
      () => continueRender(handle)
    );
  }, [url, handle]);
  return tex;
};

/** Point a fixed camera at a target once (locked camera, just aimed). */
export const LookAt: React.FC<{ target: [number, number, number] }> = ({ target }) => {
  const { camera } = useThree();
  useLayoutEffect(() => { camera.lookAt(...target); camera.updateProjectionMatrix(); }, [camera, target]);
  return null;
};

/* ───────── Laptop with a real screenshot on screen: rises, lid opens, screen image slowly pans ───────── */
const Laptop: React.FC<{ l: number; at: number; src: string; src2?: string; swapAt?: number }> = ({ l, at, src, src2, swapAt = 9999 }) => {
  const t1 = useImageTexture(src);
  const t2 = useImageTexture(src2 ?? src);
  const rise = ease(range(l, at, at + 20));
  const open = easeIO(range(l, at + 8, at + 34));
  const lidRot = -Math.PI / 2 + open * (Math.PI / 2 + 0.22); // closed flat → open, leaning back
  const swap = easeIO(range(l, swapAt, swapAt + 12));
  const zoom = 1 - 0.06 * range(l, at + 30, at + 150);
  const tex = swap < 0.5 ? t1 : t2;
  if (tex) { tex.repeat.set(zoom, zoom); tex.offset.set((1 - zoom) / 2, (1 - zoom) * 0.2); }
  const scr = 0.02 + 0.98 * range(l, at + 22, at + 34);
  return (
    <group position={[0, -2.2 * (1 - rise) - 0.9, 0]} rotation={[0.08, 0, 0]}>
      {/* base */}
      <RoundedBox args={[4.4, 0.16, 3.0]} radius={0.07} position={[0, 0, 0]}>
        <meshPhysicalMaterial color="#8A817A" metalness={0.8} roughness={0.34} clearcoat={0.4} envMapIntensity={1.4} />
      </RoundedBox>
      <mesh position={[0, 0.085, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.8, 1.6]} />
        <meshStandardMaterial color="#3A3430" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.085, 1.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 0.7]} />
        <meshStandardMaterial color="#6F6760" roughness={0.6} />
      </mesh>
      {/* lid, hinged at the back edge */}
      <group position={[0, 0.08, -1.48]} rotation={[lidRot, 0, 0]}>
        <RoundedBox args={[4.4, 2.8, 0.1]} radius={0.06} position={[0, 1.4, 0]}>
          <meshPhysicalMaterial color="#8A817A" metalness={0.8} roughness={0.34} clearcoat={0.4} envMapIntensity={1.4} />
        </RoundedBox>
        <mesh position={[0, 1.4, 0.052]}>
          <planeGeometry args={[4.2, 2.6]} />
          <meshBasicMaterial color="#0B0908" />
        </mesh>
        <mesh position={[0, 1.4, 0.056]} scale={[1, 1, 1]}>
          <planeGeometry args={[3.96, 2.2275]} />
          {tex ? <meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(scr, scr, scr)} /> : <meshBasicMaterial color="#111" />}
        </mesh>
      </group>
    </group>
  );
};
export const Laptop3D: React.FC<{ l: number; at: number; src: string; src2?: string; swapAt?: number; w: number; h: number }> = ({ w, h, ...p }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: [0, 0.75, 7.4], fov: 32 }} gl={{ antialias: true, alpha: true }}>
    <LookAt target={[0, 0.75, 0]} />
    <Studio intensity={1.1} />
    <Laptop {...p} />
  </ThreeCanvas>
);

/* ───────── Case-study carousel: framed screenshots on an arc; the ring turns to bring each to the front ───────── */
const Screen: React.FC<{ src: string; angle: number; R: number; focus: number }> = ({ src, angle, R, focus }) => {
  const tex = useImageTexture(src);
  return (
    <group rotation={[0, angle, 0]}>
      <group position={[0, 0, R]} scale={1 + 0.12 * focus}>
        <RoundedBox args={[3.5, 2.05, 0.08]} radius={0.06}>
          <meshPhysicalMaterial color="#1C1612" metalness={0.6} roughness={0.3} clearcoat={0.6} />
        </RoundedBox>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[3.36, 1.89]} />
          {tex ? <meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color().setScalar(0.35 + 0.65 * focus)} /> : <meshBasicMaterial color="#222" />}
        </mesh>
      </group>
    </group>
  );
};
export const Carousel3D: React.FC<{ l: number; srcs: string[]; stepAt: number[]; w: number; h: number; step?: number }> = ({ l, srcs, stepAt, w, h, step = 0.88 }) => {
  let pos = 0;
  stepAt.forEach((a, i) => { pos += easeIO(range(l, a, a + 14)) * (i === 0 ? 0 : 1); });
  const enter = ease(range(l, stepAt[0], stepAt[0] + 18));
  return (
    <ThreeCanvas width={w} height={h} camera={{ position: [0, 0.1, 6.9], fov: 32 }} gl={{ antialias: true, alpha: true }}>
      <Studio />
      <group position={[0, 0, -4.4 - 3 * (1 - enter)]} rotation={[0, -pos * step, 0]}>
        {srcs.map((s, i) => (
          <Screen key={s} src={s} angle={i * step} R={4.4} focus={clamp01(1 - Math.abs(pos - i))} />
        ))}
      </group>
    </ThreeCanvas>
  );
};

/* ───────── Leaking funnel: visitors pour in, most leak out through the walls, a few drip out as gold ───────── */
const N_F = 260;
const FunnelScene: React.FC<{ l: number }> = ({ l }) => {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.18, -2.1), new THREE.Vector2(0.18, -1.2), new THREE.Vector2(0.35, -0.6),
      new THREE.Vector2(1.0, 0.4), new THREE.Vector2(1.8, 1.3), new THREE.Vector2(2.3, 1.8),
    ];
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const cIn = useMemo(() => new THREE.Color(C.textOnDark), []);
  const cLeak = useMemo(() => new THREE.Color("#6E6258"), []);
  const cGold = useMemo(() => new THREE.Color(C.glass3D), []);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    for (let i = 0; i < N_F; i++) {
      const t0 = i * 0.42; const a = l - t0; const life = 64;
      const leak = hash(i * 3.7) > 0.12;
      const ang = hash(i * 1.3) * Math.PI * 2, r0 = 0.3 + hash(i * 5.1) * 1.7;
      let x = 0, y = 0, z = 0, s = 0; col.copy(cIn);
      if (a >= 0 && a <= life) {
        if (a < 22) { const k = a / 22; y = 3.6 - k * 2.4; const r = r0 * (1 - 0.35 * k); x = Math.cos(ang) * r; z = Math.sin(ang) * r; s = 0.07; }
        else if (leak) { const k = (a - 22) / (life - 22); const r = r0 * 0.65 + k * 3.6; y = 1.2 - k * 1.6; x = Math.cos(ang) * r; z = Math.sin(ang) * r; s = 0.07 * (1 - k); col.copy(cIn).lerp(cLeak, Math.min(1, k * 2)); }
        else { const k = (a - 22) / (life - 22); const r = r0 * 0.65 * (1 - Math.min(1, k * 2)); y = 1.2 - k * 4.4; x = Math.cos(ang) * r; z = Math.sin(ang) * r; s = 0.09; col.copy(cGold); }
      }
      dummy.position.set(x, y, z); dummy.scale.setScalar(s); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, col);
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [l, dummy, col, cIn, cLeak, cGold]);
  const inP = ease(range(l, 0, 18));
  return (
    <group scale={0.6 + 0.4 * inP} rotation={[0.28, 0, 0]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color={C.textOnDark} transparent opacity={0.22} roughness={0.08} clearcoat={1} side={THREE.DoubleSide} envMapIntensity={2} depthWrite={false} />
      </mesh>
      <mesh geometry={geo} scale={[1.001, 1, 1.001]}>
        <meshBasicMaterial color={C.glass3D} wireframe transparent opacity={0.1} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, N_F]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial roughness={0.35} metalness={0.3} emissive={C.glass3D} emissiveIntensity={0.15} />
      </instancedMesh>
    </group>
  );
};
export const Funnel3D: React.FC<{ l: number; w: number; h: number }> = ({ l, w, h }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: [0, 0.4, 10.5], fov: 34 }} gl={{ antialias: true, alpha: true }}>
    <Studio />
    <FunnelScene l={l} />
  </ThreeCanvas>
);

/* ───────── Guarantee seal: scalloped gold medallion slams down like a stamp ───────── */
const SealMesh: React.FC<{ l: number; at: number }> = ({ l, at }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape(); const N = 240;
    for (let i = 0; i <= N; i++) { const t = (i / N) * Math.PI * 2; const r = 1.45 + 0.07 * Math.cos(t * 28); const x = Math.cos(t) * r, y = Math.sin(t) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 8 });
    g.center(); return g;
  }, []);
  const k = range(l, at, at + 10);
  const slam = easeIO(k);
  const z = 7 * (1 - slam);
  const squash = l >= at + 10 ? 1 - 0.12 * Math.exp(-(l - at - 10) / 3) * Math.cos((l - at - 10) * 1.2) : 1;
  const rot = (1 - slam) * 1.4 + Math.sin(l / 18) * 0.06 * slam;
  return (
    <group position={[0, 0, z]} rotation={[0.1 * (1 - slam), rot, 0]} scale={[1 / squash, squash, 1]}>
      <mesh geometry={geo}><GoldMetal roughness={0.22} /></mesh>
      <mesh position={[0, 0, 0.2]}>
        <torusGeometry args={[1.12, 0.035, 12, 120]} />
        <GoldMetal roughness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.17]}>
        <circleGeometry args={[1.08, 96]} />
        <meshPhysicalMaterial color={C.bg} metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
};
export const Seal3D: React.FC<{ l: number; at: number; size: number }> = ({ l, at, size }) => (
  <ThreeCanvas width={size} height={size} camera={{ position: [0, 0, 6.2], fov: 34 }} gl={{ antialias: true, alpha: true }}>
    <Studio />
    <SealMesh l={l} at={at} />
  </ThreeCanvas>
);

/* ───────── 24/7 ring: 24 hour ticks light up in sequence as a gold arc closes ───────── */
const Ring247: React.FC<{ l: number; at: number }> = ({ l, at }) => {
  const prog = easeIO(range(l, at, at + 40));
  const arc = Math.max(0.001, prog) * Math.PI * 2;
  const g = useMemo(() => new THREE.TorusGeometry(1.5, 0.08, 20, 160, arc), [arc]);
  return (
    <group rotation={[0.12 * Math.sin(l / 30), 0.2 * Math.sin(l / 40), 0]}>
      <mesh geometry={g} rotation={[0, 0, Math.PI / 2]} scale={[-1, 1, 1]}>
        <GoldMetal roughness={0.18} />
      </mesh>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = Math.PI / 2 - (i / 24) * Math.PI * 2;
        const on = prog >= i / 24;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.85, Math.sin(a) * 1.85, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[i % 6 === 0 ? 0.22 : 0.12, 0.045, 0.05]} />
            <meshStandardMaterial color={on ? C.glass3D : "#4A413A"} emissive={on ? C.glass3D : "#000"} emissiveIntensity={on ? 0.5 : 0} metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
};
export const Ring247_3D: React.FC<{ l: number; at: number; size: number }> = ({ l, at, size }) => (
  <ThreeCanvas width={size} height={size} camera={{ position: [0, 0, 7.4], fov: 34 }} gl={{ antialias: true, alpha: true }}>
    <Studio />
    <Ring247 l={l} at={at} />
  </ThreeCanvas>
);

/* ───────── Growth ribbon: a gold tube draws a rising curve with a glowing tip ───────── */
const Ribbon: React.FC<{ l: number; at: number }> = ({ l, at }) => {
  const p = easeIO(range(l, at, at + 46));
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(-3.4 + t * 6.8, -1.5 + Math.pow(t, 2.2) * 3.2 + Math.sin(t * 9) * 0.12 * (1 - t), Math.sin(t * 3.2) * 0.5)); }
    return new THREE.CatmullRomCurve3(pts);
  }, []);
  const geo = useMemo(() => {
    if (p < 0.01) return null;
    const pts = curve.getPoints(160).slice(0, Math.max(2, Math.round(160 * p)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.07, 14, false);
  }, [p, curve]);
  const tip = curve.getPoint(Math.max(0.001, p));
  return (
    <group rotation={[0.18, -0.25, 0]}>
      {geo && <mesh geometry={geo}><GoldMetal roughness={0.2} /></mesh>}
      {p > 0.01 && (
        <mesh position={tip}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#FFF6E0" emissive={C.glass3D} emissiveIntensity={1.4} />
        </mesh>
      )}
      {[-1.5, -0.7, 0.1, 0.9, 1.7].map((y) => (
        <mesh key={y} position={[0, y, -0.6]}>
          <boxGeometry args={[7.2, 0.008, 0.008]} />
          <meshBasicMaterial color={C.muted} transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
};
export const Ribbon3D: React.FC<{ l: number; at: number; w: number; h: number }> = ({ l, at, w, h }) => (
  <ThreeCanvas width={w} height={h} camera={{ position: [0, 0, 9], fov: 34 }} gl={{ antialias: true, alpha: true }}>
    <Studio />
    <Ribbon l={l} at={at} />
  </ThreeCanvas>
);
