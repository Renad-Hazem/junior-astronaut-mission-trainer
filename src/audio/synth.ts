/**
 * Original synthesized sound effects (Web Audio API). Nothing here is a NASA
 * recording — see public/audio/ATTRIBUTION.md. Every recipe is short and quiet
 * (peaks ≤ 0.3 before the channel/master gains) so nothing is startling.
 */
import type { SfxId } from './types';

export interface RenderedVoice {
  /** Scheduled sources; stopping them ends the voice. */
  sources: AudioScheduledSourceNode[];
  /** Every node created, so the voice can be fully disconnected. */
  nodes: AudioNode[];
  /** Context time at which the voice is silent. */
  endTime: number;
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/** One second of white noise per context, reused by every noise-based sound. */
export function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseBuffers.get(ctx);
  if (cached) return cached;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  noiseBuffers.set(ctx, buffer);
  return buffer;
}

const SILENT = 0.0001;

interface ToneSpec {
  type?: OscillatorType;
  from: number;
  to?: number;
  start: number;
  duration: number;
  attack?: number;
  peak: number;
}

function tone(ctx: BaseAudioContext, out: AudioNode, voice: RenderedVoice, s: ToneSpec): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = s.type ?? 'sine';
  osc.frequency.setValueAtTime(s.from, s.start);
  if (s.to) osc.frequency.exponentialRampToValueAtTime(s.to, s.start + s.duration);
  const attack = s.attack ?? 0.006;
  gain.gain.setValueAtTime(SILENT, s.start);
  gain.gain.exponentialRampToValueAtTime(s.peak, s.start + attack);
  gain.gain.exponentialRampToValueAtTime(SILENT, s.start + s.duration);
  osc.connect(gain);
  gain.connect(out);
  const end = s.start + s.duration + 0.02;
  osc.start(s.start);
  osc.stop(end);
  voice.sources.push(osc);
  voice.nodes.push(osc, gain);
  voice.endTime = Math.max(voice.endTime, end);
}

interface NoiseSpec {
  start: number;
  duration: number;
  filter: BiquadFilterType;
  from: number;
  to?: number;
  q?: number;
  attack?: number;
  peak: number;
}

function noise(ctx: BaseAudioContext, out: AudioNode, voice: RenderedVoice, s: NoiseSpec): void {
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = getNoiseBuffer(ctx);
  filter.type = s.filter;
  filter.Q.value = s.q ?? 0.8;
  filter.frequency.setValueAtTime(s.from, s.start);
  if (s.to) filter.frequency.exponentialRampToValueAtTime(s.to, s.start + s.duration);
  const attack = s.attack ?? 0.004;
  gain.gain.setValueAtTime(SILENT, s.start);
  gain.gain.exponentialRampToValueAtTime(s.peak, s.start + attack);
  gain.gain.exponentialRampToValueAtTime(SILENT, s.start + s.duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  const end = s.start + s.duration + 0.02;
  src.start(s.start, Math.random() * 0.5);
  src.stop(end);
  voice.sources.push(src);
  voice.nodes.push(src, filter, gain);
  voice.endTime = Math.max(voice.endTime, end);
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

/** Schedule one effect starting at context time `t`. `variant` alternates footsteps and scanner pitch. */
export function renderSfx(id: SfxId, ctx: BaseAudioContext, out: AudioNode, t: number, variant = 0): RenderedVoice {
  const v: RenderedVoice = { sources: [], nodes: [], endTime: t };
  switch (id) {
    case 'game-startup': // soft two-note "systems online" chime
      tone(ctx, out, v, { from: C5, start: t, duration: 0.45, attack: 0.02, peak: 0.14 });
      tone(ctx, out, v, { from: G5, start: t + 0.16, duration: 0.6, attack: 0.02, peak: 0.12 });
      tone(ctx, out, v, { type: 'triangle', from: C6, start: t + 0.16, duration: 0.5, attack: 0.03, peak: 0.03 });
      break;
    case 'proximity-scanner': // two gentle radar pings
      tone(ctx, out, v, { from: 1318.5 + variant * 40, start: t, duration: 0.09, peak: 0.07 });
      tone(ctx, out, v, { from: 1318.5 + variant * 40, start: t + 0.13, duration: 0.12, peak: 0.05 });
      break;
    case 'inspect-system': // upward scan sweep + soft click
      tone(ctx, out, v, { type: 'triangle', from: 520, to: 1240, start: t, duration: 0.2, peak: 0.1 });
      noise(ctx, out, v, { filter: 'highpass', from: 2500, start: t, duration: 0.03, peak: 0.05 });
      break;
    case 'decision-select': // confirm blip
      tone(ctx, out, v, { from: 880, start: t, duration: 0.08, peak: 0.12 });
      tone(ctx, out, v, { from: 1318.5, start: t + 0.06, duration: 0.11, peak: 0.09 });
      break;
    case 'resource-warning': // gentle descending two-tone (not an alarm)
      tone(ctx, out, v, { type: 'triangle', from: 659.25, start: t, duration: 0.16, attack: 0.012, peak: 0.12 });
      tone(ctx, out, v, { type: 'triangle', from: 493.88, start: t + 0.18, duration: 0.22, attack: 0.012, peak: 0.11 });
      break;
    case 'mission-complete': // rising arpeggio
      [C5, E5, G5, C6].forEach((f, i) =>
        tone(ctx, out, v, { type: 'triangle', from: f, start: t + i * 0.11, duration: 0.42, attack: 0.012, peak: 0.1 }),
      );
      tone(ctx, out, v, { from: C5 / 2, start: t, duration: 0.9, attack: 0.05, peak: 0.06 });
      break;
    case 'stabilization': // calm, reassuring low chord: "support team has secured the base"
      tone(ctx, out, v, { from: 261.63, start: t, duration: 1.3, attack: 0.25, peak: 0.08 });
      tone(ctx, out, v, { from: 329.63, start: t + 0.08, duration: 1.25, attack: 0.25, peak: 0.065 });
      tone(ctx, out, v, { from: 392.0, start: t + 0.16, duration: 1.2, attack: 0.25, peak: 0.05 });
      break;
    case 'brief-open': // soft page swipe
      noise(ctx, out, v, { filter: 'bandpass', from: 700, to: 3200, q: 1.1, start: t, duration: 0.28, attack: 0.05, peak: 0.07 });
      break;
    case 'astrobot-message': // friendly robot double-blip
      tone(ctx, out, v, { type: 'triangle', from: 987.77, start: t, duration: 0.07, peak: 0.09 });
      tone(ctx, out, v, { type: 'triangle', from: 1318.5, start: t + 0.08, duration: 0.09, peak: 0.08 });
      break;
    case 'menu-navigate': // tiny tick
      tone(ctx, out, v, { from: 1250, start: t, duration: 0.04, peak: 0.05 });
      break;
    case 'footstep': { // muffled boot on regolith; alternates left/right
      const f = variant % 2 === 0 ? 520 : 440;
      noise(ctx, out, v, { filter: 'lowpass', from: f, to: f * 0.6, q: 0.7, start: t, duration: 0.09, attack: 0.003, peak: 0.16 });
      tone(ctx, out, v, { from: 95, to: 60, start: t, duration: 0.07, attack: 0.003, peak: 0.07 });
      break;
    }
  }
  return v;
}

export interface AmbienceLayer {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  /** Layer output (connect/ramp this). */
  output: GainNode;
}

/**
 * Original synthesized wind: filtered noise with slow random-feeling modulation.
 * `calm` is the fallback bed when the NASA recording can't load; `dust` is the
 * extra gust layer used during dust-storm events (always synthesized, never
 * presented as a recording).
 */
export function createSynthWind(ctx: BaseAudioContext, kind: 'calm' | 'dust'): AmbienceLayer {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = kind === 'calm' ? 'lowpass' : 'bandpass';
  filter.frequency.value = kind === 'calm' ? 360 : 820;
  filter.Q.value = kind === 'calm' ? 0.5 : 0.9;
  const level = ctx.createGain();
  level.gain.value = kind === 'calm' ? 0.22 : 0.16;
  const output = ctx.createGain();
  output.gain.value = 0;

  // Two slow LFOs: one sweeps the filter (whistle), one swells the level (gusts).
  const sweep = ctx.createOscillator();
  sweep.frequency.value = kind === 'calm' ? 0.07 : 0.19;
  const sweepDepth = ctx.createGain();
  sweepDepth.gain.value = kind === 'calm' ? 140 : 420;
  const gust = ctx.createOscillator();
  gust.frequency.value = kind === 'calm' ? 0.11 : 0.31;
  const gustDepth = ctx.createGain();
  gustDepth.gain.value = kind === 'calm' ? 0.07 : 0.11;

  sweep.connect(sweepDepth);
  sweepDepth.connect(filter.frequency);
  gust.connect(gustDepth);
  gustDepth.connect(level.gain);
  src.connect(filter);
  filter.connect(level);
  level.connect(output);

  const now = ctx.currentTime;
  src.start(now, Math.random() * 0.5);
  sweep.start(now);
  gust.start(now);
  return { sources: [src, sweep, gust], nodes: [src, filter, level, output, sweep, sweepDepth, gust, gustDepth], output };
}
