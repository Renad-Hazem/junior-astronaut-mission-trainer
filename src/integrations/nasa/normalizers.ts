/**
 * Pure, side-effect-free validation + normalization for NASA payloads.
 * Every function tolerates the nulls actually observed in live responses (2026-11-14).
 */
import type {
  BiodataDatasetRaw,
  CmeEvent,
  DonkiCmeAnalysisRaw,
  DonkiCmeRaw,
  DonkiFlareRaw,
  DonkiLinkedEventRaw,
  DonkiSepRaw,
  EdaMissionRaw,
  FlareClassLetter,
  HourlyDosePoint,
  OsdrStudySummary,
  PredictedImpact,
  RadLabPoint,
  RadLabSplitRaw,
  SepEvent,
  SolarActivityTier,
  SolarFlareEvent,
} from './types.ts';

// ---------------------------------------------------------------------------
// Primitive guards
// ---------------------------------------------------------------------------

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const numberOrNull = (v: unknown): number | null => (isFiniteNumber(v) ? v : null);
const nonEmptyOrNull = (v: unknown): string | null => (isString(v) && v.trim() !== '' ? v : null);

function instrumentNames(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isRecord).map((i) => i.displayName).filter(isString);
}

function linkedIds(v: DonkiLinkedEventRaw[] | null | undefined): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((l) => l?.activityID).filter(isString);
}

/**
 * Parse NASA timestamps to epoch ms. DONKI uses minute precision with "Z"
 * ("2026-10-16T15:38Z"); RadLab/EDA omit the zone ("2024-05-20T06:15:19",
 * "2018-08-14 04:53:00") and are treated as UTC.
 */
export function parseUtc(value: string | null | undefined): number | null {
  if (!value) return null;
  let s = value.trim().replace(' ', 'T');
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}

/** DONKI accepts yyyy-MM-dd only. Invalid dates are SILENTLY IGNORED by the server (observed), so validate here. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Day span as DONKI counts it: endDate − startDate in whole days.
 * Verified live 2026-11-14: 2026-09-15..2026-11-14 (60) → 200; 2026-09-14..2026-11-14 (61) →
 * 400 "Date range cannot exceed 60 days. You requested 61 days."; a same-day window (0) → 200.
 */
export function donkiDaySpan(startDate: string, endDate: string): number {
  const a = Date.parse(`${startDate}T00:00:00Z`);
  const b = Date.parse(`${endDate}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Solar flares
// ---------------------------------------------------------------------------

const FLARE_BASE_FLUX: Record<FlareClassLetter, number> = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 };

/** GOES X-ray class → letter, magnitude, peak flux (W/m²). Each letter is 10× the previous one. */
export function parseFlareClass(classType: string | null | undefined): {
  letter: FlareClassLetter | null;
  magnitude: number | null;
  peakFluxWm2: number | null;
} {
  const m = /^\s*([ABCMX])\s*(\d+(?:\.\d+)?)\s*$/i.exec(classType ?? '');
  if (!m) return { letter: null, magnitude: null, peakFluxWm2: null };
  const letter = m[1].toUpperCase() as FlareClassLetter;
  const magnitude = Number(m[2]);
  return { letter, magnitude, peakFluxWm2: FLARE_BASE_FLUX[letter] * magnitude };
}

export function isDonkiFlareRaw(v: unknown): v is DonkiFlareRaw {
  return isRecord(v) && isString(v.flrID) && isString(v.classType) && isString(v.peakTime) && isString(v.beginTime);
}

export function normalizeFlare(raw: DonkiFlareRaw): SolarFlareEvent {
  const cls = parseFlareClass(raw.classType);
  return {
    id: raw.flrID,
    classType: raw.classType,
    classLetter: cls.letter,
    classMagnitude: cls.magnitude,
    peakFluxWm2: cls.peakFluxWm2,
    beginTime: raw.beginTime,
    peakTime: raw.peakTime,
    endTime: raw.endTime ?? null,
    sourceLocation: nonEmptyOrNull(raw.sourceLocation),
    activeRegion: numberOrNull(raw.activeRegionNum),
    instruments: instrumentNames(raw.instruments),
    linkedEventIds: linkedIds(raw.linkedEvents),
    link: isString(raw.link) ? raw.link : '',
    catalog: isString(raw.catalog) ? raw.catalog : '',
  };
}

// ---------------------------------------------------------------------------
// CMEs
// ---------------------------------------------------------------------------

export function isDonkiCmeRaw(v: unknown): v is DonkiCmeRaw {
  return isRecord(v) && isString(v.activityID) && isString(v.startTime);
}

function fastest(pool: DonkiCmeAnalysisRaw[]): DonkiCmeAnalysisRaw | null {
  return pool.reduce<DonkiCmeAnalysisRaw | null>((best, a) => {
    if (!best) return a;
    return (numberOrNull(a.speed) ?? -1) > (numberOrNull(best.speed) ?? -1) ? a : best;
  }, null);
}

function mostAccuratePool(analyses: DonkiCmeAnalysisRaw[] | null | undefined): DonkiCmeAnalysisRaw[] {
  if (!Array.isArray(analyses)) return [];
  const valid = analyses.filter(isRecord) as DonkiCmeAnalysisRaw[];
  return valid.some((a) => a.isMostAccurate) ? valid.filter((a) => a.isMostAccurate) : valid;
}

/**
 * Pick the analysis that describes the CME itself. There can be several "most accurate"
 * analyses for different features — e.g. 2024-05-20T05:36:00-CME-001 has a shock front
 * (featureCode "SH", 2678 km/s) and a leading edge/bulk ("LE", 1927 km/s). DONKI's own alert
 * quoted the LE speed, so prefer LE; otherwise take the fastest.
 */
export function pickPrimaryAnalysis(analyses: DonkiCmeAnalysisRaw[] | null | undefined): DonkiCmeAnalysisRaw | null {
  const pool = mostAccuratePool(analyses);
  if (pool.length === 0) return null;
  return fastest(pool.filter((a) => a.featureCode === 'LE')) ?? fastest(pool);
}

/** Speed of a most-accurate shock-front ("SH") analysis, if DONKI recorded one. */
export function shockSpeed(analyses: DonkiCmeAnalysisRaw[] | null | undefined): number | null {
  return numberOrNull(fastest(mostAccuratePool(analyses).filter((a) => a.featureCode === 'SH'))?.speed);
}

/** Collect ENLIL-predicted impacts from the most-accurate analyses, de-duplicated by location+arrival time. */
export function extractPredictedImpacts(analyses: DonkiCmeAnalysisRaw[] | null | undefined): PredictedImpact[] {
  if (!Array.isArray(analyses)) return [];
  const pool = analyses.some((a) => a?.isMostAccurate) ? analyses.filter((a) => a?.isMostAccurate) : analyses;
  const seen = new Set<string>();
  const out: PredictedImpact[] = [];
  for (const a of pool) {
    for (const run of a?.enlilList ?? []) {
      for (const imp of run?.impactList ?? []) {
        if (!isRecord(imp) || !isString(imp.location) || !isString(imp.arrivalTime)) continue;
        const key = `${imp.location}|${imp.arrivalTime}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          location: imp.location,
          arrivalTime: imp.arrivalTime,
          isGlancingBlow: imp.isGlancingBlow === true,
          isMinorImpact: imp.isMinorImpact === true,
          modelCompletionTime: isString(run.modelCompletionTime) ? run.modelCompletionTime : '',
        });
      }
    }
  }
  return out.sort((x, y) => (parseUtc(x.arrivalTime) ?? 0) - (parseUtc(y.arrivalTime) ?? 0));
}

export function normalizeCme(raw: DonkiCmeRaw): CmeEvent {
  const a = pickPrimaryAnalysis(raw.cmeAnalyses);
  return {
    id: raw.activityID,
    startTime: raw.startTime,
    speedKmS: numberOrNull(a?.speed),
    shockSpeedKmS: shockSpeed(raw.cmeAnalyses),
    featureCode: a && isString(a.featureCode) ? a.featureCode : null,
    halfAngleDeg: numberOrNull(a?.halfAngle),
    longitudeDeg: numberOrNull(a?.longitude),
    latitudeDeg: numberOrNull(a?.latitude),
    analysisType: a && isString(a.type) ? a.type : null,
    sourceLocation: nonEmptyOrNull(raw.sourceLocation),
    activeRegion: numberOrNull(raw.activeRegionNum),
    instruments: instrumentNames(raw.instruments),
    note: isString(raw.note) ? raw.note : '',
    predictedImpacts: extractPredictedImpacts(raw.cmeAnalyses),
    linkedEventIds: linkedIds(raw.linkedEvents),
    link: isString(raw.link) ? raw.link : '',
  };
}

/** SCORE CME typification, quoted in DONKI notifications (S <500, C 500–999, O 1000–1999, R 2000–2999, ER ≥3000 km/s). */
export function scoreCmeType(speedKmS: number | null): 'S' | 'C' | 'O' | 'R' | 'ER' | null {
  if (speedKmS === null || !Number.isFinite(speedKmS)) return null;
  if (speedKmS < 500) return 'S';
  if (speedKmS < 1000) return 'C';
  if (speedKmS < 2000) return 'O';
  if (speedKmS < 3000) return 'R';
  return 'ER';
}

/** |longitude| > 90° in HEEQ coordinates means the CME left the side of the Sun facing away from Earth. */
export function isFarSideFromEarth(cme: Pick<CmeEvent, 'longitudeDeg'>): boolean | null {
  return cme.longitudeDeg === null ? null : Math.abs(cme.longitudeDeg) > 90;
}

// ---------------------------------------------------------------------------
// SEPs
// ---------------------------------------------------------------------------

export function isDonkiSepRaw(v: unknown): v is DonkiSepRaw {
  return isRecord(v) && isString(v.sepID) && isString(v.eventTime);
}

export function normalizeSep(raw: DonkiSepRaw): SepEvent {
  const instruments = instrumentNames(raw.instruments);
  return {
    id: raw.sepID,
    eventTime: raw.eventTime,
    instruments,
    isModelForecast: instruments.length > 0 && instruments.every((i) => /^MODEL:/i.test(i)),
    linkedEventIds: linkedIds(raw.linkedEvents),
    link: isString(raw.link) ? raw.link : '',
  };
}

// ---------------------------------------------------------------------------
// Array validation helper
// ---------------------------------------------------------------------------

export type ArrayValidation<T> = { ok: true; items: T[]; skipped: number } | { ok: false; message: string };

/** Require an array; keep elements that pass the guard and count the rest (never silently fabricate). */
export function validateArray<T>(body: unknown, guard: (v: unknown) => v is T, label: string): ArrayValidation<T> {
  if (!Array.isArray(body)) return { ok: false, message: `${label}: expected a JSON array, got ${body === null ? 'null' : typeof body}` };
  const items = body.filter(guard);
  return { ok: true, items, skipped: body.length - items.length };
}

// ---------------------------------------------------------------------------
// Activity tier — GAME FRAMING ONLY (not a forecast, never mapped to resource bars)
// ---------------------------------------------------------------------------

export function classifySolarActivity(input: {
  flares: SolarFlareEvent[];
  cmes: CmeEvent[];
  seps: SepEvent[];
}): { tier: SolarActivityTier; reasons: string[] } {
  const reasons: string[] = [];
  const xFlares = input.flares.filter((f) => f.classLetter === 'X');
  const mFlares = input.flares.filter((f) => f.classLetter === 'M');
  const fastMarsCmes = input.cmes.filter(
    (c) => (c.speedKmS ?? 0) >= 1000 && c.predictedImpacts.some((p) => p.location === 'Mars'),
  );
  const commonCmes = input.cmes.filter((c) => (c.speedKmS ?? 0) >= 500);
  const anyMars = input.cmes.some((c) => c.predictedImpacts.some((p) => p.location === 'Mars'));
  // Model-only SEP entries (HESPERIA RELeASE forecasts) are predictions, not observations.
  const observedSeps = input.seps.filter((s) => !s.isModelForecast);

  if (observedSeps.length > 0) reasons.push(`${observedSeps.length} observed solar energetic particle (SEP) event(s) recorded`);
  if (xFlares.length > 0) reasons.push(`${xFlares.length} X-class flare(s) recorded`);
  if (fastMarsCmes.length > 0) reasons.push(`${fastMarsCmes.length} CME(s) of 1000+ km/s with a model run predicting arrival at Mars`);
  if (reasons.length > 0) return { tier: 'storm', reasons };

  if (mFlares.length > 0) reasons.push(`${mFlares.length} M-class flare(s) recorded`);
  if (commonCmes.length > 0) reasons.push(`${commonCmes.length} CME(s) of 500+ km/s`);
  if (anyMars) reasons.push('a model run predicts a CME reaching Mars');
  if (reasons.length > 0) return { tier: 'active', reasons };

  return { tier: 'quiet', reasons: ['no SEP events, no M/X flares and no CMEs of 500+ km/s in this window'] };
}

// ---------------------------------------------------------------------------
// RadLab
// ---------------------------------------------------------------------------

export function isRadLabSplitRaw(v: unknown): v is RadLabSplitRaw {
  return isRecord(v) && Array.isArray(v.columns) && v.columns.every(isString) && Array.isArray(v.data);
}

export function normalizeRadLabSplit(raw: RadLabSplitRaw): RadLabPoint[] {
  const col = (name: string) => raw.columns.indexOf(name);
  const idx = {
    t: col('timestamp'),
    sc: col('spacecraft'),
    inst: col('instrument'),
    instId: col('instrument_id'),
    body: col('celestial_body'),
    traj: col('trajectory'),
    adr: col('absorbed_dose_rate'),
    der: col('dose_equivalent_rate'),
  };
  const pick = (row: unknown[], i: number): unknown => (i >= 0 ? row[i] : undefined);
  const out: RadLabPoint[] = [];
  for (const row of raw.data) {
    if (!Array.isArray(row)) continue;
    const t = pick(row, idx.t);
    if (!isString(t) && !isFiniteNumber(t)) continue;
    out.push({
      timestamp: String(t),
      spacecraft: nonEmptyOrNull(pick(row, idx.sc)),
      instrument: nonEmptyOrNull(pick(row, idx.inst)),
      instrumentId: nonEmptyOrNull(pick(row, idx.instId)),
      celestialBody: nonEmptyOrNull(pick(row, idx.body)),
      trajectory: nonEmptyOrNull(pick(row, idx.traj)),
      absorbedDoseRateUGyPerHour: numberOrNull(pick(row, idx.adr)),
      doseEquivalentRateUSvPerHour: numberOrNull(pick(row, idx.der)),
    });
  }
  return out;
}

/** Mean absorbed dose rate per UTC hour (points without a dose rate are ignored). */
export function hourlyMeans(points: RadLabPoint[]): HourlyDosePoint[] {
  const buckets = new Map<string, { sum: number; n: number }>();
  for (const p of points) {
    const ms = parseUtc(p.timestamp);
    if (ms === null || p.absorbedDoseRateUGyPerHour === null) continue;
    const hour = `${new Date(ms).toISOString().slice(0, 13)}:00Z`;
    const b = buckets.get(hour) ?? { sum: 0, n: 0 };
    b.sum += p.absorbedDoseRateUGyPerHour;
    b.n += 1;
    buckets.set(hour, b);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([hour, b]) => ({ hour, meanUGyPerHour: Math.round((b.sum / b.n) * 100) / 100, samples: b.n }));
}

/** Trapezoidal integral of absorbed dose rate (µGy/h) over [startMs, endMs) → µGy. */
export function integrateDoseUGy(points: RadLabPoint[], startMs: number, endMs: number): number {
  const series = points
    .map((p) => ({ t: parseUtc(p.timestamp), v: p.absorbedDoseRateUGyPerHour }))
    .filter((p): p is { t: number; v: number } => p.t !== null && p.v !== null)
    .sort((a, b) => a.t - b.t);
  let total = 0;
  for (let i = 1; i < series.length; i += 1) {
    const a = series[i - 1];
    const b = series[i];
    const lo = Math.max(a.t, startMs);
    const hi = Math.min(b.t, endMs);
    if (hi <= lo) continue;
    total += ((hi - lo) / 3_600_000) * ((a.v + b.v) / 2);
  }
  return total;
}

// ---------------------------------------------------------------------------
// EDA
// ---------------------------------------------------------------------------

export function isEdaMissionRaw(v: unknown): v is EdaMissionRaw {
  return isRecord(v) && isString(v.name) && isString(v.title) && isString(v.link);
}

export function edaMissionCategory(name: string): 'plant-mission-window' | 'rodent-research-window' {
  return /^RR-/i.test(name) ? 'rodent-research-window' : 'plant-mission-window';
}

// ---------------------------------------------------------------------------
// OSDR Biodata
// ---------------------------------------------------------------------------

export function isBiodataDatasetEnvelope(v: unknown, accession: string): v is Record<string, BiodataDatasetRaw> {
  return isRecord(v) && isRecord(v[accession]) && isRecord((v[accession] as Record<string, unknown>).metadata);
}

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (isRecord(v)) Object.assign(out, flatten(v, `${prefix}${k}.`));
    else out[`${prefix}${k}`] = v;
  }
  return out;
}

const toList = (v: unknown): string[] => (Array.isArray(v) ? v.filter(isString) : isString(v) && v.trim() ? [v] : []);

/** Summarize the metadata keys observed on /v2/dataset/{accession}/ (e.g. OSD-655, OSD-773, OSD-476). */
export function summarizeBiodataDataset(
  accession: string,
  raw: BiodataDatasetRaw,
  editorial: Pick<OsdrStudySummary, 'educationalUse' | 'caveats'>,
): OsdrStudySummary {
  const f = flatten(raw.metadata);
  return {
    accession,
    title: isString(f['study title']) ? f['study title'] : accession,
    organism: nonEmptyOrNull(f.organism),
    projectIdentifier: nonEmptyOrNull(f['project identifier']),
    platform: nonEmptyOrNull(f['experiment platform']),
    flightProgram: nonEmptyOrNull(f['flight program']),
    missions: toList(f['mission.name']),
    managingCenter: nonEmptyOrNull(f['managing nasa center']),
    studyFactors: toList(f['study factor name']),
    description: isString(f['study description']) ? f['study description'] : '',
    repositoryUrl: `https://osdr.nasa.gov/bio/repo/data/studies/${accession}`,
    apiUrl: raw.REST_URL,
    ...editorial,
  };
}
