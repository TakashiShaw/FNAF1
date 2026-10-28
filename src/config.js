export const CAMERAS = [
  { id: '1A', name: 'Show Stage', key: '1', column: 2, row: 1 },
  { id: '1B', name: 'Dining Area', key: '2', column: 2, row: 2 },
  { id: '1C', name: 'Pirate Cove', key: '3', column: 1, row: 3 },
  { id: '2A', name: 'West Hall', key: '4', column: 1, row: 4 },
  { id: '2B', name: 'West Hall Corner', key: '5', column: 1, row: 5 },
  { id: '3', name: 'Supply Closet', key: '6', column: 2, row: 4 },
  { id: '4A', name: 'East Hall', key: '7', column: 3, row: 4 },
  { id: '4B', name: 'East Hall Corner', key: '8', column: 3, row: 5 },
  { id: '5', name: 'Backstage', key: '9', column: 1, row: 1 },
  { id: '6', name: 'Kitchen', key: '0', column: 3, row: 3, audioOnly: true },
  { id: '7', name: 'Restrooms', key: '-', column: 3, row: 2 },
];

// Seconds and percentage points per second; no timing depends on frame counts.
export const CONFIG = {
  nightDuration: 360,
  startingPower: 100,
  maxStep: 0.05,
  power: { base: 0.14, door: 0.22, light: 0.13, monitor: 0.10 },
  outageAttackDelay: 18,
  enemies: {
    bonnie: {
      enabled: true, name: 'Bonnie', side: 'left', color: '#b79ae8',
      route: ['1A', '1B', '2A', '2B', 'door'],
      startAt: 35, moveInterval: [16, 24], attackDelay: 7, blockDuration: 3,
      retreatIndex: 1,
    },
    chica: {
      enabled: true, name: 'Chica', side: 'right', color: '#e3c56e',
      route: ['1A', '1B', '7', '6', '4A', '4B', 'door'],
      startAt: 65, moveInterval: [18, 26], attackDelay: 7, blockDuration: 3,
      retreatIndex: 2,
    },
    freddy: {
      enabled: true, name: 'Freddy', side: 'right', color: '#d8a07b',
      route: ['1A', '1B', '7', '6', '4A', '4B', 'door'],
      startAt: 135, moveInterval: [22, 28], attackDelay: 5, blockDuration: 3,
      retreatIndex: 1,
    },
    foxy: {
      enabled: true, name: 'Foxy', side: 'left', color: '#e78674',
      route: ['1C', '2A', 'door'], startAt: 75,
      progressionPerSecond: 0.46, watchedRecoveryPerSecond: 0.9,
      thresholds: [25, 55, 85], sprintDelay: 5, attackDelay: 1,
      blockDuration: 0.5, knockPower: 3,
    },
  },
};
