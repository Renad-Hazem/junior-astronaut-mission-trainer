import { assert, assertEqual, test } from './harness.ts';
import { MARS_RAD_2024_METRICS, MARS_RAD_2024_HOURLY } from '../../../data/nasa/marsRad2024.ts';
import { SOLAR_STORM_REPLAY_2024 } from '../../../data/nasa/solarStormWatchSnapshot.ts';
import { EDA_MISSION_ENVIRONMENT, issCabinCo2MedianRange, plantMissionWindows } from '../../../data/nasa/edaIssEnvironment.ts';
import { OSDR_PLANT_STUDIES } from '../../../data/nasa/osdrPlantStudies.ts';
import { NASA_SOURCES } from '../sourceRegistry.ts';

test('Mars RAD 2024 metrics reproduce the independently computed research values', () => {
  const m = MARS_RAD_2024_METRICS;
  assertEqual(m.baselineDailyDoseUGy, 98.5);
  assertEqual(m.eventDayDoseUGy, 1487);
  assertEqual(m.dayAfterDoseUGy, 275);
  assertEqual(m.peakRateUGyPerHour, 304);
  assertEqual(m.peakTime, '2024-05-20T06:15:19');
  assertEqual(m.onsetTime, '2024-05-20T05:38:56');
  assertEqual(m.sampleBeforeOnset.time, '2024-05-20T05:21:50', 'rise already under way before onset sample');
  assert(m.sampleBeforeOnset.rateUGyPerHour > m.baselineRateUGyPerHour, 'pre-onset sample above baseline');
  assert(m.hoursFromOnsetToPeak < 1, 'peak within an hour of onset');
  assert(m.hoursFromOnsetToRecovery > 30 && m.hoursFromOnsetToRecovery < 40, '“about a day and a half”');
  assertEqual(MARS_RAD_2024_HOURLY.length, 96, '4 days of hourly means');
});

test('Replay is labelled historical and every evidence card is sourced, typed and snapshot-mode', () => {
  const r = SOLAR_STORM_REPLAY_2024;
  assertEqual(r.isHistoricalReplay, true);
  assertEqual(r.cme.id, '2024-05-20T05:36:00-CME-001');
  assert(!r.modelPredictedLocations.includes('Mars'), 'model did not list Mars');
  const kinds = new Set(['measurement', 'model-prediction', 'nasa-statement', 'design-guidance']);
  const ids = new Set<string>();
  for (const c of r.evidence) {
    assert(!ids.has(c.id), `duplicate card ${c.id}`);
    ids.add(c.id);
    assert(kinds.has(c.kind), `${c.id} kind`);
    assert(/^https:\/\//.test(c.url), `${c.id} https url`);
    assertEqual(c.provenance.mode, 'snapshot', `${c.id} mode`);
    assert(c.provenance.attribution.length > 10, `${c.id} attribution`);
    assert(!/\blive\b/i.test(c.body), `${c.id} must not claim to be live`);
    assert(c.body.length <= 320, `${c.id} body short enough for kids (${c.body.length})`);
  }
});

test('8,100 µGy is only ever presented as NASA’s statement, never as a RadLab computation', () => {
  for (const c of SOLAR_STORM_REPLAY_2024.evidence) {
    if (/8,100/.test(c.body + c.detail)) {
      assert(c.sourceId === 'jpl-release-2024-080' || c.sourceId === 'radlab', `${c.id} cites 8,100`);
      if (c.sourceId === 'radlab') assert(/do not compare/i.test(c.detail), 'RadLab card warns not to compare');
    }
  }
});

test('EDA summary: 24 missions, CO₂ range excludes flagged missions, plant windows have no CO₂', () => {
  assertEqual(EDA_MISSION_ENVIRONMENT.length, 24);
  const co2 = issCabinCo2MedianRange();
  assert(!co2.missions.includes('RR-22') && !co2.missions.includes('RR-9'), 'flagged missions excluded');
  assert(co2.min >= 2000 && co2.max <= 4000, `range ${co2.min}–${co2.max}`);
  for (const p of plantMissionWindows()) assertEqual(p.co2IssMedianPpm, null, `${p.name} CO₂`);
  const rr9 = EDA_MISSION_ENVIRONMENT.find((m) => m.name === 'RR-9');
  assert(rr9?.warnings.some((w) => w.includes('year mismatch')), 'RR-9 date mismatch recorded');
});

test('OSDR study cards keep their caveats (OSD-773 is microbiota, OSD-476 is a ground study)', () => {
  assert(OSDR_PLANT_STUDIES['OSD-773'].caveats.some((c) => c.includes('Microbiota')), 'OSD-773');
  assertEqual(OSDR_PLANT_STUDIES['OSD-773'].organism, 'Microbiota');
  assertEqual(OSDR_PLANT_STUDIES['OSD-476'].flightProgram, null);
  assertEqual(OSDR_PLANT_STUDIES['OSD-655'].organism, 'Brassica rapa');
});

test('Source registry: every source has verification date, attribution and https docs', () => {
  for (const s of Object.values(NASA_SOURCES)) {
    assertEqual(s.verifiedAt, '2026-11-14', `${s.id} verifiedAt`);
    assert(/^https:\/\//.test(s.documentationUrl), `${s.id} docs url`);
    assert(s.attribution.length > 10, `${s.id} attribution`);
    if (s.apiBaseUrl) assert(/^https:\/\//.test(s.apiBaseUrl), `${s.id} api url`);
  }
  assertEqual(NASA_SOURCES.donki.browserCors, 'allowed');
  assertEqual(NASA_SOURCES.eda.browserCors, 'blocked');
  assertEqual(NASA_SOURCES['api-nasa-gov'].gameUse, 'do-not-use');
});
