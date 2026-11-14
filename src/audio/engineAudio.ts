/**
 * Maps game-engine state transitions to sound cues. Pure function: it only
 * reads state snapshots, so audio can never influence decisions or resources.
 */
import type { GameStore } from '../game/types';
import type { SfxId } from './types';

export type EngineAudioSlice = Pick<
  GameStore,
  'selectedLevelId' | 'choiceHistory' | 'activeWarnings' | 'isStabilizationTriggered' | 'isMissionComplete'
>;

export interface AudioCue {
  id: SfxId;
  /** Seconds after now. */
  delay?: number;
}

export function soundsForEngineTransition(prev: EngineAudioSlice, next: EngineAudioSlice): AudioCue[] {
  // Starting, restarting or leaving a mission resets state: no gameplay cues.
  if (next.selectedLevelId !== prev.selectedLevelId) return [];
  const cues: AudioCue[] = [];

  if (!prev.isStabilizationTriggered && next.isStabilizationTriggered) {
    // The calm stabilization tone replaces the decision/warning cues for this step.
    cues.push({ id: 'stabilization' });
  } else if (next.choiceHistory.length > prev.choiceHistory.length) {
    cues.push({ id: 'decision-select' });
    const newWarnings = next.activeWarnings.filter((key) => !prev.activeWarnings.includes(key));
    if (newWarnings.length > 0) cues.push({ id: 'resource-warning', delay: 0.22 });
  }

  if (!prev.isMissionComplete && next.isMissionComplete) {
    if (next.isStabilizationTriggered) cues.push({ id: 'brief-open' });
    else cues.push({ id: 'mission-complete' }, { id: 'brief-open', delay: 0.95 });
  }
  return cues;
}
