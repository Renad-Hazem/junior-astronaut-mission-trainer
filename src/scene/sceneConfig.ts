// Static scene configuration: map layout, hotspot placement, collision and
// per-status visual presets. One map is reused for all four levels.

import type { HotspotId, SceneStatus } from '../game/types';
import {
  createRandom,
  type Bounds,
  type CircleObstacle,
  type Interactable,
  type Vec2,
} from './sceneMath';

// ---------------------------------------------------------------------------
// Player & camera
// ---------------------------------------------------------------------------

/** World units per second. */
export const PLAYER_SPEED = 5;
export const PLAYER_RADIUS = 0.45;
export const PLAYER_SPAWN: Readonly<Vec2> = { x: 0.5, z: 5 };
/** Facing the camera-right/forward diagonal on spawn. */
export const PLAYER_SPAWN_HEADING = Math.PI / 4;

/** Half-size of the square playable area (centered on the habitat). */
export const MAP_HALF_SIZE = 13;
export const PLAYER_BOUNDS: Readonly<Bounds> = {
  minX: -MAP_HALF_SIZE,
  maxX: MAP_HALF_SIZE,
  minZ: -MAP_HALF_SIZE,
  maxZ: MAP_HALF_SIZE,
};

/** Fixed isometric-style offset from the player (≈39° elevation, 45° yaw). */
export const CAMERA_OFFSET = { x: 14, y: 16, z: 14 } as const;
/** Minimum visible world area, used to derive a responsive orthographic zoom. */
export const CAMERA_VIEW = { minWorldWidth: 24, minWorldHeight: 16 } as const;
export const CAMERA_FOLLOW_LAMBDA = 5;

// ---------------------------------------------------------------------------
// Hotspots — one interactable per contract HotspotId
// ---------------------------------------------------------------------------

export interface HotspotLayout extends Interactable<HotspotId> {
  label: string;
  /** Height (world units) where labels / markers float above the model. */
  labelHeight: number;
  /** Model yaw in radians. */
  rotationY: number;
}

const INTERACT_MARGIN = 1.7;

function hotspot(
  id: HotspotId,
  label: string,
  x: number,
  z: number,
  radius: number,
  labelHeight: number,
  rotationY = 0,
): HotspotLayout {
  return { id, label, x, z, radius, interactRadius: radius + INTERACT_MARGIN, labelHeight, rotationY };
}

export const HOTSPOTS: readonly HotspotLayout[] = [
  hotspot('habitat', 'Habitat', 0, 0, 2.6, 4.4, Math.PI / 4),
  hotspot('solar', 'Solar Array', -8, -5, 3, 2.9, Math.PI / 4),
  hotspot('oxygen', 'Oxygen Unit', 6.5, -3.5, 1.6, 4.4),
  hotspot('water', 'Water Recycler', 7.5, 4, 1.7, 3.2, -Math.PI / 6),
  hotspot('greenhouse', 'Greenhouse', -6.5, 5, 2.4, 3.2),
  hotspot('communications', 'Communications Dish', 1.5, -9, 1.8, 4.6, Math.PI / 5),
  hotspot('rover', 'Rover', 3.5, 10, 1.7, 2.6, -Math.PI / 3),
];

export const HOTSPOT_BY_ID: Readonly<Record<HotspotId, HotspotLayout>> = Object.fromEntries(
  HOTSPOTS.map((h) => [h.id, h]),
) as Record<HotspotId, HotspotLayout>;

// ---------------------------------------------------------------------------
// Decorative rocks (deterministic) — rocks inside the playable area collide
// ---------------------------------------------------------------------------

export interface RockLayout {
  x: number;
  z: number;
  scale: number;
  rotation: [number, number, number];
  tint: number; // 0..1 brightness variation
}

function generateRocks(): RockLayout[] {
  const random = createRandom(20261113);
  const rocks: RockLayout[] = [];
  let attempts = 0;
  while (rocks.length < 18 && attempts < 600) {
    attempts += 1;
    const x = (random() * 2 - 1) * (MAP_HALF_SIZE + 4);
    const z = (random() * 2 - 1) * (MAP_HALF_SIZE + 4);
    const scale = 0.35 + random() * 0.55;
    const clearOfHotspots = HOTSPOTS.every(
      (h) => Math.hypot(x - h.x, z - h.z) > h.interactRadius + 1 + scale,
    );
    const clearOfSpawn = Math.hypot(x - PLAYER_SPAWN.x, z - PLAYER_SPAWN.z) > 3;
    const clearOfRocks = rocks.every((r) => Math.hypot(x - r.x, z - r.z) > 2.5);
    if (!clearOfHotspots || !clearOfSpawn || !clearOfRocks) continue;
    rocks.push({
      x,
      z,
      scale,
      rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI],
      tint: random(),
    });
  }
  return rocks;
}

export const ROCKS: readonly RockLayout[] = generateRocks();

/** Major decorative structures that have solid collision footprints. */
export const DECORATIVE_OBSTACLES: readonly CircleObstacle[] = [
  // Rocket hull at landing zone center
  { x: -4, z: -10, radius: 0.9 },
];

/** Every solid footprint the player cannot walk through. */
export const OBSTACLES: readonly CircleObstacle[] = [
  ...HOTSPOTS.map((h) => ({ x: h.x, z: h.z, radius: h.radius })),
  ...ROCKS.map((r) => ({ x: r.x, z: r.z, radius: r.scale * 0.8 })),
  ...DECORATIVE_OBSTACLES,
];

// ---------------------------------------------------------------------------
// Scene status presets — visual only, no gameplay logic
// ---------------------------------------------------------------------------

export interface StatusVisual {
  sky: string;
  fogNear: number;
  fogFar: number;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  /** System that receives an attention beacon in this status, if any. */
  alertHotspot: HotspotId | null;
  accent: string;
  dust: boolean;
}

export const STATUS_VISUALS: Readonly<Record<SceneStatus, StatusVisual>> = {
  normal: {
    sky: '#e3ad82',
    fogNear: 42,
    fogFar: 95,
    ambientColor: '#ffe6cf',
    ambientIntensity: 0.75,
    sunColor: '#fff2df',
    sunIntensity: 2.1,
    alertHotspot: null,
    accent: '#9fd8ff',
    dust: false,
  },
  dust: {
    sky: '#c98754',
    fogNear: 22,
    fogFar: 58,
    ambientColor: '#f3bd90',
    ambientIntensity: 0.7,
    sunColor: '#ffc896',
    sunIntensity: 1.2,
    alertHotspot: 'solar',
    accent: '#ffb547',
    dust: true,
  },
  oxygen_alert: {
    sky: '#dca07c',
    fogNear: 38,
    fogFar: 90,
    ambientColor: '#ffe0cc',
    ambientIntensity: 0.68,
    sunColor: '#ffe9d6',
    sunIntensity: 1.8,
    alertHotspot: 'oxygen',
    accent: '#ff9f43',
    dust: false,
  },
  radiation_alert: {
    sky: '#b98fae',
    fogNear: 36,
    fogFar: 88,
    ambientColor: '#eadbff',
    ambientIntensity: 0.62,
    sunColor: '#fff0c4',
    sunIntensity: 1.7,
    alertHotspot: 'habitat',
    accent: '#c58bff',
    dust: false,
  },
  restored: {
    sky: '#ecbd92',
    fogNear: 48,
    fogFar: 105,
    ambientColor: '#fff0dc',
    ambientIntensity: 0.85,
    sunColor: '#fff8ea',
    sunIntensity: 2.4,
    alertHotspot: null,
    accent: '#5be37d',
    dust: false,
  },
};

const NEUTRAL_INDICATOR = '#9fd8ff';

/** Colour of the small status light floating above each system. */
export function indicatorColor(status: SceneStatus, id: HotspotId): string {
  const visual = STATUS_VISUALS[status];
  if (status === 'restored') return visual.accent;
  if (visual.alertHotspot === id) return visual.accent;
  return NEUTRAL_INDICATOR;
}

export const HIGHLIGHT_COLORS = {
  nearby: '#ffffff',
  objective: '#ffc24b',
} as const;
