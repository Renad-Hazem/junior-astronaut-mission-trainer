# RENAD — 3D WORLD, ENGINEERING LEAD & INTEGRATION
**Branch:** `feature/renad-3d`  
**Primary paths:** `src/scene/**` and integration docs.  
**Read first:** `00_START_HERE.md`, `02_TECHNICAL_CONTRACTS.md`, `06_24_HOUR_RUNBOOK.md`.

## Your mission
Build a beautiful-enough **interactive 3D Mars base**, with one reusable isometric scene. Keep it light and stable in the browser. You are also the integration captain: coordinate merges and verify the product, without overwriting teammates' files.

## Definition of done
- R3F `<Canvas>` renders a Martian ground plane and at least five recognisable modules: Habitat, Solar Array, Water Recycler, Oxygen Unit, Greenhouse, Communications Dish.
- A fixed isometric/orthographic camera shows important modules at a glance. Lighting is clean, performance acceptable on a normal laptop browser.
- Props follow the `MarsSceneProps` contract exactly. Scene supports `normal`, `dust`, `oxygen_alert`, `radiation_alert`, `restored` through lightweight visual changes.
- At least one clicked hotspot calls `onInspect('solar')` or another valid hotspot. Missed clicks never prevent gameplay (UI fallback exists).
- No real asset downloads or complex animated astronaut required for MVP; use Three.js mesh primitives with distinct silhouettes.
- No changes to Malak's store/types or Mohamed's page code without explicit discussion.
- The merged product builds and opens on the same repo without a fresh setup.

## Your P0 task board
| ID | Duration target | Priority | Task & acceptance |
|---|---:|---|---|
| REN-01 | 0–1h | P0 | Pull repo, run `npm install` / `npm run build`, confirm starter baseline; do NOT recreate Vite |
| REN-02 | 1–2h | P0 | Create `src/scene/MarsScene.tsx` and render Canvas with ambient light, camera, orange terrain |
| REN-03 | 2–4h | P0 | Add landmark components using primitives, consistent proportions and no missing imports |
| REN-04 | 4–5h | P0 | Expose props `levelId`, `status`, `highlightedHotspot`, `onInspect`, `reducedMotion` |
| REN-05 | 5–7h | P0 | Implement click handlers and simple scene-state tint/warning, no expensive postprocessing |
| REN-06 | 7–9h | P0 | Merge to `main` once TypeScript and site build pass, provide interface/screenshot to Mohamed |
| REN-07 | 12–18h | P0 | Integration captain: run levels end-to-end, coordinate PR review and fix import conflicts |
| REN-08 | 18–24h | P0 | Verify final production build and deployed link (if available), prepare live demo fallback |

## Look-and-feel specification
- Terrain: flat low-poly/smooth orange-red ground (#A85237 or similar) with 10–20 rock primitives, not realistic sand simulation.
- Habitat: short cylinder + half-sphere dome in light gray/white with sky-blue portholes.
- Solar: a row of blue rectangular tilted planes; look different from the greenhouse.
- Oxygen: white vertical tank(s), cyan gauge and oxygen icon marker.
- Water: turquoise tank and compact pipe; greenhouse: translucent dome with green plant cones; communications: dish and slender antenna.
- Space sky: dark navy or light dusty Mars sky depending performance; no photo texture requirement.
- Camera: approx elevation 35–45°, perspective isometric-like, rotate disabled unless necessary for usability.
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
- No fancy astronaut: show small white/orange capsule-shaped marker instead.
- No asset downloads: basic meshes are adequate.
- WebGL issue: Mohamed must show `Mars base preview unavailable` and keep 2D UI decisions playable.
- 3D scene taking too long: stop after terrain + 5 landmarks and ship.
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
fixed-angle camera and simple click hotspots. Adhere exactly to
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
- [ ] At least five distinct base modules visible
- [ ] Correct `onInspect` IDs
- [ ] Keyboard/mouse choices remain usable when the Canvas is absent
- [ ] PR has no unauthorized edits to team-owned paths
