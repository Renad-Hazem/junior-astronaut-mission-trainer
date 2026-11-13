# Mars Base: Mission Control — Fullscreen Gameplay, Physical Tasks & Level Progression

**Status:** Latest approved canonical gameplay direction — documentation only. Requires implementation and browser QA before claiming functionality.
**Date:** 2026-11-13
**Owners:** Mohamed (UI and UX); Malak (game logic, progression, mission task data); Renad (3D play, avatar controller, equipment interactions).
**Precedence:** Supersedes older guidance that missions are all freely selectable and gameplay is a three-column dashboard. Preserve the four missions, four selectable cosmetic avatars, six resources, educational briefings, existing technology stack and approved APIs unless a coordinated additive contract is approved.

## 1. Product direction
Build a **playable, child-friendly, full-viewport 3D Mars adventure** for ages 7–15 with resource management layered *on top of* the world, not a questionnaire flanked by dashboard columns. Character movement, object discovery, physical investigation, collecting/placing simple parts, repairing/manipulating stations, and visual cause/effect are essential to the gameplay fantasy. The player should spend most of each level interacting with the world rather than repeatedly opening multiple-choice cards. NASA-linked explanations remain carefully distinguished from fictional 0–100 game balancing.

**Canonical loop:** Choose one of four avatars → enter Mission Library → start the only currently unlocked uncompleted level (or replay a completed level) → spawn in 3D Mars Base → follow objective → physically navigate to target → inspect/scan/find/use object → perform a short hands-on task → make a meaningful engineering/resource choice where authored → watch equipment, avatar and six resources respond → complete remaining objectives → Mission Brief → unlock next level upon valid completion.

No violence, combat, punitive death, pay-to-play, fake NASA live data, mandatory timers or photorealism promises.

## 2. Full-viewport Gameplay UI — P0
- During a playable level, the actual `Canvas` or accessible fallback occupies the **entire gameplay viewport**: `width: 100vw; min-height/height: 100dvh` or equivalent responsive full-bleed layout. Remove fixed left/right columns that reduce the world to a center card. Use the existing React pages and CSS; do not rebuild Home, Library or Brief.
- Render HUD over the world with accessible, compact, responsive overlays. Suggested: top-left objective + mission name; top-right compact oxygen/energy alert and **expandable six-resource HUD**; center contextual target indicator; bottom-left WASD/arrow/touch hints; bottom-center/near-object `E — Interact`; small PIP guidance area; pause/help and accessibility actions.
- Avoid blocking movement with permanent panels. Ordinary world mode has no Decision Panel. On a matching nearby interaction, open a small contextual inspection/task overlay or modal. Resource decision options appear **only when the task prerequisites are complete**. Display concise outcome, then allow Continue; keep ability to inspect the world after closing.
- On desktop, game world occupies the whole viewport beneath HUD. On narrow viewports, HUD collapses into readable tabs/drawers, never an obstructive multicolumn layout. Support 360px width and keyboard-only controls. Allow a user-initiated true browser fullscreen button if feasible; do not auto-enter the browser Fullscreen API or depend on it for the full-viewport layout.
- Pause/disable player input when a modal or focused form captures keyboard controls; do not let WASD/E continue moving/interacting behind dialog. Preserve an accessible Inspect/Complete Task alternative when 3D/WebGL input is unavailable. Follow reduced-motion preferences.
- Main gameplay is *not* represented by the existing CSS `MarsSceneAdapter` except as a clearly labeled fallback. Renad's actual R3F world is the target.

### Visual layout model
```
┌──────────────────────────────────────────────────────────────┐
│ MISSION / OBJECTIVE     3D MARS WORLD (full viewport)  HUD ∨ │
│                                                              │
│       SOLAR ARRAY   [objective beacon / distance cue]        │
│                                                              │
│              avatar walking near real 3D equipment           │
│                                                              │
│ PIP HINT                      [E — INSPECT / REPAIR]  HELP     │
└──────────────────────────────────────────────────────────────┘
```

## 3. Level progression and locking — P0
- Exactly four mission cards remain visible in library, in existing order: First Day on Mars → Power Crisis → Oxygen Emergency → Mars Survival Challenge.
- On a new save, **only Level 1 is unlocked**; Levels 2–4 display an obvious lock icon, clear unlock condition (`Complete Mission 01 to unlock`), and disabled **Start Mission** action. Cards remain readable for discovery, but clicking/keyboard activation cannot start locked levels.
- Completing Level 1 unlocks Level 2; completing Level 2 unlocks Level 3; completing Level 3 unlocks Level 4. Completing Level 4 marks campaign completed. Previously completed levels remain replayable; previously unlocked but uncompleted level remains available.
- `currentReport`/`screen='brief'` alone is NOT evidence of successful completion; define a consistent completion gate with Malak. If a Stabilization Protocol ends a level early, allow retry and explain whether the next level remains locked. No accidental unlock for merely opening a Mission Brief or bypassing a level.
- Persist the minimal campaign progress in localStorage when usable, using a versioned, validated key. Malak is the authoritative progress owner. Degrade gracefully to in-session progress if storage is blocked. The selected avatar remains a *separate cosmetic preference* and cannot unlock levels.
- Derive unlocked level IDs from canonical ordered completion records or an equivalently robust store contract. `selectLevel(id)` MUST guard locked levels at the game-logic layer as well as Mohamed disabling Library UI controls; never rely on disabled buttons alone.
- Demo/testing access to later levels, if required, must be explicitly limited to development builds or a clearly isolated development setting, not expose an uncontrolled unlock bypass in production.
- Show per-card states: `Locked`, `Ready to play`, `In progress` (optional), `Completed / Replay`. Announce changed states accessibly and show a gentle Level Unlocked feedback after valid completion.

## 4. Gameplay is more than multiple-choice decisions — P0
Implement a small family of **reusable physical interaction mechanics** shared by all levels, rather than four completely separate minigame frameworks. The 3D scene owns character movement, object positioning, proximity, animation and visible task feedback. Malak owns authored steps, validation, the transition to resource choices and saved mission results. Mohamed owns on-screen prompts, contextual inspection/mini-task UI and accessibility fallback.

**Reusable interaction patterns (prioritized):**
1. **Approach + Scan/Inspect (P0):** player walks up to a glowing device, presses `E`, sees a focused scan/inspection visualization and diagnostic result (not immediate multiple choice). Progress requires the correct target.
2. **Collect + Carry + Install (P0):** player collects an obvious tool/filter/battery module in the world, carries it to a target, and installs it. Keep one visible carried item, no complicated inventory or physics. Context prompts and avatar pose communicate pickup/install.
3. **Operate/Repair (P0):** use a simple child-friendly interaction such as a short hold-to-repair, turn a valve, align a gauge or operate a switch. It must have obvious visual success feedback and no arbitrary reflex timer. Reuse one generic mechanic before authoring variations.
4. **Engineering/resource choice (P0):** after inspection/repair prerequisites, show a short meaningful strategy choice with clearly explained trade-offs, not a permanent right-side quiz panel. Apply effects once and show world + HUD consequences.
5. **Optional P1:** extra valve/routing puzzles, clearer tool animations, device status lamps, dust FX, simple audio feedback, touch joystick, optional clue trails. Avoid large new physics engines, advanced driving, procedural maps or complex quest engines in P0.

**Each mission must demonstrate** physical movement, at least one inspect action and one active physical task before or between resource decisions. Prefer a coherent 3–5-step playable loop over repetitive padding. Exact number/complexity of events must be balanced through actual playtesting, not a fixed claim of one-hour length.

## 5. Four levels and example interactive sequences
These are target experiences for Malak/Renad/Mohamed to author together; refine to match actual reusable mechanics, keeping scientific accuracy and story.

1. **First Day on Mars:** choose an avatar → PIP introduces movement → walk to habitat → scan life-support → pick up a filter/tool from supply point → install at oxygen unit → inspect water/greenhouse/solar → learn resource trade-offs through a contextual choice → Mission Brief. Friendly hints for younger children.
2. **Power Crisis:** dust warning in shared map → approach solar array → scan power output → retrieve/enable backup component or operate a switch → choose power priority → visibly brighten/dim related devices and update energy/temperature/other affected resource indices → Mission Brief.
3. **Oxygen Emergency:** inspect habitat warning → physically travel to oxygen system → diagnose source using scan visual → locate appropriate valve/module → hold-to-repair/operate → choose conservation vs reserve vs repair strategy where meaningful → atmosphere status stabilizes visually → Mission Brief.
4. **Mars Survival Challenge:** several objectives across different devices in shared map → player travels between systems, collects/installs/operates equipment and chooses priorities that change all six resources. Reuse the same mechanics in more interesting combinations → cumulative world/resource consequences → final Mission Brief and campaign completion.

Every level remains completable and nonviolent. No hard timeouts that make younger children fail. Use PIP hints that gradually become optional. The six-resource HUD is still available to consult, but it should not dominate the screen.

## 6. Additive interface proposals — REQUIRES TEAM APPROVAL
The existing `MissionEvent.hotspotId`, `onInspect(hotspotId)`, `chooseOption(optionId)`, `continueMission()`, store screen union and scene required props remain stable. The current API alone communicates *inspection*, not multi-stage physical task completion or persistent campaign unlocking. These are illustrative proposed additions: team must agree precise names/shapes before importing them.

**Malak-owned `src/game/types.ts` and store:**
```ts
export type InteractionKind = 'scan' | 'collect' | 'install' | 'operate';
export interface InteractionStep {
  id: string;
  kind: InteractionKind;
  hotspotId: HotspotId;
  itemId?: string; // optional simple carried object identifier
  instruction: string;
}
// Proposed optional field in existing MissionEvent:
interactionSteps?: InteractionStep[];
// Proposed GameStore additions (choose one canonical shape):
completedLevelIds: LevelId[];
activeInteractionStepIndex: number;
completeInteractionStep: (stepId: string) => void;
// Existing selectLevel(id) guards locking; continueMission() marks a valid
// level completion exactly once and saves progression.
```

**Renad-owned additive `MarsSceneProps` signals, consumed by Mohamed (examples):**
```ts
activeInteractionStep?: InteractionStep | null;
onInteractionStepComplete?: (stepId: string) => void;
inputLocked?: boolean;
// Preserve onInspect(hotspotId), avatarId?, levelId, status, etc.
```

Only one owner applies state mutations. Step completions must be idempotent and validated against the current objective; a random scene click, repeated `E`, wrong object or stale step cannot advance progress. The UI can render contextual task details but must never fake completion in 3D mode. Accessible fallback should invoke an equivalent controlled task flow, and not merely auto-complete everything without user interaction.

If a leaner approved event/step contract already exists in a teammate branch, **reuse it**; don't impose this sample schema. All new props/actions are PROPOSALS until written approval. Prefer 1 small approved API patch and early integration over three independent incompatible implementations.

## 7. Team ownership and acceptance
| Person | Ownership | New P0 responsibility | Acceptance |
|---|---|---|---|
| **Mohamed** | `src/App.tsx`, `src/pages/**`, `src/components/ui/**`, `src/styles/**`, `src/index.css` | Replace 3-column gameplay dashboard with full-viewport 3D stage and compact expandable overlay HUD; contextual objective/task/decision panels; Library Locked/Ready/Completed states and accessible control feedback | At 1366×768 and 360px, scene is dominant; no permanent sidebar; only first mission accessible on fresh progress; locked mission cannot launch via UI |
| **Malak** | `src/game/**`, `src/data/**`, `src/science/**` | Canonical campaign lock/unlock and validated persistence, `selectLevel` guard; author multi-step physical task objectives and state machine alongside resource decisions | Fresh progress has L1 only; completed L1 unlocks L2 exactly once; no bypass; task completion and effects idempotent; reports reflect actions |
| **Renad** | `src/scene/**`, approved `public/models/**` | Real full-viewport R3F scene, four selectable appearances and existing movement/animation; proximity, pick-up, install, operate/repair interactions, hotspot visual feedback and one controller | Player physically moves to tool/device, performs one task in 3D and sees it change; no forced second world or separate controller |

Preserve completed Home, Library card assets, Mission Brief, resource engine, avatar picker and earlier CSS work. Modify gameplay composition rather than rebuilding all pages. Never edit teammate-owned files without agreed handoff.

## 8. Priorities and staged integration (existing clock, no reset)
- **Gate A (critical):** full-viewport Canvas composition, approved level progression API, first-only-unlocked on fresh save, avatar selection retained, existing build still passes.
- **Gate B (critical):** actual Mars model + walking avatar + target → E → scan → one physical install/repair → contextual choice → resource/world change → Continue → Mission Brief. This is the FIRST FULL PLAYABLE VERTICAL SLICE.
- **Gate C:** repeat physical-task framework across 4 levels; validate lock/unlock, replay, science and performance.
- **Gate D:** animation polish, device VFX and touch controls as time allows. Never claim the release is full playable P0 if it is still the CSS fallback plus quiz panels.

**Handoff order:** Malak freezes progress/task contracts; Renad exposes task signals and physical scene; Mohamed consumes them and composes the immersive HUD. Their work may start in parallel on local typed stubs but must converge to a single agreed contract before integration.

## 9. QA and release gates
- QA-051: New save opens L1 only; L2–L4 cards visible and correctly locked, disabled to keyboard/mouse/DOM action.
- QA-052: Finish L1 validly; L2 unlocks; complete L2 then L3; complete L3 then L4. Replays remain available; campaign completion recorded.
- QA-053: Refresh/restart with valid and corrupt local progress; no crash, no accidental unlock; storage blocked uses session fallback.
- QA-054: `selectLevel(lockedId)` is rejected at store level even if bypassing UI.
- QA-055: Stabilization/retry does not falsely grant level completion.
- QA-056: On 1366×768 and 1920×1080, Canvas occupies the gameplay viewport with HUD overlays, not a 3-column dashboard; on 360px content is navigable/readable.
- QA-057: Decision options are not permanently visible; they unlock only after appropriate physical task/inspection conditions.
- QA-058: Child can approach/scan one device, collect a visible item, carry/install it, operate/repair, and see spatial/visual response; incorrect object has helpful feedback.
- QA-059: No duplicated step completion, resource effects or unlock from repeated E/clicks; focus blocks gameplay keys behind panels.
- QA-060: Every level contains movement + active physical interaction + meaningful choice; no unexplained teleport-only shortcut in normal 3D mode.
- QA-061: Four selected avatars use identical controller/interaction distance and P0 animation states; missing GLB gracefully falls back.
- QA-062: Actual browser evidence for movement, interaction, task, HUD, unlocking and all-four completion, plus real build/lint results.

This document is a product specification, not proof that features have already been built.
