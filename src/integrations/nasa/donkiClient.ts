/**
 * CCMC DONKI-API v2.0 client (browser-safe: the API sends Access-Control-Allow-Origin: *).
 * No API key. Docs: https://ccmc.gsfc.nasa.gov/DONKI/api/ (OpenAPI at /DONKI/api/openapi/).
 */
import { buildUrl, fetchJson, invalidPayload, invalidRequest, liveProvenance } from './http.ts';
import {
  donkiDaySpan,
  isDonkiCmeRaw,
  isDonkiFlareRaw,
  isDonkiSepRaw,
  isRecord,
  isValidIsoDate,
  normalizeCme,
  normalizeFlare,
  normalizeSep,
  validateArray,
} from './normalizers.ts';
import { provenanceBase } from './sourceRegistry.ts';
import type {
  ClientOptions,
  CmeEvent,
  DonkiNotificationRaw,
  NasaResult,
  SepEvent,
  SolarFlareEvent,
} from './types.ts';

export const DONKI_BASE_URL = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get';
export const DONKI_MAX_WINDOW_DAYS = 60;

export interface DonkiWindow {
  /** yyyy-MM-dd (UTC) */
  startDate: string;
  /** yyyy-MM-dd (UTC) */
  endDate: string;
}

export interface DonkiList<T> {
  items: T[];
  /** Records dropped because they failed shape validation (should normally be 0). */
  skipped: number;
  window: Partial<DonkiWindow>;
}

/** Returns an error message, or null when the window is acceptable to DONKI. */
export function validateDonkiWindow(window: Partial<DonkiWindow> | undefined, required: boolean): string | null {
  const { startDate, endDate } = window ?? {};
  if (!startDate && !endDate) return required ? 'startDate and endDate are required for this endpoint' : null;
  if (!startDate || !endDate) return 'Provide both startDate and endDate (or neither for the server default)';
  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
    return 'Dates must be real calendar dates formatted yyyy-MM-dd (DONKI silently ignores malformed dates)';
  }
  const span = donkiDaySpan(startDate, endDate);
  if (span < 0) return 'startDate cannot be after endDate';
  if (span > DONKI_MAX_WINDOW_DAYS) return `Date range cannot exceed ${DONKI_MAX_WINDOW_DAYS} days (requested ${span})`;
  return null;
}

/** Last `days` days ending today (UTC), as a DONKI window. */
export function recentDonkiWindow(days: number, now: Date = new Date()): DonkiWindow {
  const clamped = Math.max(0, Math.min(DONKI_MAX_WINDOW_DAYS, Math.floor(days)));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - clamped * 86_400_000);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

async function getList<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  window: Partial<DonkiWindow> | undefined,
  normalize: (body: unknown) => { ok: true; items: T[]; skipped: number } | { ok: false; message: string },
  opts: ClientOptions,
): Promise<NasaResult<DonkiList<T>>> {
  const url = buildUrl(opts.baseUrl ?? DONKI_BASE_URL, path, { ...params, startDate: window?.startDate, endDate: window?.endDate });
  const res = await fetchJson(url, opts);
  if (!res.ok) return res;
  const parsed = normalize(res.body);
  if (!parsed.ok) return invalidPayload(parsed.message, url);
  return {
    ok: true,
    data: { items: parsed.items, skipped: parsed.skipped, window: { ...window } },
    provenance: liveProvenance(provenanceBase('donki'), url, res.retrievedAt),
  };
}

/** GET /FLR — solar flares (M2M_CATALOG by default). Without a window the server returns the last 30 days. */
export async function getSolarFlares(
  window?: DonkiWindow,
  filters: { flareClass?: 'ALL' | 'M' | 'X'; catalog?: string } = {},
  opts: ClientOptions = {},
): Promise<NasaResult<DonkiList<SolarFlareEvent>>> {
  const err = validateDonkiWindow(window, false);
  if (err) return invalidRequest(err);
  return getList('FLR', { class: filters.flareClass, catalog: filters.catalog }, window, (body) => {
    const v = validateArray(body, isDonkiFlareRaw, 'FLR');
    return v.ok ? { ok: true, items: v.items.map(normalizeFlare), skipped: v.skipped } : v;
  }, opts);
}

/** GET /CME — coronal mass ejections. startDate and endDate are REQUIRED by the server. */
export async function getCmes(
  window: DonkiWindow,
  filters: { mostAccurateOnly?: boolean; minSpeedKmS?: number } = {},
  opts: ClientOptions = {},
): Promise<NasaResult<DonkiList<CmeEvent>>> {
  const err = validateDonkiWindow(window, true);
  if (err) return invalidRequest(err);
  return getList('CME', { mostAccurateOnly: filters.mostAccurateOnly, speed: filters.minSpeedKmS }, window, (body) => {
    const v = validateArray(body, isDonkiCmeRaw, 'CME');
    return v.ok ? { ok: true, items: v.items.map(normalizeCme), skipped: v.skipped } : v;
  }, opts);
}

/** GET /SEP — solar energetic particle events. An empty list is a normal, valid answer. */
export async function getSeps(window?: DonkiWindow, opts: ClientOptions = {}): Promise<NasaResult<DonkiList<SepEvent>>> {
  const err = validateDonkiWindow(window, false);
  if (err) return invalidRequest(err);
  return getList('SEP', {}, window, (body) => {
    const v = validateArray(body, isDonkiSepRaw, 'SEP');
    return v.ok ? { ok: true, items: v.items.map(normalizeSep), skipped: v.skipped } : v;
  }, opts);
}

function isNotification(v: unknown): v is DonkiNotificationRaw {
  return isRecord(v) && typeof v.messageID === 'string' && typeof v.messageType === 'string' && typeof v.messageBody === 'string';
}

/** GET /notifications — forecaster messages (default window: last 7 days). Bodies always carry the NOAA SWPC disclaimer. */
export async function getNotifications(
  window?: DonkiWindow,
  filters: { type?: 'ALL' | 'FLR' | 'SEP' | 'CME' | 'IPS' | 'MPC' | 'GST' | 'RBE' | 'REPORT' } = {},
  opts: ClientOptions = {},
): Promise<NasaResult<DonkiList<DonkiNotificationRaw>>> {
  const err = validateDonkiWindow(window, false);
  if (err) return invalidRequest(err);
  return getList('notifications', { type: filters.type }, window, (body) => {
    const v = validateArray(body, isNotification, 'notifications');
    return v.ok ? { ok: true, items: v.items, skipped: v.skipped } : v;
  }, opts);
}
