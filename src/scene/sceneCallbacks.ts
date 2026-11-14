/**
 * Optional scene callback contract for cross-system integration.
 *
 * ## onMovementChange
 *
 * Fires when the player's actual movement state changes (moving ↔ stopped).
 *
 * Contract:
 * - Backward-compatible; optional.
 * - Fires only on transitions: moving→stopped or stopped→moving.
 * - Does NOT fire every animation frame unnecessarily.
 * - Reflects actual player displacement, not merely held keyboard input
 *   (e.g., if collision pins the player against an obstacle while keys are held,
 *   the player is NOT moving).
 * - Emits `false` when:
 *   - inputLocked becomes true
 *   - Level transitions (levelId changes)
 *   - Component unmounts
 * - Supports both keyboard and touch movement.
 * - Scene files must NOT import any audio manager.
 * - The audio integration owner wires this to footstep sounds.
 *
 * Usage (by audio integration owner):
 * ```tsx
 * <MarsScene
 *   onMovementChange={(moving) => {
 *     if (moving) audioManager.startFootsteps();
 *     else audioManager.stopFootsteps();
 *   }}
 *   ...otherProps
 * />
 * ```
 */
export interface SceneCallbacks {
  onMovementChange?: (moving: boolean) => void;
}
