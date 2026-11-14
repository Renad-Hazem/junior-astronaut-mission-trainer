/**
 * Composes DONKI flares + CMEs + SEPs into a SolarStormContext, and exposes the single
 * loader Bonus Mission 05 needs. Contract:
 *   - `replay` (real 20 May 2024 event) is ALWAYS present and labelled as historical.
 *   - `today` is live DONKI context, or `unavailable` with a typed error. It is never
 *     back-filled with old data presented as current.
 *   - Neither value is mapped onto the game’s 0–100 resource bars.
 */
import { getCmes, getSeps, getSolarFlares, recentDonkiWindow, type DonkiWindow } from './donkiClient.ts';
import { classifySolarActivity } from './normalizers.ts';
import { SOLAR_STORM_REPLAY_2024, type SolarStormReplay } from '../../data/nasa/solarStormWatchSnapshot.ts';
import type {
  ClientOptions,
  CmeEvent,
  DataMode,
  DataProvenance,
  NasaError,
  SepEvent,
  SolarFlareEvent,
  SolarStormContext,
} from './types.ts';

export function buildSolarStormContext(input: {
  window: DonkiWindow;
  mode: DataMode;
  flares: SolarFlareEvent[];
  cmes: CmeEvent[];
  seps: SepEvent[];
  provenance: DataProvenance[];
}): SolarStormContext {
  const { tier, reasons } = classifySolarActivity(input);
  const strongestFlare = input.flares.reduce<SolarFlareEvent | null>(
    (best, f) => ((f.peakFluxWm2 ?? -1) > (best?.peakFluxWm2 ?? -1) ? f : best),
    null,
  );
  const fastestCme = input.cmes.reduce<CmeEvent | null>(
    (best, c) => ((c.speedKmS ?? -1) > (best?.speedKmS ?? -1) ? c : best),
    null,
  );
  const marsPredictions = input.cmes.flatMap((c) =>
    c.predictedImpacts.filter((p) => p.location === 'Mars').map((impact) => ({ cmeId: c.id, impact })),
  );
  return {
    mode: input.mode,
    windowStart: input.window.startDate,
    windowEnd: input.window.endDate,
    tier,
    tierReasons: reasons,
    flareCount: input.flares.length,
    strongestFlare,
    fastestCme,
    sepCount: input.seps.filter((s) => !s.isModelForecast).length,
    marsPredictions,
    provenance: input.provenance,
  };
}

export type SolarContextResult = { ok: true; context: SolarStormContext } | { ok: false; error: NasaError };

/** Fetch FLR, CME and SEP for one window in parallel. All three must succeed (no partial "live" context). */
export async function fetchSolarStormContext(window: DonkiWindow, opts: ClientOptions = {}): Promise<SolarContextResult> {
  const [flr, cme, sep] = await Promise.all([getSolarFlares(window, {}, opts), getCmes(window, {}, opts), getSeps(window, opts)]);
  if (!flr.ok) return { ok: false, error: flr.error };
  if (!cme.ok) return { ok: false, error: cme.error };
  if (!sep.ok) return { ok: false, error: sep.error };
  return {
    ok: true,
    context: buildSolarStormContext({
      window,
      mode: 'live',
      flares: flr.data.items,
      cmes: cme.data.items,
      seps: sep.data.items,
      provenance: [flr.provenance, cme.provenance, sep.provenance],
    }),
  };
}

export interface SolarStormWatchData {
  /** Always available, always historical. */
  replay: SolarStormReplay;
  today: { status: 'live'; context: SolarStormContext } | { status: 'unavailable'; error: NasaError };
}

/**
 * The one call Bonus Mission 05 should make. Never rejects; worst case returns the replay plus
 * `today.status === 'unavailable'` (UI: “Live Sun data is unavailable right now”).
 */
export async function loadSolarStormWatchData(opts: ClientOptions & { days?: number } = {}): Promise<SolarStormWatchData> {
  const window = recentDonkiWindow(opts.days ?? 30, opts.now?.() ?? new Date());
  const res = await fetchSolarStormContext(window, opts);
  return {
    replay: SOLAR_STORM_REPLAY_2024,
    today: res.ok ? { status: 'live', context: res.context } : { status: 'unavailable', error: res.error },
  };
}
