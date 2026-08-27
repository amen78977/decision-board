# @decision-board/core

Provider-neutral runtime contracts and orchestration for Decision Board agents.

`@decision-board/core` lets an agent host run Decision Board without depending on Claude Code or on a particular model vendor. The host supplies diagnosis, role execution, user clarification, final rendering, and optional journal persistence. The runtime enforces the depth gate, targeted clarification, sealed-packet symmetry, contamination handling, and the requirement for an opposing view.

> **The runtime is an orchestration contract, not a claim that models are independent minds.** Structural isolation exists only when the host provides genuinely separate contexts or workers. A single-context fallback must be disclosed as simulated isolation.

## Install

```bash
npm install @decision-board/core
```

The package is ESM, requires Node.js 18 or later, and has no runtime dependencies. Provider SDKs are optional and remain the host's responsibility.

## Minimal host integration

```js
import { runDecisionBoard } from '@decision-board/core';

const packet = {
  decision: 'Launch now or run one more validation test',
  options: [
    { id: 'A', text: 'Launch now' },
    { id: 'B', text: 'Run one more validation test' }
  ],
  facts: ['40 paying users', '14 months of runway'],
  constraints: ['deadline is 2026-09-15'],
  resources_and_capabilities: ['two weeks and one engineer'],
  depth: 2,
  language: 'en'
};

const result = await runDecisionBoard({
  request: 'Should I launch now?',
  diagnose: async ({ clarifications }) => ({
    depth: 2,
    neutral_packet: clarifications.options ? packet : {
      ...packet,
      options: [],
      facts: [],
      constraints: [],
      resources_and_capabilities: []
    }
  }),
  askUser: async questions => Object.fromEntries(
    questions.map(question => [
      question.id,
      question.id === 'options' ? 'Launch now; test first' : 'unavailable'
    ])
  ),
  runRole: async ({ role, input }) => ({
    role,
    status: 'ok',
    output: { strongest_claim: `${role} received a sealed packet` }
  }),
  renderFinal: async ({ roles }) => `Reviewed ${roles.length} functions.`,
  options: { maxClarificationRounds: 2 }
});

console.log(result.clarification_status, result.final);
```

`askUser` is optional. If material information is missing and no asker is supplied, the runtime returns `status: "needs_clarification"` instead of guessing. The default budget is two rounds, and each batch contains at most six questions.

## Contracts

| Contract | What it protects |
|---|---|
| `neutral-packet.schema.json` | The sealed analysis input: decision, options, facts, constraints, resources, depth, and language. |
| `role-output.schema.json` | `ok`, `contaminated`, `failed`, and `unavailable` role states. |
| `clarification.schema.json` | One question with its reason, answer type, and sensitivity. |
| `clarification-batch.schema.json` | Lifecycle state, 3–6-question limit, and two-round limit. |

The runtime returns `clarification_status` as `complete`, `partial`, or `unavailable`. User answers are normalized to known question ids, control characters are removed, length is limited, and the neutral packet is rebuilt before analysis. Answers remain user-reported data; they are not treated as verified facts.

## Provider adapters

The package exports `createOpenAIRoleRunner()` for an injected OpenAI Responses client and `createAnthropicRoleRunner()` for an injected Anthropic Messages client. The adapters do not import an SDK, read API keys, or make network calls by themselves.

```js
import OpenAI from 'openai';
import { createOpenAIRoleRunner } from '@decision-board/core';

const runRole = createOpenAIRoleRunner({
  client: new OpenAI(),
  model: 'gpt-5.6',
  outputSchema: {
    type: 'object',
    properties: { strongest_claim: { type: 'string' } },
    required: ['strongest_claim'],
    additionalProperties: false
  }
});
```

The host owns credentials, consent, model selection, retries, retention, and external tools. See the repository's [`docs/RUNTIME.md`](https://github.com/amen78977/decision-board/blob/main/docs/RUNTIME.md) for the Anthropic example, lifecycle details, and provider boundaries.

## Local verification

```bash
node test/core.test.js
node test/providers.test.js
node benchmark/runner.js
```

The benchmark is deterministic and hand-authored. It tests orchestration invariants; it is not a measurement of model quality.

## License

MIT. See [`LICENSE`](./LICENSE).
