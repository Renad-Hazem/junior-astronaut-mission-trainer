import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import SolarPanelCleaningGame from './SolarPanelCleaningGame';
import type { SolarPanelCleaningResult, SolarSoundEffect } from './types';
import './solarRoverConsole.css';

export type RoverConsoleCloseReason = 'cancelled' | 'returned';

export interface SolarRoverConsoleProps {
  /** Exactly once per successful cleaning pass. Practice only: the caller must not award resources. */
  onComplete: (result: SolarPanelCleaningResult) => void;
  /** Exit / Escape → 'cancelled'; the result card's return button → 'returned'. */
  onClose: (reason: RoverConsoleCloseReason) => void;
  onSoundEffect?: (effect: SolarSoundEffect) => void;
  returnLabel?: string;
  resultNote?: string;
}

const FOCUSABLE = 'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Focused modal that hosts Solar Panel Dust Rescue inside gameplay: the player
 * remotely operates the base's cleaning rover.
 *
 * - Portalled to <body> above the HUD. The caller makes the gameplay page `inert`
 *   and locks scene input while this is open.
 * - Focus starts on the rover's cell, Tab is trapped, Escape cancels. The caller
 *   restores focus to the button that opened it.
 * - `data-audio="silent"` keeps the global menu-tick listener away from every cell click.
 * - `data-rover-console` lets the gameplay page's key guard pass keys through to the game.
 */
export default function SolarRoverConsole({
  onComplete,
  onClose,
  onSoundEffect,
  returnLabel = 'Back to mission decisions',
  resultNote,
}: SolarRoverConsoleProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('[data-cell-id][tabindex="0"]')?.focus();
  }, []);

  // Escape cancels wherever focus is (it can briefly fall to <body> when a button unmounts).
  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onClose('cancelled');
    };
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [onClose]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    // Only real tab stops: the grid uses a roving tabindex, so most cells are tabindex="-1".
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.tabIndex >= 0 && element.getClientRects().length > 0,
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className="rover-console-backdrop" data-rover-console="" data-audio="silent">
      <div
        ref={dialogRef}
        className="rover-console"
        role="dialog"
        aria-modal="true"
        aria-label="Remote cleaning rover console: Solar Panel Dust Rescue"
        onKeyDown={handleKeyDown}
      >
        <SolarPanelCleaningGame
          difficulty="normal"
          reducedMotion={reducedMotion}
          onComplete={onComplete}
          onCancel={() => onClose('cancelled')}
          onReturn={() => onClose('returned')}
          returnLabel={returnLabel}
          resultNote={resultNote}
          onSoundEffect={onSoundEffect}
        />
      </div>
    </div>,
    document.body,
  );
}
