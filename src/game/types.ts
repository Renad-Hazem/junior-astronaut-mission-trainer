export type LevelId =
  | 'level-1-first-day'
  | 'level-2-power-crisis'
  | 'level-3-oxygen-emergency'
  | 'level-4-survival-challenge'
  | 'bonus-05-solar-storm-watch'
  | (string & {});

export type MissionNumber = 1 | 2 | 3 | 4 | 5;
export type MissionTitle =
  | 'First Day on Mars'
  | 'Power Crisis'
  | 'Oxygen Emergency'
  | 'Mars Survival Challenge'
  | 'Solar Storm Watch';

export type HotspotId =
  | 'habitat'
  | 'solar'
  | 'oxygen'
  | 'water'
  | 'greenhouse'
  | 'communications'
  | 'rover';

export type ResourceKey =
  | 'oxygen'
  | 'water'
  | 'food'
  | 'energy'
  | 'radiationProtection'
  | 'temperature';

export interface Resources {
  oxygen: number;
  water: number;
  food: number;
  energy: number;
  radiationProtection: number;
  temperature: number;
}

export type ResourceDelta = Partial<Record<ResourceKey, number>>;

export type SceneStatus =
  | 'normal'
  | 'dust'
  | 'oxygen_alert'
  | 'radiation_alert'
  | 'restored';

export type ResourceHealth = 'healthy' | 'caution' | 'critical';

export type MissionCompletionStatus =
  | 'Mission Reviewed'
  | 'Crew Stabilized'
  | 'Support Needed';

export interface DecisionOption {
  id: string;
  label: string;
  preview: string;
  effects: ResourceDelta;
  consequence: string;
  pipNote?: string;
  scienceFactIds: string[];
  isOptimalHint?: boolean;
}

export interface MissionEvent {
  id: string;
  title: string;
  prompt: string;
  pipIntro: string;
  sceneStatus: SceneStatus;
  openingEffects?: ResourceDelta;
  highlightModule?: HotspotId;
  diagnosticHint?: string;
  choices: DecisionOption[];
}

export interface MissionLevel {
  id: LevelId;
  levelNumber: MissionNumber;
  title: MissionTitle;
  difficulty: 'Beginner' | 'Intermediate' | 'Intermediate–Advanced' | 'Capstone' | 'Bonus';
  estimatedMinutes: string;
  tagline: string;
  story: string;
  pipOpening: string;
  pipClosing: string;
  learningObjectives: string[];
  initialResources: Resources;
  initialSceneStatus: SceneStatus;
  activeHighlightResources: ResourceKey[];
  events: MissionEvent[];
  briefTryNextTime: string;
  briefScienceFactIds: string[];
}

export interface ScienceFact {
  id: string;
  title: string;
  summary: string;
  sourceLabel: string;
  url: string;
  simulationDisclaimer: string;
}

export interface ChoiceRecord {
  stepNumber: number;
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
  openingEffectsApplied: ResourceDelta;
  choiceEffectsApplied: ResourceDelta;
  beforeResources: Resources;
  afterResources: Resources;
  consequence: string;
  pipNote?: string;
  lessonSummary: string;
  scienceFactIds: string[];
}

export interface ResourceComparisonRow {
  key: ResourceKey;
  label: string;
  before: number;
  after: number;
  delta: number;
  health: ResourceHealth;
}

export interface MissionBriefReport {
  levelId: LevelId;
  levelNumber: MissionNumber;
  missionTitle: MissionLevel['title'];
  status: MissionCompletionStatus;
  isStabilizationProtocol: boolean;
  headlineMessage: string;
  pipClosingMessage: string;
  initialResources: Resources;
  finalResources: Resources;
  resourceComparisons: ResourceComparisonRow[];
  choiceHistory: ChoiceRecord[];
  scienceFacts: ScienceFact[];
  tryNextTime: string;
  planningScore: number;
}

export interface GameStore {
  selectedLevelId: LevelId | null;
  currentLevel: MissionLevel | null;
  resources: Resources;
  sceneStatus: SceneStatus;
  currentEventIndex: number;
  resolvedChoiceForCurrentEvent: ChoiceRecord | null;
  choiceHistory: ChoiceRecord[];
  activeWarnings: ResourceKey[];
  isStabilizationTriggered: boolean;
  isMissionComplete: boolean;
  missionBrief: MissionBriefReport | null;
  completedLevelIds: LevelId[];
  completedBonusMissionIds: LevelId[];

  selectLevel: (levelId: LevelId) => void;
  chooseOption: (choiceId: string) => void;
  continueMission: () => void;
  returnToLibrary: () => void;
  restartLevel: () => void;
}
