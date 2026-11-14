import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useGameStore as useEngineStore } from '../game/useGameStore';
import type { SceneStatus } from '../game/types';
import { soundsForEngineTransition } from './engineAudio';
import { FootstepController } from './footsteps';
import { getAudioManager } from './globalAudio';
import type { AudioManager } from './audioManager';
import type { AudioSnapshot } from './types';

export function useAudioSnapshot(): AudioSnapshot {
  const manager = getAudioManager();
  return useSyncExternalStore(manager.subscribe, manager.getSnapshot, manager.getSnapshot);
}

/** Stable hotspot id → small pitch variant, so different systems ping slightly differently. */
function variantFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 7;
  return h;
}

/**
 * Sounds that can only be detected from the DOM without editing files owned by
 * other agents:
 * - Proximity: MarsScene publishes `data-nearby-hotspot` on its container.
 * - AstroBot: a new `.astro-message-row--bot` that is not the "thinking" bubble.
 * Both fail silently if that markup changes. See src/audio/README.md.
 */
export function handleGameplayMutations(records: MutationRecord[], manager: AudioManager): void {
  for (const record of records) {
    if (record.type === 'attributes' && record.attributeName === 'data-nearby-hotspot') {
      const target = record.target as Element;
      const current = target.getAttribute('data-nearby-hotspot') ?? '';
      if (current && current !== (record.oldValue ?? '')) {
        manager.play('proximity-scanner', { variant: variantFor(current) });
      }
    } else if (record.type === 'childList') {
      record.addedNodes.forEach((node) => {
        if (
          node instanceof Element &&
          node.matches('.astro-message-row--bot') &&
          !node.querySelector('.astro-thinking-bubble')
        ) {
          manager.play('astrobot-message');
        }
      });
    }
  }
}

export interface GameplayAudioOptions {
  sceneStatus: SceneStatus;
  /** True while the decision panel or AstroBot locks movement. */
  inputLocked: boolean;
}

export interface GameplayAudio {
  /** Callback ref for the gameplay root element (attaches the DOM observers). */
  observeRoot: (node: HTMLElement | null) => (() => void) | void;
  /**
   * Ready for MarsScene's upcoming `onMovementChange?: (moving: boolean) => void`
   * prop. Not wired yet: the prop doesn't exist on the approved base.
   */
  onMovementChange: (moving: boolean) => void;
}

/** All gameplay sound wiring. Read-only towards the game: it never writes to any store. */
export function useGameplayAudio({ sceneStatus, inputLocked }: GameplayAudioOptions): GameplayAudio {
  const manager = getAudioManager();

  // Ambience follows the event's scene status. Leaving the gameplay screen stops it.
  useEffect(() => {
    manager.setAmbience(sceneStatus === 'dust' ? 'dust' : 'calm');
  }, [manager, sceneStatus]);
  useEffect(() => () => manager.setAmbience('off'), [manager]);

  // Decisions, warnings, stabilization, completion: subscribe to engine transitions.
  useEffect(
    () =>
      useEngineStore.subscribe((next, prev) => {
        for (const cue of soundsForEngineTransition(prev, next)) manager.play(cue.id, { delay: cue.delay });
      }),
    [manager],
  );

  // Footsteps: one controller per gameplay screen.
  const [footsteps] = useState(
    () =>
      new FootstepController(
        (variant) => {
          manager.play('footstep', { variant });
        },
        () => manager.stopSound('footstep'),
      ),
  );
  useEffect(() => {
    footsteps.setInputLocked(inputLocked);
  }, [footsteps, inputLocked]);
  useEffect(() => () => footsteps.dispose(), [footsteps]);
  const onMovementChange = useCallback((moving: boolean) => footsteps.setMoving(moving), [footsteps]);

  const observeRoot = useCallback(
    (node: HTMLElement | null) => {
      if (!node || typeof MutationObserver === 'undefined') return;
      const observer = new MutationObserver((records) => handleGameplayMutations(records, manager));
      observer.observe(node, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-nearby-hotspot'],
        attributeOldValue: true,
      });
      return () => observer.disconnect();
    },
    [manager],
  );

  return { observeRoot, onMovementChange };
}
