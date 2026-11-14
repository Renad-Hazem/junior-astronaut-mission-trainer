import { assert, assertDeepEqual, assertEqual, test } from './harness.ts';
import {
  classifySolarActivity,
  donkiDaySpan,
  hourlyMeans,
  integrateDoseUGy,
  isDonkiFlareRaw,
  isFarSideFromEarth,
  isValidIsoDate,
  normalizeCme,
  normalizeFlare,
  normalizeRadLabSplit,
  normalizeSep,
  parseFlareClass,
  parseUtc,
  scoreCmeType,
  summarizeBiodataDataset,
  validateArray,
} from '../normalizers.ts';
import {
  CME_FAR_SIDE_2024_05_20,
  CME_RECENT_WITH_MARS_PREDICTION,
  FLR_NO_LINKS,
  FLR_WITH_CME,
  SEP_MODEL_FORECAST_2024_05_09,
  SEP_OBSERVED_2024_05_11,
} from '../fixtures/donki.fixtures.ts';
import { BIODATA_OSD655_ENVELOPE, RADLAB_MARS_ONSET_SAMPLE } from '../fixtures/osdr.fixtures.ts';
import type { RadLabPoint } from '../types.ts';

test('parseFlareClass: GOES classes map to letter, magnitude and flux', () => {
  const x = parseFlareClass('X5.8');
  assertEqual(x.letter, 'X');
  assertEqual(x.magnitude, 5.8);
  assert(Math.abs((x.peakFluxWm2 ?? 0) - 5.8e-4) < 1e-12, 'X5.8 → 5.8e-4 W/m²');
  assertEqual(parseFlareClass('M1.3').letter, 'M');
  assertDeepEqual(parseFlareClass('not-a-class'), { letter: null, magnitude: null, peakFluxWm2: null });
});

test('parseUtc: DONKI minute precision and zone-less RadLab/EDA timestamps are UTC', () => {
  assertEqual(parseUtc('2026-10-16T15:38Z'), Date.UTC(2026, 9, 16, 15, 38));
  assertEqual(parseUtc('2024-05-20T06:15:19'), Date.UTC(2024, 4, 20, 6, 15, 19));
  assertEqual(parseUtc('2018-08-14 04:53:00'), Date.UTC(2018, 7, 14, 4, 53));
  assertEqual(parseUtc('garbage'), null);
});

test('isValidIsoDate rejects dates DONKI would silently ignore', () => {
  assert(!isValidIsoDate('2026-13-45'), '2026-13-45 invalid');
  assert(!isValidIsoDate('2026-02-30'), '2026-02-30 invalid');
  assert(!isValidIsoDate('2026/11/14'), 'slashes invalid');
  assert(isValidIsoDate('2026-11-14'), '2026-11-14 valid');
});

test('donkiDaySpan matches the server (61 rejected, 60 accepted)', () => {
  assertEqual(donkiDaySpan('2026-09-14', '2026-11-14'), 61);
  assertEqual(donkiDaySpan('2026-09-15', '2026-11-14'), 60);
  assertEqual(donkiDaySpan('2026-11-05', '2026-11-05'), 0);
});

test('normalizeFlare tolerates linkedEvents: null and keeps links', () => {
  assert(isDonkiFlareRaw(FLR_NO_LINKS), 'fixture passes guard');
  const a = normalizeFlare(FLR_NO_LINKS);
  assertDeepEqual(a.linkedEventIds, []);
  assertEqual(a.classLetter, 'M');
  assertEqual(a.activeRegion, 14551);
  const b = normalizeFlare(FLR_WITH_CME);
  assertDeepEqual(b.linkedEventIds, ['2026-11-05T20:00:00-CME-001']);
  assert(b.instruments[0].startsWith('GOES'), 'GOES instrument kept');
});

test('normalizeCme: far-side 2024-05-20 CME uses the leading edge speed and keeps the shock separate', () => {
  const c = normalizeCme(CME_FAR_SIDE_2024_05_20);
  assertEqual(c.speedKmS, 1927, 'LE speed');
  assertEqual(c.featureCode, 'LE');
  assertEqual(c.shockSpeedKmS, 2678, 'SH speed');
  assertEqual(scoreCmeType(c.speedKmS), 'O');
  assertEqual(isFarSideFromEarth(c), true);
  const locations = [...new Set(c.predictedImpacts.map((p) => p.location))].sort();
  assertDeepEqual(locations, ['Juno', 'OSIRIS-APEX', 'Solar Orbiter']);
  assert(!locations.includes('Mars'), 'ENLIL did not list Mars for this CME');
});

test('normalizeCme: recent CME exposes a Mars ENLIL prediction', () => {
  const c = normalizeCme(CME_RECENT_WITH_MARS_PREDICTION);
  assert(c.predictedImpacts.some((p) => p.location === 'Mars'), 'Mars prediction present');
  assert(c.predictedImpacts.every((p) => p.modelCompletionTime !== ''), 'model completion time kept');
});

test('normalizeSep flags HESPERIA RELeASE model-only entries', () => {
  assertEqual(normalizeSep(SEP_MODEL_FORECAST_2024_05_09).isModelForecast, true);
  assertEqual(normalizeSep(SEP_OBSERVED_2024_05_11).isModelForecast, false);
});

test('classifySolarActivity: quiet / active / storm, ignoring model-only SEPs', () => {
  assertEqual(classifySolarActivity({ flares: [], cmes: [], seps: [] }).tier, 'quiet');
  const mFlare = normalizeFlare(FLR_NO_LINKS);
  assertEqual(classifySolarActivity({ flares: [mFlare], cmes: [], seps: [] }).tier, 'active');
  assertEqual(classifySolarActivity({ flares: [], cmes: [], seps: [normalizeSep(SEP_MODEL_FORECAST_2024_05_09)] }).tier, 'quiet');
  const storm = classifySolarActivity({ flares: [], cmes: [], seps: [normalizeSep(SEP_OBSERVED_2024_05_11)] });
  assertEqual(storm.tier, 'storm');
  assert(storm.reasons[0].includes('observed'), 'reason mentions observed SEP');
});

test('validateArray: rejects non-arrays and counts invalid records instead of inventing them', () => {
  const bad = validateArray({ error: 'x' }, isDonkiFlareRaw, 'FLR');
  assertEqual(bad.ok, false);
  const mixed = validateArray([FLR_NO_LINKS, { nope: 1 }, null], isDonkiFlareRaw, 'FLR');
  assert(mixed.ok, 'array accepted');
  assertEqual(mixed.items.length, 1);
  assertEqual(mixed.skipped, 2);
});

test('normalizeRadLabSplit + hourlyMeans on real Curiosity rows', () => {
  const pts = normalizeRadLabSplit(RADLAB_MARS_ONSET_SAMPLE);
  assertEqual(pts.length, 12);
  assertEqual(pts[0].spacecraft, 'Curiosity');
  assertEqual(pts[0].celestialBody, 'Mars');
  assertEqual(pts[0].doseEquivalentRateUSvPerHour, null, 'RadLab returned null dose equivalent');
  const hours = hourlyMeans(pts);
  assert(hours.length >= 3, 'several hourly buckets');
  assert(hours.every((h) => /^\d{4}-\d{2}-\d{2}T\d{2}:00Z$/.test(h.hour)), 'hour labels');
});

test('integrateDoseUGy: trapezoid over a constant 10 µGy/h for 2 h = 20 µGy', () => {
  const mk = (t: string, v: number): RadLabPoint => ({
    timestamp: t, spacecraft: null, instrument: null, instrumentId: null, celestialBody: null, trajectory: null,
    absorbedDoseRateUGyPerHour: v, doseEquivalentRateUSvPerHour: null,
  });
  const pts = [mk('2024-01-01T00:00:00', 10), mk('2024-01-01T01:00:00', 10), mk('2024-01-01T02:00:00', 10)];
  const d = integrateDoseUGy(pts, Date.UTC(2024, 0, 1, 0), Date.UTC(2024, 0, 1, 2));
  assert(Math.abs(d - 20) < 1e-9, `expected 20, got ${d}`);
});

test('summarizeBiodataDataset reads real OSD-655 metadata', () => {
  const s = summarizeBiodataDataset('OSD-655', BIODATA_OSD655_ENVELOPE['OSD-655'], { educationalUse: 'x', caveats: [] });
  assertEqual(s.organism, 'Brassica rapa');
  assertDeepEqual(s.missions, ['SpaceX-16', 'SpaceX-18']);
  assertEqual(s.platform, 'VEGGIE');
  assert(s.studyFactors.includes('Light Color'), 'light color factor');
  assertEqual(s.repositoryUrl, 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-655');
});
