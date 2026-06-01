---
description: Rewrite a Copilot prompt/instruction/skill/chat mode into a leaner, lower-token version.
mode: agent
tools: ['search', 'codebase', 'editFiles']
---

# /token-refactor

Rewrite the target customization to use **fewer tokens while preserving intent**.

**Target:** my paste, else `#selection` / `#file`, else the file I name.

Apply the rules in:
- [rubric](../../skills/copilot-token-audit/references/token-reduction-rubric.md)
- [anti-patterns](../../skills/copilot-token-audit/references/anti-patterns.md)
- [authoring standard / budgets](../../skills/copilot-token-audit/references/authoring-standard.md)
- [architecture decision tree](../../skills/copilot-token-audit/references/customization-architecture.md)

Do this:
1. If content is in the **wrong primitive** (e.g., always-on but rarely needed),
   say so and produce the right artifact (scoped `*.instructions.md`, a prompt file,
   or a skill) instead of just trimming.
2. Otherwise rewrite to terse imperative bullets: drop filler, deduplicate, remove
   anything discoverable from code, add an output constraint if missing, and keep it
   within the relevant budget.
3. Remove any secrets/PII and replace with an env-var/secret-manager reference.

Output:
- **Rewritten file(s)** in a code block (ready to paste / save).
- **What changed & why** — 3–6 bullets.
- **Estimated savings** — before vs after est. tokens (`chars/4`), and note if the
  saving is always-on (per request) or on-demand.

Only edit files directly if I explicitly ask; otherwise just propose.
