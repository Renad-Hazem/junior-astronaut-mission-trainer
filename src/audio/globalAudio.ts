/**
 * App-wide audio wiring: the shared manager, gesture unlock, tab visibility,
 * and quiet menu-navigation ticks.
 *
 * Installed once (idempotent, survives hot reload via a global symbol). It only
 * attaches passive listeners: it never prevents default actions or stops propagation.
 */
import { AudioManager } from './audioManager';
import type { SfxId } from './types';

const GLOBAL_KEY = Symbol.for('aster-base.audio.v1');

interface GlobalAudioState {
  manager: AudioManager;
  uninstall: (() => void) | null;
}

function globalState(): GlobalAudioState {
  const g = globalThis as unknown as Record<symbol, GlobalAudioState | undefined>;
  let state = g[GLOBAL_KEY];
  if (!state) {
    state = { manager: new AudioManager(), uninstall: null };
    g[GLOBAL_KEY] = state;
  }
  return state;
}

export function getAudioManager(): AudioManager {
  return globalState().manager;
}

export function playSound(id: SfxId, opts?: { delay?: number; variant?: number }): boolean {
  return getAudioManager().play(id, opts);
}

/**
 * Events that count as user activation in current browsers. pointerdown
 * covers mouse and pen; pointerup and touchend cover touch.
 */
const GESTURE_EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'touchend', 'keydown', 'click'] as const;

const NAV_SELECTOR = 'button, a[href], [role="button"], summary';

/**
 * Plays a quiet tick for menu/navigation clicks.
 * - `data-audio="silent"` on an element or ancestor opts out.
 * - `data-audio="nav"` opts in, even inside the mission HUD.
 * - Clicks inside the mission HUD or the AstroBot panel are otherwise silent:
 *   those areas have their own event sounds.
 */
export function handleNavigationClick(event: Event, manager: AudioManager): void {
  const el = event.target instanceof Element ? event.target.closest(NAV_SELECTOR) : null;
  if (!el || el.matches(':disabled, [aria-disabled="true"]')) return;
  const marker = el.closest('[data-audio]')?.getAttribute('data-audio');
  if (marker === 'silent') return;
  if (marker !== 'nav' && el.closest('.gameplay-page, .astro-chatbot-panel')) return;
  manager.play('menu-navigate');
}

export function installGlobalAudio(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const state = globalState();
  if (state.uninstall) return;
  const manager = state.manager;

  const onGesture = () => {
    const snap = manager.getSnapshot();
    if (!snap.unlocked || snap.contextState !== 'running') manager.unlock();
  };
  const onVisibility = () => manager.handleVisibilityChange(document.hidden);
  const onClick = (event: MouseEvent) => handleNavigationClick(event, manager);
  const opts: AddEventListenerOptions = { capture: true, passive: true };

  GESTURE_EVENTS.forEach((type) => window.addEventListener(type, onGesture, opts));
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('click', onClick, { passive: true });

  // Opt-in QA hook: add ?audioDebug=1 to the URL. Read-only views plus the manager.
  try {
    if (new URLSearchParams(window.location.search).has('audioDebug')) {
      (window as unknown as Record<string, unknown>).__asterAudio = {
        snapshot: () => manager.getSnapshot(),
        stats: () => manager.getDebugStats(),
        manager,
      };
    }
  } catch {
    /* URL parsing unavailable: no debug hook */
  }

  state.uninstall = () => {
    GESTURE_EVENTS.forEach((type) => window.removeEventListener(type, onGesture, opts));
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('click', onClick);
    state.uninstall = null;
  };
}
