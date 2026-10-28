import { runEngineTests } from './engine-tests.js';
import { CAMERAS } from '../src/config.js';
import { verifyArtwork } from './artwork-checks.js';

const results = runEngineTests();
const frame = document.getElementById('game-frame');
await new Promise(resolve => { if (frame.contentWindow.nightDebug) resolve(); else frame.addEventListener('load', resolve, { once: true }); });
const win = frame.contentWindow;
const doc = frame.contentDocument;
const debug = win.nightDebug;
const assert = (condition, message = 'Assertion failed') => { if (!condition) throw new Error(message); };
const click = id => doc.getElementById(id).click();
const key = (value, type = 'keydown') => doc.dispatchEvent(new win.KeyboardEvent(type, { key: value, bubbles: true }));
const start = () => click('start');
async function test(name, run) { try { await run(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, error: error.message }); } }

await test('Menu, office, all 11 camera buttons, and all keyboard camera shortcuts', () => {
  assert(!doc.getElementById('menu').hidden); start(); assert(!doc.getElementById('play').hidden);
  click('monitor-toggle'); assert(debug.snapshot().monitor);
  for (const camera of CAMERAS) {
    doc.querySelector(`[data-camera="${camera.id}"]`).click();
    assert(debug.snapshot().camera === camera.id && doc.getElementById('feed-name').textContent === camera.name);
    assert(doc.querySelector(`[data-camera="${camera.id}"]`).getAttribute('aria-pressed') === 'true');
  }
  for (const camera of CAMERAS) { key(camera.key); assert(debug.snapshot().camera === camera.id); }
  key('0'); assert(doc.getElementById('camera-fallback-title').textContent === 'AUDIO ONLY');
  assert(doc.getElementById('camera-art').hidden && !doc.getElementById('camera-enemies').children.length);
  key(' '); assert(!debug.snapshot().monitor);
});
await test('Every supplied camera background decodes successfully', async () => {
  const { ASSETS } = await import('../src/asset-paths.js');
  for (const id of ['1B', '2A', '2B', '3', '4A', '4B', '5', '7']) {
    const image = new Image(); image.src = `../${ASSETS.cameras[id]}`;
    await image.decode(); assert(image.naturalWidth > 0, `CAM ${id} did not load`);
  }
});
await test('Door/light click controls, keyboard holds, and blur cleanup', () => {
  click('left-door'); click('right-light'); let s = debug.snapshot();
  assert(s.doors.left && !s.doors.right && s.lights.right && !s.lights.left);
  key('d'); assert(debug.snapshot().doors.right); key('a'); assert(!debug.snapshot().doors.left);
  key('q'); assert(debug.snapshot().lights.left); key('q', 'keyup'); assert(!debug.snapshot().lights.left);
  key('e'); win.dispatchEvent(new win.Event('blur')); assert(!debug.snapshot().lights.right);
  assert(debug.snapshot().hidden); win.dispatchEvent(new win.Event('focus'));
});
await test('Office threat indicator and correct left-door defense', () => {
  click('menu-button'); start(); debug.threat(); click('left-light');
  assert(!doc.getElementById('left-threat').hidden && doc.getElementById('left-threat').textContent.includes('BONNIE'));
  click('left-door'); debug.advance(3.1);
  assert(debug.snapshot().mode === 'playing' && doc.getElementById('left-threat').hidden);
  assert(doc.getElementById('activity').textContent.includes('retreated'));
});
await test('Wrong-door loss, outcome stability, retry, and no stale attack after retry', () => {
  click('menu-button'); start(); debug.threat(); click('right-door'); click('monitor-toggle'); debug.advance(8);
  assert(debug.snapshot().mode === 'lost' && !doc.getElementById('result').hidden);
  const outcome = JSON.stringify(debug.snapshot().outcome); debug.advance(500); assert(JSON.stringify(debug.snapshot().outcome) === outcome);
  click('retry'); let s = debug.snapshot(); assert(s.elapsed === 0 && s.power === 100 && !s.outage && !s.outcome && !s.monitor && !s.doors.right);
  debug.advance(8); assert(debug.snapshot().mode === 'playing');
});
await test('Right-door defense and wrong-door losses for Chica and Freddy', () => {
  for (const id of ['chica', 'freddy']) {
    click('menu-button'); start(); debug.threat(id); click('right-light');
    assert(doc.getElementById('right-threat').textContent.includes(id.toUpperCase()));
    click('right-door'); debug.advance(3.1); assert(debug.snapshot().mode === 'playing' && doc.getElementById('right-threat').hidden);
    click('menu-button'); start(); debug.threat(id); click('left-door'); debug.advance(8);
    assert(debug.snapshot().outcome.cause === id); click('retry');
  }
});
await test('Foxy doorway attack can be blocked on the left and not on the right', () => {
  click('menu-button'); start(); debug.threat('foxy'); click('left-door'); debug.advance(0.6);
  assert(debug.snapshot().mode === 'playing' && debug.snapshot().enemies.foxy.position === 0);
  click('menu-button'); start(); debug.threat('foxy'); click('right-door'); debug.advance(1.1);
  assert(debug.snapshot().outcome.cause === 'foxy'); click('retry');
});
await test('Foxy sprint uses the full West Hall artwork with a single nameplate', async () => {
  click('menu-button'); start(); debug.threat('foxy', '2A'); click('monitor-toggle');
  doc.querySelector('[data-camera="2A"]').click();
  const { ASSETS } = await import('../src/asset-paths.js');
  const image = new Image(); image.src = `../${ASSETS.foxyRun}`; await image.decode();
  await new Promise(resolve => setTimeout(resolve, 60));
  assert(doc.getElementById('camera-art').getAttribute('src') === ASSETS.foxyRun);
  const marker = doc.querySelector('[data-enemy="foxy"]');
  assert(marker && !marker.querySelector('img') && marker.textContent.includes('WEST HALL SPRINT'));
  assert(doc.getElementById('activity').textContent.includes('Close the LEFT door'));
  click('monitor-toggle'); click('left-door'); debug.advance(6); assert(debug.snapshot().mode === 'playing');
  click('menu-button'); start();
});
await test('Opaque office variants are clipped to independent sides of the shared canvas', () => {
  click('left-door'); click('right-door'); click('left-light'); click('right-light');
  const left = win.getComputedStyle(doc.getElementById('left-door-art')).clipPath;
  const right = win.getComputedStyle(doc.getElementById('right-door-art')).clipPath;
  assert(left === 'inset(0px 76% 0px 0px)' && right === 'inset(0px 0px 0px 76%)');
  const s = debug.snapshot(); assert(s.doors.left && s.doors.right && s.lights.left && s.lights.right);
});
await test('Power outage disables devices before a delayed loss', () => {
  click('left-door'); click('right-door'); click('monitor-toggle'); debug.power(0);
  let s = debug.snapshot(); assert(s.outage && !s.doors.left && !s.doors.right && !s.monitor);
  assert(doc.getElementById('left-door').disabled && doc.getElementById('monitor-toggle').disabled);
  debug.advance(10); assert(debug.snapshot().mode === 'playing'); debug.advance(9); assert(debug.snapshot().outcome.cause === 'outage');
});
await test('6 AM win during outage, replay reset, and return to menu', () => {
  click('retry'); debug.nearDawn(); debug.power(0); debug.advance(5);
  assert(debug.snapshot().mode === 'won' && doc.getElementById('result-title').textContent === '6:00 AM');
  click('retry'); assert(debug.snapshot().elapsed === 0 && debug.snapshot().power === 100);
  key('Escape'); debug.advance(400); assert(debug.snapshot().mode === 'menu' && !doc.getElementById('menu').hidden);
});
await test('Manual pause freezes the simulation; resume restores inputs', () => {
  start(); key('p'); const before = JSON.stringify(debug.snapshot()); debug.advance(30);
  assert(before === JSON.stringify(debug.snapshot()) && !doc.getElementById('pause-overlay').hidden);
  click('resume'); debug.advance(1); assert(debug.snapshot().elapsed > 0);
});
await test('Visibility-change handler freezes a hidden tab and preserves a manual pause', () => {
  let hidden = true;
  Object.defineProperty(doc, 'hidden', { configurable: true, get: () => hidden });
  try {
    doc.dispatchEvent(new win.Event('visibilitychange'));
    const before = JSON.stringify(debug.snapshot()); debug.advance(100);
    assert(debug.snapshot().hidden && JSON.stringify(debug.snapshot()) === before);
    hidden = false; doc.dispatchEvent(new win.Event('visibilitychange'));
    debug.advance(1); assert(!debug.snapshot().hidden && debug.snapshot().elapsed > 1);
    key('p'); hidden = true; doc.dispatchEvent(new win.Event('visibilitychange'));
    hidden = false; doc.dispatchEvent(new win.Event('visibilitychange'));
    assert(debug.snapshot().paused && !doc.getElementById('pause-overlay').hidden);
    click('resume');
  } finally { delete doc.hidden; doc.dispatchEvent(new win.Event('visibilitychange')); }
});
await test('No-art fallback mode supports all feeds, threat defense, and a complete result flow', async () => {
  const fallback = document.createElement('iframe');
  fallback.title = 'Fallback rendering test'; fallback.style.display = 'none';
  fallback.src = '../?dev=1&manual=1&noart=1';
  const loaded = new Promise(resolve => fallback.addEventListener('load', resolve, { once: true }));
  document.body.append(fallback); await loaded;
  try {
    const d = fallback.contentDocument; const api = fallback.contentWindow.nightDebug;
    d.getElementById('start').click(); assert(!d.getElementById('office-fallback').hidden);
    d.getElementById('monitor-toggle').click();
    for (const camera of CAMERAS) {
      d.querySelector(`[data-camera="${camera.id}"]`).click();
      assert(!d.getElementById('camera-fallback').hidden);
      assert(d.getElementById('camera-fallback-title').textContent === (camera.audioOnly ? 'AUDIO ONLY' : 'ROOM ART PENDING'));
    }
    d.getElementById('monitor-toggle').click(); api.threat(); d.getElementById('left-light').click();
    assert(d.getElementById('left-threat').textContent.includes('TEMPORARY THREAT INDICATOR'));
    d.getElementById('left-door').click(); api.advance(3.1); assert(api.snapshot().mode === 'playing');
    api.nearDawn(); api.power(0); api.advance(5); assert(api.snapshot().mode === 'won');
    d.getElementById('retry').click(); assert(api.snapshot().power === 100);
  } finally { fallback.remove(); }
});
await test('Live animation loop pauses without catch-up and retry cancels the old run', async () => {
  const live = document.createElement('iframe');
  live.title = 'Live animation lifecycle test'; live.style.width = '390px'; live.style.height = '300px';
  live.src = '../?dev=1&noart=1';
  const loaded = new Promise(resolve => live.addEventListener('load', resolve, { once: true }));
  document.body.append(live); await loaded;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const d = live.contentDocument; const w = live.contentWindow; const api = w.nightDebug;
  let hidden = false;
  Object.defineProperty(d, 'hidden', { configurable: true, get: () => hidden });
  try {
    d.getElementById('start').click(); await wait(120);
    assert(api.snapshot().elapsed > 0, 'Automatic loop did not advance');
    hidden = true; d.dispatchEvent(new w.Event('visibilitychange'));
    const before = JSON.stringify(api.snapshot()); await wait(220);
    assert(JSON.stringify(api.snapshot()) === before, 'Hidden loop advanced');
    const elapsed = api.snapshot().elapsed;
    hidden = false; d.dispatchEvent(new w.Event('visibilitychange')); await wait(80);
    assert(api.snapshot().elapsed - elapsed < 0.19, 'Hidden time caught up on resume');
    d.getElementById('menu-button').click(); d.getElementById('start').click();
    d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'p', bubbles: true }));
    const reset = JSON.stringify(api.snapshot()); await wait(100);
    assert(api.snapshot().elapsed < 0.02 && api.snapshot().power > 99.99 && JSON.stringify(api.snapshot()) === reset, 'Old run leaked into fresh paused state');
  } finally { delete d.hidden; live.remove(); }
});
await verifyArtwork({ frame, win, doc, debug, click, start, test, assert });
await test('16:9 game area fits narrow and wide windows without horizontal overflow', async () => {
  for (const width of [390, 1280]) {
    frame.style.width = `${width}px`; frame.style.maxWidth = 'none';
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const bounds = doc.getElementById('game').getBoundingClientRect();
    assert(Math.abs(bounds.width / bounds.height - 16 / 9) < 0.02);
    assert(doc.documentElement.scrollWidth <= width + 1, `Horizontal overflow at ${width}px`);
    for (const id of ['left-door', 'right-door', 'left-light', 'right-light', 'monitor-toggle']) {
      const b = doc.getElementById(id).getBoundingClientRect(); assert(b.left >= bounds.left && b.right <= bounds.right && b.bottom <= bounds.bottom);
    }
  }
  frame.style.width = '100%'; frame.style.maxWidth = '';
});

for (const result of results) {
  const li = document.createElement('li'); li.className = result.pass ? 'pass' : 'fail';
  li.textContent = `${result.pass ? 'PASS' : 'FAIL'} / ${result.name}${result.error ? `: ${result.error}` : ''}`;
  document.getElementById('results').append(li);
}
const failed = results.filter(r => !r.pass);
document.getElementById('summary').textContent = `${results.length - failed.length}/${results.length} passed · ${failed.length} failed`;
document.title = `${failed.length ? 'FAIL' : 'PASS'} · Night 1 browser regression`;
window.testResults = results;
// Leave the embedded game at the title, with no old animation loop running.
click('menu-button');
