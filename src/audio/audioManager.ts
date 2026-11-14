/**
 * Centralized game audio (Web Audio API, no dependencies).
 *
 * Guarantees:
 * - No AudioContext exists until `unlock()` runs inside a user gesture, so
 *   nothing can autoplay.
 * - Mute sets the master gain to 0 immediately and stops every effect voice.
 * - Per-sound cooldowns and voice caps stop rapid clicks from stacking sounds.
 * - Every voice and ambience node is stopped and disconnected when it ends or
 *   is torn down, so nothing leaks across screens.
 * - It only plays sounds. It never reads or writes game resources or decisions.
 */
import { createSynthWind, renderSfx, type AmbienceLayer, type RenderedVoice } from './synth';
import { MAX_TOTAL_SFX_VOICES, NASA_MARS_WIND, SOUND_REGISTRY } from './soundRegistry';
import { DEFAULT_AUDIO_SETTINGS, getBrowserStorage, loadAudioSettings, saveAudioSettings, type SettingsStorage } from './settings';
import type {
  AmbienceMode,
  AmbienceSource,
  AudioDebugStats,
  AudioSettings,
  AudioSnapshot,
  SfxId,
  SoundId,
  VolumeChannel,
} from './types';

type ContextCtor = new () => AudioContext;

export interface AudioManagerDeps {
  /** Returns the AudioContext constructor, or null when unsupported. */
  getContextCtor?: () => ContextCtor | null;
  storage?: SettingsStorage | null;
  loadArrayBuffer?: (url: string) => Promise<ArrayBuffer>;
  windUrl?: string;
  /** Milliseconds clock used for cooldowns. */
  now?: () => number;
}

interface Voice {
  id: SfxId;
  rendered: RenderedVoice;
  out: GainNode;
  safetyTimer: ReturnType<typeof setTimeout> | null;
}

interface AmbienceGraph {
  token: number;
  bus: GainNode;
  base: AmbienceLayer | null;
  dust: AmbienceLayer | null;
}

function defaultContextCtor(): ContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: ContextCtor; webkitAudioContext?: ContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

async function defaultLoadArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.arrayBuffer();
}

function defaultWindUrl(): string {
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
  return `${base.endsWith('/') ? base : `${base}/`}${NASA_MARS_WIND.path}`;
}

/** Works with both promise-based and legacy callback-only decodeAudioData (older Safari). */
function decode(ctx: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise<AudioBuffer>((resolve, reject) => {
    const maybe = ctx.decodeAudioData(data, resolve, reject) as Promise<AudioBuffer> | undefined;
    if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject);
  });
}

/** Slider position → gain. Squared so the sliders feel even to the ear. */
export const perceptualGain = (value: number): number => value * value;

function safely(fn: () => void): void {
  try {
    fn();
  } catch {
    /* node already stopped/disconnected */
  }
}

export class AudioManager {
  private readonly ctxCtor: ContextCtor | null;
  private readonly storage: SettingsStorage | null;
  private readonly loadArrayBuffer: (url: string) => Promise<ArrayBuffer>;
  private readonly windUrl: string;
  private readonly now: () => number;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private supported: boolean;
  private unlocked = false;
  private resuming = false;
  private settings: AudioSettings;

  private readonly voices = new Set<Voice>();
  private readonly lastStart = new Map<SoundId, number>();
  private readonly playCounts: Partial<Record<SoundId, number>> = {};
  private readonly suppressedCounts: Partial<Record<SoundId, number>> = {};

  private desiredAmbience: AmbienceMode = 'off';
  private ambience: AmbienceGraph | null = null;
  private ambienceSource: AmbienceSource = 'none';
  private ambienceToken = 0;
  private windPromise: Promise<AudioBuffer | null> | null = null;
  private assetError: string | null = null;

  private readonly listeners = new Set<() => void>();
  private snapshot: AudioSnapshot;

  constructor(deps: AudioManagerDeps = {}) {
    this.ctxCtor = (deps.getContextCtor ?? defaultContextCtor)();
    this.supported = this.ctxCtor !== null;
    this.storage = deps.storage !== undefined ? deps.storage : getBrowserStorage();
    this.loadArrayBuffer = deps.loadArrayBuffer ?? defaultLoadArrayBuffer;
    this.windUrl = deps.windUrl ?? defaultWindUrl();
    this.now = deps.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.settings = loadAudioSettings(this.storage);
    this.snapshot = this.buildSnapshot();
  }

  // -------------------------------------------------------------------------
  // External store (useSyncExternalStore)
  // -------------------------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): AudioSnapshot => this.snapshot;

  getDebugStats(): AudioDebugStats {
    return {
      activeVoices: this.voices.size,
      playCounts: { ...this.playCounts },
      suppressedCounts: { ...this.suppressedCounts },
      assetError: this.assetError,
    };
  }

  private buildSnapshot(): AudioSnapshot {
    return {
      supported: this.supported,
      unlocked: this.unlocked,
      contextState: this.ctx ? (this.ctx.state as AudioSnapshot['contextState']) : 'none',
      settings: { ...this.settings },
      ambienceMode: this.desiredAmbience,
      ambienceSource: this.ambienceSource,
    };
  }

  private emit(): void {
    const next = this.buildSnapshot();
    const prev = this.snapshot;
    const changed =
      prev.supported !== next.supported ||
      prev.unlocked !== next.unlocked ||
      prev.contextState !== next.contextState ||
      prev.ambienceMode !== next.ambienceMode ||
      prev.ambienceSource !== next.ambienceSource ||
      prev.settings.muted !== next.settings.muted ||
      prev.settings.master !== next.settings.master ||
      prev.settings.ambient !== next.settings.ambient ||
      prev.settings.sfx !== next.settings.sfx;
    if (!changed) return;
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Call from a user-gesture handler. Creates the context on first call and
   * resumes it when suspended/interrupted. Safe to call repeatedly.
   */
  unlock(): void {
    if (!this.supported || !this.ctxCtor) return;
    if (!this.ctx) {
      try {
        this.ctx = new this.ctxCtor();
      } catch {
        this.supported = false;
        this.emit();
        return;
      }
      this.buildGraph(this.ctx);
      this.ctx.onstatechange = () => this.emit();
    }
    const ctx = this.ctx;
    if (ctx.state === 'running') {
      this.markUnlocked();
      return;
    }
    if (this.resuming) return;
    this.resuming = true;
    ctx.resume().then(
      () => {
        this.resuming = false;
        if (ctx.state === 'running') this.markUnlocked();
        else this.emit();
      },
      () => {
        this.resuming = false;
        this.emit();
      },
    );
  }

  private markUnlocked(): void {
    const first = !this.unlocked;
    this.unlocked = true;
    if (first) this.play('game-startup');
    this.applyAmbience();
    this.emit();
  }

  private buildGraph(ctx: AudioContext): void {
    this.master = ctx.createGain();
    this.ambientBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.ambientBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(ctx.destination);
    this.applyGains(true);
  }

  /** Pause rendering while the tab is hidden; resume when visible again (if the browser allows). */
  handleVisibilityChange(hidden: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.unlocked) return;
    const op = hidden ? ctx.suspend() : ctx.resume();
    op.then(
      () => this.emit(),
      () => this.emit(),
    );
  }

  /** Full teardown (tests, hot reload). The manager can be unlocked again afterwards. */
  dispose(): void {
    this.stopAllSfx();
    this.desiredAmbience = 'off';
    this.teardownAmbience();
    const ctx = this.ctx;
    this.ctx = null;
    this.master = this.ambientBus = this.sfxBus = null;
    this.unlocked = false;
    this.windPromise = null;
    if (ctx) ctx.close().catch(() => undefined);
    this.emit();
  }

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  setMuted(muted: boolean): void {
    if (this.settings.muted === muted) return;
    this.settings = { ...this.settings, muted };
    saveAudioSettings(this.storage, this.settings);
    this.applyGains(true);
    if (muted) this.stopAllSfx();
    this.applyAmbience();
    this.emit();
  }

  setVolume(channel: VolumeChannel, value: number): void {
    const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : DEFAULT_AUDIO_SETTINGS[channel];
    if (this.settings[channel] === v) return;
    this.settings = { ...this.settings, [channel]: v };
    saveAudioSettings(this.storage, this.settings);
    this.applyGains(false);
    this.emit();
  }

  private applyGains(immediate: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.ambientBus || !this.sfxBus) return;
    const t = ctx.currentTime;
    const set = (param: AudioParam, value: number) => {
      param.cancelScheduledValues(t);
      if (immediate) param.setValueAtTime(value, t);
      else param.setTargetAtTime(value, t, 0.02);
    };
    set(this.master.gain, this.settings.muted ? 0 : perceptualGain(this.settings.master));
    set(this.ambientBus.gain, perceptualGain(this.settings.ambient));
    set(this.sfxBus.gain, perceptualGain(this.settings.sfx));
  }

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  /**
   * Play a one-shot effect. Returns false (and plays nothing) when audio is
   * locked, muted, unsupported, suspended, cooling down or at its voice cap.
   */
  play(id: SfxId, opts: { delay?: number; variant?: number } = {}): boolean {
    const def = SOUND_REGISTRY[id];
    const ctx = this.ctx;
    const refuse = () => {
      this.suppressedCounts[id] = (this.suppressedCounts[id] ?? 0) + 1;
      return false;
    };
    if (!ctx || !this.sfxBus || !this.unlocked || this.settings.muted || ctx.state !== 'running') return refuse();
    const now = this.now();
    const last = this.lastStart.get(id);
    if (last !== undefined && now - last < def.cooldownMs) return refuse();
    if (def.suppressedBy) {
      const other = this.lastStart.get(def.suppressedBy.id);
      if (other !== undefined && now - other < def.suppressedBy.withinMs) return refuse();
    }
    let sameId = 0;
    this.voices.forEach((v) => {
      if (v.id === id) sameId += 1;
    });
    if (sameId >= def.maxVoices || this.voices.size >= MAX_TOTAL_SFX_VOICES) return refuse();

    const out = ctx.createGain();
    out.gain.value = def.gain;
    out.connect(this.sfxBus);
    let rendered: RenderedVoice;
    try {
      rendered = renderSfx(id, ctx, out, ctx.currentTime + 0.01 + Math.max(0, opts.delay ?? 0), opts.variant ?? 0);
    } catch {
      safely(() => out.disconnect());
      return refuse();
    }
    const voice: Voice = { id, rendered, out, safetyTimer: null };
    this.voices.add(voice);
    this.lastStart.set(id, now);
    this.playCounts[id] = (this.playCounts[id] ?? 0) + 1;

    let remaining = rendered.sources.length;
    const onEnded = () => {
      remaining -= 1;
      if (remaining <= 0) this.releaseVoice(voice);
    };
    rendered.sources.forEach((s) => {
      s.onended = onEnded;
    });
    // If the context is suspended mid-sound, `ended` may never fire: release anyway.
    const lifetimeMs = Math.max(0, rendered.endTime - ctx.currentTime) * 1000 + 1_000;
    voice.safetyTimer = setTimeout(() => this.releaseVoice(voice), lifetimeMs);
    return true;
  }

  /** Stop every playing instance of one effect (e.g. footsteps when movement stops). */
  stopSound(id: SfxId): void {
    this.voices.forEach((v) => {
      if (v.id === id) this.stopVoice(v);
    });
  }

  stopAllSfx(): void {
    this.voices.forEach((v) => this.stopVoice(v));
  }

  private stopVoice(voice: Voice): void {
    voice.rendered.sources.forEach((s) => {
      s.onended = null;
      safely(() => s.stop());
    });
    this.releaseVoice(voice);
  }

  private releaseVoice(voice: Voice): void {
    if (!this.voices.delete(voice)) return;
    if (voice.safetyTimer) clearTimeout(voice.safetyTimer);
    voice.rendered.nodes.forEach((n) => safely(() => n.disconnect()));
    safely(() => voice.out.disconnect());
  }

  // -------------------------------------------------------------------------
  // Ambience
  // -------------------------------------------------------------------------

  /** Request ambience. Takes effect once unlocked and unmuted. `off` tears it down. */
  setAmbience(mode: AmbienceMode): void {
    this.desiredAmbience = mode;
    this.applyAmbience();
    this.emit();
  }

  private applyAmbience(): void {
    const ctx = this.ctx;
    const want = this.desiredAmbience;
    if (!ctx || !this.ambientBus || !this.unlocked || this.settings.muted || want === 'off') {
      this.teardownAmbience();
      return;
    }
    if (!this.ambience) {
      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0, ctx.currentTime);
      bus.gain.setTargetAtTime(SOUND_REGISTRY['ambience-calm'].gain, ctx.currentTime, 0.6); // ~2 s fade-in
      bus.connect(this.ambientBus);
      this.ambienceToken += 1;
      this.ambience = { token: this.ambienceToken, bus, base: null, dust: null };
      this.ambienceSource = 'loading';
      void this.startBaseLayer(this.ambience);
    }
    const amb = this.ambience;
    const t = ctx.currentTime;
    if (want === 'dust' && !amb.dust) {
      const layer = createSynthWind(ctx, 'dust');
      layer.output.connect(amb.bus);
      layer.output.gain.setTargetAtTime(1, t, 0.5);
      amb.dust = layer;
    } else if (want !== 'dust' && amb.dust) {
      const layer = amb.dust;
      amb.dust = null;
      layer.output.gain.setTargetAtTime(0, t, 0.4);
      this.retireLayer(layer, 2.5);
    }
  }

  private async startBaseLayer(amb: AmbienceGraph): Promise<void> {
    const buffer = await this.loadWind();
    const ctx = this.ctx;
    if (!ctx || this.ambience !== amb) return; // torn down or replaced while loading
    let layer: AmbienceLayer;
    if (buffer) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const output = ctx.createGain();
      output.gain.value = 1;
      src.connect(output);
      src.start(ctx.currentTime, Math.random() * Math.max(0, buffer.duration - 0.1));
      layer = { sources: [src], nodes: [src, output], output };
      this.ambienceSource = 'nasa-recording';
    } else {
      layer = createSynthWind(ctx, 'calm');
      layer.output.gain.value = 1;
      this.ambienceSource = 'synthesized-fallback';
    }
    layer.output.connect(amb.bus);
    amb.base = layer;
    this.emit();
  }

  /** Lazy: fetched and decoded once, on first ambience use. Resolves null on any failure. */
  private loadWind(): Promise<AudioBuffer | null> {
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve(null);
    if (!this.windPromise) {
      this.windPromise = this.loadArrayBuffer(this.windUrl)
        .then((data) => decode(ctx, data))
        .catch((err: unknown) => {
          this.assetError = err instanceof Error ? err.message : String(err);
          if (typeof console !== 'undefined') {
            console.info('[audio] Mars wind recording unavailable; using synthesized wind instead.', this.assetError);
          }
          return null;
        });
    }
    return this.windPromise;
  }

  private teardownAmbience(): void {
    const amb = this.ambience;
    this.ambience = null;
    if (this.ambienceSource !== 'none') this.ambienceSource = 'none';
    if (!amb || !this.ctx) return;
    const t = this.ctx.currentTime;
    amb.bus.gain.cancelScheduledValues(t);
    amb.bus.gain.setTargetAtTime(0, t, 0.05);
    const layers = [amb.base, amb.dust].filter((l): l is AmbienceLayer => l !== null);
    layers.forEach((l) => this.retireLayer(l, 0.3));
    setTimeout(() => safely(() => amb.bus.disconnect()), 400);
  }

  /** Stop a layer's sources after `afterSeconds` and disconnect its nodes. */
  private retireLayer(layer: AmbienceLayer, afterSeconds: number): void {
    const ctx = this.ctx;
    const when = (ctx?.currentTime ?? 0) + afterSeconds;
    layer.sources.forEach((s) => safely(() => s.stop(when)));
    setTimeout(() => layer.nodes.forEach((n) => safely(() => n.disconnect())), afterSeconds * 1000 + 100);
  }
}
