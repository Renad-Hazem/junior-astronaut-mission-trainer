import { describe, expect, it } from 'vitest';
import { COMPLETION_THRESHOLD, DIFFICULTY_CONFIGS } from '../solarMath';
import {
  createRound,
  isUnreportedCompletion,
  solarRoundReducer,
  type SolarRoundAction,
  type SolarRoundState,
} from '../solarGameState';

/** Wipe every cell to zero, one stroke at a time, starting at time `t0` (10 ms apart). */
function cleanEverything(state: SolarRoundState, t0 = 1_000): SolarRoundState {
  let next = state;
  let t = t0;
  for (const cell of state.cells) {
    for (let i = 0; i < 10; i += 1) {
      next = solarRoundReducer(next, { type: 'wipe', cellId: cell.id, amount: 25, at: (t += 10) });
    }
  }
  return next;
}

describe('solarRoundReducer (pure round state)', () => {
  it('records the completion once, at the wipe that crosses the threshold', () => {
    let state = createRound('easy');
    let completions = 0;
    let previous = state.completion;
    let t = 1_000;
    for (const cell of state.cells) {
      for (let i = 0; i < 4; i += 1) {
        state = solarRoundReducer(state, { type: 'wipe', cellId: cell.id, amount: 25, at: (t += 50) });
        if (state.completion && state.completion !== previous) completions += 1;
        previous = state.completion;
      }
    }
    expect(completions).toBe(1);
    expect(state.completion).toMatchObject({ roundId: 1, success: true });
    expect(state.completion!.cleanedPercentage).toBeGreaterThanOrEqual(COMPLETION_THRESHOLD);
  });

  it('ignores every input after completion (rapid or late events cannot finish a round twice)', () => {
    const done = cleanEverything(createRound('normal'));
    expect(done.completion).not.toBeNull();
    // Reset dust on a copy to prove the reducer refuses even "valid" wipes once complete.
    const dusty = { ...done, cells: done.cells.map((c) => ({ ...c, dust: 100 })) };
    const after = solarRoundReducer(dusty, { type: 'wipe', cellId: dusty.cells[0].id, amount: 25, at: 99_999 });
    expect(after).toBe(dusty);
  });

  it('returns the same state for wipes that change nothing (clean cell, unknown cell)', () => {
    const state = createRound('easy');
    const cleaned = solarRoundReducer(state, { type: 'wipe', cellId: state.cells[0].id, amount: 100, at: 5 });
    expect(solarRoundReducer(cleaned, { type: 'wipe', cellId: state.cells[0].id, amount: 25, at: 6 })).toBe(cleaned);
    expect(solarRoundReducer(cleaned, { type: 'wipe', cellId: 'nope', amount: 25, at: 7 })).toBe(cleaned);
  });

  it('measures duration from the first effective wipe of the round', () => {
    const state = createRound('easy');
    const done = cleanEverything(state, 2_000);
    expect(done.startedAt).toBe(2_010);
    expect(done.completion!.durationMs).toBeGreaterThanOrEqual(100);
    expect(done.completion!.durationMs).toBeLessThan(10 * state.cells.length * 10);
  });

  it('a reset starts a fresh round with a new id; its own completion is a new, separate result', () => {
    const first = cleanEverything(createRound('normal'));
    const retry = solarRoundReducer(first, { type: 'reset', difficulty: 'normal' });
    expect(retry).toMatchObject({ roundId: 2, completion: null, startedAt: null });
    expect(retry.cells).toHaveLength(DIFFICULTY_CONFIGS.normal.totalCells);
    expect(retry.cells.every((c) => c.dust === 100)).toBe(true);
    const second = cleanEverything(retry);
    expect(second.completion!.roundId).toBe(2);
  });

  it('is pure: same input → same output, input never mutated (React Strict Mode calls reducers twice)', () => {
    const state = createRound('easy');
    const snapshot = JSON.stringify(state);
    const action: SolarRoundAction = { type: 'wipe', cellId: state.cells[0].id, amount: 25, at: 10 };
    const a = solarRoundReducer(state, action);
    const b = solarRoundReducer(state, action);
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(a).toEqual(b);
  });
});

describe('isUnreportedCompletion (exactly-once reporting gate)', () => {
  it('reports a round once even if the effect runs again with the same completion', () => {
    const done = cleanEverything(createRound('easy'));
    let lastReported: number | null = null;
    let reports = 0;
    for (let run = 0; run < 3; run += 1) {
      // e.g. Strict Mode re-running effects, or new callback identities from the parent
      if (isUnreportedCompletion(done.completion, lastReported)) {
        lastReported = done.completion.roundId;
        reports += 1;
      }
    }
    expect(reports).toBe(1);
    expect(isUnreportedCompletion(null, lastReported)).toBe(false);
  });

  it('reports the next round after a retry', () => {
    const first = cleanEverything(createRound('easy'));
    const second = cleanEverything(solarRoundReducer(first, { type: 'reset', difficulty: 'easy' }));
    expect(isUnreportedCompletion(second.completion, first.completion!.roundId)).toBe(true);
  });
});
