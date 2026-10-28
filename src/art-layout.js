// Visual placement only: percentages of the complete camera canvas.
// x = horizontal center, feet = floor/stage contact, height = whole sprite.
// Fixed identities keep remaining characters in place when another leaves.
export const CAMERA_PLACEMENTS = {
  '1A': {
    bonnie: { x: 39, feet: 45, height: 31 },
    freddy: { x: 49, feet: 49, height: 33 },
    chica: { x: 59, feet: 53, height: 34 },
  },
  '1B': {
    bonnie: { x: 49, feet: 69, height: 33 },
    freddy: { x: 57, feet: 61, height: 28 },
    chica: { x: 63, feet: 54, height: 23 },
  },
  '2A': { bonnie: { x: 59, feet: 66, height: 38 } },
  '2B': { bonnie: { x: 57, feet: 69, height: 42 } },
  '4A': {
    chica: { x: 60, feet: 69, height: 38 },
    freddy: { x: 56, feet: 58, height: 27 },
  },
  '4B': {
    chica: { x: 59, feet: 70, height: 44 },
    freddy: { x: 60, feet: 54, height: 30 },
  },
  '7': {
    chica: { x: 55, feet: 68, height: 32 },
    freddy: { x: 61, feet: 58, height: 27 },
  },
};

export function cameraPlacement(camera, character) {
  return CAMERA_PLACEMENTS[camera]?.[character] ?? { x: 48, feet: 68, height: 36 };
}
