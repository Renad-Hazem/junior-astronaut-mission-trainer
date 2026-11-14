export { AudioManager, perceptualGain, type AudioManagerDeps } from './audioManager';
export { getAudioManager, installGlobalAudio, playSound, handleNavigationClick } from './globalAudio';
export { useAudioSnapshot, useGameplayAudio, handleGameplayMutations, type GameplayAudio } from './useAudio';
export { FootstepController, FOOTSTEP_INTERVAL_MS } from './footsteps';
export { soundsForEngineTransition, type AudioCue } from './engineAudio';
export { SOUND_REGISTRY, NASA_MARS_WIND, MAX_TOTAL_SFX_VOICES, type SoundDefinition } from './soundRegistry';
export { AUDIO_SETTINGS_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS } from './settings';
export type * from './types';
