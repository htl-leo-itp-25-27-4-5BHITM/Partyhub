const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/main/resources/META-INF/resources/addParty/addParty.js', 'utf8');

async function boot(storage = new Map(), user = '1', search = '') {
  let ready;
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', name: id, type: 'text', hidden: true, disabled: false,
      handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; },
      classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, removeAttribute() {},
      textContent: '', innerHTML: '', style: {}, dataset: {} });
    return nodes.get(id);
  };
  const names = ['title', 'description', 'time_start', 'time_end', 'location_address', 'entry_costs', 'theme', 'min_age', 'max_age', 'website'];
  const form = node('form');
  form.elements = Object.fromEntries(names.map(name => [name, node(name)]));
  form.querySelectorAll = () => names.map(node);
  const indicators = [1, 2, 3, 4, 5].map(number => {
    const indicator = node('indicator' + number);
    indicator.dataset.stepIndicator = String(number);
    indicator.querySelector = () => node('stage' + number);
    return indicator;
  });
  const bring = { items: [{ name: 'Water', quantity: 3 }], pending: { name: 'Ice', quantity: '2', unit: 'bags' } };
  let restored;
  const context = { console: { log() {}, warn() {}, error() {} }, URLSearchParams, URL, Date, crypto: require('node:crypto').webcrypto,
    document: { addEventListener(_, fn) { ready = fn; }, getElementById: node,
      querySelector: selector => selector === '.party-form' ? form : node(selector), querySelectorAll: selector => selector === '.wizard-step' ? indicators : [] },
    localStorage: { get length() { return storage.size; }, key: i => Array.from(storage.keys())[i] ?? null, getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    window: { location: { search, href: 'http://localhost/addParty/addParty.html' + search }, history: { back() {}, replaceState(_, __, url) { context.window.location.href = String(url); } }, confirm: () => true,
      getCurrentUserId: () => user,
      BringAlongStep: { load: async () => {}, snapshot: () => bring, restore: draft => { restored = draft; } },
      authService: { apiCall: async () => ({ ok: true, json: async () => [], status: 200 }) } },
  };
  context.window.localStorage = context.localStorage;
  context.window.crypto = context.crypto;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('src/main/resources/META-INF/resources/party-drafts.js', 'utf8'), context);
  vm.runInContext(source, context);
  await ready();
  await new Promise(resolve => setImmediate(resolve));
  return { node, context, storage, restored: () => restored, click: id => node(id).handlers.click() };
}

test('saves incomplete values and restores only via its draft URL', async () => {
  const first = await boot();
  first.node('title').value = 'Unfinished party';
  first.node('description').value = 'Notes';
  first.node('time_start').value = '25.12.2026 20:00';
  first.click('saveDraft');
  assert.equal(first.node('draftSaveLabel').textContent, 'Saved');
  assert.equal(first.node('partyFeedback').hidden, true);
  const draft = first.context.window.PartyDrafts.forUser('1').list()[0];
  const second = await boot(first.storage, '1', '?draft=' + draft.id);
  assert.equal(second.node('title').value, 'Unfinished party');
  assert.equal(second.node('time_start').value, '25.12.2026 20:00');
  assert.equal(second.restored().pending.name, 'Ice');
  assert.equal(second.restored().items[0].name, 'Water');
});

test('new forms stay blank and save independently while resumed saves update one draft', async () => {
  const first = await boot();
  first.node('title').value = 'Party A';
  first.click('saveDraft');
  const second = await boot(first.storage);
  assert.equal(second.node('title').value, '');
  assert.equal(second.node('saveDraft').disabled, false);
  second.node('title').value = 'Party B';
  second.click('saveDraft');
  const store = second.context.window.PartyDrafts.forUser('1');
  assert.equal(store.list().length, 2);
  const a = store.list().find(d => d.fields.title === 'Party A');
  const resumed = await boot(first.storage, '1', '?draft=' + a.id);
  resumed.node('title').value = 'Party A updated';
  resumed.node('form').handlers.input();
  resumed.click('saveDraft');
  assert.equal(store.list().length, 2);
  assert.equal(store.get(a.id).fields.title, 'Party A updated');
  assert.ok(store.list().some(d => d.fields.title === 'Party B'));
});

test('drafts are scoped to the account and excluded from published party edit mode', async () => {
  const app = await boot();
  app.click('saveDraft');
  const other = await boot(app.storage, '2');
  assert.equal(other.context.window.PartyDrafts.forUser('2').list().length, 0);
  const edit = await boot(app.storage, '1', '?id=99');
  assert.equal(edit.node('draftActions').hidden, true);
  assert.equal(edit.node('saveDraft').handlers.click, undefined);
});

test('missing draft URL permits a new save without overwriting other work', async () => {
  const app = await boot(new Map(), '1', '?draft=00000000-0000-0000-0000-000000000000');
  assert.match(app.node('partyFeedback').textContent, /Draft not found/);
  app.click('saveDraft');
  assert.equal(app.context.window.PartyDrafts.forUser('1').list().length, 1);
});

test('failed storage writes show an error instead of claiming success', async () => {
  const app = await boot();
  app.context.localStorage.setItem = () => { throw new Error('quota'); };
  app.click('saveDraft');
  assert.match(app.node('partyFeedback').textContent, /could not be saved/);
  assert.equal(app.storage.size, 0);
});

test('save feedback stays on the button and resets when the draft changes', async () => {
  const app = await boot();
  app.click('saveDraft');
  assert.equal(app.node('draftSaveLabel').textContent, 'Saved');
  assert.equal(app.node('saveDraft').dataset.saved, 'true');
  assert.equal(app.node('partyFeedback').hidden, true);
  app.node('title').value = 'Changed name';
  app.node('form').handlers.input();
  assert.equal(app.node('draftSaveLabel').textContent, 'Save draft');
  app.click('saveDraft');
  assert.equal(app.node('draftSaveLabel').textContent, 'Saved');
  assert.equal(app.context.window.PartyDrafts.forUser('1').list().length, 1);
  assert.equal(app.context.window.PartyDrafts.forUser('1').list()[0].fields.title, 'Changed name');
});

test('direct navigation skips incomplete stages, retains fields and saves the selected stage', async () => {
  const app = await boot();
  app.node('title').value = 'Round trip';
  app.node('description').value = 'Draft details';
  app.node('time_start').value = '25.12.2026 20:00';
  app.node('time_end').value = '26.12.2026 02:00';
  app.node('location_address').value = 'Hauptplatz 1, Linz';
  app.click('stage3');
  app.click('saveDraft');
  const store = app.context.window.PartyDrafts.forUser('1');
  const draft = store.list()[0];
  assert.equal(draft.step, 3);
  const reopened = await boot(app.storage, '1', '?draft=' + draft.id);
  for (const name of ['title', 'description', 'time_start', 'time_end', 'location_address']) {
    assert.equal(reopened.node(name).value, app.node(name).value);
  }
  assert.equal(reopened.node('stepTitle').textContent, 'Other Infos');
  reopened.click('stage2');
  assert.equal(reopened.node('draftSaveLabel').textContent, 'Save draft');
  reopened.click('saveDraft');
  assert.equal(store.get(draft.id).step, 2);
  reopened.click('stage1');
  assert.equal(reopened.node('title').value, 'Round trip');
});
