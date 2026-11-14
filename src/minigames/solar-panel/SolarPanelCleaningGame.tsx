import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  DIFFICULTY_CONFIGS,
  NASA_SOLAR_FACT,
  ROVER_CONSOLE_FRAMING,
  calculateCleanedPercentage,
  calculateSimulatedEfficiency,
} from './solarMath';
import { createRound, isUnreportedCompletion, solarRoundReducer } from './solarGameState';
import type {
  CellData,
  DustParticle,
  SolarPanelCleaningGameProps,
} from './types';
import './solarPanelGame.css';

const PARTICLE_COLORS = ['#ff8a4c', '#ea580c', '#f59e0b', '#ffd166', '#a85237'];
/** Brush feedback is a quiet tick at most this often, however fast the input. */
const BRUSH_SOUND_INTERVAL_MS = 160;

/** Small remote-controlled cleaning rover drawn on the cell it is brushing. */
function RoverMarker() {
  return (
    <svg className="solar-rover-marker" viewBox="0 0 40 28" aria-hidden="true" focusable="false">
      <rect x="9" y="1" width="2.5" height="9" rx="1" fill="#cbd5e1" />
      <circle cx="10.25" cy="2" r="2.2" fill="#38e1ff" />
      <rect x="4" y="8" width="30" height="11" rx="3" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.2" />
      <rect x="7" y="10" width="13" height="5" rx="1.2" fill="#1d4ed8" />
      <rect x="31" y="15" width="8" height="3" rx="1.2" fill="#f59e0b" />
      <circle cx="10" cy="22" r="4.2" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
      <circle cx="28" cy="22" r="4.2" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
    </svg>
  );
}

export default function SolarPanelCleaningGame({
  onComplete,
  onCancel,
  onReturn,
  returnLabel = 'Complete Activity',
  resultNote,
  reducedMotion = false,
  difficulty = 'normal',
  onSoundEffect,
}: SolarPanelCleaningGameProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [round, dispatch] = useReducer(solarRoundReducer, difficulty, createRound);
  const [particles, setParticles] = useState<DustParticle[]>([]);
  const [focusedCellId, setFocusedCellId] = useState<string>(() => round.cells[0]?.id ?? 'p0-c0');

  const titleId = useId();
  const resultTitleId = useId();
  const resultLedeId = useId();
  const isPointerDownRef = useRef(false);
  const lastSoundTimeRef = useRef(0);
  const reportedRoundRef = useRef<number | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const resultActionRef = useRef<HTMLButtonElement>(null);
  const particleIdCounterRef = useRef(0);

  // A new difficulty starts a new round (render-phase update, guarded by the state itself).
  if (round.difficulty !== difficulty) {
    dispatch({ type: 'reset', difficulty });
  }

  const { cells, completion } = round;
  const cleanedPercentage = useMemo(() => calculateCleanedPercentage(cells), [cells]);
  const simulatedEfficiency = useMemo(
    () => calculateSimulatedEfficiency(cleanedPercentage),
    [cleanedPercentage],
  );
  const isCompleted = completion !== null;

  // Report each successful pass exactly once. The reducer records the completion;
  // this effect only announces it. The ref guard keeps a re-run (Strict Mode, or
  // new callback identities from the parent) from reporting the same round twice.
  useEffect(() => {
    if (!isUnreportedCompletion(completion, reportedRoundRef.current)) return;
    reportedRoundRef.current = completion.roundId;
    onSoundEffect?.('complete');
    onComplete?.({
      success: completion.success,
      cleanedPercentage: completion.cleanedPercentage,
      durationMs: completion.durationMs,
    });
    // The array surface is replaced by the result card: keep keyboard focus inside the game.
    resultActionRef.current?.focus();
  }, [completion, onComplete, onSoundEffect]);

  // Spawn visual dust particle puffs (coordinates relative to the array surface)
  const spawnDustParticles = useCallback(
    (clientX: number, clientY: number) => {
      if (reducedMotion || !surfaceRef.current) return;
      const rect = surfaceRef.current.getBoundingClientRect();
      const originX = clientX - rect.left;
      const originY = clientY - rect.top;

      const newParticles: DustParticle[] = [];
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 2.8;
        newParticles.push({
          id: ++particleIdCounterRef.current,
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0, // slight upward drift
          size: 3 + Math.random() * 4,
          opacity: 0.9,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        });
      }

      setParticles((prev) => [...prev.slice(-24), ...newParticles]);
    },
    [reducedMotion],
  );

  // Animate particles
  useEffect(() => {
    if (reducedMotion || particles.length === 0) return;

    const frameId = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.04,
          }))
          .filter((p) => p.opacity > 0.05),
      );
    });

    return () => cancelAnimationFrame(frameId);
  }, [particles, reducedMotion]);

  /**
   * Brush one cell. All side effects live here, in the event path; the reducer
   * stays pure. Effects are skipped for cells that are already clean (as of the
   * latest render), and the reducer ignores any wipe that changes nothing.
   */
  // `at` is the input event's timeStamp, so durations and sound throttling share one clock.
  const wipeCell = (cellId: string, amount: number, at: number, point?: { x: number; y: number }) => {
    if (isCompleted) return;
    const cell = cells.find((c) => c.id === cellId);
    if (!cell || cell.dust <= 0) return;

    dispatch({ type: 'wipe', cellId, amount, at });
    if (point) spawnDustParticles(point.x, point.y);
    if (at - lastSoundTimeRef.current >= BRUSH_SOUND_INTERVAL_MS) {
      lastSoundTimeRef.current = at;
      onSoundEffect?.('brush');
    }
  };

  const cellElement = (cellId: string) =>
    surfaceRef.current?.querySelector<HTMLButtonElement>(`[data-cell-id="${cellId}"]`) ?? null;

  const cellCenter = (cellId: string) => {
    const rect = cellElement(cellId)?.getBoundingClientRect();
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
  };

  const cellIdAtPoint = (clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY);
    return (target?.closest('[data-cell-id]') as HTMLElement | null)?.dataset.cellId;
  };

  // Pointer interactions (mouse drag / touch swipe): the rover follows the pointer.
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isCompleted) return;
    isPointerDownRef.current = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    const cellId = cellIdAtPoint(event.clientX, event.clientY);
    if (cellId) {
      setFocusedCellId(cellId);
      wipeCell(cellId, config.cleanRatePerStroke, event.timeStamp, { x: event.clientX, y: event.clientY });
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || isCompleted) return;
    const cellId = cellIdAtPoint(event.clientX, event.clientY);
    if (cellId) {
      setFocusedCellId(cellId);
      wipeCell(cellId, config.cleanRatePerStroke, event.timeStamp, { x: event.clientX, y: event.clientY });
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignore if capture was already released
    }
  };

  // Enter / Space reach a cell as a native button click with `detail === 0`
  // (also how assistive technology activates it). Mouse and touch clicks
  // (`detail >= 1`) were already handled by pointerdown, so they are ignored here.
  const handleCellClick = (event: ReactMouseEvent<HTMLButtonElement>, cellId: string) => {
    if (event.detail !== 0) return;
    setFocusedCellId(cellId);
    wipeCell(cellId, config.keyboardCleanRate, event.timeStamp, cellCenter(cellId));
  };

  const moveFocusTo = (cell: CellData) => {
    setFocusedCellId(cell.id);
    cellElement(cell.id)?.focus();
  };

  // Keyboard steering. Only keys pressed on a solar cell are handled, so the
  // Reset / Exit and result buttons keep their native Enter / Space behaviour.
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isCompleted) return;
    const target = event.target as HTMLElement;
    const cellId = target.closest<HTMLElement>('[data-cell-id]')?.dataset.cellId;
    if (!cellId) return;

    const currentIndex = cells.findIndex((c) => c.id === cellId);
    if (currentIndex === -1) return;
    const currentCell = cells[currentIndex];
    const findCell = (panelIndex: number, row: number, col: number) =>
      cells.find((c) => c.panelIndex === panelIndex && c.row === row && c.col === col);

    let next: CellData | undefined;
    switch (event.key) {
      case 'ArrowRight':
        next = cells[(currentIndex + 1) % cells.length];
        break;
      case 'ArrowLeft':
        next = cells[(currentIndex - 1 + cells.length) % cells.length];
        break;
      case 'ArrowDown':
        next =
          currentCell.row + 1 < config.rowsPerPanel
            ? findCell(currentCell.panelIndex, currentCell.row + 1, currentCell.col)
            : findCell(currentCell.panelIndex + 1, 0, currentCell.col);
        break;
      case 'ArrowUp':
        next =
          currentCell.row - 1 >= 0
            ? findCell(currentCell.panelIndex, currentCell.row - 1, currentCell.col)
            : findCell(currentCell.panelIndex - 1, config.rowsPerPanel - 1, currentCell.col);
        break;
      case 'c':
      case 'C':
        event.preventDefault();
        wipeCell(currentCell.id, config.keyboardCleanRate, event.timeStamp, cellCenter(currentCell.id));
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next) moveFocusTo(next);
  };

  // Reset / Retry: a new round. Nothing is carried over and nothing is awarded.
  const handleReset = () => {
    dispatch({ type: 'reset', difficulty });
    setParticles([]);
    onSoundEffect?.('power_up');
    // "Clean Again" disappears with the result card: put keyboard focus back on the rover.
    // A click commits synchronously, so the array exists again by the next frame.
    requestAnimationFrame(() => {
      surfaceRef.current?.querySelector<HTMLElement>('[data-cell-id][tabindex="0"]')?.focus();
    });
  };

  // Group cells by panel for visual layout
  const panels = useMemo(() => {
    const grouped: CellData[][] = [];
    for (let p = 0; p < config.panels; p++) {
      grouped.push(cells.filter((c) => c.panelIndex === p));
    }
    return grouped;
  }, [cells, config.panels]);

  return (
    <div
      className={`solar-game-container ${reducedMotion ? 'solar-game--reduced-motion' : ''}`}
      role="region"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <header className="solar-game-header">
        <div className="solar-game-title-group">
          <span className="solar-game-badge">Remote rover console · Power system</span>
          <h2 id={titleId} className="solar-game-title">Solar Panel Dust Rescue</h2>
          <p className="solar-game-subtitle">
            Steer the base&rsquo;s cleaning rover across the dusty solar array from inside the habitat.
          </p>
        </div>

        <div className="solar-game-header-actions">
          <button
            type="button"
            className="solar-btn"
            onClick={handleReset}
            aria-label="Reset: start a new cleaning pass with fresh dust"
          >
            🔄 Reset
          </button>
          {onCancel && (
            <button
              type="button"
              className="solar-btn solar-btn--cancel"
              onClick={onCancel}
              aria-label="Exit the rover console without finishing"
            >
              ✕ Exit
            </button>
          )}
        </div>
      </header>

      {/* Stats & Progress HUD */}
      <section className="solar-stats-panel" aria-label="Solar Array Status">
        <div className="solar-stat-group">
          <div className="solar-stat-label-row">
            <span>Dust Removed</span>
            <span className="solar-stat-value" aria-live="polite">
              {cleanedPercentage}%
            </span>
          </div>
          <div
            className="solar-progress-track"
            role="progressbar"
            aria-valuenow={cleanedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Solar dust removal progress: ${cleanedPercentage}%`}
          >
            <div
              className="solar-progress-fill"
              style={{ width: `${cleanedPercentage}%` }}
            />
          </div>
        </div>

        <div className="solar-efficiency-chip">
          <span className="solar-efficiency-label">Simulated output</span>
          <span className="solar-efficiency-metric">{simulatedEfficiency}%</span>
        </div>
      </section>

      {completion ? (
        /* Result card replaces the array, so it is never clipped on small screens. */
        <section className="solar-result" aria-labelledby={resultTitleId}>
          <div className="solar-modal-card">
            <span className="solar-modal-celebration-badge">Cleaning pass complete</span>
            <h3 id={resultTitleId} className="solar-modal-title">
              Panels cleared by the rover
            </h3>
            <p id={resultLedeId} className="solar-result-lede">
              The rover brushed away {completion.cleanedPercentage}% of the simulated dust.
              {resultNote ? ` ${resultNote}` : ''}
            </p>

            <div className="solar-modal-metrics-deck">
              <div className="solar-modal-metric-card">
                <span className="solar-modal-metric-label">Cleaned</span>
                <div className="solar-modal-metric-number">
                  {completion.cleanedPercentage}%
                </div>
              </div>
              <div className="solar-modal-metric-card">
                <span className="solar-modal-metric-label">
                  Simulated Output
                </span>
                <div className="solar-modal-metric-number">
                  {calculateSimulatedEfficiency(completion.cleanedPercentage)}%
                </div>
              </div>
            </div>

            {/* Science Education */}
            <div className="solar-science-card">
              <div className="solar-science-title">
                <span aria-hidden="true">🔬</span>
                <span>{NASA_SOLAR_FACT.title}</span>
              </div>
              <p className="solar-science-text">{NASA_SOLAR_FACT.body}</p>
              <ul className="solar-science-sources">
                {NASA_SOLAR_FACT.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.label} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
              <small className="solar-science-disclaimer">
                {ROVER_CONSOLE_FRAMING} {NASA_SOLAR_FACT.disclaimer}
              </small>
            </div>

            <div className="solar-modal-actions">
              {onReturn && (
                <button
                  ref={resultActionRef}
                  type="button"
                  className="solar-btn solar-btn--primary"
                  aria-describedby={`${resultTitleId} ${resultLedeId}`}
                  onClick={onReturn}
                >
                  {returnLabel}
                </button>
              )}
              <button
                ref={onReturn ? undefined : resultActionRef}
                type="button"
                className="solar-btn"
                onClick={handleReset}
              >
                Clean Again
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Accessible Control Hints */}
          <div className="solar-instructions-bar">
            <div className="solar-instruction-pill">
              <span aria-hidden="true">👆</span>
              <span>
                <strong>Drag or swipe</strong> to drive the rover&rsquo;s brush over the panels
              </span>
            </div>
            <div className="solar-instruction-pill">
              <span aria-hidden="true">⌨️</span>
              <span>
                <span className="solar-keycap">Arrows</span> Steer ·{' '}
                <span className="solar-keycap">Space</span> or <span className="solar-keycap">C</span> Brush
              </span>
            </div>
          </div>

          {/* Interactive Surface */}
          <div
            ref={surfaceRef}
            className="solar-array-surface"
            style={
              {
                '--panels-count': config.panels,
              } as React.CSSProperties
            }
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {panels.map((panelCells, pIndex) => (
              <div
                key={`panel-${pIndex}`}
                className="solar-panel-module"
                style={
                  {
                    '--panel-rows': config.rowsPerPanel,
                    '--panel-cols': config.colsPerPanel,
                  } as React.CSSProperties
                }
              >
                {panelCells.map((cell) => {
                  const isCellClean = cell.dust <= 10;
                  const isFocused = cell.id === focusedCellId;
                  return (
                    <button
                      key={cell.id}
                      type="button"
                      data-cell-id={cell.id}
                      className={`solar-cell ${isCellClean ? 'solar-cell--clean' : ''} ${isFocused ? 'solar-cell--rover' : ''}`}
                      onClick={(event) => handleCellClick(event, cell.id)}
                      onFocus={() => setFocusedCellId(cell.id)}
                      tabIndex={isFocused ? 0 : -1}
                      aria-label={`Panel ${cell.panelIndex + 1}, cell ${cell.cellIndex + 1}: ${100 - cell.dust}% clean${isFocused ? ', rover is here' : ''}`}
                    >
                      <div className="solar-cell-grid" />
                      <div className="solar-cell-busbar" />
                      <div
                        className="solar-cell-dust-layer"
                        style={{ opacity: cell.dust / 100 }}
                      >
                        <div className="solar-cell-dust-specks" />
                      </div>
                      {isFocused && <RoverMarker />}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Dynamic Dust Particles */}
            {!reducedMotion && particles.length > 0 && (
              <div className="solar-particles-overlay" aria-hidden="true">
                {particles.map((p) => (
                  <span
                    key={p.id}
                    className="solar-dust-particle"
                    style={{
                      left: p.x,
                      top: p.y,
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                      opacity: p.opacity,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
