/**
 * ISS cabin environment reference values from the NASA OSDR Environmental Data App (EDA).
 *
 * These are INTERNATIONAL SPACE STATION measurements (low Earth orbit), recorded during the
 * dates of named biology missions. They are useful as real-world comparison evidence
 * ("the ISS cabin usually has a few thousand ppm of CO₂") — they are NOT Mars conditions and
 * must never be converted into the game's 0–100 resource values.
 */
import { EDA_MISSION_ENVIRONMENT, EDA_SUMMARY_CAPTURED_AT } from './generated/edaIssEnvironment.generated.ts';
import { provenanceBase } from '../../integrations/nasa/sourceRegistry.ts';
import type { DataProvenance, EdaMissionEnvironmentSummary } from '../../integrations/nasa/types.ts';

export const EDA_ENVIRONMENT_PROVENANCE: DataProvenance = {
  ...provenanceBase('eda'),
  mode: 'snapshot',
  sourceUrl: 'https://visualization.osdr.nasa.gov/eda/',
  retrievedAt: EDA_SUMMARY_CAPTURED_AT,
};

export { EDA_MISSION_ENVIRONMENT };

/** Missions whose summaries carry no data-quality warnings and have the requested field. */
function clean<K extends keyof EdaMissionEnvironmentSummary>(key: K): EdaMissionEnvironmentSummary[] {
  return EDA_MISSION_ENVIRONMENT.filter((m) => m.warnings.length === 0 && m[key] !== null);
}

export interface RangeSummary {
  min: number;
  max: number;
  missions: string[];
}

function range(values: { name: string; v: number }[]): RangeSummary {
  const sorted = [...values].sort((a, b) => a.v - b.v);
  return { min: sorted[0].v, max: sorted[sorted.length - 1].v, missions: sorted.map((x) => x.name) };
}

/** Range of per-mission MEDIAN ISS cabin CO₂ (ppm), excluding missions with data-quality warnings. */
export function issCabinCo2MedianRange(): RangeSummary {
  return range(clean('co2IssMedianPpm').map((m) => ({ name: m.name, v: m.co2IssMedianPpm as number })));
}

/** Range of per-mission MEDIAN ISS total radiation dose (mGy/day), excluding flagged missions. */
export function issTotalDoseMedianRange(): RangeSummary {
  return range(clean('totalDoseMedianMGyPerDay').map((m) => ({ name: m.name, v: m.totalDoseMedianMGyPerDay as number })));
}

/** Plant missions (APEX, VEG): temperature & humidity only — EDA has no CO₂ or radiation for them. */
export function plantMissionWindows(): EdaMissionEnvironmentSummary[] {
  return EDA_MISSION_ENVIRONMENT.filter((m) => m.category === 'plant-mission-window' && m.telemetryStart !== null);
}
