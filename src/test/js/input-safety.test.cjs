const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../main/resources/META-INF/resources/input-safety.js'), 'utf8'), {window, URL});
test('websites require HTTP(S), a host and no credentials or controls', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>x</script>', '//example.com', 'https://user:pass@example.com', 'https://example.com/\nx', ' https://example.com', 'https://', null, 123])
    assert.equal(window.inputSafety.website(url), null, String(url));
  assert.equal(window.inputSafety.website('https://example.com/path?q=a&x=b#fragment'), 'https://example.com/path?q=a&x=b#fragment');
});
