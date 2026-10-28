import { CONFIG, CAMERAS } from './config.js';

export function createState(config = CONFIG, mode = 'menu') {
  return {
    mode, night: 1, elapsed: 0, power: config.startingPower,
    doors: { left: false, right: false }, lights: { left: false, right: false },
    monitor: false, camera: '1A', paused: false, hidden: false,
    outage: false, outageRemaining: null, outcome: null,
    enemies: Object.fromEntries(Object.entries(config.enemies).filter(([, e]) => e.enabled).map(([id, e]) => [id, {
      id, position: 0, moveIn: e.startAt, attackIn: null, blockedFor: 0,
      activity: 0, coveStage: 0, sprintIn: null,
    }])),
    events: [{ time: 0, text: 'Shift started. Check cameras, conserve power, and watch both doors.', tone: 'normal' }],
  };
}

export function notify(state, text, tone = 'normal') {
  state.events.push({ time: state.elapsed, text, tone });
  if (state.events.length > 6) state.events.shift();
}

export function usage(state) {
  return state.outage ? 0 : 1 + Number(state.monitor) + Object.values(state.doors).filter(Boolean).length + Object.values(state.lights).filter(Boolean).length;
}

export function drainRate(state, config = CONFIG) {
  if (state.outage) return 0;
  return config.power.base + Number(state.monitor) * config.power.monitor
    + Object.values(state.doors).filter(Boolean).length * config.power.door
    + Object.values(state.lights).filter(Boolean).length * config.power.light;
}

export function roomOf(enemy, config = CONFIG) {
  return config.enemies[enemy.id].route[enemy.position];
}

export function finish(state, result, cause = null) {
  if (state.mode !== 'playing' || state.outcome) return false;
  state.outcome = { result, cause, elapsed: state.elapsed };
  state.mode = result === 'win' ? 'won' : 'lost';
  state.monitor = false;
  state.lights.left = state.lights.right = false;
  state.paused = false;
  return true;
}

export function startOutage(state, config = CONFIG) {
  if (state.outage || state.mode !== 'playing') return;
  state.power = 0;
  state.outage = true;
  state.outageRemaining = config.outageAttackDelay;
  state.doors.left = state.doors.right = false;
  state.lights.left = state.lights.right = false;
  state.monitor = false;
  notify(state, 'Power failure. Doors open. All devices offline. Hold on until 6 AM.', 'danger');
}

export function act(state, action) {
  if (state.mode !== 'playing' || state.paused || state.hidden || state.outage) return false;
  switch (action.type) {
    case 'door':
      if (!['left', 'right'].includes(action.side)) return false;
      state.doors[action.side] = !state.doors[action.side];
      return true;
    case 'light':
      if (!['left', 'right'].includes(action.side)) return false;
      state.lights[action.side] = action.on ?? !state.lights[action.side];
      return true;
    case 'monitor':
      state.monitor = !state.monitor;
      return true;
    case 'camera':
      if (!state.monitor || !CAMERAS.some(c => c.id === action.id)) return false;
      state.camera = action.id;
      return true;
    default: return false;
  }
}

function interval(enemyConfig, random) {
  const [min, max] = enemyConfig.moveInterval;
  return min + random() * (max - min);
}

function atDoor(state, enemy, dt, config) {
  const rule = config.enemies[enemy.id];
  enemy.attackIn -= dt;
  enemy.blockedFor = state.doors[rule.side] ? enemy.blockedFor + dt : 0;
  if (enemy.blockedFor + 1e-8 >= rule.blockDuration) {
    enemy.position = rule.retreatIndex ?? 0;
    enemy.attackIn = null;
    enemy.blockedFor = 0;
    if (enemy.id === 'foxy') {
      enemy.activity = 0;
      enemy.coveStage = 0;
      enemy.sprintIn = null;
      state.power = Math.max(0, state.power - rule.knockPower);
    }
    const anotherThreat = Object.values(state.enemies).some(other =>
      other !== enemy && roomOf(other, config) === 'door' && config.enemies[other.id].side === rule.side);
    notify(state, `${rule.name} blocked at the ${rule.side} door and retreated. ${anotherThreat ? 'Another threat remains; keep this door closed.' : 'Safe to reopen.'}`, anotherThreat ? 'warning' : 'safe');
  } else if (enemy.attackIn <= 1e-8 && !state.doors[rule.side]) {
    finish(state, 'loss', enemy.id);
  }
}

function moveEnemy(state, enemy, dt, config, random) {
  const rule = config.enemies[enemy.id];
  if (roomOf(enemy, config) === 'door') {
    atDoor(state, enemy, dt, config);
    return;
  }
  enemy.moveIn -= dt;
  if (enemy.moveIn > 1e-8) return;
  enemy.position += 1;
  enemy.moveIn = interval(rule, random);
  if (roomOf(enemy, config) === 'door') {
    enemy.attackIn = rule.attackDelay;
    enemy.blockedFor = 0;
    notify(state, `Movement at the ${rule.side === 'left' ? 'west / left' : 'east / right'} doorway. Check the light; close that door!`, 'danger');
  } else {
    const room = CAMERAS.find(c => c.id === roomOf(enemy, config));
    notify(state, `CCTV movement detected. Check the feeds for ${rule.name}.`);
    if (room?.audioOnly) notify(state, 'Kitchen circuit: metallic clatter detected. Check CAM 6.', 'warning');
  }
}

function moveFoxy(state, enemy, dt, config) {
  const rule = config.enemies.foxy;
  if (enemy.position === 2) return atDoor(state, enemy, dt, config);
  if (enemy.position === 1) {
    enemy.sprintIn -= dt;
    if (enemy.sprintIn <= 1e-8) {
      enemy.position = 2;
      enemy.attackIn = rule.attackDelay;
      enemy.blockedFor = 0;
    }
    return;
  }
  if (state.elapsed < rule.startAt) return;
  const watching = state.monitor && state.camera === '1C';
  enemy.activity = Math.max(0, enemy.activity + dt * (watching ? -rule.watchedRecoveryPerSecond : rule.progressionPerSecond));
  const stage = rule.thresholds.filter(t => enemy.activity >= t).length;
  if (stage !== enemy.coveStage) {
    enemy.coveStage = stage;
    if (stage > 0) notify(state, 'Pirate Cove curtain movement. Check CAM 1C.', 'warning');
  }
  if (stage === 3) {
    enemy.position = 1;
    enemy.sprintIn = rule.sprintDelay;
    notify(state, 'Foxy is running down West Hall! Close the LEFT door now.', 'danger');
  }
}

// Subdivide elapsed time to preserve event order during slow frames / dev advances.
// This is time integration, not a frame-count clock. 6 AM wins a simultaneous tie.
export function advance(state, seconds, config = CONFIG, random = Math.random) {
  if (state.mode !== 'playing' || state.paused || state.hidden || !Number.isFinite(seconds) || seconds <= 0) return;
  let remaining = seconds;
  while (remaining > 1e-8 && state.mode === 'playing') {
    const dt = Math.min(remaining, config.maxStep);
    remaining -= dt;
    state.elapsed = Math.min(config.nightDuration, state.elapsed + dt);
    if (state.elapsed + 1e-8 >= config.nightDuration) {
      state.elapsed = config.nightDuration;
      finish(state, 'win');
      break;
    }
    if (state.outage) {
      state.outageRemaining -= dt;
      if (state.outageRemaining <= 1e-8) finish(state, 'loss', 'outage');
      continue;
    }
    state.power = Math.max(0, state.power - drainRate(state, config) * dt);
    if (state.power <= 1e-8) {
      startOutage(state, config);
      continue;
    }
    for (const enemy of Object.values(state.enemies)) {
      if (enemy.id === 'foxy') moveFoxy(state, enemy, dt, config);
      else moveEnemy(state, enemy, dt, config, random);
      if (state.mode !== 'playing') break;
    }
    if (state.mode === 'playing' && state.power <= 1e-8) startOutage(state, config);
  }
}
