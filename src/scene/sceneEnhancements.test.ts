import { describe, expect, it } from 'vitest';
import {
  DECORATIVE_OBSTACLES,
  HOTSPOTS,
  HOTSPOT_BY_ID,
  MAP_HALF_SIZE,
  OBSTACLES,
  PLAYER_BOUNDS,
  PLAYER_RADIUS,
  PLAYER_SPAWN,
} from './sceneConfig';
import { resolveCollisions, type Vec2 } from './sceneMath';
import type { HotspotId } from '../game/types';

describe('Scene Contract Preservation', () => {
  it('preserves all 7 mission hotspots with correct IDs and coordinates', () => {
    const expectedIds: HotspotId[] = [
      'habitat',
      'solar',
      'oxygen',
      'water',
      'greenhouse',
      'communications',
      'rover',
    ];

    expect(HOTSPOTS.map((h) => h.id).sort()).toEqual(expectedIds.sort());

    for (const id of expectedIds) {
      expect(HOTSPOT_BY_ID[id]).toBeDefined();
      expect(HOTSPOT_BY_ID[id].interactRadius).toBeGreaterThan(HOTSPOT_BY_ID[id].radius);
    }

    expect(HOTSPOT_BY_ID.habitat.x).toBe(0);
    expect(HOTSPOT_BY_ID.habitat.z).toBe(0);
    expect(HOTSPOT_BY_ID.rover.x).toBe(3.5);
    expect(HOTSPOT_BY_ID.rover.z).toBe(10);
  });

  it('preserves player spawn and bounds', () => {
    expect(PLAYER_SPAWN.x).toBe(0.5);
    expect(PLAYER_SPAWN.z).toBe(5);
    expect(MAP_HALF_SIZE).toBe(13);
    expect(PLAYER_BOUNDS.minX).toBe(-13);
    expect(PLAYER_BOUNDS.maxX).toBe(13);
  });
});

describe('Movement & Collision Reachability', () => {
  it('does not place decorative obstacles on player spawn or within hotspot interaction radii', () => {
    for (const obs of DECORATIVE_OBSTACLES) {
      // Spawn clearance
      const distSpawn = Math.hypot(obs.x - PLAYER_SPAWN.x, obs.z - PLAYER_SPAWN.z);
      expect(distSpawn).toBeGreaterThan(obs.radius + PLAYER_RADIUS + 1.0);

      // Hotspot clearance
      for (const h of HOTSPOTS) {
        const distHotspot = Math.hypot(obs.x - h.x, obs.z - h.z);
        expect(distHotspot).toBeGreaterThan(obs.radius + h.radius);
      }
    }
  });

  it('allows the player to reach every hotspot interaction zone from spawn (BFS grid reachability)', () => {
    // Discretize the playable area into a grid
    const step = 0.5;
    const minX = PLAYER_BOUNDS.minX;
    const maxX = PLAYER_BOUNDS.maxX;
    const minZ = PLAYER_BOUNDS.minZ;
    const maxZ = PLAYER_BOUNDS.maxZ;

    const cols = Math.floor((maxX - minX) / step) + 1;
    const rows = Math.floor((maxZ - minZ) / step) + 1;

    const toIndex = (x: number, z: number) => {
      const col = Math.round((x - minX) / step);
      const row = Math.round((z - minZ) / step);
      if (col < 0 || col >= cols || row < 0 || row >= rows) return -1;
      return row * cols + col;
    };

    const isWalkable = (x: number, z: number): boolean => {
      if (x < minX || x > maxX || z < minZ || z > maxZ) return false;
      for (const o of OBSTACLES) {
        const dist = Math.hypot(x - o.x, z - o.z);
        if (dist < o.radius + PLAYER_RADIUS) return false;
      }
      return true;
    };

    // Breadth-First Search from PLAYER_SPAWN
    const visited = new Uint8Array(cols * rows);
    const queue: Vec2[] = [{ x: PLAYER_SPAWN.x, z: PLAYER_SPAWN.z }];
    const startIdx = toIndex(PLAYER_SPAWN.x, PLAYER_SPAWN.z);
    if (startIdx >= 0) visited[startIdx] = 1;

    const directions = [
      { dx: step, dz: 0 },
      { dx: -step, dz: 0 },
      { dx: 0, dz: step },
      { dx: 0, dz: -step },
      { dx: step, dz: step },
      { dx: -step, dz: step },
      { dx: step, dz: -step },
      { dx: -step, dz: -step },
    ];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const d of directions) {
        const nx = curr.x + d.dx;
        const nz = curr.z + d.dz;
        const idx = toIndex(nx, nz);
        if (idx >= 0 && !visited[idx] && isWalkable(nx, nz)) {
          visited[idx] = 1;
          queue.push({ x: nx, z: nz });
        }
      }
    }

    // Verify every hotspot has at least one reachable point within its interactRadius
    for (const h of HOTSPOTS) {
      let reachableInInteractZone = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (visited[idx]) {
            const x = minX + c * step;
            const z = minZ + r * step;
            const dist = Math.hypot(x - h.x, z - h.z);
            if (dist <= h.interactRadius && dist >= h.radius + PLAYER_RADIUS) {
              reachableInInteractZone = true;
              break;
            }
          }
        }
        if (reachableInInteractZone) break;
      }
      expect(reachableInInteractZone, `Hotspot "${h.id}" must have reachable interaction zone`).toBe(true);
    }
  });

  it('correctly resolves collision against decorative rocket obstacle', () => {
    // Rocket is at (-4, -10) with radius 0.9.
    const initialPos = { x: -4, z: -8.8 };
    const resolved = resolveCollisions(initialPos, OBSTACLES, PLAYER_RADIUS, PLAYER_BOUNDS);

    // Distance must be at least obstacle.radius + PLAYER_RADIUS
    const distToRocket = Math.hypot(resolved.x - (-4), resolved.z - (-10));
    expect(distToRocket).toBeGreaterThanOrEqual(0.9 + PLAYER_RADIUS - 1e-4);
  });
});

describe('Movement Callback Contract Logic', () => {
  it('correctly calculates actual displacement versus input', () => {
    // If direction is provided and position advances, displacement > 0
    const prev = { x: 0, z: 0 };
    const nextMoving = { x: 0.1, z: 0 };
    const dx1 = nextMoving.x - prev.x;
    const dz1 = nextMoving.z - prev.z;
    const actuallyMoving = dx1 * dx1 + dz1 * dz1 > 1e-6;
    expect(actuallyMoving).toBe(true);

    // If player is pressed against an obstacle and cannot advance
    const nextPinned = { x: 0, z: 0 };
    const dx2 = nextPinned.x - prev.x;
    const dz2 = nextPinned.z - prev.z;
    const actuallyMovingPinned = dx2 * dx2 + dz2 * dz2 > 1e-6;
    expect(actuallyMovingPinned).toBe(false);
  });
});
