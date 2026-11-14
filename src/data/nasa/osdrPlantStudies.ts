/**
 * Curated OSDR study cards for space-crop context. Metadata comes from the OSDR Biological
 * Data API (captured snapshot); `educationalUse` and `caveats` are editorial and say how each
 * study may — and may not — be presented to players aged 7–12.
 */
import { OSDR_STUDIES_CAPTURED_AT, OSDR_STUDY_METADATA } from './generated/osdrStudies.generated.ts';
import { summarizeBiodataDataset } from '../../integrations/nasa/normalizers.ts';
import { provenanceBase } from '../../integrations/nasa/sourceRegistry.ts';
import type { DataProvenance, OsdrStudySummary } from '../../integrations/nasa/types.ts';

export const OSDR_STUDIES_PROVENANCE: DataProvenance = {
  ...provenanceBase('osdr-biodata'),
  mode: 'snapshot',
  sourceUrl: 'https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/',
  retrievedAt: OSDR_STUDIES_CAPTURED_AT,
};

export const OSDR_PLANT_STUDIES: Readonly<Record<'OSD-655' | 'OSD-773' | 'OSD-476', OsdrStudySummary>> = {
  'OSD-655': summarizeBiodataDataset('OSD-655', OSDR_STUDY_METADATA['OSD-655'], {
    educationalUse:
      'Recommended. VEG-04 grew mizuna (a leafy green) in the Veggie unit on the ISS and tested different light colors; the crop was also checked for nutrition. Supports the greenhouse-lighting trade-off.',
    caveats: [
      'ISS (low Earth orbit) experiment — not grown on Mars.',
      'Do not invent yield or nutrient numbers; cite the study page if a number is shown.',
    ],
  }),
  'OSD-773': summarizeBiodataDataset('OSD-773', OSDR_STUDY_METADATA['OSD-773'], {
    educationalUse:
      'Context only. XROOTS demonstrated soil-free (hydroponic/aeroponic) root systems on the ISS.',
    caveats: [
      'OSDR records the organism for this dataset as "Microbiota": the deposited data is microbial profiling, not crop growth. Do not use its data in gameplay.',
    ],
  }),
  'OSD-476': summarizeBiodataDataset('OSD-476', OSDR_STUDY_METADATA['OSD-476'], {
    educationalUse:
      'Optional Moon-soil fact: Arabidopsis plants grew in Apollo lunar regolith but showed stress-related gene activity.',
    caveats: [
      'Ground laboratory study (no flight program) using Moon samples — not Mars and not spaceflight.',
      'Cite the published finding only; do not pull its RNA-seq / gene-expression data into the game.',
    ],
  }),
};

/** The one study recommended for Bonus Mission 05 (greenhouse decision). */
export const RECOMMENDED_CROP_STUDY: OsdrStudySummary = OSDR_PLANT_STUDIES['OSD-655'];
