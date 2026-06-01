---
name: copilot-token-audit
description: >-
  Audit GitHub Copilot customizations (custom instructions, prompt files, chat
  modes, and skills) for token waste, then recommend architecture changes, token
  reductions, and quality improvements with estimated savings. Use when the user
  asks to audit, optimize, reduce token/premium-request usage of, or "trim" their
  Copilot prompts, instructions, skills, or chat modes — for one file, a whole
  repo, or pasted loose content.
---

# Copilot Token Audit

Analyze GitHub Copilot customization files and produce a prioritized, quantified
report of how to cut token usage without losing capability. Optimized for
VS Code + GitHub Copilot.

## When to use this skill

Trigger when the user wants to:

- Audit / review / optimize / "reduce tokens" for Copilot prompts, instructions,
  skills, or chat modes.
- Decide whether content belongs in an instruction, a prompt file, a skill, or a
  chat mode (architecture).
- Trim a bloated `copilot-instructions.md` or a verbose prompt.

If the user only pasted one loose prompt, audit just that. If they point at a repo
or folder, inventory all customization files first.

## Inputs you may receive

- A single file or pasted text (most common for loose, non-repo prompts).
- A repo / folder — collect every customization file (see Step 1).
- A PR diff — for gating, prefer the `/token-review` prompt instead.

## Procedure

1. **Inventory.** Find every Copilot customization in scope:
   - Always-on: `**/.github/copilot-instructions.md`, `**/*.instructions.md`,
     `**/AGENTS.md`
   - On-demand: `**/.github/prompts/*.prompt.md`,
     `**/.github/chatmodes/*.chatmode.md`, `**/.github/agents/*.agent.md`,
     `**/skills/**/SKILL.md`
   - VS Code config: `**/.vscode/settings.json`, `**/.vscode/mcp.json` (tool/MCP load)
   For each, estimate size in tokens (`≈ characters / 4`) and mark **always-on**
   vs **on-demand**. Always-on tokens are charged on *every* request — weight them
   far more heavily.

2. **Classify the primitive.** For each file, decide whether it is in the right
   place using [`../../docs/customization-architecture.md`](../../docs/customization-architecture.md). Always-on
   content that is only sometimes relevant is the #1 source of waste — recommend
   moving it to a prompt file or skill (progressive disclosure).

3. **Score against the rubric.** Apply `references/token-reduction-rubric.md`
   categories A–F to every file. Cite concrete lines. Use
   `references/anti-patterns.md` to name the specific pattern and show the fix.

4. **Estimate savings.** Use `references/cost-model.md`. Separate **per-request
   always-on savings** (highest value) from **per-invocation** and **behavioral**
   savings. Give ranges, not false precision (the `chars/4` estimate is directional).

5. **Recommend & rewrite.** Produce architecture moves first, then concrete
   before/after rewrites for the biggest wins.

## Report format (always use this structure)

1. **Inventory table** — file | type | always-on? | est. tokens | top issue.
2. **Findings, ranked by impact** — each: severity (High/Med/Low), location,
   rubric category, why it costs tokens, estimated savings.
3. **Recommended architecture changes** — primitive moves (e.g., "split this
   always-on file into 2 `applyTo`-scoped files"; "convert this 1.2k-token prompt
   into a skill with on-demand `references/`").
4. **Concrete rewrites** — `before` → `after` for the top 3–5 findings.
5. **Quick-win checklist** — the runtime habits from `../../docs/cheat-sheet.md`
   relevant to this codebase.

## Rules

- Never invent token counts you didn't estimate; label estimates as estimates.
- Preserve behavior: every cut must keep the customization's intent. If a cut is
  risky, mark it "verify".
- Flag any hardcoded secrets/PII you find (rubric category F) — security + token cost.
- Be concise in your own output; you are a token-reduction tool — model the behavior.

## Bundled references (load on demand)

- `references/token-reduction-rubric.md` — the scored A–F checklist.
- `references/cost-model.md` — how Copilot token cost works.
- `references/anti-patterns.md` — concrete bad→good snippets.
- `../../docs/customization-architecture.md` — primitive decision tree.
- `../../docs/authoring-standard.md` — token budgets used to judge "too big".
