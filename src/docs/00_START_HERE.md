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
- Prioritize a complete Home → Mission Library → enter the shared Mars map → move the astronaut → approach and inspect the required system → decide → observe consequences → Mission Brief → Next Level loop. The 3D map is playable space, not decorative background.
- The person responsible for a file is its sole editor until agreed handoff. Shared type changes need team approval.
- All AI agents must inspect the existing project, avoid overwriting teammates' files, commit only on their assigned branch and report exact changes.
- A one-hour experience is the **content/design goal**, not an independently verified runtime guarantee. In 24 hours, target four coherent levels and a high-quality 15–30 minute end-to-end demo. Add optional exploration, choices, reflection and additional authored event variants only after integration. Never pad with unskippable waiting.

## Minimum viable milestone (MUST ship)
Four selectable levels, at least three meaningful decisions per level, one shared interactive 3D Mars base, one controllable low-poly astronaut with WASD/arrow-key movement and an isometric follow camera, proximity + `E` interaction, six resource indicators, persistent in-session decision history, level Mission Briefs with NASA-linked science cards, responsive web UI, no crash, and successful `npm run build`.

## Expansion milestone (ONLY if on time)
Improved astronaut model/animation, rover investigation, 5–7 interactions per level, touch controls, accessibility reading modes, sound toggles, expanded exploration tasks and save/replay functionality. Basic astronaut movement and system interaction are part of the minimum milestone, not expansion scope. Measure actual play time before describing it publicly as a 60+ minute game.

## Version boundaries
This package is documentation and implementation guidance; it **does not** claim that the game code is already built, tested or deployed. No changes were pushed to the shared repository as part of document preparation.
