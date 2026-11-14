import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { getAudioManager, useAudioSnapshot } from '../../audio';
import type { VolumeChannel } from '../../audio';
import '../../styles/audio.css';

/** Keys the scene uses for movement and interaction. */
const GAMEPLAY_LETTERS = new Set(['w', 'a', 's', 'd', 'e']);

const SLIDERS: { channel: VolumeChannel; label: string; hint: string }[] = [
  { channel: 'master', label: 'Master volume', hint: 'All game sound' },
  { channel: 'ambient', label: 'Mars wind', hint: 'Background ambience' },
  { channel: 'sfx', label: 'Effects', hint: 'Buttons, alerts and steps' },
];

interface PanelPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

/** Place the panel under the button, inside the viewport, whatever the HUD layout. */
function measure(toggle: HTMLElement): PanelPosition {
  const r = toggle.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(300, vw - 16);
  const left = Math.min(Math.max(8, r.right - width), vw - width - 8);
  const top = r.bottom + 8;
  return { top, left, width, maxHeight: Math.max(160, vh - top - 8) };
}

/**
 * Compact sound settings: one icon button that opens a small panel.
 *
 * The panel is portalled to <body> with fixed positioning measured from the
 * button, so it never depends on (or changes) the HUD's stacking contexts.
 * Sliders are native range inputs, which the scene already ignores for movement
 * keys. Pressing W/A/S/D/E inside the panel closes it and returns focus to the
 * button, so the next key moves the astronaut again. Escape closes it too.
 */
export function AudioSettings() {
  const manager = getAudioManager();
  const snap = useAudioSnapshot();
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const open = position !== null;
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const headingId = useId();
  const { muted } = snap.settings;

  useEffect(() => {
    if (!open) return;
    const inside = (target: EventTarget | null) =>
      target instanceof Node && Boolean(rootRef.current?.contains(target) || panelRef.current?.contains(target));
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target)) setPosition(null);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!inside(event.target)) setPosition(null);
    };
    const onResize = () => {
      if (toggleRef.current) setPosition(measure(toggleRef.current));
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  // The panel is not next to the button in the DOM, so move keyboard focus into it.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>('.audio-settings__mute:not(:disabled)') ?? panel?.querySelector<HTMLElement>('button');
    target?.focus();
  }, [open]);

  const toggle = () => {
    if (open || !toggleRef.current) setPosition(null);
    else setPosition(measure(toggleRef.current));
  };

  const closeAndReturnFocus = () => {
    setPosition(null);
    toggleRef.current?.focus();
  };

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeAndReturnFocus();
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && GAMEPLAY_LETTERS.has(event.key.toLowerCase())) {
      closeAndReturnFocus();
    }
  };

  const status = !snap.supported
    ? 'Sound isn’t available in this browser. The mission works fully without it.'
    : !snap.unlocked
      ? 'Sound starts after your first click, tap or key press.'
      : snap.contextState !== 'running'
        ? 'Sound is paused. Tap or press a key to resume.'
        : muted
          ? 'Sound is muted.'
          : 'Sound is on.';

  const panel = position && (
    <div
      ref={panelRef}
      id={panelId}
      className="audio-settings__panel"
      role="group"
      aria-labelledby={headingId}
      data-audio="silent"
      style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
      onKeyDown={onPanelKeyDown}
    >
      <div className="audio-settings__header">
        <h2 id={headingId}>Sound</h2>
        <button type="button" className="audio-settings__close" aria-label="Close sound settings" onClick={closeAndReturnFocus}>
          ×
        </button>
      </div>
      <p className="audio-settings__status" role="status">
        {status}
      </p>

      <button
        type="button"
        className="audio-settings__mute"
        aria-pressed={muted}
        disabled={!snap.supported}
        onClick={() => {
          const next = !muted;
          manager.setMuted(next);
          if (!next) manager.play('menu-navigate');
        }}
      >
        {muted ? 'Unmute sound' : 'Mute sound'}
      </button>

      {SLIDERS.map(({ channel, label, hint }) => {
        const percent = Math.round(snap.settings[channel] * 100);
        const inputId = `${panelId}-${channel}`;
        return (
          <div className="audio-settings__slider" key={channel}>
            <label htmlFor={inputId}>
              <span>{label}</span>
              <small>{hint}</small>
            </label>
            <input
              id={inputId}
              type="range"
              min={0}
              max={100}
              step={5}
              value={percent}
              disabled={!snap.supported}
              aria-valuetext={`${percent}%`}
              onChange={(event) => manager.setVolume(channel, Number(event.currentTarget.value) / 100)}
            />
            <output htmlFor={inputId} aria-hidden="true">
              {percent}%
            </output>
          </div>
        );
      })}

      <p className="audio-settings__credit">
        Mars wind: recorded by NASA’s Perseverance rover on 20 Feb 2021 (NASA/JPL-Caltech), trimmed and looped. Other sounds,
        including the dust-storm gusts, are original synthesized effects.
      </p>
    </div>
  );

  return (
    <div className="audio-settings" ref={rootRef} data-audio="silent">
      <button
        ref={toggleRef}
        type="button"
        className={`audio-settings__toggle${muted ? ' audio-settings__toggle--muted' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Sound settings${muted ? ' (muted)' : ''}`}
        title="Sound settings"
        onClick={toggle}
      >
        <span aria-hidden="true">{muted || !snap.supported ? '🔇' : '🔊'}</span>
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  );
}
