#!/usr/bin/env node
// Offline asset tool — NOT bundled. Builds public/audio/ambience/mars-wind-perseverance-2021-loop.wav
// from NASA's filtered Perseverance microphone recording (20 Feb 2021, NASA/JPL-Caltech):
//   https://assets.science.nasa.gov/content/dam/science/psd/mars/downloadable_items/4/5/45704_1st_Sounds_from_Mars_filters_out_rover_self-noise.wav
//
// Usage: node src/audio/tools/build-mars-wind-loop.mjs <downloaded-source.wav> [output.wav]
//
// Processing (documented in public/audio/ATTRIBUTION.md), nothing else:
//   1. mono downmix (the source's L/R channels are identical: correlation 1.000)
//   2. trim to 5.0–14.5 s (the audible-wind section; head/tail are near-silent)
//   3. DC removal, 101-tap Blackman windowed-sinc low-pass at 7 kHz, decimate 48 kHz → 16 kHz
//      (≈100% of the source energy is below 8 kHz)
//   4. 1.5 s equal-power crossfade of the tail into the head, so the loop is seamless (8.0 s)
//   5. normalize to −20 dBFS RMS with a −1 dBFS peak ceiling
//   6. write 16-bit PCM mono WAV with no metadata chunks
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = resolve(HERE, '../../../public/audio/ambience/mars-wind-perseverance-2021-loop.wav');
const [srcPath, outArg] = process.argv.slice(2);
if (!srcPath) {
  console.error('usage: build-mars-wind-loop.mjs <source.wav> [output.wav]');
  process.exit(2);
}
const outPath = resolve(outArg ?? DEFAULT_OUT);

const TRIM_START_S = 5.0;
const TRIM_END_S = 14.5;
const CROSSFADE_S = 1.5;
const OUT_RATE = 16_000;
const TARGET_RMS_DBFS = -20;
const PEAK_CEILING = 10 ** (-1 / 20);

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function readWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Not a RIFF/WAVE file');
  let offset = 12;
  let fmt = null;
  let data = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'fmt ') {
      fmt = {
        format: buf.readUInt16LE(offset + 8),
        channels: buf.readUInt16LE(offset + 10),
        rate: buf.readUInt32LE(offset + 12),
        bits: buf.readUInt16LE(offset + 22),
      };
    } else if (id === 'data') {
      data = buf.subarray(offset + 8, offset + 8 + size);
    }
    offset += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('Missing fmt or data chunk');
  if (fmt.format !== 1 || fmt.bits !== 16) throw new Error(`Unsupported WAV: format ${fmt.format}, ${fmt.bits}-bit (expected PCM 16-bit)`);
  const frames = data.length / (2 * fmt.channels);
  const mono = new Float64Array(frames);
  for (let i = 0; i < frames; i += 1) {
    let sum = 0;
    for (let c = 0; c < fmt.channels; c += 1) sum += data.readInt16LE((i * fmt.channels + c) * 2) / 32768;
    mono[i] = sum / fmt.channels;
  }
  return { ...fmt, mono };
}

function lowpassDecimate(x, inRate, outRate) {
  const factor = inRate / outRate;
  if (!Number.isInteger(factor)) throw new Error(`Resample ratio ${inRate}/${outRate} is not an integer`);
  const taps = 101;
  const mid = (taps - 1) / 2;
  const fc = 7_000 / inRate;
  const h = new Float64Array(taps);
  let norm = 0;
  for (let n = 0; n < taps; n += 1) {
    const k = n - mid;
    const sinc = k === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * k) / (Math.PI * k);
    const w = 0.42 - 0.5 * Math.cos((2 * Math.PI * n) / (taps - 1)) + 0.08 * Math.cos((4 * Math.PI * n) / (taps - 1));
    h[n] = sinc * w;
    norm += h[n];
  }
  for (let n = 0; n < taps; n += 1) h[n] /= norm;
  const out = new Float64Array(Math.floor(x.length / factor));
  for (let j = 0; j < out.length; j += 1) {
    const center = j * factor;
    let acc = 0;
    for (let n = 0; n < taps; n += 1) {
      const idx = center + n - mid;
      if (idx >= 0 && idx < x.length) acc += x[idx] * h[n];
    }
    out[j] = acc;
  }
  return out;
}

function crossfadeLoop(s, xfade) {
  const m = s.length - xfade;
  const o = new Float64Array(m);
  for (let i = 0; i < m; i += 1) o[i] = s[i];
  for (let i = 0; i < xfade; i += 1) {
    const p = (Math.PI / 2) * (i / xfade);
    o[i] = s[i] * Math.sin(p) + s[i + m] * Math.cos(p);
  }
  return o;
}

const stats = (x) => {
  let e = 0;
  let pk = 0;
  for (const v of x) {
    e += v * v;
    pk = Math.max(pk, Math.abs(v));
  }
  const rms = Math.sqrt(e / x.length);
  return { rms, peak: pk, rmsDb: 20 * Math.log10(rms), peakDb: 20 * Math.log10(pk) };
};

const srcBuf = readFileSync(srcPath);
const src = readWav(srcBuf);
let seg = src.mono.slice(Math.round(TRIM_START_S * src.rate), Math.round(TRIM_END_S * src.rate));
const mean = seg.reduce((a, b) => a + b, 0) / seg.length;
seg = seg.map((v) => v - mean);
const resampled = lowpassDecimate(seg, src.rate, OUT_RATE);
const loop = crossfadeLoop(resampled, Math.round(CROSSFADE_S * OUT_RATE));
const before = stats(loop);
const scale = Math.min(10 ** (TARGET_RMS_DBFS / 20) / before.rms, PEAK_CEILING / before.peak);
const pcm = Buffer.alloc(loop.length * 2);
for (let i = 0; i < loop.length; i += 1) {
  const v = Math.max(-1, Math.min(1, loop[i] * scale));
  pcm.writeInt16LE(Math.round(v * 32767), i * 2);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0, 'ascii');
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8, 'ascii');
header.write('fmt ', 12, 'ascii');
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(OUT_RATE, 24);
header.writeUInt32LE(OUT_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36, 'ascii');
header.writeUInt32LE(pcm.length, 40);
const outBuf = Buffer.concat([header, pcm]);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, outBuf);
const after = stats(loop.map((v) => v * scale));

console.log(JSON.stringify({
  source: { path: srcPath, sha256: sha256(srcBuf), bytes: srcBuf.length, rate: src.rate, channels: src.channels, seconds: +(src.mono.length / src.rate).toFixed(3) },
  processing: { trim: [TRIM_START_S, TRIM_END_S], crossfadeSeconds: CROSSFADE_S, outRate: OUT_RATE, gainDb: +(20 * Math.log10(scale)).toFixed(2) },
  output: { path: outPath, sha256: sha256(outBuf), bytes: outBuf.length, seconds: +(loop.length / OUT_RATE).toFixed(3), rmsDbfs: +after.rmsDb.toFixed(2), peakDbfs: +after.peakDb.toFixed(2) },
}, null, 2));
