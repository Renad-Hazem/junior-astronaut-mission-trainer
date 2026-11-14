import { assert, assertEqual, test } from './harness.ts';
import { BONUS_05_REUSED_FACT_IDS, BONUS_05_SCIENCE_FACTS, BONUS_MISSION_05, previewFor } from '../../../data/nasa/bonusMission05.ts';
import { SOLAR_STORM_REPLAY_2024 } from '../../../data/nasa/solarStormWatchSnapshot.ts';
import { SCIENCE_FACTS } from '../../../science/scienceFacts.ts';
import type { ResourceKey, Resources } from '../../../game/types.ts';

const KEYS: ResourceKey[] = ['oxygen', 'water', 'food', 'energy', 'radiationProtection', 'temperature'];
/** Mirrors HOTSPOTS in src/scene/sceneConfig.ts (not importable under Node: extensionless imports). */
const SCENE_HOTSPOTS = ['habitat', 'solar', 'oxygen', 'water', 'greenhouse', 'communications', 'rover'];
const SCENE_STATUSES = ['normal', 'dust', 'oxygen_alert', 'radiation_alert', 'restored'];
const EXISTING_LEVEL_IDS = ['level-1-first-day', 'level-2-power-crisis', 'level-3-oxygen-emergency', 'level-4-survival-challenge'];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
function apply(r: Resources, ...deltas: (Partial<Record<ResourceKey, number>> | undefined)[]): Resources {
  const next = { ...r };
  for (const k of KEYS) next[k] = clamp(r[k] + deltas.reduce((s, d) => s + (d?.[k] ?? 0), 0));
  return next;
}

test('Mission is optional, separate from Levels 1–4, with 3–5 decisions', () => {
  const m = BONUS_MISSION_05;
  assertEqual(m.isOptional, true);
  assert(!EXISTING_LEVEL_IDS.includes(m.id), 'unique id');
  assert(m.events.length >= 3 && m.events.length <= 5, `events: ${m.events.length}`);
  assert(/not an official/i.test(m.scoring.disclaimer), 'score disclaimer');
});

test('Reuses existing resources, hotspots and scene statuses only', () => {
  const m = BONUS_MISSION_05;
  for (const k of Object.keys(m.initialResources)) assert(KEYS.includes(k as ResourceKey), `resource ${k}`);
  for (const h of m.hotspotsUsed) assert(SCENE_HOTSPOTS.includes(h), `hotspot ${h}`);
  for (const e of m.events) {
    assert(SCENE_STATUSES.includes(e.sceneStatus), `${e.id} status`);
    if (e.highlightModule) assert(m.hotspotsUsed.includes(e.highlightModule), `${e.id} hotspot listed`);
    for (const k of Object.keys(e.openingEffects ?? {})) assert(KEYS.includes(k as ResourceKey), `${e.id} opening ${k}`);
  }
});

test('Every choice is a real trade-off with a matching preview and one optimal hint per event', () => {
  const ids = new Set<string>();
  for (const e of BONUS_MISSION_05.events) {
    assert(e.choices.length >= 2, `${e.id} choices`);
    assertEqual(e.choices.filter((c) => c.isOptimalHint).length, 1, `${e.id} optimal hints`);
    for (const c of e.choices) {
      assert(!ids.has(c.id), `duplicate ${c.id}`);
      ids.add(c.id);
      const vals = Object.values(c.effects) as number[];
      assert(vals.some((v) => v > 0), `${c.id} has a gain`);
      assert(vals.some((v) => v < 0), `${c.id} has a cost (no free choice)`);
      for (const k of Object.keys(c.effects)) assert(KEYS.includes(k as ResourceKey), `${c.id} key ${k}`);
      assertEqual(c.preview, previewFor(c.effects), `${c.id} preview`);
      assert(c.label.trim() && c.consequence.trim(), `${c.id} text`);
    }
  }
});

test('All science fact IDs resolve; new facts do not overwrite existing ones', () => {
  for (const id of BONUS_05_REUSED_FACT_IDS) assert(SCIENCE_FACTS[id], `existing fact ${id}`);
  for (const id of Object.keys(BONUS_05_SCIENCE_FACTS)) assert(!SCIENCE_FACTS[id], `${id} must be new`);
  const all = { ...SCIENCE_FACTS, ...BONUS_05_SCIENCE_FACTS };
  const used = [...BONUS_MISSION_05.briefScienceFactIds, ...BONUS_MISSION_05.events.flatMap((e) => e.choices.flatMap((c) => c.scienceFactIds))];
  for (const id of used) assert(all[id], `fact ${id} resolves`);
  for (const f of Object.values(BONUS_05_SCIENCE_FACTS)) assert(/^https:\/\//.test(f.url), `${f.id} url`);
});

test('Evidence card references exist in the replay snapshot', () => {
  const cards = new Set(SOLAR_STORM_REPLAY_2024.evidence.map((c) => c.id));
  for (const [eventId, list] of Object.entries(BONUS_MISSION_05.eventEvidence)) {
    assert(BONUS_MISSION_05.events.some((e) => e.id === eventId), `event ${eventId}`);
    for (const id of list) assert(cards.has(id), `card ${id}`);
  }
});

test('Balance: all 3^n paths stay above 0; optimal path ends healthy; some path ends below 30', () => {
  const events = BONUS_MISSION_05.events;
  let paths = 0;
  let globalMin = 100;
  let anyBelow30 = false;
  const walk = (i: number, r: Resources) => {
    if (i === events.length) {
      paths += 1;
      const min = Math.min(...KEYS.map((k) => r[k]));
      globalMin = Math.min(globalMin, min);
      if (min < 30) anyBelow30 = true;
      return;
    }
    for (const c of events[i].choices) walk(i + 1, apply(r, events[i].openingEffects, c.effects));
  };
  walk(0, BONUS_MISSION_05.initialResources);
  assertEqual(paths, events.reduce((n, e) => n * e.choices.length, 1), 'paths enumerated');
  assert(globalMin > 0, `no path exhausts a resource (min ${globalMin})`);
  assert(anyBelow30, 'poor choices have visible consequences');

  let r = BONUS_MISSION_05.initialResources;
  for (const e of events) r = apply(r, e.openingEffects, e.choices.find((c) => c.isOptimalHint)?.effects);
  for (const k of KEYS) assert(r[k] >= 60, `optimal path ${k}=${r[k]} healthy`);
});
