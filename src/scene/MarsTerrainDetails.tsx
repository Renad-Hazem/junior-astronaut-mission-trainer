// Terrain decoration: small craters, scattered stones, rover tracks, and dust patches.
// All objects are static and deterministic — no useFrame animations.

import { useEffect, useMemo, useRef } from 'react';
import {
  Color,
  DodecahedronGeometry,
  Euler,
  InstancedMesh as InstancedMeshClass,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three';
import { HOTSPOTS, ROCKS, PLAYER_SPAWN, MAP_HALF_SIZE } from './sceneConfig';
import { createRandom } from './sceneMath';

interface MarsTerrainDetailsProps {
  reducedMotion: boolean;
}

// ---------------------------------------------------------------------------
// Crater generation (7 craters, seed 20261114)
// ---------------------------------------------------------------------------

interface CraterLayout {
  x: number;
  z: number;
  radius: number;
}

function generateCraters(): CraterLayout[] {
  const random = createRandom(20261114);
  const craters: CraterLayout[] = [];
  let attempts = 0;
  while (craters.length < 7 && attempts < 400) {
    attempts += 1;
    const x = (random() * 2 - 1) * (MAP_HALF_SIZE - 1);
    const z = (random() * 2 - 1) * (MAP_HALF_SIZE - 1);
    const radius = 0.5 + random() * 1.0; // 0.5-1.5

    const clearOfHotspots = HOTSPOTS.every(
      (h) => Math.hypot(x - h.x, z - h.z) > h.interactRadius + 1,
    );
    const clearOfSpawn = Math.hypot(x - PLAYER_SPAWN.x, z - PLAYER_SPAWN.z) > 3;
    const clearOfCraters = craters.every(
      (c) => Math.hypot(x - c.x, z - c.z) > c.radius + radius + 0.5,
    );
    if (!clearOfHotspots || !clearOfSpawn || !clearOfCraters) continue;
    craters.push({ x, z, radius });
  }
  return craters;
}

const CRATERS = generateCraters();

// ---------------------------------------------------------------------------
// Surface stone generation (25 tiny stones, seed 777)
// ---------------------------------------------------------------------------

interface StoneLayout {
  x: number;
  z: number;
  scale: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  tint: number; // 0-1 for color interpolation
}

function generateStones(): StoneLayout[] {
  const random = createRandom(777);
  const stones: StoneLayout[] = [];
  let attempts = 0;
  while (stones.length < 25 && attempts < 600) {
    attempts += 1;
    const x = (random() * 2 - 1) * MAP_HALF_SIZE;
    const z = (random() * 2 - 1) * MAP_HALF_SIZE;
    const scale = 0.08 + random() * 0.12; // 0.08-0.20

    const clearOfHotspots = HOTSPOTS.every(
      (h) => Math.hypot(x - h.x, z - h.z) > h.interactRadius + 0.5,
    );
    const clearOfSpawn = Math.hypot(x - PLAYER_SPAWN.x, z - PLAYER_SPAWN.z) > 2;
    const clearOfRocks = ROCKS.every(
      (r) => Math.hypot(x - r.x, z - r.z) > 1.5,
    );
    const clearOfStones = stones.every(
      (s) => Math.hypot(x - s.x, z - s.z) > 0.6,
    );
    if (!clearOfHotspots || !clearOfSpawn || !clearOfRocks || !clearOfStones) continue;

    stones.push({
      x,
      z,
      scale,
      rotX: random() * Math.PI,
      rotY: random() * Math.PI,
      rotZ: random() * Math.PI,
      tint: random(),
    });
  }
  return stones;
}

const STONES = generateStones();

// ---------------------------------------------------------------------------
// Rover tracks — pairs of thin parallel boxes from rover toward habitat
// ---------------------------------------------------------------------------

interface TrackSegment {
  x: number;
  z: number;
  rotY: number;
  length: number;
}

// Rover at (3.5, 10), habitat at (0, 0). Heading roughly toward habitat.
const ROVER_TRACKS: TrackSegment[] = [
  { x: 3.2, z: 8.5, rotY: Math.atan2(3.5, 10) + 0.05, length: 3.0 },
  { x: 2.5, z: 6.0, rotY: Math.atan2(3.5, 10) - 0.08, length: 2.5 },
  { x: 1.8, z: 3.8, rotY: Math.atan2(3.5, 10) + 0.12, length: 2.0 },
];

// ---------------------------------------------------------------------------
// Dust patches near base structures
// ---------------------------------------------------------------------------

interface DustPatch {
  x: number;
  z: number;
  radius: number;
  opacity: number;
}

const DUST_PATCHES: DustPatch[] = [
  { x: 0, z: 0.5, radius: 2.8, opacity: 0.18 },    // near habitat
  { x: -8, z: -4.5, radius: 2.2, opacity: 0.2 },   // near solar array
  { x: 3.5, z: 9.5, radius: 1.8, opacity: 0.22 },  // near rover / landing zone
  { x: -6, z: 5.5, radius: 2.0, opacity: 0.15 },   // near greenhouse
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CRATER_COLOR = '#6e3422';
const TRACK_COLOR = '#5a2e1a';
const STONE_DARK = new Color('#6e3422');
const STONE_LIGHT = new Color('#9b5338');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarsTerrainDetails({ reducedMotion = false }: MarsTerrainDetailsProps) {
  void reducedMotion;
  const instancedRef = useRef<InstancedMeshClass>(null);

  // Shared stone geometry
  const stoneGeo = useMemo(() => new DodecahedronGeometry(1, 0), []);

  // Build instanced transforms and colors
  const stoneColors = useMemo(() => {
    return STONES.map((s) => {
      const c = STONE_DARK.clone().lerp(STONE_LIGHT, s.tint);
      return `#${c.getHexString()}`;
    });
  }, []);

  // Set instanced mesh matrices after mount
  useEffect(() => {
    const mesh = instancedRef.current;
    if (!mesh) return;
    const mat = new Matrix4();
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    const col = new Color();

    for (let i = 0; i < STONES.length; i++) {
      const s = STONES[i];
      pos.set(s.x, s.scale * 0.35, s.z);
      quat.setFromEuler(new Euler(s.rotX, s.rotY, s.rotZ));
      scl.set(s.scale, s.scale * 0.75, s.scale);
      mat.compose(pos, quat, scl);
      mesh.setMatrixAt(i, mat);
      col.set(stoneColors[i]);
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [stoneColors]);

  // Dispose geometry on unmount
  useEffect(() => () => stoneGeo.dispose(), [stoneGeo]);

  const craterData = useMemo(() => CRATERS, []);
  const trackData = useMemo(() => ROVER_TRACKS, []);
  const dustData = useMemo(() => DUST_PATCHES, []);

  return (
    <group>
      {/* Small Craters — flat torus rings on the ground */}
      {craterData.map((crater, i) => (
        <mesh
          key={`crater-${i}`}
          position={[crater.x, 0.02, crater.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[crater.radius, 0.06, 6, 20]} />
          <meshStandardMaterial color={CRATER_COLOR} flatShading roughness={1} />
        </mesh>
      ))}

      {/* Scattered Surface Stones — InstancedMesh with per-instance color */}
      <instancedMesh
        ref={instancedRef}
        args={[stoneGeo, undefined!, STONES.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial vertexColors flatShading roughness={1} />
      </instancedMesh>

      {/* Rover Tracks — pairs of thin parallel boxes */}
      {trackData.map((track, i) => (
        <group key={`track-${i}`} position={[track.x, 0.02, track.z]} rotation={[0, track.rotY, 0]}>
          <mesh position={[-0.35, 0, 0]}>
            <boxGeometry args={[0.15, 0.02, track.length]} />
            <meshStandardMaterial color={TRACK_COLOR} flatShading roughness={1} />
          </mesh>
          <mesh position={[0.35, 0, 0]}>
            <boxGeometry args={[0.15, 0.02, track.length]} />
            <meshStandardMaterial color={TRACK_COLOR} flatShading roughness={1} />
          </mesh>
        </group>
      ))}

      {/* Dust Ground Patches — flat transparent circles */}
      {dustData.map((patch, i) => (
        <mesh
          key={`dust-${i}`}
          position={[patch.x, 0.01, patch.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[patch.radius, 20]} />
          <meshStandardMaterial
            color="#a85237"
            transparent
            opacity={patch.opacity}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}
