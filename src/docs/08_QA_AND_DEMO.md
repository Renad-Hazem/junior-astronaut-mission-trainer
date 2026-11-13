# QUALITY ASSURANCE, RELEASE GATES & DEMO SCRIPT

## 1. Four-level acceptance matrix
| ID | Test | Expected behavior | Owner |
|---|---|---|---|
| QA-001 | Open site (desktop) | Home renders, no blank screen | Mohamed + Renad |
| QA-002 | Open Mission Library | Exactly four Mars missions visible in intended order | Mohamed |
| QA-003 | Start L1 | All six resources rendered; four essential bars explained | Malak + Mohamed |
| QA-004 | Choose L1 oxygen option | Oxygen increases and relevant other resource(s) decrease as authored; consequence shown | Malak |
| QA-005 | Double-click option rapidly | Effects applied only once | Malak |
| QA-006 | Press Continue | Moves one event forward; no skipped steps | Malak + Mohamed |
| QA-007 | Finish L1 | Mission Brief with before/after resources and NASA fact | Mohamed + Malak |
| QA-008 | Play L2 dust event | Energy impact shown once and scene visibly changes | Renad + Malak |
| QA-009 | Play L3 oxygen leak | Leak solution choices differ; non-punitive feedback | Malak |
| QA-010 | Finish L4 | Combined resource report and supportive completion | Malak + Mohamed |
| QA-011 | Force oxygen/resource to 0 | Stabilization Protocol and replay; no death scene | Malak |
| QA-012 | Resource near 100 or 0 | Values clamp to 0–100 | Malak |
| QA-013 | Click scene hotspot | Correct panel opens; a non-3D fallback remains | Renad + Mohamed |
| QA-014 | Narrow browser 360px | Buttons remain visible and tappable, bars readable | Mohamed |
| QA-015 | Keyboard-only navigation | Can choose decision, continue, access brief without 3D click | Mohamed |
| QA-016 | Browser without working WebGL | Educational game still playable with fallback panel | Renad + Mohamed |
| QA-017 | `npm run build` | TypeScript & Vite build exits 0 | Renad |
| QA-018 | `npm run lint` | No new lint errors (or existing ones documented explicitly) | All |
| QA-019 | Science links | Every linked NASA URL is official, no fake live data | Malak |
| QA-020 | Full playthrough | Four levels finish without forced waiting / unhandled exception | All |
| QA-021 | Hold/press W, A, S, D separately | Astronaut moves in the expected world direction on X/Z; Y remains height | Renad |
| QA-022 | Use all four arrow keys | Arrow keys produce the same movement directions and speed as WASD | Renad |
| QA-023 | Compare straight vs diagonal movement | Normalized diagonal movement does not travel faster than straight movement over the same time | Renad |
| QA-024 | Compare movement across frame rates | Delta-time movement covers approximately the same distance at low and high frame rates | Renad |
| QA-025 | Walk across the map | Isometric camera follows smoothly and keeps the astronaut readable | Renad |
| QA-026 | Walk toward every map edge and major landmark | Player remains inside map bounds and does not pass through required system geometry | Renad |
| QA-027 | Approach the current event's system | Relevant system highlights and a nearby `Press E to inspect` prompt appears | Renad + Mohamed |
| QA-028 | Press `E` near current system | `onInspect` returns the correct `MissionEvent.hotspotId` and matching decision panel appears | Renad + Mohamed + Malak |
| QA-029 | Press `E` away from systems / at wrong system | No unrelated decision opens and no resources change; safe descriptive feedback is allowed | Renad + Mohamed |
| QA-030 | Hold or rapidly repeat `E` | Inspection/decision is not duplicated and no option is automatically selected | Renad + Mohamed |
| QA-031 | Choose one option after inspection | `chooseOption(optionId)` applies opening + option effects exactly once | Malak + Mohamed |
| QA-032 | Press Continue after reading consequence | Advances exactly one objective and updates the highlighted hotspot; final event opens Mission Brief | Malak + Mohamed + Renad |
| QA-033 | Complete all four levels through movement + interaction | Every mission uses the same map/controller and ends in the correct real-history Mission Brief | All |
| QA-034 | Disable WebGL or force scene error | Inspect System fallback permits decision, consequence, Continue and Mission Brief without a crash | Mohamed + Renad |
| QA-035 | Production build and lint | `npm run build` and `npm run lint` exit successfully or exact pre-existing errors are documented | All |
| QA-036 | Continuous complete-game session | Home through four Mission Briefs completes without crash, stuck prompt or duplicated transition | All |
| QA-037 | Open avatar selection before mission entry | Exactly four distinct cards/previews appear with names, descriptions, focus and textual Selected state | Mohamed |
| QA-038 | Confirm and Change Avatar | Confirm gates mission entry; Change Avatar returns to selection without resetting unrelated mission data unexpectedly | Mohamed + Malak |
| QA-039 | Reload after selecting each avatar | Valid scoped selection persists; invalid/blocked storage safely uses the agreed default | Mohamed |
| QA-040 | Enter scene with each Avatar ID | Correct verified model or matching distinct fallback appears; a failed model does not crash Canvas | Renad |
| QA-041 | Compare all four controllers | Speed, diagonal normalization, collision capsule, camera and interaction radius are identical | Renad |
| QA-042 | Observe input/state changes | Idle, Walk, Interact and Celebrate are visually distinguishable and never remain stuck | Renad |
| QA-043 | Inspect supplied GLB files | Real filenames, rights, scale, orientation, geometry/materials and actual clip names are recorded; no invented asset claims | Renad |
| QA-044 | Use clip-less/corrupt/missing-model test case | Distinct procedural model/animation fallback remains fully playable with meaningful error logging | Renad |
| QA-045 | Focus decision controls while moving/pressing E | Scene movement and interaction keys are suppressed behind modal/input focus; UI remains keyboard navigable | Mohamed + Renad |
| QA-046 | Complete one mission with every avatar | Selection remains cosmetic: resources, decision outcomes, score/report and mission difficulty are unchanged | All |
| QA-047 | Complete four levels with one avatar | Selected identity persists; every level includes movement, interaction, visual/resource feedback and real-history Mission Brief | All |
| QA-048 | Timed full-game playtest | Actual duration and optional content are recorded; no unverified one-hour claim is used | All |
| QA-051 | Clear/invalid progress and open Library | Exactly four cards appear; only L1 starts; L2–L4 show locks and explicit conditions | Mohamed + Malak |
| QA-052 | Complete L1, L2 and L3 validly | Each completion unlocks only the immediate successor; completed missions remain replayable | Malak + Mohamed |
| QA-053 | Reload valid/corrupt progress; block storage | Valid progress returns; corrupt state grants nothing beyond L1; blocked storage uses safe in-session progress | Malak |
| QA-054 | Invoke `selectLevel` with a locked ID outside UI | Store rejects it without changing current mission, resources or screen | Malak |
| QA-055 | Trigger Stabilization or navigate to a Brief without valid completion | No completion record or next-level unlock is granted | Malak + Mohamed |
| QA-056 | Play at 1366×768, 1920×1080 and 360px | Real Canvas/fallback fills gameplay viewport; compact overlays remain readable; no permanent three-column dashboard | Mohamed + Renad |
| QA-057 | Enter mission before and after physical prerequisites | Decision options are absent until matching task completion, then appear contextually | All |
| QA-058 | Scan, collect, carry, install, operate and repair | Correct world objects and avatar/device feedback respond; wrong target is safe and helpful | Renad + Malak |
| QA-059 | Repeat/hold E, task completion and choice input | No duplicate step, resource effect, completion or unlock; modal focus suppresses gameplay keys | All |
| QA-060 | Complete each of exactly four missions | Every level includes movement, inspection, active physical task and meaningful contextual choice | All |
| QA-061 | Repeat physical tasks with all four avatars | Identical controller/range/collision and Idle/Walk/Interact/Celebrate behavior; model failure falls back | Renad + Malak |
| QA-062 | Record release evidence | Browser evidence covers movement, tasks, fullscreen HUD, sequential unlocking and campaign completion; real build/lint results attached | All |

## 2. Quick smoke test for every merge (3–5 minutes)
Clear progress → confirm only L1 starts → choose Avatar 3 → enter L1 → confirm full-viewport world → move with WASD/arrows → scan → collect/carry/install or operate/repair → reveal contextual option → confirm exactly one resource/world change → finish validly → Mission Brief → verify L2 unlocked and L3/L4 still locked → Change Avatar without changing progress → run build/lint.

## 2.1 Tests requiring manual browser verification
The following cannot be claimed from TypeScript/build output alone and require a real browser session: QA-014–QA-016 and QA-020–QA-048, except the command-exit portion of QA-035. Record browser/version, keyboard layout, viewport, approximate frame-rate condition, selected avatar, model/fallback path, result and any evidence. Movement feel, equal diagonal speed, camera/collision, proximity, `E` debouncing, four appearance mappings, animation states, focus suppression and WebGL/model fallbacks require manual observation. Automated tests may support resource/idempotence/metadata checks but do not replace the end-to-end browser pass.

## 3. Child-suitable UX review
- Does each instruction tell the player *why* an action matters?
- Is every resource named as well as colored?
- Do choices preview trade-offs without revealing a simplistic 'correct answer'?
- Is difficulty gentle for 7–10 year olds and expandable for older players?
- Does the brief report learning and explanations rather than punish mistakes?
- Is there enough contrast to read text on the scene?
- No gore, injury effects, death scenes, jump scares or hostile combat.

## 4. Timing validation
Design target is **58–72 min** across four levels. Core authored decision-only path is probably **much shorter**; do not misrepresent that. Have at least two testers play without developer narration and time each mission from selection to Mission Brief. Record actual total, optional content used, confusion and skipped sections. If the average is 25 min, describe the version as `a 25-minute playable MVP with an expanded 60-minute design target`, not a 60-minute game.

| Tester | Age band | L1 | L2 | L3 | L4 | Total | Notes |
|---|---|---|---|---|---|---|---|
| Test A | 7–10 (if available) | — | — | — | — | — | — |
| Test B | 11–15 (if available) | — | — | — | — | — | — |
| Adult fallback | Adult | — | — | — | — | — | — |

## 5. Three-minute judging/demo pitch
**0:00–0:25:** "We built a nonviolent Mars-base mission trainer for children aged 7–15. Instead of memorizing facts, children see how science choices affect a crew."  
**0:25–0:55:** Choose Avatar 3, confirm, show fresh Library with L1 ready and L2–L4 visibly locked, then enter the full-viewport 3D Aster Base with compact HUD.

**0:55–1:35:** Walk to the L1 target, scan it, collect/carry/install a component or operate/repair equipment, then reveal a contextual resource choice.
**1:35–2:10:** Complete the mission, show visible system/resource response and explain the reusable mechanics.
**2:10–2:45:** Show Mission Brief and the valid L2 unlock. If later-level footage is needed, use only a clearly identified development fixture after the production lock behavior is demonstrated.
**2:45–3:00:** Point to four-level progression and shared React/R3F/Zustand architecture. State actual playtime only if tested.

## 6. Release checklist
- [ ] Exactly 4 levels exist; fresh progress unlocks only L1 and valid completion unlocks each successor
- [ ] Each level has 3+ meaningful authored events
- [ ] Real 3D scene or labeled fallback occupies the full gameplay viewport with compact overlay HUD
- [ ] Every level includes scan/inspect and an active collect/install or operate/repair task before/between choices
- [ ] Four avatar cards, Confirm, Change and safe persistence work
- [ ] Four distinct model/fallback appearances use identical gameplay parameters
- [ ] Idle/Walk/Interact/Celebrate are visible and reduced-motion safe
- [ ] Astronaut moves with WASD/arrows, camera follows and map bounds work
- [ ] Correct proximity highlight/prompt and `E` interaction work for mission hotspots
- [ ] Repeated `E` and decision clicks never duplicate resource changes
- [ ] At least 1 Mission Brief per level
- [ ] No broken NASA links and no live-data claims
- [ ] `npm run build` passes on current main
- [ ] Mobile + desktop smoke tests recorded
- [ ] No internal/private tokens exposed in build
- [ ] Demo link checked in external browser, or local fallback ready
- [ ] Known limits documented and communicated to judges
