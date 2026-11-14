# NASA Data Source Registry

The machine-readable twin of this file is `src/integrations/nasa/sourceRegistry.ts`. Keep the two in sync.

**Verified:** 2026-11-14. **Re-verify** before activation with `node src/integrations/nasa/__tests__/live.smoke.ts`.

---

## 1. Sources

| ID | Source | Operator | On official challenge page? | Where the data comes from | Game use |
|---|---|---|---|---|---|
| `donki` | DONKI-API v2.0 — https://ccmc.gsfc.nasa.gov/DONKI-API/get | NASA GSFC CCMC; Moon to Mars Space Weather Analysis Office | ✅ (tool page) | Sun / near-Earth space. "Mars" appears only in **model predictions**. | **Use now** |
| `radlab` | RadLab API — https://visualization.osdr.nasa.gov/radlab/api/ | NASA OSDR | ✅ | ISS, **Mars surface (Curiosity RAD)**, Moon orbit, Mars orbit, heliocentric | **Use now** (snapshot) |
| `eda` | EDA — https://visualization.osdr.nasa.gov/eda/api | NASA OSDR (Ames) | ❌ (brief only) | **ISS cabin** telemetry + ground-control chambers | Use later (snapshot card now) |
| `osdr-biodata` | Biodata API v2 — https://visualization.osdr.nasa.gov/biodata/api/v2 | NASA OSDR | ❌ (brief only) | Study metadata (ISS / ground) | Reference cards |
| `osdr-search` | https://osdr.nasa.gov/osdr/data/search | NASA OSDR | ✅ | Search index incl. external databases | Do not use in-game |
| `api-nasa-gov` | https://api.nasa.gov/DONKI | NASA | ✅ | DONKI proxy | Do not use (needs key; FLR 404) |
| `jpl-release-2024-080` | https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/ | NASA/JPL | ❌ | Statement about the May 2024 Mars event | Quote |
| `nasa-real-martians-2015` | https://www.nasa.gov/science-research/heliophysics/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/ | NASA | ❌ | Shelter design guidance | Quote |
| `jpl-atomic-clock-2019` | https://www.jpl.nasa.gov/news/how-an-atomic-clock-will-get-humans-to-mars-on-time/ | NASA/JPL | ❌ | Earth–Mars signal delay | Quote |

---

## 2. Bundled snapshots (static fallback)

All of these are generated from real responses by `src/integrations/nasa/tools/nasa-snapshot-tool.mjs build <rawDir>`. Each file's header lists the exact URL, HTTP status and capture time.

| File | Content | Captured (UTC) | Source URL(s) |
|---|---|---|---|
| `src/data/nasa/generated/donkiReplay2024.generated.ts` | DONKI record `2024-05-20T05:36:00-CME-001` + alert `20240520-AL-001` metadata | 2026-11-14T11:08Z | `…/DONKI-API/get/CME?startDate=2024-05-19&endDate=2024-05-22`, `…/notifications?startDate=2024-05-19&endDate=2024-05-23&type=ALL` |
| `src/data/nasa/generated/marsRad2024.generated.ts` | 990 Curiosity MSL-RAD surface samples, `[timestamp, µGy/h]`, 2024-05-15 → 05-26 | 2026-11-14T11:08Z | RadLab query in `MARS_RAD_2024_SOURCE_URL` |
| `src/data/nasa/generated/edaIssEnvironment.generated.ts` | 24 per-mission summaries (medians and ranges of ISS °C, %RH, CO₂ ppm; mGy/day) + data-quality warnings | 2026-11-14T11:08Z | `/eda/api/missions/` + 24 × `/eda/dashboard_<name>` |
| `src/data/nasa/generated/osdrStudies.generated.ts` | OSD-655, OSD-773, OSD-476 metadata (selected keys) | 2026-11-14T11:08Z | `/biodata/api/v2/dataset/<OSD>/` |

**Derived values** are computed at load time by the tested normalizers, not hand-typed. They live in `marsRad2024.ts`, `edaIssEnvironment.ts`, `osdrPlantStudies.ts` and `solarStormWatchSnapshot.ts`.

**Test fixtures** (`src/integrations/nasa/fixtures/*.fixtures.ts`) are real records from the same capture. The one alteration: a notification body truncated to 1,200 characters, as noted in the file.

**Snapshot size:** about 60 KB of TypeScript source. The game does not import any of it today; the build output is byte-identical to `main`.

---

## 3. Attribution text to display in the tool

Show this next to the data, and in a "Data sources" panel.

| When showing… | Credit line |
|---|---|
| DONKI events / alerts / ENLIL predictions | "Space weather events: NASA CCMC DONKI (Moon to Mars Space Weather Analysis Office), ccmc.gsfc.nasa.gov/tools/DONKI. We acknowledge the Community Coordinated Modeling Center (CCMC) at Goddard Space Flight Center for the use of DONKI." |
| Curiosity RAD values | "Mars surface radiation: Curiosity RAD via NASA OSDR RadLab (data courtesy of NASA OSDR)." |
| EDA values | "ISS environment data: NASA OSDR Environmental Data App (data courtesy of NASA OSDR)." |
| OSDR study cards | "NASA OSDR <accession> — <study title>" + a link to `https://osdr.nasa.gov/bio/repo/data/studies/<accession>` |
| JPL / NASA articles | Article title, publisher, date, link |

**Required disclaimers:**
1. **DONKI:** *"NOAA's Space Weather Prediction Center is the United States Government official source for space weather forecasts."* DONKI data is *"prototyping quality"* research information. The game uses it to learn, **never as a safety warning**.
2. **HESPERIA RELeASE:** if any SEP record whose instrument begins `MODEL: REleASE` is ever displayed, CCMC requires the HESPERIA acknowledgement inline (see https://ccmc.gsfc.nasa.gov/publication-policy/). Our code excludes these records from displayed counts.
3. **OSDR:** *"The OSDR is designed for research purposes only."* Data is provided *"under NASA's open access policy."* Cite each dataset.
4. **Snapshots:** label them "Real NASA data from <date>". Never call a snapshot "live", "now" or "today".
5. **No endorsement:** do not imply that NASA built, sponsors or endorses the game. This repeats the rule in `07_SCIENCE_AND_CONTENT_SOURCES.md`.

---

## 4. Distinguishing where a number was measured

Every number shown in UI copy must carry one of these location tags. `EvidenceCard.location` in `solarStormWatchSnapshot.ts` implements them.

| Tag | Examples | Never present as |
|---|---|---|
| **Mars surface** | Curiosity RAD dose rate | ISS or deep-space values |
| **Sun and near-Earth space** | DONKI flare class, CME speed, GOES SEP, Kp | Conditions at Mars |
| **Model prediction** | WSA-ENLIL "Mars" arrival times | Observations |
| **International Space Station** | EDA CO₂, temperature, ISS dose | Mars habitat values |
| **Moon** | LRO CRaTER, Apollo-regolith plants (OSD-476, a ground lab study) | Mars |

---

## 5. Do-not-use list (with reasons)

| Item | Reason |
|---|---|
| MAVEN EUVM flare catalog values | DONKI's own note: *"quick look data and should not be used for analysis or publication"* |
| RadLab-integrated May-20 dose presented as "8,100 µGy" | RadLab gives ≈1,487 µGy for the UTC day. NASA's 8,100 µGy is a different derivation. Quote NASA's figure as NASA's statement. |
| EDA dashboard scraping at runtime | Undocumented, 0.1–6.8 MB per page, CORS-blocked |
| OSD-773 data | Organism recorded as "Microbiota" (microbiome profiling) |
| OSD-476 RNA-seq | Gene-expression data adds nothing kid-appropriate. Cite the published finding instead. |
| Rodent Research biology | Out of scope per the brief. Only the ISS **cabin** telemetry from those windows is used. |
| api.nasa.gov `DEMO_KEY` in client code | Shared key with tiny limits; keys must not ship in client code |
