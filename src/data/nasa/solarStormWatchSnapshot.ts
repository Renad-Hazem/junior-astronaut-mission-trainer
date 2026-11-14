/**
 * Static, always-available data for Bonus Mission 05 "Solar Storm Watch":
 * a HISTORICAL REPLAY of the real 20 May 2024 solar event as seen at Mars.
 *
 * Every number shown to players is derived from captured NASA data or quoted from a NASA
 * publication, and each evidence card states what kind of evidence it is and where it was
 * measured. Nothing here is "live" — UIs must label it "Real event from May 2024".
 */
import {
  DONKI_REPLAY_ALERT_2024_05_20,
  DONKI_REPLAY_CAPTURED_AT,
  DONKI_REPLAY_CME_2024_05_20,
  DONKI_REPLAY_SOURCE_URL,
} from './generated/donkiReplay2024.generated.ts';
import { MARS_RAD_2024_HOURLY, MARS_RAD_2024_METRICS, MARS_RAD_2024_PROVENANCE } from './marsRad2024.ts';
import { EDA_ENVIRONMENT_PROVENANCE, issCabinCo2MedianRange } from './edaIssEnvironment.ts';
import { OSDR_STUDIES_PROVENANCE, RECOMMENDED_CROP_STUDY } from './osdrPlantStudies.ts';
import { isFarSideFromEarth, normalizeCme, scoreCmeType } from '../../integrations/nasa/normalizers.ts';
import { NASA_SOURCES, provenanceBase } from '../../integrations/nasa/sourceRegistry.ts';
import type { CmeEvent, DataProvenance, HourlyDosePoint, NasaSourceId } from '../../integrations/nasa/types.ts';
import type { MarsRadEventMetrics } from './marsRad2024.ts';

export type EvidenceKind = 'measurement' | 'model-prediction' | 'nasa-statement' | 'design-guidance';
export type EvidenceLocation = 'Mars surface' | 'Sun and near-Earth space' | 'International Space Station' | 'Earth–Mars radio link' | 'Mission design';

export interface EvidenceCard {
  id: string;
  kind: EvidenceKind;
  location: EvidenceLocation;
  heading: string;
  /** Ages 7–10. */
  body: string;
  /** Ages 11–12+ / parents / judges. */
  detail: string;
  sourceId: NasaSourceId;
  sourceLabel: string;
  url: string;
  provenance: DataProvenance;
}

const DONKI_PROVENANCE: DataProvenance = {
  ...provenanceBase('donki'),
  mode: 'snapshot',
  sourceUrl: DONKI_REPLAY_SOURCE_URL,
  retrievedAt: DONKI_REPLAY_CAPTURED_AT,
};

function publicationProvenance(id: NasaSourceId): DataProvenance {
  const s = NASA_SOURCES[id];
  return { ...provenanceBase(id), mode: 'snapshot', sourceUrl: s.documentationUrl, retrievedAt: `${s.verifiedAt}T00:00:00Z` };
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export const REPLAY_CME: CmeEvent = normalizeCme(DONKI_REPLAY_CME_2024_05_20);

export interface SolarStormReplay {
  id: 'mars-2024-05-20';
  label: string;
  isHistoricalReplay: true;
  eventDateUtc: '2024-05-20';
  cme: CmeEvent;
  cmeScoreType: ReturnType<typeof scoreCmeType>;
  launchedFromFarSideOfSun: boolean | null;
  /** ENLIL locations predicted for this CME (model output). Mars is NOT among them. */
  modelPredictedLocations: string[];
  donkiAlert: typeof DONKI_REPLAY_ALERT_2024_05_20;
  marsRad: { metrics: MarsRadEventMetrics; hourly: readonly HourlyDosePoint[] };
  evidence: EvidenceCard[];
  provenance: DataProvenance[];
}

function buildEvidence(m: MarsRadEventMetrics, cme: CmeEvent, predicted: string[]): EvidenceCard[] {
  const co2 = issCabinCo2MedianRange();
  const jumpFactor = Math.round(m.peakRateUGyPerHour / m.baselineRateUGyPerHour);
  return [
    {
      id: 'donki-far-side-cme',
      kind: 'measurement',
      location: 'Sun and near-Earth space',
      heading: 'Sun-watching spacecraft spotted a giant eruption',
      body: `On 20 May 2024, NASA space-weather experts saw a huge cloud of solar gas (a CME) fly off the side of the Sun that faces away from Earth. Its main cloud moved about ${fmt(cme.speedKmS ?? 0)} kilometers every second!`,
      detail: `DONKI ${cme.id}: “fast halo CME” seen by ${cme.instruments.join(', ')}; source “believed to be backsided”. Leading-edge speed ~${fmt(cme.speedKmS ?? 0)} km/s (SCORE ${scoreCmeType(cme.speedKmS)}-type); shock front ~${fmt(cme.shockSpeedKmS ?? 0)} km/s. Speeds are analyst estimates from coronagraph images.`,
      sourceId: 'donki',
      sourceLabel: 'NASA CCMC DONKI (Moon to Mars Space Weather Analysis Office)',
      url: cme.link,
      provenance: DONKI_PROVENANCE,
    },
    {
      id: 'radlab-mars-spike',
      kind: 'measurement',
      location: 'Mars surface',
      heading: 'The Curiosity rover felt the storm on Mars',
      body: `Curiosity’s radiation detector on Mars saw radiation climb to about ${jumpFactor} times its normal level within an hour. It took about ${Math.round(m.hoursFromOnsetToRecovery)} hours to calm back down.`,
      detail: `RadLab, Curiosity MSL-RAD (surface): baseline ≈${m.baselineRateUGyPerHour} µGy/h (15–19 May); first sample above 10 µGy/h at ${m.onsetTime} UTC; peak ${m.peakRateUGyPerHour} µGy/h at ${m.peakTime} UTC; back below 2× baseline at ${m.recoveryTime} UTC. Integrated absorbed dose on 20 May (UTC) ≈ ${fmt(m.eventDayDoseUGy)} µGy vs ≈ ${fmt(m.baselineDailyDoseUGy)} µGy on a quiet day (~${m.eventDayMultipleOfBaseline}×). RadLab does not state the detector medium, so do not compare directly with NASA’s 8,100 µGy estimate.`,
      sourceId: 'radlab',
      sourceLabel: 'Curiosity RAD via NASA OSDR RadLab',
      url: NASA_SOURCES.radlab.documentationUrl,
      provenance: MARS_RAD_2024_PROVENANCE,
    },
    {
      id: 'jpl-8100-microgray',
      kind: 'nasa-statement',
      location: 'Mars surface',
      heading: 'What NASA said about astronauts',
      body: 'NASA said an astronaut standing next to Curiosity would have received a radiation dose like 30 chest X-rays — and that cliffs or lava tubes would give extra shielding.',
      detail: 'JPL release 2024-080 (10 June 2024): the flare was “later estimated to be an X12”; astronauts nearby “would have received a radiation dose of 8,100 micrograys … equivalent to 30 chest X-rays”; “Cliffsides or lava tubes would provide additional shielding”; “the biggest surge measured by Curiosity’s Radiation Assessment Detector, or RAD”.',
      sourceId: 'jpl-release-2024-080',
      sourceLabel: 'NASA/JPL news release 2024-080',
      url: NASA_SOURCES['jpl-release-2024-080'].documentationUrl,
      provenance: publicationProvenance('jpl-release-2024-080'),
    },
    {
      id: 'donki-model-did-not-list-mars',
      kind: 'model-prediction',
      location: 'Sun and near-Earth space',
      heading: 'Fast particles beat the forecast',
      body: 'Computer models predicted which spacecraft the solar cloud would hit — and Mars was not on the list. But tiny, super-fast particles from the eruption still reached Mars in less than an hour. That is why crews need a shelter they can reach quickly.',
      detail: `WSA-ENLIL runs stored with ${cme.id} predicted arrivals at ${predicted.join(', ')} (model output, not measurements). The DONKI note says the eruption’s EUV wave was visible at 2024-05-20T05:22Z. Curiosity’s RAD already read ${m.sampleBeforeOnset.rateUGyPerHour} µGy/h at ${m.sampleBeforeOnset.time} UTC (baseline ≈${m.baselineRateUGyPerHour}) and passed 10 µGy/h at ${m.onsetTime} UTC; RAD samples about every 17 minutes.`,
      sourceId: 'donki',
      sourceLabel: 'NASA CCMC DONKI — WSA-ENLIL model runs',
      url: cme.link,
      provenance: DONKI_PROVENANCE,
    },
    {
      id: 'real-martians-water-shelter',
      kind: 'design-guidance',
      location: 'Mission design',
      heading: 'Water can be a wall',
      body: 'NASA has suggested storing the crew’s water around a shelter room to make a radiation storm shelter. The crew can use that water later and replace it with recycled water.',
      detail: 'NASA “Real Martians”: water “could be stored strategically to create a kind of radiation storm shelter”; the crew “would need to use the water and then replace it with recycled water”; also “ensuring that astronauts can quickly return indoors in the event of a radiation storm.”',
      sourceId: 'nasa-real-martians-2015',
      sourceLabel: 'NASA — Real Martians: How to Protect Astronauts from Space Radiation on Mars',
      url: NASA_SOURCES['nasa-real-martians-2015'].documentationUrl,
      provenance: publicationProvenance('nasa-real-martians-2015'),
    },
    {
      id: 'jpl-signal-delay',
      kind: 'nasa-statement',
      location: 'Earth–Mars radio link',
      heading: 'Messages from Earth take time',
      body: 'A radio message between Earth and Mars takes between 4 and 20 minutes to arrive, one way. A Mars crew cannot wait for Earth to make every decision.',
      detail: 'NASA/JPL (14 June 2019): “it can take anywhere from 4 to 20 minutes for a one-way signal to travel between planets.”',
      sourceId: 'jpl-atomic-clock-2019',
      sourceLabel: 'NASA/JPL — How an Atomic Clock Will Get Humans to Mars on Time',
      url: NASA_SOURCES['jpl-atomic-clock-2019'].documentationUrl,
      provenance: publicationProvenance('jpl-atomic-clock-2019'),
    },
    {
      id: 'eda-iss-cabin-co2',
      kind: 'measurement',
      location: 'International Space Station',
      heading: 'Crowded air needs cleaning',
      body: `On the Space Station, the cabin air usually holds a few thousand parts per million of carbon dioxide. Machines must keep cleaning it — and a small, crowded shelter fills up faster.`,
      detail: `NASA OSDR EDA: median ISS cabin CO₂ during ${co2.missions.length} mission windows ranged ${fmt(co2.min)}–${fmt(co2.max)} ppm (missions with data-quality flags excluded). ISS values, not Mars.`,
      sourceId: 'eda',
      sourceLabel: 'NASA OSDR Environmental Data App (ISS telemetry)',
      url: NASA_SOURCES.eda.documentationUrl,
      provenance: EDA_ENVIRONMENT_PROVENANCE,
    },
    {
      id: 'osdr-veg04-light',
      kind: 'measurement',
      location: 'International Space Station',
      heading: 'Space gardens need the right light',
      body: 'Astronauts on the Space Station grew a leafy green called mizuna in the Veggie garden and tested different light colors to see how the plants grew.',
      detail: `${RECOMMENDED_CROP_STUDY.accession} (${RECOMMENDED_CROP_STUDY.projectIdentifier}): ${RECOMMENDED_CROP_STUDY.title}. Organism ${RECOMMENDED_CROP_STUDY.organism}; missions ${RECOMMENDED_CROP_STUDY.missions.join(', ')}; study factors include ${RECOMMENDED_CROP_STUDY.studyFactors.join(', ')}.`,
      sourceId: 'osdr-biodata',
      sourceLabel: `NASA OSDR ${RECOMMENDED_CROP_STUDY.accession}`,
      url: RECOMMENDED_CROP_STUDY.repositoryUrl,
      provenance: OSDR_STUDIES_PROVENANCE,
    },
  ];
}

function buildReplay(): SolarStormReplay {
  const predicted = [...new Set(REPLAY_CME.predictedImpacts.map((p) => p.location))];
  return {
    id: 'mars-2024-05-20',
    label: 'Real event replay — 20 May 2024',
    isHistoricalReplay: true,
    eventDateUtc: '2024-05-20',
    cme: REPLAY_CME,
    cmeScoreType: scoreCmeType(REPLAY_CME.speedKmS),
    launchedFromFarSideOfSun: isFarSideFromEarth(REPLAY_CME),
    modelPredictedLocations: predicted,
    donkiAlert: DONKI_REPLAY_ALERT_2024_05_20,
    marsRad: { metrics: MARS_RAD_2024_METRICS, hourly: MARS_RAD_2024_HOURLY },
    evidence: buildEvidence(MARS_RAD_2024_METRICS, REPLAY_CME, predicted),
    provenance: [DONKI_PROVENANCE, MARS_RAD_2024_PROVENANCE, EDA_ENVIRONMENT_PROVENANCE, OSDR_STUDIES_PROVENANCE],
  };
}

export const SOLAR_STORM_REPLAY_2024: SolarStormReplay = buildReplay();
