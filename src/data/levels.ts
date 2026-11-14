import type { MissionLevel } from '../game/types';

export const MISSION_LEVELS: MissionLevel[] = [
  // =========================================================================
  // LEVEL 1 — FIRST DAY ON MARS (Beginner)
  // =========================================================================
  {
    id: 'level-1-first-day',
    levelNumber: 1,
    title: 'First Day on Mars',
    difficulty: 'Beginner',
    estimatedMinutes: '12–15 min design target (~4–7 min core path)',
    tagline: 'Inspect Aster Base life support and balance your four core resources before nightfall.',
    story:
      'Cadet Nova arrives at Aster Base in a safe Martian exploration zone. Before the first cold Martian night arrives, PIP guides you through checking the central habitat dome, oxygen system, water recycler, and greenhouse.',
    pipOpening:
      'Welcome to Aster Base, Cadet! Mars is amazing, but our crew needs careful planning. Oxygen, water, food and power all work together. Ready for your first shift?',
    pipClosing:
      'Great first shift, Cadet! You saw how air, water, food, and electrical energy support one another inside a sealed Martian habitat.',
    learningObjectives: [
      'Identify the four core survival resources: Oxygen, Water, Food, and Energy.',
      'Understand why a sealed habitat is essential because Mars’ outside atmosphere cannot be breathed.',
      'Recognize that producing clean air, purified water, and greenhouse crops consumes energy and water.',
    ],
    initialResources: {
      oxygen: 78,
      water: 76,
      food: 70,
      energy: 72,
      radiationProtection: 80,
      temperature: 78,
    },
    initialSceneStatus: 'normal',
    activeHighlightResources: ['oxygen', 'water', 'food', 'energy'],
    briefTryNextTime:
      'Compare the balanced schedule options with the reserve options to see how steady conservation preserves electrical energy.',
    briefScienceFactIds: ['NASA-OXYGEN', 'NASA-ECLSS', 'NASA-PLANTS'],
    events: [
      {
        id: 'l1-e1-air-system',
        title: 'Air System Setup',
        prompt:
          'Central habitat check complete! Next, our Oxygen Subsystem needs calibration before the crew begins indoor lab tasks. How should we configure the air loop?',
        pipIntro:
          'A habitat on Mars must provide breathable air because the outside atmosphere is 95% carbon dioxide. Let’s check our oxygen options!',
        sceneStatus: 'normal',
        highlightModule: 'oxygen',
        diagnosticHint:
          'Running the active oxygen generator increases oxygen the most, but uses electrical energy and a little water.',
        choices: [
          {
            id: 'l1-e1-c1',
            label: 'Run oxygen system',
            preview: '+14 Oxygen, -10 Energy, -5 Water',
            effects: { oxygen: 14, energy: -10, water: -5 },
            consequence:
              'The oxygen generator cycles smoothly, boosting breathable air across the central dome while drawing power and water.',
            pipNote:
              'Nice! Producing fresh oxygen uses electrical power and water—showing how life-support systems connect.',
            scienceFactIds: ['NASA-OXYGEN'],
            isOptimalHint: true,
          },
          {
            id: 'l1-e1-c2',
            label: 'Use oxygen reserves',
            preview: '+12 Oxygen, -2 Energy',
            effects: { oxygen: 12, energy: -2 },
            consequence:
              'High-pressure reserve tanks top up cabin air quickly with almost no electrical draw, though stored reserves are finite.',
            pipNote:
              'Reserve tanks are fast and save power today, though long missions still need active oxygen generation.',
            scienceFactIds: ['NASA-OXYGEN'],
          },
          {
            id: 'l1-e1-c3',
            label: 'Inspect filters first',
            preview: '+5 Oxygen, -3 Energy (Diagnostic Hint)',
            effects: { oxygen: 5, energy: -3 },
            consequence:
              'Diagnostic check clears fine Martian dust from the intake valve, safely lifting oxygen with minimal energy use.',
            pipNote:
              'Smart inspection! Clean filters reduce fan strain and keep airflow steady.',
            scienceFactIds: ['NASA-ECLSS'],
          },
        ],
      },
      {
        id: 'l1-e2-water-recycler',
        title: 'Water Recycler Calibration',
        prompt:
          'Every drop of water on Mars is precious. The ECLSS Water Recycler is ready for its first Sol processing cycle.',
        pipIntro:
          'In space habitats, we clean and reuse water over and over instead of waiting for rockets from Earth!',
        sceneStatus: 'normal',
        highlightModule: 'water',
        diagnosticHint:
          'Full purification maximizes water supply using electrical energy, while conservation trades food prep water.',
        choices: [
          {
            id: 'l1-e2-c1',
            label: 'Run purification cycle',
            preview: '+13 Water, -8 Energy',
            effects: { water: 13, energy: -8 },
            consequence:
              'The distillation and filtration loop turns humidity and greywater into crystal-clear drinking water.',
            pipNote:
              'Recycling water keeps the crew hydrated and ready for greenhouse irrigation!',
            scienceFactIds: ['NASA-ECLSS'],
            isOptimalHint: true,
          },
          {
            id: 'l1-e2-c2',
            label: 'Conserve water',
            preview: '+7 Water, -4 Food',
            effects: { water: 7, food: -4 },
            consequence:
              'Water usage is trimmed across washing and meal rehydration, saving electricity while dipping slightly into dry food packs.',
            pipNote:
              'Good trade-off awareness—saving electricity costs a little extra packaged food.',
            scienceFactIds: ['NASA-ECLSS'],
          },
          {
            id: 'l1-e2-c3',
            label: 'Do a maintenance check',
            preview: '+8 Water, -5 Energy',
            effects: { water: 8, energy: -5 },
            consequence:
              'Inspecting the sensor seals prevents future drips and steadily restores purified water reserves.',
            pipNote:
              'Preventive maintenance keeps closed-loop recyclers running reliably!',
            scienceFactIds: ['NASA-ECLSS'],
          },
        ],
      },
      {
        id: 'l1-e3-greenhouse-plan',
        title: 'Greenhouse Plan',
        prompt:
          'Our bio-dome is ready for planting! How should we schedule the LED grow lights and irrigation pumps before sunset?',
        pipIntro:
          'Plants give the crew fresh food and help refresh cabin air, but grow lights and pumps need water and electricity.',
        sceneStatus: 'restored',
        highlightModule: 'greenhouse',
        diagnosticHint:
          'A balanced schedule grows steady food without draining too much water or energy before Martian nightfall.',
        choices: [
          {
            id: 'l1-e3-c1',
            label: 'Grow more food',
            preview: '+15 Food, -11 Water, -9 Energy',
            effects: { food: 15, water: -11, energy: -9 },
            consequence:
              'Bright LED grow arrays accelerate leafy greens and dwarf potatoes, building a big food surplus at a noticeable water and power cost.',
            pipNote:
              'Look at those crops thrive! Just remember that high-output farming uses both water and electricity.',
            scienceFactIds: ['NASA-PLANTS'],
          },
          {
            id: 'l1-e3-c2',
            label: 'Use existing rations',
            preview: '-8 Food, +4 Energy',
            effects: { food: -8, energy: 4 },
            consequence:
              'Keeping greenhouse lights dimmed saves battery power for overnight, while the crew eats stored mission rations.',
            pipNote:
              'Stored rations save energy now, though planting crops helps sustain longer missions.',
            scienceFactIds: ['NASA-PLANTS'],
          },
          {
            id: 'l1-e3-c3',
            label: 'Balanced schedule',
            preview: '+7 Food, -5 Water, -4 Energy',
            effects: { food: 7, water: -5, energy: -4 },
            consequence:
              'Timed LED pulses and drip irrigation grow steady food reserves while keeping water and energy comfortably high.',
            pipNote:
              'Awesome engineering balance! All four core systems are in great shape for nightfall.',
            scienceFactIds: ['NASA-PLANTS'],
            isOptimalHint: true,
          },
        ],
      },
    ],
  },

  // =========================================================================
  // LEVEL 2 — POWER CRISIS (Intermediate)
  // =========================================================================
  {
    id: 'level-2-power-crisis',
    levelNumber: 2,
    title: 'Power Crisis',
    difficulty: 'Intermediate',
    estimatedMinutes: '14–17 min design target (~5–7 min core path)',
    tagline: 'Manage a Martian dust storm and balance power priorities across connected systems.',
    story:
      'A Martian dust storm sweeps across the horizon, dimming sunlight at the solar array. Stored energy drops, and both the greenhouse and habitat temperature regulator demand electricity.',
    pipOpening:
      'Heads up, Cadet! A Martian dust storm is reducing sunlight on our solar panels. Let’s decide how to share our stored energy wisely!',
    pipClosing:
      'Well handled! You saw how a single power shortage affects oxygen, food, and temperature control—and how smart prioritization keeps the crew comfortable.',
    learningObjectives: [
      'Understand how Martian dust storms reduce solar panel electricity generation.',
      'Experience how limited stored power forces trade-offs between life support, greenhouse crops, and heating.',
      'Distinguish between restoring solar generation (cleaning panels) and using stored backup power.',
    ],
    initialResources: {
      oxygen: 72,
      water: 70,
      food: 70,
      energy: 58,
      radiationProtection: 76,
      temperature: 69,
    },
    initialSceneStatus: 'dust',
    activeHighlightResources: ['energy', 'oxygen', 'food', 'temperature'],
    briefTryNextTime:
      'Compare dispatching the cleaning rover with using emergency reserves to see how restoring solar generation protects long-term stability.',
    briefScienceFactIds: ['NASA-DUST', 'NASA-THERMAL'],
    events: [
      {
        id: 'l2-e1-power-priorities',
        title: 'Dust Warning & Power Priorities',
        prompt:
          'Orange dust clouds cut solar generation! An incoming dust squall reduces stored energy (-18) and cools the exterior (-6 Temperature Control). Which systems get priority wattage?',
        pipIntro:
          'Solar power just dropped! When electricity is scarce, every watt you send to one module means less for another.',
        sceneStatus: 'dust',
        openingEffects: { energy: -18, temperature: -6 },
        highlightModule: 'solar',
        diagnosticHint:
          'There is no single magic button—each choice protects a different part of Aster Base.',
        choices: [
          {
            id: 'l2-e1-c1',
            label: 'Prioritize life support',
            preview: '+9 Oxygen, -9 Energy, -5 Food',
            effects: { oxygen: 9, energy: -9, food: -5 },
            consequence:
              'Air scrubbers and oxygen generators stay at full strength while greenhouse grow lights dim temporarily.',
            pipNote:
              'Protecting breathable air first keeps the crew safe while crops pause growth.',
            scienceFactIds: ['NASA-DUST'],
            isOptimalHint: true,
          },
          {
            id: 'l2-e1-c2',
            label: 'Keep greenhouse at full power',
            preview: '+10 Food, -15 Energy',
            effects: { food: 10, energy: -15 },
            consequence:
              'Greenhouse LEDs stay bright and boost food supply, though heavy wattage pulls batteries down into caution territory.',
            pipNote:
              'Crops look great, but watch our Energy bar closely on the next step!',
            scienceFactIds: ['NASA-DUST', 'NASA-PLANTS'],
          },
          {
            id: 'l2-e1-c3',
            label: 'Balanced reduced-power mode',
            preview: '-5 Food, +11 Energy, -5 Temperature Control',
            effects: { food: -5, energy: 11, temperature: -5 },
            consequence:
              'Dimming non-critical lights and lowering heater draw recharges battery reserves, though the habitat feels slightly cooler.',
            pipNote:
              'Conserving watts rebuilt our battery buffer—now we can address solar dust and heating!',
            scienceFactIds: ['NASA-DUST'],
          },
        ],
      },
      {
        id: 'l2-e2-solar-cleanup',
        title: 'Solar Array Dust Cleanup',
        prompt:
          'The storm winds are easing, leaving a dusty film across the solar panels. How should we recover our power supply?',
        pipIntro:
          'Remember: stored battery energy is different from ongoing solar generation. Cleaning the panels helps future power flow!',
        sceneStatus: 'dust',
        highlightModule: 'solar',
        diagnosticHint:
          'Cleaning the panels restores solar generation directly, while emergency reserves give an immediate battery boost.',
        choices: [
          {
            id: 'l2-e2-c1',
            label: 'Dispatch small cleaning rover',
            preview: '+13 Energy, -6 Water',
            effects: { energy: 13, water: -6 },
            consequence:
              'The automated rover brushes and mists dust off the photovoltaic glass, restoring strong solar generation!',
            pipNote:
              'Great call! Restoring clean solar panels fixes the root cause of the power drop.',
            scienceFactIds: ['NASA-DUST'],
            isOptimalHint: true,
          },
          {
            id: 'l2-e2-c2',
            label: 'Wait and conserve',
            preview: '+9 Energy, -7 Food',
            effects: { energy: 9, water: 0, food: -7 },
            consequence:
              'Light breezes gradually clear part of the dust while the crew relies on cold rations to save kitchen power.',
            pipNote:
              'Martian air is very thin, so wind clears dust slowly—conserving power helped bridge the gap.',
            scienceFactIds: ['NASA-DUST'],
          },
          {
            id: 'l2-e2-c3',
            label: 'Use emergency reserve',
            preview: '+16 Energy, -6 Temperature Control',
            effects: { energy: 16, temperature: -6 },
            consequence:
              'Backup battery cells flood the grid with immediate power, though rerouting thermal bus loops cools the habitat slightly.',
            pipNote:
              'Emergency reserves gave a big energy boost, and now let’s stabilize Temperature Control!',
            scienceFactIds: ['NASA-DUST'],
          },
        ],
      },
      {
        id: 'l2-e3-thermal-regulator',
        title: 'Thermal Regulator Balancing',
        prompt:
          'After the dust storm and power shifts, Temperature Control needs stabilization before the cold Martian evening.',
        pipIntro:
          'Temperature Control measures how steady and safe our indoor thermal environment is—100 means rock-solid stability!',
        sceneStatus: 'restored',
        highlightModule: 'habitat',
        diagnosticHint:
          'Insulating the habitat improves thermal safety while using less electricity than running full heaters.',
        choices: [
          {
            id: 'l2-e3-c1',
            label: 'Run heater',
            preview: '+13 Temperature Control, -10 Energy',
            effects: { temperature: 13, energy: -10 },
            consequence:
              'Active electric heaters quickly warm the habitat interior back into the healthy zone.',
            pipNote:
              'Cozy and stable! Active heaters work fast whenever you have enough Energy to spare.',
            scienceFactIds: ['NASA-THERMAL'],
          },
          {
            id: 'l2-e3-c2',
            label: 'Insulate habitat',
            preview: '+9 Temperature Control, -5 Energy',
            effects: { temperature: 9, energy: -5 },
            consequence:
              'Deploying multi-layer thermal shutters traps indoor warmth efficiently with half the power cost.',
            pipNote:
              'Smart engineering! Good insulation keeps warmth in without draining our batteries.',
            scienceFactIds: ['NASA-THERMAL'],
            isOptimalHint: true,
          },
          {
            id: 'l2-e3-c3',
            label: 'Reduce unused modules',
            preview: '+6 Temperature Control, +7 Energy, -4 Food',
            effects: { temperature: 6, energy: 7, food: -4 },
            consequence:
              'Sealing off storage bays concentrates heat in living quarters and saves energy, pausing snack prep in the galley.',
            pipNote:
              'Heating a smaller volume saves both thermal energy and electricity!',
            scienceFactIds: ['NASA-THERMAL'],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // LEVEL 3 — OXYGEN EMERGENCY (Intermediate–Advanced)
  // =========================================================================
  {
    id: 'level-3-oxygen-emergency',
    levelNumber: 3,
    title: 'Oxygen Emergency',
    difficulty: 'Intermediate–Advanced',
    estimatedMinutes: '14–18 min design target (~5–8 min core path)',
    tagline: 'Diagnose a slow habitat air leak, stabilize oxygen, and seal the valve safely.',
    story:
      'A pressure sensor at Aster Base detects a slow air leak! PIP asks you to inspect the pressure diagnostics, stabilize oxygen levels without exhausting energy, and complete a permanent valve repair.',
    pipOpening:
      'Pressure alert at the airlock manifold, Cadet! Stay calm—our sensors caught a slow air leak early. Let’s diagnose it and protect the crew’s air!',
    pipClosing:
      'Pressure indicator is back to Stable! Remember today’s golden rule: reserve tanks buy time, while isolating and repairing the leak solves the problem.',
    learningObjectives: [
      'Recognize how a habitat air leak affects cabin oxygen stability.',
      'Understand why reserve oxygen or conservation alone cannot permanently seal a leak.',
      'Coordinate diagnostics, isolation, and repair while protecting energy and water reserves.',
    ],
    initialResources: {
      oxygen: 58,
      water: 67,
      food: 67,
      energy: 64,
      radiationProtection: 75,
      temperature: 72,
    },
    initialSceneStatus: 'oxygen_alert',
    activeHighlightResources: ['oxygen', 'energy', 'temperature'],
    briefTryNextTime:
      'Notice how isolating the damaged section and patching the leak prevents ongoing loss, whereas reserve tanks only refill supply temporarily.',
    briefScienceFactIds: ['NASA-ECLSS', 'NASA-OXYGEN'],
    events: [
      {
        id: 'l3-e1-leak-diagnostics',
        title: 'Leak Detected & Valve Diagnostics',
        prompt:
          'A slow air leak drops Oxygen (-18) and triggers a cyan/amber pressure marker on the airlock valve. How do you run your first diagnostic check?',
        pipIntro:
          'Before turning wrenches, good engineers check sensor clues so we fix the exact right seal!',
        sceneStatus: 'oxygen_alert',
        openingEffects: { oxygen: -18 },
        highlightModule: 'oxygen',
        diagnosticHint:
          'Ultrasonic leak scanning pinpoints the exact seal using minimal power.',
        choices: [
          {
            id: 'l3-e1-c1',
            label: 'Run ultrasonic valve scan',
            preview: '+4 Oxygen, -3 Energy (Pinpoints Seal B-2)',
            effects: { oxygen: 4, energy: -3 },
            consequence:
              'Acoustic sensors locate a tiny hairline seal gap in Manifold B-2 and engage automatic micro-baffles.',
            pipNote:
              'Target found! Manifold B-2 is isolated on our diagnostic screen—now let’s stabilize pressure.',
            scienceFactIds: ['NASA-ECLSS'],
            isOptimalHint: true,
          },
          {
            id: 'l3-e1-c2',
            label: 'Check pressure logs across all domes',
            preview: '+2 Oxygen, -2 Energy',
            effects: { oxygen: 2, energy: -2 },
            consequence:
              'Comparing pressure trends confirms the main living dome is airtight and narrows the leak to the airlock valve.',
            pipNote:
              'Good detective work! Confirming the main dome is safe lets us focus on the valve.',
            scienceFactIds: ['NASA-ECLSS'],
          },
          {
            id: 'l3-e1-c3',
            label: 'Boost air circulation fans to test flow',
            preview: '-3 Oxygen, -5 Energy',
            effects: { oxygen: -3, energy: -5 },
            consequence:
              'Higher fan pressure temporarily pushes a little extra air toward the unsealed valve before sensors pinpoint it.',
            pipNote:
              'We found the leak, though higher fan pressure let a bit more air escape first. Let’s contain it now!',
            scienceFactIds: ['NASA-ECLSS'],
          },
        ],
      },
      {
        id: 'l3-e2-immediate-response',
        title: 'Immediate Leak Containment Response',
        prompt:
          'Now that we know where the slow leak is, how should we stabilize oxygen right away? (Important: reserves refill air, but do not fix a leak!)',
        pipIntro:
          'Careful, Cadet: reserve oxygen and conservation help keep levels up, but conservation alone cannot permanently seal a leak!',
        sceneStatus: 'oxygen_alert',
        highlightModule: 'oxygen',
        diagnosticHint:
          'Isolating the damaged section stops air from escaping while you prepare the repair.',
        choices: [
          {
            id: 'l3-e2-c1',
            label: 'Isolate damaged section',
            preview: '+8 Oxygen, -8 Energy, -6 Temperature Control',
            effects: { oxygen: 8, energy: -8, temperature: -6 },
            consequence:
              'Closing the bulkhead isolation valve stops further air loss immediately, while unheated airlock space cools slightly.',
            pipNote:
              'Great containment! Closing the isolation valve stopped the leak from draining more oxygen.',
            scienceFactIds: ['NASA-ECLSS'],
            isOptimalHint: true,
          },
          {
            id: 'l3-e2-c2',
            label: 'Use reserve oxygen',
            preview: '+19 Oxygen, -5 Energy',
            effects: { oxygen: 19, energy: -5 },
            consequence:
              'Reserve tanks boost cabin oxygen right back up—remember, reserves replenish supply, so we still must repair the leak next!',
            pipNote:
              'Oxygen looks much healthier now! Just remember: reserves do not fix a leak, so let’s repair the valve next.',
            scienceFactIds: ['NASA-OXYGEN'],
          },
          {
            id: 'l3-e2-c3',
            label: 'Reduce nonessential circulation',
            preview: '+7 Oxygen, +4 Energy, -7 Temperature Control',
            effects: { oxygen: 7, energy: 4, temperature: -7 },
            consequence:
              'Lowering airflow in unoccupied bays slows oxygen loss and saves energy, though conservation alone cannot seal a leak.',
            pipNote:
              'Conservation bought us valuable time and energy—now let’s complete the permanent repair!',
            scienceFactIds: ['NASA-ECLSS'],
          },
        ],
      },
      {
        id: 'l3-e3-repair-route',
        title: 'Permanent Valve Repair & Seal Verification',
        prompt:
          'Time to seal Manifold B-2 permanently and verify that Aster Base pressure returns to Stable.',
        pipIntro:
          'Once we seal and verify the valve, our pressure indicator will switch from Warning back to Stable!',
        sceneStatus: 'restored',
        highlightModule: 'oxygen',
        diagnosticHint:
          'Patching the leak and running a pressure seal test gives the strongest long-term oxygen recovery.',
        choices: [
          {
            id: 'l3-e3-c1',
            label: 'Patch leak + test',
            preview: '+15 Oxygen, -11 Energy',
            effects: { oxygen: 15, energy: -11 },
            consequence:
              'A composite seal patch cures over Manifold B-2 and passes full pressure verification—indicator status: STABLE!',
            pipNote:
              'Seal verified at 100% integrity! Our closed-loop life support is completely airtight again.',
            scienceFactIds: ['NASA-ECLSS', 'NASA-OXYGEN'],
            isOptimalHint: true,
          },
          {
            id: 'l3-e3-c2',
            label: 'Remote valve reset',
            preview: '+8 Oxygen, -5 Energy',
            effects: { oxygen: 8, energy: -5 },
            consequence:
              'Cycling the actuator motor reseats the secondary gasket cleanly while conserving battery power.',
            pipNote:
              'Pressure indicator is Stable! Remote actuator reset worked smoothly with low energy cost.',
            scienceFactIds: ['NASA-ECLSS'],
          },
          {
            id: 'l3-e3-c3',
            label: 'Call maintenance rover',
            preview: '+12 Oxygen, -7 Energy, -4 Water',
            effects: { oxygen: 12, energy: -7, water: -4 },
            consequence:
              'The exterior rover applies a thermal sealant bead and mist-tests the joint—pressure indicator: STABLE!',
            pipNote:
              'Robotic teamwork saved the day! Seal verified and oxygen levels are back in the green.',
            scienceFactIds: ['NASA-ECLSS'],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // LEVEL 4 — MARS SURVIVAL CHALLENGE (Capstone)
  // =========================================================================
  {
    id: 'level-4-survival-challenge',
    levelNumber: 4,
    title: 'Mars Survival Challenge',
    difficulty: 'Capstone',
    estimatedMinutes: '18–22 min design target (~6–10 min core path)',
    tagline: 'Coordinate all six habitat systems through overlapping space weather and engineering alerts.',
    story:
      'Three challenges overlap at Aster Base: a power fluctuation, a water-recycling slowdown, and an incoming solar radiation alert. Prioritize crew protection, balance all six systems, and transmit your Mission Report to Earth.',
    pipOpening:
      'This is our capstone shift, Cadet! Solar radiation, water recycling, and power fluctuations are arriving together. Stay calm, protect the crew first, and watch how all six bars connect!',
    pipClosing:
      'You protected Aster Base through four difficult missions. Every resource connects to another — that’s what makes teamwork and science so important. Let’s send your Mission Brief to Earth!',
    learningObjectives: [
      'Manage cascading dependencies across all six habitat resources simultaneously.',
      'Prioritize immediate crew radiation protection before secondary tasks.',
      'Balance energy, water recycling, oxygen, and thermal stability to transmit a final report to Earth.',
    ],
    initialResources: {
      oxygen: 66,
      water: 55,
      food: 63,
      energy: 52,
      radiationProtection: 52,
      temperature: 59,
    },
    initialSceneStatus: 'radiation_alert',
    activeHighlightResources: [
      'oxygen',
      'water',
      'food',
      'energy',
      'radiationProtection',
      'temperature',
    ],
    briefTryNextTime:
      'Review how moving the crew to shelter vs. boosting active shields affected your Energy budget for water recycling and Earth communications.',
    briefScienceFactIds: ['NASA-RADIATION', 'NASA-ECLSS', 'NASA-THERMAL'],
    events: [
      {
        id: 'l4-e1-protect-crew',
        title: 'Combined Alert: Solar Radiation & System Fluctuation',
        prompt:
          'Space weather sensors detect a solar radiation surge while a grid dip lowers Energy (-10), Water (-9), and Radiation Protection (-12). How do you protect the crew first?',
        pipIntro:
          'Radiation alert! Mars does not have Earth’s thick atmosphere or magnetic shield—protecting the crew comes first!',
        sceneStatus: 'radiation_alert',
        openingEffects: { energy: -10, water: -9, radiationProtection: -12 },
        highlightModule: 'habitat',
        diagnosticHint:
          'Waiting lowers protection even further; moving to shelter or boosting shielding keeps Radiation Protection safe.',
        choices: [
          {
            id: 'l4-e1-c1',
            label: 'Activate stronger shield',
            preview: '+22 Radiation Protection, -14 Energy',
            effects: { radiationProtection: 22, energy: -14 },
            consequence:
              'High-output shielding layers reinforce the habitat roof, lifting Radiation Protection well into the healthy zone.',
            pipNote:
              'Maximum shielding active! Crew protection is strong—just keep an eye on our Energy bar next.',
            scienceFactIds: ['NASA-RADIATION'],
          },
          {
            id: 'l4-e1-c2',
            label: 'Move crew to shelter',
            preview: '+15 Radiation Protection, -6 Energy, -4 Temperature Control',
            effects: { radiationProtection: 15, energy: -6, temperature: -4 },
            consequence:
              'The crew steps into the regolith-lined inner storm shelter, boosting protection while saving precious battery energy.',
            pipNote:
              'Smart prioritization! Using the storm shelter protects the crew while preserving energy for water and life support.',
            scienceFactIds: ['NASA-RADIATION'],
            isOptimalHint: true,
          },
          {
            id: 'l4-e1-c3',
            label: 'Delay response',
            preview: '-10 Radiation Protection, +7 Energy',
            effects: { radiationProtection: -10, energy: 7 },
            consequence:
              'Waiting saves battery wattage, but incoming solar particles push Radiation Protection into the critical warning zone!',
            pipNote:
              'Waiting during a solar flare raises radiation risk because particles arrive fast—let’s stabilize water and power carefully!',
            scienceFactIds: ['NASA-RADIATION'],
          },
        ],
      },
      {
        id: 'l4-e2-water-prioritization',
        title: 'Water-Recycling Slowdown',
        prompt:
          'Following the power dip, the water recycler loop has slowed down. How should we restore Water without starving other systems?',
        pipIntro:
          'Remember how Water supports both the crew and our greenhouse! Let’s pick the right recovery balance.',
        sceneStatus: 'radiation_alert',
        highlightModule: 'water',
        diagnosticHint:
          'Optimizing systems balances water recovery with moderate energy and food trade-offs.',
        choices: [
          {
            id: 'l4-e2-c1',
            label: 'Prioritize recycler',
            preview: '+16 Water, -12 Energy',
            effects: { water: 16, energy: -12 },
            consequence:
              'Full pump power clears the filtration bottleneck and restores clean water reserves rapidly.',
            pipNote:
              'Water supply is back in great shape! Now let’s manage our remaining Energy carefully.',
            scienceFactIds: ['NASA-ECLSS'],
          },
          {
            id: 'l4-e2-c2',
            label: 'Conserve water for crew',
            preview: '+8 Water, -6 Food',
            effects: { water: 8, food: -6 },
            consequence:
              'Pausing greenhouse misting directs purified water straight to crew hydration while saving electrical power.',
            pipNote:
              'Good crisis triage—keeping crew drinking water safe without draining the battery.',
            scienceFactIds: ['NASA-ECLSS'],
          },
          {
            id: 'l4-e2-c3',
            label: 'Optimize systems',
            preview: '+10 Water, -7 Energy, -3 Food',
            effects: { water: 10, energy: -7, food: -3 },
            consequence:
              'Tuning pump pressure and recycling condensation recovers solid water reserves with a balanced energy cost.',
            pipNote:
              'Balanced optimization keeps Water, Energy, and Food all moving together safely!',
            scienceFactIds: ['NASA-ECLSS', 'NASA-PLANTS'],
            isOptimalHint: true,
          },
        ],
      },
      {
        id: 'l4-e3-energy-conflict',
        title: 'Multi-System Energy Conflict',
        prompt:
          'Air scrubbers, battery reserves, and thermal control all need attention as the solar storm fades. How do you allocate power?',
        pipIntro:
          'Every resource connects to another—check your lowest bar before choosing how to share electricity!',
        sceneStatus: 'restored',
        highlightModule: 'solar',
        diagnosticHint:
          'Sharing power across systems lifts both Energy and Temperature Control together.',
        choices: [
          {
            id: 'l4-e3-c1',
            label: 'Keep life support powered',
            preview: '+11 Oxygen, -11 Energy',
            effects: { oxygen: 11, energy: -11 },
            consequence:
              'Oxygen generation runs at peak efficiency, keeping cabin air crisp and abundant.',
            pipNote:
              'Oxygen is rock-solid! Make sure you still have enough Energy to send our report to Earth.',
            scienceFactIds: ['NASA-OXYGEN'],
          },
          {
            id: 'l4-e3-c2',
            label: 'Battery save mode',
            preview: '+12 Energy, -8 Temperature Control',
            effects: { energy: 12, temperature: -8 },
            consequence:
              'Throttling heater coils recharges main batteries, though Temperature Control dips slightly.',
            pipNote:
              'Smart battery recovery—now we have plenty of wattage for the communications dish!',
            scienceFactIds: ['NASA-THERMAL'],
          },
          {
            id: 'l4-e3-c3',
            label: 'Share power across systems',
            preview: '+6 Energy, +4 Temperature Control, -4 Food',
            effects: { energy: 6, temperature: 4, food: -4 },
            consequence:
              'Smart load balancing steadies both battery charge and habitat Temperature Control while pausing galley ovens.',
            pipNote:
              'Textbook systems engineering! All six habitat indicators are steady for final transmission.',
            scienceFactIds: ['NASA-THERMAL', 'NASA-ECLSS'],
            isOptimalHint: true,
          },
        ],
      },
      {
        id: 'l4-e4-communications-final',
        title: 'Communications Dish — Final Earth Report',
        prompt:
          'The high-gain dish is aligned with Earth! How should we transmit our Aster Base telemetry and Mission Brief?',
        pipIntro:
          'Let’s send our Mission Brief to Earth and review everything you accomplished across all four missions!',
        sceneStatus: 'restored',
        highlightModule: 'communications',
        diagnosticHint:
          'Compressing telemetry or stabilizing systems first ensures the dish transmits cleanly without draining energy.',
        choices: [
          {
            id: 'l4-e4-c1',
            label: 'Send full report now',
            preview: '-9 Energy',
            effects: { energy: -9 },
            consequence:
              'High-power transmission beams full HD habitat diagnostics across interplanetary space to Mission Control on Earth!',
            pipNote:
              'Signal received on Earth! Full telemetry package delivered.',
            scienceFactIds: ['NASA-ECLSS'],
          },
          {
            id: 'l4-e4-c2',
            label: 'Compress and send report',
            preview: '-4 Energy',
            effects: { energy: -4 },
            consequence:
              'Data compression sends every critical sensor reading to Earth using less than half the transmitter wattage!',
            pipNote:
              'Efficient engineering! Compressing data saves energy while delivering every single result.',
            scienceFactIds: ['NASA-ECLSS'],
            isOptimalHint: true,
          },
          {
            id: 'l4-e4-c3',
            label: 'Stabilize systems first',
            preview: '+6 Energy, -3 Water (then transmit)',
            effects: { energy: 6, water: -3 },
            consequence:
              'Topping up fuel cells before keying the transmitter sends the Earth report with a healthy power surplus.',
            pipNote:
              'Finishing with extra energy margin is a hallmark of a great Mission Controller!',
            scienceFactIds: ['NASA-ECLSS'],
          },
        ],
      },
    ],
  },
];

export function getMissionLevelById(levelId: string): MissionLevel | undefined {
  return MISSION_LEVELS.find((lvl) => lvl.id === levelId);
}