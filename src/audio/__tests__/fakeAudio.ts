/**
 * Minimal Web Audio fake for unit tests (Node has no AudioContext). Records
 * every node, start/stop and disconnect so tests can assert lifecycle
 * guarantees. It does not render sound: real playback is checked in the browser.
 */
export class FakeParam {
  value: number;
  events: string[] = [];
  constructor(value = 1) {
    this.value = value;
  }
  setValueAtTime(v: number) {
    this.value = v;
    this.events.push(`set:${v}`);
    return this;
  }
  setTargetAtTime(v: number) {
    this.value = v;
    this.events.push(`target:${v}`);
    return this;
  }
  exponentialRampToValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  linearRampToValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  cancelScheduledValues() {
    this.events.push('cancel');
    return this;
  }
}

export class FakeNode {
  kind: string;
  connectedTo: unknown[] = [];
  disconnected = false;
  constructor(kind: string) {
    this.kind = kind;
  }
  connect<T>(dest: T): T {
    this.connectedTo.push(dest);
    return dest;
  }
  disconnect() {
    this.disconnected = true;
  }
}

export class FakeGain extends FakeNode {
  gain = new FakeParam(1);
  constructor() {
    super('gain');
  }
}

export class FakeFilter extends FakeNode {
  type = 'lowpass';
  frequency = new FakeParam(350);
  Q = new FakeParam(1);
  constructor() {
    super('filter');
  }
}

export class FakeSource extends FakeNode {
  started = false;
  /** stop() called with no time: cut off right now (mute / stopAll). */
  stoppedNow = false;
  /** stop(when) scheduled for later (normal end of a sound / fade-out). */
  stopAt: number | null = null;
  loop = false;
  buffer: unknown = null;
  type = 'sine';
  frequency = new FakeParam(440);
  onended: (() => void) | null = null;
  start() {
    this.started = true;
  }
  stop(when?: number) {
    if (when === undefined) this.stoppedNow = true;
    else this.stopAt = when;
  }
  /** Simulate the browser firing `ended`. */
  end() {
    this.onended?.();
  }
}

export class FakeBuffer {
  duration: number;
  sampleRate: number;
  length: number;
  private data: Float32Array;
  constructor(length: number, sampleRate: number) {
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.data = new Float32Array(length);
  }
  getChannelData() {
    return this.data;
  }
}

export interface FakeContextControls {
  instances: FakeAudioContext[];
  /** State a new context starts in (browsers start 'suspended' before a gesture). */
  initialState: AudioContextState;
}

export function createFakeAudio(): { Ctor: new () => AudioContext; controls: FakeContextControls } {
  const controls: FakeContextControls = { instances: [], initialState: 'suspended' };
  class Ctx extends FakeAudioContext {
    constructor() {
      super(controls.initialState);
      controls.instances.push(this);
    }
  }
  return { Ctor: Ctx as unknown as new () => AudioContext, controls };
}

export class FakeAudioContext {
  state: AudioContextState;
  currentTime = 0;
  sampleRate = 8000;
  destination = new FakeNode('destination');
  onstatechange: (() => void) | null = null;
  nodes: FakeNode[] = [];
  closed = false;

  constructor(state: AudioContextState) {
    this.state = state;
  }
  private track<T extends FakeNode>(n: T): T {
    this.nodes.push(n);
    return n;
  }
  createGain() {
    return this.track(new FakeGain());
  }
  createOscillator() {
    return this.track(new FakeSource('oscillator'));
  }
  createBufferSource() {
    return this.track(new FakeSource('buffer-source'));
  }
  createBiquadFilter() {
    return this.track(new FakeFilter());
  }
  createBuffer(_channels: number, length: number, sampleRate: number) {
    return new FakeBuffer(length, sampleRate);
  }
  resume() {
    this.state = 'running';
    this.onstatechange?.();
    return Promise.resolve();
  }
  suspend() {
    this.state = 'suspended';
    this.onstatechange?.();
    return Promise.resolve();
  }
  close() {
    this.closed = true;
    this.state = 'closed';
    return Promise.resolve();
  }
  /** Accepts buffers starting with "RIFF"; rejects anything else (unsupported/corrupt format). */
  decodeAudioData(data: ArrayBuffer, ok?: (b: AudioBuffer) => void, fail?: (e: unknown) => void) {
    const head = new TextDecoder().decode(new Uint8Array(data).slice(0, 4));
    if (head === 'RIFF') {
      const buffer = new FakeBuffer(8 * 16000, 16000) as unknown as AudioBuffer;
      ok?.(buffer);
      return Promise.resolve(buffer);
    }
    const err = new Error('EncodingError: Unable to decode audio data');
    fail?.(err);
    return Promise.reject(err);
  }
  sources(): FakeSource[] {
    return this.nodes.filter((n): n is FakeSource => n instanceof FakeSource);
  }
}

export class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

export const RIFF_BYTES = new TextEncoder().encode('RIFF....WAVEfake').buffer as ArrayBuffer;

/** Let pending promise callbacks run (microtasks only, so it works with fake timers). */
export async function flush(rounds = 12): Promise<void> {
  for (let i = 0; i < rounds; i += 1) await Promise.resolve();
}
