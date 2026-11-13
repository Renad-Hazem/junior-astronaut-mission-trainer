import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';
import { createInputState, type InputState } from './sceneMath';

const KEY_TO_DIRECTION: Readonly<Record<string, keyof InputState>> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

const INTERACT_CODE = 'KeyE';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}

function isPageTarget(target: EventTarget | null): boolean {
  return target === null || target === document.body || target === document.documentElement
    || target === document;
}

/**
 * Tracks WASD / arrow keys (by physical key code, so ZQSD on AZERTY works)
 * and fires `onInteract` exactly once per physical E press. Holding E or
 * OS key-repeat never fires again until the key is released.
 */
export function useSceneKeyboard(onInteract: () => void): RefObject<InputState> {
  const inputRef = useRef<InputState>(createInputState());
  const interactRef = useRef(onInteract);

  useEffect(() => {
    interactRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    const held = new Set<string>();
    let interactHeld = false;

    const sync = () => {
      const next = createInputState();
      held.forEach((code) => {
        const dir = KEY_TO_DIRECTION[code];
        if (dir) next[dir] = true;
      });
      Object.assign(inputRef.current, next);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      const dir = KEY_TO_DIRECTION[event.code];
      if (dir) {
        // Stop arrow keys scrolling the page while playing, but leave focused
        // UI controls (owned by the page) with their native behaviour.
        if (event.code.startsWith('Arrow') && isPageTarget(event.target)) event.preventDefault();
        held.add(event.code);
        sync();
        return;
      }
      if (event.code === INTERACT_CODE) {
        if (event.repeat || interactHeld) return;
        interactHeld = true;
        interactRef.current();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === INTERACT_CODE) {
        interactHeld = false;
        return;
      }
      if (held.delete(event.code)) sync();
    };

    const reset = () => {
      held.clear();
      interactHeld = false;
      sync();
    };
    const onVisibility = () => {
      if (document.hidden) reset();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', onVisibility);
      reset();
    };
  }, []);

  return inputRef;
}

const COARSE_QUERY = '(pointer: coarse)';

function subscribeCoarse(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(COARSE_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getCoarse(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(COARSE_QUERY).matches;
}

/** True on touch-first devices, used to show on-screen movement controls. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribeCoarse, getCoarse, () => false);
}

/** Returns true when a WebGL context can be created in this browser. */
export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    // Release the probe context immediately so it does not count against the browser limit.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
