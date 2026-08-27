# Contributing to Decision Board

## Before opening a pull request

Read `PROTOCOL.md` and the relevant agent or skill file first. The protocol is the source of truth; a shorter prompt is not an acceptable substitute if it weakens isolation, evidence labels, calibrated confidence, or the user’s ownership of the decision.

Run the complete local checks from the repository root:

```bash
node hooks/detector.test.js
bash -n scripts/validate.sh scripts/smoke.sh
bash scripts/validate.sh
```

If Claude Code is installed and authenticated, also run the behavioral smoke test described in `docs/INSTALL.md`. Do not include private decision content in a commit, issue, test fixture, or screenshot.

## Adding a detector case

Every field report should become a minimized, redacted test case when possible. Add the prompt and expected result to `hooks/detector.test.js`, explain why the case is a true or false trigger, and run the full suite. Include both the Arabic and English form when the same intent exists in both languages.

Prefer a small rule with a clear explanation over a large list of unrelated keywords. If a rule can affect a technical execution request, add a negative test for that request before merging it.

## Changing the protocol

Changes to `PROTOCOL.md`, `skills/decision-board/SKILL.md`, or `standalone/` are behavioral changes. Update the derived copies and the structural guards in `scripts/validate.sh`; then add or update an evaluation case under `evals/` if the expected output changes. Never claim that a model is independent merely because it runs in a separate subagent.

## Pull requests

Describe the user-visible behavior, the files changed, the tests run, and any known limitation. Keep commits focused. A pull request that changes the protocol should include an example of the old and new behavior with private facts replaced by placeholders.
