# AstroBot Source-Grounding Plan

**Scope:** a read-only review of `src/science/astroBotService.ts`, `src/data/knowledge.ts` and `src/science/scienceFacts.ts` (as of `origin/main` @ `46c1b0b`), with proposals. **None of those files was modified on this branch;** their owners decide what to adopt.

> **Retrieval is not training.** AstroBot looks up passages in a local knowledge base (and, optionally, a backend). Nothing here trains or fine-tunes a model, and no copy should say it does. "Grounded" must mean "this answer is built from these specific retrieved passages", nothing more.

---

## 1. How AstroBot works today

`askAstroBot(question)`:
1. **POST `/api/v1/ask-astro-bot`** with a 2.6 s timeout. The backend (`astro_rag`, FastAPI on `127.0.0.1:8000` via the Vite proxy) is **not in this repository**. On a static deploy there is no backend, so this step always falls through.
2. **Canned answers** (`GENERAL_SPACE_KNOWLEDGE`, 8 topics): the first topic whose keyword is a *substring* of the question wins.
3. **Keyword search** over the 92 documents in `knowledge.ts` (labelled "BM25-style"; it is actually a term-count score).
4. **Generic welcome answer.**

Every client-side branch returns `grounded: true`.

## 2. Findings (with evidence)

### 2.1 Misrouted answers (verified by running the real function)

We ran the unmodified `askAstroBot` under Node with the backend unreachable. The copy was byte-identical except for import paths. Results:

| Question | Answer AstroBot gave | Cause |
|---|---|---|
| "How does life support work on Mars?" | Astrobiology / exoplanets | keyword `life` |
| "What is the weather like on Mars?" | "How Astronauts Live…" (food, sleep) | `eat` ⊂ "w**eat**her" |
| "Can we start the rover now?" | "Stars, Supernovas & The Milky Way" | `star` ⊂ "**star**t" |
| "How do astronauts protect themselves from a solar flare on Mars?" | Generic Sun facts (fusion, auroras), no protection info | Canned answers run **before** the KB, which has the relevant "DONKI & Curiosity RAD" and "Why Water Makes a Good Radiation Shield" docs |
| "What is the Sun doing right now?" | Generic Sun facts, `live=false` | No live path in the client, and no "I can't see live data" message |
| "What is DONKI?" | "DONKI Moved to a New Web Address in 2026" | Term-count favours the doc that repeats "DONKI". The overview doc would be better. |

All six came back with `grounded=true` and **`score: 0.95`**, a hard-coded constant rather than a confidence.

### 2.2 Attribution problems in the knowledge base

- **Four team-authored docs cite NASA URLs as their source:**
  - "Game Guide: Choosing a Debris Maneuver" → nasa.gov/cara
  - "Game Guide: Handling a Solar Storm" → DONKI
  - "Game Guide: Balancing Oxygen, Power, Water and CO2" → EDA
  - "Machine Learning for Collision Risk (Education Only)" → nasa.gov/cara

  AstroBot would show NASA as the source of the team's game tactics.
- **Live claims the client can't keep.** One doc says *"AstroBot uses this API to answer questions about what the Sun is doing right now."* Three "saved snapshot" docs say *"ask about space weather 'right now' to get live numbers."* `askAstroBot` never calls DONKI, so these hold only when the external backend is running.
- **"92 exported NASA documents":** the count is right (92), but the docs come from 86 distinct sources and include CSA and team content, not only NASA.

### 2.3 Link audit (2026-11-14)

| File | Result |
|---|---|
| `scienceFacts.ts` (6 facts) | **3 × HTTP 404**, re-checked following redirects with a browser user agent: `NASA-OXYGEN` (`science.nasa.gov/mission/mars-2020-perseverance/moxie/`), `NASA-DUST` (`science.nasa.gov/planetary-science/focus-areas/mars/`), `NASA-PLANTS` (`nasa.gov/missions/station/iss-research/veggie-plant-growth-system-on-international-space-station/`) |
| `knowledge.ts` + `astroBotService.ts` (43 unique URLs) | 34 × 200, 6 redirects (fine). **1 cited source returns 404:** `pds-atmospheres.nmsu.edu/…/MARS/meda.html` (MEDA doc). Two API base URLs mentioned in prose return 404/500 when opened bare; that's expected. |

These pages appear in Mission Briefs and AstroBot citations, so broken links undercut the "Clearly attribute your data sources" guidance.

### 2.4 Checks against what we verified today

| KB statement | Status |
|---|---|
| DONKI request window max 60 days; defaults 30 d / 7 d | ✅ Confirmed. Note that `CME` *requires* dates. |
| DONKI moved to `ccmc.gsfc.nasa.gov` on 2026-09-30 | ✅ DONKI news |
| "The same data is also offered through api.nasa.gov" | ⚠️ Partly: FLR returned 404 through api.nasa.gov |
| EDA "cabin CO₂ … often around 2,500 to 4,000 ppm" | ⚠️ EDA mission medians are 2,141–3,892 ppm. Consider "about 2,000 to 4,000 ppm". |
| Curiosity RAD "about 210 microGrays per sol" | ⚠️ Not reproduced. RadLab's MSL-RAD surface rows for 15–19 May 2024 average ≈ 98.5 µGy/day. These may be different quantities or eras (the medium isn't stated). Add a source and date or soften the wording. |

## 3. Proposed response contract (backwards-compatible)

Add optional fields to `BotResponse`. Existing UI keeps working.

```ts
type EvidenceType = 'nasa-source' | 'partner-source' | 'game-tip' | 'live-observation' | 'snapshot' | 'none';

interface BotSource {
  title: string; dataset?: string; url: string;
  score?: number;                 // only a real retrieval score; omit for canned answers
  evidenceType?: EvidenceType;    // NEW
  capturedAt?: string;            // NEW: snapshot date, ISO
  fetchedAt?: string;             // NEW: live fetch time, ISO
  location?: 'Mars surface' | 'Sun and near-Earth space' | 'International Space Station' | 'Moon' | 'Earth' | 'Model prediction'; // NEW
}
interface BotResponse { /* existing fields */ disclaimer?: string; /* NEW */ }
```

### Rules

1. **`grounded` is true only when the answer text was built from at least one retrieved passage above a score threshold.** The generic welcome answer returns `grounded: false, sources: []`.
2. **`live` is true only when a request succeeded during this answer** (`provenance.mode === 'live'`). Otherwise any "now"/"today" wording must be replaced with the snapshot date.
3. **Team content is labelled as such:** `evidenceType: 'game-tip'`, displayed as "Game tip (from the Junior Astronaut team, not NASA)", with no NASA URL.
4. **Cite the passage actually used**, with its URL and, for snapshots, `capturedAt`.
5. **Say "I don't know"** when nothing scores above the threshold: *"I don't have a NASA source for that yet. Try asking about radiation, oxygen, water, food or power."* Never fabricate.
6. **Measurement location is always stated** for numbers (see `NASA_DATA_SOURCE_REGISTRY.md` §4).

## 4. Proposed retrieval fixes

| Fix | Effect on the probes above |
|---|---|
| Word-boundary matching (`\bstar\b`, `\blife\b` with phrase exceptions such as "life support") | Fixes "start", "weather" and "life support" |
| Search the KB **first**; use canned answers only as a fallback when KB scores are low | Solar-flare protection question reaches the DONKI/RAD/shielding docs |
| Real relevance score (e.g. true BM25 or normalized TF-IDF) and a minimum threshold; drop the constant `0.95` | Honest confidence; enables rule 5 |
| Title boost for overview docs, or a small synonym map (CME ↔ "solar cloud", SEP ↔ "solar particles") | "What is DONKI?" → "NASA DONKI: Space Weather Database" |
| Rename "BM25-style" in comments, or implement BM25 | Accuracy of internal docs |

## 5. Live "space weather now" intent (uses this branch's data layer)

`loadSolarStormWatchData()` (in `src/integrations/nasa/solarStormContext.ts`) calls DONKI directly. DONKI is CORS-enabled and needs no key, and the function never throws.

```ts
// Sketch for the AstroBot owner — not implemented on this branch.
if (/\b(sun|solar|space weather|flare|cme)\b.*\b(now|today|right now|currently)\b/i.test(q)) {
  const { today } = await loadSolarStormWatchData({ days: 7, timeoutMs: 6000 });
  if (today.status === 'live') {
    const c = today.context;
    return {
      answer: `In the last 7 days NASA's DONKI database recorded ${c.flareCount} solar flares`
        + (c.strongestFlare ? ` (strongest: ${c.strongestFlare.classType})` : '')
        + ` and ${c.sepCount} solar particle events. ${c.marsPredictions.length ? 'A computer model predicts a solar cloud reaching Mars.' : ''}`,
      grounded: true, live: true, backend: 'client-kb',
      sources: c.provenance.map((p) => ({ title: 'NASA CCMC DONKI', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/', evidenceType: 'live-observation', fetchedAt: p.retrievedAt })),
      disclaimer: DONKI_DISCLAIMER, jargon: [],
    };
  }
  return { answer: "I can't reach NASA's space-weather database right now, so I can't tell you what the Sun is doing today. Here's what happened in a real storm in May 2024…", grounded: true, live: false, /* cite the replay snapshot with capturedAt */ };
}
```

Model predictions must be worded as predictions ("a computer model predicts…"). Flares and SEPs are observations near Earth, not at Mars.

## 6. Knowledge-base maintenance

1. **Link check in CI.** The URL list is extractable with `grep -ohE "https?://…" src/data/knowledge.ts src/science/*.ts`. Fail on 4xx/5xx and warn on redirects.
2. **Date-stamp every snapshot doc** with `capturedAt` (the three "saved snapshot" docs already say they are snapshots; add the date).
3. **Content review:** one reviewer checks each numeric claim against its cited page, then records the date and reviewer in the exporter (`astro_rag/export_to_ts.py`, not in this repo).
4. **New NASA docs from this branch:** the evidence cards in `SOLAR_STORM_REPLAY_2024.evidence` can be exported as KB docs. They already carry source, location, evidence type and capture date.

## 7. Regression question set

| Question | Expected source (top-1) | Expected flags |
|---|---|---|
| How does life support work on Mars? | ECLSS / EDA cabin-air doc | `grounded`, not astrobiology |
| What is the weather like on Mars? | MEDA / InSight weather doc | not "astronaut life" |
| Can we start the rover now? | rover / game-tip doc, or "I don't know" | not stars |
| How do astronauts protect themselves from a solar flare on Mars? | DONKI & Curiosity RAD, Water shield, Real Martians | `nasa-source` |
| What is the Sun doing right now? | live DONKI, or an explicit "can't reach DONKI" message | `live` only if fetched |
| What is DONKI? | NASA DONKI: Space Weather Database | — |
| How much CO2 is in the ISS cabin? | EDA doc | `location: International Space Station` |
| Did plants grow in Moon soil? | OSD-476 | `location: Moon` (ground lab study) |
| What's the best strategy for a solar storm in the game? | Game Guide: Handling a Solar Storm | `evidenceType: game-tip`, no NASA URL |
| Who will win the hackathon? | — | `grounded: false`, "I don't know" |

## 8. Ownership

Per `src/docs/02_TECHNICAL_CONTRACTS.md` §2:

| Change | Owner |
|---|---|
| `astroBotService.ts` contract and matching fixes | **Malak** (`src/science/**`) |
| `knowledge.ts` attribution and date fixes | **Malak** (`src/data/**`). The file is generated by `astro_rag/export_to_ts.py`, which is not in this repo, so fix it at the exporter. |
| `scienceFacts.ts` 404 URL replacements | **Malak** (`src/science/**`) |
| Chat UI for `evidenceType` / `disclaimer` | **Mohamed** (`src/pages/**`, `src/components/ui/**`) |
| Live DONKI intent wiring | Integration (**Renad**), after Malak approves the `src/integrations/nasa` contract |
