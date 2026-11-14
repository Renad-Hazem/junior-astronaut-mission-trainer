/**
 * OPT-IN live check against the real NASA services (needs network; not part of run.ts):
 *   node src/integrations/nasa/__tests__/live.smoke.ts
 * Prints one line per call: OK/FAIL, error kind, item counts, and the CORS header each
 * service returns for a browser Origin. Use it to re-verify sourceRegistry.ts before
 * activating the data layer, and record the date you ran it.
 */
import { getCmes, getSeps, getSolarFlares, recentDonkiWindow } from '../donkiClient.ts';
import { getEdaMission, getEdaMissions } from '../edaClient.ts';
import { getBiodataDataset, getRadLabSeries } from '../osdrClient.ts';
import { loadSolarStormWatchData } from '../solarStormContext.ts';
import type { NasaResult } from '../types.ts';

// Node's default 250 ms happy-eyeballs attempt timeout caused spurious ETIMEDOUT on slow links (2026-11-14).
try {
  const net: { setDefaultAutoSelectFamilyAttemptTimeout?: (ms: number) => void } = await import(/* @vite-ignore */ `node:${'net'}`);
  net.setDefaultAutoSelectFamilyAttemptTimeout?.(5000);
} catch {
  /* not running under Node */
}

const ORIGIN = 'http://localhost:5173';
const opts = { timeoutMs: 45_000 };
let failures = 0;

function report<T>(label: string, r: NasaResult<T>, describe: (d: T) => string): void {
  if (r.ok) console.log(`OK    ${label.padEnd(34)} ${describe(r.data)}  ← ${r.provenance.sourceUrl}`);
  else {
    failures += 1;
    console.log(`FAIL  ${label.padEnd(34)} ${r.error.kind}${r.error.status ? ` ${r.error.status}` : ''}: ${r.error.message}`);
  }
}

async function cors(label: string, url: string): Promise<void> {
  try {
    const res = await fetch(url, { headers: { Origin: ORIGIN } });
    console.log(`CORS  ${label.padEnd(34)} HTTP ${res.status}  Access-Control-Allow-Origin: ${res.headers.get('access-control-allow-origin') ?? '(none → browser blocked)'}`);
  } catch (e) {
    console.log(`CORS  ${label.padEnd(34)} request failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const window = recentDonkiWindow(30);
console.log(`Live NASA smoke test — ${new Date().toISOString()} — DONKI window ${window.startDate}..${window.endDate}\n`);

report('DONKI FLR (30 d)', await getSolarFlares(window, {}, opts), (d) => `${d.items.length} flares, ${d.skipped} skipped`);
report('DONKI CME (30 d)', await getCmes(window, {}, opts), (d) => `${d.items.length} CMEs, ${d.items.filter((c) => c.predictedImpacts.some((p) => p.location === 'Mars')).length} with Mars predictions`);
report('DONKI SEP (30 d)', await getSeps(window, opts), (d) => `${d.items.length} SEP events`);
report('EDA missions', await getEdaMissions(opts), (d) => `${d.length} missions`);
report('EDA mission VEG-01A', await getEdaMission('VEG-01A', opts), (d) => d.title);
report('Biodata OSD-655', await getBiodataDataset('OSD-655', opts), (d) => String(d.metadata['study title'] ?? '').slice(0, 60));
report('RadLab Mars 2024-05-20', await getRadLabSeries({ celestialBody: 'Mars', start: '2024-05-20', end: '2024-05-21' }, opts), (d) => `${d.length} rows`);

const watch = await loadSolarStormWatchData(opts);
console.log(`\nloadSolarStormWatchData → replay ${watch.replay.id}; today: ${watch.today.status === 'live' ? `${watch.today.context.tier} (${watch.today.context.tierReasons.join('; ')})` : `unavailable (${watch.today.error.kind})`}\n`);

await cors('DONKI-API', 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP');
await cors('EDA API', 'https://visualization.osdr.nasa.gov/eda/api/missions/');
await cors('OSDR Biodata API', 'https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-655/');
await cors('RadLab API', 'https://visualization.osdr.nasa.gov/radlab/api/?celestial_body=Mars&timestamp%3E=2024-05-20T05:00&timestamp%3C2024-05-20T06:00&absorbed_dose_rate&format=json');
await cors('OSDR Search API', 'https://osdr.nasa.gov/osdr/data/search?term=plant&size=1');

console.log(`\n${failures === 0 ? 'All live calls succeeded.' : `${failures} live call(s) failed.`}`);
const proc = (globalThis as { process?: { exitCode?: number } }).process;
if (failures > 0 && proc) proc.exitCode = 1;
