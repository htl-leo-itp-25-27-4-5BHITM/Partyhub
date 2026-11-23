const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const source = fs.readFileSync('src/main/resources/META-INF/resources/party-drafts.js', 'utf8');
function setup(data = new Map()) {
  const storage = {
    get length() { return data.size; }, key: i => [...data.keys()][i] ?? null,
    getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k),
  };
  const context = { window: { localStorage: storage, crypto: { randomUUID } }, Date };
  vm.runInNewContext(source, context);
  return { data, storage, store: user => context.window.PartyDrafts.forUser(user) };
}
const snapshot = title => ({ fields: { title, time_start: '' }, step: 1, visibility: 'private', selectedUsers: ['12'], latitude: null, longitude: null, bringAlong: { items: [], pending: { name: 'Ice', quantity: '2', unit: 'bags' } } });
const plain = value => JSON.parse(JSON.stringify(value));

test('multiple drafts are independent and update/delete touches only selected draft', () => {
  const { store } = setup(); const drafts = store('one');
  const a = drafts.save(snapshot('A')); const b = drafts.save(snapshot('B'));
  assert.notEqual(a.id, b.id); assert.equal(drafts.list().length, 2);
  drafts.save(snapshot('A revised'), a.id);
  assert.equal(drafts.get(a.id).fields.title, 'A revised');
  assert.equal(drafts.get(b.id).fields.title, 'B');
  drafts.remove(a.id); assert.equal(drafts.get(a.id), null); assert.equal(drafts.list().length, 1);
});

test('fresh store instances and account boundaries preserve both writers', () => {
  const { store } = setup(); const a = store('one').save(snapshot('A'));
  const b = store('one').save(snapshot('B'));
  assert.equal(store('one').list().length, 2); assert.equal(store('two').list().length, 0);
  assert.equal(store('two').get(a.id), null);
  store('two').remove(b.id); assert.equal(store('one').list().length, 2);
});

test('sorts newest first and returns detached snapshots', () => {
  const { store, data } = setup(); const drafts = store('one'); const original = snapshot('A');
  const a = drafts.save(original); const b = drafts.save(snapshot('B'));
  original.fields.title = 'mutated'; assert.equal(drafts.get(a.id).fields.title, 'A');
  const key = [...data.keys()].find(key => key.endsWith(a.id)); const record = JSON.parse(data.get(key));
  record.updatedAt = '2099-01-01T00:00:00.000Z'; data.set(key, JSON.stringify(record));
  assert.equal(drafts.list()[0].id, a.id);
  assert.deepEqual(plain(drafts.get(b.id).bringAlong), snapshot('B').bringAlong);
});

test('migrates v1 once without dropping snapshots or duplicating records', () => {
  const legacy = { version: 1, ...snapshot('Old draft') };
  const app = setup(new Map([['partyhub:party-draft:v1:one', JSON.stringify(legacy)]]));
  const drafts = app.store('one'); const migrated = drafts.list();
  assert.equal(migrated.length, 1); assert.equal(migrated[0].fields.title, 'Old draft');
  assert.equal(app.data.has('partyhub:party-draft:v1:one'), false);
  assert.equal(drafts.list()[0].id, migrated[0].id);
});

test('migration write failure leaves legacy intact', () => {
  const raw = JSON.stringify({ version: 1, ...snapshot('Old draft') });
  const app = setup(new Map([['partyhub:party-draft:v1:one', raw]]));
  app.storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => app.store('one').list(), /quota/);
  assert.equal(app.data.get('partyhub:party-draft:v1:one'), raw);
});

test('migration cleanup failure retries without making duplicate drafts', () => {
  const app = setup(new Map([['partyhub:party-draft:v1:one', JSON.stringify({ version: 1, ...snapshot('Old draft') })]]));
  const remove = app.storage.removeItem; app.storage.removeItem = () => { throw new Error('blocked'); };
  assert.throws(() => app.store('one').list(), /blocked/);
  app.storage.removeItem = remove;
  assert.equal(app.store('one').list().length, 1); assert.equal(app.data.size, 1);
});

test('corrupt legacy remains intact but never blocks saving a new draft', () => {
  const app = setup(new Map([['partyhub:party-draft:v1:one', '{broken']]));
  assert.deepEqual(plain(app.store('one').list().unreadable), [{ id: 'legacy' }]);
  const fresh = app.store('one').save(snapshot('Fresh'));
  assert.equal(fresh.fields.title, 'Fresh'); assert.equal(app.data.get('partyhub:party-draft:v1:one'), '{broken');
});

test('corrupt unrelated v2 record does not block saving and removing a different draft', () => {
  const app = setup(); const drafts = app.store('one'); const a = drafts.save(snapshot('A'));
  const badKey = [...app.data.keys()][0]; app.data.set(badKey, '{broken');
  assert.deepEqual(plain(drafts.list().unreadable), [{ id: a.id }]);
  const b = drafts.save(snapshot('B')); drafts.remove(b.id);
  assert.equal(app.data.get(badKey), '{broken'); assert.throws(() => drafts.get(a.id), /could not be read/);
});

test('failed updates preserve original and deleted drafts cannot silently reappear', () => {
  const app = setup(); const drafts = app.store('one'); const a = drafts.save(snapshot('A'));
  const write = app.storage.setItem; app.storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => drafts.save(snapshot('changed'), a.id), /quota/);
  assert.equal(drafts.get(a.id).fields.title, 'A'); app.storage.setItem = write;
  drafts.remove(a.id); assert.throws(() => drafts.save(snapshot('changed'), a.id), /no longer exists/);
});

test('rejects missing account, invalid ids and malformed snapshots without writes', () => {
  const app = setup(); assert.throws(() => app.store(null), /account/);
  const drafts = app.store('one'); assert.throws(() => drafts.get('../two'), /Invalid draft ID/);
  assert.throws(() => drafts.save({ fields: {} }), /Invalid party draft/);
  assert.throws(() => drafts.save({ ...snapshot('A'), latitude: 100 }), /coordinates/);
  assert.equal(app.data.size, 0);
});


test('healthy drafts remain visible and directly resumable despite corrupt legacy and v2 records', () => {
  const app = setup(new Map([['partyhub:party-draft:v1:one', '{bad legacy']]));
  const drafts = app.store('one');
  const healthy = drafts.save(snapshot('Healthy'));
  const broken = drafts.save(snapshot('Broken'));
  const key = [...app.data.keys()].find(key => key.endsWith(broken.id));
  app.data.set(key, '{bad v2');
  assert.equal(drafts.get(healthy.id).fields.title, 'Healthy');
  const listed = drafts.list();
  assert.equal(listed.length, 1); assert.equal(listed[0].id, healthy.id);
  assert.deepEqual(plain(listed.unreadable), [{ id: broken.id }, { id: 'legacy' }]);
  assert.equal(app.data.get(key), '{bad v2');
  assert.equal(app.data.get('partyhub:party-draft:v1:one'), '{bad legacy');
});

test('targeted unreadable cleanup preserves recovered healthy drafts and other accounts', () => {
  const app = setup(); const drafts = app.store('one');
  const healthy = drafts.save(snapshot('Recovered')); const broken = drafts.save(snapshot('Broken'));
  const key = [...app.data.keys()].find(key => key.endsWith(broken.id));
  app.data.set(key, '{bad');
  app.data.set('partyhub:party-draft:v1:one', '{bad legacy');
  app.data.set('partyhub:party-draft:v1:two', '{other account');
  assert.equal(drafts.removeUnreadable(healthy.id), false);
  assert.equal(drafts.get(healthy.id).fields.title, 'Recovered');
  assert.equal(drafts.removeUnreadable(broken.id), true);
  assert.equal(drafts.removeUnreadable(broken.id), false);
  assert.equal(drafts.removeUnreadable('legacy'), true);
  assert.equal(app.data.get('partyhub:party-draft:v1:two'), '{other account');
  app.data.set('partyhub:party-draft:v1:one', JSON.stringify({version:1, ...snapshot('Recovered legacy')}));
  assert.equal(drafts.removeUnreadable('legacy'), false);
  assert.equal(drafts.list().length, 2);
});

test('unavailable storage throws instead of being classified as unreadable data', () => {
  const app = setup(); const drafts = app.store('one'); const a = drafts.save(snapshot('A'));
  app.storage.getItem = () => { throw new Error('storage blocked'); };
  assert.throws(() => drafts.list(), /storage blocked/);
  assert.throws(() => drafts.get(a.id), /storage blocked/);
  assert.throws(() => drafts.removeUnreadable(a.id), /storage blocked/);
});

test('valid legacy migrates even when an unrelated v2 record is corrupt', () => {
  const app = setup(); const drafts = app.store('one'); const a = drafts.save(snapshot('A'));
  const key = [...app.data.keys()][0]; app.data.set(key, '{bad');
  app.data.set('partyhub:party-draft:v1:one', JSON.stringify({version:1,...snapshot('Legacy')}));
  const listed = drafts.list();
  assert.equal(listed.length, 1); assert.equal(listed[0].fields.title, 'Legacy');
  assert.deepEqual(plain(listed.unreadable), [{id:a.id}]);
  assert.equal(app.data.get(key), '{bad');
});
