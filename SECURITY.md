# Security and privacy

## Scope

Decision Board is a local-first Claude Code plugin and prompt system. The repository itself does not add telemetry, analytics, remote storage, or network calls. Claude Code and the selected model provider still process the prompt according to their own terms; do not paste credentials, secrets, personal identifiers, or confidential material unless you have permission to do so.

The optional Pro service described in `docs/COMMERCIALIZATION.ar.md` is a future product boundary, not part of this repository. It must not be represented as already available, and it must require explicit opt-in before synchronising any decision content.

## Reporting a vulnerability

Please do not publish exploitable details in a normal issue. Use a private [GitHub Security Advisory](https://github.com/amen78977/decision-board/security/advisories/new) when available. Include the affected version, the surface where it runs, a minimal reproduction, and the security impact. Redact the decision text and replace private facts with placeholders.

If the private advisory flow is unavailable, open an issue with the title `[security] private contact requested` and do not include secrets or an exploit chain. The maintainer will move the discussion to a private channel where possible.

## Supported versions

Only the latest tagged release and the default branch receive security fixes. Because the plugin is distributed as source, users should report the exact cached version loaded by Claude Code.

| Version line | Status |
|---|---|
| `0.7.x` | Supported |
| `<0.7.0` | Upgrade recommended |

## Safety boundaries

Decision Board is a reasoning aid, not a professional adviser. It does not guarantee a correct decision and must not be marketed as a replacement for legal, medical, financial, or other regulated advice. The verifier can label a claim as unverified or doubtful; that label is not proof that the claim is false.

Contributions must preserve the local-first default, the symmetric context supplied to competing analysis, the explicit uncertainty fields, and the instruction that the user—not the model—owns the final decision.
