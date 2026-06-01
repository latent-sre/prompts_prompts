---
description: PR gate — check changed Copilot customizations against the token authoring standard.
mode: agent
tools: ['search', 'codebase', 'changes']
---

# /token-review

Act as a **review gate** for token bloat in Copilot customizations. Review the
**changed/added** customization files in the current diff (`#changes`), or the files
I name:

`copilot-instructions.md`, `*.instructions.md`, `*.prompt.md`, `*.chatmode.md`,
`*.agent.md`, `SKILL.md`, `AGENTS.md`.

Check each against the [authoring standard](../skills/copilot-token-audit/references/authoring-standard.md):
- Within its **token budget** (`chars/4`).
- Correct **primitive** ([decision tree](../skills/copilot-token-audit/references/customization-architecture.md)) —
  flag always-on content that should be on-demand.
- Has an **output constraint** where the standard requires one.
- No **secrets/PII** (see [rubric](../skills/copilot-token-audit/references/token-reduction-rubric.md) F).
- No obvious **anti-patterns** ([list](../skills/copilot-token-audit/references/anti-patterns.md)).

Output:
1. **Verdict:** ✅ PASS or ❌ CHANGES REQUESTED.
2. **Table:** file | budget | est. tokens | pass/fail | reason.
3. For each fail: the specific fix (and a rewritten snippet if quick).

Be terse. Only block on real budget/primitive/secret violations; note style nits
separately as non-blocking.
