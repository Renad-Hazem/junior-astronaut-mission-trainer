/**
 * OSDR Environmental Data App (EDA) client.
 *
 * ⚠ Browser CORS: the EDA API sends NO Access-Control-Allow-Origin header (verified 2026-11-14),
 * so calling the default base URL from the game's origin fails with `network-or-cors`.
 * Use it from Node/serverless code, or pass `baseUrl` pointing at a same-origin proxy
 * (e.g. `/api/nasa/eda`) that forwards to https://visualization.osdr.nasa.gov/eda/api.
 *
 * The documented JSON API exposes mission METADATA only. Telemetry/radiation series exist
 * only inside undocumented HTML dashboards, so the game uses the curated snapshot in
 * src/data/nasa/edaIssEnvironment.ts instead of scraping at runtime.
 */
import { fetchJson, invalidPayload, invalidRequest, liveProvenance } from './http.ts';
import { isEdaMissionRaw, validateArray } from './normalizers.ts';
import { provenanceBase } from './sourceRegistry.ts';
import type { ClientOptions, EdaMissionRaw, NasaResult } from './types.ts';

export const EDA_API_BASE_URL = 'https://visualization.osdr.nasa.gov/eda/api';
export const EDA_BROWSER_CORS_SUPPORTED = false;

const MISSION_NAME = /^[A-Z]{2,6}-[0-9A-Z]+(?:-[0-9A-Z]+)?$/;

function base(opts: ClientOptions): string {
  return (opts.baseUrl ?? EDA_API_BASE_URL).replace(/\/+$/, '');
}

/** GET /missions/ — 24 missions on 2026-11-14 (18 Rodent Research, 3 APEX, 3 VEG). Trailing slash required (else 301). */
export async function getEdaMissions(opts: ClientOptions = {}): Promise<NasaResult<EdaMissionRaw[]>> {
  const url = `${base(opts)}/missions/`;
  const res = await fetchJson(url, opts);
  if (!res.ok) return res;
  const v = validateArray(res.body, isEdaMissionRaw, 'EDA missions');
  if (!v.ok) return invalidPayload(v.message, url);
  return { ok: true, data: v.items, provenance: liveProvenance(provenanceBase('eda'), url, res.retrievedAt) };
}

/** GET /missions/{name}/ — unknown names return HTTP 404 {"detail":"No Mission matches the given query."}. */
export async function getEdaMission(name: string, opts: ClientOptions = {}): Promise<NasaResult<EdaMissionRaw>> {
  if (!MISSION_NAME.test(name)) return invalidRequest(`Invalid EDA mission name "${name}" (expected e.g. RR-9, VEG-01A, APEX-04)`);
  const url = `${base(opts)}/missions/${encodeURIComponent(name)}/`;
  const res = await fetchJson(url, opts);
  if (!res.ok) return res;
  if (!isEdaMissionRaw(res.body)) return invalidPayload('EDA mission: unexpected shape', url);
  return { ok: true, data: res.body, provenance: liveProvenance(provenanceBase('eda'), url, res.retrievedAt) };
}
