import React, { useLayoutEffect } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { AXIS, STAGES, Stage, StageMesh, useSaturn } from "./model";

export type Cam = { az: number; el: number; d: number; ty: number; fov?: number; roll?: number };
export type Pose = { ex: Partial<Record<Stage, number>>; glow: Partial<Record<Stage, number>>; ghost: Partial<Record<Stage, number>>; dim?: Partial<Record<Stage, number>>; spin?: number; spot?: { pos: [number, number, number]; color: string; i: number } };

/** locked-to-frame camera: spherical orbit around (0,ty,0). Everything is a function of the props (= of the frame). */
const Rig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const p = camera as THREE.PerspectiveCamera;
    const cy = Math.cos(cam.el), sy = Math.sin(cam.el);
    p.position.set(Math.sin(cam.az) * cy * cam.d, cam.ty + sy * cam.d, Math.cos(cam.az) * cy * cam.d);
    p.up.set(0, 1, 0); p.lookAt(0, cam.ty, 0);
    if (cam.roll) p.rotateZ(cam.roll);
    p.fov = cam.fov ?? 30; p.near = 0.5; p.far = 120; p.updateProjectionMatrix();
  });
  return null;
};

const Lights: React.FC<{ warm: number }> = ({ warm }) => (
  <>
    <ambientLight intensity={0.22} color="#8fb3d1" />
    {/* key: warm, upper right-front */}
    <directionalLight position={[6, 9, 7]} intensity={2.3} color="#ffe2bd" />
    {/* rim: cool, behind left — carves the silhouette off the dark background */}
    <directionalLight position={[-7, 4, -6]} intensity={3.2} color="#7fd3ff" />
    {/* low amber kick from below (engine glow bounce) */}
    <directionalLight position={[2, -8, 3]} intensity={0.5 + 0.8 * warm} color="#ffa23a" />
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={2.2} position={[0, 6, 5]} scale={[10, 1.4, 1]} color="#fff3e0" />
      <Lightformer intensity={2.8} position={[-6, 1, -3]} rotation-y={Math.PI / 2.4} scale={[1, 12, 1]} color="#8fd8ff" />
      <Lightformer intensity={1.6} position={[6, 0, -2]} rotation-y={-Math.PI / 2.4} scale={[1, 12, 1]} color="#ffbd6e" />
    </Environment>
  </>
);

export const Rocket3D: React.FC<{ w: number; h: number; cam: Cam; pose: Pose; warm?: number }> = ({ w, h, cam, pose, warm = 0 }) => {
  const data = useSaturn();
  return (
    <ThreeCanvas width={w} height={h} camera={{ position: [0, 4, 30], fov: cam.fov ?? 30 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} dpr={1}>
      <Rig cam={cam} />
      <Lights warm={warm} />
      {pose.spot && pose.spot.i > 0.01 && <pointLight position={pose.spot.pos} color={pose.spot.color} intensity={pose.spot.i} distance={9} decay={1.6} />}
      {data && (
        <group position={[-AXIS.x, 0, -AXIS.z]} rotation={[0, pose.spin ?? 0, 0]}>
          {/* rotate about the rocket's own axis: wrap so the pivot is the axis */}
          {STAGES.map((s) => (
            <StageMesh key={s} parts={data.parts} stage={s} y={pose.ex[s] ?? 0} glow={pose.glow[s] ?? 0} ghost={pose.ghost[s] ?? 0} dim={pose.dim?.[s] ?? 0} />
          ))}
        </group>
      )}
    </ThreeCanvas>
  );
};
