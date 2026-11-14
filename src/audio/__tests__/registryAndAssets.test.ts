import { beforeAll, describe, expect, it } from 'vitest';
import { NASA_MARS_WIND, SOUND_REGISTRY } from '../soundRegistry';
import { renderSfx } from '../synth';
import type { SfxId, SoundId } from '../types';
import { FakeAudioContext, FakeNode } from './fakeAudio';

const ALL_IDS: SoundId[] = [
  'game-startup', 'ambience-calm', 'ambience-dust', 'proximity-scanner', 'inspect-system', 'decision-select',
  'resource-warning', 'mission-complete', 'stabilization', 'brief-open', 'astrobot-message', 'menu-navigate', 'footstep',
];
const SFX_IDS = ALL_IDS.filter((id): id is SfxId => SOUND_REGISTRY[id].category === 'sfx');

// The app tsconfig has no Node types (it targets the browser), so load fs without
// a literal specifier and resolve paths from this file's URL.
interface NodeFs {
  readFileSync(path: URL): Uint8Array;
  readFileSync(path: URL, encoding: 'utf8'): string;
}
const loadFs = () => import(/* @vite-ignore */ `node:${'fs'}`) as Promise<NodeFs>;
const fromRoot = (path: string) => new URL(`../../../${path}`, import.meta.url);

describe('sound registry', () => {
  it('covers every event in the audio brief with sane limits', () => {
    expect(Object.keys(SOUND_REGISTRY).sort()).toEqual([...ALL_IDS].sort());
    for (const def of Object.values(SOUND_REGISTRY)) {
      expect(def.maxVoices).toBeGreaterThanOrEqual(1);
      expect(def.gain).toBeGreaterThan(0);
      expect(def.gain).toBeLessThanOrEqual(1);
    }
  });

  it('only the ambience claims NASA provenance; every effect is labelled synthesized', () => {
    for (const id of SFX_IDS) expect(SOUND_REGISTRY[id].provenance).toBe('original-synthesized');
    expect(SOUND_REGISTRY['ambience-calm'].provenance).toBe('nasa-recording-edited');
    expect(SOUND_REGISTRY['ambience-dust'].provenance).toBe('nasa-recording-with-synthesized-layer');
  });

  it('every effect renders short, quiet, schedulable voices', () => {
    for (const id of SFX_IDS) {
      const ctx = new FakeAudioContext('running');
      const out = new FakeNode('out') as unknown as AudioNode;
      const voice = renderSfx(id, ctx as unknown as BaseAudioContext, out, 1);
      expect(voice.sources.length, id).toBeGreaterThan(0);
      expect(voice.endTime - 1, id).toBeGreaterThan(0);
      expect(voice.endTime - 1, `${id} is short`).toBeLessThan(2);
    }
  });
});

describe('bundled NASA asset', () => {
  let fs: NodeFs;
  let file: Uint8Array;
  let view: DataView;
  const ascii = (from: number, to: number) => String.fromCharCode(...file.slice(from, to));

  beforeAll(async () => {
    fs = await loadFs();
    file = fs.readFileSync(fromRoot(`public/${NASA_MARS_WIND.path}`));
    view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  });

  it('is a real 16-bit PCM mono WAV, 8 s, small enough to lazy-load', () => {
    expect(ascii(0, 4)).toBe('RIFF');
    expect(ascii(8, 12)).toBe('WAVE');
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true) / (16000 * 2)).toBeCloseTo(8, 2);
    expect(file.length).toBeLessThan(300_000);
  });

  it('loops without a click at the seam', () => {
    const n = (file.length - 44) / 2;
    const s = (i: number) => view.getInt16(44 + i * 2, true);
    let total = 0;
    for (let i = 1; i < n; i += 1) total += Math.abs(s(i) - s(i - 1));
    expect(Math.abs(s(0) - s(n - 1))).toBeLessThan((total / (n - 1)) * 3);
  });

  it('is documented in public/audio/ATTRIBUTION.md with its credit and source URL', () => {
    const doc = fs.readFileSync(fromRoot('public/audio/ATTRIBUTION.md'), 'utf8');
    expect(doc).toContain(NASA_MARS_WIND.credit);
    expect(doc).toContain('45704_1st_Sounds_from_Mars_filters_out_rover_self-noise.wav');
    for (const id of SFX_IDS) expect(doc).toContain(`\`${id}\``);
  });
});
