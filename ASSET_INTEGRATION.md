# Generated artwork: integration handoff

23 new images are saved locally under the filenames planned in ASSETS.md. Together with the original 10 images, there are 33 images in the manifest. The built-in image generation tool produced these files; no specific model identifier was exposed by that tool. Exact prompts are saved in `assets/image-generation-prompts.json`.

## Quick message for the coding session

> The generated images are now saved at the paths in src/asset-paths.js. Read ASSET_INTEGRATION.md and the updated assets/asset-manifest.json, then refresh/preload the new images. Important: office door, light, and doorway-threat images are OPAQUE FULL-FRAME STATES, not transparent cutouts. Position them across the full office canvas and clip each to its respective side so independent controls can coexist. Keep the character sprites transparent and preserve their aspect ratios. The Cove state images already contain Foxy where appropriate, and the West Hall sprint image also contains him; do not add a second Foxy sprite over either. Verify the artwork in the game without changing gameplay rules just to fit an image. Keep changes local until submission.

## What exists

- `assets/images/office/`: clean base, left/right closed doors, left/right illuminated empty doorways, Bonnie-left and Chica-right threats, power-out office. Eight files total.
- `assets/images/cameras/cam-1a-show-stage.png`: empty stage for character compositing.
- `assets/images/cameras/cam-1c-pirate-cove-{closed,peeking,emerged,empty}.png`: four full camera states.
- `assets/images/animatronics/{freddy,bonnie,chica,foxy}-camera.png`: four transparent full-body sprites.
- `assets/images/animatronics/foxy-west-hall.png`: full-frame sprint warning.
- `assets/images/jumpscares/{freddy,bonnie,chica,foxy}.png`: four full-frame jumpscare stills.
- `assets/images/menu/title-background.png`: clean title background with empty space on the left for live text.

These brace expressions describe filename sets, not literal filenames. Exact individual paths are in the manifest.

## Office composition

All eight office images share a 1672 × 941 canvas and the same intended viewpoint. They are opaque RGB scenes. Do not squeeze the complete image into a small doorway element, and do not stack complete opaque scenes without clipping: the later scene would hide the other side's state.

1. Display `office-base.png` across the full office layer.
2. For each side, choose one state independently. A closed door takes priority. Otherwise, when its light is on, choose the matching threat image if Bonnie/Chica is at that doorway, or the empty light image if not. With its light off, show the base side.
3. Place the selected state image at the exact same size and origin as the base. Clip LEFT variants to the leftmost approximately 24% of the frame and RIGHT variants to the rightmost approximately 24%. This keeps the unrelated center and opposite door from covering the base.
4. Starting CSS clip regions: left `inset(0 76% 0 0)`, right `inset(0 0 0 76%)`. These are integration suggestions, not tested production masks. Check seams at the actual game size and adjust if needed.
5. During outage, display `office-power-out.png` as the whole scene and hide all door/light/threat layers.

The generated scenes visually match closely but are not guaranteed pixel-identical outside edited areas. Clipping minimizes visible changes in unaffected areas. Actual simultaneous-state composition still needs browser verification. Future transparent cutouts or refined masks can replace this approach without changing the core mechanics.

Keep HUD, controls, power percentages, and time in separate live UI layers. No new office image contains a fixed game HUD.

## Camera composition

The supplied rooms, new Stage, four Cove states, and Foxy sprint scene are approximately 16:9. New landscape files are all 1672 × 941. Supplied East Hall is 1672 × 940; fit it into the shared frame consistently. CAM 6 stays audio only.

Character sprites use 1024 × 1536 canvases with alpha. Their corner pixels are fully transparent. Render using their native aspect ratio and scale them as whole figures; do not stretch them across the frame. Adjust placement/scale per room so their feet meet the floor or stage and they do not float over foreground objects. Start with three separate placements on Stage so each character can leave independently.

The Cove state images already show Foxy in peeking/emerged states. Use one state image based on game state and avoid adding another full-body Foxy over it. A nameplate may remain if useful for the prototype. Likewise, use the full-frame Foxy West Hall image for his sprint instead of the empty hallway plus an extra duplicate sprite.

Room-specific poses and occlusion masks are not included. These four reusable sprites are the essential first set; add more poses only where the first version needs them.

## Menu and loss screens

The clean title background leaves the left side dark for real title text, New Game, Continue, and unlocks. Keep all buttons and stars live. Original screenshots remain under `assets/images/references/`.

Each jumpscare file is one still image, not a sprite sheet or animated clip. Code may add a short zoom/shake transition, but do not label these files as full animations. Audio is not supplied. Golden Freddy remains an optional future asset.

## Validation completed

- All 23 generated PNGs were visually inspected and decoded successfully.
- Every new landscape image is 1672 × 941; each character sprite is 1024 × 1536.
- The four sprites contain alpha and fully transparent corner pixels.
- All generated files have dimensions and SHA-256 hashes in the manifest.
- Original supplied files are retained; game source files were not edited by the image-generation session.

The coding session should verify final scaling, clipping, sprite placement, state switching, and loading in the browser. Artwork availability does not by itself establish that gameplay or visual integration has passed testing. Nothing was pushed to GitHub by this session.
