# MARS BASE: MISSION CONTROL
## Game Design & Hackathon Delivery Handbook
**Junior Astronaut Mission Trainer | English | Revised team assignment | 13 November 2026**

**Team:** Mohamed — React UI/UX  |  Malak — Game Logic & Scientific Content  |  Renad — 3D & Integration

**Repository:** https://github.com/Renad-Hazem/junior-astronaut-mission-trainer

**One-sentence promise:** Keep a Mars crew safe by learning how oxygen, water, food, energy, radiation protection, and thermal control affect one another.

**Scope note:** A 60–75 minute experience is the intended content target; it must be measured. A complete and stable four-level educational MVP takes precedence during the 24-hour build.

---

## Authoritative clarification — four-avatar playable Mars exploration

The product is an actual playable 3D exploration game, not a resource dashboard with a decorative scene. The child selects one of exactly four cosmetic astronaut appearances before mission entry. All four share one controller and identical gameplay. This clarification preserves the storyline, four missions, six resources, existing public interfaces, branches and file ownership described later in this handbook. Where historical copied content calls avatar selection, basic animation, movement or hotspot interaction optional, this section and [`09_FOUR_AVATARS_ANIMATION_GAMEPLAY.md`](09_FOUR_AVATARS_ANIMATION_GAMEPLAY.md) supersede it.

### Required core loop
1. Choose one of four avatars and confirm the selection.
2. Enter the one reusable low-poly Mars Base map with that appearance.
3. Receive the current mission objective.
4. Control the astronaut with WASD or arrow keys.
5. Explore on the X/Z ground plane while Y remains height.
6. Approach the relevant base system.
7. See the nearby highlight/prompt and press `E`.
8. Inspect the problem through the existing `onInspect(hotspotId)` callback.
9. Choose an authored response.
10. Observe exactly-once resource consequences and scene feedback.
11. Read the explanation and explicitly Continue.
12. Complete the remaining data-driven objectives and show friendly Celebrate feedback.
13. Read the supportive Mission Brief with real decision history and verified NASA references.

Movement uses frame delta and normalized diagonal input. An isometric camera follows the astronaut. Basic bounds/collision keep the character in the playable area. Exactly four distinct appearances share the same map, controller, speed, collision, interaction radius, camera, interactables, resources and outcomes across **First Day on Mars**, **Power Crisis**, **Oxygen Emergency** and **Mars Survival Challenge**. Idle, Walk, Interact and Celebrate are P0 visible states using verified clips or procedural fallbacks. Gameplay remains friendly, nonviolent and suitable for ages 7–15.

### Preserved ownership and integration
- **Mohamed — UI-owned paths only:** retain implemented screens; add four avatar cards, Confirm/Change, safe persistence and selected identity; show movement/objective/prompt/decision/consequence/Continue states and fallback. Never calculate effects in React.
- **Malak — `src/game/**`, `src/data/**`, `src/science/**`:** after approval, own stable cosmetic avatar IDs/metadata plus objectives, `MissionEvent.hotspotId`, decisions, resources, progression, reports and science. Do not implement movement/rendering or avatar-specific outcomes.
- **Renad — `src/scene/**`, optional verified `public/models/**`:** own four appearances/fallbacks, model audit, semantic animation, one controller, camera, bounds/collision, interactables, proximity, `E` and scene feedback. Do not rewrite UI/game logic.

```text
choose avatar → confirm → enter mission → approach current system
→ highlight/prompt → E → onInspect(hotspotId)
→ matching UI decision → chooseOption(optionId) → consequence
→ continueMission() → next hotspot or Mission Brief
```

The frozen APIs remain unchanged. The proposed `AvatarId`, `AvatarDefinition`, canonical metadata and optional `MarsSceneProps.avatarId` are additive and **REQUIRES TEAM APPROVAL**; see `02_TECHNICAL_CONTRACTS.md`. `MissionEvent.hotspotId` maps to the identically named scene interactable. The accessible `Inspect System` control invokes the same logical path when WebGL/keyboard interaction fails. Continuous nearby-hotspot state is not in the frozen API; any optional callback proposal also requires approval.

### In-progress priority correction
- **P0:** four avatar choices, four distinct appearances/fallbacks, one controller, Idle/Walk/Interact/Celebrate, four complete levels, shared playable map, movement, camera, bounds/collision, proximity + `E`, decisions, Continue, Mission Brief, fallbacks, build/lint.
- **P1:** verified GLB polish, smoother blending, stronger highlighting, dust effects, touch controls and sound/feedback.
- **P2:** advanced custom rigging, new custom assets, voice acting, large-world exploration and cinematics.

Do not restart completed work. Integrate the smallest playable vertical slice on the current team branches, then repeat it across the four data-driven missions. The one-hour target remains aspirational until a timed full-game playtest proves it.

---

## Handbook sections

- Project brief and audited repository status
- Game Design Document, including four levels and the Mission Brief system
- Technical contracts shared by the three developers
- Four-avatar, animation, model-fallback and spatial-gameplay specification (`09_FOUR_AVATARS_ANIMATION_GAMEPLAY.md`)
- 24-hour execution, branch, review and release plan
- NASA references and educational science facts
- QA, accessibility and judging demo

---

# MARS BASE: MISSION CONTROL — START HERE
**Project:** Junior Astronaut Mission Trainer  
**Document set:** Hackathon delivery pack v1.0 | 13 November 2026  
**Team:** Renad (3D & integration), Malak (gameplay engine & science), Mohamed (React UI & experience)  
**Repo:** https://github.com/Renad-Hazem/junior-astronaut-mission-trainer  
**Audience:** Children aged 7–15 | **Format:** Browser-based 3D educational decision game

## Final concept decision
The location is **MARS, not the Moon**. This document supersedes the earlier Moon concept. The game has four levels, in this order:
1. **First Day on Mars** — introduction to Oxygen, Water, Food, Energy.
2. **Power Crisis** — a dust storm reduces solar production, showing system dependencies.
3. **Oxygen Emergency** — a habitat leak triggers repair, reserves and conservation trade-offs.
4. **Mars Survival Challenge** — combined energy, water, oxygen, radiation and thermal-control emergencies.

Six displayed resource categories across the game: **Oxygen, Water, Food, Energy, Radiation Protection, Temperature Control**. The last category is a **0–100 thermal-safety indicator, NOT a Celsius thermometer**. All resource percentages and consequences are illustrative game values, not a validated engineering model.

After every level, the player receives a **Mission Brief** showing decisions, before/after resources, scientifically grounded explanations, and a constructive next step. Avoid standard violent combat or punitive win/lose screens.

## Repo audit (observed on 13 Nov 2026)
- `main` contains a Vite + React + TypeScript starter, not a functioning game.
- `package.json` already includes `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, Vite, TypeScript and ESLint.
- The repo currently shows one visible branch (`main`) and starter `src/App.tsx`, `src/App.css`, and `src/index.css`.
- **Do not recreate the project or replace its package dependencies by assumption.** Start from a fresh pull of `main`.

## Read order
1. `01_GAME_DESIGN_DOCUMENT.md` — story, game feel, detailed levels, age adaptation, lessons and pacing.
2. `02_TECHNICAL_CONTRACTS.md` — exact TypeScript interfaces, ownership, navigation and integration contracts. **All three must read this before coding.**
3. One personal file: `03_RENAD_TASKS.md`, `04_MALAK_TASKS.md`, or `05_MOHAMED_TASKS.md`.
4. `06_24_HOUR_RUNBOOK.md` — work schedule, merging, handoffs, scope cuts and release.
5. `07_SCIENCE_AND_CONTENT_SOURCES.md` — science-safe text and official sources.
6. `08_QA_AND_DEMO.md` — acceptance criteria, playtest script, known risks.

## Non-negotiable shared rules
- No backend, login, external API calls, AI runtime dependence, multiplayer or complex mobile joystick for the 24-hour build.
- Every level shares **one 3D Mars base scene** with stage-dependent atmosphere and interactive landmarks. Do not build four separate complex 3D levels.
- Gameplay uses **data-driven event cards and a deterministic resource engine**. No repeated hard-coded React event logic.
- Prioritize a complete Home → Mission Library → Level → Decisions → Mission Brief → Next Level loop.
- The person responsible for a file is its sole editor until agreed handoff. Shared type changes need team approval.
- All AI agents must inspect the existing project, avoid overwriting teammates' files, commit only on their assigned branch and report exact changes.
- A one-hour experience is the **content/design goal**, not an independently verified runtime guarantee. In 24 hours, target four coherent levels and a high-quality 15–30 minute end-to-end demo. Add optional exploration, choices, reflection and additional authored event variants only after integration. Never pad with unskippable waiting.

## Minimum viable milestone (MUST ship)
Four selectable levels; four selectable cosmetic astronauts; one controller; P0 Idle/Walk/Interact/Celebrate; at least three meaningful decisions per level; one shared interactive 3D Mars base; WASD/arrow movement; isometric follow camera; bounds/collision; proximity + `E`; six resources; decision history; per-level NASA-linked Mission Briefs; responsive fallback; no crash; successful build/lint.

## Expansion milestone (ONLY if on time)
Improved astronaut model/animation, rover investigation, 5–7 interactions per level, touch controls, accessibility reading modes, sound toggles, expanded exploration and save/replay functionality. Basic movement and system interaction are minimum scope. Measure actual play time before describing it publicly as a 60+ minute game.

## Version boundaries
This package is documentation and implementation guidance; it **does not** claim that the game code is already built, tested or deployed. No changes were pushed to the shared repository as part of document preparation.


---

# GAME DESIGN DOCUMENT — MARS BASE: MISSION CONTROL
**Version 1.0 | English | 13 November 2026 | High-stakes 24-hour hackathon MVP**

## 1. High concept
**Tagline:** *Small choices. Big discoveries. Keep the crew safe on Mars.*

A colorful, gentle, 3D educational management-adventure for ages 7–15. The player becomes **Cadet Nova**, the rookie Mission Controller of **Aster Base**, a tiny science outpost on Mars. An empathetic assistant robot called **PIP** explains the habitat systems and presents incoming alerts. The player investigates equipment, distributes limited resources, and learns why one decision affects other life-support systems. There is no violence, death animation, or enemy to fight. Challenges come from the Martian environment and engineering trade-offs.

**Core promise:** A mission should feel like solving an adventure in a living space station, **not** completing a science multiple-choice test.

## 2. Audience and age design
- **Ages 7–10:** short sentences, icon + text for every resource, read-aloud-friendly instructions, no time pressure, 2–3 decisions per event, guided hints, forgiving recovery.
- **Ages 11–15:** optional `Why?` scientific expansion panels, nuanced trade-offs, optional advanced objectives and a more detailed Mission Brief.
- **Common baseline:** keyboard/mouse + touch-compatible clickable buttons; visually identifiable targets; large buttons; high contrast; avoid relying on color alone; motion reduced where possible.
- **Scientific honesty:** All in-game resources are made-up normalized values for teaching cause and effect. Facts sourced separately from official NASA material. Never call game percentages actual NASA measurements.

## 3. Narrative structure
**Setting:** A fictional future Mars base near a safe exploration zone. The crew are off-screen; mission control displays their welfare without depicting distress. The red-orange terrain has small boulders, a greenhouse, solar array, oxygen station, water recycler, communication dish, and central habitat. Isometric camera helps players understand where systems are located. Each completed stage changes a few lights, alert icons, or props in the **same scene**.

**Characters**
- **Player astronaut / Cadet Nova:** one of four selectable cosmetic appearances using a single controller. Verified supplied models take precedence; four distinct primitive/low-poly fallbacks keep every choice playable. Complex rigging is optional, but Idle/Walk/Interact/Celebrate feedback is P0.
- **PIP:** cheerful robot advisor in text panels, never scolds the player.
- **Crew:** represented by a status card; do not model detailed humans in 24 hours.

**Opening scene (30–45 seconds, skippable):**
> PIP: "Welcome to Aster Base, Cadet! Mars is amazing, but our crew needs careful planning. Oxygen, water, food and power all work together. Ready for your first shift?"

**Closing scene:**
> PIP: "You protected Aster Base through four difficult missions. Every resource connects to another — that's what makes teamwork and science so important. Let's send your Mission Brief to Earth!"

## 4. Core player loop
1. **Choose:** Select and confirm one of four cosmetic avatars before mission entry.
2. **Enter:** Load the shared Aster Base map with the selected appearance and objective.
3. **Move:** Use WASD/arrows on X/Z while the isometric camera follows.
4. **Explore:** Walk to the system identified by the active event's `hotspotId`.
5. **Interact:** Enter proximity, see the prompt and press `E` to call `onInspect(hotspotId)`; retain an accessible fallback.
6. **Inspect and decide:** Read the problem and pick one of 2–3 responses with visible trade-off hints.
7. **Observe:** Apply resources once and show consequence, avatar and equipment feedback.
8. **Continue:** Let the player read before explicitly advancing.
9. **Celebrate and debrief:** Show a gentle completion response, then Mission Brief history, outcomes and NASA-linked science.

No randomized instant death or combat. Choices must matter but should not make the experience irreversibly unwinnable. If a critical resource is exhausted, invoke a **Stabilization Protocol** and allow a checkpoint retry with an explanation.

## 5. The six resources
| In-game name | Key | Meaning in the game | Learning goal |
|---|---|---|---|
| Oxygen | `oxygen` | Usable oxygen supply reserve, 0–100 | Air must be supplied and monitored |
| Water | `water` | Available purified water supply, 0–100 | Recycling and careful allocation matter |
| Food | `food` | Crew food reserve, 0–100 | Production and food planning consume resources |
| Energy | `energy` | Available stored electrical energy, 0–100 | Solar supply, storage and consumption are connected |
| Radiation Protection | `radiationProtection` | Effectiveness of protective systems, 0–100 | Sheltering and shielding protect a crew |
| Temperature Control | `temperature` | Thermal safety/stability index, 0–100 | Maintaining a safe habitat temperature uses power |

**Important:** The `temperature` numeric variable is *not* air temperature in Celsius. Display label: `Temperature Control`; small tooltip: `Habitat thermal safety index — 100 means stable`.

Suggested state colors: Healthy >=60; Caution 30–59; Critical <30. Use words/icons alongside colors. Limit all values to 0–100 after every decision. Event updates happen on user action, not every real-world second.

## 6. Levels, story beats and lesson outcomes

### LEVEL 1 — FIRST DAY ON MARS (Beginner)
**Story:** Nova arrives at Aster Base. PIP gives a guided tour. Four systems must be inspected before the first Martian night. Radiation and thermal safety are displayed but initially passive.

**Learning objectives:** (a) identify oxygen, water, food and energy; (b) understand that life support needs a sealed habitat; (c) recognize that food cultivation and air treatment can consume energy and water.

**Recommended base state:** Oxygen 78; Water 76; Food 70; Energy 72; Radiation Protection 80; Temperature Control 78.

**Sequence (3 core events + 2 stretch interactions):**
1. **Habitat Check:** walk to the central dome and press `E`; PIP explains the sealed habitat and atmospheric needs. Tutorial spotlight.
2. **Air System Setup:** oxygen subsystem needs attention. Choices: `Run oxygen system` (+14 oxygen, -10 energy, -5 water), `Use oxygen reserves` (+12 oxygen, -2 energy), or `Inspect filters first` (+5 oxygen, -3 energy, extra hint). These are *illustrative game balances*, not physical rates.
3. **Water Recycler:** choices: `Run purification cycle` (+13 water, -8 energy), `Conserve water` (+7 water, -4 food), or `Do a maintenance check` (+8 water, -5 energy and show learning card).
4. **Greenhouse Plan:** choices: `Grow more food` (+15 food, -11 water, -9 energy), `Use existing rations` (-8 food, +4 energy), or `Balanced schedule` (+7 food, -5 water, -4 energy).
5. **Optional exploration:** find 2 simple supply beacons on the same 3D stage; not required for the essential loop.

**Mission Brief highlights:** Name the four essential resources; compare decision effects; `A habitat on Mars must provide breathable air because the outside atmosphere cannot be breathed by humans.` [NASA-OXYGEN]

### LEVEL 2 — POWER CRISIS (Intermediate)
**Story:** A dust storm reduces sunlight at the solar array. Solar generation drops. The greenhouse and temperature regulator both demand electricity.

**Learning objectives:** (a) dust affects solar availability; (b) stored power is limited; (c) backup power, conservation and priorities are engineering trade-offs.

**Recommended base state:** Oxygen 72; Water 70; Food 70; Energy 58; Radiation Protection 76; Temperature Control 69.

**Sequence:**
1. **Dust warning:** animated dust overlay over same stage; apply scripted event energy -18, temperature -6, with explanatory alert.
2. **Power priorities:** `Prioritize life support` (+9 oxygen, -9 energy, -5 food), `Keep greenhouse at full power` (+10 food, -15 energy), `Balanced reduced-power mode` (-5 food, +11 energy, -5 temperature). Different trade-offs, no uniquely perfect answer.
3. **Solar cleanup decision:** `Dispatch small cleaning rover` (+13 energy, -6 water), `Wait and conserve` (+9 energy, -7 food), `Use emergency reserve` (+16 energy, -6 temperature). Narrative distinguishes immediate stored energy from generation.
4. **Thermal regulator:** `Run heater` (+13 temperature, -10 energy), `Insulate habitat` (+9 temperature, -5 energy), `Reduce unused modules` (+6 temperature, +7 energy, -4 food).
5. **Optional wiring minigame:** connect three pre-drawn node buttons in the correct order; non-essential fallback is a simple decision card.

**Mission Brief highlights:** one decision's effects on multiple systems; solar panels can be affected by Martian dust. [NASA-DUST]

### LEVEL 3 — OXYGEN EMERGENCY (Intermediate–Advanced)
**Story:** A pressure sensor reveals a slow air leak. PIP asks the player to diagnose the leak, stabilize oxygen and protect energy reserves while repairing a valve.

**Learning objectives:** (a) recognize a habitat air leak; (b) compare repair, stored oxygen and temporary conservation; (c) understand that maintaining air quality requires interconnected systems.

**Recommended base state:** Oxygen 58; Water 67; Food 67; Energy 64; Radiation Protection 75; Temperature Control 72.

**Sequence:**
1. **Leak detected:** scripted oxygen -18 and visible red pulse at habitat.
2. **Diagnostics:** walk to the highlighted oxygen/valve system and press `E`; select from 2–3 labeled inspection clues; always allow a hint.
3. **Immediate response:** `Isolate damaged section` (+8 oxygen, -8 energy, -6 temperature), `Use reserve oxygen` (+19 oxygen, -5 energy), `Reduce nonessential circulation` (+7 oxygen, +4 energy, -7 temperature). Include PIP note: conservation alone cannot permanently seal a leak.
4. **Repair route:** `Patch leak + test` (+15 oxygen, -11 energy), `Remote valve reset` (+8 oxygen, -5 energy), `Call maintenance rover` (+12 oxygen, -7 energy, -4 water).
5. **Verify seal:** interactive pressure indicator changes from Warning to Stable after completing the repair card; no actual engineering simulation.

**Mission Brief highlights:** what prevented further loss versus what replenished reserve; crew health is protected by monitoring and maintaining life support. [NASA-ECLSS]

### LEVEL 4 — MARS SURVIVAL CHALLENGE (Capstone)
**Story:** Three problems overlap: a power fluctuation, water-recycling slowdown, and a solar radiation alert. Nova must prioritize systems to keep the habitat stable and contact Earth.

**Learning objectives:** (a) understand cascading dependencies; (b) justify a prioritization strategy; (c) connect radiation shielding, power and thermal systems; (d) reflect on choices.

**Recommended base state:** Oxygen 66; Water 55; Food 63; Energy 52; Radiation Protection 52; Temperature Control 59.

**Sequence:**
1. **Combined alert:** energy -10, water -9, protection -12 (scripted fictional event values).
2. **Protect the crew:** `Activate stronger shield` (+22 radiationProtection, -14 energy), `Move crew to shelter` (+15 radiationProtection, -6 energy, -4 temperature), `Delay response` (-10 radiationProtection, +7 energy). Explicitly explain why waiting raises risk.
3. **Water prioritization:** `Prioritize recycler` (+16 water, -12 energy), `Conserve water for crew` (+8 water, -6 food), `Optimize systems` (+10 water, -7 energy, -3 food).
4. **Energy conflict:** `Keep life support powered` (+11 oxygen, -11 energy), `Battery save mode` (+12 energy, -8 temperature), `Share power across systems` (+6 energy, +4 temperature, -4 food).
5. **Communications final decision:** `Send full report now` (-9 energy, +0 resources), `Compress and send report` (-4 energy, +0 resources), `Stabilize systems first` (+6 energy, -3 water then send). Result comes from a completed report, not a win/lose banner.
6. **Optional advanced challenge:** one extra randomized *authored* event variant (water or heating), only when core loop is stable.

**Mission Brief highlights:** present a timeline of consequences; optional `What would you do differently?` reflection; NASA radiation hazards and life-support trade-offs. [NASA-RADIATION], [NASA-ECLSS]

## 7. Level timing and truthful duration claim
| Level | Designed target | Minimum core path | Additional content to reach target |
|---|---:|---|---|
| First Day on Mars | 12–15 min | ~4–7 min | guided exploration, optional checks, reflection |
| Power Crisis | 14–17 min | ~5–7 min | wiring task, extra two scenario variants |
| Oxygen Emergency | 14–18 min | ~5–8 min | diagnosis clue hunt and repair verification |
| Mars Survival Challenge | 18–22 min | ~6–10 min | scenario variations and strategy retry |
| **Whole game** | **58–72 min design target** | **~20–32 min rough core path** | optional authored content + player pacing |

**DO NOT claim 60 minutes guaranteed.** The target is a design goal requiring real child playtests. In a 24-hour build, completing coherent core paths comes first. Replays should be genuinely different, not forced waiting or duplicated filler.

## 8. Mission Brief instead of binary win/lose
Always open `MissionBrief` after a level ends. Show:
1. Mission title + friendly completion status (`Mission Reviewed`, `Crew Stabilized`, or `Support Needed`) without shaming language.
2. Resources **before and after** the level, preferably with deltas.
3. Chronological decisions and the specific resource trade-offs.
4. A 1–3 sentence explanation of consequences.
5. Two or three `What science says` cards with direct NASA URLs; clearly label game values as simulations.
6. One constructive `Try this next time` suggestion and a `Next Level` or `Retry` button.
7. Optional score for planning / learning, but never a violence-based score or punitive failure presentation.

**If any required resource reaches 0:** trigger a `Stabilization Protocol` summary (`Our support team helped secure the base. Let's review how we could respond earlier.`), offer to retry the last checkpoint and keep the educational feedback. This is not a game-over death scene.

## 9. Art direction and implementation economy
- **Visual vocabulary:** cozy low-poly, chunky shapes, clean isometric view; red/orange ground, navy sky, blue glass, warm white modules, cyan interactive glow, yellow achievement accents.
- **Provided UI palette:** Royal Blue `#28558B`, Space Navy `#11184E`, Rocket Orange `#FF913D`, Star Yellow `#FFD34E`, Cosmic White `#F4F5FF`, Sky Blue `#55BDEB`.
- **One reusable stage/controller, four appearances:** terrain, habitat, solar, water, greenhouse, oxygen and communications plus the selected astronaut. All levels/avatars reuse layout, controller, collision, interactables and follow camera. Verified GLBs are optional inputs; distinct procedural fallbacks are mandatory.
- **MVP assets:** use primitive mesh spheres, cones, boxes, cylinders with materials. NO external 3D model downloads required for completion.
- **Scene states:** `normal`, `dust`, `oxygen_alert`, `radiation_alert`, `restored` change light colors and simple particles only; avoid expensive postprocessing.
- **Nonviolent:** no guns, enemies, blood, injury animations or scary jump scares.

## 10. Accessibility and safety
- No real-time pressure. `Continue` controls pacing; player can inspect implications before choosing.
- All crucial icons have labels; keyboard focus visible; motion kept subtle; no flashing alarm strobe.
- At least 44px interactive targets; small-screen layout stacks information rather than shrinking all text.
- Define NASA citations in Science Sources; no unreviewed claims or invented NASA endorsements.
- Do not collect or store identifying information from children. This build is anonymous and local-first; no login or analytics needed.

## 11. Content production priorities
**P0:** 4 level IDs, 3 major decisions per level, shared six-resource system, Mission Brief, React UI, small 3D base.  
**P1:** a fourth event per level, richer PIP dialogue, status animation, 2 clickable landmarks per level.  
**P2:** astronaut animation, advanced mini-games, voice-over, fully modeled Mars landscape, live NASA API feeds. Do not start P2 during first half of sprint.

## 12. What is NOT included in this hackathon build
Backend, accounts, third-party tracking, real-time NASA weather endpoints, complex robot AI, open-world exploration, precise physical simulation, unrestricted multiplayer, extensive cutscenes, procedural world generation, offline installation/PWA, high-poly avatars or more than one 3D world.

## 13. Final demo narrative (~3 minutes)
1. Home → Mission Library → First Day on Mars.
2. Show the 3D base and six resource bars (highlight the four basics).
3. Demonstrate one decision and the cross-resource effect.
4. Jump to Power Crisis and show dust-storm warning and trade-offs.
5. Jump to an Oxygen Emergency decision to show consequence messaging.
6. Open the Mars Survival Challenge Mission Brief showing before/after resources and a verified NASA source.
7. Explain that the same data-driven engine powers all four levels and that no harmful content or sign-up is required.

**Scientific sources and citation IDs are in `07_SCIENCE_AND_CONTENT_SOURCES.md`.**


---

# TECHNICAL ARCHITECTURE & TEAM INTERFACE CONTRACTS
**This is the shared implementation contract. All three teammates and all AI coding agents must follow it.**

## 1. Observed repository foundation
Repo: `Renad-Hazem/junior-astronaut-mission-trainer`, branch `main` at audit time (13 Nov 2026). Existing: Vite, React 19, TypeScript, Three.js, `@react-three/fiber`, `@react-three/drei`, Zustand and ESLint. `src/App.tsx` is still the stock Vite starter. No existing scene, game engine or routing code was observed. The package has scripts `npm run dev`, `npm run build`, `npm run lint`, and `npm run preview`.

**Architecture decision for 24 hours:** no React Router dependency. Keep page routing in one React `App.tsx` driven by a typed screen field in Zustand. No database, API or authentication. No external assets required.

## 2. File ownership & conflict prevention
| Domain | Owner | Allowed paths | Reserved/shared paths |
|---|---|---|---|
| 3D world and build/integration | **Renad** | `src/scene/**`, `public/models/**` (optional), `docs/integration/**` | `package.json`, `vite.config.ts`, `index.html` ONLY after team approval |
| Data model, pure game logic, missions, science | **Malak** | `src/game/**`, `src/data/**`, `src/science/**`, `src/game/**/*.test.ts` | `src/game/types.ts` is the contract; proposed changes require approval |
| React pages, HUD, styling and App composition | **Mohamed** | `src/pages/**`, `src/components/ui/**`, `src/styles/**`, `src/App.tsx`, `src/index.css` | imports and routes stay consistent with defined store and scene APIs |

**After initial 12h merge:** Renad may resolve integration-level conflicts in agreed shared paths but must inform the owner first. Every teammate uses a separate branch and a PR; no one asks an AI agent to rewrite entire project directories.

## 3. Proposed directory layout
```text
src/
  App.tsx                          # Mohamed: app-level screen composition
  index.css                        # Mohamed: reset/design tokens
  scene/                           # Renad
    MarsScene.tsx
    MarsTerrain.tsx
    MarsBase.tsx
    MarsLandmarks.tsx
    SceneHotspot.tsx
    sceneTypes.ts
  game/                            # Malak
    types.ts
    resourceEngine.ts
    gameStore.ts
    reportBuilder.ts
  data/                            # Malak
    levels.ts
    scienceFacts.ts
  science/                         # Malak
    factIndex.ts
  pages/                           # Mohamed
    HomePage.tsx
    MissionLibraryPage.tsx
    GameplayPage.tsx
    MissionBriefPage.tsx
  components/ui/                   # Mohamed
    ResourceBar.tsx
    ResourceDashboard.tsx
    MissionHeader.tsx
    AlertCard.tsx
    DecisionPanel.tsx
    ReportTimeline.tsx
  styles/                          # Mohamed
    theme.css
    game.css
```

## 4. Shared TypeScript model (source of truth: `src/game/types.ts`)
```ts
export type ResourceKey =
  | 'oxygen' | 'water' | 'food' | 'energy'
  | 'radiationProtection' | 'temperature';
export type Resources = Record<ResourceKey, number>;
export type LevelId =
  | 'first-day-on-mars' | 'power-crisis'
  | 'oxygen-emergency' | 'mars-survival-challenge';
export type ScreenId = 'home' | 'library' | 'gameplay' | 'brief';
export type SceneStatus = 'normal' | 'dust' | 'oxygen_alert'
  | 'radiation_alert' | 'restored';
export type HotspotId = 'habitat' | 'solar' | 'oxygen'
  | 'water' | 'greenhouse' | 'communications' | 'rover';
export type ResourceDelta = Partial<Resources>;

export interface DecisionOption {
  id: string;
  label: string;
  preview: string; // explain likely trade-off before click
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
  openingEffects?: ResourceDelta; // apply only once on first decision
  options: DecisionOption[]; // 2 to 3 for MVP
}
export interface MissionLevel {
  id: LevelId;
  order: number;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objective: string;
  storyIntro: string;
  initialResources: Resources;
  events: MissionEvent[];
  estimatedMinutes: [number, number]; // target estimate, not guaranteed
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
  status: 'reviewed' | 'stabilized';
  scienceFactIds: string[];
  suggestion: string;
}
export interface ScienceFact {
  id: string;
  title: string;
  childFriendlyText: string;
  advancedText: string;
  sourceTitle: string;
  sourceUrl: string; // direct verified NASA article URL
}
```

**Type contract is frozen at sprint H+2.** Additive optional fields need an announced PR and a coordinated update. Keep spelling/casing exactly as written. `temperature` is a *0–100 thermal-control index*, NOT °C. Each resource stays an integer between 0 and 100. No new resource keys.

## 5. Game state public API (Malak implements; everyone else consumes)
```ts
export interface GameStore {
  screen: ScreenId;
  activeLevelId: LevelId | null;
  eventIndex: number;
  resources: Resources;
  initialResources: Resources;
  decisionHistory: DecisionRecord[];
  lastDecision: DecisionRecord | null;
  isAwaitingContinue: boolean;
  currentReport: MissionReport | null;
  selectLevel: (id: LevelId) => void;
  chooseOption: (optionId: string) => void;
  continueMission: () => void;
  returnToLibrary: () => void;
  restartLevel: () => void;
}
export const useGameStore: UseBoundStore<StoreApi<GameStore>>;
```

**Required behavior:** `selectLevel(id)` sets `screen='gameplay'`, resets level resources and event index, loads its data. `chooseOption(id)` is idempotent while `isAwaitingContinue` and applies the current event's opening effect plus chosen option exactly once, clamps all resources and stores a `DecisionRecord`. `continueMission()` advances to the next event, OR builds a Mission Brief and sets `screen='brief'` after final decision. `returnToLibrary()` navigates to library. `restartLevel()` resets that level. Do not auto-advance while the player reads consequences.

**Simplify if necessary:** exact TS import for `UseBoundStore` / `StoreApi` comes from Zustand. Do not make runtime logic depend on TS-only type imports.

## 6. Pure resource engine
```ts
export function applyEffects(base: Resources, ...deltas: ResourceDelta[]): Resources;
// For each of six keys: clamp(round(previous + sum(deltas)), 0, 100)
export function getResourceHealth(value: number):
  'healthy' | 'caution' | 'critical';
// 60–100 / 30–59 / 0–29
```

Rules: no mutation of input objects; no NaN; support absent keys as delta zero; never let the state drift beyond bounds; optional `normalizeResources()` rejects non-finite input. The event's `openingEffects` is applied **once** only in the `chooseOption` transition for an unresolved current event, not on every render.

## 7. 3D scene public API (Renad implements; Mohamed imports)
```tsx
import type { HotspotId, SceneStatus, LevelId } from '../game/types';
export interface MarsSceneProps {
  levelId: LevelId;
  status: SceneStatus;
  highlightedHotspot?: HotspotId;
  onInspect?: (hotspotId: HotspotId) => void;
  reducedMotion?: boolean;
}
export default function MarsScene(props: MarsSceneProps): JSX.Element;
```

Implementation notes: React 19/TS sometimes does not expose the global `JSX` namespace; prefer return inference or `React.JSX.Element` if needed. No local game logic in the Canvas. Scene MUST NOT import Zustand directly; it receives props. Use Canvas, ambient/directional light, `OrthographicCamera` (Drei) or R3F orthographic camera, primitive meshes for 7 named hotspots. `onInspect` is optional, so the UI works even if 3D interaction is temporarily missing. Scene status changes are visual only.

**Interaction contract:** Renad's scene owns delta-time WASD/arrow movement, isometric follow camera, map bounds/basic collision, proximity/highlight state and `E` handling. Pressing `E` near the relevant system calls the existing `onInspect(hotspotId)` exactly once. Mohamed's UI reveals the matching event, calls `chooseOption(optionId)` once, shows the consequence and waits for `continueMission()`. The UI always contains an accessible `Inspect System` fallback; WebGL/input failure must not block completion. No public API name changes are introduced.

## 8. Mohamed screen composition contract
- `HomePage`: title, short game premise, CTA to library.
- `MissionLibraryPage`: 4 level cards, order and difficulty, CTA triggers `selectLevel`.
- `GameplayPage`: left/center 3D scene (Renad component), resource panel, event card with decision options, PIP consequences, explicit `Continue` button.
- `MissionBriefPage`: initial/final bars, decision timeline, at least 1 fact from `scienceFacts`, constructive suggestion, `Next Level` or `Replay`.
- `App.tsx` chooses page from `useGameStore(s => s.screen)`; avoid competing page state.

No direct state mutation in UI; only store actions. No duplicated resource calculation.

## 9. Science fact contract
`src/data/scienceFacts.ts` exports `scienceFacts: Record<string, ScienceFact>` (or a typed equivalent). Every decision's `scienceFactIds` must resolve to a real fact entry, and each fact must have an actual official source URL. No fake NASA API connection. Display factual education as sourced copy but resource effects as fictional game balancing.

## 10. Event payload example
```ts
const dustEvent: MissionEvent = {
  id: 'power-dust-alert',
  headline: 'Dust Storm Incoming!',
  prompt: 'The solar array is producing less electricity. Which systems should receive power first?',
  sceneStatus: 'dust',
  hotspotId: 'solar',
  openingEffects: { energy: -18, temperature: -6 },
  options: [
    {
      id: 'prioritize-life-support',
      label: 'Keep life support running',
      preview: 'Protect oxygen; use additional battery power',
      effects: { oxygen: +9, energy: -9, food: -5 },
      consequence: 'Air systems remain supported, but the greenhouse runs on reduced power.',
      scienceFactIds: ['NASA-DUST', 'NASA-ECLSS'],
    },
    {
      id: 'balanced-mode',
      label: 'Switch to balanced mode',
      preview: 'Save energy but slow food systems',
      effects: { energy: +11, food: -5, temperature: -5 },
      consequence: 'The base saves electricity, while growing and heating systems work less.',
      scienceFactIds: ['NASA-DUST'],
    },
  ],
};
```

**`+9` or `-18` means fictional game points**, not actual oxygen or energy units. The user should not see raw numerical forecasts without explanation; make choices predictable without making all correct answers obvious.

## 11. Integration smoke test contract
1. Import `MarsScene` and `useGameStore` without TypeScript errors.
2. `npm run build` exits zero.
3. Open Home → choose Level 1 → see six bars and 3D stage.
4. Pick option; one and only one `DecisionRecord` is added. Bar changes exactly once; consequence text displays.
5. `Continue` advances event, ending with `Mission Brief` after last event.
6. Repeat with Levels 2, 3 and 4; no blank page.
7. Resource values remain between 0 and 100.
8. In a narrow viewport, cards and choices remain usable; scene can shrink or collapse without trapping user.
9. Scene fallback is available if WebGL is unsupported; game decisions remain usable.

## 12. Automated verification
Keep existing `npm run build` and `npm run lint`. If dependencies are already available, add only **pure TypeScript tests** using a lightweight runner if the team agrees; otherwise test resource functions with temporary Node scripts and document exact manual results. Avoid adding entire testing frameworks during integration hour unless necessary.

Suggested test matrix: clamping 0/100; duplicate choice no double debit; event opening applied once; every event has 2+ unique option IDs; every science fact ID resolves; full four-level completion; nonviolent content.

## 13. Branch and PR rules
`feature/renad-3d`, `feature/malak-game-engine`, `feature/mohamed-ui`. Merge small PRs early; communicate API changes explicitly. PR must state: changed files, screenshot/video, build status, manual flow tested, known blockers. A single integrator (Renad) owns `main` merge coordination, not unilateral editing of coworkers' work. During high-risk final hours, freeze nonessential changes.

## 14. Dependency handoff schedule
- **H+1:** everyone reads this contract; Malak provides `types.ts` definition or the team copies the approved contract stub into `main`.
- **H+2:** frozen types and first `levels.ts` fixture merged; parallel development begins.
- **H+5:** Renad's `MarsScene` accepts test props; Mohamed's page imports stub while Malak implements full state.
- **H+8:** first end-to-end Level 1 complete.
- **H+12:** all four levels have authored events; 3D and UI integrated.
- **H+16:** final four-level smoke test and content/science copy review.
- **H+20:** release candidate lock; fixes only.
- **H+24:** demo script + publicly shareable build if deployment is available.


---

# 24-HOUR HACKATHON RUNBOOK — 3-PERSON TEAM
**Goal:** deliver a complete four-level browser MVP with one reusable Mars scene, meaningful resource trade-offs, and a Mission Brief for each level.

## 1. Reality check
Three people working a single 24-hour window cannot safely guarantee a truly polished, custom 60-minute 3D game. The achievable **P0** is four story chapters with data-driven decisions, a shared 3D base, accessible UI and educational debriefs. The **60–75 minute experience** is a design target requiring authored optional scenes, retry strategies and measured playtesting, not a guaranteed result. A 20–30 minute coherent demo is better than a 60-minute broken experience. Avoid sleep deprivation as a quality strategy: assign breaks and rotate QA.

## 2. Twelve 2-hour blocks
| Hours | Renad — 3D/Integration | Malak — Game/Science | Mohamed — UI | Gate |
|---|---|---|---|---|
| H0–H2 | Clone/build audit; agree files; setup scene skeleton | Commit frozen types; first 1–2 events | Home/design tokens; flow wireframe | `types.ts` contract approved |
| H2–H4 | Terrain/camera/base primitives | Resource engine and Zustand base | Library/resource bars | Parallel files compile |
| H4–H6 | Scene props, hotspots, alert states | Level 1 + first Mission Brief fixture | Gameplay screen + event options | Level 1 connected without 3D blockers |
| H6–H8 | First scene PR; integrate / inspect click | Level 2 Power Crisis | Mission Brief screen | **Level 1 complete end-to-end** |
| H8–H10 | Refine scene/performance | Level 3 Oxygen Emergency | Connect real Zustand actions | Three levels smoke-tested |
| H10–H12 | Integrate 3D in Gameplay | Level 4 Survival Challenge | Connect scene and facts | **Four-level core path** |
| H12–H14 | Fix conflicts/build | Balance/copy review; NASA fact URLs | Responsive mobile controls | Four levels start & finish |
| H14–H16 | Browser/performance checks | Science copy accuracy, test report | Mission Brief clarity, navigation | Release readiness check |
| H16–H18 | Deploy preview and smoke test | Data bug fixes only | Accessibility and missing states | Freeze new features |
| H18–H20 | Live demo rehearsal | Walk through all 4 levels | Visual polish limited to defects | Release candidate |
| H20–H22 | Final integration/build & fallback | Verify 4 reports & no invented facts | Final responsive pass | Code freeze |
| H22–H24 | Publish/check link, backup local demo | Prepare learning narration | Prepare user demo flow | Show working version |

Short breaks between blocks; swap testers frequently. Avoid leaving the first full integration until H20.

## 3. Dependency chain
`Malak: types.ts (H2)` → parallel `Malak: store + events`, `Renad: scene props`, `Mohamed: pages` → `Mohamed: App composition` → `Renad: integration / build / deploy` → `All: QA`.

**Hard rule:** every owner provides a minimal compileable stub before implementing their full feature, so another teammate is not blocked. If you cannot build all four levels by H12, cut scene complexity, not game loop completeness.

## 4. Scope cuts (highest to lowest priority)
P0 MUST: four avatar cards/appearances; safe Confirm/Change/persistence; one controller; Idle/Walk/Interact/Celebrate; four levels; shared map; WASD/arrows; normalized delta-time movement; follow camera; bounds/collision; proximity + `E`; decisions; six resources; consequences + Continue; Mission Brief per level; model/WebGL fallback; build/deploy.

P1 if stable: verified GLB polish, smoother blending, 4–5 decisions per level, stronger highlights, dust effects, touch controls, sound and optional explanations.

P2 only with time: advanced rigging, rover minigame, voice acting, custom assets, large-world exploration and complex cinematics.
NEVER in this sprint: NASA live APIs, accounts, backend, procedural 3D universe, complex combat, multiplayer, more than one scene environment.

## 5. Repo and branch commands
```bash
# Each participant starts independently
git clone https://github.com/Renad-Hazem/junior-astronaut-mission-trainer.git
cd junior-astronaut-mission-trainer
npm ci
npm run build

git fetch origin
git checkout main
git pull --ff-only origin main
# Use exactly ONE personal branch:
git checkout -b feature/renad-3d
# OR: git checkout -b feature/malak-game-engine
# OR: git checkout -b feature/mohamed-ui

# After completing owned changes:
git add <ONLY_YOUR_OWNED_FILES>
git commit -m "feat: implement <small feature>"
git push -u origin <YOUR_BRANCH>
# Open a Pull Request to main, request teammate review.
```

**Don't run all three branch commands.** Each person chooses one. Prefer several small commits and early PRs over one giant merge at the end. If `git checkout -b` fails because branch exists, fetch/switch to existing branch instead; don't reset others' work.

## 6. Merge protocol
- `main` is protected by agreement (GitHub branch protection if repository admins can enable it). No direct pushes.
- One reviewer per PR who is *not* its author, even in 24h. Only merge after `npm run build` passes and a screenshot/short description exists.
- If a PR changes `src/game/types.ts`, notify all three **before** merge.
- If a PR changes `src/App.tsx`, ask Mohamed to make the change rather than having another agent overwrite it.
- Malak releases types as a small first PR by H+2. Mohamed and Renad can build stubs against that contract.
- **No squash of another person's branch while someone is still basing work on its commit without telling them.** After each merge, everyone fetches/pulls main.
- Last 4 hours: critical fixes only. Never replace major architecture near deadline.

## 7. Definition of Done at three checkpoints
**H8 / next available vertical-slice gate:** choose Avatar 3, confirm, start Power Crisis, move to Solar, press `E`, show Interact, choose once, see resource/world feedback and Continue.
**H12:** four levels can be entered/completed; 3D scene loads; all source facts have real URLs.  
**H20:** no runtime crash, responsive, no duplicate choice effects, `npm run build` and `npm run lint` complete or documented pre-existing lint issues triaged.  
**H24:** shareable deployment or reliable locally runnable demo, backup video, known limitations visible.

## 8. Deployment
Vite builds a `dist/` folder with `npm run build`. Choose one static hosting provider already accessible to the team (e.g., Vercel, Netlify or GitHub Pages). For root-domain deployment, Vite's default base may suffice. For GitHub Pages under a subpath, set the correct `base` explicitly in `vite.config.ts` only with owner agreement. Never claim a deployment URL before it has been opened on another device. No secret key or NASA API key needed for MVP.

## 9. AI agent protocol
The first line of each agent prompt should specify the branch, owned folders and contract filename. Every agent must inspect `package.json`, `src/App.tsx`, repo tree, and existing modules before writing code. Prohibit changing unrelated files, inventing APIs, adding unnecessary dependencies, overwriting another agent's changes, or claiming tests are successful without executing them. Integrators should apply small patches, not replace whole files. Use the prompts inside each owner file.

## 10. Stand-up template (every ~3 hours)
- **Done:** what works visibly and link/commit.
- **Doing:** next smallest task.
- **Blocked:** exact import/type/error + teammate needed.
- **Merge:** PR number, review owner, build result.
- **Cut:** any P1/P2 feature at risk.

## 11. Emergency contingency
If WebGL is temporarily broken, retain the accessible decision fallback and static placeholder so learning is not blocked, but do not declare the playable P0 complete until movement and `E` interaction work in a supported browser. If the event engine is blocked, use one deterministic array of pre-authored events and a pure `applyEffects`; keep types. If deployment fails, show `npm run dev` locally and save a walkthrough recording. If NASA API is unavailable, **do not** use it; cite official text links from baked-in data.


---

# SCIENCE FACTS, COPY RULES & NASA SOURCE REFERENCES
**Version 1.0 | Official source-backed lesson cards for Mars Base: Mission Control**

## 1. Scientific integrity contract
This is a **fictional educational simulation**, not a certified Mars habitat simulator. Resource scores (0–100), event magnitudes, exact repair outcomes and Mars base characters are invented game mechanics. Real science facts should be drawn from the official NASA articles below; link to the original URLs in every related Mission Brief. NASA has not been stated to sponsor, validate or endorse the game.

Do not invent live API endpoints, claim real-time Mars weather data, or copy article text at length. Paraphrase each fact using original, child-friendly language. Add concise `Learn more at NASA` links.

## 2. Verified source index
| Fact ID | NASA source | Official URL | Lesson use |
|---|---|---|---|
| NASA-OXYGEN | Is There Oxygen on Mars? We Asked a NASA Technologist | https://www.nasa.gov/solar-system/is-there-oxygen-on-mars-we-asked-a-nasa-technologist-episode-7/ | Very little breathable oxygen available at Mars surface; oxygen production is a technology challenge |
| NASA-DUST | The Fact and Fiction of Martian Dust Storms | https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/ | Atmospheric dust and deposits can reduce solar energy |
| NASA-MARS-FACTS | Mars: Facts | https://science.nasa.gov/mars/facts/ | Thin atmosphere, carbon dioxide-rich air, cold and water ice |
| NASA-ECLSS | Environmental Control and Life Support Systems | https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/ | Air revitalization, water recovery and oxygen generation interact |
| NASA-RADIATION | Hazard: Space Radiation | https://www.nasa.gov/hrp/hazard-space-radiation/ | Energetic solar particles/cosmic radiation require human protection |
| NASA-MARS-ICE | Mars: Facts (water section) | https://science.nasa.gov/mars/facts/ | Mars has water ice, not freely available drinking water |
| NASA-SOL | Mars24 Technical Notes on Mars Solar Time | https://www.giss.nasa.gov/tools/mars24/help/notes.html | A Martian sol is about 24 h 39 min |
| NASA-HEAT | Temperatures Across Our Solar System | https://science.nasa.gov/solar-system/temperatures-across-our-solar-system/ | Mars is generally cold and has a thin atmosphere |
| NASA-SPACE-POWER | What Powers a Spacecraft? (NASA Space Place) | https://spaceplace.nasa.gov/what-powers-a-spacecraft/en/ | Solar panels produce less power when dusty |

**Citation IDs** in `01_GAME_DESIGN_DOCUMENT.md` correspond to this list. The implementation uses the exact official URLs, not internal web retrieval references.

## 3. Ready-to-use learning card text

### NASA-OXYGEN — Why do astronauts need oxygen systems?
**For children (7–10):** "Mars has an atmosphere, but it does not have enough oxygen for people to breathe. A space base needs special equipment to keep the air safe."  
**For older children (11–15):** "Mars has a very thin atmosphere dominated by carbon dioxide. Future habitats would need sealed air systems and oxygen generation, rather than relying on outside air."  
**Game connection:** choosing oxygen production can consume energy and water in the fictional resource model.  
**Caution:** Do not say Mars has *no* oxygen at all. NASA explains that there is a small amount.

### NASA-DUST — How can a dust storm affect power?
**For children:** "Dust can block some sunlight from reaching solar panels. Less sunlight can mean less electricity for a Mars base."  
**For older children:** "Airborne dust during storms and deposited dust on panels can reduce solar energy availability. Batteries and power priorities become important when generation falls."  
**Game connection:** the dust warning decreases the abstract Energy bar and players decide which systems to support.  
**Caution:** Martian dust storms should NOT be depicted as super-strong Earth-style winds blowing heavy habitats away. The key credible risk in this scenario is reduced solar availability.

### NASA-ECLSS — Why are water, air and power connected?
**For children:** "Space crews cannot simply open a tap or a window. Life-support machines clean air and recycle water so the crew has what it needs."  
**For older children:** "NASA life-support technology includes water recovery, air revitalization and oxygen generation. These subsystems require equipment, maintenance and electrical power."  
**Game connection:** water purification and air production help one resource while consuming other resources in abstract units.  
**Caution:** Do not imply that water recycling directly creates oxygen automatically; explain distinct air, water, and electrolysis systems.

### NASA-RADIATION — Why use protective shelter?
**For children:** "Some space radiation is invisible. Astronauts need protection, especially when the Sun sends energetic particles into space."  
**For older children:** "Outside much of Earth's protective environment, crews need to reduce radiation exposure from solar energetic particles and galactic cosmic rays. Monitoring, sheltering and spacecraft design matter."  
**Game connection:** `Radiation Protection` represents a fictional protection effectiveness index; it is not a real radiation dose or medical safety rating.  
**Caution:** Don't say simply pressing a button creates perfect protection. A shield-mode button is a teaching abstraction.

### NASA-MARS-ICE — Why manage water carefully?
**For children:** "Scientists have found water ice on Mars. Ice is useful, but a crew still needs a safe way to collect and clean water."  
**For older children:** "Water ice exists on Mars, but gathering, processing and purifying water would require engineering and power. Recycling helps reduce resupply needs."  
**Game connection:** water recovery can improve stored water but cost energy.

### NASA-HEAT — Why does the base need temperature control?
**For children:** "Mars is often very cold. A base needs temperature-control systems to keep the inside comfortable."  
**For older children:** "Mars' thin atmosphere allows significant temperature changes. Controlled habitats depend on insulation, heaters and monitoring."  
**Game connection:** `Temperature Control 70/100` means a *fictional stable-habitat score*, not 70°C.

### NASA-SOL — What is a Martian day?
**For children:** "A day on Mars is a little longer than a day on Earth."  
**For older children:** "A Martian solar day, called a sol, lasts about 24 hours and 39 minutes. Scientists use 'sol' when talking about activity on Mars."  
**Game connection:** the first level is one fictional shift on the crew's first sol.

## 4. Suggested fact placement by level
**Level 1:** NASA-OXYGEN, NASA-ECLSS, NASA-SOL, NASA-MARS-FACTS.  
**Level 2:** NASA-DUST, NASA-SPACE-POWER, NASA-HEAT.  
**Level 3:** NASA-OXYGEN, NASA-ECLSS.  
**Level 4:** NASA-RADIATION, NASA-ECLSS, NASA-DUST, NASA-MARS-ICE.

## 5. Words to use and avoid
Use: `Mission Brief`, `Crew Stabilized`, `Let's try a new strategy`, `What changed?`, `Science behind this choice`, `Protected systems`.  
Avoid: `You died`, `You failed`, `Kill the enemy`, `NASA's real-time measurements` unless actually and lawfully integrated, `This Mars base is exactly how NASA builds them`, `The optimal decision is always ...`.

## 6. Authored content data model and review
Every displayed educational fact must have `id`, short original text, age-extension text and direct `sourceUrl`. Every gameplay choice includes a science fact ID from this file. During content QA, Malak checks that no fact makes an ungrounded precise numerical claim about Martian conditions. Keep the source links in the product and documentation. Before publish, open the URLs and ensure links work.

## 7. Provenance and licensing note
Official NASA web links are educational references. Credit NASA as the source of facts, not the builder of this game. Avoid using NASA logos, branded mission patches or NASA photography without checking usage guidance. The hackathon event or a NASA reference does not alone grant endorsement. Prefer original graphics and primitive geometry in the MVP.


---

# QUALITY ASSURANCE, RELEASE GATES & DEMO SCRIPT

## 1. Four-level acceptance matrix
| ID | Test | Expected behavior | Owner |
|---|---|---|---|
| QA-001 | Open site (desktop) | Home renders, no blank screen | Mohamed + Renad |
| QA-002 | Open Mission Library | Exactly four Mars missions visible in intended order | Mohamed |
| QA-003 | Start L1 | All six resources rendered; four essential bars explained | Malak + Mohamed |
| QA-004 | Choose L1 oxygen option | Oxygen increases and relevant other resource(s) decrease as authored; consequence shown | Malak |
| QA-005 | Double-click option rapidly | Effects applied only once | Malak |
| QA-006 | Press Continue | Moves one event forward; no skipped steps | Malak + Mohamed |
| QA-007 | Finish L1 | Mission Brief with before/after resources and NASA fact | Mohamed + Malak |
| QA-008 | Play L2 dust event | Energy impact shown once and scene visibly changes | Renad + Malak |
| QA-009 | Play L3 oxygen leak | Leak solution choices differ; non-punitive feedback | Malak |
| QA-010 | Finish L4 | Combined resource report and supportive completion | Malak + Mohamed |
| QA-011 | Force oxygen/resource to 0 | Stabilization Protocol and replay; no death scene | Malak |
| QA-012 | Resource near 100 or 0 | Values clamp to 0–100 | Malak |
| QA-013 | Click scene hotspot | Correct panel opens; a non-3D fallback remains | Renad + Mohamed |
| QA-014 | Narrow browser 360px | Buttons remain visible and tappable, bars readable | Mohamed |
| QA-015 | Keyboard-only navigation | Can choose decision, continue, access brief without 3D click | Mohamed |
| QA-016 | Browser without working WebGL | Educational game still playable with fallback panel | Renad + Mohamed |
| QA-017 | `npm run build` | TypeScript & Vite build exits 0 | Renad |
| QA-018 | `npm run lint` | No new lint errors (or existing ones documented explicitly) | All |
| QA-019 | Science links | Every linked NASA URL is official, no fake live data | Malak |
| QA-020 | Full playthrough | Four levels finish without forced waiting / unhandled exception | All |
| QA-021 | WASD + arrow movement | Both key sets move astronaut correctly on X/Z; Y stays height | Renad |
| QA-022 | Straight vs diagonal movement | Normalized diagonal travel is not faster than straight travel | Renad |
| QA-023 | Low/high frame-rate movement | Delta-time movement covers approximately equal distance | Renad |
| QA-024 | Camera follow | Isometric camera follows smoothly and keeps astronaut readable | Renad |
| QA-025 | Map edges/landmarks | Astronaut cannot leave bounds or pass through major systems | Renad |
| QA-026 | Approach active system | Correct highlight and nearby `Press E` prompt appear | Renad + Mohamed |
| QA-027 | Press `E` near active system | Correct `hotspotId` opens the matching decision panel | All |
| QA-028 | Repeat/hold `E` | No duplicate inspection, choice or resource effects | Renad + Mohamed + Malak |
| QA-029 | Choose and Continue | Effects apply once; consequence remains; Continue advances one objective | Malak + Mohamed |
| QA-030 | Four physical playthroughs | Same map/controller supports all four levels and real-history briefs | All |
| QA-031 | WebGL failure | Accessible Inspect System path completes the educational flow | Mohamed + Renad |
| QA-032 | Build/lint/full session | Commands pass and complete game flow has no crash/stuck transition | All |
| QA-037 | Avatar selection | Exactly four accessible cards, Confirm, Change and textual selection state work | Mohamed |
| QA-038 | Persistence/fallback | Valid selection persists; invalid/blocked storage safely defaults | Mohamed |
| QA-039 | Four scene appearances | Correct verified model or distinct fallback renders without crashing | Renad |
| QA-040 | Equal controller | All avatars share speed, collision, camera, radius and outcomes | Renad + Malak |
| QA-041 | P0 animation states | Idle/Walk/Interact/Celebrate are distinct, transition and do not stick | Renad |
| QA-042 | GLB audit/fallback | Real names/rights/clips are recorded; missing/corrupt/clip-less assets fall back | Renad |
| QA-043 | Modal input guard | Movement and repeated `E` are suppressed while decision controls own focus | Mohamed + Renad |
| QA-044 | Avatar-neutral mission | Resources, decisions, report and scoring remain identical across choices | All |
| QA-045 | Complete avatar/level matrix | Every avatar completes a mission; one avatar completes all four levels | All |

## 2. Quick smoke test for every merge (3–5 minutes)
Choose Avatar 3 → confirm → start Power Crisis → move with WASD/arrows → approach Solar → press `E` → see Interact → choose once → confirm one resource/world change → Continue → observe Celebrate → Mission Brief → Change Avatar → verify another appearance → run build/lint.

Avatar mapping, Idle/Walk/Interact/Celebrate, movement feel, diagonal speed, camera, collision, proximity, `E` debouncing, focus suppression, GLB/WebGL fallbacks and continuous play require manual browser verification. Record browser/version, viewport, selected avatar/model-or-fallback path and evidence; build output alone cannot prove these behaviors. The full matrix remains authoritative in `08_QA_AND_DEMO.md`.

## 3. Child-suitable UX review
- Does each instruction tell the player *why* an action matters?
- Is every resource named as well as colored?
- Do choices preview trade-offs without revealing a simplistic 'correct answer'?
- Is difficulty gentle for 7–10 year olds and expandable for older players?
- Does the brief report learning and explanations rather than punish mistakes?
- Is there enough contrast to read text on the scene?
- No gore, injury effects, death scenes, jump scares or hostile combat.

## 4. Timing validation
Design target is **58–72 min** across four levels. Core authored decision-only path is probably **much shorter**; do not misrepresent that. Have at least two testers play without developer narration and time each mission from selection to Mission Brief. Record actual total, optional content used, confusion and skipped sections. If the average is 25 min, describe the version as `a 25-minute playable MVP with an expanded 60-minute design target`, not a 60-minute game.

| Tester | Age band | L1 | L2 | L3 | L4 | Total | Notes |
|---|---|---|---|---|---|---|---|
| Test A | 7–10 (if available) | — | — | — | — | — | — |
| Test B | 11–15 (if available) | — | — | — | — | — | — |
| Adult fallback | Adult | — | — | — | — | — | — |

## 5. Three-minute judging/demo pitch
**0:00–0:25:** "We built a nonviolent Mars-base mission trainer for children aged 7–15. Instead of memorizing facts, children see how science choices affect a crew."  
**0:25–0:55:** Choose Avatar 3, confirm, enter the shared 3D Aster Base and reveal six interconnected resources.

**0:55–1:35:** Walk to the Power Crisis solar array, press `E`, solve one choice and show why saving energy changes other systems.
**1:35–2:10:** Open Oxygen Emergency, discuss reserve-vs-repair trade-off.  
**2:10–2:45:** Show Mission Brief: decisions, deltas, reflection, link to NASA science.  
**2:45–3:00:** Point to four-level progression and shared React/R3F/Zustand architecture. State actual playtime only if tested.

## 6. Release checklist
- [ ] All 4 levels exist and are accessible
- [ ] Each level has 3+ meaningful authored events
- [ ] 3D scene loads with low complexity
- [ ] Four avatar cards, Confirm, Change and safe persistence work
- [ ] Four distinct appearances/fallbacks share identical gameplay parameters
- [ ] Idle/Walk/Interact/Celebrate work without blocking on missing clips
- [ ] WASD/arrows, normalized diagonal movement, follow camera and map bounds work
- [ ] Proximity highlight/prompt and `E` interaction target the current event hotspot
- [ ] Repeated `E`/choice input never duplicates resource changes
- [ ] At least 1 Mission Brief per level
- [ ] No broken NASA links and no live-data claims
- [ ] `npm run build` passes on current main
- [ ] Mobile + desktop smoke tests recorded
- [ ] No internal/private tokens exposed in build
- [ ] Demo link checked in external browser, or local fallback ready
- [ ] Known limits documented and communicated to judges
