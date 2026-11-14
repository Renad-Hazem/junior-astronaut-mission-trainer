import { assert, assertEqual, FIXED_NOW, fakeFetch, hangingFetch, json, test, text } from './harness.ts';
import { getCmes, getSeps, getSolarFlares, recentDonkiWindow, validateDonkiWindow } from '../donkiClient.ts';
import { getEdaMission, getEdaMissions } from '../edaClient.ts';
import { buildRadLabUrl, getBiodataDataset, getRadLabSeries } from '../osdrClient.ts';
import { loadSolarStormWatchData } from '../solarStormContext.ts';
import {
  CME_RECENT_WITH_MARS_PREDICTION,
  DONKI_ERROR_BODIES,
  FLR_NO_LINKS,
  FLR_WITH_CME,
  SEP_EMPTY_WINDOW,
} from '../fixtures/donki.fixtures.ts';
import { EDA_MISSION_NOT_FOUND_BODY, EDA_MISSION_RR9, EDA_MISSIONS_SAMPLE } from '../fixtures/eda.fixtures.ts';
import { BIODATA_ERROR_UNKNOWN_ACCESSION, BIODATA_OSD655_ENVELOPE, RADLAB_MARS_ONSET_SAMPLE } from '../fixtures/osdr.fixtures.ts';
import { MARS_RAD_2024_SOURCE_URL } from '../../../data/nasa/generated/marsRad2024.generated.ts';

const WINDOW = { startDate: '2026-10-15', endDate: '2026-11-14' };

test('DONKI FLR: success → normalized items + live provenance with exact URL', async () => {
  const f = fakeFetch({ '/FLR': () => json([FLR_NO_LINKS, FLR_WITH_CME]) });
  const r = await getSolarFlares(WINDOW, {}, { fetchImpl: f, now: FIXED_NOW });
  assert(r.ok, 'ok');
  assertEqual(r.data.items.length, 2);
  assertEqual(r.provenance.mode, 'live');
  assertEqual(r.provenance.sourceId, 'donki');
  assertEqual(r.provenance.retrievedAt, '2026-11-14T12:00:00.000Z');
  assertEqual(f.calls[0], 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2026-10-15&endDate=2026-11-14');
});

test('DONKI SEP: empty array is a valid answer, not an error', async () => {
  const r = await getSeps(WINDOW, { fetchImpl: fakeFetch({ '/SEP': () => json(SEP_EMPTY_WINDOW) }) });
  assert(r.ok, 'ok');
  assertEqual(r.data.items.length, 0);
});

test('DONKI CME: missing dates rejected client-side with no network call', async () => {
  const f = fakeFetch({});
  const r = await getCmes({ startDate: '', endDate: '' }, {}, { fetchImpl: f });
  assert(!r.ok && r.error.kind === 'invalid-request', 'invalid-request');
  assertEqual(f.calls.length, 0, 'fetch calls');
});

test('DONKI window validation mirrors server rules (and catches silently-ignored dates)', () => {
  assertEqual(validateDonkiWindow({ startDate: '2026-09-15', endDate: '2026-11-14' }, true), null);
  assert(validateDonkiWindow({ startDate: '2026-09-14', endDate: '2026-11-14' }, true)?.includes('60 days'), '61 days rejected');
  assert(validateDonkiWindow({ startDate: '2026-11-14', endDate: '2026-10-15' }, true)?.includes('after'), 'reversed rejected');
  assert(validateDonkiWindow({ startDate: '2026-13-45', endDate: '2026-11-14' }, false) !== null, 'malformed rejected');
  assertEqual(validateDonkiWindow(undefined, false), null, 'server default allowed for FLR/SEP');
  assertEqual(recentDonkiWindow(30, FIXED_NOW()).startDate, '2026-10-15');
  assertEqual(recentDonkiWindow(500, FIXED_NOW()).startDate, '2026-09-15', 'clamped to 60 days');
});

test('HTTP 400 from DONKI → kind "http" with the server text preserved', async () => {
  const f = fakeFetch({ '/FLR': () => text(DONKI_ERROR_BODIES.rangeOver60Days, 400) });
  const r = await getSolarFlares(undefined, {}, { fetchImpl: f });
  assert(!r.ok, 'not ok');
  assertEqual(r.error.kind, 'http');
  assertEqual(r.error.status, 400);
  assert(r.error.bodySnippet?.includes('cannot exceed 60 days'), 'body kept');
});

test('Non-JSON body → invalid-payload; JSON object instead of array → invalid-payload', async () => {
  const a = await getSolarFlares(undefined, {}, { fetchImpl: fakeFetch({ '/FLR': () => text('<html>maintenance</html>') }) });
  assert(!a.ok && a.error.kind === 'invalid-payload', 'html body');
  const b = await getSolarFlares(undefined, {}, { fetchImpl: fakeFetch({ '/FLR': () => json({ error: 'x' }) }) });
  assert(!b.ok && b.error.kind === 'invalid-payload', 'object body');
});

test('fetch rejection (offline or CORS block) → network-or-cors', async () => {
  const f = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
  const r = await getEdaMissions({ fetchImpl: f });
  assert(!r.ok && r.error.kind === 'network-or-cors', 'network-or-cors');
});

test('Timeout → kind "timeout"; caller abort → kind "aborted"', async () => {
  const t = await getSolarFlares(undefined, {}, { fetchImpl: hangingFetch(), timeoutMs: 25 });
  assert(!t.ok && t.error.kind === 'timeout', `timeout, got ${JSON.stringify(t)}`);
  const ctrl = new AbortController();
  const p = getSolarFlares(undefined, {}, { fetchImpl: hangingFetch(), timeoutMs: 5000, signal: ctrl.signal });
  ctrl.abort();
  const a = await p;
  assert(!a.ok && a.error.kind === 'aborted', 'aborted');
});

test('EDA: list, single mission (trailing slash), 404 and name validation', async () => {
  const f = fakeFetch({
    '/missions/RR-9/': () => json(EDA_MISSION_RR9),
    '/missions/NOPE-99/': () => json(EDA_MISSION_NOT_FOUND_BODY, 404),
    '/missions/': () => json(EDA_MISSIONS_SAMPLE),
  });
  const list = await getEdaMissions({ fetchImpl: f });
  assert(list.ok && list.data.length === 2, 'list');
  const one = await getEdaMission('RR-9', { fetchImpl: f });
  assert(one.ok && one.data.name === 'RR-9', 'RR-9');
  assertEqual(f.calls[1], 'https://visualization.osdr.nasa.gov/eda/api/missions/RR-9/');
  const missing = await getEdaMission('NOPE-99', { fetchImpl: f });
  assert(!missing.ok && missing.error.status === 404, '404');
  const bad = await getEdaMission('../admin', { fetchImpl: f });
  assert(!bad.ok && bad.error.kind === 'invalid-request', 'path injection rejected');
});

test('EDA via same-origin proxy baseUrl', async () => {
  const f = fakeFetch({ '/api/nasa/eda/missions/': () => json(EDA_MISSIONS_SAMPLE) });
  const r = await getEdaMissions({ fetchImpl: f, baseUrl: '/api/nasa/eda/' });
  assert(r.ok, 'ok via proxy');
  assertEqual(f.calls[0], '/api/nasa/eda/missions/');
});

test('Biodata: OSD-655 envelope, 422 for unknown accession, accession validation', async () => {
  const f = fakeFetch({
    '/dataset/OSD-655/': () => json(BIODATA_OSD655_ENVELOPE),
    '/dataset/OSD-99999/': () => json(BIODATA_ERROR_UNKNOWN_ACCESSION, 422),
  });
  const ok = await getBiodataDataset('OSD-655', { fetchImpl: f });
  assert(ok.ok && ok.data.REST_URL.endsWith('/dataset/OSD-655/'), 'OSD-655');
  const unknown = await getBiodataDataset('OSD-99999', { fetchImpl: f });
  assert(!unknown.ok && unknown.error.status === 422, '422');
  const bad = await getBiodataDataset('GLDS-1; DROP', { fetchImpl: f });
  assert(!bad.ok && bad.error.kind === 'invalid-request', 'validated');
});

test('RadLab: URL builder reproduces the exact URL captured live', () => {
  const url = buildRadLabUrl({ celestialBody: 'Mars', start: '2024-05-15', end: '2024-05-26' });
  assertEqual(url, MARS_RAD_2024_SOURCE_URL);
});

test('RadLab: series parsed from split JSON', async () => {
  const r = await getRadLabSeries(
    { celestialBody: 'Mars', start: '2024-05-20', end: '2024-05-21' },
    { fetchImpl: fakeFetch({ 'radlab/api/': () => json(RADLAB_MARS_ONSET_SAMPLE) }) },
  );
  assert(r.ok && r.data.length === 12, 'parsed');
  const bad = await getRadLabSeries({ start: '2024-05-21', end: '2024-05-20' });
  assert(!bad.ok && bad.error.kind === 'invalid-request', 'start<end enforced');
});

test('loadSolarStormWatchData: offline → replay present, today unavailable (no fake “live”)', async () => {
  const f = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
  const d = await loadSolarStormWatchData({ fetchImpl: f, now: FIXED_NOW });
  assertEqual(d.replay.isHistoricalReplay, true);
  assertEqual(d.today.status, 'unavailable');
  assert(d.today.status === 'unavailable' && d.today.error.kind === 'network-or-cors', 'error kind');
});

test('loadSolarStormWatchData: live answers → tier + Mars predictions, provenance for all 3 calls', async () => {
  const f = fakeFetch({
    '/FLR': () => json([FLR_NO_LINKS, FLR_WITH_CME]),
    '/CME': () => json([CME_RECENT_WITH_MARS_PREDICTION]),
    '/SEP': () => json(SEP_EMPTY_WINDOW),
  });
  const d = await loadSolarStormWatchData({ fetchImpl: f, now: FIXED_NOW });
  assert(d.today.status === 'live', 'live');
  const c = d.today.context;
  assertEqual(c.mode, 'live');
  assertEqual(c.windowStart, '2026-10-15');
  assertEqual(c.tier, 'active');
  assertEqual(c.strongestFlare?.classType, 'M3.5');
  assert(c.marsPredictions.length > 0, 'Mars prediction surfaced');
  assertEqual(c.provenance.length, 3);
});
