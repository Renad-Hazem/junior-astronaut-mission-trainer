# NASA API Feasibility Report

**Tested:** 2026-11-14, about 10:30–11:30 UTC · **Branch:** `research/nasa-bonus-mission` · **Baseline:** `origin/main` @ `46c1b0bcf84e9b0df596ff09158ef7a612b3b839`

Every status code, size, header and field name below was observed in a real request. Where something was not tested, we say so.

---

## 0. Bottom line

| API | Responded? | Browser CORS | Auth | Limits | Verdict |
|---|---|---|---|---|---|
| **CCMC DONKI-API v2.0** | ✅ all event types 200 | ✅ `Access-Control-Allow-Origin: *` (also on 400s), preflight 200 | none | Window ≤ 60 days. No pagination. No documented rate limit. | **Use now** (browser-direct) |
| api.nasa.gov DONKI mirror | ⚠️ CME/notifications 200, **FLR 404** | ✅ `*` | API key (403 without) | `DEMO_KEY`: documented 30/h and 50/day per IP; header showed `X-RateLimit-Limit: 10` | **Do not use** |
| OSDR **EDA** API | ✅ metadata 200 | ❌ no ACAO header | none | Metadata only. Telemetry only in undocumented HTML. | **Snapshot now**; live only via proxy |
| OSDR **Biodata** API v2 | ✅ 200 | ❌ no ACAO header | none | No pagination. CSV default. | **Reference cards only** |
| OSDR **RadLab** API (official resource) | ✅ 200 | ❌ no ACAO header | none | — | **Snapshot now** (Mars spike) |
| OSDR Search API (official resource) | ✅ 200 | ⚠️ `ACAO: osdr.nasa.gov` only | none | Noisy results | Do not use in-game |

**Method:**
- Node 24.13.1 `fetch` with full TLS verification.
- An `Origin: http://localhost:5173` header on every request, plus a separate `OPTIONS` preflight.
- Browser CORS is inferred from the server's response headers. We did **not** run these calls inside a real browser tab, but servers that send no `Access-Control-Allow-Origin` are blocked by every standards-compliant browser.

The raw captures behind the bundled fixtures are recorded with URL, status, `Access-Control-Allow-Origin` and timestamp. Regenerate them with `node src/integrations/nasa/tools/nasa-snapshot-tool.mjs capture <dir-outside-repo>`.

**Network notes for whoever re-runs this:**
- Node's default 250 ms "happy-eyeballs" connect attempt produced spurious `ETIMEDOUT` on this connection. Raise it with `--network-family-autoselection-attempt-timeout=5000`; the tools do this automatically.
- Connections to `visualization.osdr.nasa.gov` and `www.nasa.gov` occasionally hit 10 s connect timeouts that went away on retry.
- In 1 of 3 live smoke runs, the first two DONKI calls failed this way. The other runs were fully green. See §6.

---

## 1. DONKI (CCMC DONKI-API v2.0)

**Docs:** https://ccmc.gsfc.nasa.gov/DONKI/api/. This is a Scalar viewer of the OpenAPI 3.0.1 spec at `https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/`, with server `https://ccmc.gsfc.nasa.gov/DONKI-API` and no `securitySchemes`.

**Migration:** DONKI's news says that on **2026-09-30** the web app and API *"migrated to new official URLs"*. `kauai.ccmc.gsfc.nasa.gov` → `ccmc.gsfc.nasa.gov`, and *"Endpoint paths following /DONKI/ remain unchanged."*

### 1.1 Requests and results

| Request (`https://ccmc.gsfc.nasa.gov/DONKI-API/get/…`) | HTTP | Size | Time | Observed result |
|---|---|---|---|---|
| `RBE?catalog=ALL&version=Latest` *(brief example)* | 200 JSON | 3,856 B | 871 ms | 5 radiation-belt enhancements (2026-10-16 … 11-08). Instrument `GOES-P: SEISS >2MeV`. Linked to HSS/CME IDs. |
| `HSS` *(brief example)* | 200 JSON | 2,869 B | 381 ms | 7 high-speed streams. Instruments from ACE, IMAP, SOLAR-1 and STEREO A. |
| `FLR` (default = last 30 days) | 200 JSON | 5,980 B | 207 ms | 13 flares: 10 M-class (M1.1–M3.5) and 3 C-class |
| `SEP` (default) | 200 JSON | **2 B (`[]`)** | 301 ms | No SEP events in the window. An empty list is normal. |
| `CME?startDate=2026-10-15&endDate=2026-11-14` | 200 JSON | **158,358 B** | 1,223 ms | 86 CMEs (85 with analyses). **10 have WSA-ENLIL runs listing "Mars".** |
| `notifications` (default = last 7 days) | 200 JSON | 37,365 B | 787 ms | 8 messages (RBE 4, CME 3, Report 1) |
| `FLR?startDate=2026-09-15&endDate=2026-11-14` (60 days) | 200 | 13,104 B | — | Accepted |
| `FLR?startDate=2026-11-05&endDate=2026-11-05` (same day) | 200 | 490 B | — | Includes that day's M3.5 flare |
| `FLR?startDate=2024-05-01&endDate=2024-05-31` | 200 | 102,947 B | 8.1 s | 181 flares, 21 X-class (X1.0–X8.7) |
| `SEP` / `GST` / `IPS` for May 2024 | 200 | 9.4 / 5.2 / 7.2 KB | — | 14 SEP; 5 GST (max Kp **9** on 2024-05-10, source NOAA); 14 IPS (Earth 10, STEREO A 4) |
| `FLR?…2024-05…&catalog=MAVEN_EUVM_FLARE_CATALOG` | 200 | 36,410 B | — | 43 flares seen from Mars orbit. Record note: *"quick look data and should not be used for analysis or publication"*. |
| `CME?startDate=2024-05-19&endDate=2024-05-22` | 200 | 35,362 B | — | Includes `2024-05-20T05:36:00-CME-001` (see Bonus Mission 05) |

### 1.2 Error and edge behaviour

| Case | Observed |
|---|---|
| `CME` without dates | **400** JSON `{"timestamp":…,"status":400,"error":"Bad Request","path":"/DONKI-API/get/CME"}` |
| Range of 61 days | **400** `text/plain`: `API Error: Date range cannot exceed 60 days. You requested 61 days.` |
| `startDate` after `endDate` | **400** `text/plain`: `API Error: startDate cannot be after endDate.` |
| Malformed date `2026-13-45` | **200, byte-identical to the default window**. Silently ignored, so validate client-side (`validateDonkiWindow`). |
| `OPTIONS` preflight | 200, `ACAO: *`, `Access-Control-Allow-Methods: GET`, `Access-Control-Allow-Headers: content-type` |
| `link` fields in records (`…/DONKI/view/CME/31034/-1`) | **308** to the trailing-slash URL. Browsers follow it. |
| Timeout and offline | Simulated in tests: the client returns `timeout` / `network-or-cors` and never throws |

**Day counting:** the server counts `endDate − startDate`. 2026-09-14 → 11-14 is "61 days" and rejected; 09-15 → 11-14 is 60 and accepted.

**Defaults** (from the spec, confirmed for FLR and SEP): most endpoints default to the last 30 days, notifications and WSA-ENLIL to the last 7. `CME` **requires** both dates.

### 1.3 Actual field names (observed, with nullability that differs from the spec)

- **FLR:** `flrID, catalog, instruments[{displayName}], beginTime, peakTime, endTime, classType, sourceLocation, activeRegionNum (number|null), note, link, linkedEvents (array|null), sentNotifications (array|null), submissionTime, versionId`
- **CME:** `activityID, catalog, startTime, instruments[], sourceLocation ('' when unknown), activeRegionNum|null, note, cmeAnalyses[], linkedEvents|null, sentNotifications|null, link, submissionTime, versionId`
  - **cmeAnalyses[]:** `isMostAccurate, levelOfData, time21_5, latitude, longitude (number|null), halfAngle, speed, type (SCORE letter), featureCode ("LE" leading edge / "SH" shock …), imageType, measurementTechnique, note, minorHalfWidth (null), speedMeasuredAtHeight|null, tilt (null), submissionTime, link, enlilList[]`
  - **enlilList[]:** `modelCompletionTime, au, estimatedShockArrivalTime|null, isEarthGB, isEarthMinorImpact, rmin_re|null, kp_18|null, kp_90|null, kp_135|null, kp_180|null, estimatedDuration|null, link, impactList[{location, arrivalTime, isGlancingBlow, isMinorImpact}], cmeIDs[]`
- **SEP / RBE / HSS:** `sepID|rbeID|hssID, eventTime, instruments[], link, linkedEvents|null, sentNotifications|null, submissionTime, versionId`
- **GST:** `gstID, startTime, allKpIndex[{observedTime, kpIndex, source}], link, linkedEvents, sentNotifications, submissionTime, versionId`
- **IPS:** adds `catalog, activityID, location` ("Earth", "STEREO A")
- **notifications:** `messageType, messageID, messageURL, messageIssueTime, messageBody`. The body always carries the NOAA SWPC disclaimer and SCORE scale.
- **Time format:** minute precision with `Z` (e.g. `2026-10-16T15:38Z`). IDs embed seconds.

### 1.4 Supported transformations (implemented in `src/integrations/nasa/normalizers.ts`)

- **Flare class → letter, magnitude and peak X-ray flux** (A=1e-8 … X=1e-4 W/m², each letter 10×).
- **CME speed:** prefer the most-accurate `LE` analysis (matches DONKI's own alert). Expose the `SH` shock speed separately. For 2024-05-20 that is LE 1,927 km/s and SH 2,678 km/s.
- **SCORE type** from speed. DONKI quotes it: *S < 500, C 500–999, O 1000–1999, R 2000–2999, ER > 3000 km/s*.
- **Far-side flag:** HEEQ |longitude| > 90°.
- **ENLIL impacts → `predictedImpacts`**, deduplicated and labelled as model output.
- **SEP `isModelForecast`:** instruments named `MODEL: REleASE:…` are HESPERIA RELeASE forecasts, not observations. CCMC requires a specific inline HESPERIA acknowledgement wherever they are shown, so they are excluded from observed counts.
- **Activity tier** (`quiet` / `active` / `storm`) for framing text only:
  - `storm` = an observed SEP, an X flare, or a CME ≥ 1,000 km/s predicted at Mars
  - `active` = an M flare, a CME ≥ 500 km/s, or any Mars prediction

### 1.5 Measurement location (important for kids' copy)

DONKI observations are made **at or near Earth and the Sun**:
- GOES (geostationary Earth orbit): flare X-rays and particles
- SOHO and STEREO A coronagraphs: CMEs
- ACE, IMAP and SOLAR-1 at L1: solar wind

DONKI does **not** measure conditions at Mars. Two related items:
- **"Mars" in `impactList` is a WSA-ENLIL model prediction.**
- The MAVEN EUVM flare catalog (Mars orbit) is quick-look data that its own note says not to use for analysis or publication.

### 1.6 Usage terms

- **Rules of the Road:** data *"should be considered only as prototyping quality and in research context."*
- **Disclaimer:** *"NOAA Space Weather Prediction Center is the United States Government official source for space weather forecasts."*
- **Acknowledgement** (CCMC publication policy): *"We acknowledge the Community Coordinated Modeling Center (CCMC) at Goddard Space Flight Center for the use of the [tool], [URL]."*

### 1.7 api.nasa.gov mirror (`https://api.nasa.gov/DONKI/…`)

| Request | Result |
|---|---|
| `FLR?…&api_key=DEMO_KEY` | **404**. Upstream body `{"status":404,"error":"Not Found","path":"/DONKI-API/get/FLR/"}`, so the gateway appends a trailing slash. Headers: `X-RateLimit-Limit: 10`, `X-RateLimit-Remaining: 9`. |
| `FLR` without key | **403** `API_KEY_MISSING` |
| `CME?…&api_key=DEMO_KEY` / `notifications?api_key=DEMO_KEY` | 200 (64 KB / 37 KB) |

Documented limits (api.nasa.gov authentication page): **1,000 requests/hour per key**; **DEMO_KEY 30/hour and 50/day per IP address**. The header we observed (10) differs from that documentation.

---

## 2. OSDR Environmental Data App (EDA)

| Request | HTTP | Size | Result |
|---|---|---|---|
| `GET /eda/api/` | 200 JSON | 68 B | `{"missions":"https://visualization.osdr.nasa.gov/eda/api/missions/"}` |
| `GET /eda/api/missions/` *(brief endpoint)* | 200 JSON | 26 KB | **24 missions**: 18 Rodent Research (RR-1 … RR-28), APEX-03-1, APEX-03-2, APEX-04, VEG-01A/B/C. Fields: `name, title, description, link`. |
| `GET /eda/api/missions` (no slash) | **301** → `/eda/api/missions/` | — | — |
| `GET /eda/api/missions/RR-9/` | 200 JSON | ~0.7 KB | Same 4 fields. **Metadata only, no telemetry.** |
| `GET /eda/api/missions/NOPE-99/` | **404** JSON | 48 B | `{"detail":"No Mission matches the given query."}` |
| `GET /eda/dashboard_<mission>` *(undocumented UI route)* | 200 HTML | 17 KB – 6.8 MB | Telemetry embedded as `<script id="data">` JSON |
| `GET /eda/dashboard_NOPE-99` | **500** HTML | — | — |
| CORS (all of the above) | **no `Access-Control-Allow-Origin`** | — | Preflight 200, also without ACAO → blocked in browsers |

**Dashboard data shape:**
- `telemetry_data` (a JSON *string*): `time, temperature_iss, temperature_ground, rh_iss, rh_ground, co2_iss, co2_ground, milestones`. Values are strings, missing values are `"NA"`, and the median interval is 1–15 minutes depending on the mission (RR-23: 1, RR-9: 5, APEX-04: 10, VEG-01A: 15).
- `radiation_data` (a JSON string): `time, gcr, saa, total, accumulated, milestones`, daily.

**Units** (from EDA's plot code): temperature **°C**, humidity **%RH**, CO₂ **ppm**, dose **mGy/day**. The "Accumulated" axis is also labelled mGy/day although it is cumulative mGy.

**Coverage we measured (all 24 dashboards):**
- CO₂ exists only for Rodent Research windows. EDA explicitly shows *"There is no CO2 data available"* for APEX-03-1/2, APEX-04, VEG-01A and VEG-01C. RR-18 also has none.
- Radiation exists for 11 RR windows only.
- Median ISS cabin CO₂ per mission is **2,141–3,892 ppm**, excluding flagged missions.
- Median ISS total dose is **0.203–0.363 mGy/day**.

**Data-quality issues found:**
- **RR-9:** telemetry milestones date "Animal transfer to ISS" to **2018**-08-18, but the radiation milestones date it **2017**-08-18. The mission is SpaceX-12. This is internal to EDA.
- **RR-22:** CO₂ median is 811 ppm, far below every other mission. It is flagged and excluded.

**Scientific relevance:**
- These are **ISS cabin** values (low Earth orbit), recorded during the dates of biology missions. They are not Mars and not rodent biology.
- They are good for an ISS-vs-Mars comparison card: "the station's air holds a few thousand ppm of CO₂".
- They must not replace the game's 0–100 bars.

**Feasibility:** a live call can only fetch mission names. Telemetry would mean scraping undocumented, multi-MB HTML through a proxy, which is **not recommended**. We ship a 24-row summary snapshot (`src/data/nasa/generated/edaIssEnvironment.generated.ts`) with the method in its header.

---

## 3. OSDR Biological Data API v2

**Docs:** `https://visualization.osdr.nasa.gov/biodata/api/` returns the OpenAPI **3.1.0** document itself as JSON ("NASA OSDR Biological Data API", version 2.0.0). It lists 11 paths: dataset / files / assays / samples, and `query/{datasets,assays,samples}`.

| Request | HTTP | Size | Result |
|---|---|---|---|
| `/v2/datasets/` | 200 | 60 KB | **647 datasets** as `{ "OSD-1": {REST_URL}, … }`. No pagination. |
| `/v2/dataset/OSD-655/` | 200 | 15 KB | `{ "OSD-655": { REST_URL, assays, files, metadata } }` |
| `/v2/dataset/OSD-655/assays/` | 200 | 821 B | 3 assays: ICP-OES elemental analysis, ORAC antioxidant capacity, phenolic content |
| `/v2/dataset/OSD-476/assays/` | 200 | 446 B | RNA-seq (Illumina) + morphometric image analysis (ImageJ) |
| `/v2/query/datasets/?study.characteristics.organism=Arabidopsis%20thaliana&format=json.records` | 200 | 5 KB | 63 rows `{id.accession, study.characteristics.organism}` |
| `/v2/query/datasets/?format=json` | **400** | — | `"Unsupported format: json"`. Use `json.records`, `json.table` or `json.split`. |
| `/v2/dataset/OSD-999999/` | **422** | — | `UNPROCESSABLE_ENTITY` (not 404) |
| `/v2/metadata/fields/` (named in the spec as the field-name source) | **404** | — | Not available |
| CORS | **no ACAO** | — | Browser-blocked |

**Observed metadata keys:**
- `study title`, `organism`, `project identifier`, `experiment platform`, `flight program`
- `mission.{name,start date,end date}`, `managing nasa center`, `study factor name`, `study description`, `study public release date` (unix seconds)

**Studies checked:**

| ID | Title (abridged) | Organism | Missions / platform | Suitability |
|---|---|---|---|---|
| OSD-655 | Pick-and-eat space crop production flight testing on the ISS (Elemental Analysis, ORAC, Phenolic Content) | *Brassica rapa* (mizuna) | SpaceX-16, SpaceX-18 · VEGGIE · KSC. Factors include **Light Color**. | ✅ Greenhouse light trade-off |
| OSD-773 | XROOTS aeroponic/hydroponic technical demonstration | **"Microbiota"** | SpaceX-26, SpaceX-27, NG-17 | ⚠️ Data is microbial profiling. Context only. |
| OSD-476 | Plants grown in Apollo lunar regolith present stress-associated transcriptomes | *Arabidopsis thaliana* | Ground study (no flight program) · JSC | ⚠️ Moon soil, RNA-seq. Cite the finding only. |

Per the brief, we did **not** pull rodent gene-expression or microbiome data.

**Usage terms** (OSDR Terms, updated Sep 19 2025, now at science.nasa.gov):
- *"These data are provided under NASA's open access policy."*
- A bibliographic citation is requested.
- *"The OSDR is designed for research purposes only."*

---

## 4. RadLab (officially linked)

| Request | HTTP | Size | Result |
|---|---|---|---|
| `/radlab/api/?celestial_body=Mars&spacecraft&instrument&instrument_id&trajectory&timestamp%3E=2024-05-15&timestamp%3C2024-05-26&absorbed_dose_rate&dose_equivalent_rate&format=json` | 200 JSON | 103,581 B | 990 rows. `{columns, index, data}` ("split"). Spacecraft `Curiosity`, instrument `MSL-RAD`, id `MSL-RAD-Surface`, trajectory `Mars surface`. |
| `/radlab/api/` (no query) | **500** | — | — |
| CORS | **no ACAO** | — | Browser-blocked |

**Units** (RadLab docs): `absorbed_dose_rate` **µGy/hour**; `dose_equivalent_rate` µSv/hour, which is `null` for all MSL rows.

**What the data shows** (computed by `marsRad2024.ts`, unit-tested):
- Baseline is ≈ 4.1 µGy/h, about 98.5 µGy per day (15–19 May 2024).
- On **2024-05-20** the first sample above 10 µGy/h came at **05:38:56 UTC**.
- The peak was **304 µGy/h at 06:15:19 UTC**.
- Rates stayed above 2× baseline until 2024-05-21 17:00 UTC (≈ 35 h).
- Integrated dose on 20 May (UTC) was ≈ **1,487 µGy** (≈ 15× a quiet day).

**Caveat:** RadLab does not document the dosimetric medium or channel for these rows. NASA's public figure for the same event is **8,100 µGy** (JPL release 2024-080). That is a different quantity or derivation, so do not mix the two.

---

## 5. OSDR Search API (officially linked)

`GET https://osdr.nasa.gov/osdr/data/search?term=plant&size=3` → 200 JSON (Elasticsearch-style `hits`).
- **3,505 total hits**; the first was an MG-RAST *sewage* metagenome.
- `Access-Control-Allow-Origin: osdr.nasa.gov`, so other origins are blocked.

It's unsuitable for unsupervised use with kids.

---

## 6. Live verification through our TypeScript clients

`node src/integrations/nasa/__tests__/live.smoke.ts` (3 runs, 2026-11-14 ~11:20 UTC):

| Call | Run 1 | Runs 2–3 |
|---|---|---|
| DONKI FLR (30 d) | ❌ `network-or-cors` (Node `fetch failed`, transient) | ✅ 13 flares |
| DONKI CME (30 d) | ❌ same | ✅ 86 CMEs, 10 with Mars predictions |
| DONKI SEP (30 d) | ✅ 0 events | ✅ 0 events |
| EDA missions / VEG-01A | ✅ 24 / ✅ | ✅ / ✅ |
| Biodata OSD-655 | ✅ | ✅ |
| RadLab Mars 2024-05-20 | ✅ 139 rows | ✅ 139 rows |
| `loadSolarStormWatchData()` | ✅ live, tier `active` | ✅ live, tier `active` |

Tier `active` reasons, as returned: *"10 M-class flare(s) recorded; 26 CME(s) of 500+ km/s; a model run predicts a CME reaching Mars"*.

**Takeaway:** transient network failures happen, and the client turns them into typed errors. The mission must always work from the bundled replay, and it does.

---

## 7. Useful now vs later

| Now | Later (needs owner approval and/or a proxy) | Not recommended |
|---|---|---|
| DONKI replay (2024-05-20) + optional live DONKI panel | EDA mission list via proxy | api.nasa.gov DONKI mirror |
| RadLab Mars-spike snapshot | RadLab live queries via proxy (e.g. ISS vs Mars comparison) | Scraping EDA dashboards at runtime |
| EDA ISS CO₂ summary card | Biodata live study lookups via proxy | OSDR Search API in-game |
| OSD-655 study card | Mars Trek terrain (untested) | Rodent RNA-seq / microbiome data; MAVEN quick-look flare values |
