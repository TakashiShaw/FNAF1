# FNAF1 completion plan

## Starting point

The original `Game Spec.docx` is preserved. All 10 supplied images and 23 generated additions are organized locally. See ASSET_INTEGRATION.md for the completed art set; the gameplay checklist below must be verified separately by the coding session. Checked boxes below describe completed preparation only. Unchecked boxes describe future work. Follow the phases in order; each has a clear finish condition so another student can resume without asking the original author.

## Phase 0 — Core images first

Use [ASSETS.md](ASSETS.md) for the generated image inventory and [ASSET_INTEGRATION.md](ASSET_INTEGRATION.md) for rendering details. Core art in steps 1–6 is generated; office variants are full-frame side states, and stage characters are separate sprites. Review them in the actual game before considering integration finished. Original work order:

1. [x] **Clean office background.** Match the supplied office composition and dark atmosphere, show both doorway areas, and remove all time/power/night/button text. This is the main playable screen.
2. [x] **Office interaction layers.** Add separate left/right closed-door overlays, left/right illuminated doorway states, and Bonnie-left/Chica-right doorway threat images. They must align with the clean office at one shared canvas size. Transparent PNG overlays or complete matching state backgrounds both work; choose one method and document it.
3. [x] **Show Stage (CAM 1A).** Make an empty background and Freddy/Bonnie/Chica character layers, or matching occupied/partially empty variants, so departures are visible.
4. [x] **Pirate Cove (CAM 1C).** Make matching closed-curtain, peeking, emerged, and empty states for Foxy's progression.
5. [x] **Four characters and loss images.** Make consistent Freddy, Bonnie, Chica, and Foxy appearances. Prioritize one readable camera pose per character, a Foxy left-hall attack view, and one jumpscare still per character. Animation frames can follow later.
6. [x] **Clean title background.** Use the supplied title image as a composition reference. Keep title text, buttons, selection highlight, version, and earned stars separate so code can draw them.
7. [ ] **Review at game size.** Keep rooms dark but make active threats distinguishable. Use a consistent approximately 16:9 frame, stable camera angles, and matching character proportions. Do not bake HUD, camera labels, scanlines, or clocks into new room backgrounds.

**Already supplied:** eight camera backgrounds (1B, 2A, 2B, 3, 4A, 4B, 5, 7), office reference, title reference. All are included even when not immediately needed.

**Do not spend time generating:** a Kitchen room image (CAM 6 is audio only), time/power numbers, simple buttons, camera-map labels, static, or win-screen text. These can be drawn using HTML/CSS or canvas. Mask/music-box artwork waits on the scope decision below.

**Finish condition:** each required screen can be represented with a real asset or a clearly labeled temporary placeholder; inventory records which are unfinished. A temporary placeholder must not be called final art. Do not delay the entire playable loop for optional animation frames.

## Phase 1 — Browser foundation and art wiring

- [ ] Create `index.html`, `styles.css`, and a small JavaScript entry point. Use plain browser code unless the class requires another framework.
- [ ] Start a local HTTP server from the project root and write the actual launch steps in the README.
- [ ] Render a responsive 16:9 game area. Prefer fitting the whole scene over cropping away door controls. Add a separate HUD layer and real clickable controls.
- [ ] Build title, office, camera monitor, loss, and 6 AM screen states. Use a single active screen state so inputs cannot affect hidden screens.
- [ ] Load assets by their manifest paths. Show a helpful missing-image placeholder when an asset fails to load; report the missing path in the console.
- [ ] Let the player start a new night, open/close the monitor, choose a camera, and return to the menu. Keep buttons usable by mouse and keyboard.
- [ ] Gate audio start behind New Game/Continue or another user gesture.

**Finish condition:** title → office → each camera → office works with no missing existing image URLs or console errors. The Kitchen shows “AUDIO ONLY.” A clean title must not duplicate menu text already baked into a reference image.

## Phase 2 — One survivable night

- [ ] Introduce one game-state object: screen, night, elapsed time, power, door/light states, monitor state, selected camera, enemy rooms, and outcome.
- [ ] Advance midnight to 6 AM using elapsed seconds rather than rendered-frame counts. Proposed first tuning value: a six-minute night; make duration configurable for classroom testing.
- [ ] Let each door and light operate independently. Monitor use and active doors/lights add to a base power drain. Put all drain rates in one configuration section.
- [ ] Clamp power at zero. On outage: open doors, disable lights and monitor, show the dark office, and begin a delayed attack. Allow survival if 6 AM arrives first; outage is not instant death.
- [ ] Implement Bonnie alone first: fixed room route, occasional movement opportunities, visible camera/doorway changes, left-door defense, attack when unprotected.
- [ ] Resolve win or loss exactly once. Stop movement/attack timers when the night ends, and reset all state on retry.
- [ ] Handle hidden tabs consistently: proposed behavior is to pause the night and audio while hidden, then reset the elapsed-time baseline on return.

**Finish condition:** the player can lose to Bonnie, block Bonnie with the left door, run out of power, win at 6 AM, and retry without previous timers leaking into the next run.

## Phase 3 — Complete the enemy system

Store routes, movement intervals, attack delays, and difficulty values as data. Keep visual assets separate from movement rules.

| Character | Proposed route / behavior | Defense and verification |
| --- | --- | --- |
| Bonnie | 1A → 1B → 2A → 2B → left doorway; optional 5/3 detours later | Left door blocks attack; blocked enemy eventually retreats |
| Chica | 1A → 1B → 7 → 6 → 4A → 4B → right doorway | Right door blocks attack; kitchen produces audio cues |
| Freddy | 1A → 1B → 7 → 6 → 4A → 4B → right-side attack | Right door blocks; predictable route and shorter warning near office |
| Foxy | 1C curtain progression → 2A sprint → left-side attack | Monitoring Cove delays progression; closed left door blocks sprint |

These are implementation proposals based on the supplied spec, not a claim of exact original-game AI. Tune them for a readable classroom game.

- [ ] Add Chica, then Freddy, then Foxy; verify each independently before enabling all four.
- [ ] Make camera images reflect actual enemy state. Room decoration in the supplied backgrounds must not be treated as a live enemy.
- [ ] Add occupied-room variants or transparent layers for the rooms each enemy uses. Stage composition must update as characters leave.
- [ ] Show Foxy's curtain progression clearly and give a brief readable hallway warning before an attack.
- [ ] Ensure closing the wrong door does not block an attack. Monitor visibility must not grant accidental invulnerability.
- [ ] Choose and document how simultaneous enemy attacks and a simultaneous 6 AM event resolve; proposed rule: reaching the night duration wins before processing a new attack at that same update.

**Finish condition:** all four have distinct, observable behaviors and correct defenses. One character occupying a room does not erase another character's state.

## Phase 4 — Five nights, saving, and sound

- [ ] Configure nights 1–5 with increasing movement frequency and shorter reaction windows. Keep power balance playable.
- [ ] Save the next unlocked night and earned stars locally after wins. Continue resumes the saved night from its start. Handle missing or invalid saves safely.
- [ ] Add ambience, static transitions, switches, footsteps, kitchen sounds, enemy cues, and jumpscares. Record sources when audio is added. Include mute/volume controls.
- [ ] Keep player HUD dynamic: time, night, power percentage, usage, selected camera, and door/light state.
- [ ] Add a clear loss/retry flow and a 6 AM transition before moving to the next night.

**Finish condition:** wins unlock the next night, Continue survives a browser refresh, and sound never begins before a user gesture or keeps playing after leaving a night.

## Phase 5 — Unlocks and polish

- [ ] Unlock Night 6 after Night 5 and Custom Night after Night 6; show earned stars.
- [ ] Make Custom Night configure each enemy's difficulty with documented limits.
- [ ] Add rare Golden Freddy as an optional easter egg after the main game is stable.
- [ ] Add title flicker, monitor transitions, subtle camera noise, jumpscare animation, and office movement/panning as time allows.
- [ ] Check controls at different window sizes. If panning is added, convert pointer position to scene coordinates so controls stay aligned.
- [ ] Add a short controls/help panel that matches the implemented game exactly.

**Finish condition:** full spec coverage is either implemented and checked or explicitly listed in the README as remaining work.

## Suggested code organization for the next phase

This describes future files; these modules do not exist yet.

| File | Responsibility |
| --- | --- |
| `index.html`, `styles.css` | Game container, controls, HUD, responsive layout |
| `src/main.js` | Startup, asset loading, screen transitions, update loop |
| `src/config.js` | Night duration, power rates, enemy routes, difficulty tables |
| `src/state.js` | Fresh-night state and win/loss transitions |
| `src/enemies.js` | Movement opportunities, Foxy progression, attack decisions |
| `src/render.js` | Display current scene, enemy layers, HUD, camera map |
| `src/input.js` | Mouse/keyboard actions and guards for current screen |
| `src/audio.js`, `src/save.js` | Sound lifecycle and validated browser saves |

Start with fewer files if that is easier, then split by responsibility. Avoid adding a package manager or build pipeline solely for this small project.

## Scope decisions and assumptions

| Topic | Current plan | Status |
| --- | --- | --- |
| FNAF 1 versus mixed controls | Use left/right doors, door lights, monitor, power; defer mask, music box, hallway flashlight stun | Provisional; original spec has conflicting mechanics |
| Camera count | 11 feeds: 1A, 1B, 1C, 2A, 2B, 3, 4A, 4B, 5, 6, 7 | From original spec; CAM 6 audio only |
| “Camera 11 / Prize Corner” | Do not add a twelfth room or replace a FNAF 1 room until mixed-mode scope is resolved | Pending clarification |
| Input | Mouse buttons; Space/S monitor; 1–9, 0, - mapped to the 11 feeds in the order above; M mute; Esc menu | Proposed mapping; = unused unless another action is chosen |
| Door/light shortcuts | A/D toggle left/right doors; Q/E hold left/right lights, released on keyup/blur | Proposed only; Q/E conflict with mask/music-box controls if those return |
| Look movement | Start with a fixed office view; add mouse panning after core loop | Proposed sequencing; final game spec requests mouse look |
| Rendering | Keep text and interactive UI outside background images | Needed for dynamic state |
| Game timing and AI | Configurable, classroom-friendly approximations | Proposed tuning, not exact original-game values |

Do not rewrite the source spec to hide a conflict. If scope changes, update this table, the image backlog, and the README together.

## Suggested 60-minute class session

Times are a suggested work budget, not a promise that the full game can be finished in one class. This document prepares the work; coding starts in the next phase.

| Minutes | Target |
| --- | --- |
| 0–10 | Review assets/scope; prioritize clean office, Stage, Cove, and basic enemy art |
| 10–20 | Wire title, office, HUD, and camera switching |
| 20–35 | Add doors, lights, timer, power, and Bonnie |
| 35–45 | Verify complete win/loss/retry loop; add Chica if stable |
| 45–52 | Add Freddy/Foxy only if the loop is stable; otherwise finish missing visuals and fix bugs |
| 52–57 | Run smoke checks and write an honest handoff status |
| 57–60 | Review changes, commit, push, and verify GitHub when ready to submit |

The minimum useful handoff is a working single night with documented remaining enemies/features. The full completion target remains all phases above.

## Manual smoke checks

- [ ] New Game starts a fresh night; Continue loads a valid unlocked night.
- [ ] All 11 camera selections work; every existing image loads; Kitchen has an audio-only screen.
- [ ] Doors/lights work on the correct side; held lights release on keyup and window blur.
- [ ] Power drains faster with more devices active and never becomes negative.
- [ ] Zero power disables devices and allows a delayed loss or 6 AM survival.
- [ ] Correct doors block the correct enemies; open/wrong doors permit attacks.
- [ ] Foxy's visible state matches monitoring/progression and his attack can be blocked.
- [ ] 6 AM wins once, loss occurs once, retry resets all state, and menu stops the old game.
- [ ] Five nights and unlocks behave correctly once implemented; saved progress handles refresh and invalid data.
- [ ] No console errors; UI remains usable when resizing; hidden-tab behavior matches documentation.

## Before giving the repository to the next student

Update README with what actually works, how to launch it, final controls, known bugs, the next specific task, and any departures from this plan. Check completed boxes only after verifying behavior. Keep unused supplied images in the repository. Use Source Control to review every change, then commit/push at submission time and verify the latest files on GitHub.
