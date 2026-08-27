'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const detector = path.join(__dirname, 'decision-detector.js');

function run(payload) {
  return spawnSync(process.execPath, [detector], {
    input: payload,
    encoding: 'utf8',
    timeout: 5000,
  });
}

const decision = run(JSON.stringify({ prompt: 'Can you help me decide whether to take this offer?' }));
assert.strictEqual(decision.status, 0, 'decision prompt must exit cleanly');
assert.match(decision.stdout, /<decision-board-trigger>/, 'decision prompt must emit the trigger');
assert.match(decision.stdout, /سؤال عن قرار/, 'decision prompt must identify the decision kind');
assert.strictEqual(decision.stderr, '', 'decision prompt must not write diagnostics to stderr');

const technical = run(JSON.stringify({ prompt: 'I have decided to run the migration' }));
assert.strictEqual(technical.status, 0, 'technical prompt must exit cleanly');
assert.strictEqual(technical.stdout, '', 'technical execution intent must stay silent');

const malformed = run('not-json');
assert.strictEqual(malformed.status, 0, 'malformed input must fail open');
assert.strictEqual(malformed.stdout, '', 'malformed input must stay silent');
assert.strictEqual(malformed.stderr, '', 'malformed input must stay silent on stderr');

const wrongShape = run(JSON.stringify({ message: { content: 'Should I launch now?' } }));
assert.strictEqual(wrongShape.status, 0, 'unknown input shape must exit cleanly');
assert.strictEqual(wrongShape.stdout, '', 'unknown input shape must stay silent');

console.log('Hook integration: 4/4 scenarios passed');
