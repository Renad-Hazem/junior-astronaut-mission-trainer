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

## 2. Quick smoke test for every merge (3–5 minutes)
Start level 1 → choose an option → confirm exactly one resource change → Continue → finish/brief → library → start level 4 → choose and finish → verify 3D status changes → run `npm run build`. This is faster and safer than only checking the code diff.

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
**0:25–0:55:** Enter the beautiful shared 3D Aster Base; reveal six interconnected resources.  
**0:55–1:35:** Solve one Power Crisis choice and show why saving energy changes other systems.  
**1:35–2:10:** Open Oxygen Emergency, discuss reserve-vs-repair trade-off.  
**2:10–2:45:** Show Mission Brief: decisions, deltas, reflection, link to NASA science.  
**2:45–3:00:** Point to four-level progression and shared React/R3F/Zustand architecture. State actual playtime only if tested.

## 6. Release checklist
- [ ] All 4 levels exist and are accessible
- [ ] Each level has 3+ meaningful authored events
- [ ] 3D scene loads with low complexity
- [ ] At least 1 Mission Brief per level
- [ ] No broken NASA links and no live-data claims
- [ ] `npm run build` passes on current main
- [ ] Mobile + desktop smoke tests recorded
- [ ] No internal/private tokens exposed in build
- [ ] Demo link checked in external browser, or local fallback ready
- [ ] Known limits documented and communicated to judges
