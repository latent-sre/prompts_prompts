# Contributing

This repo is the canonical Copilot **token-reduction toolkit**. Keep it lean — it must
pass its own standard.

## Ground rules

1. **Follow the authoring standard.** Budgets and "right primitive" rules live in
   [`.github/skills/copilot-token-audit/references/authoring-standard.md`](.github/skills/copilot-token-audit/references/authoring-standard.md).
2. **Right primitive.** Don't add always-on content (`copilot-instructions.md`,
   `*.instructions.md`) for something that's only sometimes needed — make it a prompt
   file or put it in the skill's `references/`. See the
   [decision tree](.github/skills/copilot-token-audit/references/customization-architecture.md).
3. **Keep the skill self-contained.** Operational reference content goes in
   `.github/skills/copilot-token-audit/references/`; `docs/` is human-facing only.
4. **No secrets/PII** in any customization file (the example fixtures use obvious fakes).

## Before you open a PR

Run the deterministic gate locally:

```bash
python3 scripts/check_token_budgets.py
```

It checks every customization file against its budget, requires `applyTo` on
`*.instructions.md`, and flags secret-shaped strings (skips `examples/`). The same
script runs in CI via `.github/workflows/token-budget.yml` and **blocks the PR** on
failure. For nuanced review, run the `/token-review` prompt in VS Code.

## Ownership

See [`.github/CODEOWNERS`](.github/CODEOWNERS). Update it to your real owning team, and
set the `LICENSE` copyright holder to your organization.

## Scope

Token reduction only. Domain SRE prompts (incident, RCA, logs, IaC) are out of scope
here — propose those in their own repo/library.
