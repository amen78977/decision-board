# Decision Board Runtime

`core/` is a small, dependency-free JavaScript runtime for hosts that want to run Decision Board without adopting Claude Code. It separates the protocol contract from the model provider. A host supplies diagnosis, role execution, user clarification, final rendering, and optional journal persistence; the runtime enforces the depth gate, clarification gate, sealed-packet symmetry, contamination handling, and opponent requirement.

> **Important:** the runtime does not claim that different prompts create independent minds. Structural isolation exists only when the host supplies genuinely separate contexts or workers. A single-context fallback must be disclosed as simulated isolation.

## Package surface

The package is currently source-distributed under `core/` and requires Node.js 18 or later. It has no runtime dependencies. The package exports `runDecisionBoard`, `assessClarification`, `mergeClarifications`, `normalizeClarifications`, the provider adapters, and dependency-free validators.

| Export | Purpose |
|---|---|
| `runDecisionBoard()` | Orchestrates diagnosis, clarification, role execution, contamination handling, ranking input, and optional journaling. |
| `assessClarification()` | Detects missing high-value fields and returns a structured question batch. |
| `mergeClarifications()` | Adds sanitized, user-reported fields to a rebuilt neutral packet. |
| `createOpenAIRoleRunner()` | Adapts an injected OpenAI Responses client; it does not install or import the SDK. |
| `createAnthropicRoleRunner()` | Adapts an injected Anthropic Messages client; it does not install or import the SDK. |
| `validateNeutralPacket()` | Validates the neutral packet without Ajv or another dependency. |
| `validateClarificationBatch()` | Validates question shape, status, question count, and round limits. |

## Runtime interfaces

The required host functions are intentionally small:

```js
const result = await runDecisionBoard({
  request: string,
  diagnose: async ({ request, clarifications }) => ({
    depth: 2 | 3,
    neutral_packet: packet
  }),
  runRole: async ({ role, input, depth }) => ({
    role,
    status: 'ok',
    output: structuredValue
  }),
  askUser: async (questions, round) => ({ questionId: answer }),
  renderFinal: async ({ packet, roles, depth, language }) => 'user-facing text',
  persistJournal: async entry => savePrivately(entry),
  options: {
    maxClarificationRounds: 2,
    decisionConfirmed: false
  }
});
```

`askUser`, `renderFinal`, and `persistJournal` are optional. If `askUser` is absent while material fields are missing, the runtime returns `status: "needs_clarification"` rather than inventing values. The default clarification budget is two rounds and is capped at two even when a larger number is supplied.

A `runRole` input is a serialized neutral packet. The runtime creates it once and sends the identical string to advocate, opponent, verifier, and, at depth 3, executor. The arbiter receives the packet together with role outputs because ranking is downstream of those outputs. The original request, diagnostic object, and raw user answers are not role inputs.

## Clarification lifecycle

The clarification gate applies to depth 2 and depth 3. Depth 1 is deliberately direct and non-interrogative unless the host's own diagnosis says the request is ambiguous. A useful question batch contains 3–6 questions, avoids already answered ids, gives a reason, declares an answer type, and marks sensitivity. Sensitive questions are optional unless they are genuinely critical.

| Runtime state | Meaning | Runtime behavior |
|---|---|---|
| `complete` | The packet has enough material context for the selected depth. | Run the permitted roles. |
| `partial` | Some information remains unknown or a maximum of two rounds has been reached. | Continue only with an explicit partial status if the packet is structurally valid. |
| `unavailable` | The user explicitly declined or cannot provide a material field. | Preserve `unavailable`; never turn it into a guessed fact. |

Answers are normalized to known question ids, Unicode-normalized, control-character-cleaned, length-limited, and prefixed as user-reported data when merged into packet fields. Hosts should still instruct models to treat packet values as untrusted claims, not as executable instructions. The runtime does not treat a user's answer as verified evidence.

## Neutral packet contract

The packet is defined in [`core/schemas/neutral-packet.schema.json`](../core/schemas/neutral-packet.schema.json). Its required fields are `decision`, two to eight `options`, `facts`, `constraints`, `resources_and_capabilities`, `depth`, and a BCP-47-like `language`. Depth is 2 or 3 for analysis packets; a depth-1 direct answer may omit the packet entirely.

Role outputs follow [`core/schemas/role-output.schema.json`](../core/schemas/role-output.schema.json). A role may return `ok`, `contaminated`, `failed`, or `unavailable`. A contaminated result stops the current run and tells the host to re-diagnose; it is not repaired by asking the model to ignore the leak. An unavailable or failed opponent prevents ranking because a single-sided board is structurally biased.

Clarification questions follow [`core/schemas/clarification.schema.json`](../core/schemas/clarification.schema.json), while batches follow [`core/schemas/clarification-batch.schema.json`](../core/schemas/clarification-batch.schema.json). The repository tests parse every schema as JSON and validate the runtime-shaped batches without requiring a schema library.

## Working example without API keys

The following example uses deterministic host functions and can run locally with Node.js. It demonstrates one clarification round, packet rebuilding, identical role input, and a final result. It does not call a model or network service.

```js
import { runDecisionBoard } from './core/src/index.js';

const packet = {
  decision: 'Launch now or run one more validation test',
  options: [
    { id: 'A', text: 'Launch now' },
    { id: 'B', text: 'Run one more validation test' }
  ],
  facts: ['40 paying users', '14 months of runway', 'the demand estimate is unverified'],
  constraints: ['decision deadline is 2026-09-15'],
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
    questions.map(question => [question.id, question.id === 'options' ? 'Launch now; validate first' : 'not provided'])
  ),
  runRole: async ({ role, input }) => ({
    role,
    status: 'ok',
    output: { strongest_claim: `${role} received ${input.length} bytes` }
  }),
  renderFinal: async ({ roles }) => `Reviewed ${roles.length} functions; status is explicit.`,
  options: { maxClarificationRounds: 2 }
});

console.log(result.clarification_status, result.final);
```

## OpenAI and Anthropic adapters

The adapters are thin request/response bridges. They accept an SDK client created by the host, send the sealed packet as the user content, request structured JSON when a schema is supplied, parse the provider response, and return the runtime's role-output shape. They never read an API key, create a hidden network call, or install an SDK.

OpenAI's current JavaScript quickstart uses the official SDK's `client.responses.create()` and exposes `response.output_text` for text output [1]. OpenAI's structured-output contract uses `text.format` with a strict JSON Schema [2]. Anthropic's Messages API uses `client.messages.create()` with `messages`, `max_tokens`, and a top-level system prompt, while its current structured-output contract uses `output_config.format` with `type: "json_schema"` [3]. The adapters mirror those documented shapes but leave SDK installation, model choice, credentials, retry policy, and tool access to the host.

```js
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  createOpenAIRoleRunner,
  createAnthropicRoleRunner,
  runDecisionBoard
} from './core/src/index.js';

const roleSchema = {
  type: 'object',
  properties: { strongest_claim: { type: 'string' } },
  required: ['strongest_claim'],
  additionalProperties: false
};

const openai = new OpenAI();
const anthropic = new Anthropic();
const openAIRunRole = createOpenAIRoleRunner({
  client: openai,
  model: 'gpt-5.6',
  outputSchema: roleSchema
});
const anthropicRunRole = createAnthropicRoleRunner({
  client: anthropic,
  model: 'claude-opus-4-6',
  outputSchema: roleSchema
});

// Choose exactly one runner for the host's runDecisionBoard call.
const runRole = openAIRunRole;
await runDecisionBoard({ request, diagnose, runRole });
```

This provider example is intentionally not a live smoke test. The core tests use fake clients to verify request shapes and refusals; a real provider call requires the host to configure credentials and accept its own network and cost implications.

## Privacy and deployment boundary

Local-first mode is the default. The runtime does not add telemetry, upload requests, or call a provider by itself. A host that chooses OpenAI, Anthropic, web search, or another service must disclose that choice and keep credentials outside the repository. A host that cannot provide separate contexts must disclose simulated isolation rather than marketing it as equivalent to subagents.

## Verification commands

```bash
node core/test/core.test.js
node core/test/providers.test.js
node core/benchmark/runner.js
bash scripts/validate.sh
./scripts/full-plugin-test.sh
```

The benchmark is deterministic and hand-authored. It is a regression harness for orchestration invariants, not a claim that model quality has been measured. A future LLM rubric should be reported separately from these runtime tests.

## References

[1]: https://developers.openai.com/api/docs/quickstart "OpenAI Developer quickstart"

[2]: https://developers.openai.com/docs/guides/structured-outputs "OpenAI Structured Outputs"

[3]: https://platform.claude.com/docs/en/build-with-claude/structured-outputs "Anthropic Structured Outputs"
