/**
 * Pure calculation and configuration helpers for Solar Panel Dust Rescue.
 */

import type { CellData, Difficulty } from './types';

export const COMPLETION_THRESHOLD = 90; // 90% cleaned triggers victory
export const BASELINE_EFFICIENCY = 15; // 15% efficiency when completely dusty
export const MAX_EFFICIENCY = 100; // 100% efficiency when fully cleaned

export interface GridConfig {
  panels: number;
  rowsPerPanel: number;
  colsPerPanel: number;
  totalCells: number;
  cleanRatePerStroke: number;
  keyboardCleanRate: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, GridConfig> = {
  easy: {
    panels: 2,
    rowsPerPanel: 2,
    colsPerPanel: 3,
    totalCells: 12,
    cleanRatePerStroke: 35,
    keyboardCleanRate: 40,
  },
  normal: {
    panels: 4,
    rowsPerPanel: 2,
    colsPerPanel: 3,
    totalCells: 24,
    cleanRatePerStroke: 25,
    keyboardCleanRate: 30,
  },
  hard: {
    panels: 4,
    rowsPerPanel: 3,
    colsPerPanel: 3,
    totalCells: 36,
    cleanRatePerStroke: 18,
    keyboardCleanRate: 22,
  },
};

/**
 * Initializes a deterministic grid of solar cells with full Martian dust (100).
 */
export function createInitialCells(difficulty: Difficulty = 'normal'): CellData[] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const cells: CellData[] = [];

  for (let p = 0; p < config.panels; p++) {
    for (let r = 0; r < config.rowsPerPanel; r++) {
      for (let c = 0; c < config.colsPerPanel; c++) {
        const cellIndex = r * config.colsPerPanel + c;
        cells.push({
          id: `p${p}-c${cellIndex}`,
          panelIndex: p,
          cellIndex,
          row: r,
          col: c,
          dust: 100,
        });
      }
    }
  }

  return cells;
}

/**
 * Calculates overall cleaned percentage from 0 to 100, clamped safely.
 */
export function calculateCleanedPercentage(cells: CellData[]): number {
  if (cells.length === 0) return 100;
  const totalDust = cells.reduce((sum, cell) => sum + Math.max(0, Math.min(100, cell.dust)), 0);
  const maxDust = cells.length * 100;
  const cleaned = ((maxDust - totalDust) / maxDust) * 100;
  return Math.min(100, Math.max(0, Math.round(cleaned)));
}

/**
 * Calculates simulated power efficiency percentage from BASELINE_EFFICIENCY (15%) to 100%.
 */
export function calculateSimulatedEfficiency(cleanedPercentage: number): number {
  const clampedClean = Math.min(100, Math.max(0, cleanedPercentage));
  const efficiency = BASELINE_EFFICIENCY + (clampedClean / 100) * (MAX_EFFICIENCY - BASELINE_EFFICIENCY);
  return Math.min(100, Math.max(BASELINE_EFFICIENCY, Math.round(efficiency)));
}

/**
 * Cleans a targeted cell by a given dust reduction amount, returning an updated cell array.
 */
export function cleanCell(cells: CellData[], cellId: string, amount: number): { nextCells: CellData[]; didClean: boolean } {
  let didClean = false;
  const nextCells = cells.map((cell) => {
    if (cell.id !== cellId) return cell;
    if (cell.dust <= 0) return cell;
    const nextDust = Math.max(0, cell.dust - amount);
    if (nextDust !== cell.dust) didClean = true;
    return { ...cell, dust: nextDust };
  });

  return { nextCells, didClean };
}

/**
 * NASA science shown after a successful cleaning pass.
 *
 * Checked 2026-11-14 against:
 * - NASA's Opportunity mission page: operated almost 15 years, and wind cleaned dust off its solar panels.
 * - JPL's InSight retirement release (21 Dec 2022): dust on the solar panels slowly reduced power until the
 *   lander ran out of energy; the team used the arm's scoop to sprinkle dirt on windy days to sweep dust off.
 */
export const NASA_SOLAR_FACT = {
  title: 'Dust on Martian Solar Arrays',
  body: "On Mars, dust settles out of the air onto solar panels and blocks sunlight. NASA's Opportunity rover kept working for almost 15 years, helped by Martian winds that sometimes swept its solar panels clean. The InSight lander was not so lucky: dust slowly covered its panels until its power ran out, and its mission ended in December 2022. Its team even used the lander's robotic arm to sprinkle dirt on windy days so the falling grains would sweep some dust away.",
  sourceLabel: 'NASA JPL: InSight mission ends (21 Dec 2022)',
  sourceUrl: 'https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/',
  sources: [
    {
      label: 'NASA JPL: InSight mission ends (21 Dec 2022)',
      url: 'https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/',
    },
    { label: 'NASA: Opportunity rover mission', url: 'https://science.nasa.gov/mission/mer-opportunity/' },
  ],
  disclaimer: 'Educational simulation note: Cleaning percentage and efficiency values in this mini-game are fictional educational indicators for mission gameplay, not actual spacecraft telemetry.',
};

/**
 * Story framing for ASTER BASE. The cleaning rover is part of the game's
 * fictional base, not a real NASA machine.
 */
export const ROVER_CONSOLE_FRAMING =
  'ASTER BASE is a story base: the crew stays safely inside and steers a small cleaning rover by remote control, so nobody has to go out into the dust. The rover is part of the game, not a real NASA machine.';
