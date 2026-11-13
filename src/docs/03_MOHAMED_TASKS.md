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
Mohamed keeps the screens already implemented; these tasks clarify integration and do not request a rebuild.

| ID | Priority | Description | Owned files | Dependencies | Acceptance criteria | Integration handoff |
|---|---|---|---|---|---|---|
| MOH-01 | P0 | Maintain the existing Home screen and design tokens. | `src/App.tsx`, `src/index.css`, `src/styles/**` | Shared palette and screen contract | Home remains responsive and its CTA uses the approved store navigation. | Tell Malak which screen action the CTA consumes; do not edit store code. |
| MOH-02 | P0 | Maintain the four-card Mission Library and selectable demo flow. | `src/pages/**`, `src/components/ui/**` | Malak's exact four `MissionLevel` records | All four mission names remain selectable and call `selectLevel(id)`. | Report missing level data/IDs to Malak without duplicating it in permanent UI state. |
| MOH-03 | P0 | Display six resources, current mission objective, movement instructions and event progress. | `src/pages/**`, `src/components/ui/**`, `src/styles/**` | `MissionLevel.objective`, active `MissionEvent`, store resources | Gameplay clearly says WASD/arrows move and `E` interacts; objective and all six accessible bars remain visible/readable. | Provide Renad the available scene viewport and overlay-safe areas; consume Malak's data without resource math. |
| MOH-04 | P0 | Connect the existing Gameplay screen to the playable scene and gate the relevant decision panel until inspection. | `src/pages/**`, `src/components/ui/**` | Renad's `MarsScene`; active event `hotspotId`; `onInspect` | `onInspect(id)` opens/reveals the decision interface only when `id` matches the active event; inspecting other systems gives descriptive feedback without resolving the event. | Give Renad a tested callback snippet and tell Malak if an authored event lacks `hotspotId`. |
| MOH-05 | P0 | Maintain Mission Brief with before/after resources, history, explanations and verified science. | `src/pages/**`, `src/components/ui/**`, `src/styles/**` | Malak's `currentReport` and science fact index | Every level ends in a supportive brief with all six resources and real decision history. | Report unresolved science IDs to Malak; never invent source text or URLs. |
| MOH-06 | P0 | Replace temporary adapters with teammate exports and wire inspection → decision → consequence → Continue. | `src/App.tsx`, `src/pages/**` | Malak store/data exports; Renad default `MarsScene` export | `chooseOption` fires once, consequence remains visible, and explicit `continueMission()` advances; no UI-side effects calculation. | Share exact missing import/export errors with the owning teammate; delete only Mohamed-owned stubs after real integration. |
| MOH-07 | P0 | Provide the nearby-system prompt, visible focus, and resilient keyboard/WebGL fallback. | `src/pages/**`, `src/components/ui/**`, `src/styles/**`, `src/index.css` | Scene proximity behavior and agreed integration signal | A visible `Press E to inspect` prompt is presented when the current system is reachable; the accessible `Inspect System` button completes the same flow if 3D input/WebGL fails. | Continuous proximity state is not in the frozen API; any new optional callback is **REQUIRES TEAM APPROVAL**. Until approved, coordinate prompt rendering with Renad without inventing an export. |
| MOH-08 | P1 | Polish responsive behavior, lightweight transitions and optional touch-facing instructions without feature creep. | `src/pages/**`, `src/components/ui/**`, `src/styles/**` | Integrated P0 flow and playtest results | 360px layout has no horizontal trap; controls are ≥44px and reduced-motion remains usable. | Deliver screenshots/manual results to Renad for final integration review. |
| MOH-09 | P0 | Add an incremental Choose Your Astronaut panel to the existing Home flow; do not rebuild completed screens or add a new `ScreenId`. | `src/App.tsx`, `src/pages/**`, `src/components/ui/**`, `src/styles/**` | Approved `AvatarId`/metadata from Malak; real/fallback preview guidance from Renad | Exactly four keyboard/touch-friendly cards show preview, name, description and textual Selected state; Confirm is required before library entry. | Share the selected-ID interface with Renad and storage behavior with Malak; report contract blockers before inventing types. |
| MOH-10 | P0 | Persist and expose the cosmetic selection with Confirm/Change Avatar. | `src/pages/**`, `src/components/ui/**` | MOH-09; approved optional scene prop | Valid selection survives library/levels/replay and safe reload through a scoped `localStorage` key; invalid/blocked storage falls back without crashing; Change Avatar is available from Library. | Pass `avatarId` to `MarsScene` only after approval; provide Renad a deterministic test ID and fallback case. |
| MOH-11 | P0 | Show selected identity and responsive animation/interaction feedback without duplicating scene state. | `src/pages/**`, `src/components/ui/**`, `src/styles/**` | Renad's scene states; Malak's active objective/event | Gameplay identifies the selected astronaut, keeps controls/objective/prompt accessible, prevents gameplay keys behind decision inputs and shows encouraging completion feedback. | Coordinate focus-lock behavior with Renad; UI never selects animation clips or calculates resources. |

## Shared integration rules
- `App.tsx` reads `screen` from Malak's `useGameStore`; **do not** implement a second screen state machine.
- `GameplayPage` obtains current level, event, resources, `chooseOption` and `continueMission` via agreed store API; do not do resource math inside React components. The current objective and movement controls stay visible while the decision interface is revealed by the matching scene inspection or accessible fallback.
- `<MarsScene levelId={...} status={...} highlightedHotspot={...} onInspect={...} />` is owned by Renad. Pass the active `MissionEvent.hotspotId` as `highlightedHotspot`; when `onInspect` returns that same ID, reveal the relevant decision panel. Ask for a mock component if his branch is not merged yet.
- `MissionBriefPage` uses `currentReport` and fact IDs from Malak's science content. Never invent facts or URLs.
- For the first few hours, use **temporary typed adapters** under `src/pages/__stubs__/` if the interfaces are pending; delete adapters when real exports arrive. Do not commit parallel incompatible stores.
- Mohamed owns `src/App.tsx`; communicate all requested merge/import edits directly to her.
- Avatar selection is an incremental Home overlay/panel with four cosmetic choices, not a replacement navigation system. Until the avatar contract is approved, keep any fixture isolated in Mohamed-owned stubs and do not invent production exports.

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
consequence messages, playable 3D scene mount and Mission Brief after each level.
Keep movement instructions/current objective visible and reveal the matching
decision when Renad's onInspect returns the active MissionEvent hotspotId.
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
- [ ] WASD/arrows and `E` instructions plus current objective are visible
- [ ] Matching `onInspect(hotspotId)` reveals the decision; fallback follows the same path
- [ ] Four avatar cards, Confirm and Change Avatar are keyboard/touch accessible
- [ ] Valid selection persists safely and is passed to the scene only through the approved contract
- [ ] Explicitly avoids violent/scary imagery and punitive win/lose copy
