export type ResourceKey =
  | 'oxygen'
  | 'water'
  | 'food'
  | 'energy'
  | 'radiationProtection'
  | 'temperature'

export type Resources = Record<ResourceKey, number>
export type LevelId = 'first-day-on-mars' | 'power-crisis' | 'oxygen-emergency' | 'mars-survival-challenge'
export type ScreenId = 'home' | 'library' | 'gameplay' | 'brief'
export type SceneStatus = 'normal' | 'dust' | 'oxygen_alert' | 'radiation_alert' | 'restored'
export type HotspotId = 'habitat' | 'solar' | 'oxygen' | 'water' | 'greenhouse' | 'communications' | 'rover'
export type ResourceDelta = Partial<Resources>

export interface DecisionOption {
  id: string
  label: string
  preview: string
  effects: ResourceDelta
  consequence: string
  scienceFactIds: string[]
}

export interface MissionEvent {
  id: string
  headline: string
  prompt: string
  sceneStatus: SceneStatus
  hotspotId?: HotspotId
  openingEffects?: ResourceDelta
  options: DecisionOption[]
}

export interface MissionLevel {
  id: LevelId
  order: number
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  objective: string
  storyIntro: string
  initialResources: Resources
  events: MissionEvent[]
  estimatedMinutes: [number, number]
}

export interface DecisionRecord {
  eventId: string
  eventTitle: string
  optionId: string
  optionLabel: string
  before: Resources
  after: Resources
  deltaApplied: ResourceDelta
  consequence: string
  scienceFactIds: string[]
}

export interface MissionReport {
  levelId: LevelId
  title: string
  started: Resources
  ended: Resources
  decisions: DecisionRecord[]
  status: 'reviewed' | 'stabilized'
  scienceFactIds: string[]
  suggestion: string
}

export interface ScienceFact {
  id: string
  title: string
  childFriendlyText: string
  advancedText: string
  sourceTitle: string
  sourceUrl: string
}

export interface ResourceMetadata {
  label: string
  icon: string
  description: string
}

/**
 * UI projection of the game state. This is not a request for Malak to export
 * these exact declarations. The integration bridge must adapt the approved
 * store to this view without moving game rules into React.
 */
export interface GameUiState {
  screen: ScreenId
  activeLevelId: LevelId | null
  eventIndex: number
  resources: Resources
  initialResources: Resources
  decisionHistory: DecisionRecord[]
  lastDecision: DecisionRecord | null
  isAwaitingContinue: boolean
  currentReport: MissionReport | null
  completedLevelIds: readonly LevelId[]
  selectLevel: (id: LevelId) => void
  chooseOption: (optionId: string) => void
  continueMission: () => void
  returnToLibrary: () => void
  restartLevel: () => void
}

export type GameUiStoreHook = <T>(selector: (store: GameUiState) => T) => T

export interface GameUiPort {
  useGameStore: GameUiStoreHook
  missionLevels: readonly MissionLevel[]
  resourceMeta: Readonly<Record<ResourceKey, ResourceMetadata>>
  scienceFacts: Readonly<Record<string, ScienceFact>>
  isLevelUnlocked: (id: LevelId, completedLevelIds: readonly LevelId[]) => boolean
  mode: 'fallback' | 'real'
}
