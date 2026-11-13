# RENAD — 3D WORLD, ENGINEERING LEAD & INTEGRATION
**Branch:** `feature/renad-3d`  
**Primary paths:** `src/scene/**` and integration docs.  
**Read first:** `10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md`, `00_START_HERE.md`, `02_TECHNICAL_CONTRACTS.md`, `06_24_HOUR_RUNBOOK.md`.

## Your mission
Build a beautiful-enough **interactive 3D Mars base**, with one reusable isometric scene. Keep it light and stable in the browser. You are also the integration captain: coordinate merges and verify the product, without overwriting teammates' files.

## Definition of done
- R3F `<Canvas>` renders a Martian ground plane and six recognisable mission systems: Habitat, Solar Array, Water Recycler, Oxygen Unit, Greenhouse, Communications Dish; the optional rover uses the existing `rover` hotspot ID.
- One reusable controller renders the selected one of four distinct astronaut appearances and moves it with WASD/arrow keys on X/Z using frame delta; Y remains height. Diagonal speed is normalized and identical for all avatars.
- An isometric/orthographic camera follows the astronaut smoothly while preserving a readable view. Lighting is clean and performance acceptable on a normal laptop browser.
- Basic collision/map bounds keep the player in the playable area and prevent walking through major system landmarks.
- Proximity highlights the nearby relevant system and `E` calls the existing `onInspect(hotspotId)` once per press.
- Props follow the `MarsSceneProps` contract exactly. Scene supports `normal`, `dust`, `oxygen_alert`, `radiation_alert`, `restored` through lightweight visual changes.
- Pointer inspection and `E` interaction call the same `onInspect` path. Missed input never prevents gameplay because Mohamed owns an accessible UI fallback.
- Real supplied models are preferred only after filename, rights, geometry, scale, orientation and clips are verified. Missing/unusable assets fall back to four distinct primitive-built astronauts; no paid asset or complex custom rig is required.
- Idle, Walk, Interact and Celebrate are P0 visible states for all four appearances, using verified clips or procedural fallbacks.
- No changes to Malak's store/types or Mohamed's page code without explicit discussion.
- The merged product builds and opens on the same repo without a fresh setup.

## Task board

| ID | Priority | Description | Owned files | Dependencies | Acceptance criteria | Integration handoff |
|---|---|---|---|---|---|---|
| REN-01 | P0 | Preserve the existing Vite/R3F foundation and establish the reusable scene baseline. | `src/scene/**` | Current `package.json`; shared types | Existing project builds without a new engine/framework and renders one reusable Canvas. | Report baseline/build results; request shared import edits from the owner. |
| REN-02 | P0 | Build one low-poly Mars map with terrain and consistent system locations. | `src/scene/**` | GDD landmark list and `HotspotId` union | Six mission systems are recognizable and all four levels reuse the same map. | Give Malak the final hotspot-to-landmark checklist and Mohamed a screenshot/layout note. |
| REN-03 | P0 | Add one reusable astronaut with WASD/arrow movement. | `src/scene/**` | Scene update loop | Movement is delta-time based on X/Z, diagonal input is normalized, Y remains height, and key release stops movement. | Document controls and measured speed behavior for Mohamed's instructions and QA. |
| REN-04 | P0 | Implement isometric follow camera plus map bounds/basic landmark collision. | `src/scene/**` | Astronaut transform and map extents | Camera follows smoothly without player camera controls; astronaut cannot leave bounds or pass through major systems. | Share map bounds/collision limitations with QA; no store changes. |
| REN-05 | P0 | Implement proximity detection, relevant-system highlight and `E` interaction through the frozen props. | `src/scene/**` | `highlightedHotspot`; active event mapping supplied by Malak; `onInspect` supplied by Mohamed | Nearby relevant system is highlighted, prompt is visible, and one `E` press calls `onInspect` once with the correct ID. Holding/repeating `E` does not create decisions. | Provide Mohamed callback behavior and coordinate the prompt presentation; any continuous proximity callback is **REQUIRES TEAM APPROVAL**. |
| REN-06 | P0 | Apply scene status feedback and preserve fallback behavior. | `src/scene/**` | `SceneStatus`, `reducedMotion` | `normal`, `dust`, `oxygen_alert`, `radiation_alert`, `restored` remain lightweight; scene never owns resource logic; UI fallback works if Canvas fails. | Supply status screenshots and failure behavior to Mohamed. |
| REN-07 | P0 | Integrate reviewed branches without overwriting teammate ownership and run all four levels. | `src/scene/**`; integration changes only after owner approval | Mohamed UI PR; Malak engine/data PR | Movement → proximity → `E` → matching decision → one consequence → Continue works in each mission. | Log exact import/API blockers for the owning teammate; coordinate PR review before main merge. |
| REN-08 | P1 | Improve animation blending, system highlights, dust effects, touch controls and sound only after P0 is stable. | `src/scene/**`, optional `public/models/**` | Passing P0 regression and performance check | Enhancements preserve controls, reduced motion, frame rate and build; no large-world or cinematic scope before core completion. | Deliver performance notes and final demo fallback; do not rewrite UI/game logic. |
| REN-09 | P0 audit | Inventory the actual four GLB assets if supplied; never invent names or clips. | `src/scene/**`, optional verified `public/models/avatars/**` | Asset files and usage-rights information from the team | Each real file has recorded provenance, filename, load result, bounds, scale, orientation, materials and actual animation clips; unverified assets stay outside runtime mapping. | Give Malak only verified optional model paths and Mohamed representative preview/fallback guidance. |
| REN-10 | P0 | Render the approved selected `AvatarId` with four distinct procedural fallbacks and one controller. | `src/scene/**`, optional verified `public/models/avatars/**` | Approved Avatar contract; REN-09 | Correct choice appears; each failed/missing model falls back distinctly; all choices share speed, capsule, interaction radius and controls. | Publish ID→renderer mapping and failure behavior; do not alter selection UI or game state. |
| REN-11 | P0 | Implement semantic Idle/Walk/Interact/Celebrate states using real clips when verified and procedural motion otherwise. | `src/scene/**` | REN-10; actual `gltf.animations` audit | Four states are visible, transition without sticking, stop correctly, respect reduced motion and never block gameplay when clips/rigs are absent. | Share semantic-state behavior and clip audit with Mohamed/QA; UI does not control clip names. |
| REN-12 | P0 | Integrate avatar feedback with movement, modal focus, equipment interaction and mission completion. | `src/scene/**` | Existing controller/camera/proximity; Mohamed focus state; mission completion signal available through agreed integration | Walk tracks actual input, Interact fires once with `E`, Celebrate is friendly/brief, and movement/E are suppressed while decision inputs own focus. | Report any missing completion/focus signal as **REQUIRES TEAM APPROVAL** rather than adding an export silently. |
| REN-13 | P1 | Add equipment-state animation, subtle dust/energy feedback and better blending after the four-avatar P0 passes. | `src/scene/**` | Full P0 browser regression | VFX remain lightweight, child-friendly and reduced-motion safe; no paid assets, new engine or photorealism dependency. | Deliver performance/asset notes for release review. |
| REN-14 | P0 | Make the real Canvas support a full-viewport gameplay stage with overlay-safe composition. | `src/scene/**` | Mohamed's viewport container and HUD safe regions | Canvas fills its gameplay host at desktop and 360px without creating a second world; fallback remains available and clearly labeled. | Share resize/performance behavior; do not edit Mohamed's layout files. |
| REN-15 | P0 after approval | Implement reusable 3D scan and collect/carry/install interactions. | `src/scene/**` | Approved current-step/item signals from Malak | Correct proximity + E produces scan feedback; one visible item can be picked up, carried and installed; wrong target is non-destructive; repeat input is idempotent. | Emit only approved intent/completion signals. New props/callbacks are **REQUIRES TEAM APPROVAL**. |
| REN-16 | P0 after approval | Implement one reusable operate/repair interaction and visible system success state. | `src/scene/**` | Approved task signal; REN-15 controller/input guards | Child can hold/operate without reflex timer, sees equipment and avatar response, and input stops behind contextual UI. | Publish task-state behavior to Mohamed/Malak; do not mutate store/resources in scene. |

## Look-and-feel specification
- Terrain: flat low-poly/smooth orange-red ground (#A85237 or similar) with 10–20 rock primitives, not realistic sand simulation.
- Habitat: short cylinder + half-sphere dome in light gray/white with sky-blue portholes.
- Solar: a row of blue rectangular tilted planes; look different from the greenhouse.
- Oxygen: white vertical tank(s), cyan gauge and oxygen icon marker.
- Water: turquoise tank and compact pipe; greenhouse: translucent dome with green plant cones; communications: dish and slender antenna.
- Space sky: dark navy or light dusty Mars sky depending performance; no photo texture requirement.
- Characters: four distinct appearances with clear forward direction, identical normalized WASD/arrow input on X/Z and one frame-delta controller. Verified GLB clips may drive animation; procedural motion is mandatory fallback. Advanced custom rigging belongs to P2.
- Camera: approx elevation 35–45°, perspective isometric-like, follows the player with a stable offset; manual rotate disabled unless necessary for usability.
- Scene lighting: one ambient + one directional; do not add shadow maps and postprocessing until after H+16.
- Alert: use status-based emissive accents, subtle dust fog/tint, or pulsing beacon with reduced-motion fallback.
- No visually threatening disasters; PIP's messages convey urgency without fear.

## Integration instructions
1. Clone exact repo: `git clone https://github.com/Renad-Hazem/junior-astronaut-mission-trainer.git`.
2. `cd junior-astronaut-mission-trainer && npm ci && npm run build`.
3. `git checkout -b feature/renad-3d` from up-to-date main.
4. Only create/edit `src/scene/**` until shared types are merged.
5. Expose default `MarsScene` that can be imported as `import MarsScene from './scene/MarsScene'` in `src/App.tsx` or under a page (correct relative path as needed).
6. Share a short integration snippet with Mohamed, including required props.
7. Submit PR with screenshot, tested browser, performance notes and no unrelated file changes.
8. After merged, coordinate Malak and Mohamed PRs; run all-four-level smoke test.

## Fallbacks when blocked
- Missing/unusable GLB: use the matching distinct low-poly fallback; all four choices, movement and P0 animation states remain available.
- No asset downloads: basic meshes are adequate.
- WebGL issue: Mohamed must show `Mars base preview unavailable` and an accessible controlled equivalent of inspection and physical tasks; fallback must not silently auto-complete the mission.
- 3D scene taking too long: keep all six required systems as simple primitives and cut decorative rocks, advanced animation, shadows and effects before cutting movement/interaction.
- Conflicting `App.tsx`: Mohamed is owner; request import change rather than silently replacing it.

## AI implementation prompt — copy directly into Claude Code/Codex
```text
You are implementing ONLY Renad's responsibilities in the existing
Renad-Hazem/junior-astronaut-mission-trainer repository.
Inspect the repo first; it already uses React 19, TypeScript, Vite,
Three.js, @react-three/fiber, @react-three/drei and Zustand.
Read docs/02_TECHNICAL_CONTRACTS.md (or the supplied contract).
Work on feature/renad-3d; do not touch src/game/**, src/data/**,
src/pages/** or src/App.tsx without explicit approval.
Implement a lightweight reusable MarsScene with primitive low-poly
terrain, habitat, solar, water, oxygen, greenhouse, communications,
one controllable astronaut, normalized delta-time WASD/arrow movement,
X/Z travel, an isometric follow camera, map bounds/basic collision,
proximity highlight/prompt and E-key interaction. Call the existing
onInspect(hotspotId) once per interaction and adhere exactly to
MarsSceneProps and scene status values from the contract.
Avoid extra dependencies, remote assets, complex animation, runtime NASA APIs,
backend or account systems. Make small commits only after validation.
Run npm run build and npm run lint where possible. Report changed files,
actual test results and any issue requiring a teammate. Never fabricate
successful tests, deployed links or edits.
```

## Acceptance checklist
- [ ] TypeScript import compiles on `main`
- [ ] Screen does not go black on status change
- [ ] Same scene reused for all four levels
- [ ] Six required base systems are visible and mapped to the correct hotspot IDs
- [ ] WASD/arrows move equally; diagonal movement is normalized and frame-rate independent
- [ ] Camera follows; player remains inside bounds and outside major system geometry
- [ ] Nearby relevant system highlights and `E` calls `onInspect` once
- [ ] Exactly four appearances use one controller and identical gameplay parameters
- [ ] Idle/Walk/Interact/Celebrate work through verified clips or procedural fallback
- [ ] Missing/corrupt/clip-less GLB never crashes or blocks a mission
- [ ] Correct `onInspect` IDs
- [ ] Keyboard/mouse choices remain usable when the Canvas is absent
- [ ] PR has no unauthorized edits to team-owned paths
