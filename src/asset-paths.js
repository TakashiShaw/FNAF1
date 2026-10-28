// All gameplay image paths live here. Optional artwork loads on the next refresh.
// Planned paths follow ASSETS.md. Reference screenshots are deliberately unused.
export const ASSETS = {
  office: 'assets/images/office/office-base.png',
  title: 'assets/images/menu/title-background.png',
  outage: 'assets/images/office/office-power-out.png',
  doors: {
    left: 'assets/images/office/door-left-closed.png',
    right: 'assets/images/office/door-right-closed.png',
  },
  lights: {
    left: 'assets/images/office/light-left.png',
    right: 'assets/images/office/light-right.png',
  },
  doorway: {
    bonnie: 'assets/images/office/bonnie-left.png',
    chica: 'assets/images/office/chica-right.png',
  },
  cameras: {
    '1A': 'assets/images/cameras/cam-1a-show-stage.png',
    '1B': 'assets/images/cameras/cam-1b-dining-area.png',
    '1C': 'assets/images/cameras/cam-1c-pirate-cove-closed.png',
    '2A': 'assets/images/cameras/cam-2a-west-hall.png',
    '2B': 'assets/images/cameras/cam-2b-west-hall-corner.png',
    '3': 'assets/images/cameras/cam-3-supply-closet.png',
    '4A': 'assets/images/cameras/cam-4a-east-hall.png',
    '4B': 'assets/images/cameras/cam-4b-east-hall-corner.png',
    '5': 'assets/images/cameras/cam-5-backstage.png',
    '7': 'assets/images/cameras/cam-7-restrooms.png',
  },
  cove: [
    'assets/images/cameras/cam-1c-pirate-cove-closed.png',
    'assets/images/cameras/cam-1c-pirate-cove-peeking.png',
    'assets/images/cameras/cam-1c-pirate-cove-emerged.png',
    'assets/images/cameras/cam-1c-pirate-cove-empty.png',
  ],
  characters: Object.fromEntries(['bonnie', 'chica', 'freddy', 'foxy'].map(id => [id, `assets/images/animatronics/${id}-camera.png`])),
  foxyRun: 'assets/images/animatronics/foxy-west-hall.png',
  jumpscares: Object.fromEntries(['bonnie', 'chica', 'freddy', 'foxy'].map(id => [id, `assets/images/jumpscares/${id}.png`])),
};

const collectPaths = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(collectPaths);
export const GAMEPLAY_IMAGE_PATHS = [...new Set(collectPaths(ASSETS))];
