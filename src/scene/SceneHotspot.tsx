import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import type { HotspotId } from '../game/types';
import { HIGHLIGHT_COLORS, type HotspotLayout } from './sceneConfig';

interface SceneHotspotProps {
  layout: HotspotLayout;
  /** Player is within interaction range — E will inspect this system. */
  isNearby: boolean;
  /** Matches the `highlightedHotspot` prop (the active mission objective). */
  isObjective: boolean;
  /** Attention beacon colour when the current status targets this system. */
  alertColor: string | null;
  indicatorColor: string;
  reducedMotion: boolean;
  onInspect: (id: HotspotId) => void;
  children: ReactNode;
}

function HotspotLabel({ label }: { label: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'rgba(255, 255, 255, 0.92)';
      context.beginPath();
      context.roundRect(8, 8, 496, 80, 40);
      context.fill();
      context.fillStyle = '#1d1f2b';
      context.font = '600 34px system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, 256, 49, 460);
    }
    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    return nextTexture;
  }, [label]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite scale={[3.2, 0.6, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

/**
 * Places one mission-system model and adds its interaction affordances:
 * proximity ring, objective marker, status beacon, label and pointer inspection.
 */
export default function SceneHotspot({
  layout,
  isNearby,
  isObjective,
  alertColor,
  indicatorColor,
  reducedMotion,
  onInspect,
  children,
}: SceneHotspotProps) {
  const [hovered, setHovered] = useState(false);
  const objectiveRingRef = useRef<Mesh>(null);
  const markerRef = useRef<Group>(null);
  const alertRingRef = useRef<Mesh>(null);

  useEffect(() => {
    if (!hovered || !isNearby) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered, isNearby]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = reducedMotion ? 0 : (Math.sin(t * 3) + 1) / 2;
    if (objectiveRingRef.current) objectiveRingRef.current.scale.setScalar(1 + pulse * 0.08);
    if (markerRef.current) {
      markerRef.current.position.y = layout.labelHeight + 0.85 + (reducedMotion ? 0 : Math.sin(t * 2.2) * 0.15);
      if (!reducedMotion) markerRef.current.rotation.y = t * 1.5;
    }
    if (alertRingRef.current) {
      alertRingRef.current.scale.setScalar(1 + pulse * 0.15);
      (alertRingRef.current.material as MeshBasicMaterial).opacity = reducedMotion ? 0.7 : 0.45 + pulse * 0.4;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!isNearby) return;
    onInspect(layout.id);
  };
  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
  };
  const handleOut = () => setHovered(false);

  const ringRadius = layout.radius + 0.35;
  const showLabel = isNearby || hovered || isObjective;

  return (
    <group position={[layout.x, 0, layout.z]} name={`hotspot-${layout.id}`}>
      <group
        rotation={[0, layout.rotationY, 0]}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        {children}
      </group>

      {(isNearby || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[ringRadius, ringRadius + 0.2, 48]} />
          <meshBasicMaterial color={HIGHLIGHT_COLORS.nearby} transparent opacity={isNearby ? 0.95 : 0.6} />
        </mesh>
      )}

      {isObjective && (
        <>
          <mesh ref={objectiveRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[ringRadius + 0.3, ringRadius + 0.55, 48]} />
            <meshBasicMaterial color={HIGHLIGHT_COLORS.objective} transparent opacity={0.9} />
          </mesh>
          <group ref={markerRef} position={[0, layout.labelHeight + 0.85, 0]}>
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.28, 0.55, 4]} />
              <meshStandardMaterial
                color={HIGHLIGHT_COLORS.objective}
                emissive={HIGHLIGHT_COLORS.objective}
                emissiveIntensity={0.7}
                flatShading
              />
            </mesh>
          </group>
        </>
      )}

      {alertColor && (
        <mesh ref={alertRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[ringRadius + 0.75, ringRadius + 0.95, 48]} />
          <meshBasicMaterial color={alertColor} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Small status light above each system */}
      <mesh position={[0, layout.labelHeight - 0.6, 0]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color={indicatorColor} emissive={indicatorColor} emissiveIntensity={1} />
      </mesh>

      {showLabel && (
        <group position={[0, layout.labelHeight, 0]} renderOrder={20}>
          <HotspotLabel label={layout.label} />
        </group>
      )}
    </group>
  );
}
