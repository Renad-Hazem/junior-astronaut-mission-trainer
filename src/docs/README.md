# Mars Base Documentation Guide

This directory is the authoritative documentation set for **Junior Astronaut Mission Trainer — Mars Base: Mission Control**. The team is already implementing the project; these documents clarify the current product and integration direction without restarting completed work.

## Current product direction

The game is a child-friendly, nonviolent 3D Mars exploration adventure for ages 7–15. Before entering missions, the player selects one of four cosmetic astronaut avatars. Every avatar uses the same controller, speed, collision, interaction radius, resources and outcomes. The player then moves through one shared Mars base, approaches equipment, presses `E`, makes educational decisions, observes world/resource feedback and receives a Mission Brief after every level.

The existing Word files in `word/` are archived delivery snapshots. The Markdown files listed below are authoritative for current implementation.

## Reading order

| Order | Document | Purpose |
|---:|---|---|
| 1 | [`00_START_HERE.md`](00_START_HERE.md) | Current scope, non-negotiable requirements and navigation |
| 2 | [`01_GAME_DESIGN_DOCUMENT.md`](01_GAME_DESIGN_DOCUMENT.md) | Story, player loop, four missions, resources and educational experience |
| 3 | [`02_TECHNICAL_CONTRACTS.md`](02_TECHNICAL_CONTRACTS.md) | Frozen APIs, ownership, data flow and proposed avatar contract |
| 4 | [`09_FOUR_AVATARS_ANIMATION_GAMEPLAY.md`](09_FOUR_AVATARS_ANIMATION_GAMEPLAY.md) | Canonical four-avatar, animation, GLB fallback and spatial-gameplay specification |
| 5 | Your role file | Incremental tasks, dependencies, acceptance and handoff |
| 6 | [`06_24_HOUR_RUNBOOK.md`](06_24_HOUR_RUNBOOK.md) | Remaining-work priorities, integration gates and release plan |
| 7 | [`07_SCIENCE_AND_CONTENT_SOURCES.md`](07_SCIENCE_AND_CONTENT_SOURCES.md) | Verified NASA references and scientific-integrity rules |
| 8 | [`08_QA_AND_DEMO.md`](08_QA_AND_DEMO.md) | Browser tests, release gates and demo flow |
| 9 | [`MASTER_HANDBOOK.md`](MASTER_HANDBOOK.md) | Consolidated orientation and links to specialized authoritative documents |

Role files:

- [`03_MOHAMED_TASKS.md`](03_MOHAMED_TASKS.md) — React UI/UX and mission screens.
- [`04_MALAK_TASKS.md`](04_MALAK_TASKS.md) — game state, missions, resources and science.
- [`05_RENAD_TASKS.md`](05_RENAD_TASKS.md) — 3D world, avatars, controller, animation and integration.

## Ownership boundaries

| Owner | Owned production paths | Must not implement |
|---|---|---|
| Mohamed | `src/App.tsx`, `src/pages/**`, `src/components/ui/**`, `src/styles/**`, `src/index.css` | Resource calculations, mission data or scene movement |
| Malak | `src/game/**`, `src/data/**`, `src/science/**` | 3D rendering, movement or avatar animation |
| Renad | `src/scene/**`, optional verified assets in `public/models/**` | UI rewrites or game-state/resource logic |

No teammate edits another owner's files without an explicit handoff. Use one controller for four appearances; do not create duplicate global state or separate movement implementations.

## Contract approval checkpoint

Existing public APIs remain frozen, including `selectLevel`, `chooseOption`, `continueMission`, `returnToLibrary`, `restartLevel`, `MissionEvent.hotspotId` and `MarsSceneProps.onInspect`.

The proposed `AvatarId`, `AvatarDefinition`, canonical avatar metadata and optional `MarsSceneProps.avatarId` are additive and marked **REQUIRES TEAM APPROVAL**. Do not silently implement or depend on them before all three owners agree on the exact definitions and export paths.

## Asset and implementation honesty

- Do not claim GLB filenames, appearances, animation clips or licenses until the actual files are inspected.
- If a model is missing, corrupt, unlicensed or clip-less, use the documented distinct procedural fallback.
- Basic Idle, Walk, Interact and Celebrate feedback is P0, but advanced rigging, cinematics and photorealism are not.
- Resource values are fictional educational simulation values, not live NASA measurements.
- Do not claim a one-hour runtime until a timed full-game playtest verifies it.

## Before integration

1. Read the Technical Contracts and your role file.
2. Confirm the avatar contract approval status.
3. Inspect current branches and uncommitted work; never reset or overwrite a teammate.
4. Implement only in owned paths.
5. Run the relevant browser QA plus `npm run build` and `npm run lint`.
6. Report real results, missing exports/assets and any approval dependency.
