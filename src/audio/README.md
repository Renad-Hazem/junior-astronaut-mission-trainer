# ASTER BASE audio system

This folder holds the centralized game audio, built on the Web Audio API with no new dependencies. Asset sources and licences are in `public/audio/ATTRIBUTION.md`. Test results are in `QA_REPORT.md`.

## Files

| File | Role |
|---|---|
| `audioManager.ts` | `AudioManager`: one `AudioContext` (created only inside a user gesture) → master → ambient bus + effects bus. Handles cooldowns and voice caps, mute, volume, settings persistence, lazy ambience with a synthesized fallback, tab-visibility suspend/resume, and node cleanup. |
| `soundRegistry.ts` | One entry per sound event: trigger, category, cooldown, voice cap, trim gain and **provenance** (NASA recording vs original synthesized). |
| `synth.ts` | Original synthesized effects and the synthesized wind layers. |
| `engineAudio.ts` | Pure mapping from game-engine state transitions to sound cues (decision, warning, stabilization, completion, brief). |
| `footsteps.ts` | `FootstepController`: steps driven only by the scene's movement signal, on a single interval timer. |
| `useAudio.ts` | React hooks: `useAudioSnapshot` (settings UI) and `useGameplayAudio` (all gameplay wiring). |
| `globalAudio.ts` | Shared manager, gesture unlock, tab visibility, quiet menu-navigation ticks, and the opt-in `?audioDebug=1` QA hook. |
| `settings.ts` | Persisted settings: `localStorage` key `aster-base:audio-settings:v1`. Corrupt or blocked storage falls back to the defaults. |
| `tools/build-mars-wind-loop.mjs` | Rebuilds the NASA wind loop from the official file (reproducible, documented processing). |
| `tools/browser-qa.mjs` | Real-browser QA in headless Chrome/Edge (see `QA_REPORT.md`). |
| `../components/ui/AudioSettings.tsx`, `../styles/audio.css` | The sound button and its panel. |

## Guarantees

- **No autoplay.** No `AudioContext` exists before the first click, tap or key press. Verified in Chrome with `--autoplay-policy=user-gesture-required`.
- **Mute is immediate.** The master gain goes to 0 at once, every effect voice is stopped, and the ambience is torn down. Measured: silent 12–23 ms after the click.
- **No stacking.** Each sound has a cooldown and a voice cap, plus a global cap of 12 voices.
- **No leaks.** Voices disconnect when they end, with a safety timer in case `ended` never fires (suspended context). Ambience stops when leaving gameplay.
- **Read-only towards the game.** It subscribes to the engine store and never writes to it. Resource and decision logic is untouched.
- **Fully optional.** With no Web Audio, a missing file, an undecodable file or blocked storage, the game plays normally.

## Sound events

| Sound | Trigger | Wired via |
|---|---|---|
| `game-startup` | First user gesture unlocks audio | `globalAudio.ts` |
| `ambience-calm` / `ambience-dust` | Gameplay screen. `sceneStatus === 'dust'` adds the synthesized gust layer over the NASA wind. | `useGameplayAudio` |
| `proximity-scanner` | The astronaut enters a system's interaction range | Observes `data-nearby-hotspot` on `MarsScene`'s container (see the caveat below) |
| `inspect-system` | Inspect System button or E | `GameplayPage.inspect()` |
| `decision-select` | A decision is recorded | Engine transition |
| `resource-warning` | A decision pushes a resource below 30 (the engine's `activeWarnings`) | Engine transition |
| `stabilization` | The engine sets `isStabilizationTriggered`. This replaces the decision/warning cues for that step. | Engine transition |
| `mission-complete` + `brief-open` | The mission completes normally (the brief cue follows 0.95 s later) | Engine transition |
| `brief-open` only | Completion after stabilization | Engine transition |
| `astrobot-message` | AstroBot appends an answer (not the "thinking" bubble, not the welcome message) | Observes new `.astro-message-row--bot` nodes (see the caveat below) |
| `menu-navigate` | Button clicks outside the mission HUD and the AstroBot panel, plus elements marked `data-audio="nav"` | Delegated click listener |
| `footstep` | The astronaut is actually moving | `MarsScene`'s `onMovementChange` (wired in `GameplayPage.tsx`, see below) |

Opt out of the navigation tick with `data-audio="silent"`; opt in inside the HUD with `data-audio="nav"`.

## Footsteps (`onMovementChange`) — wired

Footsteps follow **real movement**, never key presses. `GameplayPage.tsx` passes `useGameplayAudio`'s `onMovementChange` to `MarsScene`. The scene's contract (`src/scene/sceneCallbacks.ts`):
- reports actual displacement after collision resolution
- fires only on transitions
- emits `false` on input lock, level change and unmount
- merges keyboard and touch input

`FootstepController`:
- steps immediately, then every 380 ms, on one interval (never one sound per frame)
- stops at once on `false`, and ignores repeated `true` signals
- stays silent while input is locked (the decision panel or AstroBot is open)

`browser-qa.mjs` verifies all of this with real input:
- the `walkingFootsteps` scenario covers start, release, pinned at the map edge, decision lock, AstroBot lock, unmount and restart
- `mobileFlow` covers the touch d-pad
- `hotspotsAndRocket` covers long walks

## Interim DOM observers (to replace with explicit callbacks)

Two events still have no callback, so the audio observes markup (re-verified after merging `fix/final-gameplay-qa`):
- **Proximity:** `MarsScene` renders `data-nearby-hotspot` on its container. The QA branch's "distant-click protection" changed `SceneHotspot.tsx` clicks, not this attribute.
- **AstroBot replies:** `AstroChatbot.tsx` renders `.astro-message-row--bot`. The QA branch changed only chip text and labels, not this markup.

If that markup changes, the sound simply stops playing: there are no errors and no effect on gameplay. `browser-qa.mjs` catches the regression in its AstroBot and hotspot checks.

**Proposed improvement** (a separate PR for the owners, after the QA work settles), following the optional-callback pattern of `sceneCallbacks.ts`:
- `MarsSceneProps.onNearbyChange?: (id: HotspotId | null) => void`. `MarsScene` already has `handleNearbyChange` internally, so it only needs to call the prop too.
- `AstroChatbotProps.onBotMessage?: (message: { id: string; grounded: boolean }) => void`, called where `setMessages` appends a bot answer (not the welcome message or the thinking bubble).

Then `useGameplayAudio` would drop the `MutationObserver` and `GameplayPage.tsx` would pass the two callbacks.

## Settings placement

The sound button lives in the gameplay command bar, beside AstroBot. The panel is portalled to `<body>` and positioned under the button, so it never depends on the HUD's stacking contexts.

Home, Library and Brief have no sound button: those pages belong to the UI owner. Menu sounds there are quiet ticks, and the persisted mute applies everywhere. Adding `<AudioSettings />` to those pages is a one-line change.

`installGlobalAudio()` is called at module load of `GameplayPage.tsx`, which `App.tsx` imports statically, so the gesture unlock works from the Home screen. It can move into `App.tsx` if its owner prefers.

## Commands

```bash
npm test                                   # includes 34 audio unit tests (fake AudioContext)
node src/audio/tools/browser-qa.mjs --plan-only   # check hotspot walk plans against the scene's own physics (no browser)
npm run build && npx vite preview --port 4317 --strictPort
# DevTools port 9333 is shared with `npm run qa:browser`: run the two one after the other, not at the same time.
# --only walkingFootsteps,mobileFlow   runs a subset of scenarios
node src/audio/tools/browser-qa.mjs --url http://127.0.0.1:4317/ --out ../audio-qa-results
node src/audio/tools/build-mars-wind-loop.mjs <downloaded NASA 45704_…wav>
```
