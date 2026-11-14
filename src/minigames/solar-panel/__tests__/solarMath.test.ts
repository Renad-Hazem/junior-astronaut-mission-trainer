import { describe, expect, it } from 'vitest';
import {
  BASELINE_EFFICIENCY,
  COMPLETION_THRESHOLD,
  DIFFICULTY_CONFIGS,
  MAX_EFFICIENCY,
  NASA_SOLAR_FACT,
  calculateCleanedPercentage,
  calculateSimulatedEfficiency,
  cleanCell,
  createInitialCells,
} from '../solarMath';
import type { Difficulty } from '../types';

describe('Solar Math & Grid Configuration', () => {
  it('creates correct initial grid configuration across all difficulties', () => {
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

    for (const diff of difficulties) {
      const config = DIFFICULTY_CONFIGS[diff];
      const cells = createInitialCells(diff);

      expect(cells).toHaveLength(config.totalCells);
      expect(cells.every((c) => c.dust === 100)).toBe(true);

      // Check panel distribution
      for (let p = 0; p < config.panels; p++) {
        const panelCells = cells.filter((c) => c.panelIndex === p);
        expect(panelCells).toHaveLength(config.rowsPerPanel * config.colsPerPanel);
      }
    }
  });

  it('calculates cleaned percentage accurately and safely clamps to [0, 100]', () => {
    const cells = createInitialCells('normal'); // 24 cells, each 100 dust
    expect(calculateCleanedPercentage(cells)).toBe(0);

    // Half cleaned
    const halfCleaned = cells.map((c, i) => (i < 12 ? { ...c, dust: 0 } : c));
    expect(calculateCleanedPercentage(halfCleaned)).toBe(50);

    // Fully cleaned
    const fullyCleaned = cells.map((c) => ({ ...c, dust: 0 }));
    expect(calculateCleanedPercentage(fullyCleaned)).toBe(100);

    // Empty array edge case
    expect(calculateCleanedPercentage([])).toBe(100);

    // Out of bound dust values are clamped safely
    const overCleaned = [{ id: '1', panelIndex: 0, cellIndex: 0, row: 0, col: 0, dust: -50 }];
    expect(calculateCleanedPercentage(overCleaned)).toBe(100);
  });

  it('calculates simulated array efficiency proportionally from baseline to 100%', () => {
    expect(calculateSimulatedEfficiency(0)).toBe(BASELINE_EFFICIENCY); // 15%
    expect(calculateSimulatedEfficiency(50)).toBe(
      Math.round(BASELINE_EFFICIENCY + 0.5 * (MAX_EFFICIENCY - BASELINE_EFFICIENCY)),
    );
    expect(calculateSimulatedEfficiency(100)).toBe(100);

    // Edge cases: clamping
    expect(calculateSimulatedEfficiency(-20)).toBe(BASELINE_EFFICIENCY);
    expect(calculateSimulatedEfficiency(150)).toBe(100);
  });

  it('cleans targeted cell without mutating others and clamps at 0 dust', () => {
    const initial = createInitialCells('normal');
    const targetId = initial[0].id;

    // First wipe of 30 dust
    const { nextCells: step1, didClean: didClean1 } = cleanCell(initial, targetId, 30);
    expect(didClean1).toBe(true);
    expect(step1.find((c) => c.id === targetId)?.dust).toBe(70);
    expect(step1.filter((c) => c.id !== targetId).every((c) => c.dust === 100)).toBe(true);

    // Second wipe of 50 dust
    const { nextCells: step2, didClean: didClean2 } = cleanCell(step1, targetId, 50);
    expect(didClean2).toBe(true);
    expect(step2.find((c) => c.id === targetId)?.dust).toBe(20);

    // Third wipe of 50 dust (exceeds remaining 20, should clamp to 0)
    const { nextCells: step3, didClean: didClean3 } = cleanCell(step2, targetId, 50);
    expect(didClean3).toBe(true);
    expect(step3.find((c) => c.id === targetId)?.dust).toBe(0);

    // Fourth wipe on already clean cell should not clean further
    const { nextCells: step4, didClean: didClean4 } = cleanCell(step3, targetId, 50);
    expect(didClean4).toBe(false);
    expect(step4.find((c) => c.id === targetId)?.dust).toBe(0);
  });

  it('enforces completion threshold of 90%', () => {
    expect(COMPLETION_THRESHOLD).toBe(90);

    // 88% cleaned is below threshold (totalDust = 150 out of 1200 -> 87.5% rounded to 88%)
    const cellsBelow = createInitialCells('easy').map((c, i) => ({
      ...c,
      dust: i === 0 ? 100 : i === 1 ? 50 : 0,
    }));
    const pctBelow = calculateCleanedPercentage(cellsBelow);
    expect(pctBelow).toBe(88);
    expect(pctBelow < COMPLETION_THRESHOLD).toBe(true);

    // 90% cleaned triggers completion (totalDust = 120 out of 1200 -> 90%)
    const cellsAtThreshold = createInitialCells('easy').map((c, i) => ({
      ...c,
      dust: i === 0 ? 100 : i === 1 ? 20 : 0,
    }));
    const pctAtThreshold = calculateCleanedPercentage(cellsAtThreshold);
    expect(pctAtThreshold).toBe(90);
    expect(pctAtThreshold >= COMPLETION_THRESHOLD).toBe(true);
  });

  it('includes verified NASA Mars solar science citations and disclaimer', () => {
    expect(NASA_SOLAR_FACT.title).toBeTruthy();
    expect(NASA_SOLAR_FACT.body).toContain('Opportunity');
    expect(NASA_SOLAR_FACT.body).toContain('InSight');
    expect(NASA_SOLAR_FACT.sourceUrl).toMatch(/^https:\/\//);
    expect(NASA_SOLAR_FACT.disclaimer).toContain('Educational simulation note');
  });
});
