/**
 * NASA data-layer types for Junior Astronaut Mission Trainer.
 *
 * ISOLATED MODULE — not imported by the live game yet. See
 * src/docs/research/INTEGRATION_HANDOFF.md before wiring anything into runtime.
 *
 * Raw `*Raw` interfaces mirror responses actually observed on 2026-11-14
 * (not only the published OpenAPI schemas). Where the live API returned `null`
 * for a field the schema calls an array/number, the type allows `null`.
 */

// ---------------------------------------------------------------------------
// Shared result / provenance model
// ---------------------------------------------------------------------------

export type NasaSourceId =
  | 'donki'
  | 'eda'
  | 'osdr-biodata'
  | 'osdr-search'
  | 'radlab'
  | 'api-nasa-gov'
  | 'jpl-release-2024-080'
  | 'nasa-real-martians-2015'
  | 'jpl-atomic-clock-2019';

/** `live` = fetched during this session. `snapshot` = curated capture bundled with the app. */
export type DataMode = 'live' | 'snapshot';

export interface DataProvenance {
  sourceId: NasaSourceId;
  /** Exact URL requested (live) or captured (snapshot). */
  sourceUrl: string;
  mode: DataMode;
  /** ISO-8601 time the data was retrieved (live) or captured (snapshot). */
  retrievedAt: string;
  /** Human-readable credit line to show next to the data. */
  attribution: string;
  /** Source-specific usage caveat to display, if any. */
  disclaimer?: string;
}

export type NasaErrorKind =
  /** Request parameters failed client-side validation; no network call was made. */
  | 'invalid-request'
  /** Request exceeded the timeout. */
  | 'timeout'
  /** Caller aborted the request. */
  | 'aborted'
  /**
   * fetch() rejected without an HTTP response. In browsers this is how both CORS
   * blocks and offline/DNS/TLS failures surface — they cannot be told apart from JS.
   */
  | 'network-or-cors'
  /** Server answered with a non-2xx status. */
  | 'http'
  /** Body was not valid JSON or did not match the expected shape. */
  | 'invalid-payload';

export interface NasaError {
  kind: NasaErrorKind;
  message: string;
  status?: number;
  /** First ~300 chars of the response body for http/invalid-payload errors. */
  bodySnippet?: string;
  url?: string;
}

export type NasaResult<T> =
  | { ok: true; data: T; provenance: DataProvenance }
  | { ok: false; error: NasaError };

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface ClientOptions {
  /** Override base URL, e.g. a same-origin proxy such as `/api/nasa/eda`. */
  baseUrl?: string;
  /** Request timeout in ms (default 12 000). */
  timeoutMs?: number;
  /** Optional external abort signal. */
  signal?: AbortSignal;
  /** Injectable fetch (tests, SSR, proxies). Defaults to globalThis.fetch. */
  fetchImpl?: FetchLike;
  /** Clock injection for deterministic provenance timestamps in tests. */
  now?: () => Date;
}

// ---------------------------------------------------------------------------
// DONKI (CCMC DONKI-API v2.0, https://ccmc.gsfc.nasa.gov/DONKI-API/get/...)
// ---------------------------------------------------------------------------

export interface DonkiInstrumentRaw {
  displayName: string;
}

export interface DonkiLinkedEventRaw {
  activityID: string;
}

export interface DonkiSentNotificationRaw {
  messageID: string;
  messageIssueTime: string;
  messageURL: string;
}

/** GET /get/FLR — observed live 2026-11-14. */
export interface DonkiFlareRaw {
  flrID: string;
  catalog: string;
  instruments: DonkiInstrumentRaw[];
  /** Minute precision, e.g. "2026-10-16T15:38Z". */
  beginTime: string;
  peakTime: string;
  endTime: string | null;
  /** GOES-style class, e.g. "M1.3", "X5.8". */
  classType: string;
  sourceLocation: string;
  activeRegionNum: number | null;
  note: string;
  link: string;
  linkedEvents: DonkiLinkedEventRaw[] | null;
  sentNotifications: DonkiSentNotificationRaw[] | null;
  submissionTime: string;
  versionId: number;
}

export interface DonkiImpactRaw {
  /** e.g. "Mars", "Juno", "Solar Orbiter", "STEREO A". */
  location: string;
  arrivalTime: string;
  isGlancingBlow: boolean;
  isMinorImpact: boolean;
}

/** WSA-ENLIL model run attached to a CME analysis. These are MODEL PREDICTIONS, not measurements. */
export interface DonkiEnlilRaw {
  modelCompletionTime: string;
  au: number;
  estimatedShockArrivalTime: string | null;
  isEarthGB: boolean;
  isEarthMinorImpact: boolean;
  rmin_re: number | null;
  kp_18: number | null;
  kp_90: number | null;
  kp_135: number | null;
  kp_180: number | null;
  estimatedDuration: number | null;
  link: string;
  impactList: DonkiImpactRaw[] | null;
  cmeIDs: string[] | null;
}

export interface DonkiCmeAnalysisRaw {
  isMostAccurate: boolean;
  levelOfData: number;
  time21_5: string;
  latitude: number | null;
  longitude: number | null;
  halfAngle: number | null;
  /** km/s */
  speed: number | null;
  /** SCORE type letter, e.g. "C", "O", "R". */
  type: string;
  featureCode: string;
  imageType: string;
  measurementTechnique: string;
  note: string;
  minorHalfWidth: number | null;
  speedMeasuredAtHeight: number | null;
  tilt: number | null;
  submissionTime: string;
  link: string;
  enlilList: DonkiEnlilRaw[] | null;
}

/** GET /get/CME (startDate & endDate REQUIRED, max 60-day window). */
export interface DonkiCmeRaw {
  activityID: string;
  catalog: string;
  startTime: string;
  instruments: DonkiInstrumentRaw[];
  sourceLocation: string;
  activeRegionNum: number | null;
  note: string;
  cmeAnalyses: DonkiCmeAnalysisRaw[] | null;
  linkedEvents: DonkiLinkedEventRaw[] | null;
  sentNotifications: DonkiSentNotificationRaw[] | null;
  link: string;
  submissionTime: string;
  versionId: number;
}

/** GET /get/SEP — an empty array is a normal "no events in window" answer. */
export interface DonkiSepRaw {
  sepID: string;
  eventTime: string;
  /** e.g. "GOES-P: SEISS >10 MeV", "SOHO: COSTEP 15.8-39.8 MeV". Near-Earth / STEREO A, not Mars. */
  instruments: DonkiInstrumentRaw[];
  link: string;
  linkedEvents: DonkiLinkedEventRaw[] | null;
  sentNotifications: DonkiSentNotificationRaw[] | null;
  submissionTime: string;
  versionId: number;
}

export interface DonkiKpIndexRaw {
  observedTime: string;
  kpIndex: number;
  source: string;
}

/** GET /get/GST — Kp values come from NOAA (Earth-only index). */
export interface DonkiGstRaw {
  gstID: string;
  startTime: string;
  allKpIndex: DonkiKpIndexRaw[];
  link: string;
  linkedEvents: DonkiLinkedEventRaw[] | null;
  sentNotifications: DonkiSentNotificationRaw[] | null;
  submissionTime: string;
  versionId: number;
}

/** GET /get/RBE and /get/HSS share this shape (id field differs). */
export interface DonkiRbeRaw {
  rbeID: string;
  eventTime: string;
  instruments: DonkiInstrumentRaw[];
  link: string;
  linkedEvents: DonkiLinkedEventRaw[] | null;
  sentNotifications: DonkiSentNotificationRaw[] | null;
  submissionTime: string;
  versionId: number;
}

export interface DonkiHssRaw {
  hssID: string;
  eventTime: string;
  instruments: DonkiInstrumentRaw[];
  link: string;
  linkedEvents: DonkiLinkedEventRaw[] | null;
  sentNotifications: DonkiSentNotificationRaw[] | null;
  submissionTime: string;
  versionId: number;
}

/** GET /get/notifications — default window is the last 7 days. */
export interface DonkiNotificationRaw {
  messageType: string;
  messageID: string;
  messageURL: string;
  messageIssueTime: string;
  /** Markdown-ish plain text. Always contains the NOAA SWPC disclaimer. */
  messageBody: string;
}

// ---------------------------------------------------------------------------
// DONKI — normalized educational shapes
// ---------------------------------------------------------------------------

export type FlareClassLetter = 'A' | 'B' | 'C' | 'M' | 'X';

export interface SolarFlareEvent {
  id: string;
  classType: string;
  classLetter: FlareClassLetter | null;
  /** Numeric part of the class, e.g. 5.8 for "X5.8". */
  classMagnitude: number | null;
  /** Peak X-ray flux in W/m² implied by the class (A=1e-8 … X=1e-4). */
  peakFluxWm2: number | null;
  beginTime: string;
  peakTime: string;
  endTime: string | null;
  sourceLocation: string | null;
  activeRegion: number | null;
  instruments: string[];
  linkedEventIds: string[];
  link: string;
  catalog: string;
}

export interface PredictedImpact {
  location: string;
  arrivalTime: string;
  isGlancingBlow: boolean;
  isMinorImpact: boolean;
  /** ENLIL model completion time — reminds UIs this is a model run. */
  modelCompletionTime: string;
}

export interface CmeEvent {
  id: string;
  startTime: string;
  /** km/s of the CME body: most-accurate leading-edge ("LE") analysis when present, else the fastest. */
  speedKmS: number | null;
  /** km/s of a most-accurate shock-front ("SH") analysis, when DONKI recorded one. */
  shockSpeedKmS: number | null;
  /** Feature measured by the analysis behind `speedKmS` (e.g. "LE", "SH"). */
  featureCode: string | null;
  halfAngleDeg: number | null;
  /** Heliocentric Earth Equatorial longitude; |lon| > 90 means launched away from Earth. */
  longitudeDeg: number | null;
  latitudeDeg: number | null;
  analysisType: string | null;
  sourceLocation: string | null;
  activeRegion: number | null;
  instruments: string[];
  note: string;
  /** All ENLIL-predicted arrivals (deduplicated by location+time). Model output, not observation. */
  predictedImpacts: PredictedImpact[];
  linkedEventIds: string[];
  link: string;
}

export interface SepEvent {
  id: string;
  eventTime: string;
  instruments: string[];
  /**
   * True when every listed instrument is a model ("MODEL: REleASE:…"), i.e. a HESPERIA
   * RELeASE forecast rather than an observation. CCMC requires a specific inline HESPERIA
   * acknowledgement wherever RELeASE output is presented, so UIs should exclude these
   * (the context builder does) unless that acknowledgement is shown.
   */
  isModelForecast: boolean;
  linkedEventIds: string[];
  link: string;
}

export type SolarActivityTier = 'quiet' | 'active' | 'storm';

/** Compact summary used by Bonus Mission 05 framing text. Never mapped to resource bars. */
export interface SolarStormContext {
  mode: DataMode;
  windowStart: string;
  windowEnd: string;
  tier: SolarActivityTier;
  /** Plain-language reasons for the tier, one per triggering rule. */
  tierReasons: string[];
  flareCount: number;
  strongestFlare: SolarFlareEvent | null;
  fastestCme: CmeEvent | null;
  sepCount: number;
  /** ENLIL predictions that list "Mars" as a location. */
  marsPredictions: { cmeId: string; impact: PredictedImpact }[];
  provenance: DataProvenance[];
}

// ---------------------------------------------------------------------------
// OSDR Environmental Data App (EDA)
// ---------------------------------------------------------------------------

/** GET https://visualization.osdr.nasa.gov/eda/api/ */
export interface EdaApiIndexRaw {
  missions: string;
}

/** GET /eda/api/missions/ (array) and /eda/api/missions/{name}/ (object). Metadata only — no telemetry. */
export interface EdaMissionRaw {
  name: string;
  title: string;
  description: string;
  link: string;
}

export type EdaMissionCategory = 'plant-mission-window' | 'rodent-research-window';

/**
 * Curated per-mission summary of ISS cabin environment telemetry captured from the
 * EDA dashboards. These are ISS measurements recorded during the named mission's
 * dates — NOT biological results from that mission.
 */
export interface EdaMissionEnvironmentSummary {
  name: string;
  title: string;
  category: EdaMissionCategory;
  link: string;
  telemetryStart: string | null;
  telemetryEnd: string | null;
  temperatureIssMedianC: number | null;
  relativeHumidityIssMedianPct: number | null;
  co2IssMedianPpm: number | null;
  co2IssMinPpm: number | null;
  co2IssMaxPpm: number | null;
  radiationStart: string | null;
  radiationEnd: string | null;
  radiationDays: number | null;
  totalDoseMedianMGyPerDay: number | null;
  accumulatedDoseFinalMGy: number | null;
  /** Data-quality notes found while summarizing. */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// OSDR Biological Data API v2 + RadLab
// ---------------------------------------------------------------------------

/** GET /biodata/api/v2/dataset/{accession}/ → { [accession]: BiodataDatasetRaw } */
export interface BiodataDatasetRaw {
  REST_URL: string;
  assays?: Record<string, unknown>;
  files?: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

/** Error body observed for 400/404/422 responses. */
export interface BiodataErrorRaw {
  code: number;
  HTTPError: string;
  exception: string;
  message?: string;
  'OpenAPI specification'?: string;
}

export interface OsdrStudySummary {
  accession: string;
  title: string;
  organism: string | null;
  projectIdentifier: string | null;
  platform: string | null;
  flightProgram: string | null;
  missions: string[];
  managingCenter: string | null;
  studyFactors: string[];
  description: string;
  repositoryUrl: string;
  apiUrl: string;
  /** Why/how the game may use this study. */
  educationalUse: string;
  /** Hard limits on how the study may be presented. */
  caveats: string[];
}

/** RadLab `format=json` responses use pandas "split" orientation. */
export interface RadLabSplitRaw {
  columns: string[];
  index: number[];
  data: unknown[][];
}

export interface RadLabPoint {
  timestamp: string;
  spacecraft: string | null;
  instrument: string | null;
  instrumentId: string | null;
  celestialBody: string | null;
  trajectory: string | null;
  /** µGy/hour */
  absorbedDoseRateUGyPerHour: number | null;
  /** µSv/hour */
  doseEquivalentRateUSvPerHour: number | null;
}

export interface HourlyDosePoint {
  /** Start of the UTC hour, "YYYY-MM-DDTHH:00Z". */
  hour: string;
  meanUGyPerHour: number;
  samples: number;
}
