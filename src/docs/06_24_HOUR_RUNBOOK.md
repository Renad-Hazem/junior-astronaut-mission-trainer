# 24-HOUR HACKATHON RUNBOOK — 3-PERSON TEAM
**Goal:** deliver a complete four-level browser MVP with one reusable Mars scene, meaningful resource trade-offs, and a Mission Brief for each level.

## 1. Reality check
Three people working a single 24-hour window cannot safely guarantee a truly polished, custom 60-minute 3D game. The achievable **P0** is four story chapters with data-driven decisions, a shared 3D base, accessible UI and educational debriefs. The **60–75 minute experience** is a design target requiring authored optional scenes, retry strategies and measured playtesting, not a guaranteed result. A 20–30 minute coherent demo is better than a 60-minute broken experience. Avoid sleep deprivation as a quality strategy: assign breaks and rotate QA.

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
`Malak: types.ts (H2)` → parallel `Malak: store + events`, `Renad: scene props`, `Mohamed: pages` → `Mohamed: App composition` → `Renad: integration / build / deploy` → `All: QA`.

**Hard rule:** every owner provides a minimal compileable stub before implementing their full feature, so another teammate is not blocked. If you cannot build all four levels by H12, cut scene complexity, not game loop completeness.

## 4. Scope cuts (highest to lowest priority)
P0 MUST: four levels accessible, 3 decisions each, six resources, nonviolent informative consequences, Mission Brief per level, basic 3D stage, build/deploy.  
P1 if stable: 4–5 decisions per level, 3D hotspot interactions, distinct visual alert modes, polished illustrations, optional explanations.  
P2 only with time: rover minigame, dialogue voice-over, custom astronaut animation, advanced score, sound system, external models, richer world exploration.  
NEVER in this sprint: NASA live APIs, accounts, backend, procedural 3D universe, complex combat, multiplayer, more than one scene environment.

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
**H8:** start a level, choose one meaningful option, see six resource changes, see consequences, finish one level, see Mission Brief.  
**H12:** four levels can be entered/completed; 3D scene loads; all source facts have real URLs.  
**H20:** no runtime crash, responsive, no duplicate choice effects, `npm run build` and `npm run lint` complete or documented pre-existing lint issues triaged.  
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
If 3D is broken at H10, retain the React decision game and show static Mars-base placeholder; repair scene after core loop. If the event engine is blocked, use one deterministic array of pre-authored events and a pure `applyEffects`; keep types. If deployment fails, show `npm run dev` locally and save a walkthrough recording. If NASA API unavailable, **do not** use it; cite official text links from baked-in data.
