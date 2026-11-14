/**
 * DRAFT CONTENT — Bonus Mission 05 “Solar Storm Watch”.
 *
 * NOT WIRED INTO THE GAME. The current contract types `MissionLevel.levelNumber` as 1|2|3|4
 * and `title` as a closed union, so this mission is a separate `BonusMissionDefinition`.
 * See src/docs/research/BONUS_MISSION_05_SPEC.md and INTEGRATION_HANDOFF.md.
 *
 * Design rules enforced by src/integrations/nasa/__tests__/bonusMission.test.ts:
 * - Reuses the six existing resources, existing hotspots and existing scene statuses.
 * - Every choice has at least one gain AND one cost (no free choice, no pure punishment).
 * - NASA data appears as evidence cards; it never sets resource values. Resource deltas are
 *   authored game mechanics.
 */
import type { DecisionOption, HotspotId, MissionEvent, ResourceDelta, ResourceKey, Resources, SceneStatus, ScienceFact } from '../../game/types.ts';
import { SIMULATION_DISCLAIMER } from '../../science/scienceFacts.ts';
import { NASA_SOURCES } from '../../integrations/nasa/sourceRegistry.ts';
import { RECOMMENDED_CROP_STUDY } from './osdrPlantStudies.ts';

export const BONUS_MISSION_05_ID = 'bonus-05-solar-storm-watch';

const LABELS: Record<ResourceKey, string> = {
  oxygen: 'Oxygen',
  water: 'Water',
  food: 'Food',
  energy: 'Energy',
  radiationProtection: 'Radiation Protection',
  temperature: 'Temperature Control',
};

/** "+10 Radiation Protection, -6 Water" — generated so previews always match effects. */
export function previewFor(effects: ResourceDelta): string {
  return (Object.entries(effects) as [ResourceKey, number][])
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${LABELS[k]}`)
    .join(', ');
}

type ChoiceDraft = Omit<DecisionOption, 'preview'>;
const choice = (c: ChoiceDraft): DecisionOption => ({ ...c, preview: previewFor(c.effects) });

// ---------------------------------------------------------------------------
// New science facts (to be merged into SCIENCE_FACTS by the integration owner)
// ---------------------------------------------------------------------------

export const BONUS_05_SCIENCE_FACTS: Record<string, ScienceFact> = {
  'NASA-SOLAR-STORM-MARS-2024': {
    id: 'NASA-SOLAR-STORM-MARS-2024',
    title: 'A Real Solar Storm at Mars (May 2024)',
    summary:
      'In May 2024 a huge solar eruption sent energetic particles to Mars. NASA’s Curiosity rover measured the biggest radiation surge its RAD instrument had recorded, and NASA said an astronaut standing nearby would have received a dose like 30 chest X-rays.',
    sourceLabel: 'NASA/JPL news release 2024-080 (10 June 2024)',
    url: NASA_SOURCES['jpl-release-2024-080'].documentationUrl,
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-STORM-SHELTER-WATER': {
    id: 'NASA-STORM-SHELTER-WATER',
    title: 'Water Walls for Storm Shelters',
    summary:
      'NASA has suggested storing a crew’s water around a shelter area to create a radiation storm shelter. The crew can use that water later and replace it with recycled water. Getting back indoors quickly also matters.',
    sourceLabel: 'NASA — Real Martians: How to Protect Astronauts from Space Radiation on Mars',
    url: NASA_SOURCES['nasa-real-martians-2015'].documentationUrl,
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-MARS-SIGNAL-DELAY': {
    id: 'NASA-MARS-SIGNAL-DELAY',
    title: 'Talking to Earth Takes Minutes',
    summary:
      'A one-way radio signal between Earth and Mars takes anywhere from 4 to 20 minutes, so a Mars crew must be ready to make urgent decisions on its own.',
    sourceLabel: 'NASA/JPL — How an Atomic Clock Will Get Humans to Mars on Time (2019)',
    url: NASA_SOURCES['jpl-atomic-clock-2019'].documentationUrl,
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-SPACE-WEATHER-DONKI': {
    id: 'NASA-SPACE-WEATHER-DONKI',
    title: 'Watching the Sun’s Weather',
    summary:
      'NASA’s DONKI database records solar flares, coronal mass ejections (CMEs) and energetic-particle events, and computer models estimate where solar clouds will travel. DONKI is research information; official space-weather forecasts come from NOAA’s Space Weather Prediction Center.',
    sourceLabel: 'NASA CCMC DONKI',
    url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-ISS-CABIN-CO2': {
    id: 'NASA-ISS-CABIN-CO2',
    title: 'Cleaning Cabin Air',
    summary:
      'Sensors on the International Space Station show that cabin air usually holds a few thousand parts per million of carbon dioxide. Life-support machines must keep removing it, and that takes power.',
    sourceLabel: 'NASA OSDR Environmental Data App (ISS telemetry)',
    url: NASA_SOURCES.eda.documentationUrl,
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
  'NASA-VEGGIE-LIGHT': {
    id: 'NASA-VEGGIE-LIGHT',
    title: 'Light for Space Gardens (VEG-04)',
    summary: `On the Space Station, astronauts grew a leafy green called mizuna in NASA’s Veggie garden and tested different light colors (NASA OSDR study ${RECOMMENDED_CROP_STUDY.accession}). Grow lights help crops grow but use electricity.`,
    sourceLabel: `NASA OSDR ${RECOMMENDED_CROP_STUDY.accession} (${RECOMMENDED_CROP_STUDY.projectIdentifier ?? 'VEG-04'})`,
    url: RECOMMENDED_CROP_STUDY.repositoryUrl,
    simulationDisclaimer: SIMULATION_DISCLAIMER,
  },
};

/** Existing fact IDs this mission reuses (must exist in src/science/scienceFacts.ts). */
export const BONUS_05_REUSED_FACT_IDS = ['NASA-RADIATION', 'NASA-ECLSS'] as const;

// ---------------------------------------------------------------------------
// Mission definition
// ---------------------------------------------------------------------------

export interface BonusMissionDefinition {
  id: typeof BONUS_MISSION_05_ID;
  bonusNumber: 5;
  title: 'Solar Storm Watch';
  difficulty: 'Bonus';
  /** Optional mission: never required to unlock or complete Levels 1–4. */
  isOptional: true;
  /** Recommended unlock: after Level 4 is reviewed, or always available from the Mission Library. */
  unlockHint: string;
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
  /** Evidence card IDs (from SOLAR_STORM_REPLAY_2024.evidence) to show per event. */
  eventEvidence: Record<string, string[]>;
  briefTryNextTime: string;
  briefScienceFactIds: string[];
  /** Hotspots this mission uses — all already exist in the Mars scene. */
  hotspotsUsed: HotspotId[];
  scoring: { label: string; disclaimer: string };
}

export const BONUS_MISSION_05: BonusMissionDefinition = {
  id: BONUS_MISSION_05_ID,
  bonusNumber: 5,
  title: 'Solar Storm Watch',
  difficulty: 'Bonus',
  isOptional: true,
  unlockHint: 'Offer after Level 4 is reviewed (or always, from the Mission Library). Never block Levels 1–4.',
  estimatedMinutes: '8–12 min',
  tagline: 'Replay a real solar storm that hit Mars in May 2024 — and protect your crew.',
  story:
    'On 20 May 2024, a giant eruption blasted off the side of the Sun that we cannot see from Earth. NASA’s Curiosity rover on Mars measured a big jump in radiation. Now it is your turn: a storm like that one is heading for Aster Base. Get the crew safe, keep the base running, and decide when it is safe to go outside again.',
  pipOpening:
    'Cadet, this mission replays a REAL solar storm from May 2024! The Sun can send super-fast particles to Mars in less than an hour. Let’s get everyone safe — and keep the lights on.',
  pipClosing:
    'You weathered a real-world solar storm! Real Mars crews will need fast warnings, a shelter close by, and smart choices about power, air and water — just like you made today.',
  learningObjectives: [
    'Explain that the Sun can send radiation storms to Mars and that energetic particles can arrive in less than an hour.',
    'Choose shelter strategies (getting indoors fast, water walls) and describe what each one costs.',
    'Balance power, air and food while a crew shelters for about a day and a half.',
    'Tell the difference between a measurement, a computer-model prediction and a NASA statement.',
  ],
  initialResources: { oxygen: 76, water: 74, food: 70, energy: 72, radiationProtection: 64, temperature: 74 },
  initialSceneStatus: 'normal',
  activeHighlightResources: ['radiationProtection', 'energy', 'water', 'oxygen'],
  hotspotsUsed: ['communications', 'rover', 'habitat', 'greenhouse', 'oxygen', 'solar'],
  events: [
    {
      id: 'b5-e1-space-weather-alert',
      title: 'Space Weather Alert',
      prompt:
        'Mission Control relays a NASA space-weather note: a very fast eruption just left the side of the Sun we cannot see from Earth, and Mars may be in the path of its particles. Two astronauts are out on the rover hauling ice. What do you do first?',
      pipIntro: 'Energetic particles can reach Mars in less than an hour. Every minute counts!',
      sceneStatus: 'normal',
      highlightModule: 'communications',
      diagnosticHint: 'Shelter is only useful if the crew can reach it before the particles do.',
      choices: [
        choice({
          id: 'b5-e1-c1',
          label: 'Call the rover crew back now',
          effects: { radiationProtection: 10, water: -6 },
          consequence: 'The crew is inside before the radiation climbs. You left a load of ice behind, so the water tank is a little lower.',
          pipNote: 'In May 2024, radiation at Mars rose in less than an hour. Getting indoors fast is a real NASA safety idea!',
          scienceFactIds: ['NASA-SOLAR-STORM-MARS-2024', 'NASA-STORM-SHELTER-WATER'],
          isOptimalHint: true,
        }),
        choice({
          id: 'b5-e1-c2',
          label: 'Finish hauling the ice first',
          effects: { water: 6, radiationProtection: -14 },
          consequence: 'The water tank is fuller, but the crew was still outside when the radiation rose.',
          pipNote: 'Extra water is useful — but outside the habitat there is nothing between the crew and the particles.',
          scienceFactIds: ['NASA-RADIATION'],
        }),
        choice({
          id: 'b5-e1-c3',
          label: 'Wait for Earth to send a clearer forecast',
          effects: { water: 3, energy: -4, radiationProtection: -8 },
          consequence:
            'The crew hauled a little more ice while you waited, but each message took minutes to cross space — and they were still outside when the storm arrived.',
          pipNote: 'A radio message between Earth and Mars takes 4 to 20 minutes one way. Mars crews must act on their own!',
          scienceFactIds: ['NASA-MARS-SIGNAL-DELAY', 'NASA-SPACE-WEATHER-DONKI'],
        }),
      ],
    },
    {
      id: 'b5-e2-build-shelter',
      title: 'Build the Storm Shelter',
      prompt:
        'The base radiation sensor is climbing (-8 Radiation Protection)! Choose how to shield the crew’s shelter room inside the habitat.',
      pipIntro: 'NASA has suggested using the crew’s own water as a wall around a shelter room.',
      sceneStatus: 'radiation_alert',
      openingEffects: { radiationProtection: -8 },
      highlightModule: 'habitat',
      diagnosticHint: 'More shielding material between the crew and the particles means more protection — but it costs water and pumping power.',
      choices: [
        choice({
          id: 'b5-e2-c1',
          label: 'Fill the shelter walls with water',
          effects: { radiationProtection: 16, water: -8, energy: -4 },
          consequence: 'A thick water wall surrounds the bunks. Pumping took power, and that water is busy being a wall — you can recycle it later.',
          pipNote: 'Water does double duty: shielding now, drinking and washing later after recycling.',
          scienceFactIds: ['NASA-STORM-SHELTER-WATER', 'NASA-RADIATION'],
          isOptimalHint: true,
        }),
        choice({
          id: 'b5-e2-c2',
          label: 'Fill the walls halfway to save water',
          effects: { radiationProtection: 8, water: -4, energy: -2 },
          consequence: 'Half a wall saves water and power, but blocks fewer particles.',
          pipNote: 'Less shielding material means less protection. That’s the trade-off!',
          scienceFactIds: ['NASA-STORM-SHELTER-WATER'],
        }),
        choice({
          id: 'b5-e2-c3',
          label: 'Keep fixing the battery instead',
          effects: { energy: 6, radiationProtection: -10 },
          consequence: 'The battery repair is done, but the crew worked in normal rooms without extra shielding during the storm.',
          pipNote: 'Repairs can wait a day; radiation exposure cannot be undone.',
          scienceFactIds: ['NASA-RADIATION'],
        }),
      ],
    },
    {
      id: 'b5-e3-power-while-sheltering',
      title: 'Power While You Hide',
      prompt:
        'The crew must stay sheltered for about a day and a half — that is how long radiation took to calm down at Mars in May 2024. Shelter fans and lights draw power (-6 Energy), and nobody can go out to clean the solar panels. What about the greenhouse?',
      pipIntro: 'Grow lights help plants make food and oxygen, but they use a lot of electricity.',
      sceneStatus: 'radiation_alert',
      openingEffects: { energy: -6 },
      highlightModule: 'greenhouse',
      choices: [
        choice({
          id: 'b5-e3-c1',
          label: 'Dim the grow lights',
          effects: { energy: 8, food: -4, oxygen: -3 },
          consequence: 'Power saved! The plants grow a little slower and make a little less oxygen for now.',
          pipNote: 'Astronauts on the Space Station test how light changes plant growth — light really matters to crops.',
          scienceFactIds: ['NASA-VEGGIE-LIGHT'],
          isOptimalHint: true,
        }),
        choice({
          id: 'b5-e3-c2',
          label: 'Keep the greenhouse fully lit',
          effects: { food: 3, oxygen: 2, energy: -10 },
          consequence: 'The plants are happy, but the battery drops — and the panels stay dusty until the storm ends.',
          scienceFactIds: ['NASA-VEGGIE-LIGHT'],
        }),
        choice({
          id: 'b5-e3-c3',
          label: 'Switch the greenhouse off completely',
          effects: { energy: 12, food: -9, oxygen: -6, temperature: -3 },
          consequence: 'Lots of power saved, but the plants start to suffer and the greenhouse gets chilly.',
          scienceFactIds: ['NASA-VEGGIE-LIGHT'],
        }),
      ],
    },
    {
      id: 'b5-e4-shelter-air',
      title: 'Stuffy Shelter Air',
      prompt:
        'Four astronauts in one small room breathe out a lot of carbon dioxide (-6 Oxygen). On the Space Station, sensors show the cabin air usually holds a few thousand ppm of CO₂ — and a crowded shelter fills up faster.',
      pipIntro: 'Life-support machines clean the air, but they need power to do it.',
      sceneStatus: 'oxygen_alert',
      openingEffects: { oxygen: -6 },
      highlightModule: 'oxygen',
      choices: [
        choice({
          id: 'b5-e4-c1',
          label: 'Run the CO₂ scrubber at full speed',
          effects: { oxygen: 10, energy: -8 },
          consequence: 'The air clears quickly. The scrubber is hungry for power, so watch your Energy bar.',
          scienceFactIds: ['NASA-ISS-CABIN-CO2', 'NASA-ECLSS'],
          isOptimalHint: true,
        }),
        choice({
          id: 'b5-e4-c2',
          label: 'Take turns breathing in the main module',
          effects: { oxygen: 6, radiationProtection: -8 },
          consequence: 'Fresher air — but the main module has no water wall, so each break adds radiation exposure.',
          scienceFactIds: ['NASA-ECLSS', 'NASA-RADIATION'],
        }),
        choice({
          id: 'b5-e4-c3',
          label: 'Rest quietly and turn the heaters down',
          effects: { oxygen: 4, energy: 4, temperature: -6 },
          consequence: 'Resting crew members breathe more gently and the lower heaters save power — but the habitat gets cold.',
          scienceFactIds: ['NASA-ECLSS'],
        }),
      ],
    },
    {
      id: 'b5-e5-all-clear',
      title: 'Is It Safe Yet?',
      prompt:
        'The radiation alarm goes quiet. In May 2024 it took about a day and a half for levels at Mars to fall back to normal. The solar panels need cleaning and the rover is still parked outside.',
      pipIntro: 'An alarm going quiet is not the same as levels being back to normal. What does your sensor say?',
      sceneStatus: 'restored',
      highlightModule: 'solar',
      choices: [
        choice({
          id: 'b5-e5-c1',
          label: 'Check the radiation sensor, then go out',
          effects: { radiationProtection: 6, energy: 6, food: -3 },
          consequence: 'The sensor shows normal levels. Waiting a little longer used some rations, but the crew is safe and the panels get cleaned.',
          pipNote: 'Real missions use measurements — not guesses — to decide when to go back outside.',
          scienceFactIds: ['NASA-SOLAR-STORM-MARS-2024', 'NASA-SPACE-WEATHER-DONKI'],
          isOptimalHint: true,
        }),
        choice({
          id: 'b5-e5-c2',
          label: 'Go out as soon as the alarm stops',
          effects: { energy: 10, radiationProtection: -10 },
          consequence: 'The panels are cleaned fast, but radiation was still above normal — extra exposure for the crew.',
          scienceFactIds: ['NASA-RADIATION'],
        }),
        choice({
          id: 'b5-e5-c3',
          label: 'Stay inside one more full day to be extra sure',
          effects: { radiationProtection: 8, energy: -8, food: -5 },
          consequence: 'Very safe, but the panels stayed dusty and rations ran down.',
          scienceFactIds: ['NASA-RADIATION'],
        }),
      ],
    },
  ],
  eventEvidence: {
    'b5-e1-space-weather-alert': ['donki-far-side-cme', 'donki-model-did-not-list-mars', 'jpl-signal-delay'],
    'b5-e2-build-shelter': ['radlab-mars-spike', 'real-martians-water-shelter', 'jpl-8100-microgray'],
    'b5-e3-power-while-sheltering': ['radlab-mars-spike', 'osdr-veg04-light'],
    'b5-e4-shelter-air': ['eda-iss-cabin-co2'],
    'b5-e5-all-clear': ['radlab-mars-spike'],
  },
  briefTryNextTime:
    'Get the rover crew inside first, build the thickest water wall you can afford, and use your radiation sensor — not the alarm — to decide when to go back outside.',
  briefScienceFactIds: ['NASA-SOLAR-STORM-MARS-2024', 'NASA-STORM-SHELTER-WATER', 'NASA-SPACE-WEATHER-DONKI'],
  scoring: {
    label: 'Storm Readiness (game score)',
    disclaimer:
      'Storm Readiness is an in-game practice score. It is not an official NASA Space Apps Challenge score, judging criterion or award.',
  },
};
