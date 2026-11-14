import type { ClientOptions, DataProvenance, NasaError, NasaErrorKind, NasaResult } from './types.ts';

export const DEFAULT_TIMEOUT_MS = 12_000;

export type RawFetchResult =
  | { ok: true; body: unknown; url: string; retrievedAt: string }
  | { ok: false; error: NasaError };

function fail(kind: NasaErrorKind, message: string, url: string, extra: Partial<NasaError> = {}): RawFetchResult {
  return { ok: false, error: { kind, message, url, ...extra } };
}

function describe(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  // Node/undici puts the real reason (ETIMEDOUT, ECONNRESET, UNABLE_TO_GET_ISSUER_CERT_LOCALLY…) in `cause`.
  const cause = (e as Error & { cause?: unknown }).cause;
  const detail =
    cause && typeof cause === 'object'
      ? [(cause as { code?: unknown }).code, (cause as { message?: unknown }).message].filter((x) => typeof x === 'string').join(' ')
      : '';
  return `${e.name}: ${e.message}${detail ? ` (cause: ${detail})` : ''}`;
}

/**
 * GET a JSON resource with a hard timeout and error classification.
 *
 * - Sends only CORS-safelisted headers (no preflight needed).
 * - Never throws: every failure is returned as a typed `NasaError`.
 * - In browsers, a CORS rejection and an offline/DNS/TLS failure both surface as a
 *   rejected fetch() with no response, so both map to `network-or-cors`.
 */
export async function fetchJson(url: string, opts: ClientOptions = {}): Promise<RawFetchResult> {
  const fetchImpl = opts.fetchImpl ?? (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined);
  if (!fetchImpl) return fail('network-or-cors', 'fetch() is not available in this environment', url);

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const classifyRejection = (e: unknown): RawFetchResult => {
    if (timedOut) return fail('timeout', `Request timed out after ${timeoutMs} ms`, url);
    if (opts.signal?.aborted) return fail('aborted', 'Request was aborted by the caller', url);
    return fail(
      'network-or-cors',
      `Request failed before any HTTP response (offline, DNS/TLS error, or blocked by CORS): ${describe(e)}`,
      url,
    );
  };

  try {
    let res: Response;
    try {
      res = await fetchImpl(url, { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal });
    } catch (e) {
      return classifyRejection(e);
    }

    let text: string;
    try {
      text = await res.text();
    } catch (e) {
      return classifyRejection(e);
    }

    if (!res.ok) {
      return fail('http', `HTTP ${res.status} from ${url}`, url, { status: res.status, bodySnippet: text.slice(0, 300) });
    }

    try {
      return { ok: true, body: JSON.parse(text) as unknown, url, retrievedAt: (opts.now?.() ?? new Date()).toISOString() };
    } catch {
      return fail('invalid-payload', 'Response body was not valid JSON', url, { status: res.status, bodySnippet: text.slice(0, 300) });
    }
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onExternalAbort);
  }
}

/** Build a query string, skipping undefined values. Values are URL-encoded. */
export function buildUrl(base: string, path: string, params: Record<string, string | number | boolean | undefined> = {}): string {
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${trimmedBase}/${trimmedPath}${query ? `?${query}` : ''}`;
}

export function invalidRequest<T>(message: string, url?: string): NasaResult<T> {
  return { ok: false, error: { kind: 'invalid-request', message, url } };
}

export function invalidPayload<T>(message: string, url: string): NasaResult<T> {
  return { ok: false, error: { kind: 'invalid-payload', message, url } };
}

export function liveProvenance(
  base: Omit<DataProvenance, 'mode' | 'retrievedAt' | 'sourceUrl'>,
  sourceUrl: string,
  retrievedAt: string,
): DataProvenance {
  return { ...base, mode: 'live', sourceUrl, retrievedAt };
}
