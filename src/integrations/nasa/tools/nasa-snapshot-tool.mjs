#!/usr/bin/env node
// Offline research tool — NOT bundled into the game (nothing in src/ imports it). Node >= 20.
//
//   node src/integrations/nasa/tools/nasa-snapshot-tool.mjs capture <rawDir>
//       Downloads the exact raw responses used for fixtures/snapshots into <rawDir>
//       (keep <rawDir> OUTSIDE the repo; EDA dashboards total ~40 MB). Existing files are reused.
//   node src/integrations/nasa/tools/nasa-snapshot-tool.mjs build <rawDir>
//       Regenerates the *.generated.ts / *.fixtures.ts modules from <rawDir>.
//
// Fixture/snapshot values are copied or derived from real responses only — never typed by hand.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

// Slow links + Node's 250 ms happy-eyeballs default produced spurious ETIMEDOUT on 2026-11-14.
net.setDefaultAutoSelectFamilyAttemptTimeout?.(5000);

const HERE = dirname(fileURLToPath(import.meta.url));
const NASA_DIR = resolve(HERE, '..');
const DATA_DIR = resolve(HERE, '../../../data/nasa');
const UA = 'JuniorAstronautMissionTrainer-research/1.0 (educational; NASA Space Apps 2026)';

const DONKI = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get';
const EDA = 'https://visualization.osdr.nasa.gov/eda';
const BIO = 'https://visualization.osdr.nasa.gov/biodata/api/v2';
const RAD = 'https://visualization.osdr.nasa.gov/radlab/api/';

export const MANIFEST = {
  'donki/flr_recent.json': `${DONKI}/FLR?startDate=2026-10-15&endDate=2026-11-14`,
  'donki/cme_recent.json': `${DONKI}/CME?startDate=2026-10-15&endDate=2026-11-14`,
  'donki/sep_recent.json': `${DONKI}/SEP?startDate=2026-10-15&endDate=2026-11-14`,
  'donki/rbe_recent.json': `${DONKI}/RBE?catalog=ALL&version=Latest&startDate=2026-10-15&endDate=2026-11-14`,
  'donki/hss_recent.json': `${DONKI}/HSS?startDate=2026-10-15&endDate=2026-11-14`,
  'donki/sep_2024-05.json': `${DONKI}/SEP?startDate=2024-05-01&endDate=2024-05-31`,
  'donki/gst_2024-05.json': `${DONKI}/GST?startDate=2024-05-01&endDate=2024-05-31`,
  'donki/cme_2024-05-19_22.json': `${DONKI}/CME?startDate=2024-05-19&endDate=2024-05-22`,
  'donki/notifications_2024-05-19_23.json': `${DONKI}/notifications?startDate=2024-05-19&endDate=2024-05-23&type=ALL`,
  'donki/err_cme_missing_dates.txt': `${DONKI}/CME`,
  'donki/err_range_61_days.txt': `${DONKI}/FLR?startDate=2026-09-14&endDate=2026-11-14`,
  'donki/err_reversed.txt': `${DONKI}/FLR?startDate=2026-11-14&endDate=2026-10-15`,
  'eda/api_index.json': `${EDA}/api/`,
  'eda/missions.json': `${EDA}/api/missions/`,
  'eda/mission_RR-9.json': `${EDA}/api/missions/RR-9/`,
  'eda/mission_unknown.json': `${EDA}/api/missions/NOPE-99/`,
  'biodata/OSD-655.json': `${BIO}/dataset/OSD-655/`,
  'biodata/OSD-773.json': `${BIO}/dataset/OSD-773/`,
  'biodata/OSD-476.json': `${BIO}/dataset/OSD-476/`,
  'biodata/query_arabidopsis.json': `${BIO}/query/datasets/?study.characteristics.organism=Arabidopsis%20thaliana&format=json.records`,
  'biodata/err_unknown_accession.json': `${BIO}/dataset/OSD-999999/`,
  'biodata/err_bad_format.json': `${BIO}/query/datasets/?format=json`,
  'radlab/mars_2024-05-15_26.json': `${RAD}?celestial_body=Mars&spacecraft&instrument&instrument_id&trajectory&timestamp%3E=2024-05-15&timestamp%3C2024-05-26&absorbed_dose_rate&dose_equivalent_rate&format=json`,
};

// Servers only emit Access-Control-Allow-Origin in response to an Origin header, so send one
// (the Vite dev origin) to record each source's real browser-CORS behaviour in the manifest.
const PROBE_ORIGIN = 'http://localhost:5173';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Origin: PROBE_ORIGIN, Accept: 'application/json, text/html;q=0.8, */*;q=0.5' }, signal: AbortSignal.timeout(120_000) });
  return { status: res.status, contentType: res.headers.get('content-type') ?? '', acao: res.headers.get('access-control-allow-origin'), text: await res.text() };
}

async function capture(rawDir) {
  const manifestPath = join(rawDir, 'manifest.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  const save = (rel, meta, text) => {
    mkdirSync(dirname(join(rawDir, rel)), { recursive: true });
    writeFileSync(join(rawDir, rel), text);
    manifest[rel] = meta;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  };
  for (const [rel, url] of Object.entries(MANIFEST)) {
    if (existsSync(join(rawDir, rel)) && manifest[rel]) { console.log('cached ', rel); continue; }
    const r = await fetchText(url);
    save(rel, { url, status: r.status, contentType: r.contentType, acao: r.acao, capturedAt: new Date().toISOString(), bytes: r.text.length }, r.text);
    console.log(String(r.status).padEnd(4), rel, `${r.text.length}B`, `ACAO=${r.acao ?? '(none)'}`);
  }
  const missions = JSON.parse(readFileSync(join(rawDir, 'eda/missions.json'), 'utf8'));
  for (const m of missions) {
    const rel = `eda/dashboards/${m.name}.html`;
    if (existsSync(join(rawDir, rel))) { console.log('cached ', rel); continue; }
    const url = `${EDA}/dashboard_${encodeURIComponent(m.name)}`;
    const r = await fetchText(url);
    save(rel, { url, status: r.status, contentType: r.contentType, acao: r.acao, capturedAt: new Date().toISOString(), bytes: r.text.length }, r.text);
    console.log(String(r.status).padEnd(4), rel, `${r.text.length}B`);
  }
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

const ts = (v) => JSON.stringify(v, null, 2);
const num = (arr) => (arr ?? []).map((v) => (v === 'NA' || v === null || v === '' ? NaN : Number(v))).filter(Number.isFinite);
const round = (v, d = 3) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
function median(a) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const minOf = (a) => (a.length ? a.reduce((x, y) => (y < x ? y : x)) : null);
const maxOf = (a) => (a.length ? a.reduce((x, y) => (y > x ? y : x)) : null);

function header(rawDir, rels, purpose) {
  const manifest = JSON.parse(readFileSync(join(rawDir, 'manifest.json'), 'utf8'));
  const lines = rels.map((r) => ` *   ${manifest[r]?.capturedAt ?? '?'}  HTTP ${manifest[r]?.status ?? '?'}  ${manifest[r]?.url ?? r}`);
  return `/**\n * GENERATED by src/integrations/nasa/tools/nasa-snapshot-tool.mjs — do not edit by hand.\n * ${purpose}\n * Captured responses:\n${lines.join('\n')}\n */\n`;
}

function metaExports(rawDir, rel, prefix) {
  const m = JSON.parse(readFileSync(join(rawDir, "manifest.json"), "utf8"))[rel];
  return `export const ${prefix}_CAPTURED_AT = ${JSON.stringify(m.capturedAt)};
export const ${prefix}_SOURCE_URL = ${JSON.stringify(m.url)};
`;
}

function build(rawDir) {
  const read = (rel) => readFileSync(join(rawDir, rel), 'utf8');
  const json = (rel) => JSON.parse(read(rel));

  // ---------------- DONKI fixtures ----------------
  const flr = json('donki/flr_recent.json');
  const cmeRecent = json('donki/cme_recent.json');
  const cme2024 = json('donki/cme_2024-05-19_22.json');
  const notif2024 = json('donki/notifications_2024-05-19_23.json');
  const sep2024 = json('donki/sep_2024-05.json');
  const gst2024 = json('donki/gst_2024-05.json');
  const pick = (arr, key, id) => { const r = arr.find((x) => x[key] === id); if (!r) throw new Error(`missing ${id}`); return r; };
  const alert = pick(notif2024, 'messageID', '20240520-AL-001');
  const donkiRels = ['donki/flr_recent.json', 'donki/cme_recent.json', 'donki/sep_recent.json', 'donki/rbe_recent.json', 'donki/hss_recent.json', 'donki/sep_2024-05.json', 'donki/gst_2024-05.json', 'donki/cme_2024-05-19_22.json', 'donki/notifications_2024-05-19_23.json', 'donki/err_cme_missing_dates.txt', 'donki/err_range_61_days.txt', 'donki/err_reversed.txt'];
  writeFileSync(join(NASA_DIR, 'fixtures/donki.fixtures.ts'), `${header(rawDir, donkiRels, 'Real DONKI records (unaltered except notification body truncation) for normalizer/client tests.')}
import type { DonkiCmeRaw, DonkiFlareRaw, DonkiGstRaw, DonkiHssRaw, DonkiNotificationRaw, DonkiRbeRaw, DonkiSepRaw } from '../types.ts';

/** M1.3 flare with linkedEvents: null (as returned live). */
export const FLR_NO_LINKS: DonkiFlareRaw = ${ts(pick(flr, 'flrID', '2026-10-16T15:38:00-FLR-001'))};

/** M3.5 flare linked to a CME. */
export const FLR_WITH_CME: DonkiFlareRaw = ${ts(pick(flr, 'flrID', '2026-11-05T18:21:00-FLR-001'))};

/** Far-side fast halo CME of 2024-05-20 (two most-accurate analyses: R-type 2678 km/s, O-type 1927 km/s). */
export const CME_FAR_SIDE_2024_05_20: DonkiCmeRaw = ${ts(pick(cme2024, 'activityID', '2024-05-20T05:36:00-CME-001'))};

/** Recent CME whose ENLIL runs list "Mars" (model prediction). */
export const CME_RECENT_WITH_MARS_PREDICTION: DonkiCmeRaw = ${ts(pick(cmeRecent, 'activityID', '2026-10-26T09:00:00-CME-001'))};

/** SEP list for 2026-10-15..2026-11-14 — an empty array (valid answer). */
export const SEP_EMPTY_WINDOW: DonkiSepRaw[] = ${ts(json('donki/sep_recent.json'))};

/** Observed SEP (GOES >100 MeV) after the X5.8 flare of 2024-05-11. */
export const SEP_OBSERVED_2024_05_11: DonkiSepRaw = ${ts(pick(sep2024, 'sepID', '2024-05-11T02:10:00-SEP-001'))};

/** Model-only SEP entry (HESPERIA RELeASE forecast) — must not be counted as an observation. */
export const SEP_MODEL_FORECAST_2024_05_09: DonkiSepRaw = ${ts(pick(sep2024, 'sepID', '2024-05-09T13:59:00-SEP-001'))};

/** Kp 9 geomagnetic storm (Earth) of 2024-05-10. */
export const GST_KP9_2024_05_10: DonkiGstRaw = ${ts(pick(gst2024, 'gstID', '2024-05-10T15:00:00-GST-001'))};

export const RBE_SAMPLE: DonkiRbeRaw = ${ts(json('donki/rbe_recent.json')[0])};

export const HSS_SAMPLE: DonkiHssRaw = ${ts(json('donki/hss_recent.json')[0])};

/** CME alert for the far-side event; messageBody truncated to 1,200 characters for size. */
export const NOTIFICATION_2024_05_20: DonkiNotificationRaw = ${ts({ ...alert, messageBody: alert.messageBody.slice(0, 1200) })};

export const DONKI_ERROR_BODIES = ${ts({ cmeMissingDates: read('donki/err_cme_missing_dates.txt'), rangeOver60Days: read('donki/err_range_61_days.txt'), startAfterEnd: read('donki/err_reversed.txt') })} as const;
`);

  // ---------------- DONKI replay snapshot (runtime data, separate from test fixtures) ----------------
  const farSide = pick(cme2024, 'activityID', '2024-05-20T05:36:00-CME-001');
  writeFileSync(join(DATA_DIR, 'generated/donkiReplay2024.generated.ts'), `${header(rawDir, ['donki/cme_2024-05-19_22.json', 'donki/notifications_2024-05-19_23.json'], 'DONKI record + alert metadata for the Bonus Mission 05 historical replay (2024-05-20 far-side CME).')}
import type { DonkiCmeRaw } from '../../../integrations/nasa/types.ts';

${metaExports(rawDir, 'donki/cme_2024-05-19_22.json', 'DONKI_REPLAY')}
export const DONKI_REPLAY_CME_2024_05_20: DonkiCmeRaw = ${ts(farSide)};

/** Alert metadata only (body omitted; open messageURL for the full text incl. NOAA SWPC disclaimer). */
export const DONKI_REPLAY_ALERT_2024_05_20 = ${ts({ messageType: alert.messageType, messageID: alert.messageID, messageURL: alert.messageURL, messageIssueTime: alert.messageIssueTime, summaryLine: (alert.messageBody.match(/it is estimated that[^\n]*/) ?? [''])[0] })} as const;
`);

  // ---------------- EDA fixtures + snapshot ----------------
  const missions = json('eda/missions.json');
  writeFileSync(join(NASA_DIR, 'fixtures/eda.fixtures.ts'), `${header(rawDir, ['eda/api_index.json', 'eda/missions.json', 'eda/mission_RR-9.json', 'eda/mission_unknown.json'], 'Real EDA API responses for tests.')}
import type { EdaApiIndexRaw, EdaMissionRaw } from '../types.ts';

export const EDA_API_INDEX: EdaApiIndexRaw = ${ts(json('eda/api_index.json'))};

/** First 2 of ${missions.length} missions returned by /eda/api/missions/. */
export const EDA_MISSIONS_SAMPLE: EdaMissionRaw[] = ${ts(missions.slice(0, 2))};

export const EDA_MISSION_RR9: EdaMissionRaw = ${ts(json('eda/mission_RR-9.json'))};

/** HTTP 404 body for an unknown mission name. */
export const EDA_MISSION_NOT_FOUND_BODY = ${ts(json('eda/mission_unknown.json'))} as const;

export const EDA_MISSION_COUNT = ${missions.length};
`);

  const rows = [];
  for (const m of missions) {
    const rel = `eda/dashboards/${m.name}.html`;
    if (!existsSync(join(rawDir, rel))) throw new Error(`missing ${rel} — run capture first`);
    const raw = read(rel).match(/<script[^>]*id="data"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    const d = raw ? JSON.parse(raw) : {};
    const t = d.telemetry_data ? JSON.parse(d.telemetry_data) : {};
    const r = d.radiation_data ? JSON.parse(d.radiation_data) : {};
    const co2 = num(t.co2_iss);
    const warnings = [];
    if (t.time && r.time && String(t.time[0]).slice(0, 4) !== String(r.time[0]).slice(0, 4)) {
      warnings.push(`EDA telemetry starts ${t.time[0]} but radiation starts ${r.time[0]} for the same mission (year mismatch inside EDA).`);
    }
    const co2Med = median(co2);
    if (co2Med !== null && co2Med < 1000) warnings.push(`ISS CO2 median ${Math.round(co2Med)} ppm is far below other missions (~2,100–3,900); verify before display.`);
    if (/^RR-/.test(m.name) && t.time && !co2.length) warnings.push('No CO2 telemetry for this mission in EDA.');
    rows.push({
      name: m.name,
      title: m.title,
      category: /^RR-/i.test(m.name) ? 'rodent-research-window' : 'plant-mission-window',
      link: m.link,
      telemetryStart: t.time?.[0] ?? null,
      telemetryEnd: t.time?.at(-1) ?? null,
      temperatureIssMedianC: round(median(num(t.temperature_iss)), 2),
      relativeHumidityIssMedianPct: round(median(num(t.rh_iss)), 1),
      co2IssMedianPpm: round(co2Med, 0),
      co2IssMinPpm: round(minOf(co2), 0),
      co2IssMaxPpm: round(maxOf(co2), 0),
      radiationStart: r.time?.[0] ?? null,
      radiationEnd: r.time?.at(-1) ?? null,
      radiationDays: r.time?.length ?? null,
      totalDoseMedianMGyPerDay: round(median(num(r.total)), 3),
      accumulatedDoseFinalMGy: round(num(r.accumulated).at(-1) ?? null, 2),
      warnings,
    });
  }
  writeFileSync(join(DATA_DIR, 'generated/edaIssEnvironment.generated.ts'), `${header(rawDir, ['eda/missions.json', ...missions.map((m) => `eda/dashboards/${m.name}.html`)], 'Per-mission summaries of ISS cabin telemetry (°C, %RH, CO2 ppm) and ISS radiation dose (mGy/day) from EDA dashboards. Medians over all non-"NA" samples.')}
import type { EdaMissionEnvironmentSummary } from '../../../integrations/nasa/types.ts';

export const EDA_SUMMARY_CAPTURED_AT = ${ts(JSON.parse(read('manifest.json'))['eda/missions.json'].capturedAt)};

export const EDA_MISSION_ENVIRONMENT: EdaMissionEnvironmentSummary[] = ${ts(rows)};
`);

  // ---------------- OSDR Biodata ----------------
  const KEEP = ['study title', 'organism', 'project identifier', 'experiment platform', 'flight program', 'mission', 'managing nasa center', 'study factor name', 'study description', 'project title', 'study publication title'];
  const trimmed = {};
  for (const acc of ['OSD-655', 'OSD-773', 'OSD-476']) {
    const env = json(`biodata/${acc}.json`)[acc];
    trimmed[acc] = { REST_URL: env.REST_URL, metadata: Object.fromEntries(KEEP.filter((k) => k in env.metadata).map((k) => [k, env.metadata[k]])) };
  }
  writeFileSync(join(DATA_DIR, 'generated/osdrStudies.generated.ts'), `${header(rawDir, ['biodata/OSD-655.json', 'biodata/OSD-773.json', 'biodata/OSD-476.json'], 'OSDR Biodata v2 dataset metadata, trimmed to the fields the game displays.')}
import type { BiodataDatasetRaw } from '../../../integrations/nasa/types.ts';

${metaExports(rawDir, 'biodata/OSD-655.json', 'OSDR_STUDIES')}
export const OSDR_STUDY_METADATA: Record<'OSD-655' | 'OSD-773' | 'OSD-476', BiodataDatasetRaw> = ${ts(trimmed)};
`);
  const q = json('biodata/query_arabidopsis.json');
  writeFileSync(join(NASA_DIR, 'fixtures/osdr.fixtures.ts'), `${header(rawDir, ['biodata/OSD-655.json', 'biodata/query_arabidopsis.json', 'biodata/err_unknown_accession.json', 'biodata/err_bad_format.json', 'radlab/mars_2024-05-15_26.json'], 'Real OSDR Biodata + RadLab responses for tests.')}
import type { BiodataDatasetRaw, BiodataErrorRaw, RadLabSplitRaw } from '../types.ts';

export const BIODATA_OSD655_ENVELOPE: Record<string, BiodataDatasetRaw> = ${ts({ 'OSD-655': trimmed['OSD-655'] })};

/** First 5 of ${q.length} rows for study.characteristics.organism=Arabidopsis thaliana (format=json.records). */
export const BIODATA_QUERY_ARABIDOPSIS_SAMPLE: Record<string, unknown>[] = ${ts(q.slice(0, 5))};
export const BIODATA_QUERY_ARABIDOPSIS_COUNT = ${q.length};

/** HTTP 422 body for an unknown accession. */
export const BIODATA_ERROR_UNKNOWN_ACCESSION: BiodataErrorRaw = ${ts(json('biodata/err_unknown_accession.json'))};

/** HTTP 400 body for format=json. */
export const BIODATA_ERROR_BAD_FORMAT: BiodataErrorRaw = ${ts(json('biodata/err_bad_format.json'))};

/** 12 consecutive Curiosity MSL-RAD rows spanning the 2024-05-20 onset (columns exactly as returned). */
export const RADLAB_MARS_ONSET_SAMPLE: RadLabSplitRaw = ${(() => {
    const rl = json('radlab/mars_2024-05-15_26.json');
    const ti = rl.columns.indexOf('timestamp');
    const start = rl.data.findIndex((row) => String(row[ti]) >= '2024-05-20T04:00');
    return ts({ columns: rl.columns, index: rl.index.slice(start, start + 12), data: rl.data.slice(start, start + 12) });
  })()};
`);

  // ---------------- Mars RAD 2024 compact series ----------------
  const rl = json('radlab/mars_2024-05-15_26.json');
  const ci = (c) => rl.columns.indexOf(c);
  const tuples = rl.data
    .filter((row) => typeof row[ci('absorbed_dose_rate')] === 'number')
    .map((row) => [String(row[ci('timestamp')]), Math.round(row[ci('absorbed_dose_rate')] * 1000) / 1000]);
  const ids = [...new Set(rl.data.map((row) => `${row[ci('spacecraft')]} | ${row[ci('instrument')]} | ${row[ci('instrument_id')]} | ${row[ci('trajectory')]}`))];
  writeFileSync(join(DATA_DIR, 'generated/marsRad2024.generated.ts'), `${header(rawDir, ['radlab/mars_2024-05-15_26.json'], 'Curiosity MSL-RAD surface absorbed dose rate (µGy/hour, rounded to 0.001) via RadLab, 2024-05-15 to 2024-05-26 (exclusive).')}
${metaExports(rawDir, 'radlab/mars_2024-05-15_26.json', 'MARS_RAD_2024')}
/** Source rows: ${ids.join(' ; ')}. dose_equivalent_rate was null for every row. */
export const MARS_RAD_2024_SOURCE_ROWS = ${rl.data.length};

/** [timestamp (UTC, no zone designator as returned), absorbed dose rate µGy/h] */
export const MARS_RAD_2024_SERIES: ReadonlyArray<readonly [string, number]> = ${JSON.stringify(tuples)};
`);
  console.log('build complete:', readdirSync(join(DATA_DIR, 'generated')).join(', '));
}

const [cmd, dir] = process.argv.slice(2);
if (!dir || !['capture', 'build'].includes(cmd)) {
  console.error('usage: nasa-snapshot-tool.mjs <capture|build> <rawDir>');
  process.exit(2);
}
mkdirSync(join(NASA_DIR, 'fixtures'), { recursive: true });
mkdirSync(join(DATA_DIR, 'generated'), { recursive: true });
if (cmd === 'capture') await capture(resolve(dir));
else build(resolve(dir));
