import { useSyncExternalStore } from 'react'

// TEMPORARY INTEGRATION ADAPTER: replace imports from this file with Malak's
// src/game/gameStore.ts and src/data exports when those branches are merged.
export type ResourceKey = 'oxygen' | 'water' | 'food' | 'energy' | 'radiationProtection' | 'temperature'
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

const resources = (
  oxygen: number,
  water: number,
  food: number,
  energy: number,
  radiationProtection: number,
  temperature: number,
): Resources => ({ oxygen, water, food, energy, radiationProtection, temperature })

const option = (
  id: string,
  label: string,
  preview: string,
  effects: ResourceDelta,
  consequence: string,
  scienceFactIds: string[],
): DecisionOption => ({ id, label, preview, effects, consequence, scienceFactIds })

export const scienceFacts: Record<string, ScienceFact> = {
  'NASA-OXYGEN': {
    id: 'NASA-OXYGEN',
    title: 'Why does a Mars base need oxygen systems?',
    childFriendlyText: 'Mars has an atmosphere, but not enough oxygen for people to breathe. A base needs special equipment to keep its air safe.',
    advancedText: 'Future habitats need sealed air systems and oxygen generation instead of relying on the thin, carbon-dioxide-rich outside atmosphere.',
    sourceTitle: 'NASA — Is There Oxygen on Mars?',
    sourceUrl: 'https://www.nasa.gov/solar-system/is-there-oxygen-on-mars-we-asked-a-nasa-technologist-episode-7/',
  },
  'NASA-DUST': {
    id: 'NASA-DUST',
    title: 'How can dust affect power?',
    childFriendlyText: 'Dust can block some sunlight from reaching solar panels, leaving less electricity for a Mars base.',
    advancedText: 'Airborne and deposited dust can reduce solar energy, making batteries and careful power priorities important.',
    sourceTitle: 'NASA — The Fact and Fiction of Martian Dust Storms',
    sourceUrl: 'https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/',
  },
  'NASA-ECLSS': {
    id: 'NASA-ECLSS',
    title: 'Why are air, water and power connected?',
    childFriendlyText: 'Life-support machines clean air and recycle water so a space crew has what it needs.',
    advancedText: 'Water recovery, air revitalization and oxygen generation are distinct systems that need equipment, maintenance and electrical power.',
    sourceTitle: 'NASA — Environmental Control and Life Support Systems',
    sourceUrl: 'https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/',
  },
  'NASA-RADIATION': {
    id: 'NASA-RADIATION',
    title: 'Why use protective shelter?',
    childFriendlyText: 'Some space radiation is invisible, so astronauts need monitoring and protective shelter.',
    advancedText: 'Beyond much of Earth’s protection, crews must reduce exposure from solar energetic particles and galactic cosmic rays.',
    sourceTitle: 'NASA — Hazard: Space Radiation',
    sourceUrl: 'https://www.nasa.gov/hrp/hazard-space-radiation/',
  },
  'NASA-MARS-ICE': {
    id: 'NASA-MARS-ICE',
    title: 'Why manage water carefully?',
    childFriendlyText: 'Mars has water ice, but a crew still needs safe ways to collect, clean and recycle water.',
    advancedText: 'Gathering and processing Martian water ice would require engineering and power; recycling reduces resupply needs.',
    sourceTitle: 'NASA Science — Mars Facts',
    sourceUrl: 'https://science.nasa.gov/mars/facts/',
  },
  'NASA-HEAT': {
    id: 'NASA-HEAT',
    title: 'Why control habitat temperature?',
    childFriendlyText: 'Mars is often very cold, so a base needs systems that keep the inside comfortable.',
    advancedText: 'Insulation, heaters and monitoring help a controlled habitat remain stable in Mars’s thin atmosphere.',
    sourceTitle: 'NASA Science — Temperatures Across Our Solar System',
    sourceUrl: 'https://science.nasa.gov/solar-system/temperatures-across-our-solar-system/',
  },
}

export const missionLevels: MissionLevel[] = [
  {
    id: 'first-day-on-mars', order: 1, title: 'First Day on Mars', difficulty: 'Beginner',
    objective: 'Learn how air, water, food and power keep Aster Base running.',
    storyIntro: 'PIP is ready to guide your first systems check before the first Martian night.',
    initialResources: resources(78, 76, 70, 72, 80, 78), estimatedMinutes: [12, 15],
    events: [
      { id: 'air-setup', headline: 'Air System Setup', prompt: 'The habitat air system needs its first check. What should we do?', sceneStatus: 'normal', hotspotId: 'oxygen', options: [
        option('run-oxygen', 'Run the oxygen system', 'Build the oxygen reserve; use energy and water.', { oxygen: 14, energy: -10, water: -5 }, 'The air reserve rises while the oxygen equipment uses power and water.', ['NASA-OXYGEN', 'NASA-ECLSS']),
        option('inspect-filters', 'Inspect filters first', 'Gain a smaller oxygen boost while learning the system.', { oxygen: 5, energy: -3 }, 'The careful filter check improves airflow and reveals how the system works.', ['NASA-OXYGEN']),
      ] },
      { id: 'water-recycler', headline: 'Water Recycler Check', prompt: 'The recycling unit is ready for a maintenance cycle.', sceneStatus: 'normal', hotspotId: 'water', options: [
        option('purify-water', 'Run purification cycle', 'Recover more water; spend battery power.', { water: 13, energy: -8 }, 'Freshly recycled water is stored, and the purification equipment draws energy.', ['NASA-ECLSS', 'NASA-MARS-ICE']),
        option('maintenance-check', 'Do a maintenance check', 'Improve water recovery with a smaller energy cost.', { water: 8, energy: -5 }, 'A careful inspection restores steady water flow without using full power.', ['NASA-MARS-ICE']),
      ] },
      { id: 'greenhouse-plan', headline: 'Greenhouse Plan', prompt: 'The seedlings need a plan for the coming sol.', sceneStatus: 'restored', hotspotId: 'greenhouse', options: [
        option('grow-food', 'Grow more food', 'Increase food; use water and energy.', { food: 15, water: -11, energy: -9 }, 'The greenhouse begins a strong growth cycle using water and electricity.', ['NASA-ECLSS']),
        option('balanced-growth', 'Choose a balanced schedule', 'Make steady food progress with modest resource use.', { food: 7, water: -5, energy: -4 }, 'The balanced plan grows food while protecting the base reserves.', ['NASA-ECLSS']),
      ] },
    ],
  },
  {
    id: 'power-crisis', order: 2, title: 'Power Crisis', difficulty: 'Intermediate',
    objective: 'Balance life support, stored power and habitat warmth during a dust storm.',
    storyIntro: 'Martian dust is dimming the solar array. Every unit of stored energy matters.',
    initialResources: resources(72, 70, 70, 58, 76, 69), estimatedMinutes: [14, 17],
    events: [
      { id: 'power-priorities', headline: 'Dust Storm Incoming', prompt: 'Solar production has dropped. Which systems receive power first?', sceneStatus: 'dust', hotspotId: 'solar', openingEffects: { energy: -18, temperature: -6 }, options: [
        option('life-support-first', 'Prioritize life support', 'Protect oxygen; reduce greenhouse activity.', { oxygen: 9, energy: -9, food: -5 }, 'Air systems stay supported while the greenhouse runs at reduced power.', ['NASA-DUST', 'NASA-ECLSS']),
        option('balanced-power', 'Use balanced low-power mode', 'Recover some energy; accept slower food and heat systems.', { energy: 11, food: -5, temperature: -5 }, 'The base saves electricity while growing and heating systems work less.', ['NASA-DUST', 'NASA-HEAT']),
      ] },
      { id: 'solar-cleanup', headline: 'Solar Array Plan', prompt: 'Dust has settled across the solar panels.', sceneStatus: 'dust', hotspotId: 'rover', options: [
        option('cleaning-rover', 'Dispatch the cleaning rover', 'Restore power; use some rover water.', { energy: 13, water: -6 }, 'The rover clears the panels and solar collection begins to recover.', ['NASA-DUST']),
        option('emergency-reserve', 'Use emergency batteries', 'Gain energy now; reduce thermal reserve.', { energy: 16, temperature: -6 }, 'Stored battery power helps immediately, while heating stays in conservation mode.', ['NASA-DUST', 'NASA-HEAT']),
      ] },
      { id: 'thermal-regulator', headline: 'Keep the Habitat Cozy', prompt: 'The habitat thermal-control index is falling.', sceneStatus: 'restored', hotspotId: 'habitat', options: [
        option('run-heater', 'Run the heater', 'Restore temperature control; use more energy.', { temperature: 13, energy: -10 }, 'The habitat becomes stable as the heaters draw stored power.', ['NASA-HEAT']),
        option('insulate-habitat', 'Seal unused modules', 'Improve thermal stability and conserve energy.', { temperature: 9, energy: -5 }, 'Closing unused areas helps the occupied habitat retain warmth.', ['NASA-HEAT']),
      ] },
    ],
  },
  {
    id: 'oxygen-emergency', order: 3, title: 'Oxygen Emergency', difficulty: 'Intermediate',
    objective: 'Find a slow leak, protect the air reserve and verify the repair.',
    storyIntro: 'A pressure sensor has spotted a slow leak. Diagnose first, then stabilize the habitat.',
    initialResources: resources(58, 67, 67, 64, 75, 72), estimatedMinutes: [14, 18],
    events: [
      { id: 'leak-response', headline: 'Slow Leak Detected', prompt: 'The sensor confirms air loss near one habitat section.', sceneStatus: 'oxygen_alert', hotspotId: 'habitat', openingEffects: { oxygen: -18 }, options: [
        option('isolate-section', 'Isolate the damaged section', 'Slow the leak; use power and lower thermal stability.', { oxygen: 8, energy: -8, temperature: -6 }, 'Bulkheads isolate the leak while the sealed habitat adjusts.', ['NASA-OXYGEN', 'NASA-ECLSS']),
        option('reserve-oxygen', 'Use reserve oxygen', 'Restore more oxygen now; spend energy.', { oxygen: 19, energy: -5 }, 'Reserve oxygen supports the crew, but the leak still needs a permanent repair.', ['NASA-OXYGEN']),
      ] },
      { id: 'repair-route', headline: 'Choose a Repair Route', prompt: 'PIP found the faulty valve. How should the crew repair it?', sceneStatus: 'oxygen_alert', hotspotId: 'oxygen', options: [
        option('patch-test', 'Patch the leak and test', 'Strong repair; higher energy cost.', { oxygen: 15, energy: -11 }, 'The patch passes its pressure test and prevents more air loss.', ['NASA-ECLSS']),
        option('maintenance-rover', 'Send the maintenance rover', 'Repair remotely; use energy and water.', { oxygen: 12, energy: -7, water: -4 }, 'The rover secures the valve and reports a stable seal.', ['NASA-ECLSS']),
      ] },
      { id: 'verify-seal', headline: 'Verify the Seal', prompt: 'One final systems check will confirm the habitat is stable.', sceneStatus: 'restored', hotspotId: 'habitat', options: [
        option('full-diagnostics', 'Run full diagnostics', 'Confirm air safety; use a little energy.', { oxygen: 5, energy: -4 }, 'Sensors show stable pressure across the repaired section.', ['NASA-OXYGEN', 'NASA-ECLSS']),
        option('monitor-cycle', 'Monitor one full cycle', 'Save energy while carefully observing the repair.', { oxygen: 3, energy: -1 }, 'The pressure remains steady through the monitoring cycle.', ['NASA-ECLSS']),
      ] },
    ],
  },
  {
    id: 'mars-survival-challenge', order: 4, title: 'Mars Survival Challenge', difficulty: 'Advanced',
    objective: 'Manage connected water, power, air, radiation and thermal systems.',
    storyIntro: 'Three alerts arrive together. Think like an engineer and protect the connected systems.',
    initialResources: resources(66, 55, 63, 52, 52, 59), estimatedMinutes: [18, 22],
    events: [
      { id: 'radiation-shelter', headline: 'Combined Systems Alert', prompt: 'A solar radiation alert arrives as power and water systems slow.', sceneStatus: 'radiation_alert', hotspotId: 'habitat', openingEffects: { energy: -10, water: -9, radiationProtection: -12 }, options: [
        option('stronger-shield', 'Activate stronger shielding', 'Raise protection; use significant energy.', { radiationProtection: 22, energy: -14 }, 'Protective systems strengthen while the battery supplies extra power.', ['NASA-RADIATION']),
        option('crew-shelter', 'Move crew to the shelter', 'Improve protection with lower energy use.', { radiationProtection: 15, energy: -6, temperature: -4 }, 'The crew uses the best-protected area while other modules reduce activity.', ['NASA-RADIATION', 'NASA-HEAT']),
      ] },
      { id: 'water-priority', headline: 'Water Recycling Slowdown', prompt: 'The recycler needs power while the crew water reserve falls.', sceneStatus: 'radiation_alert', hotspotId: 'water', options: [
        option('prioritize-recycler', 'Prioritize the recycler', 'Recover more water; use stored energy.', { water: 16, energy: -12 }, 'The recycler restores the water reserve while drawing battery power.', ['NASA-MARS-ICE', 'NASA-ECLSS']),
        option('optimize-water', 'Optimize all water systems', 'Gain steady water; trim energy and food use.', { water: 10, energy: -7, food: -3 }, 'Smaller adjustments across the base improve water recovery.', ['NASA-MARS-ICE']),
      ] },
      { id: 'send-report', headline: 'Contact Earth', prompt: 'The base is ready to send its systems report.', sceneStatus: 'restored', hotspotId: 'communications', options: [
        option('full-report', 'Send the full report now', 'Use more energy; share every system detail.', { energy: -9 }, 'Earth receives the complete report and can support the next plan.', ['NASA-ECLSS', 'NASA-RADIATION']),
        option('compressed-report', 'Compress and send', 'Use less energy while sharing essential data.', { energy: -4 }, 'The compact report reaches Earth with the most important readings.', ['NASA-ECLSS']),
      ] },
    ],
  },
]

export interface GameStore {
  screen: ScreenId
  activeLevelId: LevelId | null
  eventIndex: number
  resources: Resources
  initialResources: Resources
  decisionHistory: DecisionRecord[]
  lastDecision: DecisionRecord | null
  isAwaitingContinue: boolean
  currentReport: MissionReport | null
  // TEMPORARY UI FIXTURE: Malak remains the source-of-truth owner for
  // persistent campaign progression and the final approved store contract.
  completedLevelIds: LevelId[]
  selectLevel: (id: LevelId) => void
  chooseOption: (optionId: string) => void
  continueMission: () => void
  returnToLibrary: () => void
  restartLevel: () => void
}

const emptyResources = resources(0, 0, 0, 0, 0, 0)
let state: GameStore
const listeners = new Set<() => void>()
const emit = (next: Partial<GameStore>) => {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}
const levelById = (id: LevelId | null) => missionLevels.find((level) => level.id === id)
export const isLevelUnlocked = (id: LevelId, completedLevelIds: readonly LevelId[]) => {
  const level = levelById(id)
  if (!level) return false
  if (level.order === 1 || completedLevelIds.includes(id)) return true
  const previousLevel = missionLevels.find((item) => item.order === level.order - 1)
  return previousLevel ? completedLevelIds.includes(previousLevel.id) : false
}
const applyEffects = (base: Resources, ...deltas: ResourceDelta[]): Resources => {
  const keys = Object.keys(base) as ResourceKey[]
  return keys.reduce<Resources>((next, key) => {
    const change = deltas.reduce((sum, delta) => sum + (delta[key] ?? 0), 0)
    next[key] = Math.min(100, Math.max(0, Math.round(base[key] + change)))
    return next
  }, { ...base })
}

const selectLevel = (id: LevelId) => {
  const level = levelById(id)
  if (!level || !isLevelUnlocked(id, state.completedLevelIds)) return
  emit({ screen: 'gameplay', activeLevelId: id, eventIndex: 0, resources: { ...level.initialResources }, initialResources: { ...level.initialResources }, decisionHistory: [], lastDecision: null, isAwaitingContinue: false, currentReport: null })
}

const chooseOption = (optionId: string) => {
  if (state.isAwaitingContinue) return
  const level = levelById(state.activeLevelId)
  const event = level?.events[state.eventIndex]
  const selected = event?.options.find((item) => item.id === optionId)
  if (!event || !selected) return
  const before = { ...state.resources }
  const after = applyEffects(before, event.openingEffects ?? {}, selected.effects)
  const deltaApplied = (Object.keys(after) as ResourceKey[]).reduce<ResourceDelta>((delta, key) => {
    const change = after[key] - before[key]
    if (change !== 0) delta[key] = change
    return delta
  }, {})
  const record: DecisionRecord = { eventId: event.id, eventTitle: event.headline, optionId: selected.id, optionLabel: selected.label, before, after, deltaApplied, consequence: selected.consequence, scienceFactIds: selected.scienceFactIds }
  emit({ resources: after, decisionHistory: [...state.decisionHistory, record], lastDecision: record, isAwaitingContinue: true })
}

const continueMission = () => {
  if (!state.isAwaitingContinue) return
  const level = levelById(state.activeLevelId)
  if (!level) return
  if (state.eventIndex < level.events.length - 1) {
    emit({ eventIndex: state.eventIndex + 1, lastDecision: null, isAwaitingContinue: false })
    return
  }
  const scienceFactIds = [...new Set(state.decisionHistory.flatMap((decision) => decision.scienceFactIds))]
  const status: MissionReport['status'] = Object.values(state.resources).some((value) => value < 30) ? 'stabilized' : 'reviewed'
  const report: MissionReport = {
    levelId: level.id,
    title: level.title,
    started: { ...state.initialResources },
    ended: { ...state.resources },
    decisions: [...state.decisionHistory],
    status,
    scienceFactIds,
    suggestion: 'Try another route and notice how protecting one system can change the resources available to another.',
  }
  const completedLevelIds = status === 'reviewed' && !state.completedLevelIds.includes(level.id)
    ? [...state.completedLevelIds, level.id]
    : state.completedLevelIds
  emit({ screen: 'brief', currentReport: report, isAwaitingContinue: false, completedLevelIds })
}

const returnToLibrary = () => emit({ screen: 'library', activeLevelId: null, lastDecision: null, isAwaitingContinue: false })
const restartLevel = () => { if (state.activeLevelId) selectLevel(state.activeLevelId) }

state = {
  screen: 'home', activeLevelId: null, eventIndex: 0, resources: emptyResources, initialResources: emptyResources,
  decisionHistory: [], lastDecision: null, isAwaitingContinue: false, currentReport: null, completedLevelIds: [],
  selectLevel, chooseOption, continueMission, returnToLibrary, restartLevel,
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
export function useGameStore<T>(selector: (store: GameStore) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}

export const resourceMeta: Record<ResourceKey, { label: string; icon: string; description: string }> = {
  oxygen: { label: 'Oxygen', icon: 'O₂', description: 'Breathable-air reserve' },
  water: { label: 'Water', icon: '💧', description: 'Clean-water reserve' },
  food: { label: 'Food', icon: '🌱', description: 'Crew food supply' },
  energy: { label: 'Energy', icon: '⚡', description: 'Stored electrical energy' },
  radiationProtection: { label: 'Radiation Protection', icon: '🛡️', description: 'Protection-system effectiveness' },
  temperature: { label: 'Temperature Control', icon: '🌡️', description: 'Habitat thermal safety index' },
}
