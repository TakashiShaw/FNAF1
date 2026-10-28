import { ASSETS, GAMEPLAY_IMAGE_PATHS } from './asset-paths.js';
import { cameraPlacement } from './art-layout.js';
import { CONFIG, CAMERAS } from './config.js';
import { roomOf, usage } from './engine.js';

// Missing files are optional. Cache each result and render a named fallback.
class AssetStore {
  constructor(onChange, forcePlaceholders) { this.cache = new Map(); this.onChange = onChange; this.forcePlaceholders = forcePlaceholders; }
  get(path) {
    if (!path) return null;
    if (this.forcePlaceholders) return { ready: false, failed: true };
    if (!this.cache.has(path)) {
      const record = { ready: false, failed: false };
      this.cache.set(path, record);
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => { record.ready = true; this.onChange(); };
      image.onerror = () => { record.failed = true; console.warn(`[art placeholder] Missing optional image: ${path}`); this.onChange(); };
      image.src = path;
      record.image = image;
    }
    return this.cache.get(path);
  }
}

export function createRenderer(onAssetChange, config = CONFIG, { forcePlaceholders = false } = {}) {
  const els = Object.fromEntries([...document.querySelectorAll('[id]')].map(el => [el.id, el]));
  const assets = new AssetStore(onAssetChange, forcePlaceholders);
  // Warm optional state images without holding up the title or simulation.
  for (const path of GAMEPLAY_IMAGE_PATHS) assets.get(path);
  const show = (id, value) => { els[id].hidden = !value; };
  const text = (id, value) => { if (els[id].textContent !== value) els[id].textContent = value; };
  function art(id, path, enabled = true) {
    const record = enabled ? assets.get(path) : null;
    const ready = Boolean(enabled && record?.ready);
    show(id, ready);
    if (ready && els[id].getAttribute('src') !== path) els[id].src = path;
    return ready;
  }

  const cameraButtons = CAMERAS.map(camera => {
    const button = document.createElement('button');
    button.className = 'camera-choice';
    button.dataset.camera = camera.id;
    button.style.gridColumn = camera.column;
    button.style.gridRow = camera.row;
    button.setAttribute('aria-label', `CAM ${camera.id} ${camera.name}, shortcut ${camera.key}`);
    const label = document.createElement('span');
    label.textContent = `CAM ${camera.id}`;
    const key = document.createElement('small');
    key.textContent = camera.key;
    button.append(label, key);
    els['map-grid'].append(button);
    return button;
  });
  let markerKey = '';
  let lastUsage = -1;

  function renderEnemyMarkers(state) {
    const here = Object.values(state.enemies).filter(e => roomOf(e, config) === state.camera);
    const key = state.camera + here.map(e => `${e.id}:${assets.get(e.id === 'foxy' && e.position === 1 ? ASSETS.foxyRun : ASSETS.characters[e.id])?.ready}:${e.coveStage}`).join('|');
    if (key === markerKey) return;
    markerKey = key;
    els['camera-enemies'].replaceChildren();
    els['camera-enemy-labels'].replaceChildren();
    if (state.camera === '6') return; // Audio-only means no character pictures, either.
    for (const enemy of here) {
      const rule = config.enemies[enemy.id];
      const path = enemy.id === 'foxy' && enemy.position === 1 ? ASSETS.foxyRun : ASSETS.characters[enemy.id];
      // Cove backgrounds already contain their curtain/character state. A second
      // standing Foxy portrait would make a closed curtain look occupied outside.
      const ready = enemy.id === 'foxy' && ['1C', '2A'].includes(state.camera) ? false : assets.get(path)?.ready;
      const marker = document.createElement('div');
      marker.className = 'enemy-marker';
      marker.dataset.character = enemy.id;
      const placement = cameraPlacement(state.camera, enemy.id);
      marker.style.left = `${placement.x}%`;
      marker.style.top = `${placement.feet - placement.height}%`;
      marker.style.height = `${placement.height}%`;
      marker.style.zIndex = String(placement.feet);
      if (ready) {
        marker.classList.add('has-art');
        const image = document.createElement('img');
        image.src = path;
        image.alt = rule.name;
        marker.append(image);
      }
      const label = document.createElement('div');
      label.className = 'enemy-label';
      label.dataset.enemy = enemy.id;
      label.style.setProperty('--enemy-color', rule.color);
      const title = document.createElement('strong');
      title.textContent = rule.name.toUpperCase();
      const detail = document.createElement('small');
      detail.textContent = ready ? 'LIVE POSITION' : 'LIVE POSITION / TEMPORARY INDICATOR';
      if (enemy.id === 'foxy') detail.textContent = state.camera === '1C'
        ? `COVE: ${['CLOSED', 'PEEKING', 'EMERGED', 'EMPTY / RUNNING'][enemy.coveStage]}`
        : 'WEST HALL SPRINT / CLOSE LEFT DOOR';
      label.append(title, detail);
      els['camera-enemies'].append(marker);
      els['camera-enemy-labels'].append(label);
    }
  }

  function renderOffice(state) {
    const outageArt = state.outage && assets.get(ASSETS.outage)?.ready;
    show('office-fallback', !art('office-art', outageArt ? ASSETS.outage : ASSETS.office));
    for (const side of ['left', 'right']) {
      const threats = Object.values(state.enemies).filter(e => roomOf(e, config) === 'door' && config.enemies[e.id].side === side);
      const closed = state.doors[side] && !state.outage;
      const lit = state.lights[side] && !state.outage && !closed;
      const threat = threats.find(enemy => ASSETS.doorway[enemy.id]) ?? threats[0];
      // Choose exactly one opaque state per side: door > lit threat > light.
      const threatArt = art(`${side}-threat-art`, ASSETS.doorway[threat?.id], lit && Boolean(threat));
      const lightArt = art(`${side}-light-art`, ASSETS.lights[side], lit && !threatArt);
      show(`${side}-glow`, lit && !lightArt && !threatArt);
      const doorArt = art(`${side}-door-art`, ASSETS.doors[side], closed);
      show(`${side}-shutter`, closed && !doorArt);
      show(`${side}-threat`, threats.length > 0 && !state.outage);
      if (threats.length) {
        const heading = closed ? 'DOOR HOLDING' : lit ? threats.map(e => config.enemies[e.id].name.toUpperCase()).join(' + ') : 'MOVEMENT DETECTED';
        const detail = closed ? 'Hold until retreat is confirmed.' : lit ? 'CLOSE THIS DOOR NOW' : 'Check light / close this door';
        const note = lit && !closed && !threatArt ? 'TEMPORARY THREAT INDICATOR' : `${side.toUpperCase()} DOORWAY`;
        const marker = els[`${side}-threat`];
        const key = heading + detail + note;
        if (marker.dataset.key !== key) {
          const strong = document.createElement('strong'); strong.textContent = heading;
          const body = document.createElement('span'); body.textContent = detail;
          const small = document.createElement('small'); small.textContent = note;
          marker.replaceChildren(strong, body, small); marker.dataset.key = key;
        }
      }
    }
  }

  function renderMonitor(state) {
    const camera = CAMERAS.find(c => c.id === state.camera);
    const foxy = state.enemies.foxy;
    const path = camera.id === '2A' && foxy?.position === 1 ? ASSETS.foxyRun
      : camera.id === '1C' && foxy ? ASSETS.cove[foxy.coveStage] : ASSETS.cameras[camera.id];
    const ready = art('camera-art', path, !camera.audioOnly);
    show('camera-fallback', !ready);
    text('camera-fallback-title', camera.audioOnly ? 'AUDIO ONLY' : 'ROOM ART PENDING');
    text('camera-fallback-detail', camera.audioOnly ? 'CAM 6 / Kitchen · No video signal by design' : `TEMPORARY BACKGROUND / ${path}`);
    els['camera-art'].alt = `${camera.name} security camera`;
    text('feed-code', `CAM ${camera.id}`);
    text('feed-name', camera.name);
    const here = Object.values(state.enemies).filter(e => roomOf(e, config) === camera.id);
    text('feed-status', camera.audioOnly ? here.length ? 'METALLIC CLATTER DETECTED / TEXT CUE' : 'KITCHEN CIRCUIT / QUIET' : here.length ? `${here.length} LIVE POSITION${here.length > 1 ? 'S' : ''} DETECTED` : 'NO LIVE THREATS IN THIS ROOM');
    for (const button of cameraButtons) button.setAttribute('aria-pressed', String(button.dataset.camera === camera.id));
    renderEnemyMarkers(state);
  }

  return function render(state, { dev = false, speed = 1 } = {}) {
    const playing = state.mode === 'playing';
    show('menu', state.mode === 'menu'); show('play', playing); show('result', ['won', 'lost'].includes(state.mode));
    show('menu-button', playing); show('pause-button', playing); show('dev-panel', dev);
    show('pause-overlay', playing && (state.paused || state.hidden));
    show('resume', !state.hidden);
    text('pause-description', state.hidden ? 'Your shift pauses while this tab or window is inactive.' : 'Time, enemies, and power are paused.');
    text('pause-button', state.paused ? 'Resume [P]' : 'Pause [P]');
    text('dev-speed', `Speed: ${speed}×`);
    for (const id of ['dev-advance', 'dev-threat', 'dev-outage', 'dev-dawn']) els[id].disabled = !playing || state.paused || state.hidden;

    if (state.mode === 'menu') show('title-fallback', !art('title-art', ASSETS.title));
    if (playing) {
      show('office', !state.monitor); show('monitor', state.monitor);
      show('outage-shade', state.outage); show('outage-message', state.outage);
      text('view-label', state.outage ? 'OFFLINE' : state.monitor ? 'CAMERA MONITOR' : 'OFFICE');
      text('power-status', state.outage ? 'EMERGENCY POWER FAILURE' : 'SYSTEMS ONLINE');
      const hour = Math.floor(state.elapsed / config.nightDuration * 6);
      text('clock', `${hour === 0 ? 12 : hour} AM`);
      const time = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
      text('shift-progress', `${time(state.elapsed)} / ${time(config.nightDuration)}`);
      text('power-value', `${Math.ceil(state.power)}%`);
      els['power-fill'].style.width = `${state.power}%`;
      els['power-fill'].style.background = state.power < 20 ? 'var(--red)' : 'var(--mint)';
      const currentUsage = usage(state);
      if (currentUsage !== lastUsage) {
        els['usage-bars'].replaceChildren(...Array.from({ length: 6 }, (_, index) => {
          const bar = document.createElement('i'); if (index >= currentUsage) bar.className = 'inactive'; return bar;
        }));
        els['usage-bars'].setAttribute('aria-label', `${currentUsage} active power units`);
        lastUsage = currentUsage;
      }
      for (const side of ['left', 'right']) {
        els[`${side}-door`].disabled = state.outage;
        els[`${side}-light`].disabled = state.outage;
        els[`${side}-door`].setAttribute('aria-pressed', String(state.doors[side]));
        els[`${side}-light`].setAttribute('aria-pressed', String(state.lights[side]));
        const label = els[`${side}-door`].querySelector('span');
        label.textContent = state.doors[side] ? 'Open door' : 'Close door';
      }
      els['monitor-toggle'].disabled = state.outage;
      els['monitor-toggle'].setAttribute('aria-pressed', String(state.monitor));
      text('monitor-label', state.monitor ? 'Lower monitor' : 'Open monitor');
      if (state.monitor) renderMonitor(state); else renderOffice(state);
      const event = state.events.at(-1);
      const sprinting = !state.outage && state.enemies.foxy?.position === 1;
      text('activity', sprinting ? 'Foxy is running down West Hall! Close the LEFT door now.' : event.text);
      els.activity.dataset.tone = sprinting ? 'danger' : event.tone;
    } else if (state.outcome) {
      const won = state.mode === 'won';
      const cause = state.outcome.cause;
      const name = cause === 'outage' ? 'The power failed' : config.enemies[cause]?.name;
      els.result.classList.toggle('loss', !won);
      text('result-kicker', won ? 'SHIFT COMPLETE / YOU MADE IT' : 'SHIFT TERMINATED / SIGNAL LOST');
      text('result-title', won ? '6:00 AM' : 'Caught in the dark.');
      text('result-description', won ? 'The morning crew has arrived. You survived Night 1.' : cause === 'outage' ? 'The power failed, and something found you before dawn. Conserve devices to keep the office online.' : `${name} reached the office through the ${config.enemies[cause]?.side} doorway. Close that door and hold it until the threat retreats.`);
      art('loss-art', ASSETS.jumpscares[cause === 'outage' ? 'freddy' : cause], !won);
      text('retry', won ? 'Play Night 1 again ↗' : 'Retry Night 1 ↗');
      text('activity', won ? 'Night 1 complete. Replay the shift or return to the menu.' : 'Night ended. Retry starts a completely fresh shift.');
      els.activity.dataset.tone = won ? 'safe' : 'danger';
    } else {
      text('activity', 'Welcome to the night shift. Check your instructions before clocking in.');
      els.activity.dataset.tone = 'normal';
    }
  };
}
