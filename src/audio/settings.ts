import type { AudioSettings } from './types';

export const AUDIO_SETTINGS_STORAGE_KEY = 'aster-base:audio-settings:v1';

/** Quiet by default: sound must never be startling for young players. */
export const DEFAULT_AUDIO_SETTINGS: Readonly<AudioSettings> = {
  muted: false,
  master: 0.7,
  ambient: 0.55,
  sfx: 0.8,
};

export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

const unit = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

/** Accepts anything (corrupt storage, older versions) and returns valid settings. */
export function sanitizeAudioSettings(value: unknown): AudioSettings {
  const v = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  return {
    muted: typeof v.muted === 'boolean' ? v.muted : DEFAULT_AUDIO_SETTINGS.muted,
    master: unit(v.master, DEFAULT_AUDIO_SETTINGS.master),
    ambient: unit(v.ambient, DEFAULT_AUDIO_SETTINGS.ambient),
    sfx: unit(v.sfx, DEFAULT_AUDIO_SETTINGS.sfx),
  };
}

/** localStorage can be missing or throw (private mode, blocked site data). */
export function getBrowserStorage(): SettingsStorage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadAudioSettings(storage: SettingsStorage | null): AudioSettings {
  if (!storage) return { ...DEFAULT_AUDIO_SETTINGS };
  try {
    const raw = storage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    return raw ? sanitizeAudioSettings(JSON.parse(raw)) : { ...DEFAULT_AUDIO_SETTINGS };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(storage: SettingsStorage | null, settings: AudioSettings): boolean {
  if (!storage) return false;
  try {
    storage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeAudioSettings(settings)));
    return true;
  } catch {
    return false;
  }
}
