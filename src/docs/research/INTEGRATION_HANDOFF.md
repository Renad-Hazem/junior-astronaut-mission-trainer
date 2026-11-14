# Integration Handoff — NASA data layer + Bonus Mission 05

**For:** the integration owner (Renad), the data/game/science owner (Malak) and the UI owner (Mohamed). Ownership follows `02_TECHNICAL_CONTRACTS.md` §2.
**Branch:** `research/nasa-bonus-mission`, from `origin/main` @ `46c1b0bcf84e9b0df596ff09158ef7a612b3b839`.

**State:** isolated and inert. Nothing in the running game imports the new code. `npm run build` produces a **byte-identical bundle** to `main` (same `index-BDYx9fsN.js`, 613 modules).

---

## 1. What this branch adds (and doesn't touch)

**Added**, all new files:

```
src/integrations/nasa/
  types.ts  http.ts  normalizers.ts  sourceRegistry.ts
  donkiClient.ts  edaClient.ts  osdrClient.ts  solarStormContext.ts  index.ts
  fixtures/{donki,eda,osdr}.fixtures.ts             (generated from real captures)
  __tests__/{harness,normalizers.test,clients.test,snapshot.test,bonusMission.test,run,live.smoke}.ts
  tools/nasa-snapshot-tool.mjs                      (offline capture/build tool, not bundled)
src/data/nasa/
  generated/{donkiReplay2024,marsRad2024,edaIssEnvironment,osdrStudies}.generated.ts
  marsRad2024.ts  edaIssEnvironment.ts  osdrPlantStudies.ts  solarStormWatchSnapshot.ts
  bonusMission05.ts  index.ts
src/docs/research/  (6 documents)
```

**Not touched:** `src/game/**`, `src/scene/**`, `src/pages/**`, `src/components/ui/**`, `src/data/levels.ts`, `src/science/**`, `package.json`, configs.

> `src/data/**` is Malak's domain under `02_TECHNICAL_CONTRACTS.md`. This branch was explicitly assigned `src/data/nasa/**`, so please review those files as the domain owner.

## 2. Contracts to approve

| Contract | File | Notes |
|---|---|---|
| `NasaResult<T>`, `NasaError` (`invalid-request`, `timeout`, `aborted`, `network-or-cors`, `http`, `invalid-payload`), `DataProvenance` | `types.ts` | Clients never throw |
| DONKI raw + normalized types (`SolarFlareEvent`, `CmeEvent`, `SepEvent`, `SolarStormContext`) | `types.ts` | Raw types match real responses, including observed `null`s |
| `loadSolarStormWatchData(opts) → { replay, today }` | `solarStormContext.ts` | The only call the mission needs |
| `SOLAR_STORM_REPLAY_2024` + `EvidenceCard` | `data/nasa/solarStormWatchSnapshot.ts` | Every card has type, location, URL and provenance |
| `BonusMissionDefinition`, `BONUS_MISSION_05`, `BONUS_05_SCIENCE_FACTS` | `data/nasa/bonusMission05.ts` | Reuses `MissionEvent` unchanged |

## 3. Activating Bonus Mission 05 — step by step

### Step 1 — Choose the type strategy (Malak approves `types.ts`)

Today `MissionLevel.levelNumber: 1|2|3|4`, `title` and `difficulty` are closed unions, and `MissionBriefReport` copies `levelNumber` and `missionTitle`.

- **Option B (recommended): keep the bonus out of `MISSION_LEVELS`.**
  1. Widen three unions in `src/game/types.ts`:
     - `levelNumber: 1|2|3|4|5` (in both `MissionLevel` and `MissionBriefReport`)
     - `title: … | 'Solar Storm Watch'`
     - `difficulty: … | 'Bonus'`
  2. Add `toMissionLevel(BONUS_MISSION_05)`: copy the fields, setting `levelNumber: 5`, `title`, `difficulty`.
  3. Make `getMissionLevelById` (`src/data/levels.ts`) also return the bonus for `'bonus-05-solar-storm-watch'`.

  Because the bonus isn't in `MISSION_LEVELS`:
  - `uiAdapter.missionLevels`, sequential unlocking, and **Level 4's "Next Level" button stay exactly as today**.
  - `MissionBriefPage` computes `missionLevels[currentIndex + 1]`, so appending the bonus would add a CTA to Level 4's brief, which Option B avoids.
- **Option A (simplest, but changes Level 4's brief): append to `MISSION_LEVELS`.** Same type widening. The bonus then becomes "Level 5": it locks behind Level 4 and appears as Level 4's next level. That conflicts with "do not alter Levels 1–4" unless the team accepts the extra CTA.

### Step 2 — Science facts (Malak)

Merge `BONUS_05_SCIENCE_FACTS` (6 new IDs, none colliding; tested) into `SCIENCE_FACTS` in `src/science/scienceFacts.ts`. Its reused IDs `NASA-RADIATION` and `NASA-ECLSS` already exist. `uiAdapter.scienceFacts` then picks them up automatically.

### Step 3 — Library entry (Mohamed)

Add one "Bonus" card to `src/pages/MissionLibraryPage.tsx`, outside the numbered list:
- title "Solar Storm Watch", the tagline, a badge "Bonus · Real NASA data (May 2024)"
- `onClick → selectLevel('bonus-05-solar-storm-watch')`
- Always unlocked, or unlocked once Level 4 is completed. Never required.

### Step 4 — Evidence UI (Mohamed)

- **During events:** show `BONUS_MISSION_05.eventEvidence[event.id]` → `SOLAR_STORM_REPLAY_2024.evidence` cards. Show the heading and body, with `detail` behind "More for older explorers".
- **Chips:** `kind` (*Measurement* / *Computer prediction* / *NASA said* / *Mission design idea*) and `location`.
- **Source line:** `sourceLabel` with a link to `url`, plus "Real NASA data from 20 May 2024 · captured {provenance.retrievedAt date}".
- **Mission Brief:** a "Real NASA evidence" section with the cards from the events played, and the Storm Readiness label + `scoring.disclaimer`.
- **Optional chart:** `MARS_RAD_2024_HOURLY` (96 points, µGy/h, Mars surface).

### Step 5 — Optional live "Sun now" panel (Renad + Mohamed)

```ts
const { loadSolarStormWatchData } = await import('../integrations/nasa/index.ts'); // lazy: keeps the main chunk unchanged
const data = await loadSolarStormWatchData({ days: 30, timeoutMs: 8000 });
// data.today.status === 'live' → tier badge + tierReasons + fetched time + DONKI_DISCLAIMER
// data.today.status === 'unavailable' → "Live Sun data is unavailable right now."
```

- Call it once when the mission opens, and cache it for the session.
- **Never block gameplay on it**, and never let it change resources.
- DONKI is browser-safe (`Access-Control-Allow-Origin: *`) and needs no key.

### Step 6 — Bundle size

The snapshot modules are about 60 KB of source. Load the mission and its data with a dynamic `import()` when the bonus is opened, so the existing main chunk (already above 500 kB) doesn't grow.

## 4. Activating other sources (later)

| Source | Browser-direct? | To go live |
|---|---|---|
| DONKI | ✅ | Already works |
| EDA, OSDR Biodata, RadLab | ❌ no CORS header | Add a same-origin proxy (e.g. a serverless function at `/api/nasa/{eda,biodata,radlab}/*` forwarding to the official base URLs, with response caching), then pass `baseUrl: '/api/nasa/eda'` etc. to the clients. **Don't scrape EDA dashboards at runtime.** Keep using the snapshot. |
| api.nasa.gov | ✅ but needs a key | Not needed. **Never put a key in client code** (Vite exposes `VITE_*` variables to the browser). |

The Vite dev proxy currently forwards only `/api` → `127.0.0.1:8000` (the AstroBot backend). A NASA proxy route would need to be added there for dev, plus an equivalent on the host. That change belongs to the build/integration owner and needs approval.

## 5. Tests and checks

| Command | What it does | Result on this branch (2026-11-14) |
|---|---|---|
| `node src/integrations/nasa/__tests__/run.ts` | 40 offline tests: normalizers, clients with fake fetch (HTTP / invalid JSON / CORS-or-network / timeout / abort), snapshot integrity, mission balance over all 243 paths | **40 passed, 0 failed** |
| `node src/integrations/nasa/__tests__/live.smoke.ts` | Opt-in real calls + CORS header check | 3 runs: runs 2–3 all green; run 1 had 2 transient DONKI connection failures |
| `npm run lint` | ESLint (the 30 new files are linted) | **pass** |
| `npm run build` | `tsc -b && vite build` | **pass**; bundle identical to `main`; the >500 kB chunk warning is pre-existing |

- **Node ≥ 22.18 or ≥ 23.6** is needed for built-in TypeScript type stripping (tested on 24.13.1). No new dependencies.
- If the team adopts Vitest later, the tests port by swapping `test`/`assert` imports.
- On slow connections, set `NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000`. `live.smoke.ts` and the tool already raise it.

## 6. Regenerating snapshots

```bash
node src/integrations/nasa/tools/nasa-snapshot-tool.mjs capture ../nasa-raw-capture   # outside the repo; ~40 MB of EDA HTML
node src/integrations/nasa/tools/nasa-snapshot-tool.mjs build   ../nasa-raw-capture
node src/integrations/nasa/__tests__/run.ts                                             # metrics tests will flag changed data
```

The capture list is fixed and dated, so a rebuild reproduces the same historical data. Only the "recent" DONKI fixtures change if you edit their windows.

## 7. Issues found outside this branch's ownership (not fixed here)

| Issue | Where | Owner |
|---|---|---|
| 3 `scienceFacts.ts` URLs return **404**: NASA-OXYGEN, NASA-DUST, NASA-PLANTS | `src/science/scienceFacts.ts` | Malak |
| AstroBot misroutes ("start" → stars, "weather" → food, "life support" → astrobiology); `grounded:true` + constant `score:0.95` on every client answer; KB says AstroBot answers "right now" but the client has no live path | `src/science/astroBotService.ts`, `src/data/knowledge.ts` | Malak |
| KB MEDA source URL is 404 | `src/data/knowledge.ts` | Malak (exporter) |
| 4 team-authored "game guide" KB docs cite NASA URLs | `src/data/knowledge.ts` | Malak |

Details and fixes are in `ASTROBOT_GROUNDING_PLAN.md`.

**External:**
- api.nasa.gov's DONKI FLR route returned 404 (CCMC direct works).
- spaceappschallenge.org's TLS chain is rejected by Node 24 / Windows Schannel (browsers are fine).

## 8. Attribution checklist before demo

- [ ] DONKI acknowledgement + NOAA SWPC disclaimer next to any DONKI content
- [ ] "Data courtesy of NASA OSDR" next to RadLab / EDA / OSDR values; study accession cited
- [ ] JPL / NASA article titles and dates on quoted statements
- [ ] "Real NASA data from 20 May 2024" on replay content; "live" only on successfully fetched panel data
- [ ] Storm Readiness disclaimer ("not an official NASA Space Apps Challenge score")
- [ ] No NASA logos or implied endorsement (`07_SCIENCE_AND_CONTENT_SOURCES.md` §7)
- [ ] A short "Which NASA datasets we used and why" section for judges, linking `NASA_DATA_SOURCE_REGISTRY.md`
