import { create } from 'zustand';
import type {
  ChoiceRecord,
  GameStore,
  MissionEvent,
  MissionLevel,
  Resources,
} from './types';
import { MISSION_LEVELS, getMissionLevelById } from '../data/levels';
import {
  ALL_RESOURCE_KEYS,
  RESOURCE_LABELS,
  applyEffects,
  computeNetDelta,
  getWarningResources,
  hasExhaustedResource,
} from './resourceEngine';
import { buildMissionBrief } from './briefBuilder';

const DEFAULT_RESOURCES: Resources = {
  oxygen: 78,
  water: 76,
  food: 70,
  energy: 72,
  radiationProtection: 80,
  temperature: 78,
};

function formatLessonSummary(record: Omit<ChoiceRecord, 'lessonSummary'>): string {
  const net = computeNetDelta(record.beforeResources, record.afterResources);
  const ups: string[] = [];
  const downs: string[] = [];

  for (const key of ALL_RESOURCE_KEYS) {
    const delta = net[key] ?? 0;
    const name = RESOURCE_LABELS[key].label.toLowerCase();
    if (delta > 0) ups.push(`${name} up (+${delta})`);
    if (delta < 0) downs.push(`${name} down (${delta})`);
  }

  const parts: string[] = [];
  if (ups.length > 0) parts.push(ups.join(', '));
  if (downs.length > 0) parts.push(downs.join(', '));
  return parts.length > 0 ? parts.join('; ') : 'Balanced system state maintained';
}

function createInitialLevelState(level: MissionLevel) {
  const resources = { ...level.initialResources };
  return {
    selectedLevelId: level.id,
    currentLevel: level,
    resources,
    sceneStatus: level.initialSceneStatus,
    currentEventIndex: 0,
    resolvedChoiceForCurrentEvent: null,
    choiceHistory: [],
    activeWarnings: getWarningResources(resources),
    isStabilizationTriggered: false,
    isMissionComplete: false,
    missionBrief: null,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  selectedLevelId: null,
  currentLevel: null,
  resources: { ...DEFAULT_RESOURCES },
  sceneStatus: 'normal',
  currentEventIndex: 0,
  resolvedChoiceForCurrentEvent: null,
  choiceHistory: [],
  activeWarnings: [],
  isStabilizationTriggered: false,
  isMissionComplete: false,
  missionBrief: null,
  completedLevelIds: [],

  selectLevel: (levelId: string) => {
    const level = getMissionLevelById(levelId) ?? MISSION_LEVELS[0];
    set({
      ...createInitialLevelState(level),
    });
  },

  chooseOption: (choiceId: string) => {
    const state = get();
    const {
      currentLevel,
      currentEventIndex,
      resolvedChoiceForCurrentEvent,
      isMissionComplete,
      isStabilizationTriggered,
      resources,
      choiceHistory,
    } = state;

    if (
      !currentLevel ||
      isMissionComplete ||
      isStabilizationTriggered ||
      resolvedChoiceForCurrentEvent !== null
    ) {
      return;
    }

    const currentEvent: MissionEvent | undefined = currentLevel.events[currentEventIndex];
    if (!currentEvent) return;

    const chosenOption = currentEvent.choices.find((c) => c.id === choiceId);
    if (!chosenOption) return;

    const beforeResources: Resources = { ...resources };
    const afterResources: Resources = applyEffects(
      beforeResources,
      currentEvent.openingEffects,
      chosenOption.effects
    );

    const partialRecord = {
      stepNumber: choiceHistory.length + 1,
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      choiceId: chosenOption.id,
      choiceLabel: chosenOption.label,
      openingEffectsApplied: currentEvent.openingEffects ? { ...currentEvent.openingEffects } : {},
      choiceEffectsApplied: { ...chosenOption.effects },
      beforeResources,
      afterResources,
      consequence: chosenOption.consequence,
      pipNote: chosenOption.pipNote,
      scienceFactIds: [...chosenOption.scienceFactIds],
    };

    const record: ChoiceRecord = {
      ...partialRecord,
      lessonSummary: formatLessonSummary(partialRecord),
    };

    const nextHistory = [...choiceHistory, record];
    const warnings = getWarningResources(afterResources);
    const exhausted = hasExhaustedResource(afterResources);

    if (exhausted) {
      const brief = buildMissionBrief(currentLevel, afterResources, nextHistory);
      set({
        resources: afterResources,
        sceneStatus: currentEvent.sceneStatus,
        resolvedChoiceForCurrentEvent: record,
        choiceHistory: nextHistory,
        activeWarnings: warnings,
        isStabilizationTriggered: true,
        isMissionComplete: true,
        missionBrief: brief,
      });
      return;
    }

    set({
      resources: afterResources,
      sceneStatus: currentEvent.sceneStatus,
      resolvedChoiceForCurrentEvent: record,
      choiceHistory: nextHistory,
      activeWarnings: warnings,
    });
  },

  continueMission: () => {
    const state = get();
    const {
      currentLevel,
      currentEventIndex,
      resolvedChoiceForCurrentEvent,
      resources,
      choiceHistory,
      completedLevelIds,
    } = state;

    if (!currentLevel || !resolvedChoiceForCurrentEvent) {
      return;
    }

    const nextIndex = currentEventIndex + 1;
    if (nextIndex < currentLevel.events.length) {
      const nextEvent = currentLevel.events[nextIndex];
      set({
        currentEventIndex: nextIndex,
        resolvedChoiceForCurrentEvent: null,
        sceneStatus: nextEvent.sceneStatus,
      });
      return;
    }

    const brief = buildMissionBrief(currentLevel, resources, choiceHistory);
    const updatedCompleted = completedLevelIds.includes(currentLevel.id)
      ? completedLevelIds
      : [...completedLevelIds, currentLevel.id];

    set({
      isMissionComplete: true,
      sceneStatus: 'restored',
      missionBrief: brief,
      completedLevelIds: updatedCompleted,
    });
  },

  returnToLibrary: () => {
    set({
      selectedLevelId: null,
      currentLevel: null,
      currentEventIndex: 0,
      resolvedChoiceForCurrentEvent: null,
      choiceHistory: [],
      activeWarnings: [],
      isStabilizationTriggered: false,
      isMissionComplete: false,
      missionBrief: null,
      sceneStatus: 'normal',
    });
  },

  restartLevel: () => {
    const { currentLevel } = get();
    if (!currentLevel) return;
    set({
      ...createInitialLevelState(currentLevel),
    });
  },
}));