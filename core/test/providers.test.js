import assert from 'node:assert/strict';
import { createAnthropicRoleRunner, createOpenAIRoleRunner } from '../src/providers.js';

const schema = {
  type: 'object',
  properties: { strongest_claim: { type: 'string' } },
  required: ['strongest_claim'],
  additionalProperties: false
};

let openAIRequest;
const openAIRunner = createOpenAIRoleRunner({
  client: {
    responses: {
      create: async body => {
        openAIRequest = body;
        return { id: 'resp_test', output_text: '{"strongest_claim":"test claim"}' };
      }
    }
  },
  model: 'gpt-test',
  outputSchema: schema,
  schemaName: 'role_output'
});
const openAIResult = await openAIRunner({ role: 'advocate', input: '{"decision":"A or B"}' });
assert.deepEqual(openAIResult, { role: 'advocate', status: 'ok', output: { strongest_claim: 'test claim' } });
assert.equal(openAIRequest.model, 'gpt-test');
assert.equal(openAIRequest.input[1].content, '{"decision":"A or B"}');
assert.equal(openAIRequest.text.format.type, 'json_schema');
assert.equal(openAIRequest.text.format.name, 'role_output');
assert.deepEqual(openAIRequest.text.format.schema, schema);

const fencedRunner = createOpenAIRoleRunner({
  client: { responses: { create: async () => ({ output_text: '```json\n{"ok":true}\n```' }) } },
  models: { verifier: 'gpt-verifier' }
});
const fenced = await fencedRunner({ role: 'verifier', input: '{}' });
assert.deepEqual(fenced, { role: 'verifier', status: 'ok', output: { ok: true } });

const openAIRefusal = createOpenAIRoleRunner({
  client: { responses: { create: async () => ({ status: 'incomplete', incomplete_details: { reason: 'content_filter' } }) } },
  model: 'gpt-test'
});
assert.deepEqual(await openAIRefusal({ role: 'opponent', input: '{}' }), {
  role: 'opponent', status: 'unavailable', error: 'OpenAI response was refused by the provider safety filter'
});

let anthropicRequest;
const anthropicRunner = createAnthropicRoleRunner({
  client: {
    messages: {
      create: async body => {
        anthropicRequest = body;
        return { id: 'msg_test', content: [{ type: 'text', text: '{"strongest_claim":"anthropic claim"}' }] };
      }
    }
  },
  models: { opponent: 'claude-test' },
  maxTokens: 512,
  systemPrompts: { opponent: 'Return the opposing role as JSON.' },
  outputSchema: schema
});
const anthropicResult = await anthropicRunner({ role: 'opponent', input: '{"decision":"A or B"}' });
assert.deepEqual(anthropicResult, { role: 'opponent', status: 'ok', output: { strongest_claim: 'anthropic claim' } });
assert.equal(anthropicRequest.model, 'claude-test');
assert.equal(anthropicRequest.max_tokens, 512);
assert.equal(anthropicRequest.messages[0].content, '{"decision":"A or B"}');
assert.equal(anthropicRequest.system, 'Return the opposing role as JSON.');
assert.equal(anthropicRequest.output_config.format.type, 'json_schema');
assert.deepEqual(anthropicRequest.output_config.format.schema, schema);

const anthropicRefusal = createAnthropicRoleRunner({
  client: { messages: { create: async () => ({ stop_reason: 'refusal', content: [] }) } },
  model: 'claude-test'
});
assert.deepEqual(await anthropicRefusal({ role: 'opponent', input: '{}' }), {
  role: 'opponent', status: 'unavailable', error: 'Anthropic response was refused by the provider safety system'
});

const malformed = createAnthropicRoleRunner({
  client: { messages: { create: async () => ({ content: [{ type: 'text', text: 'not json' }] }) } },
  model: 'claude-test'
});
const malformedResult = await malformed({ role: 'verifier', input: '{}' });
assert.equal(malformedResult.status, 'failed');
assert.match(malformedResult.error, /invalid JSON/);

console.log('Provider adapters: OpenAI Responses and Anthropic Messages contracts passed');
