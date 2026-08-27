# Contributing to Decision Board

## Before opening a pull request

Read `PROTOCOL.md` and the relevant agent or skill file first. The protocol is the source of truth; a shorter prompt is not an acceptable substitute if it weakens isolation, evidence labels, calibrated confidence, or the user’s ownership of the decision.

Run the complete local checks from the repository root:

```bash
node core/test/core.test.js
node core/test/providers.test.js
node core/benchmark/runner.js
node hooks/detector.test.js
node hooks/detector.integration.test.js
node scripts/universal-contract.test.js
node scripts/check-links.js
bash -n scripts/validate.sh scripts/smoke.sh scripts/doctor.sh scripts/full-plugin-test.sh
bash scripts/validate.sh
./scripts/full-plugin-test.sh
```

If Claude Code is installed and authenticated, also run the behavioral smoke test described in `docs/INSTALL.md`. Do not include private decision content in a commit, issue, test fixture, or screenshot.

## Adding a detector case

Every field report should become a minimized, redacted test case when possible. Add the prompt and expected result to `hooks/detector.test.js`, explain why the case is a true or false trigger, and run the full suite. Include both the Arabic and English form when the same intent exists in both languages.

Prefer a small rule with a clear explanation over a large list of unrelated keywords. If a rule can affect a technical execution request, add a negative test for that request before merging it.

## Changing the protocol

Changes to `PROTOCOL.md`, `skills/decision-board/SKILL.md`, or `standalone/` are behavioral changes. Update the derived copies and the structural guards in `scripts/validate.sh`; then add or update an evaluation case under `evals/` if the expected output changes. For clarification changes, preserve 3–6 high-value questions, the two-round cap, explicit unavailable/partial states, and neutral-packet rebuilding. Never claim that a model is independent merely because it runs in a separate subagent.

## Pull requests

Describe the user-visible behavior, the files changed, the tests run, and any known limitation. Keep commits focused. A pull request that changes the protocol should include an example of the old and new behavior with private facts replaced by placeholders. A provider adapter change must say whether the test used a fake client or a real authenticated provider; never report a fake-client test as live model validation.
