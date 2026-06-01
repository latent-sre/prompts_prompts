# GitHub Copilot Token-Reduction Guide (SRE)

A practical, prioritized guide to cutting Copilot token / premium-request usage in
VS Code — without losing capability. Ordered by impact-per-effort.

> Sources are listed at the end. Numbers are directional guidance, not exact billing.

## The five levers (highest impact first)

### 1. Shrink always-on context
`copilot-instructions.md` and matching `*.instructions.md` are injected on **every**
request. A 400-token file across 1,000 requests/month ≈ 400k input tokens before
anyone types.
- Keep `copilot-instructions.md` tiny (budget: ≤ ~500 tokens — see
  [authoring-standard.md](authoring-standard.md)).
- Delete filler, praise, and anything discoverable from the repo.
- Split path-specific rules into `applyTo`-scoped `*.instructions.md`.

### 2. Put the right content in the right primitive
Move occasionally-needed always-on content into **prompt files** and **skills**
(progressive disclosure — free until invoked). See
[customization-architecture.md](customization-architecture.md). This usually beats
every other optimization because it converts per-request cost into per-use cost.

### 3. Constrain output
Output tokens cost **~5× input**. Add output limits to generative customizations:
- "Code only, no explanation unless asked." → ~40–70% output savings on code tasks.
- "Answer in bullets; no preamble." / "Return only the diff."

### 4. Scope retrieval and tools
- Use `#file` / `#selection` instead of `@workspace` when the answer is local;
  `@workspace` triggers broad repo-index retrieval.
- Give chat modes / agents the **minimum tool set**. Each enabled MCP server adds
  ~100–500 tokens **per agent step**.

### 5. Behavioral discipline
- Start a **fresh chat** per problem (history is re-sent every turn).
- **Ask mode** for simple questions (~60–90% cheaper than Agent mode); reserve Agent
  mode for true multi-step work.
- Default to **Auto / standard model**; pin premium only when complexity justifies it.
- **Close unused editor tabs** (auto-included as context).
See the printable [cheat-sheet.md](cheat-sheet.md).

## Content-exclusion checklist
Reduce what Copilot can pull into context (repo/org settings + `.gitignore`-aware
indexing). Exclude generated and bulky paths:
- `node_modules/`, `vendor/`, `dist/`, `build/`, `out/`, `.next/`, `target/`
- generated code, `*.lock`/lockfiles, `*.min.*`
- `logs/`, `*.log`, large data files (`*.csv`, `*.parquet`, fixtures, snapshots)
- secrets/config you never want sent to the model

## MCP / tool-inventory checklist
- List enabled MCP servers (`.vscode/mcp.json` / settings) — disable any you don't use.
- Audit each chat mode/agent `tools:` list; remove tools the persona never needs.
- Prefer one task-appropriate server over many "just in case" servers.

## Quick wins (do these first)
1. Add "Code only, no explanation unless asked." to instructions.
2. Trim `copilot-instructions.md` to durable, non-discoverable bullets.
3. Split path rules into `applyTo` files.
4. Disable unused MCP servers and trim chat-mode tool lists.
5. Add content exclusions for generated/bulky paths.
6. Teach the team the [cheat-sheet](cheat-sheet.md) habits.

## How to run the audit
- One file / pasted prompt: `/token-audit` (or `/token-refactor` to rewrite).
- Whole repo, interactive: select the **Token Optimizer** chat mode.
- PR gate: `/token-review`.
- Prove the savings: [measuring-savings.md](measuring-savings.md).

## Sources
- [Improving token efficiency in GitHub Agentic Workflows — GitHub Blog](https://github.blog/ai-and-ml/github-copilot/improving-token-efficiency-in-github-agentic-workflows/)
- [github-copilot-token-optimization (techniques)](https://github.com/olivomarco/github-copilot-token-optimization)
- [Copilot token usage & cost control — Simform Engineering](https://medium.com/simform-engineering/github-copilot-token-usage-explained-with-practical-cost-control-03062b15ecb0)
- [VS Code — Copilot customization docs](https://code.visualstudio.com/docs/copilot/copilot-customization)
- [5 tips for writing better custom instructions — GitHub Blog](https://github.blog/ai-and-ml/github-copilot/5-tips-for-writing-better-custom-instructions-for-copilot/)
