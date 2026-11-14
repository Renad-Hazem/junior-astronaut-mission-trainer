import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  COMPLETION_THRESHOLD,
  DIFFICULTY_CONFIGS,
  NASA_SOLAR_FACT,
  calculateCleanedPercentage,
  calculateSimulatedEfficiency,
  cleanCell,
  createInitialCells,
} from './solarMath';
import type {
  CellData,
  DustParticle,
  SolarPanelCleaningGameProps,
} from './types';
import './solarPanelGame.css';

const PARTICLE_COLORS = ['#ff8a4c', '#ea580c', '#f59e0b', '#ffd166', '#a85237'];

export default function SolarPanelCleaningGame({
  onComplete,
  onCancel,
  reducedMotion = false,
  difficulty = 'normal',
  onSoundEffect,
}: SolarPanelCleaningGameProps) {
  const config = useMemo(() => DIFFICULTY_CONFIGS[difficulty], [difficulty]);
  const [cells, setCells] = useState<CellData[]>(() => createInitialCells(difficulty));
  const [activeDifficulty, setActiveDifficulty] = useState(difficulty);
  const [particles, setParticles] = useState<DustParticle[]>([]);
  const [focusedCellId, setFocusedCellId] = useState<string>(() => cells[0]?.id || 'p0-c0');

  const isPointerDownRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const hasFiredCompletionRef = useRef(false);
  const lastSoundTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdCounterRef = useRef(0);

  // Synchronize cells when difficulty prop changes
  if (activeDifficulty !== difficulty) {
    setActiveDifficulty(difficulty);
    setCells(createInitialCells(difficulty));
  }

  useEffect(() => {
    hasFiredCompletionRef.current = false;
    startTimeRef.current = null;
  }, [difficulty]);

  const cleanedPercentage = useMemo(() => calculateCleanedPercentage(cells), [cells]);
  const simulatedEfficiency = useMemo(
    () => calculateSimulatedEfficiency(cleanedPercentage),
    [cleanedPercentage],
  );
  const isCompleted = cleanedPercentage >= COMPLETION_THRESHOLD;

  // Spawn visual dust particle puffs
  const spawnDustParticles = useCallback(
    (clientX: number, clientY: number) => {
      if (reducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
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

  // Clean a specific cell
  const handleWipeCell = useCallback(
    (cellId: string, amount: number, clientX?: number, clientY?: number) => {
      if (isCompleted) return;

      const now = Date.now();
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      setCells((currentCells) => {
        const { nextCells, didClean } = cleanCell(currentCells, cellId, amount);
        if (didClean) {
          if (clientX !== undefined && clientY !== undefined) {
            spawnDustParticles(clientX, clientY);
          }

          // Throttle brush sound effects to ~100ms
          if (now - lastSoundTimeRef.current > 100) {
            lastSoundTimeRef.current = now;
            onSoundEffect?.('brush');
          }

          const nextCleaned = calculateCleanedPercentage(nextCells);
          if (nextCleaned >= COMPLETION_THRESHOLD && !hasFiredCompletionRef.current) {
            hasFiredCompletionRef.current = true;
            onSoundEffect?.('complete');
            const startTime = startTimeRef.current ?? now;
            const durationMs = Math.max(100, now - startTime);
            onComplete?.({
              success: true,
              cleanedPercentage: nextCleaned,
              durationMs,
            });
          }
        }
        return nextCells;
      });
    },
    [isCompleted, onComplete, onSoundEffect, spawnDustParticles],
  );

  // Pointer interactions (mouse drag / touch swipe)
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isCompleted) return;
    isPointerDownRef.current = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cellEl = target?.closest('[data-cell-id]') as HTMLElement | null;
    if (cellEl?.dataset.cellId) {
      setFocusedCellId(cellEl.dataset.cellId);
      handleWipeCell(cellEl.dataset.cellId, config.cleanRatePerStroke, event.clientX, event.clientY);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || isCompleted) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cellEl = target?.closest('[data-cell-id]') as HTMLElement | null;
    if (cellEl?.dataset.cellId) {
      setFocusedCellId(cellEl.dataset.cellId);
      handleWipeCell(cellEl.dataset.cellId, config.cleanRatePerStroke, event.clientX, event.clientY);
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

  // Keyboard navigation & cleaning
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isCompleted) return;

    const currentIndex = cells.findIndex((c) => c.id === focusedCellId);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const currentCell = cells[currentIndex];

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % cells.length;
        event.preventDefault();
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + cells.length) % cells.length;
        event.preventDefault();
        break;
      case 'ArrowDown': {
        const nextRow = currentCell.row + 1;
        if (nextRow < config.rowsPerPanel) {
          const match = cells.find(
            (c) =>
              c.panelIndex === currentCell.panelIndex &&
              c.row === nextRow &&
              c.col === currentCell.col,
          );
          if (match) nextIndex = cells.indexOf(match);
        } else if (currentCell.panelIndex + 1 < config.panels) {
          const match = cells.find(
            (c) =>
              c.panelIndex === currentCell.panelIndex + 1 &&
              c.row === 0 &&
              c.col === currentCell.col,
          );
          if (match) nextIndex = cells.indexOf(match);
        }
        event.preventDefault();
        break;
      }
      case 'ArrowUp': {
        const prevRow = currentCell.row - 1;
        if (prevRow >= 0) {
          const match = cells.find(
            (c) =>
              c.panelIndex === currentCell.panelIndex &&
              c.row === prevRow &&
              c.col === currentCell.col,
          );
          if (match) nextIndex = cells.indexOf(match);
        } else if (currentCell.panelIndex - 1 >= 0) {
          const match = cells.find(
            (c) =>
              c.panelIndex === currentCell.panelIndex - 1 &&
              c.row === config.rowsPerPanel - 1 &&
              c.col === currentCell.col,
          );
          if (match) nextIndex = cells.indexOf(match);
        }
        event.preventDefault();
        break;
      }
      case ' ':
      case 'Enter':
      case 'c':
      case 'C': {
        event.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        const clientX = rect ? rect.left + rect.width / 2 : 0;
        const clientY = rect ? rect.top + rect.height / 2 : 0;
        handleWipeCell(currentCell.id, config.keyboardCleanRate, clientX, clientY);
        break;
      }
      default:
        break;
    }

    if (nextIndex !== currentIndex && cells[nextIndex]) {
      setFocusedCellId(cells[nextIndex].id);
    }
  };

  // Reset / Retry handler
  const handleReset = () => {
    setCells(createInitialCells(difficulty));
    hasFiredCompletionRef.current = false;
    startTimeRef.current = null;
    setParticles([]);
    onSoundEffect?.('power_up');
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
      ref={containerRef}
      className={`solar-game-container ${reducedMotion ? 'solar-game--reduced-motion' : ''}`}
      role="region"
      aria-label="Solar Panel Dust Rescue interactive mini-game"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <header className="solar-game-header">
        <div className="solar-game-title-group">
          <span className="solar-game-badge">☀️ ECLSS Solar Array Maintenance</span>
          <h2 className="solar-game-title">Solar Panel Dust Rescue</h2>
        </div>

        <div className="solar-game-header-actions">
          <button
            type="button"
            className="solar-btn"
            onClick={handleReset}
            aria-label="Reset mini-game and reapply dust"
          >
            🔄 Reset
          </button>
          {onCancel && (
            <button
              type="button"
              className="solar-btn solar-btn--cancel"
              onClick={onCancel}
              aria-label="Cancel mini-game and exit"
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
          <span className="solar-efficiency-label">Efficiency</span>
          <span className="solar-efficiency-metric">{simulatedEfficiency}%</span>
        </div>
      </section>

      {/* Accessible Control Hints */}
      <div className="solar-instructions-bar">
        <div className="solar-instruction-pill">
          <span>👆</span>
          <span>
            <strong>Swipe or drag</strong> across panels to wipe dust
          </span>
        </div>
        <div className="solar-instruction-pill">
          <span>⌨️</span>
          <span>
            <span className="solar-keycap">Arrows</span> Navigate ·{' '}
            <span className="solar-keycap">Space</span> Wipe Cell
          </span>
        </div>
      </div>

      {/* Interactive Surface */}
      <div
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
                  className={`solar-cell ${isCellClean ? 'solar-cell--clean' : ''}`}
                  onClick={() =>
                    handleWipeCell(cell.id, config.cleanRatePerStroke)
                  }
                  onFocus={() => setFocusedCellId(cell.id)}
                  tabIndex={isFocused ? 0 : -1}
                  aria-label={`Panel ${cell.panelIndex + 1}, cell ${cell.cellIndex + 1}: ${100 - cell.dust}% clean`}
                >
                  <div className="solar-cell-grid" />
                  <div className="solar-cell-busbar" />
                  <div
                    className="solar-cell-dust-layer"
                    style={{ opacity: cell.dust / 100 }}
                  >
                    <div className="solar-cell-dust-specks" />
                  </div>
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

      {/* Completion Modal */}
      {isCompleted && (
        <div
          className="solar-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="solar-complete-title"
        >
          <div className="solar-modal-card">
            <span className="solar-modal-celebration-badge">
              ☀️ Mission Success
            </span>
            <h3 id="solar-complete-title" className="solar-modal-title">
              Solar Array Restored!
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              Photovoltaic power generation is back online at Aster Base.
            </p>

            <div className="solar-modal-metrics-deck">
              <div className="solar-modal-metric-card">
                <span className="solar-modal-metric-label">Cleaned</span>
                <div className="solar-modal-metric-number">
                  {cleanedPercentage}%
                </div>
              </div>
              <div className="solar-modal-metric-card">
                <span className="solar-modal-metric-label">
                  Simulated Output
                </span>
                <div className="solar-modal-metric-number">
                  {simulatedEfficiency}%
                </div>
              </div>
            </div>

            {/* Science Education */}
            <div className="solar-science-card">
              <div className="solar-science-title">
                <span>🔬</span>
                <span>{NASA_SOLAR_FACT.title}</span>
              </div>
              <p className="solar-science-text">{NASA_SOLAR_FACT.body}</p>
              <small className="solar-science-disclaimer">
                {NASA_SOLAR_FACT.disclaimer}
              </small>
            </div>

            <div className="solar-modal-actions">
              <button
                type="button"
                className="solar-btn solar-btn--primary"
                onClick={() => {
                  const now = Date.now();
                  const startTime = startTimeRef.current ?? now;
                  onComplete?.({
                    success: true,
                    cleanedPercentage,
                    durationMs: Math.max(100, now - startTime),
                  });
                }}
              >
                Complete Activity
              </button>
              <button
                type="button"
                className="solar-btn"
                onClick={handleReset}
              >
                Clean Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
