/**
 * Public types and contracts for the Solar Panel Dust Rescue mini-game.
 */

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface SolarPanelCleaningResult {
  success: boolean;
  cleanedPercentage: number;
  durationMs: number;
}

export type SolarSoundEffect = 'brush' | 'power_up' | 'complete';

export interface SolarPanelCleaningGameProps {
  /**
   * Called exactly once per successful cleaning pass, when the threshold is
   * crossed. A retry ("Clean Again" / "Reset") starts a new pass.
   */
  onComplete?: (result: SolarPanelCleaningResult) => void;
  onCancel?: () => void;
  /** Primary action on the result card (e.g. back to the mission decision). Hidden if omitted. */
  onReturn?: () => void;
  /** Label for the `onReturn` button. */
  returnLabel?: string;
  /** Extra sentence on the result card, e.g. that practice does not change base resources. */
  resultNote?: string;
  reducedMotion?: boolean;
  difficulty?: Difficulty;
  /** Optional sound effect hook for audio integration */
  onSoundEffect?: (effect: SolarSoundEffect) => void;
}

export interface CellData {
  id: string;
  panelIndex: number;
  cellIndex: number;
  row: number;
  col: number;
  dust: number; // 0 (clean) to 100 (fully dusty)
}

export interface DustParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}
