import { MISSION_LEVELS } from '../data/levels';
import type { LevelId } from './types';

const ORDERED_LEVEL_IDS: readonly LevelId[] = MISSION_LEVELS.map((level) => level.id);

export function sanitizeCompletedLevelIds(value: unknown): LevelId[] {
  if (!Array.isArray(value)) return [];

  const suppliedIds = new Set(value.filter((item): item is string => typeof item === 'string'));
  const completed: LevelId[] = [];

  for (const levelId of ORDERED_LEVEL_IDS) {
    if (!suppliedIds.has(levelId)) break;
    completed.push(levelId);
  }

  return completed;
}

export function isLevelUnlocked(
  levelId: LevelId,
  completedLevelIds: readonly LevelId[],
): boolean {
  const levelIndex = ORDERED_LEVEL_IDS.indexOf(levelId);
  if (levelIndex < 0) return false;
  if (levelIndex === 0) return true;

  const completed = new Set(sanitizeCompletedLevelIds(completedLevelIds));
  return completed.has(levelId) || completed.has(ORDERED_LEVEL_IDS[levelIndex - 1]);
}
