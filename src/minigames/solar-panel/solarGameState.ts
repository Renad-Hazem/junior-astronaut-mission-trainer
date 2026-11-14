/**
 * Pure round state for Solar Panel Dust Rescue.
 *
 * The component keeps this state in `useReducer`. Reducers must stay pure,
 * because React Strict Mode calls them twice in development. So sounds,
 * particles and the `onComplete` callback happen outside: in event handlers and
 * in one guarded effect.
 */
import {
  COMPLETION_THRESHOLD,
  calculateCleanedPercentage,
  cleanCell,
  createInitialCells,
} from './solarMath';
import type { CellData, Difficulty, SolarPanelCleaningResult } from './types';

export interface SolarRoundCompletion extends SolarPanelCleaningResult {
  /** Round that produced this result. A retry starts a new round. */
  roundId: number;
}

/** One cleaning pass. A reset or retry starts a new round with a new id. */
export interface SolarRoundState {
  roundId: number;
  difficulty: Difficulty;
  cells: CellData[];
  /** When the first effective wipe of this round happened (caller's clock, ms). */
  startedAt: number | null;
  /** Set once, by the wipe that crosses the threshold. Never changes again in this round. */
  completion: SolarRoundCompletion | null;
}

export type SolarRoundAction =
  | { type: 'wipe'; cellId: string; amount: number; at: number }
  | { type: 'reset'; difficulty: Difficulty };

export function createRound(difficulty: Difficulty = 'normal', roundId = 1): SolarRoundState {
  return {
    roundId,
    difficulty,
    cells: createInitialCells(difficulty),
    startedAt: null,
    completion: null,
  };
}

export function solarRoundReducer(state: SolarRoundState, action: SolarRoundAction): SolarRoundState {
  switch (action.type) {
    case 'wipe': {
      // A finished round ignores further input: rapid or late events cannot complete it twice.
      if (state.completion) return state;
      const { nextCells, didClean } = cleanCell(state.cells, action.cellId, action.amount);
      if (!didClean) return state;
      const startedAt = state.startedAt ?? action.at;
      const cleanedPercentage = calculateCleanedPercentage(nextCells);
      const completion: SolarRoundCompletion | null =
        cleanedPercentage >= COMPLETION_THRESHOLD
          ? {
              roundId: state.roundId,
              success: true,
              cleanedPercentage,
              durationMs: Math.max(100, action.at - startedAt),
            }
          : null;
      return { ...state, cells: nextCells, startedAt, completion };
    }
    case 'reset':
      return createRound(action.difficulty, state.roundId + 1);
    default:
      return state;
  }
}

/**
 * True when `completion` belongs to a round that has not been reported yet.
 * The component keeps `lastReportedRoundId` in a ref, so an effect that runs
 * again (Strict Mode, or new callback identities) never reports a round twice.
 */
export function isUnreportedCompletion(
  completion: SolarRoundCompletion | null,
  lastReportedRoundId: number | null,
): completion is SolarRoundCompletion {
  return completion !== null && completion.roundId !== lastReportedRoundId;
}
