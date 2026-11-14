# Bonus Mission 05 — Solar Storm Watch (specification)

**Status:** designed and data-backed, **not wired into the game**.
**Content draft:** `src/data/nasa/bonusMission05.ts`.
**Evidence:** `src/data/nasa/solarStormWatchSnapshot.ts`.
**Validation:** `src/integrations/nasa/__tests__/bonusMission.test.ts`, which enumerates all 243 decision paths.

---

## 1. Purpose

Teach players aged 7–12 how a Mars crew protects astronauts and the base when the Sun erupts. By the end they should understand:
- Particles can arrive **fast**: less than an hour at Mars in May 2024.
- Shelter costs **water, power and time**.
- Leaving shelter should be decided by **measurements, not alarms or guesses**.
- A **measurement**, a **computer prediction** and a **NASA statement** are different kinds of evidence.

**Optional by design:**
- Levels 1–4, their gameplay, UI and progression are untouched.
- The mission is offered after Level 4 is reviewed, or from the Mission Library, and is never required to unlock anything.

## 2. The real event behind it (historical replay)

The mission replays **20 May 2024**. Every number below is either computed from captured NASA data or quoted from NASA.

| Evidence | What it says | Kind / location | Source |
|---|---|---|---|
| DONKI `2024-05-20T05:36:00-CME-001` | *"Fast halo CME visible in SOHO LASCO C2/C3 and STEREO A COR2. The source is believed to be backsided"*. Leading edge ~**1,927 km/s** (SCORE **O**-type); shock front ~2,678 km/s; HEEQ longitude 176°/172° (far side from Earth). | Measurement (coronagraph analysis) · Sun and near-Earth space | https://ccmc.gsfc.nasa.gov/DONKI/view/CME/31034/-1 |
| DONKI WSA-ENLIL runs for that CME | Predicted arrivals at Solar Orbiter, OSIRIS-APEX, Juno. **Mars is not listed.** | **Model prediction** | same record |
| DONKI alert `20240520-AL-001` | *"…it is estimated that the CME may impact Juno and Solar Orbiter."* Issued 2024-05-20T15:52Z. | Model-based notification | https://ccmc.gsfc.nasa.gov/DONKI/view/Alert/31039/1 |
| RadLab, Curiosity MSL-RAD (surface) | Baseline ≈ 4.1 µGy/h (≈ 98.5 µGy/day). First sample above 10 µGy/h at **05:38:56 UTC**; peak **304 µGy/h at 06:15:19 UTC** (≈ 74× baseline); back under 2× baseline at 2024-05-21 17:00 UTC (≈ **35 h**). 20 May dose ≈ 1,487 µGy (≈ 15× a quiet day). | **Measurement · Mars surface** | RadLab API (see registry) |
| NASA/JPL release 2024-080 (10 June 2024) | Flare *"later estimated to be an X12"*; astronauts nearby *"would have received a radiation dose of 8,100 micrograys … equivalent to 30 chest X-rays"*; *"Cliffsides or lava tubes would provide additional shielding"*. | **NASA statement · Mars surface** | https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/ |

**Two cautions the content must respect:**
1. **"X12" comes from NASA's later estimate, not from DONKI.** DONKI's flare catalog has no record of this far-side flare, because GOES cannot see the far side.
2. **Never present RadLab's ≈1,487 µGy and NASA's 8,100 µGy as the same quantity.** RadLab doesn't state the detector medium; NASA's figure is a separate derivation. A test enforces that 8,100 appears only on the NASA-statement card.

**The teaching hook:** the CME forecast didn't list Mars, yet radiation at Mars was already rising by the time the eruption's EUV wave was seen. The DONKI note gives the EUV wave at 05:22Z. RAD read 7.4 µGy/h at 05:21:50 (baseline ≈ 4.1), 60 µGy/h at 05:38:56 and 304 µGy/h at 06:15:19 UTC. RAD samples about every 17 minutes, so the exact start isn't resolvable. "In less than an hour" is the safe claim. Fast particles don't wait for the cloud, so crews need a shelter they can reach quickly.

## 3. Learning objectives

1. Explain that the Sun can send radiation storms to Mars, and that energetic particles can arrive in less than an hour.
2. Choose shelter strategies (getting indoors fast, water walls) and describe what each costs.
3. Balance power, air and food while a crew shelters for about a day and a half.
4. Tell the difference between a measurement, a computer-model prediction and a NASA statement.

## 4. Reuse of existing game systems

| System | Reuse |
|---|---|
| Resources | All six existing keys, 0–100, same clamping and health thresholds. Highlights: radiation protection, energy, water, oxygen. |
| Scene | Existing Mars map and hotspots only: `communications`, `rover`, `habitat`, `greenhouse`, `oxygen`, `solar` |
| Scene statuses | Existing ones only: `normal` → `radiation_alert` → `oxygen_alert` → `restored` |
| Decision model | Existing `MissionEvent` / `DecisionOption`. Previews are generated from effects, so they always match. |
| Mission Brief | Existing brief, plus an evidence section (§7) |

**Initial resources:** O 76 · W 74 · F 70 · E 72 · R 64 · T 74. **Initial scene:** `normal`.

## 5. Decisions (5 events × 3 choices)

Effects are **authored game mechanics** (abstract 0–100 indices). NASA data appears only as evidence cards and is never converted into resource values.

### E1 — Space Weather Alert · hotspot `communications` · scene `normal`

Mission Control relays a NASA space-weather note: a very fast eruption left the side of the Sun we can't see from Earth. Two astronauts are hauling ice on the rover.

| Choice | Effects | Lesson |
|---|---|---|
| ⭐ Call the rover crew back now | +10 Radiation Protection, −6 Water | Particles can arrive within the hour. Get indoors fast (NASA "Real Martians"). |
| Finish hauling the ice first | +6 Water, −14 Radiation Protection | Resources outside are not worth exposure |
| Wait for Earth to send a clearer forecast | +3 Water, −4 Energy, −8 Radiation Protection | One-way signals take 4–20 minutes (JPL). Mars crews must act locally. |

Evidence: `donki-far-side-cme`, `donki-model-did-not-list-mars`, `jpl-signal-delay`

### E2 — Build the Storm Shelter · hotspot `habitat` · scene `radiation_alert` · opening −8 Radiation Protection

| Choice | Effects | Lesson |
|---|---|---|
| ⭐ Fill the shelter walls with water | +16 Radiation Protection, −8 Water, −4 Energy | NASA: stored water can form a storm shelter, then be used and replaced with recycled water |
| Fill the walls halfway to save water | +8 Radiation Protection, −4 Water, −2 Energy | Less material, less protection |
| Keep fixing the battery instead | +6 Energy, −10 Radiation Protection | Repairs can wait; exposure can't be undone |

Evidence: `radlab-mars-spike`, `real-martians-water-shelter`, `jpl-8100-microgray`

### E3 — Power While You Hide · hotspot `greenhouse` · scene `radiation_alert` · opening −6 Energy

The crew must shelter about a day and a half; that's how long levels took to calm at Mars in 2024.

| Choice | Effects | Lesson |
|---|---|---|
| ⭐ Dim the grow lights | +8 Energy, −4 Food, −3 Oxygen | Light matters to crops (VEG-04 / OSD-655 tested light colors), but it costs power |
| Keep the greenhouse fully lit | +3 Food, +2 Oxygen, −10 Energy | Panels can't be cleaned during the storm |
| Switch the greenhouse off completely | +12 Energy, −9 Food, −6 Oxygen, −3 Temperature Control | Over-saving hurts other systems |

Evidence: `radlab-mars-spike`, `osdr-veg04-light`

### E4 — Stuffy Shelter Air · hotspot `oxygen` · scene `oxygen_alert` · opening −6 Oxygen

| Choice | Effects | Lesson |
|---|---|---|
| ⭐ Run the CO₂ scrubber at full speed | +10 Oxygen, −8 Energy | ISS cabin CO₂ is a few thousand ppm (EDA medians 2,141–3,892 ppm); cleaning air takes power |
| Take turns breathing in the main module | +6 Oxygen, −8 Radiation Protection | Leaving the shielded room adds exposure |
| Rest quietly and turn the heaters down | +4 Oxygen, +4 Energy, −6 Temperature Control | Every saving has a cost |

Evidence: `eda-iss-cabin-co2`

### E5 — Is It Safe Yet? · hotspot `solar` · scene `restored`

| Choice | Effects | Lesson |
|---|---|---|
| ⭐ Check the radiation sensor, then go out | +6 Radiation Protection, +6 Energy, −3 Food | Decide with measurements (RAD took ≈35 h to fall below 2× baseline) |
| Go out as soon as the alarm stops | +10 Energy, −10 Radiation Protection | Quiet alarm ≠ normal levels |
| Stay inside one more full day to be extra sure | +8 Radiation Protection, −8 Energy, −5 Food | Over-caution also costs |

Evidence: `radlab-mars-spike`

### Balance (computed over all 3⁵ = 243 paths with the game's clamping)

- **Optimal path** (⭐ each time) ends at O 77 · W 60 · F 63 · E 68 · R 88 · T 74, all healthy (≥ 60).
- **Outcomes across all paths:** 225 "Mission Reviewed", 18 "Support Needed", **0** "Crew Stabilized". No path drives any resource to 0.
- **Worst path** (always rush: E1 finish hauling → E2 fix battery → E3 dim lights → E4 main-module breaks → E5 go out at once) ends at R **14** with E 90 and W 80. That is the intended lesson: *you saved resources but exposed the crew.*
- Every choice has at least one gain and one cost (tested), so there is no "safe" choice with no cost, per the challenge guidance.

Tuning note: the mission is deliberately forgiving (optional, ages 7–12, *"learn from failure without it feeling punitive"*). To make it harder, lower the initial Radiation Protection or the E2 shelter gains.

## 6. Optional "What is the Sun doing now?" panel (live DONKI)

- **Call:** `loadSolarStormWatchData({ days: 30 })` on mission open. It never throws; it returns `{ replay, today }`.
- **If `today.status === 'live'`:**
  - Show the tier badge: *Quiet*, *Active* or *Stormy*.
  - Show the plain reasons, e.g. "10 M-class flares; 26 CMEs of 500+ km/s; a computer model predicts a solar cloud reaching Mars".
  - Show the fetch time and the DONKI disclaimer.
- **If unavailable:** "Live Sun data is unavailable right now. This mission uses a real storm from May 2024."
- **The live tier never changes resources, effects or choices.** It only frames the story: "Today the Sun is quiet, so this is a drill" vs "The Sun is active today; real forecasters are watching." Mapping DONKI numbers onto 0–100 bars would invent a relationship that doesn't exist.
- **Tier rules** (`classifySolarActivity`, game framing only, not a forecast):
  - **Storm:** any *observed* SEP event, any X flare, or a CME of 1,000+ km/s with a Mars model prediction
  - **Active:** any M flare, a CME of 500+ km/s, or any Mars prediction
  - **Quiet:** otherwise
  - HESPERIA RELeASE model-only SEP entries are excluded from the counts.

## 7. Mission Brief additions

1. **"Real NASA evidence"** section: the cards linked to the player's choices. Each card shows:
   - heading and kid text, with an "older explorers" expandable detail
   - an evidence-type chip: *Measurement*, *Computer prediction*, *NASA said*, *Mission design idea*
   - a location chip: *Mars surface*, *Sun & near-Earth space*, *Space Station*, *Earth–Mars radio link*
   - the source link and "Real data from 20 May 2024 · captured 14 Nov 2026"
2. **Mini chart (optional):** `MARS_RAD_2024_HOURLY`, 96 hourly points of Curiosity's dose rate, with the onset and peak marked. Label it "Curiosity RAD, Mars surface, µGy per hour".
3. **Storm Readiness (game score):** compute it with the existing `planningScore` formula. Display: *"Storm Readiness is an in-game practice score. It is not an official NASA Space Apps Challenge score, judging criterion or award."*
4. **Science facts:** `NASA-SOLAR-STORM-MARS-2024`, `NASA-STORM-SHELTER-WATER`, `NASA-SPACE-WEATHER-DONKI` (+ per-choice facts).

## 8. Copy rules (scientific caveats)

- Say "a real storm from **May 2024**", never "today", "now" or "live", unless the live panel fetched it.
- "Radiation dose" (first use): "how much energy from radiation soaks into your body". "Microgray": "a tiny unit for measuring radiation dose".
- Say that particles "can arrive in less than an hour", which is the measured RAD onset. Don't give a precise travel time.
- Water walls: attribute them to NASA as an idea ("NASA has suggested…"), not a proven Mars habitat design.
- Game numbers are not real units. Reuse the existing `SIMULATION_DISCLAIMER`.
- Don't say the storm was dangerous or deadly. Quote NASA's "30 chest X-rays" comparison and stop there.
- ISS CO₂ values are Space Station values, not Mars.

## 9. Data requirements

| Need | Provided by | Live? |
|---|---|---|
| Replay CME record + alert metadata | `generated/donkiReplay2024.generated.ts` | Snapshot |
| Mars RAD series and metrics | `generated/marsRad2024.generated.ts` → `marsRad2024.ts` | Snapshot |
| ISS cabin CO₂ range | `generated/edaIssEnvironment.generated.ts` → `edaIssEnvironment.ts` | Snapshot |
| VEG-04 study card | `generated/osdrStudies.generated.ts` → `osdrPlantStudies.ts` | Snapshot |
| "Sun now" panel | `loadSolarStormWatchData()` → DONKI FLR + CME + SEP | Live (optional) |

## 10. Integration contract

```ts
// src/data/nasa/bonusMission05.ts
export interface BonusMissionDefinition {
  id: 'bonus-05-solar-storm-watch'; bonusNumber: 5; title: 'Solar Storm Watch'; difficulty: 'Bonus';
  isOptional: true; unlockHint: string; estimatedMinutes: string; tagline: string; story: string;
  pipOpening: string; pipClosing: string; learningObjectives: string[];
  initialResources: Resources; initialSceneStatus: SceneStatus; activeHighlightResources: ResourceKey[];
  events: MissionEvent[];                       // existing type, unchanged
  eventEvidence: Record<string, string[]>;      // eventId → EvidenceCard ids
  briefTryNextTime: string; briefScienceFactIds: string[];
  hotspotsUsed: HotspotId[]; scoring: { label: string; disclaimer: string };
}
export const BONUS_MISSION_05: BonusMissionDefinition;
export const BONUS_05_SCIENCE_FACTS: Record<string, ScienceFact>;   // 6 new IDs; none collide with existing ones

// src/integrations/nasa/solarStormContext.ts
export function loadSolarStormWatchData(opts?: ClientOptions & { days?: number }): Promise<SolarStormWatchData>;
// SolarStormWatchData = { replay: SolarStormReplay; today: { status: 'live'; context } | { status: 'unavailable'; error } }
```

**Why it isn't a `MissionLevel`:** `MissionLevel.levelNumber` is `1 | 2 | 3 | 4`, `title` and `difficulty` are closed unions, and `MissionBriefReport` copies `levelNumber`. Integrating needs one of the two options in `INTEGRATION_HANDOFF.md` §3. Both require approval from the `types.ts` owner.

## 11. Acceptance criteria

- [ ] Levels 1–4 play exactly as before; their completion and progression never depend on the bonus.
- [ ] The bonus is reachable but never auto-starts.
- [ ] Every evidence card shows type, location, source link and capture date. Nothing historical is labelled live.
- [ ] With network off, the mission is fully playable and the panel says live data is unavailable.
- [ ] With network on, the panel shows the DONKI fetch time and disclaimer, and resources are unchanged by it.
- [ ] Storm Readiness shows the "not an official Space Apps score" disclaimer.
- [ ] `node src/integrations/nasa/__tests__/run.ts` passes; `npm run build` and `npm run lint` pass.
- [ ] Copy reviewed against §8 by the science content owner.

## 12. Open questions for the owners

1. Unlock rule: after Level 4, or always visible? (We recommend always visible, marked "Bonus".)
2. Integration option A or B (`INTEGRATION_HANDOFF.md` §3)?
3. Should the Mars RAD mini-chart ship, or only the cards?
4. Keep the live panel, or ship replay-only for the demo (fewer moving parts)?
