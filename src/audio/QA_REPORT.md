# Audio system QA report

**Branch:** `feature/mars-audio-system` · **Base:** `face126c7f45636f40d929b519d36f50ddf94e89` (approved by the project owner) · **Date:** 2026-11-14

Every result below comes from a real run on that date. Nothing here is inferred or estimated.

## 1. Required commands (final run, after a clean `npm ci`)

| Command | Exit | Result |
|---|---|---|
| `npm ci` | 0 | 231 packages |
| `npm run build` | 0 | `tsc -b` + Vite: 626 modules, `index-DWP7pASx.js` 1,363.35 kB (gzip 384.80 kB). The >500 kB chunk warning is pre-existing; the bundle grew by about 22 kB. |
| `npm run lint` | 0 | — |
| `npm test` | 0 | 4 files, **41 tests** passed: 8 existing game-engine tests + **33 new audio tests** |
| `node src/integrations/nasa/__tests__/run.ts` | 0 | 40 passed, 0 failed (NASA layer untouched) |
| `git diff --check` (staged and unstaged) | 0 | No whitespace errors |

**Note:** on the first attempt of this final sequence, `npm ci` failed with `EPERM` because the QA preview server I had left running from this worktree kept a native `rolldown` binary locked (a Windows file lock). I stopped that one server, confirmed by its command line, and the whole sequence then passed as shown above.

## 2. Unit tests (`src/audio/__tests__`, Vitest, fake AudioContext)

These tests use a recording fake of the Web Audio API. They verify logic and lifecycle, not audible output.
- **Autoplay:** no context or playback before a gesture; one context per gesture.
- **No Web Audio:** a silent no-op.
- **Duplicates:** cooldowns and voice caps; the first-click suppression window.
- **Mute:** gain to 0 at once and every voice stopped immediately; unmute restores.
- **Settings:** persisted, corrupt storage falls back to defaults, throwing storage is handled.
- **Ambience:** lazy, single fetch; missing file or undecodable data falls back to synthesized wind; a late load after leaving gameplay never starts playback.
- **Cleanup:** voices released on end, or by the safety timer if `ended` never fires.
- **Tab visibility:** suspend and resume.
- **Footsteps:** a single timer, immediate stop, silent while input is locked, repeated signals never stack.
- **Engine transitions:** decision, warning, stabilization, completion.
- **Registry and asset:** coverage of every event; only the ambience claims NASA provenance; the shipped WAV header, duration, size and loop seam; the attribution file lists every sound.

## 3. Real-browser QA (`src/audio/tools/browser-qa.mjs`)

Setup:
- Headless Chrome with `--autoplay-policy=user-gesture-required` (desktop policy) and `--mute-audio`.
- The production build served by `vite preview`.
- Each scenario runs in an isolated browser context (fresh storage).
- Only trusted input events are used: mouse, touch and keyboard.

What the evidence is:
- the app's opt-in debug hook (`?audioDebug=1`)
- an `AudioContext` constructor wrapper, which records when contexts are created and whether a user activation was active
- an `AnalyserNode` on the master bus, measuring the RMS of the audio the graph actually rendered
- network and console events

Screenshots of the panel on desktop (1366×900) and mobile (390×844) were reviewed by eye.

Browser: **Chrome/157.0.8103.51** · App: http://127.0.0.1:4317/ (production build via `vite preview`) · Run: 2026-11-14T13:39:47.978Z

| Scenario | Check | Result | Evidence |
|---|---|---|---|
| desktop-flow | no AudioContext before any user gesture | ✅ pass | `[]` |
| desktop-flow | audio reports locked before gesture | ✅ pass | `{"supported":true,"unlocked":false,"contextState":"none","settings":{"muted":false,"master":0.7,"ambient":0.55,"sfx":0.8},"ambienceMode":"off","amb…` |
| desktop-flow | wind asset not requested on the Home screen (lazy) | ✅ pass |  |
| desktop-flow | first click creates exactly one AudioContext during user activation | ✅ pass | `[{"at":2579,"state":"running","userActivationActive":true}]` |
| desktop-flow | context running after first gesture | ✅ pass | `running` |
| desktop-flow | startup confirmation played once | ✅ pass | `{"game-startup":1}` |
| desktop-flow | no HTMLMediaElement autoplay used | ✅ pass |  |
| desktop-flow | menu navigation tick on avatar confirm | ✅ pass | `{"activeVoices":2,"playCounts":{"game-startup":1,"menu-navigate":1},"suppressedCounts":{"menu-navigate":1},"assetError":null}` |
| desktop-flow | ambience uses the NASA Mars wind recording | ✅ pass | `nasa-recording` |
| desktop-flow | wind file requested once, only after gameplay started | ✅ pass | `["http://127.0.0.1:4317/audio/ambience/mars-wind-perseverance-2021-loop.wav"]` |
| desktop-flow | ambience produces signal on the master bus | ✅ pass | `{"rms":0.013918089342045805}` |
| desktop-flow | desktop settings panel fits on screen | ✅ pass | `{"left":802,"right":1102,"top":66.078125,"bottom":488.390625}` |
| desktop-flow | keyboard on master slider changes volume and persists | ✅ pass | `{"snap":0.55,"stored":{"muted":false,"master":0.55,"ambient":0.55,"sfx":0.8}}` |
| desktop-flow | pressing W in the panel closes it and returns focus to the toggle (game keys work again) | ✅ pass | `{"open":false,"focus":"audio-settings__toggle"}` |
| desktop-flow | mute: audio was playing just before the click | ✅ pass | `{"preMuteRms":0.028556897781762406,"silentAfterMs":23,"maxRms50to400":0}` |
| desktop-flow | mute: master bus silent within 60 ms of the click and stays silent | ✅ pass | `{"preMuteRms":0.028556897781762406,"silentAfterMs":23,"maxRms50to400":0}` |
| desktop-flow | mute: no active voices, ambience torn down | ✅ pass | `{"voices":0,"amb":"none"}` |
| desktop-flow | unmute restores ambience | ✅ pass | `{"rms":0.01792050030713539}` |
| desktop-flow | Escape closes the panel | ✅ pass |  |
| desktop-flow | Inspect System plays the inspect sound | ✅ pass |  |
| desktop-flow | rapid triple-click on a decision plays one decision sound | ✅ pass | `{"activeVoices":3,"playCounts":{"game-startup":1,"menu-navigate":4,"inspect-system":1,"decision-select":1},"suppressedCounts":{"menu-navigate":1},"…` |
| desktop-flow | decision modal closes after Continue | ✅ pass |  |
| desktop-flow | mission complete + brief open sounds | ✅ pass | `{"game-startup":1,"menu-navigate":8,"inspect-system":3,"decision-select":3,"mission-complete":1,"brief-open":1}` |
| desktop-flow | leaving gameplay stops the ambience | ✅ pass | `{"supported":true,"unlocked":true,"contextState":"running","settings":{"muted":false,"master":0.55,"ambient":0.55,"sfx":0.8},"ambienceMode":"off","…` |
| desktop-flow | silence on the brief once the completion sounds finish | ✅ pass | `{"rms":0}` |
| desktop-flow | volume setting survives refresh | ✅ pass | `{"muted":false,"master":0.55,"ambient":0.55,"sfx":0.8}` |
| desktop-flow | no AudioContext after refresh until a new gesture | ✅ pass |  |
| resource-warning | entered Level 2 (Power Crisis) | ✅ pass |  |
| resource-warning | decision dropping Energy below 30 plays decision + resource warning | ✅ pass | `{"game-startup":1,"menu-navigate":3,"inspect-system":1,"decision-select":1,"resource-warning":1}` |
| stabilization+astrobot+movement | entered Level 4 (Mars Survival Challenge) | ✅ pass |  |
| stabilization+astrobot+movement | AstroBot answer arrives and plays one notification | ✅ pass | `{"game-startup":1,"menu-navigate":2,"astrobot-message":1}` |
| stabilization+astrobot+movement | holding a movement key plays no footsteps (no keyboard inference; scene signal not wired yet) | ✅ pass |  |
| stabilization+astrobot+movement | final exhausting decision plays stabilization (not decision/warning) | ✅ pass | `{"game-startup":1,"menu-navigate":9,"astrobot-message":1,"proximity-scanner":1,"inspect-system":4,"decision-select":3,"resource-warning":1,"stabili…` |
| stabilization+astrobot+movement | stabilized brief: brief-open only, no mission-complete fanfare | ✅ pass | `{"game-startup":1,"menu-navigate":9,"astrobot-message":1,"proximity-scanner":1,"inspect-system":4,"decision-select":3,"resource-warning":1,"stabili…` |
| missing-asset | entered Level 1 | ✅ pass |  |
| missing-asset | falls back to synthesized wind | ✅ pass | `{"source":"synthesized-fallback","assetError":"HTTP 404 for /audio/ambience/mars-wind-perseverance-2021-loop.wav"}` |
| missing-asset | fallback ambience is audible on the master bus | ✅ pass | `{"rms":0.005345795528738427}` |
| missing-asset | gameplay still works (inspect opens decisions) | ✅ pass |  |
| unsupported-format | entered Level 1 | ✅ pass |  |
| unsupported-format | falls back to synthesized wind | ✅ pass | `{"source":"synthesized-fallback","assetError":"Unable to decode audio data"}` |
| unsupported-format | fallback ambience is audible on the master bus | ✅ pass | `{"rms":0.004480495677018224}` |
| unsupported-format | gameplay still works (inspect opens decisions) | ✅ pass |  |
| no-web-audio | entered Level 1 without Web Audio | ✅ pass |  |
| no-web-audio | audio reports unsupported, no crash | ✅ pass | `{"supported":false,"unlocked":false,"contextState":"none","settings":{"muted":false,"master":0.7,"ambient":0.55,"sfx":0.8},"ambienceMode":"calm","a…` |
| no-web-audio | settings explain sound is unavailable and controls are disabled | ✅ pass | `{"status":"Sound isn’t available in this browser. The mission works fully without it.","muteDisabled":true,"sliderDisabled":true}` |
| no-web-audio | mission still playable (decision recorded) | ✅ pass |  |
| mobile-touch | no AudioContext before first tap | ✅ pass |  |
| mobile-touch | entered Level 1 with taps | ✅ pass |  |
| mobile-touch | touch unlocked audio (context running) | ✅ pass | `{"supported":true,"unlocked":true,"contextState":"running","settings":{"muted":false,"master":0.7,"ambient":0.55,"sfx":0.8},"ambienceMode":"calm","…` |
| mobile-touch | sound button visible inside the 390px viewport, ≥ 44px | ✅ pass | `{"x":235.078125,"y":78.59375,"w":44,"h":44,"left":213.078125,"right":257.078125,"top":56.59375,"bottom":100.59375}` |
| mobile-touch | settings panel fits on screen | ✅ pass | `{"left":8,"right":308,"top":104.99929809570312,"bottom":527.311767578125}` |
| mobile-touch | mobile panel opens below the sound button (does not cover it) | ✅ pass | `{"panelTop":104.99929809570312,"buttonBottom":100.59375}` |
| mobile-touch | focus moves into the panel when it opens | ✅ pass |  |
| mobile-touch | tap mute works on mobile | ✅ pass |  |

**54/54 checks passed. Console errors / uncaught exceptions captured: 0.**

### QA history (problems found and fixed in this session)

| Run | Result | What failed | Fix |
|---|---|---|---|
| 1 | 47/50 | (a) The menu tick on the first quick click after unlock was suppressed by a 700 ms anti-stacking window. (b) The mute RMS reading used a 43 ms analyser window, which still held pre-mute audio. (c) **Real bug:** the mobile panel overflowed 43 px off the left edge. | (a) Window narrowed to 400 ms (it only needs to cover the unlocking click itself), and the harness now pauses like a person. (b) Time-to-silence is now measured with a 256-sample analyser: silent at 12–23 ms. (c) See run 3. |
| 2 | 52/52 | Screenshots showed the mobile panel **covering the sound button** (the bar is taller than 60 px on phones). | The panel is portalled to `<body>`, positioned from the button's real rectangle on open and on resize, and focus moves into it on open. |
| 3 | **54/54** | — | Final. Added checks for "panel below the button" and "focus moves into the panel". |

## 4. What this QA does not cover

- **Nobody listened to the sounds.** Signal presence, silence and timing were measured; loudness balance and "pleasantness" were not. A human listening pass on real speakers and headphones is still needed.
- **Browsers:** only Chromium (Chrome 157) was run. Safari (including iOS's "interrupted" audio state) and Firefox were not tested. The code handles `webkitAudioContext`, callback-style `decodeAudioData` and non-`running` states, but that handling is unverified on those engines.
- **Mobile:** emulated (390×844 viewport with touch events) in desktop Chrome, not on a physical phone.
- **Hidden tab:** suspend and resume are covered by unit tests only, not in the browser run.
- **Footsteps:** not wired. The browser run confirms that holding a movement key plays **no** footsteps, because keyboard input is not used to infer movement. The pending `onMovementChange` step is described in `src/audio/README.md`.
- **Proximity scanner and AstroBot sounds** depend on DOM markup owned by other agents (`data-nearby-hotspot`, `.astro-message-row--bot`). AstroBot was verified in the browser. The proximity ping fired during the Level 4 run, but it has no dedicated assertion because no scripted walk to a hotspot was performed.

## 5. Reproduce

```bash
npm ci && npm run build
npx vite preview --port 4317 --strictPort --host 127.0.0.1    # stop it before running npm ci again (Windows file lock)
node src/audio/tools/browser-qa.mjs --url http://127.0.0.1:4317/ --out ../audio-qa-results
```
