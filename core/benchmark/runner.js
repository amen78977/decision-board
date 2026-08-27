import assert from 'node:assert/strict';
import { assessClarification } from '../src/clarification.js';
import { runDecisionBoard } from '../src/runtime.js';
import { validateClarificationBatch } from '../src/validation.js';

const basePacket = {
  decision: 'Launch now or run one more validation test',
  options: [
    { id: 'A', text: 'Launch now' },
    { id: 'B', text: 'Run one more validation test' }
  ],
  facts: [
    'There are 40 paying users',
    'The current runway is 14 months',
    'The critical demand estimate is labelled unverified'
  ],
  constraints: ['The decision deadline is 2026-09-15'],
  resources_and_capabilities: ['Two weeks and one engineer are available'],
  depth: 3,
  language: 'en'
};

function incompletePacket(depth = 3) {
  return {
    ...basePacket,
    depth,
    options: [],
    facts: [],
    constraints: [],
    resources_and_capabilities: []
  };
}

function roleOk(role, output = {}) {
  return { role, status: 'ok', output };
}

async function caseNeedsQuestions() {
  let roleCalls = 0;
  const result = await runDecisionBoard({
    request: 'Should I make this high-impact launch decision?',
    diagnose: async () => ({ depth: 3, neutral_packet: incompletePacket() }),
    runRole: async () => { roleCalls += 1; return roleOk('advocate'); }
  });
  assert.equal(result.status, 'needs_clarification');
  assert.equal(result.clarification_status, 'partial');
  assert(result.questions.length >= 3 && result.questions.length <= 6);
  assert.equal(validateClarificationBatch(result.clarification).valid, true);
  assert.equal(roleCalls, 0);
}

async function caseCompleteNoQuestions() {
  const inputs = new Map();
  const result = await runDecisionBoard({
    request: 'Choose between the launch and validation options.',
    diagnose: async () => ({ depth: 2, neutral_packet: { ...basePacket, depth: 2 } }),
    runRole: async ({ role, input }) => {
      inputs.set(role, input);
      return roleOk(role);
    }
  });
  assert.equal(result.status, 'ok');
  assert.equal(result.clarification_status, 'complete');
  assert.equal(result.roles.length, 3);
  assert.equal(inputs.get('advocate'), inputs.get('opponent'));
  assert.equal(inputs.get('opponent'), inputs.get('verifier'));
}

async function caseSimpleDecision() {
  let asks = 0;
  let roles = 0;
  const result = await runDecisionBoard({
    request: 'What is 2 + 2?',
    diagnose: async () => ({ depth: 1, direct_response: '4', neutral_packet: null }),
    askUser: async () => { asks += 1; return {}; },
    runRole: async () => { roles += 1; return roleOk('advocate'); }
  });
  assert.equal(result.status, 'direct');
  assert.equal(result.final, '4');
  assert.equal(result.clarification_status, 'partial');
  assert.equal(asks, 0);
  assert.equal(roles, 0);
}

async function caseContaminatedRole() {
  const result = await runDecisionBoard({
    request: 'Choose option A or B.',
    diagnose: async () => ({ depth: 2, neutral_packet: { ...basePacket, depth: 2 } }),
    runRole: async ({ role }) => role === 'opponent'
      ? { role, status: 'contaminated', contaminated_input: true }
      : roleOk(role)
  });
  assert.equal(result.status, 'contaminated');
  assert.match(result.retry, /re-diagnose/);
}

async function casePacketSymmetry() {
  const inputs = new Map();
  const result = await runDecisionBoard({
    request: 'SECRET_FRAMING: I know option A is obviously best.',
    diagnose: async () => ({ depth: 3, neutral_packet: { ...basePacket } }),
    runRole: async ({ role, input }) => {
      inputs.set(role, input);
      return roleOk(role);
    }
  });
  assert.equal(result.status, 'ok');
  const analysisInputs = ['advocate', 'opponent', 'verifier', 'executor'].map(role => inputs.get(role));
  assert(analysisInputs.every(input => input === analysisInputs[0]));
  assert(!analysisInputs[0].includes('SECRET_FRAMING'));
}

async function caseCriticalFactBlocksFinal() {
  let verifierWasAvailable = false;
  const result = await runDecisionBoard({
    request: 'Should we launch based on the demand estimate?',
    diagnose: async () => ({ depth: 2, neutral_packet: { ...basePacket, depth: 2 } }),
    runRole: async ({ role }) => role === 'verifier'
      ? roleOk(role, { critical_fact_status: 'unverified' })
      : roleOk(role),
    renderFinal: async ({ roles }) => {
      const verifier = roles.find(role => role.role === 'verifier');
      verifierWasAvailable = verifier?.output?.critical_fact_status === 'unverified';
      return verifierWasAvailable ? 'blocked:critical-fact-unverified' : 'confident';
    }
  });
  assert.equal(result.final, 'blocked:critical-fact-unverified');
  assert.equal(verifierWasAvailable, true);
}

async function caseSensitiveRefusal() {
  let calls = 0;
  const result = await runDecisionBoard({
    request: 'Should I launch now or test first?',
    diagnose: async () => ({
      depth: 2,
      neutral_packet: {
        ...basePacket,
        depth: 2,
        constraints: [],
        resources_and_capabilities: []
      }
    }),
    askUser: async questions => {
      calls += 1;
      return Object.fromEntries(questions.map(question => [
        question.id,
        question.sensitivity === 'sensitive' ? 'unavailable' : `answer for ${question.id}`
      ]));
    },
    runRole: async ({ role }) => roleOk(role)
  });
  assert.equal(calls, 1);
  assert.equal(result.clarification_status, 'unavailable');
  assert.equal(result.status, 'ok');
  assert.equal(result.roles.length, 3);
}

async function caseTwoRoundCap() {
  let rounds = 0;
  const result = await runDecisionBoard({
    request: 'Should I choose one option?',
    diagnose: async () => ({
      depth: 3,
      neutral_packet: { ...basePacket, options: [{ id: 'A', text: 'Only option' }] }
    }),
    askUser: async questions => {
      rounds += 1;
      assert(questions.length >= 3 && questions.length <= 6);
      return Object.fromEntries(questions.map(question => [question.id, question.id === 'options' ? 'Only option' : `answer ${question.id}`]));
    },
    runRole: async ({ role }) => roleOk(role),
    options: { maxClarificationRounds: 2 }
  });
  assert.equal(rounds, 2);
  assert.equal(result.status, 'needs_clarification');
  assert.equal(result.clarification.round, 2);
}

async function caseNoOpponent() {
  const result = await runDecisionBoard({
    request: 'Should I choose A or B?',
    diagnose: async () => ({ depth: 2, neutral_packet: { ...basePacket, depth: 2 } }),
    runRole: async ({ role }) => role === 'opponent'
      ? { role, status: 'unavailable', error: 'provider unavailable' }
      : roleOk(role)
  });
  assert.equal(result.status, 'failed');
  assert.match(result.error, /opponent/);
}

async function caseNoRepeatedQuestions() {
  const first = assessClarification({
    prompt: 'Should I choose A or B?',
    depth: 3,
    facts: [],
    options: [],
    constraints: [],
    resources: []
  });
  const answered = Object.fromEntries(first.questions.map(question => [question.id, `answer ${question.id}`]));
  const second = assessClarification({
    prompt: 'Should I choose A or B?',
    depth: 3,
    facts: [],
    options: [],
    constraints: [],
    resources: [],
    clarifications: answered,
    round: 1
  });
  assert(second.questions.every(question => !Object.hasOwn(answered, question.id)));
}

const cases = [
  ['high-impact incomplete asks targeted questions', caseNeedsQuestions],
  ['complete decision does not ask', caseCompleteNoQuestions],
  ['level 1 is direct and non-interrogative', caseSimpleDecision],
  ['contaminated role stops run', caseContaminatedRole],
  ['analysis inputs are symmetric', casePacketSymmetry],
  ['critical fact reaches final gate', caseCriticalFactBlocksFinal],
  ['sensitive refusal remains explicit', caseSensitiveRefusal],
  ['clarification stops after two rounds', caseTwoRoundCap],
  ['opponent is mandatory', caseNoOpponent],
  ['questions are not repeated', caseNoRepeatedQuestions]
];

const startedAt = Date.now();
for (const [name, test] of cases) {
  await test();
  console.log(`PASS ${name}`);
}
console.log(`Benchmark passed: ${cases.length}/${cases.length} cases in ${Date.now() - startedAt}ms`);
