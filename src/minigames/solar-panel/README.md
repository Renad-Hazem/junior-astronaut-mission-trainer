# Solar Panel Dust Rescue — Interactive Mini-Game

## Overview
**"Solar Panel Dust Rescue"** (`SolarPanelCleaningGame`) is a lightweight, child-friendly, accessible interactive mini-game designed for **ASTER BASE — Junior Astronaut Mission Trainer**.

It simulates cleaning Martian dust accumulation off solar panel arrays to restore their power collection efficiency, providing hands-on engagement alongside educational planetary science insights.

---

## Educational Science & NASA Context

### Real-World Mars Missions
On Mars, airborne dust settled onto solar panels is one of the greatest operational challenges for surface missions:
- **NASA Mars Exploration Rover Opportunity:** Operated for over 14 years (2004–2018), far exceeding its initial 90-sol mission warranty thanks to episodic Martian wind gusts ("cleaning events") that blew dust off its solar arrays. Opportunity was ultimately lost when a planet-encircling dust storm in 2018 blocked sunlight completely.
- **NASA InSight Mars Lander:** Powered by dual 2.2-meter solar arrays, InSight's power generation steadily declined over four years from ~5,000 watt-hours per sol to under 500 watt-hours as dust accumulated without cleaning events, leading to mission retirement in December 2022.

### Simulation Disclaimer
> **Educational Simulation Notice:** In this interactive training exercise, panel cleaning percentages and power efficiency increases are simulated educational metrics designed to teach cadets how surface environmental factors impact Mars base operations. On actual uncrewed missions, cleaning relies on wind gusts or robotic instruments rather than manual astronaut wipes.

---

## Component Architecture & Contract

### Component: `SolarPanelCleaningGame`
Located in `src/minigames/solar-panel/SolarPanelCleaningGame.tsx`.

```tsx
import { SolarPanelCleaningGame } from '@/minigames/solar-panel';

<SolarPanelCleaningGame
  difficulty="normal" // 'easy' | 'normal' | 'hard'
  reducedMotion={false} // optional boolean, falls back to system prefers-reduced-motion
  onComplete={(result) => {
    console.log('Cleaned!', result.cleanedPercentage, result.durationMs);
  }}
  onCancel={() => {
    console.log('Player cancelled');
  }}
/>
```

### TypeScript Types
```typescript
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface SolarPanelCleaningResult {
  success: boolean;
  cleanedPercentage: number; // 0 to 100
  durationMs: number;
}

export interface SolarPanelCleaningGameProps {
  onComplete?: (result: SolarPanelCleaningResult) => void;
  onCancel?: () => void;
  reducedMotion?: boolean;
  difficulty?: Difficulty;
}
```

### Strict Boundaries & Safety
- **Zero direct store writes:** The component does NOT touch `useGameStore` or any game state directly.
- **Duplicate-proof:** Emits `onComplete` exactly once when the 90% completion threshold is crossed. Subsequent swipes do not trigger duplicate calls.
- **Safe cancellation & retry:** Player can cancel at any time via `onCancel` or retry via the reset button without penalizing game progress.

---

## Interaction & Accessibility

1. **Pointer & Touch Dragging:**
   - Cadets can click-and-drag with a mouse or swipe with a finger across panel cells.
   - Cells have `touch-action: none` to prevent mobile browser pull-to-refresh or vertical page scrolling during gameplay.
2. **Keyboard Accessibility:**
   - Every solar cell is individually focusable (`tabIndex={0}`, role `button`).
   - Supports `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` to navigate the grid.
   - Pressing `Space`, `Enter`, or `C` cleans the focused cell.
   - Audio/visual cues provide immediate feedback upon cleaning.
3. **Reduced Motion:**
   - Respects `prefers-reduced-motion: reduce` OS setting.
   - Can also be forced via the `reducedMotion` prop.
   - When active, particle generation is disabled and animations use instant/static transitions.

---

## Grid Configurations & Balancing

| Difficulty | Panels | Cells Per Panel | Total Cells | Clean Rate / Stroke | Target Duration |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Easy** | 2 | 2x3 (6) | 12 | 35% | 15–25s |
| **Normal** | 4 | 2x3 (6) | 24 | 25% | 25–35s |
| **Hard** | 4 | 3x3 (9) | 36 | 18% | 35–50s |

- **Completion Threshold:** 90% cleaned across the array.
- **Simulated Efficiency:** Scales from 15% (heavily dusted baseline) up to 100% (fully restored).

---

## Standalone Development Preview

To preview and interact with the mini-game without loading the 3D Mars scene:
1. Start Vite dev server: `npm run dev`
2. Open `http://localhost:5173/src/minigames/solar-panel/dev/preview.html`
3. The preview harness includes:
   - Live difficulty toggle (Easy / Normal / Hard)
   - Reduced-motion override toggle
   - Event callback log showing `onComplete` and `onCancel` payloads
   - Live efficiency and cleaning telemetry

---

## Mission Level 2 Integration Proposal

### Context: Level 2 — Power Crisis
In Mission Level 2, Aster Base experiences high energy consumption and reduced solar array generation during a seasonal dust event. Cadets are confronted with the decision at the Solar Array hotspot (`solar_array_inspection`).

### Proposed Hook (Optional Pre-Decision Activity)
When cadets interact with the Solar Array hotspot in Level 2:
1. AstroBot detects severe dust obstruction on the photovoltaic panels.
2. An optional prompt appears: **"Launch Solar Panel Dust Rescue Mini-Game"**.
3. Upon achieving 90%+ cleanliness:
   - A simulated +10 or +15 Energy efficiency bonus is granted to the base.
   - The cadet receives AstroBot dialogue referencing Opportunity's cleaning events.
   - The standard mission decision choices ("Conserve Battery" vs "Deploy Auxiliary Cells") can still proceed with higher base margins.
4. If skipped or cancelled:
   - The mission proceeds with standard decision dialogue without penalty.
