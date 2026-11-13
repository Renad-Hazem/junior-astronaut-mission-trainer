# MARS BASE: MISSION CONTROL — START HERE
**Project:** Junior Astronaut Mission Trainer  
**Document set:** Hackathon delivery pack v1.0 | 13 November 2026  
**Team:** Renad (3D & integration), Malak (gameplay engine & science), Mohamed (React UI & experience)  
**Repo:** https://github.com/Renad-Hazem/junior-astronaut-mission-trainer  
**Audience:** Children aged 7–15 | **Format:** Browser-based 3D educational decision game

## Current mandatory experience
Before a mission, the child chooses one of **four visually distinct astronaut avatars**. Selection is cosmetic: every avatar has identical movement speed, collision, interaction range, resources, abilities and mission outcomes. The chosen astronaut then explores the same reusable Mars base with WASD/arrow movement, an isometric follow camera, proximity highlighting and `E` interaction.

During gameplay the real R3F Mars world fills the viewport. A compact overlay HUD shows the objective, essential alerts, expandable six-resource status and contextual interaction; there are no fixed left/right dashboard columns. Every mission requires movement plus an inspection and an active physical task selected from scan, collect, carry, install, operate and repair before or between authored resource decisions.

Exactly four missions exist and unlock in order. On a fresh save, only Level 1 is playable. Valid completion of Level 1 unlocks Level 2, then Level 3 and Level 4; completed missions remain replayable. The selected avatar is cosmetic and cannot affect unlocking.

Basic **Idle, Walk, Interact and Celebrate** feedback is P0 for all four appearances. Real GLB files, clip names and licenses must be verified before documentation or code claims them. Distinct procedural low-poly avatars and procedural animation remain the required fallback, so missing rigs/assets never block the game.

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
1. `README.md` — documentation map, authority and ownership boundaries.
2. `01_GAME_DESIGN_DOCUMENT.md` — story, game feel, detailed levels, age adaptation, lessons and pacing.
3. `02_TECHNICAL_CONTRACTS.md` — exact TypeScript interfaces, ownership, navigation and integration contracts. **All three must read this before coding.**
4. `10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md` — latest approved gameplay direction; it supersedes free mission selection and three-column gameplay.
5. `09_FOUR_AVATARS_ANIMATION_GAMEPLAY.md` — avatar, animation, asset-fallback and spatial-gameplay details, subject to document 10.
6. One personal file: `03_MOHAMED_TASKS.md`, `04_MALAK_TASKS.md`, or `05_RENAD_TASKS.md`.
7. `06_24_HOUR_RUNBOOK.md` — remaining priorities, merging, handoffs, scope cuts and release.
8. `07_SCIENCE_AND_CONTENT_SOURCES.md` — science-safe text and official sources.
9. `08_QA_AND_DEMO.md` — acceptance criteria, playtest script, known risks.

## Non-negotiable shared rules
- No backend, login, external API calls, AI runtime dependence, multiplayer or complex mobile joystick for the 24-hour build.
- Every level shares **one 3D Mars base scene** with stage-dependent atmosphere and interactive landmarks. Do not build four separate complex 3D levels.
- Exactly four cosmetic avatar choices share one character controller. Do not create four movement systems or gameplay advantages.
- Avatar selection occurs before mission entry, persists across levels unless changed, and must fail safely when storage or a model is unavailable.
- Gameplay uses **data-driven event cards and a deterministic resource engine**. No repeated hard-coded React event logic.
- Prioritize a complete Home → Avatar → Mission Library → only unlocked mission → full-viewport Mars map → move → scan/collect/carry/install/operate/repair → contextual decision → consequences → Mission Brief → unlock next level loop. The 3D map is playable space, not decorative background.
- The person responsible for a file is its sole editor until agreed handoff. Shared type changes need team approval.
- All AI agents must inspect the existing project, avoid overwriting teammates' files, commit only on their assigned branch and report exact changes.
- A one-hour experience is the **content/design goal**, not an independently verified runtime guarantee. In 24 hours, target four coherent levels and a high-quality 15–30 minute end-to-end demo. Add optional exploration, choices, reflection and additional authored event variants only after integration. Never pad with unskippable waiting.

## Minimum viable milestone (MUST ship)
Exactly four sequentially unlocked levels, with only Level 1 unlocked on fresh progress; four selectable cosmetic astronauts; one reusable controller; P0 Idle/Walk/Interact/Celebrate feedback; a full-viewport shared 3D Mars base; compact overlay HUD; WASD/arrow movement; proximity + `E`; reusable scan, collect/carry/install and operate/repair tasks; contextual decisions; six resource indicators; validated progress persistence; Mission Briefs with NASA-linked science cards; responsive and accessible fallbacks; no crash; and successful `npm run build`.

## Expansion milestone (ONLY if on time)
Animation blending polish, advanced custom rigs, rover investigation, 5–7 interactions per level, touch controls, accessibility reading modes, sound toggles, expanded exploration tasks and save/replay functionality. Four distinct playable appearances plus basic Idle/Walk/Interact/Celebrate feedback, movement and system interaction are minimum scope. Measure actual play time before describing it publicly as a 60+ minute game.

## Version boundaries
This package is documentation and implementation guidance; it **does not** claim that the game code is already built, tested or deployed. No changes were pushed to the shared repository as part of document preparation.
