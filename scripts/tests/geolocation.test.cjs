const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../src/main/resources/META-INF/resources/index.js'), 'utf8');

async function boot(mode) {
  const events = {}, layers = [], markers = [], centers = [], clears = [];
  let ready, onPosition, onError, watches = 0;
  const chain = { addTo() { return this; }, bindPopup() { return this; }, setView(p) { centers.push(p); return this; }, invalidateSize() {}, on() { return this; }, zoomControl: { setPosition() {} } };
  const geolocation = mode === 'unsupported' ? undefined : {
    watchPosition(success, error) { watches++; onPosition = success; onError = error; return 0; },
    clearWatch(id) { clears.push(id); }
  };
  const navigator = { geolocation };
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {clientWidth:800, clientHeight:600, value:'', hidden:true, disabled:true, classList:{remove(){},add(){}}, addEventListener(){}, getElement(){return null}, setAttribute(){}, focus(){}, innerHTML:''});
    return elements.get(id);
  };
  const Control = {extend: () => class {addTo(){ return this; }}};
  const context = vm.createContext({
    document: { addEventListener(_, callback) { ready = callback; }, getElementById: element, querySelectorAll(){return []}, querySelector(){return element('locate')} },
    window: { addEventListener(name, callback) { events[name] = callback; }, backend: { getAllParties: async () => [] } },
    navigator, localStorage: { getItem() { return null; } },
    L: { Control, divIcon: () => ({}), map: () => chain, tileLayer: () => chain, layerGroup() { const layer = { addTo() { return this; }, clearLayers() { this.cleared = true; } }; layers.push(layer); return layer; }, marker(position) { markers.push(position); return chain; }, circle: () => chain, icon: () => ({}) },
    console: { debug() {}, warn() {} }, requestAnimationFrame() {}, setTimeout() {}, setInterval() {}, Date, Number
  });
  vm.runInContext(source, context);
  await ready();
  return { navigator, geolocation, events, markers, centers, clears, layers, get watches() { return watches; }, position: p => onPosition({ coords: p }), denied: () => onError({ code: 1, message: 'denied' }) };
}

test('uses supplied location outside Leonding without replacing the browser API', async () => {
  const app = await boot();
  assert.equal(app.navigator.geolocation, app.geolocation);
  assert.equal(app.watches, 1);
  assert.equal(app.markers.length, 0);
  app.position({ latitude: 51.5074, longitude: -0.1278, accuracy: 12 });
  assert.deepEqual(Array.from(app.markers[0]), [51.5074, -0.1278]);
  assert.deepEqual(Array.from(app.centers.at(-1)), [51.5074, -0.1278]);
});

test('denied and unsupported location never fabricate user markers', async () => {
  const denied = await boot();
  denied.denied();
  assert.equal(denied.markers.length, 0);
  assert.equal(denied.layers[1].cleared, true);
  const unsupported = await boot('unsupported');
  assert.equal(unsupported.markers.length, 0);
  assert.equal(unsupported.watches, 0);
});

test('cleans up watch id zero and restarts once after history restoration', async () => {
  const app = await boot();
  app.events.pagehide();
  assert.deepEqual(app.clears, [0]);
  app.events.pageshow({ persisted: true });
  app.events.pageshow({ persisted: true });
  assert.equal(app.watches, 2);
});
