const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Small DOM fixture: exercise production handlers without fetching media or logging in.
function fixture() {
  const listeners = {};
  const document = {
    activeElement: null,
    addEventListener(type, fn) { listeners[type] = fn; },
    body: { style: { overflow: 'auto' }, appendChild() {} },
    querySelector(selector) { return selector === '.image-modal' ? modal : null; },
    querySelectorAll() { return []; },
    createElement(tag) { return new Element(tag); },
    getElementById() { return grid; },
  };
  class Element {
    constructor(tag = 'button') {
      this.tagName = tag.toUpperCase();
      this.attributes = {};
      this.children = [];
      this.handlers = {};
      this.style = {};
      this.isConnected = true;
      this.hidden = false;
      const classes = new Set();
      this.classList = { add: v => classes.add(v), remove: v => classes.delete(v), contains: v => classes.has(v) };
    }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    appendChild(child) { this.children.push(child); }
    addEventListener(type, fn) { this.handlers[type] = fn; }
    focus() { document.activeElement = this; }
    matches() { return !!this.disabled || this.attributes['aria-hidden'] === 'true'; }
    querySelector(selector) { return controls[selector]; }
    querySelectorAll() { return Object.values(controls); }
  }
  const controls = Object.fromEntries([
    '.modal-close', '.modal-delete', '.modal-prev', '.modal-next', '.modal-image',
  ].map(selector => [selector, new Element()]));
  // The image is not returned by a real focusable selector.
  const modal = new Element('div');
  modal.querySelectorAll = () => Object.entries(controls).filter(([s]) => s !== '.modal-image').map(([, el]) => el);
  const grid = new Element('div');
  document.createElement = tag => tag === 'div' ? modal : new Element(tag);
  const context = {
    document, HTMLElement: Element, console, URL, Intl,
    window: { addEventListener() {}, getComputedStyle: el => ({ display: el.style.display || 'block', visibility: 'visible' }) },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('src/main/resources/META-INF/resources/gallery/gallery.js', 'utf8'), context);
  context.loadMediaImage = () => Promise.resolve('blob:photo');
  context.showModalImage = () => {};
  context.setupModal();
  document.createElement = tag => new Element(tag);
  return { context, document, modal, controls, listeners, Element, grid };
}

function key(f, key, shiftKey = false) {
  const event = { key, shiftKey, prevented: false, preventDefault() { this.prevented = true; } };
  f.listeners.keydown(event);
  return event;
}

test('photo viewer has dialog semantics, takes focus, and Escape restores the opener and scrolling', () => {
  const f = fixture();
  const opener = new f.Element();
  opener.focus();
  f.context.openModal([{ id: 1 }], 0, opener);
  assert.equal(f.modal.attributes.role, 'dialog');
  assert.equal(f.modal.attributes['aria-modal'], 'true');
  assert.equal(f.modal.attributes['aria-label'], 'Photo viewer');
  assert.equal(f.modal.attributes['aria-hidden'], 'false');
  assert.equal(f.document.activeElement, f.controls['.modal-close']);
  assert.equal(f.document.body.style.overflow, 'hidden');
  assert.equal(key(f, 'Escape').prevented, true);
  assert.equal(f.document.activeElement, opener);
  assert.equal(f.modal.attributes['aria-hidden'], 'true');
  assert.equal(f.document.body.style.overflow, 'auto');
});

test('Tab wraps in both directions, ignores hidden controls, and recovers escaped focus', () => {
  const f = fixture();
  f.controls['.modal-delete'].hidden = true;
  f.context.openModal([{ id: 1 }, { id: 2 }], 0, new f.Element());
  assert.equal(key(f, 'Tab', true).prevented, true);
  assert.equal(f.document.activeElement, f.controls['.modal-next']);
  assert.equal(key(f, 'Tab').prevented, true);
  assert.equal(f.document.activeElement, f.controls['.modal-close']);
  // Native Tab must still advance normally between interior controls.
  assert.equal(key(f, 'Tab').prevented, false);
  new f.Element().focus();
  assert.equal(key(f, 'Tab').prevented, true);
  assert.equal(f.document.activeElement, f.controls['.modal-close']);
});

test('a signed-out single-photo viewer traps focus on Close and ignores keys after dismissal', () => {
  const f = fixture();
  f.controls['.modal-delete'].hidden = true;
  f.context.openModal([{ id: 1 }], 0, new f.Element());
  assert.equal(f.controls['.modal-prev'].hidden, true);
  assert.equal(f.controls['.modal-next'].hidden, true);
  for (const shift of [false, true]) {
    assert.equal(key(f, 'Tab', shift).prevented, true);
    assert.equal(f.document.activeElement, f.controls['.modal-close']);
  }
  key(f, 'Escape');
  assert.equal(key(f, 'Tab').prevented, false);
});


test('every signed-out thumbnail is a labelled native button wired to its own photo', () => {
  const f = fixture();
  f.context.displayGallery([{ id: 10 }, { id: 20 }]);
  assert.equal(f.grid.children.length, 2);
  f.grid.children.forEach((item, index) => {
    const opener = item.children[0];
    assert.equal(opener.tagName, 'BUTTON');
    assert.equal(opener.type, 'button');
    assert.equal(opener.attributes['aria-label'], `Open party photo ${index + 1}`);
    // Native buttons supply Enter/Space activation; click uses the same handler.
    opener.handlers.click();
    assert.equal(vm.runInContext('currentIndex', f.context), index);
    assert.equal(f.document.activeElement, f.controls['.modal-close']);
    key(f, 'Escape');
    assert.equal(f.document.activeElement, opener);
  });
});
