# TECHNICAL ARCHITECTURE & TEAM INTERFACE CONTRACTS
**This is the shared implementation contract. All three teammates and all AI coding agents must follow it.**

> **Latest approved direction:** [`10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md`](10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md) supersedes free selection of all missions and any permanent three-column gameplay composition. Existing APIs remain frozen. Campaign progression, multi-stage physical tasks and any new scene signals are additive proposals marked **REQUIRES TEAM APPROVAL** until all owners approve exact shapes.

## 1. Observed repository foundation
Repo: `Renad-Hazem/junior-astronaut-mission-trainer`, branch `main` at audit time (13 Nov 2026). Existing: Vite, React 19, TypeScript, Three.js, `@react-three/fiber`, `@react-three/drei`, Zustand and ESLint. `src/App.tsx` is still the stock Vite starter. No existing scene, game engine or routing code was observed. The package has scripts `npm run dev`, `npm run build`, `npm run lint`, and `npm run preview`.

**Architecture decision for 24 hours:** no React Router dependency. Keep page routing in one React `App.tsx` driven by a typed screen field in Zustand. No database, API or authentication. No external assets required.

## 2. File ownership & conflict prevention
| Domain | Owner | Allowed paths | Reserved/shared paths |
|---|---|---|---|
| 3D world and build/integration | **Renad** | `src/scene/**`, `public/models/**` (optional), `docs/integration/**` | `package.json`, `vite.config.ts`, `index.html` ONLY after team approval |
| Data model, pure game logic, missions, science | **Malak** | `src/game/**`, `src/data/**`, `src/science/**`, `src/game/**/*.test.ts` | `src/game/types.ts` is the contract; proposed changes require approval |
| React pages, HUD, styling and App composition | **Mohamed** | `src/pages/**`, `src/components/ui/**`, `src/styles/**`, `src/App.tsx`, `src/index.css` | imports and routes stay consistent with defined store and scene APIs |

**After initial 12h merge:** Renad may resolve integration-level conflicts in agreed shared paths but must inform the owner first. Every teammate uses a separate branch and a PR; no one asks an AI agent to rewrite entire project directories.

## 3. Proposed directory layout
```text
src/
  App.tsx                          # Mohamed: app-level screen composition
  index.css                        # Mohamed: reset/design tokens
  scene/                           # Renad
    MarsScene.tsx
    MarsTerrain.tsx
    MarsBase.tsx
    MarsLandmarks.tsx
    SceneHotspot.tsx
    sceneTypes.ts
  game/                            # Malak
    types.ts
    resourceEngine.ts
    gameStore.ts
    reportBuilder.ts
  data/                            # Malak
    levels.ts
    scienceFacts.ts
  science/                         # Malak
    factIndex.ts
  pages/                           # Mohamed
    HomePage.tsx
    MissionLibraryPage.tsx
    GameplayPage.tsx
    MissionBriefPage.tsx
  components/ui/                   # Mohamed
    ResourceBar.tsx
    ResourceDashboard.tsx
    MissionHeader.tsx
    AlertCard.tsx
    DecisionPanel.tsx
    ReportTimeline.tsx
  styles/                          # Mohamed
    theme.css
    game.css
```

## 4. Shared TypeScript model (source of truth: `src/game/types.ts`)
```ts
export type ResourceKey =
  | 'oxygen' | 'water' | 'food' | 'energy'
  | 'radiationProtection' | 'temperature';
export type Resources = Record<ResourceKey, number>;
export type LevelId =
  | 'first-day-on-mars' | 'power-crisis'
  | 'oxygen-emergency' | 'mars-survival-challenge';
export type ScreenId = 'home' | 'library' | 'gameplay' | 'brief';
export type SceneStatus = 'normal' | 'dust' | 'oxygen_alert'
  | 'radiation_alert' | 'restored';
export type HotspotId = 'habitat' | 'solar' | 'oxygen'
  | 'water' | 'greenhouse' | 'communications' | 'rover';
export type ResourceDelta = Partial<Resources>;

export interface DecisionOption {
  id: string;
  label: string;
  preview: string; // explain likely trade-off before click
  effects: ResourceDelta;
  consequence: string;
  scienceFactIds: string[];
}
export interface MissionEvent {
  id: string;
  headline: string;
  prompt: string;
  sceneStatus: SceneStatus;
  hotspotId?: HotspotId;
  openingEffects?: ResourceDelta; // apply only once on first decision
  options: DecisionOption[]; // 2 to 3 for MVP
}
export interface MissionLevel {
  id: LevelId;
  order: number;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objective: string;
  storyIntro: string;
  initialResources: Resources;
  events: MissionEvent[];
  estimatedMinutes: [number, number]; // target estimate, not guaranteed
}
export interface DecisionRecord {
  eventId: string;
  eventTitle: string;
  optionId: string;
  optionLabel: string;
  before: Resources;
  after: Resources;
  deltaApplied: ResourceDelta;
  consequence: string;
  scienceFactIds: string[];
}
export interface MissionReport {
  levelId: LevelId;
  title: string;
  started: Resources;
  ended: Resources;
  decisions: DecisionRecord[];
  status: 'reviewed' | 'stabilized';
  scienceFactIds: string[];
  suggestion: string;
}
export interface ScienceFact {
  id: string;
  title: string;
  childFriendlyText: string;
  advancedText: string;
  sourceTitle: string;
  sourceUrl: string; // direct verified NASA article URL
}
```

**Type contract is frozen at sprint H+2.** Additive optional fields need an announced PR and a coordinated update. Keep spelling/casing exactly as written. `temperature` is a *0–100 thermal-control index*, NOT °C. Each resource stays an integer between 0 and 100. No new resource keys.

## 5. Game state public API (Malak implements; everyone else consumes)
```ts
export interface GameStore {
  screen: ScreenId;
  activeLevelId: LevelId | null;
  eventIndex: number;
  resources: Resources;
  initialResources: Resources;
  decisionHistory: DecisionRecord[];
  lastDecision: DecisionRecord | null;
  isAwaitingContinue: boolean;
  currentReport: MissionReport | null;
  selectLevel: (id: LevelId) => void;
  chooseOption: (optionId: string) => void;
  continueMission: () => void;
  returnToLibrary: () => void;
  restartLevel: () => void;
}
export const useGameStore: UseBoundStore<StoreApi<GameStore>>;
```

**Required behavior:** `selectLevel(id)` first validates campaign access; locked IDs are rejected without changing screen, active mission or resources. For an unlocked ID it sets `screen='gameplay'`, resets level resources/event/task state and loads its data. `chooseOption(id)` is idempotent while `isAwaitingContinue` and applies the current event's opening effect plus chosen option exactly once, clamps all resources and stores a `DecisionRecord`. `continueMission()` advances only after approved task/decision prerequisites, or builds a Mission Brief after the final valid objective. A valid completion records the level exactly once and unlocks only its immediate successor. `returnToLibrary()` navigates to library. `restartLevel()` resets that level without revoking earned progress. Do not auto-advance while the player reads consequences. The new progress/task state needed for these rules is proposed below and **REQUIRES TEAM APPROVAL**.

**Simplify if necessary:** exact TS import for `UseBoundStore` / `StoreApi` comes from Zustand. Do not make runtime logic depend on TS-only type imports.

## 6. Pure resource engine
```ts
export function applyEffects(base: Resources, ...deltas: ResourceDelta[]): Resources;
// For each of six keys: clamp(round(previous + sum(deltas)), 0, 100)
export function getResourceHealth(value: number):
  'healthy' | 'caution' | 'critical';
// 60–100 / 30–59 / 0–29
```

Rules: no mutation of input objects; no NaN; support absent keys as delta zero; never let the state drift beyond bounds; optional `normalizeResources()` rejects non-finite input. The event's `openingEffects` is applied **once** only in the `chooseOption` transition for an unresolved current event, not on every render.

## 7. 3D scene public API (Renad implements; Mohamed imports)
```tsx
import type { HotspotId, SceneStatus, LevelId } from '../game/types';
export interface MarsSceneProps {
  levelId: LevelId;
  status: SceneStatus;
  highlightedHotspot?: HotspotId;
  onInspect?: (hotspotId: HotspotId) => void;
  reducedMotion?: boolean;
}
export default function MarsScene(props: MarsSceneProps): JSX.Element;
```

Implementation notes: React 19/TS sometimes does not expose the global `JSX` namespace; prefer return inference or `React.JSX.Element` if needed. No local game logic in the Canvas. Scene MUST NOT import Zustand directly; it receives props. Use Canvas, ambient/directional light, `OrthographicCamera` (Drei) or R3F orthographic camera, primitive meshes for 7 named hotspots. `onInspect` is optional, so the UI works even if 3D interaction is temporarily missing. Scene status changes are visual only.

**Interaction contract:** the scene owns character movement, follow-camera behavior, collision/bounds, proximity detection, system highlighting and the `E` key. When the player is within the interaction radius of a system and presses `E`, the scene calls the existing `onInspect(hotspotId)` callback exactly once for that key press. Direct pointer inspection may call the same callback. The scene does not choose options, apply resource effects, advance events or import Zustand.

### 7.1 Playable exploration flow (no new runtime exports)
The existing interfaces are sufficient and remain unchanged. Integration uses this sequence:

```text
Player moves with WASD / arrow keys on X/Z (Y is height)
  → isometric camera follows the astronaut
  → player enters a system's proximity radius
  → that system is highlighted and UI shows "Press E to inspect"
  → player presses E
  → MarsScene calls onInspect(hotspotId)
  → Mohamed's existing UI reveals the matching event/decision panel
  → player calls chooseOption(optionId)
  → Malak's store applies opening + option effects once
  → UI shows resource changes and consequence
  → player explicitly calls continueMission()
  → next MissionEvent objective/hotspot becomes active, or Mission Brief opens
```

`MissionEvent.hotspotId` is the authoritative objective-to-scene mapping. For the active event, Mohamed passes `hotspotId` as `highlightedHotspot`. Renad maps the same `HotspotId` value to the corresponding scene interactable:

| `HotspotId` | MarsScene interactable | Typical mission use |
|---|---|---|
| `habitat` | Central habitat/dome | habitat checks, leak location, shelter |
| `solar` | Solar array | dust and power decisions |
| `oxygen` | Oxygen unit/tanks | air setup and leak repair |
| `water` | Water recycler/tank | purification and water prioritization |
| `greenhouse` | Greenhouse | food/growth decisions |
| `communications` | Communications dish | report/communications objective |
| `rover` | Rover or rover station | remote inspection/maintenance |

Only the current event's `hotspotId` should open its decision panel. Inspecting another system may show safe descriptive feedback, but must not resolve the event or apply resources. Repeated `E` input while the decision panel is open or `isAwaitingContinue` is true must not call `chooseOption` or duplicate effects. Idempotence remains Malak's store guarantee as well as a UI/scene input guard.

The UI always contains a keyboard-accessible `Inspect System` control that invokes the same inspection path for the active `hotspotId`. If WebGL, proximity detection, a raycast or keyboard input is unavailable, the player must still be able to inspect, decide, continue and finish the level. This fallback does not turn the preferred experience into a dashboard-only game; it is an accessibility and resilience path.

### 7.2 Ownership boundary
- **Renad / `src/scene/**`:** astronaut representation, delta-time movement, input mapping, map bounds/basic collision, isometric follow camera, proximity/highlight state and calling `onInspect`.
- **Malak / `src/game/**`, `src/data/**`, `src/science/**`:** active objective/event, `hotspotId`, resources, decisions, consequences, progression, reports and verified science.
- **Mohamed / UI-owned paths:** movement/objective instructions, nearby prompt presentation, decision/consequence panels, Continue and accessible fallback; consume store state and scene callbacks without calculating effects.

No additive public contract change is required for playable movement and inspection. If later playtesting shows the UI must receive continuous nearby-hotspot state rather than an interaction event, any optional callback such as `onNearbyHotspotChange?` is **REQUIRES TEAM APPROVAL** and must be added in a coordinated contract PR; do not implement or depend on it silently.

### 7.3 Four-avatar additive proposal — REQUIRES TEAM APPROVAL
Four selectable cosmetic appearances require a stable identifier shared by data, UI and scene. The following is the smallest backward-compatible proposal. It is documentation only until Mohamed, Malak and Renad approve the exact names and export paths:

```ts
// Malak-owned: proposed additions to src/game/types.ts
export type AvatarId =
  | 'avatar-01' | 'avatar-02' | 'avatar-03' | 'avatar-04';

export interface AvatarDefinition {
  id: AvatarId;
  displayName: string;
  description: string;
  accentColor: string;
  modelUrl?: string; // include only after a real, licensed file is verified
}

// Malak-owned: proposed src/data/avatars.ts
export const avatars: readonly AvatarDefinition[];

// Renad-owned: proposed additive MarsSceneProps field
avatarId?: AvatarId; // omitted value renders the agreed default/fallback
```

This proposal does not rename or make any existing prop/action optional or required differently. Existing callers that omit `avatarId` continue to work. It does not add a new `ScreenId`.

#### Ownership and import expectations
- **Malak** owns `AvatarId`, `AvatarDefinition` and canonical display metadata. `modelUrl` remains absent until Renad verifies a real filename, asset rights and load path; model rendering is not Malak's responsibility.
- **Mohamed** imports the approved IDs/metadata for exactly four avatar cards. Selection is a Home overlay/panel before library navigation, with Confirm and Change Avatar. Mohamed owns browser-safe persistence and passes the ID to the scene; no second game store or avatar-specific mission logic.
- **Renad** imports `AvatarId` as a type and maps each ID to a verified model or distinct procedural fallback. All IDs use one controller, collision capsule, speed and interaction radius.

#### State and data flow
```text
Home avatar cards → local selected AvatarId → Confirm
→ persist scoped key when localStorage is available
→ Mission Library / Gameplay displays selected identity
→ Gameplay passes avatarId to MarsScene
→ scene renders verified model or matching fallback
```

Avatar selection persists across levels and replay until the player chooses Change Avatar. Invalid, missing or unavailable stored values fall back to the agreed default and must never block mission entry. Selection must not affect resources, decisions, collision, movement speed, mission outcomes or educational scoring.

#### Loading, animation and error behavior
- Renad inventories actual GLB filenames, rights, geometry, scale, orientation and embedded `AnimationClip` names before mapping `modelUrl`.
- `useGLTF`/`useAnimations` may consume verified assets using existing dependencies. Never assume clip names; map real clips to semantic Idle/Walk/Interact/Celebrate states.
- Missing/corrupt/unlicensed models or absent clips use a distinct procedural low-poly/animation fallback. One failed avatar must not crash the scene or selection UI.
- Idle, Walk, Interact and Celebrate are P0 visual states. Advanced rigging/blending is later polish.
- Scene movement pauses while a decision/modal input owns keyboard focus. Repeated `E` remains guarded and cannot select an option or duplicate effects.
- Loading UI and error text remain accessible; WebGL fallback still allows the complete educational decision flow.

Do not implement this proposal until team approval is recorded. After approval, publish the types/metadata in one small Malak-owned contract commit before UI/scene code depends on them.

### 7.4 Campaign progression and physical-task proposal — REQUIRES TEAM APPROVAL

The frozen contract can inspect a hotspot and apply a resource choice, but it cannot represent a validated multi-step scan/collect/carry/install/operate/repair sequence or persisted sequential unlocks. The illustrative `InteractionKind`, `InteractionStep`, completion records/actions and optional `MarsSceneProps` task/input signals in document 10 are therefore **REQUIRES TEAM APPROVAL**. The team must choose one canonical shape before implementation.

Contract invariants regardless of final naming:

- ordered canonical completion data derives access to exactly four levels; fresh state unlocks only Level 1;
- both Library UI and `selectLevel` enforce locking; corrupt or unavailable storage never grants extra access;
- task completion is current-step validated and idempotent; wrong/stale objects and repeated `E` cannot advance;
- one owner mutates progress/resources; UI and scene only emit approved intent/signals;
- avatar selection remains separate cosmetic state;
- input-lock coordination is required before adding a prop, because gameplay keys must stop behind modal/form focus;
- existing `hotspotId`, `onInspect`, choice, continue, replay and fallback paths remain compatible.

## 8. Mohamed screen composition contract
- `HomePage`: title, short game premise, CTA to library.
- `MissionLibraryPage`: exactly 4 ordered level cards with Locked/Ready/Completed-Replay state; only an unlocked CTA calls guarded `selectLevel`.
- `GameplayPage`: full-viewport 3D scene (Renad component) or accessible fallback, with compact overlay objective/resources/prompts; contextual task or decision UI appears only when relevant, followed by PIP consequences and explicit `Continue`.
- `MissionBriefPage`: initial/final bars, decision timeline, at least 1 fact from `scienceFacts`, constructive suggestion, `Next Level` or `Replay`.
- `App.tsx` chooses page from `useGameStore(s => s.screen)`; avoid competing page state.

No direct state mutation in UI; only store actions. No duplicated resource calculation.

## 9. Science fact contract
`src/data/scienceFacts.ts` exports `scienceFacts: Record<string, ScienceFact>` (or a typed equivalent). Every decision's `scienceFactIds` must resolve to a real fact entry, and each fact must have an actual official source URL. No fake NASA API connection. Display factual education as sourced copy but resource effects as fictional game balancing.

## 10. Event payload example
```ts
const dustEvent: MissionEvent = {
  id: 'power-dust-alert',
  headline: 'Dust Storm Incoming!',
  prompt: 'The solar array is producing less electricity. Which systems should receive power first?',
  sceneStatus: 'dust',
  hotspotId: 'solar',
  openingEffects: { energy: -18, temperature: -6 },
  options: [
    {
      id: 'prioritize-life-support',
      label: 'Keep life support running',
      preview: 'Protect oxygen; use additional battery power',
      effects: { oxygen: +9, energy: -9, food: -5 },
      consequence: 'Air systems remain supported, but the greenhouse runs on reduced power.',
      scienceFactIds: ['NASA-DUST', 'NASA-ECLSS'],
    },
    {
      id: 'balanced-mode',
      label: 'Switch to balanced mode',
      preview: 'Save energy but slow food systems',
      effects: { energy: +11, food: -5, temperature: -5 },
      consequence: 'The base saves electricity, while growing and heating systems work less.',
      scienceFactIds: ['NASA-DUST'],
    },
  ],
};
```

**`+9` or `-18` means fictional game points**, not actual oxygen or energy units. The user should not see raw numerical forecasts without explanation; make choices predictable without making all correct answers obvious.

## 11. Integration smoke test contract
1. Import `MarsScene` and `useGameStore` without TypeScript errors.
2. `npm run build` exits zero.
3. Open Home → choose Level 1 → see six bars and 3D stage.
4. Pick option; one and only one `DecisionRecord` is added. Bar changes exactly once; consequence text displays.
5. `Continue` advances event, ending with `Mission Brief` after last event.
6. Repeat with Levels 2, 3 and 4; no blank page.
7. Resource values remain between 0 and 100.
8. In a narrow viewport, cards and choices remain usable; scene can shrink or collapse without trapping user.
9. Scene fallback is available if WebGL is unsupported; game decisions remain usable.

## 12. Automated verification
Keep existing `npm run build` and `npm run lint`. If dependencies are already available, add only **pure TypeScript tests** using a lightweight runner if the team agrees; otherwise test resource functions with temporary Node scripts and document exact manual results. Avoid adding entire testing frameworks during integration hour unless necessary.

Suggested test matrix: clamping 0/100; duplicate choice no double debit; event opening applied once; every event has 2+ unique option IDs; every science fact ID resolves; full four-level completion; nonviolent content.

## 13. Branch and PR rules
`feature/renad-3d`, `feature/malak-game-engine`, `feature/mohamed-ui`. Merge small PRs early; communicate API changes explicitly. PR must state: changed files, screenshot/video, build status, manual flow tested, known blockers. A single integrator (Renad) owns `main` merge coordination, not unilateral editing of coworkers' work. During high-risk final hours, freeze nonessential changes.

## 14. Dependency handoff schedule
- **H+1:** everyone reads this contract; Malak provides `types.ts` definition or the team copies the approved contract stub into `main`.
- **H+2:** frozen types and first `levels.ts` fixture merged; parallel development begins.
- **H+5:** Renad's `MarsScene` accepts test props; Mohamed's page imports stub while Malak implements full state.
- **H+8:** first end-to-end Level 1 complete.
- **H+12:** all four levels have authored events; 3D and UI integrated.
- **H+16:** final four-level smoke test and content/science copy review.
- **H+20:** release candidate lock; fixes only.
- **H+24:** demo script + publicly shareable build if deployment is available.
