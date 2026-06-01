---
name: copilot-token-audit
description: >-
  Audit GitHub Copilot customizations (custom instructions, prompt files, chat
  modes, skills) for token waste, then recommend architecture changes, token
  cuts, and improvements with estimated savings. Use when asked to audit,
  optimize, or reduce token / premium-request usage of Copilot prompts,
  instructions, skills, or chat modes.
---

# Copilot Token Audit

Find and fix token waste in Copilot customizations (VS Code) without losing capability;
produce a prioritized, quantified report. Be terse — model the behavior you recommend.

## When to use

Audit / optimize / "reduce tokens" for Copilot prompts, instructions, skills, or chat
modes; or decide which primitive content belongs in. Works on one pasted prompt or a
whole repo.

## Procedure

1. **Inventory.** Collect in-scope customizations:
   - Always-on: `**/.github/copilot-instructions.md`, `**/*.instructions.md`, `**/AGENTS.md`
   - On-demand: `**/.github/prompts/*.prompt.md`, `**/*.chatmode.md`,
     `**/.github/agents/*.agent.md`, `**/skills/**/SKILL.md`
   - Tool load: `**/.vscode/mcp.json`, `**/.vscode/settings.json`
   For each, estimate tokens (`chars/4`) and mark **always-on** vs **on-demand**.
   Always-on is charged on *every* request — weight it far more heavily.
2. **Classify the primitive.** Is each file in the right place? See
   [`references/customization-architecture.md`](references/customization-architecture.md).
   Always-on content that's only sometimes needed is the #1 waste → move it on-demand.
3. **Score A–F.** Apply [`references/token-reduction-rubric.md`](references/token-reduction-rubric.md),
   citing concrete lines; name the pattern from
   [`references/anti-patterns.md`](references/anti-patterns.md).
4. **Estimate savings** with [`references/cost-model.md`](references/cost-model.md). Separate
   per-request (always-on), per-invocation, and behavioral savings. Give ranges.
5. **Recommend & rewrite.** Architecture moves first, then before/after rewrites for the top wins.

## Report format (always use this structure)

1. **Inventory table** — file | type | always-on? | est. tokens | top issue
2. **Findings, ranked by impact** — severity (High/Med/Low), location, rubric category, why
   it costs tokens, estimated saving
3. **Recommended architecture changes**
4. **Concrete rewrites** — before → after for the top 3–5 findings
5. **Quick-win checklist** — the runtime habits from rubric category E that fit this codebase

## Rules

- Label all token counts as estimates (`chars/4`, ±~25%).
- Preserve each customization's intent; mark risky cuts "verify".
- Flag hardcoded secrets/PII (rubric F) as **High** severity.
- Judge "too big" against [`references/authoring-standard.md`](references/authoring-standard.md).
