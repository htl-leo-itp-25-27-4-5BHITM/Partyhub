const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

process.env.TZ = "Europe/Vienna";

const scriptPath = path.resolve(
  __dirname,
  "../../src/main/resources/META-INF/resources/advancedPartyInfos/advancedPartyInfos.js"
);
const script = fs.readFileSync(scriptPath, "utf8");
const context = {
  console,
  document: {
    addEventListener() {},
  },
};

vm.runInNewContext(script, context, { filename: scriptPath });

const formatRelativeTime = context.formatRelativeTime;

test("preserves short duration formatting", () => {
  const now = new Date(2026, 10, 16, 12, 0);

  assert.equal(
    formatRelativeTime(new Date(2026, 10, 16, 12, 45), now),
    "in 45 min"
  );
  assert.equal(
    formatRelativeTime(new Date(2026, 10, 16, 13, 30), now),
    "in 1h 30m"
  );
});

test("uses displayed local dates at midnight and the 24/48-hour boundaries", () => {
  assert.equal(
    formatRelativeTime(
      new Date(2026, 10, 18, 0, 15),
      new Date(2026, 10, 16, 23, 30)
    ),
    "in 2 days"
  );
  assert.equal(
    formatRelativeTime(
      new Date(2026, 10, 17, 12, 0),
      new Date(2026, 10, 16, 12, 0)
    ),
    "tomorrow"
  );
  assert.equal(
    formatRelativeTime(
      new Date(2026, 10, 18, 12, 0),
      new Date(2026, 10, 16, 12, 0)
    ),
    "in 2 days"
  );
});

test("labels the audit fixture by calendar day instead of elapsed hours", () => {
  assert.equal(
    formatRelativeTime(
      new Date(2026, 10, 18, 12, 0),
      new Date(2026, 10, 16, 12, 12)
    ),
    "in 2 days"
  );
});

test("handles Vienna daylight-saving day lengths", () => {
  assert.equal(
    formatRelativeTime(
      new Date(2026, 2, 30, 12, 0),
      new Date(2026, 2, 28, 12, 0)
    ),
    "in 2 days",
    "spring-forward makes two calendar days only 47 hours"
  );
  assert.equal(
    formatRelativeTime(
      new Date(2026, 9, 25, 12, 0),
      new Date(2026, 9, 24, 12, 0)
    ),
    "tomorrow",
    "fall-back makes the next calendar day 25 hours away"
  );
  assert.equal(
    formatRelativeTime(
      new Date(2026, 9, 25, 23, 45),
      new Date(2026, 9, 25, 0, 15)
    ),
    "in 24h 30m",
    "a 25-hour day can contain a same-day duration over 24 hours"
  );
});
