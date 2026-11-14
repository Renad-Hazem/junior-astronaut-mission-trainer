import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FootstepController, FOOTSTEP_INTERVAL_MS } from '../footsteps';
import { soundsForEngineTransition, type EngineAudioSlice } from '../engineAudio';
import type { ChoiceRecord } from '../../game/types';

describe('FootstepController (movement-signal driven)', () => {
  let steps: number[];
  let stops: number;
  let feet: FootstepController;

  beforeEach(() => {
    vi.useFakeTimers();
    steps = [];
    stops = 0;
    feet = new FootstepController((v) => steps.push(v), () => (stops += 1));
  });
  afterEach(() => {
    feet.dispose();
    vi.useRealTimers();
  });

  it('steps immediately and then on a single interval while moving', () => {
    feet.setMoving(true);
    expect(steps).toEqual([0]);
    vi.advanceTimersByTime(FOOTSTEP_INTERVAL_MS * 3);
    expect(steps).toEqual([0, 1, 2, 3]);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('repeated "moving" signals (e.g. every frame) never stack timers or sounds', () => {
    for (let i = 0; i < 60; i += 1) feet.setMoving(true);
    expect(steps).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('stops immediately when movement stops', () => {
    feet.setMoving(true);
    feet.setMoving(false);
    expect(stops).toBe(1);
    vi.advanceTimersByTime(FOOTSTEP_INTERVAL_MS * 5);
    expect(steps).toEqual([0]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stays silent while input is locked and resumes after unlock if still moving', () => {
    feet.setInputLocked(true);
    feet.setMoving(true);
    vi.advanceTimersByTime(FOOTSTEP_INTERVAL_MS * 3);
    expect(steps).toEqual([]);
    feet.setInputLocked(false);
    expect(steps).toEqual([0]);
    feet.setInputLocked(true);
    expect(feet.isStepping()).toBe(false);
  });

  it('dispose clears the timer (screen navigation)', () => {
    feet.setMoving(true);
    feet.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
});

const record = (id: string) => ({ eventId: id }) as unknown as ChoiceRecord;

function slice(over: Partial<EngineAudioSlice> = {}): EngineAudioSlice {
  return {
    selectedLevelId: 'level-1-first-day',
    choiceHistory: [],
    activeWarnings: [],
    isStabilizationTriggered: false,
    isMissionComplete: false,
    ...over,
  };
}

describe('soundsForEngineTransition', () => {
  it('decision → decision-select', () => {
    expect(soundsForEngineTransition(slice(), slice({ choiceHistory: [record('a')] }))).toEqual([{ id: 'decision-select' }]);
  });

  it('decision that creates a new warning → decision + warning (existing warnings do not repeat)', () => {
    const prev = slice({ activeWarnings: ['water'] });
    const next = slice({ choiceHistory: [record('a')], activeWarnings: ['water', 'energy'] });
    expect(soundsForEngineTransition(prev, next).map((c) => c.id)).toEqual(['decision-select', 'resource-warning']);
    const same = slice({ choiceHistory: [record('a')], activeWarnings: ['water'] });
    expect(soundsForEngineTransition(prev, same).map((c) => c.id)).toEqual(['decision-select']);
  });

  it('stabilization replaces the decision/warning cues', () => {
    const next = slice({ choiceHistory: [record('a')], activeWarnings: ['oxygen'], isStabilizationTriggered: true });
    expect(soundsForEngineTransition(slice(), next).map((c) => c.id)).toEqual(['stabilization']);
  });

  it('normal completion → mission-complete then brief-open; stabilized completion → brief-open only', () => {
    const done = soundsForEngineTransition(slice({ choiceHistory: [record('a')] }), slice({ choiceHistory: [record('a')], isMissionComplete: true }));
    expect(done.map((c) => c.id)).toEqual(['mission-complete', 'brief-open']);
    expect(done[1].delay).toBeGreaterThan(0);
    const stab = slice({ isStabilizationTriggered: true, choiceHistory: [record('a')] });
    expect(soundsForEngineTransition(stab, { ...stab, isMissionComplete: true }).map((c) => c.id)).toEqual(['brief-open']);
  });

  it('starting, restarting or leaving a mission makes no gameplay sound', () => {
    expect(soundsForEngineTransition(slice({ selectedLevelId: null }), slice())).toEqual([]);
    expect(soundsForEngineTransition(slice({ choiceHistory: [record('a')] }), slice())).toEqual([]);
    expect(soundsForEngineTransition(slice(), slice({ selectedLevelId: null }))).toEqual([]);
  });
});
