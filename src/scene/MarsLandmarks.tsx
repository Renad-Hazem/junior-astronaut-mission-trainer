// Low-poly, primitive-built models for the seven mission systems.
// Models are purely visual; placement and interaction live in MarsBase / SceneHotspot.

import { useRef } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { DoubleSide, type Group } from 'three';

const WHITE = '#ecebe7';
const OFF_WHITE = '#f6f4f0';
const ORANGE = '#e07b2f';
const METAL = '#9aa3ad';
const DARK = '#3d3f46';
const PORTHOLE = '#7cc8f2';
const CYAN = '#38e1ff';

type MaterialProps = ThreeElements['meshStandardMaterial'];

function Mat(props: MaterialProps) {
  return <meshStandardMaterial flatShading roughness={0.75} metalness={0.05} {...props} />;
}

// ---------------------------------------------------------------------------

const PORTHOLE_ANGLES = [-1.1, -0.4, 0.4, 1.1, 2.6, 3.7];

export function Habitat({ shield }: { shield: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[2.2, 2.3, 1.4, 16]} />
        <Mat color={WHITE} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[2.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={OFF_WHITE} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.22, 0.08, 6, 32]} />
        <Mat color={ORANGE} />
      </mesh>
      {PORTHOLE_ANGLES.map((angle) => (
        <group key={angle} rotation={[0, angle, 0]}>
          <mesh position={[0, 0.85, 2.26]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.12, 12]} />
            <Mat color={PORTHOLE} emissive={PORTHOLE} emissiveIntensity={0.35} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* Airlock and door facing local +Z */}
      <mesh position={[0, 0.6, 2.5]}>
        <boxGeometry args={[1.2, 1.2, 1.0]} />
        <Mat color={WHITE} />
      </mesh>
      <mesh position={[0, 0.55, 3.01]}>
        <boxGeometry args={[0.7, 0.95, 0.04]} />
        <Mat color="#5a6270" />
      </mesh>
      <mesh position={[0, 3.62, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.2, 10]} />
        <Mat color={METAL} />
      </mesh>
      {shield && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[3.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#c58bff"
            emissive="#a56bff"
            emissiveIntensity={0.4}
            transparent
            opacity={0.18}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------

const PANEL_X = [-2.175, -0.725, 0.725, 2.175];

export function SolarArray({ dusty }: { dusty: boolean }) {
  const panelColor = dusty ? '#8d7563' : '#2a5bb5';
  return (
    <group>
      {PANEL_X.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 1.0, 6]} />
            <Mat color={METAL} />
          </mesh>
          <group position={[0, 1.1, 0]} rotation={[-0.55, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.38, 0.04, 1.98]} />
              <Mat color="#cfd6de" metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[1.28, 0.03, 1.88]} />
              <Mat color={panelColor} roughness={0.35} metalness={0.3} />
            </mesh>
          </group>
        </group>
      ))}
      <mesh position={[0, 0.25, 1.35]}>
        <boxGeometry args={[0.6, 0.5, 0.4]} />
        <Mat color={WHITE} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

export function OxygenUnit({ alert, reducedMotion }: { alert: boolean; reducedMotion: boolean }) {
  const iconRef = useRef<Group>(null);
  useFrame((state) => {
    if (!iconRef.current) return;
    iconRef.current.position.y = reducedMotion ? 3.3 : 3.3 + Math.sin(state.clock.elapsedTime * 1.6) * 0.12;
  });
  const bandColor = alert ? '#ff9f43' : METAL;
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.4, 0.2, 1.8]} />
        <Mat color={METAL} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, 0, -0.1]}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 2.0, 14]} />
            <Mat color={OFF_WHITE} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.45, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color={OFF_WHITE} />
          </mesh>
          {[0.8, 1.6].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.46, 0.05, 6, 20]} />
              <Mat color={bandColor} emissive={alert ? bandColor : '#000000'} emissiveIntensity={alert ? 0.6 : 0} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Control panel with cyan gauge */}
      <mesh position={[0, 0.75, 0.55]}>
        <boxGeometry args={[0.55, 0.8, 0.2]} />
        <Mat color={WHITE} />
      </mesh>
      <mesh position={[0, 0.85, 0.66]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
        <Mat color={CYAN} emissive={CYAN} emissiveIntensity={0.8} />
      </mesh>
      {/* Floating O2 molecule icon */}
      <group ref={iconRef} position={[0, 3.3, 0]}>
        <mesh position={[-0.17, 0, 0]}>
          <sphereGeometry args={[0.22, 12, 8]} />
          <Mat color={CYAN} emissive={CYAN} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.17, 0, 0]}>
          <sphereGeometry args={[0.22, 12, 8]} />
          <Mat color={CYAN} emissive={CYAN} emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------

export function WaterRecycler() {
  const water = '#2cc6c0';
  return (
    <group>
      <mesh position={[-0.35, 0.8, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 1.6, 16]} />
        <Mat color={water} roughness={0.35} />
      </mesh>
      <mesh position={[-0.35, 1.6, 0]}>
        <sphereGeometry args={[0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={water} roughness={0.35} />
      </mesh>
      <mesh position={[-0.35, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.87, 0.06, 6, 24]} />
        <Mat color={WHITE} />
      </mesh>
      {/* Pump and compact pipe loop */}
      <mesh position={[1.15, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.5]} />
        <Mat color={WHITE} />
      </mesh>
      <mesh position={[0.7, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.45, 8]} />
        <Mat color={METAL} metalness={0.5} />
      </mesh>
      <mesh position={[1.15, 1.0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
        <Mat color={METAL} metalness={0.5} />
      </mesh>
      <mesh position={[0.82, 1.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.75, 8]} />
        <Mat color={METAL} metalness={0.5} />
      </mesh>
      <mesh position={[1.15, 1.4, 0]}>
        <sphereGeometry args={[0.13, 8, 6]} />
        <Mat color={METAL} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

const PLANTS: readonly { x: number; z: number; h: number; r: number; color: string }[] = [
  { x: 0, z: 0, h: 1.0, r: 0.34, color: '#3fae5a' },
  { x: 0.85, z: 0.3, h: 0.7, r: 0.28, color: '#5ccf6e' },
  { x: -0.75, z: 0.5, h: 0.8, r: 0.3, color: '#4cbc62' },
  { x: 0.3, z: -0.85, h: 0.65, r: 0.26, color: '#5ccf6e' },
  { x: -0.5, z: -0.7, h: 0.9, r: 0.3, color: '#3fae5a' },
  { x: 1.0, z: -0.45, h: 0.55, r: 0.24, color: '#4cbc62' },
  { x: -1.1, z: -0.1, h: 0.6, r: 0.25, color: '#5ccf6e' },
  { x: 0.2, z: 1.05, h: 0.6, r: 0.25, color: '#3fae5a' },
];

export function Greenhouse() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.1, 2.15, 0.3, 20]} />
        <Mat color="#c9c4bc" />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[1.9, 1.9, 0.05, 20]} />
        <Mat color="#5b3a24" roughness={1} />
      </mesh>
      {PLANTS.map((p) => (
        <mesh key={`${p.x}:${p.z}`} position={[p.x, 0.35 + p.h / 2, p.z]}>
          <coneGeometry args={[p.r, p.h, 7]} />
          <Mat color={p.color} />
        </mesh>
      ))}
      {[0, Math.PI / 2].map((rotation) => (
        <mesh key={rotation} position={[0, 0.3, 0]} rotation={[0, rotation, 0]}>
          <torusGeometry args={[1.95, 0.035, 6, 32, Math.PI]} />
          <Mat color={WHITE} />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[1.95, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#d9fff2"
          transparent
          opacity={0.28}
          roughness={0.1}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

export function CommunicationsDish({ reducedMotion }: { reducedMotion: boolean }) {
  const dishRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (dishRef.current && !reducedMotion) dishRef.current.rotation.y += delta * 0.25;
  });
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.7, 0.85, 0.3, 10]} />
        <Mat color={METAL} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 2.2, 8]} />
        <Mat color={WHITE} />
      </mesh>
      <group ref={dishRef} position={[0, 2.55, 0]}>
        <group rotation={[-0.6, 0, 0]}>
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[1.2, 20, 6, 0, Math.PI * 2, 0, 0.75]} />
            <Mat color={OFF_WHITE} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
            <Mat color={METAL} />
          </mesh>
          <mesh position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <Mat color={ORANGE} />
          </mesh>
        </group>
      </group>
      {/* Slender antenna with a soft tip light */}
      <mesh position={[0.95, 1.8, -0.45]}>
        <cylinderGeometry args={[0.035, 0.05, 3.6, 6]} />
        <Mat color={METAL} />
      </mesh>
      <mesh position={[0.95, 3.65, -0.45]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <Mat color="#ff7b6b" emissive="#ff7b6b" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

const WHEEL_POSITIONS: readonly [number, number][] = [
  [-0.85, -0.75], [-0.85, 0], [-0.85, 0.75],
  [0.85, -0.75], [0.85, 0], [0.85, 0.75],
];

export function Rover() {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.5, 0.45, 2.2]} />
        <Mat color={WHITE} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[1.52, 0.1, 2.22]} />
        <Mat color={ORANGE} />
      </mesh>
      <mesh position={[0, 1.06, -0.2]}>
        <boxGeometry args={[1.3, 0.05, 1.4]} />
        <Mat color="#2a5bb5" roughness={0.35} metalness={0.3} />
      </mesh>
      {WHEEL_POSITIONS.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.28, 12]} />
          <Mat color={DARK} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0.45, 1.45, 0.75]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 6]} />
        <Mat color={METAL} />
      </mesh>
      <mesh position={[0.45, 1.9, 0.8]}>
        <boxGeometry args={[0.35, 0.2, 0.25]} />
        <Mat color={METAL} />
      </mesh>
      <mesh position={[0.45, 1.9, 0.94]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <Mat color={CYAN} emissive={CYAN} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-0.5, 1.55, -0.8]}>
        <cylinderGeometry args={[0.025, 0.025, 1.0, 6]} />
        <Mat color={METAL} />
      </mesh>
    </group>
  );
}
