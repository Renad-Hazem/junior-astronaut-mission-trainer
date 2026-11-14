import { useMemo } from "react";
import { create } from "zustand";

import { useGameStore as useEngineStore } from "./useGameStore";
import { MISSION_LEVELS } from "../data/levels";
import { SCIENCE_FACTS } from "../science/scienceFacts";

import type {
  MissionLevel as EngineLevel,
  MissionEvent as EngineEvent,
  ChoiceRecord,
  MissionBriefReport,
  ResourceKey,
  Resources,
  SceneStatus,
  HotspotId,
  ResourceDelta,
} from "./types";

// Navigation is separate from the actual game engine.
export type ScreenId = "home" | "library" | "gameplay" | "brief";

const useNavigationStore = create<{ screen: ScreenId }>(() => ({
  screen: "home",
}));

export type LevelId = EngineLevel["id"];
export type { ResourceKey, Resources, SceneStatus, HotspotId, ResourceDelta };

export interface DecisionOption {
  id: string;
  label: string;
  preview: string;
  effects: ResourceDelta;
  consequence: string;
  scienceFactIds: string[];
}

export interface MissionEvent {
  id: string;
  headline: string;
  prompt: string;
  sceneStatus: SceneStatus;
  hotspotId?: HotspotId;
  openingEffects?: ResourceDelta;
  options: DecisionOption[];
}

export interface MissionLevel {
  id: LevelId;
  order: number;
  title: string;
  difficulty: string;
  objective: string;
  storyIntro: string;
  initialResources: Resources;
  events: MissionEvent[];
  estimatedMinutes: [number, number];
}

export interface DecisionRecord {
  eventId: string;
  eventTitle: string;
  optionId: string;
  optionLabel: string;
  before: Resources;
  after: Resources;
  deltaApplied: ResourceDelta;
  consequence: string;
  scienceFactIds: string[];
}

export interface MissionReport {
  levelId: LevelId;
  title: string;
  started: Resources;
  ended: Resources;
  decisions: DecisionRecord[];
  status: "reviewed" | "stabilized" | "support-needed";
  scienceFactIds: string[];
  suggestion: string;
}

export interface ScienceFact {
  id: string;
  title: string;
  childFriendlyText: string;
  advancedText: string;
  sourceTitle: string;
  sourceUrl: string;
}

const toMinutes = (value: string): [number, number] => {
  const numbers = value.match(/\d+/g)?.map(Number) ?? [10, 15];
  return [numbers[0], numbers[1] ?? numbers[0]];
};

const mapEvent = (event: EngineEvent): MissionEvent => ({
  id: event.id,
  headline: event.title,
  prompt: event.prompt,
  sceneStatus: event.sceneStatus,
  hotspotId: event.highlightModule,
  openingEffects: event.openingEffects,
  options: event.choices.map((choice) => ({
    id: choice.id,
    label: choice.label,
    preview: choice.preview,
    effects: choice.effects,
    consequence: choice.consequence,
    scienceFactIds: choice.scienceFactIds,
  })),
});

export const missionLevels: MissionLevel[] = MISSION_LEVELS.map((level) => ({
  id: level.id,
  order: level.levelNumber,
  title: level.title,
  difficulty: level.difficulty,
  objective: level.learningObjectives.join(" "),
  storyIntro: level.story,
  initialResources: level.initialResources,
  events: level.events.map(mapEvent),
  estimatedMinutes: toMinutes(level.estimatedMinutes),
}));

export const scienceFacts: Record<string, ScienceFact> = Object.fromEntries(
  Object.entries(SCIENCE_FACTS).map(([id, fact]) => [
    id,
    {
      id: fact.id,
      title: fact.title,
      childFriendlyText: fact.summary,
      advancedText: fact.summary,
      sourceTitle: fact.sourceLabel,
      sourceUrl: fact.url,
    },
  ]),
);

export const resourceMeta: Record<
  ResourceKey,
  { label: string; icon: string; description: string }
> = {
  oxygen: {
    label: "Oxygen",
    icon: "O₂",
    description: "Breathable-air reserve",
  },
  water: {
    label: "Water",
    icon: "💧",
    description: "Clean-water reserve",
  },
  food: {
    label: "Food",
    icon: "🌱",
    description: "Crew food supply",
  },
  energy: {
    label: "Energy",
    icon: "⚡",
    description: "Stored electrical energy",
  },
  radiationProtection: {
    label: "Radiation Protection",
    icon: "🛡️",
    description: "Protection-system effectiveness",
  },
  temperature: {
    label: "Temperature Control",
    icon: "🌡️",
    description: "Habitat thermal safety index",
  },
};

const mapDecision = (record: ChoiceRecord): DecisionRecord => {
  const deltaApplied = Object.fromEntries(
    (Object.keys(record.afterResources) as ResourceKey[])
      .map((key) => [
        key,
        record.afterResources[key] - record.beforeResources[key],
      ])
      .filter(([, value]) => value !== 0),
  ) as ResourceDelta;

  return {
    eventId: record.eventId,
    eventTitle: record.eventTitle,
    optionId: record.choiceId,
    optionLabel: record.choiceLabel,
    before: record.beforeResources,
    after: record.afterResources,
    deltaApplied,
    consequence: record.consequence,
    scienceFactIds: record.scienceFactIds,
  };
};

const mapReport = (report: MissionBriefReport | null): MissionReport | null => {
  if (!report) return null;

  return {
    levelId: report.levelId,
    title: report.missionTitle,
    started: report.initialResources,
    ended: report.finalResources,
    decisions: report.choiceHistory.map(mapDecision),
    status:
      report.status === "Mission Reviewed"
        ? "reviewed"
        : report.status === "Crew Stabilized"
          ? "stabilized"
          : "support-needed",
    scienceFactIds: report.scienceFacts.map((fact) => fact.id),
    suggestion: report.tryNextTime,
  };
};

const isUnlocked = (id: LevelId, completedLevelIds: readonly LevelId[]) => {
  const level = missionLevels.find((item) => item.id === id);
  if (!level) return false;
  if (level.order === 1 || completedLevelIds.includes(id)) return true;

  const previous = missionLevels.find((item) => item.order === level.order - 1);

  return previous ? completedLevelIds.includes(previous.id) : false;
};

export const isLevelUnlocked = isUnlocked;

interface AdapterState {
  screen: ScreenId;
  activeLevelId: LevelId | null;
  eventIndex: number;
  resources: Resources;
  initialResources: Resources;
  decisionHistory: DecisionRecord[];
  lastDecision: DecisionRecord | null;
  isAwaitingContinue: boolean;
  currentReport: MissionReport | null;
  completedLevelIds: LevelId[];
  selectLevel: (id: LevelId) => void;
  chooseOption: (id: string) => void;
  continueMission: () => void;
  returnToLibrary: () => void;
  restartLevel: () => void;
}

export function useGameStore<T>(selector: (state: AdapterState) => T): T {
  const engine = useEngineStore((state) => state);
  const screen = useNavigationStore((state) => state.screen);

  const adaptedState = useMemo<AdapterState>(() => {
    const currentDecision = engine.resolvedChoiceForCurrentEvent;

    const state: AdapterState = {
      screen,
      activeLevelId: engine.selectedLevelId,
      eventIndex: engine.currentEventIndex,
      resources: engine.resources,
      initialResources:
        engine.currentLevel?.initialResources ?? engine.resources,
      decisionHistory: engine.choiceHistory.map(mapDecision),
      lastDecision: currentDecision ? mapDecision(currentDecision) : null,
      isAwaitingContinue: Boolean(currentDecision && !engine.isMissionComplete),
      currentReport: mapReport(engine.missionBrief),
      completedLevelIds: engine.completedLevelIds,

      selectLevel: (id) => {
        const completed = useEngineStore.getState().completedLevelIds;

        if (!isUnlocked(id, completed)) return;

        engine.selectLevel(id);
        useNavigationStore.setState({ screen: "gameplay" });
      },

      chooseOption: (id) => engine.chooseOption(id),

      continueMission: () => {
        engine.continueMission();

        if (useEngineStore.getState().isMissionComplete) {
          useNavigationStore.setState({ screen: "brief" });
        }
      },

      returnToLibrary: () => {
        engine.returnToLibrary();
        useNavigationStore.setState({ screen: "library" });
      },

      restartLevel: () => {
        engine.restartLevel();
        useNavigationStore.setState({ screen: "gameplay" });
      },
    };

    return state;
  }, [engine, screen]);

  return selector(adaptedState);
}
