import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import type { HotspotId, LevelId, SceneStatus } from "../game/types";
import MarsBase from "./MarsBase";
import MarsEnvironment from "./MarsEnvironment";
import MarsTerrain from "./MarsTerrain";
import MarsTerrainDetails from "./MarsTerrainDetails";
import PlayerRig from "./PlayerRig";
import SceneAtmosphere from "./SceneAtmosphere";
import SceneErrorBoundary from "./SceneErrorBoundary";
import TouchControls from "./TouchControls";
import { CAMERA_OFFSET, HOTSPOT_BY_ID, PLAYER_SPAWN } from "./sceneConfig";
import { createInputState, type InputState } from "./sceneMath";
import {
  detectWebGL,
  useCoarsePointer,
  useSceneKeyboard,
} from "./useSceneInput";
import type { AvatarId } from "../pages/__stubs__/avatarAdapter";

// Public contract — src/docs/02_TECHNICAL_CONTRACTS.md §7. Do not change without a team PR.
export interface MarsSceneProps {
  levelId: LevelId;
  status: SceneStatus;
  avatarId: AvatarId;
  customPhotoUrl?: string | null;
  highlightedHotspot?: HotspotId;
  onInspect?: (hotspotId: HotspotId) => void;
  reducedMotion?: boolean;
  inputLocked?: boolean;
  onMovementChange?: (moving: boolean) => void;
}

const containerStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 320,
  overflow: "hidden",
  background: "#e3ad82",
};

const promptStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: 20,
  transform: "translateX(-50%)",
  maxWidth: "calc(100% - 32px)",
  padding: "8px 16px",
  borderRadius: 999,
  font: "600 15px/1.35 system-ui, sans-serif",
  color: "#ffffff",
  background: "rgba(20, 24, 40, 0.78)",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
  pointerEvents: "none",
  textAlign: "center",
};

const fallbackStyle: CSSProperties = {
  ...containerStyle,
  display: "grid",
  placeItems: "center",
  padding: 16,
  font: "600 16px/1.4 system-ui, sans-serif",
  color: "#3b1f14",
  textAlign: "center",
};

const keyCapStyle: CSSProperties = {
  display: "inline-block",
  minWidth: "1.4em",
  padding: "0 6px",
  margin: "0 2px",
  borderRadius: 6,
  background: "#ffffff",
  color: "#1d1f2b",
};

const FALLBACK_TEXT = "Mars base preview unavailable";

/**
 * Reusable interactive 3D Mars base shared by all four levels.
 * Presentational only: it never imports the game store, chooses options or
 * applies resource effects. Pressing E near a system (or clicking one) calls
 * `onInspect(hotspotId)` once per press.
 */
export default function MarsScene({
  levelId,
  status,
  avatarId,
  customPhotoUrl,
  highlightedHotspot,
  onInspect,
  reducedMotion = false,
  inputLocked = false,
  onMovementChange,
}: MarsSceneProps) {
  const [webGLAvailable] = useState(detectWebGL);
  const [nearby, setNearby] = useState<HotspotId | null>(null);
  const nearbyRef = useRef<HotspotId | null>(null);
  const onInspectRef = useRef(onInspect);
  const touchRef = useRef<InputState>(createInputState());
  const coarsePointer = useCoarsePointer();

  useEffect(() => {
    onInspectRef.current = onInspect;
  }, [onInspect]);

  useEffect(() => {
    if (inputLocked) {
      Object.assign(touchRef.current, createInputState());
    }
  }, [inputLocked]);

  const inspect = useCallback((id: HotspotId) => {
    if (inputLocked) return;
    onInspectRef.current?.(id);
  }, [inputLocked]);

  const inspectNearby = useCallback(() => {
    const id = nearbyRef.current;
    if (id) inspect(id);
  }, [inspect]);

  const keyboardRef = useSceneKeyboard(inspectNearby, inputLocked);
  const inputs = useMemo(() => [keyboardRef, touchRef], [keyboardRef]);

  const handleNearbyChange = useCallback((id: HotspotId | null) => {
    nearbyRef.current = id;
    setNearby(id);
  }, []);

  const handleTouchDirection = useCallback(
    (direction: keyof InputState, pressed: boolean) => {
      touchRef.current[direction] = inputLocked ? false : pressed;
    },
    [inputLocked],
  );

  if (!webGLAvailable) {
    return (
      <div style={fallbackStyle} role="status">
        {FALLBACK_TEXT}
      </div>
    );
  }

  const nearbyLabel = nearby ? HOTSPOT_BY_ID[nearby].label : null;

  return (
    <div
      className="mars-scene"
      style={containerStyle}
      data-level-id={levelId}
      data-status={status}
      data-nearby-hotspot={nearby ?? ""}
      role="region"
      aria-label="Interactive 3D Mars base. Move with W A S D or the arrow keys, press E to inspect a nearby system."
    >
      <SceneErrorBoundary
        fallback={
          <div style={fallbackStyle} role="status">
            {FALLBACK_TEXT}
          </div>
        }
      >
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <OrthographicCamera
            makeDefault
            position={[
              PLAYER_SPAWN.x + CAMERA_OFFSET.x,
              CAMERA_OFFSET.y,
              PLAYER_SPAWN.z + CAMERA_OFFSET.z,
            ]}
            zoom={40}
            near={0.1}
            far={200}
          />
          <SceneAtmosphere status={status} reducedMotion={reducedMotion} />
          <MarsTerrain />
          <MarsTerrainDetails reducedMotion={reducedMotion} />
          <MarsEnvironment reducedMotion={reducedMotion} />
          <MarsBase
            status={status}
            highlightedHotspot={highlightedHotspot}
            nearbyHotspot={nearby}
            reducedMotion={reducedMotion}
            onInspect={inspect}
          />
          <PlayerRig
            levelId={levelId}
            reducedMotion={reducedMotion}
            avatarId={avatarId}
            customPhotoUrl={customPhotoUrl}
            inputLocked={inputLocked}
            inputs={inputs}
            onNearbyChange={handleNearbyChange}
            onMovementChange={onMovementChange}
          />
        </Canvas>
      </SceneErrorBoundary>

      <div
        aria-live="polite"
        style={
          nearbyLabel
            ? {
                ...promptStyle,
                ...(coarsePointer ? { top: 16, bottom: "auto" } : null),
              }
            : { display: "none" }
        }
      >
        {nearbyLabel &&
          (coarsePointer ? (
            <>Tap Inspect to check the {nearbyLabel}</>
          ) : (
            <>
              Press <span style={keyCapStyle}>E</span> to inspect the{" "}
              {nearbyLabel}
            </>
          ))}
      </div>

      {coarsePointer && (
        <TouchControls
          onDirection={handleTouchDirection}
          onInspect={inspectNearby}
          canInspect={nearby !== null}
          inputLocked={inputLocked}
        />
      )}
    </div>
  );
}
