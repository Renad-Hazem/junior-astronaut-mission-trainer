/** Every sound the game can make. One entry per event in the audio brief. */
export type SoundId =
  | 'game-startup'
  | 'ambience-calm'
  | 'ambience-dust'
  | 'proximity-scanner'
  | 'inspect-system'
  | 'decision-select'
  | 'resource-warning'
  | 'mission-complete'
  | 'stabilization'
  | 'brief-open'
  | 'astrobot-message'
  | 'menu-navigate'
  | 'footstep';

/** One-shot effects. Ambience is controlled separately through `setAmbience`. */
export type SfxId = Exclude<SoundId, 'ambience-calm' | 'ambience-dust'>;

export type SoundCategory = 'ambient' | 'sfx';

/**
 * Where a sound comes from. Kept explicit so no UI text ever presents a
 * synthesized sound as a NASA recording.
 */
export type SoundProvenance =
  | 'nasa-recording-edited'
  | 'nasa-recording-with-synthesized-layer'
  | 'original-synthesized';

export interface AudioSettings {
  muted: boolean;
  /** 0..1 */
  master: number;
  /** 0..1 */
  ambient: number;
  /** 0..1 */
  sfx: number;
}

export type VolumeChannel = 'master' | 'ambient' | 'sfx';

export type AmbienceMode = 'off' | 'calm' | 'dust';

/** What is actually feeding the ambience bus right now. */
export type AmbienceSource = 'none' | 'loading' | 'nasa-recording' | 'synthesized-fallback';

/** UI-facing state. Changes only on settings/lifecycle changes, not on every sound. */
export interface AudioSnapshot {
  /** The browser exposes AudioContext. */
  supported: boolean;
  /** A user gesture has created and resumed the AudioContext at least once. */
  unlocked: boolean;
  contextState: AudioContextState | 'interrupted' | 'none';
  settings: AudioSettings;
  ambienceMode: AmbienceMode;
  ambienceSource: AmbienceSource;
}

/** QA/debug counters (read on demand; never drives React renders). */
export interface AudioDebugStats {
  activeVoices: number;
  /** How many times each sound actually started. */
  playCounts: Readonly<Partial<Record<SoundId, number>>>;
  /** How many requests were refused (locked, muted, cooldown, voice cap…). */
  suppressedCounts: Readonly<Partial<Record<SoundId, number>>>;
  /** Last ambience asset failure (missing file / undecodable format), if any. */
  assetError: string | null;
}
