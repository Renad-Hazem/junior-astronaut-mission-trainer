/**
 * Public surface of the isolated NASA data layer. Nothing in the live game imports this yet;
 * activation steps are in src/docs/research/INTEGRATION_HANDOFF.md.
 */
export type * from './types.ts';
export { NASA_SOURCES, DONKI_DISCLAIMER, sourceRecord, type NasaSourceRecord } from './sourceRegistry.ts';
export {
  DONKI_BASE_URL,
  DONKI_MAX_WINDOW_DAYS,
  getCmes,
  getNotifications,
  getSeps,
  getSolarFlares,
  recentDonkiWindow,
  validateDonkiWindow,
  type DonkiList,
  type DonkiWindow,
} from './donkiClient.ts';
export { EDA_API_BASE_URL, EDA_BROWSER_CORS_SUPPORTED, getEdaMission, getEdaMissions } from './edaClient.ts';
export {
  BIODATA_API_BASE_URL,
  OSDR_BROWSER_CORS_SUPPORTED,
  RADLAB_API_BASE_URL,
  buildRadLabUrl,
  getBiodataDataset,
  getRadLabSeries,
  queryBiodataDatasets,
  type RadLabQuery,
} from './osdrClient.ts';
export {
  buildSolarStormContext,
  fetchSolarStormContext,
  loadSolarStormWatchData,
  type SolarContextResult,
  type SolarStormWatchData,
} from './solarStormContext.ts';
export { classifySolarActivity, isFarSideFromEarth, parseFlareClass, scoreCmeType } from './normalizers.ts';
