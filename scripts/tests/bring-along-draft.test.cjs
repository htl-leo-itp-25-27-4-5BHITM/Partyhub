const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('resuming before DOM initialization restores staged and unfinished bring-along items', () => {
  let ready;
  const nodes = new Map();
  const element = () => ({ value: '', hidden: true, classList: { remove() {}, toggle() {} },
    addEventListener() {}, append() {}, replaceChildren() {}, setAttribute() {}, focus() {} });
  const document = {
    addEventListener(_, callback) { ready = callback; },
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); },
    createElement: element,
  };
  const window = {};
  vm.runInNewContext(fs.readFileSync('src/main/resources/META-INF/resources/addParty/bringAlongStep.js', 'utf8'), { document, window });
  const saved = { items: [{name: 'Ice', quantity: 3, unit: 'bags', status: 'new'}],
    editingIndex: null, pending: {name: 'Chips', quantity: '2', unit: 'packs'} };
  window.BringAlongStep.restore(saved);
  ready();
  const restored = window.BringAlongStep.snapshot();
  assert.equal(restored.items[0].name, 'Ice');
  assert.equal(restored.items[0].quantity, 3);
  assert.equal(restored.pending.name, 'Chips');
  assert.equal(restored.pending.quantity, '2');
});
