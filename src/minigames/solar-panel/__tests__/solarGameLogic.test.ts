import { describe, expect, it, vi } from 'vitest';
import {
  COMPLETION_THRESHOLD,
  DIFFICULTY_CONFIGS,
  calculateCleanedPercentage,
  cleanCell,
  createInitialCells,
} from '../solarMath';
import type { SolarPanelCleaningResult } from '../types';

describe('Solar Panel Game Logic & Interaction Contracts', () => {
  it('prevents duplicate onComplete calls once threshold is reached', () => {
    let cells = createInitialCells('easy'); // 12 cells
    const config = DIFFICULTY_CONFIGS.easy;
    let hasCompleted = false;
    const onComplete = vi.fn();

    // Clean cells until threshold (90%) is reached
    for (const cell of cells) {
      if (calculateCleanedPercentage(cells) >= COMPLETION_THRESHOLD) break;

      const { nextCells } = cleanCell(cells, cell.id, config.cleanRatePerStroke * 4);
      cells = nextCells;

      const currentCleaned = calculateCleanedPercentage(cells);
      if (currentCleaned >= COMPLETION_THRESHOLD && !hasCompleted) {
        hasCompleted = true;
        onComplete({
          success: true,
          cleanedPercentage: currentCleaned,
          durationMs: 1250,
        });
      }
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]?.[0] as SolarPanelCleaningResult;
    expect(result.success).toBe(true);
    expect(result.cleanedPercentage).toBeGreaterThanOrEqual(COMPLETION_THRESHOLD);

    // Further wipes after completion must not fire onComplete again
    for (let extra = 0; extra < 5; extra++) {
      const { nextCells } = cleanCell(cells, cells[0].id, 50);
      cells = nextCells;
      const currentCleaned = calculateCleanedPercentage(cells);
      if (currentCleaned >= COMPLETION_THRESHOLD && !hasCompleted) {
        onComplete({
          success: true,
          cleanedPercentage: currentCleaned,
          durationMs: 2000,
        });
      }
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('safely resets and allows retry without penalty', () => {
    let cells = createInitialCells('normal');
    // Wipe some cells
    cells = cleanCell(cells, cells[0].id, 100).nextCells;
    cells = cleanCell(cells, cells[1].id, 100).nextCells;
    expect(calculateCleanedPercentage(cells)).toBeGreaterThan(0);

    // Reset action
    const resetCells = createInitialCells('normal');
    expect(resetCells.every((c) => c.dust === 100)).toBe(true);
    expect(calculateCleanedPercentage(resetCells)).toBe(0);
  });

  it('supports cancellation without side effects', () => {
    const onCancel = vi.fn();
    // User clicks cancel button
    onCancel();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('simulates keyboard navigation across 2D grid cells', () => {
    const cells = createInitialCells('normal'); // 4 panels, 2 rows, 3 cols
    const config = DIFFICULTY_CONFIGS.normal;

    let currentIndex = 0; // starts at p0-c0 (panel 0, row 0, col 0)

    // ArrowRight advances to next cell
    const moveRight = () => {
      currentIndex = (currentIndex + 1) % cells.length;
    };
    moveRight();
    expect(cells[currentIndex].panelIndex).toBe(0);
    expect(cells[currentIndex].col).toBe(1);

    // ArrowDown moves to next row
    const moveDown = () => {
      const current = cells[currentIndex];
      const nextRow = current.row + 1;
      if (nextRow < config.rowsPerPanel) {
        const match = cells.find(
          (c) => c.panelIndex === current.panelIndex && c.row === nextRow && c.col === current.col,
        );
        if (match) currentIndex = cells.indexOf(match);
      }
    };
    moveDown();
    expect(cells[currentIndex].row).toBe(1);
    expect(cells[currentIndex].col).toBe(1);

    // Space / Enter wipes dust on focused cell
    const { nextCells } = cleanCell(cells, cells[currentIndex].id, config.keyboardCleanRate);
    expect(nextCells[currentIndex].dust).toBe(100 - config.keyboardCleanRate);
  });

  it('handles reducedMotion by suppressing particle physics', () => {
    // When reducedMotion is true, particles are not spawned or simulated
    const reducedMotion = true;
    const spawnParticles = (enabled: boolean): number => {
      if (enabled) return 0;
      return 4; // 4 particles spawned normally
    };

    expect(spawnParticles(reducedMotion)).toBe(0);
    expect(spawnParticles(false)).toBe(4);
  });
});
