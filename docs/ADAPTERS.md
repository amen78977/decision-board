# Universal host adapters

Decision Board has one protocol and several host adapters. The protocol defines the reasoning contract; an adapter only decides how to provide the prompt, isolated roles, memory, and optional tools.

## Choose the smallest compatible surface

| Host capability | Recommended entry point | What the host must preserve |
|---|---|---|
| Claude Code plugin, hooks, agents, commands | Install the repository plugin | The six-agent inventory, identical neutral packet, hook contract, and `/decide`/`/review`. |
| Agent framework with subagents | Paste [`standalone/UNIVERSAL.md`](../standalone/UNIVERSAL.md) into the coordinator and map `run_role` to the framework's subagent call | Each analysis role receives the exact same sealed packet and no previous role output. |
| Single agent with tools | Paste the universal adapter and implement `run_role` as a separate fresh context when possible | If fresh contexts are unavailable, label isolation as simulated. |
| Plain chat or copilot | Paste [`standalone/UNIVERSAL.md`](../standalone/UNIVERSAL.md) or [`standalone/UNIVERSAL.ar.md`](../standalone/UNIVERSAL.ar.md) | Run the phases in order, keep fields structured, and disclose sequential rather than structural isolation. |

## Host-neutral request envelope

A host may wrap the user's message in this envelope. The envelope is descriptive rather than a required API, so it can be mapped to OpenAI, Anthropic, Gemini, local models, LangGraph, CrewAI, AutoGen, or a custom orchestrator without changing the protocol:

```json
{
  "protocol": "decision-board",
  "protocol_version": "1",
  "event": "decision.request",
  "request_id": "host-generated-id",
  "user_prompt": "the original request",
  "locale": "ar",
  "capabilities": {
    "independent_subagents": true,
    "read_private_files": true,
    "write_private_files": true,
    "external_fact_tools": false
  }
}
```

The adapter must not send `user_prompt` to analysis roles. The coordinator sends the prompt only to diagnosis, then sends the resulting `neutral_packet` byte-for-byte to the permitted analysis roles.

## Minimal adapter interface

An implementation can expose only these operations:

```text
run_role(role, input) -> structured_output
run_parallel(roles, identical_input) -> structured_outputs
read_journal(path) -> text | unavailable
write_journal(path, entry) -> success | unavailable
render_final(structured_outputs, user_language) -> <= 18 lines
```

The role identifiers are implementation details. A host may call them functions, tools, graph nodes, workers, or prompts. The user-facing response must announce functions rather than internal role names.

## Required orchestration invariants

The adapter is correct only if it preserves the following invariants:

1. Diagnosis is the only phase that sees the original user wording.
2. Advocate, opponent, verifier, and executor receive the same neutral packet. Executor is used only at depth 3.
3. The opponent is never run without the advocate.
4. A contaminated input stops the affected role and causes a clean re-diagnosis; it is not handled with an instruction to ignore the leak.
5. The verifier result is available to the final ranker before claims are ranked. A doubtful critical fact blocks a confident recommendation.
6. A single-context fallback says that isolation is simulated and never markets itself as equivalent to independent subagents.
7. A journal entry is written only after the user confirms a decision they actually made. Confidence and prediction are recorded before the outcome.

## Capability declaration

Every adapter should be able to answer these questions in its own logs or documentation:

| Question | Valid answer example |
|---|---|
| Is role isolation structural? | `yes`, or `no — sequential fallback`. |
| Can the host persist a journal? | `private file`, `host memory`, or `unavailable`. |
| Can facts be externally checked? | `web tool enabled`, or `unavailable`. |
| Where is the user-facing language chosen? | `from the decision sentence`, never from a hidden default. |
| What happens when a role fails? | `function missing` is disclosed in `📋`; no silent substitution. |

## Security boundary

A generic adapter must not add telemetry, upload the user's raw decision, or call an external service merely because the host supports it. Network access is opt-in and should be limited to fact verification or an explicitly configured paid service. The local-first mode remains usable without an account, API key, or central server.

## Examples by integration style

### Prompt-only chat

Paste the universal file into system instructions. When a level 2 or 3 decision arrives, produce the neutral packet, then run the phases as clearly labelled internal sections. Do not pretend that later sections are independent contexts.

### Framework with subagents

Create one coordinator node and four worker nodes. Give the same serialized neutral packet to the advocate, opponent, verifier, and, at depth 3, executor. Store only the coordinator's diagnostic object separately. Join outputs at the final ranking node.

### Tool-using agent

Expose `run_role` as a tool that accepts a role label and packet. Reject calls containing the original prompt, diagnostic fields, or another role's output. If the host cannot enforce this at the tool boundary, use the prompt-only fallback and disclose the weaker isolation.

### Claude Code

Use the repository plugin for the native hook, six agent files, `/decide`, and `/review`. Use the universal file only when embedding the protocol into another Claude-compatible agent or when the plugin host is unavailable.
