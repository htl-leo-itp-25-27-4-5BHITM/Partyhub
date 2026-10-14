const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/auth/flow.js'), 'utf8');

async function enter(action, { loggedIn = false, failure = false } = {}) {
  const calls = [];
  const status = { textContent: '' };
  const retry = { hidden: true, addEventListener: (_, fn) => { retry.click = fn; } };
  const auth = {
    init: async () => { if (failure) throw Error('offline'); },
    isLoggedIn: () => loggedIn,
    login: async options => calls.push(['login', options]),
    register: async options => calls.push(['register', options]),
    logout: () => calls.push(['logout']),
  };
  vm.runInNewContext(source, {
    window: { authService: auth, location: { replace: url => calls.push(['replace', url]), reload: () => calls.push(['reload']) } },
    document: { body: { dataset: { authAction: action } }, getElementById: id => id === 'status' ? status : retry },
    console: { error() {} },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { calls: JSON.parse(JSON.stringify(calls)), retry, status };
}

test('legacy login and registration URLs start authentication without a click', async () => {
  for (const action of ['login', 'register']) {
    assert.deepEqual((await enter(action)).calls, [[action, { redirectTo: '/index.html' }]]);
  }
});
test('authenticated visitors return home instead of restarting authentication', async () => {
  assert.deepEqual((await enter('login', { loggedIn: true })).calls, [['replace', '/index.html']]);
});
test('logout entry ends the session even when currently authenticated', async () => {
  assert.deepEqual((await enter('logout', { loggedIn: true })).calls, [['logout']]);
});
test('failed initialization exposes recovery and retry resets the page', async () => {
  const result = await enter('login', { failure: true });
  assert.equal(result.retry.hidden, false);
  assert.match(result.status.textContent, /try again or return home/);
  assert.deepEqual(result.calls, []);
  assert.doesNotThrow(() => result.retry.click());
});

const homeSource = fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/auth/home-account.js'), 'utf8');
test('homepage starts Keycloak directly and preserves modified link clicks', async () => {
  let onClick;
  const calls = [];
  vm.runInNewContext(homeSource, {
    document: { getElementById: () => ({ addEventListener: (_, fn) => { onClick = fn; } }) },
    window: {
      addEventListener() {},
      authService: {
        login: async options => calls.push(['login', options.redirectTo]),
        register: async options => calls.push(['register', options.redirectTo]),
      },
    },
  });
  for (const action of ['login', 'register']) {
    let prevented = false;
    const event = {
      button: 0,
      target: { closest: () => ({ pathname: `/register_login/${action}/${action}.html` }) },
      preventDefault: () => { prevented = true; },
    };
    await onClick({ ...event, ctrlKey: true });
    assert.equal(prevented, false);
    await onClick(event);
    assert.equal(prevented, true);
  }
  assert.deepEqual(calls, [['login', '/index.html'], ['register', '/index.html']]);
});
