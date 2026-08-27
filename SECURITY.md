# Security and privacy

## Scope

Decision Board is a local-first Claude Code plugin, prompt system, and provider-neutral runtime. The repository itself does not add telemetry, analytics, remote storage, or network calls. The optional OpenAI and Anthropic adapters call a provider only when the host injects an SDK client and explicitly invokes the runtime; they do not read keys or make hidden requests. Claude Code and the selected model provider still process the prompt according to their own terms; do not paste credentials, secrets, personal identifiers, or confidential material unless you have permission to do so.

The optional Pro service described in `docs/COMMERCIALIZATION.ar.md` is a future product boundary, not part of this repository. It must not be represented as already available, and it must require explicit opt-in before synchronising any decision content.

## Reporting a vulnerability

Please do not publish exploitable details in a normal issue. Use a private [GitHub Security Advisory](https://github.com/amen78977/decision-board/security/advisories/new) when available. Include the affected version, the surface where it runs, a minimal reproduction, and the security impact. Redact the decision text and replace private facts with placeholders.

If the private advisory flow is unavailable, open an issue with the title `[security] private contact requested` and do not include secrets or an exploit chain. The maintainer will move the discussion to a private channel where possible.

## Supported versions

Only the latest tagged release and the default branch receive security fixes. Because the plugin is distributed as source, users should report the exact cached version loaded by Claude Code.

| Version line | Status |
|---|---|
| `0.10.x` | Supported |
| `0.9.x` | Upgrade recommended |
| `<0.9.0` | Unsupported; upgrade required |

## Runtime data boundary

The clarification runtime treats answers as untrusted data. It accepts known question ids only, removes control characters, limits answer length, and rebuilds a neutral packet before analysis. It does not treat a user answer as verified evidence. Hosts must not concatenate the original prompt, diagnostic notes, or raw answer objects into role inputs. A provider response containing contamination must stop the run rather than be repaired by an instruction to ignore it.

If a host enables a provider adapter, the host owns API keys, consent, retention, retries, model selection, and network access. Keep keys in environment or a secret manager, never in this repository, benchmark fixtures, logs, or journal entries. A real provider smoke test must be run only with an intentionally configured account and must not be described as a local or no-network test.

## Safety boundaries

Decision Board is a reasoning aid, not a professional adviser. It does not guarantee a correct decision and must not be marketed as a replacement for legal, medical, financial, or other regulated advice. The verifier can label a claim as unverified or doubtful; that label is not proof that the claim is false.

Contributions must preserve the local-first default, the symmetric context supplied to competing analysis, the explicit uncertainty fields, and the instruction that the user—not the model—owns the final decision.
