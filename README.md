# FNAF1 — first playable

A local browser survival game: last from midnight to 6 AM using cameras, independent doors and door lights, and limited power. **Night 1 is playable with Bonnie, Chica, Freddy, and Foxy.** Plain HTML, CSS, and JavaScript; no install, build, account, or external service required.

## Launch

Open this repository folder in VS Code, then run this in its terminal:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://localhost:8000](http://localhost:8000) in a current Chrome, Firefox, Edge, or Safari browser, and click **Start Night 1**. Keep the terminal running; press Ctrl+C there to stop the server. If port 8000 is occupied, use 8001 in both the command and URL. VS Code Live Server also works when serving the repository root. Opening `index.html` directly as a `file://` URL does not support the JavaScript modules reliably.

The game fits its complete scene into a responsive 16:9 area. A wide window or landscape phone gives the controls more room. Gameplay is entirely local and makes no external network requests. Nothing has been pushed to GitHub by this implementation.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Left / right door | Click the corresponding door button to toggle | A / D |
| Left / right doorway light | Click Light to toggle | Hold Q / E; release to turn off |
| Raise / lower camera monitor | Click the monitor button | Space or S |
| Select camera | Click the camera map button | See mapping below |
| Pause / resume | Click Pause / Resume | P |
| Return to title | Click Menu | Esc |
| Retry / replay Night 1 | Click the result-screen button | Tab to the button, then Enter |

Camera keys: **1 → 1A**, **2 → 1B**, **3 → 1C**, **4 → 2A**, **5 → 2B**, **6 → 3**, **7 → 4A**, **8 → 4B**, **9 → 5**, **0 → 6**, **− → 7**. Camera selection works while the monitor is open. Door and light controls remain available while viewing cameras. Held keyboard lights release on keyup, window blur, pause, or tab hiding. Click-toggled lights remain on until toggled off or power fails.

## How Night 1 works

- A normal night lasts **360 real seconds**. Each minute advances the clock one hour, from 12 AM through 6 AM. The smaller HUD timer shows real shift progress.
- Bonnie follows Stage → Dining → West Hall → West Hall Corner → left doorway. Chica and Freddy take the right-side route through Restrooms, Kitchen, East Hall, and East Hall Corner. Freddy starts later and gives a shorter doorway warning.
- A camera nameplate indicates an actual enemy position. Decorative heads in supplied room images are scenery. Doorway movement indicators remain visible even before checking a light; lights reveal the threat's identity.
- Close the **left** door for Bonnie or Foxy and the **right** door for Chica or Freddy. Hold it closed until the threat retreats (normally three seconds; Foxy half a second). A retreat notice tells you whether another enemy still occupies that doorway. The wrong door and the camera monitor provide no protection.
- Foxy progresses from closed curtains to peeking, emerged, and empty at Pirate Cove. Watching **CAM 1C** reduces his activity. If ignored, he appears in West Hall with a persistent five-second sprint warning; close the left door. A blocked sprint costs an extra three power points.
- Base drain is **0.14 power points/second**. Each closed door adds **0.22**, each light **0.13**, and the monitor **0.10**. All add together. Keeping both doors shut throughout the night will exhaust power.
- Zero power opens both doors and disables lights and cameras. Other enemy attacks stop and an **18-second outage attack** begins. You can still win if dawn arrives first. Reaching 6 AM wins a simultaneous tie with a new attack.
- Loss, win, retry, and menu transitions resolve once. Each retry starts with full power, midnight, open doors, lights and monitor off, fresh enemy timers, and no old outcome. There are no per-enemy browser timers to leak between runs.
- Switching away from the browser tab or window pauses time, power drain, and enemies. Returning resumes automatically with a new timing baseline. P provides a separate manual pause that stays paused across tab changes.

These are readable, configurable approximations of FNAF 1 mechanics, not a reproduction of its exact AI. The mask, music box, and hallway flashlight from the mixed original spec are intentionally excluded from this version.

## Development shortcuts and verification

Open [http://localhost:8000/?dev=1](http://localhost:8000/?dev=1). The development panel appears below the game:

- **Shift+F** or **Speed** cycles **1× → 4× → 12×**. At 12×, a complete night takes 30 seconds; enemy reaction windows and power drain accelerate too. Speed survives retry; refresh for 1×.
- **+10 seconds** simulates ten seconds, including enemy attacks and power use.
- **Bonnie at left door** places Bonnie at the doorway for defense testing.
- **Drain power** starts an actual outage; it does not instantly lose.
- **5 seconds to dawn** moves the clock near 6 AM. Combine with Drain power to verify winning during an outage.
- Append **&noart=1** to the development URL to force every artwork fallback without changing any image files.

The normal URL does not expose development controls or `window.nightDebug`. The regression iframe additionally uses `?dev=1&manual=1` to disable automatic advancement and drive exact elapsed-time steps. Do not use `manual=1` for normal play.

Run the repeatable checks by opening [http://localhost:8000/tests/browser-tests.html](http://localhost:8000/tests/browser-tests.html). This uses the real game in an iframe and the same simulation modules, with no testing dependency. It checks camera buttons/shortcuts and image decoding, independent controls, enemy defenses, outage and 6 AM timing, outcome stability, resets, manual pause, and 390px/1280px layout. Keep the regression tab visible while it runs. See [tests/engine-tests.js](tests/engine-tests.js) and [tests/browser-tests.js](tests/browser-tests.js).

Verified locally in Chrome on **2026-10-28: 32/32 checks passed**, including the live animation loop, visibility/focus pause, all-artwork fallbacks, overlapping doorway threats, and Foxy's full-frame sprint artwork. All 33 files in the current asset manifest matched their recorded checksums. The title and office were also inspected visually in the browser. Run the regression page above to repeat the checks.

## Code and artwork integration

| File | Responsibility |
| --- | --- |
| `index.html`, `styles.css` | Screens, separate HUD, controls, shared office coordinates, responsive layout |
| `src/main.js` | Inputs, screen lifecycle, one animation loop, tab pause, development controls |
| `src/engine.js` | State creation, elapsed-time simulation, devices, enemies, outcomes; no DOM |
| `src/config.js` | All night/power/AI tuning, enemy routes, and camera definitions |
| `src/render.js` | Asset loading and state-to-DOM rendering; no simulation changes |
| `src/asset-paths.js` | **All gameplay image paths**, including planned artwork filenames |

The code uses the exact supplied camera paths from [the manifest](assets/asset-manifest.json) and the planned destinations in [ASSETS.md](ASSETS.md). The original office and title screenshots with baked-in UI are retained but unused. Add artwork at its configured path and refresh; no code edit is required. Missing images show labeled temporary backgrounds or threat indicators and do not block gameplay. The loader warns once per missing optional path; the browser may also log its expected 404. A failed image is retried on the next page load.

Every office layer covers the same normalized 16:9 canvas, fitted without stretching. The current office variants are opaque full-scene images: **CSS clips left variants to the left 25% and right variants to the right 25%** before compositing, so one side cannot cover the other. Future transparent full-canvas overlays use the same alignment. Fallback doors and lights use percentages of that canvas. No images, asset inventory, or manifest were edited by the gameplay implementation; artwork supplied by the parallel image task is loaded as it becomes available.

## Known limitations and next task

- Only Night 1 exists. No Continue, saving, other nights, unlocks, stars, Custom Night, or Golden Freddy.
- Silent prototype: no ambience, phone call, footsteps, kitchen audio, or jumpscare sound. CAM 6 is explicitly AUDIO ONLY with textual quiet/clatter cues; no kitchen picture is shown.
- Fixed office view; no mouse panning or animated jumpscares. Supplied close-up artwork appears behind the loss screen when available.
- Camera character portraits are reusable position markers rather than perspective-matched room sprites. Missing art remains explicitly temporary. Doorway labels keep unfinished Freddy/Foxy office artwork testable.
- Small portrait screens fit the scene but have compact controls; landscape is recommended. Device/browser coverage beyond the verified local Chrome run remains future work.
- The original [Game Spec.docx](Game%20Spec.docx), [implementation plan](IMPLEMENTATION_PLAN.md), and artwork inventory describe broader future work. Their unchecked future features should not be read as implemented.

**Next concrete task:** playtest and tune the six-minute Night 1 using `src/config.js`, especially overlapping right-door threats and Foxy's warning window; then add original audio cues and a mute control before expanding to Night 2.
