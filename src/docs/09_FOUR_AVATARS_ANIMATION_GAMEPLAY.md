# Mars Base: Mission Control — Four-Avatar Playable Gameplay Specification

**Project:** Junior Astronaut Mission Trainer

**Target audience:** Children aged 7–15

**Status:** Canonical product specification; implementation status must be verified in code and browser tests

**Existing stack:** React + TypeScript + Vite + Three.js + React Three Fiber + Drei + Zustand

**Owners:** Mohamed (UI), Malak (game logic and science), Renad (3D scene and integration)

**Deadline:** Existing 24-hour hackathon clock; do not restart completed work

> **Precedence:** This specification supersedes prior passages that describe a single fixed astronaut appearance or treat all character animation as optional P2. [`10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md`](10_FULLSCREEN_GAMEPLAY_AND_PROGRESSION.md) is newer and supersedes this file wherever this file implies free access to every mission, a permanent dashboard/decision panel or inspection followed immediately by a choice. Preserve every existing level name, the six-resource model, Mission Brief, player movement and hotspot contracts, and all teammate-owned code.

## 1. Product vision and gameplay pillar

We are building a **playable, stylized 3D Mars adventure with an educational management layer**, not a dashboard with a decorative 3D picture. The child selects **one of four distinct astronaut avatars** before playing, moves the selected character around a shared Mars base, walks to equipment, investigates, interacts, solves short physical/logic tasks, makes resource decisions, watches the base react, and receives a supportive educational Mission Brief.

The experience should feel **responsive, vivid, safe, and fair**. “Realistic” means believable Mars-base equipment, coherent resource trade-offs, readable movement/interaction, and science-based explanations. It does **not** mean photorealistic rendering, simulated real survival measurements, or militarized combat. No death animations, gore, enemies, guns, jump scares, or punitive win/lose scenes.

**Canonical game loop:**

`Home → Choose one of 4 avatars → Confirm → Mission Library → unlocked level → full-viewport Mars world → Move / Explore → Scan → Collect / Carry / Install or Operate / Repair → contextual decision → resource + world changes → Mission Brief → unlock next level / Replay / Change avatar.`

The Library shows exactly four missions, but only Level 1 is unlocked on a fresh save. Valid completion unlocks the immediate next level. Avatar choice never changes progress. The mission world is full-viewport with a compact overlay HUD; fixed side columns are not gameplay.

The same **world map, controller, camera, equipment hotspots, and decision engine** serve all four levels. This reuse is essential for the schedule.

## 2. Four selectable 3D characters — P0

Exactly **four playable avatar options** are required. The selection changes visual identity only: identical movement speed, collision capsule, interaction radius, resources, abilities, puzzle difficulty, and consequences. Avoid gender- or body-based stereotyping or making one avatar “stronger.”

**Proposed fallback identities only; actual supplied models take precedence:**

| Stable ID (requires team approval) | Placeholder display name | Distinct fallback silhouette | Look |
|---|---|---|---|
| `avatar-01` | Nova | Round helmet + broad backpack | White / orange |
| `avatar-02` | Orion | Angular shoulder pieces + side canisters | White / blue |
| `avatar-03` | Lumi | Rounded backpack + compact antenna | White / purple |
| `avatar-04` | Comet | Tall visor + double utility pack | White / teal |

**IMPORTANT:** The user reports four existing 3D characters, possibly `.glb` files. Their actual files have **not been supplied here and are not in the published GitHub repository** as of the documentation audit. Do not invent their filenames, appearances, rigging status, embedded animations, or licensing. If the team has four supplied assets, use their actual names, appearances, and file mapping; this fallback roster is just a development fallback.

### Avatar-selection experience (Mohamed)

- Show a clear **Choose Your Astronaut** selection step before starting the first mission; the child must understand which avatar is selected.
- Present exactly 4 cards with names, previews (real model preview if available, otherwise distinct low-poly illustrations), short friendly descriptions, and a textual **Selected** indicator.
- Use large click/touch targets, keyboard navigation, clear focus styling, and a **Confirm Avatar** button.
- Provide **Change Avatar** in Mission Library; the selected avatar remains consistent across all four levels unless changed.
- Persist selection to a scoped `localStorage` key when available; initialize safely when storage is disabled, invalid, or cleared. No account/login/backend.
- To avoid breaking the existing frozen screen union, implement avatar choice as a Home overlay or local panel rather than adding a new Zustand `ScreenId`, unless the three developers approve a contract update.

## 3. GLB model intake and validation — P0 audit, P1 polish

`.glb` is an appropriate 3D delivery format for Three.js. However, **a model being `.glb` does not guarantee that it includes a rig or any AnimationClips.**

**Renad's audit checklist for each of 4 models:**

1. Obtain the real file and confirm usage rights, source, and filename; document provenance.
2. Verify it loads in the actual Vite app, using a known local path such as `public/models/avatars/` only after the file exists.
3. Check geometry, materials/textures, scale, forward direction, ground contact, up-axis, handedness, visibility, and bounding box.
4. Inspect `gltf.animations`: number and names of the actual embedded clips; note whether Idle, Walk, Interact, Celebrate are present, or absent.
5. Ensure visual height is normalized in a wrapper group, not by giving characters different movement collision capsules.
6. Test all four individually; don't let a failed model crash the scene. Use a unique, readable procedural low-poly fallback for the affected avatar.
7. Prefer load-on-selection or modest preload; avoid fetching all heavy assets unnecessarily. Record meaningful console/network errors.

Implementation references (existing libraries; no new engine):
- Drei GLTF loader: https://github.com/pmndrs/drei/blob/master/docs/loaders/gltf-use-gltf.mdx
- Drei animations: https://drei.docs.pmnd.rs/abstractions/use-animations

Use `useGLTF` for verified files, and `useAnimations` for embedded clips that actually exist. Map arbitrary embedded clip names to semantic actions, rather than assuming names. If clips are absent, produce **procedural mesh/group animation**, not an entirely static character or a blocked release. Optional rigging/retargeting through Blender or other tools is **not required** for P0.

## 4. Animation and game-feel requirements — P0

| Action state | Mandatory visible response | Allowed fallback |
|---|---|---|
| **Idle** | Subtle breathing/helmet bob, neutral facing | Slight procedural sway |
| **Walk** | Visible motion, direction-facing, stepping/arm swing | Procedural limbs / compact body bob |
| **Interact** | Short reaching/pointing posture as device opens | Group lean + arm raise + device highlight |
| **Celebrate** | Gentle success gesture as mission completes | Short hop/hand raise + UI star accent |
| **System alert** | Clear colored + textual device/HUD feedback | Emissive color/outline and text icon |

Requirements: frame-rate independent motion using `delta` from React Three Fiber, normalized diagonal speed, XZ travel and Y height, smooth fixed-angle isometric follow camera, map bounds and simple obstacle collision. Stop walking animation when input stops; transition between animations cleanly; respect `prefers-reduced-motion` (keep essential information in text/pose even when motion is reduced). Disable gameplay key handling while a decision dialog/interactive input has keyboard focus, preventing accidental E repeats or movement behind the modal.

**Minimum fun feedback:** PIP character guidance, readable nearby indicator (“Press E to inspect”), an animated/highlighted target device, immediate control response, small reaction when selecting an option, resource bar changes with explanatory text, visible machine status after choices, and a short gentle celebration before the Mission Brief. No forced countdown, flickering lights, loud emergencies, or frightening visuals.

## 5. Level-by-level spatial gameplay

These are gameplay objectives built from the SAME hotspot + decision primitives. Keep exact existing four level titles and six-resource keys.

### Level 1 — First Day on Mars
**Learning:** Oxygen, Water, Food, Energy.

**Gameplay:** Tutorialize movement and approaching a system; visit Habitat, Oxygen, Water and Greenhouse/Solar landmarks, inspect short explanations, choose three meaningful setup decisions. PIP introduces one control at a time and provides wayfinding. The avatar performs an interaction pose.

**Feedback:** each visited system lights up as checked; the six-resource HUD responds; gentle onboarding brief.

### Level 2 — Power Crisis
**Learning:** Dust storms, solar energy and life-support prioritization.

**Gameplay:** Walk to Solar Array, inspect dust-affected panels, choose backup power / limit usage / prioritize essential systems; optional very short switch-routing step using existing UI choices.

**Feedback:** dust tint (low cost), panel indicator change, energy consequences, short scientific explanation.

### Level 3 — Oxygen Emergency
**Learning:** Oxygen leak detection, reserves and trade-offs.

**Gameplay:** Follow clues from Habitat to Oxygen Unit, inspect warning, select repair / reserve / temporary conservation; optional valve-identification prompt.

**Feedback:** tank status and resource changes, non-punitive lessons in Mission Brief.

### Level 4 — Mars Survival Challenge
**Learning:** Interconnected resource decisions across Oxygen, Water, Food, Energy, Radiation Protection, Temperature Control.

**Gameplay:** Visit several physical hotspots, prioritize competing risks, make multiple decisions with consequences that carry through the level; allow replay with different strategies.

**Feedback:** progressively changing system lights, supporting PIP messages and cumulative Mission Brief with NASA links.

**No artificial “60-minute” waiting:** the targeted 60+ minute full game requires timed playtesting and optional meaningful content. Do not claim that duration as implemented until measured. Prefer a robust shorter playable version to empty repetitive tasks.

## 6. Shared integration contract — PROPOSED ONLY, REQUIRES TEAM APPROVAL

The existing frozen APIs are the source of truth. Do **not** silently change them. The smallest additive proposal is:

```ts
// Malak-owned src/game/types.ts (only after agreement)
export type AvatarId = 'avatar-01' | 'avatar-02' | 'avatar-03' | 'avatar-04';
export interface AvatarDefinition {
  id: AvatarId;
  displayName: string;
  description: string;
  accentColor: string;
  modelUrl?: string; // only for verified available files
}
// Malak-owned src/data/avatars.ts: avatars: readonly AvatarDefinition[]

// Renad-owned MarsSceneProps (optional; preserves existing props)
avatarId?: AvatarId; // default avatar-01 if omitted
```

Document 10 additionally proposes campaign-completion state, physical interaction steps, a task-completion action and optional scene task/input signals. Every one of those additions is **REQUIRES TEAM APPROVAL**. Reuse an already approved lean contract if one exists; do not create parallel stores, duplicate controllers or silently expand `MarsSceneProps`.

Mohamed holds local avatar-selection state and passes the chosen ID into MarsScene **after** this optional prop is approved. Malak owns canonical metadata/IDs and mission logic, not 3D. Renad owns model rendering, animation state and controls; the scene **must not calculate resources**. Existing `onInspect(hotspotId)`, `chooseOption(optionId)`, `continueMission()`, `MissionEvent.hotspotId`, screens, and resource keys remain unchanged.

Existing flow remains: correct active hotspot approached → E → `onInspect(hotspotId)` → UI reveals choices → one call to `chooseOption()` → show consequence → `continueMission()` → next objective or Brief. For wrong hotspot, show optional description without resolving current event. UI fallback must allow accessible progress without WebGL.

If there is a desire for a continuous nearby-hotspot prompt in React (rather than the 3D scene), an optional `onNearbyHotspotChange?` callback is a separate **REQUIRES TEAM APPROVAL** proposal; do not let agents invent incompatible signatures.

## 7. Assignments and ownership (incremental; preserve existing work)

| Owner | Task IDs | Priority | Owned paths | Acceptance |
|---|---|---|---|---|
| **Mohamed** | MOH-09 / MOH-10 | P0 | `src/App.tsx`, `src/pages/**`, `src/components/ui/**`, `src/styles/**`, `src/index.css` | Four-avatar selection and confirmation before Library; selection persists and chosen identity displays in Gameplay |
| **Mohamed** | MOH-11 | P0 | UI-only | Motion instructions, objective/interaction prompt, accessible decision overlays, responsive feedback; no resource math |
| **Malak** | MAL-09 | P0 after agreement | `src/game/types.ts`, `src/data/avatars.ts` | Four stable IDs/metadata; no fabricated model paths |
| **Malak** | MAL-10 | P0 | `src/data/**`, `src/game/**` | Four spatial missions mapped to correct hotspots; decision effects once, genuine Briefs |
| **Renad** | REN-09 / REN-10 | P0 | `src/scene/**`, optional `public/models/avatars/**` | Chosen avatar renderer; GLB inventory; four distinct playable fallbacks |
| **Renad** | REN-11 / REN-12 | P0 | Scene-owned only | Basic idle/walk/interact/celebrate, camera, movement, collision, E interaction for each avatar |
| **Renad** | REN-13 | P1 | Scene-owned only | Lightweight dust and equipment VFX after P0 is stable |

**One controller, four appearances**; not four independent gameplay systems. No changes to teammates' owned files by another agent without explicit coordination.

## 8. Next available integration gates (do not reset the 24-hour clock)

1. **Contract sync:** all three approve four AvatarIds and optional `avatarId` prop (or document an alternative); Malak publishes canonical definitions first.
2. **Parallel implementation:** Mohamed adds picker to completed UI; Renad validates GLB files/fallbacks and animation states; Malak maps hotspots and objectives, retaining existing store behavior.
3. **Vertical-slice demo:** Home → Avatar 3 → Power Crisis → character moves → Solar Panels → E → one decision → resource/world feedback → Continue → Brief.
4. **All-four regression:** test every avatar in one level, and all four levels with at least one selected avatar. Test keyboard input focus, mobile layout, offline/failed GLB path, and WebGL fallback.
5. **Polish:** additional imported animation clips, subtle dust/energy effects, SFX, touch controls if time remains. No open world, new engine or complex rigging during critical integration.

**P0:** Four selections, four distinct appearances, basic animation, single-world real movement, proximity/E, six resources, four levels, debrief, fallback, build and browser test. **P1:** full GLB polish if assets support it, optional short puzzles, smoother blending, touch joystick and sounds. **P2:** voice acting, cinematics, photorealism, new environments, custom advanced rigs.

## 9. QA acceptance matrix (real browser testing required)

- **QA-037** Four distinct preview cards appear before starting; selection works via keyboard/mouse.
- **QA-038** Confirm and Change Avatar work; selected identity is visibly indicated.
- **QA-039** Correct chosen avatar appears inside 3D scene and persists across levels.
- **QA-040** All avatars move equally with WASD/arrows, correct follow camera and collision.
- **QA-041** Idle/Walk/Interact/Celebrate are visually distinguishable; animations do not remain stuck.
- **QA-042** Actual GLB files validated individually; missing/corrupt/clip-less models use distinct fallbacks.
- **QA-043** E only works near correct hotspot; wrong system cannot resolve event; repeated E/choice cannot double-apply resources.
- **QA-044** Dialog focus suppresses game controls appropriately.
- **QA-045** Four levels include physical exploration, decisions, feedback and Mission Brief.
- **QA-046** Reduced motion and WebGL fallback work; desktop/mobile layout readable.
- **QA-047** `npm run build` and `npm run lint` pass after integration; console errors and asset 404s checked.
- **QA-048** Complete-game time actually measured; no invented 60-minute claim.

**Required demo:** Choose Avatar 3 → enter Power Crisis → walk to Solar Array → E → decision → resource update once → objective advances → Mission Brief → return/change avatar.

## 10. Agent implementation boundary

Before changing code, each AI coding agent must inspect the current repo, read this document and `02_TECHNICAL_CONTRACTS.md`, retain file ownership, and ask the team to agree on the additive avatar contract. Do not reset branches, alter other owners' modules, or promise 3D/GLB/animation features without real browser evidence. Implement in small patches and record what is real versus mocked.
