import { afterEach, describe, expect, it, vi } from 'vitest';
import { MISSION_LEVELS } from '../data/levels';
import { applyEffects, hasExhaustedResource } from './resourceEngine';
import { isLevelUnlocked, sanitizeCompletedLevelIds } from './progression';
import type { GameStore, LevelId, Resources } from './types';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

type StoreModule = typeof import('./useGameStore');

async function loadFreshStore(storage = new MemoryStorage()): Promise<StoreModule> {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  vi.resetModules();
  const module = await import('./useGameStore');
  await module.useGameStore.persist.rehydrate();
  return module;
}

function completeActiveMission(store: StoreModule['useGameStore']): void {
  const level = store.getState().currentLevel;
  if (!level) throw new Error('Expected an active mission');

  level.events.forEach((event, eventIndex) => {
    const option = event.choices.find((choice) => choice.isOptimalHint) ?? event.choices[0];
    const historyLength = store.getState().choiceHistory.length;

    store.getState().chooseOption(option.id);
    expect(store.getState().choiceHistory).toHaveLength(historyLength + 1);

    const afterFirstChoice = store.getState();
    store.getState().chooseOption(option.id);
    expect(store.getState().resources).toEqual(afterFirstChoice.resources);
    expect(store.getState().choiceHistory).toHaveLength(historyLength + 1);

    store.getState().continueMission();
    const afterFirstContinue = store.getState();
    store.getState().continueMission();
    expect(store.getState().currentEventIndex).toBe(afterFirstContinue.currentEventIndex);
    expect(store.getState().choiceHistory).toHaveLength(historyLength + 1);
    expect(Object.values(store.getState().resources).every((value) => value >= 0 && value <= 100)).toBe(true);

    if (eventIndex < level.events.length - 1) {
      expect(store.getState().isMissionComplete).toBe(false);
    }
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('resource calculations', () => {
  it('applies multiple effects without mutation and clamps every resource', () => {
    const base: Resources = {
      oxygen: 98, water: 2, food: 50, energy: 50,
      radiationProtection: 50, temperature: 50,
    };
    const result = applyEffects(
      base,
      { oxygen: 7, water: -8, energy: 4.6 },
      { energy: 2.6, food: -1000 },
    );

    expect(result).toEqual({
      oxygen: 100, water: 0, food: 0, energy: 57,
      radiationProtection: 50, temperature: 50,
    });
    expect(base).toEqual({
      oxygen: 98, water: 2, food: 50, energy: 50,
      radiationProtection: 50, temperature: 50,
    });
    expect(hasExhaustedResource(result)).toBe(true);
    expect(() => applyEffects(base, { energy: Number.NaN })).toThrow(/non-finite delta/);
  });
});
describe('progression validation', () => {
  const [level1, level2, level3] = MISSION_LEVELS;

  it('unlocks only the valid consecutive mission sequence', () => {
    expect(isLevelUnlocked(level1.id, [])).toBe(true);
    expect(isLevelUnlocked(level2.id, [])).toBe(false);
    expect(isLevelUnlocked(level2.id, [level1.id])).toBe(true);
    expect(isLevelUnlocked(level3.id, [level1.id])).toBe(false);
    expect(isLevelUnlocked('unknown-level' as LevelId, [level1.id])).toBe(false);
    expect(sanitizeCompletedLevelIds([level2.id, level3.id, 'bad', 12])).toEqual([]);
    expect(sanitizeCompletedLevelIds([level1.id, level3.id, level1.id])).toEqual([level1.id]);
  });
});

describe('game store mission transitions', () => {
  it('rejects direct locked and unknown mission selection', async () => {
    const { useGameStore } = await loadFreshStore();
    useGameStore.getState().selectLevel(MISSION_LEVELS[1].id);
    expect(useGameStore.getState().selectedLevelId).toBeNull();
    useGameStore.getState().selectLevel('not-a-mission' as LevelId);
    expect(useGameStore.getState().selectedLevelId).toBeNull();
    useGameStore.getState().selectLevel(MISSION_LEVELS[0].id);
    expect(useGameStore.getState().selectedLevelId).toBe(MISSION_LEVELS[0].id);
  });

  it('plays all four missions, unlocks sequentially, and preserves replay progress', async () => {
    const { useGameStore } = await loadFreshStore();

    for (const [index, level] of MISSION_LEVELS.entries()) {
      useGameStore.getState().selectLevel(level.id);
      expect(useGameStore.getState().selectedLevelId).toBe(level.id);
      expect(useGameStore.getState().currentLevel?.events).toHaveLength(level.events.length);
      completeActiveMission(useGameStore);
      expect(useGameStore.getState().isMissionComplete).toBe(true);
      expect(useGameStore.getState().missionBrief?.choiceHistory).toHaveLength(level.events.length);
      expect(useGameStore.getState().completedLevelIds).toEqual(
        MISSION_LEVELS.slice(0, index + 1).map((item) => item.id),
      );
    }

    const completedCampaign = [...useGameStore.getState().completedLevelIds];
    useGameStore.getState().selectLevel(MISSION_LEVELS[0].id);
    useGameStore.getState().restartLevel();
    expect(useGameStore.getState().completedLevelIds).toEqual(completedCampaign);
    useGameStore.getState().returnToLibrary();
    expect(useGameStore.getState().completedLevelIds).toEqual(completedCampaign);
    expect(useGameStore.getState().selectedLevelId).toBeNull();
  });

  it('keeps the exhausted-resource consequence until explicit stabilization continue', async () => {
    const { useGameStore } = await loadFreshStore();
    const level = MISSION_LEVELS[0];
    const choice = level.events[0].choices.find((option) => (option.effects.energy ?? 0) < 0);
    if (!choice) throw new Error('Expected a choice that consumes energy');

    useGameStore.getState().selectLevel(level.id);
    useGameStore.setState((state: GameStore) => ({
      resources: { ...state.resources, energy: 1 },
    }));
    useGameStore.getState().chooseOption(choice.id);

    const pending = useGameStore.getState();
    expect(pending.resources.energy).toBe(0);
    expect(pending.choiceHistory).toHaveLength(1);
    expect(pending.resolvedChoiceForCurrentEvent?.choiceId).toBe(choice.id);
    expect(pending.missionBrief?.choiceHistory).toHaveLength(1);
    expect(pending.isStabilizationTriggered).toBe(true);
    expect(pending.isMissionComplete).toBe(false);
    expect(pending.completedLevelIds).toEqual([]);

    useGameStore.getState().chooseOption(choice.id);
    expect(useGameStore.getState().choiceHistory).toHaveLength(1);
    expect(useGameStore.getState().resources.energy).toBe(0);

    useGameStore.getState().continueMission();
    expect(useGameStore.getState().isMissionComplete).toBe(true);
    expect(useGameStore.getState().currentEventIndex).toBe(0);
    expect(useGameStore.getState().completedLevelIds).toEqual([]);

    const terminal = useGameStore.getState();
    useGameStore.getState().continueMission();
    expect(useGameStore.getState()).toEqual(terminal);

    useGameStore.getState().restartLevel();
    expect(useGameStore.getState().isStabilizationTriggered).toBe(false);
    expect(useGameStore.getState().choiceHistory).toEqual([]);
    expect(useGameStore.getState().completedLevelIds).toEqual([]);
  });

  it('rejects invalid choice IDs without changing mission state', async () => {
    const { useGameStore } = await loadFreshStore();
    useGameStore.getState().selectLevel(MISSION_LEVELS[0].id);
    const before = useGameStore.getState();
    useGameStore.getState().chooseOption('not-a-choice');
    expect(useGameStore.getState().resources).toEqual(before.resources);
    expect(useGameStore.getState().choiceHistory).toEqual([]);
    expect(useGameStore.getState().resolvedChoiceForCurrentEvent).toBeNull();
  });
});

describe('progress persistence', () => {
  it('persists only validated completion progress and restores it after reload', async () => {
    const storage = new MemoryStorage();
    const firstLoad = await loadFreshStore(storage);
    firstLoad.useGameStore.getState().selectLevel(MISSION_LEVELS[0].id);
    completeActiveMission(firstLoad.useGameStore);

    const serialized = storage.getItem(firstLoad.GAME_PROGRESS_STORAGE_KEY);
    expect(serialized).not.toBeNull();
    const parsed = JSON.parse(serialized ?? '{}');
    expect(parsed.version).toBe(firstLoad.GAME_PROGRESS_STORAGE_VERSION);
    expect(parsed.state).toEqual({ completedLevelIds: [MISSION_LEVELS[0].id] });

    const secondLoad = await loadFreshStore(storage);
    expect(secondLoad.useGameStore.getState().completedLevelIds).toEqual([MISSION_LEVELS[0].id]);
    expect(isLevelUnlocked(MISSION_LEVELS[1].id, secondLoad.useGameStore.getState().completedLevelIds)).toBe(true);
    expect(isLevelUnlocked(MISSION_LEVELS[2].id, secondLoad.useGameStore.getState().completedLevelIds)).toBe(false);
  });

  it('rejects malformed and out-of-order stored progress safely', async () => {
    const malformedStorage = new MemoryStorage();
    malformedStorage.setItem('mars-base:game-progress:v1', '{broken-json');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const malformedLoad = await loadFreshStore(malformedStorage);
    expect(malformedLoad.useGameStore.getState().completedLevelIds).toEqual([]);
    consoleError.mockRestore();

    const invalidStorage = new MemoryStorage();
    invalidStorage.setItem('mars-base:game-progress:v1', JSON.stringify({
      version: 1,
      state: { completedLevelIds: [MISSION_LEVELS[1].id, MISSION_LEVELS[3].id, 'unknown'] },
    }));
    const invalidLoad = await loadFreshStore(invalidStorage);
    expect(invalidLoad.useGameStore.getState().completedLevelIds).toEqual([]);
    invalidLoad.useGameStore.getState().selectLevel(MISSION_LEVELS[1].id);
    expect(invalidLoad.useGameStore.getState().selectedLevelId).toBeNull();

    const futureVersionStorage = new MemoryStorage();
    futureVersionStorage.setItem('mars-base:game-progress:v1', JSON.stringify({
      version: 999,
      state: { completedLevelIds: [MISSION_LEVELS[0].id] },
    }));
    const futureVersionLoad = await loadFreshStore(futureVersionStorage);
    expect(futureVersionLoad.useGameStore.getState().completedLevelIds).toEqual([]);
  });
});
