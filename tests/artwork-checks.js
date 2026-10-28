import { ASSETS } from '../src/asset-paths.js';
import { CONFIG } from '../src/config.js';
import { cameraPlacement } from '../src/art-layout.js';

export async function verifyArtwork({ frame, win, doc, debug, click, start, test, assert }) {
  const waitFor = async check => {
    const deadline = performance.now() + 4000;
    while (!check()) {
      if (performance.now() > deadline) throw new Error('Artwork did not become ready');
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };
  const ready = id => !doc.getElementById(id).hidden && doc.getElementById(id).complete && doc.getElementById(id).naturalWidth > 0;
  const fresh = () => { click('menu-button'); start(); win.dispatchEvent(new win.Event('focus')); };
  const setDevice = (type, side, value) => {
    const property = type === 'door' ? 'doors' : 'lights';
    if (debug.snapshot()[property][side] !== value) click(`${side}-${type}`);
  };
  const camera = id => {
    if (!debug.snapshot().monitor) click('monitor-toggle');
    doc.querySelector(`[data-camera="${id}"]`).click();
  };

  await test('All 33 manifest images decode at their recorded dimensions; sprites preserve alpha', async () => {
    const manifest = await (await fetch('../assets/asset-manifest.json')).json();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    for (const asset of manifest.assets) {
      const image = new Image(); image.src = `../${asset.path}`; await image.decode();
      assert(image.naturalWidth === asset.width && image.naturalHeight === asset.height, `Dimensions: ${asset.id}`);
      if (asset.kind === 'character-sprite') {
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        context.drawImage(image, 0, 0);
        for (const [x, y] of [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]]) {
          assert(context.getImageData(x, y, 1, 1).data[3] === 0, `Opaque sprite corner: ${asset.id}`);
        }
        assert(context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data[3] > 0, `Empty sprite: ${asset.id}`);
      }
    }
  });
  await test('All 16 door/light combinations select one aligned opaque variant per side', async () => {
    fresh();
    for (let bits = 0; bits < 16; bits++) {
      setDevice('door', 'left', Boolean(bits & 1)); setDevice('door', 'right', Boolean(bits & 2));
      setDevice('light', 'left', Boolean(bits & 4)); setDevice('light', 'right', Boolean(bits & 8));
      const state = debug.snapshot();
      for (const side of ['left', 'right']) {
        const expected = state.doors[side] ? `${side}-door-art` : state.lights[side] ? `${side}-light-art` : null;
        if (expected) await waitFor(() => ready(expected));
        const visible = ['door', 'light', 'threat'].map(kind => `${side}-${kind}-art`).filter(id => !doc.getElementById(id).hidden);
        assert(visible.length === Number(Boolean(expected)) && (!expected || visible[0] === expected), `Wrong state at ${bits}, ${side}: ${visible}`);
        if (expected) {
          const base = doc.getElementById('office-art').getBoundingClientRect();
          const overlay = doc.getElementById(expected).getBoundingClientRect();
          assert(['x', 'y', 'width', 'height'].every(key => Math.abs(base[key] - overlay[key]) < 0.1), 'Office canvas alignment changed');
          assert(win.getComputedStyle(doc.getElementById(expected)).objectFit === 'contain');
        }
      }
    }
  });
  await test('Both lit threats coexist, closed doors take priority, and outage clears every overlay', async () => {
    fresh(); debug.threat('bonnie'); debug.threat('chica');
    setDevice('light', 'left', true); setDevice('light', 'right', true);
    await waitFor(() => ready('left-threat-art') && ready('right-threat-art'));
    assert(doc.getElementById('left-light-art').hidden && doc.getElementById('right-light-art').hidden);
    setDevice('door', 'left', true); await waitFor(() => ready('left-door-art'));
    assert(doc.getElementById('left-threat-art').hidden && ready('right-threat-art'));
    setDevice('door', 'left', false); setDevice('door', 'right', true);
    await waitFor(() => ready('left-threat-art') && ready('right-door-art'));
    assert(doc.getElementById('right-threat-art').hidden);
    debug.power(0); await waitFor(() => ready('office-art') && doc.getElementById('office-art').getAttribute('src') === ASSETS.outage);
    assert([...doc.querySelectorAll('#office-layers > *')].every(element => element.hidden));
  });
  await test('Stage figures keep 2:3 proportions, floor anchors, and fixed positions after departures at both screen sizes', async () => {
    fresh(); camera('1A');
    await waitFor(() => doc.querySelectorAll('.enemy-marker img').length === 3);
    for (const width of [390, 1280]) {
      frame.style.width = `${width}px`; frame.style.maxWidth = 'none';
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const scene = doc.getElementById('monitor').getBoundingClientRect();
      for (const id of ['bonnie', 'freddy', 'chica']) {
        const marker = doc.querySelector(`[data-character="${id}"]`);
        const box = marker.getBoundingClientRect();
        const placement = cameraPlacement('1A', id);
        assert(box.width > 0 && Math.abs(box.width / box.height - 2 / 3) < 0.002, `Stretched ${id}`);
        assert(Math.abs(((box.left + box.width / 2 - scene.left) / scene.width) - placement.x / 100) < 0.002);
        assert(Math.abs((box.bottom - scene.top) / scene.height - placement.feet / 100) < 0.002);
        assert(win.getComputedStyle(marker.querySelector('img')).objectFit === 'contain');
      }
    }
    const freddyBefore = doc.querySelector('[data-character="freddy"]').getBoundingClientRect().left;
    debug.threat('bonnie', '1B');
    assert(!doc.querySelector('[data-character="bonnie"]'));
    assert(doc.querySelector('[data-character="freddy"]').getBoundingClientRect().left === freddyBefore, 'Freddy shifted when Bonnie left');
    frame.style.width = '100%'; frame.style.maxWidth = '';
  });
  await test('All four Cove states use complete artwork without a duplicate Foxy sprite', async () => {
    fresh(); camera('1C');
    for (let stage = 0; stage < 4; stage++) {
      debug.cove(stage);
      await waitFor(() => ready('camera-art') && doc.getElementById('camera-art').getAttribute('src') === ASSETS.cove[stage]);
      assert(!doc.querySelector('[data-character="foxy"] img'));
    }
  });
  await test('Every enemy loss uses its own full-frame jumpscare still', async () => {
    for (const id of ['bonnie', 'chica', 'freddy', 'foxy']) {
      fresh(); debug.threat(id); debug.advance(CONFIG.enemies[id].attackDelay + 0.1);
      await waitFor(() => ready('loss-art'));
      assert(debug.snapshot().outcome.cause === id && doc.getElementById('loss-art').getAttribute('src') === ASSETS.jumpscares[id]);
      assert(win.getComputedStyle(doc.getElementById('loss-art')).objectFit === 'contain');
    }
    fresh();
  });
}
