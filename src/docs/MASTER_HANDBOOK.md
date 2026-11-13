# MARS BASE: MISSION CONTROL — MASTER HANDBOOK

**Project:** Junior Astronaut Mission Trainer
**Status:** Canonical implementation handbook, documentation only
**Date:** 13 November 2026
**Team:** Mohamed — UI/UX; Malak — game logic/content/progression; Renad — 3D scene/integration

## 1. Authority and precedence

This handbook summarizes the canonical Markdown set in `src/docs/`; specialized documents remain authoritative for their subjects. The latest approved gameplay direction is [`10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md`](10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md). It supersedes older guidance that presents gameplay as a three-column dashboard, makes every mission freely selectable, or treats interaction as inspection followed immediately by a multiple-choice card.

The existing implementation clock does not restart. Preserve completed Home, Library, Mission Brief, resource engine, avatar picker, scene work and teammate ownership. This documentation does not prove that the described runtime is implemented or browser-tested.

## 2. Product definition

Mars Base is a nonviolent educational 3D adventure for ages 7–15. The child chooses one of exactly four cosmetic astronaut appearances, enters a shared Mars base, moves through the world, investigates and manipulates equipment, makes engineering/resource decisions and receives a supportive Mission Brief with science context.

The actual R3F world—or a clearly labeled accessible fallback—occupies the full gameplay viewport. Objective, mission name, essential alerts, expandable six-resource status, controls and contextual interaction prompts render as compact overlays. Permanent left/right gameplay columns and a permanently visible decision panel are not part of the approved experience.

The six fictional 0–100 simulation indicators are Oxygen, Water, Food, Energy, Radiation Protection and Temperature Control. Temperature Control is a thermal-safety index, not Celsius. NASA-linked facts must be distinguished from fictional balancing values.

## 3. Canonical player loop

1. Choose and confirm one of four avatars.
2. Open the Mission Library; on fresh progress only Level 1 is unlocked.
3. Start the currently unlocked mission or replay a completed mission.
4. Spawn in the full-viewport Mars world with the selected avatar.
5. Follow PIP's compact objective guidance and physically navigate to the target.
6. Scan/inspect the correct equipment.
7. Collect and visibly carry one simple item, install it, or operate/repair a device.
8. When prerequisites are complete, make a short contextual engineering/resource choice.
9. Observe avatar, equipment, HUD and resource consequences exactly once.
10. Complete the remaining objectives and receive a Mission Brief.
11. Valid completion unlocks only the next mission; completed missions remain replayable.

No combat, death animation, hostile enemies, mandatory reflex timer, fake NASA live data or automatic browser fullscreen.

## 4. Exactly four sequential missions

| Order | Mission | Fresh state | Required physical emphasis |
|---:|---|---|---|
| 1 | First Day on Mars | Unlocked | Guided scan plus filter/tool collection and installation |
| 2 | Power Crisis | Locked until L1 completes | Solar scan plus backup/switch operation and power priority |
| 3 | Oxygen Emergency | Locked until L2 completes | Diagnosis plus valve/module repair and conservation choice |
| 4 | Mars Survival Challenge | Locked until L3 completes | Combined reuse of scan, carry/install and operate/repair across systems |

A valid Level 4 completion records campaign completion. Avatar selection is separate cosmetic preference and never affects access. `screen='brief'`, `currentReport`, a Stabilization Protocol, a wrong target or a replay is not by itself proof of completion. A development-only fixture may expose later levels for testing, but production must not contain an uncontrolled unlock bypass.

## 5. Reusable physical gameplay

P0 reuses a small mechanic family rather than creating four unrelated minigame engines:

- **Scan/inspect:** approach the correct device and trigger focused diagnostic feedback.
- **Collect/carry/install:** keep at most one visible simple item; take it to the correct target and install it.
- **Operate/repair:** use a child-friendly hold, valve, gauge or switch interaction without an arbitrary failure timer.
- **Contextual choice:** reveal strategy options only after required physical steps; apply effects once.
- **Feedback:** show device state, avatar Interact/Celebrate response, concise consequence and resource change.

Every mission includes movement, at least one inspection and at least one active physical task. The accessible fallback requires an equivalent controlled user action; it must not silently auto-complete objectives.

## 6. Four avatars and animation

Exactly four selectable appearances share one controller, movement speed, collision capsule, interaction radius, camera, resources, mission difficulty and outcomes. P0 semantic feedback is Idle, Walk, Interact and Celebrate. Use verified GLB clips only after inspecting real files, rights and clip names; distinct procedural low-poly appearances and procedural animation remain the safe fallback.

## 7. Ownership

| Owner | Production paths | Owns | Does not own |
|---|---|---|---|
| Mohamed | `src/App.tsx`, `src/pages/**`, `src/components/ui/**`, `src/styles/**`, `src/index.css` | Full-viewport composition, compact HUD, contextual UI, Library states, accessibility | Resource/task/progress truth or 3D movement |
| Malak | `src/game/**`, `src/data/**`, `src/science/**` | Deterministic resources, task data/validation, sequential progress, completion gate, reports, science | Scene rendering, collision or UI layout |
| Renad | `src/scene/**`, approved `public/models/**` | World, controller, camera, avatars, proximity, physical equipment interactions and visible scene feedback | Store/resource mutations or UI rewrites |

Never edit a teammate's owned production file without explicit handoff. Preserve completed code and integrate incrementally.

## 8. Frozen interfaces

The documented existing runtime names remain stable:

- `selectLevel(id)`
- `chooseOption(optionId)`
- `continueMission()`
- `returnToLibrary()`
- `restartLevel()`
- `MissionEvent.hotspotId`
- `MarsSceneProps.onInspect(hotspotId)`
- the existing screen union and required scene props

`selectLevel` must ultimately guard locked IDs in the game-logic layer as well as the UI. Existing callers must not be broken merely to support the new direction.

## 9. Pending contracts — REQUIRES TEAM APPROVAL

The current frozen API does not fully express persistent sequential progress or multi-stage physical tasks. Before production code imports or implements them, all owners must approve exact names, shapes, ownership and export paths for:

- `AvatarId`, `AvatarDefinition`, canonical avatar metadata and optional `MarsSceneProps.avatarId`;
- canonical completed-level data or equivalent derived unlock state;
- versioned storage validation and the exact valid-completion transition;
- `InteractionKind`/`InteractionStep` or a lean equivalent for scan, collect, install and operate;
- current interaction step and an idempotent validated task-completion action;
- scene input/task signals such as active step, completion callback and input lock;
- any continuous proximity callback not present in the frozen scene API.

Required invariants survive whatever names the team chooses: fresh progress unlocks only L1; task and completion signals are current-state validated and idempotent; corrupt storage does not grant access; one owner mutates truth; avatar state cannot unlock missions; modal focus suppresses gameplay keys.

## 10. Integration gates

- **Gate A:** full-viewport scene composition, compact overlays, exact four-card Library, fresh L1-only lock state and retained avatar selection.
- **Gate B:** first complete vertical slice: move → scan → collect/install or operate/repair → contextual choice → world/resource consequence → Mission Brief → unlock L2.
- **Gate C:** reuse the framework across exactly four levels; validate persistence, replay, Stabilization behavior, science and performance.
- **Gate D:** animation/VFX/touch polish only after P0 passes.

Handoff order: Malak freezes approved progress/task contracts; Renad exposes only approved task signals and physical scene behavior; Mohamed consumes them in the overlay UI. Typed local stubs may support parallel work but must not become competing production contracts.

## 11. Release gates

Release evidence must demonstrate:

- new/corrupt progress exposes only L1 and locked `selectLevel` calls are rejected;
- L1→L4 unlock in order exactly once while completed levels remain replayable;
- gameplay fills 1366×768 and 1920×1080 viewports and remains usable at 360px;
- decisions appear only after matching physical prerequisites;
- scan, collect, carry, install, operate and repair behavior is visible and non-duplicating;
- all four avatars share controller behavior and P0 animation states;
- modal focus blocks WASD/E behind contextual UI;
- WebGL/model/storage failures degrade safely;
- real browser evidence plus actual build/lint results are recorded.

Do not claim a one-hour game, successful deployment or completed physical gameplay without measured or observed evidence.

## 12. Documentation map

1. [`00_START_HERE.md`](00_START_HERE.md) — entry point and non-negotiables.
2. [`01_GAME_DESIGN_DOCUMENT.md`](01_GAME_DESIGN_DOCUMENT.md) — story, missions, resources and experience.
3. [`02_TECHNICAL_CONTRACTS.md`](02_TECHNICAL_CONTRACTS.md) — frozen APIs and approval boundaries.
4. [`10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md`](10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md) — latest approved fullscreen, physical-task and progression specification.
5. [`09_FOUR_AVATARS_ANIMATION_GAMEPLAY.md`](09_FOUR_AVATARS_ANIMATION_GAMEPLAY.md) — avatar/animation details, subject to document 10.
6. [`03_MOHAMED_TASKS.md`](03_MOHAMED_TASKS.md), [`04_MALAK_TASKS.md`](04_MALAK_TASKS.md), [`05_RENAD_TASKS.md`](05_RENAD_TASKS.md) — owner work boards.
7. [`06_24_HOUR_RUNBOOK.md`](06_24_HOUR_RUNBOOK.md) — staged integration plan.
8. [`07_SCIENCE_AND_CONTENT_SOURCES.md`](07_SCIENCE_AND_CONTENT_SOURCES.md) — scientific integrity and sources.
9. [`08_QA_AND_DEMO.md`](08_QA_AND_DEMO.md) — executable browser acceptance and demo.
