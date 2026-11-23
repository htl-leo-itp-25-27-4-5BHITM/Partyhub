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
      textContent: '', innerHTML: '', style: {} });
    return nodes.get(id);
  };
  const names = ['title', 'description', 'time_start', 'time_end', 'location_address', 'entry_costs', 'theme', 'min_age', 'max_age', 'website'];
  const form = node('form');
  form.elements = Object.fromEntries(names.map(name => [name, node(name)]));
  form.querySelectorAll = () => names.map(node);
  const bring = { items: [{ name: 'Water', quantity: 3 }], pending: { name: 'Ice', quantity: '2', unit: 'bags' } };
  let restored;
  const context = { console: { log() {}, warn() {}, error() {} }, URLSearchParams, Date,
    document: { addEventListener(_, fn) { ready = fn; }, getElementById: node,
      querySelector: selector => selector === '.party-form' ? form : node(selector), querySelectorAll: () => [] },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    window: { location: { search }, history: { back() {} }, confirm: () => true,
      getCurrentUserId: () => user,
      BringAlongStep: { load: async () => {}, snapshot: () => bring, restore: draft => { restored = draft; } },
      authService: { apiCall: async () => ({ ok: true, json: async () => [], status: 200 }) } },
  };
  vm.runInNewContext(source, context);
  await ready();
  await new Promise(resolve => setImmediate(resolve));
  return { node, context, storage, restored: () => restored, click: id => node(id).handlers.click() };
}

test('saves incomplete values without publishing, restores on a later visit', async () => {
  const first = await boot();
  first.node('title').value = 'Unfinished party';
  first.node('description').value = 'Notes';
  first.node('time_start').value = '25.12.2026 20:00';
  first.click('saveDraft');
  assert.equal(first.node('partyFeedback').textContent, 'Draft saved.');
  const second = await boot(first.storage);
  assert.equal(second.node('savedDraft').hidden, false);
  assert.equal(second.node('savedDraftTitle').textContent, 'Unfinished party · Draft');
  await second.click('resumeDraft');
  assert.equal(second.node('title').value, 'Unfinished party');
  assert.equal(second.node('time_start').value, '25.12.2026 20:00');
  assert.equal(second.restored().pending.name, 'Ice');
  assert.equal(second.restored().items[0].name, 'Water');
  assert.equal(second.node('savedDraft').hidden, true);
});

test('drafts are scoped to the logged in account and excluded from edit mode', async () => {
  const app = await boot();
  app.click('saveDraft');
  const other = await boot(app.storage, '2');
  assert.equal(other.node('savedDraft').hidden, true);
  const edit = await boot(app.storage, '1', '?id=99');
  assert.equal(edit.node('draftActions').hidden, true);
  assert.equal(edit.node('saveDraft').handlers.click, undefined);
});

test('discard deletes the saved draft', async () => {
  const app = await boot();
  app.click('saveDraft');
  const next = await boot(app.storage);
  next.click('discardDraft');
  assert.equal(next.storage.size, 0);
  assert.equal(next.node('saveDraft').disabled, false);
});

test('corrupt storage remains recoverable by discarding', async () => {
  const app = await boot(new Map([['partyhub:party-draft:v1:1', '{broken']]));
  assert.equal(app.node('resumeDraft').disabled, true);
  assert.equal(app.node('saveDraft').disabled, true);
  app.click('discardDraft');
  assert.equal(app.storage.size, 0);
});

test('failed storage writes show an error instead of claiming success', async () => {
  const app = await boot();
  app.context.localStorage.setItem = () => { throw new Error('quota'); };
  app.click('saveDraft');
  assert.match(app.node('partyFeedback').textContent, /could not be saved/);
  assert.equal(app.storage.size, 0);
});
