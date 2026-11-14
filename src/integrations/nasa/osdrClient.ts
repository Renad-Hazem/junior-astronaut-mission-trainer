/**
 * OSDR Biological Data API v2 + RadLab dosimetry API clients.
 *
 * ⚠ Browser CORS: neither API sends Access-Control-Allow-Origin (verified 2026-11-14).
 * Call from Node/serverless code or pass `baseUrl` for a same-origin proxy. The game ships
 * curated snapshots (src/data/nasa/) so it never depends on these calls succeeding.
 */
import { fetchJson, invalidPayload, invalidRequest, liveProvenance } from './http.ts';
import { isBiodataDatasetEnvelope, isRadLabSplitRaw, isRecord, normalizeRadLabSplit } from './normalizers.ts';
import { provenanceBase } from './sourceRegistry.ts';
import type { BiodataDatasetRaw, ClientOptions, NasaResult, RadLabPoint } from './types.ts';

export const BIODATA_API_BASE_URL = 'https://visualization.osdr.nasa.gov/biodata/api/v2';
export const RADLAB_API_BASE_URL = 'https://visualization.osdr.nasa.gov/radlab/api/';
export const OSDR_BROWSER_CORS_SUPPORTED = false;

const ACCESSION = /^OSD-\d{1,5}$/;
const RADLAB_TIME = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?$/;

/** GET /v2/dataset/{accession}/ — unknown accessions return HTTP 422 (not 404). */
export async function getBiodataDataset(accession: string, opts: ClientOptions = {}): Promise<NasaResult<BiodataDatasetRaw>> {
  if (!ACCESSION.test(accession)) return invalidRequest(`Invalid OSDR accession "${accession}" (expected e.g. OSD-655)`);
  const url = `${(opts.baseUrl ?? BIODATA_API_BASE_URL).replace(/\/+$/, '')}/dataset/${accession}/`;
  const res = await fetchJson(url, opts);
  if (!res.ok) return res;
  if (!isBiodataDatasetEnvelope(res.body, accession)) return invalidPayload(`Biodata: response is not keyed by ${accession}`, url);
  return { ok: true, data: res.body[accession], provenance: liveProvenance(provenanceBase('osdr-biodata'), url, res.retrievedAt) };
}

/**
 * GET /v2/query/datasets/?<field>=<value>&format=json.records
 * Filters use canonical metadata paths, e.g. { 'study.characteristics.organism': 'Arabidopsis thaliana' }.
 * A `null` value adds the field as an output column without filtering.
 */
export async function queryBiodataDatasets(
  filters: Record<string, string | null>,
  opts: ClientOptions = {},
): Promise<NasaResult<Record<string, unknown>[]>> {
  const parts = Object.entries(filters).map(([k, v]) =>
    v === null ? encodeURIComponent(k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
  );
  parts.push('format=json.records');
  const url = `${(opts.baseUrl ?? BIODATA_API_BASE_URL).replace(/\/+$/, '')}/query/datasets/?${parts.join('&')}`;
  const res = await fetchJson(url, opts);
  if (!res.ok) return res;
  if (!Array.isArray(res.body) || !res.body.every(isRecord)) return invalidPayload('Biodata query: expected an array of row objects', url);
  return { ok: true, data: res.body as Record<string, unknown>[], provenance: liveProvenance(provenanceBase('osdr-biodata'), url, res.retrievedAt) };
}

export interface RadLabQuery {
  celestialBody?: string;
  spacecraft?: string;
  instrument?: string;
  /** Inclusive lower bound, ISO date or date-time (UTC). */
  start: string;
  /** Exclusive upper bound, ISO date or date-time (UTC). */
  end: string;
}

/** Build the exact URL form verified live: bare field selectors + `timestamp%3E=` and `timestamp%3C` bounds. */
export function buildRadLabUrl(q: RadLabQuery, baseUrl: string = RADLAB_API_BASE_URL): string {
  const enc = encodeURIComponent;
  const parts: string[] = [];
  if (q.celestialBody) parts.push(`celestial_body=${enc(q.celestialBody)}`);
  parts.push(q.spacecraft ? `spacecraft=${enc(q.spacecraft)}` : 'spacecraft');
  parts.push(q.instrument ? `instrument=${enc(q.instrument)}` : 'instrument');
  parts.push('instrument_id', 'trajectory');
  parts.push(`timestamp%3E=${enc(q.start)}`, `timestamp%3C${enc(q.end)}`);
  parts.push('absorbed_dose_rate', 'dose_equivalent_rate', 'format=json');
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}${parts.join('&')}`;
}

/** RadLab dose-rate series (absorbed_dose_rate µGy/h, dose_equivalent_rate µSv/h). */
export async function getRadLabSeries(q: RadLabQuery, opts: ClientOptions = {}): Promise<NasaResult<RadLabPoint[]>> {
  if (!RADLAB_TIME.test(q.start) || !RADLAB_TIME.test(q.end)) return invalidRequest('RadLab start/end must be ISO dates (YYYY-MM-DD[THH:MM[:SS]])');
  if (q.start >= q.end) return invalidRequest('RadLab start must be before end');
  const url = buildRadLabUrl(q, opts.baseUrl ?? RADLAB_API_BASE_URL);
  const res = await fetchJson(url, opts);
  if (!res.ok) return res;
  if (!isRadLabSplitRaw(res.body)) return invalidPayload('RadLab: expected {columns,index,data} JSON (format=json)', url);
  return { ok: true, data: normalizeRadLabSplit(res.body), provenance: liveProvenance(provenanceBase('radlab'), url, res.retrievedAt) };
}
