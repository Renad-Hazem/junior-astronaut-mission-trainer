import type { SoundCategory, SoundId, SoundProvenance } from './types';

export interface SoundDefinition {
  id: SoundId;
  /** Game event that triggers the sound. */
  trigger: string;
  category: SoundCategory;
  /** Minimum ms between starts — prevents stacked duplicates from rapid clicks/state churn. */
  cooldownMs: number;
  /** Maximum simultaneous instances of this sound. */
  maxVoices: number;
  /** Per-sound trim (0..1) applied before the channel and master gains. */
  gain: number;
  provenance: SoundProvenance;
  /** Skip this sound if another one started within the window (avoids stacking on the first click). */
  suppressedBy?: { id: SoundId; withinMs: number };
}

export const NASA_MARS_WIND = {
  /** Relative to Vite's BASE_URL; served from public/audio/. */
  path: 'audio/ambience/mars-wind-perseverance-2021-loop.wav',
  title: 'NASA’s Perseverance Rover Microphone Captures Sounds from Mars (filtered audio)',
  credit: 'NASA/JPL-Caltech',
  recorded: '2021-02-20',
  sourcePage: 'https://science.nasa.gov/resource/nasas-perseverance-rover-microphone-captures-sounds-from-mars/',
} as const;

const sfx = (
  id: SoundId,
  trigger: string,
  cooldownMs: number,
  maxVoices: number,
  gain: number,
): SoundDefinition => ({ id, trigger, category: 'sfx', cooldownMs, maxVoices, gain, provenance: 'original-synthesized' });

export const SOUND_REGISTRY: Readonly<Record<SoundId, SoundDefinition>> = {
  'game-startup': sfx('game-startup', 'First user gesture unlocks audio', 5_000, 1, 1),
  'ambience-calm': {
    id: 'ambience-calm',
    trigger: 'Gameplay screen with a non-dust scene status',
    category: 'ambient',
    cooldownMs: 0,
    maxVoices: 1,
    gain: 0.9,
    provenance: 'nasa-recording-edited',
  },
  'ambience-dust': {
    id: 'ambience-dust',
    trigger: 'Gameplay event with sceneStatus "dust"',
    category: 'ambient',
    cooldownMs: 0,
    maxVoices: 1,
    gain: 0.9,
    provenance: 'nasa-recording-with-synthesized-layer',
  },
  'proximity-scanner': sfx('proximity-scanner', 'Astronaut comes within interaction range of a system', 900, 1, 0.8),
  'inspect-system': sfx('inspect-system', 'Inspect System button or E key', 250, 1, 1),
  'decision-select': sfx('decision-select', 'A mission decision is recorded', 300, 1, 1),
  'resource-warning': sfx('resource-warning', 'A decision drops a resource below the warning threshold (30)', 2_000, 1, 0.9),
  'mission-complete': sfx('mission-complete', 'Mission completes normally', 3_000, 1, 1),
  stabilization: sfx('stabilization', 'Support team stabilization protocol starts (a resource reached 0)', 3_000, 1, 1),
  'brief-open': sfx('brief-open', 'Mission Brief screen opens', 1_500, 1, 0.9),
  'astrobot-message': sfx('astrobot-message', 'AstroBot posts a new answer', 400, 1, 0.85),
  'menu-navigate': {
    ...sfx('menu-navigate', 'Menu / navigation button click outside the mission HUD', 90, 2, 0.8),
    // Only the click that unlocked audio (pointerdown → click ≈ 100 ms) should be silent.
    suppressedBy: { id: 'game-startup', withinMs: 400 },
  },
  footstep: sfx('footstep', 'Astronaut moving (scene onMovementChange signal)', 150, 2, 0.75),
};

/** Hard cap across all effects, regardless of per-sound limits. */
export const MAX_TOTAL_SFX_VOICES = 12;
