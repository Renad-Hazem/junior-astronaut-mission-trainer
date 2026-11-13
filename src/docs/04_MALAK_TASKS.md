# MALAK — GAME LOGIC, FOUR LEVELS & SCIENCE CONTENT
**Branch:** `feature/malak-game-engine`  
**Primary paths:** `src/game/**`, `src/data/**`, `src/science/**`  
**Read first:** `01_GAME_DESIGN_DOCUMENT.md`, `02_TECHNICAL_CONTRACTS.md`, `07_SCIENCE_AND_CONTENT_SOURCES.md`.

## Your mission
Create **one deterministic, reusable, well-typed decision engine** that powers all four Mars missions. This is the source of truth for six resources, decisions, scientific explanations, event sequencing and Mission Brief results. The UI and 3D scene must work without inventing their own game logic.

## Definition of done
- Expose the frozen TypeScript interfaces in `src/game/types.ts` exactly as agreed.
- Implement `applyEffects` clamping 0–100 for all six resources, without mutating inputs.
- Implement Zustand `useGameStore` actions from shared contract with safe, idempotent transitions.
- Provide **four `MissionLevel` objects** with **at least 3 fully authored decision events each** (target 4–5 when time allows). Every choice has a resource delta, narrative consequence and science fact IDs.
- Ensure `Mission Brief` includes pre-level resources, final resources, choice history, source fact IDs and learning suggestion.
- Science copy uses official source URLs, never fabricated endpoints/real-time NASA claims.
- If critical resources fall to 0, offer compassionate `Crew Stabilization` debrief with replay route; no violent animation or punitive game over.

## Priority task board

| ID | Priority | Description | Owned files | Dependencies | Acceptance criteria | Integration handoff |
|---|---|---|---|---|---|---|
| MAL-01 | P0 | Define and freeze the shared types without renaming existing interfaces. | `src/game/types.ts` | Technical contract approval | Existing resource, level, event, report and scene-related type names match the contract exactly. | Publish the type export path early to Mohamed and Renad; announce any additive proposal before coding it. |
| MAL-02 | P0 | Implement the pure resource engine, health ranges and single-application rules. | `src/game/**` | Frozen `Resources` and `ResourceDelta` | All six values clamp to 0–100; inputs are not mutated; opening/option effects apply once. | Give Mohamed expected before/after fixtures; Renad does not consume this engine. |
| MAL-03 | P0 | Implement Zustand selection, choice, continue, report and restart transitions. | `src/game/**` | Level records and report builder | Public actions remain `selectLevel`, `chooseOption`, `continueMission`, `returnToLibrary`, `restartLevel`; duplicate choices are idempotent. | Share the public store import with Mohamed; scene remains store-independent. |
| MAL-04 | P0 | Author First Day on Mars and Power Crisis with clear objectives and physical system targets. | `src/data/**`, `src/science/**` | Frozen `MissionEvent`/`HotspotId`; GDD | Every event has objective copy, 2–3 choices, consequence/science IDs and a `hotspotId` matching a real scene system. | Provide Renad a level/event → hotspot checklist and Mohamed readable objective/prompt text. |
| MAL-05 | P0 | Author Oxygen Emergency and Mars Survival Challenge using the same event/interaction model. | `src/data/**`, `src/science/**` | Same as MAL-04 | Four names stay exact; several systems are visited in L4; decisions use all six resources across the mission set. | Hand the complete hotspot sequence to Renad and UI fixtures to Mohamed. |
| MAL-06 | P0 | Generate a Mission Brief after every level with real history and verified sources. | `src/game/**`, `src/science/**`, `src/data/**` | Completed decision records and fact index | Report includes started/ended values, decisions, status, fact IDs and suggestion; stabilization is supportive. | Confirm `currentReport` shape and science lookup with Mohamed. |
| MAL-07 | P0 | Validate authored objectives, hotspot mappings, idempotence and all-four-level progression. | `src/game/**`, `src/data/**`, `src/science/**` | Renad's interactable ID list; Mohamed's integration smoke test | Every active event targets an implemented `HotspotId`; repeated `E`/choice input cannot duplicate a decision; Continue advances exactly once. | File exact mismatches against the owning branch rather than editing scene/UI files. |
| MAL-08 | P1 | Tune readability, resource balance and optional event variety from playtests. | `src/data/**`, `src/science/**`, `src/game/**` | Stable P0 integration and recorded playtests | Changes preserve deterministic outcomes, verified facts and completable four-level flow. | Send changed fixtures/deltas to both teammates before final regression. |

### Objective and hotspot authoring rule
Malak does not implement movement, collision, cameras or rendering. Each active `MissionEvent.hotspotId` tells the scene which system the astronaut must visit; `headline` and `prompt` tell the UI what objective/problem to show. The same IDs must be reused across all four missions. An event cannot apply effects merely because the astronaut approached a system: effects occur only when the player chooses an option through `chooseOption(optionId)`.

## Resource rules
- `Resources`: `oxygen`, `water`, `food`, `energy`, `radiationProtection`, `temperature`, all int 0–100.
- `temperature` is a **thermal safety indicator**; the UI label should be `Temperature Control`, not numeric degrees.
- A decision applies its `MissionEvent.openingEffects` plus `DecisionOption.effects` **once** and records full before/after snapshots.
- All outcomes are deterministic for reproducible demos.
- No passive per-second drains in hackathon MVP. An event warning becomes a resource change only on its first resolved choice, so no duplicate effect due to React re-render.
- Warnings below 30 should be clearly announced; at zero, enter a stabilization review and allow replay.
- Do not arbitrarily deduct Oxygen from every turn in addition to authored effects; that risks unwinnable states.
- Data model is educational simulation; there is no attempt to calculate kilograms of oxygen or real temperatures.

## Required mission sequence
**L1 — First Day on Mars:** four core resources, simple guided tour; habitat air setup, water recycler, greenhouse planning, energy balance. `radiationProtection` and `temperature` still visible but treated as protective background indicators.

**L2 — Power Crisis:** dust storm reduces solar production; player prioritizes life support vs greenhouse and decides backup/conservation strategy, then handles heating. Must clearly teach knock-on effects. Include a NASA dust source.

**L3 — Oxygen Emergency:** simulated leak; inspect gauge, isolate/repair vs reserves vs temporary conservation. Message must say reserves do **not** fix a leak. Include an ECLSS / Mars air source.

**L4 — Mars Survival Challenge:** combined low energy + water + oxygen/temperature + radiation pressure; player must protect crew first and send final communications report. Use all six bars visibly and at least three explicit competing decisions.

For detailed authored outcomes and suggested numerical deltas, see `01_GAME_DESIGN_DOCUMENT.md`. The balance may be tuned but preserve trade-offs and science integrity.

## Mission Brief algorithm
For any completed level, build:
```text
Mission Title: First Day on Mars
Status: Mission Reviewed / Crew Stabilized
Resources: Oxygen 78 → 87 (+9), Energy 72 → 56 (-16), etc.
Decision 1: Run oxygen system
    Effect: oxygen up; water and energy down
    Lesson: air and water systems need power and maintenance
Decision 2: ...
Science fact 1: NASA's oxygen explanation [official NASA URL]
Try next time: Compare the balanced option with the reserve option.
Buttons: Next Mission / Replay / Mission Library
```
No standard `YOU DIED`, `FAILED`, or irreversible loss state. `Mission Brief` must be generated for **all** four levels, not only the final one.

## Suggested pure functions
```ts
export const clampResource = (n: number): number =>
  Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;

export function applyEffects(base: Resources, ...deltas: ResourceDelta[]): Resources {
  const keys: ResourceKey[] = [
    'oxygen', 'water', 'food', 'energy', 'radiationProtection', 'temperature',
  ];
  return Object.fromEntries(keys.map((k) => [
    k, clampResource(base[k] + deltas.reduce((sum, delta) => sum + (delta[k] ?? 0), 0)),
  ])) as Resources;
}
```
This is illustrative; add robust TypeScript validation/tests. Note that invalid deltas should be caught by authoring checks, not silently treated as facts.

## Data quality validation
Every event must have unique `id`, ≥2 option choices with unique `id`; choices include nonempty `label`, `preview`, `consequence`; all resources in effects are known keys; every `scienceFactIds` entry resolves to `scienceFacts`; level titles exactly match contract; `SceneStatus` allowed values only. Avoid complex conditional branches that cannot be tested in 24h. Level duration fields are **estimates**, not timers.

## AI implementation prompt — copy to coding agent
```text
You are the gameplay engine and educational-science implementer for
Junior Astronaut Mission Trainer. Inspect the existing GitHub repo first.
Read the provided GAME_DESIGN_DOCUMENT, TECHNICAL_CONTRACTS and SCIENCE_AND_CONTENT_SOURCES.
Operate ONLY in feature/malak-game-engine and src/game/**, src/data/**, src/science/**.
Implement frozen TypeScript models, a pure clamp/applyEffects resource engine,
Zustand useGameStore actions selectLevel, chooseOption, continueMission,
returnToLibrary, restartLevel, four data-driven Mars levels, and a Mission
Brief report builder. Displayed resources are oxygen, water, food, energy,
radiationProtection, temperature (the last is 0–100 thermal stability,
not Celsius). Every level has >=3 choices events and science-referenced lessons.
Every active event supplies the correct existing HotspotId so Renad's scene can
direct physical exploration; Malak does not implement movement or rendering.
Make each decision idempotent until the player continues. Keep meaningful
cross-resource trade-offs, no traditional win/lose, nonviolent tone. Do not
add backend, NASA runtime APIs, new dependencies or modify teammate UI/3D files.
Run build/tests, review actual output, and report files modified and remaining blockers.
```

## Acceptance checklist
- [ ] 4 levels named exactly as required
- [ ] 6 resources bounded 0–100
- [ ] No duplicated application from repeated clicks/re-renders
- [ ] Mission Brief after every level, including stabilization route
- [ ] Science IDs resolve to actual official URLs
- [ ] `selectLevel` and replay reset state properly
- [ ] All choices provide observable trade-offs and child-friendly consequence text
- [ ] Every active mission event maps to a real scene `HotspotId`
