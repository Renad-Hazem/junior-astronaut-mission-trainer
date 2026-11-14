/**
 * Machine-readable registry of every NASA source this data layer touches.
 * Every field below was checked on 2026-11-14 (see src/docs/research/NASA_API_FEASIBILITY.md
 * for the exact requests, statuses and response sizes). Re-verify with
 * `node src/integrations/nasa/__tests__/live.smoke.ts` before relying on it.
 */
import type { DataProvenance, NasaSourceId } from './types.ts';

export type BrowserCors = 'allowed' | 'blocked' | 'restricted-to-own-origin' | 'not-applicable';
export type GameUse = 'use-now' | 'use-later' | 'reference-only' | 'do-not-use';

export interface NasaSourceRecord {
  id: NasaSourceId;
  name: string;
  operator: string;
  /** Linked on the official challenge Resources tab (page lastPublishedAt 2026-11-13T03:48:49Z). */
  listedOnOfficialChallengePage: boolean;
  documentationUrl: string;
  apiBaseUrl: string | null;
  auth: 'none' | 'api-key';
  browserCors: BrowserCors;
  rateLimit: string;
  queryLimits: string[];
  formats: string[];
  /** Where the measurements/model outputs come from. */
  measurementContext: string;
  verifiedAt: string;
  verificationSummary: string;
  /** Credit line to display wherever the data appears. */
  attribution: string;
  /** Usage caveat to display alongside the data, quoted or closely paraphrased from the source. */
  disclaimer?: string;
  gameUse: GameUse;
  gameUseNotes: string;
}

const VERIFIED = '2026-11-14';

export const DONKI_DISCLAIMER =
  'NOAA’s Space Weather Prediction Center is the United States Government official source for space weather forecasts. DONKI is “Experimental Research Information” (preliminary NASA research products) — used here for learning, never as a safety warning.';

export const NASA_SOURCES: Readonly<Record<NasaSourceId, NasaSourceRecord>> = {
  donki: {
    id: 'donki',
    name: 'DONKI — Space Weather Database Of Notifications, Knowledge, Information (DONKI-API v2.0)',
    operator: 'NASA GSFC Community Coordinated Modeling Center (CCMC); events analyzed by the Moon to Mars Space Weather Analysis Office',
    listedOnOfficialChallengePage: true,
    documentationUrl: 'https://ccmc.gsfc.nasa.gov/DONKI/api/',
    apiBaseUrl: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get',
    auth: 'none',
    browserCors: 'allowed',
    rateLimit: 'None documented in the OpenAPI spec (https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/). Be polite: cache responses.',
    queryLimits: [
      'startDate/endDate as yyyy-MM-dd; endDate − startDate must be ≤ 60 days (61 → HTTP 400 text/plain).',
      'startDate after endDate → HTTP 400 "API Error: startDate cannot be after endDate."',
      'Malformed dates (e.g. 2026-13-45) are silently ignored and the default window is returned → validate client-side.',
      '/get/CME requires both dates (missing → HTTP 400 JSON). Other event types default to the last 30 days; notifications to the last 7.',
      'No pagination: the whole window is returned (30 days of CMEs ≈ 158 KB / 86 records on 2026-11-14).',
    ],
    formats: ['application/json', 'text/plain for 400 range errors', 'CMEAnalysis.txt'],
    measurementContext:
      'Sun and near-Earth space: GOES flare X-rays (Earth orbit), SOHO/STEREO A coronagraphs, L1 solar-wind monitors (ACE, IMAP, SOLAR-1), GOES particle sensors. NOT measured at Mars. WSA-ENLIL arrival times (including "Mars") are model predictions.',
    verifiedAt: VERIFIED,
    verificationSummary:
      'FLR/SEP/CME/RBE/HSS/GST/IPS/notifications all HTTP 200 JSON; Access-Control-Allow-Origin: * and OPTIONS preflight 200. SEP for 2026-10-15..11-14 returned [] (valid empty window).',
    attribution:
      'Space weather events: NASA CCMC DONKI (Moon to Mars Space Weather Analysis Office), https://ccmc.gsfc.nasa.gov/tools/DONKI/. We acknowledge the Community Coordinated Modeling Center (CCMC) at Goddard Space Flight Center for the use of DONKI.',
    disclaimer: DONKI_DISCLAIMER,
    gameUse: 'use-now',
    gameUseNotes:
      'Bonus Mission 05 historical replay (2024-05-20 far-side CME) + optional "What is the Sun doing now?" panel. Never map DONKI numbers onto 0–100 resource bars.',
  },
  'api-nasa-gov': {
    id: 'api-nasa-gov',
    name: 'api.nasa.gov (NASA Open APIs gateway, incl. a DONKI mirror)',
    operator: 'NASA',
    listedOnOfficialChallengePage: true,
    documentationUrl: 'https://api.nasa.gov/',
    apiBaseUrl: 'https://api.nasa.gov/DONKI',
    auth: 'api-key',
    browserCors: 'allowed',
    rateLimit:
      'Documented: 1,000 requests/hour per key; DEMO_KEY 30/hour and 50/day per IP. Observed header on 2026-11-14 for DEMO_KEY: X-RateLimit-Limit: 10.',
    queryLimits: ['Missing api_key → HTTP 403 API_KEY_MISSING.'],
    formats: ['application/json'],
    measurementContext: 'Proxy of the CCMC DONKI-API.',
    verifiedAt: VERIFIED,
    verificationSummary:
      'DONKI/CME and DONKI/notifications → 200 with DEMO_KEY, but DONKI/FLR → 404 (upstream path "/DONKI-API/get/FLR/" with trailing slash). Catalog (16 APIs) does not list "Mars Rover Photos".',
    attribution: 'NASA Open APIs, https://api.nasa.gov/',
    gameUse: 'do-not-use',
    gameUseNotes: 'Needs a key (cannot ship in client code) and FLR was broken at test time. Call CCMC DONKI-API directly instead.',
  },
  eda: {
    id: 'eda',
    name: 'OSDR Environmental Data App (EDA)',
    operator: 'NASA Open Science Data Repository (Ames Research Center)',
    listedOnOfficialChallengePage: false,
    documentationUrl: 'https://visualization.osdr.nasa.gov/eda/',
    apiBaseUrl: 'https://visualization.osdr.nasa.gov/eda/api',
    auth: 'none',
    browserCors: 'blocked',
    rateLimit: 'None documented.',
    queryLimits: [
      'Documented JSON endpoints return mission METADATA only: /eda/api/ (index), /eda/api/missions/ (24 missions), /eda/api/missions/{name}/ (404 JSON for unknown names). No-trailing-slash URLs 301-redirect.',
      'Telemetry/radiation series are only embedded in the HTML dashboards (/eda/dashboard_{name}, 0.5–5 MB each, undocumented, 500 for unknown names) → use curated snapshots, do not scrape at runtime.',
    ],
    formats: ['application/json (metadata)', 'text/html with embedded JSON (dashboards)'],
    measurementContext:
      'International Space Station cabin telemetry (°C, %RH, CO₂ ppm) and ISS radiation dose (mGy/day: GCR, SAA, total, accumulated) during 24 named biology missions (18 Rodent Research, 3 APEX, 3 VEG) plus matched ground-control chambers. NOT Mars or Moon.',
    verifiedAt: VERIFIED,
    verificationSummary:
      'missions endpoint 200 JSON (24 records) with NO Access-Control-Allow-Origin header; CO₂ absent for plant missions and RR-18; radiation present for 11 RR windows only.',
    attribution: 'ISS environment data: NASA OSDR Environmental Data App, https://visualization.osdr.nasa.gov/eda/ (data courtesy of NASA OSDR).',
    disclaimer: 'OSDR states it is designed for research purposes only; values are ISS cabin measurements, not Mars conditions.',
    gameUse: 'use-later',
    gameUseNotes: 'Use the bundled per-mission summary for an ISS-vs-Mars comparison card (e.g. ISS cabin CO₂ ≈ 2,100–3,900 ppm medians). Live use needs a server-side proxy.',
  },
  'osdr-biodata': {
    id: 'osdr-biodata',
    name: 'OSDR Biological Data API v2',
    operator: 'NASA Open Science Data Repository',
    listedOnOfficialChallengePage: false,
    documentationUrl: 'https://visualization.osdr.nasa.gov/biodata/api/',
    apiBaseUrl: 'https://visualization.osdr.nasa.gov/biodata/api/v2',
    auth: 'none',
    browserCors: 'blocked',
    rateLimit: 'None documented.',
    queryLimits: [
      'No pagination: /v2/datasets/ returns all 647 datasets (≈60 KB) at once.',
      'Query endpoints default to CSV; format must be csv|tsv|json.records|json.table|json.split ("json" → 400).',
      'Unknown accession → HTTP 422 UNPROCESSABLE_ENTITY (not 404). /v2/metadata/fields/ is referenced by the spec but returned 404.',
    ],
    formats: ['application/json', 'text/csv', 'text/tab-separated-values'],
    measurementContext: 'Study metadata for spaceflight and ground biology experiments (ISS, Shuttle, ground analogs).',
    verifiedAt: VERIFIED,
    verificationSummary:
      'datasets/dataset/assays/query endpoints 200 JSON with NO Access-Control-Allow-Origin header. Arabidopsis thaliana filter → 63 datasets.',
    attribution: 'Space biology metadata courtesy of NASA OSDR, https://osdr.nasa.gov/bio/repo/ (cite each study by its OSD accession).',
    disclaimer: 'OSDR states it is designed for research purposes only.',
    gameUse: 'reference-only',
    gameUseNotes: 'Bundle curated study cards (OSD-655 VEG-04 mizuna). Do not pull gene-expression or microbiome data into gameplay.',
  },
  'osdr-search': {
    id: 'osdr-search',
    name: 'OSDR Search API',
    operator: 'NASA Open Science Data Repository',
    listedOnOfficialChallengePage: true,
    documentationUrl: 'https://osdr.nasa.gov/bio/repo/',
    apiBaseUrl: 'https://osdr.nasa.gov/osdr/data/search',
    auth: 'none',
    browserCors: 'restricted-to-own-origin',
    rateLimit: 'None documented.',
    queryLimits: ['term=plant returned 3,505 hits including external MG-RAST records (first hit was a sewage metagenome) → filter by data source.'],
    formats: ['application/json (Elasticsearch-style hits)'],
    measurementContext: 'Search index over OSDR studies plus external databases.',
    verifiedAt: VERIFIED,
    verificationSummary: 'HTTP 200 JSON; Access-Control-Allow-Origin: osdr.nasa.gov (other origins blocked).',
    attribution: 'NASA OSDR, https://osdr.nasa.gov/bio/repo/',
    disclaimer: 'OSDR states it is designed for research purposes only.',
    gameUse: 'do-not-use',
    gameUseNotes: 'Noisy for kids and CORS-restricted; curated study cards are safer.',
  },
  radlab: {
    id: 'radlab',
    name: 'RadLab — OSDR Radiation Dosimetry Database API',
    operator: 'NASA Open Science Data Repository',
    listedOnOfficialChallengePage: true,
    documentationUrl: 'https://visualization.osdr.nasa.gov/radlab/gui/data-api/',
    apiBaseUrl: 'https://visualization.osdr.nasa.gov/radlab/api/',
    auth: 'none',
    browserCors: 'blocked',
    rateLimit: 'None documented.',
    queryLimits: ['Key-value or boolean query syntax; format=csv (default)|tsv|json|html. format=json uses pandas "split" orientation {columns,index,data}.'],
    formats: ['application/json', 'text/csv', 'text/tab-separated-values', 'text/html'],
    measurementContext:
      'Dosimeters on the ISS, Curiosity (MSL-RAD, Mars surface), LRO CRaTER (Moon orbit), TGO Liulin-MO (Mars orbit), BioSentinel (heliocentric). absorbed_dose_rate in µGy/hour; dose_equivalent_rate in µSv/hour.',
    verifiedAt: VERIFIED,
    verificationSummary:
      'celestial_body=Mars, 2024-05-15..05-26 → 200 JSON, 990 Curiosity MSL-RAD surface rows; NO Access-Control-Allow-Origin header. dose_equivalent_rate is null for these rows.',
    attribution: 'Mars surface radiation: Curiosity RAD via NASA OSDR RadLab, https://visualization.osdr.nasa.gov/radlab/ (data courtesy of NASA OSDR).',
    disclaimer:
      'RadLab does not state the dosimetric medium/detector channel for MSL-RAD rows; do not combine these rates with NASA’s published 8,100 µGy estimate for 2024-05-20.',
    gameUse: 'use-now',
    gameUseNotes: 'Bundled hourly snapshot of the 2024-05-20 Mars surface spike is the core evidence for Bonus Mission 05.',
  },
  'jpl-release-2024-080': {
    id: 'jpl-release-2024-080',
    name: 'NASA/JPL news release 2024-080 “NASA Watches Mars Light Up During Epic Solar Storm” (June 10, 2024)',
    operator: 'NASA Jet Propulsion Laboratory',
    listedOnOfficialChallengePage: false,
    documentationUrl: 'https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/',
    apiBaseUrl: null,
    auth: 'none',
    browserCors: 'not-applicable',
    rateLimit: 'n/a',
    queryLimits: [],
    formats: ['text/html'],
    measurementContext: 'Curiosity RAD (Mars surface), Mars Odyssey, MAVEN — May 2024.',
    verifiedAt: VERIFIED,
    verificationSummary:
      'Quoted: flare "later estimated to be an X12"; astronauts nearby "would have received a radiation dose of 8,100 micrograys" ("equivalent to 30 chest X-rays"); "Cliffsides or lava tubes would provide additional shielding".',
    attribution: 'NASA/JPL-Caltech news release 2024-080 (June 10, 2024).',
    gameUse: 'use-now',
    gameUseNotes: 'Quote as NASA’s statement; do not recompute from RadLab.',
  },
  'nasa-real-martians-2015': {
    id: 'nasa-real-martians-2015',
    name: 'NASA “Real Martians: How to Protect Astronauts from Space Radiation on Mars” (Sep 30, 2015; updated Jul 25, 2023)',
    operator: 'NASA',
    listedOnOfficialChallengePage: false,
    documentationUrl: 'https://www.nasa.gov/science-research/heliophysics/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/',
    apiBaseUrl: null,
    auth: 'none',
    browserCors: 'not-applicable',
    rateLimit: 'n/a',
    queryLimits: [],
    formats: ['text/html'],
    measurementContext: 'Mission-design guidance (not a measurement).',
    verifiedAt: VERIFIED,
    verificationSummary:
      'Quoted: water "could be stored strategically to create a kind of radiation storm shelter"; crew "would need to use the water and then replace it with recycled water"; "ensuring that astronauts can quickly return indoors in the event of a radiation storm."',
    attribution: 'NASA, “Real Martians: How to Protect Astronauts from Space Radiation on Mars”.',
    gameUse: 'use-now',
    gameUseNotes: 'Grounds the water-wall shelter and return-indoors trade-offs.',
  },
  'jpl-atomic-clock-2019': {
    id: 'jpl-atomic-clock-2019',
    name: 'NASA/JPL “How an Atomic Clock Will Get Humans to Mars on Time” (June 14, 2019)',
    operator: 'NASA Jet Propulsion Laboratory',
    listedOnOfficialChallengePage: false,
    documentationUrl: 'https://www.jpl.nasa.gov/news/how-an-atomic-clock-will-get-humans-to-mars-on-time/',
    apiBaseUrl: null,
    auth: 'none',
    browserCors: 'not-applicable',
    rateLimit: 'n/a',
    queryLimits: [],
    formats: ['text/html'],
    measurementContext: 'Explainer.',
    verifiedAt: VERIFIED,
    verificationSummary: 'Quoted: "it can take anywhere from 4 to 20 minutes for a one-way signal to travel between planets."',
    attribution: 'NASA/JPL-Caltech (June 14, 2019).',
    gameUse: 'use-now',
    gameUseNotes: 'Grounds the "waiting for Earth" communication-delay trade-off.',
  },
};

export function sourceRecord(id: NasaSourceId): NasaSourceRecord {
  return NASA_SOURCES[id];
}

/** Base provenance fields for a source (caller adds sourceUrl/mode/retrievedAt). */
export function provenanceBase(id: NasaSourceId): Omit<DataProvenance, 'mode' | 'retrievedAt' | 'sourceUrl'> {
  const s = NASA_SOURCES[id];
  return { sourceId: id, attribution: s.attribution, disclaimer: s.disclaimer };
}
