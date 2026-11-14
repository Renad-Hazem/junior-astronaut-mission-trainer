import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Texture, type Group } from "three";
import { dampFactor } from "./sceneMath";
import type { AvatarId } from "../pages/__stubs__/avatarAdapter";
export interface AstronautMotion {
  moving: boolean;
}

interface AstronautProps {
  motionRef: RefObject<AstronautMotion>;
  reducedMotion: boolean;
  avatarId: AvatarId;
  customPhotoUrl?: string | null;
}

const SUIT = "#f3f1ec";
const SUIT_SHADE = "#d9d6cf";
const AVATAR_ACCENTS: Record<AvatarId, string> = {
  "avatar-01": "#ff913d",
  "avatar-02": "#55bdeb",
  "avatar-03": "#b995ff",
  "avatar-04": "#63e6c1",
  "avatar-custom": "#f0c868",
};
const VISOR = "#f2a33a";

/**
 * Primitive-built, readable astronaut. Local +Z is the facing direction
 * (visor and chest patch), so the parent group's Y rotation shows heading.
 */
export default function Astronaut({
  motionRef,
  reducedMotion,
  avatarId,
  customPhotoUrl,
}: AstronautProps) {
  const ACCENT = AVATAR_ACCENTS[avatarId] || "#ff913d";

  const photoTexture = useMemo(() => {
    if (!customPhotoUrl) return null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = customPhotoUrl;
    const tex = new Texture(img);
    img.onload = () => {
      tex.needsUpdate = true;
    };
    return tex;
  }, [customPhotoUrl]);

  useEffect(() => () => photoTexture?.dispose(), [photoTexture]);

  const bodyRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const phaseRef = useRef(0);
  const swingRef = useRef(0);

  useFrame((_, delta) => {
    const moving = motionRef.current.moving && !reducedMotion;
    const target = moving ? 1 : 0;
    swingRef.current += (target - swingRef.current) * dampFactor(10, delta);
    if (moving) phaseRef.current += Math.min(delta, 0.1) * 10;
    const swing = Math.sin(phaseRef.current) * 0.6 * swingRef.current;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.8;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.8;
    if (bodyRef.current) {
      bodyRef.current.position.y =
        Math.abs(Math.sin(phaseRef.current)) * 0.06 * swingRef.current;
    }
  });

  return (
    <group>
      {/* Soft contact shadow (no shadow maps needed) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      <group ref={bodyRef}>
        {/* Legs pivot at the hip */}
        {(
          [
            [-0.15, leftLegRef],
            [0.15, rightLegRef],
          ] as const
        ).map(([x, ref]) => (
          <group key={x} ref={ref} position={[x, 0.62, 0]}>
            <mesh position={[0, -0.3, 0]}>
              <capsuleGeometry args={[0.11, 0.38, 4, 8]} />
              <meshStandardMaterial color={SUIT_SHADE} flatShading />
            </mesh>
            <mesh position={[0, -0.56, 0.04]}>
              <boxGeometry args={[0.2, 0.1, 0.3]} />
              <meshStandardMaterial color="#5c5f68" flatShading />
            </mesh>
          </group>
        ))}

        {/* Torso */}
        <mesh position={[0, 0.95, 0]}>
          <capsuleGeometry args={[0.3, 0.38, 4, 10]} />
          <meshStandardMaterial color={SUIT} flatShading />
        </mesh>
        <mesh position={[0, 0.98, 0.28]}>
          <boxGeometry args={[0.26, 0.18, 0.06]} />
          <meshStandardMaterial color={ACCENT} flatShading />
        </mesh>
        {avatarId === "avatar-01" && (
          <mesh position={[0, 1.2, 0.3]}>
            <boxGeometry args={[0.13, 0.07, 0.04]} />
            <meshStandardMaterial color="#fff2d6" emissive={ACCENT} emissiveIntensity={0.35} />
          </mesh>
        )}
        {avatarId === "avatar-02" && (
          <group position={[0.2, 1.82, 0]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
              <meshStandardMaterial color={ACCENT} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.045, 8, 6]} />
              <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.45} />
            </mesh>
          </group>
        )}
        {avatarId === "avatar-03" && (
          <>
            <mesh position={[-0.39, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.105, 0.025, 6, 12]} />
              <meshStandardMaterial color={ACCENT} />
            </mesh>
            <mesh position={[0.39, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.105, 0.025, 6, 12]} />
              <meshStandardMaterial color={ACCENT} />
            </mesh>
          </>
        )}
        {avatarId === "avatar-04" && (
          <mesh position={[0, 0.78, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.035, 6, 14]} />
            <meshStandardMaterial color={ACCENT} />
          </mesh>
        )}
        {/* Backpack (life support) on local -Z */}
        <mesh position={[0, 1.0, -0.32]}>
          <boxGeometry args={[0.46, 0.55, 0.22]} />
          <meshStandardMaterial color={SUIT_SHADE} flatShading />
        </mesh>

        {/* Arms pivot at the shoulder */}
        {(
          [
            [-0.38, leftArmRef],
            [0.38, rightArmRef],
          ] as const
        ).map(([x, ref]) => (
          <group key={x} ref={ref} position={[x, 1.18, 0]}>
            <mesh position={[0, -0.25, 0]}>
              <capsuleGeometry args={[0.09, 0.34, 4, 8]} />
              <meshStandardMaterial color={SUIT} flatShading />
            </mesh>
          </group>
        ))}

        {/* Helmet and visor (facing +Z) */}
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.3, 14, 10]} />
          <meshStandardMaterial color={SUIT} flatShading />
        </mesh>
        <mesh position={[0, 1.56, 0.1]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.24, 14, 10, 0, Math.PI, 0, Math.PI]} />
          <meshStandardMaterial
            color={VISOR}
            metalness={0.6}
            roughness={0.25}
            emissive={VISOR}
            emissiveIntensity={0.15}
          />
        </mesh>
        {photoTexture && avatarId === "avatar-custom" && (
          <mesh position={[0, 1.56, 0.23]}>
            <circleGeometry args={[0.15, 24]} />
            <meshBasicMaterial map={photoTexture} toneMapped={false} />
          </mesh>
        )}
      </group>
    </group>
  );
}
