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
| ID | Time target | Priority | Task and acceptance |
|---|---:|---|---|
| MAL-01 | H+0–2 | P0 | Define all types, freeze with team and merge a small `types.ts` PR early |
| MAL-02 | H+2–4 | P0 | Pure resource engine incl. clamp, health ranges, single-application guarantees |
| MAL-03 | H+4–6 | P0 | Zustand level selection, choose, continue, debrief, restart actions |
| MAL-04 | H+5–9 | P0 | Author L1 First Day on Mars and L2 Power Crisis event fixtures |
| MAL-05 | H+8–11 | P0 | Author L3 Oxygen Emergency and L4 Mars Survival Challenge fixtures |
| MAL-06 | H+10–13 | P0 | Build Mission Brief summary, evidence URLs, deterministic status and suggestion |
| MAL-07 | H+13–16 | P0 | Validate event schema, duplicate-click, science ID and all-four-level flow |
| MAL-08 | H+16–20 | P1 | Tune readability and resource balance based on playtests |

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
