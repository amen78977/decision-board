'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const universal = fs.readFileSync(path.join(ROOT, 'standalone/UNIVERSAL.md'), 'utf8');
const universalAr = fs.readFileSync(path.join(ROOT, 'standalone/UNIVERSAL.ar.md'), 'utf8');
const adapters = fs.readFileSync(path.join(ROOT, 'docs/ADAPTERS.md'), 'utf8');

for (const [label, text] of [['UNIVERSAL.md', universal], ['UNIVERSAL.ar.md', universalAr]]) {
  assert(text.length > 2500, `${label} is unexpectedly short`);
  assert(/neutral packet|الحزمة المحايدة/i.test(text), `${label} must define a neutral packet`);
  assert(/final response|شكل الرد النهائي/i.test(text), `${label} must define the final response`);
  assert(/journal|الدفتر/i.test(text), `${label} must define persistence or fallback`);
  assert(/simulated|مُحاكى/i.test(text), `${label} must disclose sequential isolation`);
  assert(!/CLAUDE_PLUGIN_ROOT|\/plugin marketplace add|UserPromptSubmit/.test(text), `${label} must not require Claude Code hooks`);
}

for (const invariant of [
  'run_role(role, input)',
  'identical neutral packet',
  'user_prompt',
  'contaminated input',
  'private file',
  'Network access is opt-in',
]) {
  assert(adapters.includes(invariant), `ADAPTERS.md is missing invariant: ${invariant}`);
}

assert(!/required API|API key required/i.test(universal), 'Universal adapter must not require a provider API');
console.log('Universal contract: 3 surfaces and 6 portability invariants passed');
