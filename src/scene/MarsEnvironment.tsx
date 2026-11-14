// Decorative Mars environment objects — rockets, equipment, props.
// Purely visual; no hotspot IDs, no interaction, no collision.

import { useRef } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';

// ---------------------------------------------------------------------------
// Palette (matches MarsLandmarks)
// ---------------------------------------------------------------------------

const WHITE = '#ecebe7';
const ORANGE = '#e07b2f';
const METAL = '#9aa3ad';
const DARK = '#3d3f46';
const CYAN = '#38e1ff';

const YELLOW = '#f5c842';
const OLIVE = '#6b6b42';
const TAN = '#b5a68c';

// ---------------------------------------------------------------------------
// Shared Mat helper
// ---------------------------------------------------------------------------

type MaterialProps = ThreeElements['meshStandardMaterial'];

function Mat(props: MaterialProps) {
  return <meshStandardMaterial flatShading roughness={0.75} metalness={0.05} {...props} />;
}

// ---------------------------------------------------------------------------
// A. Rocket Landing Zone — centered at (-4, -10)
// ---------------------------------------------------------------------------

/** Four guide-light positions on the landing pad edges. */
const GUIDE_LIGHT_ANGLES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

function RocketLandingZone() {
  return (
    <group position={[-4, 0, -10]}>
      {/* Landing pad — flat octagon */}
      <mesh position={[0, 0.08, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.15, 8]} />
        <Mat color={DARK} roughness={0.9} />
      </mesh>
      {/* Pad rim ring */}
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.04, 6, 8]} />
        <Mat color={METAL} />
      </mesh>
      {/* Guide lights */}
      {GUIDE_LIGHT_ANGLES.map((angle) => {
        const lx = Math.cos(angle) * 2.3;
        const lz = Math.sin(angle) * 2.3;
        return (
          <mesh key={angle} position={[lx, 0.22, lz]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <Mat color={YELLOW} emissive={YELLOW} emissiveIntensity={0.9} />
          </mesh>
        );
      })}

      {/* --- Rocket --- */}
      <group position={[0, 0.15, 0]}>
        {/* Main body */}
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 4, 12]} />
          <Mat color={WHITE} />
        </mesh>
        {/* Red/orange stripe band at midsection */}
        <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.08, 6, 12]} />
          <Mat color={ORANGE} />
        </mesh>
        {/* Nose cone */}
        <mesh position={[0, 4.6, 0]}>
          <coneGeometry args={[0.6, 1.2, 12]} />
          <Mat color={WHITE} />
        </mesh>
        {/* Engine nozzle at bottom */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.45, 0.55, 0.4, 10]} />
          <Mat color={DARK} roughness={0.9} />
        </mesh>
        {/* Fins — 4 at 90° intervals */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle) => (
          <group key={angle} rotation={[0, angle, 0]}>
            <mesh position={[0.65, 0.35, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.45, 0.8, 0.06]} />
              <Mat color={ORANGE} />
            </mesh>
          </group>
        ))}
      </group>

      {/* --- Support Structures --- */}

      {/* Fuel tank 1 */}
      <group position={[3.2, 0, 0.5]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 1.4, 10]} />
          <Mat color={WHITE} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.35, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat color={WHITE} />
        </mesh>
        {/* Metal band */}
        <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.36, 0.04, 6, 10]} />
          <Mat color={METAL} />
        </mesh>
      </group>

      {/* Fuel tank 2 */}
      <group position={[3.2, 0, -1]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 1.1, 10]} />
          <Mat color={WHITE} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat color={WHITE} />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.31, 0.04, 6, 10]} />
          <Mat color={METAL} />
        </mesh>
      </group>

      {/* Gantry / tower — thin frame */}
      <group position={[-2.8, 0, 0.3]}>
        {/* Vertical legs */}
        <mesh position={[-0.3, 1.5, -0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 3, 6]} />
          <Mat color={METAL} metalness={0.3} />
        </mesh>
        <mesh position={[0.3, 1.5, -0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 3, 6]} />
          <Mat color={METAL} metalness={0.3} />
        </mesh>
        <mesh position={[-0.3, 1.5, 0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 3, 6]} />
          <Mat color={METAL} metalness={0.3} />
        </mesh>
        <mesh position={[0.3, 1.5, 0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 3, 6]} />
          <Mat color={METAL} metalness={0.3} />
        </mesh>
        {/* Crossbar top */}
        <mesh position={[0, 2.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
          <Mat color={METAL} metalness={0.3} />
        </mesh>
        {/* Crossbar mid */}
        <mesh position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
          <Mat color={METAL} metalness={0.3} />
        </mesh>
      </group>

      {/* Supply crates near pad */}
      <mesh position={[1.8, 0.2, 2]}>
        <boxGeometry args={[0.5, 0.4, 0.5]} />
        <Mat color={OLIVE} />
      </mesh>
      <mesh position={[2.5, 0.15, 1.5]}>
        <boxGeometry args={[0.4, 0.3, 0.35]} />
        <Mat color={TAN} />
      </mesh>
      <mesh position={[1.5, 0.15, -1.5]}>
        <boxGeometry args={[0.45, 0.3, 0.4]} />
        <Mat color={DARK} />
      </mesh>
      <mesh position={[-1.8, 0.18, -1.2]}>
        <boxGeometry args={[0.5, 0.35, 0.45]} />
        <Mat color={OLIVE} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// B. Scientific Equipment — scattered around the base
// ---------------------------------------------------------------------------

/**
 * Weather station with a spinning anemometer.
 * Placed at (-2, -5) — clear of all hotspots.
 */
function WeatherStation({ reducedMotion }: { reducedMotion: boolean }) {
  const anemometerRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (anemometerRef.current && !reducedMotion) {
      anemometerRef.current.rotation.y += delta * 2.5;
    }
  });
  return (
    <group position={[-2, 0, -5]}>
      {/* Pole */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.5, 6]} />
        <Mat color={METAL} />
      </mesh>
      {/* Instrument box at base */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.35, 0.4, 0.3]} />
        <Mat color={WHITE} />
      </mesh>
      {/* Anemometer — 3 arms with cup spheres */}
      <group ref={anemometerRef} position={[0, 2.55, 0]}>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle) => {
          const ax = Math.cos(angle) * 0.3;
          const az = Math.sin(angle) * 0.3;
          return (
            <group key={angle}>
              {/* Arm */}
              <mesh
                position={[ax / 2, 0, az / 2]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
                <Mat color={METAL} />
              </mesh>
              {/* Cup */}
              <mesh position={[ax, 0, az]}>
                <sphereGeometry args={[0.05, 6, 4]} />
                <Mat color={WHITE} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/**
 * Two sensor probes — thin spike-cones with blinking tip lights.
 * Positions validated clear of all hotspots.
 */
const PROBE_POSITIONS: readonly [number, number][] = [
  [-10, 1],   // Probe 1 — far west
  [-3, 9],    // Probe 2 — northwest area
];

function SensorProbes({ reducedMotion }: { reducedMotion: boolean }) {
  const light1Ref = useRef<Mesh>(null);
  const light2Ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    if (light1Ref.current) {
      const mat = light1Ref.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = Math.sin(t * 3) > 0 ? 1.2 : 0.1;
    }
    if (light2Ref.current) {
      const mat = light2Ref.current.material as MeshStandardMaterial;
      mat.emissiveIntensity = Math.sin(t * 3 + Math.PI) > 0 ? 1.2 : 0.1;
    }
  });

  return (
    <>
      {PROBE_POSITIONS.map(([px, pz], i) => (
        <group key={i} position={[px, 0, pz]}>
          {/* Spike */}
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.06, 0.8, 6]} />
            <Mat color={METAL} />
          </mesh>
          {/* Blinking tip */}
          <mesh ref={i === 0 ? light1Ref : light2Ref} position={[0, 0.82, 0]}>
            <sphereGeometry args={[0.04, 6, 4]} />
            <Mat color={CYAN} emissive={CYAN} emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/**
 * Equipment cases — 3 flat cases placed near the rocket landing zone (clear of hotspots).
 */
const CASE_DATA: readonly { pos: [number, number, number]; size: [number, number, number]; color: string }[] = [
  { pos: [-3, 0.15, -11], size: [0.6, 0.3, 0.4], color: OLIVE },
  { pos: [-5, 0.15, -11], size: [0.6, 0.3, 0.4], color: TAN },
  { pos: [-5.5, 0.15, -10.5], size: [0.6, 0.3, 0.4], color: DARK },
];

function EquipmentCases() {
  return (
    <>
      {CASE_DATA.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <boxGeometry args={c.size} />
          <Mat color={c.color} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Utility pipes — short horizontal pipe segments at ground level.
 * Placed at (10.5, -6) — clear of oxygen (4.72 > 4.3).
 */
function UtilityPipes() {
  return (
    <group position={[10.5, 0.1, -6]}>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 8]} />
        <Mat color={METAL} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
        <Mat color={METAL} metalness={0.3} />
      </mesh>
      <mesh position={[0.3, 0, -0.3]} rotation={[0, 0.6, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.0, 8]} />
        <Mat color={METAL} metalness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Solar charging station — small angled panel on a pole with cable.
 * Placed at (-1, 10) — clear of rover (4.5 > 4.4), greenhouse (7.43 > 5.1).
 */
function SolarChargingStation() {
  return (
    <group position={[-1, 0, 10]}>
      {/* Pole */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.4, 6]} />
        <Mat color={METAL} />
      </mesh>
      {/* Angled panel */}
      <mesh position={[0, 1.45, 0.1]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[1, 0.03, 0.6]} />
        <Mat color="#2a5bb5" roughness={0.35} metalness={0.3} />
      </mesh>
      {/* Panel frame */}
      <mesh position={[0, 1.42, 0.1]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[1.06, 0.02, 0.66]} />
        <Mat color={METAL} />
      </mesh>
      {/* Cable to ground */}
      <mesh position={[0.35, 0.35, 0.15]}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
        <Mat color={DARK} />
      </mesh>
    </group>
  );
}

/**
 * Collects all scientific equipment sub-components.
 */
function ScientificEquipment({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      <WeatherStation reducedMotion={reducedMotion} />
      <SensorProbes reducedMotion={reducedMotion} />
      <EquipmentCases />
      <UtilityPipes />
      <SolarChargingStation />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface MarsEnvironmentProps {
  reducedMotion: boolean;
}

export default function MarsEnvironment({ reducedMotion }: MarsEnvironmentProps) {
  return (
    <group>
      <RocketLandingZone />
      <ScientificEquipment reducedMotion={reducedMotion} />
    </group>
  );
}
