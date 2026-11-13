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

## 2. Quick smoke test for every merge (3–5 minutes)
Start level 1 → move with WASD and arrows → approach the highlighted system → see prompt → press `E` → choose an option → confirm exactly one resource change → read consequence → Continue → finish/brief → library → start level 4 → repeat one physical interaction → verify status/hotspot changes → run `npm run build`. This is faster and safer than only checking the code diff.

## 2.1 Tests requiring manual browser verification
The following cannot be claimed from TypeScript/build output alone and require a real browser session: QA-014–QA-016 and QA-020–QA-036, except the command-exit portion of QA-035. Record browser/version, keyboard layout, viewport, approximate frame-rate condition, result and any video/screenshot evidence. In particular, movement feel, equal diagonal speed, camera follow, collision, proximity prompts, `E` debouncing and WebGL fallback require manual observation. Automated unit tests may support the resource/idempotence checks but do not replace the end-to-end browser pass.

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
**0:25–0:55:** Enter the shared 3D Aster Base, move Nova with the keyboard and reveal six interconnected resources.

**0:55–1:35:** Walk to the Power Crisis solar array, press `E`, solve one choice and show why saving energy changes other systems.
**1:35–2:10:** Open Oxygen Emergency, discuss reserve-vs-repair trade-off.  
**2:10–2:45:** Show Mission Brief: decisions, deltas, reflection, link to NASA science.  
**2:45–3:00:** Point to four-level progression and shared React/R3F/Zustand architecture. State actual playtime only if tested.

## 6. Release checklist
- [ ] All 4 levels exist and are accessible
- [ ] Each level has 3+ meaningful authored events
- [ ] 3D scene loads with low complexity
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
