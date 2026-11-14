import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from '../audioManager';
import { AUDIO_SETTINGS_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS } from '../settings';
import {
  createFakeAudio,
  flush,
  FakeAudioContext,
  FakeGain,
  FakeSource,
  MemoryStorage,
  RIFF_BYTES,
  type FakeContextControls,
} from './fakeAudio';

let controls: FakeContextControls;
let Ctor: new () => AudioContext;
let clock = 0;
let managers: AudioManager[] = [];

function makeManager(overrides: Partial<ConstructorParameters<typeof AudioManager>[0]> = {}) {
  const m = new AudioManager({
    getContextCtor: () => Ctor,
    storage: new MemoryStorage(),
    loadArrayBuffer: vi.fn(async () => RIFF_BYTES),
    windUrl: '/audio/ambience/test.wav',
    now: () => clock,
    ...overrides,
  });
  managers.push(m);
  return m;
}

const ctxOf = () => controls.instances[controls.instances.length - 1] as unknown as FakeAudioContext;
/** Sources created by `fn` (one sound's voice). */
function sourcesFrom(fn: () => void) {
  const before = ctxOf().nodes.length;
  fn();
  return ctxOf().nodes.slice(before).filter((n): n is FakeSource => n instanceof FakeSource);
}
/** Simulate the browser finishing every source. */
const finishAll = (sources: FakeSource[]) => sources.forEach((s) => s.end());
/** The first three gains created are master, ambient bus, sfx bus. */
const masterGain = () => ctxOf().nodes.filter((n) => n instanceof FakeGain)[0] as FakeGain;

async function unlocked(m: AudioManager) {
  m.unlock();
  await flush();
}

beforeEach(() => {
  vi.useFakeTimers();
  ({ Ctor, controls } = createFakeAudio());
  clock = 0;
  managers = [];
});

afterEach(() => {
  managers.forEach((m) => m.dispose());
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('autoplay safety', () => {
  it('creates no AudioContext and plays nothing before a user gesture', () => {
    const m = makeManager();
    m.setAmbience('calm');
    expect(m.play('decision-select')).toBe(false);
    expect(controls.instances).toHaveLength(0);
    expect(m.getSnapshot()).toMatchObject({ unlocked: false, contextState: 'none' });
    expect(m.getDebugStats().suppressedCounts['decision-select']).toBe(1);
  });

  it('first gesture creates one context, resumes it and plays the startup chime once', async () => {
    const m = makeManager();
    await unlocked(m);
    m.unlock();
    await flush();
    expect(controls.instances).toHaveLength(1);
    expect(m.getSnapshot()).toMatchObject({ unlocked: true, contextState: 'running' });
    expect(m.getDebugStats().playCounts['game-startup']).toBe(1);
  });

  it('is a silent no-op when the browser has no AudioContext', () => {
    const m = makeManager({ getContextCtor: () => null });
    expect(() => m.unlock()).not.toThrow();
    m.setAmbience('dust');
    expect(m.play('mission-complete')).toBe(false);
    expect(m.getSnapshot().supported).toBe(false);
  });
});

describe('duplicate prevention', () => {
  it('rapid repeated requests start one sound until the cooldown passes', async () => {
    const m = makeManager();
    await unlocked(m);
    let started = 0;
    const first = sourcesFrom(() => {
      for (let i = 0; i < 10; i += 1) if (m.play('decision-select')) started += 1;
    });
    expect(started).toBe(1);
    clock += 400; // past the 300 ms cooldown…
    expect(m.play('decision-select')).toBe(false); // …but the first voice is still sounding (cap 1)
    finishAll(first);
    expect(m.play('decision-select')).toBe(true);
    expect(m.getDebugStats().suppressedCounts['decision-select']).toBe(10);
  });

  it('caps simultaneous voices per sound', async () => {
    const m = makeManager();
    await unlocked(m);
    clock += 1_000; // leave the startup suppression window
    let started = 0;
    for (let i = 0; i < 6; i += 1) {
      if (m.play('menu-navigate')) started += 1;
      clock += 100; // past the 90 ms cooldown, but earlier voices are still playing
    }
    expect(started).toBe(2);
  });

  it('suppresses the menu tick right after the startup chime (first click)', async () => {
    const m = makeManager();
    await unlocked(m);
    expect(m.play('menu-navigate')).toBe(false);
    clock += 450;
    expect(m.play('menu-navigate')).toBe(true);
  });
});

describe('mute and volume', () => {
  it('muting silences immediately and stops every effect voice', async () => {
    const m = makeManager();
    await unlocked(m);
    const playing = sourcesFrom(() => {
      m.play('mission-complete');
      m.play('astrobot-message');
    });
    expect(m.getDebugStats().activeVoices).toBe(3); // + startup chime
    expect(playing.some((s) => s.stoppedNow)).toBe(false);
    m.setMuted(true);
    expect(masterGain().gain.value).toBe(0);
    expect(masterGain().gain.events.slice(-2)).toEqual(['cancel', 'set:0']);
    expect(m.getDebugStats().activeVoices).toBe(0);
    expect(playing.every((s) => s.stoppedNow)).toBe(true);
    expect(m.play('decision-select')).toBe(false);
    m.setMuted(false);
    expect(masterGain().gain.value).toBeCloseTo(DEFAULT_AUDIO_SETTINGS.master ** 2);
  });

  it('persists settings and restores them on reload; corrupt storage falls back to defaults', () => {
    const storage = new MemoryStorage();
    const a = makeManager({ storage });
    a.setVolume('master', 0.4);
    a.setVolume('sfx', 2); // clamped
    a.setMuted(true);
    expect(JSON.parse(storage.getItem(AUDIO_SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({ master: 0.4, sfx: 1, muted: true });
    const b = makeManager({ storage });
    expect(b.getSnapshot().settings).toMatchObject({ master: 0.4, sfx: 1, muted: true });
    storage.setItem(AUDIO_SETTINGS_STORAGE_KEY, '{not json');
    expect(makeManager({ storage }).getSnapshot().settings).toEqual(DEFAULT_AUDIO_SETTINGS);
  });

  it('keeps working when storage throws (private mode)', () => {
    const throwing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    const m = makeManager({ storage: throwing });
    expect(() => m.setVolume('ambient', 0.2)).not.toThrow();
    expect(m.getSnapshot().settings.ambient).toBe(0.2);
  });
});

describe('ambience', () => {
  it('lazy-loads the NASA wind only after unlock, once, and layers synthesized dust gusts', async () => {
    const loader = vi.fn(async () => RIFF_BYTES);
    const m = makeManager({ loadArrayBuffer: loader });
    m.setAmbience('calm');
    expect(loader).not.toHaveBeenCalled();
    await unlocked(m);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith('/audio/ambience/test.wav');
    expect(m.getSnapshot()).toMatchObject({ ambienceMode: 'calm', ambienceSource: 'nasa-recording' });
    const loopingBefore = ctxOf().sources().filter((s) => s.loop && s.started).length;
    m.setAmbience('dust');
    expect(ctxOf().sources().filter((s) => s.loop && s.started).length).toBe(loopingBefore + 1);
    m.setAmbience('off');
    m.setAmbience('calm');
    await flush();
    expect(loader).toHaveBeenCalledTimes(1); // cached
  });

  it('falls back to synthesized wind when the asset is missing (404)', async () => {
    const m = makeManager({ loadArrayBuffer: async () => { throw new Error('HTTP 404 for /audio/x.wav'); } });
    await unlocked(m);
    m.setAmbience('calm');
    await flush();
    expect(m.getSnapshot().ambienceSource).toBe('synthesized-fallback');
    expect(m.getDebugStats().assetError).toContain('404');
  });

  it('falls back to synthesized wind when the format cannot be decoded', async () => {
    const m = makeManager({ loadArrayBuffer: async () => new TextEncoder().encode('NOPE-not-audio').buffer as ArrayBuffer });
    await unlocked(m);
    m.setAmbience('dust');
    await flush();
    expect(m.getSnapshot().ambienceSource).toBe('synthesized-fallback');
    expect(m.getDebugStats().assetError).toMatch(/decode/i);
  });

  it('turning ambience off stops every ambience source; a late load does not restart it', async () => {
    let release: (b: ArrayBuffer) => void = () => {};
    const m = makeManager({ loadArrayBuffer: () => new Promise<ArrayBuffer>((r) => { release = r; }) });
    await unlocked(m);
    m.setAmbience('dust');
    m.setAmbience('off'); // leave gameplay before the file arrives
    release(RIFF_BYTES);
    await flush();
    expect(m.getSnapshot().ambienceSource).toBe('none');
    const looping = ctxOf().sources().filter((s) => s.loop);
    expect(looping.length).toBeGreaterThan(0); // the synthesized dust layer had started
    expect(looping.every((s) => s.stopAt !== null)).toBe(true); // all scheduled to stop after the fade
    expect(looping.some((s) => s.buffer && (s.buffer as { duration: number }).duration === 8)).toBe(false); // NASA loop never started
  });

  it('mute tears ambience down and unmute brings it back', async () => {
    const m = makeManager();
    await unlocked(m);
    m.setAmbience('calm');
    await flush();
    m.setMuted(true);
    expect(m.getSnapshot().ambienceSource).toBe('none');
    m.setMuted(false);
    await flush();
    expect(m.getSnapshot().ambienceSource).toBe('nasa-recording');
  });
});

describe('cleanup', () => {
  it('releases and disconnects voices when they end (no leaks)', async () => {
    const m = makeManager();
    await unlocked(m);
    m.stopAllSfx();
    const before = ctxOf().nodes.length;
    const voice = sourcesFrom(() => m.play('inspect-system'));
    expect(m.getDebugStats().activeVoices).toBe(1);
    finishAll(voice);
    expect(m.getDebugStats().activeVoices).toBe(0);
    expect(ctxOf().nodes.slice(before).every((n) => n.disconnected)).toBe(true);
  });

  it('releases voices even if `ended` never fires (suspended context)', async () => {
    const m = makeManager();
    await unlocked(m);
    m.play('stabilization');
    expect(m.getDebugStats().activeVoices).toBeGreaterThan(0);
    vi.advanceTimersByTime(5_000);
    expect(m.getDebugStats().activeVoices).toBe(0);
  });

  it('suspends when the tab is hidden and resumes when visible', async () => {
    const m = makeManager();
    await unlocked(m);
    m.handleVisibilityChange(true);
    await flush();
    expect(m.getSnapshot().contextState).toBe('suspended');
    expect(m.play('decision-select')).toBe(false);
    m.handleVisibilityChange(false);
    await flush();
    expect(m.getSnapshot().contextState).toBe('running');
  });
});
