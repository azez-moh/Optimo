import { useMemo, type ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { MachineType } from '../data/types';
import { MACHINE_FOOTPRINT } from '../data/library';

/*
  Procedural machine kit: 14 Build 8.7 library shapes as simple, recognisable blockouts at real
  footprints (metres, from src/data/library.ts). Never Life Fitness assets, never downloaded models.

  Local frame of every model: origin on the floor at the footprint centre, y up, length along z,
  width along x, the user's front (console / head end) towards -z. Callers place with
  position [x, 0, z] and rotation [0, rot * PI / 180, 0] from the floor data.
  `accent` colours the parts that show state (belt, seat, pedals): pass chartTokens.state.* .
*/

export interface MachineModelProps {
  type: MachineType;
  /** State colour for the moving parts (in use / idle / cooling). */
  accent?: string;
  /** Frame colour. */
  frame?: string;
  /** Soft parts colour (seats, pads, belts when idle). */
  soft?: string;
  /** Draw the footprint rectangle on the floor. */
  showFootprint?: boolean;
  /** Draw the service clearance outline (footprint + clearance on every side). */
  showClearance?: boolean;
  selected?: boolean;
  /** Line colour of footprint and clearance outlines. */
  outline?: string;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

type V3 = [number, number, number];

interface Pal { frame: string; soft: string; accent: string }

function Box({ p, s, c, r }: { p: V3; s: V3; c: string; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.7} metalness={0.15} />
    </mesh>
  );
}

function Cyl({ p, rad, len, c, r = [0, 0, Math.PI / 2] }: { p: V3; rad: number; len: number; c: string; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} castShadow>
      <cylinderGeometry args={[rad, rad, len, 24]} />
      <meshStandardMaterial color={c} roughness={0.6} metalness={0.25} />
    </mesh>
  );
}

/** Vertical post from the floor to a height. */
function Post({ x, z, h, c, t = 0.05, tilt = 0 }: { x: number; z: number; h: number; c: string; t?: number; tilt?: number }) {
  return <Box p={[x, h / 2, z]} s={[t, h, t]} c={c} r={[tilt, 0, 0]} />;
}

function Console({ z, y, w, c, screen }: { z: number; y: number; w: number; c: string; screen: string }) {
  return (
    <group position={[0, y, z]} rotation={[-0.5, 0, 0]}>
      <Box p={[0, 0, 0]} s={[w, 0.05, 0.3]} c={c} />
      <Box p={[0, 0.03, 0]} s={[w * 0.6, 0.01, 0.18]} c={screen} />
    </group>
  );
}

function treadmill(l: number, w: number, h: number, k: Pal, slat = false, incline = 0): ReactNode {
  const deckH = 0.22;
  return (
    <group rotation={[incline, 0, 0]}>
      <Box p={[0, deckH / 2, 0.1]} s={[w, deckH, l - 0.2]} c={k.frame} />
      {slat ? (
        Array.from({ length: 14 }, (_, i) => (
          <Box key={i} p={[0, deckH + 0.01 + Math.sin((i / 13) * Math.PI) * -0.04, -l / 2 + 0.45 + i * ((l - 0.6) / 14)]} s={[w * 0.72, 0.02, (l - 0.6) / 14 - 0.01]} c={k.accent} />
        ))
      ) : (
        <Box p={[0, deckH + 0.01, 0.1]} s={[w * 0.72, 0.02, l - 0.5]} c={k.accent} />
      )}
      <Box p={[w / 2 - 0.05, deckH + 0.03, 0.1]} s={[0.08, 0.04, l - 0.4]} c={k.frame} />
      <Box p={[-w / 2 + 0.05, deckH + 0.03, 0.1]} s={[0.08, 0.04, l - 0.4]} c={k.frame} />
      <Post x={w / 2 - 0.06} z={-l / 2 + 0.2} h={h - 0.1} c={k.frame} t={0.07} />
      <Post x={-w / 2 + 0.06} z={-l / 2 + 0.2} h={h - 0.1} c={k.frame} t={0.07} />
      <Box p={[w / 2 - 0.06, h - 0.45, -l / 2 + 0.45]} s={[0.04, 0.04, 0.5]} c={k.frame} />
      <Box p={[-w / 2 + 0.06, h - 0.45, -l / 2 + 0.45]} s={[0.04, 0.04, 0.5]} c={k.frame} />
      <Console z={-l / 2 + 0.25} y={h - 0.1} w={w - 0.1} c={k.frame} screen={k.accent} />
      <Box p={[0, 0.12, -l / 2 + 0.15]} s={[w, 0.24, 0.3]} c={k.frame} />
    </group>
  );
}

function bike(l: number, w: number, h: number, k: Pal): ReactNode {
  return (
    <group>
      <Box p={[0, 0.04, 0]} s={[w, 0.06, l * 0.9]} c={k.frame} />
      <Cyl p={[0, 0.3, -l / 2 + 0.3]} rad={0.24} len={0.08} c={k.frame} />
      <Box p={[0, 0.45, 0]} s={[0.08, 0.9, 0.08]} c={k.frame} r={[-0.35, 0, 0]} />
      <Box p={[0, 0.88, 0.18]} s={[0.2, 0.06, 0.3]} c={k.soft} />
      <Box p={[0, 0.7, -l / 2 + 0.35]} s={[0.07, 0.95, 0.07]} c={k.frame} r={[0.2, 0, 0]} />
      <Box p={[0, h - 0.12, -l / 2 + 0.2]} s={[0.5, 0.04, 0.12]} c={k.frame} />
      <Cyl p={[0, 0.32, -0.02]} rad={0.1} len={0.36} c={k.accent} />
      <Box p={[0.18, 0.32, -0.02]} s={[0.06, 0.03, 0.22]} c={k.accent} />
      <Box p={[-0.18, 0.32, -0.02]} s={[0.06, 0.03, 0.22]} c={k.accent} />
    </group>
  );
}

function recumbent(l: number, w: number, h: number, k: Pal): ReactNode {
  return (
    <group>
      <Box p={[0, 0.08, 0]} s={[0.18, 0.1, l * 0.95]} c={k.frame} />
      <Box p={[0, 0.06, -l / 2 + 0.1]} s={[w, 0.06, 0.12]} c={k.frame} />
      <Box p={[0, 0.06, l / 2 - 0.1]} s={[w, 0.06, 0.12]} c={k.frame} />
      <Box p={[0, 0.5, 0.35]} s={[0.5, 0.1, 0.45]} c={k.soft} />
      <Box p={[0, 0.85, 0.65]} s={[0.5, 0.6, 0.1]} c={k.soft} r={[-0.25, 0, 0]} />
      <Box p={[0, 0.45, -l / 2 + 0.3]} s={[0.3, 0.7, 0.3]} c={k.frame} />
      <Cyl p={[0, 0.45, -l / 2 + 0.5]} rad={0.08} len={0.42} c={k.accent} />
      <Console z={-l / 2 + 0.25} y={h - 0.1} w={0.45} c={k.frame} screen={k.accent} />
      <Box p={[0.3, 0.6, 0.35]} s={[0.04, 0.04, 0.4]} c={k.frame} />
      <Box p={[-0.3, 0.6, 0.35]} s={[0.04, 0.04, 0.4]} c={k.frame} />
    </group>
  );
}

function elliptical(l: number, w: number, h: number, k: Pal, adaptive = false): ReactNode {
  return (
    <group>
      <Box p={[0, 0.06, 0]} s={[0.2, 0.1, l]} c={k.frame} />
      <Box p={[0, 0.06, l / 2 - 0.15]} s={[w, 0.08, 0.15]} c={k.frame} />
      <Box p={[0, 0.35, -l / 2 + 0.3]} s={[0.36, 0.6, 0.5]} c={k.frame} />
      <Cyl p={[0, 0.4, -l / 2 + 0.3]} rad={0.28} len={0.12} c={k.frame} />
      <Box p={[0.14, 0.32, 0.15]} s={[0.12, 0.04, 0.38]} c={k.accent} />
      <Box p={[-0.14, 0.32, 0.25]} s={[0.12, 0.04, 0.38]} c={k.accent} />
      <Box p={[0.16, 0.25, -0.15]} s={[0.04, 0.04, 0.7]} c={k.frame} r={[0.15, 0, 0]} />
      <Box p={[-0.16, 0.25, -0.1]} s={[0.04, 0.04, 0.7]} c={k.frame} r={[0.15, 0, 0]} />
      <Box p={[0.26, 1.05, -0.2]} s={[0.04, 1.2, 0.04]} c={k.accent} r={[0.3, 0, 0]} />
      <Box p={[-0.26, 1.05, -0.3]} s={[0.04, 1.2, 0.04]} c={k.accent} r={[0.2, 0, 0]} />
      <Post x={0} z={-l / 2 + 0.45} h={h - 0.2} c={k.frame} t={0.08} />
      <Console z={-l / 2 + 0.45} y={h - 0.1} w={0.45} c={k.frame} screen={k.accent} />
      {adaptive && <Box p={[0, 0.8, -l / 2 + 0.2]} s={[0.5, 0.9, 0.1]} c={k.frame} />}
    </group>
  );
}

function stairClimber(l: number, w: number, h: number, k: Pal): ReactNode {
  return (
    <group>
      <Box p={[0, 0.05, 0]} s={[w, 0.1, l]} c={k.frame} />
      <Box p={[0, 0.75, -l / 2 + 0.2]} s={[w * 0.9, 1.4, 0.35]} c={k.frame} />
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} p={[0, 0.2 + i * 0.2, l / 2 - 0.25 - i * 0.14]} s={[w * 0.6, 0.04, 0.24]} c={i % 2 ? k.accent : k.soft} />
      ))}
      <Box p={[w / 2 - 0.04, 1.0, 0]} s={[0.04, 0.04, l * 0.8]} c={k.frame} />
      <Box p={[-w / 2 + 0.04, 1.0, 0]} s={[0.04, 0.04, l * 0.8]} c={k.frame} />
      <Post x={w / 2 - 0.04} z={l / 2 - 0.1} h={1.0} c={k.frame} />
      <Post x={-w / 2 + 0.04} z={l / 2 - 0.1} h={1.0} c={k.frame} />
      <Console z={-l / 2 + 0.3} y={h - 0.1} w={w - 0.2} c={k.frame} screen={k.accent} />
    </group>
  );
}

function rower(l: number, w: number, h: number, k: Pal): ReactNode {
  return (
    <group>
      <Box p={[0, 0.25, 0.15]} s={[0.12, 0.06, l - 0.4]} c={k.frame} r={[0.04, 0, 0]} />
      <Box p={[0, 0.12, l / 2 - 0.1]} s={[w, 0.06, 0.1]} c={k.frame} />
      <Box p={[0, 0.3, -l / 2 + 0.3]} s={[0.36, 0.5, 0.5]} c={k.frame} />
      <Cyl p={[0, 0.35, -l / 2 + 0.3]} rad={0.25} len={0.3} c={k.frame} />
      <Box p={[0, 0.36, 0.2]} s={[0.3, 0.06, 0.3]} c={k.accent} />
      <Box p={[0.15, 0.22, -l / 2 + 0.75]} s={[0.12, 0.03, 0.25]} c={k.soft} r={[-0.6, 0, 0]} />
      <Box p={[-0.15, 0.22, -l / 2 + 0.75]} s={[0.12, 0.03, 0.25]} c={k.soft} r={[-0.6, 0, 0]} />
      <Box p={[0, 0.62, -l / 2 + 0.55]} s={[0.45, 0.03, 0.03]} c={k.accent} />
      <Post x={0} z={-l / 2 + 0.6} h={h - 0.15} c={k.frame} t={0.04} tilt={-0.4} />
      <Box p={[0, h - 0.1, -l / 2 + 0.85]} s={[0.22, 0.14, 0.03]} c={k.frame} r={[-0.4, 0, 0]} />
    </group>
  );
}

function ube(l: number, w: number, h: number, k: Pal): ReactNode {
  return (
    <group>
      <Box p={[0, 0.04, 0]} s={[w, 0.06, l]} c={k.frame} />
      <Box p={[0, 0.6, -l / 2 + 0.25]} s={[0.25, 1.1, 0.25]} c={k.frame} />
      <Cyl p={[0, 1.1, -l / 2 + 0.45]} rad={0.12} len={0.2} c={k.frame} r={[Math.PI / 2, 0, 0]} />
      <Box p={[0.18, 1.1, -l / 2 + 0.55]} s={[0.04, 0.3, 0.04]} c={k.accent} />
      <Box p={[-0.18, 1.1, -l / 2 + 0.55]} s={[0.04, 0.3, 0.04]} c={k.accent} />
      <Box p={[0, 0.5, l / 2 - 0.3]} s={[0.45, 0.08, 0.4]} c={k.soft} />
      <Post x={0} z={l / 2 - 0.3} h={0.48} c={k.frame} t={0.07} />
      <Console z={-l / 2 + 0.2} y={h - 0.05} w={0.35} c={k.frame} screen={k.accent} />
    </group>
  );
}

function bench(l: number, w: number, h: number, k: Pal, incline = false): ReactNode {
  return (
    <group>
      <Box p={[0, 0.2, 0.2]} s={[0.12, 0.3, l * 0.7]} c={k.frame} />
      <Box p={[0, 0.06, l / 2 - 0.1]} s={[0.5, 0.06, 0.08]} c={k.frame} />
      {incline ? (
        <>
          <Box p={[0, 0.52, -0.05]} s={[0.3, 0.07, 0.75]} c={k.soft} r={[0.55, 0, 0]} />
          <Box p={[0, 0.45, 0.45]} s={[0.3, 0.07, 0.3]} c={k.soft} />
        </>
      ) : (
        <Box p={[0, 0.44, 0.2]} s={[0.3, 0.08, 1.2]} c={k.soft} />
      )}
      <Post x={w / 2 - 0.25} z={-l / 2 + 0.2} h={h} c={k.frame} t={0.07} />
      <Post x={-w / 2 + 0.25} z={-l / 2 + 0.2} h={h} c={k.frame} t={0.07} />
      <Box p={[0, h - 0.25, -l / 2 + 0.25]} s={[w - 0.1, 0.03, 0.03]} c={k.accent} />
      <Cyl p={[w / 2 - 0.08, h - 0.25, -l / 2 + 0.25]} rad={0.2} len={0.05} c={k.frame} />
      <Cyl p={[-w / 2 + 0.08, h - 0.25, -l / 2 + 0.25]} rad={0.2} len={0.05} c={k.frame} />
      <Box p={[0, 0.03, -l / 2 + 0.2]} s={[w - 0.4, 0.06, 0.15]} c={k.frame} />
    </group>
  );
}

function preacher(l: number, w: number, k: Pal, standing = false): ReactNode {
  return (
    <group>
      <Box p={[0, 0.04, 0]} s={[w * 0.8, 0.06, l]} c={k.frame} />
      {!standing && <Box p={[0, 0.55, l / 2 - 0.3]} s={[0.4, 0.08, 0.35]} c={k.soft} />}
      {!standing && <Post x={0} z={l / 2 - 0.3} h={0.52} c={k.frame} t={0.07} />}
      {standing && <Box p={[0, 0.1, l / 2 - 0.3]} s={[0.6, 0.12, 0.4]} c={k.soft} />}
      <Post x={0} z={-l / 2 + 0.35} h={standing ? 1.05 : 0.85} c={k.frame} t={0.08} />
      <Box p={[0, standing ? 1.15 : 0.95, -l / 2 + 0.35]} s={[0.55, 0.07, 0.35]} c={k.soft} r={[0.75, 0, 0]} />
      <Box p={[0, standing ? 1.05 : 0.85, -l / 2 + 0.1]} s={[w * 0.75, 0.03, 0.03]} c={k.accent} />
      <Cyl p={[w * 0.38, standing ? 1.05 : 0.85, -l / 2 + 0.1]} rad={0.08} len={0.04} c={k.frame} />
      <Cyl p={[-w * 0.38, standing ? 1.05 : 0.85, -l / 2 + 0.1]} rad={0.08} len={0.04} c={k.frame} />
    </group>
  );
}

function Outline({ l, w, color, y = 0.005, dashed }: { l: number; w: number; color: string; y?: number; dashed?: boolean }) {
  const pts = useMemo(() => new Float32Array([
    -w / 2, y, -l / 2, w / 2, y, -l / 2, w / 2, y, l / 2, -w / 2, y, l / 2, -w / 2, y, -l / 2,
  ]), [l, w, y]);
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      {dashed ? <lineDashedMaterial color={color} dashSize={0.15} gapSize={0.1} /> : <lineBasicMaterial color={color} />}
    </line>
  );
}

/** One machine at its real footprint. */
export function MachineModel({
  type, accent = '#fcea10', frame = '#3a4341', soft = '#1f2726', showFootprint, showClearance, selected, outline = '#8f9a97',
  onClick, onPointerOver, onPointerOut,
}: MachineModelProps) {
  const fp = MACHINE_FOOTPRINT[type];
  const { l, w, h } = fp;
  const k: Pal = { frame, soft, accent };
  let body: ReactNode;
  switch (type) {
    case 'treadmill': body = treadmill(l, w, h, k); break;
    case 'slat-treadmill': body = treadmill(l, w, h, k, true); break;
    case 'incline-treadmill': body = treadmill(l, w, h, k, false, -0.12); break;
    case 'indoor-bike': body = bike(l, w, h, k); break;
    case 'recumbent-bike': body = recumbent(l, w, h, k); break;
    case 'elliptical': body = elliptical(l, w, h, k); break;
    case 'adaptive-cross-trainer': body = elliptical(l, w, h, k, true); break;
    case 'stair-climber': body = stairClimber(l, w, h, k); break;
    case 'rower': body = rower(l, w, h, k); break;
    case 'upper-body-ergometer': body = ube(l, w, h, k); break;
    case 'flat-bench': body = bench(l, w, h, k); break;
    case 'incline-bench': body = bench(l, w, h, k, true); break;
    case 'preacher-curl': body = preacher(l, w, k); break;
    case 'standing-preacher': body = preacher(l, w, k, true); break;
  }
  return (
    <group onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {body}
      {(showFootprint || selected) && <Outline l={l} w={w} color={selected ? accent : outline} />}
      {showClearance && <Outline l={l + 2 * 0.6} w={w + 2 * 0.6} color={outline} dashed />}
    </group>
  );
}

/** Footprint in metres for a type (length along the user, width, height). */
export function footprintOf(type: MachineType) {
  return MACHINE_FOOTPRINT[type];
}

export const MACHINE_TYPES = Object.keys(MACHINE_FOOTPRINT) as MachineType[];
