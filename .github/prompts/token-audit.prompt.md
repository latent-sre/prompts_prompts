---
description: Audit Copilot prompts/instructions/skills/chat modes for token waste and recommend fixes.
mode: agent
tools: ['search', 'codebase']
---

# /token-audit

Audit the target for GitHub Copilot **token waste** and recommend architecture
changes, token reductions, and improvements.

**Target** (in priority order):
1. Text I pasted below, if any.
2. The current selection (`#selection`) or active file (`#file`), if no paste.
3. The files/folder I name.

Use the `copilot-token-audit` skill's rubric and cost model:
- [rubric](../../skills/copilot-token-audit/references/token-reduction-rubric.md)
- [cost model](../../skills/copilot-token-audit/references/cost-model.md)
- [anti-patterns](../../skills/copilot-token-audit/references/anti-patterns.md)
- [architecture decision tree](../../skills/copilot-token-audit/references/customization-architecture.md)

Steps: inventory → classify primitive → score A–F → estimate savings → recommend.

Output exactly this structure, and be concise (you are a token-reduction tool):
1. **Inventory table** — file | type | always-on? | est. tokens (`chars/4`) | top issue
2. **Findings, ranked by impact** — severity, location, category, why, est. saving
3. **Recommended architecture changes**
4. **Concrete rewrites** — before → after for the top 3–5
5. **Quick-win checklist**

Rules: label token counts as estimates; preserve each customization's intent; flag
any secrets/PII (High severity); weight always-on waste above on-demand waste.
