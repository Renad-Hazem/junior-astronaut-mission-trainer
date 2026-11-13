# 24-HOUR HACKATHON RUNBOOK — 3-PERSON TEAM
**Goal:** deliver a complete four-level browser MVP with one full-viewport reusable Mars scene, physical equipment tasks, sequential unlocks, meaningful resource trade-offs and a Mission Brief for each level.

## 1. Reality check
Three people working a single 24-hour window cannot safely guarantee a truly polished, custom 60-minute 3D game. The achievable **P0** is four story chapters with data-driven decisions, a shared 3D base, accessible UI and educational debriefs. The **60–75 minute experience** is a design target requiring authored optional scenes, retry strategies and measured playtesting, not a guaranteed result. A 20–30 minute coherent demo is better than a 60-minute broken experience. Avoid sleep deprivation as a quality strategy: assign breaks and rotate QA.

### In-progress course correction: playable exploration is P0
The team has already started implementation. Do **not** restart branches, rebuild completed screens or reset the clock to H0. At the next stand-up, preserve completed work and re-rank only the remaining tasks around this required vertical slice:

```text
choose one of four avatars → confirm → enter Library with L1 only unlocked
→ enter full-viewport shared Mars map → move selected astronaut
→ approach and scan → collect/carry/install or operate/repair
→ contextual decision after prerequisites → consequence → Continue
→ valid completion → Celebrate → Mission Brief → unlock next mission
```

Renad adds four avatar renderers/fallbacks, basic Idle/Walk/Interact/Celebrate states, movement, physical interactions and visible device feedback inside `src/scene/**`. Malak preserves the data/store architecture and owns guarded progress, valid completion and authored task prerequisites. Mohamed replaces only the gameplay composition with the full-viewport stage, compact overlay HUD, locked Library states and contextual accessible task UI. No owner rebuilds another owner's completed work. Any new shared runtime API is **REQUIRES TEAM APPROVAL**.

## 2. Twelve 2-hour blocks
| Hours | Renad — 3D/Integration | Malak — Game/Science | Mohamed — UI | Gate |
|---|---|---|---|---|
| H0–H2 | Clone/build audit; agree files; setup scene skeleton | Commit frozen types; first 1–2 events | Home/design tokens; flow wireframe | `types.ts` contract approved |
| H2–H4 | Terrain/camera/base primitives | Resource engine and Zustand base | Library/resource bars | Parallel files compile |
| H4–H6 | Scene props, hotspots, alert states | Level 1 + first Mission Brief fixture | Gameplay screen + event options | Level 1 connected without 3D blockers |
| H6–H8 | First scene PR; integrate / inspect click | Level 2 Power Crisis | Mission Brief screen | **Level 1 complete end-to-end** |
| H8–H10 | Refine scene/performance | Level 3 Oxygen Emergency | Connect real Zustand actions | Three levels smoke-tested |
| H10–H12 | Integrate 3D in Gameplay | Level 4 Survival Challenge | Connect scene and facts | **Four-level core path** |
| H12–H14 | Fix conflicts/build | Balance/copy review; NASA fact URLs | Responsive mobile controls | Four levels start & finish |
| H14–H16 | Browser/performance checks | Science copy accuracy, test report | Mission Brief clarity, navigation | Release readiness check |
| H16–H18 | Deploy preview and smoke test | Data bug fixes only | Accessibility and missing states | Freeze new features |
| H18–H20 | Live demo rehearsal | Walk through all 4 levels | Visual polish limited to defects | Release candidate |
| H20–H22 | Final integration/build & fallback | Verify 4 reports & no invented facts | Final responsive pass | Code freeze |
| H22–H24 | Publish/check link, backup local demo | Prepare learning narration | Prepare user demo flow | Show working version |

Short breaks between blocks; swap testers frequently. Avoid leaving the first full integration until H20.

## 3. Dependency chain
`Three-owner approval: avatar + progress + physical-task additions` → `Malak: smallest contract, guarded progress, task sequence` → parallel `Renad: full-viewport world + one controller + physical mechanics`, `Mohamed: overlay HUD + lock/context UI` → `L1 scan → collect/install or repair → choice vertical slice` → `valid completion unlocks L2` → `reuse across four levels / build / deploy` → `All: manual browser QA`.

**Hard rule:** every owner provides a minimal compileable stub before implementing their full feature, so another teammate is not blocked. If you cannot build all four levels by H12, cut scene complexity, not game loop completeness.

## 4. Scope cuts (highest to lowest priority)
**P0 MUST:** exactly four cosmetic avatar choices before mission entry; safe Confirm/Change/persistence; four distinct renderable appearances or fallbacks; one reusable controller; visible Idle/Walk/Interact/Celebrate feedback; exactly four sequentially unlocked missions with L1 only on fresh progress; guarded/persisted completion; one full-viewport reusable Mars map; compact overlay HUD; WASD/arrow movement; camera/bounds/collision; proximity + `E`; scan, collect/carry/install and operate/repair mechanics; contextual decisions only after prerequisites; six resources; consequences + Continue; Mission Brief after every level; accessible controlled fallback; successful production build.

**P1 after P0 is verified:** verified GLB polish where assets support it; smoother animation blending; clearer system highlighting; dust-storm feedback; touch controls; improved sound and interaction feedback; 4–5 events per level.

**P2 only with time:** advanced custom rigging/retargeting; new custom 3D assets; voice acting; large-world exploration; complex cinematics; extra minigames and scenario variants.
NEVER in this sprint: NASA live APIs, accounts, backend, procedural 3D universe, complex combat, multiplayer, more than one scene environment.

All four avatars and missions reuse the same controller, map, camera, proximity interaction and resource engine. Avatar choice cannot change speed, collision, resources, scoring or outcomes. The one-hour duration remains aspirational until a complete timed playtest proves it; coherence and reliable interaction take precedence over padding.

## 5. Repo and branch commands
```bash
# Each participant starts independently
git clone https://github.com/Renad-Hazem/junior-astronaut-mission-trainer.git
cd junior-astronaut-mission-trainer
npm ci
npm run build

git fetch origin
git checkout main
git pull --ff-only origin main
# Use exactly ONE personal branch:
git checkout -b feature/renad-3d
# OR: git checkout -b feature/malak-game-engine
# OR: git checkout -b feature/mohamed-ui

# After completing owned changes:
git add <ONLY_YOUR_OWNED_FILES>
git commit -m "feat: implement <small feature>"
git push -u origin <YOUR_BRANCH>
# Open a Pull Request to main, request teammate review.
```

**Don't run all three branch commands.** Each person chooses one. Prefer several small commits and early PRs over one giant merge at the end. If `git checkout -b` fails because branch exists, fetch/switch to existing branch instead; don't reset others' work.

## 6. Merge protocol
- `main` is protected by agreement (GitHub branch protection if repository admins can enable it). No direct pushes.
- One reviewer per PR who is *not* its author, even in 24h. Only merge after `npm run build` passes and a screenshot/short description exists.
- If a PR changes `src/game/types.ts`, notify all three **before** merge.
- If a PR changes `src/App.tsx`, ask Mohamed to make the change rather than having another agent overwrite it.
- Malak releases types as a small first PR by H+2. Mohamed and Renad can build stubs against that contract.
- **No squash of another person's branch while someone is still basing work on its commit without telling them.** After each merge, everyone fetches/pulls main.
- Last 4 hours: critical fixes only. Never replace major architecture near deadline.

## 7. Definition of Done at three checkpoints
**H8 / next available gate:** fresh progress shows L1 unlocked and L2–L4 locked; select Avatar 3, enter L1's full-viewport world, move, scan the target, collect/carry/install one item or operate/repair, then reveal one meaningful option and apply one consequence.

**H12 / core-content gate:** every avatar renders/moves with equal gameplay parameters and P0 animation fallback; valid L1 completion unlocks L2 exactly once; the reusable physical-task loop works across all four authored missions on the same map; each brief/source fact resolves.

**H20 / release-candidate gate:** fresh-save-to-campaign-complete browser playthrough unlocks L1→L4 in order with no bypass/crash; repeated task/E/choice input does not duplicate steps, effects or unlocks; fullscreen/360px and fallback paths remain usable; build/lint pass or pre-existing issues are triaged.
**H24:** shareable deployment or reliable locally runnable demo, backup video, known limitations visible.

## 8. Deployment
Vite builds a `dist/` folder with `npm run build`. Choose one static hosting provider already accessible to the team (e.g., Vercel, Netlify or GitHub Pages). For root-domain deployment, Vite's default base may suffice. For GitHub Pages under a subpath, set the correct `base` explicitly in `vite.config.ts` only with owner agreement. Never claim a deployment URL before it has been opened on another device. No secret key or NASA API key needed for MVP.

## 9. AI agent protocol
The first line of each agent prompt should specify the branch, owned folders and contract filename. Every agent must inspect `package.json`, `src/App.tsx`, repo tree, and existing modules before writing code. Prohibit changing unrelated files, inventing APIs, adding unnecessary dependencies, overwriting another agent's changes, or claiming tests are successful without executing them. Integrators should apply small patches, not replace whole files. Use the prompts inside each owner file.

## 10. Stand-up template (every ~3 hours)
- **Done:** what works visibly and link/commit.
- **Doing:** next smallest task.
- **Blocked:** exact import/type/error + teammate needed.
- **Merge:** PR number, review owner, build result.
- **Cut:** any P1/P2 feature at risk.

## 11. Emergency contingency
If a real GLB is missing, corrupt, unlicensed or lacks clips, use its distinct procedural astronaut and procedural P0 animations; never block selection or a mission and never require a paid asset. If WebGL is temporarily broken, retain Mohamed's accessible decision fallback and show a static Mars-base placeholder so educational progress is not blocked; however, the playable P0 release gate is not satisfied until avatar selection, movement and `E` interaction work in a supported browser. If the event engine is blocked, use deterministic pre-authored events and pure `applyEffects`; keep types. If deployment fails, show `npm run dev` locally and save a walkthrough recording. If NASA API is unavailable, **do not** use it; cite official baked-in source links.
