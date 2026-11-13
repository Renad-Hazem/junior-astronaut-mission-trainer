# GAME DESIGN DOCUMENT — MARS BASE: MISSION CONTROL
**Version 1.0 | English | 13 November 2026 | High-stakes 24-hour hackathon MVP**

## 1. High concept
**Tagline:** *Small choices. Big discoveries. Keep the crew safe on Mars.*

A colorful, gentle, 3D educational management-adventure for ages 7–15. The player becomes **Cadet Nova**, the rookie Mission Controller of **Aster Base**, a tiny science outpost on Mars. An empathetic assistant robot called **PIP** explains the habitat systems and presents incoming alerts. The player investigates equipment, distributes limited resources, and learns why one decision affects other life-support systems. There is no violence, death animation, or enemy to fight. Challenges come from the Martian environment and engineering trade-offs.

Before mission entry, the player chooses one of four visually distinct astronaut appearances. Avatar choice is cosmetic and inclusive: all four share identical speed, collision, interaction range, capabilities, resource rules and outcomes. The story may continue to address the player as Cadet Nova regardless of the selected appearance unless the team later approves display-name personalization.

**Core promise:** A mission should feel like solving an adventure in a living space station, **not** completing a science multiple-choice test.

## 2. Audience and age design
- **Ages 7–10:** short sentences, icon + text for every resource, read-aloud-friendly instructions, no time pressure, 2–3 decisions per event, guided hints, forgiving recovery.
- **Ages 11–15:** optional `Why?` scientific expansion panels, nuanced trade-offs, optional advanced objectives and a more detailed Mission Brief.
- **Common baseline:** keyboard/mouse + touch-compatible clickable buttons; visually identifiable targets; large buttons; high contrast; avoid relying on color alone; motion reduced where possible.
- **Scientific honesty:** All in-game resources are made-up normalized values for teaching cause and effect. Facts sourced separately from official NASA material. Never call game percentages actual NASA measurements.

## 3. Narrative structure
**Setting:** A fictional future Mars base near a safe exploration zone. The crew are off-screen; mission control displays their welfare without depicting distress. The red-orange terrain has small boulders, a greenhouse, solar array, oxygen station, water recycler, communication dish, and central habitat. Isometric camera helps players understand where systems are located. Each completed stage changes a few lights, alert icons, or props in the **same scene**.

**Characters**
- **Player astronaut:** one of four selectable appearances rendered through one reusable controller. Use verified supplied models if available; otherwise use four distinct low-poly silhouettes. No appearance has gameplay advantages.
- **PIP:** cheerful robot advisor in text panels, never scolds the player.
- **Crew:** represented by a status card; do not model detailed humans in 24 hours.

**Opening scene (30–45 seconds, skippable):**
> PIP: "Welcome to Aster Base, Cadet! Mars is amazing, but our crew needs careful planning. Oxygen, water, food and power all work together. Ready for your first shift?"

**Closing scene:**
> PIP: "You protected Aster Base through four difficult missions. Every resource connects to another — that's what makes teamwork and science so important. Let's send your Mission Brief to Earth!"

## 4. Core player loop
The 3D scene is playable exploration space, not a decorative background for a React dashboard. Every level reuses the same Mars map and character controller while the selected appearance persists and mission data changes the objective, highlighted system, alert state and decisions.

1. **Choose and confirm astronaut:** Select one of four cosmetic appearances before mission entry; Change Avatar remains available from the library.
2. **Enter Mars Base:** Load the shared low-poly Aster Base map with the selected appearance.
3. **Receive objective:** PIP and the UI identify the current mission goal and relevant system.
4. **Control astronaut:** Move on the X/Z ground plane with WASD or arrow keys; Y remains height.
5. **Explore relevant area:** Walk through the readable isometric layout toward the objective.
6. **Approach a system:** Proximity detection highlights the relevant base system and shows an interaction prompt.
7. **Press `E` to interact:** The scene reports the system through the existing `onInspect(hotspotId)` callback. An accessible Inspect System UI control provides the same path when 3D/keyboard interaction is unavailable.
8. **Inspect the problem:** PIP explains the equipment state and why it matters.
9. **Choose a response:** Pick one of 2–3 responses with visible *expected trade-off hints*.
10. **Observe consequences:** Resource bars and equipment state update once; the astronaut gives readable interaction feedback.
11. **Continue:** Read the explanation, then explicitly continue to the next objective; never auto-skip feedback.
12. **Finish and celebrate:** Complete the authored objectives and show a short friendly celebration before the brief.
13. **Read Mission Brief:** Review the decision trail, resource outcomes, suggestions and NASA-linked science.

Movement is smooth and frame-rate independent through delta time. The isometric camera follows Nova without making the player steer the camera. Basic map boundaries/collision keep the astronaut on the playable ground and outside landmark geometry. There is no randomized instant death or combat. Choices matter but should not make the experience irreversibly unwinnable. If a critical resource is exhausted, invoke a **Stabilization Protocol** and allow a checkpoint retry with an explanation.

### Required character feedback (P0)
- **Idle:** subtle breathing, sway or helmet/body bob.
- **Walk:** visible locomotion, direction-facing and immediate stop when input ends.
- **Interact:** short reach, point, lean or equivalent pose when equipment opens.
- **Celebrate:** gentle success gesture after mission completion.

Use embedded GLB clips only after inspecting their real names and content. Procedural group/limb motion is the P0 fallback. Respect reduced-motion preferences while retaining clear pose and text feedback.

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
- **One reusable stage:** terrain plane, habitat dome, solar array, water recycler, greenhouse, oxygen control, communication dish; ambient light, directional light and stars. The six mission systems map to the existing hotspot IDs and remain in consistent locations across all four levels.
- **Four appearances, one controller:** four selectable, visually distinct astronauts share readable forward direction, delta-time WASD/arrow movement, X/Z travel, map boundaries, collision and one isometric follow camera. Basic Idle/Walk/Interact/Celebrate feedback is required; advanced rigs and cinematic animation are optional.
- **Physical interaction:** the player must approach the relevant system, see a nearby prompt and press `E`. Direct pointer inspection and the accessible UI fallback may also invoke the same interaction callback.
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
