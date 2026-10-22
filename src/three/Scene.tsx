import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useTheme } from '../theme/theme';

/*
  Shared 3D stage: canvas, lights, optional grid, orbit controls helper.
  Usage: <Scene camera={[8, 10, 14]} target={[0, 0, 6]}><MachineModel type="treadmill" /></Scene>
  `mode="2d"` gives a top-down orthographic-like view (camera straight above, rotation locked).
*/

export interface SceneProps {
  children: ReactNode;
  camera?: [number, number, number];
  target?: [number, number, number];
  fov?: number;
  height?: number | string;
  grid?: boolean;
  gridSize?: [number, number];
  mode?: '3d' | '2d';
  autoRotate?: boolean;
  /** Allow zoom with the mouse wheel (off by default so the page scrolls). */
  wheelZoom?: boolean;
  minDistance?: number;
  maxDistance?: number;
  className?: string;
  ariaLabel: string;
}

export function sceneColors(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? { bg: '#050f0d', floor: '#0b1513', grid: '#1a2624', gridStrong: '#2a3634', wall: '#111c1a', frame: '#3a4341', soft: '#1f2726', outline: '#8f9a97', label: '#ffffff' }
    : { bg: '#f0f0ee', floor: '#ffffff', grid: '#e2e3e1', gridStrong: '#c9cbc9', wall: '#e9e9e9', frame: '#6b7270', soft: '#c9cbc9', outline: '#6b6f6e', label: '#020c0a' };
}

export function Scene({
  children, camera = [8, 9, 12], target = [0, 0, 0], fov = 40, height = 420, grid = true, gridSize = [50, 50], mode = '3d',
  autoRotate, wheelZoom = false, minDistance = 2, maxDistance = 60, className = '', ariaLabel,
}: SceneProps) {
  const { theme } = useTheme();
  const c = sceneColors(theme);
  const cam: [number, number, number] = mode === '2d' ? [target[0], Math.max(18, camera[1] * 1.6), target[2] + 0.001] : camera;
  return (
    <div className={`scene ${className}`.trim()} style={{ height, background: c.bg, position: 'relative' }} role="img" aria-label={ariaLabel}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: cam, fov }} key={mode}>
        <color attach="background" args={[c.bg]} />
        <hemisphereLight args={[theme === 'dark' ? '#cfd8d6' : '#ffffff', theme === 'dark' ? '#0b1513' : '#d9d9d6', theme === 'dark' ? 0.55 : 0.9]} />
        <directionalLight position={[5, 10, 7]} intensity={theme === 'dark' ? 1.1 : 1.4} castShadow shadow-mapSize={[1024, 1024]} />
        <Suspense fallback={null}>
          {grid && (
            <Grid args={gridSize} position={[target[0], 0, target[2]]} cellSize={1} sectionSize={5} cellColor={c.grid} sectionColor={c.gridStrong}
              cellThickness={0.6} sectionThickness={1} fadeDistance={80} infiniteGrid={false} />
          )}
          {children}
        </Suspense>
        <OrbitControls makeDefault target={target} enableRotate={mode === '3d'} enableZoom={wheelZoom} enablePan
          autoRotate={autoRotate} autoRotateSpeed={0.6} minDistance={minDistance} maxDistance={maxDistance} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
    </div>
  );
}
