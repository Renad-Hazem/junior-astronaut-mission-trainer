# Audio attribution — ASTER BASE: Junior Astronaut Mission Trainer

Every sound in the game is listed here with where it came from. **Only one file is a real recording from Mars; everything else is an original synthesized effect.** In-game text never presents a synthesized sound as a NASA recording.

Verified on 2026-11-14.

---

## 1. NASA recording (edited)

### `ambience/mars-wind-perseverance-2021-loop.wav`

| Field | Value |
|---|---|
| What it is | Mars wind recorded on the surface of Mars by the microphone on the side of NASA's Perseverance rover, **20 February 2021** |
| NASA resource page | "NASA's Perseverance Rover Microphone Captures Sounds from Mars" (published 22 Feb 2021): https://science.nasa.gov/resource/nasas-perseverance-rover-microphone-captures-sounds-from-mars/ |
| Exact source file | "Download Filtered Audio" → https://assets.science.nasa.gov/content/dam/science/psd/mars/downloadable_items/4/5/45704_1st_Sounds_from_Mars_filters_out_rover_self-noise.wav |
| Source verification | HTTP 200, `audio/x-wav`, 3,474,680 bytes, RIFF/WAVE PCM 16-bit, 48 kHz, 2 channels, 18.02 s. SHA-256 `91fa1e9312217bf6da367ea280a8cf9f5e59cfd1be74f3bdab8784fbf51a11fc` |
| Credit (as shown on the NASA page) | **NASA/JPL-Caltech** |
| NASA's description | *"In the second set, the sound was filtered to make sounds from Mars more audible. You can hear a little wind in the second set."* |
| Usage terms | NASA *"Guidelines for using NASA Images and Media"* (https://www.nasa.gov/nasa-brand-center/images-and-media/, last updated 27 Oct 2026): NASA material *"generally [is] not subject to copyright in the United States"*; *"You may use this material for educational or informational purposes"*; *"NASA should be acknowledged as the source of the material"*. NASA must not appear to endorse the game, and the NASA insignia is not used. |
| Our edits | Built by `src/audio/tools/build-mars-wind-loop.mjs`:<br>1. mono downmix (channels are identical)<br>2. trim 5.0–14.5 s<br>3. DC removal, 7 kHz anti-alias low-pass, resample 48→16 kHz<br>4. 1.5 s equal-power loop crossfade<br>5. normalize to −20 dBFS RMS (+3.7 dB, −4.3 dBFS peak)<br>6. metadata chunks removed<br>No effects, pitch or speed changes. |
| Output | 256,044 bytes, 16-bit PCM mono 16 kHz, 8.0 s seamless loop. SHA-256 `e10a161fb07fd3338302c162ad48c4f3abff15dcb47607bc2191b8c8eec1cef5` |
| Where it plays | Gameplay ambience (calm and dust-storm events), on the Ambient volume channel |
| In-game credit | Sound settings panel: "Mars wind: recorded by NASA's Perseverance rover on 20 Feb 2021 (NASA/JPL-Caltech), trimmed and looped." |

## 2. Original synthesized sounds (no recordings)

Generated live in the browser with the Web Audio API (`src/audio/synth.ts`). They were written for this game, use no samples, and need no third-party licence.

| Sound ID | Event | Character |
|---|---|---|
| `game-startup` | First click/tap/key unlocks audio | Soft two-note chime |
| `ambience-dust` layer | Dust-storm events | Filtered-noise gusts **layered over** the NASA wind. The gust layer is synthesized, not a recording of a Martian dust storm. |
| Calm wind fallback | Only if the NASA file is missing or can't be decoded | Filtered-noise wind bed (synthesized) |
| `proximity-scanner` | Astronaut comes within range of a system | Two quiet pings |
| `inspect-system` | Inspect System button / E | Short upward sweep + click |
| `decision-select` | Decision recorded | Confirm blip |
| `resource-warning` | A decision drops a resource below 30 | Gentle descending two-tone (not an alarm) |
| `mission-complete` | Mission completes | Rising arpeggio |
| `stabilization` | Support-team stabilization (a resource reached 0) | Calm low chord |
| `brief-open` | Mission Brief opens | Soft page swipe |
| `astrobot-message` | AstroBot posts an answer | Friendly double blip |
| `menu-navigate` | Menu/navigation clicks | Tiny tick |
| `footstep` | Astronaut moving (pending scene signal) | Muffled thump, alternating left/right |

## 3. Sources evaluated and not used

| Source | Finding (2026-11-14) | Decision |
|---|---|---|
| NASA "Sounds of Mars" (https://science.nasa.gov/mission/mars-2020-perseverance/sounds-of-mars/) | Links to recording pages (laser shots, Sol 16 rover driving, Voyager "Hello" video). Rover-driving and laser clips are mechanical noise; the Voyager item is a video. | Used the wind recording above instead |
| "Perseverance Captures Puff, Whir, Zap Sounds" | Video only (MP4); credit includes non-NASA partners (ASU/MSSS/LANL/CNES/IRAP) | Not used (partner credits; no separate audio file) |
| NASA Audio and Ringtones (https://www.nasa.gov/audio-and-ringtones/) | The page HTML exposed one direct MP3 (a podcast episode) | Not suitable for game ambience/effects |
| images.nasa.gov (`images-api.nasa.gov/search?media_type=audio&q=mars`) | 60 hits, all podcasts and press events (speech) | Not suitable |
| Freesound (https://freesound.org) | API docs: *"Download Sound (OAuth2 required)"*. Originals need a logged-in account, and licences vary per sound (CC0 / CC-BY / CC-BY-NC). | Not used: no authenticated account, so no per-sound licence could be verified and downloaded legitimately. UI effects were synthesized instead. |
