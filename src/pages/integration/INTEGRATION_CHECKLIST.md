# UI Integration Checklist

This folder is Mohamed-owned integration glue. It does not define Malak's or Renad's shared runtime API. The bridges translate approved teammate exports into the UI projections in this folder.

## Audit snapshot — 14 November 2026

- UI milestone: `e985a8a599f614315f49ffad270fb6b3219413b5`.
- Renad's PR #1 is merged on `origin/main` at `a452d28`; `origin/feature/renad-3d` is also visible.
- Malak's game-engine branch and implementation are not available on `origin`.
- This UI branch still has no local `src/game/**` or `src/scene/**` because `origin/main` has not been merged.
- `gameUi.ts` therefore uses `pages/__stubs__/gameAdapter.ts`.
- `sceneUi.tsx` therefore uses `pages/__stubs__/MarsSceneAdapter.tsx`.
- The CSS scene is visibly labeled **UI SCENE FALLBACK** and is not accepted as completed 3D gameplay.

## Known contract mismatches

| Area | Frozen/approved contract | Current fallback | Integration action |
|---|---|---|---|
| Store hook | `useGameStore(selector)` with frozen screen/resources/actions | Compatible local external-store fixture | Replace only the bridge after inspecting Malak's actual export path and selector behavior |
| Progression | Exact persistent shape is not approved | In-session `completedLevelIds`; guarded `selectLevel` | Map Malak's approved selector/state into the UI projection; remove fixture rule ownership |
| Completion | Malak owns valid completion and Stabilization behavior | Fixture marks a reviewed final event complete | Verify actual completion signal; no Brief-only unlock |
| Mission data | Four levels and `MissionEvent.hotspotId` are frozen | Local data fixture | Map actual data exports; compare all IDs before wiring |
| Scene | `levelId`, `status`, `highlightedHotspot`, `onInspect`, `reducedMotion` | CSS pointer-based fallback | Inspect Renad's actual default/named export and props before changing bridge |
| Avatar | Optional scene `avatarId` is proposed | Fallback accepts the UI's selected ID | Connect only after team approval and actual scene support |
| Input lock | Proposed, **REQUIRES TEAM APPROVAL** | UI modal uses inert background, focus trap and capture-phase key suppression | Prefer Renad's approved input-lock mechanism when available; do not guess its name |
| Proximity | Scene owns proximity and debounced E | Fallback exposes direct hotspot buttons | Verify real scene calls `onInspect` only for the nearby target and once per press |
| Physical tasks | New task steps/signals require approval | Presentation note only; no completion is fabricated | Wait for Malak task state/action and Renad world interaction signals |

## Actual `origin/main` MarsScene audit

Renad's `src/scene/MarsScene.tsx` exports a default component and this exact public prop shape:

```ts
interface MarsSceneProps {
  levelId: LevelId
  status: SceneStatus
  highlightedHotspot?: HotspotId
  onInspect?: (hotspotId: HotspotId) => void
  reducedMotion?: boolean
}
```

- The frozen scene props match the required subset of `MarsSceneUiProps`.
- There is no `avatarId`; selected identity remains in the HUD, but the real astronaut cannot yet reflect the chosen appearance.
- There is no `inputLocked`/`inputEnabled` prop.
- `useSceneKeyboard()` attaches movement/E listeners directly to `window`. DOM `inert` and the modal overlay do not guarantee that those global listeners stop or clear held movement, so scene-level input locking is still **REQUIRES TEAM APPROVAL**.
- The scene owns proximity, uses the seven frozen hotspot IDs, debounces E, supports pointer inspection and touch controls, and calls `onInspect(id)` without mutating the game store.
- The real scene has a WebGL/error text fallback, but it does not provide the UI's accessible task/decision flow by itself.
- `MarsScene.tsx`, `MarsBase.tsx`, `PlayerRig.tsx`, `SceneAtmosphere.tsx`, `SceneHotspot.tsx`, `sceneConfig.ts` and the scene preview import `../game/types` or its equivalent. `src/game/types.ts` is missing on `origin/main`, so the merged main scene cannot compile until Malak publishes the approved frozen types.

## Minimum safe real-scene switch

1. Malak publishes the approved `src/game/types.ts` with the frozen `LevelId`, `SceneStatus` and `HotspotId` definitions; verify Renad compiles against it.
2. Commit all UI work, then update this branch from `origin/main` without force/reset. The current main delta only adds `src/scene/**`, so no tracked-path overlap is expected, but normal merge review remains required.
3. Change only `sceneUi.tsx` to import the real default `src/scene/MarsScene` and adapt the UI port. Strip/ignore UI-only `avatarId` until Renad supports the approved prop; do not pass an unknown prop silently.
4. Keep the selected avatar visible in the HUD and keep the CSS scene fallback available as a recoverable UI fallback until real-scene browser QA passes.
5. Coordinate an approved input-lock prop or equivalent resettable control with Renad before enabling the decision modal over a live scene.
6. Change the visible integration status from fallback to real only after movement, proximity, E debouncing, modal locking, WebGL fallback and responsive Canvas tests pass.

## Safe branch update plan

- [ ] Confirm `git status` has no uncommitted integration work; preserve the untracked documentation file.
- [ ] Fetch and inspect the latest `origin/main` and Malak branch commit SHAs.
- [ ] Require the approved game types before attempting a build with Renad's scene.
- [ ] Merge `origin/main` normally into `feature/mohamed-ui`; do not reset, rebase shared history, force-push or auto-resolve conflicts.
- [ ] Review every merge result before committing; stop and report any overlapping teammate file.
- [ ] Run build/lint immediately before changing either bridge.
- [ ] Switch one bridge at a time, then run focused browser QA.

## Malak integration gate

- [ ] Fetch the actual branch and record commit SHA.
- [ ] Locate the real store, mission data, resource metadata and science exports.
- [ ] Compare real TypeScript shapes with `GameUiState`; report mismatches before editing.
- [ ] Confirm locked `selectLevel(id)` is rejected in game logic, not only disabled in UI.
- [ ] Confirm fresh/corrupt/blocked storage behavior and versioned persistence.
- [ ] Confirm replay preserves completed/unlocked progress.
- [ ] Confirm Stabilization and opening a Brief do not falsely unlock a level.
- [ ] Confirm `chooseOption` and `continueMission` idempotence and final completion semantics.
- [ ] Adapt only `gameUi.ts`; remove fixture imports only after build and browser regression.

## Renad integration gate

- [ ] Fetch the actual branch and record commit SHA.
- [ ] Locate the real scene export and inspect its real props; do not infer names.
- [ ] Confirm full-viewport Canvas sizing without CSS scale distortion.
- [ ] Confirm all hotspot IDs match mission data.
- [ ] Confirm proximity, E debouncing and pointer interaction call `onInspect` correctly.
- [ ] Agree an input-lock signal before depending on one (**REQUIRES TEAM APPROVAL**).
- [ ] Confirm selected avatar support only if the optional prop was approved.
- [ ] Confirm reduced-motion, WebGL failure and model failure behavior.
- [ ] Adapt only `sceneUi.tsx`; retain the labeled fallback until the real scene passes QA.

## Final integration regression

- [ ] Avatar selection/persistence/change-avatar remain intact.
- [ ] Fresh Library shows L1 ready and L2–L4 locked.
- [ ] Locked mission cannot start by click, keyboard or direct store call.
- [ ] Explore → inspect → decision → consequence → continue returns focus safely.
- [ ] Modal blocks pointer, focus and gameplay keys behind it.
- [ ] Valid completion unlocks exactly one next level; replay keeps progress.
- [ ] Mission Brief uses real history and sources.
- [ ] Desktop, laptop, tablet and 360px layouts remain usable.
- [ ] Real scene—not fallback—is verified before claiming 3D completion.
- [ ] `npm run build`, `npm run lint` and `git diff --check` pass.

## Tests

The repository currently has no test runner or `test` script. The bridges use TypeScript `satisfies` checks so `npm run build` performs a focused structural compatibility check without adding a dependency. Add runtime tests only when the team selects existing test tooling or an approved lightweight runner.
