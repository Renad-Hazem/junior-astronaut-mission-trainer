import type {
  MissionLevel,
  ResourceDelta,
  ResourceHealth,
  ResourceKey,
  Resources,
} from './types';
import { SCIENCE_FACTS } from '../science/scienceFacts';

export const ALL_RESOURCE_KEYS: readonly ResourceKey[] = [
  'oxygen',
  'water',
  'food',
  'energy',
  'radiationProtection',
  'temperature',
] as const;

export const RESOURCE_LABELS: Record<ResourceKey, { label: string; tooltip: string }> = {
  oxygen: {
    label: 'Oxygen',
    tooltip: 'Usable breathable oxygen supply reserve (0–100 normalized index).',
  },
  water: {
    label: 'Water',
    tooltip: 'Purified drinking and life-support water supply (0–100 normalized index).',
  },
  food: {
    label: 'Food',
    tooltip: 'Crew food rations and greenhouse crop reserve (0–100 normalized index).',
  },
  energy: {
    label: 'Energy',
    tooltip: 'Stored electrical power from solar arrays and batteries (0–100 normalized index).',
  },
  radiationProtection: {
    label: 'Radiation Protection',
    tooltip: 'Effectiveness of habitat shielding and storm shelter protection (0–100 index).',
  },
  temperature: {
    label: 'Temperature Control',
    tooltip: 'Habitat thermal safety index — 100 means optimal thermal stability (not Celsius).',
  },
};

export const clampResource = (n: number): number =>
  Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;

export function applyEffects(base: Resources, ...deltas: (ResourceDelta | undefined)[]): Resources {
  const next = {} as Resources;

  for (const key of ALL_RESOURCE_KEYS) {
    const baseVal = base[key] ?? 0;
    const totalDelta = deltas.reduce((sum, delta) => {
      if (!delta) return sum;
      const val = delta[key];
      if (val !== undefined && !Number.isFinite(val)) {
        throw new Error(`Invalid non-finite delta for resource "${key}"`);
      }
      return sum + (val ?? 0);
    }, 0);

    next[key] = clampResource(baseVal + totalDelta);
  }

  return next;
}

export function computeNetDelta(before: Resources, after: Resources): ResourceDelta {
  const diff: ResourceDelta = {};
  for (const key of ALL_RESOURCE_KEYS) {
    const delta = after[key] - before[key];
    if (delta !== 0) {
      diff[key] = delta;
    }
  }
  return diff;
}

export function getResourceHealth(value: number): ResourceHealth {
  if (value >= 60) return 'healthy';
  if (value >= 30) return 'caution';
  return 'critical';
}

export function getWarningResources(resources: Resources): ResourceKey[] {
  return ALL_RESOURCE_KEYS.filter((key) => resources[key] < 30);
}

export function hasExhaustedResource(resources: Resources): boolean {
  return ALL_RESOURCE_KEYS.some((key) => resources[key] <= 0);
}

export function validateMissionLevels(levels: MissionLevel[]): string[] {
  const errors: string[] = [];
  const validKeys = new Set<string>(ALL_RESOURCE_KEYS);
  const levelIds = new Set<string>();

  for (const level of levels) {
    if (levelIds.has(level.id)) {
      errors.push(`Duplicate level id: ${level.id}`);
    }
    levelIds.add(level.id);

    if (level.events.length < 3) {
      errors.push(`Level ${level.id} must have at least 3 decision events.`);
    }

    const eventIds = new Set<string>();
    for (const event of level.events) {
      if (eventIds.has(event.id)) {
        errors.push(`Duplicate event id "${event.id}" in level "${level.id}"`);
      }
      eventIds.add(event.id);

      if (event.openingEffects) {
        for (const k of Object.keys(event.openingEffects)) {
          if (!validKeys.has(k)) {
            errors.push(`Unknown resource key "${k}" in openingEffects of event "${event.id}"`);
          }
        }
      }

      if (event.choices.length < 2) {
        errors.push(`Event "${event.id}" must have at least 2 choices.`);
      }

      const choiceIds = new Set<string>();
      for (const choice of event.choices) {
        if (choiceIds.has(choice.id)) {
          errors.push(`Duplicate choice id "${choice.id}" in event "${event.id}"`);
        }
        choiceIds.add(choice.id);

        if (!choice.label.trim() || !choice.preview.trim() || !choice.consequence.trim()) {
          errors.push(`Choice "${choice.id}" is missing label, preview, or consequence.`);
        }

        for (const k of Object.keys(choice.effects)) {
          if (!validKeys.has(k)) {
            errors.push(`Unknown resource key "${k}" in choice "${choice.id}"`);
          }
        }

        for (const factId of choice.scienceFactIds) {
          if (!SCIENCE_FACTS[factId]) {
            errors.push(`Unresolved scienceFactId "${factId}" in choice "${choice.id}"`);
          }
        }
      }
    }

    for (const factId of level.briefScienceFactIds) {
      if (!SCIENCE_FACTS[factId]) {
        errors.push(`Unresolved briefScienceFactId "${factId}" in level "${level.id}"`);
      }
    }
  }

  return errors;
}