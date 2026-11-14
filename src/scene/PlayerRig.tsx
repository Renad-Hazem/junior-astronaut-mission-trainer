import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, OrthographicCamera } from "three";
import type { HotspotId, LevelId } from "../game/types";
import type { AvatarId } from "../pages/__stubs__/avatarAdapter";
import Astronaut, { type AstronautMotion } from "./Astronaut";
import {
  CAMERA_FOLLOW_LAMBDA,
  CAMERA_OFFSET,
  CAMERA_VIEW,
  HOTSPOTS,
  OBSTACLES,
  PLAYER_BOUNDS,
  PLAYER_RADIUS,
  PLAYER_SPAWN,
  PLAYER_SPAWN_HEADING,
  PLAYER_SPEED,
} from "./sceneConfig";
import {
  computeCameraZoom,
  createInputState,
  dampFactor,
  findNearestInteractable,
  lerpAngle,
  readInputVector,
  resolveCollisions,
  screenToWorld,
  stepPosition,
  type InputState,
  type Vec2,
} from "./sceneMath";

interface PlayerRigProps {
  levelId: LevelId;
  reducedMotion: boolean;
  avatarId: AvatarId;
  /** Input sources (keyboard, touch); a direction is active if any source holds it. */
  inputs: readonly RefObject<InputState>[];
  onNearbyChange: (id: HotspotId | null) => void;
}

/**
 * Owns the astronaut transform: delta-time movement on X/Z, collision and
 * bounds, proximity detection and the isometric follow camera.
 */
export default function PlayerRig({
  levelId,
  reducedMotion,
  avatarId,
  inputs,
  onNearbyChange,
}: PlayerRigProps) {
  const groupRef = useRef<Group>(null);
  const motionRef = useRef<AstronautMotion>({ moving: false });
  const positionRef = useRef<Vec2>({ ...PLAYER_SPAWN });
  const headingRef = useRef(PLAYER_SPAWN_HEADING);
  const nearbyRef = useRef<HotspotId | null>(null);
  const snapCameraRef = useRef(true);
  const mergedInputRef = useRef<InputState>(createInputState());

  // A new level starts back at the spawn point; the map itself is reused.
  useEffect(() => {
    positionRef.current = { ...PLAYER_SPAWN };
    headingRef.current = PLAYER_SPAWN_HEADING;
    snapCameraRef.current = true;
  }, [levelId]);

  useFrame((state, delta) => {
    const merged = mergedInputRef.current;
    merged.up = merged.down = merged.left = merged.right = false;
    for (const source of inputs) {
      const s = source.current;
      merged.up ||= s.up;
      merged.down ||= s.down;
      merged.left ||= s.left;
      merged.right ||= s.right;
    }

    const direction = screenToWorld(readInputVector(merged));
    const moving = direction.x !== 0 || direction.z !== 0;
    const next = resolveCollisions(
      stepPosition(positionRef.current, direction, PLAYER_SPEED, delta),
      OBSTACLES,
      PLAYER_RADIUS,
      PLAYER_BOUNDS,
    );
    positionRef.current = next;
    motionRef.current.moving = moving;

    if (moving) {
      const targetHeading = Math.atan2(direction.x, direction.z);
      headingRef.current = reducedMotion
        ? targetHeading
        : lerpAngle(headingRef.current, targetHeading, dampFactor(14, delta));
    }

    const group = groupRef.current;
    if (group) {
      group.position.set(next.x, 0, next.z);
      group.rotation.y = headingRef.current;
    }

    const nearby = findNearestInteractable(next, HOTSPOTS);
    if (nearby !== nearbyRef.current) {
      nearbyRef.current = nearby;
      onNearbyChange(nearby);
    }

    // Isometric follow camera: fixed offset, smoothed position, no user rotation.
    const camera = state.camera;
    const follow =
      snapCameraRef.current || reducedMotion
        ? 1
        : dampFactor(CAMERA_FOLLOW_LAMBDA, delta);
    snapCameraRef.current = false;
    camera.position.x +=
      (next.x + CAMERA_OFFSET.x - camera.position.x) * follow;
    camera.position.y = CAMERA_OFFSET.y;
    camera.position.z +=
      (next.z + CAMERA_OFFSET.z - camera.position.z) * follow;
    camera.lookAt(
      camera.position.x - CAMERA_OFFSET.x,
      0,
      camera.position.z - CAMERA_OFFSET.z,
    );

    if ((camera as OrthographicCamera).isOrthographicCamera) {
      const ortho = camera as OrthographicCamera;
      const zoom = computeCameraZoom(
        state.size.width,
        state.size.height,
        CAMERA_VIEW.minWorldWidth,
        CAMERA_VIEW.minWorldHeight,
      );
      if (Math.abs(ortho.zoom - zoom) > 0.01) {
        ortho.zoom = zoom;
        ortho.updateProjectionMatrix();
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[PLAYER_SPAWN.x, 0, PLAYER_SPAWN.z]}
      rotation={[0, PLAYER_SPAWN_HEADING, 0]}
    >
      <Astronaut
        motionRef={motionRef}
        reducedMotion={reducedMotion}
        avatarId={avatarId}
      />{" "}
    </group>
  );
}
