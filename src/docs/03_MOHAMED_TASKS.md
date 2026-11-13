# MOHAMED — REACT UI/UX, MISSION FLOW & ACCESSIBILITY
**Branch:** `feature/mohamed-ui`  
**Primary paths:** `src/App.tsx`, `src/pages/**`, `src/components/ui/**`, `src/styles/**`, `src/index.css`  
**Read first:** `01_GAME_DESIGN_DOCUMENT.md`, `02_TECHNICAL_CONTRACTS.md`, `06_24_HOUR_RUNBOOK.md`.

## Your mission
Build a vivid, game-like, complete React experience for children 7–15 that works **with stubbed game/scene APIs** first and then with the teammates' real exports. Make the educational game feel alive and understandable — **not a form, quiz app or generic dashboard**.

## Required connected screens
### Home
- Large title `MARS BASE: MISSION CONTROL`, subtitle `Junior Astronaut Mission Trainer`, playful astronaut/planet visual made with CSS or future 3D scene.
- One primary button `Start Your Mission` → library.
- Short 4-step introduction `Explore → Decide → Protect → Discover`.
- Science-source attribution disclaimer in footer (`Educational simulation; source links inside Mission Brief`).

### Mission Library
- Exactly four cards with names: **First Day on Mars**, **Power Crisis**, **Oxygen Emergency**, **Mars Survival Challenge**.
- Show mission number, skill/difficulty and a short purpose.
- For hackathon demo, allow selecting any level independently so the judging flow works. Optionally show suggested order.

### Mission Gameplay
- Desktop: 3D Mars base as dominant visual with overlay, compact resource dashboard and decision panel.
- Mobile: stack title → resource summary → 3D stage → decision card and fixed safe bottom actions; do not force a 3-column tiny layout.
- 6 resources (Oxygen, Water, Food, Energy, Radiation Protection, Temperature Control) with icon, label, visible 0–100 value and progress bar. Show caution/critical icons + text (not color alone).
- Alert card with PIP dialogue, two to three large action buttons, `preview` of likely costs/benefits.
- After choice, animate changed bars, show `consequence`, `Continue` button; do not auto-advance.
- Include `Inspect system` button to explain the currently highlighted landmark if 3D clicks fail.
- No countdown timers forcing decision. `Pause/Review` optional but keep controls obvious.

### Mission Brief (after **every** level)
- Title `MISSION BRIEF` and mission title; supportive state text `Mission Reviewed` or `Crew Stabilized`.
- Two columns or before/after bars for all 6 resources.
- Chronological action history: choice, what changed, why it mattered.
- 1–3 NASA-linked science cards with verified official URLs from Malak's content.
- `Try a different strategy` hint; `Replay Mission`, `Next Mission` and `Mission Library` navigation where applicable.
- Avoid standard winner/loser UX; emphasize growth and thinking like an engineer.

## Visual design system
| Token | Hex | Use |
|---|---|---|
| Navy | `#11184E` | Deep backdrop |
| Royal Blue | `#28558B` | Main surfaces and actions |
| Rocket Orange | `#FF913D` | Warning and primary CTA |
| Star Yellow | `#FFD34E` | Achievements and highlights |
| Cosmic White | `#F4F5FF` | Body text |
| Sky Blue | `#55BDEB` | Secondary highlights and information |

Use rounded cards, slightly playful typography, spacious buttons, clear hierarchy, accessible focus rings. Do not ship extremely small text, misleading red-only warnings, lots of forced animation or sensational crisis graphics.

## Priority task board
| ID | Time target | Priority | Task and acceptance |
|---|---:|---|---|
| MOH-01 | H+0–2 | P0 | Replace starter screens in your branch only; implement design tokens and Home |
| MOH-02 | H+2–4 | P0 | Four-card Mission Library, stable page composition in `App.tsx` |
| MOH-03 | H+3–6 | P0 | Resource bars + generic Mission Header + Alert and Decision Panel using fixtures |
| MOH-04 | H+5–8 | P0 | GameplayPage with scene placeholder, clear decision/continue behavior |
| MOH-05 | H+7–10 | P0 | MissionBriefPage with before/after and decision list + NASA facts panel |
| MOH-06 | H+10–13 | P0 | Swap stubs with Malak store and Renad `<MarsScene />` |
| MOH-07 | H+13–16 | P0 | Mobile responsive behavior, focus navigation and keyboard checks |
| MOH-08 | H+16–20 | P1 | Animations, polish, loading fallback and small CSS improvement; avoid feature creep |

## Shared integration rules
- `App.tsx` reads `screen` from Malak's `useGameStore`; **do not** implement a second screen state machine.
- `GameplayPage` obtains current level, event, resources, `chooseOption` and `continueMission` via agreed store API; do not do resource math inside React components.
- `<MarsScene levelId={...} status={...} highlightedHotspot={...} onInspect={...} />` is owned by Renad. Ask for a mock component if his branch is not merged yet.
- `MissionBriefPage` uses `currentReport` and fact IDs from Malak's science content. Never invent facts or URLs.
- For the first few hours, use **temporary typed adapters** under `src/pages/__stubs__/` if the interfaces are pending; delete adapters when real exports arrive. Do not commit parallel incompatible stores.
- Mohamed owns `src/App.tsx`; communicate all requested merge/import edits directly to her.

## Good age-inclusive microcopy examples
- `Oops! The habitat needs a little more help.` rather than `Mission failed!`
- `This keeps oxygen stable but uses some battery power.` rather than `-12 Energy` with no explanation.
- `Why does dust affect solar power?` → short learning popup (from NASA science file).
- `Think like an engineer: protect your crew first.` instead of a punitive grade.

## A11y and usability acceptance
- Buttons >=44px in both dimensions, clear focus styles.
- Keyboard users can reach mission options, choose a response and continue without interacting with 3D mesh.
- Alerts use text + icon, not red color alone.
- Responsive at 360px wide and standard laptop width.
- Avoid CSS effects that obscure buttons over the scene.
- If `Canvas` fails to mount, show a lightweight placeholder with mission controls still usable.
- Add title/alt label text to decorative icons where appropriate.

## AI implementation prompt — copy to coding agent
```text
You own the React UI/UX part of the existing
Renad-Hazem/junior-astronaut-mission-trainer project.
Inspect the existing React/Vite/TypeScript files before edits.
Read GAME_DESIGN_DOCUMENT and TECHNICAL_CONTRACTS.
Work only on feature/mohamed-ui and src/App.tsx, src/pages/**,
src/components/ui/**, src/styles/**, src/index.css.
Build connected Home, MissionLibrary, MissionGameplay and MissionBrief
screens for a nonviolent Mars-base management game ages 7–15.
Implement the six resource bars, event choices with previews, readable
consequence messages, 3D scene mount and Mission Brief after each level.
Use Malak's store/actions and Renad's MarsSceneProps contract; for temporary
stubs, match those types exactly. No independent resource calculations,
backend, authentication, timers or added UI frameworks.
Use the specified color palette; make keyboard and mobile layouts functional.
Run build/lint, report actual changes, and do not overwrite game or 3D files.
```

## Acceptance checklist
- [ ] All four routes / screens reachable without blank pages
- [ ] Game decisions call `chooseOption()` only once per click
- [ ] Mission Brief shows **all** six resources and science links
- [ ] Mobile buttons tappable; no horizontal overflow
- [ ] No dependence on WebGL for game controls
- [ ] Explicitly avoids violent/scary imagery and punitive win/lose copy
