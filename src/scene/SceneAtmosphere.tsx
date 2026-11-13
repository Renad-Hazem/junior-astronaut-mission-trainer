import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  type AmbientLight,
  type BufferGeometry,
  type DirectionalLight,
  type Fog,
  type Points,
  type PointsMaterial,
} from 'three';
import type { SceneStatus } from '../game/types';
import { STATUS_VISUALS } from './sceneConfig';
import { createRandom, dampFactor } from './sceneMath';

interface SceneAtmosphereProps {
  status: SceneStatus;
  reducedMotion: boolean;
}

const COLOR_TARGETS = Object.fromEntries(
  Object.entries(STATUS_VISUALS).map(([key, v]) => [
    key,
    { sky: new Color(v.sky), ambient: new Color(v.ambientColor), sun: new Color(v.sunColor) },
  ]),
) as Record<SceneStatus, { sky: Color; ambient: Color; sun: Color }>;

/** Status transitions blend over ~1s (instant with reduced motion) so the screen never flashes black. */
const TRANSITION_LAMBDA = 2.5;

/**
 * Sky, fog and lighting driven purely by `status`. Visual only — no gameplay logic.
 * One ambient + one directional light (plus a soft hemisphere fill), no shadow maps.
 */
export default function SceneAtmosphere({ status, reducedMotion }: SceneAtmosphereProps) {
  // Initial values only; later status changes are blended imperatively in useFrame.
  const [initial] = useState(() => STATUS_VISUALS[status]);
  const backgroundRef = useRef<Color>(null);
  const fogRef = useRef<Fog>(null);
  const ambientRef = useRef<AmbientLight>(null);
  const sunRef = useRef<DirectionalLight>(null);

  useFrame((_, delta) => {
    const visual = STATUS_VISUALS[status];
    const colors = COLOR_TARGETS[status];
    const k = reducedMotion ? 1 : dampFactor(TRANSITION_LAMBDA, delta);
    backgroundRef.current?.lerp(colors.sky, k);
    const fog = fogRef.current;
    if (fog) {
      fog.color.lerp(colors.sky, k);
      fog.near += (visual.fogNear - fog.near) * k;
      fog.far += (visual.fogFar - fog.far) * k;
    }
    const ambient = ambientRef.current;
    if (ambient) {
      ambient.color.lerp(colors.ambient, k);
      ambient.intensity += (visual.ambientIntensity - ambient.intensity) * k;
    }
    const sun = sunRef.current;
    if (sun) {
      sun.color.lerp(colors.sun, k);
      sun.intensity += (visual.sunIntensity - sun.intensity) * k;
    }
  });

  return (
    <>
      <color ref={backgroundRef} attach="background" args={[initial.sky]} />
      <fog ref={fogRef} attach="fog" args={[initial.sky, initial.fogNear, initial.fogFar]} />
      <ambientLight ref={ambientRef} color={initial.ambientColor} intensity={initial.ambientIntensity} />
      <hemisphereLight args={['#ffe9d6', '#7a3a24', 0.35]} />
      <directionalLight ref={sunRef} position={[10, 18, 6]} color={initial.sunColor} intensity={initial.sunIntensity} />
      <DustParticles active={STATUS_VISUALS[status].dust} reducedMotion={reducedMotion} />
    </>
  );
}

// ---------------------------------------------------------------------------

const DUST_COUNT = 700;
const DUST_HALF_EXTENT = 24;
const DUST_HEIGHT = 6;
const DUST_OPACITY = 0.75;
const WIND_SPEED = 2.2;

function buildDustPositions(): Float32Array {
  const random = createRandom(4242);
  const positions = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i += 1) {
    positions[i * 3] = (random() * 2 - 1) * DUST_HALF_EXTENT;
    positions[i * 3 + 1] = 0.2 + random() * DUST_HEIGHT;
    positions[i * 3 + 2] = (random() * 2 - 1) * DUST_HALF_EXTENT;
  }
  return positions;
}

/** Lightweight drifting dust for the `dust` status; static (but still visible) with reduced motion. */
function DustParticles({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const positions = useMemo(() => buildDustPositions(), []);
  const pointsRef = useRef<Points>(null);
  const geometryRef = useRef<BufferGeometry>(null);
  const materialRef = useRef<PointsMaterial>(null);

  useFrame((state, delta) => {
    const material = materialRef.current;
    const points = pointsRef.current;
    if (!material || !points) return;
    const targetOpacity = active ? DUST_OPACITY : 0;
    material.opacity += (targetOpacity - material.opacity) * (reducedMotion ? 1 : dampFactor(2.5, delta));
    points.visible = material.opacity > 0.01;
    if (!points.visible || reducedMotion) return;

    const attribute = geometryRef.current?.getAttribute('position');
    if (!attribute) return;
    const array = attribute.array as Float32Array;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    for (let i = 0; i < DUST_COUNT; i += 1) {
      const ix = i * 3;
      let x = array[ix] + WIND_SPEED * dt * (0.7 + (i % 5) * 0.12);
      if (x > DUST_HALF_EXTENT) x -= DUST_HALF_EXTENT * 2;
      array[ix] = x;
      array[ix + 1] += Math.sin(t * 1.3 + i) * 0.15 * dt;
    }
    attribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} visible={false} frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#f0bf92"
        size={3}
        sizeAttenuation={false}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  );
}
