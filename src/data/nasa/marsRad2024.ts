/**
 * Curiosity RAD (Mars surface) absorbed dose rate around the 2024-05-20 solar event,
 * from NASA OSDR RadLab. Derived metrics are COMPUTED here from the captured series by the
 * shared, tested normalizers — they are not hand-entered numbers.
 *
 * Scientific caveats (show in UI copy, see BONUS_MISSION_05_SPEC.md):
 * - Values are absorbed dose RATE in µGy/hour as published by RadLab. RadLab does not state the
 *   dosimetric medium/detector channel for these rows; dose_equivalent_rate is null.
 * - Do NOT present these numbers as the same quantity as NASA’s published 8,100 µGy estimate
 *   (JPL release 2024-080). They differ (the RadLab-integrated May-20 dose is ~1.5 mGy).
 * - Curiosity sits inside Gale Crater under Mars’s thin atmosphere; it is one location.
 */
import {
  MARS_RAD_2024_CAPTURED_AT,
  MARS_RAD_2024_SERIES,
  MARS_RAD_2024_SOURCE_URL,
} from './generated/marsRad2024.generated.ts';
import { hourlyMeans, integrateDoseUGy, parseUtc } from '../../integrations/nasa/normalizers.ts';
import { provenanceBase } from '../../integrations/nasa/sourceRegistry.ts';
import type { DataProvenance, HourlyDosePoint, RadLabPoint } from '../../integrations/nasa/types.ts';

export const MARS_RAD_2024_PROVENANCE: DataProvenance = {
  ...provenanceBase('radlab'),
  mode: 'snapshot',
  sourceUrl: MARS_RAD_2024_SOURCE_URL,
  retrievedAt: MARS_RAD_2024_CAPTURED_AT,
};

export const MARS_RAD_2024_POINTS: readonly RadLabPoint[] = MARS_RAD_2024_SERIES.map(([timestamp, rate]) => ({
  timestamp,
  spacecraft: 'Curiosity',
  instrument: 'MSL-RAD',
  instrumentId: 'MSL-RAD-Surface',
  celestialBody: 'Mars',
  trajectory: 'Mars surface',
  absorbedDoseRateUGyPerHour: rate,
  doseEquivalentRateUSvPerHour: null,
}));

function utc(iso: string): number {
  const ms = parseUtc(iso);
  if (ms === null) throw new Error(`Invalid timestamp ${iso}`);
  return ms;
}

const pointsBetween = (start: string, end: string) =>
  MARS_RAD_2024_POINTS.filter((p) => {
    const t = parseUtc(p.timestamp);
    return t !== null && t >= utc(start) && t < utc(end);
  });

/** Hourly means for 2024-05-19 00Z → 2024-05-23 00Z — compact enough for a chart. */
export const MARS_RAD_2024_HOURLY: readonly HourlyDosePoint[] = hourlyMeans(pointsBetween('2024-05-19T00:00Z', '2024-05-23T00:00Z'));

export interface MarsRadEventMetrics {
  /** Mean daily dose over the five quiet days 2024-05-15..19 (µGy/day). */
  baselineDailyDoseUGy: number;
  /** Median dose rate over the same quiet days (µGy/h). */
  baselineRateUGyPerHour: number;
  /** Integrated dose over the UTC day 2024-05-20 (µGy). */
  eventDayDoseUGy: number;
  /** Integrated dose over the UTC day 2024-05-21 (µGy). */
  dayAfterDoseUGy: number;
  eventDayMultipleOfBaseline: number;
  peakRateUGyPerHour: number;
  peakTime: string;
  /** First sample on 2024-05-20 above 10 µGy/h. */
  onsetTime: string;
  /** The sample just before `onsetTime` (RAD samples every ~17 min, so the rise can start before onset). */
  sampleBeforeOnset: { time: string; rateUGyPerHour: number };
  /** First sample after the peak back below 2× the baseline rate. */
  recoveryTime: string;
  hoursFromOnsetToPeak: number;
  hoursFromOnsetToRecovery: number;
}

function computeMetrics(): MarsRadEventMetrics {
  const quiet = pointsBetween('2024-05-15T00:00Z', '2024-05-20T00:00Z');
  const quietRates = quiet.map((p) => p.absorbedDoseRateUGyPerHour).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const baselineRate = quietRates[quietRates.length >> 1];
  const baselineDaily = integrateDoseUGy([...quiet], utc('2024-05-15T00:00Z'), utc('2024-05-20T00:00Z')) / 5;
  const all = [...MARS_RAD_2024_POINTS];
  const eventDay = integrateDoseUGy(all, utc('2024-05-20T00:00Z'), utc('2024-05-21T00:00Z'));
  const dayAfter = integrateDoseUGy(all, utc('2024-05-21T00:00Z'), utc('2024-05-22T00:00Z'));

  const day20 = pointsBetween('2024-05-20T00:00Z', '2024-05-21T00:00Z');
  const onset = day20.find((p) => (p.absorbedDoseRateUGyPerHour ?? 0) > 10);
  const peak = all.reduce((best, p) => ((p.absorbedDoseRateUGyPerHour ?? -1) > (best.absorbedDoseRateUGyPerHour ?? -1) ? p : best));
  const recovery = all.find((p) => utc(p.timestamp) > utc(peak.timestamp) && (p.absorbedDoseRateUGyPerHour ?? Infinity) < 2 * baselineRate);
  if (!onset || !recovery) throw new Error('Mars RAD 2024 snapshot is missing the expected event');
  const before = all[all.indexOf(onset) - 1];

  const hours = (a: string, b: string) => Math.round(((utc(b) - utc(a)) / 3_600_000) * 10) / 10;
  return {
    baselineDailyDoseUGy: Math.round(baselineDaily * 10) / 10,
    baselineRateUGyPerHour: Math.round(baselineRate * 100) / 100,
    eventDayDoseUGy: Math.round(eventDay),
    dayAfterDoseUGy: Math.round(dayAfter),
    eventDayMultipleOfBaseline: Math.round((eventDay / baselineDaily) * 10) / 10,
    peakRateUGyPerHour: Math.round((peak.absorbedDoseRateUGyPerHour ?? 0) * 10) / 10,
    peakTime: peak.timestamp,
    onsetTime: onset.timestamp,
    sampleBeforeOnset: { time: before.timestamp, rateUGyPerHour: Math.round((before.absorbedDoseRateUGyPerHour ?? 0) * 10) / 10 },
    recoveryTime: recovery.timestamp,
    hoursFromOnsetToPeak: hours(onset.timestamp, peak.timestamp),
    hoursFromOnsetToRecovery: hours(onset.timestamp, recovery.timestamp),
  };
}

export const MARS_RAD_2024_METRICS: MarsRadEventMetrics = computeMetrics();
