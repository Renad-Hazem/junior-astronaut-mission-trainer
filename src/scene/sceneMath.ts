// Pure, framework-free helpers for movement, collision, proximity and camera.
// Kept free of runtime imports so they can be unit-tested in plain Node.

export interface Vec2 {
  x: number;
  z: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface CircleObstacle {
  x: number;
  z: number;
  radius: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Interactable<Id extends string> {
  id: Id;
  x: number;
  z: number;
  /** Collision radius of the landmark footprint. */
  radius: number;
  /** Distance from the landmark centre within which the player can interact. */
  interactRadius: number;
}

export function createInputState(): InputState {
  return { up: false, down: false, left: false, right: false };
}

/** Screen-space input vector (x = right, y = up), normalized so diagonals are not faster. */
export function readInputVector(input: InputState): { x: number; y: number } {
  const x = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const y = (input.up ? 1 : 0) - (input.down ? 1 : 0);
  const length = Math.hypot(x, y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

const INV_SQRT2 = 1 / Math.SQRT2;

/**
 * Maps a screen-space input vector onto the world X/Z plane for the
 * isometric camera, which looks from +X/+Z towards -X/-Z.
 * "Up" on screen walks away from the camera; "right" walks screen-right.
 * Rotation preserves length, so normalized input stays normalized.
 */
export function screenToWorld(v: { x: number; y: number }): Vec2 {
  return {
    x: (v.x - v.y) * INV_SQRT2,
    z: (-v.x - v.y) * INV_SQRT2,
  };
}

/** Largest frame step accepted, preventing tunnelling after a stalled tab. */
export const MAX_FRAME_DELTA = 0.1;

export function stepPosition(pos: Vec2, dir: Vec2, speed: number, delta: number): Vec2 {
  const dt = Math.min(Math.max(delta, 0), MAX_FRAME_DELTA);
  return { x: pos.x + dir.x * speed * dt, z: pos.z + dir.z * speed * dt };
}

export function clampToBounds(pos: Vec2, bounds: Bounds): Vec2 {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, pos.x)),
    z: Math.min(bounds.maxZ, Math.max(bounds.minZ, pos.z)),
  };
}

/**
 * Pushes a circular player out of circular obstacles, then clamps to map bounds.
 * Two passes settle cases where the player touches two obstacles at once.
 */
export function resolveCollisions(
  pos: Vec2,
  obstacles: readonly CircleObstacle[],
  playerRadius: number,
  bounds: Bounds,
): Vec2 {
  let x = pos.x;
  let z = pos.z;
  for (let pass = 0; pass < 2; pass += 1) {
    for (const o of obstacles) {
      const dx = x - o.x;
      const dz = z - o.z;
      const minDist = o.radius + playerRadius;
      const distSq = dx * dx + dz * dz;
      if (distSq >= minDist * minDist) continue;
      const dist = Math.sqrt(distSq);
      if (dist < 1e-6) {
        // Exactly at the centre: push out towards +Z (towards the camera).
        z = o.z + minDist;
      } else {
        const push = minDist / dist;
        x = o.x + dx * push;
        z = o.z + dz * push;
      }
    }
    const clamped = clampToBounds({ x, z }, bounds);
    x = clamped.x;
    z = clamped.z;
  }
  return { x, z };
}

/**
 * Returns the interactable whose footprint edge is closest to the player,
 * provided the player is within its interaction radius; otherwise null.
 */
export function findNearestInteractable<Id extends string>(
  pos: Vec2,
  items: readonly Interactable<Id>[],
): Id | null {
  let best: Id | null = null;
  let bestGap = Infinity;
  for (const item of items) {
    const dist = Math.hypot(pos.x - item.x, pos.z - item.z);
    if (dist > item.interactRadius) continue;
    const gap = dist - item.radius;
    if (gap < bestGap) {
      bestGap = gap;
      best = item.id;
    }
  }
  return best;
}

/** Frame-rate independent smoothing factor for exponential damping. */
export function dampFactor(lambda: number, delta: number): number {
  return 1 - Math.exp(-lambda * Math.max(delta, 0));
}

/** Interpolates between two angles (radians) along the shortest arc. */
export function lerpAngle(from: number, to: number, t: number): number {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return from + diff * t;
}

/**
 * Orthographic zoom (pixels per world unit) keeping roughly
 * `minWorldWidth` x `minWorldHeight` world units visible on any screen size.
 */
export function computeCameraZoom(
  widthPx: number,
  heightPx: number,
  minWorldWidth: number,
  minWorldHeight: number,
): number {
  if (widthPx <= 0 || heightPx <= 0) return 1;
  return Math.max(1, Math.min(widthPx / minWorldWidth, heightPx / minWorldHeight));
}

/** Deterministic PRNG (mulberry32) so procedural layout is identical every load. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
