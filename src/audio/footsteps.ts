/**
 * Footstep scheduling driven ONLY by the scene's movement signal
 * (`onMovementChange(moving)`), never by raw key presses. Keyboard and touch
 * movement therefore behave the same, and a key held against a wall stays silent
 * once the scene reports that the astronaut stopped.
 *
 * One interval timer, never one sound per frame. Steps stop as soon as movement
 * stops or input is locked (decision panel / AstroBot open).
 */
export interface IntervalTimers {
  setInterval: (fn: () => void, ms: number) => ReturnType<typeof setInterval>;
  clearInterval: (handle: ReturnType<typeof setInterval>) => void;
}

const defaultTimers: IntervalTimers = {
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (handle) => clearInterval(handle),
};

export const FOOTSTEP_INTERVAL_MS = 380;

export class FootstepController {
  private moving = false;
  private locked = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private readonly playStep: (variant: number) => void;
  private readonly stopSteps: () => void;
  private readonly intervalMs: number;
  private readonly timers: IntervalTimers;

  constructor(
    playStep: (variant: number) => void,
    stopSteps: () => void,
    intervalMs = FOOTSTEP_INTERVAL_MS,
    timers: IntervalTimers = defaultTimers,
  ) {
    this.playStep = playStep;
    this.stopSteps = stopSteps;
    this.intervalMs = intervalMs;
    this.timers = timers;
  }

  /** Wire this to the scene's `onMovementChange`. */
  setMoving(moving: boolean): void {
    this.moving = moving;
    this.update();
  }

  setInputLocked(locked: boolean): void {
    this.locked = locked;
    this.update();
  }

  isStepping(): boolean {
    return this.timer !== null;
  }

  dispose(): void {
    this.moving = false;
    this.update();
  }

  private update(): void {
    if (this.moving && !this.locked) this.start();
    else this.stop();
  }

  private start(): void {
    if (this.timer !== null) return; // already stepping: repeated `true` signals are no-ops
    this.playStep(this.step++);
    this.timer = this.timers.setInterval(() => this.playStep(this.step++), this.intervalMs);
  }

  private stop(): void {
    if (this.timer === null) return;
    this.timers.clearInterval(this.timer);
    this.timer = null;
    this.stopSteps();
  }
}
