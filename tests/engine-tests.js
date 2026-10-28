import { CONFIG } from '../src/config.js';
import { createState, advance, act, drainRate, startOutage, roomOf, finish } from '../src/engine.js';

export function runEngineTests() {
  const results = [];
  const assert = (condition, message = 'Assertion failed') => { if (!condition) throw new Error(message); };
  const near = (a, b) => assert(Math.abs(a - b) < 0.01, `${a} differs from ${b}`);
  function test(name, run) { try { run(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, error: error.message }); } }
  function configFor(...ids) {
    const config = structuredClone(CONFIG);
    for (const [id, rule] of Object.entries(config.enemies)) rule.enabled = ids.includes(id);
    return config;
  }
  function putAtDoor(state, id, config) {
    const enemy = state.enemies[id];
    enemy.position = config.enemies[id].route.length - 1;
    enemy.attackIn = config.enemies[id].attackDelay;
    enemy.blockedFor = 0;
  }
  const play = config => createState(config, 'playing');
  const step = (state, seconds, config) => advance(state, seconds, config, () => 0.5);

  test('Elapsed-time integration agrees across large and small updates', () => {
    const config = configFor('bonnie'); const a = play(config); const b = play(config);
    step(a, 80, config); for (let i = 0; i < 800; i++) step(b, 0.1, config);
    near(a.elapsed, b.elapsed); near(a.power, b.power);
    assert(a.enemies.bonnie.position === b.enemies.bonnie.position);
  });
  test('Independent devices add the configured power costs', () => {
    const s = play(CONFIG); const baseline = drainRate(s);
    act(s, { type: 'door', side: 'left' }); act(s, { type: 'light', side: 'right' }); act(s, { type: 'monitor' });
    near(drainRate(s), baseline + CONFIG.power.door + CONFIG.power.light + CONFIG.power.monitor);
    assert(!s.doors.right && !s.lights.left && s.doors.left && s.lights.right);
  });
  test('Bonnie naturally follows his route and retreats from the left door', () => {
    const config = configFor('bonnie'); const s = play(config); step(s, 96, config);
    assert(roomOf(s.enemies.bonnie, config) === 'door'); act(s, { type: 'door', side: 'left' }); step(s, 3.1, config);
    assert(s.mode === 'playing' && roomOf(s.enemies.bonnie, config) !== 'door');
    assert(s.events.at(-1).text.includes('retreated'));
  });
  test('The wrong door permits Bonnie to attack, even behind the monitor', () => {
    const config = configFor('bonnie'); const s = play(config);
    putAtDoor(s, 'bonnie', config); act(s, { type: 'door', side: 'right' }); act(s, { type: 'monitor' }); step(s, 7.1, config);
    assert(s.mode === 'lost' && s.outcome.cause === 'bonnie');
  });
  test('Chica and Freddy each retreat at the right door; the left door cannot defend', () => {
    for (const id of ['chica', 'freddy']) {
      const config = configFor(id); const defended = play(config); const exposed = play(config);
      putAtDoor(defended, id, config); putAtDoor(exposed, id, config);
      act(defended, { type: 'door', side: 'right' }); act(exposed, { type: 'door', side: 'left' });
      step(defended, 3.1, config); step(exposed, config.enemies[id].attackDelay + 0.1, config);
      assert(defended.mode === 'playing' && roomOf(defended.enemies[id], config) !== 'door');
      assert(exposed.outcome?.cause === id);
    }
  });
  test('Kitchen route occupancy is distinct and reaches both right-side routes', () => {
    for (const id of ['chica', 'freddy']) {
      const config = configFor(id); const s = play(config);
      const rule = config.enemies[id];
      step(s, rule.startAt + (rule.moveInterval[0] + rule.moveInterval[1]) / 2 + 0.1, config);
      assert(roomOf(s.enemies[id], config) === '7');
      step(s, (rule.moveInterval[0] + rule.moveInterval[1]) / 2, config);
      assert(roomOf(s.enemies[id], config) === '6');
    }
  });
  test('Outage opens doors, disables inputs, and delays the attack', () => {
    const config = configFor(); const s = play(config);
    s.doors.left = s.doors.right = s.lights.left = s.lights.right = s.monitor = true;
    s.power = 0.001; step(s, 0.1, config);
    assert(s.outage && s.power === 0 && s.mode === 'playing');
    assert(!s.doors.left && !s.doors.right && !s.lights.left && !s.lights.right && !s.monitor);
    assert(!act(s, { type: 'door', side: 'left' })); step(s, 17, config); assert(s.mode === 'playing');
    step(s, 2, config); assert(s.outcome.cause === 'outage' && s.power === 0);
  });
  test('6 AM wins a simultaneous outage attack', () => {
    const config = configFor(); const s = play(config); s.elapsed = config.nightDuration - 1;
    startOutage(s, config); s.outageRemaining = 1; step(s, 1, config);
    assert(s.mode === 'won' && s.outcome.result === 'win');
  });
  test('6 AM wins a simultaneous enemy attack', () => {
    const config = configFor('bonnie'); const s = play(config); s.elapsed = config.nightDuration - 1;
    putAtDoor(s, 'bonnie', config); s.enemies.bonnie.attackIn = 1; step(s, 1, config);
    assert(s.mode === 'won');
  });
  test('Outcomes resolve once; further updates and actions cannot change them', () => {
    const s = play(CONFIG); finish(s, 'loss', 'bonnie'); const outcome = JSON.stringify(s.outcome);
    assert(!finish(s, 'win')); step(s, 500, CONFIG); assert(!act(s, { type: 'monitor' }));
    assert(JSON.stringify(s.outcome) === outcome && s.elapsed === 0);
  });
  test('New state resets power, time, devices, enemies, and outcome', () => {
    const old = play(CONFIG); old.power = 0; old.doors.left = true; finish(old, 'loss', 'outage');
    const fresh = play(CONFIG); assert(fresh.power === 100 && fresh.elapsed === 0 && fresh.outcome === null);
    assert(!fresh.doors.left && !fresh.monitor && !fresh.outage && fresh.enemies.bonnie.position === 0);
    fresh.enemies.bonnie.position = 2; assert(old.enemies.bonnie.position === 0);
  });
  test('Paused and hidden states freeze time, power, and enemy clocks', () => {
    for (const flag of ['paused', 'hidden']) {
      const s = play(CONFIG); s[flag] = true; const before = JSON.stringify(s);
      step(s, 999, CONFIG); assert(JSON.stringify(s) === before && !act(s, { type: 'monitor' }));
    }
  });
  test('Foxy progresses, warns in West Hall, and is blocked only on the left', () => {
    const config = configFor('foxy'); const s = play(config); step(s, 261, config);
    assert(s.enemies.foxy.position === 1 && s.enemies.foxy.coveStage === 3, `Foxy did not sprint: ${JSON.stringify(s.enemies.foxy)}`);
    assert(s.events.at(-1).text.includes('running'), 'Sprint warning missing');
    act(s, { type: 'door', side: 'left' }); step(s, 6, config);
    assert(s.mode === 'playing' && s.enemies.foxy.position === 0 && s.enemies.foxy.coveStage === 0, 'Left door did not reset Foxy');
    const wrong = play(config); putAtDoor(wrong, 'foxy', config); wrong.doors.right = true;
    step(wrong, 1.1, config); assert(wrong.outcome?.cause === 'foxy', `Wrong door blocked Foxy: ${JSON.stringify(wrong.enemies.foxy)}`);
  });
  test('Watching Pirate Cove holds Foxy back; watching another feed does not', () => {
    const config = configFor('foxy'); const watched = play(config); const ignored = play(config);
    watched.monitor = ignored.monitor = true; watched.camera = '1C'; ignored.camera = '1A';
    step(watched, 220, config); step(ignored, 220, config);
    assert(watched.enemies.foxy.activity === 0 && watched.enemies.foxy.coveStage === 0);
    assert(ignored.enemies.foxy.coveStage === 2);
  });
  test('All four can coexist through a complete survivable Night 1', () => {
    const config = configFor('bonnie', 'chica', 'freddy', 'foxy'); const s = play(config);
    for (let i = 0; i < 3601 && s.mode === 'playing'; i++) {
      for (const side of ['left', 'right']) s.doors[side] = Object.values(s.enemies).some(e => roomOf(e, config) === 'door' && config.enemies[e.id].side === side);
      step(s, 0.1, config);
    }
    assert(s.mode === 'won' && s.power > 0, `Ended ${s.mode}, power ${s.power}`);
    assert(Object.keys(s.enemies).length === 4);
  });
  test('One retreat does not claim the doorway is safe while another enemy remains', () => {
    const config = configFor('chica', 'freddy'); const s = play(config);
    putAtDoor(s, 'chica', config); putAtDoor(s, 'freddy', config);
    s.enemies.chica.blockedFor = 2; s.doors.right = true; step(s, 1.1, config);
    assert(roomOf(s.enemies.chica, config) !== 'door' && roomOf(s.enemies.freddy, config) === 'door');
    assert(s.events.at(-1).text.includes('keep this door closed'));
  });
  return results;
}
