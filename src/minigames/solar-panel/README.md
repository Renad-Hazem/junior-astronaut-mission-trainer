# Solar Panel Dust Rescue — Interactive Mini-Game

## Overview
**"Solar Panel Dust Rescue"** (`SolarPanelCleaningGame`) is a lightweight, child-friendly, accessible interactive mini-game designed for **ASTER BASE — Junior Astronaut Mission Trainer**.

In the game, the player **remotely operates the base's small cleaning rover** to brush Martian dust off a solar array, restoring its (simulated) power output. A short NASA science card follows each successful pass.

---

## Educational Science & NASA Context

### Real-World Mars Missions (checked 2026-11-14)
- **Opportunity rover:** operated for almost 15 years. Wind sometimes cleaned dust off its solar panels. It went quiet in 2018 after a severe Mars-wide dust storm cut the sunlight reaching its panels. Source: [NASA Opportunity mission page](https://science.nasa.gov/mission/mer-opportunity/).
- **InSight lander:** dust gradually covering its solar panels reduced its energy until it ran out; NASA ended the mission on 21 Dec 2022. The team used the robotic arm's scoop to sprinkle dirt on windy days, so falling grains swept some dust off. Source: [JPL release, 21 Dec 2022](https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/).

### Simulation Disclaimer
> **Educational Simulation Notice:** cleaning percentages and "simulated output" are fictional educational indicators, not spacecraft telemetry. The remote cleaning rover belongs to the fictional ASTER BASE, not to a real NASA mission. Real Mars missions relied on wind, and InSight on its robotic arm, rather than astronauts wiping panels.

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
  onReturn={() => closeActivity()} // result card's primary button
  returnLabel="Back to mission decisions"
/>
```

Inside gameplay, use `SolarRoverConsole` (modal shell: portal, focus trap, Escape, `data-audio="silent"`) rather than the bare game. See "Level 2 integration" below.

### TypeScript Types
```typescript
export type Difficulty = 'easy' | 'normal' | 'hard';
export type SolarSoundEffect = 'brush' | 'power_up' | 'complete';

export interface SolarPanelCleaningResult {
  success: boolean;
  cleanedPercentage: number; // 0 to 100
  durationMs: number;
}

export interface SolarPanelCleaningGameProps {
  onComplete?: (result: SolarPanelCleaningResult) => void; // exactly once per successful pass
  onCancel?: () => void;
  onReturn?: () => void;     // result card primary action; hidden if omitted
  returnLabel?: string;
  resultNote?: string;       // extra sentence on the result card
  reducedMotion?: boolean;
  difficulty?: Difficulty;
  onSoundEffect?: (effect: SolarSoundEffect) => void;
}
```

### Strict Boundaries & Safety
- **Zero direct store writes:** The component does NOT touch `useGameStore` or any game state directly.
- **Pure state:** Round state lives in `solarGameState.ts` (`useReducer`). The reducer is pure: React Strict Mode calls it twice in development, so it never plays sounds, spawns particles or calls back.
- **Exactly once per pass:** The reducer records the completion at the wipe that crosses 90 %. It ignores all input after that, so rapid pointer or keyboard events cannot complete a pass twice. One guarded effect announces it: `onSoundEffect('complete')` and `onComplete(result)` fire once per pass, even if the effect runs again. A retry ("Clean Again" / "Reset") starts a new pass with its own single completion.
- **Leaving is the host's choice:** the result card's primary button calls `onReturn`. `onComplete` never closes anything, so the science card stays readable.
- **Safe cancellation & retry:** Player can cancel at any time via `onCancel` or retry via the reset button without penalizing game progress.

---

## Interaction & Accessibility

1. **Pointer & Touch Dragging:**
   - Cadets drag with a mouse or swipe with a finger. The rover marker follows the pointer and brushes each cell it passes.
   - The array surface has `touch-action: none` to prevent mobile browser pull-to-refresh or vertical page scrolling during gameplay.
   - Cells fill their grid column (`width: 100%; min-width: 0`), so they never overlap and a touch always cleans the cell under the finger.
2. **Keyboard Accessibility:**
   - The grid uses a roving tab stop: only the rover's cell is in the tab order (`tabIndex` 0, all other cells −1).
   - `ArrowUp`, `ArrowDown`, `ArrowLeft` and `ArrowRight` steer the rover and move focus with it.
   - `Space` or `Enter` (the native button click, also used by assistive technology) or `C` brushes the rover's cell.
   - Keys pressed on the Reset / Exit / result buttons keep their normal behaviour.
   - After a retry, focus returns to the rover's cell.
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
   - Event callback log showing `onComplete`, `onCancel` and `onReturn` calls
   - Live efficiency and cleaning telemetry

---

## Level 2 integration: remote cleaning-rover practice

Integrated on `integration/bonus05-solar-gameplay`. It replaces the earlier proposal, whose Energy bonus is **not** implemented.

**Where:** Level 2 "Power Crisis", event `l2-e2-solar-cleanup` ("Solar Array Dust Cleanup"). It appears only on that event, and only before the decision is made.

**Framing:** the crew stays in the habitat and remotely operates the base's small cleaning rover. Nobody wipes panels by hand on Mars. The result card says plainly that the rover is part of the ASTER BASE story, not a real NASA machine.

**Flow:**
1. Walk to the Solar Array and inspect it (E, tap, or the Inspect System button).
2. The decision panel shows an optional card with the **Operate Cleaning Rover** button.
3. The button opens `SolarRoverConsole`, a focused modal portalled to `<body>`:
   - the gameplay page is `inert`
   - scene input is locked, so WASD, arrows, the touch d-pad and E do nothing and footsteps stop
   - focus starts on the rover's cell, Tab is trapped, and Escape cancels
   - closing returns focus to the button that opened it
4. Clean with mouse, touch or keyboard. On success the result card shows the NASA science (Opportunity and InSight, with links) and **Back to mission decisions**.
5. The event's three original decisions are unchanged and still authoritative. Their effects and previews are untouched.

**Guarantees:**
- **Optional:** skipping it (just decide), Exit or Escape never blocks the mission.
- **No rewards:** no resource is ever changed by the activity, and it never chooses a decision. `GameplayPage` only counts passes for display (`data-rover-passes`).
- **Nothing saved:** saved progress is not touched, and a replay of Level 2 starts the activity fresh.

**Audio:** existing registry sounds only.
- brush stroke → `menu-navigate` (quiet tick, at most every 160 ms)
- retry → `inspect-system`
- success → `brief-open` (the science card opens)

The console has `data-audio="silent"`, so cell clicks never trigger the global menu tick.

**Tests:**
- `__tests__/solarGameState.test.ts` covers the pure reducer and the exactly-once gate.
- `npm run qa:browser` (dev server, Strict Mode on) plays the activity with keyboard, mouse drag and touch swipe. It checks Escape/cancel, retry, the focus trap and restore, the movement lock, exactly one completion per pass, unchanged resources and decisions, exact decision effects afterwards, and the Level 2 replay "skip" path.
- `src/audio/tools/browser-qa.mjs` covers the desktop and phone flows: footsteps stop under the console and resume after it, there is exactly one success cue, brush ticks are rate-limited, and there is no decision cue.
