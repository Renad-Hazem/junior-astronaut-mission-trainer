import {
  isLevelUnlocked as fallbackIsLevelUnlocked,
  missionLevels as fallbackMissionLevels,
  resourceMeta as fallbackResourceMeta,
  scienceFacts as fallbackScienceFacts,
  useGameStore as useFallbackGameStore,
} from '../__stubs__/gameAdapter'
import type { GameUiPort } from './gameUiContract'

const fallbackGameUiPort = {
  useGameStore: useFallbackGameStore,
  missionLevels: fallbackMissionLevels,
  resourceMeta: fallbackResourceMeta,
  scienceFacts: fallbackScienceFacts,
  isLevelUnlocked: fallbackIsLevelUnlocked,
  mode: 'fallback',
} satisfies GameUiPort

// Single replacement seam for Malak's real exports. Keep page/components
// dependent on this UI port rather than importing the temporary adapter.
export const useGameStore = fallbackGameUiPort.useGameStore
export const missionLevels = fallbackGameUiPort.missionLevels
export const resourceMeta = fallbackGameUiPort.resourceMeta
export const scienceFacts = fallbackGameUiPort.scienceFacts
export const isLevelUnlocked = fallbackGameUiPort.isLevelUnlocked
export const gameIntegrationMode = fallbackGameUiPort.mode

export type {
  DecisionOption,
  DecisionRecord,
  GameUiState,
  HotspotId,
  LevelId,
  MissionEvent,
  MissionLevel,
  MissionReport,
  ResourceDelta,
  ResourceKey,
  Resources,
  SceneStatus,
  ScienceFact,
} from './gameUiContract'
