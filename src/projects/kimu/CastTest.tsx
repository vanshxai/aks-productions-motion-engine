import React from "react";
import { AbsoluteFill } from "remotion";
import { Person, KIMU, DAD, MOM, UNCLE, Pose, Spec } from "../../studio/Person";

/** Dev tool: cast line-up + expression sheet. Render with: npx remotion still src/index.ts Kimu-CastTest out.png */
const EXPR: [string, Pose][] = [
  ["calm", { mouth: "smile" }],
  ["angry", { mouth: "shout", open: 1, brow: -0.2, browTilt: -0.9, lid: 0.35, lidTilt: -1, vein: 1, handR: "fist" }],
  ["terrified", { mouth: "o", eyes: "wide", pupil: 0.45, brow: 0.9, browTilt: 0.8, pale: 1, sweat: 1 }],
  ["sad", { mouth: "sad", lid: 0.35, lidTilt: 0.9, browTilt: 0.9, brow: 0.2, tear: 1, eyes: "down" }],
  ["grit", { mouth: "grit", lid: 0.3, lidTilt: -0.8, browTilt: -0.7, vein: 0.6 }],
  ["nervous", { mouth: "wavy", eyes: "wide", pupil: 0.7, lookX: 1, sweat: 0.8, browTilt: 0.6, brow: 0.5 }],
];
const Cell: React.FC<{ spec: Spec; x: number; y: number; label: string; pose: Pose }> = ({ spec, x, y, label, pose }) => (
  <g>
    <Person spec={spec} x={x} y={y} scale={0.34} pose={{ ...pose }} hideLegs />
    <text x={x} y={y + 22} textAnchor="middle" fontFamily="sans-serif" fontSize="22" fill="#fff">{label}</text>
  </g>
);
export const CastTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#26304F" }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {[KIMU, DAD, MOM, UNCLE].map((s, i) => <Person key={s.id} spec={s} x={140 + i * 266} y={520} scale={0.62} pose={{ mouth: "smile", legL: i === 0 ? 14 : 0, kneeL: i === 0 ? 30 : 0, legR: i === 0 ? -10 : 0 }} />)}
      {[KIMU, DAD].map((s, r) =>
        EXPR.map(([n, p], i) => <Cell key={s.id + n} spec={s} x={90 + (i % 3) * 330 + (i % 3 === 0 ? 40 : 0) } y={760 + r * 560 + Math.floor(i / 3) * 280} label={s.id + " · " + n} pose={p} />))}
    </svg>
  </AbsoluteFill>
);
