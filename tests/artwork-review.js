const frame = document.getElementById('review-frame');
await new Promise(resolve => { if (frame.contentWindow.nightDebug) resolve(); else frame.addEventListener('load', resolve, { once: true }); });
const win = frame.contentWindow;
const doc = frame.contentDocument;
const api = win.nightDebug;
const click = id => doc.getElementById(id).click();
function device(side, type) { click(`${side}-${type}`); }
function camera(id) { click('monitor-toggle'); doc.querySelector(`[data-camera="${id}"]`).click(); }
function threats() { api.threat('bonnie'); api.threat('chica'); }
const fixtures = {
  'Both doors': () => { device('left', 'door'); device('right', 'door'); },
  'Both lights': () => { device('left', 'light'); device('right', 'light'); },
  'Left door + right light': () => { device('left', 'door'); device('right', 'light'); },
  'Right door + left light': () => { device('right', 'door'); device('left', 'light'); },
  'Both threats lit': () => { threats(); device('left', 'light'); device('right', 'light'); },
  'Left door + right threat': () => { threats(); device('left', 'door'); device('right', 'light'); },
  'Right door + left threat': () => { threats(); device('right', 'door'); device('left', 'light'); },
  'Stage': () => camera('1A'),
  'Dining': () => { for (const id of ['bonnie', 'chica', 'freddy']) api.threat(id, '1B'); camera('1B'); },
  'West Hall': () => { api.threat('bonnie', '2A'); camera('2A'); },
  'Cove peeking': () => { api.cove(1); camera('1C'); },
  'Cove emerged': () => { api.cove(2); camera('1C'); },
  'Foxy sprint': () => { api.cove(3); camera('2A'); },
  'Power out': () => { threats(); for (const side of ['left', 'right']) { device(side, 'door'); device(side, 'light'); } api.power(0); },
  'Bonnie loss': () => { api.threat(); api.advance(8); },
};
for (const [name, apply] of Object.entries(fixtures)) {
  const button = document.createElement('button'); button.textContent = name;
  button.addEventListener('click', () => {
    click('menu-button'); click('start'); win.dispatchEvent(new win.Event('focus'));
    apply();
    for (const choice of document.querySelectorAll('#fixtures button')) choice.setAttribute('aria-pressed', String(choice === button));
    document.getElementById('review-status').textContent = `${name} · live game renderer · fixed simulation time · no artwork modified`;
  });
  document.getElementById('fixtures').append(button);
}
document.querySelector('#fixtures button:nth-child(8)').click();
